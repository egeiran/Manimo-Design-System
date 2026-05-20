# Publishing — Manimo → kort-forklart

The companion repo `egeiran/kort-forklart` (Next.js + Supabase) is the
public consumer of Manimo scenes. The contract between the two repos is:

- Scenes are served as **live HTML** from GitHub Pages (no MP4 upload,
  no Supabase Storage bucket).
- kort-forklart reads scene metadata (title, duration, language,
  prerequisites, etc.) from its own Supabase `public.scenes` table.
- This repo writes that metadata via `scripts/publish-scene.js`.

## Hosting

GitHub Pages is configured as "Deploy from a branch" → source `main` /
root `/`. The repo root contains `.nojekyll`, which keeps Pages from
stripping files that begin with underscores (e.g. `_scene-template.*`).

The Pages site lives at:

```
https://egeiran.github.io/Manimo-Design-System/
```

Every scene in `motion/scene-manifest.json` is reachable at:

```
https://egeiran.github.io/Manimo-Design-System/motion/<subject_id>/<html>
```

…and with `?embed=1` for iframe-style hosts (like kort-forklart) that
draw their own transport bar. Add `?aspect=9:16` to render in portrait;
the same HTML adapts at view time.

## Supabase schema

The full schema (and the canonical migrations) lives in kort-forklart's
Supabase project. This repo mirrors it as `supabase/scenes.sql` for
reference. The relevant tables:

### `public.subjects`

Course-level rows. Owned by kort-forklart; do not write from this repo.

| Column     | Type | Notes                                                |
| ---------- | ---- | ---------------------------------------------------- |
| `id`       | text | Primary key. Matches `subject_id` in scenes. Stable. |
| `title`    | text | Display title in the course's language.              |

### `public.chapters`

Chapter rows within a subject. Owned by kort-forklart.

| Column           | Type | Notes                                       |
| ---------------- | ---- | ------------------------------------------- |
| `subject_id`     | text | FK → `subjects.id`. Part of composite PK.   |
| `chapter_number` | int  | Sequential within a subject. Part of PK.    |
| `title`         | text | Display title.                              |

### `public.scenes`

The table Manimo writes. Defined in `supabase/scenes.sql`:

| Column              | Type        | Notes                                                                 |
| ------------------- | ----------- | --------------------------------------------------------------------- |
| `id`                | text PK     | Matches `motion/scene-manifest.json` entry id.                        |
| `title`             | text        | Display title.                                                        |
| `eyebrow`           | text        | Mono eyebrow line (e.g. "introduksjon").                              |
| `topic`             | text        | One-line topic summary.                                               |
| `language`          | text        | `"no"` or `"en"`.                                                     |
| `duration_seconds`  | numeric     | Total scene length. Matches the spec / manifest / JSX.                |
| `prerequisites`     | text[]      | Scene IDs that should be understood first.                            |
| `concepts`          | text[]      | Pedagogical concept tags (from manifest, not spec).                   |
| `scene_url`         | text        | Live Pages URL (`?embed=1`).                                          |
| `has_audio`         | bool        | Whether `motion/.../audio/<id>/` is non-empty.                        |
| `updated_at`        | timestamptz | `now()` on every upsert.                                              |
| `subject_id`        | text        | FK → `subjects.id`, `ON DELETE SET NULL`.                             |
| `chapter_number`    | int         | Part of composite FK below.                                           |

Indexes:

- `scenes_subject_chapter_idx` on `(subject_id, chapter_number)`.

Foreign keys:

- `subject_id` → `subjects(id)` `ON DELETE SET NULL`.
- `scenes_chapter_fk (subject_id, chapter_number)` →
  `chapters(subject_id, chapter_number)` **`ON DELETE SET NULL`**.

The composite FK is the gotcha: if a chapter row is missing from
`public.chapters` at publish time, Postgres will null the
`chapter_number` link rather than reject the row. The publish script
does a best-effort warn-only lookup to catch this before it happens,
but the FK ultimately wins — see "Audit + backfill" below.

