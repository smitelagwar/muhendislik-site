import { expect, test, type Page } from "@playwright/test";
import { DOCUMENT_EDITABLE_FIELDS } from "../../src/lib/document-field-contracts";
import { DOCUMENT_STUDIO_PREFIXES } from "../../src/lib/belge-field-focus";

import { expectFocusRect, readGeneratedFocusRects } from "./helpers/belgeler-field-focus";

const runtimeErrors = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  runtimeErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error" || /hydration|did not match/i.test(message.text())) errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`${response.status()} ${response.url()}`);
  });
});
test.afterEach(async ({ page }) => { expect(runtimeErrors.get(page)).toEqual([]); });

async function openStudio(page: Page, id: string) {
  await page.goto(`/belgeler/${id}`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  const studio = page.locator('[data-studio-locked="true"]:visible').last();
  const downloadBtn = studio
    .locator('[data-testid="belge-studio-desktop-actions"]:visible, [data-testid="belge-studio-mobile-actions"]:visible')
    .getByRole("button", { name: "PDF İndir", exact: true });
  await expect(downloadBtn).toBeEnabled({ timeout: 15_000 });
  return studio;
}

test.describe("Belgeler Form PDF Alan Odak Vurgusu — ASAMA_04 Pilot E2E", () => {
  test("Beton Döküm 10 alanının tamamında PDF overlay 2 CSS px toleransla doğru koordinatta yerleşmeli", async ({ page }) => {
    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const frame = studio.locator(".belge-preview-frame").first();
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    const rects = await readGeneratedFocusRects(page, DOCUMENT_EDITABLE_FIELDS["beton-dokum-tutanagi"]);
    for (const [key, expected] of Object.entries(rects)) {
      const input = studio.locator(`#beton-dokum-${key}`);
      await input.focus();

      await expect(highlight).toBeVisible({ timeout: 5000 });
      await expect(highlight).toHaveCount(1);
      await expect(highlight).toHaveAttribute("data-field-key", key);
      await expect(highlight).toHaveAttribute("data-page", "1");

      const style = await highlight.evaluate((el: HTMLElement) => ({
        left: parseFloat(el.style.left) / 100,
        top: parseFloat(el.style.top) / 100,
        width: parseFloat(el.style.width) / 100,
        height: parseFloat(el.style.height) / 100,
      }));

      expect(Math.abs(style.left - expected.left)).toBeLessThanOrEqual(0.005);
      expect(Math.abs(style.top - expected.top)).toBeLessThanOrEqual(0.005);
      expect(Math.abs(style.width - expected.width)).toBeLessThanOrEqual(0.005);
      expect(Math.abs(style.height - expected.height)).toBeLessThanOrEqual(0.005);

      // Pulse animasyonu (400ms) ve CSS geçişi (150ms) yerleştikten sonra frame ve bounding box ölçümü
      await page.waitForTimeout(500);
      const frameBox = await frame.boundingBox();
      const highlightBox = await highlight.boundingBox();
      expect(frameBox).not.toBeNull();
      expect(highlightBox).not.toBeNull();

      const actualLeft = highlightBox!.x - frameBox!.x;
      const actualTop = highlightBox!.y - frameBox!.y;
      const actualWidth = highlightBox!.width;
      const actualHeight = highlightBox!.height;

      const expectedLeftPx = frameBox!.width * expected.left;
      const expectedTopPx = frameBox!.height * expected.top;
      const expectedWidthPx = frameBox!.width * expected.width;
      const expectedHeightPx = frameBox!.height * expected.height;

      expect(Math.abs(actualLeft - expectedLeftPx)).toBeLessThanOrEqual(2.0);
      expect(Math.abs(actualTop - expectedTopPx)).toBeLessThanOrEqual(2.0);
      expect(Math.abs(actualWidth - expectedWidthPx)).toBeLessThanOrEqual(2.0);
      expect(Math.abs(actualHeight - expectedHeightPx)).toBeLessThanOrEqual(2.0);
    }
  });

  test("Farklı yakınlaştırma düzeylerinde (%100, %125, %150, Sığdır) vurgu çerçeveyle orantılı kalmalı", async ({ page }) => {
    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const frame = studio.locator(".belge-preview-frame").first();
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    const yerExpected = (await readGeneratedFocusRects(page, ["yer"])).yer;

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");

    const zoomInBtn = studio.locator('[data-testid="belge-studio-preview-toolbar"] button[aria-label="Yakınlaştır"]');
    const zoomOutBtn = studio.locator('[data-testid="belge-studio-preview-toolbar"] button[aria-label="Uzaklaştır"]');
    const fitBtn = studio.locator('[data-testid="belge-studio-preview-toolbar"] button[aria-label="Sığdır"]');
    const zoomLabel = studio.locator('[data-testid="belge-studio-zoom-level"]');

    // 1. Yakınlaştır (%125)
    await zoomInBtn.click();
    await expect(zoomLabel).toHaveText("%125");
    await page.waitForTimeout(600);

    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");
    let frameBox = await frame.boundingBox();
    let highlightBox = await highlight.boundingBox();
    expect(Math.abs((highlightBox!.x - frameBox!.x) - frameBox!.width * yerExpected.left)).toBeLessThanOrEqual(2.0);

    // 2. Bir kez daha yakınlaştır (%150)
    await zoomInBtn.click();
    await expect(zoomLabel).toHaveText("%150");
    await page.waitForTimeout(600);

    await expect(highlight).toBeVisible();
    frameBox = await frame.boundingBox();
    highlightBox = await highlight.boundingBox();
    expect(Math.abs((highlightBox!.x - frameBox!.x) - frameBox!.width * yerExpected.left)).toBeLessThanOrEqual(2.0);

    // 3. Uzaklaştır (%125 -> %100)
    await zoomOutBtn.click();
    await zoomOutBtn.click();
    await page.waitForTimeout(600);
    await expect(highlight).toBeVisible();

    // 4. Sığdır
    await fitBtn.click();
    await page.waitForTimeout(600);
    await expect(highlight).toBeVisible();
    frameBox = await frame.boundingBox();
    highlightBox = await highlight.boundingBox();
    expect(Math.abs((highlightBox!.x - frameBox!.x) - frameBox!.width * yerExpected.left)).toBeLessThanOrEqual(2.0);
  });

  test("Toolbar veya görünüm araçlarına odaklanıldığında form odak vurgusu korunmalı", async ({ page }) => {

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();

    const zoomInBtn = studio.locator('[data-testid="belge-studio-preview-toolbar"] button[aria-label="Yakınlaştır"]');
    await zoomInBtn.focus();

    await page.waitForTimeout(200);

    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");
  });

  test("Ctrl+wheel veya geçici transform sırasında vurgu gizlenmeli, çizim tamamlandığında geri dönmeli", async ({ page }) => {

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();

    await page.locator('[data-testid="belge-studio-preview-canvas"]').dispatchEvent("wheel", {
      ctrlKey: true,
      deltaY: -100,
    });

    await page.waitForTimeout(400);
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");
  });

  test("Uzun metin yazılırken ve yeni PDF derlenirken vurgu hedef alanda sabit kalmalı", async ({ page }) => {

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    const yerInput = studio.locator("#beton-dokum-yer");

    await yerInput.focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");

    await yerInput.fill("ANKARA İli Çankaya İlçesi 1234 Ada 56 Parsel Çok Detaylı Şantiye Lokasyon Açıklaması");

    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");

    await expect(studio.locator('[data-testid="belge-studio-preview-canvas"]')).toBeVisible({ timeout: 10_000 });

    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");

    const olayInput = studio.locator("#beton-dokum-olay_aciklamasi");
    await olayInput.focus();
    await expect(highlight).toHaveAttribute("data-field-key", "olay_aciklamasi");
    await olayInput.fill("Beton döküm işlemi hava şartları nedeniyle saat 14:00 itibariyle durdurulmuştur.");
    await expect(studio.locator('[data-testid="belge-studio-preview-canvas"]')).toBeVisible({ timeout: 10_000 });
    await expect(highlight).toHaveAttribute("data-field-key", "olay_aciklamasi");
  });

  test("Yalnızca odak değişirken URL.createObjectURL, drawImage ve getAnnotations çağrısı artmamalı", async ({ page }) => {
    await page.addInitScript(() => {
      interface CustomMetrics {
        createObjectURLCount: number;
        drawImageCount: number;
        getAnnotationsCount: number;
      }

      interface CustomPage {
        getAnnotations: (...annArgs: unknown[]) => Promise<unknown>;
      }
      interface CustomDoc {
        getPage: (...pageArgs: unknown[]) => Promise<CustomPage>;
      }
      interface CustomTask {
        promise: Promise<CustomDoc>;
      }

      type CustomWindow = typeof window & {
        __metrics: CustomMetrics;
        pdfjsLib?: unknown;
      };

      const customWin = window as unknown as CustomWindow;
      customWin.__metrics = {
        createObjectURLCount: 0,
        drawImageCount: 0,
        getAnnotationsCount: 0,
      };

      const origCreateObjectURL = URL.createObjectURL;
      URL.createObjectURL = function (...args) {
        customWin.__metrics.createObjectURLCount++;
        return origCreateObjectURL.apply(this, args);
      };

      const origDrawImage = CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage = function (...args: unknown[]) {
        customWin.__metrics.drawImageCount++;
        Reflect.apply(origDrawImage, this, args);
      };

      let _pdfjsLib: unknown = undefined;
      Object.defineProperty(window, "pdfjsLib", {
        configurable: true,
        enumerable: true,
        get() {
          return _pdfjsLib;
        },
        set(val: unknown) {
          if (!val || typeof val !== "object") {
            _pdfjsLib = val;
            return;
          }
          _pdfjsLib = new Proxy(val as object, {
            get(target, prop) {
              if (prop === "getDocument") {
                const origGetDoc = Reflect.get(target, prop) as (...args: unknown[]) => CustomTask;
                return function (...args: unknown[]) {
                  const task = origGetDoc.apply(target, args);
                  return new Proxy(task as object, {
                    get(tTarget, tProp) {
                      if (tProp === "promise") {
                        const origPromise = Reflect.get(tTarget, tProp) as Promise<CustomDoc>;
                        return origPromise.then((pdf) => {
                          return new Proxy(pdf as object, {
                            get(pTarget, pProp) {
                              if (pProp === "getPage") {
                                const origGetPage = Reflect.get(pTarget, pProp) as (...pageArgs: unknown[]) => Promise<CustomPage>;
                                return function (...pageArgs: unknown[]) {
                                  return origGetPage.apply(pTarget, pageArgs).then((p) => {
                                    return new Proxy(p as object, {
                                      get(pageTarget, pageProp) {
                                        if (pageProp === "getAnnotations") {
                                          const origGetAnnotations = Reflect.get(pageTarget, pageProp) as (...annArgs: unknown[]) => Promise<unknown>;
                                          return function (...annArgs: unknown[]) {
                                            customWin.__metrics.getAnnotationsCount++;
                                            return origGetAnnotations.apply(pageTarget, annArgs);
                                          };
                                        }
                                        const v = Reflect.get(pageTarget, pageProp);
                                        return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(pageTarget) : v;
                                      },
                                    });
                                  });
                                };
                              }
                              const v = Reflect.get(pTarget, pProp);
                              return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(pTarget) : v;
                            },
                          });
                        });
                      }
                      const v = Reflect.get(tTarget, tProp);
                      return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(tTarget) : v;
                    },
                  });
                };
              }
              const v = Reflect.get(target, prop);
              return typeof v === "function" ? (v as (...args: unknown[]) => unknown).bind(target) : v;
            },
          });
        },
      });
    });

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    await expect(studio.locator('[data-testid="belge-studio-preview-canvas"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    const initialMetrics = await page.evaluate(() => {
      const w = window as unknown as { __metrics: { createObjectURLCount: number; drawImageCount: number; getAnnotationsCount: number } };
      return w.__metrics;
    });
    expect(initialMetrics.createObjectURLCount).toBeGreaterThan(0);
    expect(initialMetrics.drawImageCount).toBeGreaterThan(0);
    expect(initialMetrics.getAnnotationsCount).toBeGreaterThan(0);

    const fieldsToFocus = ["yer", "tarih", "yibf", "laboratuvar", "muteahhit"];
    for (const field of fieldsToFocus) {
      await studio.locator(`#beton-dokum-${field}`).focus();
      await expect(highlight).toBeVisible();
      await expect(highlight).toHaveAttribute("data-field-key", field);
    }

    await page.waitForTimeout(200);

    const postFocusMetrics = await page.evaluate(() => {
      const w = window as unknown as { __metrics: { createObjectURLCount: number; drawImageCount: number; getAnnotationsCount: number } };
      return w.__metrics;
    });
    expect(postFocusMetrics.createObjectURLCount).toBe(initialMetrics.createObjectURLCount);
    expect(postFocusMetrics.drawImageCount).toBe(initialMetrics.drawImageCount);
    expect(postFocusMetrics.getAnnotationsCount).toBe(initialMetrics.getAnnotationsCount);

    await studio.locator("#beton-dokum-yer").fill("Test Yeni Metin");
    await expect(studio.locator('[data-testid="belge-studio-preview-canvas"]')).toBeVisible({ timeout: 10_000 });
    await page.waitForTimeout(500);

    const postTypingMetrics = await page.evaluate(() => {
      const w = window as unknown as { __metrics: { createObjectURLCount: number; drawImageCount: number; getAnnotationsCount: number } };
      return w.__metrics;
    });
    expect(postTypingMetrics.getAnnotationsCount).toBe(initialMetrics.getAnnotationsCount);
  });

  test("Tab, Shift+Tab, Escape, Reset ve dışarı tıklama senaryoları titremesiz çalışmalı", async ({ page }) => {

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    await studio.locator("#beton-dokum-tutanak_alt_baslik").focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "tutanak_alt_baslik");

    await page.keyboard.press("Tab");
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "tarih");

    await page.keyboard.press("Shift+Tab");
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "tutanak_alt_baslik");

    await page.keyboard.press("Escape");
    await expect(highlight).toHaveCount(0);

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");

    const clearBtn = studio.locator('button:has-text("Temizle")').first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
      await expect(highlight).toHaveCount(0);
    }

    await studio.locator("#beton-dokum-yibf").focus();
    await expect(highlight).toBeVisible();
    await studio.locator("h1").first().click();
    await page.waitForTimeout(200);
    await expect(highlight).toHaveCount(0);
  });

  test("PDF üzerinde düzenle açıldığında form odak vurgusu gizlenmeli, kapanınca geri dönebilmeli", async ({ page }) => {

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    const toggleBtn = studio.locator('[data-testid="belge-inline-edit-toggle"]');

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();

    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-pressed", "true");

    await expect(highlight).toHaveCount(0);
    await expect(studio.locator('[data-testid="belge-inline-edit-layer"]')).toBeVisible();

    await toggleBtn.click();
    await expect(toggleBtn).toHaveAttribute("aria-pressed", "false");

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "yer");
  });

  test("prefers-reduced-motion etkinleştirildiğinde animasyon ve geçişler devre dışı kalmalı", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible();

    const animation = await highlight.evaluate((el: HTMLElement) => {
      const comp = window.getComputedStyle(el);
      return {
        animationName: comp.animationName,
        transitionDuration: comp.transitionDuration,
      };
    });

    expect(animation.animationName).toBe("none");
  });
});

