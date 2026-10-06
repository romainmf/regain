import type { Domaine } from '../domain/types'
import { COULEUR } from '../domain/couleurs'
import { BOIS } from './buildings/primitives'

const OR = '#E7B04A'

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
