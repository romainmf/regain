import { useJeu } from '../data/jeu'
import { getTemplate } from '../domain/catalog'
import { AUTONOMIE_LABEL, DOMAINE_LABEL } from '../domain/types'
import { niveauBatiment } from '../domain/progression'
import { Bouton } from './Boutons'
import { Sheet } from './Sheet'

/**
 * Fiche rapide d'un agent, ouverte au tap sur son bâtiment.
 * La fiche détaillée (compteurs, historique, effet sur les 3 domaines)
 * arrive au jalon 4 ; ici l'essentiel + le déplacement du bâtiment.
 */
export function FicheRapide({
  agentId,
  onFermer,
  onDeplacer,
}: {
  agentId: string | null
  onFermer: () => void
  onDeplacer: (id: string) => void
}) {
  const { agents } = useJeu()
  const agent = agentId ? agents.find((a) => a.id === agentId) : undefined
  const t = agent?.templateId ? getTemplate(agent.templateId) : undefined
  const niveau = agent ? niveauBatiment(agent.validations) : 1

  return (
    <Sheet
      ouvert={!!agent}
      onFermer={onFermer}
      titre={agent?.nom ?? ''}
      pied={
        agent && (
          <Bouton variante="contour" domaine={agent.domaine} onClick={() => onDeplacer(agent.id)} style={{ flex: 1 }}>
            Déplacer le bâtiment
          </Bouton>
        )
      }
    >
      {agent && (
        <div className="fiche">
          <span className={`fiche-pastille pastille-${agent.domaine}`}>{DOMAINE_LABEL[agent.domaine]}</span>
          <p className="fiche-mission">{t?.mission ?? 'Agent personnalisé.'}</p>
          <dl className="fiche-infos">
            <div><dt>Bâtiment</dt><dd>{t?.batimentNom ?? 'Bâtiment'} · niveau {niveau}</dd></div>
            <div><dt>Autonomie</dt><dd>{AUTONOMIE_LABEL[agent.autonomie]}</dd></div>
            <div><dt>Statut</dt><dd>{agent.actif ? 'Actif' : 'En repos'}</dd></div>
          </dl>
          <p className="fiche-note">Astuce : un appui long sur le bâtiment permet aussi de le déplacer.</p>
        </div>
      )}
    </Sheet>
  )
}
