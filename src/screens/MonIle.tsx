import { useCallback, useMemo, useState } from 'react'
import { useJeu } from '../data/jeu'
import { DOMAINES, DOMAINE_LABEL } from '../domain/types'
import { Island } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import { BrinChat } from '../ui/BrinChat'
import { EnTete } from '../ui/EnTete'
import { FicheRapide } from '../ui/FicheRapide'
import './monile.css'

const CLE_BRIN = 'regain.brin.vu'

function dejaVu(): boolean {
  try {
    return localStorage.getItem(CLE_BRIN) === '1'
  } catch {
    return false
  }
}

export function MonIle() {
  const { pret, placements, agents, poseEnCours, poser, demarrerDeplacement, annulerPose } = useJeu()
  const [brinOuvert, setBrinOuvert] = useState(false)
  const [teaser, setTeaser] = useState(() => !dejaVu())
  const [ficheId, setFicheId] = useState<string | null>(null)

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

  const agentPose = poseEnCours ? agents.find((a) => a.id === poseEnCours.agentId) : undefined

  return (
    <div className="ecran mon-ile">
      <EnTete graines={0} elan={1} />

      {poseEnCours && (
        <div className="pose-bandeau" role="status">
          <span>
            {poseEnCours.mode === 'pose' ? 'Pose' : 'Déplace'} {agentPose ? `le bâtiment de ${agentPose.nom}` : 'le bâtiment'}
            {' '}: touche une tuile surlignée.
          </span>
          <button className="pose-annuler" onClick={annulerPose}>Annuler</button>
        </div>
      )}

      <div className="mon-ile-cadre">
        <div className="mon-ile-scene">
          <Island
            tuiles={tuiles}
            placements={placements}
            onCoeur={ouvrirBrin}
            bulleCoeur={!poseEnCours && teaser ? 'Je te fais visiter ?' : null}
            poseEnCours={poseEnCours}
            onPoser={poser}
            onDeplacerDemande={demarrerDeplacement}
            onBatimentTap={setFicheId}
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

      {!pret && <p className="mon-ile-chargement">Ton île se réveille…</p>}

      <BrinChat ouvert={brinOuvert} onFermer={fermerBrin} />
      <FicheRapide
        agentId={ficheId}
        onFermer={() => setFicheId(null)}
        onDeplacer={(id) => {
          setFicheId(null)
          demarrerDeplacement(id)
        }}
      />
    </div>
  )
}
