/**
 * Brin, le guide de Regain. Fonctionne hors ligne : réponses écrites à l'avance,
 * choisies par suggestion ou par mots-clés. Module pur, testé.
 */

export interface Sujet {
  id: string
  /** Libellé de la suggestion qui mène à ce sujet. */
  question: string
  /** Mots-clés (sans accents, en minuscules) qui déclenchent ce sujet. */
  motsCles: string[]
  /** Bulles de Brin, dans l'ordre. */
  reponse: string[]
  /** Sujets proposés ensuite. */
  suites: string[]
}

export const SUJETS: Sujet[] = [
  {
    id: 'accueil',
    question: 'Bonjour Brin',
    motsCles: ['bonjour', 'salut', 'hello', 'coucou', 'hey'],
    reponse: [
      'Bonjour ! Moi c’est Brin, l’arbre au cœur de ton île. Touche-moi quand tu veux me parler.',
      'Je peux te présenter Regain en deux minutes, ou répondre à une question précise. Comme tu préfères.',
    ],
    suites: ['visite', 'domaines', 'donnees'],
  },
  {
    id: 'visite',
    question: 'Fais-moi visiter',
    motsCles: ['visite', 'presente', 'presentation', 'regain', 'outil', 'application', 'appli', 'commencer'],
    reponse: [
      'Regain, c’est ton atelier d’agents, dans trois domaines : Ma boîte (ton activité), Ma peau (ton énergie) et Ma planète (ton empreinte).',
      'Tu recrutes des agents qui préparent les petites choses du quotidien d’indépendant : factures et échéances, rythme et vraies coupures, trajets et achats plus sobres.',
      'La règle d’or : ils préparent, tu valides. Rien ne part jamais sans ton accord — et en bêta, rien n’est envoyé du tout.',
      'Le secret : prendre soin des trois en même temps fait grandir ton activité, et ton île fleurit à chaque validation.',
    ],
    suites: ['domaines', 'agents', 'ile'],
  },
  {
    id: 'domaines',
    question: 'Les trois domaines ?',
    motsCles: ['domaine', 'trois', 'boite', 'peau', 'planete', 'zone', 'couleur'],
    reponse: [
      'L’île a trois zones. Ma boîte, couleur argile : administratif, conformité, trésorerie.',
      'Ma peau, couleur prune : ton rythme, ton énergie, ton équilibre, le lien avec les autres.',
      'Ma planète, en vert : ton empreinte, la sobriété, ton impact.',
      'Le secret, c’est d’en prendre soin en même temps : chaque domaine produit quelque chose qu’un autre utilise.',
    ],
    suites: ['connexions', 'elan', 'agents'],
  },
  {
    id: 'connexions',
    question: 'Comment ils sont reliés ?',
    motsCles: ['relie', 'lien', 'connexion', 'connecte', 'flux', 'chaine', 'ensemble'],
    reponse: [
      'Une seule action peut nourrir les trois domaines. Exemple : tu valides une facture dans Ma boîte.',
      'Aussitôt, Ma peau te propose de mettre de côté de quoi payer tes cotisations (moins d’angoisse), et Ma planète ajoute l’empreinte de la mission à ton bilan.',
      'Sur l’île, tu verras un flux doré filer d’un bâtiment à l’autre quand ça arrive.',
    ],
    suites: ['elan', 'validation'],
  },
  {
    id: 'agents',
    question: 'C’est quoi un agent ?',
    motsCles: ['agent', 'recruter', 'recrute', 'equipe', 'plume', 'source', 'racine', 'catalogue', 'batiment'],
    reponse: [
      'Un agent, c’est un petit assistant spécialisé. Tu en as déjà trois, offerts : Plume (factures et échéances), Source (ton rythme) et Racine (l’empreinte de tes projets).',
      'Dans l’onglet Agents, tu en trouveras d’autres à recruter. Chacun apporte son bâtiment sur l’île : la cabane de Plume, la pergola de Source, la serre de Racine…',
      'Plus un agent t’aide, plus son bâtiment grandit. C’est l’usage qui le fait évoluer, jamais l’argent.',
    ],
    suites: ['autonomie', 'creer', 'validation'],
  },
  {
    id: 'autonomie',
    question: 'Ils agissent seuls ?',
    motsCles: ['autonomie', 'seul', 'automatique', 'propose', 'prepare', 'relance', 'envoie', 'envoyer'],
    reponse: [
      'Jamais sans toi. Chaque agent a un mode : Propose (il suggère), Prépare (il prépare, tu valides) ou + Relance (il prépare et relance, toujours après ta validation).',
      'Et pendant la bêta, rien n’est envoyé du tout : les factures restent des brouillons.',
    ],
    suites: ['validation', 'donnees'],
  },
  {
    id: 'validation',
    question: 'Comment je valide ?',
    motsCles: ['valider', 'validation', 'file', 'attente', 'proposition', 'plus tard', 'revoir', 'modifier'],
    reponse: [
      'Tout ce que préparent tes agents arrive dans la file « À valider ».',
      'Pour chaque proposition : Valider, Revoir pour la modifier, ou Plus tard. Plus tard, c’est vraiment plus tard : aucune pression.',
    ],
    suites: ['graines', 'connexions'],
  },
  {
    id: 'graines',
    question: 'Les graines, c’est quoi ?',
    motsCles: ['graine', 'gagner', 'point', 'monnaie', 'acheter', 'decor', 'depense', 'tuile', 'ambiance', 'payer', 'prix'],
    reponse: [
      'Chaque validation te rapporte 10 graines. On ne peut pas les acheter : elles se gagnent seulement en validant.',
      'Tu les dépenses pour embellir l’île : bancs, lanternes, fleurs (20 à 80), une nouvelle tuile (300), des ambiances comme la nuit ou les saisons (150 à 400).',
      'Au-delà de 50 graines par domaine et par jour, je te glisserai plutôt : « Ta boîte a bien travaillé aujourd’hui, et toi ? »',
    ],
    suites: ['elan', 'recolte', 'ile'],
  },
  {
    id: 'elan',
    question: 'Et l’élan ?',
    motsCles: ['elan', 'multiplicateur', 'bonus', 'equilibre', 'exponentiel', 'meteo', 'soleil'],
    reponse: [
      'L’élan multiplie tes graines, de ×1,0 à ×1,5. Il grimpe quand tes trois domaines sont actifs et équilibrés sur les 7 derniers jours.',
      'Il ne s’effondre jamais d’un coup : il redescend doucement. Et il colore la météo de l’île, du soleil à la brume douce.',
    ],
    suites: ['recolte', 'repos'],
  },
  {
    id: 'recolte',
    question: 'C’est quoi la récolte ?',
    motsCles: ['recolte', 'mois', 'treizieme', '13', 'compteur', 'douze'],
    reponse: [
      'Chaque mois où tes trois domaines ont été actifs te donne une récolte. Le compteur va jusqu’à 12.',
      'Garde-le à l’œil : il servira plus tard à quelque chose de joli.',
    ],
    suites: ['repos', 'ile'],
  },
  {
    id: 'repos',
    question: 'Et si je m’absente ?',
    motsCles: ['absent', 'absence', 'vacances', 'repos', 'pause', 'oublie', 'retard', 'brume', 'mourir', 'meurt', 'perdre', 'punition'],
    reponse: [
      'Alors l’île se repose avec toi. Un domaine sans validation depuis 7 jours passe en brume douce : un peu de feuilles d’automne, rien de plus.',
      'Rien ne meurt, rien n’est détruit. Tout repart à la première validation.',
    ],
    suites: ['ile', 'donnees'],
  },
  {
    id: 'ile',
    question: 'Je peux construire ?',
    motsCles: ['ile', 'construire', 'poser', 'deplacer', 'personnaliser', 'decorer', 'coeur', 'arbre', 'serveur'],
    reponse: [
      'Oui ! Chaque agent recruté apporte son bâtiment, que tu poses dans sa zone. Un appui long permet de le déplacer.',
      'Tu peux ajouter du décor et agrandir l’île avec tes graines. Les couleurs des domaines, elles, restent fixes : on personnalise l’ambiance, jamais le sens.',
      'Au fond de l’île, c’est moi : un arbre dont le pied est un petit serveur. Je rappelle que tes données vivent chez toi.',
    ],
    suites: ['donnees', 'creer'],
  },
  {
    id: 'donnees',
    question: 'Et mes données ?',
    motsCles: ['donnee', 'prive', 'vie privee', 'cloud', 'serveur', 'securite', 'hors ligne', 'offline', 'export', 'sauvegarde', 'compte', 'rgpd'],
    reponse: [
      'Elles restent sur ton téléphone. Pas de compte, pas de cloud : Regain fonctionne même hors ligne.',
      'Tu peux exporter toute ton île dans un fichier, et la réimporter quand tu veux.',
    ],
    suites: ['autonomie', 'visite'],
  },
  {
    id: 'creer',
    question: 'Créer mon agent ?',
    motsCles: ['creer', 'creation', 'nouveau', 'inventer', 'personnalise', 'plus', 'bouton'],
    reponse: [
      'Le bouton « + » en bas te permet de créer ton propre agent en moins d’une minute.',
      'Quatre étapes : choisir son domaine, lui donner un nom, cocher ses missions dans une liste, choisir son autonomie. Puis tu poses son bâtiment.',
    ],
    suites: ['agents', 'autonomie'],
  },
  {
    id: 'sante',
    question: 'Tu donnes des conseils santé ?',
    motsCles: ['sante', 'medical', 'medecin', 'sommeil', 'regime', 'sport', 'poids', 'calorie', 'burnout', 'burn out', 'malade', 'stress'],
    reponse: [
      'Non, et c’est voulu. Les agents de Ma peau ne donnent aucun conseil médical et ne touchent à aucune donnée de santé.',
      'Ils regardent seulement le rythme de travail que tu déclares, proposent une petite action, et c’est toi qui décides.',
      'Si tu traverses une période difficile, parles-en à un professionnel de santé : c’est important.',
    ],
    suites: ['domaines', 'repos'],
  },
  {
    id: 'merci',
    question: 'Merci Brin',
    motsCles: ['merci', 'super', 'top', 'genial', 'parfait', 'cool', 'ok', 'compris'],
    reponse: ['Avec plaisir. Je reste dans le coin : appelle-moi quand tu veux.'],
    suites: ['visite', 'graines'],
  },
]

