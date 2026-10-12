import type { Domaine, Tuile } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { TH, TW, cle, iso } from './iso'
import { BOIS, Eolienne, FEUILLE, nuance } from './buildings/primitives'

/**
 * « Un lieu par domaine, sur toute la zone » : chaque zone devient un grand
 * bâtiment ouvert (l'Atelier, le Spa, le Jardin) qui épouse ses tuiles.
 * À l'intérieur, le quadrillage reste visible pour poser les agents.
 *
 * Les murs sont personnalisables (matière), les couleurs de domaine non.
 * Façades hautes uniquement sur les bords extérieurs de l'île ; sur les
 * frontières entre lieux, de simples murets bas pour garder le centre ouvert.
 */

export type StyleMur = 'bois' | 'pierre' | 'verre' | 'vegetal' | 'terre' | 'bambou'

export interface DefStyleMur {
  nom: string
  fond: string
  poteau: string
  motif: 'planches' | 'pierres' | 'carreaux' | 'feuilles' | 'lisse' | 'tiges'
  opacite: number
  prix: number
}

export const STYLES_MUR: Record<StyleMur, DefStyleMur> = {
  bois: { nom: 'Bois', fond: '#D9B48E', poteau: BOIS, motif: 'planches', opacite: 0.95, prix: 0 },
  pierre: { nom: 'Pierre sèche', fond: '#CFC6B3', poteau: '#9A907C', motif: 'pierres', opacite: 0.95, prix: 60 },
  verre: { nom: 'Verrière', fond: '#D4EEE4', poteau: '#8FB8B0', motif: 'carreaux', opacite: 0.55, prix: 80 },
  vegetal: { nom: 'Mur végétal', fond: '#7FAE73', poteau: BOIS, motif: 'feuilles', opacite: 0.95, prix: 60 },
  terre: { nom: 'Terre crue', fond: '#D8A77C', poteau: '#A2714E', motif: 'lisse', opacite: 0.95, prix: 40 },
  bambou: { nom: 'Bambou', fond: '#E3D7A6', poteau: '#B9A86A', motif: 'tiges', opacite: 0.95, prix: 60 },
}

/** Murs par défaut de chaque lieu. */
export const MURS_DEFAUT: Record<Domaine, StyleMur> = { boite: 'bois', peau: 'verre', planete: 'vegetal' }

export type StyleSol = 'parquet' | 'carrelage' | 'gazon' | 'gravier' | 'terre' | 'tomettes'

export interface DefStyleSol {
  nom: string
  fond: string | null // null = garde la couleur du domaine
  motif: 'planches' | 'croisillons' | 'brins' | 'points' | 'rangs' | 'losanges'
  prix: number
}

export const STYLES_SOL: Record<StyleSol, DefStyleSol> = {
  parquet: { nom: 'Parquet', fond: null, motif: 'planches', prix: 0 },
  carrelage: { nom: 'Carrelage', fond: null, motif: 'croisillons', prix: 0 },
  terre: { nom: 'Terre cultivée', fond: null, motif: 'rangs', prix: 0 },
  gazon: { nom: 'Gazon', fond: '#B9D9A8', motif: 'brins', prix: 40 },
  gravier: { nom: 'Gravier clair', fond: '#E2DBC8', motif: 'points', prix: 40 },
  tomettes: { nom: 'Tomettes', fond: '#D9A27A', motif: 'losanges', prix: 60 },
}

/** Sols par défaut de chaque lieu. */
export const SOLS_DEFAUT: Record<Domaine, StyleSol> = { boite: 'parquet', peau: 'carrelage', planete: 'terre' }

type Pt = [number, number]
type Cote = 'bl' | 'br' | 'fl' | 'fr'

interface Arete {
  a: Pt
  b: Pt
  cote: Cote
  t: Tuile
  /** Vrai si de l'autre côté il n'y a plus d'île (bord extérieur). */
  exterieur: boolean
}

const NOM: Record<Domaine, string> = { boite: 'ATELIER', peau: 'SPA', planete: 'JARDIN' }

