// Full Adder: Three Bits In, Two Bits Out — Manimo lesson scene.
// A full adder takes A, B, and a carry-in bit and produces a sum bit
// and a carry-out bit:
//   Sum  = A ⊕ B ⊕ Cin
//   Cout = (A · B) + (Cin · (A ⊕ B))
// Internally that's two XORs, two ANDs and one OR. The genuine motion
// lives in Beat 4: input combinations cycle 000 → 111, wires conducting
// a 1 glow amber while wires carrying a 0 stay dim, the truth-table row
// matching the current inputs highlights, and the output bits update.
//
// Beats (placeholder timings — Step 4c will overwrite with audio-aligned):
//    0– 5   Manimo intro + hook
//    5–17   Truth table — 8 rows of (A, B, Cin) → (Sum, Cout)
//   17–30   Gate-level circuit — two XORs, two ANDs, one OR
//   30–46   Walk every input combination, wires & outputs update  (genuine motion)
//   46–52   Takeaway — building block of every n-bit adder
//
// Authoring notes:
//   • Beat 3 and Beat 4 share gateGeometry() so the diagrams line up.
//   • The "live" wire colors and output bits in Beat 4 are pure functions
//     of A/B/Cin — no separate timing logic, so the diagram and the
//     truth-table row can never disagree.
//   • Gate symbols are inline SVG (no SVG primitive for these yet).

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0– 5  */ "Adding two bits is easy. Adding three bits in one box — that's the full adder.",
  /*  5–17 */ "Three inputs — A, B, and a carry from the column on the right. Eight combinations. Each row produces a sum bit and a carry out bit.",
  /* 17–30 */ "Build it from gates. Sum equals A xor B xor C in. Carry out is one whenever at least two inputs are one — two ANDs and an OR cover that.",
  /* 30–46 */ "Step through all eight combinations and watch the wires light up. The sum and carry update with no extra logic — that's a single adder cell working.",
  /* 46–52 */ "Chain n of these and you've got an n-bit ripple-carry adder — the simplest way to add binary numbers in hardware.",
];

const NARRATION_AUDIO = 'audio/full-adder/scene.mp3';

// All 8 input combinations enumerated once — used by the truth table AND
// by the walk-beat's cycle index so the highlight is guaranteed correct.
const ROWS = [];
for (let a = 0; a < 2; a++) {
  for (let b = 0; b < 2; b++) {
    for (let c = 0; c < 2; c++) {
      const sum = a ^ b ^ c;
      const cout = (a & b) | (c & (a ^ b));
      ROWS.push({ a, b, c, sum, cout });
    }
  }
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="Full Adder: Three Bits In, Two Bits Out"
      duration={SCENE_DURATION}
      introEnd={4.91}
      introCaption="Three bits in. Two bits out."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.91} end={13.71}>
        <TruthTableBeat />
      </Sprite>

      <Sprite start={13.71} end={25.01}>
        <GatesBeat />
      </Sprite>

      <Sprite start={25.01} end={33.97}>
        <WalkBeat />
      </Sprite>

      <Sprite start={33.97} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Gate symbols ────────────────────────────────────────────────────────
// All three return an <g> with input pins at (cx − w, cy ± pinOffset) and
// output pin at (cx + w, cy). Stroke colour controls "active" highlight.

function AndGate({ cx, cy, w = 22, color = 'var(--chalk-200)', active = false }) {
  const stroke = active ? 'var(--amber-300)' : color;
  const sw = active ? 2.4 : 1.8;
  // Flat back at x = cx − w, semicircle bulge to x = cx + w.
  const x0 = cx - w, x1 = cx + w;
  const h = w * 0.95;
  return (
    <g>
      <path d={`M ${x0} ${cy - h}
                L ${cx} ${cy - h}
                A ${h} ${h} 0 0 1 ${cx} ${cy + h}
                L ${x0} ${cy + h} Z`}
            fill="none" stroke={stroke} strokeWidth={sw}/>
    </g>
  );
}

