import type { Domaine } from '../domain/types'
import { DOMAINES } from '../domain/types'
import {
  JOUR_MS,
  cleJour,
  cleMois,
  compterRecoltes,
  domaineEnRepos,
  elanCible,
  elanLisse,
  meteoDepuisElan,
  type Meteo,
} from '../domain/economy'
import type { GraineDB } from './db'

const zero = (): Record<Domaine, number> => ({ boite: 0, peau: 0, planete: 0 })

/** Solde total de graines (somme du journal). */
export function soldeGraines(journal: GraineDB[]): number {
  return journal.reduce((s, g) => s + g.montant, 0)
}

/** Validations par domaine sur les 7 derniers jours (lignes « validation » du journal). */
export function validations7j(journal: GraineDB[], maintenant: number): Record<Domaine, number> {
  const out = zero()
  for (const g of journal) {
    if (g.motif !== 'validation') continue
    if (maintenant - g.ts <= 7 * JOUR_MS) out[g.domaine]++
  }
  return out
}

/** Graines déjà gagnées aujourd'hui pour un domaine (pour le plafond). */
export function grainesDuJour(journal: GraineDB[], domaine: Domaine, maintenant: number): number {
  const jour = cleJour(maintenant)
  return journal
    .filter((g) => g.domaine === domaine && cleJour(g.ts) === jour && g.montant > 0)
    .reduce((s, g) => s + g.montant, 0)
}

/** Dernière validation par domaine (timestamp) ou null. */
export function derniereValidationParDomaine(journal: GraineDB[]): Record<Domaine, number | null> {
  const out: Record<Domaine, number | null> = { boite: null, peau: null, planete: null }
  for (const g of journal) {
    if (g.motif !== 'validation') continue
    if (out[g.domaine] == null || g.ts > out[g.domaine]!) out[g.domaine] = g.ts
  }
  return out
}

/** Quels domaines sont en repos (aucune validation depuis 7 jours). */
export function domainesEnRepos(journal: GraineDB[], maintenant: number): Record<Domaine, boolean> {
  const derniere = derniereValidationParDomaine(journal)
  const out: Record<Domaine, boolean> = { boite: false, peau: false, planete: false }
  for (const d of DOMAINES) out[d] = domaineEnRepos(derniere[d], maintenant)
  return out
}

export interface EtatEconomie {
  solde: number
  elan: number
  meteo: Meteo
  repos: Record<Domaine, boolean>
  recoltes: number
  validations7j: Record<Domaine, number>
}

/** Agrège l'état économique affiché, en lissant l'élan depuis sa valeur mémorisée. */
export function etatEconomie(
  journal: GraineDB[],
  elanMemo: { value: number; ts: number },
  maintenant: number,
): EtatEconomie {
  const v7 = validations7j(journal, maintenant)
  const cible = elanCible(v7)
  const elan = elanLisse(elanMemo.value, elanMemo.ts, cible, maintenant)

  const parMois: Record<string, Record<Domaine, number>> = {}
  for (const g of journal) {
    if (g.motif !== 'validation') continue
    const k = cleMois(g.ts)
    ;(parMois[k] ??= zero())[g.domaine]++
  }

  return {
    solde: soldeGraines(journal),
    elan,
    meteo: meteoDepuisElan(elan),
    repos: domainesEnRepos(journal, maintenant),
    recoltes: compterRecoltes(parMois),
    validations7j: v7,
  }
}
