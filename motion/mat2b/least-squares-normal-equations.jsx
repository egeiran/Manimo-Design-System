// Least Squares: Project, Don't Solve — Manimo lesson scene.
// Chapter 3 (Indreproduktrom). Fit a line through three noisy points.
// No line passes through all three. Tilt the slope; the sum of squared
// residuals rises and falls. The minimum is the projection of b onto the
// column space of A — equivalently, the normal equations AᵀAx = Aᵀb.
//
// Beats:
//    0.00– 4.00  Manimo intro
//    4.00–13.00  Overdetermined system — three points, no line through all
//   13.00–29.00  Tilt slope, watch SSR rise/fall (genuine animation)
//   29.00–39.50  Aᵀ(b − Ax) = 0  →  AᵀAx = Aᵀb
//   39.50–46.00  Takeaway

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0.00– 4.00 */ "Three points won't all lie on one line. What's the best you can do?",
  /*  4.00–13.00 */ 'Three noisy data points. We want a line through them. Two unknowns, slope and intercept — but three equations. The system is overdetermined, so no line passes through all three.',
  /* 13.00–29.00 */ 'So pick the line that minimises the sum of squared vertical residuals. Tilt the slope back and forth; the squared-error total rises and falls. The best fit is the slope where it bottoms out.',
  /* 29.00–39.50 */ "There's a closed-form recipe. The error vector b minus A x has to be perpendicular to every column of A. Multiply both sides by A transpose, and you get the normal equations A transpose A x equals A transpose b. Solve those once, and you're done.",
  /* 39.50–46.00 */ 'When there is no exact answer, project. The same trick that found the closest point on a line works for the closest point in the column space.',
];

const NARRATION_AUDIO = 'audio/least-squares-normal-equations/scene.mp3';

// ─── Data: three points (x, y). Best-fit slope (with intercept 0.5) ≈ 0.95.
//   (1, 1.4), (2, 1.9), (3, 3.3)
//   Closed-form: a = ȳ − b·x̄  ,  b = Σ(x_i−x̄)(y_i−ȳ) / Σ(x_i−x̄)²
//   x̄ = 2, ȳ = 2.2  →  num = (1−2)(1.4−2.2) + (2−2)(1.9−2.2) + (3−2)(3.3−2.2)
//                         = 0.8 + 0 + 1.1 = 1.9
//                     den = 1 + 0 + 1 = 2  →  b = 0.95
//                     a = 2.2 − 0.95·2 = 0.30  → line y = 0.95 x + 0.30
const DATA = [[1, 1.4], [2, 1.9], [3, 3.3]];
const BEST_SLOPE = 0.95;
const BEST_INTERCEPT = 0.30;

function sumSquaredResiduals(slope, intercept, data = DATA) {
  let s = 0;
  for (const [x, y] of data) {
    const yhat = slope * x + intercept;
    s += (y - yhat) * (y - yhat);
  }
  return s;
}

// ─── Geometry helpers ────────────────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 620, ox: 80, oy: 540, ux: 110, uy: 100,
        xMin: 0, xMax: 4, yMin: 0, yMax: 5 }
    : { vbW: 620, vbH: 540, ox: 70, oy: 460, ux: 130, uy: 78,
        xMin: 0, xMax: 4, yMin: 0, yMax: 5 };
}

function toSvgF(G, x, y) {
  return { sx: G.ox + x * G.ux, sy: G.oy - y * G.uy };
}

function AxesBox({ G }) {
  const a = toSvgF(G, G.xMin, G.yMin);
  const b = toSvgF(G, G.xMax, G.yMin);
  const c = toSvgF(G, G.xMin, G.yMax);
  // x-axis ticks at 1,2,3
  const xTicks = [1, 2, 3].map(k => {
    const p = toSvgF(G, k, G.yMin);
    return (
      <g key={`xt${k}`}>
        <line x1={p.sx} y1={p.sy} x2={p.sx} y2={p.sy + 5}
              stroke="var(--chalk-300)" strokeWidth={1.2}/>
        <text x={p.sx} y={p.sy + 18} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11}>{k}</text>
      </g>
    );
  });
  // y-axis ticks at 1..4
  const yTicks = [1, 2, 3, 4].map(k => {
    const p = toSvgF(G, G.xMin, k);
    return (
      <g key={`yt${k}`}>
        <line x1={p.sx - 5} y1={p.sy} x2={p.sx} y2={p.sy}
              stroke="var(--chalk-300)" strokeWidth={1.2}/>
        <text x={p.sx - 8} y={p.sy + 4} textAnchor="end"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11}>{k}</text>
      </g>
    );
  });
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={a.sx} y1={a.sy} x2={c.sx} y2={c.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <text x={b.sx + 14} y={b.sy + 4}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={16}>x</text>
      <text x={c.sx - 6} y={c.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={16}>y</text>
      {xTicks}{yTicks}
    </g>
  );
}

