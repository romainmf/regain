import type { BatimentId } from '../../domain/types'
import { Arbre, BOIS, CREME, FEUILLE, Ombre, Pave, PIERRE, Toit, VERRE, nuance } from './primitives'

interface Props {
  id: BatimentId
  couleur: string
  niveau: 1 | 2 | 3
}

/**
 * Dessin d'un bâtiment, origine = centre de sa tuile.
 * Le niveau ajoute des détails (jamais lié à l'argent : il suit l'usage de l'agent).
 */
export function Batiment({ id, couleur, niveau }: Props) {
  const n2 = niveau >= 2
  const n3 = niveau >= 3
  switch (id) {
    case 'cabane':
      return (
        <g>
          <Ombre />
          <Pave w={0.26} d={0.22} h={16} couleur={CREME} />
          <Toit w={0.3} d={0.26} z={16} h={12} couleur={couleur} faitage={0.12} />
          {/* Porte sur la face avant, fenêtre sur la face droite */}
          <polygon points="-9,2.6 -5.1,4.5 -5.1,-4.5 -9,-6.4" fill={BOIS} />
          <polygon points="5,1.5 10,-1 10,-6 5,-3.5" fill={n2 ? '#F6E6C2' : VERRE} />
          <Pave dx={0.12} dy={-0.06} w={0.035} h={8} z={24} couleur={PIERRE} />
          {n2 && <Pave dx={-0.32} dy={0.2} w={0.08} h={6} couleur={BOIS} />}
          {n3 && <Arbre dx={0.3} dy={0.3} r={6} tronc={4} />}
        </g>
      )
    case 'boite-aux-lettres':
      return (
        <g>
          <Ombre w={0.2} />
          <Pave w={0.03} h={14} couleur={BOIS} />
          <Pave w={0.1} d={0.06} h={8} z={14} couleur={couleur} />
          {n2 && <rect x={6} y={-30} width={2} height={10} fill={nuance(couleur, -0.2)} />}
          {n3 && <Arbre dx={0.25} dy={0.2} r={5} tronc={0} />}
        </g>
      )
    case 'tour-de-guet':
      return (
        <g>
          <Ombre w={0.26} />
          <Pave w={0.14} h={n3 ? 34 : n2 ? 28 : 22} couleur={CREME} />
          <Toit w={0.18} z={n3 ? 34 : n2 ? 28 : 22} h={12} couleur={couleur} />
          <circle cx={0} cy={n3 ? -26 : n2 ? -20 : -14} r={2.5} fill="#E7B04A" />
        </g>
      )
    case 'jarre':
      return (
        <g>
          <Ombre w={0.2} />
          <ellipse cx={0} cy={-8} rx={11} ry={12} fill={couleur} />
          <ellipse cx={-3} cy={-12} rx={4} ry={5} fill={nuance(couleur, 0.25)} />
          <ellipse cx={0} cy={-19} rx={6} ry={2.5} fill={nuance(couleur, -0.25)} />
          {n2 && <ellipse cx={14} cy={2} rx={6} ry={7} fill={nuance(couleur, 0.1)} />}
          {n3 && <circle cx={0} cy={-22} r={3} fill="#E7B04A" />}
        </g>
      )
    case 'fontaine':
      return (
        <g>
          <Ombre w={0.3} />
          <Pave w={0.24} h={5} couleur={PIERRE} haut="#BFDCE0" />
          <Pave w={0.04} h={n2 ? 16 : 12} couleur={couleur} />
          {n3 && <circle cx={0} cy={-20} r={3} fill="#BFDCE0" />}
        </g>
      )
    case 'pergola':
      return (
        <g>
          <Ombre w={0.34} />
          {/* Banc à l'abri */}
          <Pave dy={0.05} w={0.16} d={0.05} h={4} z={3} couleur={CREME} />
          {[[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].map(([x, y]) => (
            <Pave key={`${x}${y}`} dx={x} dy={y} w={0.025} h={24} couleur={BOIS} />
          ))}
          <Pave w={0.3} d={0.3} h={2} z={24} couleur={BOIS} haut={nuance(BOIS, 0.25)} />
          {/* La tonnelle s'épaissit avec le niveau */}
          <g>
            <ellipse cx={-10} cy={-27} rx={9} ry={4} fill={FEUILLE} />
            <ellipse cx={9} cy={-25} rx={8} ry={3.5} fill={nuance(FEUILLE, 0.12)} />
            <circle cx={-14} cy={-26} r={2.2} fill={couleur} />
            <circle cx={6} cy={-24} r={2.2} fill={couleur} />
            <path d="M -16 -24 q -1 6 1 10 M 15 -22 q 1 5 -1 9" stroke={FEUILLE} strokeWidth={2} fill="none" strokeLinecap="round" />
          </g>
          {n2 && (
            <g>
              <ellipse cx={0} cy={-31} rx={14} ry={5} fill={nuance(FEUILLE, -0.08)} />
              <circle cx={-4} cy={-31} r={2.4} fill={couleur} />
              <circle cx={10} cy={-28} r={2.2} fill={nuance(couleur, 0.25)} />
              <path d="M -2 -14 q 1 -6 -1 -10" stroke={FEUILLE} strokeWidth={2} fill="none" />
            </g>
          )}
          {n3 && (
            <g>
              <ellipse cx={-4} cy={-35} rx={15} ry={6} fill={nuance(FEUILLE, 0.08)} />
              <circle cx={-12} cy={-34} r={2.6} fill={couleur} />
              <circle cx={3} cy={-37} r={2.6} fill={couleur} />
              <circle cx={12} cy={-32} r={2.4} fill="#E7B04A" />
            </g>
          )}
        </g>
      )
    case 'lanterne':
      return (
        <g>
          <Ombre w={0.15} />
          <Pave w={0.025} h={20} couleur={BOIS} />
          <Pave w={0.06} h={8} z={20} couleur={nuance(couleur, 0.3)} haut={couleur} />
          <circle cx={0} cy={-24} r={n3 ? 9 : n2 ? 7 : 5} fill="#E7B04A" opacity={0.25} />
        </g>
      )
    case 'balance':
      return (
        <g>
          <Ombre w={0.22} />
          <Pave w={0.03} h={18} couleur={BOIS} />
          <line x1={-14} y1={-18} x2={14} y2={-18} stroke={couleur} strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={-14} cy={-10} rx={6} ry={2.5} fill={couleur} />
          <ellipse cx={14} cy={-10} rx={6} ry={2.5} fill={couleur} />
          {n2 && <circle cx={-14} cy={-13} r={2.5} fill={FEUILLE} />}
          {n3 && <circle cx={14} cy={-13} r={2.5} fill="#E7B04A" />}
        </g>
      )
    case 'sentier':
      return (
        <g>
          <path d="M -22 4 Q -6 -6 4 2 T 24 -2" stroke={nuance(couleur, 0.45)} strokeWidth={6} fill="none" strokeLinecap="round" />
          <Arbre dx={-0.25} dy={-0.2} r={6} tronc={4} />
          {n2 && <Arbre dx={0.28} dy={0.15} r={5} tronc={3} couleur={nuance(FEUILLE, 0.1)} />}
          {n3 && <Arbre dx={0.05} dy={-0.35} r={7} tronc={5} couleur={couleur} />}
        </g>
      )
    case 'banc':
      return (
        <g>
          <Ombre w={0.22} />
          <Pave w={0.2} d={0.06} h={5} z={4} couleur={BOIS} />
          <Pave dy={-0.06} w={0.2} d={0.015} h={8} z={9} couleur={couleur} />
          {n2 && <Arbre dx={-0.3} dy={-0.25} r={7} tronc={6} />}
          {n3 && <circle cx={14} cy={-4} r={2.5} fill="#E7B04A" />}
        </g>
      )
    case 'bassin':
      return (
        <g>
          <ellipse cx={0} cy={0} rx={22} ry={11} fill={PIERRE} />
          <ellipse cx={0} cy={-1} rx={18} ry={8.5} fill="#BFDCE0" />
          <ellipse cx={-5} cy={-2} rx={4} ry={1.6} fill={couleur} opacity={0.7} />
          {n2 && <ellipse cx={6} cy={1} rx={3} ry={1.2} fill={FEUILLE} />}
          {n3 && <Arbre dx={0.3} dy={-0.25} r={6} tronc={5} couleur={couleur} />}
        </g>
      )
    case 'serre':
      return (
        <g>
          <Ombre w={0.36} />
          <Pave w={0.3} d={0.22} h={13} couleur="#A9D6C4" haut="#D4EEE4" />
          <Toit w={0.3} d={0.22} z={13} h={13} couleur="#BFE3D5" faitage={0.22} />
          {/* Montants */}
          <g stroke="#FBF8F1" strokeWidth={1} opacity={0.9}>
            <line x1={-14} y1={0} x2={-14} y2={-13} />
            <line x1={-7} y1={3.5} x2={-7} y2={-9.5} />
            <line x1={2} y1={2} x2={2} y2={-11} />
            <line x1={9} y1={-1.5} x2={9} y2={-14.5} />
          </g>
          {/* Plantes */}
          <circle cx={-11} cy={-3} r={3.5} fill={couleur} />
          <circle cx={-4} cy={0} r={3} fill={FEUILLE} />
          {n2 && <circle cx={5} cy={-4} r={3.5} fill={nuance(couleur, 0.15)} />}
          {n2 && <circle cx={-8} cy={-10} r={2} fill="#E7B04A" />}
          {n3 && <Arbre dx={0.36} dy={-0.3} r={7} tronc={5} couleur={couleur} />}
        </g>
      )
    case 'composteur':
      return (
        <g>
          <Ombre w={0.22} />
          <Pave w={0.15} h={12} couleur={BOIS} haut={nuance(BOIS, -0.3)} />
          <circle cx={-2} cy={-14} r={3} fill={couleur} />
          {n2 && <circle cx={4} cy={-13} r={2.5} fill={FEUILLE} />}
          {n3 && <Pave dx={0.28} dy={0.1} w={0.08} h={8} couleur={nuance(BOIS, 0.2)} />}
        </g>
      )
    case 'petit-rail':
      return (
        <g>
          <line x1={-26} y1={-6} x2={20} y2={17} stroke={BOIS} strokeWidth={5} strokeDasharray="2 3" />
          <line x1={-26} y1={-8} x2={20} y2={15} stroke={nuance(BOIS, -0.3)} strokeWidth={1.2} />
          <line x1={-24} y1={-3} x2={22} y2={20} stroke={nuance(BOIS, -0.3)} strokeWidth={1.2} />
          <Pave dx={-0.05} dy={0.02} w={0.12} d={0.07} h={9} z={2} couleur={couleur} />
          {n2 && <Pave dx={0.15} dy={0.12} w={0.09} d={0.06} h={7} z={2} couleur={nuance(couleur, 0.3)} />}
          {n3 && <Arbre dx={-0.3} dy={0.25} r={5} tronc={3} />}
        </g>
      )
    case 'echoppe':
      return (
        <g>
          <Ombre w={0.3} />
          <Pave w={0.22} d={0.18} h={14} couleur={CREME} />
          <Toit w={0.27} d={0.24} z={14} h={8} couleur={couleur} faitage={0.15} />
          <Pave dx={0.05} dy={0.26} w={0.12} d={0.04} h={5} couleur={BOIS} />
          {n2 && <circle cx={10} cy={4} r={2.5} fill="#E7B04A" />}
          {n3 && <Arbre dx={-0.32} dy={0.25} r={5} tronc={3} />}
        </g>
      )
    case 'blason':
      return (
        <g>
          <Ombre w={0.16} />
          <Pave w={0.025} h={24} couleur={BOIS} />
          <path d="M 2 -26 h 14 v 9 q 0 7 -7 9 q -7 -2 -7 -9 z" fill={couleur} />
          {n2 && <circle cx={9} cy={-19} r={2.5} fill="#E7B04A" />}
          {n3 && <Arbre dx={-0.2} dy={0.2} r={5} tronc={0} />}
        </g>
      )
  }
}
