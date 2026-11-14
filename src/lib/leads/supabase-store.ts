import type {
  ChatEventRecord,
  CreateEventInput,
  CreateLeadInput,
  EventStore,
  LeadRecord,
  LeadStore,
  UpsertLeadResult,
} from './stores'
import type { LeadMethod } from '@/lib/chat/types'

/** Row shape returned by PostgREST (snake_case columns). */
interface SupabaseLeadRow {
  id: string
  name: string
  contact: string
  method: string
  session_id_hash: string
  source: string
  path: string | null
  context: string | null
  notified_at: string | null
  created_at: string
}

interface SupabaseEventRow {
  id: string
  event_name: string
  session_id_hash: string
  path: string | null
  metadata: Record<string, unknown>
  created_at: string
}

/** Outgoing PostgREST calls must never hang the request. */
export const SUPABASE_TIMEOUT_MS = 10_000

/** Error raised when PostgREST answers with a non-2xx status. */
export class SupabaseStoreError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message)
    this.name = 'SupabaseStoreError'
  }
}

function isConflict(error: unknown): boolean {
  return error instanceof SupabaseStoreError && error.status === 409
}

/**
 * Thin PostgREST client. The browser never talks to Supabase directly: the
 * service role key stays on the server and every call goes through these route
 * handlers (design doc section 4.1).
 */
async function supabaseRequest<T>(
  baseUrl: string,
  apiKey: string,
  path: string,
  init: RequestInit,
  fetchImpl: typeof fetch,
): Promise<T> {
  const url = `${baseUrl.replace(/\/+$/, '')}/rest/v1/${path}`
  const response = await fetchImpl(url, {
    ...init,
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
    signal: init.signal ?? AbortSignal.timeout(SUPABASE_TIMEOUT_MS),
  })

  if (!response.ok) {
    // Drain the body so the connection can be reused; never log it (it may
    // echo request data on some errors).
    await response.text().catch(() => '')
    throw new SupabaseStoreError(response.status, `Supabase request failed with ${response.status}`)
  }

  if (response.status === 204) return undefined as T
  return (await response.json()) as T
}

function mapLeadRow(row: SupabaseLeadRow): LeadRecord {
  return {
    id: row.id,
    name: row.name,
    contact: row.contact,
    method: row.method as LeadMethod,
    sessionIdHash: row.session_id_hash,
    source: row.source as LeadRecord['source'],
    path: row.path,
    context: row.context,
    notifiedAt: row.notified_at ? new Date(row.notified_at) : null,
    createdAt: new Date(row.created_at),
  }
}

function mapEventRow(row: SupabaseEventRow): ChatEventRecord {
  return {
    id: row.id,
    eventName: row.event_name as ChatEventRecord['eventName'],
    sessionIdHash: row.session_id_hash,
    path: row.path,
    metadata: row.metadata,
    createdAt: new Date(row.created_at),
  }
}

/**
 * Lead persistence on Supabase (PostgreSQL). The "max one lead per session"
 * rule is enforced by a unique index on `session_id_hash`: the first insert
 * wins and any later submit updates the same row instead of duplicating it.
 */
export class SupabaseLeadStore implements LeadStore {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly fetchImpl: typeof fetch

  constructor(baseUrl: string, apiKey: string, fetchImpl: typeof fetch = fetch) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.fetchImpl = fetchImpl
  }

  async upsertBySession(input: CreateLeadInput): Promise<UpsertLeadResult> {
    try {
      const record = await this.insert(input)
      return { record, created: true }
    } catch (error) {
      if (isConflict(error)) {
        const record = await this.updateBySession(input)
        return { record, created: false }
      }
      throw error
    }
  }

  async findById(id: string): Promise<LeadRecord | null> {
    const rows = await this.request<SupabaseLeadRow[]>(
      `leads?id=eq.${encodeURIComponent(id)}&select=*`,
      { method: 'GET' },
    )
    return rows[0] ? mapLeadRow(rows[0]) : null
  }

  async markNotified(id: string): Promise<void> {
    await this.request('leads?id=eq.' + encodeURIComponent(id), {
      method: 'PATCH',
      body: JSON.stringify({ notified_at: new Date().toISOString() }),
    })
  }

  private async insert(input: CreateLeadInput): Promise<LeadRecord> {
    const rows = await this.request<SupabaseLeadRow[]>('leads', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        name: input.name,
        contact: input.contact,
        method: input.method,
        session_id_hash: input.sessionIdHash,
        source: input.source,
        path: input.path,
        context: input.context,
      }),
    })
    const row = rows[0]
    if (!row) throw new SupabaseStoreError(500, 'Lead insert returned no row')
    return mapLeadRow(row)
  }

  private async updateBySession(input: CreateLeadInput): Promise<LeadRecord> {
    const rows = await this.request<SupabaseLeadRow[]>(
      `leads?session_id_hash=eq.${encodeURIComponent(input.sessionIdHash)}`,
      {
        method: 'PATCH',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          name: input.name,
          contact: input.contact,
          method: input.method,
          source: input.source,
          path: input.path,
          context: input.context,
        }),
      },
    )
    const row = rows[0]
    if (!row) throw new SupabaseStoreError(404, 'Lead not found for session')
    return mapLeadRow(row)
  }

  private request<T>(path: string, init: RequestInit): Promise<T> {
    return supabaseRequest<T>(this.baseUrl, this.apiKey, path, init, this.fetchImpl)
  }
}

/** Anonymous event persistence on Supabase. No PII is ever written. */
export class SupabaseEventStore implements EventStore {
  private readonly baseUrl: string
  private readonly apiKey: string
  private readonly fetchImpl: typeof fetch

  constructor(baseUrl: string, apiKey: string, fetchImpl: typeof fetch = fetch) {
    this.baseUrl = baseUrl
    this.apiKey = apiKey
    this.fetchImpl = fetchImpl
  }

  async insert(input: CreateEventInput): Promise<ChatEventRecord> {
    const rows = await this.request<SupabaseEventRow[]>('chat_events', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        event_name: input.eventName,
        session_id_hash: input.sessionIdHash,
        path: input.path,
        metadata: input.metadata,
      }),
    })
    const row = rows[0]
    if (!row) throw new SupabaseStoreError(500, 'Event insert returned no row')
    return mapEventRow(row)
  }

  private request<T>(path: string, init: RequestInit): Promise<T> {
    return supabaseRequest<T>(this.baseUrl, this.apiKey, path, init, this.fetchImpl)
  }
}
