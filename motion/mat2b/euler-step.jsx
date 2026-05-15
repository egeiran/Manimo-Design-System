// Euler's Method: Tangent Steps Along a Slope Field — Manimo lesson scene.
// Chapter 4 / week 9 of mat2b. Walks the explicit Euler method on a concrete
// ODE so the geometry — "follow the tangent, take a step, look around" — is
// inseparable from the formula  y_{n+1} = y_n + h · f(t_n, y_n).
//
// Concrete ODE used:
//   y' = y − t       (linear, slope field tilts up-right for y > t)
//   Exact solution from y(0) = 0.4 is  y(t) = t + 1 − 0.6 e^t  (irrelevant —
//   we just integrate the slope field with a tiny stepper to draw the truth
//   curve, so the scene works for any choice of f without symbolic work.)
//
// Beats:
//   0– 4   Manimo hook
//   4–12   Slope field + the true curve drawn through it
//  12–23   Small-h Euler march — polyline hugs the curve
//  23–32   Large-h Euler march — drifts off, error fan
//  32–end  Hero outro
//
// Sprite ranges are placeholder until `npm run audio` rewires.
//
// Colour discipline:
//   chalk-300  slope-field strokes
//   chalk-200  axes
//   violet-400 true solution curve (the reference)
//   amber-400  small-h Euler steps (close to truth)
//   rose-400   large-h Euler steps (drifting off)
//   emerald-400 success accents
//   amber-300  takeaway accent

const SCENE_DURATION = 41;

const NARRATION = [
  "How do you draw a curve when you only know its slope at every point? Walk it.",
  "Here is a slope field for y prime equals f of t comma y. At every grid point a little tangent shows which way the solution heads.",
  "Pick a starting point. Step forward by a small amount h, following the tangent. From the new spot, read the new tangent, and step again.",
  "Make h bigger and the polyline starts to drift away from the true curve. The error fan opens because each tangent only knows the starting point of its step.",
  "Euler's method trades exact for explicit. Smaller steps follow truer curves — at the cost of doing more work.",
];

const NARRATION_AUDIO = 'audio/euler-step/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 320;
const ORIGIN_Y = 500;
const UNIT_X = 80;      // 1 unit of t
const UNIT_Y = 80;      // 1 unit of y
const T_MIN = 0, T_MAX = 5;
const Y_MIN = -1, Y_MAX = 3;

// The ODE: y' = f(t, y). Slope is tilted but stays bounded over our window.
function f(t, y) {
  return y - t + 0.4;
}
const Y0 = 0.4;          // initial condition at t = 0

function toSvg(t, y) {
  return { sx: ORIGIN_X + t * UNIT_X, sy: ORIGIN_Y - y * UNIT_Y };
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="40%" cy="60%" r="62%">
          <stop offset="55%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1280" height="720" fill={`url(#${gradId})`}/>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>{children}</g>
    </svg>
  );
}

