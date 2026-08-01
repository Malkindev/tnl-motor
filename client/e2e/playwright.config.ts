import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { headless: true, baseURL: process.env.E2E_BASE_URL || 'http://localhost:4201' }
});
