import type { NextConfig } from "next";

const isVercelProduction = process.env.VERCEL_ENV === "production";

const nextConfig: NextConfig = {
  images: {
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
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },
  async redirects() {
    return [
      ...(isVercelProduction
        ? [
            {
              source: "/admin",
              destination: "/",
              permanent: false,
            },
            {
              source: "/admin/:path*",
              destination: "/",
              permanent: false,
            },
          ]
        : []),
      {
        source: "/araclar",
        destination: "/kategori/araclar",
        permanent: true,
      },
      {
        source: "/araclar/donati-hesabi",
        destination: "/kategori/araclar/donati-hesabi",
        permanent: true,
      },
      {
        source: "/araclar/kolon-on-boyutlandirma",
        destination: "/kategori/araclar/kolon-on-boyutlandirma",
        permanent: true,
      },
      {
        source: "/araclar/kalip-sokum-suresi",
        destination: "/kategori/araclar/kalip-sokum-suresi",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
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
    ];
  },
};

export default nextConfig;
