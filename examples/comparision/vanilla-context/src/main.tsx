import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CounterProvider } from './context/CounterContext'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <CounterProvider>
      <App />
    </CounterProvider>
  </StrictMode>,
)
