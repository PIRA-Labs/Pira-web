---
tags: [frontend, 3d, stable]
updated: 2026-09-14
---

# Catalog — Scene Components

Files in `src/components/scene/` — WebGL scenes. One folder per scene, each
self-contained: config, geometry/material construction, GLSL, and the React leaf
that mounts it. Conventions: [[component-conventions]]. ADR: [[decisions-log]]
ADR-0024.

> [!note] Why a third namespace next to `ui/` and `common/`
> A scene is neither a design-system primitive nor provider-dependent
> infrastructure. It owns a canvas, a GPU context and a render loop, and it is
> reusable across pages — so it gets its own namespace rather than being welded
> into the view that happens to use it first.

## GrassField — `grass-field/`

An instanced grass meadow under a procedural sky: ~480,000 blades on
noise-displaced dunes, drawn in **one** instanced draw call, with a locked
in-canopy camera, shallow depth of field, a graded punchy look, a floating
television that lights the field from the crest and turns to follow the cursor,
and a cursor-driven breeze. Ported from
the pmndrs `grass-shader` example, then re-graded to a photographic reference
(ADR-0026, ADR-0027).

| File | Role |
|------|------|
| `grass-field.config.ts` | Every tunable as a named constant — counts, colours, camera, wind, pointer, texture paths |
| `tv.ts` | The floating CRT — a Draco-compressed glTF model, and a light source for the field |
| `particles.ts` | Drifting motes — one `Points` draw call, animated entirely in its vertex shader |
| `sun-shadow.ts` | Bakes terrain sun-visibility to a `DataTexture` both field shaders sample |
| `scene-controls.tsx` | The live tuning panel. It writes straight to the uniforms and is lazy-loaded from `grass-field.tsx` only when `controls` is set. It is not mounted on `/` (removed 2026-09-14). |
| `terrain.ts` | `mulberry32` PRNG, seeded 2D simplex, the shared height sampler, `terrainNormal` (bakes the per-blade ground light) and `createNoise2D` (separately-seeded field for height clumping) |
| `shaders.ts` | GLSL for the blades, the ground, the sky dome and the depth-of-field pass |
| `create-grass-scene.ts` | Builds the three.js graph + the DOF pipeline; returns `{ render, resize, setPointer, parkPointer, dispose }` |
| `grass-field.tsx` | `"use client"` leaf — canvas, ticker subscription, pointer listeners, teardown |
| `lazy-grass-field.tsx` | `next/dynamic` `ssr:false` wrapper — keeps `three` out of first-load JS |
| `index.ts` | Barrel with **only** `LazyGrassField` and the `GrassFieldProps` type. Re-exporting `GrassField` here put the whole `three` chunk in first-load JS (ADR-0042). Import anything else from its own file. |

**Mounting** — from a Server Component view:

```tsx
import { LazyGrassField } from "@/components/scene/grass-field";

<section className="relative h-lvh w-full overflow-hidden bg-scene-backdrop">
  <LazyGrassField
    className="absolute inset-0 block h-full w-full"
    controls
  />
</section>
```

**Device tiers and the load pipeline (ADR-0042).** The component reads
`deviceTier()` from `src/lib/scene/device.ts`.

- **Construction.** It passes the tier into `createGrassScene`, which sizes DPR,
  blades (`instanceCount`), motes (`setDrawRange`), offscreen MSAA, bloom and
  the TV texture cap from `CONFIG.tiers`.
- **Retune.** A width change or a pointer-media-query flip calls `retune(tier)`,
  which never compiles a program. A height-only resize on a coarse pointer is
  ignored.
- **Drawing.** It draws only while `!document.hidden` and the canvas is within a
  viewport of the screen, under `frameBudgetMs(tier)`.
- **Freeze tier.** Reduced motion, or energy saver on mobile, skips the gust and
  stops drawing 1.2 s after the reveal.

Loading, in order, all under the preloader:
1. The blade buffers fill in 8 ms slices, reporting half the progress.
2. The textures and the GLB settle.
3. `prewarm()` runs `initTexture` on every texture, draws the bend and spring
   passes once, and calls `compileAsync(scene, camera)` with the offscreen
   target bound.
4. One full frame is drawn, then `onReady`.

