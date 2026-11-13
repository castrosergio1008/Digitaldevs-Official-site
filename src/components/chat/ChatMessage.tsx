'use client'

import type { ChatMessage as ChatMessageModel } from '@/lib/chat/types'

/**
 * A single chat bubble. Bot messages align left on the soft surface; the
 * visitor's own messages align right on the primary tint.
 */
export default function ChatMessageBubble({ message }: { message: ChatMessageModel }) {
  const isUser = message.role === 'user'

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        data-role={message.role}
        className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed text-fg ${
          isUser ? 'rounded-br-md bg-primary/20' : 'rounded-bl-md bg-soft'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}
