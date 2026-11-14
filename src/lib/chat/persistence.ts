import type { LeadPayload } from '@/lib/chat/types'
import type { LeadSource } from '@/lib/leads/stores'
import { trackEvent } from './analytics'

/** Client payload for `POST /api/leads`. */
export interface PersistLeadInput extends LeadPayload {
  source: LeadSource
  /** Page route without query params. */
  path: string
  /** Clean diagnostic summary (no contact details). */
  context: string
}

/**
 * Persists a lead in the background. The caller opens WhatsApp synchronously
 * and must not await this function: the hand-off cannot be blocked by the
 * persistence layer (design doc section 3.2).
 *
 * When the server cannot persist the lead (disabled, rate limited or down),
 * the client emits a best-effort `lead_attempt` event. It deliberately does
 * NOT emit `lead_captured`: that event is reserved for the server, which is
 * the only source of truth that the lead was actually stored (design doc
 * section 4.4). `lead_attempt` preserves the signal without inflating the
 * funnel.
 */
export async function persistLead(input: PersistLeadInput, sessionId: string): Promise<void> {
  if (!sessionId) return

  try {
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...input, sessionId }),
      keepalive: true,
    })

    if (!response.ok) {
      trackEvent('lead_attempt', { method: input.method, source: input.source })
    }
  } catch {
    trackEvent('lead_attempt', { method: input.method, source: input.source })
  }
}