**Load signals (ADR-0040).**
- `GrassField` / `LazyGrassField` take `onLoadProgress(fraction)` and `onReady()`.
- Every request goes through one scoped `THREE.LoadingManager`: both textures,
  the GLB and the Draco decoder.
- `onReady` fires after a frame has been drawn with both textures and the TV
  settled, so shader compilation is already paid for.
- A failed TV load still settles, and a missing WebGL context calls `onReady`
  immediately.
- On `/` these are wired through `PreloadedGrassField` ([[components/common]]).

`controls` (off on `/` since 2026-09-14) mounts the live settings panel (ADR-0033) — colour swatches and
scalar sliders grouped together, a reset per control, reset-all with a changed
count, and a "Copy config" that emits a snippet nested by each control's real
path in `grass-field.config.ts`, ready to paste back. Drop the prop and the scene
renders exactly as before with no panel and no panel code path — it is the only
thing that renders DOM inside the canvas section, so it is also the only reason
that section has anything to stack above the canvas.
The panel sits at `top-20 right-4`, below the hero header's hairline, so it
doesn't cover the "Get started" pill. The home view's UI overlay is a separate
layer stacked above the canvas (ADR-0037).

The canvas is `aria-hidden` (decorative); the section still needs an accessible
name and the page its single `<h1>` — see [[html-semantics]].

### How it works

- **One seed, two streams.** `GRASS_FIELD_SEED` (2241217164) shuffles the simplex
  permutation table for the relief; `SEED ^ 0x9e3779b9` drives the blade layout.
  No `Math.random()` anywhere, so the meadow is identical on every load.
- **One height sampler** feeds the ground mesh, every blade's Y offset *and the
  camera height*, which is why blades sit exactly on the surface and the eye
  stays in the canopy however the relief is retuned.
- **Blades scatter on a disc under the camera**, heavily biased toward it. A
  square field ends on a visible line where grass stops; a disc past the horizon
  does not. The bias exponent runs the counter-intuitive way — **higher puts more
  blades near the eye** — and getting it wrong is expensive without looking
  wrong: at 0.58 the field was near-uniform by area and spent most of its budget
  on sub-pixel distance. At 1.75 on a 78-unit disc, ~148,000 blades land within
  ten metres of the eye, against ~9,900 before.
- **…and only within the arc the camera sees (ADR-0039).** The camera never
  turns, so the disc was cut down to a 115° wedge on its heading
  (`fieldArcDegrees`). Before that, ~3/4 of the 480k blades sat behind or beside
  the lens. With every blade in frame, the bias dropped from 1.75 to 1.3. The
  near field stays denser than before, and the 20–45 unit hills under the
  television are ~4× denser, so they no longer show bare ground. It held 60 fps
  at 1440×800 @1.5x.
- **Judge foreground density on the widest viewport you support.** The vertical
  FOV is fixed, so a wide frame widens the ground in view without adding height,
  and the near field covers far more world for the same blades. Full at 16:9 can
  be visibly bald on an ultrawide.
- **The camera is aimed by angle** (`yawDeg`/`pitchDeg`), never at a ground point
  — see the warning below. Its standing point came from scanning the seeded
  height field, not from nudging numbers (ADR-0027).
- **The motes are lit by the bloom**, not by a sprite: they are
  `toneMapped: false` and bright enough to clear the threshold, so each one's
  halo comes from the same pass as the screen's. Their motion is a function of
  time and a per-particle seed in the vertex shader — nothing per frame from the
  CPU.
- **Mote size follows the viewport.** `particles.size` is in pixels, so a small
  canvas used to show the same-sized motes over a smaller frame. `setViewport()`
  (called from `resize`) scales them by
  `min(width / 1440, height / 800)`, clamped to `[minViewportScale (0.4), 1]`. It
  never scales up, so large screens look as tuned.
- **The glow is a real bloom** (ADR-0034): bright-pass and separable Gaussian at
  quarter resolution, added to the composite in linear light before the grade.
  This is the only thing that dissolves the screen's *own* edge — an additive
  quad glows around the set and leaves the bezel as sharp as it was.
- **The set is a loaded model**, and there are lights again — for it alone. It
  arrives with standard materials, unlike everything else here, so without one it
  renders black.
- **The television is a light, not a `THREE.Light`** (ADR-0031). Its screen hands
  both field shaders a position, facing, colour and intensity through shared
  uniforms, so the warm pool under the set is continuous across the grass and the
  ground. The cone is broader than Lambertian on purpose — at a physical
  exponent the screen lit the camera and not the grass beneath it.
