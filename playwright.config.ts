import { defineConfig, devices, type PlaywrightWorkerOptions } from '@playwright/test';

const url = 'http://localhost:5173';

// Experiment only: CI runs the suite once per capture setting, to measure what each one costs.
const captures: Record<string, Partial<PlaywrightWorkerOptions>> = {
  none: {},
  screenshot: { screenshot: 'only-on-failure' },
  trace: { trace: 'retain-on-failure' },
  'trace-no-shots': { trace: { mode: 'retain-on-failure', screenshots: false } },
};

export default defineConfig({
  testDir: 'e2e',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: url,
    ...captures[process.env.CAPTURE ?? 'none'],
  },
  reporter: 'list',
  workers: process.env.CI ? 1 : 4,
  retries: 0,
  forbidOnly: !!process.env.CI,
  webServer: { command: 'npm run dev', url, reuseExistingServer: true },
});
