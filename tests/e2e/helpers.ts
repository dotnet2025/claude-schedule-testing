import { expect, type Page } from '@playwright/test'

export const ADMIN = { email: 'admin@example.com', password: 'Admin123!dev' }

export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()
}

export async function loginAsAdmin(page: Page) {
  await login(page)
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
}

export const uid = () => Math.random().toString(36).slice(2, 8)

// 1x1 transparent PNG
export const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64')
