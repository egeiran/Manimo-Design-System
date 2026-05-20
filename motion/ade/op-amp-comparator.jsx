// The Op-Amp Comparator — Manimo lesson scene.
// Strip the feedback resistor off an inverting/non-inverting amp and the
// op-amp's enormous open-loop gain forces the output to one of the supply
// rails the moment V_in crosses V_ref. A triangle input becomes a clean
// square output — that's a comparator, the bridge from analog to digital.
//
// Beats (audio-aligned offsets from motion/ade/audio/op-amp-comparator/manifest.json):
//   0.00– 7.11  Manimo intro: no feedback — why does that help?
//   7.11–18.65  Schematic: V_in to V+, V_ref to V−, ±V_sat rails, no feedback
//  18.65–30.86  Transfer curve: V_in → V_out is a step at V_ref
//  30.86–45.47  Genuine motion — triangle V_in sweep + square V_out snap
//  45.47–58.00  Takeaway
//
// Authoring notes:
//   • Beat 4 (RampToSquare) is the motion beat: localTime drives a
//     triangle wave for V_in, and V_out is computed every frame as
//     sign(V_in − V_ref) · V_sat — two synchronised scope traces.
//   • A moving cursor walks across both scopes at the same x so the
//     comparator's edge-on-crossing behaviour is obvious.

const SCENE_DURATION = 58;

const NARRATION = [
  /*  0.00– 7.11 */ 'An op-amp with no feedback resistor — how does it turn a smooth voltage into a clean digital decision?',
  /*  7.11–18.65 */ 'V in goes to the plus input, a fixed reference V ref to the minus input. There is no feedback wire — the op-amp runs open loop, with a gain in the hundreds of thousands.',
  /* 18.65–30.86 */ 'The transfer characteristic is brutal. Below V ref the output sits at minus V sat. Above V ref it jumps to plus V sat. The transition is essentially vertical.',
  /* 30.86–45.47 */ 'Feed it a triangle wave. Each time the input climbs past V ref, the output snaps high; each time it falls back below, the output snaps low. A smooth analog input becomes a clean square wave.',
  /* 45.47–58.00 */ 'That is what a comparator does — turn an analog crossing into a digital edge. Zero-crossing detectors, level alarms, every analog-to-digital converter starts here.',
];

const NARRATION_AUDIO = 'audio/op-amp-comparator/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="The Op-Amp Comparator: A Switch That Snaps at the Reference"
      duration={SCENE_DURATION}
      introEnd={7.11}
      introCaption="No feedback — the gain runs wild. Why does that help?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.11} end={18.65}>
        <SchematicBeat />
      </Sprite>

      <Sprite start={18.65} end={30.86}>
        <TransferCurveBeat />
      </Sprite>

      <Sprite start={30.86} end={45.47}>
        <RampToSquareBeat />
      </Sprite>

      <Sprite start={45.47} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared op-amp triangle symbol ───────────────────────────────────────
// `cx, cy` is the centre of the triangle. Triangle points to the right;
// V+ is the upper-left pin, V- is the lower-left pin, output is the
// right vertex. Supply rails are drawn separately by the caller (so the
// scale and angle can be tuned per beat).
function OpAmpSymbol({ cx, cy, w = 110, h = 90 }) {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  return (
    <g>
      <path d={`M ${left} ${top} L ${right} ${cy} L ${left} ${bot} Z`}
            fill="rgba(244,184,96,0.06)"
            stroke="var(--amber-400)" strokeWidth={2}/>
      {/* + and − marks on the input pins */}
      <text x={left + 10} y={cy - h / 4 + 4}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={14}>+</text>
      <text x={left + 10} y={cy + h / 4 + 4}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={14}>−</text>
    </g>
  );
}