export const SUJET_INCONNU: Sujet = {
  id: 'inconnu',
  question: '',
  motsCles: [],
  reponse: [
    'Hmm, je ne suis qu’un arbre : je n’ai pas bien saisi.',
    'Je connais bien l’île, les agents, les graines et tes données. Essaie l’une de ces pistes :',
  ],
  suites: ['visite', 'graines', 'donnees'],
}

const PAR_ID = new Map(SUJETS.map((s) => [s.id, s]))

export function sujet(id: string): Sujet {
  return PAR_ID.get(id) ?? SUJET_INCONNU
}

export function normaliser(texte: string): string {
  return texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Trouve le sujet le plus proche d'une question libre.
 * Un mot-clé compte s'il apparaît comme début de mot (« graines » trouve « graine »).
 * Les mots-clés de plusieurs mots pèsent plus lourd.
 */
export function repondre(texte: string): Sujet {
  const t = ' ' + normaliser(texte) + ' '
  if (t.trim() === '') return SUJET_INCONNU
  let meilleur: Sujet = SUJET_INCONNU
  let score = 0
  for (const s of SUJETS) {
    let sc = 0
    for (const m of s.motsCles) {
      if (t.includes(' ' + m)) sc += m.includes(' ') ? 2 : 1
    }
    if (sc > score) {
      score = sc
      meilleur = s
    }
  }
  return meilleur
}
