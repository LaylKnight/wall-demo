-- ============================================================================
-- 2008-Style Facebook Wall — Supabase Schema
-- Matches: public.posts (id, user_id, author_name, body, photo_url, created_at)
-- ============================================================================

create extension if not exists "pgcrypto";

-- 1. "posts" table storing every entry
create table if not exists public.posts (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  author_name text not null default 'Greg Wientjes',
  body text null,
  created_at timestamp with time zone null default now(),
  photo_url text null,
  constraint posts_pkey primary key (id),
  constraint posts_body_check check ((char_length(body) <= 280)),
  constraint posts_photo_url_check check ((photo_url is null or photo_url ~* '^https?://' or photo_url ~* '^\["https?://'))
) TABLESPACE pg_default;

-- If the table already exists without author_name, add it safely:
alter table public.posts
  add column if not exists author_name text not null default 'Greg Wientjes';

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
  with check (body is null or char_length(body) <= 280);

-- 3. Enable Realtime on the posts table for live feed updates
alter publication supabase_realtime add table public.posts;

-- 4. Storage bucket for post photo uploads (5 MB max, raster images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wall-images',
  'wall-images',
  true,
  5242880,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Public read access for wall images"
  on storage.objects for select
  to public
  using (bucket_id = 'wall-images');

create policy "Public upload access for wall images"
  on storage.objects for insert
  to public
  with check (bucket_id = 'wall-images');

-- 5. Seed initial 2008 Wall posts (matching reference UI)
insert into public.posts (author_name, body, created_at)
values
  ('Anna', 'Hey Greg, did you debug your coffee maker yet? Last cup tasted like JavaScript errors.', now() - interval '5 minutes'),
  ('Adelaida', 'Greg, saw your last coding session—pretty sure you broke Stack Overflow again! 🚨', now() - interval '22 minutes'),
  ('Juho', 'Greg, are you still coding in pajamas, or have you upgraded to full-time sweatpants mode?', now() - interval '1 hour'),
  ('Maija', 'Greg, rumor has it your computer has more stickers than code running on it. Confirm?', now() - interval '3 hours'),
  ('Alex', 'Yo Greg, just pulled an all-nighter on the assignment. Turns out sleep deprivation doesn’t improve coding skills. Weird!', now() - interval '6 hours'),
  ('Sheryl', 'Greg, when are we gonna deploy your latest dance moves to production? #AgileDancer', now() - interval '1 day');
