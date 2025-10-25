import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  fullyParallel: true,
  reporter: [['list']],
  webServer: {
    command: 'npm run dev -- --port=3000',
    cwd: __dirname,
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
