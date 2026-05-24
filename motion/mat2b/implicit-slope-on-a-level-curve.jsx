// Implicit Differentiation: Slope Along a Level Curve — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). A curve defined implicitly
// by f(x, y) = c has slope dy/dx = -f_x / f_y. Demonstrated on the tilted
// ellipse
//   f(x, y) = x² + xy + y² = 2
// (quadratic form [[1, 0.5],[0.5, 1]], eigenvalues 1.5 and 0.5, so the
// principal axes lie along (1, 1) and (1, -1)). A point slides around the
// curve while the tangent (perpendicular to ∇f) and the live slope readout
// track it — the genuine-motion beat.
//
// Beats:
//    0– 5   Manimo hook (owned by SceneChrome introEnd journey)
//    5–15   Curve + gradient perpendicular to it
//   15–26   Derive dy/dx = -f_x/f_y from df = 0
//   26–40   Slide P around the curve, tangent + slope update live
//   40–end  Hero outro
//
// Colour discipline:
//   amber-400  the level curve
//   rose-400   gradient ∇f
//   teal-400   tangent to the curve
//   chalk-200  axes / body
//   amber-300  payoff accent

const SCENE_DURATION = 48;

const NARRATION = [
  "Some curves twist so much you can never solve for y. Can we still find their slope?",
  "Here is a curve where f of x and y stays equal to a constant. The gradient of f points straight across it, at a right angle everywhere.",
  "Walk a tiny step along the curve and f does not change. So f sub x times d x plus f sub y times d y is zero, which rearranges to d y by d x equals minus f sub x over f sub y.",
  "Slide the point around the curve. At every spot the tangent slope is exactly minus f sub x over f sub y, and it turns as the gradient turns.",
  "Constant along the curve means the change cancels — so the slope is minus the x partial over the y partial.",
];

const NARRATION_AUDIO = 'audio/implicit-slope-on-a-level-curve/scene.mp3';

// ─── Geometry helpers ─────────────────────────────────────────────────────
function planeGeom(portrait) {
  return portrait
    ? { ox: 360, oy: 540, unit: 78, W: 720, H: 1280 }
    : { ox: 440, oy: 380, unit: 92, W: 1280, H: 720 };
}
function panelProps(portrait, wL = 380, wP = 600) {
  return portrait
    ? { left: '50%', transform: 'translateX(-50%)', bottom: 200, width: wP }
    : { right: 56, top: 188, width: wL };
}

// f(x,y) = x² + xy + y² = 2.  Parametrise the level curve in its eigenframe:
//   u1 = (1, 1)/√2  (λ1 = 1.5),  u2 = (1, -1)/√2  (λ2 = 0.5)
const C_LEVEL = 2;
function ellipsePoint(theta) {
  const r1 = Math.sqrt(C_LEVEL / 1.5);
  const r2 = Math.sqrt(C_LEVEL / 0.5);
  const s = Math.SQRT1_2;
  const a = r1 * Math.cos(theta);
  const b = r2 * Math.sin(theta);
  return { x: (a + b) * s, y: (a - b) * s };
}
function gradAt(x, y) { return { gx: 2 * x + y, gy: x + 2 * y }; }

function ellipseD(P, samples = 96) {
  let d = '';
  for (let i = 0; i <= samples; i++) {
    const { x, y } = ellipsePoint((i / samples) * 2 * Math.PI);
    const p = P(x, y);
    d += `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)} `;
  }
  return d + 'Z';
}

function Arrow({ ax, ay, bx, by, color, strokeWidth = 3, headLen = 12, headHalf = 7, opacity = 1 }) {
  const dx = bx - ax, dy = by - ay;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = bx - ux * headLen, baseY = by - uy * headLen;
  const px = -uy, py = ux;
  const lx = baseX + px * headHalf, ly = baseY + py * headHalf;
  const rx = baseX - px * headHalf, ry = baseY - py * headHalf;
  return (
    <g opacity={opacity}>
      <line x1={ax} y1={ay} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${bx} ${by} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
    </g>
  );
}

