'use client'

import { useEffect, useRef, useState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'
import { site } from '@/lib/site'

type ContactFormProps = {
  // Unique prefix for input IDs/labels so the form can be embedded on
  // service pages without colliding with the home form.
  idPrefix?: string
  // When present, the WhatsApp message is prefixed with the service name.
  serviceTitle?: string
}

export default function ContactForm({ idPrefix = 'contacto', serviceTitle }: ContactFormProps) {
  const [form, setForm] = useState({ nombre: '', telefono: '', mensaje: '' })
  const [sent, setSent] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current)
    },
    []
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const intro = serviceTitle
      ? `Hola Digital-devs! Me interesa el servicio "${serviceTitle}".`
      : 'Hola Digital-devs!'
    const text = encodeURIComponent(
      `${intro} Soy ${form.nombre || 'un interesado'}.${form.telefono ? ` Mi teléfono es ${form.telefono}.` : ''} ${form.mensaje}`
    )
    const url = `${site.whatsappBase}?text=${text}`
    // `noopener` makes window.open() always return null, so treat it as the
    // preferred way to open the chat without risking the current page.
    window.open(url, '_blank', 'noopener')
    setSent(true)
    if (resetTimer.current) clearTimeout(resetTimer.current)
    resetTimer.current = setTimeout(() => setSent(false), 6000)
  }

  const field =
    'w-full rounded-xl border border-edge bg-soft px-4 py-3 text-sm text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-primary/60'
  const label = 'mb-1.5 block text-xs font-medium text-muted'
  const nombreId = `${idPrefix}-nombre`
  const telefonoId = `${idPrefix}-telefono`
  const mensajeId = `${idPrefix}-mensaje`

  return (
    <form onSubmit={submit} className="rounded-2xl border border-edge bg-surface p-6 sm:p-8">
      <h3 className="text-lg font-bold text-fg">Solicita tu cotización</h3>
      <p className="mt-1 text-xs text-muted">
        Solo lo esencial: la propuesta llega por WhatsApp o email.
      </p>
      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor={nombreId} className={label}>
            Nombre
          </label>
          <input
            id={nombreId}
            required
            autoComplete="name"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            placeholder="Tu nombre"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={telefonoId} className={label}>
            Teléfono / WhatsApp
          </label>
          <input
            id={telefonoId}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            placeholder="300 000 0000"
            className={field}
          />
        </div>
        <div>
          <label htmlFor={mensajeId} className={label}>
            ¿Qué proyecto tienes en mente?
          </label>
          <textarea
            id={mensajeId}
            required
            rows={4}
            value={form.mensaje}
            onChange={(e) => setForm({ ...form, mensaje: e.target.value })}
            placeholder="Cuéntanos tu idea, servicios, objetivos o presupuesto…"
            className={`${field} resize-none`}
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cta px-5 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cta/25 transition hover:-translate-y-0.5 hover:brightness-110"
        >
          {sent ? (
            <>
              <CheckCircle2 className="h-4 w-4" /> Abriendo WhatsApp…
            </>
          ) : (
            <>
              <Send className="h-4 w-4" /> Enviar mensaje
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-muted">
          Al enviar se abrirá WhatsApp con tu mensaje listo para enviar.
        </p>
      </div>
    </form>
  )
}
