// Diode I-V Curve: How Current Climbs Past the Knee — Manimo lesson scene.
// A silicon diode obeys the Shockley equation I = I_S(e^(V/V_T) − 1). Below
// the knee (~0.6 V) the current is microscopic; past the knee it climbs
// nearly exponentially. The genuine motion lives in Beat 4: a triangular
// V_D sweep slides a marker live along the I-V curve while a mono readout
// updates V_D and I_D in lockstep.
//
// Beats (placeholder timings — Step 4c will overwrite with audio-aligned):
//    0– 5   Manimo intro + hook
//    5–14   Source-diode loop schematic with V_D / I_D labels
//   14–27   I-V plot drawn in: flat below knee, sharp climb past it
//   27–40   Triangular V_D sweep slides Q along the curve  (genuine motion)
//   40–46   Takeaway: ideal-diode model
//
// Authoring notes:
//   • Beat 3 and Beat 4 share plotGeometry() so the axes line up.
//   • The Q-marker in Beat 4 is computed from the SAME Shockley curve that
//     samplePath() draws — Q is guaranteed to sit on the line.
//   • V_knee is a soft constant: the curve hits I = ~1 mA at V = 0.6 V.

const SCENE_DURATION = 43;

const NARRATION = [
  /*  0– 5  */ "Turn the voltage on a diode up from zero — when does current finally start to flow?",
  /*  5–14 */ "Put an adjustable source across a diode and measure the current. The diode is forward biased when V D is positive, anode to cathode.",
  /* 14–27 */ "Plot the current against the voltage. Below the knee — about zero point six volts for silicon — almost no current flows. Cross the knee and the current climbs nearly exponentially.",
  /* 27–40 */ "Sweep the source voltage and watch the operating point slide. Reverse bias — current pinned at zero. Past the knee — current rockets up.",
  /* 40–46 */ "For pencil-and-paper work, treat it as a switch: open below the knee, a tiny fixed drop above.",
];

const NARRATION_AUDIO = 'audio/diode-iv-curve/scene.mp3';

// Shockley-shaped current at a given V_D, returning milliamps.
// Tuned with IS = 1e-14 A (typical silicon) so the curve crosses ~1 mA near
// V ≈ 0.65 V and saturates at the plot top (10 mA) near V ≈ 0.71 V.
// The knee marker sits at the conventional pedagogical 0.6 V, just below
// where the curve visibly takes off.
const VT = 0.0259;                     // V — thermal voltage at room temp
const IS_MA = 1e-14 * 1000;            // mA — saturation current (1e-14 A in mA units)
function shockley_mA(v) {
  // clamp the exponent so negative voltages don't underflow to weird values.
  const exponent = Math.min(v / VT, 32);
  return IS_MA * (Math.exp(exponent) - 1);
}
// The plot's vertical axis maxes out at 10 mA so the curve fits the panel.
const IMAX_PLOT = 10;
const VMAX_PLOT = 0.85;                // V — right edge of the V_D axis
const VMIN_PLOT = -0.4;                // V — left edge (reverse-bias side)
const V_KNEE = 0.6;                    // V — silicon knee

