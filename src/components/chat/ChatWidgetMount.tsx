'use client'

import dynamic from 'next/dynamic'
import { isDisabled } from '@/lib/chat/killswitch'

// Loaded only on the client: the widget reads localStorage, so it must not
// produce server markup (avoids hydration mismatches and keeps it out of the
// initial bundle).
const ChatWidget = dynamic(() => import('./ChatWidget'), { ssr: false })

/**
 * Kill switch: `NEXT_PUBLIC_CHAT_ENABLED=false` keeps the widget (and its
 * bundle) out of the page entirely.
 */
export default function ChatWidgetMount() {
  if (isDisabled(process.env.NEXT_PUBLIC_CHAT_ENABLED)) return null
  return <ChatWidget />
}
