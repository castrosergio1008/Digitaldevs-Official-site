import { site } from '@/lib/site'
import type { LeadRecord, LeadSource } from './stores'

/** Outcome of a notification attempt across the configured channels. */
export interface NotifyResult {
  emailed: boolean
  whatsapped: boolean
}

/**
 * Sends the lead notification to the team. Implementations must not throw for
 * expected upstream failures; the route treats a failed notification as
 * non-fatal because the lead is already persisted.
 */
export interface LeadNotifier {
  notify(lead: LeadRecord): Promise<NotifyResult>
}

/** Default no-op notifier used when notifications are disabled. */
export class NullNotifier implements LeadNotifier {
  async notify(): Promise<NotifyResult> {
    return { emailed: false, whatsapped: false }
  }
}

/** Optional secondary channel: Resend (requires a verified domain). */
export const DEFAULT_RESEND_FROM = 'Leads <leads@digitaldevs.co>'
export const RESEND_USER_AGENT = 'digitaldevs-leads/1.0'
export const GMAIL_SMTP_HOST = 'smtp.gmail.com'
export const GMAIL_SMTP_PORT = 465

/** Outgoing notification calls must never hang the request. */
export const NOTIFY_TIMEOUT_MS = 10_000
export const DEFAULT_WHATSAPP_API_VERSION = 'v21.0'
export const DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE = 'es'

/**
 * Email notification through the Resend API. The request carries the lead
 * details to the business inbox; nothing is logged here.
 */
export class ResendNotifier implements LeadNotifier {
  private readonly apiKey: string
  private readonly from: string
  private readonly to: string
  private readonly fetchImpl: typeof fetch

  constructor(
    apiKey: string,
    from: string,
    to: string,
    fetchImpl: typeof fetch = fetch,
  ) {
    this.apiKey = apiKey
    this.from = from
    this.to = to
    this.fetchImpl = fetchImpl
  }

  async notify(lead: LeadRecord): Promise<NotifyResult> {
    const { subject, text, html } = buildLeadEmail(lead)
    const response = await this.fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': RESEND_USER_AGENT,
      },
      body: JSON.stringify({
        from: this.from,
        to: [this.to],
        subject,
        text,
        html,
      }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    })

    if (!response.ok) {
      await response.text().catch(() => '')
      throw new Error(`Resend responded with status ${response.status}`)
    }

    return { emailed: true, whatsapped: false }
  }
}

/** Minimal transporter shape so the notifier can be tested without nodemailer. */
export interface MailMessage {
  from: string
  to: string
  subject: string
  text: string
  html: string
}

export interface MailTransporter {
  sendMail(message: MailMessage): Promise<unknown>
}

/**
 * Primary email notifier: Nodemailer over Gmail's SMTP with an App Password.
 * This is the main channel for Digital-devs because the client has no domain
 * to verify in Resend (design doc section 4.3, plan B promoted to primary).
 */
export class GmailNotifier implements LeadNotifier {
  private readonly transporter: MailTransporter
  private readonly from: string
  private readonly to: string

  constructor(transporter: MailTransporter, from: string, to: string) {
    this.transporter = transporter
    this.from = from
    this.to = to
  }

  async notify(lead: LeadRecord): Promise<NotifyResult> {
    const { subject, text, html } = buildLeadEmail(lead)
    await this.transporter.sendMail({
      from: this.from,
      to: this.to,
      subject,
      text,
      html,
    })
    return { emailed: true, whatsapped: false }
  }
}

/**
 * Optional WhatsApp notification through the Meta Cloud API. It sends an
 * approved template message (proactive notification), so the client must
 * configure a template whose body variables are, in order: name, contact,
 * source and date. Disabled by default (`LEAD_NOTIFY_WHATSAPP_ENABLED=false`).
 */
export class WhatsAppNotifier implements LeadNotifier {
  private readonly accessToken: string
  private readonly phoneNumberId: string
  private readonly to: string
  private readonly templateName: string
  private readonly templateLanguage: string
  private readonly apiVersion: string
  private readonly fetchImpl: typeof fetch

  constructor(
    accessToken: string,
    phoneNumberId: string,
    to: string,
    templateName: string,
    templateLanguage: string = DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE,
    apiVersion: string = DEFAULT_WHATSAPP_API_VERSION,
    fetchImpl: typeof fetch = fetch,
  ) {
    this.accessToken = accessToken
    this.phoneNumberId = phoneNumberId
    this.to = to
    this.templateName = templateName
    this.templateLanguage = templateLanguage
    this.apiVersion = apiVersion
    this.fetchImpl = fetchImpl
  }

