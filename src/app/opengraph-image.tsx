import { ImageResponse } from "next/og";
import { SITE_DEFAULT_TITLE, SITE_DESCRIPTION, SITE_NAME } from "@/lib/site-config";

export const runtime = "edge";
export const contentType = "image/png";
export const size = {
  width: 1200,
  height: 630,
};

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle at top left, rgba(245,158,11,0.28), transparent 34%), radial-gradient(circle at bottom right, rgba(59,130,246,0.22), transparent 30%), linear-gradient(135deg, #0a0a0a 0%, #111111 52%, #18181b 100%)",
          color: "#f5f5f5",
          padding: "56px",
          fontFamily: "sans-serif",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
          }}
        >
          <div
            style={{
              width: "22px",
              height: "22px",
              borderRadius: "999px",
              background: "#f59e0b",
              boxShadow: "0 0 0 8px rgba(245,158,11,0.14)",
            }}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800 }}>{SITE_NAME}</div>
            <div style={{ fontSize: 16, color: "#a3a3a3" }}>Mühendis ve mimarlar için teknik portal</div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "900px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              padding: "10px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(245,158,11,0.22)",
              background: "rgba(245,158,11,0.08)",
              color: "#fbbf24",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Teknik içerik + hesap araçları
          </div>
          <div style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 900 }}>{SITE_DEFAULT_TITLE}</div>
          <div style={{ fontSize: 24, lineHeight: 1.45, color: "#d4d4d8" }}>{SITE_DESCRIPTION}</div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#a1a1aa",
          }}
        >
          <div>TS 500 • TBDY 2018 • TS EN 1992 • TS EN 206</div>
          <div style={{ color: "#fbbf24", fontWeight: 700 }}>muhendislik-site.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
