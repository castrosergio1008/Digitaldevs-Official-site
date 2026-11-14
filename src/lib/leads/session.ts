import { createHash } from 'node:crypto'

export const SESSION_HASH_ALGORITHM = 'sha256'

/**
 * Deterministically hashes a client-generated session id with a server-side
 * pepper. The plaintext session id is never persisted: events and leads store
 * only this hash, so a stolen events table cannot be correlated with a lead
 * (or reversed into a session) without the pepper.
 *
 * The construction follows the approved design doc (section 4.4):
 * `sha256(sessionId + SESSION_PEPPER)`.
 */
export function hashSessionId(sessionId: string, pepper: string): string {
  return createHash(SESSION_HASH_ALGORITHM).update(`${sessionId}${pepper}`, 'utf8').digest('hex')
}
