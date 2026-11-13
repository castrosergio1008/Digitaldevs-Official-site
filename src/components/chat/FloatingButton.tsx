'use client'

import type { RefObject } from 'react'
import { MessageCircle, X } from 'lucide-react'

type FloatingButtonProps = {
  open: boolean
  onToggle: () => void
  /** Exposes the button so the panel can return focus to it on close. */
  buttonRef: RefObject<HTMLButtonElement | null>
}

/**
 * Fixed bottom-right launcher. The accessible name and expanded state describe
 * the toggle so screen-reader users know what the button does.
 */
export default function FloatingButton({ open, onToggle, buttonRef }: FloatingButtonProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={onToggle}
      aria-label={open ? 'Cerrar chat' : 'Abrir chat'}
      aria-expanded={open}
      aria-controls="chat-panel"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-white shadow-xl shadow-primary/30 transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-safe:animate-chat-fab-in"
    >
      {open ? <X className="h-6 w-6" aria-hidden="true" /> : <MessageCircle className="h-6 w-6" aria-hidden="true" />}
    </button>
  )
}
