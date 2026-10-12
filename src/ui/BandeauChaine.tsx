import { useJeu } from '../data/jeu'
import './bandeau.css'

/** « Une action, trois domaines » : montre la dernière chaîne déclenchée. */
export function BandeauChaine() {
  const { derniereChaine, effacerDerniereChaine, agents } = useJeu()
  if (!derniereChaine) return null
  const nom = (id: string) => agents.find((a) => a.id === id)?.nom ?? 'un agent'

  return (
    <div className="bandeau-chaine" role="status">
      <div className="bandeau-txt">
        <strong>Une action, trois domaines</strong>
        <ul>
          {derniereChaine.chaines.map((c, i) => (
            <li key={i}>
              {nom(c.deAgentId)} <span aria-hidden>→</span> {nom(c.versAgentId)}
            </li>
          ))}
        </ul>
      </div>
      <button className="bandeau-fermer" onClick={effacerDerniereChaine} aria-label="Masquer">
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>
    </div>
  )
}
