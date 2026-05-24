// The Saddle Point: Up One Way, Down the Other — Manimo lesson scene.
// Chapter 6 of mat2b (Ekstremalpunkter). At the origin of
//   z = f(x, y) = x² − y²
// the gradient ∇f = (2x, −2y) vanishes, so it is a critical point — yet it is
// neither a max nor a min. Slice the surface through the origin along the
// direction (cos φ, sin φ): the cross-section is
//   z(r) = r²·(cos²φ − sin²φ) = r²·cos(2φ)
// which morphs from an upward parabola (a valley, φ = 0) through flat
// (φ = 45°) to a downward parabola (a ridge, φ = 90°). Opposite curvature in
// the two principal directions ⇒ Hesse eigenvalues +2, −2 of opposite sign ⇒
// D = f_xx·f_yy − f_xy² = −4 < 0 ⇒ saddle.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 5     Manimo hook
//    5–15     Setup — hyperbolic contours + critical point at origin
//   15–31     Rotate the slice; cross-section morphs valley→flat→ridge (GENUINE MOTION)
//   31–40     Classify — opposite curvature, eigenvalues, discriminant
//   40–46     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  level curves, asymptotes, grey body text
//   teal-400   the cutting slice
//   amber-400  cross-section valley (up), payoff
//   rose-400   cross-section ridge (down), critical-point marker

const SCENE_DURATION = 50;

const NARRATION = [
  /*  0– 5  */ 'The ground is perfectly flat here, yet it is neither a hilltop nor the bottom of a valley.',
  /*  5–15  */ 'Take the surface z equals x squared minus y squared. At the origin the gradient is zero, so it is a critical point — but the surface curves up along one axis and down along the other.',
  /* 15–31  */ 'Spin a cutting plane through the centre. Along one direction the slice is a valley that curves upward; rotate by ninety degrees and it becomes a ridge that curves downward; halfway between, the slice is perfectly flat.',
  /* 31–40  */ 'Opposite curvature in the two principal directions means the Hesse eigenvalues have opposite signs, and the discriminant is negative. That is the signature of a saddle.',
  /* 40–46  */ 'A saddle point is a minimum one way and a maximum the other — so a zero gradient alone never guarantees an extremum.',
];

const NARRATION_AUDIO = 'audio/the-saddle-point/scene.mp3';

// ─── Function ────────────────────────────────────────────────────────────────
function fOf(x, y) { return x * x - y * y; }

// ─── Geometry ────────────────────────────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? {
        plane: { ox: 360, oy: 424, u: 150, xMax: 2.0, yMax: 2.0 },
        graph: { cx: 360, cy: 1006, rscale: 130, zscale: 27, R: 2.0 },
      }
    : {
        plane: { ox: 352, oy: 372, u: 118, xMax: 2.3, yMax: 2.3 },
        graph: { cx: 952, cy: 372, rscale: 92, zscale: 33, R: 2.1 },
      };
}

function toSvg(x, y, ox, oy, u) { return { sx: ox + x * u, sy: oy - y * u }; }

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

