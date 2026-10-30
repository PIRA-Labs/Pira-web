import type { MetadataRoute } from "next";

import { siteConfig } from "@/lib/site";

/**
 * Generates `/sitemap.xml` — one entry per public route.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...["about", "how-it-works", "architecture", "security", "download"].map((path) => ({
      url: `${siteConfig.url}/${path}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${siteConfig.url}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];
}
