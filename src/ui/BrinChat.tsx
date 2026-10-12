import { useEffect, useId, useRef, useState } from 'react'
import { repondre, sujet, type Sujet } from '../domain/guide'
import { useJeu } from '../data/jeu'
import { BrinAvatar } from './BrinAvatar'
import './brin.css'

interface Message {
  id: number
  de: 'brin' | 'moi'
  texte: string
}

interface Props {
  ouvert: boolean
  onFermer: () => void
}

const DELAI_BULLE = 550

export function BrinChat({ ouvert, onFermer }: Props) {
  const { lancerVisite } = useJeu()
  const [messages, setMessages] = useState<Message[]>([])
  const [suites, setSuites] = useState<string[]>([])
  const [ecrit, setEcrit] = useState(false)
  const [saisie, setSaisie] = useState('')
  const compteur = useRef(0)
  const minuteurs = useRef<number[]>([])
  const fil = useRef<HTMLDivElement>(null)
  const champ = useRef<HTMLInputElement>(null)
  const titreId = useId()

  const ajouter = (de: Message['de'], texte: string) =>
    setMessages((m) => [...m, { id: compteur.current++, de, texte }])

  const parler = (s: Sujet) => {
    setSuites([])
    setEcrit(true)
    s.reponse.forEach((texte, i) => {
      minuteurs.current.push(
        window.setTimeout(() => {
          ajouter('brin', texte)
          if (i === s.reponse.length - 1) {
            setEcrit(false)
            setSuites(s.suites)
          }
        }, DELAI_BULLE * (i + 1)),
      )
    })
  }

  // Premier contact
  useEffect(() => {
    if (ouvert && messages.length === 0 && !ecrit) parler(sujet('accueil'))
    if (ouvert) champ.current?.focus({ preventScroll: true })
  }, [ouvert])

  useEffect(() => () => minuteurs.current.forEach(clearTimeout), [])

  useEffect(() => {
    fil.current?.scrollTo({ top: fil.current.scrollHeight, behavior: 'smooth' })
  }, [messages, ecrit, suites])

  useEffect(() => {
    if (!ouvert) return
    const echap = (e: KeyboardEvent) => e.key === 'Escape' && onFermer()
    window.addEventListener('keydown', echap)
    return () => window.removeEventListener('keydown', echap)
  }, [ouvert, onFermer])

  const choisir = (id: string) => {
    if (ecrit) return
    const s = sujet(id)
    ajouter('moi', s.question)
    parler(s)
  }

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault()
    const texte = saisie.trim()
    if (!texte || ecrit) return
    setSaisie('')
    ajouter('moi', texte)
    parler(repondre(texte))
  }

  if (!ouvert) return null

  return (
    <div className="brin-voile" onClick={onFermer}>
      <section
        className="brin-feuille"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titreId}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="brin-entete">
          <BrinAvatar taille={44} />
          <div>
            <h2 id={titreId}>Brin</h2>
            <p>Ton guide sur l’île</p>
          </div>
          <button
            className="brin-visite"
            onClick={() => {
              onFermer()
              lancerVisite()
            }}
            aria-label="Refaire la visite guidée"
            title="Refaire la visite guidée"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M20 12a8 8 0 1 1-2.3-5.6M20 4v4h-4" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <button className="brin-fermer" onClick={onFermer} aria-label="Fermer la discussion">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </button>
        </header>

        <div className="brin-fil" ref={fil} role="log" aria-live="polite">
          {messages.map((m) => (
            <p key={m.id} className={`bulle bulle-${m.de}`}>{m.texte}</p>
          ))}
          {ecrit && (
            <p className="bulle bulle-brin bulle-ecrit" aria-label="Brin écrit">
              <span /><span /><span />
            </p>
          )}
          {suites.length > 0 && (
            <div className="brin-suites">
              {suites.map((id) => (
                <button key={id} className="suggestion" onClick={() => choisir(id)}>
                  {sujet(id).question}
                </button>
              ))}
            </div>
          )}
        </div>

        <form className="brin-saisie" onSubmit={envoyer}>
          <label htmlFor="brin-champ" className="visuellement-cache">Pose ta question à Brin</label>
          <input
            id="brin-champ"
            ref={champ}
            value={saisie}
            onChange={(e) => setSaisie(e.target.value)}
            placeholder="Pose ta question…"
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" aria-label="Envoyer" disabled={!saisie.trim() || ecrit}>
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden><path d="M5 12h13M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </form>
      </section>
    </div>
  )
}
