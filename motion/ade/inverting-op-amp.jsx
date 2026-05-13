// Inverting Op-Amp: Why the Gain Is a Ratio of Resistors — Manimo lesson scene.
// V_in → R1 → V- node; Rf from V- to V_out; V+ tied to ground. Negative
// feedback pins V- to V+ (virtual ground), so the same current threads
// R1 and Rf and V_out = -(Rf/R1) · V_in. Genuine animation lives in
// Beat 5: a synchronised scope plot — V_in is a slow sine, V_out is the
// same sine inverted and amplified by Rf/R1, both tracing left-to-right
// behind a live time cursor.
//
// Beats (timed to Mistral Voxtral narration in motion/ade/audio/inverting-op-amp/):
//    0.00– 6.78   Manimo intro: two resistors, one op-amp — where does V_out land?
//    6.78–17.21   Circuit: op-amp, R1 in, Rf feedback, V+ to ground
//   17.21–29.44   Virtual short: negative feedback makes V- = V+ = 0
//   29.44–44.08   Formula chain: I = V_in/R1 → V_out = -(Rf/R1) · V_in
//   44.08–53.00   Scope sweep: V_in sine + V_out inverted-and-amplified
//   53.00–62.00   Takeaway: the gain is a resistor ratio, the sign is flipped
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 5 uses useSprite() localTime to drive a synchronous trace +
//     cursor, so V_in and V_out land on screen at the same moment.

const SCENE_DURATION = 62;

const NARRATION = [
  /*  0.00– 6.78 */ "An op-amp with one resistor in, one resistor in the feedback — what does that do to a signal?",
  /*  6.78–17.21 */ "Send V in through R one into the inverting input. Tie a feedback resistor R f from the output back to the same node. The non-inverting input is grounded.",
  /* 17.21–29.44 */ "The op-amp drives its output until V minus equals V plus. V plus sits at ground, so V minus is forced to zero volts — a virtual ground that the wire never actually touches.",
  /* 29.44–44.08 */ "The same current flows through R one and R f, so V out equals minus R f over R one times V in. Push V in up by one volt, output drops by R f over R one volts.",
  /* 44.08–53.00 */ "Sweep V in as a slow sine. V out is the same sine, flipped upside down and scaled by the resistor ratio.",
  /* 53.00–62.00 */ "Negative feedback locks the inverting input to ground. The gain is the resistor ratio, and the sign is flipped.",
];

const NARRATION_AUDIO = 'audio/inverting-op-amp/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="Inverting Op-Amp: Why the Gain Is a Ratio of Resistors"
      duration={SCENE_DURATION}
      introEnd={6.78}
      introCaption="Two resistors, one op-amp — where does V_out land?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.78} end={17.21}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={17.21} end={29.44}>
        <VirtualShortBeat />
      </Sprite>

      <Sprite start={29.44} end={44.08}>
        <FormulaBeat />
      </Sprite>

      <Sprite start={44.08} end={53}>
        <SweepBeat />
      </Sprite>

      <Sprite start={53} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────
