import { ArrowRight, MessageCircle, Mail, MapPin } from 'lucide-react'
import Image from 'next/image'
import { site } from '@/lib/site'
import Reveal from './Reveal'

export default function Hero() {
  return (
    <section id="inicio" className="relative flex min-h-[90vh] items-center overflow-hidden">
      {/* Decorative full-bleed cover image. */}
      <div aria-hidden="true" className="absolute inset-0">
        <Image src="/og.png" alt="" fill priority sizes="100vw" className="object-cover" />
        {/* Opaque left -> transparent right: keeps the copy legible over the cover. */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/25" />
        {/* Bottom blend into the next section. */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/40" />
      </div>

      <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="animate-pulse-soft pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:py-32">
        <div className="max-w-2xl">
          {/* Above-the-fold content is painted immediately (no Reveal) to protect LCP.
              The only motion is a CSS-only fade-in that is disabled under reduced motion. */}
          <div className="animate-hero-fade">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-soft/80 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Disponible para nuevos proyectos · Remoto LATAM
            </div>

            <h1 className="text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Tu socio de crecimiento tecnológico:{' '}
              <span className="text-gradient">Software, automatización y analítica.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Construimos el software, automatizamos los procesos repetitivos y medimos el impacto
              comercial. Una sola cabeza para web, automatización, analítica y acompañamiento mensual.
            </p>
          </div>

          <Reveal delay={240}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href={site.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-cta/25 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <MessageCircle className="h-4 w-4" />
                Inicia tu proyecto
              </a>
              <a
                href="#portafolio"
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-soft px-5 py-3 text-sm font-semibold text-fg transition hover:border-primary/50"
              >
                Ver proyectos
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>

          <Reveal delay={320}>
            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
              <a href={`mailto:${site.email}`} className="inline-flex items-center gap-2 transition-colors hover:text-fg">
                <Mail className="h-4 w-4 text-primary" />
                {site.email}
              </a>
              <span className="inline-flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Colombia · LATAM
              </span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}
