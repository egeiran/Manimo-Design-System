// Non-Inverting Op-Amp: A Voltage Divider Sets the Gain — Manimo lesson scene.
// V_in drives V+. R_1 ties V- to ground; R_f closes the loop from V_out back
// to V-. Negative feedback drags V- up to V_in (virtual short at V_in, not
// ground), and R_1 || R_f tap is V-, so V_out = (1 + R_f/R_1)·V_in.
// Genuine motion lives in Beat 3 (Virtual short — pulse rings on V- tugging
// toward V_in) and Beat 5 (sweep V_in, V_out traces in-phase scaled).
//
// Beats (timed to single-track narration in motion/ade/audio/non-inverting-op-amp/):
//    0.00– 5.09  Manimo intro: drive V+ now
//    5.09–17.07  Configuration: V_in → V+, R_1 to ground, R_f to V_out
//   17.07–26.60  Virtual short: V_- catches up to V_in
//   26.60–42.56  Gain derivation: R_1/R_f divider → V_out = (1 + R_f/R_1)·V_in
//   42.56–47.00  Sweep: V_in sinusoid → V_out in-phase, ×(1+R_f/R_1)
//
// Authoring notes:
//   • Layout convention here flips inverting op-amp's input order:
//     V_+ pin sits on TOP (where the input comes in), V_- pin on BOTTOM
//     (where the feedback network sits).
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 5's traces both share the same useSprite() time so the sweep
//     cursor and both signal traces stay in lockstep.

const SCENE_DURATION = 47;

const NARRATION = [
  /*  0.00– 5.09 */ "Same op-amp — but this time drive the plus pin. What does the output do?",
  /*  5.09–17.07 */ "The non-inverting configuration: V in feeds the plus pin directly. R 1 ties V minus to ground; R f closes the feedback loop from the output back to V minus.",
  /* 17.07–26.60 */ "Negative feedback drags V minus up until it matches V plus. So V minus equals V in — a virtual short, but at V in instead of ground.",
  /* 26.60–42.56 */ "Now R 1 and R f form a divider from V out down to ground, with V minus tapped between them. Solve V minus equals V out times R 1 over R 1 plus R f, and you get the gain: one plus R f over R 1.",
  /* 42.56–47.00 */ "Sweep V in — V out follows in phase, just bigger.",
];

const NARRATION_AUDIO = 'audio/non-inverting-op-amp/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="Non-Inverting Op-Amp: A Voltage Divider Sets the Gain"
      duration={SCENE_DURATION}
      introEnd={5.09}
      introCaption="Drive V+, see what comes out."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.09} end={17.07}>
        <ConfigurationBeat />
      </Sprite>

      <Sprite start={17.07} end={26.60}>
        <VirtualShortBeat />
      </Sprite>

      <Sprite start={26.60} end={42.56}>
        <GainBeat />
      </Sprite>

      <Sprite start={42.56} end={SCENE_DURATION}>
        <SweepBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────
