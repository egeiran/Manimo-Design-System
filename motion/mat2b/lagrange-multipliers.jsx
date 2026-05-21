// Lagrange Multipliers: When Gradients Align — Manimo lesson scene.
// Chapter 6 of mat2b (Ekstremalpunkter). The core geometric idea: at a
// constrained extremum of f along g(x, y) = c, ∇f is parallel to ∇g.
//
// Concrete example used throughout:
//   maximise / minimise  f(x, y) = x + y
//   subject to           g(x, y) = x² + y² = 2
// Level lines of f are diagonals x + y = c. The constraint is a circle of
// radius √2 centred at the origin. ∇f = (1, 1) is constant; ∇g = (2x, 2y)
// rotates with the position. They align at the two diagonal points (1, 1)
// (max, λ = ½) and (−1, −1) (min, λ = −½).
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 5     Manimo hook
//    5–14     Setup — circle, diagonal level lines, formulas
//   14–27     Slide P along the circle — ∇f fixed, ∇g radial (GENUINE MOTION)
//   27–39     Snap to alignment at (1, 1) and (−1, −1)
//   39–47     Algebra — ∇f = λ∇g gives the two candidates
//   47–54     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  off-constraint diagonal level lines, grey body text
//   amber-400  the constraint circle (g = c) and the takeaway accent
//   violet-400 ∇f (constant northeast arrow)
//   rose-400   ∇g (radial arrow at P)
//   amber-300  max candidate (1, 1) — the winner direction
//   rose-300   min candidate (−1, −1)

const SCENE_DURATION = 59;

const NARRATION = [
  /*  0– 5  */ 'Where does f get its biggest value if we are forced to stay on a curve?',
  /*  5–14  */ 'Take f equals x plus y, and constrain to the circle x squared plus y squared equals two. The level lines of f are diagonal — every step northeast pushes f up.',
  /* 14–27  */ 'Slide a point along the circle. The gradient of f is fixed — it points northeast everywhere. The gradient of g rotates with the point, always pointing straight out from the origin.',
  /* 27–39  */ 'At the constrained maximum the two arrows line up. At the constrained minimum they point opposite ways. So at every constrained extremum, the gradient of f is a scalar multiple of the gradient of g.',
  /* 39–47  */ 'Set the gradient of f equal to lambda times the gradient of g and solve. The system gives x equals y and lambda equals plus or minus one half, landing exactly on the two candidates.',
  /* 47–54  */ 'At every constrained extremum, the gradients align — that is the whole trick.',
];

const NARRATION_AUDIO = 'audio/lagrange-multipliers/scene.mp3';

// ─── Plane coordinates (landscape defaults) ───────────────────────────────
const ORIGIN_X = 470;
const ORIGIN_Y = 370;
const UNIT = 100;

function toSvg(x, y, ox = ORIGIN_X, oy = ORIGIN_Y, u = UNIT) {
  return { sx: ox + x * u, sy: oy - y * u };
}

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

function PlaneAxes({ ox, oy, u, xMax = 2.4, yMax = 2.0 }) {
  const left = toSvg(-xMax, 0, ox, oy, u), right = toSvg(xMax, 0, ox, oy, u);
  const bot = toSvg(0, -yMax, ox, oy, u), top = toSvg(0, yMax, ox, oy, u);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round" opacity={0.7}/>
      <text x={right.sx + 14} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>x</text>
      <text x={top.sx - 18} y={top.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>y</text>
    </g>
  );
}

