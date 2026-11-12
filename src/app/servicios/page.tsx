import type { Metadata } from 'next'
import { services } from '@/lib/content'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import ServiceCard, { SERVICE_BENTO } from '@/components/ServiceCard'
import Reveal from '@/components/Reveal'

export const metadata: Metadata = {
  title: 'Servicios | Digital-devs',
  description:
    'Sitios web corporativos, tiendas en línea, aplicaciones web a medida, MVPs para startups, Progressive Web Apps y soporte continuo. Desarrollo remoto desde Colombia para LATAM.',
  alternates: { canonical: '/servicios' },
  openGraph: {
    title: 'Servicios | Digital-devs',
    description:
      'Conoce los servicios de Digital-devs: sitios web, tiendas en línea, aplicaciones a medida, MVPs, PWAs y soporte continuo.',
    url: '/servicios',
    type: 'website',
  },
}

export default function ServiciosPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main">
        <section className="relative overflow-hidden border-b border-edge bg-soft/40">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
            <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Servicios' }]} />
            <Reveal>
              <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-primary">
                Servicios
              </p>
              <h1 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Soluciones digitales para cada etapa de tu negocio
              </h1>
              <p className="mt-4 max-w-2xl text-muted">
                Nos adaptamos a tu idea y a cualquier tecnología. Estos son los servicios que llevamos
                de la idea a producción con acompañamiento cercano.
              </p>
            </Reveal>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
      </main>
      <Footer />
    </div>
  )
}
