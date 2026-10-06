import { RIVIERE, SOCLE, iso } from './iso'

type P = [number, number]

const ecran = ([gx, gy]: P): P => {
  const { sx, sy } = iso(gx, gy)
  return [sx, sy]
}

/** Ajoute des points intermédiaires légèrement décalés pour que l'eau serpente. */
function meandre(points: P[], amplitude: number): P[] {
  const out: P[] = [points[0]]
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, ay] = points[i]
    const [bx, by] = points[i + 1]
    const L = Math.hypot(bx - ax, by - ay)
    const n = Math.max(1, Math.round(L / 34))
    const [nx, ny] = [-(by - ay) / L, (bx - ax) / L]
    for (let k = 1; k < n; k++) {
      const t = k / n
      const o = (k % 2 ? 1 : -1) * amplitude
      out.push([ax + (bx - ax) * t + nx * o, ay + (by - ay) * t + ny * o])
    }
    out.push([bx, by])
  }
  return out
}

/** Courbe lisse (Catmull-Rom → Bézier) passant par tous les points. */
function courbe(p: P[]): string {
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i]
    const p1 = p[i]
    const p2 = p[i + 1]
    const p3 = p[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`
  }
  return d
}

function Lit({ d, largeur }: { d: string; largeur: number }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} stroke="#A9CFC6" strokeWidth={largeur + 4} />
      <path d={d} stroke="#CFE6EC" strokeWidth={largeur} />
      <path className="courant" d={d} stroke="#F5FBF8" strokeWidth={1.2} strokeDasharray="5 9" opacity={0.9} />
    </g>
  )
}

/** Cascade à l'embouchure, sur la face visible du socle. */
function Cascade({ x, y, pente }: { x: number; y: number; pente: number }) {
  const w = 5
  const h = SOCLE + 10
  return (
    <g aria-hidden>
      <polygon points={`${x - w},${y - w * pente} ${x + w},${y + w * pente} ${x + w},${y + w * pente + h} ${x - w},${y - w * pente + h}`} fill="#CFE6EC" />
      <g className="cascade" stroke="#FBF8F1" strokeWidth={1} strokeDasharray="3 4">
        <line x1={x - 2} y1={y} x2={x - 2} y2={y + h} />
        <line x1={x + 2.5} y1={y + 1} x2={x + 2.5} y2={y + h} />
      </g>
      <ellipse cx={x} cy={y + h + 1} rx={11} ry={3.2} fill="#F5F8F2" opacity={0.9} />
    </g>
  )
}

/** Les cascades se dessinent avec le socle, avant le sol. */
export function CascadesRiviere() {
  return (
    <g>
      {RIVIERE.bras.map((b, i) => {
        const [x, y] = ecran(b[b.length - 1])
        // Bras gauche : face avant-gauche (pente +0,5) ; bras droit : face avant-droite (−0,5)
        return <Cascade key={i} x={x} y={y} pente={i === 0 ? 0.5 : -0.5} />
      })}
    </g>
  )
}

/** Le lit de la rivière, dessiné sur le sol. */
export function Riviere() {
  const tronc = meandre(RIVIERE.tronc.map(ecran), 3)
  const [sx, sy] = ecran(RIVIERE.source)
  return (
    <g aria-hidden>
      <Lit d={courbe(tronc)} largeur={8} />
      {RIVIERE.bras.map((b, i) => (
        <Lit key={i} d={courbe(meandre(b.map(ecran), 4))} largeur={7} />
      ))}
      {/* Source au pied de l'arbre */}
      <ellipse cx={sx} cy={sy} rx={10} ry={5} fill="#A9CFC6" />
      <ellipse cx={sx} cy={sy} rx={8} ry={3.8} fill="#CFE6EC" />
      <ellipse className="source-ride" cx={sx} cy={sy} rx={4} ry={1.8} fill="none" stroke="#F5FBF8" strokeWidth={0.8} />
    </g>
  )
}
