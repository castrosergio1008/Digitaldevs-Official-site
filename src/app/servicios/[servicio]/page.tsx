import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Check } from 'lucide-react'
import { faqs, getServiceBySlug, getServicePaths } from '@/lib/content'
import { serviceWhatsappLink, site } from '@/lib/site'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import Breadcrumb from '@/components/Breadcrumb'
import Process from '@/components/Process'
import Pricing from '@/components/Pricing'
import FAQ from '@/components/FAQ'
import ContactForm from '@/components/ContactForm'
import CtaBanner from '@/components/CtaBanner'
import Reveal from '@/components/Reveal'
import { SERVICE_ICONS } from '@/components/ServiceCard'

type ServicePageProps = {
  params: Promise<{ servicio: string }>
}

export function generateStaticParams() {
  return getServicePaths().map((p) => ({ servicio: p.slug }))
}

// Unknown slugs never render: they answer with a 404.
export const dynamicParams = false

export async function generateMetadata({ params }: ServicePageProps): Promise<Metadata> {
  const { servicio } = await params
  const service = getServiceBySlug(servicio)
  if (!service) return {}

  const title = service.metaTitle ?? `${service.title} | Digital-devs`
  const description = service.metaDescription ?? service.description

  return {
    title,
    description,
    alternates: { canonical: `/servicios/${service.slug}` },
    openGraph: {
      title,
      description,
      url: `/servicios/${service.slug}`,
      type: 'website',
    },
  }
}

export default async function ServicePage({ params }: ServicePageProps) {
  const { servicio } = await params
  const service = getServiceBySlug(servicio)
  if (!service) notFound()

  const Icon = SERVICE_ICONS[service.key]
  const items = service.faqs ?? faqs
  const whatsappHref = serviceWhatsappLink(service.title)

  const jsonLdService = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.description,
    url: `${site.url}/servicios/${service.slug}`,
    serviceType: service.title,
    provider: { '@id': `${site.url}/#organization` },
    areaServed: 'LATAM',
  }

  const jsonLdBreadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: `${site.url}/` },
      { '@type': 'ListItem', position: 2, name: 'Servicios', item: `${site.url}/servicios` },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.title,
        item: `${site.url}/servicios/${service.slug}`,
      },
    ],
  }

  return (
    <div className="min-h-screen">
      <Header />
      <main id="main">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdService) }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdBreadcrumb) }}
        />

        {/* Service hero */}
        <section className="relative overflow-hidden border-b border-edge bg-soft/40">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
            <Breadcrumb
              items={[
                { label: 'Inicio', href: '/' },
                { label: 'Servicios', href: '/servicios' },
                { label: service.title },
              ]}
            />
            <Reveal>
              <div className="mt-8 flex items-start gap-5">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
                  <Icon className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                    {service.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted sm:text-lg">
                    {service.description}
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Benefits */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <Reveal>
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Beneficios</p>
            <h2 className="mt-2 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Qué incluye este servicio
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {service.points.map((point, i) => (
              <Reveal key={point} delay={i * 60}>
                <li className="flex h-full items-start gap-3 rounded-2xl border border-edge bg-surface p-5">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm font-medium text-fg">{point}</span>
                </li>
              </Reveal>
            ))}
          </ul>
        </section>

        <Process
          id="proceso-servicio"
          eyebrow="Proceso"
          title="Un proceso claro, de la idea a la producción"
          description="Trabajamos con alcance, entregables y fechas definidas para llevar este servicio de principio a fin."
        />

        <Pricing
          id="precios-servicio"
          eyebrow="Inversión"
          title="Modelos de inversión para este servicio"
          description="Escoge el modelo que mejor se adapte a tu proyecto; la propuesta siempre incluye alcance y fechas."
          ctaHref="/#contacto"
          ctaLabel="Solicitar cotización"
          ctaExternal={false}
        />

        <FAQ
          id="faq-servicio"
          idPrefix="servicio-faq"
          eyebrow="Preguntas frecuentes"
          title="Resolvemos tus dudas"
          description="Las dudas más comunes sobre nuestros servicios. ¿Tienes otra? Escríbenos por WhatsApp o email."
          items={items}
        />

        {/* Embedded contact form with the service pre-filled in WhatsApp */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <Reveal>
              <p className="text-sm font-semibold uppercase tracking-widest text-primary">Contacto</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Cuéntanos tu idea sobre {service.title}
              </h2>
              <p className="mt-4 text-muted">
                Escribe un mensaje breve y en menos de 24 horas recibirás una respuesta con los
                siguientes pasos para tu proyecto. El servicio ya viene indicado en el mensaje de
                WhatsApp.
              </p>
            </Reveal>
            <Reveal delay={120}>
              <ContactForm idPrefix="servicio" serviceTitle={service.title} />
            </Reveal>
          </div>
        </section>

        <CtaBanner
          title={`¿Listo para empezar con ${service.title}?`}
          description="Hablemos una vez, sin compromiso, y definamos juntos el siguiente paso."
          ctaLabel="Hablemos por WhatsApp"
          ctaHref={whatsappHref}
          secondaryLabel="Ver formulario de contacto"
          secondaryHref="/#contacto"
        />
      </main>
      <Footer />
    </div>
  )
}
