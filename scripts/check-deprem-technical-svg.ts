import { createHash } from "node:crypto";
import { getDepremVisualSpec } from "../src/lib/deprem-visual-spec";
import { renderDepremTechnicalVisualSvg } from "../src/lib/deprem-technical-visual-router";
import {
  DEPREM_TECHNICAL_VISUAL_REGISTRY,
  DEPREM_TECHNICAL_VISUAL_STYLE,
} from "../src/lib/deprem-visual-rollout-registry";

const fail = (message: string) => {
  console.error(`FAIL — ${message}`);
  process.exitCode = 1;
};
const pass = (message: string) => console.log(`PASS — ${message}`);

const allowedColors = new Set(
  Object.values(DEPREM_TECHNICAL_VISUAL_STYLE).map((color) => color.toUpperCase()),
);
const forbiddenLegacyTokens = [
  "#B91C1C",
  "#F97316",
  "#C2410C",
  "SÜREÇ AKIŞI",
  "KARAR AKIŞI",
  "KARŞILAŞTIRMA",
  "SINIFLANDIRMA",
  "muhendislik-site",
];

const hashes = new Map<string, string>();
let renderedCount = 0;

for (const item of DEPREM_TECHNICAL_VISUAL_REGISTRY.filter((entry) => entry.status === "complete")) {
  const spec = getDepremVisualSpec(item.slug);
  if (!spec) {
    fail(`${item.slug}: deprem görsel spec bulunamadı`);
    continue;
  }

  const outputs = {
    cover: renderDepremTechnicalVisualSvg(spec, "cover"),
    diagram: renderDepremTechnicalVisualSvg(spec, "diagram"),
  };

  if (outputs.cover === outputs.diagram) fail(`${item.slug}: iki görsel aynı SVG çıktısını üretiyor`);

  for (const [asset, svg] of Object.entries(outputs)) {
    renderedCount += 1;
    const key = `${item.slug}/${asset}`;

    if (!svg.includes('viewBox="0 0 1200 675"')) fail(`${key}: 16:9 viewBox kontratı bozuk`);
    if (!svg.includes(DEPREM_TECHNICAL_VISUAL_STYLE.navy)) fail(`${key}: lacivert tasarım rengi eksik`);
    if (!svg.includes(DEPREM_TECHNICAL_VISUAL_STYLE.cyan)) fail(`${key}: cyan tasarım rengi eksik`);

    const colors = new Set((svg.match(/#[0-9a-fA-F]{6}/g) ?? []).map((color) => color.toUpperCase()));
    for (const color of colors) {
      if (!allowedColors.has(color)) fail(`${key}: izin verilmeyen renk bulundu: ${color}`);
    }

    const upper = svg.toUpperCase();
    for (const token of forbiddenLegacyTokens) {
      if (upper.includes(token.toUpperCase())) fail(`${key}: eski/generic görsel dili sızdı: ${token}`);
    }

    const visibleTextCount = (svg.match(/<text\b/g) ?? []).length;
    if (visibleTextCount > 8) fail(`${key}: görünür etiket sayısı fazla (${visibleTextCount} > 8)`);

    const hash = createHash("sha256").update(svg).digest("hex");
    const previous = hashes.get(hash);
    if (previous) fail(`${key}: duplicate SVG çıktısı (${previous} ile aynı)`);
    hashes.set(hash, key);
  }
}

if (renderedCount !== DEPREM_TECHNICAL_VISUAL_REGISTRY.filter((entry) => entry.status === "complete").length * 2) {
  fail("Tamamlanan her konu için tam iki teknik asset üretilemedi");
} else {
  pass(`${renderedCount} teknik SVG; renk, farklılık ve sadelik kapısından geçti`);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("\nDEPREM TECHNICAL SVG QA: PASS");
