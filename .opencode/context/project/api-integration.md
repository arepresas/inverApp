<!-- Context: project/api-integration | Priority: high | Version: 1.0 | Updated: 2026-06-21 -->

# External Integrations

Two external systems: **Supabase** (auth + Postgres) and **Yahoo Finance** (search + prices).

---

## Supabase (`src/lib/supabase.ts`)

Singleton client. Created at module load with env vars:

```ts
const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Env vars (from `.env`, validated at startup):

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

**Throws on import if missing.** This means a misconfigured `.env` breaks the whole bundle.

### Usage patterns

- `supabase.auth.*` — `getUser`, `getSession`, `signInWithOAuth`, `signOut`, `onAuthStateChange`
- `supabase.from('table').select/insert/update/delete()` — query builder
- `supabase.rpc('fn_name', { params })` — call stored function

### RLS is always on

Every query runs as the authenticated user (anon key + user's JWT). RLS policies in DB are the security boundary. **Never bypass via service_role key in the client.**

---

## Yahoo Finance (`src/lib/yahoo.ts`)

### Endpoints (proxied via Vite in dev)

```
GET /api/yahoo/v1/finance/search?q={query}&lang=en-US&quotesCount=10&newsCount=0
GET /api/yahoo/v8/finance/chart/{symbol}?range=1d&interval=1d
GET /api/yahoo/v8/finance/chart/{symbol}?range=3mo&interval=1d   (sparkline)
```

Vite dev proxy config (`vite.config.ts`):

```ts
'/api/yahoo': {
  target: 'https://query2.finance.yahoo.com',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/api\/yahoo/, ''),
  headers: { 'User-Agent': 'Mozilla/5.0' },
}
```

**Production needs a real proxy** (Cloudflare Worker, Netlify rewrite, etc.) — currently no production deployment configured.

### Functions

#### `searchAssets(query): Promise<YahooResult[]>`

- 10 results max
- Filters: must have symbol + name + recognized quoteType
- Maps Yahoo `quoteType` → internal `asset_type`:
  - `EQUITY` → `stock`
  - `CRYPTOCURRENCY` → `crypto`
  - `ETF` | `MUTUALFUND` | `INDEX` → `etf`
  - others → filtered out

#### `inferCurrency(symbol, apiCurrency?, assetType?)`

Priority chain:

1. `apiCurrency` if provided (Yahoo sometimes returns it)
2. For crypto: parse `BTC-EUR` → `'EUR'`
3. For stocks/ETFs: suffix → currency map (`.MC` → EUR, `.L` → GBP, etc.), fallback USD
4. Fallback: `'USD'`

EXCHANGE_CURRENCY map covers: EUR (.MC, .PA, .DE, .MI, .AS, .BR, .LS, .HE), GBP (.L), CHF (.SW), CAD (.TO, .V), JPY (.T), HKD (.HK), AUD (.AX), NZD (.NZ), SEK (.ST), DKK (.CO), BRL (.SA).

#### `upsertAsset(asset): Promise<Asset>`

INSERT-first, SELECT-on-conflict pattern. Critical: relies on `assets.symbol` being UNIQUE.

```ts
const { data, error } = await supabase.from('assets').insert(asset).select('id').single()
if (!error) return { id: data.id, ...asset, active: true }
const { data: existing } = await supabase.from('assets').select('id').eq('symbol', asset.symbol).single()
return { id: existing.id, ...asset, active: true }
```

Throws original insert error if SELECT also fails. Used by:
- `useTransactionStore.addTransaction` (auto-add on buy)
- `useWatchlistStore.addToWatchlist` (ensure asset exists)

#### `fetchPrices(symbols): Promise<Record<string, number>>`

Parallel fetches via `Promise.allSettled`. **Failures are silent** — failed symbols just don't appear in result map. Callers handle `null`.

```ts
const data = await res.json()
const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice
```

Used by:
- `usePortfolioStore.fetchMarketPrices` (current prices for holdings)
- `useWatchlistStore.fetchWatchlistPrices`
- `TransactionForm.vue` (auto-fill buy/sell price)
- `PriceSparkline.vue` (3-month chart)

---

## Locale (`src/lib/locale.ts`)

`getNumberLocale(): string` — delegates to `useSettingsStore().locale`.

All money/number formatting in components uses this. **Never hardcode `'en-US'` or `'fr-FR'`** in components — they should pull from `getNumberLocale()` so the country selector works.

Common pattern:

```ts
new Intl.NumberFormat(getNumberLocale(), {
  style: 'currency', currency: 'USD', minimumFractionDigits: 2,
}).format(1234.56)
```

Used in: `DataTable.vue`, `PortfolioTab.vue`, `HistoryTable.vue`, `ExpandedTransactions.vue`.

---

## Yahoo search asset_type mapping

| Yahoo quoteType | InverApp asset_type |
|-----------------|---------------------|
| EQUITY | stock |
| CRYPTOCURRENCY | crypto |
| ETF | etf |
| MUTUALFUND | etf |
| INDEX | etf |
| FUTURE, OPTION, CURRENCY, WARRANT, BOND, COMMODITY | (filtered out — but `bond`/`commodity`/`forex` exist in DB enum) |

**Gap**: search doesn't return `bond`/`commodity`/`forex` assets. The DB enum supports them (seed has them), but `inferAssetType()` returns null for these. If you add support, update the switch + EXCHANGE_CURRENCY map.

---

## Network failure modes

- **Yahoo down**: search returns `[]`, prices are missing from result map. UI shows `—`.
- **Yahoo rate-limited**: same as down.
- **Supabase down**: all store actions set `error.value`. UI shows `MStatusNotification status="error"`.
- **RLS denies**: Supabase returns `{ data: null, error }` — not an exception. Stores copy `error.message` into their `error.value`.

No retry logic anywhere. No offline support.
