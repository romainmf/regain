import { useRef, type ReactNode } from 'react'
import './tiroir.css'

/** Le tiroir du tableau de bord : replié sur une bande, à mi-hauteur, ou déplié. */
export type PositionTiroir = 'replie' | 'moitie' | 'plein'
export const HAUTEUR_TIROIR: Record<PositionTiroir, string> = { replie: '118px', moitie: '50%', plein: '86%' }
const SUIVANT: Record<PositionTiroir, PositionTiroir> = { replie: 'moitie', moitie: 'plein', plein: 'replie' }

interface Props {
  position: PositionTiroir
  onPosition: (p: PositionTiroir) => void
  /** Hauteur en pixels pendant un glissement, sinon null. */
  glisse: number | null
  onGlisse: (h: number | null) => void
  /** Le cadre dans lequel le tiroir monte (pour aimanter au relâcher). */
  cadre: React.RefObject<HTMLElement | null>
  /** Toujours visible, même replié. */
  bande: ReactNode
  children: ReactNode
  label?: string
}

/**
 * Un tiroir qui monte par-dessus la scène : on touche sa poignée pour passer
 * à la position suivante, ou on la glisse pour l'amener où l'on veut.
 */
export function Tiroir({ position, onPosition, glisse, onGlisse, cadre, bande, children, label = 'Tableau de bord' }: Props) {
  const geste = useRef<{ y0: number; h0: number; bouge: boolean } | null>(null)
  const lacher = (h: number) => {
    const H = cadre.current?.clientHeight ?? 800
    const cibles: [PositionTiroir, number][] = [['replie', 118], ['moitie', H * 0.5], ['plein', H * 0.86]]
    cibles.sort((a, b) => Math.abs(a[1] - h) - Math.abs(b[1] - h))
    onPosition(cibles[0][0])
  }
  return (
    <section className={`tiroir tiroir-${position}${glisse != null ? ' tiroir-glisse' : ''}`} aria-label={label}>
      <button
        className="tiroir-poignee"
        aria-label={position === 'plein' ? `Replier : ${label}` : `Déplier : ${label}`}
        onPointerDown={(e) => {
          const el = e.currentTarget.parentElement
          if (!el) return
          geste.current = { y0: e.clientY, h0: el.getBoundingClientRect().height, bouge: false }
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => {
          const g = geste.current
          if (!g) return
          const dy = g.y0 - e.clientY
          if (Math.abs(dy) > 6) g.bouge = true
          if (g.bouge) onGlisse(Math.max(60, g.h0 + dy))
        }}
        onPointerUp={(e) => {
          const g = geste.current
          geste.current = null
          if (!g) return
          if (g.bouge) lacher(Math.max(60, g.h0 + (g.y0 - e.clientY)))
          else onPosition(SUIVANT[position])
          onGlisse(null)
        }}
        onPointerCancel={() => { geste.current = null; onGlisse(null) }}
      >
        <span className="tiroir-barre" aria-hidden />
      </button>
      <div className="tiroir-bande">{bande}</div>
      <div className="tiroir-contenu">{children}</div>
    </section>
  )
}
