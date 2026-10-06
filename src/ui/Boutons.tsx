import './boutons.css'

type Variante = 'plein' | 'contour' | 'doux'

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  domaine?: 'boite' | 'peau' | 'planete'
}

export function Bouton({ variante = 'plein', domaine, className = '', ...rest }: Props) {
  const cls = `btn btn-${variante}${domaine ? ` btn-${domaine}` : ''} ${className}`
  return <button className={cls} {...rest} />
}
