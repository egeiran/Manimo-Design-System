// Directional Derivative: A Tilted Slice — Manimo lesson scene.
// Chapter 5 / week 12 of mat2b. The directional derivative is the slope
// of the curve you get when you cut the surface with a vertical plane
// through the chosen direction. Algebraically it's the dot product of
// the gradient with the unit direction.
//
// Beats (placeholder timings — re-wired by `npm run audio`):
//    0– 4.5   Manimo enters
//    4.5–14   Setup — contour map + two partial-derivative arrows
//   14–23     Pick a unit direction u; trace the slice along u
//   23–32     Reveal the formula D_u f = grad f dot u
//   32–end    Hero outro
//
// Colour discipline:
//   chalk-300  reference contour lines + faint background marks
//   chalk-200  axes, angle arc
//   violet-400 f_x partial-derivative arrow
//   teal-400   f_y partial-derivative arrow
//   amber-400  current direction u (the object being acted on)
//   rose-400   gradient vector (a derived quantity, perpendicular to contours)
//   amber-300  takeaway / closing-line accent

const SCENE_DURATION = 48;

const NARRATION = [
  "How fast does a hill climb if you walk it not east, not north, but at an angle? That's the directional derivative.",
  "Here is a surface, z equals f of x comma y. At any point we already know two slopes — the partial derivatives — one along the x axis, one along the y axis.",
  "Now pick any unit direction u. Walk a tiny step from the point in direction u. The slope of the surface along that step is the directional derivative.",
  "The shortcut: take the gradient of f at the point, then dot it with u. The directional derivative of f in direction u equals the gradient of f dotted with u.",
  "So every direction has its own slope, and the gradient is the one direction where that slope is largest.",
];

const NARRATION_AUDIO = 'audio/directional-derivative/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
// Math origin sits left of centre to leave the right side for the panel.
const ORIGIN_X = 460;
const ORIGIN_Y = 380;
const UNIT = 70;
const X_MIN = -3.4, X_MAX = 3.4;
const Y_MIN = -2.6, Y_MAX = 2.6;

// Sample surface: f(x, y) = 0.35 (x^2 + 0.7 y^2) - 0.4 x y + 0.1 x — a tilted
// bowl, so contours are tilted ellipses and the gradient is not axis-aligned.
function f(x, y) {
  return 0.35 * (x * x + 0.7 * y * y) - 0.4 * x * y + 0.1 * x;
}
function fx(x, y) {
  return 0.70 * x - 0.4 * y + 0.1;
}
function fy(x, y) {
  return 0.49 * y - 0.4 * x;
}

// Sample point at (1.4, 0.6) — clearly off-axis, gradient points up-right.
const PX = 1.4;
const PY = 0.6;

// Unit direction u — pick something not aligned with either axis or gradient
// so the geometry reads (angle of about 18 degrees above horizontal).
const U_ANG = 18 * Math.PI / 180;
const UX = Math.cos(U_ANG);
const UY = Math.sin(U_ANG);

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="42%" cy="56%" r="62%">
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
    </g>
  );
}

// Build contour lines for the surface by marching squares on a regular grid.
// Returns a list of svg path d-strings, one per contour level.
function contourPaths(levels) {
  const NX = 80, NY = 64;
  const dx = (X_MAX - X_MIN) / NX;
  const dy = (Y_MAX - Y_MIN) / NY;
  // Pre-compute f on a grid.
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
        const a = grid[i][j], b = grid[i + 1][j],
              cc = grid[i + 1][j + 1], d = grid[i][j + 1];
        // For each of the 4 edges, find crossings with level c.
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

const CONTOUR_LEVELS = [0.1, 0.3, 0.6, 1.0, 1.5, 2.1, 2.8];

function Contours({ opacity = 0.55, color = 'var(--chalk-300)' }) {
  const paths = contourPaths(CONTOUR_LEVELS);
  return (
    <g>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color}
              strokeWidth={1.4} strokeLinecap="round" opacity={opacity}/>
      ))}
    </g>
  );
}

