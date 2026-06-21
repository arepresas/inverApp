<!-- Context: project/state-stores | Priority: high | Version: 1.0 | Updated: 2026-06-21 -->

# Pinia Stores

All stores use **setup-store syntax** (`defineStore('name', () => { ... })`) — NOT options API. Single file per store in `src/stores/`.

## Convention: `fetch*` prefix for async loaders

Functions that hit the network are prefixed with `fetch`:

- `fetchPortfolio`, `fetchMarketPrices`, `fetchRealizedPnl` (portfolio)
- `fetchWatchlist`, `fetchWatchlistPrices` (watchlist)
- `fetchProfile` (settings)
- `init` (auth) — bootstrap session, NOT a fetch

Mutations like `addTransaction`, `addToWatchlist`, `removeFromWatchlist`, `saveCountry` are actions without `fetch*` prefix.

---

## `useAuthStore` — `stores/auth.ts`

State of record: Supabase session + user.

| Field | Type | Notes |
|-------|------|-------|
| `user` | `User \| null` | from `@supabase/supabase-js` |
| `session` | `Session \| null` | |
| `loading` | `boolean` | sign-in/out in flight |
| `error` | `string \| null` | |

| Action | Notes |
|--------|-------|
| `init()` | Once-only. Restores session, subscribes to `onAuthStateChange`. Guarded by `initialized` flag. |
| `signInWithGoogle()` | OAuth redirect, `redirectTo: window.location.origin + '/'` |
| `signOut()` | |

Called from `App.vue` `onMounted` (init) and `AppHeader` (signOut).

---

## `usePortfolioStore` — `stores/portfolio.ts`

State of record: holdings + live prices + realized P&L.

| Field | Type | Notes |
|-------|------|-------|
| `holdings` | `PortfolioRow[]` | from `portfolio` view |
| `prices` | `Record<string, number>` | keyed by symbol |
| `loading`, `pricesLoading` | `boolean` | |
| `realizedPnl` | `number` | total, mixed-currency (legacy) |
| `realizedPnlByCurrency` | `Record<string, number>` | preferred for display |
| `error` | `string \| null` | |

### Computed

- `totalInvested` — sum of all holdings (mixed-currency, used as legacy aggregate)
- `totalInvestedByCurrency` — `{ USD: 1234, EUR: 567 }` (used by dashboard card)
- `holdingsCount` — `holdings.length`
- `enrichedHoldings` — merges `prices` into each row: `currentPrice`, `currentValue`, `unrealizedPnl`
- `byType` — `Record<asset_type, PortfolioRow[]>` (currently unused in UI, kept for future)

### Actions

- `fetchPortfolio()` — `supabase.from('portfolio').select('*').order('symbol')`
- `fetchMarketPrices()` — dedupe symbols, calls `fetchPrices(symbols)` from yahoo.ts
- `fetchRealizedPnl()` — RPC `get_transaction_history(p_user_id)`, filter sells, sum `pnl` per currency

### Currency gotcha

`totalInvested` and `realizedPnl` are mixed-currency sums (effectively meaningless). **Always display via `*ByCurrency` computed**, never as a single number. See `PortfolioTab.vue` `formatInvested()` and `formatRealizedPnl()` — they join per-currency values with " + ".

---

## `useTransactionStore` — `stores/transactions.ts`

State of record: buy/sell submission.

| Field | Type | Notes |
|-------|------|-------|
| `loading` | `boolean` | submit in flight |
| `error` | `string \| null` | |
| `success` | `string \| null` | human message |

### Action: `addTransaction(input)`

Input shape (camelCase, NOT the snake_case DB row):

```ts
{
  symbol, name, asset_type, currency,
  transaction_type: 'buy' | 'sell',
  quantity, price_per_unit, fees,
  transaction_date,
  asset_id?    // optional; auto-added via upsertAsset if missing
}
```

Flow:
1. Get current user; bail if not authenticated
2. If no `asset_id` → `upsertAsset()` (Yahoo → assets table INSERT-or-SELECT)
3. **If sell**: fetch portfolio, find holding, validate `holding.quantity >= input.quantity`
4. Insert into `transactions` table (snake_case row)
5. On success: trigger `portfolio.fetchPortfolio()` (refresh dashboard)
6. Clear messages via `clearMessages()` (called from Buy/Sell views onMount)

---

## `useWatchlistStore` — `stores/watchlist.ts`

State of record: user's watchlist + their prices.

| Field | Type | Notes |
|-------|------|-------|
| `items` | `WatchlistItem[]` | joined with assets on fetch |
| `prices` | `Record<string, number>` | |
| `loading`, `pricesLoading`, `error` | `boolean \| string \| null` | |

### Computed

- `enrichedWatchlist` — items + currentPrice
- `watchlistSymbols` — `Set<string>` (currently unused)
- `watchlistCount` — items.length

### Actions

- `fetchWatchlist()` — joins `watchlist` with `assets(symbol, name, asset_type, currency)`, filters null assets (defensive)
- `addToWatchlist(symbol, name, asset_type, currency)` — upserts asset then INSERT into watchlist. On unique-violation (23505) treats as already-present, refetches.
- `removeFromWatchlist(id)` — DELETE, refetches
- `fetchWatchlistPrices()` — dedupe symbols, fetchPrices

---

## `useSettingsStore` — `stores/settings.ts`

State of record: user preferences (country, derived locale).

| Field | Type | Notes |
|-------|------|-------|
| `country` | `string \| null` | ISO code (`'FR'`, `'US'`, etc.) |
| `loading` | `boolean` | save in flight |
| `error` | `string \| null` | |

### Computed

- `locale` — `country → COUNTRY_BY_CODE[country].locale`. Fallback chain if no country: `Intl.DateTimeFormat().resolvedOptions().locale` → `navigator.languages.find(l => l.includes('-'))` → `navigator.language`

### Exports

- `COUNTRIES: CountryEntry[]` (const) — 14 countries: FR, ES, US, DE, IT, UK, JP, BR, MX, CN, KR, IN, CA, AU
- `COUNTRY_BY_CODE` — internal lookup
- `CountryEntry { code, name, locale }`

### Actions

- `fetchProfile()` — `supabase.from('profiles').select('country').single()` (single() throws if no row, defensive)
- `saveCountry(code)` — UPDATE profiles WHERE id = userId

`country` is loaded once in `App.vue` watcher on `auth.user` change (immediate).

---

## Store dependencies

```
App.vue onMount → auth.init()
App.vue watch(auth.user) → settings.fetchProfile()

DashboardView onMount → portfolio.fetchPortfolio() + portfolio.fetchMarketPrices()
                     + portfolio.fetchRealizedPnl() + watchlist.fetchWatchlist()
                     + watchlist.fetchWatchlistPrices()

BuyView/SellView → tx.addTransaction() → (oversell guard) → portfolio.fetchPortfolio()

WatchlistTab → watchlist.addToWatchlist/removeFromWatchlist → watchlist.fetchWatchlist + fetchWatchlistPrices

SettingsView onMount → settings.fetchProfile()
SettingsView select → settings.saveCountry(code)
```

**Cross-store calls**: `useTransactionStore.addTransaction` calls `usePortfolioStore` for oversell guard + refresh. This is OK — both are setup stores, lazy-resolved via `useStore()` inside the function body (NOT at module top level).
