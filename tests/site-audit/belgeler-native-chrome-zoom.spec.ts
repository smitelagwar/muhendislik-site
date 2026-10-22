import { expect, test } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

mkdirSync("audit-artifacts-native-zoom", { recursive: true });

const docs = [
  "santiye-sefi-sozlesmesi",
  "santiye-sefi-istifa-dilekcesi",
  "santiye-sefi-taahhutnamesi",
  "insaat-ruhsati-dilekcesi",
  "beton-dokum-tutanagi",
] as const;

function nativeKey(key: string) {
  execFileSync("xdotool", ["key", "--clearmodifiers", key], { timeout: 4000 });
}

async function browserMetrics(page: import("@playwright/test").Page) {
  return page.evaluate(() => ({
    dpr: window.devicePixelRatio,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    outerWidth: window.outerWidth,
    viewportScale: window.visualViewport?.scale ?? 1,
    documentZoom: getComputedStyle(document.documentElement).zoom,
  }));
}

async function setNativeChromeZoom(page: import("@playwright/test").Page, target: number) {
  await page.bringToFront();
  for (let attempt = 0; attempt < 9; attempt++) {
    const m = await browserMetrics(page);
    if (Math.abs(m.dpr - target) < 0.025) return m;
    if (m.dpr > target + 0.025) {
      throw new Error("Native zoom overshot target: " + JSON.stringify({ target, ...m }));
    }
    nativeKey("ctrl+plus");
    await expect.poll(async () => (await browserMetrics(page)).dpr, { timeout: 3000 })
      .toBeGreaterThan(m.dpr + 0.02);
  }
  throw new Error("Native zoom shortcut did not reach " + target + "x");
}

async function geometry(page: import("@playwright/test").Page) {
  return page.locator('[data-studio-locked="true"] [data-testid="belge-studio-preview-toolbar"]:visible').evaluate(el => {
    const toolbar = el.getBoundingClientRect();
    const controls = Array.from(el.querySelectorAll("button, a"))
      .filter(node => {
        const r = node.getBoundingClientRect();
        return r.height > 0 && r.width > 0 && getComputedStyle(node).visibility !== "hidden";
      }).map(node => {
        const r = node.getBoundingClientRect();
        return {
          name: node.getAttribute("aria-label") || (node.textContent || "").trim().slice(0, 28),
          left: r.left, right: r.right, top: r.top, bottom: r.bottom,
        };
      });
    const overlaps: string[] = [];
    for (let i = 0; i < controls.length; i++) for (let j = i + 1; j < controls.length; j++) {
      const a = controls[i], b = controls[j];
      if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
          Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1) {
        overlaps.push(a.name + " × " + b.name);
      }
    }
    return { toolbar: { width: toolbar.width, height: toolbar.height }, overlaps, controls };
  });
}

async function formGeometry(page: import("@playwright/test").Page) {
  return page.locator('[data-belge-form-content="true"]').first().evaluate(el => {
    const scroll = el.closest('[data-testid="belge-studio-form-scroll"]') as HTMLElement;
    const box = scroll.getBoundingClientRect();
    const children = Array.from(el.children).map(n => n.getBoundingClientRect()).filter(r => r.height > 0);
    const visualScale = el instanceof HTMLElement ? (el.style.zoom || "1") : "unavailable";
    const scaledHeight = children.length ? children.at(-1)!.bottom - box.top : 0;
    return {
      mode: el.getAttribute("data-mode"),
      status: el.getAttribute("data-fit-status"),
      scale: Number(el.getAttribute("data-scale")),
      styleZoom: visualScale,
      computedZoom: getComputedStyle(el).zoom,
      scrollWidth: scroll.scrollWidth, clientWidth: scroll.clientWidth,
      scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight,
      lastBottom: scaledHeight,
      actualFit: scroll.scrollWidth <= scroll.clientWidth + 2 &&
                 scroll.scrollHeight <= scroll.clientHeight + 2 &&
                 scaledHeight <= scroll.clientHeight + 2,
    };
  });
}

