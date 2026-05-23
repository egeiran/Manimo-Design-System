// AB Means B First, Then A — Manimo lesson scene.
// Mat2B chapter 2 (Lineærtransformasjoner). Matrix multiplication is
// function composition. Applying B then A gives the matrix AB. Order
// matters: AB ≠ BA in general — different transformations land in
// different places.
//
// A = R(45°)  (rotation by 45°)        [cos45  -sin45]
//                                       [sin45   cos45]
// B = diag(2, 0.5)  (stretch x, squeeze y)   [2  0  ]
//                                            [0  0.5]
//
// AB e1 = A(B e1) = A(2,0)     = (1.414,  1.414)
// AB e2 = A(B e2) = A(0,0.5)   = (-0.354, 0.354)
// BA e1 = B(A e1) = B(0.707,0.707) = (1.414, 0.354)
// BA e2 = B(A e2) = B(-0.707,0.707)= (-1.414, 0.354)
//
// Authoring notes:
//   • SvgFadeIn inside SVG, FadeUp outside. SceneChrome owns title,
//     watermark, corner mascot.
//   • The two-step morph in beat 3 (B then A applied to the unit
//     square) is the genuine animation: continuous interpolation
//     identity → B-applied → BA-applied, with the basis vectors and
//     unit-square corners tracked through both stages.

const SCENE_DURATION = 46;

const NARRATION = [
  /*  0.0– 4.5 */ 'Two transformations, two orders. Does it matter which one you do first?',
  /*  4.5–14.5 */ 'Take matrix A — a rotation by forty-five degrees. And matrix B — a stretch along x, a squeeze along y.',
  /* 14.5–32.0 */ 'Apply B first — the unit square stretches and squashes. Then apply A — the deformed square rotates. The single matrix A B captures both steps at once.',
  /* 32.0–46.5 */ 'Now swap the order. Apply A first, then B. The square rotates, then stretches — and lands somewhere different. The matrix B A is not the same as A B.',
  /* 46.5–56.0 */ 'A B means B first, then A — A acts last on whatever B produced. And in general, A B does not equal B A.',
];

const NARRATION_AUDIO = 'audio/matrix-product-as-composition/scene.mp3';

// ─── Matrix algebra ───────────────────────────────────────────────────────
const TH = Math.PI / 4;                    // 45°
const A = [[Math.cos(TH), -Math.sin(TH)],
           [Math.sin(TH),  Math.cos(TH)]]; // rotation
const B = [[2, 0], [0, 0.5]];              // stretch / squeeze
const IDENTITY = [[1, 0], [0, 1]];

function multM(M, N) {
  return [
    [M[0][0]*N[0][0] + M[0][1]*N[1][0], M[0][0]*N[0][1] + M[0][1]*N[1][1]],
    [M[1][0]*N[0][0] + M[1][1]*N[1][0], M[1][0]*N[0][1] + M[1][1]*N[1][1]],
  ];
}
function applyM(M, x, y) {
  return [M[0][0]*x + M[0][1]*y, M[1][0]*x + M[1][1]*y];
}
function lerpM(M0, M1, t) {
  return [
    [M0[0][0] + (M1[0][0]-M0[0][0])*t, M0[0][1] + (M1[0][1]-M0[0][1])*t],
    [M0[1][0] + (M1[1][0]-M0[1][0])*t, M0[1][1] + (M1[1][1]-M0[1][1])*t],
  ];
}
function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
function fmt(v) {
  if (Math.abs(v) < 1e-3) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-3) return String(Math.round(v));
  return v.toFixed(2);
}

const AB = multM(A, B);  // (AB)v = A(Bv) — applying B then A
const BA = multM(B, A);  // (BA)v = B(Av) — applying A then B

