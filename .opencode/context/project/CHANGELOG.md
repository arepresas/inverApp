<!-- Context: project/changelog | Priority: low | Version: 1.0 | Updated: 2026-06-21 -->

# Project Context Changelog

Tracks changes to `.opencode/context/project/`. Per-file `Updated:` date is the source of truth for individual file freshness; this log captures **what** changed.

## 2026-06-21 — Initial context build

Created the project-specific ctx directory from a full read-through of the codebase. Goal: give AI agents (Claude Code, OpenCode, etc.) a fast, structured way to understand InverApp without re-scanning 30+ source files.

**Files created (11 total):**

- `README.md` — index for the ctx directory
- `navigation.md` — task → file router
- `loader.md` — loading protocol (classify task → load right file → sanity check)
- `architecture.md` — Vue → Pinia → Supabase/Yahoo layered diagram + module map
- `data-model.md` — tables, RLS, PPC cost basis, migration conventions
- `state-stores.md` — 5 Pinia stores with full field + computed + action maps
- `api-integration.md` — Supabase + Yahoo Finance internals
- `routing-views.md` — 5 routes + view→store→component wiring
- `conventions.md` — Vue 3, TS strict, naming, commit format
- `ui-system.md` — Mozaic components, CSS tokens, design system
- `feature-history.md` — build arc, prior sessions, current gaps
- `gotchas.md` — real traps (Mozaic props, Sass wrapper, RLS, etc.)
- `session-template.md` — template for `.tmp/sessions/<feature>/context.md`

**Companion updates:**

- `AGENTS.md` rewritten to point at `.opencode/context/project/` (was self-contained).
- `README.md` gained a "For AI Agents" section.

**Findings during the audit (also captured in `feature-history.md`):**

- 5 Pinia stores (auth, portfolio, transactions, watchlist, settings) — all setup-store style.
- 5 routes: `/`, `/dashboard`, `/buy`, `/sell`, `/settings` (4 auth-guarded).
- 9 SQL migrations in chronological order; latest = 2026-06-03 (country column).
- 27 sample assets in seed.sql across 6 asset types.
- Yahoo search filter blocks `bond`/`commodity`/`forex` quoteTypes (gap, not bug).
- `get_transaction_history` RPC has a defensive oversell clamp but does NOT block INSERTs.
- Two unused store fields: `byType` (portfolio) and `watchlistSymbols` (watchlist).
- One stale file in AGENTS.md (`src/views/TransactionsView.vue` doesn't exist).
- SettingsView has hardcoded `FLAGS` and `CURRENCY` maps outside the `COUNTRIES` const (could be consolidated).
