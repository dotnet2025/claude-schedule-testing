import { defineConfig, devices } from '@playwright/test'

// Dedicated e2e database and upload folder; never touches development data.
const API = 'http://localhost:5081'
const WEB = 'http://localhost:5174'

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: WEB, trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: 'dotnet run --project ../../backend/src/Cms.Api --urls ' + API,
      url: API + '/health',
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        ASPNETCORE_ENVIRONMENT: 'Development',
        ConnectionStrings__Default: 'Data Source=e2e.db',
        Storage__RootPath: 'e2e-uploads',
        Seed__AdminEmail: 'admin@example.com',
        Seed__AdminPassword: 'Admin123!dev',
        Cors__Origins__0: WEB,
        RateLimit__LoginPermitPerMinute: '1000',
      },
    },
    {
      command: 'npm run dev -- --port 5174',
      cwd: '../../frontend',
      url: WEB,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: { VITE_API_TARGET: API },
    },
  ],
})
