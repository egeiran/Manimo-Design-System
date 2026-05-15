// Linear Transformations: A Matrix Moves the Grid — Manimo lesson scene.
// Calibration scene for the mat2b linear-algebra block. Sets the visual
// language for chapter 2: every 2×2 matrix bends the standard grid in one
// specific way, and its two columns are the images of e₁ and e₂.
//
// Beats (timed to single-track narration in motion/mat2b/audio/linear-transformation-grid/):
//    0– …   Manimo enters with the hook question
//    …– …   Setup — standard grid, axes, the two basis vectors
//    …– …   Rotation by θ = 35°
//    …– …   Scaling by diag(1.8, 0.55)
//    …– …   Shear [[1, 0.8],[0, 1]]
//    …– …   General A — matrix columns are images of the basis
//    …– end Hero outro — "a matrix is a verb"
// Sprite start/end values are re-wired by `npm run audio` once narration
// timings are known.
//
// Authoring notes:
//   • Color discipline for this whole linear-algebra block:
//       chalk-300  — identity reference grid (faint, always behind)
//       chalk-200  — axes (slightly brighter)
//       amber-400  — the transformed grid (the object being acted on)
//       violet-400 — e₁ basis vector (and column 1 of every matrix)
//       teal-400   — e₂ basis vector (and column 2 of every matrix)
//       amber-300  — the takeaway / payoff line
//   • Grid SVGs use a radial-gradient mask that fades the grid toward the
//     corners so SceneChrome's title (top-left), watermark (top-right) and
//     mascot (bottom-left) sit on a clean dark patch instead of being
//     crossed by grid lines.
//   • The MatrixPanel and right-side captions use a soft dark backdrop so
//     their type stays readable against the chalky grid behind them. The
//     hero outro skips the grid altogether so the closing line breathes.
//   • SvgFadeIn for anything inside <svg>; FadeUp / HTML for the matrix
//     panel and captions.
//   • SceneChrome supplies the title block, watermark and corner mascot —
//     don't redraw them.

const SCENE_DURATION = 63;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  "What does a matrix actually do to space? Let's look.",
  "Here is the standard grid, and two unit basis vectors — e one along the x-axis, and e two along the y-axis. Every other vector is built from these two.",
  "First, rotation. Spin the whole grid by an angle theta. Watch where e one and e two land — those landing spots become the two columns of the rotation matrix.",
  "Next, scaling. Stretch along x, squeeze along y. The basis vectors stay on their own axes, but their lengths change — and that change sits on the diagonal of the matrix.",
  "Now shear. Hold e one in place, but slide e two sideways. Vertical lines tilt; horizontal lines stay flat.",
  "Every two by two matrix works the same way. Wherever e one lands becomes column one. Wherever e two lands becomes column two.",
  "So a matrix is a verb — it does not describe space, it moves space.",
];

// Single continuous narration track. Beat <Sprite start> values below match
// the audioStart offsets in motion/mat2b/audio/linear-transformation-grid/manifest.json.
const NARRATION_AUDIO = 'audio/linear-transformation-grid/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
// Full-canvas SVG; math origin sits slightly left of centre so the right
// side of the stage stays clear for the matrix panel.
const ORIGIN_X = 480;
const ORIGIN_Y = 380;
const UNIT = 70;
const GRID_X_MIN = -7, GRID_X_MAX = 10;
const GRID_Y_MIN = -5, GRID_Y_MAX = 5;
const IDENTITY = [[1, 0], [0, 1]];

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

// Standard morph envelope used by every transformation beat. Hold expands
// to fill the beat so the same envelope reads on 7 s and 14 s beats alike.
function envelopeM({
  localTime, spriteDur, target,
  settle = 0.8, morphDur = 3.4, returnDur = 0.7, tailDur = 0.6,
}) {
  const holdDur = Math.max(0.4, spriteDur - settle - morphDur - returnDur - tailDur);
  const inStart = settle;
  const inEnd = settle + morphDur;
  const holdEnd = inEnd + holdDur;
  const outEnd = holdEnd + returnDur;
  let t;
  if (localTime < inStart) {
    t = 0;
  } else if (localTime < inEnd) {
    t = Easing.easeInOutCubic((localTime - inStart) / morphDur);
  } else if (localTime < holdEnd) {
    t = 1;
  } else if (localTime < outEnd) {
    t = 1 - Easing.easeInOutCubic((localTime - holdEnd) / returnDur);
  } else {
    t = 0;
  }
  return lerpM(target, t);
}

