import type { Domaine } from '../../domain/types'
import { COULEUR } from '../../domain/couleurs'
import type { MeubleId } from '../Meubles'

/**
 * Mon île : la carte, la place de Brin, et les lieux que l'on y dispose
 * (trois maisons et un jardin). Tout ce qui est « géographie », sans dessin.
 */

// ——— La carte ———————————————————————————————————————————————————————————

const CARTE = [
  '..............',
  '.....GGGGG....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '..GGGGGGGGGGG.',
  '..GGGGGGGGGG..',
  '...GGGGGGGG...',
  '....GGGGG.....',
  '..............',
]

export type Terrain = 'sable' | 'herbe'
export interface TuileIle { x: number; y: number; terrain: Terrain }
export interface Pos { x: number; y: number }
export interface Ancre { x: number; y: number }

export const cle = (x: number, y: number) => `${x},${y}`
/** Terre de départ, avant tout agrandissement. */
export const terreDeDepart = (x: number, y: number) => CARTE[y]?.[x] === 'G'

/**
 * Tuiles d'agrandissement, achetées une par une dans la boutique : de la mer
 * qui devient terre, tout autour de l'île, en alternant les côtés. Chaque
 * tuile ajoutée repousse la plage : la tuile de sable d'à côté devient de l'herbe.
 */
export const EXPANSION_ILE: Pos[] = [
  { x: 0, y: 6 }, { x: 13, y: 6 }, { x: 6, y: 12 }, { x: 0, y: 5 }, { x: 13, y: 5 }, { x: 5, y: 12 },
  { x: 0, y: 7 }, { x: 13, y: 7 }, { x: 7, y: 12 }, { x: 3, y: 11 }, { x: 9, y: 11 }, { x: 1, y: 4 },
  { x: 13, y: 4 }, { x: 1, y: 8 }, { x: 13, y: 8 }, { x: 6, y: 0 },
]

export interface Ile {
  tuiles: TuileIle[]
  /** Vrai si la tuile est de la terre (départ ou achetée). */
  estTerre: (x: number, y: number) => boolean
  /** Eau peu profonde : les tuiles de mer qui touchent la plage. */
  fonds: Pos[]
}

/** L'île avec ses n premières tuiles achetées : plage sur le pourtour, herbe au milieu. */
export function construireIle(achetees = 0): Ile {
  const terres = new Set<string>()
  CARTE.forEach((ligne, y) => [...ligne].forEach((c, x) => { if (c === 'G') terres.add(cle(x, y)) }))
  EXPANSION_ILE.slice(0, Math.max(0, achetees)).forEach((p) => terres.add(cle(p.x, p.y)))
  const estTerre = (x: number, y: number) => terres.has(cle(x, y))

  const tuiles: TuileIle[] = []
  const fonds: Pos[] = []
  for (let y = -2; y <= CARTE.length + 1; y++) {
    for (let x = -2; x <= CARTE[0].length + 1; x++) {
      if (estTerre(x, y)) {
        const bord = !estTerre(x - 1, y) || !estTerre(x + 1, y) || !estTerre(x, y - 1) || !estTerre(x, y + 1)
        tuiles.push({ x, y, terrain: bord ? 'sable' : 'herbe' })
      } else {
        let voisin = false
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (estTerre(x + dx, y + dy)) voisin = true
        if (voisin) fonds.push({ x, y })
      }
    }
  }
  return { tuiles, estTerre, fonds }
}

/** La place de Brin, au centre : trois tuiles sur trois, réservées. */
export const PLACE = { x: 6, y: 6 }
export const placeTuiles = new Set<string>()
for (let y = PLACE.y - 1; y <= PLACE.y + 1; y++) for (let x = PLACE.x - 1; x <= PLACE.x + 1; x++) placeTuiles.add(cle(x, y))

/**
 * Les décors achetés ont été posés sur l'ancienne grille 9×9 : on les décale
 * pour qu'ils tombent sur l'herbe de l'île.
 */
export const DECALAGE_DECOR = 2

// ——— Les lieux ——————————————————————————————————————————————————————————

export type LieuId = 'atelier' | 'spa' | 'jardin' | 'maison'

export interface DefLieu {
  nom: string
  sousTitre: string
  genre: 'maison' | 'jardin'
  /** Côté de l'emprise, en tuiles. */
  taille: number
  domaine?: Domaine
  couleur: string
  toit: string
  mur: string
  /** Sol intérieur par défaut : deux teintes en damier. */
  sol: [string, string]
  murInt: string
}

