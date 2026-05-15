// 4-to-1 Multiplexer: Two Select Bits Pick a Wire — Manimo lesson scene.
// A trapezoidal MUX block routes one of four data inputs (D0..D3) to a
// single output Y based on two select bits (S1, S0). Genuine motion lives
// in Beat 3: the select bits walk through 00 → 01 → 10 → 11, the addressed
// input wire lights up amber, a charge dot travels along it through the
// block to Y, the live Y readout updates, and the corresponding truth-table
// row highlights.
//
// Beats (timed to single-track narration in motion/ade/audio/multiplexer-4-to-1/):
//    0.00– 5.13  Manimo intro: four signals, one output
//    5.13–13.29  Block setup: trapezoid + inputs + selects + output
//   13.29–22.21  Sweep: S1S0 walks 00..11, active path lights up, dot flows
//   22.21–30.26  Boolean formula: Y = D0·S1'·S0' + … + D3·S1·S0
//   30.26–37.00  Takeaway: a programmable switch
//
// Authoring notes:
//   • Beat 3 drives sel = floor((t − HOLD) / dwellPer) % 4 so all
//     state changes are deterministic from useSprite() localTime.
//   • Charge dot is drawn along the polyline from the active input
//     stub through the trapezoid centre and out the right tip.
//   • Each Di carries a fixed mock value (0/1/1/0) so the live Y
//     readout has something to show.

const SCENE_DURATION = 38;

const NARRATION = [
  /*  0.00– 5.13 */ "Four wires want to share one output line — how do we pick which one talks?",
  /*  5.13–13.29 */ "A four to one multiplexer: four data inputs on the left, two select bits at the bottom, and a single output on the right.",
  /* 13.29–22.21 */ "Walk the select bits from zero zero up to one one. Whichever input is addressed lights up, and its signal walks through the block to the output.",
  /* 22.21–30.26 */ "In Boolean form, Y is the OR of four AND terms: each data line ANDed with the decoded address that selects it.",
  /* 30.26–37.00 */ "A multiplexer is a programmable switch — and chaining them lets one address space pick from many more lines.",
];

const NARRATION_AUDIO = 'audio/multiplexer-4-to-1/scene.mp3';

// Mock data values for the four data inputs — give the live readout
// something to show. Mix of 0s and 1s so the output actually changes.
const D_VALUES = [0, 1, 1, 0];

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="4-to-1 Multiplexer: Two Select Bits Pick a Wire"
      duration={SCENE_DURATION}
      introEnd={5.13}
      introCaption="Four signals, one output — who gets through?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.13} end={13.29}>
        <SetupBeat />
      </Sprite>

      <Sprite start={13.29} end={22.21}>
        <SweepBeat />
      </Sprite>

      <Sprite start={22.21} end={30.26}>
        <FormulaBeat />
      </Sprite>

      <Sprite start={30.26} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared MUX geometry ────────────────────────────────────────────────
// Returns the trapezoid corners, input stub start/end coordinates,
// select stub coordinates, and the output stub.
function muxGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 580, vbH: 580,
      // Trapezoid corners (clockwise: top-left, top-right, bottom-right, bottom-left)
      bTL: { x: 200, y: 130 }, bTR: { x: 380, y: 200 },
      bBR: { x: 380, y: 380 }, bBL: { x: 200, y: 450 },
      // Inputs: four stubs at evenly-spaced y along the LEFT (vertical) edge,
      // going from x = inX0 to x = bTL.x
      inX0: 60, inXs: 200,
      inYs: [200, 270, 340, 410],
      // Selects: vertical wires entering bottom of trapezoid
      s1X: 240, s0X: 320,
      sYbot: 500, sYtop: 410,    // s* wires go from sYbot UP to sYtop where they enter
      // Output
      outX0: 380, outX1: 520, outY: 290,
      labelFont: 17, valFont: 14, axisFont: 11,
      captionY: 565,
    };
  }
  return {
    vbW: 900, vbH: 490,
    bTL: { x: 380, y: 130 }, bTR: { x: 580, y: 190 },
    bBR: { x: 580, y: 350 }, bBL: { x: 380, y: 410 },
    inX0: 100, inXs: 380,
    inYs: [170, 220, 270, 320],
    s1X: 430, s0X: 510,
    sYbot: 430, sYtop: 380,
    outX0: 580, outX1: 800, outY: 270,
    labelFont: 18, valFont: 14, axisFont: 12,
    captionY: 478,
  };
}

