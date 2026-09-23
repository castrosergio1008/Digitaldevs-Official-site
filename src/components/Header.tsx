'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X, MessageCircle, BadgeCheck } from 'lucide-react'
import { nav, site } from '@/lib/site'
import ThemeToggle from './ThemeToggle'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [active, setActive] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = nav
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
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled ? 'glass shadow-lg shadow-black/5' : 'bg-transparent border-transparent'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="#inicio" className="flex items-center gap-3" onClick={() => setOpen(false)}>
          <Image
            src="/logo.png"
            alt="Logo de Digitaldevs"
            width={40}
            height={40}
            className="h-10 w-10 rounded-lg object-cover"
            priority
          />
          <span className="text-lg font-bold tracking-tight text-fg">
            Digital<span className="text-primary">devs</span>
          </span>
          <span className="hidden items-center gap-1 rounded-full border border-edge bg-soft px-2 py-0.5 text-[10px] font-semibold text-muted sm:inline-flex">
            <BadgeCheck className="h-3 w-3 text-accent" />
            Sitio oficial
          </span>
        </Link>

        <nav aria-label="Menú principal" className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              aria-current={active === item.href ? 'location' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-soft hover:text-fg ${
                active === item.href ? 'font-semibold text-fg' : 'text-muted'
              }`}
            >
              {item.label}
            </a>
          ))}
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
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-soft"
              >
                {item.label}
              </a>
            ))}
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