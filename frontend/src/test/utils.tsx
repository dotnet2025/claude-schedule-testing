import type { ReactElement } from 'react'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../app/AuthContext'
import { ToastProvider } from '../app/Toast'

export function renderApp(ui: ReactElement, route = '/') {
  return render(<MemoryRouter initialEntries={[route]}><ToastProvider><AuthProvider>{ui}</AuthProvider></ToastProvider></MemoryRouter>)
}
