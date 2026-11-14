import { NextRequest, NextResponse, after } from 'next/server'
import { getClientIp, isAllowedOrigin, json, readPositiveInt } from '@/lib/chat/http'
import { checkRateLimit } from '@/lib/chat/ratelimit'
import { isEnabled } from '@/lib/chat/killswitch'
import { getEventStore, getLeadStore, getNotifier, readSessionPepper } from '@/lib/leads/factory'
import { hashSessionId } from '@/lib/leads/session'
import type { LeadNotifier } from '@/lib/leads/notifier'
import type { EventStore, LeadStore } from '@/lib/leads/stores'
import { MAX_LEAD_PAYLOAD_BYTES, parseLeadRequest } from '@/lib/leads/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

/**
 * Persists a commercial lead and notifies the team. The WhatsApp hand-off is
 * performed by the client and never waits for this endpoint: the lead is
 * stored even when the visitor closes the page right after opening WhatsApp.
 *
 * PII is limited to the lead columns. Logs never contain names, contacts,
 * contexts or session ids.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled(process.env.LEAD_PERSISTENCE_ENABLED, false)) {
    return json(503, { error: 'El servicio no está disponible.' })
  }

  // CSRF: this endpoint persists PII, so it requires a browser Origin header.
  if (!isAllowedOrigin(req, true)) {
    return json(403, { error: 'Solicitud inválida' })
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return json(400, { error: 'Solicitud inválida' })
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_LEAD_PAYLOAD_BYTES) {
    return json(400, { error: 'Solicitud inválida' })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'Solicitud inválida' })
  }

  const parsed = parseLeadRequest(body)
  if (!parsed.ok) {
    // Static validation message only; never log visitor content.
    console.warn(`[leads] invalid request: ${parsed.error}`)
    return json(400, { error: 'Solicitud inválida' })
  }

  const ip = getClientIp(req)
  // Stricter than the chat/events budgets: the endpoint persists PII and a
  // legitimate visitor submits the form once, so 10/min and 100/day per IP are
  // generous while bounding spam (see design doc Anexo C.8).
  const limitPerMin = readPositiveInt(process.env.LEAD_RATE_LIMIT_PER_MIN, 10)
  const limitPerDay = readPositiveInt(process.env.LEAD_RATE_LIMIT_PER_DAY, 100)
  const rate = checkRateLimit(`leads:${ip}`, limitPerMin, limitPerDay)
  if (!rate.ok) {
    return json(429, { error: 'Demasiadas peticiones', retryAfter: rate.retryAfter })
  }

  // The store and the pepper are critical: fail closed when misconfigured.
  let store: LeadStore | null
  let pepper: string
  try {
    store = getLeadStore()
    pepper = readSessionPepper()
  } catch (error) {
    console.error('[leads] configuration error', { message: (error as Error).message })
    return json(503, { error: 'El servicio no está disponible.' })
  }
  if (!store) {
    return json(503, { error: 'El servicio no está disponible.' })
  }

  // Analytics and notifications are additive: a configuration problem there
  // must never prevent the lead from being persisted.
  let eventStore: EventStore | null = null
  let notifier: LeadNotifier | null = null
  try {
    eventStore = getEventStore()
  } catch (error) {
    console.error('[leads] analytics configuration error', { message: (error as Error).message })
  }
  try {
    notifier = getNotifier()
  } catch (error) {
    console.error('[leads] notifier configuration error', { message: (error as Error).message })
  }

  const sessionIdHash = hashSessionId(parsed.data.sessionId, pepper)

  try {
    const { record, created } = await store.upsertBySession({
      name: parsed.data.name,
      contact: parsed.data.contact,
      method: parsed.data.method,
      sessionIdHash,
      source: parsed.data.source,
      path: parsed.data.path,
      context: parsed.data.context,
    })

    // `lead_captured` is emitted by the server and only on the first capture:
    // it is the source of truth that the lead exists, and it avoids duplicate
    // counts from client retries or repeated submits (design doc section 4.4).
    if (created && eventStore) {
      try {
        await eventStore.insert({
          eventName: 'lead_captured',
          sessionIdHash,
          path: record.path,
          metadata: { method: record.method, source: record.source },
        })
      } catch (error) {
        console.error('[leads] failed to record lead_captured', {
          leadId: record.id,
          error: error instanceof Error ? error.message : 'unknown',
        })
      }
    }

    // Notify only on the first capture, and only after the response is sent:
    // the lead is already persisted, so the visitor must not wait for the
    // email/WhatsApp round-trip (design doc section 3.2).
    if (created && notifier) {
      const notifyAfterResponse = async (): Promise<void> => {
        try {
          const result = await notifier.notify(record)
          if (result.emailed || result.whatsapped) {
            await store.markNotified(record.id)
          }
        } catch (error) {
          // The lead is already persisted; a notification failure is not fatal.
          console.error('[leads] notification failed', {
            leadId: record.id,
            error: error instanceof Error ? error.message : 'unknown',
          })
        }
      }

      // `after()` runs once the response has been sent. Outside a request
      // scope (unit tests) it is not available, so fall back to
      // fire-and-forget; the notification logic is identical either way.
      try {
        after(notifyAfterResponse)
      } catch {
        void notifyAfterResponse()
      }
    }

    return json(200, { ok: true, id: record.id })
  } catch (error) {
    console.error('[leads] persistence failed', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return json(500, { error: 'No pude guardar tu solicitud. Intenta de nuevo.' })
  }
}
