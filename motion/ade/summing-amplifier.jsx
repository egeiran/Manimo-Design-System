// Summing Amplifier: Add Voltages at the Virtual Ground — Manimo lesson scene.
// Three input voltages each drive a separate input resistor; all three meet
// at the V− pin of the inverting op-amp, which the feedback loop holds at
// ground. KCL at that node: V1/R1 + V2/R2 + V3/R3 = −V_out/R_f, so
// V_out = −R_f·(V1/R1 + V2/R2 + V3/R3). Genuine motion lives in Beat 3
// (three streams of charge dots flow through R1/R2/R3 and converge at V−,
// then continue as a single stream through R_f) and Beat 5 (three small
// scope traces produce a live combined V_out trace).
//
// Beats (timed to single-track narration in motion/ade/audio/summing-amplifier/):
//    0.00– 5.00  Manimo intro + hook caption
//    5.00–16.00  Configuration — op-amp triangle, three R_in's, R_f
//   16.00–30.00  KCL — three input currents converge, one flows out through R_f
//   30.00–40.00  Formula — V_out = −R_f·(V1/R1 + V2/R2 + V3/R3)
//   40.00–48.00  Mixer scope — three sinusoidal inputs + summed inverted output
//
// Authoring notes:
//   • SvgFadeIn inside <svg>; FadeUp for HTML/DOM.
//   • Shared circuit geometry helper lets all three diagram beats reuse it.

const SCENE_DURATION = 53;

const NARRATION = [
  /*  0.00– 5.00 */ "How do you add three voltages with one op-amp? It's easier than you think.",
  /*  5.00–16.00 */ "Take the inverting op-amp and replace the single input resistor with three. Each input V k drives the same V minus node through its own R k. R f closes the feedback loop.",
  /* 16.00–30.00 */ "V minus is held at zero by the feedback. So each input contributes its own current — V k over R k — and they all converge at the same node. Their sum then flows through R f to V out.",
  /* 30.00–40.00 */ "Kirchhoff's current law at V minus gives the punchline: V out equals minus R f times the sum of V k over R k. Each input is scaled by its own ratio.",
  /* 40.00–48.00 */ "Feed in three sinewaves at different frequencies and the output traces their sum, inverted and scaled. That's an analog audio mixer in one chip.",
];

const NARRATION_AUDIO = 'audio/summing-amplifier/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="Summing Amplifier: Add Voltages at the Virtual Ground"
      duration={SCENE_DURATION}
      introEnd={4.47}
      introCaption="Three voltages in, one weighted sum out."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.47} end={17}>
        <ConfigBeat />
      </Sprite>

      <Sprite start={17} end={30.57}>
        <CurrentsBeat />
      </Sprite>

      <Sprite start={30.57} end={42.31}>
        <FormulaBeat />
      </Sprite>

      <Sprite start={42.31} end={SCENE_DURATION}>
        <MixerBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared schematic geometry ──────────────────────────────────────────
// Op-amp triangle on the right, three input resistors stacked on the left,
// each running horizontally into the V_minus node. R_f loops above.
function circuitGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 640,
        ampCx: 380, ampCy: 380, ampW: 130,
        rInLeftX: 70, rInRightX: 210,
        rInY: [220, 320, 420],
        vMinusNodeX: 290,
        rfY: 110, rfX1: 290, rfX2: 440,
        vOutNodeX: 440,
        gndX: 290, gndY: 510,
        captionY: 600, fontFormula: 22 }
    : { vbW: 1100, vbH: 520,
        ampCx: 700, ampCy: 280, ampW: 160,
        rInLeftX: 130, rInRightX: 310,
        rInY: [160, 240, 320],
        vMinusNodeX: 440,
        rfY: 90, rfX1: 440, rfX2: 800,
        vOutNodeX: 800,
        gndX: 440, gndY: 420,
        captionY: 500, fontFormula: 26 };
}

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

