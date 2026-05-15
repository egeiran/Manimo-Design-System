// Inverting Op-Amp: The Virtual Short Does the Algebra — Manimo lesson scene.
// V+ grounded; the op-amp's huge gain forces V− to track V+, so V− is a
// virtual ground. KCL at V− gives V_in/R_in = −V_out/R_f, i.e.
// V_out = −(R_f/R_in)·V_in. The op-amp's own gain never enters the answer.
// Genuine motion lives in Beat 5: V_in sweeps sinusoidally and V_out traces
// out its inverted, scaled mirror in real time.
//
// Beats (timed to single-track narration in motion/ade/audio/inverting-op-amp/):
//    0.00– 7.65  Manimo intro + hook caption
//    7.65–20.12  Configuration — op-amp triangle, R_in, R_f, V_in, ground
//   20.12–34.25  Virtual short — V− follows V+ = 0
//   34.25–49.18  KCL at V− with flowing currents → V_out = −(R_f/R_in)·V_in
//   49.18–56.00  Sweep V_in, watch V_out flip + scale  (genuine motion)
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • OpAmpShape() draws the standard triangle so the layout stays the
//     same across Beats 2–4.
//   • Beat 4 uses useSprite() time to push charge dots through R_in and R_f.
//   • Beat 5 uses useSprite() time to sweep V_in and trace V_out — that's
//     the value-driven graph that justifies the scene.

const SCENE_DURATION = 56;

const NARRATION = [
  /*  0.00– 7.65 */ "An op-amp gain is enormous and not well controlled — yet you can build a precise amplifier from one. How?",
  /*  7.65–20.12 */ "Here's the inverting configuration. V plus sits at ground. The input drives V minus through R in, and R f closes a loop from the output back to V minus.",
  /* 20.12–34.25 */ "Because the gain is huge, the op-amp will adjust V out by whatever amount it takes to drag V minus back to the same voltage as V plus — which is ground. V minus is a virtual ground.",
  /* 34.25–49.18 */ "Apply Kirchhoff's current law at V minus. The current arriving from V in equals the current leaving towards V out. Solve, and the output is minus R f over R in times the input.",
  /* 49.18–56.00 */ "Sweep the input — the output moves opposite, scaled by the resistor ratio.",
];

const NARRATION_AUDIO = 'audio/inverting-op-amp/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="Inverting Op-Amp: The Virtual Short Does the Algebra"
      duration={SCENE_DURATION}
      introEnd={7.65}
      introCaption="Sloppy gain, precise amplifier — how?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.65} end={20.12}>
        <ConfigurationBeat />
      </Sprite>

      <Sprite start={20.12} end={34.25}>
        <VirtualShortBeat />
      </Sprite>

      <Sprite start={34.25} end={49.18}>
        <KclResultBeat />
      </Sprite>

      <Sprite start={49.18} end={SCENE_DURATION}>
        <SweepBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared op-amp glyph + zigzag resistor ───────────────────────────────