function Scene() {
  return (
    <SceneChrome
      eyebrow="diodes"
      title="Diode I-V Curve: How Current Climbs Past the Knee"
      duration={SCENE_DURATION}
      introEnd={5.32}
      introCaption="A diode doesn't pass current — until it does."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.32} end={13.97}>
        <SetupBeat />
      </Sprite>

      <Sprite start={13.97} end={26.05}>
        <CurveBeat />
      </Sprite>

      <Sprite start={26.05} end={35.74}>
        <SweepBeat />
      </Sprite>

      <Sprite start={35.74} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared symbols ──────────────────────────────────────────────────────
function DiodeSymbol({ cx, cy, size = 18, color = 'var(--amber-400)' }) {
  const w = size, h = size;
  return (
    <g>
      <polygon
        points={`${cx - w} ${cy - h},${cx - w} ${cy + h},${cx + w} ${cy}`}
        fill={color} stroke={color} strokeWidth={1.5}/>
      <line x1={cx + w} y1={cy - h} x2={cx + w} y2={cy + h}
            stroke={color} strokeWidth={3}/>
    </g>
  );
}

// Adjustable voltage source — circle with "+/−" and a diagonal arrow
// through the top-right to mark "variable".
function AdjustableSource({ cx, cy, r = 26, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill="none" stroke={color} strokeWidth={2}/>
      <text x={cx} y={cy - r * 0.18} textAnchor="middle"
            fill={color} fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={r * 0.6}>+</text>
      <text x={cx} y={cy + r * 0.62} textAnchor="middle"
            fill={color} fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={r * 0.6}>−</text>
      {/* Arrow across the source: marks "variable" */}
      <line x1={cx - r * 1.2} y1={cy + r * 1.2}
            x2={cx + r * 1.2} y2={cy - r * 1.2}
            stroke="var(--rose-400)" strokeWidth={1.5}
            opacity={0.85}/>
      <polygon
        points={`${cx + r * 1.2} ${cy - r * 1.2},${cx + r * 1.0} ${cy - r * 0.9},${cx + r * 0.9} ${cy - r * 1.1}`}
        fill="var(--rose-400)" opacity={0.85}/>
    </g>
  );
}

// Shared (V_D, I_D) plot geometry — Beats 3 and 4 use this.
function plotGeometry(portrait) {
  const G = portrait
    ? { vbW: 620, vbH: 660, gx: 110, gy: 80, gw: 460, gh: 480, captionY: 640 }
    : { vbW: 1180, vbH: 440, gx: 220, gy: 50, gw: 720, gh: 320, captionY: 420 };
  G.toX = v => G.gx + ((v - VMIN_PLOT) / (VMAX_PLOT - VMIN_PLOT)) * G.gw;
  G.toY = i => G.gy + G.gh - (i / IMAX_PLOT) * G.gh;
  return G;
}

// Build the Shockley curve as a sampled svg path across the V_D range.
function shockleyPathD(G, samples = 140) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const v = VMIN_PLOT + (i / samples) * (VMAX_PLOT - VMIN_PLOT);
    const iMa = Math.min(shockley_mA(v), IMAX_PLOT * 1.02);
    const x = G.toX(v).toFixed(2);
    const y = G.toY(iMa).toFixed(2);
    pts.push((i === 0 ? 'M' : 'L') + ` ${x} ${y}`);
  }
  return pts.join(' ');
}

