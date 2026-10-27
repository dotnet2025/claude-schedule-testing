import { expect, test } from '@playwright/test'
import { ADMIN, login, loginAsAdmin } from './helpers'

test.describe('authentication', () => {
  test('TC-AUTH-E2E-001 admin can log in and see the dashboard', async ({ page }) => {
    await loginAsAdmin(page)
    await expect(page.getByText(/Administrator \(Admin\)/)).toBeVisible()
  })

  test('TC-AUTH-E2E-002 invalid credentials show an error', async ({ page }) => {
    await login(page, ADMIN.email, 'wrong-password')
    await expect(page.getByText('Invalid email or password.')).toBeVisible()
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-E2E-003 anonymous visitor is redirected from /admin to /login', async ({ page }) => {
    await page.goto('/admin/pages')
    await expect(page).toHaveURL(/\/login/)
  })

  test('TC-AUTH-E2E-004 session survives a browser refresh and logout ends it', async ({ page }) => {
    await loginAsAdmin(page)
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
    await page.getByRole('button', { name: 'Sign out' }).click()
    await expect(page).toHaveURL(/\/login/)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/login/)
  })
})
