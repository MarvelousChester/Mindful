-- File: 20260328_create_media_tables.sql
-- Date: 2026-03-28
-- Migration: Create schools, tracks, categories, and track_categories tables with RLS

-- =====================
-- schools
-- =====================

create table if not exists public.schools (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_path text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.schools enable row level security;

create policy "Schools are publicly readable"
on public.schools
for select
using (true);

-- =====================
-- tracks
-- =====================

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  duration_seconds integer,
  language text not null,
  audio_path text not null,
  thumbnail_path text,
  school_id uuid not null references public.schools (id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.tracks enable row level security;

create policy "Tracks are publicly readable"
on public.tracks
for select
using (true);

-- =====================
-- categories
-- =====================

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique
);

alter table public.categories enable row level security;

create policy "Categories are publicly readable"
on public.categories
for select
using (true);

-- =====================
-- track_categories
-- =====================

create table if not exists public.track_categories (
  track_id uuid not null references public.tracks (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (track_id, category_id)
);

alter table public.track_categories enable row level security;

create policy "Track categories are publicly readable"
on public.track_categories
for select
using (true);
