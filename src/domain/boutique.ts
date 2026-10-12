/** Catalogue de la boutique : ambiances, décor, tuiles. Prix en graines. */

export type AmbianceId = 'jour' | 'nuit' | 'automne' | 'hiver'

export interface Ambiance {
  id: AmbianceId
  nom: string
  prix: number // 0 = offerte
  /** Voile posé sur l'île (couleur + opacité). */
  voile?: { couleur: string; opacite: number }
  /** Teinte du ciel (dégradé haut → bas). */
  ciel?: [string, string, string]
  /** Astre : soleil le jour, lune la nuit. */
  astre: 'soleil' | 'lune'
  /** Petits éléments d'ambiance. */
  etoiles?: boolean
  feuilles?: boolean
  neige?: boolean
}

export const AMBIANCES: Ambiance[] = [
  { id: 'jour', nom: 'Grand jour', prix: 0, astre: 'soleil' },
  {
    id: 'nuit', nom: 'Nuit douce', prix: 200, astre: 'lune', etoiles: true,
    ciel: ['#2A2E4A', '#3A4062', '#4A5578'],
    voile: { couleur: '#1B2140', opacite: 0.34 },
  },
  {
    id: 'automne', nom: 'Automne', prix: 180, astre: 'soleil', feuilles: true,
    ciel: ['#F6DCB0', '#F3E4C6', '#EDE3CF'],
    voile: { couleur: '#E0A85A', opacite: 0.12 },
  },
  {
    id: 'hiver', nom: 'Hiver clair', prix: 220, astre: 'soleil', neige: true,
    ciel: ['#E8EEF4', '#EDF1F3', '#EAF0EE'],
    voile: { couleur: '#DCE8F0', opacite: 0.18 },
  },
]

export function getAmbiance(id: AmbianceId): Ambiance {
  return AMBIANCES.find((a) => a.id === id) ?? AMBIANCES[0]
}

export type DecorId = 'banc' | 'lampadaire' | 'massif' | 'haie' | 'fleurs'

export interface DecorItem {
  id: DecorId
  nom: string
  prix: number
}

export const DECORS: DecorItem[] = [
  { id: 'fleurs', nom: 'Parterre de fleurs', prix: 20 },
  { id: 'massif', nom: 'Massif', prix: 30 },
  { id: 'haie', nom: 'Haie', prix: 40 },
  { id: 'banc', nom: 'Banc', prix: 50 },
  { id: 'lampadaire', nom: 'Lampadaire', prix: 80 },
]

export function getDecor(id: DecorId): DecorItem | undefined {
  return DECORS.find((d) => d.id === id)
}

export const PRIX_TUILE = 300

/**
 * Tuiles d'agrandissement, débloquées une par une (300 graines chacune).
 * Placées sur les bords arrière et latéraux pour ne pas croiser la rivière.
 */
export const EXPANSION: { x: number; y: number; zone: 'boite' | 'peau' | 'planete' }[] = [
  { x: -1, y: 1, zone: 'boite' },
  { x: 7, y: 1, zone: 'peau' },
  { x: -1, y: 2, zone: 'boite' },
  { x: 7, y: 2, zone: 'peau' },
  { x: -1, y: 3, zone: 'boite' },
  { x: 7, y: 3, zone: 'peau' },
  { x: 2, y: 7, zone: 'planete' },
  { x: 3, y: 7, zone: 'planete' },
  { x: 4, y: 7, zone: 'planete' },
]
