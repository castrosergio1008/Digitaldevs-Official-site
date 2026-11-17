'use client'

import { useState } from 'react'
import type { RefObject } from 'react'
import { X } from 'lucide-react'
import DigitalMascot from './DigitalMascot'

type FloatingButtonProps = {
  open: boolean
  onToggle: () => void
  /** Exposes the button so the panel can return focus to it on close. */
  buttonRef: RefObject<HTMLButtonElement | null>
}

const TOOLTIP_MESSAGE = '¡Hola! Soy Digital 👋'

/**
 * Fixed bottom-right launcher with the Digital mascot and attention-grabbing
 * microinteractions: idle float, blinking eyes, a tooltip on hover/focus, and a
 * hover wiggle. The tooltip is decorative (`aria-hidden`) and never auto-plays,
 * so screen readers do not announce it in a loop. All motion is CSS-first and
 * respects prefers-reduced-motion.
 */
export default function FloatingButton({ open, onToggle, buttonRef }: FloatingButtonProps) {
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)

  const showTooltip = () => {
    if (hasInteracted || open) return
    setTooltipVisible(true)
  }

  const hideTooltip = () => setTooltipVisible(false)

  const handleClick = () => {
    setHasInteracted(true)
    setTooltipVisible(false)
    onToggle()
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-3">
      {/* Decorative bubble: hidden from assistive tech and shown on demand. */}
      {tooltipVisible && !open && !hasInteracted && (
        <div aria-hidden="true" className="digital-tooltip motion-safe:animate-chat-fab-in">
          <span className="text-sm font-medium text-fg">{TOOLTIP_MESSAGE}</span>
          <span className="digital-tooltip-arrow" aria-hidden="true" />
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={handleClick}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault()
            setTooltipVisible(false)
          }
        }}
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
