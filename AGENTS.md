# AGENTS.md

> Auto-resume context for AI agents working on InverApp. Keep this file updated.

## Agent Context (READ FIRST)

**Project-specific knowledge for AI agents lives in `.opencode/context/project/`.**

Start at `.opencode/context/project/navigation.md`. It routes to:

| Need | File |
|------|------|
| Architecture, data flow, module map | `architecture.md` |
| DB schema, RLS, PPC cost basis, migrations | `data-model.md` |
| Pinia stores (state of record) | `state-stores.md` |
| Supabase client + Yahoo Finance integration | `api-integration.md` |
| Routes, views, view→store→component wiring | `routing-views.md` |
| Vue/TS style, naming, commit format | `conventions.md` |
| Mozaic components, design tokens, typography | `ui-system.md` |
| Build arc, sessions, what's been done | `feature-history.md` |
| Traps, quirks, things that bite (CRITICAL) | `gotchas.md` |

**Before any code task**, load `conventions.md` + the task-relevant file + skim `gotchas.md`.

This file (AGENTS.md) is the **compact resume**; the project ctx dir is the **deep knowledge base**.

---

## Project

**InverApp** — investment portfolio tracker. Vue 3 + Mozaic UI + Supabase + Yahoo Finance.

## Quick Start

```bash
pnpm install
cp .env.example .env  # fill VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
pnpm run db:start     # local Supabase (Docker)
pnpm run db:reset     # migrations + seed data
pnpm run dev          # http://localhost:5173
pnpm run build        # type-check + production build
pnpm run test         # vitest
pnpm run lint         # eslint
pnpm run format       # prettier
```

## Key Files

| File | What |
|------|------|
| `src/router/index.ts` | Auth guard on all routes except `/` (5 routes total) |
| `src/stores/auth.ts` | Google OAuth: `init()`, `signInWithGoogle()`, `signOut()` |
| `src/stores/portfolio.ts` | Holdings, prices, `enrichedHoldings` computed, realized P&L via RPC |
| `src/stores/transactions.ts` | Submit buy/sell with `upsertAsset()` + oversell guard |
| `src/stores/watchlist.ts` | User watchlist + live prices (joined with assets) |
| `src/stores/settings.ts` | Country preference + locale + `COUNTRIES` const |
| `src/lib/yahoo.ts` | `searchAssets()`, `fetchPrices()`, `upsertAsset()`, currency inference |
| `src/lib/supabase.ts` | Supabase client |
| `src/lib/locale.ts` | `getNumberLocale()` → reads `settings.country` |
| `src/types/portfolio.ts` | `PortfolioRow`, `Asset`, `TransactionInput`, `WatchlistItem` |
| `src/views/HomeView.vue` | Landing page (login/welcome/logout) |
| `src/views/DashboardView.vue` | `MTabs`: Portfolio + Watchlist + History |
| `src/views/BuyView.vue` | Buy form with `AssetSearch` + preselected query params |
| `src/views/SellView.vue` | Sell form with pre-filled max quantity |
| `src/views/SettingsView.vue` | Country selector grid with format preview |
| `src/components/TransactionForm.vue` | Shared form (mode=buy\|sell): asset, qty, price, fees, date |
| `src/components/AssetSearch.vue` | Yahoo Finance debounced search dropdown |
| `src/components/PortfolioTable.vue` | MDataTable holdings, expandable → tx list |
| `src/components/WatchlistTable.vue` | MDataTable watchlist, remove button |
| `src/components/HistoryTable.vue` | Sold-assets history, expandable → tx list |
| `src/components/PortfolioTab.vue` | Portfolio tab: 4 summary cards + table |
| `src/components/WatchlistTab.vue` | Watchlist tab: search + table |
| `src/components/HistoryTab.vue` | History tab: RPC fetch + table |
| `src/components/DataTable.vue` | Generic MDataTable wrapper (cell render modes) |
| `src/components/AppHeader.vue` | MPageHeader + MPopover user menu |
| `src/components/ExpandedTransactions.vue` | Nested tx table for expanded portfolio row |
| `src/components/SymbolCell.vue` | Symbol → Yahoo Finance link |
| `src/components/NameCell.vue` | Name + hover-popup sparkline |
| `src/components/PriceSparkline.vue` | SVG 3-month chart |
| `src/styles/global.css` | Design tokens (CSS vars), reset, base |
| `src/styles/table.css` | Table wrapper, P&L classes, empty state |
| `vite.config.ts` | Yahoo Finance proxy (`/api/yahoo` → `query2.finance.yahoo.com`) |
| `mozaic.config.cjs` | Mozaic PostCSS pipeline with custom sass engine |
| `scripts/sass-modern.cjs` | Dart Sass `compileString()` wrapper for legacy `render()` API |
| `supabase/config.toml` | Local Supabase ports: db=54322, studio=54323, api=54321 |
| `supabase/seed.sql` | 27 sample assets (stocks, crypto, ETFs, bonds, FX, commodities) |
| `.npmrc` | `verify-deps-before-run=false` for pnpm 11 |

## Database

### Tables & RLS

