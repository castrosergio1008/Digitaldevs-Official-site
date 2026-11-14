import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST as POST_LEAD } from '@/app/api/leads/route'
import { POST as POST_EVENT } from '@/app/api/events/route'
import { __resetRateLimitForTests } from '@/lib/chat/ratelimit'
import { hashSessionId } from '@/lib/leads/session'

const ENV_KEYS = [
  'LEAD_PERSISTENCE_ENABLED',
  'CHAT_ANALYTICS_ENABLED',
  'LEAD_NOTIFY_ENABLED',
  'LEAD_NOTIFY_WHATSAPP_ENABLED',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SESSION_PEPPER',
  'LEAD_RATE_LIMIT_PER_MIN',
  'LEAD_RATE_LIMIT_PER_DAY',
  'EVENT_RATE_LIMIT_PER_MIN',
  'EVENT_RATE_LIMIT_PER_DAY',
  'RESEND_API_KEY',
] as const

let savedEnv: Record<string, string | undefined> = {}
let calls: SupabaseCall[]

interface SupabaseCall {
  url: string
  init: RequestInit
}

const PEPPER = 'test-pepper'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function leadRow() {
  return {
    id: 'lead-1',
    name: 'Ana Pérez',
    contact: '3001234567',
    method: 'whatsapp',
    session_id_hash: hashSessionId('session-1', PEPPER),
    source: 'form',
    path: '/servicios',
    context: 'Quiere una tienda en línea.',
    notified_at: null,
    created_at: '2026-11-13T14:32:00.000Z',
  }
}

function eventRow() {
  return {
    id: '1',
    event_name: 'lead_captured',
    session_id_hash: hashSessionId('session-1', PEPPER),
    path: '/servicios',
    metadata: { method: 'whatsapp', source: 'form' },
    created_at: '2026-11-13T14:32:00.000Z',
  }
}

/** Stubs the global fetch with a PostgREST (+ Resend) mock and records calls. */
function stubUpstream(): SupabaseCall[] {
  const calls: SupabaseCall[] = []
  const fetchMock = vi.fn(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const url = typeof input === 'string' ? input : input.toString()
      calls.push({ url, init: init ?? {} })

      if (url.includes('resend.com')) return jsonResponse({ id: 'email-1' })
      if (url.includes('/rest/v1/chat_events')) return jsonResponse([eventRow()])
      if (url.includes('/rest/v1/leads')) return jsonResponse([leadRow()])
      return jsonResponse({ message: 'not found' }, 404)
    },
  )
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

