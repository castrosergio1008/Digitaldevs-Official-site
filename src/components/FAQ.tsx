'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { faqs, type Faq } from '@/lib/content'
import Reveal from './Reveal'

type FAQProps = {
  id?: string
  // Unique prefix for the collapsible panel IDs.
  idPrefix?: string
  eyebrow?: string
  title?: string
  description?: string
  items?: Faq[]
}

export default function FAQ({
  id,
  idPrefix = 'faq',
  eyebrow = 'Preguntas frecuentes',
  title = 'Resolvemos tus dudas',
  description = '¿Tienes otra pregunta? Escríbenos por WhatsApp o email y te respondemos rápido.',
  items = faqs,
}: FAQProps) {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section id={id} className="relative border-y border-edge bg-soft/60">
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:py-28">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
          <p className="mt-4 text-muted">{description}</p>
        </Reveal>

        <div className="space-y-3">
          {items.map((f, i) => {
            const open = openIdx === i
            const panelId = `${idPrefix}-panel-${i}`
            return (
              <Reveal key={f.q} delay={i * 40}>
                <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
                  <button
                    onClick={() => setOpenIdx(open ? null : i)}
                    aria-expanded={open}
                    aria-controls={panelId}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <h3 className="text-sm font-semibold text-fg sm:text-base">{f.q}</h3>
                    <ChevronDown
                      className={`shrink-0 text-muted transition-transform duration-200 ${open ? 'rotate-180 text-primary' : ''}`}
                    />
                  </button>
                  <div
                    id={panelId}
                    className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}
