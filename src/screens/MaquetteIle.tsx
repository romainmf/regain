import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CATALOGUE } from '../domain/catalog'
import { COULEUR } from '../domain/couleurs'
import type { AgentTemplate, Domaine } from '../domain/types'
import { DOMAINE_LABEL, DOMAINES } from '../domain/types'
import { Coeur } from '../island/Coeur'
import { Meuble, type MeubleId } from '../island/Meubles'
import { Poste } from '../island/Poste'
import { Robot } from '../island/Robot'
import { hache } from '../island/Paysage'
import { Arbre, BOIS, CREME, Flore, Pave, Toit, VERRE, nuance } from '../island/buildings/primitives'
import { TH, TW, iso, losange } from '../island/iso'
import { ZoomPan } from '../ui/ZoomPan'
import '../design/tokens.css'
import '../island/island.css'
import './maquette-ile.css'

/**
 * Maquette « Mon île » façon Animal Crossing (dev, route /maquette-ile).
 * Une île entourée de mer, des lieux que l'on dispose où l'on veut : trois
 * maisons (Atelier, Spa, Ma maison) et un jardin en plein air, Brin sur la
 * place. On touche un lieu : le personnage y marche, on entre, et dedans les
 * agents IA travaillent à leur poste ; on va les voir, ils parlent.
 * Sous l'île, un tableau de bord : à valider, élan, équipe.
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

// ——— Les lieux ——————————————————————————————————————————————————————————

type LieuId = 'atelier' | 'spa' | 'jardin' | 'maison'
interface DefLieu {
  nom: string
  sousTitre: string
  genre: 'maison' | 'jardin'
  /** Côté de l'emprise, en tuiles. */
  taille: number
  domaine?: Domaine
  couleur: string
  toit: string
  mur: string
  /** Sol intérieur : deux teintes en damier. */
  sol: [string, string]
  murInt: string
}

const LIEUX: Record<LieuId, DefLieu> = {
  atelier: { nom: 'L’Atelier', sousTitre: 'Ma boîte', genre: 'maison', taille: 2, domaine: 'boite', couleur: COULEUR.boite, toit: '#C46A3F', mur: '#F3E4CE', sol: ['#E8CDA8', '#DFBF96'], murInt: '#F3E6D2' },
  spa: { nom: 'Le Spa', sousTitre: 'Ma peau', genre: 'maison', taille: 2, domaine: 'peau', couleur: COULEUR.peau, toit: '#A96A8F', mur: '#F6EAF1', sol: ['#DCE9EA', '#CDE0E2'], murInt: '#F4E6ED' },
  jardin: { nom: 'Le Jardin', sousTitre: 'Ma planète', genre: 'jardin', taille: 3, domaine: 'planete', couleur: COULEUR.planete, toit: '#4F8A55', mur: '#D9EBDC', sol: ['#B9DCA3', '#ACD399'], murInt: '#D8EAF3' },
  maison: { nom: 'Ma maison', sousTitre: 'Chez toi', genre: 'maison', taille: 2, couleur: '#E7B04A', toit: '#D9A24B', mur: '#F6ECD8', sol: ['#E3B99A', '#D9AA89'], murInt: '#F7EEDC' },
}
const ORDRE: LieuId[] = ['atelier', 'spa', 'jardin', 'maison']

interface Ancre { x: number; y: number }
const POSITIONS_DEPART: Record<LieuId, Ancre> = {
  atelier: { x: 2, y: 5 },
  spa: { x: 8, y: 2 },
  jardin: { x: 8, y: 7 },
  maison: { x: 4, y: 9 },
}

/** Emprise d'un lieu : un carré de `taille` tuiles de côté à partir de son ancre. */
function emprise(a: Ancre, n: number): [number, number][] {
  const out: [number, number][] = []
  for (let dy = 0; dy < n; dy++) for (let dx = 0; dx < n; dx++) out.push([a.x + dx, a.y + dy])
  return out
}
/** Tuile devant la porte (ou le portillon), où le personnage s'arrête. */
const devantPorte = (a: Ancre, n: number) => ({ x: a.x + (n - 1) / 2, y: a.y + n - 0.05 })
const dansPorte = (a: Ancre, n: number) => ({ x: a.x + (n - 1) / 2, y: a.y + n - 0.65 })

// ——— Les intérieurs ———————————————————————————————————————————————————————

const LARGEUR = 6
const PROFONDEUR = 5
const HAUTEUR_MUR = 70

