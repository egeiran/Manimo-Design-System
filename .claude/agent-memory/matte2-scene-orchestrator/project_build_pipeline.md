---
name: project_build_pipeline
description: Per-scene build pipeline used for mat2b — write everything directly rather than spawning claude -p
metadata:
  type: project
---

The repo ships `scripts/generate-scene.js` which spawns a nested `claude -p` call. For mat2b batch authoring, skip that script and author the JSX directly — it's faster, gives tighter style control, and avoids nested-context flakiness.

**Why:** the orchestrator already has full project context loaded; spawning a sub-claude means re-loading CLAUDE.md + the readme + the example for every scene and trusting the sub-call to obey the calibration scene's style. Direct authoring lets the orchestrator copy structural patterns (SoftPanel, GridMaskedSvg, MatrixPanel) verbatim from the anchor scene.

**How to apply:** per-scene loop:
1. Write `motion/mat2b/<id>.spec.json` (top-level: id, subject_id="mat2b", chapter_number, week, language="en", title, eyebrow, duration, topic, concepts, pairs_with, prerequisites, beats[]).
2. Write `motion/mat2b/<id>.jsx` (mirror `linear-transformation-grid.jsx` structure — narration constants at top, math helpers, SoftPanel/GridMaskedSvg/Vector reused, Scene with one `<Sprite>` per beat, `window.sceneNarration = NARRATION`, mount at bottom).
3. Write `motion/mat2b/<id>.html` (copy `linear-transformation-grid.html`; only change `<title>` + script src filename).
4. Append manifest entry in `motion/scene-manifest.json` (bare filenames; mirror existing mat2b entry fields).
5. Run `npm run audio <id>` (uses ELEVENLABS_API_KEY from `.env`). Captures real duration + per-beat audioStart.
6. Re-wire the JSX `SCENE_DURATION`, every `<Sprite start end>`, and the spec's `beats[].start/end` + `duration` + manifest `duration` from the audio script's printed wire-up.

Step 2 must reuse the helper components defined in `linear-transformation-grid.jsx` — do not redefine `toSvg`, `applyM`, `lerpM`, `envelopeM`, `GridMaskedSvg`, `TransformedGrid`, `Axes`, `UnitSquare`, `Vector`, `SoftPanel`, `MatrixPanel` from scratch each time. Either inline the same definitions (keeping mask IDs unique per scene) or factor them into `manimo-motion.jsx` if 3+ scenes reuse them. Mask IDs are document-wide — prefix with the scene id (`<id>-<beat>-mask`).

Audio preflight blocks math symbols in narration. If `npm run audio` aborts, rewrite the offending beat's narration in both spec and jsx NARRATION array before retrying. See [[feedback_narration_phrasings]].
