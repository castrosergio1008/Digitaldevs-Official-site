import { describe, expect, it, vi } from 'vitest'
import { SupabaseEventStore, SupabaseLeadStore } from '../supabase-store'
import type { CreateEventInput, CreateLeadInput } from '../stores'

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

/** Casts the first call of a 0-argument mock into a parameter tuple. */
function firstCall<Tuple extends unknown[]>(mock: ReturnType<typeof vi.fn>): Tuple {
  return mock.mock.calls[0] as unknown as Tuple
}

const leadInput: CreateLeadInput = {
  name: 'Ana Pérez',
  contact: '3001234567',
  method: 'whatsapp',
  sessionIdHash: 'hash-1',
  source: 'form',
  path: '/servicios',
  context: 'Quiere una tienda en línea.',
}

const leadRow = {
  id: 'lead-1',
  name: 'Ana Pérez',
  contact: '3001234567',
  method: 'whatsapp',
  session_id_hash: 'hash-1',
  source: 'form',
  path: '/servicios',
  context: 'Quiere una tienda en línea.',
  notified_at: null,
  created_at: '2026-11-13T14:32:00.000Z',
}

const eventInput: CreateEventInput = {
  eventName: 'lead_captured',
  sessionIdHash: 'hash-1',
  path: '/servicios',
  metadata: { method: 'whatsapp', source: 'form' },
}

const eventRow = {
  id: '1',
  event_name: 'lead_captured',
  session_id_hash: 'hash-1',
  path: '/servicios',
  metadata: { method: 'whatsapp', source: 'form' },
  created_at: '2026-11-13T14:32:00.000Z',
}

describe('SupabaseLeadStore', () => {
  it('inserts a lead through PostgREST and returns created=true', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([leadRow]))
    const store = new SupabaseLeadStore('https://example.supabase.co/', 'service-key', fetchMock)

    const result = await store.upsertBySession(leadInput)

    expect(result.created).toBe(true)
    expect(result.record.id).toBe('lead-1')
    expect(result.record.createdAt).toBeInstanceOf(Date)

    const [url, init] = firstCall<[string, RequestInit]>(fetchMock)
    expect(url).toBe('https://example.supabase.co/rest/v1/leads')
    expect(init.method).toBe('POST')
    const headers = init.headers as Record<string, string>
    expect(headers.apikey).toBe('service-key')
    expect(headers.Authorization).toBe('Bearer service-key')

    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.session_id_hash).toBe('hash-1')
    expect(body.name).toBe('Ana Pérez')
    expect(JSON.stringify(body)).not.toContain('session-1')
  })

  it('updates the existing row when the session already has a lead', async () => {
    const fetchMock = vi
      .fn(async () => jsonResponse([leadRow]))
      .mockResolvedValueOnce(jsonResponse({ message: 'duplicate key' }, 409))
    const store = new SupabaseLeadStore('https://example.supabase.co', 'service-key', fetchMock)

    const result = await store.upsertBySession(leadInput)

    expect(result.created).toBe(false)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    // The first call is the insert, the second one the conflict update.
    const [insertUrl, insertInit] = fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    expect(insertUrl).toBe('https://example.supabase.co/rest/v1/leads')
    expect(insertInit.method).toBe('POST')

    const [updateUrl, updateInit] = fetchMock.mock.calls[1] as unknown as [string, RequestInit]
    expect(updateUrl).toContain('/rest/v1/leads?session_id_hash=eq.hash-1')
    expect(updateInit.method).toBe('PATCH')
  })

  it('marks a lead as notified', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([leadRow]))
    const store = new SupabaseLeadStore('https://example.supabase.co', 'service-key', fetchMock)

    await store.markNotified('lead-1')

    const [url, init] = firstCall<[string, RequestInit]>(fetchMock)
    expect(url).toContain('/rest/v1/leads?id=eq.lead-1')
    expect(init.method).toBe('PATCH')
    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(typeof body.notified_at).toBe('string')
  })

  it('finds a lead by id and returns null when missing', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([leadRow]))
    const store = new SupabaseLeadStore('https://example.supabase.co', 'service-key', fetchMock)

    expect((await store.findById('lead-1'))?.id).toBe('lead-1')

    const emptyFetch = vi.fn(async () => jsonResponse([]))
    const emptyStore = new SupabaseLeadStore('https://example.supabase.co', 'key', emptyFetch)
    expect(await emptyStore.findById('missing')).toBeNull()
  })
})

describe('SupabaseEventStore', () => {
  it('inserts an anonymous event with no PII fields', async () => {
    const fetchMock = vi.fn(async () => jsonResponse([eventRow]))
    const store = new SupabaseEventStore('https://example.supabase.co', 'service-key', fetchMock)

    const result = await store.insert(eventInput)

    expect(result.eventName).toBe('lead_captured')
    const [url, init] = firstCall<[string, RequestInit]>(fetchMock)
    expect(url).toBe('https://example.supabase.co/rest/v1/chat_events')
    expect(init.method).toBe('POST')

    const body = JSON.parse(String(init.body)) as Record<string, unknown>
    expect(body.event_name).toBe('lead_captured')
    expect(body.session_id_hash).toBe('hash-1')
    expect(body.metadata).toEqual({ method: 'whatsapp', source: 'form' })
    // The event payload must never contain the lead name or contact.
    expect(JSON.stringify(body)).not.toContain('Ana Pérez')
    expect(JSON.stringify(body)).not.toContain('3001234567')
  })
})
