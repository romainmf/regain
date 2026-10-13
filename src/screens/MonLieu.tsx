import { useCallback, useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import type { SaisieKind } from '../domain/propositions'
import { DOMAINES, DOMAINE_LABEL } from '../domain/types'
import { Island } from '../island/Island'
import { BrinChat } from '../ui/BrinChat'
import { CarteProposition } from '../ui/CarteProposition'
import { EnTete } from '../ui/EnTete'
import { FileValidation } from '../ui/FileValidation'
import { BrinCarte, ElanSemaine, EquipeBref, FriseChaine, Regenere } from '../ui/Panneaux'
import { Reglages } from '../ui/Reglages'
import { SaisieRapide } from '../ui/SaisieRapide'
import { ZoomPan } from '../ui/ZoomPan'
import './monlieu.css'

const CLE_BRIN = 'regain.brin.vu'

function dejaVu(): boolean {
  try {
    return localStorage.getItem(CLE_BRIN) === '1'
  } catch {
    return false
  }
}

/** Mon lieu : le plan au centre, Aujourd'hui, l'élan, l'équipe. Trois colonnes sur grand écran. */
export function MonLieu() {
  const {
    pret, placements, agents, poseEnCours, poser, demarrerDeplacement, annulerPose, ouvrirFiche,
    economie, aValider, agentsEnAttente, derniereChaine,
    tuiles, decors, ambianceActive, murs, sols,
  } = useJeu()
  const [brinOuvert, setBrinOuvert] = useState(false)
  const [teaser, setTeaser] = useState(() => !dejaVu())
  const [saisie, setSaisie] = useState<{ ouverte: boolean; kind?: SaisieKind }>({ ouverte: false })
  const [reglagesOuverts, setReglagesOuverts] = useState(false)

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

  // Le plan épouse son cadre (ratio mesuré) ; les commandes sont autour, pas dessus.
  const scene = useRef<HTMLDivElement>(null)
  const [ratio, setRatio] = useState<number | undefined>(undefined)
  useEffect(() => {
    const el = scene.current
    if (!el) return
    const mesurer = () => {
      if (el.clientWidth && el.clientHeight) setRatio(el.clientWidth / el.clientHeight)
    }
    mesurer()
    const ro = new ResizeObserver(mesurer)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const agentPose = poseEnCours?.agentId ? agents.find((a) => a.id === poseEnCours.agentId) : undefined
  const texteBandeau = poseEnCours
    ? poseEnCours.kind === 'decor'
      ? 'Pose ton décor : touche une tuile surlignée.'
      : `${poseEnCours.mode === 'pose' ? 'Installe' : 'Déplace'} ${agentPose ? `le poste de ${agentPose.nom}` : 'le poste'} : touche une tuile surlignée.`
    : ''

  const apercu = aValider.slice(0, 3)

  return (
    <div className="ecran mon-lieu">
      <EnTete
        graines={economie.solde}
        meteo={economie.meteo}
        onSaisie={(kind) => setSaisie({ ouverte: true, kind })}
        onBrin={ouvrirBrin}
        onReglages={() => setReglagesOuverts(true)}
      />

      <div className="lieu-grille">
        {/* Colonne gauche (ordinateur) : tout le fil Aujourd'hui */}
        <aside className="lieu-col lieu-col-gauche">
          <section className="panneau">
            <div className="panneau-ligne">
              <h2 className="panneau-titre">Aujourd’hui</h2>
              <span className="panneau-compte">{aValider.length} à valider · Tout le lieu</span>
            </div>
            <FileValidation />
          </section>
        </aside>

        {/* Colonne centrale : le plan, Brin, la frise */}
        <div className="lieu-col lieu-col-centre">
          {poseEnCours && (
            <div className="pose-bandeau" role="status">
              <span>{texteBandeau}</span>
              <button className="pose-annuler" onClick={annulerPose}>Annuler</button>
            </div>
          )}
          <div className="lieu-plan">
            <div className="lieu-scene" ref={scene}>
              <ZoomPan initiale={{ s: 1.12, cx: 0.5, cy: 0.5 }}>
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
                  lieux
                  murs={murs}
                  sols={sols}
                  ratio={ratio}
                />
              </ZoomPan>
            </div>
            <ul className="lieu-legende" aria-label="Pièces du lieu">
              {DOMAINES.map((d) => (
                <li key={d}><span className={`lieu-point lieu-point-${d}`} aria-hidden /> {DOMAINE_LABEL[d]}</li>
              ))}
              <li><span className="lieu-point lieu-point-brin" aria-hidden /> Brin</li>
            </ul>
          </div>
          <BrinCarte onOuvrir={ouvrirBrin} />
          <FriseChaine />

          {/* Mobile : aperçu d'Aujourd'hui sous le plan */}
          <section className="panneau lieu-apercu">
            <div className="panneau-ligne">
              <h2 className="panneau-titre">Aujourd’hui</h2>
              <NavLink to="/aujourdhui" className="lieu-lien">{aValider.length} à valider · Tout voir</NavLink>
            </div>
            {apercu.length === 0 ? (
              <p className="val-vide">Rien à valider. Dis à tes agents ce qui s’est passé.</p>
            ) : (
              <ul className="val-liste">
                {apercu.map((p) => (
                  <li key={p.id}><CarteProposition p={p} compacte /></li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Colonne droite (ordinateur) : élan, régénération, équipe */}
        <aside className="lieu-col lieu-col-droite">
          <ElanSemaine />
          <Regenere />
          <EquipeBref />
        </aside>
      </div>

      {!pret && <p className="mon-lieu-chargement">Ton lieu se réveille…</p>}

      <BrinChat ouvert={brinOuvert} onFermer={fermerBrin} />
      <SaisieRapide ouvert={saisie.ouverte} kindInitial={saisie.kind} onFermer={() => setSaisie({ ouverte: false })} />
      <Reglages ouvert={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} />
    </div>
  )
}
