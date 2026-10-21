import type { CadBBox2D } from "../canonical/types";
import { modelSpaceViewBoundsFromExtents } from "../canonical/model-space-view-bounds";

export async function parseDxfModelSpaceViewBounds(input: Buffer | Uint8Array): Promise<CadBBox2D | undefined> {
  const { acdbCreateDxfPairReader } = await import("@mlightcad/data-model");
  const reader = acdbCreateDxfPairReader(new Uint8Array(input));
  let section = "";
  let expectsSectionName = false;
  let variable = "";
  const min: { x?: number; y?: number } = {};
  const max: { x?: number; y?: number } = {};

  for (let pair = reader.next(); pair; pair = reader.next()) {
    if (pair.code === 0) {
      const marker = String(pair.value).trim().toUpperCase();
      if (marker === "SECTION") {
        expectsSectionName = true;
        variable = "";
      } else if (marker === "ENDSEC") {
        const endedSection = section;
        section = "";
        variable = "";
        if (endedSection === "HEADER") break;
      }
      continue;
    }

    if (expectsSectionName && pair.code === 2) {
      section = String(pair.value).trim().toUpperCase();
      expectsSectionName = false;
      continue;
    }
    if (section !== "HEADER") continue;
    if (pair.code === 9) {
      variable = String(pair.value).trim().toUpperCase();
      continue;
    }

    const coordinate = Number(pair.value);
    if (!Number.isFinite(coordinate)) continue;
    const target = variable === "$EXTMIN" ? min : variable === "$EXTMAX" ? max : undefined;
    if (!target) continue;
    if (pair.code === 10) target.x = coordinate;
    else if (pair.code === 20) target.y = coordinate;
  }

  return modelSpaceViewBoundsFromExtents(min, max);
}
