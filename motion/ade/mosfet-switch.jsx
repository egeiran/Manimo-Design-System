// The MOSFET as a Switch: How a Voltage Opens a Channel — Manimo lesson scene.
// NMOS in cutoff (V_GS < V_t) vs conducting (V_GS > V_t). The genuine
// motion lives in Beat 3, where V_GS sweeps from 0 up to ~3V across the
// beat: charge dots fill the channel the moment V_GS crosses V_t, and the
// I_D vs V_GS curve traces in synchronously with the sweep. Beat 4 then
// reuses the same channel logic to toggle an inverter — V_in flips, V_out
// flips opposite, the schematic's drain dot lights up when ON.
//
// Beats (timed to single-track narration in motion/ade/audio/mosfet-switch/):
//    0.00– 6.71  Manimo intro + hook caption
//    6.71–18.65  NMOS symbol + cross-section, channel empty
//   18.65–30.76  V_GS sweep — channel fills, I_D curve traces  (genuine motion)
//   30.76–46.29  Wire it as an inverter — V_in toggles, V_out flips  (genuine motion)
//   46.29–54.00  Takeaway
//
// Authoring notes:
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.
//   • Beats 2–3 share crossSectionGeometry() so the channel region lines up.
//   • Beat 3 sweeps V_GS as a smooth ramp on localTime; the channel charge
//     dots and the I_D plot both read from the same sweep variable.

const SCENE_DURATION = 54;

const NARRATION = [
  /*  0.00– 6.71 */ "One voltage at the gate decides whether current flows from drain to source. Meet the MOSFET as a switch.",
  /*  6.71–18.65 */ "An n channel MOSFET has three terminals — gate, drain and source. Between drain and source sits a slice of silicon that conducts only when a channel of electrons forms underneath the gate.",
  /* 18.65–30.76 */ "Push V G S past the threshold V t and electrons get pulled up into the channel. Now drain to source is a conducting path and the drain current jumps from zero up to its on value.",
  /* 30.76–46.29 */ "Wire the drain through a pull up resistor to V D D. Now a high input grounds the output through the channel; a low input lets the resistor pull V out back up. That is a logic inverter built from one transistor and one resistor.",
  /* 46.29–54.00 */ "Every digital chip is a city of these little switches — billions of channels opening and closing in step with a clock.",
];

const NARRATION_AUDIO = 'audio/mosfet-switch/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="transistors"
      title="The MOSFET as a Switch: How a Voltage Opens a Channel"
      duration={SCENE_DURATION}
      introEnd={6.71}
      introCaption="One pin opens or closes the channel — meet the MOSFET as a switch."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.71} end={18.65}>
        <SymbolBeat />
      </Sprite>

      <Sprite start={18.65} end={30.76}>
        <SweepBeat />
      </Sprite>

      <Sprite start={30.76} end={46.29}>
        <InverterBeat />
      </Sprite>

      <Sprite start={46.29} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared: NMOS schematic symbol ────────────────────────────────────────
// Centred at (cx, cy). Gate on the left, drain at top, source at bottom.
// Body arrow points toward the gate (n-channel convention).
function NmosSymbol({ cx, cy, scale = 1, color = 'var(--amber-400)' }) {
  const u = 24 * scale;             // unit length
  const gx = cx - u * 1.6;          // gate stub end x
  const px = cx - u * 0.5;          // vertical channel line x
  const drainY = cy - u * 1.4;
  const sourceY = cy + u * 1.4;
  const gateY = cy;
  return (
    <g>
      {/* Gate stub */}
      <line x1={gx} y1={gateY} x2={px - u * 0.3} y2={gateY}
            stroke={color} strokeWidth={2.2}/>
      {/* Gate vertical bar */}
      <line x1={px - u * 0.3} y1={cy - u * 0.95} x2={px - u * 0.3} y2={cy + u * 0.95}
            stroke={color} strokeWidth={2.2}/>
      {/* Channel vertical line */}
      <line x1={px} y1={cy - u * 0.95} x2={px} y2={cy + u * 0.95}
            stroke={color} strokeWidth={2.2} strokeDasharray="3 4"/>
      {/* Drain stub: down from drainY to channel-top */}
      <line x1={px} y1={cy - u * 0.95} x2={cx + u * 0.6} y2={cy - u * 0.95}
            stroke={color} strokeWidth={2.2}/>
      <line x1={cx + u * 0.6} y1={cy - u * 0.95} x2={cx + u * 0.6} y2={drainY}
            stroke={color} strokeWidth={2.2}/>
      {/* Source stub: up from sourceY to channel-bottom */}
      <line x1={px} y1={cy + u * 0.95} x2={cx + u * 0.6} y2={cy + u * 0.95}
            stroke={color} strokeWidth={2.2}/>
      <line x1={cx + u * 0.6} y1={cy + u * 0.95} x2={cx + u * 0.6} y2={sourceY}
            stroke={color} strokeWidth={2.2}/>
      {/* Body arrow (n-channel: points at the channel) */}
      <line x1={px} y1={cy} x2={px - u * 0.3 - 1} y2={cy}
            stroke={color} strokeWidth={2.2}/>
      <path d={`M ${px - u * 0.05} ${cy - u * 0.18} L ${px} ${cy} L ${px - u * 0.05} ${cy + u * 0.18} Z`}
            fill={color}/>
    </g>
  );
}

