import { useMemo, useRef } from 'react'
import type { BatimentId, Domaine, Tuile } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Batiment } from './buildings/Batiment'
import { Coeur } from './Coeur'
import { Fanion } from './Fanion'
import { Robot } from './Robot'
import { CascadesRiviere, Riviere } from './Riviere'
import { SOCLE, TH, TW, bornes, cle, iso, losange } from './iso'
import { Fond, Nenuphars, Pollen, hache } from './Paysage'
import { lumiereDepuisElan, type Meteo } from '../domain/economy'
import type { Chaine } from '../domain/chains'
import { formatElan } from '../ui/EnTete'
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

export interface PoseVue {
  agentId: string
  domaine: Domaine
  mode: 'pose' | 'deplacement'
}

interface Props {
  tuiles: Tuile[]
  placements: PlacementVue[]
  /** Toucher l'arbre du Cœur ouvre Brin, le guide. */
  onCoeur?: () => void
  /** Bulle d'invitation au-dessus de l'arbre. */
  bulleCoeur?: string | null
  /** Pose ou déplacement en cours : surligne les tuiles libres de la zone. */
  poseEnCours?: PoseVue | null
  /** Tap sur une tuile libre surlignée. */
  onPoser?: (x: number, y: number) => void
  /** Appui long sur un bâtiment : demande à le déplacer. */
  onDeplacerDemande?: (agentId: string) => void
  /** Tap bref sur un bâtiment : ouvre la fiche de son agent. */
  onBatimentTap?: (agentId: string) => void
  /** Agents avec une proposition en attente : leur bâtiment donne signe de vie. */
  agentsEnAttente?: Set<string>
  /** Météo de l'île déduite de l'élan. */
  meteo?: Meteo
  /** Domaines en repos (brume douce, désaturés). */
  repos?: Record<Domaine, boolean>
  /** Élan courant, pour le badge au centre. */
  elan?: number
  /** Dernière chaîne : un flux doré relie les deux bâtiments concernés. */
  chaine?: Chaine | null
}

const SOL: Record<Tuile['zone'], string> = {
  boite: 'var(--boite-sol)',
  peau: 'var(--peau-sol)',
  planete: 'var(--planete-sol)',
  coeur: 'var(--coeur-sol)',
}

