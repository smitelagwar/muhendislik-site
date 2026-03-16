import { getAllIndexedBinaNodes, getIndexedBinaNodeBySlugParts, getIndexedBinaNodeBySlugPath } from "../bina-asamalari";
import {
  buildGuideMap,
  getBinaGuideBreadcrumbs,
  PUBLISHED_AT_ISO,
  resolveGuideByPathOrAlias,
  toBinaGuideArticle,
} from "./builders";
import { buildFallbackGuide } from "./fallback";
import { inceIslerSpecs } from "./pages/ince-isler";
import { kabaInsaatSpecs } from "./pages/kaba-insaat";
import { kaziTemelSpecs } from "./pages/kazi-temel";
import { peyzajTeslimSpecs } from "./pages/peyzaj-teslim";
import { projeHazirlikSpecs } from "./pages/proje-hazirlik";
import { tesisatIsleriSpecs } from "./pages/tesisat-isleri";
import type { BinaGuideData } from "./types";

const FIRST_WAVE_SPECS = [
  ...projeHazirlikSpecs,
  ...kaziTemelSpecs,
  ...kabaInsaatSpecs,
  ...inceIslerSpecs,
  ...tesisatIsleriSpecs,
  ...peyzajTeslimSpecs,
] as const;

const FIRST_WAVE_GUIDE_MAP = buildGuideMap(FIRST_WAVE_SPECS);
const FIRST_WAVE_PATHS = new Set(FIRST_WAVE_GUIDE_MAP.keys());

const FALLBACK_GUIDE_MAP = new Map(
  getAllIndexedBinaNodes()
    .filter((node) => node.slugPath && !FIRST_WAVE_PATHS.has(node.slugPath))
    .map((node) => [node.slugPath, buildFallbackGuide(node)] as const),
);

const ALL_GUIDE_PATHS = [...new Set([...FIRST_WAVE_GUIDE_MAP.keys(), ...FALLBACK_GUIDE_MAP.keys()])];

function resolveFromMaps(slugPath: string): BinaGuideData | undefined {
  return resolveGuideByPathOrAlias(FIRST_WAVE_GUIDE_MAP, slugPath) ?? resolveGuideByPathOrAlias(FALLBACK_GUIDE_MAP, slugPath);
}

export { PUBLISHED_AT_ISO, getBinaGuideBreadcrumbs, toBinaGuideArticle };

export function getAllBinaGuidePaths(): string[] {
  return ALL_GUIDE_PATHS;
}

export function getFirstWaveBinaGuidePaths(): string[] {
  return [...FIRST_WAVE_GUIDE_MAP.keys()];
}

export function getBinaGuideBySlugPath(slugPath: string): BinaGuideData | undefined {
  return resolveFromMaps(slugPath);
}

export function getBinaGuideBySlugParts(slugParts: readonly string[]): BinaGuideData | undefined {
  const indexedNode = getIndexedBinaNodeBySlugParts(slugParts);
  return indexedNode ? getBinaGuideBySlugPath(indexedNode.slugPath) : getBinaGuideBySlugPath(slugParts.join("/"));
}

export function getRelatedBinaGuides(slugPath: string): BinaGuideData[] {
  const guide = getBinaGuideBySlugPath(slugPath);

  if (!guide) {
    return [];
  }

  return guide.relatedPaths
    .map((path) => {
      const relatedNode = getIndexedBinaNodeBySlugPath(path);
      return relatedNode ? getBinaGuideBySlugPath(relatedNode.slugPath) : getBinaGuideBySlugPath(path);
    })
    .filter((item): item is BinaGuideData => Boolean(item));
}
