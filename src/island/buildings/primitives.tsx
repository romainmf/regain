import { TH, TW } from '../iso'

/** Éclaircit (+) ou assombrit (−) une couleur hexadécimale. */
export function nuance(hex: string, k: number): string {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) =>
    Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k)),
  )
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('')
}

export const BOIS = '#A57A52'
export const CREME = '#F4EAD5'
export const VERRE = '#CFE6E0'
export const FEUILLE = '#5E9B62'
export const PIERRE = '#C9C1AE'

interface BoxProps {
  /** Décalage dans la tuile, en fraction (−0,5 à 0,5). */
  dx?: number
  dy?: number
  /** Demi-emprise en fraction de tuile. */
  w: number
  d?: number
  h: number
  z?: number
  couleur: string
  haut?: string
}

/** Pavé isométrique posé au sol, centré sur la tuile. */
export function Pave({ dx = 0, dy = 0, w, d = w, h, z = 0, couleur, haut }: BoxProps) {
  const ox = (dx - dy) * TW
  const oy = (dx + dy) * TH - z
  // Emprise : demi-axe x = w, demi-axe y = d (0,5 = bord de tuile).
  const P = (fx: number, fy: number, fz: number) =>
    `${ox + (fx - fy) * TW},${oy + (fx + fy) * TH - fz}`
  const b = P(w, -d, 0), c = P(w, d, 0), e = P(-w, d, 0)
  const a2 = P(-w, -d, h), b2 = P(w, -d, h), c2 = P(w, d, h), e2 = P(-w, d, h)
  return (
    <g>
      <polygon points={`${e} ${c} ${c2} ${e2}`} fill={nuance(couleur, -0.12)} />
      <polygon points={`${c} ${b} ${b2} ${c2}`} fill={nuance(couleur, -0.24)} />
      <polygon points={`${a2} ${b2} ${c2} ${e2}`} fill={haut ?? nuance(couleur, 0.12)} />
    </g>
  )
}

/** Toit pyramidal ou en bâtière au-dessus d'un pavé. */
export function Toit({
  dx = 0, dy = 0, w, d = w, z, h, couleur, faitage = 0,
}: { dx?: number; dy?: number; w: number; d?: number; z: number; h: number; couleur: string; faitage?: number }) {
  const ox = (dx - dy) * TW
  const oy = (dx + dy) * TH
  const P = (fx: number, fy: number, fz: number) =>
    `${ox + (fx - fy) * TW},${oy + (fx + fy) * TH - fz}`
  // Faîtage le long de x : deux sommets à (±faitage, 0)
  const s1 = P(-faitage, 0, z + h), s2 = P(faitage, 0, z + h)
  const e = P(-w, d, z), c = P(w, d, z), b = P(w, -d, z)
  return (
    <g>
      <polygon points={`${e} ${c} ${s2} ${s1}`} fill={nuance(couleur, 0.05)} />
      <polygon points={`${c} ${b} ${s2}`} fill={nuance(couleur, -0.2)} />
    </g>
  )
}

/** Petit arbre ou buisson rond. */
export function Arbre({
  dx = 0, dy = 0, r = 9, tronc = 8, couleur = FEUILLE,
}: { dx?: number; dy?: number; r?: number; tronc?: number; couleur?: string }) {
  const ox = (dx - dy) * TW
  const oy = (dx + dy) * TH
  return (
    <g>
      <ellipse cx={ox} cy={oy} rx={r * 0.7} ry={r * 0.3} fill="rgba(34,48,31,.12)" />
      {tronc > 0 && <rect x={ox - 1.5} y={oy - tronc} width={3} height={tronc} fill={BOIS} />}
      <circle cx={ox} cy={oy - tronc - r * 0.6} r={r} fill={couleur} />
      <circle cx={ox - r * 0.35} cy={oy - tronc - r * 0.9} r={r * 0.45} fill={nuance(couleur, 0.18)} />
    </g>
  )
}

/** Ombre portée au sol. */
export function Ombre({ w = 0.38 }: { w?: number }) {
  return <ellipse cx={0} cy={2} rx={TW * w * 2} ry={TH * w * 2} fill="rgba(34,48,31,.10)" />
}