// MUX trapezoid outline (clockwise from top-left).
function muxOutlinePath(G) {
  return `M ${G.bTL.x} ${G.bTL.y}
          L ${G.bTR.x} ${G.bTR.y}
          L ${G.bBR.x} ${G.bBR.y}
          L ${G.bBL.x} ${G.bBL.y} Z`;
}

// y-coord where input wire `i` meets the left edge of the trapezoid.
// The trapezoid left edge runs vertically from bTL to bBL.
function inputJoinY(G, i) { return G.inYs[i]; }

// Beat 2: Setup
function SetupBeat() {
  const portrait = usePortrait();
  const G = muxGeometry(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Trapezoid outline */}
        <TraceIn d={muxOutlinePath(G)}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 fill="none" duration={0.9} delay={0.0}/>

        {/* Input stubs */}
        {[0, 1, 2, 3].map(i => (
          <TraceIn key={i}
                   d={`M ${G.inX0} ${G.inYs[i]} L ${G.bTL.x} ${G.inYs[i]}`}
                   stroke="var(--chalk-200)" strokeWidth={2}
                   duration={0.5} delay={0.4 + i * 0.1}/>
        ))}

        {/* Select stubs */}
        <TraceIn d={`M ${G.s1X} ${G.sYbot} L ${G.s1X} ${G.sYtop}`}
                 stroke="var(--chalk-300)" strokeWidth={1.6}
                 duration={0.5} delay={0.8}/>
        <TraceIn d={`M ${G.s0X} ${G.sYbot} L ${G.s0X} ${G.sYtop}`}
                 stroke="var(--chalk-300)" strokeWidth={1.6}
                 duration={0.5} delay={0.8}/>

        {/* Output stub */}
        <TraceIn d={`M ${G.outX0} ${G.outY} L ${G.outX1} ${G.outY}`}
                 stroke="var(--amber-400)" strokeWidth={2.2}
                 duration={0.5} delay={1.2}/>

        {/* Input labels */}
        <SvgFadeIn duration={0.35} delay={1.6}>
          {[0, 1, 2, 3].map(i => (
            <text key={i} x={G.inX0 - 8} y={G.inYs[i] + 5} textAnchor="end"
                  fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.labelFont}>
              D<tspan baselineShift="sub" fontSize={G.labelFont * 0.65}>{i}</tspan>
            </text>
          ))}
        </SvgFadeIn>

        {/* Select labels */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={G.s1X} y={G.sYbot + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont * 0.85}>
            S<tspan baselineShift="sub" fontSize={G.labelFont * 0.55}>1</tspan>
          </text>
          <text x={G.s0X} y={G.sYbot + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont * 0.85}>
            S<tspan baselineShift="sub" fontSize={G.labelFont * 0.55}>0</tspan>
          </text>
        </SvgFadeIn>

        {/* Output label */}
        <SvgFadeIn duration={0.35} delay={2.4}>
          <text x={G.outX1 + 14} y={G.outY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont + 2}>Y</text>
        </SvgFadeIn>

        {/* MUX block centre title */}
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={(G.bTL.x + G.bBR.x) / 2} y={(G.bTL.y + G.bBR.y) / 2 - 6}
                textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.16em">MUX</text>
          <text x={(G.bTL.x + G.bBR.x) / 2} y={(G.bTL.y + G.bBR.y) / 2 + 14}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">4 → 1</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two bits address four lines
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Sweep (genuine motion) ─────────────────────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const G = muxGeometry(portrait);
  const { localTime } = useSprite();

  const HOLD = 1.0;
  const t = Math.max(0, localTime - HOLD);

  // Dwell time per select state. We want to cycle through 4 states once
  // with enough time on each to read the highlights — ~3 seconds per state.
  const dwellPer = 3.0;
  const sel = Math.min(3, Math.floor(t / dwellPer));
  const inDwell = t - sel * dwellPer;           // 0..dwellPer within current state
  const transitionFr = clamp(inDwell / 0.5, 0, 1); // first 0.5s of each state = fade-in

  // Trapezoid centre — where the dot routes through.
  const cx = (G.bTL.x + G.bBR.x) / 2;
  const cy = (G.bTL.y + G.bBR.y) / 2;

  // Active path polyline: input D[sel] stub start → join point on left edge
  // → trapezoid centre → output tip → output end.
  const activePath = [
    { x: G.inX0, y: G.inYs[sel] },
    { x: G.bTL.x, y: G.inYs[sel] },
    { x: cx, y: cy },
    { x: G.outX0, y: G.outY },
    { x: G.outX1, y: G.outY },
  ];
  // Cumulative arc lengths.
  let total = 0;
  const cum = [0];
  for (let i = 1; i < activePath.length; i++) {
    const dx = activePath[i].x - activePath[i - 1].x;
    const dy = activePath[i].y - activePath[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
    cum.push(total);
  }

  // Two dots in flight, spaced half a loop apart, walking the active path.
  // Each dot completes the path in `dotT` seconds.
  const dotT = 1.6;
  const phase1 = ((inDwell / dotT) % 1);
  const phase2 = (((inDwell + dotT * 0.5) / dotT) % 1);
  function dotAt(fr) {
    const target = fr * total;
    let seg = 0;
    while (seg + 1 < cum.length && cum[seg + 1] < target) seg++;
    const segStart = cum[seg];
    const segEnd = cum[seg + 1] || total;
    const segFr = (segEnd - segStart) > 0 ? (target - segStart) / (segEnd - segStart) : 0;
    const a = activePath[seg], b = activePath[seg + 1] || a;
    return { x: a.x + (b.x - a.x) * segFr, y: a.y + (b.y - a.y) * segFr };
  }
  const d1 = dotAt(phase1);
  const d2 = dotAt(phase2);

  // S1 S0 binary readout based on sel: 00, 01, 10, 11.
  const s1Bit = (sel >> 1) & 1;
  const s0Bit = sel & 1;
  const yVal = D_VALUES[sel];

  // Truth-table layout — small grid at the bottom of the canvas.
  const ttX = portrait ? 60 : 120;
  const ttY = portrait ? 480 : 390;
  const ttRowH = 16;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Static MUX outline + dimmed input/select stubs */}
        <g opacity={0.92}>
          <path d={muxOutlinePath(G)}
                fill="none" stroke="var(--chalk-200)" strokeWidth={2}/>
          {[0, 1, 2, 3].map(i => (
            <g key={i} opacity={i === sel ? 1 : 0.32}>
              <line x1={G.inX0} y1={G.inYs[i]} x2={G.bTL.x} y2={G.inYs[i]}
                    stroke={i === sel ? 'var(--amber-400)' : 'var(--chalk-200)'}
                    strokeWidth={i === sel ? 2.6 : 2}/>
              <text x={G.inX0 - 8} y={G.inYs[i] + 5} textAnchor="end"
                    fill={i === sel ? 'var(--amber-300)' : 'var(--chalk-300)'}
                    fontFamily="var(--font-serif)" fontStyle="italic"
                    fontSize={G.labelFont}>
                D<tspan baselineShift="sub" fontSize={G.labelFont * 0.65}>{i}</tspan>
              </text>
              {/* Each Di's mock value just to the right of the label */}
              <text x={G.inX0 - 8 + 38} y={G.inYs[i] + 5}
                    fill={i === sel ? 'var(--amber-300)' : 'var(--chalk-300)'}
                    fontFamily="var(--font-mono)" fontSize={G.valFont}
                    opacity={0.85}>= {D_VALUES[i]}</text>
            </g>
          ))}
          {/* Select stubs */}
          <line x1={G.s1X} y1={G.sYbot} x2={G.s1X} y2={G.sYtop}
                stroke="var(--chalk-300)" strokeWidth={1.6}/>
          <line x1={G.s0X} y1={G.sYbot} x2={G.s0X} y2={G.sYtop}
                stroke="var(--chalk-300)" strokeWidth={1.6}/>
          <text x={G.s1X} y={G.sYbot + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont * 0.85}>
            S<tspan baselineShift="sub" fontSize={G.labelFont * 0.55}>1</tspan>
          </text>
          <text x={G.s0X} y={G.sYbot + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont * 0.85}>
            S<tspan baselineShift="sub" fontSize={G.labelFont * 0.55}>0</tspan>
          </text>
          {/* Output stub */}
          <line x1={G.outX0} y1={G.outY} x2={G.outX1} y2={G.outY}
                stroke="var(--amber-400)" strokeWidth={2.4}/>
          <text x={G.outX1 + 14} y={G.outY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont + 2}>Y</text>
          {/* MUX block centre title */}
          <text x={cx} y={cy - 6} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.16em">MUX</text>
          <text x={cx} y={cy + 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">4 → 1</text>
        </g>

        {/* Active path internal segment — the highlight on the input edge
            (the chunk on the left side of the trapezoid that "lights up"
            during the active state). */}
        {localTime >= HOLD && (
          <line x1={G.inX0} y1={G.inYs[sel]} x2={cx} y2={cy}
                stroke="var(--amber-300)" strokeWidth={2.2}
                strokeDasharray="6 5" opacity={0.6 + 0.4 * transitionFr}/>
        )}

        {/* Charge dots flowing along the active path */}
        {localTime >= HOLD && (
          <g>
            <circle cx={d1.x} cy={d1.y} r={5.5}
                    fill={yVal ? 'var(--amber-300)' : 'var(--chalk-300)'}
                    opacity={0.95}/>
            <circle cx={d2.x} cy={d2.y} r={5.5}
                    fill={yVal ? 'var(--amber-300)' : 'var(--chalk-300)'}
                    opacity={0.8}/>
          </g>
        )}

        {/* Live select readout — above the bridge */}
        {localTime >= HOLD && (
          <g>
            <text x={G.s0X + 28} y={G.sYbot + 18}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.16em">S1 S0 =</text>
            <text x={G.s0X + 92} y={G.sYbot + 19}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={16} fontWeight="bold">
              {s1Bit}{s0Bit}
            </text>
          </g>
        )}

        {/* Live Y readout near the output */}
        {localTime >= HOLD && (
          <g>
            <text x={G.outX1} y={G.outY - 18} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.16em">Y =</text>
            <text x={G.outX1} y={G.outY - 32} textAnchor="middle"
                  fill={yVal ? 'var(--amber-300)' : 'var(--chalk-200)'}
                  fontFamily="var(--font-mono)" fontSize={22} fontWeight="bold">
              {yVal}
            </text>
            <text x={G.outX1} y={G.outY + 22} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.08em">
              = D{sel}
            </text>
          </g>
        )}

        {/* Truth table */}
        {localTime >= HOLD + 0.5 && (
          <g>
            <text x={ttX} y={ttY - 8}
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.14em">S1  S0    Y</text>
            {[0, 1, 2, 3].map(i => (
              <g key={i}>
                {i === sel && (
                  <rect x={ttX - 6} y={ttY + i * ttRowH - 10}
                        width={portrait ? 130 : 130} height={ttRowH}
                        fill="rgba(244,184,96,0.14)"/>
                )}
                <text x={ttX} y={ttY + i * ttRowH}
                      fill={i === sel ? 'var(--amber-300)' : 'var(--chalk-300)'}
                      fontFamily="var(--font-mono)" fontSize={12}>
                  {(i >> 1) & 1}   {i & 1}    D{i} = {D_VALUES[i]}
                </text>
              </g>
            ))}
          </g>
        )}

        {/* Caption — late */}
        {localTime > HOLD + 11 && (
          <SvgFadeIn duration={0.4} delay={0}>
            <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize={14} letterSpacing="0.02em">
              select bits decode to one of four enable lines
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: Boolean formula ────────────────────────────────────────────
function FormulaBeat() {
  const portrait = usePortrait();
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
        Sum of products
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
          lineHeight: 1.35, textAlign: 'center',
          maxWidth: portrait ? '26ch' : '60ch',
        }}>
        Y = D<sub style={{ fontSize: '0.55em' }}>0</sub>·S<sub style={{ fontSize: '0.55em' }}>1</sub>′·S<sub style={{ fontSize: '0.55em' }}>0</sub>′
        &nbsp;+&nbsp; D<sub style={{ fontSize: '0.55em' }}>1</sub>·S<sub style={{ fontSize: '0.55em' }}>1</sub>′·S<sub style={{ fontSize: '0.55em' }}>0</sub>
        &nbsp;+&nbsp; D<sub style={{ fontSize: '0.55em' }}>2</sub>·S<sub style={{ fontSize: '0.55em' }}>1</sub>·S<sub style={{ fontSize: '0.55em' }}>0</sub>′
        &nbsp;+&nbsp; D<sub style={{ fontSize: '0.55em' }}>3</sub>·S<sub style={{ fontSize: '0.55em' }}>1</sub>·S<sub style={{ fontSize: '0.55em' }}>0</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '26ch' : '48ch', lineHeight: 1.45,
        }}>
        only the matching AND term is non-zero — the rest are silenced
      </FadeUp>

      <FadeUp duration={0.5} delay={2.8} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 20 : 24,
          color: 'var(--chalk-100)', letterSpacing: '0.04em',
          marginTop: 4,
        }}>
        S1 S0 = 10 ⇒ Y = D2
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ───────────────────────────────────────────────────
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
          maxWidth: portrait ? '20ch' : '46ch', lineHeight: 1.3,
        }}>
        An addressable switch.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
          textTransform: 'uppercase',
        }}>
        n select bits address 2^n lines
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ───────────────────────────────────────────────────────────────
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
