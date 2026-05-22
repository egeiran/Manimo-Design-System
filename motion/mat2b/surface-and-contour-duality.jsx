// Surface ↔ Contour: One Hill, Two Views — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). Visualises the duality
// between a 3D surface z = f(x, y) and its 2D contour map. The mechanism:
// slice the surface with a horizontal plane at height h, project the
// intersection straight down — that's the level curve at f = h. Sweep h
// upward and the contour map fills in.
//
// Example function: f(x, y) = 1.2 − 0.3 x² − 0.2 y²
//   Peak 1.2 at the origin. Contours are nested ellipses with semi-axes
//     a(c) = √((1.2 − c) / 0.3)  along x
//     b(c) = √((1.2 − c) / 0.2)  along y
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 5    Manimo hook
//    5–14    Setup: surface and empty contour pane
//   14–32    Cutting plane sweeps h upward (GENUINE MOTION); intersection
//             projects down; contour map fills in
//   32–42    Annotated map: tight vs loose contours
//   42–49    Takeaway: surface seen from above
//
// Colour discipline:
//   chalk-200/300  axes, surface wireframe, blank-pane axes
//   teal-400       cutting plane (horizontal slice)
//   amber-400      active intersection / level curve
//   amber-300      formula / value accents
//   rose-400       steep-region annotation
//   chalk-100      titles

const SCENE_DURATION = 48;

const NARRATION = [
  /*  0– 5 */ 'How do you draw a hill on a flat page? A contour map. Let us see why it works.',
  /*  5–14 */ 'Here is the hill — a surface z equals f of x and y. Below it, a blank x y plane, ready to receive its shadow.',
  /* 14–32 */ 'Slice the surface with a horizontal plane at height h. The cross section is a closed curve — the level set. Drop it straight down to the floor and you have one contour. Sweep h upward and the contour map fills in.',
  /* 32–42 */ 'Tight contours, steep slope. Loose contours, gentle slope. The map reads height changes from line spacing.',
  /* 42–49 */ 'A surface and its contour map are the same picture — one folded up into three D, the other flat. The map is just the surface, seen from above.',
];

const NARRATION_AUDIO = 'audio/surface-and-contour-duality/scene.mp3';

// ─── Function and helpers ─────────────────────────────────────────────────
const PEAK = 1.2;
function fxy(x, y) { return PEAK - 0.3 * x * x - 0.2 * y * y; }

// Domain shown in both panes.
const X_MIN = -1.9, X_MAX = 1.9;
const Y_MIN = -2.3, Y_MAX = 2.3;
const Z_MAX = PEAK + 0.2;

// Contour levels used as ghost lines and final map.
const LEVELS = [0.05, 0.25, 0.45, 0.65, 0.85, 1.05];

// Closed ellipse path for f(x,y) = c.
function ellipsePts(c, samples = 80) {
  if (c >= PEAK) return [];
  const a = Math.sqrt((PEAK - c) / 0.3);
  const b = Math.sqrt((PEAK - c) / 0.2);
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const th = (i / samples) * 2 * Math.PI;
    pts.push({ x: a * Math.cos(th), y: b * Math.sin(th) });
  }
  return pts;
}

// ─── Geometry ─────────────────────────────────────────────────────────────
function geom(portrait) {
  if (portrait) {
    return {
      ox3: 360, oy3: 410, u3: 72,
      ox2: 360, oy2: 790, u2: 66,
      vbW: 720, vbH: 1280,
    };
  }
  return {
    ox3: 300, oy3: 460, u3: 82,
    ox2: 720, oy2: 460, u2: 72,
    vbW: 1280, vbH: 720,
  };
}

const Y_COS = Math.cos(28 * Math.PI / 180);
const Y_SIN = Math.sin(28 * Math.PI / 180);
const Y_DEPTH = 0.55;
function toSvg3(x, y, z, G) {
  return {
    sx: G.ox3 + x * G.u3 + y * G.u3 * Y_COS * Y_DEPTH,
    sy: G.oy3 - z * G.u3 - y * G.u3 * Y_SIN * Y_DEPTH,
  };
}
function toSvg2(x, y, G) {
  return { sx: G.ox2 + x * G.u2, sy: G.oy2 - y * G.u2 };
}

