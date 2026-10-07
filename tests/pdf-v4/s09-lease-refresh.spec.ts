import { test } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { samplerStart, samplerStop } from "./helpers/sampler";
import { openPdf, viewInfo, waitSharp, type Fixture } from "./helpers/viewer";

/** S9 — Lease yenilenince belge yeniden yüklenmez, scroll kaymaz. */
const FIXTURES: Fixture[] = ["karisik-60"];

test.beforeAll(assertServerMode);

for (const fx of FIXTURES) {
  test(`S9 lease yenileme — ${fx}`, async ({ page, profile }, testInfo) => {
    let reloads = 0;
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame()) reloads++;
    });

    await page.addInitScript(() => {
      try {
        localStorage.setItem("dok:testHooks", "1");
      } catch {}
    });

    await openPdf(page, fx);
    await waitSharp(page);
    reloads = 0; // ilk yüklemeyi sıfırla

    const initialInfo = await viewInfo(page);
    await samplerStart(page);

    await page.route("**/api/dokumantasyon/files/*/access", async (route) => {
      const response = await route.fetch();
      const json = await response.json();
      if (json?.accessUrl) {
        json.accessUrl += (json.accessUrl.includes("?") ? "&" : "?") + "lease=2";
      }
      await route.fulfill({ json });
    });

    const hasHook = await page.evaluate(() => typeof (window as any).__dokRefreshLease === "function");
    if (hasHook) {
      await page.evaluate(() => (window as any).__dokRefreshLease());
      await page.waitForTimeout(1000);
    } else {
      reloads = 1; // v3 D2 tespiti: kanca ve koruma yok, yeniden yükleme gerekir
    }

    const s = await samplerStop(page);
    const finalInfo = await viewInfo(page);
    const scrollDriftPx = Math.abs(finalInfo.scrollTop - initialInfo.scrollTop);

    recordAndGate(testInfo, "S9", profile, fx, {
      reloads,
      scrollDriftPx,
      blankFrames: s.blankFrames,
    });
  });
}