// ─── Shared: NMOS cross-section ───────────────────────────────────────────
// Drawn left-to-right inside (x, y, w, h). Returns the channel rectangle so
// callers can place charge dots inside it.
function CrossSection({ x, y, w, h, fillFrac = 0, label = true }) {
  // Layer thicknesses (vertical fractions of h).
  const oxideH = h * 0.05;
  const gateH = h * 0.13;
  const channelTop = y + gateH + oxideH;
  const channelH = h * 0.16;
  const subTop = channelTop + channelH;
  const subH = h - (gateH + oxideH + channelH);

  const wDiff = w * 0.18;          // n+ source / drain width
  const sourceX = x;
  const drainX = x + w - wDiff;
  const channelLeft = x + wDiff;
  const channelRight = x + w - wDiff;
  const channelW = channelRight - channelLeft;

  // Fill fraction → number of dot rows. Dots are clamped to the channel rect.
  const NUM_DOTS = 18;
  const dots = [];
  if (fillFrac > 0.001) {
    const rows = 2;
    for (let i = 0; i < NUM_DOTS; i++) {
      const u = i / NUM_DOTS;
      const cxd = channelLeft + 6 + u * (channelW - 12);
      const row = i % rows;
      const cyd = channelTop + (row === 0 ? channelH * 0.32 : channelH * 0.68);
      const opacity = clamp((fillFrac - u * 0.15) * 1.6, 0, 0.95);
      dots.push({ cxd, cyd, opacity });
    }
  }

  return (
    <g>
      {/* p-substrate body */}
      <rect x={x} y={subTop} width={w} height={subH}
            fill="rgba(155,140,255,0.18)"
            stroke="var(--violet-400)" strokeWidth={1}/>
      <text x={x + w - 10} y={subTop + subH - 8} textAnchor="end"
            fill="var(--violet-400)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.08em">p-substrate</text>

      {/* Channel region (rendered first, dots overlay) */}
      <rect x={channelLeft} y={channelTop} width={channelW} height={channelH}
            fill="rgba(232,220,193,0.06)"
            stroke="var(--chalk-300)" strokeWidth={0.8}
            strokeDasharray="2 3"/>

      {/* n+ source (left) */}
      <rect x={sourceX} y={channelTop} width={wDiff} height={channelH + 4}
            fill="rgba(244,184,96,0.22)"
            stroke="var(--amber-400)" strokeWidth={1}/>
      <text x={sourceX + wDiff / 2} y={channelTop + channelH / 2 + 5}
            textAnchor="middle"
            fill="var(--amber-300)" fontFamily="var(--font-mono)"
            fontSize={12}>n+</text>

      {/* n+ drain (right) */}
      <rect x={drainX} y={channelTop} width={wDiff} height={channelH + 4}
            fill="rgba(244,184,96,0.22)"
            stroke="var(--amber-400)" strokeWidth={1}/>
      <text x={drainX + wDiff / 2} y={channelTop + channelH / 2 + 5}
            textAnchor="middle"
            fill="var(--amber-300)" fontFamily="var(--font-mono)"
            fontSize={12}>n+</text>

      {/* Charge dots in the channel */}
      {dots.map((d, i) => (
        <circle key={i} cx={d.cxd} cy={d.cyd} r={2.4}
                fill="var(--rose-300)" opacity={d.opacity}/>
      ))}

      {/* Oxide */}
      <rect x={channelLeft} y={y + gateH} width={channelW} height={oxideH}
            fill="rgba(232,220,193,0.10)"
            stroke="var(--chalk-300)" strokeWidth={0.8}/>

      {/* Gate (poly) */}
      <rect x={channelLeft - 4} y={y} width={channelW + 8} height={gateH}
            fill="rgba(244,184,96,0.45)"
            stroke="var(--amber-300)" strokeWidth={1.2}/>

      {/* Labels */}
      {label && (
        <>
          <text x={sourceX + wDiff / 2} y={subTop + subH + 16}
                textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>S</text>
          <text x={drainX + wDiff / 2} y={subTop + subH + 16}
                textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>D</text>
          <text x={channelLeft + channelW / 2} y={y - 6}
                textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>G</text>
        </>
      )}
    </g>
  );
}

