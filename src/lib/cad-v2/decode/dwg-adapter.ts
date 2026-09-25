// ============================================================================
// DWG/DXF MOTOR V2 — DWG DECODE ADAPTER (@mlightcad/libredwg-web 0.7.10)
// ============================================================================

import type { CadCanonicalDocument, CadColor, CadEntity, CadLayer, CadLayout, CadViewport, CadBBox2D, CadDiagnostic } from "../canonical/types";
import { resolveDwgInsertSpatialFilter } from "./dwg-spatial-filter";

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
  const diagnostics: CadDiagnostic[] = [];
  const rawDictionaryByHandle = new Map<string, any>();
  for (const dictionary of rawDb.objects?.DICTIONARY || []) {
    if (dictionary?.handle) rawDictionaryByHandle.set(String(dictionary.handle).toUpperCase(), dictionary);
  }
  const spatialFilterByHandle = new Map<string, any>();
  for (const filter of rawDb.objects?.SPATIAL_FILTER || []) {
    if (filter?.handle) spatialFilterByHandle.set(String(filter.handle).toUpperCase(), filter);
  }
  const rawBlockEntries = rawDb.tables?.BLOCK_RECORD?.entries || [];
  const paperSpaceEntityHandles = new Set<string>();
  if (Array.isArray(rawBlockEntries)) {
    for (const blockRecord of rawBlockEntries) {
      if (!String(blockRecord?.name || "").startsWith("*Paper_Space")) continue;
      for (const entity of Array.isArray(blockRecord.entities) ? blockRecord.entities : []) {
        if (entity?.handle) paperSpaceEntityHandles.add(String(entity.handle).toUpperCase());
      }
    }
  }
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
          method: lyr.color != null && typeof lyr.color === "number" && lyr.color > 0 ? "rgb" : (lyr.colorIndex != null ? "aci" : "byLayer"),
          aci: typeof lyr.colorIndex === "number" ? lyr.colorIndex : 7,
          rgb: lyr.color != null && typeof lyr.color === "number" && lyr.color > 0 ? [
            (lyr.color >> 16) & 255,
            (lyr.color >> 8) & 255,
            lyr.color & 255,
          ] : undefined,
        },
        lineweightMm: typeof lyr.lineweight === "number"
          ? (lyr.lineweight >= 0 ? (lyr.lineweight > 10 ? lyr.lineweight / 100 : lyr.lineweight) : lyr.lineweight)
          : (typeof lyr.lineweightMm === "number" ? lyr.lineweightMm : undefined),
        linetypeName: lyr.lineType || lyr.linetype || "Continuous",
      };
    }
  }

  // Yardımcı: Raw entity -> CadEntity dönüştürücü
  function convertRawEntity(ent: any, orderVal: bigint): CadEntity | null {
    const type = (ent.type || "").toUpperCase();
    const isVisible = ent.isVisible !== false && ent.visible !== false && !ent.off && !ent.isInvisible;

    let alpha: number | undefined = undefined;
    if (typeof ent.transparency === "number") {
      if ((ent.transparency & 0x02000000) !== 0) {
        alpha = (ent.transparency & 0xff) / 255;
      } else if (ent.transparency >= 0 && ent.transparency <= 100) {
        alpha = (100 - ent.transparency) / 100;
      }
    } else if (typeof ent.alpha === "number") {
      alpha = Math.max(0, Math.min(1, ent.alpha));
    }

    let color: CadColor | undefined = undefined;
    if (ent.color != null && typeof ent.color === "number" && ent.color > 0) {
      color = {
        method: "rgb",
        rgb: [
          (ent.color >> 16) & 255,
          (ent.color >> 8) & 255,
          ent.color & 255,
        ],
        aci: typeof ent.colorIndex === "number" ? ent.colorIndex : undefined,
        alpha,
      };
    } else if (typeof ent.colorIndex === "number") {
      color = {
        method: ent.colorIndex === 256 ? "byLayer" : (ent.colorIndex === 0 ? "byBlock" : "aci"),
        aci: ent.colorIndex,
        alpha,
      };
    } else if (alpha !== undefined) {
      color = { method: "byLayer", alpha };
    }

    let lineweightMm: number | undefined = undefined;
    if (typeof ent.lineweight === "number") {
      lineweightMm = ent.lineweight >= 0
        ? (ent.lineweight > 10 ? ent.lineweight / 100 : ent.lineweight)
        : ent.lineweight;
    } else if (typeof ent.lineweightMm === "number") {
      lineweightMm = ent.lineweightMm;
    }

    const linetype = ent.lineType || ent.linetype || undefined;
    const linetypeScale = typeof ent.lineTypeScale === "number" ? ent.lineTypeScale : (typeof ent.linetypeScale === "number" ? ent.linetypeScale : undefined);

    const base = {
      handle: ent.handle != null ? String(ent.handle) : `H_${orderVal}`,
      layer: ent.layer || "0",
      visible: isVisible,
      order: orderVal,
      ...(color ? { color } : {}),
      ...(lineweightMm !== undefined ? { lineweightMm } : {}),
      ...(linetype ? { linetype } : {}),
      ...(linetypeScale !== undefined ? { linetypeScale } : {}),
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
        const center = ent.center || ent.point;
        const radius = typeof ent.radius === "number" ? ent.radius : 0;
        if (center) {
          return {
            ...base,
            type: "CIRCLE",
            center: [center.x || 0, center.y || 0],
            radius,
          };
        }
        break;
      }

      case "ARC": {
        const center = ent.center || ent.point;
        const radius = typeof ent.radius === "number" ? ent.radius : 0;
        const startAngle = ent.startAngle || 0;
        const endAngle = ent.endAngle || 0;
        if (center) {
          return {
            ...base,
            type: "ARC",
            center: [center.x || 0, center.y || 0],
            radius,
            startAngleRad: startAngle,
            endAngleRad: endAngle,
            isClockwise: !!ent.isClockwise,
          };
        }
        break;
      }

      case "ELLIPSE": {
        const center = ent.center || ent.point;
        const majorVector = ent.majorAxisVector || ent.majorAxis || { x: 1, y: 0 };
        const axisRatio = ent.axisRatio || ent.minorAxisRatio || 0.5;
        if (center) {
          return {
            ...base,
            type: "ELLIPSE",
            center: [center.x || 0, center.y || 0],
            majorAxisVector: [majorVector.x || 1, majorVector.y || 0],
            axisRatio,
            startParam: ent.startParam || 0,
            endParam: ent.endParam || Math.PI * 2,
          };
        }
        break;
      }

      case "LWPOLYLINE": {
        const verts: Array<{ x: number; y: number; bulge?: number; startWidth?: number; endWidth?: number }> = [];
        if (Array.isArray(ent.vertices)) {
          for (const rawV of ent.vertices) {
            const vx = rawV.x != null ? rawV.x : (rawV[0] != null ? rawV[0] : 0);
            const vy = rawV.y != null ? rawV.y : (rawV[1] != null ? rawV[1] : 0);
            verts.push({
              x: vx,
              y: vy,
              bulge: rawV.bulge || (rawV[2] != null ? rawV[2] : undefined),
              startWidth: rawV.startWidth ?? rawV.sw,
              endWidth: rawV.endWidth ?? rawV.ew,
            });
          }
        }
        if (verts.length >= 2) {
          const constantWidth = typeof ent.constantWidth === "number" ? ent.constantWidth : (typeof ent.width === "number" ? ent.width : undefined);
          const plinegen = typeof ent.plinegen === "boolean" ? ent.plinegen : (typeof ent.flags === "number" ? !!(ent.flags & 128) : undefined);
          return {
            ...base,
            type: "LWPOLYLINE",
            vertices: verts,
            isClosed: !!ent.isClosed,
            ...(constantWidth !== undefined ? { constantWidth } : {}),
            ...(plinegen !== undefined ? { plinegen } : {}),
          };
        }
        break;
      }

      case "TEXT": {
        const pos = ent.startPoint || ent.insertionPoint || ent.point || ent.position || { x: 0, y: 0 };
        const align = ent.endPoint || ent.alignmentPoint || ent.secondAlignmentPoint;
        return {
          ...base,
          type: "TEXT",
          text: ent.text || ent.textString || ent.value || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          alignmentPoint: align ? [align.x || 0, align.y || 0] : undefined,
          height: ent.textHeight ?? ent.height ?? 2.5,
          rotationRad: ent.rotation || 0,
          widthFactor: ent.xScale ?? ent.widthFactor ?? 1,
          obliqueRad: ent.obliqueAngle ?? ent.oblique ?? 0,
          styleName: ent.styleName || ent.style || "STANDARD",
          horizontalMode: typeof ent.halign === "number" ? ent.halign : (typeof ent.horizontalMode === "number" ? ent.horizontalMode : undefined),
          verticalMode: typeof ent.valign === "number" ? ent.valign : (typeof ent.verticalMode === "number" ? ent.verticalMode : undefined),
          generationFlag: typeof ent.generationFlag === "number" ? ent.generationFlag : undefined,
        };
      }

      case "MTEXT": {
        const pos = ent.insertionPoint || ent.startPoint || ent.point || ent.position || { x: 0, y: 0 };
        return {
          ...base,
          type: "MTEXT",
          text: ent.text || ent.textString || ent.value || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          height: ent.textHeight ?? ent.height ?? 2.5,
          referenceWidth: ent.rectWidth ?? ent.referenceWidth ?? ent.width ?? 0,
          rotationRad: ent.rotation || 0,
          attachmentPoint: typeof ent.attachmentPoint === "number" ? ent.attachmentPoint : 1,
          drawingDirection: typeof ent.drawingDirection === "number" ? ent.drawingDirection : undefined,
          lineSpacingFactor: typeof ent.lineSpacing === "number" ? ent.lineSpacing : undefined,
          styleName: ent.styleName || ent.style || "STANDARD",
          backgroundMask: !!(ent.backgroundMask || ent.boxFlag || ent.backgroundFill),
        };
      }

      case "INSERT": {
        const pos = ent.insertionPoint || ent.point || ent.position || { x: 0, y: 0 };
        const sx = ent.xScale ?? ent.scale?.x ?? (Array.isArray(ent.scale) ? ent.scale[0] : 1);
        const sy = ent.yScale ?? ent.scale?.y ?? (Array.isArray(ent.scale) ? ent.scale[1] : 1);
        const sz = ent.zScale ?? ent.scale?.z ?? (Array.isArray(ent.scale) ? ent.scale[2] : 1);
        const ext = ent.extrusionDirection;
        return {
          ...base,
          type: "INSERT",
          blockName: ent.name || ent.blockName || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          scale: [sx, sy, sz],
          rotationRad: ent.rotation || 0,
          columnCount: typeof ent.columnCount === "number" ? ent.columnCount : undefined,
          rowCount: typeof ent.rowCount === "number" ? ent.rowCount : undefined,
          columnSpacing: typeof ent.columnSpacing === "number" ? ent.columnSpacing : undefined,
          rowSpacing: typeof ent.rowSpacing === "number" ? ent.rowSpacing : undefined,
          extrusionDirection: ext ? [ext.x || 0, ext.y || 0, ext.z ?? 1] : undefined,
        };
      }

      case "DIMENSION": {
        const pos = ent.insertionPoint || ent.position || ent.ins_pt || { x: 0, y: 0 };
        const blockName = ent.name || ent.block || ent.block_name || ent.anonymousBlockName;
        const def = ent.definitionPoint || ent.defPoint || ent.def_pt || { x: 0, y: 0 };
        const textPt = ent.textPoint || ent.textMidpoint || ent.text_midpt;
        const l1s = ent.line1Start || ent.xline1_pt || ent.defPoint2;
        const l1e = ent.line1End || ent.xline2_pt || ent.defPoint3;
        const l2s = ent.line2Start || ent.defPoint4;
        const l2e = ent.line2End;
        return {
          ...base,
          type: "DIMENSION",
          dimType: typeof ent.dimensionType === "number" ? ent.dimensionType : (typeof ent.dimType === "number" ? ent.dimType : 0),
          text: ent.text || ent.user_text || ent.textString || "",
          styleName: ent.styleName || ent.style || ent.dimstyle || "STANDARD",
          defPoint: [def.x || 0, def.y || 0],
          textMidpoint: textPt ? [textPt.x || 0, textPt.y || 0] : undefined,
          line1Start: l1s ? [l1s.x || 0, l1s.y || 0] : undefined,
          line1End: l1e ? [l1e.x || 0, l1e.y || 0] : undefined,
          line2Start: l2s ? [l2s.x || 0, l2s.y || 0] : undefined,
          line2End: l2e ? [l2e.x || 0, l2e.y || 0] : undefined,
          anonymousBlockName: blockName,
          insertionPoint: [pos.x || 0, pos.y || 0],
          rotationRad: typeof ent.rotation === "number" ? ent.rotation : (typeof ent.angle === "number" ? ent.angle : 0),
          scale: [1, 1, 1],
          measurement: typeof ent.actualMeasurement === "number" ? ent.actualMeasurement : (typeof ent.actual_measurement === "number" ? ent.actual_measurement : (typeof ent.measurement === "number" ? ent.measurement : undefined)),
          dimScale: typeof ent.dimScale === "number" ? ent.dimScale : (typeof ent.dimscale === "number" ? ent.dimscale : undefined),
          arrowSize: typeof ent.arrowSize === "number" ? ent.arrowSize : (typeof ent.arrow_size === "number" ? ent.arrow_size : undefined),
        };
      }

      case "ELLIPSE": {
        const center = ent.center || { x: 0, y: 0 };
        const major = ent.majorAxisEndPoint || ent.majorAxisVector || ent.majorAxis || ent.endpoint || { x: 1, y: 0 };
        return {
          ...base,
          type: "ELLIPSE",
          center: [center.x || 0, center.y || 0],
          majorAxisVector: [major.x || 1, major.y || 0],
          majorAxisEndPoint: ent.majorAxisEndPoint ? [ent.majorAxisEndPoint.x || 1, ent.majorAxisEndPoint.y || 0] : undefined,
          axisRatio: ent.axisRatio ?? ent.ratio ?? 1,
          startParam: ent.startAngle ?? ent.startParam ?? 0,
          endParam: ent.endAngle ?? ent.endParam ?? (Math.PI * 2),
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
        const rawPaths = ent.boundaryPaths || ent.loops || ent.boundaryLoops || [];
        for (const rp of rawPaths) {
          const isPoly = rp.isPolyline != null ? !!rp.isPolyline : (Array.isArray(rp.vertices) && rp.vertices.length > 0);
          const loop: any = {
            isPolyline: isPoly,
            boundaryPathTypeFlag: typeof rp.boundaryPathTypeFlag === "number" ? rp.boundaryPathTypeFlag : undefined,
            hasBulge: rp.hasBulge != null ? Boolean(rp.hasBulge) : undefined,
            isClosed: rp.isClosed != null ? Boolean(rp.isClosed) : true,
          };
          if (isPoly && Array.isArray(rp.vertices)) {
            const verts: [number, number][] = [];
            const bulges: number[] = [];
            let hasAnyBulge = false;
            for (const v of rp.vertices) {
              const vx = Array.isArray(v) ? (v[0] || 0) : (v.x || 0);
              const vy = Array.isArray(v) ? (v[1] || 0) : (v.y || 0);
              verts.push([vx, vy]);
              const b = (!Array.isArray(v) && typeof v.bulge === "number") ? v.bulge : 0;
              bulges.push(b);
              if (b !== 0) hasAnyBulge = true;
            }
            loop.vertices = verts;
            if (hasAnyBulge) {
              loop.bulges = bulges;
            }
          } else if (Array.isArray(rp.edges)) {
            const edges: any[] = [];
            for (const ed of rp.edges) {
              const edgeType = typeof ed.type === "number" ? ed.type : (ed.type || "").toUpperCase();
              if (edgeType === 1 || edgeType === "LINE" || (ed.startPoint && ed.endPoint)) {
                const s = ed.startPoint || ed.start || { x: 0, y: 0 };
                const e = ed.endPoint || ed.end || { x: 0, y: 0 };
                edges.push({
                  type: "LINE",
                  start: [s.x || 0, s.y || 0],
                  end: [e.x || 0, e.y || 0],
                });
              } else if (edgeType === 2 || edgeType === "ARC" || ed.radius != null) {
                const c = ed.center || { x: 0, y: 0 };
                edges.push({
                  type: "ARC",
                  center: [c.x || 0, c.y || 0],
                  radius: ed.radius || 1,
                  startAngleRad: ed.startAngle || 0,
                  endAngleRad: ed.endAngle ?? (Math.PI * 2),
                  ccw: ed.isCCW != null ? Boolean(ed.isCCW) : ed.ccw !== false,
                });
              } else if (edgeType === 3 || edgeType === "ELLIPSE") {
                const c = ed.center || { x: 0, y: 0 };
                const m = ed.majorAxisEndPoint || ed.majorAxisVector || ed.majorAxis || { x: 1, y: 0 };
                edges.push({
                  type: "ELLIPSE",
                  center: [c.x || 0, c.y || 0],
                  majorAxisVector: [m.x || 1, m.y || 0],
                  axisRatio: ed.axisRatio ?? ed.minorToMajorRatio ?? ed.ratio ?? 1,
                  startParam: ed.startAngle ?? ed.startParam ?? 0,
                  endParam: ed.endAngle ?? ed.endParam ?? (Math.PI * 2),
                  ccw: ed.isCCW != null ? Boolean(ed.isCCW) : ed.ccw !== false,
                });
              } else if (edgeType === 4 || edgeType === "SPLINE") {
                const cp = (ed.controlPoints || []).map((p: any) => [p.x || 0, p.y || 0] as [number, number]);
                edges.push({
                  type: "SPLINE",
                  degree: ed.degree || 3,
                  controlPoints: cp,
                  knots: ed.knots || [],
                  weights: ed.weights,
                  isPeriodic: !!ed.isPeriodic,
                  isRational: !!ed.isRational,
                });
              }
            }
            loop.edges = edges;
          }
          loops.push(loop);
        }
        return {
          ...base,
          type: "HATCH",
          patternName: ent.patternName || "SOLID",
          isSolid: ent.solidFill !== false && ent.isSolid !== false,
          solidFill: ent.solidFill != null ? Boolean(ent.solidFill) : (ent.isSolid !== false),
          patternScale: ent.patternScale ?? 1,
          patternAngleDeg: ent.patternAngle ?? 0,
          hatchStyle: typeof ent.hatchStyle === "number" ? ent.hatchStyle : undefined,
          patternType: typeof ent.patternType === "number" ? ent.patternType : undefined,
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

      case "ATTDEF": {
        const pos = ent.startPoint || ent.insertionPoint || ent.point || ent.position || { x: 0, y: 0 };
        const align = ent.endPoint || ent.alignmentPoint || ent.secondAlignmentPoint;
        const flags = typeof ent.flags === "number" ? ent.flags : 0;
        return {
          ...base,
          type: "ATTDEF",
          tag: ent.tag || ent.name || "",
          prompt: ent.prompt,
          defaultText: ent.defaultText || ent.text || ent.value || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          alignmentPoint: align ? [align.x || 0, align.y || 0] : undefined,
          height: ent.textHeight ?? ent.height ?? 2.5,
          rotationRad: ent.rotation || 0,
          widthFactor: ent.xScale ?? ent.widthFactor ?? 1,
          obliqueRad: ent.obliqueAngle ?? ent.oblique ?? 0,
          styleName: ent.styleName || ent.style || "STANDARD",
          horizontalMode: typeof ent.halign === "number" ? ent.halign : (typeof ent.horizontalMode === "number" ? ent.horizontalMode : undefined),
          verticalMode: typeof ent.valign === "number" ? ent.valign : (typeof ent.verticalMode === "number" ? ent.verticalMode : undefined),
          isInvisible: Boolean(flags & 1 || ent.isInvisible),
          isConstant: Boolean(flags & 2 || ent.isConstant),
        };
      }

      case "ATTRIB": {
        const pos = ent.startPoint || ent.insertionPoint || ent.point || ent.position || { x: 0, y: 0 };
        const align = ent.endPoint || ent.alignmentPoint || ent.secondAlignmentPoint;
        const flags = typeof ent.flags === "number" ? ent.flags : 0;
        return {
          ...base,
          type: "ATTRIB",
          tag: ent.tag || ent.name || "",
          text: ent.text || ent.textString || ent.value || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          alignmentPoint: align ? [align.x || 0, align.y || 0] : undefined,
          height: ent.textHeight ?? ent.height ?? 2.5,
          rotationRad: ent.rotation || 0,
          widthFactor: ent.xScale ?? ent.widthFactor ?? 1,
          obliqueRad: ent.obliqueAngle ?? ent.oblique ?? 0,
          styleName: ent.styleName || ent.style || "STANDARD",
          horizontalMode: typeof ent.halign === "number" ? ent.halign : (typeof ent.horizontalMode === "number" ? ent.horizontalMode : undefined),
          verticalMode: typeof ent.valign === "number" ? ent.valign : (typeof ent.verticalMode === "number" ? ent.verticalMode : undefined),
          isInvisible: Boolean(flags & 1 || ent.isInvisible),
          isConstant: Boolean(flags & 2 || ent.isConstant),
        };
      }

      case "LEADER": {
        const vertices: [number, number][] = (ent.vertices || ent.points || []).map((p: any) => [
          p.x || (Array.isArray(p) ? p[0] : 0),
          p.y || (Array.isArray(p) ? p[1] : 0),
        ]);
        return {
          ...base,
          type: "LEADER",
          vertices,
          hasArrowhead: ent.hasArrowhead !== false && ent.arrowheadFlag !== 0,
          arrowheadSize: ent.arrowheadSize || ent.arrowSize || 2.5,
          text: ent.text || ent.annotationText || undefined,
          annotationType: typeof ent.annotationType === "number" ? ent.annotationType : undefined,
          annotatedEntityHandle: ent.annotatedEntityHandle || ent.annotationHandle || undefined,
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
      // LibreDWG's flattened entity list can include paper-space entities
      // already owned by a *Paper_Space BLOCK_RECORD. Keep those entities in
      // paperSpaceEntities only; otherwise they render twice, including in the
      // Model chunk where viewport/XCLIP tests can mistake them for clip leaks.
      if (ent?.handle && paperSpaceEntityHandles.has(String(ent.handle).toUpperCase())) continue;
      const orderVal = currentOrder;
      currentOrder += BigInt(1);
      const converted = convertRawEntity(ent, orderVal);
      if (converted) {
        if (converted.type === "INSERT") {
          const spatialLink = resolveDwgInsertSpatialFilter(ent, rawDictionaryByHandle, spatialFilterByHandle);
          const spatialFilter = spatialLink.filter;
          if (spatialLink.present && !spatialFilter) {
            converted.visible = false;
            diagnostics.push({ id: `diag_xclip_reference_${converted.handle || "insert"}`, code: "UNRESOLVED_XCLIP_REFERENCE", severity: "warning", message: "INSERT references an XCLIP SPATIAL_FILTER that could not be resolved or whose owner dictionary does not match; the INSERT is withheld instead of rendered without its clip.", entityHandle: converted.handle });
          } else if (spatialFilter) {
            const vertices = Array.isArray(spatialFilter.vertices) ? spatialFilter.vertices : [];
            const identity4x3 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0];
            const isIdentityMatrix = (value: unknown) => Array.isArray(value) && value.length === 12 && value.every((n, i) => typeof n === "number" && Math.abs(n - identity4x3[i]) < 1e-10);
            const origin = spatialFilter.origin || { x: 0, y: 0, z: 0 };
            const normal = spatialFilter.extrusionDirection || { x: 0, y: 0, z: 1 };
            const isTopOcs = Math.abs(normal.x || 0) < 1e-10 && Math.abs(normal.y || 0) < 1e-10 && Math.abs((normal.z ?? 1) - 1) < 1e-10;
            const hasOrigin = Math.abs(origin.x || 0) < 1e-10 && Math.abs(origin.y || 0) < 1e-10 && Math.abs(origin.z || 0) < 1e-10;
            const clipIsInverted = spatialFilter.isInverted ?? spatialFilter.inverted;
            const validVertices = vertices.length >= 3 && vertices.every((point: any) => Number.isFinite(point?.x) && Number.isFinite(point?.y));
            const supportedPlanes = !spatialFilter.frontClippingPlaneFlag && !spatialFilter.backClippingPlaneFlag;
            // `invertBlockMatrix` represents the INSERT's own inverse transform.
            // Block geometry is transformed to WCS by the compiler before clipping,
            // while SPATIAL_FILTER vertices are already in the clip coordinate system.
            // Requiring the INSERT matrix to be identity incorrectly drops ordinary
            // translated/rotated inserts even when the filter matrix is identity.
            if (validVertices && isTopOcs && hasOrigin && isIdentityMatrix(spatialFilter.matrix) && supportedPlanes) {
              (converted as any).clipBoundary = {
                // AutoCAD LT 2027's XCLIP Off oracle persists the inactive
                // state as SPATIAL_FILTER.clipBoundaryVisible=false (DXF 71=0).
                // A separate XCLIPFRAME=0 oracle leaves this value true and
                // clipping active, so the global frame toggle is not this flag.
                isClippingEnabled: spatialFilter.clipBoundaryVisible !== false,
                isInverted: clipIsInverted === true || clipIsInverted === 1,
                boundaryVertices: vertices.map((point: any) => [point.x, point.y]),
              };
            } else {
              // Never silently render the unclipped block when we cannot map its
              // filter into the world-space clip contract consumed by the compiler.
              converted.visible = false;
              diagnostics.push({ id: `diag_xclip_unresolved_${converted.handle || "insert"}`, code: "UNRESOLVED_XCLIP_TRANSFORM", severity: "warning", message: "XCLIP exists but its OCS/matrix/clip-depth data cannot be safely normalized; the affected INSERT is withheld to avoid showing geometry outside its clip boundary.", entityHandle: converted.handle });
            }
          }
        }
        modelEntities.push(converted);
      }
    }
  }

  // 3. Layout (Pafta) tablosunu dönüştür
  const layouts: Record<string, CadLayout> = {
    Model: {
      id: "Model",
      name: "Model",
      isModelSpace: true,
      bbox: [0, 0, 1000, 1000],
      blockRecordName: "*Model_Space",
      tabOrder: 0,
      viewportIds: [],
    },
  };
  const viewports: Record<string, CadViewport> = {};
  const paperSpaceEntities: Record<string, CadEntity[]> = {};
  const rawLayoutEntries = rawDb.objects?.LAYOUT || rawDb.tables?.LAYOUT?.entries || rawDb.layouts || [];
  if (Array.isArray(rawLayoutEntries)) {
    for (let lIdx = 0; lIdx < rawLayoutEntries.length; lIdx++) {
      const rl = rawLayoutEntries[lIdx];
      const name = rl.layoutName || rl.name || `Layout${lIdx + 1}`;
      const associatedBlock = rawBlockEntries.find((block: any) => block.layout === rl.handle || block.handle === rl.paperSpaceTableId);
      const isModel = rl.isModelSpace != null ? Boolean(rl.isModelSpace) : (name === "Model" || associatedBlock?.name === "*Model_Space");
      const id = isModel ? "Model" : name;
      const bName = associatedBlock?.name || rl.blockRecordName || (isModel ? "*Model_Space" : (name === "Model" ? "*Model_Space" : `*Paper_Space${lIdx > 1 ? lIdx - 1 : ""}`));

      let bbox: CadBBox2D = [0, 0, 1000, 1000];
      if (Array.isArray(rl.extents) && rl.extents.length === 4) {
        bbox = rl.extents;
      } else if (rl.minExtent && rl.maxExtent && [rl.minExtent.x, rl.minExtent.y, rl.maxExtent.x, rl.maxExtent.y].every(Number.isFinite) && rl.maxExtent.x > rl.minExtent.x && rl.maxExtent.y > rl.minExtent.y) {
        bbox = [rl.minExtent.x, rl.minExtent.y, rl.maxExtent.x, rl.maxExtent.y];
      } else if (rl.limmin && rl.limmax) {
        if ([rl.limmin.x, rl.limmin.y, rl.limmax.x, rl.limmax.y].every(Number.isFinite) && rl.limmax.x > rl.limmin.x && rl.limmax.y > rl.limmin.y) {
          bbox = [rl.limmin.x, rl.limmin.y, rl.limmax.x, rl.limmax.y];
        }
      }

      layouts[id] = {
        id,
        name,
        isModelSpace: isModel,
        bbox,
        blockRecordName: bName,
        tabOrder: typeof rl.tabOrder === "number" ? rl.tabOrder : lIdx,
        viewportIds: [],
      };
    }
  }

  // 4. Blok tanımlarını (BLOCK_RECORD) dönüştür
  const blocks: Record<string, any> = {};
  const blockEntries = rawBlockEntries;
  if (Array.isArray(blockEntries)) {
    let blockOrder = BigInt(1);
    for (const b of blockEntries) {
      const name = b.name || "";
      if (!name || name.startsWith("*Model_Space")) {
        continue;
      }

      const isPaperBlock = name.startsWith("*Paper_Space");
      let matchedLayoutId = "Layout1";
      if (isPaperBlock) {
        for (const lay of Object.values(layouts)) {
          if (lay.blockRecordName === name) {
            matchedLayoutId = lay.id;
            break;
          }
        }
      }

      const bEntities: CadEntity[] = [];
      if (Array.isArray(b.entities)) {
        for (const ent of b.entities) {
          const o = blockOrder;
          blockOrder += BigInt(1);

          // VIEWPORT entity kontrolü
          const entType = (ent.type || "").toUpperCase();
          if (entType === "VIEWPORT") {
            // Viewports belong to paper-space block records. AutoCAD also writes
            // viewport number 1 as the default paper-space system viewport; it
            // is not a model projection and must never reach the scene compiler.
            if (!isPaperBlock) continue;
            const viewportNumber = typeof ent.viewportId === "number" ? ent.viewportId
              : typeof ent.number === "number" ? ent.number : undefined;
            if (viewportNumber === 1) continue;
            const vpCenter = ent.viewportCenter || ent.centerPoint || ent.center || ent.insertionPoint || { x: 0, y: 0 };
            const displayCenter = ent.displayCenter || ent.viewCenter || { x: 0, y: 0 };
            const twistAngleRad = ent.viewTwistAngle ?? ent.twistAngleRad ?? ent.twistAngle ?? 0;
            const target = ent.targetPoint || ent.viewTarget || ent.target;
            const cosTwist = Math.cos(twistAngleRad);
            const sinTwist = Math.sin(twistAngleRad);
            const vpViewCenter = target
              ? { x: (target.x || 0) + (displayCenter.x || 0) * cosTwist - (displayCenter.y || 0) * sinTwist, y: (target.y || 0) + (displayCenter.x || 0) * sinTwist + (displayCenter.y || 0) * cosTwist }
              : displayCenter;
            const vpId = ent.handle ? String(ent.handle) : `vp_${o}`;
            const layerNameById = new Map<string, string>();
            for (const layer of rawLayerEntries) {
              if (layer.handle) layerNameById.set(String(layer.handle).toUpperCase(), layer.name);
              if (layer.objectId) layerNameById.set(String(layer.objectId).toUpperCase(), layer.name);
            }
            const frozenLayers = Array.isArray(ent.frozenLayerIds)
              ? ent.frozenLayerIds.map((layerId: string) => layerNameById.get(String(layerId).toUpperCase()) || String(layerId))
              : (Array.isArray(ent.frozenLayers) ? ent.frozenLayers : (Array.isArray(ent.frozenLayerNames) ? ent.frozenLayerNames : []));
            const clipBoundaryObjectId = ent.clippingBoundaryId ? String(ent.clippingBoundaryId) : undefined;
            if (clipBoundaryObjectId && !Array.isArray(ent.clipPolygon)) {
              diagnostics.push({ id: `diag_vp_clip_${vpId}`, code: "UNRESOLVED_VIEWPORT_CLIP_BOUNDARY", severity: "warning", message: "Viewport clipping boundary object is present, but its polygon has not been resolved into canonical coordinates.", entityHandle: vpId });
            }

            const vp: CadViewport = {
              id: vpId,
              layoutId: matchedLayoutId,
              viewportNumber,
              order: BigInt(o),
              center: [vpCenter.x || 0, vpCenter.y || 0],
              width: typeof ent.width === "number" && ent.width > 0 ? ent.width : 200,
              height: typeof ent.height === "number" && ent.height > 0 ? ent.height : 150,
              viewCenter: [vpViewCenter.x || 0, vpViewCenter.y || 0],
              viewDirection: ent.viewDirectionFromTarget || ent.viewDirection ? [(ent.viewDirectionFromTarget || ent.viewDirection).x || 0, (ent.viewDirectionFromTarget || ent.viewDirection).y || 0, (ent.viewDirectionFromTarget || ent.viewDirection).z ?? 1] : undefined,
              perspective: Boolean((ent.statusBitFlags || 0) & 1),
              viewHeight: typeof ent.viewHeight === "number" && ent.viewHeight > 0 ? ent.viewHeight : 100,
              twistAngleRad,
              frozenLayers,
              clipPolygon: Array.isArray(ent.clipPolygon) ? ent.clipPolygon.map((p: any) => [p.x ?? p[0] ?? 0, p.y ?? p[1] ?? 0] as [number, number]) : undefined,
              clipBoundaryObjectId,
              layerOverrides: ent.layerOverrides,
            };
            if (vp.viewDirection && (Math.abs(vp.viewDirection[0]) > 1e-8 || Math.abs(vp.viewDirection[1]) > 1e-8 || vp.viewDirection[2] < 0.999999)) {
              diagnostics.push({ id: `diag_vp_direction_${vpId}`, code: "UNSUPPORTED_NON_TOP_VIEWPORT_DIRECTION", severity: "warning", message: "Non-top or 3D viewport direction is not supported by the 2D paper renderer.", entityHandle: vpId });
            }
            if (vp.perspective) diagnostics.push({ id: `diag_vp_perspective_${vpId}`, code: "UNSUPPORTED_PERSPECTIVE_VIEWPORT", severity: "warning", message: "Perspective viewport is not supported by the 2D paper renderer.", entityHandle: vpId });
            viewports[vpId] = vp;
            if (layouts[matchedLayoutId]) {
              layouts[matchedLayoutId].viewportIds = layouts[matchedLayoutId].viewportIds || [];
              layouts[matchedLayoutId].viewportIds!.push(vpId);
            }
            continue;
          }

          const converted = convertRawEntity(ent, o);
          if (converted) {
            bEntities.push(converted);
          }
        }
      }

      if (isPaperBlock) {
        paperSpaceEntities[matchedLayoutId] = (paperSpaceEntities[matchedLayoutId] || []).concat(bEntities);
      } else {
        blocks[name] = {
          name,
          basePoint: [b.basePoint?.x || 0, b.basePoint?.y || 0],
          entities: bEntities,
          isXref: Boolean(b.isXref || (((b.flags ?? b.blockTypeFlags ?? 0) & 4) !== 0)),
          xrefPath: typeof (b.pathName || b.xrefPath) === "string" && (b.pathName || b.xrefPath).length > 0 ? (b.pathName || b.xrefPath) : undefined,
        };
      }
    }
  }

  const rawHeaderInsunits = rawDb.header?.INSUNITS ?? rawDb.header?.insunits;
  const rawHeaderMeasurement = rawDb.header?.MEASUREMENT ?? rawDb.header?.measurement;

  const docUnits = typeof rawHeaderInsunits === "number" ? rawHeaderInsunits : 0;
  const docMeasurement = typeof rawHeaderMeasurement === "number" ? rawHeaderMeasurement : 1;

  if (rawHeaderInsunits != null && rawHeaderInsunits !== docUnits) {
    diagnostics.push({
      id: "diag_unit_mismatch",
      code: "UNIT_MAPPING_MISMATCH",
      severity: "warning",
      message: `Raw INSUNITS=${rawHeaderInsunits} ancak adaptör units=${docUnits} üretti.`,
    });
  }

  return {
    sourceVersionKey: options.sourceVersionKey || "dwg-v1",
    sourceSha256: options.sourceSha256 || "",
    acadVersion: rawDb.header?.version || "AC1032",
    codepage: rawDb.header?.codepage || "ANSI_1254",
    units: docUnits,
    measurement: docMeasurement,
    layers,
    linetypes: {},
    textStyles: {},
    blocks,
    layouts,
    viewports,
    modelSpaceEntities: modelEntities,
    paperSpaceEntities,
    diagnostics,
    rawStats: {
      rawHeaderInsunits: typeof rawHeaderInsunits === "number" ? rawHeaderInsunits : undefined,
      rawEntitiesCount: Array.isArray(rawDb.entities) ? rawDb.entities.length : 0,
      rawTableCounts: {
        blocks: Object.keys(blocks).length,
        layers: Object.keys(layers).length,
      },
    },
  };
}
