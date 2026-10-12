import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './design/tokens.css'
import './design/app.css'
import { App } from './App'
import { Maquette } from './screens/Maquette'

const maquette = import.meta.env.DEV && window.location.pathname === '/maquette'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {maquette ? <Maquette /> : <App />}
  </StrictMode>,
)
