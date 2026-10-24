import { defineConfig, devices } from "@playwright/test";
import { mkdtempSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const port = 3006;
const testDataRoot = path.resolve(root, ".test-data");
mkdirSync(testDataRoot, { recursive: true });
const isolatedDataDir = mkdtempSync(path.join(testDataRoot, "stage13-pdf-viewer-"));
process.env.DOK_LOCAL_DATA_DIR = isolatedDataDir;

export default defineConfig({
  testDir: path.resolve(root, "tests/document-studio"),
  outputDir: path.resolve(root, "docs/belgeler-paylasim-v3-uygulama/ASAMA_13_pdf_viewer_results"),
  fullyParallel: false,
  workers: 1,
  timeout: 90_000,
  expect: { timeout: 20_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    ...devices["Desktop Chrome"],
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm start -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}/dokumantasyon`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      CI: "true",
      NEXT_DIST_DIR: ".next-stage13-isolated",
      DOK_ALLOW_LOCAL_STORAGE: "true",
      DOK_PRODUCTION_RUNTIME_TEST: "true",
      DOK_LOCAL_DATA_DIR: isolatedDataDir,
      ADMIN_USERNAME: "admin",
      ADMIN_PASSWORD_HASH: "$2b$10$TxzKJSpWjjhIwB8honXpuOGcE4VQdEEsN2WGFadTRG1GdvqiCrRfO",
      SESSION_SECRET: "stage13-synthetic-session-secret-at-least-32-bytes",
      ADMIN_SESSION_VERSION: "1",
      RATE_LIMIT_SALT: "stage13-synthetic-rate-limit-salt-at-least-32-bytes",
    },
  },
});
