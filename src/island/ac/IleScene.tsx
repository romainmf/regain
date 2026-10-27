import { useMemo } from 'react'
import type { Domaine, PosteId } from '../../domain/types'
import { COULEUR } from '../../domain/couleurs'
import type { Ambiance, DecorId } from '../../domain/boutique'
import type { Meteo } from '../../domain/economy'
import { lumiereDepuisElan } from '../../domain/economy'
import { Coeur } from '../Coeur'
import { Decor } from '../Decor'
import { Meuble, type MeubleId } from '../Meubles'
import { Poste } from '../Poste'
import { Robot } from '../Robot'
import { hache } from '../Paysage'
import { Arbre, BOIS, CREME, Flore, Pave, Toit, VERRE, nuance } from '../buildings/primitives'
import { TH, TW, iso, losange } from '../iso'
import { STYLES_MUR, type StyleMur } from '../LieuxZones'
import { Perso } from './Perso'
import {
  DECALAGE_DECOR, JARDIN_LOCAL, LIEUX, ORDRE, PLACE, cle, emprise, placeTuiles,
  type Ancre, type LieuId, type Pos, type Terrain, type TuileIle,
} from './lieux'
import './ac.css'

/** Un agent tel que l'île le dessine. */
export interface AgentVue {
  id: string
  nom: string
  domaine: Domaine
  poste: PosteId
  niveau: 1 | 2 | 3
  templateId?: string
  /** A une proposition en attente. */
  attente: boolean
}

export interface DecorPose { id: string; x: number; y: number; decorId: DecorId }

export interface EtatPerso { pos: Pos; enMarche: boolean; versGauche: boolean }

interface Props {
  tuiles: TuileIle[]
  fonds: Pos[]
  /** Vrai si la tuile est de la terre (pour dessiner la falaise sur le pourtour). */
  estTerre: (x: number, y: number) => boolean
  lieux: Record<LieuId, Ancre>
  agents: AgentVue[]
  /** Le personnage, ou null quand il est à l'intérieur d'un lieu. */
  perso: EtatPerso | null
  mode: 'visite' | 'disposer'
  enMain: LieuId | null
  /** Lieu dont la porte est ouverte (on entre). */
  porteOuverte: LieuId | null
  /** Ancres valides pour le lieu en main. */
  peutPoser: (id: LieuId, a: Ancre) => boolean
  decors: DecorPose[]
  /** Un décor de la boutique attend d'être posé : les tuiles libres s'allument. */
  poseDecor: boolean
  onPoserDecor: (x: number, y: number) => void
  onRetirerDecor: (id: string) => void
  ambiance: Ambiance
  meteo: Meteo
  repos: Record<Domaine, boolean>
  elan: number
  murs: Record<Domaine, StyleMur>
  /** Brin : salut au passage, texte de sa bulle, lieu qu'il pointe. */
  salut: boolean
  texteBrin: string
  conseil: LieuId | null
  onBrin: () => void
  onBulleBrin: () => void
  onLieu: (id: LieuId) => void
  onTuile: (x: number, y: number) => void
  /** Où placer l'île dans la hauteur du cadre (0,4 : un peu haut, pour laisser le tiroir ; 0,5 : au milieu). */
  centreY?: number
}

const P = (fx: number, fy: number, fz: number) => `${(fx - fy) * TW},${(fx + fy) * TH - fz}`
const C = (cx: number, cy: number, z = 0) => `${(cx - cy) * TW},${(cx + cy) * TH - z}`

// ——— Une maison ——————————————————————————————————————————————————————————

