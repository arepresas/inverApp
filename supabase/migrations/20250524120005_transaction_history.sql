-- ============================================================
-- Migration: Transaction history with P&L calculation
-- Description: Function that returns all transactions with
--   profit/loss calculated using the PPC (average cost) method
--   per asset (running_qty and running_cost tracked per asset_id)
-- ============================================================

drop function if exists public.get_transaction_history(uuid);

create or replace function public.get_transaction_history(p_user_id uuid)
returns table (
  id uuid,
  user_id uuid,
  asset_id uuid,
  symbol text,
  name text,
  currency text,
  transaction_type text,
  quantity numeric,
  price_per_unit numeric,
  fees numeric,
  transaction_date timestamptz,
  notes text,
  avg_cost numeric,
  pnl numeric,
  created_at timestamptz
)
language plpgsql
security invoker
set search_path = 'pg_catalog, public'
as $$
declare
  rec record;
  running_qty numeric := 0;
  running_cost numeric := 0;
  prev_avg numeric := 0;
  sell_pnl numeric := 0;
  prev_asset_id uuid := null;
begin
  for rec in
    select
      t.id, t.user_id, t.asset_id,
      a.symbol, a.name, a.currency,
      t.transaction_type::text,
      t.quantity, t.price_per_unit, t.fees,
      t.transaction_date, t.notes, t.created_at
    from public.transactions t
    join public.assets a on t.asset_id = a.id
    where t.user_id = p_user_id
    order by t.transaction_date, t.created_at, t.id
  loop
    -- Reset running state when switching assets
    if prev_asset_id is distinct from rec.asset_id then
      running_qty := 0;
      running_cost := 0;
      prev_asset_id := rec.asset_id;
    end if;

    if rec.transaction_type = 'buy' then
      prev_avg := case when running_qty > 0 then running_cost / running_qty else 0 end;
      running_qty := running_qty + rec.quantity;
      running_cost := running_cost + (rec.quantity * rec.price_per_unit) + rec.fees;
      sell_pnl := 0;

      return query select
        rec.id, rec.user_id, rec.asset_id,
        rec.symbol, rec.name, rec.currency,
        rec.transaction_type, rec.quantity,
        rec.price_per_unit, rec.fees,
        rec.transaction_date, rec.notes,
        case when running_qty > 0 then running_cost / running_qty else 0 end,
        0::numeric, rec.created_at;

    elsif rec.transaction_type = 'sell' then
      prev_avg := case when running_qty > 0 then running_cost / running_qty else 0 end;

      -- Guard: don't allow selling more than owned
      if rec.quantity > running_qty then
        raise notice 'Sell quantity (%) exceeds holdings (%) for asset %', rec.quantity, running_qty, rec.symbol;
        rec.quantity := running_qty;
      end if;

      if running_qty > 0 then
        sell_pnl := (rec.price_per_unit - prev_avg) * rec.quantity - rec.fees;
        running_cost := running_cost - (prev_avg * rec.quantity);
        running_qty := running_qty - rec.quantity;
      else
        sell_pnl := 0;
      end if;

      return query select
        rec.id, rec.user_id, rec.asset_id,
        rec.symbol, rec.name, rec.currency,
        rec.transaction_type, rec.quantity,
        rec.price_per_unit, rec.fees,
        rec.transaction_date, rec.notes,
        prev_avg, sell_pnl, rec.created_at;
    end if;
  end loop;
end;
$$;
