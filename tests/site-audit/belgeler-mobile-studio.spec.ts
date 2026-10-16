import { expect, test, webkit, type Page, type TestInfo } from "@playwright/test";

const STUDIO_ROUTES = [
  { name: "Beton Döküm Tutanağı", path: "/belgeler/beton-dokum-tutanagi", fields: 10 },
  { name: "İnşaat Ruhsatı Dilekçesi", path: "/belgeler/insaat-ruhsati-dilekcesi", fields: 8 },
  { name: "Şantiye Şefi İstifa Dilekçesi", path: "/belgeler/santiye-sefi-istifa-dilekcesi", fields: 10 },
  { name: "Şantiye Şefi Hizmet Sözleşmesi", path: "/belgeler/santiye-sefi-sozlesmesi", fields: 14 },
  { name: "Şantiye Şefi Taahhütnamesi", path: "/belgeler/santiye-sefi-taahhutnamesi", fields: 14 },
] as const;

const MOBILE_VIEWPORTS = [
  { width: 320, height: 720 },
  { width: 360, height: 800 },
  { width: 390, height: 844 },
  { width: 414, height: 896 },
  { width: 844, height: 390 },
  { width: 768, height: 1024 },
] as const;

const DESKTOP_VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1024, height: 768 },
] as const;

function requireMobile390(testInfo: TestInfo) {
  test.skip(
    testInfo.project.name !== "chromium-mobile-390",
    "Belge stüdyosu matrisi CI'da tek mobil Chromium projesinde koşar; test kendi içinde 320px ve landscape boyutlarını da kapsar."
  );
}

function getVisibleStudio(page: Page) {
  return page.locator('[data-studio-locked="true"]:visible').last();
}

async function gotoStudio(page: Page, path: string, width = 390, height = 844) {
  await page.setViewportSize({ width, height });
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = getVisibleStudio(page);
  await expect(studio).toBeVisible();
  await expect(studio.getByTestId("belge-studio-form-scroll")).toBeVisible();
  await expect(
    studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: /PDF İndir/i })
  ).toBeEnabled({ timeout: 20_000 });
}

async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => {
    const studio = Array.from(
      document.querySelectorAll<HTMLElement>('[data-studio-locked="true"]')
    ).find((element) => {
      const rect = element.getBoundingClientRect();
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });

    return {
      documentScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
      studioScrollWidth: studio?.scrollWidth ?? 0,
      studioClientWidth: studio?.clientWidth ?? 0,
    };
  });

  expect(
    metrics.documentScrollWidth,
    `Belge stüdyosu viewport dışına taşıyor: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.viewportWidth + 2);

  expect(
    metrics.studioScrollWidth,
    `Belge stüdyosu kendi sınırları içinde yatay taşıyor: ${JSON.stringify(metrics)}`
  ).toBeLessThanOrEqual(metrics.studioClientWidth + 2);
}

async function expectEditableFieldContract(page: Page, expectedCount: number) {
  const editors = getVisibleStudio(page)
    .getByTestId("belge-studio-form-scroll")
    .locator("input:visible, textarea:visible, select:visible");

  await expect(editors).toHaveCount(expectedCount);

  const relations = await editors.evaluateAll((elements) =>
    elements.map((element) => {
      const id = element.id;
      return {
        id,
        hasLabel: Boolean(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)),
      };
    })
  );

  expect(relations).toHaveLength(expectedCount);
  for (const relation of relations) {
    expect(relation.id).not.toBe("");
    expect(relation.hasLabel).toBe(true);
  }
}

async function expectPreviewCanvas(page: Page) {
  const studio = getVisibleStudio(page);
  const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });
  if (await previewTab.isVisible()) {
    await previewTab.click();
    await expect(previewTab).toHaveAttribute("aria-selected", "true");
  }
  await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");
  const toolbar = studio.getByTestId("belge-studio-preview-toolbar");
  await expect(toolbar).toBeVisible();
  await expect(toolbar).toHaveAttribute("aria-label", "PDF önizleme araçları");
  await expect(toolbar.getByText("Canlı Belge Önizlemesi")).toBeHidden();
  await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");

  const toolbarBox = await toolbar.boundingBox();
  expect(toolbarBox).not.toBeNull();
  expect(toolbarBox!.height).toBeLessThanOrEqual(92);

  const controls = toolbar.locator("button:visible, a:visible");
  const controlCount = await controls.count();
  expect(controlCount).toBeGreaterThan(0);
  for (let index = 0; index < controlCount; index += 1) {
    const controlBox = await controls.nth(index).boundingBox();
    expect(controlBox, `PDF toolbar kontrolü ölçülemedi: ${index}`).not.toBeNull();
    expect(controlBox!.width, `PDF toolbar kontrolü 44px'den dar: ${index}`).toBeGreaterThanOrEqual(44);
    expect(controlBox!.height, `PDF toolbar kontrolü 44px'den kısa: ${index}`).toBeGreaterThanOrEqual(44);
  }

  const canvas = studio.locator("canvas").first();
  await expect(canvas).toBeVisible();

  await expect
    .poll(() =>
      canvas.evaluate((element) => {
        const target = element as HTMLCanvasElement;
        return target.width > 0 && target.height > 0;
      })
    )
    .toBe(true);
}

