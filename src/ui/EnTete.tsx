import { IconeElan, IconeGraine } from './icons'
import './entete.css'

interface Props {
  graines: number
  elan: number
}

export const formatElan = (e: number) => '×' + e.toFixed(1).replace('.', ',')

export function EnTete({ graines, elan }: Props) {
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
      </div>
    </header>
  )
}
