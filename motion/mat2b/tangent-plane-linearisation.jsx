// Linearisation: The Tangent Plane Snaps On — Manimo lesson scene.
// Chapter 5 / week 13 of mat2b. Linear approximation in two variables. We
// lead with the one-variable picture (a curve and its tangent line) because
// it's the same idea in a more readable diagram, then zoom in to feel
// "second-order error", then declare the two-variable formula.
//
// Beats (placeholder timings — re-wired by `npm run audio`):
//    0– 4.2   Manimo
//    4.2–14   Curve + point P + tangent line
//   14–22     Zoom — gap shrinks, second-order intuition
//   22–30.5   Two-variable formula L(x, y)
//  30.5–end   Hero outro
//
// Colour discipline:
//   chalk-300  default ink, axes
//   chalk-200  reference marks (zoom frame brackets when not the focus)
//   violet-400 the curve / x-partial column
//   teal-400   y-partial column
//   amber-400  the tangent line (the object being acted on)
//   rose-400   the zoom frame / residual error indicators
//   amber-300  takeaway accent

const SCENE_DURATION = 42;

const NARRATION = [
  "Up close, every smooth surface looks flat. Linearisation is the rule that turns that picture into a formula.",
  "Take a single variable picture first. A curve, and a point on it. The tangent line at that point matches both the value and the slope of the curve.",
  "Zoom in on the point. The curve and the tangent line drift apart only at second order, so for any small step they trace nearly the same height.",
  "The two variable version reads the same. Match the value, match the x slope, match the y slope. That's the equation of the tangent plane.",
  "Differentiability, in one sentence: the surface is well approximated by a plane.",
];

const NARRATION_AUDIO = 'audio/tangent-plane-linearisation/scene.mp3';

// ─── Coordinate system (for the curve + tangent beats) ────────────────────
const ORIGIN_X = 460;
const ORIGIN_Y = 460;
const UNIT_X = 88;
const UNIT_Y = 88;
const X_MIN = -1.6, X_MAX = 2.6;
const Y_MIN = -0.6, Y_MAX = 3.2;

// Curve: f(x) = 0.35 x^3 - 0.6 x^2 + 0.4 x + 1.6. Smooth, non-symmetric so
// the tangent at our point is visibly distinct from the curve away from it.
function f1(x) {
  return 0.35 * x * x * x - 0.6 * x * x + 0.4 * x + 1.6;
}
function f1p(x) {
  return 1.05 * x * x - 1.2 * x + 0.4;
}
const A = 1.3;     // chosen point P_x
const FA = f1(A);
const FPA = f1p(A);

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT_X, sy: ORIGIN_Y - y * UNIT_Y };
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="42%" cy="56%" r="62%">
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

