-- ============================================================
-- Migration: Explicit GRANTs for Data API access
-- Description: Required by Supabase post-May-2026 change.
--   Tables in public schema will no longer be auto-exposed
--   to PostgREST/GraphQL/supabase-js.
-- ============================================================

-- profiles
grant select on public.profiles to authenticated, anon, service_role;
grant insert on public.profiles to authenticated, service_role;
grant update on public.profiles to authenticated, service_role;

-- assets (catalog)
grant select on public.assets to authenticated, anon, service_role;
grant insert on public.assets to authenticated, service_role;
grant update on public.assets to service_role;
grant delete on public.assets to service_role;

-- transactions
grant select on public.transactions to authenticated, service_role;
grant insert on public.transactions to authenticated, service_role;
grant update on public.transactions to authenticated, service_role;
grant delete on public.transactions to authenticated, service_role;

-- portfolio (view)
grant select on public.portfolio to authenticated, service_role;
