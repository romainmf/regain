import { useState } from 'react'
import { useJeu } from '../data/jeu'
import { AMBIANCES, DECORS, EXPANSION, PRIX_TUILE, type DecorItem } from '../domain/boutique'
import { Decor } from '../island/Decor'
import { STYLES_MUR, STYLES_SOL, type StyleMur, type StyleSol } from '../island/LieuxZones'
import { DOMAINE_LABEL, type Domaine } from '../domain/types'
import { Bouton } from './Boutons'
import { IconeGraine } from './icons'
import './boutique.css'

type Onglet = 'construction' | 'ambiances' | 'decor' | 'tuiles'

const LIEUX: Domaine[] = ['boite', 'peau', 'planete']
const NOM_LIEU: Record<Domaine, string> = { boite: 'Atelier', peau: 'Spa', planete: 'Jardin' }

/** Rayons de la boutique ; `onPoser` est appelé quand un décor part se poser sur le plan. */
export function BoutiqueContenu({ onPoser }: { onPoser: () => void }) {
  const {
    economie, ambianceActive, ambiancesPossedees, tuilesAchetees, acheterAmbiance, activerAmbiance, acheterTuile, demarrerPoseDecor,
    murs, sols, stylesPossedes, choisirMur, choisirSol,
  } = useJeu()
  const [onglet, setOnglet] = useState<Onglet>('construction')
  const [msg, setMsg] = useState<string | null>(null)
  const solde = economie.solde

  const flash = (t: string) => {
    setMsg(t)
    window.setTimeout(() => setMsg(null), 2600)
  }

  const poserDecor = (d: DecorItem) => {
    if (solde < d.prix) return flash('Pas assez de graines.')
    demarrerPoseDecor(d.id, d.prix)
    onPoser()
  }

  const tuilesRestantes = EXPANSION.length - tuilesAchetees

  return (
    <div className="bq">
      <div className="bq-solde">
        <IconeGraine /> {solde} graines
      </div>
      {msg && <div className="bq-msg" role="status">{msg}</div>}

      <div className="segment" role="tablist" aria-label="Rayons">
        <button role="tab" aria-selected={onglet === 'construction'} className={onglet === 'construction' ? 'actif' : ''} onClick={() => setOnglet('construction')}>Construction</button>
        <button role="tab" aria-selected={onglet === 'ambiances'} className={onglet === 'ambiances' ? 'actif' : ''} onClick={() => setOnglet('ambiances')}>Ambiances</button>
        <button role="tab" aria-selected={onglet === 'decor'} className={onglet === 'decor' ? 'actif' : ''} onClick={() => setOnglet('decor')}>Décor</button>
        <button role="tab" aria-selected={onglet === 'tuiles'} className={onglet === 'tuiles' ? 'actif' : ''} onClick={() => setOnglet('tuiles')}>Tuiles</button>
      </div>

      {onglet === 'construction' && (
        <div className="bq-construction">
          <p className="bq-aide">Murs et sols de chaque lieu. Les trois premiers sont offerts ; les couleurs des domaines ne changent jamais.</p>
          {LIEUX.map((lieu) => (
            <section key={lieu} className="bq-lieu">
              <h3 className={`bq-lieu-titre pastille-${lieu}`}>{NOM_LIEU[lieu]} · {DOMAINE_LABEL[lieu]}</h3>
              <div className="bq-rangee">
                <span className="bq-rangee-nom">Murs</span>
                {(Object.keys(STYLES_MUR) as StyleMur[]).map((k) => {
                  const s = STYLES_MUR[k]
                  const actif = murs[lieu] === k
                  const possede = s.prix === 0 || stylesPossedes.includes(`mur:${k}`)
                  return (
                    <button
                      key={k}
                      className={`bq-pastille${actif ? ' bq-pastille-on' : ''}`}
                      style={{ background: s.fond }}
                      title={`${s.nom}${possede ? '' : ` · ${s.prix} graines`}`}
                      aria-label={`${s.nom}${possede ? '' : `, ${s.prix} graines`}`}
                      aria-pressed={actif}
                      disabled={!possede && solde < s.prix}
                      onClick={async () => { (await choisirMur(lieu, k)) ? flash(`${NOM_LIEU[lieu]} : murs ${s.nom.toLowerCase()}.`) : flash('Pas assez de graines.') }}
                    >
                      {!possede && <span className="bq-pastille-prix">{s.prix}</span>}
                    </button>
                  )
                })}
              </div>
              <div className="bq-rangee">
                <span className="bq-rangee-nom">Sols</span>
                {(Object.keys(STYLES_SOL) as StyleSol[]).map((k) => {
                  const s = STYLES_SOL[k]
                  const actif = sols[lieu] === k
                  const possede = s.prix === 0 || stylesPossedes.includes(`sol:${k}`)
                  return (
                    <button
                      key={k}
                      className={`bq-pastille${actif ? ' bq-pastille-on' : ''}`}
                      style={{ background: s.fond ?? `var(--${lieu}-sol)` }}
                      title={`${s.nom}${possede ? '' : ` · ${s.prix} graines`}`}
                      aria-label={`${s.nom}${possede ? '' : `, ${s.prix} graines`}`}
                      aria-pressed={actif}
                      disabled={!possede && solde < s.prix}
                      onClick={async () => { (await choisirSol(lieu, k)) ? flash(`${NOM_LIEU[lieu]} : sol ${s.nom.toLowerCase()}.`) : flash('Pas assez de graines.') }}
                    >
                      {!possede && <span className="bq-pastille-prix">{s.prix}</span>}
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {onglet === 'ambiances' && (
        <ul className="bq-liste">
          {AMBIANCES.map((a) => {
            const possede = ambiancesPossedees.includes(a.id)
            const active = ambianceActive === a.id
            return (
              <li key={a.id} className="bq-item">
                <span className={`bq-ambiance bq-ambiance-${a.id}`} aria-hidden />
                <div className="bq-txt">
                  <strong>{a.nom}</strong>
                  <span className="bq-prix">{a.prix === 0 ? 'Offerte' : `${a.prix} graines`}</span>
                </div>
                {active ? (
                  <span className="bq-active">Active</span>
                ) : possede ? (
                  <Bouton variante="contour" onClick={() => activerAmbiance(a.id)}>Activer</Bouton>
                ) : (
                  <Bouton disabled={solde < a.prix} onClick={async () => { (await acheterAmbiance(a.id, a.prix)) ? flash(`${a.nom} activée.`) : flash('Pas assez de graines.') }}>
                    Acheter
                  </Bouton>
                )}
              </li>
            )
          })}
        </ul>
      )}

      {onglet === 'decor' && (
        <ul className="bq-liste">
          {DECORS.map((d) => (
            <li key={d.id} className="bq-item">
              <svg width={46} height={40} viewBox="-24 -34 48 44" aria-hidden className="bq-decor">
                <ellipse cx={0} cy={2} rx={16} ry={6} fill="var(--planete-teinte)" />
                <Decor id={d.id} />
              </svg>
              <div className="bq-txt">
                <strong>{d.nom}</strong>
                <span className="bq-prix">{d.prix} graines</span>
              </div>
              <Bouton domaine="planete" disabled={solde < d.prix} onClick={() => poserDecor(d)}>Poser</Bouton>
            </li>
          ))}
        </ul>
      )}

      {onglet === 'tuiles' && (
        <div className="bq-tuiles">
          <p className="bq-aide">Agrandis ton lieu : chaque tuile coûte {PRIX_TUILE} graines et transforme un bout de jardin en pièce.</p>
          <p className="bq-reste">{tuilesRestantes > 0 ? `${tuilesRestantes} tuile${tuilesRestantes > 1 ? 's' : ''} disponible${tuilesRestantes > 1 ? 's' : ''}` : 'Ton île est à sa taille maximale pour la bêta.'}</p>
          <Bouton
            disabled={solde < PRIX_TUILE || tuilesRestantes === 0}
            style={{ width: '100%' }}
            onClick={async () => { (await acheterTuile()) ? flash('Une nouvelle tuile a poussé !') : flash('Pas assez de graines.') }}
          >
            Agrandir l’île ({PRIX_TUILE})
          </Bouton>
        </div>
      )}
    </div>
  )
}
