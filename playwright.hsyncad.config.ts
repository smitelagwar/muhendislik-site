import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/hsyncad",
  testMatch: "**/*.spec.ts",
  outputDir: "test-results/hsyncad",
  workers: 1,
  fullyParallel: false,
  timeout: 90_000,
  globalTimeout: 300_000,
  expect: { timeout: 8_000 },
  reporter: "list",
  use: {
    baseURL: process.env.HSYNCAD_TEST_URL || "http://127.0.0.1:3127",
    viewport: { width: 1440, height: 1080 },
    actionTimeout: 8_000,
    navigationTimeout: 45_000,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    // CI uses the Chrome already present on GitHub-hosted Ubuntu runners;
    // local tests continue to use Playwright's bundled Chromium.
    channel: process.env.HSYNCAD_BROWSER_CHANNEL === "chrome" ? "chrome" : undefined,
    launchOptions: { args: ["--enable-unsafe-swiftshader"] },
  },
});
