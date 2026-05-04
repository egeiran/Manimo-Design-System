// Manimo Motion Library
// =====================
// Named, composable animation primitives for Manimo lessons.
// Build on top of motion/animations.jsx (Stage, Sprite, useTime, Easing, interpolate).
//
// Usage inside a <Stage>:
//
//   <Sprite start={1} end={5}>
//     <TraceIn d="M 100 100 L 300 100" stroke="var(--amber-400)" duration={1.0}/>
//   </Sprite>
//
// All primitives respect the surrounding <Sprite>'s localTime/duration so they
// can be sequenced naturally on the timeline.
//
// Conventions:
//   • Default easing: Easing.easeOutCubic (matches our `--ease-draw` token)
//   • Default duration: 0.8s (matches `--dur-draw`)
//   • Colors come from props — don't hardcode; pass amber/teal/rose tokens.
//   • Every primitive accepts `delay` so you can nudge timing without nesting Sprites.

const MM_DEFAULT_DUR = 0.8;
const MM_DEFAULT_EASE = Easing.easeOutCubic;

// ─── TraceIn ──────────────────────────────────────────────────────────────
// An SVG path that "draws itself" via stroke-dashoffset.
// Use for: formulas (one path per glyph), curves, axes, geometric figures.
function TraceIn({
  d,
  stroke = '#f4b860',
  strokeWidth = 3,
  fill = 'none',
  strokeLinecap = 'round',
  strokeLinejoin = 'round',
  duration = MM_DEFAULT_DUR,
  delay = 0,
  ease = MM_DEFAULT_EASE,
  pathLength = 1000, // logical length used for dashing; SVG normalises with pathLength attr
  ...rest
}) {
  const { localTime } = useSprite();
  const t = clamp((localTime - delay) / duration, 0, 1);
  const eased = ease(t);
  const offset = pathLength * (1 - eased);
  return (
    <path
      d={d}
      pathLength={pathLength}
      stroke={stroke}
      strokeWidth={strokeWidth}
      fill={fill}
      strokeLinecap={strokeLinecap}
      strokeLinejoin={strokeLinejoin}
      strokeDasharray={pathLength}
      strokeDashoffset={offset}
      {...rest}
    />
  );
}

