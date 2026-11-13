import { describe, expect, it } from 'vitest'
import { isDisabled } from '../killswitch'

describe('isDisabled', () => {
  it('treats every supported "off" spelling as disabled, case-insensitively', () => {
    for (const value of ['false', 'FALSE', 'False', '0', 'no', 'NO', 'No', 'off', 'OFF', 'Off']) {
      expect(isDisabled(value)).toBe(true)
    }
  })

  it('trims surrounding whitespace before normalizing', () => {
    expect(isDisabled('  false  ')).toBe(true)
    expect(isDisabled('\toff\n')).toBe(true)
  })

  it('keeps the chat enabled for unset or non-"off" values', () => {
    for (const value of [undefined, '', 'true', '1', 'yes', 'on', 'enabled', 'random']) {
      expect(isDisabled(value)).toBe(false)
    }
  })
})
