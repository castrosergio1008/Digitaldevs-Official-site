import { describe, expect, it } from 'vitest'
import { getServiceBySlug, getServicePaths, services } from './content'

const APPROVED_SLUGS = [
  'sitios-web',
  'tiendas-en-linea',
  'aplicaciones-web',
  'mvp-para-startups',
  'apps-progresivas',
  'soporte-mantenimiento',
]

describe('getServiceBySlug', () => {
  it('returns the matching service for a valid slug', () => {
    const service = getServiceBySlug('tiendas-en-linea')
    expect(service).toBeDefined()
    expect(service?.key).toBe('ecommerce')
    expect(service?.title).toBe('Tiendas en línea y e-commerce')
  })

  it('returns undefined for an invalid slug', () => {
    expect(getServiceBySlug('no-existe')).toBeUndefined()
    expect(getServiceBySlug('')).toBeUndefined()
  })
})

describe('getServicePaths', () => {
  it('returns exactly the six service slugs in order', () => {
    const paths = getServicePaths()
    expect(paths).toHaveLength(6)
    expect(paths.map((p) => p.slug)).toEqual(APPROVED_SLUGS)
  })
})

describe('service slugs', () => {
  it('every service has a slug', () => {
    for (const service of services) {
      expect(service.slug, `missing slug for ${service.key}`).toBeTruthy()
    }
  })

  it('slugs are unique', () => {
    const slugs = services.map((s) => s.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('slugs are lowercase, ASCII-safe and dash-separated', () => {
    for (const slug of services.map((s) => s.slug)) {
      expect(slug).toBe(slug.toLowerCase())
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      // No accented characters: stripping combining marks must be a no-op.
      expect(slug.normalize('NFD').replace(/[\u0300-\u036f]/g, '')).toBe(slug)
    }
  })
})
