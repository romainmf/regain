import type { Domaine } from '../domain/types'
import { nuance } from './buildings/primitives'

const OR = '#E7B04A'
const METAL = '#EDE6D6'
const METAL_OMBRE = '#D8CFBB'
const VISIERE = '#2D4B5C'

/**
 * Petit robot solarpunk, compagnon d'un agent. Carrosserie à la couleur du
 * domaine, panneau solaire dans le dos, antenne à pousse lumineuse, visage
 * doux derrière une visière. Il flotte doucement et cligne des yeux.
 * Origine = ses pieds ; pensé pour être posé à côté d'un bâtiment.
 */
export function Robot({ domaine, couleur, phase = 0 }: { domaine: Domaine; couleur: string; phase?: number }) {
  const sombre = nuance(couleur, -0.15)
  return (
    <g className="robot" style={{ ['--phase' as string]: `${phase}s` }}>
      <ellipse cx={0} cy={1} rx={8} ry={3} fill="rgba(34,48,31,.18)" />

      <g className="robot-corps">
        {/* Panneau solaire dans le dos */}
        <g transform="translate(6 -17) rotate(18)">
          <rect x={-2} y={-7} width={9} height={12} rx={1.2} fill={VISIERE} />
          <path d="M 0 -6 h 7 M -1 -2 h 8 M -1 2 h 8 M 2 -7 V 4" stroke="#6E93A3" strokeWidth={0.5} />
        </g>

        {/* Corps */}
        <path d="M -7 -3 Q -8 -15 0 -16 Q 8 -15 7 -3 Q 7 1 0 1 Q -7 1 -7 -3 Z" fill={couleur} />
        <path d="M -7 -3 Q -8 -15 0 -16 Q 2 -16 3 -15 Q -4 -13 -4 -3 Q -4 0 0 1 Q -7 1 -7 -3 Z" fill={nuance(couleur, 0.18)} opacity={0.6} />
        {/* Ventre : petit panneau lumineux */}
        <rect x={-3.5} y={-10} width={7} height={5} rx={1.5} fill={sombre} />
        <circle className="robot-coeur" cx={0} cy={-7.5} r={1.4} fill={OR} />

        {/* Bras : l'un salue */}
        <path className="robot-bras" d="M -6 -11 q -5 -1 -6 -5" stroke={sombre} strokeWidth={2.2} fill="none" strokeLinecap="round" />
        <path d="M 6 -11 q 4 0 5 3" stroke={sombre} strokeWidth={2.2} fill="none" strokeLinecap="round" />

        {/* Tête */}
        <rect x={-6} y={-27} width={12} height={10} rx={5} fill={METAL} />
        <rect x={-6} y={-23} width={12} height={6} rx={3} fill={METAL_OMBRE} />
        <rect x={-4.5} y={-25} width={9} height={5} rx={2.5} fill={VISIERE} />
        <g className="robot-yeux">
          <circle cx={-2} cy={-22.5} r={1.1} fill={OR} />
          <circle cx={2} cy={-22.5} r={1.1} fill={OR} />
        </g>
        {/* Oreillettes */}
        <circle cx={-6} cy={-22} r={1.6} fill={METAL_OMBRE} />
        <circle cx={6} cy={-22} r={1.6} fill={METAL_OMBRE} />

        {/* Antenne à pousse */}
        <line x1={0} y1={-27} x2={0} y2={-32} stroke={METAL_OMBRE} strokeWidth={1.4} />
        <circle className="robot-antenne" cx={0} cy={-33} r={1.8} fill={OR} />
        <path d="M 0 -33 q 3 -1 3 -4 q -3 0 -3 3 Z" fill="#5E9B62" />
      </g>

      {/* Emblème du domaine, tenu dans la main levée */}
      <g transform="translate(-12 -17)">
        {domaine === 'boite' && (
          <g>
            <rect x={-3} y={-4} width={6} height={7} rx={1} fill={METAL} stroke={sombre} strokeWidth={0.8} />
            <path d="M -1.5 -4 v -1.5 h 3 V -4" fill="none" stroke={sombre} strokeWidth={0.8} />
            <path d="M -1.5 -1 h 3 M -1.5 1 h 3" stroke={couleur} strokeWidth={0.7} />
          </g>
        )}
        {domaine === 'peau' && (
          <path d="M 0 3 C -4 0 -3 -4 -1 -4 C 0 -4 0 -3 0 -2.5 C 0 -3 0 -4 1 -4 C 3 -4 4 0 0 3 Z" fill={couleur} />
        )}
        {domaine === 'planete' && (
          <g>
            <path d="M 0 3 V -2" stroke="#5E9B62" strokeWidth={1} />
            <path d="M 0 -1 C -3 -1 -3.5 -4 -3 -5 C -1 -5 0 -3 0 -1 Z M 0 -2 C 3 -2 3.5 -5 3 -6 C 1 -6 0 -4 0 -2 Z" fill="#5E9B62" />
          </g>
        )}
      </g>
    </g>
  )
}