function DataPoints({ G, data = DATA }) {
  return (
    <g>
      {data.map(([x, y], i) => {
        const p = toSvgF(G, x, y);
        return (
          <circle key={i} cx={p.sx} cy={p.sy} r={6}
                  fill="var(--violet-400)" stroke="var(--chalk-100)"
                  strokeWidth={1.4}/>
        );
      })}
    </g>
  );
}

// Line y = slope·x + intercept, clipped to xMin..xMax visually within the
// box (clamp y to yMin..yMax so it doesn't escape).
function FitLine({ G, slope, intercept, color = 'var(--amber-400)',
                   strokeWidth = 3, dashed = false, opacity = 1 }) {
  const x0 = G.xMin, x1 = G.xMax;
  const y0 = slope * x0 + intercept;
  const y1 = slope * x1 + intercept;
  const a = toSvgF(G, x0, y0);
  const b = toSvgF(G, x1, y1);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={dashed ? '6 5' : undefined}
          opacity={opacity} strokeLinecap="round"/>
  );
}

// Vertical residual segments + small squared-error tiles for each point.
// The tile is drawn to the right of the residual, side length = |residual|·uy
// (so the tile area is literally the squared error in units of pixels²).
function ResidualsAndSquares({ G, slope, intercept, data = DATA,
                                lineColor = 'var(--rose-400)',
                                squareColor = 'var(--rose-300)',
                                showSquares = true }) {
  return (
    <g>
      {data.map(([x, y], i) => {
        const yhat = slope * x + intercept;
        const pData = toSvgF(G, x, y);
        const pHat  = toSvgF(G, x, yhat);
        const residPx = Math.abs(pHat.sy - pData.sy);
        // Square: side = residual, placed to the right of x.
        // Position the square so it adjoins the residual segment.
        const sx = Math.min(pData.sx, pData.sx) + 6;
        const sy = Math.min(pData.sy, pHat.sy);
        return (
          <g key={i}>
            <line x1={pData.sx} y1={pData.sy} x2={pHat.sx} y2={pHat.sy}
                  stroke={lineColor} strokeWidth={2.2} strokeLinecap="round"
                  strokeDasharray="4 3"/>
            {showSquares && residPx > 4 && (
              <rect x={sx} y={sy} width={residPx} height={residPx}
                    fill={squareColor} opacity={0.18}
                    stroke={squareColor} strokeWidth={1.2} strokeOpacity={0.55}/>
            )}
          </g>
        );
      })}
    </g>
  );
}

function SoftPanel({ portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 920, bottom: 100 }
        : { right: 60, top: 220, width: 380 }),
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: portrait ? 'center' : 'flex-start',
      textAlign: portrait ? 'center' : 'left',
      gap: 12,
    }}>
      {children}
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="inner product spaces"
      title="Least Squares: Project, Don't Solve"
      duration={SCENE_DURATION}
      introEnd={4.16}
      introCaption="Three points won't all lie on one line — what's the best fit?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.16} end={16.25}>
        <OverdeterminedBeat/>
      </Sprite>

      <Sprite start={16.25} end={28.02}>
        <TiltAndMinimiseBeat/>
      </Sprite>

      <Sprite start={28.02} end={45.94}>
        <NormalEquationsBeat/>
      </Sprite>

      <Sprite start={45.94} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Overdetermined system ───────────────────────────────────────
function OverdeterminedBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);

  return (
    <>
      <div style={{
        position: 'absolute', left: portrait ? '50%' : '32%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <AxesBox G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.5} delay={0.4}>
            <DataPoints G={G}/>
          </SvgFadeIn>
          {/* Two candidate lines that miss at least one point */}
          <SvgFadeIn duration={0.5} delay={1.4}>
            <FitLine G={G} slope={0.4} intercept={1.2}
                     color="var(--chalk-300)" strokeWidth={2} dashed={true}
                     opacity={0.75}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.5} delay={2.0}>
            <FitLine G={G} slope={1.5} intercept={-0.4}
                     color="var(--chalk-300)" strokeWidth={2} dashed={true}
                     opacity={0.75}/>
          </SvgFadeIn>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={1.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          over-determined system
        </FadeUp>
        <FadeUp duration={0.55} delay={1.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 24, color: 'var(--chalk-100)',
            lineHeight: 1.35, marginTop: 4,
          }}>
            3 points, 2 unknowns —<br/>too many equations for one line.
        </FadeUp>
        <FadeUp duration={0.55} delay={2.6} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 20,
            color: 'var(--rose-300)', letterSpacing: '0.02em',
            lineHeight: 1.3, marginTop: 4,
          }}>
            Ax = b has no exact x
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '34ch', marginTop: 4,
          }}>
          So we settle for the closest miss.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Tilt slope, minimise SSR ────────────────────────────────────
