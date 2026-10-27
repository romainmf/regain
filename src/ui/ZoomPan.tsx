import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import './zoompan.css'

const MIN = 1
const MAX = 3

interface Vue { s: number; tx: number; ty: number }

/**
 * Zoom par pincement (ou molette) et déplacement au doigt sur l'île ;
 * double-tap pour recentrer. Les taps brefs continuent d'atteindre l'île.
 */
interface VueInitiale {
  /** Facteur de zoom de départ. */
  s: number
  /** Point du cadre (fractions 0-1) à garder au centre. */
  cx: number
  cy: number
}

export function ZoomPan({ children, initiale, commandes = false }: { children: ReactNode; initiale?: VueInitiale; /** Boutons + et − (ordinateur, accessibilité). */ commandes?: boolean }) {
  const cadre = useRef<HTMLDivElement>(null)
  const [vue, setVue] = useState<Vue>({ s: 1, tx: 0, ty: 0 })
  const initialisee = useRef(false)
  const pointeurs = useRef(new Map<number, { x: number; y: number }>())
  const geste = useRef<{ dist: number; cx: number; cy: number; vue: Vue } | null>(null)
  const dernierTap = useRef<{ t: number; x: number; y: number } | null>(null)

  const borner = useCallback((v: Vue): Vue => {
    const el = cadre.current
    if (!el) return v
    const s = Math.min(MAX, Math.max(MIN, v.s))
    const w = el.clientWidth, h = el.clientHeight
    return {
      s,
      tx: Math.min(0, Math.max(w - s * w, v.tx)),
      ty: Math.min(0, Math.max(h - s * h, v.ty)),
    }
  }, [])

  /** Zoome d'un facteur k autour du point (px, py) du cadre. */
  const zoomer = useCallback((base: Vue, k: number, px: number, py: number): Vue => {
    const s = Math.min(MAX, Math.max(MIN, base.s * k))
    const r = s / base.s
    return borner({ s, tx: px - (px - base.tx) * r, ty: py - (py - base.ty) * r })
  }, [borner])

  /** Vue de départ : zoom léger centré sur l'île. */
  const vueInitiale = useCallback((): Vue => {
    const el = cadre.current
    if (!el || !initiale) return { s: 1, tx: 0, ty: 0 }
    const w = el.clientWidth, h = el.clientHeight
    return borner({ s: initiale.s, tx: w / 2 - initiale.cx * w * initiale.s, ty: h / 2 - initiale.cy * h * initiale.s })
  }, [borner, initiale])

  // Double-tap : retour à la vue de départ ; si on y est déjà, vue d'ensemble.
  const recentrer = useCallback(() => {
    setVue((v) => {
      const init = vueInitiale()
      const dejaLa = Math.abs(v.s - init.s) < 0.02 && Math.abs(v.tx - init.tx) < 2 && Math.abs(v.ty - init.ty) < 2
      return dejaLa ? { s: 1, tx: 0, ty: 0 } : init
    })
  }, [vueInitiale])

  // Au premier affichage (une fois le cadre mesuré), on applique la vue de départ.
  useEffect(() => {
    if (initialisee.current || !initiale) return
    const el = cadre.current
    if (!el || !el.clientHeight) return
    initialisee.current = true
    setVue(vueInitiale())
  })

  const local = (e: { clientX: number; clientY: number }) => {
    const r = cadre.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }

  const onPointerDown = (e: React.PointerEvent) => {
    const p = local(e)
    pointeurs.current.set(e.pointerId, p)
    const pts = [...pointeurs.current.values()]
    if (pts.length === 2) {
      const [a, b] = pts
      geste.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, vue }
    } else if (pts.length === 1 && vue.s > 1) {
      geste.current = { dist: 0, cx: p.x, cy: p.y, vue }
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointeurs.current.has(e.pointerId)) return
    pointeurs.current.set(e.pointerId, local(e))
    const g = geste.current
    if (!g) return
    const pts = [...pointeurs.current.values()]
    if (pts.length >= 2) {
      const [a, b] = pts
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2
      const k = g.dist > 0 ? dist / g.dist : 1
      const z = zoomer(g.vue, k, g.cx, g.cy)
      setVue(borner({ s: z.s, tx: z.tx + (cx - g.cx), ty: z.ty + (cy - g.cy) }))
    } else if (pts.length === 1) {
      const p = pts[0]
      setVue(borner({ s: g.vue.s, tx: g.vue.tx + (p.x - g.cx), ty: g.vue.ty + (p.y - g.cy) }))
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    const depart = pointeurs.current.get(e.pointerId)
    pointeurs.current.delete(e.pointerId)
    const p = local(e)
    if (pointeurs.current.size === 0) {
      const bouge = depart ? Math.hypot(p.x - depart.x, p.y - depart.y) : 0
      // Double-tap bref et sans déplacement : on recentre.
      if (bouge < 10) {
        const d = dernierTap.current
        if (d && e.timeStamp - d.t < 320 && Math.hypot(p.x - d.x, p.y - d.y) < 24) {
          recentrer()
          dernierTap.current = null
        } else {
          dernierTap.current = { t: e.timeStamp, x: p.x, y: p.y }
        }
      }
      geste.current = null
    } else {
      // Un doigt reste : on repart d'un déplacement simple
      const rest = [...pointeurs.current.values()][0]
      geste.current = { dist: 0, cx: rest.x, cy: rest.y, vue }
    }
  }

  // Boutons + et − : zoom autour du centre du cadre.
  const zoomerCentre = (k: number) => {
    const el = cadre.current
    if (!el) return
    setVue((v) => zoomer(v, k, el.clientWidth / 2, el.clientHeight / 2))
  }

  // Molette (ordinateur) : zoom autour du curseur.
  useEffect(() => {
    const el = cadre.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const r = el.getBoundingClientRect()
      setVue((v) => zoomer(v, Math.exp(-e.deltaY * 0.002), e.clientX - r.left, e.clientY - r.top))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [zoomer])

  return (
    <div
      ref={cadre}
      className="zoompan"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div className="zoompan-contenu" style={{ transform: `translate(${vue.tx}px, ${vue.ty}px) scale(${vue.s})` }}>
        {children}
      </div>
      {Math.abs(vue.s - (initiale?.s ?? 1)) > 0.02 && (
        <button className="zoompan-recentrer" onClick={recentrer} aria-label="Recentrer l’île">
          ⤢
        </button>
      )}
      {commandes && (
        <div className="zoompan-commandes">
          <button onClick={() => zoomerCentre(1.4)} aria-label="Zoomer" disabled={vue.s >= MAX - 0.01}>+</button>
          <button onClick={() => zoomerCentre(1 / 1.4)} aria-label="Dézoomer" disabled={vue.s <= MIN + 0.01}>−</button>
        </div>
      )}
    </div>
  )
}
