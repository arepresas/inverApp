-- ============================================================
-- Migration: Create profiles table
-- Description: User profiles linked to Supabase Auth (auth.users)
-- ============================================================

-- Profiles table
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  currency    text not null default 'EUR',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.profiles enable row level security;

-- Users can read their own profile
create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer
set search_path = 'pg_catalog, public';

-- Trigger: fires after insert on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at trigger function (reusable)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Auto-update updated_at on profile changes
create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();
