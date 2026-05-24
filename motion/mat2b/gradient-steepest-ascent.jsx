// Why the Gradient Is Steepest: A Cosine of Heading — Manimo lesson scene.
// Chapter 5 of mat2b (Funksjoner og derivasjon). At a point the directional
// derivative in unit heading u is
//   D_u f = ∇f · u = |∇f| cos θ
// where θ is the angle between u and the gradient. Rotate u a full turn and
// the climb rate traces a cosine — peak when aligned with ∇f (steepest
// ascent), zero along the contour, trough opposite (steepest descent). The
// rotating heading + synchronously-traced cosine is the genuine-motion beat.
//
// Beats:
//    0– 5   Manimo hook
//    5–15   Fixed gradient, a chosen heading u, the formula
//   15–28   Rotate u 360°, cosine traces in sync
//   28–40   Full cosine: ascent / contour / descent marked
//   40–end  Hero outro
//
// Colour discipline:
//   amber-400  the gradient ∇f / the cosine response
//   teal-400   the heading u
//   rose-400   steepest-descent accent
//   chalk-300  contour direction / axes

const SCENE_DURATION = 43;

const NARRATION = [
  "From one spot on a hill you can step in any direction. Which heading climbs the fastest?",
  "The gradient is one fixed arrow. Pick a heading u; the climb rate is the gradient dotted with u — which is the gradient's length times the cosine of the angle between them.",
  "Turn the heading all the way around. The climb rate traces a cosine — highest when you face along the gradient, and it sinks from there.",
  "Straight along the gradient is steepest ascent. Ninety degrees off, you are walking the level curve and the rate is zero. Turn fully around and you get the steepest descent.",
  "So the gradient is not just perpendicular to the contour — it is the single heading of fastest climb.",
];

const NARRATION_AUDIO = 'audio/gradient-steepest-ascent/scene.mp3';

const ALPHA = 38 * Math.PI / 180; // gradient heading (math angle)

// ─── Layout ───────────────────────────────────────────────────────────────
function layout(portrait) {
  return portrait
    ? { W: 720, H: 1280, plane: { cx: 360, cy: 404, unit: 80 },
        plot: { x0: 96, x1: 636, yMid: 902, amp: 112 } }
    : { W: 1280, H: 720, plane: { cx: 322, cy: 360, unit: 86 },
        plot: { x0: 712, x1: 1188, yMid: 360, amp: 150 } };
}
function panelProps(portrait) {
  return portrait
    ? { left: '50%', transform: 'translateX(-50%)', bottom: 372, width: 600 }
    : { right: 56, top: 250, width: 380 };
}

