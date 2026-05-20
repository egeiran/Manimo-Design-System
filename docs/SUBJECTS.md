# Subjects

A *subject* is the top-level organisational unit for scenes — typically one
university course or a coherent topic area. Subjects map to rows in
`kort-forklart`'s `public.subjects` Supabase table; scenes attach to a
subject (and optionally a chapter within it) via two fields:
`subject_id` and `chapter_number`.

Scene IDs remain globally unique. Subject is metadata, not part of the ID
namespace — `motion/scene-manifest.json` entries store bare filenames in
`html`/`file`/`spec`, and scripts compose `motion/<subject_id>/<file>` at
use time.

## Current subjects

For live coverage numbers (per-chapter scene counts, under-served chapters,
mismatches against Supabase), run:

```
npm run coverage <subject_id>
```

At the time of writing the local manifest contains **107 scenes** across
4 subjects:

| subject_id        | Course                                                              | Scenes |
| ----------------- | ------------------------------------------------------------------- | -----: |
| `fysikk`          | TFY4125 Fysikk (original pilot)                                     |     11 |
| `ade`             | TTT4203 Innføring i analog og digital elektronikk (current nightly) |     51 |
| `mat2b`           | Matematikk 2 (Mat2B)                                                |     25 |
| `operativsystemer`| Operativsystemer                                                    |     20 |

These counts drift as the nightly authoring agent adds scenes; treat
`npm run coverage <id>` as the source of truth. The Supabase
`public.chapters` table is the source of truth for chapter lists — do
not duplicate chapter titles or chapter counts in this repo.

`PLAN.md` documents the rolling nightly queue and the current chapter
maps per subject (read once for context; do not edit unless you are
adjusting the queue).

## Layout on disk

Every subject is a sibling folder under `motion/`:

```
motion/
  <subject_id>/
    <scene-id>.jsx
    <scene-id>.html
    <scene-id>.spec.json
    <scene-id>.notes/           Studio screenshot+comment pairs
    audio/
      <scene-id>/
        scene.mp3
        manifest.json
```

Inside the JSX/HTML/spec, relative paths assume depth-2 nesting:
`../animations.jsx`, `../../colors_and_type.css`. The
`motion/_scene-template.*` files already use the depth-2 form, so a
plain copy lands correctly under any subject folder.

## Adding a new subject

1. **Decide the `subject_id`.** Lowercase, no spaces, kebab-case if
   multi-word. Stable forever — it becomes part of every scene's
   metadata, the live URL path, and the Supabase FK target.
2. **Seed the kort-forklart side first.** Open kort-forklart's Supabase
   project and insert a row into `public.subjects` (id = your
   `subject_id`, title in the course's display language). Then insert
   the chapters for that course into `public.chapters`
   (`(subject_id, chapter_number)` is the composite PK).
3. **Write the spec for your first scene** with the new `subject_id`
   and a real `chapter_number`. The folder
   `motion/<subject_id>/` does not need to exist — `scripts/generate-scene.js`
   creates it.
4. **Generate the scene**: `node scripts/generate-scene.js <path-to-spec>`.
   This writes the JSX/HTML next to the spec, updates
   `motion/scene-manifest.json`, and mirrors `subject_id` +
   `chapter_number` into the manifest entry.
5. **Wire audio + duration**: see [`AUDIO.md`](AUDIO.md). Always run
   `rewire-scene.js` after audio generation.
6. **Verify coverage**: `npm run coverage <subject_id>` should now list
   your chapter row and show one scene attached.
7. **Publish**: `git push origin main && npm run publish <scene-id>`.
   See [`PUBLISHING.md`](PUBLISHING.md).

## Unattached scenes

Sandbox, demo, or preview scenes should omit both `subject_id` and
`chapter_number` from the spec. The publish script writes `NULL` for
both, and they appear in `npm run coverage` as a separate "unattached"
section that flags them for cleanup or attachment.

## Pausing a subject

The nightly author rotates focus between subjects via the agent
trigger prompt — to pause `fysikk` or switch from `ade` to a new
subject, edit `trig_01W4V9M7fWvGN7J989JBeQsh` (the author trigger) and
swap the `uploads/…` source pointer + chapter map. See `PLAN.md` for
the current rotation policy.
