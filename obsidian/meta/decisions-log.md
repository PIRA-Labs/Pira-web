---
tags: [meta, decision]
updated: 2026-09-14
---

# Decisions Log (ADRs)

Why this project's conventions are what they are. Each entry records a decision,
the reasoning behind it, and what it constrains when you build.

These are **inherited from the starter** — they explain the rules in `AGENTS.md`
and across the vault, and notes link to them by number. Add your project's own
decisions on top, continuing the numbering. Amending an inherited decision is
fine; write a new ADR that says so rather than editing the old one.

Template: [[templates/adr-note]].

---

## ADR-0043 — PIRA rebrand preserves the meadow runtime

**Status:** Accepted · 2026-10-29

**Decision.** Adapt the established hero and prop loader, with static server
pages for project details. Keep the meadow shaders, device budgets, prewarm,
worker and spring engine intact. Preserve the supplied source GLB outside
`public/`; serve Draco geometry plus three WebP texture maps at 1024 / 512.

**Why.** This is a rebrand, not a redesign. The original model is texture-heavy,
not geometry-heavy, so retaining all 18,493 triangles avoids silhouette loss.
WebP reduces the asset to 484 / 225 KB using the existing loader and local Draco
decoder. KTX2 would reduce GPU memory further but adds a transcoder and delivery
path; three resized maps cost approximately 16 / 4 MiB with mipmaps here. This
is a deliberate simplicity tradeoff from the optimization skill's KTX2 default.

**Release truthfulness.** An unset APK URL routes to a release-status page. The
proposed Android/Nebius architecture is distinguished from shipped capability.
A short footer adds page scroll; the old one-screen desktop scroll exception
must not be treated as a performance waiver for future additions.

See [[pira-website]] for configuration and verification details.

---

## ADR-0042 — Device tiers for the grass scene, and what each tier gives up

**Status:** Accepted · 2026-09-14 · applies the `optimize-3d-scene` skill