/** Une maison donne signe de vie quand un agent y attend : fumée, vapeur, fenêtres éclairées, drapeau levé. */
function MaisonIle({ id, porteOuverte, enMain, attente, nuit, mur, repos }: {
  id: LieuId; porteOuverte: boolean; enMain: boolean; attente: number; nuit: boolean; mur: string; repos: boolean
}) {
  const M = LIEUX[id]
  const w = 0.78, d = 0.78, h = 30
  const vivante = attente > 0
  const vitre = vivante || nuit ? '#F8E7B8' : VERRE
  const porte = `${P(-0.26, d, 0)} ${P(0.1, d, 0)} ${P(0.1, d, 19)} ${P(-0.26, d, 19)}`
  const fenetreG = `${P(0.3, d, 11)} ${P(0.62, d, 11)} ${P(0.62, d, 23)} ${P(0.3, d, 23)}`
  const fenetreD = `${P(w, -0.55, 11)} ${P(w, -0.15, 11)} ${P(w, -0.15, 24)} ${P(w, -0.55, 24)}`
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}${repos ? ' maison-repos' : ''}`}>
      <ellipse cx={10} cy={8} rx={TW * 1.3} ry={TH * 1.3} fill="rgba(34,48,31,.16)" />
      <polygon points={`${P(-1.05, -1.05, 0)} ${P(1.05, -1.05, 0)} ${P(1.05, 1.05, 0)} ${P(-1.05, 1.05, 0)}`} fill="#E9DCC0" opacity={0.9} />
      <Pave w={w} d={d} h={h} couleur={mur} haut={mur} />
      <polygon points={`${P(-w, d, 0)} ${P(w, d, 0)} ${P(w, d, 5)} ${P(-w, d, 5)}`} fill={nuance(M.toit, 0.1)} opacity={0.7} />
      <polygon points={`${P(w, d, 0)} ${P(w, -d, 0)} ${P(w, -d, 5)} ${P(w, d, 5)}`} fill={nuance(M.toit, -0.1)} opacity={0.7} />
      {/* Porte : l'intérieur sombre, puis le battant qui s'ouvre */}
      <polygon points={porte} fill="#2E2520" />
      <polygon className={`porte${porteOuverte ? ' porte-ouverte' : ''}`} points={porte} fill={nuance(BOIS, -0.08)} stroke={nuance(BOIS, -0.3)} strokeWidth={0.8} />
      <circle cx={(0.03 - d) * TW} cy={(0.03 + d) * TH - 9.5} r={1.1} fill="#E7B04A" />
      {/* Fenêtres : éclairées quand quelqu'un attend dedans, ou la nuit */}
      {(vivante || nuit) && (
        <g className="fenetre-lueur" aria-hidden>
          <polygon points={fenetreG} fill="#F6E6C2" stroke="#F6E6C2" strokeWidth={7} strokeLinejoin="round" opacity={0.45} />
          <polygon points={fenetreD} fill="#F6E6C2" stroke="#F6E6C2" strokeWidth={7} strokeLinejoin="round" opacity={0.45} />
        </g>
      )}
      <polygon points={fenetreG} fill={vitre} stroke={CREME} strokeWidth={1.4} />
      <polygon points={fenetreD} fill={vitre} stroke={CREME} strokeWidth={1.4} />
      <path d={`M ${P(0.46, d, 11)} L ${P(0.46, d, 23)}`} stroke={CREME} strokeWidth={0.9} />
      <path d={`M ${P(w, -0.35, 11)} L ${P(w, -0.35, 24)}`} stroke={CREME} strokeWidth={0.9} />
      <g transform={`translate(${(0.46 - d) * TW} ${(0.46 + d) * TH - 10})`}>
        <rect x={-6} y={0} width={12} height={3} rx={1} fill={nuance(BOIS, -0.1)} />
        <circle cx={-3} cy={-1} r={1.8} fill="#D98BA9" />
        <circle cx={1} cy={-2} r={1.8} fill="#E7B04A" />
        <circle cx={4} cy={-1} r={1.6} fill="#5E9B62" />
      </g>
      <Toit w={1.0} d={1.0} z={h} h={22} couleur={M.toit} faitage={0.42} solaire={id === 'maison'} />
      {id === 'atelier' && (
        <g transform={`translate(${(0.5 + 0.35) * TW} ${(0.5 - 0.35) * TH - h - 14})`}>
          <Pave w={0.07} d={0.07} h={12} couleur="#B8A48A" />
          {vivante && (
            <g className="fumee" fill="#F5F0E3" opacity={0.85}>
              <circle cx={0} cy={-16} r={2.6} />
              <circle cx={2} cy={-22} r={3.4} />
              <circle cx={-1} cy={-29} r={4} />
            </g>
          )}
        </g>
      )}
      {id === 'spa' && (
        <g transform={`translate(${(0.5 + 0.3) * TW} ${(0.5 - 0.3) * TH - h - 16})`}>
          <Pave w={0.09} d={0.09} h={8} couleur="#D9C4D0" />
          {vivante && (
            <g className="vapeur" stroke="#FBF8F1" strokeWidth={1.8} fill="none" strokeLinecap="round" opacity={0.9}>
              <path d="M -4 -12 q 2 -4 0 -8 q -2 -4 0 -8" />
              <path d="M 0 -14 q 2 -4 0 -8 q -2 -4 0 -8" />
              <path d="M 4 -12 q 2 -4 0 -8 q -2 -4 0 -8" />
            </g>
          )}
        </g>
      )}
      {id === 'maison' && (
        <g transform={`translate(${(-0.62 - d - 0.3) * TW} ${(-0.62 + d + 0.3) * TH})`}>
          <line x1={0} y1={0} x2={0} y2={-14} stroke={nuance(BOIS, -0.2)} strokeWidth={1.6} />
          <rect x={-4.5} y={-21} width={9} height={7} rx={2} fill="#E7B04A" />
          <rect x={-2} y={-19} width={4} height={1.4} fill="#FBF8F1" />
          <g className={vivante ? 'drapeau drapeau-leve' : 'drapeau'}>
            <line x1={4.5} y1={-18} x2={4.5} y2={-10} stroke="#B0512A" strokeWidth={1.4} strokeLinecap="round" />
            <path d="M 4.5 -18 l 4 1.5 l -4 1.5 Z" fill="#B0512A" />
          </g>
        </g>
      )}
      <polygon points={`${P(-0.3, d + 0.15, 0)} ${P(0.14, d + 0.15, 0)} ${P(0.14, d + 0.42, 0)} ${P(-0.3, d + 0.42, 0)}`} fill="#C9A06A" opacity={0.9} />
    </g>
  )
}

// ——— Le jardin en plein air ——————————————————————————————————————————————————

/** Clôture de bois le long d'un bord de parcelle (coins de tuiles), avec une ouverture possible. */
export function Cloture({ de, a, ouverture, segments = 3 }: { de: [number, number]; a: [number, number]; ouverture?: [number, number]; segments?: number }) {
  const pt = (u: number, z: number): [number, number] => {
    const cx = de[0] + (a[0] - de[0]) * u
    const cy = de[1] + (a[1] - de[1]) * u
    return [(cx - cy) * TW, (cx + cy) * TH - z]
  }
  const rails: [number, number][] = []
  for (let i = 0; i < segments; i++) {
    const u0 = i / segments, u1 = (i + 1) / segments
    if (ouverture && u0 >= ouverture[0] - 1e-6 && u1 <= ouverture[1] + 1e-6) continue
    rails.push([u0, u1])
  }
  return (
    <g>
      {rails.map(([u0, u1]) =>
        [4, 9].map((z) => {
          const [x1, y1] = pt(u0, z), [x2, y2] = pt(u1, z)
          return <line key={`${u0}-${z}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={nuance(BOIS, 0.05)} strokeWidth={1.8} strokeLinecap="round" />
        }),
      )}
      {Array.from({ length: segments + 1 }).map((_, i) => {
        const [x, y] = pt(i / segments, 0)
        return (
          <g key={i}>
            <rect x={x - 1.6} y={y - 13} width={3.2} height={13} fill={nuance(BOIS, -0.15)} />
            <rect x={x - 2.2} y={y - 15} width={4.4} height={2.6} rx={1} fill={nuance(BOIS, -0.3)} />
          </g>
        )
      })}
    </g>
  )
}

