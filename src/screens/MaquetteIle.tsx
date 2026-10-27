import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATALOGUE } from '../domain/catalog'
import { COULEUR } from '../domain/couleurs'
import type { AgentTemplate, Domaine } from '../domain/types'
import { DOMAINE_LABEL } from '../domain/types'
import { Coeur } from '../island/Coeur'
import { Meuble, type MeubleId } from '../island/Meubles'
import { Poste } from '../island/Poste'
import { hache } from '../island/Paysage'
import { Arbre, BOIS, CREME, Flore, Pave, Toit, VERRE, nuance } from '../island/buildings/primitives'
import { TH, TW, iso, losange } from '../island/iso'
import '../design/tokens.css'
import '../island/island.css'
import './maquette-ile.css'

/**
 * Maquette « Mon île » façon Animal Crossing (dev, route /maquette-ile).
 * Une île entourée de mer, des maisons que l'on dispose où l'on veut
 * (Atelier, Spa, Jardin, Ma maison), Brin sur la place. On touche une maison :
 * le personnage y marche, la porte s'ouvre, on entre, et à l'intérieur les
 * agents IA travaillent à leur poste ; on va les voir, ils parlent.
 */

// ——— L'île ———————————————————————————————————————————————————————————

const CARTE = [
  '..............',
  '.....GGGGG....',
  '...GGGGGGGG...',
  '..GGGGGGGGGG..',
  '..GGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '.GGGGGGGGGGGG.',
  '..GGGGGGGGGGG.',
  '..GGGGGGGGGG..',
  '...GGGGGGGG...',
  '....GGGGG.....',
  '..............',
]

type Terrain = 'sable' | 'herbe'
interface TuileIle { x: number; y: number; terrain: Terrain }

const terre = (x: number, y: number) => CARTE[y]?.[x] === 'G'
const cle = (x: number, y: number) => `${x},${y}`

function construireIle(): TuileIle[] {
  const out: TuileIle[] = []
  CARTE.forEach((ligne, y) =>
    [...ligne].forEach((c, x) => {
      if (c !== 'G') return
      const bord = !terre(x - 1, y) || !terre(x + 1, y) || !terre(x, y - 1) || !terre(x, y + 1)
      out.push({ x, y, terrain: bord ? 'sable' : 'herbe' })
    }),
  )
  return out
}

/** Eau peu profonde : les tuiles de mer qui touchent la plage. */
function hautsFonds(): { x: number; y: number }[] {
  const out: { x: number; y: number }[] = []
  for (let y = -1; y <= CARTE.length; y++) {
    for (let x = -1; x <= CARTE[0].length; x++) {
      if (terre(x, y)) continue
      let voisin = false
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (terre(x + dx, y + dy)) voisin = true
      if (voisin) out.push({ x, y })
    }
  }
  return out
}

/** La place de Brin, au centre : trois tuiles sur trois, réservées. */
const PLACE = { x: 6, y: 6 }
const placeTuiles = new Set<string>()
for (let y = PLACE.y - 1; y <= PLACE.y + 1; y++) for (let x = PLACE.x - 1; x <= PLACE.x + 1; x++) placeTuiles.add(cle(x, y))

// ——— Les maisons ————————————————————————————————————————————————————————

type MaisonId = 'atelier' | 'spa' | 'jardin' | 'maison'
interface DefMaison {
  nom: string
  sousTitre: string
  domaine?: Domaine
  couleur: string
  toit: string
  mur: string
  /** Sol intérieur : deux teintes en damier. */
  sol: [string, string]
  murInt: string
}

const MAISONS: Record<MaisonId, DefMaison> = {
  atelier: { nom: 'L’Atelier', sousTitre: 'Ma boîte', domaine: 'boite', couleur: COULEUR.boite, toit: '#C46A3F', mur: '#F3E4CE', sol: ['#E8CDA8', '#DFBF96'], murInt: '#F3E6D2' },
  spa: { nom: 'Le Spa', sousTitre: 'Ma peau', domaine: 'peau', couleur: COULEUR.peau, toit: '#A96A8F', mur: '#F6EAF1', sol: ['#DCE9EA', '#CDE0E2'], murInt: '#F4E6ED' },
  jardin: { nom: 'Le Jardin', sousTitre: 'Ma planète', domaine: 'planete', couleur: COULEUR.planete, toit: '#4F8A55', mur: '#D9EBDC', sol: ['#B9DCA3', '#ACD399'], murInt: '#D8EAF3' },
  maison: { nom: 'Ma maison', sousTitre: 'Chez toi', couleur: '#E7B04A', toit: '#D9A24B', mur: '#F6ECD8', sol: ['#E3B99A', '#D9AA89'], murInt: '#F7EEDC' },
}
const ORDRE: MaisonId[] = ['atelier', 'spa', 'jardin', 'maison']

interface Ancre { x: number; y: number }
const POSITIONS_DEPART: Record<MaisonId, Ancre> = {
  atelier: { x: 2, y: 5 },
  spa: { x: 8, y: 2 },
  jardin: { x: 9, y: 8 },
  maison: { x: 4, y: 9 },
}

/** Emprise d'une maison : deux tuiles sur deux à partir de son ancre. */
const emprise = (a: Ancre) => [[a.x, a.y], [a.x + 1, a.y], [a.x, a.y + 1], [a.x + 1, a.y + 1]] as [number, number][]
/** Tuile devant la porte, où le personnage s'arrête. */
const devantPorte = (a: Ancre) => ({ x: a.x + 0.5, y: a.y + 1.95 })
const dansPorte = (a: Ancre) => ({ x: a.x + 0.5, y: a.y + 1.35 })

// ——— Les intérieurs ———————————————————————————————————————————————————————

const LARGEUR = 6
const PROFONDEUR = 5
const HAUTEUR_MUR = 70

interface Slot { x: number; y: number; ax: number; ay: number }
const SLOTS_CINQ: Slot[] = [
  { x: 0, y: 1, ax: 1, ay: 1 }, { x: 2, y: 0, ax: 2, ay: 1 }, { x: 4, y: 0, ax: 4, ay: 1 }, { x: 0, y: 3, ax: 1, ay: 3 }, { x: 5, y: 2, ax: 4, ay: 2 },
]
const SLOTS: Record<MaisonId, Slot[]> = {
  atelier: SLOTS_CINQ,
  spa: [...SLOTS_CINQ, { x: 5, y: 4, ax: 4, ay: 4 }],
  jardin: SLOTS_CINQ,
  maison: [],
}
const MEUBLES_INT: Record<MaisonId, { x: number; y: number; meuble: MeubleId }[]> = {
  atelier: [{ x: 0, y: 0, meuble: 'caisses' }, { x: 5, y: 0, meuble: 'etabli' }],
  spa: [{ x: 0, y: 0, meuble: 'plante' }, { x: 5, y: 0, meuble: 'transat' }],
  jardin: [{ x: 0, y: 0, meuble: 'ruche' }, { x: 5, y: 0, meuble: 'arbre-fruitier' }, { x: 5, y: 4, meuble: 'bac' }],
  maison: [{ x: 5, y: 3, meuble: 'plante' }],
}
/** Chez toi : le bureau du jour, où l'on relit ce que les agents ont préparé. */
const BUREAU_MAISON: Slot = { x: 5, y: 1, ax: 4, ay: 1 }
const ENTREE_INT = { x: 2.5, y: 4.4 }

