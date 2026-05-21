// The Schmitt Trigger: Why a Comparator Needs Hysteresis — Manimo lesson.
// Inverting op-amp with positive feedback through R1/R2 creates two
// thresholds: V_TH = +V_sat·β and V_TL = −V_sat·β (β = R1/(R1+R2)).
// Once the output snaps, the trigger ignores small input wiggles inside
// the V_TL..V_TH band — a noisy crossing produces one clean edge, not
// chatter. Genuine motion lives in Beat 4: a triangle V_in sweeps up
// then back down, V_out snaps at V_TH and V_TL, and a third pane draws
// the actual (V_in, V_out) hysteresis loop as a tracked dot.
//
// Beats (placeholder timings — Step 4c rewires from audio manifest):
//    0– 6    Manimo intro: noisy crossings make comparators chatter
//    6–18    Schematic: op-amp + R1/R2 feedback to V+
//   18–30    Two thresholds V_TH, V_TL appear on the V_out vs V_in plot
//   30–44    Triangle V_in sweep + square V_out snap + tracked loop
//   44–50    Takeaway: V_TH − V_TL is the band noise can't cross
//
// Authoring notes:
//   • Beat 4's three panes (V_in, V_out, loop) all share the same
//     localTime so the cursor + tracked dot move in lockstep.
//   • All geometry branches on usePortrait().

const SCENE_DURATION = 58;

// Threshold band (in normalised V_in units centred on 0):
const V_TH = +0.5;
const V_TL = -0.5;
const V_SAT = 1.0; // ±V_sat in normalised V_out units

const NARRATION = [
  /*  0– 6  */ "A plain comparator chatters when a noisy input crosses the reference. How do you give it a backbone?",
  /*  6–18 */ "Take an op-amp and wire feedback from the output back to the plus input through a resistor divider. That's positive feedback — the opposite of what you used for an amplifier.",
  /* 18–30 */ "When the output is high, the divider pushes the plus input up — the trip threshold V T H climbs. When the output is low, V plus drops, and the threshold falls to V T L. Two different thresholds for the same circuit.",
  /* 30–44 */ "Now sweep the input slowly up then back down. The output sits low until V in passes V T H — only then does it snap up. On the way back, V in must drop all the way to V T L before it snaps back. Two thresholds, one loop, no chatter.",
  /* 44–50 */ "That gap is the hysteresis band. Any noise smaller than the band can't toggle the output — one clean edge per real crossing.",
];

const NARRATION_AUDIO = 'audio/schmitt-trigger/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="The Schmitt Trigger: Why a Comparator Needs Hysteresis"
      duration={SCENE_DURATION}
      introEnd={6.32}
      introCaption="Noisy crossing → output chatter. Hysteresis is the fix."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.32} end={16.56}>
        <SchematicBeat />
      </Sprite>

      <Sprite start={16.56} end={31.73}>
        <ThresholdsBeat />
      </Sprite>

      <Sprite start={31.73} end={48.99}>
        <HysteresisMotionBeat />
      </Sprite>

      <Sprite start={48.99} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared: op-amp triangle ─────────────────────────────────────────────
function OpAmpSymbol({ cx, cy, w = 110, h = 90, plusOnBottom = false }) {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  const plusY = plusOnBottom ? cy + h / 4 : cy - h / 4;
  const minusY = plusOnBottom ? cy - h / 4 : cy + h / 4;
  return (
    <g>
      <path d={`M ${left} ${top} L ${right} ${cy} L ${left} ${bot} Z`}
            fill="rgba(244,184,96,0.06)"
            stroke="var(--amber-400)" strokeWidth={2}/>
      <text x={left + 10} y={plusY + 4}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={14}>+</text>
      <text x={left + 10} y={minusY + 4}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={14}>−</text>
    </g>
  );
}

