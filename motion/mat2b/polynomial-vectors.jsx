// Polynomials Are Vectors Too — Manimo lesson scene.
// Chapter 1 (Vektorrom). The space P₂ of polynomials of degree at most 2
// is a 3-dimensional vector space. Each polynomial p(x) = a + bx + cx² is
// the linear combination a·1 + b·x + c·x² in the basis {1, x, x²}, and
// its coordinates are the triple [a, b, c]. Beat 3 scrubs (a, b, c)
// through keyframes — the coordinate stack and the polynomial curve
// morph in sync. Beat 4 adds two polynomials and shows the addition
// is component-wise on the coordinates.
//
// Beats:
//    0– 4   Manimo intro
//    4–13   Setup — formula, coordinate stack, polynomial graph
//   13–26   Scrub (a, b, c); curve morphs live
//   26–36   Add p(x) = 1 + x and q(x) = 2 − x²; coords add row-by-row
//   36–44   Takeaway
//
// Genuine animation: beat 3 drives the polynomial curve from useSprite
// localTime — every frame re-samples a + b·x + c·x² for the current
// keyframe-interpolated coefficients.

const SCENE_DURATION = 49;

const NARRATION = [
  /*  0– 4 */ 'What if a vector were not an arrow at all — but a polynomial?',
  /*  4–13 */ 'A polynomial of degree at most two is a plus b x plus c x squared. Three numbers a, b, c spell out the whole curve. Those three numbers are its coordinates in the basis one, x, and x squared.',
  /* 13–26 */ 'Now turn the dials. As a moves the curve up and down, b tilts it, and c bends it. Three numbers, one curve — they move together.',
  /* 26–36 */ 'Add two polynomials by adding their coordinate triples one row at a time. The graph of p plus q is exactly the curve whose coordinates are the sum.',
  /* 36–44 */ 'Polynomials of degree at most two form a three-dimensional vector space. The basis is one, x, x squared — the coordinates are the polynomial.',
];

const NARRATION_AUDIO = 'audio/polynomial-vectors/scene.mp3';

// Geometry for the polynomial graph viewport. The graph spans x∈[-2, 2] and
// y∈[-3, 4]; coordinates of (x, y) → SVG (sx, sy) via toGraph.
function graphGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 440, ox: 300, oy: 240, unitX: 90, unitY: 50,
        xMin: -2, xMax: 2, yMin: -3, yMax: 4 }
    : { vbW: 560, vbH: 460, ox: 280, oy: 240, unitX: 90, unitY: 50,
        xMin: -2, xMax: 2, yMin: -3, yMax: 4 };
}

function toGraph(G, x, y) {
  return { sx: G.ox + x * G.unitX, sy: G.oy - y * G.unitY };
}

function GraphFrame({ G }) {
  // Light grid + axes for the polynomial viewport.
  const xMin = G.xMin, xMax = G.xMax, yMin = G.yMin, yMax = G.yMax;
  const lines = [];
  for (let k = Math.ceil(xMin); k <= xMax; k++) {
    const a = toGraph(G, k, yMin);
    const b = toGraph(G, k, yMax);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.0}
                     opacity={0.18} strokeLinecap="round"/>);
  }
  for (let k = Math.ceil(yMin); k <= yMax; k++) {
    const a = toGraph(G, xMin, k);
    const b = toGraph(G, xMax, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.0}
                     opacity={0.18} strokeLinecap="round"/>);
  }
  // Axes
  const xA = toGraph(G, xMin, 0), xB = toGraph(G, xMax, 0);
  const yA = toGraph(G, 0, yMin), yB = toGraph(G, 0, yMax);
  return (
    <g>
      {lines}
      <line x1={xA.sx} y1={xA.sy} x2={xB.sx} y2={xB.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={yA.sx} y1={yA.sy} x2={yB.sx} y2={yB.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <text x={xB.sx + 8} y={xB.sy + 4}
            fill="var(--chalk-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={16}>x</text>
      <text x={yB.sx - 4} y={yB.sy - 6}
            fill="var(--chalk-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={16} textAnchor="end">y</text>
    </g>
  );
}

// Build an SVG path d= for y = a + b·x + c·x² over x ∈ [G.xMin, G.xMax].
function polyPath(G, a, b, c) {
  const N = 90;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const x = G.xMin + (G.xMax - G.xMin) * (i / N);
    const y = a + b * x + c * x * x;
    // Clip y to graph bounds for safety
    const yc = clamp(y, G.yMin - 0.5, G.yMax + 0.5);
    const p = toGraph(G, x, yc);
    pts.push(`${p.sx.toFixed(2)},${p.sy.toFixed(2)}`);
  }
  return 'M ' + pts.join(' L ');
}

