/** Niveau visuel d'un bâtiment selon l'usage de son agent (jamais l'argent). */
export const SEUILS_NIVEAU = { niveau2: 10, niveau3: 30 } as const

export function niveauBatiment(validations: number): 1 | 2 | 3 {
  if (validations >= SEUILS_NIVEAU.niveau3) return 3
  if (validations >= SEUILS_NIVEAU.niveau2) return 2
  return 1
}
