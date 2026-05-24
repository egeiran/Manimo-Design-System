// Heun's Method: Predict, Then Correct — Manimo lesson scene.
// Chapter 4 of mat2b (Differensialligninger), numerical methods (Uke 9-11).
// Builds the predictor-corrector idea explicitly: plain Euler reads the slope
// only at the start of a step and drifts on a curving solution; Heun predicts
// the endpoint with an Euler step, samples the slope there, and steps with the
// AVERAGE of the two slopes.
//
//   k1 = f(t_n, y_n)
//   k2 = f(t_n + h, y_n + h k1)
//   y_{n+1} = y_n + (h/2)(k1 + k2)        ← Runge-Kutta order 2
//
// Demo IVP: y' = y, y(0) = 1  →  y(t) = e^t (convex, so Euler undershoots).
// Step h = 0.5 over t in [0, 1.5] — big visible steps.
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//   0– 6   Manimo hook
//   6–18   Euler drifts below the true curve (the problem)
//  18–34   ONE step, predictor-corrector mechanism (GENUINE MOTION)
//  34–44   The update formula — k1, k2, the averaged step
//  44–56   March the whole interval: Heun hugs, Euler lags (GENUINE MOTION)
//  56–62   Takeaway
//
// Colour discipline:
//   violet-400  true solution
//   rose-400    Euler (the drifting method) + its slope sample
//   amber-400   predictor tangent (k1) + payoff formula
//   teal-400    Heun (the averaged step) — the winner
//   chalk-*     axes, captions

const SCENE_DURATION = 64;

const NARRATION = [
  /*  0– 6 */ 'Euler takes one slope per step, and on a curving solution it drifts. What if we looked ahead before committing to a step?',
  /*  6–18 */ 'Here Euler reads the slope only at the start of each step. Because the true curve keeps bending away, every step lands a little short, and the gap grows.',
  /* 18–34 */ "Heun's idea has two stages. First, predict the endpoint with an ordinary Euler step. Then read the slope at that predicted point, average it with the starting slope, and take the real step with that average.",
  /* 34–44 */ 'Write it down. k one is the slope at the start, k two the slope at the predicted point, and the step adds h times their average. One extra evaluation, and the accuracy jumps to order two, a Runge Kutta method of order two.',
  /* 44–56 */ "Now march the whole interval with that averaged slope. Heun's points hug the true curve while plain Euler keeps falling behind, at the very same step size.",
  /* 56–62 */ 'Predict with one slope, correct with the average of two. A little more work each step, a much closer fit.',
];

const NARRATION_AUDIO = 'audio/heun-improved-euler/scene.mp3';

// ─── Model ──────────────────────────────────────────────────────────────────
const T0 = 0, T1 = 1.5, H = 0.5, NSTEPS = 3;
const YMIN = 0, YMAX = 5.2;
const f = (t, y) => y;            // y' = y
const trueY = (t) => Math.exp(t); // y(0) = 1

// Forward Euler iterates.
function eulerPts() {
  const pts = [{ t: T0, y: 1 }];
  let y = 1;
  for (let n = 0; n < NSTEPS; n++) {
    const t = T0 + n * H;
    y = y + H * f(t, y);
    pts.push({ t: t + H, y });
  }
  return pts;
}
// Heun iterates.
function heunPts() {
  const pts = [{ t: T0, y: 1 }];
  let y = 1;
  for (let n = 0; n < NSTEPS; n++) {
    const t = T0 + n * H;
    const k1 = f(t, y);
    const k2 = f(t + H, y + H * k1);
    y = y + (H / 2) * (k1 + k2);
    pts.push({ t: t + H, y });
  }
  return pts;
}
const EULER = eulerPts();
const HEUN = heunPts();

// ─── Geometry ─────────────────────────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vw: 720, vh: 1280, ox: 120, oy: 760, w: 500, h: 460,
        panel: { left: 70, top: 880, width: 580 } }
    : { vw: 1280, vh: 720, ox: 200, oy: 600, w: 620, h: 440,
        panel: { right: 56, top: 168, width: 384 } };
}
const mapX = (t, G) => G.ox + (t - T0) / (T1 - T0) * G.w;
const mapY = (y, G) => G.oy - (y - YMIN) / (YMAX - YMIN) * G.h;

