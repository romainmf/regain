import { describe, expect, it } from 'vitest'
import { energieAgent } from './JaugeEnergie'

describe('énergie d’un agent', () => {
  it('est nulle quand l’agent est en repos', () => {
    expect(energieAgent(50, false)).toBe(0)
  })
  it('monte avec l’usage, sans dépasser 1', () => {
    expect(energieAgent(0, true)).toBe(0)
    expect(energieAgent(7, true)).toBe(1)
    expect(energieAgent(100, true)).toBe(1)
  })
  it('n’est jamais négative', () => {
    expect(energieAgent(-5, true)).toBeGreaterThanOrEqual(0)
  })
})
