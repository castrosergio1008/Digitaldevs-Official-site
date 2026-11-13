/**
 * Minimal structural email check, shared by the client-side lead form and the
 * server-side request validation so both enforce the same contract.
 */
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
