import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getTemplate } from '../domain/catalog'
import type { AgentTemplate, Autonomie, Domaine } from '../domain/types'
import { niveauBatiment } from '../domain/progression'
import type { PlacementVue } from '../island/Island'
import type { Proposition, SaisieData, SaisieKind } from '../domain/propositions'
import type { Chaine } from '../domain/chains'
import { etatEconomie, type EtatEconomie } from './selectors'
import * as actions from './actions'
import { amorcerSiNecessaire } from './seed'
import { db, getMeta, nouvelId, type AgentDB, type GraineDB } from './db'

export interface DerniereChaine {
  chaines: Chaine[]
  ts: number
  propType: string
}

/** Un bâtiment en cours de pose (nouveau recrutement) ou de déplacement. */
export interface PoseEnCours {
  mode: 'pose' | 'deplacement'
  agentId: string
  domaine: Domaine
}

interface JeuCtx {
  pret: boolean
  agents: AgentDB[]
  placements: PlacementVue[]
  /** Agents déjà recrutés, par templateId (pour griser « Recruter »). */
  templatesRecrutes: Set<string>
  poseEnCours: PoseEnCours | null
  /** Fiche d'agent ouverte (feuille), ou null. */
  ficheId: string | null
  recruter: (t: AgentTemplate) => Promise<string>
  creerAgent: (a: Omit<AgentDB, 'id' | 'createdAt'>) => Promise<string>
  demarrerDeplacement: (agentId: string) => void
  poser: (x: number, y: number) => Promise<void>
  annulerPose: () => void
  ouvrirFiche: (agentId: string) => void
  fermerFiche: () => void
  // ——— Accueil et visite guidée ———
  phaseIntro: 'onboarding' | 'tour' | null
  finirOnboarding: (lancerTour: boolean) => void
  finirTour: () => void
  lancerVisite: () => void
  definirAutonomie: (agentId: string, autonomie: Autonomie) => Promise<void>
  basculerActif: (agentId: string) => Promise<void>
  definirMissions: (agentId: string, missions: string[]) => Promise<void>
  // ——— Jalon 3 : saisies, file de validation, économie ———
  economie: EtatEconomie
  /** Propositions en attente de validation. */
  aValider: Proposition[]
  /** Propositions mises à « plus tard ». */
  plusTardListe: Proposition[]
  /** Agents qui ont une proposition en attente (signe de vie sur l'île). */
  agentsEnAttente: Set<string>
  /** Dernière chaîne déclenchée (bandeau + flux doré), effaçable. */
  derniereChaine: DerniereChaine | null
  effacerDerniereChaine: () => void
  exemplesPresents: boolean
  nbParAgentSemaine: (agentId: string) => { preparees: number; validees: number; graines: number }
  saisir: (kind: SaisieKind, data: SaisieData) => Promise<number>
  validerProposition: typeof actions.validerProposition
  plusTard: (id: string) => Promise<void>
  revoir: typeof actions.revoir
  reprendre: (id: string) => Promise<void>
  effacerExemples: () => Promise<void>
}

const Ctx = createContext<JeuCtx | null>(null)

export function useJeu(): JeuCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useJeu doit être utilisé dans <JeuProvider>')
  return c
}

/** Construit la vue d'un placement pour l'île en joignant son agent. */
function versVue(agents: AgentDB[]): (p: { refId: string; x: number; y: number }) => PlacementVue | null {
  const parId = new Map(agents.map((a) => [a.id, a]))
  return (p) => {
    const a = parId.get(p.refId)
    if (!a) return null
    const t = a.templateId ? getTemplate(a.templateId) : undefined
    const batiment = a.batiment ?? t?.batiment ?? 'cabane'
    const batNom = t?.batimentNom ?? 'Son bâtiment'
    return {
      id: a.id,
      x: p.x,
      y: p.y,
      batiment,
      domaine: a.domaine,
      niveau: niveauBatiment(a.validations),
      libelle: `${batNom} de ${a.nom}`,
    }
  }
}

