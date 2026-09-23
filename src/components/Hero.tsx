import { ArrowRight, MessageCircle, Mail, MapPin } from 'lucide-react'
import { site } from '@/lib/site'
import Terminal from './Terminal'
import Reveal from './Reveal'
import FloatingLogo from './FloatingLogo'

export default function Hero() {
  return (
    <section id="inicio" className="relative overflow-hidden">
      <div className="grid-lines pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]" />
      <div className="animate-pulse-soft pointer-events-none absolute -top-40 left-1/2 h-96 w-[42rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[120px]" />
      <div className="pointer-events-none absolute -right-32 top-40 h-72 w-72 rounded-full bg-accent/10 blur-[100px]" />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:pb-28 lg:pt-24">
        <div>
          <Reveal>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-edge bg-soft px-3 py-1.5 text-xs font-medium text-muted">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Disponible para nuevos proyectos · Remoto LATAM
            </div>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-4xl font-bold leading-[1.06] tracking-tight sm:text-5xl lg:text-6xl">
              Hacemos realidad{' '}
              <span className="text-gradient">tus ideas</span>
            </h1>
          </Reveal>

          <Reveal delay={160}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
              Sitios web corporativos, tiendas en línea y aplicaciones a la medida — del diseño al
              despliegue en producción. Tecnología moderna, comunicación clara y entregas confiables.
            </p>
          </Reveal>

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

        <Reveal delay={200} className="relative flex justify-center lg:justify-end">
          <Terminal />
          <FloatingLogo />
        </Reveal>
      </div>
    </section>
  )
}