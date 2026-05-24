// Gradient Descent: Walking Downhill — Manimo lesson scene.
// Chapter 6 of mat2b (Ekstremalpunkter). Finding a minimum is a *process*, not
// just a classification. Steepest descent repeats one move:
//   x_{k+1} = x_k − η·∇f(x_k)
// On the anisotropic bowl f(x, y) = ½(x² + 2.2·y²) the gradient is
// ∇f = (x, 2.2·y). With step η = 0.25 and start (2.1, 1.6) the iterate dives
// down the steep y-direction onto the valley floor, then crawls along x toward
// the minimum at the origin — and f decreases at every step.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 5     Manimo hook
//    5–16     Setup — contour bowl + start point + downhill (−∇f) arrow + rule
//   16–31     Descent — path steps down, value staircase fills in (GENUINE MOTION)
//   31–40     Shape — why it bends; step-size caveat
//   40–46     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  level curves, grey body text
//   amber-400  descent path, downhill arrow, primary accent
//   amber-300  payoff / value readout
//   rose-400   start point, overshoot warning

const SCENE_DURATION = 47;

const NARRATION = [
  /*  0– 5  */ "To find the lowest point of a surface, you don't need a formula — you can just keep walking downhill.",
  /*  5–16  */ 'Here is a bowl that is stretched along one axis. The gradient points uphill, so its negative points the fastest way down, and each step moves a little in that downhill direction.',
  /* 16–31  */ 'Watch the path step down the contours. It dives quickly down the steep direction onto the valley floor, then inches along toward the minimum, and the height drops at every single step.',
  /* 31–40  */ 'The trajectory bends because the surface is steep one way and shallow the other. Take steps that are too large and you overshoot; keep them small and downhill is always safe.',
  /* 40–46  */ 'Gradient descent: step against the gradient, again and again, and you slide into a minimum.',
];

const NARRATION_AUDIO = 'audio/gradient-descent-on-contours/scene.mp3';

// ─── Function, gradient, and the precomputed descent iterates ──────────────
function fOf(x, y) { return 0.5 * (x * x + 2.2 * y * y); }
function gradF(x, y) { return [x, 2.2 * y]; }

const ETA = 0.25;
const START = [2.1, 1.6];
const N_STEPS = 8;
// Iterates x_0 … x_N and their function values, computed once.
const ITERATES = (() => {
  const pts = [START.slice()];
  for (let k = 0; k < N_STEPS; k++) {
    const [x, y] = pts[k];
    const [gx, gy] = gradF(x, y);
    pts.push([x - ETA * gx, y - ETA * gy]);
  }
  return pts.map(([x, y]) => ({ x, y, f: fOf(x, y) }));
})();
const F_MAX = ITERATES[0].f;

// ─── Geometry ──────────────────────────────────────────────────────────────
function diagramGeom(portrait) {
  return portrait
    ? { ox: 360, oy: 460, u: 104, xMax: 2.7, yMax: 2.2,
        panelLeft: 56, panelBottom: 178, panelW: 608, panelTop: null }
    : { ox: 452, oy: 372, u: 118, xMax: 2.7, yMax: 2.2,
        panelRight: 60, panelTop: 168, panelW: 404, panelLeft: null };
}

function toSvg(x, y, ox, oy, u) { return { sx: ox + x * u, sy: oy - y * u }; }

