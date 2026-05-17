// Ohm's Law: How Voltage, Current, and Resistance Connect — Manimo lesson scene.
// V = I R. Voltage pushes, resistance pushes back, current is the response.
// Genuine animation lives in Beat 2 (charge dots circulating the loop, speed
// keyed to V) and Beat 4 (live V sweep — operating point slides along the
// V/R line, current bar tracks, charge-dot speed scales).
//
// Beats (timed to single-track narration in motion/ade/audio/ohms-law/):
//    0.00– 4.69  Manimo intro: voltage pushes, resistance resists — what current?
//    4.69–12.73  Circuit: battery + resistor + wire loop, charges flow clockwise
//   12.73–20.16  Formula chain: V = I R and the two rearrangements
//   20.16–27.42  Sweep V: operating point slides along the I = V/R line; current bar tracks
//   27.42–35.00  Takeaway: double V → double I; double R → halve I
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beats 2 and 4 read useSprite() localTime to drive value-keyed motion
//     (charge-dot speed, operating point sweep) — both are the heart of
//     the scene's "genuine animation" budget.

const SCENE_DURATION = 35;

const NARRATION = [
  /*  0.00– 4.69 */ "Push electrons through a resistor — how hard, and how many?",
  /*  4.69–12.73 */ "A battery, a resistor, and a wire — the battery pushes, the resistor resists, and the current flows around the loop.",
  /* 12.73–20.16 */ "The three are tied together by V equals I times R — rearrange it and you can solve for whichever one you need.",
  /* 20.16–27.42 */ "Crank the voltage up and the current rises in step. Crank the resistance up instead and the current drops away.",
  /* 27.42–35.00 */ "Double the push, double the flow — for the same resistor, current tracks voltage in a straight line.",
];

// Single continuous narration track produced by `npm run audio ohms-law`.
// Beat <Sprite start> values below match audioStart offsets in
// motion/ade/audio/ohms-law/manifest.json (overwritten by rewire-scene.js).
const NARRATION_AUDIO = 'audio/ohms-law/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit theory"
      title="Ohm's Law"
      duration={SCENE_DURATION}
      introEnd={4.69}
      introCaption="Voltage pushes, resistance pushes back — what current shows up?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.69} end={12.73}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={12.73} end={20.16}>
        <FormulaBeat />
      </Sprite>

      <Sprite start={20.16} end={27.42}>
        <SweepBeat />
      </Sprite>

      <Sprite start={27.42} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// Zigzag resistor between two y-positions on a vertical column.
function zigzagD(cx, yTop, yBot, amp = 14, n = 8) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const x = cx + (i % 2 === 1 ? amp : -amp);
    const y = yTop + i * dy;
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
}

// Battery symbol (vertical orientation).
function BatterySymbol({ cx, cy, color }) {
  return (
    <g>
      <line x1={cx - 18} y1={cy - 10} x2={cx + 18} y2={cy - 10}
            stroke={color} strokeWidth={3}/>
      <line x1={cx - 10} y1={cy + 10} x2={cx + 10} y2={cy + 10}
            stroke={color} strokeWidth={3}/>
    </g>
  );
}

