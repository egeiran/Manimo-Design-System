# Manimo motion library

Named, composable animation primitives for Manimo lesson scenes. Built on top of
`animations.jsx` (Stage / Sprite / useTime / Easing / interpolate).

This file is the **source of truth** when authoring scenes. Read it before
writing any new motion.

---

## How a scene is structured

Every scene is one `.jsx` file paired with one `.html` file in `motion/`.
The HTML loads three scripts in order: `animations.jsx`, `manimo-motion.jsx`,
then the scene file itself. The scene exports an `App` component mounted
into `#root` and wraps everything in `<Stage>`.

```jsx
const SCENE_DURATION = 20;

function Scene() {
  return (
    <div style={{ width: '100%', height: '100%', background: '#0c0a1f' }}>
      <Sprite start={0} end={5}>
        <FadeUp delay={0.2}>Hei</FadeUp>
      </Sprite>
    </div>
  );
}

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
```

`<Sprite start end>` mounts its children only between those seconds and
exposes a `localTime` (0…sprite duration) via `useSprite()` — every motion
primitive below reads from that, so timing composes naturally.

---

## When to use which primitive

| Need                                | Primitive       |
|-------------------------------------|-----------------|
| Draw an SVG path (curve, axis, glyph stroke) | `TraceIn`       |
| HTML/DOM text or block appears      | `FadeUp`        |
| Handwritten left→right text reveal  | `WriteOn`       |
| Mark a point on a graph             | `PulseMark`     |
| Erase a chalk element off-screen    | `ChalkWipe`     |
| Square label bracket on a diagram   | `Bracket`       |
| Mascot                              | `Manimo`, `ManimoEnter` |
| Cursor following a TraceIn          | `ChalkTip`      |
| **Fade in something inside an `<svg>`** | **`SvgFadeIn`** (NOT FadeUp) |

---

## Primitives

### `<TraceIn d ... duration delay />`
SVG path that "draws itself" via stroke-dashoffset. Use for curves, axes,
formula glyph strokes, geometric figures.

```jsx
<TraceIn
  d="M 100 100 L 300 100"
  stroke="var(--amber-400)"
  strokeWidth={3}
  duration={1.0}
  delay={0.5}
/>
```

| Prop          | Default                 | Notes                                      |
|---------------|-------------------------|--------------------------------------------|
| `d`           | —                       | SVG path data (required)                   |
| `stroke`      | `'#f4b860'`             | Pass a color token: `var(--amber-400)`    |
| `strokeWidth` | `3`                     |                                            |
| `fill`        | `'none'`                |                                            |
| `duration`    | `0.8`                   | Seconds to complete the trace             |
| `delay`       | `0`                     | Within the parent Sprite                   |
| `ease`        | `Easing.easeOutCubic`   |                                            |
| `pathLength`  | `1000`                  | Logical length used for dashing           |

Long compound paths (multiple `M`) trace as a single dash. If you want
sequenced strokes, use multiple `<TraceIn>` calls with increasing `delay`.

### `<FadeUp duration delay distance>...children</FadeUp>`
Fade in while sliding up; auto-fade-out at end of Sprite. Default for
"a thing appears" in HTML/DOM context.

⚠ **Do not use inside `<svg>`** — CSS `transform: translateY` and
`clip-path` don't apply reliably to SVG nodes. Use `<SvgFadeIn>` there.

```jsx
<FadeUp duration={0.5} delay={0.7} distance={10} style={{ fontSize: 32 }}>
  Lading av en kondensator
</FadeUp>
```

| Prop            | Default                    | Notes                       |
|-----------------|----------------------------|-----------------------------|
| `duration`      | `0.5`                      | Entry duration              |
| `delay`         | `0`                        |                             |
| `distance`      | `12`                       | Pixels to travel up         |
| `exitDuration`  | `0.3`                      | Auto-fade at sprite end     |
| `exitDistance`  | `8`                        |                             |
| `as`            | `'div'`                    | Render as another tag       |
| `style`         | `{}`                       | Merged into computed style  |

