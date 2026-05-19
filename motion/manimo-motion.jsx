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
  stroke = 'var(--amber-400)',
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
  color = 'var(--amber-400)',
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
  color = 'var(--amber-400)',
  eyeColor = 'var(--bg-canvas)',
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
function ChalkTip({ x, y, color = 'var(--amber-400)', size = 8, opacity = 1 }) {
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
  color = 'var(--chalk-300)',
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
//   <SceneChrome eyebrow="intro" title="My Topic" duration={SCENE_DURATION}>
//     <Sprite start={3} end={10}><MyBeat /></Sprite>
//   </SceneChrome>
//
// Props:
//   eyebrow   string   Mono eyebrow line, e.g. "rotational mechanics"
//   title     string   Serif italic title, e.g. "Moment of Inertia"
//   duration  number   SCENE_DURATION — used as the end time for persistent elements
//   children  node     Beat <Sprite> blocks; rendered on top of all chrome
// Portrait safe-area insets (in 720×1280 stage coordinates).
// The 9:16 canvas is letterboxed onto narrower-than-9:16 phones (iPhone is
// ~19.5:9) by filling width and cropping height, so chrome flush against
// the top/bottom is hidden by the Dynamic Island, status bar, home
// indicator, and any host-app header/transport. These insets push title +
// mascot + watermark inward so they remain visible on iPhone.
const PORTRAIT_SAFE = { top: 104, bottom: 96, left: 48, right: 48 };

function SceneChrome({
  eyebrow, title, duration,
  // Optional intro: when set, SceneChrome owns Manimo and the intro caption
  // for the entire intro phase. Manimo enters at centre, holds while the
  // viewer reads the caption, then morphs (one continuous element) to the
  // bottom-left corner where she lives for the rest of the scene.
  introEnd, introCaption, introCaptionDelay = 0.7,
  children,
}) {
  const portrait = usePortrait();
  const useJourney = typeof introEnd === 'number' && introEnd > 0;
  // Portrait gets a tighter title block (top of screen, smaller type) and
  // a smaller bottom-right mascot so the centre of the canvas stays free.
  const titleStyle = portrait
    ? { left: PORTRAIT_SAFE.left, right: PORTRAIT_SAFE.right, top: PORTRAIT_SAFE.top, fontTitle: 22, fontEyebrow: 10, gap: 4 }
    : { left: 48, right: 'auto', top: 28, fontTitle: 32, fontEyebrow: 11, gap: 4 };
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

      {/* Watermark — top-right in landscape, bottom-right in portrait so it
          doesn't compete with the title block above. */}
      <div style={{
        position: 'absolute',
        ...(portrait
          ? { right: PORTRAIT_SAFE.right, bottom: PORTRAIT_SAFE.bottom }
          : { right: 32, top: 24 }),
        pointerEvents: 'none',
        fontFamily: 'var(--font-serif)',
        fontSize: portrait ? 14 : 18, fontStyle: 'italic',
        color: 'rgba(232,220,193,0.4)',
      }}>
        Manimo
      </div>

      {/* Title block — fades in at t=1 and persists */}
      {(eyebrow || title) && (
        <Sprite start={1.0} end={duration}>
          <div style={{
            position: 'absolute',
            left: titleStyle.left,
            ...(portrait ? { right: titleStyle.right } : {}),
            top: titleStyle.top,
            display: 'flex', flexDirection: 'column', gap: titleStyle.gap,
          }}>
            {eyebrow && (
              <FadeUp duration={0.4} delay={0} distance={6}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: titleStyle.fontEyebrow,
                  color: 'var(--amber-300)', letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                }}>
                {eyebrow}
              </FadeUp>
            )}
            {title && (
              <FadeUp duration={0.5} delay={0.2} distance={10}
                style={{
                  fontFamily: 'var(--font-serif)', fontSize: titleStyle.fontTitle,
                  color: 'var(--chalk-100)', fontStyle: 'italic',
                  lineHeight: 1.15,
                }}>
                {title}
              </FadeUp>
            )}
          </div>
        </Sprite>
      )}

      {useJourney ? (
        <>
          <JourneyManimo introEnd={introEnd} portrait={portrait}/>
          {introCaption && (
            // Caption must be fully gone before Manimo begins her journey, so
            // the viewer's eye isn't split between two moving things. Anchor
            // its `end` to journey-transition-start (minus a small breath)
            // rather than to introEnd directly.
            <IntroCaption text={introCaption} portrait={portrait}
              start={introCaptionDelay}
              end={journeyTransitionStart(introEnd) - JOURNEY_CAPTION_GAP}/>
          )}
        </>
      ) : (
        /* Legacy corner mascot — pops in at t=2.2 and stays. Used by scenes
           that don't opt into the introEnd journey. */
        <Sprite start={2.2} end={duration}>
          <div style={{
            position: 'absolute',
            left: portrait ? PORTRAIT_SAFE.left : 24,
            bottom: portrait ? PORTRAIT_SAFE.bottom : 16,
            width: portrait ? 78 : 110,
            height: portrait ? 78 : 110,
          }}>
            <svg width={portrait ? 78 : 110} height={portrait ? 78 : 110}
                 viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
              <Manimo bob={true} bobAmplitude={3} bobSpeed={2.2}/>
            </svg>
          </div>
        </Sprite>
      )}

      {children}
    </div>
  );
}

