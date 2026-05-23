// Quadratic Taylor: A Plane Curves Into a Bowl — Manimo lesson scene.
// Chapter 6 of mat2b (Ekstremalpunkter). Bridges chapter 5
// tangent-plane-linearisation (order 1 in two variables) with chapter 6
// hessian-test (the Hessian classifying critical points). The story:
//   - In one variable, T_2(x) = f(a) + f'(a)(x−a) + ½f''(a)(x−a)².
//   - In two variables, the linear term becomes ∇f·h and the quadratic
//     term becomes ½ hᵀ H h.
//   - Sweep the approximation order k = 0 → 1 → 2 over a saddle slice and
//     watch the residual |f − T_k| collapse.
//
// Test function (saddle, easy mental arithmetic):
//   f(x, y) = x² − y² + 0.4 x y    at centre (a, b) = (0.6, 0.4)
//   f(a, b) = 0.36 − 0.16 + 0.096 = 0.296
//   ∇f      = (2x + 0.4 y, −2y + 0.4 x)         at (a, b) = (1.36, −0.56)
//   H       = [[2, 0.4], [0.4, −2]]
// Sample slice direction: u = (1, 1)/√2. Distance s along u from centre,
// so (x, y) = (a + s·ux, b + s·uy). Use that for the cross-section graph
// and the residual readout.
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 4.5   Manimo hook
//    4.5–14.5 One-variable recap: constant, tangent, parabola lock in
//   14.5–24.5 Two-variable formula T_2(x, y) = f + ∇f·h + ½ hᵀ H h
//   24.5–38.5 Order sweep on a saddle slice — value-driven animation
//   38.5–end  Takeaway connecting Hessian to classification
//
// Colour discipline:
//   chalk-200/300  axes, grey body text
//   violet-400     the true function curve / slice
//   chalk-300      order-0 constant approximation
//   amber-400      order-1 (linear / tangent plane)
//   rose-400       order-2 (quadratic / Hessian bowl), residual indicator
//   amber-300      payoff accent

const SCENE_DURATION = 61;

const NARRATION = [
  /*  0.0– 4.5  */ 'The tangent plane gets the slope right. To get the curvature right, add the Hessian.',
  /*  4.5–14.5  */ 'Start in one variable. Pick a point. The constant approximation just holds f of a. The linear one adds the slope. The quadratic one adds one half f double prime, and the curve and the parabola lock together at the point.',
  /* 14.5–24.5  */ 'In two variables, replace the slope with the gradient and replace the second derivative with the Hessian matrix. The quadratic term reads h transpose H h over two, where h is the displacement from the centre.',
  /* 24.5–38.5  */ 'Pick a saddle-shaped surface and watch the approximation snap into focus. Order zero is flat. Order one tilts the plane to match the gradient — already much better. Order two adds the Hessian bowl, and the surface and the approximation hug the centre.',
  /* 38.5–end   */ 'First order locks in slope. Second order locks in curvature. That is why the Hessian decides whether a critical point is a hill, a hollow, or a saddle.',
];

const NARRATION_AUDIO = 'audio/quadratic-taylor-approximation/scene.mp3';

// ─── Univariate test function for beat 2 ──────────────────────────────────
// f(x) = 0.3 sin(2x) + 0.2 cos(x) + 0.4 x — smooth, non-symmetric.
// At a = 1.0: f, f', f'' close to round numbers visually distinct.
function g(x) { return 0.3 * Math.sin(2 * x) + 0.2 * Math.cos(x) + 0.4 * x; }
function gp(x) { return 0.6 * Math.cos(2 * x) - 0.2 * Math.sin(x) + 0.4; }
function gpp(x) { return -1.2 * Math.sin(2 * x) - 0.2 * Math.cos(x); }
const A1 = 1.0;
const GA = g(A1), GPA = gp(A1), GPPA = gpp(A1);

