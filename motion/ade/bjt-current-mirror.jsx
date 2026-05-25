// BJT Current Mirror: How Q2 Copies Q1's Current — Manimo lesson scene.
// Two matched NPN transistors share a base-emitter voltage. Q1 is diode-
// connected (collector tied back to base), with R_ref above setting the
// reference current. Q2's base is tied to Q1's, and its emitter to ground,
// so Q2 sees the same V_BE — and the same collector current. The genuine
// motion lives in Beat 4: a sin-shaped I_ref drives twin bar gauges and
// matched mono readouts so I_ref and I_out move in lockstep.
//
// Beats (placeholder timings — Step 4c will overwrite with audio-aligned):
//    0– 5   Manimo intro + hook
//    5–16   Mirror schematic — R_ref, Q1 (diode-connected), Q2, R_L
//   16–28   Why it works — same V_BE → same I_C, leading to I_out = I_ref
//   28–42   Live sweep — I_ref bar + I_out bar rise/fall together  (genuine motion)
//   42–48   Takeaway — used inside every analog IC
//
// Authoring notes:
//   • Beat 2 and Beat 4 share NpnSymbol(); Beat 4 reuses a compact layout.
//   • The mirror's "matching" is exact in the ideal model used here:
//     I_out is set to equal I_ref tick-for-tick, no Early-effect lean.
//   • Pull from manimo-motion.jsx primitives only.

const SCENE_DURATION = 45;

const NARRATION = [
  /*  0– 5  */ "How do you copy a current from one branch of a chip to another, without measuring it?",
  /*  5–16 */ "Two matched NPN transistors share their bases and emitters. Q one is diode connected — its collector ties back to its base — and a reference resistor sets the current that flows through it.",
  /* 16–28 */ "Both transistors see the same V B E. Because collector current depends only on V B E, the two collector currents are equal — Q two simply copies the current set by R reference.",
  /* 28–42 */ "Change R reference and I reference moves. I out tracks it in lockstep — that's the mirror in action.",
  /* 42–48 */ "Current mirrors are the workhorse bias circuit inside almost every analog integrated chip — op-amps, references, amplifiers.",
];

const NARRATION_AUDIO = 'audio/bjt-current-mirror/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="transistors"
      title="BJT Current Mirror: How Q2 Copies Q1's Current"
      duration={SCENE_DURATION}
      introEnd={4.74}
      introCaption="Two transistors. One reference. One copy."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.74} end={17.28}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={17.28} end={28.96}>
        <MatchingBeat />
      </Sprite>

      <Sprite start={28.96} end={35.64}>
        <SweepBeat />
      </Sprite>

      <Sprite start={35.64} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared: NPN transistor symbol ───────────────────────────────────────
// Centred at (cx, cy). Collector up, emitter down with NPN arrow, base
// on the left. Matches the NpnSymbol used in bjt-load-line.jsx.
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

// Ground symbol — three shrinking horizontal bars centred at (cx, yTop).
function GroundMark({ cx, yTop, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <line x1={cx - 14} y1={yTop} x2={cx + 14} y2={yTop} stroke={color} strokeWidth={2.2}/>
      <line x1={cx - 9} y1={yTop + 6} x2={cx + 9} y2={yTop + 6} stroke={color} strokeWidth={2}/>
      <line x1={cx - 5} y1={yTop + 12} x2={cx + 5} y2={yTop + 12} stroke={color} strokeWidth={1.8}/>
    </g>
  );
}