**Decision.** `src/lib/scene/device.ts` is the single source of per-device
budgets (ported from the skill's canonical module), and `createGrassScene`
exposes `retune(tier)`:

| | desktop | tablet | mobile |
|---|---|---|---|
| DPR ceiling | 1.5 | 1.25 | **1.0** |
| Frame budget | every tick | 45 fps | 30 fps |
| Blades drawn (of 480 k allocated) | 480 k | 340 k | 220 k |
| Motes | 1400 | 1000 | 600 |
| Offscreen MSAA | 4 | 4 | **2** |
| Bloom strength / max blur pairs | ×1 / 7 | ×1 / 5 | ×0.6 / 3 |
| TV texture cap | 1024 | 512 | 512 |
| Pointer | bound | bound | not bound |

**Why each deviation from the skill's defaults.**
- **Mobile DPR 1.0, not 0.85.** The skill's 0.85 is for soft sprites. Blades are
  hair-thin geometry, the case the skill itself exempts.
- **Mobile MSAA 2, not "antialias off".** `antialias` is off on *every* tier,
  because the default framebuffer only ever draws the composite quad and MSAA
  there did nothing. The geometry renders into a separate target, and with no
  samples at DPR 1 the field shimmered.
- **Blade truncation is safe.** The skill warns that truncating a pre-baked
  buffer can delete a region. Here every blade is an independent draw from the
  scatter stream, so the first N blades are a uniform sample.
- **Bot check on the client.** `isBot()` reads `headers()` and would turn `/`
  from static to dynamic. A `navigator.userAgent` check before `LazyGrassField`
  renders never requests the `three` chunk either.
- **TV textures downscaled at load, not KTX2.** The GLB can't be processed by
  gltf-transform (malformed texture entries), and `toktx` isn't available. The
  cap is read once at construction: a downscaled map can't be restored.

**Constrains.**
- Nothing in `retune` may change a define, `transparent`, blending or a light
  count. Sizes, counts, uniforms, sample counts (a framebuffer, not a program)
  and listeners only. The tier round trip must keep the program count flat.
- Any pass skipped on some tier (bend/spring on mobile) must still be drawn
  once in `prewarm`.
- `renderer.compile*` must run with the offscreen target bound. The program
  variant depends on the target.
- Nothing may import `three` into the first-load graph. The scene barrel exports
  only `LazyGrassField` and types.
- Performance numbers are quoted from a production build only.

---

## ADR-0041 — The scene's wind, sky and mote clocks are integrated, so a gust can bend time

**Status:** Accepted · 2026-09-14

**Decision.** `createGrassScene` keeps three accumulated clocks: `windClock`
(grass noise), `skyClock` (cloud drift) and `particleClock` (mote motion). Each
frame adds `delta × boost`, where `boost = 1 + (peak − 1) × envelope`. `gust()`
starts an envelope with a smoothstep attack and an exponential calm. The grass
vertex shader reads a new `windTime` and `windStrength`, while the old `time`
(elapsed/4) keeps driving the cloud shadows shared with the ground. On `/` the
gust fires when the preloader lifts (`PreloadedGrassField` passes `gust={revealed}`).

**Why.** The author asked for a strong wind right after the preloader that then
settles. Scaling a clock that is read as `elapsed × k` would jump every blade's
phase the moment `k` changed, and jump it back when the gust ended. Integrating
keeps motion continuous at any speed. The separate `windTime` exists because the
grass and the ground draw one cloud-shadow band from a shared clock; a gust on
that clock would slide the two apart.

**Constrains.**
- Anything new that should react to gusts reads an integrated clock, never
  `elapsed`.
- Amended the same day: a gust is a **shared lean plus a travelling wave**
  (`windLean`, `windWave`), not an amplified per-blade noise. The amplified
  version read as jitter. Keep `0.3 × windGust.sway + windGust.lean` ≲ 0.65 rad
  half-angle, or the tips dip into the ground at noise peaks.
- The gust envelope must be smooth at the peak (smoothstep rise, Gaussian fall).
  An exponential fall has a corner there that reads as a jolt.
- `tv.update` still takes raw `elapsed`, on purpose: the set's float stays calm.

---

## ADR-0040 — A preloader gates the hero; entrances blur in, and glass animates on its own element

**Status:** Accepted · 2026-09-14

**Decision.**
1. `/` shows a full-screen `Preloader` (since the same day a white curtain with
   a gradient-filled counter that slides up; it was first a VHS tape-deck card)
   until the grass scene has drawn a frame
   with every asset in it. The scene reports this through
   `onLoadProgress` / `onReady` into the `usePreloader` store. The page lifts
   after at least 1.8 s, or unconditionally at 12 s.
2. Every hero element enters only once `revealed` flips, using `Reveal`
   (`<Spring enabled>`) and `RevealText` (`TextEngine enabled`). The motion is
   overdamped springs (tension 64 / friction 22), opacity + travel + `blur()`,
   and the choreography lives as `TIMING` objects in the view pieces.
3. `TextEngine` runs **without `overflow`** in the hero.
4. The frosted surfaces of `GlassPillLink` / `ActionLink` are separate elements,
   and animation never puts `filter` on their ancestors.

**Why.**
- Without the gate, the entrance played while three.js was still fetching,
  behind a flat backdrop.
- The clip box from `overflow` shaved the script's swashes and the sans
  descenders (author screenshot). A blur reveal needs no mask, so the clip went.
- `filter` and `opacity < 1` make an element a backdrop root. The surface split
  is the only way to blur-in the pill contents and keep the frosting working.

**Constrains.**
- New content on `/` should enter through `Reveal` / `RevealText`, so it waits
  for the preloader. `Inview` would fire under it.
- Don't wrap a `backdrop-blur` element in anything that animates `filter`.
- The hero elements are server-rendered in their `from` state (opacity 0).
  Content stays in the DOM for crawlers, but a no-JS visitor sees only the scene
  backdrop.

---

## ADR-0039 — Blades scatter only inside the camera's arc

**Status:** Accepted · 2026-09-14 · narrows the disc scatter

**Decision.** Blade positions are drawn from a 115° wedge centred on the camera
heading (`fieldArcDegrees`), not from a full disc. The density bias drops from
1.75 to 1.3, which spends the freed budget on the mid-distance hills.

**Why.** The author pointed at the hills under the television: thin grass with
bare ground showing through. The camera is placed once and never turns (sway is
a fifth of a degree), so a full disc put ~74% of the 480k instances where no
frame could ever show them. The wedge makes the same instance count ~3.1–3.9×
denser in view. Lowering the bias then shifts density from the first ten metres,
which were already saturated, out to 20–45 units. Vertex cost is unchanged. Fill cost
rises because every blade now rasterises, and it measured at a steady 60 fps.

**Constrains.** 115° covers the frustum up to a ~32:9 viewport (half-angle ~51°
at the 38° vertical FOV) plus margin. A wider aspect, a wider FOV, or a camera
that turns or orbits must widen `fieldArcDegrees`, or bare ground appears at
the sides of the frame.

---

## ADR-0038 — Cursor bend goes through a per-texel spring

**Status:** Accepted · 2026-09-14 · extends ADR-0035

**Decision.** The bend map from ADR-0035 is now the *target*, not the pose. A
second pair of half-float render targets integrates a damped spring for every
texel: displacement goes in RG and velocity in BA, stepped with semi-implicit
Euler. The grass vertex shader reads the spring's displacement vector. The
stamped pointer position now eases with `1 - exp(-delta / follow)` instead of
the fixed `lerp(0.35)` per frame.

**Why.** Author feedback: the hover had no inertia. The dent reached full depth
the frame the cursor arrived, and the per-frame lerp was close to instant at
60 fps (and faster still at 144). A spring on the GPU gives each blade mass and
spring-back for one 512² full-screen pass per frame, whatever the blade count.
Doing it per blade on the CPU is impossible, because the 480k instances exist only on the GPU.

**Constrains.**
- Explicit integration is only stable while `2π · frequency · step < 2`. The CPU
  therefore splits a long frame into steps of at most 1/60 s, capped at 6
  substeps. Raising `pointer.spring.frequency` far past ~5 Hz would need a
  smaller step.
- The grass must read the **spring** targets (`springTargets`), never
  `bendTargets`. The displacement is a signed vector, so its targets must stay
  `HalfFloatType`.
- Amended the same day: radius and depth scale linearly with distance past
  `pointer.distanceReference`, so the effect reads the same size on screen on the
  far hills (author: it was barely visible under the television). The stamp
  shader takes the camera's *placed* XZ (`uCamera`), and the grass shader uses the
  live `cameraPosition`. The sway is centimetres, so the two agree.

---

## ADR-0037 — The hero UI is an overlay above the canvas, and its pieces live in `views/home/`

**Status:** Accepted · 2026-09-14

**Decision.** The Figma UI renders in a `pointer-events-none` layer stacked over
`LazyGrassField`, inside the same `h-lvh` box. Only the links opt back in with
`pointer-events-auto`. The overlay is a flex column: a 65 px header, a `flex-1`
frame region whose top and bottom borders are the hairlines, and a 62 px band.
Headline content anchors to the top of the region and the action to the bottom,
so the layout holds at any viewport height. Section-specific pieces
(`site-header`, `hero-content`, `hero-frame`) live in `src/views/home/`, next to
the view that uses them. Only the reusable primitives went to `components/ui/`.

**Why.**
- The grass bend and the television both follow the cursor through
  `pointermove` on the canvas. An overlay that swallowed pointer events would
  switch that off across the whole hero.
- The design is one fixed 1440×800 frame. Flex anchoring reproduces its
  positions exactly at 800 px tall and degrades sensibly elsewhere. Absolute
  positions taken straight from Figma would pull the body copy off the band on
  taller or shorter screens.
- [[component-conventions]] puts feature pieces "next to the feature". A
  sibling `views/home/` folder does that without adding a `components/sections/`
  tier that the conventions don't define. There is no `index.ts` in it, so
  `@/views/home` still resolves to `home.tsx`.

**Constrains.** Anything interactive added to the overlay needs
`pointer-events-auto`. Any content between the header and band should go into
the frame region's flex column, not onto absolute coordinates. `SceneControls`
stays below the header hairline (`top-20`).

---

## ADR-0036 — The camera is no longer locked

**Status:** Accepted · 2026-09-12 · retires an invariant held since the original port

**Decision.** The camera is still placed once and never re-aimed, but each frame
it is offset by a few centimetres of position and a fifth of a degree of rotation
from layered sines. The offsets are applied to a **stored** placement, never
accumulated onto the live transform.

**Why.** A perfectly still frame reads as a rendering, not a shot. The sway is
small enough that nothing about the composition changes and large enough that the
image stops looking frozen.

**Why this needed writing down.** "The camera is locked — placed once, never
touched" was stated in the port's source comments, in the catalog note and in
several ADRs; it was the scene's oldest invariant and code was written against
it. Anyone finding those words now needs to know they were retired deliberately
rather than forgotten. They have been corrected in place.

**When building.** Offset from the stored placement. Accumulating onto
`camera.position` drifts away from the framing the crest search chose over a long
session, and the drift is slow enough not to be noticed until the subject has
left the frame.

---

## ADR-0035 — Simulation state lives in a ping-ponged render target

**Status:** Accepted · 2026-09-12

**Decision.** The cursor's effect on the grass is held in a small
double-buffered render target — direction in RG, depth in B — which is faded and
re-stamped once per frame and sampled by the grass vertex shader. The blades read
this map instead of reading the pointer.

**Why.** The field needed *memory*, and the GPU has nowhere else to put it.
Bending blades as a function of the current pointer position — which is what the
scene did — makes every blade upright again in the frame the pointer leaves it,
so a fast sweep heals behind the cursor as fast as it is drawn. No amount of
easing the pointer fixes that: easing the input cannot give the *field* state.
Per-blade state is not available (there are 480,000 of them and no feedback
buffer per instance), but a texture over the *ground* is, and it is the right
resolution for the problem anyway.

The decay is the recovery. Nothing releases a blade; the dent simply fades, at a
rate the CPU derives from real elapsed time so it does not change with frame rate.

**When building.** Two things are easy to get wrong and both look like a shader
bug rather than a design one:

- **Stamp the segment travelled, not the current position.** At speed the cursor
  crosses metres between frames and discs leave a dotted trail.
- **Bound the map and honour the bound in the consumer.** Sampling outside it
  returns the clamped edge texel, which smears one permanent bend across the
  whole far field.

This is a third render pass, after bloom and the composite (ADR-0026, ADR-0034),
but it is simulation rather than post: it runs *before* the scene is drawn and
writes something the scene reads, not something the viewer sees.

---

## ADR-0034 — Bloom is a real pass; the television is a loaded model

**Status:** Accepted · 2026-09-12 · amends ADR-0026 (one post pass) and ADR-0030 (no lights)

**Decision.** The screen's glow is a genuine bloom — bright extraction, separable
Gaussian at quarter resolution, added to the composite in linear light before the
grade. The additive halo quad is deleted. The set itself is a Draco-compressed
glTF model loaded at run time, with its screen material replaced by an emissive
shader; two `THREE.Light`s are back, for the model alone.

**Why.** A quad in front of the set can only ever glow *around* the screen: the
screen's own pixels stay exactly as sharp as they were, so the bezel keeps a hard
edge and the thing reads as a bright sticker. Light that has been blurred across
the frame buffer washes back over the bezel and over whatever is in front of it,
which is what dissolves the edge. No arrangement of quads does that.

This makes the post chain two passes, not one (ADR-0026). The rule that survives
is the important half: **the last pass owns the sRGB encode**, and bloom is added
before it, in linear light, where adding light is meaningful.

**Lights came back, and ADR-0030's reasoning is what brings them.** That ADR
removed them because nothing read one — grass, ground and sky are all custom
shaders. The model is not: it arrives with standard materials and renders black
without a light. Since nothing else consults the light list, these two illuminate
exactly the set.

**When building.** Screen brightness and bloom threshold are coupled: the screen
is `toneMapped: false` and sits well above 1 in the linear buffer, which is the
only reason a threshold near 2 catches it and not the sunlit grass. Moving one
without the other either kills the glow or blooms the whole field.

---

## ADR-0033 — The scene exposes a live control registry, and the panel is hand-rolled

**Status:** Accepted · 2026-09-12 · extended the same day from colours to scalars

**Decision.** `createGrassScene` returns `colorControls` / `setColor` and
`numberControls` / `setNumber` — each entry carrying key, label, group, its
dotted path in the config, and its current value (scalars also carry a range).
Edits go straight to the live uniforms. The panel is a plain React component in
the scene folder, not `lil-gui` / `leva`.

**Why.** A colour change must not rebuild anything — there are 420,000 blades and
a baked shadow map behind this scene, and a rebuild per swatch drag would be
unusable. Every editable colour is already a uniform, so the change is one
`.set()` before the next frame.

The registry carries a `linear` flag per entry, and it is not cosmetic: the sky
and fog uniforms hold **linear** light (the sky writes linear and lets the
composite encode, ADR-0026). Setting those from a hex without converting
silently lightens them, and the bug looks like the picker is wrong rather than
the pipeline.

A dependency was rejected because the panel is four groups of `<input
type="color">`; a GUI library would cost more than it saves and bring styling
that ignores the project's tokens.

**When building.** The registry is not only what *may* be exposed — anything that
changes a pixel and can be exposed **must** be, or a config copied out of the
panel understates the scene and the next person to apply it gets a different
picture with no way to see why. Two colours were caught by this rule after the
fact: the grade's split-tone tinted every frame while being unreachable. A third,
the halo's own colour, was deleted instead — it now shares `screen.edgeColor`'s
uniform object, one colour with two uses, which beats a second registry entry
whenever two things should never disagree.

New controls are bound in one place — extend the registry and the panel picks
them up. The candidacy test is not "is it a uniform" but **"can it be set on a
live scene for free"**: uniforms qualify, so do transforms (the screen's halo
spread is mesh scale on a unit quad for exactly that reason) and so do renderer
properties (`toneMappingExposure`). Blade counts, field radius and geometry do
not — those need a rebuild the panel makes no promise it can do.

