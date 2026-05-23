// Partial Derivatives: Slice the Surface, Read the Slope — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). The geometric meaning of a
// partial. Holding y fixed at y₀ leaves a one-variable curve x ↦ f(x, y₀);
// the partial f_x(x₀, y₀) is the ordinary derivative of that curve at x₀.
//
// Test function (saddle so the slice family varies dramatically with y):
//   f(x, y) = 0.5 x² − 0.5 y² + 0.3 x y + 0.6
// Partials:
//   f_x = x + 0.3 y
//   f_y = -y + 0.3 x
// We render the surface as a projected wireframe in the spirit of a chalk
// sketch (no real 3D library — orthographic axonometric projection of a grid).
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 4.7   Manimo hook
//    4.7–16   Surface + slicing plane y = y₀ + slice curve highlighted on it
//   16–28     Slice curve flattened to its own xy axes + tangent at x₀ + def
//   28–40     Scrub the slice plane — slice curve + f_x readout update live (GENUINE MOTION)
//   40–end    Takeaway
//
// Colour discipline:
//   chalk-300  axes, surface grid (dimmed)
//   violet-400 surface wireframe (primary)
//   teal-400   slicing plane (the "freeze y" gesture)
//   amber-400  slice curve, slice graph
//   rose-400   tangent line at the chosen point + live readout
//   amber-300  takeaway accent

const SCENE_DURATION = 49;

const NARRATION = [
  /*  0.0– 4.7  */ 'What does a partial derivative actually mean? Freeze one variable, and slice.',
  /*  4.7–16   */ 'Here is a surface. To compute the partial of f with respect to x at a point, hold y fixed at the y-value of that point. That horizontal plane cuts the surface in a curve.',
  /* 16  –28   */ 'Look at the slice on its own. It is a curve in one variable — height versus x — and the partial of f with respect to x is just the slope of that curve at the point.',
  /* 28  –40   */ 'Now scrub the slice plane up and down. The slice curve changes shape and the slope at the point changes with it. The partial f sub x is itself a function of where you stand.',
  /* 40  –end  */ 'Partial of f with respect to x: freeze y, slice, read the slope. The other partial just swaps which axis you freeze.',
];

const NARRATION_AUDIO = 'audio/partial-derivative-as-slice/scene.mp3';

// ─── The function ─────────────────────────────────────────────────────────
function fxy(x, y) { return 0.5 * x * x - 0.5 * y * y + 0.3 * x * y + 0.6; }
function fx(x, y)  { return x + 0.3 * y; }

// Domain of the rendered surface.
const XMIN = -2, XMAX = 2;
const YMIN = -2, YMAX = 2;

// Sample point.
const X0 = 0.8;
const Y0_INIT = -0.6;

// Orthographic axonometric projection — simulates a 3D wireframe with
// constant "camera" tilt. Returns SVG (sx, sy) for a math point (x, y, z).
function project(x, y, z, geom) {
  // x → right, y → into screen (slight tilt), z → up.
  const angX = geom.angX, angY = geom.angY;
  const sx = geom.ox + x * geom.ux * Math.cos(angX) - y * geom.uy * Math.cos(angY);
  const sy = geom.oy - z * geom.uz + x * geom.ux * Math.sin(angX) + y * geom.uy * Math.sin(angY);
  return { sx, sy };
}

// Geometry per aspect (the surface scene + the slicing plane).
function surfaceGeom(portrait) {
  return portrait
    ? { ox: 360, oy: 540, ux: 105, uy: 95, uz: 130,
        angX: 0.18, angY: -0.55,
        vbW: 720, vbH: 1100,
        panelLeft: 50, panelBottom: 140, panelW: 620 }
    : { ox: 420, oy: 460, ux: 105, uy: 95, uz: 130,
        angX: 0.18, angY: -0.55,
        vbW: 1280, vbH: 720,
        panelRight: 64, panelTop: 160, panelW: 420 };
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined }
    : { right, top };
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

