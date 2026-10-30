---
tags: [meta, changelog]
updated: 2026-10-02
---

# Changelog

Chronological log of notable changes to **this project**. Newest first.
Human-curated — not a mirror of `git log`.

Log a change here when it would surprise someone returning in six months: a new
dependency, a new route or section, a convention bent, a bug whose cause is worth
remembering. Routine commits do not need an entry.

For *why* the conventions are what they are, see [[decisions-log]].

---

## 2026-10-30 — Art-direction pass: PIRA's own visual identity

A focused art-direction refinement (not a redesign) to give PIRA a distinctive
look rather than a rebranded template. The scene architecture, shaders, tier
budgets, worker, prewarming, interaction system and spring engine are untouched;
all changes are colour/size config inputs, typography, and UI refinement.

- **Typography.** Replaced Dancing Script with **Space Grotesk** (`next/font`,
  weights 400/500/700) as the display face. Renamed the token `font-script`/
  `--font-dancing-script` → `font-display`/`--font-space-grotesk` (role-honest).
  Hero headline reworked for weight contrast and tight tracking (new
  `tracking-display` / `tracking-subtitle` tokens); subtitle moved onto the same
  display family. Preloader counter follows. No dependency change — same
  `next/font/google`.
- **Scene palette (`grass-field.config.ts`).** Grass shifted from the template's
  blue/teal to PIRA's indigo/midnight/violet canopy; periwinkle/lavender
  highlights (`dry`, `flower`, `skyLight`); periwinkle particles; haze toward
  lavender; grade shadow-tint toward indigo. The **warm peach sunset**
  (`sun`, `horizonGlow`) is deliberately preserved. To pull the lit canopy off
  green-gold without touching the protected shader or swapping the blade texture
  (whose alpha cutout is safety-critical), the warm terms were eased —
  `grassLight.diffuse` 0.9→0.62, `translucency` 1.35→0.85, `specular` 1.0→0.7 —
  and the cool sky fill lifted (`ambient` 0.52→0.66). Scene-backdrop CSS token
  synced to the new `skyHorizon` (`#cdd2f2`).
- **Mascot presence.** `tv.width` 6.6→9.3 (+41%) to make Pirophone the hero;
  `hover` 3.8→4.6 and `lateral` 1.5→2.1 so the larger body floats clear of the
  centred headline. Animations, pointer-follow and lighting model unchanged.
- **Interface.** Nav pills made smaller and more understated — lighter
  `overlay-pill`/`overlay-pill-hover` surface tokens, a faint inset hairline
  ring, reduced padding, and muted-at-rest labels that brighten on hover/focus.
- **PIRA detail.** New `HeroTelemetry` — a restrained, purely decorative
  viewfinder HUD (reticle + "PIROPHONE" / "RUNTIME" tags). `aria-hidden`,
  `pointer-events-none`, static strings (not live telemetry), no looping motion
  (entrances use existing `Reveal` springs).
- Verified: `yarn lint` clean, `yarn build` passes, `verify.sh` 0 FAIL / 3
  existing WARN categories. **UI/typography verified by headless Chromium
  capture** at 1440×900 (new font, pills, HUD and periwinkle backdrop confirmed).
  **Scene (grass palette, mascot size, lighting) NOT visually verified**: the
  headless SwiftShader environment cannot run the WebGL scene and falls back to
  the static poster, so the live meadow render could not be captured here.
  Recommend a visual check in a real GPU browser, and **regenerating the
  no-WebGL/bot posters** (`poster.webp` / `poster-mobile.webp`), which still show
  the old green scene and smaller mascot and are now stale.

## 2026-10-29 — PIRA rebrand and Pirophone adaptation

- Preserved the meadow, shaders, camera placement, tier budgets, worker,
  prewarming, interaction system and spring engine. Replaced the TV with the
  supplied textured smartphone mascot; tuned size, orientation, pointer range
  and material fill without adding lights. Model disposal covers navigation and
  late loads. Source backup is outside `public/`.
- GLB: 10,668,348 bytes → 484,380 desktop / 225,152 mobile (95.46% / 97.89%
  smaller). No mesh simplification; three maps resized and WebP-compressed,
  Draco geometry using the existing local decoder. Source/compressed model
  comparison and GLB validation completed (zero errors; normal-map tangent-space
  warning retained). See ADR-0043 and [[pira-website]] for the KTX2 tradeoff.
- PIRA hero copy, responsive native mobile menu, shared footer, static About /
  How It Works / Architecture / Download pages, GitHub destination supplied by
  the owner, configurable APK URL with honest unavailable state. New surface,
  minimum-layout and touch-target tokens extend the existing palette and scale.
- Updated title/metadata, sitemap, manifest, favicon family, OG card, privacy
  branding, and desktop/portrait static scene posters. Removed TV and VHS assets.
- Verified: `yarn lint`, `yarn build`, `verify.sh` (0 FAIL / 3 existing WARN
  categories, detailed in [[pira-website]]). Browser QA: desktop 1440×900, phones
  390×844 and 320×667, no horizontal document overflow or browser errors; one
  GLB request per device. Mobile clipping and dark face found and fixed.
- All five document routes return 200, with unique metadata/canonicals and one
  h1. Download falls back to the release-status page; GitHub points to the owner’s
  repository. Crawler and no-WebGL tests use the portrait Pirophone poster with
  zero model requests. Reduced-motion path renders without errors.
- Resize round-trip 1440 → 390 → 800 → 641 → 1440: canvas sizes retune,
  no overflow, and the program count stays at 10 throughout.
- Local production WebGL: linked programs 12 before → 10 after, stable after
  entrance. The old hosted Lighthouse scores were not rerun; real-device and
  hosted CPU-throttled performance remain unmeasured. No package changes.
- QA captures and mechanical report: `artifacts/pira/`. No Git checkout was
  present in the supplied directory, so changes are local files, not a commit.

---

## 2026-10-03 — pass 2: the phone's start-of-pass script frame (optimize/pass-1, uncommitted)

The production re-check had one 51–58 ms `script` frame at the start of the phone's cold pass,
3/3. A long-animation-frame probe (the scroll test's own setup: headful, 390×844 @3, 4× CPU, 4G,
people UA; source-mapped build) reproduced it 3/3 (64–68 ms at t ≈ 7.5–8.1 s; the pass starts at
4.9 s on a one-screen page). It was two things in turn:

- **The curtain lift** (`preloader/reveal.tsx`, `hooks/use-preloader.ts`). Every `Reveal` /
  `RevealText` subscribed to `revealed`, so the preloader's ticker frame that flipped it
  re-rendered the whole hero and mounted three text engines in one sync render (54–73 ms
  `FrameRequestCallback`). Each entrance now switches on in its own task 120 ms before its own
  delay, with the delay left (`useRevealCue`; the curtain-lift split from dringle and
  creative-studio). It listens through `usePreloader.subscribe`, so the flip renders nothing, and
  it counts from the real reveal time (`revealedAt`), so a late timer does not shift the
  choreography.
- **The first real frame** (`create-grass-scene.ts`, prewarm). With the reveal split, the frame
  left was the scene's first full frame: 43–56 ms (every frame after it 1–4 ms). Instrumented per
  step: the prewarm compiled the scene's programs but not the bloom chain or the composite, and
  each pass's first use (uniform tables, target set-up) cost as much as a compile. The prewarm now
  runs **one step per frame from `render`** (`setTimeout(0)` steps ran back to back before the
  next frame, in one long frame): texture batches → `compileAsync(scene)` → the bend and spring
  programs via `compileAsync` against their own targets → once all are linked, one frame each for
  the bend draw, the scene into its target, the bloom chain and the composite. All under the
  preloader, which still waits for the first real frame. First real frame 43–56 → **4–5 ms**;
  the heaviest step is the scene's first draw, 36–39 ms.

**Effect** (local, 3 runs each, same sitting):
- Scroll, mobile: `origin/main` **janky** (script freeze 57 / 84 / 100 ms 3/3, cold
  1.02–4.23 % dropped) → **ideal** 3/3 (cold 0.2–0.41 %, max 25–33 ms, no frame > 50 ms)
  (`runs/longplay/2026-10-03T15-35-54-check.json` → `…15-31-11-check.json`).
