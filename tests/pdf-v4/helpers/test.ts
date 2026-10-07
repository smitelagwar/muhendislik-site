import { test as base, expect, type CDPSession } from "@playwright/test";
import { SAMPLER_INIT } from "./sampler";
import type { Profile } from "./budgets";

/**
 * Tüm PDF v4 testleri `test`'i buradan import eder:
 *  - örnekleyici her sayfaya enjekte edilir,
 *  - `cdp` yalnızca Chromium'da vardır; PDF_V4_CPU=4 ise CPU yavaşlatma uygulanır,
 *  - `profile` bütçe seçimi içindir.
 */
export const test = base.extend<{ cdp: CDPSession | null; profile: Profile }>({
  page: async ({ page }, use) => {
    const engineFlag = process.env.PDF_ENGINE || "v4";
    await page.addInitScript((flag) => {
      try {
        window.localStorage.setItem("dok:pdfEngine", flag);
      } catch {}
    }, engineFlag);
    await page.addInitScript(SAMPLER_INIT);
    await use(page);
  },
  cdp: async ({ page, browserName }, use) => {
    if (browserName !== "chromium") return use(null);
    const session = await page.context().newCDPSession(page);
    const rate = Number(process.env.PDF_V4_CPU || 1);
    if (rate > 1) await session.send("Emulation.setCPUThrottlingRate", { rate });
    await use(session);
  },
  profile: async ({ isMobile }, use) => {
    const throttled = Number(process.env.PDF_V4_CPU || 1) > 1;
    await use(isMobile ? (throttled ? "mobile-throttled" : "mobile") : "desktop");
  },
});

export { expect };
