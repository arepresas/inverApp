# InverApp

Investment portfolio tracker — record your asset purchases and sales, track P&L, and view real-time market prices.

## Features

- **Portfolio dashboard** with summary cards (current value, realized/unrealized P&L, total invested)
- **Buy & sell flows** with Yahoo Finance asset search and auto-fill market prices
- **Real-time market prices** via Yahoo Finance API
- **Transaction history** with realized P&L per operation (PPC cost basis method)
- **Multi-currency support**: EUR, USD, GBP, CHF, CAD, JPY, HKD, AUD, SEK, DKK, BRL
- **Google OAuth** authentication via Supabase
- **Row-Level Security**: users only see their own data

## Stack

| Layer    | Technology                                 |
| -------- | ------------------------------------------ |
| Frontend | Vue 3 + Composition API (`<script setup>`) |
| Build    | Vite 8                                     |
| Routing  | Vue Router 5 (auth guard)                  |
| State    | Pinia 3                                    |
| UI       | Mozaic Design System (ADEO)                |
| Auth     | Supabase (Google OAuth)                    |
| Database | Supabase (PostgreSQL 15)                   |
| Language | TypeScript 6                               |
| Tests    | Vitest + jsdom                             |
| Lint     | ESLint + Prettier                          |

## Prerequisites

