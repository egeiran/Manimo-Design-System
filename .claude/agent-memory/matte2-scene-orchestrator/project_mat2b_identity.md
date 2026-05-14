---
name: project_mat2b_identity
description: Subject metadata and chapter map for TMA4411 Matematikk 2B (Matte 2B)
metadata:
  type: project
---

`subject_id` is `mat2b` (not `matematikk2`). Course TMA4411, NTNU V2026, Katrin Grunert.

**Why:** The supabase seed at `uploads/matte2/supabase.sql` defines `id = 'mat2b'` for the subjects row; the publish script does a warn-only FK check, but the manifest entry and spec must match this id exactly.

**How to apply:** every spec for a Matte 2B scene has top-level `"subject_id": "mat2b"` and `"language": "en"`. Scene files live in `motion/mat2b/<id>.{jsx,html,spec.json}`. Audio lives at `motion/mat2b/audio/<id>/scene.mp3`.

Chapter map:
1. Vektorrom (weeks 2–3) — vector spaces, span, linear independence, basis, dimension
2. Lineærtransformasjoner (weeks 4–5) — linear maps, kernel, range, rank, change of basis
3. Indreproduktrom (weeks 6–7) — inner product, norm, Gram-Schmidt, projection, best approximation
4. Differensialligninger (weeks 8–10) — diagonalisation, ODE systems, Euler/RK4
5. Funksjoner og derivasjon (weeks 11–13) — multivariable functions, limits, gradient
6. Ekstremalpunkter (weeks 15–16) — critical points, Hesse matrix, global extrema

Calibration scene `linear-transformation-grid` (ch 2) is the style anchor — every later scene should match its panel layout, color palette, and matrix-panel styling. See [[project_visual_recipes]].
