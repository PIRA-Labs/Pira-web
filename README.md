# PIRA — Physical Intelligence Runtime for Agents

> **Give AI access to reality. Keep humans in control.**

This repository is the **PIRA landing page** — the front door to the PIRA
project and the place to download the Android APK. PIRA itself (the runtime,
research, and experimentation) lives in its own organization and repositories;
this is just the website.

It is released as open source under the [MIT License](./LICENSE.md). The design
and 3D scene are adapted, with gratitude, from a template by Textura / GetLayers
— see [NOTICE.md](./NOTICE.md) for full credits.

## What's here

A single-screen cinematic landing: a WebGL meadow scene with a floating
Pirophone mascot, spring-based motion, and PIRA's own visual identity (indigo
dusk palette, Space Grotesk display type, viewfinder interface). The site
explains PIRA's Android runtime, controlled execution architecture, security
model, and developer path.

Tech: **Next.js 16**, **React 19**, **three.js**, **@react-spring/web**,
**Lenis**, **spring-text-engine**, **Tailwind CSS v4**, **Zustand**, **Zod**.

## Getting started

> Requires **Node 22.13+** (24 LTS recommended). See `.nvmrc`.

```bash
yarn install            # or: npm install
cp .env.example .env    # safe fallbacks included; dev works before you fill it
yarn dev                # http://localhost:3000
```

| Script | Purpose |
|--------|---------|
| `yarn dev` | Development server |
| `yarn build` | Production build |
| `yarn start` | Serve the production build |
| `yarn lint` | ESLint |

## Configuration

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical origin (falls back to the Vercel production domain) |

Download the Android v0.1.0 APK directly from
[`PIRA-Android-v0.1.0.apk`](https://github.com/PIRA-Labs/Pira-Android/releases/download/v0.1.0/PIRA-Android-v0.1.0.apk).
The Android source is [PIRA-Labs/Pira-Android](https://github.com/PIRA-Labs/Pira-Android),
and the navigation GitHub link points to [PIRA Labs](https://github.com/PIRA-Labs).

Rebuild after changing a public environment variable. See
[`obsidian/architecture/environment-variables.md`](./obsidian/architecture/environment-variables.md).

## Deploy

Next.js on **Vercel** with the default preset — no `vercel.json` needed. Import
the repo at [vercel.com/new](https://vercel.com/new), set the environment
variables in **Project Settings → Environment Variables**, and ship. `vercel
--prod` promotes to production from the CLI.

## Documentation

Project documentation lives in the **`obsidian/`** vault — architecture, the
animation system, conventions, and the scene's optimization history. Open that
folder in [Obsidian](https://obsidian.md), or start at
[`obsidian/README.md`](./obsidian/README.md).

## Credits

The 3D scene, motion system, and original composition are the work of
**[Textura](https://textura.agency)** / **GetLayers**; the grass shader derives
from **[pmndrs](https://github.com/pmndrs)**. PIRA adapted this into its own
identity with deep respect for their craft. Full acknowledgements:
[NOTICE.md](./NOTICE.md).
