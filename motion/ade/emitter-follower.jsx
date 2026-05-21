// The Emitter Follower: Gain of One, Current to Spare — Manimo lesson.
// Common-collector BJT amplifier: drive the base, take the output off
// the emitter. The V_BE drop forces V_out = V_in − 0.7 V, so voltage
// gain ≈ 1. The pay-off is current — base current is tiny but emitter
// current is β times bigger. Genuine motion lives in Beat 4: a
// sinusoid sweeps across the scope, V_out traces below it by V_BE, a
// live readout updates with the cursor, and a sketched-on current arrow
// fattens to show I_out ≫ I_in.
//
// Beats (placeholder timings — Step 4c rewires from audio manifest):
//    0– 5    Manimo intro: an amplifier with a gain of one?
//    5–17    Schematic: NPN, V_CC, R_E to ground, V_in→base, V_out←emitter
//   17–26    V_out = V_in − V_BE; the emitter "follows" the base
//   26–38    Live sweep — V_in sinusoid + V_out tracking trace + current widths
//   38–42    Takeaway — Hi-Z in, Lo-Z out, current to spare
//
// Authoring notes:
//   • Beat 4 reads useSprite() localTime to compute a single cursor that
//     drives both scope traces AND the current-arrow widths.
//   • All geometry branches on usePortrait().

const SCENE_DURATION = 47;

const NARRATION = [
  /*  0– 5  */ "An amplifier with a voltage gain of one — what could that possibly be good for?",
  /*  5–17 */ "Drive the base, take the output off the emitter. The collector ties straight to V C C, and an emitter resistor pulls the emitter down to ground.",
  /* 17–26 */ "The base-emitter junction always drops about zero point seven volts when conducting. So the emitter voltage tracks the base — just shifted down by V B E.",
  /* 26–38 */ "Wiggle the input. The output traces the same wiggle, half a volt below it. Voltage gain is one — but the current swung into the load is beta times bigger than the current the source had to give.",
  /* 38–42 */ "High input impedance, low output impedance, current to spare — the emitter follower is the buffer that drives the speaker, the cable, the next stage.",
];

const NARRATION_AUDIO = 'audio/emitter-follower/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="transistors"
      title="The Emitter Follower: Gain of One, Current to Spare"
      duration={SCENE_DURATION}
      introEnd={4.77}
      introCaption="Gain of one — yet every audio stage ends with one of these."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.77} end={13.35}>
        <SchematicBeat />
      </Sprite>

      <Sprite start={13.35} end={23.13}>
        <VoltageRelationBeat />
      </Sprite>

      <Sprite start={23.13} end={35.6}>
        <FollowingMotionBeat />
      </Sprite>

      <Sprite start={35.6} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared: NPN transistor symbol ───────────────────────────────────────
// Collector up, emitter down with NPN arrow, base on the left.
// Pin offsets (relative to centre at cx, cy with scale s and u=22s):
//   collector pin: (cx + 0.7u, cy - 1.5u)
//   emitter   pin: (cx + 0.7u, cy + 1.5u)
//   base      pin: (cx - 1.4u, cy)
function NpnSymbol({ cx, cy, scale = 1, color = 'var(--amber-400)' }) {
  const u = 22 * scale;
  const baseX = cx - u * 1.4;
  const bodyX = cx - u * 0.2;
  const colY = cy - u * 1.5;
  const emiY = cy + u * 1.5;
  const topConn = cy - u * 0.85;
  const botConn = cy + u * 0.85;
  return (
    <g>
      <line x1={baseX} y1={cy} x2={bodyX} y2={cy} stroke={color} strokeWidth={2.2}/>
      <line x1={bodyX} y1={topConn} x2={bodyX} y2={botConn} stroke={color} strokeWidth={3.5}/>
      <line x1={bodyX} y1={topConn} x2={cx + u * 0.7} y2={cy - u * 1.1} stroke={color} strokeWidth={2.2}/>
      <line x1={cx + u * 0.7} y1={cy - u * 1.1} x2={cx + u * 0.7} y2={colY} stroke={color} strokeWidth={2.2}/>
      <line x1={bodyX} y1={botConn} x2={cx + u * 0.7} y2={cy + u * 1.1} stroke={color} strokeWidth={2.2}/>
      <path d={`M ${cx + u * 0.7} ${cy + u * 1.1}
                L ${cx + u * 0.45} ${cy + u * 0.95}
                L ${cx + u * 0.55} ${cy + u * 1.18} Z`} fill={color}/>
      <line x1={cx + u * 0.7} y1={cy + u * 1.1} x2={cx + u * 0.7} y2={emiY} stroke={color} strokeWidth={2.2}/>
    </g>
  );
}

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

