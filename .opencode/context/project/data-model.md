<!-- Context: project/data-model | Priority: high | Version: 1.0 | Updated: 2026-06-21 -->

# Data Model — Supabase Postgres

## Schema (current)

```
auth.users (managed by Supabase)
    │  id (uuid, PK)
    │  email, raw_user_meta_data
    ↓ (FK + cascade)
public.profiles
    │  id (uuid, PK → auth.users.id, ON DELETE CASCADE)
    │  email, name, currency (default 'EUR')
    │  country (text, added 2026-06-03)
    │  created_at, updated_at (auto via trigger)
    │
    ↓ (1:N, cascade on profile delete, restrict on asset delete)
public.transactions
    │  id (uuid, PK, gen_random_uuid)
    │  user_id (FK → profiles)
    │  asset_id (FK → assets, RESTRICT)
    │  transaction_type (enum: 'buy' | 'sell')
    │  quantity (numeric 18,8, >0)
    │  price_per_unit (numeric 18,4, >0)
    │  fees (numeric 18,4, default 0, ≥0)
    │  transaction_date (timestamptz)
    │  notes (text, nullable)
    │  created_at, updated_at
    │
public.assets (shared catalog, all users read)
    │  id (uuid, PK, gen_random_uuid)
    │  symbol (text, UNIQUE)
    │  name (text)
    │  asset_type (enum: stock|crypto|etf|bond|commodity|forex|other, default stock)
    │  currency (text, default 'USD')
    │  active (boolean, default true)
    │
public.watchlist (added 2026-05-28)
    │  id (uuid, PK)
    │  user_id (FK → profiles, cascade)
    │  asset_id (FK → assets, restrict)
    │  created_at
    │  UNIQUE (user_id, asset_id)

public.portfolio (VIEW, security_invoker=true)
    → per (user, asset) computed: quantity, average_cost, total_invested
    → PPC method: avg = total_buy_cost / total_buy_qty
    → filters out net_qty ≤ 0 (sold-out positions hidden)
```

## RLS Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `profiles` | own (`auth.uid()=id`) | trigger on signup | own | — |
| `assets` | all authenticated | authenticated (symbol+name non-empty), service_role | service_role | service_role |
| `transactions` | own (`auth.uid()=user_id`) | own (with check) | own | own |
| `watchlist` | own | own | — | own |
| `portfolio` (view) | inherits via `security_invoker=true` | — | — | — |

**No UPDATE RLS on `assets` for authenticated users** by design — only service_role can mutate catalog. Reads free, writes via app layer.

## Cost Basis: PPC (Prix de Revient Unitaire)

Weighted average method. **Buys update avg cost, sells only reduce quantity.**

```
avg_cost = Σ(buy.quantity × buy.price + buy.fees) / Σ(buy.quantity)
total_invested = avg_cost × remaining_qty
remaining_qty = Σ(buy.quantity) - Σ(sell.quantity)
```

Per-asset implementation in 2 places (must stay in sync):

1. **`portfolio` view** (SQL): aggregates buys/sells per (user, asset), computes avg_cost + total_invested
2. **`get_transaction_history(p_user_id)` RPC** (PL/pgSQL): per-tx running avg_cost, sell pnl

The SQL implementation lives in `supabase/migrations/`. **Do NOT add another cost-basis computation client-side** — use the view/RPC.

## Migrations (chronological)

```
20250524120000_create_profiles.sql           — profiles + handle_new_user trigger
20250524120001_create_assets.sql             — assets + asset_type enum
20250524120002_create_transactions.sql       — transactions + indexes (user,asset) + (date desc)
20250524120003_create_portfolio_view.sql     — portfolio VIEW (PPC)
20250524120004_allow_asset_insert.sql        — open assets INSERT to authenticated
20250524120005_transaction_history.sql       — get_transaction_history RPC
20250530120000_explicit_grants.sql           — GRANTs for Supabase 2026 PostgREST change
20260528120100_create_watchlist.sql          — watchlist table + RLS + GRANTs
20260603120000_add_country_to_profiles.sql   — ALTER profiles ADD COLUMN country
```

**All new tables MUST have explicit GRANTs** to authenticated/service_role (Supabase post-May-2026 no longer auto-exposes `public.*`).

## Migration Authoring Conventions

- File name: `YYYYMMDDhhmmss_<snake_name>.sql` (no separator between date+time)
- Header block: `-- Migration: <Title>` + `-- Description: <one-liner>`
- Always: `create table if not exists`, `drop policy if exists` before re-creating
- Always: include `set_updated_at()` trigger for tables with `updated_at`
- Always: explicit `GRANT` block for new tables (see `20250530120000_explicit_grants.sql`)
- Functions: `set search_path = 'pg_catalog, public'` to satisfy Supabase linter
- Trigger functions: `language plpgsql security definer` for `handle_new_user` style; `security invoker` for query functions like RPCs

## Oversell Guard (where it lives)

**Client-side only** — in `useTransactionStore.addTransaction()`:

```ts
if (input.transaction_type === 'sell') {
  const portfolio = usePortfolioStore()
  await portfolio.fetchPortfolio()
  const holding = portfolio.holdings.find((h) => h.asset_id === assetId)
  if (!holding || holding.quantity < input.quantity) {
    error.value = `Insufficient quantity. You only have ${holding?.quantity ?? 0} available.`
    return
  }
}
```

The RPC `get_transaction_history` also has a defensive `raise notice` if qty > running, but **does NOT block the insert** — that guard runs in the store. UI form also enforces max via `TransactionForm` prop `maxQuantity`.

## Asset Auto-Add Pattern

When user buys an asset not yet in catalog (via Yahoo search):

```ts
// yahoo.ts upsertAsset()
await supabase.from('assets').insert({ symbol, name, asset_type, currency }).select('id').single()
// On unique violation (23505), fall back to:
await supabase.from('assets').select('id').eq('symbol', symbol).single()
```

INSERT-first pattern relies on the unique constraint on `symbol`. **Don't change `assets.symbol` to non-unique** — this pattern depends on it.

## Indexes (current)

- `transactions`: `(user_id, asset_id)`, `(asset_id)`, `(transaction_date DESC)`
- `assets`: `(asset_type)`
- `watchlist`: `(user_id, asset_id)`

No index on `transactions.created_at` — date sort currently uses `transaction_date` index.
