import { defineConfig } from "@playwright/test";
import base from "./playwright.hsyncad.config";
const productionBuild = process.env.HSYNCAD_REPORT_USE_BUILD === "1";

export default defineConfig({
  ...base,
  testMatch: "**/report-integrity.spec.ts",
  outputDir: "test-results/hsyncad-report-integrity",
  use: { ...base.use, baseURL: "http://127.0.0.1:3148" },
  webServer: {
    command: `node node_modules/next/dist/bin/next ${productionBuild ? "start" : "dev --webpack"} --hostname 127.0.0.1 --port 3148`,
    url: "http://127.0.0.1:3148/kategori/araclar/hsyncad",
    env: { NEXT_DIST_DIR: productionBuild ? ".next-hsyncad-p02-build" : ".next-hsyncad-p02" },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
