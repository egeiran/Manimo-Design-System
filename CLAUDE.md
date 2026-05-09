# Manimo — project conventions

This file orients automated agents (Claude Code, Claude in this app) working
in the repo. Read it first.

## What this project is

Manimo is a web product where students *talk* to an AI to produce animated,
chalkboard-style explainers for physics/maths courses (Norwegian university
context — initial pilot is TFY4125 fysikk at NTNU). The repo contains:

- A **brand + design system** (tokens, type, components)
- A **motion library** of named animation primitives
- Two **UI kits**: `studio/` (the chat-driven editor) and `watch/` (the
  public lesson page)
- An **example scene** in `motion/` that shows the system in use

The look is dark, warm-chalk, hand-drawn — Manim feeling, not corporate
SaaS. Plum-indigo backgrounds, amber as the "chalk" color, Fraunces for
display and italics, Inter for UI, JetBrains Mono for numeric labels.

---

## Repo layout

```
README.md                 Brand brief: voice, content fundamentals, visual foundations
SKILL.md                  Skill manifest (when invoked from chat)
CLAUDE.md                 (this file)
colors_and_type.css       All design tokens — colors, fonts, spacing, radii, shadows
fonts/                    Fraunces, Inter, JetBrains Mono (self-hosted woff2)
assets/                   Brand mark, wordmark, icon set
preview/                  Design-system review cards (type, colors, components, ...)
motion/
  animations.jsx          Stage / Sprite / useTime / Easing / interpolate (starter)
  manimo-motion.jsx       Named primitives: TraceIn, FadeUp, WriteOn, etc.
  README.md               Primitive reference — read before authoring scenes
  scene-manifest.json     Registry of all scenes (id, file, html, spec, subject_id, …)
  scene-spec.schema.json  JSON-schema for scene spec files
  _scene-template.jsx     Empty starter for new scenes
  _scene-template.html    Matching HTML bootstrap (uses depth-2 paths: ../animations.jsx, ../../colors_and_type.css)
  vendor/                 Local mirror of React/Babel for offline snapshot/render
  fysikk/                 Per-subject folder — every scene asset lives here
    rc-scene.{html,jsx,spec.json}
    rc-scene.notes/       Studio screenshot+comment pairs for this scene
    pendulum.{html,jsx,spec.json}
    …
    audio/<sceneId>/scene.mp3   Per-scene narration mp3 + manifest.json
ui_kits/
  studio/                 Chat-driven editor mock
  watch/                  Public lesson page mock
```

Scenes live under `motion/<subject_id>/` (currently only `fysikk/`).
Subject is organisational only — scene IDs remain globally unique and
stable, and `scene-manifest.json` entries store bare filenames in
`html`/`file`/`spec`; scripts compose `motion/<subject_id>/<file>` at
use time. New subjects (e.g. `matematikk1`) follow the same shape.

---

## Where new work goes

- **A new scene** → `motion/<subject_id>/<scene-name>.{jsx,html,spec.json}`.
  Copy from `motion/_scene-template.*` (the template uses depth-2
  relative paths so it works once placed under a subject folder). Don't
  fork `rc-scene.jsx`. Set `subject_id` (and ideally `chapter_number`)
  at the top of the spec — `scripts/generate-scene.js` reads them and
  writes the new files into the right subject folder, then upserts the
  manifest entry.
- **A new motion primitive** → add to `motion/manimo-motion.jsx` AND
  document it in `motion/README.md` AND export it on `window` in the
  `Object.assign(window, { ... })` block at the bottom of the file.
- **A new color/type/spacing token** → add it to `colors_and_type.css` in
  the same primitive → semantic → element layering as the existing tokens.
- **A new UI surface** → it's a kit under `ui_kits/<kit-name>/` with its
  own `index.html`. Don't put product UI in the project root.

---

## Hard rules

1. **Use design tokens, never raw hex.** All colors come from
   `var(--amber-400)`, `var(--chalk-200)` etc. defined in
   `colors_and_type.css`. Same for type (`var(--font-serif)`) and radii.

