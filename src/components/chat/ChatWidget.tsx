'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChatMessage, ChatResponse, LeadPayload } from '@/lib/chat/types'
import { site } from '@/lib/site'
import {
  buildLeadContext,
  buildWhatsAppLink,
  CHAT_GREETING,
  detectContactInfo,
  extractNameFromMessage,
  shouldDetectContact,
} from '@/lib/chat/lead'
import {
  clearChatSession,
  createSessionId,
  loadChatSession,
  saveChatSession,
  trimMessages,
} from '@/lib/chat/session'
import FloatingButton from './FloatingButton'
import ChatPanel, { type ChatError } from './ChatPanel'
import type { QuickReply } from './QuickReplies'

const GREETING: ChatMessage = {
  role: 'assistant',
  content: CHAT_GREETING,
}

/** Maps an `/api/chat` failure to a friendly, user-facing message. */
async function readChatError(response: Response): Promise<ChatError> {
  let body: { error?: string; retryAfter?: number } = {}
  try {
    body = (await response.json()) as { error?: string; retryAfter?: number }
  } catch {
    body = {}
  }

  if (response.status === 429) {
    return {
      message: 'Demasiadas peticiones, intenta en un momento',
      retryAfter: typeof body.retryAfter === 'number' ? body.retryAfter : undefined,
    }
  }
  if (response.status === 502) {
    return {
      message: body.error || 'No puedo responder ahora. Escríbenos por WhatsApp.',
      whatsapp: true,
    }
  }
  if (response.status === 503) {
    return { message: 'El chat no está disponible.' }
  }
  return { message: body.error || 'No pude enviar tu mensaje. Intenta de nuevo.' }
}

/**
 * Root widget: owns the conversation state, persistence and the `/api/chat`
 * integration. Rendering stays lightweight; the panel is only mounted while
 * open.
 */
export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING])
  const [sessionId, setSessionId] = useState('')
  const [lead, setLead] = useState<LeadPayload | null>(null)
  const [typing, setTyping] = useState(false)
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [error, setError] = useState<ChatError | null>(null)
  const [hydrated, setHydrated] = useState(false)
  const buttonRef = useRef<HTMLButtonElement | null>(null)

  // Load the stored conversation only after mount, so the server markup and the
  // first client render stay free of localStorage reads.
  useEffect(() => {
    const stored = loadChatSession()
    if (stored) {
      setMessages(stored.messages.length > 0 ? stored.messages : [GREETING])
      setSessionId(stored.id)
      if (stored.lead) setLead(stored.lead)
    } else {
      setSessionId(createSessionId())
    }
    setHydrated(true)
  }, [])

  // Persist every change, but never before the stored session was read.
  useEffect(() => {
    if (!hydrated || !sessionId) return
    saveChatSession({ id: sessionId, messages, lead: lead ?? undefined, updatedAt: Date.now() })
  }, [hydrated, sessionId, messages, lead])

  const close = useCallback(() => {
    setOpen(false)
    // Return focus to the launcher once the panel has unmounted.
    window.setTimeout(() => buttonRef.current?.focus(), 0)
  }, [])

  const toggle = useCallback(() => {
    if (open) {
      close()
      return
    }
    setError(null)
    setOpen(true)
  }, [open, close])

  const sendMessage = useCallback(
    async (text: string) => {
      if (typing) return

      const nextMessages = trimMessages([...messages, { role: 'user', content: text }])
      setMessages(nextMessages)
      setTyping(true)
      setError(null)

      // Detect contact info in the user's message. When found and no lead has
      // been captured yet, open WhatsApp immediately (within the user-activation
      // window) so the conversation continues there without a link click.
      let detectedLead: LeadPayload | null = null
      if (!lead && shouldDetectContact(text)) {
        const detected = detectContactInfo(text)
        if (detected) {
          detectedLead = {
            name: extractNameFromMessage(text) ?? 'Visitante',
            contact: detected.contact,
            method: detected.method,
          }
          setLead(detectedLead)
          setLeadFormOpen(false)

          window.open(
            buildWhatsAppLink(detectedLead.name, buildLeadContext(detectedLead, nextMessages)),
            '_blank',
            'noopener',
          )
        }
      }

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: sessionId || undefined,
            messages: nextMessages,
            lead: lead ?? detectedLead ?? undefined,
          }),
        })

        if (response.ok) {
          const data = (await response.json()) as ChatResponse
          if (data.sessionId) setSessionId(data.sessionId)
          const withReply = [...nextMessages, { role: 'assistant' as const, content: data.reply }]
          if (detectedLead) {
            withReply.push({
              role: 'assistant',
              content:
                '¡Listo! Ya abrí WhatsApp para que continúes la conversación con nuestro equipo. Si no se abrió, revisa las ventanas o pestañas de tu navegador.',
            })
          }
          setMessages(trimMessages(withReply))
        } else {
          setError(await readChatError(response))
        }
      } catch {
        setError({ message: 'No pude conectarme. Revisa tu conexión e intenta de nuevo.' })
      } finally {
        setTyping(false)
      }
    },
    [typing, messages, sessionId, lead],
  )

  const handleQuickReply = (reply: QuickReply) => {
    if (typing) return

    if (reply.action === 'message' && reply.message) {
      void sendMessage(reply.message)
      return
    }
    if (reply.action === 'lead') {
      // Guarantee at least one user turn so the lead request is a valid payload.
      const hasUserMessage = messages.some((message) => message.role === 'user')
      if (!hasUserMessage) {
        setMessages(trimMessages([...messages, { role: 'user', content: reply.label }]))
      }
      setLeadFormOpen(true)
      return
    }
    // Direct human hand-off without the form.
    window.open(site.whatsappLink, '_blank', 'noopener')
  }

  const submitLead = async (payload: LeadPayload) => {
    setLead(payload)
    setLeadFormOpen(false)
    setTyping(true)
    setError(null)

    // Open WhatsApp while the submit user activation is still valid: browsers
    // block popups opened after an async API round-trip. The confirmation card
    // keeps the same link as a fallback if the popup is blocked.
    window.open(
      buildWhatsAppLink(payload.name, buildLeadContext(payload, messages)),
      '_blank',
      'noopener',
    )

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessionId || undefined,
          messages,
          lead: payload,
        }),
      })

      if (response.ok) {
        const data = (await response.json()) as ChatResponse
        if (data.sessionId) setSessionId(data.sessionId)
      } else {
        setError(await readChatError(response))
      }
    } catch {
      setError({ message: 'No pude conectarme. Revisa tu conexión e intenta de nuevo.' })
    } finally {
      setTyping(false)
    }
  }

  const clearConversation = () => {
    clearChatSession()
    setSessionId(createSessionId())
    setMessages([GREETING])
    setLead(null)
    setLeadFormOpen(false)
    setError(null)
    setTyping(false)
  }

  const leadLink = lead ? buildWhatsAppLink(lead.name, buildLeadContext(lead, messages)) : null

  return (
    <>
      <FloatingButton open={open} onToggle={toggle} buttonRef={buttonRef} />
      {open && (
        <ChatPanel
          messages={messages}
          typing={typing}
          lead={lead}
          leadLink={leadLink}
          error={error}
          leadFormOpen={leadFormOpen}
          onSend={(text) => void sendMessage(text)}
          onQuickReply={handleQuickReply}
          onSubmitLead={(payload) => void submitLead(payload)}
          onDismissLeadForm={() => setLeadFormOpen(false)}
          onClear={clearConversation}
          onClose={close}
        />
      )}
    </>
  )
}
