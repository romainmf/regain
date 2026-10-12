import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './db'
import { exporterIle, importerIle, toutEffacer, validerSauvegarde } from './exportImport'

beforeEach(async () => {
  await toutEffacer()
})

describe('export / import', () => {
  it('exporte puis réimporte sans perte', async () => {
    await db.agents.add({ id: 'a1', nom: 'Test', domaine: 'boite', missions: ['m'], autonomie: 'prepare', actif: true, validations: 3, createdAt: 1 })
    await db.placements.add({ id: 'p1', kind: 'batiment', refId: 'a1', x: 2, y: 2 })
    await db.graines.add({ id: 'g1', ts: 1, domaine: 'boite', montant: 10, motif: 'validation' })

    const sauvegarde = await exporterIle()
    await toutEffacer()
    expect(await db.agents.count()).toBe(0)

    await importerIle(sauvegarde)
    expect(await db.agents.count()).toBe(1)
    const a = await db.agents.get('a1')
    expect(a?.nom).toBe('Test')
    expect(a?.validations).toBe(3)
    expect(await db.graines.count()).toBe(1)
  })

  it('valide la forme d’une sauvegarde', () => {
    expect(validerSauvegarde({ app: 'regain', agents: [], placements: [], saisies: [], propositions: [], graines: [], meta: [] })).toBe(true)
    expect(validerSauvegarde({ app: 'autre', agents: [] })).toBe(false)
    expect(validerSauvegarde(null)).toBe(false)
    expect(validerSauvegarde({ app: 'regain', agents: 'nope' })).toBe(false)
  })
})
