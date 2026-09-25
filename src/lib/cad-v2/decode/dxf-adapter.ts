// ============================================================================
// DWG/DXF MOTOR V2 — DXF DECODE ADAPTER (@mlightcad/data-model 1.14.2)
// ============================================================================

import type { CadCanonicalDocument, CadColor, CadEntity, CadLayer, CadBlockDefinition, CadLayout, CadViewport, CadBBox2D, CadDiagnostic } from "../canonical/types";
import { parseDxfSplines, parseDxfXclips } from "./dxf-xclip-pairs";

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
  const dxfXclips = await parseDxfXclips(u8Data);
  const dxfSplines = await parseDxfSplines(u8Data);

  // 1. Katmanları çözümle
  const layers: Record<string, CadLayer> = {};
  const diagnostics: CadDiagnostic[] = [];
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
          color: (rec.color && rec.color.red != null && rec.color.green != null && rec.color.blue != null) ? {
            method: "rgb",
            rgb: [rec.color.red, rec.color.green, rec.color.blue],
            aci: typeof rec.color?.colorIndex === "number" ? rec.color.colorIndex : undefined,
          } : {
            method: "aci",
            aci: typeof rec.color?.colorIndex === "number" ? rec.color.colorIndex : 7,
          },
          lineweightMm: typeof rec.lineWeight === "number"
            ? (rec.lineWeight >= 0 ? (rec.lineWeight > 10 ? rec.lineWeight / 100 : rec.lineWeight) : rec.lineWeight)
            : (typeof rec.lineweight === "number" ? (rec.lineweight >= 0 ? (rec.lineweight > 10 ? rec.lineweight / 100 : rec.lineweight) : rec.lineweight) : undefined),
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

  // 2. DXF Varlık Çevirici Yardımcı Fonksiyon
  const applyDxfXclip = (rawEntity: any, converted: CadEntity | null) => {
    if (!converted || converted.type !== "INSERT") return;
    const rawHandle = String(rawEntity?.handle ?? rawEntity?.objectId ?? "").trim().toUpperCase();
    const xclip = dxfXclips.get(rawHandle);
    if (!xclip) return;
    if (xclip.state === "resolved" && xclip.clipBoundary) {
      converted.clipBoundary = xclip.clipBoundary;
      return;
    }
    converted.visible = false;
    const isReference = xclip.state === "unresolved-reference";
    diagnostics.push({
      id: `diag_dxf_xclip_${converted.handle || rawHandle}`,
      code: isReference ? "UNRESOLVED_XCLIP_REFERENCE" : "UNRESOLVED_XCLIP_TRANSFORM",
      severity: "warning",
      message: isReference
        ? "DXF INSERT references an XCLIP SPATIAL_FILTER that could not be resolved; the INSERT is withheld instead of rendered without its clip."
        : "DXF XCLIP uses an OCS/origin/matrix/depth profile that cannot be normalized safely; the INSERT is withheld.",
      entityHandle: converted.handle,
    });
  };
  function convertDxfEntity(ent: any, orderVal: bigint): CadEntity | null {
    if (!ent) return null;
    const type = (ent.dxfTypeName || "").toUpperCase();

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
    const col = ent.color || ent._color;
    if (col) {
      const hasRgb = col.red != null && col.green != null && col.blue != null;
      if (col.colorIndex === 0) {
        color = { method: "byBlock", alpha };
      } else if (col.colorIndex === 256) {
        color = { method: "byLayer", alpha };
      } else if (hasRgb) {
        color = {
          method: "rgb",
          rgb: [col.red, col.green, col.blue],
          aci: typeof col.colorIndex === "number" ? col.colorIndex : undefined,
          alpha,
        };
      } else if (typeof col.colorIndex === "number") {
        color = { method: "aci", aci: col.colorIndex, alpha };
      }
    } else if (alpha !== undefined) {
      color = { method: "byLayer", alpha };
    }

    let lineweightMm: number | undefined = undefined;
    const lwRaw = ent.lineWeight ?? ent.lineweight ?? ent._lineWeight;
    if (typeof lwRaw === "number") {
      lineweightMm = lwRaw >= 0 ? (lwRaw > 10 ? lwRaw / 100 : lwRaw) : lwRaw;
    }

    const linetype = ent.lineType || ent.linetype || ent._lineType || undefined;
    const linetypeScale = typeof ent.lineTypeScale === "number" ? ent.lineTypeScale : (typeof ent.linetypeScale === "number" ? ent.linetypeScale : undefined);

    const base = {
      handle: ent.handle != null ? String(ent.handle) : `H_${orderVal}`,
      layer: ent._layer || ent.layer || "0",
      visible: ent._visibility !== false && ent.visible !== false && !ent.isOff,
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
        const center = ent.center;
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
        const center = ent.center;
        const radius = typeof ent.radius === "number" ? ent.radius : 0;
        if (center) {
          return {
            ...base,
            type: "ARC",
            center: [center.x || 0, center.y || 0],
            radius,
            startAngleRad: ent.startAngle || 0,
            endAngleRad: ent.endAngle || Math.PI * 2,
            isClockwise: !!ent.isClockwise,
          };
        }
        break;
      }

      case "ELLIPSE": {
        const center = ent.center;
        const majorVector = ent.majorAxisVector || ent.majorVector || { x: 1, y: 0 };
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
        const vertices: Array<{ x: number; y: number; bulge?: number; startWidth?: number; endWidth?: number }> = [];
        if (Array.isArray(ent.vertices)) {
          for (const v of ent.vertices) {
            vertices.push({
              x: v.x || 0,
              y: v.y || 0,
              bulge: typeof v.bulge === "number" ? v.bulge : undefined,
              startWidth: typeof v.startWidth === "number" ? v.startWidth : undefined,
              endWidth: typeof v.endWidth === "number" ? v.endWidth : undefined,
            });
          }
        }
        const constantWidth = typeof ent.constantWidth === "number" ? ent.constantWidth : (typeof ent.width === "number" ? ent.width : undefined);
        const plinegen = typeof ent.plinegen === "boolean" ? ent.plinegen : (typeof ent.flags === "number" ? !!(ent.flags & 128) : undefined);
        return {
          ...base,
          type: "LWPOLYLINE",
          vertices,
          isClosed: !!ent.isClosed,
          ...(constantWidth !== undefined ? { constantWidth } : {}),
          ...(plinegen !== undefined ? { plinegen } : {}),
        };
      }

      case "TEXT": {
        const pos = ent.position || ent._position || ent.insertionPoint || { x: 0, y: 0 };
        const align = ent.alignmentPoint || ent.secondAlignmentPoint || ent.secondPosition || ent._alignmentPoint;
        return {
          ...base,
          type: "TEXT",
          text: ent.textString || ent._textString || ent.text || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          alignmentPoint: align ? [align.x || 0, align.y || 0] : undefined,
          height: ent.height || ent._height || 2.5,
          rotationRad: ent.rotation || ent._rotation || 0,
          widthFactor: ent.widthFactor || ent._widthFactor || 1,
          obliqueRad: ent.oblique || ent._oblique || 0,
          styleName: ent.styleName || ent._styleName || "STANDARD",
          horizontalMode: typeof ent.halign === "number" ? ent.halign : (typeof ent.horizontalMode === "number" ? ent.horizontalMode : (typeof ent._horizontalJustification === "number" ? ent._horizontalJustification : undefined)),
          verticalMode: typeof ent.valign === "number" ? ent.valign : (typeof ent.verticalMode === "number" ? ent.verticalMode : (typeof ent._verticalJustification === "number" ? ent._verticalJustification : undefined)),
          generationFlag: typeof ent.generationFlag === "number" ? ent.generationFlag : (typeof ent._generationFlag === "number" ? ent._generationFlag : undefined),
        };
      }

      case "MTEXT": {
        const pos = ent.position || ent._position || ent.insertionPoint || { x: 0, y: 0 };
        return {
          ...base,
          type: "MTEXT",
          text: ent.textString || ent._textString || ent.contents || ent.text || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          height: ent.height || ent._height || 2.5,
          referenceWidth: ent.width || ent._referenceWidth || 0,
          rotationRad: ent.rotation || ent._rotation || 0,
          attachmentPoint: typeof ent.attachmentPoint === "number" ? ent.attachmentPoint : (typeof ent._attachmentPoint === "number" ? ent._attachmentPoint : 1),
          drawingDirection: typeof ent.drawingDirection === "number" ? ent.drawingDirection : undefined,
          lineSpacingFactor: typeof ent.lineSpacingFactor === "number" ? ent.lineSpacingFactor : (typeof ent.lineSpacing === "number" ? ent.lineSpacing : undefined),
          styleName: ent.styleName || ent._styleName || "STANDARD",
          backgroundMask: !!(ent.backgroundMask || ent.boxFlag || ent.backgroundFill),
        };
      }

      case "INSERT": {
        const pos = ent.position || ent._position || { x: 0, y: 0 };
        const blockName = ent.blockName || ent._blockName || ent.name || ent.blockTableRecordName || "";
        return {
          ...base,
          type: "INSERT",
          blockName,
          insertionPoint: [pos.x || 0, pos.y || 0],
          scale: [
            ent.scaleFactors?.x ?? ent._scaleFactors?.x ?? 1,
            ent.scaleFactors?.y ?? ent._scaleFactors?.y ?? 1,
            ent.scaleFactors?.z ?? ent._scaleFactors?.z ?? 1,
          ],
          rotationRad: ent.rotation ?? ent._rotation ?? 0,
        };
      }

      case "ELLIPSE": {
        const center = ent.center || { x: 0, y: 0 };
        const major = ent.majorAxisEndPoint || ent.majorAxisVector || ent.majorAxis || { x: 1, y: 0 };
        return {
          ...base,
          type: "ELLIPSE",
          center: [center.x || 0, center.y || 0],
          majorAxisVector: [major.x || 1, major.y || 0],
          majorAxisEndPoint: ent.majorAxisEndPoint ? [ent.majorAxisEndPoint.x || 1, ent.majorAxisEndPoint.y || 0] : undefined,
          axisRatio: ent.axisRatio ?? ent.ratio ?? 1,
          startParam: ent.startParam ?? ent.startAngle ?? 0,
          endParam: ent.endParam ?? ent.endAngle ?? Math.PI * 2,
        };
      }

      case "SPLINE": {
        const sourceHandle = ent.handle ?? ent.objectId;
        const splineHandle = sourceHandle != null ? String(sourceHandle) : base.handle;
        const source = dxfSplines.get(splineHandle.trim().toUpperCase());
        const rawControlPoints = source?.controlPoints || ent.controlPoints || ent._geo?._nurbsCurve?._controlPoints || [];
        const cp: Array<[number, number]> = source
          ? source.controlPoints.map(([x, y]) => [x, y])
          : rawControlPoints.map((p: any) => [p.x || 0, p.y || 0] as [number, number]);
        return {
          ...base,
          handle: splineHandle,
          type: "SPLINE",
          degree: source?.degree ?? ent.degree ?? ent._geo?._degree ?? 3,
          controlPoints: cp,
          knots: source?.knots || ent.knots || ent._geo?._nurbsCurve?._knots || [],
          weights: source ? (source.weights.length ? source.weights : undefined) : ent.weights || ent._geo?._nurbsCurve?._weights,
          isPeriodic: source?.flags !== undefined ? (source.flags & 0x02) !== 0 : !!ent.isPeriodic,
          isRational: source?.flags !== undefined ? (source.flags & 0x04) !== 0 : !!ent.isRational,
        };
      }

      case "HATCH": {
        const loops: any[] = [];
        const rawLoops = ent.boundaryLoops || ent.boundaryPaths || ent.loops || [];
        for (const rl of rawLoops) {
          const isPoly = rl.isPolyline != null ? !!rl.isPolyline : (Array.isArray(rl.vertices) && rl.vertices.length > 0);
          const loop: any = {
            isPolyline: isPoly,
            boundaryPathTypeFlag: typeof rl.boundaryPathTypeFlag === "number" ? rl.boundaryPathTypeFlag : undefined,
            hasBulge: rl.hasBulge != null ? Boolean(rl.hasBulge) : undefined,
            isClosed: rl.isClosed != null ? Boolean(rl.isClosed) : true,
          };
          if (isPoly && Array.isArray(rl.vertices)) {
            const verts: [number, number][] = [];
            const bulges: number[] = [];
            let hasAnyBulge = false;
            for (const v of rl.vertices) {
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
          } else if (Array.isArray(rl.edges)) {
            const edges: any[] = [];
            for (const ed of rl.edges) {
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

      case "DIMENSION": {
        const pos = ent.insertionPoint || ent.position || ent._position || { x: 0, y: 0 };
        const blockName = ent.blockName || ent._blockName || ent.anonymousBlockName || ent.name;
        const def = ent.definitionPoint || ent.defPoint || ent._definitionPoint || { x: 0, y: 0 };
        const textPt = ent.textPoint || ent.textMidpoint || ent._textPoint;
        const l1s = ent.line1Start || ent.definitionPoint2 || ent._definitionPoint2;
        const l1e = ent.line1End || ent.definitionPoint3 || ent._definitionPoint3;
        const l2s = ent.line2Start || ent.definitionPoint4;
        const l2e = ent.line2End;
        return {
          ...base,
          type: "DIMENSION",
          dimType: typeof ent.dimensionType === "number" ? ent.dimensionType : (typeof ent.dimType === "number" ? ent.dimType : (typeof ent._dimensionType === "number" ? ent._dimensionType : 0)),
          text: ent.text || ent.textString || ent._textString || "",
          styleName: ent.styleName || ent.dimStyle || ent._styleName || "STANDARD",
          defPoint: [def.x || 0, def.y || 0],
          textMidpoint: textPt ? [textPt.x || 0, textPt.y || 0] : undefined,
          line1Start: l1s ? [l1s.x || 0, l1s.y || 0] : undefined,
          line1End: l1e ? [l1e.x || 0, l1e.y || 0] : undefined,
          line2Start: l2s ? [l2s.x || 0, l2s.y || 0] : undefined,
          line2End: l2e ? [l2e.x || 0, l2e.y || 0] : undefined,
          anonymousBlockName: blockName,
          insertionPoint: [pos.x || 0, pos.y || 0],
          rotationRad: typeof ent.rotation === "number" ? ent.rotation : (typeof ent._rotation === "number" ? ent._rotation : 0),
          scale: [1, 1, 1],
          measurement: typeof ent.actualMeasurement === "number" ? ent.actualMeasurement : (typeof ent.measurement === "number" ? ent.measurement : undefined),
          dimScale: typeof ent.dimScale === "number" ? ent.dimScale : undefined,
          arrowSize: typeof ent.arrowSize === "number" ? ent.arrowSize : undefined,
        };
      }

      case "ATTDEF": {
        const pos = ent.position || ent._position || ent.insertionPoint || { x: 0, y: 0 };
        const align = ent.alignmentPoint || ent.secondAlignmentPoint || ent.secondPosition || ent._alignmentPoint;
        const flags = typeof ent.flags === "number" ? ent.flags : (typeof ent._flags === "number" ? ent._flags : 0);
        return {
          ...base,
          type: "ATTDEF",
          tag: ent.tag || ent._tag || ent.name || "",
          prompt: ent.prompt || ent._prompt,
          defaultText: ent.textString || ent._textString || ent.defaultText || ent.text || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          alignmentPoint: align ? [align.x || 0, align.y || 0] : undefined,
          height: ent.height || ent._height || 2.5,
          rotationRad: ent.rotation || ent._rotation || 0,
          widthFactor: ent.widthFactor || ent._widthFactor || 1,
          obliqueRad: ent.oblique || ent._oblique || 0,
          styleName: ent.styleName || ent._styleName || "STANDARD",
          horizontalMode: typeof ent.halign === "number" ? ent.halign : (typeof ent.horizontalMode === "number" ? ent.horizontalMode : (typeof ent._horizontalJustification === "number" ? ent._horizontalJustification : undefined)),
          verticalMode: typeof ent.valign === "number" ? ent.valign : (typeof ent.verticalMode === "number" ? ent.verticalMode : (typeof ent._verticalJustification === "number" ? ent._verticalJustification : undefined)),
          isInvisible: Boolean(flags & 1 || ent.isInvisible),
          isConstant: Boolean(flags & 2 || ent.isConstant),
        };
      }

      case "ATTRIB": {
        const pos = ent.position || ent._position || ent.insertionPoint || { x: 0, y: 0 };
        const align = ent.alignmentPoint || ent.secondAlignmentPoint || ent.secondPosition || ent._alignmentPoint;
        const flags = typeof ent.flags === "number" ? ent.flags : (typeof ent._flags === "number" ? ent._flags : 0);
        return {
          ...base,
          type: "ATTRIB",
          tag: ent.tag || ent._tag || ent.name || "",
          text: ent.textString || ent._textString || ent.text || "",
          insertionPoint: [pos.x || 0, pos.y || 0],
          alignmentPoint: align ? [align.x || 0, align.y || 0] : undefined,
          height: ent.height || ent._height || 2.5,
          rotationRad: ent.rotation || ent._rotation || 0,
          widthFactor: ent.widthFactor || ent._widthFactor || 1,
          obliqueRad: ent.oblique || ent._oblique || 0,
          styleName: ent.styleName || ent._styleName || "STANDARD",
          horizontalMode: typeof ent.halign === "number" ? ent.halign : (typeof ent.horizontalMode === "number" ? ent.horizontalMode : (typeof ent._horizontalJustification === "number" ? ent._horizontalJustification : undefined)),
          verticalMode: typeof ent.valign === "number" ? ent.valign : (typeof ent.verticalMode === "number" ? ent.verticalMode : (typeof ent._verticalJustification === "number" ? ent._verticalJustification : undefined)),
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
          text: ent.text || ent.annotationText || ent.textString || undefined,
          annotationType: typeof ent.annotationType === "number" ? ent.annotationType : undefined,
          annotatedEntityHandle: ent.annotatedEntityHandle || ent.annotationHandle || undefined,
        };
      }

      default:
        break;
    }
    return null;
  }

  // 3. Model Space varlıklarını çözümle
  const modelEntities: CadEntity[] = [];
  let currentOrder = BigInt(1);

  try {
    const modelSpace = db.tables?.blockTable?.modelSpace;
    if (modelSpace) {
      const rawEntities: any[] = modelSpace.newIterator ? (modelSpace.newIterator().toArray() as any[]) : [];
      for (const item of rawEntities) {
        const ent = typeof item === "string" ? (db.openEntityForRead(item) as any) : item;
        if (!ent) continue;
        const converted = convertDxfEntity(ent, currentOrder++);
        if (converted) {
          applyDxfXclip(ent, converted);
          modelEntities.push(converted);
        }
      }
    }
  } catch (err) {
    console.warn("[DxfAdapter] ModelSpace varlıkları okunurken uyarı:", err);
  }

  // 4. Layout (Pafta) tablosunu çözümle
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

  // LAYOUT kayıtları Object Table'dadır (`db.objects.layout`), symbols/tables altında değil.
  const layoutTable = (db as any).objects?.layout || (db.tables as unknown as { layoutTable?: any } | undefined)?.layoutTable;
  if (layoutTable) {
    try {
      const lt = layoutTable;
      const records = lt.newIterator ? lt.newIterator().toArray() : [];
      for (let lIdx = 0; lIdx < records.length; lIdx++) {
        const rec = records[lIdx];
        const name = rec.layoutName || rec.name || `Layout${lIdx + 1}`;
        const blockTable = db.tables?.blockTable as any;
        const blockRecord = rec.blockTableRecordId && blockTable?.getIdAt ? blockTable.getIdAt(rec.blockTableRecordId) : undefined;
        const isModel = rec.isModelSpace != null ? Boolean(rec.isModelSpace) : (name === "Model" || blockRecord?.name === "*Model_Space");
        const id = isModel ? "Model" : name;
        const bName = blockRecord?.name || rec.blockRecordName || (isModel ? "*Model_Space" : (name === "Model" ? "*Model_Space" : `*Paper_Space${lIdx > 1 ? lIdx - 1 : ""}`));

        let bbox: CadBBox2D = [0, 0, 1000, 1000];
        const min = rec.extents?.min || rec.limmin || rec.limits?.min;
        const max = rec.extents?.max || rec.limmax || rec.limits?.max;
        if (min && max && [min.x, min.y, max.x, max.y].every(Number.isFinite) && max.x > min.x && max.y > min.y) {
          bbox = [min.x, min.y, max.x, max.y];
        }

        layouts[id] = {
          id,
          name,
          isModelSpace: isModel,
          bbox,
          blockRecordName: bName,
          tabOrder: typeof rec.tabOrder === "number" ? rec.tabOrder : lIdx,
          viewportIds: [],
        };
      }
    } catch (err) {
      console.warn("[DxfAdapter] Layout tablosu okunurken uyarı:", err);
    }
  }

  // 5. Blok tanımlarını çözümle (ModelSpace ve PaperSpace ayrımıyla)
  const blocks: Record<string, CadBlockDefinition> = {};
  if (db.tables?.blockTable) {
    try {
      const bt = db.tables.blockTable as any;
      const records = bt.newIterator ? bt.newIterator().toArray() : [];
      for (const rec of records) {
        const name = rec.name;
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

        const rawEntities: any[] = rec.newIterator ? (rec.newIterator().toArray() as any[]) : [];
        const bEntities: CadEntity[] = [];
        for (const item of rawEntities) {
          const ent = typeof item === "string" ? (db.openEntityForRead(item) as any) : item;
          if (!ent) continue;

          const entType = (ent.dxfTypeName || ent.type || "").toUpperCase();
          if (entType === "VIEWPORT") {
            // A viewport outside a paper-space block is not a layout projection.
            // DXF group 69 value 1 is AutoCAD's system-defined paper viewport.
            if (!isPaperBlock) continue;
            const viewportNumber = typeof ent.number === "number" ? ent.number
              : typeof ent.viewportId === "number" ? ent.viewportId : undefined;
            if (viewportNumber === 1) continue;
            const order = currentOrder++;
            const vpCenter = ent.centerPoint || ent.center || ent.insertionPoint || { x: 0, y: 0 };
            const displayCenter = ent.viewCenter || { x: 0, y: 0 };
            const twistAngleRad = ent.viewTwistAngle ?? ent.twistAngleRad ?? ent.twistAngle ?? 0;
            const target = ent.viewTarget || ent.target;
            const cosTwist = Math.cos(twistAngleRad);
            const sinTwist = Math.sin(twistAngleRad);
            const vpViewCenter = target
              ? { x: (target.x || 0) + (displayCenter.x || 0) * cosTwist - (displayCenter.y || 0) * sinTwist, y: (target.y || 0) + (displayCenter.x || 0) * sinTwist + (displayCenter.y || 0) * cosTwist }
              : displayCenter;
            const vpId = ent.handle ? String(ent.handle) : `vp_${order}`;
            const frozenLayerIds: string[] = ent.frozenLayers || ent.frozenLayerNames || [];
            const frozenLayerNames = Array.isArray(ent.frozenLayerIds)
              ? ent.frozenLayerIds.map((layerId: string) => (db as any).openObjectForRead?.(layerId)?.name || layerId)
              : frozenLayerIds;
            const clipBoundaryObjectId = ent.clippingBoundaryId ? String(ent.clippingBoundaryId) : undefined;
            if (clipBoundaryObjectId && !Array.isArray(ent.clipPolygon)) {
              diagnostics.push({ id: `diag_vp_clip_${vpId}`, code: "UNRESOLVED_VIEWPORT_CLIP_BOUNDARY", severity: "warning", message: "Viewport clipping boundary object is not exposed by the DXF decoder; viewport projection is withheld.", entityHandle: vpId });
            }

            const vp: CadViewport = {
              id: vpId,
              layoutId: matchedLayoutId,
              viewportNumber,
              order,
              center: [vpCenter.x || 0, vpCenter.y || 0],
              width: typeof ent.width === "number" && ent.width > 0 ? ent.width : 200,
              height: typeof ent.height === "number" && ent.height > 0 ? ent.height : 150,
              viewCenter: [vpViewCenter.x || 0, vpViewCenter.y || 0],
              viewDirection: ent.viewDirection ? [ent.viewDirection.x || 0, ent.viewDirection.y || 0, ent.viewDirection.z ?? 1] : undefined,
              perspective: Boolean((ent.statusBitFlags || 0) & 1),
              viewHeight: typeof ent.viewHeight === "number" && ent.viewHeight > 0 ? ent.viewHeight : 100,
              twistAngleRad,
              frozenLayers: frozenLayerNames,
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

          const converted = convertDxfEntity(ent, currentOrder++);
          if (converted) {
            applyDxfXclip(ent, converted);
            bEntities.push(converted);
          }
        }

        if (isPaperBlock) {
          paperSpaceEntities[matchedLayoutId] = (paperSpaceEntities[matchedLayoutId] || []).concat(bEntities);
        } else {
          blocks[name] = {
            name,
            basePoint: [rec.origin?.x || 0, rec.origin?.y || 0],
            entities: bEntities,
            isXref: Boolean(rec.isXref || ((rec.flags || 0) & 4) !== 0),
            xrefPath: typeof rec.pathName === "string" && rec.pathName.length > 0 ? rec.pathName : undefined,
          };
        }
      }
    } catch (err) {
      console.warn("[DxfAdapter] Blok tablosu okunurken uyarı:", err);
    }
  }

  const doc: CadCanonicalDocument = {
    sourceVersionKey: options.sourceVersionKey || "dxf-v1",
    sourceSha256: options.sourceSha256 || "",
    acadVersion: db.version ? String(db.version) : "AC1021",
    codepage: "ANSI_1254",
    units: typeof db.insunits === "number" ? db.insunits : 0,
    measurement: typeof db.measurement === "number" ? db.measurement : 1,
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
      rawHeaderInsunits: typeof db.insunits === "number" ? db.insunits : undefined,
      rawEntitiesCount: modelEntities.length,
      rawTableCounts: {
        blocks: Object.keys(blocks).length,
        layers: Object.keys(layers).length,
      },
    },
  };

  try {
    if (typeof (db as any).clear === "function") {
      (db as any).clear();
    }
    if (typeof acdbAssignWorkingDatabase === "function") {
      acdbAssignWorkingDatabase(null as any);
    }
  } catch {
    // Toleranslı temizleme
  }

  return doc;
}
