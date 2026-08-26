import fs from "node:fs";
import path from "node:path";
import { getDepremRolloutSpec } from "../src/lib/deprem-rollout";
import { renderDepremTechnicalVisualSvg } from "../src/lib/deprem-technical-visual";
import { DEPREM_TECHNICAL_VISUAL_ROLLOUT } from "../src/lib/deprem-visual-rollout";

const outputRoot = path.resolve(process.cwd(), "artifacts/deprem-technical-visuals");
fs.rmSync(outputRoot, { recursive: true, force: true });
fs.mkdirSync(outputRoot, { recursive: true });

let count = 0;
for (const item of DEPREM_TECHNICAL_VISUAL_ROLLOUT.filter((entry) => entry.status === "complete")) {
  const spec = getDepremRolloutSpec(item.slug);
  if (!spec) throw new Error(`Rollout spec bulunamadı: ${item.slug}`);

  const dir = path.join(outputRoot, item.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "cover.svg"), renderDepremTechnicalVisualSvg(spec, "cover"), "utf8");
  fs.writeFileSync(path.join(dir, "diagram.svg"), renderDepremTechnicalVisualSvg(spec, "diagram"), "utf8");
  count += 2;
}

console.log(`${count} teknik SVG artifact için üretildi: ${outputRoot}`);