// ─── Beat 2: Schematic ────────────────────────────────────────────────────
function SchematicBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 640,
        opCx: 320, opCy: 320, opW: 120, opH: 110,
        vinX: 80, vinY: 270, vrefX: 80, vrefY: 370,
        outX: 540, outY: 320,
        railTop: 130, railBot: 510, railX: 320,
        fontMain: 18, fontCaption: 13, captionY: 600 }
    : { vbW: 1000, vbH: 460,
        opCx: 520, opCy: 230, opW: 140, opH: 120,
        vinX: 120, vinY: 180, vrefX: 120, vrefY: 280,
        outX: 880, outY: 230,
        railTop: 80, railBot: 380, railX: 520,
        fontMain: 18, fontCaption: 13, captionY: 430 };

  const opLeft = G.opCx - G.opW / 2;
  const opRight = G.opCx + G.opW / 2;
  const opTop = G.opCy - G.opH / 2;
  const opBot = G.opCy + G.opH / 2;
  const inPlusY  = G.opCy - G.opH / 4;
  const inMinusY = G.opCy + G.opH / 4;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Op-amp triangle */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <OpAmpSymbol cx={G.opCx} cy={G.opCy} w={G.opW} h={G.opH}/>
        </SvgFadeIn>

        {/* V_in wire into the + input */}
        <TraceIn d={`M ${G.vinX} ${G.vinY} L ${opLeft} ${inPlusY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.6} delay={0.5}/>
        {/* V_ref wire into the − input */}
        <TraceIn d={`M ${G.vrefX} ${G.vrefY} L ${opLeft} ${inMinusY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.6} delay={1.1}/>
        {/* Output wire */}
        <TraceIn d={`M ${opRight} ${G.opCy} L ${G.outX} ${G.opCy}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.6} delay={1.7}/>

        {/* Source / reference labels at the wire ends */}
        <SvgFadeIn duration={0.4} delay={0.7}>
          <text x={G.vinX - 8} y={G.vinY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain} textAnchor="end">
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.3}>
          <text x={G.vrefX - 8} y={G.vrefY + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain} textAnchor="end">
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>ref</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.9}>
          <text x={G.outX + 8} y={G.opCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Supply rails — drawn as short stubs at top/bottom of the triangle
            to show the op-amp is powered by ±V_sat. */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <line x1={G.opCx} y1={opTop} x2={G.opCx} y2={G.railTop}
                stroke="var(--chalk-300)" strokeWidth={1.4} strokeDasharray="3 3"/>
          <line x1={G.opCx} y1={opBot} x2={G.opCx} y2={G.railBot}
                stroke="var(--chalk-300)" strokeWidth={1.4} strokeDasharray="3 3"/>
          <text x={G.opCx + 14} y={G.railTop + 4}
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={12}>+V_sat</text>
          <text x={G.opCx + 14} y={G.railBot - 4}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12}>−V_sat</text>
        </SvgFadeIn>

        {/* "Open loop — no feedback resistor" callout */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          {/* gentle hint of where a feedback resistor would have gone */}
          <text x={(opRight + G.outX) / 2} y={G.opCy - 50} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.10em">
            NO FEEDBACK RESISTOR
          </text>
          {/* dotted ghost path from output back to V- showing what was removed */}
          <path d={`M ${opRight + 28} ${G.opCy} Q ${opRight + 28} ${inMinusY + 36} ${opLeft - 14} ${inMinusY + 36}`}
                fill="none" stroke="var(--rose-300)" strokeWidth={1.2}
                strokeDasharray="2 5" opacity={0.55}/>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            {portrait
              ? 'open loop — gain runs free, output slams to a rail'
              : 'open loop — the gain has nothing to push back against, so the output slams to a rail'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Transfer curve ───────────────────────────────────────────────
function TransferCurveBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 580, vbH: 640,
        ax0: 80, ax1: 500, axMid: 290,
        ay0: 540, ay1: 100, ayMid: 320,
        fontAxis: 14, fontLabel: 16, captionY: 600 }
    : { vbW: 880, vbH: 460,
        ax0: 140, ax1: 760, axMid: 450,
        ay0: 380, ay1: 80, ayMid: 230,
        fontAxis: 14, fontLabel: 16, captionY: 440 };

  // We draw the step as two horizontal segments + a vertical jump. The
  // vertical edge starts as a thin line (true open-loop) and stays so —
  // the "essentially vertical" claim is the whole point.
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <TraceIn d={`M ${G.ax0} ${G.ayMid} L ${G.ax1} ${G.ayMid}`}
          stroke="var(--chalk-300)" strokeWidth={1.5}
          duration={0.6} delay={0.0}/>
        <TraceIn d={`M ${G.axMid} ${G.ay0} L ${G.axMid} ${G.ay1}`}
          stroke="var(--chalk-300)" strokeWidth={1.5}
          duration={0.6} delay={0.3}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.ax1 + 10} y={G.ayMid + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.6}>in</tspan>
          </text>
          <text x={G.axMid + 8} y={G.ay1 - 8}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.6}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* V_ref tick on the V_in axis */}
        <SvgFadeIn duration={0.35} delay={1.0}>
          <line x1={G.axMid} y1={G.ayMid - 5} x2={G.axMid} y2={G.ayMid + 5}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.axMid + 6} y={G.ayMid + 22}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>
            V<tspan baselineShift="sub" fontSize={G.fontAxis * 0.6}>ref</tspan>
          </text>
        </SvgFadeIn>

        {/* +V_sat and -V_sat ticks on the V_out axis */}
        <SvgFadeIn duration={0.35} delay={1.0}>
          <line x1={G.axMid - 5} y1={G.ay1 + 20} x2={G.axMid + 5} y2={G.ay1 + 20}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.axMid - 12} y={G.ay1 + 24}
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end">+V_sat</text>
          <line x1={G.axMid - 5} y1={G.ay0 - 20} x2={G.axMid + 5} y2={G.ay0 - 20}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.axMid - 12} y={G.ay0 - 16}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end">−V_sat</text>
        </SvgFadeIn>

        {/* Step function — three segments. Trace them in order so the
            "essentially vertical" jump reads as a deliberate slam. */}
        <TraceIn d={`M ${G.ax0 + 6} ${G.ay0 - 20} L ${G.axMid} ${G.ay0 - 20}`}
          stroke="var(--rose-300)" strokeWidth={3}
          duration={0.7} delay={1.6}/>
        <TraceIn d={`M ${G.axMid} ${G.ay0 - 20} L ${G.axMid} ${G.ay1 + 20}`}
          stroke="var(--amber-400)" strokeWidth={3}
          duration={0.5} delay={2.4}/>
        <TraceIn d={`M ${G.axMid} ${G.ay1 + 20} L ${G.ax1 - 6} ${G.ay1 + 20}`}
          stroke="var(--teal-400)" strokeWidth={3}
          duration={0.7} delay={3.0}/>

        {/* Region annotations — "V_out = −V_sat" below the V_ref tick, etc. */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={(G.ax0 + G.axMid) / 2} y={G.ay0 - 40} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12}>V_in &lt; V_ref</text>
          <text x={(G.axMid + G.ax1) / 2} y={G.ay1 + 4} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={12}>V_in &gt; V_ref</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={13} letterSpacing="0.02em">
            an infinite-gain step, in practice — the analog input falls into one of two buckets
          </text>
        </SvgFadeIn>

        {/* Suppress unused warning on localTime — used by Sprite gating only */}
        {localTime < -1 && <text>{localTime}</text>}
      </svg>
    </div>
  );
}

// ─── Beat 4: Ramp → square — genuine motion ───────────────────────────────
// Drives a triangle V_in around V_ref, computes V_out as a comparator,
// and animates two synchronised scope traces (top: input, bottom: output).
// A cursor walks across both at the same x so the snap-on-crossing is
// unmistakable.
function RampToSquareBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.8;
  const SWEEP = Math.max(spriteDur - HOLD - 0.6, 1);
  const t = clamp((localTime - HOLD) / SWEEP, 0, 1);

  const G = portrait
    ? { vbW: 560, vbH: 700,
        scopeX: 60, scopeR: 500,
        topY0: 80,  topY1: 250,
        botY0: 360, botY1: 530,
        midTop: 165, midBot: 445,
        captionY: 670, font: 14 }
    : { vbW: 920, vbH: 460,
        scopeX: 80, scopeR: 820,
        topY0: 40,  topY1: 170,
        botY0: 230, botY1: 360,
        midTop: 105, midBot: 295,
        captionY: 430, font: 14 };

  const scopeW = G.scopeR - G.scopeX;
  // CYCLES triangle waves across the scope
  const CYCLES = 2.5;
  // Triangle in [-1, +1] for the input (V_ref maps to 0 in plot coords)
  function tri(u) {
    const x = (u * CYCLES) % 1;
    return x < 0.5 ? (4 * x - 1) : (3 - 4 * x);
  }
  // V_in scale: amplitude 0.85 of the half-scope, so peaks reach near edges
  const inAmp = (G.midTop - G.topY0) * 0.85;
  // V_out scale: amplitude 0.90 of the half-scope
  const outAmp = (G.midBot - G.botY0) * 0.90;

  // Build polylines as point lists at fixed resolution
  const SAMPLES = 240;
  // Reveal up to the current cursor position
  const revealMax = SAMPLES * t;
  const inPts = [];
  const outPts = [];
  for (let i = 0; i < SAMPLES; i++) {
    if (i > revealMax) break;
    const u = i / (SAMPLES - 1);
    const x = G.scopeX + u * scopeW;
    const vIn = tri(u);                      // [-1, +1]
    const vOut = vIn > 0 ? 1 : -1;           // comparator with V_ref = 0
    inPts.push(`${x.toFixed(1)},${(G.midTop - vIn * inAmp).toFixed(1)}`);
    outPts.push(`${x.toFixed(1)},${(G.midBot - vOut * outAmp).toFixed(1)}`);
  }
  const cursorX = G.scopeX + clamp(t, 0, 1) * scopeW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Two scope frames (top: V_in, bottom: V_out) */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          {/* top scope */}
          <rect x={G.scopeX} y={G.topY0} width={scopeW} height={G.topY1 - G.topY0}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.scopeX} y1={G.midTop} x2={G.scopeR} y2={G.midTop}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          <text x={G.scopeX - 8} y={G.midTop + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>V_ref</text>
          <text x={G.scopeR + 8} y={G.topY0 + 14}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>in</tspan>
          </text>

          {/* bottom scope */}
          <rect x={G.scopeX} y={G.botY0} width={scopeW} height={G.botY1 - G.botY0}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.scopeX} y1={G.midBot} x2={G.scopeR} y2={G.midBot}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          <text x={G.scopeX - 8} y={G.midBot + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
          <text x={G.scopeR + 8} y={G.botY0 + 14}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>out</tspan>
          </text>
          {/* +V_sat / -V_sat rail markers on the output scope — placed
              outside the frame edges so they don't collide with V_out. */}
          <text x={G.scopeR + 8} y={G.botY0 - 6}
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={11}>+V_sat</text>
          <text x={G.scopeR + 8} y={G.botY1 + 16}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11}>−V_sat</text>
        </SvgFadeIn>

        {/* Animated traces */}
        {inPts.length > 1 && (
          <polyline points={inPts.join(' ')}
            fill="none" stroke="var(--chalk-100)" strokeWidth={2.4}/>
        )}
        {outPts.length > 1 && (
          <polyline points={outPts.join(' ')}
            fill="none" stroke="var(--amber-300)" strokeWidth={2.4}/>
        )}

        {/* Synchronised cursor across both scopes */}
        {t > 0 && t < 1 && (
          <line x1={cursorX} y1={G.topY0} x2={cursorX} y2={G.botY1}
                stroke="var(--rose-400)" strokeWidth={1.4}
                opacity={0.85}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={13} letterSpacing="0.02em">
            every crossing of V_ref triggers an edge on V_out — analog in, digital out
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
          fontSize: portrait ? 28 : 38, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '24ch' : 'none',
          lineHeight: 1.25,
        }}>
        V<sub>out</sub> = sign(V<sub>in</sub> − V<sub>ref</sub>) · V<sub>sat</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '52ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        the bridge from analog to digital — one comparison at a time
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        zero-crossing detectors · level alarms · the front end of every ADC
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
