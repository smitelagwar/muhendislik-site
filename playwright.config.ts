import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3000);

export default defineConfig({
  testDir: "./tests/document-studio",
  fullyParallel: false,
  timeout: 45_000,
  expect: { timeout: 12_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/dokumantasyon`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      DOK_ALLOW_LOCAL_STORAGE: "true",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD_HASH: "$2b$10$TxzKJSpWjjhIwB8honXpuOGcE4VQdEEsN2WGFadTRG1GdvqiCrRfO",
      SESSION_SECRET: "playwright_session_secret_at_least_32_bytes",
      ADMIN_SESSION_VERSION: "1",
      RATE_LIMIT_SALT: "playwright_rate_limit_salt_at_least_32_bytes",
    },
  },
});
