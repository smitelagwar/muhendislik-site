import { NextResponse } from "next/server";
import { getSearchIndex } from "@/lib/search-index";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json(getSearchIndex(), {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("GET Error building search index:", error);
    return NextResponse.json({ error: "Failed to build search index" }, { status: 500 });
  }
}
