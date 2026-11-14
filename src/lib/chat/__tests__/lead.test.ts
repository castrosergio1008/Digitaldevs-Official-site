import { describe, expect, it } from 'vitest'
import {
  buildLeadContext,
  buildWhatsAppLink,
  detectContactInfo,
  extractNameFromMessage,
  redactContactInfo,
  resolveLeadMethod,
  shouldDetectContact,
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

  it('uses the structured "Resumen:" from the assistant when present', () => {
    const lead = { name: 'Ana', contact: '3001234567', method: 'whatsapp' as const }
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Pierdo pedidos por respuesta lenta' },
      {
        role: 'assistant',
        content: 'Resumen: pedidos perdidos → Automatización de Procesos ($2.800.000+)',
      },
    ]

    const context = buildLeadContext(lead, messages)
    expect(context).toContain('Resumen: pedidos perdidos → Automatización de Procesos')
    expect(context).not.toContain('Contexto:')
  })

  it('adds the assistant reply as context when there is no structured summary', () => {
    const lead = { name: 'Ana', contact: '3001234567', method: 'whatsapp' as const }
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Tengo 40 pedidos al día' },
      { role: 'assistant', content: '¿Cuántos pierdes por no responder a tiempo?' },
    ]

    const context = buildLeadContext(lead, messages)
    expect(context).toContain('Contexto: Tengo 40 pedidos al día')
    expect(context).toContain('Asesor: ¿Cuántos pierdes por no responder a tiempo?')
  })

  it('skips the greeting and keeps only the user message', () => {
    const lead = { name: 'Ana', contact: '3001234567', method: 'whatsapp' as const }
    const messages: ChatMessage[] = [
      { role: 'assistant', content: '¡Hola! Soy el asistente virtual de Digital-devs. ¿En qué puedo ayudar hoy?' },
      { role: 'user', content: 'Quiero información' },
    ]

    const context = buildLeadContext(lead, messages)
    expect(context).toBe('Mi WhatsApp es 3001234567. Quiero información')
    expect(context).not.toContain('Asesor:')
  })

  it('clips a long assistant reply with an ellipsis', () => {
    const lead = { name: 'Ana', contact: '3001234567', method: 'whatsapp' as const }
    const longReply = 'a'.repeat(300)
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Hola' },
      { role: 'assistant', content: longReply },
    ]

    const context = buildLeadContext(lead, messages)
    expect(context).toContain('Asesor: ')
    expect(context).toContain('…')
    expect(context.length).toBeLessThan(longReply.length + 100)
  })

  it('redacts contact details from the context but keeps the lead contact', () => {
    const lead = { name: 'Ana', contact: '3001234567', method: 'whatsapp' as const }
    const messages: ChatMessage[] = [
      { role: 'user', content: 'Mi número es 3001234567 y mi correo ana@example.com' },
    ]

    const context = buildLeadContext(lead, messages)
    expect(context).toContain('3001234567')
    expect(context).not.toContain('ana@example.com')
    expect(context).toContain('[redactado]')
  })
})

describe('redactContactInfo', () => {
  it('redacts emails and phone numbers', () => {
    expect(redactContactInfo('Escríbeme a ana@example.com o al 300 123 4567')).toBe(
      'Escríbeme a [redactado] o al [redactado]',
    )
  })

  it('preserves short quantities that are not phone-like', () => {
    expect(redactContactInfo('Tengo 300 dólares y 5 pedidos')).toBe('Tengo 300 dólares y 5 pedidos')
  })

  it('preserves currency amounts', () => {
    expect(redactContactInfo('El presupuesto es $2.800.000 o $4500')).toBe(
      'El presupuesto es $2.800.000 o $4500',
    )
  })

  it('preserves ISO dates', () => {
    expect(redactContactInfo('La reunión es el 2026-11-13')).toBe('La reunión es el 2026-11-13')
  })

  it('preserves bare digit runs that are not phone-like', () => {
    expect(redactContactInfo('Son 12345678 pesos')).toBe('Son 12345678 pesos')
  })

  it('redacts phone numbers with parentheses and country code', () => {
    expect(redactContactInfo('Llama a +57 (311) 360 9710')).toBe('Llama a [redactado]')
    expect(redactContactInfo('Llama a (311) 360 9710')).toBe('Llama a [redactado]')
  })

  it('handles empty text', () => {
    expect(redactContactInfo('')).toBe('')
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

describe('shouldDetectContact', () => {
  it('returns true when the message mentions contact channels', () => {
    expect(shouldDetectContact('Mi WhatsApp es 3001234567')).toBe(true)
    expect(shouldDetectContact('Mi correo es ana@example.com')).toBe(true)
    expect(shouldDetectContact('Mi número es 3001234567')).toBe(true)
    expect(shouldDetectContact('Mi email es ana@example.com')).toBe(true)
    expect(shouldDetectContact('Quiero que me contacten')).toBe(true)
  })

  it('accepts common variants that clearly share contact details', () => {
    expect(shouldDetectContact('Mi número: 3001234567')).toBe(true)
    expect(shouldDetectContact('Escríbeme al 3001234567')).toBe(true)
    expect(shouldDetectContact('Me pueden contactar al 3001234567')).toBe(true)
    expect(shouldDetectContact('Dejó mi correo: ana@example.com')).toBe(true)
  })

  it('returns false when there is no contact intent', () => {
    expect(shouldDetectContact('Hola, ¿qué servicios ofrecen?')).toBe(false)
    expect(shouldDetectContact('Tengo 3001234567 dólares para invertir')).toBe(false)
    expect(shouldDetectContact('El número de pedidos subió')).toBe(false)
    expect(shouldDetectContact('')).toBe(false)
  })
})

describe('detectContactInfo', () => {
  it('detects an email address', () => {
    const result = detectContactInfo('Mi correo es ana@example.com')
    expect(result).toEqual({ contact: 'ana@example.com', method: 'email' })
  })

  it('detects a WhatsApp number with spaces and dashes', () => {
    const result = detectContactInfo('Mi WhatsApp es 300 123 4567')
    expect(result).toEqual({ contact: '3001234567', method: 'whatsapp' })
  })

  it('detects a WhatsApp number with country code', () => {
    const result = detectContactInfo('Mi número es +57 311 360 9710')
    expect(result).toEqual({ contact: '573113609710', method: 'whatsapp' })
  })

  it('returns null when no usable contact is found', () => {
    expect(detectContactInfo('Hola, ¿qué servicios ofrecen?')).toBeNull()
    expect(detectContactInfo('Tengo 123 dólares')).toBeNull()
    expect(detectContactInfo('')).toBeNull()
  })
})

describe('extractNameFromMessage', () => {
  it('extracts a name from common patterns', () => {
    expect(extractNameFromMessage('Me llamo Ana Pérez')).toBe('Ana Pérez')
    expect(extractNameFromMessage('Soy Juan')).toBe('Juan')
    expect(extractNameFromMessage('Mi nombre es María')).toBe('María')
  })

  it('returns null when no name is found', () => {
    expect(extractNameFromMessage('Hola, ¿qué servicios ofrecen?')).toBeNull()
    expect(extractNameFromMessage('Mi WhatsApp es 3001234567')).toBeNull()
    expect(extractNameFromMessage('')).toBeNull()
  })
})
