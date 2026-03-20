-- ExploreX schema (run in Supabase SQL editor)

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null
);

create table if not exists public.saved_places (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  lat double precision not null,
  lon double precision not null,
  image_url text,
  unique (user_id, title)
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  destination text not null,
  itinerary jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  interests jsonb not null default '[]'::jsonb,
  last_viewed text
);

alter table public.users enable row level security;
alter table public.saved_places enable row level security;
alter table public.trips enable row level security;
alter table public.preferences enable row level security;

create policy "Users can read own user row"
on public.users for select
using (auth.uid() = id);

create policy "Users can insert own user row"
on public.users for insert
with check (auth.uid() = id);

create policy "Users can update own user row"
on public.users for update
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "Saved places: select own"
on public.saved_places for select
using (auth.uid() = user_id);

create policy "Saved places: insert own"
on public.saved_places for insert
with check (auth.uid() = user_id);

create policy "Saved places: update own"
on public.saved_places for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Saved places: delete own"
on public.saved_places for delete
using (auth.uid() = user_id);

create policy "Trips: select own"
on public.trips for select
using (auth.uid() = user_id);

create policy "Trips: insert own"
on public.trips for insert
with check (auth.uid() = user_id);

create policy "Trips: update own"
on public.trips for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Trips: delete own"
on public.trips for delete
using (auth.uid() = user_id);

create policy "Preferences: select own"
on public.preferences for select
using (auth.uid() = user_id);

create policy "Preferences: insert own"
on public.preferences for insert
with check (auth.uid() = user_id);

create policy "Preferences: update own"
on public.preferences for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

