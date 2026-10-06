import type { Domaine } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { BOIS, CREME, Eolienne, FEUILLE, Flore, Pave, VERRE, nuance } from './buildings/primitives'

/*
 * Décors d'ambiance qui racontent chaque univers, posés sur les tuiles libres.
 * Ma boîte : caisses, dossiers, bocal d'épargne, tableau qui monte, lampadaire solaire.
 * Ma peau : hamac, transat, tasse fumante, massif fleuri.
 * Ma planète : ruche, potager, panneau solaire, petite éolienne, récupérateur d'eau.
 */

const ARGILE = COULEUR.boite
const PRUNE = COULEUR.peau
const VERT = COULEUR.planete
const OR = '#E7B04A'

function Caisses() {
  return (
    <g>
      <ellipse cx={0} cy={3} rx={14} ry={6} fill="rgba(34,48,31,.1)" />
      <Pave dx={-0.07} w={0.09} h={8} couleur={BOIS} />
      <Pave dx={0.11} dy={0.07} w={0.07} h={6} couleur={nuance(BOIS, 0.15)} />
      <Pave dx={-0.07} w={0.075} h={6} z={8} couleur={nuance(BOIS, -0.05)} haut={ARGILE} />
    </g>
  )
}

function Dossiers() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={10} ry={4.5} fill="rgba(34,48,31,.1)" />
      <Pave w={0.1} d={0.07} h={2.5} couleur={CREME} />
      <Pave w={0.1} d={0.07} h={2.5} z={2.5} couleur={ARGILE} />
      <Pave dx={0.01} w={0.095} d={0.065} h={2.5} z={5} couleur={CREME} />
      <Pave w={0.1} d={0.07} h={2} z={7.5} couleur={nuance(ARGILE, 0.3)} />
    </g>
  )
}

function Bocal() {
  return (
    <g>
      <ellipse cx={0} cy={1} rx={8} ry={3.5} fill="rgba(34,48,31,.1)" />
      <path d="M -6 0 h 12 v -11 a 3 3 0 0 0 -3 -3 h -6 a 3 3 0 0 0 -3 3 Z" fill={VERRE} opacity={0.85} />
      <rect x={-4.5} y={-5} width={9} height={4.5} fill={OR} />
      <circle cx={-2} cy={-6.5} r={1.8} fill={nuance(OR, 0.2)} />
      <circle cx={2} cy={-7} r={1.8} fill={OR} />
      <rect x={-4.5} y={-17} width={9} height={3} rx={1} fill={ARGILE} />
      <path d="M -4 -2 v -9" stroke="#FBF8F1" strokeWidth={1} opacity={0.8} />
    </g>
  )
}

function Tableau() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={9} ry={3.5} fill="rgba(34,48,31,.1)" />
      <path d="M -6 2 L -2 -16 M 6 2 L 2 -16 M 0 -10 L 0 2" stroke={BOIS} strokeWidth={1.6} strokeLinecap="round" />
      <rect x={-9} y={-24} width={18} height={13} rx={1.5} fill={CREME} stroke={BOIS} strokeWidth={1} />
      <path d="M -6 -14 L -2 -17 L 1 -15.5 L 6 -21" stroke={ARGILE} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={6} cy={-21} r={1.6} fill={OR} />
    </g>
  )
}

function Lampadaire() {
  return (
    <g>
      <ellipse cx={0} cy={1} rx={5} ry={2} fill="rgba(34,48,31,.1)" />
      <rect x={-1} y={-26} width={2} height={26} fill="#3A4636" />
      <path d="M -7 -30 L 5 -33 L 8 -29 L -4 -26 Z" fill="#2D4B5C" stroke="#6E93A3" strokeWidth={0.5} />
      <path d="M 1 -24 q 5 0 6 4" stroke="#3A4636" strokeWidth={1.4} fill="none" />
      <circle cx={7} cy={-18.5} r={2.4} fill={OR} />
      <circle className="lueur" cx={7} cy={-18.5} r={6} fill={OR} opacity={0.25} />
    </g>
  )
}

