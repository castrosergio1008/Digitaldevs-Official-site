/**
 * Shared kill-switch normalization.
 *
 * Environment values are plain strings, so the same "off" intent can arrive as
 * `false`, `0`, `no` or `off` depending on the platform or the person setting
 * the variable. Only those explicit spellings disable the chat; anything else
 * (including unset) leaves it enabled.
 */

const DISABLED_VALUES = new Set(['false', '0', 'no', 'off'])

export function isDisabled(value: string | undefined): boolean {
  return DISABLED_VALUES.has((value ?? '').trim().toLowerCase())
}
