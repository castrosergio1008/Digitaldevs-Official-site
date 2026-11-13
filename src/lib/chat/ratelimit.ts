// In-memory fixed-window rate limiter.
//
// Honest limitation: Vercel serverless instances are ephemeral and can scale
// horizontally, so this counter is best-effort and is not shared across
// instances. For robust protection, move the store to a shared backend
// (Upstash Redis / Vercel KV) in a later phase (design doc section 4.9).

const MINUTE_MS = 60_000
const DAY_MS = 86_400_000
const MAX_KEYS = 10_000

interface WindowState {
  minuteStart: number
  minuteCount: number
  dayStart: number
  dayCount: number
}

const store = new Map<string, WindowState>()

export interface RateLimitResult {
  ok: boolean
  /** Seconds until the visitor may retry (0 when allowed). */
  retryAfter: number
}

/**
 * Registers a request against the fixed per-minute and per-day windows.
 * `now` is injectable for deterministic tests; it defaults to `Date.now()`.
 */
export function checkRateLimit(
  key: string,
  limitPerMin: number,
  limitPerDay: number,
  now: number = Date.now(),
): RateLimitResult {
  let state = store.get(key)

  if (!state) {
    state = { minuteStart: now, minuteCount: 0, dayStart: now, dayCount: 0 }
    store.set(key, state)
  }

  // Reset windows that have elapsed.
  if (now - state.minuteStart >= MINUTE_MS) {
    state.minuteStart = now
    state.minuteCount = 0
  }
  if (now - state.dayStart >= DAY_MS) {
    state.dayStart = now
    state.dayCount = 0
  }

  const blockedByMinute = state.minuteCount >= limitPerMin
  const blockedByDay = state.dayCount >= limitPerDay

  if (!blockedByMinute && !blockedByDay) {
    state.minuteCount += 1
    state.dayCount += 1
    return { ok: true, retryAfter: 0 }
  }

  // The visitor may retry only when every exceeded window has reset.
  let retryAfter = 0
  if (blockedByMinute) {
    retryAfter = Math.max(retryAfter, MINUTE_MS - (now - state.minuteStart))
  }
  if (blockedByDay) {
    retryAfter = Math.max(retryAfter, DAY_MS - (now - state.dayStart))
  }

  pruneExpired(now)

  return { ok: false, retryAfter: Math.ceil(retryAfter / 1000) }
}

function pruneExpired(now: number): void {
  if (store.size <= MAX_KEYS) return
  for (const [key, state] of store) {
    if (now - state.dayStart >= DAY_MS) store.delete(key)
  }
}

/** Clears the limiter store. Test-only helper. */
export function __resetRateLimitForTests(): void {
  store.clear()
}
