// MOSFET Transfer Characteristic — Manimo lesson scene.
// I_D vs V_GS for an n-channel MOSFET. Below threshold the channel is
// depleted and I_D = 0; above threshold, in saturation, I_D follows the
// square law (k/2)(V_GS − V_th)². The genuine motion lives in two
// places: the inversion-layer band that grows under the gate as V_GS
// sweeps past V_th (Beat 2), and the operating point Q that slides up
// the quadratic curve as V_GS sweeps a second time (Beat 4).
//
// Beats:
//    0.00– 5.00  Manimo intro + hook caption
//    5.00–17.00  NMOS cross-section + live V_GS sweep growing the channel
//   17.00–27.00  Saturation formula + cutoff/saturation distinction
//   27.00–43.00  Sweep V_GS, trace I_D curve with live operating point Q
//   43.00–50.00  Takeaway
//
// Authoring notes:
//   • Beats 2 and 4 share device constants (VTH, K, VGS_MAX) so the
//     channel-onset visual and the sweep graph agree on V_th.
//   • Use SvgFadeIn for SVG children; FadeUp only for HTML/DOM.

const SCENE_DURATION = 73;

// Single continuous narration track — generated with
// `npm run audio mosfet-transfer-characteristic --engine elevenlabs`.
// Beat Sprite-start values below match the audioStart offsets in
// motion/ade/audio/mosfet-transfer-characteristic/manifest.json.
const NARRATION_AUDIO = 'audio/mosfet-transfer-characteristic/scene.mp3';

const NARRATION = [
  /*  0.00– 5.00 */ 'Crank the gate voltage on a MOSFET — when does the channel actually turn on, and how fast does the current climb after that?',
  /*  5.00–17.00 */ 'An n-channel MOSFET has a gate on top, separated from the bulk by a thin oxide. When V G S is below the threshold V th, the gap between source and drain is depleted — no channel, no current. Push V G S above V th and the oxide pulls in enough electrons to form a thin inversion layer connecting source to drain.',
  /* 17.00–27.00 */ 'In saturation, the drain current follows a clean quadratic — I D equals one half k times V G S minus V th, squared. Below V th the equation gives zero, so the device is off.',
  /* 27.00–43.00 */ 'Now sweep V G S from zero upward and watch the operating point. Below threshold it sits glued to the axis. The instant V G S clears V th, current lifts and then climbs faster and faster — that is the quadratic curve, traced out live as the cursor advances.',
  /* 43.00–50.00 */ 'Threshold is the on-switch; saturation is a clean square law. Two numbers — V th and k — tell you the whole curve.',
];

// Device constants — kept at module scope so Beat 2's channel cross-section
// and Beat 4's transfer curve agree on the threshold and saturation slope.
const VTH = 1.5;          // volts — threshold
const K = 1.2;            // mA/V² — transconductance parameter
const VGS_MAX = 5.0;      // volts — top of the sweep range
const ID_MAX = (K / 2) * (VGS_MAX - VTH) ** 2; // mA at V_GS_max ≈ 7.35

