---
description: Schedule a Manimo scene-generation routine with the project quality bar baked in (dual aspect, interactive animation, no sloppy first drafts).
---

You are setting up a scheduled or ad-hoc routine that will run inside this
Manimo repo. Project-local override of the generic `/schedule` skill — the
generic version produces sloppy first drafts that skip portrait rendering
and treat fade-ins as "animation". Don't do that here.

## 1. Identify the objective

If the user hasn't said what scene/topic the routine should produce, ask
once. Don't guess. If the routine isn't about scene generation at all
(e.g. a dependency audit), fall back to the generic `/schedule` flow but
keep the "self-contained prompt" discipline from Step 2.

For ADE nightly runs (subject_id="ade"), the topic-picking step is
prescribed and does NOT need to be asked of the user:

1. Run `npm run coverage ade` first. It prints every chapter in
   Supabase `public.chapters` for `ade`, the number of scenes already
   in each, any unattached rows (`chapter_number IS NULL`), and any
   local/remote mismatches.
2. Pick the **focus chapter** = the most under-served one, unless a
   different chapter is a clearly better fit for the topics available
   in `uploads/ade/`. Some chapters need more videos than others —
   chapter title + exam-PDF weight is the tiebreaker, not raw count.
3. Generate scenes for **all missing topics** in the focus chapter
   (cap at 6 per run for reviewability). The routine ends when the
   chapter feels complete to a student, not when a quota is hit.
4. Before generating new content, resolve any backfill items the
   coverage script printed: unattached scenes, mismatches, or scenes
   whose `chapter_number` points at a row that's missing from
   `public.chapters`. Every scene in `public.scenes` should end up
   with a non-null `chapter_number` referencing an existing chapter.

## 2. Draft the task prompt

Future runs will not have access to this conversation. The prompt must be
fully self-contained: file paths, scene id, topic, success criteria — all
inline. Write it in second-person imperative.

For Manimo scene-generation routines, the prompt MUST include the
following non-negotiables, verbatim or stronger. These are the difference
between a Manimo scene and a generic explainer; do not soften them.

### Quality bar (overrides the "ship a first draft fast" instinct)

- Read `motion/README.md` end-to-end before writing anything. Read
  `CLAUDE.md` Hard Rules 1–9 — especially the FadeUp-vs-SvgFadeIn rule
  and the spoken-narration rule.
- Pick an existing scene as reference: `motion/fysikk/spring-oscillation.jsx`
  (best dual-aspect example, has audio wired up). Match its level of
  polish, not the bare minimum that compiles. The fysikk subject is
  irrelevant — the STRUCTURE is the template.
- Plan beats as an explicit comment block at the top of the new `.jsx`
  with `start`/`end` ranges, BEFORE writing JSX. Revise the plan if a
  beat is shorter than 2 s or longer than 8 s.
- Every motion uses easing — no linear ramps unless physically motivated
  (constant velocity, free fall before bounce). Reach for the easings in
  `motion/animations.jsx` / `manimo-motion.jsx`; don't hand-roll lerps.
- Every formula appears via `TraceIn` or `WriteOn`. Numbers and labels
  fade in with `SvgFadeIn` (inside `<svg>`) or `FadeUp` (DOM). Jump cuts
  on text are a quality failure.
- After the JSX is written, run `node scripts/lint-tokens.js
  motion/<id>.jsx` and fix every violation. Raw hex / Google-Font URLs
  are not optional.

### Dual aspect (HARD requirement)

Every new scene must render correctly at BOTH 16:9 (default 1280×720)
and 9:16 portrait (720×1280, query-param `?aspect=9:16`).

- Use the `usePortrait()` hook from `manimo-motion.jsx` in any component
  whose layout, geometry, or font sizing would break when the canvas
  rotates. Reference: `motion/spring-oscillation.jsx` lines 75–250.
- Provide a portrait branch for diagrams that don't fit horizontally
  (typically: stacked instead of side-by-side, ~85% font size,
  tightened gaps).
