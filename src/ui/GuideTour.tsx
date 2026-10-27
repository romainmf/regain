import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useLocation, useNavigate } from 'react-router-dom'
import { lieuDe } from '../island/ac/lieux'
import { useJeu } from '../data/jeu'
import { getMeta } from '../data/db'
import { BrinAvatar } from './BrinAvatar'
import { actionsIle, useEtatIle } from './visite/pilote'
import { etapesVisibles, type Contexte, type Outils } from './visite/etapes'
import './intro.css'

interface Rect { left: number; top: number; width: number; height: number }

const MARGE = 8

/**
 * Visite guidée : Brin met en lumière les vrais éléments et attend que l'on
 * fasse le geste (entrer, parler, valider, sortir, tirer le tiroir), ou le
 * fait à notre place. Le voile laisse la cible touchable.
 */
export function GuideTour() {
  const { finirTour, aValider, agents } = useJeu()
  const location = useLocation()
  const navigate = useNavigate()
  const etat = useEtatIle()
  const prenom = useLiveQuery(() => getMeta<string>('prenom', ''), [], '')

  const [id, setId] = useState<string>('brin')
  const [repere, setRepere] = useState(aValider.length)
  const [repereAgents, setRepereAgents] = useState(agents.length)
  const [rect, setRect] = useState<Rect | null>(null)
  const [cadre, setCadre] = useState({ w: 0, h: 0 })
  const bulleRef = useRef<HTMLElement>(null)
  const [hauteurBulle, setHauteurBulle] = useState(210)
  const minuteur = useRef<number | null>(null)

  const dernierAgent = agents.length > repereAgents ? [...agents].sort((a, b) => b.createdAt - a.createdAt)[0] : null
  const contexte: Contexte = {
    etat, aValider: aValider.length, aValiderAuDepart: repere,
    route: location.pathname, nbAgents: agents.length, nbAgentsAuDepart: repereAgents,
    nouvelAgent: dernierAgent ? { nom: dernierAgent.nom, lieu: lieuDe(dernierAgent.domaine) } : null,
    prenom: prenom ?? '',
  }
  const etapes = etapesVisibles(contexte, id)
  const i = Math.max(0, etapes.findIndex((e) => e.id === id))
  const etape = etapes[i]
  const dernier = i === etapes.length - 1
  const faite = etape.accomplie ? etape.accomplie(contexte) : false

  const suivant = () => {
    if (dernier) { finirTour(); return }
    const prochaine = etapes[i + 1]
    setId(prochaine.id)
    setRepere(aValider.length)
    // Le repère d'agents se prend en entrant dans le formulaire et se garde jusqu'au retour, pour nommer le nouveau venu.
    if (prochaine.id !== 'retour') setRepereAgents(agents.length)
  }

  // Le geste est fait : on laisse l'animation se poser, puis on avance.
  // Si l'état vacille un instant, on annule et on attend qu'il se stabilise.
  useEffect(() => {
    if (faite) {
      if (minuteur.current == null) {
        minuteur.current = window.setTimeout(() => { minuteur.current = null; suivant() }, 700)
      }
    } else if (minuteur.current != null) {
      clearTimeout(minuteur.current)
      minuteur.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faite])
  useEffect(() => () => { if (minuteur.current != null) clearTimeout(minuteur.current) }, [])

  // La visite commence dehors : si l'on est dans un lieu, on en sort d'abord.
  useEffect(() => {
    const a = actionsIle()
    if (etat.vue === 'interieur' && !etat.occupe && a) a.sortir()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Où est la cible ? On remesure souvent : l'île bouge (zoom, personnage, tiroir).
  const mesurer = () => {
    const conteneur = document.querySelector('.telephone') ?? document.body
    const cr = conteneur.getBoundingClientRect()
    setCadre({ w: cr.width, h: cr.height })
    const hb = bulleRef.current?.offsetHeight
    if (hb && Math.abs(hb - hauteurBulle) > 1) setHauteurBulle(hb)
    const sel = typeof etape.cible === 'function' ? etape.cible(contexte) : etape.cible
    const cible = sel
      ? [...document.querySelectorAll(sel)].find((el) => {
        const r = el.getBoundingClientRect()
        return r.width > 0 && r.height > 0 && r.bottom > cr.top && r.top < cr.bottom
      })
      : null
    if (!cible) { setRect(null); return }
    const r = cible.getBoundingClientRect()
    const prochain = { left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height }
    setRect((ancien) =>
      ancien && Math.abs(ancien.left - prochain.left) < 1 && Math.abs(ancien.top - prochain.top) < 1
        && Math.abs(ancien.width - prochain.width) < 1 && Math.abs(ancien.height - prochain.height) < 1 ? ancien : prochain)
  }

  useLayoutEffect(() => {
    mesurer()
    const t = setInterval(mesurer, 160)
    window.addEventListener('resize', mesurer)
    window.addEventListener('scroll', mesurer, true)
    return () => {
      clearInterval(t)
      window.removeEventListener('resize', mesurer)
      window.removeEventListener('scroll', mesurer, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [etape.id, etat.lieuConseille, location.pathname])

  const trou = rect
    ? {
      left: Math.max(0, rect.left - MARGE), top: Math.max(0, rect.top - MARGE),
      width: Math.min(cadre.w, rect.width + MARGE * 2), height: Math.min(cadre.h, rect.height + MARGE * 2),
    }
    : null
  const interactif = !!etape.accomplie && !faite

  // La bulle sous la cible si la place le permet, sinon au-dessus ; au milieu sans cible.
  const enBas = !trou || trou.top + trou.height + hauteurBulle + 12 < cadre.h
  const top = trou
    ? (enBas ? trou.top + trou.height + 12 : Math.max(12, trou.top - hauteurBulle - 12))
    : Math.max(12, cadre.h / 2 - hauteurBulle / 2)

  const aide = etape.aide
  // Les gestes de l'île se lisent au moment du clic : l'écran Mon île peut s'être monté après nous.
  const outils = (): Outils => ({ ile: actionsIle(), naviguer: (vers) => navigate(vers), c: contexte })

  return (
    <div className="tour" data-etape={etape.id}>
      {etape.libre ? null : trou ? (
        <>
          {/* Quatre pans de voile autour de la cible : elle reste touchable. */}
          <div className="tour-pan" style={{ left: 0, top: 0, right: 0, height: trou.top }} />
          <div className="tour-pan" style={{ left: 0, top: trou.top + trou.height, right: 0, bottom: 0 }} />
          <div className="tour-pan" style={{ left: 0, top: trou.top, width: trou.left, height: trou.height }} />
          <div className="tour-pan" style={{ left: trou.left + trou.width, top: trou.top, right: 0, height: trou.height }} />
          <div className={`tour-trou${interactif ? ' tour-trou-actif' : ''}`} style={{ left: trou.left, top: trou.top, width: trou.width, height: trou.height }} />
          {!interactif && <div className="tour-bouchon" style={{ left: trou.left, top: trou.top, width: trou.width, height: trou.height }} />}
        </>
      ) : (
        <div className="tour-voile-plein" />
      )}

      {etape.libre ? (
        <section ref={bulleRef} className="tour-bulle tour-bulle-libre" role="dialog" aria-label={etape.titre}>
          <div className="tour-libre-ligne">
            <BrinAvatar taille={32} />
            <p><strong>{etape.titre}.</strong> {etape.texte(contexte)}</p>
          </div>
          <div className="tour-libre-liens">
            <button type="button" className="tour-sauter" onClick={finirTour}>Quitter la visite</button>
            <span aria-hidden>·</span>
            <button type="button" className="tour-sauter" onClick={suivant}>Passer cette étape</button>
          </div>
        </section>
      ) : (
      <section ref={bulleRef} className="tour-bulle" role="dialog" aria-label={etape.titre} style={{ top }}>
        <div className="tour-tete">
          <BrinAvatar taille={40} />
          <h3>{etape.titre}</h3>
        </div>
        <p>{etape.texte(contexte)}</p>
        {interactif && (
          <p className="tour-attente" aria-live="polite">
            {faite ? 'C’est fait !' : 'À toi : je t’attends.'}
            {!faite && !dernier && <button type="button" className="tour-sauter" onClick={suivant}>Sauter cette étape</button>}
          </p>
        )}
        <div className="tour-pied">
          <div className="tour-points" aria-hidden>
            {etapes.map((e, k) => (
              <span key={e.id} className={`onb-pt${k === i ? ' onb-pt-on' : ''}`} />
            ))}
          </div>
          <div className="tour-boutons">
            <button className="tour-passer" onClick={finirTour}>Passer</button>
            {interactif && aide ? (
              <button className="tour-aide" onClick={() => aide.faire(outils())} disabled={etat.occupe}>{aide.libelle}</button>
            ) : (
              <button className="tour-suivant" onClick={suivant}>{dernier ? 'C’est parti' : 'Suivant'}</button>
            )}
          </div>
        </div>
      </section>
      )}
    </div>
  )
}
