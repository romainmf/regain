import { NavLink } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { COULEUR } from '../domain/couleurs'
import { niveauBatiment } from '../domain/progression'
import { DOMAINES, DOMAINE_LABEL, type Domaine } from '../domain/types'
import { getTemplate } from '../domain/catalog'
import { Robot } from '../island/Robot'
import { BrinAvatar } from './BrinAvatar'
import { Bouton } from './Boutons'
import './panneaux.css'

/** Élan de la semaine : une barre par domaine, les validations des 7 derniers jours. */
export function ElanSemaine() {
  const { economie } = useJeu()
  const max = Math.max(4, ...DOMAINES.map((d) => economie.validations7j[d]))
  return (
    <section className="panneau">
      <h2 className="panneau-titre">Élan de la semaine</h2>
      <p className="panneau-sous">Il grandit quand plusieurs pièces avancent ensemble.</p>
      <ul className="elan-barres">
        {DOMAINES.map((d) => {
          const v = economie.validations7j[d]
          return (
            <li key={d}>
              <span className={`elan-nom elan-${d}`}>{DOMAINE_LABEL[d]}</span>
              <span className="elan-piste" aria-label={`${DOMAINE_LABEL[d]} : ${v} validation${v > 1 ? 's' : ''}`}>
                <span className={`elan-barre elan-barre-${d}`} style={{ width: `${Math.round((v / max) * 100)}%` }} />
              </span>
              <span className="elan-val">{v}</span>
            </li>
          )
        })}
      </ul>
      <p className="elan-total">Élan <strong>×{economie.elan.toFixed(1).replace('.', ',')}</strong> · {economie.recoltes} récolte{economie.recoltes > 1 ? 's' : ''}</p>
    </section>
  )
}

const REGENERE = [
  { icone: '☀', titre: 'Soleil', texte: 'Le toit tourne au solaire', couleur: 'var(--soleil-teinte)' },
  { icone: '☂', titre: 'Pluie', texte: 'La cuve arrose la Serre', couleur: '#DCE9E4' },
  { icone: '✿', titre: 'Vivant', texte: 'Ruche, haie, mare', couleur: 'var(--planete-teinte)' },
  { icone: '◍', titre: 'Sol', texte: 'Le compost nourrit le potager', couleur: 'var(--boite-teinte)' },
]

/** Ce que le lieu régénère : quatre cycles, et les graines qui plantent pour de vrai. */
export function Regenere() {
  return (
    <section className="panneau">
      <h2 className="panneau-titre">Ce que ton lieu régénère</h2>
      <ul className="regenere">
        {REGENERE.map((r) => (
          <li key={r.titre} style={{ background: r.couleur }}>
            <span className="regenere-icone" aria-hidden>{r.icone}</span>
            <strong>{r.titre}</strong>
            <span>{r.texte}</span>
          </li>
        ))}
      </ul>
      <p className="regenere-note">Tes graines plantent aussi pour de vrai : une haie chez un partenaire tous les 1 000 graines. <span className="regenere-bientot">Bientôt</span></p>
    </section>
  )
}

