// Euler vs RK4: Same Step Size, Different Curves — Manimo lesson scene.
// Chapter 4 / week 10 of mat2b. Pairs with `euler-step`: same ODE, same h,
// but classical Runge-Kutta uses four slope samples per step and lands on
// top of the true curve while Euler drifts.
//
// Concrete ODE (reused from euler-step):
//   y' = y − t + 0.4
//   y(0) = 0.4
//
// Beats:
//   0– 4.8   Manimo hook
//   4.8–16   Side-by-side: Euler drifts (left) vs RK4 hugs the truth (right)
//   16–26    Zoom: the four slope samples inside one RK4 step
//   26–35    Log-log error plot — slopes 1 and 4
//   35–end   Hero outro
//
// Sprite ranges are placeholder until `npm run audio` rewires.
//
// Colour discipline:
//   chalk-300   slope-field strokes, faint reference grid
//   chalk-200   axes
//   violet-400  the true solution curve (the reference)
//   rose-400    Euler march / Euler error line
//   emerald-400 RK4 march / RK4 error line / "verified" accent
//   amber-400   live highlight: the slope sample currently being read
//   amber-300   takeaway accent

const SCENE_DURATION = 53;

const NARRATION = [
  "Same problem. Same step size. Why does one method hug the curve while the other drifts?",
  "On the left, Euler walks one tangent per step. On the right, R K four samples four slopes per step and averages them. With the same step size, R K four lands almost on the true curve.",
  "Inside one R K four step: sample the slope at the start, twice in the middle, and once at the end. The next point is the start plus h times a weighted average of these four slopes.",
  "Halve the step size. Euler's error halves. R K four's error drops by a factor of sixteen. On a log log plot of error against step size, the slopes are one and four — the orders of the two methods.",
  "More work per step buys you a much faster fall in error. For the same accuracy, higher order means fewer steps.",
];

const NARRATION_AUDIO = 'audio/euler-vs-rk4/scene.mp3';

// ─── ODE + integrators ─────────────────────────────────────────────────────
function f(t, y) { return y - t + 0.4; }
const Y0 = 0.4;
const T_MIN = 0, T_MAX = 5;
const Y_MIN = -1, Y_MAX = 3;

