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

### `<SceneNarration src tracks volume playbackRate />`
Plays narration audio in sync with Stage time. Two modes:

- **Single-track (recommended)** — one continuous MP3 covering the whole
  scene. Pass `src="audio/<scene-id>/scene.mp3"`. Reads more naturally
  because the TTS handles inter-sentence pauses itself, and Sprite start
  times are aligned to audio offsets via `manifest.json`.
- **Per-beat (legacy)** — one MP3 per beat, switched on each beat
  boundary. Pass `tracks={[{start, src}, …]}`. Allows partial regeneration
  but the join points feel choppy.

Generate audio with `npm run audio <scene-id>` (single-track default) or
`npm run audio <scene-id> -- --legacy` for per-beat. The script prints
suggested `<Sprite start>` values to paste into the JSX. Browser autoplay
rules block playback until the user interacts; clicking the PlaybackBar
play button counts, so audio kicks in the moment they hit play.

---

## Adding narration audio to a scene

Canonical workflow — same shape whether the ElevenLabs key works or not.

**Step 1 — write spoken-natural narration.**
Open `motion/<scene-id>.spec.json`. Each `beat.narration` is read verbatim
by TTS. Symbol-laden phrasing sounds robotic. Rewrite math expressions as
they would be *spoken*:

| Symbolic                          | Spoken (use this)                                              |
| --------------------------------- | -------------------------------------------------------------- |
| `F = ma`                          | force equals mass times acceleration                           |
| `ma = -kx`                        | m a equals minus k x                                            |
| `ω₀ = √(k/m)`                     | omega zero equals the square root of k over m                  |
| `T = 2π√(m/k)`                    | T equals two pi times the square root of m over k              |
| `½Mv²`                            | one half m v squared                                           |
| `v = √(4gh/3)`                    | v equals the square root of four g h divided by three          |
| `15%`                             | fifteen percent                                                |
| `omega-zero` (hyphenated)         | omega zero (TTS reads hyphens as the word "dash")              |

The visual `text-formula` elements still use the symbolic form — this rule
only applies to spoken/narration strings. Mirror the rewrite in the JSX's
top-of-file `NARRATION` array (same texts).

**This rule is enforced.** `scripts/generate-audio.js` has a pre-flight
check that refuses to call the ElevenLabs API if narration contains math
symbols (√, ², ½, π, ω, =, %, …). The script aborts and prints which beat
needs rewriting. Bypass with `--unsafe-narration` only when you genuinely
need a non-prose character in the script (rare).

**Step 2 — generate audio.**

```sh
npm run audio <scene-id>
```

Single-track is the default. The script either succeeds (writes
`motion/audio/<scene-id>/scene.mp3` + `manifest.json`, removes any stale
per-beat MP3s, prints the wire-up edits) **or** falls back gracefully when
the key is missing/expired/quota-empty: it estimates each beat's spoken
duration at ~14 chars/sec, writes a no-audio `manifest.json` with
estimated `audioStart` offsets, and prints the same wire-up shape minus
the `<SceneNarration>` line. Re-running with a working key later overwrites
the manifest with real timings.

**Step 3 — apply the printed wire-up to four files.**

The script's tail output names exactly what to edit:

| File                              | Change                                                           |
| --------------------------------- | ---------------------------------------------------------------- |
| `motion/<scene-id>.jsx`           | `SCENE_DURATION`, every `<Sprite start/end>`, `<SceneNarration src=…/>` (audio mode only), `<Stage … loop={false}>` (audio mode only), and the time prefixes in the `NARRATION` array comment |
| `motion/<scene-id>.spec.json`     | Each `beat.start` / `beat.end` and the top-level `duration`      |
| `motion/scene-manifest.json`      | This scene's `duration`                                          |
| `ui_kits/studio/app.jsx`          | This scene's `duration: 'M:SS'` string in `initialScenes`        |

**Step 4 — verify.**

```sh
npm run lint
node scripts/snapshot-scene.js motion/<scene-id>.html
```

The snapshot's playback bar should show the new total duration. If audio
exists, open the `.html` in a browser and click play — narration should
start in sync. (Audio is gitignored-friendly: the MP3 is a few hundred KB
per scene; commit alongside the spec for reproducible playback.)

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
