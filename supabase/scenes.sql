-- Manimo scene metadata. Applied via two MCP migrations:
--   add_chapter_fk_to_scenes  — adds optional FK to chapters
--   seed_initial_scenes       — seeds the 11 fysikk scenes from the
--                                Manimo manifest at
--                                https://egeiran.github.io/Manimo-Design-System/motion/scene-manifest.json
-- This file mirrors those migrations for repo-level reference.

create table if not exists public.scenes (
  id text primary key,
  title text not null,
  eyebrow text,
  topic text,
  language text not null,
  duration_seconds numeric not null,
  prerequisites text[] not null default '{}',
  concepts text[] not null default '{}',
  scene_url text,
  has_audio boolean not null default false,
  updated_at timestamptz not null default now(),
  subject_id text references public.subjects(id) on delete set null,
  chapter_number int,
  constraint scenes_chapter_fk
    foreign key (subject_id, chapter_number)
    references public.chapters (subject_id, chapter_number)
    on delete set null
);

create index if not exists scenes_subject_chapter_idx
  on public.scenes (subject_id, chapter_number);

alter table public.scenes enable row level security;

drop policy if exists "anon_read_scenes" on public.scenes;
create policy "anon_read_scenes" on public.scenes
  for select to anon, authenticated using (true);
