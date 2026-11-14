import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  LeadConfigError,
  getEventStore,
  getLeadStore,
  getNotifier,
  readSessionPepper,
} from '../factory'
import { InMemoryEventStore, InMemoryLeadStore } from '../memory-store'
import {
  CompositeNotifier,
  GmailNotifier,
  NullNotifier,
  ResendNotifier,
  WhatsAppNotifier,
} from '../notifier'
import { SupabaseEventStore, SupabaseLeadStore } from '../supabase-store'

const ENV_KEYS = [
  'LEAD_PERSISTENCE_ENABLED',
  'CHAT_ANALYTICS_ENABLED',
  'LEAD_NOTIFY_ENABLED',
  'LEAD_NOTIFY_WHATSAPP_ENABLED',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SESSION_PEPPER',
  'LEAD_STORE',
  'EVENT_STORE',
  'RESEND_API_KEY',
  'RESEND_FROM',
  'LEAD_NOTIFY_EMAIL',
  'GMAIL_USER',
  'GMAIL_APP_PASSWORD',
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID',
  'WHATSAPP_NOTIFY_NUMBER',
  'WHATSAPP_TEMPLATE_NAME',
  'WHATSAPP_TEMPLATE_LANGUAGE',
  'WHATSAPP_API_VERSION',
] as const

let savedEnv: Record<string, string | undefined> = {}

beforeEach(() => {
  savedEnv = {}
  for (const key of ENV_KEYS) {
    savedEnv[key] = process.env[key]
    delete process.env[key]
  }
})

afterEach(() => {
  for (const key of ENV_KEYS) {
    const value = savedEnv[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('getLeadStore', () => {
  it('returns null when persistence is disabled by default', () => {
    expect(getLeadStore()).toBeNull()
  })

  it('returns null for every "off" spelling', () => {
    for (const value of ['false', 'FALSE', '0', 'no', 'off']) {
      process.env.LEAD_PERSISTENCE_ENABLED = value
      expect(getLeadStore()).toBeNull()
    }
  })

  it('returns an in-memory store when explicitly requested', () => {
    process.env.LEAD_PERSISTENCE_ENABLED = 'true'
    process.env.LEAD_STORE = 'memory'
    expect(getLeadStore()).toBeInstanceOf(InMemoryLeadStore)
  })

  it('returns a Supabase store when configured', () => {
    process.env.LEAD_PERSISTENCE_ENABLED = 'true'
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    expect(getLeadStore()).toBeInstanceOf(SupabaseLeadStore)
  })

  it('fails closed when enabled without Supabase configuration', () => {
    process.env.LEAD_PERSISTENCE_ENABLED = 'true'
    expect(() => getLeadStore()).toThrow(LeadConfigError)
  })

  it('rejects the memory store in production', () => {
    const env = process.env as Record<string, string | undefined>
    const previousNodeEnv = env.NODE_ENV
    env.NODE_ENV = 'production'
    process.env.LEAD_PERSISTENCE_ENABLED = 'true'
    process.env.LEAD_STORE = 'memory'
    try {
      expect(() => getLeadStore()).toThrow(LeadConfigError)
    } finally {
      if (previousNodeEnv === undefined) delete env.NODE_ENV
      else env.NODE_ENV = previousNodeEnv
    }
  })

  it('rejects an unknown store kind', () => {
    process.env.LEAD_PERSISTENCE_ENABLED = 'true'
    process.env.LEAD_STORE = 'csv'
    expect(() => getLeadStore()).toThrow(LeadConfigError)
  })
})

describe('getEventStore', () => {
  it('returns null when analytics is disabled by default', () => {
    expect(getEventStore()).toBeNull()
  })

  it('returns an in-memory store when explicitly requested', () => {
    process.env.CHAT_ANALYTICS_ENABLED = 'true'
    process.env.EVENT_STORE = 'memory'
    expect(getEventStore()).toBeInstanceOf(InMemoryEventStore)
  })

  it('returns a Supabase store when configured', () => {
    process.env.CHAT_ANALYTICS_ENABLED = 'true'
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key'
    expect(getEventStore()).toBeInstanceOf(SupabaseEventStore)
  })

  it('fails closed when enabled without Supabase configuration', () => {
    process.env.CHAT_ANALYTICS_ENABLED = 'true'
    expect(() => getEventStore()).toThrow(LeadConfigError)
  })
})

describe('readSessionPepper', () => {
  it('throws when the pepper is missing', () => {
    expect(() => readSessionPepper()).toThrow(LeadConfigError)
  })

  it('returns the configured pepper', () => {
    process.env.SESSION_PEPPER = 'pepper'
    expect(readSessionPepper()).toBe('pepper')
  })
})

describe('getNotifier', () => {
  it('returns the null notifier when notifications are disabled by default', () => {
    expect(getNotifier()).toBeInstanceOf(NullNotifier)
  })

  it('returns a Resend notifier when configured', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.RESEND_API_KEY = 'resend-key'
    expect(getNotifier()).toBeInstanceOf(ResendNotifier)
  })

  it('returns the Gmail notifier as the primary channel when Resend is absent', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.GMAIL_USER = 'digitaldevscolombia@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'abcd-efgh-ijkl-mnop'
    expect(getNotifier()).toBeInstanceOf(GmailNotifier)
  })

  it('prefers Resend when both Resend and Gmail are configured', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.GMAIL_USER = 'digitaldevscolombia@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'abcd-efgh-ijkl-mnop'
    expect(getNotifier()).toBeInstanceOf(ResendNotifier)
  })

  it('fails closed when notifications are enabled without a provider', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    expect(() => getNotifier()).toThrow(LeadConfigError)
  })

  it('returns a WhatsApp notifier when configured', () => {
    process.env.LEAD_NOTIFY_WHATSAPP_ENABLED = 'true'
    process.env.WHATSAPP_ACCESS_TOKEN = 'token'
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id'
    process.env.WHATSAPP_NOTIFY_NUMBER = '573113609710'
    process.env.WHATSAPP_TEMPLATE_NAME = 'new_lead'
    expect(getNotifier()).toBeInstanceOf(WhatsAppNotifier)
  })

  it('skips WhatsApp (without throwing) when its configuration is incomplete', () => {
    process.env.LEAD_NOTIFY_WHATSAPP_ENABLED = 'true'
    process.env.WHATSAPP_ACCESS_TOKEN = 'token'
    // The channel is isolated: a missing variable must not disable email.
    expect(getNotifier()).toBeInstanceOf(NullNotifier)
  })

  it('keeps Gmail working when WhatsApp is enabled but misconfigured', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.GMAIL_USER = 'digitaldevscolombia@gmail.com'
    process.env.GMAIL_APP_PASSWORD = 'abcd-efgh-ijkl-mnop'
    process.env.LEAD_NOTIFY_WHATSAPP_ENABLED = 'true'
    process.env.WHATSAPP_ACCESS_TOKEN = 'token'
    expect(getNotifier()).toBeInstanceOf(GmailNotifier)
  })

  it('combines email and WhatsApp into a composite notifier', () => {
    process.env.LEAD_NOTIFY_ENABLED = 'true'
    process.env.RESEND_API_KEY = 'resend-key'
    process.env.LEAD_NOTIFY_WHATSAPP_ENABLED = 'true'
    process.env.WHATSAPP_ACCESS_TOKEN = 'token'
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'phone-id'
    process.env.WHATSAPP_NOTIFY_NUMBER = '573113609710'
    process.env.WHATSAPP_TEMPLATE_NAME = 'new_lead'
    expect(getNotifier()).toBeInstanceOf(CompositeNotifier)
  })
})
