import type { BatimentId, Domaine, SigneDeVie } from './types'
import type { SaisieKind } from './propositions'

/**
 * Missions cadrées par domaine (pas de prompt libre en bêta).
 * Elles servent à la création d'un agent et à ce qu'il prépare :
 * une mission réagit à un type de saisie et produit une proposition.
 */
export interface MissionOption {
  id: string
  label: string
  /** Saisie qui déclenche cette mission. */
  kind: SaisieKind
  /** Type logique de la proposition produite. */
  type: string
  titre: (client?: string) => string
  detail: string
}

export const MISSIONS_PAR_DOMAINE: Record<Domaine, MissionOption[]> = {
  boite: [
    { id: 'facture', label: 'Préparer mes factures', kind: 'mission_terminee', type: 'facture', titre: (c) => `Brouillon de facture — ${c ?? 'client'}`, detail: 'Facture conforme à relire avant envoi.' },
    { id: 'echeances', label: 'Rappeler mes échéances', kind: 'encaissement', type: 'echeance', titre: () => 'Pense à tes échéances', detail: 'URSSAF, TVA : rien ne doit te surprendre.' },
    { id: 'coussin', label: 'Mettre de côté pour les cotisations', kind: 'encaissement', type: 'coussin', titre: () => 'Mets de côté pour tes cotisations', detail: 'Une part réservée à chaque encaissement.' },
  ],
  peau: [
    { id: 'creneau', label: 'Protéger un créneau calme', kind: 'grosse_journee', type: 'creneau', titre: () => 'Protège un créneau calme', detail: 'Un moment à toi, bientôt, pour souffler.' },
    { id: 'cloture', label: "M'aider à couper le soir", kind: 'grosse_journee', type: 'cloture', titre: () => 'Range et coupe ce soir', detail: 'On ferme en douceur, la suite attendra demain.' },
    { id: 'air', label: 'Me proposer une vraie coupure', kind: 'grosse_journee', type: 'air', titre: () => 'Et si tu sortais marcher ?', detail: 'Dehors, sans écran, juste un moment.' },
  ],
  planete: [
    { id: 'empreinte', label: 'Estimer mon empreinte', kind: 'mission_terminee', type: 'empreinte', titre: (c) => `Empreinte de la mission ${c ?? ''}`.trim(), detail: 'Estimation à ajouter à ton bilan regen.' },
    { id: 'trajet', label: 'Proposer le bas carbone', kind: 'trajet', type: 'trajet_option', titre: () => 'Une option plus douce', detail: 'Une alternative bas carbone pour ce trajet.' },
    { id: 'sobriete', label: 'Trier le superflu', kind: 'encaissement', type: 'sobriete', titre: () => 'Un petit tri à faire', detail: 'Fichiers lourds, abonnements dormants : on allège.' },
  ],
}

export function missionsDuDomaine(d: Domaine): MissionOption[] {
  return MISSIONS_PAR_DOMAINE[d]
}

/** Retrouve une option de mission par son libellé (stocké sur l'agent). */
export function optionParLabel(d: Domaine, label: string): MissionOption | undefined {
  return MISSIONS_PAR_DOMAINE[d].find((m) => m.label === label)
}

/** Noms suggérés par domaine : doux, naturels, dans l'esprit de l'île. */
export const NOMS_SUGGERES: Record<Domaine, string[]> = {
  boite: ['Comptoir', 'Registre', 'Sceau', 'Boussole', 'Jalon', 'Ancre'],
  peau: ['Halte', 'Souffle', 'Repère', 'Vigie douce', 'Lisière', 'Clairière'],
  planete: ['Lichen', 'Sève', 'Bourgeon', 'Rosée', 'Humus', 'Sillon'],
}

export function nomSuggere(d: Domaine, eviter?: string): string {
  const pool = NOMS_SUGGERES[d].filter((n) => n !== eviter)
  return pool[Math.floor(Math.random() * pool.length)]
}

/** Bâtiment et signe de vie par défaut d'un agent personnalisé, par domaine. */
export const BATIMENT_PERSO: Record<Domaine, { batiment: BatimentId; signeDeVie: SigneDeVie }> = {
  boite: { batiment: 'tour-de-guet', signeDeVie: 'lumiere' },
  peau: { batiment: 'lanterne', signeDeVie: 'lumiere' },
  planete: { batiment: 'composteur', signeDeVie: 'fumee' },
}
