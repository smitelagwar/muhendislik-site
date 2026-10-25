import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";

const port = Number(process.env.PLAYWRIGHT_PORT || 3005);
const host = process.env.PLAYWRIGHT_HOST || "localhost";
const productionServer =
  process.env.PLAYWRIGHT_PRODUCTION_SERVER === "1" ||
  (process.env.PLAYWRIGHT_PRODUCTION_SERVER !== "0" && fs.existsSync(".next"));

export default defineConfig({
  testDir: "./tests/site-audit",
  outputDir: "./test-results/site-audit",
  fullyParallel: false,
  workers: 1,
  timeout: 45_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { outputFolder: "./playwright-report/site-audit", open: "never" }]],
  use: {
    baseURL: `http://${host}:${port}`,
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
    {
      name: "webkit-desktop-1366",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1366, height: 768 },
      },
    },
    {
      name: "webkit-mobile-390",
      use: {
        ...devices["iPhone 13"],
      },
    },
  ],
  webServer: {
    command: productionServer
      ? `npm start -- --hostname ${host} --port ${port}`
      : `npm run dev -- --hostname ${host} --port ${port}`,
    url: `http://${host}:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      BELGE_SHARE_SECRET: process.env.BELGE_SHARE_SECRET || "dev-local-belge-share-secret-key-32-bytes-minimum-length!",
    },
  },
});
