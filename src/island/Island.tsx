import { useMemo } from 'react'
import type { BatimentId, Domaine, Tuile } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Batiment } from './buildings/Batiment'
import { Coeur } from './Coeur'
import { Fanion } from './Fanion'
import { Robot } from './Robot'
import { CascadesRiviere, Riviere } from './Riviere'
import { SOCLE, TH, TW, bornes, cle, iso, losange } from './iso'
import { Fond, Nenuphars, Pollen, hache } from './Paysage'
import './island.css'

export interface PlacementVue {
  id: string
  x: number
  y: number
  batiment: BatimentId
  domaine: Domaine
  niveau: 1 | 2 | 3
  libelle: string
}

interface Props {
  tuiles: Tuile[]
  placements: PlacementVue[]
  /** Toucher l'arbre du Cœur ouvre Brin, le guide. */
  onCoeur?: () => void
  /** Bulle d'invitation au-dessus de l'arbre. */
  bulleCoeur?: string | null
}

const SOL: Record<Tuile['zone'], string> = {
  boite: 'var(--boite-sol)',
  peau: 'var(--peau-sol)',
  planete: 'var(--planete-sol)',
  coeur: 'var(--coeur-sol)',
}

const MOUSSE = '#7FAE73'
const MOUSSE_FONCEE = '#5E9B62'

type Objet =
  | (PlacementVue & { type: 'bat' })
  | { type: 'coeur'; id: string; x: number; y: number }
  | { type: 'fanion'; id: string; x: number; y: number; zone: Domaine }

/** Fanions d'entrée de zone, aux coins extérieurs de l'île. */
const FANIONS: { x: number; y: number; zone: Domaine }[] = [
  { x: 0, y: 6, zone: 'boite' },
  { x: 6, y: 0, zone: 'peau' },
  { x: 6, y: 6, zone: 'planete' },
]

/** Au fond de l'île, l'arbre peut être plus grand sans rien cacher. */
const ECHELLE_COEUR = 1.6

