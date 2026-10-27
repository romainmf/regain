import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useJeu } from '../data/jeu'
import { getTemplate } from '../domain/catalog'
import { getAmbiance } from '../domain/boutique'
import { COULEUR } from '../domain/couleurs'
import { niveauBatiment } from '../domain/progression'
import type { SaisieKind } from '../domain/propositions'
import { DOMAINE_LABEL } from '../domain/types'
import { IleScene, type AgentVue } from '../island/ac/IleScene'
import { InterieurScene } from '../island/ac/InterieurScene'
import {
  BUREAU_MAISON, ENTREE_INT, LIEUX, ORDRE, PLACE, cle, construireIle, dansPorte, devantPorte, emprise, lieuDe, placeTuiles, slotsPour,
  type Ancre, type LieuId, type Pos, type Slot,
} from '../island/ac/lieux'
import { trouverChemin, useMarcheur } from '../island/ac/marcheur'
import { STYLES_MUR, STYLES_SOL } from '../island/LieuxZones'
import { nuance } from '../island/buildings/primitives'
import { BrinChat } from '../ui/BrinChat'
import { enregistrerActions, publierEtat } from '../ui/visite/pilote'
import { getMeta } from '../data/db'
import { useLiveQuery } from 'dexie-react-hooks'
import { CarteProposition } from '../ui/CarteProposition'
import { EnTete, formatElan } from '../ui/EnTete'
import { FileValidation } from '../ui/FileValidation'
import { BrinCarte, ElanSemaine, EquipeBref, FriseChaine, Regenere } from '../ui/Panneaux'
import { Reglages } from '../ui/Reglages'
import { SaisieRapide } from '../ui/SaisieRapide'
import { HAUTEUR_TIROIR, Tiroir, type PositionTiroir } from '../ui/Tiroir'
import { ZoomPan } from '../ui/ZoomPan'
import './monlieu.css'
import './monile.css'

type Phase = null | 'porte' | 'iris-ferme' | 'iris-ouvre'
type Dialogue =
  | { type: 'agent'; agent: AgentVue }
  | { type: 'bureau' }
  | { type: 'info'; texte: string }

/**
 * Mon île : ton lieu, façon jeu. Des maisons et un jardin que l'on dispose,
 * un personnage qui y entre, les agents à leur poste qui te parlent. Sous
 * l'île, le tableau de bord en tiroir ; sur ordinateur, en colonnes.
 */
