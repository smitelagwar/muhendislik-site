import { getAllIndexedBinaNodes, getIndexedBinaNodeBySlugParts, getIndexedBinaNodeBySlugPath } from "../bina-asamalari";
import {
  buildGuideMap,
  getBinaGuideBreadcrumbs,
  PUBLISHED_AT_ISO,
  resolveGuideByPathOrAlias,
  toBinaGuideArticle,
} from "./builders";
import { deepenGuideMap } from "./enhancers";
import { buildFallbackGuide } from "./fallback";
import { finishCeilingDoorDeepOverrides } from "./pages/finish-ceiling-door-deep-overrides";
import { finishPlasterDeepOverrides } from "./pages/finish-plaster-deep-overrides";
import { finalQualityBatchDeepOverrides } from "./pages/final-quality-batch-deep-overrides";
import { inceIslerDeepOverrides } from "./pages/ince-isler-deep-overrides";
import { inceIslerFloorBatchDeepOverrides } from "./pages/ince-isler-floor-batch-deep-overrides";
import { inceIslerSurfaceDeepOverrides } from "./pages/ince-isler-surface-deep-overrides";
import { inceIslerSpecs } from "./pages/ince-isler";
import { inceIslerLeafOverrides } from "./pages/ince-isler-leaf-overrides";
import { inceIslerTopicOverrides } from "./pages/ince-isler-topic-overrides";
import { kabaInsaatConcreteBatchDeepOverrides } from "./pages/kaba-insaat-concrete-batch-deep-overrides";
import { kabaInsaatFormworkOverrides } from "./pages/kaba-insaat-formwork-overrides";
import { kabaInsaatCuringDeepOverrides } from "./pages/kaba-insaat-curing-deep-overrides";
import { kabaInsaatDonatiDeepOverrides } from "./pages/kaba-insaat-donati-deep-overrides";
import { kabaInsaatFrameDeepOverrides } from "./pages/kaba-insaat-frame-deep-overrides";
import { kabaInsaatLeafOverrides } from "./pages/kaba-insaat-leaf-overrides";
import { kabaInsaatMasonryOverrides } from "./pages/kaba-insaat-masonry-overrides";
import { kabaInsaatMasonryTopicDeepOverrides } from "./pages/kaba-insaat-masonry-topic-deep-overrides";
import { kabaInsaatOverrides } from "./pages/kaba-insaat-overrides";
import { kabaInsaatRebarRoofBatchDeepOverrides } from "./pages/kaba-insaat-rebar-roof-batch-deep-overrides";
import { kabaInsaatStructuralDeepOverrides } from "./pages/kaba-insaat-structural-deep-overrides";
import { kabaInsaatSpecs } from "./pages/kaba-insaat";
import { inceIslerKapiPencereDeepOverrides } from "./pages/ince-isler-kapi-pencere-deep-overrides";
import { inceIslerDoorDeepOverrides } from "./pages/ince-isler-door-deep-overrides";
import { inceIslerWallTopicDeepOverrides } from "./pages/ince-isler-wall-topic-deep-overrides";
import { kaziTemelDeepOverrides } from "./pages/kazi-temel-deep-overrides";
import { kaziTemelSpecs } from "./pages/kazi-temel";
import { kaziTemelBatchDeepOverrides } from "./pages/kazi-temel-batch-deep-overrides";
import { kaziTemelTopicOverrides } from "./pages/kazi-temel-overrides";
import { peyzajTeslimDeepOverrides } from "./pages/peyzaj-teslim-deep-overrides";
import { peyzajTeslimSpecs } from "./pages/peyzaj-teslim";
import { mepBatchDeepOverrides } from "./pages/mep-batch-deep-overrides";
import { projectCloseoutBatchDeepOverrides } from "./pages/project-closeout-batch-deep-overrides";
import { projeHazirlikDeepOverrides } from "./pages/proje-hazirlik-deep-overrides";
import { projeHazirlikElektrikDeepOverrides } from "./pages/proje-hazirlik-elektrik-deep-overrides";
import { projeHazirlikStatikDeepOverrides } from "./pages/proje-hazirlik-statik-deep-overrides";
import { projeHazirlikSpecs } from "./pages/proje-hazirlik";
import { projeHazirlikTopicOverrides } from "./pages/proje-hazirlik-overrides";
import { structureEnvelopeBatchDeepOverrides } from "./pages/structure-envelope-batch-deep-overrides";
import { terasCatiDeepOverrides } from "./pages/teras-cati-deep-overrides";
import { tesisatIsleriBranchDeepOverrides } from "./pages/tesisat-isleri-branch-deep-overrides";
import { tesisatIsleriFireDeepOverrides } from "./pages/tesisat-isleri-fire-deep-overrides";
import { tesisatIsleriDeepOverrides } from "./pages/tesisat-isleri-deep-overrides";
import { tesisatIsleriSpecs } from "./pages/tesisat-isleri";
import { wallFinishDeepOverrides } from "./pages/wall-finish-deep-overrides";
import type { BinaGuideData } from "./types";

