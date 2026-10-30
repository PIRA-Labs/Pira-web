---
tags: [moc, home]
updated: 2026-09-14
---

# 🧠 PIRA — Project Brain

This vault is the **single source of truth** for the **PIRA** website (package
name `pira-web`). It documents how the project is built, why decisions were
made, and how to extend it — for both humans and AI agents.

> [!info] What is this project?
> `pira-web` is the **PIRA landing page** — the front door to the PIRA project
> and the APK download. It is built on a **Next.js 16 starter** by
> [Textura](https://textura.agency) / GetLayers for animation-heavy landing
> sites; every motion is spring-based. The source of this landing is MIT; the
> template's design is credited in [NOTICE.md](../NOTICE.md). There is no
> backend yet.

## Current project

**PIRA — Physical Intelligence Runtime for Agents.** Website configuration,
release URLs, routes, assets and verification: [[pira-website]]. The starter
and previous brand notes below are historical implementation context.

## 🗺️ Map of Content

### 00 — Meta
- [[meta/README|Meta overview]] — how to use and maintain this vault
- [[changelog]] — log of notable changes to **this** project (starts fresh per project)
- [[decisions-log]] — Architecture Decision Records: why the conventions are what they are
- [[optimization-history]] — what the optimization pipeline changed here, why, and what must not be undone

### 01 — Architecture
- [[system-overview]] — the big picture, request lifecycle, mental model
- [[tech-stack]] — every dependency and why it is here
- [[folder-structure]] — where everything lives and what belongs where
- [[data-flow]] — how state, scroll, and animation data move through the app
- [[environment-variables]] — config & secrets handling

### 02 — Frontend
- [[routing]] — App Router conventions, route → view delegation
- [[design-system]] — Tailwind v4 tokens, CSS layers, styling rules
- [[animation-system]] — the spring component library (the core of this starter)
- [[text-engine]] — `spring-text-engine` usage summary & project rules
- [[text-engine-reference]] — full `spring-text-engine` API reference
- [[smooth-scroll]] — Lenis integration + scroll store
- [[component-conventions]] — how to write & place components
- [[html-semantics]] — semantic, accessible, SEO-correct markup rules
- [[seo-metadata]] — metadata generation & bot detection
- [[components/animation-springs|Spring components catalog]]
- [[components/common|Common components catalog]]
- [[components/scene|Scene components catalog]] — WebGL scenes
- [[components/ui|UI primitives catalog]] — GlassPillLink, ActionLink
- [[design-map]] — Figma file keys and node IDs per section
- [[hooks]] — custom hooks catalog
- [[utils]] — utility functions catalog

### 03 — Backend
- [[backend/README|Backend overview]] — API layer, CMS & database
- [[api-architecture]] — `app/api` route-handler convention & secret handling
- [[cms-payload]] — Payload CMS, installed per project into this Next app
- [[database-supabase]] — Supabase Postgres: connections, keys, RLS, migrations

### 04 — Workflows
- [[ai-agent-guide]] — rules of engagement for AI agents working in this repo
- [[agent-harness]] — the `.claude/` execution layer: commands, rules, skills, agents
- [[new-page]] — playbook for implementing a new page/section
- [[generic-layout-prompt]] — fill-in prompt template for a new page/section
- [[figma-to-code]] — turning a Figma frame into components
- [[qa-verification]] — how work is checked before it is called done
- [[ship]] — the pre-launch gate and deployment
- [[seo-aeo]] — SEO & answer-engine visibility as an ongoing practice
- [[site-migration]] — protecting rankings when rebuilding a live site
- [[optimize-3d-scene]] — performance work on a three.js/WebGL scene

### Templates
- [[templates/component-note|Component note template]]
- [[templates/hook-note|Hook note template]]
- [[templates/adr-note|ADR template]]

## 🏷️ Tag legend

| Tag | Meaning |
|-----|---------|
| `#stable` | Documented and reliable — safe to depend on |
| `#wip` | Work in progress / partially documented |
| `#todo` | Needs attention or is unfinished |
| `#decision` | Records or relates to an architectural decision |
| `#do-not-modify` | Code that must not be edited (animation engine) |

## 🔌 Obsidian setup

Open this folder (`obsidian/`) as an Obsidian vault. Recommended:
- **Graph view** — see how specs, components, and hooks connect
- **Dataview plugin** — query notes (e.g. list all `#wip` pages)
- **Templates core plugin** — point it at the `templates/` folder