Two things bite. A uniform the panel drives needs an explicit
`THREE.IUniform<number>`: the config is `as const`, so an inferred uniform takes
the *literal* type of its default and the setter will not compile against it. And
the `linear` flag on a colour entry is load-bearing, as above.

---

## ADR-0032 — Terrain shadows are baked on a grid, not shaded per blade

**Status:** Accepted · 2026-09-12 · extends ADR-0028

**Decision.** Sun visibility is marched against the height field on a grid at
construction (`sun-shadow.ts`), uploaded as a `DataTexture`, and sampled by both
field shaders in world XZ.

**Why.** With a low sun the crest throws a long shadow back over the foreground,
and that is the brief for the near hill: unlit except by the television. No
shading term can express it. Shading depends only on which way a surface points,
and a slope in shadow points exactly the same way as a slope in sunlight — the
difference is what is *between* the surface and the sun, which only a march can
answer.

Per blade it would be ~420,000 marches against a three-octave height field,
seconds of it at construction. The terrain is smooth at this scale, so a grid the
shaders read bilinearly is indistinguishable and costs a fraction. The march
records how far the terrain intruded above the ray rather than a yes/no, which
buys a penumbra instead of a staircase.

**When building.** The map is baked once for a static sun — moving the sun at run
time means re-baking, which is not a per-frame operation. Its square is centred
on the camera and sized from the blade disc; outside it the shaders assume open
sky rather than shadow, because the alternative is a visible dark border where
the bake ends.

---

## ADR-0031 — Scene objects are built and lit in-scene, and the composite grades

**Status:** Accepted · 2026-09-12 · extends ADR-0030

