import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/site-config";

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
          background: "linear-gradient(135deg, #06080d 0%, #0b1018 48%, #07111c 100%)",
          color: "#f8fafc",
          padding: "56px",
          fontFamily: "sans-serif",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(245,158,11,0.09) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.08) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            opacity: 0.65,
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(110deg, rgba(6,8,13,0.18) 0%, rgba(6,8,13,0.82) 38%, rgba(6,8,13,0.94) 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "18px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              width: "26px",
              height: "26px",
              borderRadius: "8px",
              border: "1px solid rgba(251,191,36,0.4)",
              background: "linear-gradient(135deg, rgba(245,158,11,0.92), rgba(34,211,238,0.84))",
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
            <div style={{ fontSize: 16, color: "#94a3b8" }}>Mühendis ve mimarlar için premium teknik portal</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            maxWidth: "920px",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              width: "fit-content",
              padding: "10px 18px",
              borderRadius: "10px",
              border: "1px solid rgba(245,158,11,0.28)",
              background: "rgba(245,158,11,0.1)",
              color: "#fbbf24",
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Dijital blueprint
          </div>
          <div style={{ fontSize: 68, lineHeight: 1.02, fontWeight: 900 }}>
            Mühendislik kararlarını hızlandıran çalışma yüzeyi
          </div>
          <div style={{ fontSize: 24, lineHeight: 1.45, color: "#cbd5e1" }}>
            Betonarme araçları, deprem mevzuatı, şantiye rehberleri ve bina aşamalarını tek premium ana yüzeyde
            toplayan teknik portal.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: 20,
            color: "#94a3b8",
            position: "relative",
            zIndex: 1,
          }}
        >
          <div>TS 500 • TBDY 2018 • TS EN 1992-1-1 • TS EN 206</div>
          <div style={{ color: "#fbbf24", fontWeight: 700 }}>muhendislik-site.vercel.app</div>
        </div>
      </div>
    ),
    size,
  );
}
