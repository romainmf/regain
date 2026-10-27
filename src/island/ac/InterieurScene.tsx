import { COULEUR } from '../../domain/couleurs'
import { Meuble, type MeubleId } from '../Meubles'
import { Poste } from '../Poste'
import { hache } from '../Paysage'
import { BOIS, CREME, Flore, Pave, nuance } from '../buildings/primitives'
import { TH, TW, iso, losange } from '../iso'
import { Perso } from './Perso'
import type { AgentVue, EtatPerso } from './IleScene'
import { BUREAU_MAISON, ENTREE_INT, HAUTEUR_MUR, LARGEUR, LIEUX, MEUBLES_INT, PROFONDEUR, cle, type LieuId, type Slot } from './lieux'
import './ac.css'

const P = (fx: number, fy: number, fz: number) => `${(fx - fy) * TW},${(fx + fy) * TH - fz}`
const C = (cx: number, cy: number, z = 0) => `${(cx - cy) * TW},${(cx + cy) * TH - z}`

function Lit() {
  return (
    <g>
      <Pave dy={0.5} w={0.34} d={0.78} h={6} couleur={BOIS} haut={nuance(BOIS, 0.1)} />
      <Pave dy={0.5} w={0.3} d={0.72} h={6} z={6} couleur="#EAD9C4" haut="#F4EAD5" />
      <Pave dy={-0.1} w={0.26} d={0.14} h={4} z={12} couleur="#FBF8F1" haut="#FFFFFF" />
      <polygon points={`${P(-0.3, 0.1, 12)} ${P(0.3, 0.1, 12)} ${P(0.3, 1.2, 12)} ${P(-0.3, 1.2, 12)}`} fill="#9C5B7F" opacity={0.85} />
      <g transform={`translate(${P(0.05, 0.7, 13).split(',')[0]} ${P(0.05, 0.7, 13).split(',')[1]})`} className="chat">
        <ellipse cx={0} cy={0} rx={7} ry={4} fill="#4A3B33" />
        <circle cx={5} cy={-2} r={3} fill="#4A3B33" />
        <path d="M 3 -4 l 1 -3 l 2 2 M 6 -4.5 l 2 -2.5 l 0.5 3" stroke="#4A3B33" strokeWidth={1.4} fill="none" strokeLinejoin="round" />
        <path d="M -7 0 q -4 2 -2 5" stroke="#4A3B33" strokeWidth={2} fill="none" strokeLinecap="round" />
      </g>
    </g>
  )
}

function Etagere() {
  return (
    <g>
      <Pave dy={-0.25} w={0.36} d={0.12} h={34} couleur={nuance(BOIS, 0.05)} haut={nuance(BOIS, 0.2)} />
      {[8, 18, 28].map((z) => (
        <g key={z}>
          {[-0.26, -0.16, -0.05, 0.06, 0.17].map((u, i) => (
            <polygon key={u} points={`${P(u, -0.37, z)} ${P(u + 0.08, -0.37, z)} ${P(u + 0.08, -0.37, z + 7)} ${P(u, -0.37, z + 7)}`} fill={['#B0512A', '#2F7A5C', '#E7B04A', '#9C5B7F', '#5E9B62'][(i + z) % 5]} />
          ))}
        </g>
      ))}
    </g>
  )
}

function Cuisine() {
  return (
    <g>
      <Pave dy={-0.2} w={0.4} d={0.16} h={16} couleur="#DCCDB2" haut="#F1E9DA" />
      <rect x={-6} y={-24} width={9} height={6} rx={1} fill="#2D4B5C" />
      <circle cx={6} cy={-19} r={2.6} fill="#B7AE9A" />
      <path d="M 6 -22 q 0 -3 3 -3" stroke="#B7AE9A" strokeWidth={1.2} fill="none" />
      <g className="fumee" fill="#F5F0E3" opacity={0.7}>
        <circle cx={9} cy={-28} r={1.4} />
        <circle cx={10} cy={-33} r={1.8} />
      </g>
    </g>
  )
}

function BureauJour({ attente }: { attente: number }) {
  return (
    <g>
      <Pave dy={0.05} w={0.3} d={0.2} h={13} couleur={nuance(BOIS, 0.1)} haut="#E8D2B2" />
      <g transform="translate(14 -44)">
        <rect x={0} y={0} width={24} height={18} rx={1.5} fill="#F1E9DA" stroke={nuance(BOIS, -0.1)} strokeWidth={1.2} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={3 + i * 7} y={4} width={5} height={i < attente ? 9 : 5} rx={0.8} fill={i < attente ? ['#B0512A', '#9C5B7F', '#2F7A5C'][i] : '#E2DACA'} />
        ))}
      </g>
      <polygon points="-12,-17 -4,-21 2,-18 -6,-14" fill={CREME} stroke="#E2DACA" strokeWidth={0.5} />
      <circle cx={6} cy={-18} r={2} fill="#F6E6C2" stroke="#E7B04A" strokeWidth={0.8} />
    </g>
  )
}

