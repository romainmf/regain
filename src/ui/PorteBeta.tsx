import { useState } from 'react'
import { BrinAvatar } from './BrinAvatar'
import { Bouton } from './Boutons'
import './porte.css'

const CLE_ACCES = 'regain.acces'

/** Vrai si la porte bêta est active (variable de build) et pas encore franchie. */
export function porteRequise(): boolean {
  if (import.meta.env.VITE_BETA_GATE !== '1') return false
  try {
    return localStorage.getItem(CLE_ACCES) !== '1'
  } catch {
    return true
  }
}

function memoriserAcces() {
  try {
    localStorage.setItem(CLE_ACCES, '1')
  } catch {
    /* stockage indisponible : la porte réapparaîtra, sans gravité */
  }
}

/** Écran d'accès à la bêta : un mot de passe pour entrer. */
export function PorteBeta({ onEntrer }: { onEntrer: () => void }) {
  const [mdp, setMdp] = useState('')
  const [envoi, setEnvoi] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  const entrer = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mdp.trim() || envoi) return
    setEnvoi(true)
    setErreur(null)
    try {
      // En développement, pas de fonction serveur : on laisse entrer.
      let ok = import.meta.env.DEV
      if (!ok) {
        const r = await fetch('/api/acces', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ password: mdp }),
        })
        ok = r.ok && (await r.json()).ok === true
      }
      if (ok) {
        memoriserAcces()
        onEntrer()
      } else {
        setErreur('Mot de passe incorrect.')
      }
    } catch {
      setErreur('Connexion impossible. Réessaie dans un instant.')
    } finally {
      setEnvoi(false)
    }
  }

  return (
    <div className="porte">
      <form className="porte-carte" onSubmit={entrer}>
        <div className="porte-avatar"><BrinAvatar taille={84} /></div>
        <h1>Regain</h1>
        <p className="porte-sous">Bêta privée</p>
        <p className="porte-txt">Entre le mot de passe d’accès pour découvrir ta future île.</p>

        <label htmlFor="porte-mdp" className="visuellement-cache">Mot de passe</label>
        <input
          id="porte-mdp"
          type="password"
          value={mdp}
          onChange={(e) => setMdp(e.target.value)}
          placeholder="Mot de passe"
          autoComplete="current-password"
          autoFocus
        />
        {erreur && <p className="porte-erreur" role="alert">{erreur}</p>}

        <Bouton type="submit" disabled={!mdp.trim() || envoi} style={{ width: '100%', marginTop: 4 }}>
          {envoi ? 'Vérification…' : 'Entrer'}
        </Bouton>
        <p className="porte-pied">Pas de compte, rien à créer : ton île reste sur ton appareil.</p>
      </form>
    </div>
  )
}
