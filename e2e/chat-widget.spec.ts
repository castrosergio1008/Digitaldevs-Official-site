import { test, expect, type Page } from '@playwright/test'

const MOCK_REPLY = 'Esta es una respuesta de prueba del asistente.'

// WhatsApp may redirect wa.me to api.whatsapp.com and normalizes %20 to '+'
// in the query; assert on the decoded payload, not the raw URL.
const waPayload = (url: string) => decodeURIComponent(url.replace(/\+/g, ' '))

/**
 * Intercepts `/api/chat` so the widget can be exercised without a real AI
 * provider. The short delay keeps the typing indicator observable.
 */
async function mockChat(page: Page) {
  await page.route('**/api/chat', async (route) => {
    if (route.request().method() !== 'POST') {
      await route.continue()
      return
    }
    await new Promise((resolve) => setTimeout(resolve, 700))
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        reply: MOCK_REPLY,
        sessionId: 'e2e-session-id',
        leadCaptured: false,
        provider: 'mock',
        model: 'mock-1',
      }),
    })
  })
}

/**
 * Opens the chat. The first click after page load can land before React
 * hydrates the lazy widget, so retry until the expanded state is reflected.
 */
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

test.describe('chat widget', () => {
  test('floating button is visible on the home and on a service page', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: 'Abrir chat' })).toBeVisible()

    await page.goto('/servicios/tiendas-en-linea')
    await expect(page.getByRole('button', { name: 'Abrir chat' })).toBeVisible()
  })

  test('opens the panel, focuses the input and closes on Escape returning focus', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)

    const openButton = page.getByRole('button', { name: 'Cerrar chat' })
    await expect(openButton).toHaveAttribute('aria-expanded', 'true')
    await expect(panel.getByRole('textbox', { name: 'Escribe tu mensaje' })).toBeFocused()

    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)

    const closedButton = page.getByRole('button', { name: 'Abrir chat' })
    await expect(closedButton).toHaveAttribute('aria-expanded', 'false')
    await expect(closedButton).toBeFocused()
  })

  test('sends a message, shows the typing indicator and renders the reply', async ({ page }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })
    const log = panel.getByRole('log', { name: 'Conversación' })

    await input.fill('Hola, ¿qué servicios ofrecen?')
    await input.press('Enter')

    await expect(log.getByText('Hola, ¿qué servicios ofrecen?')).toBeVisible()
    await expect(panel.getByRole('status', { name: /escribiendo/i })).toBeVisible()
    await expect(log.getByText(MOCK_REPLY)).toBeVisible()

    await expect(input).toHaveValue('')
    await expect(input).toBeEnabled()
  })

  test('quick replies send a message', async ({ page }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    await panel.getByRole('button', { name: 'Quiero una cotización para mi negocio' }).click()

    const log = panel.getByRole('log', { name: 'Conversación' })
    await expect(log.getByText('Quiero una cotización para mi negocio')).toBeVisible()
    await expect(log.getByText(MOCK_REPLY)).toBeVisible()
  })

  test('lead capture form is available, validates and shows the consent note', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    await panel.getByRole('button', { name: 'Agendar una llamada de 15 minutos' }).click()

    const form = panel.getByRole('form', { name: 'Formulario de contacto' })
    await expect(form).toBeVisible()
    await expect(form.getByLabel('Nombre')).toBeVisible()
    await expect(form.getByLabel('WhatsApp o email')).toBeVisible()
    await expect(
      form.getByText('Al dejar tus datos, aceptas ser contactado por Digital-devs')
    ).toBeVisible()
    await expect(form.getByText(/procesada por IA/)).toBeVisible()
    await expect(
      form.getByRole('link', { name: /política de privacidad/i })
    ).toHaveAttribute('href', '/privacidad')

    await form.getByRole('button', { name: 'Enviar a WhatsApp' }).click()
    await expect(form.getByRole('alert').first()).toBeVisible()
  })

  test('lead submit opens WhatsApp with the name and contact', async ({ page }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    await panel.getByRole('button', { name: 'Agendar una llamada de 15 minutos' }).click()

    const form = panel.getByRole('form', { name: 'Formulario de contacto' })
    await form.getByLabel('Nombre').fill('Ana Pérez')
    await form.getByLabel('WhatsApp o email').fill('3001234567')

    // The hand-off opens synchronously in the submit handler. Attach the popup
    // listener before the click; if the browser blocks it, fall back to the
    // "Continuar en WhatsApp" link, which carries the same payload.
    const popupPromise = page.waitForEvent('popup', { timeout: 3_000 }).catch(() => null)
    await form.getByRole('button', { name: 'Enviar a WhatsApp' }).click()

    const autoPopup = await popupPromise
    let popup: Page
    if (autoPopup) {
      popup = autoPopup
    } else {
      const [fallbackPopup] = await Promise.all([
        page.waitForEvent('popup'),
        panel.getByRole('link', { name: 'Continuar en WhatsApp' }).click(),
      ])
      popup = fallbackPopup
    }

    await expect.poll(() => popup.url()).toContain('573113609710')
    await expect.poll(() => waPayload(popup.url())).toContain('Ana Pérez')
    await expect.poll(() => waPayload(popup.url())).toContain('3001234567')
  })

  test('conversation persists across navigation', async ({ page }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })
    const log = panel.getByRole('log', { name: 'Conversación' })

    const uniqueMessage = 'Mensaje persistente entre páginas'
    await input.fill(uniqueMessage)
    await input.press('Enter')

    await expect(log.getByText(uniqueMessage)).toBeVisible()
    await expect(log.getByText(MOCK_REPLY)).toBeVisible()

    // A full navigation must keep the conversation in localStorage.
    await page.goto('/servicios/tiendas-en-linea', { waitUntil: 'networkidle' })

    const reopened = await openChat(page)
    const reopenedLog = reopened.getByRole('log', { name: 'Conversación' })
    await expect(reopenedLog.getByText(uniqueMessage)).toBeVisible()
    await expect(reopenedLog.getByText(MOCK_REPLY)).toBeVisible()
  })

  test('clearing the conversation resets the log', async ({ page }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })
    const log = panel.getByRole('log', { name: 'Conversación' })

    const uniqueMessage = 'Mensaje de prueba para borrar la conversación'
    await input.fill(uniqueMessage)
    await input.press('Enter')
    await expect(log.getByText(MOCK_REPLY)).toBeVisible()

    await panel.getByRole('button', { name: 'Borrar conversación' }).click()
    await expect(log.getByText(uniqueMessage)).toHaveCount(0)
    await expect(log.getByText(MOCK_REPLY)).toHaveCount(0)
    await expect(log.getByText(/asistente virtual de Digital-devs/)).toBeVisible()
  })

  test('free-text contact detection asks for confirmation instead of auto-opening WhatsApp', async ({
    page,
  }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })

    // No popup should open automatically.
    const popupPromise = page.waitForEvent('popup', { timeout: 1_500 }).catch(() => null)
    await input.fill('Mi número es 3001234567')
    await input.press('Enter')

    await expect(panel.getByText('¿Continuar a WhatsApp?')).toBeVisible()
    expect(await popupPromise).toBeNull()

    // Cancelar closes the card and does not open WhatsApp.
    await panel.getByRole('button', { name: 'Cancelar' }).click()
    await expect(panel.getByText('¿Continuar a WhatsApp?')).toHaveCount(0)
  })

  test('confirming the hand-off opens WhatsApp with the detected contact', async ({ page }) => {
    await mockChat(page)
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
    await expect.poll(() => popup!.url()).toContain('573113609710')
    await expect.poll(() => waPayload(popup!.url())).toContain('3001234567')
  })

  test('form submission clears a pending hand-off confirmation', async ({ page }) => {
    await mockChat(page)
    await page.goto('/', { waitUntil: 'networkidle' })

    const panel = await openChat(page)
    const input = panel.getByRole('textbox', { name: 'Escribe tu mensaje' })

    // Trigger the pending hand-off via free text.
    await input.fill('Mi número es 3001234567')
    await input.press('Enter')
    await expect(panel.getByText('¿Continuar a WhatsApp?')).toBeVisible()

    // Now use the form instead.
    await panel.getByRole('button', { name: 'Agendar una llamada de 15 minutos' }).click()
    const form = panel.getByRole('form', { name: 'Formulario de contacto' })
    await form.getByLabel('Nombre').fill('Ana Pérez')
    await form.getByLabel('WhatsApp o email').fill('3009876543')
    await form.getByRole('button', { name: 'Enviar a WhatsApp' }).click()

    // The confirmation card must be gone.
    await expect(panel.getByText('¿Continuar a WhatsApp?')).toHaveCount(0)
  })
})
