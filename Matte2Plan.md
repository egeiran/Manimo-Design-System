# Matte 2B — scene authoring plan

This file is the kickoff prompt for Claude when authoring scenes for
**TMA4411 Matematikk 2B** (NTNU, Vår 2026, Katrin Grunert). Treat it as
the single source of truth for chapter structure, scene candidates and
math-specific authoring rules. Read [CLAUDE.md](CLAUDE.md) and
[motion/README.md](motion/README.md) first — this file only adds what's
new for the math subject.

---

## Subject identity

- `subject_id`: `mat2b`
- Folder: [motion/mat2b/](motion/mat2b/) — all `.jsx` / `.html` / `.spec.json` go here
- Course code: TMA4411
- Term: V2026
- Lecturer: Katrin Grunert
- Curriculum source: [uploads/matte2/](uploads/matte2/) — six plenum-PDFs + the official "Nøkkelbegrep" wiki page
- Supabase seed: [uploads/matte2/supabase.sql](uploads/matte2/supabase.sql) — run in kort-forklart's SQL editor before publishing any scene. Idempotent (deletes/re-inserts mat2b rows on re-run).
- Default scene `language`: `"en"` (per project convention — see [[feedback_scene_language]])
- The subject is seeded with `published = false`. Flip it to `true` only when enough scenes ship to be useful to a student.

---

## Chapter map

Six chapters. Titles, icons, intros and position come from
[uploads/matte2/supabase.sql](uploads/matte2/supabase.sql) and are the
canonical names — match them exactly in spec metadata. The 13 wiki
weeks map cleanly into them; store the original week number in the
spec as a top-level `week` field so we can later surface "uke 7"
filters in the Watch UI.

| chapter\_number | title | icon | weeks | core concepts |
|---|---|---|---|---|
| 1 | Vektorrom | `layers` | 2–3 | vektorrom, underrom, lineærkombinasjon, spenn, lineær uavhengighet, basis, dimensjon, P_n, M_{m×n} |
| 2 | Lineærtransformasjoner | `shuffle` | 4–5 | lineærtransformasjon, kjerne, rekkevidde, rang, rangteorem, koordinatvektor, matriserepresentasjon, basisbytte/overgangsmatrise, indreprodukt + projeksjon i ℝⁿ |
| 3 | Indreproduktrom | `compass` | 6–7 | indreproduktrom, norm, Cauchy–Schwarz, ortogonalt komplement, ortonormal basis, Gram–Schmidt, projeksjon på underrom, beste approksimasjon |
| 4 | Differensialligninger | `activity` | 8–10 | diagonalisering, lineære systemer av ODE, lineære 2. ordens ODE, Euler (eksplisitt/implisitt), trapes/Crank–Nicolson, Runge–Kutta + Butcher-tablå, ordens- og feilanalyse |
| 5 | Funksjoner og derivasjon | `trending-up` | 11–13 | skalar-/vektorfunksjoner, mengder og følger i ℝⁿ, grenser, kontinuitet, partielle/retnings­deriverte, gradient, deriverbarhet, linearisering, tangentplan, middelverdisetning |
| 6 | Ekstremalpunkter | `target` | 15–16 | kritiske punkter, Hesse-matrise, diskriminant, andrederiverttesten, ekstremalverdisetningen, globale ekstrema på lukket begrenset område |

Note: Grunner's pensum splits "Derivasjon II" (uke 13) which contains
*Ekstremalpunkter* across the chapter 5/6 boundary; the seed treats
ekstremal-stoffet i uke 13 as a teaser for chapter 6. When in doubt
about placement, put a scene under the chapter whose `intro` text
mentions its core concept.

---

## Canonical reference data

Everything below already lives in the seed SQL — read it before
writing a scene. Don't paraphrase definitions; match the wording used
in `chapter_concepts` so the watch UI, the seeded definitions, and
the scene narration tell one coherent story.

| Supabase table | What it holds | How to use it when authoring |
|---|---|---|
| `public.subjects` | One row, `id = 'mat2b'`, `code = 'TMA4411'`, `published = false`. | Confirms the subject exists before publishing. |
| `public.chapters` | Six rows. Title + icon + intro per chapter. | Spec's `chapter_number` must point to one of these. Title should match. |
| `public.chapter_formulas` | 9 + 8 + 9 + 9 + 9 + 8 = ~52 formulas, each with LaTeX, prose explanation, and importance tag. | The "Høy"-importance formulas are the natural targets for `WriteOn` reveal in scenes. Don't invent new ones; use these verbatim. |
| `public.chapter_concepts` | ~80 concept definitions across the six chapters. | Use as the *vocabulary* of the scene. Captions and narration should reuse these terms so a student moves seamlessly between watching and reading. |
| `public.chapter_quiz` | ~5 quiz items per chapter (29 total). | Each scene should answer at least one of these — quizzes reveal what students will be tested on. |
| `public.quiz_pool` | 40 exam-style problems, each tagged with the `Plenum N oppg. X` source. | This is the single best signal for which examples to animate. A problem that appears 7× in the pool (e.g. Plenum 6 oppg. 3) deserves its own scene. |

