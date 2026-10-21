// ============================================================================
// DWG/DXF MOTOR V2 — DXF DECODE ADAPTER (@mlightcad/data-model 1.14.2)
// ============================================================================

import type { CadCanonicalDocument, CadColor, CadEntity, CadLayer, CadBlockDefinition, CadLayout, CadViewport, CadBBox2D, CadDiagnostic } from "../canonical/types";
import { parseDxfSplines, parseDxfXclips } from "./dxf-xclip-pairs";
import { parseDxfLinetypeRecords } from "./dxf-linetype-pairs";
import { parseDxfLinetypeScaleHeader } from "./dxf-linetype-scale-header";
import { parseDxfModelSpaceViewBounds } from "./dxf-model-space-view-bounds";
import { parseDxfTextStyleRecords } from "./dxf-style-pairs";
import { applyDxfAttributePairRecords, parseDxfAttributePairRecords } from "./dxf-attribute-pairs";
import { parseDxfDimensionOverridePairs } from "./dxf-dimension-override-pairs";
import { parseDxfExternalReferenceEntities, toDxfUnsupportedBlockCandidate } from "./dxf-external-reference-pairs";
import { getDxfRenderablePatternAngleDegrees, mapHatchPatternLines } from "./hatch-pattern-record";
import { mapLinetypeRecords } from "./linetype-record";
import { mapTextStyleRecords } from "./text-style-record";
import { CadDiagnosticCode, createReachableMInsertArrayDiagnostics, createReachableUnsupportedBlockDiagnostics, createUnsupportedEntityDiagnostic, type UnsupportedBlockEntityCandidate } from "../canonical/diagnostics";

export interface DxfParseOptions {
  sourceVersionKey?: string;
  sourceSha256?: string;
}

const DXF_BINARY_SENTINEL = Buffer.from("AutoCAD Binary DXF\r\n\x1a\0", "binary");
const DXF_BINARY_SECTION_RECORD = Buffer.from([0, 0, ...Buffer.from("SECTION\0", "binary")]);
const DXF_BINARY_EOF_RECORD = Buffer.from([0, 0, ...Buffer.from("EOF\0", "binary")]);
const DXF_CODEPAGE_DECODERS: Record<string, string> = {
  ANSI_874: "windows-874",
  ANSI_932: "shift_jis",
  ANSI_936: "gbk",
  ANSI_949: "euc-kr",
  ANSI_950: "big5",
  ANSI_1250: "windows-1250",
  ANSI_1251: "windows-1251",
  ANSI_1252: "windows-1252",
  ANSI_1253: "windows-1253",
  ANSI_1254: "windows-1254",
  ANSI_1255: "windows-1255",
  ANSI_1256: "windows-1256",
  ANSI_1257: "windows-1257",
  ANSI_1258: "windows-1258",
};

function readAsciiLine(bytes: Buffer, offset: number): { value: string; nextOffset: number } {
  const lineEnd = bytes.indexOf(0x0a, offset);
  const end = lineEnd < 0 ? bytes.length : lineEnd;
  const value = bytes.subarray(offset, end).toString("latin1").replace(/\r$/, "");
  return { value, nextOffset: lineEnd < 0 ? bytes.length : lineEnd + 1 };
}

function readDeclaredDxfCodepage(bytes: Buffer): string | undefined {
  if (bytes.subarray(0, DXF_BINARY_SENTINEL.length).equals(DXF_BINARY_SENTINEL)) return undefined;
  let offset = bytes.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf])) ? 3 : 0;
  while (offset < bytes.length) {
    const codeLine = readAsciiLine(bytes, offset);
    const valueLine = readAsciiLine(bytes, codeLine.nextOffset);
    offset = valueLine.nextOffset;
    if (codeLine.value.trim() === "9" && valueLine.value.trim().toUpperCase() === "$DWGCODEPAGE") {
      const valueCode = readAsciiLine(bytes, offset);
      const codepage = readAsciiLine(bytes, valueCode.nextOffset);
      if (valueCode.value.trim() === "3" || valueCode.value.trim() === "1") return codepage.value.trim().toUpperCase() || undefined;
      return undefined;
    }
    if (codeLine.value.trim() === "0" && valueLine.value.trim().toUpperCase() === "ENDSEC") break;
  }
  return undefined;
}