function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom, transform }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined, transform }
    : { right, top, transform };
  return (
    <div style={{
      position: 'absolute', width, ...positioning,
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>
      {children}
    </div>
  );
}

function PlaneSvg({ G, children }) {
  // x/y axes drawn to the canvas edges of the working region.
  const xL = { sx: G.ox - 2.6 * G.unit, sy: G.oy };
  const xR = { sx: G.ox + 2.6 * G.unit, sy: G.oy };
  const yT = { sx: G.ox, sy: G.oy - 2.4 * G.unit };
  const yB = { sx: G.ox, sy: G.oy + 2.4 * G.unit };
  return (
    <svg width={G.W} height={G.H} viewBox={`0 0 ${G.W} ${G.H}`}
         style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <line x1={xL.sx} y1={xL.sy} x2={xR.sx} y2={xR.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.6} strokeLinecap="round"/>
      <line x1={yT.sx} y1={yT.sy} x2={yB.sx} y2={yB.sy}
            stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.6} strokeLinecap="round"/>
      <text x={xR.sx + 12} y={xR.sy + 5} fill="var(--chalk-300)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>x</text>
      <text x={yT.sx - 16} y={yT.sy - 6} fill="var(--chalk-300)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>y</text>
      {children}
    </svg>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="implicit differentiation"
      title="Slope Along a Level Curve"
      duration={SCENE_DURATION}
      introEnd={5.78}
      introCaption="A curve you can't solve — what's its slope?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.78} end={15.08}>
        <CurveSetupBeat/>
      </Sprite>

      <Sprite start={15.08} end={30.33}>
        <DeriveBeat/>
      </Sprite>

      <Sprite start={30.33} end={40.12}>
        <SlideBeat/>
      </Sprite>

      <Sprite start={40.12} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: the curve + perpendicular gradient ───────────────────────────
function CurveSetupBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = planeGeom(portrait);
  const P = (x, y) => ({ sx: G.ox + x * G.unit, sy: G.oy - y * G.unit });

  // One sample point for the perpendicular-gradient illustration.
  const sample = ellipsePoint(0.6);
  const { gx, gy } = gradAt(sample.x, sample.y);
  const gmag = Math.hypot(gx, gy);
  const base = P(sample.x, sample.y);
  const tip = P(sample.x + (gx / gmag) * 0.95, sample.y + (gy / gmag) * 0.95);

  return (
    <>
      <PlaneSvg G={G}>
        <TraceIn d={ellipseD(P)} stroke="var(--amber-400)" strokeWidth={3}
                 fill="none" duration={1.3} delay={0.3}/>
        {localTime > 2.2 && (
          <SvgFadeIn duration={0.4} delay={0}>
            <circle cx={base.sx} cy={base.sy} r={4.5}
                    fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
            <Arrow ax={base.sx} ay={base.sy} bx={tip.sx} by={tip.sy}
                   color="var(--rose-400)" strokeWidth={3.2}/>
            <text x={tip.sx + 8} y={tip.sy - 6} fill="var(--rose-300)"
                  fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>∇f</text>
          </SvgFadeIn>
        )}
      </PlaneSvg>

      <SoftPanel {...panelProps(portrait)}>
        <FadeUp duration={0.4} delay={0.2} distance={8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                   letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          a level curve
        </FadeUp>
        <FadeUp duration={0.5} delay={1.0} distance={10}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: portrait ? 22 : 26,
                   color: 'var(--chalk-100)' }}>
          f(x, y) = x² + xy + y² = c
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: portrait ? 16 : 18,
                   color: 'var(--chalk-300)', lineHeight: 1.4, maxWidth: '32ch' }}>
          The gradient <span style={{ color: 'var(--rose-300)' }}>∇f</span> crosses the curve
          at a right angle, everywhere.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: derive dy/dx = -f_x/f_y ──────────────────────────────────────
function DeriveBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 26 : 30, letterSpacing: '0.01em',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: portrait ? 20 : 26,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        differentiate the constraint
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        f stays constant&nbsp;&nbsp;⇒&nbsp;&nbsp;df = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-100)' }}>
        f<sub>x</sub> dx + f<sub>y</sub> dy = 0
      </FadeUp>

      <FadeUp duration={0.6} delay={2.8} distance={14}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 44 : 52, color: 'var(--amber-300)', marginTop: 6 }}>
        dy/dx = −f<sub>x</sub> / f<sub>y</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={4.2} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-300)', textAlign: 'center', maxWidth: portrait ? '26ch' : 'none' }}>
        No need to solve for y — just take partials.
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: slide the point, slope updates live ──────────────────────────
function SlideBeat() {
  const portrait = usePortrait();
  const { progress } = useSprite();
  const G = planeGeom(portrait);
  const P = (x, y) => ({ sx: G.ox + x * G.unit, sy: G.oy - y * G.unit });

  // Sweep θ once around the curve over the middle of the beat.
  const sweep = clamp((progress - 0.12) / 0.74, 0, 1);
  const theta = sweep * 2 * Math.PI;
  const pt = ellipsePoint(theta);
  const { gx, gy } = gradAt(pt.x, pt.y);
  const gmag = Math.hypot(gx, gy);

  // Tangent (perpendicular to gradient).
  const tx = -gy / gmag, ty = gx / gmag;
  const half = 1.45;
  const tA = P(pt.x - tx * half, pt.y - ty * half);
  const tB = P(pt.x + tx * half, pt.y + ty * half);

  // Gradient arrow, fixed display length.
  const base = P(pt.x, pt.y);
  const gtip = P(pt.x + (gx / gmag) * 0.9, pt.y + (gy / gmag) * 0.9);

  const fx = gx, fy = gy;
  const nearVertical = Math.abs(fy) < 0.16 * gmag;
  const slope = -fx / fy;
  const slopeStr = nearVertical ? '→ vertical' : (slope >= 0 ? '+' : '') + slope.toFixed(2);

  return (
    <>
      <PlaneSvg G={G}>
        <path d={ellipseD(P)} fill="none" stroke="var(--amber-400)" strokeWidth={2.6} opacity={0.85}/>
        {/* Tangent line */}
        <line x1={tA.sx} y1={tA.sy} x2={tB.sx} y2={tB.sy}
              stroke="var(--teal-400)" strokeWidth={3} strokeLinecap="round"/>
        {/* Gradient arrow */}
        <Arrow ax={base.sx} ay={base.sy} bx={gtip.sx} by={gtip.sy}
               color="var(--rose-400)" strokeWidth={3} opacity={0.9}/>
        {/* Sliding point */}
        <circle cx={base.sx} cy={base.sy} r={6}
                fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
        <text x={base.sx + 12} y={base.sy - 10} fill="var(--chalk-200)"
              fontFamily="var(--font-serif)" fontStyle="italic" fontSize={16}>P</text>
      </PlaneSvg>

      <SoftPanel {...panelProps(portrait)}>
        <FadeUp duration={0.4} delay={0.2} distance={8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                   letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          slope, point by point
        </FadeUp>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 16,
                      color: 'var(--chalk-200)', lineHeight: 1.7 }}>
          <div>P = ({pt.x.toFixed(2)}, {pt.y.toFixed(2)})</div>
          <div><span style={{ color: 'var(--violet-400)' }}>f<sub>x</sub></span> = {fx.toFixed(2)}
            &nbsp;&nbsp;
            <span style={{ color: 'var(--teal-300)' }}>f<sub>y</sub></span> = {fy.toFixed(2)}</div>
        </div>

        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                      fontSize: portrait ? 26 : 30, color: 'var(--amber-300)', marginTop: 2 }}>
          dy/dx = <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>{slopeStr}</span>
        </div>

        <div style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                      color: 'var(--chalk-300)', lineHeight: 1.4, maxWidth: '34ch' }}>
          The <span style={{ color: 'var(--teal-400)' }}>tangent</span> stays perpendicular to
          <span style={{ color: 'var(--rose-300)' }}> ∇f</span> as P moves.
        </div>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: hero outro ───────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      maxWidth: portrait ? 560 : 980,
    }}>
      <FadeUp duration={0.45} delay={0} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        implicit slope
      </FadeUp>
      <FadeUp duration={0.8} delay={0.35} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 34 : 50, color: 'var(--chalk-100)', lineHeight: 1.2 }}>
        The slope is just <br/>
        <span style={{ color: 'var(--amber-300)' }}>minus f<sub>x</sub> over f<sub>y</sub>.</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 20 : 24, color: 'var(--chalk-200)', maxWidth: '40ch', lineHeight: 1.3 }}>
        Differentiate the constraint, not the curve.
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