// Op-amp triangle pointing right. V+ pin on TOP, V- pin on BOTTOM — opposite
// of the inverting-op-amp convention so the input wires the natural way.
function NonInvertingOpAmpShape({ cx, cy, w = 140, color = 'var(--amber-400)' }) {
  const h = w * 0.95;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  return (
    <g>
      <path d={`M ${left} ${top} L ${left} ${bot} L ${right} ${cy} Z`}
            fill="none" stroke={color} strokeWidth={2.4}/>
      {/* V+ on top, V- on bottom */}
      <text x={left + 18} y={cy - h * 0.32 + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={20} fontWeight="bold" textAnchor="middle">+</text>
      <text x={left + 18} y={cy + h * 0.32 + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={20} fontWeight="bold" textAnchor="middle">−</text>
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

function resistorVerticalD(cx, yTop, yBot, amp = 9, n = 6) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const y = yTop + i * dy;
    const x = cx + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
}

function GroundSymbol({ x, y, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <line x1={x - 14} y1={y} x2={x + 14} y2={y}
            stroke={color} strokeWidth={2.2}/>
      <line x1={x - 9} y1={y + 6} x2={x + 9} y2={y + 6}
            stroke={color} strokeWidth={2}/>
      <line x1={x - 5} y1={y + 12} x2={x + 5} y2={y + 12}
            stroke={color} strokeWidth={1.8}/>
    </g>
  );
}

// Shared layout for the three "circuit" beats. V+ pin on top, V- on bottom.
// R_f loops OVER the top of the op-amp from V_minus_node back to V_out — a
// clean U-shape that mirrors the inverting-op-amp geometry.
function circuitGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 720,
        ampCx: 320, ampCy: 320, ampW: 140,
        // R_1 hangs from V- down to ground
        r1Y1: 410, r1Y2: 480, gndY: 510,
        // R_f loops above the op-amp from V_minus_node UP, ACROSS, DOWN to V_out
        rfY: 130, rfX1: 260, rfX2: 420,
        captionY: 680 }
    : { vbW: 1100, vbH: 540,
        ampCx: 580, ampCy: 230, ampW: 180,
        r1Y1: 320, r1Y2: 380, gndY: 410,
        rfY: 70, rfX1: 460, rfX2: 760,
        captionY: 520 };
}

// Compute pin coordinates from the op-amp geometry.
function pinCoords(G) {
  const h = G.ampW * 0.95;
  const ampLeftX = G.ampCx - G.ampW / 2;
  const ampRightX = G.ampCx + G.ampW / 2;
  const vPlusY = G.ampCy - h * 0.32;   // top input (V+)
  const vMinusY = G.ampCy + h * 0.32;  // bottom input (V−)
  return { ampLeftX, ampRightX, vPlusY, vMinusY };
}

// Draw the non-inverting op-amp circuit. R_f loops OVER the top of the
// op-amp triangle from V_minus_node back to V_out, mirroring the
// inverting-op-amp scene's clean U-shape.
function CircuitDiagram({ G, beatDelay = 0, accent = false }) {
  const { ampLeftX, ampRightX, vPlusY, vMinusY } = pinCoords(G);
  // V_minus_node sits just to the left of the V- pin; R_1 hangs DOWN
  // from this node to ground, R_f goes UP and around to V_out.
  const vMinusNodeX = ampLeftX - 60;
  // V_out node sits directly under the right end of R_f so the feedback
  // path closes with a clean vertical drop.
  const vOutNodeX = G.rfX2;
  const vOutNodeY = G.ampCy;

  return (
    <g>
      {/* Op-amp triangle */}
      <SvgFadeIn duration={0.5} delay={beatDelay + 0.0}>
        <NonInvertingOpAmpShape cx={G.ampCx} cy={G.ampCy} w={G.ampW}/>
      </SvgFadeIn>

      {/* V_in source mark + label on far left */}
      <SvgFadeIn duration={0.4} delay={beatDelay + 0.8}>
        <circle cx={vMinusNodeX - 90} cy={vPlusY} r={3.5} fill="var(--chalk-200)"/>
        <text x={vMinusNodeX - 106} y={vPlusY + 6} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>V<tspan baselineShift="sub" fontSize={12}>in</tspan></text>
      </SvgFadeIn>

      {/* Wire from V_in into V+ pin */}
      <TraceIn d={`M ${vMinusNodeX - 90} ${vPlusY} L ${ampLeftX} ${vPlusY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 0.8}/>

      {/* V+ label */}
      <SvgFadeIn duration={0.35} delay={beatDelay + 1.4}>
        <text x={ampLeftX - 8} y={vPlusY - 8} textAnchor="end"
              fill="var(--chalk-200)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>
          V<tspan baselineShift="sub" fontSize={10}>+</tspan>
        </text>
      </SvgFadeIn>

      {/* V- pin → V- node (a short stub to the left) */}
      <TraceIn d={`M ${ampLeftX} ${vMinusY} L ${vMinusNodeX} ${vMinusY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 1.6}/>

      {/* V- node dot + label */}
      <SvgFadeIn duration={0.3} delay={beatDelay + 1.8}>
        <circle cx={vMinusNodeX} cy={vMinusY} r={3.5}
                fill={accent ? 'var(--amber-300)' : 'var(--chalk-100)'}/>
        <text x={vMinusNodeX - 12} y={vMinusY + 18} textAnchor="end"
              fill="var(--chalk-200)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>
          V<tspan baselineShift="sub" fontSize={10}>−</tspan>
        </text>
      </SvgFadeIn>

      {/* R_1: stub from V- DOWN to top of R_1, R_1 resistor, stub down to ground */}
      <TraceIn d={`M ${vMinusNodeX} ${vMinusY} L ${vMinusNodeX} ${G.r1Y1}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.3} delay={beatDelay + 2.0}/>
      <TraceIn d={resistorVerticalD(vMinusNodeX, G.r1Y1, G.r1Y2)}
               stroke="var(--amber-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 2.0}/>
      <TraceIn d={`M ${vMinusNodeX} ${G.r1Y2} L ${vMinusNodeX} ${G.gndY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.3} delay={beatDelay + 2.3}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 2.6}>
        <text x={vMinusNodeX + 20} y={(G.r1Y1 + G.r1Y2) / 2 + 6}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>R<tspan baselineShift="sub" fontSize={11}>1</tspan></text>
      </SvgFadeIn>
      {/* Ground symbol */}
      <SvgFadeIn duration={0.35} delay={beatDelay + 2.8}>
        <GroundSymbol x={vMinusNodeX} y={G.gndY}/>
      </SvgFadeIn>

      {/* R_f feedback path: V- node UP to rfY, ACROSS (through R_f resistor), DOWN to V_out node */}
      <TraceIn d={`M ${vMinusNodeX} ${vMinusY} L ${vMinusNodeX} ${G.rfY} L ${G.rfX1} ${G.rfY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 3.0}/>
      <TraceIn d={resistorHorizontalD(G.rfX1, G.rfX2, G.rfY)}
               stroke="var(--rose-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 3.2}/>
      <TraceIn d={`M ${G.rfX2} ${G.rfY} L ${vOutNodeX} ${vOutNodeY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 3.4}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 3.8}>
        <text x={(G.rfX1 + G.rfX2) / 2} y={G.rfY - 14} textAnchor="middle"
              fill="var(--rose-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>R<tspan baselineShift="sub" fontSize={11}>f</tspan></text>
      </SvgFadeIn>

      {/* Output wire from op-amp tip → V_out node, with V_out label */}
      <TraceIn d={`M ${ampRightX} ${G.ampCy} L ${vOutNodeX} ${vOutNodeY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 2.4}/>
      <SvgFadeIn duration={0.4} delay={beatDelay + 2.8}>
        <circle cx={vOutNodeX} cy={vOutNodeY} r={3.5} fill="var(--chalk-100)"/>
        <text x={vOutNodeX + 14} y={vOutNodeY + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>V<tspan baselineShift="sub" fontSize={12}>out</tspan></text>
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

        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            input on V+, feedback through the R_1 / R_f divider
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Virtual short — V_- catches V_in ────────────────────────────
// Genuine motion: pulse rings around V- show feedback dragging it up to V_in.
function VirtualShortBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = circuitGeometry(portrait);
  const { ampLeftX, vPlusY, vMinusY } = pinCoords(G);
  const vMinusNodeX = ampLeftX - 60;

  // Pulse rings every 1.0s, fading as they expand
  const pulses = [];
  for (let k = 0; k < 8; k++) {
    const start = 1.4 + k * 1.0;
    const t = localTime - start;
    if (t > 0 && t < 1.0) pulses.push({ t });
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G} accent/>

        {/* Pulse rings around V- node — feedback "catching" V- at V_in */}
        {pulses.map((p, i) => {
          const r = 6 + p.t * 30;
          const alpha = 1 - p.t;
          return (
            <circle key={i} cx={vMinusNodeX} cy={vMinusY} r={r}
                    fill="none" stroke="var(--amber-300)" strokeWidth={1.8}
                    opacity={alpha}/>
          );
        })}

        {/* Bracket on the two input pins with annotation "V+ = V- = V_in" */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={ampLeftX - 92} y1={vPlusY}
                x2={ampLeftX - 92} y2={vMinusY}
                stroke="var(--amber-300)" strokeWidth={1.4}/>
          <line x1={ampLeftX - 92} y1={vPlusY}
                x2={ampLeftX - 84} y2={vPlusY}
                stroke="var(--amber-300)" strokeWidth={1.4}/>
          <line x1={ampLeftX - 92} y1={vMinusY}
                x2={ampLeftX - 84} y2={vMinusY}
                stroke="var(--amber-300)" strokeWidth={1.4}/>
          <text x={ampLeftX - 100} y={(vPlusY + vMinusY) / 2 + 5} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 11 : 12} letterSpacing="0.1em">
            V+ = V−
          </text>
        </SvgFadeIn>

        {/* Headline result: V_- = V_in */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY - 30} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 28}>
            V<tspan baselineShift="sub" fontSize={13}>−</tspan> = V<tspan baselineShift="sub" fontSize={13}>in</tspan> &nbsp; (virtual short)
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={5.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            feedback drags V− up until it matches V+
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Gain derivation ─────────────────────────────────────────────
function GainBeat() {
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

        {/* Divider callout — single line at the very top, well clear of
            the R_f label so the schematic doesn't get visually crowded. */}
        <SvgFadeIn duration={0.5} delay={0.6}>
          <text x={G.vbW / 2} y={portrait ? 22 : 18} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.18em">VOLTAGE DIVIDER  ·  V_out → R_f → V− → R_1 → 0</text>
        </SvgFadeIn>

        {/* Step 1: V_in = V_out · R_1 / (R_1 + R_f) */}
        <SvgFadeIn duration={0.5} delay={2.0}>
          <text x={G.vbW / 2} y={G.captionY - 70} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 20 : 24}>
            V<tspan baselineShift="sub" fontSize={13}>in</tspan> = V<tspan baselineShift="sub" fontSize={13}>out</tspan> · R<tspan baselineShift="sub" fontSize={13}>1</tspan> / (R<tspan baselineShift="sub" fontSize={13}>1</tspan> + R<tspan baselineShift="sub" fontSize={13}>f</tspan>)
          </text>
        </SvgFadeIn>

        {/* Step 2: rearrange → V_out = (1 + R_f/R_1) · V_in */}
        <SvgFadeIn duration={0.5} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY - 26} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 32}>
            V<tspan baselineShift="sub" fontSize={14}>out</tspan> = (1 + R<tspan baselineShift="sub" fontSize={14}>f</tspan>/R<tspan baselineShift="sub" fontSize={14}>1</tspan>) · V<tspan baselineShift="sub" fontSize={14}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY + 4} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            gain is always at least 1 — and the sign is positive
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Sweep — V_in sine, V_out follows in-phase, scaled ───────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720, gx: 80, gy: 120, gw: 460, gh: 460,
        fontAxis: 14, fontFormula: 24, captionY: 670 }
    : { vbW: 1100, vbH: 460, gx: 140, gy: 60, gw: 760, gh: 340,
        fontAxis: 14, fontFormula: 28, captionY: 440 };

  const TRACE_START = 0.6;
  const TRACE_DUR = Math.max(spriteDur - TRACE_START - 1.2, 1);
  const traceFrac = clamp((localTime - TRACE_START) / TRACE_DUR, 0, 1);

  // V_out = (1 + R_f/R_1)·V_in. Take R_f/R_1 = 1 → gain = 2.
  // Trim to 1.7 so the V_out trace stays inside the grid in both aspects.
  const GAIN = 1.7;
  const midY = G.gy + G.gh / 2;
  const amp = G.gh * 0.18;
  const ampOut = amp * GAIN;

  // Both traces share the same sign (in-phase, no inversion).
  function buildTrace(amplitude) {
    const samples = Math.max(2, Math.floor(traceFrac * 200));
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = samples > 0 ? i / samples : 0;
      const sweepFrac = u * traceFrac;
      const x = G.gx + sweepFrac * G.gw;
      const y = midY - amplitude * Math.sin(2 * Math.PI * 2 * sweepFrac);
      pts.push((i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }
  const vInD = buildTrace(amp);
  const vOutD = buildTrace(ampOut);
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
          <text x={G.gx - 12} y={G.gy + 16} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.fontAxis} letterSpacing="0.1em">V</text>
        </SvgFadeIn>

        {/* Reference ticks at +1, -1 (V_in amplitude) */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.gx - 6} y1={midY - amp} x2={G.gx + 6} y2={midY - amp}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.gx - 6} y1={midY + amp} x2={G.gx + 6} y2={midY + amp}
                stroke="var(--chalk-300)" strokeWidth={1}/>
        </SvgFadeIn>

        {/* V_in trace (chalk) */}
        {traceFrac > 0.001 && (
          <path d={vInD} fill="none"
                stroke="var(--chalk-100)" strokeWidth={2.2}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {/* V_out trace (amber) — in-phase, scaled */}
        {traceFrac > 0.001 && (
          <path d={vOutD} fill="none"
                stroke="var(--amber-300)" strokeWidth={2.6}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Cursor */}
        {traceFrac > 0.01 && traceFrac < 0.99 && (
          <line x1={cursorX} y1={G.gy + 6} x2={cursorX} y2={G.gy + G.gh - 6}
                stroke="var(--amber-300)" strokeWidth={1}
                strokeDasharray="2 4" opacity={0.45}/>
        )}

        {/* Trace labels */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.gx + 14} y={midY - ampOut - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">V_out</text>
          <text x={G.gx + 14} y={midY + amp + 22}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">V_in</text>
        </SvgFadeIn>

        {/* Gain readout */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.vbW / 2} y={G.captionY - 50} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            gain = 1 + R<tspan baselineShift="sub" fontSize={13}>f</tspan> / R<tspan baselineShift="sub" fontSize={13}>1</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            in phase, scaled by 1 + R_f / R_1
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
