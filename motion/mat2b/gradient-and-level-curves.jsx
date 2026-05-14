// Gradient and Level Curves: Perpendicular by Design — Manimo lesson scene.
// Chapter 5 / week 12 of mat2b. Visual proof that the gradient is always
// perpendicular to the level curve through a point. Uses a concrete
// function whose contours are pleasant and non-symmetric so the geometry
// is unambiguous:
//   f(x, y) = x² + 0.6 y² + 0.6 x y
// (a positive-definite quadratic form — elliptical level curves tilted
// off the axes, so the gradient direction varies around the picture).
//
// Beats:
//    0– 4.6   Manimo hook
//   4.6–12    Contour plot reveals
//   12–22     Gradient arrows at sample points — each perpendicular to its contour
//   22–30     Directional derivative: along the contour, slope is zero
//   30–end    Hero outro
//
// Colour discipline:
//   chalk-300  level curves (the map)
//   chalk-200  axes
//   amber-400  gradient arrows / steepest ascent
//   violet-400 tangent-to-level-curve / direction along the contour
//   teal-400   normalised direction vector u (when introducing D_u f)
//   amber-300  takeaway accent

const SCENE_DURATION = 49;

const NARRATION = [
  "If a hill is drawn as a map of level curves, which way is straight uphill? The gradient knows.",
  "Here are the level curves of f. Each ring connects all points where f has the same value. Tight rings mean the function is climbing fast.",
  "At every chosen point, plant the gradient — the vector of partial derivatives. Watch: each arrow crosses its level curve at a right angle. The gradient points in the direction of steepest ascent.",
  "The slope you feel in any direction u is the gradient dotted with u. Walk perpendicular to the gradient — along the level curve — and the slope is zero. The function is locally flat in that direction.",
  "Gradient perpendicular to level set. Length equals the rate of steepest ascent. One vector, three pieces of information.",
];

const NARRATION_AUDIO = 'audio/gradient-and-level-curves/scene.mp3';

// ─── Plane coordinates ────────────────────────────────────────────────────
const ORIGIN_X = 470;
const ORIGIN_Y = 380;
const UNIT = 95;

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// The chosen function.
function fxy(x, y) {
  return x * x + 0.6 * y * y + 0.6 * x * y;
}
function fxAt(x, y) { return 2 * x + 0.6 * y; }
function fyAt(x, y) { return 1.2 * y + 0.6 * x; }

// ─── Helpers ──────────────────────────────────────────────────────────────
function GridMaskedSvg({ maskId, cx = '38%', cy = '54%', r = '60%', children }) {
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

function PlaneAxes() {
  const left = toSvg(-3.0, 0), right = toSvg(3.0, 0);
  const bot = toSvg(0, -2.4), top = toSvg(0, 2.4);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <text x={right.sx + 14} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>x</text>
      <text x={top.sx - 18} y={top.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>y</text>
    </g>
  );
}

// Render a level curve f(x,y) = c by marching squares over a fine grid.
// The function is a positive-definite quadratic — every contour is a closed
// ellipse, so a simple parametric trace works just as well as marching
// squares and is far simpler. Solve for the ellipse explicitly.
//
// f = x² + 0.6 y² + 0.6 x y = c
// Diagonalise the form to parametrise. The matrix is
//   [[1, 0.3], [0.3, 0.6]]
// with eigenvalues λ ≈ 1.117, 0.483 and an eigenframe rotated by ~22°.
function ellipsePath(c, samples = 80) {
  // Eigendecomposition of [[1, 0.3], [0.3, 0.6]] (closed form).
  const a = 1, b = 0.3, d = 0.6;
  const tr = a + d;
  const det = a * d - b * b;
  const disc = Math.sqrt(tr * tr / 4 - det);
  const l1 = tr / 2 + disc;
  const l2 = tr / 2 - disc;
  // Eigenvector for l1: solve (a - l1) v_x + b v_y = 0 → v = (b, l1 - a)
  const v1x = b, v1y = l1 - a;
  const n1 = Math.hypot(v1x, v1y);
  const u1x = v1x / n1, u1y = v1y / n1;
  // Orthogonal eigenvector for l2.
  const u2x = -u1y, u2y = u1x;

  const r1 = Math.sqrt(c / l1);
  const r2 = Math.sqrt(c / l2);

  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const th = (i / samples) * 2 * Math.PI;
    const x = r1 * Math.cos(th) * u1x + r2 * Math.sin(th) * u2x;
    const y = r1 * Math.cos(th) * u1y + r2 * Math.sin(th) * u2y;
    pts.push(toSvg(x, y));
  }
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ') + ' Z';
}