// Build a path string for a sampled curve in (x, y, z) space using a
// projection function. Returns SVG "M ... L ..." commands.
function projectedPath(samples, proj) {
  const pts = samples.map(([x, y, z]) => proj(x, y, z));
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

// ─── Surface wireframe (axonometric) ─────────────────────────────────────
// Draws constant-y curves (rows) and constant-x curves (cols).
function SurfaceWireframe({ geom, opacity = 0.55 }) {
  const proj = (x, y, z) => project(x, y, z, geom);
  const N = 18;        // samples along each curve
  const ROWS = 9;      // number of y-values
  const COLS = 9;      // number of x-values

  const rows = [];
  for (let r = 0; r < ROWS; r++) {
    const y = YMIN + (YMAX - YMIN) * (r / (ROWS - 1));
    const samples = [];
    for (let i = 0; i <= N; i++) {
      const x = XMIN + (XMAX - XMIN) * (i / N);
      samples.push([x, y, fxy(x, y)]);
    }
    rows.push(projectedPath(samples, proj));
  }
  const cols = [];
  for (let c = 0; c < COLS; c++) {
    const x = XMIN + (XMAX - XMIN) * (c / (COLS - 1));
    const samples = [];
    for (let i = 0; i <= N; i++) {
      const y = YMIN + (YMAX - YMIN) * (i / N);
      samples.push([x, y, fxy(x, y)]);
    }
    cols.push(projectedPath(samples, proj));
  }
  return (
    <g opacity={opacity}>
      {rows.map((d, i) => (
        <path key={`r${i}`} d={d} fill="none"
              stroke="var(--violet-400)" strokeWidth={1.2}
              strokeLinejoin="round" opacity={0.85}/>
      ))}
      {cols.map((d, i) => (
        <path key={`c${i}`} d={d} fill="none"
              stroke="var(--violet-400)" strokeWidth={1.0}
              strokeLinejoin="round" opacity={0.55}/>
      ))}
    </g>
  );
}

// Slicing plane y = y0 — drawn as a translucent parallelogram spanning
// (XMIN..XMAX) × (some z range), at constant y.
function SlicingPlane({ geom, y0, opacity = 0.20 }) {
  const proj = (x, y, z) => project(x, y, z, geom);
  // Z range to cover the visible surface at this y plus some margin.
  const zLo = -0.6, zHi = 2.4;
  const a = proj(XMIN, y0, zLo);
  const b = proj(XMAX, y0, zLo);
  const c = proj(XMAX, y0, zHi);
  const d = proj(XMIN, y0, zHi);
  const path = `M ${a.sx.toFixed(1)} ${a.sy.toFixed(1)} L ${b.sx.toFixed(1)} ${b.sy.toFixed(1)} L ${c.sx.toFixed(1)} ${c.sy.toFixed(1)} L ${d.sx.toFixed(1)} ${d.sy.toFixed(1)} Z`;
  return (
    <g>
      <path d={path} fill="var(--teal-400)" opacity={opacity}
            stroke="var(--teal-400)" strokeOpacity={0.7} strokeWidth={1.3}/>
    </g>
  );
}

// The slice curve f(x, y0) drawn in 3D on the surface as a bright ribbon.
function SliceCurve3D({ geom, y0 }) {
  const proj = (x, y, z) => project(x, y, z, geom);
  const N = 80;
  const samples = [];
  for (let i = 0; i <= N; i++) {
    const x = XMIN + (XMAX - XMIN) * (i / N);
    samples.push([x, y0, fxy(x, y0)]);
  }
  const d = projectedPath(samples, proj);
  return (
    <path d={d} fill="none"
          stroke="var(--amber-400)" strokeWidth={3.2}
          strokeLinecap="round" strokeLinejoin="round"/>
  );
}

// Marker at the sample point (x0, y0, f(x0, y0)) on the surface.
function PointMark3D({ geom, x, y, color = 'var(--chalk-100)', label }) {
  const proj = (xx, yy, zz) => project(xx, yy, zz, geom);
  const P = proj(x, y, fxy(x, y));
  return (
    <g>
      <circle cx={P.sx} cy={P.sy} r={5}
              fill={color} stroke="var(--chalk-200)" strokeWidth={1}/>
      {label && (
        <text x={P.sx + 10} y={P.sy - 12}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={18}>{label}</text>
      )}
    </g>
  );
}

// 3D axes through the origin: x, y, z. Short labelled arms.
function AxesTriad({ geom }) {
  const proj = (x, y, z) => project(x, y, z, geom);
  const O = proj(0, 0, 0);
  const XE = proj(XMAX + 0.4, 0, 0);
  const YE = proj(0, YMAX + 0.4, 0);
  const ZE = proj(0, 0, 2.6);
  function axis(p, label, color) {
    return (
      <g>
        <line x1={O.sx} y1={O.sy} x2={p.sx} y2={p.sy}
              stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.85}/>
        <text x={p.sx + 6} y={p.sy + 5}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={18}>{label}</text>
      </g>
    );
  }
  return (
    <g>
      {axis(XE, 'x', 'var(--chalk-200)')}
      {axis(YE, 'y', 'var(--chalk-200)')}
      {axis(ZE, 'z', 'var(--chalk-200)')}
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="what a partial actually is"
      title="Slice the Surface, Read the Slope"
      duration={SCENE_DURATION}
      introEnd={5.91}
      introCaption="Freeze one variable. Slice. Read the slope."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.91} end={17.46}>
        <SurfaceAndPlaneBeat/>
      </Sprite>

      <Sprite start={17.46} end={28.02}>
        <SliceCurveZoomBeat/>
      </Sprite>

      <Sprite start={28.02} end={38.59}>
        <ScrubSlicePlaneBeat/>
      </Sprite>

      <Sprite start={38.59} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: surface + slicing plane ─────────────────────────────────────
function SurfaceAndPlaneBeat() {
  const portrait = usePortrait();
  const G = surfaceGeom(portrait);
  const { localTime } = useSprite();

  const showPlane = localTime > 1.5;
  const showSlice = localTime > 3.0;
  const showPoint = localTime > 4.5;

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <SvgFadeIn duration={0.5} delay={0.2}>
          <AxesTriad geom={G}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.7} delay={0.4}>
          <SurfaceWireframe geom={G}/>
        </SvgFadeIn>

        {showPlane && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <SlicingPlane geom={G} y0={Y0_INIT}/>
          </SvgFadeIn>
        )}

        {showSlice && (
          <SvgFadeIn duration={0.5} delay={0.0}>
            <SliceCurve3D geom={G} y0={Y0_INIT}/>
          </SvgFadeIn>
        )}

        {showPoint && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <PointMark3D geom={G} x={X0} y={Y0_INIT} label="P"/>
          </SvgFadeIn>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the gesture
          </FadeUp>
          <FadeUp duration={0.55} delay={1.8} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--chalk-100)', lineHeight: 1.35 }}>
            Hold <span style={{ color: 'var(--teal-400)' }}>y = y₀</span> fixed.
          </FadeUp>
          <FadeUp duration={0.55} delay={3.2} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--amber-400)', lineHeight: 1.35 }}>
            The plane cuts the surface <br/>in a one-variable curve.
          </FadeUp>
          <FadeUp duration={0.5} delay={4.8} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.4 }}>
            f(x, y) = 0.5 x² − 0.5 y² + 0.3 xy + 0.6
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the gesture
          </FadeUp>
          <FadeUp duration={0.55} delay={1.8} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.35, marginTop: 4 }}>
            Hold <span style={{ color: 'var(--teal-400)' }}>y = y₀</span> fixed.
          </FadeUp>
          <FadeUp duration={0.55} delay={3.2} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-400)', lineHeight: 1.35 }}>
            The plane cuts the surface in a <br/>one-variable curve.
          </FadeUp>
          <FadeUp duration={0.5} delay={4.8} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4, marginTop: 6 }}>
            f(x, y) = 0.5 x² − 0.5 y² + 0.3 xy + 0.6
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: slice curve flattened — tangent line + definition ───────────
function SliceCurveZoomBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // 2D axes for the slice — height z = f(x, y0) vs x.
  const G = portrait
    ? { ox: 360, oy: 530, ux: 130, uy: 100, vbW: 720, vbH: 920,
        xMin: -2.2, xMax: 2.2, yMin: -0.4, yMax: 2.4,
        panelLeft: 50, panelBottom: 200, panelW: 620 }
    : { ox: 400, oy: 440, ux: 130, uy: 110, vbW: 1280, vbH: 720,
        xMin: -2.2, xMax: 2.2, yMin: -0.4, yMax: 2.4,
        panelRight: 64, panelTop: 170, panelW: 440 };

  function toSvg(x, y) { return { sx: G.ox + x * G.ux, sy: G.oy - y * G.uy }; }

  // Slice curve at y = Y0_INIT.
  const y0 = Y0_INIT;
  const N = 180;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = G.xMin + (G.xMax - G.xMin) * (i / N);
    pts.push(toSvg(x, fxy(x, y0)));
  }
  const curveD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');

  // Point + tangent.
  const Pt = toSvg(X0, fxy(X0, y0));
  const slope = fx(X0, y0);
  const tanLeft = toSvg(X0 - 1.2, fxy(X0, y0) - slope * 1.2);
  const tanRight = toSvg(X0 + 1.2, fxy(X0, y0) + slope * 1.2);

  // Animation: curve draws first, then point pulses, then tangent draws.
  const curveT = clamp((localTime - 0.4) / 1.4, 0, 1);
  const showPoint = localTime > 1.5;
  const tanFrac = clamp((localTime - 2.2) / 1.0, 0, 1);
  const CURVE_DASH = 900, TAN_DASH = 500;

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={toSvg(G.xMin, 0).sx} y1={toSvg(G.xMin, 0).sy}
                x2={toSvg(G.xMax, 0).sx} y2={toSvg(G.xMax, 0).sy}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.65}/>
          <line x1={toSvg(0, G.yMin).sx} y1={toSvg(0, G.yMin).sy}
                x2={toSvg(0, G.yMax).sx} y2={toSvg(0, G.yMax).sy}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.65}/>
          <text x={toSvg(G.xMax, 0).sx + 10} y={toSvg(G.xMax, 0).sy + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>x</text>
          <text x={toSvg(0, G.yMax).sx - 18} y={toSvg(0, G.yMax).sy - 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>z</text>
        </SvgFadeIn>

        {/* Curve. */}
        <path d={curveD} fill="none"
              stroke="var(--amber-400)" strokeWidth={3.2}
              strokeLinecap="round"
              strokeDasharray={CURVE_DASH} strokeDashoffset={CURVE_DASH * (1 - curveT)}/>

        {/* y₀ label — pin to the rightmost in-bounds curve point. */}
        {curveT > 0.5 && (() => {
          const labelX = G.xMax - 0.15;
          const labelY = Math.min(fxy(labelX, y0), G.yMax - 0.15);
          const Lp = toSvg(labelX, labelY);
          return (
            <SvgFadeIn duration={0.4} delay={0.0}>
              <text x={Lp.sx + 8} y={Lp.sy + 4}
                    fill="var(--amber-400)" fontFamily="var(--font-mono)" fontSize={13}>
                y = {y0.toFixed(1)}
              </text>
            </SvgFadeIn>
          );
        })()}

        {/* Point. */}
        {showPoint && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <circle cx={Pt.sx} cy={Pt.sy} r={6}
                    fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
            <text x={Pt.sx + 12} y={Pt.sy - 14}
                  fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={13}>
              x₀ = {X0.toFixed(1)}
            </text>
          </SvgFadeIn>
        )}

        {/* Tangent line. */}
        {tanFrac > 0 && (
          <path d={`M ${tanLeft.sx.toFixed(1)} ${tanLeft.sy.toFixed(1)} L ${tanRight.sx.toFixed(1)} ${tanRight.sy.toFixed(1)}`}
                fill="none" stroke="var(--rose-400)" strokeWidth={2.8}
                strokeLinecap="round"
                strokeDasharray={TAN_DASH} strokeDashoffset={TAN_DASH * (1 - tanFrac)}/>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the slice on its own
          </FadeUp>
          <FadeUp duration={0.55} delay={1.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 19, color: 'var(--chalk-100)', lineHeight: 1.35 }}>
            <span style={{ color: 'var(--amber-400)' }}>x ↦ f(x, y₀)</span> is now <br/>just a one-variable curve.
          </FadeUp>
          <FadeUp duration={0.55} delay={3.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 19, color: 'var(--rose-400)' }}>
            f<sub>x</sub>(x₀, y₀) = slope at P
          </FadeUp>
          <FadeUp duration={0.5} delay={4.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                     color: 'var(--chalk-300)', lineHeight: 1.45, maxWidth: '40ch' }}>
            f<sub>x</sub>(x₀, y₀) = lim<sub>h→0</sub> (f(x₀+h, y₀) − f(x₀, y₀)) / h
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the slice on its own
          </FadeUp>
          <FadeUp duration={0.55} delay={1.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 23, color: 'var(--chalk-100)', lineHeight: 1.35, marginTop: 4 }}>
            <span style={{ color: 'var(--amber-400)' }}>x ↦ f(x, y₀)</span> is now <br/>a one-variable curve.
          </FadeUp>
          <FadeUp duration={0.55} delay={3.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--rose-400)' }}>
            f<sub>x</sub>(x₀, y₀) = slope at P
          </FadeUp>
          <FadeUp duration={0.5} delay={4.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-300)', lineHeight: 1.45, maxWidth: '34ch', marginTop: 6 }}>
            f<sub>x</sub>(x₀, y₀) = lim<sub>h→0</sub> (f(x₀+h, y₀) − f(x₀, y₀)) / h
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: scrub the slice plane — live f_x readout ────────────────────
function ScrubSlicePlaneBeat() {
  const portrait = usePortrait();
  const G = surfaceGeom(portrait);
  const { localTime, duration: spriteDur } = useSprite();

  // Scrub y0 across [YMIN+0.3, YMAX-0.3] over the beat (with a small pre-roll
  // so the user reads the first frame).
  const preroll = 0.8;
  const sweepDur = Math.max(spriteDur - preroll - 1.2, 6);
  const t = clamp((localTime - preroll) / sweepDur, 0, 1);
  // Triangle wave so y0 sweeps down then back up.
  const tri = 1 - Math.abs(2 * t - 1);
  const y0 = (YMIN + 0.4) + (YMAX - 0.4 - (YMIN + 0.4)) * tri;

  // Live slope at (X0, y0).
  const slope = fx(X0, y0);
  // Visible value of the surface at the point (height of the marker).
  const z0 = fxy(X0, y0);

  // Smaller secondary slice graph in the corner showing the curve f(·, y0)
  // and the tangent at x0.
  const SG = portrait
    ? { ox: 460, oy: 1010, ux: 60, uy: 50, vbW: 720, vbH: 1100,
        xMin: -2.2, xMax: 2.2 }
    : { ox: 1050, oy: 540, ux: 60, uy: 50, vbW: 1280, vbH: 720,
        xMin: -2.2, xMax: 2.2 };

  function toSvg2(x, y) { return { sx: SG.ox + x * SG.ux, sy: SG.oy - y * SG.uy }; }
  const N = 80;
  const sliceSamples = [];
  for (let i = 0; i <= N; i++) {
    const x = SG.xMin + (SG.xMax - SG.xMin) * (i / N);
    sliceSamples.push(toSvg2(x, fxy(x, y0)));
  }
  const sliceD = sliceSamples.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
  const PtMini = toSvg2(X0, z0);
  const tanL = toSvg2(X0 - 0.8, z0 - slope * 0.8);
  const tanR = toSvg2(X0 + 0.8, z0 + slope * 0.8);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <AxesTriad geom={G}/>
        <SurfaceWireframe geom={G} opacity={0.38}/>
        <SlicingPlane geom={G} y0={y0}/>
        <SliceCurve3D geom={G} y0={y0}/>
        <PointMark3D geom={G} x={X0} y={y0} label="P"/>

        {/* Secondary slice graph axes. */}
        <g>
          {/* Frame */}
          <rect x={toSvg2(SG.xMin - 0.2, 2.4).sx} y={toSvg2(SG.xMin - 0.2, 2.4).sy}
                width={(SG.xMax - SG.xMin + 0.4) * SG.ux}
                height={(2.4 - (-0.4)) * SG.uy}
                fill="rgba(0,0,0,0.45)" stroke="rgba(232,220,193,0.10)" strokeWidth={1}
                rx={8}/>
          <line x1={toSvg2(SG.xMin, 0).sx} y1={toSvg2(SG.xMin, 0).sy}
                x2={toSvg2(SG.xMax, 0).sx} y2={toSvg2(SG.xMax, 0).sy}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.6}/>
          <line x1={toSvg2(0, -0.4).sx} y1={toSvg2(0, -0.4).sy}
                x2={toSvg2(0, 2.4).sx} y2={toSvg2(0, 2.4).sy}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.6}/>
          {/* Slice curve. */}
          <path d={sliceD} fill="none"
                stroke="var(--amber-400)" strokeWidth={2.2} strokeLinecap="round"/>
          {/* Tangent. */}
          <line x1={tanL.sx} y1={tanL.sy} x2={tanR.sx} y2={tanR.sy}
                stroke="var(--rose-400)" strokeWidth={2.2} strokeLinecap="round"/>
          {/* Point. */}
          <circle cx={PtMini.sx} cy={PtMini.sy} r={3.5}
                  fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={0.8}/>
          <text x={toSvg2(SG.xMin, 2.4).sx + 8} y={toSvg2(SG.xMin, 2.4).sy + 14}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={10}
                letterSpacing="0.06em">slice f(·, y₀)</text>
        </g>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW} top={null}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            scrub y₀
          </FadeUp>

          <div style={{ display: 'flex', gap: 18, fontFamily: 'var(--font-mono)',
                        flexWrap: 'wrap', alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>y₀</div>
              <div style={{ fontSize: 24, color: 'var(--teal-400)' }}>
                {y0.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>f<sub>x</sub>(x₀, y₀)</div>
              <div style={{ fontSize: 24, color: 'var(--rose-400)' }}>
                {slope >= 0 ? '+' : ''}{slope.toFixed(2)}
              </div>
            </div>
          </div>

          <FadeUp duration={0.5} delay={1.2} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.4 }}>
            f<sub>x</sub> = x + 0.3 y — depends on y₀.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            scrub y₀ — watch the slope
          </FadeUp>

          <div style={{ display: 'flex', gap: 26, fontFamily: 'var(--font-mono)',
                        marginTop: 2, alignItems: 'baseline' }}>
            <div>
              <div style={{ fontSize: 12, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>y₀</div>
              <div style={{ fontSize: 30, color: 'var(--teal-400)' }}>
                {y0.toFixed(2)}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, color: 'var(--chalk-300)',
                            letterSpacing: '0.10em' }}>f<sub>x</sub>(x₀, y₀)</div>
              <div style={{ fontSize: 30, color: 'var(--rose-400)' }}>
                {slope >= 0 ? '+' : ''}{slope.toFixed(2)}
              </div>
            </div>
          </div>

          <FadeUp duration={0.5} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.45, marginTop: 10 }}>
            f<sub>x</sub> = x + 0.3 y — its value depends on where you stand.
          </FadeUp>

          <FadeUp duration={0.5} delay={2.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                     color: 'var(--chalk-300)', letterSpacing: '0.06em', maxWidth: '34ch',
                     lineHeight: 1.45 }}>
            x₀ = {X0.toFixed(2)} held fixed; y₀ slides.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                 color: 'var(--amber-300)', letterSpacing: '0.18em',
                 textTransform: 'uppercase' }}>
        the recipe
      </FadeUp>

      <FadeUp duration={0.8} delay={0.4} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 46, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch', lineHeight: 1.2,
        }}>
        Freeze one variable. <br/>
        <span style={{ color: 'var(--amber-300)' }}>Take the ordinary derivative.</span>
      </FadeUp>

      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28, color: 'var(--chalk-200)',
          maxWidth: portrait ? '24ch' : '42ch', lineHeight: 1.35,
        }}>
        That is what f<sub>x</sub> and f<sub>y</sub> are.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 12 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        slice with y = const → f<sub>x</sub>;  slice with x = const → f<sub>y</sub>
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
