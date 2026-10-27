import { describe, expect, it } from 'vitest'
import { EXPANSION_ILE, LIEUX, ORDRE, POSITIONS_DEPART, cle, construireIle, emprise, terreDeDepart } from './lieux'

describe('agrandissement de l’île', () => {
  it('les tuiles achetables sont de la mer au départ, chacune collée à la terre, sans doublon', () => {
    const vues = new Set<string>()
    for (const p of EXPANSION_ILE) {
      expect(terreDeDepart(p.x, p.y)).toBe(false)
      expect(vues.has(cle(p.x, p.y))).toBe(false)
      vues.add(cle(p.x, p.y))
    }
    // Chaque tuile touche l'île telle qu'elle est au moment de son achat.
    EXPANSION_ILE.forEach((p, i) => {
      const { estTerre } = construireIle(i)
      const collee = estTerre(p.x - 1, p.y) || estTerre(p.x + 1, p.y) || estTerre(p.x, p.y - 1) || estTerre(p.x, p.y + 1)
      expect(collee, `tuile ${i} (${p.x},${p.y})`).toBe(true)
    })
  })

  it('chaque tuile achetée ajoute une tuile de terre, et la plage recule', () => {
    const base = construireIle(0)
    const apres = construireIle(1)
    expect(apres.tuiles.length).toBe(base.tuiles.length + 1)
    const herbe = (ile: ReturnType<typeof construireIle>) => ile.tuiles.filter((t) => t.terrain === 'herbe').length
    expect(herbe(apres)).toBeGreaterThan(herbe(base))
    // La nouvelle tuile est du sable (au bord), et sa voisine d'avant n'est plus du sable.
    const neuve = apres.tuiles.find((t) => t.x === EXPANSION_ILE[0].x && t.y === EXPANSION_ILE[0].y)
    expect(neuve?.terrain).toBe('sable')
  })

  it('les lieux de départ tiennent sur l’herbe, à une tuile de la place et des autres', () => {
    const { tuiles } = construireIle(0)
    const herbe = new Set(tuiles.filter((t) => t.terrain === 'herbe').map((t) => cle(t.x, t.y)))
    for (const id of ORDRE) {
      for (const [x, y] of emprise(POSITIONS_DEPART[id], LIEUX[id].taille)) expect(herbe.has(cle(x, y)), `${id} (${x},${y})`).toBe(true)
    }
  })
})
