// Zener Clipper: A Diode That Caps the Peaks — Manimo lesson scene.
// A Zener diode in reverse conducts hard above its breakdown voltage V_Z,
// clamping the output to V_Z. With a sine input taller than V_Z, the
// peaks get sheared off flat. Genuine animation lives in Beat 4: a time
// cursor sweeps left-to-right, the input sine traces in, and the output
// follows the input below V_Z but clamps to V_Z above — both waveforms
// drawn live frame-by-frame from useSprite() localTime.
//
// Beats (timed to single-track narration in motion/ade/audio/zener-clipper/):
//    0.00– 4.34  Manimo intro: meet the diode that fights back at V_Z
//    4.34–12.03  I-V curve: forward knee at +0.7V, reverse breakdown at -V_Z
//   12.03–21.80  Circuit: series R + Zener-to-ground, output across the Zener
//   21.80–30.90  Live waveform sweep: input sine vs clipped output, cursor scrubs time
//   30.90–39.00  Takeaway: below V_Z → pass-through, above V_Z → clamp
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 4 is the value-driven motion: a moving pen tip + dual waveform
//     drawn from a localTime-driven phase so input and output stay in sync
//     and the clipping is visibly synchronous with the input sine peaks.

const SCENE_DURATION = 39;

const NARRATION = [
  /*  0.00– 4.34 */ "A diode that fights back when you push too hard — meet the Zener.",
  /*  4.34–12.03 */ "A Zener has an ordinary forward knee — but in reverse, it breaks down sharply at minus V Z and conducts hard.",
  /* 12.03–21.80 */ "Wire a Zener across the output with a series resistor — once the input pushes above V Z, the Zener clamps the output and the resistor soaks up the rest.",
  /* 21.80–30.90 */ "Feed in a sine wave taller than V Z. The output rides the sine where it stays below the clamp, but the peaks get sheared off flat at V Z.",
  /* 30.90–39.00 */ "The Zener acts like a voltage ceiling — anything above V Z gets clipped, anything below passes through unchanged.",
];

// Single continuous narration track produced by `npm run audio zener-clipper`.
// Beat <Sprite start> values below match audioStart offsets in
// motion/ade/audio/zener-clipper/manifest.json (overwritten by rewire-scene.js).
const NARRATION_AUDIO = 'audio/zener-clipper/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="diodes"
      title="Zener Clipper"
      duration={SCENE_DURATION}
      introEnd={4.34}
      introCaption="Push too hard on a Zener — it pushes back at exactly V Z."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.34} end={12.03}>
        <IVCurveBeat />
      </Sprite>

      <Sprite start={12.03} end={21.8}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={21.8} end={30.9}>
        <WaveformBeat />
      </Sprite>

      <Sprite start={30.9} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// Zener diode symbol: triangle pointing into a bent cathode bar.
// `cx, cy` is the centre of the symbol; horizontal flow assumed (anode left, cathode right).
function ZenerSymbol({ cx, cy, color, size = 14 }) {
  const triHalf = size * 0.9;
  // Anode on the left at (cx - size, cy), triangle points right to cathode at (cx, cy).
  // Bent cathode bar with the standard Z-flag bends.
  return (
    <g>
      {/* Triangle (anode → cathode arrow) */}
      <path d={`M ${cx - size} ${cy - triHalf} L ${cx - size} ${cy + triHalf} L ${cx} ${cy} Z`}
            fill={color} stroke={color} strokeWidth={1.5}/>
      {/* Cathode bar with Zener bends */}
      <path d={`M ${cx - 6} ${cy - triHalf - 6} L ${cx} ${cy - triHalf}
                 L ${cx} ${cy + triHalf} L ${cx + 6} ${cy + triHalf + 6}`}
            fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
    </g>
  );
}

