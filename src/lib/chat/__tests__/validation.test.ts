import { describe, expect, it } from 'vitest'
import { parseChatRequest } from '../validation'

const validMessages = [{ role: 'user', content: 'Hola' }]

describe('parseChatRequest', () => {
  it('accepts a minimal valid request and generates a sessionId', () => {
    const result = parseChatRequest({ messages: validMessages })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.messages).toEqual(validMessages)
    expect(result.data.sessionId).toMatch(/^[0-9a-f-]{36}$/)
    expect(result.data.lead).toBeUndefined()
  })

  it('keeps a provided sessionId', () => {
    const result = parseChatRequest({ sessionId: 'abc-123', messages: validMessages })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.sessionId).toBe('abc-123')
  })

  it('rejects a non-object body', () => {
    for (const body of [null, undefined, 'text', 42, [], true]) {
      expect(parseChatRequest(body).ok).toBe(false)
    }
  })

  it('rejects missing or non-array messages', () => {
    expect(parseChatRequest({}).ok).toBe(false)
    expect(parseChatRequest({ messages: 'nope' }).ok).toBe(false)
    expect(parseChatRequest({ messages: [] }).ok).toBe(false)
  })

  it('rejects more than 20 messages by default', () => {
    const messages = Array.from({ length: 21 }, () => ({ role: 'user', content: 'hola' }))
    expect(parseChatRequest({ messages }).ok).toBe(false)
  })

  it('honours a custom maxMessages', () => {
    const messages = Array.from({ length: 3 }, () => ({ role: 'user', content: 'hola' }))
    expect(parseChatRequest({ messages }, { maxMessages: 3 }).ok).toBe(true)
    expect(parseChatRequest({ messages }, { maxMessages: 2 }).ok).toBe(false)
  })

  it('rejects roles outside user/assistant', () => {
    expect(parseChatRequest({ messages: [{ role: 'system', content: 'hola' }] }).ok).toBe(false)
    expect(parseChatRequest({ messages: [{ role: 'bot', content: 'hola' }] }).ok).toBe(false)
  })

  it('rejects empty or too-long content', () => {
    expect(parseChatRequest({ messages: [{ role: 'user', content: '' }] }).ok).toBe(false)
    expect(parseChatRequest({ messages: [{ role: 'user', content: 'a'.repeat(801) }] }).ok).toBe(false)
    expect(parseChatRequest({ messages: [{ role: 'user', content: 'a'.repeat(800) }] }).ok).toBe(true)
  })

  it('honours a custom maxMessageLength', () => {
    expect(
      parseChatRequest({ messages: [{ role: 'user', content: 'abc' }] }, { maxMessageLength: 3 }).ok,
    ).toBe(true)
    expect(
      parseChatRequest({ messages: [{ role: 'user', content: 'abcd' }] }, { maxMessageLength: 3 }).ok,
    ).toBe(false)
  })

  it('rejects an oversized payload', () => {
    const messages = Array.from({ length: 20 }, () => ({ role: 'user', content: 'a'.repeat(800) }))
    expect(parseChatRequest({ messages }).ok).toBe(false)
  })

  it('rejects an invalid sessionId', () => {
    expect(parseChatRequest({ sessionId: '', messages: validMessages }).ok).toBe(false)
    expect(parseChatRequest({ sessionId: 'a'.repeat(65), messages: validMessages }).ok).toBe(false)
    expect(parseChatRequest({ sessionId: 42, messages: validMessages }).ok).toBe(false)
  })

  it('accepts a valid lead', () => {
    const lead = { name: 'Ana Pérez', contact: '3001234567', method: 'whatsapp' }
    const result = parseChatRequest({ messages: validMessages, lead })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.lead).toEqual(lead)
  })

  it('accepts an email lead', () => {
    const lead = { name: 'Ana Pérez', contact: 'ana@example.com', method: 'email' }
    const result = parseChatRequest({ messages: validMessages, lead })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.lead).toEqual(lead)
  })

  it('accepts a well-formed email when method is email', () => {
    const result = parseChatRequest({
      messages: validMessages,
      lead: { name: 'Ana', contact: 'ana.lopez+test@dominio.co', method: 'email' },
    })
    expect(result.ok).toBe(true)
  })

  it('rejects malformed emails when method is email', () => {
    const base = { messages: validMessages }
    for (const contact of [
      'ana@example',
      'ana@example.',
      '@example.com',
      'ana@@example.com',
      'ana example@example.com',
      'ana@exam ple.com',
    ]) {
      expect(
        parseChatRequest({ ...base, lead: { name: 'Ana', contact, method: 'email' } }).ok,
      ).toBe(false)
    }
  })

  it('does not apply the email pattern to WhatsApp leads', () => {
    const result = parseChatRequest({
      messages: validMessages,
      lead: { name: 'Ana', contact: 'ana@example.com', method: 'whatsapp' },
    })
    expect(result.ok).toBe(true)
  })

  it('rejects invalid leads', () => {
    const base = { messages: validMessages }
    expect(
      parseChatRequest({ ...base, lead: { name: 'A', contact: '3001234567', method: 'whatsapp' } }).ok,
    ).toBe(false)
    expect(
      parseChatRequest({ ...base, lead: { name: 'Ana', contact: '1234', method: 'whatsapp' } }).ok,
    ).toBe(false)
    expect(
      parseChatRequest({ ...base, lead: { name: 'Ana', contact: '3001234567', method: 'phone' } }).ok,
    ).toBe(false)
    expect(parseChatRequest({ ...base, lead: null }).ok).toBe(false)
  })
})
