// 2-to-4 Decoder: One-Hot Output Selection — Manimo lesson scene.
// Two input bits A, B select exactly one of four output lines (one-hot)
// by routing the inputs and their inverses into four AND gates. Genuine
// animation lives in Beat 4: the inputs A, B cycle through 00 → 01 → 10
// → 11, and the highlighted output hops down the column in real time
// (driven by useSprite() localTime).
//
// Beats (timed to single-track narration in motion/ade/audio/two-to-four-decoder/):
//    0.00– 5.34  Manimo intro: two inputs, four outputs, exactly one fires
//    5.34–14.00  Truth table: four input patterns → four one-hot outputs
//   14.00–23.86  Gate diagram: inputs + inverters routed into 4 AND gates
//   23.86–30.33  Sweep: counter cycles A,B; the active output glows in turn
//   30.33–37.00  Takeaway: n inputs → 2ⁿ outputs, one-hot
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 4 is the value-driven motion: a counter advances every ~2s and
//     the matching output indicator brightens; the wiring trace highlights
//     the path through the active gate.

const SCENE_DURATION = 37;

const NARRATION = [
  /*  0.00– 5.34 */ "Two address bits, four output lines — and only one of them fires at a time.",
  /*  5.34–14.00 */ "The truth table lays it out — for each of the four input combinations, exactly one output is high and the other three stay low.",
  /* 14.00–23.86 */ "Inside, four AND gates each watch for one input pattern — the inputs and their inverses are routed so each gate fires for one and only one combination.",
  /* 23.86–30.33 */ "Step the inputs through all four patterns — and watch the high output hop down the column, one at a time.",
  /* 30.33–37.00 */ "Two bits give four addresses — and a decoder turns each address into a single chosen line.",
];

// Single continuous narration track produced by `npm run audio two-to-four-decoder`.
// Beat <Sprite start> values below match audioStart offsets in
// motion/ade/audio/two-to-four-decoder/manifest.json (overwritten by rewire-scene.js).
const NARRATION_AUDIO = 'audio/two-to-four-decoder/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="2-to-4 Decoder"
      duration={SCENE_DURATION}
      introEnd={5.34}
      introCaption="Two inputs in — exactly one of four outputs out. One-hot."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.34} end={14}>
        <TruthTableBeat />
      </Sprite>

      <Sprite start={14} end={23.86}>
        <GatesBeat />
      </Sprite>

      <Sprite start={23.86} end={30.33}>
        <SweepBeat />
      </Sprite>

      <Sprite start={30.33} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// AND-gate symbol (flat-back, curved nose). cx, cy is centre of body;
// inputs come in on the left, output on the right.
function AndGate({ cx, cy, w = 50, h = 36, color }) {
  // body: rectangle on left half + semicircle on right
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const y0 = cy - h / 2;
  const y1 = cy + h / 2;
  const xMid = cx;
  return (
    <g>
      <path d={`M ${x0} ${y0} L ${xMid} ${y0} A ${h/2} ${h/2} 0 0 1 ${xMid} ${y1} L ${x0} ${y1} Z`}
            fill="none" stroke={color} strokeWidth={2.2}/>
    </g>
  );
}

// Tiny inverter bubble.
function InvBubble({ cx, cy, r = 4, color }) {
  return (
    <circle cx={cx} cy={cy} r={r} fill="var(--bg-canvas)" stroke={color} strokeWidth={1.4}/>
  );
}

