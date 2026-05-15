// Global Extrema on a Triangle — Manimo lesson scene.
// Chapter 6 / week 16 of mat2b. Plenum 6 problem 3, the highest-leverage
// exam workout in chapter 6. Find the global min and max of
//   f(x, y) = x² + y² − xy + x + y
// on the triangle  x ≤ 0,  y ≤ 0,  x + y ≥ −3.
//
// The recipe: extreme-value theorem guarantees a global min and max exist;
// candidates live in three places — interior critical points, edge
// minimisers, corners. Compare them all and read off the smallest and
// largest.
//
// Solved values (worked out and verified in spec narrative):
//   interior critical point:  (−1, −1)        f = −1   ← global min
//   edge x = 0:               (0, −1/2)       f = −1/4
//   edge y = 0:               (−1/2, 0)       f = −1/4
//   edge x + y = −3:          (−3/2, −3/2)    f = −3/4
//   corner:                   (0, 0)          f = 0
//   corner:                   (−3, 0)         f = 6    ← global max
//   corner:                   (0, −3)         f = 6    ← global max
//
// Beats (placeholder timings — re-wired by `npm run audio`):
//    0– 4.5   Manimo
//    4.5–13   Setup — triangle + axes + function
//   13–22.5   Interior critical point lights up
//   22.5–33.5 Three edge minimisers light up
//   33.5–43   Three corners light up
//   43–49     Compare card — global min and max declared
//   49–end    Hero outro
//
// Colour discipline (this scene specifically):
//   chalk-300  reference contour lines
//   chalk-200  axes, region stroke
//   amber-400  the region itself (currently being acted on) and the
//                global-maximum corners (the answer that "wins")
//   emerald-400 the interior critical point (global minimum candidate that
//                turns out to be the winner)
//   rose-400   the three edge minimisers (the also-rans)
//   chalk-100  the origin corner (f = 0, also an also-ran)
//   amber-300  takeaway accent

const SCENE_DURATION = 86;

const NARRATION = [
  "A continuous function on a closed bounded region always has a global minimum and a global maximum. The trick is finding them — and there are only three places they can hide.",
  "Here's the region: the triangle with x at most zero, y at most zero, and x plus y at least minus three. Inside that triangle we want the smallest and largest values of f of x comma y equals x squared plus y squared minus x y plus x plus y.",
  "First place to look — interior critical points. Set the gradient to zero. That gives x equals y equals minus one, and f equals minus one. Already a strong candidate for the minimum.",
  "Second place to look — the three edges. On each edge, restrict f to a single variable function and minimise. You get three more candidate points, with values of minus a quarter, minus a quarter, and minus three quarters.",
  "Third place to look — the corners. f at the origin is zero. f at the other two corners is six and six. Big numbers — the maximum is going to live here.",
  "Compare the seven candidates. The smallest value is minus one at the interior critical point — that's the global minimum. The largest is six, hit at two of the corners — that's the global maximum.",
  "Three places, three checks, one comparison. That's the whole recipe.",
];

const NARRATION_AUDIO = 'audio/global-extrema-triangle/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
// Math origin near the top-right of the triangle area; the triangle lies
// down-and-left of the origin so we need negative-x and negative-y room.
const ORIGIN_X = 600;
const ORIGIN_Y = 220;
const UNIT = 80;
const X_MIN = -3.6, X_MAX = 0.6;
const Y_MIN = -3.6, Y_MAX = 0.6;

// Triangle vertices.
const V_OO = { x: 0, y: 0 };
const V_MO = { x: -3, y: 0 };
const V_OM = { x: 0, y: -3 };

// Candidates.
const INTERIOR = { x: -1, y: -1, v: -1 };
const EDGE_X0 = { x: 0, y: -0.5, v: -0.25 };
const EDGE_Y0 = { x: -0.5, y: 0, v: -0.25 };
const EDGE_DIAG = { x: -1.5, y: -1.5, v: -0.75 };
const CORNER_OO = { x: 0, y: 0, v: 0 };
const CORNER_MO = { x: -3, y: 0, v: 6 };
const CORNER_OM = { x: 0, y: -3, v: 6 };

function f(x, y) {
  return x * x + y * y - x * y + x + y;
}

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="40%" cy="58%" r="62%">
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

