import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider } from '@mui/material'
import App from './app/App'
import { AuthProvider } from './app/AuthContext'
import { ToastProvider } from './app/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import { theme } from './theme'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}><CssBaseline />
      <BrowserRouter>
        <ErrorBoundary><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></ErrorBoundary>
      </BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
