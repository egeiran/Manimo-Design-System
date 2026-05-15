// BJT Load Line: Where the Operating Point Lives — Manimo lesson scene.
// Common-emitter NPN. KVL gives V_CC = I_C·R_C + V_CE, which is a straight
// line in the (V_CE, I_C) plane between (V_CC, 0) and (0, V_CC/R_C). Sweep
// I_B and Q (the operating point) slides along that line through cutoff,
// the active region, and into saturation. The genuine motion lives in
// Beat 4: Q is computed live from the swept I_B and projected onto the
// load line, with the three region badges lighting up as Q passes them.
//
// Beats (timed to single-track narration in motion/ade/audio/bjt-load-line/):
//    0.00– 6.61  Manimo intro + hook caption
//    6.61–20.49  Common-emitter NPN schematic + KVL formula
//   20.49–35.40  Load line drawn between two endpoints
//   35.40–52.43  Family of output curves + Q sliding under I_B sweep  (genuine motion)
//   52.43–61.00  Takeaway
//
// Authoring notes:
//   • Beats 3 and 4 share plotGeometry() so the load line lines up.
//   • The Q-marker in Beat 4 is computed from the swept I_B; its position
//     reads the SAME (V_CE, I_C) as the load-line equation, so the marker
//     is guaranteed to live on the line.

const SCENE_DURATION = 62;

const NARRATION = [
  /*  0.00– 6.61 */ "Where exactly does an amplifier sit on its output curve? The load line answers that in one straight stroke.",
  /*  6.61–20.49 */ "Common emitter NPN, supply V C C feeding R C, output taken at the collector. KVL around the output loop gives V C C equals I C times R C plus V C E.",
  /* 20.49–35.40 */ "Rearrange and you get a straight line in the I C versus V C E plane. Two endpoints fix it — V C E equals V C C when the transistor is cut off, and I C equals V C C over R C when V C E is zero.",
  /* 35.40–52.43 */ "The transistor curves slice the I C V C E plane into one curve per base current. Sweep I B and the operating point Q slides along the load line — through cutoff at the right, through the active region in the middle, and into saturation against the V C E equals zero wall.",
  /* 52.43–61.00 */ "Pick R C and a bias I B that put Q in the middle of the active region — that is what biasing an amplifier means.",
];

const NARRATION_AUDIO = 'audio/bjt-load-line/scene.mp3';

// Circuit constants (display-only — drives the plotted load line).
const VCC = 10;        // volts
const RC  = 1;         // kΩ → V_CC/R_C = 10 mA endpoint
const ICMAX = VCC / RC; // mA (top of I_C axis at the y-intercept)

function Scene() {
  return (
    <SceneChrome
      eyebrow="transistors"
      title="BJT Load Line: Where the Operating Point Lives"
      duration={SCENE_DURATION}
      introEnd={6.61}
      introCaption="One straight line tells you where the transistor is biased."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.61} end={20.49}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={20.49} end={35.4}>
        <LoadLineBeat />
      </Sprite>

      <Sprite start={35.4} end={52.43}>
        <SweepBeat />
      </Sprite>

      <Sprite start={52.43} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared: NPN BJT symbol ──────────────────────────────────────────────
// Centred at (cx, cy). Collector up, emitter down with arrow, base left.
function NpnSymbol({ cx, cy, scale = 1, color = 'var(--amber-400)' }) {
  const u = 22 * scale;
  const baseX = cx - u * 1.4;
  const bodyX = cx - u * 0.2;        // vertical bar x
  const colY = cy - u * 1.5;
  const emiY = cy + u * 1.5;
  const topConn = cy - u * 0.85;
  const botConn = cy + u * 0.85;
  return (
    <g>
      {/* Base wire */}
      <line x1={baseX} y1={cy} x2={bodyX} y2={cy}
            stroke={color} strokeWidth={2.2}/>
      {/* Body bar */}
      <line x1={bodyX} y1={topConn} x2={bodyX} y2={botConn}
            stroke={color} strokeWidth={3.5}/>
      {/* Collector slope + stub */}
      <line x1={bodyX} y1={topConn} x2={cx + u * 0.7} y2={cy - u * 1.1}
            stroke={color} strokeWidth={2.2}/>
      <line x1={cx + u * 0.7} y1={cy - u * 1.1} x2={cx + u * 0.7} y2={colY}
            stroke={color} strokeWidth={2.2}/>
      {/* Emitter slope + stub */}
      <line x1={bodyX} y1={botConn} x2={cx + u * 0.7} y2={cy + u * 1.1}
            stroke={color} strokeWidth={2.2}/>
      {/* Emitter arrow (NPN: arrow points away from base) */}
      <path d={`M ${cx + u * 0.7} ${cy + u * 1.1}
                L ${cx + u * 0.45} ${cy + u * 0.95}
                L ${cx + u * 0.55} ${cy + u * 1.18} Z`}
            fill={color}/>
      <line x1={cx + u * 0.7} y1={cy + u * 1.1} x2={cx + u * 0.7} y2={emiY}
            stroke={color} strokeWidth={2.2}/>
    </g>
  );
}

// Vertical zigzag resistor between (cx, yTop) and (cx, yBot).
function resistorVerticalD(cx, yTop, yBot, amp = 9, n = 6) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const y = yTop + i * dy;
    const x = cx + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
}

