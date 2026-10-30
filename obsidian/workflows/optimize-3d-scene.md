---
tags: [workflow, skill, performance, 3d, stable]
updated: 2026-09-14
---

# Workflow — Optimise a 3D Scene (skill)

Registers the **`optimize-3d-scene`** Claude Code skill
(`.claude/skills/optimize-3d-scene/`) as part of this project's workflow set, and
maps its canonical patterns onto the primitives this starter already ships.

> [!important] Routing rule
> **When a performance request lands on a project that carries a three.js /
> WebGL scene, invoke the `optimize-3d-scene` skill before doing anything else.**
> It is the source of truth for that work — do not improvise a different order
> of fixes. This is codified as AGENTS.md hard rule #11.

## When it triggers

Invoke the skill when **both** are true:

1. The request is about performance, jank, or shipping readiness — *"optimise the
   3D"*, *"the scene lags on mobile"*, *"micro freezes / jank on scroll"*,
   *"make the scene mobile-friendly"*, *"reduce the WebGL cost"*, *"why is
   Lighthouse red"*, or a pre-ship pass on a project that carries a scene.
2. The project actually renders WebGL — `three` (or `@react-three/fiber`) is in
   `package.json`, **or** there is a `<canvas>` driven by a hand-written
   `getContext("webgl")` render loop. Raw WebGL is fully in scope; only §0's
   measurement primitives change.

If the project has **no** scene, this note does not apply — performance work then
belongs to [[animation-system]] (spring/ticker cost) and [[seo-metadata]] (bot
path, metadata, bundle).

> [!success] Applied 2026-09-14 — ADR-0042
> A full pass (§0–§14) was run on the grass scene. Measurements are from a
> production build in Chromium emulation:
>
> | Measure (production build, `next start`) | Before | After |
> |---|---|---|
> | `three` (630 KB) in first-load JS | **yes**: the barrel re-exported `GrassField` | no, its own chunk |
> | Hydration long task | 701 ms | 270–300 ms |
> | Scene build / compile long task | 108 ms build + 59 ms | build sliced ≤ 8 ms/frame; 67–79 ms async compile + upload |
> | Programs, all linked before handoff | 12 ✓ | 12 ✓ (bend/spring now prewarmed on every tier) |
> | Desktop 1440×800 @1.5: buffer / fps / draws | 2160×1200 / 60 / 30.6 | 2160×1200 / 60 / 30.6 |
> | Phone 375×812 @2: buffer | 750×1624 | **375×812** (¼ of the pixels) |
> | Phone: scene fps / draws per frame | 60 / 30.75 | **30** (rAF 60) / **26** |
> | Phone: pointer listeners on canvas | 1 | 0 |
> | Phone: blades / motes | 480 k / 1400 | 220 k / 600 |
> | Phone: largest texture upload | 1024² (×30 TV maps, ≈160 MB VRAM) | 512² (≈40 MB) |
> | Context flags | alpha, **antialias**, **stencil** | antialias off, stencil off (three r160 always requests alpha) |
> | Tier round trip phone → desktop → phone | — | 375×812 → 2160×1200 → 375×812; 31 → 61 → 31 fps; 26 → 30.6 → 26 draws; listeners 0 → 1 → 0; **programs 12 throughout** |
>
> Still open:
> - §12 KTX2: the GLB needs a re-export before gltf-transform can process it.
> - A real-iPhone check of §13's URL-bar behaviour.
> - A real-device reduced-motion freeze check.
> - A Lighthouse run of the bot path with its user agent.
>
> The older notes below describe the scene before this pass.

