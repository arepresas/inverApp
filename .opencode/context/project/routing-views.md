<!-- Context: project/routing-views | Priority: medium | Version: 1.0 | Updated: 2026-06-21 -->

# Routes & Views

## Route table

| Path | Name | View | Auth | Component loading |
|------|------|------|------|-------------------|
| `/` | home | `HomeView.vue` | public | eager |
| `/dashboard` | dashboard | `DashboardView.vue` | required | lazy |
| `/buy` | buy | `BuyView.vue` | required | lazy |
| `/sell` | sell | `SellView.vue` | required | lazy |
| `/settings` | settings | `SettingsView.vue` | required | lazy |

History mode: `createWebHistory(import.meta.env.BASE_URL)` — base is `/` in this app.

## Auth guard (`router/index.ts`)

```ts
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth) {
    try {
      const { data } = await supabase.auth.getSession()
      if (!data.session) return { name: 'home' }
    } catch { return { name: 'home' }
    }
  }
})
```

Checks `data.session`, not `data.user` — Supabase session is the source of truth. Redirects to `/` (no query params) on missing session.

**Note**: `auth.init()` runs separately from the guard. On hard refresh of `/dashboard`, the guard runs before `App.vue` `onMounted` finishes. **However**, Supabase auth uses localStorage and `getSession()` is sync-from-cache, so this works in practice.

## View → store → components map

### `HomeView.vue` (`/`)

Public landing page.

- On mount: `auth.init()`
- States: loading / logged-in / not-logged-in
- Actions: `signInWithGoogle()`, `signOut()` + push to `/`
- Components: `MButton` only
- CSS: BEM (`.landing`, `.landing__hero`, `.landing__card`, `.landing__features`)

If already logged in → shows "Welcome, {email}" + "Go to Dashboard" button. Else shows "Login with Google".

### `DashboardView.vue` (`/dashboard`)

Tabbed: Portfolio | Watchlist (Seguimiento) | History.

- On mount (parallel, not awaited together):
  - `portfolio.fetchPortfolio()` (awaited)
  - `portfolio.fetchMarketPrices()` (fire-and-forget)
  - `portfolio.fetchRealizedPnl()` (fire-and-forget)
  - `watchlist.fetchWatchlist()` (awaited)
  - `watchlist.fetchWatchlistPrices()` (fire-and-forget)

Components:
- `AppHeader`
- `MTabs` (tabs prop: `[{id, label}]`, v-model=activeTab)
- `PortfolioTab` (activeTab === 'portfolio')
- `WatchlistTab` (activeTab === 'watchlist')
- `HistoryTab` (activeTab === 'history')

**Note**: `v-if` on tabs (not `v-show`) — each tab unmounts when switched. State inside tab components is lost on switch.

### `BuyView.vue` (`/buy`)

- Reads `route.query` for preselected asset (from portfolio row "Buy" button):
  - `?symbol=AAPL&name=Apple+Inc.&asset_type=stock&currency=USD`
- On mount: `tx.clearMessages()`
- On submit: `tx.addTransaction(input)`; on success push to `/dashboard`
- On cancel: `tx.clearMessages()` + push to `/dashboard`
- Components: `AppHeader`, `MStatusNotification` (success/error), `TransactionForm mode="buy"`
- Form may show `AssetSearch` (if not preselected) or read-only asset label

### `SellView.vue` (`/sell`)

Same shape as Buy, but:

- Reads `route.query` for preselected asset + max qty:
  - `?asset_id=uuid&symbol=AAPL&name=Apple+Inc.&max_qty=10`
- Uses `safeQuery()` helper for query string handling (handles arrays)
- Components: `TransactionForm mode="sell" :max-quantity="maxQty"`

### `SettingsView.vue` (`/settings`)

Country selector.

- On mount: `settings.fetchProfile()`
- Grid of 14 country cards (COUNTRIES from settings store)
- Click → `settings.saveCountry(code)`
- Active card highlighted; preview shows formatted `12345.67` in that locale
- Components: `AppHeader`, `MStatusNotification` (error)
- Hardcoded `FLAGS` and `CURRENCY` maps in the SFC (not in store) — could be moved to COUNTRIES

## View-level patterns

- All views use `<script setup lang="ts">`
- No view has its own state except local UI (activeTab, selectedCountry derived from store)
- All data fetching delegated to stores
- Forms (`BuyView`, `SellView`) clear messages on mount, never persist across navigations
- Redirects: after successful buy/sell → `/dashboard`. After signout → `/`. From `/` when logged in → suggest `/dashboard`.

## Adding a new view

1. Create `src/views/MyView.vue` with `<script setup lang="ts">`
2. Add route to `src/router/index.ts` with `meta: { requiresAuth: true }` if needed
3. Lazy import: `() => import('../views/MyView.vue')`
4. Add nav link to `AppHeader.vue` if authenticated-only
5. If uses store data, add fetch call in appropriate `onMounted` or use store init pattern
