---
name: project_built_scenes_log
description: Running log of mat2b scenes shipped by the orchestrator — what's audio-wired and manifest-entered vs still pending
metadata:
  type: project
---

State as of 2026-05-14 batch (orchestrator session 3 — Batch A in a parallel split):

**Audio-generated + manifest-attached (manifest committed):**
- linear-transformation-grid (Ch 2) — calibration anchor, hand-authored earlier
- span-and-dependence (Ch 1) — parallel chat
- basis-change-grid (Ch 1) — parallel chat
- dimension-intuition (Ch 1) — 29 s
- rank-nullity-visual (Ch 2) — 39 s
- change-of-basis-matrix (Ch 2) — 38 s
- gram-schmidt-2d-then-3d (Ch 3) — 50 s
- best-approximation (Ch 3) — 35 s
- euler-step (Ch 4) — 40 s

**Authored in session 3 — files written, awaiting audio + manifest merge:**
- euler-vs-rk4 (Ch 4) — placeholder 40 s; written to `scene-manifest.batch-a.patch.json`
- second-order-to-system (Ch 4) — placeholder 33 s; sidecar
- phase-portrait-2x2 (Ch 4) — placeholder 45 s; sidecar (3 sequential single-panel beats, not 3-up split)
- multivariable-limit-paths (Ch 5) — placeholder 35 s; sidecar
- gradient-and-level-curves (Ch 5) — placeholder 38 s; sidecar

**Authored in session 3 — Batch B (parallel) — files written, awaiting audio + manifest merge:**
- directional-derivative (Ch 5) — placeholder 38 s; written to `scene-manifest.batch-b.patch.json`
- tangent-plane-linearisation (Ch 5) — placeholder 36 s; sidecar
- hessian-test (Ch 6) — placeholder 44 s; sidecar
- hesse-eigenvalues (Ch 6) — placeholder 40 s; sidecar
- global-extrema-triangle (Ch 6) — placeholder 52 s; sidecar — Plenum 6 oppg. 3 worked example (interior at (−1, −1) → f = −1 = min; corners (−3, 0), (0, −3) → f = 6 = max)

**Batch B already-shipped (manifest-attached) at session 3 start:**
- matrix-as-function (Ch 2) — landed in main manifest in session 2 parallel
- projection-onto-line (Ch 3) — landed in main manifest in session 2 parallel
- diagonalisation-eigenaxes (Ch 4) — landed in main manifest in session 2 parallel

**Still pending from `Matte2Plan.md` scene catalog (after both batches land):**
- (none from Ch 1–6 batches A+B if Batch B finishes its disjoint scope)

**Why:** keeping this list current avoids redundant authoring and lets the next session pick up where this one left off.

**How to apply:** at the start of any future mat2b batch, read this file plus `motion/scene-manifest.json` to confirm the latest reality (this memo can lag); then claim a pending scene and proceed.

Pipeline that proved robust in session 2:
1. Write spec.json with placeholder durations
2. Write jsx with placeholder SCENE_DURATION + Sprite ranges
3. Write html (copy boilerplate, change title + script src)
4. Append manifest entry (placeholder duration) BEFORE running `npm run audio` — the script reads `subject_id` from manifest to resolve spec path
5. Run `npm run audio <id> -- --voice JBFqnCBsd6RMkjVDRZzb`
6. Re-wire from the printed Sprite ranges: SCENE_DURATION, every Sprite start/end, spec beats start/end, manifest duration
7. Move to next scene

Per-scene wall-clock in session 2 was roughly 5–7 minutes of LLM authoring + ~30 s of ElevenLabs call. The ~15 micro-Edits to apply the audio wire-up bloat the per-scene token cost more than the authoring itself.

Session 3 caveat: when Bash is restricted (sandboxed environment), audio generation cannot run. The deliverable in that case is the spec/jsx/html triple with placeholder Sprite ranges and a manifest patch. A follow-up human/agent with bash access must then:
  npm run audio <id>
…for each scene and rewire SCENE_DURATION + Sprite start/end + spec beats[].start/end + manifest duration from the printed wire-up. Without that pass the scene plays but with no audio narration and slightly imprecise beat timings.

Session 3 also introduced a parallel-orchestration policy: when two batches run concurrently, neither updates `motion/scene-manifest.json` directly. Each batch writes its entries to a sidecar (`scene-manifest.batch-a.patch.json` / `…-b.patch.json`) and the parent chat merges them after both batches finish. This is enforced even though it means `npm run audio` can't resolve the spec via manifest lookup — the alternative would risk write-write conflicts on the manifest between the two parallel chats.
