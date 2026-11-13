import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CHAT_FALLBACK_REPLY } from '../fallback'
import { ChatProviderError } from '../types'
import type { ChatMessage } from '../types'
import { __resetChatProviderForTests, getChatProvider } from '../provider'
import { OpenCodeGoProvider } from '../providers/opencode-go'
import { MockProvider } from '../providers/mock'

const ENV_KEYS = ['CHAT_PROVIDER', 'OPENCODE_API_KEY', 'CHAT_MODEL', 'CHAT_USER_AGENT'] as const
let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
  __resetChatProviderForTests()
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  __resetChatProviderForTests()
  vi.unstubAllGlobals()
})

describe('OpenCodeGoProvider', () => {
  it('calls the OpenAI-compatible endpoint with the bearer token', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: '  Hola  ' } }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const reply = await provider.complete([{ role: 'user', content: 'Hola' }])

    expect(reply).toBe('Hola')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const call = fetchMock.mock.calls[0]
    expect(call?.[0]).toBe('https://opencode.ai/inference/go/openai/v1/chat/completions')

    const init = call?.[1] as RequestInit
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer secret-key')
    expect(headers['Content-Type']).toBe('application/json')
    expect(headers['x-opencode-session']).toMatch(/^ses_[0-9a-f]{32}$/)
    expect(headers['User-Agent']).toBe('digitaldevs-chatbot/1.0')

    const body = JSON.parse(init.body as string) as {
      model: string
      temperature: number
      max_tokens: number
      messages: unknown[]
    }
    expect(body.model).toBe('claude-haiku-5-5')
    expect(body.temperature).toBe(0.3)
    expect(body.max_tokens).toBe(600)
    expect(body.messages).toEqual([{ role: 'user', content: 'Hola' }])
  })

  it('maps a non-OK response to ChatProviderError', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response('upstream boom', { status: 500 })))
    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')

    const error = await provider
      .complete([{ role: 'user', content: 'Hola' }])
      .then(() => null)
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ChatProviderError)
    const providerError = error as ChatProviderError
    expect(providerError.name).toBe('opencode-go')
    expect(providerError.status).toBe(500)
    expect(providerError.safeMessage).toContain('upstream boom')
    // The API key must never appear in the error.
    expect(providerError.safeMessage).not.toContain('secret-key')
    expect(providerError.message).not.toContain('secret-key')
  })

  it('maps an invalid JSON body to ChatProviderError', async () => {
    vi.stubGlobal('fetch', vi.fn<typeof fetch>(async () => new Response('not json', { status: 200 })))
    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')

    const error = await provider
      .complete([{ role: 'user', content: 'Hola' }])
      .then(() => null)
      .catch((caught: unknown) => caught)

    expect(error).toBeInstanceOf(ChatProviderError)
    expect((error as ChatProviderError).safeMessage).toContain('Invalid provider response')
  })

  it('returns the friendly fallback when the reply is blank', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: '   ' } }] }), {
          status: 200,
        }),
      ),
    )
    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const reply = await provider.complete([{ role: 'user', content: 'Hola' }])
    expect(reply).toBe(CHAT_FALLBACK_REPLY)
  })

  it('returns the friendly fallback when the reply is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => new Response(JSON.stringify({ choices: [{}] }), { status: 200 })),
    )
    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const reply = await provider.complete([{ role: 'user', content: 'Hola' }])
    expect(reply).toBe(CHAT_FALLBACK_REPLY)
  })

  it('passes the AbortSignal to fetch', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const controller = new AbortController()
    await provider.complete([{ role: 'user', content: 'Hola' }], { signal: controller.signal })

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(controller.signal)
  })

  it('rejects when the signal is already aborted', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>(async () => {
        throw new DOMException('The operation was aborted.', 'AbortError')
      }),
    )
    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const controller = new AbortController()
    controller.abort()

    await expect(
      provider.complete([{ role: 'user', content: 'Hola' }], { signal: controller.signal }),
    ).rejects.toBeTruthy()
  })

  it('accepts a custom base URL', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'model', 'https://example.test/v1')
    await provider.complete([{ role: 'user', content: 'Hola' }])

    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://example.test/v1/chat/completions')
  })

  it('sends a normalized x-opencode-session header for a UUID sessionId', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    await provider.complete([{ role: 'user', content: 'Hola' }], {
      sessionId: '550E8400-E29B-41D4-A716-446655440000',
    })

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['x-opencode-session']).toBe('ses_550e8400e29b41d4a716446655440000')
  })

  it('keeps the session header stable for the same sessionId and changes it for another', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hola' }]

    await provider.complete(messages, { sessionId: 'session-1' })
    await provider.complete(messages, { sessionId: 'session-1' })
    await provider.complete(messages, { sessionId: 'session-2' })

    const headerAt = (index: number): string =>
      (fetchMock.mock.calls[index]?.[1]?.headers as Record<string, string>)['x-opencode-session']

    expect(headerAt(0)).toMatch(/^ses_[0-9a-f]{32}$/)
    expect(headerAt(1)).toBe(headerAt(0))
    expect(headerAt(2)).not.toBe(headerAt(0))
  })

  it('derives a deterministic 32-hex session header for a non-UUID sessionId', async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    const messages: ChatMessage[] = [{ role: 'user', content: 'Hola' }]

    await provider.complete(messages, { sessionId: 'visitor-42' })
    const first = (fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>)[
      'x-opencode-session'
    ]
    await provider.complete(messages, { sessionId: 'visitor-42' })
    const second = (fetchMock.mock.calls[1]?.[1]?.headers as Record<string, string>)[
      'x-opencode-session'
    ]

    expect(first).toMatch(/^ses_[0-9a-f]{32}$/)
    expect(second).toBe(first)
    // Hashed, not the raw identifier.
    expect(first).not.toContain('visitor-42')
  })

  it('honours CHAT_USER_AGENT over the default', async () => {
    process.env.CHAT_USER_AGENT = 'digitaldevs-chatbot/9.9'
    const fetchMock = vi.fn<typeof fetch>(async () =>
      new Response(JSON.stringify({ choices: [{ message: { content: 'ok' } }] }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const provider = new OpenCodeGoProvider('secret-key', 'claude-haiku-5-5')
    await provider.complete([{ role: 'user', content: 'Hola' }])

    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>
    expect(headers['User-Agent']).toBe('digitaldevs-chatbot/9.9')
  })
})

describe('MockProvider', () => {
  it('answers a greeting deterministically', async () => {
    const provider = new MockProvider()
    const first = await provider.complete([{ role: 'user', content: 'Hola' }])
    const second = await provider.complete([{ role: 'user', content: 'Hola' }])
    expect(first).toContain('Digital-devs')
    expect(first).toBe(second)
  })

  it('recognises a price intent', async () => {
    const provider = new MockProvider()
    const reply = await provider.complete([{ role: 'user', content: '¿Cuánto cuesta?' }])
    expect(reply.toLowerCase()).toContain('precio')
  })

  it('falls back to a no sé answer', async () => {
    const provider = new MockProvider()
    const reply = await provider.complete([{ role: 'user', content: 'xyzq' }])
    expect(reply.toLowerCase()).toContain('no estoy seguro')
  })

  it('ignores trailing system context messages', async () => {
    const provider = new MockProvider()
    const reply = await provider.complete([
      { role: 'system', content: 'prompt' },
      { role: 'user', content: 'Hola' },
      { role: 'system', content: 'contexto del lead' },
    ])
    expect(reply).toContain('Digital-devs')
  })
})

describe('getChatProvider', () => {
  it('returns a MockProvider when CHAT_PROVIDER=mock', () => {
    process.env.CHAT_PROVIDER = 'mock'
    expect(getChatProvider()).toBeInstanceOf(MockProvider)
  })

  it('returns an OpenCodeGoProvider with the key and model', () => {
    process.env.CHAT_PROVIDER = 'opencode-go'
    process.env.OPENCODE_API_KEY = 'secret-key'
    process.env.CHAT_MODEL = 'test-model'
    const provider = getChatProvider()
    expect(provider).toBeInstanceOf(OpenCodeGoProvider)
    expect(provider.name).toBe('opencode-go')
  })

  it('caches the provider', () => {
    process.env.CHAT_PROVIDER = 'mock'
    expect(getChatProvider()).toBe(getChatProvider())
  })

  it('throws when the key is missing', () => {
    process.env.CHAT_PROVIDER = 'opencode-go'
    expect(() => getChatProvider()).toThrow(/OPENCODE_API_KEY/)
  })

  it('throws a clear error for planned providers', () => {
    process.env.CHAT_PROVIDER = 'anthropic'
    expect(() => getChatProvider()).toThrow(/not implemented yet/)

    __resetChatProviderForTests()
    process.env.CHAT_PROVIDER = 'openai'
    expect(() => getChatProvider()).toThrow(/not implemented yet/)
  })

  it('throws for unknown providers', () => {
    process.env.CHAT_PROVIDER = 'nope'
    expect(() => getChatProvider()).toThrow(/Unknown chat provider/)
  })
})
