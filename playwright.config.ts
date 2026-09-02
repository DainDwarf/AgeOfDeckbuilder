import { defineConfig, devices } from '@playwright/test';

const url = 'http://localhost:5173';

export default defineConfig({
  testDir: 'e2e',
  use: { ...devices['Desktop Chrome'], baseURL: url },
  reporter: 'list',
  workers: process.env.CI ? 1 : 4,
  retries: 0,
  forbidOnly: !!process.env.CI,
  webServer: { command: 'npm run dev', url, reuseExistingServer: true },
});