function aretesZone(tuiles: Tuile[], zone: Domaine): Arete[] {
  const toutes = new Set(tuiles.map((t) => cle(t.x, t.y)))
  const dansZone = new Set(tuiles.filter((t) => t.zone === zone).map((t) => cle(t.x, t.y)))
  const out: Arete[] = []
  const pousser = (t: Tuile, a: Pt, b: Pt, cote: Cote, vx: number, vy: number) => {
    const k = cle(vx, vy)
    if (!dansZone.has(k)) out.push({ a, b, cote, t, exterieur: !toutes.has(k) })
  }
  for (const t of tuiles) {
    if (t.zone !== zone) continue
    const { sx, sy } = iso(t.x, t.y)
    const haut: Pt = [sx, sy - TH], droite: Pt = [sx + TW, sy], bas: Pt = [sx, sy + TH], gauche: Pt = [sx - TW, sy]
    pousser(t, haut, droite, 'br', t.x, t.y - 1)
    pousser(t, gauche, haut, 'bl', t.x - 1, t.y)
    pousser(t, droite, bas, 'fr', t.x + 1, t.y)
    pousser(t, bas, gauche, 'fl', t.x, t.y + 1)
  }
  return out
}

const pts = (...p: Pt[]) => p.map((q) => q.join(',')).join(' ')
const lever = ([x, y]: Pt, h: number): Pt => [x, y - h]
const lerp = (a: Pt, b: Pt, u: number): Pt => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]

/** Un pan de mur stylé le long d'une arête, de hauteur h. */
function Mur({ a, b, h, style, ombre }: { a: Pt; b: Pt; h: number; style: DefStyleMur; ombre: boolean }) {
  const fond = ombre ? nuance(style.fond, -0.12) : style.fond
  const trait = nuance(style.fond, -0.3)
  const motif = (() => {
    switch (style.motif) {
      case 'planches':
        return [0.35, 0.7].map((u) => (
          <line key={u} x1={a[0]} y1={a[1] - h * u} x2={b[0]} y2={b[1] - h * u} stroke={trait} strokeWidth={0.6} opacity={0.7} />
        ))
      case 'pierres':
        return [0.25, 0.75].flatMap((row, r) =>
          [0.12, 0.42, 0.72].map((u) => {
            const p = lerp(a, b, u + (r ? 0.12 : 0))
            return <circle key={`${r}${u}`} cx={p[0]} cy={p[1] - h * row} r={1.6} fill={trait} opacity={0.35} />
          }),
        )
      case 'carreaux':
        return [0.25, 0.5, 0.75].map((u) => {
          const p = lerp(a, b, u)
          return <line key={u} x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - h} stroke="#FBF8F1" strokeWidth={0.8} opacity={0.9} />
        })
      case 'feuilles':
        return [0.15, 0.4, 0.65, 0.9].map((u, i) => {
          const p = lerp(a, b, u)
          return <circle key={u} cx={p[0]} cy={p[1] - h - 1} r={2.2} fill={i % 2 ? nuance(FEUILLE, 0.15) : nuance(FEUILLE, -0.05)} />
        })
      case 'tiges':
        return [0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((u) => {
          const p = lerp(a, b, u)
          return <line key={u} x1={p[0]} y1={p[1]} x2={p[0]} y2={p[1] - h} stroke={trait} strokeWidth={0.7} opacity={0.6} />
        })
      default:
        return <line x1={a[0]} y1={a[1] - 1} x2={b[0]} y2={b[1] - 1} stroke={trait} strokeWidth={0.8} opacity={0.4} />
    }
  })()
  return (
    <g>
      <polygon points={pts(a, b, lever(b, h), lever(a, h))} fill={fond} opacity={style.opacite} />
      {motif}
      <line x1={a[0]} y1={a[1] - h} x2={b[0]} y2={b[1] - h} stroke={nuance(style.fond, 0.3)} strokeWidth={1} />
    </g>
  )
}

