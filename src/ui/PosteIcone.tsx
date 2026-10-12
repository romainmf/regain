import type { Domaine, PosteId } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Poste } from '../island/Poste'

/** Vignette isométrique d'un poste de travail, pour les cartes du catalogue. */
export function PosteIcone({ id, domaine, taille = 72 }: { id: PosteId; domaine: Domaine; taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="-42 -70 84 90" aria-hidden>
      <ellipse cx={0} cy={0} rx={38} ry={19} fill={`var(--${domaine}-teinte)`} />
      <Poste id={id} domaine={domaine} couleur={COULEUR[domaine]} niveau={2} />
    </svg>
  )
}