// Shared journey timing — kept at module scope so SceneChrome can size the
// intro caption window without re-deriving the maths.
const JOURNEY_TRANSITION_LEN = 1.5;  // seconds Manimo spends gliding to corner
const JOURNEY_CAPTION_GAP    = 0.15; // breath between caption-gone and Manimo-moving
function journeyTransitionStart(introEnd) {
  return Math.max(0.9, introEnd - JOURNEY_TRANSITION_LEN);
}

// ─── JourneyManimo ────────────────────────────────────────────────────────
// One Manimo for the whole scene: enters at centre, holds while the intro
// caption reads, then glides to the bottom-left corner. Used by SceneChrome
// when a scene passes `introEnd` — replaces the previous "two separate
// Manimos overlap and one disappears" pattern with a single continuous
// element so the viewer's eye tracks her through the transition.
function JourneyManimo({ introEnd, portrait }) {
  const time = useTime();
  const { height } = useTimeline();

  // Pose at the start (centre, large) and end (bottom-left, small).
  const introSize = portrait ? 200 : 160;
  const introCx = portrait ? 360 : 460;
  const introCy = portrait ? 514 : 300;
  const cornerSize = portrait ? 78 : 110;
  const cornerLeft = portrait ? PORTRAIT_SAFE.left : 24;
  const cornerBottom = portrait ? PORTRAIT_SAFE.bottom : 16;
  const cornerCx = cornerLeft + cornerSize / 2;
  const cornerCy = (height || (portrait ? 1280 : 720)) - cornerBottom - cornerSize / 2;

  // Entry: 0..0.7 (ManimoEnter handles its own anim).
  // Hold: 0.7..transitionStart (sits at centre, bobbing).
  // Transition: transitionStart..introEnd (eased lerp to corner).
  // Settled: introEnd..duration (sits at corner, bobbing).
  const transitionStart = journeyTransitionStart(introEnd);
  const tFrac = clamp((time - transitionStart) / Math.max(0.001, introEnd - transitionStart), 0, 1);
  const eased = Easing.easeInOutCubic(tFrac);

  const x = introCx + (cornerCx - introCx) * eased;
  const y = introCy + (cornerCy - introCy) * eased;
  const size = introSize + (cornerSize - introSize) * eased;
  const useEnter = time < 0.9;

  return (
    <div style={{
      position: 'absolute',
      left: x - size / 2, top: y - size / 2,
      width: size, height: size,
      pointerEvents: 'none',
      // pixel-perfect sizing as we scale; suppress any sub-pixel jitter
      willChange: 'left, top, width, height',
    }}>
      <svg width={size} height={size} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        {useEnter
          ? <ManimoEnter duration={0.7} bob={true} bobAmplitude={3} bobSpeed={2.2}/>
          : <Manimo bob={true} bobAmplitude={3} bobSpeed={2.2}/>}
      </svg>
    </div>
  );
}