// ─── Beat 2: Source + diode loop ─────────────────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 420, srcX: 100, srcY: 150, srcR: 30,
        diodeX: 320, diodeY: 150, diodeSize: 20,
        ammX: 480, ammY: 150, ammR: 24,
        botY: 290, captionY: 400,
        vLabelX: 100, vLabelY: 95,
        vdLabelX: 320, vdLabelY: 110,
        idLabelX: 480, idLabelY: 110,
        fontMain: 22, fontCaption: 14 }
    : { vbW: 880, vbH: 320, srcX: 140, srcY: 130, srcR: 32,
        diodeX: 410, diodeY: 130, diodeSize: 22,
        ammX: 620, ammY: 130, ammR: 26,
        botY: 240, captionY: 300,
        vLabelX: 140, vLabelY: 70,
        vdLabelX: 410, vdLabelY: 88,
        idLabelX: 620, idLabelY: 88,
        fontMain: 22, fontCaption: 14 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Adjustable source */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <AdjustableSource cx={G.srcX} cy={G.srcY} r={G.srcR}/>
        </SvgFadeIn>

        {/* Top wire: source → diode */}
        <TraceIn d={`M ${G.srcX + G.srcR} ${G.srcY} L ${G.diodeX - G.diodeSize - 4} ${G.diodeY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={0.5}/>

        {/* Diode */}
        <SvgFadeIn duration={0.4} delay={0.9}>
          <DiodeSymbol cx={G.diodeX} cy={G.diodeY} size={G.diodeSize}/>
        </SvgFadeIn>

        {/* Wire: diode → ammeter */}
        <TraceIn d={`M ${G.diodeX + G.diodeSize + 4} ${G.diodeY} L ${G.ammX - G.ammR} ${G.ammY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.2}/>

        {/* Ammeter: circle with A inside */}
        <SvgFadeIn duration={0.4} delay={1.5}>
          <circle cx={G.ammX} cy={G.ammY} r={G.ammR}
                  fill="none" stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={G.ammX} y={G.ammY + G.ammR * 0.32} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.ammR * 0.9}>A</text>
        </SvgFadeIn>

        {/* Right wire down + bottom wire back */}
        <TraceIn d={`M ${G.ammX + G.ammR} ${G.ammY} L ${G.ammX + G.ammR + 30} ${G.ammY} L ${G.ammX + G.ammR + 30} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.8}/>
        <TraceIn d={`M ${G.ammX + G.ammR + 30} ${G.botY} L ${G.srcX} ${G.botY} L ${G.srcX} ${G.srcY + G.srcR}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.8} delay={2.2}/>

        {/* Labels */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <text x={G.vLabelX} y={G.vLabelY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V</text>
          <text x={G.vdLabelX} y={G.vdLabelY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>D</tspan>
          </text>
          <text x={G.idLabelX} y={G.idLabelY} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            I<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>D</tspan>
          </text>
        </SvgFadeIn>

        {/* Anode / cathode side annotations under diode */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.diodeX - G.diodeSize - 6} y={G.diodeY + G.diodeSize * 2 + 4}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.1em">ANODE</text>
          <text x={G.diodeX + G.diodeSize + 6} y={G.diodeY + G.diodeSize * 2 + 4}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.1em">CATHODE</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            anode → cathode is the forward direction
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: I-V curve ───────────────────────────────────────────────────
function CurveBeat() {
  const portrait = usePortrait();
  const G = plotGeometry(portrait);
  const curveD = shockleyPathD(G);

  // V = 0 sits at this x; we use it to mark the zero on the V-axis.
  const x0 = G.toX(0);
  // The knee marker — where V = V_knee, I ≈ 1 mA.
  const xKnee = G.toX(V_KNEE);
  const yKnee = G.toY(shockley_mA(V_KNEE));

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
                fontSize={12} letterSpacing="0.14em">
            I<tspan baselineShift="sub" fontSize={9}>D</tspan>  vs  V<tspan baselineShift="sub" fontSize={9}>D</tspan>
          </text>
        </SvgFadeIn>

        {/* y-axis */}
        <TraceIn d={`M ${x0} ${G.gy} L ${x0} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>
        {/* x-axis: drawn at I = 0 (the baseline of the panel) */}
        <TraceIn d={`M ${G.gx} ${G.gy + G.gh} L ${G.gx + G.gw} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>

        {/* Axis titles */}
        <SvgFadeIn duration={0.3} delay={0.3}>
          <text x={x0 - 10} y={G.gy - 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            I<tspan baselineShift="sub" fontSize={11}>D</tspan>
          </text>
          <text x={G.gx + G.gw + 14} y={G.gy + G.gh + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>D</tspan>
          </text>
          {/* Tick + label at V = 0 */}
          <text x={x0} y={G.gy + G.gh + 20} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
        </SvgFadeIn>

        {/* The curve — drawn in over ~1.4 s */}
        <TraceIn d={curveD}
                 stroke="var(--amber-400)" strokeWidth={2.6}
                 duration={1.6} delay={0.6}
                 pathLength={1000}/>

        {/* Knee marker: vertical dashed at V_knee, extending up through the
            curve so the label can sit high in the panel without colliding
            with the bottom-edge region labels. */}
        <SvgFadeIn duration={0.4} delay={2.5}>
          <line x1={xKnee} y1={G.gy + G.gh} x2={xKnee} y2={G.gy + G.gh * 0.18}
                stroke="var(--rose-400)" strokeWidth={1.2}
                strokeDasharray="4 4" opacity={0.7}/>
          <circle cx={xKnee} cy={yKnee} r={4} fill="var(--rose-400)"/>
          {/* Label parked high up the dashed line, end-anchored so it sits
              to the left of the line and won't overlap the curve's climb. */}
          <text x={xKnee - 12} y={G.gy + G.gh * 0.18 + 16} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 16 : 18}>
            V<tspan baselineShift="sub" fontSize={11}>knee</tspan> ≈ 0.6 V
          </text>
          {/* Tick on x-axis */}
          <text x={xKnee} y={G.gy + G.gh + 20} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0.6</text>
        </SvgFadeIn>

        {/* Region labels — kept low inside the panel where the curve is
            close to zero, well clear of the high-anchored V_knee label. */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={(G.gx + x0) / 2} y={G.gy + G.gh - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">REVERSE</text>
          <text x={(x0 + xKnee) / 2} y={G.gy + G.gh - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">OFF</text>
          {/* CONDUCTING moved to the very top of the conducting region so it
              doesn't sit under the curve's saturated plateau. */}
          <text x={(xKnee + G.gx + G.gw) / 2} y={G.gy + 26} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">CONDUCTING</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            below the knee — off. Past the knee — wide open.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Triangular V_D sweep — genuine motion ───────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const G = plotGeometry(portrait);
  const { localTime, duration: spriteDur } = useSprite();
  const curveD = shockleyPathD(G);

  const SETUP = 0.4;
  const t = Math.max(0, localTime - SETUP);
  // One full sweep period spans most of the beat — keeps the visible motion
  // unhurried so a viewer can read both readouts.
  const PERIOD = Math.max(spriteDur - SETUP - 0.4, 6);
  const phase = (t % PERIOD) / PERIOD;
  const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  // V_D sweeps from VMIN_PLOT up to VMAX_PLOT_SWEEP and back.
  const VMAX_SWEEP = 0.75;
  const vD = VMIN_PLOT + tri * (VMAX_SWEEP - VMIN_PLOT);
  const iD = Math.min(shockley_mA(vD), IMAX_PLOT);

  const xQ = G.toX(vD);
  const yQ = G.toY(iD);
  const x0 = G.toX(0);
  const xKnee = G.toX(V_KNEE);

  // Readout-bar geometry — tucked above the plot.
  const readoutY = G.gy - 38;

  // Determine which region label is active for highlight.
  const region = vD < 0 ? 'reverse' : (vD < V_KNEE - 0.05 ? 'off' : 'conducting');

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes (persistent, no trace-in for second pass) */}
        <line x1={x0} y1={G.gy} x2={x0} y2={G.gy + G.gh}
              stroke="var(--chalk-200)" strokeWidth={1.6}/>
        <line x1={G.gx} y1={G.gy + G.gh} x2={G.gx + G.gw} y2={G.gy + G.gh}
              stroke="var(--chalk-200)" strokeWidth={1.6}/>

        {/* Axis titles */}
        <SvgFadeIn duration={0.3} delay={0.0}>
          <text x={x0 - 10} y={G.gy - 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            I<tspan baselineShift="sub" fontSize={11}>D</tspan>
          </text>
          <text x={G.gx + G.gw + 14} y={G.gy + G.gh + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>D</tspan>
          </text>
          <text x={x0} y={G.gy + G.gh + 20} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
          <text x={xKnee} y={G.gy + G.gh + 20} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0.6</text>
        </SvgFadeIn>

        {/* Persistent curve */}
        <SvgFadeIn duration={0.3} delay={0.0}>
          <path d={curveD} fill="none"
                stroke="var(--amber-400)" strokeWidth={2.4} opacity={0.85}/>
        </SvgFadeIn>

        {/* Knee dashed line — kept so the viewer's eye anchors there */}
        <SvgFadeIn duration={0.3} delay={0.0}>
          <line x1={xKnee} y1={G.gy + G.gh} x2={xKnee} y2={G.gy + G.gh * 0.15}
                stroke="var(--rose-400)" strokeWidth={1}
                strokeDasharray="4 4" opacity={0.45}/>
        </SvgFadeIn>

        {/* Live V_D vertical cursor */}
        {localTime > SETUP - 0.05 && (
          <g>
            <line x1={xQ} y1={G.gy + G.gh} x2={xQ} y2={G.gy + G.gh * 0.05}
                  stroke="var(--amber-300)" strokeWidth={1}
                  strokeDasharray="2 4" opacity={0.55}/>
            {/* Drop to I-axis */}
            <line x1={xQ} y1={yQ} x2={x0} y2={yQ}
                  stroke="var(--amber-300)" strokeWidth={1}
                  strokeDasharray="2 4" opacity={0.55}/>
            {/* Operating point */}
            <circle cx={xQ} cy={yQ} r={11} fill="none"
                    stroke="var(--amber-300)" strokeWidth={1.4} opacity={0.55}/>
            <circle cx={xQ} cy={yQ} r={6} fill="var(--amber-300)"
                    stroke="var(--amber-400)" strokeWidth={1.5}/>
            <text x={xQ + 14} y={yQ - 10}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={16}>Q</text>
          </g>
        )}

        {/* Live readout — top of the plot, monospaced for stable layout */}
        <SvgFadeIn duration={0.3} delay={0.0}>
          <rect x={G.gx + G.gw / 2 - 140} y={readoutY - 14}
                width={280} height={22}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                opacity={0.5} rx={4}/>
          <text x={G.gx + G.gw / 2} y={readoutY + 2} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.08em">
            V_D {vD >= 0 ? ' ' : ''}{vD.toFixed(2)} V   ·   I_D {iD.toFixed(2)} mA
          </text>
        </SvgFadeIn>

        {/* Region badge — small mono chip above the curve */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <text x={G.gx + 14} y={G.gy + 18}
                fill={region === 'conducting' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em">
            {region === 'reverse' ? 'REVERSE BIAS' : region === 'off' ? 'BELOW KNEE — OFF' : 'CONDUCTING'}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            Q hugs zero across reverse and the off region — then shoots up past the knee
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
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 34,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Off below the knee — a tiny fixed drop above.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        ideal-diode model
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '28ch' : '50ch', lineHeight: 1.45,
        }}>
        good enough for power supplies, clippers, gates — anywhere the diode is fully on or fully off.
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
