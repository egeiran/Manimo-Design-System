// Partial Derivatives Are Slopes of Slices — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). Visualises the definition
// of the partial derivatives of f(x,y) by slicing the surface z = f(x,y)
// with planes of constant y (then constant x). The intersection of plane
// and surface is a one-variable curve whose slope at the chosen point is
// the partial derivative.
//
// The example function (kept simple but with a cross-term so slicing at
// different y actually changes the slope at fixed x):
//   f(x, y) = 0.4 x² + 0.3 y² + 0.25 xy + 0.4
//   ∂f/∂x  = 0.8 x + 0.25 y
//   ∂f/∂y  = 0.6 y + 0.25 x
// At (x0, y0) = (1, 1):
//   f = 0.4 + 0.3 + 0.25 + 0.4 = 1.35
//   fx = 1.05,  fy = 0.85
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 5    Manimo hook
//    5–17    Surface + first slice plane y=y0 — intersection curve appears
//   17–28    Slice plane sweeps through y (GENUINE MOTION); cross-section
//             curve morphs in the right pane; tangent at x0 settles → ∂f/∂x
//   28–39    Swap roles: slice plane perpendicular (x = x0); cross-section
//             along y; tangent → ∂f/∂y (GENUINE MOTION)
//   39–47    Takeaway: ∇f = (∂f/∂x, ∂f/∂y)
//
// Colour discipline:
//   chalk-200/300  axes, surface wireframe
//   teal-400       y-slice plane and its trace on the surface
//   violet-400     x-slice plane and its trace
//   amber-400/300  primary cross-section curve / payoff accents
//   rose-400       tangent line + slope readout

const SCENE_DURATION = 52;

const NARRATION = [
  /*  0– 5  */ 'Two inputs, one output — so which slope are we even talking about?',
  /*  5–17  */ 'Here is a surface z equals f of x and y. To talk about slope, freeze one input. Hold y at one fixed value — the surface intersected with that plane is a single curve in x and z.',
  /* 17–28  */ 'Sweep the slice plane through different y values. Each y gives its own curve. The slope of that curve at the chosen x is the partial derivative of f with respect to x.',
  /* 28–39  */ 'Now swap roles. Freeze x at x zero and slice the surface the other way. The intersection curve runs along y, and its slope is the partial derivative of f with respect to y.',
  /* 39–47  */ 'Two slopes through the same point — one along each axis. Together they make the gradient. Slicing was the whole trick.',
];

const NARRATION_AUDIO = 'audio/partial-derivatives-as-slices/scene.mp3';

// ─── The example function and its partials ────────────────────────────────
function fxy(x, y) { return 0.4 * x * x + 0.3 * y * y + 0.25 * x * y + 0.4; }
function fxAt(x, y) { return 0.8 * x + 0.25 * y; }
function fyAt(x, y) { return 0.6 * y + 0.25 * x; }

// Evaluation point (fixed throughout).
const X0 = 1.0;
const Y0 = 1.0;
const Z0 = fxy(X0, Y0);

// Domain shown in 3D + 2D panes.
const X_MIN = -1.4, X_MAX = 1.4;
const Y_MIN = -1.4, Y_MAX = 1.4;
const Z_MIN = 0, Z_MAX = 2.2;

// ─── Geometry — landscape vs portrait ─────────────────────────────────────
// Landscape: 3D scene on the left half, 2D cross-section on the right.
// Portrait : 3D scene on top, 2D cross-section below.
function geom(portrait) {
  if (portrait) {
    return {
      // 3D pane (anchored upper third of 720×1280 stage)
      ox3: 360, oy3: 460, u3: 100,
      // 2D pane (mid third)
      ox2: 360, oy2: 880, ux2: 170, uz2: 90,
      vbW: 720, vbH: 1280,
    };
  }
  return {
    // Landscape: 3D pane left of centre, 2D pane right of centre, panel hugs right edge
    ox3: 320, oy3: 470, u3: 100,
    ox2: 700, oy2: 470, ux2: 115, uz2: 100,
    vbW: 1280, vbH: 720,
  };
}

