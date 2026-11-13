'use client'

import { useEffect, useRef } from 'react'
import { AlertCircle, CheckCircle2, MessageCircle, Trash2, X } from 'lucide-react'
import type { ChatMessage, LeadPayload } from '@/lib/chat/types'
import { site } from '@/lib/site'
import MessageList from './MessageList'
import QuickReplies, { type QuickReply } from './QuickReplies'
import LeadCaptureForm from './LeadCaptureForm'
import ChatInput from './ChatInput'

export interface ChatError {
  message: string
  /** Renders a direct WhatsApp hand-off link (used for provider failures). */
  whatsapp?: boolean
  /** Seconds until the visitor may retry (429 responses). */
  retryAfter?: number
}

type ChatPanelProps = {
  messages: ChatMessage[]
  typing: boolean
  lead: LeadPayload | null
  leadLink: string | null
  error: ChatError | null
  leadFormOpen: boolean
  onSend: (text: string) => void
  onQuickReply: (reply: QuickReply) => void
  onSubmitLead: (lead: LeadPayload) => void
  onDismissLeadForm: () => void
  onClear: () => void
  onClose: () => void
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Modal chat panel. It traps keyboard focus while open, focuses the composer on
 * mount, and closes on Escape returning focus to the floating button.
 */
export default function ChatPanel({
  messages,
  typing,
  lead,
  leadLink,
  error,
  leadFormOpen,
  onSend,
  onQuickReply,
  onSubmitLead,
  onDismissLeadForm,
  onClear,
  onClose,
}: ChatPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Move focus into the conversation as soon as the dialog opens.
  useEffect(() => {
    const input = panelRef.current?.querySelector<HTMLElement>('[data-chat-input]')
    input?.focus()
  }, [])

  // Focus trap + Escape to close, installed on the document so it also works
  // when focus somehow lands outside the panel.
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (element) => element.getClientRects().length > 0,
      )
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <section
      ref={panelRef}
      id="chat-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Chat de Digital-devs"
      className="fixed bottom-24 right-5 z-40 flex max-h-[70vh] w-[min(92vw,24rem)] flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl shadow-black/40 motion-safe:animate-chat-panel-in"
    >
      <header className="flex items-center gap-3 border-b border-edge bg-soft/70 px-4 py-3">
        <span
          aria-hidden="true"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-white"
        >
          D
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-fg">Digital-devs</p>
          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            En línea
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          aria-label="Borrar conversación"
          title="Borrar conversación"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de chat"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-soft hover:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="mx-4 mt-3 flex items-start gap-2 rounded-xl border border-coral/40 bg-coral/10 px-3 py-2 text-xs leading-relaxed text-fg"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" aria-hidden="true" />
          <div>
            <p>{error.message}</p>
            {typeof error.retryAfter === 'number' && error.retryAfter > 0 && (
              <p className="mt-0.5 text-muted">Podrás reintentar en {error.retryAfter} segundos.</p>
            )}
            {error.whatsapp && (
              <a
                href={site.whatsappLink}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
              >
                <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Escríbenos por WhatsApp
              </a>
            )}
          </div>
        </div>
      )}

      <MessageList messages={messages} typing={typing} />

      <QuickReplies disabled={typing} onSelect={onQuickReply} />

      {leadFormOpen && !lead && (
        <LeadCaptureForm
          disabled={typing}
          onSubmitLead={onSubmitLead}
          onCancel={onDismissLeadForm}
        />
      )}

      {lead && leadLink && (
        <div className="mx-4 mb-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-xs leading-relaxed text-fg">
          <p className="flex items-center gap-1.5 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
            ¡Gracias, {lead.name}!
          </p>
          <p className="mt-1 text-muted">
            Tus datos se guardaron solo en este navegador. Continúa la conversación en WhatsApp.
          </p>
          <a
            href={leadLink}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-cta px-3 py-2 font-semibold text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Continuar en WhatsApp
          </a>
        </div>
      )}

      <p className="px-4 pb-2 text-center text-[11px] leading-relaxed text-muted">
        Esta conversación es procesada por IA. No escribas datos sensibles.
      </p>

      <ChatInput disabled={typing} onSend={onSend} />
    </section>
  )
}
