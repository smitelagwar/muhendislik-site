import { expect, test } from "@playwright/test";
import {
  CadTextSearchIndex,
  normalizeTurkishText,
  cleanMText,
  intersectsAabb,
  type CadTextEntityInfo,
} from "../../src/lib/dokumantasyon/cad-upstream/text-search";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Review Workspace V1 — Stage 4/10 Global ve Dikdörtgen Bölgesel CAD Metin Araması", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Türkçe Unicode Normalizasyonu (İ/i/ı/I) ve MTEXT Biçim Temizliği", () => {
    // 1. Türkçe normalizasyon
    expect(normalizeTurkishText("İSTANBUL")).toBe("istanbul");
    expect(normalizeTurkishText("IŞIK")).toBe("ışık");
    expect(normalizeTurkishText("ÇARŞI VE ÖĞRETMEN")).toBe("çarşı ve öğretmen");

    // 2. MTEXT temizliği: \P -> boşluk, braces silme, font ve biçim dizilerini temizleme
    const rawMText = "{\\fArial|b0|i0|c162|p34;\\C1;BİRİNCİ KAT\\PPLAN NOTU}";
    const cleaned = cleanMText(rawMText);
    expect(cleaned).toBe("BİRİNCİ KAT PLAN NOTU");
  });

  test("2. CadTextSearchIndex: Global arama, katman filtresi ve AABB bölgesel kesişim (intersectsAabb)", () => {
    const items: CadTextEntityInfo[] = [
      {
        id: "txt-1",
        handle: "H1",
        type: "TEXT",
        text: "KİRİŞ K101",
        normalizedText: "kiriş k101",
        layer: "STATIK_KIRIS",
        layout: "Model",
        anchor: { x: 100, y: 100 },
        bounds: { min: { x: 100, y: 100 }, max: { x: 150, y: 120 } },
        rotationDeg: 0,
      },
      {
        id: "txt-2",
        handle: "H2",
        type: "TEXT",
        text: "KİRİŞ K102",
        normalizedText: "kiriş k102",
        layer: "STATIK_KIRIS",
        layout: "Model",
        anchor: { x: 500, y: 500 },
        bounds: { min: { x: 500, y: 500 }, max: { x: 550, y: 520 } },
        rotationDeg: 0,
      },
      {
        id: "txt-3",
        handle: "H3",
        type: "MTEXT",
        text: "KOLON S101",
        normalizedText: "kolon s101",
        layer: "STATIK_KOLON",
        layout: "Model",
        anchor: { x: 120, y: 110 },
        bounds: { min: { x: 120, y: 110 }, max: { x: 170, y: 130 } },
        rotationDeg: 0,
      },
    ];

    const index = new CadTextSearchIndex(items);
    expect(index.count).toBe(3);

    // 1. Global arama: "kiriş" -> 2 sonuç
    const globalRes = index.search({ query: "kiriş" });
    expect(globalRes.length).toBe(2);

    // 2. Katman filtresi: yalnız "STATIK_KOLON" katmanında ara -> 0 sonuç
    const layerFilterRes = index.search({ query: "kiriş", layerFilter: ["STATIK_KOLON"] });
    expect(layerFilterRes.length).toBe(0);

    // 3. Bölgesel seçim: [50, 50] - [200, 200] kutusu
    // Bu bölgede txt-1 (100, 100) ve txt-3 (120, 110) var, txt-2 (500, 500) dışarıda
    const region = { min: { x: 50, y: 50 }, max: { x: 200, y: 200 } };
    const regionRes = index.search({ query: "kiriş", region });
    expect(regionRes.length).toBe(1);
    expect(regionRes[0]?.item.id).toBe("txt-1");

    // Kesişim mantığı testi
    expect(intersectsAabb(items[0]!.bounds, region)).toBe(true);
    expect(intersectsAabb(items[1]!.bounds, region)).toBe(false);
  });

  test("3. Gerçek DXF Üzerinde Adapter searchCadText ve zoomToBounds Entegrasyonu", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Fixture içinde TEXT_ROT_0, TEXT_ROT_90, TEXT_ROT_180, TEXT_ROT_270 var
    const searchResults = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          searchCadText?: (query: { query: string }) => Array<{ item: { text: string } }>;
          zoomToBounds?: (b: { min: { x: number; y: number }; max: { x: number; y: number } }) => Promise<void>;
        };
      }).__cadAdapter;
      return adapter?.searchCadText?.({ query: "TEXT_ROT" }) ?? [];
    });

    expect(searchResults.length).toBe(4);

    // Zoom to bounds çağrısının takılmadan tamamlandığını doğrula
    const zoomSuccess = await host.evaluate(async (el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          zoomToBounds?: (b: { min: { x: number; y: number }; max: { x: number; y: number } }) => Promise<void>;
        };
      }).__cadAdapter;
      if (!adapter?.zoomToBounds) return false;
      await adapter.zoomToBounds({ min: { x: 0, y: 0 }, max: { x: 300, y: 100 } });
      return true;
    });

    expect(zoomSuccess).toBe(true);
  });
});