---
tags: [meta, performance, seo, history]
updated: 2026-10-06
---

# Optimization history — long.play

What the GetLayers optimization pipeline changed in this project, why, and what
must not be undone. Maintained by the pipeline
(`getlayers-pipeline/optimization-pipeline`, primary record
`obsidian/Projects/longplay.md`; owner decisions `obsidian/Meta/decisions-log.md`).
Condensed for the next agent who edits this repo. Day-to-day notes stay in
[[changelog]] (the 2026-10-02 and 2026-10-03 entries carry the detail),
conventions in [[decisions-log]] — this file links, not duplicates. Last updated
2026-10-06.

## PIRA adaptation — 2026-10-29

The website is now PIRA. The TV-specific asset invariant is superseded by
compressed Pirophone variants and responsive Pirophone posters. All meadow
budgets and startup/animation safeguards remain. See [[pira-website]] for new
local measurements; the scores below remain historical, not PIRA benchmarks.

## Current state

| | Desktop | Mobile | measured |
|---|---|---|---|
| Lighthouse Performance (people, production) | 99 | 93 | 2026-10-04 quiet hosted record |
| Accessibility / Best Practices / SEO | 100 / 100 / 100 | 100 / 100 / 100 | 2026-10-04 |
| Robot form (Googlebot / PSI view) | 100 all | 100 all | 2026-10-04 production re-check |
| Scroll test (production) | smooth (1.46 %, max 26.1 ms) — **not a gate** (owner, D-031) | ideal (0.2 %, max 32 ms) | 2026-10-05 D-031 sweep |

