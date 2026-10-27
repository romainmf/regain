import { useState } from 'react'
import { DOMAINE_LABEL } from '../domain/types'
import { useJeu } from '../data/jeu'
import { setMeta } from '../data/db'
import { BrinAvatar } from './BrinAvatar'
import { Bouton } from './Boutons'
import './intro.css'

type CarteId = 'bienvenue' | 'prenom' | 'domaines' | 'valider' | 'depart'
const ORDRE: CarteId[] = ['bienvenue', 'prenom', 'domaines', 'valider', 'depart']

/** Accueil au premier lancement : Brin se présente, demande ton prénom, pose le cadre. */
export function Onboarding() {
  const { finirOnboarding } = useJeu()
  const [i, setI] = useState(0)
  const [prenom, setPrenom] = useState('')
  const id = ORDRE[i]
  const dernier = i === ORDRE.length - 1
  const toi = prenom.trim()

  const suivant = () => {
    if (id === 'prenom' && toi) void setMeta('prenom', toi)
    setI(i + 1)
  }

  const corps = (() => {
    switch (id) {
      case 'bienvenue':
        return (
          <>
            <h2>Bienvenue sur Regain</h2>
            <div className="onb-corps">
              <p>Moi, c’est Brin, l’arbre au cœur de ton île.</p>
              <p>Regain est ton atelier d’agents : de petits assistants qui s’occupent des corvées de ton activité d’indépendant, chacun dans sa maison.</p>
            </div>
          </>
        )
      case 'prenom':
        return (
          <>
            <h2>Comment je t’appelle ?</h2>
            <div className="onb-corps">
              <p>Juste pour te saluer au passage. Tu peux aussi sauter cette étape.</p>
              <label htmlFor="onb-prenom" className="visuellement-cache">Ton prénom</label>
              <input
                id="onb-prenom"
                className="onb-champ"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') suivant() }}
                placeholder="Ton prénom"
                autoComplete="given-name"
                maxLength={30}
                autoFocus
              />
            </div>
          </>
        )
      case 'domaines':
        return (
          <>
            <h2>Trois domaines, une île</h2>
            <div className="onb-corps">
              <ul className="onb-domaines">
                <li><span className="point point-boite" /> <strong>{DOMAINE_LABEL.boite}</strong> : ton activité, tes factures, ta trésorerie. C’est l’Atelier.</li>
                <li><span className="point point-peau" /> <strong>{DOMAINE_LABEL.peau}</strong> : ton rythme, ton énergie, ton équilibre. C’est le Spa.</li>
                <li><span className="point point-planete" /> <strong>{DOMAINE_LABEL.planete}</strong> : ton empreinte, ta sobriété. C’est le Jardin.</li>
              </ul>
              <p>En prendre soin des trois en même temps fait grandir toute ton activité.</p>
            </div>
          </>
        )
      case 'valider':
        return (
          <>
            <h2>Ils préparent, tu valides</h2>
            <div className="onb-corps">
              <p>Tes agents préparent les propositions ; <strong>rien ne part jamais sans ton accord</strong>.</p>
              <p>Ton île reste sur ton appareil. En bêta, rien n’est envoyé du tout.</p>
            </div>
          </>
        )
      case 'depart':
        return (
          <>
            <h2>{toi ? `On y va, ${toi} ?` : 'On y va ?'}</h2>
            <div className="onb-corps">
              <p>Je te fais visiter l’île en une minute : on entre dans l’Atelier, on valide une première proposition, on ouvre le tableau de bord. Ou je te laisse explorer.</p>
            </div>
          </>
        )
    }
  })()

  return (
    <div className="intro-voile">
      <section className="onb-carte" role="dialog" aria-modal="true" aria-label="Bienvenue">
        <button className="onb-passer" onClick={() => finirOnboarding(false)}>Passer</button>
        <div className="onb-avatar"><BrinAvatar taille={84} /></div>
        {corps}

        <div className="onb-points" aria-hidden>
          {ORDRE.map((k) => (
            <span key={k} className={`onb-pt${k === id ? ' onb-pt-on' : ''}`} />
          ))}
        </div>

        {dernier ? (
          <div className="onb-actions">
            <Bouton onClick={() => finirOnboarding(true)} style={{ flex: 1 }}>Visiter l’île</Bouton>
            <Bouton variante="doux" onClick={() => finirOnboarding(false)}>Explorer seul</Bouton>
          </div>
        ) : (
          <div className="onb-actions">
            <Bouton onClick={suivant} style={{ flex: 1 }}>{id === 'prenom' && !toi ? 'Plus tard' : 'Suivant'}</Bouton>
          </div>
        )}
      </section>
    </div>
  )
}
