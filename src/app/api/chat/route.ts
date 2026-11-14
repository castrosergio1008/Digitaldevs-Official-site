import { NextRequest, NextResponse } from 'next/server'
import type { ChatMessage } from '@/lib/chat/types'
import { ChatProviderError } from '@/lib/chat/types'
import { buildSystemPrompt } from '@/lib/chat/knowledge'
import { CHAT_FALLBACK_REPLY } from '@/lib/chat/fallback'
import { isDisabled } from '@/lib/chat/killswitch'
import { DEFAULT_CHAT_MODEL, DEFAULT_CHAT_PROVIDER, getChatProvider } from '@/lib/chat/provider'
import { checkRateLimit } from '@/lib/chat/ratelimit'
import { redactContactInfo } from '@/lib/chat/lead'
import { MAX_PAYLOAD_BYTES, parseChatRequest } from '@/lib/chat/validation'
import { getClientIp, isAllowedOrigin, json, readPositiveInt } from '@/lib/chat/http'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

// Keep some headroom under maxDuration for the provider round-trip.
const PROVIDER_TIMEOUT_MS = 25_000

/** Returns the env var that holds the key a provider needs, or null for mock. */
function requiredKeyForProvider(provider: string): string | null {
  switch (provider) {
    case 'opencode-go':
      return 'OPENCODE_API_KEY'
    case 'anthropic':
      return 'ANTHROPIC_API_KEY'
    case 'openai':
      return 'OPENAI_API_KEY'
    case 'mock':
      return null
    default:
      return null
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const providerName = process.env.CHAT_PROVIDER ?? DEFAULT_CHAT_PROVIDER

  // Kill switch: disabled by env, or the configured provider has no key.
  if (isDisabled(process.env.CHAT_ENABLED)) {
    return json(503, { error: 'El chat no está disponible.' })
  }
  const requiredKey = requiredKeyForProvider(providerName)
  if (requiredKey && !process.env[requiredKey]) {
    return json(503, { error: 'El chat no está disponible.' })
  }

  // CSRF: reject browser requests that did not originate from this site.
  if (!isAllowedOrigin(req)) {
    return json(403, { error: 'Solicitud inválida' })
  }

  // Read the raw body first so oversized payloads are rejected before parsing.
  // The byte length matters, not the UTF-16 code-unit count.
  let raw: string
  try {
    raw = await req.text()
  } catch {
    return json(400, { error: 'Solicitud inválida' })
  }
  if (Buffer.byteLength(raw, 'utf8') > MAX_PAYLOAD_BYTES) {
    return json(400, { error: 'Solicitud inválida' })
  }

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'Solicitud inválida' })
  }

  const maxMessages = readPositiveInt(process.env.CHAT_MAX_MESSAGES, 20)
  const maxMessageLength = readPositiveInt(process.env.CHAT_MAX_MESSAGE_LENGTH, 800)

  const parsed = parseChatRequest(body, { maxMessages, maxMessageLength })
  if (!parsed.ok) {
    // Static validation message only; never log visitor content.
    console.warn(`[chat] invalid request: ${parsed.error}`)
    return json(400, { error: 'Solicitud inválida' })
  }

  const ip = getClientIp(req)
  const limitPerMin = readPositiveInt(process.env.CHAT_RATE_LIMIT_PER_MIN, 10)
  const limitPerDay = readPositiveInt(process.env.CHAT_RATE_LIMIT_PER_DAY, 100)
  // Namespace the limiter so the chat budget is independent from the leads and
  // events budgets (design doc section 3.2: "rate limit propio").
  const rate = checkRateLimit(`chat:${ip}`, limitPerMin, limitPerDay)
  if (!rate.ok) {
    return json(429, { error: 'Demasiadas peticiones', retryAfter: rate.retryAfter })
  }

  const model = process.env.CHAT_MODEL ?? DEFAULT_CHAT_MODEL

  // Everything from provider creation onward is guarded so a configuration or
  // upstream failure degrades to the friendly 502 instead of an uncontrolled 5xx.
  try {
    const provider = getChatProvider()

    const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt() }]

    // Let the model know the visitor left contact details, without exposing the
    // contact itself (the client owns the WhatsApp hand-off). Kept out of the
    // conversation history so it cannot be echoed back.
    if (parsed.data.lead) {
      messages.push({
        role: 'system',
        content:
          'Contexto: el visitante dejó sus datos de contacto para que el equipo lo contacte. No los solicites de nuevo ni los menciones en tu respuesta.',
      })
    }

    messages.push(...parsed.data.messages)

    // Redact contact details from the conversation before it reaches the AI
    // provider. The visitor's phone/email is only needed for the WhatsApp
    // hand-off, never for the model. System prompts are left untouched.
    const sanitizedMessages: ChatMessage[] = messages.map((message) =>
      message.role === 'system'
        ? message
        : { ...message, content: redactContactInfo(message.content) },
    )

    const reply = (
      await provider.complete(sanitizedMessages, {
        sessionId: parsed.data.sessionId,
        signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
      })
    ).trim()
    return json(200, {
      reply: reply || CHAT_FALLBACK_REPLY,
      sessionId: parsed.data.sessionId ?? '',
      leadCaptured: parsed.data.lead !== undefined,
      provider: provider.name,
      model,
    })
  } catch (error) {
    // Log only non-PII metadata; never log the conversation or the API key.
    const status = error instanceof ChatProviderError ? error.status : undefined
    console.error('[chat] provider failure', {
      provider: process.env.CHAT_PROVIDER ?? DEFAULT_CHAT_PROVIDER,
      status,
    })
    // Existing 502 body is part of the API contract; keep it verbatim.
    return json(502, { error: 'No puedo responder ahora. Escríbenos por WhatsApp.' })
  }
}
