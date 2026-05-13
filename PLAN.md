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

- **Thévenin Beat 5 landscape — "SAME I_L" connector and original-panel R_L crowd the Thévenin panel's V_th battery.** In `motion/ade/thevenin-equivalent.jsx` `EquivalentBeat`, the landscape panels sit at `ox=50, ow=480` and `ex=580, ew=480` with the connector line in the 50px gap between them. The original's R_L label (around x=494) and the Thévenin's V_th label (around x=618) sandwich the "SAME I_L" line + caption. Readable but tight. Either widen the inter-panel gap (push ex right, narrow each panel), or move "SAME I_L" above the two panels (between the title row), or shrink the rose-colored R_L label so it doesn't compete visually. Single-file tweak.

### [HUMAN] — needs your input

- **[HUMAN] Dining-philosophers fourConditions beat — portrait labels overlap philosophers.** In `motion/operativsystemer/dining-philosophers.jsx` `FourConditionsBeat`, the portrait branch parks the four Coffman-condition labels at `y=100/120/480/500`, but at portrait geometry P0 sits at `y=100` and P2/P3 sit near `y=462`. The labels overprint the philosopher nodes. Needs a real layout rethink for portrait (e.g. compress the table radius, stack the labels as a list below the table, or relocate to a side column) — not a one-coordinate move. Reviewer flagged on 2026-05-11.

- **[HUMAN] Voltage-divider portrait sweep — R1/R2 numeric labels sit close to the resistor zigzags.** In `motion/ade/voltage-divider.jsx` `SweepBeat` portrait branch, the R1/R2 labels at `G.rightX + G.zigAmp + 18` (= 358) end up ~18 px from the zigzag tips (which extend to ~340 with `zigAmp=20`). Legible but tight; bumping the offset to 28-32 px or relocating the labels to the left of the zigzags would breathe better. Reviewer flagged on 2026-05-11.

- **[HUMAN] Karnaugh-map portrait — function-beat formula wraps awkwardly mid-summation.** In `motion/ade/karnaugh-map.jsx` `FunctionBeat`, the headline `F(A, B, C) = Σ m(2, 3, 4, 5, 6, 7)` wraps after "3," in portrait because the FadeUp container has no explicit max-width and the 36 px serif overflows 720 px. Reads, but breaks on a comma rather than at a logical seam. Either tighten the font size in portrait, or break the line manually before the Σ.

- **[HUMAN] Re-run `npm run publish kirchhoff-voltage-law phasor-rotation karnaugh-map thevenin-equivalent low-pass-bode finite-state-machine`** once Supabase env vars are available on the nightly sandbox. Tonight's reviewer plus the previous one skipped publish because keys were missing (`.env` not present in the sandbox). Live HTML for all six is already on Pages; only the Supabase `public.scenes` row inserts are pending.

- **[HUMAN] Seed `public.chapters` for ADE chapter 14 (and any other missing ADE chapters).** Tonight's reviewer found Supabase env vars _were_ available after all, and successfully published `thevenin-equivalent` (ch.2) and `low-pass-bode` (ch.5). But `finite-state-machine` was rejected by the `scenes_chapter_fk` composite FK because `(subject_id, chapter_number) = (ade, 14)` is not present in `public.chapters`. Add the missing row(s) in Supabase, then re-run `npm run publish finite-state-machine` (and likely the other earlier-flagged IDs once you've checked chapters 4, 6, 12 against the same gap). The HTML for `finite-state-machine` is already live on Pages. Reviewer flagged on 2026-05-12.

- **[HUMAN] Pick next ADE topics for the next run if you want priorities.** Tonight's run covered: thevenin-equivalent (ch 2), low-pass-bode (ch 5), finite-state-machine (ch 14). The full ADE library now spans ch 1, 2, 4, 5, 6, 12, 13, 14. Strong candidates for next time: RC charging curve in the ADE framing (ch 3), inverting op-amp with virtual short (ch 7), BJT load-line (ch 8), two's complement bit flip + add 1 (ch 9), NAND universality (ch 10), full adder ripple (ch 11). If you want a specific topic prioritised, reply in chat.

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