### Pairing scenes with quiz items

When authoring a scene, pick a problem from `chapter_quiz` or
`quiz_pool` whose question maps onto your visual. The scene should
make the answer feel inevitable. Suggested pairings already baked
into the catalog below — but a scene is only useful if a student can
afterwards answer at least one canonical exam question.

## Math-specific authoring rules

These are additions to the rules in [CLAUDE.md](CLAUDE.md). The hard
rules there (tokens, no Google Fonts, pinned React/Babel, FadeUp ≠
SvgFadeIn, narration is spoken) all still apply.

### Narration: how to speak math

The TTS pre-flight will reject scenes whose `narration` contains math
symbols. Map every symbol to spoken prose. Lean conversational, not
chalkboard-formal:

| symbol | say |
|---|---|
| `x²`, `x^n` | "x squared", "x to the n" |
| `√x` | "the square root of x" |
| `∫ f dx` | "the integral of f with respect to x" |
| `∂f/∂x` | "the partial derivative of f with respect to x" |
| `∇f` | "the gradient of f" (or "nabla f" if context is clear) |
| `‖v‖` | "the norm of v" |
| `⟨u, v⟩` | "the inner product of u and v" |
| `ℝⁿ` | "n-dimensional real space" or "R n" once introduced |
| `λ` (eigenvalue) | "lambda" |
| `x₁, x₂` | "x one, x two" |
| matrix `A` | just "A" — never spell out entries unless it's the point |
| `=` | "equals" (never read aloud as "is") |
| `det(A)` | "the determinant of A" |
| `T(v) = Av` | "T of v equals A v" |

Visual `text-formula` elements keep the symbolic form. Only narration
strings must be sanitised.

### Visual notation

- Variables and matrix names use Fraunces italics (`var(--font-serif)`,
  `font-style: italic`). Multi-letter names like `det` and `rank` stay
  upright.
- Vectors: lowercase italic letter with an arrow on top, OR bold (pick
  one per scene and stick to it). Don't mix.
- Matrices: capital italic, bracketed entries use JetBrains Mono.
- Number labels on axes / nodes use JetBrains Mono.
- Subscripts via `<sub>` for HTML, manual offset for SVG `<text>`.

### Coordinate-system conventions

- 2D plane: x right, y up. Origin in the visual center of the diagram
  area, not the stage.
- 3D: when needed, project orthographically with y-up, slight isometric
  tilt (z about 30° behind x). Don't try to do perspective with
  vanishing points — it's not worth the maths and ruins the chalky
  feel.
- Grid for linear-transformation scenes: draw both the original grid
  (chalk-200 at low opacity) and the transformed grid (amber-400) so
  the student sees what moved.

### Color semantics for math scenes

Reserve one color per role to keep the eye trained across scenes:

- **chalk-200**: default ink, axes, default vectors
- **amber-400**: the object currently being acted on (transformed
  vector, current step in Gram-Schmidt, eigenvector being highlighted)
- **plum-400 / indigo-400**: secondary objects (basis vectors, span
  plane, comparison vectors)
- **rose-400**: error / residual / "what we're projecting away"
- **emerald-400** (sparingly): the final result / converged answer

---

## Scene catalog — high-leverage candidates

Prioritised list. These are concepts where animation genuinely beats a
static lecture board. Pick from here when authoring; don't invent
brand-new topics unless the user asks. Each entry sketches the beats —
treat as a starting point, not a script.

### Chapter 1 — Vektorrom

1. **Spennet og lineær avhengighet** (`span-and-dependence`)
   - 30s. Three 2D vectors fade in. Show shaded parallelogram = span.
   - Add a third coplanar vector — span doesn't grow.
   - Replace with an off-plane vector (jump to 3D) — span fills space.
   - Why: dependence becomes *visual*, not algebraic.

2. **Basis: same space, two grids** (`basis-change-grid`)
   - 35s. Standard grid in chalk-200. Overlay a tilted basis grid in
     amber-400. Show one vector with coordinates `(2,1)` in standard,
     then highlight its coordinates `(c₁, c₂)` in the new basis.
   - Why: the abstract idea of "coordinates depend on basis" is one
     animation away from intuitive.

