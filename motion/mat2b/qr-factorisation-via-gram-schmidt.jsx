// QR: Gram–Schmidt as a Matrix Factorisation — Manimo lesson scene.
// Mat2B chapter 3 (Indreproduktrom). QR packages Gram–Schmidt as a
// matrix decomposition A = QR with Q orthonormal and R upper triangular.
//
// Inputs: a₁ = (3, 1), a₂ = (1, 2)
//   ‖a₁‖ = √10 ≈ 3.162   →   q₁ = a₁/‖a₁‖ ≈ (0.949, 0.316)
//   q₁·a₂ = (3·1 + 1·2)/√10 = 5/√10 ≈ 1.581
//   e₂ = a₂ − (q₁·a₂) q₁ = (1, 2) − 1.581·(0.949, 0.316) ≈ (−0.500, 1.500)
//   ‖e₂‖ ≈ √(0.25 + 2.25) = √2.5 ≈ 1.581
//   q₂ = e₂/‖e₂‖ ≈ (−0.316, 0.949)
//   R = [‖a₁‖  q₁·a₂] = [3.162  1.581]
//       [  0   ‖e₂‖ ]   [  0    1.581]
//
// Beats:
//    0.00– 4.00  Manimo intro
//    4.00–12.00  Matrix A: two column vectors a₁, a₂ on a grid
//   12.00–20.00  Step 1: normalise a₁ → q₁  (animated shrink)
//   20.00–32.00  Step 2: subtract projection, normalise residual → q₂
//   32.00–44.00  R revealed: upper triangular matrix of coefficients
//   44.00–50.00  Takeaway: A = QR
//
// Beat 4 (Step 2) carries the genuine animation — the projection of a₂
// onto q₁ slides into place, then a₂ "sheds" that component to become e₂,
// which is then normalised to q₂.

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0.00– 4.00 */ 'Gram–Schmidt cleans up the columns of a matrix — what is left behind?',
  /*  4.00–12.00 */ 'Take a matrix A. Read it column by column — these two columns are the vectors we will orthogonalise.',
  /* 12.00–20.00 */ 'Step one: normalise a one. Divide by its length. That is q one — a unit vector pointing along a one.',
  /* 20.00–32.00 */ 'Step two: subtract from a two the part that lies along q one. The residual is perpendicular to q one. Normalise it — that is q two.',
  /* 32.00–44.00 */ 'Read off the matrix R. Down the diagonal sit the lengths r one one and r two two. Above the diagonal sits r one two — the projection coefficient. Zero below. R is upper triangular.',
  /* 44.00–50.00 */ 'Q carries the geometry — orthonormal directions. R carries the bookkeeping — the lengths and the projections. Together they rebuild A.',
];

const NARRATION_AUDIO = 'audio/qr-factorisation-via-gram-schmidt/scene.mp3';

// ─── Geometry helpers ─────────────────────────────────────────────────────
function planeGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 600, ox: 220, oy: 420, unit: 88,
        gridXMin: -2, gridXMax: 4, gridYMin: -1, gridYMax: 4 }
    : { vbW: 640, vbH: 540, ox: 200, oy: 420, unit: 90,
        gridXMin: -2, gridXMax: 4, gridYMin: -1, gridYMax: 4 };
}

function toSvg(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function GridSvg({ G, opacity = 0.18 }) {
  const lines = [];
  for (let k = G.gridXMin; k <= G.gridXMax; k++) {
    const a = toSvg(G, k, G.gridYMin), b = toSvg(G, k, G.gridYMax);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1} opacity={opacity}/>);
  }
  for (let k = G.gridYMin; k <= G.gridYMax; k++) {
    const a = toSvg(G, G.gridXMin, k), b = toSvg(G, G.gridXMax, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1} opacity={opacity}/>);
  }
  return <g>{lines}</g>;
}