**Decision.** Props in this scene are built from primitives in their own module
(`tv.ts`), and they light the field by handing the field's shaders a position, a
facing, a colour and an intensity — the same pattern as the sun, not a
`THREE.Light`. The final look is set by a colour grade at the end of the
composite pass: contrast, saturation, a split-tone and a vignette, applied in
**display** space.

**Why.**

- **Built, not loaded.** A television is a handful of boxes and cylinders. A
  model would mean a loader, an asset to host, a decode step and a format to
  keep working — for a silhouette read at forty metres through a blur.
- **A light, not a `THREE.Light`.** Nothing in this scene reads one (ADR-0030),
  so a point light at the screen would have lit precisely nothing. The screen's
  contribution is a function both field shaders call, sharing one set of uniform
  objects so the pool of light under the set is continuous across the grass and
  the ground rather than two pools that drift.
- **Grade in display space.** Contrast and saturation applied to linear light
  behave nothing like the numbers suggest — a contrast of 1.3 on linear values
  crushes the shadows and blows the sky — and every grading intuition is a
  display-space intuition. The grade therefore runs *after* the composite's sRGB
  encode, as the last thing before the frame leaves.

**When building.** A prop's placement is derived from the relief, like the camera
(ADR-0027): the set searches the view ray for the crest rather than sitting at a
fixed distance. The first attempt used a fixed 23 m, which dropped it into a
hollow six metres below the eye behind a rise that occluded it completely — the
terrain is noise, and a fixed distance lands wherever the noise puts it.

An emitter also needs its cone widened past the physical: at a Lambertian
`focus` of 1.5 the screen lit the camera and not the grass beneath it, which is
the entire point of the object.

---

## ADR-0030 — The ground is the floor of the sward, and there are no lights

**Status:** Accepted · 2026-09-12 · supersedes the lighting rig of ADR-0024

**Decision.** The ground plane is a custom shader running the **same** lighting
as the blades — same sun and sky colours, same terrain remap, same drifting
cloud shadow — tinted from its own darker two-colour ramp with two scales of
mottling. `THREE.HemisphereLight` and `THREE.DirectionalLight` are removed from
the scene entirely. `scene.fog` is removed too; both materials apply the same
exponential fog from shared uniforms.

**Why.** "No bare earth anywhere" is not a density problem. At any blade count a
canopy has gaps, and the eye finds them — so what matters is *what it finds*.
A `MeshStandardMaterial` in soil green turns every gap into a visible patch of
dirt and every metre past the blade disc into bare hillside. A floor that is
lit identically to the grass and coloured like grass in shade reads as more
grass, and the disc's far edge stops existing.

Two things fell out of that:

- **The lights were already doing nothing useful and then nothing at all.** They
  only ever reached the ground's standard material; once that became a custom
  shader, they lit nothing, and a light left in the graph costs a program
  recompile for no pixels. The lighting constants *are* the lighting rig now,
  and both materials read the same ones so canopy and floor cannot drift apart.
- **`scene.fog` only reaches materials that implement it.** The grass shader
  never did. So the ground hazed into the sky with distance while the blades in
  front of it stayed fully saturated, and the two came apart at the horizon —
  which read as exactly the bare-ground seam this ADR is about. Fog is now
  explicit in both shaders, from one shared pair of uniforms.

**When building.** Anything else added to this scene needs the same treatment:
read the shared lighting and fog uniforms, or it will not belong to the same
world. Do not re-add a `THREE.Light` expecting it to do something.

---

## ADR-0029 — Blades vary per instance; the field is not one material

**Status:** Accepted · 2026-09-12 · extends ADR-0028

**Decision.** Every blade carries a `variation` attribute (brightness/colour
tint, canopy occlusion) alongside its height, and blade height comes from a
spatial **patch** value times a skewed within-patch draw rather than a flat
random. A fraction of blades tint toward straw. Gloss varies per blade. Large,
soft cloud shadows drift across the field, and the terrain shading term is
remapped before use.

**Why.** The field looked moulded — "plasticine" — and that was four things, none
of which is lighting quality:

1. **One ramp for every blade.** A real sward is thousands of slightly different
   greens with a fraction always dying back. Sharing one colour ramp makes the
   whole field one material, and a single material with a shadow on it reads as
   one object however good the shading.
2. **Even gloss.** A uniform sheen across every blade reads as wet plastic.
3. **No occlusion between blades.** Every blade was lit as though it stood alone.
   A blade shorter than the patch around it is buried under its neighbours —
   which is free to compute, because the within-patch draw *is* its relative
   height.
4. **Flat random heights.** The original picked `rand()` for two thirds of blades
   and `rand()*1.8` for the rest: an even spread of every height everywhere.
   Grass grows in patches, and inside a patch most blades sit near one height
   with a few running away above them.

Separately, contrast had no **large-scale** source. Per-blade shading cannot
produce it: every part of the field was lit identically, so the eye read one
evenly lit surface. Drifting cloud shadows supply it, and the terrain term
needed remapping because gentle dunes only span ~0.5..1.0 of the dot product —
lit and shaded faces came out nearly the same value.

**When building.** Height, occlusion and the camera are coupled: shortening the
blades without dropping `eyeHeight` views a lawn from standing height and the
foreground leaves frame, taking the bokeh with it. And the darkening terms
(`rootShade`, `canopyAo`, cloud shadow, ambient) multiply — raising all of them
together crushes the field to olive, which is not the same thing as contrast.

---

## ADR-0028 — The grass carries its own two-light model, and the sun is placed to serve it

**Status:** Accepted · 2026-09-12 · extends ADR-0024

**Decision.** Blade shading is computed per **fragment** from a warm sun and a
cool sky: wrapped diffuse, a Blinn-Phong specular lobe weighted toward the tip,
translucency for back-lit blades, and a bounce term in the blade's own colour.
Ambient is kept low relative to the sun term. The sun sits at 36° elevation and
~90° off the view axis.

**Why.** "Everything looks flat" had four separate causes, and fixing any one
alone does nothing:

1. **One scalar light.** A single grey multiplier cannot produce the warm-lit /
   cool-shadowed split that every photograph has. Two coloured lights can.
2. **A high ambient floor.** It drowns the difference between the lit and unlit
   side — the more ambient, the flatter, regardless of how strong the key is.
3. **No specular.** Grass is glossy; without a highlight it reads as felt. The
   lobe is weighted by height fraction so only blades that lean into the light
   flare.
4. **A high sun.** At 58° everything is lit from straight above and every slope
   shades alike.

**The placement constraint, which is not a taste call.** A sun in *front* of the
camera cannot form a Blinn-Phong lobe back toward it — the half-vector
degenerates when light and view are opposed — so `specular` can be raised to any
value and the blades stay matte. Side-on light is what makes the highlight
possible at all, and it is also what separates the dune faces into a lit and a
shaded side. Elevation keeps the disc out of frame (the top edge of this camera
sits at ~16°), so the azimuth is free to serve the shading.