// Reference truth via tiny RK2 (visually indistinguishable from the analytic
// solution at this scale; saves a closed-form solver).
function truePolylinePoints(originX, originY, unitX, unitY, steps = 200) {
  const dt = (T_MAX - T_MIN) / steps;
  let t = T_MIN, y = Y0;
  const pts = [];
  pts.push({ sx: originX + t * unitX, sy: originY - y * unitY });
  for (let i = 0; i < steps; i++) {
    const k1 = f(t, y);
    const k2 = f(t + dt / 2, y + (dt / 2) * k1);
    y = y + dt * k2;
    t = t + dt;
    pts.push({ sx: originX + t * unitX, sy: originY - y * unitY });
  }
  return pts;
}
function pointsToPath(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

function eulerPath(h) {
  let t = T_MIN, y = Y0;
  const out = [{ t, y }];
  while (t < T_MAX - 1e-9) {
    y = y + h * f(t, y);
    t = t + h;
    out.push({ t, y });
  }
  return out;
}
function rk4Path(h) {
  let t = T_MIN, y = Y0;
  const out = [{ t, y }];
  while (t < T_MAX - 1e-9) {
    const k1 = f(t, y);
    const k2 = f(t + h / 2, y + (h / 2) * k1);
    const k3 = f(t + h / 2, y + (h / 2) * k2);
    const k4 = f(t + h, y + h * k3);
    y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
    t = t + h;
    out.push({ t, y });
  }
  return out;
}

// Truth value at a given t for error comparison.
function truthAt(tEnd, sub = 200) {
  let t = T_MIN, y = Y0;
  const dt = (tEnd - T_MIN) / sub;
  for (let i = 0; i < sub; i++) {
    const k1 = f(t, y);
    const k2 = f(t + dt / 2, y + (dt / 2) * k1);
    y = y + dt * k2;
    t = t + dt;
  }
  return y;
}

// ─── Shared SVG helpers ───────────────────────────────────────────────────
function GridMaskedSvg({ maskId, cx = '48%', cy = '54%', r = '60%', children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx={cx} cy={cy} r={r}>
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

// One small slope-and-axes panel (re-used left/right in beat 2).
function MiniPanel({ originX, originY, unitX, unitY, color, polyline, label, dotsColor }) {
  // Axes
  const ax0 = { sx: originX + T_MIN * unitX, sy: originY };
  const ax1 = { sx: originX + T_MAX * unitX, sy: originY };
  const ay0 = { sx: originX, sy: originY - Y_MIN * unitY };
  const ay1 = { sx: originX, sy: originY - Y_MAX * unitY };

  const truth = truePolylinePoints(originX, originY, unitX, unitY);
  const truthPath = pointsToPath(truth);

  const polyPts = polyline.map(s => ({
    sx: originX + s.t * unitX, sy: originY - s.y * unitY,
  }));
  const polyStr = polyPts.map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`).join(' ');

  return (
    <g>
      {/* axes */}
      <line x1={ax0.sx} y1={ax0.sy} x2={ax1.sx} y2={ax1.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={ay0.sx} y1={ay0.sy} x2={ay1.sx} y2={ay1.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>

      {/* truth */}
      <path d={truthPath} fill="none" stroke="var(--violet-400)"
            strokeWidth={2.6} strokeLinecap="round" opacity={0.85}/>

      {/* march polyline */}
      <polyline points={polyStr} fill="none" stroke={color}
                strokeWidth={3.0} strokeLinecap="round" strokeLinejoin="round"/>

      {/* dots */}
      {polyPts.map((p, i) => (
        <circle key={i} cx={p.sx} cy={p.sy} r={4.5}
                fill={dotsColor || color} stroke="var(--chalk-100)" strokeWidth={0.8}/>
      ))}

      {/* label */}
      <text x={originX + 12} y={originY - Y_MAX * unitY - 14}
            fill={color} fontFamily="var(--font-mono)"
            fontSize={13} letterSpacing="0.12em"
            style={{ textTransform: 'uppercase' }}>
        {label}
      </text>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="numerical ODEs"
      title="Euler vs RK4"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={6.1}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={6.1} end={18.82}>
        <TwoMarchesBeat/>
      </Sprite>

      <Sprite start={18.82} end={30.99}>
        <RK4SamplingBeat/>
      </Sprite>

      <Sprite start={30.99} end={44.3}>
        <LogLogErrorBeat/>
      </Sprite>

      <Sprite start={44.3} end={SCENE_DURATION}>
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
        Same h. Two methods.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Side-by-side — Euler drifts vs RK4 hugs ──────────────────────
function TwoMarchesBeat() {
  const { localTime } = useSprite();
  // Step size chosen so Euler visibly drifts but RK4 still hugs at the eye scale.
  const h = 1.0;
  const eulerSteps = eulerPath(h);
  const rk4Steps = rk4Path(h);

  const stepDelay = 0.6;
  const stepInterval = 0.9;
  const revealCount = Math.max(0, Math.floor((localTime - stepDelay) / stepInterval) + 1);
  const visEuler = eulerSteps.slice(0, Math.min(revealCount, eulerSteps.length));
  const visRk4 = rk4Steps.slice(0, Math.min(revealCount, rk4Steps.length));

  // Left panel coords.
  const L_ORIG_X = 130, L_ORIG_Y = 540, L_UX = 90, L_UY = 90;
  // Right panel coords.
  const R_ORIG_X = 700, R_ORIG_Y = 540, R_UX = 90, R_UY = 90;

  return (
    <>
      <GridMaskedSvg maskId="ervsrk-twomarch-mask" cx="42%" cy="62%" r="62%">
        <SvgFadeIn duration={0.5} delay={0.0}>
          <MiniPanel
            originX={L_ORIG_X} originY={L_ORIG_Y}
            unitX={L_UX} unitY={L_UY}
            color="var(--rose-400)"
            polyline={visEuler}
            label="euler — h = 1.0"
          />
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.4}>
          <MiniPanel
            originX={R_ORIG_X} originY={R_ORIG_Y}
            unitX={R_UX} unitY={R_UY}
            color="var(--emerald-400)"
            polyline={visRk4}
            label="rk4 — h = 1.0"
          />
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={140} width={360}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>same step size</FadeUp>
        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          One tangent per step <br/>
          versus four slopes averaged.
        </FadeUp>
        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          The violet curve is the truth. <br/>
          <span style={{ color: 'var(--rose-400)' }}>Rose</span> drifts. <span style={{ color: 'var(--emerald-400)' }}>Emerald</span> hugs.
        </FadeUp>
        <FadeUp duration={0.5} delay={6.0} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--emerald-400)', letterSpacing: '0.08em',
          }}>
          rk4: four samples, one step
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: One RK4 step — four slope samples ────────────────────────────
function RK4SamplingBeat() {
  const { localTime } = useSprite();

  // Diagram coordinates centered on a single step from t=1.2 to t=2.2.
  const ORIG_X = 220, ORIG_Y = 460, UX = 280, UY = 140;
  const t0 = 1.2, h = 1.0;
  const y0 = 1.05; // hand-picked so the step lands in a visually clean spot
  const k1 = f(t0, y0);
  const k2 = f(t0 + h / 2, y0 + (h / 2) * k1);
  const k3 = f(t0 + h / 2, y0 + (h / 2) * k2);
  const k4 = f(t0 + h, y0 + h * k3);
  const yNext = y0 + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);

  function pt(t, y) {
    return { sx: ORIG_X + (t - t0) * UX, sy: ORIG_Y - (y - 0.5) * UY };
  }

  // Reveal samples one-by-one.
  const samples = [
    { name: 'k₁', t: t0,        y: y0,                       slope: k1, color: 'var(--amber-400)',  reveal: 0.6 },
    { name: 'k₂', t: t0 + h / 2, y: y0 + (h / 2) * k1,        slope: k2, color: 'var(--amber-300)',  reveal: 1.6 },
    { name: 'k₃', t: t0 + h / 2, y: y0 + (h / 2) * k2,        slope: k3, color: 'var(--chalk-100)',  reveal: 2.6 },
    { name: 'k₄', t: t0 + h,    y: y0 + h * k3,               slope: k4, color: 'var(--violet-400)', reveal: 3.6 },
  ];

  const start = pt(t0, y0);
  const end = pt(t0 + h, yNext);
  const stepRevealT = clamp((localTime - 5.0) / 0.8, 0, 1);

  // Build a longer slope segment around each sample point for visibility.
  const tickLen = 90;
  function slopeStroke(sample) {
    const c = pt(sample.t, sample.y);
    const ang = Math.atan(sample.slope * (UY / UX));
    const dx = (tickLen / 2) * Math.cos(ang);
    const dy = -(tickLen / 2) * Math.sin(ang);
    return { x1: c.sx - dx, y1: c.sy - dy, x2: c.sx + dx, y2: c.sy + dy, center: c };
  }

  return (
    <>
      <GridMaskedSvg maskId="ervsrk-rk4-mask" cx="32%" cy="58%" r="58%">
        {/* Axes for this zoom */}
        <line x1={ORIG_X - 30} y1={ORIG_Y + 30}
              x2={ORIG_X + UX * 1.15} y2={ORIG_Y + 30}
              stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round"/>
        <line x1={ORIG_X - 30} y1={ORIG_Y + 30}
              x2={ORIG_X - 30} y2={ORIG_Y - UY * 1.2}
              stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round"/>

        {/* Vertical guides at t0 and t0+h */}
        <line x1={start.sx} y1={ORIG_Y + 30} x2={start.sx} y2={ORIG_Y - UY * 1.05}
              stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4" opacity={0.55}/>
        <line x1={end.sx}   y1={ORIG_Y + 30} x2={end.sx}   y2={ORIG_Y - UY * 1.05}
              stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4" opacity={0.55}/>

        <text x={start.sx - 6} y={ORIG_Y + 52}
              fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={14}>
          t<tspan dy="3" fontSize="11">n</tspan>
        </text>
        <text x={end.sx - 14} y={ORIG_Y + 52}
              fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={14}>
          t<tspan dy="3" fontSize="11">n</tspan><tspan dy="-3"> + h</tspan>
        </text>

        {/* Truth segment over this interval */}
        {(() => {
          const N = 30;
          const dt = h / N;
          let tt = t0, yy = y0;
          const pts = [pt(tt, yy)];
          for (let i = 0; i < N; i++) {
            const a = f(tt, yy);
            const b = f(tt + dt / 2, yy + (dt / 2) * a);
            yy = yy + dt * b;
            tt = tt + dt;
            pts.push(pt(tt, yy));
          }
          return (
            <path d={pointsToPath(pts)} fill="none" stroke="var(--violet-400)"
                  strokeWidth={2.4} opacity={0.45} strokeLinecap="round"/>
          );
        })()}

        {/* Sample slope ticks, revealed in order */}
        {samples.map((s, i) => {
          if (localTime < s.reveal) return null;
          const seg = slopeStroke(s);
          return (
            <g key={i}>
              <line x1={seg.x1} y1={seg.y1} x2={seg.x2} y2={seg.y2}
                    stroke={s.color} strokeWidth={3.4} strokeLinecap="round"/>
              <circle cx={seg.center.sx} cy={seg.center.sy} r={5}
                      fill={s.color} stroke="var(--chalk-100)" strokeWidth={0.8}/>
              <text x={seg.x2 + 8} y={seg.y2 + 6}
                    fill={s.color} fontFamily="var(--font-serif)" fontStyle="italic"
                    fontSize={20}>
                {s.name}
              </text>
            </g>
          );
        })}

        {/* Final RK4 step segment — emerald */}
        {stepRevealT > 0 && (
          <line x1={start.sx} y1={start.sy}
                x2={start.sx + (end.sx - start.sx) * stepRevealT}
                y2={start.sy + (end.sy - start.sy) * stepRevealT}
                stroke="var(--emerald-400)" strokeWidth={3.6}
                strokeLinecap="round"/>
        )}
        <circle cx={start.sx} cy={start.sy} r={5.5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
        {stepRevealT >= 1 && (
          <circle cx={end.sx} cy={end.sy} r={5.5}
                  fill="var(--emerald-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
        )}
      </GridMaskedSvg>

      <SoftPanel right={64} top={140} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>one rk4 step</FadeUp>

        <FadeUp duration={0.5} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 21, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 4,
          }}>
          Four slope readings:<br/>
          start, two midpoints, end.
        </FadeUp>

        <FadeUp duration={0.55} delay={4.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 6,
          }}>
          <span style={{ color: 'var(--emerald-400)' }}>y<sub>n+1</sub></span>
          &nbsp;=&nbsp;y<sub>n</sub>&nbsp;+&nbsp;
          <span style={{ color: 'var(--chalk-300)' }}>h⁄6</span>
          &nbsp;·&nbsp;(k₁ + 2k₂ + 2k₃ + k₄)
        </FadeUp>

        <FadeUp duration={0.5} delay={6.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Weighted average — midpoints count double.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Log-log error plot ───────────────────────────────────────────
function LogLogErrorBeat() {
  const { localTime } = useSprite();

  // Generate error data for a few step sizes.
  const T_FINAL = T_MAX;
  const truth = truthAt(T_FINAL);
  const hs = [1.0, 0.5, 0.25, 0.125, 0.0625];

  function eulerErrorAt(h) {
    let t = T_MIN, y = Y0;
    while (t < T_FINAL - 1e-9) {
      y = y + h * f(t, y);
      t = t + h;
    }
    return Math.abs(y - truth);
  }
  function rk4ErrorAt(h) {
    let t = T_MIN, y = Y0;
    while (t < T_FINAL - 1e-9) {
      const k1 = f(t, y);
      const k2 = f(t + h / 2, y + (h / 2) * k1);
      const k3 = f(t + h / 2, y + (h / 2) * k2);
      const k4 = f(t + h, y + h * k3);
      y = y + (h / 6) * (k1 + 2 * k2 + 2 * k3 + k4);
      t = t + h;
    }
    return Math.abs(y - truth);
  }

  const eulerErrs = hs.map(eulerErrorAt);
  const rk4Errs = hs.map(rk4ErrorAt);

  // Plot box.
  const PX = 200, PY = 540, PW = 580, PH = 360;
  // x axis: log10(h) from log10(0.05) ≈ -1.3 to log10(1.2) ≈ 0.08
  const X_LOG_MIN = -1.4, X_LOG_MAX = 0.2;
  // y axis: log10(error). RK4 gets very small; clamp the floor.
  const Y_LOG_MIN = -8, Y_LOG_MAX = 1;

  function logScale(v, lo, hi, pxLo, pxHi) {
    return pxLo + (v - lo) / (hi - lo) * (pxHi - pxLo);
  }
  function toPx(logH, logE) {
    return {
      sx: logScale(logH, X_LOG_MIN, X_LOG_MAX, PX, PX + PW),
      sy: logScale(logE, Y_LOG_MIN, Y_LOG_MAX, PY, PY - PH),
    };
  }

  const eulerPts = hs.map((h, i) => toPx(Math.log10(h), Math.log10(eulerErrs[i])));
  const rk4Pts = hs.map((h, i) => toPx(Math.log10(h), Math.log10(Math.max(rk4Errs[i], 1e-10))));

  const eulerReveal = clamp((localTime - 0.6) / 1.6, 0, 1);
  const rk4Reveal = clamp((localTime - 2.2) / 1.6, 0, 1);

  function partialPath(pts, t) {
    if (t <= 0 || pts.length < 2) return '';
    const last = (pts.length - 1) * t;
    const fullIdx = Math.floor(last);
    const frac = last - fullIdx;
    const ptsOut = pts.slice(0, fullIdx + 1).map(p => `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`);
    if (frac > 0 && fullIdx + 1 < pts.length) {
      const a = pts[fullIdx], b = pts[fullIdx + 1];
      const ix = a.sx + (b.sx - a.sx) * frac;
      const iy = a.sy + (b.sy - a.sy) * frac;
      ptsOut.push(`${ix.toFixed(1)},${iy.toFixed(1)}`);
    }
    return ptsOut.join(' ');
  }

  // Build a few axis tick labels.
  const xTicks = [-1, 0]; // log10(h) gridlines at h = 0.1 and 1
  const yTicks = [-7, -5, -3, -1];

  return (
    <>
      <GridMaskedSvg maskId="ervsrk-loglog-mask" cx="40%" cy="58%" r="60%">
        {/* axes */}
        <line x1={PX} y1={PY} x2={PX + PW} y2={PY}
              stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
        <line x1={PX} y1={PY} x2={PX} y2={PY - PH}
              stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>

        {/* x ticks */}
        {xTicks.map(v => {
          const p = toPx(v, Y_LOG_MIN);
          return (
            <g key={`xt${v}`}>
              <line x1={p.sx} y1={PY} x2={p.sx} y2={PY + 6}
                    stroke="var(--chalk-200)" strokeWidth={1.4}/>
              <text x={p.sx} y={PY + 24}
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                    fontSize={13} textAnchor="middle">
                {v === 0 ? '1' : `10${'⁻'}${Math.abs(v)}`}
              </text>
            </g>
          );
        })}
        <text x={PX + PW + 12} y={PY + 6}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20}>h</text>

        {/* y ticks */}
        {yTicks.map(v => {
          const p = toPx(X_LOG_MIN, v);
          return (
            <g key={`yt${v}`}>
              <line x1={PX} y1={p.sy} x2={PX - 6} y2={p.sy}
                    stroke="var(--chalk-200)" strokeWidth={1.4}/>
              <text x={PX - 12} y={p.sy + 5}
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                    fontSize={13} textAnchor="end">
                10{`⁻${Math.abs(v)}`}
              </text>
            </g>
          );
        })}
        <text x={PX - 10} y={PY - PH - 14}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="end">error</text>

        {/* Euler error line */}
        {eulerReveal > 0 && (
          <polyline points={partialPath(eulerPts, eulerReveal)}
                    fill="none" stroke="var(--rose-400)"
                    strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {eulerReveal > 0.95 && eulerPts.map((p, i) => (
          <circle key={`ep${i}`} cx={p.sx} cy={p.sy} r={4.5}
                  fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={0.8}/>
        ))}
        {eulerReveal > 0.95 && (() => {
          const last = eulerPts[eulerPts.length - 1];
          return (
            <text x={last.sx - 8} y={last.sy - 14}
                  fill="var(--rose-400)" fontFamily="var(--font-mono)"
                  fontSize={14} textAnchor="end">
              euler · slope 1
            </text>
          );
        })()}

        {/* RK4 error line */}
        {rk4Reveal > 0 && (
          <polyline points={partialPath(rk4Pts, rk4Reveal)}
                    fill="none" stroke="var(--emerald-400)"
                    strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {rk4Reveal > 0.95 && rk4Pts.map((p, i) => (
          <circle key={`rp${i}`} cx={p.sx} cy={p.sy} r={4.5}
                  fill="var(--emerald-400)" stroke="var(--chalk-100)" strokeWidth={0.8}/>
        ))}
        {rk4Reveal > 0.95 && (() => {
          const last = rk4Pts[rk4Pts.length - 1];
          return (
            <text x={last.sx - 8} y={last.sy + 22}
                  fill="var(--emerald-400)" fontFamily="var(--font-mono)"
                  fontSize={14} textAnchor="end">
              rk4 · slope 4
            </text>
          );
        })()}
      </GridMaskedSvg>

      <SoftPanel right={64} top={140} width={360}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>order on a log log plot</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Halve h:
        </FadeUp>

        <FadeUp duration={0.5} delay={1.6} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--rose-400)', letterSpacing: '0.06em',
          }}>
          euler error ÷ 2
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--emerald-400)', letterSpacing: '0.06em',
          }}>
          rk4 error ÷ 16
        </FadeUp>

        <FadeUp duration={0.5} delay={4.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
            marginTop: 4,
          }}>
          The slope of each line is its order of accuracy.
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
        }}>order of accuracy</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 52, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Error of order <span style={{ color: 'var(--amber-300)' }}>p</span> falls as <span style={{ color: 'var(--amber-300)' }}>h<sup>p</sup></span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
          Euler is first order. <br/>
          RK4 is fourth order.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        more work per step · far fewer steps for the same accuracy
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
