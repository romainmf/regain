import { useCallback, useEffect, useRef, useState } from 'react'
import { cle, type Pos } from './lieux'

/** Déplace le personnage d'une tuile à l'autre, à vitesse constante. */
export function useMarcheur(depart: Pos) {
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
export function trouverChemin(de: Pos, vers: Pos, praticable: (x: number, y: number) => boolean): Pos[] {
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