// Marching-squares contours of z = x² − y² for nonzero levels (hyperbolas).
function ContourPaths({ ox, oy, u, xMax, yMax, levels, opacity = 0.4 }) {
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

// Asymptotes y = ±x where z = 0.
function Asymptotes({ ox, oy, u, xMax }) {
  const m = Math.min(xMax, xMax);
  const aP1 = toSvg(-m, -m, ox, oy, u), aP2 = toSvg(m, m, ox, oy, u);
  const bP1 = toSvg(-m, m, ox, oy, u), bP2 = toSvg(m, -m, ox, oy, u);
  return (
    <g>
      <line x1={aP1.sx} y1={aP1.sy} x2={aP2.sx} y2={aP2.sy}
            stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="5 6" opacity={0.5}/>
      <line x1={bP1.sx} y1={bP1.sy} x2={bP2.sx} y2={bP2.sy}
            stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="5 6" opacity={0.5}/>
    </g>
  );
}

// Cross-section graph: r-axis (horizontal), z-axis (vertical), parabola z=r²cos2φ.
function CrossSection({ gr, phi }) {
  const c2 = Math.cos(2 * phi);
  const R = gr.R;
  const SAMPLES = 64;
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const r = -R + (2 * R) * (i / SAMPLES);
    const z = r * r * c2;
    pts.push(`${i === 0 ? 'M' : 'L'} ${(gr.cx + r * gr.rscale).toFixed(1)} ${(gr.cy - z * gr.zscale).toFixed(1)}`);
  }
  const curveColor = c2 > 0.06 ? 'var(--amber-400)' : (c2 < -0.06 ? 'var(--rose-400)' : 'var(--chalk-200)');

  const axLen = R * gr.rscale + 24;
  const zTop = gr.cy - 4.6 * gr.zscale, zBot = gr.cy + 4.6 * gr.zscale;
  return (
    <g>
      {/* axes */}
      <line x1={gr.cx - axLen} y1={gr.cy} x2={gr.cx + axLen} y2={gr.cy}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.6}/>
      <line x1={gr.cx} y1={zTop} x2={gr.cx} y2={zBot}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.6}/>
      <text x={gr.cx + axLen + 8} y={gr.cy + 5} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={16}>r</text>
      <text x={gr.cx - 16} y={zTop + 4} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={16}>z</text>
      {/* cross-section curve */}
      <path d={pts.join(' ')} fill="none" stroke={curveColor} strokeWidth={3} strokeLinecap="round"/>
      {/* point at the critical value (origin of the slice) */}
      <circle cx={gr.cx} cy={gr.cy} r={4.5} fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={1.6}/>
    </g>
  );
}

