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

### [HUMAN] — needs your input

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
