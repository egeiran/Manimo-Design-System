// Diagonalisation: Eigenvectors as Natural Axes — Manimo lesson scene.
// Chapter 4 (Differensialligninger, eigen-stuff). Apply the symmetric
// matrix A = [[2, 1], [1, 2]] to the unit circle. It becomes an ellipse.
// Two directions (the eigenvectors) only stretch and never rotate — they
// are the natural axes of A, and in those coordinates A is diagonal.

const SCENE_DURATION = 39;

const NARRATION = [
  "Apply a matrix to every point on the unit circle. What comes out?",
  "Start with the unit circle, and pick a matrix — say A equals two, one, one, two.",
  "Send every point through A. The circle becomes an ellipse. Most directions tilt as they stretch.",
  "But two directions are stubborn — they only stretch, they don't rotate. These are the eigenvectors, and their stretch factors are the eigenvalues lambda one and lambda two.",
  "Use them as a new basis. In those coordinates, A is just diagonal — pure stretching along the axes.",
  "Hard problems become easy in the right basis.",
];

const NARRATION_AUDIO = 'audio/diagonalisation-eigenaxes/scene.mp3';

// ─── Geometry ────────────────────────────────────────────────────────────
const ORIGIN_X = 500;
const ORIGIN_Y = 380;
const UNIT = 76;
const GRID_X_MIN = -5, GRID_X_MAX = 8;
const GRID_Y_MIN = -4, GRID_Y_MAX = 4;

// The matrix we diagonalise.
const A = [[2, 1], [1, 2]];
// Eigenvalues 3 and 1, eigenvectors (1, 1)/√2 and (1, −1)/√2.
const SQRT2 = Math.SQRT2;
const E1 = [1 / SQRT2, 1 / SQRT2];     // eigenvector with λ = 3 (along +45°)
const E2 = [1 / SQRT2, -1 / SQRT2];    // eigenvector with λ = 1 (along −45°)
const LAMBDA1 = 3;
const LAMBDA2 = 1;

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}
function applyM(M, x, y) {
  return [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
}

// ─── Grid mask ───────────────────────────────────────────────────────────
function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="48%" cy="56%" r="60%">
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

function ReferenceGrid({ opacity = 0.3 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const a = toSvg(k, GRID_Y_MIN);
    const b = toSvg(k, GRID_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const a = toSvg(GRID_X_MIN, k);
    const b = toSvg(GRID_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes() {
  const left = toSvg(GRID_X_MIN, 0), right = toSvg(GRID_X_MAX, 0);
  const bot = toSvg(0, GRID_Y_MIN), top = toSvg(0, GRID_Y_MAX);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
    </g>
  );
}

// Unit circle (or its image under M·lerp). Each sample point is t-lerped
// from its position on the unit circle to Ap.
function MorphedShape({ M, t = 0, color = 'var(--amber-400)',
                         samples = 80, strokeWidth = 2.2,
                         dashed = false, opacity = 1, showPoints = false }) {
  const pts = [];
  const dotElements = [];
  for (let i = 0; i < samples; i++) {
    const theta = (i / samples) * 2 * Math.PI;
    const cx = Math.cos(theta), cy = Math.sin(theta);
    const [ax, ay] = applyM(M, cx, cy);
    const x = cx + (ax - cx) * t;
    const y = cy + (ay - cy) * t;
    const p = toSvg(x, y);
    pts.push(`${p.sx.toFixed(1)},${p.sy.toFixed(1)}`);
    if (showPoints && i % 6 === 0) {
      dotElements.push(
        <circle key={`d${i}`} cx={p.sx} cy={p.sy} r={2.6}
                fill="var(--amber-300)" opacity={0.85}/>
      );
    }
  }
  const d = 'M ' + pts.join(' L ') + ' Z';
  return (
    <g style={{ opacity }}>
      <path d={d} fill="none" stroke={color}
            strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '6 5' : undefined}/>
      {dotElements}
    </g>
  );
}

function Vector({
  x, y, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.6, headLen = 13, headHalf = 7,
  fromX = 0, fromY = 0, opacity = 1, dashed = false,
}) {
  const a = toSvg(fromX, fromY);
  const b = toSvg(x, y);
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
    <g style={{ opacity }}>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '6 5' : undefined}/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

// Long dashed line through origin along direction `v`.
function AxisLine({ v, color = 'var(--amber-300)', k = 4, opacity = 0.65 }) {
  const a = toSvg(-k * v[0], -k * v[1]);
  const b = toSvg( k * v[0],  k * v[1]);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={2}
          strokeDasharray="8 6" opacity={opacity} strokeLinecap="round"/>
  );
}

function SoftPanel({ children, right = 60, top = 200, width = 360 }) {
  return (
    <div style={{
      position: 'absolute', right, top, width,
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

// ─── Matrix box helper ───────────────────────────────────────────────────
function MatrixBox({ cells, colColors = ['var(--chalk-100)', 'var(--chalk-100)'],
                     fontSize = 30 }) {
  return (
    <div style={{
      position: 'relative', padding: '12px 22px',
      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
      fontSize, color: 'var(--chalk-100)', lineHeight: 1.2,
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 12,
        borderLeft: '2.2px solid var(--chalk-200)',
        borderTop: '2.2px solid var(--chalk-200)',
        borderBottom: '2.2px solid var(--chalk-200)',
      }}/>
      <span style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 12,
        borderRight: '2.2px solid var(--chalk-200)',
        borderTop: '2.2px solid var(--chalk-200)',
        borderBottom: '2.2px solid var(--chalk-200)',
      }}/>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(48px, 1fr) minmax(48px, 1fr)',
        rowGap: 4, columnGap: 24, textAlign: 'center',
      }}>
        <span style={{ color: colColors[0] }}>{cells[0][0]}</span>
        <span style={{ color: colColors[1] }}>{cells[0][1]}</span>
        <span style={{ color: colColors[0] }}>{cells[1][0]}</span>
        <span style={{ color: colColors[1] }}>{cells[1][1]}</span>
      </div>
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="diagonalisation"
      title="Eigenvectors Are the Natural Axes"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.63}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.63} end={11.34}>
        <SetupCircleBeat/>
      </Sprite>

      <Sprite start={11.34} end={17.87}>
        <ApplyMorphBeat/>
      </Sprite>

      <Sprite start={17.87} end={28.38}>
        <RevealEigenBeat/>
      </Sprite>

      <Sprite start={28.38} end={35.43}>
        <DiagonaliseBeat/>
      </Sprite>

      <Sprite start={35.43} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

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
          fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)', maxWidth: '26ch', lineHeight: 1.3,
        }}>
        A circle, a matrix, an ellipse — and two stubborn axes.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: unit circle + matrix card ───────────────────────────────────
