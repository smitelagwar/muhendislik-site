/** Minimal Libredwg surface needed while the native DWG memory is still alive. */
export interface DwgLinetypeStyleRefApi {
  dwg_get_num_objects(data: number): number;
  dwg_get_object(data: number, index: number): number | null | undefined;
  dwg_object_get_fixedtype(object: number): number;
  dwg_object_to_object_tio(object: number): number | null | undefined;
  dwg_dynapi_entity_data<T>(object: number, field: string): T;
  dwg_ptr_to_ltype_dash_array(pointer: number, size: number): Array<{ style?: number }>;
  dwg_ref_get_id(reference: number): string | undefined;
}

export type DwgLinetypeStyleRefMap = Map<string, Map<number, string>>;

/**
 * Recover LTYPE dash STYLE handles before dwg_free. The installed converter
 * exposes dash style refs as wasm pointers but currently omits their IDs.
 */
export function readDwgLinetypeStyleRefs(
  api: DwgLinetypeStyleRefApi,
  data: number,
  linetypeFixedType: number,
  knownStyleHandles: ReadonlySet<string>,
): DwgLinetypeStyleRefMap {
  const references: DwgLinetypeStyleRefMap = new Map();
  const objectCount = api.dwg_get_num_objects(data);
  if (!Number.isInteger(objectCount) || objectCount < 0) return references;

  for (let objectIndex = 0; objectIndex < objectCount; objectIndex++) {
    const object = api.dwg_get_object(data, objectIndex);
    if (!object) continue;

    try {
      if (api.dwg_object_get_fixedtype(object) !== linetypeFixedType) continue;
      const tio = api.dwg_object_to_object_tio(object);
      if (!tio) continue;

      const nameValue = api.dwg_dynapi_entity_data<unknown>(tio, "name");
      const name = typeof nameValue === "string" ? nameValue.trim() : "";
      const dashCount = api.dwg_dynapi_entity_data<unknown>(tio, "numdashes");
      const dashPointer = api.dwg_dynapi_entity_data<unknown>(tio, "dashes");
      if (!name || typeof dashCount !== "number" || !Number.isInteger(dashCount) || dashCount <= 0
        || typeof dashPointer !== "number" || !Number.isFinite(dashPointer) || dashPointer <= 0) continue;

      const dashes = api.dwg_ptr_to_ltype_dash_array(dashPointer, dashCount);
      const perPatternIndex = new Map<number, string>();
      dashes.forEach((dash, patternIndex) => {
        const styleReference = dash?.style;
        if (typeof styleReference !== "number" || !Number.isFinite(styleReference) || styleReference <= 0) return;
        try {
          const styleHandle = api.dwg_ref_get_id(styleReference)?.trim().toUpperCase();
          if (styleHandle && /^[0-9A-F]+$/.test(styleHandle) && styleHandle !== "0"
            && knownStyleHandles.has(styleHandle)) {
            perPatternIndex.set(patternIndex, styleHandle);
          }
        } catch {
          // Invalid/unresolved refs stay absent; the existing glyph diagnostic remains authoritative.
        }
      });
      if (perPatternIndex.size > 0) references.set(name, perPatternIndex);
    } catch {
      // Keep conversion resilient to an unreadable optional table ref.
    }
  }

  return references;
}

/** Attach only resolved native refs, preserving fields already supplied by the converter. */
export function attachDwgLinetypeStyleRefs(
  records: unknown[],
  references: DwgLinetypeStyleRefMap,
): unknown[] {
  return records.map((value) => {
    if (!value || typeof value !== "object") return value;
    const record = value as Record<string, unknown>;
    const name = typeof record.name === "string" ? record.name.trim() : "";
    const byPatternIndex = references.get(name);
    if (!byPatternIndex || !Array.isArray(record.pattern)) return value;

    let changed = false;
    const pattern = record.pattern.map((rawElement, patternIndex) => {
      const handle = byPatternIndex.get(patternIndex);
      if (!handle) return rawElement;
      const element = typeof rawElement === "number"
        ? { elementLength: rawElement }
        : rawElement && typeof rawElement === "object"
          ? rawElement as Record<string, unknown>
          : undefined;
      if (!element) return rawElement;
      if (typeof element.styleObjectId === "string" && element.styleObjectId.trim()) return rawElement;
      changed = true;
      return { ...element, styleObjectId: handle };
    });

    return changed ? { ...record, pattern } : value;
  });
}
