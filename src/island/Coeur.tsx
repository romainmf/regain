import { Pave, BOIS, nuance } from './buildings/primitives'

/**
 * Le Cœur : un arbre dont le pied est un petit serveur. Symbole du local-first.
 * C'est aussi Brin, le guide : il a un visage, cligne des yeux, respire,
 * et laisse tomber quelques feuilles aux trois couleurs de l'île.
 */
export function Coeur({ feuilles = true }: { feuilles?: boolean }) {
  return (
    <g className="coeur">
      <ellipse cx={0} cy={2} rx={26} ry={13} fill="rgba(34,48,31,.12)" />
      <Pave w={0.2} d={0.16} h={14} couleur="#3A4636" />
      {/* Diodes du serveur */}
      <g className="coeur-diodes">
        <circle cx={-12} cy={-3} r={1.6} fill="#E7B04A" />
        <circle cx={-8} cy={-1} r={1.6} fill="#7FC59B" />
        <circle cx={-4} cy={1} r={1.6} fill="#E7B04A" />
      </g>
      {/* Racines qui enlacent le serveur */}
      <path d="M -2 -13 q -6 2 -9 8 M 2 -13 q 5 1 8 6" stroke={nuance(BOIS, -0.1)} strokeWidth={1.8} fill="none" strokeLinecap="round" />
      <rect x={-2.5} y={-36} width={5} height={24} fill={BOIS} />

      <g className="coeur-couronne">
        <path d="M 0 -26 q -8 -4 -12 -10 M 0 -30 q 9 -3 12 -9" stroke={BOIS} strokeWidth={2} fill="none" />
        <circle cx={-16} cy={-40} r={11} fill="#9C5B7F" />
        <circle cx={16} cy={-41} r={11} fill="#B0512A" />
        <circle cx={0} cy={-50} r={20} fill="#2F7A5C" />
        <circle cx={-7} cy={-60} r={7} fill={nuance('#2F7A5C', 0.2)} />
        <circle cx={-19} cy={-43} r={3.5} fill={nuance('#9C5B7F', 0.25)} />
        <circle cx={19} cy={-45} r={3.5} fill={nuance('#B0512A', 0.25)} />
        {/* Petit fruit doré */}
        <circle cx={12} cy={-63} r={3} fill="#E7B04A" />
        <path d="M 12 -66 q 1 -3 3 -3" stroke="#5E9B62" strokeWidth={1.2} fill="none" />

        {/* Visage */}
        <g className="coeur-yeux">
          <ellipse cx={-6.5} cy={-49} rx={2} ry={2.6} fill="#22301F" />
          <ellipse cx={6.5} cy={-49} rx={2} ry={2.6} fill="#22301F" />
          <circle cx={-5.8} cy={-50} r={0.7} fill="#FBF8F1" />
          <circle cx={7.2} cy={-50} r={0.7} fill="#FBF8F1" />
        </g>
        <ellipse cx={-11} cy={-44} rx={2.6} ry={1.5} fill="#E89A8A" opacity={0.75} />
        <ellipse cx={11} cy={-44} rx={2.6} ry={1.5} fill="#E89A8A" opacity={0.75} />
        <path d="M -3.5 -43.5 q 3.5 3.2 7 0" stroke="#22301F" strokeWidth={1.4} fill="none" strokeLinecap="round" />
      </g>

      {feuilles && (
        <g className="coeur-feuilles" aria-hidden>
          <path className="feuille f1" d="M -18 -36 q 3 -4 6 0 q -3 4 -6 0 Z" fill="#9C5B7F" />
          <path className="feuille f2" d="M 15 -34 q 3 -4 6 0 q -3 4 -6 0 Z" fill="#B0512A" />
          <path className="feuille f3" d="M -4 -32 q 3 -4 6 0 q -3 4 -6 0 Z" fill="#5E9B62" />
        </g>
      )}
    </g>
  )
}
