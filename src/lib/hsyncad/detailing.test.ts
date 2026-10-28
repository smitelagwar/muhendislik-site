import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "./model";
import { generateBeamDetail, generateColumnDetail } from "./detailing";
import type { BeamElement, ColumnElement } from "./model";

test("generateBeamDetail produces structural detailing geometry, rebar lines and takeoff", () => {
  const model = createDemoModel();
  const beam = model.elements.find(e => e.type === "beam") as BeamElement;
  assert.ok(beam, "Örnek modelde kiriş bulunmalı");

  const detail = generateBeamDetail(beam);
  assert.equal(detail.type, "beam");
  assert.ok(detail.lines.length > 10, "Kiriş donatı ve beton hatları oluşturulmalı");
  assert.ok(detail.texts.some(t => t.text.includes("Montaj")), "Montaj donatısı yazısı bulunmalı");
  assert.ok(detail.texts.some(t => t.text.includes("Etriye") || t.text.includes("Sarılma")), "Etriye sarılma bölgesi bulunmalı");
  assert.ok(detail.rebarSchedule.length >= 3, "Donatı metraj tablosu doldurulmalı");

  const totalKg = detail.rebarSchedule.reduce((sum, item) => sum + item.totalWeightKg, 0);
  assert.ok(totalKg > 10, "Kiriş donatı ağırlığı pozitif ve gerçekçi olmalı");
});

test("generateColumnDetail produces column cross-section, tie hooks and vertical rebars", () => {
  const model = createDemoModel();
  const col = model.elements.find(e => e.type === "column") as ColumnElement;
  assert.ok(col, "Örnek modelde kolon bulunmalı");

  const detail = generateColumnDetail(col);
  assert.equal(detail.type, "column");
  assert.ok(detail.circles.length >= 8, "En az 8 adet boyuna donatı dairesi çizilmeli");
  assert.ok(detail.lines.some(l => l.layer === "DONATI"), "Etriye ve kanca hatları bulunmalı");
  assert.ok(detail.rebarSchedule.length >= 2, "Kolon metraj tablosu bulunmalı");
});