for (const doc of docs) {
  test("DENETIM03 NATIVE Chrome zoom " + doc, async ({ page }, info) => {
    test.setTimeout(160000);
    const observations: Array<Record<string, unknown>> = [];
    const errors: string[] = [];
    page.on("pageerror", e => errors.push(e.message));
    await page.setViewportSize({ width: 1536, height: 864 });
    await page.goto("/belgeler/" + doc, { waitUntil: "domcontentloaded", timeout: 30000 });
    await expect.poll(() => page.locator('[data-studio-locked="true"] [data-testid="belge-studio-preview-toolbar"]:visible').count(), { timeout: 8000 }).toBe(1);
    await expect(page.locator('[data-studio-locked="true"]:visible').first().getByRole("status").first()).toHaveText("PDF önizlemesi hazır.", { timeout: 30000 });
    try {
      for (const target of [1, 1.25, 1.5, 2]) {
        if (target !== 1) await setNativeChromeZoom(page, target);
        const metrics = await browserMetrics(page);
        const toolbar = await geometry(page);
        console.log("NATIVE_ZOOM_METRICS", JSON.stringify({ doc, target, metrics, overlaps: toolbar.overlaps }));
        const formVisible = await page.locator('[data-belge-form-content="true"]').first().isVisible();
        const datum: Record<string, unknown> = { doc, target, metrics, toolbar, formVisible };
        if (formVisible) datum.form = await formGeometry(page);
        observations.push(datum);
        if (target === 1.5 || target === 2) {
          await info.attach(doc + "-native-" + target + ".png", {
            body: await page.screenshot({ animations: "disabled", path: `audit-artifacts-native-zoom/${doc}-${target}.png` }), contentType: "image/png",
          });
        }
        expect(Math.abs(metrics.dpr - target), JSON.stringify(datum)).toBeLessThan(0.025);
        // True browser zoom must REFLOW CSS layout, not merely change DPR or pinch scale.
        expect(Math.abs(metrics.innerWidth - Math.round(1536 / target)), JSON.stringify(datum)).toBeLessThan(5);
        expect(metrics.viewportScale, "Pinch zoom must remain unchanged").toBeCloseTo(1, 1);
      }
    } finally {
      await info.attach(doc + "-native-zoom.json", {
        body: Buffer.from(JSON.stringify({ observations, errors }, null, 2)),
        contentType: "application/json",
      });
      writeFileSync(`audit-artifacts-native-zoom/${doc}-metrics.json`, JSON.stringify({ observations, errors }, null, 2));
      nativeKey("ctrl+0");
    }
    expect(errors).toEqual([]);
    const faults = observations.flatMap(d => {
      const toolbar = d.toolbar as { overlaps: string[] };
      return toolbar.overlaps.map(x => "Native " + d.target + "x: " + x);
    });
    expect(faults, JSON.stringify(faults, null, 2)).toEqual([]);
  });
}

test("DENETIM03 native zoom fit/focus/warning contract", async ({page},info) => {
  test.setTimeout(150000);
  const observations: Record<string, unknown> = {};
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/belgeler/santiye-sefi-sozlesmesi", {
    waitUntil: "domcontentloaded", timeout: 30000,
  });
  await expect(page.getByTestId("belge-studio-form-view-trigger")).toBeVisible({ timeout: 8000 });
  try {
    await setNativeChromeZoom(page, 1.5);
    observations.native = await browserMetrics(page);
    const pdfZoomBefore = await page.getByTestId("belge-studio-zoom-level").textContent();
    observations.pdfZoomBefore = pdfZoomBefore;
    await page.getByTestId("belge-studio-form-view-trigger").click({ timeout: 8000 });
    await page.getByTestId("form-view-fit").click({ timeout: 8000 });
    const form = page.locator('[data-belge-form-content="true"]').first();
    await expect.poll(() => form.getAttribute("data-fit-status"), { timeout: 8000 })
      .toMatch(/^(fitted|limited|unavailable)$/);
    observations.afterFit = await formGeometry(page);
    const address = page.getByLabel("Açık Adres", { exact: true }).first();
    await address.fill("DENETIM TEST ADRESI " + "Çınar Sokak No 123 Daire 42, ".repeat(12));
    observations.whileTyping = await formGeometry(page);
    observations.warnings = await page.getByTestId("belge-field-guidance-message").count();
    await address.blur();
    await page.waitForTimeout(450);
    observations.afterBlur = await formGeometry(page);
    await page.getByTestId("belge-studio-form-view-trigger").click({ timeout: 8000 });
    await page.getByTestId("form-view-scale-90").click({ timeout: 8000 });
    observations.afterManual = await formGeometry(page);
    observations.pdfZoomAfter = await page.getByTestId("belge-studio-zoom-level").textContent();
    expect(observations.pdfZoomAfter).toBe(pdfZoomBefore);
    const manual = observations.afterManual as { scale: number, styleZoom: string };
    expect(Math.abs(Number(manual.styleZoom) - manual.scale)).toBeLessThan(0.011);
  } finally {
    await info.attach("native-fit-focus-warning.json", {
      body: Buffer.from(JSON.stringify(observations, null, 2)), contentType: "application/json",
    });
    writeFileSync("audit-artifacts-native-zoom/fit-focus-warning.json", JSON.stringify(observations, null, 2));
    nativeKey("ctrl+0");
  }
});
