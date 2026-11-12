import { test, expect, type Page } from '@playwright/test'
import { services } from '../src/lib/content'

const triggerName = 'Menú de servicios'

// The first interaction after SSR can land before React hydrates. Retry until
// the UI reflects the open state so the suite stays stable under parallel load.
async function openDesktopDropdown(page: Page) {
  const trigger = page.getByRole('button', { name: triggerName })
  await expect(trigger).toBeVisible()
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await trigger.click()
    if ((await page.locator('#services-menu').count()) > 0) return trigger
    await page.waitForTimeout(250)
  }
  throw new Error('The services dropdown did not open.')
}

async function openMobileNav(page: Page) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole('button', { name: 'Abrir menú' }).click()
    if ((await page.getByRole('button', { name: 'Cerrar menú' }).count()) > 0) return
    await page.waitForTimeout(250)
  }
  throw new Error('The mobile navigation did not open.')
}

test.describe('header — services dropdown (desktop)', () => {
  test('opens on click, lists the six services and navigates to the detail', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const trigger = await openDesktopDropdown(page)

    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('aria-controls', 'services-menu')

    const menu = page.locator('#services-menu')
    await expect(menu).toBeVisible()
    const menuLinks = menu.getByRole('link')
    await expect(menuLinks).toHaveCount(6)
    const hrefs = await menuLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )
    expect(hrefs).toEqual(services.map((service) => `/servicios/${service.slug}`))

    const target = services[1]
    await menu.getByRole('link', { name: `Ver detalle de ${target.title}` }).click()

    await expect(page).toHaveURL(new RegExp(`/servicios/${target.slug}$`))
    await expect(
      page.getByRole('heading', { level: 1, name: target.title })
    ).toBeVisible()
    await expect(page.locator('#services-menu')).toHaveCount(0)
  })

  test('keeps the six nav links while collapsed and twelve while open', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const nav = page.getByRole('navigation', { name: 'Menú principal' })
    await expect(nav.getByRole('link')).toHaveCount(6)

    const trigger = await openDesktopDropdown(page)
    await expect(nav.getByRole('link')).toHaveCount(12)
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  test('opens with the keyboard and closes on Escape returning focus to the trigger', async ({
    page,
  }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    const trigger = page.getByRole('button', { name: triggerName })
    await trigger.focus()
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await page.keyboard.press('Enter')
      if ((await trigger.getAttribute('aria-expanded')) === 'true') break
      await page.waitForTimeout(250)
    }
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(page.locator('#services-menu')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('#services-menu')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })

  test('closes on outside click', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await openDesktopDropdown(page)
    await expect(page.locator('#services-menu')).toBeVisible()

    await page.mouse.click(10, 400)
    await expect(page.locator('#services-menu')).toHaveCount(0)
  })

  test('marks the Servicios link as current on /servicios', async ({ page }) => {
    await page.goto('/servicios', { waitUntil: 'networkidle' })

    const nav = page.getByRole('navigation', { name: 'Menú principal' })
    await expect(nav.getByRole('link', { name: 'Servicios' })).toHaveAttribute(
      'aria-current',
      'page'
    )
  })
})

test.describe('header — services dropdown (mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('expands the six services, navigates and hides the mobile nav', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await openMobileNav(page)
    const mobileNav = page.getByRole('navigation', { name: 'Menú móvil' })
    await expect(mobileNav).toBeVisible()

    const trigger = page.getByRole('button', { name: triggerName })
    await expect(mobileNav.getByRole('link')).toHaveCount(7)

    await trigger.click()
    await expect(trigger).toHaveAttribute('aria-expanded', 'true')
    await expect(trigger).toHaveAttribute('aria-controls', 'mobile-services-menu')

    const menu = page.locator('#mobile-services-menu')
    await expect(menu).toBeVisible()
    const menuLinks = menu.getByRole('link')
    await expect(menuLinks).toHaveCount(6)
    const hrefs = await menuLinks.evaluateAll((links) =>
      links.map((link) => link.getAttribute('href'))
    )
    expect(hrefs).toEqual(services.map((service) => `/servicios/${service.slug}`))

    const target = services[0]
    await menu.getByRole('link', { name: `Ver detalle de ${target.title}` }).click()
    await expect(page).toHaveURL(new RegExp(`/servicios/${target.slug}$`))
    await expect(
      page.getByRole('heading', { level: 1, name: target.title })
    ).toBeVisible()
    await expect(mobileNav).toBeHidden()
  })

  test('closes the submenu on Escape and returns focus to the trigger', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' })

    await openMobileNav(page)
    const trigger = page.getByRole('button', { name: triggerName })
    await trigger.click()
    await expect(page.locator('#mobile-services-menu')).toBeVisible()

    await page.keyboard.press('Escape')
    await expect(page.locator('#mobile-services-menu')).toHaveCount(0)
    await expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await expect(trigger).toBeFocused()
  })
})
