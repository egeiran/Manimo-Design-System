// Dimension: How Many Free Directions? — Manimo lesson scene.
// Chapter 1 / week 2 of mat2b. Builds intuition for dimension as a count of
// linearly independent directions. Each beat adds one vector that escapes the
// previous span:
//    line → plane → volume.
//
// Beats:
//    0– …   Manimo enters with the hook question
//    …– …   Dim 1 — one arrow, a line through the origin
//    …– …   Dim 2 — add a second arrow off the line, sweep a plane
//    …– …   Dim 3 — pop a third arrow out of the plane, sweep a volume
//    …– end Hero outro — "Dimension counts your freedom."
//
// Authoring notes:
//   • Reuses the colour discipline of `linear-transformation-grid`:
//       violet-400 — v₁ (first basis direction)
//       teal-400   — v₂ (second basis direction)
//       rose-400   — v₃ (the one that breaks out of the plane)
//       amber-400  — the span being swept (line / plane patch / parallelepiped)
//       amber-300  — emphasis text in the hero outro
//   • Switches to an oblique 3D projection only in the third beat. y stays
//     up, x stays right, z (depth) is rendered as up-and-right at ~30°. The
//     same toSvg helper is used for both 2D and 3D points; the 3D one wraps
//     it with a fixed projection matrix.
//   • SoftPanel / SceneChrome / SvgFadeIn discipline matches the calibration
//     scene. FadeUp for HTML, SvgFadeIn for anything inside an <svg>.

const SCENE_DURATION = 29;

// Narration script — kept here for review and so external tooling can pick it
// up via window.sceneNarration. Spoken English, never symbolic.
const NARRATION = [
  "How many free directions does a space really have? Count them.",
  "One arrow through the origin. Every scaling of it lives on the same line — one direction, dimension one.",
  "Now add a second arrow that doesn't lie on the first. Together they sweep out a whole plane — dimension two.",
  "Pop a third arrow up out of the plane and the span becomes all of three dimensional space.",
  "Dimension is just the number of arrows you need before you stop reaching new ground.",
];

const NARRATION_AUDIO = 'audio/dimension-intuition/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 500;
const ORIGIN_Y = 400;
const UNIT = 70;

// 2D math → SVG.
function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// Oblique 3D math → SVG. z (depth) projects up-and-right at ~30°, scaled 0.55.
const Z_COS = Math.cos(30 * Math.PI / 180);
const Z_SIN = Math.sin(30 * Math.PI / 180);
const Z_SCALE = 0.55;
function toSvg3(x, y, z) {
  return {
    sx: ORIGIN_X + (x + z * Z_COS * Z_SCALE) * UNIT,
    sy: ORIGIN_Y - (y + z * Z_SIN * Z_SCALE) * UNIT,
  };
}

// ─── Helpers shared with linear-transformation-grid look ──────────────────

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

function Axes2D() {
  const left = toSvg(-6, 0);
  const right = toSvg(6, 0);
  const bottom = toSvg(0, -3.5);
  const top = toSvg(0, 3.5);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6}
            strokeLinecap="round" opacity={0.5}/>
      <line x1={top.sx} y1={top.sy} x2={bottom.sx} y2={bottom.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6}
            strokeLinecap="round" opacity={0.5}/>
    </g>
  );
}

