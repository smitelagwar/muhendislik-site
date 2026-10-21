import type { CadAttribEntity, CadDiagnostic } from "../canonical/types";

export interface DwgInsertAttributeMapping {
  attributes: Record<string, string>;
  attributeEntities: CadAttribEntity[];
  diagnostics: CadDiagnostic[];
}

const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const point2 = (value: any): [number, number] | undefined =>
  value && finite(value.x) && finite(value.y) ? [value.x, value.y] : undefined;

/** Map the INSERT.attibs shape exposed by libredwg-web into instance-owned canonical text. */
export function mapDwgInsertAttributeInstances(insert: Record<string, any>, order: bigint): DwgInsertAttributeMapping {
  const attributes: Record<string, string> = {};
  const attributeEntities: CadAttribEntity[] = [];
  const diagnostics: CadDiagnostic[] = [];
  const ownerHandle = String(insert.handle ?? insert.objectId ?? "").trim() || undefined;

  if (insert.isVariableAttributes === true && !Array.isArray(insert.attribs)) {
    diagnostics.push({
      id: `diag_dwg_insert_attribs_unresolved_${ownerHandle || order}`,
      code: "UNRESOLVED_DWG_INSERT_ATTRIBUTES",
      severity: "warning",
      message: "DWG INSERT declares variable attributes, but the decoder did not expose its attached ATTRIB array.",
      entityHandle: ownerHandle,
    });
    return { attributes, attributeEntities, diagnostics };
  }

  const sourceAttributes = Array.isArray(insert.attribs) ? insert.attribs : [];
  sourceAttributes.forEach((rawAttribute: Record<string, any>, index: number) => {
    const textData = rawAttribute?.text && typeof rawAttribute.text === "object" ? rawAttribute.text : rawAttribute;
    const tag = String(rawAttribute?.tag ?? rawAttribute?.attrTag ?? rawAttribute?.name ?? "").trim();
    const text = String(textData?.text ?? rawAttribute?.textString ?? rawAttribute?.value ?? "");
    const sourceHandle = String(rawAttribute?.handle ?? "").trim() || undefined;
    if (tag) attributes[tag] = text;

    const insertionPoint = point2(textData?.startPoint ?? textData?.insertionPoint ?? rawAttribute?.startPoint);
    const alignmentPoint = point2(textData?.endPoint ?? textData?.alignmentPoint ?? rawAttribute?.alignmentPoint);
    const extrusion = textData?.extrusionDirection ?? rawAttribute?.extrusionDirection;
    const extrusionX = finite(extrusion?.x) ? extrusion.x : 0;
    const extrusionY = finite(extrusion?.y) ? extrusion.y : 0;
    const extrusionZ = finite(extrusion?.z) ? extrusion.z : 1;
    const flags = finite(rawAttribute?.flags) ? rawAttribute.flags : 0;
    const horizontalMode = finite(textData?.halign) ? textData.halign : undefined;
    const verticalMode = finite(textData?.valign) ? textData.valign : undefined;
    const unsupportedReasons: string[] = [];

    if (Math.abs(extrusionX) > 1e-9 || Math.abs(extrusionY) > 1e-9 || Math.abs(extrusionZ - 1) > 1e-9) {
      unsupportedReasons.push("ATTRIB uses a non-default extrusion direction");
    }
    if (!insertionPoint) unsupportedReasons.push("ATTRIB has no finite insertion point");
    if (((horizontalMode ?? 0) !== 0 || (verticalMode ?? 0) !== 0) && !alignmentPoint) {
      unsupportedReasons.push("justified ATTRIB has no finite alignment point");
    }
    if ((finite(rawAttribute?.mtextFlag) && (rawAttribute.mtextFlag & 2) !== 0)) {
      unsupportedReasons.push("multiline ATTRIB geometry requires MText layout");
    }

    if (!tag) {
      diagnostics.push({
        id: `diag_dwg_insert_attrib_tag_${sourceHandle || ownerHandle || order}_${index + 1}`,
        code: "UNRESOLVED_DWG_INSERT_ATTRIBUTES",
        severity: "warning",
        message: "DWG INSERT contains an attached ATTRIB without a usable tag; the instance value cannot be bound safely.",
        entityHandle: sourceHandle || ownerHandle,
      });
    }

    if (unsupportedReasons.length > 0) {
      diagnostics.push({
        id: `diag_dwg_attrib_geometry_${sourceHandle || ownerHandle || order}_${index + 1}`,
        code: "UNSUPPORTED_ATTRIBUTE_INSTANCE_GEOMETRY",
        severity: "warning",
        message: `DWG ATTRIB ${sourceHandle || tag || index + 1} was bound by tag/value, but its source placement could not be represented safely: ${unsupportedReasons.join("; ")}. The ATTDEF fallback is used.`,
        entityHandle: sourceHandle || ownerHandle,
      });
      return;
    }

    const rawColor = rawAttribute?.color;
    const colorIndex = rawAttribute?.colorIndex;
    const transparency = rawAttribute?.transparency;
    const alpha = finite(transparency)
      ? ((transparency & 0x02000000) !== 0 ? (transparency & 0xff) / 255 : transparency >= 0 && transparency <= 100 ? (100 - transparency) / 100 : undefined)
      : undefined;
    const color = finite(rawColor) && rawColor > 0
      ? { method: "rgb" as const, rgb: [(rawColor >> 16) & 255, (rawColor >> 8) & 255, rawColor & 255] as [number, number, number], aci: finite(colorIndex) ? colorIndex : undefined, alpha }
      : finite(colorIndex)
        ? { method: colorIndex === 256 ? "byLayer" as const : colorIndex === 0 ? "byBlock" as const : "aci" as const, aci: colorIndex, alpha }
        : alpha !== undefined ? { method: "byLayer" as const, alpha } : undefined;
    const rawLineweight = rawAttribute?.lineweight ?? rawAttribute?.lineweightMm;
    const lineweightMm = finite(rawLineweight)
      ? (rawLineweight >= 0 ? (rawLineweight > 10 ? rawLineweight / 100 : rawLineweight) : rawLineweight)
      : undefined;

    attributeEntities.push({
      handle: sourceHandle || `${ownerHandle || `INSERT_${order}`}:ATTRIB:${index + 1}`,
      type: "ATTRIB",
      layer: String(rawAttribute?.layer || "0"),
      visible: rawAttribute?.isVisible !== false && rawAttribute?.visible !== false && !rawAttribute?.off && !rawAttribute?.isInvisible,
      order,
      ...(color ? { color } : {}),
      ...(lineweightMm !== undefined ? { lineweightMm } : {}),
      ...(typeof rawAttribute?.lineType === "string" && rawAttribute.lineType ? { linetype: rawAttribute.lineType } : {}),
      ...(finite(rawAttribute?.lineTypeScale) ? { linetypeScale: rawAttribute.lineTypeScale } : {}),
      tag,
      text,
      insertionPoint: insertionPoint!,
      alignmentPoint,
      height: finite(textData?.textHeight) ? textData.textHeight : finite(textData?.height) ? textData.height : 2.5,
      rotationRad: finite(textData?.rotation) ? textData.rotation : 0,
      widthFactor: finite(textData?.xScale) ? textData.xScale : 1,
      obliqueRad: finite(textData?.obliqueAngle) ? textData.obliqueAngle : 0,
      styleName: String(textData?.styleName || textData?.style || "STANDARD"),
      horizontalMode,
      verticalMode,
      isInvisible: (flags & 1) !== 0,
      isConstant: (flags & 2) !== 0,
    });
  });

  return { attributes, attributeEntities, diagnostics };
}
