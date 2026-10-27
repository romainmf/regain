import { LIEUX, type LieuId } from '../../island/ac/lieux'
import type { ActionsIle, EtatIle } from './pilote'

/**
 * Les étapes de la visite guidée, menée par Brin. Trois sortes :
 * - une explication (bouton « Suivant ») ;
 * - un geste à faire soi-même : la cible reste touchable, Brin attend que
 *   `accomplie` passe à vrai, et propose de le faire à notre place (`aide`) ;
 * - des étapes conditionnelles (`si`), selon l'écran ou ce qu'il y a à valider.
 */
export interface Contexte {
  etat: EtatIle
  /** Propositions à valider, maintenant et au début de l'étape. */
  aValider: number
  aValiderAuDepart: number
  /** L'écran où l'on est (chemin), et le nombre d'agents, maintenant et au début de l'étape. */
  route: string
  nbAgents: number
  nbAgentsAuDepart: number
  /** L'agent que l'on vient de créer pendant la visite. */
  nouvelAgent: { nom: string; lieu: LieuId } | null
  prenom: string
}

/** Ce qu'une aide peut faire : les gestes de l'île (s'il est affiché) et changer d'écran. */
export interface Outils {
  ile: ActionsIle | null
  naviguer: (vers: string) => void
  c: Contexte
}

export interface Etape {
  id: string
  titre: string
  texte: (c: Contexte) => string
  /** Sélecteur CSS de ce que l'on met en lumière (le premier visible). */
  cible?: string | ((c: Contexte) => string)
  /** Geste attendu : l'étape avance toute seule quand c'est fait. */
  accomplie?: (c: Contexte) => boolean
  /** Le faire à la place de la personne. */
  aide?: { libelle: string; faire: (o: Outils) => void }
  si?: (c: Contexte) => boolean
  /** Pas de voile : tout l'écran reste libre (un formulaire à remplir), la bulle se range en bas. */
  libre?: boolean
}

const salut = (c: Contexte) => (c.prenom ? ` ${c.prenom}` : '')
/** Le lieu que l'on visite : là où quelque chose attend, sinon l'Atelier. */
export const lieuVisite = (c: Contexte): LieuId => c.etat.lieuConseille ?? 'atelier'
const AGENT_PAR_DEFAUT: Record<LieuId, string> = { atelier: 'Factures', spa: 'Rythme', jardin: 'Empreinte', maison: 'ton agent' }
const agentVisite = (c: Contexte) => c.etat.agentConseille ?? AGENT_PAR_DEFAUT[lieuVisite(c)]
const ROLE: Record<LieuId, string> = { atelier: 'ton agent pour ta boîte', spa: 'ton agent pour ton rythme', jardin: 'ton agent pour ton empreinte', maison: 'ton agent' }