function OrGate({ cx, cy, w = 22, color = 'var(--chalk-200)', active = false }) {
  const stroke = active ? 'var(--amber-300)' : color;
  const sw = active ? 2.4 : 1.8;
  const x0 = cx - w, x1 = cx + w;
  const h = w * 0.95;
  // Curved back + two slopes meeting at a point.
  return (
    <g>
      <path d={`M ${x0} ${cy - h}
                Q ${x0 + w * 0.6} ${cy}, ${x0} ${cy + h}
                Q ${cx} ${cy + h}, ${x1} ${cy}
                Q ${cx} ${cy - h}, ${x0} ${cy - h} Z`}
            fill="none" stroke={stroke} strokeWidth={sw}/>
    </g>
  );
}

function XorGate({ cx, cy, w = 22, color = 'var(--chalk-200)', active = false }) {
  // XOR is an OR with an extra curved back stripe.
  const stroke = active ? 'var(--amber-300)' : color;
  const sw = active ? 2.4 : 1.8;
  const x0 = cx - w, x1 = cx + w;
  const h = w * 0.95;
  return (
    <g>
      {/* outer OR shape */}
      <path d={`M ${x0} ${cy - h}
                Q ${x0 + w * 0.6} ${cy}, ${x0} ${cy + h}
                Q ${cx} ${cy + h}, ${x1} ${cy}
                Q ${cx} ${cy - h}, ${x0} ${cy - h} Z`}
            fill="none" stroke={stroke} strokeWidth={sw}/>
      {/* extra back stripe for XOR */}
      <path d={`M ${x0 - 5} ${cy - h}
                Q ${x0 - 5 + w * 0.6} ${cy}, ${x0 - 5} ${cy + h}`}
            fill="none" stroke={stroke} strokeWidth={sw}/>
    </g>
  );
}

// Returns the in/out pin coordinates for a gate centred at (cx, cy).
function gatePins(cx, cy, w = 22) {
  const pinDy = w * 0.45;
  return {
    inA: { x: cx - w, y: cy - pinDy },
    inB: { x: cx - w, y: cy + pinDy },
    // XOR back stripe sits at x = cx - w - 5; nudge actual wire pin
    out: { x: cx + w, y: cy },
  };
}

// ─── Shared layout for Beats 3 + 4 ───────────────────────────────────────
// Returns absolute positions for gates, inputs, outputs, and pre-computed
// wire endpoints so wire rendering stays a pure lookup.
function gateGeometry(portrait) {
  const G = portrait
    // Portrait flows top-to-bottom: inputs at top, XOR1 + AND1 in mid-upper,
    // XOR2 + AND2 in mid-lower, OR at the bottom, outputs on the right.
    // Cin enters from the bottom of the input column so its trunk doesn't
    // have to cross the entire diagram.
    ? { vbW: 600, vbH: 760,
        leftX: 60, gate1X: 220, gate2X: 400, orX: 520, rightX: 560,
        yA: 90, yB: 180, yCin: 290,
        yXor1: 140, yAnd1: 270,
        yXor2: 420, yAnd2: 550,
        yOr: 640,
        ySum: 400, yCout: 640,
        captionY: 740, fontIo: 16 }
    : { vbW: 1180, vbH: 460,
        leftX: 80, gate1X: 300, gate2X: 580, orX: 800, rightX: 960,
        yA: 80, yB: 160, yCin: 380,
        yXor1: 140, yAnd1: 350,
        yXor2: 220, yAnd2: 320,
        yOr: 280,
        ySum: 200, yCout: 300,
        captionY: 440, fontIo: 16 };
  return G;
}

