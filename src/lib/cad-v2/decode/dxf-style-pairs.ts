/** Read STYLE fields directly so DXF handles and source font filenames are retained. */
export async function parseDxfTextStyleRecords(input: Buffer | Uint8Array): Promise<Record<string, unknown>[]> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  const records: Record<string, unknown>[] = [];
  let currentType = "";
  let current: Record<string, unknown> | undefined;
  let inAcadXdata = false;

  const flush = () => {
    if (currentType === "STYLE" && current) records.push(current);
    current = undefined;
    inAcadXdata = false;
  };

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      flush();
      currentType = String(pair.value).trim().toUpperCase();
      if (currentType === "STYLE") current = {};
      continue;
    }
    if (!current) continue;
    const value = String(pair.value);
    const trimmed = value.trim();
    switch (pair.code) {
      case 2: current.name = trimmed; break;
      case 5: current.objectHandle = trimmed; break;
      case 70: current.standardFlag = Number(trimmed); break;
      case 40: current.height = Number(trimmed); break;
      case 41: current.widthFactor = Number(trimmed); break;
      case 50: current.obliqueAngleDeg = Number(trimmed); break;
      case 3: current.fontFileName = trimmed; break;
      case 4: current.bigFontFileName = trimmed; break;
      case 1001: inAcadXdata = trimmed.toUpperCase() === "ACAD"; break;
      case 1000:
        if (inAcadXdata && trimmed && !current.fontFileName) current.extendedFont = trimmed;
        break;
      default: break;
    }
  }
  flush();
  return records;
}