// Op-amp triangle centred at (cx, cy), pointing right.
// Returns inputs at (left, cy ± inputOff) and output at (right, cy).
function OpAmpShape({ cx, cy, w = 140, color = 'var(--amber-400)' }) {
  const h = w * 0.95;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  return (
    <g>
      <path d={`M ${left} ${top} L ${left} ${bot} L ${right} ${cy} Z`}
            fill="none" stroke={color} strokeWidth={2.4}/>
      {/* Top input is the inverting (−); bottom input is the non-inverting (+) */}
      <text x={left + 18} y={cy - h * 0.32 + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={20} fontWeight="bold" textAnchor="middle">−</text>
      <text x={left + 18} y={cy + h * 0.32 + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={20} fontWeight="bold" textAnchor="middle">+</text>
    </g>
  );
}

function resistorHorizontalD(xLeft, xRight, cy, amp = 9, n = 6) {
  const dx = (xRight - xLeft) / n;
  const pts = [`M ${xLeft} ${cy}`];
  for (let i = 1; i < n; i++) {
    const x = xLeft + i * dx;
    const y = cy + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y}`);
  }
  pts.push(`L ${xRight} ${cy}`);
  return pts.join(' ');
}

// Shared layout helper for the three "circuit" beats. Returns the geometry
// the diagram needs in both aspects.
function circuitGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 600,
        ampCx: 360, ampCy: 280, ampW: 140,
        rInLeftX: 70, rInRightX: 200, rInY: 218,
        vMinusNodeX: 290,
        vInLabelX: 70, vInLabelY: 200,
        rfX1: 290, rfX2: 430, rfY: 100,
        vOutNodeX: 430, vOutLabelX: 530,
        gndX: 290, gndY: 360,
        captionY: 540 }
    : { vbW: 1100, vbH: 460,
        ampCx: 620, ampCy: 220, ampW: 180,
        rInLeftX: 220, rInRightX: 400, rInY: 150,
        vMinusNodeX: 530,
        vInLabelX: 130, vInLabelY: 130,
        rfX1: 530, rfX2: 820, rfY: 60,
        vOutNodeX: 820, vOutLabelX: 940,
        gndX: 530, gndY: 320,
        captionY: 440 };
}

// Draw the inverting-op-amp circuit. Optional callbacks let the caller
// overlay beat-specific decorations (current arrows, virtual-ground glow).
function CircuitDiagram({ G, beatDelay = 0, showLabels = true, accent = false }) {
  const vMinusY = G.rInY;
  const vPlusY = G.ampCy + G.ampW * 0.95 * 0.32;
  const vOutY = G.ampCy;
  // Op-amp input pins.
  const ampLeftX = G.ampCx - G.ampW / 2;
  const ampRightX = G.ampCx + G.ampW / 2;
  const inputMinusX = ampLeftX;
  const inputMinusYAtAmp = G.ampCy - G.ampW * 0.95 * 0.32;
  const inputPlusX = ampLeftX;
  const inputPlusYAtAmp = G.ampCy + G.ampW * 0.95 * 0.32;

  return (
    <g>
      {/* Op-amp triangle */}
      <SvgFadeIn duration={0.5} delay={beatDelay + 0.0}>
        <OpAmpShape cx={G.ampCx} cy={G.ampCy} w={G.ampW}/>
      </SvgFadeIn>

      {/* V_in label + source mark (left edge of R_in) */}
      <SvgFadeIn duration={0.4} delay={beatDelay + 1.2}>
        <circle cx={G.rInLeftX} cy={G.rInY} r={3.5} fill="var(--chalk-200)"/>
        <text x={G.rInLeftX - 14} y={G.rInY + 6} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>V<tspan baselineShift="sub" fontSize={12}>in</tspan></text>
      </SvgFadeIn>

      {/* R_in zigzag */}
      <TraceIn d={resistorHorizontalD(G.rInLeftX, G.rInRightX, G.rInY)}
               stroke="var(--amber-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 1.2}/>
      {showLabels && (
        <SvgFadeIn duration={0.4} delay={beatDelay + 1.8}>
          <text x={(G.rInLeftX + G.rInRightX) / 2} y={G.rInY - 18}
                textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>R<tspan baselineShift="sub" fontSize={11}>in</tspan></text>
        </SvgFadeIn>
      )}

      {/* Wire from R_in to V− node and into op-amp V− pin */}
      <TraceIn d={`M ${G.rInRightX} ${G.rInY} L ${G.vMinusNodeX} ${G.rInY} L ${G.vMinusNodeX} ${inputMinusYAtAmp} L ${inputMinusX} ${inputMinusYAtAmp}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.6} delay={beatDelay + 1.4}/>

      {/* V− node dot */}
      <SvgFadeIn duration={0.3} delay={beatDelay + 2.0}>
        <circle cx={G.vMinusNodeX} cy={G.rInY} r={3.5}
                fill={accent ? 'var(--amber-300)' : 'var(--chalk-100)'}/>
        <text x={G.vMinusNodeX + 12} y={G.rInY + 6}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize={11}>−</tspan></text>
      </SvgFadeIn>

      {/* R_f feedback path: V− node → up → across → down → V_out node */}
      <TraceIn d={`M ${G.vMinusNodeX} ${G.rInY} L ${G.vMinusNodeX} ${G.rfY} L ${G.rfX1 + 10} ${G.rfY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 1.8}/>
      <TraceIn d={resistorHorizontalD(G.rfX1 + 10, G.rfX2 - 10, G.rfY)}
               stroke="var(--rose-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 1.8}/>
      <TraceIn d={`M ${G.rfX2 - 10} ${G.rfY} L ${G.vOutNodeX} ${G.rfY} L ${G.vOutNodeX} ${vOutY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 1.8}/>
      {showLabels && (
        <SvgFadeIn duration={0.4} delay={beatDelay + 2.4}>
          <text x={(G.rfX1 + G.rfX2) / 2} y={G.rfY - 16}
                textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>R<tspan baselineShift="sub" fontSize={11}>f</tspan></text>
        </SvgFadeIn>
      )}

      {/* Output wire to V_out label */}
      <TraceIn d={`M ${ampRightX} ${vOutY} L ${G.vOutNodeX} ${vOutY} L ${G.vOutLabelX} ${vOutY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 2.0}/>
      <SvgFadeIn duration={0.4} delay={beatDelay + 2.4}>
        <circle cx={G.vOutNodeX} cy={vOutY} r={3.5} fill="var(--chalk-100)"/>
        <text x={G.vOutLabelX + 10} y={vOutY + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>V<tspan baselineShift="sub" fontSize={12}>out</tspan></text>
      </SvgFadeIn>

      {/* V+ to ground */}
      <TraceIn d={`M ${inputPlusX} ${inputPlusYAtAmp} L ${G.gndX} ${inputPlusYAtAmp} L ${G.gndX} ${G.gndY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 0.6}/>
      {/* Ground symbol — three stacked horizontal lines */}
      <SvgFadeIn duration={0.4} delay={beatDelay + 1.0}>
        <line x1={G.gndX - 14} y1={G.gndY} x2={G.gndX + 14} y2={G.gndY}
              stroke="var(--chalk-200)" strokeWidth={2.2}/>
        <line x1={G.gndX - 9} y1={G.gndY + 6} x2={G.gndX + 9} y2={G.gndY + 6}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <line x1={G.gndX - 5} y1={G.gndY + 12} x2={G.gndX + 5} y2={G.gndY + 12}
              stroke="var(--chalk-200)" strokeWidth={1.8}/>
      </SvgFadeIn>
    </g>
  );
}

// ─── Beat 2: Configuration ───────────────────────────────────────────────
function ConfigurationBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G}/>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            input through R_in, feedback through R_f — that's the whole story
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Virtual short ───────────────────────────────────────────────
// Genuine motion: a pulsing ring around the V− node that grows briefly each
// time the feedback "catches" it at the same potential as V+.
function VirtualShortBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = circuitGeometry(portrait);

  // Pulse rings around V− every 1.2s, fading as they expand.
  const pulses = [];
  for (let k = 0; k < 6; k++) {
    const start = 1.4 + k * 1.0;
    const t = localTime - start;
    if (t > 0 && t < 1.0) {
      pulses.push({ t });
    }
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G} accent/>

        {/* Pulse rings around V− node — feedback "catching" V− at ground */}
        {pulses.map((p, i) => {
          const r = 6 + p.t * 32;
          const alpha = 1 - p.t;
          return (
            <circle key={i} cx={G.vMinusNodeX} cy={G.rInY} r={r}
                    fill="none" stroke="var(--amber-300)" strokeWidth={1.8}
                    opacity={alpha}/>
          );
        })}

        {/* V+ = 0 callout — anchored to the V+ wire segment between the
            op-amp pin and the ground rail, well clear of the bottom "+"
            input glyph that OpAmpShape draws inside the triangle. */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.gndX + 36} y={(G.ampCy + G.ampW * 0.95 * 0.32 + G.gndY) / 2 + 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize={11}>+</tspan> = 0</text>
        </SvgFadeIn>

        {/* Virtual ground identity */}
        <SvgFadeIn duration={0.5} delay={1.6}>
          <text x={G.vbW / 2} y={G.captionY - 40} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 32}>
            V<tspan baselineShift="sub" fontSize={13}>−</tspan> ≈ V<tspan baselineShift="sub" fontSize={13}>+</tspan> = 0  (virtual ground)
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            feedback drags V_minus to V_plus — no current goes into the op-amp
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: KCL + result ────────────────────────────────────────────────
// Genuine motion: charge dots stream rightward through R_in and continue out
// through R_f, showing the equality i_in = i_f at the V− node.
function KclResultBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = circuitGeometry(portrait);

  // Phase-locked dots: a constant flow rate represents a steady current.
  const NUM = 6;
  const phase = Math.max(0, localTime - 0.6) / 2.2;

  // R_in path: from rInLeftX → rInRightX → vMinusNodeX  (horizontal segment).
  // For simplicity we animate dots only along the resistor segment.
  const rInDots = [];
  const rInLen = G.rInRightX - G.rInLeftX;
  for (let i = 0; i < NUM; i++) {
    const u = ((phase + i / NUM) % 1);
    rInDots.push({ x: G.rInLeftX + u * rInLen, y: G.rInY });
  }
  // R_f path: from vMinusNodeX up at rfY → rfX1 → rfX2 → vOutNodeX down.
  // We animate dots along the rfX1..rfX2 segment (the resistor itself).
  const rfDots = [];
  const rfLen = G.rfX2 - G.rfX1;
  for (let i = 0; i < NUM; i++) {
    const u = ((phase + i / NUM) % 1);
    rfDots.push({ x: G.rfX1 + u * rfLen, y: G.rfY });
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G} accent/>

        {/* Current dots through R_in (flowing right) */}
        {localTime > 0.4 && rInDots.map((d, i) => (
          <circle key={`rin${i}`} cx={d.x} cy={d.y} r={3}
                  fill="var(--rose-300)" opacity={0.95}/>
        ))}
        {/* Current dots through R_f (flowing right too — from V− toward V_out) */}
        {localTime > 0.4 && rfDots.map((d, i) => (
          <circle key={`rf${i}`} cx={d.x} cy={d.y} r={3}
                  fill="var(--rose-300)" opacity={0.95}/>
        ))}

        {/* i arrows */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={(G.rInLeftX + G.rInRightX) / 2} y={G.rInY + 30}
                textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">i_in →</text>
          <text x={(G.rfX1 + G.rfX2) / 2} y={G.rfY + 28}
                textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">i_f →</text>
        </SvgFadeIn>

        {/* KCL line */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <text x={G.vbW / 2} y={G.captionY - 80} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 26}>
            V<tspan baselineShift="sub" fontSize={12}>in</tspan> / R<tspan baselineShift="sub" fontSize={12}>in</tspan> = −V<tspan baselineShift="sub" fontSize={12}>out</tspan> / R<tspan baselineShift="sub" fontSize={12}>f</tspan>
          </text>
        </SvgFadeIn>

        {/* Final result */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY - 30} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 28 : 36}>
            V<tspan baselineShift="sub" fontSize={14}>out</tspan> = −(R<tspan baselineShift="sub" fontSize={14}>f</tspan> / R<tspan baselineShift="sub" fontSize={14}>in</tspan>) · V<tspan baselineShift="sub" fontSize={14}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two resistors set the gain — the op-amp itself doesn't appear
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Sweep V_in, watch V_out follow inverted ─────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720, gx: 80, gy: 120, gw: 460, gh: 480,
        fontAxis: 14, fontFormula: 26, captionY: 680 }
    : { vbW: 1100, vbH: 460, gx: 140, gy: 60, gw: 740, gh: 340,
        fontAxis: 14, fontFormula: 28, captionY: 440 };

  // Trace progresses with the beat. Reserve ~0.6 s setup and 1.0 s tail.
  const TRACE_START = 0.6;
  const TRACE_DUR = Math.max(spriteDur - TRACE_START - 1.5, 1);
  const traceFrac = clamp((localTime - TRACE_START) / TRACE_DUR, 0, 1);

  // Axes: midline is V = 0. amplitude = 1 (input), gain ≈ 1.7.
  // Trimmed from a clean ×2 so the V_out trace doesn't skim the bottom
  // axis or the dashed sweep cursor on its negative peak.
  const GAIN = 1.7;
  const midY = G.gy + G.gh / 2;
  const amp = G.gh * 0.18;             // V_in amplitude
  const ampOut = amp * GAIN;           // V_out amplitude (clipped to top/bottom)

  // Build the V_in and V_out trace paths up to the current sweep front.
  function buildTrace(amplitude, sign) {
    const samples = Math.max(2, Math.floor(traceFrac * 200));
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = (samples > 0) ? (i / samples) : 0;
      const sweepFrac = u * traceFrac;
      const t = sweepFrac;                                    // 0..traceFrac
      const x = G.gx + sweepFrac * G.gw;
      const y = midY + sign * amplitude * Math.sin(2 * Math.PI * 2 * t);
      pts.push((i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }
  const vInD = buildTrace(amp, -1);     // − so positive sin shows above midline
  const vOutD = buildTrace(ampOut, +1); // inverted

  // Cursor / sweep front
  const cursorX = G.gx + traceFrac * G.gw;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <TraceIn d={`M ${G.gx} ${G.gy} L ${G.gx} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>
        <TraceIn d={`M ${G.gx} ${midY} L ${G.gx + G.gw} ${midY}`}
                 stroke="var(--chalk-300)" strokeWidth={1.2}
                 duration={0.6} delay={0.2}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={G.gx + G.gw + 14} y={midY + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.fontAxis} letterSpacing="0.1em">t →</text>
          <text x={G.gx - 12} y={G.gy + 16}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.fontAxis} letterSpacing="0.1em">V</text>
        </SvgFadeIn>

        {/* Reference tick marks at +1 and −1 */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.gx - 6} y1={midY - amp} x2={G.gx + 6} y2={midY - amp}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.gx - 6} y1={midY + amp} x2={G.gx + 6} y2={midY + amp}
                stroke="var(--chalk-300)" strokeWidth={1}/>
        </SvgFadeIn>

        {/* V_in trace */}
        {traceFrac > 0.001 && (
          <path d={vInD} fill="none"
                stroke="var(--chalk-100)" strokeWidth={2.2}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {/* V_out trace */}
        {traceFrac > 0.001 && (
          <path d={vOutD} fill="none"
                stroke="var(--amber-300)" strokeWidth={2.6}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Cursor at sweep front */}
        {traceFrac > 0.01 && traceFrac < 0.99 && (
          <line x1={cursorX} y1={G.gy + 6} x2={cursorX} y2={G.gy + G.gh - 6}
                stroke="var(--amber-300)" strokeWidth={1}
                strokeDasharray="2 4" opacity={0.45}/>
        )}

        {/* Trace labels */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.gx + 14} y={midY - amp - 12}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">V_in</text>
          <text x={G.gx + 14} y={midY + ampOut + 22}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">V_out</text>
        </SvgFadeIn>

        {/* Gain formula */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY - 50} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            gain = −R<tspan baselineShift="sub" fontSize={13}>f</tspan> / R<tspan baselineShift="sub" fontSize={13}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            flip the sign, scale by the ratio — the op-amp's huge gain never appears
          </text>
        </SvgFadeIn>
      </svg>
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
