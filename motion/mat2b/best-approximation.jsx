// Best Approximation: The Perpendicular Wins — Manimo lesson scene.
// Chapter 3 / week 7 of mat2b. Visual proof that the closest point in a
// subspace to an outside vector is the orthogonal projection.
//
// 2D analogue (line L instead of plane, point u above it):
//   • L = span((1, 0)) — the x-axis for simplicity
//   • u = (3, 2) — the point above the line
//   • foot p = (3, 0) = proj_L(u)
//   • Candidate q slides along L; ‖u − q‖ pulses but always ≥ ‖u − p‖ = 2.
//
// Beats:
//   0– 4   Manimo hook
//   4–10   Setup — line L, point u, ask the question
//  10–19   Candidates — slide q, watch the distance
//  19–28   Perpendicular — drop, name p, right-angle mark + inequality
//  28–end  Hero outro
//
// Colour discipline:
//   chalk-300  reference grid
//   chalk-200  line L + axes
//   rose-400   the outside point u (target)
//   teal-400   candidate points on L + their connecting distances
//   amber-400  the perpendicular drop
//   emerald-400 the winning foot p + right angle
//   amber-300  takeaway accent

const SCENE_DURATION = 35;

const NARRATION = [
  "What point on a line is closest to a point off the line? Find out.",
  "Here's a point u sitting off a line L. We want the closest point on L to u.",
  "Try any other point on L — measure the distance. As we slide along the line, the distance changes, but it never beats the perpendicular drop.",
  "Drop a perpendicular from u straight down onto L. That foot, p, is the projection — and it is the unique closest point.",
  "The closest point in any subspace to a vector outside it is the orthogonal projection. That's the best approximation theorem.",
];

const NARRATION_AUDIO = 'audio/best-approximation/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 460;
const ORIGIN_Y = 460;
const UNIT = 80;
const GRID_X_MIN = -2, GRID_X_MAX = 7;
const GRID_Y_MIN = -1, GRID_Y_MAX = 4;

// The outside point u and the line direction. L is the x-axis so the
// projection is just (u_x, 0).
const U = [3, 2];
const P = [3, 0]; // foot of perpendicular from u to L

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="48%" cy="60%" r="58%">
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