// Zigzag resistor (horizontal).
function zigzagH(xLeft, xRight, cy, amp = 12, n = 8) {
  const dx = (xRight - xLeft) / n;
  const pts = [`M ${xLeft} ${cy}`];
  for (let i = 1; i < n; i++) {
    const x = xLeft + i * dx;
    const y = cy + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${xRight} ${cy}`);
  return pts.join(' ');
}

// ─── Beat 2: I-V curve ───────────────────────────────────────────────────
function IVCurveBeat() {
  const portrait = usePortrait();

  // Centred axes — the curve crosses the origin and has a knee in each
  // quadrant (forward at +0.7V; reverse breakdown at -V_Z).
  const G = portrait
    ? { vbW: 560, vbH: 540, axOx: 280, axOy: 270, axW: 230, axH: 220,
        fontMain: 18, fontLabel: 15, captionY: 510 }
    : { vbW: 760, vbH: 380, axOx: 380, axOy: 190, axW: 320, axH: 150,
        fontMain: 18, fontLabel: 15, captionY: 366 };

  // Forward curve: gentle below 0.7V then steep rise.
  // Path in svg coords (origin at axOx, axOy; +x right, -y up).
  const knee = 0.7; // forward knee voltage (volts, normalised to 1.0 = end of x-axis)
  // Use parametric points in volts then map.
  // Forward: from V=0 (i=0) up to V=1.0 (i=1.0). Knee at V=0.55 (scaled).
  const xV = (v) => G.axOx + v * G.axW;
  const yI = (i) => G.axOy - i * G.axH;
  // Forward curve points
  const fwdPts = [];
  for (let n = 0; n <= 30; n++) {
    const v = (n / 30) * 1.0;
    let i;
    if (v < 0.55) i = 0.02 * (v / 0.55);
    else i = 0.04 + Math.pow((v - 0.55) / 0.45, 1.5) * 0.95;
    if (i > 1.0) i = 1.0;
    fwdPts.push(`${n === 0 ? 'M' : 'L'} ${xV(v).toFixed(1)} ${yI(i).toFixed(1)}`);
  }
  const fwdPath = fwdPts.join(' ');

  // Reverse curve: nearly zero from V=0 going left, then breaks down at V=-Vz.
  const Vz = 0.7; // reverse breakdown voltage (normalised; same magnitude as forward knee on x scale)
  const revPts = [];
  for (let n = 0; n <= 30; n++) {
    const v = -(n / 30) * 1.0;     // 0 → -1.0
    let i;
    if (-v < Vz) i = -0.02 * (-v / Vz);
    else i = -0.04 - Math.pow((-v - Vz) / 0.3, 1.5) * 0.95;
    if (i < -1.0) i = -1.0;
    revPts.push(`${n === 0 ? 'M' : 'L'} ${xV(v).toFixed(1)} ${yI(i).toFixed(1)}`);
  }
  const revPath = revPts.join(' ');

  // V_Z marker on the negative x-axis.
  const vzX = xV(-Vz);
  const vzKneeY = yI(-0.04);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* x-axis (V) */}
        <TraceIn d={`M ${G.axOx - G.axW} ${G.axOy} L ${G.axOx + G.axW} ${G.axOy}`}
          stroke="var(--chalk-300)" strokeWidth={1.4} duration={0.7} delay={0}/>
        {/* y-axis (I) */}
        <TraceIn d={`M ${G.axOx} ${G.axOy + G.axH} L ${G.axOx} ${G.axOy - G.axH}`}
          stroke="var(--chalk-300)" strokeWidth={1.4} duration={0.7} delay={0}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.3} delay={0.6}>
          <text x={G.axOx + G.axW + 14} y={G.axOy + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V</text>
          <text x={G.axOx + 10} y={G.axOy - G.axH - 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>I</text>
        </SvgFadeIn>

        {/* Forward curve */}
        <TraceIn d={fwdPath}
          stroke="var(--amber-400)" strokeWidth={2.4} fill="none"
          duration={1.0} delay={0.8}/>
        <SvgFadeIn duration={0.3} delay={1.8}>
          <text x={xV(0.78)} y={yI(0.55)}
                fill="var(--amber-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">forward</text>
        </SvgFadeIn>

        {/* Reverse curve */}
        <TraceIn d={revPath}
          stroke="var(--rose-400)" strokeWidth={2.4} fill="none"
          duration={1.1} delay={2.0}/>
        <SvgFadeIn duration={0.3} delay={3.2}>
          <text x={xV(-0.8)} y={yI(-0.55) + 6}
                fill="var(--rose-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">reverse</text>
        </SvgFadeIn>

        {/* V_Z marker — vertical drop line + label */}
        <SvgFadeIn duration={0.3} delay={3.0}>
          <line x1={vzX} y1={G.axOy + 6} x2={vzX} y2={G.axOy - 6}
                stroke="var(--rose-300)" strokeWidth={1.6}/>
          <text x={vzX} y={G.axOy + 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>−V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>Z</tspan></text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            sharp breakdown at −V<tspan baselineShift="sub" fontSize={11}>Z</tspan> — the operating principle of a Zener
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Circuit — series R + Zener clamp ────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();

  // Horizontal layout: source on the left, R in series, Zener to ground,
  // output node between R and Zener cathode.
  const G = portrait
    ? { vbW: 560, vbH: 540, srcX: 110, midY: 200, gndY: 380,
        rLeftX: 170, rRightX: 330,
        nodeX: 360, zenCx: 360, zenCy: 280,
        outX: 470, captionY: 510, fontMain: 20, fontLabel: 16, zenSize: 14 }
    : { vbW: 760, vbH: 380, srcX: 140, midY: 160, gndY: 280,
        rLeftX: 200, rRightX: 380,
        nodeX: 420, zenCx: 420, zenCy: 220,
        outX: 580, captionY: 360, fontMain: 20, fontLabel: 16, zenSize: 14 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Source: open circle with V_in label, vertical line down to ground */}
        <SvgFadeIn duration={0.35} delay={0}>
          <circle cx={G.srcX} cy={G.midY} r={14}
                  fill="var(--bg-canvas)" stroke="var(--chalk-200)" strokeWidth={1.8}/>
          <line x1={G.srcX - 6} y1={G.midY} x2={G.srcX + 6} y2={G.midY}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={G.srcX} y1={G.midY - 4} x2={G.srcX} y2={G.midY + 4}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <text x={G.srcX - 22} y={G.midY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan></text>
        </SvgFadeIn>

        {/* Wire: source → R left */}
        <TraceIn d={`M ${G.srcX + 14} ${G.midY} L ${G.rLeftX} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.4} delay={0.4}/>
        {/* R: zigzag horizontal */}
        <TraceIn d={zigzagH(G.rLeftX, G.rRightX, G.midY, 12, 8)}
          stroke="var(--amber-400)" strokeWidth={2.2}
          duration={0.9} delay={0.8}/>
        {/* R label */}
        <SvgFadeIn duration={0.3} delay={1.4}>
          <text x={(G.rLeftX + G.rRightX) / 2} y={G.midY - 22}
                textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>R</text>
        </SvgFadeIn>

        {/* Wire: R right → output node */}
        <TraceIn d={`M ${G.rRightX} ${G.midY} L ${G.nodeX} ${G.midY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={1.7}/>

        {/* Output node dot + V_out tap to the right */}
        <SvgFadeIn duration={0.3} delay={2.0}>
          <circle cx={G.nodeX} cy={G.midY} r={3.5} fill="var(--chalk-100)"/>
          <line x1={G.nodeX} y1={G.midY} x2={G.outX - 8} y2={G.midY}
                stroke="var(--amber-300)" strokeWidth={1.4}
                strokeDasharray="3 4"/>
          <text x={G.outX} y={G.midY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan></text>
        </SvgFadeIn>

        {/* Vertical wire: node → Zener anode (rotated 90deg so Zener is vertical) */}
        <TraceIn d={`M ${G.nodeX} ${G.midY} L ${G.nodeX} ${G.zenCy - 16}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={1.8}/>
        {/* Zener — rotated to point downward (cathode up, anode down for reverse-biased Zener regulator) */}
        <g transform={`translate(${G.zenCx} ${G.zenCy}) rotate(90)`}>
          <SvgFadeIn duration={0.4} delay={1.6}>
            <ZenerSymbol cx={0} cy={0} color="var(--amber-400)" size={G.zenSize}/>
          </SvgFadeIn>
        </g>
        {/* Wire: Zener cathode → ground */}
        <TraceIn d={`M ${G.nodeX} ${G.zenCy + 16} L ${G.nodeX} ${G.gndY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={2.2}/>

        {/* Source low side → ground bus */}
        <TraceIn d={`M ${G.srcX} ${G.midY + 14} L ${G.srcX} ${G.gndY} L ${G.nodeX} ${G.gndY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>

        {/* Ground triangle */}
        <SvgFadeIn duration={0.3} delay={2.4}>
          <line x1={G.nodeX - 10} y1={G.gndY} x2={G.nodeX + 10} y2={G.gndY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.nodeX - 6} y1={G.gndY + 5} x2={G.nodeX + 6} y2={G.gndY + 5}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={G.nodeX - 3} y1={G.gndY + 10} x2={G.nodeX + 3} y2={G.gndY + 10}
                stroke="var(--chalk-200)" strokeWidth={1.4}/>
        </SvgFadeIn>

        {/* V_Z label next to Zener */}
        <SvgFadeIn duration={0.3} delay={2.6}>
          <text x={G.zenCx + 30} y={G.zenCy + 6}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.6}>Z</tspan></text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            R drops the excess — V<tspan baselineShift="sub" fontSize={11}>out</tspan> stays at V<tspan baselineShift="sub" fontSize={11}>Z</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Live waveform — input sine vs clipped output ────────────────
function WaveformBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry per aspect — wide time-domain canvas in landscape, taller stack in portrait.
  const G = portrait
    ? { vbW: 560, vbH: 600, axOx: 60, axOy: 320, axW: 440, axH: 260,
        labelsX: 510, fontMain: 18, captionY: 570 }
    : { vbW: 880, vbH: 380, axOx: 90, axOy: 200, axW: 700, axH: 150,
        labelsX: 800, fontMain: 18, captionY: 370 };

  // Two periods of sine across the axis. Vz at 0.6 of peak.
  const peak = 1.0;
  const Vz = 0.6 * peak;
  const cycles = 2;
  const xT = (t) => G.axOx + t * G.axW;             // t ∈ [0, 1]
  const yV = (v) => G.axOy - (v / peak) * G.axH * 0.85; // headroom

  function sineAt(t) {
    return Math.sin(t * 2 * Math.PI * cycles);
  }
  function clipAt(t) {
    const s = sineAt(t);
    return s > Vz ? Vz : s;
  }

  // Live pen cursor: tInput is the leading edge of the input sine
  // (starts after the axes draw in). 5.4s sweep window so the full curve
  // is revealed before the beat ends.
  const sweepStart = 1.6;
  const sweepEnd = 7.0;
  const sweepNorm = Math.max(0, Math.min(1, (localTime - sweepStart) / (sweepEnd - sweepStart)));
  const cursorT = sweepNorm;

  // Build path strings up to cursorT.
  function buildPath(fn, tEnd, samples = 200) {
    if (tEnd <= 0) return '';
    const pts = [];
    for (let n = 0; n <= samples; n++) {
      const t = (n / samples) * tEnd;
      pts.push(`${n === 0 ? 'M' : 'L'} ${xT(t).toFixed(2)} ${yV(fn(t)).toFixed(2)}`);
    }
    return pts.join(' ');
  }
  const inPath = buildPath(sineAt, cursorT);
  const outPath = buildPath(clipAt, cursorT);

  // Cursor position
  const curX = xT(cursorT);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Time axis (x) */}
        <TraceIn d={`M ${G.axOx} ${G.axOy} L ${G.axOx + G.axW} ${G.axOy}`}
          stroke="var(--chalk-300)" strokeWidth={1.4} duration={0.7} delay={0}/>
        {/* Voltage axis (y, only positive side shown) */}
        <TraceIn d={`M ${G.axOx} ${G.axOy + G.axH * 0.6} L ${G.axOx} ${G.axOy - G.axH}`}
          stroke="var(--chalk-300)" strokeWidth={1.4} duration={0.7} delay={0}/>

        {/* Axis labels */}
        <SvgFadeIn duration={0.3} delay={0.6}>
          <text x={G.axOx + G.axW + 14} y={G.axOy + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>t</text>
          <text x={G.axOx + 6} y={G.axOy - G.axH - 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V</text>
        </SvgFadeIn>

        {/* V_Z clamp line */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <line x1={G.axOx} y1={yV(Vz)} x2={G.axOx + G.axW} y2={yV(Vz)}
                stroke="var(--rose-300)" strokeWidth={1.4}
                strokeDasharray="6 5" opacity={0.85}/>
          <text x={G.axOx + G.axW + 14} y={yV(Vz) + 5}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>Z</tspan></text>
        </SvgFadeIn>

        {/* Input sine (violet, drawn first so the amber output line — which
            equals the input below V_Z — sits crisply on top). Above V_Z
            the input continues past the clamp and the violet shows through. */}
        {inPath && (
          <path d={inPath} fill="none" stroke="var(--violet-400)" strokeWidth={2.0}
                strokeDasharray="6 4" opacity={0.95}/>
        )}
        {/* Output (amber-400) — solid, drawn on top so the clipped peaks
            visibly clamp to the V_Z dashed line. */}
        {outPath && (
          <path d={outPath} fill="none" stroke="var(--amber-400)" strokeWidth={2.6}/>
        )}

        {/* Live cursor */}
        {sweepNorm > 0 && sweepNorm < 1 && (
          <>
            <line x1={curX} y1={G.axOy - G.axH * 0.95} x2={curX} y2={G.axOy + G.axH * 0.45}
                  stroke="var(--rose-400)" strokeWidth={1} opacity={0.7}
                  strokeDasharray="2 3"/>
            <circle cx={curX} cy={yV(sineAt(cursorT))} r={4}
                    fill="var(--violet-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
            <circle cx={curX} cy={yV(clipAt(cursorT))} r={4}
                    fill="var(--amber-300)" stroke="var(--amber-400)" strokeWidth={1.2}/>
          </>
        )}

        {/* Legend */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <line x1={G.labelsX - 38} y1={portrait ? 60 : 30}
                x2={G.labelsX - 18} y2={portrait ? 60 : 30}
                stroke="var(--violet-400)" strokeWidth={2}
                strokeDasharray="6 4"/>
          <text x={G.labelsX - 14} y={portrait ? 65 : 35}
                fill="var(--chalk-100)" fontFamily="var(--font-sans)"
                fontSize={13}>V<tspan baselineShift="sub" fontSize={9}>in</tspan></text>
          <line x1={G.labelsX - 38} y1={portrait ? 88 : 56}
                x2={G.labelsX - 18} y2={portrait ? 88 : 56}
                stroke="var(--amber-400)" strokeWidth={2.4}/>
          <text x={G.labelsX - 14} y={portrait ? 93 : 61}
                fill="var(--amber-300)" fontFamily="var(--font-sans)"
                fontSize={13}>V<tspan baselineShift="sub" fontSize={9}>out</tspan></text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            below the dashed line — pass-through. Above — clamp.
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
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '50ch',
          lineHeight: 1.3,
        }}>
        Below V<sub>Z</sub>: pass-through. Above V<sub>Z</sub>: clamp.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (a voltage ceiling — regulators, protection, references)
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
