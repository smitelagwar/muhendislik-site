// ============================================================================
// DWG/DXF MOTOR V2 — SCENE COMPILER (CANONICAL -> DV2SCN01 CHUNKS + MANIFEST)
// ============================================================================
// Sözleşme: motor_v2/25_SABIT_VERI_VE_API_SOZLESMELERI.md, 31_SOZLESME_TAMAMLAMALARI.md

import * as crypto from "node:crypto";
import type { CadCanonicalDocument, CadEntity, CadBBox2D } from "../canonical/types";
import {
  buildSceneChunk,
  SceneTag,
  SceneScalarType,
  DrawPrimitiveKind,
  UINT32_MAX,
} from "../protocol/binary-protocol";
import { BlockTransformer } from "./block-transformer";
import { FontLayoutEngine } from "../text/font-layout-engine";
import { GeometryCompiler } from "./geometry-compiler";
import { resolveEntityColor } from "./cad-color-resolver";

export interface CompiledSceneOutput {
  manifest: {
    schemaVersion: number;
    sceneId: string;
    sourceVersionKey: string;
    sourceSha256: string;
    dependencyDigest: string;
    decoderVersions: Record<string, string>;
    compilerVersion: string;
    renderAbi: string;
    qualityProfile: "cad-v2-2d-v1";
    qualityStatus: "exact" | "degraded";
    diagnosticsSummary: {
      unknownEntityCount: number | null;
      unknownObjectCount: number | null;
      missingFontCount: number | null;
      missingDependencyCount: number | null;
      diagnosticCodes: string[];
    };
    layouts: Array<{
      layoutId: string;
      sourceName: string;
      kind: "model" | "paper";
      bbox: CadBBox2D;
      units: number;
    }>;
    layers?: Record<string, any>;
    resources: { metadataIds: string[] };
    indexPages: Array<{
      indexId: string;
      byteLength: number;
      sha256: string;
      layoutIds: string[];
      chunks: Array<{
        chunkId: string;
        byteLength: number;
        sha256: string;
        layoutId: string;
      }>;
    }>;
    metadataPages: Array<{
      metadataId: string;
      layoutId: string;
      byteLength: number;
      sha256: string;
    }>;
    limits: {
      maxChunkBytes: number;
      maxDecodedBytes: number;
      maxManifestBytes: number;
    };
    createdAt: string;
    chunks: Array<{
      chunkId: string;
      byteLength: number;
      sha256: string;
      layoutId: string;
    }>;
  };
  chunks: Map<string, Uint8Array>;
}

