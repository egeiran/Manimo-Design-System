-- Manimo → kort-forklart bridge
--
-- Run this once in your kort-forklart Supabase project's SQL editor.
-- Idempotent — safe to re-run on existing installs.
--
-- Creates:
--   1. A `scenes` table mirroring motion/scene-manifest.json + a live
--      `scene_url` pointing at HTML hosted on GitHub Pages.
--   2. RLS policies: public read on rows, writes only via service role.
--
-- The Manimo `scripts/publish-scene.js` writes via the service-role key,
-- so it bypasses RLS for writes. Reads from the kort-forklart Next.js app
-- use the anon key and rely on the SELECT policy below.
--
-- Migration note: prior versions of this file uploaded MP4 + poster JPG
-- to a `scenes` storage bucket and stored their public URLs in
-- `video_url` / `poster_url`. Manimo now serves scenes as live HTML via
-- GitHub Pages, stored in `scene_url`. The legacy columns are dropped
-- below; the storage bucket itself (if present from older installs) is
-- left intact — delete it manually from the Supabase dashboard once
-- consumers have been updated and you've confirmed nothing reads the
-- old MP4 URLs.

create table if not exists public.scenes (
  id                text primary key,
  title             text not null,
  eyebrow           text,
  topic             text,
  language          text not null,
  duration_seconds  numeric not null,
  prerequisites     text[] not null default '{}',
  concepts          text[] not null default '{}',
  scene_url         text,
  has_audio         boolean not null default false,
  updated_at        timestamptz not null default now()
);

-- Migrate existing installs to the live-HTML schema.
alter table public.scenes add column if not exists scene_url text;
alter table public.scenes drop column if exists video_url;
alter table public.scenes drop column if exists poster_url;

alter table public.scenes enable row level security;

drop policy if exists "scenes are publicly readable" on public.scenes;
create policy "scenes are publicly readable"
  on public.scenes for select
  using (true);

-- Drop the legacy storage policy (the bucket itself is removed manually).
drop policy if exists "scene objects are publicly readable" on storage.objects;
