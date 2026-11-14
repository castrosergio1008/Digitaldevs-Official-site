import { NextRequest, NextResponse } from 'next/server'
import { site } from '@/lib/site'

/** JSON response helper shared by the API route handlers. */
export function json(status: number, body: Record<string, unknown>): NextResponse {
  return NextResponse.json(body, { status })
}

function firstForwardedValue(header: string | null): string | null {
  const first = header?.split(',')[0]?.trim()
  return first ? first : null
}

/**
 * Resolves the client IP for rate limiting. Vercel sets `x-real-ip` and
 * `x-vercel-forwarded-for` and they cannot be spoofed by the caller, so they
 * are trusted first; a client-supplied `x-forwarded-for` is only used when no
 * platform header is present.
 */
export function getClientIp(req: NextRequest): string {
  return (
    firstForwardedValue(req.headers.get('x-real-ip')) ??
    firstForwardedValue(req.headers.get('x-vercel-forwarded-for')) ??
    firstForwardedValue(req.headers.get('x-forwarded-for')) ??
    'unknown'
  )
}

/**
 * Returns the origins a legitimate request may come from: the origin the
 * request actually arrived at, plus the canonical site origin (preview
 * deployments and the marketing domain can differ).
 */
function expectedOrigins(req: NextRequest): string[] {
  const origins = new Set<string>([new URL(site.url).origin])
  try {
    origins.add(new URL(req.url).origin)
  } catch {
    // A malformed request URL cannot match anything; site.url still applies.
  }
  return [...origins]
}

/** Parses an Origin header value into a normalized origin, or null if invalid. */
function parseOrigin(value: string): string | null {
  try {
    return new URL(value).origin
  } catch {
    return null
  }
}

/**
 * Rejects cross-origin browser requests (CSRF). By default an absent Origin
 * header is accepted because non-browser clients (native apps, server-to-server)
 * do not send it. Endpoints that persist PII pass `requireOrigin = true` so a
 * request without Origin is rejected: browsers always send it, so this only
 * blocks non-browser callers from writing personal data. Opaque origins
 * ("null") never match.
 */
export function isAllowedOrigin(req: NextRequest, requireOrigin = false): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return !requireOrigin
  const candidate = parseOrigin(origin)
  return candidate !== null && expectedOrigins(req).includes(candidate)
}

export function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? '', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}