function truePath(G, tEnd = T1, samples = 80) {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const t = T0 + (tEnd - T0) * (i / samples);
    d += `${i === 0 ? 'M' : 'L'} ${mapX(t, G).toFixed(1)} ${mapY(trueY(t), G).toFixed(1)} `;
  }
  return d.trim();
}
function polyPath(pts, G, upto) {
  const list = upto == null ? pts : pts.slice(0, upto);
  return list.map((p, i) => `${i === 0 ? 'M' : 'L'} ${mapX(p.t, G).toFixed(1)} ${mapY(p.y, G).toFixed(1)}`).join(' ');
}

// ─── Shared helpers ─────────────────────────────────────────────────────────
function SoftPanel({ children, right, top, left, bottom, width = 380 }) {
  const pos = (left != null || bottom != null)
    ? { left, top: bottom == null ? top : undefined, bottom }
    : { right, top };
  return (
    <div style={{
      position: 'absolute', width, ...pos, pointerEvents: 'none',
      padding: '18px 22px', background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)', borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>{children}</div>
  );
}

function Axes({ G }) {
  return (
    <g>
      <line x1={G.ox} y1={G.oy} x2={G.ox + G.w} y2={G.oy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={G.ox} y1={G.oy} x2={G.ox} y2={G.oy - G.h}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <text x={G.ox + G.w + 12} y={G.oy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>t</text>
      <text x={G.ox - 12} y={G.oy - G.h - 6} textAnchor="end"
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>y</text>
    </g>
  );
}

function Arrow({ x1, y1, x2, y2, color, width = 2.6, dashed = false, head = 9 }) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  const a1 = ang + Math.PI - 0.4, a2 = ang + Math.PI + 0.4;
  return (
    <g>
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={width}
            strokeLinecap="round" strokeDasharray={dashed ? '6 6' : 'none'}/>
      <path d={`M ${x2} ${y2} L ${x2 + head * Math.cos(a1)} ${y2 + head * Math.sin(a1)} L ${x2 + head * Math.cos(a2)} ${y2 + head * Math.sin(a2)} Z`}
            fill={color}/>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="numerical ODEs"
      title="Heun's Method: Predict, Then Correct"
      duration={SCENE_DURATION}
      introEnd={7.58}
      introCaption="Look ahead before you step."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.58} end={17.5}>
        <EulerDrift/>
      </Sprite>

      <Sprite start={17.5} end={30.65}>
        <PredictCorrect/>
      </Sprite>

      <Sprite start={30.65} end={45.57}>
        <FormulaBeat/>
      </Sprite>

      <Sprite start={45.57} end={55.67}>
        <MarchHeun/>
      </Sprite>

      <Sprite start={55.67} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Euler drifts ───────────────────────────────────────────────────
function EulerDrift() {
  const portrait = usePortrait();
  const G = geom(portrait);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <Axes G={G}/>
        <TraceIn d={truePath(G)} stroke="var(--violet-400)" strokeWidth={3} duration={1.4} delay={0.3}/>
        <SvgFadeIn delay={1.8} duration={0.4}>
          <text x={mapX(1.05, G) - 6} y={mapY(trueY(1.05), G) - 12} textAnchor="end"
                fill="var(--violet-400)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>
            y = eᵗ
          </text>
        </SvgFadeIn>
        {/* Euler polyline traces step by step */}
        <TraceIn d={polyPath(EULER, G)} stroke="var(--rose-400)" strokeWidth={2.8} duration={1.6} delay={1.2}/>
        <SvgFadeIn delay={2.6} duration={0.4}>
          {EULER.map((p, i) => (
            <circle key={i} cx={mapX(p.t, G)} cy={mapY(p.y, G)} r={4.5}
                    fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
          ))}
          {/* error gap at the last point */}
          <line x1={mapX(T1, G)} y1={mapY(EULER[NSTEPS].y, G)} x2={mapX(T1, G)} y2={mapY(trueY(T1), G)}
                stroke="var(--chalk-300)" strokeWidth={1.4} strokeDasharray="4 4"/>
          <text x={mapX(T1, G) - 8} y={(mapY(EULER[NSTEPS].y, G) + mapY(trueY(T1), G)) / 2} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>gap</text>
        </SvgFadeIn>
      </svg>

      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{eulerPanel(true)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{eulerPanel(false)}</SoftPanel>}
    </>
  );
}
function eulerPanel(portrait) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.4} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        plain Euler
      </FadeUp>
      <FadeUp duration={0.55} delay={0.8} distance={10}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 24 : 28, color: 'var(--rose-300)' }}>
        yₙ₊₁ = yₙ + h·f(tₙ, yₙ)
      </FadeUp>
      <FadeUp duration={0.5} delay={2.4} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-200)', maxWidth: '34ch', lineHeight: 1.4 }}>
        Only the start-of-step slope. On a curve that keeps bending, the gap compounds.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: predictor-corrector, one step (GENUINE MOTION) ─────────────────
