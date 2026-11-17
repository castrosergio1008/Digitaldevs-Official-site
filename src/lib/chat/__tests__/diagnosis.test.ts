import { describe, expect, it } from 'vitest'
import { isDiagnosisSummary } from '../diagnosis'

describe('isDiagnosisSummary', () => {
  it('detects the structured closing summary', () => {
    expect(
      isDiagnosisSummary('Resumen: pedidos perdidos → Automatización de Procesos ($2.800.000+)'),
    ).toBe(true)
  })

  it('is case-insensitive and tolerant of extra spacing', () => {
    expect(isDiagnosisSummary('resumen:   dolor → producto ($1.000.000)')).toBe(true)
    expect(isDiagnosisSummary('RESUMEN:\tdolor → producto')).toBe(true)
  })

  it('detects the summary when it appears after other text', () => {
    expect(isDiagnosisSummary('Perfecto, cerrando:\nResumen: dolor → producto ($500.000)')).toBe(
      true,
    )
  })

  it('ignores replies that only mention the word', () => {
    expect(isDiagnosisSummary('¿Quieres que te haga un resumen de precios?')).toBe(false)
    expect(isDiagnosisSummary('Resumen')).toBe(false)
    expect(isDiagnosisSummary('Resumen:')).toBe(false)
    expect(isDiagnosisSummary('')).toBe(false)
  })
})