// Oblique 3D projection. x right, y back (up-and-right at α), z up.
// Conventional axonometric: y axis tilts ~28° above horizontal, foreshortened.
const Y_COS = Math.cos(28 * Math.PI / 180);
const Y_SIN = Math.sin(28 * Math.PI / 180);
const Y_DEPTH = 0.55;
function toSvg3(x, y, z, G) {
  return {
    sx: G.ox3 + x * G.u3 + y * G.u3 * Y_COS * Y_DEPTH,
    sy: G.oy3 - z * G.u3 - y * G.u3 * Y_SIN * Y_DEPTH,
  };
}
// 2D cross-section projection. Sometimes we plot z vs x, sometimes z vs y;
// caller picks the horizontal coord (h) and z is vertical.
function toSvg2(h, z, G) {
  return {
    sx: G.ox2 + h * G.ux2,
    sy: G.oy2 - z * G.uz2,
  };
}

function pathFromPts(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

// ─── SoftPanel — text labels on a dimmed card ─────────────────────────────
function SoftPanel({ children, right = 64, top = 170, width = 380, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined }
    : { right, top };
  return (
    <div style={{
      position: 'absolute', width,
      ...positioning,
      pointerEvents: 'none',
      padding: '16px 20px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 14,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: 10,
    }}>
      {children}
    </div>
  );
}

// ─── 3D building blocks ───────────────────────────────────────────────────
function Axes3({ G, opacity = 0.7 }) {
  const O = toSvg3(0, 0, 0, G);
  const Ax = toSvg3(X_MAX + 0.25, 0, 0, G);
  const Ay = toSvg3(0, Y_MAX + 0.25, 0, G);
  const Az = toSvg3(0, 0, Z_MAX + 0.2, G);
  return (
    <g opacity={opacity}>
      <line x1={O.sx} y1={O.sy} x2={Ax.sx} y2={Ax.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={O.sx} y1={O.sy} x2={Ay.sx} y2={Ay.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"
            strokeDasharray="4 5"/>
      <line x1={O.sx} y1={O.sy} x2={Az.sx} y2={Az.sy}
            stroke="var(--chalk-300)" strokeWidth={1.6} strokeLinecap="round"/>
      <text x={Ax.sx + 8} y={Ax.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>x</text>
      <text x={Ay.sx + 8} y={Ay.sy - 2}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>y</text>
      <text x={Az.sx - 16} y={Az.sy + 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>z</text>
    </g>
  );
}

// Wireframe of the surface: isolines at constant x and constant y.
function SurfaceMesh({ G, opacity = 0.55 }) {
  const ISOX = [-1.2, -0.6, 0, 0.6, 1.2];
  const ISOY = [-1.2, -0.6, 0, 0.6, 1.2];
  const N = 36;
  const lines = [];
  // Iso-y curves: for each y0, sweep x.
  for (const y of ISOY) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const x = X_MIN + (i / N) * (X_MAX - X_MIN);
      pts.push(toSvg3(x, y, fxy(x, y), G));
    }
    lines.push(pts);
  }
  // Iso-x curves: for each x0, sweep y.
  for (const x of ISOX) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const y = Y_MIN + (i / N) * (Y_MAX - Y_MIN);
      pts.push(toSvg3(x, y, fxy(x, y), G));
    }
    lines.push(pts);
  }
  return (
    <g opacity={opacity}>
      {lines.map((pts, i) => (
        <path key={i} d={pathFromPts(pts)}
              fill="none" stroke="var(--chalk-200)" strokeWidth={1.0}
              strokeLinejoin="round"/>
      ))}
    </g>
  );
}

// Translucent slice plane at constant y = y0 (a quad spanning x and z).
function YSlicePlane({ G, y0, color = "var(--teal-400)", opacity = 0.18 }) {
  const a = toSvg3(X_MIN, y0, Z_MIN, G);
  const b = toSvg3(X_MAX, y0, Z_MIN, G);
  const c = toSvg3(X_MAX, y0, Z_MAX, G);
  const d = toSvg3(X_MIN, y0, Z_MAX, G);
  return (
    <g>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
               fill={color} opacity={opacity}/>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
               fill="none" stroke={color} strokeWidth={1.4} opacity={opacity * 3}
               strokeDasharray="4 5"/>
    </g>
  );
}

// Slice plane at constant x = x0 (quad in y, z).
function XSlicePlane({ G, x0, color = "var(--violet-400)", opacity = 0.18 }) {
  const a = toSvg3(x0, Y_MIN, Z_MIN, G);
  const b = toSvg3(x0, Y_MAX, Z_MIN, G);
  const c = toSvg3(x0, Y_MAX, Z_MAX, G);
  const d = toSvg3(x0, Y_MIN, Z_MAX, G);
  return (
    <g>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
               fill={color} opacity={opacity}/>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
               fill="none" stroke={color} strokeWidth={1.4} opacity={opacity * 3}
               strokeDasharray="4 5"/>
    </g>
  );
}

// Highlighted intersection curve of the y=y0 slice with the surface
// (z = f(x, y0) over x ∈ [X_MIN, X_MAX]), drawn in 3D.
function YSliceTrace3D({ G, y0, color = "var(--amber-400)", strokeWidth = 3.4 }) {
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = X_MIN + (i / N) * (X_MAX - X_MIN);
    pts.push(toSvg3(x, y0, fxy(x, y0), G));
  }
  return (
    <path d={pathFromPts(pts)}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  );
}

