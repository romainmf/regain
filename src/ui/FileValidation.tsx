import { useState } from 'react'
import { useJeu } from '../data/jeu'
import { CarteProposition } from './CarteProposition'
import './validation.css'

/** Le fil « Aujourd'hui » : tout ce que les agents ont préparé, à valider. */
export function FileValidation() {
  const { aValider, plusTardListe, exemplesPresents, reprendre, effacerExemples } = useJeu()
  const [toast, setToast] = useState<string | null>(null)

  const apresValidation = (gain: number, chaines: number) => {
    const bonus = chaines ? ` · ${chaines} domaine${chaines > 1 ? 's' : ''} nourri${chaines > 1 ? 's' : ''}` : ''
    setToast(gain > 0 ? `+${gain} graines${bonus}` : `Ta journée est déjà bien remplie${bonus}`)
    setTimeout(() => setToast(null), 2600)
  }

  return (
    <div className="val">
      {toast && <div className="val-toast" role="status">{toast}</div>}

      {aValider.length === 0 ? (
        <p className="val-vide">Rien à valider pour l’instant. Dis à tes agents ce qui s’est passé, ils s’occupent du reste.</p>
      ) : (
        <ul className="val-liste">
          {aValider.map((p) => (
            <li key={p.id}><CarteProposition p={p} onValide={apresValidation} /></li>
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
    </div>
  )
}