3. **Dimension as the number of free directions** (`dimension-intuition`)
   - 25s. Start with a line through origin (dim 1) → plane (dim 2) →
     volume (dim 3). Each step adds a vector that escapes the previous
     span.

### Chapter 2 — Lineærtransformasjoner

4. **Linear transformation of a 2D grid** (`linear-transformation-grid`) — **start here**
   - 40s. Unit square + grid → rotation → scaling → shear → general A.
   - Watch the unit basis vectors `e₁`, `e₂` map to the columns of A.
   - Why: this scene anchors visual language for the rest of the
     chapter. Author it manually before any others to set style.

5. **Matrix as a function: T(v) = Av** (`matrix-as-function`)
   - 30s. Vector enters left, matrix-machine in the middle, output
     vector exits right. Then collapse the diagram — Av "is" the
     transformation.

6. **Change of basis as a matrix product** (`change-of-basis-matrix`)
   - 35s. Three coordinate frames: B, standard, B'. Vector lives in
     all three; arrows show the conversion P[v]ᴮ → [v]_std → P'⁻¹.

7. **Rank-nullity by squashing a plane to a line** (`rank-nullity-visual`)
   - 30s. A 2D grid gets mapped by a singular matrix to a line. The
     kernel = the direction that collapsed; image = the surviving line.

### Chapter 3 — Indreproduktrom

8. **Projection onto a subspace** (`projection-onto-line`)
   - 28s. Vector `u`, line span(`v`). Drop perpendicular, show
     `proj_v(u)` along the line and the residual `u − proj_v(u)`
     orthogonal to it.

9. **Gram-Schmidt, step by step** (`gram-schmidt-2d-then-3d`)
   - 45s. Two non-orthogonal vectors → orthogonalise → normalise. Then
     a third vector enters 3D and the same process repeats. Each step
     emphasises "subtract the projection".

10. **Approksimasjonsteorem: best fit in a subspace** (`best-approximation`)
    - 35s. Point above a plane. Drop perpendicular to plane. Sweep
      other candidate points in the plane — all farther. The foot of
      the perpendicular is uniquely closest.

### Chapter 4 — Differensialligninger

11. **Diagonalisation: eigenvectors as natural axes** (`diagonalisation-eigenaxes`)
    - 40s. Apply A to the unit circle → ellipse. Highlight the two
      axes that didn't rotate — the eigenvectors. Their stretch factors
      are λ₁, λ₂. Then redraw A in those coordinates: diagonal.

12. **Phase portrait of a 2D linear system** (`phase-portrait-2x2`)
    - 45s. ẋ = Ax, three cases side by side: stable node, saddle,
      spiral. Vector field + a few trajectories per case. Tie each to
      its eigenvalue signature.

13. **Euler's method: tangent steps along a slope field** (`euler-step`)
    - 35s. Slope field for y' = f(t, y). True solution curve faint in
      background. Euler steps march along; error opens like a fan as
      h grows.

14. **RK4 beats Euler at the same h** (`euler-vs-rk4`)
    - 35s. Same problem, same step size. Euler drifts; RK4 hugs the
      true curve. Overlay error vs h on log-log to make the order
      claim visible (slope 1 vs 4).

15. **Second-order ODE as a first-order system** (`second-order-to-system`)
    - 30s. Equation `y'' + 2γy' + ω²y = 0` → introduce `v = y'` →
      matrix form. Then phase portrait in (y, v).

### Chapter 5 — Funksjoner og derivasjon

16. **Limits in ℝ² fail along different paths** (`multivariable-limit-paths`)
    - 30s. Function `f(x,y) = (xy + y³)/(x² + y²)` (the Plenum 6
      oppg. 1 problem). Approach along x-axis: limit = 0. Along
      y = x: limit = ½. Two different values → limit doesn't exist.
      Pure visual proof of why multivariable limits are subtler than
      single-variable.

17. **Gradient is perpendicular to level curves** (`gradient-and-level-curves`)
    - 32s. Contour plot of a saddle-shaped surface. At each chosen
      point, draw ∇f as an arrow. Show that arrows always cross
      contours at 90°. Steepest ascent = direction of ∇f, magnitude
      ‖∇f‖.

18. **Directional derivative as a tilted slice** (`directional-derivative`)
    - 35s. Surface z = f(x, y). Pick a point, pick a direction `u`.
      Slice the surface with the vertical plane through `u` — the
      slope of the cut curve at the point is `D_u f = ∇f · u`. Walk
      through the Plenum 6 oppg. 2 numerics so the formula has a
      concrete worked example.

