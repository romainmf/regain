import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { COULEUR } from '../domain/couleurs'
import {
  AUTONOMIE_AIDE,
  AUTONOMIE_LABEL,
  DOMAINES,
  DOMAINE_LABEL,
  type Autonomie,
  type Domaine,
} from '../domain/types'
import { BATIMENT_PERSO, missionsDuDomaine, nomSuggerePourMissions } from '../domain/missions'
import { Poste } from '../island/Poste'
import { Bouton } from '../ui/Boutons'
import './creer.css'

const AUTONOMIES: Autonomie[] = ['propose', 'prepare', 'relance']

export function CreerAgent() {
  const { creerAgent } = useJeu()
  const navigate = useNavigate()

  const [domaine, setDomaine] = useState<Domaine | null>(null)
  const [nom, setNom] = useState('')
  const [missions, setMissions] = useState<string[]>([])
  const [autonomie, setAutonomie] = useState<Autonomie>('prepare')
  const [envoi, setEnvoi] = useState(false)

  const options = useMemo(() => (domaine ? missionsDuDomaine(domaine) : []), [domaine])

  const choisirDomaine = (d: Domaine) => {
    // On change de domaine : les missions ne valent plus, et le nom suivra
    // la prochaine mission choisie (sauf si l'utilisateur l'a déjà écrit).
    if (d !== domaine) setMissions([])
    setDomaine(d)
  }
  const toggleMission = (label: string) => {
    if (!domaine) return
    const nouvelles = missions.includes(label) ? missions.filter((x) => x !== label) : [...missions, label]
    setMissions(nouvelles)
    // Le nom proposé suit l'action de l'agent, tant que l'utilisateur n'a rien écrit.
    if (!nom.trim() && nouvelles.length > 0) setNom(nomSuggerePourMissions(domaine, nouvelles))
  }

  const pret = !!domaine && nom.trim().length > 0 && missions.length > 0

  const creer = async () => {
    if (!domaine || !pret) return
    setEnvoi(true)
    const { batiment, signeDeVie } = BATIMENT_PERSO[domaine]
    await creerAgent({
      nom: nom.trim(),
      domaine,
      missions,
      autonomie,
      actif: true,
      validations: 0,
      batiment,
      signeDeVie,
    })
    navigate('/')
  }

  return (
    <div className="ecran creer">
      <header className="creer-tete">
        <h1>Créer un agent</h1>
        <p>Quatre étapes, moins d’une minute.</p>
      </header>

      {/* 1. Domaine */}
      <section className="creer-etape">
        <h2><span className="creer-num">1</span> Son domaine</h2>
        <div className="creer-domaines">
          {DOMAINES.map((d) => (
            <button
              key={d}
              className={`creer-dom creer-dom-${d}${domaine === d ? ' creer-dom-on' : ''}`}
              aria-pressed={domaine === d}
              onClick={() => choisirDomaine(d)}
            >
              <svg width={48} height={44} viewBox="-28 -44 56 52" aria-hidden>
                <ellipse cx={0} cy={0} rx={18} ry={8} fill={`var(--${d}-teinte)`} />
                <Poste id="generique" domaine={d} couleur={COULEUR[d]} niveau={1} />
              </svg>
              {DOMAINE_LABEL[d]}
            </button>
          ))}
        </div>
      </section>

      {/* 2. Nom */}
      <section className={`creer-etape${domaine ? '' : ' creer-off'}`} aria-disabled={!domaine}>
        <h2><span className="creer-num">2</span> Son nom</h2>
        <div className="creer-nom">
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Un petit nom…"
            maxLength={24}
            disabled={!domaine}
          />
          <button className="creer-suggere" onClick={() => domaine && setNom(nomSuggerePourMissions(domaine, missions, nom))} disabled={!domaine}>
            Suggérer
          </button>
        </div>
        <p className="creer-indice creer-sous-nom">
          {missions.length > 0
            ? 'Suggestion inspirée de ses missions : à toi de la garder ou de la changer.'
            : 'Choisis ses missions : le nom proposé suivra ce qu’il fait. Tu peux aussi écrire le tien.'}
        </p>
      </section>

      {/* 3. Missions */}
      <section className={`creer-etape${domaine ? '' : ' creer-off'}`} aria-disabled={!domaine}>
        <h2><span className="creer-num">3</span> Ses missions</h2>
        {domaine ? (
          <ul className="creer-missions">
            {options.map((o) => {
              const on = missions.includes(o.label)
              return (
                <li key={o.id}>
                  <label className="mission">
                    <input type="checkbox" checked={on} onChange={() => toggleMission(o.label)} />
                    <span className="mission-case" aria-hidden />
                    <span>{o.label}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        ) : (
          <p className="creer-indice">Choisis d’abord un domaine.</p>
        )}
      </section>

      {/* 4. Autonomie */}
      <section className={`creer-etape${domaine ? '' : ' creer-off'}`} aria-disabled={!domaine}>
        <h2><span className="creer-num">4</span> Son autonomie</h2>
        <div className="auto-choix" role="radiogroup" aria-label="Autonomie">
          {AUTONOMIES.map((a) => (
            <button
              key={a}
              role="radio"
              aria-checked={autonomie === a}
              className={`auto-option${autonomie === a ? ' auto-on' : ''}`}
              onClick={() => setAutonomie(a)}
              disabled={!domaine}
            >
              {AUTONOMIE_LABEL[a]}
            </button>
          ))}
        </div>
        <p className="fiche-note">{AUTONOMIE_AIDE[autonomie]} Aucun mode n’agit sans ta validation.</p>
      </section>

      <div className="creer-pied">
        <Bouton domaine={domaine ?? undefined} disabled={!pret || envoi} onClick={creer} style={{ width: '100%' }}>
          {envoi ? 'Création…' : 'Créer et installer son poste'}
        </Bouton>
      </div>
    </div>
  )
}
