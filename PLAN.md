# Manimo — Plan

Forward-looking plan and the rolling nightly-agent queue. Completed work
lives in git history, not here.

---

## Nightly agent queue

Single rolling section. The nightly agent processes [AGENT] items, removes
them from this list when done (git history is the audit trail), and appends
new items found during the run. Items tagged [HUMAN] are skipped by the agent
and require your input. Total queue size is kept ≤ 12 items.

**Current defaults (set 2026-05-09):** the nightly authoring agent
ships OS scenes per run (three by default, five on request),
sourcing topics from `uploads/operativsystemer/`
(TDT4186 — Operativsystemer). The reviewer
**merges by default** unless the PR is genuinely broken (page crash,
render failure, missing file, build error); quality concerns are logged
back into this queue as [HUMAN] items rather than blocking the merge.
The reviewer also **publishes each merged scene to Supabase** via
`npm run publish <id>`. See `trig_01W4V9M7fWvGN7J989JBeQsh` (author,
midnight UTC) and `trig_01QXiioNfPwJnDgThdsmQfXt` (reviewer, 03:00 UTC)
for the exact prompts.

### [AGENT] — safe for the next nightly run

- **Process-states portrait BLOCKED→READY arrow lacks an arrowhead near
  the READY box.** In `motion/operativsystemer/process-states.jsx`
  `BlockedBeat` the portrait branch routes the long vertical "I/O: done
  → ready" arrow up the left of the box column; the arrowhead lands just
  shy of READY's left edge but the head can read as small. Either bump
  the head size for this specific arrow (e.g. add a `headSize` prop to
  `ArrowEdge`) or pull `x2/y2` closer to READY's centre-left edge so the
  triangle sits inside READY rather than below it.

- **Semaphore-counter takeaway lacks the visual punch of beats 2-4.**
  `motion/operativsystemer/semaphore-counter.jsx` `TakeawayBeat` is a
  pure text stack — nice rhythm, but it could carry one small icon (a
  mini-counter circle with "1" vs "N" alongside each `sem_init(...)`
  line) without disrupting the layout. Single-file tweak.

- **MLFQ demotion-beat second caption ("B yielded early — interactive,
  keep it high.") is timed to appear at sprite-local 10.4s but the
  beat is only 10.34s long after audio alignment.** It clips by ~0.06s
  which is invisible to a viewer but technically the caption never
  fully fades in. Move its `delay` to 9.6s (still after the main
  caption at 9.4) in `motion/operativsystemer/mlfq-scheduling.jsx`
  `DemotionBeat`. Single-file tweak.

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