// ─── Plane geometry per aspect ────────────────────────────────────────────
function geom(portrait) {
  if (portrait) {
    return {
      unit: 70,
      vbW: 600, vbH: 460,
      ox: 300,    // origin at SVG centre-x
      oy: 290,    // origin a hair above SVG centre-y
      X_MIN: -3, X_MAX: 3, Y_MIN: -2, Y_MAX: 2,
      planePos: { left: '50%', top: 320, transform: 'translate(-50%, 0)' },
      panelAPos: { left: 36,  top: 800, width: 308 },
      panelBPos: { right: 36, top: 800, width: 308 },
      compareTop: 980,
      fontMatrix: 22,
      fontHeader: 10,
    };
  }
  return {
    unit: 85,
    vbW: 760, vbH: 600,
    ox: 380, oy: 320,
    X_MIN: -4, X_MAX: 4, Y_MIN: -2.5, Y_MAX: 2.5,
    planePos: { left: 30, top: 110 },
    panelAPos: { right: 36, top: 170, width: 320 },
    panelBPos: { right: 36, top: 430, width: 320 },
    fontMatrix: 28,
    fontHeader: 11,
  };
}
function toSvg(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

// ─── Reusable visual primitives ───────────────────────────────────────────
function PlaneChrome({ G, gridOpacity = 0.18 }) {
  const left = toSvg(G, G.X_MIN, 0).sx;
  const right = toSvg(G, G.X_MAX, 0).sx;
  const top = toSvg(G, 0, G.Y_MAX).sy;
  const bottom = toSvg(G, 0, G.Y_MIN).sy;
  const yAxis = toSvg(G, 0, 0).sx;
  const xAxis = toSvg(G, 0, 0).sy;
  const verticals = [];
  for (let k = Math.ceil(G.X_MIN); k <= Math.floor(G.X_MAX); k++) {
    if (k === 0) continue;
    const sx = toSvg(G, k, 0).sx;
    verticals.push(
      <line key={`v${k}`} x1={sx} y1={top} x2={sx} y2={bottom}
            stroke="var(--chalk-300)" strokeWidth={0.7} opacity={gridOpacity}/>
    );
  }
  const horizontals = [];
  for (let k = Math.ceil(G.Y_MIN); k <= Math.floor(G.Y_MAX); k++) {
    if (k === 0) continue;
    const sy = toSvg(G, 0, k).sy;
    horizontals.push(
      <line key={`h${k}`} x1={left} y1={sy} x2={right} y2={sy}
            stroke="var(--chalk-300)" strokeWidth={0.7} opacity={gridOpacity}/>
    );
  }
  return (
    <g>
      {verticals}
      {horizontals}
      <line x1={left} y1={xAxis} x2={right} y2={xAxis}
            stroke="var(--chalk-200)" strokeWidth={1.5}/>
      <line x1={yAxis} y1={top} x2={yAxis} y2={bottom}
            stroke="var(--chalk-200)" strokeWidth={1.5}/>
    </g>
  );
}

function Shape({ G, M, fill, fillOpacity = 0.22, stroke, strokeWidth = 2.5 }) {
  // Apply M to the unit square corners.
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  const pts = corners.map(([x, y]) => {
    const [tx, ty] = applyM(M, x, y);
    const p = toSvg(G, tx, ty);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');
  return (
    <polygon points={pts} fill={fill} fillOpacity={fillOpacity}
             stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"/>
  );
}

function BasisVectors({ G, M, e1Color = 'var(--violet-400)', e2Color = 'var(--teal-400)',
                        showLabels = true, labelE1 = 'e₁', labelE2 = 'e₂' }) {
  const o = toSvg(G, 0, 0);
  const e1 = applyM(M, 1, 0);
  const e2 = applyM(M, 0, 1);
  return (
    <g>
      <Arrow G={G} from={[0,0]} to={e1} color={e1Color} label={showLabels ? labelE1 : null}/>
      <Arrow G={G} from={[0,0]} to={e2} color={e2Color} label={showLabels ? labelE2 : null}/>
    </g>
  );
}
function Arrow({ G, from, to, color, label = null, strokeWidth = 3.4, headLen = 12, headHalf = 6 }) {
  const a = toSvg(G, from[0], from[1]);
  const b = toSvg(G, to[0], to[1]);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx/len, uy = dy/len;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label && (
        <text x={b.sx + 10 * ux + 4 * perpX} y={b.sy + 10 * uy + 4 * perpY + 4}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={18}>{label}</text>
      )}
    </g>
  );
}

function Plane({ G, children }) {
  return (
    <div style={{ position: 'absolute', ...G.planePos }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {children}
      </svg>
    </div>
  );
}

function MatrixCard({ position, eyebrow, rows, eyebrowColor = 'var(--amber-300)',
                      cellColor = 'var(--chalk-100)', fontSize = 28, headerFont = 11,
                      footnote = null, highlight = false, delay = 0 }) {
  return (
    <FadeUp duration={0.5} delay={delay} distance={10}
      style={{
        position: 'absolute', ...position,
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.55)',
        border: `1px solid ${highlight ? 'rgba(244,184,96,0.45)' : 'rgba(232,220,193,0.07)'}`,
        borderRadius: 14,
        boxShadow: highlight
          ? '0 12px 36px rgba(244,184,96,0.18), 0 10px 32px rgba(0,0,0,0.35)'
          : '0 10px 32px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: headerFont,
        color: eyebrowColor, letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}>{eyebrow}</div>
      <div style={{ position: 'relative', padding: '4px 12px', alignSelf: 'flex-start' }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 9,
          borderLeft: '2.2px solid var(--chalk-200)',
          borderTop: '2.2px solid var(--chalk-200)',
          borderBottom: '2.2px solid var(--chalk-200)',
        }}/>
        <span style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 9,
          borderRight: '2.2px solid var(--chalk-200)',
          borderTop: '2.2px solid var(--chalk-200)',
          borderBottom: '2.2px solid var(--chalk-200)',
        }}/>
        <div style={{
          display: 'grid', gridTemplateColumns: `${fontSize*2.2}px ${fontSize*2.2}px`,
          columnGap: 18, rowGap: 6,
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize, color: cellColor, textAlign: 'right',
        }}>
          <span>{rows[0][0]}</span>
          <span>{rows[0][1]}</span>
          <span>{rows[1][0]}</span>
          <span>{rows[1][1]}</span>
        </div>
      </div>
      {footnote && (
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 14, color: 'var(--chalk-300)', lineHeight: 1.4,
          maxWidth: '30ch',
        }}>{footnote}</div>
      )}
    </FadeUp>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="matrix multiplication"
      title="AB Means B First, Then A"
      duration={SCENE_DURATION}
      introEnd={4.97}
      introCaption="Which order matters?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.97} end={13.53}>
        <SetupBeat />
      </Sprite>

      <Sprite start={13.53} end={24.6}>
        <BthenABeat />
      </Sprite>

      <Sprite start={24.6} end={35.89}>
        <AthenBBeat />
      </Sprite>

      <Sprite start={35.89} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup — identity grid + A and B matrices on the side ─────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  return (
    <>
      <Plane G={G}>
        <SvgFadeIn duration={0.5} delay={0.0}>
          <PlaneChrome G={G}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.6}>
          <Shape G={G} M={IDENTITY} fill="var(--amber-400)" stroke="var(--amber-300)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.0}>
          <BasisVectors G={G} M={IDENTITY}/>
        </SvgFadeIn>
      </Plane>

      <MatrixCard
        position={G.panelAPos}
        eyebrow="matrix A — rotation"
        eyebrowColor="var(--violet-300)"
        rows={[
          ['0.71', '−0.71'],
          ['0.71',  '0.71'],
        ]}
        footnote="A rotates every vector by 45° counter-clockwise."
        delay={1.2}
      />
      <MatrixCard
        position={G.panelBPos}
        eyebrow="matrix B — stretch / squeeze"
        eyebrowColor="var(--teal-300)"
        rows={[
          ['2', '0'],
          ['0', '0.5'],
        ]}
        footnote="B stretches x by 2, squeezes y by 0.5."
        delay={3.2}
      />
    </>
  );
}

