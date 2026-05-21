// Orthogonal Complement: The Other Direction — Manimo lesson scene.
// Chapter 3 (Indreproduktrom). Fix a line W through the origin. Its
// orthogonal complement W⊥ is the perpendicular line through the origin.
// Every u splits uniquely as u = w + w⊥. Beat 3 rotates u around a circle
// and watches w (along W) and w⊥ (along W⊥) glide as projections.
//
// Beats:
//    0.00– 4.20  Manimo intro
//    4.20–12.50  W and its perpendicular line W⊥
//   12.50–27.50  Rotate u, decompose into w + w⊥ (genuine motion)
//   27.50–36.00  ℝ² = W ⊕ W⊥; W ∩ W⊥ = {0}
//   36.00–42.00  Takeaway

const SCENE_DURATION = 52;

const NARRATION = [
  /*  0.00– 4.20 */ 'What is left over when you remove a direction from a space?',
  /*  4.20–12.50 */ 'Fix a line W through the origin. Its orthogonal complement is the perpendicular line through the origin, written W perp. Everything on W perp is at right angles to everything on W.',
  /* 12.50–27.50 */ 'Now take any vector u. Drop its shadow onto W and onto W perp. Whatever piece lives on each line, the two pieces add up to u. Spin u around the origin and watch the two shadows glide along their lines, always making a right triangle.',
  /* 27.50–36.00 */ 'Together W and W perp span the whole plane, and the only vector in both is zero. We say the plane is the direct sum of W and W perp.',
  /* 36.00–42.00 */ 'A subspace and its complement carve the space cleanly in two. Every direction belongs to one side or the other.',
];

const NARRATION_AUDIO = 'audio/orthogonal-complement/scene.mp3';

// ─── Geometry helpers (per-aspect) ────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vbW: 660, vbH: 660, ox: 330, oy: 330, unit: 60,
        gridXMin: -4, gridXMax: 4, gridYMin: -4, gridYMax: 4 }
    : { vbW: 700, vbH: 600, ox: 350, oy: 300, unit: 66,
        gridXMin: -4, gridXMax: 4, gridYMin: -4, gridYMax: 4 };
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
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={t.sx} y1={t.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
    </g>
  );
}

// Line through (0,0) in direction (dx, dy), clipped to grid extents.
function SpanLineSvg({ G, dx, dy, color, strokeWidth = 2.4, opacity = 0.85,
                       dashed = false }) {
  const tCandidates = [];
  if (Math.abs(dx) > 1e-9) {
    tCandidates.push(G.gridXMin / dx, G.gridXMax / dx);
  }
  if (Math.abs(dy) > 1e-9) {
    tCandidates.push(G.gridYMin / dy, G.gridYMax / dy);
  }
  let tMin = Infinity, tMax = -Infinity;
  for (const t of tCandidates) {
    const xt = t * dx, yt = t * dy;
    if (xt >= G.gridXMin - 1e-6 && xt <= G.gridXMax + 1e-6 &&
        yt >= G.gridYMin - 1e-6 && yt <= G.gridYMax + 1e-6) {
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
    }
  }
  if (!isFinite(tMin) || !isFinite(tMax)) return null;
  const a = toSvgF(G, tMin * dx, tMin * dy);
  const b = toSvgF(G, tMax * dx, tMax * dy);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeDasharray={dashed ? '6 5' : undefined} strokeLinecap="round"/>
  );
}