function Triangle({ fill = 'var(--amber-400)', stroke = 'var(--amber-400)',
                    fillOpacity = 0.10, strokeOpacity = 0.7, strokeWidth = 2.4 }) {
  const a = toSvg(V_OO.x, V_OO.y);
  const b = toSvg(V_MO.x, V_MO.y);
  const c = toSvg(V_OM.x, V_OM.y);
  const pts = `${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy}`;
  return (
    <g>
      <polygon points={pts} fill={fill} fillOpacity={fillOpacity}
               stroke={stroke} strokeWidth={strokeWidth}
               strokeOpacity={strokeOpacity} strokeLinejoin="round"/>
    </g>
  );
}

// Marching-squares contour generator, clipped to the triangle.
function pointInTriangle(x, y) {
  return x <= 1e-6 && y <= 1e-6 && (x + y) >= -3 - 1e-6;
}

function contourPaths(levels) {
  const NX = 90, NY = 90;
  const dx = (X_MAX - X_MIN) / NX;
  const dy = (Y_MAX - Y_MIN) / NY;
  const grid = new Array(NX + 1);
  for (let i = 0; i <= NX; i++) {
    grid[i] = new Array(NY + 1);
    const x = X_MIN + i * dx;
    for (let j = 0; j <= NY; j++) {
      const y = Y_MIN + j * dy;
      grid[i][j] = f(x, y);
    }
  }
  const out = [];
  for (const c of levels) {
    const segments = [];
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NY; j++) {
        const x0 = X_MIN + i * dx, y0 = Y_MIN + j * dy;
        const x1 = x0 + dx, y1 = y0 + dy;
        const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
        if (!pointInTriangle(cx, cy)) continue;
        const a = grid[i][j], b = grid[i + 1][j],
              cc = grid[i + 1][j + 1], d = grid[i][j + 1];
        const pts = [];
        const lerp = (va, vb, xa, ya, xb, yb) => {
          const t = (c - va) / (vb - va);
          return [xa + t * (xb - xa), ya + t * (yb - ya)];
        };
        if ((a - c) * (b - c) < 0) pts.push(lerp(a, b, x0, y0, x1, y0));
        if ((b - c) * (cc - c) < 0) pts.push(lerp(b, cc, x1, y0, x1, y1));
        if ((cc - c) * (d - c) < 0) pts.push(lerp(cc, d, x1, y1, x0, y1));
        if ((d - c) * (a - c) < 0) pts.push(lerp(d, a, x0, y1, x0, y0));
        if (pts.length >= 2) {
          const p0 = toSvg(pts[0][0], pts[0][1]);
          const p1 = toSvg(pts[1][0], pts[1][1]);
          segments.push(`M ${p0.sx.toFixed(1)} ${p0.sy.toFixed(1)} L ${p1.sx.toFixed(1)} ${p1.sy.toFixed(1)}`);
        }
      }
    }
    out.push(segments.join(' '));
  }
  return out;
}

const CONTOUR_LEVELS = [-0.9, -0.4, 0.2, 1.0, 2.0, 3.2, 4.6, 6.0];

function Contours({ opacity = 0.45 }) {
  const paths = contourPaths(CONTOUR_LEVELS);
  return (
    <g>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--chalk-300)"
              strokeWidth={1.3} strokeLinecap="round" opacity={opacity}/>
      ))}
    </g>
  );
}

