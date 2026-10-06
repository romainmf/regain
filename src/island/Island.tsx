import { useMemo } from 'react'
import type { BatimentId, Domaine, Tuile } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Batiment } from './buildings/Batiment'
import { Flore } from './buildings/primitives'
import { Coeur } from './Coeur'
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
  | { type: 'flore'; id: string; x: number; y: number; h: number }

export function Island({ tuiles, placements }: Props) {
  const index = useMemo(() => new Set(tuiles.map((t) => cle(t.x, t.y))), [tuiles])
  const zoneDe = useMemo(() => {
    const m = new Map<string, Tuile['zone']>()
    tuiles.forEach((t) => m.set(cle(t.x, t.y), t.zone))
    return m
  }, [tuiles])

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

  const objets: Objet[] = [
    ...placements.map((p) => ({ ...p, type: 'bat' as const })),
    ...tuiles.filter((t) => t.zone === 'coeur').map((t) => ({ type: 'coeur' as const, id: 'coeur', x: t.x, y: t.y })),
    ...tuiles
      .filter((t) => t.zone !== 'coeur' && !occupees.has(cle(t.x, t.y)) && hache(t.x, t.y) % 10 < 6)
      .map((t) => ({ type: 'flore' as const, id: `f${t.x},${t.y}`, x: t.x, y: t.y, h: hache(t.x, t.y) })),
  ].sort((a, c) => a.x + a.y - (c.x + c.y) || a.x - c.x)

  // Faces de bord du socle (gauche = vers y+1, droite = vers x+1)
  const bords = triees.flatMap((t) => {
    const out: { t: Tuile; cote: 'g' | 'd' }[] = []
    if (!index.has(cle(t.x, t.y + 1))) out.push({ t, cote: 'g' })
    if (!index.has(cle(t.x + 1, t.y))) out.push({ t, cote: 'd' })
    return out
  })

  // Cascade : sur la face droite du bord le plus à droite, au milieu.
  const facesDroites = bords.filter((f) => f.cote === 'd')
  const cascade = facesDroites[Math.floor(facesDroites.length / 2)]?.t

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

      {/* Cascade */}
      {cascade && (() => {
        const { sx, sy } = iso(cascade.x, cascade.y)
        const x1 = sx + TW * 0.35, y1 = sy + TH * 0.65
        const x2 = sx + TW * 0.6, y2 = sy + TH * 0.4
        return (
          <g aria-hidden>
            <polygon points={`${x1},${y1} ${x2},${y2} ${x2},${y2 + SOCLE + 10} ${x1},${y1 + SOCLE + 10}`} fill="#CFE6EC" />
            <g className="cascade" stroke="#FBF8F1" strokeWidth={1} strokeDasharray="3 4" opacity={0.9}>
              <line x1={x1 + 3} y1={y1 - 1} x2={x1 + 3} y2={y1 + SOCLE + 8} />
              <line x1={x2 - 4} y1={y2 + 1} x2={x2 - 4} y2={y2 + SOCLE + 10} />
            </g>
            <ellipse cx={(x1 + x2) / 2} cy={(y1 + y2) / 2 + SOCLE + 11} rx={12} ry={3.5} fill="#F5F8F2" opacity={0.9} />
          </g>
        )
      })()}

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

      {/* Ruisseau de la cascade */}
      {cascade && (() => {
        const a = iso(cascade.x, cascade.y)
        const d = iso(cascade.x - 1, cascade.y)
        return (
          <path
            aria-hidden
            d={`M ${d.sx} ${d.sy} Q ${(a.sx + d.sx) / 2 + 4} ${(a.sy + d.sy) / 2 + 4} ${a.sx + TW * 0.48} ${a.sy + TH * 0.52}`}
            stroke="#BFDCE0"
            strokeWidth={4}
            fill="none"
            strokeLinecap="round"
          />
        )
      })()}

      {/* Lisières entre zones */}
      <g stroke="rgba(34,48,31,.18)" strokeWidth={1.2} strokeLinecap="round">
        {tuiles.flatMap((t) => {
          const { sx, sy } = iso(t.x, t.y)
          const lignes = []
          const droite = zoneDe.get(cle(t.x + 1, t.y))
          const bas = zoneDe.get(cle(t.x, t.y + 1))
          if (droite && droite !== t.zone)
            lignes.push(<line key={`${t.x},${t.y}d`} x1={sx + TW} y1={sy} x2={sx} y2={sy + TH} />)
          if (bas && bas !== t.zone)
            lignes.push(<line key={`${t.x},${t.y}b`} x1={sx - TW} y1={sy} x2={sx} y2={sy + TH} />)
          return lignes
        })}
      </g>

      {/* Bâtiments, Cœur et végétation, de l'arrière vers l'avant */}
      <g>
        {objets.map((o) => {
          const { sx, sy } = iso(o.x, o.y)
          if (o.type === 'flore') {
            const decal = ((o.h >>> 8) % 30) / 100 - 0.15
            return (
              <g key={o.id} transform={`translate(${sx} ${sy})`} aria-hidden>
                <Flore type={o.h >>> 3} dx={decal} dy={-decal / 2} />
              </g>
            )
          }
          return (
            <g key={o.id} transform={`translate(${sx} ${sy})`}>
              {o.type === 'coeur' ? (
                <Coeur />
              ) : (
                <g aria-label={o.libelle} transform="scale(1.25)">
                  <Batiment id={o.batiment} couleur={COULEUR[o.domaine]} niveau={o.niveau} />
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
