import Anthropic from '@anthropic-ai/sdk'
import { verifierAppelant } from '../../server/compte'

/**
 * Fonction Netlify : fait préparer des propositions par Claude.
 * La clé d'API reste côté serveur (ANTHROPIC_API_KEY). Modèle configurable
 * par AGENT_MODEL (défaut : claude-opus-5-5). Le client (LlmEngine) retombe
 * sur le RuleEngine déterministe en cas d'échec.
 * Exposée sur /api/agent via une réécriture dans netlify.toml.
 * Réservée aux comptes connectés : le jeton Supabase est vérifié avant tout appel.
 */

interface AgentLite {
  id: string
  templateId?: string
  domaine: 'boite' | 'peau' | 'planete'
  actif: boolean
}

interface Brouillon {
  agentId: string
  domaine: AgentLite['domaine']
  type: string
  titre: string
  detail?: string
}

const MODELE = process.env.AGENT_MODEL || 'claude-opus-5-5'

const SYSTEME = `Tu es le moteur d'agents de Regain, un atelier d'agents pour indépendants.
Les agents préparent de petites propositions ; l'utilisateur valide ensuite (rien n'est envoyé).
Trois domaines : "boite" (administratif, factures, trésorerie), "peau" (rythme, énergie, équilibre),
"planete" (empreinte, sobriété). Garde-fous stricts pour "peau" : aucun conseil médical, aucune
donnée de santé, aucun objectif chiffré sur le corps ou l'alimentation ; propose seulement une petite
action liée au rythme de travail. Ton bienveillant, jamais culpabilisant, en français.
À partir d'une saisie de l'utilisateur et de la liste des agents ACTIFS, renvoie uniquement un JSON
de la forme {"brouillons":[{"agentId","domaine","type","titre","detail"}]} (3 propositions maximum).
N'utilise que des agentId présents dans la liste fournie, et respecte le domaine de l'agent choisi.`

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } })

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json({ error: 'Méthode non autorisée' }, 405)
  const acces = await verifierAppelant(req.headers.get('authorization'))
  if (!acces.ok) return json({ error: acces.message }, acces.statut)
  try {
    const { saisie, agents } = (await req.json()) as { saisie?: unknown; agents?: AgentLite[] }
    const actifs = (agents ?? []).filter((a) => a.actif)
    if (!saisie || actifs.length === 0) return json({ brouillons: [] })

    const client = new Anthropic()
    const message = await client.messages.create({
      model: MODELE,
      max_tokens: 1024,
      output_config: { effort: 'low' },
      system: SYSTEME,
      messages: [
        {
          role: 'user',
          content: `Saisie : ${JSON.stringify(saisie)}\nAgents actifs : ${JSON.stringify(
            actifs.map((a) => ({ id: a.id, domaine: a.domaine, templateId: a.templateId })),
          )}\nRéponds uniquement par le JSON demandé.`,
        },
      ],
    })

    const texte = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')

    return json({ brouillons: extraireBrouillons(texte, actifs) })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Erreur serveur' }, 500)
  }
}

function extraireBrouillons(texte: string, actifs: AgentLite[]): Brouillon[] {
  const debut = texte.indexOf('{')
  const fin = texte.lastIndexOf('}')
  if (debut < 0 || fin < debut) return []
  let data: unknown
  try {
    data = JSON.parse(texte.slice(debut, fin + 1))
  } catch {
    return []
  }
  const liste = (data as { brouillons?: unknown }).brouillons
  if (!Array.isArray(liste)) return []
  const parId = new Map(actifs.map((a) => [a.id, a]))
  const out: Brouillon[] = []
  for (const b of liste) {
    if (!b || typeof b !== 'object') continue
    const { agentId, type, titre, detail } = b as Record<string, unknown>
    const agent = typeof agentId === 'string' ? parId.get(agentId) : undefined
    if (!agent || typeof titre !== 'string' || typeof type !== 'string') continue
    out.push({ agentId: agent.id, domaine: agent.domaine, type, titre, detail: typeof detail === 'string' ? detail : undefined })
    if (out.length >= 3) break
  }
  return out
}
