import { NavLink } from 'react-router-dom'
import type { Meteo } from '../domain/economy'
import type { SaisieKind } from '../domain/propositions'
import { BrinAvatar } from './BrinAvatar'
import { IconeGraine } from './icons'
import './entete.css'

interface Props {
  graines: number
  meteo: Meteo
  /** Ouvre la saisie, éventuellement déjà positionnée sur un type. */
  onSaisie: (kind?: SaisieKind) => void
  onBrin: () => void
  onReglages: () => void
}

export const formatElan = (e: number) => '×' + e.toFixed(1).replace('.', ',')

const SAISON: Record<Meteo, string> = {
  soleil: 'Grand soleil',
  voile: 'Ciel voilé',
  brume: 'Brume douce',
}

const PUCES: { kind: SaisieKind; label: string }[] = [
  { kind: 'mission_terminee', label: 'Mission finie' },
  { kind: 'grosse_journee', label: 'Grosse journée' },
  { kind: 'trajet', label: 'Trajet' },
]

/** En-tête : nom du lieu, barre de saisie, saison, graines, Brin, réglages. */
export function EnTete({ graines, meteo, onSaisie, onBrin, onReglages }: Props) {
  return (
    <header className="entete">
      <div className="entete-ligne">
        <div className="entete-marque">
          <h1 className="entete-titre">Regain</h1>
          <p className="entete-sous">Mon lieu · Appartement-atelier</p>
        </div>
        <div className="entete-droite">
          <span className={`pastille pastille-saison pastille-${meteo}`} aria-label={`Saison : ${SAISON[meteo]}`}>
            <span aria-hidden>{meteo === 'soleil' ? '☀' : meteo === 'voile' ? '⛅' : '🌫'}</span> {SAISON[meteo]}
          </span>
          <NavLink to="/construire" className="pastille pastille-graines" aria-label={`${graines} graines, ouvrir Construire`}>
            <IconeGraine /> {graines} <span className="pastille-mot">graines</span>
          </NavLink>
          <button className="entete-brin" onClick={onBrin} aria-label="Parler à Brin">
            <BrinAvatar taille={34} />
          </button>
          <button className="entete-reglages" onClick={onReglages} aria-label="Réglages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8l1.8-1.8M18 6l1.8-1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>

      <div className="entete-saisie">
        <button className="saisie-barre action-saisir" onClick={() => onSaisie()}>
          <span className="saisie-barre-texte">Qu’est-ce qui s’est passé ? « mission finie », « trajet »…</span>
          <span className="saisie-barre-bouton" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </button>
        <div className="entete-puces">
          {PUCES.map((p) => (
            <button key={p.kind} className="puce" onClick={() => onSaisie(p.kind)}>{p.label}</button>
          ))}
        </div>
      </div>
    </header>
  )
}
