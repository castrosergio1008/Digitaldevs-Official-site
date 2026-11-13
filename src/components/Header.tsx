'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, MessageCircle, BadgeCheck, ChevronDown } from 'lucide-react'
import { nav, site } from '@/lib/site'
import { services } from '@/lib/content'
import { SERVICE_ICONS } from './ServiceCard'
import ThemeToggle from './ThemeToggle'

const SERVICES_PATH = '/servicios'

// Anchor items stay in-page on the home and become absolute paths on internal
// routes; absolute routes (like /servicios) are always returned untouched.
function resolveHref(target: string, isHome: boolean): string {
  if (target.startsWith('/')) return target
  return isHome ? target : `/${target}`
}

export default function Header() {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isServicesPath = pathname.startsWith(SERVICES_PATH)

  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')

  const [servicesOpen, setServicesOpen] = useState(false)
  const servicesRef = useRef<HTMLDivElement>(null)
  const servicesButtonRef = useRef<HTMLButtonElement>(null)
  const servicesPinned = useRef(false)
  const servicesHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [mobileServicesOpen, setMobileServicesOpen] = useState(false)
  const mobileServicesRef = useRef<HTMLDivElement>(null)
  const mobileServicesButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Any navigation closes the overlays.
  useEffect(() => {
    setOpen(false)
    setServicesOpen(false)
    setMobileServicesOpen(false)
    servicesPinned.current = false
  }, [pathname])

  useEffect(() => {
    if (!isHome) return

    const sections = nav
      .filter((item) => item.href.startsWith('#'))
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((el): el is HTMLElement => el !== null)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const hash = `#${entry.target.id}`
          if (entry.isIntersecting) {
            setActive(hash)
          } else {
            setActive((prev) => (prev === hash ? '' : prev))
          }
        })
      },
      { rootMargin: '-45% 0px -50% 0px' }
    )

    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [isHome])

  // Close the desktop dropdown on outside clicks.
  useEffect(() => {
    if (!servicesOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (servicesRef.current && !servicesRef.current.contains(event.target as Node)) {
        servicesPinned.current = false
        setServicesOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [servicesOpen])

  // Close the mobile submenu on outside clicks (the mobile nav itself stays open).
  useEffect(() => {
    if (!mobileServicesOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (mobileServicesRef.current && !mobileServicesRef.current.contains(event.target as Node)) {
        setMobileServicesOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [mobileServicesOpen])

  const clearServicesHoverTimer = () => {
    if (servicesHoverTimer.current) {
      clearTimeout(servicesHoverTimer.current)
      servicesHoverTimer.current = null
    }
  }

  const toggleServices = () => {
    clearServicesHoverTimer()
    const next = !servicesOpen
    servicesPinned.current = next
    setServicesOpen(next)
  }

  const handleServicesMouseEnter = () => {
    clearServicesHoverTimer()
    servicesHoverTimer.current = setTimeout(() => {
      servicesHoverTimer.current = null
      setServicesOpen(true)
    }, 120)
  }

  const handleServicesMouseLeave = () => {
    clearServicesHoverTimer()
    // A click-pinned menu stays open until dismissed, even when the pointer leaves.
    if (servicesPinned.current) return
    servicesHoverTimer.current = setTimeout(() => {
      servicesHoverTimer.current = null
      setServicesOpen(false)
    }, 160)
  }

  const closeServices = (restoreFocus: boolean) => {
    clearServicesHoverTimer()
    servicesPinned.current = false
    setServicesOpen(false)
    if (restoreFocus) servicesButtonRef.current?.focus()
  }

  const handleServicesKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && servicesOpen) {
      event.preventDefault()
      closeServices(true)
    }
  }

  const toggleMobileServices = () => {
    setMobileServicesOpen((value) => !value)
  }

  const handleMobileServicesKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && mobileServicesOpen) {
      event.preventDefault()
      setMobileServicesOpen(false)
      mobileServicesButtonRef.current?.focus()
    }
  }

  const handleServiceNavigate = () => {
    servicesPinned.current = false
    setServicesOpen(false)
    setMobileServicesOpen(false)
    setOpen(false)
  }

  const serviceLinks = () => (
    <>
      {services.map((service) => {
        const Icon = SERVICE_ICONS[service.key]
        return (
          <li key={service.key}>
            <Link
              href={`/servicios/${service.slug}`}
              aria-label={`Ver detalle de ${service.title}`}
              onClick={handleServiceNavigate}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-fg transition-colors hover:bg-soft hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                <Icon className="h-4 w-4" />
              </span>
              <span className="font-medium">{service.title}</span>
            </Link>
          </li>
        )
      })}
    </>
  )

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? 'glass shadow-lg shadow-black/5' : 'bg-transparent border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/og.png"
            alt="Logo de Digital-devs"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
            priority
          />
          <span className="text-lg font-bold tracking-tight text-fg">
            Digital-<span className="text-primary">devs</span>
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-edge bg-soft px-2 py-0.5 text-[10px] font-semibold text-muted sm:inline-flex">
            <BadgeCheck className="h-3 w-3 text-accent" />
            Sitio oficial
          </span>
        </Link>

        <nav aria-label="Menú principal" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => {
            const href = resolveHref(item.href, isHome)
            const isServicesItem = item.href === SERVICES_PATH

            if (isServicesItem) {
              return (
                <div
                  key={item.href}
                  ref={servicesRef}
                  onMouseEnter={handleServicesMouseEnter}
                  onMouseLeave={handleServicesMouseLeave}
                  onKeyDown={handleServicesKeyDown}
                  className="relative"
                >
                  <div className="flex items-center gap-0.5">
                    <Link
                      href={href}
                      aria-current={isServicesPath ? 'page' : undefined}
                      onClick={() => closeServices(false)}
                      className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                        isServicesPath ? 'font-semibold text-fg' : 'text-muted'
                      }`}
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      ref={servicesButtonRef}
                      onClick={toggleServices}
                      aria-haspopup="true"
                      aria-expanded={servicesOpen}
                      aria-controls="services-menu"
                      aria-label="Menú de servicios"
                      className={`flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 ${
                        servicesOpen ? 'bg-soft text-fg' : ''
                      }`}
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          servicesOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {servicesOpen && (
                    <div
                      id="services-menu"
                      className="absolute left-1/2 top-full z-50 mt-2 w-80 -translate-x-1/2 rounded-2xl border border-edge bg-surface p-2 shadow-xl shadow-black/20"
                    >
                      <ul className="space-y-1">{serviceLinks()}</ul>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={href}
                aria-current={active === item.href ? 'location' : undefined}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-soft hover:text-fg ${
                  active === item.href ? 'font-semibold text-fg' : 'text-muted'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-lg bg-cta px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cta/20 transition hover:brightness-110 sm:inline-flex"
          >
            <MessageCircle className="h-4 w-4" />
            Hablemos
          </a>
          <button
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-edge bg-soft text-muted lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div
        className={`border-t border-edge bg-background/95 px-4 pb-5 pt-2 backdrop-blur-xl lg:hidden ${
          open ? '' : 'hidden'
        }`}
      >
        <nav id="mobile-nav" aria-label="Menú móvil" className="flex flex-col gap-1">
          {nav.map((item) => {
            const href = resolveHref(item.href, isHome)
            const isServicesItem = item.href === SERVICES_PATH

            if (isServicesItem) {
              return (
                <div
                  key={item.href}
                  ref={mobileServicesRef}
                  onKeyDown={handleMobileServicesKeyDown}
                  className="rounded-lg"
                >
                  <div className="flex items-center gap-1">
                    <Link
                      href={href}
                      aria-current={isServicesPath ? 'page' : undefined}
                      onClick={handleServiceNavigate}
                      className="flex-1 rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      {item.label}
                    </Link>
                    <button
                      type="button"
                      ref={mobileServicesButtonRef}
                      onClick={toggleMobileServices}
                      aria-haspopup="true"
                      aria-expanded={mobileServicesOpen}
                      aria-controls="mobile-services-menu"
                      aria-label="Menú de servicios"
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          mobileServicesOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                  {mobileServicesOpen && (
                    <div id="mobile-services-menu" className="mb-1 mt-1 border-l border-edge pl-3">
                      <ul className="space-y-1">{serviceLinks()}</ul>
                    </div>
                  )}
                </div>
              )
            }

            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-soft"
              >
                {item.label}
              </Link>
            )
          })}
          <a
            href={site.whatsappLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-cta px-4 py-3 text-sm font-semibold text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Hablemos por WhatsApp
          </a>
        </nav>
      </div>
    </header>
  )
}
