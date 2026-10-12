import type { Domaine, Tuile } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { TH, TW, cle, iso } from './iso'
import { BOIS, Eolienne, nuance } from './buildings/primitives'

/**
 * « Les lieux sur tout le domaine » : chaque zone devient un grand bâtiment
 * ouvert (l'Atelier, le Spa, le Jardin couvert) qui épouse exactement ses
 * tuiles. À l'intérieur, le quadrillage reste visible pour poser les agents.
 *
 * Deux couches : le sol et l'enceinte (sous les bâtiments), puis la façade
 * (colonnes, poutres, toiture signature) au-dessus, sur les bords du fond
 * seulement, pour ne jamais masquer l'intérieur.
 */

type Pt = [number, number]
type Cote = 'bl' | 'br' | 'fl' | 'fr' // back-left, back-right, front-left, front-right

interface Arete {
  a: Pt
  b: Pt
  cote: Cote
  t: Tuile
}

const NOM: Record<Domaine, string> = { boite: 'ATELIER', peau: 'SPA', planete: 'JARDIN' }

/** Arêtes de bordure d'une zone : celles dont le voisin n'est pas de la même zone. */
function aretesZone(tuiles: Tuile[], zone: Domaine): Arete[] {
  const dansZone = new Set(tuiles.filter((t) => t.zone === zone).map((t) => cle(t.x, t.y)))
  const out: Arete[] = []
  for (const t of tuiles) {
    if (t.zone !== zone) continue
    const { sx, sy } = iso(t.x, t.y)
    const haut: Pt = [sx, sy - TH], droite: Pt = [sx + TW, sy], bas: Pt = [sx, sy + TH], gauche: Pt = [sx - TW, sy]
    if (!dansZone.has(cle(t.x, t.y - 1))) out.push({ a: haut, b: droite, cote: 'br', t })
    if (!dansZone.has(cle(t.x - 1, t.y))) out.push({ a: gauche, b: haut, cote: 'bl', t })
    if (!dansZone.has(cle(t.x + 1, t.y))) out.push({ a: droite, b: bas, cote: 'fr', t })
    if (!dansZone.has(cle(t.x, t.y + 1))) out.push({ a: bas, b: gauche, cote: 'fl', t })
  }
  return out
}

const pts = (...p: Pt[]) => p.map((q) => q.join(',')).join(' ')
const lever = ([x, y]: Pt, h: number): Pt => [x, y - h]

/** Sol typé par lieu (planches, dallage et bassin, rangs de culture). */
function SolLieu({ t, zone, bassin }: { t: Tuile; zone: Domaine; bassin: boolean }) {
  const { sx, sy } = iso(t.x, t.y)
  if (zone === 'boite') {
    // Planches de bois, parallèles au bord avant-gauche
    return (
      <g stroke={nuance('#D9B48E', -0.18)} strokeWidth={0.7} opacity={0.6}>
        {[0.25, 0.5, 0.75].map((u) => (
          <line key={u} x1={sx - TW + TW * u} y1={sy - TH * u} x2={sx + TW * u} y2={sy + TH - TH * u} />
        ))}
      </g>
    )
  }
  if (zone === 'peau') {
    if (bassin) {
      return (
        <g>
          <polygon points={pts([sx, sy - TH + 2], [sx + TW - 3, sy], [sx, sy + TH - 2], [sx - TW + 3, sy])} fill="#BFDCE0" stroke="#F4EAD5" strokeWidth={1.4} />
          <path className="source-ride" d={`M ${sx - 8} ${sy} q 4 -3 8 0 q 4 3 8 0`} stroke="#FBF8F1" strokeWidth={0.9} fill="none" opacity={0.8} />
        </g>
      )
    }
    // Dallage clair
    return (
      <g stroke="#FBF8F1" strokeWidth={0.6} opacity={0.7}>
        <line x1={sx - TW / 2} y1={sy - TH / 2} x2={sx + TW / 2} y2={sy + TH / 2} />
        <line x1={sx + TW / 2} y1={sy - TH / 2} x2={sx - TW / 2} y2={sy + TH / 2} />
      </g>
    )
  }
  // Rangs de culture
  return (
    <g stroke="#8A6A4A" strokeWidth={1.1} strokeDasharray="2 2" opacity={0.5}>
      {[0.3, 0.6].map((u) => (
        <line key={u} x1={sx - TW + TW * u} y1={sy - TH * u} x2={sx + TW * u} y2={sy + TH - TH * u} />
      ))}
    </g>
  )
}