- Node.js `^20.19.0` or `>=22.12.0`
- Docker (required by Supabase CLI for local dev)
- [pnpm](https://pnpm.io/installation) `>=9`
- [Supabase CLI](https://supabase.com/docs/guides/cli) — installed as devDependency

## Getting Started

```bash
pnpm install
cp .env.example .env
# Edit .env with your Supabase credentials
pnpm run dev
# → http://localhost:5173
```

## Environment

InverApp uses **two Supabase projects**: one for development, one for production. Switch between them by changing `.env`.

### Setup

1. Create two projects in [Supabase Dashboard](https://supabase.com/dashboard):

   - `inverapp-dev`
   - `inverapp-prod`

2. For each, get the URL and anon key from **Settings → API**.
3. Point `.env` to the environment you want:

```bash
# .env — development (default)
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

> The frontend always reads from `.env`. The database scripts (`db:*`) work against a **local** Supabase stack, not the cloud projects.

## Database: dev vs prod

|                    | Dev (local)                            | Prod (cloud)                    |
| ------------------ | -------------------------------------- | ------------------------------- |
| **Where**          | `pnpm run db:start` (Docker containers) | Supabase cloud project          |
| **PostgreSQL**     | `localhost:54322`                      | `<project>.supabase.co`         |
| **Studio UI**      | `http://localhost:54323`               | Supabase Dashboard              |
| **Schema changes** | `pnpm run db:migrate:up`                | `pnpm run db:push`               |
| **Full reset**     | `pnpm run db:reset`                     | ❌ never on prod                |
| **Seed data**      | Automatic with`db:reset`               | Manual via Dashboard SQL Editor |

### Dev workflow

```bash
pnpm run db:start         # Start local Supabase (PostgreSQL + Studio + Auth)
pnpm run db:reset         # Apply migrations + seed (27 assets)
pnpm run dev              # Frontend → http://localhost:5173

# After changing the schema:
pnpm run db:migrate:new -- add_column   # Create empty migration file
# ... write your SQL in supabase/migrations/<timestamp>_add_column.sql ...
pnpm run db:migrate:up                  # Apply to local DB
pnpm run db:reset                       # Verify full reset still works
```

### Prod workflow

```bash
# Login in web browser
npx supabase login

# One-time: link to your cloud project
npx supabase link --project-ref <prod-project-id>

# Deploy migrations
pnpm run db:push

# First time on a new project, also run the seed:
# Dashboard → SQL Editor → paste supabase/seed.sql
```

### Local Supabase services

| Service          | URL                      | Credentials             |
| ---------------- | ------------------------ | ----------------------- |
| PostgreSQL       | `localhost:54322`        | `postgres` / `postgres` |
| Supabase Studio  | `http://localhost:54323` | —                      |
| Inbucket (email) | `http://localhost:54324` | —                      |

Connection string: `postgresql://postgres:postgres@localhost:54322/postgres`

## Scripts

### Frontend

| Command              | Description                         |
| -------------------- | ----------------------------------- |
| `pnpm run dev`        | Dev server with HMR                 |
| `pnpm run build`      | TypeScript check + production build |
| `pnpm run preview`    | Preview production build            |
| `pnpm run test`       | Run tests once                      |
| `pnpm run test:watch` | Run tests in watch mode             |
| `pnpm run lint`       | Lint with ESLint                    |
| `pnpm run format`     | Format with Prettier                |

### Database

| Command                         | Description                                        |
| ------------------------------- | -------------------------------------------------- |
| `pnpm run db:start`              | Start local Supabase stack (Docker)                |
| `pnpm run db:stop`               | Stop local Supabase stack                          |
| `pnpm run db:reset`              | Reset local DB → apply all migrations → run seed |
| `pnpm run db:migrate:new -- <name>` | Create new migration file |
| `pnpm run db:migrate:up`         | Apply pending migrations to local DB               |
| `pnpm run db:migrate:list`       | Compare local vs remote migration state            |
| `pnpm run db:push`               | Deploy migrations to cloud Supabase project        |
| `pnpm run db:diff -- <name>` | Generate migration from schema diff |

## Architecture

### Data Flow

```
User → Vue Router → View → Pinia Store → supabase-js → PostgreSQL
                                     ↘ fetch() → Yahoo Finance (/api/yahoo proxy)
```

### Component Tree

```
App.vue
└── RouterView
    ├── HomeView.vue          (landing page, login/logout)
    ├── DashboardView.vue     (4 summary cards + portfolio table)
    │   ├── AppHeader.vue     (navigation, auth state)
    │   └── PortfolioTable.vue (MDataTable with enriched holdings)
    ├── BuyView.vue           (buy form)
    │   ├── AppHeader.vue
    │   ├── AssetSearch.vue   (Yahoo Finance search with debounce)
    │   └── TransactionForm.vue (reusable buy/sell form)
    ├── SellView.vue          (sell form)
    │   ├── AppHeader.vue
    │   └── TransactionForm.vue
    └── TransactionsView.vue  (history with realized P&L)
        └── AppHeader.vue
```

### Stores

| Store             | File                      | Purpose                                              |
| ----------------- | ------------------------- | ---------------------------------------------------- |
| `useAuthStore`    | `src/stores/auth.ts`     | Google OAuth: `init()`, `signInWithGoogle()`, `signOut()` |
| `usePortfolioStore` | `src/stores/portfolio.ts` | Holdings, market prices, P&L, enrichedHoldings computed |
| `useTransactionStore` | `src/stores/transactions.ts` | Submit buy/sell with auto-upsert, oversell guard |

### Routes

| Path             | Name           | Auth required | Component             |
| ---------------- | -------------- | :-----------: | --------------------- |
| `/`              | `home`         |      No       | `HomeView.vue`        |
| `/dashboard`     | `dashboard`    |      Yes      | `DashboardView.vue`   |
| `/buy`           | `buy`          |      Yes      | `BuyView.vue`         |
| `/sell`          | `sell`         |      Yes      | `SellView.vue`        |
| `/transactions`  | `transactions` |      Yes      | `TransactionsView.vue` |

## Database Schema

```
profiles ──< transactions >── assets
                │
                ▼
           portfolio (view)
```

### Tables

#### `profiles`

User profiles linked to Supabase Auth. Auto-created on Google signup via trigger.

| Column       | Type          | Notes                                      |
| ------------ | ------------- | ------------------------------------------ |
| `id`         | `uuid PK`     | References `auth.users(id)`, cascade delete |
| `email`      | `text`        | From Google OAuth                          |
| `name`       | `text`        | Display name                               |
| `currency`   | `text`        | Default `EUR`                              |
| `created_at` | `timestamptz` |                                            |
| `updated_at` | `timestamptz` | Auto-updated via trigger                   |

#### `assets`

Shared catalog of investable assets. Inserted automatically on first purchase.

| Column       | Type          | Notes                                                           |
| ------------ | ------------- | --------------------------------------------------------------- |
| `id`         | `uuid PK`     | Auto-generated                                                  |
| `symbol`     | `text UNIQUE` | Ticker (AAPL, BTC, VWCE...)                                     |
| `name`       | `text`        | Full name                                                       |
| `asset_type` | `enum`        | `stock`, `crypto`, `etf`, `bond`, `commodity`, `forex`, `other` |
| `currency`   | `text`        | `USD`, `EUR`, `GBP`, `CHF`, `CAD`, `JPY`...                      |
| `active`     | `boolean`     | Soft-delete flag                                                |

#### `transactions`

Buy and sell operations. Each row represents one trade.

| Column             | Type            | Notes                                    |
| ------------------ | --------------- | ---------------------------------------- |
| `id`               | `uuid PK`       | Auto-generated                           |
| `user_id`          | `uuid FK`       | References `profiles(id)`, cascade delete |
| `asset_id`         | `uuid FK`       | References `assets(id)`, restrict delete  |
| `transaction_type` | `enum`          | `buy` or `sell`                          |
| `quantity`         | `numeric(18,8)` | Must be > 0                              |
| `price_per_unit`   | `numeric(18,4)` | Must be > 0                              |
| `fees`             | `numeric(18,4)` | Default 0, must be >= 0                  |
| `transaction_date` | `timestamptz`   | When the trade happened                  |
| `notes`            | `text`          | Optional                                 |
| `created_at`       | `timestamptz`   |                                          |
| `updated_at`       | `timestamptz`   | Auto-updated via trigger                 |

### Views

#### `portfolio`

Calculated view showing current holdings per user/asset. Uses PPC (Average Cost) method — buys update the average cost, sells only reduce quantity.

| Column           | Description                        |
| ---------------- | ---------------------------------- |
| `user_id`        | Owner                              |
| `asset_id`       | Asset                              |
| `symbol`         | Ticker                             |
| `name`           | Full name                          |
| `asset_type`     | Category                           |
| `currency`       | Quote currency                     |
| `quantity`       | Remaining quantity (buys − sells) |
| `average_cost`   | Weighted average purchase price    |
| `total_invested` | Cost basis of remaining holdings   |

> Only shows rows where `quantity > 0` (active holdings).
>
> **Known limitation:** the view sums all buys across all time. If you sell all holdings of an asset and buy again later, the average cost will include old purchases. For accurate cost basis in that scenario, use `get_transaction_history()` RPC which resets the running total per asset.

### Row Level Security

| Table          | Policy            | Who                                       |
| -------------- | ----------------- | ----------------------------------------- |
| `profiles`     | Read / Update own | `auth.uid() = id`                         |
| `assets`       | Read              | All authenticated                         |
| `assets`       | Insert            | All authenticated (auto-add on purchase)   |
| `assets`       | Full              | `service_role` only                       |
| `transactions` | Full CRUD         | `auth.uid() = user_id`                    |
| `portfolio`    | Read              | Inherits RLS via `security_invoker = true` |

### Functions

#### `get_transaction_history(p_user_id uuid)`

Returns transaction log with per-operation P&L using PPC (average cost) method. Resets `running_qty` and `running_cost` when switching asset. Columns: `transaction_type`, `quantity`, `price_per_unit`, `fees`, `total_cost`, `running_qty`, `running_cost`, `average_cost`, `pnl`, `currency`, `transaction_date`, `symbol`, `name`.

### Migrations

Versioned as timestamped SQL files in `supabase/migrations/`:

```
supabase/migrations/
├── 20250524120000_create_profiles.sql        # Profiles table + trigger + RLS
├── 20250524120001_create_assets.sql          # Asset catalog + enums + RLS
├── 20250524120002_create_transactions.sql    # Buy/sell operations + indexes + RLS
├── 20250524120003_create_portfolio_view.sql  # Holdings view (PPC method)
├── 20250524120004_allow_asset_insert.sql     # Authenticated INSERT RLS on assets
├── 20250524120005_transaction_history.sql    # P&L calculation function
└── 20250530120000_explicit_grants.sql        # Data API GRANTs (Supabase 2026 change)
```

### Seed data

`supabase/seed.sql` contains 27 sample assets:

| Type        | Count | Examples                            |
| ----------- | ----- | ----------------------------------- |
| Stocks      | 10    | AAPL, MSFT, TSLA, NVDA, SAN, AIR... |
| Crypto      | 5     | BTC, ETH, SOL, USDT, USDC           |
| ETFs        | 5     | VWCE, CSPX, IWDA, EQQQ, MEUD        |
| Bonds       | 2     | AGG, BND                            |
| Commodities | 3     | XAU, XAG, CL                        |
| Forex       | 2     | EURUSD, GBPUSD                      |

## Auth

Google OAuth via Supabase Auth. Configure it in your Supabase project:

1. **Authentication → Providers → Google**
2. Enable and set up OAuth credentials
3. Add `http://localhost:5173` to authorized redirect URLs

The frontend store (`src/stores/auth.ts`) handles the OAuth flow:

- `init()` — restores session on page load, idempotent
- `signInWithGoogle()` — initiates OAuth redirect
- `signOut()` — clears session

### Auth guard

All routes except `/` require authentication. The router's `beforeEach` guard checks the session and redirects to `/` if not authenticated.

## Yahoo Finance Integration

Asset search and market prices come from Yahoo Finance via the browser (`fetch()`):

- **Search**: `query2.finance.yahoo.com/v1/finance/search`
- **Prices**: `query2.finance.yahoo.com/v8/finance/chart`

### Dev proxy

The `vite.config.ts` proxies `/api/yahoo` → `query2.finance.yahoo.com` to bypass CORS:

```ts
server: {
  proxy: {
    '/api/yahoo': {
      target: 'https://query2.finance.yahoo.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
    },
  },
}
```

### Production

The Vite proxy only works in dev. For production, deploy a proxy (e.g., Cloudflare Worker, Netlify redirect, or a simple backend endpoint).

### Why not `yahoo-finance2` npm package?

It uses Node.js HTTP APIs (`https` module) which don't work in the browser. The direct `fetch()` approach works everywhere.

## Project Structure

```
inverApp/
├── .github/
│   └── pull_request_template.md
├── .agents/
│   └── skills/              # Agent skills (Vue, testing, accessibility, etc.)
├── src/
│   ├── main.ts              # App entry (Pinia, Router, Mozaic CSS)
│   ├── App.vue              # Root shell with <RouterView>
│   ├── router/index.ts      # Vue Router with auth guard
│   ├── components/
│   │   ├── AppHeader.vue    # Header: logo, nav, logout
│   │   ├── AssetSearch.vue  # Yahoo Finance combobox search with debounce
│   │   ├── PortfolioTable.vue # MDataTable with live prices, P&L, buy/sell actions
│   │   └── TransactionForm.vue # Reusable form: asset, qty, price, fees, date
│   ├── views/
│   │   ├── HomeView.vue     # Landing page (login/logout)
│   │   ├── DashboardView.vue # Summary cards + portfolio table
│   │   ├── BuyView.vue      # Buy view with TransactionForm
│   │   ├── SellView.vue     # Sell view with maximized quantity
│   │   └── TransactionsView.vue # History table with P&L per operation
│   ├── stores/
│   │   ├── auth.ts          # Auth store (Google OAuth)
│   │   ├── portfolio.ts     # Holdings, prices, P&L computed
│   │   └── transactions.ts  # Submit buy/sell with auto-upsert
│   ├── lib/
│   │   ├── supabase.ts      # Supabase client
│   │   └── yahoo.ts         # Yahoo Finance: searchAssets, fetchPrices, upsertAsset
│   ├── types/
│   │   └── portfolio.ts     # PortfolioRow, Asset, TransactionInput
│   └── assets/              # Static assets
├── supabase/
│   ├── config.toml           # Supabase CLI configuration
│   ├── migrations/           # Versioned SQL migrations (7 files)
│   └── seed.sql              # 27 sample assets
├── scripts/
│   └── sass-modern.cjs       # Sass legacy API → modern compileString() wrapper
├── mozaic.config.cjs         # Mozaic PostCSS pipeline config
├── vite.config.ts            # Vite config + Yahoo Finance proxy
├── vitest.config.ts          # Vitest config (jsdom environment)
├── tsconfig.json             # TypeScript project references
├── tsconfig.app.json         # TypeScript app config
├── tsconfig.node.json        # TypeScript Node config
├── eslint.config.js          # ESLint flat config
├── .prettierrc               # Prettier config
├── .npmrc                    # pnpm 11 compat (verify-deps-before-run=false)
├── .env.example              # Environment variables template
├── CONTRIBUTING.md           # Commit conventions + PR guidelines
└── README.md                 # This file
```

## Environment Variables

| Variable                 | Description                     |
| ------------------------ | ------------------------------- |
| `VITE_SUPABASE_URL`      | Supabase project URL            |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |

> Copy `.env.example` to `.env`. Database scripts use the local Supabase stack, not these variables.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for commit conventions and PR guidelines.

### Commit format

[Semantic Release](https://semantic-release.gitbook.io/semantic-release) format:

```
<type>: <description>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`.

### Before submitting

```bash
pnpm run build   # Must pass (tsc + vite build)
pnpm run lint    # Must pass
pnpm run test    # Must pass
```

## Known Issues & Gotchas

### Mozaic components
- `MStatusNotification` requires `title`, `description`, `status` (not `variant`/`message`)
- `MField`/`MTextInput` require `id` prop
- `MButton` size: `"s"` not `"small"`
- `MDataTable` comes from separate package `@mozaic-ds/datatable-vue`

### Supabase
- For non-existent asset lookup, use `maybeSingle()` not `single()` to avoid 406 error
- `GBp` (Yahoo Finance) → use `GBP` (ISO 4217)

### Sass
- `@csstools/postcss-sass@5.1.1` uses legacy `sass.render()`. Fixed via `scripts/sass-modern.cjs` wrapper injected through `mozaic.config.cjs`

### pnpm 11
- Requires `.npmrc` with `verify-deps-before-run=false` to bypass build script approval

### Supabase 2026 GRANT change
- Migration `20250530120000_explicit_grants.sql` adds explicit GRANTs for all tables. New projects after May 30, 2026 require this.

## License

Private — all rights reserved.
