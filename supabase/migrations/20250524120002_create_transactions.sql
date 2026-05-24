-- ============================================================
-- Migration: Create transactions table
-- Description: Buy/sell operations for each user and asset
-- ============================================================

create type public.transaction_type as enum ('buy', 'sell');

create table if not exists public.transactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  asset_id          uuid not null references public.assets(id) on delete restrict,
  transaction_type  public.transaction_type not null,
  quantity          numeric(18, 8) not null check (quantity > 0),
  price_per_unit    numeric(18, 4) not null check (price_per_unit > 0),
  fees              numeric(18, 4) not null default 0 check (fees >= 0),
  transaction_date  timestamptz not null,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Indexes for common queries
-- asset_id is covered by composite index leftmost prefix for user_id+asset_id queries
-- user_id alone is covered by composite index (user_id, asset_id)
create index transactions_user_asset_idx on public.transactions (user_id, asset_id);
create index transactions_asset_id_idx on public.transactions (asset_id);
create index transactions_date_idx on public.transactions (transaction_date desc);

-- Enable Row Level Security
alter table public.transactions enable row level security;

-- Users can read their own transactions
create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Users can insert their own transactions
create policy "Users can insert own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

-- Users can update their own transactions
create policy "Users can update own transactions"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users can delete their own transactions
create policy "Users can delete own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Auto-update updated_at
create trigger transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();
