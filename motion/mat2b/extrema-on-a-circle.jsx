// Extrema on a Circle: Sweep the Boundary — Manimo lesson scene.
// Chapter 6 of mat2b (Ekstremalpunkter). To optimise f(x, y) = x² + 2y² on the
// unit circle, parametrise the boundary as (cos θ, sin θ). The two-variable
// constrained problem collapses to one variable:
//   g(θ) = cos²θ + 2 sin²θ = 1 + sin²θ
// g rises to 2 at the top and bottom of the circle (the constrained MAX, at
// (0, ±1)) and falls to 1 at the left and right (the constrained MIN, at
// (±1, 0)). At every extreme the level curve of f is tangent to the circle and
// ∇f points along the radius — exactly ∇f = λ∇g.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 5     Manimo hook
//    5–15     Setup — contours + unit circle + parametrisation + empty g axes
//   15–31     Sweep — point orbits, g(θ) traces in sync (GENUINE MOTION)
//   31–40     Tangency — freeze at extrema; ∇f ∥ radius = Lagrange
//   40–46     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  level curves, grey body text
//   teal-400   the unit circle (the constraint)
//   amber-400  g(θ) trace, gradient arrows, primary accent
//   amber-300  payoff / readout
//   rose-400   orbiting point, extrema markers

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0– 5  */ 'How large can a function get if you are trapped on a circle?',
  /*  5–15  */ 'The function f equals x squared plus two y squared grows without bound in the plane. But restrict it to the unit circle, and there is a largest value and a smallest value.',
  /* 15–31  */ 'Walk around the circle with the angle theta. The value rises to its maximum at the top and bottom, and falls to its minimum at the left and right, tracing a smooth curve below.',
  /* 31–40  */ 'At each extreme, the level curve of f just grazes the circle — the gradient of f points straight along the radius. That is exactly the Lagrange condition.',
  /* 40–46  */ 'To optimise on a boundary, parametrise it and turn a two variable problem into a single one.',
];

const NARRATION_AUDIO = 'audio/extrema-on-a-circle/scene.mp3';

const TAU = Math.PI * 2;

// ─── Function on the plane and on the boundary ───────────────────────────────
function fOf(x, y) { return x * x + 2 * y * y; }
function gOfTheta(t) { return 1 + Math.sin(t) * Math.sin(t); } // f(cos t, sin t)

// ─── Geometry ────────────────────────────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? {
        plane: { ox: 360, oy: 432, u: 168, xMax: 1.75, yMax: 1.55 },
        graph: { x0: 132, x1: 636, baseY: 1078, topY: 818, gHi: 2.4 },
      }
    : {
        plane: { ox: 356, oy: 372, u: 134, xMax: 1.85, yMax: 1.55 },
        graph: { x0: 726, x1: 1190, baseY: 542, topY: 214, gHi: 2.4 },
      };
}

function toSvg(x, y, ox, oy, u) { return { sx: ox + x * u, sy: oy - y * u }; }
function thetaToX(t, gr) { return gr.x0 + (t / TAU) * (gr.x1 - gr.x0); }
function gToY(v, gr) { return gr.baseY + (v / gr.gHi) * (gr.topY - gr.baseY); }

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

function ContourPaths({ ox, oy, u, xMax, yMax, levels, opacity = 0.4 }) {
  const NX = 60, NY = 60;
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
    out.push({ d: segs.join(' '), c });
  }
  return (
    <g>
      {out.map((o, i) => (
        <path key={i} d={o.d} fill="none" stroke="var(--chalk-300)"
              strokeWidth={1.2} opacity={opacity} strokeLinecap="round"/>
      ))}
    </g>
  );
}

// One ellipse f = x² + 2y² = c, as an SVG path (for highlighted tangent levels).
function levelEllipsePath(c, ox, oy, u) {
  const a = Math.sqrt(c);          // x semi-axis
  const b = Math.sqrt(c / 2);      // y semi-axis
  const pts = [];
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const t = (i / N) * TAU;
    const s = toSvg(a * Math.cos(t), b * Math.sin(t), ox, oy, u);
    pts.push(`${i === 0 ? 'M' : 'L'} ${s.sx.toFixed(1)} ${s.sy.toFixed(1)}`);
  }
  return pts.join(' ');
}