// Reusable arrow primitive (vector from a base point with a tip and label).
function Arrow({
  bx, by, tx, ty, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.6, headLen = 13, headHalf = 7, glow = 0,
}) {
  const o = toSvg(bx, by);
  const tip = toSvg(tx, ty);
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
      eyebrow="directional derivatives"
      title="A Tilted Slice"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={7.43}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={7.43} end={19.54}>
        <SurfaceBeat/>
      </Sprite>

      <Sprite start={19.54} end={29.54}>
        <DirectionBeat/>
      </Sprite>

      <Sprite start={29.54} end={40.71}>
        <FormulaBeat/>
      </Sprite>

      <Sprite start={40.71} end={SCENE_DURATION}>
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
        A tilted slope.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Surface + partials ───────────────────────────────────────────
function SurfaceBeat() {
  // Arrow lengths scaled so partials are clearly distinct from a unit vector.
  const fxAtP = fx(PX, PY);
  const fyAtP = fy(PX, PY);
  const xArrowEndX = PX + 0.9;          // along +x
  const xArrowEndY = PY;
  const yArrowEndX = PX;
  const yArrowEndY = PY + 0.9;          // along +y
  return (
    <>
      <GridMaskedSvg maskId="dd-surface-mask">
        <SvgFadeIn duration={0.6} delay={0.0}><Contours/></SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.2}><Axes/></SvgFadeIn>

        {/* The marked point P. */}
        <SvgFadeIn duration={0.4} delay={3.5}>
          <g>
            <circle cx={toSvg(PX, PY).sx} cy={toSvg(PX, PY).sy} r={5.5}
                    fill="var(--chalk-100)"/>
            <text x={toSvg(PX, PY).sx + 12} y={toSvg(PX, PY).sy - 14}
                  fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={20}>P</text>
          </g>
        </SvgFadeIn>

        {/* f_x partial in +x direction. */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <Arrow bx={PX} by={PY} tx={xArrowEndX} ty={xArrowEndY}
                 color="var(--violet-400)"
                 label="∂f/∂x" labelDX={20} labelDY={26}/>
        </SvgFadeIn>

        {/* f_y partial in +y direction. */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <Arrow bx={PX} by={PY} tx={yArrowEndX} ty={yArrowEndY}
                 color="var(--teal-400)"
                 label="∂f/∂y" labelDX={-26} labelDY={2}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220} width={380}>
        <FadeUp duration={0.45} delay={1.5} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>partial derivatives</FadeUp>
        <FadeUp duration={0.6} delay={2.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Two slopes we already know.
        </FadeUp>
        <FadeUp duration={0.5} delay={4.2} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          <span style={{ color: 'var(--violet-400)' }}>f<sub>x</sub></span> walks east.&nbsp;
          <span style={{ color: 'var(--teal-400)' }}>f<sub>y</sub></span> walks north.
        </FadeUp>
        <FadeUp duration={0.5} delay={6.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          What about every other direction?
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Pick a direction u, draw the slice ───────────────────────────
function DirectionBeat() {
  const { localTime } = useSprite();
  // Slice line through P along u, drawn from t = -2 to t = +2 (math units).
  const sliceLen = 2.0;
  const aX = PX - UX * sliceLen, aY = PY - UY * sliceLen;
  const bX = PX + UX * sliceLen, bY = PY + UY * sliceLen;
  const a = toSvg(aX, aY), b = toSvg(bX, bY);

  // Trace the slice line in over ~1.6 s starting at delay 2.0.
  const traceT = clamp((localTime - 2.0) / 1.6, 0, 1);

  return (
    <>
      <GridMaskedSvg maskId="dd-direction-mask">
        <Contours opacity={0.4}/>
        <Axes opacity={0.7}/>

        {/* Faded partials from the previous beat. */}
        <Arrow bx={PX} by={PY} tx={PX + 0.9} ty={PY}
               color="var(--violet-400)" strokeWidth={2.4}/>
        <Arrow bx={PX} by={PY} tx={PX} ty={PY + 0.9}
               color="var(--teal-400)" strokeWidth={2.4}/>

        {/* Point P. */}
        <circle cx={toSvg(PX, PY).sx} cy={toSvg(PX, PY).sy} r={5.5}
                fill="var(--chalk-100)"/>

        {/* Slice trace — dashed amber line along u, animated. */}
        {traceT > 0 && (() => {
          // Interpolate from P outward in both directions.
          const aT = {
            sx: toSvg(PX, PY).sx + (a.sx - toSvg(PX, PY).sx) * traceT,
            sy: toSvg(PX, PY).sy + (a.sy - toSvg(PX, PY).sy) * traceT,
          };
          const bT = {
            sx: toSvg(PX, PY).sx + (b.sx - toSvg(PX, PY).sx) * traceT,
            sy: toSvg(PX, PY).sy + (b.sy - toSvg(PX, PY).sy) * traceT,
          };
          return (
            <line x1={aT.sx} y1={aT.sy} x2={bT.sx} y2={bT.sy}
                  stroke="var(--amber-400)" strokeWidth={2.4}
                  strokeDasharray="6 5" strokeLinecap="round" opacity={0.85}/>
          );
        })()}

        {/* Unit direction u. */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <Arrow bx={PX} by={PY} tx={PX + UX * 1.2} ty={PY + UY * 1.2}
                 color="var(--amber-400)"
                 label="u" labelDX={22} labelDY={12}
                 strokeWidth={4.0}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={220} width={380}>
        <FadeUp duration={0.45} delay={0.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>a slice along u</FadeUp>
        <FadeUp duration={0.55} delay={1.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 26, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          Cut the surface along <span style={{ color: 'var(--amber-400)' }}>u</span>.
        </FadeUp>
        <FadeUp duration={0.5} delay={2.8} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          The slope of that cut curve at <span style={{ color: 'var(--chalk-100)' }}>P</span> is
          &nbsp;<span style={{ color: 'var(--amber-400)' }}>D<sub>u</sub> f</span>.
        </FadeUp>
        <FadeUp duration={0.5} delay={5.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.06em',
            marginTop: 6,
          }}>
          ‖u‖ = 1
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Reveal the formula ───────────────────────────────────────────
function FormulaBeat() {
  const { localTime } = useSprite();
  const fxAtP = fx(PX, PY);
  const fyAtP = fy(PX, PY);
  // Scale gradient so it draws clearly but not too long.
  const gLen = Math.hypot(fxAtP, fyAtP);
  const gScale = 1.1 / Math.max(gLen, 0.001);
  const gX = PX + fxAtP * gScale;
  const gY = PY + fyAtP * gScale;

  // Tiny angle arc between grad f and u.
  const arcR = 38;
  const angU = U_ANG;
  const angG = Math.atan2(fyAtP, fxAtP);
  const startAng = Math.min(angU, angG);
  const endAng = Math.max(angU, angG);
  const arcCenter = toSvg(PX, PY);
  const arcStart = {
    x: arcCenter.sx + arcR * Math.cos(startAng),
    y: arcCenter.sy - arcR * Math.sin(startAng),
  };
  const arcEnd = {
    x: arcCenter.sx + arcR * Math.cos(endAng),
    y: arcCenter.sy - arcR * Math.sin(endAng),
  };
  const arcSweep = (endAng - startAng) > Math.PI ? 1 : 0;

  return (
    <>
      <GridMaskedSvg maskId="dd-formula-mask">
        <Contours opacity={0.35}/>
        <Axes opacity={0.6}/>

        {/* Slice line stays. */}
        {(() => {
          const sliceLen = 2.0;
          const a = toSvg(PX - UX * sliceLen, PY - UY * sliceLen);
          const b = toSvg(PX + UX * sliceLen, PY + UY * sliceLen);
          return (
            <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                  stroke="var(--amber-400)" strokeWidth={2.0}
                  strokeDasharray="6 5" strokeLinecap="round" opacity={0.5}/>
          );
        })()}

        {/* Point P. */}
        <circle cx={toSvg(PX, PY).sx} cy={toSvg(PX, PY).sy} r={5.5}
                fill="var(--chalk-100)"/>

        {/* Unit direction u, faded. */}
        <Arrow bx={PX} by={PY} tx={PX + UX * 1.2} ty={PY + UY * 1.2}
               color="var(--amber-400)"
               label="u" labelDX={22} labelDY={12}
               strokeWidth={3.4}/>

        {/* Gradient arrow. */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <Arrow bx={PX} by={PY} tx={gX} ty={gY}
                 color="var(--rose-400)"
                 label="∇f" labelDX={6} labelDY={-12}
                 strokeWidth={4.0}/>
        </SvgFadeIn>

        {/* Angle arc. */}
        <SvgFadeIn duration={0.4} delay={1.5}>
          <path d={`M ${arcStart.x} ${arcStart.y} A ${arcR} ${arcR} 0 ${arcSweep} 0 ${arcEnd.x} ${arcEnd.y}`}
                fill="none" stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <text
            x={arcCenter.sx + (arcR + 18) * Math.cos((startAng + endAng) / 2)}
            y={arcCenter.sy - (arcR + 18) * Math.sin((startAng + endAng) / 2)}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={18} textAnchor="middle">
            θ
          </text>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={196} width={400}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>the shortcut</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 36, color: 'var(--chalk-100)', lineHeight: 1.2,
            marginTop: 4,
          }}>
          <span style={{ color: 'var(--amber-400)' }}>D<sub>u</sub> f</span>
          &nbsp;=&nbsp;
          <span style={{ color: 'var(--rose-400)' }}>∇f</span>
          &nbsp;·&nbsp;
          <span style={{ color: 'var(--amber-400)' }}>u</span>
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          Project the gradient onto the direction.
        </FadeUp>

        <FadeUp duration={0.5} delay={4.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.08em',
            marginTop: 6,
          }}>
          = ‖∇f‖ cos θ
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
      maxWidth: 980, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>the takeaway</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 54, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        One gradient, <span style={{ color: 'var(--amber-300)' }}>every direction</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.3,
        }}>
          D<sub>u</sub> f = ∇f · u — <br/>the slope along u.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        steepest ascent → u = ∇f / ‖∇f‖
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
