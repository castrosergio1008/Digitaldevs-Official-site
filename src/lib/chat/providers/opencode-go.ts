import { CHAT_FALLBACK_REPLY } from '../fallback'
import { ChatProviderError } from '../types'
import type { ChatMessage, ChatProvider } from '../types'

export const OPENCODE_GO_DEFAULT_BASE_URL = 'https://opencode.ai/inference/go/openai/v1'

// Minimal shape of the OpenAI-compatible response we consume.
interface OpenAiChatResponse {
  choices?: Array<{ message?: { content?: string } }>
}

/**
 * OpenCode Go provider. Go exposes an OpenAI-compatible `/chat/completions`
 * endpoint, so the request/response handling is the same as for OpenAI.
 */
export class OpenCodeGoProvider implements ChatProvider {
  readonly name = 'opencode-go'

  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly baseUrl: string = OPENCODE_GO_DEFAULT_BASE_URL,
  ) {}

  async complete(messages: ChatMessage[], signal?: AbortSignal): Promise<string> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.3,
        max_tokens: 600,
      }),
      signal,
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
