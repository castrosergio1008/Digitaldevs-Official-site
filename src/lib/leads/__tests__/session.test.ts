import { describe, expect, it } from 'vitest'
import { hashSessionId } from '../session'

describe('hashSessionId', () => {
  it('is deterministic for the same session and pepper', () => {
    expect(hashSessionId('session-1', 'pepper')).toBe(hashSessionId('session-1', 'pepper'))
  })

  it('changes when the session changes', () => {
    expect(hashSessionId('session-1', 'pepper')).not.toBe(hashSessionId('session-2', 'pepper'))
  })

  it('changes when the pepper changes', () => {
    expect(hashSessionId('session-1', 'pepper-a')).not.toBe(hashSessionId('session-1', 'pepper-b'))
  })

  it('returns a lowercase hex sha256 digest', () => {
    expect(hashSessionId('session-1', 'pepper')).toMatch(/^[0-9a-f]{64}$/)
  })

  it('does not contain the plaintext session id', () => {
    const hash = hashSessionId('super-secret-session-id', 'pepper')
    expect(hash).not.toContain('super-secret-session-id')
  })

  it('matches the documented sha256(sessionId + pepper) construction', async () => {
    const { createHash } = await import('node:crypto')
    const expected = createHash('sha256').update('abc' + 'pepper', 'utf8').digest('hex')
    expect(hashSessionId('abc', 'pepper')).toBe(expected)
  })
})
