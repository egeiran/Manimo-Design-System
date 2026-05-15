# Manimo — Plan

Forward-looking plan and the rolling nightly-agent queue. Completed work
lives in git history, not here.

---

## Nightly agent queue

Single rolling section. The nightly agent processes [AGENT] items, removes
them from this list when done (git history is the audit trail), and appends
new items found during the run. Items tagged [HUMAN] are skipped by the agent
and require your input. Total queue size is kept ≤ 12 items.

**Current defaults (set 2026-05-13):** the nightly authoring agent
fills **one ADE chapter at a time**, sourcing topics from `uploads/ade/`
(TTT4203 — Innføring i analog og digital elektronikk). Both halves of
the course are in scope — analog (circuit theory, diodes, op-amps,
transistors) and digital (Boolean algebra, combinational logic,
flip-flops, FSMs). The reviewer **merges by default** unless the PR is
genuinely broken (page crash, render failure, missing file, build
error); quality concerns are logged back into this queue as [HUMAN]
items rather than blocking the merge. The reviewer also **publishes
each merged scene to Supabase** via `npm run publish <id>`. See
`trig_01W4V9M7fWvGN7J989JBeQsh` (author, midnight UTC) and
`trig_01QXiioNfPwJnDgThdsmQfXt` (reviewer, 03:00 UTC) for the exact
prompts.

### How the author picks a chapter (and how scenes get attached)

The canonical chapter list for `subject_id="ade"` lives in
kort-forklart's `public.chapters` table in Supabase — **not** in this
repo. Do not hard-code a chapter list anywhere; query Supabase at the
start of every run.

1. Run `npm run coverage ade` (alias for `node scripts/chapter-coverage.js
   ade`) before picking topics. It prints every chapter Supabase knows
   about, how many scenes each one already has (both published rows and
   local-only manifest entries), and which chapter is most
   under-served.
2. Pick the focus chapter for the run — usually the most under-served
   one. Override only when the next-most-empty chapter is clearly a
   better topic fit for what's in `uploads/ade/`, or when "most empty"
   is a chapter that needs fewer scenes anyway (some chapters need
   more videos than others; let the chapter title and exam-PDF weight
   guide you).
3. Generate scenes for **all** missing topics in that chapter. The
   target is "this chapter feels complete to a student," not a fixed
   count — small chapters might be done in 2 scenes, large ones might
   want 5–6. Cap a single run at 6 scenes to keep PRs reviewable; if
   more are needed, leave a [AGENT] queue item for the next run.
4. When writing each scene's spec, set `chapter_number` to the
   Supabase chapter whose title and topics actually match the scene —
   **never invent a chapter number**. If no chapter is a clean fit,
   that's a signal to either reshape the scene topic or surface a
   [HUMAN] item asking whether `public.chapters` needs a new row.
5. If `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` are missing from
   `.env`, `chapter-coverage.js` falls back to local-manifest counts
   without titles — better than nothing, but log a [HUMAN] item asking
   for the keys so the next run gets the real chapter list.

### Audit-and-backfill (run before generating new scenes)

`chapter-coverage.js` also prints two backfill sections when Supabase
is reachable:

- **Unattached scenes** — rows in `public.scenes` where
  `chapter_number IS NULL`. This is usually the result of the
  `scenes_chapter_fk` composite FK nulling the link because the
  `(subject_id, chapter_number)` row was missing from
  `public.chapters` at publish time. If the local manifest already has
  the right chapter, seed the missing chapter row in Supabase
  (`[HUMAN]` item) and re-publish; otherwise pick the best-fitting
  chapter, update the spec + manifest, and re-publish.
- **Mismatches** — scenes where the manifest and Supabase disagree on
  `chapter_number`. Resolve by aligning the spec/manifest to the right
  chapter (the one whose Supabase title actually matches the topic),
  then `npm run publish <id>` to overwrite the remote row.

Every scene in `public.scenes` should end up with a non-null
`chapter_number` pointing at an existing chapter row — fix any
backfill item before generating new content. If the right chapter
doesn't exist in `public.chapters`, that's a [HUMAN] item; don't
invent a chapter number to make the FK happy.

### [AGENT] — safe for the next nightly run

- **Norton-equivalent `loadCurrent` portrait — charge dots barely distinguishable from R_L zigzag.** In `motion/ade/norton-equivalent.jsx` `LoadCurrentBeat`, both R_N and R_L dot streams use `var(--rose-300)` over a `var(--rose-400)` zigzag, so the dots blend into the resistor strokes in still frames. Either switch the dots to `var(--amber-300)` for higher contrast or offset them by ~14 px so they sit between the zig peaks rather than on the centre column.

- **Shift-register `structure` portrait — D_in label clipped at left edge.** In `motion/ade/shift-register.jsx` `StructureBeat`, the portrait branch parks the `D_in` label at `G.dInLabelX = 22`, which puts the subscript "in" right at the SVG left edge. Bump `dInLabelX` to 30-35 (and adjust the wire-trace endpoint to match) so the label has a tiny breathing margin.

### [HUMAN] — needs your input

