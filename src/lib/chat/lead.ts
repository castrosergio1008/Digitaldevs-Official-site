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
  } else if (trimmed.replace(/\D/g, '').length < 8) {
    // Colombian mobiles are 10 digits; 8 is the floor that avoids accepting
    // short quantities typed by mistake. Keep aligned with detectContactInfo.
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

/** Matches the structured closing summary the bot is instructed to emit. */
const SUMMARY_PATTERN = /Resumen:\s*([^\n]+)/i

/**
 * Shared widget greeting. Exported so the chat widget and the lead context
 * builder stay in sync; it carries no diagnostic value.
 */
export const CHAT_GREETING = '¡Hola! Soy el asistente virtual de Digital-devs. ¿En qué puedo ayudar hoy?'

/** Maximum characters kept from the assistant reply when used as context. */
const ASSISTANT_CONTEXT_LIMIT = 200

/**
 * Builds the sentence that accompanies the lead in the WhatsApp hand-off. It
 * prefers the structured "Resumen:" the bot emits on a closing turn; otherwise
 * it falls back to the last user message plus the last assistant reply so the
 * advisor receives diagnostic context instead of a cold "Quiero que me
 * contacten.".
 */
export function buildLeadContext(lead: LeadPayload, messages: ChatMessage[]): string {
  const lastUserMessage = [...messages].reverse().find((message) => message.role === 'user')
  const lastAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant')

  const summary = lastUserMessage?.content.trim() || 'Quiero más información.'
  const channel = lead.method === 'whatsapp' ? 'WhatsApp' : 'email'
  const assistantText = lastAssistantMessage?.content.trim() ?? ''

  const structuredSummary = assistantText.match(SUMMARY_PATTERN)?.[1]?.trim()
  if (structuredSummary) {
    return `Mi ${channel} es ${lead.contact.trim()}. Resumen: ${structuredSummary}`
  }

  if (assistantText && assistantText !== CHAT_GREETING) {
    const clipped = assistantText.slice(0, ASSISTANT_CONTEXT_LIMIT)
    const assistantContext =
      clipped.length < assistantText.length ? `${clipped}…` : clipped
    return `Mi ${channel} es ${lead.contact.trim()}. Contexto: ${summary} | Asesor: ${assistantContext}`
  }

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
  /(mi\s+(n[úu]mero|whatsapp|correo|email|celular|tel[ée]fono)\s*[:es]|me\s+pueden\s+contactar\s+al|contacten\s+al|dej[óo]\s+mi\s+(n[úu]mero|whatsapp|correo|email)|escr[íi]beme\s+al|quiero\s+que\s+me\s+contacten)/i

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

  // WhatsApp: a phone-like token with at least 8 digits (ITU-T E.164 max 15).
  // Captures optional country code, spaces, dots and dashes between digits.
  const whatsappMatch = text.match(/(\+?\d[\d\s.\-]{5,}\d)/)
  if (whatsappMatch) {
    const digits = whatsappMatch[1].replace(/\D/g, '')
    // Reject short tokens that look like quantities ("tengo 3001234567 dólares")
    // rather than a real phone number. Colombian mobiles are 10 digits.
    if (digits.length >= 8 && digits.length <= 15) {
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
