import { randomUUID } from 'node:crypto'
import type {
  ChatEventRecord,
  CreateEventInput,
  CreateLeadInput,
  EventStore,
  LeadRecord,
  LeadStore,
  UpsertLeadResult,
} from './stores'

/**
 * In-memory implementation used by unit tests and local development. It is
 * never used in production: the factory only selects it when
 * `LEAD_STORE=memory` / `EVENT_STORE=memory` is set explicitly.
 */
export class InMemoryLeadStore implements LeadStore {
  private readonly leads = new Map<string, LeadRecord>()
  private readonly sessionIndex = new Map<string, string>()

  async upsertBySession(input: CreateLeadInput): Promise<UpsertLeadResult> {
    const existingId = this.sessionIndex.get(input.sessionIdHash)
    const existing = existingId ? this.leads.get(existingId) : undefined

    if (existing) {
      const updated: LeadRecord = {
        ...existing,
        name: input.name,
        contact: input.contact,
        method: input.method,
        source: input.source,
        path: input.path,
        context: input.context,
      }
      this.leads.set(existing.id, updated)
      return { record: updated, created: false }
    }

    const record: LeadRecord = {
      id: randomUUID(),
      name: input.name,
      contact: input.contact,
      method: input.method,
      sessionIdHash: input.sessionIdHash,
      source: input.source,
      path: input.path,
      context: input.context,
      notifiedAt: null,
      createdAt: new Date(),
    }
    this.leads.set(record.id, record)
    this.sessionIndex.set(input.sessionIdHash, record.id)
    return { record, created: true }
  }

  async findById(id: string): Promise<LeadRecord | null> {
    return this.leads.get(id) ?? null
  }

  async markNotified(id: string): Promise<void> {
    const existing = this.leads.get(id)
    if (!existing) return
    this.leads.set(id, { ...existing, notifiedAt: new Date() })
  }

  /** Test-only helpers. */
  clear(): void {
    this.leads.clear()
    this.sessionIndex.clear()
  }

  all(): LeadRecord[] {
    return [...this.leads.values()]
  }
}

/** In-memory event sink. Keeps the most recent insert order for assertions. */
export class InMemoryEventStore implements EventStore {
  private readonly events: ChatEventRecord[] = []
  private nextId = 1

  async insert(input: CreateEventInput): Promise<ChatEventRecord> {
    const record: ChatEventRecord = {
      id: this.nextId,
      eventName: input.eventName,
      sessionIdHash: input.sessionIdHash,
      path: input.path,
      metadata: input.metadata,
      createdAt: new Date(),
    }
    this.nextId += 1
    this.events.push(record)
    return record
  }

  /** Test-only helpers. */
  clear(): void {
    this.events.length = 0
    this.nextId = 1
  }

  all(): ChatEventRecord[] {
    return [...this.events]
  }
}
