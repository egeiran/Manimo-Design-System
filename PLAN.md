# Manimo — Improvement Plan

Tracks the six structural improvements identified after authoring the
`derivation-scene` (moment of inertia). Each item is self-contained and can
be reviewed/merged independently.

---

## Tasks

- [x] **1. Shared `SceneChrome` component**
  Add a `SceneChrome` wrapper to `manimo-motion.jsx` that renders the
  repeated boilerplate every scene needs: grid background, watermark,
  persistent Manimo corner, and a title block. New scenes pass three props
  (`eyebrow`, `title`, `children`) and get all chrome for free.
  Refactor `derivation-scene.jsx` to use it (and update `rc-scene.jsx`
  as a reference but don't break it).

- [x] **2. Scene manifest**
  `motion/scene-manifest.json` — a structured registry of every scene file
  with its title, duration, topic, and prerequisite scenes. An AI assembling
  a lesson reads this to know what building blocks exist and what order they
  should teach concepts.

- [x] **3. Sprite/delay timing cheatsheet in `motion/README.md`**
  The trickiest part of the authoring model is understanding that `delay`
  inside a primitive is relative to the *nearest parent Sprite's* `localTime`,
  not to absolute stage time. Add a concrete table and worked example to
  README so agents (and humans) don't make the nested-Sprite mistake.

- [x] **4. Token linter (`scripts/lint-tokens.js`)**
  A Node script that scans `.jsx` files for hardcoded hex literals and bare
  `rgba(` / `rgb(` calls and exits non-zero if any are found. Enforces the
  hard rule "use tokens, never raw hex" without relying on discipline.

- [x] **5. Narration stubs**
  Add a `NARRATION` constant at the top of each scene (plain English, one
  sentence per beat). Co-locates the script with the animation so TTS or
  subtitle generation has an authoritative source.

- [x] **6. AI scene-spec format**
  `motion/scene-spec.schema.json` — a JSON schema describing the structured
  intermediate representation (beats → diagrams → formulas → captions) that
  sits between a natural-language topic request and JSX code. Includes
  `motion/rc-scene.spec.json` as a concrete example. Lets an LLM fill a spec
  for review before generating JSX, dramatically reducing the iteration cost.

---

## Rationale — Phase 1

| Item | Why now |
|------|---------|
| SceneChrome | Every new scene currently copies ~80 lines of boilerplate. One source of truth. |
| Manifest | Without a registry an AI has no way to know what scenes exist or what's missing. |
| Timing cheatsheet | The nested-Sprite trap is the #1 authoring mistake. Document it once. |
| Token linter | The hard rule has no enforcement — one raw hex slips through per session. |
| Narration stubs | TTS/subtitles are the next obvious feature; stubs make the jump trivial. |
| Spec format | Separating *what to teach* from *how to animate it* is the lever that makes AI video generation scalable. |

---

## Phase 2 — Close the loop

Phase 1 built infrastructure. Phase 2 turns it into a working AI-powered video pipeline.
The core value proposition — "student describes a concept → gets an animated explainer" — has
no working implementation yet. These three steps close that loop in order of leverage.

---

### Step A — Fix the scene template (15 min) ✦ do first

- [x] **Update `motion/_scene-template.jsx`** to use `SceneChrome` instead of the old
  Background/Watermark/SceneTitle/ManimoCorner boilerplate. Add the `NARRATION` constant stub.
  Every future scene starts from this template — it needs to reflect the current patterns.

- [x] **Update `motion/_scene-template.html`** title tag from "TODO: rename" to a real placeholder,
  and add a comment pointing to `motion/README.md`.

---

### Step B — Scene 3: Hoop vs Disk (1–2 sessions)

The studio README explicitly lists **"Why a hoop rolls slower than a disk"** as its exemplar lesson.
Building this scene:
- Proves the spec-first workflow end-to-end (fill `hoop-disk.spec.json` → review → generate JSX)
- Gives the studio a third real scene to show in `SceneList`
- Naturally follows Scene 2 (moment of inertia) — same physics, concrete payoff

Beats sketch:
```
0–3     Manimo enters: "Two wheels, same mass, same radius — which one wins?"
3–9     Side-by-side: hoop (I = MR²) and disk (I = ½MR²) roll down a ramp
9–15    Energy conservation derivation: mgh = ½mv² + ½Iω², substitute I
15–21   Result: v_disk = √(4gh/3), v_hoop = √(gh) — disk always wins
21–26   Formula punchline: less rotational inertia → more translational speed
```

- [x] Write `motion/hoop-disk.spec.json` (fill the spec, review beats)
- [x] Generate `motion/hoop-disk.jsx` + `.html` from the spec
- [x] Add to `motion/scene-manifest.json`

---

### Step C — `scripts/generate-scene.js` (the AI integration)

This is the heart of the product. A Node script that takes a filled spec JSON and calls
Claude API to produce a ready-to-open JSX scene file. With this script the workflow becomes:

```
1. Describe a concept in plain text
2. AI fills scene-spec.schema.json  (or you fill it yourself)
3. Review the spec — adjust beats, narration, visual descriptions
4. node scripts/generate-scene.js hoop-disk.spec.json
5. Open motion/hoop-disk.html in browser
```

That is the MVP of AI-powered scene creation. No studio UI needed to prove it works.

Implementation:
- [x] `scripts/generate-scene.js` — reads a spec JSON, sends it + CLAUDE.md + motion/README.md
  as context to Claude API (`claude-sonnet-4-6`) with prompt-caching breakpoints
- [x] System prompt: the scene authoring rules (CLAUDE.md hard rules + README conventions),
  the spec schema, and an example (rc-scene.spec.json → rc-scene.jsx) as few-shot reference
- [x] Output: `motion/<id>.jsx` + `motion/<id>.html` (templated HTML with correct script src)
- [x] `--dry-run` flag prints prompt sizes without calling the API
- [x] `--force` flag allows overwriting existing files
- [x] Post-generation lint run, scoped to the new file only

---

### Step D — Wire PreviewCanvas to a real iframe (studio becomes useful)

The studio is a static mock. One targeted change makes it real:
replace `PreviewCanvas.jsx`'s placeholder `<div>` with an `<iframe src="../../motion/<scene>.html">`
that loads the actual scene. Then the center column shows a live, scrubbable animation.
No chat functionality needed — just a hardcoded scene path for now.

- [x] Update `ui_kits/studio/PreviewCanvas.jsx` to render a real scene in an iframe
  (added `SceneLive` renderer with ResizeObserver-based scaling to fit the preview frame)
- [x] Wire `SceneList` click → update the src of the iframe
  (3 new `kind: 'live'` entries appended to `initialScenes`, plus a `live` SceneThumb)
- [x] The studio is now a real scene browser, not a mock

---

## Priority order

```
A (template)  →  B (scene 3, spec-first)  →  C (generate-scene.js)  →  D (studio iframe)
     ↑                    ↑                           ↑                        ↑
  15 min            proves workflow              AI integration          product feel
```

**Don't jump to D before C.** A studio that calls AI to generate scenes is the milestone.
A studio with a pretty iframe but no generation is just a nicer mock.

---

---

## Phase 3 — Cleanup discovered during Phase 2

While wiring the studio to the linter pipeline, a silent path-encoding bug
(`new URL('..', import.meta.url).pathname` URL-encodes spaces in the project path)
was found in `scripts/lint-tokens.js`. The bug meant the linter has been **scanning
nothing** since it was added. After fixing, the linter reports **49 pre-existing
violations** across the codebase — hardcoded brand hex values like `#f4b860`,
`#fbf7ee`, `#e87a90`, etc.

These are not regressions from Phase 1/2 work — they are pre-existing technical
debt that was masked by the broken linter. New code (Phase 1+2) is clean.

- [ ] **Migrate hardcoded brand hex to CSS tokens** in:
  - `motion/animations.jsx` (sample/legacy primitives)
  - `motion/manimo-motion.jsx` (default props on Manimo, ChalkTip, etc.)
  - `ui_kits/studio/*.jsx`, `ui_kits/watch/*.jsx` (mockup hex literals)
- [ ] **Decide on policy for primitive defaults** — library primitives like `<Manimo>`
  reasonably want a fallback color when no prop is passed. Either accept this as
  legitimate (and add a per-line lint comment), or pull defaults from CSS variables
  via getComputedStyle on a sentinel element.

---

## Later (not blocking Phase 2)

- **TTS pipeline** — `window.sceneNarration` → audio file via a TTS API (ElevenLabs or browser
  Web Speech API for prototyping). The narration stubs make this a one-afternoon task.
- **KaTeX formula rendering** — Replace Unicode formula strings (`½MR²`) with properly typeset
  math via KaTeX → SVG paths fed into `TraceIn`. Necessary for complex multi-line derivations.
- **More TFY4125 scenes** — After the generation script exists, adding scenes is cheap.
  Candidates: Newton's laws, energy conservation, wave interference, thermodynamics basics.
- **Watch UI** — Wire the watch player to the scene manifest so students can browse and play
  lessons. A thin layer on top of the existing mock.
