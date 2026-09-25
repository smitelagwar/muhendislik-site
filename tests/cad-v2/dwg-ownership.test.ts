// ============================================================================
// DWG/DXF MOTOR V2 — P04 OWNERSHIP & SYNTHETIC CONTRACT TEST
// ============================================================================
// Sözleşme: P04 — Owner/space partition, DXF trueColor rgb sözleşmesi,
// edge tipleri, vertical ellipse, zero angle ve sentetik doğrulamalar
// ============================================================================

import * as assert from "node:assert/strict";
import type {
  CadCanonicalDocument,
  CadEllipseEntity,
  CadHatchEntity,
  CadHatchLoop,
} from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";

function testSpaceOwnershipPartition() {
  const doc: CadCanonicalDocument = {
    sourceVersionKey: "ownership-test",
    sourceSha256: "0000000000000000000000000000000000000000000000000000000000000000",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 4,
    measurement: 1,
    layers: {
      "0": {
        id: "0",
        name: "0",
        visible: true,
        frozen: false,
        locked: false,
        color: { method: "aci", aci: 7 },
        lineweightMm: 0,
        linetypeName: "Continuous",
      },
    },
    linetypes: {},
    textStyles: {},
    blocks: {
      MY_BLOCK: {
        name: "MY_BLOCK",
        basePoint: [10, 20],
        entities: [
          {
            handle: "CHILD_1",
            type: "LINE",
            layer: "0",
            visible: true,
            order: BigInt(100),
            start: [0, 0],
            end: [50, 50],
          },
        ],
      },
    },
    layouts: {
      Model: {
        id: "Model",
        name: "Model",
        isModelSpace: true,
        bbox: [0, 0, 100, 100],
      },
      Layout1: {
        id: "Layout1",
        name: "Layout1",
        isModelSpace: false,
        bbox: [0, 0, 297, 210],
      },
    },
    viewports: {},
    modelSpaceEntities: [
      {
        handle: "MODEL_LINE",
        type: "LINE",
        layer: "0",
        visible: true,
        order: BigInt(1),
        start: [0, 0],
        end: [100, 100],
      },
      {
        handle: "MODEL_INSERT",
        type: "INSERT",
        layer: "0",
        visible: true,
        order: BigInt(2),
        blockName: "MY_BLOCK",
        insertionPoint: [200, 200],
        scale: [1, 1, 1],
        rotationRad: 0,
      },
    ],
    diagnostics: [],
  };

  // 1. Model space varlıkları blok varlıklarıyla karışmamalıdır
  assert.equal(
    doc.modelSpaceEntities.length,
    2,
    "Model alanında tam olarak 2 varlık olmalıdır."
  );
  assert.equal(
    doc.blocks["MY_BLOCK"].entities.length,
    1,
    "Blok tanımında tam olarak 1 varlık olmalıdır."
  );
  assert.equal(
    doc.modelSpaceEntities.some((e) => e.handle === "CHILD_1"),
    false,
    "Blok çocuğu modelSpaceEntities koleksiyonuna sızmamalıdır!"
  );

  console.log("  ✓ Space ownership partition doğrulaması başarılı.");
}