// Shared (V_CE, I_C) plot geometry. Returns origin + size + axis converters.
function plotGeometry(portrait) {
  const G = portrait
    ? { vbW: 620, vbH: 720, gx: 110, gy: 100, gw: 460, gh: 480, captionY: 700 }
    : { vbW: 1180, vbH: 460, gx: 200, gy: 60, gw: 760, gh: 340, captionY: 440 };
  G.toX = v => G.gx + (v / VCC) * G.gw;        // V_CE → x
  G.toY = i => G.gy + G.gh - (i / ICMAX) * G.gh; // I_C → y
  return G;
}

// ─── Beat 2: Common-emitter NPN schematic + KVL ───────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 620, vbH: 720,
        cx: 340, vccY: 90, colY: 240, emiY: 460, gndY: 510,
        baseX: 110, baseY: 350,
        formulaY: 640 }
    : { vbW: 1180, vbH: 460,
        cx: 380, vccY: 60, colY: 180, emiY: 320, gndY: 360,
        baseX: 100, baseY: 250,
        formulaY: 410 };

  const symCx = G.cx;
  const symCy = (G.colY + G.emiY) / 2;
  const u = 22 * 1.05;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* V_CC rail */}
        <TraceIn d={`M ${G.cx - 80} ${G.vccY} L ${G.cx + 80} ${G.vccY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.2}/>
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.cx + 90} y={G.vccY + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize={11}>CC</tspan></text>
        </SvgFadeIn>

        {/* R_C zigzag */}
        <TraceIn d={resistorVerticalD(G.cx, G.vccY + 4, G.colY - 4)}
                 stroke="var(--amber-400)" strokeWidth={2.4}
                 duration={0.6} delay={0.5}/>
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.cx + 22} y={(G.vccY + G.colY) / 2 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>R<tspan baselineShift="sub" fontSize={11}>C</tspan></text>
        </SvgFadeIn>

        {/* Output tap (V_out) at the collector node */}
        <SvgFadeIn duration={0.3} delay={1.2}>
          <circle cx={G.cx} cy={G.colY} r={3.5} fill="var(--amber-300)"/>
          <line x1={G.cx} y1={G.colY} x2={G.cx + 80} y2={G.colY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={G.cx + 88} y={G.colY + 5}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V<tspan baselineShift="sub" fontSize={11}>out</tspan></text>
        </SvgFadeIn>

        {/* V_CE label across the transistor (on the right side) */}
        <SvgFadeIn duration={0.3} delay={1.4}>
          <text x={G.cx + 90} y={(G.colY + G.emiY) / 2 + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={15}>V<tspan baselineShift="sub" fontSize={10}>CE</tspan></text>
        </SvgFadeIn>

        {/* NPN symbol */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <NpnSymbol cx={symCx} cy={symCy} scale={1.05}/>
        </SvgFadeIn>

        {/* Wire from R_C-end → collector */}
        <TraceIn d={`M ${G.cx} ${G.colY} L ${G.cx} ${symCy - u * 1.5}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={1.0}/>
        {/* Wire from emitter → ground */}
        <TraceIn d={`M ${G.cx + u * 0.7 * 1.05} ${symCy + u * 1.5 * 1.05} L ${G.cx + u * 0.7 * 1.05} ${G.gndY - 6}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={1.4}/>
        {/* Ground */}
        <SvgFadeIn duration={0.3} delay={1.8}>
          <line x1={G.cx + u * 0.7 * 1.05 - 14} y1={G.gndY} x2={G.cx + u * 0.7 * 1.05 + 14} y2={G.gndY}
                stroke="var(--chalk-200)" strokeWidth={2.2}/>
          <line x1={G.cx + u * 0.7 * 1.05 - 9} y1={G.gndY + 6} x2={G.cx + u * 0.7 * 1.05 + 9} y2={G.gndY + 6}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.cx + u * 0.7 * 1.05 - 5} y1={G.gndY + 12} x2={G.cx + u * 0.7 * 1.05 + 5} y2={G.gndY + 12}
                stroke="var(--chalk-200)" strokeWidth={1.8}/>
        </SvgFadeIn>

        {/* I_B label + base wire */}
        <TraceIn d={`M ${G.baseX} ${symCy} L ${symCx - 22 * 1.05 * 1.4} ${symCy}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={1.2}/>
        <SvgFadeIn duration={0.3} delay={1.6}>
          <text x={G.baseX} y={symCy + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>I<tspan baselineShift="sub" fontSize={10}>B</tspan></text>
          <circle cx={G.baseX + 6} cy={symCy} r={3.5} fill="var(--chalk-200)"/>
        </SvgFadeIn>

        {/* I_C arrow on the collector wire */}
        <SvgFadeIn duration={0.3} delay={2.0}>
          <text x={G.cx - 36} y={(G.vccY + G.colY) / 2 + 5}
                textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">I_C ↓</text>
        </SvgFadeIn>

        {/* KVL formula */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.formulaY}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 30}>
            V<tspan baselineShift="sub" fontSize={14}>CC</tspan> = I<tspan baselineShift="sub" fontSize={14}>C</tspan>·R<tspan baselineShift="sub" fontSize={14}>C</tspan> + V<tspan baselineShift="sub" fontSize={14}>CE</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Load line ───────────────────────────────────────────────────
function LoadLineBeat() {
  const portrait = usePortrait();
  const G = plotGeometry(portrait);
  const { localTime } = useSprite();

  // Load line endpoints in plot coordinates.
  const x0 = G.toX(VCC), y0 = G.toY(0);          // V_CE = V_CC, I_C = 0
  const x1 = G.toX(0),    y1 = G.toY(ICMAX);     // V_CE = 0,    I_C = V_CC/R_C

  // Trace fraction so the line draws in.
  const drawStart = 1.4;
  const drawDur = 1.2;
  const drawFrac = clamp((localTime - drawStart) / drawDur, 0, 1);
  const xCur = x0 + (x1 - x0) * drawFrac;
  const yCur = y0 + (y1 - y0) * drawFrac;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Plot title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.gx + G.gw / 2} y={G.gy - 22}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">I<tspan baselineShift="sub" fontSize={9}>C</tspan>  vs  V<tspan baselineShift="sub" fontSize={9}>CE</tspan></text>
        </SvgFadeIn>

        {/* Axes */}
        <TraceIn d={`M ${G.gx} ${G.gy} L ${G.gx} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>
        <TraceIn d={`M ${G.gx} ${G.gy + G.gh} L ${G.gx + G.gw} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>
        <SvgFadeIn duration={0.3} delay={0.3}>
          {/* V_CE axis title at the right end of the x-axis. The I_C axis title
             is omitted — the "I_C vs V_CE" mono section title above the plot
             already names the y-axis and the italic label was crowding it. */}
          <text x={G.gx + G.gw + 14} y={G.gy + G.gh + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize={11}>CE</tspan></text>
        </SvgFadeIn>

        {/* Endpoint ticks + labels */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          {/* V_CC tick on x-axis */}
          <line x1={x0} y1={G.gy + G.gh - 5} x2={x0} y2={G.gy + G.gh + 8}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={x0} y={G.gy + G.gh + 24} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>V<tspan baselineShift="sub" fontSize={10}>CC</tspan></text>
          {/* V_CC/R_C tick on y-axis */}
          <line x1={G.gx - 8} y1={y1} x2={G.gx + 5} y2={y1}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={G.gx - 14} y={y1 + 5} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>V<tspan baselineShift="sub" fontSize={10}>CC</tspan> / R<tspan baselineShift="sub" fontSize={10}>C</tspan></text>
        </SvgFadeIn>

        {/* Endpoint dots */}
        {drawFrac > 0.001 && (
          <>
            <circle cx={x0} cy={y0} r={4} fill="var(--rose-400)"/>
            <circle cx={xCur} cy={yCur} r={4} fill="var(--rose-400)"/>
          </>
        )}

        {/* The load line (drawn from x0,y0 toward x1,y1) */}
        {drawFrac > 0.001 && (
          <line x1={x0} y1={y0} x2={xCur} y2={yCur}
                stroke="var(--rose-400)" strokeWidth={2.6}
                strokeLinecap="round"/>
        )}

        {/* Load-line equation */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.gx + G.gw * 0.6} y={G.gy + G.gh * 0.42}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 20 : 24}>
            I<tspan baselineShift="sub" fontSize={12}>C</tspan> = (V<tspan baselineShift="sub" fontSize={12}>CC</tspan> − V<tspan baselineShift="sub" fontSize={12}>CE</tspan>) / R<tspan baselineShift="sub" fontSize={12}>C</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            every (V_CE, I_C) the circuit can produce lies on this line
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Family of curves + Q sliding ────────────────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const G = plotGeometry(portrait);
  const { localTime, duration: spriteDur } = useSprite();

  // Sweep I_B over the beat. We model I_C = β·I_B saturated by the load line:
  // I_C(V_CE) = min(β·I_B, (V_CC − V_CE)/R_C). So Q = intersection of the
  // chosen output curve with the load line. As I_B grows, V_CE shrinks.
  //
  // For visual sweep we use a triangular waveform on I_B so Q goes back and
  // forth (lets the viewer see the active region twice).
  const SETUP = 0.5;
  const t = Math.max(0, localTime - SETUP);
  const SWEEP_PERIOD = Math.max(spriteDur - SETUP - 0.5, 4);
  // Triangle 0..1..0 over SWEEP_PERIOD
  const phase = (t % SWEEP_PERIOD) / SWEEP_PERIOD;
  const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  // Map tri ∈ [0,1] → I_B ∈ [0, IB_MAX]. Choose IB_MAX so that β·IB_MAX
  // exceeds ICMAX, ensuring Q hits saturation at the top of the sweep.
  const IB_MAX = 0.13;             // mA — β·IB_MAX = 13 mA > ICMAX = 10 mA
  const BETA = 100;
  const IB = tri * IB_MAX;         // mA

  // Operating point: I_C clamped by load line.
  const icActive = BETA * IB;       // would-be active I_C
  const icSat = ICMAX;              // saturation top
  const ICq = Math.min(icActive, icSat);
  const VCEq = clamp(VCC - ICq * RC, 0, VCC);

  // Region classification.
  const region = ICq < 0.05 ? 'CUTOFF'
                : (icActive >= icSat - 0.05 ? 'SATURATION' : 'ACTIVE');

  // Family of output curves: one per fixed I_B value. Pick five evenly
  // spaced values whose β·I_B targets (2, 3.5, 5, 6.5, 8 mA) all sit
  // strictly below ICMAX = 10, so no two curves clamp onto the same line.
  const FAMILY = [0.020, 0.035, 0.050, 0.065, 0.080]; // mA
  const knee = 0.6; // V — where the curves bend up out of saturation
  function curveD(ibVal) {
    // I_C(V_CE) = ibVal·BETA on flat top, but ramps from 0 at V_CE=0 up to
    // the flat top over a knee (saturation region).
    const target = Math.min(ibVal * BETA, ICMAX);
    const samples = 40;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const v = (i / samples) * VCC;
      const ic = v < knee
        ? target * (v / knee) * 0.92
        : Math.min(target, target * (1 + (v - knee) * 0.005)); // tiny Early effect
      pts.push((i === 0 ? 'M' : 'L') + ` ${G.toX(v).toFixed(2)} ${G.toY(ic).toFixed(2)}`);
    }
    return pts.join(' ');
  }

  // Region-band x-coordinates on the load line.
  const satRightX = G.toX(knee + 0.2);
  const cutoffLeftX = G.toX(VCC - 0.6);

  // Live Q position.
  const xQ = G.toX(VCEq);
  const yQ = G.toY(ICq);

  // Static load line endpoints.
  const x0 = G.toX(VCC), y0 = G.toY(0);
  const x1 = G.toX(0),    y1 = G.toY(ICMAX);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Plot title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.gx + G.gw / 2} y={G.gy - 22}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">OUTPUT CURVES + LOAD LINE</text>
        </SvgFadeIn>

        {/* Axes */}
        <TraceIn d={`M ${G.gx} ${G.gy} L ${G.gx} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.4} delay={0.0}/>
        <TraceIn d={`M ${G.gx} ${G.gy + G.gh} L ${G.gx + G.gw} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.4} delay={0.0}/>
        <SvgFadeIn duration={0.3} delay={0.2}>
          {/* I_C axis title above the axis — keeps the y-intercept area clear */}
          <text x={G.gx} y={G.gy - 4} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>I<tspan baselineShift="sub" fontSize={11}>C</tspan></text>
          <text x={G.gx + G.gw + 14} y={G.gy + G.gh + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize={11}>CE</tspan></text>
        </SvgFadeIn>

        {/* Family of output curves */}
        {FAMILY.map((ib, i) => (
          <SvgFadeIn key={i} duration={0.4} delay={0.4 + i * 0.06}>
            <path d={curveD(ib)} fill="none"
                  stroke="var(--chalk-300)" strokeWidth={1.4}
                  opacity={0.78}/>
          </SvgFadeIn>
        ))}

        {/* Family-tag along the right edge of the curves (bracket pointing up) */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <text x={G.gx + G.gw - 14} y={G.toY(BETA * FAMILY[FAMILY.length - 1]) - 8}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">I<tspan baselineShift="sub" fontSize={9}>B</tspan> ↑</text>
        </SvgFadeIn>

        {/* Load line on top */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <line x1={x0} y1={y0} x2={x1} y2={y1}
                stroke="var(--rose-400)" strokeWidth={2.4}
                strokeLinecap="round"/>
        </SvgFadeIn>

        {/* Region tints — three rectangles along the V_CE axis */}
        <SvgFadeIn duration={0.3} delay={1.4}>
          {/* Saturation region */}
          <rect x={G.gx} y={G.gy} width={satRightX - G.gx} height={G.gh}
                fill={region === 'SATURATION' ? 'rgba(244,184,96,0.08)' : 'rgba(232,220,193,0.0)'}/>
          {/* Cutoff region */}
          <rect x={cutoffLeftX} y={G.gy} width={G.gx + G.gw - cutoffLeftX} height={G.gh}
                fill={region === 'CUTOFF' ? 'rgba(244,184,96,0.08)' : 'rgba(232,220,193,0.0)'}/>
        </SvgFadeIn>

        {/* Region labels along the V_CE axis */}
        <SvgFadeIn duration={0.3} delay={1.6}>
          <text x={G.gx + (satRightX - G.gx) / 2} y={G.gy + G.gh + 24}
                textAnchor="middle"
                fill={region === 'SATURATION' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.12em">SATURATION</text>
          <text x={(satRightX + cutoffLeftX) / 2} y={G.gy + G.gh + 24}
                textAnchor="middle"
                fill={region === 'ACTIVE' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.12em">ACTIVE</text>
          <text x={cutoffLeftX + (G.gx + G.gw - cutoffLeftX) / 2} y={G.gy + G.gh + 24}
                textAnchor="middle"
                fill={region === 'CUTOFF' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.12em">CUTOFF</text>
        </SvgFadeIn>

        {/* Q-marker (sliding) */}
        {localTime > SETUP - 0.1 && (
          <>
            {/* Highlight ring */}
            <circle cx={xQ} cy={yQ} r={10} fill="none"
                    stroke="var(--amber-300)" strokeWidth={1.4} opacity={0.6}/>
            {/* Solid dot */}
            <circle cx={xQ} cy={yQ} r={5.5} fill="var(--amber-300)"
                    stroke="var(--amber-400)" strokeWidth={1.5}/>
            <text x={xQ + 12} y={yQ - 8}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={16}>Q</text>
            {/* Drop-lines to the axes */}
            <line x1={xQ} y1={yQ} x2={xQ} y2={G.gy + G.gh}
                  stroke="var(--amber-300)" strokeWidth={1}
                  strokeDasharray="2 4" opacity={0.6}/>
            <line x1={xQ} y1={yQ} x2={G.gx} y2={yQ}
                  stroke="var(--amber-300)" strokeWidth={1}
                  strokeDasharray="2 4" opacity={0.6}/>
          </>
        )}

        {/* Live I_B / I_C / V_CE readout */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.gx + G.gw / 2} y={G.gy - 4} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.08em">
            I_B  {(IB * 1000).toFixed(0)} µA   ·   I_C  {ICq.toFixed(2)} mA   ·   V_CE  {VCEq.toFixed(2)} V
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            amplifiers want Q in the middle of the active region — symmetric headroom both ways
          </text>
        </SvgFadeIn>
      </svg>
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
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Two endpoints fix the line. The bias picks the spot.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        (active region — symmetric swing both ways)
      </FadeUp>
    </div>
  );
}

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
