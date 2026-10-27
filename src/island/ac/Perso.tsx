/** Toi, sur ton île : petit personnage qui marche, bonnet vert, sac en bandoulière. Origine = ses pieds. */
export function Perso({ marche, versGauche }: { marche: boolean; versGauche: boolean }) {
  return (
    <g className={`perso${marche ? ' perso-marche' : ''}`} transform={versGauche ? 'scale(-1 1)' : undefined}>
      <ellipse cx={0} cy={1} rx={8} ry={3.2} fill="rgba(34,48,31,.2)" />
      <g className="perso-corps">
        <rect className="jambe jambe-g" x={-5} y={-10} width={4} height={10} rx={1.8} fill="#3F5B47" />
        <rect className="jambe jambe-d" x={1} y={-10} width={4} height={10} rx={1.8} fill="#3F5B47" />
        <path d="M -7.5 -9 Q -8.5 -25 0 -26 Q 8.5 -25 7.5 -9 Z" fill="#E7B04A" />
        <path d="M -3 -14 h 6 M -2 -18 h 4" stroke="#D99A3A" strokeWidth={1} strokeLinecap="round" />
        <rect x={4.5} y={-23} width={5.5} height={8} rx={2} fill="#A57A52" />
        <path className="bras bras-g" d="M -7 -21 q -4 4 -3 9" stroke="#E7B04A" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <path className="bras bras-d" d="M 7 -21 q 4 4 3 9" stroke="#E7B04A" strokeWidth={3.2} fill="none" strokeLinecap="round" />
        <circle cx={0} cy={-33} r={9.5} fill="#F2C9A8" />
        <path d="M -9.5 -34 Q -8 -46 0 -46 Q 8 -46 9.5 -34 Q 4 -39 0 -37 Q -4 -39 -9.5 -34 Z" fill="#5B3A29" />
        <path d="M -10 -36 Q -3 -49 10 -40" stroke="#2F7A5C" strokeWidth={4} fill="none" strokeLinecap="round" />
        <g className="perso-yeux">
          <circle cx={-3.4} cy={-32} r={1.4} fill="#22301F" />
          <circle cx={3.4} cy={-32} r={1.4} fill="#22301F" />
        </g>
        <ellipse cx={-6} cy={-29} rx={2} ry={1.1} fill="#E89A8A" opacity={0.7} />
        <ellipse cx={6} cy={-29} rx={2} ry={1.1} fill="#E89A8A" opacity={0.7} />
        <path d="M -2 -28.5 q 2 2.2 4 0" stroke="#22301F" strokeWidth={1.1} fill="none" strokeLinecap="round" />
      </g>
    </g>
  )
}