/** Ce que chaque agent a préparé aujourd'hui (exemples de maquette). */
const EXEMPLES: Record<string, string> = {
  plume: 'J’ai préparé la facture de l’Atelier Garance : 480 €, conforme. Tu la relis et je l’envoie ?',
  'relance-douce': 'Studio Mésange a douze jours de retard. J’ai écrit une relance toute douce, tu veux la voir ?',
  vigie: 'Deux encaissements traînent ce mois-ci. Je t’ai trouvé une piste : le fonds de solidarité des indépendants.',
  'coussin-fiscal': 'Sur les 480 € encaissés, je mettrais 106 € de côté pour les cotisations. Je le fais ?',
  source: 'Trois grosses journées d’affilée… Je te propose de protéger jeudi matin. On le bloque ?',
  cloture: 'Il est 18 h 40. On range les tâches du jour et on coupe ?',
  regulateur: 'Semaine chargée. J’ai un message prêt pour décaler la livraison Garance au 3 novembre.',
  'compagnon-air': 'Deux heures dix devant l’écran. Une marche de quinze minutes, ça te dit ?',
  'anti-isolement': 'Un petit mot à Lina ? Ça fait trois semaines que vous ne vous êtes pas parlé.',
  miroir: 'Ta semaine : trois factures, un créneau calme tenu, un trajet en train. Pas mal, non ?',
  racine: 'La mission Garance, c’est 12 kg de CO₂e (train et numérique). Je l’ajoute à ton bilan ?',
  sobriete: 'Deux abonnements dorment : Figma (42 €) et un stockage cloud. On trie ?',
  deplacements: 'Lyon jeudi : le train de 7 h 04 arrive à 9 h, neuf kilos de CO₂e de moins que la voiture.',
  achats: 'Pour l’écran que tu regardes, j’ai trouvé un reconditionné à 210 €.',
}
const REPOS: Record<string, string> = {
  'don-impact': 'Rien à proposer pour l’instant : au prochain palier de chiffre d’affaires, je te suggérerai un petit don.',
  'label-vivant': 'Ton badge est à jour, trois trajets doux ce mois-ci. Je te préviens dès qu’il change.',
}

const agentsDe = (id: MaisonId): AgentTemplate[] => {
  const d = MAISONS[id].domaine
  return d ? CATALOGUE.filter((a) => a.domaine === d) : []
}

// ——— Le personnage ——————————————————————————————————————————————————————————

function Perso({ marche, versGauche }: { marche: boolean; versGauche: boolean }) {
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

interface Pos { x: number; y: number }

/** Déplace le personnage d'une tuile à l'autre, à vitesse constante. */
function useMarcheur(depart: Pos) {
  const [pos, setPos] = useState<Pos>(depart)
  const [enMarche, setEnMarche] = useState(false)
  const [versGauche, setVersGauche] = useState(false)
  const ref = useRef<Pos>(depart)
  const anim = useRef<number>(0)
  const apres = useRef<(() => void) | undefined>(undefined)

  const arreter = () => {
    cancelAnimationFrame(anim.current)
    apres.current = undefined
  }

  const poser = useCallback((p: Pos) => {
    arreter()
    ref.current = p
    setPos(p)
    setEnMarche(false)
  }, [])

  const aller = useCallback((vers: Pos, ensuite?: () => void) => {
    arreter()
    const de = ref.current
    const dist = Math.hypot(vers.x - de.x, vers.y - de.y)
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (dist < 0.05 || reduit) {
      poser(vers)
      ensuite?.()
      return
    }
    setVersGauche(vers.x - vers.y < de.x - de.y)
    setEnMarche(true)
    apres.current = ensuite
    const duree = Math.max(220, (dist / 3.4) * 1000)
    const t0 = performance.now()
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / duree)
      const p = { x: de.x + (vers.x - de.x) * k, y: de.y + (vers.y - de.y) * k }
      ref.current = p
      setPos(p)
      if (k < 1) anim.current = requestAnimationFrame(pas)
      else {
        setEnMarche(false)
        const fin = apres.current
        apres.current = undefined
        fin?.()
      }
    }
    anim.current = requestAnimationFrame(pas)
  }, [poser])

  useEffect(() => () => cancelAnimationFrame(anim.current), [])
  return { pos, enMarche, versGauche, aller, poser }
}

// ——— Dessin d'une maison ——————————————————————————————————————————————————————

const P = (fx: number, fy: number, fz: number) => `${(fx - fy) * TW},${(fx + fy) * TH - fz}`

