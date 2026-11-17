import { describe, expect, it } from 'vitest'
import { DEFAULT_GREETING, HOME_GREETING, SERVICES_GREETING } from '../copy'
import { greetingForPath } from '../greeting'

describe('greetingForPath', () => {
  it('uses the home greeting on the root path', () => {
    expect(greetingForPath('/')).toBe(HOME_GREETING)
  })

  it('uses the services greeting on the services index', () => {
    expect(greetingForPath('/servicios')).toBe(SERVICES_GREETING)
    expect(greetingForPath('/servicios/')).toBe(SERVICES_GREETING)
  })

  it('personalizes the greeting with the service title', () => {
    expect(greetingForPath('/servicios/tiendas-en-linea')).toBe(
      'Sobre Tiendas en línea y e-commerce: ¿ya lo usas o estás empezando? Cuéntame cómo lo manejas hoy.',
    )
    expect(greetingForPath('/servicios/sitios-web/')).toBe(
      'Sobre Sitios web corporativos y landing pages: ¿ya lo usas o estás empezando? Cuéntame cómo lo manejas hoy.',
    )
  })

  it('falls back to the default greeting for unknown routes and slugs', () => {
    expect(greetingForPath('/precios')).toBe(DEFAULT_GREETING)
    expect(greetingForPath('/servicios/no-existe')).toBe(DEFAULT_GREETING)
    expect(greetingForPath('')).toBe(DEFAULT_GREETING)
  })
})
