// Critical Points: Where the Gradient Vanishes — Manimo lesson scene.
// Chapter 6 of mat2b (Ekstremalpunkter). Before classifying extrema, find
// them. For
//   f(x, y) = x³/3 − x + y² − 2y
// the gradient is ∇f = (x² − 1, 2y − 2). Setting ∇f = 0 gives x = ±1, y = 1,
// so the two critical points are (1, 1) and (−1, 1). Classification (one is
// a local min, one is a saddle) is the job of the existing scene
// hessian-test — this scene only finds them.
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 5     Manimo hook
//    5–14     Setup — contour map + gradient field of f
//   14–28     Scanner sweep along y = 1 with live |∇f| bar (GENUINE MOTION)
//   28–40     Solve ∇f = 0 — system gives the two candidates
//   40–46     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  level curves, grey body text
//   amber-400  gradient arrows, primary accent
//   amber-300  magnitude readout, payoff
//   teal-400   scanline at y = 1
//   rose-400   critical-point markers when they snap on

const SCENE_DURATION = 50;

const NARRATION = [
  /*  0– 5  */ 'Before classifying any extremum, you have to find it. Where is the gradient zero?',
  /*  5–14  */ 'Here is a function with hills and valleys: f equals x cubed over three, minus x, plus y squared, minus two y. The gradient field shows the uphill direction at every point.',
  /* 14–28  */ 'Sweep a scanner across the line y equals one. The magnitude of the gradient drops to zero at exactly two places — x equals minus one and x equals plus one.',
  /* 28–40  */ 'Solve the system: set the gradient of f equal to zero. The first component gives x squared equals one, so x is plus or minus one. The second gives y equals one. Two critical points fall out.',
  /* 40–46  */ 'Critical points are zeros of the gradient. Find them first, then classify.',
];

const NARRATION_AUDIO = 'audio/critical-points-gradient-field/scene.mp3';

// ─── Geometry ─────────────────────────────────────────────────────────────
function diagramGeom(portrait) {
  return portrait
    ? { ox: 360, oy: 560, u: 110, xMax: 2.2, yMax: 2.4, panelLeft: 60, panelBottom: 130, panelW: 600 }
    : { ox: 470, oy: 380, u: 110, xMax: 2.2, yMax: 2.4, panelRight: 64, panelTop: 170, panelW: 410 };
}

function toSvg(x, y, ox, oy, u) {
  return { sx: ox + x * u, sy: oy - y * u };
}

// Function and gradient.
function fOf(x, y) { return x * x * x / 3 - x + y * y - 2 * y; }
function gradF(x, y) { return [x * x - 1, 2 * y - 2]; }

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right = 64, top = 170, width = 380, left, bottom, transform }) {
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
      gap: 12,
    }}>
      {children}
    </div>
  );
}

function PlaneAxes({ ox, oy, u, xMax, yMax }) {
  const left = toSvg(-xMax, 0, ox, oy, u), right = toSvg(xMax, 0, ox, oy, u);
  const bot = toSvg(0, -yMax, ox, oy, u), top = toSvg(0, yMax, ox, oy, u);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7} strokeLinecap="round"/>
      <text x={right.sx + 12} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>x</text>
      <text x={top.sx - 16} y={top.sy - 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>y</text>
    </g>
  );
}

