import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { createTransportMock } = vi.hoisted(() => ({
  createTransportMock: vi.fn(() => ({ sendMail: vi.fn(async () => ({ messageId: 'm-1' })) })),
}))

vi.mock('nodemailer', () => ({
  default: { createTransport: createTransportMock },
}))

import { getNotifier } from '../factory'
import { GmailNotifier, NullNotifier, ResendNotifier } from '../notifier'

const ENV_KEYS = [
  'LEAD_NOTIFY_ENABLED',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'RESEND_API_KEY',
] as const

let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
  createTransportMock.mockClear()
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('Gmail transport configuration', () => {
  it('builds a Gmail SMTP transport with the App Password', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.GMAIL_USER = 'digitaldevscolombia@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop'

    const notifier = getNotifier()

    expect(notifier).toBeInstanceOf(GmailNotifier)
    expect(createTransportMock).toHaveBeenCalledWith({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: 'digitaldevscolombia@gmail.com',
        pass: 'abcd efgh ijkl mnop',
      },
    })
  })

  it('does not build a transport when notifications are disabled', () => {
    expect(getNotifier()).toBeInstanceOf(NullNotifier)
    expect(createTransportMock).not.toHaveBeenCalled()
  })

  it('does not build the Gmail transport when Resend is configured', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.GMAIL_USER = 'digitaldevscolombia@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'abcd efgh ijkl mnop'

    expect(getNotifier()).toBeInstanceOf(ResendNotifier)
    expect(createTransportMock).not.toHaveBeenCalled()
  })
})
