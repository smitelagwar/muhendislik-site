import { defineConfig, devices } from "@playwright/test";

const port = Number(process.env.PLAYWRIGHT_PORT || 3000);

export default defineConfig({
  testDir: "./tests/dok-drive-v3",
  outputDir: "./test-results/dok-drive-v3",
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 10_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "node-or-chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
