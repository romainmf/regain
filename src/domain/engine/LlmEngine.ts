import type { Brouillon, Saisie } from '../propositions'
import type { AgentEngine, ContexteMoteur } from './AgentEngine'
import { RuleEngine } from './RuleEngine'

/**
 * Moteur LLM optionnel : appelle la fonction serverless /api/agent (la clé
 * d'API reste côté serveur). En cas d'échec — hors ligne, erreur réseau,
 * réponse inattendue — il retombe silencieusement sur le RuleEngine.
 */
export const LlmEngine: AgentEngine = {
  async propose(saisie: Saisie, ctx: ContexteMoteur): Promise<Brouillon[]> {
    try {
      const reponse = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ saisie, agents: ctx.agents }),
        signal: AbortSignal.timeout(12000),
      })
      if (!reponse.ok) return RuleEngine.propose(saisie, ctx)
      const data = (await reponse.json()) as { brouillons?: Brouillon[] }
      const brouillons = data.brouillons
      if (!Array.isArray(brouillons) || brouillons.length === 0) {
        return RuleEngine.propose(saisie, ctx)
      }
      // Sécurité : ne garder que des agents réellement actifs et connus.
      const actifs = new Set(ctx.agents.filter((a) => a.actif).map((a) => a.id))
      const propres = brouillons.filter((b) => actifs.has(b.agentId))
      return propres.length ? propres : RuleEngine.propose(saisie, ctx)
    } catch {
      return RuleEngine.propose(saisie, ctx)
    }
  },
}
