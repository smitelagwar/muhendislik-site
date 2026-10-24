import { expect, test, type Page } from "@playwright/test";
import { expectFocusRect, installFocusProbe, readGeneratedFocusRects } from "./helpers/belgeler-field-focus";

async function openStudio(page: Page, slug = "beton-dokum-tutanagi") {
  await page.goto(`/belgeler/${slug}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  await expect(studio.locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true })).toBeEnabled({ timeout: 8_000 });
  return studio;
}

test.beforeEach(async ({ page }) => {
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") failures.push(message.text()); });
  page.on("response", (response) => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
  Object.assign(page, { focusFailures: failures });
});

test.afterEach(async ({ page }) => {
  expect((page as Page & { focusFailures: string[] }).focusFailures).toEqual([]);
});

test("Toolbar sonrası ilgisiz odak temizlenir; aynı alan inline edit sonrasında tekrar seçilebilir", async ({ page }) => {
  const studio = await openStudio(page);
  const field = studio.locator("#beton-dokum-yer");
  const highlight = studio.getByTestId("belge-field-focus-highlight");
  const zoom = studio.getByRole("button", { name: "Yakınlaştır", exact: true });
  await field.focus();
  await expect(highlight).toBeVisible();
  await zoom.focus();
  await studio.getByRole("button", { name: "Yazdır", exact: true }).focus();
  await expect(highlight).toHaveCount(0);
  await field.focus();
  await zoom.focus();
  const inline = studio.getByTestId("belge-inline-edit-toggle");
  await inline.click();
  await inline.click();
  await field.focus();
  await expect(highlight).toBeVisible();
});

test("Geçici annotation hatası aynı PDF'de toparlanır", async ({ page }) => {
  await installFocusProbe(page, { annotationFailures: 1 });
  const studio = await openStudio(page);
  await studio.locator("#beton-dokum-yer").focus();
  await expect(studio.getByTestId("belge-field-focus-highlight")).toBeVisible({ timeout: 8_000 });
  expect(await page.evaluate(() => (window as unknown as { __focusProbe: { annotationCalls: number } }).__focusProbe.annotationCalls)).toBe(2);
});

test("Kalıcı annotation hatasında deneme sınırı sonraki PDF revizyonlarında da korunur", async ({ page }) => {
  await installFocusProbe(page, { annotationFailures: 100 });
  const studio = await openStudio(page);
  const field = studio.locator("#beton-dokum-yer");
  for (let index = 0; index < 3; index++) {
    await field.fill(`Deneme sınırı ${index}`);
    await expect(studio.locator('[data-testid="belge-studio-preview-canvas"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(350);
  }
  const calls = await page.evaluate(() => (window as unknown as { __focusProbe: { annotationCalls: number } }).__focusProbe.annotationCalls);
  expect(calls).toBe(2);
  await expect(studio.getByTestId("belge-field-focus-highlight")).toHaveCount(0);
});

test("Eksik widget içeren kısmi geometri kalıcı başarı olarak cache'lenmez", async ({ page }) => {
  await installFocusProbe(page, { omitFirstField: "yer" });
  const studio = await openStudio(page);
  await studio.locator("#beton-dokum-yer").focus();
  await expect(studio.getByTestId("belge-field-focus-highlight")).toBeVisible({ timeout: 8_000 });
  expect(await page.evaluate(() => (window as unknown as { __focusProbe: { annotationCalls: number } }).__focusProbe.annotationCalls)).toBe(2);
});

test("Eski PDF'nin gecikmiş geometrisi yeni PDF'nin çıkarımını yutmaz", async ({ page }) => {
  await installFocusProbe(page, { firstAnnotationDelay: 2_000 });
  const studio = await openStudio(page);
  await page.waitForFunction(() => (window as unknown as { __focusProbe: { annotationCalls: number } }).__focusProbe.annotationCalls > 0, null, { timeout: 8_000 });
  await studio.locator("#beton-dokum-yer").fill("Geometri sürerken yeni veri");
  await expect(studio.getByTestId("belge-field-focus-highlight")).toBeVisible({ timeout: 8_000 });
});

test.describe("Mobil gerçek yaşam döngüsü", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("Manuel sayfadan yeni form seçimine geçilir; Escape hemen iptal eder; eski seçim tekrar parlamaz", async ({ page }) => {
    const studio = await openStudio(page, "santiye-sefi-sozlesmesi");
    const actions = studio.getByTestId("belge-studio-mobile-actions");
    const highlight = studio.getByTestId("belge-field-focus-highlight");
    await studio.getByRole("button", { name: "Sonraki sayfa", exact: true }).click();
    await expect(studio.getByText("2 / 2", { exact: true })).toBeVisible();
    await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await studio.locator("#sozlesme-il").focus();
    await actions.getByRole("button", { name: "Canlı PDF Önizle", exact: true }).click();
    await expect(highlight).toHaveAttribute("data-field-key", "il");
    await expect(highlight).toHaveAttribute("data-page", "1");
    await page.keyboard.press("Escape");
    await expect(highlight).toHaveCount(0, { timeout: 500 });

    await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await studio.locator("#sozlesme-sozlesme_tarihi").focus();
    await actions.getByRole("button", { name: "Canlı PDF Önizle", exact: true }).click();
    await expect(highlight).toHaveAttribute("data-page", "2");
    await expect(highlight).toHaveCount(0, { timeout: 4_000 });
    await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await actions.getByRole("button", { name: "Canlı PDF Önizle", exact: true }).click();
    await page.waitForTimeout(400);
    expect(await highlight.count()).toBe(0);
  });

  test("Yavaş render tamamlandıktan sonra vurgu en az iki saniye görünür kalır", async ({ page }) => {
    await installFocusProbe(page);
    const studio = await openStudio(page);
    const actions = studio.getByTestId("belge-studio-mobile-actions");
    await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await page.evaluate(() => { (window as unknown as { __focusProbe: { holdRenderUntil: number } }).__focusProbe.holdRenderUntil = Date.now() + 3_500; Object.assign((window as unknown as { __focusProbe: object }).__focusProbe, { renderStarted: 0, renderFinished: 0 }); });
    await studio.locator("#beton-dokum-yer").fill("Yavaş PDF çizimi testi");
    await page.waitForFunction(() => (window as unknown as { __focusProbe: { renderStarted: number } }).__focusProbe.renderStarted > 0, null, { timeout: 8_000 });
    await actions.getByRole("button", { name: "Canlı PDF Önizle", exact: true }).click();
    const highlight = studio.getByTestId("belge-field-focus-highlight");
    await expect(highlight).toHaveCount(0);
    await page.waitForFunction(() => (window as unknown as { __focusProbe: { renderFinished: number } }).__focusProbe.renderFinished > 0, null, { timeout: 8_000 });
    await expect(highlight).toBeVisible();
    await page.waitForTimeout(2_000);
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveCount(0, { timeout: 1_500 });
  });

  test("Gerçek iki parmak pinch sırasında rehber gizlenir, çizim bitince doğru konumda döner", async ({ page, context }) => {
    const studio = await openStudio(page);
    const actions = studio.getByTestId("belge-studio-mobile-actions");
    await actions.getByRole("button", { name: "Formu Düzenle", exact: true }).click();
    await studio.locator("#beton-dokum-yer").focus();
    await actions.getByRole("button", { name: "Canlı PDF Önizle", exact: true }).click();
    const highlight = studio.getByTestId("belge-field-focus-highlight");
    await expect(highlight).toBeVisible();
    const session = await context.newCDPSession(page);
    try {
      await session.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [
        { x: 140, y: 300, id: 1 }, { x: 240, y: 300, id: 2 },
      ] });
      await session.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [
        { x: 100, y: 300, id: 1 }, { x: 280, y: 300, id: 2 },
      ] });
      await expect(highlight).toHaveCount(0);
      await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect(highlight).toBeVisible();
      await expect(highlight).toHaveAttribute("data-field-key", "yer");
      await expect(studio.getByTestId("belge-studio-zoom-level")).not.toHaveText("%100");
    } finally {
      await session.detach();
    }
  });
});

test.describe("Yoğun alanlarda yüksek DPR ve erişilebilir görünüm", () => {
  test.use({ deviceScaleFactor: 2 });
  test("Üretilmiş PDF hizası 50/100/200/400 zoom, iki tema ve forced-colors altında korunur", async ({ page }) => {
    test.setTimeout(60_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    const studio = await openStudio(page, "santiye-sefi-taahhutnamesi");
    const rects = await readGeneratedFocusRects(page, ["adres"]);
    await studio.locator("#taahhutname-adres").focus();
    for (const target of [50, 100, 200, 400]) {
      let current = Number((await studio.getByTestId("belge-studio-zoom-level").innerText()).replace("%", ""));
      while (current !== target) {
        await studio.getByRole("button", { name: current < target ? "Yakınlaştır" : "Uzaklaştır", exact: true }).click();
        current = Number((await studio.getByTestId("belge-studio-zoom-level").innerText()).replace("%", ""));
      }
      await expectFocusRect(studio, "adres", rects.adres);
    }
    await studio.getByTestId("belge-theme-toggle").click();
    await page.waitForTimeout(300);
    await expectFocusRect(studio, "adres", rects.adres);
    await page.emulateMedia({ forcedColors: "active" });
    await page.waitForTimeout(500);
    await expectFocusRect(studio, "adres", rects.adres);
    await expect(studio.getByTestId("belge-field-focus-layer")).toHaveAttribute("aria-hidden", "true");
  });
});
