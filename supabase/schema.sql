-- ============================================================================
-- 2008-Style Facebook Wall — Supabase Schema
-- Run this inside the Supabase SQL Editor when you are ready to connect the DB
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. Simple "posts" table storing every entry:
--    unique ID, author's name, message text, optional image URL, and timestamp
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_name text not null default 'Greg Wientjes',
  message text not null check (char_length(message) <= 280),
  image_url text,
  created_at timestamptz not null default now()
);

-- Index for fast reverse-chronological feed queries (newest first)
create index if not exists posts_created_at_idx on public.posts (created_at desc);

-- 2. Enable Row Level Security (No login required — public read & insert)
alter table public.posts enable row level security;

create policy "Anyone can view posts"
  on public.posts
  for select
  to anon, authenticated
  using (true);

create policy "Anyone can insert posts (280 char max)"
  on public.posts
  for insert
  to anon, authenticated
  with check (char_length(message) > 0 and char_length(message) <= 280);

-- 3. Enable Realtime on the posts table for live feed updates
alter publication supabase_realtime add table public.posts;

-- 4. Optional: Storage bucket for post image uploads
insert into storage.buckets (id, name, public)
values ('wall-images', 'wall-images', true)
on conflict (id) do nothing;

create policy "Public read access for wall images"
  on storage.objects for select
  to public
  using (bucket_id = 'wall-images');

create policy "Public upload access for wall images"
  on storage.objects for insert
  to public
  with check (bucket_id = 'wall-images');

-- 5. Seed initial 2008 Wall posts (matching reference UI)
insert into public.posts (author_name, message, created_at)
values
  ('Anna', 'Hey Greg, did you debug your coffee maker yet? Last cup tasted like JavaScript errors.', now() - interval '5 minutes'),
  ('Adelaida', 'Greg, saw your last coding session—pretty sure you broke Stack Overflow again! 🚨', now() - interval '22 minutes'),
  ('Juho', 'Greg, are you still coding in pajamas, or have you upgraded to full-time sweatpants mode?', now() - interval '1 hour'),
  ('Maija', 'Greg, rumor has it your computer has more stickers than code running on it. Confirm?', now() - interval '3 hours'),
  ('Alex', 'Yo Greg, just pulled an all-nighter on the assignment. Turns out sleep deprivation doesn’t improve coding skills. Weird!', now() - interval '6 hours'),
  ('Sheryl', 'Greg, when are we gonna deploy your latest dance moves to production? #AgileDancer', now() - interval '1 day');