// ─── Helpers ───────────────────────────────────────────────────────────────
function SoftPanel({ children, right = 60, top = 168, width = 380, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined }
    : { right, top };
  return (
    <div style={{
      position: 'absolute', width, ...positioning, pointerEvents: 'none',
      padding: '18px 22px', background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)', borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>
      {children}
    </div>
  );
}

function PlaneAxes({ ox, oy, u, xMax, yMax }) {
  const l = toSvg(-xMax, 0, ox, oy, u), r = toSvg(xMax, 0, ox, oy, u);
  const b = toSvg(0, -yMax, ox, oy, u), t = toSvg(0, yMax, ox, oy, u);
  return (
    <g>
      <line x1={l.sx} y1={l.sy} x2={r.sx} y2={r.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7} strokeLinecap="round"/>
      <line x1={t.sx} y1={t.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} opacity={0.7} strokeLinecap="round"/>
      <text x={r.sx + 12} y={r.sy + 6} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>x</text>
      <text x={t.sx - 16} y={t.sy - 6} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>y</text>
    </g>
  );
}

// Marching-squares contours of f.
function ContourPaths({ ox, oy, u, xMax, yMax, levels, opacity = 0.45 }) {
  const NX = 64, NY = 64;
  const x0 = -xMax, x1 = xMax, y0 = -yMax, y1 = yMax;
  const dx = (x1 - x0) / NX, dy = (y1 - y0) / NY;
  const grid = [];
  for (let i = 0; i <= NX; i++) {
    grid[i] = [];
    for (let j = 0; j <= NY; j++) grid[i][j] = fOf(x0 + i * dx, y0 + j * dy);
  }
  const out = [];
  for (const c of levels) {
    const segs = [];
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NY; j++) {
        const x0c = x0 + i * dx, y0c = y0 + j * dy, x1c = x0c + dx, y1c = y0c + dy;
        const a = grid[i][j], bb = grid[i + 1][j], cc = grid[i + 1][j + 1], d = grid[i][j + 1];
        const lerp = (va, vb, xa, ya, xb, yb) => {
          const tt = (c - va) / (vb - va);
          return [xa + tt * (xb - xa), ya + tt * (yb - ya)];
        };
        const pts = [];
        if ((a - c) * (bb - c) < 0) pts.push(lerp(a, bb, x0c, y0c, x1c, y0c));
        if ((bb - c) * (cc - c) < 0) pts.push(lerp(bb, cc, x1c, y0c, x1c, y1c));
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

function Arrow({ bx, by, tx, ty, color, strokeWidth = 3, headLen = 12, headHalf = 6, ox, oy, u }) {
  const a = toSvg(bx, by, ox, oy, u), b = toSvg(tx, ty, ox, oy, u);
  const dx = b.sx - a.sx, dy = b.sy - a.sy, len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = b.sx - ux * headLen, baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
    </g>
  );
}

// Chosen so a few rings sit between the start point and the minimum.
const LEVELS = [0.12, 0.45, 1.0, 1.8, 2.9, 4.2];

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="iterative minimisation"
      title="Gradient Descent: Walking Downhill"
      duration={SCENE_DURATION}
      introEnd={5.96}
      introCaption="Lost on a hillside — which way is down?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.96} end={17.1}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={17.1} end={28.32}>
        <DescentBeat/>
      </Sprite>

      <Sprite start={28.32} end={39.38}>
        <ShapeBeat/>
      </Sprite>

      <Sprite start={39.38} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup ───────────────────────────────────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = diagramGeom(portrait);
  const p0 = toSvg(START[0], START[1], G.ox, G.oy, G.u);
  const [gx, gy] = gradF(START[0], START[1]);
  const gmag = Math.hypot(gx, gy);
  // Downhill direction = −∇f, drawn as a short fixed-length arrow.
  const dlen = 0.9;
  const dx = -gx / gmag * dlen, dy = -gy / gmag * dlen;

  const Panel = (
    <>
      <FadeUp duration={0.45} delay={2.6} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        the surface
      </FadeUp>
      <FadeUp duration={0.55} delay={3.0} distance={10}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 20 : 24, color: 'var(--chalk-100)' }}>
        f(x, y) = ½(x² + 2.2 y²)
      </FadeUp>
      <FadeUp duration={0.55} delay={3.6} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 21,
                 color: 'var(--amber-400)' }}>
        xₖ₊₁ = xₖ − η ∇f(xₖ)
      </FadeUp>
      <FadeUp duration={0.5} delay={4.4} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                 color: 'var(--chalk-300)', maxWidth: portrait ? '40ch' : '32ch', lineHeight: 1.45 }}>
        Downhill is the opposite of the gradient.
      </FadeUp>
    </>
  );

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={0.6}>
          <ContourPaths ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax} levels={LEVELS}/>
        </SvgFadeIn>
        {/* Minimum at origin */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <circle cx={toSvg(0, 0, G.ox, G.oy, G.u).sx} cy={toSvg(0, 0, G.ox, G.oy, G.u).sy} r={3.5}
                  fill="var(--chalk-300)"/>
        </SvgFadeIn>
        {/* Start point */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <circle cx={p0.sx} cy={p0.sy} r={6} fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.4}/>
          <text x={p0.sx + 12} y={p0.sy - 8} fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize={13}>x₀</text>
        </SvgFadeIn>
        {/* Downhill arrow */}
        <SvgFadeIn duration={0.45} delay={2.2}>
          <Arrow bx={START[0]} by={START[1]} tx={START[0] + dx} ty={START[1] + dy}
                 color="var(--amber-400)" ox={G.ox} oy={G.oy} u={G.u}/>
          <text x={toSvg(START[0] + dx, START[1] + dy, G.ox, G.oy, G.u).sx - 8}
                y={toSvg(START[0] + dx, START[1] + dy, G.ox, G.oy, G.u).sy + 18}
                fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={13} textAnchor="end">−∇f</text>
        </SvgFadeIn>
      </svg>

      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
    </>
  );
}

