import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  devIndicators: false,
  distDir: process.env.NEXT_DIST_DIR || ".next",
  allowedDevOrigins: ["localhost", "127.0.0.1"],
  serverExternalPackages: [
    "@node-projects/acad-ts",
    "@mlightcad/libredwg-web",
    "@mlightcad/libredwg-converter",
  ],
  outputFileTracingIncludes: {
    "/api/document-template/\\[id\\]": ["./public/belgeler/*.pdf"],
    "/api/belgeler/paylasim": [
      "./public/belgeler/beton-dokum-tutanagi.pdf",
      "./public/belgeler/insaat-ruhsati-dilekcesi.pdf",
      "./public/belgeler/santiye-sefi-istifa-dilekcesi.pdf",
      "./public/belgeler/santiye-sefi-sozlesmesi.pdf",
      "./public/belgeler/santiye-sefi-taahhutnamesi.pdf",
      "./public/fonts/Arial-Bold.ttf",
      "./public/fonts/Arial-Regular.ttf",
      "./public/fonts/IBMPlexSerif-Bold.ttf",
      "./public/fonts/IBMPlexSerif-Regular.ttf",
    ],
  },
  typescript: {
    tsconfigPath: "tsconfig.next.json",
  },
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts"],
  },

  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async redirects() {
    return [
      {
        source: "/kategori/bina-asamalari/:path+",
        destination: "/rehber/:path+",
        permanent: true,
      },
      {
        source: "/araclar",
        destination: "/kategori/araclar",
        permanent: true,
      },
      {
        source: "/araclar/:path*",
        destination: "/kategori/araclar/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            // Development chunk names are stable across edits. An immutable
            // response can hydrate new HTML with an old workbench bundle.
            value: process.env.NODE_ENV === "development" ? "no-store, max-age=0" : "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/cad-upstream/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/vendor/pdfjs/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/fonts/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/belgeler/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/(.*)\\.(ico|png|jpg|jpeg|svg|webp|avif)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=2592000, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/api/belgeler/paylasim/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/b/:path*",
        headers: [
          { key: "Cache-Control", value: "private, no-store, no-cache, must-revalidate" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive, nosnippet" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/dokumantasyon/dosya/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "private, no-cache, no-store, must-revalidate",
          },
          {
            key: "Referrer-Policy",
            value: "no-referrer",
          },
          {
            key: "X-Robots-Tag",
            value: "noindex, noarchive, nosnippet",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
