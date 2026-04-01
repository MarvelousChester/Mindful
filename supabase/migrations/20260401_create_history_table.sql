-- File: 20260401_create_history_table.sql
-- Date: 2026-04-01
-- Migration: Create listening_history table to track user playback sessions with RLS

-- =====================
-- listening_history
-- =====================

create table if not exists public.listening_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  listened_at timestamptz not null default timezone('utc', now()),
  progress_seconds integer not null default 0
);

alter table public.listening_history enable row level security;

-- Users can view their own history
create policy "Users can view their own listening history"
on public.listening_history
for select
using (auth.uid() = user_id);

-- Users can insert their own history entries
create policy "Users can insert their own listening history"
on public.listening_history
for insert
with check (auth.uid() = user_id);

-- Users can update their own history entries (e.g. update progress)
create policy "Users can update their own listening history"
on public.listening_history
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Users can delete their own history entries
create policy "Users can delete their own listening history"
on public.listening_history
for delete
using (auth.uid() = user_id);

-- Index for fast chronological lookup per user
create index if not exists listening_history_user_id_listened_at_idx
on public.listening_history (user_id, listened_at desc);
