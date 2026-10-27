import { expect, test } from '@playwright/test'
import { loginAsAdmin, uid } from './helpers'

test('TC-PAGE-E2E-001 create, publish, view publicly, unpublish and delete a page', async ({ page }) => {
  const title = `E2E Page ${uid()}`
  await loginAsAdmin(page)
  await page.goto('/admin/pages/new')
  await page.getByLabel('Title').fill(title)
  const slug = await page.getByLabel('Slug').inputValue()
  expect(slug).toMatch(/^e2e-page-/)
  await page.getByRole('textbox', { name: 'Content' }).click()
  await page.keyboard.type('Hello from Playwright')
  await page.getByRole('button', { name: /save & publish/i }).click()
  await expect(page.getByText('Saved and published')).toBeVisible()
  await expect(page).toHaveURL(/\/admin\/pages\/\d+\/edit/)

  const pub = await page.context().newPage()
  await pub.goto(`/pages/${slug}`)
  await expect(pub.getByRole('heading', { name: title })).toBeVisible()
  await expect(pub.getByText('Hello from Playwright')).toBeVisible()

  await page.getByRole('button', { name: /save & unpublish/i }).click()
  await expect(page.getByText('Saved and unpublished')).toBeVisible()
  await pub.reload()
  await expect(pub.getByText(/404/)).toBeVisible()

  await page.goto('/admin/pages')
  await page.getByLabel('Search pages').fill(title)
  await page.getByRole('button', { name: `Delete ${title}` }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Delete' }).click()
  await expect(page.getByText(`${title} deleted`)).toBeVisible()
})

test('TC-PAGE-E2E-002 validation: empty title and duplicate slug', async ({ page }) => {
  const slug = `dup-${uid()}`
  await loginAsAdmin(page)
  await page.goto('/admin/pages/new')
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('Title is required')).toBeVisible()
  await page.getByLabel('Title').fill('First')
  await page.getByLabel('Slug').fill(slug)
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.goto('/admin/pages/new')
  await page.getByLabel('Title').fill('Second')
  await page.getByLabel('Slug').fill(slug)
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText(/already in use/)).toBeVisible()
})

test('TC-PAGE-E2E-003 unknown public slug shows the 404 page', async ({ page }) => {
  await page.goto('/pages/does-not-exist-' + uid())
  await expect(page.getByRole('heading', { name: /404/ })).toBeVisible()
})