/** L'équipe en bref : chaque agent, sa pièce, et s'il a quelque chose à faire valider. */
export function EquipeBref() {
  const { agents, agentsEnAttente, ouvrirFiche } = useJeu()
  const lieu: Record<Domaine, string> = { boite: 'L’Atelier', peau: 'Le Spa', planete: 'Le Jardin' }
  return (
    <section className="panneau">
      <div className="panneau-ligne">
        <h2 className="panneau-titre">L’équipe</h2>
        <span className="panneau-compte">{agents.length} agent{agents.length > 1 ? 's' : ''} · Toute l’île</span>
      </div>
      <ul className="equipe-bref">
        {agents.map((a) => {
          const t = a.templateId ? getTemplate(a.templateId) : undefined
          const attente = agentsEnAttente.has(a.id)
          return (
            <li key={a.id}>
              <button className="equipe-bref-item" onClick={() => ouvrirFiche(a.id)}>
                <svg width={34} height={34} viewBox="-20 -42 40 46" aria-hidden>
                  <ellipse cx={0} cy={0} rx={16} ry={6} fill={`var(--${a.domaine}-teinte)`} />
                  <Robot domaine={a.domaine} couleur={COULEUR[a.domaine]} />
                </svg>
                <span className="equipe-bref-txt">
                  <strong>{a.nom}</strong>
                  <span>{t?.posteNom ?? 'Son poste'} · {lieu[a.domaine]} · niv. {niveauBatiment(a.validations)}</span>
                </span>
                <span className={`equipe-bref-etat${attente ? ' equipe-bref-attente' : a.actif ? '' : ' equipe-bref-repos'}`}>
                  {attente ? 'À valider' : a.actif ? 'Veille' : 'En repos'}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      <NavLink to="/equipe" className="btn btn-contour equipe-bref-plus">+ Recruter ou créer un agent</NavLink>
    </section>
  )
}

/** Brin commente la situation du lieu et invite à aller voir. */
export function BrinCarte({ onOuvrir }: { onOuvrir: () => void }) {
  const { economie, aValider, agents } = useJeu()
  const texte = (() => {
    if (aValider.length > 0) return `${aValider.length} proposition${aValider.length > 1 ? 's' : ''} t’attend${aValider.length > 1 ? 'ent' : ''}. Tes agents ont préparé, à toi de valider, rien ne part sans toi.`
    const repos = DOMAINES.filter((d) => economie.repos[d])
    if (repos.length > 0) return `${DOMAINE_LABEL[repos[0]]} se repose depuis un moment. Une saisie suffit pour que sa pièce se réveille.`
    if (economie.meteo === 'soleil') return `Le soleil a couvert la journée de travail et la pluie remplit la cuve. Ton lieu rend plus qu’il ne prend.`
    return `Rien à valider : le lieu est calme. ${agents.length} agent${agents.length > 1 ? 's' : ''} veillent.`
  })()
  return (
    <div className="brin-carte">
      <BrinAvatar taille={44} />
      <p><strong>Brin</strong> · {texte}</p>
      <Bouton variante="contour" onClick={onOuvrir} style={{ flex: '0 0 auto' }}>Lui parler</Bouton>
    </div>
  )
}

/** Frise « une action, cinq graines » : le parcours d'une mission, de la saisie à la graine. */
export function FriseChaine() {
  const { propositions, saisies } = useJeu()
  const derniereMission = [...saisies].reverse().find((s) => s.kind === 'mission_terminee')
  if (!derniereMission) return null
  const depuis = derniereMission.date
  const validee = (type: string) => propositions.some((p) => p.type === type && p.statut === 'validee' && (p.resolvedAt ?? 0) >= depuis)
  const encaisse = saisies.some((s) => s.kind === 'encaissement' && s.date >= depuis)
  const etapes = [
    { nom: 'Mission', fait: true },
    { nom: 'Facture', fait: validee('facture') },
    { nom: 'Encaissé', fait: encaisse },
    { nom: 'Cotisations', fait: validee('coussin') },
    { nom: 'Empreinte', fait: validee('empreinte') },
    { nom: 'Graine', fait: validee('facture') },
  ]
  const client = derniereMission.data.client
  return (
    <section className="frise">
      <div className="panneau-ligne">
        <strong className="frise-titre">Mission{client ? ` · ${client}` : ''}</strong>
        <span className="panneau-compte">Une action, cinq graines</span>
      </div>
      <ol className="frise-etapes">
        {etapes.map((e, i) => (
          <li key={e.nom} className={e.fait ? 'frise-fait' : ''}>
            <span className="frise-point" aria-hidden>{e.fait ? '✓' : i + 1}</span>
            <span>{e.nom}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