function testTrueColorAndEdgeTypesContract() {
  const lineEdge = {
    type: "LINE" as const,
    start: [0, 0] as [number, number],
    end: [10, 0] as [number, number],
  };
  const arcEdge = {
    type: "ARC" as const,
    center: [10, 10] as [number, number],
    radius: 10,
    startAngleRad: 0,
    endAngleRad: Math.PI / 2,
    ccw: true,
  };
  const ellipseEdge = {
    type: "ELLIPSE" as const,
    center: [10, 20] as [number, number],
    majorAxisVector: [0, 5] as [number, number],
    axisRatio: 0.5,
    startParam: 0,
    endParam: Math.PI,
    ccw: true,
  };
  const splineEdge = {
    type: "SPLINE" as const,
    degree: 3,
    controlPoints: [
      [0, 20],
      [5, 25],
      [10, 25],
      [15, 20],
    ] as [number, number][],
    knots: [0, 0, 0, 0, 1, 1, 1, 1],
  };

  const hatchLoop: CadHatchLoop = {
    isPolyline: false,
    edges: [lineEdge, arcEdge, ellipseEdge, splineEdge],
    boundaryPathTypeFlag: 24,
    isClosed: true,
  };

  const hatchEntity: CadHatchEntity = {
    handle: "HATCH_MULTI_EDGE",
    type: "HATCH",
    layer: "0",
    order: BigInt(5),
    visible: true,
    patternName: "ANSI31",
    isSolid: false,
    solidFill: false,
    patternScale: 1.5,
    patternAngleDeg: 45,
    hatchStyle: 0,
    patternType: 1,
    color: {
      method: "rgb",
      rgb: [255, 128, 0], // TrueColor RGB
    },
    loops: [hatchLoop],
  };

  assert.equal(hatchEntity.color?.method, "rgb");
  assert.deepEqual(hatchEntity.color?.rgb, [255, 128, 0]);
  assert.equal(hatchLoop.edges?.length, 4);
  assert.equal(hatchLoop.edges?.[0].type, "LINE");
  assert.equal(hatchLoop.edges?.[1].type, "ARC");
  assert.equal(hatchLoop.edges?.[2].type, "ELLIPSE");
  assert.equal(hatchLoop.edges?.[3].type, "SPLINE");

  console.log("  ✓ TrueColor RGB ve 4 edge tipi (LINE, ARC, ELLIPSE, SPLINE) sözleşmesi başarılı.");
}

function testVerticalEllipseAndZeroAngle() {
  const vertEllipse: CadEllipseEntity = {
    handle: "VERT_ELLIPSE",
    type: "ELLIPSE",
    layer: "0",
    order: BigInt(6),
    visible: true,
    center: [50, 50],
    majorAxisVector: [0, 20], // Dikey majör eksen (x=0, y=20)
    majorAxisEndPoint: [0, 20],
    axisRatio: 0.5,
    startParam: 0,
    endParam: Math.PI * 2,
  };

  assert.equal(vertEllipse.majorAxisVector[0], 0);
  assert.equal(vertEllipse.majorAxisVector[1], 20);
  assert.equal(vertEllipse.startParam, 0);
  assert.equal(vertEllipse.endParam, Math.PI * 2);

  const doc: CadCanonicalDocument = {
    sourceVersionKey: "vert-ellipse-test",
    sourceSha256: "0000000000000000000000000000000000000000000000000000000000000000",
    acadVersion: "AC1032",
    codepage: "ANSI_1254",
    units: 4,
    measurement: 1,
    layers: {},
    linetypes: {},
    textStyles: {},
    blocks: {},
    layouts: {},
    viewports: {},
    modelSpaceEntities: [vertEllipse],
    diagnostics: [],
  };

  const compiled = compileCanonicalToScene(doc);
  assert.ok(compiled.manifest.layouts[0]?.bbox != null);
  const bbox = compiled.manifest.layouts[0].bbox;
  // Dikey elips: center=(50,50), major Y=20, minor X=10. BBox X: ~[40, 60], Y: ~[30, 70]
  assert.ok(bbox[0] < 45 && bbox[2] > 55, "X sınırları dikey elips için doğru hesaplanmalıdır.");
  assert.ok(bbox[1] < 35 && bbox[3] > 65, "Y sınırları dikey elips için doğru hesaplanmalıdır.");

  console.log("  ✓ Dikey elips ve açı parametreleri derleme testi başarılı.");
}

async function main() {
  console.log("▶ P04 Ownership & Synthetic Contract Testi Başlatılıyor...");
  testSpaceOwnershipPartition();
  testTrueColorAndEdgeTypesContract();
  testVerticalEllipseAndZeroAngle();
  console.log("✅ P04 Ownership & Synthetic Contract Testi Başarıyla Geçti.");
}

main().catch((err) => {
  console.error("❌ P04 Ownership Test Hatası:", err);
  process.exit(1);
});
