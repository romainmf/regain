import { Coeur } from '../island/Coeur'

/** Brin : l'arbre au cœur de l'île, dont le pied est un petit serveur. */
export function BrinAvatar({ taille = 40 }: { taille?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="-40 -76 80 80" aria-hidden>
      <circle cx={0} cy={-36} r={40} fill="#F6E6C2" />
      <g transform="translate(0 -4)">
        <Coeur feuilles={false} />
      </g>
    </svg>
  )
}