// Full-canvas SVG with a radial-gradient mask applied to its children.
// Grid fades toward the corners so SceneChrome's title, watermark and
// mascot sit on a clean dark patch. Each beat ships its own mask keyed
// by maskId — IDs are document-wide, so the unique key matters.
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
      <g mask={`url(#${maskId})`}>
        {children}
      </g>
    </svg>
  );
}

// ─── Shared SVG primitives ────────────────────────────────────────────────

function TransformedGrid({ M, color, strokeWidth = 1.6, opacity = 1 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const [ax, ay] = applyM(M, k, GRID_Y_MIN);
    const [bx, by] = applyM(M, k, GRID_Y_MAX);
    const a = toSvg(ax, ay);
    const b = toSvg(bx, by);
    lines.push(
      <line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke={color} strokeWidth={strokeWidth} opacity={opacity}
            strokeLinecap="round"/>
    );
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const [ax, ay] = applyM(M, GRID_X_MIN, k);
    const [bx, by] = applyM(M, GRID_X_MAX, k);
    const a = toSvg(ax, ay);
    const b = toSvg(bx, by);
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

function UnitSquare({ M, fill = 'var(--amber-400)', fillOpacity = 0.16 }) {
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const pts = corners.map(([x, y]) => {
    const [tx, ty] = applyM(M, x, y);
    const p = toSvg(tx, ty);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');
  return <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke="none"/>;
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
              strokeLinecap="round" opacity={0.18 * glow}/>
      )}
      <line x1={o.sx} y1={o.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${tip.sx} ${tip.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

// Soft-dark backdrop shared by every right-side panel and bottom card. The
// translucent fill keeps the chalky grid faintly visible behind the type
// without competing for legibility.
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

// ─── Matrix panel (HTML) ──────────────────────────────────────────────────
function MatrixPanel({ eyebrow, rows, footnote = null, delay = 0 }) {
  return (
    <SoftPanel>
      <FadeUp duration={0.4} delay={delay} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        {eyebrow}
      </FadeUp>

      <FadeUp duration={0.55} delay={delay + 0.2} distance={10}>
        <div style={{
          position: 'relative',
          padding: '18px 26px',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 38, color: 'var(--chalk-100)',
          lineHeight: 1.25,
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
          }}>
          {footnote}
        </FadeUp>
      )}
    </SoftPanel>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="linear transformations"
      title="A Matrix Moves the Grid"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.23}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.23} end={15.67}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={15.67} end={26.7}>
        <TransformationBeat
          target={(() => {
            const th = 35 * Math.PI / 180;
            return [[Math.cos(th), -Math.sin(th)],
                    [Math.sin(th),  Math.cos(th)]];
          })()}
          eyebrow="Rotation R(35°)"
          rows={[
            ['cos θ', '−sin θ'],
            ['sin θ',  'cos θ'],
          ]}
          footnote="θ = 35°. Columns are e₁ and e₂ swept onto a tilted axis."
          e1Label="T(e₁)"
          e2Label="T(e₂)"
        />
      </Sprite>

      <Sprite start={26.7} end={38.49}>
        <TransformationBeat
          target={[[1.8, 0], [0, 0.55]]}
          eyebrow="Scaling diag(1.8, 0.55)"
          rows={[
            ['1.8', '0'],
            ['0',   '0.55'],
          ]}
          footnote="x stretches by 1.8; y squeezes to 0.55. The diagonal carries the scale."
          e1Label="1.8 e₁"
          e2Label="0.55 e₂"
        />
      </Sprite>

      <Sprite start={38.49} end={47.07}>
        <TransformationBeat
          target={[[1, 0.8], [0, 1]]}
          eyebrow="Shear S(0.8)"
          rows={[
            ['1', '0.8'],
            ['0', '1'],
          ]}
          footnote="e₁ stays put. e₂ slides over by 0.8 — vertical lines tilt."
          e1Label="e₁"
          e2Label="T(e₂)"
        />
      </Sprite>

      <Sprite start={47.07} end={56.47}>
        <GeneralBeat/>
      </Sprite>

      <Sprite start={56.47} end={SCENE_DURATION}>
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
        A matrix moves the grid.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Setup — identity grid, axes, basis vectors ───────────────────
function SetupBeat() {
  return (
    <>
      <GridMaskedSvg maskId="ltg-setup-mask">
        <SvgFadeIn duration={0.6} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.2} opacity={0.4}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.2}>
          <Axes/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={8.5}>
          <UnitSquare M={IDENTITY}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={4.4}>
          <Vector x={1} y={0} color="var(--violet-400)"
                  label="e₁" labelDX={0} labelDY={28}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={6.4}>
          <Vector x={0} y={1} color="var(--teal-400)"
                  label="e₂" labelDX={-22} labelDY={6}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.5} delay={3.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          standard basis
        </FadeUp>
        <FadeUp duration={0.6} delay={4.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 30, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>e₁</span> along x,&nbsp;
            <span style={{ color: 'var(--teal-400)' }}>e₂</span> along y.
        </FadeUp>
        <FadeUp duration={0.5} delay={8.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          Every vector in the plane is a combination of these two.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beats 3–5: parameterised transformation beat ─────────────────────────
function TransformationBeat({ target, eyebrow, rows, footnote, e1Label, e2Label }) {
  const { localTime, duration: spriteDur } = useSprite();
  const M = envelopeM({ localTime, spriteDur, target });

  const [e1x, e1y] = applyM(M, 1, 0);
  const [e2x, e2y] = applyM(M, 0, 1);

  return (
    <>
      <GridMaskedSvg maskId="ltg-trans-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.1} opacity={0.28}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={M} color="var(--amber-400)"
                           strokeWidth={1.6} opacity={0.85}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <UnitSquare M={M}/>
        </SvgFadeIn>
        <Axes/>
        <SvgFadeIn duration={0.3} delay={0.2}>
          <Vector x={e1x} y={e1y} color="var(--violet-400)"
                  label={e1Label} labelDX={14} labelDY={26}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={0.3}>
          <Vector x={e2x} y={e2y} color="var(--teal-400)"
                  label={e2Label} labelDX={-30} labelDY={-2}/>
        </SvgFadeIn>
        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <MatrixPanel eyebrow={eyebrow} rows={rows} footnote={footnote} delay={2.2}/>
    </>
  );
}

// ─── Beat 6: General A — matrix columns are images of the basis ──────────
function GeneralBeat() {
  const { localTime } = useSprite();
  const target = [[1.1, 0.45], [-0.25, 1.05]];

  const settle = 0.8, morphDur = 3.4;
  let t;
  if (localTime < settle) t = 0;
  else if (localTime < settle + morphDur) {
    t = Easing.easeInOutCubic((localTime - settle) / morphDur);
  } else {
    t = 1;
  }
  const M = lerpM(target, t);

  const [e1x, e1y] = applyM(M, 1, 0);
  const [e2x, e2y] = applyM(M, 0, 1);

  const glowT = clamp((localTime - (settle + morphDur + 0.4)) / 0.8, 0, 1);
  const glow = Easing.easeOutCubic(glowT);

  return (
    <>
      <GridMaskedSvg maskId="ltg-general-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={IDENTITY} color="var(--chalk-300)"
                           strokeWidth={1.1} opacity={0.28}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <TransformedGrid M={M} color="var(--amber-400)"
                           strokeWidth={1.6} opacity={0.85}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <UnitSquare M={M}/>
        </SvgFadeIn>
        <Axes/>
        <SvgFadeIn duration={0.3} delay={0.2}>
          <Vector x={e1x} y={e1y} color="var(--violet-400)"
                  label="T(e₁) = (1.1, −0.25)"
                  labelDX={62} labelDY={28} glow={glow}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={0.3}>
          <Vector x={e2x} y={e2y} color="var(--teal-400)"
                  label="T(e₂) = (0.45, 1.05)"
                  labelDX={-2} labelDY={-18} glow={glow}/>
        </SvgFadeIn>
        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <MatrixPanel
        eyebrow="any 2×2 matrix A"
        rows={[
          ['1.1',   '0.45'],
          ['−0.25', '1.05'],
        ]}
        footnote="column 1 = T(e₁) · column 2 = T(e₂)"
        delay={2.2}
      />
    </>
  );
}

// ─── Beat 7: Hero outro — closing line on dark canvas ─────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 920, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 62, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.15,
        }}>
        A matrix is <span style={{ color: 'var(--amber-300)' }}>a verb</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 28, color: 'var(--chalk-200)',
          maxWidth: '34ch', lineHeight: 1.3,
        }}>
          It doesn't describe space — <br/>it moves space.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          marginTop: 14,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        A = [ <span style={{ color: 'var(--violet-400)' }}>T(e₁)</span> &nbsp;|&nbsp; <span style={{ color: 'var(--teal-400)' }}>T(e₂)</span> ]
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
