import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/search-index";

export const runtime = "nodejs";
export const revalidate = 3600;

const SEARCH_CACHE_CONTROL = "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400";

export async function GET() {
  try {
    return NextResponse.json(getSearchIndex(), {
      headers: {
        "Cache-Control": SEARCH_CACHE_CONTROL,
        "CDN-Cache-Control": SEARCH_CACHE_CONTROL,
        "Vercel-CDN-Cache-Control": SEARCH_CACHE_CONTROL,
      },
    });
  } catch (error) {
    console.error("GET Error building search index:", error);
    return NextResponse.json({ error: "Failed to build search index" }, { status: 500 });
  }
}
