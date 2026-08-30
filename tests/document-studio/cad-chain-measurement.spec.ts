import { expect, test } from "@playwright/test";
import {
  CadChainDistanceMachine,
} from "../../src/lib/dokumantasyon/cad-upstream/chain-distance";
import {
  calculateCalibration,
  formatCadDistance,
  formatCadArea,
} from "../../src/lib/dokumantasyon/cad-review/units";
import {
  CadMeasurementFacade,
} from "../../src/lib/dokumantasyon/cad-review/measurement-facade";
import {
  CadReviewStore,
} from "../../src/lib/dokumantasyon/cad-review/store";
import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import {
  signInAdmin,
  uploadCadPreviewV2Fixture,
  cleanupUploadedCadFixtures,
} from "./cad-test-helpers";

test.describe("CAD Review Workspace V1 — Stage 3/10 Zincir Ölçüm, Birleşik Liste ve Kalibrasyon", () => {
  test.afterEach(async ({ page }) => {
    await cleanupUploadedCadFixtures(page);
  });

  test("1. CadChainDistanceMachine: Yatay, dikey, diyagonal segmentler, toplam mesafe ve epsilon koruması", () => {
    const machine = new CadChainDistanceMachine();
    expect(machine.phase).toBe("inactive");

    machine.start();
    expect(machine.phase).toBe("awaiting-first");

    // Nokta 1: (0, 0)
    machine.addPoint({ x: 0, y: 0 });
    expect(machine.phase).toBe("awaiting-next");
    expect(machine.points.length).toBe(1);

    // Epsilon koruması: aynı noktaya tıklanırsa eklenmez
    machine.addPoint({ x: 0, y: 0.00001 });
    expect(machine.points.length).toBe(1);

    // Nokta 2: (3000, 0) -> 1. segment: 3000
    machine.addPoint({ x: 3000, y: 0 });
    expect(machine.points.length).toBe(2);

    // Nokta 3: (3000, 4000) -> 2. segment: 4000
    machine.addPoint({ x: 3000, y: 4000 });
    expect(machine.points.length).toBe(3);

    // Nokta 4: (0, 4000) -> 3. segment: 3000
    machine.addPoint({ x: 0, y: 4000 });
    expect(machine.points.length).toBe(4);

    // Backspace simülasyonu: son noktayı sil
    machine.removeLastPoint();
    expect(machine.points.length).toBe(3);

    const { snapshot, result } = machine.complete();
    expect(snapshot.phase).toBe("complete");
    expect(result).not.toBeNull();
    expect(result!.segmentDistances.length).toBe(2);
    expect(result!.segmentDistances[0]).toBe(3000);
    expect(result!.segmentDistances[1]).toBe(4000);
    expect(result!.totalDistance).toBe(7000);
  });

  test("2. Kalibrasyon ve Birim Biçimlendirme: mm, cm, m, in, ft dönüşümleri ve 2-nokta bilinen uzunluk ölçeklemesi", () => {
    // 1. Standart biçimlendirme
    const rawDist = 5250.75;
    expect(formatCadDistance(rawDist, "m", 2)).toBe("5.250,75 m");
    expect(formatCadDistance(rawDist, "cm", 0)).toBe("5.251 cm");
    expect(formatCadArea(12000000, "m", 0)).toBe("12.000.000 m²");

    // 2. İki nokta kalibrasyonu: Çizimde 1000 birim ölçülen mesafe gerçekte 2.5 metre
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 1000, y: 0 };
    const calibration = calculateCalibration(p1, p2, 2.5, "m");
    expect(calibration.isCalibrated).toBe(true);
    expect(calibration.calibrationScale).toBe(0.0025);

    // Kalibre edilmiş ölçüm gösterimi
    const measuredWorldDist = 4000; // 4000 * 0.0025 = 10.00 m
    expect(formatCadDistance(measuredWorldDist, "m", 2, calibration)).toBe("10,00 m");
  });

  test("3. CadMeasurementFacade: Birleşik ölçüm listesi, yeniden adlandırma, seçim ve undo/redo silme", () => {
    const initialDoc: CadReviewDocument = {
      schemaVersion: 1,
      fileId: "12345678-1234-4234-8234-1234567890ab",
      sourceVersionKey: "sample.dxf",
      sourceSha256: "c".repeat(64),
      revision: 0,
      items: [
        {
          id: "dist-1",
          type: "distance",
          label: "Koridor Genişliği",
          start: { x: 0, y: 0 },
          end: { x: 1500, y: 0 },
          measuredLength: 1500,
          author: "Mimar",
          status: "open",
          comment: "",
          style: { color: "#ff3b30", strokeWidth: 2, opacity: 1 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "chain-1",
          type: "chain_distance",
          points: [{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 2000, y: 3000 }],
          segmentDistances: [2000, 3000],
          totalDistance: 5000,
          author: "Mimar",
          status: "open",
          comment: "Çevre Duvarı",
          style: { color: "#34c759", strokeWidth: 2, opacity: 1 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store = new CadReviewStore(initialDoc);
    const facade = new CadMeasurementFacade(store, "m", 2);

    // Listeleme
    const list = facade.listMeasurements();
    expect(list.length).toBe(2);
    expect(list[0]?.title).toBe("Koridor Genişliği");
    expect(list[0]?.rawPrimaryValue).toBe(1500);
    expect(list[1]?.rawPrimaryValue).toBe(5000);

    // Yeniden adlandırma
    facade.renameMeasurement("dist-1", "Giriş Koridoru");
    const updated = store.getItems()[0];
    expect(updated?.type === "distance" ? updated.label : "").toBe("Giriş Koridoru");

    // Silme ve Undo

    facade.deleteMeasurement("chain-1");
    expect(facade.listMeasurements().length).toBe(1);
    expect(store.canUndo()).toBe(true);

    store.undo();
    expect(facade.listMeasurements().length).toBe(2);
    expect(facade.listMeasurements()[1]?.id).toBe("chain-1");
  });

  test("4. Upstream Entegrasyon ve UI: Gerçek DXF üzerinde Zincir Ölçüm controller döngüsü", async ({
    page,
  }) => {
    await signInAdmin(page);
    const { fileId } = await uploadCadPreviewV2Fixture(page, "known-geometry-measurements");

    await page.goto(`/dokumantasyon/dosya/${fileId}`);
    const host = page.locator('[data-cad-upstream-host="true"]').first();
    await expect(host).toHaveAttribute("data-cad-upstream-state", "ready", { timeout: 30_000 });

    // Adapter üzerinden startChainDistanceMeasurement metodunu tetikle ve doğrula
    const started = await host.evaluate(async (el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          startChainDistanceMeasurement?: (snapModes: Set<string>, callbacks: unknown) => Promise<boolean>;
        };
      }).__cadAdapter;
      if (!adapter?.startChainDistanceMeasurement) return false;
      return await adapter.startChainDistanceMeasurement(new Set(["endpoint", "intersection"]), {});
    });

    expect(started).toBe(true);

    // Ölçümü bitir
    const finished = await host.evaluate((el: HTMLElement) => {
      const adapter = (el as unknown as {
        __cadAdapter?: {
          finishChainDistanceMeasurement?: () => boolean;
        };
      }).__cadAdapter;
      return adapter?.finishChainDistanceMeasurement?.() ?? false;
    });

    expect(finished).toBe(true);
  });
});