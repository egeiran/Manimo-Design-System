// Change of Basis: P Converts the Reading — Manimo lesson scene.
// Chapter 2 / week 5 of mat2b. The same arrow has two coordinate readings
// depending on which basis you measure it against. The change-of-basis
// matrix P has the new basis vectors as its columns:
//   P · [v]_B  =  [v]_std
// Concrete numbers used in the scene:
//   b₁ = (2, 0.5), b₂ = (−1, 1.5)
//   [v]_B = (1, 1), so v = 1·b₁ + 1·b₂ = (1, 2)
//   [v]_std = (1, 2)
//
// Beats:
//   0– 4    Manimo hook
//   4–13    Two-frame diagram: standard grid + tilted B-grid + vector v
//  13–24    The matrix P — columns are b₁ and b₂; equation appears
//  24–30    Plug-in: verify P · (1,1) = (1, 2)
//  30–end   Hero outro
//
// Colour discipline:
//   chalk-300  standard grid
//   amber-400  tilted B-basis grid
//   violet-400 b₁
//   teal-400   b₂
//   rose-400   the vector v
//   emerald-400 verified equality
//   amber-300  takeaway accent

const SCENE_DURATION = 39;

const NARRATION = [
  "Same arrow, two readings. How do you convert between them?",
  "Here is a vector v. The standard basis reads it as one across and two up. A tilted basis B with two slanted axes reads the same arrow as one of b one plus one of b two.",
  "Stack the new basis vectors as columns of a matrix P. Multiplying P by the B-coordinates of v gives back its standard coordinates.",
  "Plug in the numbers. P times one comma one gives one comma two — exactly the standard reading.",
  "The change-of-basis matrix is just the new basis, written as columns. Stack and multiply.",
];

const NARRATION_AUDIO = 'audio/change-of-basis-matrix/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 480;
const ORIGIN_Y = 380;
const UNIT = 70;
const GRID_X_MIN = -7, GRID_X_MAX = 10;
const GRID_Y_MIN = -5, GRID_Y_MAX = 5;
const IDENTITY = [[1, 0], [0, 1]];

