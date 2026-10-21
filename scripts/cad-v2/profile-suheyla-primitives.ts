import * as fs from "node:fs";
import { parseDwgToCanonical } from "../../src/lib/cad-v2/decode/dwg-adapter";
import { GeometryCompiler } from "../../src/lib/cad-v2/compile/geometry-compiler";
import { FontLayoutEngine } from "../../src/lib/cad-v2/text/font-layout-engine";

async function main() {
  const buf = fs.readFileSync("C:/Users/hsyn/Desktop/SÜHEYLA KARA STATİK (HAFİF) - Kopya.dwg");
  const doc = await parseDwgToCanonical(buf, { sourceVersionKey: "suheyla_1" });
  
  let lwPolySegments = 0;
  let lwPolyThickTriangles = 0;
  let hatchTriangles = 0;
  let hatchBoundaryLines = 0;
  let circleSegments = 0;
  let arcSegments = 0;
  let textSegments = 0;
  
  console.log("Measuring primitive counts...");
  for (const ent of doc.modelSpaceEntities) {
    if (ent.type === "LWPOLYLINE") {
      const exp = GeometryCompiler.expandLwPolyline(ent, 512, 0.25);
      lwPolySegments += exp.lineSegments.length;
      if (exp.thickTriangles) lwPolyThickTriangles += exp.thickTriangles.vertices.length / 2;
    } else if (ent.type === "HATCH") {
      const h = GeometryCompiler.triangulateHatch(ent, 512, 0.25);
      if (h.mesh) hatchTriangles += h.mesh.vertices.length / 2;
      hatchBoundaryLines += h.boundaryLines.length;
    } else if (ent.type === "CIRCLE") {
      const c = GeometryCompiler.tessellateArcWithBudget(ent.center, ent.radius, 0, Math.PI * 2, false, 0.25, 512);
      circleSegments += c.points.length - 1;
    } else if (ent.type === "ARC") {
      const a = GeometryCompiler.tessellateArcWithBudget(ent.center, ent.radius, ent.startAngleRad, ent.endAngleRad, ent.isClockwise, 0.25, 512);
      arcSegments += a.points.length - 1;
    } else if (ent.type === "TEXT") {
      const t = FontLayoutEngine.layoutText(ent, { textStyles: doc.textStyles, diagnostics: [] });
      textSegments += t.length;
    }
  }

  console.log("Text styles:", doc.textStyles);
  const sampleTexts = doc.modelSpaceEntities.filter((e) => e.type === "TEXT");
  if (sampleTexts.length > 0) {
    console.log("Sample text entity:", sampleTexts[0]);
    const resFont = FontLayoutEngine.resolveFontStyle({
      styleName: sampleTexts[0].styleName,
      textStyles: doc.textStyles,
    });
    console.log("Resolved font for sample text:", {
      fontType: resFont.fontType,
      resolvedFontName: resFont.resolvedFontName,
      status: resFont.status,
      isSubstitute: resFont.isSubstitute,
      hasTtf: !!resFont.ttfFont,
      hasShx: !!resFont.shxFont,
    });
  }
  console.log("LWPOLYLINE segments:", lwPolySegments, "thick triangles:", lwPolyThickTriangles);
  console.log("HATCH triangles:", hatchTriangles, "boundary lines:", hatchBoundaryLines);
  console.log("CIRCLE segments:", circleSegments);
  console.log("ARC segments:", arcSegments);
  console.log("TEXT segments:", textSegments);
  const total = lwPolySegments + (lwPolyThickTriangles > 0 ? 1 : 0) + hatchTriangles + hatchBoundaryLines + circleSegments + arcSegments + textSegments;
  console.log("TOTAL PRIMITIVES ESTIMATE:", total);
}

main().catch(console.error);
