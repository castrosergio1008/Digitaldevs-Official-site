import type { LeadMethod } from '@/lib/chat/types'

/** Where a lead came from. `chip` is reserved for a future quick-contact chip. */
export const LEAD_SOURCES = ['form', 'detection', 'chip'] as const
export type LeadSource = (typeof LEAD_SOURCES)[number]

/** The anonymous events that make up the chat funnel (design doc section 4.4). */
export const CHAT_EVENT_NAMES = [
  'chat_opened',
  'lead_captured',
  'whatsapp_clicked',
  'diagnosis_completed',
  'lead_attempt',
] as const
export type ChatEventName = (typeof CHAT_EVENT_NAMES)[number]

/**
 * Events the browser is allowed to emit. `lead_captured` is deliberately
 * excluded: only the server may emit it, because it is the source of truth
 * that the lead was actually persisted (design doc section 4.4).
 */
export const CLIENT_EVENT_NAMES = [
  'chat_opened',
  'whatsapp_clicked',
  'diagnosis_completed',
  'lead_attempt',
] as const
export type ClientEventName = (typeof CLIENT_EVENT_NAMES)[number]

/** Metadata keys allowed on an event. Values are validated per key. */
export const EVENT_METADATA_KEYS = ['source', 'reason', 'method', 'messageCount'] as const
export type EventMetadataKey = (typeof EVENT_METADATA_KEYS)[number]

/** A persisted commercial lead. `sessionIdHash` is pseudonymous, never the raw id. */
export interface LeadRecord {
  id: string
  name: string
  contact: string
  method: LeadMethod
  sessionIdHash: string
  source: LeadSource
  path: string | null
  context: string | null
  notifiedAt: Date | null
  createdAt: Date
}

/** A persisted anonymous chat event. It never contains PII. */
export interface ChatEventRecord {
  id: string | number
  eventName: ChatEventName
  sessionIdHash: string
  path: string | null
  metadata: Record<string, unknown>
  createdAt: Date
}

export interface CreateLeadInput {
  name: string
  contact: string
  method: LeadMethod
  sessionIdHash: string
  source: LeadSource
  path: string | null
  context: string | null
}

export interface CreateEventInput {
  eventName: ChatEventName
  sessionIdHash: string
  path: string | null
  metadata: Record<string, unknown>
}

export interface UpsertLeadResult {
  record: LeadRecord
  /** True when the lead was inserted; false when an existing session was updated. */
  created: boolean
}

/**
 * Persistence boundary for leads. The route handler depends only on this
 * interface, so Supabase can be swapped for another store without touching the
 * API contract (design doc section 4.1).
 */
export interface LeadStore {
  /** Inserts the lead or updates the single lead already bound to the session. */
  upsertBySession(input: CreateLeadInput): Promise<UpsertLeadResult>
  findById(id: string): Promise<LeadRecord | null>
  /** Marks the moment the team was notified; a no-op when notification is off. */
  markNotified(id: string): Promise<void>
}

/** Persistence boundary for anonymous chat events. */
export interface EventStore {
  insert(input: CreateEventInput): Promise<ChatEventRecord>
}
