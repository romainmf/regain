import type { Domaine } from '../domain/types'
import { COULEUR, TEINTE } from '../domain/couleurs'
import { TH, TW } from './iso'
import { BOIS, nuance } from './buildings/primitives'

const OR = '#E7B04A'

/** Petite placette d'entrée de zone : dallage, fanion et lanterne. */
export function Fanion({ zone }: { zone: Domaine }) {
  const c = COULEUR[zone]
  return (
    <g>
      {/* Dallage losangé, teinté du domaine */}
      <g opacity={0.9}>
        <polygon points={`0,${-TH * 0.62} ${TW * 0.62},0 0,${TH * 0.62} ${-TW * 0.62},0`} fill={TEINTE[zone]} stroke="rgba(255,255,255,.5)" strokeWidth={0.8} />
        <polygon points={`0,${-TH * 0.32} ${TW * 0.32},0 0,${TH * 0.32} ${-TW * 0.32},0`} fill={nuance(TEINTE[zone], -0.05)} />
        <line x1={-TW * 0.62} y1={0} x2={TW * 0.62} y2={0} stroke="rgba(34,48,31,.1)" strokeWidth={0.6} />
        <line x1={0} y1={-TH * 0.62} x2={0} y2={TH * 0.62} stroke="rgba(34,48,31,.1)" strokeWidth={0.6} />
      </g>

      {/* Lanterne solaire */}
      <g transform={`translate(${-TW * 0.42} ${-TH * 0.1})`}>
        <ellipse cx={0} cy={1} rx={3} ry={1.4} fill="rgba(34,48,31,.12)" />
        <rect x={-1} y={-16} width={2} height={16} fill="#3A4636" />
        <rect x={-3.2} y={-22} width={6.4} height={6} rx={1.2} fill={nuance(OR, 0.25)} stroke="#3A4636" strokeWidth={0.6} />
        <circle className="lanterne-lueur" cx={0} cy={-19} r={5} fill={OR} opacity={0.22} />
      </g>

      {/* Fanion */}
      <ellipse cx={0} cy={2} rx={6} ry={2.6} fill="rgba(34,48,31,.12)" />
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
