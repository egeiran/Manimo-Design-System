// Linear Combinations: Mix Two Arrows — Manimo lesson scene.
// Chapter 1 (Vektorrom). Two arrows v1 and v2; two scalar dials a and b.
// Beat 3 fixes b=0 and sweeps a — the output point P = a·v1 + b·v2 slides
// along a line through the origin. Beat 4 turns both dials simultaneously
// (Lissajous-style); the output point wanders the plane, leaving a trail
// that demonstrates the span fills R^2.
//
// Beats:
//    0– 4   Manimo intro
//    4–11   Two vectors + recipe formula
//   11–21   Sweep a (b = 0): line trail
//   21–31   Sweep a and b: plane trail
//   31–36   Hero takeaway
//
// Genuine animation: the output dot in beats 3 and 4 is driven by
// useSprite localTime, not by FadeUp/TraceIn.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0– 4 */ 'What can you build with just two arrows and a pair of dials?',
  /*  4–11 */ 'Pick two arrows v one and v two. A linear combination is a v one plus b v two, where a and b are any two real numbers. That formula is the recipe.',
  /* 11–21 */ 'Fix b at zero and sweep the dial for a. The output point slides along a single line through the origin — the line of every multiple of v one.',
  /* 21–31 */ 'Now turn both dials at once. The point wanders all over the plane. Every reachable spot is some recipe a v one plus b v two — that whole region is the span.',
  /* 31–36 */ 'Linear combinations are how you turn arrows into reach. Two dials, two arrows, the whole plane.',
];

const NARRATION_AUDIO = 'audio/linear-combination-recipe/scene.mp3';

// ─── Geometry helpers (per-aspect) ────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vbW: 640, vbH: 680, ox: 320, oy: 360, unit: 52,
        gridXMin: -5, gridXMax: 5, gridYMin: -5, gridYMax: 5 }
    : { vbW: 760, vbH: 580, ox: 380, oy: 300, unit: 56,
        gridXMin: -6, gridXMax: 6, gridYMin: -4, gridYMax: 4 };
}

function toSvgF(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function ReferenceGridSvg({ G, opacity = 0.22 }) {
  const lines = [];
  for (let k = G.gridXMin; k <= G.gridXMax; k++) {
    const a = toSvgF(G, k, G.gridYMin);
    const b = toSvgF(G, k, G.gridYMax);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = G.gridYMin; k <= G.gridYMax; k++) {
    const a = toSvgF(G, G.gridXMin, k);
    const b = toSvgF(G, G.gridXMax, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes2DSvg({ G }) {
  const l = toSvgF(G, G.gridXMin, 0), r = toSvgF(G, G.gridXMax, 0);
  const b = toSvgF(G, 0, G.gridYMin), t = toSvgF(G, 0, G.gridYMax);
  return (
    <g>
      <line x1={l.sx} y1={l.sy} x2={r.sx} y2={r.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={t.sx} y1={t.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
    </g>
  );
}

function ArrowFromOrigin({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                          strokeWidth = 3.4, progress = 1, opacity = 1,
                          dashed = false }) {
  const a = toSvgF(G, 0, 0);
  const b = toSvgF(G, x * progress, y * progress);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const headLen = 12, headHalf = 6.5;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g style={{ opacity }}>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '6 5' : undefined}/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && progress > 0.85 && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ G, portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 920, bottom: 100 }
        : { right: 60, top: 250, width: 360 }),
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: portrait ? 'center' : 'flex-start',
      textAlign: portrait ? 'center' : 'left',
      gap: 12,
    }}>
      {children}
    </div>
  );
}

// The two source vectors, chosen non-parallel so they span R^2.
const V1 = [2.6, 0.4];
const V2 = [-0.7, 1.9];

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="vector spaces"
      title="Linear Combinations"
      duration={SCENE_DURATION}
      introEnd={3.88}
      introCaption="Two arrows. Two dials. How far does that get you?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.88} end={15.45}>
        <RecipeBeat/>
      </Sprite>

      <Sprite start={15.45} end={25.36}>
        <SweepABeat/>
      </Sprite>

      <Sprite start={25.36} end={36.84}>
        <SweepBothBeat/>
      </Sprite>

      <Sprite start={36.84} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Two vectors + recipe formula ─────────────────────────────────
function RecipeBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.2}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.6}>
            <ArrowFromOrigin G={G} x={V1[0]} y={V1[1]}
                             color="var(--violet-400)"
                             label="v₁" labelDX={24} labelDY={16}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={1.2}>
            <ArrowFromOrigin G={G} x={V2[0]} y={V2[1]}
                             color="var(--teal-400)"
                             label="v₂" labelDX={-22} labelDY={-2}/>
          </SvgFadeIn>
          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel G={G} portrait={portrait}>
        <FadeUp duration={0.4} delay={2.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          the recipe
        </FadeUp>
        <FadeUp duration={0.6} delay={2.4} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 28 : 34, color: 'var(--chalk-100)',
            lineHeight: 1.2, marginTop: 4,
          }}>
            p = a&nbsp;<span style={{ color: 'var(--violet-400)' }}>v₁</span>&nbsp;+&nbsp;
            b&nbsp;<span style={{ color: 'var(--teal-400)' }}>v₂</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          a and b are dials — any two real numbers.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Sweep a (b = 0) ──────────────────────────────────────────────
// Sweep `a` over [-2, 2], leaving a trail. Output point P = a·V1.
function SweepABeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // Sweep window: start at t=1.0s, end at t=8.5s; total 7.5s for a smooth
  // back-and-forth motion. Eases give a "drag the dial" feel.
  const aMin = -2, aMax = 2;
  const sweepStart = 1.0, sweepEnd = 8.5;
  const phase = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);
  // Use a triangle wave for one round trip then settle in middle:
  //   0   → -2
  //   0.4 → +2
  //   0.7 → -1
  //   1.0 → +1.5
  // Implemented as easing through keyframes.
  function aAt(p) {
    if (p < 0.4)        return aMin + (aMax - aMin) * Easing.easeInOutCubic(p / 0.4);
    if (p < 0.7)        return aMax + (-1 - aMax) * Easing.easeInOutCubic((p - 0.4) / 0.3);
    return -1 + (1.5 - -1) * Easing.easeInOutCubic((p - 0.7) / 0.3);
  }
  const aVal = phase > 0 ? aAt(phase) : aMin;

  // Trail samples: every 0.06s from sweepStart to current localTime.
  const trailPoints = [];
  if (localTime >= sweepStart) {
    const tEnd = Math.min(localTime, sweepEnd);
    const dt = 0.06;
    for (let t = sweepStart; t <= tEnd; t += dt) {
      const p = clamp((t - sweepStart) / (sweepEnd - sweepStart), 0, 1);
      const aT = aAt(p);
      const pos = toSvgF(G, aT * V1[0], aT * V1[1]);
      trailPoints.push(`${pos.sx.toFixed(1)},${pos.sy.toFixed(1)}`);
    }
  }
  const trailD = trailPoints.length > 1 ? 'M ' + trailPoints.join(' L ') : '';

  // Current output point.
  const outPt = toSvgF(G, aVal * V1[0], aVal * V1[1]);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* v1 and v2 in faded background */}
          <ArrowFromOrigin G={G} x={V1[0]} y={V1[1]}
                           color="var(--violet-400)" opacity={0.6}
                           label="v₁" labelDX={22} labelDY={16}/>
          <ArrowFromOrigin G={G} x={V2[0]} y={V2[1]}
                           color="var(--teal-400)" opacity={0.4}
                           label="v₂" labelDX={-22} labelDY={-2} strokeWidth={2.6}/>

          {/* Trail (the line traced out by aV1 as a sweeps) */}
          {trailD && (
            <path d={trailD} fill="none" stroke="var(--amber-300)"
                  strokeWidth={3} strokeLinecap="round" opacity={0.95}/>
          )}

          {/* Output point P = a · v1 */}
          {localTime >= sweepStart && (
            <g>
              <line x1={toSvgF(G, 0, 0).sx} y1={toSvgF(G, 0, 0).sy}
                    x2={outPt.sx} y2={outPt.sy}
                    stroke="var(--amber-400)" strokeWidth={3.4}
                    strokeLinecap="round" opacity={0.85}/>
              <circle cx={outPt.sx} cy={outPt.sy} r={9}
                      fill="var(--amber-300)" stroke="var(--chalk-100)" strokeWidth={1.8}/>
            </g>
          )}

          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel G={G} portrait={portrait}>
        <FadeUp duration={0.4} delay={0.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          one dial
        </FadeUp>
        <FadeUp duration={0.55} delay={0.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            p = a&nbsp;<span style={{ color: 'var(--violet-400)' }}>v₁</span>,
            &nbsp;b = 0
        </FadeUp>
        {/* Live a readout */}
        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
            color: 'var(--amber-300)', marginTop: 6,
          }}>
            a = {aVal.toFixed(2)}
        </FadeUp>
        <FadeUp duration={0.5} delay={6.0} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          P traces the line spanned by v₁.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Sweep a and b ────────────────────────────────────────────────
