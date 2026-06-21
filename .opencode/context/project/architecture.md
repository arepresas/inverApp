<!-- Context: project/architecture | Priority: high | Version: 1.0 | Updated: 2026-06-21 -->

# InverApp Architecture

## High-Level Layers

```
┌─────────────────────────────────────────────────────────┐
│  Browser (Vue 3 SPA)                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Views (5 routes) ← RouterView, auth-guarded       │  │
│  │   HomeView, DashboardView, BuyView, SellView,     │  │
│  │   SettingsView                                     │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓ uses                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Components (presentational + container mix)        │  │
│  │   DataTable, PortfolioTable, WatchlistTable,      │  │
│  │   HistoryTable, TransactionForm, AssetSearch,     │  │
│  │   PriceSparkline, AppHeader, Settings cards       │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓ uses                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Pinia stores (state of record, setup stores)      │  │
│  │   auth, portfolio, transactions, watchlist,       │  │
│  │   settings                                         │  │
│  └──────────────────────────────────────────────────┘  │
│                         ↓ calls                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ lib/ — pure functions, no UI                       │  │
│  │   supabase.ts (client), yahoo.ts (search/prices/  │  │
│  │   upsertAsset), locale.ts (getNumberLocale)        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
         │                                       │
         │ supabase-js                            │ fetch (/api/yahoo/*)
         ↓                                       ↓
┌──────────────────────────┐         ┌──────────────────────────┐
│ Supabase                 │         │ Yahoo Finance            │
│   Postgres 15            │         │   query2.finance.yahoo.  │
│   Auth (Google OAuth)    │         │   com                    │
│   RLS on every table     │         │   (proxied in dev)       │
│   portfolio view (PPC)   │         └──────────────────────────┘
│   get_transaction_history│
│   RPC
└──────────────────────────┘
```

## Module Map

```
src/
├── main.ts                      # createApp, pinia, router, global CSS imports
├── App.vue                      # RouterView + auth.init() + settings.fetchProfile()
├── router/index.ts              # 5 routes, beforeEach auth guard
│
├── views/                       # One per route
│   ├── HomeView.vue             # / — public landing (login/welcome)
│   ├── DashboardView.vue        # /dashboard — MTabs: Portfolio|Watchlist|History
│   ├── BuyView.vue              # /buy — TransactionForm mode="buy"
│   ├── SellView.vue             # /sell — TransactionForm mode="sell"
│   └── SettingsView.vue         # /settings — country selector
│
├── components/
│   ├── AppHeader.vue            # MPageHeader + MPopover user menu
│   ├── DataTable.vue            # Generic MDataTable wrapper w/ cell render modes
│   ├── PortfolioTable.vue       # Holdings table (expandable rows → transactions)
│   ├── WatchlistTable.vue       # Watchlist table
│   ├── HistoryTable.vue         # Sold-assets history (expandable → tx list)
│   ├── ExpandedTransactions.vue # Nested tx table for expanded row
│   ├── TransactionForm.vue      # Shared buy/sell form (mode prop)
│   ├── AssetSearch.vue          # Yahoo debounced search dropdown
│   ├── SymbolCell.vue           # Symbol → Yahoo Finance link
│   ├── NameCell.vue             # Name with hover-popup sparkline
│   └── PriceSparkline.vue       # SVG sparkline (3mo Yahoo chart)
│
├── stores/                      # Pinia setup stores
│   ├── auth.ts                  # session, user, signInWithGoogle, signOut
│   ├── portfolio.ts             # holdings + prices + realizedPnl
│   ├── transactions.ts          # addTransaction (buy/sell, oversell guard)
│   ├── watchlist.ts             # items + prices + add/remove
│   └── settings.ts              # country + locale (COUNTRIES list)
│
├── lib/
│   ├── supabase.ts              # createClient(env vars)
│   ├── yahoo.ts                 # searchAssets, fetchPrices, upsertAsset, inferCurrency
│   └── locale.ts                # getNumberLocale() → from settings.country
│
├── types/
│   └── portfolio.ts             # PortfolioRow, Asset, TransactionInput, WatchlistItem
│
└── styles/
    ├── global.css               # CSS vars (tokens), reset, base
    └── table.css                # Table wrapper, P&L colors, empty state

supabase/
├── config.toml                  # Local ports: db=54322, studio=54323, api=54321
├── seed.sql                     # 27 assets (stocks, crypto, ETFs, bonds, FX, commodities)
└── migrations/                  # 9 SQL files, timestamped YYYYMMDDhhmmss_name.sql
```

## Data Flow Per Action

### Buy flow

1. User → `/buy` (auth-guarded) → `BuyView.vue`
2. `TransactionForm` mode=buy → user picks asset via `AssetSearch` (Yahoo search)
3. Form auto-fills price from `fetchPrices([symbol])` (Yahoo)
4. Submit → `useTransactionStore.addTransaction(input)`
5. Store calls `upsertAsset()` if no `asset_id` (INSERT then SELECT on conflict)
6. Insert into `transactions` table
7. Refresh portfolio via `usePortfolioStore.fetchPortfolio()`
8. Redirect to `/dashboard`

### Sell flow

1. User → `/sell` (often from dashboard row's "Sell" button, query has asset_id)
2. `TransactionForm` mode=sell → pre-filled asset, max quantity
3. Submit → `useTransactionStore.addTransaction(input)`
4. **Oversell guard**: store fetches portfolio, checks `holding.quantity >= input.quantity`
5. Insert; refresh; redirect

### Realized P&L

1. `usePortfolioStore.fetchRealizedPnl()` → RPC `get_transaction_history(p_user_id)`
2. SQL function walks transactions per asset, tracks running qty/cost (PPC)
3. Sells get `pnl = (sell_price - prev_avg) * qty - fees`
4. Store sums by currency → dashboard "Realized P&L" card

## Boundary Rules

- **Components never call `supabase` directly** except `PortfolioTable` (lazy-loads tx per asset on expand) and `HistoryTab` (fetches history RPC). All other DB access via stores.
- **Stores never render UI**. Pure state + async actions.
- **`lib/` is pure functions**, no Pinia, no Vue refs (except locale.ts which reads settings store).
- **Types in `types/`** — single source of truth for shared interfaces.
- **No business logic in views** — they wire components + stores together.

## Build & Runtime

- **Dev**: `pnpm dev` → Vite serves SPA, proxies `/api/yahoo/*` to Yahoo
- **Build**: `pnpm build` → `vue-tsc -b && vite build` (TS type-check then bundle)
- **DB**: `pnpm run db:start` (Docker) → local Supabase stack on :54322
- **Test**: `pnpm test` → vitest (jsdom env), but no tests written yet
- **Lint**: `pnpm lint` → ESLint flat config + eslint-plugin-vue