// ─── FadeUp ───────────────────────────────────────────────────────────────
// Fade in while sliding up a few pixels. The default for "thing appears".
function FadeUp({
  children,
  duration = 0.5,
  delay = 0,
  distance = 12,
  ease = Easing.easeOutCubic,
  exitDuration = 0.3,
  exitDistance = 8,
  as: Tag = 'div',
  style: styleProp = {},
  ...rest
}) {
  const { localTime, duration: spriteDur } = useSprite();
  const tIn = clamp((localTime - delay) / duration, 0, 1);
  const easedIn = ease(tIn);

  const exitStart = spriteDur - exitDuration;
  const tOut = clamp((localTime - exitStart) / exitDuration, 0, 1);
  const easedOut = Easing.easeInCubic(tOut);

  const opacity = easedIn * (1 - easedOut);
  const y = (1 - easedIn) * distance + easedOut * -exitDistance;

  return (
    <Tag
      style={{
        ...styleProp,
        opacity,
        transform: `translateY(${y}px)`,
        willChange: 'opacity, transform',
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ─── WriteOn ──────────────────────────────────────────────────────────────
// Handwritten-style text reveal: clip-path wipes left-to-right.
// Use for spoken/explanatory text, especially under formulas.
function WriteOn({
  children,
  duration = 0.7,
  delay = 0,
  ease = Easing.easeOutQuart,
  fontFamily = 'var(--font-serif)',
  fontSize = 28,
  color = 'var(--fg-1)',
  italic = false,
  style: styleProp = {},
  ...rest
}) {
  const { localTime } = useSprite();
  const t = clamp((localTime - delay) / duration, 0, 1);
  const eased = ease(t);
  return (
    <span
      style={{
        ...styleProp,
        display: 'inline-block',
        fontFamily,
        fontSize,
        fontStyle: italic ? 'italic' : 'normal',
        color,
        clipPath: `inset(0 ${100 - eased * 100}% 0 0)`,
        WebkitClipPath: `inset(0 ${100 - eased * 100}% 0 0)`,
      }}
      {...rest}
    >
      {children}
    </span>
  );
}

// ─── PulseMark ────────────────────────────────────────────────────────────
// Circle that appears at a point and pulses outward once. Use to call
// attention to a specific location on a graph.
function PulseMark({
  cx, cy,
  color = '#f4b860',
  radius = 4,
  pulseRadius = 18,
  duration = 0.9,
  delay = 0,
}) {
  const { localTime } = useSprite();
  const t = clamp((localTime - delay) / duration, 0, 1);

  // dot fades in over first 20% of duration
  const dotIn = clamp(t / 0.2, 0, 1);
  const dotOpacity = Easing.easeOutCubic(dotIn);

  // pulse ring expands and fades over remainder
  const ringT = clamp((t - 0.1) / 0.9, 0, 1);
  const ringEased = Easing.easeOutQuart(ringT);
  const ringR = radius + ringEased * (pulseRadius - radius);
  const ringOpacity = (1 - ringEased) * 0.6;

  return (
    <g>
      <circle cx={cx} cy={cy} r={ringR} stroke={color} strokeWidth={1.5} fill="none" opacity={ringOpacity}/>
      <circle cx={cx} cy={cy} r={radius} fill={color} opacity={dotOpacity}/>
    </g>
  );
}

// ─── ChalkWipe ────────────────────────────────────────────────────────────
// Content that "wipes off" like a chalkboard eraser. Reveal phase fades in,
// erase phase wipes from one side. Direction: 'left' | 'right' | 'up' | 'down'.
function ChalkWipe({
  children,
  duration = 0.6,
  delay = 0,
  direction = 'right',
  ease = Easing.easeInQuad,
  as: Tag = 'div',
  style: styleProp = {},
  ...rest
}) {
  const { localTime, duration: spriteDur } = useSprite();
  const wipeStart = spriteDur - duration;
  const t = clamp((localTime - wipeStart - delay) / duration, 0, 1);
  const eased = ease(t);

  const insetMap = {
    right: `inset(0 ${eased * 100}% 0 0)`,
    left:  `inset(0 0 0 ${eased * 100}%)`,
    up:    `inset(0 0 ${eased * 100}% 0)`,
    down:  `inset(${eased * 100}% 0 0 0)`,
  };

  return (
    <Tag
      style={{
        ...styleProp,
        clipPath: insetMap[direction],
        WebkitClipPath: insetMap[direction],
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

// ─── Manimo (the character) ───────────────────────────────────────────────
// Renders the mascot. Pass `pose` to bias proportions, `point` to extend
// the trailing arm toward an (x, y) target. Coordinates are in the
// character's local 200×200 frame; transform the parent <g> to position.
function Manimo({
  size = 120,
  color = '#f4b860',
  eyeColor = '#0c0a1f',
  point = null, // {x, y} in local-frame coords; if set, tail reaches toward it
  bob = true,   // gentle idle float
  bobAmplitude = 4,
  bobSpeed = 1.4,
  blink = true,
}) {
  const time = useTime();

  const bobY = bob ? Math.sin(time * Math.PI * 2 / bobSpeed) * bobAmplitude : 0;

  // Blink: every ~4s, eyes squash for ~120ms.
  const blinkPhase = (time % 4) / 4; // 0..1
  const blinking = blink && blinkPhase > 0.97;
  const eyeRy = blinking ? 0.4 : 5;

  // Tail: if `point` is provided, reroute the second sweep toward it.
  // Default tail: "Q 138 178, 178 168".
  const tailD = point
    ? `Q ${(116 + point.x) / 2} ${(124 + point.y) / 2 + 30}, ${point.x} ${point.y}`
    : `Q 138 178, 178 168`;

  return (
    <g transform={`translate(0 ${bobY})`}>
      {/* Body */}
      <path
        d={`M 30 150
            Q 50 152, 70 138
            Q 90 122, 96 96
            C 100 70, 130 58, 152 78
            C 168 94, 162 122, 138 130
            Q 122 134, 116 124
            ${tailD}`}
        fill="none"
        stroke={color}
        strokeWidth={7}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Eyes */}
      <ellipse cx="118" cy="98" rx="2.6" ry={eyeRy} fill={eyeColor} transform="rotate(-8 118 98)"/>
      <ellipse cx="134" cy="96" rx="2.6" ry={eyeRy} fill={eyeColor} transform="rotate(-8 134 96)"/>
      {/* Mouth */}
      <path d="M 122 112 Q 126 115, 130 112" stroke={eyeColor} strokeWidth={2} fill="none" strokeLinecap="round"/>
    </g>
  );
}

// ─── ManimoEnter ──────────────────────────────────────────────────────────
// Convenience: Manimo bobs in from below and settles. Wrap in a <Sprite>.
function ManimoEnter({ duration = 0.7, ease = Easing.easeOutBack, ...props }) {
  const { localTime } = useSprite();
  const t = clamp(localTime / duration, 0, 1);
  const eased = ease(t);
  const opacity = clamp(t / 0.3, 0, 1);
  const yOffset = (1 - eased) * 40;
  return (
    <g style={{ opacity, transform: `translateY(${yOffset}px)`, transformOrigin: '100px 100px' }}>
      <Manimo {...props}/>
    </g>
  );
}

// ─── Cursor (drawing pointer) ─────────────────────────────────────────────
// A small chalk-tip cursor that glides along a path. Use as a visual
// counterpart to TraceIn — the tip "draws" the line.
function ChalkTip({ x, y, color = '#f4b860', size = 8, opacity = 1 }) {
  return (
    <g style={{ opacity }}>
      <circle cx={x} cy={y} r={size * 0.7} fill={color} opacity={0.25}/>
      <circle cx={x} cy={y} r={size * 0.35} fill={color}/>
    </g>
  );
}

// ─── Annotation bracket ───────────────────────────────────────────────────
// A curly/squared bracket that traces in below or beside something to
// label it. Direction: 'bottom' | 'top' | 'left' | 'right'.
function Bracket({
  x1, y1, x2, y2,
  side = 'bottom',
  depth = 12,
  color = '#c8b994',
  strokeWidth = 1.5,
  duration = 0.5,
  delay = 0,
}) {
  // Build a square bracket along the segment
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len, ny = dx / len; // unit normal
  const sign = (side === 'bottom' || side === 'right') ? 1 : -1;
  const ox = nx * depth * sign, oy = ny * depth * sign;

  const d = `M ${x1} ${y1} L ${x1 + ox} ${y1 + oy} L ${x2 + ox} ${y2 + oy} L ${x2} ${y2}`;
  return (
    <TraceIn d={d} stroke={color} strokeWidth={strokeWidth} duration={duration} delay={delay}/>
  );
}

// ─── SvgFadeIn ────────────────────────────────────────────────────────────
// Lightweight opacity fade for SVG groups. Use instead of FadeUp inside
// <svg>, since CSS translateY/clip-path don't work reliably on SVG nodes.
function SvgFadeIn({ duration = 0.4, delay = 0, ease = Easing.easeOutCubic, children }) {
  const { localTime } = useSprite();
  const t = clamp((localTime - delay) / duration, 0, 1);
  const opacity = ease(t);
  return <g style={{ opacity }}>{children}</g>;
}

// ─── SceneChrome ──────────────────────────────────────────────────────────
// Wrapper that provides all per-scene boilerplate: grid background,
// watermark, persistent title block, and corner Manimo mascot.
// Scene authors only pass eyebrow/title/duration and write beat <Sprite>s
// as children — no copying of Background/Watermark/ManimoCorner needed.
//
// Usage:
//   <SceneChrome eyebrow="Scene 2 · intro" title="My Topic" duration={SCENE_DURATION}>
//     <Sprite start={3} end={10}><MyBeat /></Sprite>
//   </SceneChrome>
//
// Props:
//   eyebrow   string   Mono eyebrow line, e.g. "Scene 2 · rotational mechanics"
//   title     string   Serif italic title, e.g. "Moment of Inertia"
//   duration  number   SCENE_DURATION — used as the end time for persistent elements
//   children  node     Beat <Sprite> blocks; rendered on top of all chrome
function SceneChrome({ eyebrow, title, duration, children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at 50% 60%, rgba(244,184,96,0.05), transparent 60%), #0c0a1f',
      position: 'relative', overflow: 'hidden',
      fontFamily: 'var(--font-sans)',
    }}>
      {/* Grid */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="scChromGrid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(232,220,193,0.04)" strokeWidth="1"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#scChromGrid)"/>
      </svg>

      {/* Watermark */}
      <div style={{
        position: 'absolute', top: 24, right: 32, pointerEvents: 'none',
        fontFamily: 'var(--font-serif)', fontSize: 18, fontStyle: 'italic',
        color: 'rgba(232,220,193,0.4)',
      }}>
        Manimo
      </div>

      {/* Title block — fades in at t=1 and persists */}
      {(eyebrow || title) && (
        <Sprite start={1.0} end={duration}>
          <div style={{
            position: 'absolute', left: 48, top: 28,
            display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            {eyebrow && (
              <FadeUp duration={0.4} delay={0} distance={6}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 11,
                  color: 'var(--amber-300)', letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                {eyebrow}
              </FadeUp>
            )}
            {title && (
              <FadeUp duration={0.5} delay={0.2} distance={10}
                style={{
                  fontFamily: 'var(--font-serif)', fontSize: 32,
                  color: 'var(--chalk-100)', fontStyle: 'italic',
                }}>
                {title}
              </FadeUp>
            )}
          </div>
        </Sprite>
      )}

      {/* Corner mascot — bobs in at t=2.2 and stays */}
      <Sprite start={2.2} end={duration}>
        <div style={{ position: 'absolute', left: 24, bottom: 16, width: 110, height: 110 }}>
          <svg width="110" height="110" viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
            <Manimo bob={true} bobAmplitude={3} bobSpeed={2.2}/>
          </svg>
        </div>
      </Sprite>

      {children}
    </div>
  );
}

// ─── Export to global scope ───────────────────────────────────────────────
Object.assign(window, {
  TraceIn, FadeUp, WriteOn, PulseMark, ChalkWipe,
  SvgFadeIn,
  Manimo, ManimoEnter, ChalkTip, Bracket,
  SceneChrome,
});
