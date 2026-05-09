-- Manimo → kort-forklart bridge
--
-- Run this once in your kort-forklart Supabase project's SQL editor.
-- It creates:
--   1. A `scenes` table mirroring motion/scene-manifest.json + Supabase URLs
--   2. A public `scenes` storage bucket for video + poster files
--   3. RLS policies: public read on rows + objects, writes only via service role
--
-- The Manimo `scripts/publish-scene.js` uploads via the service-role key, so
-- it bypasses RLS for writes. Reads from the kort-forklart Next.js app use
-- the anon key and rely on the SELECT policies below.

create table if not exists public.scenes (
  id                text primary key,
  title             text not null,
  eyebrow           text,
  topic             text,
  language          text not null,
  duration_seconds  numeric not null,
  prerequisites     text[] not null default '{}',
  concepts          text[] not null default '{}',
  video_url         text,
  poster_url        text,
  has_audio         boolean not null default false,
  updated_at        timestamptz not null default now()
);

alter table public.scenes enable row level security;

drop policy if exists "scenes are publicly readable" on public.scenes;
create policy "scenes are publicly readable"
  on public.scenes for select
  using (true);

-- Public storage bucket for video files. Idempotent.
insert into storage.buckets (id, name, public)
values ('scenes', 'scenes', true)
on conflict (id) do nothing;

drop policy if exists "scene objects are publicly readable" on storage.objects;
create policy "scene objects are publicly readable"
  on storage.objects for select
  using (bucket_id = 'scenes');
