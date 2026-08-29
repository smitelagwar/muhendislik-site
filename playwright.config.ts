import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3000);
const productionServer = process.env.PLAYWRIGHT_PRODUCTION_SERVER === "1";

export default defineConfig({
  testDir: "./tests/document-studio",
  fullyParallel: false,
  // Tek Next sunucusu, paralel SSR derleme yükünde modül fabrikasını
  // kaybedebiliyor; kabul kapısı deterministik olarak tek worker çalışır.
  workers: 1,
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
    {
      name: "chromium",
      testIgnore: "**/phase1.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: [
        "**/phase1.spec.ts",
        "**/release.spec.ts",
        "**/cad-mobile-stage8.spec.ts",
        "**/cad-mobile-stage8-final.spec.ts",
        "**/cad-mobile-stage8-acceptance.spec.ts",
        "**/cad-mobile-stage8-intersection.spec.ts",
      ],
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "webkit",
      testMatch: "**/release.spec.ts",
      use: { ...devices["Desktop Safari"], baseURL: `http://localhost:${port}` },
    },
    {
      name: "mobile-webkit",
      testMatch: [
        "**/release.spec.ts",
        "**/cad-mobile-stage8.spec.ts",
        "**/cad-mobile-stage8-final.spec.ts",
        "**/cad-mobile-stage8-acceptance.spec.ts",
        "**/cad-mobile-stage8-intersection.spec.ts",
      ],
      use: { ...devices["iPhone 13"], baseURL: `http://localhost:${port}` },
    },
  ],
  webServer: {
    command: productionServer
      ? `npm start -- --hostname 127.0.0.1 --port ${port}`
      : `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/dokumantasyon`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NEXT_DIST_DIR: process.env.NEXT_DIST_DIR || (productionServer ? ".next" : ".next-playwright"),
      DOK_ALLOW_LOCAL_STORAGE: "true",
      DOK_PRODUCTION_RUNTIME_TEST: productionServer ? "true" : "false",
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD_HASH: "$2b$10$TxzKJSpWjjhIwB8honXpuOGcE4VQdEEsN2WGFadTRG1GdvqiCrRfO",
      SESSION_SECRET: "playwright_session_secret_at_least_32_bytes",
      ADMIN_SESSION_VERSION: "1",
      RATE_LIMIT_SALT: "playwright_rate_limit_salt_at_least_32_bytes",
    },
  },
});
