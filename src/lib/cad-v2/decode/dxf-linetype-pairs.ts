/** Read LTYPE elements directly because data-model 1.14.2 drops their extra fields. */
export async function parseDxfLinetypeRecords(input: Buffer | Uint8Array): Promise<Record<string, unknown>[]> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const records: Record<string, unknown>[] = [];
  let currentType = "";
  let name = "";
  let description: string | undefined;
  let totalLength = 0;
  let pattern: Array<Record<string, unknown>> = [];
  let currentElement: Record<string, unknown> | undefined;

  const flush = () => {
    if (currentType === "LTYPE" && name) {
      records.push({ name, description, totalPatternLength: totalLength, pattern });
    }
    name = "";
    description = undefined;
    totalLength = 0;
    pattern = [];
    currentElement = undefined;
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      flush();
      currentType = String(pair.value).trim().toUpperCase();
      continue;
    }
    if (currentType !== "LTYPE") continue;
    const rawValue = String(pair.value);
    const value = rawValue.trim();
    if (pair.code === 2) name = value;
    else if (pair.code === 3) description = rawValue;
    else if (pair.code === 40) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) totalLength = parsed;
    } else if (pair.code === 49) {
      const parsed = Number(value);
      currentElement = { elementLength: parsed };
      pattern.push(currentElement);
    } else if (currentElement && pair.code === 74) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) currentElement.elementTypeFlag = parsed;
    } else if (currentElement && pair.code === 75) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) currentElement.shapeNumber = parsed;
    } else if (currentElement && pair.code === 340) currentElement.styleObjectId = value;
    else if (currentElement && pair.code === 46) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) currentElement.scale = parsed;
    } else if (currentElement && pair.code === 50) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) currentElement.rotation = parsed;
    } else if (currentElement && pair.code === 44) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) currentElement.offsetX = parsed;
    } else if (currentElement && pair.code === 45) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) currentElement.offsetY = parsed;
    } else if (currentElement && pair.code === 9) currentElement.text = rawValue;
  }
  flush();

  return records;
}
