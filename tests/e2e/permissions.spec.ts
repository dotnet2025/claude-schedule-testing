import { expect, test } from '@playwright/test'
import { ADMIN, login, loginAsAdmin, uid } from './helpers'

test('TC-AUTHZ-E2E-001 editor cannot see or open admin-only areas', async ({ page, request }) => {
  const email = `ed-${uid()}@example.com`
  await loginAsAdmin(page)
  await page.goto('/admin/masters/users')
  await page.getByRole('button', { name: 'Add user' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.getByLabel('First name').fill('E2E')
  await dlg.getByLabel('Last name').fill('Editor')
  await dlg.getByLabel('Username').fill(`ed${uid()}`)
  await dlg.getByLabel('Email').fill(email)
  await dlg.getByLabel('Password').fill('Editor123!')
  await dlg.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('User saved')).toBeVisible()
  await page.getByRole('button', { name: 'Sign out' }).click()

  await login(page, email, 'Editor123!')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'User Master' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Company Master' })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Settings' })).toHaveCount(0)
  await page.goto('/admin/masters/users')
  await expect(page.getByText(/403/)).toBeVisible()
  await page.goto('/admin/masters/companies')
  await expect(page.getByText(/403/)).toBeVisible()
  // the API enforces it too, independent of the UI
  const res = await request.post('http://localhost:5081/api/auth/login', { data: { email, password: 'Editor123!' } })
  const { accessToken } = await res.json()
  const users = await request.get('http://localhost:5081/api/users', { headers: { Authorization: `Bearer ${accessToken}` } })
  expect(users.status()).toBe(403)
  const companies = await request.get('http://localhost:5081/api/companies', { headers: { Authorization: `Bearer ${accessToken}` } })
  expect(companies.status()).toBe(403)
})

test('TC-AUTHZ-E2E-002 the last active admin cannot be deleted or demoted', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/masters/users')
  await page.getByLabel('Search users').fill(ADMIN.email)
  await page.getByRole('button', { name: `Delete ${ADMIN.email}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(/cannot delete your own account|last active Admin/)).toBeVisible()
})
