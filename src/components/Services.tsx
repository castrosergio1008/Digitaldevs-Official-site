import { Globe, ShoppingCart, LayoutDashboard, Rocket, Smartphone, LifeBuoy, Check, type LucideIcon } from 'lucide-react'
import { services, type ServiceKey } from '@/lib/content'
import Reveal from './Reveal'

const ICONS: Record<ServiceKey, LucideIcon> = {
  web: Globe,
  ecommerce: ShoppingCart,
  apps: LayoutDashboard,
  mvp: Rocket,
  pwa: Smartphone,
  support: LifeBuoy,
}

const BENTO: Record<string, string> = {
  web: 'sm:col-span-2',
  ecommerce: '',
  apps: 'sm:row-span-2',
  mvp: '',
  pwa: '',
  support: 'sm:col-span-2',
}

export default function Services() {
  return (
    <section id="servicios" className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Servicios</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Soluciones digitales para cada etapa de tu negocio
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Nos adaptamos a tu idea y a cualquier tecnología. Estos son los servicios que llevamos de la
          idea a producción con acompañamiento cercano.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s, i) => {
          const Icon = ICONS[s.key]
          return (
            <Reveal key={s.key} delay={(i % 3) * 80} className={BENTO[s.key] ?? ''}>
              <div className="group flex h-full flex-col rounded-2xl border border-edge bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-bold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {s.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-xs text-muted">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          )
        })}
      </div>
    </section>
  )
}