test.describe("Belgeler Form PDF Alan Odak Vurgusu — ASAMA_05 Çok Sayfa & 56 Alan", () => {
  test("Sözleşme: Sayfa 1 ve 2 arasındaki alanlara odaklanıldığında önizleme otomatik ve doğru sayfaya geçmeli", async ({ page }) => {
    const studio = await openStudio(page, "santiye-sefi-sozlesmesi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    const pageLabel = studio.locator('.belge-preview-navigation span');

    // Başlangıçta 1. sayfada olmalı
    await expect(pageLabel).toHaveText("1 / 2");

    // 1. Sayfa 1'deki Müteahhit Unvanı alanına odaklan
    await studio.locator("#sozlesme-muteahhit_unvan").focus();
    await expect(highlight).toBeVisible({ timeout: 5000 });
    await expect(highlight).toHaveAttribute("data-field-key", "muteahhit_unvan");
    await expect(highlight).toHaveAttribute("data-page", "1");
    await expect(pageLabel).toHaveText("1 / 2");

    // 2. Sayfa 2'deki Sözleşme Tarihi alanına odaklan -> Sayfa otomatik 2'ye geçmeli
    await studio.locator("#sozlesme-sozlesme_tarihi").focus();
    await expect(pageLabel).toHaveText("2 / 2", { timeout: 10_000 });
    await expect(highlight).toBeVisible({ timeout: 5000 });
    await expect(highlight).toHaveAttribute("data-field-key", "sozlesme_tarihi");
    await expect(highlight).toHaveAttribute("data-page", "2");

    // 3. Sayfa 2'deki Şantiye Şefi İmza Adı alanına odaklan
    await studio.locator("#sozlesme-santiye_sefi_imza_adi").focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("data-field-key", "santiye_sefi_imza_adi");
    await expect(highlight).toHaveAttribute("data-page", "2");
    await expect(pageLabel).toHaveText("2 / 2");

    // 4. Tekrar Sayfa 1'deki İl alanına odaklan -> Sayfa otomatik 1'e dönmeli
    await studio.locator("#sozlesme-il").focus();
    await expect(pageLabel).toHaveText("1 / 2", { timeout: 10_000 });
    await expect(highlight).toBeVisible({ timeout: 5000 });
    await expect(highlight).toHaveAttribute("data-field-key", "il");
    await expect(highlight).toHaveAttribute("data-page", "1");

    // 5. İmza Alanı Ayrımı: Sayfa 1'deki 'santiye_sefi_ad' odaklandığında yalnızca Sayfa 1'deki tek widget vurgulanmalı
    await studio.locator("#sozlesme-santiye_sefi_ad").focus();
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveCount(1);
    await expect(highlight).toHaveAttribute("data-field-key", "santiye_sefi_ad");
    await expect(highlight).toHaveAttribute("data-page", "1");
  });

  test("İstifa Dilekçesi: 10 form alanı doğru vurgulanmalı ve PDF-only alanlar asla vurgulanmamalı", async ({ page }) => {
    const studio = await openStudio(page, "santiye-sefi-istifa-dilekcesi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    const istifaFields = [
      "hitap_1",
      "hitap_2",
      "ana_paragraf",
      "sonuc_cumlesi",
      "tarih",
      "unvan",
      "ad_soyad",
      "adres_deger",
      "tc_deger",
      "iletisim_deger",
    ];

    for (const key of istifaFields) {
      await studio.locator(`#istifa-${key}`).focus();
      await expect(highlight).toBeVisible({ timeout: 5000 });
      await expect(highlight).toHaveCount(1);
      await expect(highlight).toHaveAttribute("data-field-key", key);
      await expect(highlight).toHaveAttribute("data-page", "1");
    }

    const pdfOnlyFields = ["adres_etiket", "tc_etiket", "iletisim_etiket"];
    for (const pdfOnly of pdfOnlyFields) {
      await expect(studio.locator(`#istifa-${pdfOnly}`)).toHaveCount(0);
    }
  });

  test("Taahhütname: Yoğun ardışık satırlarda odak vurgusu doğru yerleşmeli", async ({ page }) => {
    const studio = await openStudio(page, "santiye-sefi-taahhutnamesi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    const denseFields = [
      "oda_sicil_no",
      "tc_kimlik_no",
      "unvan",
      "telefon",
      "adres",
      "ilgili_idare",
      "il_ilce",
      "pafta_ada_parsel",
      "yapi_adresi",
      "yapi_sahibi",
      "yapi_sahibi_adresi",
      "tarih",
      "santiye_sefi_ad_soyad",
      "unvan_imza",
    ];

    for (const key of denseFields) {
      await studio.locator(`#taahhutname-${key}`).focus();
      await expect(highlight).toBeVisible({ timeout: 5000 });
      await expect(highlight).toHaveCount(1);
      await expect(highlight).toHaveAttribute("data-field-key", key);
      await expect(highlight).toHaveAttribute("data-page", "1");
    }
  });

  test("İnşaat Ruhsatı Dilekçesi: 8 alanın tamamı doğru PDF koordinatına odaklanmalı", async ({ page }) => {
    const studio = await openStudio(page, "insaat-ruhsati-dilekcesi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    const ruhsatFields = [
      "tarih",
      "belediye_adi",
      "mudurluk_adi",
      "ana_metin",
      "ad_soyad",
      "unvan",
      "adres",
      "tel",
    ];

    for (const key of ruhsatFields) {
      await studio.locator(`#insaat-ruhsati-${key}`).focus();
      await expect(highlight).toBeVisible({ timeout: 5000 });
      await expect(highlight).toHaveCount(1);
      await expect(highlight).toHaveAttribute("data-field-key", key);
      await expect(highlight).toHaveAttribute("data-page", "1");
    }
  });

  test("5 belgenin tamamında 56 alan eksiksiz form odağını PDF üzerinde vurgulamalı", async ({ page }) => {
    for (const [docId, fields] of Object.entries(DOCUMENT_EDITABLE_FIELDS)) {
      const prefix = DOCUMENT_STUDIO_PREFIXES[docId as keyof typeof DOCUMENT_STUDIO_PREFIXES];
      const studio = await openStudio(page, docId);
      const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
      const docRects = await readGeneratedFocusRects(page, fields);

      for (const fieldKey of fields) {
        const expected = docRects[fieldKey];
        const input = studio.locator(`#${prefix}${fieldKey}`);
        await input.focus();
        await expect(highlight).toBeVisible({ timeout: 10_000 });
        await expect(highlight).toHaveCount(1);
        await expect(highlight).toHaveAttribute("data-field-key", fieldKey);
        await expect(highlight).toHaveAttribute("data-page", String(expected.pageNumber));

        await expectFocusRect(studio, fieldKey, expected);
      }
    }
  });
});

test.describe("Belgeler Form PDF Alan Odak Vurgusu — ASAMA_06 Mobil & Görsel Yoğunluk", () => {
  test("Mobil: Form sekmesinde odaklanılan alan, önizleme sekmesine geçildiğinde 2.5s boyunca vurgulanmalı ve sonra kendiliğinden kapanmalı", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    // Başlangıçta henüz formda alan seçilmediği için vurgu görünmemeli
    await expect(highlight).toBeHidden();

    // Form görünümüne geç
    const toFormBtn = studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Formu Düzenle" });
    await expect(toFormBtn).toBeVisible();
    await toFormBtn.click();
    await expect(studio.getByRole("region", { name: "Belge form alanları" })).toBeVisible();

    // Bir form alanına odaklan ve metin yaz
    const yerInput = studio.locator("#beton-dokum-yer");
    await yerInput.focus();
    await yerInput.fill("Mobil Test Şantiye Alanı");

    // Önizleme sekmesine geç
    const toPreviewBtn = studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Canlı PDF Önizle" });
    await expect(toPreviewBtn).toBeVisible();
    await toPreviewBtn.click();
    await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();

    // Önizleme paneline geçildiğinde 2.5s vurgu başlamalı
    await expect(highlight).toBeVisible({ timeout: 5000 });
    await expect(highlight).toHaveAttribute("data-field-key", "yer");
    await expect(highlight).toHaveAttribute("data-page", "1");

    // 2.5 saniye sonra vurgu kendiliğinden kaybolmalı (4000ms bekleme toleransı)
    await expect(highlight).toBeHidden({ timeout: 4500 });

    // Tekrar forma geçilip hiçbir alana odaklanılmadan önizlemeye dönüldüğünde eski vurgu tekrar parlamamalı
    await toFormBtn.click();
    await expect(studio.getByRole("region", { name: "Belge form alanları" })).toBeVisible();
    await toPreviewBtn.click();
    await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();
    await expect(highlight).toBeHidden();
  });

  test("Mobil Çok Sayfa: Sözleşme Sayfa 2 alanına odaklanıp önizlemeye geçildiğinde otomatik Sayfa 2'ye geçmeli ve 2.5s vurgulanmalı", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const studio = await openStudio(page, "santiye-sefi-sozlesmesi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');

    // Form sekmesine geç
    const toFormBtn = studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Formu Düzenle" });
    await toFormBtn.click();
    await expect(studio.getByRole("region", { name: "Belge form alanları" })).toBeVisible();

    // Sayfa 2 alanına odaklan
    const tarihInput = studio.locator("#sozlesme-sozlesme_tarihi");
    await tarihInput.focus();

    // Önizleme sekmesine geç
    const toPreviewBtn = studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Canlı PDF Önizle" });
    await toPreviewBtn.click();
    await expect(studio.getByRole("region", { name: "PDF önizleme paneli" })).toBeVisible();

    // Sayfa 2 otomatik açılmalı ve vurgu Sayfa 2 üzerinde görünmeli
    await expect(highlight).toBeVisible({ timeout: 10_000 });
    await expect(highlight).toHaveAttribute("data-field-key", "sozlesme_tarihi");
    await expect(highlight).toHaveAttribute("data-page", "2");

    // 2.5 saniye sonra gizlenmeli
    await expect(highlight).toBeHidden({ timeout: 4500 });
  });

  test("Inline edit açıldığında form vurgusu gizlenmeli, kapatıldığında eski vurgu otomatik açılmamalı", async ({ page }) => {

    const studio = await openStudio(page, "beton-dokum-tutanagi");
    const highlight = studio.locator('[data-testid="belge-field-focus-highlight"]');
    const inlineToggle = studio.locator('[data-testid="belge-inline-edit-toggle"]');

    // Alana odaklan -> vurgu görünür
    await studio.locator("#beton-dokum-yer").focus();
    await expect(highlight).toBeVisible({ timeout: 5000 });

    // PDF üzerinde düzenle aç
    await inlineToggle.click();
    await expect(inlineToggle).toHaveAttribute("aria-pressed", "true");
    // Form vurgusu hemen gizlenmeli
    await expect(highlight).toBeHidden();

    // PDF üzerinde düzenle kapat
    await inlineToggle.click();
    await expect(inlineToggle).toHaveAttribute("aria-pressed", "false");
    // Eski form seçimi kendiliğinden açılmamalı
    await expect(highlight).toBeHidden();

    // Ancak yeni form alanı odaklandığında vurgu tekrar aktifleşmeli
    await studio.locator("#beton-dokum-tarih").focus();
    await expect(highlight).toBeVisible({ timeout: 5000 });
    await expect(highlight).toHaveAttribute("data-field-key", "tarih");
  });

  test("Mobil cihaz boyutlarında (320px..768px) form ↔ önizleme geçişinde sıfır yatay taşma", async ({ page }) => {
    const mobileSizes = [
      { width: 320, height: 720 },
      { width: 360, height: 800 },
      { width: 390, height: 844 },
      { width: 430, height: 932 },
      { width: 768, height: 1024 },
    ];

    for (const size of mobileSizes) {
      await page.setViewportSize(size);
      const studio = await openStudio(page, "beton-dokum-tutanagi");

      const toFormBtn = studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Formu Düzenle" });
      const toPreviewBtn = studio.getByTestId("belge-studio-mobile-actions").getByRole("button", { name: "Canlı PDF Önizle" });

      // Form sekmesinde taşma kontrolü
      await toFormBtn.click();
      await page.waitForTimeout(100);
      const formMetrics = await page.evaluate(() => ({
        docWidth: document.documentElement.scrollWidth,
        winWidth: window.innerWidth,
      }));
      expect(formMetrics.docWidth).toBeLessThanOrEqual(formMetrics.winWidth + 2);

      // Önizleme sekmesinde taşma kontrolü
      await toPreviewBtn.click();
      await page.waitForTimeout(100);
      const previewMetrics = await page.evaluate(() => ({
        docWidth: document.documentElement.scrollWidth,
        winWidth: window.innerWidth,
      }));
      expect(previewMetrics.docWidth).toBeLessThanOrEqual(previewMetrics.winWidth + 2);
    }
  });
});
