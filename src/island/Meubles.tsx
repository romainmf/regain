import type { Domaine } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { Arbre, BOIS, CREME, FEUILLE, Ombre, Pave, nuance } from './buildings/primitives'

/**
 * Mobilier fixe des trois lieux : ce qui fait qu'un Atelier ressemble à un
 * atelier, un Spa à un spa, un Jardin à un jardin. Posé sur des tuiles
 * réservées (comme les fanions), dessiné dans l'ordre de profondeur.
 */
export type MeubleId = 'etabli' | 'caisses' | 'transat' | 'plante' | 'bac' | 'ruche' | 'arbre-fruitier'

export interface MeubleLieu {
  x: number
  y: number
  zone: Domaine
  meuble: MeubleId
}

export const MEUBLES_LIEUX: MeubleLieu[] = [
  // Atelier : établi contre le mur du fond, caisses dans le coin
  { x: 0, y: 4, zone: 'boite', meuble: 'etabli' },
  { x: 0, y: 1, zone: 'boite', meuble: 'caisses' },
  // Spa : transats au soleil, grande plante à l'entrée
  { x: 5, y: 0, zone: 'peau', meuble: 'transat' },
  { x: 6, y: 1, zone: 'peau', meuble: 'transat' },
  { x: 2, y: 0, zone: 'peau', meuble: 'plante' },
  // Jardin : bacs potagers le long de la clôture, ruche, arbre fruitier
  { x: 6, y: 3, zone: 'planete', meuble: 'bac' },
  { x: 6, y: 4, zone: 'planete', meuble: 'bac' },
  { x: 3, y: 3, zone: 'planete', meuble: 'ruche' },
  { x: 5, y: 6, zone: 'planete', meuble: 'arbre-fruitier' },
]

const TERRE = '#8A6A4A'

export function Meuble({ id }: { id: MeubleId }) {
  switch (id) {
    case 'etabli':
      return (
        <g>
          <Ombre w={0.3} />
          {/* Pieds, plateau épais, étau et outils posés */}
          <Pave dx={-0.28} dy={-0.1} w={0.04} d={0.1} h={12} couleur={BOIS} />
          <Pave dx={0.28} dy={-0.1} w={0.04} d={0.1} h={12} couleur={BOIS} />
          <Pave dy={-0.1} w={0.4} d={0.16} h={4} z={12} couleur={nuance(BOIS, 0.15)} haut="#E2C9A6" />
          <Pave dx={0.22} dy={-0.1} w={0.05} d={0.04} h={5} z={16} couleur="#5C6B73" />
          <rect x={-14} y={-24} width={6} height={2} fill="#5C6B73" transform="rotate(-20 -11 -23)" />
          <circle cx={-3} cy={-22} r={1.8} fill="#E7B04A" />
          <circle cx={3} cy={-20} r={1.4} fill={COULEUR.boite} />
          {/* Tabouret devant */}
          <Pave dx={-0.05} dy={0.3} w={0.08} d={0.08} h={7} couleur={BOIS} />
        </g>
      )
    case 'caisses':
      return (
        <g>
          <Ombre w={0.26} />
          <Pave dx={-0.12} dy={0.1} w={0.18} d={0.16} h={10} couleur={nuance(BOIS, 0.2)} />
          <Pave dx={0.16} dy={-0.1} w={0.14} d={0.14} h={8} couleur={nuance(BOIS, 0.1)} />
          <Pave dx={-0.1} dy={0.1} w={0.13} d={0.12} h={8} z={10} couleur={nuance(BOIS, 0.28)} />
          {/* Planches des caisses */}
          <g stroke={nuance(BOIS, -0.25)} strokeWidth={0.6} opacity={0.6}>
            <line x1={-18} y1={-2} x2={-8} y2={3} />
            <line x1={-18} y1={-6} x2={-8} y2={-1} />
            <line x1={4} y1={-3} x2={13} y2={-8} />
          </g>
          <circle cx={-9} cy={-16} r={2.4} fill={FEUILLE} />
        </g>
      )
    case 'transat':
      return (
        <g>
          <Ombre w={0.26} />
          <Pave dy={0.08} w={0.3} d={0.14} h={5} couleur={BOIS} haut={CREME} />
          <Pave dx={-0.22} dy={0.08} w={0.06} d={0.14} h={14} z={5} couleur={BOIS} haut={CREME} />
          {/* Rayures de la toile et serviette pliée */}
          <g stroke={nuance(COULEUR.peau, 0.45)} strokeWidth={1.4} opacity={0.9}>
            <line x1={-6} y1={-5} x2={6} y2={1} />
            <line x1={-1} y1={-7} x2={11} y2={-1} />
          </g>
          <Pave dx={0.2} dy={0.08} w={0.08} d={0.06} h={3} z={5} couleur={COULEUR.peau} haut={nuance(COULEUR.peau, 0.35)} />
        </g>
      )
    case 'plante':
      return (
        <g>
          <Ombre w={0.2} />
          <Pave w={0.13} d={0.13} h={9} couleur="#C98A5E" haut="#8A6A4A" />
          <g fill={nuance(FEUILLE, 0.05)}>
            <ellipse cx={-7} cy={-16} rx={4} ry={8} transform="rotate(-35 -7 -16)" />
            <ellipse cx={6} cy={-17} rx={4} ry={9} transform="rotate(30 6 -17)" />
            <ellipse cx={0} cy={-21} rx={3.5} ry={10} fill={nuance(FEUILLE, 0.2)} />
          </g>
        </g>
      )
    case 'bac':
      return (
        <g>
          <Ombre w={0.3} />
          <Pave w={0.4} d={0.24} h={7} couleur={BOIS} haut={TERRE} />
          {/* Rangs de légumes */}
          {[-0.2, 0, 0.2].map((u) =>
            [-0.1, 0.1].map((v) => (
              <g key={`${u}${v}`} transform={`translate(${(u - v) * 32} ${(u + v) * 16 - 7})`}>
                <circle r={2.6} fill={u === 0 ? '#8DBF85' : FEUILLE} />
                <circle cx={-1} cy={-1} r={1.1} fill={u === 0 ? '#E7B04A' : '#C96A41'} />
              </g>
            )),
          )}
        </g>
      )
    case 'ruche':
      return (
        <g>
          <Ombre w={0.2} />
          <Pave w={0.12} d={0.12} h={3} couleur={BOIS} />
          <Pave w={0.15} d={0.15} h={14} z={3} couleur={CREME} />
          <g stroke="#E7B04A" strokeWidth={1}>
            <line x1={-9} y1={-6} x2={9} y2={-6} />
            <line x1={-9} y1={-11} x2={9} y2={-11} />
          </g>
          <Pave w={0.18} d={0.18} h={2} z={17} couleur={COULEUR.planete} />
          <rect x={-2} y={-9} width={3.5} height={2.4} fill="#22301F" opacity={0.6} />
          <g fill="#E7B04A">
            <circle cx={12} cy={-20} r={1} />
            <circle cx={16} cy={-26} r={1} />
          </g>
        </g>
      )
    case 'arbre-fruitier':
      return (
        <g>
          <Arbre r={12} tronc={12} couleur="#6FA56B" />
          <g fill="#C96A41">
            <circle cx={-6} cy={-20} r={1.6} />
            <circle cx={5} cy={-24} r={1.6} />
            <circle cx={2} cy={-15} r={1.6} />
          </g>
        </g>
      )
  }
}
