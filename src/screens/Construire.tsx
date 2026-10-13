import { useNavigate } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { BoutiqueContenu } from '../ui/Boutique'
import '../screens/agents.css'

/** Construire : murs, sols, ambiances, décor et tuiles du lieu. */
export function Construire() {
  const { economie } = useJeu()
  const navigate = useNavigate()
  return (
    <div className="ecran agents-ecran">
      <header className="agents-tete">
        <h1>Construire</h1>
        <p className="ecran-sous">{economie.solde} graines à dépenser pour ton lieu</p>
      </header>
      <BoutiqueContenu onPoser={() => navigate('/')} />
    </div>
  )
}
