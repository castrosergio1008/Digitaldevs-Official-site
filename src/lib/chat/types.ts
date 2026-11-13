// Shared chat contracts. These types are safe to import from both server code
// and (in a later phase) client components; they contain no secrets.

export type ChatRole = 'system' | 'user' | 'assistant'

export interface ChatMessage {
  role: ChatRole
  content: string
}

/**
 * Abstraction over an AI provider so the route handler never depends on a
 * concrete vendor. The MVP implements `complete`; `stream` is reserved for a
 * future iteration (design doc section 4.8).
 */
export interface ChatProvider {
  /** Provider identifier, e.g. "opencode-go" or "mock". */
  readonly name: string
  /** Returns the full assistant reply. */
  complete(messages: ChatMessage[], signal?: AbortSignal): Promise<string>
  /** Optional streaming interface (Phase 2). */
  stream?(messages: ChatMessage[], signal?: AbortSignal): AsyncIterable<string>
}

/**
 * Error raised by a provider.
 *
 * `name` identifies the provider that failed (it shadows `Error.name` on
 * purpose, so logs can group by provider). `status` is the upstream HTTP status
 * (0 when not applicable) and `safeMessage` is a short, non-sensitive
 * description that is safe to log.
 */
export class ChatProviderError extends Error {
  readonly status: number
  readonly safeMessage: string

  constructor(name: string, status: number, safeMessage: string) {
    super(safeMessage)
    this.name = name
    this.status = status
    this.safeMessage = safeMessage
  }
}

export type LeadMethod = 'whatsapp' | 'email'

export interface LeadPayload {
  name: string
  contact: string
  method: LeadMethod
}

export interface ChatRequest {
  sessionId?: string
  messages: ChatMessage[]
  lead?: LeadPayload
}

export interface ChatResponse {
  reply: string
  sessionId: string
  leadCaptured: boolean
  provider: string
  model: string
}