**When building.** Per-fragment, not per-vertex: a blade is six vertex rows, and
a specular highlight interpolated across them is worse than no highlight. The
normal is flipped toward the viewer rather than `abs()`-ed — `abs()` discards
which way the blade leans, and with it every highlight that depends on the lean.
Shadow colour comes from `uSkyColor` plus the bounce term; drop the bounce and a
blue ambient desaturates every hollow to grey.

---

## ADR-0027 — Scene framing is derived from the relief, not hand-placed

**Status:** Accepted · 2026-09-12

**Decision.** The grass field camera is expressed as a standing point plus
`eyeHeight` above **the terrain under it**, and aimed by `yawDeg`/`pitchDeg` —
never at a fixed world point. Blades scatter on a disc centred under the camera
(`fieldRadius`, `fieldDensityBias`), not on a square. The standing point and
heading were picked by scanning the seeded height field for a mound cresting
just below the eye line, not by nudging numbers until a screenshot looked right.

**Why.** Three failures, each hit in practice while matching the reference:

1. A world-space camera Y sits at a different height above the *surface* every
   time the relief is retuned — and this framing lives or dies on the eye being
   just above the blade tips.
2. Aiming at a point defined as "N above the ground over there" tilts the camera
   **up** whenever the target stands on higher ground than the eye. That pushes
   the near grass out of frame and silently takes the foreground bokeh with it,
   which is the most distinctive thing about the look.
3. A square field has to end somewhere. At this eye height its far edge lands in
   frame as a line where grass stops and bare ground starts. A disc reaching past
   the visible horizon has no edge to see, and a density bias under `sqrt` spends
   the same blade budget where it covers pixels.

**When building.** Retuning `terrain` moves the camera and the blades with it —
that is the point, but re-check the framing after. The scan is a throwaway script,
not committed; re-derive it rather than guessing if the relief changes materially.

---

## ADR-0026 — One post pass: depth of field, which also owns the sRGB encode

**Status:** Accepted · 2026-09-12 · amends the scene's ported "no post-processing" rule

**Decision.** The scene renders into an offscreen `WebGLRenderTarget` (half
float, MSAA, with a `DepthTexture`) and composites to screen through a
hand-written depth-of-field shader. That pass performs the final linear → sRGB
encode. Everything else — tone mapping, the sky's exposure independence — stays
in-material as before.

**Why.** The reference frame's depth of field is not decoration; the blurred
foreground and softened distance are what make a shallow, close, lens-like
image out of a field of geometry, and nothing in-material can gather
neighbouring pixels. It is hand-written rather than three's `BokehPass` because
that pass re-renders the scene with an override depth material, which drops the
instanced attributes and stacks all 190k blades at the origin; reading the depth
the normal pass already wrote sidesteps this.

**The trap, recorded because it cost real time.** three forces
`LinearSRGBColorSpace` output for anything rendered into a render target —
`renderer.outputColorSpace` is ignored there. So `<colorspace_fragment>` wrote
*linear* values into the offscreen buffer, and the composite pass, which had no
encode of its own, put linear light straight on screen. The result looked like a
lighting bug: dark, muddy, over-saturated. Two rounds of "brighten the grass"
were chasing it. If a scene ever gains a second pass, the **last** pass in the
chain owns the encode, and no earlier one may.

**When building.** Near and far blur ramp independently (`nearRange`/`farRange`,
`maxNearBlur`/`maxFarBlur`) — a symmetric ramp cannot express "foreground
dissolves, background only softens", and blurring the sky dome at the far
maximum turns the clouds to mush. The offscreen target carries the clamped pixel
ratio, per §6 of [[optimize-3d-scene]]: clamping the renderer but not the target
throws the saving away.

---

## ADR-0025 — The body is a plain document body, not a centring flex box

**Status:** Accepted · 2026-09-12 · amends the starter baseline

**Decision.** `body` in `globals.css` is `min-height: 100lvh; width: 100%` plus
its colour tokens. The starter's `display:flex` + `align-items:center` +
`justify-content:center` + `height:100vh` + `width:100vw` block is gone.

