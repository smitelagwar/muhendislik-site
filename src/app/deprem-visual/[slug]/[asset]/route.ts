import { getDepremRolloutSpec, DEPREM_ROLLOUT_ARTICLES } from "@/lib/deprem-rollout";
import { renderDepremVisualSvg, type DepremVisualAsset } from "@/lib/deprem-visual";
import { hasDepremTechnicalVisual, renderDepremTechnicalVisualSvg } from "@/lib/deprem-technical-visual";

const ASSETS = ["cover.svg", "diagram.svg"] as const;

export const dynamicParams = false;

export function generateStaticParams() {
  return DEPREM_ROLLOUT_ARTICLES.flatMap((spec) =>
    ASSETS.map((asset) => ({ slug: spec.slug, asset })),
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string; asset: string }> },
) {
  const { slug, asset } = await context.params;
  const spec = getDepremRolloutSpec(slug);
  const assetType: DepremVisualAsset | null =
    asset === "cover.svg" ? "cover" : asset === "diagram.svg" ? "diagram" : null;

  if (!spec || !assetType) {
    return new Response("Not found", { status: 404 });
  }

  const svg = hasDepremTechnicalVisual(slug)
    ? renderDepremTechnicalVisualSvg(spec, assetType)
    : renderDepremVisualSvg(spec, assetType);

  return new Response(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
