# Manimo — Plan

Forward-looking plan and the rolling nightly-agent queue. Completed work
lives in git history, not here.

---

## Nightly agent queue

Single rolling section. The nightly agent processes [AGENT] items, removes
them from this list when done (git history is the audit trail), and appends
new items found during the run. Items tagged [HUMAN] are skipped by the agent
and require your input. Total queue size is kept ≤ 12 items.

**Current defaults (set 2026-05-11):** the nightly authoring agent
now ships **ADE scenes** per run (three by default), sourcing topics
from `uploads/ade/` (TTT4203 — Innføring i analog og digital
elektronikk). Both halves of the course are in scope — analog (circuit
theory, diodes, op-amps, transistors) and digital (Boolean algebra,
combinational logic, flip-flops, FSMs). The reviewer **merges by
default** unless the PR is genuinely broken (page crash, render
failure, missing file, build error); quality concerns are logged back
into this queue as [HUMAN] items rather than blocking the merge. The
reviewer also **publishes each merged scene to Supabase** via
`npm run publish <id>`. See `trig_01W4V9M7fWvGN7J989JBeQsh` (author,
midnight UTC) and `trig_01QXiioNfPwJnDgThdsmQfXt` (reviewer, 03:00 UTC)
for the exact prompts.

### [AGENT] — safe for the next nightly run

- **Half-wave-rectifier panel captions show `V_in` literal instead of
  V<sub>in</sub>.** In `motion/ade/half-wave-rectifier.jsx`
  `StatesBeat`, the two panel captions pass plain strings ("V_in > 0
  — diode conducts" / "V_in < 0 — diode blocks") to the `caption` prop
  of `Panel`. The underscore reads as a literal because the prop is
  rendered as text, not JSX. Either accept JSX as the caption
  (`caption={<>V<sub>in</sub> &gt; 0 — diode conducts</>}`) or use
  unicode subscript characters ("Vᵢₙ > 0 — diode conducts"). Single-file
  tweak.

### [HUMAN] — needs your input

- **[HUMAN] Dining-philosophers fourConditions beat — portrait labels overlap philosophers.** In `motion/operativsystemer/dining-philosophers.jsx` `FourConditionsBeat`, the portrait branch parks the four Coffman-condition labels at `y=100/120/480/500`, but at portrait geometry P0 sits at `y=100` and P2/P3 sit near `y=462`. The labels overprint the philosopher nodes. Needs a real layout rethink for portrait (e.g. compress the table radius, stack the labels as a list below the table, or relocate to a side column) — not a one-coordinate move. Reviewer flagged on 2026-05-11.

- **[HUMAN] Pick next ADE topics for tonight's run if you want priorities.** Tonight covered: voltage-divider (chapter 2), half-wave-rectifier (chapter 6), d-flip-flop (chapter 13). Strong candidates for next time: Kirchhoff's voltage law walking around a mesh (ch 1), Thévenin equivalent collapse (ch 2), RC charging curve in the ADE context (ch 3 — note `rc-circuit` exists under fysikk but the analog-electronics framing is different), inverting op-amp + virtual short (ch 7), two's complement bit flip + add 1 (ch 9), K-map grouping (ch 12). If you want a specific topic prioritised, reply in chat — otherwise the author picks based on coverage gaps.

- **Subject focus is now Innføring i analog og digital elektronikk (TTT4203).** Fysikk and Operativsystemer topics are paused — the nightly author picks three ADE topics per run from `uploads/ade/`. To reopen fysikk or OS later, edit the author trigger (`trig_01W4V9M7fWvGN7J989JBeQsh`) and swap the `uploads/...` source pointer + chapter list back.

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