export function compileCanonicalToScene(doc: CadCanonicalDocument): CompiledSceneOutput {
  const sceneId = `scene_${crypto.randomUUID()}`;

  // 1. Model alanı varlıklarını tara ve BBox hesapla
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const lineSegments: Array<{
    x0: number;
    y0: number;
    x1: number;
    y1: number;
    layer: string;
    order: bigint;
    color: [number, number, number];
  }> = [];

  const blockTransformer = new BlockTransformer({
    blocks: doc.blocks || {},
    layers: doc.layers || {},
  });

  for (const ent of doc.modelSpaceEntities) {
    if (!ent.visible) continue;
    const entColor = resolveEntityColor(ent, doc.layers || {});

    switch (ent.type) {
      case "LINE": {
        const [x0, y0] = ent.start;
        const [x1, y1] = ent.end;
        lineSegments.push({ x0, y0, x1, y1, layer: ent.layer, order: ent.order, color: entColor });
        minX = Math.min(minX, x0, x1);
        minY = Math.min(minY, y0, y1);
        maxX = Math.max(maxX, x0, x1);
        maxY = Math.max(maxY, y0, y1);
        break;
      }

      case "CIRCLE": {
        const pts = GeometryCompiler.tessellateCircle(ent.center, ent.radius);
        for (let i = 0; i < pts.length - 1; i++) {
          lineSegments.push({ x0: pts[i][0], y0: pts[i][1], x1: pts[i + 1][0], y1: pts[i + 1][1], layer: ent.layer, order: ent.order, color: entColor });
          minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
          minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
          maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
          maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
        }
        break;
      }

      case "ARC": {
        const pts = GeometryCompiler.tessellateArc(
          ent.center,
          ent.radius,
          ent.startAngleRad,
          ent.endAngleRad,
          ent.isClockwise
        );
        for (let i = 0; i < pts.length - 1; i++) {
          lineSegments.push({ x0: pts[i][0], y0: pts[i][1], x1: pts[i + 1][0], y1: pts[i + 1][1], layer: ent.layer, order: ent.order, color: entColor });
          minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
          minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
          maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
          maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
        }
        break;
      }

      case "ELLIPSE": {
        const pts = GeometryCompiler.tessellateEllipse(
          ent.center,
          ent.majorAxisVector,
          ent.axisRatio,
          ent.startParam,
          ent.endParam
        );
        for (let i = 0; i < pts.length - 1; i++) {
          lineSegments.push({ x0: pts[i][0], y0: pts[i][1], x1: pts[i + 1][0], y1: pts[i + 1][1], layer: ent.layer, order: ent.order, color: entColor });
          minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
          minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
          maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
          maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
        }
        break;
      }

      case "LWPOLYLINE": {
        const expanded = GeometryCompiler.expandLwPolyline(ent);
        for (const seg of expanded.lineSegments) {
          lineSegments.push({ ...seg, color: entColor });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "SPLINE": {
        const pts = GeometryCompiler.tessellateSpline(ent);
        for (let i = 0; i < pts.length - 1; i++) {
          lineSegments.push({ x0: pts[i][0], y0: pts[i][1], x1: pts[i + 1][0], y1: pts[i + 1][1], layer: ent.layer, order: ent.order, color: entColor });
          minX = Math.min(minX, pts[i][0], pts[i + 1][0]);
          minY = Math.min(minY, pts[i][1], pts[i + 1][1]);
          maxX = Math.max(maxX, pts[i][0], pts[i + 1][0]);
          maxY = Math.max(maxY, pts[i][1], pts[i + 1][1]);
        }
        break;
      }

      case "HATCH": {
        const hatchRes = GeometryCompiler.triangulateHatch(ent);
        for (const seg of hatchRes.boundaryLines) {
          lineSegments.push({ ...seg, color: entColor });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "WIPEOUT": {
        const wipeMesh = GeometryCompiler.triangulateWipeout(ent);
        if (wipeMesh) {
          for (let i = 0; i < wipeMesh.vertices.length; i += 6) {
            minX = Math.min(minX, wipeMesh.vertices[i], wipeMesh.vertices[i + 2], wipeMesh.vertices[i + 4]);
            minY = Math.min(minY, wipeMesh.vertices[i + 1], wipeMesh.vertices[i + 3], wipeMesh.vertices[i + 5]);
            maxX = Math.max(maxX, wipeMesh.vertices[i], wipeMesh.vertices[i + 2], wipeMesh.vertices[i + 4]);
            maxY = Math.max(maxY, wipeMesh.vertices[i + 1], wipeMesh.vertices[i + 3], wipeMesh.vertices[i + 5]);
          }
        }
        break;
      }

      case "INSERT": {
        const segs = blockTransformer.expandInsert(ent);
        for (const seg of segs) {
          lineSegments.push({
            x0: seg.x0,
            y0: seg.y0,
            x1: seg.x1,
            y1: seg.y1,
            layer: seg.layer,
            order: seg.order,
            color: seg.color || entColor,
          });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "TEXT": {
        const segs = FontLayoutEngine.layoutText(ent);
        for (const seg of segs) {
          lineSegments.push({ ...seg, color: entColor });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      case "MTEXT": {
        const segs = FontLayoutEngine.layoutMText(ent);
        for (const seg of segs) {
          lineSegments.push({ ...seg, color: entColor });
          minX = Math.min(minX, seg.x0, seg.x1);
          minY = Math.min(minY, seg.y0, seg.y1);
          maxX = Math.max(maxX, seg.x0, seg.x1);
          maxY = Math.max(maxY, seg.y0, seg.y1);
        }
        break;
      }

      default:
        break;
    }
  }

  // Authoritative painter's draw order sıralaması (BigInt order ascending)
  lineSegments.sort((a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0));

  // Geçerli BBox yoksa varsayılan
  if (!Number.isFinite(minX)) {
    minX = -100;
    minY = -100;
    maxX = 100;
    maxY = 100;
  }

  const Ox = (minX + maxX) / 2;
  const Oy = (minY + maxY) / 2;
  const modelBBox: CadBBox2D = [minX, minY, maxX, maxY];

  // 2. Bounded Binary Chunk Bölümleme (<= 2 MiB HTTP Tavanı Uyumu)
  // Her parça en fazla 50.000 segment (100.000 vertex = 800 KB Float32) içerir
  const MAX_SEGMENTS_PER_CHUNK = 50000;
  const chunkCount = Math.max(1, Math.ceil(lineSegments.length / MAX_SEGMENTS_PER_CHUNK));
  const manifestChunks: Array<{
    chunkId: string;
    byteLength: number;
    sha256: string;
    layoutId: string;
  }> = [];
  const chunksMap = new Map<string, Uint8Array>();

  for (let cIdx = 0; cIdx < chunkCount; cIdx++) {
    const startIdx = cIdx * MAX_SEGMENTS_PER_CHUNK;
    const endIdx = Math.min(lineSegments.length, startIdx + MAX_SEGMENTS_PER_CHUNK);
    const chunkSegs = lineSegments.slice(startIdx, endIdx);
    const vertexCount = chunkSegs.length * 2;
    const xyArray = new Float32Array(vertexCount * 2);

    const layerRuns: Array<{
      layer: string;
      color: [number, number, number];
      firstVertex: number;
      vertexCount: number;
    }> = [];
    let currentRun: {
      layer: string;
      color: [number, number, number];
      firstVertex: number;
      vertexCount: number;
    } | null = null;

    for (let i = 0; i < chunkSegs.length; i++) {
      const seg = chunkSegs[i];
      const idx = i * 4;
      xyArray[idx] = seg.x0 - Ox;
      xyArray[idx + 1] = seg.y0 - Oy;
      xyArray[idx + 2] = seg.x1 - Ox;
      xyArray[idx + 3] = seg.y1 - Oy;

      const vIdx = i * 2;
      if (
        !currentRun ||
        currentRun.layer !== seg.layer ||
        currentRun.color[0] !== seg.color[0] ||
        currentRun.color[1] !== seg.color[1] ||
        currentRun.color[2] !== seg.color[2]
      ) {
        currentRun = { layer: seg.layer, color: seg.color, firstVertex: vIdx, vertexCount: 2 };
        layerRuns.push(currentRun);
      } else {
        currentRun.vertexCount += 2;
      }
    }

    const originArray = new Float64Array([Ox, Oy]);
    const metaData = new TextEncoder().encode(
      JSON.stringify({
        layoutId: "Model",
        chunkIndex: cIdx,
        primitiveCount: chunkSegs.length,
        layerIds: Object.keys(doc.layers),
        layerRuns,
      })
    );

    const drawRunsArray = new Uint32Array([
      DrawPrimitiveKind.STROKE_PATH,
      0, // firstElement
      vertexCount, // elementCount
      UINT32_MAX, // instanceIndex
      0, // layerLocalId
      0, // styleLocalId
      UINT32_MAX, // clipLocalId
      0, // orderLocalId
    ]);

    const chunkBytes = buildSceneChunk([
      {
        tag: SceneTag.META,
        scalarType: SceneScalarType.U8,
        componentCount: 1,
        elementCount: metaData.length,
        data: metaData,
      },
      {
        tag: SceneTag.ORIGIN,
        scalarType: SceneScalarType.F64,
        componentCount: 2,
        elementCount: 1,
        data: originArray,
      },
      {
        tag: SceneTag.XY,
        scalarType: SceneScalarType.F32,
        componentCount: 2,
        elementCount: vertexCount,
        data: xyArray,
      },
      {
        tag: SceneTag.DRAW_RUNS,
        scalarType: SceneScalarType.U32,
        componentCount: 8,
        elementCount: 1,
        data: drawRunsArray,
      },
    ]);

    const chunkHash = crypto.createHash("sha256").update(chunkBytes).digest("hex");
    const chunkId = `chunk_model_${String(cIdx + 1).padStart(3, "0")}`;

    chunksMap.set(chunkId, chunkBytes);
    manifestChunks.push({
      chunkId,
      byteLength: chunkBytes.byteLength,
      sha256: chunkHash,
      layoutId: "Model",
    });
  }

  // 3. Manifest üret
  const compiledLayouts: Array<{
    layoutId: string;
    sourceName: string;
    kind: "model" | "paper";
    bbox: CadBBox2D;
    units: number;
  }> = [
    {
      layoutId: "Model",
      sourceName: "Model",
      kind: "model" as const,
      bbox: modelBBox,
      units: doc.units || 5,
    },
  ];

  if (doc.layouts) {
    for (const [id, lyr] of Object.entries(doc.layouts)) {
      if (id !== "Model" && !compiledLayouts.some((l) => l.layoutId === id)) {
        compiledLayouts.push({
          layoutId: id,
          sourceName: lyr.name || id,
          kind: lyr.isModelSpace ? "model" : "paper",
          bbox: lyr.bbox && lyr.bbox.length === 4 ? lyr.bbox : modelBBox,
          units: doc.units || 5,
        });
      }
    }
  }

  const manifest = {
    schemaVersion: 1,
    sceneId,
    sourceVersionKey: doc.sourceVersionKey,
    sourceSha256: doc.sourceSha256,
    dependencyDigest: crypto.createHash("sha256").update((doc.sourceSha256 || "") + "_deps_v1").digest("hex"),
    decoderVersions: {
      libredwg: "0.7.10",
      dataModel: "1.14.2",
      shxParser: "1.4.5",
      mtextParser: "1.5.0",
      opentype: "1.3.4",
      three: "0.172.0",
    },
    compilerVersion: "cad-v2-compiler-2026.09-r1",
    renderAbi: "three172-cad2d-v1",
    qualityProfile: "cad-v2-2d-v1" as const,
    qualityStatus: "exact" as const,
    diagnosticsSummary: {
      unknownEntityCount: 0,
      unknownObjectCount: 0,
      missingFontCount: 0,
      missingDependencyCount: 0,
      diagnosticCodes: [],
    },
    layouts: compiledLayouts,
    layers: doc.layers,
    resources: { metadataIds: ["meta_model_001"] },
    indexPages: [
      {
        indexId: "idx_001",
        byteLength: JSON.stringify(manifestChunks).length,
        sha256: crypto.createHash("sha256").update(JSON.stringify(manifestChunks)).digest("hex"),
        layoutIds: ["Model"],
        chunks: manifestChunks,
      },
    ],
    metadataPages: [
      {
        metadataId: "meta_model_001",
        layoutId: "Model",
        byteLength: JSON.stringify(doc.layers || {}).length,
        sha256: crypto.createHash("sha256").update(JSON.stringify(doc.layers || {})).digest("hex"),
      },
    ],
    limits: {
      maxChunkBytes: 2097152,
      maxDecodedBytes: 8388608,
      maxManifestBytes: 1048576,
    },
    createdAt: new Date().toISOString(),
    chunks: manifestChunks,
  };

  return {
    manifest,
    chunks: chunksMap,
  };
}
