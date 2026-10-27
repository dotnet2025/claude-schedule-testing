import { expect, test } from '@playwright/test'
import { loginAsAdmin, PNG, uid } from './helpers'

test('TC-MEDIA-E2E-001 upload, find, view details and delete an image', async ({ page }) => {
  const name = `pic-${uid()}.png`
  await loginAsAdmin(page)
  await page.goto('/admin/media')
  await page.getByLabel('Upload files').setInputFiles({ name, mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText(`Uploaded ${name}`)).toBeVisible()
  await page.getByLabel('Search by filename').fill(name)
  await expect(page.getByText(name, { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Details' }).click()
  await expect(page.getByText('Type: image/png')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.getByRole('button', { name: `Delete ${name}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText('Media deleted')).toBeVisible()
})

test('TC-MEDIA-E2E-002 disallowed and spoofed files are rejected', async ({ page }) => {
  await loginAsAdmin(page)
  await page.goto('/admin/media')
  await page.getByLabel('Upload files').setInputFiles({ name: 'evil.exe', mimeType: 'application/octet-stream', buffer: Buffer.from('MZ') })
  await expect(page.getByText(/Unsupported file type/)).toBeVisible()
  await page.getByLabel('Upload files').setInputFiles({ name: 'fake.png', mimeType: 'image/png', buffer: Buffer.from('not really a png') })
  await expect(page.getByText(/does not match its extension/)).toBeVisible()
})

test('TC-MEDIA-E2E-003 select an uploaded image as a featured image', async ({ page }) => {
  const name = `feat-${uid()}.png`
  await loginAsAdmin(page)
  await page.goto('/admin/media')
  await page.getByLabel('Upload files').setInputFiles({ name, mimeType: 'image/png', buffer: PNG })
  await expect(page.getByText(`Uploaded ${name}`)).toBeVisible()
  await page.goto('/admin/pages/new')
  await page.getByRole('button', { name: 'Select image' }).click()
  await page.getByRole('button', { name: `Select ${name}` }).click()
  await expect(page.getByAltText('Featured')).toBeVisible()
})
