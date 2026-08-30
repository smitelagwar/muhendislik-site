import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3005);

export default defineConfig({
  testDir: "./tests/site-audit",
  outputDir: "./test-results/site-audit",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "./test-results/site-audit/report", open: "never" }]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium-desktop-1920",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1920, height: 1080 },
      },
    },
    {
      name: "chromium-desktop-1366",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "chromium-tablet-768",
      use: {
        viewport: { width: 768, height: 1024 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "chromium-mobile-390",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "chromium-mobile-360",
      use: {
        viewport: { width: 360, height: 800 },
        hasTouch: true,
        isMobile: true,
      },
    },
    {
      name: "chromium-mobile-320",
      use: {
        viewport: { width: 320, height: 720 },
        hasTouch: true,
        isMobile: true,
      },
    },
  ],
  webServer: {
    command: `npm start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