**Why.** `align-items: center` makes every flex item shrink-to-fit on the cross
axis. The `ScrollLayout` wrapper is that flex item, so a full-bleed section
inside it (`w-full` on the view's `main`) resolved its percentage width against
a zero-width parent and collapsed to **0px wide** — the grass-field canvas
rendered into nothing and the page looked empty. Separately, `width: 100vw`
ignores the scrollbar gutter and forces a horizontal scrollbar on any page that
scrolls. The centring was scaffolding for an empty template; page layout belongs
to the view.

**When building.** Views own their own layout — a centred page centres itself in
`src/views/<page>.tsx`. Don't restore layout rules to `body`; `globals.css` stays
tokens and base resets ([[design-system]]).

---

## ADR-0024 — WebGL scenes live in `src/components/scene/<scene>/`

**Status:** Accepted · 2026-09-12 · extends ADR-0016 (the `optimize-3d-scene` skill)

**Decision.** A 3D scene is a folder under `src/components/scene/`, holding its
own config module, construction code, GLSL and React leaf. The leaf is
`"use client"` and is mounted through a `next/dynamic` `ssr:false` wrapper; its
per-frame work subscribes to the shared ticker rather than starting a private
`requestAnimationFrame`; all tunables are named constants in the config module.

**Why.** Three placements were possible and none of the existing ones fit. A
scene is not a design-system primitive (`components/ui/`) and not
provider-dependent shared infrastructure (`components/common/`); putting it next
to the view that first uses it would weld a reusable, self-contained GPU module
to one page. The rest follows the rules already in force: hard rule #7 forces the
canvas to be a client leaf, `ssr:false` is also what keeps `three` (~600 KB raw)
out of first-load JS, and [[animation-system]] requires one rAF per page, not one
per animated thing.

**When building.** `src/lib/scene/` stays available for cross-scene modules the
[[optimize-3d-scene]] skill introduces (e.g. `device.ts`). Hard rule #1 is
unaffected: a WebGL render loop is not DOM motion, but everything *around* the
canvas — reveals, overlays, loaders — is still a spring. Catalog the scene in
[[components/scene]] when you add one.

---

## ADR-0023 — 3D scenes resize on every tier; the iOS URL bar is filtered, not the listener

**Status:** Accepted · 2026-09-08 · amends the `optimize-3d-scene` skill (ADR-0016)

**Decision.** A WebGL scene keeps its rAF-coalesced `resize` /
`orientationchange` listener on **every** device tier, plus a listener on the
`(hover: none) and (pointer: coarse)` media query. On a coarse pointer it
ignores a change that moves `innerHeight` only. Any width change or media-query
flip re-reads the device tier; if the tier changed, `retune(tier)` re-applies
DPR (renderer and composer), frame budget, per-tier visibility, draw ranges,
pointer binding and freeze state before the surface is resized.

**Why.** The skill's earlier rule — no resize listener at all on touch — was
written to stop the iOS URL bar from rebuilding the framebuffer mid-scroll,
which reads as a whole-scene flash. It over-corrected. The listener was also the
only path that could notice a viewport that genuinely changed: a window dragged
across a breakpoint, a rotation, or DevTools device emulation switched off. A
scene loaded as a phone then held its 390-wide buffer, 30 fps budget, parked
pointer and hidden desktop-only passes on a 2160-wide viewport and drew skewed
until reload. The URL bar only ever changes `innerHeight`, so filtering
height-only events on a coarse pointer keeps the flicker fix and loses nothing.

**Constraints on retune.** It may touch uniforms, sizes, visibility, draw
ranges and listeners only — never a define, light count or
`material.transparent`, so no shader program compiles after the loader (skill
§3.2). Particle counts vary through `geometry.setDrawRange` on a buffer sized
for the largest tier, never through a rebuild.

**When building.** Follow `patterns.md` §1, §5 and §14 in the skill; do not
port the listener-less resize block from `mycelia/src/lib/scene/canvas3d.ts`.
Verify with the tier-switch round-trip in skill §14: emulation on → off → on
must move the buffer and draw count both ways with a stable program count.
See [[optimize-3d-scene]].

---

## ADR-0022 — Track latest within majors; hold TypeScript 7 and ESLint 10

**Status:** Accepted · 2026-08-18

**Decision.** Dependencies track the newest release **within their current
major**. Three majors are deliberately held back.

**Why.** Stale pins hand every new project a migration debt on day one; a broken
toolchain is worse. Each hold was tested, not assumed:

- **TypeScript 5, not 7** — `eslint-config-next` depends on `typescript-eslint@8`,
  whose peer range is `typescript >=4.8.4 <6.1.0`. TS 7 breaks `yarn lint`.
- **ESLint 9, not 10** — ESLint 10 removed `context.getFilename()`;
  `eslint-plugin-react` still calls it, so linting dies on startup.
- **`@types/node` tracks the Node major in use**, not the newest published.

**When building.** The blockers live in someone else's dependency graph, so they
lift without work here — **re-test periodically** rather than treating them as
permanent. [[tech-stack]] carries the table and the reasons. Node ≥ 20.19 is a
hard floor (`engines` + `.nvmrc`): the ESLint toolchain fails to install below it.

---

## ADR-0021 — SEO is a practice with a workflow, not just a metadata helper

**Status:** Accepted · 2026-08-18

**Decision.** SEO and AEO get skills, an audit agent and a documented order of
work ([[seo-aeo]]), not just the metadata utilities.

**Why.** The mechanism existed; the practice did not. Nothing checked whether a
new route reached `sitemap.ts`, whether titles were unique, or whether the site
was legible to answer engines — the fastest-moving part of search and the one
most likely to be skipped.

**When building.** Audit in order: indexability → metadata → content structure →
structured data → performance → AEO. A perfectly optimised page that cannot be
crawled is worth nothing. **AI-crawler policy is the user's decision** — "be
cited by AI" and "don't train on my content" need different bots allowed. Never
cloak, and never emit schema describing content that is not on the page.

---

## ADR-0020 — Payload + Supabase are the CMS and database, added per project

**Status:** Accepted · 2026-08-18

**Decision.** Payload (Postgres adapter) on Supabase are the documented defaults.
**Neither ships in the starter** — the `payload-cms` / `supabase-db` skills
install them when a project needs them.

**Why.** Payload runs *inside* the Next app — admin as a route group, content via
an in-process Local API, types generated from the schema — which matches how this
starter already works (Server Components reading data, passing props down) and
keeps deployment one Vercel project. Supabase covers database, media bucket and
optional auth in one service. Most projects from this starter are marketing sites
that never need either, so an unused install would be a large dependency surface
and a migration story maintained for nothing.

**When building.** [[cms-payload]] and [[database-supabase]] carry the
conventions. Two constraints break installs if ignored: `@payloadcms/next` pins a
minimum Next version (verify before installing), and Supabase's connection
strings are not interchangeable — runtime on the transaction pooler (6543, no
prepared statements), migrations on the direct connection (5432).

---

## ADR-0019 — Hard rules get a mechanical check, not just prose

**Status:** Accepted · 2026-08-18

**Decision.** `.claude/scripts/verify.sh` checks every hard rule that is
objectively decidable from source and exits non-zero on any FAIL. Judgement calls
stay with the `qa-verify` skill.

**Why.** Rules that are never checked decay into suggestions, and silently — a
stray `@keyframes` or hardcoded hex surfaces at review, if at all. `yarn lint`
knows nothing about springs, token tiers or route delegation.

**When building.** Run it after any code change ([[qa-verification]]). It greps
rather than parsing TypeScript, so it is biased toward false positives: a
dismissed warning costs seconds, an unchecked rule costs a review cycle. WARNs
never fail a build, so justify them rather than ignoring them.

---

## ADR-0018 — Split the docs into knowledge (vault) and execution (`.claude/`)

**Status:** Accepted · 2026-08-18

**Decision.** The vault stays the single source of truth for *why* and *what*;
`.claude/` holds *how it runs* — path-scoped rules, skills, agents, commands and
the verify script ([[agent-harness]]). Every skill, agent and command is
registered in the vault.

**Why.** Documentation that cannot be executed gets skipped; execution files
without recorded reasoning drift and duplicate. Keeping each mechanism to one job
avoids both.

**When building.** `.claude/` files stay short and point into the vault rather
than restating it — restated rules drift out of sync. **Path-scoped rules fire
when Claude *reads* a matching file, not when it writes one, and are not
re-injected after `/compact`.** They reinforce; they never guarantee. Anything
that must hold unconditionally belongs in `verify.sh` or a hook.

---

## ADR-0017 — A skill states its preconditions and its own internal conflicts

**Status:** Accepted · 2026-07-24

**Decision.** Every skill must state the environment its measurements assume, and
name explicitly where one of its steps undermines another.

**Why.** `optimize-3d-scene` was run on a real scene and the fix *order* held up
— what cost hours was everything left implicit: a first step that could not be
executed on the stack in front of it, measurements silently invalidated by the
dev server, and two individually correct steps that contradicted each other.

**When building.** When writing or editing a skill: a step names its
preconditions, and a step names where it fights another step. Numbers taken in
the wrong environment are worse than no numbers, because they read as evidence.

---

## ADR-0016 — Skills are registered in the vault, not just dropped in `.claude/`

**Status:** Accepted · 2026-07-24

**Decision.** A skill is only "installed" once it lives in `.claude/skills/<name>/`,
has a vault note under `workflows/`, is linked from [[README]] and
[[ai-agent-guide]], and — if invocation should be non-optional — has a routing
rule in `AGENTS.md`.

**Why.** A skill folder is discoverable to Claude Code at runtime but invisible in
the vault, leaving the invocation decision to model judgement. Where the skill
exists *because the order of operations matters*, that is exactly the wrong thing
to leave to chance.

**When building.** Registration is also when a skill gets checked against reality
— stale paths and references to files that do not exist surface here.

---

## ADR-0015 — Strict three-tier design-token naming convention

**Status:** Accepted · 2026-07-17 · amends ADR-0004

**Decision.** Tokens follow three tiers with an explicit grammar: primitive
`--raw-<category>-<name>[-<shade>]` → semantic `--<role>[-<variant>][-<state>]` →
`@theme inline` binding. Only Tier 1 holds literals; Tier 2 names purpose, never
appearance, and is the themeable layer. No tier may be skipped.

**Why.** ADR-0004 made tokens the styling currency but never said what a token
should be *called*, so every project would invent its own — defeating the point of
a shared starter. The names are predictable across projects by design.

**When building.** Full rules in [[design-system]]. Two Tailwind v4 facts,
verified by compiling a probe stylesheet, that guides commonly get wrong:

1. Naming primitives `--color-*` would **generate a utility for every raw value**
   and let markup bypass the semantic tier — hence the `--raw-*` prefix, kept out
   of `@theme`.
2. **There is no `--duration-*` namespace.** `duration-fast` compiles to nothing.
   Durations stay Tier 2 and are used as `duration-[var(--duration-fast)]`.
   (`--ease-*` *is* real.)

`@theme inline` is load-bearing: `inline` inlines the `var()` into each utility so
Tier 2 overrides cascade. Binding a literal there freezes the value and silently
breaks theming.

---

## ADR-0014 — Narrow CSS-transition exception for trivial state changes

**Status:** Accepted · 2026-07-17 · amends ADR-0002

**Decision.** All real motion stays spring-based, with one exception: CSS
`transition-*` for simple discrete state changes — `hover:` / `focus-visible:` /
`active:` colour, opacity, border, underline, and small decorative nudges.

**Why.** The outright ban cost most where it helped least: a nav link fading its
colour on hover needed a client component and a spring config to animate one
property nobody will interrupt. The rule pushed toward boilerplate or quiet
rule-breaking.

**When building.** Three conditions, all required, or it is a spring:
token-backed timing (`duration-[var(--duration-fast)] ease-entrance`),
`transition-*` only (`@keyframes` stay banned outright), and utilities only —
never a CSS file. Everything scroll-driven, revealing, staggered, orchestrated,
layout-affecting or interruptible remains a spring; text stays [[text-engine]].
The list is enumerated rather than a judgement call ("simple animations") so it
cannot erode into general CSS animation. Past the list, use `<Hover>`.

---

## ADR-0013 — `<Inview>` self-observe fix; spring components honour resize

**Status:** Accepted · 2026-06-07

**Decision.** Second authorised edit to the protected engine: `<Inview>` now
calls its callback ref so it observes itself when no `trigger` is passed, and
`<Inview>` / `<Spring>` / `<Hover>` pass the React-tracked `width` into
`isMobileDisabled(value, width)`.

**Why.** `<Inview>` only animated when given an external `trigger` — the common
case silently did nothing, because a callback ref was being assigned as
`.current` instead of called. Separately the `width` dependency was tracked but
never used, so resize re-evaluation of mobile gating did nothing.

**When building.** The springs folder stays `#do-not-modify` by default — these
were explicitly signed-off bug fixes, not an opening.

---

## ADR-0012 — Styling lives in utilities and components, not `globals.css`

**Status:** Accepted · 2026-05-22 · amends ADR-0004

**Decision.** A strict placement order, first match wins:

| Situation | Goes where |
|-----------|-----------|
| One-off styling | Tailwind utilities in `className` |
| Repeated pattern with markup/structure/props | a **React component** in `components/ui/` |
| Repeated pure-utility combo, no structure | a Tailwind v4 `@utility` |
| Pseudo-elements, 3rd-party overrides, complex selectors | `@layer components` |
| A new colour/spacing/radius value | a token (per ADR-0015) |

**Why.** With tokens in `globals.css` and guidance to extract repeated patterns
into `@layer components`, the path of least resistance made that file a dumping
ground — hundreds of component-specific classes never deleted when their
component was. Splitting the file would only spread the same bloat; the fix is a
placement rule.

**When building.** The default answer to "this looks repeated" is a **React
component**, not a CSS class — an eyebrow label with a `::before` dot is an
`<Eyebrow>`, not a `.label-eyebrow`. `globals.css` holds imports, tokens, base
resets and the narrow `@layer components` exceptions; if it grows past that,
something was misplaced. **CSS Modules were considered and rejected** — a second
styling mechanism is not worth the mental model when motion is spring-based (no
keyframes to co-locate) and utilities plus components cover everything else.

---

## ADR-0011 — API layer: `app/api` route handlers, secrets server-side

**Status:** Accepted · 2026-05-22

**Decision.** External calls go through Next.js Route Handlers at
`src/app/api/<resource>/route.ts`. The handler owns the work — business logic,
upstream calls, filtering, secret env vars. No mandatory passthrough service
layer; extract shared code only when genuinely reused.

**Why.** `route.ts` is never bundled to the browser, so it is the natural place
for secrets, and a single convention keeps every endpoint the same shape.

**When building.** Every endpoint validates input with `zod` and returns the
`{ data }` / `{ error }` envelope via the shared `handle()` wrapper. Secret env
vars are unprefixed and read through `getServerEnv()`; `NEXT_PUBLIC_` is only for
browser-safe values. Client Components fetch same-origin via `apiFetch`;
render-time data is read in Server Components. Full note: [[api-architecture]].
Server Actions were considered for mutations and deferred — revisit with a new
ADR if forms need progressive enhancement.

---

## ADR-0010 — SEO & performance hardening

**Status:** Accepted · 2026-05-21

**Decision.** `src/lib/site.ts` (`siteConfig`) is the single source of truth for
SEO. `metadataBase` is always set; `themeColor` lives on the `viewport` export.
Added `robots.ts`, `sitemap.ts`, JSON-LD, `loading.tsx` / `error.tsx` /
`not-found.tsx`, and `<ReducedMotion>`.

**Why.** Relative OG/canonical URLs never resolved to absolute, so social
previews broke in production; an animation-heavy starter ignored
`prefers-reduced-motion`; and the home view was a top-level `"use client"`,
breaking the server-first rule it should model.

**When building.** Set `NEXT_PUBLIC_SITE_URL` in every deployed environment or
canonical and OG URLs resolve to localhost. `<ReducedMotion>` toggles
react-spring's global `skipAnimation` from one app-root mount, covering every
spring and the text engine at once. **`isBot()` is discouraged** — it opts the
route out of static rendering and edges toward cloaking; reduced motion is the
preferred lever, since springs only animate opacity/transform and content is in
the DOM for crawlers regardless ([[seo-metadata]]).

---

## ADR-0009 — Shared animation ticker; authorised engine performance refactor

**Status:** Accepted · 2026-05-21 · amends ADR-0002

**Decision.** One-time authorised refactor of the protected engine, plus a shared
loop primitive: `src/lib/animation/ticker.ts` — a single app-wide,
reference-counted rAF loop that starts on the first subscriber and stops on the
last. It is **not** `#do-not-modify`; it is the supported extension point.

**Why.** Cost scaled with the number of animated components: a private rAF loop
per `useLoop` instance that never stopped, a debounced `resize` listener per
spring component, and an `IntersectionObserver` re-created on every render.

**When building.** A page with N animated components now runs **one** rAF loop
and **one** resize listener. Subscribe new per-frame work to the ticker rather
than starting a loop. Hard rule #2 was amended here: the engine stays protected
by default and changes need explicit sign-off — this ADR is not a precedent for
editing it.

---

## ADR-0008 — Adaptive scaling grid via root font-size

**Status:** Accepted · 2026-05-21

**Decision.** Keep a rem-based design proportional across viewports by scaling
`html { font-size }`: `vw`-based media queries in `globals.css` for scaling down,
and a `<AdaptiveGrid>` client component for scaling up beyond the largest
breakpoint.

**Why.** The behaviour arrived as a `styled-components` implementation, which is
not a project dependency and conflicts with the CSS-only config rule. Only the
behaviour was kept; the implementation was rebuilt on the project stack.

**When building.** Breakpoints live in `grid.config.ts` **and** are mirrored in
the `globals.css` media queries — duplicated by design, since ADR-0004 forbids
generating CSS config from JS. **Keep the two in sync**; the formula is written
in both files. Design px map cleanly to rem at the design base width.

---

## ADR-0007 — Automate the vault workflow with Claude Code hooks

**Status:** Accepted · 2026-05-21

**Decision.** Encode the "read the vault first, update the docs after" workflow as
hooks in `.claude/settings.json`: `SessionStart` injects a pointer to the vault,
`UserPromptSubmit` reminds the agent to consult the relevant guide,
and `Stop` blocks **once per turn** to confirm docs were updated.

**Why.** Documentation drifts the moment it depends on someone remembering.

**When building.** The `Stop` hook uses a `${TMPDIR}` marker keyed by session id
so it blocks at most once per turn — no infinite loop. Hooks are reviewable and
disableable via `/hooks`, and take effect at the next session start.

---

## ADR-0006 — The vault is the single source of truth

**Status:** Accepted · 2026-05-21 · amends ADR-0001

**Decision.** The vault is the **only** documentation source. The repo root keeps
thin shims: `AGENTS.md` carries the breaking-change warning and hard rules and
points into the vault; `CLAUDE.md` and `.cursorrules` `@`-import it.

**Why.** Dense spec files at the root duplicated the vault's content as terse
specs, and the two would drift.

**When building.** Put documentation in the vault and link to it. Keep the root
shims consistent with it — they are the first thing every agent reads.

---

## ADR-0005 — Use standard `next/link` for navigation

**Status:** Accepted · 2026-05-21

**Decision.** Standard Next.js navigation — `<Link>` from `next/link`,
`useRouter` from `next/navigation`. The custom `<AnimLink>` / `useAnimRouter()`
convention referenced in early drafts is dropped; it was never built.

**Why.** Two conflicting conventions existed in the docs and only one had code.

**When building.** No animated route-transition layer exists. If one is needed,
revisit with a new ADR rather than reviving the old names. See [[routing]].

---

## ADR-0004 — Tailwind v4 with CSS-based config

**Status:** Accepted (starter baseline) · amended by ADR-0012 and ADR-0015

**Decision.** All theme configuration lives in `globals.css` under `:root` and
`@theme inline`. There is no `tailwind.config.js`. Raw values in class names are
banned.

**Why.** Tailwind v4 removes the JS config file in favour of CSS-native config.

**When building.** Design tokens are the only styling currency: a value that does
not exist as a token gets added to `globals.css` first — following the three-tier
grammar (ADR-0015) — and component-specific *classes* do not go there at all
(ADR-0012). See [[design-system]].

---

## ADR-0003 — Routes delegate to Views

**Status:** Accepted (starter baseline)

**Decision.** `app/**/page.tsx` only imports and renders a component from
`src/views/`. All layout and UI logic lives in the view.

**Why.** Mixing routing concerns with page UI makes `app/` files heavy and hard
to test.

**When building.** Every route is a ~3-line file; views are the real page
components. `verify.sh` FAILs on a route importing anything else. See [[routing]].

---

## ADR-0002 — All motion is spring-based (`@react-spring/web`)

**Status:** Accepted (starter baseline) · amended by ADR-0014 and ADR-0009

**Decision.** Every animation uses `@react-spring/web` through the component
layer in `src/components/animation/springs/`. CSS keyframes and `framer-motion`
are **banned**. Text animation goes through `spring-text-engine`.

**Why.** Marketing sites need rich, interruptible, physically natural motion. CSS
transitions and keyframes are rigid; competing libraries add weight.

**When building.** The springs folder and `src/hooks/animation/` are
`#do-not-modify` — consume them, wrap them, never edit them without sign-off.
ADR-0014 narrows the CSS ban to allow `transition-*` for trivial hover/focus
state only. See [[animation-system]] and [[text-engine]].

---

## ADR-0001 — Adopt an Obsidian vault as the project brain

**Status:** Accepted (starter baseline) · amended by ADR-0006

**Decision.** `obsidian/` is a linked, navigable vault documenting how the
project is built and why.

**Why.** Project knowledge scattered across root markdown files gave new
contributors and AI agents no structured map of the system.

**When building.** Docs are maintained alongside code — see [[meta/README]] for
the maintenance rules, and [[agent-harness]] for how the vault and `.claude/`
divide the work.