function Axes({ opacity = 1 }) {
  const left = toSvg(X_MIN, 0), right = toSvg(X_MAX, 0);
  const bottom = toSvg(0, Y_MIN), top = toSvg(0, Y_MAX);
  return (
    <g opacity={opacity}>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bottom.sx} y2={bottom.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <text x={right.sx + 12} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>x</text>
      <text x={top.sx - 18} y={top.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>y</text>
    </g>
  );
}

// Curve path, sampled densely. Optional progress (0..1) for stroke reveal.
function curvePath(xMin = X_MIN, xMax = X_MAX, n = 220) {
  const dx = (xMax - xMin) / n;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const x = xMin + i * dx;
    pts.push(toSvg(x, f1(x)));
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

// Tangent line L(x) = f(a) + f'(a)(x - a), drawn over [xMin, xMax].
function tangentPath(xMin = X_MIN, xMax = X_MAX) {
  const ya = FA + FPA * (xMin - A);
  const yb = FA + FPA * (xMax - A);
  const a = toSvg(xMin, ya);
  const b = toSvg(xMax, yb);
  return `M ${a.sx.toFixed(1)} ${a.sy.toFixed(1)} L ${b.sx.toFixed(1)} ${b.sy.toFixed(1)}`;
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
      eyebrow="linearisation"
      title="The Tangent Plane Snaps On"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={7.36}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={7.36} end={16.77}>
        <CurveBeat/>
      </Sprite>

      <Sprite start={16.77} end={26.31}>
        <ZoomBeat/>
      </Sprite>

      <Sprite start={26.31} end={35.68}>
        <TwoVarBeat/>
      </Sprite>

      <Sprite start={35.68} end={SCENE_DURATION}>
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
        Up close, flat.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Curve + tangent ──────────────────────────────────────────────
function CurveBeat() {
  const { localTime } = useSprite();
  const path = curvePath();
  const tan = tangentPath();
  const P = toSvg(A, FA);

  // Curve reveals over ~2.4 s; tangent over 1.4 s once curve is drawn.
  const curveT = clamp(localTime / 2.4, 0, 1);
  const tangentT = clamp((localTime - 4.0) / 1.4, 0, 1);

  // Approximate path length (chord-sum) for stroke-dashoffset.
  const CURVE_LEN = 1100; // generous upper bound; dasharray clips outside
  const TAN_LEN = 800;

  return (
    <>
      <GridMaskedSvg maskId="tpl-curve-mask">
        <SvgFadeIn duration={0.5} delay={0.0}><Axes/></SvgFadeIn>

        {/* Curve. */}
        <path d={path}
              fill="none" stroke="var(--violet-400)"
              strokeWidth={3.4} strokeLinecap="round"
              strokeDasharray={CURVE_LEN}
              strokeDashoffset={CURVE_LEN * (1 - curveT)}/>

        {/* Point P. */}
        {localTime > 2.3 && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <g>
              <circle cx={P.sx} cy={P.sy} r={6}
                      fill="var(--chalk-100)"/>
              <text x={P.sx + 14} y={P.sy - 16}
                    fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={22}>P</text>
            </g>
          </SvgFadeIn>
        )}

        {/* Tangent line. */}
        {tangentT > 0 && (
          <path d={tan}
                fill="none" stroke="var(--amber-400)"
                strokeWidth={3.0} strokeLinecap="round"
                strokeDasharray={TAN_LEN}
                strokeDashoffset={TAN_LEN * (1 - tangentT)}/>
        )}
      </GridMaskedSvg>

      <SoftPanel right={64} top={220} width={400}>
        <FadeUp duration={0.45} delay={1.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>one-variable case</FadeUp>

        <FadeUp duration={0.55} delay={1.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          The tangent matches <br/>value <em>and</em> slope at P.
        </FadeUp>

        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 6,
          }}>
          L(x) = f(a) + f′(a)(x − a)
        </FadeUp>

        <FadeUp duration={0.5} delay={6.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Same height, same direction. <br/>For one short step, they coincide.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Zoom ─────────────────────────────────────────────────────────
function ZoomBeat() {
  const { localTime } = useSprite();
  // Zoom window narrows around A over ~3 s.
  const halfW0 = 1.8;
  const halfW1 = 0.4;
  const zoomT = clamp((localTime - 0.5) / 3.0, 0, 1);
  const eased = Easing.easeInOutCubic(zoomT);
  const halfW = halfW0 + (halfW1 - halfW0) * eased;

  // Re-render the curve and tangent restricted to [A - halfW, A + halfW]
  // but with a viewBox transform so the local detail fills the diagram area.
  // Easier path: redraw with re-scaled UNIT_X/UNIT_Y on the fly. We'll fake
  // a "zoom" by drawing the curve over the same axes but with halfW bounds
  // and showing a rose-400 bracket marking the focus window.
  const xLeft = A - halfW;
  const xRight = A + halfW;
  const path = curvePath(xLeft, xRight, 200);
  const tan = tangentPath(xLeft, xRight);

  const Pleft = toSvg(xLeft, 0);
  const Pright = toSvg(xRight, 0);
  const P = toSvg(A, FA);

  return (
    <>
      <GridMaskedSvg maskId="tpl-zoom-mask">
        <Axes opacity={0.6}/>

        {/* Bracket marking the local window. */}
        <line x1={Pleft.sx} y1={Pleft.sy - 200} x2={Pleft.sx} y2={Pleft.sy + 14}
              stroke="var(--rose-400)" strokeWidth={1.6}
              strokeDasharray="6 5" opacity={0.7}/>
        <line x1={Pright.sx} y1={Pright.sy - 200} x2={Pright.sx} y2={Pright.sy + 14}
              stroke="var(--rose-400)" strokeWidth={1.6}
              strokeDasharray="6 5" opacity={0.7}/>

        {/* Curve restricted to the local window. */}
        <path d={path}
              fill="none" stroke="var(--violet-400)"
              strokeWidth={3.4} strokeLinecap="round"/>

        {/* Tangent restricted to the local window. */}
        <path d={tan}
              fill="none" stroke="var(--amber-400)"
              strokeWidth={3.0} strokeLinecap="round"/>

        {/* Point P. */}
        <circle cx={P.sx} cy={P.sy} r={6} fill="var(--chalk-100)"/>
        <text x={P.sx + 14} y={P.sy - 16}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={22}>P</text>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>zoom in</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          The gap shrinks faster than the step.
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          They share value and slope. <br/>They disagree only at second order.
        </FadeUp>

        <FadeUp duration={0.5} delay={4.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.06em',
            marginTop: 6,
          }}>
          error ∼ ½ f″(a) (x − a)²
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Two-variable formula ─────────────────────────────────────────
function TwoVarBeat() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 1080, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>two variables — same idea</FadeUp>

      <FadeUp duration={0.7} delay={0.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 42, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.3,
        }}>
        L(x, y) = <span style={{ color: 'var(--chalk-100)' }}>f(a, b)</span>
        &nbsp;+&nbsp;
        <span style={{ color: 'var(--violet-400)' }}>f<sub>x</sub>(a, b)</span>(x − a)
        &nbsp;+&nbsp;
        <span style={{ color: 'var(--teal-400)' }}>f<sub>y</sub>(a, b)</span>(y − b)
      </FadeUp>

      <FadeUp duration={0.55} delay={2.0} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '54ch', lineHeight: 1.4,
        }}>
        <span style={{ color: 'var(--chalk-100)' }}>Value</span>,&nbsp;
        <span style={{ color: 'var(--violet-400)' }}>x-slope</span>,&nbsp;
        <span style={{ color: 'var(--teal-400)' }}>y-slope</span> — &nbsp;all three locked in.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.6} distance={10}
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        z = L(x, y) is the tangent plane at (a, b)
      </FadeUp>
    </div>
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
        }}>the takeaway</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 54, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Smooth means <span style={{ color: 'var(--amber-300)' }}>flat</span> at the point.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '44ch', lineHeight: 1.3,
        }}>
          The tangent plane is the surface's<br/>best linear copy.
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
