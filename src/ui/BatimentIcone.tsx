import type { BatimentId, Domaine } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Batiment } from '../island/buildings/Batiment'

/** Vignette isométrique d'un bâtiment, pour les cartes du catalogue. */
export function BatimentIcone({ id, domaine, taille = 72 }: { id: BatimentId; domaine: Domaine; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="-42 -70 84 90" aria-hidden>
      <ellipse cx={0} cy={0} rx={38} ry={19} fill={`var(--${domaine}-teinte)`} />
      <Batiment id={id} couleur={COULEUR[domaine]} niveau={2} />
    </svg>
  )
}