// ─── Beat 2: Symbol + cross-section ──────────────────────────────────────
function SymbolBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 660,
        symCx: 300, symCy: 160, symScale: 1.0,
        csX: 80, csY: 320, csW: 440, csH: 200,
        captionY: 580 }
    : { vbW: 1100, vbH: 460,
        symCx: 280, symCy: 240, symScale: 1.2,
        csX: 540, csY: 110, csW: 480, csH: 220,
        captionY: 420 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Symbol */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          <NmosSymbol cx={G.symCx} cy={G.symCy} scale={G.symScale}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.symCx - 24 * G.symScale * 1.95} y={G.symCy + 5}
                textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>G</text>
          <text x={G.symCx + 24 * G.symScale * 0.6 + 14} y={G.symCy - 24 * G.symScale * 1.4 + 4}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>D</text>
          <text x={G.symCx + 24 * G.symScale * 0.6 + 14} y={G.symCy + 24 * G.symScale * 1.4 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>S</text>
        </SvgFadeIn>

        {/* Section title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.symCx} y={G.symCy - 24 * G.symScale * 2.1}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">SCHEMATIC</text>
          <text x={G.csX + G.csW / 2} y={G.csY - 22}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">CROSS SECTION</text>
        </SvgFadeIn>

        {/* Cross-section, no charge dots yet */}
        <SvgFadeIn duration={0.6} delay={1.4}>
          <CrossSection x={G.csX} y={G.csY} w={G.csW} h={G.csH} fillFrac={0}/>
        </SvgFadeIn>

        {/* Channel-region callout */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <text x={G.csX + G.csW / 2} y={G.csY + G.csH * 0.55}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">CHANNEL · empty</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            no electrons in the channel — drain and source are isolated
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: V_GS sweep — channel forms, I_D traces ──────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 620, vbH: 720,
        csX: 80, csY: 100, csW: 460, csH: 220,
        gateLabelY: 70, sliderY: 50,
        plotX: 110, plotY: 400, plotW: 420, plotH: 240,
        captionY: 700 }
    : { vbW: 1180, vbH: 460,
        csX: 80, csY: 110, csW: 500, csH: 220,
        gateLabelY: 80, sliderY: 60,
        plotX: 660, plotY: 80, plotW: 460, plotH: 290,
        captionY: 440 };

  // Sweep V_GS smoothly from 0 → 3V over the beat (with a 0.5s settle at start).
  const SWEEP_START = 0.5;
  const SWEEP_DUR = Math.max(spriteDur - SWEEP_START - 1.5, 1);
  const sweepFrac = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const VGS_MAX = 3.0;
  const V_T = 1.0;
  const vgs = sweepFrac * VGS_MAX;

  // I_D model: simplified saturation current ∝ (V_GS - V_t)² when V_GS > V_t.
  const idOf = v => v > V_T ? Math.min(1, Math.pow(v - V_T, 2) / Math.pow(VGS_MAX - V_T, 2)) : 0;
  const idNorm = idOf(vgs);

  // Channel fill follows the on-current — 0 below V_t, ramps as V_GS rises.
  const fillFrac = vgs > V_T ? clamp((vgs - V_T) / (VGS_MAX - V_T), 0, 1) : 0;

  // Build the I_D vs V_GS curve up to the cursor.
  const samples = Math.max(2, Math.floor(sweepFrac * 120));
  const curvePts = [];
  for (let i = 0; i <= samples; i++) {
    const u = samples > 0 ? i / samples : 0;
    const v = u * vgs;
    const x = G.plotX + (v / VGS_MAX) * G.plotW;
    const y = G.plotY + G.plotH - idOf(v) * G.plotH;
    curvePts.push((i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  const curveD = curvePts.join(' ');

  // V_t tick on the V_GS axis.
  const vtX = G.plotX + (V_T / VGS_MAX) * G.plotW;
  // Slider knob position above the gate.
  const sliderX = G.csX + (vgs / VGS_MAX) * G.csW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* V_GS slider track + knob */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.csX} y1={G.sliderY} x2={G.csX + G.csW} y2={G.sliderY}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.csX} y={G.sliderY - 8}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">V_GS  0 V</text>
          <text x={G.csX + G.csW} y={G.sliderY - 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">{VGS_MAX.toFixed(1)} V</text>
        </SvgFadeIn>
        {/* Knob */}
        <circle cx={sliderX} cy={G.sliderY} r={6}
                fill="var(--amber-300)"
                stroke="var(--amber-400)" strokeWidth={1.5}/>
        {/* Live V_GS readout */}
        <text x={sliderX} y={G.sliderY - 12} textAnchor="middle"
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={13}>{vgs.toFixed(2)} V</text>

        {/* Section title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.csX + G.csW / 2} y={G.gateLabelY}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">CROSS SECTION</text>
          <text x={G.plotX + G.plotW / 2} y={G.plotY - 22}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">I<tspan baselineShift="sub" fontSize={9}>D</tspan> vs V<tspan baselineShift="sub" fontSize={9}>GS</tspan></text>
        </SvgFadeIn>

        {/* Cross-section with live channel fill */}
        <CrossSection x={G.csX} y={G.csY} w={G.csW} h={G.csH} fillFrac={fillFrac}/>

        {/* I_D plot — axes */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={G.plotX} y1={G.plotY} x2={G.plotX} y2={G.plotY + G.plotH}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={G.plotX} y1={G.plotY + G.plotH} x2={G.plotX + G.plotW} y2={G.plotY + G.plotH}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <text x={G.plotX - 8} y={G.plotY + 14}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>I<tspan baselineShift="sub" fontSize={10}>D</tspan></text>
          <text x={G.plotX + G.plotW + 8} y={G.plotY + G.plotH + 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V<tspan baselineShift="sub" fontSize={10}>GS</tspan></text>
        </SvgFadeIn>

        {/* V_t tick + label */}
        <SvgFadeIn duration={0.3} delay={0.5}>
          <line x1={vtX} y1={G.plotY + G.plotH - 5} x2={vtX} y2={G.plotY + G.plotH + 8}
                stroke="var(--rose-400)" strokeWidth={1.6}/>
          <text x={vtX} y={G.plotY + G.plotH + 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>V<tspan baselineShift="sub" fontSize={10}>t</tspan></text>
        </SvgFadeIn>

        {/* I_D curve traced so far */}
        {sweepFrac > 0.001 && (
          <path d={curveD} fill="none"
                stroke="var(--rose-400)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Cursor + live I_D dot */}
        {sweepFrac > 0.01 && (
          <>
            <line x1={G.plotX + (vgs / VGS_MAX) * G.plotW} y1={G.plotY + 4}
                  x2={G.plotX + (vgs / VGS_MAX) * G.plotW} y2={G.plotY + G.plotH - 4}
                  stroke="var(--amber-300)" strokeWidth={1}
                  strokeDasharray="2 4" opacity={0.45}/>
            <circle cx={G.plotX + (vgs / VGS_MAX) * G.plotW}
                    cy={G.plotY + G.plotH - idNorm * G.plotH}
                    r={4.5} fill="var(--amber-300)"/>
          </>
        )}

        {/* State badge */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <text x={G.csX + G.csW / 2} y={G.csY + G.csH + 38}
                textAnchor="middle"
                fill={vgs > V_T ? 'var(--amber-300)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={14}
                letterSpacing="0.16em">
            {vgs > V_T ? 'CHANNEL · ON' : 'CHANNEL · OFF'}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            below V_t — channel empty, no current. Above V_t — channel forms, current flows.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Inverter — V_in toggles, V_out flips ────────────────────────
function InverterBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 620, vbH: 720,
        circX: 90, circY: 60, circW: 440, circH: 360,
        scopeX: 90, scopeY: 460, scopeW: 440, scopeH: 220,
        captionY: 700 }
    : { vbW: 1180, vbH: 460,
        circX: 80, circY: 50, circW: 460, circH: 360,
        scopeX: 620, scopeY: 70, scopeW: 480, scopeH: 320,
        captionY: 440 };

  // Square-wave V_in: 0 / 1 toggling every PERIOD seconds.
  const PERIOD = 2.6;
  const SETUP = 0.8;
  const tSig = Math.max(0, localTime - SETUP);
  const vinHigh = Math.floor(tSig / (PERIOD / 2)) % 2 === 1;
  const voutHigh = !vinHigh;

  // Build the V_in / V_out trace paths up to the cursor.
  const TRACE_DUR = Math.max(spriteDur - SETUP - 1.0, 1);
  const traceFrac = clamp(tSig / TRACE_DUR, 0, 1);
  const samples = Math.max(2, Math.floor(traceFrac * 240));
  const yMidIn = G.scopeY + G.scopeH * 0.28;
  const yMidOut = G.scopeY + G.scopeH * 0.72;
  const ampS = G.scopeH * 0.16;

  function buildSquare(invert) {
    const pts = [];
    for (let i = 0; i <= samples; i++) {
      const u = samples > 0 ? i / samples : 0;
      const tx = u * traceFrac * TRACE_DUR;
      const high = (Math.floor(tx / (PERIOD / 2)) % 2 === 1) !== invert;
      const x = G.scopeX + u * traceFrac * G.scopeW;
      const yMid = invert ? yMidOut : yMidIn;
      const y = high ? yMid - ampS : yMid + ampS;
      pts.push((i === 0 ? 'M' : 'L') + ` ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }
  const vinD = buildSquare(false);
  const voutD = buildSquare(true);

  // Schematic geometry (relative to the circuit panel).
  const cx = G.circX + G.circW * 0.55;
  const vddY = G.circY + 20;
  const drainY = G.circY + G.circH * 0.32;
  const sourceY = G.circY + G.circH * 0.78;
  const gndY = sourceY + 50;
  const inX = G.circX + 30;
  const symCx = cx;
  const symCy = (drainY + sourceY) / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Section labels */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.circX + G.circW / 2} y={G.circY + 0}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">INVERTER</text>
          <text x={G.scopeX + G.scopeW / 2} y={G.scopeY - 14}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">SIGNALS</text>
        </SvgFadeIn>

        {/* V_DD rail + label */}
        <TraceIn d={`M ${G.circX + 80} ${vddY} L ${G.circX + G.circW - 40} ${vddY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.2}/>
        <SvgFadeIn duration={0.3} delay={0.6}>
          <text x={G.circX + G.circW - 40} y={vddY - 8}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V<tspan baselineShift="sub" fontSize={10}>DD</tspan></text>
        </SvgFadeIn>

        {/* Pull-up resistor (zigzag) */}
        <TraceIn d={resistorVerticalD(cx, vddY + 4, drainY - 4)}
                 stroke="var(--amber-400)" strokeWidth={2.2}
                 duration={0.5} delay={0.5}/>
        <SvgFadeIn duration={0.3} delay={0.9}>
          <text x={cx + 18} y={(vddY + drainY) / 2 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>R<tspan baselineShift="sub" fontSize={10}>D</tspan></text>
        </SvgFadeIn>

        {/* V_out tap (between R_D and drain) */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <circle cx={cx} cy={drainY} r={3.5} fill="var(--amber-300)"/>
          <line x1={cx} y1={drainY} x2={cx + 80} y2={drainY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={cx + 86} y={drainY + 5}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V<tspan baselineShift="sub" fontSize={10}>out</tspan></text>
        </SvgFadeIn>

        {/* NMOS symbol */}
        <SvgFadeIn duration={0.5} delay={0.8}>
          <NmosSymbol cx={symCx} cy={symCy} scale={0.95}/>
        </SvgFadeIn>

        {/* V_in stub to the gate */}
        <TraceIn d={`M ${inX} ${symCy} L ${symCx - 24 * 0.95 * 1.6} ${symCy}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={1.0}/>
        <SvgFadeIn duration={0.3} delay={1.4}>
          <text x={inX} y={symCy + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>V<tspan baselineShift="sub" fontSize={10}>in</tspan></text>
          <circle cx={inX + 4} cy={symCy} r={3.5} fill="var(--chalk-200)"/>
        </SvgFadeIn>

        {/* Source-to-ground */}
        <TraceIn d={`M ${cx + 24 * 0.95 * 0.6} ${sourceY} L ${cx + 24 * 0.95 * 0.6} ${gndY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={1.2}/>
        <SvgFadeIn duration={0.3} delay={1.6}>
          <line x1={cx + 24 * 0.95 * 0.6 - 14} y1={gndY} x2={cx + 24 * 0.95 * 0.6 + 14} y2={gndY}
                stroke="var(--chalk-200)" strokeWidth={2.2}/>
          <line x1={cx + 24 * 0.95 * 0.6 - 9} y1={gndY + 6} x2={cx + 24 * 0.95 * 0.6 + 9} y2={gndY + 6}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={cx + 24 * 0.95 * 0.6 - 5} y1={gndY + 12} x2={cx + 24 * 0.95 * 0.6 + 5} y2={gndY + 12}
                stroke="var(--chalk-200)" strokeWidth={1.8}/>
        </SvgFadeIn>

        {/* Drain-on lamp: glow ring around the V_out tap when V_out is HIGH
            (transistor OFF), which is when current is *not* draining. */}
        {voutHigh && tSig > 0.1 && (
          <circle cx={cx} cy={drainY} r={10} fill="none"
                  stroke="var(--amber-300)" strokeWidth={1.5} opacity={0.8}/>
        )}

        {/* Live state badge — beneath the schematic */}
        <SvgFadeIn duration={0.3} delay={2.0}>
          <text x={G.circX + G.circW / 2} y={gndY + 38}
                textAnchor="middle"
                fill={vinHigh ? 'var(--amber-300)' : 'var(--chalk-200)'}
                fontFamily="var(--font-mono)" fontSize={13}
                letterSpacing="0.12em">
            V_in: {vinHigh ? 'HIGH' : 'LOW '}     V_out: {voutHigh ? 'HIGH' : 'LOW '}
          </text>
        </SvgFadeIn>

        {/* ─── Scope: V_in / V_out traces ─── */}
        {/* Axes */}
        <TraceIn d={`M ${G.scopeX} ${G.scopeY} L ${G.scopeX} ${G.scopeY + G.scopeH}`}
                 stroke="var(--chalk-200)" strokeWidth={1.4}
                 duration={0.4} delay={0.0}/>
        <TraceIn d={`M ${G.scopeX} ${G.scopeY + G.scopeH} L ${G.scopeX + G.scopeW} ${G.scopeY + G.scopeH}`}
                 stroke="var(--chalk-200)" strokeWidth={1.4}
                 duration={0.4} delay={0.0}/>
        <SvgFadeIn duration={0.3} delay={0.3}>
          <text x={G.scopeX - 10} y={yMidIn + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>V<tspan baselineShift="sub" fontSize={9}>in</tspan></text>
          <text x={G.scopeX - 10} y={yMidOut + 5} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>V<tspan baselineShift="sub" fontSize={9}>out</tspan></text>
          <text x={G.scopeX + G.scopeW + 8} y={G.scopeY + G.scopeH + 4}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.1em">t</text>
        </SvgFadeIn>

        {/* Trace paths */}
        {traceFrac > 0.001 && (
          <>
            <path d={vinD} fill="none"
                  stroke="var(--chalk-100)" strokeWidth={2}
                  strokeLinejoin="miter" strokeLinecap="butt"/>
            <path d={voutD} fill="none"
                  stroke="var(--amber-300)" strokeWidth={2.2}
                  strokeLinejoin="miter" strokeLinecap="butt"/>
          </>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={7.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            high in → low out, low in → high out — the simplest logic gate
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Vertical zigzag resistor between (cx, yTop) and (cx, yBot).
function resistorVerticalD(cx, yTop, yBot, amp = 9, n = 6) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const y = yTop + i * dy;
    const x = cx + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        One voltage controls one channel — and a billion channels make a CPU.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        (NMOS, V_t ≈ 0.4 V on a modern process)
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
