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

- **Next Mat2B run — remaining genuine-motion gaps (verified against Nøkkelbegrep wiki + Plenum 5/6 on 2026-05-24 PM).** ch.4 numerical follow-ups still open: trapezoidal / Crank–Nicolson as a distinct *implicit RK2* (the 2026-05-24 PM run did backward Euler only), Butcher-tableau notation + explicit-vs-implicit reading (Plenum 5 oppg. 1b/2b), and local-vs-global truncation error / order via Taylor (Plenum 5 oppg. 3 — distinct from `euler-vs-rk4`'s log-log plot). Most under-served chapters by count are ch.1 and ch.5 (7 each): for ch.5 the standout remaining motion-topic is implicit-differentiation on a level curve (dy/dx = −f_x/f_y, distinct from `gradient-and-level-curves`), then vector-functions / parametrised-curve-tangent.

- **binary-addition longestPath portrait — four FA blocks compress into a thin horizontal strip on the 720-wide canvas.** In `motion/ade/binary-addition.jsx` `LongestPathBeat`, the portrait branch keeps the chain horizontal (`vbW=600`, four 110-px blocks + 16-px gaps = 488 px) which fits but uses only ~90 px of vertical space, leaving big empty bands above and below. Consider rotating the chain to vertical in portrait (FA0 on top → FA3 on bottom, carry connectors as short vertical lines between) so the diagram fills more of the canvas. Reviewer flagged on 2026-05-18 PM; carried forward 2026-05-18 PM2, 2026-05-20, 2026-05-21, 2026-05-21 PM.

- **rlc-resonance phasors portrait — V_R label crowds the right edge of each phasor box on narrow widths.** In `motion/ade/rlc-resonance.jsx` `PhasorsBeat`, the `V_R` text sits at `x = c + lVR + 6` with the chevron arrowhead just before it. On the 150-px portrait box the label barely fits inside the SvgFadeIn overflow region — at smaller sizes (or if the box ever shrinks) it would spill onto the next column. Add a `maxArm`-style cap to `lVR` too, or shorten the V_R arm by ~6 px in portrait. Reviewer flagged on 2026-05-18 PM; carried forward 2026-05-18 PM2, 2026-05-20, 2026-05-21, 2026-05-21 PM.

- **op-amp-comparator transferCurve — `+V_sat` axis label overlaps the upper teal step segment in portrait.** In `motion/ade/op-amp-comparator.jsx` `TransferCurveBeat`, the portrait branch puts the `+V_sat` axis tick label at `(axMid - 12, ay1 + 24)` end-anchored, which lands inside the box right where the upper horizontal step (teal, `y = ay1 + 20`) begins. Readable but cluttered. Fix: push the `+V_sat` label up to `ay1 - 4` (above the tick) in portrait, or offset its x further left so it clears the step's starting x. Reviewer flagged 2026-05-20 (second run); carried forward 2026-05-21, 2026-05-21 PM.

- **power-triangle decompose — `I cos φ` label sits right on top of the φ-arc label inside the wedge.** In `motion/ade/power-triangle.jsx` `DecomposeBeat`, the in-phase teal vector label `I cos φ` is centred at `(projXOnV / 2 + G.origX / 2, G.origY - 12)`, and the φ-arc label sits at `(G.origX + arcR * 0.72, G.origY - arcR * 0.05)`. With `arcR = 50` and the I-projection ending around x = origX + 105, the two text glyphs are within ~25 px of each other and overlap in landscape. Fix: anchor `I cos φ` further to the right of midpoint (e.g. `projXOnV - 6, G.origY - 12` end-anchored), or push it BELOW the +x axis (`G.origY + 18`) since the wedge above has the φ glyph. Carried forward 2026-05-21, 2026-05-21 PM.

### [HUMAN] — needs your input

- **[HUMAN] Dining-philosophers fourConditions beat — portrait labels overlap philosophers.** In `motion/operativsystemer/dining-philosophers.jsx` `FourConditionsBeat`, the portrait branch parks the four Coffman-condition labels at `y=100/120/480/500`, but at portrait geometry P0 sits at `y=100` and P2/P3 sit near `y=462`. The labels overprint the philosopher nodes. Needs a real layout rethink for portrait (e.g. compress the table radius, stack the labels as a list below the table, or relocate to a side column) — not a one-coordinate move. Reviewer flagged on 2026-05-11.

- **[HUMAN] Summing-amplifier portrait/landscape label crowding (two issues, same scene).** In `motion/ade/summing-amplifier.jsx`: (1) `CurrentsBeat` landscape — `i_k = V_k / R_k` formula at `(rInLeftX - 20, rInY[1])` end-anchored ends right where the `V₂` label sits at `(rInLeftX - 14, rInY[1] + 6)`; readable but on the same row. Move formula to `y = rInY[0] - 28` or push it left into its own column. (2) `FormulaBeat` portrait — main `V_out = -R_f · (V_1/R_1 + V_2/R_2 + V_3/R_3)` formula wraps after `(V_1/R_1 +` because the `maxWidth: '20ch'` cap is too tight; add a manual line break before the parenthesis or drop font to 22 px in portrait. Reviewer flagged on 2026-05-17.

- **[HUMAN] binary-addition `WalkBeat` portrait — addition grid sits in upper third of the 1280-tall canvas.** In `motion/ade/binary-addition.jsx` `WalkBeat`, the portrait `vbH=740` SVG centers on the stage but the grid inside it spans roughly `y=115` (carry row) to `y=415` (Σ row), so the whole grid lives in the SVG's upper half and ends up visually high in the canvas with a large empty band below. Either drop `G.top` from 130 → 60 in portrait so the grid hugs the top edge of the SVG (and the SVG centers properly), or shrink `vbH` to match the actual content height (~340) so centering pulls the grid down to mid-canvas. Reviewer flagged on 2026-05-18 PM-late.

- **[HUMAN] demultiplexer-1-to-4 `SchematicBeat` landscape — caption crowds under the S₁/S₀ value labels.** In `motion/ade/demultiplexer-1-to-4.jsx` `SchematicBeat` landscape, the bottom caption at `G.captionY = 440` sits only ~14 px below the `S₁`/`S₀` italic labels at `G.s1Y + 16 = 426`, so the caption's first words run into the `S₀` subscript glyph. Either bump `captionY` to ~470 (still inside `vbH=460` with `overflow:'visible'`) or drop the label `+16` offset to `+12` so the gap to the caption opens up. Reviewer flagged on 2026-05-20.

- **[HUMAN] op-amp-comparator `RampToSquareBeat` portrait — V_out / +V_sat / −V_sat labels stack tightly to the right of the bottom scope.** In `motion/ade/op-amp-comparator.jsx` `RampToSquareBeat` portrait, `+V_sat` at `(scopeR+8, botY0-6)`, `V_out` at `(scopeR+8, botY0+14)`, and `−V_sat` at `(scopeR+8, botY1+16)` line up in one column with only ~20 px between adjacent labels — readable but a dense stack. Push `+V_sat` up to ~`botY0 - 18` and `−V_sat` down to ~`botY1 + 24` so `V_out` has breathing room above and below. Reviewer flagged on 2026-05-20.

- **[HUMAN] power-triangle decompose-beat phasor convention mismatch — I drawn UP-right but narration says current lags voltage.** In `motion/ade/power-triangle.jsx` `DecomposeBeat`, the I phasor is plotted at `(cos(-PHI), sin(-PHI))` which in SVG y-down screen coords lands ABOVE the +x axis (upper half). But beat 2 `WaveformBeat` shows I(t) = sin(2π·CYCLES·u − PHI), i.e. current peaks AFTER voltage peaks (lagging). The conventional phasor picture for a lagging current sits BELOW the +x axis. The author defensibly drew it above so that the I-sin-φ leg is positive-up and visually matches the power triangle in beat 4 (where Q is drawn up). Two consistent options: (a) flip I to point down-right in beat 3 (reverse sign of sin term and re-anchor the violet "I sin φ" label below the axis), or (b) add a small "(complex-power convention: Q drawn upward)" note under the wedge so the student isn't confused. Reviewer flagged on 2026-05-20 third run.

- **[HUMAN] diode-clamper schematic — diagram fills only the centre band; lots of empty canvas above and below in both aspects.** In `motion/ade/diode-clamper.jsx` `SchematicBeat`, the SVG viewBox is `1100×420` landscape / `600×580` portrait, but the schematic itself (AC source → cap → output node → diode → ground, output tap up) only occupies a narrow horizontal strip in landscape (`srcY=220`, `gndY=370`) and a similar central band in portrait. Compared to `chargingCycleBeat` which fills the canvas with a live readout panel, the schematic feels visually thin during the 11-second narration. Either (a) add a "circuit at a glance" readout panel below the schematic that previews V_in / V_out roles (matching the chargingCycle pattern), or (b) grow the diagram geometry (bigger source/cap/diode symbols, longer wires, wider tap) so the schematic fills more of the canvas. Reviewer flagged on 2026-05-20 third run.

- **[HUMAN] subspace-test `LinePassBeat` — live `c = …` readout crowds the origin `0` glyph when c passes through zero.** In `motion/mat2b/subspace-test.jsx` `LinePassBeat`, the scalar scrub rose dot reads `c = {cValue.toFixed(2)}` at `(cPt.sx ± 14, cPt.sy ± 18)` with anchor flipping by sign. As `c` sweeps from -2 → 2 it passes through ~0 around localTime ≈ 7.25 s, where the cPt is right at the origin and the readout text lands within ~20 px of the chalk "0" axis label at `(origin.sx - 10, origin.sy + 22)`. Readable but momentarily cluttered. Fix: fade the readout when `|cValue| < 0.25`, or push the readout to a fixed position above the line (e.g. anchored to the right of the SoftPanel) instead of tracking the dot. Author already flagged this in the PR description; reviewer confirms on 2026-05-20.

- **[HUMAN] linear-combination-recipe `SweepABeat` landscape — amber trail extends ~70 px behind the right SoftPanel at a = +2.** In `motion/mat2b/linear-combination-recipe.jsx` `SweepABeat` landscape, the trail of P = a·v₁ for a ∈ [-2, 2] reaches canvas x ≈ 932 at the right end (V1=[2.6, 0.4], unit=56, ox=380 → svg sx=672, plus SVG container offset → canvas x≈932). The SoftPanel sits at `right: 60, width: 360` → its left edge is at canvas x = 860, so the rightmost ~72 px of the trail tail is dimmed under the 55%-opaque panel. Two clean fixes: (a) shrink the sweep range to `aMin = -1.6, aMax = 1.6` so the trail stops at canvas x ≈ 880 (just clear of the panel edge), or (b) clip the trail path to `x < 850` via a stroke-mask. The motion still reads — the dot is visible mid-sweep — but the line-span point lands behind the panel at the extremes. Reviewer flagged on 2026-05-20 Mat2B run.

- **[HUMAN] basis-uniqueness `SweepBeat` landscape — trial dot wanders behind the right SoftPanel at KFS[4] = (2.3, 0.5).** In `motion/mat2b/basis-uniqueness.jsx` `SweepBeat` landscape, the trial point P = a·b₁ + b·b₂ with B1=(2.0, 0.6), B2=(-0.4, 1.8) reaches P ≈ (4.4, 2.28) at the second-to-last keyframe, which lands at canvas x ≈ 886 — just past the SoftPanel's left edge at x ≈ 864 (panel sits `right: 56, width: 360`). The rose dot disappears under the 55 %-opaque panel for ~1.5 s before snapping back out at the final (1.6, 1.0) = v position. The snap to v reads clearly, so the math intent survives — but the intermediate "almost there, no — there!" moment is muted. Fix options: (a) tighten the KFS extremum from (2.3, 0.5) to ~(2.0, 0.7) so the trial peaks at canvas x ≈ 858 (just clear), or (b) shrink the SoftPanel width from 360 → 280 in landscape, or (c) clip the trial-point rendering to canvas x < 850 via a stroke-mask. Reviewer flagged on 2026-05-22.

- **[HUMAN] characteristic-roots-regimes `DiscriminantBeat` portrait — middle row "Δ = 0 → critically damped" wraps to two lines while the other two cases fit on one.** In `motion/mat2b/characteristic-roots-regimes.jsx` `DiscriminantBeat`, the three case rows use `display:flex, flexWrap:'wrap', justifyContent:'flex-start'` in portrait. The middle row's text ("one repeated real root → critically damped") is slightly longer than the other two, so its `→ critically damped` italic span breaks onto its own second line at fontSize 14. Visually the three rows are now mis-aligned (two single-line rows bracket one two-line row). Fix options: (a) drop the middle row's caption to "one repeated root" so all three rows are similar length, or (b) reduce portrait fontSize from 14 → 13 px, or (c) restructure the row to a fixed two-column grid so wrapping is symmetric. Reviewer flagged on 2026-05-22 PM.

- **[HUMAN] rotation-matrix-family `AngleAdditionBeat` landscape — step badge at `left:60, top:220` overlaps the rotating square's left vertex.** In `motion/mat2b/rotation-matrix-family.jsx` `AngleAdditionBeat`, the step/θ readout badge sits at landscape position `{ left: 60, top: 220, width: 320 }`, so its right edge is at canvas x≈380. The plane is at `left:100, top:90` with `unit=130`, so at θ=75° the rotated unit-square's far-left corner (-sin75°, cos75°) ≈ (-0.97, 0.26) lands at canvas x≈100+300+(-0.97)*130 ≈ 274 and the teal e₂ arrow tip reaches roughly the same range — both pass behind the 55%-opaque badge during the 30°→75° morph (~beat-fraction 0.36–0.60). The badge background dims but doesn't hide them, so the choreography reads, but the eye loses the "left column rotating" half of the story for ~3 s. Fix options: (a) move the badge to `{ right: 60, top: 540, width: 320 }` (below the plane, far right), (b) shrink badge width from 320 → 220 so it ends at canvas x≈280 (clears the rotating corner), or (c) move the formula reveal earlier (drop `formulaShow` threshold from `f > 0.65` to `f > 0.50`) so the badge slides off-screen sooner. Reviewer flagged on 2026-05-23 PM.

- **[HUMAN] cauchy-schwarz-inequality `AngleSweepBeat` — chart bound labels `+‖u‖‖v‖` / `−‖u‖‖v‖` sit on top of the rose dashed bound lines.** In `motion/mat2b/cauchy-schwarz-inequality.jsx` `AngleSweepBeat`, the labels are positioned at `y={yForDot(ceiling) - 6}` (upper) and `y={yForDot(-ceiling) + 14}` (lower) — only ~6–14 px clear of the dashed `+‖u‖‖v‖` / `−‖u‖‖v‖` lines they annotate. The double-bar glyphs visually fuse with the dash pattern in both landscape and portrait. Fix: bump the offsets to ~14 px (e.g. `yForDot(ceiling) - 14` and `yForDot(-ceiling) + 24`) so the labels float a clear margin above/below the bound lines. Reviewer flagged on 2026-05-23 evening.

- **[HUMAN] cauchy-schwarz-inequality `TakeawayBeat` portrait — formula `−1 ≤ cos θ = (u·v) / (‖u‖·‖v‖) ≤ 1` breaks awkwardly across two lines.** In `motion/mat2b/cauchy-schwarz-inequality.jsx` `TakeawayBeat`, the portrait `fontSize: 30` plus the default `maxWidth: 600` causes the formula to wrap after `(u · v) / (‖u‖ ·` so the closing `‖v‖) ≤ 1` lives on a second line by itself. Readable but ugly. Fix: drop portrait fontSize from 30 → 24, or add a manual `<br/>` before `(u · v)` so the wrap is intentional and centered. Reviewer flagged on 2026-05-23 evening.

- **[HUMAN] qr-factorisation-via-gram-schmidt `MatrixRBeat` portrait — Q and R stacked without an operator between them.** In `motion/mat2b/qr-factorisation-via-gram-schmidt.jsx` `MatrixRBeat`, the portrait `flexDirection: 'column'` stacks the matrices vertically with a single `=` between A and Q, but Q and R appear back-to-back without any visible multiplication symbol. The student reads A = Q, then a separate R block, instead of A = Q · R. Landscape works because the row layout reads naturally left-to-right as juxtaposition = multiplication. Fix: insert a `·` (or a thin row that says "times") between the Q and R FadeUps, but only when `portrait === true`, so the landscape juxtaposition stays clean. Reviewer flagged on 2026-05-23 evening.

- **[HUMAN] Re-run `npm run publish all`** once Supabase env vars are wired into the nightly sandbox. Two cumulative backlogs are pending: (a) the 2026-05-13 chapter-remap that moved 8 of 9 ADE scenes to their corrected `chapter_number` values (specs + manifest updated locally, not yet pushed to Supabase) plus the earlier `basis-change-grid` ch.1→ch.2 fix that reconciles the local/remote mismatch flagged by `npm run coverage mat2b`; (b) every nightly-added scene that has not been published yet — including all ADE additions through 2026-05-21 PM and all Mat2B additions through 2026-05-23 evening (chapter-3 Indreproduktrom: `cauchy-schwarz-inequality`, `qr-factorisation-via-gram-schmidt`, `angle-preservation-by-rotation`; chapter-2 Lineærtransformasjoner: `gaussian-elimination-2d`, `matrix-product-as-composition`, `rotation-matrix-family`; chapter-4 Differensialligninger: `separable-variables-circles`, `newtons-law-of-cooling`, `characteristic-roots-regimes`; chapter-5/6: `quadratic-taylor-approximation`, `partial-derivative-as-slice`, `clairaut-mixed-partials`; chapter-1 Vektorrom: `basis-uniqueness`, `null-space-as-line`, `polynomial-vectors`; chapter-6 Ekstremalpunkter: `gradient-descent-on-contours`, `extrema-on-a-circle`, `the-saddle-point`; chapter-4 Differensialligninger (numerical methods, added 2026-05-24 PM): `heun-improved-euler`, `explicit-vs-implicit-euler`, `numerical-orbit-energy-drift`). The new entries are in `motion/scene-manifest.json` with correct `subject_id` + `chapter_number` but no `public.scenes` row yet. Originally flagged 2026-05-15, extended through 2026-05-24 PM. (Supabase remained unreachable this run — `npm run coverage mat2b` fell back to the local manifest.)

- **ADE chapter map** (Supabase `public.chapters` for `subject_id='ade'`, 10 chapters as of 2026-05-13): ch.1 Kretsteori, ch.2 Energi og effekt, ch.3 Superposisjon og Thévenin, ch.4 Dioder, ch.5 Digital elektronikk, ch.6 Transistorer, ch.7 Minne og register, ch.8 Reaktive elementer, ch.9 Operasjonsforsterker, ch.10 Digital design. Current scene coverage (after the 2026-05-21 PM run): ch.1 (KVL, voltage-divider, KCL, ohms-law, current-divider — 5), ch.2 (capacitor-energy, inductor-energy, max-power-transfer, joule-heating, power-triangle — 5), ch.3 (Thévenin, Norton, superposition, source-transformations, wheatstone-bridge — 5), ch.4 (half-wave-rectifier, full-wave-bridge-rectifier, zener-clipper, diode-iv-curve, diode-clamper, **voltage-doubler** — added tonight — 6), ch.5 (NAND universality, two's-complement, hexadecimal-counting, binary-addition, full-adder — 5), ch.6 (mosfet-switch, bjt-load-line, cmos-inverter, bjt-current-mirror, emitter-follower, **mosfet-transfer-characteristic** — added tonight — 6), ch.7 (D flip-flop, shift-register, SR latch, jk-flip-flop, ripple-counter, t-flip-flop — 6), ch.8 (phasor-rotation, low-pass-bode, rc-charging, rl-transient, rlc-resonance, high-pass-bode, **ac-impedance-triangle** — added tonight — 7), ch.9 (inverting op-amp, non-inverting op-amp, summing-amplifier, integrator-op-amp, op-amp-comparator, schmitt-trigger — 6), ch.10 (K-map, FSM, multiplexer-4-to-1, 2-to-4 decoder, demultiplexer-1-to-4, priority-encoder — 6). Most under-served now: ch.1, ch.2, ch.3, ch.5 (tied at 5). Strongest follow-ups: mesh/nodal analysis (ch.1), AC power-factor correction or apparent-vs-real-power distinct from the existing power-triangle (ch.2), Millman's theorem or delta-Y conversion (ch.3), BCD/seven-segment decoder (ch.5), Schottky diode I-V (ch.4 if more wanted), JFET as an alternative transistor topic (ch.6), 555-timer architecture (ch.10 or new chapter).

- **Mat2B chapter map** (Supabase `public.chapters` for `subject_id='mat2b'`, 6 chapters): ch.1 Vektorrom, ch.2 Lineærtransformasjoner, ch.3 Indreproduktrom, ch.4 Differensialligninger, ch.5 Funksjoner og derivasjon, ch.6 Ekstremalpunkter. Coverage after 2026-05-23 evening nightly: ch.1 (span-and-dependence, dimension-intuition, subspace-test, linear-combination-recipe, basis-uniqueness, null-space-as-line, polynomial-vectors — 7), ch.2 (rank-nullity-visual, change-of-basis-matrix, basis-change-grid, matrix-as-function, linear-transformation-grid, determinant-as-area, gaussian-elimination-2d, matrix-product-as-composition, rotation-matrix-family — 9), ch.3 (projection-onto-line, best-approximation, gram-schmidt-2d-then-3d, inner-product-geometry, orthogonal-complement, least-squares-normal-equations, **cauchy-schwarz-inequality**, **qr-factorisation-via-gram-schmidt**, **angle-preservation-by-rotation** — added tonight — 9), ch.4 (euler-step, euler-vs-rk4, second-order-to-system, diagonalisation-eigenaxes, phase-portrait-2x2, separable-variables-circles, newtons-law-of-cooling, characteristic-roots-regimes, **heun-improved-euler**, **explicit-vs-implicit-euler**, **numerical-orbit-energy-drift** — added 2026-05-24 PM numerical run — 11), ch.5 (gradient-and-level-curves, directional-derivative, tangent-plane-linearisation, multivariable-limit-paths, chain-rule-on-path, partial-derivative-as-slice, clairaut-mixed-partials — 7), ch.6 (global-extrema-triangle, hesse-eigenvalues, hessian-test, lagrange-multipliers, critical-points-gradient-field, quadratic-taylor-approximation, **gradient-descent-on-contours**, **extrema-on-a-circle**, **the-saddle-point** — added 2026-05-24 — 9). Most under-served now: ch.1 and ch.5 (7 each), then ch.2/ch.3/ch.6 (9 each); ch.4 is now the deepest (11). Strongest follow-ups: implicit-function-theorem (ch.5 — derive dy/dx along a level curve from ∇f), gradient-as-steepest-ascent-magnitude or vector-functions / parametrised-curve-tangent (ch.5), shear-decomposition (ch.2 — every 2×2 matrix factors as rotation × scaling × rotation via SVD). **Curriculum correction (verified against the Nøkkelbegrep wiki + Plenum 5/6, 2026-05-24 PM):** TMA4411's ch.4 is a *numerical-methods* chapter (Uke 8–10: Euler, trapes/Crank–Nicolson, convergence, lokal feil, Runge–Kutta + Butcher-tablå, ordens-analyse, systemer/høyere orden) — it is NOT analytic ODE classification, so the old "exact-ODE / integrating-factor (ch.4 last classification slot)" follow-up does not match this course and was removed. Remaining ch.4 numerical gaps for a future run: trapezoidal / Crank–Nicolson as a distinct *implicit RK2* (this run did backward Euler only), the Butcher-tableau notation + explicit-vs-implicit reading (Plenum 5 oppg. 1b/2b), and local-vs-global truncation error / order via Taylor (Plenum 5 oppg. 3 — distinct from euler-vs-rk4's log-log comparison). Note: the 2026-05-24 ch.6 run covered boundary-parametrisation (`extrema-on-a-circle`), saddle geometry (`the-saddle-point`) and iterative minimisation (`gradient-descent-on-contours`); the 2026-05-24 PM run added the three ch.4 numerical scenes above. A KKT / inequality-constrained-on-a-closed-region scene is still open for ch.6 if more are wanted.

- **Subject focus is now Innføring i analog og digital elektronikk (TTT4203).** Fysikk and Operativsystemer topics are paused — the nightly author picks three ADE topics per run from `uploads/ade/`. To reopen fysikk or OS later, edit the author trigger (`trig_01W4V9M7fWvGN7J989JBeQsh`) and swap the `uploads/...` source pointer + chapter list back. (Note: tonight's 2026-05-20 nightly was a Mat2B run on `uploads/matte2/` — the prompt explicitly targeted ch.1 Vektorrom + ch.2 Lineærtransformasjoner. ADE remains the default for subsequent runs unless the prompt switches.)

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
