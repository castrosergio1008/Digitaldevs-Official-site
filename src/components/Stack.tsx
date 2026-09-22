import { Code2, Server, Database, Rocket } from 'lucide-react'
import { stack } from '@/lib/content'
import Reveal from './Reveal'

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code2,
  server: Server,
  database: Database,
  rocket: Rocket,
}

export default function Stack() {
  return (
    <section id="stack" className="relative border-y border-edge bg-soft/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Stack tecnológico</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Capacidad para adaptarnos a lo que tu negocio necesite
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            Tecnologías modernas y consolidadas para construir rápido, seguro y que crezca contigo.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stack.map((group, i) => {
            const Icon = ICONS[group.icon]
            return (
              <Reveal key={group.name} delay={i * 80}>
                <div className="h-full rounded-2xl border border-edge bg-surface p-6">
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-cta/10 text-cta">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-fg">{group.name}</h3>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {group.items.map((item) => (
                      <span
                        key={item}
                        className="rounded-md bg-primary/10 px-2 py-1 font-mono text-[11px] text-accent"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}