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

- **TLB miss "branch" line is faint in landscape.** In
  `motion/operativsystemer/tlb-hit-miss.jsx`, the dotted `branchD` path
  that drops from the bottom of the TLB to the page-table box renders
  almost invisibly because it draws over the page-table-box stroke after
  a fade-in. Bump its `strokeWidth` from 1.6 to 2 and/or move the path
  in front of the page-table-box stroke. Single-file tweak.

- **Producer–Consumer portrait thread labels float in empty space.**
  In `motion/operativsystemer/producer-consumer.jsx` `bufGeom()`, the
  portrait branch puts `prodX=60` and `consX=480` while the buffer slots
  are centred around x=300. The "Thread Producer / Thread Consumer"
  labels render far left/right of the slots with a wide visual gap.
  Either move the labels closer to the slot row (e.g. anchor them
  immediately to the left/right of the first/last slot in portrait) or
  drop the side labels in portrait and put one label above each end of
  the slot row.

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
