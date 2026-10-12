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

/** Revêtement de sol d'une tuile, selon le style choisi. */
function SolLieu({ t, style }: { t: Tuile; style: DefStyleSol }) {
  const { sx, sy } = iso(t.x, t.y)
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

const ZONES: Domaine[] = ['boite', 'peau', 'planete']
/** Hauteur de la façade du fond. */
const H = 38

/** Clé géométrique d'une arête, identique vue des deux côtés. */
const cleArete = (a: Pt, b: Pt) => [a, b].map((p) => p.join(',')).sort().join('|')

/**
 * Portes entre lieux : sur chaque frontière, l'arête la plus proche du milieu
 * de la frontière reste ouverte (pas de muret, une arche à la place).
 */
function portes(tuiles: Tuile[]): Set<string> {
  const parArete = new Map<string, { zones: Set<Domaine>; m: Pt }>()
  for (const z of ZONES) {
    for (const ar of aretesZone(tuiles, z)) {
      if (ar.exterieur) continue
      const k = cleArete(ar.a, ar.b)
      const e = parArete.get(k) ?? { zones: new Set<Domaine>(), m: lerp(ar.a, ar.b, 0.5) }
      e.zones.add(z)
      parArete.set(k, e)
    }
  }
  const parPaire = new Map<string, { k: string; m: Pt }[]>()
  for (const [k, e] of parArete) {
    if (e.zones.size !== 2) continue
    const paire = [...e.zones].sort().join('+')
    parPaire.set(paire, [...(parPaire.get(paire) ?? []), { k, m: e.m }])
  }
  const out = new Set<string>()
  for (const aretes of parPaire.values()) {
    const milieu: Pt = [aretes.reduce((s, a) => s + a.m[0], 0) / aretes.length, aretes.reduce((s, a) => s + a.m[1], 0) / aretes.length]
    const proche = aretes.reduce((p, a) => (Math.hypot(a.m[0] - milieu[0], a.m[1] - milieu[1]) < Math.hypot(p.m[0] - milieu[0], p.m[1] - milieu[1]) ? a : p))
    out.add(proche.k)
  }
  return out
}

/** Quadrilatère dessiné dans le plan d'un mur (u le long de l'arête, z en hauteur). */
function quad(a: Pt, b: Pt, u0: number, u1: number, z0: number, z1: number) {
  return pts(lever(lerp(a, b, u0), z0), lever(lerp(a, b, u1), z0), lever(lerp(a, b, u1), z1), lever(lerp(a, b, u0), z1))
}

/** Arche fleurie au-dessus d'une porte entre deux lieux. */
function Arche({ a, b, couleur }: { a: Pt; b: Pt; couleur: string }) {
  const h = 26
  const m = lever(lerp(a, b, 0.5), h + 8)
  return (
    <g>
      <rect x={a[0] - 1.2} y={a[1] - h} width={2.4} height={h} fill={BOIS} />
      <rect x={b[0] - 1.2} y={b[1] - h} width={2.4} height={h} fill={BOIS} />
      <path d={`M ${a[0]} ${a[1] - h} Q ${m[0]} ${m[1]} ${b[0]} ${b[1] - h}`} stroke={BOIS} strokeWidth={2.2} fill="none" />
      {[0.2, 0.45, 0.7, 0.9].map((u, i) => {
        const p = lever(lerp(a, b, u), h + 6 - Math.abs(u - 0.5) * 10)
        return <circle key={u} cx={p[0]} cy={p[1]} r={2.1} fill={i % 2 ? couleur : nuance(FEUILLE, 0.1)} />
      })}
    </g>
  )
}

/** Un pan de façade du fond : matière, auvent, et ce qu'on accroche au mur selon le lieu. */
function Facade({ ar, z, style, i }: { ar: Arete; z: Domaine; style: DefStyleMur; i: number }) {
  const { a, b } = ar
  const c = COULEUR[z]
  // Auvent : débord d'un demi-tuile vers l'intérieur, légèrement en pente.
  const dedans: Pt = ar.cote === 'bl' ? [TW / 2, TH / 2] : [-TW / 2, TH / 2]
  const a2 = lever(a, H), b2 = lever(b, H)
  const a3: Pt = [a[0] + dedans[0], a[1] + dedans[1] - (H - 7)]
  const b3: Pt = [b[0] + dedans[0], b[1] + dedans[1] - (H - 7)]
  const detail = (() => {
    if (z === 'boite') {
      switch (i % 3) {
        case 0: // Grande fenêtre d'atelier à croisillons, lumière chaude
          return (
            <g>
              <polygon points={quad(a, b, 0.18, 0.82, 16, 32)} fill="#F6E6C2" stroke={style.poteau} strokeWidth={1} />
              <line x1={lerp(a, b, 0.5)[0]} y1={lerp(a, b, 0.5)[1] - 16} x2={lerp(a, b, 0.5)[0]} y2={lerp(a, b, 0.5)[1] - 32} stroke={style.poteau} strokeWidth={0.8} />
              <polygon points={quad(a, b, 0.18, 0.82, 24, 24.8)} fill={style.poteau} />
            </g>
          )
        case 1: // Panneau à outils
          return (
            <g>
              <polygon points={quad(a, b, 0.15, 0.85, 14, 30)} fill={nuance(style.fond, -0.18)} opacity={0.9} />
              {[0.28, 0.5, 0.72].map((u, k) => (
                <polygon key={u} points={quad(a, b, u - 0.04, u + 0.04, 17 + k * 2, 27 - k)} fill={k === 1 ? c : '#5C6B73'} />
              ))}
            </g>
          )
        default: // Étagère avec bocaux
          return (
            <g>
              <polygon points={quad(a, b, 0.12, 0.88, 20, 21.5)} fill={style.poteau} />
              {[0.25, 0.42, 0.6, 0.78].map((u, k) => (
                <polygon key={u} points={quad(a, b, u - 0.05, u + 0.05, 21.5, 27 + (k % 2) * 2)} fill={['#E7B04A', c, '#9EC3CF', '#F4EAD5'][k]} opacity={0.9} />
              ))}
            </g>
          )
      }
    }
    if (z === 'peau') {
      switch (i % 2) {
        case 0: { // Hublot rond et bougie
          const p = lever(lerp(a, b, 0.5), 25)
          return (
            <g>
              <ellipse cx={p[0]} cy={p[1]} rx={6.5} ry={6.5} fill="#F6E6C2" stroke={style.poteau} strokeWidth={1.2} />
              <polygon points={quad(a, b, 0.3, 0.7, 24.5, 25.5)} fill={style.poteau} />
            </g>
          )
        }
        default: // Serviettes pliées sur une tablette, lanterne
          return (
            <g>
              <polygon points={quad(a, b, 0.2, 0.8, 19, 20.5)} fill={style.poteau} />
              <polygon points={quad(a, b, 0.26, 0.5, 20.5, 25)} fill="#FBF8F1" />
              <polygon points={quad(a, b, 0.52, 0.76, 20.5, 25)} fill={nuance(c, 0.5)} />
              <polygon points={quad(a, b, 0.26, 0.76, 22.6, 23)} fill={nuance(c, 0.2)} opacity={0.6} />
              <circle cx={lerp(a, b, 0.5)[0]} cy={lerp(a, b, 0.5)[1] - 31} r={2.4} fill="#E7B04A" opacity={0.9} />
            </g>
          )
      }
    }
    return null
  })()
  return (
    <g>
      <Mur a={lever(a, 9)} b={lever(b, 9)} h={H - 9} style={{ ...style, opacite: Math.min(1, style.opacite + 0.1) }} ombre={false} />
      {detail}
      {/* Auvent : ardoise et panneaux solaires pour l'atelier, toile claire pour le spa */}
      {z === 'boite' ? (
        <g>
          <polygon points={pts(a2, b2, b3, a3)} fill="#2D4B5C" />
          <polygon points={pts(lerp(a2, b2, 0.15), lerp(a2, b2, 0.85), lerp(a3, b3, 0.85), lerp(a3, b3, 0.15))} fill="#3A5E72" stroke="#6E93A3" strokeWidth={0.6} />
          <line x1={lerp(a2, b2, 0.5)[0]} y1={lerp(a2, b2, 0.5)[1]} x2={lerp(a3, b3, 0.5)[0]} y2={lerp(a3, b3, 0.5)[1]} stroke="#6E93A3" strokeWidth={0.6} />
        </g>
      ) : (
        <g>
          <polygon points={pts(a2, b2, b3, a3)} fill="#F4EAD5" />
          {[0.25, 0.5, 0.75].map((u) => (
            <line key={u} x1={lerp(a2, b2, u)[0]} y1={lerp(a2, b2, u)[1]} x2={lerp(a3, b3, u)[0]} y2={lerp(a3, b3, u)[1]} stroke={nuance(c, 0.45)} strokeWidth={2.2} />
          ))}
        </g>
      )}
      <line x1={a3[0]} y1={a3[1]} x2={b3[0]} y2={b3[1]} stroke={style.poteau} strokeWidth={1.6} />
      <line x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke={nuance(style.fond, 0.3)} strokeWidth={1} />
      <rect x={a[0] - 1.5} y={a[1] - H} width={3} height={H} fill={style.poteau} />
      <rect x={b[0] - 1.5} y={b[1] - H} width={3} height={H} fill={style.poteau} />
    </g>
  )
}

/** Bassin du Spa : margelle en pierre claire, eau profonde au centre, échelle. */
function Bassin({ tuiles }: { tuiles: Tuile[] }) {
  const p = tuiles.map((t) => iso(t.x, t.y))
  return (
    <g>
      {p.map(({ sx, sy }, i) => (
        <polygon key={i} points={pts([sx, sy - TH + 1], [sx + TW - 2, sy], [sx, sy + TH - 1], [sx - TW + 2, sy])} fill="#E9E2D0" />
      ))}
      {p.map(({ sx, sy }, i) => (
        <polygon key={i} points={pts([sx, sy - TH + 4], [sx + TW - 7, sy], [sx, sy + TH - 4], [sx - TW + 7, sy])} fill="#9FCBD1" />
      ))}
      {p.map(({ sx, sy }, i) => (
        <g key={i}>
          <ellipse cx={sx - 4} cy={sy - 1} rx={9} ry={3.5} fill="#BFDCE0" />
          <path className="source-ride" d={`M ${sx - 8} ${sy} q 4 -3 8 0 q 4 3 8 0`} stroke="#FBF8F1" strokeWidth={0.9} fill="none" opacity={0.85} />
          <circle cx={sx + 9} cy={sy + 3} r={1.6} fill={nuance(COULEUR.peau, 0.4)} />
        </g>
      ))}
      {/* Échelle au bord de la première tuile */}
      {p[0] && (
        <g stroke="#9A907C" strokeWidth={1.2} strokeLinecap="round">
          <line x1={p[0].sx + 18} y1={p[0].sy - 2} x2={p[0].sx + 18} y2={p[0].sy - 12} />
          <line x1={p[0].sx + 23} y1={p[0].sy + 0.5} x2={p[0].sx + 23} y2={p[0].sy - 9.5} />
          <line x1={p[0].sx + 18} y1={p[0].sy - 8} x2={p[0].sx + 23} y2={p[0].sy - 5.5} />
        </g>
      )}
    </g>
  )
}

/** Tuiles du bassin : les trois plus proches du centre du Spa. */
export function tuilesBassin(tuiles: Tuile[]): Tuile[] {
  const peau = tuiles.filter((t) => t.zone === 'peau')
  const centre = peau.reduce((s, t) => [s[0] + t.x / peau.length, s[1] + t.y / peau.length], [0, 0])
  return [...peau]
    .sort((a, b) => Math.hypot(a.x - centre[0], a.y - centre[1]) - Math.hypot(b.x - centre[0], b.y - centre[1]))
    .slice(0, 3)
}

/**
 * Couche basse, dessinée avant les bâtiments : sols, façades du fond avec
 * leur auvent, murets sur les frontières, portes avec arche.
 */
export function LieuxSol({ tuiles, murs = MURS_DEFAUT, sols = SOLS_DEFAUT }: PropsLieux) {
  const bassin = tuilesBassin(tuiles)
  const bassinCles = new Set(bassin.map((t) => cle(t.x, t.y)))
  const ouvertes = portes(tuiles)
  const archesFaites = new Set<string>()
  return (
    <g aria-hidden>
      {tuiles.filter((t) => t.zone !== 'coeur' && !bassinCles.has(cle(t.x, t.y))).map((t) => (
        <SolLieu key={cle(t.x, t.y)} t={t} style={STYLES_SOL[sols[t.zone as Domaine]]} />
      ))}
      <Bassin tuiles={bassin} />
      {ZONES.map((z) => {
        const style = STYLES_MUR[murs[z]]
        const aretes = aretesZone(tuiles, z)
        return (
          <g key={z}>
            {aretes.map((ar, i) => {
              const k = cleArete(ar.a, ar.b)
              if (ouvertes.has(k)) {
                if (archesFaites.has(k)) return null
                archesFaites.add(k)
                return <Arche key={i} a={ar.a} b={ar.b} couleur={COULEUR[z]} />
              }
              const h = ar.exterieur ? 9 : 5
              return (
                <g key={i}>
                  <Mur a={ar.a} b={ar.b} h={h} style={style} ombre={ar.cote.startsWith('f')} />
                  <rect x={ar.a[0] - 1} y={ar.a[1] - h - 4} width={2} height={h + 4} fill={style.poteau} />
                </g>
              )
            })}
            {aretes
              .filter((ar) => ar.exterieur && (ar.cote === 'bl' || ar.cote === 'br'))
              .map((ar, i) => <Facade key={`f${i}`} ar={ar} z={z} style={style} i={i} />)}
          </g>
        )
      })}
    </g>
  )
}

/** Couche haute, après les bâtiments : enseignes aux angles, vapeur du spa, éolienne. */
export function LieuxHaut({ tuiles, murs = MURS_DEFAUT }: PropsLieux) {
  return (
    <g aria-hidden>
      {ZONES.map((z) => {
        const c = COULEUR[z]
        const style = STYLES_MUR[murs[z]]
        const exterieures = aretesZone(tuiles, z).filter((ar) => ar.exterieur)
        // Enseigne : au sommet extérieur le plus éloigné du Cœur (angle du lieu)
        const sommets = exterieures.flatMap((ar) => [ar.a, ar.b])
        const coeur = iso(0, 0)
        const angle = sommets.reduce<Pt | null>((m, p) => (!m || Math.hypot(p[0] - coeur.sx, p[1] - coeur.sy) > Math.hypot(m[0] - coeur.sx, m[1] - coeur.sy) ? p : m), null)
        return (
          <g key={z}>
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
