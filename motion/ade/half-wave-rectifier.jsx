// Half-Wave Rectifier: How a Diode Turns AC into Pulses — Manimo lesson scene.
// One diode in series with a resistor. Genuine animation lives in Beat 4:
// two scope panels trace V_in and V_out simultaneously while a time cursor
// sweeps across, and a diode-state badge flips between ON and OFF as the
// cursor crosses each zero-crossing of V_in.
//
// Beats (timed to single-track narration in motion/ade/audio/half-wave-rectifier/):
//    0.00– 4.55  Manimo intro: AC in, what shape comes out?
//    4.55–10.08  Circuit setup: AC source → diode → load
//   10.08–25.55  Two-panel split: forward bias vs reverse bias
//   25.55–34.71  Synchronized waveform trace: V_in sinusoid, V_out half-wave
//   34.71–41.00  Takeaway: half-wave is the first step of every power supply
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • The diode is drawn as a triangle + bar with the arrow pointing
//     from anode (left) to cathode (right).
//   • Beat 4's diode-state badge is computed from the same sin() that
//     drives the V_in trace, so the badge and the waveform are
//     guaranteed to stay in sync.

const SCENE_DURATION = 41;

const NARRATION = [
  /*  0.00– 4.55 */ "An AC source plus a diode — what shape comes out across the load?",
  /*  4.55–10.08 */ "Put a diode in series with a resistor. The diode passes current one way, blocks it the other.",
  /* 10.08–25.55 */ "When V in goes positive, the diode is forward biased and current flows. When V in swings negative, the diode reverse biases and the current stops.",
  /* 25.55–34.71 */ "Watch V in trace as a smooth sinusoid, while V out keeps only the positive humps — the negative half is clipped to zero.",
  /* 34.71–41.00 */ "That's half wave rectification — a single diode turning AC into a pulsing one-sided signal.",
];

const NARRATION_AUDIO = 'audio/half-wave-rectifier/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="diodes"
      title="Half-Wave Rectifier: How a Diode Turns AC into Pulses"
      duration={SCENE_DURATION}
      introEnd={4.55}
      introCaption="AC in — what waveform comes out the other side?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.55} end={10.08}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={10.08} end={25.55}>
        <StatesBeat />
      </Sprite>

      <Sprite start={25.55} end={34.71}>
        <WaveformBeat />
      </Sprite>

      <Sprite start={34.71} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ─────────────────────────────────────────────────────
// Diode symbol: triangle (anode side) + bar (cathode side), with optional
// arrow-marker for orientation. cx/cy is the centre.
function DiodeSymbol({ cx, cy, size = 18, color = 'var(--amber-400)', dim = false }) {
  const w = size, h = size;
  const opacity = dim ? 0.32 : 1;
  return (
    <g style={{ opacity }}>
      {/* Triangle pointing right */}
      <polygon
        points={`${cx - w} ${cy - h},${cx - w} ${cy + h},${cx + w} ${cy}`}
        fill={color} stroke={color} strokeWidth={1.5}/>
      {/* Cathode bar */}
      <line x1={cx + w} y1={cy - h} x2={cx + w} y2={cy + h}
            stroke={color} strokeWidth={3}/>
    </g>
  );
}

// AC source symbol — circle with sine inside.
function ACSource({ cx, cy, r = 24, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill="none" stroke={color} strokeWidth={2}/>
      <path d={`M ${cx - r * 0.55} ${cy}
                Q ${cx - r * 0.28} ${cy - r * 0.6}, ${cx} ${cy}
                T ${cx + r * 0.55} ${cy}`}
            fill="none" stroke={color} strokeWidth={2}/>
    </g>
  );
}