function JardinFond({ n, enMain }: { n: number; enMain: boolean }) {
  const h = n - 0.5
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}`}>
      <polygon points={`${C(-0.5, -0.5)} ${C(h, -0.5)} ${C(h, h)} ${C(-0.5, h)}`} fill="#B3D694" />
      <polygon points={`${C(-0.3, -0.3)} ${C(h - 0.2, -0.3)} ${C(h - 0.2, h - 0.2)} ${C(-0.3, h - 0.2)}`} fill="none" stroke="#9FC985" strokeWidth={1} strokeDasharray="3 3" />
      <path d={`M ${C(1.5, h)} Q ${C(1.4, 1.6)} ${C(1, 1)}`} stroke="#E6D3A8" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
      <Cloture de={[-0.5, -0.5]} a={[-0.5, h]} segments={n} />
      <Cloture de={[-0.5, -0.5]} a={[h, -0.5]} segments={n} />
    </g>
  )
}

function JardinAvant({ n, enMain, portillonOuvert }: { n: number; enMain: boolean; portillonOuvert: boolean }) {
  const h = n - 0.5
  const milieu = Math.floor(n / 2)
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}`}>
      <Cloture de={[-0.5, h]} a={[h, h]} segments={n} ouverture={[milieu / n, (milieu + 1) / n]} />
      <Cloture de={[h, -0.5]} a={[h, h]} segments={n} />
      <g transform={`translate(${(milieu - h) * TW} ${(milieu + h) * TH})`}>
        <g className={`porte${portillonOuvert ? ' porte-ouverte' : ''}`}>
          <polygon points={`${P(0.08, 0, 0)} ${P(0.42, 0, 0)} ${P(0.42, 0, 10)} ${P(0.08, 0, 10)}`} fill={nuance(BOIS, 0.1)} stroke={nuance(BOIS, -0.25)} strokeWidth={0.8} />
          <path d={`M ${P(0.12, 0, 3)} L ${P(0.38, 0, 8)}`} stroke={nuance(BOIS, -0.25)} strokeWidth={0.8} />
        </g>
      </g>
    </g>
  )
}

// ——— Petits éléments ——————————————————————————————————————————————————————

