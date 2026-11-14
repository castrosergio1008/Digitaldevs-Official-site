import { describe, expect, it, vi } from 'vitest'
import {
  CompositeNotifier,
  GmailNotifier,
  NullNotifier,
  ResendNotifier,
  WhatsAppNotifier,
  buildLeadEmail,
  formatLeadDate,
  sourceLabel,
  type MailTransporter,
} from '../notifier'
import type { LeadRecord } from '../stores'

function makeLead(overrides: Partial<LeadRecord> = {}): LeadRecord {
  return {
    id: 'lead-1',
    name: 'Ana Pérez',
    contact: '3001234567',
    method: 'whatsapp',
    sessionIdHash: 'hash-1',
    source: 'form',
    path: '/servicios',
    context: 'Quiere una tienda en línea.',
    notifiedAt: null,
    createdAt: new Date('2026-11-13T19:32:00.000Z'),
    ...overrides,
  }
}

/** Casts the first call of a 0-argument mock into a parameter tuple. */
function firstCall<Tuple extends unknown[]>(mock: ReturnType<typeof vi.fn>): Tuple {
  return mock.mock.calls[0] as unknown as Tuple
}

describe('buildLeadEmail', () => {
  it('includes the lead details and the clean summary', () => {
    const { subject, text, html } = buildLeadEmail(makeLead())
    expect(subject).toBe('Nuevo lead del chat de Digital-devs')
    expect(text).toContain('Nombre:      Ana Pérez')
    expect(text).toContain('Contacto:   3001234567')
    expect(text).toContain('Método:      WhatsApp')
    expect(text).toContain('Origen:      Formulario del chat')
    expect(text).toContain('Resumen:     Quiere una tienda en línea.')
    expect(html).toContain('Ana Pérez')
  })

  it('falls back to a placeholder when there is no context', () => {
    const { text } = buildLeadEmail(makeLead({ context: null }))
    expect(text).toContain('Resumen:     Sin resumen.')
  })

  it('escapes HTML in the free-text fields', () => {
    const { html } = buildLeadEmail(
      makeLead({ name: '<script>alert("x")</script>', context: '<img src=x onerror=alert(1)>' }),
    )
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
  })
})

describe('sourceLabel', () => {
  it('maps every source to a human label', () => {
    expect(sourceLabel('form')).toBe('Formulario del chat')
    expect(sourceLabel('detection')).toBe('Detección automática')
    expect(sourceLabel('chip')).toBe('Chip de contacto')
  })
})

describe('formatLeadDate', () => {
  it('formats in Colombian local time (UTC-5)', () => {
    // 2026-11-13T19:32Z is 14:32 in America/Bogota.
    expect(formatLeadDate(new Date('2026-11-13T19:32:00.000Z'))).toBe('2026-11-13 14:32 (UTC-5)')
  })
})

describe('NullNotifier', () => {
  it('reports no channel delivered', async () => {
    expect(await new NullNotifier().notify()).toEqual({ emailed: false, whatsapped: false })
  })
})

describe('ResendNotifier', () => {
  it('posts the email to Resend with the service headers', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'email-1' }), { status: 200 }))
    const notifier = new ResendNotifier(
      'resend-key',
      'Leads <leads@digitaldevs.co>',
      'team@example.com',
      fetchMock,
    )

    const result = await notifier.notify(makeLead())

    expect(result).toEqual({ emailed: true, whatsapped: false })
    const [url, init] = firstCall<[string, RequestInit]>(fetchMock)
    expect(url).toBe('https://api.resend.com/emails')
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer resend-key')
    expect(headers['User-Agent']).toBe('digitaldevs-leads/1.0')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.to).toEqual(['team@example.com'])
    expect(String(body.text)).toContain('Ana Pérez')
  })

  it('throws on a non-OK response', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 422 }))
    const notifier = new ResendNotifier('key', 'from', 'to', fetchMock)
    await expect(notifier.notify(makeLead())).rejects.toThrow('Resend responded with status 422')
  })
})

describe('GmailNotifier', () => {
  it('sends through the injected Nodemailer transporter', async () => {
    const sendMail = vi.fn(async () => ({ messageId: 'm-1' }))
    const transporter: MailTransporter = { sendMail }
    const notifier = new GmailNotifier(transporter, 'from@example.com', 'to@example.com')

    const result = await notifier.notify(makeLead())

    expect(result).toEqual({ emailed: true, whatsapped: false })
    expect(sendMail).toHaveBeenCalledTimes(1)
    const [message] = firstCall<[Record<string, unknown>]>(sendMail)
    expect(message.to).toBe('to@example.com')
    expect(message.text).toContain('Ana Pérez')
  })
})

describe('WhatsAppNotifier', () => {
  it('posts an approved template message', async () => {
    const fetchMock = vi.fn(
      async () => new Response(JSON.stringify({ messages: [{ id: 'wamid-1' }] }), { status: 200 }),
    )
    const notifier = new WhatsAppNotifier(
      'wa-token',
      'phone-id',
      '573113609710',
      'new_lead',
      'es',
      'v21.0',
      fetchMock,
    )

    const result = await notifier.notify(makeLead())

    expect(result).toEqual({ emailed: false, whatsapped: true })
    const [url, init] = firstCall<[string, RequestInit]>(fetchMock)
    expect(url).toBe('https://graph.facebook.com/v21.0/phone-id/messages')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer wa-token')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.messaging_product).toBe('whatsapp')
    expect(body.to).toBe('573113609710')
    const template = body.template as { name: string; components: { parameters: { text: string }[] }[] }
    expect(template.name).toBe('new_lead')
    expect(template.components[0].parameters.map((parameter) => parameter.text)).toEqual([
      'Ana Pérez',
      '3001234567',
      'Formulario del chat',
      '2026-11-13 14:32 (UTC-5)',
    ])
  })

  it('throws on a non-OK response', async () => {
    const fetchMock = vi.fn(async () => new Response('nope', { status: 400 }))
    const notifier = new WhatsAppNotifier('token', 'phone', 'to', 'template', 'es', 'v21.0', fetchMock)
    await expect(notifier.notify(makeLead())).rejects.toThrow('WhatsApp responded with status 400')
  })
})

describe('CompositeNotifier', () => {
  it('isolates a failing channel and reports the successful one', async () => {
    const failing = {
      notify: vi.fn(async () => {
        throw new Error('down')
      }),
    }
    const working = {
      notify: vi.fn(async () => ({ emailed: true, whatsapped: false })),
    }
    const notifier = new CompositeNotifier([failing, working])

    const result = await notifier.notify(makeLead())

    expect(result).toEqual({ emailed: true, whatsapped: false })
    expect(failing.notify).toHaveBeenCalledTimes(1)
    expect(working.notify).toHaveBeenCalledTimes(1)
  })

  it('reports nothing delivered when every channel fails', async () => {
    const notifier = new CompositeNotifier([
      {
        notify: vi.fn(async () => {
          throw new Error('down')
        }),
      },
    ])
    await expect(notifier.notify(makeLead())).resolves.toEqual({ emailed: false, whatsapped: false })
  })
})