// Slope sweeps from ~0.2 → ~1.7 → back to BEST_SLOPE (0.95). Intercept is
// held at the corresponding best-fit value: a_opt(b) = ȳ − b·x̄ = 2.2 − 2b.
// So when slope is suboptimal, the intercept follows the constrained
// best, which keeps the line through the data centroid. That makes the
// SSR a clean parabola in b alone — the visual lands on the same minimum.
function TiltAndMinimiseBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // Two-phase sweep (compressed to fit a ~12 s beat):
  //   Phase A (0.8 → 5.4 s): tilt up from b=0.2 to b=1.7 (showing the range).
  //   Phase B (5.7 → 9.5 s): settle to b = BEST_SLOPE.
  //   Phase C (≥ 9.5 s):    sit at best fit and show the badge.
  let slope;
  if (localTime < 0.8) {
    slope = 0.2;
  } else if (localTime < 5.4) {
    const t = (localTime - 0.8) / 4.6;
    slope = 0.2 + (1.7 - 0.2) * Easing.easeInOutSine(t);
  } else if (localTime < 5.7) {
    slope = 1.7;
  } else if (localTime < 9.5) {
    const t = (localTime - 5.7) / 3.8;
    slope = 1.7 + (BEST_SLOPE - 1.7) * Easing.easeInOutCubic(t);
  } else {
    slope = BEST_SLOPE;
  }
  // Constrained intercept: line passes through (x̄, ȳ) = (2, 2.2)
  // so the best fit under any slope choice b is a = 2.2 − 2b.
  const intercept = 2.2 - 2 * slope;
  const ssr = sumSquaredResiduals(slope, intercept);

  // Has the sweep finished settling? Show payoff at minimum.
  const settled = localTime > 9.7;

  return (
    <>
      <div style={{
        position: 'absolute', left: portrait ? '50%' : '32%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <AxesBox G={G}/>
          </SvgFadeIn>
          {/* Candidate line (live, no fade — it has to drive the animation) */}
          <FitLine G={G} slope={slope} intercept={intercept}
                   color={settled ? 'var(--amber-300)' : 'var(--amber-400)'}
                   strokeWidth={settled ? 3.4 : 3}/>
          {/* Residuals + squared-error tiles */}
          <ResidualsAndSquares G={G} slope={slope} intercept={intercept}/>
          {/* Data points on top */}
          <DataPoints G={G}/>
          {/* "best fit" badge once settled */}
          {settled && (
            <SvgFadeIn duration={0.4} delay={0.0}>
              {(() => {
                const tag = toSvgF(G, 3.4, BEST_SLOPE * 3.4 + BEST_INTERCEPT);
                return (
                  <text x={tag.sx + 6} y={tag.sy - 6}
                        fill="var(--amber-300)" fontFamily="var(--font-mono)"
                        fontSize={11} letterSpacing="0.12em">BEST FIT</text>
                );
              })()}
            </SvgFadeIn>
          )}
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          minimise the squared error
        </FadeUp>
        <FadeUp duration={0.6} delay={0.8} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 24 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            SSR = Σ <span style={{ color: 'var(--rose-300)' }}>(yᵢ − ŷᵢ)²</span>
        </FadeUp>

        {/* Live readouts */}
        <FadeUp duration={0.4} delay={1.6} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 16,
            color: 'var(--chalk-200)', lineHeight: 1.6, marginTop: 6,
          }}>
            <div>slope = {slope.toFixed(2)}</div>
            <div>intercept = {intercept.toFixed(2)}</div>
            <div style={{ color: settled ? 'var(--amber-300)' : 'var(--rose-300)',
                          marginTop: 4, fontSize: portrait ? 17 : 19 }}>
              SSR = {ssr.toFixed(2)}
            </div>
        </FadeUp>

        {settled && (
          <FadeUp duration={0.5} delay={0.2} distance={8}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 14,
              color: 'var(--amber-300)', lineHeight: 1.4,
              maxWidth: portrait ? '32ch' : '34ch', marginTop: 4,
            }}>
            ↓ minimum lands at slope ≈ 0.95.
          </FadeUp>
        )}
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Normal equations ────────────────────────────────────────────
function NormalEquationsBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 24,
      maxWidth: portrait ? 600 : 'none', textAlign: 'center',
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the normal equations
      </FadeUp>

      <FadeUp duration={0.55} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 34, color: 'var(--chalk-200)',
          lineHeight: 1.3,
        }}>
        A<sup style={{ fontSize: '0.65em' }}>T</sup>(b − Ax) = 0
      </FadeUp>
      <FadeUp duration={0.4} delay={1.4} distance={4}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 22,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>
      <FadeUp duration={0.7} delay={1.8} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 50 : 62, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        A<sup style={{ fontSize: '0.6em' }}>T</sup>Ax = A<sup style={{ fontSize: '0.6em' }}>T</sup>b
      </FadeUp>

      <FadeUp duration={0.55} delay={3.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', maxWidth: portrait ? '34ch' : '52ch',
          lineHeight: 1.5, marginTop: 10,
        }}>
        Residual must be perpendicular to the column space —<br/>
        that's the projection of b onto col(A).
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: portrait ? 600 : 900,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.8} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 50, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        No exact answer? <span style={{ color: 'var(--amber-300)' }}>Project.</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '28ch' : '48ch', lineHeight: 1.4,
        }}>
        Closest point in the column space —<br/>same trick, bigger stage.
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION}
           background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
