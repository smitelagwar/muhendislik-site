// ============================================================================
// DWG/DXF MOTOR V2 — DXF DECODE ADAPTER (@mlightcad/data-model 1.14.2)
// ============================================================================

import type { CadCanonicalDocument, CadEntity, CadLayer } from "../canonical/types";

export interface DxfParseOptions {
  sourceVersionKey?: string;
  sourceSha256?: string;
}

export async function parseDxfToCanonical(
  dxfBuffer: Buffer | Uint8Array,
  options: DxfParseOptions = {}
): Promise<CadCanonicalDocument> {
  const {
    AcDbNativeDxfConverter,
    AcDbDatabase,
    acdbAssignWorkingDatabase,
    acdbHostApplicationServices,
    acdbSetHostApplicationServicesProvider,
  } = await import("@mlightcad/data-model");

  const db = new AcDbDatabase();

  // 1. Host Application Services Provider'ı garantiye al (Webpack tree-shaking koruması)
  if (typeof acdbSetHostApplicationServicesProvider === "function" && typeof acdbHostApplicationServices === "function") {
    acdbSetHostApplicationServicesProvider(acdbHostApplicationServices);
  }

  // 2. Working Database'i hem doğrudan hem de yardımcı fonksiyonla ata
  if (typeof acdbHostApplicationServices === "function") {
    try {
      const services = acdbHostApplicationServices();
      if (services) {
        services.workingDatabase = db;
      }
    } catch (e) {
      console.warn("[DxfAdapter] acdbHostApplicationServices workingDatabase atama uyarısı:", e);
    }
  }

  if (typeof acdbAssignWorkingDatabase === "function") {
    acdbAssignWorkingDatabase(db);
  }

  const converter = new AcDbNativeDxfConverter();
  const u8Data = dxfBuffer instanceof Uint8Array ? dxfBuffer : new Uint8Array(dxfBuffer);
  await converter.read(u8Data as unknown as ArrayBuffer, db);

  // 1. Katmanları çözümle
  const layers: Record<string, CadLayer> = {};
  if (db.tables?.layerTable) {
    try {
      const layerTable = db.tables.layerTable as any;
      const records = layerTable.newIterator ? layerTable.newIterator().toArray() : (layerTable.records || []);
      for (const rec of records) {
        const name = rec.name || "0";
        layers[name] = {
          id: name,
          name,
          visible: !rec.isOff,
          frozen: !!rec.isFrozen,
          locked: !!rec.isLocked,
          color: {
            method: "aci",
            aci: typeof rec.color?.colorIndex === "number" ? rec.color.colorIndex : 7,
          },
          lineweightMm: rec.lineWeight ? rec.lineWeight / 100 : 0,
          linetypeName: rec.linetype || rec.lineType || "Continuous",
        };
      }
    } catch (err) {
      console.warn("[DxfAdapter] Katman tablosu okunurken uyarı:", err);
    }
  }

  // Standart AutoCAD kuralı: "0" katmanı daima var olmalıdır
  if (!layers["0"]) {
    layers["0"] = {
      id: "0",
      name: "0",
      visible: true,
      frozen: false,
      locked: false,
      color: { method: "aci", aci: 7 },
      lineweightMm: 0,
      linetypeName: "Continuous",
    };
  }

  // 2. Model Space varlıklarını çözümle
  const modelEntities: CadEntity[] = [];
  let currentOrder = BigInt(1);

  try {
    const modelSpace = db.tables?.blockTable?.modelSpace;
    if (modelSpace) {
      const rawEntities: any[] = modelSpace.newIterator ? (modelSpace.newIterator().toArray() as any[]) : [];
      for (const item of rawEntities) {
        const ent = typeof item === "string" ? (db.openEntityForRead(item) as any) : item;
        if (!ent) continue;

        const type = (ent.dxfTypeName || "").toUpperCase();
        const orderVal = currentOrder;
        currentOrder += BigInt(1);
        const base = {
          handle: ent.handle != null ? String(ent.handle) : `H_${orderVal}`,
          layer: ent._layer || ent.layer || "0",
          visible: ent._visibility !== false,
          order: currentOrder++,
        };

        switch (type) {
          case "LINE": {
            const start = ent.startPoint || ent.start;
            const end = ent.endPoint || ent.end;
            if (start && end) {
              modelEntities.push({
                ...base,
                type: "LINE",
                start: [start.x || 0, start.y || 0],
                end: [end.x || 0, end.y || 0],
              });
            }
            break;
          }

          case "CIRCLE": {
            const center = ent.center;
            const radius = typeof ent.radius === "number" ? ent.radius : 0;
            if (center) {
              modelEntities.push({
                ...base,
                type: "CIRCLE",
                center: [center.x || 0, center.y || 0],
                radius,
              });
            }
            break;
          }

          case "ARC": {
            const center = ent.center;
            const radius = typeof ent.radius === "number" ? ent.radius : 0;
            if (center) {
              modelEntities.push({
                ...base,
                type: "ARC",
                center: [center.x || 0, center.y || 0],
                radius,
                startAngleRad: ent.startAngle || 0,
                endAngleRad: ent.endAngle || Math.PI * 2,
              });
            }
            break;
          }

          case "LWPOLYLINE": {
            const vertices: Array<{ x: number; y: number; bulge?: number }> = [];
            if (ent.vertices && Array.isArray(ent.vertices)) {
              for (const v of ent.vertices) {
                vertices.push({
                  x: v.x || 0,
                  y: v.y || 0,
                  bulge: v.bulge || 0,
                });
              }
            }
            modelEntities.push({
              ...base,
              type: "LWPOLYLINE",
              vertices,
              isClosed: !!ent.isClosed,
            });
            break;
          }

          case "TEXT": {
            const pos = ent.position || ent._position || { x: 0, y: 0 };
            modelEntities.push({
              ...base,
              type: "TEXT",
              text: ent.textString || ent._textString || "",
              insertionPoint: [pos.x || 0, pos.y || 0],
              height: ent.height || ent._height || 2.5,
              rotationRad: ent.rotation || ent._rotation || 0,
              widthFactor: ent.widthFactor || ent._widthFactor || 1,
              obliqueRad: ent.oblique || ent._oblique || 0,
              styleName: ent.styleName || ent._styleName || "STANDARD",
            });
            break;
          }

          case "MTEXT": {
            const pos = ent.position || ent._position || { x: 0, y: 0 };
            modelEntities.push({
              ...base,
              type: "MTEXT",
              text: ent.textString || ent._textString || ent.contents || "",
              insertionPoint: [pos.x || 0, pos.y || 0],
              height: ent.height || ent._height || 2.5,
              referenceWidth: ent.width || ent._referenceWidth || 0,
              rotationRad: ent.rotation || ent._rotation || 0,
              attachmentPoint: ent.attachmentPoint || 1,
              styleName: ent.styleName || "STANDARD",
            });
            break;
          }

            case "INSERT": {
            const pos = ent.position || { x: 0, y: 0 };
            modelEntities.push({
              ...base,
              type: "INSERT",
              blockName: ent.blockTableRecordName || ent.name || "",
              insertionPoint: [pos.x || 0, pos.y || 0],
              scale: [ent.scaleFactors?.x || 1, ent.scaleFactors?.y || 1, ent.scaleFactors?.z || 1],
              rotationRad: ent.rotation || 0,
            });
            break;
          }

          case "ELLIPSE": {
            const center = ent.center || { x: 0, y: 0 };
            const major = ent.majorAxisEndPoint || ent.majorAxis || { x: 1, y: 0 };
            modelEntities.push({
              ...base,
              type: "ELLIPSE",
              center: [center.x || 0, center.y || 0],
              majorAxisVector: [major.x || 1, major.y || 0],
              axisRatio: ent.axisRatio ?? ent.ratio ?? 1,
              startParam: ent.startParam ?? ent.startAngle ?? 0,
              endParam: ent.endParam ?? ent.endAngle ?? (Math.PI * 2),
            });
            break;
          }

          case "SPLINE": {
            const cp = (ent.controlPoints || []).map((p: any) => [p.x || 0, p.y || 0] as [number, number]);
            modelEntities.push({
              ...base,
              type: "SPLINE",
              degree: ent.degree || 3,
              controlPoints: cp,
              knots: ent.knots || [],
              weights: ent.weights,
              isPeriodic: !!ent.isPeriodic,
              isRational: !!ent.isRational,
            });
            break;
          }

          case "HATCH": {
            const loops: any[] = [];
            const rawLoops = ent.boundaryLoops || ent.loops || [];
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
            modelEntities.push({
              ...base,
              type: "HATCH",
              patternName: ent.patternName || "SOLID",
              isSolid: ent.isSolid !== false,
              patternScale: ent.patternScale || 1,
              patternAngleDeg: ent.patternAngle || 0,
              loops,
            });
            break;
          }

          case "WIPEOUT": {
            const vertices = (ent.vertices || []).map((v: any) => [v.x || 0, v.y || 0] as [number, number]);
            modelEntities.push({
              ...base,
              type: "WIPEOUT",
              vertices,
            });
            break;
          }

          default:
            break;
        }
      }
    }
  } catch (err) {
    console.warn("[DxfAdapter] ModelSpace varlıkları okunurken uyarı:", err);
  }

  return {
    sourceVersionKey: options.sourceVersionKey || "dxf-v1",
    sourceSha256: options.sourceSha256 || "",
    acadVersion: db.version ? String(db.version) : "AC1021",
    codepage: "ANSI_1254",
    units: db.insunits || 5,
    measurement: db.measurement || 1,
    layers,
    linetypes: {},
    textStyles: {},
    blocks: {},
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