19. **Linearisation: tangent plane snaps on** (`tangent-plane-linearisation`)
    - 30s. Surface, a point on it, two partial-derivative arrows,
      tangent plane fades in. Zoom in — plane and surface become
      indistinguishable. Bridges to chapter 6 (Hesse-test is "next
      term of the Taylor expansion").

### Chapter 6 — Ekstremalpunkter

20. **Second-derivative test: discriminant decides** (`hessian-test`)
    - 40s. Three critical points side by side: bowl (lokalt min),
      dome (lokalt maks), saddle. For each, show the Hesse matrix,
      compute `D = f_xx f_yy − f_xy²`, and read off the verdict from
      the signs. Centerpiece scene of chapter 6.

21. **Global extrema on a closed bounded region** (`global-extrema-triangle`)
    - 50s. Walk through Plenum 6 oppg. 3 visually: `f = x² + y² − xy
      + x + y` on the triangle x ≤ 0, y ≤ 0, x + y ≥ −3. Show three
      kinds of candidate points lighting up in sequence — indre
      kritisk punkt at (−1, −1), three boundary segments each with
      their own restricted critical point, three corners. End with
      the comparison table: min = −1, maks = 6. This is the
      highest-leverage scene in chapter 6 — Plenum 6 oppg. 3 gets 7
      quiz items in the pool, so students will hit it repeatedly.

22. **Hesse-matrise: eigenvalues classify the shape** (`hesse-eigenvalues`)
    - 35s. For each of bowl/dome/saddle, factor the Hesse matrix as
      PDPᵀ. The eigenvalues are the principal curvatures. Both
      positive → min; both negative → max; opposite signs → saddle.
      Connects the algebraic test back to chapter 2 diagonalisering.

---

## Workflow per scene

1. Confirm the seed has been applied: open the SQL editor in
   kort-forklart's Supabase and run
   [uploads/matte2/supabase.sql](uploads/matte2/supabase.sql). The
   file is idempotent — running it twice is safe.
2. Pick a scene id from the catalog. If the user asks for one not in
   the list, propose a sketch first.
3. Create the spec file. Top-level fields *must* include:
   ```json
   {
     "id": "linear-transformation-grid",
     "subject_id": "mat2b",
     "chapter_number": 2,
     "week": 4,
     "language": "en",
     "title": "...",
     "topic": "...",
     "concepts": ["..."],
     "pairs_with": ["chapter_quiz: 2.0", "quiz_pool: plenum-3-2a"]
   }
   ```
   `chapter_number` is one of 1..6. `pairs_with` is informal — it just
   helps a later reviewer check that the scene answers a real exam-style
   question.
4. Use `scripts/generate-scene.js` so files land in `motion/mat2b/`
   and the manifest entry is upserted automatically.
5. Cross-check terminology against `chapter_concepts` for the same
   chapter (in the seed SQL). Reuse the seeded wording verbatim in
   captions when possible.
6. Write narration in spoken prose first, then build the visual
   text-formula elements separately. Run the pre-flight check by
   trying `npm run generate-audio <id>` early — it fails fast on
   symbols in narration.
7. Open the `.html` locally and verify per CLAUDE.md's checklist (no
   black screen, animation completes, tokens render).
8. `git push origin main` → wait for Pages → `npm run publish <id>`.

---

## Batching strategy

The user plans many scenes. Recommended cadence:

- **Phase 0 — calibration** (do this first, by hand)
  - Author scene #4 `linear-transformation-grid` manually. It sets
    the visual standard for the whole linear-algebra block.
- **Phase 1 — high-leverage core** (next ~10 scenes)
  - Walk top-to-bottom through the catalog above, 2–3 per night, in
    the ADE-style nightly batch pattern (compare commits f9fe4bc,
    6dcde9a). Skip nothing in phase 1.
- **Phase 2 — fill chapters** (after phase 1 ships)
  - Add the more abstract or supporting scenes (vector-space axioms,
    isomorphism, convergence proofs) only if students ask for them.
    Don't force animations onto topics that don't reward it.

If you spawn a nightly author agent, give it this file and the
catalog above as its scoped chapter map — not the raw PDFs. That's
the lesson from commit fd4b893: agents authoring without a real
chapter map invent topics.

---

## When in doubt

- Ask the user before deviating from the catalog.
- If a scene needs a new motion primitive, add it to
  `motion/manimo-motion.jsx` and document it in `motion/README.md`
  (see CLAUDE.md hard rule 5). Don't inline animation logic in the
  scene file.
- If the math notation gets dense, prefer two clean shorter scenes
  over one cluttered long one.
- Stage stays 1280×720. Scene duration target: 25–45 seconds. Longer
  scenes lose students.