// Marching-squares contour generator (cheap; only 5 levels).
function ContourPaths({ ox, oy, u, xMax, yMax, levels, opacity = 0.45 }) {
  const NX = 70, NY = 70;
  const x0 = -xMax, x1 = xMax;
  const y0 = -yMax, y1 = yMax;
  const dx = (x1 - x0) / NX;
  const dy = (y1 - y0) / NY;
  // Precompute grid values.
  const grid = new Array(NX + 1);
  for (let i = 0; i <= NX; i++) {
    grid[i] = new Array(NY + 1);
    const x = x0 + i * dx;
    for (let j = 0; j <= NY; j++) {
      const y = y0 + j * dy;
      grid[i][j] = fOf(x, y);
    }
  }
  const out = [];
  for (const c of levels) {
    const segs = [];
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NY; j++) {
        const x0c = x0 + i * dx, y0c = y0 + j * dy;
        const x1c = x0c + dx, y1c = y0c + dy;
        const a = grid[i][j], b = grid[i + 1][j],
              cc = grid[i + 1][j + 1], d = grid[i][j + 1];
        const lerp = (va, vb, xa, ya, xb, yb) => {
          const t = (c - va) / (vb - va);
          return [xa + t * (xb - xa), ya + t * (yb - ya)];
        };
        const pts = [];
        if ((a - c) * (b - c) < 0) pts.push(lerp(a, b, x0c, y0c, x1c, y0c));
        if ((b - c) * (cc - c) < 0) pts.push(lerp(b, cc, x1c, y0c, x1c, y1c));
        if ((cc - c) * (d - c) < 0) pts.push(lerp(cc, d, x1c, y1c, x0c, y1c));
        if ((d - c) * (a - c) < 0) pts.push(lerp(d, a, x0c, y1c, x0c, y0c));
        if (pts.length >= 2) {
          const p0 = toSvg(pts[0][0], pts[0][1], ox, oy, u);
          const p1 = toSvg(pts[1][0], pts[1][1], ox, oy, u);
          segs.push(`M ${p0.sx.toFixed(1)} ${p0.sy.toFixed(1)} L ${p1.sx.toFixed(1)} ${p1.sy.toFixed(1)}`);
        }
      }
    }
    out.push(segs.join(' '));
  }
  return (
    <g>
      {out.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="var(--chalk-300)"
              strokeWidth={1.2} opacity={opacity} strokeLinecap="round"/>
      ))}
    </g>
  );
}

