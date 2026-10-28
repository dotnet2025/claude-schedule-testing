import { expect, test } from '@playwright/test'
import { login, loginAsAdmin, uid } from './helpers'

test('TC-CMP-E2E-001 admin creates, views, edits, deactivates and deletes a company', async ({ page }) => {
  const code = `E2E${uid().toUpperCase()}`
  await loginAsAdmin(page)
  await page.getByRole('link', { name: 'Company Master' }).first().click()
  await expect(page.getByRole('heading', { name: 'Company Master' })).toBeVisible()

  await page.getByRole('button', { name: 'Add company' }).click()
  let dlg = page.getByRole('dialog')
  await dlg.getByRole('button', { name: 'Save' }).click()
  await expect(dlg.getByText('Company code is required')).toBeVisible()
  await dlg.getByLabel('Company code').fill(code)
  await dlg.getByLabel('Company name').fill('E2E Company')
  await dlg.getByLabel('Website').fill('https://e2e.example.com')
  await dlg.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Company saved')).toBeVisible()

  await page.getByLabel('Search companies').fill(code)
  await expect(page.getByRole('cell', { name: code })).toBeVisible()

  // duplicate code is rejected by the server
  await page.getByRole('button', { name: 'Add company' }).click()
  dlg = page.getByRole('dialog')
  await dlg.getByLabel('Company code').fill(code)
  await dlg.getByLabel('Company name').fill('Duplicate')
  await dlg.getByRole('button', { name: 'Save' }).click()
  await expect(dlg.getByText(/already exists/)).toBeVisible()
  await dlg.getByRole('button', { name: 'Cancel' }).click()

  await page.getByRole('button', { name: `View ${code}` }).click()
  await expect(page.getByRole('dialog').getByLabel('Company name')).toBeDisabled()
  await page.getByRole('dialog').getByRole('button', { name: 'Close' }).click()

  await page.getByRole('button', { name: `Edit ${code}` }).click()
  await page.getByRole('dialog').getByLabel('Company name').fill('E2E Company Renamed')
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('cell', { name: 'E2E Company Renamed' })).toBeVisible()

  await page.getByLabel(`Deactivate ${code}`).click()
  await expect(page.getByText('Company deactivated')).toBeVisible()
  await expect(page.getByText('Inactive').first()).toBeVisible()

  await page.getByRole('button', { name: `Delete ${code}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Company deleted')).toBeVisible()
})

test('TC-USR-E2E-001 admin manages a user: create, sign in by username, reset password, deactivate', async ({ page, browser }) => {
  const id = uid()
  const email = `um-${id}@example.com`
  const username = `um.${id}`
  await loginAsAdmin(page)
  await page.goto('/admin/masters/users')
  await page.getByRole('button', { name: 'Add user' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.getByLabel('First name').fill('Una')
  await dlg.getByLabel('Last name').fill('Master')
  await dlg.getByLabel('Username').fill(username)
  await dlg.getByLabel('Email').fill(email)
  await dlg.getByLabel('Password').fill('Initial123!')
  await dlg.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('User saved')).toBeVisible()

  // the new user can sign in with the username
  const ctx = await browser.newContext()
  const p2 = await ctx.newPage()
  await login(p2, username, 'Initial123!')
  await expect(p2.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // admin resets the password; old fails, new works
  await page.getByLabel('Search users').fill(email)
  await page.getByRole('button', { name: `Reset password ${email}` }).click()
  await page.getByRole('dialog').getByLabel('New password', { exact: true }).fill('Changed123!')
  await page.getByRole('dialog').getByLabel('Confirm new password').fill('Changed123!')
  await page.getByRole('dialog').getByRole('button', { name: 'Reset password' }).click()
  await expect(page.getByText('Password reset')).toBeVisible()
  const p3 = await (await browser.newContext()).newPage()
  await login(p3, email, 'Initial123!')
  await expect(p3.getByText('Invalid email or password.')).toBeVisible()
  await login(p3, email, 'Changed123!')
  await expect(p3.getByRole('heading', { name: 'Dashboard' })).toBeVisible()

  // deactivate: sign-in is refused
  await page.getByLabel(`Deactivate ${email}`).click()
  await expect(page.getByText('User deactivated')).toBeVisible()
  const p4 = await (await browser.newContext()).newPage()
  await login(p4, email, 'Changed123!')
  await expect(p4.getByText('Invalid email or password.')).toBeVisible()
})

test('TC-USR-E2E-002 legacy /admin/users URL redirects to User Master', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/users')
  await expect(page).toHaveURL(/\/admin\/masters\/users$/)
  await expect(page.getByRole('heading', { name: 'User Master' })).toBeVisible()
})
