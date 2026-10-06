import { useEffect, useId } from 'react'
import './sheet.css'

interface Props {
  ouvert: boolean
  onFermer: () => void
  titre: string
  children: React.ReactNode
  /** Contenu épinglé en bas (boutons d'action). */
  pied?: React.ReactNode
}

/** Feuille qui remonte du bas de l'écran. Fond cliquable, Échap, focus-trap léger. */
export function Sheet({ ouvert, onFermer, titre, children, pied }: Props) {
  const titreId = useId()
  useEffect(() => {
    if (!ouvert) return
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [ouvert, onFermer])

  if (!ouvert) return null
  return (
    <div className="sheet-voile" onClick={onFermer}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="sheet-entete">
          <div className="sheet-poignee" aria-hidden />
          <div className="sheet-titre-ligne">
            <h2 id={titreId}>{titre}</h2>
            <button className="sheet-fermer" onClick={onFermer} aria-label="Fermer">
              <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
            </button>
          </div>
        </header>
        <div className="sheet-corps">{children}</div>
        {pied && <footer className="sheet-pied">{pied}</footer>}
      </section>
    </div>
  )
}
