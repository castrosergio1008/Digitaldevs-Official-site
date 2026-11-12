import Link from 'next/link'
import {
  Globe,
  ShoppingCart,
  LayoutDashboard,
  Rocket,
  Smartphone,
  LifeBuoy,
  Check,
  type LucideIcon,
} from 'lucide-react'
import type { Service, ServiceKey } from '@/lib/content'

export const SERVICE_ICONS: Record<ServiceKey, LucideIcon> = {
  web: Globe,
  ecommerce: ShoppingCart,
  apps: LayoutDashboard,
  mvp: Rocket,
  pwa: Smartphone,
  support: LifeBuoy,
}

// Bento layout hints reused by the home grid and the /servicios index so both
// render the exact same card geometry.
export const SERVICE_BENTO: Record<ServiceKey, string> = {
  web: 'sm:col-span-2',
  ecommerce: '',
  apps: 'sm:row-span-2',
  mvp: '',
  pwa: '',
  support: 'sm:col-span-2',
}

type ServiceCardProps = {
  service: Service
  // When provided the card becomes a link to the service detail page.
  href?: string
  ariaLabel?: string
}

export default function ServiceCard({ service, href, ariaLabel }: ServiceCardProps) {
  const Icon = SERVICE_ICONS[service.key]
  const className =
    'group flex h-full flex-col rounded-2xl border border-edge bg-surface p-6 transition-all duration-200 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5'

  const content = (
    <>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-lg shadow-primary/20">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-bold text-fg">{service.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted">{service.description}</p>
      <ul className="mt-4 space-y-1.5">
        {service.points.map((point) => (
          <li key={point} className="flex items-start gap-2 text-xs text-muted">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <span>{point}</span>
          </li>
        ))}
      </ul>
    </>
  )

  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={className}>
        {content}
      </Link>
    )
  }

  return <div className={className}>{content}</div>
}