export const ETAPES: Etape[] = [
  {
    id: 'brin',
    cible: '.coeur-brin',
    titre: 'Moi, c’est Brin',
    texte: (c) => `Salut${salut(c)} ! Je suis l’arbre au cœur de ton île. Je te fais visiter, une minute pas plus. Touche-moi quand tu veux, plus tard, pour me poser une question.`,
  },
  {
    id: 'entrer',
    cible: (c) => `[data-lieu="${lieuVisite(c)}"]`,
    titre: 'Entre dans un lieu',
    texte: (c) => `Touche ${LIEUX[lieuVisite(c)].nom} : ton personnage s’y rend et pousse la porte. C’est là que travaille ${agentVisite(c)}, ${ROLE[lieuVisite(c)]}.`,
    accomplie: (c) => c.etat.vue === 'interieur' && c.etat.lieu === lieuVisite(c),
    aide: { libelle: 'Y aller pour moi', faire: ({ ile, c }) => ile?.entrer(lieuVisite(c)) },
  },
  {
    id: 'agent',
    cible: '.ile-interieur [data-agent]',
    titre: 'Va voir ton agent',
    texte: (c) => `${agentVisite(c)} est à son poste. Touche-le pour voir ce qu’il a pour toi.`,
    accomplie: (c) => c.etat.agentOuvert !== null,
    aide: { libelle: 'Lui parler', faire: ({ ile }) => ile?.voirAgent() },
    si: (c) => c.etat.vue === 'interieur',
  },
  {
    id: 'valider',
    cible: '.ile-dialogue .val-carte',
    titre: 'Ils préparent, tu valides',
    texte: () => 'Voilà ce qu’il a préparé, en brouillon. Relis, puis valide : rien ne part jamais sans ton accord. En bêta, rien n’est envoyé du tout.',
    accomplie: (c) => c.aValider < c.aValiderAuDepart,
    si: (c) => c.etat.agentOuvert !== null && c.etat.attenteAgentOuvert > 0,
  },
  {
    id: 'graines',
    cible: '.ile-chiffres, .elan-semaine',
    titre: 'Des graines et de l’élan',
    texte: () => 'Chaque validation te donne des graines, pour décorer ton île. Et ton élan grandit quand tes trois lieux avancent ensemble.',
  },
  {
    id: 'sortir',
    cible: '.ile-hud .ile-bouton',
    titre: 'On ressort ?',
    texte: () => 'Touche « Sortir », ou le paillasson en bas de la pièce.',
    accomplie: (c) => c.etat.vue === 'ile',
    aide: { libelle: 'Sortir pour moi', faire: ({ ile }) => ile?.sortir() },
    si: (c) => c.etat.vue === 'interieur',
  },
  {
    id: 'lieux',
    cible: (c) => `[data-lieu="${lieuVisite(c) === 'spa' ? 'atelier' : 'spa'}"]`,
    titre: 'Les autres lieux',
    texte: () => 'L’Atelier pour ta boîte, le Spa pour ton rythme, le Jardin pour ton empreinte : un agent dans chacun. Quand un lieu fume ou s’éclaire, c’est qu’il t’attend.',
  },
  {
    id: 'tiroir',
    cible: '.tiroir-poignee',
    titre: 'Ton tableau de bord',
    texte: () => 'Tire le tiroir sous l’île : tout ce qui attend, ton élan de la semaine, ton équipe.',
    accomplie: (c) => c.etat.tiroirOuvert,
    aide: { libelle: 'L’ouvrir pour moi', faire: ({ ile }) => ile?.ouvrirTiroir() },
    si: (c) => !c.etat.large,
  },
  {
    id: 'colonnes',
    cible: '.lieu-col-gauche',
    titre: 'Ton tableau de bord',
    texte: () => 'À gauche, tout ce qui attend ta validation. À droite, ton élan de la semaine et ton équipe.',
    si: (c) => c.etat.large,
  },
  {
    id: 'saisir',
    cible: '.action-saisir',
    titre: 'Dis-leur ce qui arrive',
    texte: () => '« Mission finie », « grosse journée », « trajet »… Écris-le ici et tes agents préparent aussitôt la suite.',
  },
  {
    id: 'equipe',
    cible: '.nav-equipe, .equipe-bref-plus',
    titre: 'Ton équipe',
    texte: () => 'Touche L’équipe : c’est là que tu recrutes des agents, et que tu crées le tien. On en fait un ensemble ?',
    accomplie: (c) => c.route.startsWith('/equipe') || c.route === '/creer',
    aide: { libelle: 'M’y emmener', faire: ({ naviguer }) => naviguer('/equipe') },
  },
  {
    id: 'creer',
    cible: '.agents-creer',
    titre: 'Crée ton agent',
    texte: () => 'Touche « Créer un agent ». En moins d’une minute, tu as un assistant à toi.',
    accomplie: (c) => c.route === '/creer',
    aide: { libelle: 'Ouvrir pour moi', faire: ({ naviguer }) => naviguer('/creer') },
    si: (c) => c.route !== '/creer',
  },
  {
    id: 'formulaire',
    libre: true,
    titre: 'À toi de jouer',
    texte: () => 'Son domaine, son nom (ou celui que je te souffle), ses missions, puis « Créer ». Je t’attends.',
    accomplie: (c) => c.nbAgents > c.nbAgentsAuDepart,
  },
  {
    id: 'retour',
    cible: '.ile-haut',
    titre: 'Bienvenue à lui',
    texte: (c) => c.nouvelAgent
      ? `${c.nouvelAgent.nom} s’installe dans ${LIEUX[c.nouvelAgent.lieu].nom} : ton personnage va le saluer. Il prépare ses propositions avec des règles simples, ou avec Claude en mode IA. Bonne visite${salut(c)} !`
      : `Tes agents t’attendent dans leurs lieux. Bonne visite${salut(c)} !`,
  },
]

/** Les étapes qui s'appliquent dans le contexte courant ; celle en cours reste, quoi qu'il arrive. */
export const etapesVisibles = (c: Contexte, courante?: string) => ETAPES.filter((e) => e.id === courante || !e.si || e.si(c))