2. **Don't load Google Fonts.** Fraunces, Inter and JetBrains Mono are
   self-hosted in `fonts/` and wired in `colors_and_type.css`.

3. **Pin React + Babel exactly as the existing scene HTML does.**
   ```html
   <script src="https://unpkg.com/react@18.3.1/umd/react.development.js" integrity="..." crossorigin="anonymous"></script>
   <script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js" integrity="..." crossorigin="anonymous"></script>
   <script src="https://unpkg.com/@babel/standalone@7.29.0/babel.min.js" integrity="..." crossorigin="anonymous"></script>
   ```
   Copy the integrity hashes from `motion/fysikk/rc-scene.html` verbatim.

4. **Babel scripts don't share scope.** When splitting a scene across
   multiple `<script type="text/babel">` files, export shared identifiers
   on `window` at the bottom of each file:
   ```js
   Object.assign(window, { CircuitDiagram, ChargingGraph });
   ```

5. **No `const styles = {}` at module scope.** Multiple Babel files with
   a global named `styles` collide silently. Name them by component:
   `circuitStyles`, `graphStyles`, etc., or use inline styles.

6. **`FadeUp` inside `<svg>` does nothing.** Use `SvgFadeIn` for SVG
   children, `FadeUp` for HTML/DOM children. This is the single most
   common bug — see `motion/README.md`.

7. **One Sprite per animation beat.** Don't try to choreograph an entire
   scene from one Sprite. Multiple overlapping Sprites with explicit
   `start`/`end` are how scenes are composed.

8. **Stage size is 1280×720.** Don't change it without a reason; the
   Watch UI player is built around 16:9 at that resolution.

9. **Narration text is spoken, not symbolic.** The `narration` field in
   each beat (and the matching `NARRATION` array in the JSX) is read
   verbatim by TTS — symbol-laden phrasing sounds robotic. Always write
   it as natural prose:
   - "F = ma" → "force equals mass times acceleration"
   - "ω₀ = √(k/m)" → "omega zero equals the square root of k over m"
   - "T = 2π√(m/k)" → "T equals two pi times the square root of m over k"
   - "½Mv²" → "one half m v squared"
   - "v = √(4gh/3)" → "v equals the square root of four g h divided by three"
   - "15%" → "fifteen percent"
   - Hyphens between words ("omega-zero") → plain space ("omega zero"),
     because TTS pronounces the hyphen as "dash".

   The visual `text-formula` elements still use the symbolic form — this
   rule applies only to spoken/narration strings. `scripts/generate-audio.js`
   has a pre-flight check that refuses to call the API when narration
   contains math symbols (√, ², ½, π, ω, =, %, …); this rule is enforced,
   not optional. If the script aborts on this rule, rewrite the narration
   first.

---

## Authoring a new scene — checklist

1. Read `motion/README.md` end-to-end if you haven't.
2. `cp motion/_scene-template.jsx motion/<my-scene>.jsx`
3. `cp motion/_scene-template.html motion/<my-scene>.html` and update the
   `<title>` and the bottom `<script src>` to point at your jsx file.
4. Plan the beats as a comment block at the top of the jsx — explicit
   time ranges before you write any JSX.
5. Write one component per beat (e.g. `Title`, `Diagram`, `Graph`,
   `Formula`). Mount them inside `<Sprite start end>` blocks in `Scene`.
6. Use only primitives from `manimo-motion.jsx`. If you reach for a new
   one, that's a signal to add and document it (see Hard rule 5 above).
7. Open the `.html` file, scrub through with the timeline, and adjust
   `delay` values inside each Sprite for rhythm.

---

## Voice & content (when writing copy in scenes / UI)

- **Scene language: English by default.** All current scenes except the
  original `rc-circuit` prototype are in English (see
  `motion/scene-manifest.json` — `language` field). When authoring a new
  scene, write narration, captions, titles, and labels in English unless
  the user explicitly asks for Norwegian. **The language of the prompt
  you receive is not a signal** — the scene-authoring prompt may be
  written in Norwegian for the developer's convenience while the scene
  itself should be English. If unsure, ask.
- The eventual student-facing pilot is Norwegian (NTNU TFY4125), so a
  Norwegian translation pass will happen later — but new scenes are
  authored in English first to match the existing library.