function ContourPlot({ levels, opacity = 0.55, strokeWidth = 1.6, highlightIndex = -1 }) {
  return (
    <g>
      {levels.map((c, i) => (
        <path key={i} d={ellipsePath(c)}
              fill="none"
              stroke={i === highlightIndex ? 'var(--chalk-100)' : 'var(--chalk-300)'}
              strokeWidth={i === highlightIndex ? strokeWidth + 0.6 : strokeWidth}
              opacity={i === highlightIndex ? 0.95 : opacity}
              strokeLinejoin="round"/>
      ))}
    </g>
  );
}

// A reusable arrow from a base point to a tip (in math coords).
function GradArrow({ bx, by, tx, ty, color, label, labelDX = 14, labelDY = -10,
                    strokeWidth = 3.2, headLen = 13, headHalf = 7 }) {
  const a = toSvg(bx, by);
  const b = toSvg(tx, ty);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20}>{label}</text>
      )}
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="gradient · level curves"
      title="Perpendicular by Design"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={5.97}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={5.97} end={15.06}>
        <ContourBeat/>
      </Sprite>

      <Sprite start={15.06} end={26.99}>
        <GradArrowsBeat/>
      </Sprite>

      <Sprite start={26.99} end={39.62}>
        <DirectionalBeat/>
      </Sprite>

      <Sprite start={39.62} end={SCENE_DURATION}>
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
        Which way is straight uphill?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Contour reveal ───────────────────────────────────────────────
const LEVELS = [0.4, 0.9, 1.6, 2.5, 3.6, 4.9, 6.4];

function ContourBeat() {
  const { localTime } = useSprite();
  // Reveal contours from inner to outer.
  const reveal = Math.floor(clamp((localTime - 0.6) / 0.35, 0, LEVELS.length));
  const visibleLevels = LEVELS.slice(0, reveal);

  return (
    <>
      <GridMaskedSvg maskId="gradlc-contour-mask">
        <PlaneAxes/>
        <ContourPlot levels={visibleLevels}/>
        {/* Origin dot — the minimum */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={4}
                  fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
        </SvgFadeIn>
        {/* Value annotation on outermost visible contour. */}
        {visibleLevels.length >= 3 && (() => {
          const c = LEVELS[2];
          // Find a point on this ellipse for the label — pick top of curve.
          const labelPt = toSvg(0.8, 1.4);
          return (
            <SvgFadeIn duration={0.5} delay={0.0}>
              <text x={labelPt.sx} y={labelPt.sy}
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.06em">f = {c}</text>
            </SvgFadeIn>
          );
        })()}
      </GridMaskedSvg>

      <SoftPanel right={64} top={170} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>level curves</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.35,
            marginTop: 4,
          }}>
          Each ring connects points <br/>where f takes the same value.
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--violet-400)', letterSpacing: '0.04em',
          }}>
          f(x, y) = x² + 0.6 y² + 0.6 xy
        </FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
            marginTop: 4,
          }}>
          Tight rings mean the function is climbing fast.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Gradient arrows at sample points ─────────────────────────────