// Vertical zigzag resistor between (cx, yTop) and (cx, yBot).
function resistorVerticalD(cx, yTop, yBot, amp = 7, n = 6) {
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
// Inverting Schmitt trigger: V_in → V−, V+ pulled by R1/R2 divider from
// V_out and ground. We draw V_in on the lower (V−) input and the
// divider feeding the upper (V+) input.
function SchematicBeat() {
  const portrait = usePortrait();

  // Divider column (plusX) lives on the FAR LEFT of the canvas so V_in's
  // horizontal wire to V− never crosses R1's vertical. V+ then routes
  // RIGHT across the top of the schematic to the V+ input pin.
  const G = portrait
    ? { vbW: 600, vbH: 660,
        opCx: 350, opCy: 320, opW: 130, opH: 120,
        vinX: 200, vinY: 350,
        outX: 540, outY: 320,
        plusX: 90,                 // R1/R2 column, far left
        junctionY: 220,
        r2TopY: 110,
        gndY: 480,
        captionY: 620 }
    : { vbW: 1000, vbH: 460,
        opCx: 560, opCy: 220, opW: 140, opH: 120,
        vinX: 200, vinY: 250,
        outX: 900, outY: 220,
        plusX: 100,                // R1/R2 column, far left
        junctionY: 140,
        r2TopY: 50,
        gndY: 380,
        captionY: 440 };

  const opLeft = G.opCx - G.opW / 2;
  const opRight = G.opCx + G.opW / 2;
  const inPlusY  = G.opCy - G.opH / 4;
  const inMinusY = G.opCy + G.opH / 4;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Op-amp */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <OpAmpSymbol cx={G.opCx} cy={G.opCy} w={G.opW} h={G.opH}/>
        </SvgFadeIn>

        {/* V_in into V− (lower) input — clean horizontal at inMinusY */}
        <TraceIn d={`M ${G.vinX} ${G.vinY} L ${opLeft} ${inMinusY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.7} delay={0.5}/>
        <SvgFadeIn duration={0.35} delay={0.7}>
          <text x={G.vinX - 8} y={G.vinY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* V+ wire from junction routed RIGHT across the top of the
            schematic, then DOWN into the V+ input pin. Crosses no other
            wire — V_in is at inMinusY well below junctionY. */}
        <TraceIn d={`M ${G.plusX} ${G.junctionY} L ${opLeft - 12} ${G.junctionY} L ${opLeft - 12} ${inPlusY} L ${opLeft} ${inPlusY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.6} delay={1.3}/>
        <SvgFadeIn duration={0.35} delay={1.5}>
          <circle cx={G.plusX} cy={G.junctionY} r={3} fill="var(--chalk-100)"/>
          <text x={G.plusX - 8} y={G.junctionY - 8} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.1em">V+</text>
        </SvgFadeIn>

        {/* R1: junction → ground (down) */}
        <TraceIn d={resistorVerticalD(G.plusX, G.junctionY, G.gndY - 30)}
          stroke="var(--amber-400)" strokeWidth={2.2}
          duration={0.6} delay={1.7}/>
        <SvgFadeIn duration={0.3} delay={2.0}>
          <text x={G.plusX - 18} y={(G.junctionY + G.gndY - 30) / 2 + 4} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            R<tspan baselineShift="sub" fontSize={11}>1</tspan>
          </text>
        </SvgFadeIn>
        <TraceIn d={`M ${G.plusX} ${G.gndY - 30} L ${G.plusX} ${G.gndY - 6}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.2} delay={2.2}/>
        <SvgFadeIn duration={0.3} delay={2.3}>
          <GroundMark cx={G.plusX} yTop={G.gndY}/>
        </SvgFadeIn>

        {/* R2: junction → V_out (up + over). Use a tee-shape:
            junction up to r2TopY, then over to outX, then down to opCy. */}
        <TraceIn d={resistorVerticalD(G.plusX, G.r2TopY + 8, G.junctionY)}
          stroke="var(--rose-400)" strokeWidth={2.2}
          duration={0.7} delay={2.7}/>
        <SvgFadeIn duration={0.3} delay={3.1}>
          <text x={G.plusX - 18} y={(G.r2TopY + G.junctionY) / 2 + 4} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            R<tspan baselineShift="sub" fontSize={11}>2</tspan>
          </text>
        </SvgFadeIn>

        {/* Feedback wire: junction-top across to output column, then down
            to V_out — highlighted in rose to make "positive feedback" obvious. */}
        <TraceIn d={`M ${G.plusX} ${G.r2TopY + 8} L ${G.plusX} ${G.r2TopY} L ${G.outX} ${G.r2TopY} L ${G.outX} ${G.opCy}`}
          stroke="var(--rose-400)" strokeWidth={2}
          duration={1.0} delay={3.4}/>

        {/* Output wire from op-amp tip → outX,opCy */}
        <TraceIn d={`M ${opRight} ${G.opCy} L ${G.outX} ${G.opCy}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={4.4}/>
        <SvgFadeIn duration={0.35} delay={4.6}>
          <text x={G.outX + 8} y={G.opCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            V<tspan baselineShift="sub" fontSize={11}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Feedback callout — pulses on the rose line */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <text x={(G.plusX + G.outX) / 2} y={G.r2TopY - 12} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.10em">
            POSITIVE FEEDBACK → V+
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the output now helps decide what the threshold is
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Two thresholds + hysteresis loop sketch ─────────────────────
// Shows the V_out vs V_in transfer characteristic with the two trip
// thresholds V_TH and V_TL marked. The loop edges trace in sequence.
function ThresholdsBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 580, vbH: 760,
        // formulas at top
        formY1: 110, formY2: 160,
        // plot
        ax0: 80, ax1: 500, axMid: 290,
        ay0: 660, ay1: 280, ayMid: 470,
        captionY: 740, fontAxis: 14, fontLabel: 16 }
    : { vbW: 1000, vbH: 460,
        formY1: 70, formY2: 70,
        ax0: 180, ax1: 860, axMid: 520,
        ay0: 380, ay1: 120, ayMid: 250,
        captionY: 440, fontAxis: 14, fontLabel: 16 };

  // Plot scale: V_in from -1 .. +1 (with V_TL, V_TH at ±0.5 in plot units);
  // V_out at ±V_sat (the rails) — drawn ay1+20 (high) / ay0-20 (low).
  const xTH = G.axMid + ((G.ax1 - G.axMid) * V_TH);
  const xTL = G.axMid + ((G.ax1 - G.axMid) * V_TL);
  const yHi = G.ay1 + 20;
  const yLo = G.ay0 - 20;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Formulas — stack in portrait, side-by-side in landscape */}
        {portrait ? (
          <>
            <SvgFadeIn duration={0.4} delay={0.4}>
              <text x={G.vbW / 2} y={G.formY1} textAnchor="middle"
                    fill="var(--teal-400)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={22}>
                V<tspan baselineShift="sub" fontSize={12}>TH</tspan>
                {' '}={' '}+V<tspan baselineShift="sub" fontSize={12}>sat</tspan>
                {' '}·{' '}R<tspan baselineShift="sub" fontSize={12}>1</tspan>/(R<tspan baselineShift="sub" fontSize={12}>1</tspan>+R<tspan baselineShift="sub" fontSize={12}>2</tspan>)
              </text>
            </SvgFadeIn>
            <SvgFadeIn duration={0.4} delay={1.2}>
              <text x={G.vbW / 2} y={G.formY2} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={22}>
                V<tspan baselineShift="sub" fontSize={12}>TL</tspan>
                {' '}={' '}−V<tspan baselineShift="sub" fontSize={12}>sat</tspan>
                {' '}·{' '}R<tspan baselineShift="sub" fontSize={12}>1</tspan>/(R<tspan baselineShift="sub" fontSize={12}>1</tspan>+R<tspan baselineShift="sub" fontSize={12}>2</tspan>)
              </text>
            </SvgFadeIn>
          </>
        ) : (
          <>
            <SvgFadeIn duration={0.4} delay={0.4}>
              <text x={G.vbW / 4} y={G.formY1} textAnchor="middle"
                    fill="var(--teal-400)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={22}>
                V<tspan baselineShift="sub" fontSize={12}>TH</tspan>
                {' '}={' '}+V<tspan baselineShift="sub" fontSize={12}>sat</tspan>
                {' '}·{' '}R<tspan baselineShift="sub" fontSize={12}>1</tspan>/(R<tspan baselineShift="sub" fontSize={12}>1</tspan>+R<tspan baselineShift="sub" fontSize={12}>2</tspan>)
              </text>
            </SvgFadeIn>
            <SvgFadeIn duration={0.4} delay={1.2}>
              <text x={(G.vbW * 3) / 4} y={G.formY2} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={22}>
                V<tspan baselineShift="sub" fontSize={12}>TL</tspan>
                {' '}={' '}−V<tspan baselineShift="sub" fontSize={12}>sat</tspan>
                {' '}·{' '}R<tspan baselineShift="sub" fontSize={12}>1</tspan>/(R<tspan baselineShift="sub" fontSize={12}>1</tspan>+R<tspan baselineShift="sub" fontSize={12}>2</tspan>)
              </text>
            </SvgFadeIn>
          </>
        )}

        {/* Axes */}
        <TraceIn d={`M ${G.ax0} ${G.ayMid} L ${G.ax1} ${G.ayMid}`}
          stroke="var(--chalk-300)" strokeWidth={1.5}
          duration={0.6} delay={2.4}/>
        <TraceIn d={`M ${G.axMid} ${G.ay0} L ${G.axMid} ${G.ay1}`}
          stroke="var(--chalk-300)" strokeWidth={1.5}
          duration={0.6} delay={2.7}/>
        <SvgFadeIn duration={0.4} delay={3.0}>
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

        {/* Threshold ticks */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <line x1={xTH} y1={G.ayMid - 5} x2={xTH} y2={G.ayMid + 5}
                stroke="var(--teal-400)" strokeWidth={2}/>
          <text x={xTH} y={G.ayMid + 22} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>
            V<tspan baselineShift="sub" fontSize={G.fontAxis * 0.6}>TH</tspan>
          </text>
          <line x1={xTL} y1={G.ayMid - 5} x2={xTL} y2={G.ayMid + 5}
                stroke="var(--rose-300)" strokeWidth={2}/>
          <text x={xTL} y={G.ayMid + 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>
            V<tspan baselineShift="sub" fontSize={G.fontAxis * 0.6}>TL</tspan>
          </text>
        </SvgFadeIn>

        {/* +V_sat / -V_sat rail labels on the V_out axis */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.axMid - 8} y={yHi - 4} textAnchor="end"
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={11}>+V_sat</text>
          <text x={G.axMid + 8} y={yLo + 14}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11}>−V_sat</text>
        </SvgFadeIn>

        {/* Hysteresis loop — four segments traced in order:
            (1) lower rail from far left to xTH (output low while V_in rising past V_TL)
            (2) vertical jump UP at xTH (snap high)
            (3) upper rail from xTH back to xTL going right then left
                  ↓ simpler: upper rail spans full visible range above V_TL
            (4) vertical jump DOWN at xTL (snap low)

            We trace it as a clear directed loop: lower rail (rising)
            → jump up at xTH → upper rail (falling toward xTL) → jump
            down at xTL. The narration in beat 4 walks the motion.       */}
        {/* Lower rail (output low, traversed left→right) */}
        <TraceIn d={`M ${G.ax0 + 8} ${yLo} L ${xTH} ${yLo}`}
          stroke="var(--rose-300)" strokeWidth={2.8}
          duration={0.9} delay={4.2}/>
        {/* Snap up at xTH */}
        <TraceIn d={`M ${xTH} ${yLo} L ${xTH} ${yHi}`}
          stroke="var(--amber-400)" strokeWidth={2.8}
          duration={0.45} delay={5.2}/>
        {/* Upper rail (output high, traversed right→left along the top) */}
        <TraceIn d={`M ${xTH} ${yHi} L ${xTL} ${yHi}`}
          stroke="var(--teal-400)" strokeWidth={2.8}
          duration={0.9} delay={5.8}/>
        {/* Continue upper rail toward far right so the high-side spans
            xTL → +∞ (drawn as ax1) when V_in stays high */}
        <TraceIn d={`M ${xTH} ${yHi} L ${G.ax1 - 8} ${yHi}`}
          stroke="var(--teal-400)" strokeWidth={2.8}
          duration={0.6} delay={5.8}/>
        {/* Lower rail extends from -∞ side (ax0+8) past xTL, drawn already */}
        <TraceIn d={`M ${xTL} ${yLo} L ${G.ax0 + 8} ${yLo}`}
          stroke="var(--rose-300)" strokeWidth={2.8}
          duration={0.6} delay={6.8}/>
        {/* Snap down at xTL */}
        <TraceIn d={`M ${xTL} ${yHi} L ${xTL} ${yLo}`}
          stroke="var(--amber-400)" strokeWidth={2.8}
          duration={0.45} delay={6.8}/>

        {/* Direction arrows on the loop — one up at xTH, one down at xTL */}
        <SvgFadeIn duration={0.35} delay={7.8}>
          <path d={`M ${xTH} ${(yHi + yLo) / 2}
                    l -7 6 l 14 0 z`}
                fill="var(--amber-400)"/>
          <path d={`M ${xTL} ${(yHi + yLo) / 2}
                    l -7 -6 l 14 0 z`}
                fill="var(--amber-400)"/>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={8.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={13} letterSpacing="0.02em">
            two thresholds — the path depends on which way V<tspan baselineShift="sub" fontSize={9}>in</tspan> is moving
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Triangle V_in sweep + square V_out snap + traced loop ───────
// Three synchronised panes:
//   top:    V_in (triangle wave) vs time
//   mid:    V_out (square, snaps at V_TH on rising, V_TL on falling)
//   right:  (V_in, V_out) loop with a tracked dot
function HysteresisMotionBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.8;
  const SWEEP = Math.max(spriteDur - HOLD - 0.6, 1);
  const t = clamp((localTime - HOLD) / SWEEP, 0, 1);

  const G = portrait
    ? { vbW: 580, vbH: 1020,
        scopeX: 70, scopeR: 520,
        topY0: 90,  topY1: 250,   topMid: 170,
        midY0: 330, midY1: 490,   midMid: 410,
        // Loop pane below (square area centred horizontally)
        loopX0: 130, loopX1: 470, loopY0: 590, loopY1: 930,
        captionY: 990, font: 14 }
    : { vbW: 1100, vbH: 460,
        // left half: two stacked scopes; right half: loop pane
        scopeX: 70, scopeR: 620,
        topY0: 50,  topY1: 200,   topMid: 125,
        midY0: 240, midY1: 390,   midMid: 315,
        loopX0: 720, loopX1: 1050, loopY0: 60, loopY1: 390,
        captionY: 440, font: 14 };

  const scopeW = G.scopeR - G.scopeX;
  const topAmp = (G.topMid - G.topY0) * 0.85;
  const midAmp = (G.midMid - G.midY0) * 0.85;

  // Triangle waveform across the scope: V_in in [-1, +1].
  // We pick "1 full cycle" = sweep up then down then back to start; we
  // run CYCLES = 1.5 so the viewer sees ~1.5 round-trips and both
  // thresholds get hit multiple times.
  const CYCLES = 1.5;
  function tri(u) {
    // (u·CYCLES) mod 1 in [0,1); first half rising -1→+1, second half falling +1→-1
    const x = (u * CYCLES) % 1;
    return x < 0.5 ? (4 * x - 1) : (3 - 4 * x);
  }

  // V_out is a stateful function of V_in's history. Build it by walking
  // the sample list once and applying the Schmitt rule:
  //   if V_in > V_TH → snap high; if V_in < V_TL → snap low; else hold.
  const SAMPLES = 240;
  // Pre-compute V_in samples and V_out samples once per render.
  const vIns = new Array(SAMPLES);
  const vOuts = new Array(SAMPLES);
  let qPrev = -V_SAT; // start low
  for (let i = 0; i < SAMPLES; i++) {
    const u = i / (SAMPLES - 1);
    const vIn = tri(u);
    let q = qPrev;
    if (vIn > V_TH) q = +V_SAT;
    else if (vIn < V_TL) q = -V_SAT;
    vIns[i] = vIn;
    vOuts[i] = q;
    qPrev = q;
  }

  const revealMax = (SAMPLES - 1) * t;
  const inPts = [];
  const outPts = [];
  for (let i = 0; i < SAMPLES; i++) {
    if (i > revealMax) break;
    const u = i / (SAMPLES - 1);
    const x = G.scopeX + u * scopeW;
    inPts.push(`${x.toFixed(1)},${(G.topMid - vIns[i] * topAmp).toFixed(1)}`);
    outPts.push(`${x.toFixed(1)},${(G.midMid - vOuts[i] * midAmp).toFixed(1)}`);
  }
  const cursorX = G.scopeX + clamp(t, 0, 1) * scopeW;

  // Loop pane geometry.
  const loopW = G.loopX1 - G.loopX0;
  const loopH = G.loopY1 - G.loopY0;
  const loopCx = (G.loopX0 + G.loopX1) / 2;
  const loopCy = (G.loopY0 + G.loopY1) / 2;
  // Map V_in ∈ [-1,1] → loop x; V_out ∈ [-V_sat, +V_sat] → loop y (inverted).
  const loopXForVin = (vIn) => loopCx + (loopW / 2) * 0.85 * vIn;
  const loopYForVout = (vOut) => loopCy - (loopH / 2) * 0.85 * (vOut / V_SAT);
  // Loop dot tracks (V_in, V_out) at the current sample index.
  const iDot = Math.min(SAMPLES - 1, Math.max(0, Math.floor(revealMax)));
  const dotX = loopXForVin(vIns[iDot]);
  const dotY = loopYForVout(vOuts[iDot]);

  // Loop trail — collect all points up to iDot, but draw as a single
  // polyline so the trace shows the path the dot has carved.
  const loopTrailPts = [];
  for (let i = 0; i <= iDot; i++) {
    loopTrailPts.push(`${loopXForVin(vIns[i]).toFixed(1)},${loopYForVout(vOuts[i]).toFixed(1)}`);
  }

  // Threshold lines on the scopes (V_TH/V_TL) and on the loop pane.
  const yTHTop = G.topMid - V_TH * topAmp;
  const yTLTop = G.topMid - V_TL * topAmp;
  const xTHLoop = loopXForVin(V_TH);
  const xTLLoop = loopXForVin(V_TL);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top scope: V_in */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <rect x={G.scopeX} y={G.topY0} width={scopeW} height={G.topY1 - G.topY0}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.scopeX} y1={G.topMid} x2={G.scopeR} y2={G.topMid}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          {/* Threshold guides */}
          <line x1={G.scopeX} y1={yTHTop} x2={G.scopeR} y2={yTHTop}
                stroke="var(--teal-400)" strokeWidth={1}
                strokeDasharray="3 5" opacity={0.7}/>
          <line x1={G.scopeX} y1={yTLTop} x2={G.scopeR} y2={yTLTop}
                stroke="var(--rose-300)" strokeWidth={1}
                strokeDasharray="3 5" opacity={0.7}/>
          <text x={G.scopeR + 8} y={yTHTop + 4}
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={10}>V_TH</text>
          <text x={G.scopeR + 8} y={yTLTop + 4}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={10}>V_TL</text>
          <text x={G.scopeX - 8} y={G.topY0 + 14} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Mid scope: V_out */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <rect x={G.scopeX} y={G.midY0} width={scopeW} height={G.midY1 - G.midY0}
                fill="rgba(244,184,96,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.scopeX} y1={G.midMid} x2={G.scopeR} y2={G.midMid}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          <text x={G.scopeX - 8} y={G.midY0 + 14} textAnchor="end"
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

        {/* Synchronised cursor across both scopes */}
        {t > 0 && t < 1 && (
          <line x1={cursorX} y1={G.topY0} x2={cursorX} y2={G.midY1}
                stroke="var(--rose-400)" strokeWidth={1.2}
                opacity={0.8}/>
        )}

        {/* ──────── Loop pane ──────── */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          <rect x={G.loopX0} y={G.loopY0} width={loopW} height={loopH}
                fill="rgba(232,122,144,0.04)"
                stroke="var(--chalk-300)" strokeWidth={1}/>
          {/* axes */}
          <line x1={G.loopX0 + 12} y1={loopCy} x2={G.loopX1 - 12} y2={loopCy}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          <line x1={loopCx} y1={G.loopY0 + 12} x2={loopCx} y2={G.loopY1 - 12}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          {/* Threshold verticals */}
          <line x1={xTHLoop} y1={G.loopY0 + 12} x2={xTHLoop} y2={G.loopY1 - 12}
                stroke="var(--teal-400)" strokeWidth={1}
                strokeDasharray="3 5" opacity={0.6}/>
          <line x1={xTLLoop} y1={G.loopY0 + 12} x2={xTLLoop} y2={G.loopY1 - 12}
                stroke="var(--rose-300)" strokeWidth={1}
                strokeDasharray="3 5" opacity={0.6}/>
          <text x={G.loopX1 - 12} y={loopCy - 6} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>in</tspan>
          </text>
          <text x={loopCx + 8} y={G.loopY0 + 18}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>
            V<tspan baselineShift="sub" fontSize={G.font * 0.6}>out</tspan>
          </text>
          {/* Threshold labels on the loop pane */}
          <text x={xTHLoop} y={G.loopY1 - 4} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-mono)"
                fontSize={10}>V_TH</text>
          <text x={xTLLoop} y={G.loopY1 - 4} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={10}>V_TL</text>
        </SvgFadeIn>

        {/* Loop trail */}
        {loopTrailPts.length > 1 && (
          <polyline points={loopTrailPts.join(' ')}
            fill="none" stroke="var(--amber-300)" strokeWidth={2.2}
            opacity={0.95}/>
        )}
        {/* Tracking dot */}
        {t > 0.01 && t < 0.99 && (
          <g>
            <circle cx={dotX} cy={dotY} r={6}
                    fill="var(--rose-400)"/>
            <circle cx={dotX} cy={dotY} r={12}
                    fill="none" stroke="var(--rose-400)" strokeWidth={1.4}
                    opacity={0.45}/>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={11.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the gap between V<tspan baselineShift="sub" fontSize={10}>TH</tspan> and V<tspan baselineShift="sub" fontSize={10}>TL</tspan> is the noise the trigger ignores
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
          maxWidth: portrait ? '24ch' : 'none',
          lineHeight: 1.25,
        }}>
        V<sub>TH</sub> − V<sub>TL</sub> = hysteresis band  ≫  noise floor
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        USB receivers · zero-crossing detectors · 555 timers · every digital input
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
