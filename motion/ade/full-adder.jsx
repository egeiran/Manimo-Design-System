// The Full Adder: How a Carry Ripples Through a Chain — Manimo lesson scene.
// A full adder takes A, B, C_in → Sum, C_out. Built from two half adders
// and an OR gate. Genuine animation lives in Beats 4 + 5: in Beat 4,
// signals propagate left-to-right through the gates of a single full
// adder, each gate glowing as its inputs settle; in Beat 5, four full
// adders are chained and the carry ripples from LSB to MSB while each
// block lights up in turn.
//
// Beats (timed to Mistral Voxtral narration in motion/ade/audio/full-adder/):
//    0.00– 5.42  Manimo intro: where does the carry go?
//    5.42–17.27  Half adder: XOR for sum, AND for carry
//   17.27–27.36  Full adder structure: two half adders + OR for C_out
//   27.36–46.91  Propagation: A=B=C_in=1 → Sum=1, C_out=1, gates glow in order
//   46.91–59.64  Ripple: four adders, carry chain runs LSB→MSB
//   59.64–70.00  Takeaway: local sum, global carry
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Gate glow + signal arrival are driven from useSprite() localTime so
//     the propagation cascade is visible and pedagogically correct.

const SCENE_DURATION = 70;

const NARRATION = [
  /*  0.00– 5.42 */ "Adding two bits is easy — but a carry can spread through every column. How does it actually move?",
  /*  5.42–17.27 */ "A half adder takes two bits A and B and produces a sum bit, X O R, and a carry bit, A N D. Good for one column, but it can't accept an incoming carry from the column below.",
  /* 17.27–27.36 */ "Stack two half adders. The first takes A and B; the second adds C in to that partial sum. An O R gate merges the two carry signals into C out.",
  /* 27.36–46.91 */ "Set A and B to one, and C in to one. The first X O R fires, then the second X O R fires, and finally the O R gate raises C out. Sum lands at one, C out lands at one — one plus one plus one equals binary one one.",
  /* 46.91–59.64 */ "Chain four of them and you add two four-bit numbers. The carry from each column has to settle before the next column can finish — that's why the rightmost adder fires first, then the next, and so on.",
  /* 59.64–70.00 */ "Each column is local. The carry chain is global — and that is what makes ripple-carry addition slow for wide numbers.",
];

const NARRATION_AUDIO = 'audio/full-adder/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="The Full Adder: How a Carry Ripples Through a Chain"
      duration={SCENE_DURATION}
      introEnd={5.42}
      introCaption="One bit per column — but where does the carry go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.42} end={17.27}>
        <HalfAdderBeat />
      </Sprite>

      <Sprite start={17.27} end={27.36}>
        <StructureBeat />
      </Sprite>

      <Sprite start={27.36} end={46.91}>
        <PropagationBeat />
      </Sprite>

      <Sprite start={46.91} end={59.64}>
        <RippleBeat />
      </Sprite>

      <Sprite start={59.64} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Gate shapes (SVG primitives) ────────────────────────────────────────
