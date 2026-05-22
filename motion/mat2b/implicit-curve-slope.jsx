// Implicit Curve Slope: dy/dx = −F_x / F_y — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). Derives and visualises the
// implicit-differentiation slope formula. The level curve F(x, y) = c hides
// the function y(x); differentiating the relation with respect to x gives
//   F_x + F_y · dy/dx = 0   ⇒   dy/dx = −F_x / F_y
// We pick a tilted ellipse and slide a point around it, showing the
// tangent rotating in step and the formula's two partials updating live.
//
// Example function:  F(x, y) = x² + x y + y²,   level set F = 3.
//   F_x = 2x + y,  F_y = x + 2y.
// The curve is an ellipse rotated 45°, with semi-axes √2 (along (1,1)/√2)
// and √6 (along (1,−1)/√2). Parametric form:
//   x(θ) =  cos θ + √3 sin θ
//   y(θ) =  cos θ − √3 sin θ
// Notable points:
//   θ=0          : (1, 1)        slope = −1
//   θ=arctan(1/√3) ≈ 30°: F_y = 0 at (x,y) = (2, −1)   → vertical tangent
//   θ=2π − arctan(1/√3) ≈ 330°: F_x = 0 at (x,y) = (−1, 2)→ horizontal tangent
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//    0– 5    Manimo hook
//    5–15    Setup — level curve drawn, no y(x)
//   15–27    Implicit differentiation derivation; tangent at P
//   27–41    Slide P around the curve (GENUINE MOTION); tangent rotates,
//             live readout of F_x, F_y, dy/dx; annotate F_y = 0 and F_x = 0
//   41–48    Takeaway: dy/dx = −F_x / F_y
//
// Colour discipline:
//   chalk-200/300  axes, scaffolding
//   amber-400/300  the level curve / payoff accents
//   rose-400/300   tangent line / numerical slope
//   violet-400     F_x glyph and value
//   teal-400       F_y glyph and value
//   chalk-100      titles, P dot

const SCENE_DURATION = 61;

const NARRATION = [
  /*  0– 5 */ 'When y is tangled up with x — no clean formula y of x — can we still get the slope? Yes.',
  /*  5–15 */ 'Take an example. F of x and y equals x squared plus x y plus y squared. Set it equal to three. The solution set is a closed curve — a tilted ellipse.',
  /* 15–27 */ 'Differentiate both sides with respect to x, treating y as a function of x. The partial in x plus the partial in y times dy by dx equals zero. Solve: dy by dx equals minus the partial in x over the partial in y.',
  /* 27–41 */ 'Now slide the point all the way around the curve. The tangent rotates with it. Where the partial in y vanishes the tangent is vertical — undefined slope. Where the partial in x vanishes the tangent is flat. The formula handles every position.',
  /* 41–48 */ 'The level curve hides the function y of x. Implicit differentiation reads the slope without ever isolating it.',
];

const NARRATION_AUDIO = 'audio/implicit-curve-slope/scene.mp3';

// ─── The level curve ──────────────────────────────────────────────────────
const C_LEVEL = 3;                         // F(x, y) = C_LEVEL
function FxAt(x, y) { return 2 * x + y; }  // ∂F/∂x
function FyAt(x, y) { return x + 2 * y; }  // ∂F/∂y

// Parametric position on the curve.
function paramPt(theta) {
  const x = Math.cos(theta) + Math.sqrt(3) * Math.sin(theta);
  const y = Math.cos(theta) - Math.sqrt(3) * Math.sin(theta);
  return { x, y };
}

// θ-values where F_y = 0 (vertical tangent): solve x + 2y = 0 on the curve.
//   cosθ + √3 sinθ + 2(cosθ − √3 sinθ) = 0
//   3 cosθ − √3 sinθ = 0  ⇒  tan θ = √3  ⇒  θ = π/3 (and π + π/3)
const THETA_VTAN = Math.PI / 3;
// θ-values where F_x = 0 (horizontal tangent): solve 2x + y = 0.
//   2(cosθ + √3 sinθ) + cosθ − √3 sinθ = 0
//   3 cosθ + √3 sinθ = 0  ⇒  tan θ = −√3  ⇒  θ = 2π/3 (and 2π/3 + π)
const THETA_HTAN = 2 * Math.PI / 3;

// Initial "anchor" point used by the derive beat: θ = π/6 (visually clear).
const THETA_ANCHOR = Math.PI / 6;

// ─── Geometry ─────────────────────────────────────────────────────────────
const X_MAX_DISP = 2.6, Y_MAX_DISP = 2.6;

function geom(portrait) {
  if (portrait) {
    return {
      ox: 360, oy: 600, u: 130,
      vbW: 720, vbH: 1280,
    };
  }
  return {
    ox: 460, oy: 380, u: 130,
    vbW: 1280, vbH: 720,
  };
}