/** Couche basse : sols et enceinte (muret + poteaux). À dessiner sous les bâtiments. */
export function LieuxSol({ tuiles }: { tuiles: Tuile[] }) {
  const zones: Domaine[] = ['boite', 'peau', 'planete']
  // Bassin du Spa : les deux tuiles les plus centrales de la zone peau
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
        <SolLieu key={cle(t.x, t.y)} t={t} zone={t.zone as Domaine} bassin={bassin.has(cle(t.x, t.y))} />
      ))}
      {zones.map((z) => {
        const c = COULEUR[z]
        const mur = z === 'boite' ? nuance(c, 0.35) : z === 'peau' ? '#F1E4EA' : nuance(c, 0.55)
        const aretes = aretesZone(tuiles, z)
        const h = 7
        return (
          <g key={z}>
            {aretes.map((ar, i) => (
              <g key={i}>
                <polygon points={pts(ar.a, ar.b, lever(ar.b, h), lever(ar.a, h))} fill={ar.cote.startsWith('f') ? nuance(mur, -0.12) : mur} opacity={ar.cote.startsWith('f') ? 0.92 : 0.7} />
                <line x1={ar.a[0]} y1={ar.a[1] - h} x2={ar.b[0]} y2={ar.b[1] - h} stroke={nuance(mur, 0.3)} strokeWidth={1} />
                <rect x={ar.a[0] - 1} y={ar.a[1] - h - 5} width={2} height={h + 5} fill={BOIS} />
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )
}

/** Couche haute : colonnes, poutres et toiture signature sur les bords du fond. */
export function LieuxHaut({ tuiles }: { tuiles: Tuile[] }) {
  const zones: Domaine[] = ['boite', 'peau', 'planete']
  const H = 40
  return (
    <g aria-hidden>
      {zones.map((z) => {
        const c = COULEUR[z]
        const fond = aretesZone(tuiles, z).filter((ar) => ar.cote === 'bl' || ar.cote === 'br')
        // Enseigne : au-dessus de l'arête du fond la plus haute à l'écran
        const plusHaut = fond.reduce<Arete | null>((m, ar) => (!m || ar.a[1] + ar.b[1] < m.a[1] + m.b[1] ? ar : m), null)
        return (
          <g key={z}>
            {fond.map((ar, i) => {
              const a2 = lever(ar.a, H), b2 = lever(ar.b, H)
              return (
                <g key={i}>
                  {/* Toiture signature au-dessus de l'arête du fond */}
                  {z === 'boite' && (
                    <polygon points={pts(a2, b2, lever(b2, 8), lever(a2, 8))} fill="#2D4B5C" stroke="#6E93A3" strokeWidth={0.6} opacity={0.95} />
                  )}
                  {z === 'peau' && (
                    <polygon points={pts(a2, b2, lever(b2, 9), lever(a2, 9))} fill="#F4EAD5" stroke={nuance(c, 0.3)} strokeWidth={0.8} opacity={0.95} />
                  )}
                  {z === 'planete' && (
                    <polygon points={pts(a2, b2, lever(b2, 10), lever(a2, 10))} fill="#CFE6E0" stroke="#FBF8F1" strokeWidth={0.8} opacity={0.85} />
                  )}
                  {/* Poutre et colonne */}
                  <line x1={a2[0]} y1={a2[1]} x2={b2[0]} y2={b2[1]} stroke={BOIS} strokeWidth={2.2} />
                  <rect x={ar.a[0] - 1.5} y={ar.a[1] - H} width={3} height={H} fill={BOIS} />
                </g>
              )
            })}
            {/* Enseigne du lieu */}
            {plusHaut && (() => {
              const mx = (plusHaut.a[0] + plusHaut.b[0]) / 2
              const my = (plusHaut.a[1] + plusHaut.b[1]) / 2 - H - 16
              return (
                <g transform={`translate(${mx} ${my})`}>
                  <rect x={-30} y={-9} width={60} height={18} rx={9} fill={c} />
                  <text x={0} y={4} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={9} fontWeight={700} fill="#FBF8F1" letterSpacing={1.2}>
                    {NOM[z]}
                  </text>
                </g>
              )
            })()}
            {/* Vapeur du spa, éolienne du jardin */}
            {z === 'peau' && (() => {
              const peau = tuiles.filter((t) => t.zone === 'peau')
              const cx = peau.reduce((s, t) => s + t.x, 0) / peau.length
              const cy = peau.reduce((s, t) => s + t.y, 0) / peau.length
              const { sx, sy } = iso(Math.round(cx), Math.round(cy))
              return (
                <g className="vapeur" stroke="#FBF8F1" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.85}>
                  <path d={`M ${sx - 6} ${sy - 4} q -3 -6 0 -12`} />
                  <path d={`M ${sx + 2} ${sy - 6} q 3 -6 0 -12`} />
                  <path d={`M ${sx + 9} ${sy - 3} q -3 -5 0 -10`} />
                </g>
              )
            })()}
            {z === 'planete' && plusHaut && (
              <g transform={`translate(${plusHaut.b[0]} ${plusHaut.b[1]})`}>
                <Eolienne h={26} echelle={0.8} />
              </g>
            )}
          </g>
        )
      })}
    </g>
  )
}
