-- File: 20260308_create_users_table.sql
-- Date: 2026-03-08
-- Author: Salman Nouman Abulqasim
-- Migration: Create users table with RLS and triggers

-- Enable pgcrypto extension for UUID generation
create extension if not exists "pgcrypto";

-- Create users table
create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  email text not null unique,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Enable RLS
alter table public.users enable row level security;

-- Handle updated_at trigger
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Set updated_at trigger
create trigger set_public_users_updated_at
before update on public.users
for each row
execute function public.handle_updated_at();

-- Handle new user trigger
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin -- Insert or update user profile
  insert into public.users (id, username, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do update
  set
    username = excluded.username,
    email = excluded.email,
    updated_at = timezone('utc', now());

  return new;
end;
$$;

-- Handle new user trigger
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_user();

-- RLS policies
create policy "Users can view their own profile"
on public.users
for select
using (auth.uid() = id);

-- Users can update their own profile
create policy "Users can update their own profile"
on public.users
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Users can insert their own profile
create policy "Users can insert their own profile"
on public.users
for insert
with check (auth.uid() = id);