function SetupCircleBeat() {
  return (
    <>
      <GridMaskedSvg maskId="diag-setup-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><ReferenceGrid/></SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}><Axes/></SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={1.0}>
          <MorphedShape M={[[1,0],[0,1]]} t={0}
                        color="var(--amber-400)" samples={120}
                        showPoints={true} strokeWidth={2.2}/>
        </SvgFadeIn>
        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={2.6} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          the matrix
        </FadeUp>
        <FadeUp duration={0.55} delay={3.0} distance={10}>
          <MatrixBox cells={[['2', '1'], ['1', '2']]}
                     colColors={['var(--violet-400)', 'var(--teal-400)']}/>
        </FadeUp>
        <FadeUp duration={0.5} delay={4.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)',
            maxWidth: '34ch', lineHeight: 1.4, marginTop: 4,
          }}>
          We'll send every point of the unit circle through A.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: morph circle → ellipse ──────────────────────────────────────
function ApplyMorphBeat() {
  const { localTime } = useSprite();
  // Settle 0.6s, morph 2.6s, hold.
  const morphT = clamp((localTime - 0.6) / 2.6, 0, 1);
  const morphEased = Easing.easeInOutCubic(morphT);

  return (
    <>
      <GridMaskedSvg maskId="diag-morph-mask">
        <SvgFadeIn duration={0.3} delay={0.0}><ReferenceGrid opacity={0.22}/></SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={0.0}><Axes/></SvgFadeIn>

        {/* Ghost of original unit circle (dim) */}
        <MorphedShape M={[[1,0],[0,1]]} t={0}
                      color="var(--chalk-300)" samples={120}
                      strokeWidth={1.4} dashed={true} opacity={0.55}/>

        {/* Active morph */}
        <MorphedShape M={A} t={morphEased}
                      color="var(--amber-400)" samples={120}
                      showPoints={true} strokeWidth={2.4}/>

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={0.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          circle → ellipse
        </FadeUp>
        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            Every point <em>p</em> moves to <em>Ap</em>.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)',
            maxWidth: '34ch', lineHeight: 1.4, marginTop: 4,
          }}>
          Most points tilt and stretch as they go.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: reveal eigenvectors ─────────────────────────────────────────
