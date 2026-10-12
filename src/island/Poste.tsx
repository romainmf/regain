import type { Domaine, PosteId } from '../domain/types'
import { BOIS, CREME, FEUILLE, Ombre, Pave, nuance } from './buildings/primitives'
import { Robot } from './Robot'

/**
 * Postes de travail solarpunk : à la place d'un bâtiment, chaque agent a un
 * poste qui raconte sa fonction, et son robot y travaille, assis derrière.
 * Base commune : bois clair, liseré à la couleur du domaine, une plante, une
 * petite source d'énergie. Le niveau enrichit le poste (plante qui grandit,
 * second écran, lampe de plus), jamais d'or ni de marbre.
 * Origine = centre de la tuile.
 */
export type { PosteId }

interface Props {
  id: PosteId
  domaine: Domaine
  couleur: string
  niveau: 1 | 2 | 3
  phase?: number
}

const EINK = '#F1EFE6'
const ARDOISE = '#2D4B5C'
const OR = '#E7B04A'
const METAL = '#9A907C'
const EAU = '#9FCBD1'

/** Lampe solaire sur tige : petit panneau et globe chaud. */
function LampeSolaire({ x, y, h = 22 }: { x: number; y: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={0} y1={0} x2={0} y2={-h} stroke={nuance(BOIS, -0.2)} strokeWidth={1.2} />
      <circle cx={0} cy={-h - 1} r={2.6} fill="#F6E6C2" stroke={OR} strokeWidth={0.8} />
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

/** Écran e-ink sur bras articulé, avec quelques lignes à la couleur du domaine. */
function Ecran({ x, y, couleur, l = 16, h = 11 }: { x: number; y: number; couleur: string; l?: number; h?: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <line x1={l / 2} y1={h + 2} x2={l / 2 + 2} y2={h + 14} stroke={nuance(BOIS, -0.3)} strokeWidth={1.4} />
      <rect x={0} y={0} width={l} height={h} rx={1.5} fill={ARDOISE} />
      <rect x={1.5} y={1.5} width={l - 3} height={h - 3} fill={EINK} />
      <path d={`M 3.5 4 h ${l - 7} M 3.5 6 h ${l - 10} M 3.5 8 h ${l - 8}`} stroke={couleur} strokeWidth={0.8} />
    </g>
  )
}

/** Bureau standard en bois clair, liseré du domaine. */
function Bureau({ couleur, w = 0.36 }: { couleur: string; w?: number }) {
  return (
    <g>
      <Pave dy={0.08} w={w} d={0.18} h={13} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
      <rect x={-w * 60} y={-9} width={w * 120} height={1.4} fill={couleur} opacity={0.8} transform="skewY(26)" />
    </g>
  )
}

export function Poste({ id, domaine, couleur, niveau, phase = 0 }: Props) {
  const n2 = niveau >= 2
  const n3 = niveau >= 3
  const plante = n3 ? 5 : n2 ? 4 : 3
  // Le robot travaille derrière le poste ; le meuble, dessiné après, cache ses pieds : il est assis.
  const robot = (
    <g transform="translate(0 -9) scale(0.9)">
      <Robot domaine={domaine} couleur={couleur} phase={phase} />
    </g>
  )

  switch (id) {
    // ——— Atelier · Ma boîte ———
    case 'factures':
      // Bureau d'écriture : écran e-ink sur bras, bac à factures, pile de brouillons qui monte
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          <Bureau couleur={couleur} />
          <Ecran x={2} y={-38} couleur={couleur} />
          <Pave dx={-0.22} dy={0.05} w={0.1} d={0.08} h={4} z={13} couleur={couleur} haut={nuance(couleur, 0.3)} />
          {Array.from({ length: n3 ? 5 : n2 ? 3 : 2 }).map((_, k) => (
            <polygon key={k} points={`-17,${-17 - k * 1.2} -9,${-21 - k * 1.2} -3,${-18 - k * 1.2} -11,${-14 - k * 1.2}`} fill={CREME} stroke="#E2DACA" strokeWidth={0.5} />
          ))}
          <LampeSolaire x={14} y={-10} h={20} />
          <Plante x={-9} y={-3} taille={plante} />
          {n3 && <Ecran x={-22} y={-42} couleur={couleur} l={12} h={9} />}
        </g>
      )
    case 'relance':
      // Comptoir-courrier : casier à lettres, tampon, mini pigeonnier végétalisé
      return (
        <g>
          <Ombre w={0.3} />
          {/* Pigeonnier derrière */}
          <g transform="translate(-16 -8)">
            <rect x={-1} y={-30} width={2} height={22} fill={nuance(BOIS, -0.2)} />
            <Pave w={0.1} d={0.1} h={8} z={30} couleur={CREME} />
            <path d="M -5 -38 L 0 -43 L 5 -38 Z" fill={FEUILLE} />
            <circle cx={0} cy={-34} r={1.4} fill={ARDOISE} />
          </g>
          {robot}
          <Bureau couleur={couleur} />
          {/* Casier à lettres */}
          <g transform="translate(6 -24)">
            <rect x={0} y={0} width={14} height={9} fill={nuance(BOIS, -0.15)} />
            {[0, 1, 2].map((k) => <rect key={k} x={1 + k * 4.4} y={1} width={3.6} height={7} fill={k === 1 ? CREME : nuance(couleur, 0.5)} />)}
          </g>
          {/* Tampon et enveloppe */}
          <rect x={-8} y={-18} width={4} height={5} rx={1} fill={nuance(couleur, -0.1)} />
          <polygon points="-16,-15 -9,-18.5 -4,-16 -11,-12.5" fill={CREME} stroke={couleur} strokeWidth={0.6} />
          <LampeSolaire x={16} y={-9} h={18} />
          <Plante x={-2} y={-2} taille={plante - 0.5} />
          {n3 && <circle cx={-16} cy={-48} r={1.5} fill={CREME} />}
        </g>
      )
    case 'vigie':
      // Poste haut : tabouret, longue-vue sur trépied, tableau de bord à jauges
      return (
        <g>
          <Ombre w={0.28} />
          {/* Estrade */}
          <Pave w={0.4} d={0.3} h={5} couleur={nuance(BOIS, 0.05)} />
          <g transform="translate(0 -5)">{robot}</g>
          <Pave dy={0.1} w={0.3} d={0.14} h={12} z={5} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
          {/* Tableau de bord : trois jauges */}
          <g transform="translate(-6 -36)">
            <rect x={0} y={0} width={18} height={11} rx={1.5} fill={ARDOISE} />
            {[0, 1, 2].map((k) => (
              <g key={k}>
                <rect x={2 + k * 5.5} y={2} width={3.5} height={7} fill="#3A5E72" />
                <rect x={2 + k * 5.5} y={9 - [5, 3, n2 ? 6 : 2][k]} width={3.5} height={[5, 3, n2 ? 6 : 2][k]} fill={k === 2 ? OR : nuance(couleur, 0.3)} />
              </g>
            ))}
          </g>
          {/* Longue-vue sur trépied */}
          <g transform="translate(16 -10)">
            <path d="M -4 0 L 0 -12 L 4 0 M 0 -12 L 0 -2" stroke={nuance(BOIS, -0.3)} strokeWidth={1} fill="none" />
            <rect x={-6} y={-16} width={12} height={3.5} rx={1.5} fill={METAL} transform="rotate(-25 0 -14)" />
          </g>
          <LampeSolaire x={-18} y={-8} h={16} />
          <Plante x={-14} y={2} taille={plante - 1} />
        </g>
      )
    case 'coussin':
      // Bureau-tirelire : coffre en terre cuite qui se remplit, balance de précision
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          <Bureau couleur={couleur} />
          {/* Coffre-tirelire */}
          <g transform="translate(-8 -16)">
            <ellipse cx={0} cy={0} rx={7} ry={3} fill="#A2714E" />
            <path d="M -7 0 Q -8 -9 0 -10 Q 8 -9 7 0 Z" fill="#C98A5E" />
            <ellipse cx={0} cy={-9} rx={3} ry={1.2} fill="#8A6A4A" />
            <rect x={-2} y={-11.5} width={4} height={1.2} fill={ARDOISE} />
            {Array.from({ length: n3 ? 4 : n2 ? 2 : 1 }).map((_, k) => <circle key={k} cx={-3 + k * 2.2} cy={-12 - (k % 2)} r={1.1} fill={OR} />)}
          </g>
          {/* Balance de précision */}
          <g transform="translate(10 -18)">
            <line x1={0} y1={0} x2={0} y2={-7} stroke={METAL} strokeWidth={1} />
            <line x1={-5} y1={-7} x2={5} y2={-7} stroke={METAL} strokeWidth={1} />
            <ellipse cx={-5} cy={-4} rx={2.5} ry={1} fill={METAL} />
            <ellipse cx={5} cy={-5} rx={2.5} ry={1} fill={METAL} />
          </g>
          <LampeSolaire x={18} y={-8} h={16} />
          <Plante x={-18} y={-2} taille={plante} />
        </g>
      )
    case 'don':
      // Table-fontaine : vasque au milieu, graines qui flottent, carnet des causes
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          <Bureau couleur={couleur} w={0.38} />
          {/* Vasque */}
          <g transform="translate(0 -17)">
            <ellipse cx={0} cy={0} rx={9} ry={4} fill="#9A907C" />
            <ellipse cx={0} cy={-1} rx={7} ry={3} fill={EAU} />
            <ellipse className="source-ride" cx={0} cy={-1} rx={3} ry={1.2} fill="none" stroke="#FBF8F1" strokeWidth={0.6} />
            {[-3, 2, 4].map((x, k) => <circle key={x} cx={x} cy={-1.5 + (k % 2)} r={0.9} fill={OR} />)}
            <path className="filet" d="M 0 -9 q 1 4 0 8" stroke="#CFE6EC" strokeWidth={1.2} fill="none" />
            <rect x={-1} y={-11} width={2} height={3} fill={METAL} />
          </g>
          {/* Carnet des causes */}
          <polygon points="12,-14 18,-17 22,-15 16,-12" fill={CREME} stroke={FEUILLE} strokeWidth={0.6} />
          <LampeSolaire x={-18} y={-8} h={18} />
          <Plante x={16} y={-3} taille={plante} />
          {n2 && <circle cx={-6} cy={-28} r={1.2} fill={OR} />}
        </g>
      )

    // ——— Spa · Ma peau ———
    case 'rythme':
      // Cabine ronde vitrée : tapis, sablier sur guéridon, tambour de rythme
      return (
        <g>
          <Ombre w={0.34} />
          <ellipse cx={0} cy={2} rx={22} ry={11} fill={nuance(couleur, 0.55)} />
          <ellipse cx={0} cy={2} rx={16} ry={8} fill="none" stroke={nuance(couleur, 0.3)} strokeWidth={0.8} />
          <path d="M -24 -4 Q -26 -26 0 -34 Q 26 -26 24 -4" fill="#D4EEE4" opacity={0.35} stroke={BOIS} strokeWidth={1.4} />
          <path d="M -12 -30 Q 0 -38 12 -30" fill="none" stroke="#FBF8F1" strokeWidth={1} opacity={0.8} />
          {robot}
          <Pave dx={0.16} dy={0.12} w={0.1} d={0.1} h={10} couleur={BOIS} haut="#E8D2B2" />
          <g transform="translate(12 -14)">
            <path d="M -3 -8 L 3 -8 L 0 -3 Z M -3 2 L 3 2 L 0 -3 Z" fill="#9EC3CF" opacity={0.8} />
            <path d="M -3 -8 L 3 -8 L 0 -3 L 3 2 L -3 2 L 0 -3 Z" fill="none" stroke={BOIS} strokeWidth={0.8} />
            <path d="M -1.5 -7.5 L 1.5 -7.5 L 0 -4 Z M -2.2 1.5 L 2.2 1.5 L 0 -0.5 Z" fill={OR} />
          </g>
          <g transform="translate(-13 -6)">
            <ellipse cx={0} cy={0} rx={6} ry={3} fill={nuance(BOIS, -0.2)} />
            <rect x={-6} y={-6} width={12} height={6} fill={nuance(BOIS, -0.1)} />
            <ellipse cx={0} cy={-6} rx={6} ry={3} fill={CREME} stroke={couleur} strokeWidth={0.8} />
          </g>
          <LampeSolaire x={-20} y={-6} h={18} />
          <Plante x={20} y={-4} taille={plante} />
          {n3 && <path d="M 6 -30 q 4 6 0 14" stroke={nuance(couleur, 0.4)} strokeWidth={2} fill="none" />}
        </g>
      )
    case 'cloture':
      // Bureau du soir : lanterne solaire, grand interrupteur « couper », rideau à moitié tiré
      return (
        <g>
          <Ombre w={0.3} />
          {/* Rideau derrière */}
          <g transform="translate(-10 -8)">
            <line x1={-14} y1={-34} x2={14} y2={-34} stroke={nuance(BOIS, -0.2)} strokeWidth={1.4} />
            <path d="M -14 -34 q 2 10 -1 20 q 3 6 0 12 L -8 -2 q -2 -14 1 -22 q -2 -6 1 -10 Z" fill={nuance(couleur, 0.35)} />
            <path d="M -6 -34 q 2 8 0 16 q 2 10 -1 16 L 0 -2 q -1 -12 1 -20 q -2 -6 0 -12 Z" fill={nuance(couleur, 0.5)} />
          </g>
          {robot}
          <Bureau couleur={couleur} />
          {/* Interrupteur « couper » */}
          <g transform="translate(-6 -18)">
            <rect x={-5} y={-4} width={10} height={6} rx={1.5} fill={CREME} stroke={METAL} strokeWidth={0.6} />
            <rect x={-3.5} y={-3} width={4} height={4} rx={1} fill={couleur} />
          </g>
          {/* Lanterne solaire posée */}
          <g transform="translate(10 -20)">
            <rect x={-3.5} y={-8} width={7} height={8} rx={1} fill="#F6E6C2" stroke={nuance(BOIS, -0.2)} strokeWidth={0.8} />
            <rect x={-4} y={-10} width={8} height={2} fill={ARDOISE} />
            <circle className="robot-coeur" cx={0} cy={-4} r={1.6} fill={OR} />
          </g>
          <Plante x={18} y={-3} taille={plante} />
          {n2 && <LampeSolaire x={-20} y={0} h={16} />}
        </g>
      )
    case 'regulateur':
      // Établi-balance : deux plateaux, galets « semaines »
      return (
        <g>
          <Ombre w={0.32} />
          {robot}
          <Bureau couleur={couleur} w={0.38} />
          <g transform="translate(0 -14)">
            <line x1={0} y1={0} x2={0} y2={-14} stroke={nuance(BOIS, -0.35)} strokeWidth={1.6} />
            <line x1={-11} y1={-13} x2={11} y2={-15} stroke={nuance(BOIS, -0.35)} strokeWidth={1.4} />
            <line x1={-11} y1={-13} x2={-11} y2={-6} stroke={METAL} strokeWidth={0.6} />
            <line x1={11} y1={-15} x2={11} y2={-9} stroke={METAL} strokeWidth={0.6} />
            <ellipse cx={-11} cy={-6} rx={5} ry={2} fill={METAL} />
            <ellipse cx={11} cy={-9} rx={5} ry={2} fill={METAL} />
            {[-13, -10, -8].slice(0, n2 ? 3 : 2).map((x) => <ellipse key={x} cx={x} cy={-7.5} rx={1.6} ry={1.1} fill={nuance(couleur, 0.2)} />)}
            <ellipse cx={11} cy={-10.5} rx={1.6} ry={1.1} fill={nuance(couleur, 0.2)} />
          </g>
          <LampeSolaire x={18} y={-8} h={18} />
          <Plante x={-18} y={-2} taille={plante} />
        </g>
      )
    case 'air':
      // La porte vers dehors : sac à dos posé, carte au mur, porte entrouverte, boussole
      return (
        <g>
          <Ombre w={0.3} />
          {/* Porte entrouverte, vue de dedans */}
          <g transform="translate(-14 -6)">
            <rect x={-7} y={-34} width={14} height={34} fill={nuance(BOIS, 0.25)} />
            <polygon points="-7,-34 -7,0 2,-6 2,-30" fill={nuance(BOIS, -0.1)} />
            <polygon points="2,-30 7,-34 7,0 2,-6" fill="#CFE6E0" />
            <circle cx={0} cy={-16} r={1} fill={OR} />
          </g>
          {/* Carte au mur */}
          <g transform="translate(10 -36)">
            <rect x={-7} y={-5} width={14} height={10} fill={CREME} stroke={nuance(BOIS, -0.2)} strokeWidth={0.6} />
            <path d="M -5 2 q 3 -5 6 -2 t 4 -3" stroke={FEUILLE} strokeWidth={0.8} fill="none" />
            <circle cx={1} cy={-1} r={1} fill={couleur} />
          </g>
          {robot}
          <Pave dx={0.1} dy={0.1} w={0.22} d={0.14} h={11} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
          {/* Sac à dos et boussole */}
          <g transform="translate(14 -4)">
            <path d="M -5 0 Q -6 -10 0 -11 Q 6 -10 5 0 Z" fill={couleur} />
            <rect x={-3} y={-6} width={6} height={3} rx={1} fill={nuance(couleur, 0.3)} />
          </g>
          <g transform="translate(4 -20)">
            <circle r={2.6} fill={CREME} stroke={METAL} strokeWidth={0.6} />
            <path d="M 0 -2 L 0.8 0 L 0 2 L -0.8 0 Z" fill={couleur} />
          </g>
          <Plante x={22} y={-8} taille={plante} />
          {n2 && <LampeSolaire x={-24} y={2} h={14} />}
        </g>
      )
    case 'lien':
      // Banc-bureau à deux places : théière, deux tasses, la seconde chaise reste vide
      return (
        <g>
          <Ombre w={0.34} />
          <g transform="translate(-8 0)">{robot}</g>
          {/* Chaise vide, invitation */}
          <g transform="translate(14 -12)">
            <Pave w={0.08} d={0.08} h={6} couleur={nuance(BOIS, -0.1)} />
            <rect x={-5} y={-16} width={2} height={10} fill={nuance(BOIS, -0.2)} />
            <rect x={-5} y={-16} width={8} height={2} fill={nuance(BOIS, -0.2)} />
          </g>
          <Pave dy={0.1} w={0.42} d={0.16} h={12} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
          {/* Théière et deux tasses */}
          <g transform="translate(-2 -16)">
            <ellipse cx={0} cy={0} rx={4.5} ry={3.5} fill={CREME} stroke={METAL} strokeWidth={0.6} />
            <path d="M 4 -1 q 3 -1 3 2" stroke={METAL} strokeWidth={1} fill="none" />
            <rect x={-1} y={-5} width={2} height={1.5} fill={METAL} />
            <path className="vapeur" d="M 0 -7 q -1 -3 0 -6" stroke="#FBF8F1" strokeWidth={1} fill="none" opacity={0.8} />
          </g>
          {[-12, 9].map((x, k) => (
            <g key={x} transform={`translate(${x} ${-14 - k})`}>
              <ellipse cx={0} cy={1} rx={3} ry={1.4} fill={METAL} opacity={0.5} />
              <rect x={-2} y={-3} width={4} height={4} rx={1} fill={k ? CREME : nuance(couleur, 0.4)} />
            </g>
          ))}
          <LampeSolaire x={-22} y={-6} h={18} />
          <Plante x={22} y={0} taille={plante} />
        </g>
      )
    case 'miroir':
      // Bureau-miroir : petit bassin-miroir, cadre de la semaine
      return (
        <g>
          <Ombre w={0.32} />
          {/* Cadre de la semaine au mur */}
          <g transform="translate(-12 -40)">
            <rect x={-7} y={-6} width={14} height={11} rx={1} fill={nuance(BOIS, -0.1)} />
            <rect x={-5.5} y={-4.5} width={11} height={8} fill={CREME} />
            {[0, 1, 2, 3, 4].slice(0, n3 ? 5 : n2 ? 4 : 3).map((k) => <rect key={k} x={-4 + k * 1.9} y={2 - (k % 3) * 1.5 - 1} width={1.3} height={(k % 3) * 1.5 + 1.5} fill={couleur} />)}
          </g>
          {robot}
          <Bureau couleur={couleur} w={0.34} />
          {/* Bassin-miroir */}
          <g transform="translate(6 -16)">
            <ellipse cx={0} cy={0} rx={9} ry={4} fill={METAL} />
            <ellipse cx={0} cy={-0.5} rx={7.5} ry={3} fill={EAU} />
            <ellipse className="source-ride" cx={-2} cy={-1} rx={3} ry={1} fill="#FBF8F1" opacity={0.7} />
          </g>
          <LampeSolaire x={-18} y={-8} h={16} />
          <Plante x={18} y={-2} taille={plante} />
        </g>
      )

    // ——— Jardin · Ma planète ———
    case 'empreinte':
      // Table de serre : balance à CO₂, plants étiquetés, ardoise « kg », mini-serre derrière
      return (
        <g>
          <Ombre w={0.32} />
          <path d="M -22 -6 L -22 -24 Q -12 -34 -2 -24 L -2 -6 Z" fill="#CFE6E0" opacity={0.6} stroke="#FBF8F1" strokeWidth={1} />
          <line x1={-12} y1={-30} x2={-12} y2={-6} stroke="#FBF8F1" strokeWidth={0.8} />
          {robot}
          <Pave dy={0.08} w={0.36} d={0.18} h={12} couleur={BOIS} haut="#D9B48E" />
          <g transform="translate(-10 -14)">
            <line x1={0} y1={0} x2={0} y2={-10} stroke={nuance(BOIS, -0.35)} strokeWidth={1.2} />
            <line x1={-7} y1={-10} x2={7} y2={-10} stroke={nuance(BOIS, -0.35)} strokeWidth={1.2} />
            <ellipse cx={-7} cy={-5} rx={3.5} ry={1.4} fill={METAL} />
            <ellipse cx={7} cy={-7} rx={3.5} ry={1.4} fill={METAL} />
            <circle cx={-7} cy={-6.5} r={1.4} fill={FEUILLE} />
          </g>
          {[2, 9, 16].map((x, k) => (
            <g key={x} transform={`translate(${x} ${-13 - k * 1.5})`}>
              <rect x={-2} y={-3} width={4} height={3} fill="#C98A5E" />
              <circle cx={0} cy={-5} r={k === 1 && n2 ? 3.2 : 2.2} fill={k % 2 ? nuance(FEUILLE, 0.15) : FEUILLE} />
              <rect x={1.5} y={-9} width={3} height={2} fill={CREME} />
            </g>
          ))}
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
    case 'sobriete':
      // Composteur-serveur : ancien rack devenu bac à compost, une pousse sort d'un disque
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          {/* Rack reconverti */}
          <Pave dy={0.06} w={0.26} d={0.2} h={18} couleur={METAL} haut="#8A6A4A" />
          {[4, 9, 14].map((z, k) => (
            <g key={z}>
              <rect x={-14} y={-z - 8} width={14} height={2.2} fill={k === 1 ? ARDOISE : '#5C6B73'} transform="skewY(26)" />
              <circle cx={-3} cy={-z - 4} r={0.6} fill={k === 1 ? FEUILLE : OR} />
            </g>
          ))}
          {/* Terreau et pousse */}
          <g transform="translate(2 -20)">
            <path d="M -6 0 q 3 -3 6 -1 q 3 -2 6 1" stroke="#6B4F36" strokeWidth={2} fill="none" />
            <path d="M 0 0 V -7" stroke={FEUILLE} strokeWidth={1.2} />
            <path d="M 0 -5 C -3 -5 -4 -8 -3 -9 C -1 -9 0 -7 0 -5 Z M 0 -6 C 3 -6 4 -9 3 -10 C 1 -10 0 -8 0 -6 Z" fill={FEUILLE} />
            {n2 && <circle cx={5} cy={-1} r={1.3} fill="#8DBF85" />}
          </g>
          {/* Petit panneau solaire sur le toit du rack */}
          <rect x={-8} y={-32} width={10} height={4} rx={0.8} fill={ARDOISE} transform="rotate(-12 -3 -30)" />
          <LampeSolaire x={18} y={-6} h={16} />
          <Plante x={-20} y={-2} taille={plante} />
        </g>
      )
    case 'deplacements':
      // Garage à vélo-cargo : vélo garé, carte des trajets, petit rail de draisine
      return (
        <g>
          <Ombre w={0.34} />
          {/* Rail au sol */}
          <g stroke={METAL} strokeWidth={1}>
            <line x1={-24} y1={6} x2={10} y2={-11} />
            <line x1={-22} y1={9} x2={12} y2={-8} />
          </g>
          {[-16, -8, 0].map((x) => <line key={x} x1={x} y1={x * -0.5 + 1} x2={x + 2} y2={x * -0.5 + 4} stroke={nuance(BOIS, -0.2)} strokeWidth={1} />)}
          {/* Carte des trajets */}
          <g transform="translate(12 -38)">
            <rect x={-8} y={-6} width={16} height={12} fill={CREME} stroke={nuance(BOIS, -0.2)} strokeWidth={0.6} />
            <path d="M -6 3 L -2 -1 L 2 1 L 6 -4" stroke={couleur} strokeWidth={1} fill="none" strokeDasharray="2 1" />
            <circle cx={6} cy={-4} r={1.2} fill={FEUILLE} />
          </g>
          {robot}
          {/* Vélo-cargo */}
          <g transform="translate(6 -4)">
            <circle cx={-8} cy={0} r={4} fill="none" stroke="#22301F" strokeWidth={1.2} />
            <circle cx={8} cy={-2} r={4} fill="none" stroke="#22301F" strokeWidth={1.2} />
            <path d="M -8 0 L -2 -6 L 8 -2 M -2 -6 L 0 -9 M -8 0 L -3 -10 L 2 -9" stroke="#22301F" strokeWidth={1.2} fill="none" />
            <rect x={-9} y={-12} width={9} height={6} rx={1} fill={couleur} />
            <rect x={-8} y={-11} width={7} height={1.6} fill={nuance(couleur, 0.4)} />
          </g>
          {/* Draisine */}
          <g className="draisine" transform="translate(-14 -6)">
            <rect x={-4} y={-4} width={8} height={4} rx={1} fill={nuance(BOIS, -0.1)} />
            <circle cx={-2.5} cy={0.5} r={1.2} fill="#22301F" />
            <circle cx={2.5} cy={0.5} r={1.2} fill="#22301F" />
          </g>
          <LampeSolaire x={-20} y={-14} h={16} />
          <Plante x={20} y={2} taille={plante} />
        </g>
      )
    case 'achats':
      // Échoppe-réparation : étal, outils, objets reconditionnés étiquetés, pancarte « local »
      return (
        <g>
          <Ombre w={0.32} />
          {/* Auvent de l'étal */}
          <g transform="translate(0 -8)">
            <rect x={-18} y={-30} width={2} height={26} fill={nuance(BOIS, -0.2)} />
            <rect x={16} y={-34} width={2} height={30} fill={nuance(BOIS, -0.2)} />
            <polygon points="-20,-30 20,-36 20,-31 -20,-25" fill={CREME} />
            {[-14, -6, 2, 10].map((x) => <polygon key={x} points={`${x},${-29 + x * -0.15} ${x + 4},${-29.6 + x * -0.15} ${x + 4},${-24.6 + x * -0.15} ${x},${-24 + x * -0.15}`} fill={nuance(couleur, 0.3)} />)}
          </g>
          {robot}
          <Bureau couleur={couleur} w={0.4} />
          {/* Objets reconditionnés : lampe, radio, tasse ; tournevis */}
          <g transform="translate(-12 -18)">
            <rect x={-3} y={-5} width={6} height={5} rx={1} fill={METAL} />
            <circle cx={-1} cy={-2.5} r={1.2} fill={ARDOISE} />
          </g>
          <g transform="translate(2 -19)">
            <rect x={-2.5} y={-4} width={5} height={4} rx={0.8} fill={nuance(couleur, 0.35)} />
            <rect x={1.5} y={-7} width={2.5} height={1.5} fill={CREME} />
          </g>
          <line x1={10} y1={-16} x2={16} y2={-20} stroke={ARDOISE} strokeWidth={1.4} />
          <rect x={14} y={-22} width={3} height={2} fill="#C96A41" transform="rotate(-33 15 -21)" />
          {/* Pancarte « local » */}
          <g transform="translate(20 -26)">
            <rect x={-6} y={-4} width={12} height={6} rx={1} fill={FEUILLE} />
            <text x={0} y={0.8} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={3.6} fontWeight={700} fill="#FBF8F1">local</text>
          </g>
          <Plante x={-20} y={0} taille={plante} />
        </g>
      )
    case 'label':
      // Atelier de sérigraphie : presse, pot d'encre vert, badges qui sèchent sur un fil
      return (
        <g>
          <Ombre w={0.32} />
          {/* Fil à badges */}
          <g transform="translate(0 -36)">
            <line x1={-20} y1={0} x2={20} y2={-6} stroke={METAL} strokeWidth={0.7} />
            {[-14, -5, 4, 13].slice(0, n3 ? 4 : n2 ? 3 : 2).map((x) => (
              <g key={x} transform={`translate(${x} ${x * -0.15})`}>
                <line x1={0} y1={0} x2={0} y2={2.5} stroke={METAL} strokeWidth={0.6} />
                <circle cx={0} cy={5.5} r={3} fill={CREME} stroke={FEUILLE} strokeWidth={0.8} />
                <path d="M 0 7 C -1.5 7 -2 5 -1.5 4.5 C -0.5 4.5 0 6 0 7 Z" fill={FEUILLE} />
              </g>
            ))}
          </g>
          {robot}
          <Bureau couleur={couleur} w={0.38} />
          {/* Presse de sérigraphie */}
          <g transform="translate(-6 -16)">
            <rect x={-8} y={-2} width={16} height={2.5} fill={METAL} />
            <rect x={-7} y={-9} width={14} height={7} rx={0.8} fill={CREME} stroke={nuance(BOIS, -0.2)} strokeWidth={0.8} transform="skewX(-12)" />
            <rect x={-1} y={-14} width={2} height={5} fill={METAL} />
            <rect x={-4} y={-15} width={8} height={1.6} fill={nuance(BOIS, -0.2)} />
          </g>
          {/* Pot d'encre verte et badge frais */}
          <g transform="translate(12 -18)">
            <rect x={-3} y={-4} width={6} height={4.5} rx={0.8} fill={CREME} stroke={METAL} strokeWidth={0.6} />
            <ellipse cx={0} cy={-4} rx={3} ry={1} fill={FEUILLE} />
          </g>
          <circle cx={6} cy={-14} r={2.4} fill={CREME} stroke={FEUILLE} strokeWidth={0.8} />
          <LampeSolaire x={20} y={-8} h={16} />
          <Plante x={-20} y={0} taille={plante} />
        </g>
      )

    default:
      // Poste générique du domaine : bureau, écran e-ink, lampe solaire, plante, liseré
      return (
        <g>
          <Ombre w={0.3} />
          {robot}
          <Bureau couleur={couleur} w={0.34} />
          <Ecran x={4} y={-33} couleur={couleur} l={13} h={9} />
          <LampeSolaire x={-14} y={-10} h={18} />
          <Plante x={16} y={-4} taille={plante} />
          {n3 && <Ecran x={-24} y={-36} couleur={couleur} l={11} h={8} />}
        </g>
      )
  }
}