// New basis. Columns of P will be b₁ and b₂ as standard-coordinate vectors.
const B1 = [2, 0.5];
const B2 = [-1, 1.5];
// P stacks them. (P sends [v]_B to [v]_std.)
const P = [
  [B1[0], B2[0]],
  [B1[1], B2[1]],
];

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}
function applyM(M, x, y) {
  return [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="48%" cy="56%" r="58%">
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

function TransformedGrid({ M, color, strokeWidth = 1.6, opacity = 1 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const [ax, ay] = applyM(M, k, GRID_Y_MIN);
    const [bx, by] = applyM(M, k, GRID_Y_MAX);
    const a = toSvg(ax, ay), b = toSvg(bx, by);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
      stroke={color} strokeWidth={strokeWidth} opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const [ax, ay] = applyM(M, GRID_X_MIN, k);
    const [bx, by] = applyM(M, GRID_X_MAX, k);
    const a = toSvg(ax, ay), b = toSvg(bx, by);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
      stroke={color} strokeWidth={strokeWidth} opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes() {
  const left = toSvg(GRID_X_MIN, 0);
  const right = toSvg(GRID_X_MAX, 0);
  const bottom = toSvg(0, GRID_Y_MIN);
  const top = toSvg(0, GRID_Y_MAX);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bottom.sx} y2={bottom.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
    </g>
  );
}

function Vector({
  x, y, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.8, headLen = 14, headHalf = 7.5, glow = 0,
}) {
  const o = toSvg(0, 0);
  const tip = toSvg(x, y);
  const dx = tip.sx - o.sx, dy = tip.sy - o.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = tip.sx - ux * headLen;
  const baseY = tip.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      {glow > 0 && (
        <line x1={o.sx} y1={o.sy} x2={tip.sx} y2={tip.sy}
              stroke={color} strokeWidth={strokeWidth + 6}
              strokeLinecap="round" opacity={0.2 * glow}/>
      )}
      <line x1={o.sx} y1={o.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${tip.sx} ${tip.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
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
      eyebrow="coordinate vectors"
      title="Change of Basis: P Converts the Reading"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.18}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.18} end={16.51}>
        <TwoFramesBeat/>
      </Sprite>

      <Sprite start={16.51} end={25.29}>
        <MatrixPBeat/>
      </Sprite>

      <Sprite start={25.29} end={31.56}>
        <VerifyBeat/>
      </Sprite>

      <Sprite start={31.56} end={SCENE_DURATION}>
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
        Same arrow, two readings.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Two frames ──────────────────────────────────────────────────
function TwoFramesBeat() {
  // v sits at (1, 2) in standard coords.
  const vx = 1, vy = 2;
  return (
    <>
      <GridMaskedSvg maskId="cob-frames-mask">
        <SvgFadeIn duration={0.6} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.2} opacity={0.35}/>
        </SvgFadeIn>
        {/* Tilted B-grid */}
        <SvgFadeIn duration={0.6} delay={0.3}>
          <TransformedGrid M={P} color="var(--amber-400)"
                           strokeWidth={1.3} opacity={0.55}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.5}>
          <Axes/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.6}>
          <Vector x={B1[0]} y={B1[1]} color="var(--violet-400)"
                  label="b₁" labelDX={22} labelDY={-8}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.9}>
          <Vector x={B2[0]} y={B2[1]} color="var(--teal-400)"
                  label="b₂" labelDX={-22} labelDY={-4}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={1.4}>
          <Vector x={vx} y={vy} color="var(--rose-400)"
                  label="v" labelDX={20} labelDY={-8}
                  strokeWidth={4.2} glow={0.5}/>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>two readings of v</FadeUp>

        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.5,
            marginTop: 4,
          }}>
          <div>standard&nbsp;
            <span style={{ color: 'var(--chalk-200)' }}>[v]<sub>std</sub> =&nbsp;</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>(1, 2)</span>
          </div>
          <div style={{ marginTop: 8 }}>
            B-basis&nbsp;
            <span style={{ color: 'var(--amber-300)' }}>[v]<sub>B</sub> =&nbsp;</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>(1, 1)</span>
          </div>
        </FadeUp>

        <FadeUp duration={0.5} delay={5.8} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          One arrow. Two ways to spell it.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Matrix P ─────────────────────────────────────────────────────
