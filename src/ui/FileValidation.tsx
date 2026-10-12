import { useState } from 'react'
import { useJeu } from '../data/jeu'
import { DOMAINE_LABEL } from '../domain/types'
import type { Proposition } from '../domain/propositions'
import { Bouton } from './Boutons'
import { Sheet } from './Sheet'
import './validation.css'

export function FileValidation({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { aValider, plusTardListe, exemplesPresents, validerProposition, plusTard, reprendre, effacerExemples } = useJeu()
  const [toast, setToast] = useState<string | null>(null)
  const [edition, setEdition] = useState<string | null>(null)

  const valider = async (p: Proposition) => {
    const r = await validerProposition(p.id)
    if (r) {
      const bonus = r.chaines.length ? ` · ${r.chaines.length} domaine${r.chaines.length > 1 ? 's' : ''} nourri${r.chaines.length > 1 ? 's' : ''}` : ''
      setToast(r.gain > 0 ? `+${r.gain} graines${bonus}` : `Ta journée est déjà bien remplie${bonus}`)
      setTimeout(() => setToast(null), 2600)
    }
  }

  return (
    <Sheet ouvert={ouvert} onFermer={onFermer} titre={`À valider${aValider.length ? ` · ${aValider.length}` : ''}`}>
      {toast && <div className="val-toast" role="status">{toast}</div>}

      {aValider.length === 0 ? (
        <p className="val-vide">Rien à valider pour l’instant. Fais une saisie rapide, tes agents s’occupent du reste.</p>
      ) : (
        <ul className="val-liste">
          {aValider.map((p) => (
            <li key={p.id} className={`val-carte val-${p.domaine}`}>
              <div className="val-haut">
                <span className={`pastille-${p.domaine} val-pastille`}>{DOMAINE_LABEL[p.domaine]}</span>
                {p.origine === 'chaine' && <span className="val-chaine">chaîne</span>}
                {p.exemple && <span className="val-exemple">exemple</span>}
              </div>
              {edition === p.id ? (
                <Revoir p={p} onFini={() => setEdition(null)} />
              ) : (
                <>
                  <h3>{p.titre}</h3>
                  {p.detail && <p className="val-detail">{p.detail}</p>}
                  <div className="val-actions">
                    <Bouton domaine={p.domaine} onClick={() => valider(p)} style={{ flex: 1 }}>Valider</Bouton>
                    <Bouton variante="contour" onClick={() => setEdition(p.id)}>Revoir</Bouton>
                    <Bouton variante="doux" onClick={() => plusTard(p.id)}>Plus tard</Bouton>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {plusTardListe.length > 0 && (
        <section className="val-plustard">
          <h4>Plus tard ({plusTardListe.length})</h4>
          <ul>
            {plusTardListe.map((p) => (
              <li key={p.id}>
                <span>{p.titre}</span>
                <button className="val-reprendre" onClick={() => reprendre(p.id)}>Reprendre</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {exemplesPresents && (
        <button className="val-effacer" onClick={effacerExemples}>Effacer les exemples</button>
      )}
    </Sheet>
  )
}

function Revoir({ p, onFini }: { p: Proposition; onFini: () => void }) {
  const { revoir } = useJeu()
  const [titre, setTitre] = useState(p.titre)
  const [detail, setDetail] = useState(p.detail ?? '')
  return (
    <div className="val-revoir">
      <label className="champ">
        <span>Titre</span>
        <input value={titre} onChange={(e) => setTitre(e.target.value)} />
      </label>
      <label className="champ">
        <span>Détail</span>
        <input value={detail} onChange={(e) => setDetail(e.target.value)} />
      </label>
      <div className="val-actions">
        <Bouton domaine={p.domaine} style={{ flex: 1 }} onClick={async () => { await revoir(p.id, { titre, detail }); onFini() }}>
          Enregistrer
        </Bouton>
        <Bouton variante="doux" onClick={onFini}>Annuler</Bouton>
      </div>
    </div>
  )
}