- **The set follows the pointer** on all three axes, eased rather than snapped —
  the screen is a light, and a snap would sweep its pool across the field in one
  frame. It takes the cursor in **normalised device coordinates** and nudges yaw,
  pitch and roll off a rest attitude that faces the camera. The nudge's amplitude
  is its own limit, so there is no clamping and no way to turn its back. Rotation
  order is `YXZ`; under the default `XYZ` a turned set tips sideways instead of
  back.
- **The camera frames the set**, aiming at it once the crest search has placed
  it — not at a hand-set pitch that happens to put it near the middle.
- **Terrain casts sun shadows** from a grid baked at construction (ADR-0032).
  This is what leaves the near hill lit only by the sky and the television.
- **Colours and scalars are editable live** through `colorControls` /
  `setColor` and `numberControls` / `setNumber` on the scene handle, which the
  panel drives (ADR-0033). Sky and fog entries are flagged
  `linear` — those uniforms hold linear light, and setting them from a hex
  without converting silently lightens them.
- **The sky has a direction.** A warm band at the horizon, biased to the sun's
  side, is what tells the eye where the light comes from while the sun stays out
  of frame. Aerial haze is deliberately *not* the same colour as the horizon —
  with a low sun the sky goes warm there while distant hills stay cool and blue.
- **The set is placed by searching the view ray for the crest**, like the camera
  (ADR-0027). A fixed distance dropped it into a hollow behind a rise, invisible.
- **The look is graded** at the end of the composite, in display space: contrast,
  saturation, a split-tone (shadows to the sky's blue, highlights to the screen's
  orange) and a vignette. Grading linear light does not behave like the numbers
  suggest.
- **The ground is grass, not soil** (ADR-0030). It runs the same lighting as the
  blades from the same constants, tinted from its own darker ramp, so a gap in
  the canopy reads as grass in shade and the far edge of the blade disc stops
  existing. Nothing else fills those gaps — at any blade count a canopy has them.
- **Lights exist only for the loaded model.** The grass, ground and sky are
  custom shaders that never consult the light list, so the two lights in the
  graph illuminate the television and nothing else (ADR-0030, amended by
  ADR-0034). Adding one expecting it to touch the field will do nothing.
- **No two blades are the same.** Each carries a `variation` attribute — a
  brightness/colour tint (a fraction tinting to straw), and a canopy occlusion
  from how short it is relative to its patch. Gloss varies with the same tint.
  Sharing one ramp across the field is what made it read as moulded (ADR-0029).
- **Heights clump.** A patch field sets the local mean and a skewed draw picks
  within it, so tall blades are stragglers. A flat random gives an even spread of
  every height everywhere, which grass does not do.
- **Contrast has a large-scale source**: cloud shadows drift across the field,
  and the terrain term is remapped from the narrow ~0.5..1.0 that gentle dunes
  actually span. Per-blade shading alone cannot make a field look lit from
  somewhere.
- **Blades carry their own lighting**, per fragment (ADR-0028). A warm sun and a
  cool sky, never one scalar; wrapped diffuse so the shadow side is not black; a
  per-instance `groundLight` baked from the terrain normal mixed with the blade's
  own facing, so a mound reads as a mound *and* the blades break up; a specular
  lobe weighted toward the tip; translucency for back-lit blades; a bounce term
  in the blade's own colour; and contact shade at the root.
- **Depth of field** is the only post pass: the scene renders to an offscreen
  half-float target with a depth texture, and a hand-written shader gathers a
  golden-angle spiral scaled by the circle of confusion. Near and far ramp
  independently — the foreground dissolves, the distance only softens.
- **Blades bend, not swing.** The base plane is translated up by half its height
  so its origin is at the root; the vertex shader slerps from a pure-yaw
  quaternion to the blade's own orientation weighted by height fraction, which
  twists a flat quad into something that reads as a curved blade.
- **Wind is a travelling band.** Noise samples `(time - offset.x/50, time -
  offset.z/50)` — time added on both axes while position is subtracted, so gusts
  scroll diagonally instead of jittering per blade.
