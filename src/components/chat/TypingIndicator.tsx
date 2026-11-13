'use client'

/**
 * Three-dot typing indicator. The dots are decorative; the status role carries
 * the accessible announcement. The animation is disabled under reduced motion
 * via the `motion-safe:` variant.
 */
export default function TypingIndicator() {
  return (
    <div
      role="status"
      aria-label="Digital-devs está escribiendo"
      className="flex items-center gap-1.5 px-1 py-1"
    >
      <span
        aria-hidden="true"
        className="h-2 w-2 rounded-full bg-muted motion-safe:animate-chat-typing-dot"
      />
      <span
        aria-hidden="true"
        style={{ animationDelay: '0.15s' }}
        className="h-2 w-2 rounded-full bg-muted motion-safe:animate-chat-typing-dot"
      />
      <span
        aria-hidden="true"
        style={{ animationDelay: '0.3s' }}
        className="h-2 w-2 rounded-full bg-muted motion-safe:animate-chat-typing-dot"
      />
    </div>
  )
}