// A labelled candidate dot. Renders a coloured circle at (x, y) with the
// f-value beside it.
function Candidate({ x, y, color, label, labelDX = 14, labelDY = -14, radius = 8 }) {
  const p = toSvg(x, y);
  return (
    <g>
      <circle cx={p.sx} cy={p.sy} r={radius + 4}
              fill={color} fillOpacity={0.18}/>
      <circle cx={p.sx} cy={p.sy} r={radius}
              fill={color} stroke="var(--chalk-100)" strokeWidth={1.5}/>
      <text x={p.sx + labelDX} y={p.sy + labelDY}
            fill={color} fontFamily="var(--font-mono)"
            fontSize={14} letterSpacing="0.04em">
        {label}
      </text>
    </g>
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

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="extrema on a closed region"
      title="Global Extrema on a Triangle"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={10.86}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={10.86} end={30.36}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={30.36} end={43.26}>
        <InteriorBeat/>
      </Sprite>

      <Sprite start={43.26} end={57.26}>
        <EdgesBeat/>
      </Sprite>

      <Sprite start={57.26} end={67.71}>
        <CornersBeat/>
      </Sprite>

      <Sprite start={67.71} end={80.04}>
        <CompareBeat/>
      </Sprite>

      <Sprite start={80.04} end={SCENE_DURATION}>
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
        Interior, edges, corners.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  return (
    <>
      <GridMaskedSvg maskId="get-setup-mask">
        <SvgFadeIn duration={0.5} delay={0.0}><Axes/></SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={0.5}>
          <Triangle/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.7} delay={2.5}>
          <Contours/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={210} width={420}>
        <FadeUp duration={0.45} delay={1.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>the function</FadeUp>

        <FadeUp duration={0.55} delay={1.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          f = x<sup>2</sup> + y<sup>2</sup> − x y + x + y
        </FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.06em',
            marginTop: 6,
          }}>
          x ≤ 0,&nbsp; y ≤ 0,&nbsp; x + y ≥ −3
        </FadeUp>

        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Closed, bounded, continuous — <br/>a min and a max exist.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Interior critical point ──────────────────────────────────────
function InteriorBeat() {
  return (
    <>
      <GridMaskedSvg maskId="get-interior-mask">
        <Axes/>
        <Triangle fillOpacity={0.06} strokeOpacity={0.5}/>
        <Contours opacity={0.32}/>

        <SvgFadeIn duration={0.5} delay={0.8}>
          <Candidate x={INTERIOR.x} y={INTERIOR.y}
                     color="var(--emerald-400)"
                     label="f = −1"
                     labelDX={16} labelDY={-16}
                     radius={9}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={420}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--emerald-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>1. interior critical point</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.35,
            marginTop: 4,
          }}>
          ∇f = (2x − y + 1,&nbsp; 2y − x + 1)
        </FadeUp>

        <FadeUp duration={0.5} delay={2.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 20, color: 'var(--chalk-200)', lineHeight: 1.35,
          }}>
          ∇f = 0 → (x, y) = (−1, −1)
        </FadeUp>

        <FadeUp duration={0.5} delay={3.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 15,
            color: 'var(--emerald-400)', letterSpacing: '0.06em',
            marginTop: 4,
          }}>
          f(−1, −1) = −1
        </FadeUp>

        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Inside the triangle — a strong candidate for the minimum.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Three edge minimisers ────────────────────────────────────────
function EdgesBeat() {
  return (
    <>
      <GridMaskedSvg maskId="get-edges-mask">
        <Axes/>
        <Triangle fillOpacity={0.06} strokeOpacity={0.5}/>
        <Contours opacity={0.32}/>

        {/* Interior candidate stays faded as context. */}
        <Candidate x={INTERIOR.x} y={INTERIOR.y}
                   color="var(--emerald-400)"
                   label="−1"
                   labelDX={12} labelDY={-14}
                   radius={6}/>

        <SvgFadeIn duration={0.4} delay={0.4}>
          <Candidate x={EDGE_X0.x} y={EDGE_X0.y}
                     color="var(--rose-400)"
                     label="−1/4"
                     labelDX={16} labelDY={6}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.8}>
          <Candidate x={EDGE_Y0.x} y={EDGE_Y0.y}
                     color="var(--rose-400)"
                     label="−1/4"
                     labelDX={4} labelDY={-16}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={3.2}>
          <Candidate x={EDGE_DIAG.x} y={EDGE_DIAG.y}
                     color="var(--rose-400)"
                     label="−3/4"
                     labelDX={-26} labelDY={20}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={420}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>2. edge minimisers</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 19, color: 'var(--chalk-100)', lineHeight: 1.55,
            marginTop: 4,
          }}>
          On x = 0: f(0, y) = y<sup>2</sup> + y →&nbsp;
          <span style={{ color: 'var(--rose-400)' }}>(0, −1/2), f = −1/4</span><br/>
          On y = 0: f(x, 0) = x<sup>2</sup> + x →&nbsp;
          <span style={{ color: 'var(--rose-400)' }}>(−1/2, 0), f = −1/4</span><br/>
          On x + y = −3 →&nbsp;
          <span style={{ color: 'var(--rose-400)' }}>(−3/2, −3/2), f = −3/4</span>
        </FadeUp>

        <FadeUp duration={0.5} delay={4.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 6,
          }}>
          Restrict, take a one-variable derivative, solve.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: Three corners ────────────────────────────────────────────────
