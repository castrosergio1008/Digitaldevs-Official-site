import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { POST } from '@/app/api/chat/route'
import { CHAT_FALLBACK_REPLY } from '@/lib/chat/fallback'
import { getChatProvider, __resetChatProviderForTests } from '@/lib/chat/provider'
import { __resetRateLimitForTests } from '@/lib/chat/ratelimit'
import { MAX_PAYLOAD_BYTES } from '@/lib/chat/validation'

const ENV_KEYS = [
  'CHAT_ENABLED',
  'CHAT_PROVIDER',
  'OPENCODE_API_KEY',
  'ANTHROPIC_API_KEY',
  'CHAT_MODEL',
  'CHAT_RATE_LIMIT_PER_MIN',
  'CHAT_RATE_LIMIT_PER_DAY',
  'CHAT_MAX_MESSAGES',
  'CHAT_MAX_MESSAGE_LENGTH',
] as const

let savedEnv: Record<string, string | undefined> = {}

const validBody = {
  sessionId: 'session-1',
  messages: [{ role: 'user', content: 'Hola' }],
}

function makeRequestWithHeaders(
  body: unknown,
  headers: Record<string, string>,
  url = 'http://localhost/api/chat',
): NextRequest {
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  })
}

function makeRequest(body: unknown, ip = '203.0.113.7'): NextRequest {
  return makeRequestWithHeaders(body, { 'x-forwarded-for': ip })
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  return (await res.json()) as Record<string, unknown>
}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
  __resetChatProviderForTests()
  __resetRateLimitForTests()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  __resetChatProviderForTests()
  __resetRateLimitForTests()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe('POST /api/chat', () => {
  it('returns 503 when CHAT_ENABLED=false', async () => {
    process.env.CHAT_ENABLED = 'false'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(503)
    expect(await readJson(res)).toEqual({ error: 'El chat no está disponible.' })
  })

  it('normalizes the kill switch for every supported "off" spelling', async () => {
    process.env.CHAT_PROVIDER = 'mock'
    for (const value of ['FALSE', '0', 'no', 'Off']) {
      process.env.CHAT_ENABLED = value
      const res = await POST(makeRequest(validBody))
      expect(res.status).toBe(503)
      expect(await readJson(res)).toEqual({ error: 'El chat no está disponible.' })
    }
  })

  it('keeps the chat enabled for truthy kill-switch values', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
  })

  it('rejects a cross-origin Origin header with 403', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(
      makeRequestWithHeaders(validBody, { origin: 'https://evil.example' }),
    )
    expect(res.status).toBe(403)
    expect(await readJson(res)).toEqual({ error: 'Solicitud inválida' })
  })

  it('rejects an opaque (null) Origin header with 403', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequestWithHeaders(validBody, { origin: 'null' }))
    expect(res.status).toBe(403)
  })

  it('rejects a malformed Origin header with 403', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequestWithHeaders(validBody, { origin: 'not a url' }))
    expect(res.status).toBe(403)
  })

  it('accepts a same-origin Origin header', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequestWithHeaders(validBody, { origin: 'http://localhost' }))
    expect(res.status).toBe(200)
  })

  it('accepts the canonical site origin even when the host differs', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequestWithHeaders(validBody, { origin: 'https://digitaldevs.co' }))
    expect(res.status).toBe(200)
  })

  it('accepts a request without an Origin header', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
  })

  it('returns 503 when the provider key is missing', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'opencode-go'

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(503)
    expect(await readJson(res)).toEqual({ error: 'El chat no está disponible.' })
  })

  it('returns 400 for an invalid request', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequest({ messages: [] }))
    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Solicitud inválida' })
  })

  it('returns 400 for a malformed JSON body', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const req = new NextRequest('http://localhost/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7' },
      body: '{not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(await readJson(res)).toEqual({ error: 'Solicitud inválida' })
  })

  it('returns 400 for an oversized payload', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const big = 'a'.repeat(20 * 1024)
    const res = await POST(makeRequest({ messages: [{ role: 'user', content: big }] }))
    expect(res.status).toBe(400)
  })

  it('measures the payload budget in UTF-8 bytes, not UTF-16 code units', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    // 6,000 euro signs: ~18,000 UTF-8 bytes but only ~6,020 UTF-16 code units.
    const multibyte = '€'.repeat(6000)
    const body = JSON.stringify({ messages: [{ role: 'user', content: multibyte }] })
    expect(body.length).toBeLessThan(MAX_PAYLOAD_BYTES)
    expect(Buffer.byteLength(body, 'utf8')).toBeGreaterThan(MAX_PAYLOAD_BYTES)

    const res = await POST(
      new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }),
    )
    expect(res.status).toBe(400)
  })

  it('accepts a multibyte payload within the byte budget', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const multibyte = '€'.repeat(800)
    const body = JSON.stringify({ messages: [{ role: 'user', content: multibyte }] })
    expect(Buffer.byteLength(body, 'utf8')).toBeLessThan(MAX_PAYLOAD_BYTES)

    const res = await POST(
      new NextRequest('http://localhost/api/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
      }),
    )
    expect(res.status).toBe(200)
  })

  it('honours CHAT_MAX_MESSAGES', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    process.env.CHAT_MAX_MESSAGES = '1'

    const res = await POST(
      makeRequest({
        messages: [
          { role: 'user', content: 'Hola' },
          { role: 'assistant', content: 'Hola' },
        ],
      }),
    )
    expect(res.status).toBe(400)
  })

  it('returns 429 after the per-minute limit with retryAfter', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    process.env.CHAT_RATE_LIMIT_PER_MIN = '2'
    process.env.CHAT_RATE_LIMIT_PER_DAY = '100'

    expect((await POST(makeRequest(validBody))).status).toBe(200)
    expect((await POST(makeRequest(validBody))).status).toBe(200)

    const limited = await POST(makeRequest(validBody))
    expect(limited.status).toBe(429)
    const body = await readJson(limited)
    expect(body.error).toBe('Demasiadas peticiones')
    expect(typeof body.retryAfter).toBe('number')
    expect(body.retryAfter as number).toBeGreaterThan(0)
  })

  it('rate limits per IP', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    process.env.CHAT_RATE_LIMIT_PER_MIN = '1'
    process.env.CHAT_RATE_LIMIT_PER_DAY = '100'

    expect((await POST(makeRequest(validBody, '203.0.113.10'))).status).toBe(200)
    expect((await POST(makeRequest(validBody, '203.0.113.10'))).status).toBe(429)
    expect((await POST(makeRequest(validBody, '203.0.113.11'))).status).toBe(200)
  })

  it('prefers x-real-ip over a client-supplied x-forwarded-for', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    process.env.CHAT_RATE_LIMIT_PER_MIN = '1'
    process.env.CHAT_RATE_LIMIT_PER_DAY = '100'

    const first = await POST(
      makeRequestWithHeaders(validBody, {
        'x-forwarded-for': '198.51.100.9',
        'x-real-ip': '203.0.113.20',
      }),
    )
    expect(first.status).toBe(200)

    // A different spoofed x-forwarded-for from the same real IP is still limited.
    const second = await POST(
      makeRequestWithHeaders(validBody, {
        'x-forwarded-for': '198.51.100.99',
        'x-real-ip': '203.0.113.20',
      }),
    )
    expect(second.status).toBe(429)
  })

  it('uses x-vercel-forwarded-for when x-real-ip is absent', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    process.env.CHAT_RATE_LIMIT_PER_MIN = '1'
    process.env.CHAT_RATE_LIMIT_PER_DAY = '100'

    const first = await POST(
      makeRequestWithHeaders(validBody, {
        'x-forwarded-for': '198.51.100.9',
        'x-vercel-forwarded-for': '203.0.113.30',
      }),
    )
    expect(first.status).toBe(200)

    const second = await POST(
      makeRequestWithHeaders(validBody, {
        'x-forwarded-for': '198.51.100.10',
        'x-vercel-forwarded-for': '203.0.113.30',
      }),
    )
    expect(second.status).toBe(429)
  })

  it('falls back to the first x-forwarded-for value when no platform header exists', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'
    process.env.CHAT_RATE_LIMIT_PER_MIN = '1'
    process.env.CHAT_RATE_LIMIT_PER_DAY = '100'

    const first = await POST(
      makeRequestWithHeaders(validBody, { 'x-forwarded-for': '203.0.113.40, 70.1.2.3' }),
    )
    expect(first.status).toBe(200)

    const second = await POST(
      makeRequestWithHeaders(validBody, { 'x-forwarded-for': '203.0.113.40, 70.9.9.9' }),
    )
    expect(second.status).toBe(429)

    const third = await POST(
      makeRequestWithHeaders(validBody, { 'x-forwarded-for': '203.0.113.41, 70.1.2.3' }),
    )
    expect(third.status).toBe(200)
  })

  it('returns 200 with a reply from the mock provider', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    const body = await readJson(res)
    expect(typeof body.reply).toBe('string')
    expect(body.reply).toContain('Digital-devs')
    expect(body.sessionId).toBe('session-1')
    expect(body.leadCaptured).toBe(false)
    expect(body.provider).toBe('mock')
    expect(typeof body.model).toBe('string')
  })

  it('replaces an empty provider reply with the friendly fallback', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const provider = getChatProvider()
    vi.spyOn(provider, 'complete').mockResolvedValue('   ')

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(200)
    expect((await readJson(res)).reply).toBe(CHAT_FALLBACK_REPLY)
  })

  it('generates a sessionId when missing', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequest({ messages: [{ role: 'user', content: 'Hola' }] }))
    expect(res.status).toBe(200)
    expect((await readJson(res)).sessionId).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('reports leadCaptured=true when a lead is sent', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(
      makeRequest({
        ...validBody,
        lead: { name: 'Ana Pérez', contact: '3001234567', method: 'whatsapp' },
      }),
    )
    expect(res.status).toBe(200)
    expect((await readJson(res)).leadCaptured).toBe(true)
  })

  it('sends the system prompt and the history to the provider', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const provider = getChatProvider()
    const completeSpy = vi.spyOn(provider, 'complete').mockResolvedValue('respuesta')

    await POST(makeRequest(validBody))

    const messages = completeSpy.mock.calls[0]?.[0]
    expect(messages?.[0]?.role).toBe('system')
    expect(messages?.[0]?.content).toContain('Digital-devs')
    expect(messages?.at(-1)).toEqual({ role: 'user', content: 'Hola' })
  })

  it('injects lead context without exposing the contact data', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const provider = getChatProvider()
    const completeSpy = vi.spyOn(provider, 'complete').mockResolvedValue('respuesta')

    await POST(
      makeRequest({
        ...validBody,
        lead: { name: 'Ana Pérez', contact: '3001234567', method: 'whatsapp' },
      }),
    )

    const messages = completeSpy.mock.calls[0]?.[0] ?? []
    const serialized = JSON.stringify(messages)
    expect(serialized).toContain('dejó sus datos de contacto')
    expect(serialized).not.toContain('3001234567')
    expect(serialized).not.toContain('Ana Pérez')
  })

  it('returns 502 when the provider fails', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'opencode-go'
    process.env.OPENCODE_API_KEY = 'secret-key'
    vi.stubGlobal('fetch', vi.fn(async () => new Response('upstream down', { status: 502 })))

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(502)
    expect(await readJson(res)).toEqual({
      error: 'No puedo responder ahora. Escríbenos por WhatsApp.',
    })
  })

  it('returns 502 when the provider throws a network error', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'opencode-go'
    process.env.OPENCODE_API_KEY = 'secret-key'
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      }),
    )

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(502)
  })

  it('returns 502 when the provider cannot be created (unknown provider)', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'nope'

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(502)
    expect(await readJson(res)).toEqual({
      error: 'No puedo responder ahora. Escríbenos por WhatsApp.',
    })
  })

  it('returns 502 when the configured provider is not implemented yet', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'anthropic'
    process.env.ANTHROPIC_API_KEY = 'some-key'

    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(502)
  })

  it('does not expose CORS headers', async () => {
    process.env.CHAT_ENABLED = 'true'
    process.env.CHAT_PROVIDER = 'mock'

    const res = await POST(makeRequest(validBody))
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})
