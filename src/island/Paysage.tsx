import { Eolienne } from './buildings/primitives'

/** Hachage déterministe d'une tuile : la nature est la même à chaque affichage. */
export function hache(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0
  h = (h ^ (h >>> 13)) * 1274126177
  return (h ^ (h >>> 16)) >>> 0
}

interface Cadre {
  x0: number
  y0: number
  W: number
  H: number
  horizon: number
}

/** Ciel, soleil, collines lointaines à éoliennes, mer. Derrière l'île. */
export function Fond({ x0, y0, W, H, horizon }: Cadre) {
  const soleil = { x: x0 + W * 0.22, y: y0 + H * 0.13 }
  const colline = (dx: number, w: number, h: number) =>
    `M ${x0 + dx - w} ${horizon} Q ${x0 + dx} ${horizon - h * 2} ${x0 + dx + w} ${horizon} Z`
  return (
    <g aria-hidden>
      <defs>
        <linearGradient id="ciel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F6E6C2" />
          <stop offset="0.7" stopColor="#F5EEDC" />
          <stop offset="1" stopColor="#EEF1E4" />
        </linearGradient>
        <linearGradient id="mer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#D5E7DF" />
          <stop offset="1" stopColor="#BFDAD2" />
        </linearGradient>
        <radialGradient id="halo">
          <stop offset="0" stopColor="#F7D58A" stopOpacity="0.9" />
          <stop offset="0.45" stopColor="#F6E0A8" stopOpacity="0.45" />
          <stop offset="1" stopColor="#F6E6C2" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x={x0} y={y0} width={W} height={horizon - y0} fill="url(#ciel)" />
      <circle cx={soleil.x} cy={soleil.y} r={80} fill="url(#halo)" />
      <circle cx={soleil.x} cy={soleil.y} r={20} fill="#F3C66A" />

      {/* Oiseaux */}
      <g className="oiseaux" stroke="#4F5A49" strokeWidth={1.3} fill="none" strokeLinecap="round">
        <path d={`M ${x0 + W * 0.58} ${y0 + H * 0.12} q 4 -4 8 0 q 4 -4 8 0`} />
        <path d={`M ${x0 + W * 0.68} ${y0 + H * 0.08} q 3 -3 6 0 q 3 -3 6 0`} />
        <path d={`M ${x0 + W * 0.5} ${y0 + H * 0.17} q 3 -3 6 0 q 3 -3 6 0`} />
      </g>

      {/* Collines lointaines et leurs éoliennes */}
      <path d={colline(W * 0.15, 120, 22)} fill="#D2E2C8" />
      <path d={colline(W * 0.72, 150, 30)} fill="#C9DCC0" />
      <path d={colline(W * 0.45, 90, 14)} fill="#DAE6CF" />
      <Eolienne x={x0 + W * 0.66} y={horizon - 50} h={30} echelle={0.75} />
      <Eolienne x={x0 + W * 0.76} y={horizon - 42} h={30} echelle={0.6} />
      <Eolienne x={x0 + W * 0.85} y={horizon - 28} h={30} echelle={0.5} />

      <rect x={x0} y={horizon} width={W} height={y0 + H - horizon} fill="url(#mer)" />
      <g stroke="#F5F8F2" strokeWidth={1.4} strokeLinecap="round" opacity={0.8}>
        <line x1={x0 + W * 0.08} y1={horizon + 24} x2={x0 + W * 0.16} y2={horizon + 24} />
        <line x1={x0 + W * 0.8} y1={horizon + 40} x2={x0 + W * 0.9} y2={horizon + 40} />
        <line x1={x0 + W * 0.1} y1={y0 + H - 30} x2={x0 + W * 0.2} y2={y0 + H - 30} />
        <line x1={x0 + W * 0.82} y1={y0 + H - 46} x2={x0 + W * 0.93} y2={y0 + H - 46} />
      </g>

      {/* Petit voilier */}
      <g transform={`translate(${x0 + W * 0.3} ${horizon + 14})`} className="voilier">
        <path d="M -9 0 L 9 0 L 6 4 L -6 4 Z" fill="#A57A52" />
        <path d="M 0 -1 L 0 -17 L 8 -2 Z" fill="#FBF8F1" />
        <path d="M -1 -2 L -1 -13 L -7 -2 Z" fill="#E7B04A" />
      </g>
    </g>
  )
}

/** Particules de pollen flottantes, au-dessus de tout. */
export function Pollen({ x0, y0, W, H }: Cadre) {
  const grains = [
    [0.18, 0.42], [0.34, 0.3], [0.62, 0.36], [0.8, 0.5], [0.12, 0.7], [0.9, 0.72], [0.48, 0.22],
  ]
  return (
    <g aria-hidden className="pollen">
      {grains.map(([u, v], i) => (
        <circle key={i} cx={x0 + W * u} cy={y0 + H * v} r={i % 3 === 0 ? 1.8 : 1.2} fill="#F3C66A" style={{ animationDelay: `${i * 0.9}s` }} />
      ))}
    </g>
  )
}

/** Nénuphars près du rivage. */
export function Nenuphars({ points }: { points: [number, number][] }) {
  return (
    <g aria-hidden>
      {points.map(([x, y], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <path d="M 0 0 m -6 0 a 6 2.6 0 1 0 12 0 a 6 2.6 0 1 0 -12 0 M 0 0 L 5 -1.6" fill="#7FAE73" stroke="#BFDAD2" strokeWidth={0.6} />
          {i % 2 === 0 && <circle cx={-1} cy={-1.5} r={1.6} fill="#F2C9D8" />}
        </g>
      ))}
    </g>
  )
}
