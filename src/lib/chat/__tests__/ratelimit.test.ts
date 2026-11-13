import { beforeEach, describe, expect, it } from 'vitest'
import { __resetRateLimitForTests, checkRateLimit } from '../ratelimit'

describe('checkRateLimit', () => {
  beforeEach(() => __resetRateLimitForTests())

  it('allows requests under the per-minute limit', () => {
    expect(checkRateLimit('ip-1', 2, 100, 0)).toEqual({ ok: true, retryAfter: 0 })
    expect(checkRateLimit('ip-1', 2, 100, 1_000).ok).toBe(true)
  })

  it('blocks the request that exceeds the per-minute limit and reports retryAfter', () => {
    checkRateLimit('ip-2', 2, 100, 0)
    checkRateLimit('ip-2', 2, 100, 1_000)
    const blocked = checkRateLimit('ip-2', 2, 100, 2_000)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBeGreaterThan(0)
    expect(blocked.retryAfter).toBeLessThanOrEqual(60)
  })

  it('resets the per-minute window after 60 seconds', () => {
    checkRateLimit('ip-3', 1, 100, 0)
    expect(checkRateLimit('ip-3', 1, 100, 30_000).ok).toBe(false)
    expect(checkRateLimit('ip-3', 1, 100, 60_000).ok).toBe(true)
  })

  it('enforces the per-day limit', () => {
    // Minute window is generous; the day window is the binding constraint.
    expect(checkRateLimit('ip-4', 100, 1, 0).ok).toBe(true)
    const blockedDay = checkRateLimit('ip-4', 100, 1, 1_000)
    expect(blockedDay.ok).toBe(false)
    expect(blockedDay.retryAfter).toBeGreaterThan(60)
  })

  it('tracks keys independently', () => {
    checkRateLimit('ip-5', 1, 100, 0)
    expect(checkRateLimit('ip-5', 1, 100, 1_000).ok).toBe(false)
    expect(checkRateLimit('ip-6', 1, 100, 1_000).ok).toBe(true)
  })

  it('resets the day window after 24 hours', () => {
    checkRateLimit('ip-7', 100, 1, 0)
    expect(checkRateLimit('ip-7', 100, 1, 1_000).ok).toBe(false)
    expect(checkRateLimit('ip-7', 100, 1, 86_400_000).ok).toBe(true)
  })

  it('treats a zero limit as always blocked', () => {
    const blocked = checkRateLimit('ip-8', 0, 100, 0)
    expect(blocked.ok).toBe(false)
    expect(blocked.retryAfter).toBe(60)
  })
})