// One step from (t0, y0) = (0, 1) to t = 0.5. Three phases driven by localTime:
//   predict  — a dot travels out along the Euler tangent (slope k1) to the
//              predicted endpoint (ghost).
//   sample   — a short slope tick at the predicted point shows k2.
//   correct  — the averaged-slope chord draws from the start, and the corrected
//              dot slides from the predicted height down to the corrected one.
function PredictCorrect() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Zoom into a single step so it fills the plot box (the full-scene window
  // makes one step tiny). Local data window around the (t0,y0)→t0+h step.
  const TZ0 = -0.08, TZ1 = 0.62, YZ0 = 0.82, YZ1 = 1.80;
  const mx = (t) => G.ox + (t - TZ0) / (TZ1 - TZ0) * G.w;
  const my = (y) => G.oy - (y - YZ0) / (YZ1 - YZ0) * G.h;
  const pxPerT = G.w / (TZ1 - TZ0), pxPerY = G.h / (YZ1 - YZ0);

  const t0 = 0, y0 = 1, tEnd = 0.5;
  const k1 = f(t0, y0);                       // 1
  const yPred = y0 + H * k1;                   // 1.5
  const k2 = f(tEnd, yPred);                   // 1.5
  const yCorr = y0 + (H / 2) * (k1 + k2);      // 1.625

  const P0 = { x: mx(t0), y: my(y0) };
  const PP = { x: mx(tEnd), y: my(yPred) };    // predicted (lower on screen)
  const PC = { x: mx(tEnd), y: my(yCorr) };    // corrected (higher on screen)

  // Phase timings (localTime seconds). Completes by ~6.2 s so the beat (and
  // its mid-point snapshot) shows the finished construction, then holds.
  const predictT = clamp((localTime - 0.8) / 2.0, 0, 1);    // dot travels along tangent
  const showSample = localTime > 3.2;
  const correctT = clamp((localTime - 4.2) / 2.0, 0, 1);    // corrected dot slides in
  const eased = Easing.easeInOutCubic;

  const tp = eased(predictT);
  const travel = { x: P0.x + (PP.x - P0.x) * tp, y: P0.y + (PP.y - P0.y) * tp };
  const cc = eased(correctT);
  const corrTip = { x: PC.x, y: PP.y + (PC.y - PP.y) * cc };

  // A slope-k tick centred at (px,py): unit screen direction along (1, k).
  function tick(px, py, k, len = 56) {
    const dirx = pxPerT, diry = -k * pxPerY;
    const n = Math.hypot(dirx, diry);
    const ux = dirx / n, uy = diry / n, h = len / 2;
    return { x1: px - ux * h, y1: py - uy * h, x2: px + ux * h, y2: py + uy * h };
  }
  const k2tick = tick(PP.x, PP.y, k2);

  // faint true curve (zoomed)
  let trueD = '';
  for (let i = 0; i <= 60; i++) { const t = TZ0 + (TZ1 - TZ0) * (i / 60); trueD += `${i === 0 ? 'M' : 'L'} ${mx(t).toFixed(1)} ${my(trueY(t)).toFixed(1)} `; }

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <Axes G={G}/>
        {/* true curve faint for reference */}
        <path d={trueD.trim()} fill="none" stroke="var(--violet-400)" strokeWidth={2.4} opacity={0.5}/>

        {/* interval markers on the t axis */}
        <line x1={P0.x} y1={G.oy} x2={P0.x} y2={G.oy + 7} stroke="var(--chalk-300)" strokeWidth={1.4}/>
        <line x1={PP.x} y1={G.oy} x2={PP.x} y2={G.oy + 7} stroke="var(--chalk-300)" strokeWidth={1.4}/>
        <text x={P0.x} y={G.oy + 24} textAnchor="middle" fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>tₙ</text>
        <text x={PP.x} y={G.oy + 24} textAnchor="middle" fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>tₙ+h</text>

        {/* start point */}
        <circle cx={P0.x} cy={P0.y} r={6} fill="var(--chalk-100)"/>
        <text x={P0.x - 12} y={P0.y + 4} textAnchor="end" fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={14}>yₙ</text>

        {/* PREDICT: Euler tangent + travelling dot */}
        {predictT > 0 && (
          <g>
            <line x1={P0.x} y1={P0.y} x2={travel.x} y2={travel.y}
                  stroke="var(--amber-400)" strokeWidth={2.6} strokeDasharray="7 6" strokeLinecap="round"/>
            <circle cx={travel.x} cy={travel.y} r={6} fill="var(--amber-400)"/>
          </g>
        )}
        {predictT >= 1 && (
          <g>
            <circle cx={PP.x} cy={PP.y} r={6} fill="none" stroke="var(--amber-400)" strokeWidth={2.2}/>
            <text x={PP.x + 14} y={PP.y + 20} fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={13}>
              predicted
            </text>
            <text x={(P0.x + PP.x) / 2} y={(P0.y + PP.y) / 2 + 22} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>k₁</text>
          </g>
        )}

        {/* SAMPLE: slope tick (k2) at the predicted point */}
        {showSample && (
          <g>
            <line x1={k2tick.x1} y1={k2tick.y1} x2={k2tick.x2} y2={k2tick.y2}
                  stroke="var(--rose-400)" strokeWidth={2.8} strokeLinecap="round"/>
            <text x={k2tick.x2 + 8} y={k2tick.y2 + 4} fill="var(--rose-300)"
                  fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>k₂</text>
          </g>
        )}

        {/* CORRECT: averaged-slope chord + corrected point sliding in */}
        {correctT > 0 && (
          <g>
            <line x1={P0.x} y1={P0.y} x2={corrTip.x} y2={corrTip.y}
                  stroke="var(--teal-400)" strokeWidth={3.4} strokeLinecap="round"/>
            <circle cx={corrTip.x} cy={corrTip.y} r={7} fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1.3}/>
          </g>
        )}
        {correctT >= 1 && (
          <text x={PC.x + 14} y={PC.y - 10} fill="var(--teal-400)" fontFamily="var(--font-mono)" fontSize={13}>
            corrected
          </text>
        )}
      </svg>

      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{pcPanel(true)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{pcPanel(false)}</SoftPanel>}
    </>
  );
}
function pcPanel(portrait) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        two stages
      </FadeUp>
      <FadeUp duration={0.5} delay={1.0} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 16, color: 'var(--amber-300)',
                 lineHeight: 1.35, maxWidth: '32ch' }}>
        1 · Predict the endpoint with a plain Euler step.
      </FadeUp>
      <FadeUp duration={0.5} delay={4.0} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 16, color: 'var(--rose-300)',
                 lineHeight: 1.35, maxWidth: '32ch' }}>
        2 · Read the slope there — that's k₂.
      </FadeUp>
      <FadeUp duration={0.5} delay={6.5} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 16, color: 'var(--teal-400)',
                 lineHeight: 1.35, maxWidth: '32ch' }}>
        3 · Step with the average — it lands on the curve.
      </FadeUp>
    </>
  );
}

