import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Agents } from './screens/Agents'
import { CreerAgent } from './screens/CreerAgent'
import { Galerie } from './screens/Galerie'
import { MonIle } from './screens/MonIle'
import { Aujourdhui } from './screens/Aujourdhui'
import { Construire } from './screens/Construire'
import { BottomNav } from './ui/BottomNav'
import { JeuProvider } from './data/jeu'
import { FicheAgent } from './ui/FicheAgent'
import { Onboarding } from './ui/Onboarding'
import { GuideTour } from './ui/GuideTour'
import { PorteBeta, porteRequise } from './ui/PorteBeta'
import { useJeu } from './data/jeu'

function Intro() {
  const { phaseIntro } = useJeu()
  if (phaseIntro === 'onboarding') return <Onboarding />
  if (phaseIntro === 'tour') return <GuideTour />
  return null
}

export function App() {
  const [bloque, setBloque] = useState(porteRequise)
  if (bloque) return <PorteBeta onEntrer={() => setBloque(false)} />

  return (
    <JeuProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <div className="telephone">
          <main className="app">
            <Routes>
              <Route path="/" element={<MonIle />} />
              <Route path="/aujourdhui" element={<Aujourdhui />} />
              <Route path="/equipe" element={<Agents />} />
              <Route path="/construire" element={<Construire />} />
              <Route path="/agents" element={<Navigate to="/equipe" replace />} />
              <Route path="/creer" element={<CreerAgent />} />
              {import.meta.env.DEV && <Route path="/galerie" element={<Galerie />} />}
            </Routes>
          </main>
          <BottomNav />
          <FicheAgent />
          <Intro />
        </div>
      </BrowserRouter>
    </JeuProvider>
  )
}
