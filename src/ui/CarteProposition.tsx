import { useState } from 'react'
import { useJeu } from '../data/jeu'
import { DOMAINE_LABEL } from '../domain/types'
import type { Proposition } from '../domain/propositions'
import { Bouton } from './Boutons'
import './validation.css'

/** Libellé du bouton principal selon ce que l'agent a préparé. */
export function libelleValidation(type: string): string {
  switch (type) {
    case 'facture': return 'Envoyer la facture'
    case 'relance': return 'Envoyer la relance'
    case 'creneau': return 'Bloquer le créneau'
    case 'coussin': return 'Mettre de côté'
    case 'empreinte': return 'Ajouter au bilan'
    case 'label': return 'Mettre à jour le label'
    default: return 'Valider'
  }
}

/** Ce qui suivra une fois validé (les chaînes entre domaines), pour l'annoncer. */
export function suiteDe(type: string): string | null {
  switch (type) {
    case 'facture': return 'Ensuite : Coussin fiscal met de côté les cotisations, Empreinte ajoute la mission à ton bilan.'
    case 'trajet_bascarbone': return 'Ensuite : Label vivant enrichit ton badge.'
    default: return null
  }
}

interface Props {
  p: Proposition
  /** Carte compacte (aperçu sur Mon lieu). */
  compacte?: boolean
  onValide?: (gain: number, chaines: number) => void
}

/** Une proposition à valider : qui, quoi, la suite, et les boutons. */
export function CarteProposition({ p, compacte = false, onValide }: Props) {
  const { agents, validerProposition, plusTard, revoir } = useJeu()
  const [edition, setEdition] = useState(false)
  const [titre, setTitre] = useState(p.titre)
  const [detail, setDetail] = useState(p.detail ?? '')
  const agent = agents.find((a) => a.id === p.agentId)
  const suite = suiteDe(p.type)

  const valider = async () => {
    const r = await validerProposition(p.id)
    if (r) onValide?.(r.gain, r.chaines.length)
  }

  return (
    <article className={`val-carte val-${p.domaine}${compacte ? ' val-compacte' : ''}`}>
      <div className="val-haut">
        <span className={`val-point val-point-${p.domaine}`} aria-hidden />
        <strong className="val-agent">{agent?.nom ?? 'Agent'}</strong>
        <span className="val-dom">· {DOMAINE_LABEL[p.domaine]}</span>
        {p.origine === 'chaine' && <span className="val-chaine">chaîne</span>}
        {p.exemple && <span className="val-exemple">exemple</span>}
      </div>
      {edition ? (
        <div className="val-revoir">
          <label className="champ"><span>Titre</span><input value={titre} onChange={(e) => setTitre(e.target.value)} /></label>
          <label className="champ"><span>Détail</span><input value={detail} onChange={(e) => setDetail(e.target.value)} /></label>
          <div className="val-actions">
            <Bouton domaine={p.domaine} style={{ flex: 1 }} onClick={async () => { await revoir(p.id, { titre, detail }); setEdition(false) }}>Enregistrer</Bouton>
            <Bouton variante="doux" onClick={() => setEdition(false)}>Annuler</Bouton>
          </div>
        </div>
      ) : (
        <>
          <h3>{p.titre}</h3>
          {p.detail && <p className="val-detail">{p.detail}</p>}
          {suite && !compacte && <p className="val-suite">{suite}</p>}
          <div className="val-actions">
            <Bouton domaine={p.domaine} onClick={valider} style={{ flex: 1 }}>{libelleValidation(p.type)}</Bouton>
            <Bouton variante="doux" onClick={() => plusTard(p.id)}>Plus tard</Bouton>
            {!compacte && <button className="val-lien" onClick={() => setEdition(true)}>Revoir</button>}
          </div>
        </>
      )}
    </article>
  )
}