> [!important] This project carries a scene — the routing rule is live
> `three` 0.160.1 was added on 2026-09-12 for the grass-field hero on `/`
> (`src/components/scene/grass-field/`, catalogued in [[components/scene]]).
> Any performance, jank or ship-readiness request now **must** invoke the
> `optimize-3d-scene` skill first.
>
> Nothing from the skill has been applied yet — the scene was ported faithfully,
> then re-graded for looks, never profiled. Outstanding on a first pass: §1 (no
> bot poster; `three` is fetched by every visitor), §2/§5 (no device tier, no
> frame budget — the 480k blade count is the same on a phone), §11 (the pointer
> listener is attached on touch too). §3 and §13 are partly satisfied: the scene
> is code-split behind `dynamic ssr:false`, disposes on unmount, and the canvas
> is `h-lvh`.
>
> **§6 now has teeth here.** The scene gained a depth-of-field post pass
> (ADR-0026), so there is an offscreen render target as well as a renderer. It is
> DPR-clamped in `resize()` alongside the renderer — keep it that way; clamping
> one and not the other throws the whole saving away. The pass is a full-screen
> 29-tap gather, so it is pure fill cost and the first thing to tier down.

## What the skill does

Fourteen steps, applied **in order** — cheapest and highest-impact first. Full
text in `.claude/skills/optimize-3d-scene/SKILL.md`; reference code in
`references/patterns.md`.

| § | Step | The point |
|---|------|-----------|
| 0 | Audit first, on a valid footing | Baseline `renderer.info.render` / `.programs` / `.memory` — or, on a **raw WebGL** scene, the `getContext` hook you install first. Plus the environment rules: production build, fresh server, `waitUntil: "load"`, counted quantities only. |
| 1 | Never ship the scene to a bot | Crawlers get a static poster, and the `three` chunk is never fetched or evaluated. The poster is for screenshots and the no-WebGL fallback — *not* layout stability. |
| 2 | Tier the device at construction, re-read on a real change | One module owns what "mobile" means; DPR, counts, bloom and frame budget all read from it. Held in a mutable slot; a width change or a pointer-media-query flip re-reads it and `retune()` re-applies every tier-derived value without compiling a program ([[decisions-log]] ADR-0023). |
| 3 | Prewarm **everything** in the loader | Compile, link, upload, allocate *and decode* before handoff — the rule that kills micro-freezes. Also where §1's code-split fights §3, and where the preload-credentials trap bites. |
| 4 | Render only when visible | Gate on `document.hidden` + in-view + canvas actually visible. Biggest saving on a scroll site. |
| 5 | Frame budget per tier | 30 fps mobile / 45 tablet / uncapped desktop — measuring ~26 fps, because of how the ticker throttles. |
| 6 | Clamp pixel ratio — **and the composer** | A 3× phone renders 9× the fragments. Clamping the renderer but not `EffectComposer` throws the saving away. |
| 7 | Cut fill, not detail | Particle counts, bloom, additive overdraw, renderer flags, shadows. On a *baked* point buffer, check ordering before truncating. |
| 8 | Fewest lights the look survives | One key + IBL; a light-count change recompiles every program. |
| 9 | Transforms on the GPU | Scroll drives a uniform, never a per-object JS loop. |
| 10 | Smooth scroll progress on touch | Low-pass once upstream (`k ≈ 0.22–0.3`), snap on page jumps. |
| 11 | No cursor interactivity on mobile | Don't attach the listener; gate on "pointer has actually moved". |
| 12 | Compress assets | Draco geometry (local decoder), KTX2/Basis textures, per-tier size caps. |
| 13 | The iOS flicker details | Resize listener on **every** tier, ignoring height-only changes on a coarse pointer (the URL bar) — *not* "no resize on touch". **Canvas `lvh` / content `dvh`**, promoted compositor layer, clamped `dt`, dispose on unmount. |
| 14 | Verify, then write it down | Re-measure §0 on the same footing; program count must be **stable after the loader**. |

> [!warning] The three traps that cost the most time in the field
> 1. **§0 assumes three.js.** A raw WebGL scene has no `renderer.info` — you must
>    build the instrumentation before you can measure anything, and the skill now
>    ships the `getContext` hook that does it.
> 2. **Dev-mode numbers are invalid.** Eager chunk serving fakes a §1 failure;
>    Strict Mode's double-mount fakes doubled listeners and a halved frame rate.
>    Always `build` + `start`, and kill the old server first.
> 3. **§1 breaks §3 by construction.** `dynamic(ssr: false)` means the scene
>    can't compile until after hydration — measured at 5.0 s against a loader
>    that lifted at 2.36 s. Gate the loader on scene-ready, not on a duration.
> 4. **"No resize on touch" was a bug, not a rule.** The first cut of §13 removed
>    the resize listener entirely on the mobile tier. That also removed the only
>    path that could notice a breakpoint drag, a rotation or DevTools emulation
>    being switched off — the scene kept the phone buffer on a desktop viewport
>    and drew skewed. Fixed 2026-09-08 (ADR-0023): listen everywhere, skip
>    height-only changes on a coarse pointer, retune on a tier change.

