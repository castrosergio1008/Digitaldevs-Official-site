import type { ChatEventName } from '@/lib/leads/stores'
import { loadChatSession } from './session'

/**
 * Metadata the `/api/events` endpoint accepts. Keeping the client typing
 * aligned with the server whitelist prevents accidental PII from being sent.
 */
export interface TrackMetadata {
  source?: 'form' | 'detection' | 'chip' | 'direct' | 'button'
  reason?: 'summary' | 'lead_form'
  method?: 'whatsapp' | 'email'
  messageCount?: number
}

/**
 * Fire-and-forget event tracking for the chat funnel. The request uses
 * `keepalive` so it can survive a page unload, and failures are swallowed:
 * analytics must never break the conversation (design doc section 3.2).
 *
 * The payload contains no PII: only the event name, the hashed-later session
 * id, the pathname and whitelisted metadata.
 */
export function trackEvent(
  eventName: ChatEventName,
  metadata: TrackMetadata = {},
  sessionId?: string,
): void {
  if (typeof window === 'undefined') return

  // Prefer the caller's live session id; fall back to the stored session so
  // the helper also works outside the widget.
  const sid = sessionId || loadChatSession()?.id
  if (!sid) return

  const payload = JSON.stringify({
    eventName,
    sessionId: sid,
    path: window.location.pathname,
    metadata,
  })

  void fetch('/api/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {
    /* analytics is best-effort by design */
  })
}