function Hamac() {
  return (
    <g>
      <ellipse cx={0} cy={3} rx={22} ry={5} fill="rgba(34,48,31,.1)" />
      <rect x={-21} y={-16} width={2.4} height={18} fill={BOIS} />
      <rect x={18.6} y={-16} width={2.4} height={18} fill={BOIS} />
      <path className="hamac-toile" d="M -19 -13 Q 0 2 19 -13 Q 0 -4 -19 -13 Z" fill={PRUNE} />
      <path d="M -12 -8 Q 0 -1 12 -8" stroke={nuance(PRUNE, 0.35)} strokeWidth={1} fill="none" />
    </g>
  )
}

function Transat() {
  return (
    <g>
      <ellipse cx={0} cy={3} rx={12} ry={4} fill="rgba(34,48,31,.1)" />
      <path d="M -10 2 L -4 -12 M 8 2 L 2 -4" stroke={BOIS} strokeWidth={1.6} strokeLinecap="round" />
      <path d="M -6 -14 L 0 -4 L 11 -4 L 10 -1 L -2 -1 L -9 -12 Z" fill={nuance(PRUNE, 0.2)} />
      <path d="M -4.5 -11 L 1 -3 M -2 -12.5 L 3.5 -4" stroke={CREME} strokeWidth={1.2} />
    </g>
  )
}

function Tasse() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={8} ry={3.5} fill="rgba(34,48,31,.1)" />
      {/* Souche */}
      <rect x={-6} y={-6} width={12} height={7} fill={BOIS} />
      <ellipse cx={0} cy={1} rx={6} ry={2.4} fill={BOIS} />
      <ellipse cx={0} cy={-6} rx={6} ry={2.4} fill={nuance(BOIS, 0.35)} />
      {/* Tasse */}
      <path d="M -3 -7 h 6 v -5 a 1 1 0 0 0 -1 -1 h -4 a 1 1 0 0 0 -1 1 Z" fill={CREME} />
      <path d="M 3 -11.5 q 2.5 0 2.5 2 q 0 2 -2.5 2" stroke={CREME} strokeWidth={1} fill="none" />
      <ellipse cx={0} cy={-13} rx={3} ry={1} fill={PRUNE} />
      <g className="vapeur" stroke="#FBF8F1" strokeWidth={1.1} fill="none" strokeLinecap="round" opacity={0.9}>
        <path d="M -1 -15 q -2 -3 0 -6" />
        <path d="M 1.5 -15 q 2 -3 0 -6" />
      </g>
    </g>
  )
}

function Massif() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={11} ry={4} fill="rgba(34,48,31,.1)" />
      <circle cx={-5} cy={-3} r={4.5} fill={FEUILLE} />
      <circle cx={4} cy={-3.5} r={4} fill={nuance(FEUILLE, 0.12)} />
      {[[-7, -6], [-3, -8], [2, -7], [6, -5], [0, -3.5]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={2} fill={i % 2 ? nuance(PRUNE, 0.3) : PRUNE} />
      ))}
      <circle cx={-3} cy={-8} r={0.8} fill={OR} />
    </g>
  )
}

function Ruche() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={10} ry={4} fill="rgba(34,48,31,.1)" />
      <Pave w={0.085} h={6} couleur={OR} />
      <Pave w={0.08} h={5} z={6} couleur={nuance(OR, 0.15)} />
      <Pave w={0.1} h={1.5} z={11} couleur={CREME} />
      <rect x={-2} y={-2} width={4} height={1.4} fill="#3A4636" />
      <g className="abeilles" fill="#3A4636">
        <circle cx={9} cy={-16} r={1} />
        <circle cx={-8} cy={-19} r={1} />
      </g>
    </g>
  )
}

function Potager() {
  return (
    <g>
      {[-0.12, 0, 0.12].map((dy, i) => (
        <g key={i}>
          <Pave dy={dy} w={0.22} d={0.04} h={2} couleur="#8A6A4A" />
          {[-0.14, -0.04, 0.06, 0.16].map((dx) => {
            const x = (dx - dy) * 32
            const y = (dx + dy) * 16 - 3
            return <circle key={dx} cx={x} cy={y} r={2.2} fill={i === 1 ? VERT : FEUILLE} />
          })}
        </g>
      ))}
      <circle cx={7} cy={-6} r={1.5} fill="#D9773F" />
    </g>
  )
}

