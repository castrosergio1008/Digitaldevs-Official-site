import { EMAIL_PATTERN } from '@/lib/chat/email'
import { redactContactInfo, validateLead } from '@/lib/chat/lead'
import type { LeadMethod } from '@/lib/chat/types'
import {
  CLIENT_EVENT_NAMES,
  LEAD_SOURCES,
  type ChatEventName,
  type ClientEventName,
  type LeadSource,
} from './stores'

export const MAX_LEAD_PAYLOAD_BYTES = 4 * 1024
export const MAX_EVENT_PAYLOAD_BYTES = 4 * 1024
export const MAX_SESSION_ID_LENGTH = 64
export const MAX_PATH_LENGTH = 500
export const MAX_CONTEXT_LENGTH = 500
export const MAX_METADATA_BYTES = 512
export const MAX_METADATA_KEYS = 4
export const MAX_MESSAGE_COUNT = 1_000

/** Normalized `/api/leads` request. */
export interface LeadRequest {
  name: string
  contact: string
  method: LeadMethod
  sessionId: string
  source: LeadSource
  path: string | null
  context: string | null
}

/** Normalized `/api/events` request. */
export interface EventRequest {
  eventName: ChatEventName
  sessionId: string
  path: string | null
  metadata: Record<string, unknown>
}

export type ParseLeadRequestResult =
  | { ok: true; data: LeadRequest }
  | { ok: false; error: string }

export type ParseEventRequestResult =
  | { ok: true; data: EventRequest }
  | { ok: false; error: string }

/**
 * Validates an unknown `/api/leads` body. Name/contact/method are validated
 * with the same `validateLead` used by the client form, so both sides enforce
 * the same contract; the extra fields are validated here because the client
 * cannot be trusted.
 */
export function parseLeadRequest(body: unknown): ParseLeadRequestResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }

  const { name, contact, method } = body
  if (typeof name !== 'string' || typeof contact !== 'string') {
    return { ok: false, error: 'name and contact must be strings' }
  }
  if (method !== 'whatsapp' && method !== 'email') {
    return { ok: false, error: 'method must be "whatsapp" or "email"' }
  }

  const leadResult = validateLead({ name, contact, method })
  if (!leadResult.ok) return { ok: false, error: leadResult.error }
  const lead = leadResult.lead

  // Defense in depth: `validateLead` already enforces the email pattern, but
  // the store must never receive a malformed address.
  if (lead.method === 'email' && !EMAIL_PATTERN.test(lead.contact)) {
    return { ok: false, error: 'lead.contact must be a valid email address' }
  }

  const sessionId = body.sessionId
  if (
    typeof sessionId !== 'string' ||
    sessionId.length < 1 ||
    sessionId.length > MAX_SESSION_ID_LENGTH
  ) {
    return {
      ok: false,
      error: `sessionId must be a string of 1-${MAX_SESSION_ID_LENGTH} characters`,
    }
  }

  const source = parseSource(body.source)
  if (!source.ok) return source

  const path = parsePath(body.path)
  if (!path.ok) return path

  const context = parseContext(body.context)
  if (!context.ok) return context

  return {
    ok: true,
    data: {
      name: lead.name,
      contact: lead.contact,
      method: lead.method,
      sessionId,
      source: source.value,
      path: path.value,
      context: context.value,
    },
  }
}

/**
 * Validates an unknown `/api/events` body. Only the whitelisted event names
 * and metadata keys are accepted; anything else is rejected so PII cannot be
 * smuggled into `chat_events`.
 */
export function parseEventRequest(body: unknown): ParseEventRequestResult {
  if (!isRecord(body)) {
    return { ok: false, error: 'Request body must be a JSON object' }
  }

  const { eventName, sessionId } = body
  if (eventName === 'lead_captured') {
    // Only the server emits `lead_captured`: it certifies that the lead was
    // actually persisted. A client-emitted copy would break the funnel truth.
    return { ok: false, error: 'eventName is not accepted from the client' }
  }
  if (typeof eventName !== 'string' || !CLIENT_EVENT_NAMES.includes(eventName as ClientEventName)) {
    return { ok: false, error: `eventName must be one of: ${CLIENT_EVENT_NAMES.join(', ')}` }
  }
  if (
    typeof sessionId !== 'string' ||
    sessionId.length < 1 ||
    sessionId.length > MAX_SESSION_ID_LENGTH
  ) {
    return {
      ok: false,
      error: `sessionId must be a string of 1-${MAX_SESSION_ID_LENGTH} characters`,
    }
  }

  const path = parsePath(body.path)
  if (!path.ok) return path

  const metadata = parseMetadata(body.metadata)
  if (!metadata.ok) return metadata

  return {
    ok: true,
    data: {
      eventName: eventName as ChatEventName,
      sessionId,
      path: path.value,
      metadata: metadata.value,
    },
  }
}

