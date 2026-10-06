import { CATALOGUE } from '../domain/catalog'
import { COULEUR } from '../domain/couleurs'
import { Batiment } from '../island/buildings/Batiment'
import { Coeur } from '../island/Coeur'
import { losange } from '../island/iso'

/** Écran de développement : tous les bâtiments, trois niveaux. Route /galerie. */
export function Galerie() {
  const Case = ({ children }: { children: React.ReactNode }) => (
    <svg viewBox="-40 -80 80 100" width={110} height={138} style={{ background: 'var(--surface)', borderRadius: 12 }}>
      <polygon points={losange(0, 0)} fill="var(--coeur-sol)" />
      {children}
    </svg>
  )
  return (
    <div style={{ padding: 16 }}>
      <Case><Coeur /></Case>
      {CATALOGUE.map((a) => (
        <div key={a.id} style={{ marginTop: 12 }}>
          <strong>{a.nom}</strong> · {a.batimentNom}
          <div style={{ display: 'flex', gap: 8 }}>
            {([1, 2, 3] as const).map((n) => (
              <Case key={n}><Batiment id={a.batiment} couleur={COULEUR[a.domaine]} niveau={n} /></Case>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
