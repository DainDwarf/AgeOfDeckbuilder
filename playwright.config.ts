import { defineConfig, devices } from '@playwright/test';

const url = 'http://localhost:5173';

export default defineConfig({
  testDir: 'e2e',
  use: { ...devices['Desktop Chrome'], baseURL: url },
  reporter: 'list',
  webServer: { command: 'npm run dev', url },
});