// Arrow from (fromX, fromY) to (x, y).
function Arrow({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                 strokeWidth = 3.4, fromX = 0, fromY = 0, opacity = 1,
                 dashed = false, headLen = 12 }) {
  const a = toSvgF(G, fromX, fromY);
  const b = toSvgF(G, x, y);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const headHalf = 6.5;
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
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

// Small right-angle marker at the origin between two unit directions.
function RightAngleAtOrigin({ G, dirA, dirB, size = 16, color = 'var(--chalk-200)' }) {
  const p = toSvgF(G, 0, 0);
  const aN = Math.hypot(dirA[0], dirA[1]);
  const bN = Math.hypot(dirB[0], dirB[1]);
  const a = [dirA[0] / aN, dirA[1] / aN];
  const b = [dirB[0] / bN, dirB[1] / bN];
  const pa = { sx: p.sx + a[0] * size, sy: p.sy - a[1] * size };
  const pb = { sx: p.sx + b[0] * size, sy: p.sy - b[1] * size };
  const pc = { sx: p.sx + (a[0] + b[0]) * size, sy: p.sy - (a[1] + b[1]) * size };
  return (
    <g stroke={color} strokeWidth={1.4} fill="none" opacity={0.85}>
      <line x1={pa.sx} y1={pa.sy} x2={pc.sx} y2={pc.sy}/>
      <line x1={pb.sx} y1={pb.sy} x2={pc.sx} y2={pc.sy}/>
    </g>
  );
}

function SoftPanel({ portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 920, bottom: 100 }
        : { right: 60, top: 240, width: 360 }),
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

// Line W direction (slope 1/2): unit vector (2, 1)/√5.
const W_DIR = [2, 1];
const W_LEN = Math.hypot(W_DIR[0], W_DIR[1]);
const W_HAT = [W_DIR[0] / W_LEN, W_DIR[1] / W_LEN];
const WPERP_HAT = [-W_HAT[1], W_HAT[0]];   // 90° CCW rotation

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="inner product spaces"
      title="Orthogonal Complement: The Other Direction"
      duration={SCENE_DURATION}
      introEnd={4.01}
      introCaption="What is left over when you remove a direction?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.01} end={16.17}>
        <LineAndComplementBeat/>
      </Sprite>

      <Sprite start={16.17} end={33.03}>
        <RotateAndDecomposeBeat/>
      </Sprite>

      <Sprite start={33.03} end={42.89}>
        <DirectSumBeat/>
      </Sprite>

      <Sprite start={42.89} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: W and W⊥ ────────────────────────────────────────────────────
function LineAndComplementBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);

  // W direction: (2, 1). W⊥ direction: (-1, 2).
  const wD = W_HAT;
  const wPD = WPERP_HAT;

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>

          {/* Line W */}
          <SvgFadeIn duration={0.5} delay={0.3}>
            <SpanLineSvg G={G} dx={wD[0]} dy={wD[1]}
                         color="var(--amber-400)" strokeWidth={2.8}/>
          </SvgFadeIn>
          {/* Label W along the line, near positive tip */}
          <SvgFadeIn duration={0.4} delay={0.8}>
            {(() => {
              const lbl = toSvgF(G, 3.2 * wD[0], 3.2 * wD[1]);
              return (
                <text x={lbl.sx + 18} y={lbl.sy + 4}
                      fill="var(--amber-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={26} textAnchor="start">W</text>
              );
            })()}
          </SvgFadeIn>

          {/* Line W⊥ */}
          <SvgFadeIn duration={0.5} delay={1.4}>
            <SpanLineSvg G={G} dx={wPD[0]} dy={wPD[1]}
                         color="var(--teal-400)" strokeWidth={2.8}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={1.8}>
            {(() => {
              const lbl = toSvgF(G, 3.0 * wPD[0], 3.0 * wPD[1]);
              return (
                <text x={lbl.sx - 14} y={lbl.sy - 8}
                      fill="var(--teal-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={26} textAnchor="end">
                  W<tspan fontSize={20} dy={-8}>⊥</tspan>
                </text>
              );
            })()}
          </SvgFadeIn>

          {/* Right-angle marker between W and W⊥ at origin */}
          <SvgFadeIn duration={0.4} delay={1.8}>
            <RightAngleAtOrigin G={G} dirA={wD} dirB={wPD} size={18}/>
          </SvgFadeIn>

          {/* Origin */}
          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.2}/>
          <text x={toSvgF(G, 0, 0).sx - 12} y={toSvgF(G, 0, 0).sy + 20}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end" opacity={0.85}>0</text>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          a line and its complement
        </FadeUp>
        <FadeUp duration={0.55} delay={1.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 24, color: 'var(--chalk-100)',
            lineHeight: 1.35, marginTop: 4,
          }}>
            <span style={{ color: 'var(--amber-300)' }}>W</span> is a line through the origin.<br/>
            <span style={{ color: 'var(--teal-300)' }}>W<sup style={{ fontSize: '0.6em' }}>⊥</sup></span> is the perpendicular line through the origin.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          Every vector on W⊥ is perpendicular to every vector on W.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Rotate u, decompose ─────────────────────────────────────────
