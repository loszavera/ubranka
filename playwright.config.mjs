import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './artifacts/e2e',
  timeout: 30_000,
  fullyParallel: true,
  workers: 2,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'artifacts/e2e-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: process.platform === 'win32' ? 'msedge' : 'chromium',
    viewport: { width: 390, height: 844 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npx expo serve --port 4175',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: { EXPO_NO_TELEMETRY: '1' },
  },
});
