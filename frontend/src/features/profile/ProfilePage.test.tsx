import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/server'
import { renderApp } from '../../test/utils'
import { admin, withSession } from '../../test/handlers'
import ProfilePage, { validatePasswordChange } from './ProfilePage'

describe('validatePasswordChange()', () => {
  it('mirrors the backend password rule', () => {
    expect(validatePasswordChange('', '', '').current).toBeDefined()
    expect(validatePasswordChange('old', 'short1', 'short1').next).toMatch(/8/)
    expect(validatePasswordChange('old', 'lettersonly', 'lettersonly').next).toMatch(/letter and a digit/)
    expect(validatePasswordChange('old', 'Valid1234', 'different').confirm).toBeDefined()
    expect(validatePasswordChange('old', 'Valid1234', 'Valid1234')).toEqual({})
  })
})

describe('ProfilePage', () => {
  it('shows the account and submits a password change once valid', async () => {
    let payload: Record<string, unknown> = {}
    server.use(withSession(admin), http.post('*/api/auth/change-password', async ({ request }) => { payload = (await request.json()) as Record<string, unknown>; return new HttpResponse(null, { status: 204 }) }))
    renderApp(<ProfilePage />)
    expect(await screen.findByText('admin@example.com')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText('Current password is required')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Current password'), 'Old12345')
    await userEvent.type(screen.getByLabelText('New password'), 'NewPass123')
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'NewPass123')
    await userEvent.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByText('Password changed')).toBeInTheDocument()
    expect(payload).toEqual({ currentPassword: 'Old12345', newPassword: 'NewPass123' })
  })
})
