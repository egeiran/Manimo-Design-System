// Full-Wave Bridge Rectifier: Both Halves of the Wave — Manimo lesson scene.
// Four diodes in a diamond bridge — AC source on the left, load on the
// right. Genuine animation runs in Beats 3 and 4: in Beat 3 the conducting
// pair flips every half-period (D1+D4 on the positive half, D2+D3 on the
// negative), with charge dots tracing the active loop and the load arrow
// pointing the same way through both. Beat 4 traces V_in (full sinusoid)
// and V_out (|sin|) under a moving time cursor.
//
// Beats (timed to single-track narration in motion/ade/audio/full-wave-bridge-rectifier/):
//    0.00– 7.00  Manimo intro: keep both halves of the wave
//    7.00–16.71  Circuit setup: AC source + bridge + load + labels
//   16.71–30.34  Half-cycle alternation: diodes light up in turn, dots flow,
//                 load current never reverses
//   30.34–39.72  Waveform reveal: V_in vs V_out scope traces with time cursor
//   39.72–47.00  Takeaway: every half-cycle counts
//
// Bridge topology (diamond layout):
//   W (left)  = AC1  — wires to top terminal of AC source
//   N (top)   = +    — wires right to top of load
//   E (right) = AC2  — wires (under the bridge) to bottom terminal of AC source
//   S (bottom)= −    — wires right to bottom of load
//
//   Diodes (anode→cathode):
//     D1 = W→N (top-left edge)     conducts when V(W) > V(N), i.e. positive half
//     D2 = E→N (top-right edge)    conducts when V(E) > V(N), i.e. negative half
//     D3 = S→W (bottom-left edge)  conducts on positive half (paired with D1 — wait, see below)
//     D4 = S→E (bottom-right edge) conducts on positive half
//
//   Correction — standard pairing for positive half (V(W) > V(E)):
//     D1 (W→N) conducts (W positive)  ←
//     D4 (S→E) conducts (current returns through S to E)  ←
//     D2, D3 blocked
//   And for negative half (V(E) > V(W)):
//     D2 (E→N) conducts  ←
//     D3 (S→W) conducts  ←
//     D1, D4 blocked

const SCENE_DURATION = 47;

const NARRATION = [
  /*  0.00– 7.00 */ "A half wave rectifier throws away half the input. Can we keep both halves and still get a one sided output?",
  /*  7.00–16.71 */ "Four diodes wired as a bridge. An AC source on one diagonal, a load on the other. Two diodes will conduct on the positive half, two on the negative.",
  /* 16.71–30.34 */ "On the positive half, D one and D four conduct. Current flows out the top, through the load, back through the bottom. On the negative half, D two and D three take over — but the current through the load still flows top to bottom.",
  /* 30.34–39.72 */ "Watch V in trace as a full sinusoid, and V out as the absolute value — every dip flipped above the line, so the ripple frequency is doubled.",
  /* 39.72–47.00 */ "Both halves of the wave do useful work — that's why every wall wart and laptop charger starts with a bridge.",
];

const NARRATION_AUDIO = 'audio/full-wave-bridge-rectifier/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="diodes"
      title="Full-Wave Bridge Rectifier: Both Halves of the Wave"
      duration={SCENE_DURATION}
      introEnd={7}
      introCaption="Half the wave goes to waste — can we keep all of it?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7} end={16.71}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={16.71} end={30.34}>
        <HalfCyclesBeat />
      </Sprite>

      <Sprite start={30.34} end={39.72}>
        <WaveformBeat />
      </Sprite>

      <Sprite start={39.72} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared bridge geometry ─────────────────────────────────────────────
function bridgeGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 620, vbH: 540,
      acX: 70, acY: 270, acR: 22,
      W: { x: 200, y: 270 }, N: { x: 320, y: 160 },
      E: { x: 440, y: 270 }, S: { x: 320, y: 380 },
      loadX: 560, loadTopY: 160, loadBotY: 380, loadAmp: 12,
      diodeSize: 12,
      acWireTopY: 70, acWireBotY: 470,
      labelFont: 14, badgeFont: 13, captionY: 510,
    };
  }
  return {
    vbW: 940, vbH: 460,
    acX: 110, acY: 230, acR: 30,
    W: { x: 340, y: 230 }, N: { x: 450, y: 110 },
    E: { x: 560, y: 230 }, S: { x: 450, y: 350 },
    loadX: 770, loadTopY: 110, loadBotY: 350, loadAmp: 14,
    diodeSize: 14,
    acWireTopY: 70, acWireBotY: 400,
    labelFont: 16, badgeFont: 13, captionY: 432,
  };
}