function Axes() {
  const ax0 = toSvg(T_MIN, 0), ax1 = toSvg(T_MAX, 0);
  const ay0 = toSvg(0, Y_MIN), ay1 = toSvg(0, Y_MAX);
  return (
    <g>
      <line x1={ax0.sx} y1={ax0.sy} x2={ax1.sx} y2={ax1.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={ay0.sx} y1={ay0.sy} x2={ay1.sx} y2={ay1.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <text x={ax1.sx + 12} y={ax1.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>t</text>
      <text x={ay1.sx - 18} y={ay1.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>y</text>
    </g>
  );
}

// Slope field — short tangent strokes at a coarse grid.
function SlopeField({ density = 0.5, opacity = 0.55 }) {
  const strokes = [];
  const strokeLen = 22;
  for (let t = T_MIN + density / 2; t < T_MAX; t += density) {
    for (let y = Y_MIN + density / 2; y < Y_MAX; y += density) {
      const slope = f(t, y);
      const ang = Math.atan(slope);
      const c = toSvg(t, y);
      const dx = (strokeLen / 2) * Math.cos(ang);
      const dy = -(strokeLen / 2) * Math.sin(ang); // svg y inverted
      strokes.push(
        <line key={`${t.toFixed(2)}-${y.toFixed(2)}`}
              x1={c.sx - dx} y1={c.sy - dy}
              x2={c.sx + dx} y2={c.sy + dy}
              stroke="var(--chalk-300)" strokeWidth={1.3}
              strokeLinecap="round" opacity={opacity}/>
      );
    }
  }
  return <g>{strokes}</g>;
}

// True solution from y(0) = Y0 — integrated with a tiny RK2 stepper so we
// don't need a closed-form solver. Returns polyline path string.
function trueCurvePath(steps = 200) {
  const dt = (T_MAX - T_MIN) / steps;
  let t = T_MIN, y = Y0;
  const pts = [];
  pts.push(toSvg(t, y));
  for (let i = 0; i < steps; i++) {
    const k1 = f(t, y);
    const k2 = f(t + dt / 2, y + (dt / 2) * k1);
    y = y + dt * k2;
    t = t + dt;
    pts.push(toSvg(t, y));
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

// Euler steps array — [{t, y, dy}, ...].
function eulerPath(h, nMax = 1000) {
  const steps = [];
  let t = T_MIN, y = Y0;
  steps.push({ t, y, dy: f(t, y) });
  for (let i = 0; i < nMax && t < T_MAX - 1e-9; i++) {
    const slope = f(t, y);
    y = y + h * slope;
    t = t + h;
    steps.push({ t, y, dy: f(t, y) });
  }
  return steps;
}

function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom, transform }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined, transform }
    : { right, top, transform };
  return (
    <div style={{
      position: 'absolute', width,
      ...positioning,
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: 14,
    }}>
      {children}
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="numerical ODEs"
      title="Euler's Method: Tangent Steps"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.8}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.8} end={13.67}>
        <SlopeFieldBeat/>
      </Sprite>

      <Sprite start={13.67} end={23.05}>
        <SmallStepBeat/>
      </Sprite>

      <Sprite start={23.05} end={32.43}>
        <BigStepBeat/>
      </Sprite>

      <Sprite start={32.43} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 22,
    }}>
      <svg width={170} height={170} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)',
          maxWidth: '24ch', lineHeight: 1.3,
        }}>
        Walk the slope field.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Slope field + truth ──────────────────────────────────────────