/** Haie basse le long d'un bord, pour le jardin en plein air. */
function Haie({ de, a, n }: { de: [number, number]; a: [number, number]; n: number }) {
  return (
    <g>
      {Array.from({ length: n * 2 + 1 }).map((_, i) => {
        const u = i / (n * 2)
        const cx = de[0] + (a[0] - de[0]) * u, cy = de[1] + (a[1] - de[1]) * u
        const x = (cx - cy) * TW, y = (cx + cy) * TH
        return (
          <g key={i}>
            <circle cx={x} cy={y - 8} r={9} fill={i % 2 ? '#5E9B62' : '#6FA56B'} />
            <circle cx={x - 3} cy={y - 12} r={4} fill="#8DBF85" />
            {i % 3 === 1 && <circle cx={x + 3} cy={y - 10} r={1.6} fill="#D98BA9" />}
          </g>
        )
      })}
    </g>
  )
}

interface Props {
  id: LieuId
  agents: AgentVue[]
  slots: Slot[]
  perso: EtatPerso
  /** Propositions en attente, tous agents confondus (pour le bureau du jour). */
  nbAttente: number
  /** Murs et sol de la pièce, choisis dans la boutique. */
  murInt: string
  sol: [string, string]
  nuit: boolean
  onAgent: (a: AgentVue, slot: Slot) => void
  onBureau: () => void
  onSortir: () => void
}

