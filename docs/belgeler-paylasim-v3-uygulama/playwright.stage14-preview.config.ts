import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const envFile = process.env.STAGE14_ENV_FILE;
if (envFile) {
  const tokenLine = fs.readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .find((line) => line.startsWith("VERCEL_OIDC_TOKEN="));
  const rawToken = tokenLine?.slice("VERCEL_OIDC_TOKEN=".length).trim();
  if (rawToken) {
    process.env.VERCEL_OIDC_TOKEN = rawToken.replace(/^(["'])(.*)\1$/, "$2");
  }
}

const baseURL = process.env.STAGE14_RC_URL;
const oidcToken = process.env.VERCEL_OIDC_TOKEN;
if (!baseURL || !oidcToken) {
  throw new Error("Stage14 RC URL or short-lived development OIDC token is unavailable.");
}

export default defineConfig({
  testDir: path.resolve(process.cwd(), "tests/site-audit"),
  testMatch: "belgeler-share-live-acceptance.spec.ts",
  outputDir: path.resolve(process.cwd(), "test-results/stage14-preview"),
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL,
    extraHTTPHeaders: { "x-vercel-trusted-oidc-idp-token": oidcToken },
    trace: "off",
    screenshot: "off",
    video: "off",
  },
  projects: [
    { name: "chromium-preview", use: { ...devices["Desktop Chrome"] } },
  ],
});
