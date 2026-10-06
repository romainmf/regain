import { Pave, BOIS, nuance } from './buildings/primitives'

/** Le Cœur : un arbre dont le pied est un petit serveur. Symbole du local-first. */
export function Coeur() {
  return (
    <g aria-label="Le Cœur de l’île">
      <ellipse cx={0} cy={2} rx={26} ry={13} fill="rgba(34,48,31,.12)" />
      <Pave w={0.2} d={0.16} h={14} couleur="#3A4636" />
      {/* Diodes du serveur */}
      <g className="coeur-diodes">
        <circle cx={-12} cy={-3} r={1.6} fill="#E7B04A" />
        <circle cx={-8} cy={-1} r={1.6} fill="#7FC59B" />
        <circle cx={-4} cy={1} r={1.6} fill="#E7B04A" />
      </g>
      <rect x={-2.5} y={-36} width={5} height={24} fill={BOIS} />
      <path d="M 0 -26 q -8 -4 -12 -10 M 0 -30 q 9 -3 12 -9" stroke={BOIS} strokeWidth={2} fill="none" />
      <circle cx={0} cy={-50} r={20} fill="#2F7A5C" />
      <circle cx={-16} cy={-40} r={11} fill="#9C5B7F" />
      <circle cx={16} cy={-41} r={11} fill="#B0512A" />
      <circle cx={-6} cy={-58} r={8} fill={nuance('#2F7A5C', 0.2)} />
      <circle cx={0} cy={-46} r={4} fill="#E7B04A" />
    </g>
  )
}
