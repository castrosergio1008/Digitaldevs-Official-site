import nodemailer from 'nodemailer'
import { isEnabled } from '@/lib/chat/killswitch'
import { InMemoryEventStore, InMemoryLeadStore } from './memory-store'
import {
  DEFAULT_LEAD_NOTIFY_EMAIL,
  DEFAULT_RESEND_FROM,
  DEFAULT_WHATSAPP_API_VERSION,
  DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE,
  GMAIL_SMTP_HOST,
  GMAIL_SMTP_PORT,
  CompositeNotifier,
  GmailNotifier,
  NullNotifier,
  ResendNotifier,
  WhatsAppNotifier,
  type LeadNotifier,
  type MailTransporter,
} from './notifier'
import { SupabaseEventStore, SupabaseLeadStore } from './supabase-store'
import type { EventStore, LeadStore } from './stores'

/** Raised when a feature flag is enabled but its dependencies are missing. */
export class LeadConfigError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'LeadConfigError'
  }
}

function supabaseCredentials(): { baseUrl: string; apiKey: string } {
  const baseUrl = process.env.SUPABASE_URL
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!baseUrl || !apiKey) {
    throw new LeadConfigError('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required')
  }
  return { baseUrl, apiKey }
}

/**
 * Resolves which store implementation to use. `memory` is opt-in and exists
 * for tests and local development; production defaults to Supabase when the
 * credentials are present and fails closed otherwise.
 */
function resolveStoreKind(storeEnv: string): 'supabase' | 'memory' {
  const requested = (process.env[storeEnv] ?? '').trim().toLowerCase()
  if (requested === 'memory') {
    // The in-memory store loses data on every instance recycle: never allow it
    // in production, where it would silently drop leads and events.
    if (process.env.NODE_ENV === 'production') {
      throw new LeadConfigError(`${storeEnv}=memory is not allowed in production`)
    }
    return 'memory'
  }
  if (requested === 'supabase' || requested === '') return 'supabase'
  throw new LeadConfigError(`Unknown ${storeEnv} "${requested}"`)
}

/** Returns the lead store, or null when persistence is disabled by flag. */
export function getLeadStore(): LeadStore | null {
  if (!isEnabled(process.env.LEAD_PERSISTENCE_ENABLED, false)) return null
  const kind = resolveStoreKind('LEAD_STORE')
  if (kind === 'memory') return new InMemoryLeadStore()
  const { baseUrl, apiKey } = supabaseCredentials()
  return new SupabaseLeadStore(baseUrl, apiKey)
}

/** Returns the event store, or null when analytics is disabled by flag. */
export function getEventStore(): EventStore | null {
  if (!isEnabled(process.env.CHAT_ANALYTICS_ENABLED, false)) return null
  const kind = resolveStoreKind('EVENT_STORE')
  if (kind === 'memory') return new InMemoryEventStore()
  const { baseUrl, apiKey } = supabaseCredentials()
  return new SupabaseEventStore(baseUrl, apiKey)
}

/** The pepper used to hash session ids. Required whenever a store is enabled. */
export function readSessionPepper(): string {
  const pepper = process.env.SESSION_PEPPER
  if (!pepper) {
    throw new LeadConfigError('SESSION_PEPPER is required when persistence or analytics is enabled')
  }
  return pepper
}

export function getNotifier(): LeadNotifier {
  const notifiers: LeadNotifier[] = []

  if (isEnabled(process.env.LEAD_NOTIFY_ENABLED, false)) {
    // Channel priority: Resend (optional, needs a verified domain) first;
    // Gmail via Nodemailer is the primary channel for Digital-devs.
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      notifiers.push(
        new ResendNotifier(
          resendKey,
          process.env.RESEND_FROM ?? DEFAULT_RESEND_FROM,
          process.env.LEAD_NOTIFY_EMAIL ?? DEFAULT_LEAD_NOTIFY_EMAIL,
        ),
      )
    } else if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      notifiers.push(
        new GmailNotifier(
          createGmailTransporter(),
          process.env.GMAIL_USER,
          process.env.LEAD_NOTIFY_EMAIL ?? DEFAULT_LEAD_NOTIFY_EMAIL,
        ),
      )
    } else {
      throw new LeadConfigError(
        'LEAD_NOTIFY_ENABLED is true but no email provider is configured',
      )
    }
  }

  if (isEnabled(process.env.LEAD_NOTIFY_WHATSAPP_ENABLED, false)) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const to = process.env.WHATSAPP_NOTIFY_NUMBER
    const templateName = process.env.WHATSAPP_TEMPLATE_NAME
    if (!accessToken || !phoneNumberId || !to || !templateName) {
      // Isolate the channel: a WhatsApp misconfiguration must never take down
      // the primary email notification.
      console.error(
        '[leads] LEAD_NOTIFY_WHATSAPP_ENABLED is true but WhatsApp is not fully configured; skipping the channel',
      )
    } else {
      notifiers.push(
        new WhatsAppNotifier(
          accessToken,
          phoneNumberId,
          to,
          templateName,
          process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? DEFAULT_WHATSAPP_TEMPLATE_LANGUAGE,
          process.env.WHATSAPP_API_VERSION ?? DEFAULT_WHATSAPP_API_VERSION,
        ),
      )
    }
  }

  if (notifiers.length === 0) return new NullNotifier()
  if (notifiers.length === 1) return notifiers[0] as LeadNotifier
  return new CompositeNotifier(notifiers)
}

/**
 * Builds the Gmail SMTP transport. `GMAIL_APP_PASSWORD` is the 16-character
 * App Password generated in the Google Account (not the login password).
 */
function createGmailTransporter(): MailTransporter {
  return nodemailer.createTransport({
    host: GMAIL_SMTP_HOST,
    port: GMAIL_SMTP_PORT,
    secure: true,
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  }) as MailTransporter
}