function MatrixPBeat() {
  const vx = 1, vy = 2;
  return (
    <>
      <GridMaskedSvg maskId="cob-matrixp-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.1} opacity={0.25}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={P} color="var(--amber-400)"
                           strokeWidth={1.2} opacity={0.45}/>
        </SvgFadeIn>
        <Axes/>

        <Vector x={B1[0]} y={B1[1]} color="var(--violet-400)"
                label="b₁" labelDX={22} labelDY={-8}/>
        <Vector x={B2[0]} y={B2[1]} color="var(--teal-400)"
                label="b₂" labelDX={-22} labelDY={-4}/>
        <Vector x={vx} y={vy} color="var(--rose-400)"
                label="v" labelDX={20} labelDY={-8}
                strokeWidth={4.0} glow={0.4}/>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      {/* Matrix panel — columns are b₁ (violet) and b₂ (teal). */}
      <SoftPanel right={64} top={188} width={380}>
        <FadeUp duration={0.4} delay={0.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>change-of-basis matrix</FadeUp>

        <FadeUp duration={0.55} delay={0.6} distance={10}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 36, color: 'var(--chalk-100)', lineHeight: 1.2,
          }}>
            <span>P =</span>
            <div style={{
              position: 'relative', padding: '14px 22px',
            }}>
              <span style={{
                position: 'absolute', left: 0, top: 0, bottom: 0, width: 12,
                borderLeft: '2.5px solid var(--chalk-200)',
                borderTop: '2.5px solid var(--chalk-200)',
                borderBottom: '2.5px solid var(--chalk-200)',
              }}/>
              <span style={{
                position: 'absolute', right: 0, top: 0, bottom: 0, width: 12,
                borderRight: '2.5px solid var(--chalk-200)',
                borderTop: '2.5px solid var(--chalk-200)',
                borderBottom: '2.5px solid var(--chalk-200)',
              }}/>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(70px, 1fr) minmax(70px, 1fr)',
                columnGap: 24, rowGap: 6, textAlign: 'center',
                fontFamily: 'var(--font-mono)', fontStyle: 'normal',
                fontSize: 28,
              }}>
                <span style={{ color: 'var(--violet-400)' }}>2</span>
                <span style={{ color: 'var(--teal-400)'   }}>−1</span>
                <span style={{ color: 'var(--violet-400)' }}>0.5</span>
                <span style={{ color: 'var(--teal-400)'   }}>1.5</span>
              </div>
            </div>
          </div>
        </FadeUp>

        <FadeUp duration={0.5} delay={1.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Column 1 is <span style={{ color: 'var(--violet-400)' }}>b₁</span>,&nbsp;
          column 2 is <span style={{ color: 'var(--teal-400)' }}>b₂</span> — in standard coordinates.
        </FadeUp>

        <FadeUp duration={0.55} delay={4.2} distance={10}
          style={{
            marginTop: 8,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--amber-300)',
            lineHeight: 1.3,
          }}>
          P · [v]<sub>B</sub> = [v]<sub>std</sub>
        </FadeUp>

        <FadeUp duration={0.5} delay={5.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Feed in the B-reading; out comes the standard reading.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Verify ───────────────────────────────────────────────────────
function VerifyBeat() {
  const { localTime } = useSprite();
  const vx = 1, vy = 2;
  const glow = Easing.easeOutCubic(clamp((localTime - 2.4) / 1.2, 0, 1));

  return (
    <>
      <GridMaskedSvg maskId="cob-verify-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.1} opacity={0.25}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={P} color="var(--amber-400)"
                           strokeWidth={1.2} opacity={0.4}/>
        </SvgFadeIn>
        <Axes/>

        <Vector x={B1[0]} y={B1[1]} color="var(--violet-400)"
                label="b₁" labelDX={22} labelDY={-8}/>
        <Vector x={B2[0]} y={B2[1]} color="var(--teal-400)"
                label="b₂" labelDX={-22} labelDY={-4}/>

        <Vector x={vx} y={vy}
                color={glow > 0.5 ? 'var(--emerald-400)' : 'var(--rose-400)'}
                label="v" labelDX={20} labelDY={-8}
                strokeWidth={4.6} glow={0.4 + 0.6 * glow}/>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>plug in the numbers</FadeUp>

        <FadeUp duration={0.55} delay={0.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.55,
            marginTop: 4,
          }}>
          <div>
            P · <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>(1, 1)</span> =&nbsp;
            <span style={{ color: 'var(--violet-400)' }}>1·b₁</span> +&nbsp;
            <span style={{ color: 'var(--teal-400)' }}>1·b₂</span>
          </div>
          <div style={{ marginTop: 6 }}>
            =&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal',
                            color: 'var(--emerald-400)' }}>(1, 2)</span>
            <span style={{ color: 'var(--chalk-300)', fontSize: 17, marginLeft: 8 }}>
              ✓
            </span>
          </div>
        </FadeUp>

        <FadeUp duration={0.5} delay={2.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          Same arrow — now confirmed by arithmetic.
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
        }}>change of basis</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 60, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        P = [ <span style={{ color: 'var(--violet-400)' }}>b₁</span>
        &nbsp;|&nbsp;
        <span style={{ color: 'var(--teal-400)' }}>b₂</span> ]
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 28, color: 'var(--chalk-200)',
          maxWidth: '38ch', lineHeight: 1.3,
        }}>
          Columns are the new basis. <br/>Stack them, multiply, translate.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        P · [v]<sub>B</sub>&nbsp;=&nbsp;[v]<sub>std</sub>
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