interface Slot { x: number; y: number; ax: number; ay: number }
const SLOTS_CINQ: Slot[] = [
  { x: 0, y: 1, ax: 1, ay: 1 }, { x: 2, y: 0, ax: 2, ay: 1 }, { x: 4, y: 0, ax: 4, ay: 1 }, { x: 0, y: 3, ax: 1, ay: 3 }, { x: 5, y: 2, ax: 4, ay: 2 },
]
const SLOTS: Record<LieuId, Slot[]> = {
  atelier: SLOTS_CINQ,
  spa: [...SLOTS_CINQ, { x: 5, y: 4, ax: 4, ay: 4 }],
  jardin: SLOTS_CINQ,
  maison: [],
}
const MEUBLES_INT: Record<LieuId, { x: number; y: number; meuble: MeubleId }[]> = {
  atelier: [{ x: 0, y: 0, meuble: 'caisses' }, { x: 5, y: 0, meuble: 'etabli' }],
  spa: [{ x: 0, y: 0, meuble: 'plante' }, { x: 5, y: 0, meuble: 'transat' }],
  jardin: [{ x: 0, y: 0, meuble: 'ruche' }, { x: 5, y: 0, meuble: 'arbre-fruitier' }, { x: 5, y: 4, meuble: 'bac' }, { x: 0, y: 4, meuble: 'bac' }],
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

const agentsDe = (id: LieuId): AgentTemplate[] => {
  const d = LIEUX[id].domaine
  return d ? CATALOGUE.filter((a) => a.domaine === d) : []
}
const lieuDe = (a: AgentTemplate): LieuId => ORDRE.find((id) => LIEUX[id].domaine === a.domaine) ?? 'maison'

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

  /** Suit une suite d'étapes à vitesse constante, en se tournant à chaque segment. */
  const suivre = useCallback((etapes: Pos[], ensuite?: () => void) => {
    arreter()
    const segments: { de: Pos; a: Pos; d: number }[] = []
    let prec = ref.current
    for (const p of etapes) {
      segments.push({ de: prec, a: p, d: Math.hypot(p.x - prec.x, p.y - prec.y) })
      prec = p
    }
    const total = segments.reduce((s, g) => s + g.d, 0)
    const arrivee = etapes[etapes.length - 1] ?? ref.current
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    if (total < 0.05 || reduit) {
      poser(arrivee)
      ensuite?.()
      return
    }
    setEnMarche(true)
    apres.current = ensuite
    const duree = Math.max(220, (total / 3.4) * 1000)
    const t0 = performance.now()
    let courant = -1
    const pas = (t: number) => {
      const k = Math.min(1, (t - t0) / duree)
      const dist = k * total
      let acc = 0
      let i = 0
      while (i < segments.length - 1 && dist > acc + segments[i].d) {
        acc += segments[i].d
        i++
      }
      const s = segments[i]
      if (i !== courant) {
        courant = i
        setVersGauche(s.a.x - s.a.y < s.de.x - s.de.y)
      }
      const u = s.d > 0 ? Math.min(1, (dist - acc) / s.d) : 1
      const p = { x: s.de.x + (s.a.x - s.de.x) * u, y: s.de.y + (s.a.y - s.de.y) * u }
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

  /** Va tout droit vers un point. */
  const aller = useCallback((vers: Pos, ensuite?: () => void) => suivre([vers], ensuite), [suivre])
  const actuelle = useCallback(() => ref.current, [])

  useEffect(() => () => cancelAnimationFrame(anim.current), [])
  return { pos, enMarche, versGauche, aller, suivre, actuelle, poser }
}

/**
 * Chemin sur la grille, d'une tuile à l'autre, en contournant les obstacles
 * (parcours en largeur, huit directions, sans couper les coins). La tuile
 * d'arrivée est toujours permise. Sans chemin, on va tout droit.
 */
function trouverChemin(de: Pos, vers: Pos, praticable: (x: number, y: number) => boolean): Pos[] {
  const sx = Math.round(de.x), sy = Math.round(de.y)
  const gx = Math.round(vers.x), gy = Math.round(vers.y)
  if (sx === gx && sy === gy) return [vers]
  const ok = (x: number, y: number) => (x === gx && y === gy) || praticable(x, y)
  const prec = new Map<string, string | null>([[cle(sx, sy), null]])
  const file: [number, number][] = [[sx, sy]]
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]
  let trouve = false
  while (file.length && !trouve) {
    const [x, y] = file.shift()!
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy
      const k = cle(nx, ny)
      if (prec.has(k) || !ok(nx, ny)) continue
      // En diagonale, les deux tuiles adjacentes doivent être libres : on ne coupe pas les clôtures.
      if (dx && dy && !(ok(x + dx, y) && ok(x, y + dy))) continue
      prec.set(k, cle(x, y))
      if (nx === gx && ny === gy) { trouve = true; break }
      file.push([nx, ny])
    }
  }
  if (!trouve) return [vers]
  const tuiles: Pos[] = []
  let k: string | null = cle(gx, gy)
  while (k) {
    const [x, y] = k.split(',').map(Number)
    tuiles.unshift({ x, y })
    k = prec.get(k) ?? null
  }
  // On enlève la tuile de départ, on garde les virages seulement, et l'arrivée exacte.
  const etapes: Pos[] = []
  for (let i = 1; i < tuiles.length - 1; i++) {
    const a = tuiles[i - 1], b = tuiles[i], c = tuiles[i + 1]
    if (b.x - a.x !== c.x - b.x || b.y - a.y !== c.y - b.y) etapes.push(b)
  }
  etapes.push(vers)
  return etapes
}

// ——— Dessin d'une maison ——————————————————————————————————————————————————————

const P = (fx: number, fy: number, fz: number) => `${(fx - fy) * TW},${(fx + fy) * TH - fz}`
/** Coin de tuile (demi-entiers) avec une hauteur, en coordonnées écran. */
const C = (cx: number, cy: number, z = 0) => `${(cx - cy) * TW},${(cx + cy) * TH - z}`

/** Une maison donne signe de vie quand un agent y attend : fumée, vapeur, fenêtres éclairées, drapeau levé. */
function MaisonIle({ id, porteOuverte, enMain, attente }: { id: LieuId; porteOuverte: boolean; enMain: boolean; attente: number }) {
  const M = LIEUX[id]
  const w = 0.78, d = 0.78, h = 30
  const vivante = attente > 0
  const vitre = vivante ? '#F8E7B8' : VERRE
  const porte = `${P(-0.26, d, 0)} ${P(0.1, d, 0)} ${P(0.1, d, 19)} ${P(-0.26, d, 19)}`
  const fenetreG = `${P(0.3, d, 11)} ${P(0.62, d, 11)} ${P(0.62, d, 23)} ${P(0.3, d, 23)}`
  const fenetreD = `${P(w, -0.55, 11)} ${P(w, -0.15, 11)} ${P(w, -0.15, 24)} ${P(w, -0.55, 24)}`
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}`}>
      <ellipse cx={10} cy={8} rx={TW * 1.3} ry={TH * 1.3} fill="rgba(34,48,31,.16)" />
      {/* Dalle autour de la maison */}
      <polygon points={`${P(-1.05, -1.05, 0)} ${P(1.05, -1.05, 0)} ${P(1.05, 1.05, 0)} ${P(-1.05, 1.05, 0)}`} fill="#E9DCC0" opacity={0.9} />
      <Pave w={w} d={d} h={h} couleur={M.mur} haut={M.mur} />
      {/* Bardage bas */}
      <polygon points={`${P(-w, d, 0)} ${P(w, d, 0)} ${P(w, d, 5)} ${P(-w, d, 5)}`} fill={nuance(M.toit, 0.1)} opacity={0.7} />
      <polygon points={`${P(w, d, 0)} ${P(w, -d, 0)} ${P(w, -d, 5)} ${P(w, d, 5)}`} fill={nuance(M.toit, -0.1)} opacity={0.7} />
      {/* Porte : l'intérieur sombre, puis le battant qui s'ouvre */}
      <polygon points={porte} fill="#2E2520" />
      <polygon className={`porte${porteOuverte ? ' porte-ouverte' : ''}`} points={porte} fill={nuance(BOIS, -0.08)} stroke={nuance(BOIS, -0.3)} strokeWidth={0.8} />
      <circle cx={(0.03 - d) * TW} cy={(0.03 + d) * TH - 9.5} r={1.1} fill="#E7B04A" />
      {/* Fenêtres : éclairées quand quelqu'un attend dedans */}
      {vivante && (
        <g className="fenetre-lueur" aria-hidden>
          <polygon points={fenetreG} fill="#F6E6C2" stroke="#F6E6C2" strokeWidth={7} strokeLinejoin="round" opacity={0.45} />
          <polygon points={fenetreD} fill="#F6E6C2" stroke="#F6E6C2" strokeWidth={7} strokeLinejoin="round" opacity={0.45} />
        </g>
      )}
      <polygon points={fenetreG} fill={vitre} stroke={CREME} strokeWidth={1.4} />
      <polygon points={fenetreD} fill={vitre} stroke={CREME} strokeWidth={1.4} />
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
      <Toit w={1.0} d={1.0} z={h} h={22} couleur={M.toit} faitage={0.42} solaire={id === 'maison'} />
      {/* Signes distinctifs */}
      {id === 'atelier' && (
        <g transform={`translate(${(0.5 + 0.35) * TW} ${(0.5 - 0.35) * TH - h - 14})`}>
          <Pave w={0.07} d={0.07} h={12} couleur="#B8A48A" />
          {/* La cheminée fume quand on y travaille pour toi */}
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
          {/* Le bain fume quand un soin t'attend */}
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
          {/* Le drapeau de la boîte aux lettres se lève quand il y a du courrier à relire */}
          <g className={vivante ? 'drapeau drapeau-leve' : 'drapeau'}>
            <line x1={4.5} y1={-18} x2={4.5} y2={-10} stroke="#B0512A" strokeWidth={1.4} strokeLinecap="round" />
            <path d="M 4.5 -18 l 4 1.5 l -4 1.5 Z" fill="#B0512A" />
          </g>
        </g>
      )}
      {/* Paillasson devant la porte */}
      <polygon points={`${P(-0.3, d + 0.15, 0)} ${P(0.14, d + 0.15, 0)} ${P(0.14, d + 0.42, 0)} ${P(-0.3, d + 0.42, 0)}`} fill="#C9A06A" opacity={0.9} />
    </g>
  )
}

// ——— Dessin du jardin en plein air ———————————————————————————————————————————————

/** Clôture de bois le long d'un bord de parcelle (coins de tuiles), avec une ouverture possible. */
function Cloture({ de, a, ouverture, segments = 3 }: { de: [number, number]; a: [number, number]; ouverture?: [number, number]; segments?: number }) {
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

/** Le fond du jardin : parcelle de terre et d'herbe, allée vers le portillon, clôtures du fond. */
function JardinFond({ n, enMain }: { n: number; enMain: boolean }) {
  const h = n - 0.5
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}`}>
      <polygon points={`${C(-0.5, -0.5)} ${C(h, -0.5)} ${C(h, h)} ${C(-0.5, h)}`} fill="#B3D694" />
      <polygon points={`${C(-0.3, -0.3)} ${C(h - 0.2, -0.3)} ${C(h - 0.2, h - 0.2)} ${C(-0.3, h - 0.2)}`} fill="none" stroke="#9FC985" strokeWidth={1} strokeDasharray="3 3" />
      {/* Allée de terre, du portillon au centre */}
      <path d={`M ${C(1.5, h)} Q ${C(1.4, 1.6)} ${C(1, 1)}`} stroke="#E6D3A8" strokeWidth={9} fill="none" strokeLinecap="round" opacity={0.9} />
      <Cloture de={[-0.5, -0.5]} a={[-0.5, h]} segments={n} />
      <Cloture de={[-0.5, -0.5]} a={[h, -0.5]} segments={n} />
    </g>
  )
}

