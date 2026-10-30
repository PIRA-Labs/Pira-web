---
tags: [workflow, ai, stable]
updated: 2026-09-12
---

# The Agent Harness (`.claude/`)

The vault is the project's **knowledge**. `.claude/` is its **execution layer** —
the commands, rules, skills, agents and scripts that turn the knowledge into
something an agent actually runs. ADR: [[decisions-log]] ADR-0018.

```
.mcp.json              # project MCP servers — currently the local Figma Dev Mode server
.claude/
├── settings.json      # hooks + permissions
├── launch.json        # preview-pane servers: `dev` (autoPort) and `prod` (`yarn start -p 3100`, after `yarn build`, for skill §0 measurements)
├── scripts/verify.sh  # mechanical rule checks — the only executable gate
├── rules/             # path-scoped context, auto-loaded per file touched
├── skills/            # procedures, loaded on demand by name or description
├── agents/            # subagents with their own context window
└── commands/          # slash commands — thin entry points a human types
```

## Which mechanism for what

| Mechanism | Loads when | Use for |
|-----------|-----------|---------|
| **Vault note** | an agent reads it | the *why*, reference, decisions |
| **Rule** (`rules/*.md`) | Claude reads a file matching `paths:` | short, non-negotiable constraints for that area |
| **Skill** (`skills/*/SKILL.md`) | invoked by name, or matched by description | multi-step procedures |
| **Agent** (`agents/*.md`) | delegated to | parallel or context-heavy work |
| **Command** (`commands/*.md`) | a human types `/name` | entry points to the above |
| **Hook** (`settings.json`) | a lifecycle event | enforcement that must not depend on the model deciding |

> [!note] `verify.sh` is fallible, and fixing it is in scope
> Its checks are greps, not a parser. One fired on the *correct* form —
> `duration-[var(--duration-fast)]` matched the bare-class check, because the
> token's own name contains the class as a substring — so the first component to
> follow the rule failed the gate. Fixed 2026-09-12 by requiring the match not be
> preceded by a hyphen. When a FAIL is the script's error rather than the code's,
> fix the script and prove it still catches a genuine violation (a throwaway file
> under `src/` is enough), rather than contorting the code around it.

> [!important] Figma reaches this project through a **local** MCP server
> The hosted Figma connector is not authorised for this workspace. The design is
> reachable instead through the **Figma Dev Mode MCP server** that the desktop app
> exposes on `http://127.0.0.1:3845/mcp`, registered in `.mcp.json`. It only
> answers while Figma desktop is running with the file open in Dev Mode, and it
> reports the **current selection** when `get_metadata` is called with no node id
> — which is the cheap, reliable way to get a frame's real ID.
>
> **Its quota is small, daily, and shared across every agent.** A run that swept
> ~320 node IDs looking for a parent frame exhausted it for a full rolling 24
> hours and cost a day of work. Never sweep ID ranges. `initialize` and
> `tools/list` are protocol-level and cost **nothing**, so probe with those when
> checking whether the server is alive:
>
> ```bash
> curl -s -X POST http://127.0.0.1:3845/mcp >   -H "Content-Type: application/json" >   -H "Accept: application/json, text/event-stream" >   -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"1.0"}}}'
> ```

> [!warning] "Port in use" from the preview pane is usually the wrong diagnosis
> Next 16 refuses to start a **second `next dev` for the same directory**, whatever
> port it is offered — it exits 1 with *"Another next dev server is already
> running"* and prints the holder's PID. The harness reports the collision as a
> port problem, so the obvious fix (`autoPort`) changes nothing: a fresh port
> still hits the same refusal.
>
> `launch.json` carries `autoPort: true` because this project needs no fixed port
> (no OAuth callbacks, no webhooks — `CONTACT_ENDPOINT` is unset). When the pane
> still fails, read `preview_logs` before touching config: if a dev server for
> this directory is already up, point the preview at **its** URL instead of
> starting another.

> [!warning] Path-scoped rules fire on **read**, not write
> A `paths:`-scoped rule enters context when Claude *reads* a matching file — not
> when it creates one. A file written from scratch may never trigger its rule. So
> rules reinforce; they do not guarantee. Anything that must hold regardless
> belongs in `verify.sh` or a hook.
> They are also not re-injected after `/compact` until a matching file is read again.

## Rules

| Rule | Scoped to | Carries |
|------|-----------|---------|
| `motion.md` | components, views, layouts | springs-only, CSS exception, text-engine traps |
| `design-tokens.md` | `globals.css`, `src/style/` | the three-tier convention |
| `routing-views.md` | `src/app/`, `src/views/` | route→view delegation, server-first, `proxy.ts` |
| `api-env.md` | `src/app/api/`, `src/lib/api/`, `env.ts` | server-side calls, secrets, zod, envelope |
| `engine-protected.md` | the animation engine | do-not-modify |
| `payload.md` | Payload config & collections | generated types, Local API, migrations |
| `supabase.md` | Supabase clients, `proxy.ts` | connection strings, keys, RLS |

## Skills

| Skill | Invoke when | Note |
|-------|-------------|------|
| `qa-verify` | after any UI work, before committing | [[qa-verification]] |
| `figma-to-section` | a Figma URL or frame arrives | [[figma-to-code]] |
| `payload-cms` | adding/changing the CMS | [[cms-payload]] |
| `supabase-db` | database, migrations, RLS | [[database-supabase]] |
| `supabase-auth` | the project needs real user accounts | [[database-supabase]] |
| `seo-audit` | SEO health check or launch prep | [[seo-aeo]] |
| `schema-markup` | structured data | [[seo-aeo]] |
| `aeo-visibility` | AI/answer-engine visibility | [[seo-aeo]] |
| `site-migration` | rebuilding an existing live site | [[site-migration]] |
| `ship-check` | pre-launch gate | [[ship]] |
| `optimize-3d-scene` | perf work on a three.js/WebGL scene | [[optimize-3d-scene]] |

## Agents

| Agent | Use for |
|-------|---------|
| `section-builder` | one Figma section each, in parallel |
| `motion-reviewer` | auditing animation-heavy work |
| `vault-librarian` | syncing the vault after a change |
| `seo-auditor` | a full SEO/AEO audit with fixes |

## Commands

`/new-page` · `/section` · `/qa` · `/ship` · `/cms` · `/db` · `/seo` · `/migrate-site`

## Registering something new

1. Drop it in the right `.claude/` folder.
2. Add a vault note under `workflows/` (or extend an existing one).
3. Link it from [[README]] and from the tables above and in [[ai-agent-guide]].
4. Log it in [[changelog]]; add an ADR if it changes how work is done.

## Related

[[ai-agent-guide]] · [[qa-verification]] · [[new-page]] · [[decisions-log]]
