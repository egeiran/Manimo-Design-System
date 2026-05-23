// Rotations Preserve the Dot Product — Manimo lesson scene.
// Mat2B chapter 3 (Indreproduktrom). An orthogonal matrix R satisfies
// RᵀR = I, so ⟨Ru, Rv⟩ = uᵀ Rᵀ R v = uᵀ v = ⟨u, v⟩. Sweep the rotation
// angle and watch the dot product readout stay rock-steady while the
// two vectors swing together.
//
// Inputs: u = (2.5, 0.5), v = (1.0, 2.0)
//   ‖u‖ = √(6.25 + 0.25) = √6.5 ≈ 2.550
//   ‖v‖ = √(1 + 4) = √5 ≈ 2.236
//   u · v = 2.5 + 1.0 = 3.5
//   cos θ = 3.5 / (√6.5 · √5) ≈ 0.614  → θ ≈ 52.1°
//
// Beats:
//    0.00– 4.00  Manimo intro
//    4.00–12.00  Setup: two vectors, dot product computed, angle marked
//   12.00–28.00  Rotation sweep: α from 0 → 2π; both vectors rotate; live readouts hold steady
//   28.00–36.00  Why: ⟨Ru, Rv⟩ = uᵀ Rᵀ R v = uᵀ I v = ⟨u, v⟩
//   36.00–41.00  Takeaway: rigid motions preserve geometry
//
// Beat 3 (RotationSweep) is the genuine animation — a continuous angle
// sweep that drives both vectors and a live readout that remains constant.

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0.00– 4.00 */ 'Rotate the whole picture. Does the dot product change?',
  /*  4.00–12.00 */ 'Start with two vectors u and v. Compute their dot product and note the angle between them.',
  /* 12.00–28.00 */ 'Multiply both vectors by the rotation matrix R of alpha. As alpha sweeps, both vectors swing together. Their dot product holds steady — the angle between them never changes.',
  /* 28.00–36.00 */ 'Why? Because R transpose R equals the identity. The dot product is u transpose v — and the R cancels itself out inside.',
  /* 36.00–41.00 */ 'Rotations are rigid motions. Lengths, angles, dot products — all invariant. The geometry travels with the vectors.',
];

const NARRATION_AUDIO = 'audio/angle-preservation-by-rotation/scene.mp3';

// ─── Constants ────────────────────────────────────────────────────────────
const U = { x: 2.5, y: 0.5 };
const V = { x: 1.0, y: 2.0 };
const U_NORM = Math.hypot(U.x, U.y);
const V_NORM = Math.hypot(V.x, V.y);
const DOT_UV = U.x * V.x + U.y * V.y;
const COS_TH = DOT_UV / (U_NORM * V_NORM);
const ANGLE_DEG = Math.acos(COS_TH) * 180 / Math.PI;

function rotate(v, alpha) {
  const c = Math.cos(alpha), s = Math.sin(alpha);
  return { x: c * v.x - s * v.y, y: s * v.x + c * v.y };
}

// ─── Geometry helpers ─────────────────────────────────────────────────────
function planeGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 600, ox: 300, oy: 300, unit: 70,
        gridXMin: -4, gridXMax: 4, gridYMin: -4, gridYMax: 4 }
    : { vbW: 620, vbH: 540, ox: 310, oy: 270, unit: 64,
        gridXMin: -4, gridXMax: 4, gridYMin: -4, gridYMax: 4 };
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