const LEVELS = [-3.0, -1.5, -0.6, 0.6, 1.5, 3.0];

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="saddle points"
      title="The Saddle Point: Up One Way, Down the Other"
      duration={SCENE_DURATION}
      introEnd={5.29}
      introCaption="Flat ground — but no peak and no pit. What is this?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.29} end={17.27}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={17.27} end={30.66}>
        <RotateBeat/>
      </Sprite>

      <Sprite start={30.66} end={40.68}>
        <ClassifyBeat/>
      </Sprite>

      <Sprite start={40.68} end={SCENE_DURATION}>
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
  const o = toSvg(0, 0, P.ox, P.oy, P.u);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <SvgFadeIn duration={0.4} delay={0.2}>
          <PlaneAxes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.6} delay={0.6}>
          <Asymptotes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax}/>
          <ContourPaths ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax} levels={LEVELS}/>
        </SvgFadeIn>
        {/* hill / valley hints along the two axes */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <text x={toSvg(P.xMax * 0.62, 0, P.ox, P.oy, P.u).sx} y={toSvg(P.xMax * 0.62, 0, P.ox, P.oy, P.u).sy - 10}
                textAnchor="middle" fill="var(--amber-300)" fontFamily="var(--font-sans)" fontSize={12}>uphill</text>
          <text x={toSvg(0, P.yMax * 0.62, P.ox, P.oy, P.u).sx + 24} y={toSvg(0, P.yMax * 0.62, P.ox, P.oy, P.u).sy}
                textAnchor="middle" fill="var(--rose-300)" fontFamily="var(--font-sans)" fontSize={12}>downhill</text>
        </SvgFadeIn>
        {/* critical point */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <circle cx={o.sx} cy={o.sy} r={6} fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.6}/>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{
          position: 'absolute',
          ...(portrait ? { left: 56, right: 56, top: 760, textAlign: 'center' }
                       : { right: 90, top: 300, width: 380, textAlign: 'left' }),
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
        }}>
        z = x² − y²
      </FadeUp>
      <FadeUp duration={0.5} delay={2.9} distance={10}
        style={{
          position: 'absolute',
          ...(portrait ? { left: 56, right: 56, top: 800, textAlign: 'center' }
                       : { right: 90, top: 346, width: 380, textAlign: 'left' }),
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 19, color: 'var(--amber-300)',
        }}>
        ∇z = (2x, −2y) = 0  at the origin
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Rotate the slice (GENUINE MOTION) ───────────────────────────────
function RotateBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);
  const P = G.plane, gr = G.graph;

  const sweepDelay = 0.8;
  const sweepDur = 12.0;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const phi = s * (Math.PI / 2); // 0 → 90°
  const c2 = Math.cos(2 * phi);

  const slen = 2.0; // slice half-length in data units
  const e1 = toSvg(slen * Math.cos(phi), slen * Math.sin(phi), P.ox, P.oy, P.u);
  const e2 = toSvg(-slen * Math.cos(phi), -slen * Math.sin(phi), P.ox, P.oy, P.u);
  const sliceColor = c2 > 0.06 ? 'var(--amber-400)' : (c2 < -0.06 ? 'var(--rose-400)' : 'var(--teal-400)');

  const sign = c2 > 0.06 ? '+ valley (min)' : (c2 < -0.06 ? '− ridge (max)' : '0 flat');
  const phiDeg = (phi * 180 / Math.PI).toFixed(0);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={portrait ? 720 : 1280} height={portrait ? 1280 : 720}
           viewBox={portrait ? '0 0 720 1280' : '0 0 1280 720'}>
        <PlaneAxes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax}/>
        <Asymptotes ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax}/>
        <ContourPaths ox={P.ox} oy={P.oy} u={P.u} xMax={P.xMax} yMax={P.yMax} levels={LEVELS} opacity={0.26}/>

        {/* the rotating cutting line */}
        <line x1={e1.sx} y1={e1.sy} x2={e2.sx} y2={e2.sy}
              stroke={sliceColor} strokeWidth={3.2} strokeLinecap="round"/>
        <circle cx={toSvg(0, 0, P.ox, P.oy, P.u).sx} cy={toSvg(0, 0, P.ox, P.oy, P.u).sy} r={5}
                fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={1.6}/>

        {/* cross-section parabola */}
        <CrossSection gr={gr} phi={phi}/>

        {/* readout */}
        <text x={gr.cx} y={gr.cy - 4.6 * gr.zscale - 16} textAnchor="middle" fill="var(--amber-300)"
              fontFamily="var(--font-mono)" fontSize={14}>
          φ = {phiDeg}°   cos 2φ = {c2.toFixed(2)}   {sign}
        </text>
      </svg>
    </>
  );
}

// ─── Beat 4: Classify ────────────────────────────────────────────────────────
function ClassifyBeat() {
  const portrait = usePortrait();
  const rowStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 22 : 28, textAlign: 'center',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 26, maxWidth: portrait ? 620 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        two directions, two signs
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10} style={{ ...rowStyle, color: 'var(--chalk-200)' }}>
        along x: min (+)   ·   along y: max (−)
      </FadeUp>

      <FadeUp duration={0.6} delay={1.4} distance={12}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 24,
                 color: 'var(--amber-300)', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {'eigenvalues +2 and −2  →  D = −4 < 0'}
      </FadeUp>
      <FadeUp duration={0.5} delay={2.0} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 15,
                 color: 'var(--chalk-300)', textAlign: 'center', whiteSpace: 'nowrap' }}>
        {'D = fₓₓ f_yy − f_xy²'}
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
                 color: 'var(--rose-300)', letterSpacing: '0.04em' }}>
        opposite signs ⇒ saddle
      </FadeUp>
    </div>
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
        zero gradient is not enough
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 27 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '21ch' : '42ch', lineHeight: 1.25 }}>
        A saddle: a minimum one way, <span style={{ color: 'var(--amber-300)' }}>a maximum the other.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)' }}>
        ∇f = 0 is necessary, never sufficient
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