/** Les clôtures de devant, avec le portillon ouvert au milieu du bord gauche. */
function JardinAvant({ n, enMain, portillonOuvert }: { n: number; enMain: boolean; portillonOuvert: boolean }) {
  const h = n - 0.5
  const milieu = Math.floor(n / 2)
  return (
    <g className={`maison${enMain ? ' maison-en-main' : ''}`}>
      <Cloture de={[-0.5, h]} a={[h, h]} segments={n} ouverture={[milieu / n, (milieu + 1) / n]} />
      <Cloture de={[h, -0.5]} a={[h, h]} segments={n} />
      {/* Portillon : deux planches, qui pivotent quand on entre */}
      <g transform={`translate(${(milieu - h) * TW} ${(milieu + h) * TH})`}>
        <g className={`porte${portillonOuvert ? ' porte-ouverte' : ''}`}>
          <polygon points={`${P(0.08, 0, 0)} ${P(0.42, 0, 0)} ${P(0.42, 0, 10)} ${P(0.08, 0, 10)}`} fill={nuance(BOIS, 0.1)} stroke={nuance(BOIS, -0.25)} strokeWidth={0.8} />
          <path d={`M ${P(0.12, 0, 3)} L ${P(0.38, 0, 8)}`} stroke={nuance(BOIS, -0.25)} strokeWidth={0.8} />
        </g>
      </g>
    </g>
  )
}

/** Ce qui pousse et qui travaille dans la parcelle, en coordonnées locales (0..n−1). */
const JARDIN_LOCAL: { x: number; y: number; meuble?: MeubleId; agent?: number }[] = [
  { x: 0, y: 0, meuble: 'ruche' },
  { x: 2, y: 0, meuble: 'arbre-fruitier' },
  { x: 1, y: 0, agent: 0 },
  { x: 0, y: 1, agent: 1 },
  { x: 2, y: 1, agent: 2 },
  { x: 0, y: 2, meuble: 'bac' },
  { x: 2, y: 2, meuble: 'bac' },
]