/** Revêtement de sol d'une tuile, selon le style choisi ; le bassin du Spa reste. */
function SolLieu({ t, style, bassin }: { t: Tuile; style: DefStyleSol; bassin: boolean }) {
  const { sx, sy } = iso(t.x, t.y)
  if (bassin) {
    return (
      <g>
        <polygon points={pts([sx, sy - TH + 2], [sx + TW - 3, sy], [sx, sy + TH - 2], [sx - TW + 3, sy])} fill="#BFDCE0" stroke="#F4EAD5" strokeWidth={1.4} />
        <path className="source-ride" d={`M ${sx - 8} ${sy} q 4 -3 8 0 q 4 3 8 0`} stroke="#FBF8F1" strokeWidth={0.9} fill="none" opacity={0.8} />
      </g>
    )
  }
  const fond = style.fond ? (
    <polygon points={pts([sx, sy - TH], [sx + TW, sy], [sx, sy + TH], [sx - TW, sy])} fill={style.fond} opacity={0.85} />
  ) : null
  const trait = style.fond ? nuance(style.fond, -0.25) : 'rgba(34,48,31,.22)'
  switch (style.motif) {
    case 'planches':
      return (
        <g>{fond}<g stroke={trait} strokeWidth={0.7} opacity={0.6}>
          {[0.25, 0.5, 0.75].map((u) => <line key={u} x1={sx - TW + TW * u} y1={sy - TH * u} x2={sx + TW * u} y2={sy + TH - TH * u} />)}
        </g></g>
      )
    case 'croisillons':
      return (
        <g>{fond}<g stroke="#FBF8F1" strokeWidth={0.6} opacity={0.7}>
          <line x1={sx - TW / 2} y1={sy - TH / 2} x2={sx + TW / 2} y2={sy + TH / 2} />
          <line x1={sx + TW / 2} y1={sy - TH / 2} x2={sx - TW / 2} y2={sy + TH / 2} />
        </g></g>
      )
    case 'rangs':
      return (
        <g>{fond}<g stroke="#8A6A4A" strokeWidth={1.1} strokeDasharray="2 2" opacity={0.5}>
          {[0.3, 0.6].map((u) => <line key={u} x1={sx - TW + TW * u} y1={sy - TH * u} x2={sx + TW * u} y2={sy + TH - TH * u} />)}
        </g></g>
      )
    case 'brins':
      return (
        <g>{fond}<g stroke={nuance(FEUILLE, -0.1)} strokeWidth={1} strokeLinecap="round" opacity={0.7}>
          {[[-8, 2], [4, -3], [10, 4], [-2, 6]].map(([x, y]) => <line key={`${x}${y}`} x1={sx + x} y1={sy + y} x2={sx + x + 1} y2={sy + y - 4} />)}
        </g></g>
      )
    case 'points':
      return (
        <g>{fond}<g fill={trait} opacity={0.5}>
          {[[-10, 1], [-3, -4], [5, 3], [11, -2], [1, 7]].map(([x, y]) => <circle key={`${x}${y}`} cx={sx + x} cy={sy + y} r={0.9} />)}
        </g></g>
      )
    case 'losanges':
      return (
        <g>{fond}<polygon points={pts([sx, sy - TH / 2], [sx + TW / 2, sy], [sx, sy + TH / 2], [sx - TW / 2, sy])} fill="none" stroke={trait} strokeWidth={0.6} opacity={0.6} /></g>
      )
  }
}

interface PropsLieux {
  tuiles: Tuile[]
  /** Matière des murs de chaque lieu. */
  murs?: Record<Domaine, StyleMur>
  /** Revêtement de sol de chaque lieu. */
  sols?: Record<Domaine, StyleSol>
}

/** Couche basse : sols et murets (bas sur les frontières, un peu plus hauts dehors). */
export function LieuxSol({ tuiles, murs = MURS_DEFAUT, sols = SOLS_DEFAUT }: PropsLieux) {
  const zones: Domaine[] = ['boite', 'peau', 'planete']
  const peau = tuiles.filter((t) => t.zone === 'peau')
  const centre = peau.reduce((s, t) => [s[0] + t.x / peau.length, s[1] + t.y / peau.length], [0, 0])
  const bassin = new Set(
    [...peau]
      .sort((a, b) => Math.hypot(a.x - centre[0], a.y - centre[1]) - Math.hypot(b.x - centre[0], b.y - centre[1]))
      .slice(0, 3)
      .map((t) => cle(t.x, t.y)),
  )
  return (
    <g aria-hidden>
      {tuiles.filter((t) => t.zone !== 'coeur').map((t) => (
        <SolLieu key={cle(t.x, t.y)} t={t} style={STYLES_SOL[sols[t.zone as Domaine]]} bassin={bassin.has(cle(t.x, t.y))} />
      ))}
      {zones.map((z) => {
        const style = STYLES_MUR[murs[z]]
        return (
          <g key={z}>
            {aretesZone(tuiles, z).map((ar, i) => {
              const h = ar.exterieur ? 9 : 5
              return (
                <g key={i}>
                  <Mur a={ar.a} b={ar.b} h={h} style={style} ombre={ar.cote.startsWith('f')} />
                  <rect x={ar.a[0] - 1} y={ar.a[1] - h - 4} width={2} height={h + 4} fill={style.poteau} />
                </g>
              )
            })}
          </g>
        )
      })}
    </g>
  )
}

