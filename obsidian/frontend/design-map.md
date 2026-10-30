---
tags: [frontend, design, stable]
updated: 2026-09-14
---

# Design Map

Figma sources for everything built in this project: the file key, and the node ID
of every section. Required by [[figma-to-code]] — a section with no recorded node
ID cannot be re-verified against its design later, which is what
[[qa-verification]] layer 2 depends on.

> [!note] Where this lives
> [[figma-to-code]] calls it `DESIGN-MAP.md` without a path. It is kept in the
> vault rather than at the repo root because the vault is the single source of
> truth for documentation ([[ai-agent-guide]]) and the root is a fixed, short list
> of config and AI entry points ([[folder-structure]]).

## Get Layers

| Field | Value |
|-------|-------|
| File key | `WINXFW2nTM7zYwd5dGgm1T` |
| File | Get Layers |
| Access | **Hosted Figma connector** (claude.ai connector, `get_design_context`). See *Access* below. |
| **Frame width** | **1440 px** (× 800 px tall) |

The 1440 px base width lands exactly on the `max-width: 1440px` tier of the
adaptive grid in `src/app/globals.css` (`font-size: 1.111111vw` = `16 × 100 / 1440`),
so **design px ÷ 16 = rem** and **design px ÷ 4 = spacing unit**. See [[design-system]].

### Sections

| Section | Node ID | View / component | Background |
|---------|---------|------------------|------------|
| Hero overlay | `3255-783` | `views/home.tsx` → `views/home/site-header.tsx`, `views/home/hero-content.tsx`, `views/home/hero-frame.tsx`; primitives in [[components/ui]] | the WebGL grass field ([[components/scene]]) |

**The background is a placeholder.** Confirmed by the author 2026-09-13: the
raster behind the design (a 3838×1939 still of the built scene) was dropped into
Figma purely so the UI could be drawn over something. The scene stays exactly as
tuned and the plate is **not exported**. The deliverable is the UI overlay only.

### Access

`get_design_context` on `3255:783` via the **hosted connector** returns the full
layer tree as reference code plus asset URLs (they expire after ~7 days, so every
asset is downloaded and committed). The two other routes do not work here:

- **Local Dev Mode server** (`127.0.0.1:3845`, registered in `.mcp.json`) insists
  on writing assets to a `dirForAssetWrites` that must be on Figma's *Allowed
  directories* list. That list is a permission boundary, and agents do not edit it.
- **`plugin:figma:figma`** is unauthorised.

> [!warning] Never sweep node IDs
> On 2026-09-13 an agent brute-forced ~320 IDs looking for a parent frame and
> burned a full day of the local server's quota. Call `get_design_context` on the
> URL's node. If the node isn't the one you need, ask for the right URL.

### Hero overlay: values read from `get_design_context`

All positions are design px in the 1440×800 frame.

| Element | Node | Geometry | Style |
|---------|------|----------|-------|
| Logo | `3260:924` | left 24, top 23 | Open Sans 400, 18 / 1.0; `long.` white, `play` white 60 % |
| Nav group | `3255:800` | centred, top 16, gap 4 | 4 pills |
| ↳ pill | `3255:880–883` | w 100, px 12, py 8 | `rgba(255,255,255,.1)`, backdrop blur 4, radius 6. Label Mulish 400, 14 / 1.2, white, uppercase |
| Header action | `3255:890` | right 24, top 16, w 130 | same pill. "Get started" |
| Top hairline | `3260:916` | y 65, full width | white 20 % |
| Vertical hairlines | `3260:918–919` | x 24 and 1416, y 65 → 738 | white 20 % |
| Corner brackets | `3260:920–923` | 17.5 px, one per frame corner | white stroke; the same vector mirrored |
| Headline | `3255:832` | centred, top 113 | **Dancing Script 700**, 80 / 1.0, white |
| Sub-headline | `3255:878` | centred, top 193 | Open Sans 400, 56 / 1.0, white 60 % |
| Body | `3255:833` | centred, top 570, w 614 | Open Sans 400, 18 / 1.2, white, centred |
| Primary action | `3255:893` | centred, top 646, h 52 | `rgba(255,251,246,.8)`, blur 8, radius 16, pl 32 / pr 2 / py 2, gap 24. Label Open Sans 18 / 1.2 black |
| ↳ icon tile | `3260:898` | 48 × 48 | black, radius 14, 24 px `approximately-equal` icon |
| Bottom band | `3260:931` | y 738, h 62, full width | `rgba(255,251,246,.05)`, blur 8 |
| Bottom hairline | `3260:917` | y 738, full width | white 20 % |
| Trust line | `3260:915` | centred, top 754, gap 8 | 30 px `security` icon. Mulish 400, 18 / 1.2, white 60 %, uppercase |

Copy is in `src/data/mocks/home.ts`, character for character. Uppercase labels
are mixed-case in the layers (`Contacts`, `Get started`,
`Privacy-first. no data resold.`) and upper-cased by CSS, as in Figma.

Rendered geometry at 1440×800 was measured in the browser against this table:
everything is within ~1 px. The remaining sub-pixel differences are Figma
centring its 1 px strokes on half-pixel coordinates.

### Fonts

| Role | Family | Loaded as |
|------|--------|-----------|
| Nav, header action, trust line | **Mulish** 400 (Google Fonts) | `--font-mulish` → `font-ui` |
| Logo, sub-headline, body, primary action | **Open Sans** 400 (Google Fonts) | `--font-open-sans` → `font-body` |
| Headline | **Dancing Script** 700 (Google Fonts) | `--font-dancing-script` → `font-script` |

All three come from the file. The author had pointed at Fontshare, but no family
in this frame is a Fontshare font, so nothing is loaded from there.

### Assets — `public/assets/hero/`

| File | Figma | Notes |
|------|-------|-------|
| `approximately-equal.svg` | inside `3260:898` | two-colour strokes, 24 × 24 |
| `security.svg` | inside `3260:915` | 30 × 30 |
| `corner-bracket.svg` | `3260:920` (= `3260:921–923`) | Figma exports two byte-identical vectors; one file, mirrored with `-scale-*` |

The hairlines (`Line 358`, `Line 360`) are plain 1 px white-20 % strokes. They
are drawn as CSS borders on the `overlay-hairline` token so they stretch with the
viewport height. They are not image assets.

### Not in the design — adaptations

- **Phones (≤ 640 px).** No mobile frame exists. At that tier the nav pills are
  hidden (a mobile menu was never designed). The headline and sub-headline drop to
  half size (`text-display-compact`, `text-subtitle-compact`), and the trust line
  uses the 14 px label size so it stays on one line. **Replace this with a real
  mobile frame when one exists.**
- **Viewport heights other than 800.** The header and headline stay anchored to
  the top. Body copy, action and band stay anchored to the bottom. The frame
  stretches between them.
- **Hover states.** None are designed, so none are added. Focus-visible outlines
  are there for accessibility.
- **Link targets.** These are placeholders (`#services` …), because those sections don't exist yet.

## Related

[[figma-to-code]] · [[qa-verification]] · [[design-system]] · [[new-page]] · [[components/scene]] · [[components/ui]]
