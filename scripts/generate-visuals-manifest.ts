import fs from "fs";
import path from "path";

const inventoryPath = path.resolve(process.cwd(), "bina-gorsel-envanteri.json");
const inventory = JSON.parse(fs.readFileSync(inventoryPath, "utf-8"));

let code = `/**
 * Bina Aşamaları Görsel Sistemi — Semantik Manifest ve Resolver
 * Tek doğruluk kaynağı (Single Source of Truth).
 */

export type BinaVisualMode =
  | "site-process"
  | "installed-component"
  | "technical-cutaway"
  | "project-visual";

export interface BinaVisualAsset {
  nodeId: string;
  slugPath: string;
  card: string;
  hero?: string;
  diagram?: string;
  altTr: string;
  visualPurpose: string;
  mode: BinaVisualMode;
  objectPosition?: string;
  version: number;
}

export const BINA_VISUALS: Record<string, BinaVisualAsset> = {
`;

for (const item of inventory) {
  // Check if WebP exists in public/bina-asamalari/topics/
  const webpPath = path.resolve(process.cwd(), `public/bina-asamalari/topics/${item.id}.webp`);
  const webpExists = fs.existsSync(webpPath);
  const cardPath = webpExists
    ? `/bina-asamalari/topics/${item.id}.webp`
    : `/bina-asamalari/topics/${item.id}.svg`;

  code += `  ${JSON.stringify(item.slugPath)}: {
    nodeId: ${JSON.stringify(item.id)},
    slugPath: ${JSON.stringify(item.slugPath)},
    card: ${JSON.stringify(cardPath)},
    altTr: ${JSON.stringify(item.altTr)},
    visualPurpose: ${JSON.stringify(item.visualPurpose)},
    mode: ${JSON.stringify(item.mode)},
    version: 1,
  },
`;
}

code += `};

/**
 * Slug path veya node ID üzerinden görsel varlığını çözer.
 */
export function getBinaVisual(slugPathOrId: string): BinaVisualAsset | undefined {
  if (BINA_VISUALS[slugPathOrId]) {
    return BINA_VISUALS[slugPathOrId];
  }

  // slugPath içindeki son segmenti veya ID'yi ara
  const id = slugPathOrId.split("/").pop() || slugPathOrId;
  for (const key in BINA_VISUALS) {
    if (BINA_VISUALS[key].nodeId === id) {
      return BINA_VISUALS[key];
    }
  }

  return undefined;
}
`;

const outPath = path.resolve(process.cwd(), "src/lib/bina-asamalari-visuals.ts");
fs.writeFileSync(outPath, code, "utf-8");
console.log(`Manifest dosyası oluşturuldu: ${outPath} (${inventory.length} kayıt)`);
