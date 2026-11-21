import { defineConfig, devices } from '@playwright/test';

// O12 (2026-11-21): Harsh wants the site checked on Android phones across the range, not one
// named phone. Emulation covers screen size, pixel ratio, touch and user agent; it does not
// measure real GPU speed, so the frame-rate budget still needs a real low/mid phone in M6.
const ANDROID = [
  'Moto G4', // old, small, low-end
  'Galaxy S8',
  'Galaxy A55', // mid-range
  'Pixel 7a',
  'Pixel 10', // current flagship
  'Galaxy S24',
  'Galaxy Z Fold 7 Cover', // narrow foldable outer screen
  'Galaxy Z Fold 7',
  'Galaxy Tab S9' // tablet
] as const;

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    trace: 'on-first-retry'
  },
  webServer: {
    command: 'npm run dev --workspace=site',
    url: 'http://localhost:4321',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    ...ANDROID.map((name) => ({ name, use: { ...devices[name] } }))
  ]
});
