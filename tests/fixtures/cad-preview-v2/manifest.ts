export interface CadPreviewV2EntityOracle {
  handle: string;
  type: "TEXT" | "MTEXT" | "LINE" | "LWPOLYLINE" | "CIRCLE" | "INSERT" | "ATTRIB";
  layer: string;
  text?: string;
  expectedRotationDeg?: number;
  expectedCoords?: { x: number; y: number; z?: number };
}

export interface CadPreviewV2MeasurementOracle {
  type: "distance" | "area";
  points: Array<{ x: number; y: number }>;
  expectedValue: number;
  tolerance: number;
  unitLabel: string;
}

export interface CadPreviewV2LayerOracle {
  name: string;
  expectedVisible: boolean;
  expectedFrozen?: boolean;
  expectedLocked?: boolean;
}

export interface CadPreviewV2FixtureManifest {
  id: string;
  fileName: string;
  sha256: string;
  sizeBytes: number;
  expectedEngine: "upstream" | "current" | "aps";
  description: string;
  entities: CadPreviewV2EntityOracle[];
  measurements?: CadPreviewV2MeasurementOracle[];
  layers?: CadPreviewV2LayerOracle[];
}

export const CAD_PREVIEW_V2_MANIFEST: Record<string, CadPreviewV2FixtureManifest> = {
  "text-rotation-0-90-180-270": {
    id: "text-rotation-0-90-180-270",
    fileName: "text-rotation-0-90-180-270.dxf",
    sha256: "b24e50d43276e18f94efd33b0e194a3a660f16cf972f32f995c5da1b4bdc8c13",
    sizeBytes: 582,
    expectedEngine: "upstream",
    description: "Standard TEXT entities with explicit group 50 angles (0, 90, 180, 270 deg)",
    entities: [
      { handle: "T0", type: "TEXT", layer: "TEXT_LAYER", text: "TEXT_ROT_0", expectedRotationDeg: 0.0, expectedCoords: { x: 0.0, y: 0.0 } },
      { handle: "T90", type: "TEXT", layer: "TEXT_LAYER", text: "TEXT_ROT_90", expectedRotationDeg: 90.0, expectedCoords: { x: 100.0, y: 0.0 } },
      { handle: "T180", type: "TEXT", layer: "TEXT_LAYER", text: "TEXT_ROT_180", expectedRotationDeg: 180.0, expectedCoords: { x: 200.0, y: 0.0 } },
      { handle: "T270", type: "TEXT", layer: "TEXT_LAYER", text: "TEXT_ROT_270", expectedRotationDeg: 270.0, expectedCoords: { x: 300.0, y: 0.0 } },
    ],
  },
  "kz-synthetic-rotation-oracle": {
    id: "kz-synthetic-rotation-oracle",
    fileName: "kz-synthetic-rotation-oracle.dxf",
    sha256: "d5f15fd6a8b854b4de17ba205563ad3bf8de140f91fbba6f93e0fd5da65e6242",
    sizeBytes: 636,
    expectedEngine: "upstream",
    description: "KZ rotation oracle differentiating 90-deg rotated handles from 0-deg default handles",
    entities: [
      { handle: "102C", type: "TEXT", layer: "03_KIRIS", text: "KZ49 25/50", expectedRotationDeg: 90.0, expectedCoords: { x: 20.233, y: 1262.131 } },
      { handle: "102D", type: "TEXT", layer: "03_KIRIS", text: "KZ50 25/50", expectedRotationDeg: 90.0, expectedCoords: { x: 20.233, y: 1546.920 } },
      { handle: "E5C98", type: "TEXT", layer: "Standart", text: "KZ49 25/50", expectedRotationDeg: 0.0, expectedCoords: { x: 100373.845, y: -27980.250 } },
      { handle: "E5CE0", type: "TEXT", layer: "Standart", text: "KZ50 25/50", expectedRotationDeg: 0.0, expectedCoords: { x: 98188.845, y: -28030.250 } },
    ],
  },
  "known-geometry-measurements": {
    id: "known-geometry-measurements",
    fileName: "known-geometry-measurements.dxf",
    sha256: "bf9cf7019c29b03107921452c948d921ae60e5494f1eadfa5f0fe5de33829a59",
    sizeBytes: 501,
    expectedEngine: "upstream",
    description: "Geometries with mathematically exact Euclidean distance and area values",
    entities: [
      { handle: "L_MEASURE_1", type: "LINE", layer: "GEOMETRY" },
      { handle: "P_RECT_1", type: "LWPOLYLINE", layer: "GEOMETRY" },
      { handle: "C_CIRCLE_1", type: "CIRCLE", layer: "GEOMETRY" },
    ],
    measurements: [
      {
        type: "distance",
        points: [{ x: 0, y: 0 }, { x: 3000, y: 4000 }],
        expectedValue: 5000.0,
        tolerance: 1e-4,
        unitLabel: "çizim birimi",
      },
      {
        type: "area",
        points: [{ x: 0, y: 0 }, { x: 3000, y: 0 }, { x: 3000, y: 4000 }, { x: 0, y: 4000 }],
        expectedValue: 12000000.0,
        tolerance: 1e-2,
        unitLabel: "çizim birimi²",
      },
    ],
  },
  "layers-frozen-locked-zero": {
    id: "layers-frozen-locked-zero",
    fileName: "layers-frozen-locked-zero.dxf",
    sha256: "6d501f1bb193aea2a17ffa0440a96a8689d6ef9762a6ee180c5884be29f42549",
    sizeBytes: 737,
    expectedEngine: "upstream",
    description: "Layer states: Layer 0, on, off, frozen, and locked",
    entities: [
      { handle: "L_0", type: "LINE", layer: "0" },
      { handle: "L_ACT", type: "LINE", layer: "ACTIVE_VISIBLE" },
      { handle: "L_OFF", type: "LINE", layer: "SOURCE_OFF" },
      { handle: "L_FRZ", type: "LINE", layer: "FROZEN_LAYER" },
      { handle: "L_LCK", type: "LINE", layer: "LOCKED_LAYER" },
    ],
    layers: [
      { name: "0", expectedVisible: true },
      { name: "ACTIVE_VISIBLE", expectedVisible: true },
      { name: "SOURCE_OFF", expectedVisible: false },
      { name: "FROZEN_LAYER", expectedVisible: false, expectedFrozen: true },
      { name: "LOCKED_LAYER", expectedVisible: true, expectedLocked: true },
    ],
  },
  "text-alignment-extrusion": {
    id: "text-alignment-extrusion",
    fileName: "text-alignment-extrusion.dxf",
    sha256: "2cf307ca10abf9c1c454a780415059d3b471dfaaaac6f5f3e59812014a13f6da",
    sizeBytes: 726,
    expectedEngine: "upstream",
    description: "TEXT entities with alignment (72/73) and extrusion vector (210)",
    entities: [
      { handle: "T_ALIGN_BASE", type: "TEXT", layer: "0", text: "ALIGN_LEFT_BASE" },
      { handle: "T_ALIGN_CENTER", type: "TEXT", layer: "0", text: "ALIGN_CENTER" },
      { handle: "T_ALIGN_RIGHT", type: "TEXT", layer: "0", text: "ALIGN_RIGHT" },
      { handle: "T_ALIGN_MIDDLE", type: "TEXT", layer: "0", text: "ALIGN_MIDDLE" },
      { handle: "T_EXTRUSION", type: "TEXT", layer: "0", text: "TEXT_WITH_EXTRUSION" },
    ],
  },
  "insert-attrib-transforms": {
    id: "insert-attrib-transforms",
    fileName: "insert-attrib-transforms.dxf",
    sha256: "e7d01857b01b347e47deadab863f60f15e9e43692dace02f7f4021279c48b18b",
    sizeBytes: 702,
    expectedEngine: "upstream",
    description: "BLOCK and INSERT with 90-degree rotation and child ATTRIB",
    entities: [
      { handle: "L1", type: "LINE", layer: "0" },
      { handle: "INS_1", type: "INSERT", layer: "0", expectedRotationDeg: 90.0 },
      { handle: "ATT_1", type: "ATTRIB", layer: "0", text: "D101", expectedRotationDeg: 90.0 },
    ],
  },
  "mtext-rotation-vectors": {
    id: "mtext-rotation-vectors",
    fileName: "mtext-rotation-vectors.dxf",
    sha256: "975bedda44655b12a2b17a6ca66a5e0e85e3619717873de97e7558b7c1c25a7e",
    sizeBytes: 568,
    expectedEngine: "upstream",
    description: "MTEXT entities with group 50, group 11/21 direction vectors, and combined",
    entities: [
      { handle: "MT_GRP50", type: "MTEXT", layer: "0", expectedRotationDeg: 90.0 },
      { handle: "MT_DIRVEC", type: "MTEXT", layer: "0", expectedRotationDeg: 90.0 },
      { handle: "MT_COMBINED", type: "MTEXT", layer: "0", expectedRotationDeg: 90.0 },
    ],
  },
  "text-turkish-unicode": {
    id: "text-turkish-unicode",
    fileName: "text-turkish-unicode.dxf",
    sha256: "dae1e8c8a7ab6e9b8e7a8e18bcb77022b5146722edb32be9d5bd12aa21c5cf46",
    sizeBytes: 461,
    expectedEngine: "upstream",
    description: "Turkish unicode characters and font fallback (ç, ğ, ı, ö, ş, ü, İ, Ğ, Ş)",
    entities: [
      { handle: "T_TR_LOWER", type: "TEXT", layer: "0", text: "çğıöşü" },
      { handle: "T_TR_UPPER", type: "TEXT", layer: "0", text: "ÇĞİÖŞÜ" },
      { handle: "T_TR_PHRASE", type: "TEXT", layer: "0", text: "MİMARİ VE STATİK PROJESİ" },
    ],
  },
  "multi-layout-model-paperspace": {
    id: "multi-layout-model-paperspace",
    fileName: "multi-layout-model-paperspace.dxf",
    sha256: "f6de3700a590af395f911578c8aff6cf4d7aa77f38a05a2bb8e035adb23bf2a6",
    sizeBytes: 1419,
    expectedEngine: "upstream",
    description: "Multi-tab layout drawing with Model and Paper Space Layout1 with MVIEW Viewport and Title text",
    entities: [
      { handle: "20", type: "LINE", layer: "0" },
      { handle: "22", type: "TEXT", layer: "0", text: "PAFTA 1 - MIMARI PLAN" },
    ],
  },
};
