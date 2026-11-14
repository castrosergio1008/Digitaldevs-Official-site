'use client'

import { useEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'
import { X } from 'lucide-react'
import DigitalMascot from './DigitalMascot'

type FloatingButtonProps = {
  open: boolean
  onToggle: () => void
  /** Exposes the button so the panel can return focus to it on close. */
  buttonRef: RefObject<HTMLButtonElement | null>
}

const TOOLTIP_MESSAGES = [
  '¡Hola! Soy Digital 👋',
  '¿En qué puedo ayudarte?',
  'Escríbeme aquí 💬',
  '¿Tienes un proyecto en mente?',
  'Estoy para servirte ✨',
]

const TOOLTIP_DELAY_MS = 4_000
const TOOLTIP_INTERVAL_MS = 3_500

/**
 * Fixed bottom-right launcher with the Digital mascot and attention-grabbing
 * microinteractions: idle float, blinking eyes, a tooltip that cycles through
 * inviting messages, and a hover wiggle. All motion is CSS-first and respects
 * prefers-reduced-motion.
 */
export default function FloatingButton({ open, onToggle, buttonRef }: FloatingButtonProps) {
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)
  const tooltipTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // After a short idle period, show the tooltip and cycle through messages.
  // The tooltip is dismissed as soon as the visitor interacts with the widget.
  useEffect(() => {
    if (open) {
      setTooltipIndex(null)
      return
    }

    tooltipTimer.current = setTimeout(() => {
      setTooltipIndex(0)
      intervalRef.current = setInterval(() => {
        setTooltipIndex((prev) => (prev === null ? 0 : (prev + 1) % TOOLTIP_MESSAGES.length))
      }, TOOLTIP_INTERVAL_MS)
    }, TOOLTIP_DELAY_MS)

    return () => {
      if (tooltipTimer.current) clearTimeout(tooltipTimer.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [open])

  const handleClick = () => {
    setHasInteracted(true)
    setTooltipIndex(null)
    onToggle()
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Tooltip bubble */}
      {tooltipIndex !== null && !open && (
        <div
          role="status"
          className="digital-tooltip motion-safe:animate-chat-fab-in"
          aria-live="polite"
        >
          <span className="text-sm font-medium text-fg">{TOOLTIP_MESSAGES[tooltipIndex]}</span>
          <span className="digital-tooltip-arrow" aria-hidden="true" />
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat con Digital'}
        aria-expanded={open}
        aria-controls="chat-panel"
        className={`digital-fab group ${hasInteracted ? '' : 'motion-safe:animate-chat-fab-in'}`}
      >
        {open ? (
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface text-fg shadow-xl shadow-black/20 transition-colors">
            <X className="h-6 w-6" aria-hidden="true" />
          </span>
        ) : (
          <span className="digital-fab-inner">
            <DigitalMascot size={52} />
          </span>
        )}
      </button>
    </div>
  )
}