function makeRequest(
  body: unknown,
  url = 'http://localhost/api/leads',
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '203.0.113.7',
      // The leads/events endpoints require a browser Origin header (C3).
      origin: 'http://localhost',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const validLead = {
  name: 'Ana Pérez',
  contact: '3001234567',
  method: 'whatsapp',
  sessionId: 'session-1',
  source: 'form',
  path: '/servicios',
  context: 'Quiere una tienda en línea.',
}

const validEvent = {
  eventName: 'whatsapp_clicked',
  sessionId: 'session-1',
  path: '/servicios',
  metadata: { source: 'form' },
}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
  process.env.LEAD_PERSISTENCE_ENABLED = 'true'
  process.env.CHAT_ANALYTICS_ENABLED = 'true'
  process.env.LEAD_NOTIFY_ENABLED = 'false'
  process.env.SUPABASE_URL = 'https://example.supabase.co'
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
  process.env.SESSION_PEPPER = PEPPER
  __resetRateLimitForTests()
  calls = stubUpstream()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  __resetRateLimitForTests()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('POST /api/leads', () => {
  it('persists the lead, emits lead_captured and returns 200', async () => {
    const res = await POST_LEAD(makeRequest(validLead))

    expect(res.status).toBe(200)
    const body = (await res.json()) as { ok: boolean; id: string }
    expect(body.ok).toBe(true)
    expect(body.id).toBe('lead-1')

    const leadCall = calls.find((call) => call.url.includes('/rest/v1/leads'))
    expect(leadCall).toBeDefined()
    const leadBody = JSON.parse(String(leadCall?.init.body)) as Record<string, unknown>
    expect(leadBody.session_id_hash).toBe(hashSessionId('session-1', PEPPER))
    expect(leadBody.session_id_hash).not.toContain('session-1')
    expect(leadBody.name).toBe('Ana Pérez')

    const eventCall = calls.find((call) => call.url.includes('/rest/v1/chat_events'))
    expect(eventCall).toBeDefined()
    const eventBody = JSON.parse(String(eventCall?.init.body)) as Record<string, unknown>
    expect(eventBody.event_name).toBe('lead_captured')
    expect(eventBody.session_id_hash).toBe(hashSessionId('session-1', PEPPER))
    expect(eventBody.metadata).toEqual({ method: 'whatsapp', source: 'form' })
    // The event payload must never contain PII.
    expect(JSON.stringify(eventBody)).not.toContain('Ana Pérez')
    expect(JSON.stringify(eventBody)).not.toContain('3001234567')
  })

  it('answers 503 when persistence is disabled', async () => {
    process.env.LEAD_PERSISTENCE_ENABLED = 'false'
    const res = await POST_LEAD(makeRequest(validLead))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ error: 'El servicio no está disponible.' })
  })

  it('answers 503 when enabled but Supabase is not configured', async () => {
    delete process.env.SUPABASE_URL
    const res = await POST_LEAD(makeRequest(validLead))
    expect(res.status).toBe(503)
  })

  it('answers 400 for an invalid lead', async () => {
    const res = await POST_LEAD(makeRequest({ ...validLead, name: 'A' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Solicitud inválida' })
  })

  it('answers 400 for a malformed JSON body', async () => {
    const req = new NextRequest('http://localhost/api/leads', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.7',
        origin: 'http://localhost',
      },
      body: '{not json',
    })
    const res = await POST_LEAD(req)
    expect(res.status).toBe(400)
  })

  it('rejects a cross-origin request with 403', async () => {
    const res = await POST_LEAD(
      makeRequest(validLead, 'http://localhost/api/leads', { origin: 'https://evil.example' }),
    )
    expect(res.status).toBe(403)
  })

  it('rejects a request without an Origin header (PII endpoint)', async () => {
    const res = await POST_LEAD(
      new NextRequest('http://localhost/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
        body: JSON.stringify(validLead),
      }),
    )
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Solicitud inválida' })
  })

  it('answers 429 after the per-minute limit', async () => {
    process.env.LEAD_RATE_LIMIT_PER_MIN = '2'
    process.env.LEAD_RATE_LIMIT_PER_DAY = '100'

    expect((await POST_LEAD(makeRequest(validLead))).status).toBe(200)
    expect((await POST_LEAD(makeRequest(validLead))).status).toBe(200)

    const limited = await POST_LEAD(makeRequest(validLead))
    expect(limited.status).toBe(429)
    const body = (await limited.json()) as { error: string; retryAfter: number }
    expect(body.error).toBe('Demasiadas peticiones')
    expect(body.retryAfter).toBeGreaterThan(0)
  })

  it('does not expose CORS headers', async () => {
    const res = await POST_LEAD(makeRequest(validLead))
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })

  it('notifies by email and marks the lead as notified', async () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.RESEND_API_KEY = 'resend-key'

    const res = await POST_LEAD(makeRequest(validLead))
    expect(res.status).toBe(200)

    // The notification runs after the response (fire-and-forget in tests).
    await vi.waitFor(() => {
      expect(calls.some((call) => call.url.includes('resend.com'))).toBe(true)
    })

    const notifiedCall = calls.find(
      (call) => call.url.includes('/rest/v1/leads?') && call.init.method === 'PATCH',
    )
    expect(notifiedCall).toBeDefined()
    const patchBody = JSON.parse(String(notifiedCall?.init.body)) as Record<string, unknown>
    expect(typeof patchBody.notified_at).toBe('string')
  })

  it('emits lead_captured and notifies only on the first capture', async () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.RESEND_API_KEY = 'resend-key'

    const localCalls: SupabaseCall[] = []
    let leadPosts = 0
    const statefulFetch = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : input.toString()
        localCalls.push({ url, init: init ?? {} })

        if (url.includes('resend.com')) return jsonResponse({ id: 'email-1' })
        if (url.includes('/rest/v1/chat_events')) return jsonResponse([eventRow()])
        if (url.includes('/rest/v1/leads')) {
          if (init?.method === 'POST') {
            leadPosts += 1
            // First insert succeeds; the second conflicts on the unique index.
            return leadPosts === 1
              ? jsonResponse([leadRow()])
              : jsonResponse({ message: 'duplicate key' }, 409)
          }
          return jsonResponse([leadRow()])
        }
        return jsonResponse({ message: 'not found' }, 404)
      },
    )
    vi.stubGlobal('fetch', statefulFetch)

    const first = await POST_LEAD(makeRequest(validLead))
    expect(first.status).toBe(200)

    const second = await POST_LEAD(makeRequest(validLead))
    expect(second.status).toBe(200)

    // Wait for the first capture's async notification to settle.
    await vi.waitFor(() => {
      expect(localCalls.some((call) => call.url.includes('resend.com'))).toBe(true)
    })
    await vi.waitFor(() => {
      expect(
        localCalls.some(
          (call) => call.url.includes('/rest/v1/leads?id=eq.lead-1') && call.init.method === 'PATCH',
        ),
      ).toBe(true)
    })

    expect(leadPosts).toBe(2)

    // Only one lead row was inserted; the second submit updated it.
    const updates = localCalls.filter(
      (call) =>
        call.url.includes('/rest/v1/leads?session_id_hash=eq.') && call.init.method === 'PATCH',
    )
    expect(updates).toHaveLength(1)

    // `lead_captured` and the email are emitted only once.
    const leadCaptures = localCalls.filter(
      (call) => call.url.includes('/rest/v1/chat_events') && call.init.method === 'POST',
    )
    expect(leadCaptures).toHaveLength(1)
    expect(localCalls.filter((call) => call.url.includes('resend.com'))).toHaveLength(1)
  })
})