// AC source symbol — circle with a sine inside.
function ACSource({ cx, cy, r = 30, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r}
              fill="none" stroke={color} strokeWidth={2}/>
      <path d={`M ${cx - r * 0.55} ${cy}
                Q ${cx - r * 0.28} ${cy - r * 0.6}, ${cx} ${cy}
                T ${cx + r * 0.55} ${cy}`}
            fill="none" stroke={color} strokeWidth={2}/>
    </g>
  );
}

// Vertical zigzag resistor between (cx, y0) and (cx, y1).
function loadResistor(cx, y0, y1, amp = 12, n = 8) {
  const dy = (y1 - y0) / n;
  const pts = [`M ${cx} ${y0}`];
  for (let i = 1; i < n; i++) {
    const y = y0 + i * dy;
    const x = cx + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${y1}`);
  return pts.join(' ');
}

// A diode drawn along an arbitrary edge (a → b). The triangle points
// from anode (a) to cathode (b) — `b` is the bar end. `size` is the
// half-width of the triangle. The diode sits centred on the edge.
function EdgeDiode({ a, b, size = 14, color = 'var(--amber-400)', opacity = 1 }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / L, uy = dy / L;          // unit vector a→b
  const px = -uy, py = ux;                  // perpendicular
  const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;

  // Triangle: base at (cx − ux*size, cy − uy*size), apex at (cx + ux*size, cy + uy*size).
  const apexX = cx + ux * size, apexY = cy + uy * size;
  const baseAx = cx - ux * size + px * size * 0.85;
  const baseAy = cy - uy * size + py * size * 0.85;
  const baseBx = cx - ux * size - px * size * 0.85;
  const baseBy = cy - uy * size - py * size * 0.85;
  // Cathode bar perpendicular to the edge, sitting at the apex.
  const barL = size * 0.95;
  const bar0x = apexX + px * barL, bar0y = apexY + py * barL;
  const bar1x = apexX - px * barL, bar1y = apexY - py * barL;

  return (
    <g opacity={opacity}>
      <polygon points={`${apexX},${apexY} ${baseAx},${baseAy} ${baseBx},${baseBy}`}
               fill={color} stroke={color} strokeWidth={1.5}/>
      <line x1={bar0x} y1={bar0y} x2={bar1x} y2={bar1y}
            stroke={color} strokeWidth={2.6}/>
    </g>
  );
}

// Wire from AC source top terminal to W (over the top).
function acTopWire(G) {
  return `M ${G.acX} ${G.acY - G.acR}
          L ${G.acX} ${G.acWireTopY}
          L ${G.W.x} ${G.acWireTopY}
          L ${G.W.x} ${G.W.y}`;
}

// Wire from AC source bottom terminal to E (under the bridge).
function acBotWire(G) {
  return `M ${G.acX} ${G.acY + G.acR}
          L ${G.acX} ${G.acWireBotY}
          L ${G.E.x} ${G.acWireBotY}
          L ${G.E.x} ${G.E.y}`;
}

// Wire from N to top of load.
function loadTopWire(G) {
  return `M ${G.N.x} ${G.N.y} L ${G.loadX} ${G.loadTopY}`;
}

// Wire from S to bottom of load.
function loadBotWire(G) {
  return `M ${G.S.x} ${G.S.y} L ${G.loadX} ${G.loadBotY}`;
}

// ─── Static bridge sub-element renderer (used by all content beats) ──────
// `active` is null (all amber, normal) or { D1, D2, D3, D4 } booleans for
// which diodes are currently conducting (true = lit, false = dimmed).
function BridgeFigure({ G, active = null }) {
  const isLit = id => active ? active[id] : true;
  const litOp = 1, dimOp = 0.28;
  return (
    <g>
      {/* AC source */}
      <ACSource cx={G.acX} cy={G.acY} r={G.acR}/>

      {/* Wires */}
      <path d={acTopWire(G)} fill="none"
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <path d={acBotWire(G)} fill="none"
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <path d={loadTopWire(G)} fill="none"
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <path d={loadBotWire(G)} fill="none"
            stroke="var(--chalk-200)" strokeWidth={2}/>

      {/* Bridge perimeter wires (4 short segments — the edges between nodes,
         drawn behind the diodes so the diode sits "on" the wire). The diodes
         physically replace the wire in real schematics, but for visual
         clarity we draw a thin connector behind each diode position. */}
      <line x1={G.W.x} y1={G.W.y} x2={G.N.x} y2={G.N.y}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
      <line x1={G.E.x} y1={G.E.y} x2={G.N.x} y2={G.N.y}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
      <line x1={G.S.x} y1={G.S.y} x2={G.W.x} y2={G.W.y}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
      <line x1={G.S.x} y1={G.S.y} x2={G.E.x} y2={G.E.y}
            stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>

      {/* Load resistor */}
      <path d={loadResistor(G.loadX, G.loadTopY, G.loadBotY, G.loadAmp, 8)}
            fill="none" stroke="var(--amber-400)" strokeWidth={2.4}
            strokeLinecap="round" strokeLinejoin="round"/>

      {/* Four diodes */}
      <EdgeDiode a={G.W} b={G.N} size={G.diodeSize}
                 color="var(--amber-400)"
                 opacity={isLit('D1') ? litOp : dimOp}/>
      <EdgeDiode a={G.E} b={G.N} size={G.diodeSize}
                 color="var(--amber-400)"
                 opacity={isLit('D2') ? litOp : dimOp}/>
      <EdgeDiode a={G.S} b={G.W} size={G.diodeSize}
                 color="var(--amber-400)"
                 opacity={isLit('D3') ? litOp : dimOp}/>
      <EdgeDiode a={G.S} b={G.E} size={G.diodeSize}
                 color="var(--amber-400)"
                 opacity={isLit('D4') ? litOp : dimOp}/>

      {/* Node labels — outside the diamond */}
      <text x={G.W.x - 18} y={G.W.y + 5} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.08em">AC1</text>
      <text x={G.E.x + 18} y={G.E.y + 5}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.08em">AC2</text>
      <text x={G.N.x} y={G.N.y - 16} textAnchor="middle"
            fill="var(--amber-300)" fontFamily="var(--font-mono)"
            fontSize={12} letterSpacing="0.1em">+</text>
      <text x={G.S.x} y={G.S.y + 22} textAnchor="middle"
            fill="var(--rose-300)" fontFamily="var(--font-mono)"
            fontSize={12} letterSpacing="0.1em">−</text>

      {/* Diode labels — slightly offset from each diode mid-edge */}
      <DiodeLabel id="D1" a={G.W} b={G.N} fontSize={G.labelFont} offsetSign={-1}/>
      <DiodeLabel id="D2" a={G.E} b={G.N} fontSize={G.labelFont} offsetSign={1}/>
      <DiodeLabel id="D3" a={G.S} b={G.W} fontSize={G.labelFont} offsetSign={-1}/>
      <DiodeLabel id="D4" a={G.S} b={G.E} fontSize={G.labelFont} offsetSign={1}/>
    </g>
  );
}

function DiodeLabel({ id, a, b, fontSize, offsetSign = 1 }) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const L = Math.sqrt(dx * dx + dy * dy);
  const px = (-dy / L) * 22 * offsetSign;
  const py = (dx / L) * 22 * offsetSign;
  const cx = (a.x + b.x) / 2 + px;
  const cy = (a.y + b.y) / 2 + py;
  return (
    <text x={cx} y={cy + 4} textAnchor="middle"
          fill="var(--chalk-200)" fontFamily="var(--font-serif)"
          fontStyle="italic" fontSize={fontSize}>{id}</text>
  );
}

// ─── Beat 2: Circuit setup ──────────────────────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const G = bridgeGeometry(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0.0}>
          <ACSource cx={G.acX} cy={G.acY} r={G.acR}/>
        </SvgFadeIn>

        {/* Bridge diodes — fade in together */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <EdgeDiode a={G.W} b={G.N} size={G.diodeSize}
                     color="var(--amber-400)"/>
          <EdgeDiode a={G.E} b={G.N} size={G.diodeSize}
                     color="var(--amber-400)"/>
          <EdgeDiode a={G.S} b={G.W} size={G.diodeSize}
                     color="var(--amber-400)"/>
          <EdgeDiode a={G.S} b={G.E} size={G.diodeSize}
                     color="var(--amber-400)"/>
          {/* Faint perimeter connectors */}
          <line x1={G.W.x} y1={G.W.y} x2={G.N.x} y2={G.N.y}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
          <line x1={G.E.x} y1={G.E.y} x2={G.N.x} y2={G.N.y}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
          <line x1={G.S.x} y1={G.S.y} x2={G.W.x} y2={G.W.y}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
          <line x1={G.S.x} y1={G.S.y} x2={G.E.x} y2={G.E.y}
                stroke="var(--chalk-200)" strokeWidth={1.4} opacity={0.4}/>
        </SvgFadeIn>

        {/* AC wires trace in */}
        <TraceIn d={acTopWire(G)}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.7} delay={1.2}/>
        <TraceIn d={acBotWire(G)}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.7} delay={1.2}/>

        {/* Load wires trace in */}
        <TraceIn d={loadTopWire(G)}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={1.6}/>
        <TraceIn d={loadBotWire(G)}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={1.6}/>

        {/* Load resistor */}
        <TraceIn d={loadResistor(G.loadX, G.loadTopY, G.loadBotY, G.loadAmp, 8)}
                 stroke="var(--amber-400)" strokeWidth={2.4}
                 duration={0.7} delay={2.0}/>

        {/* Labels */}
        <SvgFadeIn duration={0.35} delay={2.6}>
          <DiodeLabel id="D1" a={G.W} b={G.N} fontSize={G.labelFont} offsetSign={-1}/>
          <DiodeLabel id="D2" a={G.E} b={G.N} fontSize={G.labelFont} offsetSign={1}/>
          <DiodeLabel id="D3" a={G.S} b={G.W} fontSize={G.labelFont} offsetSign={-1}/>
          <DiodeLabel id="D4" a={G.S} b={G.E} fontSize={G.labelFont} offsetSign={1}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.35} delay={3.0}>
          <text x={G.W.x - 18} y={G.W.y + 5} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">AC1</text>
          <text x={G.E.x + 18} y={G.E.y + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">AC2</text>
          <text x={G.N.x + 18} y={G.N.y - 4}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">+</text>
          <text x={G.S.x + 18} y={G.S.y + 14}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.1em">−</text>
          <text x={G.loadX + 22} y={(G.loadTopY + G.loadBotY) / 2 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.labelFont + 2}>R<tspan baselineShift="sub" fontSize={G.labelFont * 0.65}>L</tspan></text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            four diodes, one AC source, one load
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Half-cycles alternating (genuine motion) ────────────────────
function HalfCyclesBeat() {
  const portrait = usePortrait();
  const G = bridgeGeometry(portrait);
  const { localTime } = useSprite();

  // Hold before alternation begins.
  const HOLD = 1.2;
  const t = Math.max(0, localTime - HOLD);

  // Period of one full AC cycle in beat-time. We show ~2.5 cycles over the
  // ~13.8s of motion budget so each cycle is ~5.5s; pleasing rhythm.
  const period = 5.4;
  const phase = (t / period) % 1;          // 0..1
  const positive = phase < 0.5;            // first half = positive, second = negative

  const active = positive
    ? { D1: true, D2: false, D3: false, D4: true }
    : { D1: false, D2: true, D3: true, D4: false };

  // Current-dot animation along the conducting path.
  // Path consists of segments — flatten into a polyline and walk along it.
  // Positive half loop: AC source top → W → N → load_top → load_bot → S → E → AC source bot → (source loops back, hidden).
  // Negative half loop: AC source bot → E → N → load_top → load_bot → S → W → AC source top.
  function positivePath() {
    return [
      { x: G.acX, y: G.acY - G.acR },
      { x: G.acX, y: G.acWireTopY },
      { x: G.W.x, y: G.acWireTopY },
      { x: G.W.x, y: G.W.y },
      { x: G.N.x, y: G.N.y },
      { x: G.loadX, y: G.loadTopY },
      { x: G.loadX, y: G.loadBotY },
      { x: G.S.x, y: G.S.y },
      { x: G.E.x, y: G.E.y },
      { x: G.E.x, y: G.acWireBotY },
      { x: G.acX, y: G.acWireBotY },
      { x: G.acX, y: G.acY + G.acR },
    ];
  }
  function negativePath() {
    return [
      { x: G.acX, y: G.acY + G.acR },
      { x: G.acX, y: G.acWireBotY },
      { x: G.E.x, y: G.acWireBotY },
      { x: G.E.x, y: G.E.y },
      { x: G.N.x, y: G.N.y },
      { x: G.loadX, y: G.loadTopY },
      { x: G.loadX, y: G.loadBotY },
      { x: G.S.x, y: G.S.y },
      { x: G.W.x, y: G.W.y },
      { x: G.W.x, y: G.acWireTopY },
      { x: G.acX, y: G.acWireTopY },
      { x: G.acX, y: G.acY - G.acR },
    ];
  }

  const path = positive ? positivePath() : negativePath();
  // Cumulative arc lengths.
  let total = 0;
  const cum = [0];
  for (let i = 1; i < path.length; i++) {
    const dx = path[i].x - path[i - 1].x;
    const dy = path[i].y - path[i - 1].y;
    total += Math.sqrt(dx * dx + dy * dy);
    cum.push(total);
  }

  // Dots: 8 evenly-spaced, walking around the loop. Walking speed = loop
  // perimeter per `period/2` seconds, so they complete the active loop
  // exactly once per half-cycle.
  const halfT = period / 2;
  const phaseInHalf = (positive ? phase : phase - 0.5) * 2; // 0..1 within the active half
  const NUM_DOTS = 10;
  const dots = [];
  for (let i = 0; i < NUM_DOTS; i++) {
    const fr = ((i / NUM_DOTS) + phaseInHalf) % 1;
    const target = fr * total;
    // Find which segment.
    let seg = 0;
    while (seg + 1 < cum.length && cum[seg + 1] < target) seg++;
    const segStart = cum[seg];
    const segEnd = cum[seg + 1] || total;
    const segFr = (segEnd - segStart) > 0 ? (target - segStart) / (segEnd - segStart) : 0;
    const a = path[seg], b = path[seg + 1] || path[seg];
    const x = a.x + (b.x - a.x) * segFr;
    const y = a.y + (b.y - a.y) * segFr;
    dots.push({ x, y });
  }

  // Load arrow position — always inside the load, pointing down.
  const loadMidY = (G.loadTopY + G.loadBotY) / 2;
  const loadArrowX = G.loadX - 28;
  const loadArrowY = loadMidY;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Static bridge (diodes lit per half) */}
        <BridgeFigure G={G} active={active}/>

        {/* Half-state badge above the bridge */}
        <g>
          <text x={G.vbW / 2} y={G.acWireTopY - 16} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.badgeFont - 2} letterSpacing="0.16em">
            {localTime < HOLD ? '' : 'HALF-CYCLE'}
          </text>
          {localTime >= HOLD && (
            <text x={G.vbW / 2} y={G.acWireTopY - 2} textAnchor="middle"
                  fill={positive ? 'var(--amber-300)' : 'var(--rose-300)'}
                  fontFamily="var(--font-mono)" fontSize={G.badgeFont + 2}
                  fontWeight="bold" letterSpacing="0.12em">
              {positive ? 'POSITIVE' : 'NEGATIVE'}
            </text>
          )}
          {localTime >= HOLD && (
            <text x={G.vbW / 2} y={G.acWireTopY + 16} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={G.badgeFont - 2} letterSpacing="0.08em">
              {positive ? 'D1 + D4 conduct' : 'D2 + D3 conduct'}
            </text>
          )}
        </g>

        {/* Current dots along the active loop */}
        {localTime >= HOLD && dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={5}
                  fill="var(--rose-300)" opacity={0.92}/>
        ))}

        {/* Load arrow — always pointing down */}
        {localTime >= HOLD && (
          <g>
            <line x1={loadArrowX} y1={loadArrowY - 16}
                  x2={loadArrowX} y2={loadArrowY + 16}
                  stroke="var(--rose-300)" strokeWidth={2}/>
            <polygon
              points={`${loadArrowX},${loadArrowY + 22} ${loadArrowX - 5},${loadArrowY + 12} ${loadArrowX + 5},${loadArrowY + 12}`}
              fill="var(--rose-300)"/>
            <text x={loadArrowX - 18} y={loadArrowY + 6} textAnchor="end"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.12em">I↓</text>
          </g>
        )}

        {/* Caption — late */}
        {localTime > HOLD + 9.5 && (
          <SvgFadeIn duration={0.4} delay={0}>
            <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize={14} letterSpacing="0.02em">
              two diodes swap in, two swap out — load current never reverses
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: Waveform reveal — value-driven scope traces ────────────────
function WaveformBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Two stacked scope panels: V_in on top, V_out below. Each panel shows
  // the same time axis. A vertical cursor sweeps left→right over the beat
  // and the traces draw out behind it.
  const G = portrait
    ? { vbW: 600, vbH: 580, panelX: 60, panelW: 480,
        inY: 110, inH: 150, outY: 320, outH: 150,
        font: 14, labelFont: 12, captionY: 540 }
    : { vbW: 900, vbH: 440, panelX: 110, panelW: 680,
        inY: 60, inH: 130, outY: 230, outH: 130,
        font: 16, labelFont: 13, captionY: 410 };

  // Two full cycles across the panel width.
  const cycles = 2;
  const omegaT = (x) => ((x - G.panelX) / G.panelW) * 2 * Math.PI * cycles;
  const amp = G.inH * 0.42;
  const inMidY = G.inY + G.inH / 2;
  const outBaseY = G.outY + G.outH * 0.88;     // V_out sits low in its panel so positive humps fit

  // Cursor position: starts at left, finishes at right. Hold short tails
  // at each end so the curves get to settle.
  const HOLD = 0.4;
  const TAIL = 0.4;
  const sweepT = Math.max(0.1, spriteDur - HOLD - TAIL);
  const tProg = clamp((localTime - HOLD) / sweepT, 0, 1);
  const cursorX = G.panelX + G.panelW * tProg;

  // Sample paths up to the cursor.
  function vInPath() {
    const pts = [];
    const N = 200;
    for (let i = 0; i <= N; i++) {
      const x = G.panelX + (G.panelW * i) / N;
      if (x > cursorX) break;
      const y = inMidY - amp * Math.sin(omegaT(x));
      pts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
                       : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }
  function vOutPath() {
    const pts = [];
    const N = 200;
    const outAmp = G.outH * 0.78;             // taller because we only show positive part
    for (let i = 0; i <= N; i++) {
      const x = G.panelX + (G.panelW * i) / N;
      if (x > cursorX) break;
      const y = outBaseY - outAmp * Math.abs(Math.sin(omegaT(x)));
      pts.push(i === 0 ? `M ${x.toFixed(2)} ${y.toFixed(2)}`
                       : `L ${x.toFixed(2)} ${y.toFixed(2)}`);
    }
    return pts.join(' ');
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Panel frames */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          {/* V_in panel */}
          <line x1={G.panelX} y1={inMidY} x2={G.panelX + G.panelW} y2={inMidY}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          <line x1={G.panelX} y1={G.inY} x2={G.panelX} y2={G.inY + G.inH}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={G.panelX - 10} y={inMidY + 5} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.labelFont} letterSpacing="0.1em">0</text>
          <text x={G.panelX + 10} y={G.inY + 18}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>V<tspan baselineShift="sub" fontSize={G.font * 0.7}>in</tspan></text>

          {/* V_out panel */}
          <line x1={G.panelX} y1={outBaseY} x2={G.panelX + G.panelW} y2={outBaseY}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
          <line x1={G.panelX} y1={G.outY} x2={G.panelX} y2={G.outY + G.outH}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={G.panelX - 10} y={outBaseY + 5} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.labelFont} letterSpacing="0.1em">0</text>
          <text x={G.panelX + 10} y={G.outY + 18}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>V<tspan baselineShift="sub" fontSize={G.font * 0.7}>out</tspan></text>
        </SvgFadeIn>

        {/* Traces */}
        <path d={vInPath()} fill="none" stroke="var(--chalk-100)"
              strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
        <path d={vOutPath()} fill="none" stroke="var(--amber-300)"
              strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Time cursor */}
        <line x1={cursorX} y1={G.inY - 8} x2={cursorX} y2={G.outY + G.outH + 8}
              stroke="var(--rose-400)" strokeWidth={1.4}
              strokeDasharray="4 4" opacity={0.9}/>
        <circle cx={cursorX} cy={inMidY} r={4} fill="var(--rose-400)"/>
        <circle cx={cursorX} cy={outBaseY - amp} r={4} fill="var(--rose-400)"
                opacity={tProg > 0.02 ? 1 : 0}/>

        {/* Caption */}
        {localTime > 7 && (
          <SvgFadeIn duration={0.5} delay={0}>
            <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize={14} letterSpacing="0.02em">
              ripple frequency is doubled — half the smoothing capacitor needed
            </text>
          </SvgFadeIn>
        )}
      </svg>
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
        Every half-cycle counts.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
          textTransform: 'uppercase',
        }}>
        the front end of every AC-to-DC power supply
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
