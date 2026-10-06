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

type Pt = [number, number]
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]
const pts = (...p: Pt[]) => p.map((q) => q.join(',')).join(' ')

/** Panneau solaire posé sur un quadrilatère (A-B en bas, D-C en haut). */
function Panneau({ A, B, C, D }: { A: Pt; B: Pt; C: Pt; D: Pt }) {
  const q = (u: number, v: number) => lerp(lerp(A, B, u), lerp(D, C, u), v)
  const u0 = 0.14, u1 = 0.86, v0 = 0.14, v1 = 0.72
  return (
    <g>
      <polygon points={pts(q(u0, v0), q(u1, v0), q(u1, v1), q(u0, v1))} fill="#2D4B5C" />
      {[0.38, 0.62].map((u) => {
        const uu = u0 + (u1 - u0) * u
        return <line key={u} x1={q(uu, v0)[0]} y1={q(uu, v0)[1]} x2={q(uu, v1)[0]} y2={q(uu, v1)[1]} stroke="#6E93A3" strokeWidth={0.6} />
      })}
      <line x1={q(u0, (v0 + v1) / 2)[0]} y1={q(u0, (v0 + v1) / 2)[1]} x2={q(u1, (v0 + v1) / 2)[0]} y2={q(u1, (v0 + v1) / 2)[1]} stroke="#6E93A3" strokeWidth={0.6} />
      <polygon points={pts(q(u0, v1 - 0.12), q(u0 + 0.25, v1 - 0.12), q(u0 + 0.18, v1), q(u0, v1))} fill="#9EC3CF" opacity={0.55} />
    </g>
  )
}

/** Toit pyramidal ou en bâtière au-dessus d'un pavé. `solaire` pose des panneaux, `vegetal` le végétalise. */
export function Toit({
  dx = 0, dy = 0, w, d = w, z, h, couleur, faitage = 0, solaire = false, vegetal = false,
}: {
  dx?: number; dy?: number; w: number; d?: number; z: number; h: number; couleur: string
  faitage?: number; solaire?: boolean; vegetal?: boolean
}) {
  const ox = (dx - dy) * TW
  const oy = (dx + dy) * TH
  const P = (fx: number, fy: number, fz: number): Pt => [ox + (fx - fy) * TW, oy + (fx + fy) * TH - fz]
  // Faîtage le long de x : deux sommets à (±faitage, 0)
  const s1 = P(-faitage, 0, z + h), s2 = P(faitage, 0, z + h)
  const e = P(-w, d, z), c = P(w, d, z), b = P(w, -d, z)
  const avant = vegetal ? '#6FA56B' : nuance(couleur, 0.05)
  const cote = vegetal ? '#4F8A55' : nuance(couleur, -0.2)
  return (
    <g>
      <polygon points={pts(e, c, s2, s1)} fill={avant} />
      <polygon points={pts(c, b, s2)} fill={cote} />
      {vegetal && (
        <g>
          <polyline points={pts(e, c)} fill="none" stroke={couleur} strokeWidth={1.6} />
          <circle cx={lerp(e, s1, 0.5)[0] + 4} cy={lerp(e, s1, 0.5)[1] + 1} r={1.6} fill="#E7B04A" />
          <circle cx={lerp(c, s2, 0.4)[0] - 5} cy={lerp(c, s2, 0.4)[1]} r={1.4} fill="#F4EAD5" />
        </g>
      )}
      {solaire && <Panneau A={e} B={c} C={s2} D={s1} />}
    </g>
  )
}

/** Petite éolienne ; les pales tournent doucement (coupées si mouvement réduit). */
export function Eolienne({ x = 0, y = 0, h = 30, echelle = 1 }: { x?: number; y?: number; h?: number; echelle?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${echelle})`}>
      <path d={`M -1.6 0 L -0.7 ${-h} L 0.7 ${-h} L 1.6 0 Z`} fill="#F4EAD5" />
      <g transform={`translate(0 ${-h})`}>
        <g className="pales">
          {[0, 120, 240].map((a) => (
            <path key={a} d="M 0 0 C 2 -4 1.6 -11 0 -14 C -1 -10 -1.2 -4 0 0 Z" fill="#FBF8F1" stroke="#C9C1AE" strokeWidth={0.4} transform={`rotate(${a})`} />
          ))}
        </g>
        <circle r={1.6} fill="#E7B04A" />
      </g>
    </g>
  )
}

/** Touffe d'herbe, fleurs ou petit buisson pour habiller les tuiles libres. */
export function Flore({ type, dx = 0, dy = 0 }: { type: number; dx?: number; dy?: number }) {
  const x = (dx - dy) * TW
  const y = (dx + dy) * TH
  switch (type % 4) {
    case 0:
      return (
        <g stroke="#5E9B62" strokeWidth={1.2} strokeLinecap="round">
          <line x1={x} y1={y} x2={x - 2} y2={y - 5} />
          <line x1={x} y1={y} x2={x} y2={y - 6} />
          <line x1={x} y1={y} x2={x + 2.5} y2={y - 4.5} />
        </g>
      )
    case 1:
      return (
        <g>
          <circle cx={x - 3} cy={y - 2} r={1.6} fill="#E7B04A" />
          <circle cx={x + 2} cy={y - 3} r={1.6} fill="#F4EAD5" />
          <circle cx={x} cy={y + 1} r={1.6} fill="#D98BA9" />
          <circle cx={x + 4} cy={y + 1} r={1.2} fill="#E7B04A" />
        </g>
      )
    case 2:
      return (
        <g>
          <ellipse cx={x} cy={y} rx={5} ry={2} fill="rgba(34,48,31,.1)" />
          <circle cx={x} cy={y - 3} r={4} fill="#6FA56B" />
          <circle cx={x - 1.5} cy={y - 4.5} r={1.8} fill="#8DBF85" />
          <circle cx={x + 2} cy={y - 2} r={1} fill="#E7B04A" />
        </g>
      )
    default:
      return <Arbre dx={dx} dy={dy} r={6} tronc={6} couleur="#5E9B62" />
  }
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
