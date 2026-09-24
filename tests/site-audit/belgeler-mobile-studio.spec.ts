import { expect, test, type Page, type TestInfo } from "@playwright/test";

const STUDIO_ROUTES = [
  { name: "Beton Döküm Tutanağı", path: "/belgeler/beton-dokum-tutanagi" },
  { name: "İnşaat Ruhsatı Dilekçesi", path: "/belgeler/insaat-ruhsati-dilekcesi" },
  { name: "Şantiye Şefi İstifa Dilekçesi", path: "/belgeler/santiye-sefi-istifa-dilekcesi" },
  { name: "Şantiye Şefi Hizmet Sözleşmesi", path: "/belgeler/santiye-sefi-sozlesmesi" },
  { name: "Şantiye Şefi Taahhütnamesi", path: "/belgeler/santiye-sefi-taahhutnamesi" },
] as const;

function requireMobile390(testInfo: TestInfo) {
  test.skip(
    testInfo.project.name !== "chromium-mobile-390",
    "Belge stüdyosu matrisi CI'da tek mobil Chromium projesinde koşar; test kendi içinde 320px ve landscape boyutlarını da kapsar."
  );
}

async function gotoStudio(page: Page, path: string, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await expect(page.locator('[data-studio-locked="true"]')).toBeVisible();
  await expect(page.getByTestId("belge-studio-form-scroll")).toBeVisible();
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    documentScrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    studioScrollWidth:
      document.querySelector<HTMLElement>('[data-studio-locked="true"]')?.scrollWidth ?? 0,
    studioClientWidth:
      document.querySelector<HTMLElement>('[data-studio-locked="true"]')?.clientWidth ?? 0,
  }));

  expect(
    metrics.documentScrollWidth,
    `Belge stüdyosu viewport dışına taşıyor: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.viewportWidth + 2);

  expect(
    metrics.studioScrollWidth,
    `Belge stüdyosu kendi sınırları içinde yatay taşıyor: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.studioClientWidth + 2);
}