function decodeDeclaredDxfCodepage(bytes: Buffer, codepage: string): Buffer {
  if (codepage === "UTF-8" || bytes.subarray(0, DXF_BINARY_SENTINEL.length).equals(DXF_BINARY_SENTINEL)) return bytes;
  const decoderLabel = DXF_CODEPAGE_DECODERS[codepage];
  if (!decoderLabel) return bytes;
  try {
    return Buffer.from(new TextDecoder(decoderLabel).decode(bytes), "utf8");
  } catch {
    return bytes;
  }
}

export function normalizeDxfSourceEncoding(input: Buffer | Uint8Array): {
  bytes: Buffer;
  codepage: string;
  unsupportedNonAsciiCodepage: boolean;
} {
  const sourceBytes = Buffer.from(input.buffer, input.byteOffset, input.byteLength);
  const declaredCodepage = readDeclaredDxfCodepage(sourceBytes);
  const codepage = declaredCodepage || "ANSI_1254";
  return {
    bytes: declaredCodepage ? decodeDeclaredDxfCodepage(sourceBytes, declaredCodepage) : sourceBytes,
    codepage,
    unsupportedNonAsciiCodepage: Boolean(declaredCodepage
      && declaredCodepage !== "UTF-8"
      && !DXF_CODEPAGE_DECODERS[declaredCodepage]
      && sourceBytes.some((byte) => byte > 0x7f)),
  };
}

