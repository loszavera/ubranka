import { defineConfig } from '@playwright/test';
import process from 'node:process';

export default defineConfig({
  testDir: './tests/private-e2e', outputDir: './artifacts/private-e2e',
  timeout: 45_000, fullyParallel: true, workers: 2, retries: 0,
  reporter: [['list'], ['json', { outputFile: 'artifacts/private-e2e-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4185', channel: process.platform === 'win32' ? 'msedge' : 'chromium',
    viewport: { width: 390, height: 844 }, acceptDownloads: true,
    trace: 'retain-on-failure', screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'node scripts/private-e2e.mjs serve', url: 'http://127.0.0.1:4185',
    reuseExistingServer: false, timeout: 30_000,
  },
});
