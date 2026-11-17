'use client'

import { ADVISOR_CHIP_LABEL } from '@/lib/chat/copy'

export type QuickReplyAction = 'message' | 'lead'

export interface QuickReply {
  id: string
  label: string
  action: QuickReplyAction
  /** Text sent as a user message when the action is "message". */
  message?: string
}

export const QUICK_REPLIES: QuickReply[] = [
  {
    id: 'pain',
    label: 'Tengo pedidos que se me pierden',
    action: 'message',
    message: 'Tengo pedidos que se me pierden por respuesta lenta',
  },
  {
    id: 'quote',
    label: 'Quiero una cotización para mi negocio',
    action: 'message',
    message: 'Quiero una cotización para mi negocio',
  },
  { id: 'schedule', label: 'Agendar una llamada de 15 minutos', action: 'lead' },
  { id: 'advisor', label: ADVISOR_CHIP_LABEL, action: 'lead' },
]

type QuickRepliesProps = {
  disabled: boolean
  onSelect: (reply: QuickReply) => void
}

/** Shortcut chips for the most common intents. */
export default function QuickReplies({ disabled, onSelect }: QuickRepliesProps) {
  return (
    <div role="group" aria-label="Respuestas rápidas" className="flex flex-wrap gap-2 px-4 pb-2">
      {QUICK_REPLIES.map((reply) => (
        <button
          key={reply.id}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(reply)}
          className="rounded-full border border-edge bg-soft px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:border-primary/60 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {reply.label}
        </button>
      ))}
    </div>
  )
}
