import { test, expect } from "./helpers/test";
import { assertServerMode, recordAndGate } from "./helpers/budgets";
import { installCompat } from "./helpers/compat";
import { inkPixels, openPdf, waitSharp } from "./helpers/viewer";

/**
 * S10 — Eski tarayıcı simülasyonu: Chrome 110 / Firefox 115 / Safari 16.4 sonrası yerleşikler silinmişken
 * uygulamanın PDF viewer'ı açılmalı ve ilk sayfa çizilmeli (D1). Bu test K1 (legacy build) öncesi KIRMIZI olmalı.
 */
test.beforeAll(assertServerMode);

test("S10 uyumluluk — silinmiş API'lerle PDF açılır", async ({ page, context }, testInfo) => {
  await installCompat(context);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

  let rendered = 1;
  try { await openPdf(page, "tr-metin"); await waitSharp(page); } catch { rendered = 0; }
  // "rendered" ama BEYAZ olabilir: legacy build'de transferToFixedLength yoksa glifler sessizce çizilmez.
  const ink = rendered ? await inkPixels(page, 1) : 0;

  await expect.poll(() => page.workers().length, { timeout: 10_000 }).toBeGreaterThan(0);
  let preludeSeen = 0;
  for (const w of page.workers()) {
    if (await w.evaluate(() => (globalThis as any).__COMPAT_PRELUDE_RAN === true).catch(() => false)) preludeSeen = 1;
  }
  const fatal = errors.filter((e) => /TypeError|ReferenceError|is not a function|is not defined|Invalid PDF|API version/i.test(e));
  recordAndGate(testInfo, "S10", "desktop", "tr-metin", {
    firstPageRendered: rendered,
    inkPixels: ink,
    pageErrors: fatal.length,
    workerPreludeSeen: preludeSeen, // 0 ise testin kendisi çalışmıyor demektir: worker'a ön ek enjekte edilemedi
    firstError: fatal[0] ?? null,
  });
});
