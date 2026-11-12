import { MessageCircle, Mail } from 'lucide-react'
import { site } from '@/lib/site'
import Reveal from './Reveal'
import ContactForm from './ContactForm'

export default function Contact() {
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
          <ContactForm />
        </Reveal>
      </div>
    </section>
  )
}
