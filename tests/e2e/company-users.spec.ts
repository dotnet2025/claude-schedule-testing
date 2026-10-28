import { expect, test } from '@playwright/test'
import { loginAsAdmin, uid } from './helpers'

// NOT RUN in the authoring environment (no browser/toolchain). Written against the documented UI.
test('TC-CU-E2E-001 admin creates a company, creates a user for it, edits and removes the assignment', async ({ page }) => {
  const code = `E2E${uid()}`.toUpperCase()
  await loginAsAdmin(page)
  await page.goto('/admin/masters/companies')
  await page.getByRole('button', { name: 'New company' }).click()
  await page.getByLabel('Company code').fill(code)
  await page.getByLabel('Company name').fill(`E2E ${code}`)
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Company created')).toBeVisible()
  await page.getByLabel(`Details ${code}`).click()
  await page.getByRole('tab', { name: /Users/ }).click()
  await expect(page.getByText(/No users are assigned to this company yet/)).toBeVisible()

  const name = uid()
  await page.getByRole('button', { name: 'Create new user' }).click()
  const dlg = page.getByRole('dialog')
  await dlg.getByLabel(/First name/).fill('Ann')
  await dlg.getByLabel(/Last name/).fill('Lee')
  await dlg.getByLabel(/Username/).fill(`u${name}`)
  await dlg.getByLabel(/Email/).fill(`u${name}@example.com`)
  await dlg.getByLabel(/Initial password/).fill('Passw0rd!')
  await dlg.getByLabel('Primary company').check()
  await dlg.getByRole('button', { name: 'Create user' }).click()
  await expect(page.getByText('User created and assigned')).toBeVisible()
  await expect(page.getByText(`u${name}@example.com`)).toBeVisible()

  await page.getByLabel(`Edit u${name}@example.com in ${code}`).click()
  await page.getByRole('dialog').getByLabel('Primary company').uncheck()
  await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click()
  await expect(page.getByText('Assignment updated')).toBeVisible()

  await page.getByLabel(`Remove u${name}@example.com from ${code}`).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click()
  await expect(page.getByText('Assignment removed')).toBeVisible()
  await expect(page.getByText('Inactive').first()).toBeVisible()

  await page.goto('/admin/masters/company-users')
  await expect(page.getByRole('heading', { name: 'Company Users' })).toBeVisible()
})
