import { describe, expect, it } from 'vitest'
import { parseEventRequest, parseLeadRequest } from '../validation'

const validLead = {
  name: 'Ana Pérez',
  contact: '3001234567',
  method: 'whatsapp',
  sessionId: 'session-1',
  source: 'form',
  path: '/servicios/tiendas-en-linea',
  context: 'Quiere una tienda en línea para vender ropa.',
}

describe('parseLeadRequest', () => {
  it('accepts a complete valid lead and normalizes name/contact', () => {
    const result = parseLeadRequest({ ...validLead, name: '  Ana Pérez  ', contact: '  3001234567  ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.name).toBe('Ana Pérez')
    expect(result.data.contact).toBe('3001234567')
    expect(result.data.method).toBe('whatsapp')
    expect(result.data.source).toBe('form')
    expect(result.data.path).toBe('/servicios/tiendas-en-linea')
    expect(result.data.context).toBe('Quiere una tienda en línea para vender ropa.')
  })

  it('defaults source to "form" and optional fields to null', () => {
    const result = parseLeadRequest({
      name: 'Ana Pérez',
      contact: '3001234567',
      method: 'whatsapp',
      sessionId: 'session-1',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.source).toBe('form')
    expect(result.data.path).toBeNull()
    expect(result.data.context).toBeNull()
  })

  it('rejects a non-object body', () => {
    for (const body of [null, undefined, 'text', 42, [], true]) {
      expect(parseLeadRequest(body).ok).toBe(false)
    }
  })

  it('rejects non-string name/contact', () => {
    expect(parseLeadRequest({ ...validLead, name: 42 }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, contact: null }).ok).toBe(false)
  })

  it('rejects an invalid method', () => {
    expect(parseLeadRequest({ ...validLead, method: 'phone' }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, method: undefined }).ok).toBe(false)
  })

  it('rejects names outside the 2-80 character range', () => {
    expect(parseLeadRequest({ ...validLead, name: 'A' }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, name: 'a'.repeat(81) }).ok).toBe(false)
  })

  it('rejects a malformed email when method is email', () => {
    expect(parseLeadRequest({ ...validLead, method: 'email', contact: 'ana@example' }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, method: 'email', contact: 'ana@@example.com' }).ok).toBe(false)
  })

  it('accepts a valid email when method is email', () => {
    const result = parseLeadRequest({ ...validLead, method: 'email', contact: 'ana@example.com' })
    expect(result.ok).toBe(true)
  })

  it('rejects an email address typed as a WhatsApp contact', () => {
    // `validateLead` enforces the WhatsApp digit floor, so a malformed
    // method/contact pair can never reach the store.
    expect(parseLeadRequest({ ...validLead, contact: 'ana@example.com', method: 'whatsapp' }).ok).toBe(
      false,
    )
  })

  it('rejects a missing or oversized sessionId', () => {
    expect(parseLeadRequest({ ...validLead, sessionId: undefined }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, sessionId: '' }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, sessionId: 'a'.repeat(65) }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, sessionId: 42 }).ok).toBe(false)
  })

  it('rejects an unknown source', () => {
    expect(parseLeadRequest({ ...validLead, source: 'referral' }).ok).toBe(false)
  })

  it('accepts every documented source', () => {
    for (const source of ['form', 'detection', 'chip']) {
      expect(parseLeadRequest({ ...validLead, source }).ok).toBe(true)
    }
  })

  it('rejects a path with query params or a fragment', () => {
    expect(parseLeadRequest({ ...validLead, path: '/servicios?utm_source=email' }).ok).toBe(false)
    expect(parseLeadRequest({ ...validLead, path: '/servicios#precios' }).ok).toBe(false)
  })

  it('rejects a path that does not start with "/"', () => {
    expect(parseLeadRequest({ ...validLead, path: 'servicios' }).ok).toBe(false)
  })

  it('rejects an overlong path', () => {
    expect(parseLeadRequest({ ...validLead, path: '/' + 'a'.repeat(500) }).ok).toBe(false)
  })

  it('rejects an overlong context', () => {
    expect(parseLeadRequest({ ...validLead, context: 'a'.repeat(501) }).ok).toBe(false)
  })

  it('trims a whitespace-only context to null', () => {
    const result = parseLeadRequest({ ...validLead, context: '   ' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.context).toBeNull()
  })

  it('redacts contact details injected into the context (server-side defense in depth)', () => {
    const result = parseLeadRequest({
      ...validLead,
      context: 'Escríbeme a ana@example.com o al 300 123 4567',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.context).not.toContain('ana@example.com')
    expect(result.data.context).not.toContain('3001234567')
    expect(result.data.context).toContain('[redactado]')
  })
})