// ─── Beat 2: Mirror schematic ────────────────────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  // Geometry built around the NPN symbol's pin offsets so wires land on
  // the actual collector/base/emitter pins, not arbitrary x-columns.
  // For NpnSymbol(cx, cy, scale=1): collector pin at (cx + 0.7u, cy - 1.5u),
  // base pin at (cx - 1.4u, cy), emitter pin at (cx + 0.7u, cy + 1.5u),
  // where u = 22.
  const SCALE = 1.4;
  const U = 22 * SCALE;
  const COL_DX = U * 0.7;     // collector/emitter x-offset from cx
  const COL_DY = U * 1.5;     // collector/emitter y-offset from cy
  const BASE_DX = U * 1.4;    // base x-offset from cx

  const G = portrait
    ? { vbW: 560, vbH: 720,
        leftCx: 180, rightCx: 400,
        vccY: 100, refTop: 140, refBot: 250, colTopY: 250,
        symY: 380, gndY: 540,
        rLTop: 140, rLBot: 250,
        captionY: 700, fontMain: 18 }
    : { vbW: 980, vbH: 460,
        leftCx: 340, rightCx: 660,
        vccY: 55, refTop: 90, refBot: 195, colTopY: 195,
        symY: 290, gndY: 410,
        rLTop: 90, rLBot: 195,
        captionY: 440, fontMain: 18 };

  // Useful derived pin coords.
  const q1ColX = G.leftCx + COL_DX;
  const q1ColY = G.symY - COL_DY;
  const q1EmiX = G.leftCx + COL_DX;
  const q1EmiY = G.symY + COL_DY;
  const q1BaseX = G.leftCx - BASE_DX;

  const q2ColX = G.rightCx + COL_DX;
  const q2ColY = G.symY - COL_DY;
  const q2EmiX = G.rightCx + COL_DX;
  const q2EmiY = G.symY + COL_DY;
  const q2BaseX = G.rightCx - BASE_DX;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* V_CC rail */}
        <TraceIn d={`M ${q1ColX - 80} ${G.vccY} L ${q2ColX + 80} ${G.vccY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.7} delay={0.0}/>
        <SvgFadeIn duration={0.3} delay={0.6}>
          <text x={q2ColX + 92} y={G.vccY + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>CC</tspan>
          </text>
        </SvgFadeIn>

        {/* Left branch — R_ref (on Q1's COLLECTOR x) */}
        <TraceIn d={`M ${q1ColX} ${G.vccY} L ${q1ColX} ${G.refTop}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.3} delay={0.4}/>
        <TraceIn d={resistorVerticalD(q1ColX, G.refTop, G.refBot)}
                 stroke="var(--amber-400)" strokeWidth={2.4}
                 duration={0.6} delay={0.6}/>
        <SvgFadeIn duration={0.3} delay={1.0}>
          <text x={q1ColX - 18} y={(G.refTop + G.refBot) / 2 + 5} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={11}>ref</tspan>
          </text>
        </SvgFadeIn>
        {/* R_ref bottom → Q1 collector */}
        <TraceIn d={`M ${q1ColX} ${G.refBot} L ${q1ColX} ${q1ColY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.3} delay={1.1}/>

        {/* Q1 symbol */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <NpnSymbol cx={G.leftCx} cy={G.symY} scale={SCALE}/>
        </SvgFadeIn>

        {/* Diode-connect: short L from Q1's collector down to its base.
            Path: (q1ColX, refBot) → (q1BaseX, refBot) → (q1BaseX, symY) */}
        <TraceIn d={`M ${q1ColX} ${G.refBot - 4}
                     L ${q1BaseX} ${G.refBot - 4}
                     L ${q1BaseX} ${G.symY}`}
                 stroke="var(--amber-300)" strokeWidth={2}
                 duration={0.9} delay={2.0}/>

        {/* Shared base rail: q1Base → q2Base */}
        <TraceIn d={`M ${q1BaseX} ${G.symY} L ${q2BaseX} ${G.symY}`}
                 stroke="var(--amber-300)" strokeWidth={2}
                 duration={0.7} delay={2.9}/>

        {/* Q1 label — placed above the symbol (top-left), so doesn't clash
            with the shared-V_BE rail or the diode-connect wire. */}
        <SvgFadeIn duration={0.3} delay={1.8}>
          <text x={G.leftCx - 12} y={G.symY - COL_DY - 8} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            Q<tspan baselineShift="sub" fontSize={11}>1</tspan>
          </text>
        </SvgFadeIn>

        {/* Q1 emitter → ground */}
        <TraceIn d={`M ${q1EmiX} ${q1EmiY} L ${q1EmiX} ${G.gndY - 6}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={2.0}/>
        <SvgFadeIn duration={0.3} delay={2.4}>
          <GroundMark cx={q1EmiX} yTop={G.gndY}/>
        </SvgFadeIn>

        {/* Q2 symbol */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <NpnSymbol cx={G.rightCx} cy={G.symY} scale={SCALE}/>
        </SvgFadeIn>
        {/* Q2 label */}
        <SvgFadeIn duration={0.3} delay={2.8}>
          <text x={G.rightCx + 12} y={G.symY - COL_DY - 8}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            Q<tspan baselineShift="sub" fontSize={11}>2</tspan>
          </text>
        </SvgFadeIn>

        {/* Q2 emitter → ground */}
        <TraceIn d={`M ${q2EmiX} ${q2EmiY} L ${q2EmiX} ${G.gndY - 6}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={2.6}/>
        <SvgFadeIn duration={0.3} delay={2.8}>
          <GroundMark cx={q2EmiX} yTop={G.gndY}/>
        </SvgFadeIn>

        {/* R_L on Q2's COLLECTOR x — V_CC down to Q2 collector */}
        <TraceIn d={`M ${q2ColX} ${G.vccY} L ${q2ColX} ${G.rLTop}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.3} delay={2.8}/>
        <TraceIn d={resistorVerticalD(q2ColX, G.rLTop, G.rLBot)}
                 stroke="var(--chalk-200)" strokeWidth={2.4}
                 duration={0.6} delay={3.0}/>
        <SvgFadeIn duration={0.3} delay={3.2}>
          <text x={q2ColX + 18} y={(G.rLTop + G.rLBot) / 2 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={11}>L</tspan>
          </text>
        </SvgFadeIn>
        {/* R_L bottom → Q2 collector */}
        <TraceIn d={`M ${q2ColX} ${G.rLBot} L ${q2ColX} ${q2ColY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.3} delay={3.4}/>

        {/* Current labels: I_ref ↓ next to R_ref, I_out ↓ next to R_L */}
        <SvgFadeIn duration={0.3} delay={4.0}>
          <text x={q1ColX - 18} y={G.refTop - 18} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            I<tspan baselineShift="sub" fontSize={11}>ref</tspan>
          </text>
          <line x1={q1ColX - 24} y1={G.refTop - 12} x2={q1ColX - 24} y2={G.refTop + 6}
                stroke="var(--amber-300)" strokeWidth={1.6}/>
          <polygon points={`${q1ColX - 24} ${G.refTop + 10},${q1ColX - 28} ${G.refTop + 2},${q1ColX - 20} ${G.refTop + 2}`}
                   fill="var(--amber-300)"/>

          <text x={q2ColX + 18} y={G.rLTop - 18}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            I<tspan baselineShift="sub" fontSize={11}>out</tspan>
          </text>
          <line x1={q2ColX + 24} y1={G.rLTop - 12} x2={q2ColX + 24} y2={G.rLTop + 6}
                stroke="var(--amber-300)" strokeWidth={1.6}/>
          <polygon points={`${q2ColX + 24} ${G.rLTop + 10},${q2ColX + 20} ${G.rLTop + 2},${q2ColX + 28} ${G.rLTop + 2}`}
                   fill="var(--amber-300)"/>
        </SvgFadeIn>

        {/* V_BE annotation just ABOVE the shared base rail so it doesn't
            collide with the body bars (which extend below the base line). */}
        <SvgFadeIn duration={0.3} delay={4.4}>
          <text x={(G.leftCx + G.rightCx) / 2} y={G.symY - 12} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.12em">
            shared V_BE
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            R_ref sets the reference. Q2 sees the same V_BE — so it carries the same current.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Matching argument ───────────────────────────────────────────
function MatchingBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28, textAlign: 'center',
    }}>
      <FadeUp duration={0.4} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        why it works
      </FadeUp>

      <FadeUp duration={0.5} delay={0.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-200)',
        }}>
        I<sub>C</sub> = I<sub>S</sub>(e<sup>V<sub>BE</sub>/V<sub>T</sub></sup> − 1)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 17,
          color: 'var(--chalk-300)', maxWidth: portrait ? '24ch' : 'none',
          letterSpacing: '0.02em', lineHeight: 1.4,
        }}>
          collector current depends <em>only</em> on V<sub>BE</sub>
      </FadeUp>

      <FadeUp duration={0.4} delay={2.4} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 16,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>

      <FadeUp duration={0.6} delay={2.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 44 : 60,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        I<sub>out</sub> = I<sub>ref</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={4.2} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', marginTop: 4,
          maxWidth: portrait ? '28ch' : 'none',
          textAlign: 'center', lineHeight: 1.45,
        }}>
        the mirror identity — exact for matched, ideal transistors
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Live sweep — genuine motion ─────────────────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // I_ref sweeps as a slow sinusoid between 0.4 mA and 2.6 mA so the
  // mirror always sits in the active region. I_out = I_ref tick for tick.
  const SETUP = 0.4;
  const t = Math.max(0, localTime - SETUP);
  const PERIOD = Math.max(spriteDur - SETUP - 0.4, 6);
  const phase = t / PERIOD;
  // Triangle-like cosine sweep — easier to read than a fast sin.
  const sweep = 0.5 - 0.5 * Math.cos(2 * Math.PI * phase);
  const I_REF_MIN = 0.4, I_REF_MAX = 2.6;
  const iRef = I_REF_MIN + sweep * (I_REF_MAX - I_REF_MIN);
  const iOut = iRef; // ideal mirror

  // Layout — landscape: schematic-on-left + bars-on-right. Portrait:
  // schematic-on-top + bars-on-bottom.
  const G = portrait
    ? { vbW: 600, vbH: 760,
        diagX: 60, diagY: 60, diagW: 480, diagH: 320,
        barsX: 60, barsY: 410, barsW: 480, barsH: 280,
        captionY: 740 }
    : { vbW: 1180, vbH: 480,
        diagX: 60, diagY: 60, diagW: 520, diagH: 360,
        barsX: 640, barsY: 60, barsW: 480, barsH: 360,
        captionY: 460 };

  // Mini-mirror schematic — same shape as Beat 2, scaled to fit a 520×360
  // box. Uses pin-relative geometry so wires land on the actual collector
  // and base of NpnSymbol (which sits at offsets COL_DX / BASE_DX from cx).
  function MiniMirror() {
    const U = 22;
    const COL_DX = U * 0.7;
    const COL_DY = U * 1.5;
    const BASE_DX = U * 1.4;
    const leftCx = G.diagX + 130;
    const rightCx = G.diagX + 360;
    const vccY = G.diagY + 30;
    const symY = G.diagY + 200;
    const gndY = G.diagY + 320;
    const q1Col = { x: leftCx + COL_DX, y: symY - COL_DY };
    const q2Col = { x: rightCx + COL_DX, y: symY - COL_DY };
    const q1Emi = { x: leftCx + COL_DX, y: symY + COL_DY };
    const q2Emi = { x: rightCx + COL_DX, y: symY + COL_DY };
    const refBot = vccY + 90;
    return (
      <g>
        {/* V_CC rail */}
        <line x1={q1Col.x - 50} y1={vccY} x2={q2Col.x + 50} y2={vccY}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <text x={q2Col.x + 64} y={vccY + 5}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={14}>
          V<tspan baselineShift="sub" fontSize={9}>CC</tspan>
        </text>
        {/* R_ref on Q1's collector x */}
        <path d={resistorVerticalD(q1Col.x, vccY + 6, refBot)}
              stroke="var(--amber-400)" strokeWidth={2.2}
              fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        <text x={q1Col.x - 18} y={vccY + 56} textAnchor="end"
              fill="var(--chalk-200)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={14}>
          R<tspan baselineShift="sub" fontSize={9}>ref</tspan>
        </text>
        {/* R_ref → Q1 collector */}
        <line x1={q1Col.x} y1={refBot} x2={q1Col.x} y2={q1Col.y}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        {/* Q1 */}
        <NpnSymbol cx={leftCx} cy={symY} scale={1.0}/>
        {/* Diode-connect: short L from collector to base */}
        <line x1={q1Col.x} y1={refBot - 4} x2={leftCx - BASE_DX} y2={refBot - 4}
              stroke="var(--amber-300)" strokeWidth={2}/>
        <line x1={leftCx - BASE_DX} y1={refBot - 4}
              x2={leftCx - BASE_DX} y2={symY}
              stroke="var(--amber-300)" strokeWidth={2}/>
        {/* shared base rail */}
        <line x1={leftCx - BASE_DX} y1={symY} x2={rightCx - BASE_DX} y2={symY}
              stroke="var(--amber-300)" strokeWidth={2}/>
        {/* emitter→GND for Q1 */}
        <line x1={q1Emi.x} y1={q1Emi.y} x2={q1Emi.x} y2={gndY - 6}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <GroundMark cx={q1Emi.x} yTop={gndY}/>
        {/* Q2 */}
        <NpnSymbol cx={rightCx} cy={symY} scale={1.0}/>
        {/* Top of Q2 — straight wire to V_CC (no R_L in mini view) */}
        <line x1={q2Col.x} y1={q2Col.y} x2={q2Col.x} y2={vccY}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        {/* emitter→GND for Q2 */}
        <line x1={q2Emi.x} y1={q2Emi.y} x2={q2Emi.x} y2={gndY - 6}
              stroke="var(--chalk-200)" strokeWidth={2}/>
        <GroundMark cx={q2Emi.x} yTop={gndY}/>
        {/* Labels above the symbols */}
        <text x={leftCx - 12} y={symY - COL_DY - 8} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={14}>
          Q<tspan baselineShift="sub" fontSize={9}>1</tspan>
        </text>
        <text x={rightCx + 12} y={symY - COL_DY - 8}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={14}>
          Q<tspan baselineShift="sub" fontSize={9}>2</tspan>
        </text>
      </g>
    );
  }

  // Twin bar gauges. Same x-anchor, identical scale so equality is obvious.
  const BAR_GAP = 80;
  const BAR_W = 60;
  const BAR_H = G.barsH - 100;
  const refX = G.barsX + 80;
  const outX = refX + BAR_GAP + 60;
  const barBaseY = G.barsY + 60 + BAR_H;
  const fracRef = iRef / I_REF_MAX;
  const fracOut = iOut / I_REF_MAX;
  const refBarH = fracRef * BAR_H;
  const outBarH = fracOut * BAR_H;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Mini mirror schematic */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <MiniMirror/>
        </SvgFadeIn>

        {/* Twin bar gauges */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {/* Eyebrow header */}
          <text x={(refX + outX) / 2} y={G.barsY + 20} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">
            I_REF  vs  I_OUT  (mA)
          </text>

          {/* Reference bar outline */}
          <rect x={refX - BAR_W / 2} y={G.barsY + 60}
                width={BAR_W} height={BAR_H}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.5} rx={3}/>
          {/* Output bar outline */}
          <rect x={outX - BAR_W / 2} y={G.barsY + 60}
                width={BAR_W} height={BAR_H}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.5} rx={3}/>
        </SvgFadeIn>

        {/* Live bars */}
        <rect x={refX - BAR_W / 2} y={barBaseY - refBarH}
              width={BAR_W} height={refBarH}
              fill="var(--amber-400)" opacity={0.85} rx={2}/>
        <rect x={outX - BAR_W / 2} y={barBaseY - outBarH}
              width={BAR_W} height={outBarH}
              fill="var(--amber-300)" opacity={0.85} rx={2}/>

        {/* Bar labels */}
        <text x={refX} y={barBaseY + 24} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>
          I<tspan baselineShift="sub" fontSize={11}>ref</tspan>
        </text>
        <text x={outX} y={barBaseY + 24} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>
          I<tspan baselineShift="sub" fontSize={11}>out</tspan>
        </text>

        {/* Live numeric readouts */}
        <text x={refX} y={G.barsY + 50} textAnchor="middle"
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={13} letterSpacing="0.08em">
          {iRef.toFixed(2)}
        </text>
        <text x={outX} y={G.barsY + 50} textAnchor="middle"
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={13} letterSpacing="0.08em">
          {iOut.toFixed(2)}
        </text>

        {/* Connecting bracket between bar tops — emphasises equality */}
        <line x1={refX} y1={barBaseY - refBarH - 8}
              x2={outX} y2={barBaseY - outBarH - 8}
              stroke="var(--rose-300)" strokeWidth={1.4}
              strokeDasharray="3 3" opacity={0.7}/>
        <text x={(refX + outX) / 2} y={barBaseY - refBarH - 14}
              textAnchor="middle"
              fill="var(--rose-300)" fontFamily="var(--font-mono)"
              fontSize={11} letterSpacing="0.12em">=</text>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            both bars rise and fall together — that's the mirror
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
          fontSize: portrait ? 28 : 34,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        The bias-current backbone of every analog IC.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        op-amps  ·  references  ·  amplifiers
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '28ch' : '52ch', lineHeight: 1.45,
        }}>
        once you can copy a current cleanly, you can bias everything else from one well-controlled reference.
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
