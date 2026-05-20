// The Determinant as Area — Manimo lesson scene.
// Chapter 2 (Lineærtransformasjoner). A 2x2 matrix maps the unit square
// to a parallelogram whose signed area is det A. Beat 2 morphs identity →
// A continuously. Beat 4 scrubs one entry of A through det = 0; the
// parallelogram collapses to a line and re-emerges with reversed
// orientation when det goes negative.
//
// Beats:
//    0– 4   Manimo intro
//    4–14   Unit square morphs into the parallelogram under A
//   14–23   det A = ad − bc, area readout
//   23–35   Scrub a parameter s; det = 3 − s passes through zero;
//           orientation flips, fill switches amber → rose
//   35–40   Takeaway
//
// Genuine animation: the continuous morph in beat 2 and the parameter
// scrub through det = 0 in beat 4 are useSprite-driven, not FadeUp.

const SCENE_DURATION = 46;

const NARRATION = [
  /*  0– 4 */ 'How much does a matrix stretch the space it acts on?',
  /*  4–14 */ 'Start with the unit square — the patch sitting on e one and e two. Apply a matrix A. The square morphs into a parallelogram, with the columns of A as its two sides.',
  /* 14–23 */ 'The signed area of that parallelogram is the determinant. For a two by two matrix it is a d minus b c.',
  /* 23–35 */ 'Watch what happens as we scrub one entry of A. The area shrinks. At determinant zero the parallelogram collapses to a line. Push past zero and the determinant goes negative — the basis vectors have flipped, the orientation is reversed.',
  /* 35–40 */ 'Determinant equals area times orientation. One number, two stories.',
];

const NARRATION_AUDIO = 'audio/determinant-as-area/scene.mp3';

// The matrix for beat 2 / beat 3: A = [[2, 1], [0.5, 1.5]]; det = 2·1.5 - 1·0.5 = 2.5.
const A_FIXED = [[2, 1], [0.5, 1.5]];

// ─── Geometry helpers ─────────────────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vbW: 640, vbH: 720, ox: 320, oy: 420, unit: 56,
        gridXMin: -3, gridXMax: 5, gridYMin: -3, gridYMax: 5 }
    : { vbW: 760, vbH: 600, ox: 380, oy: 380, unit: 64,
        gridXMin: -3, gridXMax: 5, gridYMin: -3, gridYMax: 4 };
}