describe('POST /api/events', () => {
  it('persists the event with a hashed session id and answers 204', async () => {
    const res = await POST_EVENT(makeRequest(validEvent, 'http://localhost/api/events'))

    expect(res.status).toBe(204)
    expect(await res.text()).toBe('')

    const eventCall = calls.find((call) => call.url.includes('/rest/v1/chat_events'))
    expect(eventCall).toBeDefined()
    const eventBody = JSON.parse(String(eventCall?.init.body)) as Record<string, unknown>
    expect(eventBody.event_name).toBe('whatsapp_clicked')
    expect(eventBody.session_id_hash).toBe(hashSessionId('session-1', PEPPER))
    expect(eventBody.session_id_hash).not.toContain('session-1')
    expect(eventBody.metadata).toEqual({ source: 'form' })
    expect(JSON.stringify(eventBody)).not.toContain('Ana Pérez')
    expect(JSON.stringify(eventBody)).not.toContain('3001234567')
  })

  it('answers 503 when analytics is disabled', async () => {
    process.env.CHAT_ANALYTICS_ENABLED = 'false'
    const res = await POST_EVENT(makeRequest(validEvent, 'http://localhost/api/events'))
    expect(res.status).toBe(503)
  })

  it('answers 400 for an event outside the whitelist', async () => {
    const res = await POST_EVENT(
      makeRequest({ ...validEvent, eventName: 'page_viewed' }, 'http://localhost/api/events'),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Solicitud inválida' })
  })

  it('answers 400 for PII smuggled in metadata', async () => {
    const res = await POST_EVENT(
      makeRequest(
        { ...validEvent, metadata: { name: 'Ana Pérez' } },
        'http://localhost/api/events',
      ),
    )
    expect(res.status).toBe(400)
  })

  it('rejects a request without an Origin header (analytics endpoint)', async () => {
    const res = await POST_EVENT(
      new NextRequest('http://localhost/api/events', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
        body: JSON.stringify(validEvent),
      }),
    )
    expect(res.status).toBe(403)
  })

  it('answers 429 after the per-minute limit', async () => {
    process.env.EVENT_RATE_LIMIT_PER_MIN = '2'
    process.env.EVENT_RATE_LIMIT_PER_DAY = '100'

    expect((await POST_EVENT(makeRequest(validEvent, 'http://localhost/api/events'))).status).toBe(204)
    expect((await POST_EVENT(makeRequest(validEvent, 'http://localhost/api/events'))).status).toBe(204)

    const limited = await POST_EVENT(makeRequest(validEvent, 'http://localhost/api/events'))
    expect(limited.status).toBe(429)
  })

  it('does not expose CORS headers', async () => {
    const res = await POST_EVENT(makeRequest(validEvent, 'http://localhost/api/events'))
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
