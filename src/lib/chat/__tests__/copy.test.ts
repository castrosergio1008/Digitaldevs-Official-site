import { describe, expect, it } from 'vitest'
import {
  DEFAULT_GREETING,
  HOME_GREETING,
  LEGACY_GREETING,
  SERVICE_GREETING_TEMPLATE,
  SERVICES_GREETING,
  isGreetingMessage,
} from '../copy'

describe('isGreetingMessage', () => {
  it('filters every greeting variant', () => {
    for (const greeting of [DEFAULT_GREETING, HOME_GREETING, SERVICES_GREETING, LEGACY_GREETING]) {
      expect(isGreetingMessage(greeting)).toBe(true)
    }
  })

  it('filters the personalized service greeting', () => {
    const greeting = SERVICE_GREETING_TEMPLATE.replace('{servicio}', 'Tiendas en línea')
    expect(greeting).toBe(
      'Sobre Tiendas en línea: ¿ya lo usas o estás empezando? Cuéntame cómo lo manejas hoy.',
    )
    expect(isGreetingMessage(greeting)).toBe(true)
  })

  it('keeps diagnostic messages', () => {
    expect(isGreetingMessage('Tengo 40 pedidos al día')).toBe(false)
    expect(isGreetingMessage('Sobre Tiendas en línea: ¿ya lo usas?')).toBe(false)
    expect(isGreetingMessage('')).toBe(false)
  })
})
