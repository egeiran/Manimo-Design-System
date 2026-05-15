// NAND is Universal: One Gate Builds Them All — Manimo lesson scene.
// Tying NAND inputs together gives NOT; feeding a NAND into a NAND-NOT gives
// AND; De Morgan extends to OR. Genuine motion lives in Beat 4: a small
// (A, B) counter cycles through 00, 01, 10, 11 with the wire signals
// propagating through the cascade and the live truth-table row glowing.
//
// Beats (timed to single-track narration in motion/ade/audio/nand-universality/):
//    0.00– 6.65  Manimo intro + hook caption
//    6.65–14.69  NAND symbol and its truth table
//   14.69–24.08  NOT from NAND — shorted inputs, A toggles, Y inverts
//   24.08–34.03  AND from NAND — cascade, animated input cycle drives output
//   34.03–42.00  Takeaway: De Morgan OR, functional completeness
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Shared NandShape() helper renders the IEEE-style NAND so the symbol
//     looks identical in all three beats.
//   • Beat 3's toggle and Beat 4's cycle use useSprite().localTime so the
//     wire signals and truth-table glow are exactly in step.

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0.00– 6.65 */ "Of all the gates, just one is enough to build every digital circuit you'll ever see — which one, and why?",
  /*  6.65–14.69 */ "The NAND gate. Output is one — except when both inputs are one, in which case it drops to zero.",
  /* 14.69–24.08 */ "Tie both inputs together. Now A NAND A is the same as not A — and just like that, you have an inverter.",
  /* 24.08–34.03 */ "Feed a NAND into a NOT — also built from a NAND — and the two negations cancel. The result is plain AND. Watch the inputs cycle through every combination.",
  /* 34.03–42.00 */ "OR follows by De Morgan, and from NOT, AND, and OR you can build any Boolean expression. NAND on its own is functionally complete.",
];

const NARRATION_AUDIO = 'audio/nand-universality/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="digital logic"
      title="NAND is Universal: One Gate Builds Them All"
      duration={SCENE_DURATION}
      introEnd={6.13}
      introCaption="One gate to build them all — but which?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.13} end={13.31}>
        <NandSymbolBeat />
      </Sprite>

      <Sprite start={13.31} end={20.67}>
        <NotFromNandBeat />
      </Sprite>

      <Sprite start={20.67} end={31.48}>
        <AndFromNandBeat />
      </Sprite>

      <Sprite start={31.48} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared NAND glyph ───────────────────────────────────────────────────
// Renders an IEEE-style NAND centred at (cx, cy) with the given gate width.
// Returns inputs at (left, cy ± gh*0.32) and output at (right, cy).
function NandShape({ cx, cy, gw = 90, color = 'var(--amber-400)', strokeWidth = 2.4 }) {
  const gh = gw * 0.85;
  const left = cx - gw / 2;
  const right = cx + gw / 2;
  const top = cy - gh / 2;
  const bot = cy + gh / 2;
  const flatX = left + gw * 0.40;
  const bubbleR = gw * 0.07;
  const bodyD =
    `M ${left} ${top} ` +
    `L ${flatX} ${top} ` +
    `A ${gh / 2} ${gh / 2} 0 0 1 ${flatX} ${bot} ` +
    `L ${left} ${bot} Z`;
  return (
    <g>
      <path d={bodyD} fill="none" stroke={color} strokeWidth={strokeWidth}/>
      <circle cx={right} cy={cy} r={bubbleR}
              fill="none" stroke={color} strokeWidth={strokeWidth}/>
    </g>
  );
}

