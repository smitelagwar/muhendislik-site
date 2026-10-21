export interface DxfLinetypeScaleHeader {
  ltscale?: number;
  celtscale?: number;
  psltscale?: boolean;
  msltscale?: boolean;
  /** AutoCAD annotation-scale factor (paper units / drawing units) for the current model-space scale. */
  modelTabAnnotationScaleFactor?: number;
}

/** Read linetype HEADER values and the current model annotation scale from the DXF object dictionaries. */
export async function parseDxfLinetypeScaleHeader(input: Buffer | Uint8Array): Promise<DxfLinetypeScaleHeader> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const result: DxfLinetypeScaleHeader = {};
  const normalizeHandle = (value: unknown) => String(value).trim().toUpperCase();
  const dictionaryVariables = new Map<string, string>();
  const scalesByHandle = new Map<string, { name: string; paperUnits?: number; drawingUnits?: number }>();
  const scalesByName = new Map<string, Array<{ paperUnits?: number; drawingUnits?: number }>>();
  let section = "";
  let expectsSectionName = false;
  let variable = "";
  let currentObjectType = "";
  let currentObjectHandle = "";
  let currentDictionaryKey = "";
  let currentDictionaryAnnotationScaleHandle = "";
  let annotationScaleVariableHandle = "";
  let currentDictionaryVarValue = "";
  let currentScaleName = "";
  let currentScalePaperUnits: number | undefined;
  let currentScaleDrawingUnits: number | undefined;
  let headerAnnotationScaleName = "";

  const flushObject = () => {
    if (section === "OBJECTS") {
      if (currentObjectType === "DICTIONARY" && currentDictionaryAnnotationScaleHandle) {
        annotationScaleVariableHandle = currentDictionaryAnnotationScaleHandle;
      } else if (currentObjectType === "DICTIONARYVAR" && currentObjectHandle && currentDictionaryVarValue) {
        dictionaryVariables.set(normalizeHandle(currentObjectHandle), currentDictionaryVarValue.trim());
      } else if (currentObjectType === "SCALE" && currentObjectHandle && currentScaleName) {
        const record = { name: currentScaleName, paperUnits: currentScalePaperUnits, drawingUnits: currentScaleDrawingUnits };
        scalesByHandle.set(normalizeHandle(currentObjectHandle), record);
        const nameKey = currentScaleName.trim().toUpperCase();
        const named = scalesByName.get(nameKey) || [];
        named.push(record);
        scalesByName.set(nameKey, named);
      }
    }
    currentObjectType = "";
    currentObjectHandle = "";
    currentDictionaryKey = "";
    currentDictionaryAnnotationScaleHandle = "";
    currentDictionaryVarValue = "";
    currentScaleName = "";
    currentScalePaperUnits = undefined;
    currentScaleDrawingUnits = undefined;
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      const marker = String(pair.value).trim().toUpperCase();
      if (marker === "SECTION") {
        flushObject();
        expectsSectionName = true;
        variable = "";
      } else if (marker === "ENDSEC") {
        flushObject();
        section = "";
        variable = "";
      } else {
        flushObject();
        if (section === "OBJECTS") currentObjectType = marker;
        variable = "";
      }
      continue;
    }

    if (expectsSectionName && pair.code === 2) {
      section = String(pair.value).trim().toUpperCase();
      expectsSectionName = false;
      continue;
    }
    if (section === "OBJECTS") {
      if (pair.code === 5) currentObjectHandle = String(pair.value).trim();
      if (currentObjectType === "DICTIONARY") {
        if (pair.code === 3) currentDictionaryKey = String(pair.value).trim().toUpperCase();
        else if (currentDictionaryKey === "CANNOSCALE" && (pair.code === 350 || pair.code === 360)) {
          currentDictionaryAnnotationScaleHandle = String(pair.value).trim();
        }
      } else if (currentObjectType === "DICTIONARYVAR" && pair.code === 1) {
        currentDictionaryVarValue = String(pair.value).trim();
      } else if (currentObjectType === "SCALE") {
        const numericValue = Number(pair.value);
        if (pair.code === 300) currentScaleName = String(pair.value).trim();
        else if (pair.code === 140 && Number.isFinite(numericValue)) currentScalePaperUnits = numericValue;
        else if (pair.code === 141 && Number.isFinite(numericValue)) currentScaleDrawingUnits = numericValue;
      }
      continue;
    }
    if (section !== "HEADER") continue;
    if (pair.code === 9) {
      variable = String(pair.value).trim().toUpperCase();
      continue;
    }

    if (variable === "$CANNOSCALE" && pair.code === 1) {
      headerAnnotationScaleName = String(pair.value).trim();
      variable = "";
      continue;
    }

    const expectedCode = variable === "$LTSCALE" || variable === "$CELTSCALE" ? 40
      : variable === "$PSLTSCALE" || variable === "$MSLTSCALE" ? 70
      : undefined;
    if (!expectedCode || pair.code !== expectedCode) continue;

    const value = Number(pair.value);
    if (Number.isFinite(value)) {
      if (variable === "$LTSCALE" && value > 0) result.ltscale = value;
      else if (variable === "$CELTSCALE" && value > 0) result.celtscale = value;
      else if ((variable === "$PSLTSCALE" || variable === "$MSLTSCALE") && (value === 0 || value === 1)) {
        if (variable === "$PSLTSCALE") result.psltscale = value === 1;
        else result.msltscale = value === 1;
      }
    }
    variable = "";
  }

  flushObject();

  const resolvedAnnotationScaleName = (annotationScaleVariableHandle
    ? dictionaryVariables.get(normalizeHandle(annotationScaleVariableHandle))
    : undefined) || headerAnnotationScaleName;
  const referencedScale = annotationScaleVariableHandle
    ? scalesByHandle.get(normalizeHandle(annotationScaleVariableHandle))
    : undefined;
  const namedScales = resolvedAnnotationScaleName
    ? scalesByName.get(resolvedAnnotationScaleName.trim().toUpperCase())
    : undefined;
  const scale = referencedScale || (namedScales?.length === 1 ? namedScales[0] : undefined);
  if (scale?.paperUnits !== undefined && scale.paperUnits > 0 &&
      scale.drawingUnits !== undefined && scale.drawingUnits > 0) {
    const factor = scale.paperUnits / scale.drawingUnits;
    if (Number.isFinite(factor) && factor > 0) result.modelTabAnnotationScaleFactor = factor;
  }

  return result;
}
