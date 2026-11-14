import { describe, expect, it } from 'vitest'
import { InMemoryEventStore, InMemoryLeadStore } from '../memory-store'
import type { CreateEventInput, CreateLeadInput } from '../stores'

const leadInput: CreateLeadInput = {
  name: 'Ana Pérez',
  contact: '3001234567',
  method: 'whatsapp',
  sessionIdHash: 'hash-1',
  source: 'form',
  path: '/servicios',
  context: 'Quiere una tienda en línea.',
}

describe('InMemoryLeadStore', () => {
  it('creates a lead and reports created=true', async () => {
    const store = new InMemoryLeadStore()
    const result = await store.upsertBySession(leadInput)
    expect(result.created).toBe(true)
    expect(result.record.id).toBeTruthy()
    expect(result.record.name).toBe('Ana Pérez')
    expect(result.record.notifiedAt).toBeNull()
  })

  it('updates the same row for the same session and reports created=false', async () => {
    const store = new InMemoryLeadStore()
    const first = await store.upsertBySession(leadInput)
    const second = await store.upsertBySession({ ...leadInput, name: 'Ana López' })

    expect(second.created).toBe(false)
    expect(second.record.id).toBe(first.record.id)
    expect(second.record.name).toBe('Ana López')
    expect(store.all()).toHaveLength(1)
  })

  it('keeps different sessions as different leads', async () => {
    const store = new InMemoryLeadStore()
    await store.upsertBySession(leadInput)
    await store.upsertBySession({ ...leadInput, sessionIdHash: 'hash-2' })
    expect(store.all()).toHaveLength(2)
  })

  it('finds a lead by id and returns null when missing', async () => {
    const store = new InMemoryLeadStore()
    const result = await store.upsertBySession(leadInput)
    expect((await store.findById(result.record.id))?.id).toBe(result.record.id)
    expect(await store.findById('missing')).toBeNull()
  })

  it('marks a lead as notified without changing the rest', async () => {
    const store = new InMemoryLeadStore()
    const result = await store.upsertBySession(leadInput)
    await store.markNotified(result.record.id)
    const updated = await store.findById(result.record.id)
    expect(updated?.notifiedAt).toBeInstanceOf(Date)
    expect(updated?.name).toBe('Ana Pérez')
  })
})

const eventInput: CreateEventInput = {
  eventName: 'whatsapp_clicked',
  sessionIdHash: 'hash-1',
  path: '/servicios',
  metadata: { source: 'form' },
}

describe('InMemoryEventStore', () => {
  it('inserts events in order with incremental ids', async () => {
    const store = new InMemoryEventStore()
    const first = await store.insert(eventInput)
    const second = await store.insert({ ...eventInput, eventName: 'chat_opened' })

    expect(first.id).toBe(1)
    expect(second.id).toBe(2)
    expect(store.all().map((event) => event.eventName)).toEqual([
      'whatsapp_clicked',
      'chat_opened',
    ])
  })

  it('never stores the raw session id or PII fields', async () => {
    const store = new InMemoryEventStore()
    await store.insert(eventInput)
    const serialized = JSON.stringify(store.all())
    expect(serialized).toContain('hash-1')
    expect(serialized).not.toContain('Ana Pérez')
    expect(serialized).not.toContain('3001234567')
    expect(serialized).not.toContain('session-1')
  })
})
