import { test, expect, type Page } from '@playwright/test'

const SUMMARY_REPLY = 'Resumen: quiere una tienda en línea para vender ropa.'
const PLAIN_REPLY = 'Esta es una respuesta de prueba del asistente.'

interface CapturedBody {
  [key: string]: unknown
}

/**
 * Intercepts `/api/chat` so the widget works without a real AI provider.
 * `reply` lets a test trigger the structured "Resumen:" closing turn.
 */
async function mockChat(page: Page, reply: string = PLAIN_REPLY) {
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply,
        sessionId: 'e2e-session-id',
        leadCaptured: false,
        provider: 'mock',
        model: 'mock-1',
      }),
    })
  })
}

/** Captures `/api/leads` and `/api/events` traffic and answers as if enabled. */
async function mockPersistence(page: Page) {
  const leads: CapturedBody[] = []
  const events: CapturedBody[] = []

  await page.route('**/api/leads', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    leads.push(route.request().postDataJSON() as CapturedBody)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, id: 'lead-1' }),
    })
  })

  await page.route('**/api/events', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    events.push(route.request().postDataJSON() as CapturedBody)
    await route.fulfill({ status: 204 })
  })

  return { leads, events }
}

/** Opens the chat, retrying until the lazy widget hydrates. */
async function openChat(page: Page) {
  const button = page.getByRole('button', { name: 'Abrir chat' })
  const panel = page.getByRole('dialog', { name: 'Chat de Digital-devs' })
  await expect(button).toBeVisible()
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await button.click()
    if ((await panel.count()) > 0) break
    await page.waitForTimeout(250)
  }
  await expect(panel).toBeVisible()
  return panel
}

/** Opens the lead capture form through the "Agendar" quick reply. */
async function openLeadForm(page: Page) {
  const panel = await openChat(page)
  await panel.getByRole('button', { name: 'Agendar una llamada de 15 minutos' }).click()
  const form = panel.getByRole('form', { name: 'Formulario de contacto' })
  await expect(form).toBeVisible()
  return { panel, form }
}

test.describe('leads persistence and analytics', () => {
  test('persistence active: emits the funnel events and posts the lead without PII', async ({
    page,
  }) => {
    await mockChat(page, SUMMARY_REPLY)
    const { leads, events } = await mockPersistence(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const { form } = await openLeadForm(page)

    // The bot emits a structured summary -> diagnosis_completed(summary).
    const input = form.getByLabel('Nombre')
    await input.fill('Ana Pérez')
    await form.getByLabel('WhatsApp o email').fill('3001234567')

    const popupPromise = page.waitForEvent('popup', { timeout: 3_000 }).catch(() => null)
    await form.getByRole('button', { name: 'Enviar a WhatsApp' }).click()
    const popup = await popupPromise
    expect(popup).not.toBeNull()
    await expect.poll(() => popup!.url()).toContain('573113609710')

    // The lead is persisted in the background.
    await expect.poll(() => leads.length).toBe(1)
    const lead = leads[0]
    expect(lead.name).toBe('Ana Pérez')
    expect(lead.contact).toBe('3001234567')
    expect(lead.method).toBe('whatsapp')
    expect(lead.source).toBe('form')
    expect(lead.path).toBe('/')
    expect(typeof lead.sessionId).toBe('string')
    expect(lead.context).not.toContain('3001234567')

    // The client emits the three browser-side events; the server emits
    // lead_captured (mocked here, verified in the unit tests).
    const eventNames = events.map((event) => event.eventName)
    expect(eventNames).toContain('chat_opened')
    expect(eventNames).toContain('diagnosis_completed')
    expect(eventNames).toContain('whatsapp_clicked')

    // No event may carry the lead name or contact.
    const serialized = JSON.stringify(events)
    expect(serialized).not.toContain('Ana Pérez')
    expect(serialized).not.toContain('3001234567')
  })

  test('persistence active: free-text detection persists with source=detection', async ({ page }) => {
    await mockChat(page)
    const { leads, events } = await mockPersistence(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })
    await input.fill('Mi número es 3001234567')
    await input.press('Enter')
    await expect(panel.getByText('¿Continuar a WhatsApp?')).toBeVisible()

    const popupPromise = page.waitForEvent('popup', { timeout: 3_000 }).catch(() => null)
    await panel.getByRole('button', { name: 'Sí, continuar' }).click()
    const popup = await popupPromise
    expect(popup).not.toBeNull()

    await expect.poll(() => leads.length).toBe(1)
    expect(leads[0].source).toBe('detection')
    expect(leads[0].contact).toBe('3001234567')

    const whatsappEvents = events.filter((event) => event.eventName === 'whatsapp_clicked')
    expect(whatsappEvents.length).toBeGreaterThan(0)
    expect(whatsappEvents[0].metadata).toEqual({ source: 'detection' })
  })

  test('persistence disabled (503): WhatsApp opens and the client emits lead_attempt', async ({
    page,
  }) => {
    await mockChat(page)
    const events: CapturedBody[] = []

    await page.route('**/api/leads', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({ status: 503, contentType: 'application/json', body: '{"error":"off"}' })
    })
    await page.route('**/api/events', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      events.push(route.request().postDataJSON() as CapturedBody)
      await route.fulfill({ status: 204 })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    const { form } = await openLeadForm(page)
    await form.getByLabel('Nombre').fill('Ana Pérez')
    await form.getByLabel('WhatsApp o email').fill('3001234567')

    const popupPromise = page.waitForEvent('popup', { timeout: 3_000 }).catch(() => null)
    await form.getByRole('button', { name: 'Enviar a WhatsApp' }).click()
    const popup = await popupPromise
    expect(popup).not.toBeNull()
    await expect.poll(() => popup!.url()).toContain('573113609710')

    // The client must NOT emit `lead_captured` (that is the server's source of
    // truth). It emits a best-effort `lead_attempt` signal instead.
    await expect
      .poll(() => events.some((event) => event.eventName === 'lead_attempt'))
      .toBe(true)
    expect(events.some((event) => event.eventName === 'lead_captured')).toBe(false)
  })

  test('a slow /api/leads response never blocks the WhatsApp hand-off', async ({ page }) => {
    await mockChat(page)
    await page.route('**/api/leads', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      // Intentionally slower than the popup budget below: if the hand-off were
      // blocked on persistence, the popup would not arrive in time.
      await new Promise((resolve) => setTimeout(resolve, 4_000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, id: 'lead-1' }),
      })
    })
    await page.route('**/api/events', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue()
        return
      }
      await route.fulfill({ status: 204 })
    })

    await page.goto('/', { waitUntil: 'networkidle' })
    const { form } = await openLeadForm(page)
    await form.getByLabel('Nombre').fill('Ana Pérez')
    await form.getByLabel('WhatsApp o email').fill('3001234567')

    const popupPromise = page.waitForEvent('popup', { timeout: 3_000 }).catch(() => null)
    await form.getByRole('button', { name: 'Enviar a WhatsApp' }).click()
    const popup = await popupPromise
    expect(popup).not.toBeNull()
    if (popup) await expect.poll(() => popup.url()).toContain('573113609710')
  })

  test('the detection hand-off still opens WhatsApp after the form flow changed', async ({ page }) => {
    await mockChat(page)
    const { leads } = await mockPersistence(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })
    await input.fill('Mi número es 3009876543')
    await input.press('Enter')
    await expect(panel.getByText('¿Continuar a WhatsApp?')).toBeVisible()
    await panel.getByRole('button', { name: 'Sí, continuar' }).click()

    await expect.poll(() => leads.length).toBe(1)
    expect(leads[0].source).toBe('detection')
  })
})