- **The reveal gust (ADR-0041).** `scene.gust()` fires when `GrassField`'s
  `gust` prop flips true (on `/`, when the preloader lifts). **A strong wind is a
  lean, not a faster noise.** The first version multiplied the per-blade sway
  (×2.3) and the noise speed (×4); every blade thrashed on its own and it read
  as static. Now the gust is mostly `windLean`: a shared bend in the wind's
  direction (peak half-angle `windGust.lean` 0.28 ≈ 32°). A long wave
  (`sin(dot(offset.xz, (0.707, 0.707)) × 0.22 − windTime × 6)`, ~28 units,
  rolling downwind) modulates it by `windGust.wave` (0.45). Sway (×1.2), noise
  speed (×1.5), motes (×2) and clouds (×3) are only nudged.
  - **Envelope.** Smoothstep rise over `attack` (1.1 s), then a Gaussian calm
    `exp(−((t−attack)/calm)²)` (`calm` 2.2 s). Both halves have zero slope at the
    peak, so the gust never visibly turns. It is settled by ~6 s.
  - **Clocks.** The wind, sky and mote clocks are integrated
    (`clock += delta × boost`), so speed changes never jump the motion. The
    grass has its own `windTime`, because `time` also drives the cloud shadows
    it shares with the ground.
  - **Panel.** *Wind* → lean / wave / sway / ripple speed / rise seconds / calm
    seconds.
- **The field remembers where it was trodden.** The pointer raycasts the
  *ground* (never the 480k instances — they exist only on the GPU) and its path
  is stamped into a small ping-ponged bend map: RG the push direction, B the
  depth. The map fades a little every frame, and **that fade is the recovery** —
  it is the only reason a blade stays down after the cursor has gone. The stamp
  covers the whole segment travelled since the last frame, because at speed the
  cursor crosses metres between them.
- **The blades have inertia (ADR-0038).** The grass does not read that trail map.
  It reads a second ping-ponged pair where every texel is a damped spring:
  RG holds displacement, BA holds velocity, and the target is the trail's
  direction × depth. A dent builds up behind the cursor (~0.22 s to 63 %, peak at
  ~0.5 s) and overshoots by ~15 %. When the dent recovers, the blades swing back
  and settle. The stamped pointer itself eases on real time (`pointer.follow`,
  in seconds) instead of a per-frame lerp. Tuning lives in `pointer.follow` and
  `pointer.spring.{frequency, damping}`, and the panel exposes both under
  *Pointer*.
- **The dent is distance-compensated.** `radius` and `strength` are world units,
  so on the hills under the television (20–40 units out) the dent used to be a
  few pixels wide. Beyond `pointer.distanceReference` (10), the stamp radius
  grows with the path's distance from the camera, up to `farRadius` (×1.75). The
  push grows with each blade's own distance, up to `farStrength` (×3). Both are
  clamped to ×1 up close, so the near hill looks exactly as before. Panel:
  *Far boost from*, *Far radius x*, *Far depth x*.

### The traps

> [!warning] `scene.fog` reaches only materials that implement it
> Every material here is custom, and none of them implement three's fog chunks.
> For a long time that meant the ground was fogged and the blades were not:
> distant hills hazed into the sky behind fully saturated grass, and the two came
> apart at the horizon. Both shaders now fog explicitly from one shared pair of
> uniforms. Anything added to this scene must do the same, or it will not belong
> to the same world. ADR-0030.

> [!warning] Aim a prop by screen position, not by a ground raycast
> An earlier version aimed the set at the cursor's intersection with the ground,
> and it could not look up — there is no ground above the horizon, so a cursor in
> the top of the frame missed everything or hit distant ground at eye level. The
> breeze still uses the ground hit, correctly: it needs a place on the field.
> Anything that needs to point *at the viewer's attention* wants the screen
> position.

> [!warning] The clipboard has two ways to refuse
> `navigator.clipboard.writeText` rejects without a focused document and a
> trusted gesture, and does not exist at all on a non-secure origin — a panel
> opened on a phone over a LAN IP hits the second. The panel tries `execCommand`
> next and, if that also fails, shows the snippet in a selectable textarea. Don't
> reduce this to the modern call alone.

> [!note] The vignette is a rounded box, not a radial falloff
> An ellipse inscribed in a wide frame darkens the middle of each edge hardest
> and leaves the corners brightest — backwards from a lens. The composite uses a
> rounded-rectangle SDF instead, worked in height-relative units (x scaled by
> `uAspect`) so the corner radius is circular on screen. It mixes toward
> `grade.vignetteColor` rather than multiplying down, which is what makes it
> tintable; with black the two are identical.