function SolaireSol() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={13} ry={4.5} fill="rgba(34,48,31,.1)" />
      <path d="M -6 1 v -5 M 7 0 v -8" stroke="#3A4636" strokeWidth={1.4} />
      <path d="M -14 -2 L 8 -14 L 14 -9 L -8 3 Z" fill="#2D4B5C" stroke="#6E93A3" strokeWidth={0.6} />
      <path d="M -11 -0.4 L 11 -11.5 M -3 -7 L 3 -2" stroke="#6E93A3" strokeWidth={0.5} />
      <path d="M -10 -1.5 L -4 -4.7 L -2 -3 L -8 0 Z" fill="#9EC3CF" opacity={0.5} />
    </g>
  )
}

function Tonneau() {
  return (
    <g>
      <ellipse cx={0} cy={2} rx={8} ry={3.5} fill="rgba(34,48,31,.1)" />
      <rect x={-6} y={-12} width={12} height={13} fill={VERT} />
      <ellipse cx={0} cy={1} rx={6} ry={2.4} fill={VERT} />
      <ellipse cx={0} cy={-12} rx={6} ry={2.4} fill="#BFDCE0" stroke={nuance(VERT, -0.2)} strokeWidth={1} />
      <path d="M -6 -8 h 12 M -6 -3 h 12" stroke={nuance(VERT, -0.25)} strokeWidth={1} />
      <path d="M 6 -10 q 4 0 4 -6" stroke="#8A6A4A" strokeWidth={1.4} fill="none" />
    </g>
  )
}

const PAR_ZONE: Record<Domaine, (() => React.JSX.Element)[]> = {
  boite: [Caisses, Dossiers, Bocal, Tableau, Lampadaire],
  peau: [Hamac, Transat, Tasse, Massif, Massif],
  planete: [Ruche, Potager, SolaireSol, () => <Eolienne h={22} echelle={0.8} />, Tonneau],
}

/** Décor d'ambiance d'une tuile libre, choisi selon sa zone et son hachage. */
export function DecorZone({ zone, h }: { zone: Domaine; h: number }) {
  // Un quart de flore générique pour garder de la respiration
  if ((h >>> 7) % 4 === 0) return <Flore type={h >>> 3} />
  const liste = PAR_ZONE[zone]
  const Comp = liste[(h >>> 3) % liste.length]
  return <Comp />
}

/** Fanion d'entrée de zone, avec l'emblème du domaine. */
export function Fanion({ zone }: { zone: Domaine }) {
  const c = COULEUR[zone]
  return (
    <g>
      <ellipse cx={0} cy={2} rx={7} ry={3} fill="rgba(34,48,31,.12)" />
      <rect x={-1.2} y={-40} width={2.4} height={41} fill={BOIS} />
      <circle cx={0} cy={-41} r={2} fill={OR} />
      <g className="fanion-tissu">
        <path d="M 1.2 -38 L 26 -36 L 21 -28 L 26 -20 L 1.2 -18 Z" fill={c} />
        <g transform="translate(12 -28)" stroke="#FBF8F1" fill="none" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
          {zone === 'boite' && (
            <>
              <rect x={-5} y={-3} width={10} height={7} rx={1} />
              <path d="M -2 -3 v -2 h 4 v 2 M -5 0.5 h 10" />
            </>
          )}
          {zone === 'peau' && <path d="M 0 4.5 C -7 0 -5.5 -5 -2.5 -5 C -1 -5 0 -4 0 -3 C 0 -4 1 -5 2.5 -5 C 5.5 -5 7 0 0 4.5 Z" fill="#FBF8F1" />}
          {zone === 'planete' && (
            <>
              <path d="M 0 5 V -1" />
              <path d="M 0 0 C -6 0 -6 -5 -5 -6 C -1 -6 0 -3 0 0 Z M 0 -1 C 5 -1 6 -5 5 -6 C 1 -6 0 -4 0 -1 Z" fill="#FBF8F1" />
            </>
          )}
        </g>
      </g>
    </g>
  )
}