### RLS

`public.scenes` has RLS enabled with one policy:

```sql
create policy "anon_read_scenes" on public.scenes
  for select to anon, authenticated using (true);
```

Anon clients (the kort-forklart frontend) can read; nobody can write
through the anon key. Writes only happen via the **service role key**,
which lives only in this repo's `.env` and never in any client.

## One-time setup

1. Open kort-forklart's Supabase dashboard → SQL editor → run
   `supabase/scenes.sql`. Re-running on an existing install is safe;
   it drops legacy `video_url` / `poster_url` columns if present and
   adds `scene_url`.
2. Copy `.env.example` → `.env` at the Manimo repo root and fill in
   `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Project Settings →
   API → service_role).
3. Verify with a dry-run: `node scripts/publish-scene.js <some-id> --dry-run`.

The service-role key bypasses RLS and must stay local. The `.env` file
is gitignored.

## Per-scene publish

```bash
git push origin main          # Pages picks up motion/<subject_id>/<id>.html
npm run publish <scene-id>    # upserts row with scene_url
```

`publish-scene.js` is metadata-only. It reads the scene from
`motion/scene-manifest.json`, computes `scene_url` as
`https://egeiran.github.io/Manimo-Design-System/motion/<subject_id>/<html>?embed=1`,
and upserts a row in `public.scenes`. Re-publishing the same id is
safe — the SQL upsert merges on the primary key.

`npm run publish all` walks every entry in the manifest.

`--dry-run` prints the payload without writing.

## Subject + chapter attachment

Each manifest entry carries optional `subject_id` and `chapter_number`
fields. The publish script propagates both into `public.scenes`.

- If both are set and the `(subject_id, chapter_number)` row exists in
  `public.chapters`, the scene attaches cleanly.
- If `subject_id` is set but `chapter_number` is missing in
  `public.chapters`, the FK nulls the link. The script warns but does
  not abort. Fix by seeding the chapter row in Supabase and
  re-publishing.
- If neither field is set, the scene is unattached (sandbox / demo /
  preview). Both columns are written as SQL `NULL`.

When generating a new scene with `scripts/generate-scene.js`, set
`subject_id` and `chapter_number` at the **top level** of the spec —
they get mirrored into the manifest entry automatically.

## Audit + backfill

`scripts/chapter-coverage.js` (alias: `npm run coverage <subject>`)
prints two backfill sections when Supabase is reachable:

- **Unattached scenes** — rows in `public.scenes` where
  `chapter_number IS NULL`. Usually the result of the composite FK
  nulling the link because the chapter row was missing at publish
  time. If the local manifest already has the right chapter, seed the
  missing chapter row in Supabase (mark as `[HUMAN]` in `PLAN.md`) and
  re-publish; otherwise pick a chapter, update the spec + manifest,
  and re-publish.
- **Mismatches** — scenes where the local manifest and Supabase
  disagree on `chapter_number`. Align the spec/manifest to the right
  chapter, then `npm run publish <id>`.

Every scene in `public.scenes` should end up with a non-null
`chapter_number` pointing at an existing chapter row.

## MP4 export — not part of publish

`scripts/render-scene.js` still produces `renders/<id>.mp4` (plus a
`.portrait.mp4` for 9:16) for social cuts and downloads, but it is **not
in the publish flow**. The live HTML at the Pages URL is what
kort-forklart embeds; portrait scenes adapt via `?aspect=9:16` at view
time. Use `render-scene.js` only when someone needs a standalone video
file.

## Nightly publish workflow

The reviewer agent (cron trigger `trig_01QXiioNfPwJnDgThdsmQfXt`)
publishes every merged scene with `npm run publish <id>`. If Supabase
env vars are missing in the sandbox, the publish is logged as a
`[HUMAN]` item in `PLAN.md` to re-run with the keys present.
