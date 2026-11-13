import { site } from '@/lib/site'
import { EMAIL_PATTERN } from './email'
import type { ChatMessage, LeadMethod, LeadPayload } from './types'

export interface LeadDraft {
  name: string
  contact: string
  method: LeadMethod
}

export type LeadValidationResult =
  | { ok: true; lead: LeadPayload }
  | { ok: false; error: string }

/**
 * Guesses the contact channel from the value typed by the visitor: an email
 * address is detected structurally, anything else is treated as WhatsApp.
 */
export function resolveLeadMethod(contact: string): LeadMethod {
  return EMAIL_PATTERN.test(contact.trim()) ? 'email' : 'whatsapp'
}

/** Returns an inline error for the name field, or null when valid. */
export function validateLeadName(name: string): string | null {
  const trimmed = name.trim()
  if (trimmed.length < 2) return 'Escribe tu nombre (mínimo 2 caracteres).'
  if (trimmed.length > 80) return 'El nombre no puede superar 80 caracteres.'
  return null
}

/** Returns an inline error for the contact field, or null when valid. */
export function validateLeadContact(contact: string, method: LeadMethod): string | null {
  const trimmed = contact.trim()
  if (trimmed.length < 5) return 'Ingresa un contacto válido (mínimo 5 caracteres).'
  if (trimmed.length > 40) return 'El contacto no puede superar 40 caracteres.'
  if (method === 'email') {
    if (!EMAIL_PATTERN.test(trimmed)) return 'Ingresa un correo electrónico válido.'
  } else if (trimmed.replace(/\D/g, '').length < 7) {
    return 'Ingresa un número de WhatsApp válido.'
  }
  return null
}

/** Validates a complete lead draft, returning the normalized payload. */
export function validateLead(draft: LeadDraft): LeadValidationResult {
  const nameError = validateLeadName(draft.name)
  if (nameError) return { ok: false, error: nameError }

  const contactError = validateLeadContact(draft.contact, draft.method)
  if (contactError) return { ok: false, error: contactError }

  return {
    ok: true,
    lead: {
      name: draft.name.trim(),
      contact: draft.contact.trim(),
      method: draft.method,
    },
  }
}

/**
 * Builds the sentence that accompanies the lead in the WhatsApp hand-off:
 * the contact channel plus the last thing the visitor said (or a fallback).
 */
export function buildLeadContext(lead: LeadPayload, messages: ChatMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  const summary = lastUserMessage?.content.trim() || 'Quiero que me contacten.'
  const channel = lead.method === 'whatsapp' ? 'WhatsApp' : 'email'
  return `Mi ${channel} es ${lead.contact.trim()}. ${summary}`
}

/**
 * Builds the wa.me deep link for the human hand-off. `context` is the sentence
 * that follows the greeting (usually built with `buildLeadContext`).
 */
export function buildWhatsAppLink(name: string, context: string): string {
  const text = `Hola ${site.name}! Soy ${name.trim()}. ${context.trim()}`
    .replace(/\s+/g, ' ')
    .trim()
  return `${site.whatsappBase}?text=${encodeURIComponent(text)}`
}

/**
 * True when the message looks like the visitor is sharing their contact info.
 * Used to gate automatic WhatsApp hand-off so a random number mentioned in a
 * question ("tengo 3001234567 dólares") does not trigger the hand-off.
 */
const CONTACT_KEYWORDS =
  /(whatsapp|correo|email|n[úu]mero|telefono|tel[ée]fono|celular|contacto|contacten|mi n[úu]mero|mi whatsapp|mi correo|mi email)/i

export function shouldDetectContact(message: string): boolean {
  return CONTACT_KEYWORDS.test(message)
}

/**
 * Detects a WhatsApp number or email address in a free-text message.
 *
 * Used to offer an automatic WhatsApp hand-off: when the visitor types their
 * contact details in the conversation (instead of the lead form), the widget
 * can open WhatsApp without waiting for a click. The detection is structural
 * (no NLP): an email is matched by pattern, anything else that looks like a
 * phone number is treated as WhatsApp.
 *
 * Returns the normalized contact and the detected method, or null when the
 * message does not contain usable contact information.
 */
export function detectContactInfo(message: string): { contact: string; method: LeadMethod } | null {
  const text = message.trim()
  if (!text) return null

  // Email first: the pattern is specific enough to avoid false positives.
  const emailMatch = text.match(/[^\s@]+@[^\s@]+\.[^\s@]+/)
  if (emailMatch) {
    return { contact: emailMatch[0], method: 'email' }
  }

  // WhatsApp: a phone-like token with at least 7 digits (ITU-T E.164 max 15).
  // Captures optional country code, spaces, dots and dashes between digits.
  const whatsappMatch = text.match(/(\+?\d[\d\s.\-]{5,}\d)/)
  if (whatsappMatch) {
    const digits = whatsappMatch[1].replace(/\D/g, '')
    if (digits.length >= 7 && digits.length <= 15) {
      return { contact: digits, method: 'whatsapp' }
    }
  }

  return null
}

/**
 * Extracts a visitor's name from a free-text message using common patterns
 * ("me llamo Ana", "soy Ana", "mi nombre es Ana Pérez"). Returns null when no
 * plausible name is found so the caller can fall back to a generic greeting.
 */
export function extractNameFromMessage(message: string): string | null {
  const text = message.trim()
  if (!text) return null

  const patterns = [
    /(?:me llamo|soy|mi nombre es)\s+([A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)?)/i,
  ]

  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      const name = match[1].trim()
      if (name.length >= 2 && name.length <= 80) return name
    }
  }

  return null
}
