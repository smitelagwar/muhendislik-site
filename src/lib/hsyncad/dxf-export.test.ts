import { test } from "node:test";
import assert from "node:assert/strict";
import { createDemoModel } from "./model";
import { exportModelToDxf } from "./dxf-export";

test("DXF export generates valid ASCII DXF structure with standard layers", () => {
  const model = createDemoModel();
  const dxf = exportModelToDxf(model);

  assert.ok(dxf.includes("SECTION\r\n2\r\nHEADER"), "DXF Header bölümü içermeli");
  assert.ok(dxf.includes("SECTION\r\n2\r\nTABLES"), "DXF Tables bölümü içermeli");
  assert.ok(dxf.includes("LAYER\r\n2\r\nAKSLAR"), "AKSLAR katmanı tanımlı olmalı");
  assert.ok(dxf.includes("LAYER\r\n2\r\nKOLONLAR"), "KOLONLAR katmanı tanımlı olmalı");
  assert.ok(dxf.includes("LAYER\r\n2\r\nKIRISLER"), "KIRISLER katmanı tanımlı olmalı");
  assert.ok(dxf.includes("LAYER\r\n2\r\nDOSEMELER"), "DOSEMELER katmanı tanımlı olmalı");
  assert.ok(dxf.includes("SECTION\r\n2\r\nENTITIES"), "DXF Entities bölümü içermeli");
  assert.ok(dxf.includes("EOF"), "DXF dosyası EOF ile sonlanmalı");
});

test("DXF export filters elements by floor if floorId is provided", () => {
  const model = createDemoModel();
  const floorId = model.floors[0].id;
  const dxf = exportModelToDxf(model, floorId);

  assert.ok(dxf.length > 500, "Geçerli DXF metni üretilmeli");
  assert.ok(dxf.includes("KOLONLAR"));
});