// ─── Beat 3: B then A (two-step morph) ─────────────────────────────────────
function BthenABeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // Timeline scaled to the beat duration so it stays in sync if rewire
  // changes the beat length. Phases as fractions of beatDur:
  //   0.00 – 0.07  identity holds (gives narration a beat to say "apply B first")
  //   0.07 – 0.42  morph identity → B
  //   0.42 – 0.48  pause on B
  //   0.48 – 0.78  morph B → AB    (apply A to the already-B-transformed grid)
  //   0.78 – end   hold AB, fade in the AB matrix card
  const f = localTime / Math.max(0.001, beatDur);
  let M;
  if (f < 0.07) M = IDENTITY;
  else if (f < 0.42) M = lerpM(IDENTITY, B, smoothstep((f - 0.07) / 0.35));
  else if (f < 0.48) M = B;
  else if (f < 0.78) M = lerpM(B, AB, smoothstep((f - 0.48) / 0.30));
  else M = AB;

  // Step labels that appear under the panel: which step we're in.
  const step1Active = f >= 0.05 && f < 0.48;
  const step2Active = f >= 0.46 && f < 0.82;
  const equalShow = f >= 0.80;

  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G} gridOpacity={0.14}/>
        <Shape G={G} M={IDENTITY} fill="var(--chalk-300)" fillOpacity={0.08}
               stroke="var(--chalk-300)" strokeWidth={1.4}/>
        <Shape G={G} M={M} fill="var(--amber-400)" stroke="var(--amber-300)"/>
        <BasisVectors G={G} M={M}/>
      </Plane>

      <StepBadge position={portrait
        ? { left: 36, top: 800, width: 308 }
        : { right: 56, top: 200, width: 360 }}
        eyebrow="step 1"
        text="apply B — stretch & squeeze"
        active={step1Active}
        accent="var(--teal-300)"
      />
      <StepBadge position={portrait
        ? { right: 36, top: 800, width: 308 }
        : { right: 56, top: 320, width: 360 }}
        eyebrow="step 2"
        text="apply A — rotate"
        active={step2Active}
        accent="var(--violet-300)"
      />
      {equalShow && (
        <MatrixCard
          position={portrait
            ? { left: 36, right: 36, top: 970 }
            : { right: 56, top: 460, width: 360 }}
          eyebrow="single matrix — AB"
          eyebrowColor="var(--amber-300)"
          rows={[
            [fmt(AB[0][0]), fmt(AB[0][1])],
            [fmt(AB[1][0]), fmt(AB[1][1])],
          ]}
          footnote="AB takes you from the identity to the same final square in one step."
          highlight
          delay={0.1}
        />
      )}
    </>
  );
}

