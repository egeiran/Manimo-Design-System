---
name: project_visual_recipes
description: Reusable scene-level component patterns established by linear-transformation-grid
metadata:
  type: project
---

The calibration scene `motion/mat2b/linear-transformation-grid.jsx` establishes these reusable patterns. New mat2b scenes should reach for them by default.

**Stage geometry constants (per scene, top of file):**
- `ORIGIN_X = 480, ORIGIN_Y = 380, UNIT = 70` — math origin slightly left of stage center so the right side stays clear for the SoftPanel.
- `GRID_X_MIN/MAX, GRID_Y_MIN/MAX` — grid extent in math units.
- Helpers: `toSvg(x, y)`, `applyM(M, x, y)`, `lerpM(target, t)`.

**Helper components to inline (or factor) per scene:**
- `GridMaskedSvg({ maskId, children })` — 1280×720 SVG with a radial-gradient mask that fades content toward the corners so SceneChrome's title/watermark/mascot read on a clean dark patch. Use a unique `maskId` per beat per scene (mask IDs are document-wide).
- `TransformedGrid({ M, color, strokeWidth, opacity })` — renders the unit grid pushed through 2×2 matrix M.
- `Axes()` — x/y axes through origin in chalk-200.
- `UnitSquare({ M })` — filled amber-400 polygon for the transformed unit square.
- `Vector({ x, y, color, label, labelDX, labelDY, strokeWidth, headLen, headHalf, glow })` — arrow from origin with arrowhead + optional glowing tail + Fraunces italic label.
- `SoftPanel({ children, right, top, width, left, bottom, transform })` — translucent dark card (rgba(0,0,0,0.55), 1px chalky border, 16px radius, soft shadow) for right-side text.
- `MatrixPanel({ eyebrow, rows, footnote, delay })` — uppercase mono eyebrow + bracketed 2×2 matrix in Fraunces italic + serif footnote. Column 1 violet, column 2 teal.

**Beat structure templates:**
- `ManimoBubbleIntro` — Manimo mascot bobs in centre-screen with a one-line caption to its right (≈4 s).
- `TransformationBeat({ target, eyebrow, rows, footnote, e1Label, e2Label })` — identity grid (faint, behind) + animated transformed grid (amber, morphing via `envelopeM`) + UnitSquare + Axes + e₁/e₂ vectors + MatrixPanel. Reusable for rotation, scaling, shear, general A.
- `HeroOutro` — centred takeaway: mono uppercase eyebrow "THE TAKEAWAY" in amber-300 + huge serif italic hero line in chalk-100 with one accent word in amber-300 + serif italic subtext + small mono footnote (~5 s).

**Envelope helper:**
`envelopeM({ localTime, spriteDur, target, settle, morphDur, returnDur, tailDur })` — interpolates from I to target and back, holding at target for whatever time remains in the sprite. Lets the same beat structure feel right whether the beat is 7 s or 14 s. Default settle=0.8, morphDur=3.4, returnDur=0.7, tailDur=0.6. For the final "general A" beat, drop the return and hold target indefinitely.

**Mounting boilerplate (last block of every scene file):**
```jsx
window.sceneNarration = NARRATION;
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}
ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
```

**SceneChrome:** always wrap the scene's body in `<SceneChrome eyebrow="..." title="..." duration={SCENE_DURATION}>`. Never re-implement title/watermark/mascot.
