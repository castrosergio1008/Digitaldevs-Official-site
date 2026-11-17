/**
 * Central user-facing copy for the chat widget.
 *
 * ATLAS owns the wording; these constants are the single source of truth so the
 * UI never hard-codes duplicate strings.
 */

/** Fallback greeting for routes without a specific message. */
export const DEFAULT_GREETING =
  'Hola, soy el asistente de Digital-devs. ¿En qué te puedo ayudar hoy?'

export const HOME_GREETING =
  'Hola, soy el asistente de Digital-devs. Ayudamos a negocios como el tuyo a automatizar tareas y ganar tiempo. Cuéntame, ¿qué vendes y a quién?'

export const SERVICES_GREETING =
  'Hola, soy el asistente de Digital-devs. Cuéntame qué quieres lograr con tu negocio y te ayudo a encontrar el camino más corto.'

export const SERVICE_GREETING_TEMPLATE =
  'Sobre {servicio}: ¿ya lo usas o estás empezando? Cuéntame cómo lo manejas hoy.'

export const LEAD_CTA_LABEL = 'Sí, quiero que me contacten'

export const POST_LEAD_MESSAGE =
  'Ya recibí tus datos. Te escribimos muy pronto para coordinar el siguiente paso.'

export const ADVISOR_CHIP_LABEL = 'Que un asesor me contacte'

/** Shown when the widget detects contact info in a free-text message. */
export const DETECTED_LEAD_MESSAGE =
  'Encontré tus datos en tu mensaje. Antes de abrir WhatsApp, confírmame que quieres que continúe.'

/**
 * Greeting used before the copy update. Kept so sessions stored by returning
 * visitors are filtered out of the lead context too.
 */
export const LEGACY_GREETING =
  '¡Hola! Soy el asistente virtual de Digital-devs. ¿En qué puedo ayudar hoy?'

/** Matches the personalized service greeting once `{servicio}` is replaced. */
const SERVICE_GREETING_PATTERN =
  /^Sobre .+: ¿ya lo usas o estás empezando\? Cuéntame cómo lo manejas hoy\.$/

/**
 * True when the assistant text is a widget greeting. Greetings carry no
 * diagnostic value, so the lead context builder filters them out.
 */
export function isGreetingMessage(text: string): boolean {
  return (
    text === DEFAULT_GREETING ||
    text === HOME_GREETING ||
    text === SERVICES_GREETING ||
    text === LEGACY_GREETING ||
    SERVICE_GREETING_PATTERN.test(text)
  )
}
