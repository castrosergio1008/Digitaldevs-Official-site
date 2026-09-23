'use client'

import { useState } from 'react'
import { MessageCircle, Mail, Send, CheckCircle2 } from 'lucide-react'
import { site } from '@/lib/site'
import Reveal from './Reveal'

export default function Contact() {
  const [form, setForm] = useState({ nombre: '', telefono: '', mensaje: '' })
  const [sent, setSent] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const text = encodeURIComponent(
      `Hola Digitaldevs! Soy ${form.nombre || 'un interesado'}.${form.telefono ? ` Mi teléfono es ${form.telefono}.` : ''} ${form.mensaje}`
    )
    window.open(`${site.whatsappBase}?text=${text}`, '_blank', 'noopener')
    setSent(true)
    setTimeout(() => setSent(false), 6000)
  }

  const field =
    'w-full rounded-xl border border-edge bg-soft px-4 py-3 text-sm text-fg placeholder:text-muted/70 outline-none transition-colors focus:border-primary/60'

  return (
    <section id="contacto" className="relative overflow-hidden">
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-primary/10 blur-[110px]" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-accent/10 blur-[110px]" />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contacto</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Cuéntanos tu idea y empecemos
          </h2>
          <p className="mt-4 max-w-md text-muted">
            Escribe un mensaje breve y en menos de 24 horas recibirás una respuesta con los siguientes
            pasos para tu proyecto.
          </p>

          <div className="mt-8 space-y-4">
            <a
              href={site.whatsappLink}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-emerald-400/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted">WhatsApp</div>
                <div className="font-semibold text-fg">{site.whatsapp}</div>
              </div>
            </a>
            <a
              href={`mailto:${site.email}`}
              className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:border-primary/50"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Mail className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs text-muted">Correo</div>
                <div className="font-semibold text-fg">{site.email}</div>
              </div>
            </a>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <form onSubmit={submit} className="rounded-2xl border border-edge bg-surface p-6 sm:p-8">
            <h3 className="text-lg font-bold text-fg">Solicita tu cotización</h3>
            <p className="mt-1 text-xs text-muted">
              Solo lo esencial: la propuesta llega por WhatsApp o email.
            </p>
            <div className="mt-6 space-y-4">
              <div>
                <label htmlFor="nombre" className="mb-1.5 block text-xs font-medium text-muted">
                  Nombre
                </label>
                <input
                  id="nombre"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Tu nombre"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="telefono" className="mb-1.5 block text-xs font-medium text-muted">
                  Teléfono / WhatsApp
                </label>
                <input
                  id="telefono"
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="300 000 0000"
                  className={field}
                />
              </div>
              <div>
                <label htmlFor="mensaje" className="mb-1.5 block text-xs font-medium text-muted">
                  ¿Qué proyecto tienes en mente?
                </label>
                <textarea
                  id="mensaje"
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
        </Reveal>
      </div>
    </section>
  )
}