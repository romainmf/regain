import { useMemo } from 'react'
import { getTemplate } from '../domain/catalog'
import { DOMAINES, DOMAINE_LABEL } from '../domain/types'
import { Island, type PlacementVue } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import { EnTete } from '../ui/EnTete'
import './atelier.css'

/** Jalon 1 : île statique avec les trois agents offerts. */
const POSES_DEPART: Record<string, { x: number; y: number }> = {
  plume: { x: 0, y: 1 },
  source: { x: 5, y: 2 },
  racine: { x: 2, y: 5 },
}

export function Atelier() {
  const tuiles = useMemo(tuilesDeDepart, [])
  const placements: PlacementVue[] = Object.entries(POSES_DEPART).map(([id, pos]) => {
    const t = getTemplate(id)!
    return { id, ...pos, batiment: t.batiment, domaine: t.domaine, niveau: 1, libelle: `${t.batimentNom} de ${t.nom}` }
  })

  return (
    <div className="ecran atelier">
      <EnTete graines={0} elan={1} />
      <div className="atelier-ile">
        <Island tuiles={tuiles} placements={placements} />
      </div>
      <ul className="legende" aria-label="Les trois domaines">
        {DOMAINES.map((d) => (
          <li key={d} className={`legende-item legende-${d}`}>
            <span className="legende-point" aria-hidden /> {DOMAINE_LABEL[d]}
          </li>
        ))}
      </ul>
    </div>
  )
}
