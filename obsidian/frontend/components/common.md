---
tags: [frontend, stable]
updated: 2026-09-14
---

# Catalog — Common Components

Files in `src/components/common/` — shared infrastructure that may depend on
providers. Conventions: [[component-conventions]].

## Cookie — `Cookie/`

Self-contained cookie consent system — a bottom-right **banner** plus a full
category **preferences modal**. No third-party library (the old
`react-cookie-consent` dependency was removed). Lives in `src/components/common/Cookie/`.

| File | Role |
|------|------|
| `Cookie.tsx` | Mount component — hydrates the store, renders banner + modal |
| `LazyCookie.tsx` | `next/dynamic` `ssr:false` wrapper — keeps cookie JS out of first-load |
| `CookieBanner.tsx` | Bottom-right consent banner |
| `CookiePreferencesModal.tsx` | Category preferences dialog with per-category toggles |
| `CookieButton.tsx` | Local button primitive — `primary` / `secondary` variants |
| `cookieStore.ts` | Zustand store + `localStorage` persistence |
| `index.ts` | Barrel exports — `Cookie`, `LazyCookie`, `useCookieStore`, `CookieConsent` |

**Mounting** — the root layout renders `<LazyCookie />` inside `ScrollLayout`:
```tsx
import { LazyCookie } from "@/components/common/Cookie";
```

**State** — `useCookieStore` (Zustand). `consent` is `null` until the user decides;
the banner shows only after hydration confirms `consent === null`. Persisted to
`localStorage` under key `cookie-consent-v1`. Three categories: `necessary`
(always on), `analytics`, `marketing`.

**Styling & motion** — ported to the project stack: Tailwind v4 with the
`background` / `foreground` design tokens (dark-mode adaptive, no hardcoded hex),
and `@react-spring/web` for all motion — `useTransition` drives the banner and
modal mount/unmount, `useSpring` drives the toggle knob. No CSS transitions.
The modal locks scroll through the Lenis [[smooth-scroll|scroll store]]
(`useScroll.stop()`), not `body` overflow.

> [!note] `#todo`
> The privacy-policy link points to `/privacy-policy` — that route does not exist
> yet. Placeholder consent copy should be reviewed before launch.

## Grid — adaptive scaling (`grid/`)

The **adaptive scaling grid** keeps a rem-based layout proportional across every
viewport by scaling the root (`<html>`) font-size. Design in `rem` once, and the
whole UI scales as one unit. Lives in `src/components/common/grid/`.

| File | Role |
|------|------|
| `grid.config.ts` | Breakpoints + `FONT_BASE` — the single source of truth for the grid |
| `adaptive-grid.tsx` | `<AdaptiveGrid>` client component — drives the scale-up, renders `null` |
| `index.ts` | Barrel exports — `AdaptiveGrid`, `GRID_BREAKPOINTS`, … |

**How it works** — two halves cover the whole viewport range:

- **Scale down** (viewport ≤ 1920px) — `vw`-based `html { font-size }` media
  queries in `globals.css`. At each breakpoint's design base width the root
  font-size resolves to 16px; between breakpoints it tracks the viewport.
- **Scale up** (viewport > 1920px) — the `<AdaptiveGrid>` component sets an
  inline `html` font-size at runtime via [[hooks|`useAdaptiveGrid`]], so the
  design keeps growing (damped by `coef`) on large displays.

The `globals.css` media queries and `grid.config.ts` describe the same
breakpoints — **keep them in sync** (formula: `font-size = 16 * 100 / baseWidth vw`).

**Mounting** — the root layout renders `<AdaptiveGrid />` inside `ScrollLayout`:
```tsx
import { AdaptiveGrid } from "@/components/common/grid";
```
Mount it once. Props: `baseWidth` (defaults to the largest breakpoint) and
`coef` (0–1 scale-up damping, default `0.6666`).

> [!note]
> This replaced a `styled-components`-based scaling system that was dropped into
> `common/` — see [[decisions-log]] ADR-0008. `styled-components` is **not** a
> project dependency; the scale-down CSS lives in `globals.css` per [[design-system]].

## ReducedMotion — `reduced-motion.tsx`

`<ReducedMotion>` — a client leaf that calls react-spring's `useReducedMotion()`.
It watches the `prefers-reduced-motion` media query and toggles react-spring's
global `skipAnimation`, so every spring — and `spring-text-engine` — jumps to its
end state instead of animating. Renders `null`; mounted once in the root layout.
See [[animation-system]] and [[seo-metadata]].

## Skeleton loaders

