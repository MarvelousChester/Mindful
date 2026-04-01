-- File: 20260328_seed_setup.sql
-- Date: 2026-03-28
-- Migration: Add unique constraint on tracks, drop NOT NULL on duration_seconds, create schools storage bucket

-- =====================
-- Allow nullable duration_seconds
-- (forward-safe guard for databases where create_media_tables was already applied)
-- =====================

alter table public.tracks
  alter column duration_seconds drop not null;

-- =====================
-- Unique constraint for idempotent track upserts
-- =====================

alter table public.tracks
  add constraint tracks_title_language_school_key
  unique (title, language, school_id);

-- =====================
-- Schools storage bucket (public reads)
-- =====================

insert into storage.buckets (id, name, public)
values ('schools', 'schools', true)
on conflict (id) do nothing;

create policy "Schools bucket is publicly readable"
on storage.objects
for select
using (bucket_id = 'schools');
