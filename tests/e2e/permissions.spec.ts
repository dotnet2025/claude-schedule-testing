import { expect, test } from '@playwright/test'
import { ADMIN, login, loginAsAdmin, uid } from './helpers'

test('TC-AUTHZ-E2E-001 editor cannot see or open admin-only areas', async ({ page, request }) => {
  const email = `ed-${uid()}@example.com`
  await loginAsAdmin(page)
  await page.goto('/admin/users')
  await page.getByRole('button', { name: 'New user' }).click()
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Display name').fill('E2E Editor')
  await page.getByLabel('Password').fill('Editor123!')
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('User saved')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()

  await login(page, email, 'Editor123!')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0)
  await page.goto('/admin/users')
  await expect(page.getByText(/403/)).toBeVisible()
  // the API enforces it too, independent of the UI
  const res = await request.post('http://localhost:5081/api/auth/login', { data: { email, password: 'Editor123!' } })
  const { accessToken } = await res.json()
  const users = await request.get('http://localhost:5081/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
  expect(users.status()).toBe(403)
})

test('TC-AUTHZ-E2E-002 the last active admin cannot be deleted or demoted', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/users')
  await page.getByLabel('Search users').fill(ADMIN.email)
  await page.getByRole('button', { name: `Delete ${ADMIN.email}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(/cannot delete your own account|last active Admin/)).toBeVisible()
})