function CornersBeat() {
  return (
    <>
      <GridMaskedSvg maskId="get-corners-mask">
        <Axes/>
        <Triangle fillOpacity={0.06} strokeOpacity={0.5}/>
        <Contours opacity={0.32}/>

        {/* Prior candidates stay faded. */}
        <Candidate x={INTERIOR.x} y={INTERIOR.y} color="var(--emerald-400)"
                   label="−1" labelDX={12} labelDY={-14} radius={6}/>
        <Candidate x={EDGE_X0.x} y={EDGE_X0.y} color="var(--rose-400)"
                   label="" radius={4}/>
        <Candidate x={EDGE_Y0.x} y={EDGE_Y0.y} color="var(--rose-400)"
                   label="" radius={4}/>
        <Candidate x={EDGE_DIAG.x} y={EDGE_DIAG.y} color="var(--rose-400)"
                   label="" radius={4}/>

        <SvgFadeIn duration={0.4} delay={0.4}>
          <Candidate x={CORNER_OO.x} y={CORNER_OO.y}
                     color="var(--chalk-100)"
                     label="f = 0"
                     labelDX={20} labelDY={-12}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.6}>
          <Candidate x={CORNER_MO.x} y={CORNER_MO.y}
                     color="var(--amber-400)"
                     label="f = 6"
                     labelDX={-18} labelDY={-16}
                     radius={11}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={3.0}>
          <Candidate x={CORNER_OM.x} y={CORNER_OM.y}
                     color="var(--amber-400)"
                     label="f = 6"
                     labelDX={16} labelDY={6}
                     radius={11}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={210} width={420}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>3. corners</FadeUp>

        <FadeUp duration={0.55} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.5,
            marginTop: 4,
          }}>
          (0, 0): &nbsp;f = <span style={{ color: 'var(--chalk-100)' }}>0</span><br/>
          (−3, 0): f = <span style={{ color: 'var(--amber-400)' }}>6</span><br/>
          (0, −3): f = <span style={{ color: 'var(--amber-400)' }}>6</span>
        </FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 6,
          }}>
          The big values live at the corners.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 6: Compare and declare winners ──────────────────────────────────
function CompareBeat() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 1120, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>compare candidates</FadeUp>

      <div style={{
        display: 'flex', flexDirection: 'row', gap: 36,
        alignItems: 'stretch', justifyContent: 'center',
        marginTop: 8,
      }}>
        <FadeUp duration={0.6} delay={0.35} distance={14}
          style={{
            width: 360,
            padding: '24px 26px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid var(--emerald-400)',
            borderRadius: 18,
            boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            gap: 10,
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--emerald-400)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>global minimum</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 44, color: 'var(--chalk-100)', lineHeight: 1.1,
          }}>
            f = <span style={{ color: 'var(--emerald-400)' }}>−1</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)',
          }}>
            at (−1, −1) — interior critical point
          </div>
        </FadeUp>

        <FadeUp duration={0.6} delay={0.9} distance={14}
          style={{
            width: 360,
            padding: '24px 26px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid var(--amber-400)',
            borderRadius: 18,
            boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            gap: 10,
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-400)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>global maximum</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 44, color: 'var(--chalk-100)', lineHeight: 1.1,
          }}>
            f = <span style={{ color: 'var(--amber-400)' }}>6</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)',
          }}>
            at (−3, 0) and (0, −3) — two corners
          </div>
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        seven candidates → smallest and largest win
      </FadeUp>
    </div>
  );
}

// ─── Beat 7: Hero outro ───────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 1000, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.4} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>the takeaway</FadeUp>

      <FadeUp duration={0.6} delay={0.2} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 48, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Interior, edges, <span style={{ color: 'var(--amber-300)' }}>corners</span>.
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
