import { describe, expect, it } from 'vitest'
import { niveauBatiment } from './progression'

describe('niveau du bâtiment selon l’usage', () => {
  it('démarre au niveau 1', () => {
    expect(niveauBatiment(0)).toBe(1)
    expect(niveauBatiment(9)).toBe(1)
  })
  it('passe au niveau 2 à 10 validations', () => {
    expect(niveauBatiment(10)).toBe(2)
    expect(niveauBatiment(29)).toBe(2)
  })
  it('passe au niveau 3 à 30 validations', () => {
    expect(niveauBatiment(30)).toBe(3)
    expect(niveauBatiment(999)).toBe(3)
  })
})
