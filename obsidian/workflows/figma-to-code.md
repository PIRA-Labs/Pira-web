---
tags: [workflow, design, stable]
updated: 2026-09-13
---

# Workflow — Figma → Code

How a design becomes components here. The procedure lives in the
`figma-to-section` skill; this note is the reasoning and the project-specific
mapping.

## The rule that matters most

**Build from live Figma data, never from a description.** Call
`get_design_context` (values, exact copy) *and* `get_screenshot` (layout) for
every node. A summary — including one you wrote yourself earlier in the session —
has already lost the 4px that makes it wrong.

Record the `fileKey` and every section's node ID in [[design-map]] — the vault's
`DESIGN-MAP.md`, kept here rather than at the repo root because documentation
lives in the vault ([[ai-agent-guide]]). A section with no recorded node ID cannot
be re-verified against its design later, which is what [[qa-verification]] layer 2
depends on.

> [!tip] Two routes to Figma, and the hosted one is not the only one
> If the hosted connector (`plugin:figma:figma`) is unauthorised, the **local Dev
> Mode MCP server** exposed by the running Figma desktop app —
> `http://127.0.0.1:3845/mcp`, JSON-RPC — serves `get_metadata` and
> `get_screenshot` without it. That is how this project's first frame was read.
>
> `get_design_context` needs one more thing there: a writable asset directory,
> which Figma gates behind **Dev Mode → MCP → Allowed directories**
> (`mcpAllowedDirectoriesByUser` in Figma's `settings.json`). That list is a
> permission boundary — ask the user to add the path; never edit it for them.

> [!warning] A frame with no children has nothing to port
> `get_metadata` returning a self-closing frame, and `get_variable_defs` returning
> `{}`, means the node is a **flat raster** — someone's render dropped into Figma.
> There are then no font names, no colour styles and no spacing to read, and any
> value you produce is measured off a screenshot with a pixel or two of error.
> Say so and ask for a layered node; measurements are a cross-check, never the
> source of truth for a port that is supposed to be exact.

> [!important] No access is not a licence to improvise
> If the Figma connector is unauthorised or the file is unreachable, the rule
> above does not relax — it binds hardest. Record what is known in [[design-map]],
> say plainly what is blocked, and build nothing. A plausible invented layout
> looks like progress and is wrong in every value that matters, and it is far
> more expensive to discover later than an hour of waiting for access.

## Assets

Figma asset URLs expire (~7 days), so download immediately into
`public/assets/<section>/` — one folder per section, per [[folder-structure]].

Two checks that catch the usual failures:

- `file <path>` — Figma frequently returns an SVG where a raster was requested,
  or a PNG named `.jpg`. A mismatched extension renders as a broken image.
- Size sanity — a content photo under ~5KB is a vector placeholder, not the export
  you wanted.

A failed download is reported to the user immediately, never silently skipped.

## Design values → tokens

This is where a Figma-to-code pipeline usually degrades into hardcoded values.
Map **before** writing markup, per [[design-system]]:

- each colour → a `--raw-*` primitive **plus** a Tier 2 semantic token naming its
  purpose (`--action-primary`, not `--blue-500` used directly)
- spacing/radius/type → reuse an existing token, or add one with a comment naming
  the Figma frame it came from
- a value that resists tokenisation is a **design-review flag** in the summary,
  not a magic number in a class

This project scales the root font-size with the viewport (the adaptive grid in
`globals.css`), so design px map cleanly to `rem` at the design base width. Check
the Figma frame width against those breakpoints before converting anything.

## Where we deliberately diverge from the design

A static Figma frame does not describe motion. This starter's whole purpose is
spring motion, so **adding restrained reveals, parallax and text animation is
correct**, not an invention — see [[animation-system]] and [[text-engine]].

Everything else in the frame is authoritative: copy is character-for-character,
and shadows/gradients/overlays/card wrappers that are not in the design do not get
added. An invented wrapper background is the most common cause of "the logo
disappeared".

## Related

[[new-page]] · [[generic-layout-prompt]] · [[design-system]] · [[qa-verification]] · [[agent-harness]]
