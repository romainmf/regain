import { describe, expect, it } from 'vitest'
import { messageErreur } from '../ui/Connexion'

describe('messages de connexion', () => {
  it('explique qu’une adresse non invitée ne peut pas entrer', () => {
    expect(messageErreur({ message: 'Signups not allowed for otp' })).toMatch(/pas encore invitée/)
  })
  it('distingue un code faux, une limite d’envoi et une erreur inconnue', () => {
    expect(messageErreur({ message: 'Token has expired or is invalid' })).toMatch(/incorrect ou expiré/)
    expect(messageErreur({ message: 'Rate limit exceeded', status: 429 })).toMatch(/Réessaie dans une minute/)
    expect(messageErreur({ message: 'boom' })).toMatch(/impossible pour le moment/)
    expect(messageErreur(null)).toMatch(/impossible pour le moment/)
  })
})