function Arrow({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                 strokeWidth = 3.4, opacity = 1, dashed = false }) {
  const a = toSvg(G, 0, 0), b = toSvg(G, x, y);
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

// Small reusable arc between two vectors (math coords).
function AngleArc({ G, vec1, vec2, color = 'var(--chalk-200)', radius = 32, label = null }) {
  const a1 = Math.atan2(vec1.y, vec1.x);
  const a2 = Math.atan2(vec2.y, vec2.x);
  let d = a2 - a1;
  // Normalise to (-π, π]
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  const sweepFlag = d > 0 ? 0 : 1; // 0 → counter-clockwise in SVG y-down
  const largeArc = Math.abs(d) > Math.PI ? 1 : 0;
  const origin = toSvg(G, 0, 0);
  const startX = origin.sx + radius * Math.cos(a1);
  const startY = origin.sy - radius * Math.sin(a1);
  const endX = origin.sx + radius * Math.cos(a2);
  const endY = origin.sy - radius * Math.sin(a2);
  const midAng = a1 + d / 2;
  return (
    <g>
      <path d={`M ${startX} ${startY} A ${radius} ${radius} 0 ${largeArc} ${sweepFlag} ${endX} ${endY}`}
            stroke={color} strokeWidth={1.6} fill="none" strokeDasharray="4 4"/>
      {label && (
        <text x={origin.sx + (radius + 14) * Math.cos(midAng)}
              y={origin.sy - (radius + 14) * Math.sin(midAng) + 5}
              fill={color} fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="orthogonal transformations"
      title="Rotations Preserve the Dot Product"
      duration={SCENE_DURATION}
      introEnd={3.88}
      introCaption="Spin the plane — does u · v survive?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.88} end={9.61}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={9.61} end={21.64}>
        <RotationSweepBeat/>
      </Sprite>

      <Sprite start={21.64} end={31.7}>
        <WhyItHoldsBeat/>
      </Sprite>

      <Sprite start={31.7} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup ───────────────────────────────────────────────────────
function SetupBeat() {
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

          <SvgFadeIn duration={0.4} delay={0.3}>
            <Arrow G={G} x={U.x} y={U.y} color="var(--amber-400)"
                   label="u" labelDX={22} labelDY={-4}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.8}>
            <Arrow G={G} x={V.x} y={V.y} color="var(--teal-400)"
                   label="v" labelDX={-22} labelDY={-4}/>
          </SvgFadeIn>

          {/* Angle arc */}
          <SvgFadeIn duration={0.4} delay={1.4}>
            <AngleArc G={G} vec1={U} vec2={V}
                      color="var(--chalk-200)" radius={36} label="θ"/>
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
          two vectors, one dot product
        </FadeUp>
        <FadeUp duration={0.5} delay={0.8} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-200)', lineHeight: 1.55, marginTop: 4,
          }}>
          u = (2.5, 0.5)<br/>
          v = (1.0, 2.0)
        </FadeUp>
        <FadeUp duration={0.55} delay={1.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            u · v = 2.5 + 1.0 = <span style={{ color: 'var(--amber-300)' }}>{DOT_UV.toFixed(1)}</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={2.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.5, marginTop: 4,
          }}>
            ‖u‖ ≈ {U_NORM.toFixed(2)}  ‖v‖ ≈ {V_NORM.toFixed(2)}<br/>
            θ ≈ {ANGLE_DEG.toFixed(0)}°
        </FadeUp>
        <FadeUp duration={0.5} delay={3.4} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', maxWidth: portrait ? '30ch' : '34ch',
            marginTop: 4,
          }}>
          Now rotate both arrows together — same R, applied to each.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Rotation sweep — the genuine animation ──────────────────────
function RotationSweepBeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);
  const { localTime } = useSprite();

  // Sweep α from 0 to 2π over [1.0, 13.0] s of the 16s beat.
  const SWEEP_START = 1.0;
  const SWEEP_DUR = 12.0;
  const sweepT = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const alpha = sweepT * 2 * Math.PI;
  const alphaDeg = alpha * 180 / Math.PI;

  const Ru = rotate(U, alpha);
  const Rv = rotate(V, alpha);

  // Live dot product (will stay essentially constant — float roundoff aside).
  const liveDot = Ru.x * Rv.x + Ru.y * Rv.y;
  const liveNormU = Math.hypot(Ru.x, Ru.y);
  const liveNormV = Math.hypot(Rv.x, Rv.y);

  return (
    <>
      <div style={{
        position: 'absolute',
        left: portrait ? '50%' : '30%',
        top: portrait ? '32%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}><GridSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}><AxesSvg G={G}/></SvgFadeIn>

          {/* Ghost original positions — drawn faintly so the sweep is visible */}
          <Arrow G={G} x={U.x} y={U.y} color="var(--amber-400)"
                 strokeWidth={1.6} opacity={0.18} dashed={true}/>
          <Arrow G={G} x={V.x} y={V.y} color="var(--teal-400)"
                 strokeWidth={1.6} opacity={0.18} dashed={true}/>

          {/* Circles of radius ‖u‖ and ‖v‖ — make it visible that rotation preserves lengths */}
          <SvgFadeIn duration={0.4} delay={0.3}>
            <circle cx={toSvg(G, 0, 0).sx} cy={toSvg(G, 0, 0).sy}
                    r={U_NORM * G.unit}
                    stroke="var(--amber-300)" strokeWidth={1.0}
                    strokeDasharray="3 5" fill="none" opacity={0.35}/>
            <circle cx={toSvg(G, 0, 0).sx} cy={toSvg(G, 0, 0).sy}
                    r={V_NORM * G.unit}
                    stroke="var(--teal-300)" strokeWidth={1.0}
                    strokeDasharray="3 5" fill="none" opacity={0.35}/>
          </SvgFadeIn>

          {/* Rotated u and v */}
          <SvgFadeIn duration={0.4} delay={0.6}>
            <Arrow G={G} x={Ru.x} y={Ru.y} color="var(--amber-400)"
                   label="Ru"
                   labelDX={Ru.x >= 0 ? 22 : -22}
                   labelDY={Ru.y >= 0 ? -12 : 18}
                   strokeWidth={3.8}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.9}>
            <Arrow G={G} x={Rv.x} y={Rv.y} color="var(--teal-400)"
                   label="Rv"
                   labelDX={Rv.x >= 0 ? -22 : 22}
                   labelDY={Rv.y >= 0 ? -12 : 18}
                   strokeWidth={3.8}/>
          </SvgFadeIn>

          {/* Angle arc between Ru and Rv — stays the same size */}
          {sweepT > 0.02 && (
            <g opacity={clamp(sweepT * 10, 0, 1)}>
              <AngleArc G={G} vec1={Ru} vec2={Rv}
                        color="var(--chalk-200)" radius={36} label="θ"/>
            </g>
          )}

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
          rotate both by R(α)
        </FadeUp>

        <FadeUp duration={0.55} delay={0.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--amber-300)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            R(α) u   and   R(α) v
        </FadeUp>

        <FadeUp duration={0.4} delay={1.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', lineHeight: 1.5, marginTop: 4,
          }}>
            α = {alphaDeg.toFixed(0)}°
        </FadeUp>

        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 16,
            color: 'var(--chalk-200)', lineHeight: 1.55, marginTop: 4,
          }}>
            ‖Ru‖ = {liveNormU.toFixed(2)}<br/>
            ‖Rv‖ = {liveNormV.toFixed(2)}
        </FadeUp>

        <FadeUp duration={0.5} delay={1.8} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 20,
            color: 'var(--teal-300)', lineHeight: 1.3, marginTop: 6,
            padding: '6px 10px',
            border: '1px solid rgba(232,220,193,0.18)',
            borderRadius: 8,
          }}>
            ⟨Ru, Rv⟩ = {liveDot.toFixed(2)}
        </FadeUp>

        <FadeUp duration={0.5} delay={2.6} distance={6}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--chalk-300)', maxWidth: portrait ? '30ch' : '34ch',
            marginTop: 4,
          }}>
          Watch the dot product — it holds steady as the vectors swing.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Why it holds ────────────────────────────────────────────────
function WhyItHoldsBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
      maxWidth: portrait ? 600 : 1080,
    }}>
      <FadeUp duration={0.4} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        algebraic reason
      </FadeUp>

      {/* The derivation chain — each step staggered */}
      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14,
                      alignItems: 'center', textAlign: 'center' }}>
          <FadeUp duration={0.5} delay={0.3} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            ⟨R u, R v⟩
          </FadeUp>
          <FadeUp duration={0.4} delay={0.9} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={1.1} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            (R u)ᵀ (R v)
          </FadeUp>
          <FadeUp duration={0.4} delay={1.7} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={1.9} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            uᵀ <span style={{ color: 'var(--amber-300)' }}>Rᵀ R</span> v
          </FadeUp>
          <FadeUp duration={0.4} delay={2.5} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={2.7} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-100)' }}>
            uᵀ <span style={{ color: 'var(--amber-300)' }}>I</span> v
          </FadeUp>
          <FadeUp duration={0.4} delay={3.3} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 16,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={3.5} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--amber-300)' }}>
            ⟨u, v⟩
          </FadeUp>
        </div>
      ) : (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14,
          flexWrap: 'nowrap',
        }}>
          <FadeUp duration={0.5} delay={0.3} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)' }}>
            ⟨R u, R v⟩
          </FadeUp>
          <FadeUp duration={0.4} delay={0.7} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 22,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={0.9} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)' }}>
            (R u)ᵀ (R v)
          </FadeUp>
          <FadeUp duration={0.4} delay={1.3} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 22,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={1.5} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)' }}>
            uᵀ <span style={{ color: 'var(--amber-300)' }}>Rᵀ R</span> v
          </FadeUp>
          <FadeUp duration={0.4} delay={1.9} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 22,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={2.1} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 26, color: 'var(--chalk-100)' }}>
            uᵀ <span style={{ color: 'var(--amber-300)' }}>I</span> v
          </FadeUp>
          <FadeUp duration={0.4} delay={2.5} distance={6}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 22,
                     color: 'var(--chalk-300)' }}>=</FadeUp>
          <FadeUp duration={0.5} delay={2.7} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 30, color: 'var(--amber-300)' }}>
            ⟨u, v⟩
          </FadeUp>
        </div>
      )}

      <FadeUp duration={0.55} delay={3.6} distance={12}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '34ch' : '56ch', lineHeight: 1.4, marginTop: 8,
        }}>
        The rotation cancels itself — that is exactly what "R is orthogonal" means.
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
          fontSize: portrait ? 30 : 42, color: 'var(--chalk-100)',
          lineHeight: 1.25,
        }}>
        RᵀR = I  ⇒  ⟨<span style={{ color: 'var(--amber-300)' }}>Ru</span>, <span style={{ color: 'var(--teal-300)' }}>Rv</span>⟩ = ⟨u, v⟩
      </FadeUp>
      <FadeUp duration={0.55} delay={1.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '28ch' : '46ch', lineHeight: 1.4,
        }}>
        Rigid motion — the geometry rides along.
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
