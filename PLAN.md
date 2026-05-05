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

- Re-run `npm run audio hoop-disk` and `npm run audio pendulum` once
  `ELEVENLABS_API_KEY` reaches the API (the sandbox returns HTTP 403
  "Host not in allowlist" today). Both scenes currently ship with
  fallback estimated timings — re-running with a working key will
  overwrite each `manifest.json` with real per-character offsets and
  drop a `scene.mp3` next to it. After audio lands, apply the printed
  wire-up: add `<SceneNarration src=…/>` inside `<Scene>` and
  `loop={false}` on `<Stage>` for each scene, and refresh the four
  files (jsx / spec.json / scene-manifest.json / studio app.jsx) with
  the new timings.

### [HUMAN] — needs your input

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

- **Next topic after Pendulum.** Adjacent picks: §2.3 Dreiemoment
  (torque, τ = r×F — needed before §2.4 spinn), §2.6 Sentripetalakselerasjon
  (a = v²/r), §4.1 Coulombs lov (F = kq₁q₂/r², the electromagnetism
  opener), §3.4 Demping (damped oscillator, builds directly on spring
  + pendulum). Reply in chat with a pick or say "agent's choice".

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