Three skeleton components for `loading` states of async-data components — every
async component must mirror its final layout with one of these
(see [[component-conventions]]).

| Component | File | For |
|-----------|------|-----|
| `<SkeletonImage>` | `skeleton-image.tsx` | image placeholders |
| `<SkeletonLoader>` | `skeleton-loader.tsx` | generic block placeholders |
| `<SkeletonVideo>` | `skeleton-video.tsx` | video placeholders |

> [!note]
> Design-system primitives live in `components/ui/` — see [[components/ui]].

## Preloader — `preloader/`

A full-screen curtain loader with a script counter, plus the pieces that feed it and wait for it
(ADR-0040). State lives in `usePreloader` ([[hooks]]).

| File | Export | Role |
|------|--------|------|
| `preloader.tsx` | `Preloader` | White curtain with a large Dancing Script `0%`–`100%` counter (`text-counter`, 180 design-px; `text-counter-compact`, 64, at the ≤ 640 px tier, where 180 filled the phone's width). The count is drawn twice: a pale ghost (`preloader-counter`) and a gradient copy (`preloader-fill-start` → `-end`) clipped with `clip-path: inset(…)` from the bottom up. The gradient's `background-size` tracks the filled height, so its blue edge rides the fill line. At 100 % it holds for 260 ms, then the whole curtain, counter included, springs to `y: -100%`. At the same moment it flips `revealed` and unmounts 1.7 s later. |
| `preloaded-grass-field.tsx` | `PreloadedGrassField` | `LazyGrassField`, reporting its load progress and first finished frame to the store, and firing the reveal gust (`gust={revealed}`, ADR-0041). For crawlers and audit tools (`isBotUserAgent(navigator.userAgent)`) and for devices with no WebGL it renders the `poster` image instead, so the `three` chunk is never requested. The check runs client-side (`useSyncExternalStore`, `null` while hydrating), which keeps `/` statically prerendered (ADR-0042). |
| `reveal.tsx` | `Reveal`, `RevealText` | Entrance animations held until `revealed`. `Reveal` wraps `<Spring>` with presets (`rise`, `focus`, `fade`, `surface`, `drawX`, `drawY`, `bracket`). `RevealText` wraps `TextEngine` for word-by-word blur reveals, without `overflow`. |
| `index.ts` | barrel | All of the above. |

**Progress.** The bar never shows raw numbers:
- It creeps to 18 % over 2.4 s until something reports.
- The scene's request fraction is scaled into 15–92 %.
- It reaches 100 % only on `ready`.
- The shown value follows with an exponential ease (0.3 s), capped at 62 % per
  second so a fast load still counts visibly. It is driven by the shared ticker
  and written straight to the DOM, not to React state.
- A hidden `100%` reserves the counter's width, so the proportional script
  digits don't shift the centred number. Its `0.14em` vertical padding keeps the
  clip box from shaving the script's ascenders.

**Timing.**
- It stays on screen for at least `minDuration` (1.8 s).
- `timeout` (12 s) forces `ready`, so a stalled request never traps the page.

**Accessibility.** The root is `role="progressbar"`, with `aria-valuenow` updated
per frame and an `aria-label` from props. The visual counter is `aria-hidden`.

```tsx
<PreloadedGrassField className="absolute inset-0 block h-full w-full" controls />
<Reveal tag="span" preset="rise" delay={350}>…</Reveal>
<RevealText delay={600} stagger={110}>{title}</RevealText>
<Preloader content={homePreloader} />
```

> [!warning] Never put `filter` or `opacity` animation on an ancestor of a glass surface
> A filtered (or semi-transparent) ancestor becomes a **backdrop root**. While it
> is one, the child's `backdrop-blur` samples nothing, and `blur(0px)` keeps the
> element a root even after the spring settles. That is why `GlassPillLink` and
> `ActionLink` render their surface as a separate element (`renderSurface`),
> animated with the `surface` preset (opacity + scale on itself), while the
> label gets the blur.

## Related

[[component-conventions]] · [[components/animation-springs]]

## PIRA adaptation (2026-10-29)

`SiteFooter` (`views/home/site-footer.tsx`) is a server-rendered shared identity
and privacy footer. `HomeView` adds the server-rendered `Capabilities` section,
fed by `data/pira.ts`, below the preserved WebGL hero. `ProjectView`
(`views/project.tsx`) renders five typed project documents—including the
security model—without WebGL. `PreloadedGrassField` now accepts a portrait
`posterMobile` source through a native picture element. See [[pira-website]].
