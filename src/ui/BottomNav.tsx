import { NavLink } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { IconeAgents, IconeAujourdhui, IconeConstruire, IconeLieu } from './icons'
import './bottomnav.css'

export function BottomNav() {
  const { aValider } = useJeu()
  return (
    <nav className="nav-bas" aria-label="Navigation principale">
      <NavLink to="/" end className="nav-onglet nav-lieu">
        <IconeLieu />
        <span>Mon lieu</span>
      </NavLink>
      <NavLink to="/aujourdhui" className="nav-onglet nav-aujourdhui">
        <span className="nav-icone">
          <IconeAujourdhui />
          {aValider.length > 0 && <span className="nav-badge">{aValider.length}</span>}
        </span>
        <span>Aujourd’hui</span>
      </NavLink>
      <NavLink to="/equipe" className="nav-onglet nav-equipe">
        <IconeAgents />
        <span>L’équipe</span>
      </NavLink>
      <NavLink to="/construire" className="nav-onglet nav-construire">
        <IconeConstruire />
        <span>Construire</span>
      </NavLink>
    </nav>
  )
}
