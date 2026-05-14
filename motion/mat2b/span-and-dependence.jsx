// Span and Linear Dependence — Manimo lesson scene.
// Chapter 1 (Vektorrom) — visualises why two arrows make a parallelogram,
// why a third coplanar arrow is wasted, and why an off-plane arrow lifts
// the span to all of R³.
//
// Beats:
//    0– ~4   Manimo intro hook
//   ~4–~15   Two arrows → parallelogram (the span)
//  ~15–~26   Third dependent arrow lies inside; span doesn't grow
//  ~26–~37   Off-plane arrow lifts; span becomes a 3D parallelepiped
//  ~37–end   Hero outro: span is your reach
//
// Conventions inherited from linear-transformation-grid:
//   chalk-300 / chalk-200  reference grid + axes (faded by radial mask)
//   amber-400              the active span (parallelogram / parallelepiped)
//   violet-400 / teal-400  the two independent direction vectors
//   rose-400               the "wasted" dependent vector
//   amber-300              the escaping out-of-plane vector + hero accent
//
// The 3D beat uses a cabinet projection (z foreshortened, 30° elevation).

const SCENE_DURATION = 39;

const NARRATION = [
  "How much space do a few arrows give you?",
  "Two arrows, v one and v two. Every combination of them — every a v one plus b v two — fills this whole parallelogram. We call that the span.",
  "Now drop in a third arrow that lies flat inside the parallelogram. It's just a combination of the first two — linearly dependent. The span doesn't grow at all.",
  "But swap in an arrow that lifts off the plane. Suddenly the span isn't a patch anymore — it fills the whole three dimensional space. That's linear independence.",
  "Span is your reach. Dependent vectors don't add to it. Independent ones do.",
];

const NARRATION_AUDIO = 'audio/span-and-dependence/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 540;
const ORIGIN_Y = 380;
const UNIT = 70;
const GRID_X_MIN = -6, GRID_X_MAX = 9;
const GRID_Y_MIN = -4, GRID_Y_MAX = 5;
const IDENTITY = [[1, 0], [0, 1]];

// 2D → screen
function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// Cabinet projection for the 3D beat. z foreshortened to 0.5, drawn at 30°
// elevation up-right so the floor parallelogram reads as receding depth.
const Z_FACTOR_X = 0.5 * Math.cos(Math.PI / 6); // ≈ 0.433
const Z_FACTOR_Y = 0.5 * Math.sin(Math.PI / 6); // ≈ 0.250
function to3D(x, y, z) {
  return {
    sx: ORIGIN_X + (x + Z_FACTOR_X * z) * UNIT,
    sy: ORIGIN_Y - (y + Z_FACTOR_Y * z) * UNIT,
  };
}

