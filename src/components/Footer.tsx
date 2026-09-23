import Image from 'next/image'
import { Mail, MessageCircle, MapPin } from 'lucide-react'
import { nav, site } from '@/lib/site'

export default function Footer() {
  return (
    <footer className="border-t border-edge bg-soft/60">
      <div className="mx-auto max-w-6xl px-4 pb-10 pt-14 sm:px-6">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Logo Digitaldevs" width={40} height={40} className="h-10 w-10 rounded-lg object-cover" />
              <span className="text-lg font-bold tracking-tight text-fg">
                Digital<span className="text-primary">devs</span>
              </span>
            </div>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
              Desarrollo de software a la medida: sitios web, tiendas en línea y aplicaciones que
              ayudan a tu negocio a crecer. Innovación, confianza y resultados.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a href={site.whatsappLink} target="_blank" rel="noreferrer" aria-label="WhatsApp" className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-surface text-muted transition-colors hover:border-emerald-400/50 hover:text-fg">
                <MessageCircle className="h-4 w-4" />
              </a>
              <a href={`mailto:${site.email}`} aria-label="Correo" className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-surface text-muted transition-colors hover:border-primary/50 hover:text-fg">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Secciones</h4>
            <ul className="mt-4 space-y-2">
              {nav.map((n) => (
                <li key={n.href}>
                  <a href={n.href} className="text-sm text-muted transition-colors hover:text-fg">
                    {n.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-muted">Contacto</h4>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li>
                <a href={`mailto:${site.email}`} className="transition-colors hover:text-fg">
                  {site.email}
                </a>
              </li>
              <li>
                <a href={site.whatsappLink} target="_blank" rel="noreferrer" className="transition-colors hover:text-fg">
                  {site.whatsapp}
                </a>
              </li>
              <li className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {site.city}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-edge pt-6 text-xs text-muted sm:flex-row">
          <span>
            © {site.year} {site.name} · Sitio oficial · Todos los derechos reservados.
          </span>
          <span className="font-mono">software a la medida · remoto LATAM</span>
        </div>
      </div>
    </footer>
  )
}