import { EMAIL_PATTERN } from './email'
import type { ChatMessage, ChatRequest, LeadPayload } from './types'

export const DEFAULT_MAX_MESSAGES = 20
export const DEFAULT_MAX_MESSAGE_LENGTH = 800
export const MAX_PAYLOAD_BYTES = 16 * 1024
export const MAX_SESSION_ID_LENGTH = 64

export type ParseChatRequestResult =
  | { ok: true; data: ChatRequest }
  | { ok: false; error: string }

export interface ParseChatRequestOptions {
  maxMessages?: number
  maxMessageLength?: number
}

type MessagesResult = { ok: true; messages: ChatMessage[] } | { ok: false; error: string }
type LeadResult = { ok: true; lead?: LeadPayload } | { ok: false; error: string }

/**
 * Validates an unknown request body against the `/api/chat` contract. On
 * success it returns a normalized request with a guaranteed `sessionId`
 * (generated when absent). On failure it returns a static, non-sensitive error
 * message suitable for logging; the route answers with a generic message.
 */
export function parseChatRequest(
  body: unknown,
  options: ParseChatRequestOptions = {},
): ParseChatRequestResult {
  const maxMessages = options.maxMessages ?? DEFAULT_MAX_MESSAGES
  const maxMessageLength = options.maxMessageLength ?? DEFAULT_MAX_MESSAGE_LENGTH

  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }

  let serializedLength: number
  try {
    const serialized = JSON.stringify(body)
    if (typeof serialized !== 'string') {
      return { ok: false, error: 'Request body is not serializable' }
    }
    serializedLength = serialized.length
  } catch {
    return { ok: false, error: 'Request body is not serializable' }
  }

  if (serializedLength > MAX_PAYLOAD_BYTES) {
    return { ok: false, error: `Request body exceeds ${MAX_PAYLOAD_BYTES} bytes` }
  }

  const messagesResult = parseMessages(body.messages, maxMessages, maxMessageLength)
  if (!messagesResult.ok) return messagesResult

  const rawSessionId = body.sessionId
  if (rawSessionId !== undefined) {
    if (
      typeof rawSessionId !== 'string' ||
      rawSessionId.length < 1 ||
      rawSessionId.length > MAX_SESSION_ID_LENGTH
    ) {
      return { ok: false, error: `sessionId must be a string of 1-${MAX_SESSION_ID_LENGTH} characters` }
    }
  }
  const sessionId = typeof rawSessionId === 'string' ? rawSessionId : crypto.randomUUID()

  const leadResult = parseLead(body.lead)
  if (!leadResult.ok) return leadResult

  const request: ChatRequest = {
    sessionId,
    messages: messagesResult.messages,
  }
  if (leadResult.lead) {
    request.lead = leadResult.lead
  }

  return { ok: true, data: request }
}

function parseMessages(value: unknown, maxMessages: number, maxMessageLength: number): MessagesResult {
  if (!Array.isArray(value)) {
    return { ok: false, error: 'messages must be an array' }
  }
  if (value.length < 1 || value.length > maxMessages) {
    return { ok: false, error: `messages must contain 1-${maxMessages} items` }
  }

  const messages: ChatMessage[] = []
  for (const item of value) {
    if (!isRecord(item)) {
      return { ok: false, error: 'each message must be an object' }
    }
    const { role, content } = item
    if (role !== 'user' && role !== 'assistant') {
      return { ok: false, error: 'message role must be "user" or "assistant"' }
    }
    if (typeof content !== 'string' || content.length < 1 || content.length > maxMessageLength) {
      return { ok: false, error: `message content must be 1-${maxMessageLength} characters` }
    }
    messages.push({ role, content })
  }

  return { ok: true, messages }
}

function parseLead(value: unknown): LeadResult {
  if (value === undefined) return { ok: true }
  if (!isRecord(value)) return { ok: false, error: 'lead must be an object' }

  const { name, contact, method } = value
  if (typeof name !== 'string' || name.length < 2 || name.length > 80) {
    return { ok: false, error: 'lead.name must be 2-80 characters' }
  }
  if (typeof contact !== 'string' || contact.length < 5 || contact.length > 40) {
    return { ok: false, error: 'lead.contact must be 5-40 characters' }
  }
  if (method !== 'whatsapp' && method !== 'email') {
    return { ok: false, error: 'lead.method must be "whatsapp" or "email"' }
  }
  // The client already validates this, but the server must not trust it: a
  // malformed email could otherwise reach the WhatsApp hand-off payload.
  if (method === 'email' && !EMAIL_PATTERN.test(contact)) {
    return { ok: false, error: 'lead.contact must be a valid email address' }
  }

  return { ok: true, lead: { name, contact, method } }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