function Arrow({ ax, ay, bx, by, color, strokeWidth = 3, headLen = 11, headHalf = 5.5 }) {
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = bx - ux * headLen, baseY = by - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={ax} y1={ay} x2={baseX} y2={baseY} stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${bx} ${by} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
    </g>
  );
}

// g(θ) graph frame: θ axis, g axis, dashed min(1)/max(2) reference levels.
function GraphFrame({ gr, showRefs }) {
  const ax0 = thetaToX(0, gr), ax1 = thetaToX(TAU, gr);
  const ayBase = gr.baseY, ayTop = gr.topY;
  const ticks = [
    { t: 0, label: '0' },
    { t: Math.PI / 2, label: 'π/2' },
    { t: Math.PI, label: 'π' },
    { t: 3 * Math.PI / 2, label: '3π/2' },
    { t: TAU, label: '2π' },
  ];
  return (
    <g>
      {/* axes */}
      <line x1={ax0} y1={ayBase} x2={ax1 + 14} y2={ayBase}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.7}/>
      <line x1={ax0} y1={ayTop - 8} x2={ax0} y2={ayBase}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.7}/>
      <text x={ax1 + 20} y={ayBase + 5} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={16}>θ</text>
      <text x={ax0 - 14} y={ayTop - 2} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={16}>f</text>
      {ticks.map((tk, i) => {
        const x = thetaToX(tk.t, gr);
        return (
          <g key={i}>
            <line x1={x} y1={ayBase} x2={x} y2={ayBase + 5} stroke="var(--chalk-300)" strokeWidth={1}/>
            <text x={x} y={ayBase + 20} textAnchor="middle" fill="var(--chalk-300)"
                  fontFamily="var(--font-mono)" fontSize={11}>{tk.label}</text>
          </g>
        );
      })}
      {showRefs && (
        <g>
          <line x1={ax0} y1={gToY(2, gr)} x2={ax1} y2={gToY(2, gr)}
                stroke="var(--rose-400)" strokeWidth={1} strokeDasharray="4 5" opacity={0.7}/>
          <text x={ax1 + 6} y={gToY(2, gr) + 4} fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize={11}>max 2</text>
          <line x1={ax0} y1={gToY(1, gr)} x2={ax1} y2={gToY(1, gr)}
                stroke="var(--teal-400)" strokeWidth={1} strokeDasharray="4 5" opacity={0.7}/>
          <text x={ax1 + 6} y={gToY(1, gr) + 4} fill="var(--teal-400)"
                fontFamily="var(--font-mono)" fontSize={11}>min 1</text>
        </g>
      )}
    </g>
  );
}