// ─── Beat 2: Truth table ─────────────────────────────────────────────────
function TruthTableBeat() {
  const portrait = usePortrait();
  const cellH = portrait ? 36 : 38;
  const cellW = portrait ? 50 : 56;
  const fontMono = portrait ? 17 : 18;
  const headFont = portrait ? 14 : 16;

  // Header columns: A B | Y0 Y1 Y2 Y3
  const cols = ['A', 'B', 'Y0', 'Y1', 'Y2', 'Y3'];
  const rows = [
    { a: 0, b: 0, ys: [1, 0, 0, 0] },
    { a: 0, b: 1, ys: [0, 1, 0, 0] },
    { a: 1, b: 0, ys: [0, 0, 1, 0] },
    { a: 1, b: 1, ys: [0, 0, 0, 1] },
  ];

  // Build a flat svg layout for the table
  const tableW = cellW * cols.length + 20; // small divider after column 1 (after B)
  const tableH = cellH * (rows.length + 1);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={tableW} height={tableH + 40} viewBox={`0 0 ${tableW} ${tableH + 40}`}
           style={{ overflow: 'visible' }}>
        {/* Header row */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {cols.map((c, i) => {
            const xOff = i < 2 ? i * cellW : i * cellW + 20;
            return (
              <text key={c} x={xOff + cellW / 2} y={cellH * 0.75}
                    textAnchor="middle"
                    fill={i < 2 ? 'var(--chalk-100)' : 'var(--amber-300)'}
                    fontFamily="var(--font-mono)" fontSize={headFont}
                    letterSpacing="0.06em">
                {c}
              </text>
            );
          })}
          {/* Vertical separator between inputs and outputs */}
          <line x1={cellW * 2 + 10} y1={4} x2={cellW * 2 + 10} y2={tableH}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          {/* Header underline */}
          <line x1={0} y1={cellH + 2} x2={tableW} y2={cellH + 2}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
        </SvgFadeIn>

        {/* Rows */}
        {rows.map((row, ri) => {
          const yRow = cellH * (ri + 1) + cellH * 0.75;
          // Stagger row appearance.
          const delay = 0.8 + ri * 0.6;
          return (
            <SvgFadeIn key={ri} duration={0.35} delay={delay}>
              {/* A, B cells */}
              <text x={cellW * 0.5} y={yRow} textAnchor="middle"
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={fontMono}>
                {row.a}
              </text>
              <text x={cellW * 1.5} y={yRow} textAnchor="middle"
                    fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={fontMono}>
                {row.b}
              </text>
              {/* Y0..Y3 cells; the active 1 gets amber emphasis */}
              {row.ys.map((y, yi) => {
                const xCol = (yi + 2) * cellW + 20;
                return (
                  <text key={yi} x={xCol + cellW / 2} y={yRow} textAnchor="middle"
                        fill={y ? 'var(--amber-300)' : 'var(--chalk-300)'}
                        fontFamily="var(--font-mono)"
                        fontSize={y ? fontMono + 2 : fontMono}>
                    {y}
                  </text>
                );
              })}
            </SvgFadeIn>
          );
        })}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={tableW / 2} y={tableH + 28}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            exactly one output high per input pattern
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Gate diagram (static) ───────────────────────────────────────
// Horizontal inputs A and B at top fan out into !A, !B via inverters.
// Each of four AND gates picks one combination of (A or !A) and (B or !B).
function GatesBeat() {
  return <GatesDiagram active={null} delayBase={0.4} caption="four ANDs, one address each" />;
}

// ─── Beat 4: Live sweep — A,B counter cycles, one Y glows at a time ──────
function SweepBeat() {
  const { localTime } = useSprite();

  // Step the counter every ~1.3s, starting shortly after the diagram has
  // re-mounted. Audio for this beat is ~6.5s, so the four-step sweep
  // (0.4s wait + 4×1.3s) lands at ~5.6s with a brief linger on Y3.
  const stepStart = 0.4;
  const stepDur = 1.3;
  const stepIdx = Math.max(0, Math.floor((localTime - stepStart) / stepDur));
  const idx = Math.min(3, stepIdx);
  const a = (idx >> 1) & 1;
  const b = idx & 1;
  const active = idx;   // 0..3

  return <GatesDiagram active={active} a={a} b={b} delayBase={0} caption="step the counter — Y hops one cell at a time" />;
}

// Shared rendering used by Beats 3 and 4. `active` ∈ {null, 0,1,2,3};
// when null, all four outputs render in neutral chalk; otherwise the
// matching gate + wiring + Y indicator glow amber.
function GatesDiagram({ active, a = 0, b = 0, delayBase = 0, caption }) {
  const portrait = usePortrait();

  // Geometry — fairly compact diagram so it fits in both aspects.
  const G = portrait
    ? { vbW: 560, vbH: 600,
        inAy: 70, inBy: 130,
        invAx: 200, invBx: 200,
        invAy: 100, invBy: 160,
        railsX: 250, railSpacingX: 22,
        // Four rails (left to right): A, !A, B, !B
        gateX: 400, gateW: 56, gateH: 36,
        gateY: [240, 320, 400, 480],
        yLabelX: 510, captionY: 575, fontMain: 16 }
    : { vbW: 880, vbH: 460,
        inAy: 60, inBy: 110,
        invAx: 240, invBx: 240,
        invAy: 90, invBy: 140,
        railsX: 300, railSpacingX: 24,
        gateX: 540, gateW: 60, gateH: 38,
        gateY: [180, 250, 320, 390],
        yLabelX: 660, captionY: 440, fontMain: 16 };

  // 4 vertical rails: A, !A, B, !B at railsX, railsX+rs, +2rs, +3rs.
  const rs = G.railSpacingX;
  const railX = [G.railsX, G.railsX + rs, G.railsX + 2*rs, G.railsX + 3*rs];
  const railTop = Math.min(G.inAy, G.inBy);
  const railBot = G.gateY[3] + 30;

  // For each gate, two inputs based on (A or !A) and (B or !B):
  // Y0: (!A, !B)  → rails 1, 3
  // Y1: (!A,  B)  → rails 1, 2
  // Y2: ( A, !B)  → rails 0, 3
  // Y3: ( A,  B)  → rails 0, 2
  const gateInputs = [
    [1, 3], [1, 2], [0, 3], [0, 2],
  ];

  const accent = (i) => (active === i ? 'var(--amber-300)' : 'var(--chalk-200)');
  const accentStrong = (i) => (active === i ? 'var(--amber-300)' : 'var(--chalk-300)');

  // Input A, B logical values feeding the rails (for sweep beat only).
  const railValue = [a, 1 - a, b, 1 - b];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* A input line */}
        <TraceIn d={`M 70 ${G.inAy} L ${railX[0]} ${G.inAy} L ${railX[0]} ${railBot - 30}`}
          stroke={active === null ? 'var(--chalk-200)' : (a ? 'var(--amber-300)' : 'var(--chalk-300)')}
          strokeWidth={active === null ? 1.8 : (a ? 2.2 : 1.4)}
          duration={0.7} delay={delayBase + 0.2}/>
        {/* B input line */}
        <TraceIn d={`M 70 ${G.inBy} L ${railX[2]} ${G.inBy} L ${railX[2]} ${railBot - 30}`}
          stroke={active === null ? 'var(--chalk-200)' : (b ? 'var(--amber-300)' : 'var(--chalk-300)')}
          strokeWidth={active === null ? 1.8 : (b ? 2.2 : 1.4)}
          duration={0.7} delay={delayBase + 0.2}/>

        {/* Inverter for !A */}
        <SvgFadeIn duration={0.3} delay={delayBase + 0.6}>
          {/* triangle */}
          <path d={`M ${G.invAx - 16} ${G.invAy - 10} L ${G.invAx - 16} ${G.invAy + 10} L ${G.invAx + 2} ${G.invAy} Z`}
                fill="none" stroke={railValue[1] === 1 && active !== null ? 'var(--amber-300)' : 'var(--chalk-300)'}
                strokeWidth={1.6}/>
          <InvBubble cx={G.invAx + 6} cy={G.invAy}
                     color={railValue[1] === 1 && active !== null ? 'var(--amber-300)' : 'var(--chalk-300)'}/>
          {/* wire from A line → inverter triangle */}
          <line x1={G.invAx - 26} y1={G.inAy} x2={G.invAx - 26} y2={G.invAy}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          {/* tap from A trunk */}
          <line x1={120} y1={G.inAy} x2={120} y2={G.invAy} stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <line x1={120} y1={G.invAy} x2={G.invAx - 16} y2={G.invAy} stroke="var(--chalk-300)" strokeWidth={1.2}/>
          {/* output to !A rail */}
          <line x1={G.invAx + 10} y1={G.invAy} x2={railX[1]} y2={G.invAy} stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <line x1={railX[1]} y1={G.invAy} x2={railX[1]} y2={railBot - 30}
                stroke={railValue[1] === 1 && active !== null ? 'var(--amber-300)' : 'var(--chalk-300)'}
                strokeWidth={railValue[1] === 1 && active !== null ? 2 : 1.2}/>
        </SvgFadeIn>

        {/* Inverter for !B */}
        <SvgFadeIn duration={0.3} delay={delayBase + 0.6}>
          <path d={`M ${G.invBx - 16} ${G.invBy - 10} L ${G.invBx - 16} ${G.invBy + 10} L ${G.invBx + 2} ${G.invBy} Z`}
                fill="none" stroke={railValue[3] === 1 && active !== null ? 'var(--amber-300)' : 'var(--chalk-300)'}
                strokeWidth={1.6}/>
          <InvBubble cx={G.invBx + 6} cy={G.invBy}
                     color={railValue[3] === 1 && active !== null ? 'var(--amber-300)' : 'var(--chalk-300)'}/>
          <line x1={160} y1={G.inBy} x2={160} y2={G.invBy} stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <line x1={160} y1={G.invBy} x2={G.invBx - 16} y2={G.invBy} stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <line x1={G.invBx + 10} y1={G.invBy} x2={railX[3]} y2={G.invBy} stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <line x1={railX[3]} y1={G.invBy} x2={railX[3]} y2={railBot - 30}
                stroke={railValue[3] === 1 && active !== null ? 'var(--amber-300)' : 'var(--chalk-300)'}
                strokeWidth={railValue[3] === 1 && active !== null ? 2 : 1.2}/>
        </SvgFadeIn>

        {/* Rail labels at top */}
        <SvgFadeIn duration={0.3} delay={delayBase + 0.9}>
          <text x={railX[0]} y={railTop - 14} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={12}>A</text>
          <text x={railX[1]} y={railTop - 14} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={12}>!A</text>
          <text x={railX[2]} y={railTop - 14} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={12}>B</text>
          <text x={railX[3]} y={railTop - 14} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={12}>!B</text>
        </SvgFadeIn>

        {/* AND gates and their wiring */}
        {[0, 1, 2, 3].map((gi) => {
          const gy = G.gateY[gi];
          const [r0, r1] = gateInputs[gi];
          const gateColor = accent(gi);
          const wireColor = accentStrong(gi);
          const wireWidth = active === gi ? 2.2 : 1.2;
          return (
            <SvgFadeIn key={gi} duration={0.35} delay={delayBase + 1.2 + gi * 0.18}>
              {/* Wire from rail r0 down/right into gate input (upper) */}
              <line x1={railX[r0]} y1={gy - 8}
                    x2={G.gateX - G.gateW / 2} y2={gy - 8}
                    stroke={wireColor} strokeWidth={wireWidth}/>
              {/* Wire from rail r1 down/right into gate input (lower) */}
              <line x1={railX[r1]} y1={gy + 8}
                    x2={G.gateX - G.gateW / 2} y2={gy + 8}
                    stroke={wireColor} strokeWidth={wireWidth}/>
              {/* AND gate */}
              <AndGate cx={G.gateX} cy={gy} w={G.gateW} h={G.gateH} color={gateColor}/>
              {/* Output wire to Y indicator */}
              <line x1={G.gateX + G.gateW / 2} y1={gy}
                    x2={G.yLabelX - 18} y2={gy}
                    stroke={wireColor} strokeWidth={wireWidth}/>
              {/* Y indicator: small circle */}
              <circle cx={G.yLabelX - 12} cy={gy} r={5}
                      fill={active === gi ? 'var(--amber-300)' : 'var(--bg-canvas)'}
                      stroke={active === gi ? 'var(--amber-300)' : 'var(--chalk-300)'}
                      strokeWidth={1.6}/>
              {/* Y label */}
              <text x={G.yLabelX} y={gy + 5}
                    fill={active === gi ? 'var(--amber-300)' : 'var(--chalk-100)'}
                    fontFamily="var(--font-serif)" fontStyle="italic" fontSize={G.fontMain + 4}>
                Y<tspan baselineShift="sub" fontSize={(G.fontMain + 4) * 0.6}>{gi}</tspan>
              </text>
            </SvgFadeIn>
          );
        })}

        {/* Input value display (sweep beat shows A,B values) */}
        {active !== null && (
          <SvgFadeIn duration={0.3} delay={0}>
            <text x={70} y={railBot + 30}
                  fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={18}>
              A B = <tspan fill="var(--amber-300)">{a}{b}</tspan>
            </text>
          </SvgFadeIn>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={delayBase + 3.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            {caption}
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
          fontSize: portrait ? 30 : 36,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.3,
        }}>
        n inputs → 2<sup>n</sup> outputs, one-hot.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (the front end of every memory address decode and MUX)
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
