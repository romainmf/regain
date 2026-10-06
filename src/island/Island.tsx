import { useMemo } from 'react'
import type { BatimentId, Domaine, Tuile } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Batiment } from './buildings/Batiment'
import { Coeur } from './Coeur'
import { SOCLE, TH, TW, bornes, cle, iso, losange } from './iso'
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

export function Island({ tuiles, placements }: Props) {
  const index = useMemo(() => new Set(tuiles.map((t) => cle(t.x, t.y))), [tuiles])
  const zoneDe = useMemo(() => {
    const m = new Map<string, Tuile['zone']>()
    tuiles.forEach((t) => m.set(cle(t.x, t.y), t.zone))
    return m
  }, [tuiles])

  const b = bornes(tuiles)
  const marge = 16
  const hautBat = 72
  const vb = `${b.minX - marge} ${b.minY - hautBat} ${b.maxX - b.minX + marge * 2} ${b.maxY - b.minY + hautBat + marge * 2.5}`
  const cx = (b.minX + b.maxX) / 2
  const cy = (b.minY + b.maxY) / 2

  const triees = [...tuiles].sort((a, c) => a.x + a.y - (c.x + c.y))
  const objets = [
    ...placements.map((p) => ({ ...p, type: 'bat' as const })),
    ...tuiles.filter((t) => t.zone === 'coeur').map((t) => ({ ...t, id: 'coeur', type: 'coeur' as const })),
  ].sort((a, c) => a.x + a.y - (c.x + c.y) || a.x - c.x)

  return (
    <svg className="ile" viewBox={vb} role="img" aria-label="Ton île">
      <ellipse cx={cx} cy={cy + 10} rx={(b.maxX - b.minX) / 2 + 14} ry={(b.maxY - b.minY) / 2 + 12} fill="var(--eau)" />

      {/* Socle : faces visibles des tuiles de bord */}
      <g>
        {triees.map((t) => {
          const { sx, sy } = iso(t.x, t.y)
          const faces = []
          if (!index.has(cle(t.x, t.y + 1)))
            faces.push(
              <polygon key="g" points={`${sx - TW},${sy} ${sx},${sy + TH} ${sx},${sy + TH + SOCLE} ${sx - TW},${sy + SOCLE}`} fill="var(--socle)" />,
            )
          if (!index.has(cle(t.x + 1, t.y)))
            faces.push(
              <polygon key="d" points={`${sx},${sy + TH} ${sx + TW},${sy} ${sx + TW},${sy + SOCLE} ${sx},${sy + TH + SOCLE}`} fill="var(--socle-ombre)" />,
            )
          return <g key={cle(t.x, t.y)}>{faces}</g>
        })}
      </g>

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

      {/* Bâtiments et Cœur, de l'arrière vers l'avant */}
      <g>
        {objets.map((o) => {
          const { sx, sy } = iso(o.x, o.y)
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
    </svg>
  )
}
