'use client'

import { useEffect, useRef } from 'react'
import type { ChatMessage } from '@/lib/chat/types'
import ChatMessageBubble from './ChatMessage'
import TypingIndicator from './TypingIndicator'

type MessageListProps = {
  messages: ChatMessage[]
  typing: boolean
}

/**
 * Conversation log. `role="log"` plus `aria-live="polite"` announces new turns
 * without stealing focus, and the list auto-scrolls to the latest message.
 */
export default function MessageList({ messages, typing }: MessageListProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    list.scrollTo({ top: list.scrollHeight, behavior: reduceMotion ? 'auto' : 'smooth' })
  }, [messages.length, typing])

  return (
    <div
      ref={listRef}
      role="log"
      aria-live="polite"
      aria-label="Conversación"
      className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-4 py-3"
    >
      {messages.map((message, index) => (
        <ChatMessageBubble key={`${index}-${message.role}`} message={message} />
      ))}
      {typing && <TypingIndicator />}
    </div>
  )
}
