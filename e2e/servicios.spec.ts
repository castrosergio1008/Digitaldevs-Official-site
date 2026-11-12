import { test, expect, type Page } from '@playwright/test'
import { services } from '../src/lib/content'

const waPayload = (url: string) => decodeURIComponent(url.replace(/\+/g, ' '))

async function goto(page: Page, path: string) {
  const response = await page.goto(path)
  return response?.status() ?? 0
}

test.describe('servicios — index', () => {
  test('/servicios returns 200 and links to all six service pages', async ({ page }) => {
    expect(await goto(page, '/servicios')).toBe(200)
    await expect(page).toHaveTitle(/Servicios/)

    const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
    await expect(breadcrumb.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')

    for (const service of services) {
      await expect(
        page.getByRole('link', { name: `Ver detalle de ${service.title}` })
      ).toHaveAttribute('href', `/servicios/${service.slug}`)
    }
  })
})

test.describe('servicios — detail pages', () => {
  for (const service of services) {
    test(`/servicios/${service.slug} renders hero, benefits and key sections`, async ({ page }) => {
      expect(await goto(page, `/servicios/${service.slug}`)).toBe(200)

      await expect(
        page.getByRole('heading', { level: 1, name: service.title })
      ).toBeVisible()

      // Benefits
      for (const point of service.points) {
        await expect(page.locator('main').getByText(point, { exact: true }).first()).toBeVisible()
      }

      // Reused, parametrized sections (service-specific IDs, not the home anchors)
      await expect(page.locator('#proceso-servicio')).toBeVisible()
      await expect(page.locator('#precios-servicio')).toBeVisible()
      await expect(page.locator('#faq-servicio')).toBeVisible()

      // Breadcrumb: Inicio / Servicios / {service}
      const breadcrumb = page.getByRole('navigation', { name: 'Breadcrumb' })
      await expect(breadcrumb.getByRole('link', { name: 'Inicio' })).toHaveAttribute('href', '/')
      await expect(breadcrumb.getByRole('link', { name: 'Servicios' })).toHaveAttribute(
        'href',
        '/servicios'
      )
      await expect(breadcrumb.locator('li').last()).toContainText(service.title)

      // Embedded contact form carries the service prefix
      await expect(page.locator('#servicio-nombre')).toBeVisible()
      await expect(page.locator('#servicio-mensaje')).toBeVisible()
    })
  }
})

test.describe('servicios — 404', () => {
  test('an unknown slug returns 404', async ({ page }) => {
    expect(await goto(page, '/servicios/no-existe')).toBe(404)
  })
})

test.describe('servicios — navigation', () => {
  test('clicking a service card on the home opens the service page', async ({ page }) => {
    await goto(page, '/')
    const service = services[1]

    await page.getByRole('link', { name: `Ver detalle de ${service.title}` }).click()

    await expect(page).toHaveURL(new RegExp(`/servicios/${service.slug}$`))
    await expect(
      page.getByRole('heading', { level: 1, name: service.title })
    ).toBeVisible()
  })

  test('header on /servicios links Servicios to /servicios and the rest to home anchors', async ({
    page,
  }) => {
    await goto(page, '/servicios')

    const nav = page.getByRole('navigation', { name: 'Menú principal' })
    const hrefs = await nav.getByRole('link').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )
    expect(hrefs).toEqual([
      '/servicios',
      '/#stack',
      '/#proceso',
      '/#portafolio',
      '/#precios',
      '/#faq',
    ])
  })

  test('header on the home links Servicios to /servicios and keeps the five anchors', async ({
    page,
  }) => {
    await goto(page, '/')

    const nav = page.getByRole('navigation', { name: 'Menú principal' })
    const hrefs = await nav.getByRole('link').evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )
    expect(hrefs).toEqual(['/servicios', '#stack', '#proceso', '#portafolio', '#precios', '#faq'])
  })

  test('service form opens WhatsApp with the service name in the message', async ({ page }) => {
    const service = services[1]
    await goto(page, `/servicios/${service.slug}`)

    const form = page.locator('form')
    await form.getByLabel('Nombre').fill('Test User')
    await form.getByLabel('¿Qué proyecto tienes en mente?').fill('Quiero una tienda en línea')

    const [popup] = await Promise.all([
      page.waitForEvent('popup'),
      form.getByRole('button', { name: 'Enviar mensaje' }).click(),
    ])

    await expect.poll(() => popup.url()).toContain('573113609710')
    await expect.poll(() => waPayload(popup.url())).toContain(service.title)
  })
})
