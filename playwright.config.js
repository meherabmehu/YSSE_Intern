import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  workers: 1,
  fullyParallel: false,
  timeout: 60000,
  use: {
    baseURL: 'http://127.0.0.1:3100',
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
