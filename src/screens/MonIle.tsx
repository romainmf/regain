import { useCallback, useMemo, useState } from 'react'
import { getTemplate } from '../domain/catalog'
import { DOMAINES, DOMAINE_LABEL } from '../domain/types'
import { Island, type PlacementVue } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import { BrinChat } from '../ui/BrinChat'
import { EnTete } from '../ui/EnTete'
import './monile.css'

/** Jalon 1 : île statique avec les trois agents offerts. */
const POSES_DEPART: Record<string, { x: number; y: number }> = {
  plume: { x: 1, y: 3 },
  source: { x: 4, y: 1 },
  racine: { x: 5, y: 4 },
}

const CLE_BRIN = 'regain.brin.vu'

function dejaVu(): boolean {
  try {
    return localStorage.getItem(CLE_BRIN) === '1'
  } catch {
    return false
  }
}

export function MonIle() {
  const [brinOuvert, setBrinOuvert] = useState(false)
  const [teaser, setTeaser] = useState(() => !dejaVu())
  const ouvrirBrin = () => {
    setBrinOuvert(true)
    setTeaser(false)
    try {
      localStorage.setItem(CLE_BRIN, '1')
    } catch {
      /* stockage indisponible : le teaser reviendra, ce n'est pas grave */
    }
  }
  const fermerBrin = useCallback(() => setBrinOuvert(false), [])
  const tuiles = useMemo(tuilesDeDepart, [])
  const placements: PlacementVue[] = Object.entries(POSES_DEPART).map(([id, pos]) => {
    const t = getTemplate(id)!
    return { id, ...pos, batiment: t.batiment, domaine: t.domaine, niveau: 1, libelle: `${t.batimentNom} de ${t.nom}` }
  })

  return (
    <div className="ecran mon-ile">
      <EnTete graines={0} elan={1} />
      <div className="mon-ile-cadre">
        <div className="mon-ile-scene">
          <Island
            tuiles={tuiles}
            placements={placements}
            onCoeur={ouvrirBrin}
            bulleCoeur={teaser ? 'Je te fais visiter ?' : null}
          />
        </div>
      </div>
      <ul className="legende" aria-label="Les trois domaines">
        {DOMAINES.map((d) => (
          <li key={d} className={`legende-item legende-${d}`}>
            <span className="legende-point" aria-hidden /> {DOMAINE_LABEL[d]}
          </li>
        ))}
      </ul>
      <BrinChat ouvert={brinOuvert} onFermer={fermerBrin} />
    </div>
  )
}