// u rotates around a circle of radius R. Project u onto W and W⊥.
//   w   = (u · ŵ)   ŵ          (component along W)
//   w⊥  = (u · ŵ⊥)  ŵ⊥         (component along W⊥)
function RotateAndDecomposeBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  const wD = W_HAT;
  const wPD = WPERP_HAT;

  // u rotates with constant angular speed around a circle of radius R.
  const R = 2.6;
  // Sweep angle from 30° → 30° + 270° over [1.6, 12.6] s.
  const SWEEP_START = 1.6;
  const SWEEP_DUR = 11.0;
  const sweepT = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const sweepEased = Easing.easeInOutCubic(sweepT);
  const startA = 30 * Math.PI / 180;
  const totalA = 270 * Math.PI / 180;
  const angle = startA + totalA * sweepEased;
  const ux = R * Math.cos(angle);
  const uy = R * Math.sin(angle);

  // u · ŵ and u · ŵ⊥
  const cW = ux * wD[0]  + uy * wD[1];
  const cP = ux * wPD[0] + uy * wPD[1];
  // The two projection vectors.
  const wTip  = [cW * wD[0],  cW * wD[1]];
  const wPTip = [cP * wPD[0], cP * wPD[1]];

  const origin = toSvgF(G, 0, 0);
  const uPt = toSvgF(G, ux, uy);
  const wPt = toSvgF(G, wTip[0],  wTip[1]);
  const wPPt = toSvgF(G, wPTip[0], wPTip[1]);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G} opacity={0.18}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>

          {/* Lines W and W⊥ (dimmed reference) */}
          <SvgFadeIn duration={0.4} delay={0.0}>
            <SpanLineSvg G={G} dx={wD[0]}  dy={wD[1]}
                         color="var(--amber-400)" strokeWidth={2.0} opacity={0.5}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <SpanLineSvg G={G} dx={wPD[0]} dy={wPD[1]}
                         color="var(--teal-400)"  strokeWidth={2.0} opacity={0.5}/>
          </SvgFadeIn>

          {/* Dashed parallelogram-rule lines: from wTip to u, from wPTip to u */}
          {sweepT > 0 && (
            <g>
              <line x1={wPt.sx} y1={wPt.sy} x2={uPt.sx} y2={uPt.sy}
                    stroke="var(--teal-400)" strokeWidth={1.5}
                    strokeDasharray="5 4" opacity={0.65} strokeLinecap="round"/>
              <line x1={wPPt.sx} y1={wPPt.sy} x2={uPt.sx} y2={uPt.sy}
                    stroke="var(--amber-400)" strokeWidth={1.5}
                    strokeDasharray="5 4" opacity={0.65} strokeLinecap="round"/>
            </g>
          )}

          {/* w (projection onto W) */}
          <SvgFadeIn duration={0.4} delay={0.4}>
            <Arrow G={G} x={wTip[0]} y={wTip[1]} color="var(--amber-400)"
                   strokeWidth={4.2}/>
          </SvgFadeIn>

          {/* w⊥ (projection onto W⊥) */}
          <SvgFadeIn duration={0.4} delay={0.4}>
            <Arrow G={G} x={wPTip[0]} y={wPTip[1]} color="var(--teal-400)"
                   strokeWidth={4.2}/>
          </SvgFadeIn>

          {/* u — drawn on top */}
          <SvgFadeIn duration={0.4} delay={0.2}>
            <Arrow G={G} x={ux} y={uy} color="var(--violet-400)"
                   strokeWidth={3.6}/>
          </SvgFadeIn>

          {/* Live labels following the tips */}
          {sweepT > 0 && (
            <g>
              <text x={uPt.sx + (ux >= 0 ? 16 : -16)}
                    y={uPt.sy + (uy >= 0 ? -10 : 18)}
                    fill="var(--violet-400)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={22}
                    textAnchor={ux >= 0 ? 'start' : 'end'}>u</text>
              {Math.abs(cW) > 0.4 && (
                <text x={wPt.sx + 14 * wD[0]} y={wPt.sy - 14 * wD[1] + 6}
                      fill="var(--amber-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={18} textAnchor="middle">w</text>
              )}
              {Math.abs(cP) > 0.4 && (
                <text x={wPPt.sx + 14 * wPD[0]} y={wPPt.sy - 14 * wPD[1] + 6}
                      fill="var(--teal-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={18} textAnchor="middle">
                  w<tspan fontSize={13} dy={-6}>⊥</tspan>
                </text>
              )}
            </g>
          )}

          {/* Origin */}
          <circle cx={origin.sx} cy={origin.sy} r={4}
                  fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.2}/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          unique decomposition
        </FadeUp>
        <FadeUp duration={0.6} delay={0.8} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 26 : 30, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>u</span> = <span style={{ color: 'var(--amber-300)' }}>w</span> + <span style={{ color: 'var(--teal-300)' }}>w<sup style={{ fontSize: '0.65em' }}>⊥</sup></span>
        </FadeUp>
        <FadeUp duration={0.5} delay={1.8} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-200)', lineHeight: 1.45,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
            w lies on W, w<sup style={{ fontSize: '0.7em' }}>⊥</sup> lies on W<sup style={{ fontSize: '0.7em' }}>⊥</sup>, and the two are perpendicular.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.2} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
            Spin u — the split is unique for every direction.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Direct sum ──────────────────────────────────────────────────
function DirectSumBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
      maxWidth: portrait ? 600 : 'none', textAlign: 'center',
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the direct sum
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 48 : 58, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        ℝ² = <span style={{ color: 'var(--amber-300)' }}>W</span> ⊕ <span style={{ color: 'var(--teal-300)' }}>W<sup style={{ fontSize: '0.6em' }}>⊥</sup></span>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 16,
          color: 'var(--chalk-300)', maxWidth: portrait ? '28ch' : '40ch',
          lineHeight: 1.4,
        }}>
        every vector splits, uniquely
      </FadeUp>

      <FadeUp duration={0.55} delay={2.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 32, color: 'var(--chalk-100)',
          marginTop: 12,
        }}>
        W ∩ W<sup style={{ fontSize: '0.65em' }}>⊥</sup> = {'{0}'}
      </FadeUp>
      <FadeUp duration={0.5} delay={2.8} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', maxWidth: portrait ? '28ch' : '40ch',
          lineHeight: 1.4, marginTop: -8,
        }}>
        the only shared vector is zero
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
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
          fontSize: portrait ? 34 : 44, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        A <span style={{ color: 'var(--amber-300)' }}>subspace</span> and its <span style={{ color: 'var(--teal-300)' }}>complement</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '46ch', lineHeight: 1.4,
        }}>
        Carving the space cleanly in two —<br/>perpendicular sides.
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
