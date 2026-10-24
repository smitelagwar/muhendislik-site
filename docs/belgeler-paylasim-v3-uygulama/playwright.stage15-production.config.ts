import { defineConfig } from "@playwright/test";
import path from "node:path";

if (process.env.BELGE_STAGE15_PRODUCTION_SMOKE !== "authorized-two-synthetic-contracts") {
  throw new Error("Explicit bounded Production smoke authorization marker is required.");
}
export default defineConfig({
  testDir: path.resolve("tests/site-audit"),
  testMatch: "belgeler-stage15-production-smoke.spec.ts",
  outputDir: path.resolve("test-results/stage15-production"),
  workers: 1, retries: 0, timeout: 90_000,
  expect: { timeout: 8000 }, reporter: "list",
  use: { baseURL: "https://muhendislik-site.vercel.app", browserName: "chromium", viewport: { width: 1280, height: 900 }, trace: "off", screenshot: "off", video: "off", actionTimeout: 8000, navigationTimeout: 30_000 },
});