/** L'intérieur d'un lieu (ou le jardin en plein air) : la pièce, le mobilier, les agents à leur poste, toi. */
export function InterieurScene({ id, agents, slots, perso, nbAttente, murInt, sol, nuit, onAgent, onBureau, onSortir }: Props) {
  const M = LIEUX[id]
  const dehors = M.genre === 'jardin'
  const tuiles: { x: number; y: number }[] = []
  for (let y = 0; y < PROFONDEUR; y++) for (let x = 0; x < LARGEUR; x++) tuiles.push({ x, y })

  const murGauche = `${C(-0.5, -0.5, HAUTEUR_MUR)} ${C(-0.5, -0.5)} ${C(-0.5, PROFONDEUR - 0.5)} ${C(-0.5, PROFONDEUR - 0.5, HAUTEUR_MUR)}`
  const murDroit = `${C(-0.5, -0.5, HAUTEUR_MUR)} ${C(-0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5, HAUTEUR_MUR)}`
  const fenetre = `${C(2.2, -0.5, 24)} ${C(3.8, -0.5, 24)} ${C(3.8, -0.5, 52)} ${C(2.2, -0.5, 52)}`
  const cadre = `${C(-0.5, 1.2, 30)} ${C(-0.5, 2.2, 30)} ${C(-0.5, 2.2, 48)} ${C(-0.5, 1.2, 48)}`

  type Objet =
    | { type: 'meuble'; x: number; y: number; meuble: MeubleId }
    | { type: 'agent'; x: number; y: number; agent: AgentVue; slot: Slot }
    | { type: 'perso'; x: number; y: number }
    | { type: 'lit' | 'etagere' | 'cuisine' | 'bureau'; x: number; y: number }
  const postes = new Set(slots.map((s) => cle(s.x, s.y)))
  const objets: Objet[] = [
    ...MEUBLES_INT[id].filter((m) => !postes.has(cle(m.x, m.y))).map((m) => ({ type: 'meuble' as const, ...m })),
    ...agents.slice(0, slots.length).map((a, i) => ({ type: 'agent' as const, x: slots[i].x, y: slots[i].y, agent: a, slot: slots[i] })),
    { type: 'perso', x: perso.pos.x, y: perso.pos.y },
  ]
  if (id === 'maison') objets.push({ type: 'lit', x: 0, y: 1 }, { type: 'etagere', x: 2, y: 0 }, { type: 'cuisine', x: 4, y: 0 }, { type: 'bureau', x: BUREAU_MAISON.x, y: BUREAU_MAISON.y })
  objets.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x)

  const vb = { x: -(PROFONDEUR + 0.5) * TW - 24, y: -HAUTEUR_MUR - 40, w: (LARGEUR + PROFONDEUR + 1) * TW + 48, h: HAUTEUR_MUR + (LARGEUR + PROFONDEUR) * TH + 90 }

  return (
    <svg className="interieur" viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={dehors ? `Dehors : ${M.nom}` : `Intérieur : ${M.nom}`}>
      <defs>
        <linearGradient id="ac-ciel-fenetre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={nuit ? '#2A2E4A' : '#CFE5F1'} />
          <stop offset="1" stopColor={nuit ? '#4A5578' : '#F6E6C2'} />
        </linearGradient>
        <pattern id="ac-papier" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx={5} cy={5} r={0.9} fill="rgba(34,48,31,.07)" />
        </pattern>
      </defs>
      {dehors ? (
        <g aria-hidden>
          {nuit ? (
            <circle cx={vb.x + vb.w * 0.2} cy={vb.y + 46} r={14} fill="#F4EFD6" />
          ) : (
            <>
              <circle cx={vb.x + vb.w * 0.2} cy={vb.y + 46} r={16} fill="#F3C66A" />
              <circle cx={vb.x + vb.w * 0.2} cy={vb.y + 46} r={30} fill="#F3C66A" opacity={0.18} />
            </>
          )}
          <g fill="#FBF8F1" opacity={0.95} className="ac-nuages">
            <ellipse cx={vb.x + vb.w * 0.62} cy={vb.y + 40} rx={26} ry={9} />
            <ellipse cx={vb.x + vb.w * 0.65} cy={vb.y + 32} rx={16} ry={9} />
            <ellipse cx={vb.x + vb.w * 0.86} cy={vb.y + 70} rx={20} ry={7} />
          </g>
          <g stroke="#4F5A49" strokeWidth={1.2} fill="none" strokeLinecap="round" className="oiseaux">
            <path d={`M ${vb.x + vb.w * 0.4} ${vb.y + 60} q 3 -3 6 0 q 3 -3 6 0`} />
            <path d={`M ${vb.x + vb.w * 0.46} ${vb.y + 52} q 3 -3 6 0 q 3 -3 6 0`} />
          </g>
          <Haie de={[-0.5, -0.5]} a={[-0.5, PROFONDEUR - 0.5]} n={PROFONDEUR} />
          <Haie de={[-0.5, -0.5]} a={[LARGEUR - 0.5, -0.5]} n={LARGEUR} />
        </g>
      ) : (
        <g>
          <polygon points={murGauche} fill={murInt} />
          <polygon points={murDroit} fill={nuance(murInt, -0.06)} />
          <polygon points={murGauche} fill="url(#ac-papier)" />
          <polygon points={murDroit} fill="url(#ac-papier)" />
          <polygon points={fenetre} fill="url(#ac-ciel-fenetre)" stroke={CREME} strokeWidth={2.4} />
          <circle cx={(3.3 + 0.5) * TW} cy={(3.3 - 0.5) * TH - 44} r={5} fill={nuit ? '#F4EFD6' : '#F3C66A'} />
          <path d={`M ${C(3, -0.5, 24)} L ${C(3, -0.5, 52)} M ${C(2.2, -0.5, 38)} L ${C(3.8, -0.5, 38)}`} stroke={CREME} strokeWidth={1.6} />
          <polygon points={cadre} fill="#F4EAD5" stroke={nuance(BOIS, -0.1)} strokeWidth={1.8} />
          <ellipse cx={(-0.5 - 1.7) * TW} cy={(-0.5 + 1.7) * TH - 38} rx={9} ry={4.5} fill="#8DBF85" />
          <circle cx={(-0.5 - 1.7) * TW + 3} cy={(-0.5 + 1.7) * TH - 44} r={3} fill="#2F7A5C" />
          <polygon points={`${C(-0.5, -0.5, 4)} ${C(-0.5, -0.5)} ${C(-0.5, PROFONDEUR - 0.5)} ${C(-0.5, PROFONDEUR - 0.5, 4)}`} fill={nuance(sol[1], -0.2)} />
          <polygon points={`${C(-0.5, -0.5, 4)} ${C(-0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5, 4)}`} fill={nuance(sol[1], -0.3)} />
        </g>
      )}

      <g>
        {tuiles.map((t) => (
          <polygon key={cle(t.x, t.y)} points={losange(t.x, t.y)} fill={sol[(t.x + t.y) % 2]} stroke="rgba(255,255,255,.35)" strokeWidth={0.6} />
        ))}
      </g>
      {dehors && (
        <g aria-hidden>
          {[[1, 2], [3, 3], [2, 3], [4, 4], [1, 4]].map(([x, y]) => (
            <g key={`${x}${y}`} transform={`translate(${iso(x, y).sx + ((x * 7) % 11) - 5} ${iso(x, y).sy + ((y * 5) % 7) - 3})`}>
              <Flore type={(x + y) % 2 === 0 ? 1 : 0} />
            </g>
          ))}
        </g>
      )}
      {id === 'spa' && (
        <g transform={`translate(${iso(2.5, 2.5).sx} ${iso(2.5, 2.5).sy})`} aria-hidden>
          <ellipse rx={TW * 1.1} ry={TH * 1.1} fill="#B5D8DB" />
          <ellipse rx={TW * 0.9} ry={TH * 0.9} fill="#9FCBD1" />
          <ellipse cx={-10} cy={-3} rx={12} ry={4} fill="#FBF8F1" opacity={0.5} />
          <g className="vapeur" stroke="#FBF8F1" strokeWidth={1.4} fill="none" strokeLinecap="round" opacity={0.8}>
            <path d="M -8 -4 q 2 -4 0 -8 q -2 -4 0 -8" />
            <path d="M 6 -2 q 2 -4 0 -8 q -2 -4 0 -8" />
          </g>
        </g>
      )}
      {id === 'maison' && (
        <ellipse cx={iso(2.5, 2.6).sx} cy={iso(2.5, 2.6).sy} rx={TW * 1.0} ry={TH * 1.0} fill="#D9A24B" opacity={0.35} aria-hidden />
      )}
      {/* Paillasson (ou portillon) de sortie */}
      <g
        className="paillasson"
        transform={`translate(${iso(ENTREE_INT.x, ENTREE_INT.y + 0.1).sx} ${iso(ENTREE_INT.x, ENTREE_INT.y + 0.1).sy})`}
        role="button"
        tabIndex={0}
        aria-label={dehors ? 'Sortir du jardin' : 'Sortir de la maison'}
        onClick={onSortir}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSortir() } }}
      >
        <polygon points={`${P(-0.42, 0, 0)} ${P(0, -0.42, 0)} ${P(0.42, 0, 0)} ${P(0, 0.42, 0)}`} fill={dehors ? '#E6D3A8' : '#C9A06A'} />
        <path d={`M ${P(-0.3, 0, 0)} L ${P(0.12, -0.42, 0)} M ${P(-0.12, 0.42, 0)} L ${P(0.3, 0, 0)}`} stroke={dehors ? '#D4BF8E' : '#B48A56'} strokeWidth={1.2} />
        <text y={20} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={10} fontWeight={700} fill="#4F5A49">Sortir ↓</text>
      </g>

      {objets.map((o, i) => {
        const { sx, sy } = iso(o.x, o.y)
        const t = `translate(${sx} ${sy})`
        switch (o.type) {
          case 'meuble':
            return <g key={i} transform={`${t} scale(1.15)`} aria-hidden><Meuble id={o.meuble} /></g>
          case 'lit':
            return <g key={i} transform={`${t} scale(1.15)`} aria-hidden><Lit /></g>
          case 'etagere':
            return <g key={i} transform={`${t} scale(1.15)`} aria-hidden><Etagere /></g>
          case 'cuisine':
            return <g key={i} transform={`${t} scale(1.15)`} aria-hidden><Cuisine /></g>
          case 'bureau':
            return (
              <g key={i} transform={`${t} scale(1.15)`} className="cible" role="button" tabIndex={0} aria-label="Le bureau du jour : ce que tes agents ont préparé"
                onClick={onBureau} onKeyDown={(e) => { if (e.key === 'Enter') onBureau() }}>
                <polygon points={losange(0, 0)} fill="transparent" />
                <BureauJour attente={Math.min(3, nbAttente)} />
              </g>
            )
          case 'agent':
            return (
              <g key={o.agent.id} transform={t} className="cible" data-agent={o.agent.templateId} role="button" tabIndex={0} aria-label={`Aller voir ${o.agent.nom}`}
                onClick={() => onAgent(o.agent, o.slot)} onKeyDown={(e) => { if (e.key === 'Enter') onAgent(o.agent, o.slot) }}>
                <polygon points={losange(0, 0)} fill="transparent" />
                <g transform="scale(1.2)">
                  <Poste id={o.agent.poste} domaine={o.agent.domaine} couleur={COULEUR[o.agent.domaine]} niveau={o.agent.niveau} phase={(hache(o.x, o.y) % 20) / 10} />
                </g>
                {o.agent.attente && (
                  <g className="signe-vie" aria-hidden>
                    <g transform="translate(0 -62)"><g className="signe-point">
                      <circle r={7} fill="#E7B04A" opacity={0.95} />
                      <text y={4} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={11} fontWeight={700} fill="#22301F">!</text>
                    </g></g>
                  </g>
                )}
              </g>
            )
          case 'perso':
            return <g key="perso" transform={`${t} scale(1.1)`}><Perso marche={perso.enMarche} versGauche={perso.versGauche} /></g>
        }
      })}
      {/* Nuit : lumière chaude de la lampe */}
      {nuit && <rect x={vb.x} y={vb.y} width={vb.w} height={vb.h} fill="#1B2140" opacity={dehors ? 0.3 : 0.12} pointerEvents="none" />}
    </svg>
  )
}
