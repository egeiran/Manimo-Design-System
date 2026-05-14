// Phase Portraits of a 2×2 Linear System — Manimo lesson scene.
// Chapter 4 / week 9 of mat2b. For x' = A x with a 2×2 matrix A, the
// eigenvalues of A determine the geometry of trajectories. Three signature
// cases are shown in sequence — each with its own vector field, a fan of
// trajectories from a ring of initial conditions, and (where relevant)
// the real eigenvector axes highlighted.
//
// Cases:
//   1. Stable node    — A = [[-1.4, 0], [0, -0.6]]    λ ≈ -1.4, -0.6      (both negative real)
//   2. Saddle         — A = [[-1.0, 0.3], [0.3, 0.8]]  λ ≈ -1.06, 0.86    (mixed signs)
//   3. Stable spiral  — A = [[-0.25, -1.1], [1.1, -0.25]] λ ≈ -0.25 ± 1.1i (complex, Re<0)
//
// Beats:
//    0– 4.6   Manimo hook
//   4.6–16    Stable node
//   16–28     Saddle
//   28–39     Stable spiral
//   39–end    Hero outro
//
// Colour discipline:
//   chalk-200/300  axes + faint vector field
//   emerald-400    stable-node trajectories (converging happily)
//   rose-400       saddle trajectories (the warning case)
//   amber-400      spiral trajectories
//   violet-400     stable eigenvector (incoming)
//   teal-400       unstable eigenvector (outgoing)
//   amber-300      takeaway accent

const SCENE_DURATION = 48;

const NARRATION = [
  "For a linear system x prime equals A x, the eigenvalues of A decide what its trajectories look like. Three cases. Three pictures.",
  "Two negative real eigenvalues. Every trajectory bends toward the origin along the eigenvector directions. The origin is a stable node — a sink.",
  "One positive eigenvalue and one negative. Along one eigenvector trajectories rush in, along the other they rush out. The origin is a saddle — unstable.",
  "A complex conjugate pair with negative real part. No real eigenvector to fall along — trajectories rotate as they shrink. The origin is a stable spiral.",
  "The eigenvalues of A tell you the picture. Read the signs, then read the portrait.",
];

const NARRATION_AUDIO = 'audio/phase-portrait-2x2/scene.mp3';

// ─── Helpers ──────────────────────────────────────────────────────────────
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

