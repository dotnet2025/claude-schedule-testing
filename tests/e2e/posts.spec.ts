import { expect, test } from '@playwright/test'
import { loginAsAdmin, uid } from './helpers'

test('TC-POST-E2E-001 create category, post in that category, publish and see it on public category page', async ({ page }) => {
  const cat = `Cat ${uid()}`; const title = `E2E Post ${uid()}`
  await loginAsAdmin(page)
  await page.goto('/admin/categories')
  await page.getByRole('button', { name: 'New category' }).click()
  await page.getByLabel('Name').fill(cat)
  await page.getByRole('button', { name: 'Save' }).click()
  await expect(page.getByRole('cell', { name: cat })).toBeVisible()
  const catSlug = await page.getByRole('row', { name: new RegExp(cat) }).getByRole('cell').nth(1).innerText()

  await page.goto('/admin/posts/new')
  await page.getByLabel('Title').fill(title)
  await page.getByLabel('Categories').click()
  await page.getByRole('option', { name: cat }).click()
  await page.getByRole('button', { name: /save & publish/i }).click()
  await expect(page.getByText('Saved and published')).toBeVisible()

  await page.goto(`/category/${catSlug}`)
  await expect(page.getByRole('link', { name: title })).toBeVisible()
  await page.getByRole('link', { name: title }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()

  await page.goto('/search?q=' + encodeURIComponent(title))
  await expect(page.getByRole('link', { name: title })).toBeVisible()
})

test('TC-POST-E2E-002 draft posts are not listed publicly', async ({ page }) => {
  const title = `Draft ${uid()}`
  await loginAsAdmin(page)
  await page.goto('/admin/posts/new')
  await page.getByLabel('Title').fill(title)
  await page.getByRole('button', { name: 'Save draft' }).click()
  await expect(page.getByText('Saved', { exact: true })).toBeVisible()
  await page.goto('/blog')
  await expect(page.getByRole('link', { name: title })).toHaveCount(0)
})
