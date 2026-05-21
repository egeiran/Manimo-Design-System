// T Flip-Flop: One Input, One Toggle per Edge — Manimo lesson scene.
// Toggle flip-flop — with T held high, Q inverts on every rising clock
// edge. The frequency-divide-by-two building block of every binary
// counter. Genuine motion lives in Beat 4: a cursor walks left to right
// across three timing rows, and a toggle-pulse fires at each rising CLK
// edge — Q steps inverted while the cursor passes.
//
// Beats (placeholder timings — Step 4c rewires from audio manifest):
//    0– 5    Manimo intro: what if a flip-flop just flipped on every tick?
//    5–14    Symbol: T (top), CLK with triangle, Q out
//   14–22    Truth table: T=0 hold, T=1 toggle
//   22–34    Timing: cursor sweeps, Q toggles on each rising CLK edge
//   34–38    Takeaway: divide-by-two → ripple counter
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 4's cursor and pulses read useSprite() localTime so the on-
//     screen toggle pulses are exactly aligned with the traced Q signal.
//   • Geometry branches on usePortrait() — landscape uses a wide single
//     row of scopes; portrait stacks them vertically.

const SCENE_DURATION = 46;

const NARRATION = [
  /*  0– 5  */ "What if a flip-flop had just one rule — flip on every tick?",
  /*  5–14 */ "Here's a T flip-flop. T on top — the toggle enable. Clock on the bottom with the edge-trigger triangle. Q on the output side.",
  /* 14–22 */ "The truth table has two rows. With T at zero, Q stays put. With T at one, Q becomes the inverse of its previous value on every clock edge.",
  /* 22–34 */ "Watch what happens with T held high. Every time the clock ticks up, Q flips. The output frequency is exactly half the clock — one T flip-flop is a divide-by-two.",
  /* 34–38 */ "Stack three T flip-flops with each one's Q driving the next one's clock — the ripple counter. Eight binary states from three toggling bits.",
];

const NARRATION_AUDIO = 'audio/t-flip-flop/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="sequential logic"
      title="T Flip-Flop: One Input, One Toggle per Edge"
      duration={SCENE_DURATION}
      introEnd={4.38}
      introCaption="One input, one rule — Q flips on every rising edge."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.38} end={14.01}>
        <SymbolBeat />
      </Sprite>

      <Sprite start={14.01} end={24.59}>
        <TruthTableBeat />
      </Sprite>

      <Sprite start={24.59} end={36.11}>
        <TimingBeat />
      </Sprite>

      <Sprite start={36.11} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared signal definitions ───────────────────────────────────────────
// Four CLK cycles displayed → rising edges at t = 0.5, 1.5, 2.5, 3.5
// (period 1, low first half, high second half).
const CYCLES = 4;
const TOTAL_T = CYCLES;
const CLK_RISING = [0.5, 1.5, 2.5, 3.5];

function clkAt(t) {
  return ((t % 1) >= 0.5) ? 1 : 0;
}
function tAt(t) {
  // T is held high for the whole sweep so Q toggles on every edge.
  // tAt is parameterised so we can show the held-high case explicitly.
  return t > 0.05 ? 1 : 0;
}
// Q starts at 0 and toggles at each rising CLK edge while T=1.
function qAt(t) {
  let q = 0;
  for (const edge of CLK_RISING) {
    if (edge <= t && tAt(edge) === 1) q = 1 - q; else if (edge > t) break;
  }
  return q;
}

