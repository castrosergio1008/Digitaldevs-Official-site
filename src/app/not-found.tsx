import Link from 'next/link'
import { ArrowLeft, Compass } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

// Branded 404 for every unmatched route. It reuses the site chrome and keeps
// id="main" so the global skip link always has a valid target.
export default function NotFound() {
  return (
    <div className="min-h-screen">
      <Header />
      <main id="main">
        <section className="relative overflow-hidden border-b border-edge bg-soft/40">
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full bg-primary/15 blur-[110px]" />
          <div className="relative mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center sm:px-6 lg:py-32">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Error 404</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
              No encontramos esta página
            </h1>
            <p className="mt-4 max-w-md text-muted">
              La dirección puede haber cambiado o el enlace estar roto. Vuelve al inicio o explora
              nuestros servicios.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-xl bg-cta px-5 py-3 text-sm font-semibold text-white shadow-xl shadow-cta/25 transition hover:-translate-y-0.5 hover:brightness-110"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver al inicio
              </Link>
              <Link
                href="/servicios"
                className="inline-flex items-center gap-2 rounded-xl border border-edge bg-soft px-5 py-3 text-sm font-semibold text-fg transition hover:border-primary/50"
              >
                <Compass className="h-4 w-4" />
                Ver servicios
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
