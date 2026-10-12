import { useMemo, useState } from 'react'
import type { Domaine } from '../domain/types'
import { DOMAINE_LABEL } from '../domain/types'
import type { PlacementVue } from '../island/Island'
import { Island } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import { MURS_DEFAUT, SOLS_DEFAUT, STYLES_MUR, STYLES_SOL, type StyleMur, type StyleSol } from '../island/LieuxZones'
import '../design/tokens.css'

/**
 * Maquette (dev) : « un lieu par domaine » avec murs et sols personnalisables,
 * façon mode Construction des Sims. L'île de gauche suit les choix de la
 * palette ; celle de droite montre un autre jeu de matières, pour comparer.
 */
const P = (id: string, x: number, y: number, batiment: PlacementVue['batiment'], domaine: PlacementVue['domaine'], niveau: 1 | 2 | 3 = 1): PlacementVue => ({
  id, x, y, batiment, domaine, niveau, libelle: id,
})

const AGENTS: PlacementVue[] = [
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

const VARIANTE: { murs: Record<Domaine, StyleMur>; sols: Record<Domaine, StyleSol> } = {
  murs: { boite: 'pierre', peau: 'bambou', planete: 'terre' },
  sols: { boite: 'tomettes', peau: 'gravier', planete: 'gazon' },
}

const ZONES: Domaine[] = ['boite', 'peau', 'planete']
const LIEU: Record<Domaine, string> = { boite: 'Atelier', peau: 'Spa', planete: 'Jardin' }

export function Maquette() {
  const tuiles = useMemo(tuilesDeDepart, [])
  const [murs, setMurs] = useState<Record<Domaine, StyleMur>>(MURS_DEFAUT)
  const [sols, setSols] = useState<Record<Domaine, StyleSol>>(SOLS_DEFAUT)

  const col: React.CSSProperties = { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }
  const h2: React.CSSProperties = { fontFamily: 'var(--titre)', fontSize: 20, margin: 0, color: 'var(--encre)' }
  const sous: React.CSSProperties = { margin: 0, fontSize: 13, color: 'var(--texte-2)' }
  const pastille = (fond: string, actif: boolean) => ({
    width: 26, height: 26, borderRadius: 8, background: fond, border: actif ? '2.5px solid var(--encre)' : '1.5px solid var(--ligne)', cursor: 'pointer', padding: 0,
  } as React.CSSProperties)

  return (
    <div style={{ background: 'var(--fond)', minHeight: '100vh', padding: 20, fontFamily: 'var(--texte)', color: 'var(--encre)' }}>
      <h1 style={{ ...h2, fontSize: 24, marginBottom: 4 }}>Maquette : un lieu par domaine, murs et sols personnalisables</h1>
      <p style={{ ...sous, marginBottom: 14 }}>
        Façon mode Construction des Sims : murs abaissés côté caméra pour voir l’intérieur, façade haute au fond, revêtements au choix par lieu. Les couleurs de domaine ne changent jamais.
      </p>

      {/* Palette façon Sims */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', background: 'var(--surface)', border: '1px solid var(--ligne)', borderRadius: 16, padding: '12px 16px', marginBottom: 16 }}>
        {ZONES.map((z) => (
          <div key={z} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <strong style={{ fontSize: 13 }}>{LIEU[z]} · {DOMAINE_LABEL[z]}</strong>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...sous, width: 36 }}>Murs</span>
              {(Object.keys(STYLES_MUR) as StyleMur[]).map((k) => (
                <button key={k} title={STYLES_MUR[k].nom} aria-label={STYLES_MUR[k].nom} style={pastille(STYLES_MUR[k].fond, murs[z] === k)} onClick={() => setMurs({ ...murs, [z]: k })} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ ...sous, width: 36 }}>Sols</span>
              {(Object.keys(STYLES_SOL) as StyleSol[]).map((k) => (
                <button key={k} title={STYLES_SOL[k].nom} aria-label={STYLES_SOL[k].nom} style={pastille(STYLES_SOL[k].fond ?? `var(--${z}-sol)`, sols[z] === k)} onClick={() => setSols({ ...sols, [z]: k })} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={col}>
          <h2 style={h2}>Tes choix</h2>
          <p style={sous}>
            Murs : {ZONES.map((z) => `${LIEU[z]} ${STYLES_MUR[murs[z]].nom.toLowerCase()}`).join(' · ')}. Sols : {ZONES.map((z) => `${LIEU[z]} ${STYLES_SOL[sols[z]].nom.toLowerCase()}`).join(' · ')}.
          </p>
          <Island tuiles={tuiles} placements={AGENTS} elan={1.3} meteo="soleil" lieux murs={murs} sols={sols} />
        </div>
        <div style={col}>
          <h2 style={h2}>Autre jeu de matières</h2>
          <p style={sous}>Murs pierre sèche · bambou · terre crue. Sols tomettes · gravier · gazon.</p>
          <Island tuiles={tuiles} placements={AGENTS} elan={1.3} meteo="soleil" lieux murs={VARIANTE.murs} sols={VARIANTE.sols} />
        </div>
      </div>
    </div>
  )
}
