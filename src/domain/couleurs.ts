import type { Domaine } from './types'

/** Couleurs de domaine : fixes, jamais personnalisables (elles portent le sens). */
export const COULEUR: Record<Domaine, string> = {
  boite: '#B0512A',
  peau: '#9C5B7F',
  planete: '#2F7A5C',
}

export const TEINTE: Record<Domaine, string> = {
  boite: '#F2DDD1',
  peau: '#EEDDE7',
  planete: '#D6E9DD',
}