// Coordinate stack — three rows showing a·1, b·x, c·x², with live values.
function CoordStack({ a, b, c, portrait, highlight = null }) {
  const rowStyle = {
    display: 'flex', alignItems: 'baseline', gap: 14,
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
  };
  const basisStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    color: 'var(--chalk-300)', fontSize: portrait ? 17 : 19,
  };
  const valStyle = (k) => ({
    color: highlight === k ? 'var(--rose-300)' : 'var(--amber-300)',
    width: portrait ? 60 : 64, textAlign: 'right',
  });
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--chalk-300)', letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        coordinates in basis {'{'}1, x, x²{'}'}
      </div>
      <div style={rowStyle}>
        <span style={valStyle('a')}>{a.toFixed(2)}</span>
        <span style={{ color: 'var(--chalk-300)' }}>·</span>
        <span style={basisStyle}>1</span>
      </div>
      <div style={rowStyle}>
        <span style={valStyle('b')}>{b.toFixed(2)}</span>
        <span style={{ color: 'var(--chalk-300)' }}>·</span>
        <span style={basisStyle}>x</span>
      </div>
      <div style={rowStyle}>
        <span style={valStyle('c')}>{c.toFixed(2)}</span>
        <span style={{ color: 'var(--chalk-300)' }}>·</span>
        <span style={basisStyle}>x²</span>
      </div>
    </div>
  );
}

