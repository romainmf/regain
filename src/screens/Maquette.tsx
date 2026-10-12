import { useMemo, useState } from 'react'
import type { Domaine } from '../domain/types'
import { DOMAINE_LABEL } from '../domain/types'
import type { DecorVue, PlacementVue } from '../island/Island'
import { Island } from '../island/Island'
import { tuilesDeDepart } from '../island/iso'
import { MURS_DEFAUT, SOLS_DEFAUT, STYLES_MUR, STYLES_SOL, type StyleMur, type StyleSol } from '../island/LieuxZones'
import '../design/tokens.css'

/**
 * Maquette (dev) : l'île pleine, avec les seize agents du catalogue à leur
 * poste, le mobilier des lieux et du décor de la boutique. Murs et sols se
 * changent avec la palette, comme dans le rayon Construction.
 */
const P = (id: string, x: number, y: number, poste: PlacementVue['poste'], domaine: Domaine, niveau: 1 | 2 | 3 = 1): PlacementVue => ({
  id, x, y, batiment: 'cabane', poste, domaine, niveau, libelle: id,
})

const AGENTS: PlacementVue[] = [
  // Atelier · Ma boîte
  P('factures', 1, 4, 'factures', 'boite', 3),
  P('relance', 2, 7, 'relance', 'boite', 2),
  P('vigie', 0, 3, 'vigie', 'boite'),
  P('coussin', 2, 5, 'coussin', 'boite', 2),
  P('don', 3, 6, 'don', 'boite'),
  // Spa · Ma peau
  P('rythme', 6, 1, 'rythme', 'peau', 3),
  P('cloture', 8, 2, 'cloture', 'peau'),
  P('regulateur', 3, 2, 'regulateur', 'peau', 2),
  P('air', 1, 0, 'air', 'peau'),
  P('lien', 2, 2, 'lien', 'peau', 2),
  P('miroir', 3, 1, 'miroir', 'peau'),
  // Jardin · Ma planète
  P('empreinte', 6, 5, 'empreinte', 'planete', 3),
  P('sobriete', 4, 7, 'sobriete', 'planete', 2),
  P('deplacements', 5, 8, 'deplacements', 'planete'),
  P('achats', 5, 4, 'achats', 'planete', 2),
  P('label', 7, 6, 'label', 'planete'),
]

const DECORS: DecorVue[] = [
  { id: 'd1', x: 1, y: 1, decorId: 'fleurs' },
  { id: 'd2', x: 1, y: 7, decorId: 'banc' },
  { id: 'd3', x: 7, y: 3, decorId: 'lampadaire' },
  { id: 'd4', x: 3, y: 0, decorId: 'massif' },
  { id: 'd5', x: 8, y: 7, decorId: 'haie' },
  { id: 'd6', x: 4, y: 5, decorId: 'fleurs' },
  { id: 'd7', x: 4, y: 8, decorId: 'massif' },
]

const ZONES: Domaine[] = ['boite', 'peau', 'planete']
const LIEU: Record<Domaine, string> = { boite: 'Atelier', peau: 'Spa', planete: 'Jardin' }
const NOMS: Record<string, string> = {
  factures: 'Factures', relance: 'Relance douce', vigie: 'Vigie trésorerie', coussin: 'Coussin fiscal', don: 'Don à impact',
  rythme: 'Rythme', cloture: 'Clôture', regulateur: 'Régulateur de charge', air: 'Compagnon d’air', lien: 'Anti-isolement', miroir: 'Miroir doux',
  empreinte: 'Empreinte', sobriete: 'Sobriété numérique', deplacements: 'Déplacements', achats: 'Achats alignés', label: 'Label vivant',
}

export function Maquette() {
  const tuiles = useMemo(tuilesDeDepart, [])
  const [murs, setMurs] = useState<Record<Domaine, StyleMur>>(MURS_DEFAUT)
  const [sols, setSols] = useState<Record<Domaine, StyleSol>>(SOLS_DEFAUT)

  const h2: React.CSSProperties = { fontFamily: 'var(--titre)', fontSize: 20, margin: 0, color: 'var(--encre)' }
  const sous: React.CSSProperties = { margin: 0, fontSize: 13, color: 'var(--texte-2)' }
  const pastille = (fond: string, actif: boolean) => ({
    width: 26, height: 26, borderRadius: 8, background: fond, border: actif ? '2.5px solid var(--encre)' : '1.5px solid var(--ligne)', cursor: 'pointer', padding: 0,
  } as React.CSSProperties)

  return (
    <div style={{ background: 'var(--fond)', minHeight: '100vh', padding: 20, fontFamily: 'var(--texte)', color: 'var(--encre)' }}>
      <h1 style={{ ...h2, fontSize: 24, marginBottom: 4 }}>Maquette : l’île pleine, seize agents à leur poste</h1>
      <p style={{ ...sous, marginBottom: 14 }}>
        Trois lieux vitrés, mobilier propre à chaque lieu, un poste de travail par agent, décor de la boutique. Les niveaux (1 à 3) suivent l’usage : plante qui grandit, écran ou badge en plus.
      </p>

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
        <div style={{ flex: '0 0 68%', minWidth: 0 }}>
          <Island tuiles={tuiles} placements={AGENTS} decors={DECORS} elan={1.4} meteo="soleil" lieux murs={murs} sols={sols} />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ZONES.map((z) => (
            <section key={z}>
              <h2 style={{ ...h2, fontSize: 16, color: `var(--${z})` }}>{LIEU[z]} · {DOMAINE_LABEL[z]}</h2>
              <ul style={{ ...sous, margin: '4px 0 0', paddingLeft: 16, lineHeight: 1.5 }}>
                {AGENTS.filter((a) => a.domaine === z).map((a) => (
                  <li key={a.id}>{NOMS[a.id]} <span style={{ opacity: 0.6 }}>· niveau {a.niveau}</span></li>
                ))}
              </ul>
            </section>
          ))}
          <p style={sous}>Décor : fleurs, banc, lampadaire, massifs, haie.</p>
        </div>
      </div>
    </div>
  )
}
