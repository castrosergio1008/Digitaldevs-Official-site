import type { ChatMessage, LeadPayload } from './types'

/** localStorage key that holds the visitor's conversation. */
export const CHAT_STORAGE_KEY = 'digitaldevs-chat-session'

/** Mirrors the server limits so the client never sends an invalid payload. */
export const MAX_STORED_MESSAGES = 20
export const MAX_MESSAGE_CHARS = 800
export const MAX_TOTAL_CHARS = 4_000
export const MAX_SESSION_ID_LENGTH = 64

/**
 * Conversation persisted in the browser. Only user/assistant turns are stored;
 * system prompts never leave the server.
 */
export interface StoredChatSession {
  id: string
  messages: ChatMessage[]
  lead?: LeadPayload
  updatedAt: number
}

/**
 * Returns the localStorage instance, or null on the server / when access is
 * blocked. Never touches `window` at module scope so SSR stays safe.
 */
function getStorage(): Storage | null {
  if (typeof window === 'undefined') return null
  try {
    return window.localStorage
  } catch {
    return null
  }
}

/** Generates a new client-side session id (UUID when available). */
export function createSessionId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  // Fallback for browsers without crypto.randomUUID: still unique per visit.
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** True when the value matches the persisted session shape. */
export function isStoredChatSession(value: unknown): value is StoredChatSession {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const record = value as Record<string, unknown>

  if (typeof record.id !== 'string' || record.id.length < 1 || record.id.length > MAX_SESSION_ID_LENGTH) {
    return false
  }
  if (!Array.isArray(record.messages) || record.messages.length > MAX_STORED_MESSAGES) return false
  for (const message of record.messages) {
    if (typeof message !== 'object' || message === null) return false
    const item = message as Record<string, unknown>
    if (item.role !== 'user' && item.role !== 'assistant') return false
    if (typeof item.content !== 'string' || item.content.length < 1 || item.content.length > MAX_MESSAGE_CHARS) {
      return false
    }
  }
  if (record.lead !== undefined && !isLeadPayload(record.lead)) return false
  if (typeof record.updatedAt !== 'number' || !Number.isFinite(record.updatedAt)) return false

  return true
}

function isLeadPayload(value: unknown): value is LeadPayload {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  const lead = value as Record<string, unknown>
  return (
    typeof lead.name === 'string' &&
    lead.name.length >= 2 &&
    lead.name.length <= 80 &&
    typeof lead.contact === 'string' &&
    lead.contact.length >= 5 &&
    lead.contact.length <= 40 &&
    (lead.method === 'whatsapp' || lead.method === 'email')
  )
}

/**
 * Loads the stored conversation. Returns null when nothing valid is stored
 * (first visit, corrupt payload or storage blocked); a corrupt payload is
 * cleared so the next visit starts clean.
 */
export function loadChatSession(): StoredChatSession | null {
  const storage = getStorage()
  if (!storage) return null

  let raw: string | null = null
  try {
    raw = storage.getItem(CHAT_STORAGE_KEY)
  } catch {
    return null
  }
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    clearChatSession()
    return null
  }

  if (!isStoredChatSession(parsed)) {
    clearChatSession()
    return null
  }
  return parsed
}

/**
 * Persists the conversation, trimming it to the supported limits first so a
 * malformed caller can never poison future loads. Returns false when storage
 * is unavailable.
 */
export function saveChatSession(session: StoredChatSession): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify({ ...session, messages: trimMessages(session.messages) }),
    )
    return true
  } catch {
    return false
  }
}

/** Removes the stored conversation. */
export function clearChatSession(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    storage.removeItem(CHAT_STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
}

/**
 * Keeps the conversation within the limits accepted by `/api/chat`: at most
 * `maxMessages` turns and roughly `maxTotalChars` characters, always keeping
 * the most recent context. Message content is clipped to a single-message cap.
 */
export function trimMessages(
  messages: ChatMessage[],
  maxMessages: number = MAX_STORED_MESSAGES,
  maxTotalChars: number = MAX_TOTAL_CHARS,
): ChatMessage[] {
  const clipped = messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({ ...message, content: message.content.slice(0, MAX_MESSAGE_CHARS) }))

  const kept = clipped.slice(-maxMessages)
  let total = kept.reduce((sum, message) => sum + message.content.length, 0)

  while (total > maxTotalChars && kept.length > 1) {
    const removed = kept.shift()
    if (removed) total -= removed.content.length
  }
  return kept
}
