import { ExternalLink } from 'lucide-react'
import { projects, type ProjectKey } from '@/lib/content'
import Reveal from './Reveal'

const HINTS: Record<ProjectKey, [string, string]> = {
  saasify: ['from-primary to-accent', '✦ SaaSify'],
  taskmanager: ['from-cta to-coral', 'GET /api/tasks'],
  dashboard: ['from-accent to-emerald-400', '▲ Dashboard'],
  portfolio: ['from-[#7c3aed] to-coral', '◉ Portfolio'],
}

export default function Portfolio() {
  return (
    <section id="portafolio" className="relative border-y border-edge bg-soft/60">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Portafolio</p>
          <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            Proyectos que demuestran lo que hacemos
          </h2>
          <p className="mt-4 max-w-2xl text-muted">
            De landings de conversión a APIs y paneles de administración — desarrollos completos,
            documentados y en producción.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {projects.map((p, i) => {
            const [grad, hint] = HINTS[p.key]
            return (
              <Reveal key={p.key} delay={(i % 2) * 80}>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-edge bg-surface transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5"
                >
                  <div className={`relative flex h-40 items-center justify-center bg-gradient-to-br ${grad} p-6`}>
                    <div className="absolute inset-x-4 top-3 flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                      <span className="h-2.5 w-2.5 rounded-full bg-white/25" />
                      <span className="ml-2 font-mono text-[11px] text-white/80">{hint}</span>
                    </div>
                    <div className="mt-6 w-full font-mono text-sm text-white/90">
                      <div className="mb-1 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                        <span className="text-white/50">$</span> digitaldevs build --{p.tag.toLowerCase()}
                      </div>
                      <div className="ml-4 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                        <span className="text-emerald-300">✓</span> {p.title}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
                        {p.tag}
                      </span>
                      <h3 className="text-base font-bold text-fg">{p.title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {p.tech.map((t) => (
                        <span key={t} className="rounded-md border border-edge px-2 py-0.5 font-mono text-[11px] text-muted">
                          {t}
                        </span>
                      ))}
                    </div>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors group-hover:text-accent">
                      Ver proyecto en vivo
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </a>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}