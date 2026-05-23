// Cauchy–Schwarz: The Dot Product Has a Ceiling — Manimo lesson scene.
// Mat2B chapter 3 (Indreproduktrom). The Cauchy–Schwarz inequality
// |u·v| ≤ ‖u‖·‖v‖ bounds the dot product by the product of lengths;
// equality holds exactly when u and v are parallel.
//
// Beats:
//    0.00– 4.00  Manimo intro: "How big can u·v get?"
//    4.00–12.00  Setup: fix ‖u‖ and ‖v‖; show the ceiling
//   12.00–26.00  Angle sweep: v rotates 0→2π; the chart traces u·v ∈ [−‖u‖‖v‖, +‖u‖‖v‖]
//   26.00–33.00  Equality condition: parallel hits the bound
//   33.00–39.00  Takeaway: this is why cos θ exists in [−1, 1]
//
// Authoring notes:
//   • Beat 3 carries the genuine animation: an angle sweep with a live
//     chart that traces u·v as θ sweeps, bounded by horizontal lines at
//     ±‖u‖·‖v‖.
//   • SvgFadeIn inside <svg>; FadeUp outside.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 4.00 */ 'How big can the dot product of two vectors get?',
  /*  4.00–12.00 */ 'Fix the lengths of u and v. The lengths of u and v multiplied set a ceiling — the dot product can never exceed it in size.',
  /* 12.00–26.00 */ 'Spin v around. The dot product rises and falls, but the trace stays bounded between plus and minus the ceiling — it kisses the bound exactly when v lines up with u.',
  /* 26.00–33.00 */ 'Equality holds when u and v are parallel — same direction gives plus the ceiling, opposite directions give minus. Anything in between misses.',
  /* 33.00–39.00 */ 'Cauchy and Schwarz: the dot product is squeezed by the lengths. That is what makes cosine of theta a real number between minus one and one.',
];

const NARRATION_AUDIO = 'audio/cauchy-schwarz-inequality/scene.mp3';

// ─── Geometry helpers (per aspect) ────────────────────────────────────────
function planeGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 600, ox: 300, oy: 300, unit: 64,
        gridXMin: -4, gridXMax: 4, gridYMin: -4, gridYMax: 4 }
    : { vbW: 620, vbH: 560, ox: 310, oy: 280, unit: 64,
        gridXMin: -4, gridXMax: 4, gridYMin: -4, gridYMax: 4 };
}

function toSvg(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function GridSvg({ G, opacity = 0.20 }) {
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
                 strokeWidth = 3.4, opacity = 1 }) {
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
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ portrait, children, bottom = false }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 880, bottom: 110 }
        : (bottom
            ? { right: 60, left: 60, bottom: 60, top: 'auto' }
            : { right: 56, top: 200, width: 380 })),
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

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="inner product spaces"
      title="Cauchy–Schwarz: The Dot Product Has a Ceiling"
      duration={SCENE_DURATION}
      introEnd={3.47}
      introCaption="How big can u · v get?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.47} end={12.66}>
        <LengthsAndCeilingBeat/>
      </Sprite>

      <Sprite start={12.66} end={24.14}>
        <AngleSweepBeat/>
      </Sprite>

      <Sprite start={24.14} end={33.94}>
        <EqualityConditionBeat/>
      </Sprite>

      <Sprite start={33.94} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Lengths and ceiling ─────────────────────────────────────────
