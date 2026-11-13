'use client'

import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'

type ChatInputProps = {
  disabled: boolean
  onSend: (text: string) => void
}

/**
 * Message composer. Enter sends, Shift+Enter inserts a newline. The textarea
 * grows with the content up to a cap so long messages stay readable.
 */
export default function ChatInput({ disabled, onSend }: ChatInputProps) {
  const [value, setValue] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`
  }, [value])

  const submit = () => {
    const text = value.trim()
    if (!text || disabled) return
    onSend(text)
    setValue('')
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="flex items-end gap-2 border-t border-edge bg-soft/60 px-3 py-2.5"
    >
      <textarea
        ref={textareaRef}
        data-chat-input
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Escribe tu mensaje…"
        aria-label="Escribe tu mensaje"
        maxLength={800}
        className="max-h-32 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-fg placeholder:text-muted/70 outline-none disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={disabled || value.trim().length === 0}
        aria-label="Enviar mensaje"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Send className="h-4 w-4" aria-hidden="true" />
      </button>
    </form>
  )
}
