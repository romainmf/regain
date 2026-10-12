import { useState } from 'react'
import { useJeu } from '../data/jeu'
import { SAISIE_LABEL, type SaisieData, type SaisieKind } from '../domain/propositions'
import { Bouton } from './Boutons'
import { Sheet } from './Sheet'
import './saisie.css'

const ORDRE: SaisieKind[] = ['mission_terminee', 'encaissement', 'grosse_journee', 'trajet']

const ICONE: Record<SaisieKind, string> = {
  mission_terminee: '✓',
  encaissement: '€',
  grosse_journee: '☀',
  trajet: '→',
}

export function SaisieRapide({ ouvert, onFermer }: { ouvert: boolean; onFermer: () => void }) {
  const { saisir } = useJeu()
  const [kind, setKind] = useState<SaisieKind | null>(null)
  const [data, setData] = useState<SaisieData>({})
  const [envoi, setEnvoi] = useState(false)

  const reset = () => {
    setKind(null)
    setData({})
  }
  const fermer = () => {
    reset()
    onFermer()
  }

  const enregistrer = async () => {
    if (!kind) return
    setEnvoi(true)
    await saisir(kind, data)
    setEnvoi(false)
    fermer()
  }

  return (
    <Sheet
      ouvert={ouvert}
      onFermer={fermer}
      titre="Saisie rapide"
      pied={
        kind && (
          <>
            <Bouton variante="doux" onClick={reset} style={{ flex: '0 0 auto' }}>Retour</Bouton>
            <Bouton onClick={enregistrer} disabled={envoi} style={{ flex: 1 }}>
              {envoi ? 'Enregistrement…' : 'Enregistrer'}
            </Bouton>
          </>
        )
      }
    >
      {!kind ? (
        <>
          <p className="saisie-intro">Dis à tes agents ce qui vient d’arriver. Ils prépareront la suite, tu valideras.</p>
          <div className="saisie-choix">
            {ORDRE.map((k) => (
              <button key={k} className="saisie-type" onClick={() => setKind(k)}>
                <span className="saisie-icone" aria-hidden>{ICONE[k]}</span>
                {SAISIE_LABEL[k]}
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="saisie-form">
          <h3>{SAISIE_LABEL[kind]}</h3>

          {kind === 'mission_terminee' && (
            <>
              <Champ label="Client" value={data.client ?? ''} onChange={(v) => setData({ ...data, client: v })} placeholder="Atelier Garance" />
              <ChampNombre label="Montant (€)" value={data.montant} onChange={(v) => setData({ ...data, montant: v })} placeholder="480" />
            </>
          )}

          {kind === 'encaissement' && (
            <ChampNombre label="Montant encaissé (€)" value={data.montant} onChange={(v) => setData({ ...data, montant: v })} placeholder="600" />
          )}

          {kind === 'grosse_journee' && (
            <p className="saisie-note">C’est noté. Rythme veillera à te proposer un vrai moment de pause.</p>
          )}

          {kind === 'trajet' && (
            <>
              <Champ label="Destination" value={data.destination ?? ''} onChange={(v) => setData({ ...data, destination: v })} placeholder="Lyon" />
              <label className="saisie-switch">
                <input type="checkbox" checked={!!data.basCarbone} onChange={(e) => setData({ ...data, basCarbone: e.target.checked })} />
                <span className="mission-case" aria-hidden />
                <span>J’ai choisi l’option bas carbone</span>
              </label>
            </>
          )}
        </div>
      )}
    </Sheet>
  )
}

function Champ({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label className="champ">
      <span>{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} autoComplete="off" />
    </label>
  )
}

function ChampNombre({ label, value, onChange, placeholder }: { label: string; value?: number; onChange: (v: number | undefined) => void; placeholder?: string }) {
  return (
    <label className="champ">
      <span>{label}</span>
      <input
        type="number"
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
        placeholder={placeholder}
      />
    </label>
  )
}