function MaisonIle({ id, porteOuverte, enMain }: { id: MaisonId; porteOuverte: boolean; enMain: boolean }) {
  const M = MAISONS[id]
  const w = 0.78, d = 0.78, h = 30
  const verre = id === 'jardin'
  const porte = `${P(-0.26, d, 0)} ${P(0.1, d, 0)} ${P(0.1, d, 19)} ${P(-0.26, d, 19)}`
  const fenetreG = `${P(0.3, d, 11)} ${P(0.62, d, 11)} ${P(0.62, d, 23)} ${P(0.3, d, 23)}`
  const fenetreD = `${P(w, -0.55, 11)} ${P(w, -0.15, 11)} ${P(w, -0.15, 24)} ${P(w, -0.55, 24)}`
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}`}>
      <ellipse cx={10} cy={8} rx={TW * 1.3} ry={TH * 1.3} fill="rgba(34,48,31,.16)" />
      {/* Dalle autour de la maison */}
      <polygon points={`${P(-1.05, -1.05, 0)} ${P(1.05, -1.05, 0)} ${P(1.05, 1.05, 0)} ${P(-1.05, 1.05, 0)}`} fill="#E9DCC0" opacity={0.9} />
      {/* Corps : murs clairs, ou verrière pour le Jardin */}
      <g opacity={verre ? 0.82 : 1}>
        <Pave w={w} d={d} h={h} couleur={verre ? VERRE : M.mur} haut={verre ? nuance(VERRE, 0.2) : M.mur} />
      </g>
      {verre && (
        <g stroke="#FBF8F1" strokeWidth={1} opacity={0.8}>
          <line x1={(-0.3 - d) * TW} y1={(-0.3 + d) * TH} x2={(-0.3 - d) * TW} y2={(-0.3 + d) * TH - h} />
          <line x1={(0.3 - d) * TW} y1={(0.3 + d) * TH} x2={(0.3 - d) * TW} y2={(0.3 + d) * TH - h} />
          <line x1={(w + 0.3) * TW} y1={(w - 0.3) * TH} x2={(w + 0.3) * TW} y2={(w - 0.3) * TH - h} />
          <line x1={(w - 0.3) * TW} y1={(w + 0.3) * TH} x2={(w - 0.3) * TW} y2={(w + 0.3) * TH - h} />
        </g>
      )}
      {/* Bardage bas */}
      <polygon points={`${P(-w, d, 0)} ${P(w, d, 0)} ${P(w, d, 5)} ${P(-w, d, 5)}`} fill={nuance(M.toit, 0.1)} opacity={0.7} />
      <polygon points={`${P(w, d, 0)} ${P(w, -d, 0)} ${P(w, -d, 5)} ${P(w, d, 5)}`} fill={nuance(M.toit, -0.1)} opacity={0.7} />
      {/* Porte : l'intérieur sombre, puis le battant qui s'ouvre */}
      <polygon points={porte} fill="#2E2520" />
      <polygon className={`porte${porteOuverte ? ' porte-ouverte' : ''}`} points={porte} fill={nuance(BOIS, -0.08)} stroke={nuance(BOIS, -0.3)} strokeWidth={0.8} />
      <circle cx={(0.03 - d) * TW} cy={(0.03 + d) * TH - 9.5} r={1.1} fill="#E7B04A" />
      {/* Fenêtres */}
      <polygon points={fenetreG} fill={VERRE} stroke={CREME} strokeWidth={1.4} />
      <polygon points={fenetreD} fill={VERRE} stroke={CREME} strokeWidth={1.4} />
      <path d={`M ${P(0.46, d, 11)} L ${P(0.46, d, 23)}`} stroke={CREME} strokeWidth={0.9} />
      <path d={`M ${P(w, -0.35, 11)} L ${P(w, -0.35, 24)}`} stroke={CREME} strokeWidth={0.9} />
      {/* Jardinière sous la fenêtre */}
      <g transform={`translate(${(0.46 - d) * TW} ${(0.46 + d) * TH - 10})`}>
        <rect x={-6} y={0} width={12} height={3} rx={1} fill={nuance(BOIS, -0.1)} />
        <circle cx={-3} cy={-1} r={1.8} fill="#D98BA9" />
        <circle cx={1} cy={-2} r={1.8} fill="#E7B04A" />
        <circle cx={4} cy={-1} r={1.6} fill="#5E9B62" />
      </g>
      {/* Toit */}
      <Toit w={1.0} d={1.0} z={h} h={22} couleur={M.toit} faitage={0.42} vegetal={id === 'jardin'} solaire={id === 'maison'} />
      {/* Signes distinctifs */}
      {id === 'atelier' && (
        <g transform={`translate(${(0.5 + 0.35) * TW} ${(0.5 - 0.35) * TH - h - 14})`}>
          <Pave w={0.07} d={0.07} h={12} couleur="#B8A48A" />
          <g className="fumee" fill="#F5F0E3" opacity={0.8}>
            <circle cx={0} cy={-16} r={2.4} />
            <circle cx={2} cy={-22} r={3} />
            <circle cx={-1} cy={-29} r={3.6} />
          </g>
        </g>
      )}
      {id === 'spa' && (
        <g transform={`translate(${(0.5 + 0.3) * TW} ${(0.5 - 0.3) * TH - h - 16})`}>
          <Pave w={0.09} d={0.09} h={8} couleur="#D9C4D0" />
          <g className="vapeur" stroke="#FBF8F1" strokeWidth={1.6} fill="none" strokeLinecap="round" opacity={0.85}>
            <path d="M -4 -12 q 2 -4 0 -8 q -2 -4 0 -8" />
            <path d="M 0 -14 q 2 -4 0 -8 q -2 -4 0 -8" />
            <path d="M 4 -12 q 2 -4 0 -8 q -2 -4 0 -8" />
          </g>
        </g>
      )}
      {id === 'maison' && (
        <g transform={`translate(${(-0.62 - d - 0.3) * TW} ${(-0.62 + d + 0.3) * TH})`}>
          <line x1={0} y1={0} x2={0} y2={-14} stroke={nuance(BOIS, -0.2)} strokeWidth={1.6} />
          <rect x={-4.5} y={-21} width={9} height={7} rx={2} fill="#E7B04A" />
          <rect x={-2} y={-19} width={4} height={1.4} fill="#FBF8F1" />
        </g>
      )}
      {id === 'jardin' && (
        <g>
          <Flore type={2} dx={-0.95} dy={0.75} />
          <Flore type={2} dx={0.75} dy={-0.95} />
        </g>
      )}
      {/* Paillasson devant la porte */}
      <polygon points={`${P(-0.3, d + 0.15, 0)} ${P(0.14, d + 0.15, 0)} ${P(0.14, d + 0.42, 0)} ${P(-0.3, d + 0.42, 0)}`} fill="#C9A06A" opacity={0.9} />
    </g>
  )
}

function Enseigne({ id, attente }: { id: MaisonId; attente: number }) {
  const M = MAISONS[id]
  const l = M.nom.length * 7.6 + 30
  return (
    <g className="enseigne" transform="translate(0 -74)" aria-hidden>
      <rect x={-l / 2} y={-12} width={l} height={24} rx={12} fill="#FBF8F1" stroke="#E2DACA" />
      <circle cx={-l / 2 + 12} cy={0} r={4} fill={M.couleur} />
      <text x={5} y={4.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={12.5} fontWeight={700} fill="#22301F">{M.nom}</text>
      {attente > 0 && (
        <g transform={`translate(${l / 2 - 2} -10)`}>
          <circle r={8} fill="#E7B04A" stroke="#FBF8F1" strokeWidth={1.5} />
          <text y={3.5} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={10} fontWeight={700} fill="#22301F">{attente}</text>
        </g>
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

// ——— Intérieur ———————————————————————————————————————————————————————————————

/** Coin de tuile (demi-entiers) avec une hauteur, en coordonnées écran. */
const C = (cx: number, cy: number, z = 0) => `${(cx - cy) * TW},${(cx + cy) * TH - z}`

function Lit() {
  return (
    <g>
      <Pave dy={0.5} w={0.34} d={0.78} h={6} couleur={BOIS} haut={nuance(BOIS, 0.1)} />
      <Pave dy={0.5} w={0.3} d={0.72} h={6} z={6} couleur="#EAD9C4" haut="#F4EAD5" />
      <Pave dy={-0.1} w={0.26} d={0.14} h={4} z={12} couleur="#FBF8F1" haut="#FFFFFF" />
      <polygon points={`${P(-0.3, 0.1, 12)} ${P(0.3, 0.1, 12)} ${P(0.3, 1.2, 12)} ${P(-0.3, 1.2, 12)}`} fill="#9C5B7F" opacity={0.85} />
      {/* Le chat, roulé en boule */}
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
      {/* Tableau au mur, derrière : les propositions épinglées */}
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

interface PropsInterieur {
  id: MaisonId
  agents: AgentTemplate[]
  perso: Pos
  enMarche: boolean
  versGauche: boolean
  attente: Set<string>
  onAgent: (a: AgentTemplate, slot: Slot) => void
  onBureau: () => void
  onSortir: () => void
}

function Interieur({ id, agents, perso, enMarche, versGauche, attente, onAgent, onBureau, onSortir }: PropsInterieur) {
  const M = MAISONS[id]
  const verre = id === 'jardin'
  const tuiles: { x: number; y: number }[] = []
  for (let y = 0; y < PROFONDEUR; y++) for (let x = 0; x < LARGEUR; x++) tuiles.push({ x, y })

  const murGauche = `${C(-0.5, -0.5, HAUTEUR_MUR)} ${C(-0.5, -0.5)} ${C(-0.5, PROFONDEUR - 0.5)} ${C(-0.5, PROFONDEUR - 0.5, HAUTEUR_MUR)}`
  const murDroit = `${C(-0.5, -0.5, HAUTEUR_MUR)} ${C(-0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5, HAUTEUR_MUR)}`
  const fenetre = `${C(2.2, -0.5, 24)} ${C(3.8, -0.5, 24)} ${C(3.8, -0.5, 52)} ${C(2.2, -0.5, 52)}`
  const cadre = `${C(-0.5, 1.2, 30)} ${C(-0.5, 2.2, 30)} ${C(-0.5, 2.2, 48)} ${C(-0.5, 1.2, 48)}`

  type ObjetInt =
    | { type: 'meuble'; x: number; y: number; meuble: MeubleId }
    | { type: 'agent'; x: number; y: number; agent: AgentTemplate; slot: Slot }
    | { type: 'perso'; x: number; y: number }
    | { type: 'lit' | 'etagere' | 'cuisine' | 'bureau'; x: number; y: number }
  const objets: ObjetInt[] = [
    ...MEUBLES_INT[id].map((m) => ({ type: 'meuble' as const, ...m })),
    ...agents.map((a, i) => ({ type: 'agent' as const, x: SLOTS[id][i].x, y: SLOTS[id][i].y, agent: a, slot: SLOTS[id][i] })),
    { type: 'perso', x: perso.x, y: perso.y },
  ]
  if (id === 'maison') objets.push({ type: 'lit', x: 0, y: 1 }, { type: 'etagere', x: 2, y: 0 }, { type: 'cuisine', x: 4, y: 0 }, { type: 'bureau', x: BUREAU_MAISON.x, y: BUREAU_MAISON.y })
  objets.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x)

  const vb = { x: -(PROFONDEUR + 0.5) * TW - 40, y: -HAUTEUR_MUR - 46, w: (LARGEUR + PROFONDEUR + 1) * TW + 80, h: HAUTEUR_MUR + (LARGEUR + PROFONDEUR) * TH + 100 }

  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={`Intérieur : ${M.nom}`}>
      <defs>
        <linearGradient id="mi-ciel-fenetre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE5F1" />
          <stop offset="1" stopColor="#F6E6C2" />
        </linearGradient>
        <pattern id="mi-papier" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx={5} cy={5} r={0.9} fill="rgba(34,48,31,.07)" />
        </pattern>
      </defs>
      {/* Murs du fond */}
      <polygon points={murGauche} fill={verre ? '#D8EAF3' : M.murInt} />
      <polygon points={murDroit} fill={verre ? '#CFE3EE' : nuance(M.murInt, -0.06)} />
      {verre ? (
        <g>
          <polygon points={murGauche} fill={VERRE} opacity={0.5} />
          <polygon points={murDroit} fill={VERRE} opacity={0.5} />
          <g stroke="#FBF8F1" strokeWidth={1.4} opacity={0.9}>
            {[1, 2.5, 4].map((v) => <line key={`g${v}`} x1={(-0.5 - v) * TW} y1={(-0.5 + v) * TH} x2={(-0.5 - v) * TW} y2={(-0.5 + v) * TH - HAUTEUR_MUR} />)}
            {[1, 4.5].map((v) => <line key={`d${v}`} x1={(v + 0.5) * TW} y1={(v - 0.5) * TH} x2={(v + 0.5) * TW} y2={(v - 0.5) * TH - HAUTEUR_MUR} />)}
            <path d={`M ${C(-0.5, -0.5, 40)} L ${C(-0.5, PROFONDEUR - 0.5, 40)} M ${C(-0.5, -0.5, 40)} L ${C(LARGEUR - 0.5, -0.5, 40)}`} />
          </g>
          <circle cx={(-0.5 - 3.6) * TW + 8} cy={(-0.5 + 3.6) * TH - 52} r={9} fill="#F3C66A" opacity={0.9} />
        </g>
      ) : (
        <g>
          <polygon points={murGauche} fill="url(#mi-papier)" />
          <polygon points={murDroit} fill="url(#mi-papier)" />
          {/* Fenêtre sur le mur droit, et un cadre sur le mur gauche */}
          <polygon points={fenetre} fill="url(#mi-ciel-fenetre)" stroke={CREME} strokeWidth={2.4} />
          <circle cx={(3.3 + 0.5) * TW} cy={(3.3 - 0.5) * TH - 44} r={5} fill="#F3C66A" />
          <path d={`M ${C(3, -0.5, 24)} L ${C(3, -0.5, 52)} M ${C(2.2, -0.5, 38)} L ${C(3.8, -0.5, 38)}`} stroke={CREME} strokeWidth={1.6} />
          <polygon points={cadre} fill="#F4EAD5" stroke={nuance(BOIS, -0.1)} strokeWidth={1.8} />
          <ellipse cx={(-0.5 - 1.7) * TW} cy={(-0.5 + 1.7) * TH - 38} rx={9} ry={4.5} fill="#8DBF85" />
          <circle cx={(-0.5 - 1.7) * TW + 3} cy={(-0.5 + 1.7) * TH - 44} r={3} fill="#2F7A5C" />
        </g>
      )}
      {/* Plinthes */}
      <polygon points={`${C(-0.5, -0.5, 4)} ${C(-0.5, -0.5)} ${C(-0.5, PROFONDEUR - 0.5)} ${C(-0.5, PROFONDEUR - 0.5, 4)}`} fill={nuance(M.sol[1], -0.2)} />
      <polygon points={`${C(-0.5, -0.5, 4)} ${C(-0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5, 4)}`} fill={nuance(M.sol[1], -0.3)} />

      {/* Sol en damier */}
      <g>
        {tuiles.map((t) => (
          <polygon key={cle(t.x, t.y)} points={losange(t.x, t.y)} fill={M.sol[(t.x + t.y) % 2]} stroke="rgba(255,255,255,.35)" strokeWidth={0.6} />
        ))}
      </g>
      {/* Le tapis du Spa : un petit bassin au milieu */}
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
      {/* Paillasson de sortie */}
      <g
        className="paillasson"
        transform={`translate(${iso(ENTREE_INT.x, ENTREE_INT.y + 0.1).sx} ${iso(ENTREE_INT.x, ENTREE_INT.y + 0.1).sy})`}
        role="button"
        tabIndex={0}
        aria-label="Sortir de la maison"
        onClick={onSortir}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSortir() } }}
      >
        <polygon points={`${P(-0.42, 0, 0)} ${P(0, -0.42, 0)} ${P(0.42, 0, 0)} ${P(0, 0.42, 0)}`} fill="#C9A06A" />
        <path d={`M ${P(-0.3, 0, 0)} L ${P(0.12, -0.42, 0)} M ${P(-0.12, 0.42, 0)} L ${P(0.3, 0, 0)}`} stroke="#B48A56" strokeWidth={1.2} />
        <text y={20} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={10} fontWeight={700} fill="#4F5A49">Sortir ↓</text>
      </g>

      {/* Mobilier, agents et personnage, de l'arrière vers l'avant */}
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
                <BureauJour attente={Math.min(3, attente.size)} />
              </g>
            )
          case 'agent': {
            const enAttente = attente.has(o.agent.id)
            return (
              <g key={o.agent.id} transform={t} className="cible" role="button" tabIndex={0} aria-label={`Aller voir ${o.agent.nom}`}
                onClick={() => onAgent(o.agent, o.slot)} onKeyDown={(e) => { if (e.key === 'Enter') onAgent(o.agent, o.slot) }}>
                <polygon points={losange(0, 0)} fill="transparent" />
                <g transform="scale(1.2)">
                  <Poste id={o.agent.poste} domaine={o.agent.domaine} couleur={COULEUR[o.agent.domaine]} niveau={2} phase={(hache(o.x, o.y) % 20) / 10} />
                </g>
                {enAttente && (
                  <g className="signe-vie" aria-hidden>
                    <g className="signe-point" transform="translate(0 -62)">
                      <circle r={7} fill="#E7B04A" opacity={0.95} />
                      <text y={4} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={11} fontWeight={700} fill="#22301F">!</text>
                    </g>
                  </g>
                )}
              </g>
            )
          }
          case 'perso':
            return <g key="perso" transform={`${t} scale(1.1)`}><Perso marche={enMarche} versGauche={versGauche} /></g>
        }
      })}
    </svg>
  )
}

// ——— L'écran ———————————————————————————————————————————————————————————————

type Mode = 'visite' | 'disposer'
type Phase = null | 'porte' | 'iris-ferme' | 'iris-ouvre'
type Dialogue =
  | { type: 'agent'; agent: AgentTemplate }
  | { type: 'brin' }
  | { type: 'bureau' }
  | { type: 'info'; texte: string }

export function MaquetteIle() {
  const tuiles = useMemo(construireIle, [])
  const fonds = useMemo(hautsFonds, [])
  const index = useMemo(() => new Map(tuiles.map((t) => [cle(t.x, t.y), t])), [tuiles])

  const [maisons, setMaisons] = useState<Record<MaisonId, Ancre>>(POSITIONS_DEPART)
  const [mode, setMode] = useState<Mode>('visite')
  const [enMain, setEnMain] = useState<MaisonId | null>(null)
  const [vue, setVue] = useState<'ile' | 'interieur'>('ile')
  const [maisonCourante, setMaisonCourante] = useState<MaisonId | null>(null)
  const [transition, setTransition] = useState<{ maison: MaisonId; sens: 'entrer' | 'sortir' } | null>(null)
  const [phase, setPhase] = useState<Phase>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  const [validees, setValidees] = useState<Set<string>>(() => new Set())
  const [bulleBrin, setBulleBrin] = useState(true)
  const { pos, enMarche, versGauche, aller, poser } = useMarcheur({ x: 5, y: 8 })

  // Propositions en attente : tout agent qui a un exemple et n'a pas été validé.
  const attente = useMemo(() => new Set(CATALOGUE.filter((a) => EXEMPLES[a.id] && !validees.has(a.id)).map((a) => a.id)), [validees])
  const attenteMaison = (id: MaisonId) => agentsDe(id).filter((a) => attente.has(a.id)).length

  // Tuiles occupées par les maisons et la place.
  const occupees = useMemo(() => {
    const s = new Set<string>(placeTuiles)
    ORDRE.forEach((id) => emprise(maisons[id]).forEach(([x, y]) => s.add(cle(x, y))))
    return s
  }, [maisons])

  // Une maison se pose sur de l'herbe, à une tuile au moins des autres et de la place : la porte reste dégagée.
  const peutPoser = useCallback((id: MaisonId, a: Ancre) => {
    const autres = new Set<string>(placeTuiles)
    ORDRE.filter((m) => m !== id).forEach((m) =>
      emprise(maisons[m]).forEach(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) autres.add(cle(x + dx, y + dy))
      }),
    )
    return emprise(a).every(([x, y]) => index.get(cle(x, y))?.terrain === 'herbe' && !autres.has(cle(x, y)))
  }, [maisons, index])

  // Chemins de la place vers chaque porte : des pas japonais.
  const chemins = useMemo(() => {
    const pas = new Set<string>()
    ORDRE.forEach((id) => {
      const a = maisons[id]
      const de = { x: a.x, y: a.y + 2 }
      const vers = PLACE
      const n = Math.max(Math.abs(vers.x - de.x), Math.abs(vers.y - de.y))
      for (let i = 0; i <= n; i++) {
        const x = Math.round(de.x + ((vers.x - de.x) * i) / n)
        const y = Math.round(de.y + ((vers.y - de.y) * i) / n)
        if (!occupees.has(cle(x, y)) && index.has(cle(x, y))) pas.add(cle(x, y))
      }
    })
    return [...pas].map((k) => k.split(',').map(Number) as [number, number])
  }, [maisons, occupees, index])

  // Transitions : porte qui s'ouvre, iris qui se ferme, changement de vue, iris qui s'ouvre.
  useEffect(() => {
    if (!phase) return
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const duree = reduit ? 40 : phase === 'porte' ? 300 : 520
    const t = setTimeout(() => {
      if (phase === 'porte') setPhase('iris-ferme')
      else if (phase === 'iris-ferme') {
        if (transition?.sens === 'entrer') {
          setVue('interieur')
          setMaisonCourante(transition.maison)
          poser(ENTREE_INT)
        } else if (transition?.sens === 'sortir') {
          setVue('ile')
          setMaisonCourante(null)
          poser(devantPorte(maisons[transition.maison]))
        }
        setPhase('iris-ouvre')
      } else if (phase === 'iris-ouvre') {
        setPhase(null)
        setTransition(null)
      }
    }, duree)
    return () => clearTimeout(t)
  }, [phase, transition, maisons, poser])

  const occupe = phase !== null

  const toucherMaison = (id: MaisonId) => {
    if (occupe) return
    setDialogue(null)
    setBulleBrin(false)
    if (mode === 'disposer') {
      setEnMain(enMain === id ? null : id)
      return
    }
    const a = maisons[id]
    aller(devantPorte(a), () => {
      setTransition({ maison: id, sens: 'entrer' })
      setPhase('porte')
      aller(dansPorte(a))
    })
  }

  const toucherTuile = (x: number, y: number) => {
    if (mode !== 'disposer' || !enMain) return
    const a = { x, y }
    if (peutPoser(enMain, a)) {
      setMaisons({ ...maisons, [enMain]: a })
      setEnMain(null)
    } else {
      setDialogue({ type: 'info', texte: 'Pas ici : il faut deux tuiles sur deux d’herbe, sans empiéter sur une autre maison ni sur la place.' })
    }
  }

  const sortir = () => {
    if (occupe || !maisonCourante) return
    setDialogue(null)
    aller(ENTREE_INT, () => {
      setTransition({ maison: maisonCourante, sens: 'sortir' })
      setPhase('iris-ferme')
    })
  }

  const voirAgent = (a: AgentTemplate, slot: Slot) => {
    if (occupe) return
    setDialogue(null)
    aller({ x: slot.ax, y: slot.ay }, () => setDialogue({ type: 'agent', agent: a }))
  }

  const voirBureau = () => {
    if (occupe) return
    setDialogue(null)
    aller({ x: BUREAU_MAISON.ax, y: BUREAU_MAISON.ay }, () => setDialogue({ type: 'bureau' }))
  }

  const parlerBrin = () => {
    if (occupe || mode === 'disposer') return
    setBulleBrin(false)
    setDialogue(null)
    aller({ x: PLACE.x + 0.2, y: PLACE.y + 1.4 }, () => setDialogue({ type: 'brin' }))
  }

  const valider = (id: string) => {
    setValidees((v) => new Set(v).add(id))
    setDialogue(null)
  }

  // ——— Cadre de l'île ———
  // L'île tient dans la largeur du téléphone ; au-dessus et au-dessous, la mer.
  const marge = 22
  const etendue = tuiles.reduce(
    (b, t) => {
      const { sx, sy } = iso(t.x, t.y)
      return { minX: Math.min(b.minX, sx - TW), maxX: Math.max(b.maxX, sx + TW), minY: Math.min(b.minY, sy - TH), maxY: Math.max(b.maxY, sy + TH + 14) }
    },
    { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity },
  )
  // Les pointes de plage à gauche et à droite peuvent déborder : l'île gagne en taille.
  const W = (etendue.maxX - etendue.minX) * 0.84 + marge * 2
  const minX = (etendue.minX + etendue.maxX) / 2 - W / 2
  const H = W * 2
  const minY = (etendue.minY + etendue.maxY) / 2 - H * 0.47
  const sortedTuiles = [...tuiles].sort((a, b) => a.x + a.y - (b.x + b.y))

  type ObjetIle =
    | { type: 'maison'; id: MaisonId; x: number; y: number }
    | { type: 'brin'; x: number; y: number }
    | { type: 'flore'; x: number; y: number; variante: number; terrain: Terrain }
    | { type: 'perso'; x: number; y: number }
  const cheminsSet = new Set(chemins.map(([x, y]) => cle(x, y)))
  const objets: ObjetIle[] = [
    ...ORDRE.map((id) => ({ type: 'maison' as const, id, x: maisons[id].x + 1, y: maisons[id].y + 1 })),
    { type: 'brin', x: PLACE.x, y: PLACE.y },
    ...tuiles
      .filter((t) => !occupees.has(cle(t.x, t.y)) && !cheminsSet.has(cle(t.x, t.y)))
      .filter((t) => (t.terrain === 'herbe' ? hache(t.x, t.y) % 11 < 3 : hache(t.x, t.y) % 7 < 2))
      .map((t) => ({ type: 'flore' as const, x: t.x, y: t.y, variante: hache(t.x, t.y) >> 3, terrain: t.terrain })),
  ]
  if (vue === 'ile') objets.push({ type: 'perso', x: pos.x, y: pos.y })
  objets.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x)

  const bords = sortedTuiles.flatMap((t) => {
    const out: { t: TuileIle; cote: 'g' | 'd' }[] = []
    if (!terre(t.x, t.y + 1)) out.push({ t, cote: 'g' })
    if (!terre(t.x + 1, t.y)) out.push({ t, cote: 'd' })
    return out
  })

  const nomCourant = maisonCourante ? MAISONS[maisonCourante] : null
  const agentsCourants = maisonCourante ? agentsDe(maisonCourante) : []
  const pendantes = CATALOGUE.filter((a) => attente.has(a.id))

  return (
    <div className="mi-page">
      <div className="mi-cadre">
        <div className="mi-scene" aria-live="polite">
          {vue === 'ile' ? (
            <svg viewBox={`${minX} ${minY} ${W} ${H}`} preserveAspectRatio="xMidYMid slice" role="img" aria-label="Mon île">
              <defs>
                <linearGradient id="mi-mer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#8FCBC9" />
                  <stop offset="1" stopColor="#6FB3B8" />
                </linearGradient>
                <radialGradient id="mi-soleil" cx="0.5" cy="0.5" r="0.5">
                  <stop offset="0" stopColor="#FBEFC9" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#FBEFC9" stopOpacity="0" />
                </radialGradient>
              </defs>
              <rect x={minX} y={minY} width={W} height={H} fill="url(#mi-mer)" />
              {/* Vaguelettes qui dérivent */}
              <g className="mi-vagues" stroke="#FBF8F1" strokeWidth={1.6} strokeLinecap="round" opacity={0.55} fill="none">
                {Array.from({ length: 14 }).map((_, i) => {
                  const h = hache(i * 31 + 5, i * 17 + 11)
                  const x = minX + ((h % 1000) / 1000) * W
                  const y = minY + (((h >> 10) % 1000) / 1000) * H
                  return <path key={i} d={`M ${x} ${y} q 6 -3 12 0 q 6 3 12 0`} style={{ animationDelay: `${(h % 40) / 10}s` }} />
                })}
              </g>
              {/* Hauts-fonds autour de la plage */}
              <g>
                {fonds.map((f) => (
                  <polygon key={cle(f.x, f.y)} points={losange(f.x, f.y)} fill="#B9E0DC" opacity={0.75} />
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
              {/* Sol : plage et herbe en damier doux */}
              <g>
                {sortedTuiles.map((t) => (
                  <polygon
                    key={cle(t.x, t.y)}
                    points={losange(t.x, t.y)}
                    fill={t.terrain === 'sable' ? ((t.x + t.y) % 2 ? '#F1E1B5' : '#EDDBAC') : (t.x + t.y) % 2 ? '#A9D18E' : '#9FCB84'}
                    stroke={t.terrain === 'sable' ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.18)'}
                    strokeWidth={0.6}
                    className={mode === 'disposer' && enMain ? 'mi-tuile-posable' : undefined}
                    onClick={() => toucherTuile(t.x, t.y)}
                  />
                ))}
              </g>
              {/* La place, pavée en rond, et les pas japonais */}
              <g aria-hidden>
                <ellipse cx={iso(PLACE.x, PLACE.y).sx} cy={iso(PLACE.x, PLACE.y).sy} rx={TW * 1.75} ry={TH * 1.75} fill="#E9DCC0" />
                <ellipse cx={iso(PLACE.x, PLACE.y).sx} cy={iso(PLACE.x, PLACE.y).sy} rx={TW * 1.45} ry={TH * 1.45} fill="none" stroke="#DCCBA4" strokeWidth={2} strokeDasharray="6 5" />
                {chemins.map(([x, y]) => {
                  const { sx, sy } = iso(x, y)
                  return <ellipse key={cle(x, y)} cx={sx} cy={sy} rx={TW * 0.42} ry={TH * 0.42} fill="#E6D3A8" stroke="#DCC89A" strokeWidth={0.8} />
                })}
              </g>
              <ellipse cx={iso(6, 6).sx} cy={iso(6, 6).sy} rx={W * 0.32} ry={H * 0.26} fill="url(#mi-soleil)" pointerEvents="none" />

              {/* Disposition : emprises valides en pointillé pour la maison en main */}
              {mode === 'disposer' && enMain && (
                <g className="mi-emprises" pointerEvents="none">
                  {tuiles.filter((t) => peutPoser(enMain, t)).map((t) => {
                    const { sx, sy } = iso(t.x, t.y)
                    return <circle key={cle(t.x, t.y)} cx={sx} cy={sy} r={3.4} fill="#FBF8F1" stroke="#5E9B62" strokeWidth={1.2} opacity={0.95} />
                  })}
                  <polygon points={`${iso(maisons[enMain].x, maisons[enMain].y).sx},${iso(maisons[enMain].x, maisons[enMain].y).sy - TH} ${iso(maisons[enMain].x + 1, maisons[enMain].y).sx + TW},${iso(maisons[enMain].x + 1, maisons[enMain].y).sy} ${iso(maisons[enMain].x + 1, maisons[enMain].y + 1).sx},${iso(maisons[enMain].x + 1, maisons[enMain].y + 1).sy + TH} ${iso(maisons[enMain].x, maisons[enMain].y + 1).sx - TW},${iso(maisons[enMain].x, maisons[enMain].y + 1).sy}`} fill="none" stroke="#FBF8F1" strokeWidth={2} strokeDasharray="5 4" />
                </g>
              )}

              {/* Objets, de l'arrière vers l'avant */}
              <g>
                {objets.map((o) => {
                  const { sx, sy } = iso(o.x, o.y)
                  if (o.type === 'maison') {
                    const centre = iso(maisons[o.id].x + 0.5, maisons[o.id].y + 0.5)
                    const porteOuverte = transition?.maison === o.id && (phase === 'porte' || phase === 'iris-ferme')
                    return (
                      <g key={o.id} transform={`translate(${centre.sx} ${centre.sy})`} className="cible" role="button" tabIndex={0}
                        aria-label={mode === 'disposer' ? `${MAISONS[o.id].nom} : toucher pour la prendre, puis une tuile pour la poser` : `Entrer dans ${MAISONS[o.id].nom}`}
                        onClick={() => toucherMaison(o.id)} onKeyDown={(e) => { if (e.key === 'Enter') toucherMaison(o.id) }}>
                        <MaisonIle id={o.id} porteOuverte={porteOuverte} enMain={enMain === o.id} />
                      </g>
                    )
                  }
                  if (o.type === 'brin') {
                    return (
                      <g key="brin" transform={`translate(${sx} ${sy})`} className="coeur-brin cible" role="button" tabIndex={0} aria-label="Parler à Brin"
                        onClick={parlerBrin} onKeyDown={(e) => { if (e.key === 'Enter') parlerBrin() }}>
                        <g transform="scale(1.35)">
                          <ellipse className="coeur-halo" cx={0} cy={2} rx={30} ry={15} fill="none" stroke="#E7B04A" strokeWidth={1.5} />
                          <Coeur />
                          <rect x={-32} y={-80} width={64} height={92} fill="transparent" />
                        </g>
                      </g>
                    )
                  }
                  if (o.type === 'flore') {
                    const v = o.variante
                    return (
                      <g key={`f${o.x},${o.y}`} transform={`translate(${sx} ${sy})`} aria-hidden>
                        {o.terrain === 'sable'
                          ? v % 3 === 0 ? <Palmier variante={v} /> : <Rocher variante={v} />
                          : v % 4 === 0 ? <Arbre r={10 + (v % 4)} tronc={9} couleur={v % 2 ? '#6FA56B' : '#5E9B62'} /> : <Flore type={v} />}
                      </g>
                    )
                  }
                  return <g key="perso" transform={`translate(${sx} ${sy}) scale(1.05)`}><Perso marche={enMarche} versGauche={versGauche} /></g>
                })}
              </g>
              {/* Enseignes au-dessus des toits */}
              <g pointerEvents="none">
                {ORDRE.map((id) => {
                  const c = iso(maisons[id].x + 0.5, maisons[id].y + 0.5)
                  return (
                    <g key={id} transform={`translate(${c.sx} ${c.sy})`}>
                      <Enseigne id={id} attente={attenteMaison(id)} />
                    </g>
                  )
                })}
                {bulleBrin && mode === 'visite' && (
                  <g className="coeur-bulle" transform={`translate(${iso(PLACE.x, PLACE.y).sx} ${iso(PLACE.x, PLACE.y).sy})`} aria-hidden>
                    <rect x={-92} y={-200} width={184} height={30} rx={15} fill="#FBF8F1" stroke="#E2DACA" />
                    <path d="M -8 -171 L 0 -158 L 8 -171 Z" fill="#FBF8F1" />
                    <text x={0} y={-180} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={13} fontWeight={500} fill="#22301F">Touche une maison pour entrer</text>
                  </g>
                )}
              </g>
            </svg>
          ) : (
            maisonCourante && (
              <div className="mi-interieur" style={{ ['--mur' as string]: MAISONS[maisonCourante].murInt }}>
                <Interieur
                  id={maisonCourante}
                  agents={agentsCourants}
                  perso={pos}
                  enMarche={enMarche}
                  versGauche={versGauche}
                  attente={attente}
                  onAgent={voirAgent}
                  onBureau={voirBureau}
                  onSortir={sortir}
                />
              </div>
            )
          )}
        </div>

        {/* Habillage : titre, boutons, bulle de dialogue */}
        <div className="mi-hud">
          <div className="mi-haut">
            {vue === 'ile' ? (
              <>
                <div className="mi-titre">
                  <strong>Mon île</strong>
                  <span>{pendantes.length} à valider · ×1,4 élan</span>
                </div>
                {mode === 'visite' ? (
                  <button className="mi-bouton" onClick={() => { setMode('disposer'); setDialogue(null); setBulleBrin(false) }}>⌂ Disposer</button>
                ) : (
                  <button className="mi-bouton mi-bouton-plein" onClick={() => { setMode('visite'); setEnMain(null); setDialogue(null) }}>Terminé</button>
                )}
              </>
            ) : (
              <>
                <button className="mi-bouton" onClick={sortir} disabled={occupe}>← Sortir</button>
                {nomCourant && (
                  <div className="mi-titre mi-titre-droite">
                    <strong><span className="mi-point" style={{ background: nomCourant.couleur }} /> {nomCourant.nom}</strong>
                    <span>{nomCourant.sousTitre}{agentsCourants.length ? ` · ${agentsCourants.length} agents` : ''}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {mode === 'disposer' && vue === 'ile' && (
            <p className="mi-aide" role="status">
              {enMain ? `Touche une tuile d’herbe pour y poser ${MAISONS[enMain].nom}.` : 'Touche une maison pour la prendre.'}
            </p>
          )}

          {dialogue && (
            <div className="mi-dialogue" role="dialog" aria-live="polite">
              {dialogue.type === 'agent' && (() => {
                const a = dialogue.agent
                const pending = attente.has(a.id)
                return (
                  <>
                    <div className="mi-nom" style={{ background: COULEUR[a.domaine] }}>{a.nom} <small>· {DOMAINE_LABEL[a.domaine]}</small></div>
                    <p>{pending ? EXEMPLES[a.id] : REPOS[a.id] ?? `${a.mission} Rien en attente pour l’instant.`}</p>
                    <div className="mi-actions">
                      {pending ? (
                        <>
                          <button className="mi-bouton mi-bouton-plein" style={{ background: COULEUR[a.domaine] }} onClick={() => valider(a.id)}>Valider</button>
                          <button className="mi-bouton" onClick={() => setDialogue(null)}>Plus tard</button>
                        </>
                      ) : (
                        <button className="mi-bouton" onClick={() => setDialogue(null)}>Merci !</button>
                      )}
                    </div>
                  </>
                )
              })()}
              {dialogue.type === 'brin' && (
                <>
                  <div className="mi-nom" style={{ background: '#5E9B62' }}>Brin <small>· l’arbre de l’île</small></div>
                  <p>Bienvenue chez toi. Chaque maison abrite une équipe : l’Atelier pour ta boîte, le Spa pour ta peau, le Jardin pour ta planète. Entre, va voir qui t’attend, et dispose les maisons comme tu veux.</p>
                  <div className="mi-actions">
                    <button className="mi-bouton mi-bouton-plein" onClick={() => setDialogue(null)}>Compris</button>
                  </div>
                </>
              )}
              {dialogue.type === 'bureau' && (
                <>
                  <div className="mi-nom" style={{ background: '#D9A24B' }}>Le bureau du jour</div>
                  {pendantes.length === 0 ? (
                    <p>Rien à relire : tout est validé. Va souffler au Spa.</p>
                  ) : (
                    <ul className="mi-liste">
                      {pendantes.slice(0, 3).map((a) => (
                        <li key={a.id}>
                          <span className="mi-point" style={{ background: COULEUR[a.domaine] }} />
                          <span><strong>{a.nom}</strong> · {a.propositions[0]}</span>
                          <button className="mi-bouton mi-bouton-petit" onClick={() => setValidees((v) => new Set(v).add(a.id))}>Valider</button>
                        </li>
                      ))}
                      {pendantes.length > 3 && <li className="mi-plus">… et {pendantes.length - 3} autres, chez les agents.</li>}
                    </ul>
                  )}
                  <div className="mi-actions">
                    <button className="mi-bouton" onClick={() => setDialogue(null)}>Fermer</button>
                  </div>
                </>
              )}
              {dialogue.type === 'info' && (
                <>
                  <p>{dialogue.texte}</p>
                  <div className="mi-actions">
                    <button className="mi-bouton" onClick={() => setDialogue(null)}>D’accord</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Iris de transition, façon jeu */}
          {(phase === 'iris-ferme' || phase === 'iris-ouvre') && (
            <div className={`mi-iris mi-iris-${phase === 'iris-ferme' ? 'ferme' : 'ouvre'}`} aria-hidden>
              <div className="mi-iris-trou" />
            </div>
          )}
        </div>
      </div>

      <aside className="mi-notes">
        <h1>Maquette : l’île façon Animal Crossing</h1>
        <p>Une île, quatre maisons que l’on dispose où l’on veut, un personnage qui y entre. Dedans, les agents IA travaillent à leur poste : on va les voir, ils racontent ce qu’ils ont préparé, on valide ou pas.</p>
        <h2>À essayer</h2>
        <ul>
          <li><strong>Touche une maison</strong> : le personnage marche jusqu’à la porte, elle s’ouvre, on entre.</li>
          <li><strong>À l’intérieur</strong>, touche un agent : il te parle et te propose quelque chose à valider. Le paillasson ou « Sortir » pour ressortir.</li>
          <li><strong>Ma maison</strong> : chez toi, un bureau du jour qui rassemble ce qui reste à relire.</li>
          <li><strong>Disposer</strong> : prends une maison, pose-la sur deux tuiles d’herbe libres.</li>
          <li><strong>Brin</strong>, sur la place, accueille et guide.</li>
        </ul>
        <h2>Les maisons</h2>
        <ul className="mi-legende">
          {ORDRE.map((id) => (
            <li key={id}><span className="mi-point" style={{ background: MAISONS[id].couleur }} /> <strong>{MAISONS[id].nom}</strong> · {MAISONS[id].sousTitre}{MAISONS[id].domaine ? ` · ${agentsDe(id).length} agents` : ' · le bureau du jour'}</li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
