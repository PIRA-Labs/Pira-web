---
tags: [frontend, stable]
updated: 2026-09-14
---

# Catalog — UI Primitives

Files in `src/components/ui/`: stateless design-system primitives with no provider
dependencies. They are Server Components, and they get their copy and hrefs from props.
Conventions: [[component-conventions]].

Both were built from the hero in Figma ([[design-map]], node `3255:783`). They are
styled for the **overlay** palette (`overlay-*` tokens), which is text over the
WebGL scene. They are not styled for the document's `background`/`foreground` scheme.

| File | Export | What it is |
|------|--------|------------|
| `glass-pill-link.tsx` | `GlassPillLink` | Frosted translucent pill (`bg-overlay-glass`, `backdrop-blur-glass`, `rounded-pill`). Label is Mulish 14 / 1.2, uppercase. The caller sets the width (`w-25` nav, `w-32.5` header action). |
| `action-link.tsx` | `ActionLink` | Primary call to action: a cream frosted capsule with the label and a black 48 px icon tile. `icon` is a path to a 24 × 24 decorative SVG. |

```tsx
<GlassPillLink href="#pricing" className="w-25">PRICING</GlassPillLink>
<ActionLink href="#start" label="Start with one tape" icon="/assets/hero/approximately-equal.svg" />
```

Both render `next/link`. Each has a `focus-visible` outline in `overlay-text` and
hover states added 2026-09-14 (Figma has none, so each steps an existing
surface one notch brighter). `GlassPillLink` glass goes from `overlay-glass` to
`overlay-glass-hover` (10 → 20 % white). `ActionLink` surface goes from
`overlay-action` to `overlay-action-hover` (80 → 100 % cream), and its icon
scales to 1.15. Both use `transition-* duration-[var(--duration-normal)]
ease-entrance` (ADR-0014) and the same states apply on `:focus-visible` through
`group-focus-visible`. The transition sits on the surface element, whose
entrance spring animates only opacity and scale, so the two never conflict. `className` is appended
to the root and is meant for sizing and positioning only. The link gets
`relative` unless `className` already sets `absolute`, `fixed` or `sticky`,
because two position utilities resolve by stylesheet order.

**Animation slots.** The frosted background is a separate, absolutely positioned
element, not a class on the link. `renderSurface(className)` replaces it, and
`renderLabel(node)` / `renderIcon(node)` (the latter on `ActionLink` only) wrap
the parts. This lets the hero animate the glass with opacity and scale while the
text blurs in, without turning the link into a backdrop root. See the warning in
[[components/common]].

## Related

[[design-system]] · [[components/scene]] · [[design-map]]