function SoftPanel({ portrait, position, children }) {
  // position: 'left' | 'right' | 'bottom'
  let frame;
  if (portrait) {
    frame = { left: 48, right: 48, top: position === 'top' ? 220 : 880, bottom: position === 'top' ? 'auto' : 100 };
  } else if (position === 'left') {
    frame = { left: 60, top: 260, width: 320 };
  } else {
    frame = { right: 60, top: 260, width: 320 };
  }
  return (
    <div style={{
      position: 'absolute',
      ...frame,
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

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="abstract vector spaces"
      title="Polynomials Are Vectors Too"
      duration={SCENE_DURATION}
      introEnd={4.4}
      introCaption="What if a vector were not an arrow — but a polynomial?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.4} end={19.38}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={19.38} end={28.42}>
        <ScrubBeat/>
      </Sprite>

      <Sprite start={28.42} end={38.16}>
        <AddBeat/>
      </Sprite>

      <Sprite start={38.16} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup — formula + coordinate stack + graph ───────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = graphGeom(portrait);
  // Default polynomial for the setup beat: p(x) = 0.6 + 0.8·x + 0.4·x²
  const a = 0.6, b = 0.8, c = 0.4;
  return (
    <>
      {/* Formula banner */}
      <div style={{
        position: 'absolute', left: '50%', top: portrait ? 200 : 130,
        transform: 'translateX(-50%)',
      }}>
        <FadeUp duration={0.5} delay={0.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 30 : 36, color: 'var(--chalk-100)',
            letterSpacing: '0.02em', textAlign: 'center',
          }}>
            p(x) = a + b·x + c·x²
        </FadeUp>
      </div>

      {/* Graph in centre */}
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '46%' : '56%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.5} delay={1.6}>
            <GraphFrame G={G}/>
          </SvgFadeIn>
          <TraceIn d={polyPath(G, a, b, c)}
                   stroke="var(--amber-400)" strokeWidth={3.4}
                   fill="none" duration={1.4} delay={2.4}/>
        </svg>
      </div>

      <SoftPanel portrait={portrait} position="left">
        <FadeUp duration={0.4} delay={1.0} distance={6}>
          <CoordStack a={a} b={b} c={c} portrait={portrait}/>
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '28ch', marginTop: 4,
          }}>
          three numbers describe the whole curve.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Scrub (a, b, c) — curve morphs in sync ───────────────────────
function ScrubBeat() {
  const portrait = usePortrait();
  const G = graphGeom(portrait);
  const { localTime } = useSprite();

  // Keyframes of (a, b, c). Hand-picked so the curve does something visible
  // at every transition: lift, tilt, bend, flip.
  const KFS = [
    [ 0.0,  0.0,  0.0],   // baseline (y = 0)
    [ 1.5,  0.0,  0.0],   // lift up (a)
    [ 1.5,  1.4,  0.0],   // tilt right (b)
    [ 1.5,  1.4,  0.7],   // bend upward (c > 0)
    [ 0.5, -1.0,  0.7],   // shift left
    [ 1.0,  0.0, -0.9],   // flip downward (c < 0)
    [ 1.0,  1.6, -0.6],   // settle
  ];
  const sweepStart = 0.6, sweepEnd = 7.5;
  const phase = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);
  function kfAt(p) {
    if (p <= 0) return KFS[0];
    if (p >= 1) return KFS[KFS.length - 1];
    const seg = p * (KFS.length - 1);
    const i = Math.floor(seg);
    const u = seg - i;
    const e = Easing.easeInOutCubic(u);
    const k0 = KFS[i], k1 = KFS[i + 1];
    return [
      k0[0] + (k1[0] - k0[0]) * e,
      k0[1] + (k1[1] - k0[1]) * e,
      k0[2] + (k1[2] - k0[2]) * e,
    ];
  }
  const [aVal, bVal, cVal] = (localTime < sweepStart) ? KFS[0] : kfAt(phase);

  // Which coefficient is moving fastest? Highlight it so the eye learns
  // which dial controls which deformation. Compute derivative w.r.t. phase
  // via finite difference.
  let highlight = null;
  if (localTime >= sweepStart && phase < 1) {
    const d = 0.005;
    const k1 = kfAt(clamp(phase - d, 0, 1));
    const k2 = kfAt(clamp(phase + d, 0, 1));
    const da = Math.abs(k2[0] - k1[0]);
    const db = Math.abs(k2[1] - k1[1]);
    const dc = Math.abs(k2[2] - k1[2]);
    const mx = Math.max(da, db, dc);
    if (mx > 0.002) {
      if (mx === da) highlight = 'a';
      else if (mx === db) highlight = 'b';
      else highlight = 'c';
    }
  }

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '46%' : '56%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <GraphFrame G={G}/>
          </SvgFadeIn>
          {/* Live polynomial curve */}
          <path d={polyPath(G, aVal, bVal, cVal)}
                fill="none" stroke="var(--amber-400)"
                strokeWidth={3.4} strokeLinecap="round"/>
          {/* Dot marking y(0) = a — emphasises the "a moves it up/down" idea */}
          {(() => {
            const p = toGraph(G, 0, aVal);
            return <circle cx={p.sx} cy={p.sy} r={5}
                           fill="var(--amber-300)"
                           stroke="var(--chalk-100)" strokeWidth={1.2}/>;
          })()}
        </svg>
      </div>

      <SoftPanel portrait={portrait} position="left">
        <FadeUp duration={0.4} delay={0.3} distance={6}>
          <CoordStack a={aVal} b={bVal} c={cVal} portrait={portrait}
                      highlight={highlight}/>
        </FadeUp>
        <FadeUp duration={0.5} delay={7.8} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-100)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '28ch', marginTop: 4,
          }}>
          the coordinate triple <em>is</em> the polynomial.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Add p(x) = 1 + x and q(x) = 2 − x² ───────────────────────────
