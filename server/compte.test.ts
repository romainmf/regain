import { describe, expect, it } from 'vitest'
import { jetonDe } from './compte'

describe('jeton côté serveur', () => {
  it('lit le jeton d’un en-tête Bearer, et rien d’autre', () => {
    expect(jetonDe('Bearer abc.def')).toBe('abc.def')
    expect(jetonDe('bearer  xyz ')).toBe('xyz')
    expect(jetonDe('Basic abc')).toBeNull()
    expect(jetonDe(undefined)).toBeNull()
  })
})
