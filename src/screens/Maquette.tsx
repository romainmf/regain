import { useMemo } from 'react'
import type { PlacementVue } from '../island/Island'
import { Island } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import '../design/tokens.css'

/**
 * Maquette de comparaison (dev) : l'île actuelle (un bâtiment par agent)
 * face à la version « les trois lieux » (un lieu signature par domaine,
 * étoffé par les modules des agents). Mêmes agents des deux côtés.
 */
const P = (id: string, x: number, y: number, batiment: PlacementVue['batiment'], domaine: PlacementVue['domaine'], niveau: 1 | 2 | 3 = 1, sansRobot = false): PlacementVue => ({
  id, x, y, batiment, domaine, niveau, libelle: id, sansRobot,
})

/** A — aujourd'hui : chaque agent a son bâtiment. */
const ACTUEL: PlacementVue[] = [
  P('factures', 1, 3, 'cabane', 'boite', 2),
  P('relance', 2, 5, 'boite-aux-lettres', 'boite'),
  P('vigie', 0, 2, 'tour-de-guet', 'boite'),
  P('rythme', 4, 1, 'pergola', 'peau', 2),
  P('cloture', 6, 1, 'lanterne', 'peau'),
  P('miroir', 3, 2, 'bassin', 'peau'),
  P('empreinte', 5, 4, 'serre', 'planete', 2),
  P('sobriete', 3, 5, 'composteur', 'planete'),
  P('deplacements', 4, 6, 'petit-rail', 'planete'),
]

/** C — chaque domaine est un grand lieu : les agents se posent sur le quadrillage intérieur. */
const LIEUX_ENTIERS: PlacementVue[] = [
  P('factures', 1, 3, 'cabane', 'boite', 2),
  P('relance', 2, 5, 'boite-aux-lettres', 'boite'),
  P('vigie', 0, 2, 'tour-de-guet', 'boite'),
  P('rythme', 5, 1, 'pergola', 'peau', 2),
  P('cloture', 6, 2, 'lanterne', 'peau'),
  P('miroir', 2, 1, 'banc', 'peau'),
  P('empreinte', 5, 4, 'serre', 'planete', 2),
  P('sobriete', 3, 5, 'composteur', 'planete'),
  P('deplacements', 4, 6, 'petit-rail', 'planete'),
]

export function Maquette() {
  const tuiles = useMemo(tuilesDeDepart, [])
  const styleCol: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }
  const titre: React.CSSProperties = { fontFamily: 'var(--titre)', fontSize: 20, margin: 0, color: 'var(--encre)' }
  const sous: React.CSSProperties = { margin: 0, fontSize: 13, color: 'var(--texte-2)' }
  return (
    <div style={{ background: 'var(--fond)', minHeight: '100vh', padding: 20, fontFamily: 'var(--texte)' }}>
      <h1 style={{ ...titre, fontSize: 24, marginBottom: 4 }}>Maquette : comment représenter les agents ?</h1>
      <p style={{ ...sous, marginBottom: 16 }}>Mêmes agents des deux côtés. Élan ×1,3, plein soleil.</p>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={styleCol}>
          <h2 style={titre}>A · Aujourd’hui</h2>
          <p style={sous}>Un bâtiment par agent, posé dans sa zone, avec son robot.</p>
          <Island tuiles={tuiles} placements={ACTUEL} elan={1.3} meteo="soleil" />
        </div>
        <div style={styleCol}>
          <h2 style={titre}>C · Un lieu par domaine, sur toute la zone</h2>
          <p style={sous}>L’Atelier couvre toute Ma boîte, le Spa toute Ma peau, le Jardin toute Ma planète. À l’intérieur, le quadrillage reste là pour poser les agents.</p>
          <Island tuiles={tuiles} placements={LIEUX_ENTIERS} elan={1.3} meteo="soleil" lieux />
        </div>
      </div>
    </div>
  )
}
