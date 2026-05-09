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
- Pick an existing scene as reference: `motion/spring-oscillation.jsx`
  (best dual-aspect example) or `motion/pendulum.jsx`. Match its level
  of polish, not the bare minimum that compiles.
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
- After generation, snapshot both aspects and visually inspect:
  ```
  node scripts/snapshot-scene.js motion/<id>.html
  node scripts/snapshot-scene.js motion/<id>.html --portrait
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

- After the JSX passes lint and visual check, run
  `npm run audio <id> -- --engine local`. This uses `say` on macOS and
  `espeak-ng` on Linux sandboxes — no ElevenLabs key required, no
  network dependency, real per-beat audioStart offsets via ffprobe.
  If `espeak-ng` isn't on PATH, install it first
  (`apt-get install espeak-ng`). Quality is rough; the human can
  re-run with `--engine elevenlabs` later — wire-up shape is identical
  so swapping engines is just audio + re-render + republish.
- Apply the printed wire-up to `motion/<id>.jsx`,
  `motion/<id>.spec.json`, `motion/scene-manifest.json` (`duration`
  field), and `ui_kits/studio/app.jsx` (`initialScenes` entry).
- Narration must follow CLAUDE.md Hard Rule 9 (spoken, not symbolic);
  `generate-audio.js` refuses to render formula-shaped narration
  regardless of engine.

### Publish to kort-forklart

After audio is wired up:

- `npm run publish <id>` — upserts the scene row in the Supabase
  `scenes` table with `scene_url` pointing at the live GitHub Pages
  HTML (`https://egeiran.github.io/Manimo-Design-System/motion/<html>?embed=1`).
  Metadata-only; no MP4 upload, no Storage bucket. The scene becomes
  reachable as soon as Pages picks up the new `motion/<id>.html` from
  the merged PR.
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
