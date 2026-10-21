import { ShxFont, ShxFontType } from "@mlightcad/shx-parser";
import type { ShxFontData } from "@mlightcad/shx-parser";
import type { CadCanonicalDocument } from "../../src/lib/cad-v2/canonical/types";
import { compileCanonicalToScene } from "../../src/lib/cad-v2/compile/scene-compiler";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";

const syntheticFont = new ShxFont({
  header: { fontType: ShxFontType.SHAPES, fileHeader: "synthetic", fileVersion: "1.0" },
  content: {
    data: { 7: new Uint8Array([0x24, 0]) },
    info: "synthetic vertical stroke", orientation: "horizontal", baseUp: 8, baseDown: 2,
    height: 10, width: 10, isExtended: false,
  },
} satisfies ShxFontData);
const originalResolveFontStyle = FontLayoutEngine.resolveFontStyle.bind(FontLayoutEngine);
FontLayoutEngine.resolveFontStyle = (params) => params.fontFileName === "ltypeshapes.shx"
  ? {
      requestedStyle: params.styleName || "", requestedFont: "ltypeshapes.shx", fontType: "shx",
      resolvedFontName: "synthetic.shx", fontHash: "synthetic-r07-affine-glyph", status: "exact",
      isSubstitute: false, shxFont: syntheticFont,
    }
  : originalResolveFontStyle(params);

try {
  const sourceEntity: CadCanonicalDocument["modelSpaceEntities"][number] = {
    type: "ARC", handle: "R07-AFFINE-GLYPH-ARC", layer: "GLYPH", linetype: "R07_SHAPE",
    center: [0, 0], radius: 100, startAngleRad: 0.23, endAngleRad: 5.37,
    isClockwise: false, order: BigInt(1),
  };
  const innerInsert: CadCanonicalDocument["modelSpaceEntities"][number] = {
    type: "INSERT", handle: "R07-AFFINE-GLYPH-INNER", layer: "GLYPH", blockName: "GLYPH_SOURCE",
    insertionPoint: [18, -12], scale: [0.75, 1.6, 1], rotationRad: 0.37, order: BigInt(2),
  };
  const outerInsert: CadCanonicalDocument["modelSpaceEntities"][number] = {
    type: "INSERT", handle: "R07-AFFINE-GLYPH-OUTER", layer: "GLYPH", blockName: "GLYPH_NESTED",
    insertionPoint: [150, 150], scale: [-1.4, 0.8, 1], rotationRad: -0.29, order: BigInt(3),
  };
  const document: CadCanonicalDocument = {
    sourceVersionKey: "r07-affine-curved-shx-raster-v1",
    sourceSha256: "r07-affine-curved-shx-raster-v1",
    acadVersion: "AC1032", codepage: "UTF-8", units: 4, measurement: 1,
    layers: {
      GLYPH: { id: "GLYPH", name: "GLYPH", visible: true, frozen: false, locked: false,
        color: { method: "rgb", rgb: [255, 0, 0] }, lineweightMm: 0 },
    },
    linetypes: {
      R07_SHAPE: {
        id: "R07_SHAPE", name: "R07_SHAPE", pattern: [24, -16], totalLength: 40,
        complexElements: [{ patternIndex: 0, elementTypeFlag: 4, shapeNumber: 7, styleObjectId: "A1",
          scale: 1.6, rotation: 0.23, offsetX: 1.25, offsetY: -0.75 }],
      },
    },
    textStyles: {
      R07_SHAPE_STYLE: { id: "R07_SHAPE_STYLE", name: "R07_SHAPE_STYLE", objectHandle: "A1",
        fontFileName: "ltypeshapes.shx", bigFontFileName: "shapes-bigfont.shx", isShapeFile: true,
        height: 10, widthFactor: 1, obliqueAngleDeg: 0, isVertical: false },
    },
    blocks: {
      GLYPH_SOURCE: { name: "GLYPH_SOURCE", basePoint: [0, 0], entities: [sourceEntity] },
      GLYPH_NESTED: { name: "GLYPH_NESTED", basePoint: [0, 0], entities: [innerInsert] },
    },
    layouts: {
      Model: { id: "Model", name: "Model", isModelSpace: true, bbox: [-250, -250, 250, 250] },
      SHEET: { id: "SHEET", name: "R07 affine curved SHX", isModelSpace: false,
        bbox: [0, 0, 300, 300], viewportIds: ["R07_VP"] },
    },
    viewports: {
      R07_VP: { id: "R07_VP", layoutId: "SHEET", center: [150, 150], width: 300, height: 300,
        viewCenter: [150, 150], viewHeight: 260, frozenLayers: [] },
    },
    paperSpaceEntities: {}, diagnostics: [], modelSpaceEntities: [outerInsert],
  };

  const compiled = [
    compileCanonicalToScene(document, { sceneId: "scene_r07_affine_glyph_single" }),
    compileCanonicalToScene(document, { sceneId: "scene_r07_affine_glyph_split", maxPrimitivesPerChunk: 1 }),
  ];

  const scenes = compiled.map((scene) => {
    if (scene.manifest.qualityStatus !== "exact") {
      throw new Error(`${scene.manifest.sceneId} did not compile as exact: ${scene.manifest.diagnosticsSummary.diagnosticCodes.join(",")}`);
    }
    const chunks = scene.manifest.chunks.map((chunkRef) => {
      const bytes = scene.chunks.get(chunkRef.chunkId);
      if (!bytes) throw new Error(`Compiled chunk ${chunkRef.chunkId} bytes are missing`);
      return { chunkId: chunkRef.chunkId, chunkBase64: Buffer.from(bytes).toString("base64") };
    });
    return {
      sceneId: scene.manifest.sceneId,
      manifest: {
        ...scene.manifest,
        createdAt: "2026-09-27T00:00:00.000Z",
        layouts: scene.manifest.layouts.map((layout) => layout.layoutId === "Model"
          ? { ...layout, bbox: [-250, -250, 250, 250] }
          : layout),
      },
      chunks,
    };
  });
  process.stdout.write(JSON.stringify({ scenes }));
} finally {
  FontLayoutEngine.resolveFontStyle = originalResolveFontStyle;
}