function toSvgF(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function applyM(M, x, y) {
  return [M[0][0] * x + M[0][1] * y, M[1][0] * x + M[1][1] * y];
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

// Filled parallelogram with sides (a1, a2) anchored at origin.
function Parallelogram({ G, a1, a2, fill, fillOpacity = 0.35,
                          stroke, strokeWidth = 2, strokeOpacity = 0.85 }) {
  const c0 = toSvgF(G, 0, 0);
  const c1 = toSvgF(G, a1[0], a1[1]);
  const c2 = toSvgF(G, a1[0] + a2[0], a1[1] + a2[1]);
  const c3 = toSvgF(G, a2[0], a2[1]);
  const pts = `${c0.sx},${c0.sy} ${c1.sx},${c1.sy} ${c2.sx},${c2.sy} ${c3.sx},${c3.sy}`;
  return (
    <g>
      <polygon points={pts} fill={fill} fillOpacity={fillOpacity} stroke="none"/>
      {stroke && (
        <polygon points={pts} fill="none" stroke={stroke}
                 strokeWidth={strokeWidth} opacity={strokeOpacity}/>
      )}
    </g>
  );
}

function ArrowFromOrigin({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                          strokeWidth = 3.4, opacity = 1 }) {
  const a = toSvgF(G, 0, 0);
  const b = toSvgF(G, x, y);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 1) return null;
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
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
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

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="linear transformations"
      title="The Determinant as Area"
      duration={SCENE_DURATION}
      introEnd={3.51}
      introCaption="How much does a matrix stretch the plane?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.51} end={15.55}>
        <MorphSquareBeat/>
      </Sprite>

      <Sprite start={15.55} end={23.29}>
        <AreaIsDetBeat/>
      </Sprite>

      <Sprite start={23.29} end={38.99}>
        <SignFlipBeat/>
      </Sprite>

      <Sprite start={38.99} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Square morphs into parallelogram ─────────────────────────────
function MorphSquareBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // Morph t in [0, 1]: lerp identity → A_FIXED.
  const t = clamp((localTime - 1.6) / 3.5, 0, 1);
  const tEased = Easing.easeInOutCubic(t);
  // Lerped matrix M(t) = (1-t)·I + t·A.
  const M = [
    [1 + tEased * (A_FIXED[0][0] - 1), tEased * A_FIXED[0][1]],
    [tEased * A_FIXED[1][0], 1 + tEased * (A_FIXED[1][1] - 1)],
  ];
  // Image of e1 and e2 under M.
  const me1 = [M[0][0], M[1][0]];
  const me2 = [M[0][1], M[1][1]];

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '36%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* Unit-square outline ghost (fades out as morph progresses) */}
          {tEased < 0.95 && (
            <g opacity={1 - tEased * 0.6}>
              <polygon
                points={`${toSvgF(G,0,0).sx},${toSvgF(G,0,0).sy} `
                      + `${toSvgF(G,1,0).sx},${toSvgF(G,1,0).sy} `
                      + `${toSvgF(G,1,1).sx},${toSvgF(G,1,1).sy} `
                      + `${toSvgF(G,0,1).sx},${toSvgF(G,0,1).sy}`}
                fill="var(--chalk-200)" fillOpacity={0.08}
                stroke="var(--chalk-300)" strokeWidth={1.4}
                strokeDasharray="6 4"/>
            </g>
          )}

          {/* The morphing parallelogram */}
          <Parallelogram G={G} a1={me1} a2={me2}
            fill="var(--amber-400)" fillOpacity={0.30}
            stroke="var(--amber-400)" strokeWidth={2.4}/>

          {/* Image basis vectors */}
          <ArrowFromOrigin G={G} x={me1[0]} y={me1[1]}
                           color="var(--violet-400)"
                           label={tEased > 0.7 ? 'a₁' : null}
                           labelDX={20} labelDY={20}/>
          <ArrowFromOrigin G={G} x={me2[0]} y={me2[1]}
                           color="var(--teal-400)"
                           label={tEased > 0.7 ? 'a₂' : null}
                           labelDX={-20} labelDY={-6}/>

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
          unit square → parallelogram
        </FadeUp>
        <FadeUp duration={0.55} delay={0.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 24 : 28, color: 'var(--chalk-100)',
            lineHeight: 1.2, marginTop: 4,
          }}>
            A&nbsp;=&nbsp;<span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>
              [[2, 1], [0.5, 1.5]]
            </span>
        </FadeUp>
        <FadeUp duration={0.5} delay={5.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          The columns of A — call them a₁ and a₂ — are the sides of the parallelogram.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Area = det A ─────────────────────────────────────────────────
function AreaIsDetBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);

  const a1 = [A_FIXED[0][0], A_FIXED[1][0]];
  const a2 = [A_FIXED[0][1], A_FIXED[1][1]];

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '36%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* Shaded parallelogram */}
          <SvgFadeIn duration={0.5} delay={0.0}>
            <Parallelogram G={G} a1={a1} a2={a2}
              fill="var(--amber-400)" fillOpacity={0.34}
              stroke="var(--amber-400)" strokeWidth={2.4}/>
          </SvgFadeIn>

          {/* Centre area label */}
          <SvgFadeIn duration={0.4} delay={1.2}>
            <text
              x={toSvgF(G, (a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2).sx}
              y={toSvgF(G, (a1[0] + a2[0]) / 2, (a1[1] + a2[1]) / 2).sy + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={26} textAnchor="middle">
              area = 2.5
            </text>
          </SvgFadeIn>

          {/* a1, a2 as labelled column vectors */}
          <SvgFadeIn duration={0.4} delay={0.2}>
            <ArrowFromOrigin G={G} x={a1[0]} y={a1[1]}
                             color="var(--violet-400)"
                             label="a₁ = (2, 0.5)" labelDX={70} labelDY={16}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.5}>
            <ArrowFromOrigin G={G} x={a2[0]} y={a2[1]}
                             color="var(--teal-400)"
                             label="a₂ = (1, 1.5)" labelDX={-50} labelDY={-8}/>
          </SvgFadeIn>

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
          determinant formula
        </FadeUp>
        <FadeUp duration={0.6} delay={0.7} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 30 : 36, color: 'var(--chalk-100)',
            lineHeight: 1.2, marginTop: 4,
          }}>
            det A = a·d − b·c
        </FadeUp>
        <FadeUp duration={0.5} delay={2.0} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
            color: 'var(--chalk-100)', marginTop: 6,
          }}>
            det = 2·1.5 − 1·0.5 = 2.5
        </FadeUp>
        <FadeUp duration={0.5} delay={4.0} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          Area scales by |det A| under any linear map.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Sign flip — scrub s through det = 0 ──────────────────────────
function SignFlipBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // s: 0.5 → 3.0 → 5.0 across the beat (12s total).
  // Three phases: 0–4s ramp 0.5 → 3.0; 4–6s hold near 3; 6–10s ramp 3.0 → 5.0; 10–12s hold.
  function sAt(t) {
    if (t < 0.6) return 0.5;
    if (t < 4.6) return 0.5 + (3.0 - 0.5) * Easing.easeInOutCubic((t - 0.6) / 4.0);
    if (t < 6.0) return 3.0;
    if (t < 10.0) return 3.0 + (5.0 - 3.0) * Easing.easeInOutCubic((t - 6.0) / 4.0);
    return 5.0;
  }
  const s = sAt(localTime);
  // A(s) = [[2, 1], [s, 1.5]]; det(s) = 2*1.5 - 1*s = 3 - s.
  const A = [[2, 1], [s, 1.5]];
  const det = 3 - s;
  const a1 = [A[0][0], A[1][0]];   // (2, s)
  const a2 = [A[0][1], A[1][1]];   // (1, 1.5)

  const negative = det < 0;
  const fillColor = negative ? 'var(--rose-400)' : 'var(--amber-400)';

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '36%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* Parallelogram — color follows the sign of det */}
          <Parallelogram G={G} a1={a1} a2={a2}
            fill={fillColor} fillOpacity={0.32}
            stroke={fillColor} strokeWidth={2.4}/>

          {/* Image basis vectors */}
          <ArrowFromOrigin G={G} x={a1[0]} y={a1[1]}
                           color="var(--violet-400)"
                           label="a₁" labelDX={22} labelDY={18}/>
          <ArrowFromOrigin G={G} x={a2[0]} y={a2[1]}
                           color="var(--teal-400)"
                           label="a₂" labelDX={-22} labelDY={-6}/>

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
          scrubbing one entry
        </FadeUp>
        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.2, marginTop: 4,
          }}>
            A(s) =&nbsp;
            <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal' }}>
              [[2, 1], [s, 1.5]]
            </span>
        </FadeUp>
        {/* Live readouts */}
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: portrait ? 16 : 18,
          color: 'var(--chalk-100)', marginTop: 6,
          display: 'flex', flexDirection: 'column', gap: 4,
        }}>
          <FadeUp duration={0.4} delay={1.2} distance={6}>
            s&nbsp;&nbsp;&nbsp;= {s.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.4} delay={1.4} distance={6}
            style={{ color: negative ? 'var(--rose-300)' :
                      Math.abs(det) < 0.1 ? 'var(--chalk-300)' : 'var(--amber-300)' }}>
            det = 3 − s = {det.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.4} delay={1.6} distance={6}
            style={{ color: 'var(--chalk-200)' }}>
            area = {Math.abs(det).toFixed(2)}
          </FadeUp>
        </div>
        <FadeUp duration={0.5} delay={9.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: negative ? 'var(--rose-300)' : 'var(--chalk-300)',
            lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          {negative ? 'orientation reversed — basis vectors have crossed'
                    : 'sign of det = orientation of the basis'}
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
          fontSize: portrait ? 36 : 46, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        det A = <span style={{ color: 'var(--amber-300)' }}>area</span>
        &nbsp;×&nbsp;<span style={{ color: 'var(--rose-300)' }}>orientation</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '40ch', lineHeight: 1.4,
        }}>
        Zero says the matrix flattens the plane.
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