const FIRST_WAVE_SPECS = [
  ...projeHazirlikSpecs,
  ...projeHazirlikTopicOverrides,
  ...projeHazirlikDeepOverrides,
  ...kaziTemelSpecs,
  ...kaziTemelTopicOverrides,
  ...kaziTemelDeepOverrides,
  ...kaziTemelBatchDeepOverrides,
  ...kabaInsaatSpecs,
  ...kabaInsaatOverrides,
  ...kabaInsaatLeafOverrides,
  ...kabaInsaatMasonryOverrides,
  ...kabaInsaatMasonryTopicDeepOverrides,
  ...kabaInsaatFormworkOverrides,
  ...kabaInsaatCuringDeepOverrides,
  ...kabaInsaatDonatiDeepOverrides,
  ...kabaInsaatConcreteBatchDeepOverrides,
  ...kabaInsaatFrameDeepOverrides,
  ...kabaInsaatRebarRoofBatchDeepOverrides,
  ...kabaInsaatStructuralDeepOverrides,
  ...inceIslerSpecs,
  ...inceIslerTopicOverrides,
  ...inceIslerLeafOverrides,
  ...inceIslerDeepOverrides,
  ...inceIslerDoorDeepOverrides,
  ...inceIslerKapiPencereDeepOverrides,
  ...inceIslerSurfaceDeepOverrides,
  ...inceIslerWallTopicDeepOverrides,
  ...inceIslerFloorBatchDeepOverrides,
  ...wallFinishDeepOverrides,
  ...tesisatIsleriSpecs,
  ...tesisatIsleriDeepOverrides,
  ...tesisatIsleriFireDeepOverrides,
  ...tesisatIsleriBranchDeepOverrides,
  ...peyzajTeslimSpecs,
  ...peyzajTeslimDeepOverrides,
  ...projectCloseoutBatchDeepOverrides,
  ...projeHazirlikElektrikDeepOverrides,
  ...projeHazirlikStatikDeepOverrides,
  ...structureEnvelopeBatchDeepOverrides,
  ...terasCatiDeepOverrides,
  ...mepBatchDeepOverrides,
  ...finishCeilingDoorDeepOverrides,
  ...finishPlasterDeepOverrides,
  ...finalQualityBatchDeepOverrides,
] as const;

const FIRST_WAVE_GUIDE_MAP = deepenGuideMap(buildGuideMap(FIRST_WAVE_SPECS));
const FIRST_WAVE_PATHS = new Set(FIRST_WAVE_GUIDE_MAP.keys());

const FALLBACK_GUIDE_MAP = deepenGuideMap(
  new Map(
    getAllIndexedBinaNodes()
      .filter((node) => node.slugPath && !FIRST_WAVE_PATHS.has(node.slugPath))
      .map((node) => [node.slugPath, buildFallbackGuide(node)] as const),
  ),
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