- Scroll, PC: unchanged. Both builds drop ~1–6 % with p99 24–26 ms (the grass on this GPU under
  load avg 8–30); no frame > 50 ms.
- Lighthouse mobile, interleaved `--url` A/B (load avg ~30): main 87 / 88, new 93 / 89; A11y 100
  every run. PC 95–99 both.
- Visual: every hero element's opacity/transform sampled per frame from the curtain's first move,
  both builds, at 1440 and 390. Entrance starts are within a frame or two (median 16–17 ms) and
  settle times are the same. Shots at +0.4/1.2/2.4/4 s are the same apart from the live particles.
- `verify.sh` 0 FAIL; `tsc`, `yarn lint` and `next build` pass.

**Follow-up 2026-10-04: the hosted PC "regression"** (`opt-longplay` PC 0.21 % → 2.83 % cold,
1.66 % warm). Checked against `origin/main`, back to back, load 4–11. No difference was found:
- WebGL calls per frame after the reveal (+6 s, +16 s) are identical in both builds: 28 draws,
  12 program switches, 18 framebuffer binds, one blit. No timers are still firing, and the
  frame-interval distribution is the same. Nothing keeps stepping or re-arming after the reveal,
  and no extra pass runs.
- Desktop scroll, interleaved `--url`, 3 runs ×2 each: main cold 14.2 / 2.45 / 1.23 % and
  7.88 / 3.48 / 1.67 %; new 3.5 / 5.53 / 2.44 % and 2.24 / 0.61 / 5.41 %. p99 is ~25 ms in both
  and no frame is over 50 ms.
- The curtain lifts at the same moment in both (3.12–3.27 s after navigation), and the dropped
  frames bucketed per second after it match second for second (3 runs each).

PC on this page sits on the 1 % bar in both builds; the verdict flips between runs on the grass's
GPU cost (#24). Nothing changed in code.

## 2026-10-02 — scroll round: blade upload spread, hero blur per line (optimize/pass-1, uncommitted)

- **Blade buffers upload one attribute per frame** (`create-grass-scene.ts`,
  `uploadBlades`). The first frame that drew the finished field uploaded all
  seven instanced attributes at once. Every tier builds the buffers at the
  largest tier's size (340k blades, ~17.7 MB), so that frame took 120 ms at 4×
  CPU (profile, `WebGLAttributes.update`). The scroll test caught it as the
  phone's 84 ms `script` frame on "the one screen", 5/5 hosted runs. Each
  attribute now goes up in a frame of its own through a hidden mesh, rendered
  into the offscreen target. The mesh shares the attribute object, and three.js
  uploads geometry before it checks `material.visible`, so nothing is drawn and
  no program is built. Only after that is `instanceCount` applied. `retune()`
  waits for `bladesReady` too. A WebGL call log showed the uploads in separate
  frames and the 368 ms first-draw frame was gone.
- **Hero copy blurs once per line, not per word** (`preloader/reveal.tsx`,
  `RevealText`). The words keep their staggered rise and fade on their own
  springs. The 12 px blur is one `filter` on the engine's box, easing out over
  the wave's span (1.1 s + stagger × words) and removed at rest. This is the
  vesper fix. Compared frame by frame against `opt-longplay` (1440×900): the
  same entrance.
- **Scroll, local, 3 runs** (`runs/longplay/2026-10-02T15-26-31-check.json`):
  mobile **ideal** (cold 0.81 %, max 49.7 ms, no frame > 50 ms; warm 0 %). The
  hosted record before this round was smooth, with two 84 ms frames in 5/5
  runs. Desktop is **smooth**: cold 1.03 % median (0.41 / 1.62 / 1.03), one
  50 ms render frame in 1/3 runs, warm 0 %. Before: 3.45 % hosted, 3.5 %
  local. Still just over the 1 % bar.

## 2026-10-02 — mobile 90 round (optimize/pass-1, uncommitted)

Local Lighthouse, people form, same-sitting A/B against the previous build
(alternating, 3 runs each, twice): mobile **64 → 76–77** (TBT ~1,700 → ~770 ms);
desktop 87 → 99. Robot form 98 / 100.

- **Sun-shadow march in a Worker** (`scene/grass-field/sun-shadow.ts`,
  `sun-shadow-compute.ts`, `sun-shadow.worker.ts`). ~9 M noise samples were one
  1.5 s task at 4× CPU in the scene's construction. The map starts in full sun,
  is filled when the bytes arrive, and counts as a pending asset (the preloader
  waits for it). Falls back to the main thread if a Worker cannot start.
- **Ground relief a task later** (`create-grass-scene.ts`): heights, then normals,
  each in its own task; also a pending asset.
- **Consent banner server-rendered** (`scaffold-consent`: `Cookie/*`, `layout.tsx`,
  `globals.css`). It was the phone's LCP and painted only after hydration. Over
  the preloader it now appears one hydration earlier (no fade existed).
- **Empty `app/loading.tsx` deleted.**
- **Hidden reveals wait as plain markup** (`common/robot-spring.tsx`, the fleet
  version): a reveal never enabled renders at `from` with no spring.
- **Desktop grass lighter** (D-026): 480k → **320k** blades, desktop DPR ceiling
  1.5 → **1.25**; the shared blade buffer is sized to the largest tier (340k,
  tablet) instead of 480k, so every device builds and uploads 29 % less. Screens
  compared at 1440 @2×: the meadow still reads dense; the hill under the set is
  a touch less packed.

Tried and reverted (then re-applied below with instrumentation): uploading the
textures one per task in `prewarm`.

Second half of the round (same day), A/B against the build above:

- **Unplayed text reveals as the engine's own markup** (`common/robot-text.tsx`
  `WaitingText`): a `once` reveal never enabled renders the engine's served DOM
  (sr-only copy + word boxes at `wordOut`) with no springs; the engine mounts at
  the reveal. Served HTML byte-identical to the engine's; CLS 0. TBT ~1,150 →
  ~550 ms.