### `<SvgFadeIn duration delay>...svg children</SvgFadeIn>`
Opacity-only fade for SVG groups. Use for axis labels, formula symbols,
anything that lives inside an `<svg>`.

```jsx
<SvgFadeIn duration={0.3} delay={1.2}>
  <text x={40} y={120} fill="var(--chalk-200)">V₀</text>
</SvgFadeIn>
```

### `<WriteOn duration delay italic>text</WriteOn>`
Handwritten-style left-to-right reveal via clip-path. Use for spoken
caption text, especially under formulas.

```jsx
<WriteOn duration={0.7} fontSize={28} italic>
  τ er tiden det tar å nå 63%
</WriteOn>
```

| Prop         | Default                  |
|--------------|--------------------------|
| `duration`   | `0.7`                    |
| `fontFamily` | `'var(--font-serif)'`    |
| `fontSize`   | `28`                     |
| `italic`     | `false`                  |
| `color`      | `'var(--fg-1)'`          |

### `<PulseMark cx cy color radius pulseRadius duration delay />`
A dot that appears and pulses outward once. Use to call attention to a
specific (cx, cy) on a graph.

```jsx
<PulseMark cx={tauX} cy={sixtyThreeY} color="var(--rose-400)" delay={0.3}/>
```

### `<ChalkWipe direction>...children</ChalkWipe>`
Wipes the children off-screen at the end of the parent Sprite, like a
chalkboard eraser. `direction` is `'left' | 'right' | 'up' | 'down'`
(direction the wipe travels).

```jsx
<Sprite start={3} end={11}>
  <ChalkWipe duration={0.6} direction="right">
    <CircuitDiagram/>
  </ChalkWipe>
</Sprite>
```

The wipe is timed to the **end** of the Sprite, so put the duration of
the wipe inside the Sprite's window.

### `<Manimo size color point bob blink />`
The mascot. Renders inside a 200×200 local frame — translate the parent
`<g>` to position. `point={{x, y}}` reroutes the trailing arm toward an
in-frame target.

```jsx
<svg viewBox="0 0 200 200" width={140} height={140}>
  <Manimo color="var(--amber-400)" point={{ x: 180, y: 60 }}/>
</svg>
```

### `<ManimoEnter ...manimoProps />`
Convenience: bobs in from below and settles via `Easing.easeOutBack`.
Wrap in a Sprite with `start` ≈ 0.

### `<Bracket x1 y1 x2 y2 side depth />`
Square annotation bracket along a segment. Side `'bottom' | 'top' | 'left' | 'right'`.
Internally uses a TraceIn so it draws itself in.

### `<ChalkTip x y color size opacity />`
Small cursor dot. Use as a visual counterpart to a TraceIn — interpolate
its (x, y) along the path so it looks like the tip drew the line.

---

## Color tokens (use these, don't hardcode)

```
var(--amber-300)  warm primary text/highlights
var(--amber-400)  primary stroke for diagrams (the "chalk" color)
var(--rose-300)   secondary/accent text
var(--rose-400)   accent stroke (markers, callouts)
var(--teal-400)   tertiary accent
var(--violet-400) tertiary accent
var(--chalk-100)  high-contrast text on dark
var(--chalk-200)  body text on dark
var(--chalk-300)  dimmed text / axis labels
var(--bg-canvas)  scene background (#0c0a1f-ish)
```

Full token list: `/colors_and_type.css`.

## Type tokens

```
var(--font-serif)   Fraunces — display, formulas, italics
var(--font-sans)    Inter — UI, captions, eyebrows
var(--font-mono)    JetBrains Mono — code, numeric labels (.63, 0:11)
```

## Timing tokens (informal — feel free to override)

| Token         | Seconds |
|---------------|---------|
| `--dur-flick` | 0.18    |
| `--dur-fade`  | 0.35    |
| `--dur-draw`  | 0.8     |
| `--dur-wipe`  | 0.6     |
| `--dur-beat`  | 1.4     |

