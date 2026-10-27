import { useNavigate } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { getTemplate } from '../domain/catalog'
import { COULEUR } from '../domain/couleurs'
import {
  AUTONOMIE_AIDE,
  AUTONOMIE_LABEL,
  DOMAINE_LABEL,
  type Autonomie,
} from '../domain/types'
import { niveauBatiment } from '../domain/progression'
import { Robot } from '../island/Robot'
import { Bouton } from './Boutons'
import { energieAgent, JaugeEnergie } from './JaugeEnergie'
import { Sheet } from './Sheet'
import './fiche.css'

/** Fiche détaillée et paramétrable d'un agent (ouverte depuis l'île ou l'équipe). */
export function FicheAgent() {
  const { ficheId, agents, fermerFiche, definirAutonomie, basculerActif, definirMissions, demanderVisite, nbParAgentSemaine } = useJeu()
  const navigate = useNavigate()
  const agent = ficheId ? agents.find((a) => a.id === ficheId) : undefined
  const t = agent?.templateId ? getTemplate(agent.templateId) : undefined

  if (!agent) return <Sheet ouvert={false} onFermer={fermerFiche} titre="">{null}</Sheet>

  const niveau = niveauBatiment(agent.validations)
  const autonomies: Autonomie[] = t?.autonomies ?? ['propose', 'prepare', 'relance']
  const optionsMissions = t?.propositions ?? agent.missions
  const toggleMission = (m: string) => {
    const set = new Set(agent.missions)
    if (set.has(m)) set.delete(m)
    else set.add(m)
    // On garde au moins une mission active.
    if (set.size > 0) definirMissions(agent.id, [...set])
  }

  return (
    <Sheet
      ouvert
      onFermer={fermerFiche}
      titre={agent.nom}
      pied={
        <Bouton
          variante="contour"
          domaine={agent.domaine}
          style={{ flex: 1 }}
          onClick={() => {
            fermerFiche()
            demanderVisite(agent.id)
            navigate('/')
          }}
        >
          Aller le voir sur l’île
        </Bouton>
      }
    >
      <div className="fiche">
        <div className="fiche-tete">
          <svg width={56} height={56} viewBox="-20 -42 40 46" aria-hidden>
            <ellipse cx={0} cy={0} rx={16} ry={6} fill={`var(--${agent.domaine}-teinte)`} />
            <Robot domaine={agent.domaine} couleur={COULEUR[agent.domaine]} />
          </svg>
          <div className="fiche-tete-txt">
            <span className={`pastille-${agent.domaine}`}>{DOMAINE_LABEL[agent.domaine]}</span>
            <p className="fiche-sous">{t?.posteNom ?? 'Son poste'} · niveau {niveau}</p>
          </div>
        </div>

        {t && <p className="fiche-mission">{t.mission}</p>}

        {/* Statut */}
        <section className="fiche-bloc">
          <div className="fiche-statut">
            <div>
              <h3>{agent.actif ? 'Actif' : 'En repos'}</h3>
              <p className="fiche-note">{agent.actif ? 'Il prépare des propositions.' : 'En pause : il ne prépare rien, ton île l’attend sans jamais s’abîmer.'}</p>
            </div>
            <button
              className={`bascule${agent.actif ? ' bascule-on' : ''}`}
              role="switch"
              aria-checked={agent.actif}
              aria-label={agent.actif ? 'Mettre en repos' : 'Réactiver'}
              onClick={() => basculerActif(agent.id)}
            >
              <span className="bascule-pion" />
            </button>
          </div>
          {agent.actif && (
            <div className="fiche-energie">
              <span>Énergie</span>
              <JaugeEnergie valeur={energieAgent(agent.validations, agent.actif)} domaine={agent.domaine} large />
            </div>
          )}
        </section>

        {/* Autonomie */}
        <section className="fiche-bloc">
          <h3 className="fiche-titre">Autonomie</h3>
          <div className="auto-choix" role="radiogroup" aria-label="Niveau d’autonomie">
            {autonomies.map((a) => (
              <button
                key={a}
                role="radio"
                aria-checked={agent.autonomie === a}
                className={`auto-option${agent.autonomie === a ? ' auto-on' : ''}`}
                onClick={() => definirAutonomie(agent.id, a)}
              >
                {AUTONOMIE_LABEL[a]}
              </button>
            ))}
          </div>
          <p className="fiche-note">{AUTONOMIE_AIDE[agent.autonomie]} Aucun mode n’agit sans ta validation.</p>
        </section>

        {/* Missions */}
        <section className="fiche-bloc">
          <h3 className="fiche-titre">Ses missions</h3>
          <ul className="missions">
            {optionsMissions.map((m) => {
              const active = agent.missions.includes(m)
              return (
                <li key={m}>
                  <label className="mission">
                    <input type="checkbox" checked={active} onChange={() => toggleMission(m)} />
                    <span className="mission-case" aria-hidden />
                    <span>{m}</span>
                  </label>
                </li>
              )
            })}
          </ul>
        </section>

        {/* Compteurs de la semaine */}
        <section className="fiche-bloc">
          <h3 className="fiche-titre">Cette semaine</h3>
          {(() => {
            const c = nbParAgentSemaine(agent.id)
            return (
              <div className="compteurs">
                <div><strong>{c.preparees}</strong><span>préparées</span></div>
                <div><strong>{c.validees}</strong><span>validées</span></div>
                <div><strong>{c.graines}</strong><span>graines</span></div>
              </div>
            )
          })()}
          <p className="fiche-note">Les graines sont comptées pour tout le domaine {DOMAINE_LABEL[agent.domaine]}.</p>
        </section>

        {/* Effet sur les 3 domaines */}
        {t && (
          <section className="fiche-bloc">
            <h3 className="fiche-titre">Son effet sur tes 3 domaines</h3>
            <p className="fiche-effet fiche-effet-direct">
              <span className={`point point-${agent.domaine}`} aria-hidden />
              <span><strong>{DOMAINE_LABEL[agent.domaine]}</strong> : son travail direct, posé sur ton île.</span>
            </p>
            <p className="fiche-effet">
              <span className={`point point-${t.relie.vers}`} aria-hidden />
              <span><strong>{DOMAINE_LABEL[t.relie.vers]}</strong> : {t.relie.produit}</span>
            </p>
            <p className="fiche-note">Prendre soin des trois ensemble fait grandir ton élan.</p>
          </section>
        )}
      </div>
    </Sheet>
  )
}