// Render the full schematic. Currents on/off via the boolean.
function CircuitDiagram({ G, beatDelay = 0, accent = false }) {
  const ampLeftX = G.ampCx - G.ampW / 2;
  const ampRightX = G.ampCx + G.ampW / 2;
  const ampH = G.ampW * 0.95;
  const inputMinusYAtAmp = G.ampCy - ampH * 0.32;
  const inputPlusYAtAmp = G.ampCy + ampH * 0.32;
  const labels = ['V₁', 'V₂', 'V₃'];
  const rLabels = ['R₁', 'R₂', 'R₃'];

  return (
    <g>
      {/* Op-amp triangle */}
      <SvgFadeIn duration={0.5} delay={beatDelay + 0.0}>
        <OpAmpShape cx={G.ampCx} cy={G.ampCy} w={G.ampW}/>
      </SvgFadeIn>

      {/* Three input branches: V_k source → R_k → V_minus node */}
      {G.rInY.map((y, k) => (
        <g key={k}>
          <SvgFadeIn duration={0.4} delay={beatDelay + 0.6 + k * 0.25}>
            <circle cx={G.rInLeftX} cy={y} r={3.5} fill="var(--chalk-200)"/>
            <text x={G.rInLeftX - 14} y={y + 6} textAnchor="end"
                  fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={18}>{labels[k]}</text>
          </SvgFadeIn>
          <TraceIn d={resistorHorizontalD(G.rInLeftX, G.rInRightX, y)}
                   stroke="var(--amber-400)" strokeWidth={2.2}
                   duration={0.5} delay={beatDelay + 0.8 + k * 0.25}/>
          <SvgFadeIn duration={0.35} delay={beatDelay + 1.2 + k * 0.25}>
            <text x={(G.rInLeftX + G.rInRightX) / 2} y={y - 14} textAnchor="middle"
                  fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>{rLabels[k]}</text>
          </SvgFadeIn>
          {/* Wire from R_k end to V_minus node */}
          <TraceIn d={`M ${G.rInRightX} ${y} L ${G.vMinusNodeX} ${y} L ${G.vMinusNodeX} ${inputMinusYAtAmp}`}
                   stroke="var(--chalk-200)" strokeWidth={2}
                   duration={0.5} delay={beatDelay + 1.0 + k * 0.25}/>
        </g>
      ))}

      {/* Final stub from V_minus node to op-amp V− pin (left side) */}
      <TraceIn d={`M ${G.vMinusNodeX} ${inputMinusYAtAmp} L ${ampLeftX} ${inputMinusYAtAmp}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 2.0}/>

      {/* V_minus node dot + label */}
      <SvgFadeIn duration={0.3} delay={beatDelay + 2.2}>
        <circle cx={G.vMinusNodeX} cy={inputMinusYAtAmp} r={3.5}
                fill={accent ? 'var(--amber-300)' : 'var(--chalk-100)'}/>
        <text x={G.vMinusNodeX + 10} y={inputMinusYAtAmp - 8}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>
          V<tspan baselineShift="sub" fontSize={10}>−</tspan>
        </text>
      </SvgFadeIn>

      {/* R_f feedback path: V_minus node → up → across → down → V_out */}
      <TraceIn d={`M ${G.vMinusNodeX} ${inputMinusYAtAmp} L ${G.vMinusNodeX} ${G.rfY} L ${G.rfX1 + 10} ${G.rfY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 2.4}/>
      <TraceIn d={resistorHorizontalD(G.rfX1 + 10, G.rfX2 - 10, G.rfY)}
               stroke="var(--rose-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 2.5}/>
      <TraceIn d={`M ${G.rfX2 - 10} ${G.rfY} L ${G.vOutNodeX} ${G.rfY} L ${G.vOutNodeX} ${G.ampCy}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 2.6}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 3.0}>
        <text x={(G.rfX1 + G.rfX2) / 2} y={G.rfY - 16} textAnchor="middle"
              fill="var(--rose-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>
          R<tspan baselineShift="sub" fontSize={11}>f</tspan>
        </text>
      </SvgFadeIn>

      {/* Output wire to V_out label */}
      <TraceIn d={`M ${ampRightX} ${G.ampCy} L ${G.vOutNodeX} ${G.ampCy}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 3.0}/>
      <SvgFadeIn duration={0.4} delay={beatDelay + 3.4}>
        <circle cx={G.vOutNodeX} cy={G.ampCy} r={3.5} fill="var(--chalk-100)"/>
        <text x={G.vOutNodeX + 12} y={G.ampCy + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>
          V<tspan baselineShift="sub" fontSize={12}>out</tspan>
        </text>
      </SvgFadeIn>

      {/* V+ pin → ground */}
      <TraceIn d={`M ${ampLeftX} ${inputPlusYAtAmp} L ${G.gndX} ${inputPlusYAtAmp} L ${G.gndX} ${G.gndY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.5} delay={beatDelay + 1.0}/>
      <SvgFadeIn duration={0.4} delay={beatDelay + 1.6}>
        <GroundSymbol x={G.gndX} y={G.gndY}/>
      </SvgFadeIn>
    </g>
  );
}

// ─── Beat 2: Configuration ───────────────────────────────────────────────
function ConfigBeat() {
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

        <SvgFadeIn duration={0.4} delay={5.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            three branches share one virtual-ground node
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Currents — three streams in, one stream out ─────────────────
// Genuine motion: each R_k carries a stream of dots, all converging at V−;
// the combined stream then flows through R_f to V_out.
function CurrentsBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = circuitGeometry(portrait);

  const NUM_PER_BRANCH = 5;
  const phase = Math.max(0, localTime - 0.6) / 2.4;

  // Input dots along each R_k segment (horizontal).
  const inputDots = [];
  G.rInY.forEach((y, k) => {
    const rLen = G.rInRightX - G.rInLeftX;
    // Stagger frequencies a touch so the three streams look independent.
    const speed = 1.0 + 0.15 * k;
    for (let i = 0; i < NUM_PER_BRANCH; i++) {
      const u = ((phase * speed + i / NUM_PER_BRANCH) % 1);
      inputDots.push({ x: G.rInLeftX + u * rLen, y, color: 'var(--amber-400)' });
    }
  });

  // Feedback dots along the R_f resistor (horizontal at y = rfY) — direction
  // is from V_minus node end (rfX1+10) toward V_out end (rfX2−10).
  const fbLen = (G.rfX2 - 10) - (G.rfX1 + 10);
  const fbDots = [];
  const NUM_FB = 7;
  for (let i = 0; i < NUM_FB; i++) {
    const u = ((phase * 1.1 + i / NUM_FB) % 1);
    fbDots.push({ x: (G.rfX1 + 10) + u * fbLen, y: G.rfY });
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G} accent/>

        {/* Input branch dots */}
        {localTime > 0.4 && inputDots.map((d, i) => (
          <circle key={`in${i}`} cx={d.x} cy={d.y} r={3}
                  fill={d.color} opacity={0.95}/>
        ))}
        {/* Feedback dots */}
        {localTime > 0.4 && fbDots.map((d, i) => (
          <circle key={`fb${i}`} cx={d.x} cy={d.y} r={3}
                  fill="var(--rose-300)" opacity={0.95}/>
        ))}

        {/* i_k labels — at the right end of each input resistor */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          {G.rInY.map((y, k) => (
            <text key={k} x={G.rInRightX + 10} y={y - 8}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.08em">
              i{['₁','₂','₃'][k]} →
            </text>
          ))}
        </SvgFadeIn>

        {/* i_k formula */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <text x={portrait ? G.vbW / 2 - 130 : G.rInLeftX - 20}
                y={portrait ? G.captionY - 36 : G.rInY[0] - 28}
                textAnchor={portrait ? 'middle' : 'end'}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            i<tspan baselineShift="sub" fontSize={11}>k</tspan> = V<tspan baselineShift="sub" fontSize={11}>k</tspan> / R<tspan baselineShift="sub" fontSize={11}>k</tspan>
          </text>
        </SvgFadeIn>

        {/* i_f arrow + label */}
        <SvgFadeIn duration={0.4} delay={5.2}>
          <text x={(G.rfX1 + G.rfX2) / 2} y={G.rfY + 26} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">i_f →</text>
        </SvgFadeIn>

        {/* KCL line */}
        <SvgFadeIn duration={0.4} delay={6.8}>
          <text x={G.vbW / 2} y={G.captionY - 28} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 22}>
            i₁ + i₂ + i₃ = −i<tspan baselineShift="sub" fontSize={12}>f</tspan>
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={9.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            three input currents converge → one current through R_f
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Formula payoff ─────────────────────────────────────────────
function FormulaBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 30, textAlign: 'center',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        KCL at V<sub>−</sub> = 0
      </FadeUp>

      <FadeUp duration={0.6} delay={0.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 38, color: 'var(--amber-300)',
          letterSpacing: '0.02em', lineHeight: 1.25,
          maxWidth: portrait ? '24ch' : 'none',
        }}>
        V<sub>out</sub> = −R<sub>f</sub> · (V₁/R₁ + V₂/R₂ + V₃/R₃)
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '46ch', lineHeight: 1.4,
        }}>
        if R₁ = R₂ = R₃ = R, it's just a (scaled) inverted sum
      </FadeUp>

      <FadeUp duration={0.6} delay={3.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 30, color: 'var(--rose-300)',
          letterSpacing: '0.02em',
        }}>
        V<sub>out</sub> = −(R<sub>f</sub>/R)·(V₁ + V₂ + V₃)
      </FadeUp>

      <FadeUp duration={0.5} delay={5.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.1em',
          marginTop: 6, maxWidth: portrait ? '32ch' : 'none',
        }}>
        each input contributes independently — pure linearity
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Mixer scopes — three inputs + summed inverted output ───────
function MixerBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720,
        // Three small input scopes stacked at the top
        smX: 80, smW: 200, smY: [120, 220, 320], smH: 60,
        // One big output scope at the bottom
        bigX: 80, bigY: 440, bigW: 460, bigH: 180,
        captionY: 680, fontFormula: 22 }
    : { vbW: 1100, vbH: 460,
        smX: 100, smW: 280, smY: [70, 170, 270], smH: 70,
        bigX: 460, bigY: 90, bigW: 580, bigH: 280,
        captionY: 440, fontFormula: 24 };

  const TRACE_START = 0.6;
  const TRACE_DUR = Math.max(spriteDur - TRACE_START - 1.2, 1);
  const traceFrac = clamp((localTime - TRACE_START) / TRACE_DUR, 0, 1);

  // Three input frequencies (cycles across the trace) and amplitudes.
  // Sum is small enough that scaled output (×1.5) stays within the bigH.
  const cycles = [1.5, 3, 4.5];
  const amps = [0.7, 0.5, 0.4];
  const gain = 1.5;

  function vSum(t) {
    // t is in [0..1] of trace duration
    let s = 0;
    for (let i = 0; i < 3; i++) {
      s += amps[i] * Math.sin(2 * Math.PI * cycles[i] * t);
    }
    return s; // worst-case ≈ 1.6
  }

  function buildSmallTrace(idx) {
    const samples = Math.max(2, Math.floor(traceFrac * 120));
    const midY = G.smY[idx] + G.smH / 2;
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = samples > 0 ? i / samples : 0;
      const sweepFrac = u * traceFrac;
      const x = G.smX + sweepFrac * G.smW;
      const y = midY - amps[idx] * (G.smH * 0.4) *
                Math.sin(2 * Math.PI * cycles[idx] * sweepFrac);
      pts.push((i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }

  function buildBigTrace() {
    const samples = Math.max(2, Math.floor(traceFrac * 240));
    const midY = G.bigY + G.bigH / 2;
    const yScale = G.bigH * 0.22;  // 0.22 × bigH ≈ keeps |1.6 × 1.5| inside.
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = samples > 0 ? i / samples : 0;
      const sweepFrac = u * traceFrac;
      const x = G.bigX + sweepFrac * G.bigW;
      // Inverted (negative sign)
      const y = midY + gain * yScale * vSum(sweepFrac);
      pts.push((i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }

  const smallTraces = [0, 1, 2].map(buildSmallTrace);
  const bigD = buildBigTrace();

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Three small input scopes with midlines */}
        {[0, 1, 2].map((idx) => {
          const midY = G.smY[idx] + G.smH / 2;
          return (
            <g key={idx}>
              <TraceIn d={`M ${G.smX} ${midY} L ${G.smX + G.smW} ${midY}`}
                       stroke="var(--chalk-300)" strokeWidth={1}
                       duration={0.4} delay={0.0 + idx * 0.1}/>
              <SvgFadeIn duration={0.3} delay={0.3 + idx * 0.1}>
                <text x={G.smX - 8} y={midY + 4} textAnchor="end"
                      fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                      fontSize={12} letterSpacing="0.08em">
                  V{['₁','₂','₃'][idx]}
                </text>
              </SvgFadeIn>
              {traceFrac > 0.001 && (
                <path d={smallTraces[idx]} fill="none"
                      stroke="var(--chalk-100)" strokeWidth={1.8}
                      strokeLinecap="round" strokeLinejoin="round"/>
              )}
            </g>
          );
        })}

        {/* Big output scope */}
        <TraceIn d={`M ${G.bigX} ${G.bigY + G.bigH / 2} L ${G.bigX + G.bigW} ${G.bigY + G.bigH / 2}`}
                 stroke="var(--chalk-300)" strokeWidth={1.2}
                 duration={0.5} delay={0.2}/>
        <TraceIn d={`M ${G.bigX} ${G.bigY} L ${G.bigX} ${G.bigY + G.bigH}`}
                 stroke="var(--chalk-200)" strokeWidth={1.4}
                 duration={0.5} delay={0.0}/>
        <SvgFadeIn duration={0.4} delay={0.5}>
          <text x={G.bigX - 10} y={G.bigY + G.bigH / 2 + 4} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.1em">V_out</text>
        </SvgFadeIn>
        {traceFrac > 0.001 && (
          <path d={bigD} fill="none"
                stroke="var(--amber-300)" strokeWidth={2.6}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Sweep cursor on output */}
        {traceFrac > 0.01 && traceFrac < 0.99 && (
          <line x1={G.bigX + traceFrac * G.bigW} y1={G.bigY + 6}
                x2={G.bigX + traceFrac * G.bigW} y2={G.bigY + G.bigH - 6}
                stroke="var(--amber-300)" strokeWidth={1}
                strokeDasharray="2 4" opacity={0.45}/>
        )}

        {/* Arrow from the small scopes to the big one */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          {portrait ? (
            <g>
              <line x1={G.vbW / 2} y1={G.smY[2] + G.smH + 20}
                    x2={G.vbW / 2} y2={G.bigY - 14}
                    stroke="var(--chalk-300)" strokeWidth={1.4}/>
              <path d={`M ${G.vbW / 2} ${G.bigY - 8}
                        l -6 -10 l 12 0 z`}
                    fill="var(--chalk-300)"/>
            </g>
          ) : (
            <g>
              <line x1={G.smX + G.smW + 16} y1={G.smY[1] + G.smH / 2}
                    x2={G.bigX - 14} y2={G.bigY + G.bigH / 2}
                    stroke="var(--chalk-300)" strokeWidth={1.4}/>
              <path d={`M ${G.bigX - 8} ${G.bigY + G.bigH / 2}
                        l -10 -6 l 0 12 z`}
                    fill="var(--chalk-300)"/>
            </g>
          )}
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            one chip — an inverting analog mixer
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