function Arrow({ ax, ay, bx, by, color, strokeWidth = 3.2, headLen = 13, headHalf = 7.5, opacity = 1 }) {
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

// The (P, gradient, heading u, angle arc) diagram.
function SteepestPlane({ plane, theta }) {
  const { cx, cy, unit } = plane;
  const fromP = (ang, lenU) => ({ sx: cx + Math.cos(ang) * lenU * unit, sy: cy - Math.sin(ang) * lenU * unit });

  const gTip = fromP(ALPHA, 1.55);
  const uTip = fromP(ALPHA + theta, 1.2);
  const cA = fromP(ALPHA + Math.PI / 2, 1.5);
  const cB = fromP(ALPHA - Math.PI / 2, 1.5);

  // Angle arc P-centred from ALPHA to ALPHA+theta.
  const arcR = 0.46 * unit;
  const n = Math.max(2, Math.round(Math.abs(theta) / 0.12));
  let arcD = '';
  for (let i = 0; i <= n; i++) {
    const ang = ALPHA + theta * (i / n);
    const x = cx + Math.cos(ang) * arcR, y = cy - Math.sin(ang) * arcR;
    arcD += `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)} `;
  }
  const midAng = ALPHA + theta / 2;
  const arcLabel = { x: cx + Math.cos(midAng) * (arcR + 16), y: cy - Math.sin(midAng) * (arcR + 16) };

  return (
    <g>
      {/* Level-curve direction (perpendicular to gradient) */}
      <line x1={cA.sx} y1={cA.sy} x2={cB.sx} y2={cB.sy}
            stroke="var(--chalk-300)" strokeWidth={1.4} strokeDasharray="5 6" opacity={0.55}/>
      <text x={cB.sx + 4} y={cB.sy + 18} fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={12}>level curve</text>

      {/* Angle arc */}
      {Math.abs(theta) > 0.05 && (
        <>
          <path d={arcD} fill="none" stroke="var(--chalk-200)" strokeWidth={1.5} opacity={0.8}/>
          <text x={arcLabel.x} y={arcLabel.y} fill="var(--chalk-200)"
                fontFamily="var(--font-serif)" fontStyle="italic" fontSize={16}
                textAnchor="middle">θ</text>
        </>
      )}

      {/* Heading u */}
      <Arrow ax={cx} ay={cy} bx={uTip.sx} by={uTip.sy} color="var(--teal-400)" strokeWidth={3.2}/>
      <text x={uTip.sx + 8} y={uTip.sy - 6} fill="var(--teal-300)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>u</text>

      {/* Gradient (fixed) */}
      <Arrow ax={cx} ay={cy} bx={gTip.sx} by={gTip.sy} color="var(--amber-400)" strokeWidth={3.6}/>
      <text x={gTip.sx + 8} y={gTip.sy - 6} fill="var(--amber-300)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={18}>∇f</text>

      <circle cx={cx} cy={cy} r={5} fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
      <text x={cx - 8} y={cy + 20} fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic" fontSize={15} textAnchor="end">P</text>
    </g>
  );
}

// The response plot: climb rate = cos(θ) vs θ ∈ [0, 2π].
function CosinePlot({ plot, traceTheta, markerTheta, highlights }) {
  const { x0, x1, yMid, amp } = plot;
  const xOf = th => x0 + (th / (2 * Math.PI)) * (x1 - x0);
  const yOf = th => yMid - amp * Math.cos(th);

  // Traced (partial) cosine.
  const nMax = 160;
  const n = Math.max(2, Math.round(nMax * traceTheta / (2 * Math.PI)));
  let curveD = '';
  for (let i = 0; i <= n; i++) {
    const th = traceTheta * (i / n);
    curveD += `${i === 0 ? 'M' : 'L'} ${xOf(th).toFixed(1)} ${yOf(th).toFixed(1)} `;
  }

  const xticks = [0, 0.25, 0.5, 0.75, 1];
  const xlabels = ['0', '90°', '180°', '270°', '360°'];

  return (
    <g>
      {/* Frame: zero line + vertical axis */}
      <line x1={x0} y1={yMid} x2={x1} y2={yMid} stroke="var(--chalk-300)" strokeWidth={1.3} opacity={0.6}/>
      <line x1={x0} y1={yMid - amp - 14} x2={x0} y2={yMid + amp + 14}
            stroke="var(--chalk-300)" strokeWidth={1.3} opacity={0.6}/>

      {/* y labels */}
      <text x={x0 - 10} y={yMid - amp + 4} fill="var(--amber-300)" textAnchor="end"
            fontFamily="var(--font-mono)" fontSize={12}>+|∇f|</text>
      <text x={x0 - 10} y={yMid + 4} fill="var(--chalk-300)" textAnchor="end"
            fontFamily="var(--font-mono)" fontSize={12}>0</text>
      <text x={x0 - 10} y={yMid + amp + 4} fill="var(--rose-300)" textAnchor="end"
            fontFamily="var(--font-mono)" fontSize={12}>−|∇f|</text>

      {/* x ticks */}
      {xticks.map((f, i) => (
        <text key={i} x={x0 + f * (x1 - x0)} y={yMid + amp + 30} fill="var(--chalk-300)"
              textAnchor="middle" fontFamily="var(--font-mono)" fontSize={11}>{xlabels[i]}</text>
      ))}
      <text x={(x0 + x1) / 2} y={yMid + amp + 52} fill="var(--chalk-300)" textAnchor="middle"
            fontFamily="var(--font-sans)" fontSize={12}>heading angle θ from gradient</text>

      {/* The cosine */}
      {traceTheta > 0.01 && (
        <path d={curveD} fill="none" stroke="var(--amber-400)" strokeWidth={3} strokeLinecap="round"/>
      )}

      {/* Moving marker */}
      {markerTheta != null && (
        <circle cx={xOf(markerTheta)} cy={yOf(markerTheta)} r={6}
                fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
      )}

      {/* Special-point highlights */}
      {highlights && (
        <>
          <circle cx={xOf(0)} cy={yOf(0)} r={5} fill="var(--amber-300)"/>
          <text x={xOf(0) + 8} y={yOf(0) - 8} fill="var(--amber-300)"
                fontFamily="var(--font-sans)" fontSize={12}>steepest ascent</text>

          <circle cx={xOf(Math.PI / 2)} cy={yOf(Math.PI / 2)} r={5} fill="var(--chalk-200)"/>
          <text x={xOf(Math.PI / 2)} y={yMid - 12} fill="var(--chalk-200)" textAnchor="middle"
                fontFamily="var(--font-sans)" fontSize={12}>along contour → 0</text>

          <circle cx={xOf(Math.PI)} cy={yOf(Math.PI)} r={5} fill="var(--rose-400)"/>
          <text x={xOf(Math.PI)} y={yMid + amp * 0.42} fill="var(--rose-300)" textAnchor="middle"
                fontFamily="var(--font-sans)" fontSize={12}>steepest descent</text>
        </>
      )}
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="steepest ascent"
      title="A Cosine of Heading"
      duration={SCENE_DURATION}
      introEnd={6.05}
      introCaption="Every heading has a climb rate — which is biggest?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.05} end={17.15}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={17.15} end={25.31}>
        <SweepBeat/>
      </Sprite>

      <Sprite start={25.31} end={35.84}>
        <PeaksBeat/>
      </Sprite>

      <Sprite start={35.84} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: fixed gradient + heading + formula ───────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const L = layout(portrait);
  // A fixed illustrative heading at 60° off the gradient.
  const theta = 60 * Math.PI / 180;
  return (
    <>
      <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`}
           style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
        <SteepestPlane plane={L.plane} theta={theta}/>
      </svg>

      <SoftPanel {...panelProps(portrait)}>
        <FadeUp duration={0.4} delay={0.2} distance={8}
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                   letterSpacing: '0.16em', textTransform: 'uppercase' }}>
          climb rate of a heading
        </FadeUp>
        <FadeUp duration={0.5} delay={1.4} distance={10}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: portrait ? 22 : 25,
                   color: 'var(--chalk-100)' }}>
          D<sub>u</sub>f = ∇f · u = |∇f| cos θ
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: portrait ? 16 : 18,
                   color: 'var(--chalk-300)', lineHeight: 1.4, maxWidth: '32ch' }}>
          <span style={{ color: 'var(--chalk-100)' }}>θ</span> is the angle from the
          <span style={{ color: 'var(--amber-300)' }}> gradient</span> to your heading.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: rotate u, cosine traces in sync (genuine motion) ─────────────
function SweepBeat() {
  const portrait = usePortrait();
  const { progress } = useSprite();
  const L = layout(portrait);
  const theta = clamp((progress - 0.08) / 0.84, 0, 1) * 2 * Math.PI;

  return (
    <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`}
         style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      <SteepestPlane plane={L.plane} theta={theta}/>
      <CosinePlot plot={L.plot} traceTheta={theta} markerTheta={theta} highlights={false}/>
      <text x={L.plot.x0} y={L.plot.yMid - L.plot.amp - 30} fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={13} letterSpacing="0.08em">
        D_u f = |∇f| cos θ
      </text>
    </svg>
  );
}

// ─── Beat 4: full cosine, three regimes marked ────────────────────────────
function PeaksBeat() {
  const portrait = usePortrait();
  const L = layout(portrait);
  return (
    <svg width={L.W} height={L.H} viewBox={`0 0 ${L.W} ${L.H}`}
         style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
      {/* Heading locked onto the gradient — the answer. */}
      <SteepestPlane plane={L.plane} theta={0}/>
      <CosinePlot plot={L.plot} traceTheta={2 * Math.PI} markerTheta={null} highlights={true}/>
      <text x={L.plot.x0} y={L.plot.yMid - L.plot.amp - 30} fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={13} letterSpacing="0.06em">
        peak at θ = 0  →  align with ∇f
      </text>
    </svg>
  );
}

// ─── Beat 5: hero outro ───────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
      maxWidth: portrait ? 560 : 1000,
    }}>
      <FadeUp duration={0.45} delay={0} distance={6}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        steepest ascent
      </FadeUp>
      <FadeUp duration={0.8} delay={0.35} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 32 : 48, color: 'var(--chalk-100)', lineHeight: 1.2 }}>
        The gradient is the heading of <br/>
        <span style={{ color: 'var(--amber-300)' }}>fastest climb.</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 19 : 23, color: 'var(--chalk-200)', maxWidth: '44ch', lineHeight: 1.35 }}>
        Every other heading is just a cosine slice of it.
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
