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

**Audio + wiring (CLAUDE.md Hard Rule 10, set 2026-05-15):** every
nightly run **must** generate audio with
`node scripts/generate-audio.js <id> --engine elevenlabs` (never the
auto-chain — Voxtral is retired) and apply timings with
`node scripts/rewire-scene.js <id>`. The rewire helper sets
`SCENE_DURATION = ceil(audioDur + 1.0)` so the video always outlasts
the narration by at least 1 s. The reviewer should reject any PR where
`SCENE_DURATION < ceil(audioDur + 1.0)` for any scene touched, or where
a scene's `audio/<id>/manifest.json` has `engine: "mistral"`.

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

- **integrator-op-amp portrait configuration — diagram parked top-of-canvas leaves big empty band below.** In `motion/ade/integrator-op-amp.jsx` `ConfigurationBeat`, the portrait branch uses `vbW=600, vbH=580` and parks `top: 52%`, so the circuit ends at roughly canvas y=750 and the lower ~530 px sit empty. Either raise the diagram to `top: 44%` and add a labelled note panel below, or grow `vbH` to ~780 and push the caption further down. Reviewer flagged on 2026-05-18; carried forward 2026-05-18 PM and 2026-05-18 PM2 (each nightly focused on three new scenes — pick this up next run before any further new authoring).

- **binary-addition longestPath portrait — four FA blocks compress into a thin horizontal strip on the 720-wide canvas.** In `motion/ade/binary-addition.jsx` `LongestPathBeat`, the portrait branch keeps the chain horizontal (`vbW=600`, four 110-px blocks + 16-px gaps = 488 px) which fits but uses only ~90 px of vertical space, leaving big empty bands above and below. Consider rotating the chain to vertical in portrait (FA0 on top → FA3 on bottom, carry connectors as short vertical lines between) so the diagram fills more of the canvas. Reviewer flagged on 2026-05-18 PM; carried forward 2026-05-18 PM2.

- **rlc-resonance phasors portrait — V_R label crowds the right edge of each phasor box on narrow widths.** In `motion/ade/rlc-resonance.jsx` `PhasorsBeat`, the `V_R` text sits at `x = c + lVR + 6` with the chevron arrowhead just before it. On the 150-px portrait box the label barely fits inside the SvgFadeIn overflow region — at smaller sizes (or if the box ever shrinks) it would spill onto the next column. Add a `maxArm`-style cap to `lVR` too, or shorten the V_R arm by ~6 px in portrait. Reviewer flagged on 2026-05-18 PM; carried forward 2026-05-18 PM2.

### [HUMAN] — needs your input

- **[HUMAN] Dining-philosophers fourConditions beat — portrait labels overlap philosophers.** In `motion/operativsystemer/dining-philosophers.jsx` `FourConditionsBeat`, the portrait branch parks the four Coffman-condition labels at `y=100/120/480/500`, but at portrait geometry P0 sits at `y=100` and P2/P3 sit near `y=462`. The labels overprint the philosopher nodes. Needs a real layout rethink for portrait (e.g. compress the table radius, stack the labels as a list below the table, or relocate to a side column) — not a one-coordinate move. Reviewer flagged on 2026-05-11.

- **[HUMAN] Voltage-divider portrait sweep — R1/R2 numeric labels sit close to the resistor zigzags.** In `motion/ade/voltage-divider.jsx` `SweepBeat` portrait branch, the R1/R2 labels at `G.rightX + G.zigAmp + 18` (= 358) end up ~18 px from the zigzag tips (which extend to ~340 with `zigAmp=20`). Legible but tight; bumping the offset to 28-32 px or relocating the labels to the left of the zigzags would breathe better. Reviewer flagged on 2026-05-11.

- **[HUMAN] Karnaugh-map portrait — function-beat formula wraps awkwardly mid-summation.** In `motion/ade/karnaugh-map.jsx` `FunctionBeat`, the headline `F(A, B, C) = Σ m(2, 3, 4, 5, 6, 7)` wraps after "3," in portrait because the FadeUp container has no explicit max-width and the 36 px serif overflows 720 px. Reads, but breaks on a comma rather than at a logical seam. Either tighten the font size in portrait, or break the line manually before the Σ.

- **[HUMAN] Resolve PR #20's two scene-id collisions with the current manifest.** PR #20 (2026-05-13) is still open with `twos-complement` (ch.9, NOT/+1 + counter sweep) and `full-adder` (ch.11, ripple-carry chain) scenes. Both ids now collide with merged/about-to-merge scenes — `twos-complement` was merged via PR #23 at ch.5, and `full-adder` is being added in the 2026-05-18 PM2 nightly at ch.5 (truth table + cycling walk through all 8 input combinations). PR #20 also references nonexistent chapter numbers (ch.7/9/11 — the real ADE chapter map only goes 1–10). Either close PR #20, or rename its two scenes (e.g. `twos-complement-counter`, `full-adder-ripple-chain`) AND remap their chapters before merging. Reviewer flagged 2026-05-15 (extended 2026-05-18 PM2 for the new full-adder collision).

