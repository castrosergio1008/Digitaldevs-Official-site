import { Check } from 'lucide-react'
import { pricing, type PricingModel } from '@/lib/content'
import { site } from '@/lib/site'
import Reveal from './Reveal'

type PricingProps = {
  id?: string
  eyebrow?: string
  title?: string
  description?: string
  models?: PricingModel[]
  // Home keeps the external WhatsApp link; service pages point to /#contacto.
  ctaHref?: string
  ctaLabel?: string
  ctaExternal?: boolean
}

export default function Pricing({
  id,
  eyebrow = 'Inversión',
  title = 'Modelos de contratación que se adaptan a ti',
  description = 'Toda propuesta incluye alcance, entregables, inversión y fechas antes de empezar. Sin sorpresas.',
  models = pricing,
  ctaHref = site.whatsappLink,
  ctaLabel = 'Solicitar cotización',
  ctaExternal = true,
}: PricingProps) {
  return (
    <section id={id} className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
        <p className="mt-4 max-w-2xl text-muted">{description}</p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-3">
        {models.map((m, i) => (
          <Reveal key={m.name} delay={i * 80}>
            <div
              className={`relative flex h-full flex-col rounded-2xl border p-6 transition-all duration-200 hover:-translate-y-1 ${
                m.badge ? 'border-primary/50 bg-gradient-to-b from-primary/15 to-surface shadow-xl shadow-primary/10' : 'border-edge bg-surface'
              }`}
            >
              {m.badge && (
                <span className="absolute -top-3 left-6 rounded-full bg-cta px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                  {m.badge}
                </span>
              )}
              <h3 className="text-lg font-bold text-fg">{m.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{m.ideal}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {m.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-fg/90">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
              <a
                href={ctaHref}
                target={ctaExternal ? '_blank' : undefined}
                rel={ctaExternal ? 'noreferrer' : undefined}
                className={`mt-6 inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition hover:brightness-110 ${
                  m.badge ? 'bg-cta text-white' : 'border border-edge bg-soft text-fg hover:border-primary/50'
                }`}
              >
                {ctaLabel}
              </a>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="mt-8 max-w-3xl text-sm text-muted">
          ¿No sabes qué inversión necesitas? Escríbenos una línea y miramos juntos el mejor modelo para
          tu proyecto — la primera asesoría es gratuita.
        </p>
      </Reveal>
    </section>
  )
}