// ─── Beat 2: Circuit — battery + resistor + steady current ───────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry per aspect. Rectangular loop with battery on the left column
  // and resistor on the right column, wires top and bottom.
  const G = portrait
    ? { vbW: 560, vbH: 540, leftX: 130, rightX: 420,
        topY: 90, botY: 470, batCy: 280, resTop: 200, resBot: 360, zigAmp: 22,
        vLabelX: 60, vLabelY: 290, rLabelDx: 30,
        iLabelY: 70, captionY: 510, fontMain: 24, fontCaption: 14 }
    : { vbW: 760, vbH: 360, leftX: 160, rightX: 560,
        topY: 70, botY: 310, batCy: 190, resTop: 130, resBot: 250, zigAmp: 14,
        vLabelX: 90, vLabelY: 196, rLabelDx: 28,
        iLabelY: 52, captionY: 346, fontMain: 22, fontCaption: 14 };

  // Charge dots travelling clockwise around the loop. Path points list
  // segment by segment so the dot maintains constant speed.
  const path = [
    { x: G.leftX, y: G.batCy + 16 },     // start (just below battery)
    { x: G.leftX, y: G.botY },           // down to bottom wire
    { x: G.rightX, y: G.botY },          // across bottom
    { x: G.rightX, y: G.resBot },        // up to resistor bottom
    { x: G.rightX, y: G.resTop },        // through resistor
    { x: G.rightX, y: G.topY },          // up to top wire
    { x: G.leftX, y: G.topY },           // across top
    { x: G.leftX, y: G.batCy - 16 },     // down to battery top
  ];
  let total = 0;
  const segLens = [];
  for (let i = 1; i < path.length; i++) {
    const L = Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
    segLens.push(L); total += L;
  }
  function pointAt(u) {
    const target = ((u % 1) + 1) % 1 * total;
    let acc = 0;
    for (let i = 0; i < segLens.length; i++) {
      if (target <= acc + segLens[i]) {
        const f = (target - acc) / segLens[i];
        return {
          x: path[i].x + (path[i+1].x - path[i].x) * f,
          y: path[i].y + (path[i+1].y - path[i].y) * f,
        };
      }
      acc += segLens[i];
    }
    return path[path.length - 1];
  }

  // Charges start after wires + resistor have been drawn in (≈3.4s).
  const chargesT = Math.max(0, localTime - 3.4);
  const period = 3.6;
  const NUM = 6;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top wire */}
        <TraceIn d={`M ${G.leftX} ${G.batCy - 16} L ${G.leftX} ${G.topY} L ${G.rightX} ${G.topY} L ${G.rightX} ${G.resTop}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>
        {/* Bottom wire */}
        <TraceIn d={`M ${G.leftX} ${G.batCy + 16} L ${G.leftX} ${G.botY} L ${G.rightX} ${G.botY} L ${G.rightX} ${G.resBot}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>

        {/* Battery */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <BatterySymbol cx={G.leftX} cy={G.batCy} color="var(--chalk-200)"/>
          <text x={G.vLabelX} y={G.vLabelY} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V</text>
        </SvgFadeIn>

        {/* Resistor */}
        <TraceIn d={zigzagD(G.rightX, G.resTop, G.resBot, G.zigAmp)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={1.0} delay={1.2}/>

        {/* R label */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={G.rightX + G.zigAmp + G.rLabelDx}
                y={(G.resTop + G.resBot) / 2 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>R</text>
        </SvgFadeIn>

        {/* I arrow on top wire */}
        <SvgFadeIn duration={0.35} delay={2.6}>
          <line x1={G.leftX + 60} y1={G.topY} x2={G.rightX - 60} y2={G.topY}
                stroke="var(--amber-300)" strokeWidth={1.4}
                strokeDasharray="4 4"/>
          <path d={`M ${G.rightX - 60} ${G.topY} L ${G.rightX - 72} ${G.topY - 5} L ${G.rightX - 72} ${G.topY + 5} Z`}
                fill="var(--amber-300)"/>
          <text x={(G.leftX + G.rightX) / 2} y={G.iLabelY}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>I</text>
        </SvgFadeIn>

        {/* Charge dots travelling clockwise — the genuine motion of this beat */}
        {chargesT > 0 && (
          <SvgFadeIn duration={0.3} delay={3.4}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = chargesT / period + i / NUM;
              const p = pointAt(u);
              return (
                <circle key={i} cx={p.x} cy={p.y} r={3.5}
                        fill="var(--amber-300)" opacity={0.95}/>
              );
            })}
          </SvgFadeIn>
        )}

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={5.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            one current threading the whole loop
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Formula — V = I R and rearrangements ────────────────────────
function FormulaBeat() {
  const portrait = usePortrait();
  const headlineStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 54 : 64, letterSpacing: '0.02em',
    color: 'var(--amber-300)',
  };
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 30 : 34, letterSpacing: '0.02em',
    color: 'var(--chalk-200)',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Ohm's law
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14} style={headlineStyle}>
        V = I · R
      </FadeUp>

      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16,
                      alignItems: 'center' }}>
          <FadeUp duration={0.5} delay={1.8} distance={10} style={stepStyle}>
            I = V / R
          </FadeUp>
          <FadeUp duration={0.5} delay={2.6} distance={10} style={stepStyle}>
            R = V / I
          </FadeUp>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 80, alignItems: 'center' }}>
          <FadeUp duration={0.5} delay={1.8} distance={10} style={stepStyle}>
            I = V / R
          </FadeUp>
          <div style={{ width: 1, height: 40, background: 'rgba(232,220,193,0.15)' }}/>
          <FadeUp duration={0.5} delay={2.6} distance={10} style={stepStyle}>
            R = V / I
          </FadeUp>
        </div>
      )}

      <FadeUp duration={0.5} delay={4.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '26ch' : '52ch', lineHeight: 1.35,
        }}>
        voltage drives — resistance resists — current responds
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Live sweep — V scrubs, I = V/R tracks ───────────────────────
// The operating point slides along the I = V/R line as V sweeps in a
// triangle wave; the current bar on the right grows and shrinks in sync;
// the charge-dot circulation under the slider speeds up and slows down.
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Sweep: triangle wave for V in [0.2, 1.0] (normalised). Period 4.2s
  // → about 2.6 full cycles in the 11s beat. R held constant at 1.
  const period = 4.2;
  // Start at low V, ramp up, hold, ramp down.
  const sweepT = Math.max(0, localTime - 1.4);
  const phase = (sweepT % period) / period; // 0..1
  const vNorm = phase < 0.5
    ? 0.2 + (phase / 0.5) * 0.8           // 0..0.5 → 0.2..1.0
    : 0.2 + ((1 - phase) / 0.5) * 0.8;   // 0.5..1 → 1.0..0.2
  const R = 1; // normalised
  const iNorm = vNorm / R;

  // Geometry: graph on left, slider + bar on right.
  const G = portrait
    ? { vbW: 560, vbH: 620, axOx: 80, axOy: 360, axW: 380, axH: 280,
        sliderX: 80, sliderY: 470, sliderW: 380,
        barX: 220, barY: 525, barW: 280, barH: 16,
        fontMain: 20, fontLabel: 16, fontCaption: 14, captionY: 600 }
    : { vbW: 880, vbH: 380, axOx: 90, axOy: 320, axW: 380, axH: 250,
        sliderX: 540, sliderY: 110, sliderW: 280,
        barX: 540, barY: 190, barW: 280, barH: 16,
        fontMain: 20, fontLabel: 16, fontCaption: 14, captionY: 368 };

  const lineX1 = G.axOx;
  const lineY1 = G.axOy;
  const lineX2 = G.axOx + G.axW;
  const lineY2 = G.axOy - G.axH;   // top-right corner — slope = axH/axW

  // Operating point along the line.
  const opX = G.axOx + vNorm * G.axW;
  const opY = G.axOy - iNorm * G.axH;

  const sliderKnobX = G.sliderX + vNorm * G.sliderW;
  const barFillW = iNorm * G.barW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <TraceIn d={`M ${G.axOx} ${G.axOy - G.axH} L ${G.axOx} ${G.axOy} L ${G.axOx + G.axW} ${G.axOy}`}
          stroke="var(--chalk-300)" strokeWidth={1.6}
          duration={0.8} delay={1.0}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.3} delay={1.6}>
          <text x={G.axOx + G.axW + 18} y={G.axOy + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>V</text>
          <text x={G.axOx - 10} y={G.axOy - G.axH - 6}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>I</text>
          <text x={G.axOx - 8} y={G.axOy + 16}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
        </SvgFadeIn>

        {/* The I = V/R line */}
        <TraceIn d={`M ${lineX1} ${lineY1} L ${lineX2} ${lineY2}`}
          stroke="var(--amber-400)" strokeWidth={2.2}
          duration={0.9} delay={1.8}/>

        {/* slope label — parked above the top-right tip of the line so the
            text doesn't cross the trace */}
        <SvgFadeIn duration={0.3} delay={2.7}>
          <text x={lineX2 - 4} y={lineY2 - 10}
                textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>slope = 1 / R</text>
        </SvgFadeIn>

        {/* Live operating point */}
        {sweepT > 0 && (
          <SvgFadeIn duration={0.3} delay={1.4}>
            <line x1={opX} y1={G.axOy} x2={opX} y2={opY}
                  stroke="var(--rose-400)" strokeWidth={1.2}
                  strokeDasharray="3 3" opacity={0.8}/>
            <line x1={G.axOx} y1={opY} x2={opX} y2={opY}
                  stroke="var(--rose-400)" strokeWidth={1.2}
                  strokeDasharray="3 3" opacity={0.8}/>
            <circle cx={opX} cy={opY} r={6}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1.5}/>
          </SvgFadeIn>
        )}

        {/* V slider (just a visual indicator of the live value) */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <line x1={G.sliderX} y1={G.sliderY} x2={G.sliderX + G.sliderW} y2={G.sliderY}
                stroke="var(--chalk-300)" strokeWidth={1.6}/>
          <text x={G.sliderX} y={G.sliderY - 14}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">V</text>
        </SvgFadeIn>
        {sweepT > 0 && (
          <circle cx={sliderKnobX} cy={G.sliderY} r={7}
                  fill="var(--amber-300)" stroke="var(--amber-400)" strokeWidth={1.5}/>
        )}

        {/* I bar */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <rect x={G.barX} y={G.barY} width={G.barW} height={G.barH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1.4} rx={2}/>
          <text x={G.barX} y={G.barY - 6}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">I</text>
        </SvgFadeIn>
        {sweepT > 0 && (
          <rect x={G.barX + 1} y={G.barY + 1}
                width={Math.max(0, barFillW - 2)} height={G.barH - 2}
                fill="var(--rose-400)" opacity={0.85} rx={1}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            scrub V — I rides the V/R line in lock-step
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
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
          fontSize: portrait ? 28 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '48ch',
          lineHeight: 1.3,
        }}>
        Double V → double I. Double R → halve I.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
        }}>
        (linear — until the resistor heats up)
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
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