function toSvg(x, y, G) {
  return { sx: G.ox + x * G.u, sy: G.oy - y * G.u };
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

// ─── Plane primitives ─────────────────────────────────────────────────────
function PlaneAxes({ G, opacity = 0.7 }) {
  const left = toSvg(-X_MAX_DISP, 0, G), right = toSvg(X_MAX_DISP, 0, G);
  const bot = toSvg(0, -Y_MAX_DISP, G), top = toSvg(0, Y_MAX_DISP, G);
  return (
    <g opacity={opacity}>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <text x={right.sx + 12} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>x</text>
      <text x={top.sx - 18} y={top.sy + 4}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>y</text>
    </g>
  );
}

// The level curve F(x,y) = C_LEVEL drawn parametrically.
function LevelCurve({ G, color = "var(--amber-400)", strokeWidth = 2.8, progress = 1 }) {
  const N = 120;
  const lim = Math.max(1, Math.floor(N * progress));
  const pts = [];
  for (let i = 0; i <= lim; i++) {
    const th = (i / N) * 2 * Math.PI;
    const { x, y } = paramPt(th);
    pts.push(toSvg(x, y, G));
  }
  return (
    <path d={pathFromPts(pts) + (progress >= 1 ? ' Z' : '')}
          fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
          strokeLinejoin="round"/>
  );
}

// Tangent line at point (px, py) on the curve, slope m. Drawn across the
// visible window, clipped to the bounding box.
function TangentLine({ G, px, py, m, color = "var(--rose-400)", strokeWidth = 2.6, opacity = 0.95, length = 1.5 }) {
  // For finite slope: parametrise (px + t, py + m·t) for t ∈ [-L, L]; for very
  // large |m| (near vertical) parametrise (px + t/m, py + t) instead.
  let A, B;
  if (Math.abs(m) > 4) {
    // Near-vertical: parametrise by Δy.
    const dy = length;
    A = toSvg(px - dy / m, py - dy, G);
    B = toSvg(px + dy / m, py + dy, G);
  } else {
    const dx = length;
    A = toSvg(px - dx, py - m * dx, G);
    B = toSvg(px + dx, py + m * dx, G);
  }
  return (
    <line x1={A.sx} y1={A.sy} x2={B.sx} y2={B.sy}
          stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeLinecap="round"/>
  );
}

// Small bracket/marker showing a vertical or horizontal tangent line at a
// point — used in the sweep beat when F_y = 0 or F_x = 0.
function VerticalTangentAt({ G, px, py, color = "var(--rose-400)", length = 1.7 }) {
  const A = toSvg(px, py - length, G);
  const B = toSvg(px, py + length, G);
  return (
    <line x1={A.sx} y1={A.sy} x2={B.sx} y2={B.sy}
          stroke={color} strokeWidth={2.6} opacity={0.95}
          strokeLinecap="round"/>
  );
}
function HorizontalTangentAt({ G, px, py, color = "var(--teal-400)", length = 1.7 }) {
  const A = toSvg(px - length, py, G);
  const B = toSvg(px + length, py, G);
  return (
    <line x1={A.sx} y1={A.sy} x2={B.sx} y2={B.sy}
          stroke={color} strokeWidth={2.6} opacity={0.95}
          strokeLinecap="round"/>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="implicit differentiation"
      title="Slope Without Solving"
      duration={SCENE_DURATION}
      introEnd={6.91}
      introCaption="Tangled? Differentiate anyway."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.91} end={20.24}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={20.24} end={36.14}>
        <DeriveBeat/>
      </Sprite>

      <Sprite start={36.14} end={52.01}>
        <SweepBeat/>
      </Sprite>

      <Sprite start={52.01} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup ────────────────────────────────────────────────────────
function SetupBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const curveT = clamp((localTime - 1.0) / 1.6, 0, 1);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <SvgFadeIn duration={0.5} delay={0.3}><PlaneAxes G={G}/></SvgFadeIn>
        {curveT > 0 && <LevelCurve G={G} progress={curveT}/>}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <text x={toSvg(1.6, -1.95, G).sx} y={toSvg(1.6, -1.95, G).sy}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.06em">F = 3</text>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={150} bottom={120} top={null} width={520}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            an implicit curve
          </FadeUp>
          <FadeUp duration={0.55} delay={1.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            F(x, y) = x² + x y + y²
          </FadeUp>
          <FadeUp duration={0.55} delay={2.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--amber-300)' }}>
            F(x, y) = 3
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '38ch', lineHeight: 1.45 }}>
            No clean y = …(x). And yet — every point on this curve has a tangent.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={48} top={170} width={360}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            an implicit curve
          </FadeUp>
          <FadeUp duration={0.55} delay={1.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--chalk-100)', marginTop: 4 }}>
            F(x, y) = x² + x y + y²
          </FadeUp>
          <FadeUp duration={0.55} delay={2.4} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--amber-300)' }}>
            F(x, y) = 3
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '30ch', lineHeight: 1.45, marginTop: 6 }}>
            No clean y = …(x). And yet — every point on this curve has a tangent.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: Derive — implicit differentiation on the relation ────────────
function DeriveBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  const { x: px, y: py } = paramPt(THETA_ANCHOR);
  const fx = FxAt(px, py);
  const fy = FyAt(px, py);
  const slope = -fx / fy;

  const tangentT = clamp((localTime - 3.2) / 1.0, 0, 1);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <PlaneAxes G={G}/>
        <LevelCurve G={G} progress={1}/>

        {/* Point P */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <circle cx={toSvg(px, py, G).sx} cy={toSvg(px, py, G).sy} r={6}
                  fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
          <text x={toSvg(px, py, G).sx + 14} y={toSvg(px, py, G).sy - 12}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={20}>P</text>
        </SvgFadeIn>

        {/* Tangent line, drawn in after the formula appears */}
        {tangentT > 0 && (() => {
          // Animate the tangent length growing from the centre point.
          const A = toSvg(px - 1.5 * tangentT, py - slope * 1.5 * tangentT, G);
          const B = toSvg(px + 1.5 * tangentT, py + slope * 1.5 * tangentT, G);
          return (
            <line x1={A.sx} y1={A.sy} x2={B.sx} y2={B.sy}
                  stroke="var(--rose-400)" strokeWidth={2.8} strokeLinecap="round"/>
          );
        })()}
      </svg>

      {portrait ? (
        <SoftPanel left={150} bottom={60} top={null} width={520}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rose-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            differentiate the relation
          </FadeUp>
          <FadeUp duration={0.5} delay={1.0} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 20, color: 'var(--chalk-200)' }}>
            F<sub>x</sub> + F<sub>y</sub> · dy/dx = 0
          </FadeUp>
          <FadeUp duration={0.55} delay={3.8} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--amber-300)' }}>
            dy/dx = −F<sub>x</sub> / F<sub>y</sub>
          </FadeUp>
          <FadeUp duration={0.4} delay={5.4} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--violet-400)' }}>
            F<sub>x</sub> = 2x + y
          </FadeUp>
          <FadeUp duration={0.4} delay={5.9} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--teal-400)' }}>
            F<sub>y</sub> = x + 2y
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={48} top={150} width={400}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rose-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            differentiate the relation
          </FadeUp>
          <FadeUp duration={0.5} delay={1.0} distance={8}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-200)', marginTop: 4 }}>
            F<sub>x</sub> + F<sub>y</sub> · dy/dx = 0
          </FadeUp>
          <FadeUp duration={0.55} delay={3.8} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--amber-300)' }}>
            dy/dx = −F<sub>x</sub> / F<sub>y</sub>
          </FadeUp>
          <FadeUp duration={0.4} delay={5.4} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--violet-400)',
                     marginTop: 4 }}>
            F<sub>x</sub> = 2x + y
          </FadeUp>
          <FadeUp duration={0.4} delay={5.9} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--teal-400)' }}>
            F<sub>y</sub> = x + 2y
          </FadeUp>
          <FadeUp duration={0.5} delay={7.4} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.45, marginTop: 6 }}>
            At P, slope = {slope.toFixed(2)}.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 4: Slide P around the curve; tangent rotates ────────────────────
function SweepBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = geom(portrait);

  // Lead-in 0.5 s, then sweep θ over ~12 s.
  const SWEEP_START = 0.5;
  const SWEEP_DUR = 12.0;
  const s = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const theta = s * 2 * Math.PI;

  const { x: px, y: py } = paramPt(theta);
  const fx = FxAt(px, py);
  const fy = FyAt(px, py);
  const isNearVerticalTangent = Math.abs(fy) < 0.15;
  const isNearHorizontalTangent = Math.abs(fx) < 0.15;
  const slope = fy !== 0 ? -fx / fy : Number.NaN;

  // Vertical-tangent annotation appears when we're close to θ = THETA_VTAN.
  const dV = Math.min(
    Math.abs(((theta - THETA_VTAN) + 4 * Math.PI) % (2 * Math.PI)),
    Math.abs(((THETA_VTAN - theta) + 4 * Math.PI) % (2 * Math.PI))
  );
  const dH = Math.min(
    Math.abs(((theta - THETA_HTAN) + 4 * Math.PI) % (2 * Math.PI)),
    Math.abs(((THETA_HTAN - theta) + 4 * Math.PI) % (2 * Math.PI))
  );
  const vAnnotation = dV < 0.25;
  const hAnnotation = dH < 0.25;

  // Persistent annotations: once we pass V or H tangent, leave a faint mark.
  const passedV = theta > THETA_VTAN - 0.05;
  const passedH = theta > THETA_HTAN - 0.05;
  const Vpt = paramPt(THETA_VTAN);
  const Hpt = paramPt(THETA_HTAN);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}>
        <PlaneAxes G={G}/>
        <LevelCurve G={G}/>

        {/* Persistent vertical/horizontal tangent ghosts */}
        {passedV && (
          <g opacity={0.55}>
            <VerticalTangentAt G={G} px={Vpt.x} py={Vpt.y} color="var(--rose-400)"/>
            <circle cx={toSvg(Vpt.x, Vpt.y, G).sx} cy={toSvg(Vpt.x, Vpt.y, G).sy} r={4}
                    fill="var(--rose-400)" opacity={0.6}/>
          </g>
        )}
        {passedH && (
          <g opacity={0.55}>
            <HorizontalTangentAt G={G} px={Hpt.x} py={Hpt.y} color="var(--teal-400)"/>
            <circle cx={toSvg(Hpt.x, Hpt.y, G).sx} cy={toSvg(Hpt.x, Hpt.y, G).sy} r={4}
                    fill="var(--teal-400)" opacity={0.6}/>
          </g>
        )}

        {/* Active tangent line */}
        {isNearVerticalTangent
          ? <VerticalTangentAt G={G} px={px} py={py}/>
          : <TangentLine G={G} px={px} py={py} m={slope} length={1.5}/>}

        {/* Active P */}
        <circle cx={toSvg(px, py, G).sx} cy={toSvg(px, py, G).sy} r={6}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>

        {/* Vertical tangent annotation */}
        {vAnnotation && (
          <SvgFadeIn duration={0.3} delay={0}>
            <text x={toSvg(Vpt.x + 0.25, Vpt.y - 0.15, G).sx}
                  y={toSvg(Vpt.x + 0.25, Vpt.y - 0.15, G).sy}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.12em">F_y = 0</text>
          </SvgFadeIn>
        )}
        {hAnnotation && (
          <SvgFadeIn duration={0.3} delay={0}>
            <text x={toSvg(Hpt.x + 0.10, Hpt.y + 0.25, G).sx}
                  y={toSvg(Hpt.x + 0.10, Hpt.y + 0.25, G).sy}
                  fill="var(--teal-400)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.12em">F_x = 0</text>
          </SvgFadeIn>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={150} bottom={60} top={null} width={520}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            slide P around · live slope
          </FadeUp>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, lineHeight: 1.5,
                        color: 'var(--chalk-200)' }}>
            <div><span style={{ color: 'var(--violet-400)' }}>F<sub>x</sub></span> = {fx.toFixed(2)}</div>
            <div><span style={{ color: 'var(--teal-400)' }}>F<sub>y</sub></span> = {fy.toFixed(2)}</div>
            <div style={{ color: 'var(--amber-300)' }}>
              dy/dx = {isNearVerticalTangent ? '±∞ (vertical)' : slope.toFixed(2)}
            </div>
          </div>
        </SoftPanel>
      ) : (
        <SoftPanel right={48} top={170} width={360}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            slide P · live slope
          </FadeUp>
          <FadeUp duration={0.45} delay={0.6} distance={6}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)', marginTop: 4 }}>
            dy/dx = −F<sub>x</sub> / F<sub>y</sub>
          </FadeUp>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, lineHeight: 1.6,
                        color: 'var(--chalk-200)', marginTop: 4 }}>
            <div><span style={{ color: 'var(--violet-400)' }}>F<sub>x</sub></span> = {fx.toFixed(2)}</div>
            <div><span style={{ color: 'var(--teal-400)' }}>F<sub>y</sub></span> = {fy.toFixed(2)}</div>
            <div style={{ color: 'var(--amber-300)' }}>
              dy/dx = {isNearVerticalTangent ? '±∞  (vertical)' : slope.toFixed(2)}
            </div>
          </div>
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
      gap: portrait ? 24 : 30,
      maxWidth: portrait ? 600 : 920,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>slope without solving</FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 46, color: 'var(--chalk-100)',
          lineHeight: 1.25, textAlign: 'center',
        }}>
        {portrait
          ? <>The curve hides <em>y</em>(<em>x</em>).<br/>The slope tells.</>
          : <>The level curve hides <em>y</em> of <em>x</em>. <br/>The slope tells.</>}
      </FadeUp>

      <FadeUp duration={0.6} delay={1.2} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 50, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        dy/dx = −F<sub>x</sub> / F<sub>y</sub>
      </FadeUp>

      <FadeUp duration={0.55} delay={2.4} distance={12}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '30ch' : '44ch', lineHeight: 1.4,
        }}>
        Two partial derivatives, one ratio, every tangent.
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
