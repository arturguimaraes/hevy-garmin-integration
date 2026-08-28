import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ThemeProvider } from '@/components/config'
import { HevyProvider } from '@/components/hevy'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <HevyProvider>
        <App />
      </HevyProvider>
    </ThemeProvider>
  </StrictMode>,
)
