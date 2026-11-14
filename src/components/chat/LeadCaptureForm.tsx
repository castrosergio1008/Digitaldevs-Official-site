'use client'

import { useState, type FormEvent } from 'react'
import Link from 'next/link'
import { Send } from 'lucide-react'
import type { LeadPayload } from '@/lib/chat/types'
import { resolveLeadMethod, validateLead, validateLeadName } from '@/lib/chat/lead'

type LeadCaptureFormProps = {
  disabled: boolean
  onSubmitLead: (lead: LeadPayload) => void
  onCancel: () => void
}

const fieldClass =
  'w-full rounded-xl border border-edge bg-soft px-3 py-2.5 text-sm text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-primary/60'
const labelClass = 'mb-1 block text-xs font-medium text-muted'

/**
 * Name + WhatsApp/email capture with client-side validation and an explicit
 * consent note. The parent owns the API call and the WhatsApp hand-off.
 */
export default function LeadCaptureForm({ disabled, onSubmitLead, onCancel }: LeadCaptureFormProps) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [errors, setErrors] = useState<{ name?: string; contact?: string }>({})

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const result = validateLead({ name, contact, method: resolveLeadMethod(contact) })

    if (!result.ok) {
      const nameError = validateLeadName(name)
      setErrors({ name: nameError ?? undefined, contact: nameError ? undefined : result.error })
      return
    }

    setErrors({})
    onSubmitLead(result.lead)
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Formulario de contacto"
      className="space-y-3 px-4 pb-3"
    >
      <div>
        <label htmlFor="chat-lead-name" className={labelClass}>
          Nombre
        </label>
        <input
          id="chat-lead-name"
          autoComplete="name"
          value={name}
          disabled={disabled}
          onChange={(event) => setName(event.target.value)}
          placeholder="Tu nombre"
          className={fieldClass}
        />
        {errors.name && (
          <p role="alert" className="mt-1 text-xs text-coral">
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="chat-lead-contact" className={labelClass}>
          WhatsApp o email
        </label>
        <input
          id="chat-lead-contact"
          inputMode="text"
          autoComplete="off"
          value={contact}
          disabled={disabled}
          onChange={(event) => setContact(event.target.value)}
          placeholder="300 000 0000 o tu@email.com"
          className={fieldClass}
        />
        {errors.contact && (
          <p role="alert" className="mt-1 text-xs text-coral">
            {errors.contact}
          </p>
        )}
      </div>

      <p className="text-[11px] leading-relaxed text-muted">
        Esta conversación es procesada por IA y tus datos se tratan conforme a la{' '}
        <Link
          href="/privacidad"
          className="underline underline-offset-2 transition-colors hover:text-fg"
        >
          política de privacidad
        </Link>
        . Al dejar tus datos, aceptas ser contactado por Digital-devs y que almacenemos tu nombre
        y contacto en nuestro sistema (Supabase) para gestionar tu solicitud.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="rounded-xl border border-edge px-4 py-2.5 text-sm font-medium text-muted transition-colors hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-cta px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          Enviar a WhatsApp
        </button>
      </div>
    </form>
  )
}