// ─── Two-variable test function for beat 4 ────────────────────────────────
// f(x, y) = x² − y² + 0.4 x y  (saddle).
// Centre (a, b) chosen off-axis so all three terms (value, gradient,
// Hessian) are visibly non-trivial.
const A2 = 0.6, B2 = 0.4;
function f2(x, y) { return x * x - y * y + 0.4 * x * y; }
function f2Val() { return f2(A2, B2); }                       // value
function f2Grad() { return [2 * A2 + 0.4 * B2, -2 * B2 + 0.4 * A2]; } // ∇f
// Hessian is constant for this quadratic-plus-linear: f_xx=2, f_xy=0.4, f_yy=−2.
const FXX = 2, FXY = 0.4, FYY = -2;

// Slice direction (unit) — diagonal.
const UX = 1 / Math.SQRT2, UY = 1 / Math.SQRT2;

// Taylor approximations along the slice at displacement s (so h = s·u).
function T0_slice() { return f2Val(); }
function T1_slice(s) {
  const [gx, gy] = f2Grad();
  return f2Val() + (gx * UX + gy * UY) * s;
}
function T2_slice(s) {
  const [gx, gy] = f2Grad();
  const linear = (gx * UX + gy * UY) * s;
  // hᵀ H h / 2 with h = s·u:
  const quad = 0.5 * (FXX * UX * UX + 2 * FXY * UX * UY + FYY * UY * UY) * s * s;
  return f2Val() + linear + quad;
}
function fSlice(s) {
  return f2(A2 + s * UX, B2 + s * UY);
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined }
    : { right, top };
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
      eyebrow="second-order Taylor"
      title="A Plane Curves Into a Bowl"
      duration={SCENE_DURATION}
      introEnd={5.49}
      introCaption="Plane catches slope. Bowl catches curvature."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.49} end={20.26}>
        <UnivariateBeat/>
      </Sprite>

      <Sprite start={20.26} end={34.23}>
        <TwoVarFormulaBeat/>
      </Sprite>

      <Sprite start={34.23} end={50.49}>
        <OrderSweepBeat/>
      </Sprite>

      <Sprite start={50.49} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: One-variable Taylor ─────────────────────────────────────────
function UnivariateBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Diagram geometry per aspect.
  const G = portrait
    ? { ox: 360, oy: 660, ux: 130, uy: 130, vbW: 720, vbH: 1100,
        xMin: -0.4, xMax: 2.4, yMin: -0.6, yMax: 2.2,
        panelLeft: 60, panelBottom: 100, panelW: 600 }
    : { ox: 380, oy: 420, ux: 130, uy: 130, vbW: 1280, vbH: 720,
        xMin: -0.4, xMax: 2.4, yMin: -0.6, yMax: 2.2,
        panelRight: 64, panelTop: 200, panelW: 410 };

  function toSvg(x, y) { return { sx: G.ox + x * G.ux, sy: G.oy - y * G.uy }; }

  // True curve f.
  const N = 180;
  const curvePts = [];
  for (let i = 0; i <= N; i++) {
    const x = G.xMin + (G.xMax - G.xMin) * (i / N);
    curvePts.push(toSvg(x, g(x)));
  }
  const curveD = curvePts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');

  // Order-0: horizontal at f(a) over the visible x range.
  const t0Left = toSvg(G.xMin, GA), t0Right = toSvg(G.xMax, GA);
  const t0D = `M ${t0Left.sx.toFixed(1)} ${t0Left.sy.toFixed(1)} L ${t0Right.sx.toFixed(1)} ${t0Right.sy.toFixed(1)}`;

  // Order-1: tangent line.
  const t1Y = (x) => GA + GPA * (x - A1);
  const t1Left = toSvg(G.xMin, t1Y(G.xMin)), t1Right = toSvg(G.xMax, t1Y(G.xMax));
  const t1D = `M ${t1Left.sx.toFixed(1)} ${t1Left.sy.toFixed(1)} L ${t1Right.sx.toFixed(1)} ${t1Right.sy.toFixed(1)}`;

  // Order-2: parabola.
  const t2Y = (x) => GA + GPA * (x - A1) + 0.5 * GPPA * (x - A1) * (x - A1);
  const t2Pts = [];
  for (let i = 0; i <= N; i++) {
    const x = G.xMin + (G.xMax - G.xMin) * (i / N);
    t2Pts.push(toSvg(x, t2Y(x)));
  }
  const t2D = t2Pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');

  // Reveal schedule.
  const showCurve = localTime > 0.3;
  const showOrder0 = localTime > 1.5;
  const showOrder1 = localTime > 3.0;
  const showOrder2 = localTime > 5.0;

  // Stroke-dashoffset reveal for the order curves (uniform pseudo-length).
  const drawIn = (t, dur = 0.6) => clamp((localTime - t) / dur, 0, 1);
  const t0Frac = drawIn(1.5), t1Frac = drawIn(3.0), t2Frac = drawIn(5.0, 0.8);
  const DASH = 1100;

  // Marker at the point a.
  const Pa = toSvg(A1, GA);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        {/* Axes — drawn early. */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={toSvg(G.xMin, 0).sx} y1={toSvg(G.xMin, 0).sy}
                x2={toSvg(G.xMax, 0).sx} y2={toSvg(G.xMax, 0).sy}
                stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7}/>
          <line x1={toSvg(0, G.yMin).sx} y1={toSvg(0, G.yMin).sy}
                x2={toSvg(0, G.yMax).sx} y2={toSvg(0, G.yMax).sy}
                stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7}/>
          <text x={toSvg(G.xMax, 0).sx + 12} y={toSvg(G.xMax, 0).sy + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={20}>x</text>
        </SvgFadeIn>

        {/* True curve in violet. */}
        {showCurve && (
          <path d={curveD} fill="none"
                stroke="var(--violet-400)" strokeWidth={3.2}
                strokeLinecap="round"
                strokeDasharray={DASH} strokeDashoffset={DASH * (1 - clamp((localTime - 0.3) / 1.1, 0, 1))}/>
        )}

        {/* Order 0 — constant. */}
        {showOrder0 && (
          <path d={t0D} fill="none"
                stroke="var(--chalk-300)" strokeWidth={2.2}
                strokeDasharray="6 6"
                opacity={t0Frac}/>
        )}

        {/* Order 1 — tangent line. */}
        {showOrder1 && (
          <path d={t1D} fill="none"
                stroke="var(--amber-400)" strokeWidth={2.8}
                strokeLinecap="round"
                strokeDasharray={DASH} strokeDashoffset={DASH * (1 - t1Frac)}/>
        )}

        {/* Order 2 — parabola. */}
        {showOrder2 && (
          <path d={t2D} fill="none"
                stroke="var(--rose-400)" strokeWidth={3.0}
                strokeLinecap="round"
                strokeDasharray={DASH} strokeDashoffset={DASH * (1 - t2Frac)}/>
        )}

        {/* Point a — anchor marker. */}
        {showCurve && (
          <SvgFadeIn duration={0.35} delay={0.4}>
            <circle cx={Pa.sx} cy={Pa.sy} r={5}
                    fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
            <text x={Pa.sx + 10} y={Pa.sy - 12}
                  fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={18}>a</text>
          </SvgFadeIn>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            one variable
          </FadeUp>
          <FadeUp duration={0.55} delay={1.7} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 17, color: 'var(--chalk-300)' }}>
            <span style={{ color: 'var(--chalk-300)' }}>T₀ = f(a)</span>
          </FadeUp>
          <FadeUp duration={0.55} delay={3.2} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 17, color: 'var(--amber-400)' }}>
            T₁ = f(a) + f'(a)(x − a)
          </FadeUp>
          <FadeUp duration={0.55} delay={5.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 17, color: 'var(--rose-400)' }}>
            T₂ = T₁ + ½ f''(a)(x − a)²
          </FadeUp>
          <FadeUp duration={0.5} delay={7.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.4 }}>
            Each new term matches one more derivative at <em>a</em>.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            one variable
          </FadeUp>
          <FadeUp duration={0.55} delay={1.7} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-300)', marginTop: 4 }}>
            T₀(x) = f(a)
          </FadeUp>
          <FadeUp duration={0.55} delay={3.2} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-400)' }}>
            T₁(x) = f(a) + f'(a)(x − a)
          </FadeUp>
          <FadeUp duration={0.55} delay={5.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--rose-400)' }}>
            T₂(x) = T₁(x) + ½ f''(a)(x − a)²
          </FadeUp>
          <FadeUp duration={0.5} delay={7.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '32ch', lineHeight: 1.45, marginTop: 8 }}>
            Each new term locks in one more derivative at <em>a</em>.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Two-variable Taylor formula ─────────────────────────────────
function TwoVarFormulaBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28, maxWidth: portrait ? 640 : 1100,
      textAlign: 'center',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                 color: 'var(--amber-300)', letterSpacing: '0.16em',
                 textTransform: 'uppercase' }}>
        two variables — same recipe
      </FadeUp>

      <FadeUp duration={0.7} delay={0.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 34, color: 'var(--chalk-100)',
          lineHeight: 1.5, whiteSpace: 'nowrap',
        }}>
        T₂ ={' '}
        <span style={{ color: 'var(--chalk-200)' }}>f(a, b)</span>
        {' '}+{' '}
        <span style={{ color: 'var(--amber-400)' }}>∇f · h</span>
        {' '}+{' '}
        <span style={{ color: 'var(--rose-400)' }}>½ hᵀ H h</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 17,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
        }}>
        h = (x − a, y − b)
      </FadeUp>

      <FadeUp duration={0.55} delay={3.0} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 30, color: 'var(--amber-300)',
          marginTop: 4,
        }}>
        H = <span style={{
          display: 'inline-flex', flexDirection: 'column',
          verticalAlign: 'middle', borderLeft: '2px solid var(--chalk-200)',
          borderRight: '2px solid var(--chalk-200)', padding: '4px 12px',
          lineHeight: 1.2, fontSize: portrait ? 18 : 24,
        }}>
          <span><span style={{ color: 'var(--amber-400)' }}>f<sub>xx</sub></span>&nbsp;&nbsp;
                <span style={{ color: 'var(--rose-400)' }}>f<sub>xy</sub></span></span>
          <span><span style={{ color: 'var(--rose-400)' }}>f<sub>xy</sub></span>&nbsp;&nbsp;
                <span style={{ color: 'var(--amber-400)' }}>f<sub>yy</sub></span></span>
        </span>
      </FadeUp>

      <FadeUp duration={0.5} delay={4.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)', maxWidth: portrait ? '30ch' : '52ch',
          lineHeight: 1.45, marginTop: 6,
        }}>
        Value, slopes, and curvatures — all matched at (<em>a</em>, <em>b</em>).
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Order sweep on a saddle slice ───────────────────────────────
// The genuine animation. A 1-D slice through the saddle at angle 45° gives
// a cross-section curve. The approximation order k = 0 → 1 → 2 is swept as
// localTime advances; the order-curve morphs between flat, tilted, parabolic
// and the live residual |f − T_k| at a fixed sample displacement collapses.
function OrderSweepBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry: a 1-D plot of f along the slice direction u, with s ∈ [-1.4, 1.4].
  const G = portrait
    ? { ox: 360, oy: 470, ux: 220, uy: 88, vbW: 720, vbH: 880,
        sMin: -1.4, sMax: 1.4, yMin: -1.7, yMax: 2.3,
        panelLeft: 50, panelBottom: 180, panelW: 620 }
    : { ox: 440, oy: 380, ux: 220, uy: 95, vbW: 1280, vbH: 720,
        sMin: -1.4, sMax: 1.4, yMin: -1.7, yMax: 2.3,
        panelRight: 64, panelTop: 150, panelW: 430 };

  function toSvg(s, y) { return { sx: G.ox + s * G.ux, sy: G.oy - y * G.uy }; }

  // True slice f(s) along u from centre (a, b).
  const N = 200;
  const fPts = [];
  for (let i = 0; i <= N; i++) {
    const s = G.sMin + (G.sMax - G.sMin) * (i / N);
    fPts.push(toSvg(s, fSlice(s)));
  }
  const fD = fPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');

  // Order schedule: k = 0 from localTime [1.0, 5.0], k = 1 [5.0, 9.5],
  // k = 2 [9.5, end]. We morph the approximation curve continuously between
  // T_{k} and T_{k+1} during a short transition window for legibility.
  const TR_DUR = 0.9;
  function orderMix(t) {
    // Returns { k, mix } where the displayed curve = (1−mix)·T_k + mix·T_{k+1}.
    if (t < 1.0) return { k: -1, mix: 0 };
    if (t < 5.0 - TR_DUR) return { k: 0, mix: 0 };
    if (t < 5.0) return { k: 0, mix: (t - (5.0 - TR_DUR)) / TR_DUR };
    if (t < 9.5 - TR_DUR) return { k: 1, mix: 0 };
    if (t < 9.5) return { k: 1, mix: (t - (9.5 - TR_DUR)) / TR_DUR };
    return { k: 2, mix: 0 };
  }
  const { k, mix } = orderMix(localTime);

  // Approximation y(s) for the currently active morph.
  function approxAt(s) {
    if (k === -1) return null;
    const tA = k === 0 ? T0_slice() : k === 1 ? T1_slice(s) : T2_slice(s);
    if (mix <= 0) return tA;
    const tB = k === 0 ? T1_slice(s) : T2_slice(s);
    return tA + (tB - tA) * Easing.easeInOutCubic(mix);
  }

  // Render the approximation as a path. Recompute every frame — the function
  // is cheap (one slice).
  const approxPts = [];
  for (let i = 0; i <= N; i++) {
    const s = G.sMin + (G.sMax - G.sMin) * (i / N);
    const y = approxAt(s);
    if (y == null) break;
    approxPts.push(toSvg(s, y));
  }
  const approxD = approxPts.length
    ? approxPts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ')
    : null;

  // Colour of the approximation tracks the effective order.
  const effectiveK = mix > 0.5 ? k + 1 : k;
  const apxColor = effectiveK <= 0 ? 'var(--chalk-300)'
                 : effectiveK === 1 ? 'var(--amber-400)'
                 : 'var(--rose-400)';

  // Sample displacement for the residual readout — a fixed s = +0.9 (well
  // outside the centre so the gap is visible).
  const S_SAMP = 0.9;
  const fSamp = fSlice(S_SAMP);
  const tSamp = approxAt(S_SAMP) ?? fSamp;
  const resid = Math.abs(fSamp - tSamp);
  // Full-scale of the residual bar: the order-0 residual at s = 0.9.
  const RESID_MAX = Math.abs(fSlice(S_SAMP) - T0_slice());
  const residNorm = clamp(resid / Math.max(RESID_MAX, 0.001), 0, 1);

  const sampF = toSvg(S_SAMP, fSamp);
  const sampT = toSvg(S_SAMP, tSamp);

  // Order indicator value shown to the viewer.
  const displayOrder = effectiveK < 0 ? '—' : String(effectiveK);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        {/* Axes. */}
        <SvgFadeIn duration={0.4} delay={0.1}>
          <line x1={toSvg(G.sMin, 0).sx} y1={toSvg(G.sMin, 0).sy}
                x2={toSvg(G.sMax, 0).sx} y2={toSvg(G.sMax, 0).sy}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.6}/>
          <line x1={toSvg(0, G.yMin).sx} y1={toSvg(0, G.yMin).sy}
                x2={toSvg(0, G.yMax).sx} y2={toSvg(0, G.yMax).sy}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.6}/>
          <text x={toSvg(G.sMax, 0).sx + 10} y={toSvg(G.sMax, 0).sy + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>s</text>
          <text x={toSvg(0, G.yMax).sx - 16} y={toSvg(0, G.yMax).sy - 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>f</text>
        </SvgFadeIn>

        {/* Centre marker at s = 0 (the point of approximation). */}
        <SvgFadeIn duration={0.35} delay={0.3}>
          <line x1={toSvg(0, G.yMin).sx} y1={toSvg(0, G.yMin).sy}
                x2={toSvg(0, G.yMax).sx} y2={toSvg(0, G.yMax).sy}
                stroke="var(--chalk-200)" strokeDasharray="3 5" strokeWidth={1} opacity={0.5}/>
          <circle cx={toSvg(0, f2Val()).sx} cy={toSvg(0, f2Val()).sy} r={5}
                  fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
        </SvgFadeIn>

        {/* True slice f(s). */}
        <path d={fD} fill="none"
              stroke="var(--violet-400)" strokeWidth={3.2}
              strokeLinecap="round"
              strokeDasharray={1400} strokeDashoffset={1400 * (1 - clamp((localTime - 0.5) / 1.5, 0, 1))}/>

        {/* Approximation. */}
        {approxD && (
          <path d={approxD} fill="none"
                stroke={apxColor} strokeWidth={3.0}
                strokeLinecap="round" opacity={0.95}/>
        )}

        {/* Residual segment between f and T_k at the sample s. */}
        {approxD && (
          <>
            <line x1={sampF.sx} y1={sampF.sy} x2={sampT.sx} y2={sampT.sy}
                  stroke="var(--rose-400)" strokeWidth={2.5} strokeLinecap="round" opacity={0.85}/>
            <circle cx={sampF.sx} cy={sampF.sy} r={3.5}
                    fill="var(--violet-400)" stroke="var(--chalk-200)" strokeWidth={0.8}/>
            <circle cx={sampT.sx} cy={sampT.sy} r={3.5}
                    fill={apxColor} stroke="var(--chalk-200)" strokeWidth={0.8}/>
          </>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            saddle slice — order sweep
          </FadeUp>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 12,
                        fontFamily: 'var(--font-mono)' }}>
            <span style={{ fontSize: 13, color: 'var(--chalk-300)',
                            letterSpacing: '0.08em' }}>order</span>
            <span style={{ fontSize: 38, color: apxColor, lineHeight: 1 }}>{displayOrder}</span>
          </div>

          <div style={{ width: '100%', marginTop: 4 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--chalk-300)', marginBottom: 4 }}>
              residual |f − T<sub>k</sub>| at s = 0.9
            </div>
            <div style={{ width: '100%', height: 14, background: 'rgba(232,220,193,0.10)',
                          borderRadius: 7, overflow: 'hidden' }}>
              <div style={{
                width: `${(residNorm * 100).toFixed(1)}%`, height: '100%',
                background: 'var(--rose-400)', borderRadius: 7,
                transition: 'width 0.06s linear',
              }}/>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                          color: 'var(--chalk-200)', marginTop: 3 }}>
              {resid.toFixed(3)}
            </div>
          </div>

          <FadeUp duration={0.5} delay={1.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.4 }}>
            f(x, y) = x² − y² + 0.4 xy at (0.6, 0.4).
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            saddle slice — order sweep
          </FadeUp>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14,
                        fontFamily: 'var(--font-mono)', marginTop: 2 }}>
            <span style={{ fontSize: 14, color: 'var(--chalk-300)',
                            letterSpacing: '0.08em' }}>order k =</span>
            <span style={{ fontSize: 44, color: apxColor, lineHeight: 1 }}>{displayOrder}</span>
          </div>

          <div style={{ width: '100%', marginTop: 8 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                          color: 'var(--chalk-300)', marginBottom: 5 }}>
              residual |f − T<sub>k</sub>| at s = 0.9
            </div>
            <div style={{ width: '100%', height: 18, background: 'rgba(232,220,193,0.10)',
                          borderRadius: 9, overflow: 'hidden' }}>
              <div style={{
                width: `${(residNorm * 100).toFixed(1)}%`, height: '100%',
                background: 'var(--rose-400)', borderRadius: 9,
                transition: 'width 0.06s linear',
              }}/>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                          color: 'var(--chalk-200)', marginTop: 4 }}>
              {resid.toFixed(3)}
            </div>
          </div>

          <FadeUp duration={0.5} delay={1.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch',
                     lineHeight: 1.45, marginTop: 10 }}>
            Cross-section of f(x, y) = x² − y² + 0.4 xy <br/>
            along the diagonal through (0.6, 0.4).
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                 color: 'var(--amber-300)', letterSpacing: '0.18em',
                 textTransform: 'uppercase' }}>
        the takeaway
      </FadeUp>

      <FadeUp duration={0.8} delay={0.4} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 46, color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '40ch', lineHeight: 1.2,
        }}>
        <span style={{ color: 'var(--amber-400)' }}>1st order</span> → slope.{' '}
        <span style={{ color: 'var(--rose-400)' }}>2nd order</span> → curvature.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28, color: 'var(--amber-300)',
          maxWidth: portrait ? '26ch' : '40ch', lineHeight: 1.3,
        }}>
        The Hessian classifies the bowl.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 12 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
          maxWidth: portrait ? '28ch' : '40ch',
        }}>
        hill · hollow · saddle — read off the eigenvalues of H
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
