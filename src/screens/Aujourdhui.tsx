import { useJeu } from '../data/jeu'
import { FileValidation } from '../ui/FileValidation'
import '../screens/agents.css'

/** Aujourd'hui : le fil complet des propositions à valider. */
export function Aujourdhui() {
  const { aValider } = useJeu()
  return (
    <div className="ecran agents-ecran">
      <header className="agents-tete">
        <h1>Aujourd’hui</h1>
        <p className="ecran-sous">{aValider.length ? `${aValider.length} à valider · Tout le lieu` : 'Rien en attente'}</p>
      </header>
      <FileValidation />
    </div>
  )
}
