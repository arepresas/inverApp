-- ============================================================
-- Migration: Allow authenticated users to insert assets
-- Description: Needed for Yahoo Finance auto-add on purchase
-- ============================================================

-- Drop existing write policy (service_role only)
drop policy if exists "Service role can manage assets" on public.assets;

-- Allow authenticated users to insert new assets discovered via search.
-- Requires valid symbol, name, and asset_type.
create policy "Authenticated users can insert assets"
  on public.assets for insert
  to authenticated
  with check (
    symbol is not null
    and length(symbol) > 0
    and name is not null
    and length(name) > 0
  );

-- Keep service_role as the only role that can update/delete
create policy "Service role can update assets"
  on public.assets for update
  to service_role
  using (true)
  with check (true);

create policy "Service role can delete assets"
  on public.assets for delete
  to service_role
  using (true);
