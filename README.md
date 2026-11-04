# PIRA Web

**PIRA landing page — public product experience**
**Status:** Live · v0.1.0 · MIT License
**Repository:** [PIRA-Labs/Pira-web](https://github.com/PIRA-Labs/Pira-web)

---

## Reviewer quick start (3-minute verification)

```bash
# 1. Clone
git clone https://github.com/PIRA-Labs/Pira-web.git
cd Pira-web

# 2. Install
yarn install   # or: npm install

# 3. Build (verify it compiles)
yarn build

# 4. Expected output
# - Production build in .next/
# - No TypeScript or ESLint errors
```

**What a reviewer can verify in 3 minutes:**
- `yarn build` succeeds with no errors
- `yarn lint` passes
- The site renders at `http://localhost:3000` with `yarn dev`
- The APK download link points to the actual GitHub release asset
- The navigation links to `PIRA-Labs` on GitHub

---

## What this repository is

This is the **PIRA public landing page**. It presents the product, research lineage, and download path for the Android runtime.

It is released as open source under the [MIT License](./LICENSE.md).

---

## What this repository is NOT

- It is not the PIRA runtime or authorization engine
- It is not the research archive
- It is not the Android implementation
- It is not endorsed by Nebius, Xiaomi, or any third party
- It does not call Nebius, Tavily, or Xiaomi APIs directly

---

## What's here

- WebGL landing experience with PIRA visual identity
- Scroll-driven product narrative
- APK download link
- Links to PIRA Android and PIRA Research

---

## Tech stack

| Tool | Version | Purpose |
|------|---------|---------|
| Next.js | 16.3.1 | Framework |
| React | 19.2.8 | UI |
| three.js | 0.160.1 | WebGL scene |
| @react-spring/web | 10.1.2 | Motion |
| Lenis | 1.3.26 | Smooth scroll |
| spring-text-engine | 0.1.5 | Text animation |
| Tailwind CSS | v4 | Styling |
| Zustand | latest | State |
| Zod | latest | Schema validation |

---

## Getting started

**Requirements:** Node 22.13+ (24 LTS recommended). See `.nvmrc`.

```bash
yarn install            # or: npm install
cp .env.example .env    # safe fallbacks included; dev works before you fill it
yarn dev                # http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `yarn dev` | Development server |
| `yarn build` | Production build |
| `yarn start` | Serve production build |
| `yarn lint` | ESLint |

---

## Configuration

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (falls back to Vercel production domain) |

Rebuild after changing any public environment variable.

---

## Deploy

Next.js on **Vercel** with the default preset — no `vercel.json` needed.

1. Import the repo at [vercel.com/new](https://vercel.com/new)
2. Set environment variables in **Project Settings → Environment Variables**
3. Ship

`vercel --prod` promotes to production from the CLI.

---

## APK download

The Android v0.1.0 APK is available at:
[`PIRA-Android-v0.1.0.apk`](https://github.com/PIRA-Labs/Pira-Android/releases/download/v0.1.0/PIRA-Android-v0.1.0.apk)

The Android source is [PIRA-Labs/Pira-Android](https://github.com/PIRA-Labs/Pira-Android).

---

## Documentation

Project documentation lives in the **`obsidian/`** vault — architecture,
animation system, conventions, and the scene's optimization history.

Open that folder in [Obsidian](https://obsidian.md), or start at
[`obsidian/README.md`](./obsidian/README.md).

---

## Credits

The 3D scene, motion system, and original composition are the work of
**[Textura](https://textura.agency)** / **GetLayers**; the grass shader derives
from **[pmndrs](https://github.com/pmndrs)**. PIRA adapted this into its own
identity with deep respect for their craft.

Full acknowledgements: [NOTICE.md](./NOTICE.md).

---

## What a reviewer should know

1. **This is a presentation layer, not the runtime.** The actual
   PIRA trust boundary, policy engine, and capability execution live in
   `PIRA-Labs/Pira-Android`.

2. **The APK link points to a real release asset.** If the link returns 404,
   the `Pira-Android` release has not been made public yet.

3. **No third-party APIs are called from this repo.** Nebius, Tavily, and
   Xiaomi integrations are in the Android runtime. This repo is static.

4. **The design is adapted from a template.** The meadow scene, motion system,
   and UI structure derive from Textura/GetLayers with modifications. See
   `NOTICE.md` for the full attribution.

---

*README maintained by PIRA-Labs.
Last updated: 2026-11-04*