function StepBadge({ position, eyebrow, text, active, accent }) {
  return (
    <div style={{
      position: 'absolute', ...position,
      padding: '12px 16px',
      background: 'rgba(0,0,0,0.55)',
      border: `1px solid ${active ? accent : 'rgba(232,220,193,0.10)'}`,
      borderRadius: 12,
      transition: 'border-color 200ms',
      pointerEvents: 'none',
      opacity: active ? 1 : 0.55,
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: active ? accent : 'var(--chalk-300)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
        marginBottom: 4,
      }}>{eyebrow}</div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: 18, color: active ? 'var(--chalk-100)' : 'var(--chalk-300)',
      }}>{text}</div>
    </div>
  );
}

// ─── Beat 4: A then B (different result) ──────────────────────────────────
function AthenBBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // Phases as fractions of beatDur, so the choreography scales with audio
  // timings without re-tuning.
  //   0.00 – 0.09  identity holds
  //   0.09 – 0.40  morph identity → A   (rotate first)
  //   0.40 – 0.46  pause on A
  //   0.46 – 0.78  morph A → BA         (then stretch)
  //   0.78 – end   hold BA + show AB-vs-BA compare card
  const f = localTime / Math.max(0.001, beatDur);
  let M;
  if (f < 0.09) M = IDENTITY;
  else if (f < 0.40) M = lerpM(IDENTITY, A, smoothstep((f - 0.09) / 0.31));
  else if (f < 0.46) M = A;
  else if (f < 0.78) M = lerpM(A, BA, smoothstep((f - 0.46) / 0.32));
  else M = BA;

  // Once BA settles, fade in the AB vs BA compare card.
  const compareT = smoothstep((f - 0.80) / 0.08);

  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G} gridOpacity={0.14}/>
        <Shape G={G} M={IDENTITY} fill="var(--chalk-300)" fillOpacity={0.08}
               stroke="var(--chalk-300)" strokeWidth={1.4}/>
        {/* Faint AB result for comparison */}
        {compareT > 0 && (
          <Shape G={G} M={AB} fill="var(--amber-400)"
                 fillOpacity={0.12 * compareT}
                 stroke="var(--amber-300)" strokeWidth={1.6}/>
        )}
        <Shape G={G} M={M} fill="var(--rose-400)" stroke="var(--rose-300)"/>
        <BasisVectors G={G} M={M}
          e1Color="var(--rose-300)" e2Color="var(--rose-300)"/>
        {/* When BA is settled, label both parallelograms */}
        {compareT > 0.6 && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ShapeLabel G={G} M={AB} text="AB" color="var(--amber-300)"/>
            <ShapeLabel G={G} M={BA} text="BA" color="var(--rose-300)"/>
          </SvgFadeIn>
        )}
      </Plane>

      <StepBadge position={portrait
        ? { left: 36, top: 800, width: 308 }
        : { right: 56, top: 200, width: 360 }}
        eyebrow="step 1"
        text="apply A — rotate first"
        active={f >= 0.06 && f < 0.46}
        accent="var(--violet-300)"
      />
      <StepBadge position={portrait
        ? { right: 36, top: 800, width: 308 }
        : { right: 56, top: 320, width: 360 }}
        eyebrow="step 2"
        text="apply B — then stretch"
        active={f >= 0.44 && f < 0.82}
        accent="var(--teal-300)"
      />
      {compareT > 0.7 && (
        <FadeUp duration={0.5} delay={0.0} distance={10}
          style={{
            position: 'absolute',
            ...(portrait
              ? { left: 36, right: 36, top: 970, textAlign: 'center' }
              : { right: 56, top: 460, width: 360, textAlign: 'left' }),
            padding: '14px 18px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(232,122,144,0.35)',
            borderRadius: 14,
            boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 18 : 22, color: 'var(--rose-300)',
            pointerEvents: 'none',
          }}>
          AB ≠ BA
        </FadeUp>
      )}
    </>
  );
}

