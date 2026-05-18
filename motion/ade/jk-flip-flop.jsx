// JK Flip-Flop: The SR Latch With a Useful Fourth Row — Manimo lesson scene.
//
// The JK flip-flop fixes the SR latch's forbidden state by making J=K=1 a
// TOGGLE instead — Q flips on each rising clock edge. Genuine motion lives
// in Beat 4 (`ToggleWaveformBeat`): a time cursor sweeps left-to-right
// across a three-row timing diagram, and as it crosses each rising clock
// edge a sample pulse fires and the amber Q trace inverts — producing a
// clean half-frequency square wave that visibly "comes out" of the cell.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js):
//    0.00– 5.00  Manimo enters; hook caption
//    5.00–14.00  Symbol — J, K, CLK inputs and Q, Q-bar outputs
//   14.00–23.00  Truth table — four modes (hold / reset / set / toggle)
//   23.00–35.00  Toggle waveform — Q toggles each edge, divide-by-2 emerges
//   35.00–40.00  Takeaway — chain N stages for an N-bit ripple counter
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 4 uses useSprite() localTime so cursor + Q trace stay aligned.

const SCENE_DURATION = 53;

const NARRATION = [
  /*  0.00– 7.62 */ 'The S R latch has one forbidden row. What if you turned that forbidden row into the most useful row in digital design?',
  /*  7.62–19.13 */ "Here's the JK flip-flop — three inputs J, K, and CLK, two outputs Q and Q-bar. The triangle on the clock input means it samples on the rising edge.",
  /* 19.13–32.38 */ 'Four operating modes — hold when J equals zero and K equals zero, reset when J is zero and K is one, set when J is one and K is zero, and toggle when both J and K are one.',
  /* 32.38–44.59 */ "Hold J and K both at one. Now every rising clock edge flips Q — and Q comes out as a clean square wave at exactly half the clock frequency. That's a one bit binary counter.",
  /* 44.59–53.00 */ 'Chain N of them and each stage divides by two — N J K flip-flops give you an N bit ripple counter.',
];

const NARRATION_AUDIO = 'audio/jk-flip-flop/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="memory and register"
      title="JK Flip-Flop: The SR Latch With a Useful Fourth Row"
      duration={SCENE_DURATION}
      introEnd={7.62}
      introCaption="Turn the SR latch's forbidden row into a feature."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.62} end={19.13}>
        <SymbolBeat />
      </Sprite>

      <Sprite start={19.13} end={32.38}>
        <TruthTableBeat />
      </Sprite>

      <Sprite start={32.38} end={44.59}>
        <ToggleWaveformBeat />
      </Sprite>

      <Sprite start={44.59} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared signal helpers ──────────────────────────────────────────────
// Use unit time (one CLK period = 1.0). Four full cycles displayed.
const CYCLES = 4;
const TOTAL_T = CYCLES;
const CLK_RISING = [0.5, 1.5, 2.5, 3.5];
function clkAt(t) {
  return ((t % 1) >= 0.5) ? 1 : 0;
}
// Q with J=K=1 toggle mode: flips at each rising edge; starts at 0.
function qToggleAt(t) {
  let q = 0;
  for (const edge of CLK_RISING) {
    if (edge <= t) q = 1 - q; else break;
  }
  return q;
}

function signalToD(fn, x0, yHigh, yLow, width, samples = 480) {
  let prevV = fn(0);
  const pts = [`M ${x0} ${prevV ? yHigh : yLow}`];
  const dxPer = width / TOTAL_T;
  for (let i = 1; i <= samples; i++) {
    const t = (i / samples) * TOTAL_T;
    const v = fn(t);
    if (v !== prevV) {
      const x = x0 + t * dxPer;
      pts.push(`L ${x.toFixed(2)} ${prevV ? yHigh : yLow}`);
      pts.push(`L ${x.toFixed(2)} ${v ? yHigh : yLow}`);
      prevV = v;
    }
  }
  pts.push(`L ${x0 + width} ${prevV ? yHigh : yLow}`);
  return pts.join(' ');
}