> [!warning] One malformed texture costs the whole model
> `tv.glb` carries two texture entries with an empty `extensions: {}` and no
> `source`. Every built-in GLTFLoader plugin declines them, the default path then
> reads `images[undefined].uri`, and the entire load rejects — not just that
> texture. A registered plugin supplies a white 1×1 for any texture with neither,
> which is what a missing base-colour map should resolve to. Expect this from
> exports generally; the file opens fine in a viewer.
>
> The meshes are also Draco-compressed, so the loader needs a decoder — vendored
> into `public/draco/` from the `three` package, never a CDN.

> [!warning] Light the screen with a box falloff, not a radial one
> A radial falloff from the centre of the glass lights an oval and leaves the
> corners dark, which reads as a glowing blob inside the cabinet — and the bloom
> faithfully blooms the blob. The picture area has to be lit flat to its rim
> before the bloom can dissolve the screen's own edge.

> [!warning] Screen brightness and bloom threshold are one setting
> The screen is `toneMapped: false` and sits well above 1 in the linear buffer,
> which is the only reason a threshold near 2 catches it while the sunlit grass
> stays out of the bloom. Move one and the other needs re-checking: too low and
> the whole field glows, too high and the screen stops blooming at all.

> [!warning] A bend map needs a bound, and the grass has to honour it
> The map covers a square around the camera. Sampling outside it returns the
> clamped edge texel, which smears one permanent bend across the entire far
> field — the grass shader multiplies the influence by an explicit inside test
> for exactly this reason.

> [!warning] A uniform declared in GLSL but missing from the material reads as 0
> Silently. No warning, no error, and `tsc` cannot help because the shader is a
> string. The vignette shipped broken this way for two turns: its exponent was
> never provided, `pow(distance, 0)` is 1 everywhere, and the whole term
> collapsed to a constant multiply that looked like a stuck exposure control.
> When a shader parameter "does nothing" or affects everything uniformly, check
> it is actually in the uniforms object before touching the maths.

> [!warning] Exposure does not move the sky
> The sky dome is `toneMapped: false` on purpose (ADR-0026) so the grass exposure
> can be pushed around without washing the horizon out. The consequence is that
> the exposure control moves the grass, the ground and the cabinet and leaves the
> sky exactly where it was — sky brightness lives in its own colours and in the
> grade's lift and contrast. Reach for the right one before concluding a slider
> is broken.

> [!important] Every colour that changes a pixel belongs in the registry
> Otherwise a config copied out of the panel understates the scene, and the next
> person to apply it gets a different picture with no way to see why. The halo
> learned this the hard way: it was given a colour of its own, which sat outside
> every supplied config. It now shares `screen.edgeColor`'s **uniform object** —
> one colour, two uses, nothing to keep in sync. Prefer that to a second entry
> whenever two things should never disagree.

> [!warning] The panel only reaches live uniforms and transforms
> That is the whole contract: a uniform write costs nothing, so dragging a swatch
> or a slider is free. Blade counts, field radius and anything geometric need the
> field rebuilt — 480,000 blades and a baked shadow map — and the panel makes no
> promise it can do that. Where a control is worth having anyway, express the
> quantity as something live: halo spread is **mesh scale** on a unit quad for
> exactly this reason.
>
> **Uniforms the panel drives need an explicit `THREE.IUniform<number>`.** The
> config is `as const`, so `{ value: CONFIG.tv.light.intensity }` infers the
> literal type `17` and the setter fails to compile.

> [!warning] Two GLSL traps that `tsc` cannot see
> `flat` is a reserved interpolation qualifier in GLSL ES 3.0 — naming a variable
> that fails to compile the shader, and the scene renders with that material
> missing (a black sky, in the case that found it). And a **backtick inside a
> GLSL comment** terminates the JavaScript template literal holding the shader,
> which surfaces as a Next parse error pointing at the comment. Both have been
> hit more than once here; neither is a type error.

