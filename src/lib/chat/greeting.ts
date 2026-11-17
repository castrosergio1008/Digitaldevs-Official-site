import { getServiceBySlug } from '@/lib/content'
import {
  DEFAULT_GREETING,
  HOME_GREETING,
  SERVICE_GREETING_TEMPLATE,
  SERVICES_GREETING,
} from './copy'

/** Matches `/servicios/<slug>` after trailing slashes are normalized. */
const SERVICE_PATH_PATTERN = /^\/servicios\/([^/]+)$/

/**
 * Returns the chat greeting for the current route.
 *
 * - `/` → home greeting
 * - `/servicios` → services greeting
 * - `/servicios/<slug>` → greeting personalized with the service title
 * - anything else → shared default greeting
 *
 * Pure helper: the widget passes `window.location.pathname` after hydration.
 */
export function greetingForPath(pathname: string): string {
  // Keep the root intact while dropping trailing slashes from deeper paths.
  const normalized = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname

  if (normalized === '/') return HOME_GREETING
  if (normalized === '/servicios') return SERVICES_GREETING

  const slug = normalized.match(SERVICE_PATH_PATTERN)?.[1]
  if (slug) {
    const service = getServiceBySlug(slug)
    if (service) {
      return SERVICE_GREETING_TEMPLATE.replace('{servicio}', service.title)
    }
  }

  return DEFAULT_GREETING
}