  async notify(lead: LeadRecord): Promise<NotifyResult> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`
    const response = await this.fetchImpl(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.to,
        type: 'template',
        template: {
          name: this.templateName,
          language: { code: this.templateLanguage },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: lead.name },
                { type: 'text', text: lead.contact },
                { type: 'text', text: sourceLabel(lead.source) },
                { type: 'text', text: formatLeadDate(lead.createdAt) },
              ],
            },
          ],
        },
      }),
      signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
    })

    if (!response.ok) {
      await response.text().catch(() => '')
      throw new Error(`WhatsApp responded with status ${response.status}`)
    }

    return { emailed: false, whatsapped: true }
  }
}

/**
 * Fans a notification out to every configured channel. A failing channel is
 * isolated so the others still run; the result reports what succeeded.
 */
export class CompositeNotifier implements LeadNotifier {
  private readonly notifiers: LeadNotifier[]

  constructor(notifiers: LeadNotifier[]) {
    this.notifiers = notifiers
  }

  async notify(lead: LeadRecord): Promise<NotifyResult> {
    let emailed = false
    let whatsapped = false

    for (const notifier of this.notifiers) {
      try {
        const result = await notifier.notify(lead)
        emailed = emailed || result.emailed
        whatsapped = whatsapped || result.whatsapped
      } catch (error) {
        // Log only non-PII metadata; the lead id is a random UUID.
        console.error('[leads] notification channel failed', {
          leadId: lead.id,
          error: error instanceof Error ? error.message : 'unknown',
        })
      }
    }

    return { emailed, whatsapped }
  }
}

/** Human-readable label for the lead source, used in the email body. */
export function sourceLabel(source: LeadSource): string {
  switch (source) {
    case 'form':
      return 'Formulario del chat'
    case 'detection':
      return 'Detección automática'
    case 'chip':
      return 'Chip de contacto'
    default:
      return source
  }
}

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  timeZone: 'America/Bogota',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

/** Formats a date in Colombian local time (UTC-5), e.g. `2026-11-13 14:32 (UTC-5)`. */
export function formatLeadDate(date: Date): string {
  const parts = DATE_FORMATTER.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? ''
  return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')} (UTC-5)`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Builds the notification subject and bodies from the persisted lead. */
export function buildLeadEmail(lead: LeadRecord): { subject: string; text: string; html: string } {
  const method = lead.method === 'whatsapp' ? 'WhatsApp' : 'Email'
  const source = sourceLabel(lead.source)
  const date = formatLeadDate(lead.createdAt)
  const context = lead.context?.trim() || 'Sin resumen.'

  const subject = 'Nuevo lead del chat de Digital-devs'

  const text = [
    'Nuevo lead del chat de Digital-devs',
    '',
    `Nombre:      ${lead.name}`,
    `Contacto:   ${lead.contact}`,
    `Método:      ${method}`,
    `Origen:      ${source}`,
    `Fecha:       ${date}`,
    `Resumen:     ${context}`,
    '',
    'Responde por este mismo correo o abre el contacto en WhatsApp.',
  ].join('\n')

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1f2933; line-height: 1.5;">
      <h2 style="margin: 0 0 12px;">Nuevo lead del chat de Digital-devs</h2>
      <table style="border-collapse: collapse;">
        <tr><td style="padding: 2px 12px 2px 0; color: #52606d;">Nombre:</td><td>${escapeHtml(lead.name)}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #52606d;">Contacto:</td><td>${escapeHtml(lead.contact)}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #52606d;">Método:</td><td>${method}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #52606d;">Origen:</td><td>${source}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #52606d;">Fecha:</td><td>${date}</td></tr>
        <tr><td style="padding: 2px 12px 2px 0; color: #52606d; vertical-align: top;">Resumen:</td><td>${escapeHtml(context)}</td></tr>
      </table>
      <p style="margin-top: 16px; color: #52606d;">
        Responde por este mismo correo o abre el contacto en WhatsApp.
      </p>
    </div>
  `.trim()

  return { subject, text, html }
}

/** Default recipient used when `LEAD_NOTIFY_EMAIL` is not set. */
export const DEFAULT_LEAD_NOTIFY_EMAIL = site.email
