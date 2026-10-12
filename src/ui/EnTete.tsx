import { IconeElan, IconeGraine } from './icons'
import './entete.css'

interface Props {
  graines: number
  elan: number
  onReglages?: () => void
}

export const formatElan = (e: number) => '×' + e.toFixed(1).replace('.', ',')

export function EnTete({ graines, elan, onReglages }: Props) {
  return (
    <header className="entete">
      <h1 className="entete-titre">Regain</h1>
      <div className="entete-compteurs">
        <span className="pastille pastille-graines" aria-label={`${graines} graines`}>
          <IconeGraine /> {graines}
        </span>
        <span className="pastille pastille-elan" aria-label={`Élan ${formatElan(elan)}`}>
          <IconeElan /> {formatElan(elan)}
        </span>
        {onReglages && (
          <button className="entete-reglages" onClick={onReglages} aria-label="Réglages">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2.5v2.5M12 19v2.5M4.2 4.2l1.8 1.8M18 18l1.8 1.8M2.5 12h2.5M19 12h2.5M4.2 19.8l1.8-1.8M18 6l1.8-1.8" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
    </header>
  )
}