const LEVELS = [0.5, 1.0, 1.5, 2.0, 2.5];

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="constrained extrema"
      title="Extrema on a Circle: Sweep the Boundary"
      duration={SCENE_DURATION}
      introEnd={3.74}
      introCaption="Stuck on a circle — where is f biggest?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.74} end={15.76}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={15.76} end={26.88}>
        <SweepBeat/>
      </Sprite>

      <Sprite start={26.88} end={37.24}>
        <TangencyBeat/>
      </Sprite>

      <Sprite start={37.24} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup ───────────────────────────────────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const P = G.plane;
  const circ = toSvg(0, 0, P.ox, P.oy, P.u);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={0.5}>
          <ContourPaths ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax} levels={LEVELS}/>
        </SvgFadeIn>
        {/* Unit circle constraint */}
        <SvgFadeIn duration={0.6} delay={1.0}>
          <circle cx={circ.sx} cy={circ.sy} r={P.u} fill="none"
                  stroke="var(--teal-400)" strokeWidth={2.6}/>
          <text x={circ.sx + P.u * 0.72} y={circ.sy - P.u * 0.72} fill="var(--teal-400)"
                fontFamily="var(--font-mono)" fontSize={13}>x² + y² = 1</text>
        </SvgFadeIn>
        {/* Empty g-axes ready to fill */}
        <SvgFadeIn duration={0.5} delay={2.6}>
          <GraphFrame gr={G.graph} showRefs={true}/>
        </SvgFadeIn>
      </svg>

      {/* Function + parametrisation captions */}
      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          position: 'absolute',
          ...(portrait ? { left: 56, right: 56, top: 710, textAlign: 'center' } : { left: 56, top: 150 }),
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 24, color: 'var(--chalk-100)',
        }}>
        f(x, y) = x² + 2y²
      </FadeUp>
      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{
          position: 'absolute',
          ...(portrait ? { left: 56, right: 56, top: 752, textAlign: 'center' } : { left: 56, top: 188 }),
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 17, color: 'var(--amber-300)',
        }}>
        (x, y) = (cos θ, sin θ)
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Sweep (GENUINE MOTION) ──────────────────────────────────────────
function SweepBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);
  const P = G.plane, gr = G.graph;

  const sweepDelay = 0.6;
  const sweepDur = 12.5;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const theta = s * TAU;

  const pt = toSvg(Math.cos(theta), Math.sin(theta), P.ox, P.oy, P.u);
  const origin = toSvg(0, 0, P.ox, P.oy, P.u);
  const fVal = gOfTheta(theta);

  // Partial g(θ) trace.
  const SAMPLES = 140;
  const tPts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const t = (i / SAMPLES) * theta;
    tPts.push(`${i === 0 ? 'M' : 'L'} ${thetaToX(t, gr).toFixed(1)} ${gToY(gOfTheta(t), gr).toFixed(1)}`);
  }
  const traceD = tPts.join(' ');
  const markX = thetaToX(theta, gr), markY = gToY(fVal, gr);

  // Drop-line linking circle value to the graph marker reads as "this is f here".
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax}/>
        <ContourPaths ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax} levels={LEVELS} opacity={0.26}/>
        <circle cx={origin.sx} cy={origin.sy} r={P.u} fill="none" stroke="var(--teal-400)" strokeWidth={2.4} opacity={0.85}/>

        {/* extrema dots on the circle */}
        {[[0, 1], [0, -1], [1, 0], [-1, 0]].map(([x, y], i) => {
          const e = toSvg(x, y, P.ox, P.oy, P.u);
          const isMax = Math.abs(y) > 0.5;
          return <circle key={i} cx={e.sx} cy={e.sy} r={4} opacity={0.55}
                         fill={isMax ? 'var(--rose-400)' : 'var(--teal-400)'}/>;
        })}

        {/* radial spoke + orbiting point */}
        <line x1={origin.sx} y1={origin.sy} x2={pt.sx} y2={pt.sy}
              stroke="var(--amber-400)" strokeWidth={1.6} opacity={0.6}/>
        <circle cx={pt.sx} cy={pt.sy} r={7} fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.6}/>

        {/* g(θ) graph */}
        <GraphFrame gr={gr} showRefs={true}/>
        <path d={traceD} fill="none" stroke="var(--amber-400)" strokeWidth={2.6} strokeLinecap="round"/>
        <circle cx={markX} cy={markY} r={5.5} fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={2}/>

        {/* readout */}
        <text x={gr.x0} y={gr.topY - 18} fill="var(--amber-300)"
              fontFamily="var(--font-mono)" fontSize={14}>
          θ = {(theta).toFixed(2)}   f = {fVal.toFixed(2)}
        </text>
      </svg>
    </>
  );
}

