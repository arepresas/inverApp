-- ============================================================
-- Migration: Add country column to profiles
-- Description: Allows users to set their country for locale-based formatting
-- ============================================================

alter table public.profiles
  add column if not exists country text;
