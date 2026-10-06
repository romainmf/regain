import { describe, expect, it } from 'vitest'
import { SUJETS, normaliser, repondre, sujet } from './guide'

describe('Brin, le guide', () => {
  it('normalise accents, apostrophes et ponctuation', () => {
    expect(normaliser('  C’est quoi l’ÉLAN ?! ')).toBe('c est quoi l elan')
  })

  it('reconnaît les sujets principaux', () => {
    expect(repondre('Comment je gagne des graines ?').id).toBe('graines')
    expect(repondre("c'est quoi l'élan").id).toBe('elan')
    expect(repondre('Mes données vont dans le cloud ?').id).toBe('donnees')
    expect(repondre('Que se passe-t-il si je pars en vacances').id).toBe('repos')
    expect(repondre('Bonjour').id).toBe('accueil')
  })

  it('oriente les questions de santé vers le garde-fou', () => {
    expect(repondre('tu peux m’aider pour mon sommeil ?').id).toBe('sante')
  })

  it('répond avec bienveillance quand il ne comprend pas', () => {
    const s = repondre('xyzzy')
    expect(s.id).toBe('inconnu')
    expect(s.suites.length).toBeGreaterThan(0)
  })

  it('ne propose que des suites qui existent', () => {
    for (const s of SUJETS) for (const id of s.suites) expect(sujet(id).id).toBe(id)
  })

  it('n’emploie jamais de vocabulaire culpabilisant', () => {
    const interdits = /\b(échec|en retard|tu dois|punition)\b/i
    for (const s of SUJETS) for (const r of s.reponse) expect(r).not.toMatch(interdits)
  })
})