function GroundMark({ cx, yTop, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <line x1={cx - 14} y1={yTop} x2={cx + 14} y2={yTop} stroke={color} strokeWidth={2.2}/>
      <line x1={cx - 9} y1={yTop + 6} x2={cx + 9} y2={yTop + 6} stroke={color} strokeWidth={2}/>
      <line x1={cx - 5} y1={yTop + 12} x2={cx + 5} y2={yTop + 12} stroke={color} strokeWidth={1.8}/>
    </g>
  );
}

// ─── Beat 2: Schematic ───────────────────────────────────────────────────
function SchematicBeat() {
  const portrait = usePortrait();
  const SCALE = 1.0;
  const U = 22 * SCALE;
  const COL_DX = U * 0.7;
  const COL_DY = U * 1.5;
  const BASE_DX = U * 1.4;

  const G = portrait
    ? { vbW: 560, vbH: 700,
        npnCx: 300, npnCy: 350,
        vccY: 110, gndY: 540,
        vinX: 80, vinY: 350,
        voutX: 480,
        captionY: 660 }
    : { vbW: 940, vbH: 440,
        npnCx: 470, npnCy: 220,
        vccY: 50, gndY: 380,
        vinX: 130, vinY: 220,
        voutX: 770,
        captionY: 420 };

  const colX = G.npnCx + COL_DX;
  const colY = G.npnCy - COL_DY;
  const emiX = G.npnCx + COL_DX;
  const emiY = G.npnCy + COL_DY;
  const baseX = G.npnCx - BASE_DX;

  // Emitter node — V_out tapped here. R_E goes from this node down to GND.
  const reTopY = emiY + 20;
  const reBotY = G.gndY - 22;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* V_CC rail */}
        <TraceIn d={`M ${baseX - 30} ${G.vccY} L ${G.voutX + 30} ${G.vccY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.7} delay={0.0}/>
        <SvgFadeIn duration={0.3} delay={0.6}>
          <text x={G.voutX + 42} y={G.vccY + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>CC</tspan>
          </text>
        </SvgFadeIn>

        {/* Collector → V_CC (straight up) */}
        <TraceIn d={`M ${colX} ${G.vccY} L ${colX} ${colY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={0.5}/>

        {/* Transistor */}
        <SvgFadeIn duration={0.4} delay={0.9}>
          <NpnSymbol cx={G.npnCx} cy={G.npnCy} scale={SCALE}/>
        </SvgFadeIn>

        {/* V_in source feeds the base */}
        <TraceIn d={`M ${G.vinX} ${G.vinY} L ${baseX} ${G.vinY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.0}/>
        <SvgFadeIn duration={0.35} delay={1.1}>
          {/* V_in source circle */}
          <circle cx={G.vinX - 16} cy={G.vinY} r={16}
                  fill="none" stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <path d={`M ${G.vinX - 22} ${G.vinY} q 4 -6 6 0 q 2 6 6 0`}
                fill="none" stroke="var(--chalk-200)" strokeWidth={1.4}/>
          <text x={G.vinX - 38} y={G.vinY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Emitter → emitter node */}
        <TraceIn d={`M ${emiX} ${emiY} L ${emiX} ${reTopY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.6}/>

        {/* R_E resistor, emitter node to GND */}
        <TraceIn d={resistorVerticalD(emiX, reTopY, reBotY)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={2.0}/>
        <SvgFadeIn duration={0.3} delay={2.4}>
          <text x={emiX + 18} y={(reTopY + reBotY) / 2 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            R<tspan baselineShift="sub" fontSize={11}>E</tspan>
          </text>
        </SvgFadeIn>

        {/* R_E bottom → ground */}
        <TraceIn d={`M ${emiX} ${reBotY} L ${emiX} ${G.gndY - 6}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.3} delay={2.7}/>
        <SvgFadeIn duration={0.3} delay={2.9}>
          <GroundMark cx={emiX} yTop={G.gndY}/>
        </SvgFadeIn>

        {/* V_out tap — sideways line from emitter node to V_out label */}
        <TraceIn d={`M ${emiX} ${reTopY + 6} L ${G.voutX} ${reTopY + 6}`}
          stroke="var(--amber-300)" strokeWidth={2}
          duration={0.5} delay={3.2}/>
        <SvgFadeIn duration={0.35} delay={3.4}>
          <circle cx={emiX} cy={reTopY + 6} r={3} fill="var(--amber-300)"/>
          <text x={G.voutX + 8} y={reTopY + 12}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            common-collector — collector is the shared terminal
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: V_out = V_in − V_BE ────────────────────────────────────────
function VoltageRelationBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 26,
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        the diode drop that defines the output
      </FadeUp>

      <FadeUp duration={0.6} delay={0.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 42 : 56, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        V<sub>out</sub> = V<sub>in</sub> − V<sub>BE</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.8} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', letterSpacing: '0.08em',
        }}>
        V<sub>BE</sub> ≈ 0.7 V  &nbsp;(silicon)
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '52ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        the output "follows" the input — that's where the name comes from
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Live sweep — sinusoid in, sinusoid out, fat current arrow ──
function FollowingMotionBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.8;
  const SWEEP = Math.max(spriteDur - HOLD - 1.0, 1);
  const t = clamp((localTime - HOLD) / SWEEP, 0, 1);

  const G = portrait
    ? { vbW: 580, vbH: 760,
        scopeX: 60, scopeR: 520,
        scopeTopY: 80, scopeBotY: 380,
        scopeMid: 230,
        arrowsY: 460, arrowsBaseX: 110,
        captionY: 720, font: 14 }
    : { vbW: 1000, vbH: 460,
        scopeX: 90, scopeR: 720,
        scopeTopY: 50, scopeBotY: 290,
        scopeMid: 170,
        arrowsY: 360, arrowsBaseX: 800,
        captionY: 440, font: 14 };

  const scopeW = G.scopeR - G.scopeX;
  const scopeH = G.scopeBotY - G.scopeTopY;
  // V_in centred at scopeMid, amplitude 0.5 of half-scope.
  // V_out follows V_in but offset down by V_BE_PIX (the 0.7V drop in plot units).
  const inAmp = scopeH * 0.32;
  const V_BE_PIX = scopeH * 0.18;

  const CYCLES = 2.0;
  function sinUnit(u) { return Math.sin(2 * Math.PI * CYCLES * u); }

  const SAMPLES = 200;
  const revealMax = SAMPLES * t;
  const inPts = [];
  const outPts = [];
  for (let i = 0; i < SAMPLES; i++) {
    if (i > revealMax) break;
    const u = i / (SAMPLES - 1);
    const x = G.scopeX + u * scopeW;
    const vIn = sinUnit(u);
    inPts.push(`${x.toFixed(1)},${(G.scopeMid - vIn * inAmp).toFixed(1)}`);
    outPts.push(`${x.toFixed(1)},${(G.scopeMid + V_BE_PIX - vIn * inAmp).toFixed(1)}`);
  }
  const cursorX = G.scopeX + clamp(t, 0, 1) * scopeW;
  const cursorU = clamp(t, 0, 1);
  const cursorVin = sinUnit(cursorU);
  const cursorVinY = G.scopeMid - cursorVin * inAmp;
  const cursorVoutY = G.scopeMid + V_BE_PIX - cursorVin * inAmp;

  // Readout values (formatted): show V_in ≈ ±A, V_out = V_in - 0.7
  const vInNum = (cursorVin * 1.0).toFixed(2);     // ±1.00 amplitude scale
  const vOutNum = (cursorVin * 1.0 - 0.7).toFixed(2);

  // Current arrows: I_in thin, I_out fat (~β·I_in). Stays visible after
  // HOLD; widths nudge slightly with cursorVin to make them feel alive.
  const arrowsVisible = t > 0.01;
  const baseInW = 1.6;
  const baseOutW = 7.0;
  const wiggle = 1 + 0.15 * cursorVin;
  const inW = baseInW * wiggle;
  const outW = baseOutW * wiggle;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Scope frame */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <rect x={G.scopeX} y={G.scopeTopY} width={scopeW} height={scopeH}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1}/>
          {/* horizontal mid-line, dashed */}
          <line x1={G.scopeX} y1={G.scopeMid} x2={G.scopeR} y2={G.scopeMid}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"
                opacity={0.55}/>
          {/* V_out DC reference (mid - V_BE) */}
          <line x1={G.scopeX} y1={G.scopeMid + V_BE_PIX} x2={G.scopeR} y2={G.scopeMid + V_BE_PIX}
                stroke="var(--amber-300)" strokeWidth={1} strokeDasharray="2 5"
                opacity={0.35}/>
          <text x={G.scopeX - 8} y={G.scopeMid + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0 V</text>
          <text x={G.scopeX - 8} y={G.scopeMid + V_BE_PIX + 4} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11}>−0.7 V</text>
          <text x={G.scopeR + 8} y={G.scopeTopY + 14}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>in</tspan>
          </text>
          <text x={G.scopeR + 8} y={G.scopeBotY - 8}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Traces */}
        {inPts.length > 1 && (
          <polyline points={inPts.join(' ')}
            fill="none" stroke="var(--chalk-100)" strokeWidth={2.4}/>
        )}
        {outPts.length > 1 && (
          <polyline points={outPts.join(' ')}
            fill="none" stroke="var(--amber-300)" strokeWidth={2.4}/>
        )}

        {/* Synchronised cursor + dots */}
        {t > 0.01 && t < 0.99 && (
          <g>
            <line x1={cursorX} y1={G.scopeTopY} x2={cursorX} y2={G.scopeBotY}
                  stroke="var(--rose-400)" strokeWidth={1.2}
                  opacity={0.7}/>
            <circle cx={cursorX} cy={cursorVinY} r={4}
                    fill="var(--chalk-100)"/>
            <circle cx={cursorX} cy={cursorVoutY} r={4}
                    fill="var(--amber-300)"/>
            {/* Live readout near the cursor (clamped inside the scope) */}
            <g transform={`translate(${clamp(cursorX + 10, G.scopeX + 10, G.scopeR - 130)}, ${G.scopeTopY + 22})`}>
              <rect x={0} y={0} width={120} height={42} rx={4}
                    fill="var(--bg-canvas)" fillOpacity={0.85}
                    stroke="var(--chalk-300)" strokeWidth={0.8}/>
              <text x={8} y={16}
                    fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                    fontSize={11}>V_in  = {vInNum} V</text>
              <text x={8} y={32}
                    fill="var(--amber-300)" fontFamily="var(--font-mono)"
                    fontSize={11}>V_out = {vOutNum} V</text>
            </g>
          </g>
        )}

        {/* Current arrows panel — I_in thin, I_out fat. Lives below the
            scope in portrait, to the right of the scope in landscape. */}
        {arrowsVisible && (
          portrait ? (
            <g transform={`translate(0, ${G.arrowsY})`}>
              {/* I_in row */}
              <line x1={G.arrowsBaseX} y1={20} x2={G.arrowsBaseX + 100} y2={20}
                    stroke="var(--chalk-100)" strokeWidth={inW}
                    strokeLinecap="round"/>
              <path d={`M ${G.arrowsBaseX + 100} ${20}
                        l -10 -8 l 0 16 z`}
                    fill="var(--chalk-100)"/>
              <text x={G.arrowsBaseX - 12} y={24} textAnchor="end"
                    fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={18}>
                I<tspan baselineShift="sub" fontSize={11}>in</tspan>
              </text>
              <text x={G.arrowsBaseX + 110} y={24}
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={12}>tiny base current</text>

              {/* I_out row */}
              <line x1={G.arrowsBaseX} y1={70} x2={G.arrowsBaseX + 260} y2={70}
                    stroke="var(--amber-300)" strokeWidth={outW}
                    strokeLinecap="round"/>
              <path d={`M ${G.arrowsBaseX + 260} ${70}
                        l -14 -12 l 0 24 z`}
                    fill="var(--amber-300)"/>
              <text x={G.arrowsBaseX - 12} y={74} textAnchor="end"
                    fill="var(--amber-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={18}>
                I<tspan baselineShift="sub" fontSize={11}>out</tspan>
              </text>
              <text x={G.arrowsBaseX + 270} y={74}
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                    fontSize={12}>≈ β · I_in</text>
            </g>
          ) : (
            <g transform={`translate(${G.arrowsBaseX}, ${G.arrowsY})`}>
              {/* I_in row */}
              <line x1={0} y1={0} x2={70} y2={0}
                    stroke="var(--chalk-100)" strokeWidth={inW}
                    strokeLinecap="round"/>
              <path d={`M 70 0 l -10 -7 l 0 14 z`}
                    fill="var(--chalk-100)"/>
              <text x={-10} y={4} textAnchor="end"
                    fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={16}>
                I<tspan baselineShift="sub" fontSize={10}>in</tspan>
              </text>
              {/* I_out row */}
              <line x1={0} y1={36} x2={170} y2={36}
                    stroke="var(--amber-300)" strokeWidth={outW}
                    strokeLinecap="round"/>
              <path d={`M 170 36 l -14 -12 l 0 24 z`}
                    fill="var(--amber-300)"/>
              <text x={-10} y={40} textAnchor="end"
                    fill="var(--amber-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={16}>
                I<tspan baselineShift="sub" fontSize={10}>out</tspan>
              </text>
              <text x={180} y={40}
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                    fontSize={12}>≈ β · I_in</text>
            </g>
          )
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={10.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            voltage gain ≈ 1, current gain ≈ β — the transistor delivers the muscle
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
          fontSize: portrait ? 26 : 36, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '22ch' : 'none',
          lineHeight: 1.25,
        }}>
        Hi-Z in, Lo-Z out — the buffer at the end of every signal chain.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        audio output stages · op-amp followers · line drivers
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
