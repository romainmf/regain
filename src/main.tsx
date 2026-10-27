import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import './design/app.css'
import { App } from './App'
import { Maquette } from './screens/Maquette'
import { MaquetteIle } from './screens/MaquetteIle'

const chemin = window.location.pathname
const maquette = import.meta.env.DEV && chemin === '/maquette'
const maquetteIle = import.meta.env.DEV && chemin === '/maquette-ile'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {maquetteIle ? <MaquetteIle /> : maquette ? <Maquette /> : <App />}
  </StrictMode>,
)
