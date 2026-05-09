# Manimo — Plan

Forward-looking plan and the rolling nightly-agent queue. Completed work
lives in git history, not here.

---

## Nightly agent queue

Single rolling section. The nightly agent processes [AGENT] items, removes
them from this list when done (git history is the audit trail), and appends
new items found during the run. Items tagged [HUMAN] are skipped by the agent
and require your input. Total queue size is kept ≤ 12 items.

**Current defaults (set 2026-05-09):** the nightly authoring agent now
ships **three OS scenes per run**, sourcing topics from
`uploads/operativsystemer/` (TDT4186 — Operativsystemer). The reviewer
**merges by default** unless the PR is genuinely broken (page crash,
render failure, missing file, build error); quality concerns are logged
back into this queue as [HUMAN] items rather than blocking the merge.
The reviewer also **publishes each merged scene to Supabase** via
`npm run publish <id>`. See `trig_01W4V9M7fWvGN7J989JBeQsh` (author,
midnight UTC) and `trig_01QXiioNfPwJnDgThdsmQfXt` (reviewer, 03:00 UTC)
for the exact prompts.

### [AGENT] — safe for the next nightly run

- **Audio + render + publish loop for every scene without real audio.**
  Walk `motion/scene-manifest.json`. For each scene whose
  `motion/audio/<id>/scene.mp3` is missing OR whose
  `motion/audio/<id>/manifest.json` has `"mode": "fallback-estimated"`:

  1. `npm run audio <id> -- --engine local --force` — uses macOS `say`
     locally and `espeak-ng` on Linux sandboxes (no ElevenLabs key
     needed; auto-picks). On Linux: `apt-get install espeak-ng` if it's
     not already on PATH. The script now also resolves spec paths via
     the manifest's `spec` field, so this works for `rc-circuit` and
     `moment-of-inertia` even before the rename TODO below lands.
  2. Apply the printed wire-up to `motion/<file>.jsx`,
     `motion/<spec>.json`, `motion/scene-manifest.json` (just the
     `duration` field), and `ui_kits/studio/app.jsx`. The wire-up
     instructions are emitted at the end of the audio run.
  3. `npm run publish <id>` — upserts the scene row in Supabase with
     `scene_url` set to the live GitHub Pages HTML
     (`https://egeiran.github.io/Manimo-Design-System/motion/<html>?embed=1`).
     Metadata-only; no MP4 upload, no Storage bucket. Requires
     `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in `.env`. If those
     are missing on the sandbox, log it as a [HUMAN] follow-up and
     skip — the audio + JSX are still committed and Pages will serve
     them once the PR merges, ready to publish on the next run with a
     working key.

  Quality note: `say` and `espeak-ng` are noticeably more robotic than
  ElevenLabs (especially `espeak`). These audio tracks are placeholders
  until the user can re-run with `--engine elevenlabs` from a host that
  can reach the API; the wire-up shape is identical so swapping engines
  later only requires the audio call + re-render + republish.

- **Snapshot tool path workaround.** The pre-cached chromium under
  `/opt/pw-browsers/chromium_headless_shell-1194` doesn't match the
  revision Playwright 1.59 expects (1217). Tonight the agent worked
  around it with `mkdir -p /tmp/pw-browsers/chromium_headless_shell-1217
  && ln -sfn /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux
  /tmp/pw-browsers/chromium_headless_shell-1217/chrome-headless-shell-linux64`
  + a `chrome-headless-shell` symlink to `headless_shell`, then
  `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers` for the snapshot run. If
  this keeps recurring, codify it: either pin Playwright in
  `package.json` to the version that matches the cached browser revision,
  or add a small `scripts/ensure-browsers.js` that lays down the symlinks
  before the snapshot tool runs.
- **Re-run `npm run audio centripetal-acceleration`,**
  `npm run audio damped-oscillation`, `npm run audio torque`, and
  `npm run audio coulombs-law` once `ELEVENLABS_API_KEY` can reach the
  API. All four currently sit on `mode: fallback-estimated` manifests
  because the ElevenLabs host is still off the sandbox allowlist
  (HTTP 403 "Host not in allowlist" tonight too — third night in a row).
  Re-running with a working key writes real MP3s + audio-aligned offsets
  — then re-apply the printed wire-up to each scene's `.jsx`,
  `.spec.json`, `scene-manifest.json`, and `ui_kits/studio/app.jsx`.
  (Same applies to `rc-circuit` and `moment-of-inertia` if/once the
  rename TODO below lands — those two still have no audio at all.)

- **Codify the snapshot chromium symlink workaround.** Recurred again
  tonight — third night in a row — so the "if this keeps recurring,
  codify it" trigger has fired. Add `scripts/ensure-browsers.js` that
  reads the expected revision from
  `node_modules/playwright-core/browsers.json`, finds an installed
  `chromium_headless_shell-*` under `/opt/pw-browsers/` (or wherever),
  and lays down the
  `/tmp/pw-browsers/chromium_headless_shell-<expected>/chrome-headless-shell-linux64`
  symlink + a `chrome-headless-shell` → `headless_shell` symlink inside.
  Have `scripts/snapshot-scene.js` import it at the top so the snapshot
  workflow becomes one command again. Tonight's manual fix (in shell):
  `mkdir -p /tmp/pw-browsers/chromium_headless_shell-1217 && ln -sfn
  /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux
  /tmp/pw-browsers/chromium_headless_shell-1217/chrome-headless-shell-linux64
  && ln -sfn headless_shell
  /opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/chrome-headless-shell`
  then `PLAYWRIGHT_BROWSERS_PATH=/tmp/pw-browsers ...`.

### [HUMAN] — needs your input

- **Visual review of `pendulum`.** Snapshot tool was unavailable on
  the sandbox the night this scene shipped (chromium download blocked),
  so beat 2 (the angled pendulum diagram with both gravity and
  tangential restoring vectors) was shipped without a visual pass.
  Tonight's snapshot workaround (see [AGENT] item above) means a
  follow-up nightly could now re-snapshot; in the meantime, open
  `motion/pendulum.html` manually and check: (a) the −mg sin θ label
  is readable and not overlapping the bob, (b) the tangential arrowhead
  points clearly back-toward-vertical, (c) the angle arc near the pivot
  is large enough to read.

- **Rename `rc-scene.*` → `rc-circuit.*` and `derivation-scene.*` →
  `moment-of-inertia.*`** so the audio script (`npm run audio
  <scene-id>`) can find their specs. Today the file names diverge from
  the manifest's `id`, which is why the nightly couldn't add audio to
  those two scenes. Touches: `motion/{rc-scene,derivation-scene}.{jsx,html,spec.json}`,
  the `<script src>` in each HTML, `motion/scene-manifest.json` (file/html/spec
  fields), and the studio `app.jsx` `initialScenes` `html` paths.

- **Visual review of `centripetal-acceleration`.** Same situation —
  snapshot was blocked on the night this scene shipped. Tonight's
  workaround would have unblocked it; consider re-snapshotting on the
  next nightly. Until then: open `motion/centripetal-acceleration.html`
  and check: (a) at the rightmost orbit position in beat 2 the velocity
  arrow doesn't run off the 1280-wide canvas, (b) in beat 3 the inward
  `aᶜ` arrow reads cleanly against the bright amber ball (the tangent
  rose is intentionally dimmed at 0.7 — confirm the contrast still reads
  pedagogically), (c) in beat 4 the three-formula chain doesn't wrap
  on narrower aspect ratios when the studio kit shrinks the preview.
  The `c` subscript is rendered via `<sub>` (HTML) and `<tspan dy>`
  (SVG), so no Unicode-glyph fallback risk.

- **Visual review of `damped-oscillation` portrait beat 5.**
  Snapshotted both aspects tonight; the overdamped curve in portrait
  mode is intentionally a shallow slope (it's *supposed* to look almost
  flat — slow exponential creep with γ > ω₀), but a sanity-check pass
  from a human eye would help confirm it doesn't read as "broken". The
  snapshot at midpoint t=43.2s in `.tmp/snapshots/damped-oscillation/portrait/`
  is the one to check. Same prompt for landscape if you want a
  side-by-side.

- **Visual review of `torque` (especially the sweep beat).** Authored
  in the previous nightly (§2.3 Dreiemoment). The sweep beat
  (29.33–38.99 s) is a value-driven animation — the force vector
  rotates around the wrench tip while a τ = rF sin θ curve traces in
  synchronously below. Snapshots only catch one frame, so the *motion*
  needs a human eye. Open `motion/torque.html` and watch beat 4
  end-to-end: (a) the rotating arrow and the moving curve-marker should
  stay mathematically locked (sin θ readout matches the dot's height),
  (b) at θ = 90° the dot should sit precisely at τ = rF on the y axis,
  (c) the dashed half-circle reference around the wrench tip shouldn't
  feel cluttered against the graph axes (they were nudged apart in
  landscape during the visual pass; portrait already separates them
  vertically). Beat 3 (`angleMatters`) also worth a glance — the
  dashed `F cos θ` parallel arrow runs into the wrench-head boundary
  on the right; not a blocker but it could read cleaner.

- **Visual review of `coulombs-law` beat 4 (inverse-square sweep).**
  Snapshotted both aspects tonight — the sweep, the moving force arrow
  (length ∝ 1/r²) and the F-vs-r curve trace look right structurally.
  But two things want a human eye: (a) when r is large and the force
  arrow is short, the "F" label hugs the right edge of the +q₂ charge
  circle in portrait — readable but tight; consider whether to flip
  the F label below the line when fLen drops under ~25px. (b) The
  graph baseline sits below the diagram with no labelled tick marks
  on either axis — only "F" and "r" axis names. Decide whether to add
  one tick at r = 2·rMin so the "twice the distance → quarter the
  force" payoff has a visible anchor on the curve. Snapshots are at
  `.tmp/snapshots/coulombs-law/{landscape,portrait}/`.

- **Subject focus is now Operativsystemer (TDT4186).** Fysikk topics are
  paused — the nightly author picks three OS topics per run from
  `uploads/operativsystemer/`. If you want a specific OS topic prioritised
  (e.g. "do scheduling next, then page tables, then locks"), reply in
  chat. Otherwise the agent picks based on coverage gaps in the manifest.
  To reopen fysikk later, edit the author trigger
  (`trig_01W4V9M7fWvGN7J989JBeQsh`) and swap the `uploads/...` source
  pointer + chapter list back.

---

## Notes

- **Publishing is subject-aware.** `motion/scene-manifest.json` carries
  `subject_id` + `chapter_number` per scene; `scripts/publish-scene.js`
  propagates both into `public.scenes`. New scenes should set these in
  the spec's top-level fields — `generate-scene.js` mirrors them into
  the manifest entry automatically.

---

## Later — not blocking, in priority order

- **KaTeX formula rendering** — Replace Unicode formula strings (`½MR²`)
  with properly typeset math via KaTeX → SVG paths fed into `TraceIn`.
  Necessary for complex multi-line derivations.
- **More TFY4125 scenes** — Adding scenes is cheap now that
  `scripts/generate-scene.js` exists. Candidates: Newton's laws, energy
  conservation, wave interference, thermodynamics basics.
- **Watch UI** — Wire the watch player to the scene manifest so students
  can browse and play lessons. A thin layer on top of the existing mock.
