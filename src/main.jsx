import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import { initializeStorage } from './services/storage/storageBootstrap'
import './styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

async function startApp() {
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  )

  try {
    await initializeStorage()
  } catch (error) {
    console.warn('Storage initialization failed; continuing with localStorage fallback.', error)
  }
}

startApp()
