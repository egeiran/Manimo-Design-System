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

- **Re-run `npm run audio centripetal-acceleration`** once
  `ELEVENLABS_API_KEY` can reach the API. Tonight the host was off the
  sandbox allowlist, so the script fell back to estimated 14 chars/sec
  timings (no `scene.mp3`, manifest is `mode: fallback-estimated`).
  Re-running with a working key writes the real MP3 + audio-aligned
  offsets — then re-apply the printed wire-up to `.jsx`, `.spec.json`,
  `scene-manifest.json`, and `ui_kits/studio/app.jsx`. (Same applies to
  `rc-circuit` and `moment-of-inertia` if/once the rename TODO below
  lands — those two still have no audio at all.)

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

- **Visual review of `pendulum`.** Snapshot tool was unavailable in the
  sandbox (chromium download blocked), so beat 2 (the angled pendulum
  diagram with both gravity and tangential restoring vectors) was
  shipped without a visual pass. Open `motion/pendulum.html` and check
  that: (a) the −mg sin θ label is readable and not overlapping the
  bob, (b) the tangential arrowhead points clearly back-toward-vertical,
  (c) the angle arc near the pivot is large enough to read.

- **Rename `rc-scene.*` → `rc-circuit.*` and `derivation-scene.*` →
  `moment-of-inertia.*`** so the audio script (`npm run audio
  <scene-id>`) can find their specs. Today the file names diverge from
  the manifest's `id`, which is why the nightly couldn't add audio to
  those two scenes. Touches: `motion/{rc-scene,derivation-scene}.{jsx,html,spec.json}`,
  the `<script src>` in each HTML, `motion/scene-manifest.json` (file/html/spec
  fields), and the studio `app.jsx` `initialScenes` `html` paths.

- **Visual review of `centripetal-acceleration`.** Snapshot tool was
  unavailable in the sandbox again (chromium download blocked, same
  failure mode as Pendulum night), so the new scene shipped without a
  visual pass. Open `motion/centripetal-acceleration.html` and check:
  (a) at the rightmost orbit position in beat 2 the velocity arrow
  doesn't run off the 1280-wide canvas, (b) in beat 3 the inward `aᶜ`
  arrow reads cleanly against the bright amber ball (the tangent rose
  is intentionally dimmed at 0.7 — confirm the contrast still reads
  pedagogically), (c) in beat 4 the three-formula chain doesn't wrap
  on narrower aspect ratios when the studio kit shrinks the preview.
  The `c` subscript is rendered via `<sub>` (HTML) and `<tspan dy>`
  (SVG), so no Unicode-glyph fallback risk.

- **Next topic after Centripetal acceleration.** Remaining adjacent
  picks: §2.3 Dreiemoment (torque, τ = r×F — needed before §2.4 spinn),
  §4.1 Coulombs lov (F = kq₁q₂/r², the electromagnetism opener), §3.4
  Demping (damped oscillator, builds directly on spring + pendulum),
  §4.6.6 LC-krets (an oscillating circuit, mirrors the spring scene with
  current ↔ velocity). Reply in chat with a pick or say "agent's choice".

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