// ─── Beat 3: Descent (GENUINE MOTION) ────────────────────────────────────────
function DescentBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  // Reveal one iterate per `perStep` seconds; interpolate the leading dot along
  // the current segment for smooth motion.
  const startDelay = 0.8;
  const perStep = 1.35;
  const prog = Math.max(0, (localTime - startDelay) / perStep); // in "steps"
  const doneSeg = Math.min(Math.floor(prog), N_STEPS); // fully drawn segments
  const frac = clamp(prog - doneSeg, 0, 1);            // fraction into current segment
  const visibleIdx = Math.min(doneSeg, N_STEPS);       // index of leading iterate

  // Leading point: interpolate from ITERATES[doneSeg] toward [doneSeg+1].
  let lead = ITERATES[Math.min(doneSeg, N_STEPS)];
  if (doneSeg < N_STEPS) {
    const a = ITERATES[doneSeg], b = ITERATES[doneSeg + 1];
    lead = { x: a.x + (b.x - a.x) * frac, y: a.y + (b.y - a.y) * frac, f: 0 };
  }

  // Path polyline up to the leading point.
  const pathPts = [];
  for (let k = 0; k <= doneSeg && k <= N_STEPS; k++) pathPts.push(ITERATES[k]);
  pathPts.push(lead);
  const pathD = pathPts
    .map((p, i) => { const s = toSvg(p.x, p.y, G.ox, G.oy, G.u); return `${i === 0 ? 'M' : 'L'} ${s.sx.toFixed(1)} ${s.sy.toFixed(1)}`; })
    .join(' ');

  const leadS = toSvg(lead.x, lead.y, G.ox, G.oy, G.u);
  const curF = fOf(lead.x, lead.y);

  // Value staircase bars (one per landed iterate).
  const barsShown = visibleIdx + 1; // iterates 0..visibleIdx have landed

  const Panel = (
    <>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                    letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        height f(xₖ) per step
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: portrait ? 8 : 7,
                    height: portrait ? 96 : 108, width: '100%', marginTop: 4 }}>
        {ITERATES.map((it, k) => {
          const h = (it.f / F_MAX) * (portrait ? 92 : 104);
          const landed = k < barsShown;
          return (
            <div key={k} style={{ flex: 1, display: 'flex', flexDirection: 'column',
                                  justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
              <div style={{
                width: '100%', height: Math.max(2, h),
                background: landed ? 'var(--amber-400)' : 'rgba(232,220,193,0.10)',
                borderRadius: 3, transition: 'height 0.08s linear, background 0.1s linear',
              }}/>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: 2 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--chalk-200)' }}>
          step k = {visibleIdx}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--amber-300)' }}>
          f = {curF.toFixed(2)}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 12 : 13,
                    color: 'var(--chalk-300)', maxWidth: portrait ? '40ch' : '32ch', lineHeight: 1.4 }}>
        f drops at every step — never uphill.
      </div>
    </>
  );

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
        <ContourPaths ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax} levels={LEVELS} opacity={0.3}/>
        {/* Minimum */}
        <circle cx={toSvg(0, 0, G.ox, G.oy, G.u).sx} cy={toSvg(0, 0, G.ox, G.oy, G.u).sy} r={3.5}
                fill="var(--chalk-300)"/>
        {/* Landed iterate dots */}
        {ITERATES.slice(0, barsShown).map((it, k) => {
          const s = toSvg(it.x, it.y, G.ox, G.oy, G.u);
          return <circle key={k} cx={s.sx} cy={s.sy} r={3.5}
                         fill="rgba(244,184,96,0.85)" stroke="var(--amber-300)" strokeWidth={0.8}/>;
        })}
        {/* Descent path */}
        <path d={pathD} fill="none" stroke="var(--amber-400)" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"/>
        {/* Leading iterate */}
        <circle cx={leadS.sx} cy={leadS.sy} r={6} fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={2}/>
      </svg>

      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
    </>
  );
}

