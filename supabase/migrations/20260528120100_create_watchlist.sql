-- ============================================================
-- Migration: Create watchlist table
-- Description: User-asset watchlist with RLS + explicit GRANTs
-- ============================================================

create table if not exists public.watchlist (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  asset_id   uuid not null references public.assets(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (user_id, asset_id)
);

-- Composite index for lookups: "all watchlist entries for a user"
-- and "does this user have this asset on watchlist?"
create index watchlist_user_asset_idx on public.watchlist (user_id, asset_id);

-- Enable Row Level Security
alter table public.watchlist enable row level security;

-- Users can read their own watchlist entries
create policy "Users can read own watchlist"
  on public.watchlist for select
  using (auth.uid() = user_id);

-- Users can insert their own watchlist entries
create policy "Users can insert own watchlist"
  on public.watchlist for insert
  with check (auth.uid() = user_id);

-- Users can delete their own watchlist entries
create policy "Users can delete own watchlist"
  on public.watchlist for delete
  using (auth.uid() = user_id);

-- ============================================================
-- Explicit GRANTs (Supabase post-May-2026 requirement)
-- ============================================================

grant select on public.watchlist to authenticated, service_role;
grant insert on public.watchlist to authenticated, service_role;
grant delete on public.watchlist to authenticated, service_role;
