import type { Domaine, Tuile } from '../domain/types'

/** Demi-largeur et demi-hauteur d'une tuile en unités SVG. */
export const TW = 32
export const TH = 16
/** Épaisseur visible du socle de l'île. */
export const SOCLE = 14

export const COEUR = { x: 3, y: 3 }

/**
 * Répartition de départ 7×7 : 16 tuiles par domaine, le Cœur au centre.
 * Lignes = y, colonnes = x. B = boîte, P = peau, V = planète, C = Cœur.
 */
const CARTE_DEPART = [
  'BBBBPPP',
  'BBBBPPP',
  'BBBBPPP',
  'BBBCPPP',
  'BVVVPPP',
  'VVVVVVP',
  'VVVVVVV',
]

const LETTRE: Record<string, Tuile['zone']> = { B: 'boite', P: 'peau', V: 'planete', C: 'coeur' }

export function tuilesDeDepart(): Tuile[] {
  const tuiles: Tuile[] = []
  CARTE_DEPART.forEach((ligne, y) =>
    [...ligne].forEach((c, x) => tuiles.push({ x, y, zone: LETTRE[c] })),
  )
  return tuiles
}

/** Centre écran (sommet du losange + TH) d'une tuile de grille. */
export function iso(x: number, y: number): { sx: number; sy: number } {
  return { sx: (x - y) * TW, sy: (x + y) * TH }
}

/** Points du losange supérieur d'une tuile, centré sur iso(x,y). */
export function losange(x: number, y: number): string {
  const { sx, sy } = iso(x, y)
  return `${sx},${sy - TH} ${sx + TW},${sy} ${sx},${sy + TH} ${sx - TW},${sy}`
}

export function cle(x: number, y: number): string {
  return `${x},${y}`
}

/** Ordre de dessin : de l'arrière vers l'avant. */
export function profondeur(x: number, y: number): number {
  return x + y
}

export function bornes(tuiles: Tuile[]) {
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  for (const t of tuiles) {
    const { sx, sy } = iso(t.x, t.y)
    minX = Math.min(minX, sx - TW)
    maxX = Math.max(maxX, sx + TW)
    minY = Math.min(minY, sy - TH)
    maxY = Math.max(maxY, sy + TH + SOCLE)
  }
  return { minX, maxX, minY, maxY }
}

export const zonesDomaine = (z: Tuile['zone']): z is Domaine => z !== 'coeur'
