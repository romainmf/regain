import type { Domaine, Tuile } from '../domain/types'

/** Demi-largeur et demi-hauteur d'une tuile en unités SVG. */
export const TW = 32
export const TH = 16
/** Épaisseur visible du socle de l'île. */
export const SOCLE = 14

export const COEUR = { x: 0, y: 0 }

/**
 * Répartition de départ 7×7 : 16 tuiles par domaine, le Cœur au fond de l'île
 * (coin arrière, d'où l'arbre veille sur tout). Ma boîte à gauche, Ma peau à
 * droite, Ma planète devant. La rivière descend droit au centre et sépare
 * Ma boîte de Ma peau avant de traverser Ma planète jusqu'à la mer.
 * Lignes = y, colonnes = x. B = boîte, P = peau, V = planète, C = Cœur.
 */
const CARTE_DEPART = [
  'CPPPPPP',
  'BBPPPPP',
  'BBBPPPV',
  'BBBPPVV',
  'BBBVVVV',
  'BBBVVVV',
  'BBVVVVV',
]

/**
 * Une seule rivière : elle naît d'une source au pied de l'arbre et descend
 * tout droit au centre de l'île (axe vertical à l'écran, x = y), serpentant
 * un peu, jusqu'à se jeter dans la mer en cascade à la pointe avant.
 * Coordonnées en coins de tuiles (x ± 0,5).
 */
export const RIVIERE = {
  source: [0.5, 0.5] as [number, number],
  cours: [
    [0.5, 0.5],
    [1.5, 1.5],
    [2.5, 2.5],
    [3.5, 3.5],
    [4.5, 4.5],
    [5.5, 5.5],
    [6.5, 6.5],
  ] as [number, number][],
}

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
