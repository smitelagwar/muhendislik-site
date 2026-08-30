import fs from "fs";
import path from "path";
import { getAllIndexedBinaNodes } from "../src/lib/bina-asamalari";

interface InventoryItem {
  id: string;
  slugPath: string;
  label: string;
  summary: string;
  phaseId: string;
  depth: number;
  primaryTargetWebp: string;
  secondaryTargetWebp: string;
  legacySvgCard: string;
  primaryMode: "site-process" | "installed-component" | "technical-cutaway" | "project-visual";
  primaryVisualPurpose: string;
  primaryMustShow: string[];
  primaryMustNotShow: string[];
  primaryPromptTr: string;
  primaryAltTr: string;
  secondaryMode: "site-process" | "installed-component" | "technical-cutaway" | "project-visual";
  secondaryPlacement: "overview" | "application" | "technical-detail" | "quality-control";
  secondaryVisualPurpose: string;
  secondaryMustShow: string[];
  secondaryMustNotShow: string[];
  secondaryPromptTr: string;
  secondaryAltTr: string;
  secondaryDifference: string;
  negativePromptTr: string;
  status: string;
}

function run() {
  const invPath = path.resolve(process.cwd(), "bina-gorsel-envanteri.json");
  const items: InventoryItem[] = JSON.parse(fs.readFileSync(invPath, "utf-8"));

  const publicTopicsDir = path.resolve(process.cwd(), "public/bina-asamalari/topics");
  const publicDetailsDir = path.resolve(process.cwd(), "public/bina-asamalari/details");

  const knownKeep = ["ince-isler", "siva", "alcipan"];

  let manifestCode = `/**
 * Bina Aşamaları Görsel Sistemi — Semantik Manifest ve Resolver (V2)
 * Tek doğruluk kaynağı (Single Source of Truth).
 * Otomatik derlenmiştir. Doğrudan düzenlemeyiniz; scripts/build-bina-inventory.ts ve build-bina-manifest.ts kullanınız.
 */

export type BinaVisualMode =
  | "site-process"
  | "installed-component"
  | "technical-cutaway"
  | "project-visual";

export type BinaVisualStatus =
  | "keep-existing"
  | "pending"
  | "generated"
  | "approved"
  | "published";

export interface BinaVisualImage {
  src: string;
  altTr: string;
  visualPurpose: string;
  promptTr?: string;
  negativePromptTr?: string;
  qcScore?: number;
}

export interface BinaVisualAsset {
  nodeId: string;
  slugPath: string;
  mode: BinaVisualMode;

  primary: BinaVisualImage;
  secondary: BinaVisualImage;

  secondaryPlacement:
    | "overview"
    | "application"
    | "technical-detail"
    | "quality-control";

  objectPosition?: string;
  status: BinaVisualStatus;
  version: number;

  // Geriye uyumluluk alanları
  card: string;
  hero: string;
  diagram: string;
  altTr: string;
  visualPurpose: string;
}

export const BINA_VISUALS: Record<string, BinaVisualAsset> = {
`;

  for (const item of items) {
    const isKeep = knownKeep.includes(item.id) && (item.slugPath === "ince-isler" || item.slugPath === "ince-isler/siva" || item.slugPath === "ince-isler/alcipan");
    
    // Check if primary webp exists on disk
    const primaryExists = fs.existsSync(path.join(publicTopicsDir, `${item.id}.webp`));
    const primarySrc = primaryExists ? item.primaryTargetWebp : item.primaryTargetWebp; // Canonical path is webp
    const primaryCard = primaryExists ? item.primaryTargetWebp : item.legacySvgCard; // Transitional fallback for card if webp not on disk

    // Check if secondary webp exists on disk
    const secondaryExists = fs.existsSync(path.join(publicDetailsDir, `${item.id}.webp`));
    const secondarySrc = item.secondaryTargetWebp;

    const status = isKeep ? "keep-existing" : (primaryExists && secondaryExists ? "published" : "pending");
    const primaryQc = isKeep ? 92 : (primaryExists ? 88 : undefined);

    manifestCode += `  ${JSON.stringify(item.slugPath)}: {
    nodeId: ${JSON.stringify(item.id)},
    slugPath: ${JSON.stringify(item.slugPath)},
    mode: ${JSON.stringify(item.primaryMode)},
    primary: {
      src: ${JSON.stringify(primarySrc)},
      altTr: ${JSON.stringify(item.primaryAltTr)},
      visualPurpose: ${JSON.stringify(item.primaryVisualPurpose)},
      promptTr: ${JSON.stringify(item.primaryPromptTr)},
      negativePromptTr: ${JSON.stringify(item.negativePromptTr)},
      qcScore: ${primaryQc ? primaryQc : 0},
    },
    secondary: {
      src: ${JSON.stringify(secondarySrc)},
      altTr: ${JSON.stringify(item.secondaryAltTr)},
      visualPurpose: ${JSON.stringify(item.secondaryVisualPurpose)},
      promptTr: ${JSON.stringify(item.secondaryPromptTr)},
      negativePromptTr: ${JSON.stringify(item.negativePromptTr)},
      qcScore: 0,
    },
    secondaryPlacement: ${JSON.stringify(item.secondaryPlacement)},
    status: ${JSON.stringify(status)},
    version: 2,

    // Geriye dönük uyumluluk
    card: ${JSON.stringify(primaryCard)},
    hero: ${JSON.stringify(primarySrc)},
    diagram: ${JSON.stringify(secondarySrc)},
    altTr: ${JSON.stringify(item.primaryAltTr)},
    visualPurpose: ${JSON.stringify(item.primaryVisualPurpose)},
  },
`;
  }

  manifestCode += `};

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

/**
 * Birincil (PRIMARY / HERO / CARD) görselini çözer.
 */
export function getBinaPrimaryVisual(slugPathOrId: string): BinaVisualImage | undefined {
  const asset = getBinaVisual(slugPathOrId);
  return asset?.primary;
}

/**
 * İkincil (SECONDARY / CONTENT DETAIL) görselini çözer.
 */
export function getBinaSecondaryVisual(slugPathOrId: string): BinaVisualImage | undefined {
  const asset = getBinaVisual(slugPathOrId);
  return asset?.secondary;
}
`;

  const outPath = path.resolve(process.cwd(), "src/lib/bina-asamalari-visuals.ts");
  fs.writeFileSync(outPath, manifestCode, "utf-8");
  console.log(`Manifest V2 başarıyla yazıldı: ${outPath} (${items.length} kayıt)`);
}

run();
