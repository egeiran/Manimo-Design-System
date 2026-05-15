// D Flip-Flop: One Bit of Memory at the Clock Edge — Manimo lesson scene.
// Edge-triggered storage: Q := D at every rising edge of CLK. Genuine
// animation lives in Beat 4: a time cursor sweeps left to right across
// the timing diagram, and a "sample" pulse fires every time the cursor
// crosses a rising clock edge — Q steps to whatever D happens to be at
// that moment.
//
// Beats (timed to single-track narration in motion/ade/audio/d-flip-flop/):
//    0.00– 5.64  Manimo intro: a flip-flop remembers one bit, but when?
//    5.64–14.87  Symbol: D in, CLK in (edge-triggered triangle), Q out
//   14.87–20.79  Setup: clock toggles steadily, data wanders independently
//   20.79–30.01  Sampling: time cursor sweeps; Q latches D on each rising CLK edge
//   30.01–38.00  Takeaway: Q := D on the rising edge — every register's cell
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • CLK rising edges and the D pattern live in module-scope constants
//     so the setup beat and the sampling beat stay consistent.
//   • Beat 4's cursor reads useSprite() localTime so the on-screen
//     sampling pulses are exactly aligned with the traced Q signal.

const SCENE_DURATION = 35;

const NARRATION = [
  /*  0.00– 5.64 */ "A flip-flop remembers one bit — but only on command. What makes it latch?",
  /*  5.64–14.87 */ "Here's a D flip-flop — data in, clock in, and Q out. The triangle on the clock input means it's edge triggered.",
  /* 14.87–20.79 */ "Set up a clock signal toggling steadily, and a data signal moving in its own rhythm.",
  /* 20.79–30.01 */ "On every rising edge of the clock, Q samples whatever D is right then. Between edges, D can dance around freely and Q ignores it.",
  /* 30.01–38.00 */ "Q catches D on the rising edge — that one bit of memory is the cell behind every register and counter.",
];

const NARRATION_AUDIO = 'audio/d-flip-flop/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="sequential logic"
      title="D Flip-Flop: One Bit of Memory at the Clock Edge"
      duration={SCENE_DURATION}
      introEnd={5.31}
      introCaption="One bit of memory — but when does it remember?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.31} end={13.04}>
        <SymbolBeat />
      </Sprite>

      <Sprite start={13.04} end={18.23}>
        <SetupBeat />
      </Sprite>

      <Sprite start={18.23} end={27.13}>
        <SamplingBeat />
      </Sprite>

      <Sprite start={27.13} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared signal definition ────────────────────────────────────────────
// Use unit time (one CLK period = 1.0). Four full cycles displayed
// → rising edges at t = 0.5, 1.5, 2.5, 3.5 (clock is low for t < 0.5).
const CYCLES = 4;
const TOTAL_T = CYCLES;                          // 0..4
const CLK_RISING = [0.5, 1.5, 2.5, 3.5];
// Data pattern: 16 timed transitions across [0, 4]. Picked so that
// adjacent rising edges sample different D values most of the time, and
// also so the trace shows D changing both between and very close to
// edges — the whole point of the scene.
// Picked so that Q steps every clock edge — values sampled at the four
// rising edges (t = 0.5, 1.5, 2.5, 3.5) are 1, 0, 1, 0 — Q toggles 0→1→0→1→0
// across the four edges. Between edges D also wanders so the viewer sees
// changes that DON'T propagate to Q.
const D_EVENTS = [
  { t: 0.00, v: 0 },
  { t: 0.30, v: 1 },   // D(0.5) = 1  → first edge: Q := 1
  { t: 0.85, v: 0 },
  { t: 1.10, v: 1 },
  { t: 1.30, v: 0 },   // D(1.5) = 0  → second edge: Q := 0
  { t: 1.95, v: 1 },
  { t: 2.25, v: 0 },
  { t: 2.40, v: 1 },   // D(2.5) = 1  → third edge: Q := 1
  { t: 2.80, v: 0 },
  { t: 3.15, v: 1 },
  { t: 3.35, v: 0 },   // D(3.5) = 0  → fourth edge: Q := 0
  { t: 3.65, v: 1 },
];
function dAt(t) {
  let v = D_EVENTS[0].v;
  for (const ev of D_EVENTS) {
    if (ev.t <= t) v = ev.v; else break;
  }
  return v;
}
function clkAt(t) {
  // Period 1; low for first half, high for second half. Rising edge at t mod 1 == 0.5.
  return ((t % 1) >= 0.5) ? 1 : 0;
}
// Q after the most recent rising edge ≤ t.
function qAt(t) {
  let q = 0;
  for (const edge of CLK_RISING) {
    if (edge <= t) q = dAt(edge); else break;
  }
  return q;
}