// ─── Beat 2: NAND symbol + truth table ───────────────────────────────────
function NandSymbolBeat() {
  const portrait = usePortrait();

  // Portrait stacks gate above table; landscape sets them side by side.
  const G = portrait
    ? { vbW: 600, vbH: 700,
        gateCx: 300, gateCy: 180, gateW: 130,
        tableX: 170, tableY: 340, cellW: 65, cellH: 42,
        captionY: 670 }
    : { vbW: 1080, vbH: 460,
        gateCx: 320, gateCy: 230, gateW: 160,
        tableX: 640, tableY: 110, cellW: 80, cellH: 50,
        captionY: 430 };

  const inputAY = G.gateCy - G.gateW * 0.85 * 0.32;
  const inputBY = G.gateCy + G.gateW * 0.85 * 0.32;
  const inputX = G.gateCx - G.gateW / 2;
  const outputX = G.gateCx + G.gateW / 2 + G.gateW * 0.07 * 2;

  // Truth-table rows.
  const rows = [
    { a: 0, b: 0, y: 1 },
    { a: 0, b: 1, y: 1 },
    { a: 1, b: 0, y: 1 },
    { a: 1, b: 1, y: 0 },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* NAND symbol */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <NandShape cx={G.gateCx} cy={G.gateCy} gw={G.gateW}/>
        </SvgFadeIn>

        {/* Input stubs */}
        <TraceIn d={`M ${inputX - 36} ${inputAY} L ${inputX} ${inputAY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={0.6}/>
        <TraceIn d={`M ${inputX - 36} ${inputBY} L ${inputX} ${inputBY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={0.8}/>
        <TraceIn d={`M ${outputX} ${G.gateCy} L ${outputX + 50} ${G.gateCy}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={0.8}/>

        {/* Pin labels */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={inputX - 44} y={inputAY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>A</text>
          <text x={inputX - 44} y={inputBY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>B</text>
          <text x={outputX + 58} y={G.gateCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>Y</text>
        </SvgFadeIn>

        {/* Formula */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <text x={G.gateCx} y={G.gateCy + G.gateW * 0.7} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 26}>
            Y = ¬(A · B)
          </text>
        </SvgFadeIn>

        {/* Truth table */}
        <SvgFadeIn duration={0.5} delay={2.4}>
          {/* Header row */}
          {['A', 'B', 'Y'].map((h, i) => (
            <g key={h}>
              <rect x={G.tableX + i * G.cellW} y={G.tableY}
                    width={G.cellW} height={G.cellH}
                    fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
              <text x={G.tableX + i * G.cellW + G.cellW / 2}
                    y={G.tableY + G.cellH / 2 + 6}
                    textAnchor="middle"
                    fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                    fontSize={15} letterSpacing="0.1em">{h}</text>
            </g>
          ))}
          {/* Body rows */}
          {rows.map((r, ri) => (
            <g key={ri}>
              {[r.a, r.b, r.y].map((v, ci) => (
                <g key={ci}>
                  <rect x={G.tableX + ci * G.cellW}
                        y={G.tableY + (ri + 1) * G.cellH}
                        width={G.cellW} height={G.cellH}
                        fill={ci === 2 && v === 0 ? 'rgba(244,184,96,0.12)' : 'none'}
                        stroke="var(--chalk-300)" strokeWidth={1.2}/>
                  <text x={G.tableX + ci * G.cellW + G.cellW / 2}
                        y={G.tableY + (ri + 1) * G.cellH + G.cellH / 2 + 6}
                        textAnchor="middle"
                        fill={ci === 2 ? 'var(--amber-300)' : 'var(--chalk-100)'}
                        fontFamily="var(--font-mono)"
                        fontSize={16} letterSpacing="0.06em">{v}</text>
                </g>
              ))}
            </g>
          ))}
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            all ones — until both inputs are one
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: NOT from NAND ──────────────────────────────────────────────
// Genuine motion: A toggles 0→1→0→1, output Y inverts in sync, wire colours
// track the logical value.
function NotFromNandBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 600,
        gateCx: 340, gateCy: 240, gateW: 130,
        signalY: 410, signalH: 100, captionY: 560 }
    : { vbW: 1100, vbH: 460,
        gateCx: 520, gateCy: 220, gateW: 160,
        signalY: 340, signalH: 100, captionY: 440 };

  const inputX = G.gateCx - G.gateW / 2;
  const outputX = G.gateCx + G.gateW / 2 + G.gateW * 0.07 * 2;
  const wireY = G.gateCy;
  // Shorting point: a single A wire on the left that fans into both inputs.
  const fanX = inputX - 56;
  const inputAY = G.gateCy - G.gateW * 0.85 * 0.32;
  const inputBY = G.gateCy + G.gateW * 0.85 * 0.32;

  // Animate A toggling 0/1 in 1-second steps after a short setup delay.
  const TOGGLE_START = 1.6;
  const PERIOD = 1.2;
  const stepIdx = Math.max(0, Math.floor((localTime - TOGGLE_START) / PERIOD));
  const A = stepIdx % 2;       // toggles 0,1,0,1,...
  const Y = 1 - A;             // NOT A
  const showSignal = localTime > TOGGLE_START - 0.1;

  const wireColor = (v) => v ? 'var(--amber-300)' : 'var(--chalk-300)';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* NAND glyph */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <NandShape cx={G.gateCx} cy={G.gateCy} gw={G.gateW}/>
        </SvgFadeIn>

        {/* Single A wire fanning into both inputs (shorted) */}
        <TraceIn d={`M ${fanX - 90} ${wireY} L ${fanX} ${wireY}`}
                 stroke={showSignal ? wireColor(A) : 'var(--chalk-200)'}
                 strokeWidth={2.4}
                 duration={0.5} delay={0.4}/>
        <TraceIn d={`M ${fanX} ${wireY} L ${fanX} ${inputAY} L ${inputX} ${inputAY}`}
                 stroke={showSignal ? wireColor(A) : 'var(--chalk-200)'}
                 strokeWidth={2.4}
                 duration={0.5} delay={0.8}/>
        <TraceIn d={`M ${fanX} ${wireY} L ${fanX} ${inputBY} L ${inputX} ${inputBY}`}
                 stroke={showSignal ? wireColor(A) : 'var(--chalk-200)'}
                 strokeWidth={2.4}
                 duration={0.5} delay={0.8}/>
        {/* Fan-out node */}
        <SvgFadeIn duration={0.3} delay={1.1}>
          <circle cx={fanX} cy={wireY} r={3.5}
                  fill={showSignal ? wireColor(A) : 'var(--chalk-200)'}/>
        </SvgFadeIn>

        {/* Output wire */}
        <TraceIn d={`M ${outputX} ${wireY} L ${outputX + 100} ${wireY}`}
                 stroke={showSignal ? wireColor(Y) : 'var(--chalk-200)'}
                 strokeWidth={2.4}
                 duration={0.5} delay={0.8}/>

        {/* A and Y labels with live values */}
        <SvgFadeIn duration={0.4} delay={1.1}>
          <text x={fanX - 100} y={wireY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>A</text>
          <text x={outputX + 110} y={wireY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={22}>Y</text>
        </SvgFadeIn>

        {/* Live A and Y boxes — value-driven, the heart of the beat */}
        {showSignal && (
          <g>
            <rect x={fanX - 92} y={wireY - 16} width={20} height={32}
                  fill="rgba(244,184,96,0.08)"
                  stroke={wireColor(A)} strokeWidth={1.2} rx={3}/>
            <text x={fanX - 82} y={wireY + 6} textAnchor="middle"
                  fill={wireColor(A)} fontFamily="var(--font-mono)"
                  fontSize={18} fontWeight="bold">{A}</text>
            <rect x={outputX + 60} y={wireY - 16} width={20} height={32}
                  fill="rgba(244,184,96,0.08)"
                  stroke={wireColor(Y)} strokeWidth={1.2} rx={3}/>
            <text x={outputX + 70} y={wireY + 6} textAnchor="middle"
                  fill={wireColor(Y)} fontFamily="var(--font-mono)"
                  fontSize={18} fontWeight="bold">{Y}</text>
          </g>
        )}

        {/* Identity formula */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.signalY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 30}>
            A · A = A  →  Y = ¬A
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            one gate, a wire — that's a NOT
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: AND from NAND ───────────────────────────────────────────────
// Genuine motion: (A, B) cycles through 00, 01, 10, 11; signals propagate
// through NAND→NAND-NOT and the live truth-table row glows.
function AndFromNandBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 800,
        gate1Cx: 200, gate1Cy: 220, gate2Cx: 400, gate2Cy: 220,
        gateW: 110, tableX: 180, tableY: 440, cellW: 70, cellH: 42,
        formulaY: 370, captionY: 770 }
    : { vbW: 1140, vbH: 480,
        gate1Cx: 380, gate1Cy: 220, gate2Cx: 620, gate2Cy: 220,
        gateW: 130, tableX: 800, tableY: 110, cellW: 80, cellH: 50,
        formulaY: 380, captionY: 460 };

  const gate1Left = G.gate1Cx - G.gateW / 2;
  const gate1Out = G.gate1Cx + G.gateW / 2 + G.gateW * 0.07 * 2;
  const gate2Left = G.gate2Cx - G.gateW / 2;
  const gate2Out = G.gate2Cx + G.gateW / 2 + G.gateW * 0.07 * 2;
  const inputAY = G.gate1Cy - G.gateW * 0.85 * 0.32;
  const inputBY = G.gate1Cy + G.gateW * 0.85 * 0.32;
  const wireY = G.gate1Cy;
  // Second gate's inputs are shorted on the interconnect wire.
  const gate2InAY = G.gate2Cy - G.gateW * 0.85 * 0.32;
  const gate2InBY = G.gate2Cy + G.gateW * 0.85 * 0.32;

  // Cycle through input patterns.
  const CYCLE_START = 1.2;
  const STEP = 1.8;
  const cycleIdx = Math.max(0, Math.floor((localTime - CYCLE_START) / STEP)) % 4;
  const rows = [
    { a: 0, b: 0, mid: 1, y: 0 },
    { a: 0, b: 1, mid: 1, y: 0 },
    { a: 1, b: 0, mid: 1, y: 0 },
    { a: 1, b: 1, mid: 0, y: 1 },
  ];
  const cur = rows[cycleIdx];
  const showSignal = localTime > CYCLE_START - 0.1;

  const wireColor = (v) => v ? 'var(--amber-300)' : 'var(--chalk-300)';
  const aColor = showSignal ? wireColor(cur.a) : 'var(--chalk-200)';
  const bColor = showSignal ? wireColor(cur.b) : 'var(--chalk-200)';
  const midColor = showSignal ? wireColor(cur.mid) : 'var(--chalk-200)';
  const yColor = showSignal ? wireColor(cur.y) : 'var(--chalk-200)';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Two NAND glyphs */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <NandShape cx={G.gate1Cx} cy={G.gate1Cy} gw={G.gateW}/>
          <NandShape cx={G.gate2Cx} cy={G.gate2Cy} gw={G.gateW}/>
        </SvgFadeIn>

        {/* A and B input wires */}
        <TraceIn d={`M ${gate1Left - 70} ${inputAY} L ${gate1Left} ${inputAY}`}
                 stroke={aColor} strokeWidth={2.4}
                 duration={0.4} delay={0.4}/>
        <TraceIn d={`M ${gate1Left - 70} ${inputBY} L ${gate1Left} ${inputBY}`}
                 stroke={bColor} strokeWidth={2.4}
                 duration={0.4} delay={0.6}/>

        {/* Interconnect (mid wire) from gate1 output to gate2 fan-in */}
        <TraceIn d={`M ${gate1Out} ${wireY} L ${(gate1Out + gate2Left) / 2 + 4} ${wireY}`}
                 stroke={midColor} strokeWidth={2.4}
                 duration={0.4} delay={0.8}/>
        {/* Fan into both inputs of gate 2 (shorted to form a NOT) */}
        <TraceIn d={`M ${(gate1Out + gate2Left) / 2 + 4} ${wireY} L ${(gate1Out + gate2Left) / 2 + 4} ${gate2InAY} L ${gate2Left} ${gate2InAY}`}
                 stroke={midColor} strokeWidth={2.4}
                 duration={0.4} delay={1.0}/>
        <TraceIn d={`M ${(gate1Out + gate2Left) / 2 + 4} ${wireY} L ${(gate1Out + gate2Left) / 2 + 4} ${gate2InBY} L ${gate2Left} ${gate2InBY}`}
                 stroke={midColor} strokeWidth={2.4}
                 duration={0.4} delay={1.0}/>
        <SvgFadeIn duration={0.3} delay={1.2}>
          <circle cx={(gate1Out + gate2Left) / 2 + 4} cy={wireY} r={3.5}
                  fill={midColor}/>
        </SvgFadeIn>

        {/* Final Y wire */}
        <TraceIn d={`M ${gate2Out} ${wireY} L ${gate2Out + 60} ${wireY}`}
                 stroke={yColor} strokeWidth={2.4}
                 duration={0.4} delay={1.2}/>

        {/* Pin labels */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <text x={gate1Left - 78} y={inputAY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>A</text>
          <text x={gate1Left - 78} y={inputBY + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>B</text>
          <text x={gate2Out + 68} y={wireY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>Y</text>
        </SvgFadeIn>

        {/* Live A, B, Y boxes */}
        {showSignal && (
          <g>
            <rect x={gate1Left - 60} y={inputAY - 14} width={20} height={28}
                  fill="rgba(244,184,96,0.08)" rx={3}
                  stroke={aColor} strokeWidth={1.2}/>
            <text x={gate1Left - 50} y={inputAY + 6} textAnchor="middle"
                  fill={aColor} fontFamily="var(--font-mono)"
                  fontSize={16} fontWeight="bold">{cur.a}</text>
            <rect x={gate1Left - 60} y={inputBY - 14} width={20} height={28}
                  fill="rgba(244,184,96,0.08)" rx={3}
                  stroke={bColor} strokeWidth={1.2}/>
            <text x={gate1Left - 50} y={inputBY + 6} textAnchor="middle"
                  fill={bColor} fontFamily="var(--font-mono)"
                  fontSize={16} fontWeight="bold">{cur.b}</text>
            <rect x={gate2Out + 24} y={wireY - 14} width={20} height={28}
                  fill="rgba(244,184,96,0.08)" rx={3}
                  stroke={yColor} strokeWidth={1.2}/>
            <text x={gate2Out + 34} y={wireY + 6} textAnchor="middle"
                  fill={yColor} fontFamily="var(--font-mono)"
                  fontSize={16} fontWeight="bold">{cur.y}</text>
          </g>
        )}

        {/* Identity formula */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={portrait ? G.vbW / 2 : (gate1Left + gate2Out) / 2}
                y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 26}>
            ¬(A NAND B) = A · B
          </text>
        </SvgFadeIn>

        {/* Truth table */}
        <SvgFadeIn duration={0.5} delay={2.0}>
          {/* Header */}
          {['A', 'B', 'Y'].map((h, i) => (
            <g key={h}>
              <rect x={G.tableX + i * G.cellW} y={G.tableY}
                    width={G.cellW} height={G.cellH}
                    fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
              <text x={G.tableX + i * G.cellW + G.cellW / 2}
                    y={G.tableY + G.cellH / 2 + 6}
                    textAnchor="middle"
                    fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                    fontSize={14} letterSpacing="0.1em">{h}</text>
            </g>
          ))}
          {/* Body — current row glows */}
          {rows.map((r, ri) => {
            const isCurrent = showSignal && ri === cycleIdx;
            const cells = [r.a, r.b, r.y];
            return (
              <g key={ri}>
                {cells.map((v, ci) => (
                  <g key={ci}>
                    <rect x={G.tableX + ci * G.cellW}
                          y={G.tableY + (ri + 1) * G.cellH}
                          width={G.cellW} height={G.cellH}
                          fill={isCurrent ? 'rgba(244,184,96,0.18)' : 'none'}
                          stroke="var(--chalk-300)" strokeWidth={1.2}/>
                    <text x={G.tableX + ci * G.cellW + G.cellW / 2}
                          y={G.tableY + (ri + 1) * G.cellH + G.cellH / 2 + 6}
                          textAnchor="middle"
                          fill={isCurrent
                                  ? 'var(--amber-300)'
                                  : (ci === 2 ? 'var(--chalk-200)' : 'var(--chalk-100)')}
                          fontFamily="var(--font-mono)"
                          fontSize={15} letterSpacing="0.06em"
                          fontWeight={isCurrent ? 'bold' : 'normal'}>{v}</text>
                  </g>
                ))}
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two NANDs in series — AND falls out
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
          fontSize: portrait ? 26 : 34,
          color: 'var(--chalk-200)',
        }}>
        A + B = ¬(¬A · ¬B)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.35,
          textAlign: 'center', marginTop: 4,
        }}>
        NOT, AND, OR — every Boolean function — from NAND alone.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.2} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (one transistor cell — a whole CPU)
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