function AxesSvg({ G }) {
  const l = toSvg(G, G.gridXMin, 0), r = toSvg(G, G.gridXMax, 0);
  const b = toSvg(G, 0, G.gridYMin), t = toSvg(G, 0, G.gridYMax);
  return (
    <g>
      <line x1={l.sx} y1={l.sy} x2={r.sx} y2={r.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
      <line x1={t.sx} y1={t.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.6} strokeLinecap="round"/>
    </g>
  );
}

// Arrow from origin to (x, y).
function Arrow({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                 strokeWidth = 3.4, opacity = 1, dashed = false,
                 fromX = 0, fromY = 0 }) {
  const a = toSvg(G, fromX, fromY), b = toSvg(G, x, y);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const headLen = 12, headHalf = 6.5;
  const baseX = b.sx - ux * headLen, baseY = b.sy - uy * headLen;
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

function SoftPanel({ portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 880, bottom: 110 }
        : { right: 50, top: 200, width: 400 }),
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.08)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: portrait ? 'center' : 'flex-start',
      textAlign: portrait ? 'center' : 'left',
      gap: 10,
    }}>
      {children}
    </div>
  );
}

// Constants — shared across beats so the math stays consistent.
const A1 = { x: 3, y: 1 };
const A2 = { x: 1, y: 2 };
const A1_NORM = Math.sqrt(A1.x*A1.x + A1.y*A1.y);           // √10 ≈ 3.162
const Q1 = { x: A1.x / A1_NORM, y: A1.y / A1_NORM };
const R12 = Q1.x * A2.x + Q1.y * A2.y;                       // 5/√10 ≈ 1.581
const E2 = { x: A2.x - R12 * Q1.x, y: A2.y - R12 * Q1.y };
const E2_NORM = Math.hypot(E2.x, E2.y);                       // √2.5 ≈ 1.581
const Q2 = { x: E2.x / E2_NORM, y: E2.y / E2_NORM };

function fmt(v, d = 2) {
  if (Math.abs(v) < 1e-3) return '0.00';
  return (v >= 0 ? ' ' : '') + v.toFixed(d);
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="QR decomposition"
      title="QR: Gram–Schmidt as a Matrix Factorisation"
      duration={SCENE_DURATION}
      introEnd={4.85}
      introCaption="Gram–Schmidt — and what is left behind?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.85} end={11.66}>
        <MatrixABeat/>
      </Sprite>

      <Sprite start={11.66} end={19.01}>
        <Step1NormaliseBeat/>
      </Sprite>

      <Sprite start={19.01} end={29.63}>
        <Step2ResidualBeat/>
      </Sprite>

      <Sprite start={29.63} end={43.35}>
        <MatrixRBeat/>
      </Sprite>

      <Sprite start={43.35} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Matrix A ────────────────────────────────────────────────────
function MatrixABeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);

  return (
    <>
      <div style={{
        position: 'absolute',
        left: portrait ? '50%' : '30%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><GridSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}><AxesSvg G={G}/></SvgFadeIn>

          <SvgFadeIn duration={0.4} delay={0.4}>
            <Arrow G={G} x={A1.x} y={A1.y} color="var(--amber-400)"
                   label="a₁" labelDX={22} labelDY={-4}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.9}>
            <Arrow G={G} x={A2.x} y={A2.y} color="var(--teal-400)"
                   label="a₂" labelDX={-22} labelDY={-4}/>
          </SvgFadeIn>

          <circle cx={toSvg(G, 0, 0).sx} cy={toSvg(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          read columnwise
        </FadeUp>
        <FadeUp duration={0.55} delay={1.2} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 26 : 32, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            A&nbsp;=&nbsp;[&nbsp;<span style={{ color: 'var(--amber-400)' }}>a₁</span>&nbsp;&nbsp;<span style={{ color: 'var(--teal-400)' }}>a₂</span>&nbsp;]
        </FadeUp>
        <FadeUp duration={0.5} delay={1.7} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-200)', lineHeight: 1.5, marginTop: 4,
          }}>
          a₁ = (3, 1)<br/>
          a₂ = (1, 2)
        </FadeUp>
        <FadeUp duration={0.5} delay={2.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '34ch', marginTop: 6,
          }}>
          The columns are the inputs to Gram–Schmidt.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Step 1 — normalise a₁ → q₁ ──────────────────────────────────