- **`prefetch={false}` on in-page links** (`ui/glass-pill-link.tsx`,
  `ui/action-link.tsx` for `#…` hrefs; the header's home link).
- **Scene start-up in tasks** (`grass-field.tsx`, `create-grass-scene.ts`): the
  renderer a task ahead (`createGrassRenderer`), the scene a task after the
  chunk's commit, the ground plane built with its relief; `prewarm` uploads a
  few textures per task and compiles in a task of its own (it was one ~135 ms
  task at 4×). Re-applied after the earlier revert: instrumented this time.
- **Phone TV model** `public/assets/grass-hero/tv-512.glb` — the 30 maps at
  512 px (WebP q85, geometry untouched), 0.91 → 0.46 MB, loaded where
  `tiers.maxTextureSize` is 512 (phone, tablet). Phone screenshots: identical.

Mobile (A/B, same sitting): 84–85 → **91–94** (TBT ~400 → ~190 ms).

## Baseline — built from `next16-claude-starter` v0.1.0

What the starter ships, so the first project entry has something to diff against:

| Area | What is there |
|------|---------------|
| Framework | Next.js 16 App Router · React 19 · TypeScript · Yarn · Node ≥ 20.19 |
| Styling | Tailwind v4, CSS-only config, three-tier design tokens ([[design-system]]) |
| Motion | Vendored spring engine + `spring-text-engine`, shared rAF ticker, reduced-motion ([[animation-system]]) |
| Layout | Adaptive scaling grid — root font-size tracks the viewport ([[design-system]]) |
| Scroll | Lenis smooth scroll + Zustand scroll store ([[smooth-scroll]]) |
| Server | `app/api` route handlers, zod-validated env, `{ data }`/`{ error }` envelope ([[api-architecture]]) |
| SEO | Metadata generator, `robots.ts`, `sitemap.ts`, JSON-LD ([[seo-metadata]]) |
| Agent harness | 8 commands, 7 path-scoped rules, 11 skills, 4 subagents, `verify.sh` ([[agent-harness]]) |
| Not included | CMS, database, auth, payments, i18n, tests — added per project ([[backend/README]]) |

The home view (`src/views/home.tsx`, route `/`) ships empty on purpose — start
there ([[new-page]]).

<!-- Log this project's changes below, newest first, under a `## YYYY-MM-DD` heading. -->

## 2026-09-14

**Clouds no longer clip; smaller preloader counter on phones.** From author
feedback: a large cloud mass still rendered as a flat white patch.
- **Clouds.** The cause was the colour grade, not bloom. Contrast ×1.26 plus the
  additive highlight tint (+0.6) push anything above ~0.58 linear to pure
  white, and the previous cap was 0.86.
  - The cloud is now scaled and capped by `sky.cloudBrightness` 0.6, and
    `sky.cloudOpacity` went from 0.72 to 0.68.
  - Measured on the upper sky at 1440×800 with the TV excluded, blown-out
    pixels went from ~3 % to 0.1–0.2 %. What remains is particle cores.
  - The saved `poster.webp` was captured before this change, on a frame with
    no clipped cloud, and was not re-exported.
- **Counter.** Below 640 px it's `text-counter-compact` (64 design-px): 67 px
  tall and 48 % of a 375 px screen, where it used to fill it.

**Scene optimised with the `optimize-3d-scene` skill; soft clouds; hovers; panel removed.**
Author asked for four things: clouds that never blow out, hover states, the
scene optimised per the attached skill, and no settings panel. The attached copy
of the skill was **older** than `.claude/skills/optimize-3d-scene/`, so the
project copy was followed and left unchanged. Every number below is counted on
a production build (skill §0), in Chromium device emulation; none were measured
on a real phone.

| Measure (production build, `next start`) | Before | After |
|---|---|---|
| `three` (630 KB) in first-load JS | **yes**: the barrel re-exported `GrassField` | no, its own chunk |
| Hydration long task | 701 ms | 270–300 ms |
| Scene build / compile long task | 108 ms build + 59 ms | build sliced ≤ 8 ms/frame; 67–79 ms async compile + upload |
| Programs, all linked before handoff | 12 ✓ | 12 ✓ (bend/spring now prewarmed on every tier) |
| Desktop 1440×800 @1.5: buffer / fps / draws | 2160×1200 / 60 / 30.6 | 2160×1200 / 60 / 30.6 |
| Phone 375×812 @2: buffer | 750×1624 | **375×812** (¼ of the pixels) |
| Phone: scene fps / draws per frame | 60 / 30.75 | **30** (rAF 60) / **26** |
| Phone: pointer listeners on canvas | 1 | 0 |
| Phone: blades / motes | 480 k / 1400 | 220 k / 600 |
| Phone: largest texture upload | 1024² (×30 TV maps, ≈160 MB VRAM) | 512² (≈40 MB) |
| Context flags | alpha, **antialias**, **stencil** | antialias off, stencil off (three r160 always requests alpha) |
| Tier round trip phone → desktop → phone | — | 375×812 → 2160×1200 → 375×812; 31 → 61 → 31 fps; 26 → 30.6 → 26 draws; listeners 0 → 1 → 0; **programs 12 throughout** |

What changed (ADR-0042):
- **§1 bots.** `PreloadedGrassField` checks `navigator.userAgent`
  (`utils/bot-user-agent.ts`) and never mounts the scene for crawlers or audit
  tools; they get `public/assets/grass-hero/poster.webp` (a 1920×1067 frame of
  the scene). A device with no WebGL gets the same poster. The check is
  client-side, so `/` stays static (○). The barrel no longer re-exports
  `GrassField`; that re-export was what put `three` in the first load.
- **§2 / §5 / §6 / §7 / §11 tiers.** `src/lib/scene/device.ts` covers:
  - DPR: desktop ≤ 1.5, tablet ≤ 1.25, mobile ≤ 1.0;
  - frame budget: uncapped, 45 and 30 fps;
  - blades via `instanceCount` on a buffer sized for the largest tier;
  - motes via `setDrawRange`;
  - offscreen MSAA 4 / 4 / 2;
  - bloom ×1 / ×1 / ×0.6, with at most 7 / 5 / 3 blur pairs;
  - the pointer is unbound on mobile.

  `retune()` re-applies all of it on a width change or a pointer-media-query
  flip.
- **§3 prewarm.** The blade build fills typed arrays in 8 ms slices across
  frames and feeds the preloader. Once assets settle, every texture goes through
  `initTexture` and the scene compiles with `compileAsync` **against the
  offscreen target**: compiling for the default framebuffer built 7 unused
  variants. The bend and spring passes are drawn once on every tier.
- **§4 visibility.** The loop draws only while the tab is visible and the canvas
  is within a viewport of the screen.
- **Freeze tier.** Reduced motion, or energy saver on mobile, skips the gust and
  holds the last settled frame after the reveal.
- **§12.** TV maps are capped per tier (1024 / 512 / 512) before upload. KTX2 was
  not done: `@gltf-transform/cli` cannot parse this GLB (its sourceless-texture
  export bug) and `toktx` is not installed. Re-exporting the model is the way
  to get there.
- **§13.** Layout is `h-dvh`, the canvas is `h-lvh` on its own compositor layer.
  The resize is rAF-coalesced and ignores height-only changes on a coarse
  pointer (the URL bar). `dt` is clamped to 0.05 s.
- **Mote size capped** at 48 px × DPR.
- **Clouds.** Sun warmth is now a tint rather than added light (it used to push
  clouds near the sun to ~1.7 linear → bloom blowout). Clouds are also capped at
  `sky.cloudBrightness` 0.86 × `colors.cloud`, `sky.cloudOpacity` 0.72, and thin
  out near the sun.
- **Hovers.** Glass pills 10 → 20 % white, CTA surface 80 → 100 % cream, the "≈"
  icon scales 1.15, logo "play" 60 → 100 %. The same states apply on
  `:focus-visible`.
- **Panel.** Removed from `/`. `SceneControls` is lazy-loaded only when
  `controls` is set, so it no longer ships in the scene chunk.
- **Not verified here:** the bot path (the pane can't spoof a user agent before
  load); reduced-motion freeze (can't emulate the media query here); real-device
  behaviour and URL-bar collapse on iOS.

**Reveal gust reworked: strong but smooth.** Author feedback: the gust looked
strange. It amplified each blade's own noise (×2.3 amplitude, ×4 speed), so the
field thrashed like static.
- **Lean and wave.** The whole field now leans together in the wind direction
  (`windGust.lean` 0.28 ≈ 32°), with a broad wave rolling downwind through the
  lean (`wave` 0.45).
- **Noise, motes and clouds** are only nudged: sway ×1.2, speed ×1.5, motes ×2,
  clouds ×3.
- **Envelope.** 1.1 s smoothstep rise, then a Gaussian calm (2.2 s) with no
  corner at the peak. The field is settled by ~6 s.
- **Panel.** `windGust.strength` is replaced by `lean` / `wave` / `sway`, and
  there's a new *Gust rise seconds* slider.

**Preloader redesigned from the author's reference.** The VHS card (wordmark,
tape counter, hairline bar) is replaced:
- A white curtain carries a large Dancing Script `0–100%` counter.
- A pale ghost of the number is filled bottom-up by a blue→lilac gradient
  through a `clip-path` mask.
- At 100 % the curtain slides up with the counter on an overdamped spring, and
  the hero reveal and gust start with it.
- The counter climbs at most 62 %/s, so even a cached load counts visibly.

Tokens: `preloader-glow*` and the mirrored sky primitives are removed. Added
`preloader-counter`, `preloader-fill-start` / `-end` and `text-counter`.
`PreloaderContent` is now just `label`.

**More clouds, viewport-scaled motes, a reveal gust.** From author feedback.
- **Clouds.** `sky.cloudCover` went 0.06 → 0.38. The clumping gate is now
  configurable (`cloudGateLow` / `cloudGateHigh`, 0.02 / 0.42, was a fixed
  0.28 / 0.62). There are new *Sky* sliders for cover and spread.
- **Motes.** Point size now scales with the canvas below 1440×800
  (`particles.referenceViewport`, floor `minViewportScale` 0.4), so they shrink
  with the window. Large screens are unchanged.
- **Gust.** When the preloader lifts, a strong gust sweeps the field and calms
  over ~5 s: lean ×2.3, ripple speed ×4, motes ×3, clouds ×6 (`windGust`,
  ADR-0041). New `GrassField` `gust` prop and `scene.gust()`. There are new
  *Wind* sliders.
- **Measured.** 60 fps at 1440×800. One test run froze at ~14 s per frame, but
  only after many hot reloads left stale WebGL contexts in the tab. A fresh load
  was fine.

**Preloader, hero entrances, text-clipping fix, metadata and brand assets.**
From author feedback: four items.
1. **Text clipping fixed.** The headline and sub-line lost glyph tops and
   descenders to TextEngine's `overflow` clip. Hero text now reveals without it.
   Leading is back to the design's 1.0, and geometry re-measured exactly on Figma
   (113 / 193 / 570 / 646).
2. **Preloader** (`components/common/preloader/`, ADR-0040).
   - VHS-style: wordmark, blinking play marker, tape counter to 2:00:00 (E-120 SP),
     hairline progress bar, percentage.
   - Colours are the scene's sky, with new `preloader-*` tokens.
   - Real progress comes from a scoped `LoadingManager` in the scene
     (`onLoadProgress` / `onReady`), plus a new `usePreloader` store.
3. **Hero entrances.** Every element waits for the preloader, then blurs in on
   overdamped springs:
   - frame hairlines draw from the centre and the top, and the brackets settle;
   - logo, then nav pills staggered (glass first, label after), then header action;
   - headline and sub-line word by word;
   - body words, then the CTA (surface, then label, then icon tile), then the band and trust line.

   `GlassPillLink` / `ActionLink` gained `renderSurface` / `renderLabel` /
   `renderIcon` so the glass animates on its own element, and the frame hairlines
   became separate elements.
4. **Metadata & brand assets.**
   - Site config is real now: name, title, description, theme colour; the
     placeholder Twitter handle was dropped.
   - OG went from 900×600 to 1200×630, with alt text.
   - The favicon/app/MS icons and `open-graph.png` were regenerated from the
     wordmark.
   - `manifest.json` and `browserconfig.xml` were updated. JSON-LD `logo` → 512 px
     icon, and the missing `ms-icon-*` files now exist.

**Denser grass on the far hills and a smaller far hover.** From author feedback
on a screenshot of the hills right of the television:
- **Grass.** Blades now scatter only within a 115° arc on the camera heading
  (`fieldArcDegrees`, ADR-0039) instead of a full disc, where ~3/4 were never on
  screen. `fieldDensityBias` went from 1.75 to 1.3. The mid-distance hills are
  ~4× denser, instances stay at 480k, and it measured 60 fps.
- **Hover.** `pointer.farRadius` went from 3.5 to 1.75, which halves the dent's
  width out there. The near hill is unchanged.

**Grass hover now carries to the far hills.** Author feedback: the effect was
good on the nearest hill but nearly invisible on the hills under the television.
The cause was a dent sized in world units. Past `pointer.distanceReference`
(10 units), the dent now widens (up to `pointer.farRadius` ×3.5) and deepens (up
to `pointer.farStrength` ×3) with distance from the camera. The near hill is
unchanged. There are three new *Pointer* sliders in the panel (ADR-0038, amended).

**Grass hover has inertia.** Author feedback: the grass reacted to the cursor
instantly and with no weight. Two changes (ADR-0038):

- **Per-texel spring.** A spring pass now sits between the trail map and the
  grass, so blades lag the cursor, overshoot slightly (~15 %) and settle. The
  new config is `pointer.spring.frequency` (1.1 Hz) and
  `pointer.spring.damping` (0.5).
- **Pointer easing.** `pointer.lerp` (per frame) is replaced by
  `pointer.follow` (0.12 s, frame-rate independent).

The panel's *Pointer* group gains three sliders: *Trail lag seconds*,
*Blade inertia Hz* and *Blade damping*.

**Hero UI overlay built from Figma (`3255:783`).** The hosted Figma connector
returned the full layer tree, so the port went through `get_design_context` and
did not rely on the screenshot. See [[design-map]] for every value.

- **Fonts.** Added Mulish 400, Open Sans 400 and Dancing Script 700 via
  `next/font/google`, bound as `font-ui` / `font-body` / `font-script`. All three
  are the families the file uses. None of them is on Fontshare.
- **Tokens.** Added the overlay palette (`overlay-text`, `-text-muted`, `-hairline`,
  `-glass`, `-band`, `-action`, `-action-text`, `-action-icon`), the type sizes
  `label`, `body`, `subtitle` and `display` (plus `-compact` for phones), `leading-copy`,
  the radii `pill`, `action` and `action-icon`, and the blurs `glass` and `band`. Every token has all three tiers.
- **Components.** Added `GlassPillLink` and `ActionLink` in `components/ui/`
  ([[components/ui]]), and the hero pieces in `views/home/` (ADR-0037).
- **Markup.** `views/home.tsx` now renders the canvas, then an overlay holding
  `header` > `nav[Primary]`, `main` > `section[aria-labelledby]`, and a visible
  `<h1>` for both headline lines. The old sr-only "Summer meadow" h1 is gone.
- **Motion.** The header and frame fade in with `Inview`. Both headline lines
  reveal with `TextEngine` line clips. Body, action and band fade up with a stagger.
- **Assets.** Added `public/assets/hero/`: `approximately-equal.svg`,
  `security.svg`, `corner-bracket.svg`.
- **Scene panel.** Moved from `top-4` to `top-20`, below the header hairline, so it
  no longer covers "Get started".
- **Not designed, so adapted.** Phones hide the nav and halve the headline sizes.
  There are no hover states. Links are placeholders.

**Figma port attempted again. Blocked on the author's side; nothing built.** The
tools are first-class now (`.mcp.json`) and the quota has reset, so the workflow
ran properly: load `figma-design-to-code`, then call `get_design_context` on
`3255:783`. The local Dev Mode server is configured to **write assets to disk**.
That makes `dirForAssetWrites` mandatory, and the directory also has to be on
Figma's own allow-list. The call was refused both with and without the parameter.
`get_metadata` confirmed `3255:783` is still the flat raster with no children.

Two author actions will unblock it, both recorded in [[design-map]]: allow
`public/assets/hero` in Figma's MCP settings, and point at the layered root
frame. `public/assets/hero/` was created (empty, with a `.gitkeep`) so there is
a directory to allow. Three Figma calls spent in total. No ID sweep, and no build
from the screenshot.

## 2026-09-13 (Figma retry — still rate-limited, root cause fixed)

Second attempt at the design port. **One** Figma call was spent and it returned
*"Rate limit exceeded, please try again tomorrow"*; the run stopped there rather
than retrying or falling back. New fact: the window is **rolling ~24h from the
sweep, not midnight-local** — the quota did not come back within the same calendar
day.

**The root cause of the fragility was found and fixed.** No Figma MCP server was
registered with Claude Code at all — `mcpServers` was empty globally and there was
no `.mcp.json` — so every previous "Figma call" was an agent hand-rolling the MCP
protocol over HTTP. The server itself is healthy (`Figma Dev Mode MCP Server
v1.0.0` on `127.0.0.1:3845`, confirmed with a zero-cost `initialize` handshake).
It is now registered in a project-scoped [[agent-harness|`.mcp.json`]], so the
next run gets real, typed tools instead of curl.

Two things banked for that run, both free to check:

- `initialize` and `tools/list` are protocol-level and cost **no Figma quota** —
  use them to test whether the server is alive.
- `get_design_context` takes a `dirForAssetWrites` parameter, which should
  pre-empt the "Cannot write to this directory" failure that blocked it before;
  and `get_variable_defs` has never been tried and is a cheap second source for
  colours specifically.

Nothing under `src/` was written. Fonts, colours, type scale, exact copy and the
three glyph assets remain unknown, and per the author's own instruction they are
not to be guessed.

## 2026-09-13 (preview pane)

`.claude/launch.json` gained **`autoPort: true`** — this project needs no fixed
port (no OAuth callbacks, no webhooks, `CONTACT_ENDPOINT` unset), and 3000 is held
by an unrelated long-running process.

**The port was a red herring, though, and that is the part worth remembering.**
With a free port assigned, `next dev` still exited 1:

> *Another `next dev` server is already running.* — PID 53584, http://localhost:3001

Next 16 refuses a second dev server for the same **directory**, regardless of
port, so no amount of port juggling helps. `preview_logs` said so in one line
after config changes had not. The preview was pointed at the already-running
server instead. Recorded in [[agent-harness]].

## 2026-09-13 (later)

**The layered node is partially readable — and the MCP daily quota got burned.**
The node the author supplied for the layered hero, `3255-832`, turns out to be the
**headline text layer**, not the screen's root frame. Its siblings were found by
ID and their exact geometry is now recorded in [[design-map]] — real values off
the layered node, which supersedes everything previously measured off the raster
`3255-783`.

Finding the parent frame was attempted by **sweeping node IDs** (`3255:700–1100`,
~320 `get_metadata` calls). That found no container **and exhausted the server's
daily rate limit** — every tool, including `get_metadata` and `get_screenshot`,
now returns *"Rate limit exceeded, please try again tomorrow"*. `get_design_context`
therefore still has never run on this file.

> [!warning] Do not sweep Figma node IDs
> The server reports the **current Figma selection**, so the way to find a frame
> is to select it in the desktop app and call `get_metadata` once. A sweep costs
> hundreds of calls against a daily quota and answers nothing.

**Nothing was built.** Fonts, every colour, all type metrics and the exact copy
remain unknown, and the author had already ruled out guessing them. One concrete
finding argues the same point: layer names are *not* usable as copy — `Contacts`
renders as `CONTACTS`, `Privacy-first. no data resold.` as caps — so the uppercase
is styling and the real strings must come from `get_design_context`.

**Next session:** select the hero's root frame in Figma, `get_metadata` →
`get_design_context` → `get_screenshot`, then build the overlay.

## 2026-09-13

**Figma access solved — but the design turns out to be a flat image.** The hosted
connector is still unauthorised; the design is reachable instead through the
**local Figma Dev Mode MCP server** (`http://127.0.0.1:3845/mcp`) exposed by the
running Figma desktop app. `get_metadata` and `get_screenshot` work.

Node `3255-783` is a single **1440×800** hero frame — and `get_metadata` returns
it with **zero children**, `get_variable_defs` with `{}`. The frame is one image
fill: a mockup render, not a layered design. So there are no text layers, no font
names, no colour styles and no auto-layout values to read. Everything recorded in
[[design-map]] was *measured off the screenshot* and is labelled as such.

`get_design_context` still cannot run: it demands a writable `dirForAssetWrites`
and Figma's allow-list (`mcpAllowedDirectoriesByUser`) is empty. Unblocking is a
user action in Figma → Dev Mode → MCP → Allowed directories; an agent must not
edit that list. **No assets downloaded.**

Fonts still not wired. The body face reads as Open Sans, as the user said. The
script headline and the light sub-headline cannot be identified from a 0.71×
render, and the Fontshare family is named nowhere in the file — so it must come
from the user, not a guess.

**Two questions put to the author, both answered:**

1. *The unknown families* — they are supplying a **layered version of the
   screen** instead of having them guessed. Build of the overlay is paused until
   that node ID lands; `get_design_context` on a layered frame returns families,
   weights, tracking and colour styles as data.
2. *The background* — the raster in the frame is a **placeholder they dropped in
   to draw the UI over**. The WebGL scene stays exactly as tuned, is not to be
   matched to the mockup, and the plate is not to be exported. The deliverable is
   the overlay alone.

Nothing under `src/` was touched this turn, deliberately.

Superseded, kept for the record:

**Figma import requested; blocked on access, nothing built.** The connector
(`plugin:figma:figma`) is not authorised in this workspace, so
`get_design_context` / `get_screenshot` are unavailable, and the file itself sits
behind Figma's login — fetching the URL returns the app shell with no layers.

[[figma-to-code]]'s first rule is build from live data, never from a description.
With no access there is nothing to build from, so the file key and node ID were
recorded in the new [[design-map]] and the work stopped there. [[figma-to-code]]
gained an explicit note that no access binds the rule harder rather than relaxing
it — an invented layout looks like progress and is wrong in every value that
matters.

Fonts deliberately not wired: Open Sans was named, but the Fontshare family was
not — only the site — and it is in the file. A webfont on the critical path that
nothing uses is a cost with no benefit.

## 2026-09-12 (the field remembers; the camera breathes)

**Grass physics rebuilt around a bend map.** The old breeze was a pure function
of where the pointer *is*: distance to one eased point, evaluated per vertex. A
blade was therefore upright again in the same frame the pointer left it, so a
fast sweep healed behind the cursor as quickly as it was drawn — the field had no
memory, and no amount of easing the *point* could give it one.

Now a small ping-ponged render target holds the dent: RG is the direction to
push, B is how hard. Each frame the whole map is multiplied down by a factor the
CPU derives from real elapsed time — **that fade is the recovery** — and a fresh
stamp is written along the segment the pointer travelled, taking the stronger of
old and new so a glancing pass cannot erase a deep dent.

Two details that matter:

- **A segment, not a disc.** At speed the cursor crosses metres between frames;
  stamping only its current position leaves a dotted line of separate dents.
- **The map is bounded,** and the grass shader zeroes the influence outside it.
  Without that the clamped edge texel smears one permanent bend across the whole
  far field.

Verified by holding the pointer on near grass and then leaving: the dent is still
there 0.2 s later and has stood back up by 2.4 s. `pointer.recovery` is the
seconds-to-37% and is on a slider.

**Camera sway.** A few centimetres of position and a fifth of a degree of
rotation from layered sines at unrelated periods. Applied as an **offset from the
stored placement**, not accumulated, or a long session drifts away from the
framing the crest search picked. This retires the scene's oldest invariant — the
camera was "placed once and never touched" from the original port onwards — so
the notes that said so have been corrected rather than left to mislead.

## 2026-09-12 (foreground filled in)

The previous pass cut the blade count in half while concentrating it, which made
the near field four times denser than it had been — but it was still thin, and on
a wide viewport it read as a half-bald field.

**Aspect ratio is why, and it is worth knowing.** The vertical FOV is fixed, so a
wide frame widens the *ground* in view without adding any height: the near field
has to cover far more world for the same number of blades. A density that looks
full at 16:9 visibly thins on an ultrawide.

Now 480,000 blades at bias 1.75 on a 78-unit disc — ~148,000 within ten metres of
the eye, against ~42,000 last pass and ~9,900 in the original layout. Fifteen
times the original foreground from a count only slightly above it.

Measured on a settled scene, twice: 60 fps, worst frame 17.2 and 18.1 ms.
(An initial reading of 56.6 ms was the load-time shader compile landing inside
the sample window — worth re-measuring after a pause before believing a spike.)

## 2026-09-12 (grass budget spent where it shows)

**`fieldDensityBias` was doing the opposite of what its comment claimed, and the
comment was mine.** The exponent in `r = radius * random^bias` concentrates
blades near the camera as it goes **up**: the fraction landing within distance
`d` is `(d/radius)^(1/bias)`, so 0.5 is uniform density per unit area and the
0.58 in use was near-uniform. Of 420,000 blades only ~9,900 fell within ten
metres of the eye; the rest were spent on distance, where a blade is sub-pixel
and the ground shader already reads as grass.

At bias 1.4 with **200,000** blades, ~42,000 land in that same ten metres. Less
than half the geometry, four times the foreground. Verified numerically across
distance bands before changing anything, because the previous reasoning had been
wrong in writing.

Measured: worst frame back to **17.0 ms** from 26.7 — halving the instance count
paid for the motes added in the previous pass, and the near field looks denser
than it did before.

**The television** is larger (`width` 5.6 → 7.2) and floats higher (`hover`
2.6 → 3.8).

Applied a 54-value config export; 9 values differed. `colors.tip` to a deep blue,
brighter and steadier motes, and a tighter bloom.

## 2026-09-12 (motes; the screen actually lights)

**The screen was lighting an oval, not a screen.** Its shader took a radial
falloff from the centre of the glass, which leaves the corners dark and reads as
a glowing blob sitting inside the cabinet — the bloom was working, it just had a
blob to bloom. Replaced with a **box** falloff: full brightness across the picture
area, softening only at the rim, with a gentle centre lift riding on top. Now the
whole panel is lit, so the whole panel blooms and its edge dissolves. Two sliders
(`edgeStart`, `centreLift`).

**Drifting motes** (`particles.ts`) — one `THREE.Points` draw call, ~1400 of
them. Wander, rise and twinkle are all functions of time and a per-particle seed
evaluated in the vertex shader, so nothing is written from the CPU per frame.
They are `toneMapped: false` and bright enough to clear the bloom threshold, so
the halo around each one is the bloom pass rather than a sprite texture. Rising
motes wrap within their band — nothing is ever respawned — and the band's two
ends fade so they do not pop at the seams.

Eight controls plus the colour. `particles.count` is deliberately *not* among
them: it sizes the buffers, so it needs a rebuild, which is the registry's
standing boundary.

Measured after: 59.5 fps average, worst frame 26.7 ms — up from 17.2 ms. Additive
points are fill-heavy and they also feed the bloom, so this is the first thing
that has actually cost something; still inside frame, but worth knowing before
the count goes up.

## 2026-09-12 (real model, real bloom)

**The procedural cabinet is replaced by `public/assets/grass-hero/tv.glb`** and
the fake halo by an actual bloom pass. ADR-0034.

Four things the model needed, none of them obvious from the file opening fine in
a viewer:

- **Draco.** Its meshes are `KHR_draco_mesh_compression`, so the loader needs a
  decoder; it is vendored from the `three` package into `public/draco/` rather
  than pulled from a CDN — same reasoning as the blade textures.
- **Two malformed textures.** Indices 21 and 30 carry an empty `extensions: {}`
  and no `source`. Every built-in plugin declines them, the default path then
  reads `images[undefined].uri`, and the *entire* load rejects — one bad texture
  costs the whole television. A loader plugin now hands those a white 1×1, which
  is what a missing base-colour map should resolve to anyway. They belong to
  `stand` and `screen-base`, both of which have their own base colour.
- **Orientation.** Authored Z-up with the screen facing −X; the loader yaws it a
  quarter turn so the screen faces local +Z, which is what the light and the
  turn assume.
- **Lights.** It arrives with standard materials and rendered black, because
  ADR-0030 had removed every light on the grounds that nothing read one. Two are
  back, for the set alone.

The screen material is replaced with an emissive shader whose falloff is computed
from the glass's **bounding box**, not its UVs — the model's UV layout is its own
business and the picture has to land exactly on the glass.

**Bloom** is bright-pass + separable Gaussian at quarter res, ping-ponged with a
widening step, added in linear light before the grade. Five sliders. Tuned to
threshold 1.8 / intensity 0.28 / spread 1.1 / 3 passes by dragging them.

`public/**` is now ignored by ESLint — the vendored Draco decoder is third-party
minified code that fails half a dozen rules it was never written against, and
`public/` holds assets, never sources.

Measured after: 60 fps, worst frame 17.2 ms — the extra passes are quarter-res
and do not show.

## 2026-09-12 (second supplied config)

Applied a full panel export — 41 values across colours, television, grade, depth
of field and exposure; 19 of them differed from the defaults. Notable: a pink sun
(`#ff7a95`) tinting every lit blade, near-white haze, a much shorter and far
wider television cone (radius 46 → 11, focus 0.5 → 0.05), a stronger split tone
(0.16 → 0.6) and a near-instant near-blur ramp (`nearRange` 11 → 1).

**Applied and verified by path, not by key name.** The previous pass used the
last path segment to find each value, which is ambiguous — `tv.light.color` and
`tv.halo.color` share the leaf `color`, and `intensity` appears three times under
`tv` alone. This one walks the object literal by brace matching, then reads every
value back and compares against the source list. Worth keeping: a config applied
by ambiguous match can silently write the right value to the wrong key.

The same script also has to handle **inline** object literals — `halo: { size,
intensity, falloff }` sits on one line, so a leaf pattern anchored to the start of
a line does not see it.

## 2026-09-12 (vignette shaped like the frame, and tintable)

The radial falloff was replaced with a **rounded-rectangle** signed distance
field. An ellipse inscribed in a wide frame bites deepest at the middle of each
edge and leaves the corners comparatively bright, which is the opposite of what
a lens does; a rounded box hugs the frame, so the darkening sits in a band of
even width with the corners deepest.

Four scalars and a colour, all on the panel: **amount**, **radius** (fraction of
the frame the untouched plateau covers), **roundness** (0 = square corners,
1 = fully round) and **softness**, plus `grade.vignetteColor`. The colour comes
from switching the composite from `c *= 1 - falloff` to
`mix(c, colour, falloff)` — with black the two are identical, so nothing about
the existing look changed to get it.

A new `uAspect` uniform, updated in `resize()`, keeps the corner radius circular
on screen rather than stretching with the frame.

## 2026-09-12 (the vignette was not a vignette)

**It was a flat multiply over the whole frame, and that is why it read as an
exposure control.** Two faults, one on top of the other:

1. `uVignettePower` was declared in the DOF fragment shader but **never added to
   the material's uniforms**. An unbound uniform reads as 0 in GL, and
   `pow(distance, 0)` is 1 everywhere — so the term collapsed to
   `1 - amount`, a constant. Nothing about it varied with position. This is
   silent: no warning, no error, and `tsc` cannot see it because the shader is
   a string.
2. Even with the exponent bound, `pow()` on distance-from-centre starts
   darkening at the first pixel off centre. There is no plateau, so raising it
   dims everything and it still behaves like exposure.

Rewritten as `smoothstep(radius, radius + softness, distance)`, which has a
genuine untouched centre, and split into the three numbers a vignette actually
needs — **amount**, **radius**, **softness** — all three on sliders. Distance
runs 0 at centre, 1 at the middle of an edge, ~1.41 in a corner, and is measured
in UV without aspect correction so the shape follows the frame rather than being
a circle cropped by it.

Audited the rest: no other uniform is declared in GLSL without being provided.

## 2026-09-12 (brightness restored)

**The vignette default was far too strong and was darkening the whole frame.**
Set to 0.55 when the control was added; measured at 0 the scene is dramatically
brighter, which located it immediately. Turned down to 0.30.

> The explanation given here at the time — "the formula darkens by distance from
> centre, so it takes a quarter off the top middle" — was **wrong**, and the next
> entry has the real one: the term was not distance-dependent at all, because its
> exponent uniform was never bound. Lowering the number treated the symptom.

**Exposure is now a panel control** (`renderer.toneMappingExposure`), and the
default lifted 1.12 → 1.35. It is a renderer property rather than a uniform,
which still satisfies the registry's test — live and free to set — and it is the
one control that answers "everything is too dark" directly instead of by proxy.

Worth recording, because it will come up again: **the sky is deliberately
exposure-independent** (`toneMapped: false`, ADR-0026), so the exposure slider
moves the grass, ground and cabinet but not the sky. Sky brightness lives in its
own colours and in the grade's lift and contrast — all of which are in the panel.

The rest of the difference from the earlier, brighter frame is the screen's halo:
it used to be a wide additive wash lifting a large part of the sky and hill, and
tightening it to match the reference removed that light along with the pink. That
was the requested change, so the brightness is bought back with exposure instead.

## 2026-09-12 (colours back to the supplied config)

**A colour was invented that nobody asked for.** The glow retune added
`tv.halo.color` so the halo could be warm-cream instead of the screen's orange —
a scene colour that existed in no supplied config and that no panel swatch, and
therefore no copied config, could account for. Removed: the halo now shares the
**same uniform object** as `screen.edgeColor`, so the glow is the colour of the
thing glowing by construction rather than by agreement, and there is nothing
extra to keep in step.

Audited every hex literal in the scene config against the supplied one: all 17
match exactly.

**Two colours were unreachable from the panel** and so could never appear in a
copied config either, despite tinting the entire frame — `grade.shadowTint` and
`grade.highlightTint`, the split-tone. Both are now bound, along with sliders for
`grade.tintStrength` (so the split-tone can be turned off outright) and
`grade.lift`. The rule this leaves: **anything that changes a pixel belongs in
the registry**, or a copied config silently understates the scene.

## 2026-09-12 (supplied palette; panel takes scalars)

- **Applied the supplied palette** — a deliberately unnatural one (violet blade
  tips over teal roots, black ground base, pale-yellow flowers).
- **Screen glow retuned to the reference.** It was a wide, low-exponent halo
  spreading a pale disc across the sky, and additive orange over a blue sky reads
  **pink** — which is what made it wrong rather than merely large. It is now
  tight (2.35× the screen, exponent 3.0) with its own warm colour instead of
  borrowing the screen's orange.
- **The set lights the grass far harder** — intensity 9.5 → 34, radius 22 → 46,
  picked by dragging the new slider rather than by guessing.
- **Vignette** gained a falloff exponent and was raised to a visible 0.55.
- **The panel takes scalars, not just colours.** Sixteen sliders across Depth of
  field, Grade and Television, sharing group headings with the swatches so a
  group's colours and its numbers sit together. Per-control reset, reset-all with
  a changed count, and "Copy config" now emits numbers alongside colours, still
  nested by each control's real path in the config.

**A typing trap worth knowing.** The config is `as const`, so a uniform written
as `{ value: CONFIG.tv.light.intensity }` infers the *literal* type `17` and the
panel cannot write to it — `Type 'number' is not assignable to type '17'`. Any
uniform the panel drives needs an explicit `THREE.IUniform<number>`.

Halo spread is applied as **mesh scale** on a unit-sized quad, so it is
draggable; as geometry it would have needed a rebuild per step.

## 2026-09-12 (simpler turn; panel affordances)

**The television's turn is driven by the cursor's screen position, not a world
point.** It could never look *up*, and the reason was structural rather than a
tuning miss: the aim came from raycasting the cursor onto the **ground**, and
there is no ground above the horizon — a cursor in the top of the frame either
hit nothing or hit distant ground at eye level. It now takes the pointer in
normalised device coordinates and nudges yaw, pitch and roll off its rest
attitude by a bounded amount. The amplitude *is* the limit, so the cone-clamping
machinery from the previous pass is gone with it and the set still cannot turn
its back.

**Panel:** a reset button per colour (enabled only when that colour differs from
its default), "Reset all" with a changed count, and "Copy config" — which emits a
snippet nested by each colour's real path in `grass-field.config.ts`, so it
pastes back rather than needing seventeen keys hand-translated.

The clipboard has two failure modes worth knowing: `navigator.clipboard` rejects
without a focused document and a trusted gesture, and is absent entirely on a
non-secure origin. There is an `execCommand` fallback, and if both refuse the
panel shows the snippet in a selectable textarea rather than leaving a button
that appears to do nothing — which is how it was verified here, since an
automated browser pane is never focused.

## 2026-09-12 (shadows, panel, framing)

- **The near hill is unlit by the sun.** Terrain shadows are now baked on a grid
  and sampled by both field shaders (`sun-shadow.ts`, ADR-0032) — with the sun
  low, the crest throws a long shadow back over the foreground, leaving it lit by
  the sky and the television only. No shading term can do this: a slope in shadow
  points the same way as a slope in sunlight.
- **The television turns on every axis and can never turn away.** Yaw, pitch and
  roll are all expressed as deviations from *facing the camera* and clamped to a
  cone around it, so the set banks and tips after the cursor but the screen — the
  light source, and the subject — always stays toward the viewer.
- **The camera frames the set.** It now aims at the television once the crest
  search has placed it, instead of at a hand-set pitch that happened to put it
  near the middle.
- **Bigger, softer screen glow**, and the screen's own rim fades earlier, so the
  bezel edge is swallowed by the halo rather than cutting off against the sky.
- **Flowers recoloured** orange → lilac.
- **Live colour panel** (`scene-controls.tsx`, ADR-0033). Seventeen colours in
  four groups, wired straight to the live uniforms — no rebuild. `LazyGrassField`
  takes `controls`; the home view passes it.

**`verify.sh` had a false positive and it is fixed.** The check for bare
`duration-fast` classes matched the *correct* form,
`duration-[var(--duration-fast)]`, because the token's own name contains the bare
class as a substring — so the first component in this project to use the
prescribed form failed the gate. The pattern now requires the match not be
preceded by a hyphen; a genuine bare class still fails, verified with a throwaway
probe file.

Measured after: 60 fps locked, worst frame 17.1 ms. The shadow bake adds CPU work
at construction (320² grid × 28 steps) — it is a knob in
`grassLight.sunShadow.resolution` if first paint ever needs it back.

## 2026-09-12 (the set turns; late-afternoon sky)

- **The television follows the cursor.** It turns and tips toward the same
  ground hit the breeze already raycasts — the hit is now kept whole rather than
  flattened to XZ, because the set needs the height to tip as well as turn. Eased
  at 0.05/frame and not snapped: the screen *is* a light, so a snap would sweep
  its pool across the field in one frame. Its rotation order is `YXZ` — under the
  default `XYZ` the pitch applies before the yaw and a turned set tips sideways.
- **Clear late-afternoon sky.** Cloud cover cut to 0.06 and a warm band added at
  the horizon, biased toward the sun's side of the dome. A sky that is only a
  vertical ramp has no direction in it; the band is what tells the eye where the
  light is when the sun itself is out of frame.
- **Low sun for the hills** — 22° elevation, and translucency raised to 1.35, so
  the crests rim-light warmly and the slopes fall away into shade. The terrain
  contrast remap moved to `[0.02, 0.62]`: at 22° the raw dot product spans a far
  lower band than it did at 36°, and the old window clipped almost all of it to
  black.
- **Haze is no longer the same colour as the horizon.** With a low sun the sky at
  the horizon goes warm while distant hills stay cool and blue; tying fog to
  `skyHorizon` dragged the hills warm with the sky.

**Two GLSL traps, both hit in one edit.** `flat` is a reserved interpolation
qualifier in GLSL ES 3.0 and cannot name a variable. And a backtick inside a GLSL
comment terminates the JavaScript template literal holding the shader — the same
trap recorded in the density pass, hit again while writing a comment *about* the
first trap. Neither is caught by `tsc`; the first shows up as
`THREE.WebGLProgram: Shader Error`, the second as a Next parse error.

## 2026-09-12 (television and grade)

**A floating television lights the field, and the whole frame is graded.**
ADR-0031.

- **`tv.ts`** — a CRT built from boxes and cylinders: cabinet, recessed bezel,
  emissive screen, rabbit-ear antennas, feet. It drifts on two slow sines and
  the picture is unsteady on two more (per-frame noise reads as a strobe at
  60 fps, not as a flicker).
- **Its screen is a real light on the field.** Both field shaders call the same
  `screenLight()` with shared uniforms — inverse-square falloff, surface facing,
  and a cone term so the light reads as coming from a *screen*. The cone is
  deliberately broader than Lambertian: at a physical exponent the set lit the
  camera and not the grass under it.
- **Placement searches the view ray for the crest.** A fixed 23 m put the set in
  a hollow behind a rise, invisible — the relief is noise.
- **Additive halo** around the screen, standing in for the bloom pass this scene
  does not have. Without it the brightest object in frame has a hard cut-off
  edge and reads as a sticker.
- **Colour grade** in the composite: contrast 1.26, saturation 1.45, a split-tone
  pushing shadows to the sky's blue and highlights to the screen's orange, and a
  vignette. Sky deepened to `#1f63c8` and cloud cover cut to 0.34 — the brief was
  punchy and unnatural, not photographic.
- **Flowers**: the small fraction of blades whose per-instance tint falls in the
  top few percent paint their tips warm. No extra geometry.

Measured after: 60 fps locked, worst frame 17.0 ms.

## 2026-09-12 (full coverage pass)

**No bare ground anywhere.** ADR-0030.

- **The ground plane became grass.** It is now a custom shader on the same
  lighting as the blades, tinted from its own darker ramp with two scales of
  mottling — so a gap in the canopy reads as grass in shade, and the far edge of
  the blade disc stops being a line where grass ends.
- **Fog was reaching only half the scene.** `scene.fog` applies to materials
  that implement it, and the grass shader never did: distant ground hazed to
  pale blue behind fully saturated blades. `scene.fog` is gone; both shaders now
  fog explicitly from one shared pair of uniforms.
- **Both lights removed.** They only ever lit the ground's standard material.
  Once that became a custom shader they lit nothing, so they were costing a
  program and no pixels. `colors.hemisphereGround` / `colors.directional` and
  the whole `lights` block went with them; `hemisphereSky` is now `skyLight`.
- Density raised to 420,000 blades on a tighter 88-unit disc, and blade width
  0.032 → 0.042 — widening is the cheapest coverage there is, since it costs no
  extra vertices.

Measured after: 60 fps locked, worst frame 16.9 ms — unchanged from 300k on this
GPU, which says the scene is fill-bound, not vertex-bound. That is worth knowing
before anyone tries to buy performance by cutting the blade count.

## 2026-09-12 (density and variation pass)

**Shorter, denser, and no longer one moulded mass.** ADR-0029.

- **Blade height halved** (`blade.height` 1 → 0.5) and the count raised to
  300,000 over a tighter 95-unit disc. `pointer.strength` dropped 1.4 → 0.5 to
  match: on a half-height blade the old value displaced the tip by three times
  its own length.
- **Heights now clump.** A patch field sets the local mean, a skewed draw picks
  within it, so tall blades are stragglers rather than half the field.
- **Per-blade variation** — brightness tint, a straw fraction, per-blade gloss —
  plus canopy occlusion derived from how short a blade is relative to its patch.
- **Large-scale contrast:** drifting cloud shadows over the field, and the
  terrain shading term remapped from the ~0.5..1.0 the dunes actually span to
  the full range.
- `eyeHeight` dropped 2.6 → 1.3 to follow the canopy down.

**Watch the shader link.** A missed attribute declaration produced the exact
same symptom as a failed alpha map — bare hill, perfect sky, no grass. The
console says which: `THREE.WebGLProgram: Shader Error` with the offending line,
and `gl.getError()` returns 1282. Check there first before suspecting textures.

Measured after the change: 60 fps locked, worst frame 16.8 ms, on a desktop
GPU at DPR 1.5. Still nothing from [[optimize-3d-scene]] applied — a phone
renders all 300,000.

## 2026-09-12 (lighting pass)

**Grass given a real lighting model; sky given volume.** The re-grade above got
the composition and colour right but the result still read flat, with matte
grass and stamped-on clouds. Three fixes, all in-shader:

- **Two coloured lights instead of one scalar** — warm sun, cool sky, plus a
  bounce term in the blade's own colour so hollows stay green rather than going
  grey. Ambient dropped to 0.46 against a 0.9 sun: a high ambient floor is
  precisely what flattens a field.
- **Specular and translucency**, per fragment. The highlight is weighted toward
  the tip so only blades leaning into the light flare; the translucency term is
  what a thin blade does when lit from behind. Both need the normal flipped
  toward the viewer, not `abs()`-ed.
- **The sun moved to side-on** (azimuth 140° → 75°, elevation 58° → 36°). Not
  cosmetic: a sun in front of the camera cannot form a specular lobe back toward
  it at all, so the blades stayed matte however high `specular` went. ADR-0028.
- **Clouds rebuilt on billow noise** (fbm over folded, absolute-valued noise)
  with a domain warp, a second high layer, and self-shadowing from a second
  sample taken toward the sun. Plain fbm thresholded at any level is a blurry
  stain — it has no crease for a cumulus edge to form on.

Cloud coverage and scale are the two dials that took the most back-and-forth;
they are `sky.cloudCover` and the `cp` scale in the sky shader.

## 2026-09-12 (later)

**Grass field re-graded to a photographic reference.** The scene was ported
faithfully from the pmndrs original first; this pass moves it to the look in the
brief — rolling dunes, bright sunlit green, soft form shading, a low in-canopy
camera and shallow depth of field. What changed:

- **Depth of field**, the scene's only post pass — offscreen half-float target
  with a depth texture, composited by a hand-written near/far blur. ADR-0026,
  which also records the trap it hid behind: three forces linear output into any
  render target, so the composite pass has to do the sRGB encode. Until it did,
  the frame displayed un-gamma-corrected and read as a *lighting* problem.
- **Relief** is now configurable octaves (`terrain` in the config) tuned to
  rolling dunes rather than one broad swell, and the ground mesh runs 420 units
  so the hills carry to the horizon.
- **Blades scatter on a disc centred under the camera**, not an 85-unit square —
  the square's far edge was visible in frame as a line where grass stopped.
  Same 190k budget, biased toward the eye. ADR-0027.
- **The camera is aimed by yaw/pitch** at a terrain-relative eye height, and its
  standing point was chosen by scanning the seeded height field for a mound
  cresting just below the eye line. Aiming at a ground-relative *point* tilted
  the shot up and lost the foreground bokeh entirely — twice.
- **Grass is lit.** It was unlit geometry, so mounds and hollows shaded
  identically and the relief read flat however good the silhouette was. Each
  blade now carries a baked `groundLight` (terrain normal vs sun) plus its own
  facing term, with contact shade at the root.
- **Sky**: fair-weather cumulus with a clump gate and grey undersides. The cloud
  fade ramp reached full only at `d.y = 0.75`; this camera looks near-horizontal
  and never sees above ~0.4, so every cloud in frame was being multiplied down to
  a pale wash.
- `--raw-color-sky-horizon` moved to `#cfe4f5` to stay in sync with the scene's
  `skyHorizon` — they are twins by necessity, see [[design-system]].

Performance is unmeasured after this pass: the added post pass, the 420-unit
ground and the wider blade disc all cost, and none of [[optimize-3d-scene]] has
been applied yet.

## 2026-09-12

**Grass-field WebGL hero on `/`.** The home view is no longer empty: it renders
an instanced grass meadow — ~190,000 blades on a seeded, noise-displaced hill
under a procedural sky dome, one instanced draw call, locked camera, and a
cursor breeze that bows nearby blades and trails behind the pointer. Ported from
the pmndrs `grass-shader` example into `src/components/scene/grass-field/`;
full description and traps in [[components/scene]].

- **New dependency: `three` 0.160.1** (+ `@types/three`). Pinned, not floating:
  the fragment shaders use `#include <colorspace_fragment>`, which exists only
  from r0.152. See [[tech-stack]].
- **New `src/components/scene/` namespace** for WebGL scenes, with the mounting
  contract (client leaf → `dynamic ssr:false` → shared ticker → named constants).
  ADR-0024 in [[decisions-log]].
- **Blade textures** (diffuse + alpha) are committed to
  `public/assets/grass-hero/` rather than hot-linked. Same-origin is a
  correctness requirement, not a preference: a tainted or failed alpha map
  samples as 0, every fragment hits `discard`, and the field silently vanishes.
- **New design token** `--scene-backdrop` (Tier 2, from `--raw-color-sky-horizon`)
  — painted behind the canvas until the first frame lands, and left visible when
  a device has no WebGL. Mirrors the scene's `skyHorizon`; keep the two in sync.
- **`body` is no longer a centring flex box** (ADR-0025). The starter's
  `align-items:center` made the `ScrollLayout` wrapper shrink-to-fit, so the
  full-bleed hero resolved `w-full` against a zero-width parent and the canvas
  rendered **0px wide** — a blank page with a working scene behind it. This one
  bit for a while; if a full-bleed section ever collapses again, look at `body`
  first.
- **Placeholder copy** moved into `src/data/mocks/home.ts` — the hero `<h1>` is
  `sr-only`, since the composition is the scene. Swap in real copy when the
  design has one.

Not done, and deliberately left to the first performance pass
([[optimize-3d-scene]]): no bot poster (§1), no device tiering or frame budget
(§2/§5), and the blade count does not drop on a phone.

## 2026-09-08

**`optimize-3d-scene` skill — resize no longer switched off on touch.** §13 of
the skill (and `patterns.md` §5 / §14) told agents to attach *no* `resize`
listener on the mobile tier, to dodge the iOS URL bar. That also removed the
only path that could react to a breakpoint drag, a rotation or DevTools
emulation being turned off, so a scene loaded as a phone kept its phone
framebuffer, frame budget, parked pointer and hidden desktop passes on a desktop
viewport and rendered skewed. The skill now listens on every tier, ignores
height-only changes on a coarse pointer, and re-reads the tier on a width
change or a pointer-media-query flip, with a `retune()` that re-applies DPR,
budget, visibility, draw range and pointer binding without compiling a program.
§2 and §11 of `SKILL.md` and the [[optimize-3d-scene]] workflow note were
updated to match; §14 gained a tier-switch round-trip check. Reasoning in
[[decisions-log]] ADR-0023. Measured on the project that surfaced it: phone
390×844 / 3 draws ↔ desktop 2160×1350 / 4 draws, program count unchanged.