- **[HUMAN] Dining-philosophers fourConditions beat — portrait labels overlap philosophers.** In `motion/operativsystemer/dining-philosophers.jsx` `FourConditionsBeat`, the portrait branch parks the four Coffman-condition labels at `y=100/120/480/500`, but at portrait geometry P0 sits at `y=100` and P2/P3 sit near `y=462`. The labels overprint the philosopher nodes. Needs a real layout rethink for portrait (e.g. compress the table radius, stack the labels as a list below the table, or relocate to a side column) — not a one-coordinate move. Reviewer flagged on 2026-05-11.

- **[HUMAN] Voltage-divider portrait sweep — R1/R2 numeric labels sit close to the resistor zigzags.** In `motion/ade/voltage-divider.jsx` `SweepBeat` portrait branch, the R1/R2 labels at `G.rightX + G.zigAmp + 18` (= 358) end up ~18 px from the zigzag tips (which extend to ~340 with `zigAmp=20`). Legible but tight; bumping the offset to 28-32 px or relocating the labels to the left of the zigzags would breathe better. Reviewer flagged on 2026-05-11.

- **[HUMAN] Karnaugh-map portrait — function-beat formula wraps awkwardly mid-summation.** In `motion/ade/karnaugh-map.jsx` `FunctionBeat`, the headline `F(A, B, C) = Σ m(2, 3, 4, 5, 6, 7)` wraps after "3," in portrait because the FadeUp container has no explicit max-width and the 36 px serif overflows 720 px. Reads, but breaks on a comma rather than at a logical seam. Either tighten the font size in portrait, or break the line manually before the Σ.

- **[HUMAN] Re-run `npm run publish all`** to push the remapped `chapter_number` values to Supabase. The 2026-05-13 audit moved 8 of 9 ADE scenes to the chapters that match the real `public.chapters` titles (see table below); specs and manifest are already updated, only the Supabase `public.scenes` row updates are pending.

- **[HUMAN] Resolve the `twos-complement` scene-id collision between PR #23 (today, ch.5, sweep + addition) and PR #20 (2026-05-13, ch.9, NOT/+1 + counter sweep).** PR #23 already merged its variant under the corrected ch.5 (Digital elektronikk) mapping; PR #20 is still open with the same id pinned to the older ch.9 mapping. Either close PR #20, or rename PR #20's scene (e.g. `twos-complement-counter`) before merging it so the two scenes can coexist. Reviewer flagged on 2026-05-15.

- **[HUMAN] PR #20's `full-adder` scene conflicts with the next-night candidate.** PR #20 (still open) introduces a `full-adder` scene at `chapter_number: 11`; PLAN's current chapter map points full-adder to ch.10 (Digital design). Once PR #20 is resolved, full-adder/ripple-carry remains a strong ch.10 follow-up for a future run.

- **[HUMAN] KCL `chargesBeat` portrait — `I₁ / 5 A`, `I₂ / 3 A`, `I₃ / 2 A` labels use inconsistent stacking order.** In `motion/ade/kirchhoff-current-law.jsx` `NodeSetupBeat`, the top branch puts the italic `I₁` above the mono `5 A` value (label-first), but both side branches put the value above the label (value-first) because the y-offset arithmetic flips sign when the wire is horizontal. Readable, but not visually consistent. Suggested fix: swap the two y-coords in the I₂ and I₃ `SvgFadeIn` blocks so all three read label-then-value top-to-bottom.

- **ADE chapter map** (Supabase `public.chapters` for `subject_id='ade'`, 10 chapters as of 2026-05-13): ch.1 Kretsteori, ch.2 Energi og effekt, ch.3 Superposisjon og Thévenin, ch.4 Dioder, ch.5 Digital elektronikk, ch.6 Transistorer, ch.7 Minne og register, ch.8 Reaktive elementer, ch.9 Operasjonsforsterker, ch.10 Digital design. Current scene coverage (after the 2026-05-15 v2 run): ch.1 (KVL, voltage-divider, KCL), ch.2 (capacitor-energy), ch.3 (Thévenin, Norton — added 2026-05-15 v2), ch.4 (half-wave-rectifier, full-wave-bridge-rectifier), ch.5 (NAND universality, two's-complement), ch.6 (mosfet-switch, bjt-load-line), ch.7 (D flip-flop, shift-register — added 2026-05-15 v2), ch.8 (phasor-rotation, low-pass-bode), ch.9 (inverting op-amp, non-inverting op-amp — added 2026-05-15 v2), ch.10 (K-map, FSM, multiplexer-4-to-1). Most under-served chapters now: ch.2 Energi og effekt (1 scene — candidates: inductor energy, max power transfer), ch.3 (2 scenes — candidate: superposition), ch.7 (2 scenes — candidates: SR latch, JK flip-flop, ring counter), ch.9 (2 scenes — candidates: summing amp, integrator/differentiator, comparator). Other strong follow-ups: full adder / ripple carry (ch.10 — pending PR #20 resolution), 2-to-4 decoder (ch.10 — pair with MUX), RC charging in the ADE namespace (ch.8 reactive), CMOS inverter (ch.6 deepening).

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