export function JeuProvider({ children }: { children: React.ReactNode }) {
  const [pret, setPret] = useState(false)
  const [poseEnCours, setPoseEnCours] = useState<PoseEnCours | null>(null)
  const [ficheId, setFicheId] = useState<string | null>(null)
  const [chaineMasqueeTs, setChaineMasqueeTs] = useState(0)
  const [phaseIntro, setPhaseIntro] = useState<'onboarding' | 'tour' | null>(() => {
    try {
      return localStorage.getItem('regain.onboarding.fait') ? null : 'onboarding'
    } catch {
      return 'onboarding'
    }
  })
  const finirOnboarding = useCallback((lancerTour: boolean) => {
    try {
      localStorage.setItem('regain.onboarding.fait', '1')
      localStorage.setItem('regain.brin.vu', '1')
    } catch {
      /* stockage indisponible : l'accueil pourra réapparaître, sans gravité */
    }
    setPhaseIntro(lancerTour ? 'tour' : null)
  }, [])
  const finirTour = useCallback(() => setPhaseIntro(null), [])
  const lancerVisite = useCallback(() => setPhaseIntro('tour'), [])

  useEffect(() => {
    amorcerSiNecessaire().then(() => setPret(true))
  }, [])

  const agents = useLiveQuery(() => db.agents.toArray(), [], [] as AgentDB[])
  const placementsDB = useLiveQuery(() => db.placements.where('kind').equals('batiment').toArray(), [], [])

  const placements = useMemo(() => {
    const f = versVue(agents)
    return placementsDB.map(f).filter((p): p is PlacementVue => p !== null)
  }, [agents, placementsDB])

  const templatesRecrutes = useMemo(
    () => new Set(agents.map((a) => a.templateId).filter((x): x is string => !!x)),
    [agents],
  )

  // ——— Données de jeu (jalon 3) ———
  const propositions = useLiveQuery(() => db.propositions.toArray(), [], [] as Proposition[])
  const graines = useLiveQuery(() => db.graines.toArray(), [], [] as GraineDB[])
  const elanMemo = useLiveQuery(() => getMeta('elan', { value: 1, ts: Date.now() }), [], { value: 1, ts: Date.now() })
  const derniereChaineMeta = useLiveQuery(() => getMeta<DerniereChaine | null>('derniereChaine', null), [], null)
  const exemplesEffaces = useLiveQuery(() => getMeta('exemples-effaces', false), [], false)

  const now = Date.now()
  const economie = useMemo(() => etatEconomie(graines, elanMemo, now), [graines, elanMemo, now])

  const aValider = useMemo(
    () => propositions.filter((p) => p.statut === 'a_valider').sort((a, b) => b.createdAt - a.createdAt),
    [propositions],
  )
  const plusTardListe = useMemo(() => propositions.filter((p) => p.statut === 'plus_tard'), [propositions])
  const agentsEnAttente = useMemo(() => new Set(aValider.map((p) => p.agentId)), [aValider])
  const exemplesPresents = useMemo(
    () => !exemplesEffaces && propositions.some((p) => p.exemple),
    [exemplesEffaces, propositions],
  )

  const derniereChaine = useMemo(() => {
    if (!derniereChaineMeta || derniereChaineMeta.ts <= chaineMasqueeTs) return null
    return derniereChaineMeta
  }, [derniereChaineMeta, chaineMasqueeTs])
  const effacerDerniereChaine = useCallback(() => setChaineMasqueeTs(Date.now()), [])

  const nbParAgentSemaine = useCallback(
    (agentId: string) => {
      const semaine = (ts: number) => now - ts <= 7 * 24 * 60 * 60 * 1000
      const dAgent = propositions.filter((p) => p.agentId === agentId)
      const preparees = dAgent.filter((p) => semaine(p.createdAt)).length
      const validees = dAgent.filter((p) => p.statut === 'validee' && p.resolvedAt && semaine(p.resolvedAt))
      const agentDom = agents.find((a) => a.id === agentId)?.domaine
      const grainesAgent = agentDom
        ? graines
            .filter((g) => g.domaine === agentDom && g.motif === 'validation' && semaine(g.ts))
            .reduce((s, g) => s + g.montant, 0)
        : 0
      return { preparees, validees: validees.length, graines: grainesAgent }
    },
    [propositions, graines, agents, now],
  )

  const recruter = useCallback(async (t: AgentTemplate) => {
    const id = nouvelId(t.id)
    const autonomie: Autonomie = t.autonomies.includes('prepare') ? 'prepare' : t.autonomies[0]
    await db.agents.add({
      id,
      templateId: t.id,
      nom: t.nom,
      domaine: t.domaine,
      missions: [...t.propositions],
      autonomie,
      actif: true,
      validations: 0,
      createdAt: Date.now(),
    })
    setPoseEnCours({ mode: 'pose', agentId: id, domaine: t.domaine })
    return id
  }, [])

  const creerAgent = useCallback(async (a: Omit<AgentDB, 'id' | 'createdAt'>) => {
    const id = nouvelId(a.templateId ?? 'perso')
    await db.agents.add({ ...a, id, createdAt: Date.now() })
    setPoseEnCours({ mode: 'pose', agentId: id, domaine: a.domaine })
    return id
  }, [])

  const demarrerDeplacement = useCallback((agentId: string) => {
    const a = agents.find((x) => x.id === agentId)
    if (a) setPoseEnCours({ mode: 'deplacement', agentId, domaine: a.domaine })
  }, [agents])

  const poser = useCallback(async (x: number, y: number) => {
    if (!poseEnCours) return
    const { agentId } = poseEnCours
    const existant = await db.placements.where('refId').equals(agentId).first()
    if (existant) await db.placements.update(existant.id, { x, y })
    else await db.placements.add({ id: `pl_${agentId}`, kind: 'batiment', refId: agentId, x, y })
    setPoseEnCours(null)
  }, [poseEnCours])

  const annulerPose = useCallback(() => setPoseEnCours(null), [])

  const ouvrirFiche = useCallback((agentId: string) => setFicheId(agentId), [])
  const fermerFiche = useCallback(() => setFicheId(null), [])

  const definirAutonomie = useCallback(async (agentId: string, autonomie: Autonomie) => {
    await db.agents.update(agentId, { autonomie })
  }, [])
  const basculerActif = useCallback(async (agentId: string) => {
    const a = await db.agents.get(agentId)
    if (a) await db.agents.update(agentId, { actif: !a.actif })
  }, [])
  const definirMissions = useCallback(async (agentId: string, missions: string[]) => {
    await db.agents.update(agentId, { missions })
  }, [])

  const value: JeuCtx = {
    pret,
    agents,
    placements,
    templatesRecrutes,
    poseEnCours,
    ficheId,
    recruter,
    creerAgent,
    demarrerDeplacement,
    poser,
    annulerPose,
    ouvrirFiche,
    fermerFiche,
    phaseIntro,
    finirOnboarding,
    finirTour,
    lancerVisite,
    definirAutonomie,
    basculerActif,
    definirMissions,
    economie,
    aValider,
    plusTardListe,
    agentsEnAttente,
    derniereChaine,
    effacerDerniereChaine,
    exemplesPresents,
    nbParAgentSemaine,
    saisir: actions.saisir,
    validerProposition: actions.validerProposition,
    plusTard: actions.plusTard,
    revoir: actions.revoir,
    reprendre: actions.reprendre,
    effacerExemples: actions.effacerExemples,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
