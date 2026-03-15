import type { MetadataRoute } from "next";
import { resolveSiteUrl } from "@/lib/site-config";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: resolveSiteUrl("/sitemap.xml"),
  };
}