- Mathematical notation uses Fraunces italics: *V*, *τ*, *RC*. Subscripts
  via `<sub>` or unicode (V₀).
- Captions are short and conversational, not lecture-formal. "Pull a
  weight on a string — what sets the rhythm?" rather than "We will now
  examine the dynamics of a simple pendulum."
- Numbers/labels in formulas use JetBrains Mono (`.63`, `0:11`).
- The `language` field in `<scene>.spec.json` is the source of truth for
  the scene's language. Match it to the actual narration/captions you
  write; downstream tooling (TTS voice selection, subtitle export) reads
  this field.

See `README.md` (root) for the full voice guide.

---

## Publishing scenes to kort-forklart

The companion repo `egeiran/kort-forklart` (Next.js + Supabase) consumes
scenes from this project as **live HTML** hosted on GitHub Pages. The flow:
push the scene HTML to `main` (Pages auto-deploys), then write a row in
Supabase pointing at the live URL. No MP4 upload, no storage bucket.

The Pages site lives at
`https://egeiran.github.io/Manimo-Design-System/`. Every scene in
`motion/scene-manifest.json` is reachable at
`https://egeiran.github.io/Manimo-Design-System/motion/<subject_id>/<html>`
(with `?embed=1` for iframe-style hosts that draw their own transport bar).
Pages is "Deploy from a branch", source `main` / root `/`; `.nojekyll`
at the repo root keeps Pages from stripping `_scene-template.*` files.

**One-time setup (kort-forklart's Supabase project):**

1. Open the Supabase dashboard's SQL editor and run `supabase/scenes.sql`
   — it creates the `scenes` table and the public-read RLS policy.
   Re-running on an existing install drops the legacy `video_url` /
   `poster_url` columns and adds `scene_url`.
2. Copy `.env.example` to `.env` at the Manimo repo root and fill in
   `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (Project Settings → API).
   The service-role key bypasses RLS and stays local — never commit it.

**Per-scene publish:**

```bash
git push origin main      # Pages picks up the new motion/<subject_id>/<id>.html
npm run publish <id>      # upserts row with scene_url
```

`scripts/publish-scene.js` is metadata-only: it reads the scene from
`motion/scene-manifest.json`, sets `scene_url` to the live Pages URL
plus `?embed=1`, and upserts a row in the `scenes` table. Re-publishing
the same id is safe — the SQL upsert merges on the primary key.
`npm run publish all` walks the whole manifest.

**Subject + chapter attachment.** Each manifest entry carries optional
`subject_id` (e.g. `"fysikk"`, `"matematikk1"`) and `chapter_number`
(integer) fields. `publish-scene.js` writes both into `public.scenes`
so kort-forklart can group scenes under
`(subject_id, chapter_number)` → `public.chapters`. Valid `subject_id`
values are the rows in kort-forklart's `public.subjects` table. If a
scene is unattached (sandbox, demo, preview), omit both fields and the
row is written with SQL `NULL`. The publish script does a best-effort
warn-only lookup against `public.subjects` / `public.chapters` to catch
typos before they propagate; missing rows do not abort the publish (the
FK is `ON DELETE SET NULL`). When generating a new scene with
`scripts/generate-scene.js`, set `subject_id` and `chapter_number` at
the top level of the spec — they get mirrored into the manifest entry
automatically.

**MP4 export is now ad-hoc.** `scripts/render-scene.js` still produces
`renders/<id>.mp4` for social cuts and downloads, but it's no longer in
the publish flow. Portrait (9:16) is no longer relevant to publishing
either; the live HTML adapts via `?aspect=9:16` at view time.

---

## Verification

After any non-trivial change, open the affected `.html` file in the
preview and confirm:

1. The page renders (no black screen) — check the browser console for
   syntax errors from Babel.
2. The animation plays through to the end without jumps or layout
   shifts.
3. Any text using token colors actually shows up against the background.

The most common failure mode is a Babel parse error from mismatched JSX
tags after a regex edit. Always re-read the changed file end-to-end if
you used scripted find-and-replace.
