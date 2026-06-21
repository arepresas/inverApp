<!-- Context: project/feature-history | Priority: medium | Version: 1.0 | Updated: 2026-06-21 -->

# Feature History & Evolution

## Build arc (oldest → newest)

### Phase 1: Foundation (May 2026, `20250524*` migrations)

- Supabase project skeleton: `profiles` + `assets` + `transactions` tables
- `handle_new_user()` trigger creates profile on Google signup
- `assets` shared catalog seeded with 27 popular instruments
- `transactions` with composite indexes, RLS on own data
- `portfolio` view (PPC cost basis, `security_invoker=true`)
- `get_transaction_history` RPC for per-tx P&L

### Phase 2: Portfolio MVP (May 24, session `portfolio-feature`)

- 5 stores, 5 views, transaction form, asset search
- Auth via Supabase Google OAuth
- Yahoo Finance search + price fetch
- Portfolio dashboard with summary cards + holdings table
- Buy/Sell forms with auto-fill price
- Oversell guard in transaction store

### Phase 3: Transaction history (May 25, session `tx-history`)

- `HistoryTab` + `HistoryTable` with sold-assets grouping
- Calls `get_transaction_history` RPC, filters `net_qty <= 0` assets
- Nested table per asset showing tx detail with realized P&L

### Phase 4: Watchlist / Seguimiento (May 28, session `2026-05-28-watchlist`)

- Migration `20260528120100_create_watchlist.sql`
- New `useWatchlistStore`
- `WatchlistTab` + `WatchlistTable` (no nesting, just remove button)
- Reuses `AssetSearch`, `fetchPrices`, `upsertAsset`
- Dashboard restructured with `MTabs` (Portfolio | Watchlist | History)

### Phase 5: Locale settings (Jun 3, session `2026-06-03-locale-settings`)

- Migration `20260603120000_add_country_to_profiles.sql` (ADD COLUMN country)
- New `useSettingsStore` + `COUNTRIES` const
- `lib/locale.ts` rewritten to read `settings.country` first
- `SettingsView.vue` with country card grid + format preview
- All money/number formatting updated to use `getNumberLocale()`
- Route `/settings` added; AppHeader user menu links to it

### Phase 6: Visual redesign (Jun 3, session `2026-06-03-visual-redesign`)

- Inter font loaded via Google Fonts in `index.html`
- New `src/styles/global.css` with full design token system (CSS vars)
- New `src/styles/table.css` for shared component classes
- All views restyled: HomeView, DashboardView, SettingsView, BuyView, SellView
- `DataTable` component with cell-renderer modes (symbol/name/number/currency/pnl/date/tag)
- `SymbolCell` (Yahoo link) + `NameCell` (hover popup)
- `PriceSparkline` component (3-month SVG sparkline, popup on name hover)
- `AppHeader` redesigned with popover user menu

### Phase 7: Post-redesign polish (Jun 3 onward)

- `ExpandedTransactions.vue` extracted from inline history-table nesting
- `ExpandedTransactions` used by `PortfolioTable` for row expansion
- `HistoryTable` keeps its own inline nested table (legacy)
- Realized P&L split by currency: `realizedPnlByCurrency` computed
- Total invested displayed by currency in dashboard card

---

## Session artifacts (in `.tmp/sessions/`)

| Folder | Status | What |
|--------|--------|------|
| `portfolio-feature/` | done | Initial portfolio MVP context |
| `tx-history/` | done | History tab context (no context.md saved) |
| `2026-05-28-watchlist/` | done | Watchlist feature context |
| `2026-06-03-locale-settings/` | done | Country selector context |
| `2026-06-03-visual-redesign/` | done | Design system overhaul context |

## Task artifacts (in `.tmp/tasks/`)

| Folder | Subtasks | Status |
|--------|----------|--------|
| `portfolio-feature/` | 13 subtasks | completed (build works) |
| `tx-history/` | 0 (folder only) | — |
| `locale-settings/` | 6 subtasks | completed |
| `watchlist/` | 0 (folder only) | — |

Subtask JSONs follow the `task-management` skill format. Each has `id`, `status`, `dependencies`, etc.

---

## Current state (Jun 21, 2026)

**Production-ready core loop works:**
- Login → dashboard → buy → sell → history
- Real-time prices via Yahoo (dev proxy)
- Multi-currency P&L display
- Watchlist tracking

**Known gaps:**
- No tests written (vitest configured, `tests/` empty)
- No production deployment / real Yahoo proxy
- Yahoo search misses `bond`/`commodity`/`forex` quoteTypes
- Realized P&L `realizedPnl` (aggregate) is unused; UI uses `realizedPnlByCurrency`
- `byType` computed in portfolio store is unused
- `watchlistSymbols` Set in watchlist store is unused
- Spanish word "Seguimiento" hardcoded in tab label
- SettingsView has hardcoded `FLAGS` + `CURRENCY` maps (could move into COUNTRIES const)

**No CI configured.** No `.github/workflows/`. PR template exists but no automation runs.

## Future directions (no committed roadmap)

From session context.md files, hinted features:
- Edit/delete transactions
- Edit profile (name, default currency)
- Bulk CSV import
- Charts over time
- Currency conversion (FX) for unified totals
- Per-asset dividends tracking
- Mobile app via Capacitor
