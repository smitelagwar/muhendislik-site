import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: rawSize } = await params;
  const size = Number(rawSize);
  if (![180, 192, 512].includes(size)) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#101827", borderRadius: size * 0.17 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "70%", height: "70%", border: Math.max(4, Math.round(size * 0.024)) + "px solid #fbbf24", borderRadius: size * 0.1, color: "#fbbf24" }}>
          <div style={{ display: "flex", fontSize: Math.round(size * 0.33), fontWeight: 800, lineHeight: 1 }}>İ</div>
          <div style={{ display: "flex", fontSize: Math.round(size * 0.088), fontWeight: 700, letterSpacing: 2 }}>BELGELER</div>
        </div>
      </div>
    ),
    { width: size, height: size, headers: { "Cache-Control": "public, max-age=3600" } },
  );
}