test.describe("Belgeler — Mobil stüdyo scroll, viewport ve lifecycle sözleşmesi", () => {
  for (const route of STUDIO_ROUTES) {
    test(`[${route.name}] form gerçekten kaymalı ve son alan erişilebilir olmalı`, async ({ page }, testInfo) => {
      requireMobile390(testInfo);
      await gotoStudio(page, route.path);

      await expect(page.getByTestId("global-bottom-nav")).toHaveCount(0);

      const form = page.getByTestId("belge-studio-form-scroll");
      const actions = page.getByTestId("belge-studio-mobile-actions");
      await expect(actions).toBeVisible();

      const initialMetrics = await form.evaluate((element) => ({
        scrollTop: element.scrollTop,
        scrollHeight: element.scrollHeight,
        clientHeight: element.clientHeight,
      }));

      expect(
        initialMetrics.scrollHeight,
        `Form yüksekliği geçersiz: ${route.path} ${JSON.stringify(initialMetrics)}`
      ).toBeGreaterThanOrEqual(initialMetrics.clientHeight);

      await form.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });

      if (initialMetrics.scrollHeight > initialMetrics.clientHeight + 1) {
        await expect
          .poll(() => form.evaluate((element) => element.scrollTop))
          .toBeGreaterThan(initialMetrics.scrollTop);
      }

      const lastEditor = form.locator("input:visible, textarea:visible, select:visible").last();
      await expect(lastEditor).toBeVisible();

      const visibility = await page.evaluate(() => {
        const formElement = document.querySelector<HTMLElement>('[data-testid="belge-studio-form-scroll"]');
        const editors = formElement
          ? Array.from(formElement.querySelectorAll<HTMLElement>("input, textarea, select")).filter((element) => {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
            })
          : [];
        const editor = editors.at(-1);
        const actionsElement = document.querySelector<HTMLElement>('[data-testid="belge-studio-mobile-actions"]');

        if (!formElement || !editor || !actionsElement) return null;

        const formRect = formElement.getBoundingClientRect();
        const editorRect = editor.getBoundingClientRect();
        const actionsRect = actionsElement.getBoundingClientRect();

        return {
          editorTop: editorRect.top,
          editorBottom: editorRect.bottom,
          formTop: formRect.top,
          formBottom: formRect.bottom,
          actionsTop: actionsRect.top,
          actionsBottom: actionsRect.bottom,
          viewportHeight: window.innerHeight,
        };
      });

      expect(visibility, `Son düzenlenebilir alan bulunamadı: ${route.path}`).not.toBeNull();
      expect(visibility!.editorTop).toBeGreaterThanOrEqual(visibility!.formTop - 2);
      expect(visibility!.editorBottom).toBeLessThanOrEqual(visibility!.formBottom + 2);
      expect(visibility!.actionsTop).toBeGreaterThanOrEqual(visibility!.formBottom - 2);
      expect(visibility!.actionsBottom).toBeLessThanOrEqual(visibility!.viewportHeight + 2);

      await lastEditor.focus();
      const editorCss = await lastEditor.evaluate((element) => {
        const style = window.getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return {
          fontSize: Number.parseFloat(style.fontSize),
          height: rect.height,
        };
      });

      expect(editorCss.fontSize).toBeGreaterThanOrEqual(16);
      expect(editorCss.height).toBeGreaterThanOrEqual(44);

      await expectNoHorizontalOverflow(page);
    });
  }

  test("route geri/ileri, mobil menü ve komut paleti scroll-lock artığı bırakmamalı", async ({ page }, testInfo) => {
    requireMobile390(testInfo);

    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.goto("/belgeler/beton-dokum-tutanagi", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await expect(page.locator('[data-studio-locked="true"]')).toBeVisible();

    const menuButton = page.getByRole("button", { name: /menüyü aç/i });
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    await expect(page.locator("#mobile-navigation-drawer")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#mobile-navigation-drawer")).toHaveCount(0);

    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    await page.keyboard.press("Control+K");
    await expect(page.locator("#command-palette-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#command-palette-dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/belgeler$/);
    await expect(page.locator('[data-studio-locked="true"]')).toHaveCount(0);
    await expect(page.getByTestId("global-bottom-nav")).toBeVisible();

    const unlocked = await page.evaluate(() => ({
      bodyOverflow: window.getComputedStyle(document.body).overflow,
      htmlOverflow: window.getComputedStyle(document.documentElement).overflow,
      inlineBodyOverflow: document.body.style.overflow,
      viewportVar: document.documentElement.style.getPropertyValue("--belge-studio-visual-height"),
    }));
    expect(unlocked.bodyOverflow).not.toBe("hidden");
    expect(unlocked.htmlOverflow).not.toBe("hidden");
    expect(unlocked.inlineBodyOverflow).toBe("");
    expect(unlocked.viewportVar).toBe("");

    await page.goForward({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-studio-locked="true"]')).toBeVisible();

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-studio-locked="true"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--belge-studio-visual-height"))).toBe("");
  });

  test("320px, 200% metin ölçeği, sekme geçişi ve landscape taşma üretmemeli", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    await gotoStudio(page, "/belgeler/santiye-sefi-sozlesmesi", 320, 720);

    await expectNoHorizontalOverflow(page);

    const formTab = page.getByRole("button", { name: /Form Alanları/i }).first();
    const previewTab = page.getByRole("button", { name: /Canlı PDF Önizle/i }).first();

    for (let index = 0; index < 5; index += 1) {
      await previewTab.click();
      await expect(page.getByTestId("belge-studio-preview-toolbar")).toBeVisible();
      await formTab.click();
      await expect(page.getByTestId("belge-studio-form-scroll")).toBeVisible();
    }

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await previewTab.click();
    await expect(page.getByTestId("belge-studio-preview-toolbar")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const actionsRect = await page.getByTestId("belge-studio-mobile-actions").boundingBox();
    expect(actionsRect).not.toBeNull();
    expect(actionsRect!.y + actionsRect!.height).toBeLessThanOrEqual(392);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });
    await page.setViewportSize({ width: 320, height: 720 });
    await expectNoHorizontalOverflow(page);
  });

  test("hızlı form değişiklikleri ve preview geçişleri sayfayı kilitlememeli", async ({ page }, testInfo) => {
    requireMobile390(testInfo);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await gotoStudio(page, "/belgeler/beton-dokum-tutanagi");

    const firstInput = page.getByTestId("belge-studio-form-scroll").locator("input:visible, textarea:visible").first();
    await expect(firstInput).toBeVisible();

    for (let index = 0; index < 12; index += 1) {
      await firstInput.fill(`Mobil stres ${index}`);
      await page.waitForTimeout(40);
    }

    const previewTab = page.getByRole("button", { name: /Canlı PDF Önizle/i }).first();
    const formTab = page.getByRole("button", { name: /Form Alanları/i }).first();

    await previewTab.click();
    await expect(page.getByTestId("belge-studio-preview-toolbar")).toBeVisible();

    for (let index = 0; index < 4; index += 1) {
      await formTab.click();
      await previewTab.click();
    }

    await page.waitForTimeout(600);

    const canvas = page.locator("canvas").first();
    await expect(canvas).toBeVisible();
    const canvasSize = await canvas.evaluate((element) => {
      const canvasElement = element as HTMLCanvasElement;
      return {
        width: canvasElement.width,
        height: canvasElement.height,
      };
    });
    expect(canvasSize.width).toBeGreaterThan(0);
    expect(canvasSize.height).toBeGreaterThan(0);
    expect(pageErrors).toEqual([]);
  });
});