// u = (2.4, 1.6) — magnitude ≈ 2.88. v = (1.5, 1.0) — magnitude ≈ 1.80.
// Static composition that introduces the bound symbolically.
function LengthsAndCeilingBeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);

  const ux = 2.4, uy = 0.8;
  const vx = 0.8, vy = 2.0;
  const uLen = Math.hypot(ux, uy);
  const vLen = Math.hypot(vx, vy);
  const ceiling = uLen * vLen;

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
          <SvgFadeIn duration={0.4} delay={0.0}>
            <GridSvg G={G}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <AxesSvg G={G}/>
          </SvgFadeIn>

          <SvgFadeIn duration={0.4} delay={0.3}>
            <Arrow G={G} x={ux} y={uy} color="var(--amber-400)"
                   label="u" labelDX={22} labelDY={-4}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.7}>
            <Arrow G={G} x={vx} y={vy} color="var(--teal-400)"
                   label="v" labelDX={-18} labelDY={-4}/>
          </SvgFadeIn>

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
          the inequality
        </FadeUp>
        <FadeUp duration={0.55} delay={1.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 26 : 30, color: 'var(--amber-300)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            |&thinsp;<span style={{ color: 'var(--amber-400)' }}>u</span>·<span style={{ color: 'var(--teal-400)' }}>v</span>&thinsp;|&nbsp;≤&nbsp;‖u‖&nbsp;·&nbsp;‖v‖
        </FadeUp>
        <FadeUp duration={0.5} delay={2.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 14,
            color: 'var(--chalk-200)', lineHeight: 1.55, marginTop: 4,
          }}>
            <span style={{ color: 'var(--amber-300)' }}>‖u‖</span> = {uLen.toFixed(2)}
            &nbsp;&nbsp;
            <span style={{ color: 'var(--teal-300)' }}>‖v‖</span> = {vLen.toFixed(2)}
        </FadeUp>
        <FadeUp duration={0.5} delay={2.8} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '34ch' : '34ch', marginTop: 4,
          }}>
          The ceiling is the product of the lengths — the dot product cannot grow past it.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
            color: 'var(--rose-300)', marginTop: 4,
          }}>
          ceiling = ‖u‖·‖v‖ ≈ {ceiling.toFixed(2)}
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Angle sweep ─────────────────────────────────────────────────
// u fixed at (uLen, 0). v rotates from θ ≈ 0 around to ~2π over ~12 s.
// A small chart on the right traces u·v(t) bounded by horizontal lines at
// ±‖u‖·‖v‖. The bound is the visible ceiling.
function AngleSweepBeat() {
  const portrait = usePortrait();
  const G = planeGeom(portrait);
  const { localTime } = useSprite();

  const uLen = 2.6, vLen = 1.7;
  const ux = uLen, uy = 0;
  const ceiling = uLen * vLen;

  // Sweep θ from 0 to 2π over [1.5, 12.5] s within the 14s beat.
  const SWEEP_START = 1.5;
  const SWEEP_DUR = 11.0;
  const sweepT = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const thetaDeg = sweepT * 360;
  const theta = thetaDeg * Math.PI / 180;
  const vx = vLen * Math.cos(theta);
  const vy = vLen * Math.sin(theta);

  const dot = uLen * vLen * Math.cos(theta);
  const cosT = Math.cos(theta);

  // Sweep angle arc — draw from +x axis to v direction.
  const arcR = portrait ? 56 : 60;
  const origin = toSvg(G, 0, 0);
  const arcEndX = origin.sx + arcR * Math.cos(theta);
  const arcEndY = origin.sy - arcR * Math.sin(theta);
  // Use large-arc-flag based on whether θ > π
  const largeArc = theta > Math.PI ? 1 : 0;
  const sweepFlag = 0; // negative-y direction in SVG
  const arcD = `M ${origin.sx + arcR} ${origin.sy} A ${arcR} ${arcR} 0 ${largeArc} ${sweepFlag} ${arcEndX} ${arcEndY}`;

  // Chart geometry — a small panel showing u·v vs θ.
  // Plot 360 sample points along θ ∈ [0, 2π], but only reveal up to current sweepT.
  const chartW = portrait ? 480 : 320;
  const chartH = portrait ? 140 : 180;
  const chartPad = 18;
  const innerW = chartW - chartPad * 2;
  const innerH = chartH - chartPad * 2;
  const chartCenterY = chartPad + innerH / 2;
  // y maps from [+ceiling, -ceiling] to [chartPad, chartPad+innerH]
  const yForDot = (d) => chartCenterY - (d / ceiling) * (innerH / 2 - 6);
  const xForT = (t) => chartPad + t * innerW;

  // Build the live curve path.
  const N = Math.max(2, Math.ceil(sweepT * 120));
  let curveD = '';
  if (sweepT > 0.005) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * sweepT;
      const ang = t * 2 * Math.PI;
      const d = ceiling * Math.cos(ang);
      pts.push(`${i === 0 ? 'M' : 'L'} ${xForT(t).toFixed(2)} ${yForDot(d).toFixed(2)}`);
    }
    curveD = pts.join(' ');
  }

  // The live dot at current θ on the chart.
  const dotChartX = xForT(sweepT);
  const dotChartY = yForDot(dot);

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

          <SvgFadeIn duration={0.4} delay={0.3}>
            <Arrow G={G} x={ux} y={uy} color="var(--amber-400)"
                   label="u" labelDX={22} labelDY={-12} strokeWidth={3.8}/>
          </SvgFadeIn>

          {/* Sweep arc + θ label — appears once the sweep starts. */}
          {sweepT > 0.005 && (
            <g opacity={clamp(sweepT * 12, 0, 1)}>
              <path d={arcD} stroke="var(--chalk-300)" strokeWidth={1.4}
                    fill="none" strokeDasharray="4 5" opacity={0.85}/>
              <text
                x={origin.sx + (arcR + 16) * Math.cos(theta / 2)}
                y={origin.sy - (arcR + 16) * Math.sin(theta / 2) + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18} textAnchor="middle">θ</text>
            </g>
          )}

          {/* v rotating */}
          <SvgFadeIn duration={0.4} delay={1.0}>
            <Arrow G={G} x={vx} y={vy} color="var(--teal-400)"
                   label="v"
                   labelDX={vx >= 0 ? 18 : -18}
                   labelDY={vy >= 0 ? -12 : 18}
                   strokeWidth={3.8}/>
          </SvgFadeIn>

          {/* Unit circle of radius vLen */}
          <SvgFadeIn duration={0.4} delay={0.6}>
            <circle cx={origin.sx} cy={origin.sy} r={vLen * G.unit}
                    stroke="var(--chalk-300)" strokeWidth={1.0}
                    strokeDasharray="3 5" fill="none" opacity={0.55}/>
          </SvgFadeIn>

          <circle cx={origin.sx} cy={origin.sy} r={4} fill="var(--chalk-100)"/>
        </svg>
      </div>

      {/* Right (or bottom) panel: live chart + readout */}
      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          u · v vs θ — bounded
        </FadeUp>

        <FadeUp duration={0.5} delay={0.4} distance={6}>
          <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`}
               style={{ overflow: 'visible' }}>
            {/* Frame */}
            <rect x={chartPad} y={chartPad} width={innerW} height={innerH}
                  fill="rgba(232,220,193,0.04)"
                  stroke="rgba(232,220,193,0.15)" strokeWidth={1}/>
            {/* zero baseline */}
            <line x1={chartPad} y1={chartCenterY}
                  x2={chartPad + innerW} y2={chartCenterY}
                  stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
            {/* Upper ceiling line */}
            <line x1={chartPad} y1={yForDot(ceiling)}
                  x2={chartPad + innerW} y2={yForDot(ceiling)}
                  stroke="var(--rose-400)" strokeWidth={1.6}
                  strokeDasharray="6 4"/>
            <text x={chartPad + innerW - 6} y={yForDot(ceiling) - 6}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} textAnchor="end">+‖u‖‖v‖</text>
            {/* Lower ceiling */}
            <line x1={chartPad} y1={yForDot(-ceiling)}
                  x2={chartPad + innerW} y2={yForDot(-ceiling)}
                  stroke="var(--rose-400)" strokeWidth={1.6}
                  strokeDasharray="6 4"/>
            <text x={chartPad + innerW - 6} y={yForDot(-ceiling) + 14}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} textAnchor="end">−‖u‖‖v‖</text>
            {/* Curve trace */}
            {curveD && (
              <path d={curveD}
                    stroke="var(--amber-400)" strokeWidth={2.4}
                    fill="none" strokeLinejoin="round" strokeLinecap="round"/>
            )}
            {/* Live dot */}
            {sweepT > 0.005 && (
              <circle cx={dotChartX} cy={dotChartY} r={4.5}
                      fill={dot >= 0 ? 'var(--teal-400)' : 'var(--rose-400)'}
                      stroke="var(--bg-canvas)" strokeWidth={1.5}/>
            )}
            {/* x-axis tick labels: 0, π, 2π */}
            <text x={chartPad} y={chartH - 4}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={10} textAnchor="start">0</text>
            <text x={chartPad + innerW / 2} y={chartH - 4}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={10} textAnchor="middle">π</text>
            <text x={chartPad + innerW} y={chartH - 4}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={10} textAnchor="end">2π</text>
          </svg>
        </FadeUp>

        {/* Live numeric readouts */}
        {sweepT > 0.005 && (
          <FadeUp duration={0.4} delay={0.8} distance={6}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15,
              color: 'var(--chalk-200)', lineHeight: 1.55, marginTop: 4,
            }}>
            <div>θ = {thetaDeg.toFixed(0)}°   cos θ = {cosT.toFixed(2)}</div>
            <div style={{ color: dot >= 0 ? 'var(--teal-300)' : 'var(--rose-300)',
                          marginTop: 2, fontSize: portrait ? 16 : 18 }}>
              u · v = {dot.toFixed(2)}   (≤ {ceiling.toFixed(2)})
            </div>
          </FadeUp>
        )}
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Equality condition ──────────────────────────────────────────
// Three small tiles: parallel (= +max), antiparallel (= −max), generic (<).
function EqualityConditionBeat() {
  const portrait = usePortrait();

  const tileW = portrait ? 200 : 220;
  const tileH = portrait ? 180 : 200;
  const tileOx = tileW / 2 - 30;
  const tileOy = tileH / 2 + 10;
  const armU = 72;

  const tiles = [
    { id: 'parallel', label1: 'v = +k u', label2: 'u · v = +‖u‖‖v‖',
      accent: 'var(--amber-300)', stroke: 'var(--amber-400)',
      vx: armU, vy: 0, mark: 'equal-plus' },
    { id: 'generic', label1: 'v ≠ ±k u', label2: '|u · v| < ‖u‖‖v‖',
      accent: 'var(--chalk-100)', stroke: 'var(--teal-400)',
      vx: armU * Math.cos(Math.PI / 3.5), vy: armU * Math.sin(Math.PI / 3.5),
      mark: 'strict' },
    { id: 'antipar', label1: 'v = −k u', label2: 'u · v = −‖u‖‖v‖',
      accent: 'var(--rose-300)', stroke: 'var(--rose-400)',
      vx: -armU, vy: 0, mark: 'equal-minus' },
  ];

  function Tile({ tile, delay }) {
    const uTipX = tileOx + armU, uTipY = tileOy;
    const vTipX = tileOx + tile.vx, vTipY = tileOy - tile.vy;
    return (
      <FadeUp duration={0.5} delay={delay} distance={10}
        style={{ width: tileW, display: 'flex', flexDirection: 'column',
                 alignItems: 'center', gap: 8 }}>
        <svg width={tileW} height={tileH} viewBox={`0 0 ${tileW} ${tileH}`}
             style={{ overflow: 'visible' }}>
          {/* u in amber along +x — drawn slightly behind v in parallel case */}
          <line x1={tileOx} y1={tileOy} x2={uTipX - 8} y2={uTipY}
                stroke="var(--amber-400)" strokeWidth={3}
                strokeLinecap="round" opacity={tile.id === 'parallel' ? 0.45 : 1}/>
          <path d={`M ${uTipX} ${uTipY} L ${uTipX - 9} ${uTipY - 5} L ${uTipX - 9} ${uTipY + 5} Z`}
                fill="var(--amber-400)" opacity={tile.id === 'parallel' ? 0.45 : 1}/>
          {/* v */}
          <line x1={tileOx} y1={tileOy} x2={vTipX} y2={vTipY}
                stroke={tile.stroke} strokeWidth={3} strokeLinecap="round"/>
          {(() => {
            const dx = vTipX - tileOx, dy = vTipY - tileOy;
            const L = Math.hypot(dx, dy) || 1;
            const upx = dx / L, upy = dy / L;
            const bx = vTipX - upx * 10, by = vTipY - upy * 10;
            const px = -upy, py = upx;
            return (
              <path d={`M ${vTipX} ${vTipY} L ${bx + px * 5} ${by + py * 5} L ${bx - px * 5} ${by - py * 5} Z`}
                    fill={tile.stroke}/>
            );
          })()}
          {/* arc for generic */}
          {tile.mark === 'strict' && (
            <path d={`M ${tileOx + 26} ${tileOy} A 26 26 0 0 0 ${tileOx + 26 * Math.cos(Math.PI / 3.5)} ${tileOy - 26 * Math.sin(Math.PI / 3.5)}`}
                  stroke="var(--chalk-200)" strokeWidth={1.4} fill="none"/>
          )}
          <circle cx={tileOx} cy={tileOy} r={3.5} fill="var(--chalk-100)"/>
        </svg>
        <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                      fontSize: 18, color: 'var(--chalk-200)' }}>
          {tile.label1}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                      color: tile.accent, letterSpacing: '0.02em' }}>
          {tile.label2}
        </div>
      </FadeUp>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex',
      flexDirection: portrait ? 'column' : 'row',
      gap: portrait ? 14 : 60,
      alignItems: 'center', justifyContent: 'center',
    }}>
      {tiles.map((tile, i) => (
        <Tile key={tile.id} tile={tile} delay={0.3 + i * 0.5}/>
      ))}
      <FadeUp duration={0.5} delay={2.5} distance={10}
        style={{
          position: 'absolute',
          bottom: portrait ? -40 : -68,
          left: '50%', transform: 'translateX(-50%)',
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--amber-300)', letterSpacing: '0.04em',
          whiteSpace: 'nowrap',
        }}>
        equality iff v is a scalar multiple of u
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
        −1 ≤ <span style={{ color: 'var(--amber-300)' }}>cos θ</span> = (u · v) / (‖u‖ · ‖v‖) ≤ 1
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '28ch' : '46ch', lineHeight: 1.4,
        }}>
        The bound that lets the angle exist.
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
