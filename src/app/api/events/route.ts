import { NextRequest, NextResponse } from 'next/server'
import { getClientIp, isAllowedOrigin, json, readPositiveInt } from '@/lib/chat/http'
import { checkRateLimit } from '@/lib/chat/ratelimit'
import { isEnabled } from '@/lib/chat/killswitch'
import { getEventStore, readSessionPepper } from '@/lib/leads/factory'
import { hashSessionId } from '@/lib/leads/session'
import { MAX_EVENT_PAYLOAD_BYTES, parseEventRequest } from '@/lib/leads/validation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 15

/**
 * Persists one anonymous chat event. The event never carries PII: the session
 * id is hashed with the server pepper and the metadata is validated against a
 * whitelist (design doc section 4.4).
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!isEnabled(process.env.CHAT_ANALYTICS_ENABLED, false)) {
    return json(503, { error: 'El servicio no está disponible.' })
  }

  // CSRF: reject browser requests that did not originate from this site.
  if (!isAllowedOrigin(req, true)) {
    return json(403, { error: 'Solicitud inválida' })
  }

  let raw: string
  try {
    raw = await req.text()
  } catch {
    return json(400, { error: 'Solicitud inválida' })
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_EVENT_PAYLOAD_BYTES) {
    return json(400, { error: 'Solicitud inválida' })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'Solicitud inválida' })
  }

  const parsed = parseEventRequest(body)
  if (!parsed.ok) {
    console.warn(`[events] invalid request: ${parsed.error}`)
    return json(400, { error: 'Solicitud inválida' })
  }

  const ip = getClientIp(req)
  const limitPerMin = readPositiveInt(process.env.EVENT_RATE_LIMIT_PER_MIN, 60)
  const limitPerDay = readPositiveInt(process.env.EVENT_RATE_LIMIT_PER_DAY, 600)
  const rate = checkRateLimit(`events:${ip}`, limitPerMin, limitPerDay)
  if (!rate.ok) {
    return json(429, { error: 'Demasiadas peticiones', retryAfter: rate.retryAfter })
  }

  let store: ReturnType<typeof getEventStore>
  let pepper: string
  try {
    store = getEventStore()
    pepper = readSessionPepper()
  } catch (error) {
    console.error('[events] configuration error', { message: (error as Error).message })
    return json(503, { error: 'El servicio no está disponible.' })
  }
  if (!store) {
    return json(503, { error: 'El servicio no está disponible.' })
  }

  const sessionIdHash = hashSessionId(parsed.data.sessionId, pepper)

  try {
    await store.insert({
      eventName: parsed.data.eventName,
      sessionIdHash,
      path: parsed.data.path,
      metadata: parsed.data.metadata,
    })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('[events] persistence failed', {
      error: error instanceof Error ? error.message : 'unknown',
    })
    return json(500, { error: 'Error interno' })
  }
}
