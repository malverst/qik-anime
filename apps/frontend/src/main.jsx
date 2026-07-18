import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import App from './app/App.jsx'
import { AuthProvider } from '@fsd/app/providers/AuthContext.jsx'
import { ThemeProvider } from '@fsd/app/providers/ThemeContext.jsx'
import { initImageFallback } from '@fsd/shared/api/client.js'
import './app/styles/index.css'

initImageFallback()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
)

// Register PWA service worker (production only)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker.register('/sw.js').catch(() => {})
}