function Step1NormaliseBeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);
  const { localTime } = useSprite();

  // Animate a₁ shrinking down to q₁ over [1.5, 4.5] s.
  const ANIM_START = 1.5;
  const ANIM_DUR = 3.0;
  const t = clamp((localTime - ANIM_START) / ANIM_DUR, 0, 1);
  const easedT = Easing.easeInOutCubic(t);
  const scale = 1 - easedT * (1 - 1 / A1_NORM);
  const curX = A1.x * scale;
  const curY = A1.y * scale;

  // Unit circle (radius 1 in math units) — fades in around 60% through anim.
  const unitOpacity = clamp((t - 0.4) / 0.3, 0, 1) * 0.6;

  return (
    <>
      <div style={{
        position: 'absolute',
        left: portrait ? '50%' : '30%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><GridSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}><AxesSvg G={G}/></SvgFadeIn>

          {/* Original a₁ — ghost at full length once shrinking starts */}
          {t > 0.02 && (
            <Arrow G={G} x={A1.x} y={A1.y} color="var(--amber-400)"
                   strokeWidth={2.0} opacity={0.25} dashed={true}/>
          )}

          {/* Unit circle */}
          {unitOpacity > 0.02 && (
            <circle cx={toSvg(G, 0, 0).sx} cy={toSvg(G, 0, 0).sy}
                    r={G.unit}
                    stroke="var(--chalk-300)" strokeWidth={1.2}
                    strokeDasharray="4 5" fill="none" opacity={unitOpacity}/>
          )}

          {/* Live shrinking vector — becomes q₁ */}
          <SvgFadeIn duration={0.4} delay={0.0}>
            <Arrow G={G} x={curX} y={curY}
                   color={t > 0.7 ? 'var(--amber-300)' : 'var(--amber-400)'}
                   label={t > 0.7 ? 'q₁' : 'a₁'}
                   labelDX={t > 0.7 ? 18 : 22}
                   labelDY={t > 0.7 ? -10 : -4}
                   strokeWidth={3.8}/>
          </SvgFadeIn>

          {/* Length tick — small bar near the tip showing current length */}
          <SvgFadeIn duration={0.4} delay={1.0}>
            <text x={toSvg(G, curX, curY).sx + (curY >= 0 ? 26 : 26)}
                  y={toSvg(G, curX, curY).sy + (curY >= 0 ? 18 : 18)}
                  fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                  fontSize={12}>
              len = {(A1_NORM * scale).toFixed(2)}
            </text>
          </SvgFadeIn>

          <circle cx={toSvg(G, 0, 0).sx} cy={toSvg(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          step 1 — normalise
        </FadeUp>
        <FadeUp duration={0.55} delay={1.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 24 : 28, color: 'var(--amber-300)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            q₁ = a₁ / ‖a₁‖
        </FadeUp>
        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-200)', lineHeight: 1.5, marginTop: 4,
          }}>
          ‖a₁‖ = √10 ≈ {A1_NORM.toFixed(3)}<br/>
          q₁ ≈ ({Q1.x.toFixed(3)}, {Q1.y.toFixed(3)})
        </FadeUp>
        <FadeUp duration={0.5} delay={3.4} distance={6}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', maxWidth: portrait ? '30ch' : '34ch',
            marginTop: 4,
          }}>
          q₁ is the unit vector pointing along a₁. The length goes into R as r₁₁.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Step 2 — projection + residual + q₂ ─────────────────────────
function Step2ResidualBeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);
  const { localTime } = useSprite();

  // Animation phases (within this 12s beat):
  //   0.0 – 1.0  show a₁ (faint), q₁, a₂
  //   1.0 – 3.5  draw projection arrow of a₂ on q₁ (violet)
  //   3.5 – 6.5  shrink a₂ down to the residual e₂ (subtract projection)
  //   6.5 – 9.0  shrink e₂ to unit length → q₂
  //   9.0 – 12   highlight q₁ ⊥ q₂

  const t = localTime;
  const projT = clamp((t - 1.0) / 1.5, 0, 1);
  const projEased = Easing.easeOutCubic(projT);
  const projVecX = R12 * Q1.x * projEased;
  const projVecY = R12 * Q1.y * projEased;

  // Shrinking a₂ to e₂ over [3.5, 6.5].
  const subT = clamp((t - 3.5) / 3.0, 0, 1);
  const subEased = Easing.easeInOutCubic(subT);
  // a₂ becomes  a₂ - subEased * (R12 * Q1)
  const a2curX = A2.x - subEased * R12 * Q1.x;
  const a2curY = A2.y - subEased * R12 * Q1.y;

  // Normalising e₂ to q₂ over [6.5, 9.0].
  const normT = clamp((t - 6.5) / 2.5, 0, 1);
  const normEased = Easing.easeInOutCubic(normT);
  const e2Scale = 1 - normEased * (1 - 1 / E2_NORM);
  // Once subT done, vector = E2 * e2Scale.
  const finalX = subT >= 1
    ? E2.x * e2Scale
    : a2curX;
  const finalY = subT >= 1
    ? E2.y * e2Scale
    : a2curY;

  // Show projection arrow only during phases when meaningful.
  const showProj = t >= 1.0 && t < 4.5;

  // Show right-angle marker once residual is in place.
  const showPerp = subT >= 0.7;

  return (
    <>
      <div style={{
        position: 'absolute',
        left: portrait ? '50%' : '30%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><GridSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}><AxesSvg G={G}/></SvgFadeIn>

          {/* Faint original a₁ as reference */}
          <Arrow G={G} x={A1.x} y={A1.y} color="var(--amber-400)"
                 strokeWidth={1.8} opacity={0.22} dashed={true}/>

          {/* q₁ — unit vector along a₁ direction */}
          <SvgFadeIn duration={0.4} delay={0.0}>
            <Arrow G={G} x={Q1.x} y={Q1.y} color="var(--amber-300)"
                   label="q₁" labelDX={18} labelDY={-8} strokeWidth={3.6}/>
          </SvgFadeIn>

          {/* Projection arrow along q₁ direction — violet */}
          {showProj && projT > 0.01 && (
            <Arrow G={G} x={projVecX} y={projVecY}
                   color="var(--violet-400)"
                   strokeWidth={3.0}
                   opacity={clamp((4.5 - t) * 2, 0, 1)}/>
          )}
          {showProj && projT > 0.3 && (
            <SvgFadeIn duration={0.4} delay={1.3}>
              <text x={toSvg(G, projVecX / 2 - 0.05, projVecY / 2 - 0.45).sx}
                    y={toSvg(G, projVecX / 2 - 0.05, projVecY / 2 - 0.45).sy}
                    fill="var(--violet-300)" fontFamily="var(--font-mono)"
                    fontSize={12} textAnchor="middle">
                (q₁·a₂) q₁
              </text>
            </SvgFadeIn>
          )}

          {/* Dashed connector from a₂ tip down to projection tip — visible during proj phase */}
          {showProj && projT > 0.4 && subT < 0.05 && (
            <line
              x1={toSvg(G, A2.x, A2.y).sx}
              y1={toSvg(G, A2.x, A2.y).sy}
              x2={toSvg(G, R12 * Q1.x, R12 * Q1.y).sx}
              y2={toSvg(G, R12 * Q1.x, R12 * Q1.y).sy}
              stroke="var(--chalk-300)" strokeWidth={1.2}
              strokeDasharray="4 5" opacity={0.7}/>
          )}

          {/* a₂ / residual / q₂ — single live vector that morphs through the phases */}
          {(() => {
            let label = 'a₂';
            let color = 'var(--teal-400)';
            if (subT > 0.5 && normT < 0.5) {
              label = 'e₂';
              color = 'var(--teal-300)';
            } else if (normT >= 0.5) {
              label = 'q₂';
              color = 'var(--teal-300)';
            }
            return (
              <Arrow G={G} x={finalX} y={finalY}
                     color={color} label={label}
                     labelDX={finalX >= 0 ? 18 : -18}
                     labelDY={finalY >= 0 ? -10 : 18}
                     strokeWidth={3.8}/>
            );
          })()}

          {/* Right-angle marker at the foot of e₂ → q₁ */}
          {showPerp && (
            (() => {
              // foot of perpendicular = projection point (which is q1 scaled by R12 in math coords)
              const foot = toSvg(G, R12 * Q1.x, R12 * Q1.y);
              const sq = 12;
              const qDx = Q1.x, qDy = Q1.y;
              const perpDx = -qDy, perpDy = qDx;
              // Build a small square in math units (size ~0.18 unit)
              const s = 0.20;
              const p1 = toSvg(G, R12 * Q1.x - s * qDx, R12 * Q1.y - s * qDy);
              const p2 = toSvg(G, R12 * Q1.x - s * qDx + s * perpDx,
                                  R12 * Q1.y - s * qDy + s * perpDy);
              const p3 = toSvg(G, R12 * Q1.x + s * perpDx,
                                  R12 * Q1.y + s * perpDy);
              return (
                <path d={`M ${p1.sx} ${p1.sy} L ${p2.sx} ${p2.sy} L ${p3.sx} ${p3.sy}`}
                      stroke="var(--chalk-100)" strokeWidth={1.5} fill="none"/>
              );
            })()
          )}

          {/* Original a₂ ghost — visible only before subtraction starts */}
          {subT < 0.05 && (
            <Arrow G={G} x={A2.x} y={A2.y} color="var(--teal-400)"
                   strokeWidth={1.8} opacity={0.25} dashed={true}/>
          )}

          <circle cx={toSvg(G, 0, 0).sx} cy={toSvg(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          step 2 — subtract & normalise
        </FadeUp>
        <FadeUp duration={0.55} delay={1.8} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 20 : 24, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            e₂ = a₂ − (q₁ · a₂) q₁
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-200)', lineHeight: 1.5, marginTop: 4,
          }}>
            q₁ · a₂ ≈ {R12.toFixed(3)}<br/>
            e₂ ≈ ({E2.x.toFixed(3)}, {E2.y.toFixed(3)})<br/>
            ‖e₂‖ ≈ {E2_NORM.toFixed(3)}
        </FadeUp>
        <FadeUp duration={0.55} delay={4.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 20 : 24, color: 'var(--teal-300)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            q₂ = e₂ / ‖e₂‖
        </FadeUp>
        <FadeUp duration={0.5} delay={6.0} distance={6}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--chalk-300)', maxWidth: portrait ? '30ch' : '34ch',
            marginTop: 4,
          }}>
          The residual is perpendicular to q₁ by construction — that is the whole point.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: R matrix revealed ───────────────────────────────────────────