function pathFromPts(pts) {
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
}

// ─── SoftPanel ─────────────────────────────────────────────────────────────
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
function Axes3({ G, opacity = 0.7, showZ = true }) {
  const O = toSvg3(0, 0, 0, G);
  const Ax = toSvg3(X_MAX + 0.2, 0, 0, G);
  const Ay = toSvg3(0, Y_MAX + 0.2, 0, G);
  const Az = toSvg3(0, 0, Z_MAX, G);
  return (
    <g opacity={opacity}>
      <line x1={O.sx} y1={O.sy} x2={Ax.sx} y2={Ax.sy}
            stroke="var(--chalk-300)" strokeWidth={1.5} strokeLinecap="round"/>
      <line x1={O.sx} y1={O.sy} x2={Ay.sx} y2={Ay.sy}
            stroke="var(--chalk-300)" strokeWidth={1.5} strokeLinecap="round"
            strokeDasharray="4 5"/>
      {showZ && (
        <line x1={O.sx} y1={O.sy} x2={Az.sx} y2={Az.sy}
              stroke="var(--chalk-300)" strokeWidth={1.5} strokeLinecap="round"/>
      )}
      <text x={Ax.sx + 8} y={Ax.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>x</text>
      <text x={Ay.sx + 8} y={Ay.sy - 2}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>y</text>
      {showZ && (
        <text x={Az.sx - 14} y={Az.sy + 8}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={16}>z</text>
      )}
    </g>
  );
}

function SurfaceMesh({ G, opacity = 0.5 }) {
  const ISOX = [-1.6, -0.8, 0, 0.8, 1.6];
  const ISOY = [-2.0, -1.0, 0, 1.0, 2.0];
  const N = 40;
  const lines = [];
  for (const y of ISOY) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const x = X_MIN + (i / N) * (X_MAX - X_MIN);
      pts.push(toSvg3(x, y, Math.max(0, fxy(x, y)), G));
    }
    lines.push(pts);
  }
  for (const x of ISOX) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const y = Y_MIN + (i / N) * (Y_MAX - Y_MIN);
      pts.push(toSvg3(x, y, Math.max(0, fxy(x, y)), G));
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

// Horizontal cutting plane at z = h (a quad).
function CuttingPlane({ G, h, color = "var(--teal-400)", opacity = 0.2 }) {
  const a = toSvg3(X_MIN, Y_MIN, h, G);
  const b = toSvg3(X_MAX, Y_MIN, h, G);
  const c = toSvg3(X_MAX, Y_MAX, h, G);
  const d = toSvg3(X_MIN, Y_MAX, h, G);
  return (
    <g>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
               fill={color} opacity={opacity}/>
      <polygon points={`${a.sx},${a.sy} ${b.sx},${b.sy} ${c.sx},${c.sy} ${d.sx},${d.sy}`}
               fill="none" stroke={color} strokeWidth={1.4} opacity={opacity * 3}
               strokeDasharray="4 4"/>
    </g>
  );
}

// Intersection ellipse on the surface at level c, drawn in 3D at height c.
function IntersectionCurve3D({ G, c, color = "var(--amber-400)", strokeWidth = 2.8 }) {
  const pts = ellipsePts(c);
  if (pts.length === 0) return null;
  const proj = pts.map(p => toSvg3(p.x, p.y, c, G));
  return (
    <path d={pathFromPts(proj)}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  );
}

// Projection lines from the intersection curve down to the xy-plane (z=0).
// Vertical drops shown as light dashed lines at a few sample points.
function ProjectionDrops3D({ G, c, count = 8, color = "var(--chalk-300)", opacity = 0.55 }) {
  if (c >= PEAK) return null;
  const a = Math.sqrt((PEAK - c) / 0.3);
  const b = Math.sqrt((PEAK - c) / 0.2);
  const drops = [];
  for (let i = 0; i < count; i++) {
    const th = (i / count) * 2 * Math.PI;
    const x = a * Math.cos(th), y = b * Math.sin(th);
    const hi = toSvg3(x, y, c, G);
    const lo = toSvg3(x, y, 0, G);
    drops.push({ hi, lo });
  }
  return (
    <g opacity={opacity}>
      {drops.map(({ hi, lo }, i) => (
        <line key={i} x1={hi.sx} y1={hi.sy} x2={lo.sx} y2={lo.sy}
              stroke={color} strokeWidth={1.0} strokeDasharray="3 4"/>
      ))}
    </g>
  );
}