// ─── IntroCaption ─────────────────────────────────────────────────────────
// The serif italic line that flanks Manimo during the intro. Fades up at
// `start`, fades out as the journey transition begins, and unmounts at
// `end`. Positioned next to the JourneyManimo's hold pose so the two read
// as a pair.
function IntroCaption({ text, portrait, start, end }) {
  const time = useTime();
  if (time < start || time > end) return null;

  const fadeIn  = clamp((time - start) / 0.5, 0, 1);
  const fadeOut = clamp((end - time) / 0.4, 0, 1);
  const opacity = fadeIn * fadeOut;

  // Position next to JourneyManimo's hold pose:
  //   landscape: right of Manimo, vertically aligned.
  //   portrait:  below Manimo, horizontally centred.
  const style = portrait
    ? {
        position: 'absolute',
        left: 360, top: 720,
        transform: 'translate(-50%, 0)',
        textAlign: 'center',
        maxWidth: 520,
      }
    : {
        position: 'absolute',
        left: 560, top: 300,
        transform: 'translate(0, -50%)',
        textAlign: 'left',
        maxWidth: 460,
      };

  return (
    <div style={{
      ...style,
      opacity,
      fontFamily: 'var(--font-serif)',
      fontStyle: 'italic',
      fontSize: portrait ? 30 : 26,
      color: 'var(--chalk-100)',
      lineHeight: 1.25,
      pointerEvents: 'none',
    }}>
      {text}
    </div>
  );
}

// ─── SceneNarration ───────────────────────────────────────────────────────
// Plays scene narration audio in sync with Stage time. Two modes:
//
// Single-track (recommended) — one continuous MP3 covering the whole scene,
// produced by `npm run audio <scene-id>`. Reads more naturally because the
// TTS model handles pauses between sentences itself.
//
//   <SceneNarration src="audio/spring-oscillation/scene.mp3" />
//
// Per-beat (legacy) — one MP3 per beat, switched as the playhead crosses
// each beat's `start`. Allows partial regeneration of individual beats
// but the join points feel choppy because each clip has its own padding
// silence.
//
//   <SceneNarration tracks={[
//     { start: 0.2,  src: 'audio/spring-oscillation/manimoIntro.mp3' },
//     { start: 3.5,  src: 'audio/spring-oscillation/hookesLaw.mp3' },
//   ]}/>
//
// Browser autoplay policy blocks audio.play() until the user has interacted
// with the page. The PlaybackBar play button counts as interaction, so audio
// starts the moment the user clicks play.
function SceneNarration({ src, tracks, volume = 1, playbackRate = 1 }) {
  const { time, playing } = useTimeline();
  const singleRef = React.useRef(null);
  const trackRefs = React.useRef([]);
  // Track previous frame's state so we only re-seek on actual scrubs or
  // play/pause edges — not on every frame's small natural drift, which
  // would manifest as audible clicks/stutters ("lagging").
  const prevRef = React.useRef({ time: 0, playing: false, activeIdx: -1 });

  // Per-beat mode: figure out which clip should currently be audible.
  let activeIdx = -1;
  if (tracks) {
    for (let i = 0; i < tracks.length; i++) {
      if (time >= tracks[i].start) activeIdx = i;
    }
  }

  React.useEffect(() => {
    const prev = prevRef.current;
    // A "jump" is a backwards step (loop wrap or rewind) or a forward
    // step bigger than a frame's worth of dt — i.e. a user scrub.
    const jumped = time < prev.time || (time - prev.time) > 0.5;
    const justStarted = playing && !prev.playing;

    // Single-track mode
    if (src) {
      const audio = singleRef.current;
      if (audio) {
        if (audio.volume !== volume) audio.volume = volume;
        if (audio.playbackRate !== playbackRate) audio.playbackRate = playbackRate;
        const expectedAudio = time * playbackRate;
        // Once a scene's audio is shorter than its visual duration, we have
        // tail silence. Browsers reset currentTime to 0 when play() is
        // called after `ended`, so the next effect tick would restart the
        // intro audibly. Treat past-end as "stay quiet."
        const audioEnd = isFinite(audio.duration) ? audio.duration : Infinity;
        const pastAudioEnd = expectedAudio >= audioEnd - 0.05;

        if (playing && !pastAudioEnd) {
          // Only re-seek on scrubs / loop wraps / fresh play. During steady
          // playback, let the audio clock coast — forcing currentTime each
          // frame causes audible glitches even when the new value is
          // identical because the browser re-decodes the seek target.
          if ((jumped || justStarted) && Math.abs(audio.currentTime - expectedAudio) > 0.1) {
            try { audio.currentTime = Math.max(0, expectedAudio); } catch {}
          }
          if (audio.paused) audio.play().catch(() => { /* autoplay blocked, retries on next gesture */ });
        } else if (playing && pastAudioEnd) {
          if (!audio.paused) audio.pause();
        } else {
          if (!audio.paused) audio.pause();
          // While paused, keep audio aligned so scrubbing in the timeline
          // updates which sentence we'd resume on.
          if (Math.abs(audio.currentTime - expectedAudio) > 0.1) {
            try { audio.currentTime = Math.max(0, expectedAudio); } catch {}
          }
        }
      }
    }

    // Per-beat mode
    if (tracks) {
      trackRefs.current.forEach((audio, i) => {
        if (!audio) return;
        if (audio.volume !== volume) audio.volume = volume;
        if (i !== activeIdx) {
          if (!audio.paused) audio.pause();
          return;
        }
        const localT = time - tracks[i].start;
        const switchedClip = prev.activeIdx !== activeIdx;
        if ((jumped || justStarted || switchedClip)
            && Math.abs(audio.currentTime - localT) > 0.1) {
          try { audio.currentTime = Math.max(0, localT); } catch {}
        }
        if (playing) {
          if (audio.paused) audio.play().catch(() => {});
        } else if (!audio.paused) {
          audio.pause();
        }
      });
    }

    prevRef.current = { time, playing, activeIdx };
  });

  return (
    <>
      {src && <audio ref={singleRef} src={src} preload="auto" />}
      {tracks && tracks.map((t, i) => (
        <audio
          key={t.src}
          ref={el => (trackRefs.current[i] = el)}
          src={t.src}
          preload="auto"
        />
      ))}
    </>
  );
}