// Family of level lines of f(x,y) = x + y. Line x + y = c spans the plotting
// window from x = X_MIN to x = X_MAX along y = c − x. Drawn as faint chalk.
function DiagonalLevelLines({ ox, oy, u, xExt = 2.4, yExt = 2.0, c0 = -3, c1 = 3, step = 0.6 }) {
  const lines = [];
  for (let c = c0; c <= c1 + 1e-6; c += step) {
    // Each line: y = c − x. Clip to box [-xExt, xExt] × [-yExt, yExt].
    // Compute the two endpoints inside the box.
    const pts = [];
    // Intersect with x = -xExt and x = xExt
    [-xExt, xExt].forEach(x => {
      const y = c - x;
      if (y >= -yExt && y <= yExt) pts.push({ x, y });
    });
    // Intersect with y = -yExt and y = yExt
    [-yExt, yExt].forEach(y => {
      const x = c - y;
      if (x >= -xExt && x <= xExt) pts.push({ x, y });
    });
    if (pts.length < 2) continue;
    const a = toSvg(pts[0].x, pts[0].y, ox, oy, u);
    const b = toSvg(pts[1].x, pts[1].y, ox, oy, u);
    const isMax = Math.abs(c - 2) < 1e-6;
    const isMin = Math.abs(c + 2) < 1e-6;
    lines.push(
      <line key={c.toFixed(2)} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
            stroke={isMax ? 'var(--amber-300)' : isMin ? 'var(--rose-300)' : 'var(--chalk-300)'}
            strokeWidth={isMax || isMin ? 1.6 : 1.2}
            opacity={isMax || isMin ? 0.7 : 0.4}
            strokeDasharray={isMax || isMin ? '0' : '5 5'}
            strokeLinecap="round"/>
    );
  }
  return <g>{lines}</g>;
}

// The constraint circle x² + y² = 2.
function ConstraintCircle({ ox, oy, u, opacity = 1, strokeWidth = 2.6 }) {
  const c = toSvg(0, 0, ox, oy, u);
  return (
    <circle cx={c.sx} cy={c.sy} r={Math.SQRT2 * u}
            fill="none" stroke="var(--amber-400)"
            strokeWidth={strokeWidth} opacity={opacity}/>
  );
}

