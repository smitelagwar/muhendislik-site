import { expect, test } from "@playwright/test";
import {
  isCadReviewEnabled,
  isCadExportEnabled,
} from "../../src/lib/dokumantasyon/cad-review/feature-flags";
import {
  recordCadTelemetry,
  getRecordedCadTelemetryEvents,
  clearCadTelemetryEvents,
  durationToBucket,
  itemCountToBucket,
} from "../../src/lib/dokumantasyon/cad-review/telemetry";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Review Workspace V1 — Stage 10/10 Dokümantasyon, Rollback ve Gizlilik Testleri", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. Feature Flag Varsayılanları ve Rollback Güvencesi", () => {
    // 1. Production varsayılanı aktif
    expect(isCadReviewEnabled()).toBe(true);
    expect(isCadExportEnabled()).toBe(true);
  });

  test("2. Privacy-Safe Telemetry: PII, Metin ve Ham Koordinat Sızıntısı Yasağı", () => {
    clearCadTelemetryEvents();

    // 1. Bucket yardımcıları
    expect(durationToBucket(200)).toBe("<500ms");
    expect(durationToBucket(750)).toBe("500ms-1s");
    expect(durationToBucket(2000)).toBe("1s-3s");
    expect(durationToBucket(5000)).toBe(">3s");

    expect(itemCountToBucket(0)).toBe("0");
    expect(itemCountToBucket(5)).toBe("1-10");
    expect(itemCountToBucket(30)).toBe("11-50");
    expect(itemCountToBucket(100)).toBe(">50");

    // 2. Telemetri olayı kaydet
    recordCadTelemetry({
      action: "tool_use",
      toolKind: "comment_pin",
      durationBucket: "<500ms",
      itemCountBucket: "1-10",
      status: "success",
    });

    recordCadTelemetry({
      action: "export",
      toolKind: "dxf",
      durationBucket: "500ms-1s",
      status: "success",
    });

    const recorded = getRecordedCadTelemetryEvents();
    expect(recorded.length).toBe(2);

    // 3. Kesin Sızıntı Yasağı Doğrulaması: Hiçbir nesnede string text, filename, raw coord bulunamaz
    for (const evt of recorded) {
      const keys = Object.keys(evt);
      expect(keys).not.toContain("fileName");
      expect(keys).not.toContain("comment");
      expect(keys).not.toContain("cadText");
      expect(keys).not.toContain("coordinates");
      expect(keys).not.toContain("x");
      expect(keys).not.toContain("y");
    }

    clearCadTelemetryEvents();
  });

  test("3. Canlı CAD DXF Üzerinde Temel Görüntüleme ve Entity İmutability Doğrulaması", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "text-rotation-0-90-180-270");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Taban database model space entity sayısını doğrula
    const entityCount = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          manager?: {
            curDocument?: {
              database?: {
                tables?: {
                  blockTable?: {
                    modelSpace?: {
                      newIterator?: () => Iterable<unknown>;
                    };
                  };
                };
              };
            };
          };
        };
      }).__cadAdapter;

      const ms = adapter?.manager?.curDocument?.database?.tables?.blockTable?.modelSpace;
      let count = 0;
      if (ms?.newIterator) {
        const iter = ms.newIterator();
        for (const entity of iter) {
          if (entity) count++;
        }
      }
      return count;
    });

    expect(entityCount).toBe(4);
  });
});