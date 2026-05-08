# Manimo — Plan

Forward-looking plan and the rolling nightly-agent queue. Completed work
lives in git history, not here.

---

## Nightly agent queue

Single rolling section. The nightly agent processes [AGENT] items, removes
them from this list when done (git history is the audit trail), and appends
new items found during the run. Items tagged [HUMAN] are skipped by the agent
and require your input. Total queue size is kept ≤ 12 items.

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
  3. `npm run render motion/<html> -- --landscape-only` — re-renders
     `renders/<id>.mp4` so the new audio is muxed in. Skip portrait
     (16:9 only is the new publish target — see CLAUDE.md "Publishing
     scenes").
  4. `npm run publish <id>` — uploads `<id>/video.mp4` + auto-extracted
     `<id>/poster.jpg` to the Supabase `scenes` bucket and upserts the
     row. Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in
     `.env`. If those are missing on the sandbox, log it as a [HUMAN]
     follow-up and skip step 4 — but still complete steps 1–3 so the
     audio is committed and ready to publish on the next run with a
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

### [HUMAN] — needs your input

- **Update the nightly recurring prompt to always create the PR.** The
  prompt's Step 6 already says to `gh pr create`, but a system reminder
  injected by the harness says "do NOT create a pull request unless
  the user explicitly asks." Tonight that conflict made the agent stop
  one step short; the user had to ask for the PR by hand. Adjust the
  prompt source (wherever the nightly is scheduled — outside this
  repo) to either (a) explicitly override the reminder, or (b) make
  the standing-instruction note in the prompt itself clear that the
  user has pre-authorised PR creation. The agent should still never
  merge.

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

- **Next topic after Damped oscillation.** Remaining adjacent picks:
  §2.3 Dreiemoment (torque, τ = r×F — needed before §2.4 spinn),
  §4.1 Coulombs lov (F = kq₁q₂/r², the electromagnetism opener),
  §4.6.6 LC-krets (an oscillating circuit, mirrors the spring scene
  with current ↔ velocity), §3.5 Resonance (driven damped oscillator —
  natural sequel to tonight's damping scene). Reply in chat with a
  pick or say "agent's choice".

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
