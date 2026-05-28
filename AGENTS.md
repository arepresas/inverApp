# AGENTS.md

> Auto-resume context for AI agents working on InverApp. Keep this file updated.

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
| `src/router/index.ts` | Auth guard on all routes except `/` |
| `src/stores/auth.ts` | Google OAuth: `init()`, `signInWithGoogle()`, `signOut()` |
| `src/stores/portfolio.ts` | Holdings, prices, `enrichedHoldings` computed, realized P&L via RPC |
| `src/stores/transactions.ts` | Submit buy/sell with `upsertAsset()` + oversell guard |
| `src/lib/yahoo.ts` | `searchAssets()`, `fetchPrices()`, `upsertAsset()`, currency inference |
| `src/lib/supabase.ts` | Supabase client |
| `src/types/portfolio.ts` | `PortfolioRow`, `Asset`, `TransactionInput` |
| `src/views/DashboardView.vue` | 4 summary cards + `PortfolioTable` |
| `src/views/BuyView.vue` | Buy form with `AssetSearch` |
| `src/views/SellView.vue` | Sell form with pre-filled max quantity |
| `src/views/TransactionsView.vue` | History table with realized P&L |
| `src/views/HomeView.vue` | Landing page (login/logout) |
| `src/components/TransactionForm.vue` | Shared form: asset, qty, price, fees, date |
| `src/components/AssetSearch.vue` | Yahoo Finance debounced search |
| `src/components/PortfolioTable.vue` | MDataTable with live prices |
| `src/components/AppHeader.vue` | Nav header with logo + logout |
| `vite.config.ts` | Yahoo Finance proxy (`/api/yahoo` → `query2.finance.yahoo.com`) |
| `mozaic.config.cjs` | Mozaic PostCSS pipeline with custom sass engine |
| `scripts/sass-modern.cjs` | Dart Sass `compileString()` wrapper for legacy `render()` API |
| `.npmrc` | `verify-deps-before-run=false` for pnpm 11 |

## Database

### Tables & RLS

```
profiles ──< transactions >── assets
                │
                ▼
           portfolio (view, security_invoker = true)
```

- **profiles**: own read/update (`auth.uid() = id`)
- **assets**: authenticated read + insert; service_role full
- **transactions**: own CRUD (`auth.uid() = user_id`)
- **portfolio**: inherits RLS from underlying tables

### Migrations (in order)

```
20250524120000_create_profiles.sql
20250524120001_create_assets.sql
20250524120002_create_transactions.sql
20250524120003_create_portfolio_view.sql     (PPC view)
20250524120004_allow_asset_insert.sql         (RLS: authenticated INSERT on assets)
20250524120005_transaction_history.sql        (get_transaction_history RPC)
20250530120000_explicit_grants.sql            (Supabase 2026 GRANT change)
```

### Key SQL patterns

- **PPC cost basis**: `portfolio` view uses weighted average. `get_transaction_history()` RPC tracks per-asset running qty/cost.
- **Auto-profiles**: trigger `handle_new_user()` creates profile on `auth.users` insert.
- **Oversell guard**: done in `transactions.ts` store (fetch portfolio, check quantity), NOT in DB trigger.
- **Asset auto-add**: `upsertAsset()` tries INSERT first, falls back to SELECT if duplicate. No UPDATE RLS needed.

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
