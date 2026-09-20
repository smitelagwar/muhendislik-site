// ============================================================================
// DWG/DXF MOTOR V2 — DWG DECODE ADAPTER (@mlightcad/libredwg-web 0.7.10)
// ============================================================================

import type { CadCanonicalDocument, CadEntity, CadLayer } from "../canonical/types";

let libreDwgInstance: any = null;

async function getLibreDwg() {
  if (!libreDwgInstance) {
    // ESM import of libredwg-web
    // @ts-ignore
    const { LibreDwg } = await import("@mlightcad/libredwg-web");
    libreDwgInstance = await LibreDwg.create();
  }
  return libreDwgInstance;
}

export interface DwgParseOptions {
  sourceVersionKey?: string;
  sourceSha256?: string;
}

export async function parseDwgToCanonical(
  dwgBuffer: Buffer | Uint8Array,
  options: DwgParseOptions = {}
): Promise<CadCanonicalDocument> {
  const dwg = await getLibreDwg();
  // @ts-ignore
  const { Dwg_File_Type } = await import("@mlightcad/libredwg-web");

  let ptr: number | null = null;
  let rawDb: any = null;

  try {
    ptr = dwg.dwg_read_data(dwgBuffer, Dwg_File_Type.DWG);
    if (!ptr) {
      throw new Error("[DwgAdapter] dwg_read_data başarısız oldu (null pointer döndü)");
    }

    const versionInfo = dwg.dwg_get_version_type(ptr);
    if (!versionInfo || versionInfo.type === "invalid") {
      throw new Error(`[DwgAdapter] Geçersiz DWG verisi: ${versionInfo?.description || "Geçersiz dosya"}`);
    }

    rawDb = dwg.convert(ptr);
    if (!rawDb) {
      throw new Error("[DwgAdapter] dwg.convert başarısız oldu (boş veritabanı)");
    }
    rawDb.versionInfo = versionInfo;
  } finally {
    if (ptr) {
      try {
        dwg.dwg_free(ptr);
      } catch (err) {
        console.warn("[DwgAdapter] dwg_free sırasında uyarı:", err);
      }
    }
  }

  // Canonical belgeye dönüştür
  // 1. Katmanları dönüştür
  const layers: Record<string, CadLayer> = {};
  const rawLayerEntries = rawDb.tables?.LAYER?.entries || rawDb.tables?.layers || [];
  if (Array.isArray(rawLayerEntries)) {
    for (const lyr of rawLayerEntries) {
      const name = lyr.name || "0";
      layers[name] = {
        id: name,
        name,
        visible: !lyr.off && !lyr.isOff,
        frozen: !!lyr.frozen || !!lyr.isFrozen,
        locked: !!lyr.locked || !!lyr.isLocked,
        color: {
          method: lyr.colorIndex != null ? "aci" : "byLayer",
          aci: typeof lyr.colorIndex === "number" ? lyr.colorIndex : 7,
          rgb: lyr.color != null ? [
            (lyr.color >> 16) & 255,
            (lyr.color >> 8) & 255,
            lyr.color & 255,
          ] : undefined,
        },
        lineweightMm: lyr.lineweight ? lyr.lineweight / 100 : 0,
        linetypeName: lyr.lineType || lyr.linetype || "Continuous",
      };
    }
  }

  // Yardımcı: Raw entity -> CadEntity dönüştürücü
  function convertRawEntity(ent: any, orderVal: bigint): CadEntity | null {
    const type = (ent.type || "").toUpperCase();
    const base = {
      handle: ent.handle != null ? String(ent.handle) : `H_${orderVal}`,
      layer: ent.layer || "0",
      visible: !ent.off && !ent.isInvisible,
      order: orderVal,
      color: ent.colorIndex != null ? {
        method: ent.colorIndex === 0 ? "byBlock" as const : ent.colorIndex === 256 ? "byLayer" as const : "aci" as const,
        aci: ent.colorIndex,
      } : undefined,
    };

    switch (type) {
      case "LINE": {
        const start = ent.startPoint || ent.start;
        const end = ent.endPoint || ent.end;
        if (start && end) {
          return {
            ...base,
            type: "LINE",
            start: [start.x || 0, start.y || 0],
            end: [end.x || 0, end.y || 0],
          };
        }
        break;
      }

      case "CIRCLE": {
        if (ent.center && typeof ent.radius === "number") {
          return {
            ...base,
            type: "CIRCLE",
            center: [ent.center.x || 0, ent.center.y || 0],
            radius: ent.radius,
          };
        }
        break;
      }

      case "ARC": {
        if (ent.center && typeof ent.radius === "number") {
          return {
            ...base,
            type: "ARC",
            center: [ent.center.x || 0, ent.center.y || 0],
            radius: ent.radius,
            startAngleRad: ent.startAngle || 0,
            endAngleRad: ent.endAngle || Math.PI * 2,
          };
        }
        break;
      }

      case "LWPOLYLINE": {
        if (Array.isArray(ent.vertices)) {
          return {
            ...base,
            type: "LWPOLYLINE",
            vertices: ent.vertices.map((v: any) => ({
              x: v.x || 0,
              y: v.y || 0,
              bulge: v.bulge || 0,
            })),
            isClosed: !!ent.isClosed,
          };
        }
        break;
      }

      case "TEXT": {
        const pos = ent.startPoint || ent.position || { x: 0, y: 0 };
        return {
          ...base,
          type: "TEXT",
          text: ent.text || ent.value || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          height: ent.textHeight || ent.height || 2.5,
          rotationRad: ent.rotation || 0,
          widthFactor: ent.xScale || ent.widthFactor || 1,
          obliqueRad: ent.obliqueAngle || ent.oblique || 0,
          styleName: ent.styleName || ent.style || "STANDARD",
        };
      }

      case "MTEXT": {
        const pos = ent.insertionPoint || ent.position || { x: 0, y: 0 };
        return {
          ...base,
          type: "MTEXT",
          text: ent.text || ent.value || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          height: ent.textHeight || ent.height || 2.5,
          referenceWidth: ent.referenceWidth || ent.width || 0,
          rotationRad: ent.rotation || 0,
          attachmentPoint: ent.attachmentPoint || 1,
          styleName: ent.styleName || ent.style || "STANDARD",
        };
      }

      case "INSERT": {
        const pos = ent.insertionPoint || ent.position || { x: 0, y: 0 };
        return {
          ...base,
          type: "INSERT",
          blockName: ent.name || ent.blockName || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          scale: [
            ent.xScale ?? ent.scale?.x ?? 1,
            ent.yScale ?? ent.scale?.y ?? 1,
            ent.zScale ?? ent.scale?.z ?? 1,
          ],
          rotationRad: ent.rotation || 0,
        };
      }

      case "DIMENSION": {
        const pos = ent.insertionPoint || ent.position || { x: 0, y: 0 };
        if (ent.name && ent.name.startsWith("*D")) {
          return {
            ...base,
            type: "INSERT",
            blockName: ent.name,
            insertionPoint: [pos.x || 0, pos.y || 0],
            scale: [1, 1, 1],
            rotationRad: 0,
          };
        }
        return {
          ...base,
          type: "DIMENSION",
          dimType: ent.dimensionType || 0,
          text: ent.text || "",
          styleName: ent.styleName || "STANDARD",
          defPoint: [ent.definitionPoint?.x || 0, ent.definitionPoint?.y || 0],
          textMidpoint: ent.textPoint ? [ent.textPoint.x || 0, ent.textPoint.y || 0] : undefined,
          anonymousBlockName: ent.name,
        };
      }

      case "ELLIPSE": {
        const center = ent.center || { x: 0, y: 0 };
        const major = ent.majorAxisVector || ent.majorAxis || ent.endpoint || { x: 1, y: 0 };
        return {
          ...base,
          type: "ELLIPSE",
          center: [center.x || 0, center.y || 0],
          majorAxisVector: [major.x || 1, major.y || 0],
          axisRatio: ent.axisRatio ?? ent.ratio ?? 1,
          startParam: ent.startParam ?? ent.startAngle ?? 0,
          endParam: ent.endParam ?? ent.endAngle ?? (Math.PI * 2),
        };
      }

      case "SPLINE": {
        const cp = (ent.controlPoints || []).map((p: any) => [p.x || 0, p.y || 0] as [number, number]);
        return {
          ...base,
          type: "SPLINE",
          degree: ent.degree || 3,
          controlPoints: cp,
          knots: ent.knots || [],
          weights: ent.weights,
          isPeriodic: !!ent.isPeriodic,
          isRational: !!ent.isRational,
        };
      }

      case "HATCH": {
        const loops: any[] = [];
        const rawLoops = ent.loops || ent.boundaryLoops || [];
        for (const rl of rawLoops) {
          if (rl.isPolyline && Array.isArray(rl.vertices)) {
            loops.push({
              isPolyline: true,
              vertices: rl.vertices.map((v: any) => [v.x || 0, v.y || 0] as [number, number]),
            });
          } else if (Array.isArray(rl.edges)) {
            const edges: any[] = [];
            for (const ed of rl.edges) {
              if (ed.type === "LINE" || ed.startPoint) {
                edges.push({
                  type: "LINE",
                  start: [ed.startPoint?.x || ed.start?.x || 0, ed.startPoint?.y || ed.start?.y || 0],
                  end: [ed.endPoint?.x || ed.end?.x || 0, ed.endPoint?.y || ed.end?.y || 0],
                });
              } else if (ed.type === "ARC" || ed.center) {
                edges.push({
                  type: "ARC",
                  center: [ed.center?.x || 0, ed.center?.y || 0],
                  radius: ed.radius || 1,
                  startAngleRad: ed.startAngle || 0,
                  endAngleRad: ed.endAngle || (Math.PI * 2),
                  ccw: ed.ccw !== false,
                });
              }
            }
            loops.push({ isPolyline: false, edges });
          }
        }
        return {
          ...base,
          type: "HATCH",
          patternName: ent.patternName || "SOLID",
          isSolid: ent.isSolid !== false,
          patternScale: ent.patternScale || 1,
          patternAngleDeg: ent.patternAngle || 0,
          loops,
        };
      }

      case "WIPEOUT": {
        const vertices = (ent.vertices || []).map((v: any) => [v.x || 0, v.y || 0] as [number, number]);
        return {
          ...base,
          type: "WIPEOUT",
          vertices,
        };
      }

      default:
        break;
    }
    return null;
  }

  // 2. Model alanı varlıklarını dönüştür
  const modelEntities: CadEntity[] = [];
  let currentOrder = BigInt(1);

  if (Array.isArray(rawDb.entities)) {
    for (const ent of rawDb.entities) {
      const orderVal = currentOrder;
      currentOrder += BigInt(1);
      const converted = convertRawEntity(ent, orderVal);
      if (converted) {
        modelEntities.push(converted);
      }
    }
  }

  // 3. Blok tanımlarını (BLOCK_RECORD) dönüştür
  const blocks: Record<string, any> = {};
  const blockEntries = rawDb.tables?.BLOCK_RECORD?.entries || [];
  if (Array.isArray(blockEntries)) {
    let blockOrder = BigInt(1);
    for (const b of blockEntries) {
      const name = b.name || "";
      if (!name || name.startsWith("*Model_Space") || name.startsWith("*Paper_Space")) {
        continue;
      }
      const bEntities: CadEntity[] = [];
      if (Array.isArray(b.entities)) {
        for (const ent of b.entities) {
          const o = blockOrder;
          blockOrder += BigInt(1);
          const converted = convertRawEntity(ent, o);
          if (converted) {
            bEntities.push(converted);
          }
        }
      }
      blocks[name] = {
        name,
        basePoint: [b.basePoint?.x || 0, b.basePoint?.y || 0],
        entities: bEntities,
      };
    }
  }

  return {
    sourceVersionKey: options.sourceVersionKey || "dwg-v1",
    sourceSha256: options.sourceSha256 || "",
    acadVersion: rawDb.header?.version || "AC1032",
    codepage: rawDb.header?.codepage || "ANSI_1254",
    units: rawDb.header?.insunits || 5, // 5 = meters
    measurement: rawDb.header?.measurement || 1, // 1 = metric
    layers,
    linetypes: {},
    textStyles: {},
    blocks,
    layouts: {
      Model: {
        id: "Model",
        name: "Model",
        isModelSpace: true,
        bbox: [0, 0, 1000, 1000],
      },
    },
    viewports: {},
    modelSpaceEntities: modelEntities,
    diagnostics: [],
  };
}
