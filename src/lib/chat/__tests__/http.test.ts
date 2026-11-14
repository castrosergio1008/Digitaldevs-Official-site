import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { getClientIp, isAllowedOrigin } from '../http'

function makeRequest(headers: Record<string, string>): NextRequest {
  return new NextRequest('http://localhost/api/leads', {
    method: 'POST',
    headers,
  })
}

describe('isAllowedOrigin', () => {
  it('accepts a request without an Origin by default (non-browser clients)', () => {
    expect(isAllowedOrigin(makeRequest({}))).toBe(true)
  })

  it('rejects a request without an Origin when required', () => {
    expect(isAllowedOrigin(makeRequest({}), true)).toBe(false)
  })

  it('accepts a same-origin request when required', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'http://localhost' }), true)).toBe(true)
  })

  it('accepts the canonical site origin when required', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'https://digitaldevs.co' }), true)).toBe(true)
  })

  it('rejects a cross-origin request when required', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'https://evil.example' }), true)).toBe(false)
  })

  it('rejects an opaque (null) Origin when required', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'null' }), true)).toBe(false)
  })

  it('rejects a malformed Origin when required', () => {
    expect(isAllowedOrigin(makeRequest({ origin: 'not a url' }), true)).toBe(false)
  })
})

describe('getClientIp', () => {
  it('prefers x-real-ip', () => {
    const req = makeRequest({ 'x-real-ip': '203.0.113.1', 'x-forwarded-for': '198.51.100.1' })
    expect(getClientIp(req)).toBe('203.0.113.1')
  })

  it('uses x-vercel-forwarded-for when x-real-ip is absent', () => {
    const req = makeRequest({
      'x-vercel-forwarded-for': '203.0.113.2',
      'x-forwarded-for': '198.51.100.2',
    })
    expect(getClientIp(req)).toBe('203.0.113.2')
  })

  it('falls back to the first x-forwarded-for value', () => {
    const req = makeRequest({ 'x-forwarded-for': '203.0.113.3, 70.1.2.3' })
    expect(getClientIp(req)).toBe('203.0.113.3')
  })

  it('returns unknown when no platform header is present', () => {
    expect(getClientIp(makeRequest({}))).toBe('unknown')
  })
})