function ShapeLabel({ G, M, text, color }) {
  // Centre the label on the parallelogram's centroid.
  const corners = [[0,0],[1,0],[1,1],[0,1]];
  let cx = 0, cy = 0;
  for (const [x, y] of corners) {
    const [tx, ty] = applyM(M, x, y);
    cx += tx; cy += ty;
  }
  cx /= 4; cy /= 4;
  const p = toSvg(G, cx, cy);
  return (
    <text x={p.sx} y={p.sy + 6} fill={color}
          fontFamily="var(--font-serif)" fontStyle="italic"
          fontSize={22} textAnchor="middle"
          style={{ textShadow: '0 0 8px rgba(0,0,0,0.9)' }}>
      {text}
    </text>
  );
}

// ─── Beat 5: takeaway ─────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25,
        }}>
        AB acts right-to-left:<br/>
        <span style={{ color: 'var(--teal-300)' }}>B</span> first, then{' '}
        <span style={{ color: 'var(--violet-300)' }}>A</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={2.5} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--amber-300)',
          maxWidth: portrait ? '24ch' : '40ch',
        }}>
        AB ≠ BA in general — order is part of the operation.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage
      width={1280} height={720}
      duration={SCENE_DURATION}
      background="#0c0a1f"
      loop={false}
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
