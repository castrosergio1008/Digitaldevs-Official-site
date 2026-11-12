import { services } from '@/lib/content'
import ServiceCard, { SERVICE_BENTO } from './ServiceCard'
import Reveal from './Reveal'

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
        {services.map((s, i) => (
          <Reveal key={s.key} delay={(i % 3) * 80} className={SERVICE_BENTO[s.key]}>
            <ServiceCard
              service={s}
              href={`/servicios/${s.slug}`}
              ariaLabel={`Ver detalle de ${s.title}`}
            />
          </Reveal>
        ))}
      </div>
    </section>
  )
}
