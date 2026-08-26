import fs from "node:fs";
import path from "node:path";
import { getDepremVisualSpec } from "../src/lib/deprem-visual-spec";
import { renderDepremTechnicalVisualSvg } from "../src/lib/deprem-technical-visual-router";
import { DEPREM_TECHNICAL_VISUAL_REGISTRY } from "../src/lib/deprem-visual-rollout-registry";

const outputRoot = path.resolve(process.cwd(), "artifacts/deprem-technical-visuals");
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

let count = 0;
for (const item of DEPREM_TECHNICAL_VISUAL_REGISTRY.filter((entry) => entry.status === "complete")) {
  const spec = getDepremVisualSpec(item.slug);
  if (!spec) throw new Error(`Görsel spec bulunamadı: ${item.slug}`);

  const dir = path.join(outputRoot, item.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "cover.svg"), renderDepremTechnicalVisualSvg(spec, "cover"), "utf8");
  fs.writeFileSync(path.join(dir, "diagram.svg"), renderDepremTechnicalVisualSvg(spec, "diagram"), "utf8");
  count += 2;
}

console.log(`${count} teknik SVG artifact için üretildi: ${outputRoot}`);