// Coarse gradient field — short arrows on a grid.
function GradientField({ ox, oy, u, xMax, yMax, scale = 0.18, opacity = 0.55 }) {
  const arrows = [];
  const stepX = 0.5, stepY = 0.5;
  for (let x = -2; x <= 2 + 1e-6; x += stepX) {
    for (let y = -2; y <= 2 + 1e-6; y += stepY) {
      const [gx, gy] = gradF(x, y);
      const mag = Math.hypot(gx, gy);
      if (mag < 0.05) continue;
      // Cap length so arrows don't blow up where the gradient is large.
      const eff = Math.min(scale, 0.5 / mag);
      const tx = x + gx * eff, ty = y + gy * eff;
      const a = toSvg(x, y, ox, oy, u);
      const b = toSvg(tx, ty, ox, oy, u);
      const dx_ = b.sx - a.sx, dy_ = b.sy - a.sy;
      const len = Math.hypot(dx_, dy_);
      if (len < 4) continue;
      const ux = dx_ / len, uy = dy_ / len;
      const headLen = 7, headHalf = 3.5;
      const baseX = b.sx - ux * headLen, baseY = b.sy - uy * headLen;
      const perpX = -uy, perpY = ux;
      const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
      const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
      arrows.push(
        <g key={`${x.toFixed(1)}-${y.toFixed(1)}`} opacity={opacity}>
          <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
                stroke="var(--amber-400)" strokeWidth={1.4} strokeLinecap="round"/>
          <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`}
                fill="var(--amber-400)"/>
        </g>
      );
    }
  }
  return <g>{arrows}</g>;
}

// Arrow utility for the scanner gradient indicator.
function Arrow({ bx, by, tx, ty, color, strokeWidth = 3.0, headLen = 12, headHalf = 6,
                 ox, oy, u }) {
  const a = toSvg(bx, by, ox, oy, u);
  const b = toSvg(tx, ty, ox, oy, u);
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
    <g>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="interior critical points"
      title="Critical Points: Where ∇f Vanishes"
      duration={SCENE_DURATION}
      introEnd={5.63}
      introCaption="Where is the ground flat?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.63} end={19.08}>
        <FieldBeat/>
      </Sprite>

      <Sprite start={19.08} end={30.8}>
        <ScanBeat/>
      </Sprite>

      <Sprite start={30.8} end={43.99}>
        <SolveBeat/>
      </Sprite>

      <Sprite start={43.99} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

const LEVELS = [-1.5, -1.0, -0.5, 0.0, 0.5, 1.0, 1.5];

// ─── Beat 2: Field setup ──────────────────────────────────────────────────
function FieldBeat() {
  const portrait = usePortrait();
  const G = diagramGeom(portrait);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={0.6}>
          <ContourPaths ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}
                        levels={LEVELS}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={1.4}>
          <GradientField ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={2.0} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the function
          </FadeUp>
          <FadeUp duration={0.55} delay={2.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--chalk-100)' }}>
            f(x, y) = x³/3 − x + y² − 2y
          </FadeUp>
          <FadeUp duration={0.55} delay={3.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--amber-400)' }}>
            ∇f = (x² − 1, 2y − 2)
          </FadeUp>
          <FadeUp duration={0.5} delay={4.2} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.4 }}>
            Arrows shrink where the surface flattens.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={2.0} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the function
          </FadeUp>
          <FadeUp duration={0.55} delay={2.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--chalk-100)', marginTop: 4 }}>
            f(x, y) = x³/3 − x + y² − 2y
          </FadeUp>
          <FadeUp duration={0.55} delay={3.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--amber-400)' }}>
            ∇f = (x² − 1, 2y − 2)
          </FadeUp>
          <FadeUp duration={0.5} delay={4.2} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '32ch', lineHeight: 1.45, marginTop: 6 }}>
            Arrows shrink where the surface flattens.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Scanner sweep along y = 1 with live |∇f| bar ─────────────────
function ScanBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  // Sweep x from -1.9 to 1.9 across the beat.
  const sweepDelay = 0.6;
  const sweepDur = 11.0;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const xScan = -1.9 + 3.8 * s;
  const yScan = 1.0;
  const [gx, gy] = gradF(xScan, yScan);
  const mag = Math.hypot(gx, gy);

  // Scanner SVG point.
  const P_svg = toSvg(xScan, yScan, G.ox, G.oy, G.u);

  // The horizontal scanline drawn across the diagram.
  const lineLeft = toSvg(-G.xMax, 1, G.ox, G.oy, G.u);
  const lineRight = toSvg(G.xMax, 1, G.ox, G.oy, G.u);

  // Magnitude bar geometry. Max |∇f| on the scan: |∇f|@x=±1.9, y=1 is
  // about √((1.9²-1)² + 0²) ≈ 2.61. Round to 3 for the gauge full-scale.
  const MAX = 3.0;
  const magNorm = clamp(mag / MAX, 0, 1);

  // Critical-point markers when |∇f| hits zero.
  const NEAR_LEFT = Math.abs(xScan - (-1)) < 0.1;
  const NEAR_RIGHT = Math.abs(xScan - 1) < 0.1;

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <ContourPaths ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}
                      levels={LEVELS} opacity={0.32}/>
        <GradientField ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax} opacity={0.32}/>

        {/* Scanline at y = 1 */}
        <line x1={lineLeft.sx} y1={lineLeft.sy} x2={lineRight.sx} y2={lineRight.sy}
              stroke="var(--teal-400)" strokeWidth={1.4} strokeDasharray="4 4" opacity={0.85}/>
        <text x={lineRight.sx + 8} y={lineRight.sy + 5}
              fill="var(--teal-400)" fontFamily="var(--font-mono)" fontSize={12}>y = 1</text>

        {/* Sticky markers at critical points (always faintly visible) */}
        {[{ x: 1, y: 1 }, { x: -1, y: 1 }].map((P, i) => {
          const ps = toSvg(P.x, P.y, G.ox, G.oy, G.u);
          return (
            <circle key={i} cx={ps.sx} cy={ps.sy} r={4}
                    fill="rgba(232,220,193,0.6)" stroke="var(--chalk-200)" strokeWidth={1}/>
          );
        })}

        {/* Bright snap when scanner is over a critical point */}
        {(NEAR_LEFT || NEAR_RIGHT) && (
          <circle cx={P_svg.sx} cy={P_svg.sy} r={10}
                  fill="none" stroke="var(--rose-400)" strokeWidth={2.5} opacity={0.85}/>
        )}

        {/* Live gradient arrow at the scanner — length scaled */}
        <Arrow bx={xScan} by={yScan}
               tx={xScan + gx * 0.22} ty={yScan + gy * 0.22}
               color="var(--amber-400)"
               ox={G.ox} oy={G.oy} u={G.u}/>

        {/* Scanner point */}
        <circle cx={P_svg.sx} cy={P_svg.sy} r={5.5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.2}/>
      </svg>

      {/* Magnitude bar in panel */}
      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            gradient magnitude
          </FadeUp>
          <div style={{ width: '100%', height: 18, background: 'rgba(232,220,193,0.10)',
                        borderRadius: 8, overflow: 'hidden', marginTop: 4 }}>
            <div style={{
              width: `${(magNorm * 100).toFixed(1)}%`, height: '100%',
              background: 'var(--amber-400)', borderRadius: 8,
              transition: 'width 0.05s linear',
            }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        width: '100%', marginTop: 2 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                            color: 'var(--chalk-300)' }}>|∇f| = {mag.toFixed(2)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                            color: 'var(--chalk-300)' }}>x = {xScan.toFixed(2)}</span>
          </div>
          <FadeUp duration={0.5} delay={1.2} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '36ch', lineHeight: 1.4, marginTop: 4 }}>
            Watch |∇f| collapse at the critical points.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            gradient magnitude
          </FadeUp>
          <div style={{ width: '100%', height: 22, background: 'rgba(232,220,193,0.10)',
                        borderRadius: 10, overflow: 'hidden', marginTop: 6 }}>
            <div style={{
              width: `${(magNorm * 100).toFixed(1)}%`, height: '100%',
              background: 'var(--amber-400)', borderRadius: 10,
              transition: 'width 0.05s linear',
            }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between',
                        width: '100%', marginTop: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                            color: 'var(--chalk-200)' }}>|∇f| = {mag.toFixed(2)}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                            color: 'var(--chalk-300)' }}>x = {xScan.toFixed(2)}</span>
          </div>
          <FadeUp duration={0.5} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4, marginTop: 8 }}>
            Watch |∇f| collapse at x = ±1 — those are the critical points.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Solve ∇f = 0 ──────────────────────────────────────────────────
function SolveBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 24 : 32, letterSpacing: '0.02em',
    textAlign: 'center',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 26, maxWidth: portrait ? 620 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        solve ∇f = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        ∇f = (x² − 1, 2y − 2) = (0, 0)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        x² = 1,  y = 1
      </FadeUp>

      <FadeUp duration={0.7} delay={2.4} distance={14}
        style={{
          ...stepStyle, color: 'var(--amber-300)',
          fontSize: portrait ? 28 : 40, marginTop: 6,
        }}>
        (1, 1)  and  (−1, 1)
      </FadeUp>

      <FadeUp duration={0.45} delay={3.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', maxWidth: portrait ? '28ch' : '38ch',
          textAlign: 'center', lineHeight: 1.4,
        }}>
        Classifying min vs saddle is the next step — the Hesse test.
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        find first, classify second
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 42, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch', lineHeight: 1.25,
        }}>
        Critical points are <br/>
        <span style={{ color: 'var(--amber-300)' }}>zeros of the gradient field.</span>
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage
      width={1280} height={720}
      duration={SCENE_DURATION}
      background="#0c0a1f"
      loop={false}
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