function parseSource(value: unknown): { ok: true; value: LeadSource } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: 'form' }
  if (typeof value !== 'string' || !LEAD_SOURCES.includes(value as LeadSource)) {
    return { ok: false, error: `source must be one of: ${LEAD_SOURCES.join(', ')}` }
  }
  return { ok: true, value: value as LeadSource }
}

/**
 * A stored path is a page route without query params or fragments, because
 * query strings can carry PII (design doc section 4.5).
 */
function parsePath(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string' || value.length < 1 || value.length > MAX_PATH_LENGTH) {
    return { ok: false, error: `path must be a string of 1-${MAX_PATH_LENGTH} characters` }
  }
  if (!value.startsWith('/')) {
    return { ok: false, error: 'path must start with "/"' }
  }
  if (value.includes('?') || value.includes('#')) {
    return { ok: false, error: 'path must not contain query params or fragments' }
  }
  return { ok: true, value }
}

function parseContext(
  value: unknown,
): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: null }
  if (typeof value !== 'string') {
    return { ok: false, error: 'context must be a string' }
  }
  // Defense in depth: the client already redacts the summary, but the server
  // must never store contact details that a caller could inject directly into
  // the free-text context (design doc section 4.5, "context limpio de PII").
  const redacted = redactContactInfo(value).trim()
  if (redacted.length === 0) return { ok: true, value: null }
  if (redacted.length > MAX_CONTEXT_LENGTH) {
    return { ok: false, error: `context must be a string of at most ${MAX_CONTEXT_LENGTH} characters` }
  }
  return { ok: true, value: redacted }
}

const METADATA_STRING_VALUES: Record<string, readonly string[]> = {
  source: ['form', 'detection', 'chip', 'direct', 'button'],
  reason: ['summary', 'lead_form'],
  method: ['whatsapp', 'email'],
}

function parseMetadata(
  value: unknown,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  if (value === undefined || value === null) return { ok: true, value: {} }
  if (!isRecord(value)) return { ok: false, error: 'metadata must be an object' }

  const entries = Object.entries(value)
  if (entries.length > MAX_METADATA_KEYS) {
    return { ok: false, error: `metadata must contain at most ${MAX_METADATA_KEYS} keys` }
  }

  let serialized: string
  try {
    serialized = JSON.stringify(value)
  } catch {
    return { ok: false, error: 'metadata is not serializable' }
  }
  if (typeof serialized !== 'string' || serialized.length > MAX_METADATA_BYTES) {
    return { ok: false, error: `metadata must be at most ${MAX_METADATA_BYTES} bytes` }
  }

  const result: Record<string, unknown> = {}
  for (const [key, entryValue] of entries) {
    if (key === 'messageCount') {
      if (
        typeof entryValue !== 'number' ||
        !Number.isInteger(entryValue) ||
        entryValue < 0 ||
        entryValue > MAX_MESSAGE_COUNT
      ) {
        return {
          ok: false,
          error: `metadata.messageCount must be an integer between 0 and ${MAX_MESSAGE_COUNT}`,
        }
      }
      result[key] = entryValue
      continue
    }

    const allowed = METADATA_STRING_VALUES[key]
    // Static message only: the visitor controls the key, and interpolating it
    // could leak PII into the Vercel logs.
    if (!allowed) return { ok: false, error: 'metadata key is not allowed' }
    if (typeof entryValue !== 'string' || !allowed.includes(entryValue)) {
      return { ok: false, error: `metadata.${key} must be one of: ${allowed.join(', ')}` }
    }
    result[key] = entryValue
  }

  return { ok: true, value: result }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
