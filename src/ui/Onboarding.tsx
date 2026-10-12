import { useState } from 'react'
import { DOMAINE_LABEL } from '../domain/types'
import { useJeu } from '../data/jeu'
import { BrinAvatar } from './BrinAvatar'
import { Bouton } from './Boutons'
import './intro.css'

interface Carte {
  titre: string
  lignes: React.ReactNode
}

const CARTES: Carte[] = [
  {
    titre: 'Bienvenue sur Regain',
    lignes: (
      <>
        <p>Moi, c’est Brin, l’arbre au cœur de ton île. Je vais te faire le tour.</p>
        <p>Regain est ton atelier d’agents : de petits assistants qui s’occupent des corvées de ton activité d’indépendant.</p>
      </>
    ),
  },
  {
    titre: 'Trois domaines, une île',
    lignes: (
      <>
        <ul className="onb-domaines">
          <li><span className="point point-boite" /> <strong>{DOMAINE_LABEL.boite}</strong> : ton activité, tes factures, ta trésorerie.</li>
          <li><span className="point point-peau" /> <strong>{DOMAINE_LABEL.peau}</strong> : ton rythme, ton énergie, ton équilibre.</li>
          <li><span className="point point-planete" /> <strong>{DOMAINE_LABEL.planete}</strong> : ton empreinte, ta sobriété.</li>
        </ul>
        <p>En prendre soin des trois en même temps fait grandir toute ton activité.</p>
      </>
    ),
  },
  {
    titre: 'Ils préparent, tu valides',
    lignes: (
      <>
        <p>Tes agents préparent les propositions ; <strong>rien ne part jamais sans ton accord</strong>.</p>
        <p>En bêta, rien n’est envoyé du tout, et tout reste sur ton téléphone : pas de compte, ça marche même hors ligne.</p>
      </>
    ),
  },
  {
    titre: 'On y va ?',
    lignes: <p>Je peux te montrer ton île en une minute, ou te laisser explorer. Comme tu préfères.</p>,
  },
]

/** Accueil au premier lancement : quelques cartes présentées par Brin. */
export function Onboarding() {
  const { finirOnboarding } = useJeu()
  const [i, setI] = useState(0)
  const dernier = i === CARTES.length - 1
  const carte = CARTES[i]

  return (
    <div className="intro-voile">
      <section className="onb-carte" role="dialog" aria-modal="true" aria-label="Bienvenue">
        <button className="onb-passer" onClick={() => finirOnboarding(false)}>Passer</button>
        <div className="onb-avatar"><BrinAvatar taille={84} /></div>
        <h2>{carte.titre}</h2>
        <div className="onb-corps">{carte.lignes}</div>

        <div className="onb-points" aria-hidden>
          {CARTES.map((_, k) => (
            <span key={k} className={`onb-pt${k === i ? ' onb-pt-on' : ''}`} />
          ))}
        </div>

        {dernier ? (
          <div className="onb-actions">
            <Bouton onClick={() => finirOnboarding(true)} style={{ flex: 1 }}>Visiter l’île</Bouton>
            <Bouton variante="doux" onClick={() => finirOnboarding(false)}>Explorer seul</Bouton>
          </div>
        ) : (
          <div className="onb-actions">
            <Bouton onClick={() => setI(i + 1)} style={{ flex: 1 }}>Suivant</Bouton>
          </div>
        )}
      </section>
    </div>
  )
}
