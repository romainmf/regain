import type { Domaine } from './types'

/**
 * Économie du jeu, en module pur et testé.
 * Règles (brief, section 5) :
 *  - 10 graines de base par validation, multipliées par l'élan.
 *  - Plafond doux de 50 graines par domaine et par jour.
 *  - Élan calculé sur 7 jours (domaines actifs + équilibre), de ×1,0 à ×1,5,
 *    qui ne redescend jamais brutalement (−0,05 par jour au plus).
 *  - Récolte : un mois où les trois domaines sont actifs.
 *  - Repos : un domaine sans validation depuis 7 jours.
 */

export const GAIN_BASE = 10
export const PLAFOND_JOUR = 50
export const JOUR_MS = 24 * 60 * 60 * 1000
export const FENETRE_REPOS_JOURS = 7
/** Validations minimales par domaine dans le mois pour compter une récolte. */
export const SEUIL_RECOLTE_MOIS = 4

export type Meteo = 'soleil' | 'voile' | 'brume'

export interface GainGraines {
  /** Graines effectivement gagnées (après plafond). */
  gain: number
  /** Vrai si le plafond quotidien du domaine a limité le gain. */
  plafonne: boolean
}

/** Graines gagnées pour une validation, selon l'élan et ce qui a déjà été gagné aujourd'hui. */
export function grainesPourValidation(dejaGagneDomaineAujourdhui: number, elan: number): GainGraines {
  const brut = Math.round(GAIN_BASE * elan)
  const reste = Math.max(0, PLAFOND_JOUR - dejaGagneDomaineAujourdhui)
  const gain = Math.min(brut, reste)
  return { gain, plafonne: gain < brut }
}

/** Un domaine est actif s'il a au moins une validation dans la fenêtre de 7 jours. */
export function domaineActif(validations7j: number): boolean {
  return validations7j > 0
}

/**
 * Équilibre entre les trois domaines : min/max des validations sur 7 jours.
 * Ne compte que si les trois domaines sont actifs ; sinon 0.
 * Renvoie une valeur entre 0 et 1.
 */
export function equilibre(parDomaine: Record<Domaine, number>): number {
  const vals = [parDomaine.boite, parDomaine.peau, parDomaine.planete]
  if (vals.some((v) => v <= 0)) return 0
  return Math.min(...vals) / Math.max(...vals)
}

/**
 * Élan cible à partir des validations des 7 derniers jours :
 * 1 + 0,1 × (domaines actifs − 1) + 0,3 × équilibre. Borné à [1 ; 1,5].
 */
export function elanCible(parDomaine: Record<Domaine, number>): number {
  const actifs = [parDomaine.boite, parDomaine.peau, parDomaine.planete].filter(domaineActif).length
  if (actifs === 0) return 1
  const brut = 1 + 0.1 * (actifs - 1) + 0.3 * equilibre(parDomaine)
  return Math.min(1.5, Math.max(1, Math.round(brut * 100) / 100))
}

/**
 * Élan affiché : il monte aussitôt vers sa cible, mais ne redescend que
 * doucement (−0,05 par jour écoulé depuis la dernière mise à jour).
 */
export function elanLisse(ancien: number, ancienQuand: number, cible: number, maintenant: number): number {
  if (cible >= ancien) return cible
  const jours = Math.max(0, (maintenant - ancienQuand) / JOUR_MS)
  const plancher = ancien - 0.05 * jours
  return Math.max(cible, Math.round(Math.max(1, plancher) * 100) / 100)
}

/** Météo de l'île déduite de l'élan. */
export function meteoDepuisElan(elan: number): Meteo {
  if (elan >= 1.3) return 'soleil'
  if (elan >= 1.1) return 'voile'
  return 'brume'
}

/** Un domaine passe en repos s'il n'a pas eu de validation depuis 7 jours. */
export function domaineEnRepos(derniereValidation: number | null, maintenant: number): boolean {
  if (derniereValidation == null) return false
  return maintenant - derniereValidation >= FENETRE_REPOS_JOURS * JOUR_MS
}

/** Nombre de récoltes : mois où chacun des trois domaines atteint le seuil. */
export function compterRecoltes(
  parMois: Record<string, Record<Domaine, number>>,
): number {
  let n = 0
  for (const mois of Object.values(parMois)) {
    if (
      (mois.boite ?? 0) >= SEUIL_RECOLTE_MOIS &&
      (mois.peau ?? 0) >= SEUIL_RECOLTE_MOIS &&
      (mois.planete ?? 0) >= SEUIL_RECOLTE_MOIS
    ) {
      n++
    }
  }
  return n
}

/** Clé de mois « AAAA-MM » pour regrouper les validations. */
export function cleMois(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** Clé de jour « AAAA-MM-JJ » pour les plafonds quotidiens. */
export function cleJour(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
