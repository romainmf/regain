import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Galerie } from './screens/Galerie'
import { MonIle } from './screens/MonIle'
import { Placeholder } from './screens/Placeholder'
import { BottomNav } from './ui/BottomNav'

export function App() {
  return (
    <BrowserRouter>
      <div className="telephone">
        <main className="app">
          <Routes>
            <Route path="/" element={<MonIle />} />
            <Route path="/agents" element={<Placeholder titre="Tes agents" texte="Le catalogue et ton équipe arrivent au jalon 2." />} />
            <Route path="/creer" element={<Placeholder titre="Créer un agent" texte="La création arrive au jalon 5." />} />
            {import.meta.env.DEV && <Route path="/galerie" element={<Galerie />} />}
          </Routes>
        </main>
        <BottomNav />
      </div>
    </BrowserRouter>
  )
}
