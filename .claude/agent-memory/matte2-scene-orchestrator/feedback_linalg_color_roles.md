---
name: feedback_linalg_color_roles
description: Consistent color semantics across mat2b linear-algebra scenes (chapters 1–4)
metadata:
  type: feedback
---

Reserve one color per role across the whole linear-algebra block so the eye is trained scene-by-scene:

- `chalk-300` — identity reference grid (always faint, behind)
- `chalk-200` — axes (slightly brighter)
- `amber-400` — the object currently being acted on (transformed grid, current Gram-Schmidt step, eigenvector being highlighted)
- `violet-400` — e₁ basis vector / column 1 of every matrix / first basis in a pair
- `teal-400` — e₂ basis vector / column 2 of every matrix / second basis in a pair
- `rose-400` — error / residual / "what we're projecting away" / dependent vector
- `amber-300` — the takeaway / closing-line accent in hero outros
- `emerald-400` — sparingly: the final result / converged answer

**Why:** Established by the `linear-transformation-grid` calibration scene and reinforced by Matte2Plan.md's "Color semantics for math scenes" section. Drift breaks the visual-language thread that helps students recognise concepts across scenes.

**How to apply:** never invent a new role-color mapping inside a single scene. If a scene needs a new role (e.g. second basis pair B'), use a tinted neighbor like `plum-400` or `indigo-400`, not a fresh color. Hero outros use `amber-300` for the highlight word, not `amber-400` (which is reserved for diagram strokes).
