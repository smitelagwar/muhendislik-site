import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const root = process.cwd();
const port = 3014;

export default defineConfig({
  testDir: path.resolve(root, "tests/site-audit"),
  testMatch: "belgeler-share-live-acceptance.spec.ts",
  outputDir: path.resolve(root, "test-results/stage14-cross-browser"),
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${port}`,
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "firefox-desktop", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit-desktop", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: `npm.cmd run dev -- --hostname localhost --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