- Status: **optimized** with the owner's scroll exception (`--accept-scroll`,
  D-031): desktop is one screen with no page scroll, so the desktop scroll
  metric (wheel over a static screen, the grass's GPU cost on the 1 % line) is
  not a gate.
- Production: Vercel project `getlayers-longplay` (textura-agency, deploys
  `main`), domain `getlayers-longplay-sjdklfanksfmcasfsw.vercel.app` (protected
  except custom domains). `repackage: needed` (the owner decides).

## Invariants — do not undo

| what | why / measured effect | where |
|---|---|---|
| **Desktop grass: 320k blades** (was 480k), **DPR ceiling 1.25** (was 1.5); blade buffer sized to the largest tier (340k); phone 220k | the meadow held ~40 fps; the combination idles at 120 Hz where 480k held 60 — DPR 1.0 alone or 300k alone did not move the scroll test. Looked at 1440@2×: still dense (D-026 visual-weight trade) | `src/components/scene/grass-field/grass-field.config.ts` |
| **Sun-shadow march runs in a Worker**; ground relief built a task later | it was one 1.5 s task at 4× CPU (the whole old "890 ms" long task) | `scene/grass-field/sun-shadow.ts`, `sun-shadow-compute.ts`, `sun-shadow.worker.ts` |
| **Scene start-up split into tasks**: renderer a task ahead, scene a task after the chunk's commit, ground built with its relief, prewarm uploads in small batches | one 135 ms task at 4× → none over 80 ms; mobile 84 → 91–94 | `create-grass-scene.ts`, `grass-field.tsx` |
| **Grass-blade buffers uploaded one per frame** | all seven (~17.7 MB) at once was a 120 ms task — the 84 ms mobile scroll frame | `create-grass-scene.ts` |
| **Prewarm runs one step per frame from `render`**, under the preloader: texture batches → `compileAsync(scene)` → bend/spring programs against their own targets → one frame each for bend, scene, bloom chain, composite | the bloom chain and composite were never warmed; `setTimeout(0)` steps ran back to back in one frame. First real frame 43–56 → 4–5 ms; mobile scroll janky → ideal | `create-grass-scene.ts` |
| **Entrances switch on each in its own task, 120 ms before their own delay** (`useRevealCue`, listens via `usePreloader.subscribe`, counts from `revealedAt`) | the `revealed` flip re-rendered the hero and mounted three text engines in one frame (54–73 ms) | `src/components/common/preloader/reveal.tsx`, `src/hooks/use-preloader.ts` |
| **Hero copy blurs once per line**, not per word | per-element blurs over the canvas; frame-identical | hero reveal components |
| **Unplayed `once` text reveals render the engine's served markup with no springs** (`WaitingText`) — served HTML byte-identical, CLS 0 | TBT ~1,150 → ~550 ms | `src/components/common/robot-text.tsx`, `robot-spring.tsx` |
| **`tv-512.glb`** (30 maps at 512 px, 0.91 → 0.46 MB) on phone/tablet | the TV's 30 textures on phones; screenshots identical | `public/assets/grass-hero/tv-512.glb` |
| `prefetch={false}` on `#…` links and the home link | needless prefetches on load | `ui/action-link.tsx`, `ui/glass-pill-link.tsx` |
| **Consent banner server-rendered** | it was the LCP | `src/components/common/Cookie/`, `src/app/layout.tsx` |
| **Robot form** (D-016): `RobotReady` raises the preloader's ready + revealed; the grass field's poster is in the **served HTML** (the UA check used to answer only after hydration); springs/text via robot wrappers | robot mobile 90 → 100, PC 100 | `src/components/common/preloader/robot-ready.tsx`, `src/proxy.ts`, `src/app/robot-view/` |
| AI crawlers in the bot list | fleet fix 2026-10-02 | `src/utils/bot-ua.ts` |
| No `app/loading.tsx`; `/privacy-policy`; D-019 origin fallback | non-JS crawlers; BP 96 → 100; localhost canonical | `src/app/`, `src/lib/site.ts` |

## Owner decisions

- **D-016** — robots get a static page, same content, via the proxy.
- **D-026** — visual weight may be traded if it stays beautiful (the desktop
  blade count + DPR cut above); never cut a mobile scene without asking.
- **D-026 / D-028 / D-029** — A11y/BP/SEO 100 everywhere (people + robot),
  performance ≥ 90 desktop and mobile. D-029 closing: longplay's stale robot 88
  re-measured 100/100.
- **D-031 / #24** (2026-10-05) — "we don't have scroll on desktop in this
  template … it's just 1 screen": the desktop scroll metric is not a gate —
  recorded as the owner's exception.
- **D-027 / D-034** — pass work merged to `main`; the owner reviews live.
- **D-033** — not mentioned in the owner's phone review → approved as is.
- **D-038** — this file.

## History by pass

**pass-1 — 2026-09-29, `2d63d10`.** Hosted baseline (5 runs): PC 89, mobile 71
(TBT 1,374 ms), BP 96; scroll PC janky cold (8.3 %, a steady ~40 fps), mobile
smooth (two 66 ms script frames); robot 100/90.
- Robot path (`RobotReady`, poster in served HTML) → robot 100 / 100.
- `/privacy-policy`, D-019, `math.ts` → BP 100.
- Result: PC 89 / mobile 70; desktop scroll still janky → blocked on #24.
- Follow-ups: `1902089` robot-text typing, `ed62fce` robot-text flex row.

**D-028 round — 2026-10-02, `d68a573`.** Sun shadow → Worker, banner SSR,
`loading.tsx` deleted, hidden reveals as plain markup, desktop grass
320k + DPR 1.25 (mobile 64 → 76–77, desktop 87 → 99); then `WaitingText`,
`prefetch={false}`, stepped scene start, `tv-512.glb` (→ 91–94); then blade
buffers one per frame + hero blur per line. Hosted record: PC **99** / mobile
**92**, robot 100/100, scroll PC **ideal** (0.21 %), mobile smooth (one 51–58 ms
script frame at the start of the cold pass, 3/3). AI-crawler bot list carried
in this commit.

**D-028 wave 6 — 2026-10-03/04, `7e8ceda`.** Split entrances (`useRevealCue`)
+ per-frame prewarm → mobile scroll janky → **ideal** 3/3. A loaded run (load
62) was invalid; the quiet record (2026-10-04): PC **99** / mobile **93**,
mobile scroll ideal (0.41 %), PC smooth 2.83 % — the "desktop regression" was
disproved by interleaved A/B vs `origin/main` (same spread, identical WebGL
calls per frame). Robot re-check 100/100.

**D-031 — 2026-10-05:** owner exception for desktop scroll → **optimized**.
Production sweep: desktop smooth 1.46 %, mobile ideal 0.2 %.

## Tried and reverted / didn't help

- **Analytic ray–heightfield pointer pick** (gring-x's raycast fix) instead of
  raycasting the ~97k-triangle ground: no change — reverted. A catalog entry is
  a hypothesis per project.
- **Texture uploads one per task** (D-028): no gain — reverted.
- **DPR 1.0 alone**, or **300k blades alone**: did not move the desktop scroll test.
- Blaming wave 6 for the desktop "regression": disproved (the grass's GPU cost
  flips the verdict on both builds).

## Open items / leads

- Desktop scroll sits on the 1 % line from the grass's GPU cost — accepted (D-031).
- Leads recorded: the remaining single-element blurs and the frosted band over
  the canvas (desktop compositing); the scene's first draw is still 36–39 ms
  (under the preloader).
- Fleet candidate list (pattern match, D-033): a phone frame cap — longplay is
  approved, so only if the owner notices (#50).

## How to measure

From `getlayers-pipeline/optimization-pipeline/` (records only via `measure.mjs`):

```sh
node tools/measure.mjs longplay --hosted              # production: Lighthouse + scroll, PC + mobile ×3
node tools/measure.mjs longplay --hosted --as-bot     # the robot form (what PSI / Googlebot see)
node tools/measure.mjs longplay --tag check           # local production build, while iterating
node tools/measure.mjs longplay --only scroll --devices mobile --runs 1 --no-build   # iterate on a freeze
node tools/profile.mjs longplay --device mobile --scroll-to 300   # the first second of the phone scroll (start-up frames)
node tools/fps-probe.mjs <url> --desktop            # grass fps on desktop (blade count / DPR changes)
```