// Each gate is drawn inside a box of width `w`, height `h`, anchored at
// (x, y) for the back-top corner. Outputs leave from (x + w, y + h / 2);
// inputs enter at (x, y + h * 0.25) and (x, y + h * 0.75).
function AndGate({ x, y, w = 60, h = 36, color, glow = 0 }) {
  const r = h / 2;
  const d = `M ${x} ${y} L ${x + w - r} ${y} A ${r} ${r} 0 0 1 ${x + w - r} ${y + h} L ${x} ${y + h} Z`;
  return (
    <g>
      {glow > 0 && <path d={d} fill={color} opacity={glow * 0.30}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={2}/>
    </g>
  );
}
function OrGate({ x, y, w = 60, h = 36, color, glow = 0 }) {
  const d = `M ${x} ${y}
             Q ${x + 12} ${y + h / 2} ${x} ${y + h}
             Q ${x + w * 0.55} ${y + h} ${x + w} ${y + h / 2}
             Q ${x + w * 0.55} ${y} ${x} ${y} Z`;
  return (
    <g>
      {glow > 0 && <path d={d} fill={color} opacity={glow * 0.30}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={2}/>
    </g>
  );
}
function XorGate({ x, y, w = 60, h = 36, color, glow = 0 }) {
  // OR shape shifted right + extra back curve
  const d = `M ${x + 6} ${y}
             Q ${x + 18} ${y + h / 2} ${x + 6} ${y + h}
             Q ${x + 6 + w * 0.55} ${y + h} ${x + w} ${y + h / 2}
             Q ${x + 6 + w * 0.55} ${y} ${x + 6} ${y} Z`;
  const back = `M ${x} ${y} Q ${x + 12} ${y + h / 2} ${x} ${y + h}`;
  return (
    <g>
      {glow > 0 && <path d={d} fill={color} opacity={glow * 0.30}/>}
      <path d={d} fill="none" stroke={color} strokeWidth={2}/>
      <path d={back} fill="none" stroke={color} strokeWidth={2}/>
    </g>
  );
}

// Glow envelope: ramps up over 0.2s, holds, decays over 0.6s.
function glowAt(localTime, fireTime) {
  const dt = localTime - fireTime;
  if (dt < -0.05) return 0;
  if (dt < 0.2) return clamp((dt + 0.05) / 0.25, 0, 1);
  if (dt < 0.8) return 1;
  return clamp(1 - (dt - 0.8) / 0.6, 0, 1);
}

// Bit-value bubble next to a wire (small circle with "0" or "1" inside).
function BitBubble({ cx, cy, value, color = 'var(--amber-300)', visible = true, r = 11, fontSize = 14 }) {
  if (!visible) return null;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill="var(--bg-canvas)" stroke={color} strokeWidth={1.6}/>
      <text x={cx} y={cy + fontSize * 0.36} textAnchor="middle"
            fill={color} fontFamily="var(--font-mono)" fontSize={fontSize}>
        {value}
      </text>
    </g>
  );
}

// ─── Beat 2: Half adder ──────────────────────────────────────────────────
function HalfAdderBeat() {
  const portrait = usePortrait();
  // Input wire y-coords MUST land on each gate's top/bottom input pins
  // (gy + 0.25·gh and gy + 0.75·gh). Otherwise the wires terminate
  // mid-air outside the gate body.
  const G = portrait
    ? { vbW: 600, vbH: 580, gx: 220, gy1: 110, gy2: 320, gw: 100, gh: 60,
        // XOR (top) input pins:  gy1 + gh/4 = 125,  gy1 + 3gh/4 = 155
        // AND (bottom) input pins: gy2 + gh/4 = 335, gy2 + 3gh/4 = 365
        inAx: 80, inBx: 80, inAy: 125, inBy: 155,
        inAy2: 335, inBy2: 365,
        outX: 480, captionY: 540, font: 16 }
    : { vbW: 1000, vbH: 360, gx: 380, gy1: 50, gy2: 210, gw: 100, gh: 60,
        // XOR: 65 / 95.  AND: 225 / 255.
        inAx: 140, inBx: 140, inAy: 65, inBy: 95,
        inAy2: 225, inBy2: 255,
        outX: 700, captionY: 340, font: 16 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* XOR gate (top) and input wires */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <XorGate x={G.gx} y={G.gy1} w={G.gw} h={G.gh} color="var(--amber-400)"/>
        </SvgFadeIn>
        <TraceIn d={`M ${G.inAx} ${G.inAy} L ${G.gx + 6} ${G.inAy}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={0.6}/>
        <TraceIn d={`M ${G.inBx} ${G.inBy} L ${G.gx + 6} ${G.inBy}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={0.8}/>
        <TraceIn d={`M ${G.gx + G.gw} ${G.gy1 + G.gh / 2} L ${G.outX} ${G.gy1 + G.gh / 2}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.4}/>

        {/* AND gate (bottom) and input wires */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <AndGate x={G.gx} y={G.gy2} w={G.gw} h={G.gh} color="var(--amber-400)"/>
        </SvgFadeIn>
        <TraceIn d={`M ${G.inAx} ${G.inAy2} L ${G.gx} ${G.inAy2}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.2}/>
        <TraceIn d={`M ${G.inBx} ${G.inBy2} L ${G.gx} ${G.inBy2}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.4}/>
        <TraceIn d={`M ${G.gx + G.gw} ${G.gy2 + G.gh / 2} L ${G.outX} ${G.gy2 + G.gh / 2}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={1.8}/>

        {/* Input + output labels */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <text x={G.inAx - 14} y={G.inAy + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>A</text>
          <text x={G.inBx - 14} y={G.inBy + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>B</text>
          <text x={G.inAx - 14} y={G.inAy2 + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>A</text>
          <text x={G.inBx - 14} y={G.inBy2 + 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>B</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.0}>
          <text x={G.outX + 14} y={G.gy1 + G.gh / 2 + 6}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.font - 2} letterSpacing="0.1em">SUM</text>
          <text x={G.outX + 14} y={G.gy2 + G.gh / 2 + 6}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={G.font - 2} letterSpacing="0.1em">CARRY</text>
        </SvgFadeIn>

        {/* Operator badges next to the gates */}
        <SvgFadeIn duration={0.4} delay={1.8}>
          <text x={G.gx + G.gw / 2 + 6} y={G.gy1 + G.gh / 2 + 6} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.font - 1}>⊕</text>
          <text x={G.gx + G.gw / 2} y={G.gy2 + G.gh / 2 + 6} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.font - 1}>·</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 22}>
            sum = A ⊕ B,   carry = A · B
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Full-adder geometry (shared by beats 3 + 4) ─────────────────────────
function fullAdderGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 680,
      gw: 80, gh: 36,
      // Left column inputs
      inAx: 50, inAy: 130,
      inBx: 50, inBy: 220,
      inCx: 50, inCy: 380,
      // Gates
      xor1: { x: 180, y: 130 },
      and1: { x: 180, y: 250 },
      xor2: { x: 340, y: 200 },
      and2: { x: 340, y: 350 },
      orG:  { x: 480, y: 430 },
      // Outputs
      sumOutX: 560, sumOutY: 218,
      carryOutX: 560, carryOutY: 448,
      captionY: 640, font: 14, glowColor: 'var(--rose-300)',
    };
  }
  return {
    vbW: 1100, vbH: 460,
    gw: 80, gh: 36,
    inAx: 80, inAy: 80,
    inBx: 80, inBy: 150,
    inCx: 80, inCy: 290,
    xor1: { x: 240, y: 80 },
    and1: { x: 240, y: 200 },
    xor2: { x: 440, y: 150 },
    and2: { x: 440, y: 280 },
    orG:  { x: 640, y: 320 },
    sumOutX: 870, sumOutY: 168,
    carryOutX: 870, carryOutY: 338,
    captionY: 430, font: 14, glowColor: 'var(--rose-300)',
  };
}

// Build the wire paths for the structure / propagation diagrams. Returns
// a list of {key, d, kind} entries. `kind` controls which signal "owns"
// the wire — handy for colouring during propagation.
function fullAdderWires(G) {
  const { gw, gh } = G;
  const xor1MidY = G.xor1.y + gh / 2;
  const xor1TopY = G.xor1.y + gh * 0.25;
  const xor1BotY = G.xor1.y + gh * 0.75;
  const and1MidY = G.and1.y + gh / 2;
  const and1TopY = G.and1.y + gh * 0.25;
  const and1BotY = G.and1.y + gh * 0.75;
  const xor2MidY = G.xor2.y + gh / 2;
  const xor2TopY = G.xor2.y + gh * 0.25;
  const xor2BotY = G.xor2.y + gh * 0.75;
  const and2MidY = G.and2.y + gh / 2;
  const and2TopY = G.and2.y + gh * 0.25;
  const and2BotY = G.and2.y + gh * 0.75;
  const orMidY  = G.orG.y + gh / 2;
  const orTopY  = G.orG.y + gh * 0.25;
  const orBotY  = G.orG.y + gh * 0.75;

  // A and B fan to both half-adders. Use junctions at fixed columns.
  const aFanX = G.inAx + 60;
  const bFanX = G.inBx + 90;
  const aXor1X = G.xor1.x + 6;
  const aAnd1X = G.and1.x;
  return [
    // A → XOR1 (top input)
    { key: 'aXor1', d: `M ${G.inAx} ${G.inAy} L ${aFanX} ${G.inAy} L ${aFanX} ${xor1TopY} L ${aXor1X} ${xor1TopY}`, signal: 'A' },
    // A → AND1 (top input) — branch down from the junction
    { key: 'aAnd1', d: `M ${aFanX} ${G.inAy} L ${aFanX} ${and1TopY} L ${aAnd1X} ${and1TopY}`, signal: 'A' },
    // B → XOR1 (bottom input)
    { key: 'bXor1', d: `M ${G.inBx} ${G.inBy} L ${bFanX} ${G.inBy} L ${bFanX} ${xor1BotY} L ${aXor1X} ${xor1BotY}`, signal: 'B' },
    // B → AND1 (bottom input)
    { key: 'bAnd1', d: `M ${bFanX} ${G.inBy} L ${bFanX} ${and1BotY} L ${aAnd1X} ${and1BotY}`, signal: 'B' },
    // XOR1 → XOR2 (top input) and → AND2 (top input)
    { key: 'p1Xor2', d: `M ${G.xor1.x + gw} ${xor1MidY} L ${G.xor2.x - 22} ${xor1MidY} L ${G.xor2.x - 22} ${xor2TopY} L ${G.xor2.x + 6} ${xor2TopY}`, signal: 'P' },
    { key: 'p1And2', d: `M ${G.xor2.x - 22} ${xor1MidY} L ${G.xor2.x - 22} ${and2TopY} L ${G.and2.x} ${and2TopY}`, signal: 'P' },
    // C_in → XOR2 (bottom input) and → AND2 (bottom input)
    { key: 'cinXor2', d: `M ${G.inCx} ${G.inCy} L ${G.xor2.x - 50} ${G.inCy} L ${G.xor2.x - 50} ${xor2BotY} L ${G.xor2.x + 6} ${xor2BotY}`, signal: 'Cin' },
    { key: 'cinAnd2', d: `M ${G.xor2.x - 50} ${G.inCy} L ${G.xor2.x - 50} ${and2BotY} L ${G.and2.x} ${and2BotY}`, signal: 'Cin' },
    // XOR2 → Sum
    { key: 'sum', d: `M ${G.xor2.x + gw} ${xor2MidY} L ${G.sumOutX} ${xor2MidY}`, signal: 'Sum' },
    // AND1 → OR top input
    { key: 'g1Or', d: `M ${G.and1.x + gw} ${and1MidY} L ${G.orG.x - 24} ${and1MidY} L ${G.orG.x - 24} ${orTopY} L ${G.orG.x} ${orTopY}`, signal: 'G1' },
    // AND2 → OR bottom input
    { key: 'g2Or', d: `M ${G.and2.x + gw} ${and2MidY} L ${G.orG.x - 12} ${and2MidY} L ${G.orG.x - 12} ${orBotY} L ${G.orG.x} ${orBotY}`, signal: 'G2' },
    // OR → C_out
    { key: 'cout', d: `M ${G.orG.x + gw} ${orMidY} L ${G.carryOutX} ${orMidY}`, signal: 'Cout' },
  ];
}

// ─── Beat 3: Full-adder structure ────────────────────────────────────────
function StructureBeat() {
  const portrait = usePortrait();
  const G = fullAdderGeometry(portrait);
  const wires = fullAdderWires(G);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Gates */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <XorGate x={G.xor1.x} y={G.xor1.y} w={G.gw} h={G.gh} color="var(--amber-400)"/>
          <AndGate x={G.and1.x} y={G.and1.y} w={G.gw} h={G.gh} color="var(--amber-400)"/>
          <XorGate x={G.xor2.x} y={G.xor2.y} w={G.gw} h={G.gh} color="var(--amber-400)"/>
          <AndGate x={G.and2.x} y={G.and2.y} w={G.gw} h={G.gh} color="var(--amber-400)"/>
          <OrGate  x={G.orG.x}  y={G.orG.y}  w={G.gw} h={G.gh} color="var(--amber-400)"/>
        </SvgFadeIn>

        {/* Operator badges */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.xor1.x + G.gw / 2 + 6} y={G.xor1.y + G.gh / 2 + 5} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>⊕</text>
          <text x={G.and1.x + G.gw / 2} y={G.and1.y + G.gh / 2 + 5} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>·</text>
          <text x={G.xor2.x + G.gw / 2 + 6} y={G.xor2.y + G.gh / 2 + 5} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>⊕</text>
          <text x={G.and2.x + G.gw / 2} y={G.and2.y + G.gh / 2 + 5} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>·</text>
          <text x={G.orG.x + G.gw / 2 + 4} y={G.orG.y + G.gh / 2 + 5} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>+</text>
        </SvgFadeIn>

        {/* Wires, drawn staggered */}
        {wires.map((w, i) => (
          <TraceIn key={w.key} d={w.d}
            stroke="var(--chalk-200)" strokeWidth={1.8}
            duration={0.5} delay={1.0 + i * 0.10}/>
        ))}

        {/* Labels for the three inputs and two outputs */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={G.inAx - 12} y={G.inAy + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>A</text>
          <text x={G.inBx - 12} y={G.inBy + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>B</text>
          <text x={G.inCx - 12} y={G.inCy + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>
            C<tspan baselineShift="sub" fontSize={10}>in</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.4}>
          <text x={G.sumOutX + 12} y={G.sumOutY + 5}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">SUM</text>
          <text x={G.carryOutX + 12} y={G.carryOutY + 5}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">C_OUT</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 16 : 18}>
            two half adders + one OR — that's a full adder
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Propagation — A=1, B=1, C_in=1 ──────────────────────────────
function PropagationBeat() {
  const portrait = usePortrait();
  const G = fullAdderGeometry(portrait);
  const wires = fullAdderWires(G);
  const { localTime } = useSprite();

  // Test vector A=B=Cin=1. Internal: P = A⊕B = 0, G1 = AB = 1, Sum = P⊕Cin = 1,
  // G2 = P·Cin = 0, Cout = G1+G2 = 1.
  const values = {
    A: 1, B: 1, Cin: 1, P: 0, G1: 1, G2: 0, Sum: 1, Cout: 1,
  };

  // Settle times for each signal — set so the cascade is visibly serial.
  const settle = { A: 0.6, B: 0.6, Cin: 0.6, P: 1.6, G1: 1.6, G2: 2.6, Sum: 2.6, Cout: 3.6 };

  // Gate fire times (output settles ≈ 0.2s after gate fires)
  const gateFire = {
    xor1: 1.4, and1: 1.4, xor2: 2.4, and2: 2.4, orG: 3.4,
  };

  // Bubble appears as its signal settles (small grow-in animation handled
  // by SvgFadeIn-ish opacity ramp).
  function bubbleAlpha(t0) {
    const dt = localTime - t0;
    return dt < 0 ? 0 : clamp(dt / 0.3, 0, 1);
  }
  function wireActive(signal) {
    return localTime >= settle[signal] - 0.05;
  }

  // Bubble positions (offset slightly along the wire from its source).
  const bubbles = [
    { id: 'A', x: G.inAx + 28, y: G.inAy, v: values.A },
    { id: 'B', x: G.inBx + 28, y: G.inBy, v: values.B },
    { id: 'Cin', x: G.inCx + 28, y: G.inCy, v: values.Cin },
    { id: 'P', x: G.xor1.x + G.gw + 16, y: G.xor1.y + G.gh / 2, v: values.P },
    { id: 'G1', x: G.and1.x + G.gw + 16, y: G.and1.y + G.gh / 2, v: values.G1 },
    { id: 'G2', x: G.and2.x + G.gw + 16, y: G.and2.y + G.gh / 2, v: values.G2 },
    { id: 'Sum', x: G.sumOutX - 16, y: G.sumOutY, v: values.Sum },
    { id: 'Cout', x: G.carryOutX - 16, y: G.carryOutY, v: values.Cout },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Gates with glow */}
        <XorGate x={G.xor1.x} y={G.xor1.y} w={G.gw} h={G.gh}
                 color="var(--amber-400)" glow={glowAt(localTime, gateFire.xor1)}/>
        <AndGate x={G.and1.x} y={G.and1.y} w={G.gw} h={G.gh}
                 color="var(--amber-400)" glow={glowAt(localTime, gateFire.and1)}/>
        <XorGate x={G.xor2.x} y={G.xor2.y} w={G.gw} h={G.gh}
                 color="var(--amber-400)" glow={glowAt(localTime, gateFire.xor2)}/>
        <AndGate x={G.and2.x} y={G.and2.y} w={G.gw} h={G.gh}
                 color="var(--amber-400)" glow={glowAt(localTime, gateFire.and2)}/>
        <OrGate  x={G.orG.x}  y={G.orG.y}  w={G.gw} h={G.gh}
                 color="var(--amber-400)" glow={glowAt(localTime, gateFire.orG)}/>

        {/* Operator badges */}
        <text x={G.xor1.x + G.gw / 2 + 6} y={G.xor1.y + G.gh / 2 + 5} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>⊕</text>
        <text x={G.and1.x + G.gw / 2} y={G.and1.y + G.gh / 2 + 5} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>·</text>
        <text x={G.xor2.x + G.gw / 2 + 6} y={G.xor2.y + G.gh / 2 + 5} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>⊕</text>
        <text x={G.and2.x + G.gw / 2} y={G.and2.y + G.gh / 2 + 5} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>·</text>
        <text x={G.orG.x + G.gw / 2 + 4} y={G.orG.y + G.gh / 2 + 5} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={14}>+</text>

        {/* Wires — colour follows the signal once settled */}
        {wires.map(w => (
          <path key={w.key} d={w.d} fill="none"
                stroke={wireActive(w.signal) ? 'var(--amber-300)' : 'var(--chalk-300)'}
                strokeWidth={wireActive(w.signal) ? 2.2 : 1.6}
                opacity={wireActive(w.signal) ? 1 : 0.55}/>
        ))}

        {/* Input labels */}
        <text x={G.inAx - 12} y={G.inAy + 5} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>A</text>
        <text x={G.inBx - 12} y={G.inBy + 5} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>B</text>
        <text x={G.inCx - 12} y={G.inCy + 5} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>
          C<tspan baselineShift="sub" fontSize={10}>in</tspan>
        </text>
        <text x={G.sumOutX + 12} y={G.sumOutY + 5}
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={13} letterSpacing="0.1em">SUM</text>
        <text x={G.carryOutX + 12} y={G.carryOutY + 5}
              fill="var(--rose-300)" fontFamily="var(--font-mono)"
              fontSize={13} letterSpacing="0.1em">C_OUT</text>

        {/* Bit bubbles — pop in as each signal settles */}
        {bubbles.map(b => {
          const a = bubbleAlpha(settle[b.id]);
          if (a < 0.01) return null;
          const color = (b.id === 'Cout' || b.id === 'G1') ? 'var(--rose-300)' : 'var(--amber-300)';
          return (
            <g key={b.id} opacity={a}>
              <BitBubble cx={b.x} cy={b.y} value={b.v} color={color}/>
            </g>
          );
        })}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 22}>
            1 + 1 + 1 = 11₂  —  Sum 1, C_out 1
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Ripple chain — four full adders ─────────────────────────────
function RippleBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // A = 0111, B = 0011 (binary 7 + 3 = 10 = 1010, final C_out 0)
  // Block layout: bit 0 (LSB) on the right; carry travels right → left.
  // Per-bit values:
  //   FA0: A=1, B=1, Cin=0 → S=0, Cout=1
  //   FA1: A=1, B=1, Cin=1 → S=1, Cout=1
  //   FA2: A=1, B=0, Cin=1 → S=0, Cout=1
  //   FA3: A=0, B=0, Cin=1 → S=1, Cout=0
  const adders = [
    { idx: 0, A: 1, B: 1, Cin: 0, S: 0, Cout: 1 },
    { idx: 1, A: 1, B: 1, Cin: 1, S: 1, Cout: 1 },
    { idx: 2, A: 1, B: 0, Cin: 1, S: 0, Cout: 1 },
    { idx: 3, A: 0, B: 0, Cin: 1, S: 1, Cout: 0 },
  ];

  // Each adder fires sequentially from idx=0. Settle every 0.7s.
  const fireDelay = 0.7;
  const HOLD_BEFORE_FIRE = 0.8;
  function adderActive(idx) {
    return localTime >= HOLD_BEFORE_FIRE + idx * fireDelay - 0.05;
  }
  function adderGlow(idx) {
    return glowAt(localTime, HOLD_BEFORE_FIRE + idx * fireDelay);
  }
  function carryActive(idx) {
    // Carry from adder idx is the C_in of adder idx+1.
    return adderActive(idx) && adders[idx].Cout === 1;
  }

  const G = portrait
    ? { vbW: 600, vbH: 720, x0: 60, blockW: 120, blockH: 100, gap: 4,
        topY: 240, captionY: 660, fontA: 16, fontLabel: 11 }
    : { vbW: 1100, vbH: 460, x0: 100, blockW: 220, blockH: 140, gap: 12,
        topY: 130, captionY: 430, fontA: 18, fontLabel: 12 };

  // Build per-block x positions. Bit 0 (LSB) sits at the rightmost block.
  function blockX(idx) {
    const slot = adders.length - 1 - idx; // visual slot left→right
    return G.x0 + slot * (G.blockW + G.gap);
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Eyebrow */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.vbW / 2} y={G.topY - 30} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.16em">
            0111 + 0011 = ?
          </text>
        </SvgFadeIn>

        {/* Adder blocks */}
        {adders.map((ad) => {
          const x = blockX(ad.idx);
          const y = G.topY;
          const glow = adderGlow(ad.idx);
          const active = adderActive(ad.idx);
          return (
            <g key={ad.idx}>
              {/* Block body */}
              <SvgFadeIn duration={0.4} delay={0.3 + (3 - ad.idx) * 0.10}>
                <rect x={x} y={y} width={G.blockW} height={G.blockH}
                      rx={8} ry={8}
                      fill={glow > 0 ? 'var(--amber-400)' : 'none'}
                      opacity={glow > 0 ? glow * 0.20 : 1}
                      stroke="var(--amber-400)" strokeWidth={2}/>
                {/* Outline always drawn solid */}
                <rect x={x} y={y} width={G.blockW} height={G.blockH}
                      rx={8} ry={8}
                      fill="none"
                      stroke="var(--amber-400)" strokeWidth={2}/>
              </SvgFadeIn>

              {/* Bit index inside */}
              <SvgFadeIn duration={0.35} delay={0.5}>
                <text x={x + G.blockW / 2} y={y + G.blockH / 2 + 6} textAnchor="middle"
                      fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={G.fontA}>
                  FA<tspan baselineShift="sub" fontSize={G.fontA * 0.65}>{ad.idx}</tspan>
                </text>
              </SvgFadeIn>

              {/* Input A bubble (top-left) */}
              <SvgFadeIn duration={0.3} delay={0.7}>
                <BitBubble cx={x + G.blockW * 0.3} cy={y - 16} value={ad.A}
                  color="var(--chalk-100)" r={10} fontSize={12}/>
                <text x={x + G.blockW * 0.3 - 22} y={y - 12} textAnchor="end"
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={G.fontLabel}>A<tspan baselineShift="sub" fontSize={9}>{ad.idx}</tspan></text>
              </SvgFadeIn>
              {/* Input B bubble (top-right) */}
              <SvgFadeIn duration={0.3} delay={0.8}>
                <BitBubble cx={x + G.blockW * 0.7} cy={y - 16} value={ad.B}
                  color="var(--chalk-100)" r={10} fontSize={12}/>
                <text x={x + G.blockW * 0.7 + 22} y={y - 12}
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={G.fontLabel}>B<tspan baselineShift="sub" fontSize={9}>{ad.idx}</tspan></text>
              </SvgFadeIn>

              {/* Output S bubble (below) — pops in once this adder settles */}
              {active && (
                <g opacity={clamp((localTime - (HOLD_BEFORE_FIRE + ad.idx * fireDelay)) / 0.3, 0, 1)}>
                  <BitBubble cx={x + G.blockW / 2} cy={y + G.blockH + 18} value={ad.S}
                    color="var(--amber-300)" r={11} fontSize={13}/>
                  <text x={x + G.blockW / 2} y={y + G.blockH + 44} textAnchor="middle"
                        fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                        fontSize={G.fontLabel}>S<tspan baselineShift="sub" fontSize={9}>{ad.idx}</tspan></text>
                </g>
              )}
            </g>
          );
        })}

        {/* Carry chain wires between blocks */}
        {[0, 1, 2].map(i => {
          const fromX = blockX(i);         // block i is on the right; carry exits to the left
          const toX = blockX(i + 1);
          const x1 = fromX;                 // left edge of block i
          const x2 = toX + G.blockW;        // right edge of block i+1
          const yC = G.topY + G.blockH * 0.6;
          const active = carryActive(i);
          return (
            <g key={`c-${i}`}>
              <line x1={x1} y1={yC} x2={x2} y2={yC}
                    stroke={active ? 'var(--rose-400)' : 'var(--chalk-300)'}
                    strokeWidth={active ? 2.4 : 1.6}
                    opacity={active ? 1 : 0.5}/>
              {active && (
                <g opacity={clamp((localTime - (HOLD_BEFORE_FIRE + i * fireDelay)) / 0.3, 0, 1)}>
                  <BitBubble cx={(x1 + x2) / 2} cy={yC} value={adders[i].Cout}
                    color="var(--rose-300)" r={10} fontSize={12}/>
                </g>
              )}
            </g>
          );
        })}

        {/* Initial C_in (on the right) — always 0 */}
        <SvgFadeIn duration={0.3} delay={0.7}>
          <line x1={G.x0 + adders.length * (G.blockW + G.gap) - G.gap}
                y1={G.topY + G.blockH * 0.6}
                x2={G.x0 + adders.length * (G.blockW + G.gap) + 30}
                y2={G.topY + G.blockH * 0.6}
                stroke="var(--chalk-300)" strokeWidth={1.6} opacity={0.5}/>
          <BitBubble
            cx={G.x0 + adders.length * (G.blockW + G.gap) + 14}
            cy={G.topY + G.blockH * 0.6}
            value={0} color="var(--chalk-200)" r={10} fontSize={12}/>
          <text
            x={G.x0 + adders.length * (G.blockW + G.gap) + 36}
            y={G.topY + G.blockH * 0.6 + 4}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={G.fontLabel}>C<tspan baselineShift="sub" fontSize={9}>in</tspan></text>
        </SvgFadeIn>

        {/* Final result line (appears once last adder fires) */}
        {adderActive(3) && (
          <g opacity={clamp((localTime - (HOLD_BEFORE_FIRE + 3 * fireDelay + 0.4)) / 0.4, 0, 1)}>
            <text x={G.vbW / 2} y={G.topY + G.blockH + 78} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={portrait ? 22 : 28}>
              S = 1010<tspan baselineShift="sub" fontSize={12}>2</tspan> = 10<tspan baselineShift="sub" fontSize={12}>10</tspan>
            </text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            carry ripples right → left, one adder at a time
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 34, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        Sum = A ⊕ B ⊕ C<sub>in</sub>
      </FadeUp>

      <FadeUp duration={0.6} delay={1.0} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28, color: 'var(--rose-300)',
          letterSpacing: '0.02em',
        }}>
        C<sub>out</sub> = AB + C<sub>in</sub>(A ⊕ B)
      </FadeUp>

      <FadeUp duration={0.5} delay={2.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '26ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        local sum, global carry — the bottleneck of ripple-carry adders
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
