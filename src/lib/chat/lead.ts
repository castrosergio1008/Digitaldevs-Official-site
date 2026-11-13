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
