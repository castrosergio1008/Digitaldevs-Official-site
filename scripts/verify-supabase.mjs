/**
 * Verifies Supabase connectivity and write permissions.
 *
 * Usage:
 *   1. Create a .env.local file (git-ignored) with:
 *        SUPABASE_URL=https://your-project.supabase.co
 *        SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
 *   2. Run: node scripts/verify-supabase.mjs
 *
 * The script inserts a test lead and a test event, then cleans them up.
 * It never logs the credentials.
 */
import { readFileSync } from 'node:fs'

// Load .env.local without extra dependencies (Next.js also loads it in dev).
try {
  const envFile = readFileSync('.env.local', 'utf8')
  for (const line of envFile.split('\n')) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  }
} catch {
  // No .env.local: rely on the real environment (Vercel, CI, etc.).
}

const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.')
  console.error('Create a .env.local file with both values (see .env.example).')
  process.exit(1)
}

const baseUrl = url.replace(/\/+$/, '')
const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
}

async function insertLead() {
  const response = await fetch(`${baseUrl}/rest/v1/leads`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      name: 'Verification Lead',
      contact: 'verify@example.com',
      method: 'email',
      session_id_hash: `verify-${Date.now()}`,
      source: 'form',
      path: '/verify',
      context: 'Automated connectivity verification',
    }),
  })
  if (!response.ok) {
    throw new Error(`lead insert failed: ${response.status} ${await response.text()}`)
  }
  const rows = (await response.json()) as Array<{ id: string }>
  if (!rows[0]) throw new Error('lead insert returned no row')
  return rows[0].id
}

async function insertEvent() {
  const response = await fetch(`${baseUrl}/rest/v1/chat_events`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=representation' },
    body: JSON.stringify({
      event_name: 'chat_opened',
      session_id_hash: `verify-${Date.now()}`,
      path: '/verify',
      metadata: { source: 'button' },
    }),
  })
  if (!response.ok) {
    throw new Error(`event insert failed: ${response.status} ${await response.text()}`)
  }
  const rows = (await response.json()) as Array<{ id: string | number }>
  if (!rows[0]) throw new Error('event insert returned no row')
  return rows[0].id
}

async function remove(table, id) {
  const response = await fetch(`${baseUrl}/rest/v1/${table}?id=eq.${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers,
  })
  if (!response.ok) {
    console.warn(`warning: could not delete test ${table} row ${id}: ${response.status}`)
  }
}

async function main() {
  const leadId = await insertLead()
  console.log('✓ Lead inserted and read back:', leadId)

  const eventId = await insertEvent()
  console.log('✓ Event inserted and read back:', eventId)

  await remove('chat_events', eventId)
  await remove('leads', leadId)
  console.log('✓ Test rows cleaned up')

  console.log('\nSupabase connection verified: writes work and credentials are valid.')
}

main().catch((error) => {
  console.error('Verification failed:', error instanceof Error ? error.message : error)
  process.exit(1)
})
