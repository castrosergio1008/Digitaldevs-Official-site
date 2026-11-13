import { describe, expect, it } from 'vitest'
import {
  buildLeadContext,
  buildWhatsAppLink,
  resolveLeadMethod,
  validateLead,
  validateLeadContact,
  validateLeadName,
} from '../lead'
import type { ChatMessage } from '../types'

describe('resolveLeadMethod', () => {
  it('detects an email address', () => {
    expect(resolveLeadMethod('ana@example.com')).toBe('email')
    expect(resolveLeadMethod('  ana.lopez+test@dominio.co ')).toBe('email')
  })

  it('defaults to WhatsApp for phone-like values', () => {
    expect(resolveLeadMethod('3001234567')).toBe('whatsapp')
    expect(resolveLeadMethod('+57 311 360 9710')).toBe('whatsapp')
  })
})

describe('validateLeadName', () => {
  it('accepts a normal name', () => {
    expect(validateLeadName('Ana Pérez')).toBeNull()
    expect(validateLeadName('  Ana  ')).toBeNull()
  })

  it('rejects names that are too short or too long', () => {
    expect(validateLeadName('A')).toBeTruthy()
    expect(validateLeadName('   ')).toBeTruthy()
    expect(validateLeadName('a'.repeat(81))).toBeTruthy()
  })
})

describe('validateLeadContact', () => {
  it('accepts a WhatsApp number and an email address', () => {
    expect(validateLeadContact('3001234567', 'whatsapp')).toBeNull()
    expect(validateLeadContact('+57 311 360 9710', 'whatsapp')).toBeNull()
    expect(validateLeadContact('ana@example.com', 'email')).toBeNull()
  })

  it('rejects short or malformed contacts', () => {
    expect(validateLeadContact('1234', 'whatsapp')).toBeTruthy()
    expect(validateLeadContact('12345', 'whatsapp')).toBeTruthy()
    expect(validateLeadContact('ana@example', 'email')).toBeTruthy()
    expect(validateLeadContact('a'.repeat(41), 'whatsapp')).toBeTruthy()
  })
})

describe('validateLead', () => {
  it('returns the normalized lead when valid', () => {
    const result = validateLead({ name: ' Ana Pérez ', contact: '3001234567', method: 'whatsapp' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.lead).toEqual({ name: 'Ana Pérez', contact: '3001234567', method: 'whatsapp' })
  })

  it('fails when the name or contact is invalid', () => {
    expect(validateLead({ name: 'A', contact: '3001234567', method: 'whatsapp' }).ok).toBe(false)
    expect(validateLead({ name: 'Ana', contact: '1234', method: 'whatsapp' }).ok).toBe(false)
  })
})

describe('buildLeadContext', () => {
  it('includes the channel, contact and the last user message', () => {
    const lead = { name: 'Ana Pérez', contact: '3001234567', method: 'whatsapp' as const }
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: '¡Hola!' },
      { role: 'user', content: 'Quiero una tienda en línea' },
    ]

    const context = buildLeadContext(lead, messages)
    expect(context).toContain('WhatsApp')
    expect(context).toContain('3001234567')
    expect(context).toContain('Quiero una tienda en línea')
  })

  it('falls back to a fixed summary when there is no user message', () => {
    const lead = { name: 'Ana', contact: 'ana@example.com', method: 'email' as const }
    expect(buildLeadContext(lead, [])).toContain('email')
    expect(buildLeadContext(lead, [])).toContain('ana@example.com')
  })
})

describe('buildWhatsAppLink', () => {
  it('points at the official WhatsApp number with the encoded message', () => {
    const link = buildWhatsAppLink('Ana Pérez', 'Mi WhatsApp es 3001234567. Quiero una tienda.')
    expect(link).toContain('https://wa.me/573113609710')
    expect(link).toContain('text=')

    const payload = decodeURIComponent(link.split('text=')[1] ?? '')
    expect(payload).toContain('Hola Digital-devs!')
    expect(payload).toContain('Ana Pérez')
    expect(payload).toContain('3001234567')
    expect(payload).toContain('Quiero una tienda.')
  })

  it('does not leak raw spaces into the URL', () => {
    const link = buildWhatsAppLink('Ana', 'Hola mundo')
    expect(link).not.toContain(' ')
  })
})
