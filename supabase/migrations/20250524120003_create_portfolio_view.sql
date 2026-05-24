-- ============================================================
-- Migration: Create portfolio view
-- Description: Virtual table showing current holdings per user/asset
--   Calculates: total quantity, average cost (PPC method), total invested
-- ============================================================

-- PPC (Prix de Revient Unitaire / Average Cost):
--   Buys update the average cost, sells only reduce quantity.
--   avg_cost = total_buy_cost / total_buy_qty
--   total_invested = avg_cost * remaining_qty
create or replace view public.portfolio
with (security_invoker = true)
as
with buys as (
  select
    user_id,
    asset_id,
    sum(quantity) as total_qty,
    sum(quantity * price_per_unit + fees) as total_cost
  from public.transactions
  where transaction_type = 'buy'
  group by user_id, asset_id
),
sells as (
  select
    user_id,
    asset_id,
    sum(quantity) as total_qty
  from public.transactions
  where transaction_type = 'sell'
  group by user_id, asset_id
)
select
  b.user_id,
  b.asset_id,
  a.symbol,
  a.name,
  a.asset_type,
  a.currency,
  coalesce(b.total_qty, 0) - coalesce(s.total_qty, 0) as quantity,
  case
    when coalesce(b.total_qty, 0) > 0
    then coalesce(b.total_cost, 0) / coalesce(b.total_qty, 0)
    else 0
  end as average_cost,
  case
    when coalesce(b.total_qty, 0) > 0
    then (coalesce(b.total_cost, 0) / coalesce(b.total_qty, 0))
         * (coalesce(b.total_qty, 0) - coalesce(s.total_qty, 0))
    else 0
  end as total_invested
from buys b
left join sells s on b.user_id = s.user_id and b.asset_id = s.asset_id
join public.assets a on b.asset_id = a.id
where coalesce(b.total_qty, 0) - coalesce(s.total_qty, 0) > 0;

-- Grant access to authenticated users
-- RLS is enforced via security_invoker = true (applies caller's privileges)
grant select on public.portfolio to authenticated;