test.describe("Belgeler — Mobil stüdyo scroll, viewport ve lifecycle sözleşmesi", () => {
  for (const route of STUDIO_ROUTES) {
    test(`[${route.name}] form gerçekten kaymalı ve son alan erişilebilir olmalı`, async ({ page }, testInfo) => {
      requireMobile390(testInfo);
      await gotoStudio(page, route.path);

      await expect(page.getByTestId("global-bottom-nav")).toHaveCount(0);

      const studio = getVisibleStudio(page);
      const form = studio.getByTestId("belge-studio-form-scroll");
      const actions = studio.getByTestId("belge-studio-mobile-actions");
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

      const visibility = await studio.evaluate((root) => {
        const formElement = root.querySelector<HTMLElement>('[data-testid="belge-studio-form-scroll"]');
        const editors = formElement
          ? Array.from(formElement.querySelectorAll<HTMLElement>("input, textarea, select")).filter((element) => {
              const style = window.getComputedStyle(element);
              const rect = element.getBoundingClientRect();
              return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
            })
          : [];
        const editor = editors.at(-1);
        const actionsElement = root.querySelector<HTMLElement>('[data-testid="belge-studio-mobile-actions"]');

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
    await expect(page.locator("[data-site-header]")).toBeVisible();
    await expect(page.getByTestId("global-bottom-nav")).toBeVisible();

    await page.getByRole("link", { name: /Stüdyoda doldur/i }).first().click();
    await expect(page).toHaveURL(/\/belgeler\/beton-dokum-tutanagi$/);
    await expect(getVisibleStudio(page)).toBeVisible();
    await expect(page.locator("[data-site-header]")).toHaveCount(0);
    await expect(page.getByRole("navigation", { name: "Belge stüdyosu gezinme" })).toBeVisible();
    await expect(page.getByRole("button", { name: /menüyü aç/i })).toHaveCount(0);

    await page.keyboard.press("Control+K");
    await expect(page.locator("#command-palette-dialog")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#command-palette-dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("");

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page).toHaveURL(/\/belgeler$/);
    await expect(page.locator('[data-studio-locked="true"]')).toHaveCount(0);
    await expect(page.locator("[data-site-header]")).toBeVisible();
    await expect(page.getByTestId("global-bottom-nav")).toBeVisible();

    const menuButton = page.getByRole("button", { name: "Menüyü aç" });
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
    await expect(getVisibleStudio(page)).toBeVisible();
    await expect(page.locator("[data-site-header]")).toHaveCount(0);

    await page.goBack({ waitUntil: "domcontentloaded" });
    await expect(page.locator('[data-studio-locked="true"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.style.getPropertyValue("--belge-studio-visual-height"))).toBe("");
  });

  test("beş SPA stüdyo rotasından çıkış PDF blob URL'lerini serbest bırakmalı", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    test.setTimeout(45_000);

    await page.addInitScript(() => {
      const trackedWindow = window as Window & {
        __belgeStudioObjectUrls?: { created: string[]; revoked: string[] };
      };
      trackedWindow.__belgeStudioObjectUrls = { created: [], revoked: [] };

      const createObjectUrl = URL.createObjectURL.bind(URL);
      const revokeObjectUrl = URL.revokeObjectURL.bind(URL);
      URL.createObjectURL = ((object: Blob | MediaSource) => {
        const url = createObjectUrl(object);
        trackedWindow.__belgeStudioObjectUrls?.created.push(url);
        return url;
      }) as typeof URL.createObjectURL;
      URL.revokeObjectURL = ((url: string) => {
        trackedWindow.__belgeStudioObjectUrls?.revoked.push(url);
        revokeObjectUrl(url);
      }) as typeof URL.revokeObjectURL;
    });

    await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
    await page.waitForLoadState("networkidle", { timeout: 8_000 });

    for (const route of STUDIO_ROUTES) {
      await page.locator(`a[href="${route.path}"]`).last().click();
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));

      const studio = getVisibleStudio(page);
      await expectPreviewCanvas(page);
      const pdfUrl = await studio
        .getByTestId("belge-studio-preview-toolbar")
        .getByRole("link", { name: "PDF'yi yeni sekmede aç" })
        .getAttribute("href");
      expect(pdfUrl).toMatch(/^blob:/);

      await page.getByRole("link", { name: "Tüm belgelere dön" }).click();
      await expect(page).toHaveURL(/\/belgeler$/);
      await expect
        .poll(() =>
          page.evaluate((url) => {
            const trackedWindow = window as Window & {
              __belgeStudioObjectUrls?: { created: string[]; revoked: string[] };
            };
            return trackedWindow.__belgeStudioObjectUrls?.revoked.includes(url) ?? false;
          }, pdfUrl!)
        )
        .toBe(true);
    }
  });

  for (const route of STUDIO_ROUTES) {
    test(`[${route.name}] global navbar gizli, kompakt başlık görünür`, async ({ page }, testInfo) => {
      test.skip(
        !["chromium-mobile-390", "chromium-desktop-1366"].includes(testInfo.project.name),
        "Standalone route header sözleşmesi mobil ve 1366px desktop projesinde doğrulanır."
      );

      await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const studio = getVisibleStudio(page);
      await expect(studio).toBeVisible();
      await expect(page.locator("[data-site-header]")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Belge stüdyosu gezinme" })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.getByRole("link", { name: "Tüm belgelere dön" })).toHaveAttribute("href", "/belgeler");
    });
  }

  test("320px, 200% metin ölçeği, sekme geçişi ve landscape taşma üretmemeli", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    test.setTimeout(45_000);
    await gotoStudio(page, "/belgeler/santiye-sefi-sozlesmesi", 320, 720);

    await expectNoHorizontalOverflow(page);

    const studio = getVisibleStudio(page);
    const formTab = studio.getByRole("tab", { name: /Form Alanları/i });
    const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });
    for (let index = 0; index < 5; index += 1) {
      await previewTab.click();
      await expect(previewTab).toHaveAttribute("aria-selected", "true");
      await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");
      await expect(studio.getByTestId("belge-studio-preview-toolbar")).toBeVisible();
      await formTab.click();
      await expect(formTab).toHaveAttribute("aria-selected", "true");
      await expect(studio.getByTestId("belge-studio-form-scroll")).toBeVisible();
      await expect(studio.locator("canvas").first()).toBeHidden();
    }

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "200%";
    });
    await expectNoHorizontalOverflow(page);

    await page.setViewportSize({ width: 844, height: 390 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const value = document.documentElement.style.getPropertyValue("--belge-studio-visual-height");
          return Number.parseFloat(value) || 0;
        })
      )
      .toBeGreaterThanOrEqual(388);
    await expect
      .poll(() =>
        page.evaluate(() => {
          const value = document.documentElement.style.getPropertyValue("--belge-studio-visual-height");
          return Number.parseFloat(value) || 0;
        })
      )
      .toBeLessThanOrEqual(392);
    await previewTab.click();
    await expect(previewTab).toHaveAttribute("aria-selected", "true");
    await expect(studio.getByTestId("belge-studio-preview-toolbar")).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const actionsRect = await studio.getByTestId("belge-studio-mobile-actions").boundingBox();
    expect(actionsRect).not.toBeNull();
    expect(actionsRect!.y + actionsRect!.height).toBeLessThanOrEqual(392);

    await page.evaluate(() => {
      document.documentElement.style.fontSize = "";
    });

    await page.setViewportSize({ width: 390, height: 460 });
    await expect
      .poll(() =>
        page.evaluate(() => {
          const value = document.documentElement.style.getPropertyValue("--belge-studio-visual-height");
          return Number.parseFloat(value) || 0;
        })
      )
      .toBeGreaterThanOrEqual(458);
    await formTab.click();
    const form = studio.getByTestId("belge-studio-form-scroll");
    const lastEditor = form.locator("input:visible, textarea:visible, select:visible").last();
    await lastEditor.scrollIntoViewIfNeeded();
    await lastEditor.focus();
    const focusedFieldLayout = await studio.evaluate((root) => {
      const editor = root.querySelector<HTMLElement>(
        '[data-testid="belge-studio-form-scroll"] input:focus, [data-testid="belge-studio-form-scroll"] textarea:focus, [data-testid="belge-studio-form-scroll"] select:focus'
      );
      const formElement = root.querySelector<HTMLElement>('[data-testid="belge-studio-form-scroll"]');
      const actions = root.querySelector<HTMLElement>('[data-testid="belge-studio-mobile-actions"]');
      if (!editor || !formElement || !actions) return null;
      return {
        editor: editor.getBoundingClientRect().toJSON(),
        form: formElement.getBoundingClientRect().toJSON(),
        actions: actions.getBoundingClientRect().toJSON(),
      };
    });
    expect(focusedFieldLayout).not.toBeNull();
    expect(focusedFieldLayout!.editor.top).toBeGreaterThanOrEqual(focusedFieldLayout!.form.top - 2);
    expect(focusedFieldLayout!.editor.bottom).toBeLessThanOrEqual(focusedFieldLayout!.actions.top + 2);

    await page.setViewportSize({ width: 320, height: 720 });
    await expectNoHorizontalOverflow(page);
  });

  test("hızlı form değişiklikleri ve preview geçişleri sayfayı kilitlememeli", async ({ page }, testInfo) => {
    requireMobile390(testInfo);

    const pageErrors: string[] = [];
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await gotoStudio(page, "/belgeler/beton-dokum-tutanagi");

    const studio = getVisibleStudio(page);
    const firstInput = studio.getByTestId("belge-studio-form-scroll").locator("input:visible, textarea:visible").first();
    await expect(firstInput).toBeVisible();

    const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });
    const formTab = studio.getByRole("tab", { name: /Form Alanları/i });
    await previewTab.click();
    await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");
    const canvas = studio.locator("canvas").first();
    const baselineCanvas = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
    await formTab.click();

    for (let index = 0; index < 12; index += 1) {
      await firstInput.fill(`Mobil stres ${index}`);
      await page.waitForTimeout(40);
    }

    await expect(firstInput).toHaveValue("Mobil stres 11");

    await previewTab.click();
    await expect(studio.getByTestId("belge-studio-preview-toolbar")).toBeVisible();

    for (let index = 0; index < 4; index += 1) {
      await formTab.click();
      await previewTab.click();
    }

    await page.waitForTimeout(600);

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
    await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL()))
      .not.toBe(baselineCanvas);
    expect(pageErrors).toEqual([]);
  });

  test("Sözleşme iki sayfa preview gezintisini ve canvas içeriğini güncellemeli", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    test.setTimeout(45_000);
    await gotoStudio(page, "/belgeler/santiye-sefi-sozlesmesi");
    await expectPreviewCanvas(page);

    const studio = getVisibleStudio(page);
    const toolbar = studio.getByTestId("belge-studio-preview-toolbar");
    const canvas = studio.locator("canvas").first();
    const nextPage = toolbar.getByRole("button", { name: "Sonraki sayfa" });
    const previousPage = toolbar.getByRole("button", { name: "Önceki sayfa" });

    await expect(toolbar.getByText("1 / 2", { exact: true })).toBeVisible();
    const firstPageImage = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
    await nextPage.click();
    await expect(toolbar.getByText("2 / 2", { exact: true })).toBeVisible();
    await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL()))
      .not.toBe(firstPageImage);

    await studio.getByRole("tab", { name: /Form Alanları/i }).click();
    await studio.getByTestId("belge-studio-form-scroll").locator("input").first().fill("Sayfa koruma kontrolü");
    await studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "PDF İndir", exact: true }).waitFor({ state: "visible" });
    await expect(studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "PDF İndir", exact: true })).toBeEnabled();
    await studio.getByRole("tab", { name: /Canlı PDF/i }).click();
    await expect(toolbar.getByText("2 / 2", { exact: true })).toBeVisible();
    await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");

    const secondPageImage = await canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
    await previousPage.click();
    await expect(toolbar.getByText("1 / 2", { exact: true })).toBeVisible();
    await expect.poll(() => canvas.evaluate((element) => (element as HTMLCanvasElement).toDataURL()))
      .not.toBe(secondPageImage);
  });

  test("PDF preview tablet ve mobil viewport matrisi taşma üretmemeli", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    test.setTimeout(45_000);

    for (const viewport of MOBILE_VIEWPORTS) {
      await gotoStudio(page, "/belgeler/santiye-sefi-sozlesmesi", viewport.width, viewport.height);
      await expectPreviewCanvas(page);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("Beton form düzenleme ve varsayılana sıfırlama korunmalı", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    await gotoStudio(page, "/belgeler/beton-dokum-tutanagi");

    const form = getVisibleStudio(page).getByTestId("belge-studio-form-scroll");
    const input = form.locator('input[type="text"]:visible, textarea:visible').first();
    await expect(input).toBeVisible();
    const initialValue = await input.inputValue();

    await input.fill("ASAMA 04 düzenleme kontrolü");
    await expect(input).toHaveValue("ASAMA 04 düzenleme kontrolü");
    await page.getByRole("button", { name: "Diğer belge işlemleri" }).click();
    await page.getByRole("menuitem", { name: "Örnek verilere sıfırla" }).click();
    await expect(input).toHaveValue(initialValue);
    await page.getByRole("button", { name: "Diğer belge işlemleri" }).click();
    await page.getByRole("menuitem", { name: "Son işlemi geri al" }).click();
    await expect(input).toHaveValue("ASAMA 04 düzenleme kontrolü");
  });

  test("Yazdır eylemi hazır PDF blob'unu yeni pencerede yazdırmalı", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    await page.addInitScript(() => {
      const testWindow = window as Window & {
        __openedPdf?: { url: string; target: string };
        __printInvocationCount?: number;
      };
      window.open = ((url?: string | URL, target?: string) => {
        const state = { value: String(url ?? "") };
        const listeners = new Map<string, EventListener>();
        testWindow.__openedPdf = { url: state.value, target: target ?? "" };
        const fakeWindow = {
          closed: false,
          document: { readyState: "complete" },
          focus: () => undefined,
          print: () => {
            testWindow.__printInvocationCount = (testWindow.__printInvocationCount ?? 0) + 1;
          },
          addEventListener: (type: string, listener: EventListener) => listeners.set(type, listener),
          removeEventListener: (type: string) => listeners.delete(type),
        } as unknown as Window;
        const fakeLocation = {} as Location;
        Object.defineProperty(fakeLocation, "href", {
          get: () => state.value,
          set: (value: string) => {
            state.value = String(value);
            testWindow.__openedPdf = { url: state.value, target: target ?? "" };
            if (state.value.startsWith("blob:")) {
              queueMicrotask(() => listeners.get("load")?.(new Event("load")));
            }
          },
        });
        Object.defineProperty(fakeWindow, "location", { value: fakeLocation });
        return fakeWindow;
      }) as typeof window.open;
    });

    await gotoStudio(page, "/belgeler/beton-dokum-tutanagi");
    await page.getByRole("button", { name: "Diğer belge işlemleri" }).click();
    const printButton = page.getByRole("menuitem", { name: "Yazdır" });
    await expect(printButton).toBeEnabled({ timeout: 20_000 });
    await printButton.click();

    const printResult = await page.evaluate(() => {
      const testWindow = window as Window & {
        __openedPdf?: { url: string; target: string };
        __printInvocationCount?: number;
      };
      return {
        openedPdf: testWindow.__openedPdf,
        printInvocationCount: testWindow.__printInvocationCount ?? 0,
      };
    });
    expect(printResult.openedPdf?.url).toMatch(/^blob:/);
    expect(printResult.openedPdf?.target).toBe("_blank");
    expect(printResult.printInvocationCount).toBe(1);
  });

  test("İki parmak yalnız PDF'yi büyütür, sayfa ve viewport ölçeği sabit kalır", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    await gotoStudio(page, "/belgeler/santiye-sefi-sozlesmesi");
    const studio = getVisibleStudio(page);
    const mobileDownload = studio.getByTestId("belge-studio-mobile-actions")
      .getByRole("button", { name: /PDF İndir/i });
    await expect(mobileDownload).toBeEnabled({ timeout: 20_000 });
    const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });
    await previewTab.click();
    await expect(previewTab).toHaveAttribute("aria-selected", "true");
    const preview = studio.getByTestId("belge-studio-preview-canvas");
    await expect(preview).toBeVisible();
    await expect(studio.getByTestId("belge-studio-preview-toolbar").getByText("%100", { exact: true })).toBeVisible();

    const before = await studio.evaluate((root) => {
      const canvas = root.querySelector<HTMLCanvasElement>('[data-testid="belge-studio-preview-canvas"] canvas');
      return {
        scale: window.visualViewport?.scale ?? 1,
        height: root.getBoundingClientRect().height,
        canvasWidth: canvas?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(before.canvasWidth).toBeGreaterThan(0);

    const box = await preview.boundingBox();
    expect(box).not.toBeNull();
    const centerX = box!.x + box!.width / 2;
    const centerY = box!.y + box!.height / 2;
    const cdp = await page.context().newCDPSession(page);
    try {
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: centerX - 32, y: centerY }, { x: centerX + 32, y: centerY }],
      });
      await cdp.send("Input.dispatchTouchEvent", {
        type: "touchMove",
        touchPoints: [{ x: centerX - 68, y: centerY }, { x: centerX + 68, y: centerY }],
      });
      await expect
        .poll(() => studio.getByTestId("belge-studio-preview-toolbar").getByText(/%\d+/, { exact: true }).textContent())
        .not.toBe("%100");
      await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");
    } finally {
      await cdp.detach();
    }

    const after = await studio.evaluate((root) => {
      const canvas = root.querySelector<HTMLCanvasElement>('[data-testid="belge-studio-preview-canvas"] canvas');
      return {
        scale: window.visualViewport?.scale ?? 1,
        height: root.getBoundingClientRect().height,
        canvasWidth: canvas?.getBoundingClientRect().width ?? 0,
      };
    });
    expect(after.scale).toBeCloseTo(before.scale, 2);
    expect(Math.abs(after.height - before.height)).toBeLessThanOrEqual(2);
    expect(after.canvasWidth).toBeGreaterThan(before.canvasWidth * 1.3);
    await expect(previewTab).toHaveAttribute("aria-selected", "true");
  });

  test("/belgeler arama, clear, no-result, 200% text ve BottomNav overlap sözleşmesi", async ({ page }, testInfo) => {
    requireMobile390(testInfo);
    test.setTimeout(45_000);

    for (const viewport of MOBILE_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.goto("/belgeler", { waitUntil: "domcontentloaded", timeout: 30_000 });
      await page.waitForLoadState("networkidle", { timeout: 8_000 });

      const search = page.getByRole("searchbox", { name: "Belge veya şablon ara" });
      await expect(search).toBeVisible();

      await search.fill("beton");
      await expect(page.getByText("Beton Döküm Tutanağı", { exact: true })).toBeVisible();

      const clear = page.getByRole("button", { name: "Aramayı temizle" });
      const clearBox = await clear.boundingBox();
      expect(clearBox).not.toBeNull();
      expect(clearBox!.width).toBeGreaterThanOrEqual(44);
      expect(clearBox!.height).toBeGreaterThanOrEqual(44);
      await clear.click();

      await search.fill("kesinlikle-bulunmayacak-belge-xyz");
      await expect(page.getByText("Eşleşen belge bulunamadı")).toBeVisible();
      await page.getByLabel("Aramayı temizle").click();
      await expect(search).toBeFocused();
      await search.evaluate((element) => element.blur());

      const unfocusedStyle = await search.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
        };
      });
      await search.focus();
      const focusedStyle = await search.evaluate((element) => {
        const style = window.getComputedStyle(element);
        return {
          borderColor: style.borderColor,
          boxShadow: style.boxShadow,
        };
      });
      expect(
        focusedStyle.borderColor !== unfocusedStyle.borderColor ||
          focusedStyle.boxShadow !== unfocusedStyle.boxShadow
      ).toBe(true);

      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      await expectNoHorizontalOverflow(page);

      const lastCta = page.getByRole("link", { name: /Stüdyoda doldur/i }).last();
      await lastCta.scrollIntoViewIfNeeded();
      await expect(lastCta).toBeVisible();

      const bottomNav = page.getByTestId("global-bottom-nav");
      if (await bottomNav.isVisible()) {
        const overlap = await page.evaluate(() => {
          const ctas = Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="/belgeler/"]'))
            .filter((element) => element.textContent?.includes("Stüdyoda doldur"));
          const cta = ctas.at(-1);
          const nav = document.querySelector<HTMLElement>('[data-testid="global-bottom-nav"]');
          if (!cta || !nav) return null;
          const ctaRect = cta.getBoundingClientRect();
          const navRect = nav.getBoundingClientRect();
          return {
            ctaBottom: ctaRect.bottom,
            navTop: navRect.top,
            overlap: ctaRect.bottom - navRect.top,
          };
        });
        expect(overlap, "BottomNav ölçümü alınamadı").not.toBeNull();
        expect(
          overlap!.overlap,
          `Son kart CTA BottomNav altında kalıyor: ${JSON.stringify(overlap)}`
        ).toBeLessThanOrEqual(2);
      }

      await page.evaluate(() => {
        document.documentElement.style.fontSize = "";
      });
      await expectNoHorizontalOverflow(page);
    }
  });

  for (const route of STUDIO_ROUTES) {
    test(`[${route.name}] editable alan, label/id, tab ARIA, preview ve download regresyonu`, async ({ page }, testInfo) => {
      requireMobile390(testInfo);
      test.setTimeout(45_000);
      await gotoStudio(page, route.path);

      await expectEditableFieldContract(page, route.fields);

      const studio = getVisibleStudio(page);
      const formTab = studio.getByRole("tab", { name: /Form Alanları/i });
      const previewTab = studio.getByRole("tab", { name: /Canlı PDF Önizle/i });

      await expect(formTab).toHaveAttribute("aria-selected", "true");
      await expect(previewTab).toHaveAttribute("aria-selected", "false");
      await expect(formTab).toHaveAttribute("aria-controls", /mobile-panel-form/);
      await expect(previewTab).toHaveAttribute("aria-controls", /mobile-panel-preview/);

      await formTab.focus();
      await page.keyboard.press("ArrowRight");
      await expect(previewTab).toBeFocused();
      await expect(previewTab).toHaveAttribute("aria-selected", "true");
      await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");

      await page.keyboard.press("ArrowLeft");
      await expect(formTab).toBeFocused();
      await expect(formTab).toHaveAttribute("aria-selected", "true");

      await expect(studio.getByTestId("belge-studio-mobile-actions")).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectPreviewCanvas(page);

      await formTab.click();
      const downloadButton = studio
        .getByTestId("belge-studio-mobile-actions")
        .getByRole("button", { name: /PDF İndir/i });

      const downloadPromise = page.waitForEvent("download");
      await downloadButton.click();
      const download = await downloadPromise;

      expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
      await expect(downloadButton).toBeEnabled();
    });
  }

  for (const route of STUDIO_ROUTES) {
    test(`[${route.name}] desktop split-view, internal scroll, toolbar ve zoom matrisi`, async ({ page }, testInfo) => {
      test.skip(
        testInfo.project.name !== "chromium-desktop-1920",
        "Desktop belge matrisi tek Chromium projesinde üç viewport ile koşar."
      );
      test.setTimeout(45_000);
      const passiveWarnings: string[] = [];
      page.on("console", (message) => {
        if (/passive.*event listener|Unable to preventDefault/i.test(message.text())) passiveWarnings.push(message.text());
      });

      for (const viewport of DESKTOP_VIEWPORTS) {
        await page.setViewportSize(viewport);
        await page.goto(route.path, { waitUntil: "domcontentloaded", timeout: 30_000 });
        const studio = getVisibleStudio(page);
        await expect(studio).toBeVisible();
        await expect(page.locator("[data-site-header]")).toHaveCount(0);
        await expect(page.getByRole("navigation", { name: "Belge stüdyosu gezinme" })).toBeVisible();

        const form = studio.getByTestId("belge-studio-form-scroll");
        const toolbar = studio.getByTestId("belge-studio-preview-toolbar");
        await expect(form).toBeVisible();
        await expect(toolbar).toBeVisible();
        await expect(studio.getByRole("status").first()).toHaveText("PDF önizlemesi hazır.");

        const layout = await studio.evaluate((root) => {
          const formElement = root.querySelector<HTMLElement>('[data-testid="belge-studio-form-scroll"]');
          const toolbarElement = root.querySelector<HTMLElement>('[data-testid="belge-studio-preview-toolbar"]');
          const preview = root.querySelector<HTMLElement>('[aria-label="PDF canlı önizlemesi"]');
          if (!formElement || !toolbarElement || !preview) return null;

          const formRect = formElement.getBoundingClientRect();
          const previewRect = preview.getBoundingClientRect();
          const toolbarRect = toolbarElement.getBoundingClientRect();

          return {
            formLeft: formRect.left,
            formRight: formRect.right,
            previewLeft: previewRect.left,
            previewRight: previewRect.right,
            toolbarLeft: toolbarRect.left,
            toolbarRight: toolbarRect.right,
            formScrollHeight: formElement.scrollHeight,
            formClientHeight: formElement.clientHeight,
            documentScrollHeight: document.documentElement.scrollHeight,
            viewportHeight: window.innerHeight,
          };
        });

        expect(layout, `Desktop layout ölçülemedi: ${route.path}`).not.toBeNull();
        expect(layout!.formLeft).toBeLessThan(layout!.previewLeft);
        expect(layout!.formRight).toBeLessThanOrEqual(layout!.previewRight);
        expect(layout!.toolbarLeft).toBeGreaterThanOrEqual(layout!.previewLeft - 4);
        expect(layout!.toolbarRight).toBeLessThanOrEqual(layout!.previewRight + 4);
        expect(layout!.formScrollHeight).toBeGreaterThanOrEqual(layout!.formClientHeight);
        expect(layout!.documentScrollHeight).toBeLessThanOrEqual(layout!.viewportHeight + 2);

        const previewRegion = studio.getByRole("region", { name: /PDF sayfası/ });
        await previewRegion.focus();
        const openPdfLink = toolbar.getByRole("link", { name: "PDF'yi yeni sekmede aç" });
        const originalPdfUrl = await openPdfLink.getAttribute("href");
        await page.keyboard.press("Control+=");
        await expect(toolbar.getByText("%125", { exact: true })).toBeVisible();
        await expect(openPdfLink).toHaveAttribute("href", originalPdfUrl!);

        const firstEditor = form.locator("input:visible, textarea:visible, select:visible").first();
        await firstEditor.focus();
        await page.keyboard.press("Control+=");
        await expect(toolbar.getByText("%125", { exact: true })).toBeVisible();

        await toolbar.getByRole("button", { name: "Sığdır" }).click();
        await expect(toolbar.getByText("%100", { exact: true })).toBeVisible();

        // Gerçek Ctrl+tekerlek girdisi; yalnız sentetik WheelEvent viewport zoom'unu kanıtlamaz.
        const browserScale = await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio }));
        await previewRegion.evaluate((element) => {
          element.addEventListener("wheel", (event) => {
            element.setAttribute("data-wheel-prevented", String(event.defaultPrevented));
          }, { passive: true });
        });
        const zoom = toolbar.getByTestId("belge-studio-zoom-level");
        await previewRegion.hover();
        await page.keyboard.down("Control");
        try {
          await page.mouse.wheel(0, -120);
          await expect(previewRegion).toHaveAttribute("data-wheel-prevented", "true");
          await expect.poll(async () => Number((await zoom.innerText()).replace("%", ""))).toBeGreaterThan(100);
          const firstZoom = Number((await zoom.innerText()).replace("%", ""));
          await page.mouse.wheel(0, -120);
          await expect.poll(async () => Number((await zoom.innerText()).replace("%", ""))).toBeGreaterThan(firstZoom);
          await page.mouse.wheel(0, 120);
          await expect.poll(async () => Number((await zoom.innerText()).replace("%", ""))).toBeLessThan(firstZoom + 2);
        } finally {
          await page.keyboard.up("Control");
        }
        expect(await page.evaluate(() => ({ width: innerWidth, dpr: devicePixelRatio }))).toEqual(browserScale);
        const controls = await toolbar.locator("button, a").evaluateAll((elements) => elements.map((element) => {
          const rect = element.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }));
        for (const control of controls) {
          expect(control.width).toBeGreaterThanOrEqual(44);
          expect(control.height).toBeGreaterThanOrEqual(44);
        }
        const actions = studio.getByTestId("belge-studio-desktop-actions");
        await expect(actions.getByRole("button", { name: "PDF İndir", exact: true })).toBeVisible();
        const actionBox = await actions.boundingBox();
        expect(actionBox!.y + actionBox!.height).toBeLessThanOrEqual(viewport.height);
        await toolbar.getByRole("button", { name: "Sığdır" }).click();
        await expectNoHorizontalOverflow(page);
      }
      expect(passiveWarnings).toEqual([]);
    });
  }

  test("WebKit kritik /belgeler + 5 stüdyo akışı", async ({ browserName }, testInfo) => {
    requireMobile390(testInfo);
    expect(browserName).toBe("chromium");
    test.setTimeout(45_000);

    const port = Number(process.env.PLAYWRIGHT_PORT || 3005);
    let browserInstance: Awaited<ReturnType<typeof webkit.launch>> | null = null;

    try {
      browserInstance = await webkit.launch({ headless: true });
      const context = await browserInstance.newContext({
        viewport: { width: 390, height: 844 },
      });
      const page = await context.newPage();

      await page.goto(`http://127.0.0.1:${port}/belgeler`, {
        waitUntil: "domcontentloaded",
        timeout: 30_000,
      });
      await expect(page.getByRole("searchbox", { name: "Belge veya şablon ara" })).toBeVisible();

      for (const route of STUDIO_ROUTES) {
        await page.goto(`http://127.0.0.1:${port}${route.path}`, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });
        await expect(getVisibleStudio(page)).toBeVisible();
        await expectEditableFieldContract(page, route.fields);
        await expectPreviewCanvas(page);
        await expectNoHorizontalOverflow(page);
      }

      await context.close();
    } finally {
      if (browserInstance) {
        await browserInstance.close();
      }
    }
  });
});
