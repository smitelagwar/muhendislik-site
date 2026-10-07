import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";

/**
 * PDF v4 ölçüm/kabul konfigürasyonu. Ana config'in webServer + globalSetup
 * ayarlarını aynen devralır; yalnızca testDir ve projeler farklıdır.
 *
 * PDF_V4_MODE=baseline  → bütçe uygulanmaz, yalnızca ölçülür (taban sayılar için)
 * PDF_V4_MODE=gate      → (varsayılan) bütçe aşımı testi kırar; production sunucu zorunlu
 * PDF_V4_CPU=4          → mobil projede CPU 4× yavaşlatma (orta seviye telefon)
 */
export default defineConfig({
  ...base,
  testDir: "./tests/pdf-v4",
  testMatch: /.*\.spec\.ts$/,
  timeout: 180_000,
  retries: 0,
  reporter: [["list"]],
  outputDir: "./test-results/artifacts",
  use: {
    baseURL: base.use?.baseURL,
    // Ölçümü bozmasın: video/trace/yazılımsal GL bayrakları kapalı. Mümkünse `--headed` ile gerçek GPU'da çalıştır.
    trace: "off",
    video: "off",
    screenshot: "off",
    launchOptions: { args: ["--disable-dev-shm-usage"] },
  },
  projects: [
    {
      name: "desktop",
      testIgnore: ["**/s05-*", "**/s06-*", "**/s11-*", "**/s10-*"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 800 }, deviceScaleFactor: 2 },
    },
    {
      name: "mobile",
      testMatch: ["**/s01-*", "**/s02-*", "**/s04-*", "**/s05-*", "**/s06-*", "**/s07-*", "**/s08-*", "**/s11-*", "**/s12-*", "**/s13-*"],
      use: {
        // Chromium + CDP dokunma (Safari davranışı ayrı "webkit" projesinde duman olarak).
        // Uygulamada UA koklaması yok; iPhone 13 ölçüleri (390x844, DPR3) kullanılır.
        ...devices["Pixel 7"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 3,
      },
    },
    {
      name: "compat",
      testMatch: ["**/s10-*"],
      use: { ...devices["Desktop Chrome"], viewport: { width: 1366, height: 800 } },
    },
    {
      // Yalnızca duman: açılış + kaydırma + klavye zoom. WebKit'te CDP yok, pinch burada test edilmez.
      name: "webkit",
      testMatch: ["**/s01-*", "**/s04-*"],
      use: { ...devices["Desktop Safari"], baseURL: `http://localhost:${Number(process.env.PLAYWRIGHT_PORT || 3000)}` },
    },
  ],
});