function Scene() {
  return (
    <SceneChrome
      eyebrow="transistors"
      title="MOSFET Transfer Characteristic: A Quadratic Turns On at Threshold"
      duration={SCENE_DURATION}
      introEnd={7.73}
      introCaption="Below threshold: dark. Above threshold: a quadratic."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.73} end={30.31}>
        <CrossSectionBeat />
      </Sprite>

      <Sprite start={30.31} end={44.57}>
        <SaturationFormulaBeat />
      </Sprite>

      <Sprite start={44.57} end={62.88}>
        <SweepCurveBeat />
      </Sprite>

      <Sprite start={62.88} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: NMOS cross-section + channel forming ────────────────────────
// The gate sweeps from 0 → VGS_MAX over the beat (after a brief setup).
// As V_GS crosses VTH, an amber inversion-layer band appears under the
// gate and thickens. A live readout shows V_GS so the viewer can pin the
// onset moment to the threshold tick on the gate slider.
function CrossSectionBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Geometry — landscape lays cross-section + readout side-by-side, portrait
  // stacks them vertically with a smaller device.
  const G = portrait
    ? { vbW: 640, vbH: 720,
        deviceX: 80, deviceY: 110, deviceW: 480, deviceH: 200,
        oxideH: 16, gateH: 26, gateGapL: 130, gateGapR: 350,
        sourceX: 110, drainX: 530, contactW: 70, contactH: 56,
        bulkLabelY: 350, sliderY: 430, sliderW: 460, captionY: 660 }
    : { vbW: 1180, vbH: 460,
        deviceX: 140, deviceY: 90, deviceW: 620, deviceH: 220,
        oxideH: 18, gateH: 30, gateGapL: 170, gateGapR: 450,
        sourceX: 180, drainX: 700, contactW: 86, contactH: 64,
        bulkLabelY: 350, sliderY: 80, sliderW: 320, captionY: 440 };

  // Sweep schedule: 1 s setup, then linear ramp 0 → VGS_MAX over the rest.
  const SETUP = 1.2;
  const t = Math.max(0, localTime - SETUP);
  const rampDur = Math.max(spriteDur - SETUP - 1.0, 4);
  const vgs = clamp((t / rampDur) * VGS_MAX, 0, VGS_MAX);

  // Channel thickness grows once V_GS clears V_th. Map (V_GS − V_th) to a
  // visual band thickness clamped to the gap height.
  const gateLeft = G.deviceX + G.gateGapL;
  const gateRight = G.deviceX + G.gateGapR;
  const gateWidth = gateRight - gateLeft;
  const oxideTop = G.deviceY + 56;
  const oxideBottom = oxideTop + G.oxideH;
  const bulkTop = oxideBottom;
  const bulkBottom = G.deviceY + G.deviceH - 6;
  const channelTopY = bulkTop + 2;
  const maxChannelH = 14;
  const channelH = clamp((vgs - VTH) / (VGS_MAX - VTH), 0, 1) * maxChannelH;

  // Slider geometry (landscape only places it under device; portrait puts
  // it down on its own row).
  const sliderX = portrait ? G.deviceX + 90 : G.deviceX + G.deviceW + 60;
  const sliderTop = portrait ? G.sliderY : G.sliderY;
  const sliderInnerW = G.sliderW;
  const vthX = sliderX + (VTH / VGS_MAX) * sliderInnerW;
  const vgsCursorX = sliderX + (vgs / VGS_MAX) * sliderInnerW;
  const onChannel = vgs > VTH + 0.01;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Bulk (p-type) outline */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <rect x={G.deviceX} y={bulkTop}
                width={G.deviceW} height={bulkBottom - bulkTop}
                fill="rgba(232,220,193,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={G.deviceX + G.deviceW / 2} y={G.bulkLabelY}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">P-TYPE BULK</text>
        </SvgFadeIn>

        {/* N+ source well */}
        <SvgFadeIn duration={0.35} delay={0.5}>
          <rect x={G.sourceX} y={bulkTop}
                width={G.contactW} height={G.contactH}
                fill="rgba(244,184,96,0.10)"
                stroke="var(--amber-300)" strokeWidth={1.2}/>
          <text x={G.sourceX + G.contactW / 2} y={bulkTop + G.contactH / 2 + 5}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.06em">N+</text>
        </SvgFadeIn>

        {/* N+ drain well */}
        <SvgFadeIn duration={0.35} delay={0.7}>
          <rect x={G.drainX} y={bulkTop}
                width={G.contactW} height={G.contactH}
                fill="rgba(244,184,96,0.10)"
                stroke="var(--amber-300)" strokeWidth={1.2}/>
          <text x={G.drainX + G.contactW / 2} y={bulkTop + G.contactH / 2 + 5}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.06em">N+</text>
        </SvgFadeIn>

        {/* Oxide layer (thin band between bulk and gate) */}
        <SvgFadeIn duration={0.35} delay={0.9}>
          <rect x={gateLeft} y={oxideTop}
                width={gateWidth} height={G.oxideH}
                fill="rgba(155,140,255,0.18)"
                stroke="var(--violet-400)" strokeWidth={1}/>
          <text x={gateLeft - 8} y={oxideTop + G.oxideH / 2 + 4}
                textAnchor="end"
                fill="var(--violet-400)" fontFamily="var(--font-mono)"
                fontSize={10} letterSpacing="0.10em">OX</text>
        </SvgFadeIn>

        {/* Polysilicon gate */}
        <SvgFadeIn duration={0.35} delay={1.1}>
          <rect x={gateLeft} y={oxideTop - G.gateH}
                width={gateWidth} height={G.gateH}
                fill="rgba(232,220,193,0.14)"
                stroke="var(--chalk-100)" strokeWidth={1.4}/>
        </SvgFadeIn>

        {/* Terminal labels (S, G, D, B) */}
        <SvgFadeIn duration={0.3} delay={1.4}>
          <text x={G.sourceX + G.contactW / 2} y={bulkTop - 14}
                textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>S</text>
          <text x={(gateLeft + gateRight) / 2} y={oxideTop - G.gateH - 8}
                textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>G</text>
          <text x={G.drainX + G.contactW / 2} y={bulkTop - 14}
                textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>D</text>
          <text x={G.deviceX + G.deviceW + 14} y={(bulkTop + bulkBottom) / 2 + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>B</text>
        </SvgFadeIn>

        {/* Inversion-layer band — only renders once V_GS clears V_th. */}
        {channelH > 0.5 && (
          <g>
            <rect x={gateLeft - 4} y={channelTopY}
                  width={gateWidth + 8} height={channelH}
                  fill="var(--amber-400)" opacity={0.85}/>
            <text x={(gateLeft + gateRight) / 2} y={channelTopY + channelH + 14}
                  textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.10em">INVERSION LAYER</text>
          </g>
        )}

        {/* Connecting wires — source to gnd-ish, drain to V_DS, gate up */}
        <SvgFadeIn duration={0.3} delay={1.6}>
          <line x1={G.sourceX + G.contactW / 2} y1={bulkTop} x2={G.sourceX + G.contactW / 2} y2={bulkTop - 8}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={G.drainX + G.contactW / 2} y1={bulkTop} x2={G.drainX + G.contactW / 2} y2={bulkTop - 8}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <line x1={(gateLeft + gateRight) / 2} y1={oxideTop - G.gateH} x2={(gateLeft + gateRight) / 2} y2={oxideTop - G.gateH - 12}
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
        </SvgFadeIn>

        {/* V_GS slider — a horizontal bar with V_th tick + a live cursor */}
        <SvgFadeIn duration={0.4} delay={1.9}>
          <text x={sliderX} y={sliderTop - 14}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">V_GS  SWEEP</text>
          <line x1={sliderX} y1={sliderTop} x2={sliderX + sliderInnerW} y2={sliderTop}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={sliderX} y1={sliderTop - 4} x2={sliderX} y2={sliderTop + 4}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={sliderX + sliderInnerW} y1={sliderTop - 4} x2={sliderX + sliderInnerW} y2={sliderTop + 4}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={sliderX} y={sliderTop + 20} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
          <text x={sliderX + sliderInnerW} y={sliderTop + 20} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>{VGS_MAX.toFixed(1)}V</text>
          {/* V_th tick (label below the bar so it doesn't crowd the V_GS SWEEP eyebrow above) */}
          <line x1={vthX} y1={sliderTop - 8} x2={vthX} y2={sliderTop + 8}
                stroke="var(--rose-400)" strokeWidth={1.8}/>
          <text x={vthX} y={sliderTop + 20} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={13}>V_th</text>
        </SvgFadeIn>

        {/* Live cursor + readout — drawn unconditionally once sweep starts */}
        {t > 0 && (
          <g>
            <circle cx={vgsCursorX} cy={sliderTop} r={5}
                    fill={onChannel ? 'var(--amber-400)' : 'var(--chalk-200)'}/>
            <text x={vgsCursorX} y={sliderTop + 38} textAnchor="middle"
                  fill={onChannel ? 'var(--amber-300)' : 'var(--chalk-200)'}
                  fontFamily="var(--font-mono)" fontSize={13}>
              V_GS = {vgs.toFixed(2)} V
            </text>
            <text x={vgsCursorX} y={sliderTop + 56} textAnchor="middle"
                  fill={onChannel ? 'var(--amber-400)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.10em">
              {onChannel ? 'CHANNEL ON' : 'CUTOFF'}
            </text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={Math.max(0, spriteDur - 3.2)}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            channel forms when V_GS clears V_th
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Saturation equation + cutoff/saturation distinction ─────────
function SaturationFormulaBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 30,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Saturation square law
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 48, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        I<sub style={{ fontSize: '0.6em' }}>D</sub> = (k/2)·(V<sub style={{ fontSize: '0.6em' }}>GS</sub> − V<sub style={{ fontSize: '0.6em' }}>th</sub>)²
      </FadeUp>

      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
                      paddingTop: 14, borderTop: '1px solid rgba(232,220,193,0.12)' }}>
          <FadeUp duration={0.5} delay={1.6} distance={10}
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--chalk-300)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>cutoff</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--chalk-200)', whiteSpace: 'nowrap' }}>V_GS &lt; V_th  →  I_D = 0</div>
          </FadeUp>
          <div style={{ width: 80, height: 1, background: 'rgba(232,220,193,0.15)' }}/>
          <FadeUp duration={0.5} delay={2.4} distance={10}
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--chalk-300)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>saturation</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22, color: 'var(--chalk-100)', whiteSpace: 'nowrap' }}>V_GS &gt; V_th  →  quadratic</div>
          </FadeUp>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 100, alignItems: 'flex-start',
                      paddingTop: 22, borderTop: '1px solid rgba(232,220,193,0.12)' }}>
          <FadeUp duration={0.5} delay={1.6} distance={10}
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--chalk-300)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>cutoff</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, color: 'var(--chalk-200)', whiteSpace: 'nowrap' }}>V_GS &lt; V_th  →  I_D = 0</div>
          </FadeUp>
          <div style={{ width: 1, height: 60, background: 'rgba(232,220,193,0.15)', marginTop: 8 }}/>
          <FadeUp duration={0.5} delay={2.4} distance={10}
            style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--chalk-300)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>saturation</div>
            <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26, color: 'var(--chalk-100)', whiteSpace: 'nowrap' }}>V_GS &gt; V_th  →  quadratic climb</div>
          </FadeUp>
        </div>
      )}

      <FadeUp duration={0.4} delay={5} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.10em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
        }}>
        k = µ · C_ox · (W/L)  —  the transconductance parameter
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Sweep V_GS → trace I_D curve with live Q ────────────────────
function SweepCurveBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Plot geometry in two aspects.
  const G = portrait
    ? { vbW: 640, vbH: 720, gx: 110, gy: 100, gw: 460, gh: 480,
        legendY: 640, readoutY: 690, fontAxis: 14 }
    : { vbW: 1180, vbH: 460, gx: 200, gy: 60, gw: 760, gh: 340,
        legendY: 420, readoutY: 446, fontAxis: 16 };
  const toX = v => G.gx + (v / VGS_MAX) * G.gw;
  const toY = i => G.gy + G.gh - (i / ID_MAX) * G.gh;

  // Sweep schedule — short setup, then ramp V_GS 0 → VGS_MAX → hold.
  const SETUP = 1.4;
  const t = Math.max(0, localTime - SETUP);
  const rampDur = Math.max(spriteDur - SETUP - 2.0, 5);
  const vgs = clamp((t / rampDur) * VGS_MAX, 0, VGS_MAX);
  const id = vgs > VTH ? (K / 2) * (vgs - VTH) ** 2 : 0;

  // Trace path — full curve from V_GS = V_th to current V_GS (only above
  // threshold). For V_GS ≤ V_th we just draw a flat segment on the axis.
  const samples = 60;
  const tracePts = [];
  for (let i = 0; i <= samples; i++) {
    const v = (i / samples) * vgs;
    const ic = v > VTH ? (K / 2) * (v - VTH) ** 2 : 0;
    tracePts.push((i === 0 ? 'M' : 'L') + ` ${toX(v).toFixed(2)} ${toY(ic).toFixed(2)}`);
  }
  const traceD = tracePts.join(' ');

  // V_th vertical reference line.
  const vthX = toX(VTH);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Plot title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.gx + G.gw / 2} y={G.gy - 22} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">I_D  vs  V_GS</text>
        </SvgFadeIn>

        {/* Axes */}
        <TraceIn d={`M ${G.gx} ${G.gy} L ${G.gx} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>
        <TraceIn d={`M ${G.gx} ${G.gy + G.gh} L ${G.gx + G.gw} ${G.gy + G.gh}`}
                 stroke="var(--chalk-200)" strokeWidth={1.6}
                 duration={0.5} delay={0.0}/>
        <SvgFadeIn duration={0.3} delay={0.3}>
          <text x={G.gx + G.gw + 14} y={G.gy + G.gh + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>V<tspan baselineShift="sub" fontSize={11}>GS</tspan></text>
          <text x={G.gx - 14} y={G.gy - 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>I<tspan baselineShift="sub" fontSize={11}>D</tspan></text>
        </SvgFadeIn>

        {/* V_th vertical dashed reference */}
        <SvgFadeIn duration={0.35} delay={0.5}>
          <line x1={vthX} y1={G.gy + 4} x2={vthX} y2={G.gy + G.gh}
                stroke="var(--rose-400)" strokeWidth={1.2}
                strokeDasharray="5 5"/>
          <text x={vthX} y={G.gy + G.gh + 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>V_th</text>
        </SvgFadeIn>

        {/* The traced quadratic — drawn live, length follows V_GS sweep */}
        {t > 0 && (
          <path d={traceD}
                fill="none"
                stroke="var(--amber-400)" strokeWidth={2.6}
                strokeLinejoin="round" strokeLinecap="round"/>
        )}

        {/* Operating point Q — sits on the axis below V_th, on the curve above */}
        {t > 0 && (
          <g>
            <circle cx={toX(vgs)} cy={toY(id)} r={6}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1.4}/>
            <text x={toX(vgs)} y={toY(id) - 14} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={12} letterSpacing="0.08em">Q</text>
          </g>
        )}

        {/* Cursor drop-line from Q to V_GS axis */}
        {t > 0 && vgs > 0.05 && (
          <line x1={toX(vgs)} y1={toY(id)} x2={toX(vgs)} y2={G.gy + G.gh}
                stroke="var(--rose-400)" strokeWidth={1}
                strokeDasharray="3 4" opacity={0.55}/>
        )}

        {/* Region badges along the axis — placed just above the plot
            (between the plot title and the axis top) so they never collide
            with the climbing curve or the Q operating-point label. */}
        <SvgFadeIn duration={0.35} delay={0.8}>
          <text x={G.gx + (vthX - G.gx) / 2} y={G.gy - 6}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={10} letterSpacing="0.14em">CUTOFF</text>
          <text x={vthX + (G.gx + G.gw - vthX) / 2} y={G.gy - 6}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={10} letterSpacing="0.14em">SATURATION (square law)</text>
        </SvgFadeIn>

        {/* Live numeric readout */}
        {t > 0 && (
          <text x={G.vbW / 2} y={G.readoutY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.06em">
            V_GS = {vgs.toFixed(2)} V    I_D = {id.toFixed(2)} mA
          </text>
        )}
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        V_th decides when. k decides how fast.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center',
        }}>
        (square law in saturation; flat in cutoff)
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