// Horizontal zigzag resistor between (x1, y) and (x2, y), oscillating
// vertically by `amp`.
function hZigzag(x1, x2, y, amp = 10, n = 8) {
  const dx = (x2 - x1) / n;
  const pts = [`M ${x1} ${y}`];
  for (let i = 1; i < n; i++) {
    const x = x1 + i * dx;
    const yy = y + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${yy.toFixed(1)}`);
  }
  pts.push(`L ${x2} ${y}`);
  return pts.join(' ');
}

// Sample a path that represents y = f(t) over t in [0, totalT], drawn
// across svg x ∈ [x0, x0 + width], baseline y ∈ [yBase], amplitude in px.
function samplePath(fn, x0, yBase, width, amplitude, totalT, samples = 120) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * totalT;
    const x = x0 + (i / samples) * width;
    const y = yBase - amplitude * fn(t);
    pts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
                     : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

// ─── Beat 2: Circuit ─────────────────────────────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  // Single horizontal loop: source — diode — resistor — back along the
  // bottom wire to the source. Portrait squeezes the width and pulls the
  // load slightly closer.
  const G = portrait
    ? { vbW: 600, vbH: 380, srcX: 80, srcY: 130, srcR: 28,
        diodeX: 270, diodeY: 130, diodeSize: 18,
        resX1: 360, resX2: 500, resY: 130, resAmp: 14,
        botY: 240, captionY: 360,
        vinLabelX: 80, vinLabelY: 90, voutLabelX: 430, voutLabelY: 95,
        fontMain: 22, fontCaption: 14 }
    : { vbW: 820, vbH: 280, srcX: 120, srcY: 110, srcR: 32,
        diodeX: 360, diodeY: 110, diodeSize: 20,
        resX1: 470, resX2: 680, resY: 110, resAmp: 12,
        botY: 220, captionY: 265,
        vinLabelX: 120, vinLabelY: 60, voutLabelX: 575, voutLabelY: 65,
        fontMain: 22, fontCaption: 14 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* AC source */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <ACSource cx={G.srcX} cy={G.srcY} r={G.srcR}/>
        </SvgFadeIn>

        {/* Wire from source to diode */}
        <TraceIn d={`M ${G.srcX + G.srcR} ${G.srcY} L ${G.diodeX - G.diodeSize - 6} ${G.diodeY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={0.4}/>

        {/* Diode */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <DiodeSymbol cx={G.diodeX} cy={G.diodeY} size={G.diodeSize}
                       color="var(--amber-400)"/>
        </SvgFadeIn>

        {/* Wire from diode to resistor */}
        <TraceIn d={`M ${G.diodeX + G.diodeSize + 6} ${G.diodeY} L ${G.resX1} ${G.resY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.2}/>

        {/* Resistor */}
        <TraceIn d={hZigzag(G.resX1, G.resX2, G.resY, G.resAmp)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={1.4}/>

        {/* Right vertical wire down */}
        <TraceIn d={`M ${G.resX2} ${G.resY} L ${G.resX2} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.3} delay={2.0}/>

        {/* Bottom wire back to source */}
        <TraceIn d={`M ${G.resX2} ${G.botY} L ${G.srcX} ${G.botY} L ${G.srcX} ${G.srcY + G.srcR}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.7} delay={1.8}/>

        {/* Labels */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <text x={G.vinLabelX} y={G.vinLabelY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
          <text x={G.voutLabelX} y={G.voutLabelY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan>
          </text>
          {/* "R" label below the resistor */}
          <text x={(G.resX1 + G.resX2) / 2}
                y={G.resY + (portrait ? 38 : 32)}
                textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain * 0.9}>R</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            current can only flow one way — anode → cathode
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Two-panel split — forward / reverse bias ────────────────────
function StatesBeat() {
  const portrait = usePortrait();
  // Each mini-panel renders the same circuit shape. The forward-bias one
  // is bright with a current arrow; the reverse-bias one is dim with an X.
  const panelW = portrait ? 520 : 420;
  const panelH = portrait ? 220 : 220;

  function MiniCircuit({ active }) {
    // Internal geometry in a 420×220 viewBox (portrait scales the parent).
    const G = { srcX: 70, srcY: 90, srcR: 24,
                diodeX: 200, diodeY: 90, diodeSize: 16,
                resX1: 270, resX2: 380, resY: 90, resAmp: 10,
                botY: 170, fontMain: 18 };
    const color = active ? 'var(--amber-400)' : 'var(--rose-400)';
    const dim = !active;
    return (
      <svg width="100%" height="100%" viewBox="0 0 420 220"
           style={{ overflow: 'visible' }} preserveAspectRatio="xMidYMid meet">
        <ACSource cx={G.srcX} cy={G.srcY} r={G.srcR}
                  color="var(--chalk-200)"/>
        <line x1={G.srcX + G.srcR} y1={G.srcY}
              x2={G.diodeX - G.diodeSize - 4} y2={G.diodeY}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <DiodeSymbol cx={G.diodeX} cy={G.diodeY} size={G.diodeSize}
                     color={color} dim={dim}/>
        <line x1={G.diodeX + G.diodeSize + 4} y1={G.diodeY}
              x2={G.resX1} y2={G.resY}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <path d={hZigzag(G.resX1, G.resX2, G.resY, G.resAmp)}
              stroke={active ? 'var(--amber-400)' : 'var(--chalk-300)'}
              strokeWidth={2.4} fill="none"
              strokeLinecap="round" strokeLinejoin="round"
              opacity={active ? 1 : 0.5}/>
        <line x1={G.resX2} y1={G.resY} x2={G.resX2} y2={G.botY}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <line x1={G.resX2} y1={G.botY} x2={G.srcX} y2={G.botY}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <line x1={G.srcX} y1={G.botY} x2={G.srcX} y2={G.srcY + G.srcR}
              stroke="var(--chalk-200)" strokeWidth={2}/>

        {active ? (
          // Current arrow flowing through load (above the resistor)
          <g>
            <line x1={G.resX1 - 10} y1={G.resY - 28}
                  x2={G.resX2 + 10} y2={G.resY - 28}
                  stroke="var(--amber-300)" strokeWidth={2.4}/>
            <polygon
              points={`${G.resX2 + 18} ${G.resY - 28},${G.resX2 + 8} ${G.resY - 34},${G.resX2 + 8} ${G.resY - 22}`}
              fill="var(--amber-300)"/>
            <text x={(G.resX1 + G.resX2) / 2} y={G.resY - 38}
                  textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={12} letterSpacing="0.08em">I &gt; 0</text>
          </g>
        ) : (
          // X mark over the diode
          <g>
            <line x1={G.diodeX - 22} y1={G.diodeY - 22}
                  x2={G.diodeX + 22} y2={G.diodeY + 22}
                  stroke="var(--rose-400)" strokeWidth={2.8}/>
            <line x1={G.diodeX - 22} y1={G.diodeY + 22}
                  x2={G.diodeX + 22} y2={G.diodeY - 22}
                  stroke="var(--rose-400)" strokeWidth={2.8}/>
            <text x={(G.resX1 + G.resX2) / 2} y={G.resY - 38}
                  textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={12} letterSpacing="0.08em">I = 0</text>
          </g>
        )}
      </svg>
    );
  }

  const Panel = ({ delay, active, eyebrow, caption }) => (
    <FadeUp duration={0.5} delay={delay} distance={14}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 8,
      }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: active ? 'var(--amber-300)' : 'var(--rose-300)',
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        {eyebrow}
      </div>
      <div style={{ width: panelW, height: panelH }}>
        <MiniCircuit active={active}/>
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: portrait ? 16 : 18,
        color: active ? 'var(--chalk-100)' : 'var(--chalk-300)',
      }}>
        {caption}
      </div>
    </FadeUp>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: portrait ? 'column' : 'row',
      alignItems: 'center', gap: portrait ? 18 : 50,
    }}>
      <Panel delay={0.3} active={true}
             eyebrow="forward bias"
             caption={<>V<sub>in</sub> &gt; 0 — diode conducts</>}/>
      <Panel delay={1.6} active={false}
             eyebrow="reverse bias"
             caption={<>V<sub>in</sub> &lt; 0 — diode blocks</>}/>
      {!portrait && (
        <FadeUp duration={0.4} delay={3.6} distance={8}
          style={{
            position: 'absolute', bottom: -36, left: 0, right: 0,
            textAlign: 'center',
            fontFamily: 'var(--font-sans)', fontSize: 15,
            color: 'var(--chalk-300)', letterSpacing: '0.02em',
          }}>
          ON when V<sub>in</sub> &gt; 0  ·  OFF when V<sub>in</sub> &lt; 0
        </FadeUp>
      )}
    </div>
  );
}

// ─── Beat 4: Synchronized scope traces — genuine motion ──────────────────
function WaveformBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Trace timing: hold briefly, then trace across both scopes in
  // TRACE_DUR seconds. The cursor and diode badge follow this same
  // localTime mapping so the state badge stays in sync with the sinusoid.
  const HOLD = 1.2;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 1.4, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);
  const CYCLES = 2; // visible across the scope window

  // Layout — landscape: two scopes side-by-side; portrait: stacked.
  const G = portrait
    ? { vbW: 600, vbH: 720, panelX: 70, panelW: 460,
        vinY0: 80, vinH: 220, voutY0: 360, voutH: 220,
        captionY: 695, fontEyebrow: 10, fontLabel: 12 }
    : { vbW: 1100, vbH: 380, panelX: 100, panelW: 880,
        vinY0: 30, vinH: 130, voutY0: 200, voutH: 130,
        captionY: 365, fontEyebrow: 11, fontLabel: 13 };

  const vinBaseline = G.vinY0 + G.vinH / 2;
  const voutBaseline = G.voutY0 + G.voutH - 8;  // sits near scope floor
  const amp = (G.vinH / 2) * 0.85;

  // Build the V_in and V_out paths once. The TraceIn primitive draws them
  // in over TRACE_DUR seconds.
  const vinD = samplePath(
    (t) => Math.sin(2 * Math.PI * CYCLES * t),
    G.panelX, vinBaseline, G.panelW, amp, 1,
  );
  const voutD = samplePath(
    (t) => Math.max(0, Math.sin(2 * Math.PI * CYCLES * t)),
    G.panelX, voutBaseline, G.panelW, amp, 1,
  );

  // Cursor position based on traceFrac.
  const cursorX = G.panelX + G.panelW * traceFrac;

  // Diode state badge: derived from sin at the cursor's phase.
  const cursorT = traceFrac;
  const vinAtCursor = Math.sin(2 * Math.PI * CYCLES * cursorT);
  const diodeOn = vinAtCursor > 0;
  const badgeColor = diodeOn ? 'var(--amber-300)' : 'var(--rose-300)';
  const badgeText = diodeOn ? 'DIODE: ON' : 'DIODE: OFF';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Eyebrow labels above each panel */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.vinY0 - 10}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V_IN</text>
          <text x={G.panelX} y={G.voutY0 - 10}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V_OUT</text>
        </SvgFadeIn>

        {/* Panel frames */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {/* V_in panel — solid bottom + frame */}
          <rect x={G.panelX} y={G.vinY0}
                width={G.panelW} height={G.vinH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.45}/>
          {/* horizontal zero axis */}
          <line x1={G.panelX} y1={vinBaseline}
                x2={G.panelX + G.panelW} y2={vinBaseline}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>

          <rect x={G.panelX} y={G.voutY0}
                width={G.panelW} height={G.voutH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.45}/>
          <line x1={G.panelX} y1={voutBaseline}
                x2={G.panelX + G.panelW} y2={voutBaseline}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>
        </SvgFadeIn>

        {/* Traces — drawn over TRACE_DUR via TraceIn */}
        <TraceIn d={vinD}
          stroke="var(--chalk-100)" strokeWidth={2.2}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}/>
        <TraceIn d={voutD}
          stroke="var(--amber-300)" strokeWidth={2.4}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}/>

        {/* Time cursor — vertical line spanning both panels */}
        {traceFrac > 0 && traceFrac < 1 && (
          <g>
            <line x1={cursorX} y1={G.vinY0}
                  x2={cursorX} y2={G.voutY0 + G.voutH}
                  stroke={badgeColor} strokeWidth={1.2}
                  strokeDasharray="4 4" opacity={0.7}/>
          </g>
        )}

        {/* Diode-state badge — top-right corner */}
        <SvgFadeIn duration={0.4} delay={HOLD - 0.2}>
          <rect x={G.panelX + G.panelW - 132} y={G.vinY0 - 30}
                width={130} height={22}
                fill="none" stroke={badgeColor} strokeWidth={1.4}
                rx={4}/>
          <text x={G.panelX + G.panelW - 132 + 65}
                y={G.vinY0 - 14} textAnchor="middle"
                fill={badgeColor} fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">{badgeText}</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={10.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the negative half is cut to zero
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
          fontSize: portrait ? 30 : 40, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        AC  →  half-wave  →  pulses
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '44ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        one diode is the first step of every DC power supply
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        smoothing comes next — add a capacitor and you get nearly DC
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
