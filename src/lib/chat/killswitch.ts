/**
 * Shared kill-switch normalization.
 *
 * Environment values are plain strings, so the same "off" intent can arrive as
 * `false`, `0`, `no` or `off` depending on the platform or the person setting
 * the variable. Only those explicit spellings disable the chat; anything else
 * (including unset) leaves it enabled.
 */

const DISABLED_VALUES = new Set(['false', '0', 'no', 'off'])
const ENABLED_VALUES = new Set(['true', '1', 'yes', 'on'])

export function isDisabled(value: string | undefined): boolean {
  return DISABLED_VALUES.has((value ?? '').trim().toLowerCase())
}

/**
 * Normalizes an explicit on/off flag with a default. Unlike `isDisabled`,
 * unset or empty values fall back to `defaultValue`, which lets new features
 * ship dark (default off) without changing the behavior of existing flags.
 */
export function isEnabled(value: string | undefined, defaultValue: boolean): boolean {
  const normalized = (value ?? '').trim().toLowerCase()
  if (normalized === '') return defaultValue
  if (DISABLED_VALUES.has(normalized)) return false
  if (ENABLED_VALUES.has(normalized)) return true
  return defaultValue
}