export const LIEUX: Record<LieuId, DefLieu> = {
  atelier: { nom: 'L’Atelier', sousTitre: 'Ma boîte', genre: 'maison', taille: 2, domaine: 'boite', couleur: COULEUR.boite, toit: '#C46A3F', mur: '#F3E4CE', sol: ['#E8CDA8', '#DFBF96'], murInt: '#F3E6D2' },
  spa: { nom: 'Le Spa', sousTitre: 'Ma peau', genre: 'maison', taille: 2, domaine: 'peau', couleur: COULEUR.peau, toit: '#A96A8F', mur: '#F6EAF1', sol: ['#DCE9EA', '#CDE0E2'], murInt: '#F4E6ED' },
  jardin: { nom: 'Le Jardin', sousTitre: 'Ma planète', genre: 'jardin', taille: 3, domaine: 'planete', couleur: COULEUR.planete, toit: '#4F8A55', mur: '#D9EBDC', sol: ['#B9DCA3', '#ACD399'], murInt: '#D8EAF3' },
  maison: { nom: 'Ma maison', sousTitre: 'Chez toi', genre: 'maison', taille: 2, couleur: '#E7B04A', toit: '#D9A24B', mur: '#F6ECD8', sol: ['#E3B99A', '#D9AA89'], murInt: '#F7EEDC' },
}
export const ORDRE: LieuId[] = ['atelier', 'spa', 'jardin', 'maison']

export const POSITIONS_DEPART: Record<LieuId, Ancre> = {
  atelier: { x: 2, y: 5 },
  spa: { x: 8, y: 2 },
  jardin: { x: 8, y: 7 },
  maison: { x: 4, y: 9 },
}

/** Le lieu d'un domaine. */
export const lieuDe = (d: Domaine): LieuId => ORDRE.find((id) => LIEUX[id].domaine === d) ?? 'maison'

/** Emprise d'un lieu : un carré de `taille` tuiles de côté à partir de son ancre. */
export function emprise(a: Ancre, n: number): [number, number][] {
  const out: [number, number][] = []
  for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push([a.x + dx, a.y + dy])
  return out
}
/** Tuile devant la porte (ou le portillon), où le personnage s'arrête. */
export const devantPorte = (a: Ancre, n: number): Pos => ({ x: a.x + (n - 1) / 2, y: a.y + n - 0.05 })
export const dansPorte = (a: Ancre, n: number): Pos => ({ x: a.x + (n - 1) / 2, y: a.y + n - 0.65 })

/** Ce qui pousse et qui travaille dans la parcelle du jardin, en coordonnées locales (0..2). */
export const JARDIN_LOCAL: { x: number; y: number; meuble?: MeubleId; agent?: number }[] = [
  { x: 0, y: 0, meuble: 'ruche' },
  { x: 2, y: 0, meuble: 'arbre-fruitier' },
  { x: 1, y: 0, agent: 0 },
  { x: 0, y: 1, agent: 1 },
  { x: 2, y: 1, agent: 2 },
  { x: 0, y: 2, meuble: 'bac' },
  { x: 2, y: 2, meuble: 'bac' },
]

// ——— Les intérieurs ———————————————————————————————————————————————————————

export const LARGEUR = 6
export const PROFONDEUR = 5
export const HAUTEUR_MUR = 70

/** Un poste de travail dans la pièce, et la tuile d'où l'on s'adresse à l'agent. */
export interface Slot { x: number; y: number; ax: number; ay: number }

const SLOTS_BASE: Slot[] = [
  { x: 0, y: 1, ax: 1, ay: 1 }, { x: 2, y: 0, ax: 2, ay: 1 }, { x: 4, y: 0, ax: 4, ay: 1 }, { x: 0, y: 3, ax: 1, ay: 3 }, { x: 5, y: 2, ax: 4, ay: 2 },
  { x: 5, y: 4, ax: 4, ay: 4 }, { x: 3, y: 0, ax: 3, ay: 1 }, { x: 0, y: 2, ax: 1, ay: 2 },
]
/** Les postes d'un lieu pour n agents (huit au plus ; chez toi, aucun). */
export function slotsPour(lieu: LieuId, n: number): Slot[] {
  if (lieu === 'maison') return []
  return SLOTS_BASE.slice(0, Math.min(n, SLOTS_BASE.length))
}

export const MEUBLES_INT: Record<LieuId, { x: number; y: number; meuble: MeubleId }[]> = {
  atelier: [{ x: 0, y: 0, meuble: 'caisses' }, { x: 5, y: 0, meuble: 'etabli' }],
  spa: [{ x: 0, y: 0, meuble: 'plante' }, { x: 5, y: 0, meuble: 'transat' }],
  jardin: [{ x: 0, y: 0, meuble: 'ruche' }, { x: 5, y: 0, meuble: 'arbre-fruitier' }, { x: 5, y: 4, meuble: 'bac' }, { x: 0, y: 4, meuble: 'bac' }],
  maison: [{ x: 5, y: 3, meuble: 'plante' }],
}
/** Chez toi : le bureau du jour, où l'on relit ce que les agents ont préparé. */
export const BUREAU_MAISON: Slot = { x: 5, y: 1, ax: 4, ay: 1 }
export const ENTREE_INT: Pos = { x: 2.5, y: 4.4 }