// Arrow from base→tip in math coords.
function Arrow({ bx, by, tx, ty, color, label, labelDX = 14, labelDY = -10,
                 strokeWidth = 3.0, headLen = 12, headHalf = 6.5,
                 ox = ORIGIN_X, oy = ORIGIN_Y, u = UNIT }) {
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
      {label && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
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
      eyebrow="constrained extrema"
      title="Lagrange Multipliers: When Gradients Align"
      duration={SCENE_DURATION}
      introEnd={4.3}
      introCaption="Pin a point on a curve — when is f largest?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.3} end={16.63}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={16.63} end={28.22}>
        <SlideBeat/>
      </Sprite>

      <Sprite start={28.22} end={41.02}>
        <AlignBeat/>
      </Sprite>

      <Sprite start={41.02} end={52.36}>
        <SolveBeat/>
      </Sprite>

      <Sprite start={52.36} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// Geometry per aspect: portrait stacks the diagram above a smaller readout panel.
function diagramGeom(portrait) {
  return portrait
    ? { ox: 360, oy: 600, u: 88, xMax: 2.2, yMax: 2.2, panelW: 580, panelLeft: 70, panelBottom: 130 }
    : { ox: 470, oy: 380, u: 100, xMax: 2.4, yMax: 2.0, panelW: 400, panelRight: 60, panelTop: 140 };
}

// ─── Beat 2: Setup — circle + level lines + formulas ──────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = diagramGeom(portrait);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.6} delay={0.6}>
          <DiagonalLevelLines ox={G.ox} oy={G.oy} u={G.u} xExt={G.xMax} yExt={G.yMax}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={1.6}>
          <ConstraintCircle ox={G.ox} oy={G.oy} u={G.u}/>
          <text x={toSvg(Math.SQRT2 + 0.05, 0.18, G.ox, G.oy, G.u).sx}
                y={toSvg(Math.SQRT2 + 0.05, 0.18, G.ox, G.oy, G.u).sy}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.06em">g = 2</text>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={2.0} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            f and the constraint
          </FadeUp>
          <FadeUp duration={0.55} delay={2.2} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            f(x, y) = x + y
          </FadeUp>
          <FadeUp duration={0.55} delay={3.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-300)' }}>
            g(x, y) = x² + y² = 2
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '36ch', lineHeight: 1.4 }}>
            Stay on the amber circle. Where is f biggest?
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={2.0} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            f and the constraint
          </FadeUp>
          <FadeUp duration={0.55} delay={2.2} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)', marginTop: 4 }}>
            f(x, y) = x + y
          </FadeUp>
          <FadeUp duration={0.55} delay={3.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--amber-300)' }}>
            g(x, y) = x² + y² = 2
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4, marginTop: 6 }}>
            Stay on the amber circle. Where is f biggest?
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Slide P along the circle ─────────────────────────────────────
// Genuine animation: a point P sweeps along the constraint circle from θ ≈ π
// (left) to θ ≈ π/4 (NE, the max), with ∇f and ∇g arrows updating live.
function SlideBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  // Sweep parameter: 0 at left of circle, 1 at the (1,1) point (θ = π/4).
  // Hold a brief "settle" at the endpoint so the viewer sees alignment.
  const sweepDur = 9.0;          // seconds of motion
  const sweepDelay = 1.0;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  // Move from θ = 3π/4 (top-left, antiparallel-ish) → π/4 (top-right, parallel).
  const theta = (3 * Math.PI / 4) + (Math.PI / 4 - 3 * Math.PI / 4) * Easing.easeInOutCubic(s);
  const px = Math.SQRT2 * Math.cos(theta);
  const py = Math.SQRT2 * Math.sin(theta);

  // Gradient vectors.
  const FX = 1, FY = 1;                  // ∇f always (1, 1)
  const GX = 2 * px, GY = 2 * py;        // ∇g = (2x, 2y)
  // Visual scales — keep arrows similar in length so alignment is the visual cue.
  const FSCALE = 0.55;
  const GSCALE = 0.22;

  const P_svg = toSvg(px, py, G.ox, G.oy, G.u);

  // Angle between ∇f and ∇g (in degrees), for the live readout.
  const dot = FX * GX + FY * GY;
  const cosA = dot / (Math.hypot(FX, FY) * Math.hypot(GX, GY));
  const angleDeg = Math.acos(clamp(cosA, -1, 1)) * 180 / Math.PI;

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <DiagonalLevelLines ox={G.ox} oy={G.oy} u={G.u} xExt={G.xMax} yExt={G.yMax}/>
        <ConstraintCircle ox={G.ox} oy={G.oy} u={G.u}/>

        {/* ∇f arrow — constant northeast at P */}
        <Arrow bx={px} by={py}
               tx={px + FX * FSCALE} ty={py + FY * FSCALE}
               color="var(--violet-400)" label="∇f" labelDX={10} labelDY={-6}
               ox={G.ox} oy={G.oy} u={G.u}/>

        {/* ∇g arrow — radial at P */}
        <Arrow bx={px} by={py}
               tx={px + GX * GSCALE} ty={py + GY * GSCALE}
               color="var(--rose-400)" label="∇g" labelDX={10} labelDY={14}
               ox={G.ox} oy={G.oy} u={G.u}/>

        {/* Point P */}
        <circle cx={P_svg.sx} cy={P_svg.sy} r={5.5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.2}/>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            two gradients
          </FadeUp>
          <FadeUp duration={0.5} delay={1.0} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--violet-400)' }}>
            ∇f = (1, 1)
          </FadeUp>
          <FadeUp duration={0.5} delay={1.6} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--rose-400)' }}>
            ∇g = (2x, 2y)
          </FadeUp>
          <FadeUp duration={0.5} delay={2.0} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-200)', letterSpacing: '0.05em' }}>
            angle between them: {angleDeg.toFixed(0)}°
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            two gradients
          </FadeUp>
          <FadeUp duration={0.55} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--violet-400)' }}>
            ∇f = (1, 1)  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', fontStyle: 'normal' }}>constant</span>
          </FadeUp>
          <FadeUp duration={0.55} delay={1.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--rose-400)' }}>
            ∇g = (2x, 2y)  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', fontStyle: 'normal' }}>radial</span>
          </FadeUp>
          <FadeUp duration={0.5} delay={2.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--chalk-200)', letterSpacing: '0.05em',
                     marginTop: 8 }}>
            angle ∠(∇f, ∇g) = {angleDeg.toFixed(0)}°
          </FadeUp>
          <FadeUp duration={0.5} delay={3.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            Watch the angle — when it hits 0° or 180°, the arrows are parallel.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Snap to alignment at (1, 1) and (−1, −1) ─────────────────────
function AlignBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  // Two snap targets, revealed in sequence.
  const showMax = localTime >= 0.3;
  const showMin = localTime >= 3.0;

  const P1 = { x: 1, y: 1 };
  const P2 = { x: -1, y: -1 };

  // Arrows lengths
  const FSCALE = 0.55;
  const GSCALE = 0.22;

  const drawCandidate = (P, accent, labelText) => {
    const FX = 1, FY = 1;
    const GX = 2 * P.x, GY = 2 * P.y;
    const P_svg = toSvg(P.x, P.y, G.ox, G.oy, G.u);
    return (
      <g key={labelText}>
        <Arrow bx={P.x} by={P.y}
               tx={P.x + FX * FSCALE} ty={P.y + FY * FSCALE}
               color="var(--violet-400)"
               ox={G.ox} oy={G.oy} u={G.u}/>
        <Arrow bx={P.x} by={P.y}
               tx={P.x + GX * GSCALE} ty={P.y + GY * GSCALE}
               color="var(--rose-400)"
               ox={G.ox} oy={G.oy} u={G.u}/>
        <circle cx={P_svg.sx} cy={P_svg.sy} r={6}
                fill={accent} stroke="var(--chalk-100)" strokeWidth={1.5}/>
      </g>
    );
  };

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <DiagonalLevelLines ox={G.ox} oy={G.oy} u={G.u} xExt={G.xMax} yExt={G.yMax}/>
        <ConstraintCircle ox={G.ox} oy={G.oy} u={G.u}/>

        {showMax && (
          <SvgFadeIn duration={0.4} delay={0}>
            {drawCandidate(P1, 'var(--amber-300)', 'max')}
          </SvgFadeIn>
        )}
        {showMin && (
          <SvgFadeIn duration={0.4} delay={0}>
            {drawCandidate(P2, 'var(--rose-300)', 'min')}
          </SvgFadeIn>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.5} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--amber-300)' }}>
            P = (1, 1) &nbsp; f = 2 &nbsp; ← max
          </FadeUp>
          <FadeUp duration={0.5} delay={3.8} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--rose-300)' }}>
            P = (−1, −1) &nbsp; f = −2 &nbsp; ← min
          </FadeUp>
          <FadeUp duration={0.6} delay={5.6} distance={12}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 28, color: 'var(--amber-300)', marginTop: 6 }}>
            ∇f = λ ∇g
          </FadeUp>
          <FadeUp duration={0.45} delay={6.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)' }}>
            λ is the Lagrange multiplier
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.5} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--amber-300)' }}>
            P = (1, 1) &nbsp; f = 2 &nbsp; ← max
          </FadeUp>
          <FadeUp duration={0.5} delay={3.8} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--rose-300)' }}>
            P = (−1, −1) &nbsp; f = −2 &nbsp; ← min
          </FadeUp>
          <FadeUp duration={0.7} delay={5.6} distance={14}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 44, color: 'var(--amber-300)', marginTop: 8 }}>
            ∇f = λ ∇g
          </FadeUp>
          <FadeUp duration={0.45} delay={6.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)' }}>
            λ is the Lagrange multiplier
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 5: Algebra — solve ∇f = λ∇g ─────────────────────────────────────
function SolveBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 26 : 32, letterSpacing: '0.02em',
    textAlign: 'center',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 26, maxWidth: portrait ? 600 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        solve ∇f = λ ∇g
      </FadeUp>

      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        (1, 1) = λ (2x, 2y)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        x = y,  λ = 1 / (2x)
      </FadeUp>

      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-100)' }}>
        x² + y² = 2  →  x = ±1
      </FadeUp>

      <FadeUp duration={0.6} delay={3.4} distance={14}
        style={{
          ...stepStyle,
          fontSize: portrait ? 22 : 30,
          color: 'var(--amber-300)', marginTop: 6,
        }}>
        (1, 1), λ = ½  &nbsp;&nbsp;  (−1, −1), λ = −½
      </FadeUp>

      <FadeUp duration={0.45} delay={4.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', maxWidth: portrait ? '28ch' : '38ch',
          textAlign: 'center', lineHeight: 1.4,
        }}>
        Two candidates — the max and the min.
      </FadeUp>
    </div>
  );
}

// ─── Beat 6: Takeaway ─────────────────────────────────────────────────────
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
        the whole trick
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 44, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch', lineHeight: 1.25,
        }}>
        Gradients align at the <br/>
        <span style={{ color: 'var(--amber-300)' }}>constrained extremum.</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
          color: 'var(--chalk-200)', letterSpacing: '0.06em',
          marginTop: 8,
        }}>
        ∇f = λ ∇g
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