// ─── Beat 4: Shape of the path ───────────────────────────────────────────────
function ShapeBeat() {
  const portrait = usePortrait();
  const G = diagramGeom(portrait);

  const fullPathD = ITERATES
    .map((p, i) => { const s = toSvg(p.x, p.y, G.ox, G.oy, G.u); return `${i === 0 ? 'M' : 'L'} ${s.sx.toFixed(1)} ${s.sy.toFixed(1)}`; })
    .join(' ');
  // Midpoint of the steep first leg, and a point on the shallow crawl.
  const steepMid = toSvg((ITERATES[0].x + ITERATES[1].x) / 2, (ITERATES[0].y + ITERATES[1].y) / 2, G.ox, G.oy, G.u);
  const crawl = toSvg(ITERATES[4].x, ITERATES[4].y, G.ox, G.oy, G.u);

  const Panel = (
    <>
      <FadeUp duration={0.45} delay={0.3} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                 letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        why it bends
      </FadeUp>
      <FadeUp duration={0.5} delay={1.0} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-200)', maxWidth: portrait ? '42ch' : '34ch', lineHeight: 1.5 }}>
        Steep direction first → then a long crawl along the shallow valley floor.
      </FadeUp>
      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--rose-300)', maxWidth: portrait ? '42ch' : '34ch', lineHeight: 1.5 }}>
        η too large → overshoot. Small steps → safe descent.
      </FadeUp>
    </>
  );

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <SvgFadeIn duration={0.4} delay={0.1}>
          <PlaneAxes ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax}/>
          <ContourPaths ox={G.ox} oy={G.oy} u={G.u} xMax={G.xMax} yMax={G.yMax} levels={LEVELS} opacity={0.3}/>
        </SvgFadeIn>
        <circle cx={toSvg(0, 0, G.ox, G.oy, G.u).sx} cy={toSvg(0, 0, G.ox, G.oy, G.u).sy} r={3.5} fill="var(--chalk-300)"/>
        <TraceIn d={fullPathD} stroke="var(--amber-400)" strokeWidth={2.6} duration={1.0} delay={0.3}/>
        {ITERATES.map((it, k) => {
          const s = toSvg(it.x, it.y, G.ox, G.oy, G.u);
          return <circle key={k} cx={s.sx} cy={s.sy} r={3.2}
                         fill="rgba(244,184,96,0.85)" stroke="var(--amber-300)" strokeWidth={0.8}/>;
        })}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={steepMid.sx + 14} y={steepMid.sy} fill="var(--chalk-200)"
                fontFamily="var(--font-sans)" fontSize={13}>steep</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.4}>
          <text x={crawl.sx} y={crawl.sy + 22} fill="var(--chalk-200)" textAnchor="middle"
                fontFamily="var(--font-sans)" fontSize={13}>shallow crawl</text>
        </SvgFadeIn>
      </svg>

      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
    </>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        step against the gradient
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '40ch', lineHeight: 1.25 }}>
        Walk downhill — and a <span style={{ color: 'var(--amber-300)' }}>minimum pulls you in.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
                 color: 'var(--amber-300)' }}>
        xₖ₊₁ = xₖ − η ∇f(xₖ)
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
