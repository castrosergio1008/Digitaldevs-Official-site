import type { ChatProvider } from './types'
import { MockProvider } from './providers/mock'
import { OpenCodeGoProvider } from './providers/opencode-go'

export const DEFAULT_CHAT_PROVIDER = 'opencode-go'
export const DEFAULT_CHAT_MODEL = 'claude-haiku-5-5'

// Cached per serverless instance: configuration is read once and reused.
let cached: ChatProvider | null = null

/**
 * Returns the process-wide chat provider, creating it on first use from the
 * environment. Changing the configuration requires a redeploy/restart.
 */
export function getChatProvider(): ChatProvider {
  if (cached) return cached

  const provider = process.env.CHAT_PROVIDER ?? DEFAULT_CHAT_PROVIDER

  switch (provider) {
    case 'opencode-go': {
      const apiKey = process.env.OPENCODE_API_KEY
      if (!apiKey) throw new Error('OPENCODE_API_KEY is not configured')
      cached = new OpenCodeGoProvider(apiKey, process.env.CHAT_MODEL ?? DEFAULT_CHAT_MODEL)
      break
    }
    case 'mock':
      cached = new MockProvider()
      break
    case 'anthropic':
    case 'openai':
      // Reserved for the planned direct integrations (design doc section 4.7).
      throw new Error(`Chat provider "${provider}" is not implemented yet`)
    default:
      throw new Error(`Unknown chat provider: ${provider}`)
  }

  return cached
}

/** Resets the cached provider. Test-only helper. */
export function __resetChatProviderForTests(): void {
  cached = null
}