// ─── 2D pane (contour map) ────────────────────────────────────────────────
function ContourAxes({ G, opacity = 0.7 }) {
  const left = toSvg2(X_MIN - 0.15, 0, G), right = toSvg2(X_MAX + 0.15, 0, G);
  const top = toSvg2(0, Y_MAX + 0.2, G), bot = toSvg2(0, Y_MIN - 0.15, G);
  return (
    <g opacity={opacity}>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round"/>
      <text x={right.sx + 8} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>x</text>
      <text x={top.sx - 14} y={top.sy + 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>y</text>
    </g>
  );
}

function ContourCurve2D({ G, c, color, strokeWidth = 1.6, opacity = 1, strokeDasharray }) {
  const pts = ellipsePts(c);
  if (pts.length === 0) return null;
  const proj = pts.map(p => toSvg2(p.x, p.y, G));
  return (
    <path d={pathFromPts(proj) + ' Z'}
          fill="none" stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeDasharray={strokeDasharray}
          strokeLinecap="round"/>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="level curves"
      title="Surface ↔ Contour"
      duration={SCENE_DURATION}
      introEnd={5.88}
      introCaption="One hill, two views."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.88} end={15}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={15} end={29.21}>
        <SweepBeat/>
      </Sprite>

      <Sprite start={29.21} end={37.36}>
        <SpacingBeat/>
      </Sprite>

      <Sprite start={37.36} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <SvgFadeIn duration={0.5} delay={0.3}><Axes3 G={G}/></SvgFadeIn>
        <SvgFadeIn duration={0.7} delay={0.9}><SurfaceMesh G={G}/></SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={2.0}><ContourAxes G={G}/></SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={120} top={null} width={600}>
          <FadeUp duration={0.45} delay={0.3} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the hill
          </FadeUp>
          <FadeUp duration={0.55} delay={1.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--amber-300)' }}>
            f(x, y) = 1.2 − 0.3 x² − 0.2 y²
          </FadeUp>
          <FadeUp duration={0.5} delay={3.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.45 }}>
            The xy-plane below is blank — waiting to receive level curves.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={40} top={170} width={300}>
          <FadeUp duration={0.45} delay={0.3} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            the hill
          </FadeUp>
          <FadeUp duration={0.55} delay={1.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-300)', marginTop: 4 }}>
            f(x, y) = 1.2 − 0.3 x² − 0.2 y²
          </FadeUp>
          <FadeUp duration={0.5} delay={3.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '30ch', lineHeight: 1.45, marginTop: 6 }}>
            The xy-plane is blank — waiting to receive level curves.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Sweep cutting plane upward ───────────────────────────────────
function SweepBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Beat is 18 s. Sweep schedule:
  //   0.0–0.8  lead-in (still at h=0.05, planes appear)
  //   0.8–8.8  ramp h from 0.05 to 1.05
  //   8.8–end  hold near top, draw remaining persistent contours
  const RAMP_START = 0.8;
  const RAMP_END = 10.8;
  const t = clamp((localTime - RAMP_START) / (RAMP_END - RAMP_START), 0, 1);
  const hRange = LEVELS[LEVELS.length - 1] - LEVELS[0];
  const hCurrent = LEVELS[0] + hRange * Easing.easeInOutCubic(t);

  // Persistent ghost contours: include any LEVELS[i] that has been "reached"
  // by the sweep.
  const persistent = LEVELS.filter((c) => c <= hCurrent + 0.02);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <Axes3 G={G} opacity={0.6}/>
        <SurfaceMesh G={G} opacity={0.4}/>
        <CuttingPlane G={G} h={hCurrent}/>
        <IntersectionCurve3D G={G} c={hCurrent} color="var(--amber-400)" strokeWidth={3.0}/>
        <ProjectionDrops3D G={G} c={hCurrent}/>

        {/* 2D contour map */}
        <ContourAxes G={G}/>
        {/* Persistent ghost contours */}
        {persistent.map((c, i) => (
          <ContourCurve2D key={`p-${i}`} G={G} c={c}
                          color="var(--chalk-300)"
                          strokeWidth={1.4} opacity={0.55}/>
        ))}
        {/* Active contour at current h, drawn bright on top */}
        <ContourCurve2D G={G} c={hCurrent}
                        color="var(--amber-400)" strokeWidth={2.4}/>
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={50} top={null} width={600}>
          <FadeUp duration={0.45} delay={0.3} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal-400)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            sweep h upward · h = {hCurrent.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.55} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-300)' }}>
            f(x, y) = h  →  one level curve
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={40} top={150} width={300}>
          <FadeUp duration={0.45} delay={0.3} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal-400)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            sweep h upward
          </FadeUp>
          <FadeUp duration={0.55} delay={1.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--amber-300)', marginTop: 4 }}>
            f(x, y) = h
          </FadeUp>
          <FadeUp duration={0.4} delay={2.6} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--amber-300)', marginTop: 4 }}>
            h = {hCurrent.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.5} delay={3.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '30ch', lineHeight: 1.45, marginTop: 6 }}>
            Every height becomes one level curve in the plane below.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Tight vs loose spacing ───────────────────────────────────────
function SpacingBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Two annotation circles in 2D pane:
  //   • TIGHT cluster — near the rim (low c, contours close together because
  //     ∂f drops fast there). Place annotation at (x≈1.6, y≈0).
  //   • GENTLE cluster — near the peak (contours far apart because the hill
  //     is flat near the top). Place annotation at (x≈0, y≈0.4).
  const tightCentre = toSvg2(1.55, 0, G);
  const gentleCentre = toSvg2(0, 0.3, G);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        {/* Keep the 3D pane visible for reference (no plane). */}
        <Axes3 G={G} opacity={0.45}/>
        <SurfaceMesh G={G} opacity={0.32}/>
        {/* Lit-up contours on the surface for context. */}
        {LEVELS.map((c, i) => (
          <IntersectionCurve3D key={`s-${i}`} G={G} c={c}
                               color="var(--amber-400)" strokeWidth={1.6}/>
        ))}

        {/* Full contour map */}
        <ContourAxes G={G}/>
        {LEVELS.map((c, i) => (
          <ContourCurve2D key={`m-${i}`} G={G} c={c}
                          color="var(--chalk-200)" strokeWidth={1.6} opacity={0.85}/>
        ))}

        {/* Tight annotation */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <circle cx={tightCentre.sx} cy={tightCentre.sy} r={42}
                  fill="none" stroke="var(--rose-400)" strokeWidth={2}
                  strokeDasharray="6 5"/>
          <text x={tightCentre.sx} y={tightCentre.sy - 50} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">STEEP</text>
        </SvgFadeIn>

        {/* Gentle annotation */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <circle cx={gentleCentre.sx} cy={gentleCentre.sy} r={40}
                  fill="none" stroke="var(--teal-400)" strokeWidth={2}
                  strokeDasharray="6 5"/>
          <text x={gentleCentre.sx} y={gentleCentre.sy + 56} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">GENTLE</text>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={60} bottom={120} top={null} width={600}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            read the spacing
          </FadeUp>
          <FadeUp duration={0.55} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            Tight = steep. Loose = gentle.
          </FadeUp>
          <FadeUp duration={0.5} delay={2.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '40ch', lineHeight: 1.45 }}>
            Same height step, less horizontal distance — the slope is bigger.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={40} top={170} width={300}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            read the spacing
          </FadeUp>
          <FadeUp duration={0.55} delay={1.0} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)', marginTop: 4 }}>
            Tight = steep. Loose = gentle.
          </FadeUp>
          <FadeUp duration={0.5} delay={2.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '30ch', lineHeight: 1.45, marginTop: 6 }}>
            Same height step, less horizontal distance — the slope is bigger.
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
      gap: portrait ? 24 : 28,
      maxWidth: portrait ? 600 : 940,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>same hill</FadeUp>

      <FadeUp duration={0.7} delay={0.4} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 34 : 46, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        Seen from above.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '40ch', lineHeight: 1.35,
        }}>
        Each contour is one height — the surface flattened, not lost.
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