// ─── Grid mask helper ────────────────────────────────────────────────────
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
function ReferenceGrid({ opacity = 0.4 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const a = toSvg(k, GRID_Y_MIN);
    const b = toSvg(k, GRID_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                      stroke="var(--chalk-300)" strokeWidth={1.2}
                      opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const a = toSvg(GRID_X_MIN, k);
    const b = toSvg(GRID_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                      stroke="var(--chalk-300)" strokeWidth={1.2}
                      opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes2D() {
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

// Vector from origin to (x, y) in 2D math coords, with optional label and
// glow. progress in [0,1] grows the arrow from 0 → full length.
function Vector2D({ x, y, color, label = null, labelDX = 0, labelDY = 0,
                    strokeWidth = 3.8, headLen = 14, headHalf = 7.5,
                    glow = 0, progress = 1 }) {
  const o = toSvg(0, 0);
  const tipMath = { x: x * progress, y: y * progress };
  const tip = toSvg(tipMath.x, tipMath.y);
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
      {label != null && progress > 0.9 && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

// 3D vector — from origin in cabinet projection to (x, y, z). Otherwise
// same draw shape as Vector2D.
function Vector3D({ x, y, z, color, label = null, labelDX = 0, labelDY = 0,
                    strokeWidth = 3.6, headLen = 13, headHalf = 7,
                    progress = 1 }) {
  const o = to3D(0, 0, 0);
  const tip = to3D(x * progress, y * progress, z * progress);
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
      {label != null && progress > 0.85 && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

// Translucent parallelogram spanning the four corners (0, v1, v1+v2, v2).
// Optional dashed "completion" edges show that the parallelogram is the
// closure under combinations, not just an arbitrary fill.
function Parallelogram2D({ v1, v2, fill = 'var(--amber-400)', fillOpacity = 0.18,
                            stroke = null, dashed = false, progress = 1 }) {
  const c0 = toSvg(0, 0);
  const cx = (a, b) => toSvg(a * progress, b * progress);
  const c1 = cx(v1[0], v1[1]);
  const c2 = cx(v1[0] + v2[0], v1[1] + v2[1]);
  const c3 = cx(v2[0], v2[1]);
  const pts = `${c0.sx},${c0.sy} ${c1.sx},${c1.sy} ${c2.sx},${c2.sy} ${c3.sx},${c3.sy}`;
  return (
    <g>
      <polygon points={pts} fill={fill} fillOpacity={fillOpacity * progress} stroke="none"/>
      {dashed && progress > 0.5 && (
        <g stroke="var(--chalk-300)" strokeWidth={1.2}
           strokeDasharray="6 4" opacity={0.5} fill="none">
          <line x1={c1.sx} y1={c1.sy} x2={c2.sx} y2={c2.sy}/>
          <line x1={c2.sx} y1={c2.sy} x2={c3.sx} y2={c3.sy}/>
        </g>
      )}
      {stroke && (
        <polygon points={pts} fill="none" stroke={stroke} strokeWidth={1.5} opacity={progress}/>
      )}
    </g>
  );
}

// Parallelepiped wireframe for the 3D escape beat. The "floor" lives in
// the xz-plane (y=0); the "ceiling" rises by v3 (which lies along +y).
function Parallelepiped({ v1, v2, v3, color = 'var(--amber-400)', progress = 1 }) {
  // Eight corners — base (y=0) plus top (shifted by v3 * progress).
  const t = progress;
  const base = [
    [0, 0, 0],
    [v1[0], v1[1], v1[2]],
    [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]],
    [v2[0], v2[1], v2[2]],
  ];
  const top = base.map(([x, y, z]) => [x + v3[0] * t, y + v3[1] * t, z + v3[2] * t]);
  const p = pt => to3D(pt[0], pt[1], pt[2]);
  const polyStr = pts => pts.map(pt => { const s = p(pt); return `${s.sx.toFixed(1)},${s.sy.toFixed(1)}`; }).join(' ');

  return (
    <g>
      {/* Filled volume — six face polygons, lightly amber */}
      {[
        [base[0], base[1], top[1], top[0]],          // front face
        [base[1], base[2], top[2], top[1]],          // right face
        [base[3], base[2], top[2], top[3]],          // back face
        [base[0], base[3], top[3], top[0]],          // left face
        [top[0], top[1], top[2], top[3]],            // ceiling
      ].map((face, i) => (
        <polygon key={i} points={polyStr(face)}
                 fill={color} fillOpacity={0.07 * progress} stroke="none"/>
      ))}

      {/* Base parallelogram outline */}
      <polygon points={polyStr(base)} fill={color} fillOpacity={0.22}
               stroke={color} strokeWidth={1.5} opacity={0.9}/>

      {/* Vertical lift edges from base corners to top corners */}
      {base.map((b, i) => {
        const s1 = p(b), s2 = p(top[i]);
        return (
          <line key={`v${i}`} x1={s1.sx} y1={s1.sy} x2={s2.sx} y2={s2.sy}
                stroke={color} strokeWidth={1.5} opacity={0.7 * progress}
                strokeDasharray={i === 0 ? '0' : '4 4'} strokeLinecap="round"/>
        );
      })}

      {/* Ceiling parallelogram outline (dashed at low progress, solid as it rises) */}
      {progress > 0.05 && (
        <polygon points={polyStr(top)} fill="none"
                 stroke={color} strokeWidth={1.5} opacity={0.85 * progress}
                 strokeDasharray="4 4"/>
      )}
    </g>
  );
}

// 3D axes — x right, y up, z (depth) into the page at 30°.
function Axes3D() {
  const o = to3D(0, 0, 0);
  const ex = to3D(GRID_X_MAX - 1, 0, 0);
  const ey = to3D(0, 4, 0);
  const ez = to3D(0, 0, 4);
  const label = (sx, sy, t, color) => (
    <text x={sx} y={sy} fill={color}
          fontFamily="var(--font-serif)" fontStyle="italic"
          fontSize={20} textAnchor="middle">{t}</text>
  );
  return (
    <g stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.85}>
      <line x1={o.sx} y1={o.sy} x2={ex.sx} y2={ex.sy}/>
      <line x1={o.sx} y1={o.sy} x2={ey.sx} y2={ey.sy}/>
      <line x1={o.sx} y1={o.sy} x2={ez.sx} y2={ez.sy}/>
      {label(ex.sx + 18, ex.sy + 6, 'x', 'var(--chalk-300)')}
      {label(ey.sx + 4, ey.sy - 10, 'y', 'var(--chalk-300)')}
      {label(ez.sx + 16, ez.sy - 4, 'z', 'var(--chalk-300)')}
    </g>
  );
}

// ─── Soft panel + matrix layout (shared) ──────────────────────────────────
function SoftPanel({ children, right = 64, top = 220, width = 360 }) {
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
      title="Span and Linear Dependence"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={2.58}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={2.58} end={13.18}>
        <SpanTwoBeat/>
      </Sprite>

      <Sprite start={13.18} end={22.95}>
        <DependentBeat/>
      </Sprite>

      <Sprite start={22.95} end={32.57}>
        <IndependentBeat/>
      </Sprite>

      <Sprite start={32.57} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ────────────────────────────────────────────────
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
          color: 'var(--chalk-100)', maxWidth: '24ch', lineHeight: 1.3,
        }}>
        How far can a few arrows take you?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Two arrows span a parallelogram ─────────────────────────────
const V1 = [2.5, 0.5];
const V2 = [-0.4, 2.0];

function SpanTwoBeat() {
  const { localTime } = useSprite();
  // Animate the parallelogram filling: starts at 0, reaches 1 over 2s.
  const parallelogramProgress = Easing.easeInOutCubic(clamp((localTime - 3.0) / 2.0, 0, 1));
  return (
    <>
      <GridMaskedSvg maskId="span-two-mask">
        <SvgFadeIn duration={0.5} delay={0.0}>
          <ReferenceGrid opacity={0.4}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.2}><Axes2D/></SvgFadeIn>

        <Parallelogram2D v1={V1} v2={V2} dashed={true} progress={parallelogramProgress}/>

        <SvgFadeIn duration={0.5} delay={0.6}>
          <Vector2D x={V1[0]} y={V1[1]} color="var(--violet-400)"
                    label="v₁" labelDX={22} labelDY={20}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.4}>
          <Vector2D x={V2[0]} y={V2[1]} color="var(--teal-400)"
                    label="v₂" labelDX={-22} labelDY={-2}/>
        </SvgFadeIn>

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.4} delay={4.5} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          the span
        </FadeUp>
        <FadeUp duration={0.55} delay={4.9} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)',
            lineHeight: 1.25, marginTop: 4,
          }}>
            span(<span style={{ color: 'var(--violet-400)' }}>v₁</span>,&nbsp;
            <span style={{ color: 'var(--teal-400)' }}>v₂</span>) = {' '}
            <span style={{ color: 'var(--chalk-200)' }}>{'{ a v₁ + b v₂ }'}</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={6.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          Every reachable spot is some combination of the two arrows.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Dependent third vector ──────────────────────────────────────
// v3 = c1·v1 + c2·v2 is *inside* the span — the dashed guides land it on a
// corner of the parallelogram-by-combination. Constants chosen so v3 is
// clearly inside the existing parallelogram.
const C1 = 0.55;
const C2 = 0.65;
const V3_DEP = [C1 * V1[0] + C2 * V2[0], C1 * V1[1] + C2 * V2[1]];

function DependentBeat() {
  const { localTime } = useSprite();
  // Decomposition guides come in after v3 lands.
  const guideT = clamp((localTime - 2.5) / 1.4, 0, 1);
  const guideOpacity = Easing.easeOutCubic(guideT);

  // Two stepping vectors that build v3: first c1·v1, then add c2·v2.
  const stepEnd1 = toSvg(C1 * V1[0], C1 * V1[1]);
  const stepEnd2 = toSvg(V3_DEP[0], V3_DEP[1]);
  const origin = toSvg(0, 0);

  return (
    <>
      <GridMaskedSvg maskId="span-dep-mask">
        <SvgFadeIn duration={0.4} delay={0.0}>
          <ReferenceGrid opacity={0.3}/>
        </SvgFadeIn>
        <Axes2D/>

        {/* Span parallelogram persists, slightly dimmer */}
        <Parallelogram2D v1={V1} v2={V2} dashed={false} progress={1}
                          fill="var(--amber-400)" fillOpacity={0.14}/>

        {/* Original v₁ and v₂ — kept in place at lower-key emphasis */}
        <Vector2D x={V1[0]} y={V1[1]} color="var(--violet-400)"
                  label="v₁" labelDX={22} labelDY={20}/>
        <Vector2D x={V2[0]} y={V2[1]} color="var(--teal-400)"
                  label="v₂" labelDX={-22} labelDY={-2}/>

        {/* Decomposition guides: dashed step along c1·v1, then along c2·v2 */}
        <g opacity={guideOpacity}>
          <line x1={origin.sx} y1={origin.sy} x2={stepEnd1.sx} y2={stepEnd1.sy}
                stroke="var(--violet-400)" strokeWidth={2}
                strokeDasharray="6 4" opacity={0.85}/>
          <line x1={stepEnd1.sx} y1={stepEnd1.sy} x2={stepEnd2.sx} y2={stepEnd2.sy}
                stroke="var(--teal-400)" strokeWidth={2}
                strokeDasharray="6 4" opacity={0.85}/>
          <text x={(origin.sx + stepEnd1.sx) / 2 + 4}
                y={(origin.sy + stepEnd1.sy) / 2 + 20}
                fill="var(--violet-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={17} textAnchor="middle">
            {C1.toFixed(2)} v₁
          </text>
          <text x={(stepEnd1.sx + stepEnd2.sx) / 2 + 18}
                y={(stepEnd1.sy + stepEnd2.sy) / 2 + 4}
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={17} textAnchor="middle">
            {C2.toFixed(2)} v₂
          </text>
        </g>

        {/* v₃ in rose — appears slightly later than the original pair */}
        <SvgFadeIn duration={0.5} delay={0.5}>
          <Vector2D x={V3_DEP[0]} y={V3_DEP[1]} color="var(--rose-400)"
                    label="v₃" labelDX={28} labelDY={-2}/>
        </SvgFadeIn>

        <circle cx={origin.sx} cy={origin.sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.4} delay={4.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          linearly dependent
        </FadeUp>
        <FadeUp duration={0.55} delay={4.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            <span style={{ color: 'var(--rose-400)' }}>v₃</span> = {' '}
            {C1.toFixed(2)} <span style={{ color: 'var(--violet-400)' }}>v₁</span> +{' '}
            {C2.toFixed(2)} <span style={{ color: 'var(--teal-400)' }}>v₂</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={6.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          A vector already in the span adds no new reach — the parallelogram doesn't grow.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Independent third vector lifts span to 3D ───────────────────
const V1_3D = [2.4, 0, 0];
const V2_3D = [0, 0, 2.0];
const V3_3D = [0, 1.6, 0];

function IndependentBeat() {
  const { localTime } = useSprite();
  // Phase 1 (0–1.2s): Set up 3D axes + floor parallelogram.
  // Phase 2 (1.5–3.5s): v3 grows up perpendicular.
  // Phase 3 (3.5–5.5s): Parallelepiped rises (top face shoots up).
  const liftT = clamp((localTime - 1.6) / 1.6, 0, 1);
  const liftEased = Easing.easeOutCubic(liftT);
  const boxT = clamp((localTime - 3.4) / 1.8, 0, 1);
  const boxEased = Easing.easeOutCubic(boxT);

  return (
    <>
      <GridMaskedSvg maskId="span-ind-mask">
        <SvgFadeIn duration={0.5} delay={0.0}>
          <Axes3D/>
        </SvgFadeIn>

        {/* The floor parallelogram in xz-plane (y=0). Always visible. */}
        <SvgFadeIn duration={0.5} delay={0.6}>
          {(() => {
            const c0 = to3D(0, 0, 0);
            const c1 = to3D(V1_3D[0], 0, V1_3D[2]);
            const c2 = to3D(V1_3D[0] + V2_3D[0], 0, V1_3D[2] + V2_3D[2]);
            const c3 = to3D(V2_3D[0], 0, V2_3D[2]);
            const pts = `${c0.sx},${c0.sy} ${c1.sx},${c1.sy} ${c2.sx},${c2.sy} ${c3.sx},${c3.sy}`;
            return (
              <g>
                <polygon points={pts} fill="var(--amber-400)" fillOpacity={0.22}
                         stroke="var(--amber-400)" strokeWidth={1.5} opacity={0.9}/>
              </g>
            );
          })()}
        </SvgFadeIn>

        {/* The two basis vectors in the floor */}
        <SvgFadeIn duration={0.4} delay={0.9}>
          <Vector3D x={V1_3D[0]} y={V1_3D[1]} z={V1_3D[2]}
                    color="var(--violet-400)" label="v₁"
                    labelDX={18} labelDY={24}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.1}>
          <Vector3D x={V2_3D[0]} y={V2_3D[1]} z={V2_3D[2]}
                    color="var(--teal-400)" label="v₂"
                    labelDX={26} labelDY={6}/>
        </SvgFadeIn>

        {/* v₃ rises perpendicular */}
        <Vector3D x={V3_3D[0]} y={V3_3D[1]} z={V3_3D[2]}
                  color="var(--amber-300)" label="v₃"
                  labelDX={-22} labelDY={-8} progress={liftEased}/>

        {/* Parallelepiped wireframe sweeping up */}
        {boxT > 0 && (
          <Parallelepiped v1={V1_3D} v2={V2_3D} v3={V3_3D}
                          color="var(--amber-400)" progress={boxEased}/>
        )}

        <circle cx={to3D(0,0,0).sx} cy={to3D(0,0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220}>
        <FadeUp duration={0.4} delay={5.5} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          linearly independent
        </FadeUp>
        <FadeUp duration={0.55} delay={5.9} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            span(<span style={{ color: 'var(--violet-400)' }}>v₁</span>,&nbsp;
            <span style={{ color: 'var(--teal-400)' }}>v₂</span>,&nbsp;
            <span style={{ color: 'var(--amber-300)' }}>v₃</span>) = ℝ³
        </FadeUp>
        <FadeUp duration={0.5} delay={7.2} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          An arrow off the plane lifts the span — now every point of space is reachable.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: Hero outro ──────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: 900, pointerEvents: 'none',
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
      <FadeUp duration={0.8} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 58, color: 'var(--chalk-100)',
          lineHeight: 1.15,
        }}>
        Span is your <span style={{ color: 'var(--amber-300)' }}>reach</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '36ch', lineHeight: 1.3,
        }}>
          Dependent arrows go nowhere new.<br/>Independent ones do.
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
