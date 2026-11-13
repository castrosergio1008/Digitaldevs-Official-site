import type { ChatMessage, ChatProvider, ChatProviderOptions } from '../types'

/**
 * Deterministic provider for tests and local development. It recognises a few
 * intents and answers with canned Spanish text, so the widget and the API can
 * be exercised without calling a real model. It never fails and needs no key.
 */
export class MockProvider implements ChatProvider {
  readonly name = 'mock'

  // `options` (sessionId/signal) is intentionally ignored: the mock is
  // in-memory and deterministic, so it needs no request-scoped metadata.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async complete(messages: ChatMessage[], _options?: ChatProviderOptions): Promise<string> {
    const text = lastUserMessage(messages).toLowerCase()

    if (/(^|\s)(hola|buenas|buenos dias|buenos días|buenas tardes|buenas noches)\b/.test(text)) {
      return '¡Hola! Soy el asistente virtual de Digital-devs. ¿En qué te puedo ayudar hoy?'
    }
    if (/(precio|costo|cuanto|cuánto|inversion|inversión|tarifa|valor)/.test(text)) {
      return 'Los precios dependen del alcance: un sitio corporativo o landing se cotiza como proyecto cerrado, y una tienda en línea o aplicación a medida por módulos. ¿Qué tipo de proyecto tienes en mente?'
    }
    if (/(servicio|servicios|que hacen|qué hacen|ofrecen|ofrece|catalogo|catálogo)/.test(text)) {
      return 'Ofrecemos sitios web, tiendas en línea, aplicaciones web a medida, MVPs para startups, Progressive Web Apps y soporte/mantenimiento. ¿Cuál te interesa?'
    }
    if (/(tiempo|tarda|plazo|semanas|demora|entrega)/.test(text)) {
      return 'Una landing o sitio corporativo puede estar listo en 1 a 3 semanas; las tiendas en línea y aplicaciones a medida van de 4 a 10 semanas según los módulos.'
    }
    if (/(contactar|contacto|asesor|humano|whatsapp|llamar)/.test(text)) {
      return 'Con gusto te conecto con un asesor. Escríbenos por WhatsApp y te atendemos de inmediato.'
    }
    if (/gracias/.test(text)) {
      return '¡Con gusto! Si tienes más dudas, aquí estoy.'
    }

    return 'No estoy seguro de haber entendido. ¿Puedes contarme un poco más sobre lo que necesitas?'
  }
}

/**
 * Returns the content of the last non-system message so the mock keeps working
 * even when the route injects a system context message.
 */
function lastUserMessage(messages: ChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message && message.role !== 'system' && message.content) return message.content
  }
  return ''
}