// Compute wire-active state for the given inputs.
// Returns a bag of booleans for every "wire of interest" — used to colour
// wires in both Beat 3 (statically all-off) and Beat 4 (live).
function wireStates(a, b, c) {
  const aXorB = a ^ b;
  const aAndB = a & b;
  const cAndAxorB = c & aXorB;
  const sum = aXorB ^ c;
  const cout = aAndB | cAndAxorB;
  return { a, b, c, aXorB, aAndB, cAndAxorB, sum, cout };
}

// ─── Beat 2: Truth table ─────────────────────────────────────────────────
function TruthTableBeat() {
  const portrait = usePortrait();
  // Compact table — header + 8 rows. Portrait stacks tightly.
  const cellW = portrait ? 56 : 72;
  const cellH = portrait ? 30 : 34;
  const cols = ['A', 'B', 'Cin', 'Sum', 'Cout'];
  const colorAccent = (i) => i < 3 ? 'var(--chalk-200)' : 'var(--amber-300)';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.4} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        truth table — 3 inputs, 2 outputs
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={12}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols.length}, ${cellW}px)`,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
          color: 'var(--chalk-200)', textAlign: 'center',
          borderBottom: '1px solid rgba(232,220,193,0.18)',
          paddingBottom: 6,
        }}>
        {cols.map((c, i) => (
          <div key={c}
               style={{ color: colorAccent(i),
                        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                        fontSize: portrait ? 17 : 20 }}>
            {c}
          </div>
        ))}
      </FadeUp>

      <FadeUp duration={0.6} delay={0.7} distance={14}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols.length}, ${cellW}px)`,
          gridAutoRows: `${cellH}px`,
          alignItems: 'center', justifyItems: 'center',
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 17 : 19,
          color: 'var(--chalk-100)',
          rowGap: 2,
        }}>
        {ROWS.map((r, i) => (
          <React.Fragment key={i}>
            <div>{r.a}</div>
            <div>{r.b}</div>
            <div>{r.c}</div>
            <div style={{ color: r.sum ? 'var(--amber-300)' : 'var(--chalk-300)' }}>{r.sum}</div>
            <div style={{ color: r.cout ? 'var(--rose-300)' : 'var(--chalk-300)' }}>{r.cout}</div>
          </React.Fragment>
        ))}
      </FadeUp>

      <FadeUp duration={0.5} delay={5.5} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          textAlign: 'center', maxWidth: portrait ? '28ch' : '52ch',
          lineHeight: 1.45, marginTop: 4,
        }}>
          the sum bit toggles often, the carry only when at least two inputs are 1
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Gate-level circuit ──────────────────────────────────────────
// Same diagram as Beat 4 but with all wires drawn neutrally — no input
// signals applied, just the topology.
function GatesBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FullAdderDiagram portrait={portrait} a={0} b={0} c={0} live={false}/>
      {/* Formula caption — only appears on Beat 3, fades out at end of sprite */}
      <FormulaCard portrait={portrait}/>
    </div>
  );
}

function FormulaCard({ portrait }) {
  return (
    <div style={{
      position: 'absolute',
      left: '50%',
      bottom: portrait ? -250 : -120,
      transform: 'translateX(-50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <FadeUp duration={0.5} delay={5.0} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--amber-300)',
        }}>
        Sum = A ⊕ B ⊕ Cin
      </FadeUp>
      <FadeUp duration={0.5} delay={5.5} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 17 : 20, color: 'var(--amber-300)',
        }}>
        Cout = A·B + Cin·(A ⊕ B)
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Walk every input combination — genuine motion ───────────────
function WalkBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();
  const SETUP = 0.2;
  // Spend the whole beat walking the 8 rows exactly once. DT shrinks to
  // fit when the audio-aligned beat window is shorter than the placeholder
  // duration; a 0.5 s floor keeps each row legible.
  const DT = Math.max(0.5, (spriteDur - SETUP - 0.3) / ROWS.length);
  const idx = Math.max(0, Math.floor((localTime - SETUP) / DT));
  const row = ROWS[idx % ROWS.length];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FullAdderDiagram portrait={portrait}
                        a={row.a} b={row.b} c={row.c}
                        live={true} highlightIdx={idx % ROWS.length}/>
    </div>
  );
}