// ─── RollingWheel ─────────────────────────────────────────────────────────
// Wheel that rolls along a 2D direction with rotation tied to translation
// (rolling without slipping → angle = distance / R). Use for hoops, disks,
// rolling masses, balls down ramps, anything where seeing the spoke turn is
// the whole point.
//
// Position is controlled by `cx`/`cy` (start centre, in svg coords),
// `dirX`/`dirY` (unit vector along motion), and `distance` (svg units to
// roll over `duration`). Easing defaults to easeInQuad to mimic gravity.
// `type` picks between 'hoop' (ring outline + spoke) and 'disk' (filled
// circle + contrasting spoke).
//
// Wrap with <SvgFadeIn> if you want it to appear gradually before rolling.
function RollingWheel({
  cx, cy,
  dirX, dirY,
  distance,
  R = 24,
  type = 'hoop', // 'hoop' | 'disk'
  color = 'var(--amber-400)',
  spokeColor = null, // null → auto: same as color for hoop, bg-canvas for disk
  duration = 2,
  delay = 0,
  ease = Easing.easeInQuad,
  strokeWidth = 3,
}) {
  const { localTime } = useSprite();
  const t = clamp((localTime - delay) / duration, 0, 1);
  const eased = ease(t);
  const d = eased * distance;
  const x = cx + d * dirX;
  const y = cy + d * dirY;
  // Sign matches direction of travel along the ramp surface; SVG y-down
  // means a wheel moving with positive (dirX, dirY) rotates with positive
  // angle visually (clockwise on screen).
  const angleDeg = (d / R) * (180 / Math.PI);
  const sColor = spokeColor != null
    ? spokeColor
    : (type === 'disk' ? 'var(--bg-canvas)' : color);
  return (
    <g transform={`translate(${x} ${y})`}>
      <g transform={`rotate(${angleDeg})`}>
        {type === 'disk' ? (
          <circle cx={0} cy={0} r={R}
                  fill={color} opacity={0.85}
                  stroke={color} strokeWidth={1}/>
        ) : (
          <circle cx={0} cy={0} r={R}
                  fill="none" stroke={color} strokeWidth={strokeWidth}/>
        )}
        {/* spoke from centre to rim — makes rotation visible */}
        <line x1={0} y1={0} x2={R} y2={0}
              stroke={sColor} strokeWidth={2.5} strokeLinecap="round"/>
        <circle cx={0} cy={0} r={2.5} fill={sColor}/>
      </g>
    </g>
  );
}

