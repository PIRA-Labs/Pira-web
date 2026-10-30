---
tags: [architecture, pira, stable]
updated: 2026-10-29
---

# PIRA website

PIRA means **Physical Intelligence Runtime for Agents**. This repository is the
marketing website; the Android client lives in its dedicated public repository.
The site presents PIRA as a security-first runtime that keeps a policy and
authorization boundary between agent reasoning and device execution.

## Content and routes

- `src/data/pira.ts`: shared identity, philosophy and release destinations.
- `src/data/mocks/home.ts`: typed hero, navigation and preloader copy.
- `/about`, `/how-it-works`, `/architecture`, `/security`, `/download`: static
  routes delegating to the server-rendered `src/views/project.tsx`; each has its
  own canonical and metadata, and appears in the sitemap.
- `SiteFooter` is shared between the home and project views.
- The home retains the scene, typography, viewfinder, pill controls, preloader,
  spring reveals and Observe → Reason → Act → Verify band. The footer adds a
  short scroll below the hero. Mobile navigation uses native `details/summary`.
- Android v0.1.0 APK: `https://github.com/PIRA-Labs/Pira-Android/releases/download/v0.1.0/PIRA-Android-v0.1.0.apk`.
- Android source: `https://github.com/PIRA-Labs/Pira-Android`.
- Navigation GitHub: `https://github.com/PIRA-Labs`.

## Release configuration

Copy `.env.example` to `.env` for local configuration; use Vercel environment
variables in production. Rebuild when changing a public environment variable.

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin; otherwise Vercel production domain |

No Nebius keys or third-party API calls are exposed in the browser. The website
uses only its own static content and same-origin paths.

## Mascot and assets

`mascot.ts` adapts the former prop loader, retaining its existing placement,
float and pointer-follow behavior. The scene's internal `tv` config/uniform names
remain for compatibility with the established field shaders. Pirophone is Y-up,
faces +Z, and is normalized to width 6.6 with yaw −10°, tilt −4° and cursor
limits 18°/12°/8°. Its baked face is preserved; texture-shaped emissive fill
(0.65) makes it readable under the existing grade, using no additional lights.
Late model loads and loaded materials/textures are disposed on navigation.

- Original: `assets/originals/pirophone-original.glb` (10,668,348 bytes).
- Desktop: `public/pirophone.glb` (484,380 bytes; 95.46% smaller).
- Phone/tablet: `public/pirophone-mobile.glb` (225,152 bytes; 97.89% smaller).
- Geometry: 18,493 triangles retained; no simplification. Same-origin Draco.
- Maps: three WebP maps, 1024² desktop / 512² mobile. Approximate decoded texture
  budget including mipmaps: source 128 MiB → desktop 16 MiB / mobile 4 MiB.
- Reproduction commands and compression tradeoff: `assets/originals/README.md`.
- The old TV GLBs and VHS action icons are removed. Favicons, manifest and share
  image now use PIRA. Desktop and portrait poster captures contain Pirophone,
  without UI, and serve both bots and the no-WebGL fallback.

## Verification and limitations

`qa-verify` and `optimize-3d-scene` were followed. Desktop 1440×900, mobile
390×844 and narrow 320×667 were checked in production Chromium. The first pass
caught clipped mobile nav and dark mascot lighting; both were corrected.
Screenshots compare the original and compressed mascot with its face and
silhouette preserved. GLB validation reports no errors; its warning about
runtime tangent-space generation also applies to the source normal-mapped mesh.

The scene's blade counts, DPR ceilings, workers, task-split startup, prewarm,
visibility gates, reduced-motion path and shaders remain. Production instrumentation
recorded 12 linked programs before / 10 after, stable after the entrance. Each
device requests exactly one model. Desktop draws fluctuate at 17–19 per observed
animation frame; mobile records 13 per drawn frame and zero on skipped frames.
Resize round-trip 1440 → 390 → 800 → 641 → 1440 retunes the canvas dimensions
without new programs or document overflow. These are local counted quantities,
not a new hosted FPS or Lighthouse claim.

Mechanical verification has zero FAILs. Existing WARN categories are retained:
scene/metadata color literals (documented shader config), legacy arbitrary CSS
sizes in cookie/legal/debug UI, and the existing contact endpoint's console log
(stripped from production by Next config). No dependencies were changed.

A real Android/iPhone device and fresh hosted Lighthouse/CPU-throttled performance
sweep were not available in this pass; historical scores in [[optimization-history]]
are not new measurements of PIRA. See [[changelog]] for final verification status.
