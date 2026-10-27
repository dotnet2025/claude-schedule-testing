import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './app/App'
import { AuthProvider } from './app/AuthContext'
import { ToastProvider } from './app/Toast'

const theme = createTheme({ palette: { primary: { main: '#2b50aa' } }, shape: { borderRadius: 8 } })

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider theme={theme}><CssBaseline />
      <BrowserRouter><ToastProvider><AuthProvider><App /></AuthProvider></ToastProvider></BrowserRouter>
    </ThemeProvider>
  </StrictMode>,
)