/** Sol désaturé d'un domaine en repos (brume douce). */
const SOL_REPOS: Record<Domaine, string> = {
  boite: '#D8CFC2',
  peau: '#D3CBCF',
  planete: '#CBD4CC',
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

export function Island({
  tuiles,
  placements,
  onCoeur,
  bulleCoeur,
  poseEnCours,
  onPoser,
  onDeplacerDemande,
  onBatimentTap,
  agentsEnAttente,
  meteo = 'soleil',
  repos,
  elan,
  chaine,
}: Props) {
  const index = useMemo(() => new Set(tuiles.map((t) => cle(t.x, t.y))), [tuiles])
  // Appui long sur un bâtiment pour le déplacer ; tap bref pour ouvrir la fiche.
  const appui = useRef<{ agentId: string; long: boolean } | null>(null)
  const minuteur = useRef<number | undefined>(undefined)
  const demarrerAppui = (agentId: string) => {
    if (poseEnCours) return
    appui.current = { agentId, long: false }
    minuteur.current = window.setTimeout(() => {
      if (appui.current) {
        appui.current.long = true
        onDeplacerDemande?.(agentId)
      }
    }, 420)
  }
  const finirAppui = () => {
    clearTimeout(minuteur.current)
    if (appui.current && !appui.current.long) onBatimentTap?.(appui.current.agentId)
    appui.current = null
  }
  const annulerAppui = () => {
    clearTimeout(minuteur.current)
    appui.current = null
  }
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

  // Tuiles libres de la zone pendant une pose ou un déplacement.
  // Lors d'un déplacement, la tuile actuelle du bâtiment déplacé redevient libre.
  const occupeesPose = new Set(
    placements.filter((p) => p.id !== poseEnCours?.agentId).map((p) => cle(p.x, p.y)),
  )
  const libres = poseEnCours
    ? tuiles.filter((t) => t.zone === poseEnCours.domaine && !occupeesPose.has(cle(t.x, t.y)))
    : []

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
      <defs>
        {/* Ombre portée douce, réutilisée sous chaque bâtiment */}
        <radialGradient id="ombreDouce">
          <stop offset="0" stopColor="rgba(34,48,31,0.30)" />
          <stop offset="0.6" stopColor="rgba(34,48,31,0.16)" />
          <stop offset="1" stopColor="rgba(34,48,31,0)" />
        </radialGradient>
        {/* Perspective aérienne : léger voile clair vers le fond de l'île */}
        <linearGradient id="haze" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EAF1EC" stopOpacity="0.5" />
          <stop offset="0.4" stopColor="#EAF1EC" stopOpacity="0.12" />
          <stop offset="0.7" stopColor="#EAF1EC" stopOpacity="0" />
        </linearGradient>
        {/* Vignette douce qui ancre l'île */}
        <radialGradient id="vignette" cx="0.5" cy="0.46" r="0.62">
          <stop offset="0.55" stopColor="rgba(34,48,31,0)" />
          <stop offset="1" stopColor="rgba(34,48,31,0.06)" />
        </radialGradient>
        {/* Halo chaud du soleil, posé sur l'île */}
        <radialGradient id="lumiereJour" cx="0.32" cy="0.2" r="0.7">
          <stop offset="0" stopColor="#FBEFC9" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#FBEFC9" stopOpacity="0" />
        </radialGradient>
      </defs>

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
        {triees.map((t) => {
          const enRepos = t.zone !== 'coeur' && repos?.[t.zone]
          return (
            <polygon
              key={cle(t.x, t.y)}
              points={losange(t.x, t.y)}
              fill={enRepos ? SOL_REPOS[t.zone as Domaine] : SOL[t.zone]}
              stroke="rgba(255,255,255,.55)"
              strokeWidth={0.8}
              data-zone={t.zone}
            />
          )
        })}
      </g>

      {/* Lumière chaude du soleil sur l'île : plus l'élan est fort, plus elle réchauffe */}
      <ellipse cx={cx} cy={b.maxY - (b.maxY - b.minY) / 2} rx={(b.maxX - b.minX) / 2} ry={(b.maxY - b.minY) / 2} fill="url(#lumiereJour)" opacity={lumiereDepuisElan(elan ?? 1)} pointerEvents="none" />

      <Riviere />

      {/* Ombres portées douces et directionnelles, sous les bâtiments et l'arbre */}
      <g pointerEvents="none">
        {[...placements.map((p) => ({ x: p.x, y: p.y, r: 20 })), { x: 0, y: 0, r: 30 }].map((o, i) => {
          const { sx, sy } = iso(o.x, o.y)
          return <ellipse key={i} cx={sx + o.r * 0.28} cy={sy + o.r * 0.18} rx={o.r} ry={o.r * 0.5} fill="url(#ombreDouce)" />
        })}
      </g>

      {/* Tuiles libres surlignées pendant une pose ou un déplacement */}
      {poseEnCours && (
        <g className="pose-libres">
          {libres.map((t) => (
            <polygon
              key={cle(t.x, t.y)}
              className="pose-tuile"
              points={losange(t.x, t.y)}
              fill={`var(--${t.zone})`}
              stroke="var(--surface)"
              strokeWidth={1.5}
              role="button"
              tabIndex={0}
              aria-label={`Poser ici, en ${t.zone}`}
              onClick={() => onPoser?.(t.x, t.y)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onPoser?.(t.x, t.y)
                }
              }}
            />
          ))}
        </g>
      )}

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
                <g
                  className={`batiment${poseEnCours?.agentId === o.id ? ' batiment-deplace' : ''}${agentsEnAttente?.has(o.id) ? ' batiment-vivant' : ''}`}
                  aria-label={poseEnCours ? o.libelle : `${o.libelle} : appui long pour déplacer`}
                  role={poseEnCours ? undefined : 'button'}
                  tabIndex={poseEnCours ? undefined : 0}
                  onPointerDown={() => demarrerAppui(o.id)}
                  onPointerUp={finirAppui}
                  onPointerLeave={annulerAppui}
                  onPointerCancel={annulerAppui}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') onBatimentTap?.(o.id)
                  }}
                >
                  {/* Cible de toucher sous le bâtiment */}
                  <polygon points={losange(0, 0)} fill="transparent" />
                  {agentsEnAttente?.has(o.id) && (
                    <g className="signe-vie" aria-hidden>
                      <ellipse className="signe-aura" cx={0} cy={-2} rx={22} ry={11} fill="none" stroke="#E7B04A" strokeWidth={1.5} />
                      <g className="signe-point" transform="translate(0 -46)">
                        <circle r={6} fill="#E7B04A" opacity={0.9} />
                        <path d="M -2.4 0 L -0.6 2 L 3 -2.2" stroke="#FBF8F1" strokeWidth={1.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                    </g>
                  )}
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

      {/* Perspective aérienne : le fond de l'île s'éclaircit légèrement */}
      <rect x={x0} y={y0 + H * 0.3} width={W} height={H * 0.55} fill="url(#haze)" pointerEvents="none" />
      {/* Vignette douce */}
      <rect x={x0} y={y0} width={W} height={H} fill="url(#vignette)" pointerEvents="none" />

      {/* Flux doré de la dernière chaîne, entre les deux bâtiments concernés */}
      {chaine && (() => {
        const de = placements.find((p) => p.id === chaine.deAgentId)
        const vers = placements.find((p) => p.id === chaine.versAgentId)
        if (!de || !vers) return null
        const a = iso(de.x, de.y)
        const b = iso(vers.x, vers.y)
        const mx = (a.sx + b.sx) / 2
        const my = (a.sy + b.sy) / 2 - 26
        const ang = (Math.atan2(b.sy - 20 - (my), b.sx - mx) * 180) / Math.PI
        return (
          <g className="flux" aria-hidden>
            <path
              className="flux-trait"
              d={`M ${a.sx} ${a.sy - 20} Q ${mx} ${my} ${b.sx} ${b.sy - 20}`}
              fill="none" stroke="#E7B04A" strokeWidth={3} strokeLinecap="round" strokeDasharray="2 7"
            />
            <g transform={`translate(${b.sx} ${b.sy - 20}) rotate(${ang})`}>
              <path className="flux-fleche" d="M -7 -4 L 0 0 L -7 4" fill="none" stroke="#E7B04A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          </g>
        )
      })()}

      {/* Badge d'élan, près de l'arbre */}
      {elan != null && (
        <g className="elan-badge" transform={`translate(${iso(0, 0).sx} ${iso(0, 0).sy - 96})`} aria-hidden>
          <rect x={-40} y={-14} width={80} height={26} rx={13} fill="#FBF8F1" stroke="#E7B04A" strokeWidth={1.5} />
          <text x={0} y={4} textAnchor="middle" fontFamily="Fraunces, serif" fontSize={14} fontWeight={600} fill="#7A5410">
            {formatElan(elan)} élan
          </text>
        </g>
      )}

      {/* Voile de météo, doux et léger : voilé réchauffe un peu, brume reste tendre */}
      {meteo !== 'soleil' && (
        <rect
          x={x0} y={y0} width={W} height={H}
          fill={meteo === 'brume' ? '#C6D1CD' : '#F0E8D4'}
          opacity={meteo === 'brume' ? 0.16 : 0.08}
          pointerEvents="none"
        />
      )}

      <Pollen {...cadre} />
    </svg>
  )
}