// Both dials sweep simultaneously along low-frequency sinusoids of
// different periods (so the (a, b) pair traces a Lissajous-like path
// that covers a region of the plane).
function SweepBothBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  const sweepStart = 0.6;
  // a(t) ranges over [-1.8, 1.8] with period 4.8s.
  // b(t) ranges over [-1.6, 1.6] with period 6.4s.
  function abAt(t) {
    if (t < sweepStart) return null;
    const dt = t - sweepStart;
    const a = 1.8 * Math.sin((2 * Math.PI / 4.8) * dt);
    const b = 1.6 * Math.sin((2 * Math.PI / 6.4) * dt + Math.PI / 2);
    return [a, b];
  }
  const ab = abAt(localTime);

  // Trail samples: every 0.08s from sweepStart up to current localTime.
  const trailPoints = [];
  if (localTime >= sweepStart) {
    const dt = 0.08;
    for (let t = sweepStart; t <= localTime; t += dt) {
      const [a, b] = abAt(t);
      const x = a * V1[0] + b * V2[0];
      const y = a * V1[1] + b * V2[1];
      const pos = toSvgF(G, x, y);
      trailPoints.push(`${pos.sx.toFixed(1)},${pos.sy.toFixed(1)}`);
    }
  }
  const trailD = trailPoints.length > 1 ? 'M ' + trailPoints.join(' L ') : '';

  // Current output point and parallelogram construction.
  let outPt = null, aV1Pt = null, bV2EndPt = null;
  let aVal = 0, bVal = 0;
  if (ab) {
    [aVal, bVal] = ab;
    const x = aVal * V1[0] + bVal * V2[0];
    const y = aVal * V1[1] + bVal * V2[1];
    outPt = toSvgF(G, x, y);
    aV1Pt = toSvgF(G, aVal * V1[0], aVal * V1[1]);
    bV2EndPt = outPt;
  }

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* v1 and v2 faded in background */}
          <ArrowFromOrigin G={G} x={V1[0]} y={V1[1]}
                           color="var(--violet-400)" opacity={0.45} strokeWidth={2.4}
                           label="v₁" labelDX={22} labelDY={16}/>
          <ArrowFromOrigin G={G} x={V2[0]} y={V2[1]}
                           color="var(--teal-400)" opacity={0.45} strokeWidth={2.4}
                           label="v₂" labelDX={-22} labelDY={-2}/>

          {/* Trail */}
          {trailD && (
            <path d={trailD} fill="none" stroke="var(--amber-300)"
                  strokeWidth={2.2} strokeLinecap="round" opacity={0.7}/>
          )}

          {/* Parallelogram-of-the-recipe: dashed segments showing
              a·v1 and b·v2 adding to P. */}
          {outPt && aV1Pt && (
            <g opacity={0.85}>
              {/* a · v1 step */}
              <line x1={toSvgF(G, 0, 0).sx} y1={toSvgF(G, 0, 0).sy}
                    x2={aV1Pt.sx} y2={aV1Pt.sy}
                    stroke="var(--violet-400)" strokeWidth={2}
                    strokeDasharray="6 4" opacity={0.8}/>
              {/* b · v2 step from a·v1 to P */}
              <line x1={aV1Pt.sx} y1={aV1Pt.sy}
                    x2={outPt.sx} y2={outPt.sy}
                    stroke="var(--teal-400)" strokeWidth={2}
                    strokeDasharray="6 4" opacity={0.8}/>
            </g>
          )}

          {/* Output point */}
          {outPt && (
            <g>
              <line x1={toSvgF(G, 0, 0).sx} y1={toSvgF(G, 0, 0).sy}
                    x2={outPt.sx} y2={outPt.sy}
                    stroke="var(--amber-400)" strokeWidth={3.4}
                    strokeLinecap="round" opacity={0.92}/>
              <circle cx={outPt.sx} cy={outPt.sy} r={9}
                      fill="var(--amber-300)" stroke="var(--chalk-100)" strokeWidth={1.8}/>
            </g>
          )}

          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel G={G} portrait={portrait}>
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          both dials
        </FadeUp>
        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            p = a&nbsp;<span style={{ color: 'var(--violet-400)' }}>v₁</span>&nbsp;+&nbsp;
            b&nbsp;<span style={{ color: 'var(--teal-400)' }}>v₂</span>
        </FadeUp>
        {/* Live (a, b) readout */}
        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
            color: 'var(--amber-300)', marginTop: 6,
          }}>
            a = {aVal.toFixed(2)},&nbsp; b = {bVal.toFixed(2)}
        </FadeUp>
        <FadeUp duration={0.5} delay={5.0} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          Two non-parallel arrows fill the whole plane.
        </FadeUp>
      </SoftPanel>
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
      textAlign: 'center', maxWidth: portrait ? 600 : 900,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.8} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 50, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        Two dials, two arrows — the whole <span style={{ color: 'var(--amber-300)' }}>plane</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '40ch', lineHeight: 1.4,
        }}>
        That reachable region is the span.
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION}
           background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
