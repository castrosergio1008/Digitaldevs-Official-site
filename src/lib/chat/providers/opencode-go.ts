import { createHash, randomUUID } from 'node:crypto'
import { CHAT_FALLBACK_REPLY } from '../fallback'
import { ChatProviderError } from '../types'
import type { ChatMessage, ChatProvider, ChatProviderOptions } from '../types'

export const OPENCODE_GO_DEFAULT_BASE_URL = 'https://opencode.ai/inference/go/openai/v1'
export const OPENCODE_GO_DEFAULT_USER_AGENT = 'digitaldevs-chatbot/1.0'

// Canonical UUID (8-4-4-4-12), case-insensitive.
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
// A UUID already reduced to its 32 hex chars (no dashes).
const HEX32_PATTERN = /^[0-9a-f]{32}$/i

// Minimal shape of the OpenAI-compatible response we consume.
interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

/**
 * Derives the 32 lowercase hex characters that follow the `ses_` prefix in the
 * mandatory `x-opencode-session` header.
 *
 * - A canonical UUID (e.g. `550e8400-e29b-41d4-a716-446655440000`) is
 *   lowercased and stripped of dashes.
 * - A bare 32-char hex value is lowercased and used as-is.
 * - Any other identifier is hashed with SHA-256 and truncated to 32 hex
 *   chars, so the header is deterministic for the same sessionId.
 * - When no sessionId is supplied, a random UUID is generated (fresh session).
 */
export function toSessionHex(sessionId: string | undefined): string {
  const value = sessionId?.trim()
  if (!value) return randomUUID().replace(/-/g, '')

  const normalized = value.toLowerCase()
  if (UUID_PATTERN.test(normalized) || HEX32_PATTERN.test(normalized)) {
    return normalized.replace(/-/g, '')
  }
  return createHash('sha256').update(value).digest('hex').slice(0, 32)
}

/**
 * OpenCode Go provider. Go exposes an OpenAI-compatible `/chat/completions`
 * endpoint, so the request/response handling is the same as for OpenAI.
 *
 * OpenCode Go (mandatory since Sep 2026) requires every request to carry an
 * `x-opencode-session` header (`ses_` + 32 hex chars) and asks clients to
 * identify themselves with a custom User-Agent.
 */
export class OpenCodeGoProvider implements ChatProvider {
  readonly name = 'opencode-go'
  private readonly userAgent: string

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string = OPENCODE_GO_DEFAULT_BASE_URL,
    userAgent: string = process.env.CHAT_USER_AGENT ?? OPENCODE_GO_DEFAULT_USER_AGENT,
  ) {
    this.userAgent = userAgent
  }

  async complete(messages: ChatMessage[], options?: ChatProviderOptions): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
        'x-opencode-session': `ses_${toSessionHex(options?.sessionId)}`,
        'User-Agent': this.userAgent,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal: options?.signal,
    })

    if (!response.ok) {
      throw new ChatProviderError(this.name, response.status, await readSafeErrorText(response))
    }

    let data: OpenAiChatResponse | null
    try {
      data = (await response.json()) as OpenAiChatResponse | null
    } catch {
      throw new ChatProviderError(this.name, response.status, 'Invalid provider response')
    }

    const content = data?.choices?.[0]?.message?.content
    const reply = typeof content === 'string' ? content.trim() : ''
    // A blank or missing content is still a successful HTTP call, but the
    // visitor would see an empty bubble; answer with the friendly fallback.
    return reply || CHAT_FALLBACK_REPLY
  }
}

/**
 * Reads a short, sanitized excerpt of the provider error body. Provider bodies
 * are never forwarded to the client; this is only for server-side logs.
 */
async function readSafeErrorText(response: Response, maxLength = 200): Promise<string> {
  let raw = ''
  try {
    raw = await response.text()
  } catch {
    return `Provider request failed with status ${response.status}`
  }

  // Strip control characters without embedding them literally in the source.
  const cleaned = raw
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code >= 32 && code !== 127
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned) return `Provider request failed with status ${response.status}`
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength)}…` : cleaned
}
