import { useCallback, useState } from 'react'
import { useJeu } from '../data/jeu'
import { Island } from '../island/Island'
import { BrinChat } from '../ui/BrinChat'
import { EnTete } from '../ui/EnTete'
import { SaisieRapide } from '../ui/SaisieRapide'
import { FileValidation } from '../ui/FileValidation'
import { Reglages } from '../ui/Reglages'
import { Boutique } from '../ui/Boutique'
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
    tuiles, decors, ambianceActive,
  } = useJeu()
  const [brinOuvert, setBrinOuvert] = useState(false)
  const [teaser, setTeaser] = useState(() => !dejaVu())
  const [saisieOuverte, setSaisieOuverte] = useState(false)
  const [fileOuverte, setFileOuverte] = useState(false)
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [boutiqueOuverte, setBoutiqueOuverte] = useState(false)

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

  const agentPose = poseEnCours?.agentId ? agents.find((a) => a.id === poseEnCours.agentId) : undefined
  const texteBandeau = poseEnCours
    ? poseEnCours.kind === 'decor'
      ? 'Pose ton décor : touche une tuile surlignée.'
      : `${poseEnCours.mode === 'pose' ? 'Pose' : 'Déplace'} ${agentPose ? `le bâtiment de ${agentPose.nom}` : 'le bâtiment'} : touche une tuile surlignée.`
    : ''

  return (
    <div className="ecran mon-ile">
      <EnTete
        graines={economie.solde}
        elan={economie.elan}
        onReglages={() => setReglagesOuverts(true)}
        onBoutique={() => setBoutiqueOuverte(true)}
      />

      {poseEnCours && (
        <div className="pose-bandeau" role="status">
          <span>{texteBandeau}</span>
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
            decors={decors}
            ambiance={ambianceActive}
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
      <Reglages ouvert={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} />
      <Boutique ouvert={boutiqueOuverte} onFermer={() => setBoutiqueOuverte(false)} />
    </div>
  )
}
