import { defineConfig } from "@playwright/test";
import base from "./playwright.hsyncad.config";
export default defineConfig({
  ...base, testMatch: ["**/project-settings.spec.ts", "**/report-integrity.spec.ts"],
  outputDir: "test-results/hsyncad-project-settings",
  use: { ...base.use, baseURL: "http://127.0.0.1:3149" },
  webServer: {
    command: "node node_modules/next/dist/bin/next start --hostname 127.0.0.1 --port 3149",
    env: { NEXT_DIST_DIR: ".next-hsyncad-p03-build" },
    url: "http://127.0.0.1:3149/kategori/araclar/hsyncad", reuseExistingServer: false, timeout: 120000,
  },
});
