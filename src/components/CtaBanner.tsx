import { MessageCircle, ArrowRight } from 'lucide-react'
import { site } from '@/lib/site'
import Reveal from './Reveal'

export default function CtaBanner() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:pb-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/20 via-surface2 to-accent/10 px-6 py-14 text-center sm:px-12">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/25 blur-[110px]" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Listo para llevar tu negocio al siguiente nivel?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">
              Hagamos realidad tu proyecto. Conversemos una vez, sin compromiso, y definamos juntos el
              siguiente paso.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <a
                href={site.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-cta px-6 py-3.5 text-sm font-semibold text-white shadow-xl shadow-cta/25 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" />
                Hablemos por WhatsApp
              </a>
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent('Me interesa un proyecto web')}`}
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-soft px-6 py-3.5 text-sm font-semibold text-fg transition hover:border-primary/50"
              >
                Enviar correo
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  )
}