function GradArrowsBeat() {
  const { localTime } = useSprite();

  // Sample points on a moderate contour.
  const SAMPLES = [
    { x:  1.45, y:  0.30, delay: 0.8 },
    { x:  0.80, y:  1.20, delay: 1.6 },
    { x: -0.65, y:  1.40, delay: 2.4 },
    { x: -1.55, y:  0.10, delay: 3.2 },
    { x: -1.10, y: -1.05, delay: 4.0 },
    { x:  0.50, y: -1.30, delay: 4.8 },
  ];

  // Magnitude scale for gradient arrows (visual length).
  const G_SCALE = 0.22;

  return (
    <>
      <GridMaskedSvg maskId="gradlc-grad-mask">
        <PlaneAxes/>
        <ContourPlot levels={LEVELS} opacity={0.45}/>

        {SAMPLES.map((p, i) => {
          if (localTime < p.delay) return null;
          const gx = fxAt(p.x, p.y);
          const gy = fyAt(p.x, p.y);
          const tipX = p.x + gx * G_SCALE;
          const tipY = p.y + gy * G_SCALE;
          // Right-angle marker — short tick along the contour tangent direction.
          // Tangent dir is perpendicular to gradient.
          const gMag = Math.hypot(gx, gy);
          const tdx = -gy / gMag, tdy = gx / gMag;
          const tickLen = 0.14;
          const lt1 = toSvg(p.x + tdx * tickLen * 0.5, p.y + tdy * tickLen * 0.5);
          const lt2 = toSvg(p.x - tdx * tickLen * 0.5, p.y - tdy * tickLen * 0.5);
          const base = toSvg(p.x, p.y);
          return (
            <g key={i}>
              {/* Right-angle marker — small square corner near base. */}
              <line x1={lt1.sx} y1={lt1.sy} x2={lt2.sx} y2={lt2.sy}
                    stroke="var(--chalk-200)" strokeWidth={1.4} strokeLinecap="round"
                    opacity={0.7}/>
              <GradArrow bx={p.x} by={p.y} tx={tipX} ty={tipY}
                         color="var(--amber-400)"
                         strokeWidth={3.0}/>
              <circle cx={base.sx} cy={base.sy} r={3.5}
                      fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={0.8}/>
            </g>
          );
        })}
      </GridMaskedSvg>

      <SoftPanel right={64} top={140} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>the gradient</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          ∇f = <span style={{ display: 'inline-flex', flexDirection: 'column',
                              alignItems: 'center', verticalAlign: 'middle',
                              margin: '0 6px' }}>
            <span style={{ fontSize: 22 }}>
              ( <span style={{ color: 'var(--violet-400)' }}>f<sub>x</sub></span>,
              &nbsp;<span style={{ color: 'var(--teal-400)' }}>f<sub>y</sub></span> )
            </span>
          </span>
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.45,
            maxWidth: '34ch',
            marginTop: 4,
          }}>
          Each arrow meets its <br/>contour at a right angle.
        </FadeUp>

        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--amber-400)', letterSpacing: '0.08em',
          }}>
          ∇f → direction of steepest ascent
        </FadeUp>

        <FadeUp duration={0.5} delay={6.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.08em',
          }}>
          length = rate of steepest ascent
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Directional derivative — perpendicular = flat ────────────────
function DirectionalBeat() {
  const { localTime } = useSprite();
  // One spotlight point.
  const px = 0.8, py = 1.2;
  const gx = fxAt(px, py), gy = fyAt(px, py);
  const gMag = Math.hypot(gx, gy);
  const tdx = -gy / gMag, tdy = gx / gMag; // tangent to level curve
  const G_SCALE = 0.32;
  const T_SCALE = 0.6;

  return (
    <>
      <GridMaskedSvg maskId="gradlc-dir-mask">
        <PlaneAxes/>
        <ContourPlot levels={LEVELS} opacity={0.30} highlightIndex={3}/>

        <SvgFadeIn duration={0.4} delay={0.2}>
          <GradArrow bx={px} by={py}
                     tx={px + gx * G_SCALE} ty={py + gy * G_SCALE}
                     color="var(--amber-400)" label="∇f" labelDX={16} labelDY={-8}
                     strokeWidth={3.4}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.4}>
          <GradArrow bx={px} by={py}
                     tx={px + tdx * T_SCALE} ty={py + tdy * T_SCALE}
                     color="var(--violet-400)" label="along contour"
                     labelDX={20} labelDY={20} strokeWidth={3.0}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={2.4}>
          <GradArrow bx={px} by={py}
                     tx={px - tdx * T_SCALE * 0.8} ty={py - tdy * T_SCALE * 0.8}
                     color="var(--violet-400)" strokeWidth={3.0}/>
        </SvgFadeIn>

        <circle cx={toSvg(px, py).sx} cy={toSvg(px, py).sy} r={5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={150} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>directional derivative</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          <span style={{ color: 'var(--teal-400)' }}>D<sub>u</sub>f</span> = ∇f · u
        </FadeUp>

        <FadeUp duration={0.5} delay={2.2} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.45,
            maxWidth: '34ch',
            marginTop: 4,
          }}>
          Walk along the <span style={{ color: 'var(--violet-400)' }}>contour</span> — perpendicular to ∇f — and the slope is zero.
        </FadeUp>

        <FadeUp duration={0.5} delay={4.4} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--violet-400)', letterSpacing: '0.08em',
          }}>
          ∇f · u = 0  →  locally flat
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
      maxWidth: 1020, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>the gradient</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 52, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Perpendicular to the level set. <br/>
        <span style={{ color: 'var(--amber-300)' }}>Steepest ascent.</span>
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
        Direction and magnitude packed in one arrow.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        D<sub>u</sub>f = ∇f · u — slope in any direction
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
