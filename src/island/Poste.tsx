import type { Domaine } from '../domain/types'
import { BOIS, CREME, FEUILLE, Ombre, Pave, nuance } from './buildings/primitives'
import { Robot } from './Robot'

/**
 * Postes de travail solarpunk : à la place d'un bâtiment, chaque agent a un
 * poste qui raconte sa fonction, et son robot y travaille, assis derrière.
 * Base commune : bois clair, liseré à la couleur du domaine, une plante, une
 * petite source d'énergie. Origine = centre de la tuile.
 */
export type PosteId = 'factures' | 'rythme' | 'empreinte' | 'generique'

interface Props {
  id: PosteId
  domaine: Domaine
  couleur: string
  niveau: 1 | 2 | 3
  phase?: number
}

const EINK = '#F1EFE6'
const ARDOISE = '#2D4B5C'

/** Lampe solaire sur tige : petit panneau et globe chaud. */
function LampeSolaire({ x, y, h = 22 }: { x: number; y: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={0} y2={-h} stroke={nuance(BOIS, -0.2)} strokeWidth={1.2} />
      <circle cx={0} cy={-h - 1} r={2.6} fill="#F6E6C2" stroke="#E7B04A" strokeWidth={0.8} />
      <rect x={-4} y={-h - 7} width={8} height={3.5} rx={0.8} fill={ARDOISE} transform={`rotate(-15 0 ${-h - 5})`} />
    </g>
  )
}

/** Plante en pot, petite ou grande selon le niveau. */
function Plante({ x, y, taille }: { x: number; y: number; taille: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <path d={`M -3 0 L 3 0 L 2.4 ${-5} L -2.4 ${-5} Z`} fill="#C98A5E" />
      <circle cx={0} cy={-5 - taille * 0.6} r={taille} fill={FEUILLE} />
      <circle cx={-taille * 0.35} cy={-5 - taille * 0.9} r={taille * 0.45} fill={nuance(FEUILLE, 0.2)} />
    </g>
  )
}