// ─── Pendulum (render-only) ───────────────────────────────────────────────
// Pure renderer for a pendulum at a given angle. No motion logic — pass
// `angle` in degrees (positive = swung to the right of vertical) and it
// draws the string + bob + optional pivot bracket. Use this directly when
// you need custom motion (e.g. release-from-rest, narration-synced pull,
// scrubbing); use <SwingingPendulum> for steady SHM.
function Pendulum({
  pivX, pivY,
  L,
  angle = 0, // degrees, signed
  bobR = 16,
  color = 'var(--amber-400)',
  bobLabel = null, // optional text inside the bob (e.g. "m")
  bobLabelColor = 'var(--bg-canvas)',
  showPivot = true,
  showString = true,
  showBob = true,
  stringWidth = 2.5,
}) {
  const rad = angle * Math.PI / 180;
  const bobX = pivX + L * Math.sin(rad);
  const bobY = pivY + L * Math.cos(rad);
  return (
    <g>
      {showPivot && (
        <g>
          <line x1={pivX - 36} y1={pivY} x2={pivX + 36} y2={pivY}
                stroke="var(--chalk-300)" strokeWidth={2.2}/>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line key={i}
                  x1={pivX - 32 + i * 13} y1={pivY}
                  x2={pivX - 44 + i * 13} y2={pivY - 12}
                  stroke="var(--chalk-300)" strokeWidth={1}/>
          ))}
          <circle cx={pivX} cy={pivY} r={2.5} fill="var(--chalk-200)"/>
        </g>
      )}
      {showString && (
        <line x1={pivX} y1={pivY} x2={bobX} y2={bobY}
              stroke={color} strokeWidth={stringWidth}/>
      )}
      {showBob && (
        <g>
          <circle cx={bobX} cy={bobY} r={bobR}
                  fill={color} opacity={0.92}
                  stroke={color} strokeWidth={1.5}/>
          {bobLabel != null && (
            <text x={bobX} y={bobY + bobR * 0.34} textAnchor="middle"
                  fill={bobLabelColor} fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={Math.round(bobR * 1.05)}>
              {bobLabel}
            </text>
          )}
        </g>
      )}
    </g>
  );
}

// ─── SwingingPendulum ─────────────────────────────────────────────────────
// Drives <Pendulum>'s angle with simple-harmonic motion:
//   θ(t) = maxAngle · cos(2π · ((localTime − delay) / period + phase))
// so at localTime = delay it sits at +maxAngle (released from rest), then
// swings as one full period takes `period` seconds. Use `phase` (0..1) to
// offset where in the cycle the swing starts.
//
// Wrap with <SvgFadeIn> if you want it to appear gradually.
function SwingingPendulum({
  pivX, pivY,
  L,
  maxAngle = 18, // degrees
  period = 2.0,  // seconds for a full swing
  phase = 0,     // 0..1, fraction of period offset
  delay = 0,     // seconds within the parent Sprite before motion starts
  ...pendulumProps
}) {
  const { localTime } = useSprite();
  const t = Math.max(0, localTime - delay);
  const angle = maxAngle * Math.cos(2 * Math.PI * (t / period + phase));
  return (
    <Pendulum pivX={pivX} pivY={pivY} L={L} angle={angle} {...pendulumProps}/>
  );
}

// ─── Export to global scope ───────────────────────────────────────────────
Object.assign(window, {
  TraceIn, FadeUp, WriteOn, PulseMark, ChalkWipe,
  SvgFadeIn,
  Manimo, ManimoEnter, ChalkTip, Bracket,
  RollingWheel,
  Pendulum, SwingingPendulum,
  SceneChrome, SceneNarration,
});