// Horizontal zigzag resistor between two x's along a fixed y.
function zigzagH(cx1, cx2, cy, amp = 8, n = 8) {
  const dx = (cx2 - cx1) / n;
  const pts = [`M ${cx1} ${cy}`];
  for (let i = 1; i < n; i++) {
    const x = cx1 + i * dx;
    const y = cy + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx2} ${cy}`);
  return pts.join(' ');
}

// Op-amp triangle outline. (apexX, apexY) is the output tip; the back of
// the triangle is the input side. Returns SVG <path> data.
function opampPath(apexX, apexY, height, length) {
  const backX = apexX - length;
  const topY = apexY - height / 2;
  const botY = apexY + height / 2;
  return `M ${backX} ${topY} L ${backX} ${botY} L ${apexX} ${apexY} Z`;
}

// Standard EE ground triangle — three lines getting shorter, pointing down.
function GroundSymbol({ cx, cy, color = 'var(--chalk-300)' }) {
  return (
    <g>
      <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={color} strokeWidth={2}/>
      <line x1={cx - 9}  y1={cy + 5} x2={cx + 9}  y2={cy + 5} stroke={color} strokeWidth={2}/>
      <line x1={cx - 4}  y1={cy + 10} x2={cx + 4}  y2={cy + 10} stroke={color} strokeWidth={2}/>
    </g>
  );
}

// Geometry generator — same shape for both aspects, scaled per panel size.
// Returns every coordinate needed across the circuit beats so the three
// circuit beats stay perfectly aligned.
function circuitGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 640,
      opAx: 480, opAy: 360, opH: 130, opL: 120,    // op-amp apex
      vInX: 60,                                     // V_in label x
      r1Start: 100, r1End: 320,                     // R1 horizontal range
      vMinusY: 330,                                 // top input line y
      vPlusY: 390,                                  // bottom input line y
      rfTopY: 220,                                  // feedback top horizontal y
      rfX1: 320, rfX2: 460,                         // Rf zigzag range along top
      vOutX: 560, vOutEndX: 580,                    // output stub x range
      gndCy: 470,                                   // ground y below V+
      labelFont: 18, eyebrowFont: 11, captionY: 605,
    };
  }
  return {
    vbW: 1080, vbH: 440,
    opAx: 760, opAy: 240, opH: 140, opL: 130,
    vInX: 70,
    r1Start: 110, r1End: 530,
    vMinusY: 210,
    vPlusY: 270,
    rfTopY: 110,
    rfX1: 480, rfX2: 720,
    vOutX: 880, vOutEndX: 980,
    gndCy: 340,
    labelFont: 18, eyebrowFont: 11, captionY: 410,
  };
}

// ─── Beat 2: Circuit diagram ─────────────────────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <CircuitSvg G={G} portrait={portrait} highlightVMinus={false}/>
    </div>
  );
}

// Shared diagram renderer used by beats 2 + 3 (beat 3 highlights the V- node).
function CircuitSvg({ G, portrait, highlightVMinus }) {
  const opBackX = G.opAx - G.opL;
  // Input pins meet the op-amp back at vMinusY (top) and vPlusY (bottom).
  // Pin label glyphs (− / +) live just inside the triangle's back.
  return (
    <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
         style={{ overflow: 'visible' }}>
      {/* Op-amp triangle */}
      <SvgFadeIn duration={0.5} delay={0.2}>
        <path d={opampPath(G.opAx, G.opAy, G.opH, G.opL)}
              fill="none" stroke="var(--amber-400)" strokeWidth={2.4}
              strokeLinejoin="round"/>
        {/* − / + glyphs on the input pins */}
        <text x={opBackX + 16} y={G.vMinusY + 6}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.labelFont}>−</text>
        <text x={opBackX + 16} y={G.vPlusY + 6}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.labelFont}>+</text>
      </SvgFadeIn>

      {/* R1 zigzag: V_in → V- node */}
      <TraceIn d={zigzagH(G.r1Start, G.r1End, G.vMinusY, 8)}
        stroke="var(--amber-400)" strokeWidth={2.4}
        duration={0.9} delay={1.0}/>
      {/* Short wires either side of R1 */}
      <TraceIn d={`M ${G.vInX + 28} ${G.vMinusY} L ${G.r1Start} ${G.vMinusY}`}
        stroke="var(--chalk-200)" strokeWidth={2}
        duration={0.4} delay={0.8}/>
      <TraceIn d={`M ${G.r1End} ${G.vMinusY} L ${opBackX} ${G.vMinusY}`}
        stroke="var(--chalk-200)" strokeWidth={2}
        duration={0.4} delay={1.6}/>

      {/* V_in source label + small open-circle terminal */}
      <SvgFadeIn duration={0.4} delay={0.6}>
        <circle cx={G.vInX + 18} cy={G.vMinusY} r={5}
                fill="var(--bg-canvas)" stroke="var(--chalk-200)" strokeWidth={1.8}/>
        <text x={G.vInX} y={G.vMinusY - 14}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.labelFont}>
          V<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>in</tspan>
        </text>
      </SvgFadeIn>

      {/* R1 label above zigzag */}
      <SvgFadeIn duration={0.35} delay={1.4}>
        <text x={(G.r1Start + G.r1End) / 2} y={G.vMinusY - 18} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.labelFont}>
          R<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>1</tspan>
        </text>
      </SvgFadeIn>

      {/* Feedback loop: from V- node UP to rfTopY, ACROSS via Rf zigzag, RIGHT
          to apex column, DOWN to output. We trace it as three legs so each
          segment animates left-to-right naturally. */}
      <TraceIn d={`M ${(G.r1End + opBackX) / 2} ${G.vMinusY} L ${(G.r1End + opBackX) / 2} ${G.rfTopY} L ${G.rfX1} ${G.rfTopY}`}
        stroke="var(--chalk-200)" strokeWidth={2}
        duration={0.5} delay={2.0}/>
      <TraceIn d={zigzagH(G.rfX1, G.rfX2, G.rfTopY, 8)}
        stroke="var(--amber-400)" strokeWidth={2.4}
        duration={0.9} delay={2.4}/>
      <TraceIn d={`M ${G.rfX2} ${G.rfTopY} L ${G.opAx} ${G.rfTopY} L ${G.opAx} ${G.opAy}`}
        stroke="var(--chalk-200)" strokeWidth={2}
        duration={0.5} delay={3.2}/>

      {/* Rf label */}
      <SvgFadeIn duration={0.35} delay={2.8}>
        <text x={(G.rfX1 + G.rfX2) / 2} y={G.rfTopY - 14} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.labelFont}>
          R<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>f</tspan>
        </text>
      </SvgFadeIn>

      {/* V+ to ground */}
      <TraceIn d={`M ${opBackX} ${G.vPlusY} L ${opBackX - 60} ${G.vPlusY} L ${opBackX - 60} ${G.gndCy}`}
        stroke="var(--chalk-200)" strokeWidth={2}
        duration={0.5} delay={3.0}/>
      <SvgFadeIn duration={0.35} delay={3.4}>
        <GroundSymbol cx={opBackX - 60} cy={G.gndCy} color="var(--chalk-300)"/>
      </SvgFadeIn>

      {/* Output wire + V_out label */}
      <TraceIn d={`M ${G.opAx} ${G.opAy} L ${G.vOutEndX} ${G.opAy}`}
        stroke="var(--chalk-200)" strokeWidth={2}
        duration={0.5} delay={3.4}/>
      <SvgFadeIn duration={0.4} delay={3.8}>
        <text x={G.vOutEndX + 8} y={G.opAy + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.labelFont}>
          V<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>out</tspan>
        </text>
      </SvgFadeIn>

      {/* V- node highlight (only when this beat asks for it) */}
      {highlightVMinus && (
        <SvgFadeIn duration={0.4} delay={0.3}>
          <circle cx={(G.r1End + opBackX) / 2} cy={G.vMinusY} r={9}
                  fill="none" stroke="var(--rose-400)" strokeWidth={2}/>
          <circle cx={(G.r1End + opBackX) / 2} cy={G.vMinusY} r={4}
                  fill="var(--rose-400)" opacity={0.9}/>
        </SvgFadeIn>
      )}

      {/* Caption beneath */}
      {!highlightVMinus && (
        <SvgFadeIn duration={0.4} delay={4.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            input through R<tspan fontFamily="var(--font-serif)" fontStyle="italic">1</tspan>, feedback through R<tspan fontFamily="var(--font-serif)" fontStyle="italic">f</tspan>
          </text>
        </SvgFadeIn>
      )}
    </svg>
  );
}

// ─── Beat 3: Virtual short — V- locked to V+ = 0 ─────────────────────────
function VirtualShortBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);
  const vMinusX = (G.r1End + (G.opAx - G.opL)) / 2;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH + (portrait ? 0 : 40)}
           viewBox={`0 0 ${G.vbW} ${G.vbH + (portrait ? 0 : 40)}`}
           style={{ overflow: 'visible' }}>
        {/* Reduced-opacity skeleton — already-mounted from prior beat sense */}
        <g opacity={0.55}>
          <CircuitSkeleton G={G}/>
        </g>

        {/* Pulsing V- node ring */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <circle cx={vMinusX} cy={G.vMinusY} r={12}
                  fill="none" stroke="var(--rose-400)" strokeWidth={2}/>
          <circle cx={vMinusX} cy={G.vMinusY} r={5}
                  fill="var(--rose-400)" opacity={0.95}/>
        </SvgFadeIn>

        {/* Annotation line + label. Landscape: dashed line + side badge to
            the right of V−. Portrait: badge floats well below the diagram
            (above the caption row); a short dashed line drops down from V−
            to the badge through the clear corridor to the right of the V+
            ground wire (the V+ stem sits at opBackX − 60, so we offset the
            line one wire-width to the right of V−). */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          {portrait ? (
            <g>
              <line x1={vMinusX + 20} y1={G.vMinusY}
                    x2={vMinusX + 20} y2={G.vMinusY + 140}
                    stroke="var(--rose-300)" strokeWidth={1.4}
                    strokeDasharray="3 3"/>
              <text x={vMinusX + 20} y={G.vMinusY + 162}
                    textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.08em">VIRTUAL GROUND</text>
              <text x={vMinusX + 20} y={G.vMinusY + 188}
                    textAnchor="middle"
                    fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.labelFont}>
                V<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>−</tspan> = 0 V
              </text>
            </g>
          ) : (
            <g>
              <line x1={vMinusX} y1={G.vMinusY - 14}
                    x2={vMinusX + 70} y2={G.vMinusY - 56}
                    stroke="var(--rose-300)" strokeWidth={1.4}
                    strokeDasharray="3 3"/>
              <text x={vMinusX + 80} y={G.vMinusY - 60}
                    fill="var(--rose-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.08em">VIRTUAL GROUND</text>
              <text x={vMinusX + 80} y={G.vMinusY - 42}
                    fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.labelFont}>
                V<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>−</tspan> = 0 V
              </text>
            </g>
          )}
        </SvgFadeIn>

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 16 : 18}>
            negative feedback locks V− to V+, and V+ is ground
          </text>
        </SvgFadeIn>

        {/* Big payoff equality */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY + (portrait ? 28 : 36)} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 32}>
            V<tspan baselineShift="sub" fontSize={portrait ? 14 : 18}>−</tspan> = V<tspan baselineShift="sub" fontSize={portrait ? 14 : 18}>+</tspan> = 0
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Static (non-animated) version of the circuit, used as a faded background
// in beats that focus on a single annotation. Geometry exactly matches
// the animated CircuitSvg so nothing jumps between beats.
function CircuitSkeleton({ G }) {
  const opBackX = G.opAx - G.opL;
  const vMinusX = (G.r1End + opBackX) / 2;
  return (
    <g>
      <path d={opampPath(G.opAx, G.opAy, G.opH, G.opL)}
            fill="none" stroke="var(--amber-400)" strokeWidth={2.4}
            strokeLinejoin="round"/>
      <text x={opBackX + 16} y={G.vMinusY + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={G.labelFont}>−</text>
      <text x={opBackX + 16} y={G.vPlusY + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={G.labelFont}>+</text>
      <path d={zigzagH(G.r1Start, G.r1End, G.vMinusY, 8)}
            fill="none" stroke="var(--amber-400)" strokeWidth={2.4}/>
      <line x1={G.vInX + 28} y1={G.vMinusY} x2={G.r1Start} y2={G.vMinusY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.r1End} y1={G.vMinusY} x2={opBackX} y2={G.vMinusY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <circle cx={G.vInX + 18} cy={G.vMinusY} r={5}
              fill="var(--bg-canvas)" stroke="var(--chalk-200)" strokeWidth={1.8}/>
      <text x={G.vInX} y={G.vMinusY - 14}
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={G.labelFont}>
        V<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>in</tspan>
      </text>
      <line x1={vMinusX} y1={G.vMinusY} x2={vMinusX} y2={G.rfTopY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={vMinusX} y1={G.rfTopY} x2={G.rfX1} y2={G.rfTopY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <path d={zigzagH(G.rfX1, G.rfX2, G.rfTopY, 8)}
            fill="none" stroke="var(--amber-400)" strokeWidth={2.4}/>
      <line x1={G.rfX2} y1={G.rfTopY} x2={G.opAx} y2={G.rfTopY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.opAx} y1={G.rfTopY} x2={G.opAx} y2={G.opAy}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={opBackX} y1={G.vPlusY} x2={opBackX - 60} y2={G.vPlusY}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={opBackX - 60} y1={G.vPlusY} x2={opBackX - 60} y2={G.gndCy}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <GroundSymbol cx={opBackX - 60} cy={G.gndCy} color="var(--chalk-300)"/>
      <line x1={G.opAx} y1={G.opAy} x2={G.vOutEndX} y2={G.opAy}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <text x={G.vOutEndX + 8} y={G.opAy + 6}
            fill="var(--amber-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={G.labelFont}>
        V<tspan baselineShift="sub" fontSize={G.labelFont * 0.6}>out</tspan>
      </text>
    </g>
  );
}

// ─── Beat 4: Current formula chain ───────────────────────────────────────
function FormulaBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 28 : 32, letterSpacing: '0.02em',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 24,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        same current through R<sub>1</sub> and R<sub>f</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        I = V<sub>in</sub> / R<sub>1</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        V<sub>out</sub> = −I · R<sub>f</sub>
      </FadeUp>

      <FadeUp duration={0.4} delay={1.9} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>

      <FadeUp duration={0.6} delay={2.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 46, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: 4,
        }}>
        V<sub>out</sub> = −(R<sub>f</sub> / R<sub>1</sub>) · V<sub>in</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={4.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          marginTop: 6, textAlign: 'center',
          maxWidth: portrait ? '26ch' : '42ch', lineHeight: 1.4,
        }}>
        the gain is just the ratio of two resistors — and the sign flips
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Scope sweep — V_in sine and inverted/amplified V_out ────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Two stacked traces. The cursor sweeps left-to-right across the beat;
  // V_in and V_out are masked by the cursor position so they appear to
  // draw synchronously. Gain = -2, so V_out hits twice the amplitude.
  // V_out lane needs 2× the V_in amplitude (gain = −2). To keep the same
  // visual ratio between the two traces, share a single amp value and let
  // the gain multiplier in tracePath scale V_out.
  const G = portrait
    ? { vbW: 600, vbH: 720, panelX: 60, panelW: 480,
        inTop: 80, inBot: 280, inMid: 180, inAmp: 55,
        outTop: 340, outBot: 600, outMid: 470, outAmp: 55,
        axisFont: 12, labelFont: 14, captionY: 680 }
    : { vbW: 1080, vbH: 440, panelX: 100, panelW: 880,
        inTop: 30, inBot: 180, inMid: 105, inAmp: 40,
        outTop: 220, outBot: 400, outMid: 310, outAmp: 40,
        axisFont: 12, labelFont: 14, captionY: 430 };

  // Sweep: cursor goes 0 → 1 over (spriteDur - HOLD - TAIL).
  const HOLD = 0.6, TAIL = 0.4;
  const SWEEP_DUR = Math.max(spriteDur - HOLD - TAIL, 1);
  const traceFrac = clamp((localTime - HOLD) / SWEEP_DUR, 0, 1);
  const cursorX = G.panelX + traceFrac * G.panelW;

  // 1.5 sine cycles across the panel.
  const CYCLES = 1.5;
  const GAIN = -2.0;

  // Build the path for V_in (or V_out) up to the cursor's current x.
  function tracePath(amp, midY, frac, scale = 1) {
    const samples = 220;
    const upto = Math.max(1, Math.floor(samples * frac));
    const pts = [];
    for (let i = 0; i <= upto; i++) {
      const u = (i / samples);
      const x = G.panelX + u * G.panelW;
      const y = midY - amp * scale * Math.sin(u * CYCLES * 2 * Math.PI);
      pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }
  const vInD  = tracePath(G.inAmp,  G.inMid,  traceFrac, 1);
  const vOutD = tracePath(G.outAmp, G.outMid, traceFrac, GAIN);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Lane backgrounds */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <rect x={G.panelX} y={G.inTop} width={G.panelW} height={G.inBot - G.inTop}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1} opacity={0.35}
                rx={4}/>
          <rect x={G.panelX} y={G.outTop} width={G.panelW} height={G.outBot - G.outTop}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1} opacity={0.35}
                rx={4}/>
        </SvgFadeIn>

        {/* Zero baselines (the +y/-y midline of each lane) */}
        <SvgFadeIn duration={0.4} delay={0.1}>
          <line x1={G.panelX} y1={G.inMid} x2={G.panelX + G.panelW} y2={G.inMid}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}
                strokeDasharray="3 4"/>
          <line x1={G.panelX} y1={G.outMid} x2={G.panelX + G.panelW} y2={G.outMid}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}
                strokeDasharray="3 4"/>
        </SvgFadeIn>

        {/* Lane labels */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.panelX} y={G.inTop - 8}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.axisFont} letterSpacing="0.14em">V_IN</text>
          <text x={G.panelX} y={G.outTop - 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.axisFont} letterSpacing="0.14em">V_OUT</text>
        </SvgFadeIn>

        {/* Live V_in trace */}
        {traceFrac > 0 && (
          <path d={vInD} fill="none"
                stroke="var(--chalk-100)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {/* Live V_out trace */}
        {traceFrac > 0 && (
          <path d={vOutD} fill="none"
                stroke="var(--amber-300)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Time cursor */}
        {traceFrac > 0.005 && traceFrac < 0.995 && (
          <line x1={cursorX} y1={G.inTop - 6}
                x2={cursorX} y2={G.outBot + 6}
                stroke="var(--amber-300)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.6}/>
        )}

        {/* Gain badge — sits between the two lanes */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <text x={G.vbW - 30} y={(G.inBot + G.outTop) / 2 + 4}
                textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 13 : 14} letterSpacing="0.08em">
            gain = −(R<tspan fontFamily="var(--font-serif)" fontStyle="italic">f</tspan>/R<tspan fontFamily="var(--font-serif)" fontStyle="italic">1</tspan>) = −2
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            same shape, flipped over and scaled by R<tspan fontFamily="var(--font-serif)" fontStyle="italic">f</tspan>/R<tspan fontFamily="var(--font-serif)" fontStyle="italic">1</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 6: Takeaway ────────────────────────────────────────────────────
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
          fontSize: portrait ? 30 : 42, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        V<sub>out</sub> = −(R<sub>f</sub> / R<sub>1</sub>) · V<sub>in</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        two resistors set the gain. the minus sign is the inversion.
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