function Enseigne({ id, attente }: { id: LieuId; attente: number }) {
  const M = LIEUX[id]
  const l = M.nom.length * 7.6 + 30
  return (
    <g className="enseigne" aria-hidden>
      <rect x={-l / 2} y={-12} width={l} height={24} rx={12} fill="#FBF8F1" stroke="#E2DACA" />
      <circle cx={-l / 2 + 12} cy={0} r={4} fill={M.couleur} />
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

// ——— Intérieur (ou jardin en plein air) ————————————————————————————————————————

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

interface PropsInterieur {
  id: LieuId
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
  const M = LIEUX[id]
  const dehors = M.genre === 'jardin'
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

  const vb = { x: -(PROFONDEUR + 0.5) * TW - 24, y: -HAUTEUR_MUR - 40, w: (LARGEUR + PROFONDEUR + 1) * TW + 48, h: HAUTEUR_MUR + (LARGEUR + PROFONDEUR) * TH + 90 }

  return (
    <svg viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`} preserveAspectRatio="xMidYMid meet" role="img" aria-label={dehors ? `Dehors : ${M.nom}` : `Intérieur : ${M.nom}`}>
      <defs>
        <linearGradient id="mi-ciel-fenetre" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#CFE5F1" />
          <stop offset="1" stopColor="#F6E6C2" />
        </linearGradient>
        <pattern id="mi-papier" width="10" height="10" patternUnits="userSpaceOnUse">
          <circle cx={5} cy={5} r={0.9} fill="rgba(34,48,31,.07)" />
        </pattern>
      </defs>
      {dehors ? (
        /* Plein air : ciel, soleil, nuages, et une haie à la place des murs */
        <g aria-hidden>
          <circle cx={vb.x + vb.w * 0.2} cy={vb.y + 46} r={16} fill="#F3C66A" />
          <circle cx={vb.x + vb.w * 0.2} cy={vb.y + 46} r={30} fill="#F3C66A" opacity={0.18} />
          <g fill="#FBF8F1" opacity={0.95} className="mi-nuages">
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
          <polygon points={murGauche} fill={M.murInt} />
          <polygon points={murDroit} fill={nuance(M.murInt, -0.06)} />
          <polygon points={murGauche} fill="url(#mi-papier)" />
          <polygon points={murDroit} fill="url(#mi-papier)" />
          {/* Fenêtre sur le mur droit, et un cadre sur le mur gauche */}
          <polygon points={fenetre} fill="url(#mi-ciel-fenetre)" stroke={CREME} strokeWidth={2.4} />
          <circle cx={(3.3 + 0.5) * TW} cy={(3.3 - 0.5) * TH - 44} r={5} fill="#F3C66A" />
          <path d={`M ${C(3, -0.5, 24)} L ${C(3, -0.5, 52)} M ${C(2.2, -0.5, 38)} L ${C(3.8, -0.5, 38)}`} stroke={CREME} strokeWidth={1.6} />
          <polygon points={cadre} fill="#F4EAD5" stroke={nuance(BOIS, -0.1)} strokeWidth={1.8} />
          <ellipse cx={(-0.5 - 1.7) * TW} cy={(-0.5 + 1.7) * TH - 38} rx={9} ry={4.5} fill="#8DBF85" />
          <circle cx={(-0.5 - 1.7) * TW + 3} cy={(-0.5 + 1.7) * TH - 44} r={3} fill="#2F7A5C" />
          {/* Plinthes */}
          <polygon points={`${C(-0.5, -0.5, 4)} ${C(-0.5, -0.5)} ${C(-0.5, PROFONDEUR - 0.5)} ${C(-0.5, PROFONDEUR - 0.5, 4)}`} fill={nuance(M.sol[1], -0.2)} />
          <polygon points={`${C(-0.5, -0.5, 4)} ${C(-0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5)} ${C(LARGEUR - 0.5, -0.5, 4)}`} fill={nuance(M.sol[1], -0.3)} />
        </g>
      )}

      {/* Sol en damier (ou pelouse) */}
      <g>
        {tuiles.map((t) => (
          <polygon key={cle(t.x, t.y)} points={losange(t.x, t.y)} fill={M.sol[(t.x + t.y) % 2]} stroke="rgba(255,255,255,.35)" strokeWidth={0.6} />
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
                    <g transform="translate(0 -62)"><g className="signe-point">
                      <circle r={7} fill="#E7B04A" opacity={0.95} />
                      <text y={4} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={11} fontWeight={700} fill="#22301F">!</text>
                    </g></g>
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

/** Élan de la semaine, par domaine (valeurs de maquette, sur 6). */
const ELAN: Record<Domaine, number> = { boite: 4, peau: 3, planete: 5 }

/** Le tiroir du tableau de bord : replié sur les chiffres, à mi-hauteur, ou déplié. */
type Tiroir = 'replie' | 'moitie' | 'plein'
const HAUTEUR_TIROIR: Record<Tiroir, string> = { replie: '118px', moitie: '50%', plein: '86%' }
const TIROIR_SUIVANT: Record<Tiroir, Tiroir> = { replie: 'moitie', moitie: 'plein', plein: 'replie' }

/** Poignée du tiroir : toucher pour passer à la position suivante, glisser pour l'amener où l'on veut. */
function Poignee({ tiroir, onChanger, onGlisser, onLacher }: {
  tiroir: Tiroir
  onChanger: (t: Tiroir) => void
  onGlisser: (hauteur: number | null) => void
  onLacher: (hauteur: number) => void
}) {
  const geste = useRef<{ y0: number; h0: number; bouge: boolean } | null>(null)
  return (
    <button
      className="mi-tiroir-poignee"
      aria-label={tiroir === 'plein' ? 'Replier le tableau de bord' : 'Déplier le tableau de bord'}
      onPointerDown={(e) => {
        const tiroirEl = e.currentTarget.parentElement
        if (!tiroirEl) return
        geste.current = { y0: e.clientY, h0: tiroirEl.getBoundingClientRect().height, bouge: false }
        e.currentTarget.setPointerCapture(e.pointerId)
      }}
      onPointerMove={(e) => {
        const g = geste.current
        if (!g) return
        const dy = g.y0 - e.clientY
        if (Math.abs(dy) > 6) g.bouge = true
        if (g.bouge) onGlisser(Math.max(60, g.h0 + dy))
      }}
      onPointerUp={(e) => {
        const g = geste.current
        geste.current = null
        if (!g) return
        if (g.bouge) onLacher(Math.max(60, g.h0 + (g.y0 - e.clientY)))
        else onChanger(TIROIR_SUIVANT[tiroir])
        onGlisser(null)
      }}
      onPointerCancel={() => { geste.current = null; onGlisser(null) }}
    >
      <span className="mi-tiroir-barre" aria-hidden />
    </button>
  )
}

export function MaquetteIle() {
  const tuiles = useMemo(construireIle, [])
  const fonds = useMemo(hautsFonds, [])
  const index = useMemo(() => new Map(tuiles.map((t) => [cle(t.x, t.y), t])), [tuiles])

  const [lieux, setLieux] = useState<Record<LieuId, Ancre>>(POSITIONS_DEPART)
  const [mode, setMode] = useState<Mode>('visite')
  const [enMain, setEnMain] = useState<LieuId | null>(null)
  const [vue, setVue] = useState<'ile' | 'interieur'>('ile')
  const [lieuCourant, setLieuCourant] = useState<LieuId | null>(null)
  const [transition, setTransition] = useState<{ lieu: LieuId; sens: 'entrer' | 'sortir' } | null>(null)
  const [phase, setPhase] = useState<Phase>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  const [validees, setValidees] = useState<Set<string>>(() => new Set())
  const { pos, enMarche, versGauche, aller, suivre, actuelle, poser } = useMarcheur({ x: 5, y: 8 })
  /** Brin salue quand on passe près de lui. */
  const [salut, setSalut] = useState(false)
  const dernierSalut = useRef(0)
  const [tiroir, setTiroir] = useState<Tiroir>('replie')
  /** Hauteur du tiroir pendant un glissement, en pixels ; sinon la position choisie. */
  const [glisse, setGlisse] = useState<number | null>(null)
  const cadre = useRef<HTMLDivElement>(null)
  const lacherTiroir = (h: number) => {
    const H = cadre.current?.clientHeight ?? 800
    const cibles: [Tiroir, number][] = [['replie', 118], ['moitie', H * 0.5], ['plein', H * 0.86]]
    cibles.sort((a, b) => Math.abs(a[1] - h) - Math.abs(b[1] - h))
    setTiroir(cibles[0][0])
  }
  /** Depuis le tableau de bord : une fois entré, aller voir cet agent. */
  const apresEntree = useRef<string | null>(null)
  /** Depuis le tableau de bord, quand on est déjà dans un lieu : une fois sorti, entrer dans celui-ci. */
  const apresSortie = useRef<LieuId | null>(null)

  // Propositions en attente : tout agent qui a un exemple et n'a pas été validé.
  const attente = useMemo(() => new Set(CATALOGUE.filter((a) => EXEMPLES[a.id] && !validees.has(a.id)).map((a) => a.id)), [validees])
  const attenteLieu = (id: LieuId) => agentsDe(id).filter((a) => attente.has(a.id)).length
  const pendantes = CATALOGUE.filter((a) => attente.has(a.id))

  // Tuiles occupées par les lieux et la place.
  const occupees = useMemo(() => {
    const s = new Set<string>(placeTuiles)
    ORDRE.forEach((id) => emprise(lieux[id], LIEUX[id].taille).forEach(([x, y]) => s.add(cle(x, y))))
    return s
  }, [lieux])
  // Autour de chaque lieu, une tuile sans décor : les portes restent dégagées.
  const occupeesDecor = useMemo(() => {
    const s = new Set<string>(occupees)
    ORDRE.forEach((id) =>
      emprise(lieux[id], LIEUX[id].taille).forEach(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) s.add(cle(x + dx, y + dy))
      }),
    )
    return s
  }, [occupees, lieux])

  // Pour marcher : les emprises des lieux et l'arbre bloquent, la place et la plage se traversent.
  const obstacles = useMemo(() => {
    const s = new Set<string>([cle(PLACE.x, PLACE.y)])
    ORDRE.forEach((id) => emprise(lieux[id], LIEUX[id].taille).forEach(([x, y]) => s.add(cle(x, y))))
    return s
  }, [lieux])
  const marcherVers = useCallback((vers: Pos, ensuite?: () => void) => {
    const chemin = trouverChemin(actuelle(), vers, (x, y) => index.has(cle(x, y)) && !obstacles.has(cle(x, y)))
    suivre(chemin, ensuite)
  }, [actuelle, index, obstacles, suivre])

  // Un lieu se pose sur de l'herbe, à une tuile au moins des autres et de la place.
  const peutPoser = useCallback((id: LieuId, a: Ancre) => {
    const autres = new Set<string>(placeTuiles)
    ORDRE.filter((m) => m !== id).forEach((m) =>
      emprise(lieux[m], LIEUX[m].taille).forEach(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) autres.add(cle(x + dx, y + dy))
      }),
    )
    return emprise(a, LIEUX[id].taille).every(([x, y]) => index.get(cle(x, y))?.terrain === 'herbe' && !autres.has(cle(x, y)))
  }, [lieux, index])

  // Chemins de la place vers chaque porte : des pas japonais.
  const chemins = useMemo(() => {
    const pas = new Set<string>()
    ORDRE.forEach((id) => {
      const a = lieux[id], n = LIEUX[id].taille
      const de = { x: a.x + Math.floor((n - 1) / 2), y: a.y + n }
      const vers = PLACE
      const etapes = Math.max(Math.abs(vers.x - de.x), Math.abs(vers.y - de.y))
      for (let i = 0; i <= etapes; i++) {
        const x = Math.round(de.x + ((vers.x - de.x) * i) / etapes)
        const y = Math.round(de.y + ((vers.y - de.y) * i) / etapes)
        if (!occupees.has(cle(x, y)) && index.has(cle(x, y))) pas.add(cle(x, y))
      }
    })
    return [...pas].map((k) => k.split(',').map(Number) as [number, number])
  }, [lieux, occupees, index])

  const voirAgent = useCallback((a: AgentTemplate, slot: Slot) => {
    setDialogue(null)
    aller({ x: slot.ax, y: slot.ay }, () => setDialogue({ type: 'agent', agent: a }))
  }, [aller])

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
          setLieuCourant(transition.lieu)
          poser(ENTREE_INT)
        } else if (transition?.sens === 'sortir') {
          setVue('ile')
          setLieuCourant(null)
          poser(devantPorte(lieux[transition.lieu], LIEUX[transition.lieu].taille))
        }
        setPhase('iris-ouvre')
      } else if (phase === 'iris-ouvre') {
        setPhase(null)
        setTransition(null)
        // Venu du tableau de bord : on file voir l'agent demandé, ou l'on traverse l'île vers l'autre lieu.
        if (transition?.sens === 'entrer') {
          const suite = apresEntree.current
          apresEntree.current = null
          const agents = agentsDe(transition.lieu)
          const i = suite ? agents.findIndex((a) => a.id === suite) : -1
          if (i >= 0) voirAgent(agents[i], SLOTS[transition.lieu][i])
        } else if (transition?.sens === 'sortir' && apresSortie.current) {
          const vers = apresSortie.current
          apresSortie.current = null
          entrer(vers)
        }
      }
    }, duree)
    return () => clearTimeout(t)
    // `entrer` change à chaque rendu, mais n'est lu qu'au moment du minuteur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, transition, lieux, poser, voirAgent])

  const occupe = phase !== null

  const entrer = useCallback((id: LieuId) => {
    const a = lieux[id], n = LIEUX[id].taille
    marcherVers(devantPorte(a, n), () => {
      setTransition({ lieu: id, sens: 'entrer' })
      setPhase('porte')
      aller(dansPorte(a, n))
    })
  }, [lieux, aller, marcherVers])

  // Brin salue quand on passe à côté de lui (pas plus d'une fois toutes les six secondes).
  useEffect(() => {
    if (vue !== 'ile' || !enMarche) return
    const d = Math.hypot(pos.x - PLACE.x, pos.y - PLACE.y)
    const maintenant = Date.now()
    if (d < 2.1 && maintenant - dernierSalut.current > 6000) {
      dernierSalut.current = maintenant
      setSalut(true)
    }
  }, [pos, enMarche, vue])
  useEffect(() => {
    if (!salut) return
    const t = setTimeout(() => setSalut(false), 1800)
    return () => clearTimeout(t)
  }, [salut])

  // Le conseil de Brin : le lieu où le plus de choses attendent.
  const conseil = ORDRE.filter((id) => LIEUX[id].domaine)
    .map((id) => ({ id, n: attenteLieu(id) }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)[0]
  const texteBrin = salut ? 'Coucou !' : conseil ? `${LIEUX[conseil.id].nom} t’attend : ${conseil.n} à relire` : 'Tout est à jour, bravo !'

  const toucherLieu = (id: LieuId) => {
    if (occupe) return
    setDialogue(null)
    if (mode === 'disposer') {
      setEnMain(enMain === id ? null : id)
      return
    }
    entrer(id)
  }

  const toucherTuile = (x: number, y: number) => {
    if (mode !== 'disposer' || !enMain) return
    const a = { x, y }
    if (peutPoser(enMain, a)) {
      setLieux({ ...lieux, [enMain]: a })
      setEnMain(null)
    } else {
      const n = LIEUX[enMain].taille
      setDialogue({ type: 'info', texte: `Pas ici : il faut ${n} tuiles sur ${n} d’herbe, à une tuile des autres lieux et de la place.` })
    }
  }

  const sortir = () => {
    if (occupe || !lieuCourant) return
    setDialogue(null)
    aller(ENTREE_INT, () => {
      setTransition({ lieu: lieuCourant, sens: 'sortir' })
      setPhase('iris-ferme')
    })
  }

  /** Depuis le tableau de bord : aller voir un agent, où qu'il soit. */
  const rejoindre = (a: AgentTemplate) => {
    if (occupe) return
    const id = lieuDe(a)
    setTiroir('replie')
    setMode('visite')
    setEnMain(null)
    const i = agentsDe(id).findIndex((x) => x.id === a.id)
    if (vue === 'interieur' && lieuCourant === id) {
      voirAgent(a, SLOTS[id][i])
      return
    }
    apresEntree.current = a.id
    setDialogue(null)
    if (vue === 'interieur' && lieuCourant) {
      // On sort d'abord ; une fois dehors, on traverse l'île jusqu'à l'autre lieu.
      apresSortie.current = id
      aller(ENTREE_INT, () => {
        setTransition({ lieu: lieuCourant, sens: 'sortir' })
        setPhase('iris-ferme')
      })
      return
    }
    entrer(id)
  }

  const voirBureau = () => {
    if (occupe) return
    setDialogue(null)
    aller({ x: BUREAU_MAISON.ax, y: BUREAU_MAISON.ay }, () => setDialogue({ type: 'bureau' }))
  }

  const parlerBrin = () => {
    if (occupe || mode === 'disposer') return
    setDialogue(null)
    marcherVers({ x: PLACE.x + 0.2, y: PLACE.y + 1.4 }, () => setDialogue({ type: 'brin' }))
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
  // L'île un peu au-dessus du milieu : le tiroir replié reste sous elle.
  const minY = (etendue.minY + etendue.maxY) / 2 - H * 0.4
  const sortedTuiles = [...tuiles].sort((a, b) => a.x + a.y - (b.x + b.y))

  type ObjetIle =
    | { type: 'maison'; id: LieuId; x: number; y: number }
    | { type: 'jardin-fond' | 'jardin-avant'; id: LieuId; x: number; y: number }
    | { type: 'jardin-meuble'; x: number; y: number; meuble: MeubleId; cle: string }
    | { type: 'jardin-agent'; x: number; y: number; agent: AgentTemplate }
    | { type: 'jardin-robot'; x: number; y: number }
    | { type: 'brin'; x: number; y: number }
    | { type: 'flore'; x: number; y: number; variante: number; terrain: Terrain }
    | { type: 'perso'; x: number; y: number }
  const cheminsSet = new Set(chemins.map(([x, y]) => cle(x, y)))
  const objets: ObjetIle[] = [{ type: 'brin', x: PLACE.x, y: PLACE.y }]
  ORDRE.forEach((id) => {
    const a = lieux[id], n = LIEUX[id].taille
    if (LIEUX[id].genre === 'maison') {
      objets.push({ type: 'maison', id, x: a.x + 1, y: a.y + 1 })
    } else {
      const agents = agentsDe(id)
      objets.push({ type: 'jardin-fond', id, x: a.x - 0.4, y: a.y })
      JARDIN_LOCAL.forEach((o) => {
        if (o.meuble) objets.push({ type: 'jardin-meuble', x: a.x + o.x, y: a.y + o.y, meuble: o.meuble, cle: `${id}-${o.x}-${o.y}` })
        else if (o.agent != null && agents[o.agent]) objets.push({ type: 'jardin-agent', x: a.x + o.x, y: a.y + o.y, agent: agents[o.agent] })
      })
      // Quand un agent attend, un robot vient t'attendre au portillon.
      if (attenteLieu(id) > 0) objets.push({ type: 'jardin-robot', x: a.x + Math.floor(n / 2) + 0.4, y: a.y + n - 1.15 })
      objets.push({ type: 'jardin-avant', id, x: a.x + n - 0.55, y: a.y + n - 0.55 })
    }
  })
  tuiles
    .filter((t) => !occupeesDecor.has(cle(t.x, t.y)) && !cheminsSet.has(cle(t.x, t.y)))
    .filter((t) => (t.terrain === 'herbe' ? hache(t.x, t.y) % 11 < 3 : hache(t.x, t.y) % 7 < 2))
    .forEach((t) => objets.push({ type: 'flore', x: t.x, y: t.y, variante: hache(t.x, t.y) >> 3, terrain: t.terrain }))
  if (vue === 'ile') objets.push({ type: 'perso', x: pos.x, y: pos.y })
  objets.sort((a, b) => a.x + a.y - (b.x + b.y) || a.x - b.x)

  const bords = sortedTuiles.flatMap((t) => {
    const out: { t: TuileIle; cote: 'g' | 'd' }[] = []
    if (!terre(t.x, t.y + 1)) out.push({ t, cote: 'g' })
    if (!terre(t.x + 1, t.y)) out.push({ t, cote: 'd' })
    return out
  })

  const nomCourant = lieuCourant ? LIEUX[lieuCourant] : null
  const agentsCourants = lieuCourant ? agentsDe(lieuCourant) : []
  const porteOuverteDe = (id: LieuId) => transition?.lieu === id && (phase === 'porte' || phase === 'iris-ferme')
  const lieuProps = (id: LieuId) => ({
    className: 'cible',
    role: 'button',
    tabIndex: 0,
    'aria-label': mode === 'disposer' ? `${LIEUX[id].nom} : toucher pour le prendre, puis une tuile pour le poser` : `Entrer dans ${LIEUX[id].nom}`,
    onClick: () => toucherLieu(id),
    onKeyDown: (e: React.KeyboardEvent) => { if (e.key === 'Enter') toucherLieu(id) },
  })

  return (
    <div className="mi-page">
      <div className="mi-cadre" ref={cadre} style={{ ['--tiroir' as string]: glisse != null ? `${glisse}px` : HAUTEUR_TIROIR[tiroir] }}>
        <>
          <div className="mi-ecran">
            <div className="mi-scene" aria-live="polite">
              {vue === 'ile' ? (
                <ZoomPan commandes>
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

                    {/* Disposition : ancres valides pour le lieu en main */}
                    {mode === 'disposer' && enMain && (
                      <g className="mi-emprises" pointerEvents="none">
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
                                <MaisonIle id={o.id} porteOuverte={porteOuverteDe(o.id)} enMain={enMain === o.id} attente={o.id === 'maison' ? pendantes.length : attenteLieu(o.id)} />
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
                                <JardinAvant n={LIEUX[o.id].taille} enMain={enMain === o.id} portillonOuvert={porteOuverteDe(o.id)} />
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
                              <g key={o.agent.id} transform={`translate(${sx} ${sy}) scale(0.8)`} className={enMain === 'jardin' ? 'maison maison-en-main' : undefined} aria-hidden>
                                <Poste id={o.agent.poste} domaine={o.agent.domaine} couleur={COULEUR[o.agent.domaine]} niveau={2} phase={(hache(o.x, o.y) % 20) / 10} />
                                {attente.has(o.agent.id) && (
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
                              <g key="brin" transform={`translate(${sx} ${sy})`} className={`coeur-brin cible${salut ? ' brin-salue' : ''}`} role="button" tabIndex={0} aria-label="Parler à Brin"
                                onClick={parlerBrin} onKeyDown={(e) => { if (e.key === 'Enter') parlerBrin() }}>
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
                                  : v % 4 === 0 ? <Arbre r={10 + (v % 4)} tronc={9} couleur={v % 2 ? '#6FA56B' : '#5E9B62'} /> : <Flore type={v} />}
                              </g>
                            )
                          }
                          case 'perso':
                            return <g key="perso" transform={`translate(${sx} ${sy}) scale(1.05)`}><Perso marche={enMarche} versGauche={versGauche} /></g>
                        }
                      })}
                    </g>
                    {/* Enseignes au-dessus des toits, bulle de Brin */}
                    <g pointerEvents="none">
                      {ORDRE.map((id) => {
                        const a = lieux[id], n = LIEUX[id].taille
                        const c = iso(a.x + (n - 1) / 2, a.y + (n - 1) / 2)
                        const haut = LIEUX[id].genre === 'jardin' ? -58 : -74
                        return (
                          <g key={id} transform={`translate(${c.sx} ${c.sy + haut})`}>
                            <Enseigne id={id} attente={attenteLieu(id)} />
                          </g>
                        )
                      })}
                    </g>
                    {/* Brin parle : il salue au passage, sinon il pointe le lieu où quelque chose attend */}
                    {mode === 'visite' && dialogue?.type !== 'brin' && (() => {
                      const b = iso(PLACE.x, PLACE.y)
                      const l = texteBrin.length * 7.2 + 28
                      const pointe = !salut && conseil ? conseil.id : null
                      const cible = pointe ? iso(lieux[pointe].x + (LIEUX[pointe].taille - 1) / 2, lieux[pointe].y + LIEUX[pointe].taille) : null
                      const allerVoir = () => { if (pointe && !occupe) { setDialogue(null); entrer(pointe) } }
                      return (
                        <g>
                          {cible && (() => {
                            // Un pointillé doré part du pied de l'arbre vers la porte du lieu conseillé.
                            const dx = cible.sx - b.sx, dy = cible.sy - b.sy
                            const d = Math.hypot(dx, dy) || 1
                            const ax = b.sx + (dx / d) * 54, ay = b.sy + (dy / d) * 27 + 6
                            const bx = cible.sx - (dx / d) * 22, by = cible.sy - (dy / d) * 11
                            const ang = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI
                            return (
                              <g className="brin-pointe" aria-hidden>
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
                            onClick={allerVoir}
                            onKeyDown={(e) => { if (e.key === 'Enter') allerVoir() }}
                          >
                            <rect x={-l / 2} y={-200} width={l} height={30} rx={15} fill="#FBF8F1" stroke={salut ? '#E7B04A' : '#E2DACA'} strokeWidth={salut ? 2 : 1} />
                            <path d="M -8 -171 L 0 -158 L 8 -171 Z" fill="#FBF8F1" />
                            <text x={0} y={-180} textAnchor="middle" fontFamily="DM Sans, sans-serif" fontSize={13} fontWeight={salut ? 700 : 500} fill="#22301F">{texteBrin}</text>
                          </g>
                        </g>
                      )
                    })()}
                  </svg>
                </ZoomPan>
              ) : (
                lieuCourant && (
                  <div className={`mi-interieur${LIEUX[lieuCourant].genre === 'jardin' ? ' mi-interieur-dehors' : ''}`}>
                    <Interieur
                      id={lieuCourant}
                      agents={agentsCourants}
                      perso={pos}
                      enMarche={enMarche}
                      versGauche={versGauche}
                      attente={attente}
                      onAgent={(a, s) => { if (!occupe) voirAgent(a, s) }}
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
                      <button className="mi-bouton" onClick={() => { setMode('disposer'); setDialogue(null) }}>⌂ Disposer</button>
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
                  {enMain ? `Touche une tuile d’herbe pour y poser ${LIEUX[enMain].nom}.` : 'Touche un lieu pour le prendre.'}
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
                      <p>Bienvenue chez toi. Chaque lieu abrite une équipe : l’Atelier pour ta boîte, le Spa pour ta peau, le Jardin pour ta planète. Entre, va voir qui t’attend, et dispose les lieux comme tu veux.</p>
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
            </div>
          </div>

          {/* Tableau de bord : un tiroir sous l'île */}
          <section className={`mi-tiroir mi-tiroir-${tiroir}${glisse != null ? ' mi-tiroir-glisse' : ''}`} aria-label="Tableau de bord">
            <Poignee tiroir={tiroir} onChanger={setTiroir} onGlisser={setGlisse} onLacher={lacherTiroir} />
            <div className="mi-tableau-chiffres">
              <div className="mi-chiffre"><strong>{pendantes.length}</strong><span>à valider</span></div>
              <div className="mi-chiffre"><strong>×1,4</strong><span>élan</span></div>
              <div className="mi-chiffre"><strong>120</strong><span>graines</span></div>
              <div className="mi-chiffre"><strong>7</strong><span>jours de suite</span></div>
            </div>
            <div className="mi-tableau">

            <div className="mi-carte">
              <div className="mi-carte-ligne">
                <h2>Aujourd’hui</h2>
                <span>{pendantes.length} à valider</span>
              </div>
              {pendantes.length === 0 ? (
                <p className="mi-vide">Rien à valider. Tes agents se reposent.</p>
              ) : (
                <ul className="mi-propositions">
                  {pendantes.slice(0, 4).map((a) => (
                    <li key={a.id} style={{ borderColor: COULEUR[a.domaine] }}>
                      <div className="mi-prop-txt">
                        <span className="mi-prop-agent" style={{ color: COULEUR[a.domaine] }}>{a.nom} · {LIEUX[lieuDe(a)].nom}</span>
                        <strong>{a.propositions[0]}</strong>
                      </div>
                      <div className="mi-prop-actions">
                        <button className="mi-bouton mi-bouton-petit mi-bouton-plein" style={{ background: COULEUR[a.domaine] }} onClick={() => setValidees((v) => new Set(v).add(a.id))}>Valider</button>
                        <button className="mi-bouton mi-bouton-petit" onClick={() => rejoindre(a)} disabled={occupe}>Y aller</button>
                      </div>
                    </li>
                  ))}
                  {pendantes.length > 4 && <li className="mi-plus">… et {pendantes.length - 4} autres, dans les lieux.</li>}
                </ul>
              )}
            </div>

            <div className="mi-carte">
              <div className="mi-carte-ligne">
                <h2>Élan de la semaine</h2>
                <span>12 récoltes</span>
              </div>
              <ul className="mi-elan">
                {DOMAINES.map((d) => (
                  <li key={d}>
                    <span className="mi-elan-nom" style={{ color: `var(--${d}-fonce)` }}>{DOMAINE_LABEL[d]}</span>
                    <span className="mi-elan-piste"><span className="mi-elan-barre" style={{ width: `${(ELAN[d] / 6) * 100}%`, background: COULEUR[d] }} /></span>
                    <span className="mi-elan-val">{ELAN[d]}</span>
                  </li>
                ))}
              </ul>
              <p className="mi-vide">Il grandit quand les trois lieux avancent ensemble.</p>
            </div>

            <div className="mi-carte">
              <div className="mi-carte-ligne">
                <h2>L’équipe</h2>
                <span>{CATALOGUE.length} agents · 3 lieux</span>
              </div>
              {ORDRE.filter((id) => LIEUX[id].domaine).map((id) => (
                <div key={id} className="mi-equipe-lieu">
                  <button className="mi-equipe-titre" onClick={() => { if (!occupe) { setTiroir('replie'); setMode('visite'); setEnMain(null); if (!(vue === 'interieur' && lieuCourant === id)) { if (vue === 'interieur') return; entrer(id) } } }}>
                    <span className="mi-point" style={{ background: LIEUX[id].couleur }} />
                    <strong>{LIEUX[id].nom}</strong>
                    <span>{LIEUX[id].sousTitre} · {attenteLieu(id)} à valider</span>
                  </button>
                  <div className="mi-puces">
                    {agentsDe(id).map((a) => (
                      <button key={a.id} className={`mi-puce${attente.has(a.id) ? ' mi-puce-attente' : ''}`} onClick={() => rejoindre(a)} disabled={occupe}>
                        {a.nom}{attente.has(a.id) && <span className="mi-puce-point" aria-label="à valider" />}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            </div>
          </section>
        </>

        {/* Iris de transition, façon jeu */}
        {(phase === 'iris-ferme' || phase === 'iris-ouvre') && (
          <div className={`mi-iris mi-iris-${phase === 'iris-ferme' ? 'ferme' : 'ouvre'}`} aria-hidden>
            <div className="mi-iris-trou" />
          </div>
        )}
      </div>

      <aside className="mi-notes">
        <h1>Maquette : l’île façon Animal Crossing</h1>
        <p>Une île, des lieux que l’on dispose où l’on veut, un personnage qui y entre. Dedans, les agents IA travaillent à leur poste : on va les voir, ils racontent ce qu’ils ont préparé, on valide ou pas. Sous l’île, le tableau de bord.</p>
        <h2>À essayer</h2>
        <ul>
          <li><strong>Touche un lieu</strong> : le personnage marche jusqu’à la porte, elle s’ouvre, on entre.</li>
          <li><strong>Le Jardin</strong> est en plein air : potager, ruche, arbre fruitier, et les agents qui travaillent dehors.</li>
          <li><strong>Zoom</strong> : pincement, molette, boutons + et −, double-tap pour recentrer.</li>
          <li><strong>À l’intérieur</strong>, touche un agent : il te parle et te propose quelque chose à valider.</li>
          <li><strong>Tableau de bord</strong> : tire le tiroir sous l’île (ou touche sa poignée). « Y aller » envoie le personnage voir l’agent.</li>
          <li><strong>Signes de vie</strong> : fumée, vapeur, fenêtres éclairées, drapeau levé, robot au portillon quand un agent attend.</li>
          <li><strong>Disposer</strong> : prends un lieu, pose-le sur de l’herbe libre.</li>
        </ul>
        <h2>Les lieux</h2>
        <ul className="mi-legende">
          {ORDRE.map((id) => (
            <li key={id}><span className="mi-point" style={{ background: LIEUX[id].couleur }} /> <strong>{LIEUX[id].nom}</strong> · {LIEUX[id].sousTitre}{LIEUX[id].domaine ? ` · ${agentsDe(id).length} agents` : ' · le bureau du jour'}</li>
          ))}
        </ul>
      </aside>
    </div>
  )
}