const validEvent = {
  eventName: 'whatsapp_clicked',
  sessionId: 'session-1',
  path: '/servicios/tiendas-en-linea',
  metadata: { source: 'form' },
}

describe('parseEventRequest', () => {
  it('accepts a complete valid event', () => {
    const result = parseEventRequest(validEvent)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.eventName).toBe('whatsapp_clicked')
    expect(result.data.metadata).toEqual({ source: 'form' })
  })

  it('defaults path to null and metadata to an empty object', () => {
    const result = parseEventRequest({ eventName: 'chat_opened', sessionId: 'session-1' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.data.path).toBeNull()
    expect(result.data.metadata).toEqual({})
  })

  it('accepts every event name the client may emit', () => {
    for (const eventName of [
      'chat_opened',
      'whatsapp_clicked',
      'diagnosis_completed',
      'lead_attempt',
    ]) {
      expect(parseEventRequest({ ...validEvent, eventName }).ok).toBe(true)
    }
  })

  it('rejects lead_captured from the client with a static error', () => {
    const result = parseEventRequest({ ...validEvent, eventName: 'lead_captured' })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.error).toBe('eventName is not accepted from the client')
  })

  it('rejects an event name outside the whitelist', () => {
    expect(parseEventRequest({ ...validEvent, eventName: 'page_viewed' }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, eventName: 'user_message' }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, eventName: 42 }).ok).toBe(false)
  })

  it('rejects a missing or oversized sessionId', () => {
    expect(parseEventRequest({ ...validEvent, sessionId: undefined }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, sessionId: 'a'.repeat(65) }).ok).toBe(false)
  })

  it('rejects unknown metadata keys without leaking the key into the error', () => {
    const result = parseEventRequest({ ...validEvent, metadata: { name: 'Ana Pérez' } })
    expect(result.ok).toBe(false)
    if (result.ok) return
    // The visitor controls the key: it must never be interpolated into the
    // error (which is logged server-side).
    expect(result.error).toBe('metadata key is not allowed')
    expect(result.error).not.toContain('Ana Pérez')

    expect(parseEventRequest({ ...validEvent, metadata: { contact: '3001234567' } }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, metadata: { email: 'ana@example.com' } }).ok).toBe(false)
  })

  it('rejects metadata values outside the allowed sets', () => {
    expect(parseEventRequest({ ...validEvent, metadata: { source: 'referral' } }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, metadata: { reason: 'click' } }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, metadata: { method: 'sms' } }).ok).toBe(false)
  })

  it('accepts the documented metadata keys and values', () => {
    expect(
      parseEventRequest({
        ...validEvent,
        metadata: { source: 'detection', reason: 'summary', method: 'whatsapp', messageCount: 4 },
      }).ok,
    ).toBe(true)
  })

  it('rejects messageCount outside the 0-1000 range', () => {
    expect(parseEventRequest({ ...validEvent, metadata: { messageCount: -1 } }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, metadata: { messageCount: 1001 } }).ok).toBe(false)
    expect(parseEventRequest({ ...validEvent, metadata: { messageCount: 1.5 } }).ok).toBe(false)
  })

  it('rejects metadata with more than 4 keys', () => {
    expect(
      parseEventRequest({
        ...validEvent,
        metadata: { source: 'form', reason: 'summary', method: 'email', messageCount: 1, extra: 'x' },
      }).ok,
    ).toBe(false)
  })

  it('rejects non-serializable metadata', () => {
    const circular: Record<string, unknown> = {}
    circular.self = circular
    expect(parseEventRequest({ ...validEvent, metadata: circular }).ok).toBe(false)
  })

  it('rejects a path with query params', () => {
    expect(parseEventRequest({ ...validEvent, path: '/servicios?q=ropa' }).ok).toBe(false)
  })
})
