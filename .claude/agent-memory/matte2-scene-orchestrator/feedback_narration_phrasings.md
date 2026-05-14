---
name: feedback_narration_phrasings
description: Canonical spoken-prose for math symbols that survive the audio preflight check
metadata:
  type: feedback
---

The `generate-audio.js` preflight refuses any narration containing `√ ½ ² ³ π ω θ μ α β γ λ Ω Δ ∫ ∑ ∏ ≈ ≤ ≥ ≠ ∂ ± · × ÷ → ⇒ ⇔` or the pattern `letter = value` or `n%`. These canonical spellings pass and read naturally:

| Symbol / shape         | Say                                                              |
|------------------------|------------------------------------------------------------------|
| `T(v) = Av`            | T of v equals A v                                                |
| `λ`, `λ₁`, `λ₂`        | lambda, lambda one, lambda two                                   |
| `det(A)`               | the determinant of A                                             |
| `⟨u, v⟩`               | the inner product of u and v                                     |
| `‖v‖`                  | the norm of v                                                    |
| `∇f`                   | the gradient of f (or nabla f once introduced)                   |
| `∂f/∂x`                | the partial derivative of f with respect to x                    |
| `D_u f`                | the directional derivative of f in direction u                   |
| `f_xx`, `f_yy`, `f_xy` | f x x, f y y, f x y                                              |
| `e₁`, `e₂`             | e one, e two                                                     |
| `x²`                   | x squared                                                        |
| `√x`                   | the square root of x                                             |
| `f(x,y)`               | f of x comma y                                                   |
| `ℝⁿ`, `ℝ²`, `ℝ³`       | R n, R two, R three (or "n-dimensional real space" first time)   |
| `=`                    | equals (never "is")                                              |
| `15%`                  | fifteen percent                                                  |
| `ω₀`                   | omega zero (note: NO hyphen — TTS reads hyphens as "dash")       |
| `Hf`                   | the Hesse matrix of f, or capital H of f                         |
| `(c₁, c₂)`             | c one comma c two                                                |
| `→`                    | maps to, or goes to                                              |

**Why:** symbols hit the preflight regex and waste an audio run; hyphenated forms like "omega-zero" make ElevenLabs say "omega dash zero" out loud.

**How to apply:** write narration in fully spoken prose first, then mirror the same text verbatim into the JSX top-of-file `NARRATION` array. Visual `text-formula` elements keep the symbolic form — this rule applies only to narration strings.

Useful sentence shapes from the calibration scene:
- Opening hook: "What does X actually do to Y? Let's look."
- Beat opener: "First, rotation. Spin the whole grid by an angle theta."
- Beat closer: "Wherever e one lands becomes column one."
- Hero outro: "So a matrix is a verb — it does not describe space, it moves space."