## Mapping onto this starter

The skill's canonical implementations live in a separate workspace
(`getlayers-projects/` — `helion`, `mycelia`, `stride`, `clarix`) and are **not
part of this repo**. Several of them already have an equivalent here — use the
local one rather than porting a second copy:

| Skill pattern | Use in this project |
|---|---|
| one shared rAF for the whole page (§4) | `subscribeToTicker` — `src/lib/animation/ticker.ts`, per-subscriber throttling built in ([[decisions-log]] ADR-0009). Also serves §5's frame budget. |
| bot detection (§1) | `isBot()` — `src/utils/is-bot.ts`, already used for the SEO path ([[seo-metadata]], ADR-0010). |
| scroll progress source (§9, §10) | The Lenis scroll store — [[smooth-scroll]]. Read it once per frame inside the ticker; never in a scroll handler that also writes styles. |
| in-view gating (§4) | `useDynamicInView` / `useInViewRef` — [[hooks]]. Give the observer a ~1 viewport `rootMargin` so the scene is warm on arrival. |
| viewport sizing (§13) | `heightLvh` / `minHeightLvh` — `src/utils/lvh.ts` — for the **canvas**, so a collapsing URL bar never re-allocates the framebuffer. Lay the **content** out in `dvh` instead, or the bottom of the page hides behind that same URL bar. Canvas `lvh`, content `dvh`. |
| device tiering (§2) | **Not present yet.** Add `src/lib/scene/device.ts` on the first perf pass, and document it in [[utils]]. |
| where a scene lives (§2, §3) | `src/components/scene/<scene>/` — config module, GLSL, client leaf, `dynamic ssr:false` wrapper ([[decisions-log]] ADR-0024). |

## How it sits with the hard rules

- **Rule 1 (all motion is spring-based)** is about DOM/React motion. A WebGL
  render loop is not DOM motion and is not governed by it — but everything
  *around* the canvas (reveals, overlays, loader UI, section transitions) still
  is: springs from [[animation-system]], text from [[text-engine]], no CSS
  keyframes.
- **Rule 2 (`#do-not-modify` engine)** stands. The scene subscribes to the
  ticker; it never edits `src/hooks/animation/` or the spring components.
- **Rule 4 (no hardcoded values)** applies to tier constants too — DPR clamps,
  particle counts and frame budgets belong in the scene's device module as named
  constants, not sprinkled through the render code.
- **Rule 6 (Server Components by default)** — the scene is a `"use client"` leaf
  loaded with `dynamic(..., { ssr: false })`, which is also what keeps `three` in
  its own chunk for §1.

## After running it

Per §14 and the [[ai-agent-guide]] rules, in the same turn:

- Behaviour or measurable performance change → [[changelog]], with the
  before/after numbers.
- A trade-off chosen (a look sacrificed for a tier, a pass dropped) → an ADR in
  [[decisions-log]] **with the reasoning**.
- A new module (`device.ts`, a scene util, a hook) → [[utils]] or [[hooks]].
- `three` and any loaders/compressors added → [[tech-stack]].

## Related

- [[ai-agent-guide]] — rules of engagement; lists the skill routing rule
- [[animation-system]] — the ticker and spring primitives the scene shares
- [[smooth-scroll]] — the scroll source a scroll-driven scene reads
- [[seo-metadata]] — the bot path §1 hangs off
- [[decisions-log]] ADR-0009 (shared ticker), ADR-0010 (SEO/perf hardening),
  ADR-0016 (this registration)