function GridMaskedSvg({ maskId, cx = '36%', cy = '54%', r = '60%', children }) {
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

// Phase plane geometry (shared by all three case beats).
const ORIGIN_X = 450;
const ORIGIN_Y = 380;
const UNIT = 95;
function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function PhaseAxes() {
  const left = toSvg(-3.2, 0), right = toSvg(3.2, 0);
  const bot = toSvg(0, -2.5), top = toSvg(0, 2.5);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <text x={right.sx + 12} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>y<sub>1</sub></text>
      <text x={top.sx - 22} y={top.sy - 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>y<sub>2</sub></text>
      <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={4}
              fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
    </g>
  );
}

// Light vector-field arrows on a coarse grid.
function VectorField({ A, density = 0.7, scale = 0.18, opacity = 0.42 }) {
  const arrows = [];
  for (let i = -3; i <= 3; i++) {
    for (let j = -2; j <= 2; j++) {
      const x = i * density, y = j * density;
      if (Math.hypot(x, y) < 0.15) continue;
      const dx = A[0][0] * x + A[0][1] * y;
      const dy = A[1][0] * x + A[1][1] * y;
      const m = Math.hypot(dx, dy);
      if (m < 1e-4) continue;
      const ux = dx / m, uy = dy / m;
      const L = Math.min(0.5, m * scale);
      const a = toSvg(x, y);
      const b = toSvg(x + ux * L, y + uy * L);
      const bdx = b.sx - a.sx, bdy = b.sy - a.sy;
      const blen = Math.hypot(bdx, bdy);
      if (blen < 0.8) continue;
      const nx = bdx / blen, ny = bdy / blen;
      const headLen = 6, headHalf = 3;
      const baseX = b.sx - nx * headLen, baseY = b.sy - ny * headLen;
      const perpX = -ny, perpY = nx;
      const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
      const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
      arrows.push(
        <g key={`${i},${j}`} opacity={opacity}>
          <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
                stroke="var(--chalk-300)" strokeWidth={1.2} strokeLinecap="round"/>
          <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`}
                fill="var(--chalk-300)"/>
        </g>
      );
    }
  }
  return <g>{arrows}</g>;
}

// Integrate a trajectory of x' = A x from (x0, y0). Returns array of svg
// points. Steps go forward in time; for saddle "incoming" arms we will
// integrate backward in time by negating A.
function trajectory(A, x0, y0, dt = 0.02, N = 700, forward = true, bound = 6) {
  const pts = [];
  let x = x0, y = y0;
  pts.push(toSvg(x, y));
  for (let i = 0; i < N; i++) {
    const dx = A[0][0] * x + A[0][1] * y;
    const dy = A[1][0] * x + A[1][1] * y;
    const sign = forward ? 1 : -1;
    x = x + sign * dt * dx;
    y = y + sign * dt * dy;
    if (Math.hypot(x, y) > bound) break;
    if (Math.hypot(x, y) < 0.005) break;
    pts.push(toSvg(x, y));
  }
  return pts;
}

function pointsToPath(pts) {
  if (pts.length < 2) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

function partialPath(pts, t) {
  if (pts.length < 2) return '';
  const last = (pts.length - 1) * t;
  const fullIdx = Math.floor(last);
  const frac = last - fullIdx;
  const arr = pts.slice(0, fullIdx + 1);
  if (frac > 0 && fullIdx + 1 < pts.length) {
    const a = pts[fullIdx], b = pts[fullIdx + 1];
    const ix = a.sx + (b.sx - a.sx) * frac;
    const iy = a.sy + (b.sy - a.sy) * frac;
    arr.push({ sx: ix, sy: iy });
  }
  return pointsToPath(arr);
}

// A small ring of initial conditions used by node/spiral beats.
function ring(radius, count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const th = (i / count) * 2 * Math.PI;
    out.push({ x: radius * Math.cos(th), y: radius * Math.sin(th) });
  }
  return out;
}

// Render a fan of trajectories, each revealed over time.
function TrajectoryFan({ A, seeds, color, revealStart = 0.6, perTrajLen = 1.6,
                        localTime, forward = true, dt = 0.02, N = 700 }) {
  return (
    <g>
      {seeds.map((s, i) => {
        const pts = trajectory(A, s.x, s.y, dt, N, forward);
        const start = revealStart + i * 0.15;
        const t = clamp((localTime - start) / perTrajLen, 0, 1);
        if (t <= 0) return null;
        return (
          <g key={i}>
            <path d={partialPath(pts, t)}
                  fill="none" stroke={color}
                  strokeWidth={2.6} strokeLinecap="round" opacity={0.95}/>
            <circle cx={pts[0].sx} cy={pts[0].sy} r={3.5}
                    fill={color} stroke="var(--chalk-100)" strokeWidth={0.6}/>
          </g>
        );
      })}
    </g>
  );
}

// Eigenvector line (drawn as a long faint pair of segments through origin).
function EigenAxis({ vx, vy, color, length = 3.6, label, labelOffset = 1.0, opacity = 0.85 }) {
  const m = Math.hypot(vx, vy);
  const ux = vx / m, uy = vy / m;
  const a = toSvg(-ux * length, -uy * length);
  const b = toSvg(ux * length, uy * length);
  const labelPt = toSvg(ux * (length - labelOffset), uy * (length - labelOffset));
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke={color} strokeWidth={2}
            strokeLinecap="round" strokeDasharray="6 6" opacity={opacity}/>
      {label && (
        <text x={labelPt.sx} y={labelPt.sy - 10}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={18}>{label}</text>
      )}
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="linear ODE systems"
      title="Phase Portraits of 2×2 Systems"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={10.7}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={10.7} end={21.26}>
        <StableNodeBeat/>
      </Sprite>

      <Sprite start={21.26} end={32.13}>
        <SaddleBeat/>
      </Sprite>

      <Sprite start={32.13} end={42.23}>
        <SpiralBeat/>
      </Sprite>

      <Sprite start={42.23} end={SCENE_DURATION}>
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
        Three eigen-signatures. <br/>Three portraits.
      </FadeUp>
    </div>
  );
}

// ─── Case panels — shared chrome ──────────────────────────────────────────
function CasePanel({ tag, tagColor, headline, formulaRows, lambdaLine, lambdaColor, verdict, verdictColor, delayBase = 0 }) {
  return (
    <SoftPanel right={64} top={140} width={440}>
      <FadeUp duration={0.45} delay={delayBase + 0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: tagColor, letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>{tag}</FadeUp>

      <FadeUp duration={0.55} delay={delayBase + 0.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.35,
          marginTop: 4,
        }}>
        {headline}
      </FadeUp>

      <FadeUp duration={0.55} delay={delayBase + 1.6} distance={10}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.4,
        }}>
        x′ = A x &nbsp;with&nbsp;
        <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle' }}>
          <BracketMatrix2x2 rows={formulaRows}/>
        </span>
      </FadeUp>

      <FadeUp duration={0.5} delay={delayBase + 3.2} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: lambdaColor, letterSpacing: '0.06em',
        }}>
        {lambdaLine}
      </FadeUp>

      <FadeUp duration={0.5} delay={delayBase + 4.4} distance={8}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 18, color: verdictColor, lineHeight: 1.4,
          maxWidth: '34ch',
        }}>
        {verdict}
      </FadeUp>
    </SoftPanel>
  );
}

function BracketMatrix2x2({ rows }) {
  return (
    <span style={{
      position: 'relative', display: 'inline-block',
      padding: '6px 14px', margin: '0 6px',
      fontFamily: 'var(--font-mono)', fontSize: 17, color: 'var(--chalk-100)',
      lineHeight: 1.2,
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 7,
        borderLeft: '2px solid var(--chalk-200)',
        borderTop: '2px solid var(--chalk-200)',
        borderBottom: '2px solid var(--chalk-200)',
      }}/>
      <span style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 7,
        borderRight: '2px solid var(--chalk-200)',
        borderTop: '2px solid var(--chalk-200)',
        borderBottom: '2px solid var(--chalk-200)',
      }}/>
      <span style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(36px, auto) minmax(36px, auto)',
        columnGap: 12, rowGap: 2, textAlign: 'center',
      }}>
        <span>{rows[0][0]}</span>
        <span>{rows[0][1]}</span>
        <span>{rows[1][0]}</span>
        <span>{rows[1][1]}</span>
      </span>
    </span>
  );
}

// ─── Beat 2: Stable node ──────────────────────────────────────────────────
function StableNodeBeat() {
  const { localTime } = useSprite();
  const A = [[-1.4, 0], [0, -0.6]];
  const seeds = ring(2.0, 8).map(s => ({ x: s.x, y: s.y }));

  return (
    <>
      <GridMaskedSvg maskId="pp-node-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><VectorField A={A}/></SvgFadeIn>
        <PhaseAxes/>
        <SvgFadeIn duration={0.4} delay={0.4}>
          {/* Eigenaxes — x-axis (λ=-1.4) and y-axis (λ=-0.6) */}
          <g>
            <EigenAxis vx={1} vy={0} color="var(--violet-400)"
                       label="λ₁ = −1.4" labelOffset={0.6}/>
            <EigenAxis vx={0} vy={1} color="var(--teal-400)"
                       label="λ₂ = −0.6" labelOffset={0.6}/>
          </g>
        </SvgFadeIn>
        <TrajectoryFan A={A} seeds={seeds}
                       color="var(--emerald-400)"
                       revealStart={1.4}
                       perTrajLen={2.6}
                       localTime={localTime}/>
      </GridMaskedSvg>

      <CasePanel
        tag="case 1 — stable node"
        tagColor="var(--emerald-400)"
        headline={<>Both eigenvalues real <br/> and negative.</>}
        formulaRows={[['−1.4', '0'], ['0', '−0.6']]}
        lambdaLine="λ₁ = −1.4   λ₂ = −0.6"
        lambdaColor="var(--violet-400)"
        verdict={<>All trajectories spiral in along the eigen-axes. The origin is a sink.</>}
        verdictColor="var(--chalk-300)"
      />
    </>
  );
}

// ─── Beat 3: Saddle ───────────────────────────────────────────────────────
function SaddleBeat() {
  const { localTime } = useSprite();
  // Symmetric matrix with eigenvalues of opposite sign.
  const A = [[-1.0, 0.3], [0.3, 0.8]];

  // Eigenvectors (closed form for symmetric 2×2).
  // trace=−0.2, det=−0.89, disc=sqrt(0.01+0.89)=sqrt(0.9)≈0.9487
  // λ₁ ≈ −0.2/2 − 0.9487 ≈ −1.05    (stable manifold)
  // λ₂ ≈ −0.2/2 + 0.9487 ≈  0.85    (unstable manifold)
  const tr = -0.2, det = -0.89;
  const disc = Math.sqrt(tr * tr / 4 - det);
  const l1 = tr / 2 - disc;
  const l2 = tr / 2 + disc;
  // Eigvec for l1: (a − l1) v_x + b v_y = 0 → v = (b, l1 − a) = (0.3, l1 + 1)
  const e1x = 0.3, e1y = l1 + 1;
  const e2x = 0.3, e2y = l2 + 1;
  const norm = (vx, vy) => { const m = Math.hypot(vx, vy); return [vx / m, vy / m]; };
  const [e1nx, e1ny] = norm(e1x, e1y);
  const [e2nx, e2ny] = norm(e2x, e2y);

  // Seeds slightly off each axis to show stable in / unstable out behaviour.
  // Stable arms (incoming): integrate backward in time from near-origin points along stable eigvec? Easier:
  // forward-integrate from points just off the unstable manifold; trajectories
  // first head toward stable axis, then peel away along unstable.
  const seeds = [
    { x:  1.8, y:  0.2 },
    { x: -1.8, y: -0.2 },
    { x:  0.2, y:  1.8 },
    { x: -0.2, y: -1.8 },
    { x:  1.5, y: -1.2 },
    { x: -1.5, y:  1.2 },
  ];

  return (
    <>
      <GridMaskedSvg maskId="pp-saddle-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><VectorField A={A}/></SvgFadeIn>
        <PhaseAxes/>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <g>
            <EigenAxis vx={e1nx} vy={e1ny} color="var(--violet-400)"
                       label="stable" labelOffset={0.5} opacity={0.85}/>
            <EigenAxis vx={e2nx} vy={e2ny} color="var(--teal-400)"
                       label="unstable" labelOffset={0.5} opacity={0.85}/>
          </g>
        </SvgFadeIn>
        <TrajectoryFan A={A} seeds={seeds}
                       color="var(--rose-400)"
                       revealStart={1.4}
                       perTrajLen={3.2}
                       localTime={localTime}
                       N={400}/>
      </GridMaskedSvg>

      <CasePanel
        tag="case 2 — saddle"
        tagColor="var(--rose-400)"
        headline={<>Real eigenvalues <br/>of opposite sign.</>}
        formulaRows={[['−1.0', '0.3'], ['0.3', '0.8']]}
        lambdaLine={`λ₁ ≈ ${l1.toFixed(2)}   λ₂ ≈ ${l2.toFixed(2)}`}
        lambdaColor="var(--rose-400)"
        verdict={<>In along the <span style={{ color: 'var(--violet-400)' }}>stable</span> eigenvector, out along the <span style={{ color: 'var(--teal-400)' }}>unstable</span> one.</>}
        verdictColor="var(--chalk-300)"
      />
    </>
  );
}

// ─── Beat 4: Stable spiral ────────────────────────────────────────────────
function SpiralBeat() {
  const { localTime } = useSprite();
  // Real part −0.25, imaginary part ±1.1 → mild inward spiral.
  const A = [[-0.25, -1.1], [1.1, -0.25]];
  const seeds = [
    { x: 2.0, y: 0 },
    { x: -2.0, y: 0 },
    { x: 0, y: 2.0 },
    { x: 0, y: -2.0 },
  ];

  return (
    <>
      <GridMaskedSvg maskId="pp-spiral-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><VectorField A={A}/></SvgFadeIn>
        <PhaseAxes/>
        <TrajectoryFan A={A} seeds={seeds}
                       color="var(--amber-400)"
                       revealStart={1.2}
                       perTrajLen={3.6}
                       localTime={localTime}
                       dt={0.025} N={900}/>
      </GridMaskedSvg>

      <CasePanel
        tag="case 3 — stable spiral"
        tagColor="var(--amber-400)"
        headline={<>Complex conjugate pair <br/>with negative real part.</>}
        formulaRows={[['−0.25', '−1.1'], ['1.1', '−0.25']]}
        lambdaLine="λ = −0.25 ± 1.1 i"
        lambdaColor="var(--amber-400)"
        verdict={<>No real eigenvector — trajectories rotate as they shrink.</>}
        verdictColor="var(--chalk-300)"
      />
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
      maxWidth: 1040, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>eigenvalues → portrait</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 50, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        The signs of <span style={{ color: 'var(--amber-300)' }}>λ</span> decide the geometry.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '44ch', lineHeight: 1.3,
        }}>
        <span style={{ color: 'var(--emerald-400)' }}>Node</span> &middot; <span style={{ color: 'var(--rose-400)' }}>saddle</span> &middot; <span style={{ color: 'var(--amber-400)' }}>spiral</span>.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        read the signs · read the portrait
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
