import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { getTemplate } from '../domain/catalog'
import type { AgentTemplate, Autonomie, Domaine } from '../domain/types'
import { niveauBatiment } from '../domain/progression'
import type { PlacementVue } from '../island/Island'
import { amorcerSiNecessaire } from './seed'
import { db, nouvelId, type AgentDB } from './db'

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
  recruter: (t: AgentTemplate) => Promise<string>
  creerAgent: (a: Omit<AgentDB, 'id' | 'createdAt'>) => Promise<string>
  demarrerDeplacement: (agentId: string) => void
  poser: (x: number, y: number) => Promise<void>
  annulerPose: () => void
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
    const batiment = t?.batiment ?? 'cabane'
    const batNom = t?.batimentNom ?? 'Le bâtiment'
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

  const value: JeuCtx = {
    pret,
    agents,
    placements,
    templatesRecrutes,
    poseEnCours,
    recruter,
    creerAgent,
    demarrerDeplacement,
    poser,
    annulerPose,
  }

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