function SlopeFieldBeat() {
  const { localTime } = useSprite();
  const truePath = trueCurvePath();
  // The true curve traces in over ~3 s once slope field has appeared.
  const trueProgress = clamp((localTime - 1.2) / 3.0, 0, 1);

  return (
    <>
      <GridMaskedSvg maskId="euler-slope-mask">
        <SvgFadeIn duration={0.5} delay={0.0}><Axes/></SvgFadeIn>
        <SvgFadeIn duration={0.7} delay={0.3}>
          <SlopeField density={0.5}/>
        </SvgFadeIn>

        {/* True curve revealed by stroke-dashoffset trick. */}
        {trueProgress > 0 && (
          <path d={truePath}
                fill="none" stroke="var(--violet-400)"
                strokeWidth={3.2} strokeLinecap="round"
                strokeDasharray="2000"
                strokeDashoffset={2000 * (1 - trueProgress)}/>
        )}
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>slope field</FadeUp>
        <FadeUp duration={0.6} delay={0.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Every point whispers <br/>which way to walk.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--violet-400)', letterSpacing: '0.06em',
            marginTop: 6,
          }}>
          y′ = f(t, y)
        </FadeUp>
        <FadeUp duration={0.5} delay={4.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          The violet curve is the exact solution — what we want to approximate.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Small-h Euler march ──────────────────────────────────────────
function SmallStepBeat() {
  const { localTime, duration: spriteDur } = useSprite();
  const truePath = trueCurvePath();

  const h = 0.25;
  const steps = eulerPath(h);

  // Reveal one Euler step every ~0.55 s, after a short pause.
  const stepDelay = 0.4;
  const stepInterval = 0.55;
  const revealCount = Math.max(0, Math.floor((localTime - stepDelay) / stepInterval) + 1);
  const visibleSteps = steps.slice(0, Math.min(revealCount, steps.length));

  // Build a polyline from visible steps.
  const polylinePoints = visibleSteps.map(s => {
    const p = toSvg(s.t, s.y);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');

  return (
    <>
      <GridMaskedSvg maskId="euler-small-mask">
        <Axes/>
        <SlopeField density={0.5} opacity={0.32}/>

        {/* Faded true curve. */}
        <path d={truePath}
              fill="none" stroke="var(--violet-400)"
              strokeWidth={2.6} strokeLinecap="round" opacity={0.6}/>

        {/* Euler polyline. */}
        {visibleSteps.length > 1 && (
          <polyline points={polylinePoints}
                    fill="none" stroke="var(--amber-400)"
                    strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Euler dots. */}
        {visibleSteps.map((s, i) => {
          const p = toSvg(s.t, s.y);
          return (
            <circle key={i} cx={p.sx} cy={p.sy} r={5.5}
                    fill="var(--amber-400)" stroke="var(--chalk-100)"
                    strokeWidth={1}/>
          );
        })}

        {/* Highlight the most recent step's tangent in chalk-100 to emphasise
            "the slope you just used". */}
        {visibleSteps.length >= 2 && (() => {
          const last = visibleSteps[visibleSteps.length - 2];
          const slope = last.dy;
          const a = toSvg(last.t, last.y);
          const b = toSvg(last.t + h, last.y + h * slope);
          return (
            <g>
              <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                    stroke="var(--emerald-400)" strokeWidth={2.0}
                    strokeLinecap="round" strokeDasharray="5 4" opacity={0.85}/>
            </g>
          );
        })()}
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>small h — close walk</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 4,
          }}>
          <span style={{ color: 'var(--amber-400)' }}>y<sub>n+1</sub></span>
          &nbsp;=&nbsp;
          <span style={{ color: 'var(--amber-400)' }}>y<sub>n</sub></span>
          &nbsp;+&nbsp;h · f(t<sub>n</sub>, y<sub>n</sub>)
        </FadeUp>

        <FadeUp duration={0.5} delay={2.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Each step uses the local slope <br/>and walks h ahead.
        </FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--emerald-400)', letterSpacing: '0.08em',
          }}>
          h = 0.25 → polyline hugs the truth
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Big-h Euler march ────────────────────────────────────────────
function BigStepBeat() {
  const { localTime } = useSprite();
  const truePath = trueCurvePath();

  const h = 1.0;
  const steps = eulerPath(h);

  const stepDelay = 0.4;
  const stepInterval = 0.9;
  const revealCount = Math.max(0, Math.floor((localTime - stepDelay) / stepInterval) + 1);
  const visibleSteps = steps.slice(0, Math.min(revealCount, steps.length));

  const polylinePoints = visibleSteps.map(s => {
    const p = toSvg(s.t, s.y);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');

  return (
    <>
      <GridMaskedSvg maskId="euler-big-mask">
        <Axes/>
        <SlopeField density={0.5} opacity={0.28}/>

        {/* True curve, full. */}
        <path d={truePath}
              fill="none" stroke="var(--violet-400)"
              strokeWidth={2.6} strokeLinecap="round" opacity={0.75}/>

        {/* Error connectors at each big-step node — drop a faint rose line
            to the corresponding point on the truth (same t). */}
        {visibleSteps.length >= 2 && visibleSteps.slice(1).map((s, i) => {
          // Find truth at this t by tiny RK2 from start.
          let tt = T_MIN, ty = Y0;
          const sub = 50;
          const dt = (s.t - T_MIN) / sub;
          for (let k = 0; k < sub; k++) {
            const k1 = f(tt, ty);
            const k2 = f(tt + dt / 2, ty + (dt / 2) * k1);
            ty = ty + dt * k2;
            tt = tt + dt;
          }
          const a = toSvg(s.t, s.y);
          const b = toSvg(s.t, ty);
          return (
            <line key={i} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                  stroke="var(--rose-400)" strokeWidth={1.6}
                  strokeDasharray="4 4" opacity={0.7}/>
          );
        })}

        {visibleSteps.length > 1 && (
          <polyline points={polylinePoints}
                    fill="none" stroke="var(--rose-400)"
                    strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {visibleSteps.map((s, i) => {
          const p = toSvg(s.t, s.y);
          return (
            <circle key={i} cx={p.sx} cy={p.sy} r={6}
                    fill="var(--rose-400)" stroke="var(--chalk-100)"
                    strokeWidth={1}/>
          );
        })}
      </GridMaskedSvg>

      <SoftPanel right={64} top={220} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>big h — drift opens</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Each tangent is correct only at its starting point.
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Make h big and the path drifts off — error fans out step by step.
        </FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--rose-400)', letterSpacing: '0.08em',
          }}>
          h = 1.0 → drift grows like h
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: Hero outro ───────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 980, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>euler's explicit method</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 50, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        y<sub>n+1</sub> = y<sub>n</sub> + <span style={{ color: 'var(--amber-300)' }}>h</span> · f(t<sub>n</sub>, y<sub>n</sub>)
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
          Trade exact for explicit. <br/>Smaller h, truer curve, more work.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        first-order accurate — global error grows like h
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