function AddBeat() {
  const portrait = usePortrait();
  const G = graphGeom(portrait);
  const { localTime } = useSprite();

  // p(x) = 1 + x         → [1, 1, 0]
  // q(x) = 2 − x²        → [2, 0, -1]
  // p+q   = 3 + x − x²   → [3, 1, -1]
  const P = [1, 1, 0];
  const Q = [2, 0, -1];
  const S = [P[0] + Q[0], P[1] + Q[1], P[2] + Q[2]];

  // Stagger: p curve appears at delay 0.6, q at 1.6, sum at 4.0.
  const showP = localTime > 0.6;
  const showQ = localTime > 1.6;
  const buildSum = clamp((localTime - 4.0) / 1.5, 0, 1);
  // The sum curve animates from p's shape → sum shape via cross-fade morph,
  // i.e. coefficients lerp from P → S so the curve emerges from p.
  const e = Easing.easeInOutCubic(buildSum);
  const sumCoeff = [
    P[0] + (S[0] - P[0]) * e,
    P[1] + (S[1] - P[1]) * e,
    P[2] + (S[2] - P[2]) * e,
  ];

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '46%' : '56%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <GraphFrame G={G}/>
          </SvgFadeIn>

          {showP && (
            <path d={polyPath(G, P[0], P[1], P[2])}
                  fill="none" stroke="var(--violet-400)"
                  strokeWidth={2.6} strokeLinecap="round" opacity={0.85}/>
          )}
          {showQ && (
            <path d={polyPath(G, Q[0], Q[1], Q[2])}
                  fill="none" stroke="var(--teal-400)"
                  strokeWidth={2.6} strokeLinecap="round" opacity={0.85}/>
          )}
          {buildSum > 0 && (
            <path d={polyPath(G, sumCoeff[0], sumCoeff[1], sumCoeff[2])}
                  fill="none" stroke="var(--amber-400)"
                  strokeWidth={3.4} strokeLinecap="round"/>
          )}

          {/* Small legend labels right of each curve at x = 1.7 */}
          {showP && (
            <SvgFadeIn duration={0.4} delay={0.8}>
              {(() => {
                const pt = toGraph(G, 1.7, P[0] + P[1] * 1.7 + P[2] * 1.7 * 1.7);
                return <text x={pt.sx + 8} y={pt.sy + 4}
                             fill="var(--violet-400)" fontFamily="var(--font-serif)"
                             fontStyle="italic" fontSize={16}>p</text>;
              })()}
            </SvgFadeIn>
          )}
          {showQ && (
            <SvgFadeIn duration={0.4} delay={1.8}>
              {(() => {
                const pt = toGraph(G, 1.7, Q[0] + Q[1] * 1.7 + Q[2] * 1.7 * 1.7);
                return <text x={pt.sx + 8} y={pt.sy + 4}
                             fill="var(--teal-400)" fontFamily="var(--font-serif)"
                             fontStyle="italic" fontSize={16}>q</text>;
              })()}
            </SvgFadeIn>
          )}
          {buildSum >= 0.97 && (
            <SvgFadeIn duration={0.4} delay={0.0}>
              {(() => {
                const pt = toGraph(G, 1.7, S[0] + S[1] * 1.7 + S[2] * 1.7 * 1.7);
                return <text x={pt.sx + 8} y={pt.sy + 4}
                             fill="var(--amber-300)" fontFamily="var(--font-serif)"
                             fontStyle="italic" fontSize={16}>p+q</text>;
              })()}
            </SvgFadeIn>
          )}
        </svg>
      </div>

      <SoftPanel portrait={portrait} position="left">
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          add row-by-row
        </FadeUp>
        <FadeUp duration={0.5} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 16,
            color: 'var(--violet-400)', lineHeight: 1.4, marginTop: 4,
          }}>
            p(x) = 1 + x &nbsp;&nbsp;→&nbsp; [1; 1; 0]
        </FadeUp>
        <FadeUp duration={0.5} delay={1.6} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 16,
            color: 'var(--teal-400)', lineHeight: 1.4,
          }}>
            q(x) = 2 − x² &nbsp;→&nbsp; [2; 0; −1]
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
            color: 'var(--amber-300)', lineHeight: 1.4, marginTop: 4,
          }}>
            sum: [3; 1; −1]
        </FadeUp>
        <FadeUp duration={0.5} delay={5.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '28ch', marginTop: 4,
          }}>
          adding polynomials = adding coordinates.
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
          fontSize: portrait ? 38 : 48, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        P₂ is <span style={{ color: 'var(--amber-300)' }}>3-dimensional</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '44ch', lineHeight: 1.4,
        }}>
          basis {'{'}1, x, x²{'}'} — coordinates [a; b; c].
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
