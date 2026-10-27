import { useState } from 'react'
import { supabase, urlRetour } from '../compte/supabase'
import { BrinAvatar } from './BrinAvatar'
import { Bouton } from './Boutons'
import './porte.css'

type Etape = 'email' | 'envoye'

/** Le message à montrer pour une erreur Supabase, en français. */
export function messageErreur(err: { message?: string; status?: number } | null | undefined): string {
  const m = (err?.message ?? '').toLowerCase()
  if (m.includes('signups not allowed') || m.includes('signup')) return 'Cette adresse n’est pas encore invitée à la bêta.'
  if (m.includes('rate limit') || err?.status === 429) return 'Trop d’essais d’un coup. Réessaie dans une minute.'
  if (m.includes('invalid') || m.includes('expired') || m.includes('otp')) return 'Code incorrect ou expiré. Redemande un lien.'
  if (m.includes('invalid email') || m.includes('validate email')) return 'Cette adresse e-mail ne semble pas valide.'
  return 'Connexion impossible pour le moment. Réessaie dans un instant.'
}

/**
 * Porte de la bêta privée : on entre avec son adresse e-mail, Supabase envoie
 * un lien magique (et un code à six chiffres si le modèle d'e-mail l'inclut).
 * Seules les adresses invitées peuvent se connecter : rien n'est créé ici.
 */
export function Connexion() {
  const [etape, setEtape] = useState<Etape>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  if (!supabase) {
    return (
      <div className="porte">
        <div className="porte-carte">
          <div className="porte-avatar"><BrinAvatar taille={84} /></div>
          <h1>Regain</h1>
          <p className="porte-sous">Bêta privée</p>
          <p className="porte-txt">L’île n’est pas encore ouverte ici. Les testeurs invités recevront leur accès par e-mail.</p>
        </div>
      </div>
    )
  }
  const client = supabase

  const demanderLien = async (e: React.FormEvent) => {
    e.preventDefault()
    const adresse = email.trim().toLowerCase()
    if (!adresse || envoi) return
    setEnvoi(true)
    setErreur(null)
    const { error } = await client.auth.signInWithOtp({
      email: adresse,
      options: { shouldCreateUser: false, emailRedirectTo: urlRetour() },
    })
    setEnvoi(false)
    if (error) setErreur(messageErreur(error))
    else setEtape('envoye')
  }

  const verifierCode = async (e: React.FormEvent) => {
    e.preventDefault()
    const jeton = code.replace(/\s+/g, '')
    if (jeton.length < 6 || envoi) return
    setEnvoi(true)
    setErreur(null)
    const { error } = await client.auth.verifyOtp({ email: email.trim().toLowerCase(), token: jeton, type: 'email' })
    setEnvoi(false)
    if (error) setErreur(messageErreur(error))
    // Sinon, la session arrive par onAuthStateChange et l'app s'ouvre.
  }

  return (
    <div className="porte">
      {etape === 'email' ? (
        <form className="porte-carte" onSubmit={demanderLien}>
          <div className="porte-avatar"><BrinAvatar taille={84} /></div>
          <h1>Regain</h1>
          <p className="porte-sous">Bêta privée</p>
          <p className="porte-txt">Entre l’adresse e-mail de ton invitation : tu recevras un lien pour ouvrir ton île.</p>

          <label htmlFor="porte-email" className="visuellement-cache">Adresse e-mail</label>
          <input
            id="porte-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="toi@exemple.fr"
            autoComplete="email"
            inputMode="email"
            autoFocus
          />
          {erreur && <p className="porte-erreur" role="alert">{erreur}</p>}

          <Bouton type="submit" disabled={!email.trim() || envoi} style={{ width: '100%', marginTop: 4 }}>
            {envoi ? 'Envoi…' : 'Recevoir mon lien'}
          </Bouton>
          <p className="porte-pied">Pas de mot de passe. Ton île reste sur ton appareil ; le compte sert à savoir qui teste.</p>
        </form>
      ) : (
        <form className="porte-carte" onSubmit={verifierCode}>
          <div className="porte-avatar"><BrinAvatar taille={84} /></div>
          <h1>C’est parti</h1>
          <p className="porte-sous">Regarde ta boîte mail</p>
          <p className="porte-txt">
            Un lien vient de partir vers <strong>{email.trim()}</strong>. Clique dessus, ou entre ici le code reçu.
          </p>

          <label htmlFor="porte-code" className="visuellement-cache">Code reçu par e-mail</label>
          <input
            id="porte-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code à 6 chiffres"
            inputMode="numeric"
            autoComplete="one-time-code"
          />
          {erreur && <p className="porte-erreur" role="alert">{erreur}</p>}

          <Bouton type="submit" variante="contour" disabled={code.replace(/\s+/g, '').length < 6 || envoi} style={{ width: '100%', marginTop: 4 }}>
            {envoi ? 'Vérification…' : 'Valider le code'}
          </Bouton>
          <button type="button" className="porte-lien" onClick={() => { setEtape('email'); setCode(''); setErreur(null) }}>
            Changer d’adresse ou renvoyer un lien
          </button>
        </form>
      )}
    </div>
  )
}
