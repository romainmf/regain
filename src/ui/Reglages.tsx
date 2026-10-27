import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useJeu } from '../data/jeu'
import { importerDepuisFichier, telechargerExport, toutEffacer } from '../data/exportImport'
import { getMeta, setMeta } from '../data/db'
import { Bouton } from './Boutons'
import { Sheet } from './Sheet'
import { compteRequis } from '../compte/supabase'
import { useSession } from '../compte/useSession'
import './reglages.css'

export function Reglages({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { exemplesPresents, effacerExemples } = useJeu()
  const fichier = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ton: 'ok' | 'err'; texte: string } | null>(null)
  const [confirmer, setConfirmer] = useState(false)
  const moteur = useLiveQuery(() => getMeta<'rule' | 'llm'>('moteur', 'rule'), [], 'rule')
  const { email, deconnecter } = useSession()

  const dire = (ton: 'ok' | 'err', texte: string) => {
    setMsg({ ton, texte })
    window.setTimeout(() => setMsg(null), 3200)
  }

  const exporter = async () => {
    try {
      await telechargerExport()
      dire('ok', 'Ton île est exportée dans un fichier JSON.')
    } catch {
      dire('err', 'L’export a échoué.')
    }
  }

  const choisirFichier = () => fichier.current?.click()
  const surFichier = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = '' // permet de réimporter le même fichier
    if (!f) return
    try {
      await importerDepuisFichier(f)
      dire('ok', 'Île importée. Tout est à sa place.')
    } catch (err) {
      dire('err', err instanceof Error ? err.message : 'Import impossible.')
    }
  }

  const reinitialiser = async () => {
    await toutEffacer()
    setConfirmer(false)
    dire('ok', 'Île remise à zéro. Recharge pour repartir du début.')
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre="Réglages">
      {msg && <div className={`reg-msg reg-${msg.ton}`} role="status">{msg.texte}</div>}

      {compteRequis && (
        <section className="reg-bloc">
          <h3>Ton compte</h3>
          <p className="reg-aide">Connecté avec <strong>{email ?? '…'}</strong>. Le compte sert à savoir qui teste ; ton île, elle, reste ici.</p>
          <Bouton variante="contour" onClick={() => deconnecter()} style={{ width: '100%' }}>Se déconnecter</Bouton>
        </section>
      )}

      <section className="reg-bloc">
        <h3>Ton île</h3>
        <p className="reg-aide">Tout reste sur ton téléphone. Tu peux la sauvegarder dans un fichier et la retrouver sur un autre appareil.</p>
        <div className="reg-actions">
          <Bouton variante="contour" onClick={exporter} style={{ flex: 1 }}>Exporter (JSON)</Bouton>
          <Bouton variante="contour" onClick={choisirFichier} style={{ flex: 1 }}>Importer…</Bouton>
        </div>
        <input ref={fichier} type="file" accept="application/json,.json" onChange={surFichier} hidden />
      </section>

      {exemplesPresents && (
        <section className="reg-bloc">
          <h3>Données d’exemple</h3>
          <p className="reg-aide">Des propositions d’exemple ont été chargées au premier lancement.</p>
          <Bouton variante="doux" onClick={() => { effacerExemples(); dire('ok', 'Exemples effacés.') }} style={{ width: '100%' }}>
            Effacer les exemples
          </Bouton>
        </section>
      )}

      <section className="reg-bloc">
        <h3>Moteur des agents</h3>
        <p className="reg-aide">Par défaut, tes agents raisonnent avec des règles simples, hors ligne. Le mode IA les fait préparer avec Claude (nécessite la version en ligne ; la clé reste côté serveur). En cas de souci, le mode règles prend le relais.</p>
        <div className="auto-choix" role="radiogroup" aria-label="Moteur">
          <button role="radio" aria-checked={moteur === 'rule'} className={`auto-option${moteur === 'rule' ? ' auto-on' : ''}`} onClick={() => setMeta('moteur', 'rule')}>Règles (hors ligne)</button>
          <button role="radio" aria-checked={moteur === 'llm'} className={`auto-option${moteur === 'llm' ? ' auto-on' : ''}`} onClick={() => setMeta('moteur', 'llm')}>IA (Claude)</button>
        </div>
      </section>

      <section className="reg-bloc reg-danger">
        <h3>Recommencer</h3>
        <p className="reg-aide">Efface toute ton île. Les trois agents offerts reviendront au prochain lancement.</p>
        {confirmer ? (
          <div className="reg-actions">
            <Bouton variante="doux" onClick={() => setConfirmer(false)} style={{ flex: 1 }}>Annuler</Bouton>
            <Bouton onClick={reinitialiser} className="reg-rouge" style={{ flex: 1 }}>Oui, tout effacer</Bouton>
          </div>
        ) : (
          <Bouton variante="contour" onClick={() => setConfirmer(true)} style={{ width: '100%' }}>Tout réinitialiser</Bouton>
        )}
      </section>

      <p className="reg-version">Regain · bêta</p>
    </Sheet>
  )
}
