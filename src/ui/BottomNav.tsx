import { NavLink } from 'react-router-dom'
import { IconeAgents, IconeIle, IconePlus } from './icons'
import './bottomnav.css'

export function BottomNav() {
  return (
    <nav className="nav-bas" aria-label="Navigation principale">
      <NavLink to="/" end className="nav-onglet">
        <IconeIle />
        <span>Mon île</span>
      </NavLink>
      <NavLink to="/creer" className="nav-plus" aria-label="Créer un agent">
        <IconePlus />
      </NavLink>
      <NavLink to="/agents" className="nav-onglet">
        <IconeAgents />
        <span>Agents</span>
      </NavLink>
    </nav>
  )
}