> [!warning] Blade height, eye height and the bokeh are one setting
> Shortening the blades without dropping `camera.eyeHeight` views a lawn from
> standing height: the near grass falls below the bottom edge and the foreground
> blur goes with it. And the darkening terms — `rootShade`, `canopyAo`, the
> cloud shadow, `ambient` — all multiply. Raising them together crushes the field
> to olive, which is not contrast. ADR-0029.
>
> **The sun's elevation sets the useful range of `terrainContrast`.** The remap
> stretches whatever band the terrain's dot product actually spans, and that band
> moves with the sun: at 36° it was `[0.3, 0.95]`, at 22° the same window clipped
> nearly everything to black. Move one, re-check the other.

> [!warning] The alpha cutout is the single point of failure
> The blade silhouette comes entirely from the alpha map, and the fragment
> shader discards below `0.15`. If that texture fails to decode it samples as 0,
> **every** blade is discarded, and the scene renders as a bare green hill under
> a perfect sky — geometry intact, grass apparently gone. The textures are
> served same-origin from `public/assets/grass-hero/` for exactly this reason;
> a cross-origin load would also taint the canvas and produce the same empty
> field with no error.
>
> **A shader link failure looks identical.** A missing `attribute` declaration
> renders exactly the same bare hill under a perfect sky. The two are told apart
> in the console: a link failure logs `THREE.WebGLProgram: Shader Error` with the
> offending GLSL line, and `gl.getError()` returns 1282 (`INVALID_OPERATION`).
> Check that before suspecting the textures.

- **`three` is pinned to `0.160.1`.** The fragment shaders use
  `#include <colorspace_fragment>`, which exists only from r0.152.
- **`frustumCulled = false`** on both the field and the sky dome. The base
  blade's bounding sphere is meaningless once instances are scattered in the
  shader — leaving culling on pops the whole field out of view.
- **Tone mapping stays in-material.** The grass appends
  `<tonemapping_fragment>`; the sky is `toneMapped: false` so the horizon band
  cannot wash to white when the grass exposure moves.
- **Don't blur the sky at the far maximum.** The dome sits at 1200 units, so it
  saturates any far ramp — `maxFarBlur` is deliberately small, or the clouds turn
  to mush.
- **Clouds are billow noise, not fbm.** Folding noise at zero (`abs(n*2-1)`)
  creates the creases a cumulus edge forms on; plain fbm thresholded at any level
  is a blurry stain. Volume comes from a second sample taken *toward* the sun —
  where it is thinner, this part faces the light.
- **`sky.cloudCover` and the `cp` scale are coupled.** Coverage without scale
  gives a uniform blanket; scale without coverage gives two lonely puffs. They
  took the most back-and-forth of anything in the scene.
- **Clouds never blow out (2026-09-14).** Sun warmth on a cloud is a *tint*
  (`mix`), not added light. The old `+0.45` rim and `+0.28` tops pushed clouds
  near the sun to ~1.7 linear, over the bloom threshold, and they bloomed into a
  white blob. Coverage is mixed at `sky.cloudOpacity` (0.68) and thinned by 55 %
  right against the sun.
- **The real limit on cloud brightness is the grade, not the bloom.** The
  composite raises contrast ×1.26 and then *adds* the warm highlight tint (up to
  +0.6) in display space, so any sky value above ~0.58 linear ends up pure
  white on screen. A cap at 0.86 stopped the bloom, but a big cloud mass still
  clipped to a flat white patch. The cloud is now *scaled* by
  `sky.cloudBrightness` (0.6), which keeps its lit/shadow contrast, and capped
  at `colors.cloud × 0.6`.
  - Measured on the top half of a 1440×800 frame with the TV excluded, blown-out
    pixels went from ~3 % to 0.1–0.2 %. What remains is the particles' cores.
  - **If the grade's contrast or highlight tint goes up, `cloudBrightness` must
    come down.**
- **More cloud (2026-09-14).** Coverage went 0.06 → 0.38. The large clumping
  gate, which decides where clouds may exist at all, moved from a hard-coded
  `smoothstep(0.28, 0.62)` to `sky.cloudGateLow` / `cloudGateHigh` (0.02 / 0.42).
  With the old gate, extra coverage only thickened the same few clumps. Both
  values have panel sliders under *Sky*. The gate is two scalar keys rather than
  a tuple because the panel's *Copy config* folds dotted paths into objects.
- **No bloom.** The chain is one post pass (ADR-0026), so the screen's spill is
  an additive halo quad in front of it. Without some spill the brightest object
  in frame has a hard cut-off edge against the sky and reads as a sticker.