function MatrixRBeat() {
  const portrait = usePortrait();

  const matStyle = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
    color: 'var(--chalk-100)', lineHeight: 1.6,
  };
  const labelStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 11,
    color: 'var(--amber-300)', letterSpacing: '0.18em',
    textTransform: 'uppercase',
  };

  function Matrix({ rows, accent }) {
    const cellW = portrait ? 86 : 110;
    const cellH = portrait ? 32 : 36;
    return (
      <div style={{
        display: 'inline-block', position: 'relative',
        padding: `${cellH * 0.18}px ${cellH * 0.35}px`,
      }}>
        {/* Brackets */}
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: 8, borderLeft: `2px solid ${accent}`,
          borderTop: `2px solid ${accent}`, borderBottom: `2px solid ${accent}`,
        }}/>
        <span style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: 8, borderRight: `2px solid ${accent}`,
          borderTop: `2px solid ${accent}`, borderBottom: `2px solid ${accent}`,
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {rows.map((row, i) => (
            <div key={i} style={{ display: 'flex', gap: 8 }}>
              {row.map((cell, j) => (
                <div key={j} style={{
                  width: cellW, textAlign: 'center',
                  fontFamily: cell.mono ? 'var(--font-mono)' : 'var(--font-serif)',
                  fontStyle: cell.mono ? 'normal' : 'italic',
                  fontSize: portrait ? 16 : 20,
                  color: cell.color || 'var(--chalk-100)',
                }}>
                  {cell.text}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const Qrows = [
    [{ text: Q1.x.toFixed(2), color: 'var(--amber-300)', mono: true },
     { text: Q2.x.toFixed(2), color: 'var(--teal-300)', mono: true }],
    [{ text: Q1.y.toFixed(2), color: 'var(--amber-300)', mono: true },
     { text: Q2.y.toFixed(2), color: 'var(--teal-300)', mono: true }],
  ];
  const Rrows = [
    [{ text: A1_NORM.toFixed(2), color: 'var(--amber-300)', mono: true },
     { text: R12.toFixed(2), color: 'var(--chalk-100)', mono: true }],
    [{ text: '0', color: 'var(--chalk-300)', mono: true },
     { text: E2_NORM.toFixed(2), color: 'var(--teal-300)', mono: true }],
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 24,
    }}>
      <FadeUp duration={0.4} delay={0.0} distance={6} style={labelStyle}>
        the QR factorisation
      </FadeUp>

      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        alignItems: 'center', gap: portrait ? 14 : 24,
      }}>
        {/* A */}
        <FadeUp duration={0.55} delay={0.3} distance={10}
          style={{ display: 'flex', flexDirection: 'column',
                   alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                        fontSize: portrait ? 22 : 26,
                        color: 'var(--chalk-100)' }}>A</div>
          <Matrix rows={[
            [{ text: A1.x.toFixed(0), color: 'var(--amber-400)', mono: true },
             { text: A2.x.toFixed(0), color: 'var(--teal-400)', mono: true }],
            [{ text: A1.y.toFixed(0), color: 'var(--amber-400)', mono: true },
             { text: A2.y.toFixed(0), color: 'var(--teal-400)', mono: true }],
          ]} accent="var(--chalk-200)"/>
        </FadeUp>

        <FadeUp duration={0.4} delay={0.7} distance={6}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                   fontSize: portrait ? 26 : 30, color: 'var(--chalk-200)' }}>
          =
        </FadeUp>

        {/* Q */}
        <FadeUp duration={0.55} delay={0.9} distance={10}
          style={{ display: 'flex', flexDirection: 'column',
                   alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                        fontSize: portrait ? 22 : 26,
                        color: 'var(--chalk-100)' }}>Q</div>
          <Matrix rows={Qrows} accent="var(--chalk-200)"/>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--chalk-300)', letterSpacing: '0.10em',
                        textTransform: 'uppercase', marginTop: 2 }}>
            orthonormal cols
          </div>
        </FadeUp>

        {/* R */}
        <FadeUp duration={0.55} delay={1.5} distance={10}
          style={{ display: 'flex', flexDirection: 'column',
                   alignItems: 'center', gap: 6 }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                        fontSize: portrait ? 22 : 26,
                        color: 'var(--chalk-100)' }}>R</div>
          <Matrix rows={Rrows} accent="var(--amber-300)"/>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                        color: 'var(--chalk-300)', letterSpacing: '0.10em',
                        textTransform: 'uppercase', marginTop: 2 }}>
            upper triangular
          </div>
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={3.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '36ch' : '60ch', lineHeight: 1.5,
        }}>
        Diagonal of R holds the lengths. Above-diagonal entries hold the projection coefficients. Below the diagonal is zero — that is what "upper triangular" means.
      </FadeUp>
    </div>
  );
}

// ─── Beat 6: Takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: portrait ? 600 : 940,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.4} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 42, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        <span style={{ color: 'var(--teal-300)' }}>Q</span>&nbsp;orthonormal&nbsp;·&nbsp;<span style={{ color: 'var(--amber-300)' }}>R</span>&nbsp;upper triangular&nbsp;=&nbsp;A
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '28ch' : '52ch', lineHeight: 1.4,
        }}>
        Gram–Schmidt packaged as a matrix factorisation.
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