---

## Conventions

- **One Sprite per beat.** `<Sprite start={3} end={7}>` is the unit of
  composition. Don't try to do everything in a single Sprite — overlapping
  Sprites with shared time windows are clearer than nested logic.
- **Stagger via `delay`, not nested Sprites.** Inside one beat, a few
  delays read better than wrapping in another Sprite.
- **Layout up front.** Compute geometry (graph axes, circuit positions)
  as constants at the top of a component so animation primitives can
  reference them.
- **No surprise colors.** Pull from the token list above. Stick to one
  primary (amber) and at most one accent (rose) per scene unless you have
  a structural reason to add more.
- **Default 1280×720, 16:9.** Stage width/height should match.

## Timing cheatsheet — how `delay` works

Every primitive (`TraceIn`, `FadeUp`, `SvgFadeIn`, …) calls `useSprite()`
internally to get `localTime`. **`localTime` is always relative to the
nearest parent `<Sprite>`'s `start`.** So `delay` means "seconds after this
beat starts", not "seconds from the beginning of the video".

```
Stage time:   0────1────2────3────4────5────6────7────8
                             ├── Sprite start={3} end={8} ──────┤
                             │   localTime: 0──1──2──3──4──5
                             │
                             │   TraceIn delay={1}  → visible at stage 4
                             │   FadeUp  delay={2.5}→ visible at stage 5.5
```

Worked example — a beat that starts at `t=10`:

```jsx
<Sprite start={10} end={16}>
  <MyBeat />
</Sprite>

function MyBeat() {
  // localTime: 0 at stage t=10, 6 at stage t=16
  return (
    <>
      <TraceIn delay={0}   ... />  {/* draws at stage t=10   */}
      <TraceIn delay={1.5} ... />  {/* draws at stage t=11.5 */}
      <FadeUp  delay={3}   ... />  {/* fades  at stage t=13  */}
    </>
  );
}
```

### The nested-Sprite trap

`<Sprite>` reads from `useTimeline()` (absolute stage time), **not** from a
parent Sprite's context. A nested `<Sprite start={0} end={99}>` inside your
beat component gives `localTime = absolute stage time`, so all delays become
absolute stage times — almost certainly wrong.

```jsx
// ✗ WRONG — inner Sprite's localTime = absolute stage time
<Sprite start={10} end={16}>
  <Sprite start={0} end={99}>   {/* delay={1} means stage t=1, already past */}
    <TraceIn delay={1} />
  </Sprite>
</Sprite>

// ✓ CORRECT — primitives directly inside the beat's Sprite
<Sprite start={10} end={16}>
  <TraceIn delay={1} />         {/* delay={1} means stage t=11 */}
</Sprite>
```

The only legitimate use of nested Sprites is in `rc-scene.jsx`'s circuit
components, where the inner `<Sprite start={0} end={20} keepMounted>` is
intentionally used to express delays as absolute stage times. Avoid this
pattern in new scenes — it is confusing and only necessary for `keepMounted`
re-mount choreography.

---

## Common gotchas

- **`FadeUp` inside `<svg>` does nothing visible.** Use `SvgFadeIn`.
- **CSS `clip-path` on `<g>` doesn't work in Safari.** If you need to wipe
  SVG content, do it on a wrapping HTML `<div>` instead.
- **`pathLength={1000}` is normalised** — the actual stroke-dashoffset
  math uses 1000 regardless of real path length, so trace timing is
  predictable. Don't override unless you know why.
- **`strokeDasharray` on `TraceIn` is spread after the internal default**,
  so it overrides the 1000-unit dash. With a repeating pattern like `"6 6"`,
  dashoffset animation no longer produces a clean draw-in — use `SvgFadeIn`
  wrapping a plain `<path>` for dashed lines instead.
- **Fonts:** local font-face CSS in `colors_and_type.css` already loads
  Fraunces, Inter and JetBrains Mono. Don't import from Google Fonts.