function Axes3D({ progress = 1 }) {
  // Three axes from origin out into the oblique frame. progress scales the
  // length so they ease into view rather than popping.
  const len = 3.2 * progress;
  const ax = toSvg3(len, 0, 0);
  const ay = toSvg3(0, len, 0);
  const az = toSvg3(0, 0, len);
  const o = toSvg3(0, 0, 0);
  return (
    <g opacity={0.55}>
      <line x1={o.sx} y1={o.sy} x2={ax.sx} y2={ax.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={o.sx} y1={o.sy} x2={ay.sx} y2={ay.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={o.sx} y1={o.sy} x2={az.sx} y2={az.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"
            strokeDasharray="4 5"/>
    </g>
  );
}

function Vector2D({
  x, y, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.8, headLen = 14, headHalf = 7.5,
}) {
  const o = toSvg(0, 0);
  const tip = toSvg(x, y);
  return arrowFromTo(o, tip, color, label, labelDX, labelDY, strokeWidth, headLen, headHalf);
}

function Vector3D({
  x, y, z, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.8, headLen = 14, headHalf = 7.5,
}) {
  const o = toSvg3(0, 0, 0);
  const tip = toSvg3(x, y, z);
  return arrowFromTo(o, tip, color, label, labelDX, labelDY, strokeWidth, headLen, headHalf);
}

function arrowFromTo(o, tip, color, label, labelDX, labelDY, strokeWidth, headLen, headHalf) {
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

function SoftPanel({ children, right = 64, top = 220, width = 360, left, bottom, transform }) {
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
      eyebrow="vector spaces"
      title="How Many Free Directions?"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.03}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.03} end={10.79}>
        <DimOneBeat/>
      </Sprite>

      <Sprite start={10.79} end={17.68}>
        <DimTwoBeat/>
      </Sprite>

      <Sprite start={17.68} end={23.44}>
        <DimThreeBeat/>
      </Sprite>

      <Sprite start={23.44} end={SCENE_DURATION}>
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
        Count the free directions.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Dim 1 — one arrow, a line ────────────────────────────────────
function DimOneBeat() {
  const { localTime } = useSprite();
  // Direction of v₁: roughly 30° above x-axis. Animate three sliding marks
  // along the line at scalar multiples to drive home "every scaling lives on
  // the same line".
  const vx = 2.4, vy = 1.3;
  const lineLen = 4.5;

  // Mark scalars: -1, 1.6, 0.6 — sliding around so the line feels alive.
  // Each mark eases between two scalar values over the beat.
  const markScalar = (a, b, start) => {
    if (localTime < start) return a;
    const t = clamp((localTime - start) / 2.5, 0, 1);
    return a + (b - a) * Easing.easeInOutCubic(t);
  };
  const marks = [
    markScalar(-1.2, 0.9, 3.0),
    markScalar(1.8, -0.4, 3.4),
    markScalar(0.4, 1.4, 4.0),
  ];

  return (
    <>
      <GridMaskedSvg maskId="dimint-one-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <Axes2D/>
        </SvgFadeIn>

        {/* The span — a long line through the origin in the v₁ direction. */}
        <SvgFadeIn duration={0.6} delay={1.6}>
          {(() => {
            const a = toSvg(-lineLen * vx / Math.hypot(vx, vy),
                            -lineLen * vy / Math.hypot(vx, vy));
            const b = toSvg(lineLen * vx / Math.hypot(vx, vy),
                            lineLen * vy / Math.hypot(vx, vy));
            return (
              <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                    stroke="var(--amber-400)" strokeWidth={2.4}
                    strokeLinecap="round" opacity={0.85}/>
            );
          })()}
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={0.4}>
          <Vector2D x={vx} y={vy} color="var(--violet-400)"
                    label="v₁" labelDX={20} labelDY={-12}/>
        </SvgFadeIn>

        {/* Three sliding tick-marks at scalar multiples. */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <g>
            {marks.map((s, i) => {
              const p = toSvg(s * vx, s * vy);
              return (
                <circle key={i} cx={p.sx} cy={p.sy} r={5}
                        fill="var(--amber-300)" opacity={0.85}/>
              );
            })}
          </g>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          dimension 1
        </FadeUp>
        <FadeUp duration={0.6} delay={2.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 30, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>v₁</span> alone — a line through the origin.
        </FadeUp>
        <FadeUp duration={0.5} delay={4.5} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          Every scaling stays on that same line. One free direction.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Dim 2 — plane patch from two non-collinear arrows ────────────
function DimTwoBeat() {
  const { localTime } = useSprite();
  const v1 = [2.4, 1.3];
  const v2 = [-1.4, 2.0];

  // Sweep the plane patch out by growing both extents from 0 to 1.
  const sweep = Easing.easeInOutCubic(clamp((localTime - 1.2) / 2.2, 0, 1));
  const reach = 2.2 * sweep;

  // Build a quadrilateral spanning -reach to +reach in each direction.
  const corners = [
    [-reach, -reach], [reach, -reach], [reach, reach], [-reach, reach],
  ].map(([s, t]) => {
    const p = toSvg(s * v1[0] + t * v2[0], s * v1[1] + t * v2[1]);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');

  return (
    <>
      <GridMaskedSvg maskId="dimint-two-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <Axes2D/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.2}>
          <polygon points={corners}
                   fill="var(--amber-400)" fillOpacity={0.16}
                   stroke="var(--amber-400)" strokeWidth={1.6}
                   strokeOpacity={0.6}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.0}>
          <Vector2D x={v1[0]} y={v1[1]} color="var(--violet-400)"
                    label="v₁" labelDX={20} labelDY={-12}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.3}>
          <Vector2D x={v2[0]} y={v2[1]} color="var(--teal-400)"
                    label="v₂" labelDX={-22} labelDY={-8}/>
        </SvgFadeIn>

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={2.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          dimension 2
        </FadeUp>
        <FadeUp duration={0.6} delay={2.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 30, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>v₁</span>
            <span style={{ color: 'var(--chalk-200)' }}>,&nbsp;</span>
            <span style={{ color: 'var(--teal-400)' }}>v₂</span> — a whole plane.
        </FadeUp>
        <FadeUp duration={0.5} delay={4.5} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          Two free directions — they can't reach off the plane.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Dim 3 — break out of the plane into a volume ─────────────────
function DimThreeBeat() {
  const { localTime } = useSprite();

  // First fade the 3D axes in over ~0.8 s. Then v₃ rises out of the plane
  // (z from 0 to 1.6) over ~2.0 s starting at t=0.8. Then sweep the
  // parallelepiped corners outward.
  const axesProgress = Easing.easeOutCubic(clamp(localTime / 0.8, 0, 1));
  const zRise = 1.6 * Easing.easeInOutCubic(clamp((localTime - 0.8) / 2.0, 0, 1));
  const sweep = Easing.easeInOutCubic(clamp((localTime - 1.6) / 2.6, 0, 1));
  const reach = 1.8 * sweep;

  // Plane basis (in 3D, z=0)
  const v1 = [2.0, 0.0, 0.0];
  const v2 = [0.0, 1.6, 0.0];
  // v3 rises in z over time
  const v3 = [0.0, 0.0, zRise];

  // Floor patch — a parallelogram at z=0 in (v1, v2).
  const floorCorners = [
    [-reach, -reach], [reach, -reach], [reach, reach], [-reach, reach],
  ].map(([s, t]) => {
    const x = s * v1[0] + t * v2[0];
    const y = s * v1[1] + t * v2[1];
    const p = toSvg3(x, y, 0);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');

  // Top patch — same parallelogram lifted by v3.
  const topCorners = [
    [-reach, -reach], [reach, -reach], [reach, reach], [-reach, reach],
  ].map(([s, t]) => {
    const x = s * v1[0] + t * v2[0];
    const y = s * v1[1] + t * v2[1];
    const p = toSvg3(x, y, v3[2]);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');

  // Four vertical edges connecting them, drawn only when zRise > 0.
  const verticals = [
    [-reach, -reach], [reach, -reach], [reach, reach], [-reach, reach],
  ].map(([s, t]) => {
    const x = s * v1[0] + t * v2[0];
    const y = s * v1[1] + t * v2[1];
    const a = toSvg3(x, y, 0);
    const b = toSvg3(x, y, v3[2]);
    return { a, b };
  });

  return (
    <>
      <GridMaskedSvg maskId="dimint-three-mask">
        <Axes3D progress={axesProgress}/>

        {/* Floor patch — the plane we already had. */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <polygon points={floorCorners}
                   fill="var(--amber-400)" fillOpacity={0.10}
                   stroke="var(--amber-400)" strokeWidth={1.4}
                   strokeOpacity={0.45}/>
        </SvgFadeIn>

        {/* Vertical edges and top patch — only meaningful once v₃ lifts. */}
        {zRise > 0.05 && (
          <g opacity={0.85}>
            {verticals.map((e, i) => (
              <line key={i} x1={e.a.sx} y1={e.a.sy} x2={e.b.sx} y2={e.b.sy}
                    stroke="var(--amber-400)" strokeWidth={1.4}
                    strokeOpacity={0.45} strokeLinecap="round"/>
            ))}
            <polygon points={topCorners}
                     fill="var(--amber-400)" fillOpacity={0.07}
                     stroke="var(--amber-400)" strokeWidth={1.4}
                     strokeOpacity={0.45}/>
          </g>
        )}

        {/* In-plane vectors v₁, v₂ — kept thinner so they read as "floor". */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <Vector3D x={v1[0]} y={v1[1]} z={0}
                    color="var(--violet-400)"
                    label="v₁" labelDX={18} labelDY={20}
                    strokeWidth={3.0}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.1}>
          <Vector3D x={v2[0]} y={v2[1]} z={0}
                    color="var(--teal-400)"
                    label="v₂" labelDX={-20} labelDY={-6}
                    strokeWidth={3.0}/>
        </SvgFadeIn>

        {/* v₃ — the breakout. Rendered dynamically every frame. */}
        {zRise > 0.05 && (
          <Vector3D x={0} y={0} z={v3[2]}
                    color="var(--rose-400)"
                    label="v₃" labelDX={18} labelDY={-6}
                    strokeWidth={3.8}/>
        )}

        <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.45} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          dimension 3
        </FadeUp>
        <FadeUp duration={0.6} delay={2.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 30, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>v₁</span>
            <span style={{ color: 'var(--chalk-200)' }}>,&nbsp;</span>
            <span style={{ color: 'var(--teal-400)' }}>v₂</span>
            <span style={{ color: 'var(--chalk-200)' }}>,&nbsp;</span>
            <span style={{ color: 'var(--rose-400)' }}>v₃</span> — all of space.
        </FadeUp>
        <FadeUp duration={0.5} delay={4.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          The third arrow had to escape the plane to count.
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

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 60, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.15,
        }}>
        Dimension counts your <span style={{ color: 'var(--amber-300)' }}>freedom</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '38ch', lineHeight: 1.3,
        }}>
          The number of independent arrows you need <br/>before you stop reaching new ground.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        <span style={{ color: 'var(--violet-400)' }}>line</span>
        &nbsp;·&nbsp;
        <span style={{ color: 'var(--teal-400)' }}>plane</span>
        &nbsp;·&nbsp;
        <span style={{ color: 'var(--rose-400)' }}>volume</span>
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