export function MonIle() {
  const {
    pret, agents, aValider, agentsEnAttente, economie, decors, ambianceActive, murs, sols,
    positionsLieux, deplacerLieu, poseEnCours, poser, annulerPose, retirerDecor, ouvrirFiche,
    visiteDemandee, effacerVisite, tuilesAchetees,
  } = useJeu()

  // L'île grandit avec les tuiles achetées dans la boutique.
  const { tuiles, fonds, estTerre } = useMemo(() => construireIle(tuilesAchetees), [tuilesAchetees])
  const index = useMemo(() => new Map(tuiles.map((t) => [cle(t.x, t.y), t])), [tuiles])
  const ambiance = getAmbiance(ambianceActive)

  // Les agents tels que l'île les dessine.
  const agentsVue = useMemo<AgentVue[]>(
    () => agents.map((a) => {
      const t = a.templateId ? getTemplate(a.templateId) : undefined
      return { id: a.id, nom: a.nom, domaine: a.domaine, poste: t?.poste ?? 'generique', niveau: niveauBatiment(a.validations), templateId: a.templateId, attente: agentsEnAttente.has(a.id) }
    }),
    [agents, agentsEnAttente],
  )
  const agentsDe = useCallback((id: LieuId) => agentsVue.filter((a) => a.domaine === LIEUX[id].domaine), [agentsVue])
  const attenteLieu = (id: LieuId) => agentsDe(id).filter((a) => a.attente).length

  // ——— État de la scène ———
  const [mode, setMode] = useState<'visite' | 'disposer'>('visite')
  const [enMain, setEnMain] = useState<LieuId | null>(null)
  const [vue, setVue] = useState<'ile' | 'interieur'>('ile')
  const [lieuCourant, setLieuCourant] = useState<LieuId | null>(null)
  const [transition, setTransition] = useState<{ lieu: LieuId; sens: 'entrer' | 'sortir' } | null>(null)
  const [phase, setPhase] = useState<Phase>(null)
  const [dialogue, setDialogue] = useState<Dialogue | null>(null)
  const [brinOuvert, setBrinOuvert] = useState(false)
  const [saisie, setSaisie] = useState<{ ouverte: boolean; kind?: SaisieKind }>({ ouverte: false })
  const [reglagesOuverts, setReglagesOuverts] = useState(false)
  const [tiroir, setTiroir] = useState<PositionTiroir>('replie')
  const [glisse, setGlisse] = useState<number | null>(null)
  const [salut, setSalut] = useState(false)
  const dernierSalut = useRef(0)
  const cadre = useRef<HTMLDivElement>(null)
  // Sur ordinateur, pas de tiroir : l'île se centre dans son cadre.
  const [large, setLarge] = useState(() => typeof matchMedia === 'function' && matchMedia('(min-width: 1024px)').matches)
  useEffect(() => {
    if (typeof matchMedia !== 'function') return
    const mq = matchMedia('(min-width: 1024px)')
    const maj = () => setLarge(mq.matches)
    mq.addEventListener('change', maj)
    return () => mq.removeEventListener('change', maj)
  }, [])
  const { pos, enMarche, versGauche, aller, suivre, actuelle, poser: poserPerso } = useMarcheur({ x: 5, y: 8 })
  /** Une fois entré, aller voir cet agent ; une fois sorti, entrer dans ce lieu. */
  const apresEntree = useRef<string | null>(null)
  const apresSortie = useRef<LieuId | null>(null)

  const lieux = positionsLieux

  // Pour marcher : les emprises des lieux et l'arbre bloquent, la place et la plage se traversent.
  const obstacles = useMemo(() => {
    const s = new Set<string>([cle(PLACE.x, PLACE.y)])
    ORDRE.forEach((id) => emprise(lieux[id], LIEUX[id].taille).forEach(([x, y]) => s.add(cle(x, y))))
    return s
  }, [lieux])
  const marcherVers = useCallback((vers: Pos, ensuite?: () => void) => {
    suivre(trouverChemin(actuelle(), vers, (x, y) => index.has(cle(x, y)) && !obstacles.has(cle(x, y))), ensuite)
  }, [actuelle, index, obstacles, suivre])

  // Un lieu se pose sur de l'herbe, à une tuile au moins des autres et de la place.
  const peutPoser = useCallback((id: LieuId, a: Ancre) => {
    const autres = new Set<string>(placeTuiles)
    ORDRE.filter((m) => m !== id).forEach((m) =>
      emprise(lieux[m], LIEUX[m].taille).forEach(([x, y]) => {
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) autres.add(cle(x + dx, y + dy))
      }),
    )
    return emprise(a, LIEUX[id].taille).every(([x, y]) => index.get(cle(x, y))?.terrain === 'herbe' && !autres.has(cle(x, y)))
  }, [lieux, index])

  const occupe = phase !== null

  const voirAgent = useCallback((a: AgentVue, slot: Slot) => {
    setDialogue(null)
    aller({ x: slot.ax, y: slot.ay }, () => setDialogue({ type: 'agent', agent: a }))
  }, [aller])

  const entrer = useCallback((id: LieuId) => {
    const a = lieux[id], n = LIEUX[id].taille
    setDialogue(null)
    marcherVers(devantPorte(a, n), () => {
      setTransition({ lieu: id, sens: 'entrer' })
      setPhase('porte')
      aller(dansPorte(a, n))
    })
  }, [lieux, aller, marcherVers])

  // Transitions : porte qui s'ouvre, iris qui se ferme, changement de vue, iris qui s'ouvre.
  useEffect(() => {
    if (!phase) return
    const reduit = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
    const duree = reduit ? 40 : phase === 'porte' ? 300 : 520
    const t = setTimeout(() => {
      if (phase === 'porte') setPhase('iris-ferme')
      else if (phase === 'iris-ferme') {
        if (transition?.sens === 'entrer') {
          setVue('interieur')
          setLieuCourant(transition.lieu)
          poserPerso(ENTREE_INT)
        } else if (transition?.sens === 'sortir') {
          setVue('ile')
          setLieuCourant(null)
          poserPerso(devantPorte(lieux[transition.lieu], LIEUX[transition.lieu].taille))
        }
        setPhase('iris-ouvre')
      } else if (phase === 'iris-ouvre') {
        setPhase(null)
        setTransition(null)
        if (transition?.sens === 'entrer') {
          const suite = apresEntree.current
          apresEntree.current = null
          const dedans = agentsDe(transition.lieu)
          const i = suite ? dedans.findIndex((a) => a.id === suite) : -1
          const slots = slotsPour(transition.lieu, dedans.length)
          if (i >= 0 && slots[i]) voirAgent(dedans[i], slots[i])
        } else if (transition?.sens === 'sortir' && apresSortie.current) {
          const vers = apresSortie.current
          apresSortie.current = null
          entrer(vers)
        }
      }
    }, duree)
    return () => clearTimeout(t)
    // `entrer` et `agentsDe` changent à chaque rendu, mais ne sont lus qu'au moment du minuteur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, transition, lieux, poserPerso, voirAgent])

  // Brin salue quand on passe à côté de lui (pas plus d'une fois toutes les six secondes).
  useEffect(() => {
    if (vue !== 'ile' || !enMarche) return
    const d = Math.hypot(pos.x - PLACE.x, pos.y - PLACE.y)
    const maintenant = Date.now()
    if (d < 2.1 && maintenant - dernierSalut.current > 6000) {
      dernierSalut.current = maintenant
      setSalut(true)
    }
  }, [pos, enMarche, vue])
  useEffect(() => {
    if (!salut) return
    const t = setTimeout(() => setSalut(false), 1800)
    return () => clearTimeout(t)
  }, [salut])

  /** Aller voir un agent, où qu'il soit (depuis le tableau de bord, après un recrutement). */
  const rejoindre = useCallback((a: AgentVue) => {
    if (occupe) return
    const id = lieuDe(a.domaine)
    setTiroir('replie')
    setMode('visite')
    setEnMain(null)
    const dedans = agentsDe(id)
    const i = dedans.findIndex((x) => x.id === a.id)
    if (vue === 'interieur' && lieuCourant === id) {
      const slots = slotsPour(id, dedans.length)
      if (slots[i]) voirAgent(a, slots[i])
      return
    }
    apresEntree.current = a.id
    setDialogue(null)
    if (vue === 'interieur' && lieuCourant) {
      apresSortie.current = id
      aller(ENTREE_INT, () => {
        setTransition({ lieu: lieuCourant, sens: 'sortir' })
        setPhase('iris-ferme')
      })
      return
    }
    entrer(id)
  }, [occupe, agentsDe, vue, lieuCourant, voirAgent, aller, entrer])

  // Après un recrutement ou depuis une fiche : on va voir l'agent demandé dès qu'il est là.
  useEffect(() => {
    if (!pret || !visiteDemandee) return
    const a = agentsVue.find((x) => x.id === visiteDemandee)
    if (!a) return
    effacerVisite()
    const t = setTimeout(() => rejoindre(a), 250)
    return () => clearTimeout(t)
  }, [pret, visiteDemandee, agentsVue, effacerVisite, rejoindre])

  // Les postes ne se déplacent plus un par un : les agents vivent dans leur lieu.
  useEffect(() => {
    if (poseEnCours?.kind === 'batiment') annulerPose()
  }, [poseEnCours, annulerPose])

  const toucherLieu = (id: LieuId) => {
    if (occupe || poseEnCours) return
    if (mode === 'disposer') {
      setEnMain(enMain === id ? null : id)
      return
    }
    entrer(id)
  }

  const toucherTuile = (x: number, y: number) => {
    if (mode !== 'disposer' || !enMain) return
    const a = { x, y }
    if (peutPoser(enMain, a)) {
      void deplacerLieu(enMain, a)
      setEnMain(null)
    } else {
      const n = LIEUX[enMain].taille
      setDialogue({ type: 'info', texte: `Pas ici : il faut ${n} tuiles sur ${n} d’herbe, à une tuile des autres lieux et de la place.` })
    }
  }

  const sortir = () => {
    if (occupe || !lieuCourant) return
    setDialogue(null)
    aller(ENTREE_INT, () => {
      setTransition({ lieu: lieuCourant, sens: 'sortir' })
      setPhase('iris-ferme')
    })
  }

  const voirBureau = () => {
    if (occupe) return
    setDialogue(null)
    aller({ x: BUREAU_MAISON.ax, y: BUREAU_MAISON.ay }, () => setDialogue({ type: 'bureau' }))
  }

  const parlerBrin = () => {
    if (occupe || mode === 'disposer' || poseEnCours) return
    setDialogue(null)
    marcherVers({ x: PLACE.x + 0.2, y: PLACE.y + 1.4 }, () => setBrinOuvert(true))
  }

  const prenom = useLiveQuery(() => getMeta<string>('prenom', ''), [], '') ?? ''
  // Le conseil de Brin : le lieu où le plus de choses attendent.
  const conseil = ORDRE.filter((id) => LIEUX[id].domaine)
    .map((id) => ({ id, n: attenteLieu(id) }))
    .filter((c) => c.n > 0)
    .sort((a, b) => b.n - a.n)[0]
  const texteBrin = salut ? `Coucou${prenom ? ` ${prenom}` : ''} !` : conseil ? `${LIEUX[conseil.id].nom} t’attend : ${conseil.n} à relire` : agents.length === 0 ? 'Recrute ton premier agent !' : 'Tout est à jour, bravo !'

  // Ce que la visite guidée a besoin de savoir et de faire.
  useEffect(() => {
    const ouvert = dialogue?.type === 'agent' ? dialogue.agent : null
    const lieuConseille = conseil?.id ?? null
    const dedans = lieuConseille ? agentsDe(lieuConseille) : []
    const agentConseille = (dedans.find((a) => a.attente) ?? dedans[0])?.nom ?? null
    publierEtat({
      vue, lieu: lieuCourant, agentOuvert: ouvert?.id ?? null,
      attenteAgentOuvert: ouvert ? aValider.filter((p) => p.agentId === ouvert.id).length : 0,
      lieuConseille, agentConseille, tiroirOuvert: tiroir !== 'replie', occupe, large,
    })
  })
  useEffect(() => {
    enregistrerActions({
      entrer: (id) => { if (!occupe) entrer(id) },
      sortir,
      voirAgent: () => {
        const dedans = lieuCourant ? agentsDe(lieuCourant) : []
        const slots = lieuCourant ? slotsPour(lieuCourant, dedans.length) : []
        const i = Math.max(0, dedans.findIndex((a) => a.attente))
        if (!occupe && dedans[i] && slots[i]) voirAgent(dedans[i], slots[i])
      },
      ouvrirTiroir: () => setTiroir('moitie'),
    })
  })
  useEffect(() => () => enregistrerActions(null), [])


  const nomCourant = lieuCourant ? LIEUX[lieuCourant] : null
  const agentsCourants = lieuCourant ? agentsDe(lieuCourant) : []
  const slotsCourants = lieuCourant ? slotsPour(lieuCourant, agentsCourants.length) : []
  const porteOuverte = transition && (phase === 'porte' || phase === 'iris-ferme') ? transition.lieu : null
  const poseDecor = poseEnCours?.kind === 'decor'
  const apercu = aValider.slice(0, 3)

  // Murs et sol de la pièce, choisis dans la boutique.
  const murInt = nomCourant?.domaine ? nuance(STYLES_MUR[murs[nomCourant.domaine]].fond, 0.5) : nomCourant?.murInt ?? '#F7EEDC'
  const solInt: [string, string] = (() => {
    if (!nomCourant) return ['#E3B99A', '#D9AA89']
    const d = nomCourant.domaine
    if (!d) return nomCourant.sol
    const fond = STYLES_SOL[sols[d]].fond
    return fond ? [fond, nuance(fond, -0.07)] : nomCourant.sol
  })()

  return (
    <div className="ecran mon-ile">
      <EnTete
        graines={economie.solde}
        meteo={economie.meteo}
        onSaisie={(kind) => setSaisie({ ouverte: true, kind })}
        onBrin={() => setBrinOuvert(true)}
        onReglages={() => setReglagesOuverts(true)}
      />

      <div className="lieu-grille">
        <aside className="lieu-col lieu-col-gauche">
          <section className="panneau">
            <div className="panneau-ligne">
              <h2 className="panneau-titre">Aujourd’hui</h2>
              <span className="panneau-compte">{aValider.length} à valider · Toute l’île</span>
            </div>
            <FileValidation />
          </section>
        </aside>

        <div className="lieu-col lieu-col-centre">
          {poseDecor && (
            <div className="pose-bandeau" role="status">
              <span>Pose ton décor : touche une tuile d’herbe surlignée.</span>
              <button className="pose-annuler" onClick={annulerPose}>Annuler</button>
            </div>
          )}
          <div className="ile-cadre" ref={cadre} style={{ ['--tiroir' as string]: glisse != null ? `${glisse}px` : HAUTEUR_TIROIR[tiroir] }}>
            <div className="ile-scene" aria-live="polite">
              {vue === 'ile' ? (
                <ZoomPan commandes>
                  <IleScene
                    tuiles={tuiles}
                    fonds={fonds}
                    estTerre={estTerre}
                    lieux={lieux}
                    agents={agentsVue}
                    perso={{ pos, enMarche, versGauche }}
                    mode={mode}
                    enMain={enMain}
                    porteOuverte={porteOuverte}
                    peutPoser={peutPoser}
                    decors={decors}
                    poseDecor={poseDecor}
                    onPoserDecor={(x, y) => void poser(x, y)}
                    onRetirerDecor={(id) => void retirerDecor(id)}
                    ambiance={ambiance}
                    meteo={economie.meteo}
                    repos={economie.repos}
                    elan={economie.elan}
                    murs={murs}
                    salut={salut}
                    texteBrin={mode === 'visite' && !poseDecor ? texteBrin : ''}
                    conseil={conseil?.id ?? null}
                    onBrin={parlerBrin}
                    onBulleBrin={() => { if (conseil && !occupe && !salut) entrer(conseil.id) }}
                    onLieu={toucherLieu}
                    onTuile={toucherTuile}
                    centreY={large ? 0.5 : 0.4}
                  />
                </ZoomPan>
              ) : (
                lieuCourant && (
                  <div className={`ile-interieur${LIEUX[lieuCourant].genre === 'jardin' ? ' ile-interieur-dehors' : ''}${ambiance.astre === 'lune' ? ' ile-interieur-nuit' : ''}`}>
                    <InterieurScene
                      id={lieuCourant}
                      agents={agentsCourants}
                      slots={slotsCourants}
                      perso={{ pos, enMarche, versGauche }}
                      nbAttente={aValider.length}
                      murInt={murInt}
                      sol={solInt}
                      nuit={ambiance.astre === 'lune'}
                      onAgent={(a, s) => { if (!occupe) voirAgent(a, s) }}
                      onBureau={voirBureau}
                      onSortir={sortir}
                    />
                  </div>
                )
              )}
            </div>

            {/* Habillage : titre, boutons, bulle de dialogue */}
            <div className="ile-hud">
              <div className="ile-haut">
                {vue === 'ile' ? (
                  <>
                    <div className="ile-titre elan-badge">
                      <strong>Mon île</strong>
                      <span>{aValider.length} à valider · {formatElan(economie.elan)} élan</span>
                    </div>
                    {mode === 'visite' ? (
                      <button className="ile-bouton" onClick={() => { setMode('disposer'); setDialogue(null) }} disabled={occupe || !!poseEnCours}>⌂ Disposer</button>
                    ) : (
                      <button className="ile-bouton ile-bouton-plein" onClick={() => { setMode('visite'); setEnMain(null); setDialogue(null) }}>Terminé</button>
                    )}
                  </>
                ) : (
                  <>
                    <button className="ile-bouton" onClick={sortir} disabled={occupe}>← Sortir</button>
                    {nomCourant && (
                      <div className="ile-titre ile-titre-droite">
                        <strong><span className="ile-point" style={{ background: nomCourant.couleur }} /> {nomCourant.nom}</strong>
                        <span>{nomCourant.sousTitre}{agentsCourants.length ? ` · ${agentsCourants.length} agent${agentsCourants.length > 1 ? 's' : ''}` : ''}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {mode === 'disposer' && vue === 'ile' && (
                <p className="ile-aide" role="status">
                  {enMain ? `Touche une tuile d’herbe pour y poser ${LIEUX[enMain].nom}.` : 'Touche un lieu pour le prendre.'}
                </p>
              )}
              {vue === 'interieur' && agentsCourants.length === 0 && nomCourant?.domaine && (
                <p className="ile-aide" role="status">
                  Personne ici pour l’instant. <NavLink to="/equipe">Recruter un agent {DOMAINE_LABEL[nomCourant.domaine]}</NavLink>
                </p>
              )}

              {dialogue && (
                <div className="ile-dialogue" role="dialog" aria-live="polite">
                  {dialogue.type === 'agent' && (() => {
                    const a = dialogue.agent
                    const siennes = aValider.filter((p) => p.agentId === a.id)
                    const t = a.templateId ? getTemplate(a.templateId) : undefined
                    return (
                      <>
                        <div className="ile-nom" style={{ background: COULEUR[a.domaine] }}>{a.nom} <small>· {DOMAINE_LABEL[a.domaine]}</small></div>
                        {siennes.length > 0 ? (
                          <>
                            <CarteProposition p={siennes[0]} compacte />
                            {siennes.length > 1 && <p className="ile-plus">… et {siennes.length - 1} autre{siennes.length > 2 ? 's' : ''}. <NavLink to="/aujourdhui">Tout voir</NavLink></p>}
                          </>
                        ) : (
                          <p>{t?.mission ?? `Je m’occupe de : ${agents.find((x) => x.id === a.id)?.missions.join(', ') ?? 'ce que tu me confies'}.`} Rien en attente pour l’instant.</p>
                        )}
                        <div className="ile-actions">
                          <button className="ile-bouton" onClick={() => ouvrirFiche(a.id)}>Sa fiche</button>
                          <button className="ile-bouton" onClick={() => setDialogue(null)}>Fermer</button>
                        </div>
                      </>
                    )
                  })()}
                  {dialogue.type === 'bureau' && (
                    <>
                      <div className="ile-nom" style={{ background: '#D9A24B' }}>Le bureau du jour</div>
                      {aValider.length === 0 ? (
                        <p>Rien à relire : tout est validé. Va souffler au Spa.</p>
                      ) : (
                        <ul className="ile-liste">
                          {apercu.map((p) => (
                            <li key={p.id}><CarteProposition p={p} compacte /></li>
                          ))}
                          {aValider.length > 3 && <li className="ile-plus">… et {aValider.length - 3} autres. <NavLink to="/aujourdhui">Tout voir</NavLink></li>}
                        </ul>
                      )}
                      <div className="ile-actions">
                        <button className="ile-bouton" onClick={() => setDialogue(null)}>Fermer</button>
                      </div>
                    </>
                  )}
                  {dialogue.type === 'info' && (
                    <>
                      <p>{dialogue.texte}</p>
                      <div className="ile-actions">
                        <button className="ile-bouton" onClick={() => setDialogue(null)}>D’accord</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Mobile : le tableau de bord en tiroir, par-dessus l'île */}
            <Tiroir
              position={tiroir}
              onPosition={setTiroir}
              glisse={glisse}
              onGlisse={setGlisse}
              cadre={cadre}
              bande={
                <div className="ile-chiffres">
                  <div className="ile-chiffre"><strong>{aValider.length}</strong><span>à valider</span></div>
                  <div className="ile-chiffre"><strong>{formatElan(economie.elan)}</strong><span>élan</span></div>
                  <div className="ile-chiffre"><strong>{economie.solde}</strong><span>graines</span></div>
                  <div className="ile-chiffre"><strong>{economie.recoltes}</strong><span>récolte{economie.recoltes > 1 ? 's' : ''}</span></div>
                </div>
              }
            >
              <BrinCarte onOuvrir={() => setBrinOuvert(true)} />
              <section className="panneau lieu-apercu">
                <div className="panneau-ligne">
                  <h2 className="panneau-titre">Aujourd’hui</h2>
                  <NavLink to="/aujourdhui" className="lieu-lien">{aValider.length} à valider · Tout voir</NavLink>
                </div>
                {apercu.length === 0 ? (
                  <p className="val-vide">Rien à valider. Dis à tes agents ce qui s’est passé.</p>
                ) : (
                  <ul className="val-liste">
                    {apercu.map((p) => {
                      const a = agentsVue.find((x) => x.id === p.agentId)
                      return (
                        <li key={p.id}>
                          <CarteProposition p={p} compacte />
                          {a && <button className="ile-y-aller" onClick={() => rejoindre(a)} disabled={occupe}>Aller voir {a.nom} →</button>}
                        </li>
                      )
                    })}
                  </ul>
                )}
              </section>
              <FriseChaine />
              <ElanSemaine />
              <EquipeBref />
            </Tiroir>

            {(phase === 'iris-ferme' || phase === 'iris-ouvre') && (
              <div className={`ile-iris ile-iris-${phase === 'iris-ferme' ? 'ferme' : 'ouvre'}`} aria-hidden>
                <div className="ile-iris-trou" />
              </div>
            )}
          </div>

          {/* Ordinateur : sous l'île */}
          <div className="ile-sous">
            <BrinCarte onOuvrir={() => setBrinOuvert(true)} />
            <FriseChaine />
          </div>
        </div>

        <aside className="lieu-col lieu-col-droite">
          <ElanSemaine />
          <Regenere />
          <EquipeBref />
        </aside>
      </div>

      {!pret && <p className="mon-lieu-chargement">Ton île se réveille…</p>}

      <BrinChat ouvert={brinOuvert} onFermer={() => setBrinOuvert(false)} />
      <SaisieRapide ouvert={saisie.ouverte} kindInitial={saisie.kind} onFermer={() => setSaisie({ ouverte: false })} />
      <Reglages ouvert={reglagesOuverts} onFermer={() => setReglagesOuverts(false)} />
    </div>
  )
}
