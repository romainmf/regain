import type { Domaine } from '../domain/types'

/**
 * Énergie d'un agent : une jauge d'activité (0 à 1). Jamais négative.
 * En attendant le suivi d'activité sur 7 jours (jalon 3), on l'estime à partir
 * de l'usage cumulé. Vide = l'agent n'a pas encore travaillé (« en veille »).
 */
export function energieAgent(validations: number, actif: boolean): number {
  if (!actif) return 0
  return Math.max(0, Math.min(1, validations / 7))
}

export function JaugeEnergie({ valeur, domaine, large = false }: { valeur: number; domaine: Domaine; large?: boolean }) {
  const pct = Math.round(valeur * 100)
  return (
    <div className={`jauge${large ? ' jauge-large' : ''}`} role="img" aria-label={`Énergie : ${pct} %`}>
      <span className="jauge-fond">
        <span className="jauge-remplie" style={{ width: `${Math.max(6, pct)}%`, background: `var(--${domaine})` }} />
      </span>
    </div>
  )
}