// ─── Beat 4: Tangency / Lagrange ─────────────────────────────────────────────
function TangencyBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const P = G.plane, gr = G.graph;
  const origin = toSvg(0, 0, P.ox, P.oy, P.u);

  // The two tangent level curves: f = 1 (through the minima) and f = 2 (maxima).
  const minLevel = levelEllipsePath(1, P.ox, P.oy, P.u);
  const maxLevel = levelEllipsePath(2, P.ox, P.oy, P.u);

  // ∇f = (2x, 4y) at the four extrema, drawn radially (scaled to a fixed length).
  const grads = [[0, 1], [0, -1], [1, 0], [-1, 0]].map(([x, y]) => {
    const [gx, gy] = [2 * x, 4 * y];
    const m = Math.hypot(gx, gy);
    const L = 0.55; // arrow length in data units
    const tip = toSvg(x + gx / m * L, y + gy / m * L, P.ox, P.oy, P.u);
    const base = toSvg(x, y, P.ox, P.oy, P.u);
    const isMax = Math.abs(y) > 0.5;
    return { base, tip, isMax, x, y };
  });

  const fullTrace = (() => {
    const SAMPLES = 160, pts = [];
    for (let i = 0; i <= SAMPLES; i++) {
      const t = (i / SAMPLES) * TAU;
      pts.push(`${i === 0 ? 'M' : 'L'} ${thetaToX(t, gr).toFixed(1)} ${gToY(gOfTheta(t), gr).toFixed(1)}`);
    }
    return pts.join(' ');
  })();

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax}/>
        <circle cx={origin.sx} cy={origin.sy} r={P.u} fill="none" stroke="var(--teal-400)" strokeWidth={2.4}/>

        {/* tangent level curves */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <path d={maxLevel} fill="none" stroke="var(--rose-300)" strokeWidth={1.8} opacity={0.8}/>
          <path d={minLevel} fill="none" stroke="var(--teal-400)" strokeWidth={1.8} opacity={0.8}/>
        </SvgFadeIn>

        {/* ∇f radial arrows */}
        <SvgFadeIn duration={0.5} delay={1.8}>
          {grads.map((g, i) => (
            <Arrow key={i} ax={g.base.sx} ay={g.base.sy} bx={g.tip.sx} by={g.tip.sy}
                   color={g.isMax ? 'var(--rose-400)' : 'var(--amber-400)'}/>
          ))}
        </SvgFadeIn>

        {/* extrema markers */}
        {grads.map((g, i) => (
          <circle key={`m${i}`} cx={g.base.sx} cy={g.base.sy} r={5.5}
                  fill="var(--chalk-100)" stroke={g.isMax ? 'var(--rose-400)' : 'var(--teal-400)'} strokeWidth={2}/>
        ))}

        {/* full g(θ) curve with extrema marked */}
        <GraphFrame gr={gr} showRefs={true}/>
        <path d={fullTrace} fill="none" stroke="var(--amber-400)" strokeWidth={2.4} opacity={0.85}/>
        {[Math.PI / 2, 3 * Math.PI / 2].map((t, i) => (
          <circle key={`gx${i}`} cx={thetaToX(t, gr)} cy={gToY(2, gr)} r={4.5} fill="var(--rose-400)"/>
        ))}
        {[0, Math.PI, TAU].map((t, i) => (
          <circle key={`gn${i}`} cx={thetaToX(t, gr)} cy={gToY(1, gr)} r={4.5} fill="var(--teal-400)"/>
        ))}
      </svg>

      <FadeUp duration={0.6} delay={2.6} distance={12}
        style={{
          position: 'absolute',
          ...(portrait ? { left: 56, right: 56, top: 712, textAlign: 'center' }
                       : { left: '50%', top: 92, transform: 'translateX(-50%)', textAlign: 'center' }),
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 30, color: 'var(--amber-300)',
        }}>
        ∇f = λ∇g
      </FadeUp>
      <FadeUp duration={0.5} delay={3.3} distance={10}
        style={{
          position: 'absolute',
          ...(portrait ? { left: 56, right: 56, top: 754, textAlign: 'center' }
                       : { left: '50%', top: 134, transform: 'translateX(-50%)', textAlign: 'center' }),
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: portrait ? '34ch' : '42ch', lineHeight: 1.45,
        }}>
        contour grazes the circle → gradient runs along the radius
      </FadeUp>
    </>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────────
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
        boundary optimisation
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 27 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '21ch' : '42ch', lineHeight: 1.25 }}>
        Parametrise the curve — <span style={{ color: 'var(--amber-300)' }}>two variables become one.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
                 color: 'var(--amber-300)' }}>
        g(θ) = 1 + sin²θ
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
