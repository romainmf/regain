import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Agents } from './screens/Agents'
import { CreerAgent } from './screens/CreerAgent'
import { Galerie } from './screens/Galerie'
import { MonIle } from './screens/MonIle'
import { BottomNav } from './ui/BottomNav'
import { JeuProvider } from './data/jeu'
import { FicheAgent } from './ui/FicheAgent'

export function App() {
  return (
    <JeuProvider>
    <BrowserRouter>
      <div className="telephone">
        <main className="app">
          <Routes>
            <Route path="/" element={<MonIle />} />
            <Route path="/agents" element={<Agents />} />
            <Route path="/creer" element={<CreerAgent />} />
            {import.meta.env.DEV && <Route path="/galerie" element={<Galerie />} />}
          </Routes>
        </main>
        <BottomNav />
        <FicheAgent />
      </div>
    </BrowserRouter>
    </JeuProvider>
  )
}