export function Poste({ id, domaine, couleur, niveau, phase = 0 }: Props) {
  const n2 = niveau >= 2
  const n3 = niveau >= 3
  const liseré = couleur
  // Le robot travaille derrière le poste ; le meuble, dessiné après, cache ses pieds : il est assis.
  const robot = (
    <g transform="translate(0 -9) scale(0.9)">
      <Robot domaine={domaine} couleur={couleur} phase={phase} />
    </g>
  )

  switch (id) {
    case 'factures':
      // Bureau d'écriture : écran e-ink sur bras, bac à factures, lampe solaire, pile de feuilles
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          <Pave dy={0.08} w={0.36} d={0.18} h={13} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
          <rect x={-22} y={-9} width={44} height={1.4} fill={liseré} opacity={0.8} transform="skewY(26)" />
          {/* Écran e-ink sur bras articulé */}
          <line x1={8} y1={-14} x2={10} y2={-30} stroke={nuance(BOIS, -0.3)} strokeWidth={1.4} />
          <rect x={2} y={-38} width={16} height={11} rx={1.5} fill={ARDOISE} />
          <rect x={3.5} y={-36.5} width={13} height={8} fill={EINK} />
          <path d="M 5.5 -34 h 9 M 5.5 -32 h 6 M 5.5 -30 h 8" stroke={liseré} strokeWidth={0.8} />
          {/* Bac à factures et pile de feuilles qui monte avec le niveau */}
          <Pave dx={-0.22} dy={0.05} w={0.1} d={0.08} h={4} z={13} couleur={liseré} haut={nuance(liseré, 0.3)} />
          {Array.from({ length: n3 ? 5 : n2 ? 3 : 2 }).map((_, k) => (
            <polygon key={k} points={`-17,${-17 - k * 1.2} -9,${-21 - k * 1.2} -3,${-18 - k * 1.2} -11,${-14 - k * 1.2}`} fill={CREME} stroke="#E2DACA" strokeWidth={0.5} />
          ))}
          <LampeSolaire x={14} y={-10} h={20} />
          <Plante x={-9} y={-3} taille={n2 ? 4 : 3} />
          {n3 && <rect x={-20} y={-40} width={12} height={9} rx={1.2} fill={ARDOISE} />}
        </g>
      )
    case 'rythme':
      // Cabine ronde vitrée : tapis, sablier sur guéridon, tambour de rythme, rideau léger
      return (
        <g>
          <Ombre w={0.34} />
          {/* Sol : tapis rond */}
          <ellipse cx={0} cy={2} rx={22} ry={11} fill={nuance(couleur, 0.55)} />
          <ellipse cx={0} cy={2} rx={16} ry={8} fill="none" stroke={nuance(couleur, 0.3)} strokeWidth={0.8} />
          {/* Paroi arrière vitrée, en arc */}
          <path d="M -24 -4 Q -26 -26 0 -34 Q 26 -26 24 -4" fill="#D4EEE4" opacity={0.35} stroke={BOIS} strokeWidth={1.4} />
          <path d="M -12 -30 Q 0 -38 12 -30" fill="none" stroke="#FBF8F1" strokeWidth={1} opacity={0.8} />
          {robot}
          {/* Guéridon et sablier */}
          <Pave dx={0.16} dy={0.12} w={0.1} d={0.1} h={10} couleur={BOIS} haut="#E8D2B2" />
          <g transform="translate(12 -14)">
            <path d="M -3 -8 L 3 -8 L 0 -3 Z" fill="#9EC3CF" opacity={0.8} />
            <path d="M -3 2 L 3 2 L 0 -3 Z" fill="#9EC3CF" opacity={0.8} />
            <path d="M -3 -8 L 3 -8 L 0 -3 L 3 2 L -3 2 L 0 -3 Z" fill="none" stroke={BOIS} strokeWidth={0.8} />
            <path className="sablier-sable" d="M -1.5 -7.5 L 1.5 -7.5 L 0 -4 Z" fill="#E7B04A" />
            <path d="M -2.2 1.5 L 2.2 1.5 L 0 -0.5 Z" fill="#E7B04A" />
          </g>
          {/* Tambour de rythme */}
          <g transform="translate(-13 -6)">
            <ellipse cx={0} cy={0} rx={6} ry={3} fill={nuance(BOIS, -0.2)} />
            <rect x={-6} y={-6} width={12} height={6} fill={nuance(BOIS, -0.1)} />
            <ellipse cx={0} cy={-6} rx={6} ry={3} fill="#F4EAD5" stroke={liseré} strokeWidth={0.8} />
          </g>
          <LampeSolaire x={-20} y={-6} h={18} />
          <Plante x={20} y={-4} taille={n2 ? 4.5 : 3.5} />
          {n3 && <path d="M 6 -30 q 4 6 0 14" stroke={nuance(couleur, 0.4)} strokeWidth={2} fill="none" />}
        </g>
      )
    case 'empreinte':
      // Table de serre : balance à CO₂, plants étiquetés, ardoise « kg », petite serre à l'arrière
      return (
        <g>
          <Ombre w={0.32} />
          {/* Mini serre derrière */}
          <path d="M -22 -6 L -22 -24 Q -12 -34 -2 -24 L -2 -6 Z" fill="#CFE6E0" opacity={0.6} stroke="#FBF8F1" strokeWidth={1} />
          <line x1={-12} y1={-30} x2={-12} y2={-6} stroke="#FBF8F1" strokeWidth={0.8} />
          {robot}
          <Pave dy={0.08} w={0.36} d={0.18} h={12} couleur={BOIS} haut="#D9B48E" />
          {/* Balance à deux plateaux */}
          <g transform="translate(-10 -14)">
            <line x1={0} y1={0} x2={0} y2={-10} stroke={nuance(BOIS, -0.35)} strokeWidth={1.2} />
            <line x1={-7} y1={-10} x2={7} y2={-10} stroke={nuance(BOIS, -0.35)} strokeWidth={1.2} />
            <ellipse cx={-7} cy={-5} rx={3.5} ry={1.4} fill="#9A907C" />
            <ellipse cx={7} cy={-7} rx={3.5} ry={1.4} fill="#9A907C" />
            <circle cx={-7} cy={-6.5} r={1.4} fill={FEUILLE} />
          </g>
          {/* Plants étiquetés */}
          {[2, 9, 16].map((x, k) => (
            <g key={x} transform={`translate(${x} ${-13 - k * 1.5})`}>
              <rect x={-2} y={-3} width={4} height={3} fill="#C98A5E" />
              <circle cx={0} cy={-5} r={k === 1 && n2 ? 3.2 : 2.2} fill={k % 2 ? nuance(FEUILLE, 0.15) : FEUILLE} />
              <rect x={1.5} y={-9} width={3} height={2} fill="#F4EAD5" />
            </g>
          ))}
          {/* Ardoise du bilan */}
          <g transform="translate(14 -32)">
            <rect x={-7} y={-6} width={14} height={11} rx={1} fill={ARDOISE} />
            <text x={0} y={2} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={5} fontWeight={700} fill="#FBF8F1">kg</text>
            <line x1={-2} y1={-6} x2={-2} y2={-10} stroke={nuance(BOIS, -0.3)} strokeWidth={1} />
            <line x1={2} y1={-6} x2={2} y2={-10} stroke={nuance(BOIS, -0.3)} strokeWidth={1} />
          </g>
          <LampeSolaire x={20} y={-8} h={16} />
          {n3 && <Plante x={-18} y={2} taille={5} />}
        </g>
      )
    default:
      // Poste générique du domaine : bureau, écran e-ink, plante, liseré
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          <Pave dy={0.08} w={0.34} d={0.18} h={13} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
          <rect x={4} y={-30} width={13} height={9} rx={1.2} fill={ARDOISE} />
          <rect x={5.2} y={-28.8} width={10.6} height={6.6} fill={EINK} />
          <line x1={10} y1={-21} x2={10} y2={-14} stroke={nuance(BOIS, -0.3)} strokeWidth={1.2} />
          <LampeSolaire x={-14} y={-10} h={18} />
          <Plante x={16} y={-4} taille={n2 ? 4 : 3} />
        </g>
      )
  }
}
