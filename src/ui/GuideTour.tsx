import { useEffect, useLayoutEffect, useState } from 'react'
import { useJeu } from '../data/jeu'
import { BrinAvatar } from './BrinAvatar'
import './intro.css'

interface Etape {
  selector: string
  titre: string
  texte: string
}

const ETAPES: Etape[] = [
  { selector: '.coeur-brin', titre: 'Voici moi, Brin', texte: 'L’arbre au cœur de ton île. Touche-moi quand tu veux me poser une question.' },
  { selector: '.batiment', titre: 'Tes agents', texte: 'Chaque agent a son bâtiment et son petit robot. Touche-le pour le régler, appui long pour le déplacer.' },
  { selector: '.elan-badge', titre: 'Ton élan', texte: 'Il grandit quand tes trois domaines avancent ensemble, et multiplie les graines que tu gagnes.' },
  { selector: '.action-saisir', titre: 'Dis-leur ce qui arrive', texte: 'Une mission finie, une grosse journée, un trajet… tes agents préparent aussitôt la suite.' },
  { selector: '.action-valider', titre: 'À valider', texte: 'Ici, tu valides ce qu’ils ont préparé. Chaque validation te donne des graines et fait pousser l’île.' },
  { selector: '.nav-plus', titre: 'Crée tes agents', texte: 'Ce bouton te laisse créer ton propre agent, en moins d’une minute.' },
]

interface Rect { left: number; top: number; width: number; height: number }

/** Visite guidée : Brin met en lumière les vrais éléments, un par un. */
export function GuideTour() {
  const { finirTour } = useJeu()
  const [i, setI] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const [cadre, setCadre] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  const etape = ETAPES[i]
  const dernier = i === ETAPES.length - 1

  const mesurer = () => {
    const conteneur = document.querySelector('.telephone') ?? document.body
    const cr = conteneur.getBoundingClientRect()
    setCadre({ w: cr.width, h: cr.height })
    const cible = document.querySelector(etape.selector)
    if (!cible) {
      setRect(null)
      return
    }
    const r = cible.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) {
      setRect(null)
      return
    }
    setRect({ left: r.left - cr.left, top: r.top - cr.top, width: r.width, height: r.height })
  }

  useLayoutEffect(() => {
    mesurer()
    const t = setTimeout(mesurer, 120) // laisse les animations se poser
    return () => clearTimeout(t)
  }, [i])

  useEffect(() => {
    window.addEventListener('resize', mesurer)
    window.addEventListener('scroll', mesurer, true)
    return () => {
      window.removeEventListener('resize', mesurer)
      window.removeEventListener('scroll', mesurer, true)
    }
  }, [i])

  const pad = 8
  const trou = rect
    ? { left: rect.left - pad, top: rect.top - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 }
    : null

  // Bulle sous la cible si la place le permet, sinon au-dessus.
  const bulleEnBas = !trou || trou.top + trou.height + 190 < cadre.h
  const bulleTop = trou ? (bulleEnBas ? trou.top + trou.height + 12 : Math.max(12, trou.top - 196)) : cadre.h / 2 - 90

  return (
    <div className="tour">
      {/* Spotlight : un trou clair, tout le reste assombri */}
      {trou ? (
        <div
          className="tour-trou"
          style={{ left: trou.left, top: trou.top, width: trou.width, height: trou.height }}
        />
      ) : (
        <div className="tour-voile-plein" />
      )}

      <section
        className="tour-bulle"
        role="dialog"
        aria-modal="true"
        aria-label={etape.titre}
        style={{ top: bulleTop }}
      >
        <div className="tour-tete">
          <BrinAvatar taille={40} />
          <h3>{etape.titre}</h3>
        </div>
        <p>{etape.texte}</p>
        <div className="tour-pied">
          <div className="tour-points" aria-hidden>
            {ETAPES.map((_, k) => (
              <span key={k} className={`onb-pt${k === i ? ' onb-pt-on' : ''}`} />
            ))}
          </div>
          <div className="tour-boutons">
            <button className="tour-passer" onClick={finirTour}>Passer</button>
            <button className="tour-suivant" onClick={() => (dernier ? finirTour() : setI(i + 1))}>
              {dernier ? 'C’est parti' : 'Suivant'}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