- After generation, snapshot both aspects and visually inspect (paths
  use the subject namespace — every scene lives under
  `motion/<subject_id>/`):
  ```
  node scripts/snapshot-scene.js motion/<subject_id>/<id>.html --out .tmp/snapshots/<id>/landscape
  node scripts/snapshot-scene.js motion/<subject_id>/<id>.html --portrait --out .tmp/snapshots/<id>/portrait
  ```
  Fix layout problems before the routine reports success. A scene that
  only looks right in landscape is incomplete.

### Genuine animation (HARD requirement)

A Manimo scene exists to show something *moving* that you cannot show on
a static chalkboard. A scene whose animation budget is exhausted by
`FadeUp` + `TraceIn` + `WriteOn` is rejected — those build text, they
don't demonstrate the physics.

At least one beat must feature one of:

- Physics-driven motion (spring oscillation, projectile arc, RC
  charging curve traced in real time, pendulum swing).
- A value-driven graph that traces in synchronously with a moving
  diagram element (the dot moves, the curve grows from the same
  parameter).
- A diagram element that morphs: vector rotates with the angle, area
  fills as the integral accumulates, shape transitions between two
  states.
- A swept parameter: silently scrub a slider through its range and
  show the system respond (e.g. damping coefficient, spring constant).

If the topic genuinely doesn't admit motion (rare — most physics does),
flag this in the routine output rather than ship a static deck.

### Audio

- After the JSX passes lint and visual check, run `npm run audio <id>`.
  If `ELEVENLABS_API_KEY` is set and quota is healthy, you get a real
  MP3 + audio-aligned offsets. Otherwise the script falls back to
  estimated timings without erroring. The remote nightly sandbox usually
  has the key; locally on macOS you can also pass `--engine local` to
  use `say` (rougher but offline).
- Apply the printed wire-up to `motion/<subject_id>/<id>.jsx`,
  `motion/<subject_id>/<id>.spec.json`, `motion/scene-manifest.json`
  (`duration` field), and `ui_kits/studio/app.jsx` (`initialScenes` entry).
- Narration must follow CLAUDE.md Hard Rule 9 (spoken, not symbolic);
  `generate-audio.js` refuses to render formula-shaped narration
  regardless of engine.

### Publish to kort-forklart

After audio is wired up AND the PR has been merged to main:

- `npm run publish <id>` — upserts the scene row in the Supabase
  `scenes` table with `scene_url` pointing at the live GitHub Pages
  HTML (`https://egeiran.github.io/Manimo-Design-System/motion/<subject_id>/<html>?embed=1`).
  Metadata-only; no MP4 upload, no Storage bucket. The scene becomes
  reachable as soon as Pages picks up the new files from the merged PR.
- For nightly runs, the **reviewer agent** publishes after merging — the
  authoring agent should NOT publish itself.
- If `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing in the
  sandbox's `.env`, log it as a [HUMAN] follow-up in `PLAN.md` and
  skip the publish — don't fail the whole routine.
- An MP4 export via `scripts/render-scene.js` is still useful for
  ad-hoc social cuts but is **not** part of the publish flow.

### Reporting

The routine should end with a one-paragraph report containing:
the scene id, the two snapshot file paths, whether audio was generated,
and any quality concerns the agent noticed but didn't fix. Do NOT claim
success on layout or animation quality — those need a human visual
review (see `PLAN.md` `[HUMAN]` items).

## 3. Choose `taskName`

Kebab-case, scene-relevant: `nightly-scene-<topic>`,
`weekly-tfy4125-batch`, `audit-portrait-rendering`.

## 4. Schedule

Same rules as the generic skill: `cronExpression` for recurring,
`fireAt` (ISO 8601 with timezone offset) for one-time, omit both for
ad-hoc. Cron times are LOCAL, not UTC.

For nightly Manimo runs, default to `0 2 * * *` (2am local) unless the
user wants otherwise — confirm before calling the tool.

Finally, call `create_scheduled_task`.
