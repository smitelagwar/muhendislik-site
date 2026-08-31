import { expect, test } from "@playwright/test";

import type { CadReviewDocument } from "../../src/lib/dokumantasyon/cad-review/schema";
import { cadReviewDocumentSchema } from "../../src/lib/dokumantasyon/cad-review/schema";
import { exportReviewToJson } from "../../src/lib/dokumantasyon/cad-review/export-json";
import { CadMarkupFacade } from "../../src/lib/dokumantasyon/cad-review/markup-facade";
import { CadReviewStore } from "../../src/lib/dokumantasyon/cad-review/store";

function doc(): CadReviewDocument {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    fileId: "11111111-1111-4111-8111-111111111111",
    sourceVersionKey: "stage3.dxf",
    sourceSha256: "a".repeat(64),
    revision: 0,
    items: [],
    createdAt: now,
    updatedAt: now,
  };
}

test.describe("CAD Stage 3 — review tool data/undo contract", () => {
  test("shape fillOpacity gerçek schema state'idir ve JSON export'ta korunur", () => {
    const store = new CadReviewStore(doc());
    const facade = new CadMarkupFacade(store);

    const shape = facade.addShape({
      shapeKind: "rect",
      p1: { x: 0, y: 0 },
      p2: { x: 100, y: 60 },
      style: {
        color: "#ef4444",
        strokeWidth: 5,
        lineDash: "dashed",
        fillColor: "#3b82f6",
        fillOpacity: 0.35,
        opacity: 0.8,
      },
    });

    const parsed = cadReviewDocumentSchema.parse(store.getDocument());
    const parsedShape = parsed.items.find((item) => item.id === shape.id);
    expect(parsedShape?.style.fillOpacity).toBe(0.35);
    expect(parsedShape?.style.opacity).toBe(0.8);

    const json = exportReviewToJson(store.getDocument());
    expect(json).toContain('"fillOpacity": 0.35');
    expect(json).toContain('"opacity": 0.8');
    expect(json).toContain('"lineDash": "dashed"');
  });

  test("seçili review item style değişikliği tek Undo adımıyla geri alınır", () => {
    const store = new CadReviewStore(doc());
    const facade = new CadMarkupFacade(store);
    const stroke = facade.addStroke({
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
      style: { color: "#ef4444", strokeWidth: 2, lineDash: "continuous" },
    });

    store.updateItemsStyle([stroke.id], {
      color: "#12ab34",
      strokeWidth: 5,
      lineDash: "dashed",
      opacity: 0.75,
    });

    const changed = store.getItems().find((item) => item.id === stroke.id);
    expect(changed?.style.color).toBe("#12ab34");
    expect(changed?.style.strokeWidth).toBe(5);
    expect(changed?.style.lineDash).toBe("dashed");
    expect(changed?.style.opacity).toBe(0.75);

    expect(store.undo()).toBe(true);
    const reverted = store.getItems().find((item) => item.id === stroke.id);
    expect(reverted?.style.color).toBe("#ef4444");
    expect(reverted?.style.strokeWidth).toBe(2);
    expect(reverted?.style.lineDash).toBe("continuous");
  });

  test("silgi yalnız markup siler; measurement aynı noktada olsa bile korunur", () => {
    const initial = doc();
    const now = new Date().toISOString();
    initial.items.push({
      id: "22222222-2222-4222-8222-222222222222",
      type: "distance",
      start: { x: 0, y: 0 },
      end: { x: 100, y: 0 },
      measuredLength: 100,
      author: "Admin",
      comment: "",
      status: "open",
      style: { color: "#3b82f6", strokeWidth: 2, opacity: 1 },
      createdAt: now,
      updatedAt: now,
    });

    const store = new CadReviewStore(initial);
    const facade = new CadMarkupFacade(store);
    const stroke = facade.addStroke({
      points: [{ x: 0, y: 0 }, { x: 100, y: 0 }],
    });

    const erased = facade.eraseItemAtPoint(
      { x: 50, y: 0 },
      (point) => ({ x: point.x, y: point.y }),
      8
    );
    expect(erased).toBe(true);
    expect(store.getItems().some((item) => item.id === stroke.id)).toBe(false);
    expect(store.getItems().some((item) => item.type === "distance")).toBe(true);

    expect(store.undo()).toBe(true);
    expect(store.getItems().some((item) => item.id === stroke.id)).toBe(true);
  });

  test("Tüm işaretlemeleri temizle measurement'ı korur ve tek Undo ile geri getirir", () => {
    const initial = doc();
    const now = new Date().toISOString();
    initial.items.push({
      id: "33333333-3333-4333-8333-333333333333",
      type: "area",
      points: [{ x: 0, y: 0 }, { x: 20, y: 0 }, { x: 20, y: 20 }],
      measuredArea: 200,
      measuredPerimeter: 68.284,
      author: "Admin",
      comment: "",
      status: "open",
      style: { color: "#3b82f6", strokeWidth: 2, opacity: 1 },
      createdAt: now,
      updatedAt: now,
    });

    const store = new CadReviewStore(initial);
    const facade = new CadMarkupFacade(store);
    facade.addStroke({ points: [{ x: 0, y: 0 }, { x: 20, y: 20 }] });
    facade.addText({ position: { x: 10, y: 10 }, text: "Kontrol" });
    facade.addCommentPin({ position: { x: 15, y: 15 }, comment: "Not" });

    expect(store.clearMarkupItems()).toBe(3);
    expect(store.getItems()).toHaveLength(1);
    expect(store.getItems()[0]?.type).toBe("area");

    expect(store.undo()).toBe(true);
    expect(store.getItems()).toHaveLength(4);
    expect(store.getItems().filter((item) => item.type !== "area")).toHaveLength(3);
  });
});
