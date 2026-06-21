<!-- Context: project/navigation | Priority: critical | Version: 1.0 | Updated: 2026-06-21 -->

# InverApp — Project Context Navigation

**AI agents working on InverApp: start here.**

InverApp = investment portfolio tracker. Vue 3 + Mozaic UI + Supabase (Postgres + Auth) + Yahoo Finance.

This directory contains project-specific knowledge. Load relevant files BEFORE planning work.

---

## Quick Routes

| Task | File |
|------|------|
| **Loading protocol / which file to read first** | `loader.md` |
| **Start a multi-file feature (session bundle)** | `session-template.md` |
| **Understand overall structure** | `architecture.md` |
| **Work on database / SQL / RLS** | `data-model.md` |
| **Modify or add Pinia stores** | `state-stores.md` |
| **Work with Supabase client or Yahoo API** | `api-integration.md` |
| **Add/modify routes or views** | `routing-views.md` |
| **Code style, file naming, conventions** | `conventions.md` |
| **Mozaic UI components, design tokens** | `ui-system.md` |
| **What's been built / recent work** | `feature-history.md` |
| **Known pitfalls, traps** | `gotchas.md` |

---

## File Index

| File | Purpose |
|------|---------|
| `loader.md` | Task→file router + loading protocol + post-task update rules. |
| `architecture.md` | Layered structure: Vue → Pinia → Supabase/Yahoo. Module map. |
| `data-model.md` | Tables, RLS policies, PPC cost basis, RPC functions, migration conventions. |
| `state-stores.md` | 5 Pinia stores: auth, portfolio, transactions, watchlist, settings. Stores of record. |
| `api-integration.md` | Supabase client, Yahoo Finance proxy, currency inference, asset auto-add. |
| `routing-views.md` | 5 routes (1 public + 4 protected). View per route. Auth guard logic. |
| `conventions.md` | Vue 3 Composition API, TS strict, no semicolons in SFCs, store/async naming. |
| `ui-system.md` | Mozaic prop quirks (size="s", MStatusNotification shape), CSS tokens. |
| `feature-history.md` | Past features built, sessions archived, evolution arc. |
| `gotchas.md` | Mozaic props, Sass modern API wrapper, pnpm 11 quirks, RLS oversell pattern. |

---

## Project TL;DR

- **Domain**: personal investment tracking (buy/sell assets, watchlist, P&L)
- **Cost basis method**: PPC (Prix de Revient Unitaire / weighted average)
- **Auth**: Google OAuth via Supabase, RLS on every table
- **State**: Pinia setup stores, one per domain area
- **UI**: Mozaic Design System (ADEO), Inter font, refined minimalist tokens
- **External data**: Yahoo Finance via Vite dev proxy (prod needs Cloudflare Worker or similar)
- **No tests yet** — vitest configured but `tests/` empty
- **Multi-currency**: per-asset currency, summed/displayed via locale from settings store

---

## Load Order

For ANY task, load in this order:

1. **Always**: `conventions.md` (style/naming baseline)
2. **By task type** (from table above)
3. **Cross-cutting**: `gotchas.md` (always skim before writing code)

For DB work → `data-model.md` + check latest migration date.
For UI work → `ui-system.md` + check current `src/styles/global.css`.
For new features → check `feature-history.md` for prior patterns.
