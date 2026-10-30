/**
 * Site-wide configuration — the single source of truth for SEO.
 *
 * Consumed by the metadata generator, `robots.ts`, `sitemap.ts`, and the
 * JSON-LD structured-data helper.
 */
import { pira } from "@/data/pira";
import { getServerEnv, publicEnv } from "@/env";

/**
 * Vercel's production domain, read at build time — the fallback when a deploy
 * doesn't set `NEXT_PUBLIC_SITE_URL` (none did: the live canonical said
 * localhost). Server-only: every consumer of `siteConfig` renders on the server.
 */
const vercelProduction = getServerEnv().VERCEL_PROJECT_PRODUCTION_URL;

export const siteConfig = {
  name: pira.name,
  /** Default document title — the brand plus what it does, for search results. */
  title: "PIRA — Physical Intelligence Runtime for Agents",
  /** The hero's body copy, verbatim: it is already a 146-character summary. */
  description:
    pira.description,
  /**
   * Public origin, no trailing slash. Drives canonical URLs, OG tags, the
   * sitemap, and JSON-LD. Set `NEXT_PUBLIC_SITE_URL` in production.
   */
  url:
    publicEnv.NEXT_PUBLIC_SITE_URL ??
    (vercelProduction ? `https://${vercelProduction}` : "http://localhost:3000"),
  /**
   * Default Open Graph / Twitter share image (path under `public/`). Generated
   * from the wordmark and hero copy — see obsidian/frontend/seo-metadata.md.
   */
  ogImage: "/open-graph.png",
  ogImageAlt:
    "PIRA — Give AI access to reality. Keep humans in control.",
  ogImageWidth: 1200,
  ogImageHeight: 630,
  /** No X/Twitter account yet. Set a handle and the twitter:site tags appear. */
  twitterHandle: undefined as string | undefined,
  author: pira.name,
  /** Browser theme-color (address bar / PWA) — the scene's sky top. */
  themeColor: "#080a14",
  /** Manifest / tile background — the same sky. */
  backgroundColor: "#080a14",
} as const;
