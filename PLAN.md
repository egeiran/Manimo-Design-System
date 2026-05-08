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

- **Re-run `npm run audio centripetal-acceleration`,**
  `npm run audio damped-oscillation`, and `npm run audio coulombs-law`
  once `ELEVENLABS_API_KEY` can reach the API. All three currently sit
  on `mode: fallback-estimated` manifests because the ElevenLabs host
  is still off the sandbox allowlist (HTTP 403 "Host not in allowlist"
  tonight too — third night in a row). Re-running with a working key
  writes real MP3s + audio-aligned offsets — then re-apply the printed
  wire-up to each scene's `.jsx`, `.spec.json`, `scene-manifest.json`,
  and `ui_kits/studio/app.jsx`. (Same applies to `rc-circuit` and
  `moment-of-inertia` if/once the rename TODO below lands — those two
  still have no audio at all.)

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

- **Next topic after Coulomb's law.** Remaining adjacent picks:
  §2.3 Dreiemoment (torque, τ = r×F — needed before §2.4 spinn),
  §4.6.6 LC-krets (an oscillating circuit, mirrors the spring scene
  with current ↔ velocity), §3.5 Resonance (driven damped oscillator —
  natural sequel to the damping scene), §4.2 Electric potential
  (immediate sequel to tonight's Coulomb scene — same setup, integrate
  to potential V = kq/r). Reply in chat with a pick or say "agent's
  choice".

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
