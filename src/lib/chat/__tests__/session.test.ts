import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  CHAT_STORAGE_KEY,
  MAX_STORED_MESSAGES,
  MAX_TOTAL_CHARS,
  clearChatSession,
  createSessionId,
  isStoredChatSession,
  loadChatSession,
  saveChatSession,
  trimMessages,
} from '../session'
import type { ChatMessage } from '../types'

/** Minimal in-memory Storage so the helpers can be tested under Vitest's node env. */
class MemoryStorage implements Storage {
  private readonly store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
}

let storage: MemoryStorage

beforeEach(() => {
  storage = new MemoryStorage()
  vi.stubGlobal('window', { localStorage: storage })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function makeMessages(count: number): ChatMessage[] {
  return Array.from({ length: count }, (_, index) => ({
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Mensaje ${index}`,
  }))
}

describe('createSessionId', () => {
  it('generates UUID-shaped identifiers', () => {
    expect(createSessionId()).toMatch(/^[0-9a-f-]{36}$/)
  })

  it('generates unique identifiers', () => {
    expect(createSessionId()).not.toBe(createSessionId())
  })
})

describe('saveChatSession / loadChatSession', () => {
  it('round-trips the session without losing messages or lead', () => {
    const lead = { name: 'Ana Pérez', contact: '3001234567', method: 'whatsapp' as const }
    const session = {
      id: 'session-1',
      messages: makeMessages(3),
      lead,
      updatedAt: 1_700_000_000_000,
    }

    expect(saveChatSession(session)).toBe(true)
    expect(loadChatSession()).toEqual(session)
  })

  it('trims the history on save so a bad caller cannot poison future loads', () => {
    const session = {
      id: 'session-2',
      messages: makeMessages(MAX_STORED_MESSAGES + 5),
      updatedAt: 1,
    }

    expect(saveChatSession(session)).toBe(true)
    const loaded = loadChatSession()
    expect(loaded?.messages).toHaveLength(MAX_STORED_MESSAGES)
  })

  it('returns null when nothing is stored', () => {
    expect(loadChatSession()).toBeNull()
  })

  it('returns null and clears a corrupt payload', () => {
    storage.setItem(CHAT_STORAGE_KEY, '{not json')
    expect(loadChatSession()).toBeNull()
    expect(storage.getItem(CHAT_STORAGE_KEY)).toBeNull()
  })

  it('returns null for an invalid session shape', () => {
    storage.setItem(CHAT_STORAGE_KEY, JSON.stringify({ id: 'x', messages: 'nope' }))
    expect(loadChatSession()).toBeNull()
  })

  it('returns null on the server (no window)', () => {
    vi.unstubAllGlobals()
    expect(loadChatSession()).toBeNull()
  })

  it('does not touch window at module scope', () => {
    // Importing the module already happened; calling save without a window is a no-op.
    vi.unstubAllGlobals()
    expect(saveChatSession({ id: 'x', messages: [], updatedAt: 1 })).toBe(false)
    expect(clearChatSession()).toBeUndefined()
  })
})

describe('clearChatSession', () => {
  it('removes the stored session', () => {
    saveChatSession({ id: 'session-3', messages: makeMessages(1), updatedAt: 1 })
    expect(loadChatSession()).not.toBeNull()

    clearChatSession()
    expect(loadChatSession()).toBeNull()
  })
})

describe('isStoredChatSession', () => {
  it('accepts a minimal valid session', () => {
    expect(isStoredChatSession({ id: 'abc', messages: [], updatedAt: 1 })).toBe(true)
  })

  it('rejects system roles and oversized content', () => {
    expect(
      isStoredChatSession({
        id: 'abc',
        messages: [{ role: 'system', content: 'hola' }],
        updatedAt: 1,
      }),
    ).toBe(false)
    expect(
      isStoredChatSession({
        id: 'abc',
        messages: [{ role: 'user', content: 'a'.repeat(801) }],
        updatedAt: 1,
      }),
    ).toBe(false)
  })

  it('rejects an invalid lead', () => {
    expect(
      isStoredChatSession({
        id: 'abc',
        messages: [],
        lead: { name: 'A', contact: '12345', method: 'whatsapp' },
        updatedAt: 1,
      }),
    ).toBe(false)
  })
})

describe('trimMessages', () => {
  it('keeps the most recent messages when over the turn limit', () => {
    const trimmed = trimMessages(makeMessages(25))
    expect(trimmed).toHaveLength(MAX_STORED_MESSAGES)
    expect(trimmed.at(-1)?.content).toBe('Mensaje 24')
  })

  it('drops the oldest messages to respect the character budget', () => {
    const long = Array.from({ length: 10 }, (_, index) => ({
      role: 'user' as const,
      content: `${index}`.repeat(800),
    }))
    const trimmed = trimMessages(long)
    const total = trimmed.reduce((sum, message) => sum + message.content.length, 0)
    expect(total).toBeLessThanOrEqual(MAX_TOTAL_CHARS)
    expect(trimmed.length).toBeLessThan(long.length)
    expect(trimmed.at(-1)?.content).toBe(long.at(-1)?.content)
  })

  it('always keeps at least one message', () => {
    const trimmed = trimMessages(
      [
        { role: 'user', content: 'a'.repeat(800) },
        { role: 'assistant', content: 'b'.repeat(800) },
      ],
      20,
      800,
    )
    expect(trimmed).toHaveLength(1)
  })

  it('clips single-message content and ignores system turns', () => {
    const trimmed = trimMessages([
      { role: 'system', content: 'prompt' },
      { role: 'user', content: 'a'.repeat(900) },
    ])
    expect(trimmed).toHaveLength(1)
    expect(trimmed[0]?.role).toBe('user')
    expect(trimmed[0]?.content).toHaveLength(800)
  })
})