function XSliceTrace3D({ G, x0, color = "var(--violet-400)", strokeWidth = 3.4 }) {
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const y = Y_MIN + (i / N) * (Y_MAX - Y_MIN);
    pts.push(toSvg3(x0, y, fxy(x0, y), G));
  }
  return (
    <path d={pathFromPts(pts)}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  );
}

// Point P = (X0, Y0, Z0) drawn in 3D as a small disk.
function Point3D({ G, color = "var(--chalk-100)", radius = 5 }) {
  const P = toSvg3(X0, Y0, Z0, G);
  return (
    <circle cx={P.sx} cy={P.sy} r={radius}
            fill={color} stroke="var(--chalk-200)" strokeWidth={1}/>
  );
}

// ─── 2D cross-section pane building blocks ────────────────────────────────
// Axes for cross-section: horizontal range covers x or y (we pass [hMin, hMax]),
// vertical covers z ∈ [Z_MIN, Z_MAX]. Label for h-axis passed in.
function CrossAxes({ G, hMin, hMax, hLabel, zLabel = "z" }) {
  const left = toSvg2(hMin - 0.05, 0, G);
  const right = toSvg2(hMax + 0.1, 0, G);
  const bottom = toSvg2(0, Z_MIN, G);
  const top = toSvg2(0, Z_MAX + 0.15, G);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.7} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bottom.sx} y2={bottom.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.7} strokeLinecap="round"/>
      <text x={right.sx + 10} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>{hLabel}</text>
      <text x={top.sx - 18} y={top.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={18}>{zLabel}</text>
    </g>
  );
}

