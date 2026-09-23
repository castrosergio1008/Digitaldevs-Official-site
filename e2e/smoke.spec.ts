import { test, expect } from '@playwright/test'

const NAV_HREFS = ['#servicios', '#stack', '#proceso', '#portafolio', '#precios', '#faq']

const SECTION_IDS = ['servicios', 'stack', 'proceso', 'portafolio', 'precios', 'faq', 'contacto']

test.describe('smoke — Digitaldevs landing', () => {
  test('home loads with the correct title', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/Digitaldevs/)
  })

  test('header (logo + nav) is visible and nav points to expected anchors', async ({ page }) => {
    await page.goto('/')

    const header = page.locator('header')
    await expect(header).toBeVisible()

    const logoLink = header.getByRole('link', { name: /Digitaldevs/ }).first()
    await expect(logoLink).toBeVisible()

    const nav = header.getByRole('navigation', { name: 'Menú principal' })
    await expect(nav).toBeVisible()

    const navLinks = nav.getByRole('link')
    await expect(navLinks).toHaveCount(NAV_HREFS.length)
    const hrefs = await navLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )
    expect(hrefs).toEqual(NAV_HREFS)
  })

  test('all main sections exist in the document', async ({ page }) => {
    await page.goto('/')
    for (const id of SECTION_IDS) {
      await expect(page.locator(`#${id}`)).toBeVisible()
    }
  })

  test('theme toggle switches data-theme from dark to light', async ({ page }) => {
    await page.goto('/')

    // The inline theme script sets data-theme synchronously; assert the baseline.
    await page.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark')

    const toggle = page.getByRole('button', { name: 'Cambiar a tema claro' })
    await expect(toggle).toBeVisible()

    await toggle.click()

    // Poll instead of a fixed sleep: the attr change happens after React hydration.
    await expect
      .poll(() => page.evaluate(() => document.documentElement.getAttribute('data-theme')))
      .toBe('light')
  })

  test('contact form exposes name/message fields and a submit button', async ({ page }) => {
    await page.goto('/')

    const section = page.locator('#contacto')
    await expect(section).toBeVisible()

    const form = section.locator('form')
    await expect(form).toBeVisible()

    await expect(form.getByLabel('Nombre')).toBeVisible()
    await expect(form.getByLabel('¿Qué proyecto tienes en mente?')).toBeVisible()
    await expect(form.getByRole('button', { name: 'Enviar mensaje' })).toBeVisible()
  })

  test('contact form opens WhatsApp with the prefilled message', async ({ page }) => {
    await page.goto('/')

    const form = page.locator('#contacto form')
    await form.getByLabel('Nombre').fill('Test User')
    await form.getByLabel('¿Qué proyecto tienes en mente?').fill('Quiero una landing page')

const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      form.getByRole('button', { name: 'Enviar mensaje' }).click(),
    ])

    // The button flips to "Abriendo WhatsApp…" for ~6s right after submit; assert
    // it while the window is still open.
    await expect(form.getByRole('button', { name: 'Abriendo WhatsApp…' })).toBeVisible()

    // WhatsApp may redirect wa.me to api.whatsapp.com depending on region and
    // normalizes %20 to '+' in the query; assert on the payload, not the host.
    const waPayload = (url: string) => decodeURIComponent(url.replace(/\+/g, ' '))
    await expect.poll(() => popup.url()).toContain('573113609710')
    await expect.poll(() => waPayload(popup.url())).toContain('Quiero una landing page')
  })
})

test.describe('mobile navigation', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('hamburger opens the mobile nav and closes it on anchor click', async ({ page }) => {
    await page.goto('/')

    // Below the lg breakpoint the desktop nav is hidden and the burger is visible.
    const burger = page.getByRole('button', { name: 'Abrir menú' })
    await expect(burger).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Menú principal' })).toBeHidden()

    await burger.click()

    // The accessible name flips to "Cerrar menú" while open; re-resolve the button.
    const openBurger = page.getByRole('button', { name: 'Cerrar menú' })
    await expect(openBurger).toHaveAttribute('aria-expanded', 'true')

    const mobileNav = page.getByRole('navigation', { name: 'Menú móvil' })
    await expect(mobileNav).toBeVisible()

    // 6 section anchors + the WhatsApp CTA.
    const navLinks = mobileNav.getByRole('link')
    await expect(navLinks).toHaveCount(NAV_HREFS.length + 1)
    const hrefs = await navLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )
    for (const href of NAV_HREFS) expect(hrefs).toContain(href)

    await mobileNav.getByRole('link', { name: 'Servicios' }).click()
    await expect(mobileNav).toBeHidden()
  })
})