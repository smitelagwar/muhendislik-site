import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin", "/giris", "/kayit", "/dokumantasyon", "/p/"],
      },
    ],
    sitemap: resolveSiteUrl("/sitemap.xml"),
  };
}
