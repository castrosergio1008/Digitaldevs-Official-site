import { process } from '@/lib/content'
import Reveal from './Reveal'

export default function Process() {
  return (
    <section id="proceso" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:py-28">
      <Reveal>
        <p className="text-sm font-semibold uppercase tracking-widest text-primary">Cómo trabajamos</p>
        <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Un proceso claro, de la idea a la producción
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Sin letra pequeña ni sorpresas: sabes exactamente qué se construye, cuándo y cuánto cuesta.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {process.map((p, i) => (
          <Reveal key={p.step} delay={i * 80}>
            <div className="relative h-full rounded-2xl border border-edge bg-surface p-6">
              <span className="text-gradient font-mono text-4xl font-bold">{p.step}</span>
              <h3 className="mt-4 text-base font-bold text-fg">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p.description}</p>
              {i < process.length - 1 && (
                <div className="absolute -right-2 top-1/2 hidden h-px w-4 bg-primary/40 lg:block" />
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}