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

- **Re-run `npm run audio centripetal-acceleration`**,
  `npm run audio damped-oscillation`, and `npm run audio torque`
  once `ELEVENLABS_API_KEY` can reach the API. All three currently
  sit on `mode: fallback-estimated` manifests because the ElevenLabs
  host is still off the sandbox allowlist (HTTP 403 "Host not in
  allowlist" tonight, same as the previous two nights). Re-running
  with a working key writes real MP3s + audio-aligned offsets —
  then re-apply the printed wire-up to each scene's `.jsx`,
  `.spec.json`, `scene-manifest.json`, and `ui_kits/studio/app.jsx`.
  (Same applies to `rc-circuit` and `moment-of-inertia` if/once the
  rename TODO below lands — those two still have no audio at all.)

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

- **Visual review of `torque` (especially the sweep beat).** Authored
  tonight (§2.3 Dreiemoment). The sweep beat (29.33–38.99 s) is a
  value-driven animation — the force vector rotates around the wrench
  tip while a τ = rF sin θ curve traces in synchronously below.
  Snapshots only catch one frame, so the *motion* needs a human eye.
  Open `motion/torque.html` and watch beat 4 end-to-end:
  (a) the rotating arrow and the moving curve-marker should stay
  mathematically locked (sin θ readout matches the dot's height),
  (b) at θ = 90° the dot should sit precisely at τ = rF on the y axis,
  (c) the dashed half-circle reference around the wrench tip shouldn't
  feel cluttered against the graph axes (they were nudged apart in
  landscape during the visual pass; portrait already separates them
  vertically). Beat 3 (`angleMatters`) also worth a glance — the
  dashed `F cos θ` parallel arrow runs into the wrench-head boundary
  on the right; not a blocker but it could read cleaner.

- **Next topic after Torque.** Remaining adjacent picks:
  §4.1 Coulombs lov (F = kq₁q₂/r², the electromagnetism opener — would
  open a new chapter parallel to the rotational arc),
  §4.6.6 LC-krets (an oscillating circuit, mirrors the spring scene
  with current ↔ velocity),
  §3.5 Resonance (driven damped oscillator — natural sequel to the
  damping scene),
  §2.4 Spinn (angular momentum L = Iω — sits naturally next to tonight's
  torque scene since τ = dL/dt is the rotational analogue of F = dp/dt).
  Reply in chat with a pick or say "agent's choice".

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
