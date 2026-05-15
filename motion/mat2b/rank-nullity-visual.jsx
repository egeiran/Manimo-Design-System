// Rank, Nullity, and a Squashed Plane — Manimo lesson scene.
// Chapter 2 / week 4 of mat2b. Visualises the rank-nullity theorem on a
// concrete singular 2×2 matrix:
//   A = [[2, 1], [2, 1]]   columns are parallel → rank 1, nullity 1
// The kernel direction is (1, −2) (because  2·1 + 1·(−2) = 0).
//
// Beats:
//   0– 4    Manimo hook
//   4–10    Setup — identity grid, e₁, e₂, A revealed in matrix panel
//  10–19    Collapse — animate the morph; the whole grid squashes to one line
//  19–25    Kernel — surface the input direction that maps to the origin
//  25–end   Hero outro — rank + nullity = dim(domain)
//
// Sprite ranges are placeholder until `npm run audio rank-nullity-visual`
// rewires them from the ElevenLabs manifest.
//
// Colour discipline (matches linear-transformation-grid):
//   chalk-300  reference grid + axes underlay
//   chalk-200  axes
//   amber-400  transformed grid (the object being acted on)
//   violet-400 e₁ + A·e₁
//   teal-400   e₂ + A·e₂
//   emerald-400 the surviving image line (final answer)
//   rose-400   kernel direction (what got squashed)
//   amber-300  takeaway accent

const SCENE_DURATION = 40;

const NARRATION = [
  "What happens when a matrix has nowhere to go? Watch the plane collapse.",
  "Here is the standard grid, the basis vectors e one and e two, and a singular matrix A whose two columns point the same way.",
  "Apply A. The whole grid squashes down onto one line — the image of A. That single line is its rank one range.",
  "Some non-zero vectors land exactly on the origin. Those make up the kernel — a one-dimensional line collapsed away by A.",
  "Rank plus nullity equals the dimension of the input. One direction survives, one direction dies — together they account for the whole plane.",
];

const NARRATION_AUDIO = 'audio/rank-nullity-visual/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 480;
const ORIGIN_Y = 380;
const UNIT = 70;
const GRID_X_MIN = -7, GRID_X_MAX = 10;
const GRID_Y_MIN = -5, GRID_Y_MAX = 5;
const IDENTITY = [[1, 0], [0, 1]];