function assertDxfContainerStructure(bytes: Uint8Array) {
  if (bytes.byteLength === 0) throw new Error("DXF input invalid: empty source");
  const sourceBytes = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (sourceBytes.subarray(0, DXF_BINARY_SENTINEL.length).equals(DXF_BINARY_SENTINEL)) {
    if (!sourceBytes.includes(DXF_BINARY_SECTION_RECORD)) throw new Error("DXF input invalid: binary source has no SECTION record");
    if (!sourceBytes.subarray(DXF_BINARY_SENTINEL.length).subarray(-DXF_BINARY_EOF_RECORD.length).equals(DXF_BINARY_EOF_RECORD)) {
      throw new Error("DXF input incomplete: binary EOF record is missing or truncated");
    }
    return;
  }

  const text = sourceBytes.toString("utf8").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = text.split("\n");
  while (lines.length > 0 && lines[lines.length - 1]?.trim() === "") lines.pop();
  if (lines.length < 4 || lines.length % 2 !== 0) throw new Error("DXF input incomplete: ASCII group-code/value pairs are truncated");

  const structuralRecords: Array<{ code: number; value: string }> = [];
  for (let index = 0; index < lines.length; index += 2) {
    const codeText = lines[index]?.trim() ?? "";
    if (!/^[+-]?\d+$/.test(codeText)) throw new Error(`DXF input invalid: malformed group code at line ${index + 1}`);
    const code = Number(codeText);
    const value = lines[index + 1];
    if (!Number.isSafeInteger(code) || value == null) throw new Error(`DXF input incomplete: malformed group pair at line ${index + 1}`);
    if (code === 0) structuralRecords.push({ code, value: value.trim().toUpperCase() });
  }

  let openSections = 0;
  let hasSection = false;
  let hasEof = false;
  for (const record of structuralRecords) {
    if (record.value === "SECTION") {
      hasSection = true;
      openSections += 1;
    } else if (record.value === "ENDSEC") {
      openSections -= 1;
      if (openSections < 0) throw new Error("DXF input invalid: ENDSEC has no matching SECTION");
    } else if (record.value === "EOF") {
      hasEof = true;
      if (openSections !== 0 || record !== structuralRecords[structuralRecords.length - 1]) {
        throw new Error("DXF input invalid: EOF is not the final record after all sections");
      }
    }
  }
  if (!hasSection || openSections !== 0 || !hasEof) throw new Error("DXF input incomplete: expected balanced SECTION/ENDSEC records and a final EOF");
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

  const sourceBytes = Buffer.from(dxfBuffer.buffer, dxfBuffer.byteOffset, dxfBuffer.byteLength);
  assertDxfContainerStructure(sourceBytes);
  const normalizedSource = normalizeDxfSourceEncoding(sourceBytes);
  const inputBytes = normalizedSource.bytes;
  const sourceCodepage = normalizedSource.codepage;

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
  const u8Data = inputBytes;
  await converter.read(u8Data as unknown as ArrayBuffer, db);
  const dxfXclips = await parseDxfXclips(u8Data);
  const dxfSplines = await parseDxfSplines(u8Data);
  const rawLinetypeRecords = await parseDxfLinetypeRecords(u8Data);
  const rawTextStyleRecords = await parseDxfTextStyleRecords(u8Data);
  const linetypeScaleHeader = await parseDxfLinetypeScaleHeader(u8Data);
  const modelSpaceViewBounds = await parseDxfModelSpaceViewBounds(u8Data);
  const dxfAttributePairRecords = await parseDxfAttributePairRecords(u8Data);
  const dxfExternalReferenceEntities = await parseDxfExternalReferenceEntities(u8Data);
  const dimensionOverridesByHandle = await parseDxfDimensionOverridePairs(u8Data);
  const matchedDimensionOverrideHandles = new Set<string>();

  // 1. Katmanları çözümle
  const layers: Record<string, CadLayer> = {};
  const diagnostics: CadDiagnostic[] = [];
  if (normalizedSource.unsupportedNonAsciiCodepage) {
    diagnostics.push({
      id: `diag_dxf_unsupported_codepage_${sourceCodepage.toLowerCase()}`,
      code: CadDiagnosticCode.UNSUPPORTED_DXF_CODEPAGE,
      severity: "warning",
      message: `DXF declares codepage ${sourceCodepage}, which this adapter cannot decode; non-ASCII text bytes may be inaccurate and the scene is degraded.`,
    });
  }
  if (dimensionOverridesByHandle.byHandle.has("")) {
    diagnostics.push({
      id: "diag_dxf_dimension_override_unbound",
      code: "UNRESOLVED_DIMENSION_ENTITY_OVERRIDE",
      severity: "warning",
      message: "A DXF DIMENSION has ACAD/DSTYLE XDATA without a source handle; its entity override was not assigned by order.",
    });
  }
  const dimensionPrecisionByStyle = new Map<string, number>();
  const dimensionUnitFormatCodeByStyle = new Map<string, number>();
  const dimensionUnitScaleByStyle = new Map<string, number>();
  const dimensionScaleByStyle = new Map<string, number>();
  const unsupportedDimensionScaleStyles = new Set<string>();
  const dimensionTickSizeByStyle = new Map<string, number>();
  const firstExtensionLineSuppressedByStyle = new Map<string, boolean>();
  const secondExtensionLineSuppressedByStyle = new Map<string, boolean>();
  const dimensionToleranceByStyle = new Map<string, {
    enabled: boolean;
    upper?: number;
    lower?: number;
    decimals?: number;
  }>();
  try {
    const dimStyleTable = db.tables?.dimStyleTable as any;
    const records = dimStyleTable?.newIterator
      ? dimStyleTable.newIterator().toArray()
      : (dimStyleTable?.records || []);
    for (const record of records) {
      const styleName = typeof record.name === "string" ? record.name.trim().toLowerCase() : "";
      const decimals = record.dimdec;
      const unitFormatCode = record.dimlunit ?? record.dimunit;
      const unitScale = record.dimlfac;
      const dimensionScaleValue = record.dimscale;
      const tickSize = record.dimtsz;
      const suppressFirstExtensionLine = record.dimse1;
      const suppressSecondExtensionLine = record.dimse2;
      const toleranceEnabled = record.dimtol === 1;
      const toleranceUpper = record.dimtp;
      const toleranceLower = record.dimtm;
      const toleranceDecimals = record.dimtdec;
      if (styleName) {
        dimensionToleranceByStyle.set(styleName, {
          enabled: toleranceEnabled,
          ...(typeof toleranceUpper === "number" ? { upper: toleranceUpper } : {}),
          ...(typeof toleranceLower === "number" ? { lower: toleranceLower } : {}),
          ...(typeof toleranceDecimals === "number" ? { decimals: toleranceDecimals } : {}),
        });
      }
      if (styleName && Number.isInteger(decimals) && decimals >= 0 && decimals <= 8) {
        dimensionPrecisionByStyle.set(styleName, decimals);
      }
      if (styleName && Number.isInteger(unitFormatCode)) {
        dimensionUnitFormatCodeByStyle.set(styleName, unitFormatCode);
      }
      if (styleName && typeof unitScale === "number" && Number.isFinite(unitScale)) {
        dimensionUnitScaleByStyle.set(styleName, unitScale);
      }
      if (styleName && typeof tickSize === "number" && Number.isFinite(tickSize) && tickSize >= 0) {
        dimensionTickSizeByStyle.set(styleName, tickSize);
      }
      if (styleName && typeof dimensionScaleValue === "number") {
        if (Number.isFinite(dimensionScaleValue) && dimensionScaleValue > 0) {
          dimensionScaleByStyle.set(styleName, dimensionScaleValue);
        } else {
          unsupportedDimensionScaleStyles.add(styleName);
        }
      }
      if (styleName && (suppressFirstExtensionLine === 0 || suppressFirstExtensionLine === 1)) {
        firstExtensionLineSuppressedByStyle.set(styleName, suppressFirstExtensionLine === 1);
      }
      if (styleName && (suppressSecondExtensionLine === 0 || suppressSecondExtensionLine === 1)) {
        secondExtensionLineSuppressedByStyle.set(styleName, suppressSecondExtensionLine === 1);
      }
    }
  } catch (err) {
    console.warn("[DxfAdapter] DIMSTYLE hassasiyet tablosu okunurken uyarı:", err);
  }
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

  const decodedLinetypeRecords: Array<Record<string, unknown>> = [];
  if (db.tables?.linetypeTable) {
    try {
      const linetypeTable = db.tables.linetypeTable as any;
      const records = linetypeTable.newIterator ? linetypeTable.newIterator().toArray() : (linetypeTable.records || []);
      for (const rec of records) {
        const style = rec.linetype || {};
        decodedLinetypeRecords.push({
          ...style,
          name: rec.name || style.name,
          description: style.description || rec.comments,
          totalPatternLength: style.totalPatternLength ?? rec.patternLength,
        });
      }
    } catch (err) {
      console.warn("[DxfAdapter] Linetype tablosu okunurken uyarı:", err);
    }
  }
  const linetypeResult = mapLinetypeRecords([...decodedLinetypeRecords, ...rawLinetypeRecords]);
  diagnostics.push(...linetypeResult.diagnostics);
  const textStyles = mapTextStyleRecords(rawTextStyleRecords);

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
        const sourceHandle = String(ent.handle ?? ent.objectId ?? "").trim().toUpperCase() || undefined;
        return {
          ...base,
          type: "INSERT",
          ...(sourceHandle ? { sourceHandle } : {}),
          blockName,
          insertionPoint: [pos.x || 0, pos.y || 0],
          scale: [
            ent.scaleFactors?.x ?? ent._scaleFactors?.x ?? 1,
            ent.scaleFactors?.y ?? ent._scaleFactors?.y ?? 1,
            ent.scaleFactors?.z ?? ent._scaleFactors?.z ?? 1,
          ],
          rotationRad: ent.rotation ?? ent._rotation ?? 0,
          columnCount: typeof ent.columnCount === "number" ? ent.columnCount : undefined,
          rowCount: typeof ent.rowCount === "number" ? ent.rowCount : undefined,
          columnSpacing: typeof ent.columnSpacing === "number" ? ent.columnSpacing : undefined,
          rowSpacing: typeof ent.rowSpacing === "number" ? ent.rowSpacing : undefined,
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
        const patternLines = mapHatchPatternLines(ent.definitionLines);
        const isSolidHatch = ent.solidFill === true || ent.solidFill === 1 ||
          (ent.solidFill == null && ent.isSolid !== false);
        return {
          ...base,
          type: "HATCH",
          patternName: ent.patternName || "SOLID",
          isSolid: isSolidHatch && ent.isSolid !== false,
          solidFill: isSolidHatch && ent.isSolid !== false,
          patternScale: ent.patternScale ?? 1,
          patternAngleDeg: getDxfRenderablePatternAngleDegrees(ent, patternLines?.length ?? 0),
          patternLines,
          patternDouble: Boolean(ent.patternDouble),
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
        const styleName = ent.styleName || ent.dimStyle || ent._styleName || "STANDARD";
        const styleKey = String(styleName).trim().toLowerCase();
        const sourceHandle = String(ent.handle ?? ent.objectId ?? "").trim().toUpperCase();
        const dimType = typeof ent.dimensionType === "number" ? ent.dimensionType : (typeof ent.dimType === "number" ? ent.dimType : (typeof ent._dimensionType === "number" ? ent._dimensionType : 0));
        const entityOverride = sourceHandle ? dimensionOverridesByHandle.byHandle.get(sourceHandle) : undefined;
        const rawGeometry = sourceHandle ? dimensionOverridesByHandle.geometryByHandle.get(sourceHandle) : undefined;
        const sourceGeometry = rawGeometry?.supported ? rawGeometry : undefined;
        if (rawGeometry && !sourceGeometry) {
          diagnostics.push({
            id: `diag_dxf_dimension_source_geometry_${sourceHandle}`,
            code: "UNRESOLVED_DIMENSION_SOURCE_GEOMETRY",
            severity: "warning",
            message: `DXF DIMENSION ${sourceHandle} has unsupported, incomplete or conflicting source geometry; synthesized coordinates may differ from source.`,
            entityHandle: sourceHandle,
          });
        }
        if (entityOverride) matchedDimensionOverrideHandles.add(sourceHandle);
        const overrideValue = (code: number, styleValue: number | undefined) => entityOverride?.values.get(code) ?? styleValue;
        const overrideDecimals = overrideValue(271, dimensionPrecisionByStyle.get(styleKey));
        const primaryUnitDecimals = overrideDecimals !== undefined && Number.isInteger(overrideDecimals) && overrideDecimals >= 0 && overrideDecimals <= 8
          ? overrideDecimals : dimensionPrecisionByStyle.get(styleKey);
        const primaryUnitFormatCode = overrideValue(277, dimensionUnitFormatCodeByStyle.get(styleKey));
        const primaryUnitFormat = primaryUnitFormatCode === 1 ? "scientific" : primaryUnitFormatCode === 2 ? "decimal" : undefined;
        const primaryUnitScaleValue = overrideValue(144, dimensionUnitScaleByStyle.get(styleKey));
        const primaryUnitScale = primaryUnitScaleValue !== undefined && primaryUnitScaleValue >= 0 ? primaryUnitScaleValue : undefined;
        const tickSize = overrideValue(142, dimensionTickSizeByStyle.get(styleKey));
        const sourceDimensionScale = overrideValue(40, typeof ent.dimScale === "number" ? ent.dimScale : dimensionScaleByStyle.get(styleKey));
        const dimensionScale = sourceDimensionScale !== undefined && Number.isFinite(sourceDimensionScale) && sourceDimensionScale > 0 ? sourceDimensionScale : undefined;
        const unsupportedDimensionScale = (entityOverride?.values.has(40) ? false : unsupportedDimensionScaleStyles.has(styleKey)) || (sourceDimensionScale !== undefined && (!Number.isFinite(sourceDimensionScale) || sourceDimensionScale <= 0));
        const firstSuppressionValue = overrideValue(75, Number(firstExtensionLineSuppressedByStyle.get(styleKey) ?? false));
        const secondSuppressionValue = overrideValue(76, Number(secondExtensionLineSuppressedByStyle.get(styleKey) ?? false));
        const suppressFirstExtensionLine = firstSuppressionValue === 1;
        const suppressSecondExtensionLine = secondSuppressionValue === 1;
        const toleranceStyle = dimensionToleranceByStyle.get(styleKey);
        const toleranceEnabled = overrideValue(71, toleranceStyle?.enabled ? 1 : 0) === 1;
        const toleranceUpper = overrideValue(47, toleranceStyle?.upper);
        const toleranceLower = overrideValue(48, toleranceStyle?.lower);
        const toleranceDecimals = overrideValue(272, toleranceStyle?.decimals);
        const symmetricTolerance = toleranceEnabled
          && typeof toleranceUpper === "number" && Number.isFinite(toleranceUpper) && toleranceUpper >= 0
          && toleranceUpper === toleranceLower
          && typeof toleranceDecimals === "number" && Number.isInteger(toleranceDecimals) && toleranceDecimals >= 0 && toleranceDecimals <= 8
          ? { value: toleranceUpper, decimals: toleranceDecimals }
          : undefined;
        const unsupportedDimensionTolerance = toleranceEnabled && !symmetricTolerance;
        const invalidOverride = entityOverride && ([
          [271, (value: number) => Number.isInteger(value) && value >= 0 && value <= 8],
          [277, (value: number) => value === 1 || value === 2],
          [144, (value: number) => value >= 0],
          [142, (value: number) => value >= 0],
          [75, (value: number) => value === 0 || value === 1],
          [76, (value: number) => value === 0 || value === 1],
          [40, (value: number) => value >= 0],
        ] as const).some(([code, valid]) => entityOverride.values.has(code) && !valid(entityOverride.values.get(code)!));
        if (entityOverride?.unsupported || invalidOverride) {
          diagnostics.push({
            id: `diag_dxf_dimension_override_${entityOverride.sourceHandle || sourceHandle}`,
            code: "UNSUPPORTED_DIMENSION_ENTITY_OVERRIDE",
            severity: "warning",
            message: `DXF DIMENSION ${sourceHandle} has malformed, unsupported or out-of-range ACAD/DSTYLE XDATA; synthesized style may differ from source.`,
            entityHandle: entityOverride.sourceHandle || sourceHandle,
          });
        }
        if (primaryUnitFormatCode !== undefined && primaryUnitFormat === undefined) {
          const diagnosticKey = String(ent.handle ?? orderVal).trim();
          diagnostics.push({
            id: `diag_dxf_dimension_unit_format_${diagnosticKey}`,
            code: "UNSUPPORTED_DIMENSION_UNIT_FORMAT",
            severity: "warning",
            message: `DXF DIMENSION uses unsupported primary DIMLUNIT=${primaryUnitFormatCode}; synthesized numeric label formatting is not source-equivalent.`,
            entityHandle: typeof ent.handle === "string" ? ent.handle : undefined,
          });
        }

        if (unsupportedDimensionScale) {
          const diagnosticKey = String(ent.handle ?? orderVal).trim();
          diagnostics.push({
            id: `diag_dxf_dimension_annotative_scale_${diagnosticKey}`,
            code: CadDiagnosticCode.UNSUPPORTED_DIMENSION_ANNOTATIVE_SCALE,
            severity: "warning",
            message: `DXF DIMENSION style ${styleName} has a zero or invalid DIMSCALE; annotative scale contexts are not resolved for synthesized dimensions.`,
            entityHandle: typeof ent.handle === "string" ? ent.handle : undefined,
          });
        }
        if (primaryUnitScaleValue !== undefined && primaryUnitScaleValue < 0) {
          const diagnosticKey = String(ent.handle ?? orderVal).trim();
          diagnostics.push({
            id: `diag_dxf_dimension_unit_scale_${diagnosticKey}`,
            code: "UNSUPPORTED_DIMENSION_UNIT_SCALE",
            severity: "warning",
            message: `DXF DIMENSION uses negative DIMLFAC=${primaryUnitScaleValue}; paper-space-only scale semantics are unsupported for synthesized labels.`,
            entityHandle: typeof ent.handle === "string" ? ent.handle : undefined,
          });
        }
        if (unsupportedDimensionTolerance) {
          const diagnosticKey = sourceHandle || String(orderVal).trim();
          diagnostics.push({
            id: `diag_dxf_dimension_tolerance_${diagnosticKey}`,
            code: CadDiagnosticCode.UNSUPPORTED_DIMENSION_TOLERANCE,
            severity: "warning",
            message: `DXF DIMENSION style ${styleName} enables DIMTOL but its DIMTP/DIMTM/DIMTDEC values are outside the supported symmetric tolerance profile.`,
            entityHandle: sourceHandle || undefined,
          });
        }
        const textPt = ent.textPoint || ent.textMidpoint || ent._textPoint;
        const l1s = ent.line1Start || ent.definitionPoint2 || ent._definitionPoint2;
        const l1e = ent.line1End || ent.definitionPoint3 || ent._definitionPoint3;
        const l2s = ent.line2Start || ent.definitionPoint4;
        const l2e = ent.line2End;
        return {
          ...base,
          handle: sourceHandle || base.handle,
          type: "DIMENSION",
          dimType: sourceGeometry?.dimType ?? dimType,
          text: ent.text || ent.textString || ent._textString || "",
          styleName,
          defPoint: sourceGeometry?.defPoint ?? [def.x || 0, def.y || 0],
          textMidpoint: textPt ? [textPt.x || 0, textPt.y || 0] : undefined,
          line1Start: sourceGeometry?.line1Start ?? (l1s ? [l1s.x || 0, l1s.y || 0] : undefined),
          line1End: sourceGeometry?.line1End ?? (l1e ? [l1e.x || 0, l1e.y || 0] : undefined),
          line2Start: l2s ? [l2s.x || 0, l2s.y || 0] : undefined,
          line2End: l2e ? [l2e.x || 0, l2e.y || 0] : undefined,
          anonymousBlockName: blockName,
          insertionPoint: [pos.x || 0, pos.y || 0],
          rotationRad: sourceGeometry?.rotationRad ?? (typeof ent.rotation === "number" ? ent.rotation : (typeof ent._rotation === "number" ? ent._rotation : 0)),
          scale: [1, 1, 1],
          measurement: typeof ent.actualMeasurement === "number" ? ent.actualMeasurement : (typeof ent.measurement === "number" ? ent.measurement : undefined),
          dimScale: dimensionScale,
          arrowSize: typeof ent.arrowSize === "number" ? ent.arrowSize : undefined,
          ...(primaryUnitDecimals !== undefined ? { primaryUnitDecimals } : {}),
          ...(primaryUnitFormat !== undefined ? { primaryUnitFormat } : {}),
          ...(primaryUnitScale !== undefined && primaryUnitScale !== 1 ? { primaryUnitScale } : {}),
          ...(tickSize !== undefined && tickSize > 0 ? { tickSize } : {}),
          ...(suppressFirstExtensionLine ? { suppressFirstExtensionLine: true } : {}),
          ...(suppressSecondExtensionLine ? { suppressSecondExtensionLine: true } : {}),
          ...(symmetricTolerance ? { symmetricTolerance } : {}),
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
        const sourceOrder = currentOrder++;
        const sourceType = String(ent.dxfTypeName || ent.type || ent.constructor?.name || "").trim().toUpperCase();
        const converted = convertDxfEntity(ent, sourceOrder);
        if (converted) {
          applyDxfXclip(ent, converted);
          modelEntities.push(converted);
        } else if (sourceType !== "MLEADER" && sourceType !== "MULTILEADER") {
          diagnostics.push(createUnsupportedEntityDiagnostic(
            "DXF",
            sourceType,
            ent.handle != null ? String(ent.handle) : ent.objectId != null ? String(ent.objectId) : undefined,
            sourceOrder,
          ));
        }
      }
    }
  } catch (err) {
    console.warn("[DxfAdapter] ModelSpace varlıkları okunurken uyarı:", err);
  }
  for (const [rawHandle, override] of dimensionOverridesByHandle.byHandle) {
    if (!rawHandle || matchedDimensionOverrideHandles.has(rawHandle)) continue;
    diagnostics.push({
      id: `diag_dxf_dimension_override_unresolved_${rawHandle}`,
      code: "UNRESOLVED_DIMENSION_ENTITY_OVERRIDE",
      severity: "warning",
      message: `DXF DIMENSION ${rawHandle} has ACAD/DSTYLE XDATA, but the decoder did not retain a matching source handle; its override was not assigned by order.`,
      entityHandle: rawHandle,
    });
    if (override.unsupported) {
      diagnostics.push({
        id: `diag_dxf_dimension_override_unsupported_${rawHandle}`,
        code: "UNSUPPORTED_DIMENSION_ENTITY_OVERRIDE",
        severity: "warning",
        message: `DXF DIMENSION ${rawHandle} has malformed or unsupported ACAD/DSTYLE XDATA.`,
        entityHandle: rawHandle,
      });
    }
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
  const unsupportedBlockEntityCandidates: UnsupportedBlockEntityCandidate[] = [];
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

          const sourceOrder = currentOrder++;
          const converted = convertDxfEntity(ent, sourceOrder);
          if (converted) {
            applyDxfXclip(ent, converted);
            bEntities.push(converted);
          } else if (entType !== "MLEADER" && entType !== "MULTILEADER") {
            unsupportedBlockEntityCandidates.push({
              blockName: name,
              entityType: entType || "UNKNOWN",
              entityHandle: ent.handle != null ? String(ent.handle) : ent.objectId != null ? String(ent.objectId) : undefined,
              sourceOrder,
              isPaperSpace: isPaperBlock,
              visible: ent._visibility !== false && ent.visible !== false && !ent.isOff,
            });
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

  for (const externalEntity of dxfExternalReferenceEntities) {
    if (!externalEntity.visible) continue;
    if (externalEntity.section === "ENTITIES") {
      diagnostics.push(createUnsupportedEntityDiagnostic(
        "DXF",
        externalEntity.entityType,
        externalEntity.entityHandle,
        externalEntity.sourceOrder,
      ));
      continue;
    }
    const candidate = toDxfUnsupportedBlockCandidate(externalEntity);
    if (candidate) unsupportedBlockEntityCandidates.push(candidate);
  }

  diagnostics.push(...createReachableUnsupportedBlockDiagnostics(
    [modelEntities, ...Object.values(paperSpaceEntities)],
    blocks,
    unsupportedBlockEntityCandidates,
    "DXF",
  ));
  diagnostics.push(...createReachableMInsertArrayDiagnostics(
    [modelEntities, ...Object.values(paperSpaceEntities)],
    blocks,
    "DXF",
  ));

  applyDxfAttributePairRecords(modelEntities, blocks, dxfAttributePairRecords, diagnostics);

  const uniqueDiagnostics = [...new Map(diagnostics.map((diagnostic) => [diagnostic.id, diagnostic])).values()];

  const doc: CadCanonicalDocument = {
    sourceVersionKey: options.sourceVersionKey || "dxf-v1",
    sourceSha256: options.sourceSha256 || "",
    acadVersion: db.version ? String(db.version) : "AC1021",
    codepage: sourceCodepage,
    units: typeof db.insunits === "number" ? db.insunits : 0,
    measurement: typeof db.measurement === "number" ? db.measurement : 1,
    linetypeScaleSettings: {
      globalScale: linetypeScaleHeader.ltscale ?? (typeof db.ltscale === "number" && db.ltscale > 0 ? db.ltscale : 1),
      ...((linetypeScaleHeader.celtscale ?? (typeof db.celtscale === "number" ? db.celtscale : undefined)) !== undefined
        ? { currentEntityScale: linetypeScaleHeader.celtscale ?? db.celtscale }
        : {}),
      ...((linetypeScaleHeader.psltscale ?? (typeof db.psltscale === "boolean" ? db.psltscale : undefined)) !== undefined
        ? { paperSpaceViewportScaling: linetypeScaleHeader.psltscale ?? db.psltscale }
        : {}),
      ...(linetypeScaleHeader.msltscale !== undefined
        ? { modelTabAnnotationScaling: linetypeScaleHeader.msltscale }
        : {}),
      ...(linetypeScaleHeader.modelTabAnnotationScaleFactor !== undefined
        ? { modelTabAnnotationScaleFactor: linetypeScaleHeader.modelTabAnnotationScaleFactor }
        : {}),
    },
    layers,
    linetypes: linetypeResult.linetypes,
    textStyles,
    blocks,
    layouts,
    ...(modelSpaceViewBounds ? { modelSpaceViewBounds } : {}),
    viewports,
    modelSpaceEntities: modelEntities,
    paperSpaceEntities,
    diagnostics: uniqueDiagnostics,
    rawStats: {
      rawHeaderInsunits: typeof db.insunits === "number" ? db.insunits : undefined,
      rawEntitiesCount: modelEntities.length,
      rawTableCounts: {
        blocks: Object.keys(blocks).length,
        layers: Object.keys(layers).length,
        linetypes: Object.keys(linetypeResult.linetypes).length,
        textStyles: Object.keys(textStyles).length,
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