export function Island({ tuiles, placements, onCoeur, bulleCoeur }: Props) {
  const index = useMemo(() => new Set(tuiles.map((t) => cle(t.x, t.y))), [tuiles])
  // Cadre de la scène : l'île en bas, du ciel au-dessus pour les bâtiments.
  const b = bornes(tuiles)
  const marge = 24
  const W = b.maxX - b.minX + marge * 2
  const H = Math.max(W * 0.98, b.maxY - b.minY + 200)
  const x0 = b.minX - marge
  const y0 = b.maxY + 34 - H
  const horizon = y0 + H * 0.26
  const cadre = { x0, y0, W, H, horizon }
  const cx = (b.minX + b.maxX) / 2

  const triees = [...tuiles].sort((a, c) => a.x + a.y - (c.x + c.y))
  const occupees = new Set(placements.map((p) => cle(p.x, p.y)))
  const fanions = FANIONS.filter((f) => index.has(cle(f.x, f.y)) && !occupees.has(cle(f.x, f.y)))
  fanions.forEach((f) => occupees.add(cle(f.x, f.y)))

  const objets: Objet[] = [
    ...placements.map((p) => ({ ...p, type: 'bat' as const })),
    ...tuiles.filter((t) => t.zone === 'coeur').map((t) => ({ type: 'coeur' as const, id: 'coeur', x: t.x, y: t.y })),
    ...fanions.map((f) => ({ type: 'fanion' as const, id: `fanion-${f.zone}`, ...f })),
  ].sort((a, c) => a.x + a.y - (c.x + c.y) || a.x - c.x)

  // Faces de bord du socle (gauche = vers y+1, droite = vers x+1)
  const bords = triees.flatMap((t) => {
    const out: { t: Tuile; cote: 'g' | 'd' }[] = []
    if (!index.has(cle(t.x, t.y + 1))) out.push({ t, cote: 'g' })
    if (!index.has(cle(t.x + 1, t.y))) out.push({ t, cote: 'd' })
    return out
  })

  const nenuphars: [number, number][] = [
    [b.minX + 40, b.maxY - 70],
    [b.minX + 58, b.maxY - 52],
    [b.maxX - 30, b.maxY - 62],
    [cx + 70, b.maxY + 16],
  ]

  return (
    <svg className="ile" viewBox={`${x0} ${y0} ${W} ${H}`} role="img" aria-label="Ton île">
      <Fond {...cadre} />

      {/* Reflet et halo d'eau autour de l'île */}
      <ellipse cx={cx} cy={b.maxY - (b.maxY - b.minY) / 2 + 14} rx={(b.maxX - b.minX) / 2 + 10} ry={(b.maxY - b.minY) / 2 + 6} fill="#E3EFE9" opacity={0.7} />
      <Nenuphars points={nenuphars} />

      {/* Socle : terre, mousse qui déborde, lianes */}
      <g>
        {bords.map(({ t, cote }) => {
          const { sx, sy } = iso(t.x, t.y)
          const h = hache(t.x, t.y + (cote === 'd' ? 50 : 0))
          const [ax, ay, bx, by] = cote === 'g' ? [sx - TW, sy, sx, sy + TH] : [sx, sy + TH, sx + TW, sy]
          const lianeU = 0.25 + ((h >>> 4) % 50) / 100
          const lx = ax + (bx - ax) * lianeU
          const ly = ay + (by - ay) * lianeU
          const longueur = SOCLE + 2 + (h % 9)
          return (
            <g key={`${t.x},${t.y}${cote}`}>
              <polygon
                points={`${ax},${ay} ${bx},${by} ${bx},${by + SOCLE} ${ax},${ay + SOCLE}`}
                fill={cote === 'g' ? 'var(--socle)' : 'var(--socle-ombre)'}
              />
              {/* Racines claires dans la terre */}
              <path d={`M ${ax + (bx - ax) * 0.7} ${ay + (by - ay) * 0.7 + 4} q 2 4 -1 8`} stroke="#DCCDAE" strokeWidth={1} fill="none" />
              {/* Mousse festonnée */}
              <path
                d={`M ${ax} ${ay} L ${bx} ${by} L ${bx} ${by + 3} Q ${(ax + bx) / 2 + 6} ${(ay + by) / 2 + 9} ${(ax + bx) / 2} ${(ay + by) / 2 + 4} Q ${(ax + bx) / 2 - 8} ${(ay + by) / 2 + 7} ${ax} ${ay + 4} Z`}
                fill={cote === 'g' ? MOUSSE : MOUSSE_FONCEE}
              />
              {h % 3 !== 0 && (
                <path d={`M ${lx} ${ly + 2} q ${h % 2 ? 3 : -3} ${longueur / 2} 0 ${longueur}`} stroke={MOUSSE_FONCEE} strokeWidth={1.4} fill="none" strokeLinecap="round" />
              )}
            </g>
          )
        })}
      </g>

      <CascadesRiviere />

      {/* Sol */}
      <g>
        {triees.map((t) => (
          <polygon
            key={cle(t.x, t.y)}
            points={losange(t.x, t.y)}
            fill={SOL[t.zone]}
            stroke="rgba(255,255,255,.55)"
            strokeWidth={0.8}
            data-zone={t.zone}
          />
        ))}
      </g>

      <Riviere />

      {/* Bâtiments, Cœur et fanions, de l'arrière vers l'avant */}
      <g>
        {objets.map((o) => {
          const { sx, sy } = iso(o.x, o.y)
          if (o.type === 'fanion') {
            return (
              <g key={o.id} transform={`translate(${sx} ${sy})`} aria-hidden>
                <Fanion zone={o.zone} />
              </g>
            )
          }
          return (
            <g key={o.id} transform={`translate(${sx} ${sy})`}>
              {o.type === 'coeur' ? (
                <g
                  className="coeur-brin"
                  role="button"
                  tabIndex={0}
                  aria-label="Parler à Brin, l’arbre au cœur de ton île"
                  onClick={onCoeur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      onCoeur?.()
                    }
                  }}
                >
                  <g transform={`scale(${ECHELLE_COEUR})`}>
                    <ellipse className="coeur-halo" cx={0} cy={2} rx={30} ry={15} fill="none" stroke="#E7B04A" strokeWidth={1.5} />
                    <Coeur />
                    {/* Zone de toucher élargie (≥ 44 px à l'écran) */}
                    <rect x={-32} y={-80} width={64} height={92} fill="transparent" />
                  </g>
                  {bulleCoeur && (
                    <g className="coeur-bulle" aria-hidden>
                      <rect x={48} y={-122} width={150} height={32} rx={16} fill="#FBF8F1" stroke="#E2DACA" />
                      <path d="M 49 -110 L 36 -100 L 56 -98 Z" fill="#FBF8F1" />
                      <text x={123} y={-101} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={15} fontWeight={500} fill="#22301F">
                        {bulleCoeur}
                      </text>
                    </g>
                  )}
                </g>
              ) : (
                <g aria-label={o.libelle}>
                  <g transform="scale(1.25)">
                    <Batiment id={o.batiment} couleur={COULEUR[o.domaine]} niveau={o.niveau} />
                  </g>
                  {/* Le robot compagnon de l'agent, posé devant son bâtiment */}
                  <g transform="translate(-13 10)">
                    <Robot domaine={o.domaine} couleur={COULEUR[o.domaine]} phase={(hache(o.x, o.y) % 20) / 10} />
                  </g>
                </g>
              )}
            </g>
          )
        })}
      </g>

      <Pollen {...cadre} />
    </svg>
  )
}
