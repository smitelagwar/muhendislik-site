import { test, expect, type Page } from "@playwright/test";
import { mockExplorerData } from "./explorer-fixture";

const selected = (p: Page) => p.locator('[data-selected="true"]');
const viewport = (p: Page) => p.getByTestId("dok-explorer-viewport");
const mode = (p: Page) => p.getByTestId("dok-selection-mode");
async function openExplorer(p: Page, count = 100) {
  await mockExplorerData(p, count);
  await p.goto("/dokumantasyon");
  await expect(p.getByTestId("dok-file-row").first()).toBeVisible();
  await expect(p.getByTestId("dok-phone-more")).toBeVisible();
}
async function toggleMode(p: Page) {
  if (await p.getByTestId("dok-phone-more").isVisible()) await p.getByTestId("dok-phone-more").tap();
  await mode(p).tap();
}
async function openGrid(p: Page) {
  await p.getByTestId("dok-phone-more").tap();
  await p.getByRole("button", { name: "Görünüm ve düzen", exact: true }).tap();
  await p.getByLabel("Görünüm", { exact: true }).selectOption("grid");
  await p.getByRole("button", { name: "Uygula", exact: true }).tap();
}
async function lastItem(p: Page, id: string, dock: boolean) {
  await viewport(p).evaluate(n => { n.scrollTop = n.scrollHeight; });
  const last = p.locator(`[data-file-id="${id}"]`);
  await expect(last).toBeVisible();
  await expect.poll(async () => {
    await viewport(p).evaluate(n => { n.scrollTop = n.scrollHeight; });
    const a = await last.boundingBox(), b = await viewport(p).boundingBox();
    return !!a && !!b && a.y >= b.y - 1 && a.y + a.height <= b.y + b.height + 1;
  }).toBe(true);
  if (dock) {
    const a = (await p.getByTestId("dok-mobile-selection-dock").boundingBox())!;
    const b = (await viewport(p).boundingBox())!;
    expect(b.y + b.height).toBeLessThanOrEqual(a.y + 1);
    expect(a.y + a.height).toBeLessThanOrEqual(p.viewportSize()!.height + 1);
    for (const action of ["move", "share", "trash"]) {
      expect(await p.locator(`[data-mobile-action="${action}"]`).evaluate(n => {
        const r = n.getBoundingClientRect();
        return n.contains(document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2));
      })).toBe(true);
    }
  }
  expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
}
for (const view of ["list", "grid"] as const) {
  test.describe(`Mobil ${view}`, () => {
    test.beforeEach(async ({ page: p }) => {
      await openExplorer(p);
      if (view === "grid") await openGrid(p);
    });
    test("Strict Seç modu, ad/gövde seçimi, iptal ve odak", async ({ page: p }) => {
      const initial = p.url();
      await expect(p.locator("[data-selection-control]:visible")).toHaveCount(0);
      await expect(p.getByTestId("dok-select-all")).toBeHidden();
      await viewport(p).focus(); await p.keyboard.press("Control+a");
      await expect(selected(p)).toHaveCount(0);
      await toggleMode(p);
      const a = p.locator('[data-file-id="file-000"]'), b = p.locator('[data-file-id="file-001"]');
      await a.getByTestId("dok-file-name").tap();
      await expect(a.locator("[data-selection-control]")).toHaveAttribute("aria-pressed", "true");
      await b.tap({ position: { x: 8, y: 8 } });
      await expect(p.getByTestId("dok-selection-count")).toHaveText("2 öğe seçildi");
      await a.getByTestId("dok-file-name").tap();
      await expect(p.getByTestId("dok-selection-count")).toHaveText("1 öğe seçildi");
      expect(p.url()).toBe(initial);
      await toggleMode(p);
      await expect(selected(p)).toHaveCount(0);
      await expect(p.getByTestId("dok-mobile-selection-dock")).toBeHidden();
      await expect(p.getByTestId("dok-phone-more")).toBeFocused();
    });
    test("44px hedefler ve More menüsü parent açmaz", async ({ page: p }) => {
      const a = p.locator('[data-file-id="file-000"]');
      const menu = a.getByTestId("dok-item-more");
      const bounds = (await menu.boundingBox())!;
      expect(bounds.width).toBeGreaterThanOrEqual(44); expect(bounds.height).toBeGreaterThanOrEqual(44);
      const initial = p.url(); await menu.tap();
      await expect(p.getByRole("dialog")).toBeVisible();
      expect(p.url()).toBe(initial);
      await p.keyboard.press("Escape"); await expect(menu).toBeFocused();
      await toggleMode(p);
      const control = a.locator("[data-selection-control]");
      const target = (await control.boundingBox())!;
      expect(target.width).toBeGreaterThanOrEqual(44); expect(target.height).toBeGreaterThanOrEqual(44);
      await expect(a.getByTestId("dok-item-more")).toHaveCount(0);
      await control.tap();
      await expect(a).toHaveAttribute("data-selected", "true");
    });
    test("Double-click ve touch/pen contextmenu dosya/klasör açmaz", async ({ page: p }) => {
      const initial = p.url();
      for (const selector of ['[data-file-id="file-000"]', '[data-folder-id="folder-mobile"]']) {
        const item = p.locator(selector);
        for (const pointerType of ["touch", "pen"]) {
          await item.dispatchEvent("pointerdown", { pointerType, pointerId: 17, button: 0 });
          await item.dispatchEvent("contextmenu", { pointerType, button: 2, bubbles: true, cancelable: true });
          await item.dispatchEvent("pointerup", { pointerType, pointerId: 17, button: 0 });
          await expect(selected(p)).toHaveCount(0);
        }
      }
      await toggleMode(p);
      for (const selector of ['[data-file-id="file-000"]', '[data-folder-id="folder-mobile"]']) {
        await p.locator(selector).dblclick({ position: { x: 8, y: 8 } }); expect(p.url()).toBe(initial);
      }
      await p.locator('[data-file-id="file-000"]').getByTestId("dok-file-name").dblclick();
      expect(p.url()).toBe(initial); await expect(p.getByRole("menu")).toHaveCount(0);
    });
    for (const source of ["body", "name", "folder"] as const) {
      test(`Normal ${source} tap yalnız bir navigasyon üretir`, async ({ page: p }) => {
        await p.evaluate(() => {
          const original = history.pushState.bind(history), entries: string[] = [];
          Object.assign(window, { dokOpenEntries: entries });
          history.pushState = (...args) => { entries.push(String(args[2])); original(...args); };
        });
        const first = p.locator(source === "folder" ? '[data-folder-id="folder-mobile"]' : '[data-file-id="file-000"]');
        if (source === "name") await first.getByTestId("dok-file-name").tap();
        else await first.tap({ position: { x: 8, y: 8 } });
        await expect(p).toHaveURL(source === "folder" ? /folderId=folder-mobile/ : /dokumantasyon\/dosya\/file-000/);
        expect(await p.evaluate(() => Reflect.get(window, "dokOpenEntries"))).toHaveLength(1);
      });
    }
  });
}
for (const count of [100, 500]) {
  test(`${count} öğede son satır dock açılıp kapanırken görünür`, async ({ page: p }, info) => {
    await openExplorer(p, count); await toggleMode(p);
    await p.locator('[data-file-id="file-000"] [data-selection-control]').tap();
    const id = `file-${String(count - 1).padStart(3, "0")}`;
    await lastItem(p, id, true); await p.screenshot({ path: info.outputPath(`last-${count}.png`) });
    await toggleMode(p); await lastItem(p, id, false);
  });
}
test("Yatay/dikey ve breakpoint geçişi", async ({ page: p }, info) => {
  await openExplorer(p); await toggleMode(p); await p.locator('[data-file-id="file-000"] [data-selection-control]').tap();
  await p.setViewportSize({ width: 844, height: 390 });
  await expect(mode(p)).toHaveAttribute("aria-pressed", "true");
  await p.screenshot({ path: info.outputPath("landscape-before.png") });
  await lastItem(p, "file-099", true); await p.screenshot({ path: info.outputPath("landscape.png") });
  await p.setViewportSize({ width: 1100, height: 768 });
  await expect.poll(() => p.evaluate(() => matchMedia("(max-width: 1023px)").matches)).toBe(false);
  await expect(p.locator("[data-mobile-selection-mode]")).toHaveAttribute("data-mobile-selection-mode", "false");
  await p.setViewportSize({ width: 390, height: 844 });
  await expect(p.getByTestId("dok-phone-more")).toBeVisible();
  await expect(p.locator("[data-selection-control]:visible")).toHaveCount(0);
});
test("Gerçek touch swipe/flick ve uzun basma", async ({ page: p, browserName }) => {
  test.skip(browserName !== "chromium", "CDP touch girdisi Chromium'a özgü; WebKit tap/guard ayrıca sınanır.");
  await openExplorer(p, 500); const initial = p.url();
  const session = await p.context().newCDPSession(p);
  try {
    const r = (await viewport(p).boundingBox())!, x = r.x + r.width / 2, y = r.y + r.height - 20;
    for (const steps of [10, 3]) {
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x, y }] });
      for (let i = 1; i <= steps; i++) await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x, y: y - (r.height - 40) * i / steps }] });
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    }
    await expect.poll(() => viewport(p).evaluate(n => n.scrollTop)).toBeGreaterThan(20);
    await expect(selected(p)).toHaveCount(0); expect(p.url()).toBe(initial);
    await viewport(p).evaluate(n => { n.scrollTop = 0; });
    const item = p.locator('[data-file-id="file-000"]'); await expect(item).toBeVisible();
    const b = (await item.boundingBox())!;
    await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: b.x + 12, y: b.y + 20 }] });
    await p.waitForTimeout(800); // Sınanan uzun basma süresi.
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(selected(p)).toHaveCount(0); expect(p.url()).toBe(initial);
  } finally { await session.detach(); }
});