function RevealEigenBeat() {
  const { localTime } = useSprite();

  // Show e1 and its image λ₁·e1, glowing.
  const e1tipImage = [LAMBDA1 * E1[0], LAMBDA1 * E1[1]];
  // e2 image is itself (λ₂ = 1).
  return (
    <>
      <GridMaskedSvg maskId="diag-eigen-mask">
        <SvgFadeIn duration={0.3} delay={0.0}><ReferenceGrid opacity={0.22}/></SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={0.0}><Axes/></SvgFadeIn>

        {/* Persistent unit circle + ellipse */}
        <MorphedShape M={[[1,0],[0,1]]} t={0}
                      color="var(--chalk-300)" samples={120}
                      strokeWidth={1.3} dashed={true} opacity={0.55}/>
        <MorphedShape M={A} t={1}
                      color="var(--amber-400)" samples={120}
                      strokeWidth={2.2} opacity={0.85}/>

        {/* The eigen-axes — long dashed lines through origin */}
        <SvgFadeIn duration={0.5} delay={2.4}>
          <AxisLine v={E1} color="var(--violet-400)" k={4} opacity={0.55}/>
          <AxisLine v={E2} color="var(--teal-400)" k={4} opacity={0.55}/>
        </SvgFadeIn>

        {/* Eigenvector v1 violet, with its image (stretched by 3) */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <Vector x={E1[0]} y={E1[1]} color="var(--violet-400)"
                  label="v₁" labelDX={-20} labelDY={-12} strokeWidth={3.8}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.6}>
          <Vector x={e1tipImage[0]} y={e1tipImage[1]} color="var(--violet-400)"
                  label="A v₁ = 3 v₁" labelDX={64} labelDY={6}
                  strokeWidth={2.6} dashed/>
        </SvgFadeIn>

        {/* Eigenvector v2 teal, image identical (λ₂ = 1) */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <Vector x={E2[0]} y={E2[1]} color="var(--teal-400)"
                  label="v₂" labelDX={20} labelDY={20} strokeWidth={3.8}/>
        </SvgFadeIn>

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={3.6} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          eigenvalues
        </FadeUp>
        <FadeUp duration={0.55} delay={4.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)',
            lineHeight: 1.4, marginTop: 4,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>λ₁ = 3</span><br/>
            <span style={{ color: 'var(--teal-400)' }}>λ₂ = 1</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={5.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)',
            maxWidth: '34ch', lineHeight: 1.4, marginTop: 4,
          }}>
          A v = λ v — no tilt, just stretch.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: diagonalisation formula ─────────────────────────────────────
function DiagonaliseBeat() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        in the eigenbasis
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={14}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 18,
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--chalk-100)', lineHeight: 1.1,
        }}>
          <span>A = P</span>
          <MatrixBox cells={[['3', '0'], ['0', '1']]}
                     colColors={['var(--violet-400)', 'var(--teal-400)']}
                     fontSize={44}/>
          <span>P<sup style={{ fontSize: '0.55em' }}>−1</sup></span>
        </div>
      </FadeUp>

      <FadeUp duration={0.55} delay={1.7} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 22, color: 'var(--chalk-200)',
          maxWidth: '38ch', lineHeight: 1.35,
        }}>
        change basis → stretch on each axis → change back.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.7} distance={10}
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        P = [ <span style={{ color: 'var(--violet-400)' }}>v₁</span> &nbsp;|&nbsp; <span style={{ color: 'var(--teal-400)' }}>v₂</span> ]
        &nbsp;&nbsp;·&nbsp;&nbsp;
        D = diag(3, 1)
      </FadeUp>
    </div>
  );
}

// ─── Hero outro ──────────────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: 920, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.75} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 54, color: 'var(--chalk-100)', lineHeight: 1.15,
        }}>
        Eigenvectors are the <span style={{ color: 'var(--amber-300)' }}>natural axes</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 25, color: 'var(--chalk-200)',
          maxWidth: '38ch', lineHeight: 1.3,
        }}>
        A acts diagonally in its own coordinates.
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
