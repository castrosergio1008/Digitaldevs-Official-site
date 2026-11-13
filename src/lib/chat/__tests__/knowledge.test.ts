import { describe, expect, it } from 'vitest'
import { faqs, pricing, process, services } from '@/lib/content'
import { site } from '@/lib/site'
import { buildSystemPrompt } from '../knowledge'

describe('buildSystemPrompt', () => {
  it('is deterministic and cached', () => {
    expect(buildSystemPrompt()).toBe(buildSystemPrompt())
  })

  it('includes every service title and description', () => {
    const prompt = buildSystemPrompt()
    for (const service of services) {
      expect(prompt).toContain(service.title)
      expect(prompt).toContain(service.description)
    }
  })

  it('includes every pricing model', () => {
    const prompt = buildSystemPrompt()
    for (const model of pricing) {
      expect(prompt).toContain(model.name)
      expect(prompt).toContain(model.ideal)
    }
  })

  it('includes the process steps and the FAQ entries', () => {
    const prompt = buildSystemPrompt()
    for (const step of process) {
      expect(prompt).toContain(step.title)
      expect(prompt).toContain(step.description)
    }
    for (const faq of faqs) {
      expect(prompt).toContain(faq.q)
      expect(prompt).toContain(faq.a)
    }
  })

  it('includes public contact information', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain(site.whatsapp)
    expect(prompt).toContain(site.email)
    expect(prompt).toContain(site.whatsappBase)
  })

  it('contains the strict rules and the knowledge-base sections', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('REGLAS ESTRICTAS')
    expect(prompt).toContain('BASE DE CONOCIMIENTO')
    expect(prompt).toContain('## Servicios')
    expect(prompt).toContain('## Modelos de inversión')
    expect(prompt).toContain('## Proceso')
    expect(prompt).toContain('## Preguntas frecuentes')
    expect(prompt).toContain('## Contacto')
  })

  it('stays within a reasonable token budget', () => {
    expect(buildSystemPrompt().length).toBeGreaterThan(1_000)
    expect(buildSystemPrompt().length).toBeLessThan(8_000)
  })

  it('does not leak secrets or environment variables', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).not.toContain('OPENCODE_API_KEY')
    expect(prompt).not.toContain('Bearer')
    expect(prompt.toLowerCase()).not.toContain('api key')
    expect(prompt).not.toContain('process.env')
  })
})