// The singular matrix at the heart of the scene.
const A_TARGET = [[2, 1], [2, 1]];

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}
function applyM(M, x, y) {
  return [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
}
function lerpM(target, t) {
  return [
    [1 + (target[0][0] - 1) * t, 0 + (target[0][1] - 0) * t],
    [0 + (target[1][0] - 0) * t, 1 + (target[1][1] - 1) * t],
  ];
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
    lines.push(
      <line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke={color} strokeWidth={strokeWidth} opacity={opacity}
            strokeLinecap="round"/>
    );
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const [ax, ay] = applyM(M, GRID_X_MIN, k);
    const [bx, by] = applyM(M, GRID_X_MAX, k);
    const a = toSvg(ax, ay), b = toSvg(bx, by);
    lines.push(
      <line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke={color} strokeWidth={strokeWidth} opacity={opacity}
            strokeLinecap="round"/>
    );
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
  dashed = false,
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
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '6 6' : undefined}/>
      <path d={`M ${tip.sx} ${tip.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ children, right = 64, top = 196, width = 360, left, bottom, transform }) {
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

function MatrixPanel({ eyebrow, rows, footnote = null, delay = 0 }) {
  return (
    <SoftPanel>
      <FadeUp duration={0.4} delay={delay} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>{eyebrow}</FadeUp>

      <FadeUp duration={0.55} delay={delay + 0.2} distance={10}>
        <div style={{
          position: 'relative',
          padding: '18px 26px',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 38, color: 'var(--chalk-100)', lineHeight: 1.25,
        }}>
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 14,
            borderLeft: '2.5px solid var(--chalk-200)',
            borderTop: '2.5px solid var(--chalk-200)',
            borderBottom: '2.5px solid var(--chalk-200)',
          }}/>
          <span style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 14,
            borderRight: '2.5px solid var(--chalk-200)',
            borderTop: '2.5px solid var(--chalk-200)',
            borderBottom: '2.5px solid var(--chalk-200)',
          }}/>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(110px, 1fr) minmax(110px, 1fr)',
            columnGap: 28, rowGap: 10, textAlign: 'center',
          }}>
            <span style={{ color: 'var(--violet-400)' }}>{rows[0][0]}</span>
            <span style={{ color: 'var(--teal-400)'   }}>{rows[0][1]}</span>
            <span style={{ color: 'var(--violet-400)' }}>{rows[1][0]}</span>
            <span style={{ color: 'var(--teal-400)'   }}>{rows[1][1]}</span>
          </div>
        </div>
      </FadeUp>

      {footnote && (
        <FadeUp duration={0.45} delay={delay + 0.9} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.35,
            maxWidth: '32ch',
          }}>{footnote}</FadeUp>
      )}
    </SoftPanel>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="rank · nullity"
      title="A Singular Matrix Squashes the Plane"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.54}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.54} end={13.08}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={13.08} end={21.29}>
        <CollapseBeat/>
      </Sprite>

      <Sprite start={21.29} end={29.39}>
        <KernelBeat/>
      </Sprite>

      <Sprite start={29.39} end={SCENE_DURATION}>
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
        Watch the plane collapse.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  return (
    <>
      <GridMaskedSvg maskId="rnv-setup-mask">
        <SvgFadeIn duration={0.6} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.2} opacity={0.4}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.2}>
          <Axes/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.6}>
          <Vector x={1} y={0} color="var(--violet-400)"
                  label="e₁" labelDX={0} labelDY={28}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.9}>
          <Vector x={0} y={1} color="var(--teal-400)"
                  label="e₂" labelDX={-22} labelDY={6}/>
        </SvgFadeIn>
        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <MatrixPanel
        eyebrow="singular A"
        rows={[
          ['2', '1'],
          ['2', '1'],
        ]}
        footnote="Column 2 is half of column 1 — the columns are parallel."
        delay={1.6}
      />
    </>
  );
}

// ─── Beat 3: Collapse ─────────────────────────────────────────────────────
function CollapseBeat() {
  const { localTime, duration: spriteDur } = useSprite();

  // Morph identity → A_TARGET, hold, fade-in emerald "image" line.
  const settle = 0.6;
  const morphDur = 3.4;
  let t;
  if (localTime < settle) t = 0;
  else if (localTime < settle + morphDur) {
    t = Easing.easeInOutCubic((localTime - settle) / morphDur);
  } else {
    t = 1;
  }
  const M = lerpM(A_TARGET, t);

  const [e1x, e1y] = applyM(M, 1, 0);
  const [e2x, e2y] = applyM(M, 0, 1);

  // Image line — direction of (2, 2). Reveal once collapse is mostly done.
  const imageReveal = clamp((localTime - (settle + morphDur + 0.2)) / 0.9, 0, 1);
  const imageOpacity = 0.85 * Easing.easeOutCubic(imageReveal);

  // The image line passes through origin in direction (1, 1) (slope 1).
  const lineExtent = 6;
  const lineA = toSvg(-lineExtent, -lineExtent);
  const lineB = toSvg(lineExtent, lineExtent);

  return (
    <>
      <GridMaskedSvg maskId="rnv-collapse-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.1} opacity={0.28}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={M} color="var(--amber-400)"
                           strokeWidth={1.6} opacity={0.85}/>
        </SvgFadeIn>
        <Axes/>

        {/* Emerald glow line — the image of A, once collapse is visible. */}
        {imageReveal > 0.02 && (
          <g opacity={imageOpacity}>
            <line x1={lineA.sx} y1={lineA.sy} x2={lineB.sx} y2={lineB.sy}
                  stroke="var(--emerald-400)" strokeWidth={10}
                  strokeLinecap="round" opacity={0.18}/>
            <line x1={lineA.sx} y1={lineA.sy} x2={lineB.sx} y2={lineB.sy}
                  stroke="var(--emerald-400)" strokeWidth={3}
                  strokeLinecap="round"/>
          </g>
        )}

        <SvgFadeIn duration={0.3} delay={0.4}>
          <Vector x={e1x} y={e1y} color="var(--violet-400)"
                  label="A·e₁" labelDX={26} labelDY={-12}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={0.6}>
          <Vector x={e2x} y={e2y} color="var(--teal-400)"
                  label="A·e₂" labelDX={28} labelDY={20}/>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>image of A</FadeUp>
        <FadeUp duration={0.6} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
          The whole plane lands on one&nbsp;
          <span style={{ color: 'var(--emerald-400)' }}>line</span>.
        </FadeUp>
        <FadeUp duration={0.5} delay={4.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--emerald-400)', letterSpacing: '0.08em',
            marginTop: 6,
          }}>
          rank A = 1
        </FadeUp>
        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          One direction survives. The other has nowhere to go.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Kernel ───────────────────────────────────────────────────────
function KernelBeat() {
  const { localTime } = useSprite();
  // Kernel direction in input space: (1, −2) because 2·1 + 1·(−2) = 0.
  const kx = 1, ky = -2;
  const norm = Math.hypot(kx, ky);
  const ux = kx / norm, uy = ky / norm;
  const lineExtent = 4.5;
  const a = toSvg(-lineExtent * ux, -lineExtent * uy);
  const b = toSvg(lineExtent * ux, lineExtent * uy);

  // The image line still glows in the background (faintly), to remind us
  // it's the same picture as the previous beat.
  const imageA = toSvg(-6, -6);
  const imageB = toSvg(6, 6);

  // Kernel vector pulses slightly so the eye follows it.
  const pulse = 1.4 + 0.25 * Math.sin(localTime * 2.6);

  return (
    <>
      <GridMaskedSvg maskId="rnv-kernel-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.1} opacity={0.28}/>
        </SvgFadeIn>
        <Axes/>

        {/* The faded amber image line — what was. */}
        <g opacity={0.45}>
          <line x1={imageA.sx} y1={imageA.sy} x2={imageB.sx} y2={imageB.sy}
                stroke="var(--emerald-400)" strokeWidth={2.4}
                strokeLinecap="round" opacity={0.55}/>
        </g>

        {/* The kernel line — rose, dashed, through origin. */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                stroke="var(--rose-400)" strokeWidth={3}
                strokeLinecap="round" strokeDasharray="8 8" opacity={0.85}/>
        </SvgFadeIn>

        {/* A representative kernel vector v_k = (1, −2) pulsing in length. */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <Vector x={pulse * ux * 2.0} y={pulse * uy * 2.0}
                  color="var(--rose-400)"
                  label="v_k" labelDX={20} labelDY={18}
                  strokeWidth={3.6} glow={0.6}/>
        </SvgFadeIn>

        {/* Show that v_k maps to origin — a small rose dot at origin. */}
        <SvgFadeIn duration={0.5} delay={2.4}>
          <g>
            <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={11}
                    fill="var(--rose-400)" opacity={0.25}/>
            <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={5}
                    fill="var(--rose-400)"/>
          </g>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>kernel of A</FadeUp>
        <FadeUp duration={0.6} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
          The line of vectors A sends to&nbsp;
          <span style={{ color: 'var(--rose-400)' }}>zero</span>.
        </FadeUp>
        <FadeUp duration={0.5} delay={1.8} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--rose-400)', letterSpacing: '0.08em',
            marginTop: 6,
          }}>
          nullity A = 1
        </FadeUp>
        <FadeUp duration={0.5} delay={2.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Direction (1, −2) collapses onto the origin.
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
        }}>the rank-nullity theorem</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        rank + nullity = <span style={{ color: 'var(--amber-300)' }}>dim(domain)</span>
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '38ch', lineHeight: 1.3,
        }}>
          One direction survives, one direction dies — <br/>together they account for the whole plane.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 10,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        <span style={{ color: 'var(--emerald-400)' }}>rank 1</span>
        &nbsp;+&nbsp;
        <span style={{ color: 'var(--rose-400)' }}>nullity 1</span>
        &nbsp;=&nbsp;2
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
