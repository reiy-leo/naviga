import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './i18n/i18n.js'
import './styles/index.css'
import { HeroUIProvider } from './components/HeroUIProvider.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HeroUIProvider>
      <App />
    </HeroUIProvider>
  </React.StrictMode>,
)