- **[HUMAN] Re-run `npm run publish all`** once Supabase env vars are available on the nightly sandbox. Two backlogs are pending: (a) the 2026-05-13 chapter-remap that moved 8 of 9 ADE scenes to their corrected `chapter_number` values (specs + manifest already updated); (b) the unpublished new scenes from the last several nightlies — `norton-equivalent non-inverting-op-amp shift-register ohms-law zener-clipper two-to-four-decoder rc-charging cmos-inverter hexadecimal-counting rl-transient integrator-op-amp jk-flip-flop source-transformations rlc-resonance binary-addition diode-iv-curve bjt-current-mirror full-adder`. The 2026-05-18 PM2 nightly added three more ADE scenes (Diode I-V Curve ch.4, BJT Current Mirror ch.6, Full Adder ch.5). Reviewer flagged 2026-05-15 (extended 2026-05-17 PM, 2026-05-18 PM, 2026-05-18 PM-late, 2026-05-18 PM2).

- **KCL `chargesBeat` portrait — `I₁ / 5 A`, `I₂ / 3 A`, `I₃ / 2 A` labels use inconsistent stacking order.** In `motion/ade/kirchhoff-current-law.jsx` `NodeSetupBeat`, the top branch puts the italic `I₁` above the mono `5 A` value (label-first), but both side branches put the value above the label (value-first) because the y-offset arithmetic flips sign when the wire is horizontal. Readable, but not visually consistent. Suggested fix: swap the two y-coords in the I₂ and I₃ `SvgFadeIn` blocks so all three read label-then-value top-to-bottom.

- **[HUMAN] Summing-amplifier portrait/landscape label crowding (two issues, same scene).** In `motion/ade/summing-amplifier.jsx`: (1) `CurrentsBeat` landscape — `i_k = V_k / R_k` formula at `(rInLeftX - 20, rInY[1])` end-anchored ends right where the `V₂` label sits at `(rInLeftX - 14, rInY[1] + 6)`; readable but on the same row. Move formula to `y = rInY[0] - 28` or push it left into its own column. (2) `FormulaBeat` portrait — main `V_out = -R_f · (V_1/R_1 + V_2/R_2 + V_3/R_3)` formula wraps after `(V_1/R_1 +` because the `maxWidth: '20ch'` cap is too tight; add a manual line break before the parenthesis or drop font to 22 px in portrait. Reviewer flagged on 2026-05-17.

- **[HUMAN] binary-addition `WalkBeat` portrait — addition grid sits in upper third of the 1280-tall canvas.** In `motion/ade/binary-addition.jsx` `WalkBeat`, the portrait `vbH=740` SVG centers on the stage but the grid inside it spans roughly `y=115` (carry row) to `y=415` (Σ row), so the whole grid lives in the SVG's upper half and ends up visually high in the canvas with a large empty band below. Either drop `G.top` from 130 → 60 in portrait so the grid hugs the top edge of the SVG (and the SVG centers properly), or shrink `vbH` to match the actual content height (~340) so centering pulls the grid down to mid-canvas. Reviewer flagged on 2026-05-18 PM-late.

- **ADE chapter map** (Supabase `public.chapters` for `subject_id='ade'`, 10 chapters as of 2026-05-13): ch.1 Kretsteori, ch.2 Energi og effekt, ch.3 Superposisjon og Thévenin, ch.4 Dioder, ch.5 Digital elektronikk, ch.6 Transistorer, ch.7 Minne og register, ch.8 Reaktive elementer, ch.9 Operasjonsforsterker, ch.10 Digital design. Current scene coverage (after the 2026-05-18 PM2 run): ch.1 (KVL, voltage-divider, KCL, ohms-law), ch.2 (capacitor-energy, inductor-energy, max-power-transfer, joule-heating), ch.3 (Thévenin, Norton, superposition, source-transformations), ch.4 (half-wave-rectifier, full-wave-bridge-rectifier, zener-clipper, **diode-iv-curve** — added tonight), ch.5 (NAND universality, two's-complement, hexadecimal-counting, binary-addition, **full-adder** — added tonight), ch.6 (mosfet-switch, bjt-load-line, cmos-inverter, **bjt-current-mirror** — added tonight), ch.7 (D flip-flop, shift-register, SR latch, jk-flip-flop), ch.8 (phasor-rotation, low-pass-bode, rc-charging, rl-transient, rlc-resonance), ch.9 (inverting op-amp, non-inverting op-amp, summing-amplifier, integrator-op-amp), ch.10 (K-map, FSM, multiplexer-4-to-1, 2-to-4 decoder). Most under-served chapters now: ch.1 (4 scenes — candidates: mesh / nodal analysis, dependent sources), ch.10 (4 scenes — candidates: ripple-carry adder block diagram, 8-to-3 priority encoder, demultiplexer). Other strong follow-ups: T flip-flop (ch.7), AC impedance triangle (ch.8), photodiode / Schottky (ch.4), CMOS NAND/NOR (ch.6), ASCII / character codes (ch.5).

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
