import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { CATALOGUE } from '../domain/catalog'
import {
  AUTONOMIE_LABEL,
  DOMAINES,
  DOMAINE_LABEL,
  OBJECTIF_LABEL,
  type AgentTemplate,
  type Objectif,
} from '../domain/types'
import { niveauBatiment } from '../domain/progression'
import { COULEUR } from '../domain/couleurs'
import { Robot } from '../island/Robot'
import { energieAgent, JaugeEnergie } from '../ui/JaugeEnergie'
import { PosteIcone } from '../ui/PosteIcone'
import { Bouton } from '../ui/Boutons'
import './agents.css'

type Onglet = 'equipe' | 'catalogue'

export function Agents() {
  const { agents, templatesRecrutes, recruter } = useJeu()
  const navigate = useNavigate()
  const [onglet, setOnglet] = useState<Onglet>('catalogue')
  const [filtre, setFiltre] = useState<Objectif | null>(null)

  const recruterEtPoser = async (t: AgentTemplate) => {
    await recruter(t)
    navigate('/')
  }

  const catalogueFiltre = useMemo(
    () => CATALOGUE.filter((t) => !filtre || t.objectifs.includes(filtre)),
    [filtre],
  )

  return (
    <div className="ecran agents-ecran">
      <header className="agents-tete">
        <h1>Agents</h1>
        <div className="segment" role="tablist" aria-label="Vue des agents">
          <button role="tab" aria-selected={onglet === 'catalogue'} className={onglet === 'catalogue' ? 'actif' : ''} onClick={() => setOnglet('catalogue')}>
            Catalogue
          </button>
          <button role="tab" aria-selected={onglet === 'equipe'} className={onglet === 'equipe' ? 'actif' : ''} onClick={() => setOnglet('equipe')}>
            Mon équipe {agents.length > 0 && <span className="segment-nombre">{agents.length}</span>}
          </button>
        </div>
      </header>

      {onglet === 'catalogue' ? (
        <>
          <div className="filtres" role="group" aria-label="Filtrer par objectif">
            <button className={`puce${!filtre ? ' puce-on' : ''}`} onClick={() => setFiltre(null)}>Tout</button>
            {(Object.keys(OBJECTIF_LABEL) as Objectif[]).map((o) => (
              <button key={o} className={`puce${filtre === o ? ' puce-on' : ''}`} onClick={() => setFiltre(filtre === o ? null : o)}>
                {OBJECTIF_LABEL[o]}
              </button>
            ))}
          </div>

          {DOMAINES.map((d) => {
            const liste = catalogueFiltre.filter((t) => t.domaine === d)
            if (liste.length === 0) return null
            return (
              <section key={d} className="cat-section">
                <h2 className={`cat-titre cat-${d}`}>{DOMAINE_LABEL[d]}</h2>
                <div className="cartes">
                  {liste.map((t) => (
                    <CarteCatalogue key={t.id} t={t} recrute={templatesRecrutes.has(t.id)} onRecruter={() => recruterEtPoser(t)} />
                  ))}
                </div>
              </section>
            )
          })}
        </>
      ) : (
        <Equipe />
      )}
    </div>
  )
}

function CarteCatalogue({ t, recrute, onRecruter }: { t: AgentTemplate; recrute: boolean; onRecruter: () => void }) {
  return (
    <article className="carte">
      <div className="carte-haut">
        <PosteIcone id={t.poste} domaine={t.domaine} />
        <div className="carte-titre">
          <h3>{t.nom}</h3>
          <p className="carte-mission">{t.mission}</p>
        </div>
      </div>
      <ul className="carte-prepare">
        {t.propositions.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
      <div className="carte-meta">
        <span className="carte-bat">{t.posteNom}</span>
        <span className="carte-autos">{t.autonomies.map((a) => AUTONOMIE_LABEL[a]).join(' · ')}</span>
      </div>
      <p className="carte-relie">Relié à <strong>{DOMAINE_LABEL[t.relie.vers]}</strong> : {t.relie.produit}</p>
      <Bouton domaine={t.domaine} disabled={recrute} onClick={onRecruter} style={{ width: '100%' }}>
        {recrute ? 'Déjà dans ton équipe ✓' : 'Recruter'}
      </Bouton>
    </article>
  )
}

function Equipe() {
  const { agents, ouvrirFiche } = useJeu()
  const navigate = useNavigate()
  if (agents.length === 0) {
    return <p className="equipe-vide">Ton équipe est vide. Recrute un agent dans le catalogue.</p>
  }
  const parDomaine = DOMAINES.map((d) => ({ d, liste: agents.filter((a) => a.domaine === d) }))
  return (
    <div className="equipe">
      {parDomaine.map(({ d, liste }) =>
        liste.length === 0 ? null : (
          <section key={d} className="cat-section">
            <h2 className={`cat-titre cat-${d}`}>{DOMAINE_LABEL[d]}</h2>
            <ul className="equipe-liste">
              {liste.map((a) => (
                <li key={a.id}>
                  <button className="equipe-item" onClick={() => ouvrirFiche(a.id)}>
                    <svg width={40} height={40} viewBox="-20 -42 40 46" aria-hidden className="equipe-avatar">
                      <ellipse cx={0} cy={0} rx={16} ry={6} fill={`var(--${d}-teinte)`} />
                      <Robot domaine={d} couleur={COULEUR[d]} />
                    </svg>
                    <div className="equipe-txt">
                      <strong>{a.nom}</strong>
                      <span className="equipe-sous">niveau {niveauBatiment(a.validations)} · {AUTONOMIE_LABEL[a.autonomie]}</span>
                      <JaugeEnergie valeur={energieAgent(a.validations, a.actif)} domaine={d} />
                    </div>
                    <span className={`etat${a.actif ? ' etat-actif' : ''}`}>{a.actif ? 'Actif' : 'En repos'}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ),
      )}
      <Bouton variante="contour" onClick={() => navigate('/')} style={{ width: '100%', marginTop: 8 }}>
        Voir mon île
      </Bouton>
    </div>
  )
}
