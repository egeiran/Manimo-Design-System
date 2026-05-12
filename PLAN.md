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

- **Phasor-rotation Beat 4 portrait — V₁/V₂ tip labels can collide with the 90° arc when both arrows are near the +Re axis.** In `motion/ade/phasor-rotation.jsx` `PhaseDifferenceBeat`, the V₁ and V₂ glyphs are placed via `tipX + 14·cos(θ)` / `tipY − 14·sin(θ)` so they always sit "outside" the arrow tip. When θ wraps near 0 (rotProg ≈ 1), V₁ overlaps the small "90°" angle text near the origin in portrait. Cheap fix: nudge the tip-label offset to 18-20 px, or center-anchor the 90° text on the arc's outer edge instead of midpoint. Single-file tweak.

### [HUMAN] — needs your input

- **[HUMAN] Dining-philosophers fourConditions beat — portrait labels overlap philosophers.** In `motion/operativsystemer/dining-philosophers.jsx` `FourConditionsBeat`, the portrait branch parks the four Coffman-condition labels at `y=100/120/480/500`, but at portrait geometry P0 sits at `y=100` and P2/P3 sit near `y=462`. The labels overprint the philosopher nodes. Needs a real layout rethink for portrait (e.g. compress the table radius, stack the labels as a list below the table, or relocate to a side column) — not a one-coordinate move. Reviewer flagged on 2026-05-11.

- **[HUMAN] Voltage-divider portrait sweep — R1/R2 numeric labels sit close to the resistor zigzags.** In `motion/ade/voltage-divider.jsx` `SweepBeat` portrait branch, the R1/R2 labels at `G.rightX + G.zigAmp + 18` (= 358) end up ~18 px from the zigzag tips (which extend to ~340 with `zigAmp=20`). Legible but tight; bumping the offset to 28-32 px or relocating the labels to the left of the zigzags would breathe better. Reviewer flagged on 2026-05-11.

- **[HUMAN] Karnaugh-map portrait — function-beat formula wraps awkwardly mid-summation.** In `motion/ade/karnaugh-map.jsx` `FunctionBeat`, the headline `F(A, B, C) = Σ m(2, 3, 4, 5, 6, 7)` wraps after "3," in portrait because the FadeUp container has no explicit max-width and the 36 px serif overflows 720 px. Reads, but breaks on a comma rather than at a logical seam. Either tighten the font size in portrait, or break the line manually before the Σ.

- **[HUMAN] Re-run `npm run publish kirchhoff-voltage-law phasor-rotation karnaugh-map`** once Supabase env vars are available on the nightly sandbox. Tonight's reviewer skipped publish because keys were missing (`.env` not present in the sandbox). PR #18 merged cleanly; the live HTML is already on Pages, only the Supabase `public.scenes` row insert is pending. Reviewer flagged on 2026-05-12.

- **[HUMAN] Pick next ADE topics for the next run if you want priorities.** This run covered: kirchhoff-voltage-law (ch 1), phasor-rotation (ch 4), karnaugh-map (ch 12). The full ADE library now spans ch 1, 2, 4, 6, 12, 13. Strong candidates for next time: Thévenin equivalent collapse (ch 2), RC charging curve in the ADE framing (ch 3), low-pass RC Bode plot (ch 5), inverting op-amp with virtual short (ch 7), BJT load-line (ch 8), two's complement bit flip + add 1 (ch 9), full adder ripple (ch 11), finite state machine glow (ch 14). If you want a specific topic prioritised, reply in chat.

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