/** Couche haute : façade sur les bords extérieurs du fond, enseignes aux angles, signatures. */
export function LieuxHaut({ tuiles, murs = MURS_DEFAUT }: PropsLieux) {
  const zones: Domaine[] = ['boite', 'peau', 'planete']
  const H = 38
  return (
    <g aria-hidden>
      {zones.map((z) => {
        const c = COULEUR[z]
        const style = STYLES_MUR[murs[z]]
        const aretes = aretesZone(tuiles, z)
        const facade = aretes.filter((ar) => ar.exterieur && (ar.cote === 'bl' || ar.cote === 'br'))
        const exterieures = aretes.filter((ar) => ar.exterieur)
        // Enseigne : au sommet extérieur le plus éloigné du Cœur (angle du lieu)
        const sommets = exterieures.flatMap((ar) => [ar.a, ar.b])
        const coeur = iso(0, 0)
        const angle = sommets.reduce<Pt | null>((m, p) => (!m || Math.hypot(p[0] - coeur.sx, p[1] - coeur.sy) > Math.hypot(m[0] - coeur.sx, m[1] - coeur.sy) ? p : m), null)
        return (
          <g key={z}>
            {facade.map((ar, i) => {
              const a2 = lever(ar.a, H), b2 = lever(ar.b, H)
              return (
                <g key={i}>
                  {/* Pan de mur haut, dans la matière choisie, derrière la toiture */}
                  <Mur a={lever(ar.a, 9)} b={lever(ar.b, 9)} h={H - 9} style={{ ...style, opacite: style.opacite * 0.85 }} ombre={false} />
                  {/* Toiture signature */}
                  {z === 'boite' && <polygon points={pts(a2, b2, lever(b2, 8), lever(a2, 8))} fill="#2D4B5C" stroke="#6E93A3" strokeWidth={0.6} />}
                  {z === 'peau' && <polygon points={pts(a2, b2, lever(b2, 9), lever(a2, 9))} fill="#F4EAD5" stroke={nuance(c, 0.3)} strokeWidth={0.8} />}
                  {z === 'planete' && <polygon points={pts(a2, b2, lever(b2, 10), lever(a2, 10))} fill="#CFE6E0" stroke="#FBF8F1" strokeWidth={0.8} opacity={0.85} />}
                  <line x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke={style.poteau} strokeWidth={2.2} />
                  <rect x={ar.a[0] - 1.5} y={ar.a[1] - H} width={3} height={H} fill={style.poteau} />
                </g>
              )
            })}
            {/* Enseigne sur poteau, à l'angle extérieur */}
            {angle && (
              <g transform={`translate(${angle[0]} ${angle[1]})`}>
                <rect x={-1.2} y={-34} width={2.4} height={34} fill={style.poteau} />
                <rect x={-27} y={-46} width={54} height={16} rx={8} fill={c} />
                <text x={0} y={-34.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={8.5} fontWeight={700} fill="#FBF8F1" letterSpacing={1.2}>
                  {NOM[z]}
                </text>
              </g>
            )}
            {/* Vapeur du spa */}
            {z === 'peau' && (() => {
              const peau = tuiles.filter((t) => t.zone === 'peau')
              const cx = Math.round(peau.reduce((s, t) => s + t.x, 0) / peau.length)
              const cy = Math.round(peau.reduce((s, t) => s + t.y, 0) / peau.length)
              const { sx, sy } = iso(cx, cy)
              return (
                <g className="vapeur" stroke="#FBF8F1" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.85}>
                  <path d={`M ${sx - 6} ${sy - 4} q -3 -6 0 -12`} />
                  <path d={`M ${sx + 2} ${sy - 6} q 3 -6 0 -12`} />
                  <path d={`M ${sx + 9} ${sy - 3} q -3 -5 0 -10`} />
                </g>
              )
            })()}
            {/* Éolienne du jardin, à son angle */}
            {z === 'planete' && angle && (
              <g transform={`translate(${angle[0] + 10} ${angle[1] - 2})`}>
                <Eolienne h={24} echelle={0.75} />
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}