function FaintGrid({ opacity = 0.22 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const a = toSvg(k, GRID_Y_MIN), b = toSvg(k, GRID_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
      stroke="var(--chalk-300)" strokeWidth={1.0} opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const a = toSvg(GRID_X_MIN, k), b = toSvg(GRID_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
      stroke="var(--chalk-300)" strokeWidth={1.0} opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

// The line L — drawn extra prominent.
function LineL({ glow = false }) {
  const a = toSvg(GRID_X_MIN, 0);
  const b = toSvg(GRID_X_MAX, 0);
  return (
    <g>
      {glow && (
        <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
              stroke="var(--amber-300)" strokeWidth={9}
              strokeLinecap="round" opacity={0.18}/>
      )}
      <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={3.2} strokeLinecap="round"/>
      <text x={b.sx - 30} y={b.sy - 14}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>L</text>
    </g>
  );
}

function VerticalAxis() {
  const a = toSvg(0, GRID_Y_MIN);
  const b = toSvg(0, GRID_Y_MAX);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"
          opacity={0.5}/>
  );
}

function PointDot({ x, y, color, label = null, labelDX = 0, labelDY = 0,
                    r = 7, glow = 0 }) {
  const p = toSvg(x, y);
  return (
    <g>
      {glow > 0 && (
        <circle cx={p.sx} cy={p.sy} r={r * 2.2}
                fill={color} opacity={0.25 * glow}/>
      )}
      <circle cx={p.sx} cy={p.sy} r={r} fill={color}/>
      {label != null && (
        <text x={p.sx + labelDX} y={p.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function DistanceSegment({ from, to, color, strokeWidth = 2.6, dashed = false, opacity = 0.95 }) {
  const a = toSvg(from[0], from[1]);
  const b = toSvg(to[0], to[1]);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeLinecap="round"
          strokeDasharray={dashed ? '7 6' : undefined}/>
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

function RightAngleSq({ at, alongDeg, perpDeg, size = 16, color = 'var(--emerald-400)' }) {
  // Draws a right-angle square with one side along `alongDeg` and the other along `perpDeg`.
  const aRad = alongDeg * Math.PI / 180;
  const pRad = perpDeg * Math.PI / 180;
  const u = [Math.cos(aRad), Math.sin(aRad)];
  const w = [Math.cos(pRad), Math.sin(pRad)];
  const su = size / UNIT;
  const p0 = toSvg(at[0], at[1]);
  const p1 = toSvg(at[0] + u[0] * su, at[1] + u[1] * su);
  const p2 = toSvg(at[0] + u[0] * su + w[0] * su, at[1] + u[1] * su + w[1] * su);
  const p3 = toSvg(at[0] + w[0] * su, at[1] + w[1] * su);
  return (
    <path d={`M ${p1.sx} ${p1.sy} L ${p2.sx} ${p2.sy} L ${p3.sx} ${p3.sy}`}
          fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round"/>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="projection · approximation"
      title="Best Approximation: The Perpendicular Wins"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.45}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.45} end={9.45}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={9.45} end={17.87}>
        <CandidatesBeat/>
      </Sprite>

      <Sprite start={17.87} end={25.86}>
        <PerpendicularBeat/>
      </Sprite>

      <Sprite start={25.86} end={SCENE_DURATION}>
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
          maxWidth: '26ch', lineHeight: 1.3,
        }}>
        Where on the line is closest?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  return (
    <>
      <GridMaskedSvg maskId="ba-setup-mask">
        <SvgFadeIn duration={0.5} delay={0.0}><FaintGrid/></SvgFadeIn>
        <VerticalAxis/>
        <SvgFadeIn duration={0.5} delay={0.0}>
          <LineL glow={true}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.6}>
          <PointDot x={U[0]} y={U[1]} color="var(--rose-400)"
                    label="u" labelDX={20} labelDY={-12} glow={0.7}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>the question</FadeUp>
        <FadeUp duration={0.6} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Which point on&nbsp;<span style={{ color: 'var(--chalk-200)' }}>L</span>
          &nbsp;is closest to&nbsp;<span style={{ color: 'var(--rose-400)' }}>u</span>?
        </FadeUp>
        <FadeUp duration={0.5} delay={2.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Distance is the length of the segment from u to the candidate.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Candidates ───────────────────────────────────────────────────
function CandidatesBeat() {
  const { localTime, duration: spriteDur } = useSprite();

  // q slides across L from x=0 to x=6 and back, easing.
  // Period ~ 7 s; ensure at least one full back-and-forth.
  const phase = (localTime / spriteDur) * 2 * Math.PI;
  const qx = 3 + 3 * Math.sin(phase);                   // 0 → 6
  const qy = 0;
  const dist = Math.hypot(U[0] - qx, U[1] - qy);

  return (
    <>
      <GridMaskedSvg maskId="ba-cand-mask">
        <FaintGrid/>
        <VerticalAxis/>
        <LineL/>

        {/* Distance segment u → q. */}
        <DistanceSegment from={U} to={[qx, qy]}
                         color="var(--teal-400)" strokeWidth={2.8}/>

        {/* The target u — pinned. */}
        <PointDot x={U[0]} y={U[1]} color="var(--rose-400)"
                  label="u" labelDX={20} labelDY={-12} glow={0.5}/>

        {/* Candidate q on the line. */}
        <PointDot x={qx} y={qy} color="var(--teal-400)"
                  label="q" labelDX={0} labelDY={28} r={8} glow={0.6}/>

        {/* Live distance readout above the segment midpoint. */}
        <text x={toSvg((U[0] + qx) / 2 + 0.15, (U[1] + qy) / 2).sx}
              y={toSvg((U[0] + qx) / 2 + 0.15, (U[1] + qy) / 2).sy - 12}
              fill="var(--teal-400)" fontFamily="var(--font-mono)"
              fontSize={16} textAnchor="start">
          ‖u − q‖ = {dist.toFixed(2)}
        </text>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>slide the candidate</FadeUp>
        <FadeUp duration={0.6} delay={0.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          The distance to&nbsp;<span style={{ color: 'var(--teal-400)' }}>q</span>
          &nbsp;wobbles as it moves.
        </FadeUp>
        <FadeUp duration={0.5} delay={2.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Notice how it dips when q passes underneath u — that's the clue.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Perpendicular ────────────────────────────────────────────────
function PerpendicularBeat() {
  const { localTime } = useSprite();

  // Phase 0–1.5  drop the perpendicular from u down to p.
  // Phase 1.5–3.0  reveal foot p + right-angle marker.
  // Phase 3.0+    inequality statement.
  const dropT = Easing.easeInOutCubic(clamp(localTime / 1.4, 0, 1));
  const footReveal = clamp((localTime - 1.5) / 0.8, 0, 1);
  const rightT = clamp((localTime - 2.2) / 0.6, 0, 1);

  // Faded teal candidate showing q at some other spot — to compare.
  const compareQ = [5.4, 0];

  return (
    <>
      <GridMaskedSvg maskId="ba-perp-mask">
        <FaintGrid/>
        <VerticalAxis/>
        <LineL/>

        {/* The faded losing candidate q. */}
        <g opacity={0.55}>
          <DistanceSegment from={U} to={compareQ}
                           color="var(--teal-400)" strokeWidth={2.2} dashed/>
          <PointDot x={compareQ[0]} y={compareQ[1]} color="var(--teal-400)"
                    label="q" labelDX={0} labelDY={28} r={6}/>
        </g>

        {/* The perpendicular drop from u to p, animated. */}
        <DistanceSegment
          from={U}
          to={[U[0], U[1] * (1 - dropT)]}
          color="var(--amber-400)"
          strokeWidth={3.6}/>

        {/* Foot p with emerald glow. */}
        {footReveal > 0.05 && (
          <g opacity={footReveal}>
            <PointDot x={P[0]} y={P[1]} color="var(--emerald-400)"
                      label="p" labelDX={20} labelDY={28} r={8} glow={0.9}/>
          </g>
        )}

        {/* Right-angle marker at p. */}
        {rightT > 0.05 && (
          <g opacity={rightT}>
            <RightAngleSq at={P} alongDeg={0} perpDeg={90}/>
          </g>
        )}

        {/* The target u — pinned. */}
        <PointDot x={U[0]} y={U[1]} color="var(--rose-400)"
                  label="u" labelDX={20} labelDY={-12} glow={0.5}/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>drop the perpendicular</FadeUp>

        <FadeUp duration={0.55} delay={0.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          The foot&nbsp;<span style={{ color: 'var(--emerald-400)' }}>p</span>
          &nbsp;is the&nbsp;<span style={{ color: 'var(--amber-300)' }}>projection</span> of u onto L.
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-200)',
            lineHeight: 1.45,
          }}>
          ‖u − <span style={{ color: 'var(--emerald-400)' }}>p</span>‖ &nbsp;≤&nbsp;
          ‖u − <span style={{ color: 'var(--teal-400)' }}>q</span>‖
        </FadeUp>

        <FadeUp duration={0.5} delay={3.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '36ch',
          }}>
          For any other point&nbsp;<span style={{ color: 'var(--teal-400)' }}>q</span>
          &nbsp;on L. Pythagoras forces it.
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
      maxWidth: 920, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>best approximation theorem</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 60, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Closest = <span style={{ color: 'var(--amber-300)' }}>perpendicular</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
          In any subspace, the closest point to an outside vector <br/>
          is its orthogonal projection.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        <span style={{ color: 'var(--emerald-400)' }}>p = proj<sub>L</sub>(u)</span>
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
