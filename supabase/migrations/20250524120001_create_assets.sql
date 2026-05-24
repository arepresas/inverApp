-- ============================================================
-- Migration: Create assets table
-- Description: Catalog of investable assets (stocks, crypto, ETFs...)
-- ============================================================

create type public.asset_type as enum (
  'stock',
  'crypto',
  'etf',
  'bond',
  'commodity',
  'forex',
  'other'
);

create table if not exists public.assets (
  id          uuid primary key default gen_random_uuid(),
  symbol      text not null unique,
  name        text not null,
  asset_type  public.asset_type not null default 'stock',
  currency    text not null default 'USD',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for type lookups
create index assets_type_idx on public.assets (asset_type);

-- Enable Row Level Security
alter table public.assets enable row level security;

-- All authenticated users can read assets (shared catalog)
create policy "Authenticated users can read assets"
  on public.assets for select
  to authenticated
  using (true);

-- Only service_role can insert/update/delete assets
create policy "Service role can manage assets"
  on public.assets for all
  to service_role
  using (true)
  with check (true);

-- Auto-update updated_at
create trigger assets_updated_at
  before update on public.assets
  for each row execute function public.set_updated_at();