// One cross-section curve in 2D. fn(h) → z. Optional opacity for "ghost" lines.
function CrossCurve({ G, fn, hMin, hMax, color = "var(--amber-400)", strokeWidth = 2.8, opacity = 1 }) {
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const h = hMin + (i / N) * (hMax - hMin);
    pts.push(toSvg2(h, fn(h), G));
  }
  return (
    <path d={pathFromPts(pts)}
          fill="none" stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeLinecap="round" strokeLinejoin="round"/>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="partial derivatives"
      title="Slopes of Slices"
      duration={SCENE_DURATION}
      introEnd={4.71}
      introCaption="Two inputs — which slope?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.71} end={18.22}>
        <SurfaceAndSliceBeat/>
      </Sprite>

      <Sprite start={18.22} end={29.93}>
        <PartialXBeat/>
      </Sprite>

      <Sprite start={29.93} end={42.47}>
        <PartialYBeat/>
      </Sprite>

      <Sprite start={42.47} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Surface + first slice plane ──────────────────────────────────
function SurfaceAndSliceBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Reveal sequence:
  //   0.0–0.8  axes
  //   0.8–2.4  surface mesh fades in
  //   2.4–4.0  slice plane appears at y = Y0
  //   3.2–end  intersection curve drawn
  //   4.6–end  cross-section curve appears in 2D pane
  const meshT = clamp((localTime - 0.8) / 1.2, 0, 1);
  const planeT = clamp((localTime - 2.4) / 0.6, 0, 1);
  const traceT = clamp((localTime - 3.2) / 1.2, 0, 1);
  const cross2D = clamp((localTime - 4.6) / 1.0, 0, 1);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <SvgFadeIn duration={0.5} delay={0.2}><Axes3 G={G}/></SvgFadeIn>
        <g opacity={meshT}>
          <SurfaceMesh G={G}/>
        </g>
        {planeT > 0 && (
          <g opacity={planeT}>
            <YSlicePlane G={G} y0={Y0}/>
          </g>
        )}
        {traceT > 0 && (
          <g>
            <path d={(() => {
              const N = 60;
              const pts = [];
              for (let i = 0; i <= Math.max(1, Math.floor(N * traceT)); i++) {
                const x = X_MIN + (i / N) * (X_MAX - X_MIN);
                pts.push(toSvg3(x, Y0, fxy(x, Y0), G));
              }
              return pathFromPts(pts);
            })()}
              fill="none" stroke="var(--amber-400)" strokeWidth={3.4} strokeLinecap="round"/>
            {traceT > 0.95 && <Point3D G={G}/>}
          </g>
        )}

        {/* 2D pane axes + first cross-section */}
        {cross2D > 0 && (
          <g opacity={cross2D}>
            <CrossAxes G={G} hMin={X_MIN} hMax={X_MAX} hLabel="x"/>
            <CrossCurve G={G} fn={(x) => fxy(x, Y0)} hMin={X_MIN} hMax={X_MAX}
                        color="var(--amber-400)"/>
            {/* Mark P on the cross-section */}
            <circle cx={toSvg2(X0, Z0, G).sx} cy={toSvg2(X0, Z0, G).sy} r={5}
                    fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={1.5}/>
          </g>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={130} top={null} width={600}>
          <FadeUp duration={0.45} delay={1.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            freeze y, vary x
          </FadeUp>
          <FadeUp duration={0.5} delay={1.7} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            z = f(x, y₀)
          </FadeUp>
          <FadeUp duration={0.5} delay={3.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.45 }}>
            The intersection of plane and surface is a one-variable curve.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={28} top={170} width={320}>
          <FadeUp duration={0.45} delay={1.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            freeze y, vary x
          </FadeUp>
          <FadeUp duration={0.55} delay={1.7} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)', marginTop: 4 }}>
            z = f(x, y₀)
          </FadeUp>
          <FadeUp duration={0.5} delay={3.6} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '30ch', lineHeight: 1.45, marginTop: 4 }}>
            Plane meets surface in a one-variable curve.
          </FadeUp>
          <FadeUp duration={0.5} delay={5.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--amber-400)', marginTop: 4 }}>
            y₀ = {Y0.toFixed(1)}
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Sweep the y-slice, watch ∂f/∂x emerge ────────────────────────
function PartialXBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Sweep y0 from Y_MIN to Y_MAX and back, settling at Y0 around localTime ≈ 5.5.
  //   0.0–1.0  ramp from Y0 up to Y_MAX
  //   1.0–3.0  back to Y_MIN
  //   3.0–5.0  back up to Y0 and ease in
  //   5.0–end  hold at Y0
  let yCurrent;
  if (localTime < 1.0) {
    yCurrent = Y0 + (Y_MAX - Y0) * Easing.easeInOutCubic(clamp(localTime / 1.0, 0, 1));
  } else if (localTime < 3.0) {
    const t = clamp((localTime - 1.0) / 2.0, 0, 1);
    yCurrent = Y_MAX + (Y_MIN - Y_MAX) * Easing.easeInOutCubic(t);
  } else if (localTime < 5.0) {
    const t = clamp((localTime - 3.0) / 2.0, 0, 1);
    yCurrent = Y_MIN + (Y0 - Y_MIN) * Easing.easeInOutCubic(t);
  } else {
    yCurrent = Y0;
  }

  // After plane settles, draw tangent line at x = X0 on the cross-section.
  const tangentT = clamp((localTime - 5.5) / 1.0, 0, 1);
  const settled = localTime > 5.3;
  const settledY0 = Y0;  // when settled, we annotate with Y0

  // Faint "ghost" curves at sampled y values (helps build the family idea).
  const GHOSTS = [-1.0, -0.4, 0.4, 1.0];

  const fxAtP = fxAt(X0, settled ? settledY0 : yCurrent);
  const zAtP = fxy(X0, yCurrent);

  // Tangent line endpoints in (x, z) at the current y0 (or settled).
  // Use a short symmetric window around X0 so the line sits visually on top
  // of the curve rather than spanning the whole canvas.
  const yForTangent = settled ? settledY0 : yCurrent;
  const slopeNow = fxAt(X0, yForTangent);
  const zAtX0 = fxy(X0, yForTangent);
  const TAN_HALF = 0.7;
  const tanXL = X0 - TAN_HALF, tanXR = X0 + TAN_HALF;
  const tanZL = zAtX0 - slopeNow * TAN_HALF;
  const tanZR = zAtX0 + slopeNow * TAN_HALF;

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <Axes3 G={G}/>
        <SurfaceMesh G={G} opacity={0.35}/>
        <YSlicePlane G={G} y0={yCurrent}/>
        <YSliceTrace3D G={G} y0={yCurrent}/>
        {/* Point P fixed at (X0, Y0, Z0) — visible only when plane near Y0 */}
        {Math.abs(yCurrent - Y0) < 0.15 && <Point3D G={G}/>}

        {/* 2D pane */}
        <CrossAxes G={G} hMin={X_MIN} hMax={X_MAX} hLabel="x"/>
        {/* Ghost family */}
        {GHOSTS.map((yG, i) => (
          <CrossCurve key={i} G={G} fn={(x) => fxy(x, yG)} hMin={X_MIN} hMax={X_MAX}
                      color="var(--chalk-300)" strokeWidth={1.2} opacity={0.35}/>
        ))}
        {/* Active cross-section */}
        <CrossCurve G={G} fn={(x) => fxy(x, yCurrent)} hMin={X_MIN} hMax={X_MAX}
                    color="var(--amber-400)" strokeWidth={3.0}/>

        {/* Marker at the (x, z) point matching the active y on the curve */}
        <circle cx={toSvg2(X0, zAtP, G).sx} cy={toSvg2(X0, zAtP, G).sy} r={4.5}
                fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={1.5}/>

        {/* Tangent line (only after plane settles) */}
        {tangentT > 0 && (() => {
          const A = toSvg2(tanXL, tanZL, G);
          const B = toSvg2(tanXR, tanZR, G);
          const dx = B.sx - A.sx, dy = B.sy - A.sy;
          const L = Math.hypot(dx, dy);
          return (
            <line x1={A.sx} y1={A.sy} x2={A.sx + dx * tangentT} y2={A.sy + dy * tangentT}
                  stroke="var(--rose-400)" strokeWidth={2.6} strokeLinecap="round"
                  opacity={0.9}/>
          );
        })()}
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={110} top={null} width={600}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rose-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            partial in x
          </FadeUp>
          <FadeUp duration={0.55} delay={5.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            ∂f/∂x = slope at x₀
          </FadeUp>
          <FadeUp duration={0.5} delay={7.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-200)', maxWidth: '40ch', lineHeight: 1.5 }}>
            ∂f/∂x = lim h→0 [f(x₀+h, y₀) − f(x₀, y₀)] / h
          </FadeUp>
          <FadeUp duration={0.4} delay={8.6} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                     color: 'var(--amber-300)' }}>
            y₀ = {yCurrent.toFixed(2)} · slope = {slopeNow.toFixed(2)}
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={28} top={150} width={320}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rose-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            partial in x
          </FadeUp>
          <FadeUp duration={0.55} delay={5.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)', marginTop: 4 }}>
            ∂f/∂x = slope at x₀
          </FadeUp>
          <FadeUp duration={0.5} delay={7.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-200)', maxWidth: '34ch', lineHeight: 1.5,
                     marginTop: 4 }}>
            ∂f/∂x = lim<sub>h→0</sub> [f(x₀+h, y₀) − f(x₀, y₀)] / h
          </FadeUp>
          <FadeUp duration={0.4} delay={8.6} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                     color: 'var(--amber-300)', marginTop: 4 }}>
            y₀ = {yCurrent.toFixed(2)} · slope = {slopeNow.toFixed(2)}
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Swap roles — slice along x, get ∂f/∂y ────────────────────────
function PartialYBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Sweep x0 from X_MIN to X_MAX, settling at X0 around localTime ≈ 4.4.
  let xCurrent;
  if (localTime < 1.0) {
    xCurrent = X0 + (X_MIN - X0) * Easing.easeInOutCubic(clamp(localTime / 1.0, 0, 1));
  } else if (localTime < 3.0) {
    const t = clamp((localTime - 1.0) / 2.0, 0, 1);
    xCurrent = X_MIN + (X_MAX - X_MIN) * Easing.easeInOutCubic(t);
  } else if (localTime < 4.4) {
    const t = clamp((localTime - 3.0) / 1.4, 0, 1);
    xCurrent = X_MAX + (X0 - X_MAX) * Easing.easeInOutCubic(t);
  } else {
    xCurrent = X0;
  }

  const tangentT = clamp((localTime - 5.0) / 1.0, 0, 1);
  const settled = localTime > 4.6;

  const xForTangent = settled ? X0 : xCurrent;
  const slopeNow = fyAt(xForTangent, Y0);
  const zAtY0 = fxy(xForTangent, Y0);

  const TAN_HALF = 0.7;
  const tanYL = Y0 - TAN_HALF, tanYR = Y0 + TAN_HALF;
  const tanZL = zAtY0 - slopeNow * TAN_HALF;
  const tanZR = zAtY0 + slopeNow * TAN_HALF;

  const GHOSTS = [-1.0, -0.4, 0.4, 1.0];
  const zAtP = fxy(xCurrent, Y0);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <Axes3 G={G}/>
        <SurfaceMesh G={G} opacity={0.35}/>
        <XSlicePlane G={G} x0={xCurrent}/>
        <XSliceTrace3D G={G} x0={xCurrent}/>
        {Math.abs(xCurrent - X0) < 0.15 && <Point3D G={G}/>}

        {/* 2D pane — now h-axis is y */}
        <CrossAxes G={G} hMin={Y_MIN} hMax={Y_MAX} hLabel="y"/>
        {GHOSTS.map((xG, i) => (
          <CrossCurve key={i} G={G} fn={(y) => fxy(xG, y)} hMin={Y_MIN} hMax={Y_MAX}
                      color="var(--chalk-300)" strokeWidth={1.2} opacity={0.35}/>
        ))}
        <CrossCurve G={G} fn={(y) => fxy(xCurrent, y)} hMin={Y_MIN} hMax={Y_MAX}
                    color="var(--violet-400)" strokeWidth={3.0}/>

        <circle cx={toSvg2(Y0, zAtP, G).sx} cy={toSvg2(Y0, zAtP, G).sy} r={4.5}
                fill="var(--chalk-100)" stroke="var(--rose-400)" strokeWidth={1.5}/>

        {tangentT > 0 && (() => {
          const A = toSvg2(tanYL, tanZL, G);
          const B = toSvg2(tanYR, tanZR, G);
          const dx = B.sx - A.sx, dy = B.sy - A.sy;
          return (
            <line x1={A.sx} y1={A.sy} x2={A.sx + dx * tangentT} y2={A.sy + dy * tangentT}
                  stroke="var(--rose-400)" strokeWidth={2.6} strokeLinecap="round"
                  opacity={0.9}/>
          );
        })()}
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={110} top={null} width={600}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--violet-400)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            partial in y
          </FadeUp>
          <FadeUp duration={0.55} delay={5.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            ∂f/∂y = slope at y₀
          </FadeUp>
          <FadeUp duration={0.5} delay={6.8} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-200)', maxWidth: '40ch', lineHeight: 1.5 }}>
            ∂f/∂y = lim h→0 [f(x₀, y₀+h) − f(x₀, y₀)] / h
          </FadeUp>
          <FadeUp duration={0.4} delay={8.0} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                     color: 'var(--violet-400)' }}>
            x₀ = {xCurrent.toFixed(2)} · slope = {slopeNow.toFixed(2)}
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={28} top={150} width={320}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--violet-400)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            partial in y
          </FadeUp>
          <FadeUp duration={0.55} delay={5.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)', marginTop: 4 }}>
            ∂f/∂y = slope at y₀
          </FadeUp>
          <FadeUp duration={0.5} delay={6.8} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-200)', maxWidth: '34ch', lineHeight: 1.5,
                     marginTop: 4 }}>
            ∂f/∂y = lim<sub>h→0</sub> [f(x₀, y₀+h) − f(x₀, y₀)] / h
          </FadeUp>
          <FadeUp duration={0.4} delay={8.0} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                     color: 'var(--violet-400)', marginTop: 4 }}>
            x₀ = {xCurrent.toFixed(2)} · slope = {slopeNow.toFixed(2)}
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
      maxWidth: portrait ? 600 : 920,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>two slopes, one point</FadeUp>

      <FadeUp duration={0.7} delay={0.4} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 42, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        One along x, one along y.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.2} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 52, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        ∇f = ( ∂f/∂x , ∂f/∂y )
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '32ch' : '46ch',
          lineHeight: 1.4,
        }}>
        Each partial is a one-variable derivative — the slope of a slice.
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
