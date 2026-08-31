import { expect, test } from "@playwright/test";

import {
  calculateCalibrationFromWorldDistance,
  convertArea,
  convertDistance,
  formatArea,
  formatDistance,
  type CadSourceUnitContext,
} from "../../src/lib/dokumantasyon/cad-review/units";
import {
  CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS,
  CadReviewStore,
  getCurrentCadMeasurementUnitSettings,
} from "../../src/lib/dokumantasyon/cad-review/store";
import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";

const mmSource: CadSourceUnitContext = {
  sourceUnit: "mm",
  mmPerWorldUnit: 1,
  source: "dxf-insunits",
};

test.describe("CAD Stage 1 — fiziksel ölçüm birimleri", () => {
  test("2 m aynı geometride m/cm/mm olarak gerçek matematiksel dönüşür", () => {
    const worldDistance = 2000;

    expect(convertDistance(worldDistance, mmSource, "m")).toBe(2);
    expect(convertDistance(worldDistance, mmSource, "cm")).toBe(200);
    expect(convertDistance(worldDistance, mmSource, "mm")).toBe(2000);

    expect(formatDistance(worldDistance, mmSource, "m", 2)).toBe("2,00 m");
    expect(formatDistance(worldDistance, mmSource, "cm", 2)).toBe("200,00 cm");
    expect(formatDistance(worldDistance, mmSource, "mm", 0)).toBe("2.000 mm");
  });

  test("alan dönüşümü lineer değil scale² kullanır ve default m²'dir", () => {
    const worldArea = 2_000_000;

    expect(convertArea(worldArea, mmSource, "m2")).toBe(2);
    expect(convertArea(worldArea, mmSource, "cm2")).toBe(20_000);
    expect(convertArea(worldArea, mmSource, "mm2")).toBe(2_000_000);

    expect(formatArea(worldArea, mmSource, "m2", 2)).toBe("2,00 m²");
    expect(formatArea(worldArea, mmSource, "cm2", 2)).toBe("20.000,00 cm²");
    expect(CAD_DEFAULT_MEASUREMENT_UNIT_SETTINGS.areaUnit).toBe("m2");
  });

  test("cm çalışma birimi alan sonucunun default m² sözleşmesini değiştirmez", () => {
    const initialDoc: CadReviewDocument = {
      schemaVersion: 1,
      fileId: "12345678-1234-4234-8234-1234567890ab",
      sourceVersionKey: "units.dxf",
      sourceSha256: "a".repeat(64),
      revision: 0,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store = new CadReviewStore(initialDoc);
    store.setMeasurementUnitSettings({ unit: "cm" });

    const settings = getCurrentCadMeasurementUnitSettings();
    expect(settings.unit).toBe("cm");
    expect(settings.areaUnit).toBe("m2");
    expect(formatArea(2_000_000, mmSource, settings.areaUnit, settings.areaPrecision)).toBe("2,00 m²");
  });

  test("unitless kalibrasyon distance ve area için aynı fiziksel ölçeği kullanır", () => {
    // Çizimde 100 world unit = gerçekte 50 cm => 5 mm/worldUnit.
    const calibration = calculateCalibrationFromWorldDistance(100, 50, "cm");
    expect(calibration.mmPerWorldUnit).toBe(5);

    const calibratedSource: CadSourceUnitContext = {
      sourceUnit: "unitless",
      mmPerWorldUnit: calibration.mmPerWorldUnit ?? null,
      source: "calibration",
    };

    // 400 world unit = 2 m.
    expect(formatDistance(400, calibratedSource, "m", 2)).toBe("2,00 m");

    // 400 x 600 world unit => 2000 mm x 3000 mm => 6 m².
    expect(formatArea(400 * 600, calibratedSource, "m2", 2)).toBe("6,00 m²");
  });

  test("unknown unit sahte m etiketi üretmez", () => {
    const unknown: CadSourceUnitContext = {
      sourceUnit: "unitless",
      mmPerWorldUnit: null,
      source: "unknown",
    };

    expect(formatDistance(25, unknown, "m", 2)).toBe("25,00 çizim birimi");
    expect(formatArea(100, unknown, "m2", 2)).toBe("100,00 çizim birimi²");
  });

  test("measurement color Distance/Area/Chain review item sözleşmesine yayılır", () => {
    const initialDoc: CadReviewDocument = {
      schemaVersion: 1,
      fileId: "12345678-1234-4234-8234-1234567890ab",
      sourceVersionKey: "color.dxf",
      sourceSha256: "b".repeat(64),
      revision: 0,
      items: [
        {
          id: "12345678-1234-4234-8234-1234567890ac",
          type: "chain_distance",
          points: [{ x: 0, y: 0 }, { x: 1000, y: 0 }],
          segmentDistances: [1000],
          totalDistance: 1000,
          author: "Admin",
          comment: "",
          status: "open",
          style: { color: "#007aff", strokeWidth: 2, opacity: 1 },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const store = new CadReviewStore(initialDoc);
    store.setMeasurementUnitSettings({ color: "#ef4444" });

    const chain = store.getItems()[0];
    expect(chain?.style.color).toBe("#ef4444");
    expect(getCurrentCadMeasurementUnitSettings().color).toBe("#ef4444");
  });
});