// Convert step signal → polyline path with explicit verticals so the
// edges are crisp (no diagonal joins between samples).
function signalToD(fn, x0, yHigh, yLow, width, samples = 480) {
  const dxPer = width / TOTAL_T;
  let prevV = fn(0);
  const pts = [`M ${x0} ${prevV ? yHigh : yLow}`];
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

// ─── Beat 2: Symbol ──────────────────────────────────────────────────────
function SymbolBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 540, boxX: 200, boxY: 130, boxW: 200, boxH: 200,
        pinLen: 70, fontPin: 22, captionY: 510 }
    : { vbW: 720, vbH: 440, boxX: 260, boxY: 70, boxW: 200, boxH: 200,
        pinLen: 70, fontPin: 22, captionY: 420 };

  const tPinX = G.boxX + G.boxW / 2;
  const clkPinX = G.boxX + G.boxW / 2;
  const qPinY = G.boxY + G.boxH / 2;

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

        {/* T pin (top) */}
        <TraceIn d={`M ${tPinX} ${G.boxY - G.pinLen} L ${tPinX} ${G.boxY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.0}/>
        {/* CLK pin (bottom) */}
        <TraceIn d={`M ${clkPinX} ${G.boxY + G.boxH} L ${clkPinX} ${G.boxY + G.boxH + G.pinLen}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.2}/>
        {/* Q pin (right) */}
        <TraceIn d={`M ${G.boxX + G.boxW} ${qPinY} L ${G.boxX + G.boxW + G.pinLen} ${qPinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.4}/>

        {/* Inside labels */}
        <SvgFadeIn duration={0.35} delay={0.6}>
          <text x={tPinX} y={G.boxY + 28} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>T</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={0.8}>
          <text x={G.boxX + G.boxW - 14} y={qPinY + 8} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontPin}>Q</text>
        </SvgFadeIn>

        {/* Edge-trigger triangle on the CLK input (pointing up into the box) */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <polygon
            points={`${clkPinX - 9} ${G.boxY + G.boxH - 4},${clkPinX + 9} ${G.boxY + G.boxH - 4},${clkPinX} ${G.boxY + G.boxH - 18}`}
            fill="none" stroke="var(--amber-300)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* External labels */}
        <SvgFadeIn duration={0.35} delay={1.8}>
          <text x={tPinX} y={G.boxY - G.pinLen - 10} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">toggle</text>
          <text x={clkPinX} y={G.boxY + G.boxH + G.pinLen + 18} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">CLK</text>
          <text x={G.boxX + G.boxW + G.pinLen + 8} y={qPinY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">out</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two rows: T=0 → Q holds, T=1 → Q toggles
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Truth table ─────────────────────────────────────────────────
function TruthTableBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        T flip-flop truth table
      </FadeUp>

      <FadeUp duration={0.5} delay={0.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 34, color: 'var(--chalk-100)',
          letterSpacing: '0.02em',
        }}>
        T = 0  →  Q<sub>next</sub> = Q   <span style={{ color: 'var(--chalk-300)', fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18, fontStyle: 'normal', marginLeft: 18 }}>(hold)</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 34, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        T = 1  →  Q<sub>next</sub> = ¬Q   <span style={{ color: 'var(--chalk-300)', fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18, fontStyle: 'normal', marginLeft: 18 }}>(toggle)</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)', marginTop: 8,
          maxWidth: portrait ? '26ch' : 'none', textAlign: 'center',
        }}>
        same two NAND gates as a JK flip-flop with J and K tied together
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Timing — Q toggles on each rising CLK edge ──────────────────
function TimingBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 780, panelX: 60, panelW: 480,
        clkY: 90, clkH: 90, tY: 260, tH: 90, qY: 430, qH: 90,
        captionY: 700, fontEyebrow: 10 }
    : { vbW: 1080, vbH: 460, panelX: 100, panelW: 880,
        clkY: 50, clkH: 80, tY: 190, tH: 80, qY: 330, qH: 80,
        captionY: 440, fontEyebrow: 11 };

  const clkHigh = G.clkY + 10, clkLow = G.clkY + G.clkH - 10;
  const tHigh = G.tY + 10, tLow = G.tY + G.tH - 10;
  const qHigh = G.qY + 10, qLow = G.qY + G.qH - 10;

  const HOLD = 1.0;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 1.8, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);
  const cursorTime = traceFrac * TOTAL_T;
  const cursorX = G.panelX + traceFrac * G.panelW;

  const clkD = signalToD(clkAt, G.panelX, clkHigh, clkLow, G.panelW);
  const tPathD = signalToD(tAt, G.panelX, tHigh, tLow, G.panelW);
  const qPathD = signalToD(qAt, G.panelX, qHigh, qLow, G.panelW);

  // Pulse marks at each rising edge — visible while cursor sweeps past.
  function pulseAlpha(edge) {
    const x = G.panelX + (edge / TOTAL_T) * G.panelW;
    const dxFrac = (cursorX - x) / G.panelW;
    if (dxFrac < -0.005) return 0;
    if (dxFrac > 0.14) return 0;
    if (dxFrac < 0.02) return clamp((dxFrac + 0.005) / 0.025, 0, 1);
    return clamp(1 - (dxFrac - 0.02) / 0.12, 0, 1);
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
          <text x={G.panelX} y={G.tY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">T</text>
          <text x={G.panelX} y={G.qY - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">Q</text>
        </SvgFadeIn>

        {/* Baselines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {[clkLow, tLow, qLow].map((y, i) => (
            <line key={i} x1={G.panelX} y1={y}
                  x2={G.panelX + G.panelW} y2={y}
                  stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                  strokeDasharray="3 3"/>
          ))}
        </SvgFadeIn>

        {/* CLK and T appear quickly; Q traces in sync with the cursor */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <path d={clkD} fill="none"
                stroke="var(--chalk-100)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
          <path d={tPathD} fill="none"
                stroke="var(--chalk-200)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* Q trace — synchronously with the cursor sweep */}
        <TraceIn d={qPathD}
          stroke="var(--amber-300)" strokeWidth={2.6}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}
          ease={Easing.linear}/>

        {/* Toggle pulses at each rising edge — fire as the cursor crosses */}
        {CLK_RISING.map((edge, i) => {
          const a = pulseAlpha(edge);
          if (a <= 0) return null;
          const x = G.panelX + (edge / TOTAL_T) * G.panelW;
          return (
            <g key={i} opacity={a}>
              {/* spark on CLK row */}
              <circle cx={x} cy={clkHigh} r={6}
                      fill="var(--amber-400)" opacity={0.95}/>
              <circle cx={x} cy={clkHigh} r={14}
                      fill="none" stroke="var(--amber-400)" strokeWidth={1.5}
                      opacity={0.5}/>
              {/* dashed flip line down to Q */}
              <line x1={x} y1={clkHigh} x2={x} y2={qHigh}
                    stroke="var(--amber-300)" strokeWidth={1.4}
                    strokeDasharray="3 4" opacity={0.85}/>
              {/* curved 'flip' arc on Q row */}
              <path d={`M ${x - 10} ${qLow - 4}
                        Q ${x} ${qHigh - 18}
                          ${x + 10} ${qHigh - 4}`}
                    fill="none" stroke="var(--rose-400)" strokeWidth={1.6}
                    opacity={0.85}/>
            </g>
          );
        })}

        {/* Time cursor across all three rows */}
        {traceFrac > 0.01 && traceFrac < 0.99 && (
          <line x1={cursorX} y1={G.clkY - 8}
                x2={cursorX} y2={G.qY + G.qH + 8}
                stroke="var(--amber-300)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.55}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={9.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            f<tspan baselineShift="sub" fontSize={portrait ? 12 : 14}>out</tspan> = f<tspan baselineShift="sub" fontSize={portrait ? 12 : 14}>clk</tspan> / 2 — one T flip-flop divides the clock in half
          </text>
        </SvgFadeIn>

        {/* Suppress unused warning on cursorTime — used only via cursorX */}
        {cursorTime < -1 && <text>{cursorTime}</text>}
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
          fontSize: portrait ? 24 : 34, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '24ch' : 'none',
          lineHeight: 1.25,
        }}>
        Chain N of them → divide-by-2<sup>N</sup> → binary counter
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        clock dividers · async counters · frequency prescalers
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