for (const view of ["list", "grid"] as const) {
  test(`Açık/koyu tema, 500 öğe ${view} son öğe, tümünü seç ve sıfıra dön`, async ({page:p}, info) => {
    await openExplorer(p, 500);
    if (view === "grid") await openGrid(p);
    await toggleMode(p);
    await p.getByTestId("dok-select-all").tap();
    await expect(p.getByTestId("dok-selection-count")).toHaveText("501 öğe seçildi");
    for (const theme of ["light", "dark"]) {
      await p.evaluate(t => { document.documentElement.classList.remove("light", "dark"); document.documentElement.classList.add(t); }, theme);
      await lastItem(p, "file-499", true);
      await p.screenshot({path:info.outputPath(`${view}-${theme}.png`)});
    }
    await p.getByTestId("dok-select-all").tap();
    await expect(p.getByTestId("dok-selection-count")).toHaveText("0 öğe seçildi");
    await expect(mode(p)).toHaveAttribute("aria-pressed", "true");
    await expect(p.getByTestId("dok-mobile-selection-dock")).toBeHidden();
  });
}
test("Toplu taşı/paylaş/sil pencereleri dar ekranda açılır, iptal seçimi korur", async({page:p}) => {
  await openExplorer(p);
  await p.route("**/api/dokumantasyon/folders/tree", r => r.fulfill({ json: { folders: [] } }));
  await toggleMode(p); await p.locator('[data-file-id="file-000"] [data-selection-control]').tap();
  for (const action of ["move", "share", "trash"]) {
    await p.locator(`[data-mobile-action="${action}"]`).tap();
    const dialog = p.getByRole("dialog"); await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "İptal", exact:true }).tap();
    await expect(dialog).toHaveCount(0);
    await expect(p.getByTestId("dok-selection-count")).toHaveText("1 öğe seçildi");
  }
});