function Enseigne({ id, attente, repos }: { id: LieuId; attente: number; repos: boolean }) {
  const M = LIEUX[id]
  const l = M.nom.length * 7.6 + 30
  return (
    <g className="enseigne" aria-hidden>
      <rect x={-l / 2} y={-12} width={l} height={24} rx={12} fill="#FBF8F1" stroke="#E2DACA" />
      <circle cx={-l / 2 + 12} cy={0} r={4} fill={repos ? '#C9C1AE' : M.couleur} />
      <text x={5} y={4.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={12.5} fontWeight={700} fill="#22301F">{M.nom}</text>
      {attente > 0 && (
        <g transform={`translate(${l / 2 - 2} -10)`}><g className="signe-point">
          <circle r={8} fill="#E7B04A" stroke="#FBF8F1" strokeWidth={1.5} />
          <text y={3.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={10} fontWeight={700} fill="#22301F">{attente}</text>
        </g></g>
      )}
    </g>
  )
}

function Palmier({ variante }: { variante: number }) {
  const pench = variante % 2 ? 1 : -1
  return (
    <g>
      <ellipse cx={0} cy={1} rx={8} ry={3} fill="rgba(34,48,31,.14)" />
      <path d={`M 0 0 q ${pench * 4} -14 ${pench * 8} -30`} stroke="#A57A52" strokeWidth={3} fill="none" strokeLinecap="round" />
      <g transform={`translate(${pench * 8} -30)`}>
        {[-150, -110, -60, -20, 20, 60].map((a) => (
          <path key={a} d="M 0 0 q 8 -3 16 2 q -8 1 -16 -2 Z" fill={a % 2 ? '#5E9B62' : '#6FA56B'} transform={`rotate(${a})`} />
        ))}
        <circle cx={-2} cy={2} r={2} fill="#A57A52" />
        <circle cx={2} cy={3} r={2} fill="#8A6A4A" />
      </g>
    </g>
  )
}

function Rocher({ variante }: { variante: number }) {
  return (
    <g>
      <ellipse cx={0} cy={1} rx={7} ry={3} fill="rgba(34,48,31,.12)" />
      <path d="M -7 0 Q -8 -7 -2 -8 Q 5 -10 7 -3 Q 8 1 0 1 Z" fill={variante % 2 ? '#C9C1AE' : '#B7AE9A'} />
      <path d="M -5 -3 Q -3 -6 1 -6" stroke="#E2DACA" strokeWidth={1} fill="none" strokeLinecap="round" />
    </g>
  )
}

// ——— La scène ——————————————————————————————————————————————————————————————

const MER: Record<string, [string, string]> = {
  jour: ['#8FCBC9', '#6FB3B8'],
  nuit: ['#2F3D5C', '#22304A'],
  automne: ['#9CC6BE', '#7AAEAE'],
  hiver: ['#A9CFD8', '#8DB9C6'],
}

export function IleScene(p: Props) {
  const {
    tuiles, fonds, estTerre, lieux, agents, perso, mode, enMain, porteOuverte, peutPoser, decors, poseDecor, onPoserDecor, onRetirerDecor,
    ambiance, meteo, repos, elan, murs, salut, texteBrin, conseil, onBrin, onBulleBrin, onLieu, onTuile, centreY = 0.4,
  } = p
  const nuit = ambiance.astre === 'lune'
  const index = useMemo(() => new Map(tuiles.map((t) => [cle(t.x, t.y), t])), [tuiles])
  const sortedTuiles = useMemo(() => [...tuiles].sort((a, b) => a.x + a.y - (b.x + b.y)), [tuiles])

  const attenteLieu = (id: LieuId) => agents.filter((a) => LIEUX[id].domaine === a.domaine && a.attente).length
  const agentsDe = (id: LieuId) => agents.filter((a) => a.domaine === LIEUX[id].domaine)

  // Tuiles occupées par les lieux et la place, puis une couronne sans décor autour (les portes restent dégagées).
  const occupees = useMemo(() => {
    const s = new Set<string>(placeTuiles)
    ORDRE.forEach((id) => emprise(lieux[id], LIEUX[id].taille).forEach(([x, y]) => s.add(cle(x, y))))
    return s
  }, [lieux])
  const occupeesDecor = useMemo(() => {
    const s = new Set<string>(occupees)
    ORDRE.forEach((id) =>
      emprise(lieux[id], LIEUX[id].taille).forEach(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s.add(cle(x + dx, y + dy))
      }),
    )
    return s
  }, [occupees, lieux])

  // Chemins de la place vers chaque porte : des pas japonais.
  const chemins = useMemo(() => {
    const pas = new Set<string>()
    ORDRE.forEach((id) => {
      const a = lieux[id], n = LIEUX[id].taille
      const de = { x: a.x + Math.floor((n - 1) / 2), y: a.y + n }
      const etapes = Math.max(Math.abs(PLACE.x - de.x), Math.abs(PLACE.y - de.y))
      for (let i = 0; i <= etapes; i++) {
        const x = Math.round(de.x + ((PLACE.x - de.x) * i) / etapes)
        const y = Math.round(de.y + ((PLACE.y - de.y) * i) / etapes)
        if (!occupees.has(cle(x, y)) && index.has(cle(x, y))) pas.add(cle(x, y))
      }
    })
    return [...pas].map((k) => k.split(',').map(Number) as [number, number])
  }, [lieux, occupees, index])
  const cheminsSet = useMemo(() => new Set(chemins.map(([x, y]) => cle(x, y))), [chemins])

  // Décors achetés, décalés sur l'île ; ceux qui tombent dans l'eau ou sur un lieu sont ignorés.
  const decorsVisibles = useMemo(() => {
    const occ = new Set<string>()
    return decors
      .map((d) => ({ ...d, x: d.x + DECALAGE_DECOR, y: d.y + DECALAGE_DECOR }))
      .filter((d) => index.has(cle(d.x, d.y)) && !occupees.has(cle(d.x, d.y)) && !occ.has(cle(d.x, d.y)) && occ.add(cle(d.x, d.y)))
  }, [decors, index, occupees])
  const decorsSet = useMemo(() => new Set(decorsVisibles.map((d) => cle(d.x, d.y))), [decorsVisibles])
  const tuileLibrePourDecor = (t: TuileIle) => t.terrain === 'herbe' && !occupees.has(cle(t.x, t.y)) && !decorsSet.has(cle(t.x, t.y)) && !placeTuiles.has(cle(t.x, t.y))

  // ——— Cadre : l'île tient dans la largeur ; au-dessus et au-dessous, la mer ———
  const marge = 22
  const etendue = useMemo(
    () => tuiles.reduce(
      (b, t) => {
        const { sx, sy } = iso(t.x, t.y)
        return { minX: Math.min(b.minX, sx - TW), maxX: Math.max(b.maxX, sx + TW), minY: Math.min(b.minY, sy - TH), maxY: Math.max(b.maxY, sy + TH + 14) }
      },
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
    ),
    [tuiles],
  )
  const W = (etendue.maxX - etendue.minX) * 0.84 + marge * 2
  const minX = (etendue.minX + etendue.maxX) / 2 - W / 2
  const H = W * 2
  const minY = (etendue.minY + etendue.maxY) / 2 - H * centreY

  type Objet =
    | { type: 'maison'; id: LieuId; x: number; y: number }
    | { type: 'jardin-fond' | 'jardin-avant'; id: LieuId; x: number; y: number }
    | { type: 'jardin-meuble'; x: number; y: number; meuble: MeubleId; cle: string }
    | { type: 'jardin-agent'; x: number; y: number; agent: AgentVue }
    | { type: 'jardin-robot'; x: number; y: number }
    | { type: 'brin'; x: number; y: number }
    | { type: 'flore'; x: number; y: number; variante: number; terrain: Terrain }
    | { type: 'decor'; x: number; y: number; id: string; decorId: DecorId }
    | { type: 'perso'; x: number; y: number }
  const objets: Objet[] = [{ type: 'brin', x: PLACE.x, y: PLACE.y }]
  ORDRE.forEach((id) => {
    const a = lieux[id], n = LIEUX[id].taille
    if (LIEUX[id].genre === 'maison') {
      objets.push({ type: 'maison', id, x: a.x + 1, y: a.y + 1 })
    } else {
      const dedans = agentsDe(id)
      objets.push({ type: 'jardin-fond', id, x: a.x - 0.4, y: a.y })
      JARDIN_LOCAL.forEach((o) => {
        if (o.meuble) objets.push({ type: 'jardin-meuble', x: a.x + o.x, y: a.y + o.y, meuble: o.meuble, cle: `${id}-${o.x}-${o.y}` })
        else if (o.agent != null && dedans[o.agent]) objets.push({ type: 'jardin-agent', x: a.x + o.x, y: a.y + o.y, agent: dedans[o.agent] })
      })
      if (attenteLieu(id) > 0) objets.push({ type: 'jardin-robot', x: a.x + Math.floor(n / 2) + 0.4, y: a.y + n - 1.15 })
      objets.push({ type: 'jardin-avant', id, x: a.x + n - 0.55, y: a.y + n - 0.55 })
    }
  })
  tuiles
    .filter((t) => !occupeesDecor.has(cle(t.x, t.y)) && !cheminsSet.has(cle(t.x, t.y)) && !decorsSet.has(cle(t.x, t.y)))
    .filter((t) => (t.terrain === 'herbe' ? hache(t.x, t.y) % 11 < 3 : hache(t.x, t.y) % 7 < 2))
    .forEach((t) => objets.push({ type: 'flore', x: t.x, y: t.y, variante: hache(t.x, t.y) >> 3, terrain: t.terrain }))
  decorsVisibles.forEach((d) => objets.push({ type: 'decor', x: d.x, y: d.y, id: d.id, decorId: d.decorId }))
  if (perso) objets.push({ type: 'perso', x: perso.pos.x, y: perso.pos.y })
  objets.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x)

  const bords = sortedTuiles.flatMap((t) => {
    const out: { t: TuileIle; cote: 'g' | 'd' }[] = []
    if (!estTerre(t.x, t.y + 1)) out.push({ t, cote: 'g' })
    if (!estTerre(t.x + 1, t.y)) out.push({ t, cote: 'd' })
    return out
  })

  const lieuProps = (id: LieuId) => ({
    className: 'cible batiment',
    'data-lieu': id,
    role: 'button',
    tabIndex: 0,
    'aria-label': mode === 'disposer' ? `${LIEUX[id].nom} : toucher pour le prendre, puis une tuile pour le poser` : `Entrer dans ${LIEUX[id].nom}`,
    onClick: () => onLieu(id),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') onLieu(id) },
  })
  const reposDe = (id: LieuId) => { const d = LIEUX[id].domaine; return d ? repos[d] : false }
  const murDe = (id: LieuId) => { const d = LIEUX[id].domaine; return d ? nuance(STYLES_MUR[murs[d]].fond, 0.45) : LIEUX[id].mur }
  const mer = MER[ambiance.id] ?? MER.jour
  const b = iso(PLACE.x, PLACE.y)

  return (
    <svg className="ile" viewBox={`${minX} ${minY} ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Ton île">
      <defs>
        <linearGradient id="ac-mer" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={mer[0]} />
          <stop offset="1" stopColor={mer[1]} />
        </linearGradient>
        <radialGradient id="ac-soleil" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="#FBEFC9" stopOpacity="0.55" />
          <stop offset="1" stopColor="#FBEFC9" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x={minX} y={minY} width={W} height={H} fill="url(#ac-mer)" />
      {/* Vaguelettes, ou étoiles la nuit */}
      {nuit ? (
        <g aria-hidden pointerEvents="none">
          <circle cx={minX + W * 0.78} cy={minY + H * 0.2} r={16} fill="#F4EFD6" />
          <circle cx={minX + W * 0.78 + 6} cy={minY + H * 0.2 - 5} r={14} fill={mer[0]} />
          {Array.from({ length: 22 }).map((_, i) => {
            const h = hache(i * 13 + 7, i * 29 + 3)
            return <circle key={i} className="etoile" cx={minX + ((h % 1000) / 1000) * W} cy={minY + (((h >> 10) % 1000) / 1000) * H * 0.34} r={(h % 2) + 0.8} fill="#FBF8F1" style={{ animationDelay: `${(h % 30) / 10}s` }} />
          })}
        </g>
      ) : (
        <g className="ac-vagues" stroke="#FBF8F1" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} fill="none" aria-hidden>
          {Array.from({ length: 14 }).map((_, i) => {
            const h = hache(i * 31 + 5, i * 17 + 11)
            const x = minX + ((h % 1000) / 1000) * W
            const y = minY + (((h >> 10) % 1000) / 1000) * H
            return <path key={i} d={`M ${x} ${y} q 6 -3 12 0 q 6 3 12 0`} style={{ animationDelay: `${(h % 40) / 10}s` }} />
          })}
        </g>
      )}
      <g>
        {fonds.map((f) => (
          <polygon key={cle(f.x, f.y)} points={losange(f.x, f.y)} fill={nuit ? '#5A7A95' : '#B9E0DC'} opacity={0.75} />
        ))}
      </g>
      {/* Falaise de sable sous l'île */}
      <g>
        {bords.map(({ t, cote }) => {
          const { sx, sy } = iso(t.x, t.y)
          const [ax, ay, bx, by] = cote === 'g' ? [sx - TW, sy, sx, sy + TH] : [sx, sy + TH, sx + TW, sy]
          return (
            <g key={`${t.x},${t.y}${cote}`}>
              <polygon points={`${ax},${ay} ${bx},${by} ${bx},${by + 14} ${ax},${ay + 14}`} fill={cote === 'g' ? '#E3CFA0' : '#CDB587'} />
              <path d={`M ${ax} ${ay + 15} L ${bx} ${by + 15}`} stroke="#FBF8F1" strokeWidth={1.2} opacity={0.7} />
            </g>
          )
        })}
      </g>
      {/* Sol : plage et herbe en damier doux (neige l'hiver) */}
      <g>
        {sortedTuiles.map((t) => {
          const herbe = ambiance.neige ? ((t.x + t.y) % 2 ? '#EAF0EC' : '#E2EAE4') : ambiance.feuilles ? ((t.x + t.y) % 2 ? '#C4C97A' : '#B9C070') : (t.x + t.y) % 2 ? '#A9D18E' : '#9FCB84'
          const posable = (mode === 'disposer' && enMain) || (poseDecor && tuileLibrePourDecor(t))
          return (
            <polygon
              key={cle(t.x, t.y)}
              points={losange(t.x, t.y)}
              fill={t.terrain === 'sable' ? ((t.x + t.y) % 2 ? '#F1E1B5' : '#EDDBAC') : herbe}
              stroke={t.terrain === 'sable' ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.18)'}
              strokeWidth={0.6}
              className={posable ? 'ac-tuile-posable' : undefined}
              role={poseDecor && tuileLibrePourDecor(t) ? 'button' : undefined}
              aria-label={poseDecor && tuileLibrePourDecor(t) ? 'Poser ici' : undefined}
              onClick={() => (poseDecor ? tuileLibrePourDecor(t) && onPoserDecor(t.x - DECALAGE_DECOR, t.y - DECALAGE_DECOR) : onTuile(t.x, t.y))}
            />
          )
        })}
      </g>
      {/* La place pavée en rond, les pas japonais */}
      <g aria-hidden>
        <ellipse cx={b.sx} cy={b.sy} rx={TW * 1.75} ry={TH * 1.75} fill="#E9DCC0" />
        <ellipse cx={b.sx} cy={b.sy} rx={TW * 1.45} ry={TH * 1.45} fill="none" stroke="#DCCBA4" strokeWidth={2} strokeDasharray="6 5" />
        {chemins.map(([x, y]) => {
          const { sx, sy } = iso(x, y)
          return <ellipse key={cle(x, y)} cx={sx} cy={sy} rx={TW * 0.42} ry={TH * 0.42} fill="#E6D3A8" stroke="#DCC89A" strokeWidth={0.8} />
        })}
      </g>
      {!nuit && <ellipse cx={b.sx} cy={b.sy} rx={W * 0.32} ry={H * 0.26} fill="url(#ac-soleil)" opacity={lumiereDepuisElan(elan) + 0.4} pointerEvents="none" />}
      {/* Tuiles libres qui s'allument pendant une pose de décor */}
      {poseDecor && (
        <g className="pose-libres" pointerEvents="none">
          {tuiles.filter(tuileLibrePourDecor).map((t) => (
            <polygon key={cle(t.x, t.y)} className="pose-tuile" points={losange(t.x, t.y)} fill="var(--planete)" stroke="var(--surface)" strokeWidth={1.5} />
          ))}
        </g>
      )}
      {/* Disposition : ancres valides pour le lieu en main */}
      {mode === 'disposer' && enMain && (
        <g className="ac-emprises" pointerEvents="none">
          {tuiles.filter((t) => peutPoser(enMain, t)).map((t) => {
            const { sx, sy } = iso(t.x, t.y)
            return <circle key={cle(t.x, t.y)} cx={sx} cy={sy} r={3.4} fill="#FBF8F1" stroke="#5E9B62" strokeWidth={1.2} opacity={0.95} />
          })}
          {(() => {
            const a = lieux[enMain], n = LIEUX[enMain].taille
            const c = (cx: number, cy: number) => `${(cx - cy) * TW},${(cx + cy) * TH}`
            return <polygon points={`${c(a.x - 0.5, a.y - 0.5)} ${c(a.x + n - 0.5, a.y - 0.5)} ${c(a.x + n - 0.5, a.y + n - 0.5)} ${c(a.x - 0.5, a.y + n - 0.5)}`} fill="none" stroke="#FBF8F1" strokeWidth={2} strokeDasharray="5 4" />
          })()}
        </g>
      )}

      {/* Objets, de l'arrière vers l'avant */}
      <g>
        {objets.map((o) => {
          const { sx, sy } = iso(o.x, o.y)
          switch (o.type) {
            case 'maison': {
              const centre = iso(lieux[o.id].x + 0.5, lieux[o.id].y + 0.5)
              return (
                <g key={o.id} transform={`translate(${centre.sx} ${centre.sy})`} {...lieuProps(o.id)}>
                  <MaisonIle id={o.id} porteOuverte={porteOuverte === o.id} enMain={enMain === o.id} attente={o.id === 'maison' ? agents.filter((a) => a.attente).length : attenteLieu(o.id)} nuit={nuit} mur={murDe(o.id)} repos={reposDe(o.id)} />
                </g>
              )
            }
            case 'jardin-fond': {
              const c = iso(lieux[o.id].x, lieux[o.id].y)
              return (
                <g key={`${o.id}-fond`} transform={`translate(${c.sx} ${c.sy})`} {...lieuProps(o.id)}>
                  <JardinFond n={LIEUX[o.id].taille} enMain={enMain === o.id} />
                </g>
              )
            }
            case 'jardin-avant': {
              const c = iso(lieux[o.id].x, lieux[o.id].y)
              return (
                <g key={`${o.id}-avant`} transform={`translate(${c.sx} ${c.sy})`} {...lieuProps(o.id)}>
                  <JardinAvant n={LIEUX[o.id].taille} enMain={enMain === o.id} portillonOuvert={porteOuverte === o.id} />
                </g>
              )
            }
            case 'jardin-meuble':
              return (
                <g key={o.cle} transform={`translate(${sx} ${sy}) scale(0.85)`} className={enMain === 'jardin' ? 'maison maison-en-main' : undefined} aria-hidden>
                  <Meuble id={o.meuble} />
                </g>
              )
            case 'jardin-agent':
              return (
                <g key={o.agent.id} transform={`translate(${sx} ${sy}) scale(0.8)`} className={enMain === 'jardin' ? 'maison maison-en-main' : undefined} data-agent={o.agent.templateId} aria-hidden>
                  <Poste id={o.agent.poste} domaine={o.agent.domaine} couleur={COULEUR[o.agent.domaine]} niveau={o.agent.niveau} phase={(hache(o.x, o.y) % 20) / 10} />
                  {o.agent.attente && (
                    <g transform="translate(0 -52)"><g className="signe-point">
                      <circle r={6} fill="#E7B04A" opacity={0.95} />
                      <text y={3.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={9.5} fontWeight={700} fill="#22301F">!</text>
                    </g></g>
                  )}
                </g>
              )
            case 'jardin-robot':
              return (
                <g key="jardin-robot" transform={`translate(${sx} ${sy}) scale(0.85)`} aria-hidden>
                  <Robot domaine="planete" couleur={COULEUR.planete} phase={0.4} />
                  <g transform="translate(0 -44)"><g className="signe-point">
                    <circle r={5.5} fill="#E7B04A" opacity={0.95} />
                    <text y={3.2} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={9} fontWeight={700} fill="#22301F">!</text>
                  </g></g>
                </g>
              )
            case 'brin':
              return (
                <g key="brin" transform={`translate(${sx} ${sy})`} className={`coeur-brin cible${salut ? ' brin-salue' : ''}`} role="button" tabIndex={0} aria-label="Parler à Brin, l’arbre au cœur de ton île"
                  onClick={onBrin} onKeyDown={(e) => { if (e.key === 'Enter') onBrin() }}>
                  <g transform="scale(1.35)">
                    <ellipse className="coeur-halo" cx={0} cy={2} rx={30} ry={15} fill="none" stroke="#E7B04A" strokeWidth={1.5} />
                    <Coeur />
                    <rect x={-32} y={-80} width={64} height={92} fill="transparent" />
                  </g>
                </g>
              )
            case 'flore': {
              const v = o.variante
              return (
                <g key={`f${o.x},${o.y}`} transform={`translate(${sx} ${sy})`} aria-hidden>
                  {o.terrain === 'sable'
                    ? v % 3 === 0 ? <Palmier variante={v} /> : <Rocher variante={v} />
                    : v % 4 === 0 ? <Arbre r={10 + (v % 4)} tronc={9} couleur={ambiance.feuilles ? (v % 2 ? '#C96A41' : '#E7B04A') : v % 2 ? '#6FA56B' : '#5E9B62'} /> : <Flore type={v} />}
                </g>
              )
            }
            case 'decor':
              return (
                <g key={o.id} className="decor cible" transform={`translate(${sx} ${sy})`} role="button" tabIndex={0} aria-label="Décor — toucher pour retirer"
                  onClick={() => onRetirerDecor(o.id)} onKeyDown={(e) => { if (e.key === 'Enter') onRetirerDecor(o.id) }}>
                  <polygon points={losange(0, 0)} fill="transparent" />
                  <Decor id={o.decorId} nuit={nuit} />
                </g>
              )
            case 'perso':
              return <g key="perso" transform={`translate(${sx} ${sy}) scale(1.05)`}><Perso marche={perso?.enMarche ?? false} versGauche={perso?.versGauche ?? false} /></g>
          }
        })}
      </g>

      {/* Enseignes au-dessus des toits */}
      <g pointerEvents="none">
        {ORDRE.map((id) => {
          const a = lieux[id], n = LIEUX[id].taille
          const c = iso(a.x + (n - 1) / 2, a.y + (n - 1) / 2)
          const haut = LIEUX[id].genre === 'jardin' ? -58 : -74
          return (
            <g key={id} transform={`translate(${c.sx} ${c.sy + haut})`}>
              <Enseigne id={id} attente={attenteLieu(id)} repos={reposDe(id)} />
            </g>
          )
        })}
      </g>

      {/* Brin parle : il salue au passage, sinon il pointe le lieu où quelque chose attend */}
      {mode === 'visite' && texteBrin && (() => {
        const l = texteBrin.length * 7.2 + 28
        const pointe = !salut ? conseil : null
        const cible = pointe ? iso(lieux[pointe].x + (LIEUX[pointe].taille - 1) / 2, lieux[pointe].y + LIEUX[pointe].taille) : null
        return (
          <g>
            {cible && (() => {
              const dx = cible.sx - b.sx, dy = cible.sy - b.sy
              const d = Math.hypot(dx, dy) || 1
              const ax = b.sx + (dx / d) * 54, ay = b.sy + (dy / d) * 27 + 6
              const bx = cible.sx - (dx / d) * 22, by = cible.sy - (dy / d) * 11
              const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
              return (
                <g className="brin-pointe" aria-hidden pointerEvents="none">
                  <path className="flux-trait" d={`M ${ax} ${ay} L ${bx} ${by}`} fill="none" stroke="#E7B04A" strokeWidth={3} strokeLinecap="round" strokeDasharray="2 7" />
                  <g transform={`translate(${bx} ${by}) rotate(${ang})`}>
                    <path d="M -7 -4 L 0 0 L -7 4" fill="none" stroke="#E7B04A" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                </g>
              )
            })()}
            <g
              key={texteBrin}
              className={`coeur-bulle brin-bulle${pointe ? ' cible' : ''}`}
              transform={`translate(${b.sx} ${b.sy})`}
              pointerEvents={pointe ? 'auto' : 'none'}
              role={pointe ? 'button' : undefined}
              tabIndex={pointe ? 0 : undefined}
              aria-label={pointe ? `Brin : ${texteBrin}. Y aller` : undefined}
              onClick={onBulleBrin}
              onKeyDown={(e) => { if (e.key === 'Enter') onBulleBrin() }}
            >
              <rect x={-l / 2} y={-200} width={l} height={30} rx={15} fill="#FBF8F1" stroke={salut ? '#E7B04A' : '#E2DACA'} strokeWidth={salut ? 2 : 1} />
              <path d="M -8 -171 L 0 -158 L 8 -171 Z" fill="#FBF8F1" />
              <text x={0} y={-180} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={13} fontWeight={salut ? 700 : 500} fill="#22301F">{texteBrin}</text>
            </g>
          </g>
        )
      })()}

      {/* Météo et ambiance : voiles, feuilles, neige */}
      {meteo !== 'soleil' && (
        <rect x={minX} y={minY} width={W} height={H} fill={meteo === 'brume' ? '#C6D1CD' : '#F0E8D4'} opacity={meteo === 'brume' ? 0.18 : 0.08} pointerEvents="none" />
      )}
      {ambiance.voile && <rect x={minX} y={minY} width={W} height={H} fill={ambiance.voile.couleur} opacity={ambiance.voile.opacite} pointerEvents="none" />}
      {ambiance.feuilles && (
        <g aria-hidden pointerEvents="none" className="feuilles-auto">
          {Array.from({ length: 8 }).map((_, i) => {
            const h = hache(i * 17 + 1, i * 7 + 5)
            const sx = minX + W * 0.2 + ((h % 1000) / 1000) * W * 0.6
            const col = ['#C96A41', '#E7B04A', '#B0512A'][h % 3]
            return <path key={i} className="feuille-auto" d="M0 0 q3 -4 6 0 q-3 4 -6 0 Z" fill={col} transform={`translate(${sx} ${minY + H * 0.3})`} style={{ animationDelay: `${(h % 50) / 10}s` }} />
          })}
        </g>
      )}
      {ambiance.neige && (
        <g aria-hidden pointerEvents="none" className="neige">
          {Array.from({ length: 16 }).map((_, i) => {
            const h = hache(i * 23 + 9, i * 11 + 2)
            return <circle key={i} className="flocon" cx={minX + ((h % 1000) / 1000) * W} cy={minY + H * 0.3} r={(h % 2) + 1.3} fill="#FBF8F1" style={{ animationDelay: `${(h % 60) / 10}s` }} />
          })}
        </g>
      )}
    </svg>
  )
}