// ─── Beat 2: Symbol — J, K, CLK in; Q, Q-bar out ────────────────────────
function SymbolBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 500, boxX: 200, boxY: 120, boxW: 200, boxH: 260,
        pinLen: 60, fontMain: 28, fontPin: 22, captionY: 460 }
    : { vbW: 760, vbH: 400, boxX: 280, boxY: 60, boxW: 200, boxH: 280,
        pinLen: 70, fontMain: 28, fontPin: 22, captionY: 380 };

  // Pin positions
  const jPinY = G.boxY + G.boxH * 0.18;
  const clkPinY = G.boxY + G.boxH * 0.5;
  const kPinY = G.boxY + G.boxH * 0.82;
  const qPinY = G.boxY + G.boxH * 0.28;
  const qBarPinY = G.boxY + G.boxH * 0.72;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Body */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <rect x={G.boxX} y={G.boxY} width={G.boxW} height={G.boxH}
                rx={6} ry={6}
                fill="none" stroke="var(--amber-400)" strokeWidth={2.4}/>
        </SvgFadeIn>

        {/* J input pin + label */}
        <TraceIn d={`M ${G.boxX - G.pinLen} ${jPinY} L ${G.boxX} ${jPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={0.6}/>
        <SvgFadeIn duration={0.35} delay={0.6}>
          <text x={G.boxX + 14} y={jPinY + 8}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>J</text>
          <text x={G.boxX - G.pinLen - 8} y={jPinY + 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">J</text>
        </SvgFadeIn>

        {/* K input pin + label */}
        <TraceIn d={`M ${G.boxX - G.pinLen} ${kPinY} L ${G.boxX} ${kPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={0.8}/>
        <SvgFadeIn duration={0.35} delay={0.8}>
          <text x={G.boxX + 14} y={kPinY + 8}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>K</text>
          <text x={G.boxX - G.pinLen - 8} y={kPinY + 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">K</text>
        </SvgFadeIn>

        {/* CLK input + edge-trigger triangle */}
        <TraceIn d={`M ${G.boxX - G.pinLen} ${clkPinY} L ${G.boxX} ${clkPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.0}/>
        <SvgFadeIn duration={0.4} delay={1.0}>
          <polygon
            points={`${G.boxX + 4} ${clkPinY - 9},${G.boxX + 4} ${clkPinY + 9},${G.boxX + 18} ${clkPinY}`}
            fill="none" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.boxX - G.pinLen - 8} y={clkPinY + 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">CLK</text>
        </SvgFadeIn>

        {/* Q output */}
        <TraceIn d={`M ${G.boxX + G.boxW} ${qPinY} L ${G.boxX + G.boxW + G.pinLen} ${qPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.4}/>
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={G.boxX + G.boxW - 14} y={qPinY + 8}
                textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>Q</text>
          <text x={G.boxX + G.boxW + G.pinLen + 8} y={qPinY + 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">Q</text>
        </SvgFadeIn>

        {/* Q-bar output (with overline-style bar) */}
        <TraceIn d={`M ${G.boxX + G.boxW} ${qBarPinY} L ${G.boxX + G.boxW + G.pinLen} ${qBarPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.5}/>
        <SvgFadeIn duration={0.35} delay={1.5}>
          {/* Q with overbar inside the box */}
          <g>
            <text x={G.boxX + G.boxW - 14} y={qBarPinY + 8}
                  textAnchor="end"
                  fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.fontPin}>Q</text>
            <line x1={G.boxX + G.boxW - 30} y1={qBarPinY - 14}
                  x2={G.boxX + G.boxW - 14} y2={qBarPinY - 14}
                  stroke="var(--chalk-100)" strokeWidth={1.5}/>
          </g>
          <text x={G.boxX + G.boxW + G.pinLen + 8} y={qBarPinY + 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">Q'</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            three inputs, two outputs, one edge-triggered cell
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Truth table — four operating modes ─────────────────────────
function TruthTableBeat() {
  const portrait = usePortrait();
  const headerStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 12,
    color: 'var(--amber-300)', letterSpacing: '0.16em',
    textTransform: 'uppercase',
  };
  const rowJK = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 28,
    color: 'var(--chalk-100)', letterSpacing: '0.16em',
  };
  const rowOut = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 22 : 28,
    letterSpacing: '0.02em',
  };
  const rowMode = {
    fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
    color: 'var(--chalk-300)', letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };

  function Row({ jk, out, mode, delay, accent }) {
    return (
      <FadeUp duration={0.5} delay={delay} distance={10}
        style={{
          display: 'grid',
          gridTemplateColumns: portrait ? '80px 110px 1fr' : '100px 140px 1fr',
          alignItems: 'center', gap: portrait ? 14 : 28,
        }}>
        <div style={rowJK}>{jk}</div>
        <div style={{ ...rowOut, color: accent ? 'var(--rose-300)' : 'var(--chalk-100)' }}>
          {out}
        </div>
        <div style={{ ...rowMode, color: accent ? 'var(--rose-300)' : 'var(--chalk-300)' }}>
          {mode}
        </div>
      </FadeUp>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 14 : 18,
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={8}
        style={{
          display: 'grid',
          gridTemplateColumns: portrait ? '80px 110px 1fr' : '100px 140px 1fr',
          gap: portrait ? 14 : 28,
        }}>
        <div style={headerStyle}>J K</div>
        <div style={headerStyle}>Q<sub style={{ fontSize: '70%' }}>next</sub></div>
        <div style={headerStyle}>mode</div>
      </FadeUp>

      <div style={{ width: portrait ? 320 : 520, height: 1,
                    background: 'rgba(232,220,193,0.18)' }}/>

      <Row jk="0 0" out="Q"   mode="hold"   delay={0.8}/>
      <Row jk="0 1" out="0"   mode="reset"  delay={1.6}/>
      <Row jk="1 0" out="1"   mode="set"    delay={2.4}/>
      <Row jk="1 1" out="!Q"  mode="toggle" delay={3.2} accent/>

      <FadeUp duration={0.5} delay={4.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 16 : 18, color: 'var(--rose-300)',
          textAlign: 'center', maxWidth: portrait ? '26ch' : '40ch',
          lineHeight: 1.35, marginTop: 8,
        }}>
        the toggle row is what SR could never have
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Toggle waveform — Q halves the clock frequency ─────────────
function ToggleWaveformBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 760, panelX: 80, panelW: 460,
        clkY: 100, clkH: 100, jkY: 280, jkH: 100, qY: 460, qH: 130,
        captionY: 700, fontEyebrow: 10 }
    : { vbW: 1100, vbH: 480, panelX: 130, panelW: 840,
        clkY: 50, clkH: 90, jkY: 200, jkH: 80, qY: 340, qH: 110,
        captionY: 460, fontEyebrow: 11 };

  const clkHigh = G.clkY + 12, clkLow = G.clkY + G.clkH - 12;
  const jkHigh = G.jkY + 12, jkLow = G.jkY + G.jkH - 12;
  const qHigh = G.qY + 14, qLow = G.qY + G.qH - 14;

  // Sweep timing — cursor goes from t=0 to t=TOTAL_T across the beat.
  const HOLD = 1.0;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 2.0, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);
  const cursorTime = traceFrac * TOTAL_T;
  const cursorX = G.panelX + traceFrac * G.panelW;

  // Full pre-computed signal paths.
  const clkD = signalToD(clkAt, G.panelX, clkHigh, clkLow, G.panelW);
  const qD = signalToD(qToggleAt, G.panelX, qHigh, qLow, G.panelW);

  // Pulse alpha at each rising edge — fires as cursor crosses, fades after.
  function pulseAlpha(edge) {
    const x = G.panelX + (edge / TOTAL_T) * G.panelW;
    const dxFrac = (cursorX - x) / G.panelW;
    if (dxFrac < -0.005) return 0;
    if (dxFrac > 0.12) return 0;
    if (dxFrac < 0.02) return clamp((dxFrac + 0.005) / 0.025, 0, 1);
    return clamp(1 - (dxFrac - 0.02) / 0.1, 0, 1);
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Row labels */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.clkY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">CLK</text>
          <text x={G.panelX} y={G.jkY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">J = K = 1</text>
          <text x={G.panelX} y={G.qY - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">Q</text>
        </SvgFadeIn>

        {/* Baselines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {[clkLow, jkLow, qLow].map((y, i) => (
            <line key={i} x1={G.panelX} y1={y}
                  x2={G.panelX + G.panelW} y2={y}
                  stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                  strokeDasharray="3 3"/>
          ))}
        </SvgFadeIn>

        {/* CLK trace — left-to-right draw-in (TraceIn handles it) */}
        <TraceIn d={clkD}
          stroke="var(--chalk-100)" strokeWidth={2.4}
          duration={Math.max(TRACE_DUR, 1)} delay={HOLD}
          pathLength={1000} ease={Easing.linear}/>

        {/* J=K=1 constant flat-high trace */}
        <TraceIn d={`M ${G.panelX} ${jkHigh} L ${G.panelX + G.panelW} ${jkHigh}`}
          stroke="var(--chalk-200)" strokeWidth={2.4}
          duration={Math.max(TRACE_DUR, 1)} delay={HOLD}
          pathLength={1000} ease={Easing.linear}/>

        {/* Q trace — toggles on each edge, draws in sync with cursor */}
        <TraceIn d={qD}
          stroke="var(--amber-300)" strokeWidth={2.6}
          duration={Math.max(TRACE_DUR, 1)} delay={HOLD}
          pathLength={1000} ease={Easing.linear}/>

        {/* Sample pulses on each rising edge */}
        {CLK_RISING.map((edge, i) => {
          const a = pulseAlpha(edge);
          if (a <= 0) return null;
          const x = G.panelX + (edge / TOTAL_T) * G.panelW;
          return (
            <g key={i} opacity={a}>
              <circle cx={x} cy={clkHigh} r={6}
                      fill="var(--amber-400)" opacity={0.95}/>
              <circle cx={x} cy={clkHigh} r={14}
                      fill="none" stroke="var(--amber-400)" strokeWidth={1.5}
                      opacity={0.5}/>
              <line x1={x} y1={clkHigh} x2={x} y2={qHigh}
                    stroke="var(--amber-300)" strokeWidth={1.4}
                    strokeDasharray="3 4" opacity={0.85}/>
            </g>
          );
        })}

        {/* Time cursor */}
        {traceFrac > 0.005 && traceFrac < 0.995 && (
          <line x1={cursorX} y1={G.clkY - 6} x2={cursorX} y2={G.qY + G.qH + 6}
                stroke="var(--amber-300)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.55}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={9.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            Q frequency = CLK frequency / 2
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
          fontSize: portrait ? 26 : 32, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch', lineHeight: 1.3,
        }}>
        Toggle mode divides the clock by two.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26, color: 'var(--amber-300)',
          maxWidth: portrait ? '24ch' : '36ch', lineHeight: 1.3,
        }}>
        Chain N stages → N-bit ripple counter.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 8, maxWidth: portrait ? '34ch' : 'none',
          textTransform: 'uppercase',
        }}>
        the heart of every binary counter
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ───────────────────────────────────────────────────────────────
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