// ─── Beat 4: the formula ────────────────────────────────────────────────────
function FormulaBeat() {
  const portrait = usePortrait();
  const step = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 26 : 32, letterSpacing: '0.02em', textAlign: 'center',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: portrait ? 18 : 24,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        one step of Heun's method
      </FadeUp>
      <FadeUp duration={0.5} delay={0.4} distance={10} style={{ ...step, color: 'var(--amber-300)' }}>
        k₁ = f(tₙ, yₙ)
      </FadeUp>
      <FadeUp duration={0.5} delay={1.2} distance={10} style={{ ...step, color: 'var(--rose-300)' }}>
        k₂ = f(tₙ + h, yₙ + h k₁)
      </FadeUp>
      <FadeUp duration={0.4} delay={2.0} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--chalk-300)' }}>
        ⇓
      </FadeUp>
      <FadeUp duration={0.7} delay={2.2} distance={14}
        style={{ ...step, fontSize: portrait ? 32 : 44, color: 'var(--teal-400)' }}>
        yₙ₊₁ = yₙ + (h/2)(k₁ + k₂)
      </FadeUp>
      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16, color: 'var(--chalk-300)',
                 textAlign: 'center', maxWidth: portrait ? '28ch' : '46ch', lineHeight: 1.4 }}>
        average of two slopes → global error of order two
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: march the interval (GENUINE MOTION) ────────────────────────────
// Both methods march step by step, driven by localTime. A live readout shows
// each method's error against the true value at the current marched point.
function MarchHeun() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const traceStart = 0.5, traceDur = 7.0;
  const frac = clamp((localTime - traceStart) / traceDur, 0, 1);
  const marched = Easing.easeInOutCubic(frac) * NSTEPS;     // 0..NSTEPS (continuous)
  const fullSteps = Math.floor(marched + 1e-6);
  const partial = marched - fullSteps;

  // Build partial polylines (interpolate the last segment for smooth marching).
  function partialPoly(pts) {
    const out = pts.slice(0, fullSteps + 1).map(p => ({ x: mapX(p.t, G), y: mapY(p.y, G) }));
    if (fullSteps < NSTEPS && partial > 0) {
      const a = pts[fullSteps], b = pts[fullSteps + 1];
      out.push({
        x: mapX(a.t + (b.t - a.t) * partial, G),
        y: mapY(a.y + (b.y - a.y) * partial, G),
      });
    }
    return out;
  }
  const eP = partialPoly(EULER);
  const hP = partialPoly(HEUN);
  const toPath = (a) => a.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Current marched values for the readout.
  const segIdx = Math.min(fullSteps, NSTEPS);
  const tNow = T0 + Math.min(marched, NSTEPS) * H;
  const yE = EULER[segIdx].y + (segIdx < NSTEPS ? (EULER[segIdx + 1].y - EULER[segIdx].y) * partial : 0);
  const yH = HEUN[segIdx].y + (segIdx < NSTEPS ? (HEUN[segIdx + 1].y - HEUN[segIdx].y) * partial : 0);
  const yT = trueY(tNow);
  const errE = Math.abs(yT - yE), errH = Math.abs(yT - yH);

  const tip = (arr) => arr.length ? arr[arr.length - 1] : null;
  const eT = tip(eP), hT = tip(hP);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vw} height={G.vh} viewBox={`0 0 ${G.vw} ${G.vh}`}>
        <Axes G={G}/>
        <path d={truePath(G)} fill="none" stroke="var(--violet-400)" strokeWidth={3}/>
        <text x={mapX(1.05, G) - 6} y={mapY(trueY(1.05), G) - 12} textAnchor="end"
              fill="var(--violet-400)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>y = eᵗ</text>

        {eP.length > 1 && <path d={toPath(eP)} fill="none" stroke="var(--rose-400)" strokeWidth={2.6}
                                strokeLinecap="round" strokeLinejoin="round" opacity={0.85}/>}
        {hP.length > 1 && <path d={toPath(hP)} fill="none" stroke="var(--teal-400)" strokeWidth={3}
                                strokeLinecap="round" strokeLinejoin="round"/>}

        {eT && <circle cx={eT.x} cy={eT.y} r={5} fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1}/>}
        {hT && <circle cx={hT.x} cy={hT.y} r={5.5} fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1.2}/>}
      </svg>

      {portrait
        ? <SoftPanel left={G.panel.left} top={G.panel.top} width={G.panel.width}>{marchPanel(true, errE, errH)}</SoftPanel>
        : <SoftPanel right={G.panel.right} top={G.panel.top} width={G.panel.width}>{marchPanel(false, errE, errH)}</SoftPanel>}
    </>
  );
}
function marchPanel(portrait, errE, errH) {
  return (
    <>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        same step size, h = 0.5
      </FadeUp>
      <FadeUp duration={0.5} delay={0.6} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15, color: 'var(--rose-300)' }}>
        Euler error: {errE.toFixed(3)}
      </FadeUp>
      <FadeUp duration={0.5} delay={0.8} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15, color: 'var(--teal-400)' }}>
        Heun error: {errH.toFixed(3)}
      </FadeUp>
      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15, color: 'var(--chalk-300)',
                 maxWidth: '34ch', lineHeight: 1.4 }}>
        Heun stays close; Euler keeps falling short.
      </FadeUp>
    </>
  );
}

// ─── Beat 6: takeaway ───────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        predict, then correct
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 30 : 44, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '40ch', lineHeight: 1.25 }}>
        One average of two slopes — <span style={{ color: 'var(--teal-400)' }}>order two</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 16, color: 'var(--chalk-300)',
                 maxWidth: portrait ? '30ch' : '50ch', lineHeight: 1.4 }}>
        Heun = improved Euler = the explicit trapezoidal rule.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