// Convert (signal time t, value v) → SVG (x, y). y is high when v=1, low when v=0.
function signalToD(fn, x0, y0high, y0low, width, samples = 480) {
  // Step signal — sample finely, emit polyline with explicit verticals so
  // edges are sharp (no diagonal join between high and low samples).
  const dxPer = width / TOTAL_T;
  let prevV = fn(0);
  let prevX = x0;
  const pts = [`M ${x0} ${prevV ? y0high : y0low}`];
  for (let i = 1; i <= samples; i++) {
    const t = (i / samples) * TOTAL_T;
    const v = fn(t);
    if (v !== prevV) {
      // emit vertical edge at the *transition* time, not the sample time
      // — find it by walking back; for simplicity use the sample time
      // (resolution is fine enough at samples=480).
      const x = x0 + t * dxPer;
      pts.push(`L ${x.toFixed(2)} ${prevV ? y0high : y0low}`);
      pts.push(`L ${x.toFixed(2)} ${v ? y0high : y0low}`);
      prevV = v;
      prevX = x;
    }
  }
  pts.push(`L ${x0 + width} ${prevV ? y0high : y0low}`);
  return pts.join(' ');
}

// ─── Beat 2: Symbol ──────────────────────────────────────────────────────
function SymbolBeat() {
  const portrait = usePortrait();
  // Centred IEEE-style block with three pins. Internal triangle on the
  // CLK input marks edge-triggering.
  const G = portrait
    ? { vbW: 600, vbH: 460, boxX: 180, boxY: 120, boxW: 240, boxH: 220,
        pinLen: 70, fontMain: 28, fontPin: 22, captionY: 430 }
    : { vbW: 700, vbH: 360, boxX: 230, boxY: 80, boxW: 240, boxH: 200,
        pinLen: 70, fontMain: 28, fontPin: 22, captionY: 340 };

  const dPinY = G.boxY + G.boxH * 0.32;
  const clkPinY = G.boxY + G.boxH * 0.72;
  const qPinY = G.boxY + G.boxH * 0.32;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
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

        {/* Input/output stubs */}
        <TraceIn d={`M ${G.boxX - G.pinLen} ${dPinY} L ${G.boxX} ${dPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.0}/>
        <TraceIn d={`M ${G.boxX - G.pinLen} ${clkPinY} L ${G.boxX} ${clkPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.2}/>
        <TraceIn d={`M ${G.boxX + G.boxW} ${qPinY} L ${G.boxX + G.boxW + G.pinLen} ${qPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.0}/>

        {/* D label inside */}
        <SvgFadeIn duration={0.35} delay={0.6}>
          <text x={G.boxX + 14} y={dPinY + 8}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>D</text>
        </SvgFadeIn>

        {/* Q label inside, right-aligned */}
        <SvgFadeIn duration={0.35} delay={0.8}>
          <text x={G.boxX + G.boxW - 14} y={qPinY + 8}
                textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>Q</text>
        </SvgFadeIn>

        {/* Edge-trigger triangle on the CLK pin inside the box */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <polygon
            points={`${G.boxX + 4} ${clkPinY - 9},${G.boxX + 4} ${clkPinY + 9},${G.boxX + 18} ${clkPinY}`}
            fill="none" stroke="var(--amber-300)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* CLK label outside */}
        <SvgFadeIn duration={0.35} delay={1.6}>
          <text x={G.boxX - G.pinLen - 8} y={clkPinY + 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.1em">CLK</text>
          <text x={G.boxX - G.pinLen - 8} y={dPinY + 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.1em">data</text>
          <text x={G.boxX + G.boxW + G.pinLen + 8} y={qPinY + 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.1em">out</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the triangle ▷ marks an edge-triggered input
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Setup — CLK and D timing rows ───────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 540, panelX: 60, panelW: 480,
        clkY: 80, clkH: 80, dY: 240, dH: 80, captionY: 440,
        fontEyebrow: 10, fontTrace: 12 }
    : { vbW: 1000, vbH: 320, panelX: 100, panelW: 800,
        clkY: 60, clkH: 70, dY: 180, dH: 70, captionY: 290,
        fontEyebrow: 11, fontTrace: 13 };

  const clkHigh = G.clkY + 10, clkLow = G.clkY + G.clkH - 10;
  const dHigh = G.dY + 10, dLow = G.dY + G.dH - 10;
  const clkD = signalToD(clkAt, G.panelX, clkHigh, clkLow, G.panelW);
  const dPathD = signalToD(dAt, G.panelX, dHigh, dLow, G.panelW);

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
          <text x={G.panelX} y={G.dY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">D</text>
        </SvgFadeIn>

        {/* Row baselines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.panelX} y1={clkLow} x2={G.panelX + G.panelW} y2={clkLow}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                strokeDasharray="3 3"/>
          <line x1={G.panelX} y1={dLow} x2={G.panelX + G.panelW} y2={dLow}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                strokeDasharray="3 3"/>
        </SvgFadeIn>

        {/* Traces — CLK and D draw in left-to-right */}
        <TraceIn d={clkD}
          stroke="var(--chalk-100)" strokeWidth={2.4}
          duration={4.0} delay={0.8} pathLength={1000}/>
        <TraceIn d={dPathD}
          stroke="var(--chalk-200)" strokeWidth={2.4}
          duration={4.0} delay={0.8} pathLength={1000}/>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the clock ticks. data wanders.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Sampling — Q latches on the rising edge ─────────────────────
function SamplingBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 800, panelX: 60, panelW: 480,
        clkY: 80, clkH: 90, dY: 240, dH: 90, qY: 400, qH: 90,
        captionY: 700, fontEyebrow: 10 }
    : { vbW: 1080, vbH: 460, panelX: 100, panelW: 880,
        clkY: 40, clkH: 80, dY: 180, dH: 80, qY: 320, qH: 80,
        captionY: 430, fontEyebrow: 11 };

  const clkHigh = G.clkY + 10, clkLow = G.clkY + G.clkH - 10;
  const dHigh = G.dY + 10, dLow = G.dY + G.dH - 10;
  const qHigh = G.qY + 10, qLow = G.qY + G.qH - 10;

  // Trace timing.
  const HOLD = 1.0;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 2.0, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);
  const cursorTime = traceFrac * TOTAL_T;
  const cursorX = G.panelX + traceFrac * G.panelW;

  const clkD = signalToD(clkAt, G.panelX, clkHigh, clkLow, G.panelW);
  const dPathD = signalToD(dAt, G.panelX, dHigh, dLow, G.panelW);
  const qPathD = signalToD(qAt, G.panelX, qHigh, qLow, G.panelW);

  // Pulse marks at each rising edge — opacity grows as the cursor arrives,
  // then fades a beat later. This is what makes the "sampling event"
  // legible without a flat fade-in.
  function pulseAlpha(edge) {
    const x = G.panelX + (edge / TOTAL_T) * G.panelW;
    const dxFrac = (cursorX - x) / G.panelW;
    // Visible band: cursor within ~0.06 of TOTAL_T (i.e. 6% of width).
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
          <text x={G.panelX} y={G.dY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">D</text>
          <text x={G.panelX} y={G.qY - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">Q</text>
        </SvgFadeIn>

        {/* Baselines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {[clkLow, dLow, qLow].map((y, i) => (
            <line key={i} x1={G.panelX} y1={y}
                  x2={G.panelX + G.panelW} y2={y}
                  stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                  strokeDasharray="3 3"/>
          ))}
        </SvgFadeIn>

        {/* CLK and D fade in fully at HOLD; Q traces in over the beat */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <path d={clkD} fill="none"
                stroke="var(--chalk-100)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d={dPathD} fill="none"
                stroke="var(--chalk-200)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* Q trace — draws synchronously with the cursor sweep. Linear
            easing keeps the trace tip aligned with the cursor's linear
            sweep; the default easeOutCubic would race ahead. */}
        <TraceIn d={qPathD}
          stroke="var(--amber-300)" strokeWidth={2.6}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}
          ease={Easing.linear}/>

        {/* Sample pulses at each rising edge — fire as the cursor crosses */}
        {CLK_RISING.map((edge, i) => {
          const a = pulseAlpha(edge);
          if (a <= 0) return null;
          const x = G.panelX + (edge / TOTAL_T) * G.panelW;
          const dVal = dAt(edge);
          const dYAtEdge = dVal ? dHigh : dLow;
          return (
            <g key={i} opacity={a}>
              {/* spark on CLK row */}
              <circle cx={x} cy={clkHigh} r={6}
                      fill="var(--amber-400)" opacity={0.95}/>
              <circle cx={x} cy={clkHigh} r={14}
                      fill="none" stroke="var(--amber-400)" strokeWidth={1.5}
                      opacity={0.5}/>
              {/* dashed sample line down to D and Q */}
              <line x1={x} y1={clkHigh} x2={x} y2={qHigh}
                    stroke="var(--amber-300)" strokeWidth={1.4}
                    strokeDasharray="3 4" opacity={0.85}/>
              {/* dot on D's current value at this edge */}
              <circle cx={x} cy={dYAtEdge} r={4} fill="var(--amber-300)"/>
            </g>
          );
        })}

        {/* Time cursor */}
        {traceFrac > 0.01 && traceFrac < 0.99 && (
          <line x1={cursorX} y1={G.clkY - 8}
                x2={cursorX} y2={G.qY + G.qH + 8}
                stroke="var(--amber-300)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.55}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={9.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            Q catches D — but only on the clock's rising edge
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
          fontSize: portrait ? 22 : 38, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        Q := D  on the rising edge of CLK
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        one bit, one edge — line up N of them and you have a register
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        stack registers on a shared clock — synchronous digital logic
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
