import { useCallback, useMemo, useState } from 'react'
import { useJeu } from '../data/jeu'
import { Island } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import { BrinChat } from '../ui/BrinChat'
import { EnTete } from '../ui/EnTete'
import { SaisieRapide } from '../ui/SaisieRapide'
import { FileValidation } from '../ui/FileValidation'
import { BandeauChaine } from '../ui/BandeauChaine'
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
  const {
    pret, placements, agents, poseEnCours, poser, demarrerDeplacement, annulerPose, ouvrirFiche,
    economie, aValider, agentsEnAttente, derniereChaine,
  } = useJeu()
  const [brinOuvert, setBrinOuvert] = useState(false)
  const [teaser, setTeaser] = useState(() => !dejaVu())
  const [saisieOuverte, setSaisieOuverte] = useState(false)
  const [fileOuverte, setFileOuverte] = useState(false)

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
      <EnTete graines={economie.solde} elan={economie.elan} />

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
            onBatimentTap={ouvrirFiche}
            agentsEnAttente={agentsEnAttente}
            meteo={economie.meteo}
            repos={economie.repos}
            elan={economie.elan}
            chaine={derniereChaine?.chaines[0] ?? null}
          />
        </div>
      </div>

      {derniereChaine && <BandeauChaine />}

      <div className="actions-jeu">
        <button className="action-saisir" onClick={() => setSaisieOuverte(true)}>
          <span aria-hidden>✎</span> Saisie rapide
        </button>
        <button className="action-valider" onClick={() => setFileOuverte(true)}>
          À valider
          {aValider.length > 0 && <span className="action-badge">{aValider.length}</span>}
        </button>
      </div>

      {!pret && <p className="mon-ile-chargement">Ton île se réveille…</p>}

      <BrinChat ouvert={brinOuvert} onFermer={fermerBrin} />
      <SaisieRapide ouvert={saisieOuverte} onFermer={() => setSaisieOuverte(false)} />
      <FileValidation ouvert={fileOuverte} onFermer={() => setFileOuverte(false)} />
    </div>
  )
}