// ─── The diagram itself — shared between Beat 3 and Beat 4 ───────────────
function FullAdderDiagram({ portrait, a, b, c, live, highlightIdx = -1 }) {
  const G = gateGeometry(portrait);
  const w = wireStates(a, b, c);

  const W_OFF = 'var(--chalk-300)';
  const W_ON = 'var(--amber-300)';
  const wireColor = (bit) => (live && bit ? W_ON : W_OFF);
  const wireOpacity = (bit) => (live ? (bit ? 1 : 0.45) : 0.75);

  // Pin positions for each gate.
  const xorW = 24;
  const andW = 22;
  const orW = 22;
  const xor1 = gatePins(G.gate1X, G.yXor1, xorW);
  const xor2 = gatePins(G.gate2X, G.yXor2, xorW);
  const and1 = gatePins(G.gate1X, G.yAnd1, andW);
  const and2 = gatePins(G.gate2X, G.yAnd2, andW);
  const or1  = gatePins(G.orX,    G.yOr,   orW);

  // Wire drawing helper — accepts a list of (x, y) waypoints.
  function wire(pts, bit, key) {
    const d = pts.map((p, i) => (i === 0 ? 'M' : 'L') + ` ${p.x} ${p.y}`).join(' ');
    return (
      <path key={key} d={d} fill="none"
            stroke={wireColor(bit)}
            strokeWidth={live && bit ? 2.4 : 1.6}
            opacity={wireOpacity(bit)}
            strokeLinecap="round" strokeLinejoin="round"/>
    );
  }

  // Compute branch-points where one input fans out to two gates.
  // A goes from leftX → branches at branchA (a vertical drop into AND1).
  const branchA = { x: G.gate1X - 60, y: G.yA };
  const branchB = { x: G.gate1X - 50, y: G.yB };
  // Cin goes far to the right, then branches into XOR2 and AND2.
  const branchCin1 = { x: G.gate2X - 60, y: G.yCin };
  // X1 (output of XOR1) fans into XOR2.inB and AND2.inA.
  const branchX1 = { x: G.gate1X + xorW + 30, y: G.yXor1 };

  // Width of bit-state badges drawn at the LEFT (inputs) and RIGHT (outputs).
  const badgeR = 14;

  return (
    <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
         style={{ overflow: 'visible' }}>

      {/* Input labels + bit badges */}
      {[
        { label: 'A',   y: G.yA,   bit: a, color: 'var(--chalk-100)' },
        { label: 'B',   y: G.yB,   bit: b, color: 'var(--chalk-100)' },
        { label: 'Cin', y: G.yCin, bit: c, color: 'var(--chalk-100)' },
      ].map((io, i) => (
        <SvgFadeIn key={io.label} duration={0.3} delay={live ? 0 : 0.2 + i * 0.1}>
          <text x={G.leftX - 12} y={io.y + 5} textAnchor="end"
                fill={io.color} fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontIo}>
            {io.label === 'Cin'
              ? <>C<tspan baselineShift="sub" fontSize={11}>in</tspan></>
              : io.label}
          </text>
          {/* bit badge */}
          <circle cx={G.leftX + 6} cy={io.y} r={badgeR}
                  fill={live && io.bit ? 'var(--amber-300)' : 'none'}
                  stroke={live && io.bit ? 'var(--amber-400)' : 'var(--chalk-300)'}
                  strokeWidth={1.4}/>
          <text x={G.leftX + 6} y={io.y + 5} textAnchor="middle"
                fill={live && io.bit ? 'var(--bg-canvas)' : 'var(--chalk-200)'}
                fontFamily="var(--font-mono)" fontSize={13}>{io.bit}</text>
        </SvgFadeIn>
      ))}

      {/* INPUT WIRES — A: leftX → branchA → into XOR1.inA + drop into AND1.inA */}
      {wire([{ x: G.leftX + 20, y: G.yA },
             { x: branchA.x,    y: G.yA },
             { x: xor1.inA.x,   y: xor1.inA.y === G.yA ? G.yA : xor1.inA.y }], a, 'wireA-xor1-top')}
      {/* A bottom segment from branchA down to AND1.inA */}
      {wire([{ x: branchA.x,  y: G.yA },
             { x: branchA.x,  y: and1.inA.y },
             { x: and1.inA.x, y: and1.inA.y }], a, 'wireA-and1')}
      {/* From branchA actually we need A to enter XOR1 at its top pin. */}
      {wire([{ x: branchA.x,   y: G.yA },
             { x: xor1.inA.x,  y: xor1.inA.y }], a, 'wireA-xor1')}

      {/* B: leftX → branchB → XOR1.inB + drop into AND1.inB */}
      {wire([{ x: G.leftX + 20, y: G.yB },
             { x: branchB.x,    y: G.yB }], b, 'wireB-trunk')}
      {wire([{ x: branchB.x,   y: G.yB },
             { x: xor1.inB.x,  y: xor1.inB.y }], b, 'wireB-xor1')}
      {wire([{ x: branchB.x,  y: G.yB },
             { x: branchB.x,  y: and1.inB.y },
             { x: and1.inB.x, y: and1.inB.y }], b, 'wireB-and1')}

      {/* Cin: leftX → branchCin1 → XOR2.inA + AND2.inA. Cin runs along
          the BOTTOM of the canvas to avoid crossing through other wires. */}
      {wire([{ x: G.leftX + 20,  y: G.yCin },
             { x: branchCin1.x,  y: G.yCin }], c, 'wireC-trunk')}
      {wire([{ x: branchCin1.x, y: G.yCin },
             { x: branchCin1.x, y: xor2.inB.y },
             { x: xor2.inB.x,   y: xor2.inB.y }], c, 'wireC-xor2')}
      {wire([{ x: branchCin1.x, y: G.yCin },
             { x: branchCin1.x, y: and2.inB.y },
             { x: and2.inB.x,   y: and2.inB.y }], c, 'wireC-and2')}

      {/* X1 = A XOR B: XOR1.out → branchX1 → XOR2.inA + AND2.inA */}
      {wire([{ x: xor1.out.x,  y: xor1.out.y },
             { x: branchX1.x,  y: xor1.out.y }], w.aXorB, 'wireX1-trunk')}
      {wire([{ x: branchX1.x,  y: xor1.out.y },
             { x: branchX1.x,  y: xor2.inA.y },
             { x: xor2.inA.x,  y: xor2.inA.y }], w.aXorB, 'wireX1-xor2')}
      {wire([{ x: branchX1.x,  y: xor1.out.y },
             { x: branchX1.x,  y: and2.inA.y },
             { x: and2.inA.x,  y: and2.inA.y }], w.aXorB, 'wireX1-and2')}

      {/* AND1.out → OR.inA */}
      {wire([{ x: and1.out.x, y: and1.out.y },
             { x: or1.inA.x - 30, y: and1.out.y },
             { x: or1.inA.x - 30, y: or1.inA.y },
             { x: or1.inA.x, y: or1.inA.y }], w.aAndB, 'wireAnd1-or')}

      {/* AND2.out → OR.inB */}
      {wire([{ x: and2.out.x, y: and2.out.y },
             { x: or1.inB.x - 12, y: and2.out.y },
             { x: or1.inB.x - 12, y: or1.inB.y },
             { x: or1.inB.x, y: or1.inB.y }], w.cAndAxorB, 'wireAnd2-or')}

      {/* XOR2.out → Sum */}
      {wire([{ x: xor2.out.x, y: xor2.out.y },
             { x: G.rightX,   y: xor2.out.y },
             { x: G.rightX,   y: G.ySum },
             { x: G.rightX + 20, y: G.ySum }], w.sum, 'wireSum')}

      {/* OR.out → Cout */}
      {wire([{ x: or1.out.x,  y: or1.out.y },
             { x: G.rightX,   y: or1.out.y },
             { x: G.rightX,   y: G.yCout },
             { x: G.rightX + 20, y: G.yCout }], w.cout, 'wireCout')}

      {/* Gates */}
      <XorGate cx={G.gate1X} cy={G.yXor1} w={xorW} active={live && w.aXorB === 1}/>
      <AndGate cx={G.gate1X} cy={G.yAnd1} w={andW} active={live && w.aAndB === 1}/>
      <XorGate cx={G.gate2X} cy={G.yXor2} w={xorW} active={live && w.sum === 1}/>
      <AndGate cx={G.gate2X} cy={G.yAnd2} w={andW} active={live && w.cAndAxorB === 1}/>
      <OrGate  cx={G.orX}    cy={G.yOr}   w={orW}  active={live && w.cout === 1}/>

      {/* Gate labels */}
      <SvgFadeIn duration={0.3} delay={live ? 0 : 1.5}>
        <text x={G.gate1X} y={G.yXor1 + xorW + 18} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={10} letterSpacing="0.12em">XOR</text>
        <text x={G.gate1X} y={G.yAnd1 + andW + 18} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={10} letterSpacing="0.12em">AND</text>
        <text x={G.gate2X} y={G.yXor2 + xorW + 18} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={10} letterSpacing="0.12em">XOR</text>
        <text x={G.gate2X} y={G.yAnd2 + andW + 18} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={10} letterSpacing="0.12em">AND</text>
        <text x={G.orX} y={G.yOr + orW + 18} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={10} letterSpacing="0.12em">OR</text>
      </SvgFadeIn>

      {/* Output labels + bit badges */}
      {[
        { label: 'Sum',  y: G.ySum,  bit: w.sum,  color: 'var(--amber-300)' },
        { label: 'Cout', y: G.yCout, bit: w.cout, color: 'var(--rose-300)'  },
      ].map((io) => (
        <g key={io.label}>
          <text x={G.rightX + 50} y={io.y + 5}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontIo}>
            {io.label === 'Cout'
              ? <>C<tspan baselineShift="sub" fontSize={11}>out</tspan></>
              : io.label}
          </text>
          {/* output bit badge */}
          <circle cx={G.rightX + 30} cy={io.y} r={badgeR}
                  fill={live && io.bit ? io.color : 'none'}
                  stroke={live && io.bit ? io.color : 'var(--chalk-300)'}
                  strokeWidth={1.4}/>
          <text x={G.rightX + 30} y={io.y + 5} textAnchor="middle"
                fill={live && io.bit ? 'var(--bg-canvas)' : 'var(--chalk-200)'}
                fontFamily="var(--font-mono)" fontSize={13}>{io.bit}</text>
        </g>
      ))}

      {/* In Beat 4, a small truth-table mini-panel up top — the active row glows. */}
      {live && (
        <SvgFadeIn duration={0.3} delay={0}>
          <text x={G.vbW / 2} y={portrait ? G.vbH - 30 : G.captionY - 30}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">
            row {highlightIdx + 1} / 8   ·   A B Cin → Sum Cout
            &nbsp;&nbsp;{a}{b}{c} → {w.sum}{w.cout}
          </text>
        </SvgFadeIn>
      )}
    </svg>
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
        One cell — the building block of every n-bit adder.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        chain four → 4-bit ripple-carry adder
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '28ch' : '50ch', lineHeight: 1.45,
        }}>
        the slowest path is one full-adder delay per bit — that's the cost of simplicity.
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