- **The flicker is two offset sines, not noise.** Per-frame randomness reads as
  a strobe at 60 fps; a CRT's unsteadiness drifts.
- **The cloud fade ramp is camera-dependent.** It opens with height up the dome;
  this camera looks near-horizontal and never sees above `d.y ≈ 0.4`, so a ramp
  that reaches full at 0.75 fades every cloud in frame to a pale wash.
- **The camera is placed once and never re-aimed**, but it is no longer
  motionless: a few centimetres of position and a fraction of a degree of
  rotation are applied each frame from layered sines, as an **offset from the
  stored placement** rather than an accumulation — otherwise a long session
  drifts away from the framing the crest search chose. `aspect` is still the only
  thing resize touches.

> [!warning] The last pass owns the sRGB encode
> three forces `LinearSRGBColorSpace` output for anything drawn into a render
> target — `renderer.outputColorSpace` is ignored there. So the scene's
> `<colorspace_fragment>` writes **linear** values into the offscreen buffer, and
> the DOF pass has to encode on the way to screen. Miss it and the frame is
> displayed un-gamma-corrected: dark, muddy and over-saturated, which looks
> exactly like a lighting bug and is not one. If a second pass is ever added,
> the last one in the chain encodes and no earlier one may. ADR-0026.

> [!warning] A sun in front of the camera cannot produce a specular highlight
> The Blinn-Phong half-vector degenerates when light and view are opposed, so
> `specular` can be raised to any value and the blades stay matte. The sun's
> azimuth is therefore load-bearing, not decoration: it is side-on so the
> highlight can form and so the dune faces separate. Elevation is what keeps the
> disc out of frame, which leaves the azimuth free. ADR-0028.

> [!warning] Never aim the camera at a ground-relative point
> "N units above the ground over there" tilts the camera **up** whenever the
> target stands higher than the eye, which pushes the near grass out of frame
> and silently removes the foreground bokeh. Aim by `pitchDeg`. ADR-0027.

### Colour constants vs design tokens

The scene's colours live in `grass-field.config.ts`, not in `globals.css`. A GLSL
uniform cannot read a CSS custom property, and these are shader inputs rather
than UI styles — so `verify.sh` reports its "hex literal in source" WARN on that
file by design. The one crossover is `--scene-backdrop` ([[design-system]]),
painted behind the canvas until the first frame and left visible on a device
with no WebGL; it mirrors `colors.skyHorizon` and the two must be kept in sync.

### Known gaps

- **No bot path yet.** §1 of [[optimize-3d-scene]] wants crawlers to get a static
  poster so the `three` chunk is never fetched. `isBot()` exists; the poster does
  not. Belongs to the first performance pass.
- **No device tiering.** DPR is clamped at 2 (on the renderer *and* the offscreen
  target, per §6) and the frame budget is uncapped on every device — the blade
  count does not drop on a phone. Also §2/§5 of the skill.
- **Fill-bound, not vertex-bound.** 300k and 420k blades measured identically —
  60 fps, ~17 ms worst frame, desktop GPU at DPR 1.5 — so raw blade count barely
  registers. The fill goes to the DOF gather, the sky shader and the motes:
  ~1400 additive points took the worst frame to 26.7 ms, because they are
  fill-heavy *and* they feed the bloom. Halving the blades to 200k brought it
  back to 17.0 ms while making the foreground denser, and 480k concentrated
  harder still measures 17-18 ms — the real lesson being **spend the budget by
  distance, not by cutting the total**. Measure on a settled scene: a first
  reading of 56.6 ms turned out to be the load-time shader compile landing inside
  the sample window. Nothing has been
  profiled on a phone.
- **Motion is not gated on `prefers-reduced-motion`.** The wind and clouds are
  ambient and continuous; [[components/common|ReducedMotion]] only governs
  springs.

## Related

[[component-conventions]] · [[optimize-3d-scene]] · [[animation-system]] ·
[[design-system]] · [[folder-structure]]

## PIRA mascot (2026-10-29; supersedes television asset notes above)

`mascot.ts` replaces `tv.ts`, adapting the existing prop placement and motion.
Pirophone keeps its textured face, uses Draco/WebP variants and releases model
resources on unmount, including a late-arriving load. The existing field shaders
and their internal TV uniform names remain. Full asset/QA details: [[pira-website]].
