import type { CadDiagnostic, CadLinetype, CadLinetypeComplexElement } from "../canonical/types";

export interface CanonicalLinetypeTable {
  linetypes: Record<string, CadLinetype>;
  diagnostics: CadDiagnostic[];
}

/** Convert the table-record shapes exposed by the DXF and DWG libraries. */
export function mapLinetypeRecords(records: unknown[]): CanonicalLinetypeTable {
  const linetypes: Record<string, CadLinetype> = {};
  const diagnostics: CadDiagnostic[] = [];

  for (const value of records) {
    if (!value || typeof value !== "object") continue;
    const record = value as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    if (!name) continue;

    const rawPattern = Array.isArray(record.pattern) ? record.pattern : [];
    const pattern: number[] = [];
    const complexElements: CadLinetypeComplexElement[] = [];
    rawPattern.forEach((rawElement, patternIndex) => {
      const element = typeof rawElement === "number"
        ? { elementLength: rawElement }
        : rawElement && typeof rawElement === "object"
          ? rawElement as Record<string, unknown>
          : {};
      const rawLength = typeof element.elementLength === "number" ? element.elementLength : Number.NaN;
      if (!Number.isFinite(rawLength)) return;
      pattern.push(rawLength);

      const elementTypeFlag = typeof element.elementTypeFlag === "number" && Number.isFinite(element.elementTypeFlag)
        ? element.elementTypeFlag
        : 0;
      // LibreDwg includes zero-valued shape/text fields on ordinary dash records.
      // Do not promote those defaults to embedded glyphs or scene degradation.
      const complex = elementTypeFlag !== 0
        || (typeof element.shapeNumber === "number" && Number.isFinite(element.shapeNumber) && element.shapeNumber !== 0)
        || (typeof element.styleObjectId === "string" && element.styleObjectId.trim().length > 0)
        || (typeof element.text === "string" && element.text.length > 0);
      if (!complex) return;

      const numeric = (key: string) => typeof element[key] === "number" && Number.isFinite(element[key])
        ? element[key] as number
        : undefined;
      complexElements.push({
        patternIndex,
        elementTypeFlag,
        ...(numeric("shapeNumber") !== undefined ? { shapeNumber: numeric("shapeNumber") } : {}),
        ...(typeof element.styleObjectId === "string" ? { styleObjectId: element.styleObjectId } : {}),
        ...(numeric("scale") !== undefined ? { scale: numeric("scale") } : {}),
        ...(numeric("rotation") !== undefined ? { rotation: numeric("rotation") } : {}),
        ...(numeric("offsetX") !== undefined ? { offsetX: numeric("offsetX") } : {}),
        ...(numeric("offsetY") !== undefined ? { offsetY: numeric("offsetY") } : {}),
        ...(typeof element.text === "string" ? { text: element.text } : {}),
      });
    });

    const declaredLength = typeof record.totalPatternLength === "number"
      ? record.totalPatternLength
      : typeof record.patternLength === "number"
        ? record.patternLength
        : Number.NaN;
    const totalLength = Number.isFinite(declaredLength) && declaredLength >= 0
      ? declaredLength
      : pattern.reduce((sum, part) => sum + Math.abs(part), 0);
    const description = typeof record.description === "string"
      ? record.description
      : typeof record.comments === "string"
        ? record.comments
        : undefined;

    linetypes[name] = {
      id: name,
      name,
      ...(description !== undefined ? { description } : {}),
      pattern,
      totalLength,
      ...(complexElements.length > 0 ? { complexElements } : {}),
    };

  }

  return { linetypes, diagnostics };
}