```
profiles ──< transactions >── assets
   │              │
   │              ▼
   │         portfolio (view, security_invoker = true)
   │
   └──< watchlist >── assets
```

- **profiles**: own read/update (`auth.uid() = id`)
- **assets**: authenticated read + insert; service_role full (no UPDATE/DELETE for users)
- **transactions**: own CRUD (`auth.uid() = user_id`)
- **watchlist**: own read/insert/delete; unique (user_id, asset_id)
- **portfolio**: inherits RLS from underlying tables via `security_invoker = true`

### Migrations (in order)

```
20250524120000_create_profiles.sql
20250524120001_create_assets.sql
20250524120002_create_transactions.sql
20250524120003_create_portfolio_view.sql     (PPC view)
20250524120004_allow_asset_insert.sql         (RLS: authenticated INSERT on assets)
20250524120005_transaction_history.sql        (get_transaction_history RPC)
20250530120000_explicit_grants.sql            (Supabase 2026 GRANT change)
20260528120100_create_watchlist.sql           (watchlist table + RLS + GRANTs)
20260603120000_add_country_to_profiles.sql    (ALTER profiles ADD COLUMN country)
```

### Key SQL patterns

- **PPC cost basis**: `portfolio` view uses weighted average. `get_transaction_history()` RPC tracks per-asset running qty/cost. Buys update avg cost, sells only reduce quantity.
- **Auto-profiles**: trigger `handle_new_user()` creates profile on `auth.users` insert.
- **Oversell guard**: done in `transactions.ts` store (fetch portfolio, check quantity), NOT in DB trigger. RPC has defensive `raise notice` but does NOT block the insert.
- **Asset auto-add**: `upsertAsset()` tries INSERT first, falls back to SELECT if duplicate. Relies on `assets.symbol` UNIQUE constraint.
- **Explicit GRANTs**: post-May-2026 Supabase no longer auto-exposes `public.*` tables. Every new table needs explicit `grant select/insert/update/delete on public.X to authenticated, service_role`.

## Yahoo Finance

- Search: `/api/yahoo/v1/finance/search?q=...`
- Price: `/api/yahoo/v8/finance/chart/{symbol}?range=1d&interval=1d`
- Dev proxy in `vite.config.ts` bypasses CORS
- Production: needs a real proxy (Cloudflare Worker, etc.)
- Currency inference: API currency → suffix-based exchange map → crypto pair → USD fallback

## Mozaic UI Gotchas

- `MStatusNotification`: `title` + `description` + `status` (not `variant`/`message`)
- `MField`/`MTextInput`: require `id`
- `MButton` size: `"s"` not `"small"`
- `MDataTable`: separate package `@mozaic-ds/datatable-vue`
- `MCombobox`: `search` prop is boolean, not string

See `.opencode/context/project/gotchas.md` for the full list.

## Conventions

### Commits
Semantic release format: `<type>: <description>` — `feat`, `fix`, `docs`, `chore`, etc.

### Code style
- Vue 3 Composition API with `<script setup>` only
- TypeScript strict
- No semicolons in Vue SFCs (Prettier)
- Store functions prefixed with `fetch*` if async (e.g. `fetchPortfolio`, `fetchPrices`)
- `src/lib/` for utilities, `src/stores/` for Pinia, `src/types/` for interfaces

### File naming
- Components: PascalCase (`PortfolioTable.vue`)
- Stores: camelCase (`portfolio.ts`)
- Views: PascalCase with `View` suffix (`DashboardView.vue`)

## Environment

Two Supabase projects: dev + prod. Switch via `.env`:

```ini
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

## Dependencies

| Dep | Version | Purpose |
|-----|---------|---------|
| vue | ^3.5 | Framework |
| vue-router | ^5.0 | Routing |
| pinia | ^3.0 | State management |
| @mozaic-ds/vue | ^2.19 | Mozaic components |
| @mozaic-ds/datatable-vue | ^1.0 | Data tables |
| @supabase/supabase-js | ^2.106 | Database client |
| vite | ^8.0 | Build tool |
| vitest | ^4.1 | Testing |
| sass | ^1.100 | SCSS (modern API) |
| supabase | ^2.101 | CLI (devDependency) |
| typescript | ~6.0 | Type checking |

## Agent Skills Available

Skills loaded from `.agents/skills/` and global:
- `vue`, `vue-best-practices`, `vue-pinia-best-practices`, `vue-debug-guides` — Vue patterns
- `vitest`, `vitest-playwright-testing` — Testing
- `vite` — Build configuration
- `frontend-design` — UI design
- `accessibility` — a11y audits
- `seo` — Search optimization
- `nodejs-backend-patterns`, `nodejs-best-practices` — Backend patterns
- `supabase-postgres-best-practices` — Database
- `typescript-advanced-types` — TypeScript patterns
- `diagnose`, `tdd`, `triage`, `to-issues`, `to-prd` — Workflow tools

## Maintenance

- Update `.opencode/context/project/feature-history.md` after each new feature.
- Bump `Updated:` date on the relevant ctx file when you change patterns.
- Add new gotchas to `gotchas.md` as you discover them.
- Keep `AGENTS.md` compact — link to deep ctx instead of duplicating.
