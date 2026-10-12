import type { DecorId } from '../domain/boutique'
import { Arbre, BOIS, FEUILLE, Ombre, Pave, nuance } from './buildings/primitives'

const OR = '#E7B04A'

/** Décors achetables, posés librement sur une tuile. */
export function Decor({ id, nuit = false }: { id: DecorId; nuit?: boolean }) {
  switch (id) {
    case 'fleurs':
      return (
        <g>
          <ellipse cx={0} cy={2} rx={12} ry={4.5} fill="rgba(34,48,31,.1)" />
          {[[-7, -1], [-2, -4], [3, -2], [7, 0], [0, 1], [-4, 2], [5, -5]].map(([x, y], i) => (
            <g key={i}>
              <line x1={x} y1={y + 2} x2={x} y2={y - 2} stroke={FEUILLE} strokeWidth={1} />
              <circle cx={x} cy={y - 3} r={2.2} fill={['#D98BA9', OR, '#9C5B7F', '#F4EAD5'][i % 4]} />
              <circle cx={x} cy={y - 3} r={0.8} fill={OR} />
            </g>
          ))}
        </g>
      )
    case 'massif':
      return (
        <g>
          <Ombre w={0.26} />
          <circle cx={-5} cy={-3} r={5} fill={FEUILLE} />
          <circle cx={4} cy={-3.5} r={4.5} fill={nuance(FEUILLE, 0.12)} />
          <circle cx={0} cy={-6} r={4} fill={nuance(FEUILLE, 0.05)} />
          {[[-6, -6], [2, -8], [6, -4]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={1.8} fill={i % 2 ? '#9C5B7F' : OR} />
          ))}
        </g>
      )
    case 'haie':
      return (
        <g>
          <ellipse cx={0} cy={3} rx={20} ry={5} fill="rgba(34,48,31,.1)" />
          <Pave w={0.3} d={0.08} h={11} couleur={FEUILLE} haut={nuance(FEUILLE, 0.15)} />
          <path d="M -18 -8 q 6 -4 12 0 q 6 -4 12 0 q 6 -4 12 0" stroke={nuance(FEUILLE, 0.2)} strokeWidth={2} fill="none" opacity={0.6} />
        </g>
      )
    case 'banc':
      return (
        <g>
          <Ombre w={0.24} />
          <Pave w={0.22} d={0.06} h={5} z={4} couleur={BOIS} />
          <Pave dy={-0.06} w={0.22} d={0.015} h={8} z={9} couleur={nuance(BOIS, 0.2)} />
          <Pave dx={-0.18} dy={0.05} w={0.02} h={4} couleur={nuance(BOIS, -0.2)} />
          <Pave dx={0.18} dy={0.05} w={0.02} h={4} couleur={nuance(BOIS, -0.2)} />
        </g>
      )
    case 'lampadaire':
      return (
        <g>
          <ellipse cx={0} cy={1} rx={5} ry={2} fill="rgba(34,48,31,.12)" />
          <rect x={-1.2} y={-30} width={2.4} height={30} fill="#3A4636" />
          <path d="M 1 -28 q 6 0 7 5" stroke="#3A4636" strokeWidth={1.6} fill="none" />
          <circle cx={8} cy={-21} r={3} fill={nuance(OR, 0.3)} stroke="#3A4636" strokeWidth={0.6} />
          {nuit && <circle className="lampe-lueur" cx={8} cy={-21} r={10} fill={OR} opacity={0.4} />}
          {!nuit && <circle cx={8} cy={-21} r={7} fill={OR} opacity={0.14} />}
          <Arbre dx={-0.2} dy={0.18} r={4} tronc={0} />
        </g>
      )
  }
}
