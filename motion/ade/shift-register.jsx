// Shift Register: A Bit Marches One Step per Clock Edge — Manimo lesson scene.
// Four D flip-flops in series, all clocked together. On each rising edge,
// every cell samples its D pin — so a serial input walks across the chain
// one cell per clock pulse. Genuine motion lives in Beat 4 (Shifting): the
// register's four cells re-render on each tick, with a flash on every cell
// as it samples and the input bit slides in from the left.
//
// Beats (timed to single-track narration in motion/ade/audio/shift-register/):
//    0.00– 6.21  Manimo intro: a bit pushed in the front — what happens?
//    6.21–19.34  Structure: 4 FFs in series sharing a clock
//   19.34–27.26  Setup: CLK square wave, D_in pattern 1, 0, 1, 1
//   27.26–42.78  Shifting in action: bits march right on each rising edge
//   42.78–53.00  Takeaway: serial-in → parallel-out
//
// Authoring notes:
//   • CLK frequency and D_in pattern live as module-scope constants so the
//     setup beat and the shifting beat stay synchronised.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 4 advances `tick` (an integer 0..N) from useSprite() localTime
//     and re-derives the register contents from that — pure function, no
//     mutable state, so the cells stay deterministic between frames.

const SCENE_DURATION = 53;

const NARRATION = [
  /*  0.00– 6.21 */ "Chain four flip-flops together and clock them as one. What happens to a bit you push in the front?",
  /*  6.21–19.34 */ "Four D flip-flops are wired so each one's Q output drives the next one's D input. They all share the same clock line and the same data line is irrelevant — each stage just listens to the previous stage.",
  /* 19.34–27.26 */ "Set up a clock that toggles steadily, and a serial data input that we'll feed in: one, zero, one, one.",
  /* 27.26–42.78 */ "On each rising clock edge, every cell copies whatever its D pin sees. The new bit lands in FF zero, the old FF zero bit slides into FF one, and so on. After four clock pulses the whole word has marched across.",
  /* 42.78–53.00 */ "Read every Q at once and you've converted serial data into parallel — that's how every UART and serial bus turns wires into bytes.",
];

const NARRATION_AUDIO = 'audio/shift-register/scene.mp3';

// Shared signal definition: 4-bit pattern fed in serially, MSB first.
// Pattern is 1, 0, 1, 1 (binary 1011 = decimal 11). Cells start empty (–).
const SERIAL_INPUT = [1, 0, 1, 1];
const N_CELLS = 4;

function Scene() {
  return (
    <SceneChrome
      eyebrow="sequential logic"
      title="Shift Register: A Bit Marches One Step per Clock Edge"
      duration={SCENE_DURATION}
      introEnd={6.21}
      introCaption="Four flip-flops in a row — one shared clock."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.21} end={19.34}>
        <StructureBeat />
      </Sprite>

      <Sprite start={19.34} end={27.26}>
        <ClockPatternBeat />
      </Sprite>

      <Sprite start={27.26} end={42.78}>
        <ShiftingBeat />
      </Sprite>

      <Sprite start={42.78} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────
// Compute the register contents after `tick` rising edges. tick = 0 means
// "before any clock has fired" (all cells empty). Cells shown left-to-right
// as [FF0, FF1, FF2, FF3] — FF0 is the input stage, FF3 holds the oldest.
function registerAfter(tick) {
  // Start with N empty cells (-1 = empty).
  const cells = Array(N_CELLS).fill(-1);
  for (let t = 1; t <= tick; t++) {
    // Shift right by 1 (FF3 ← FF2 ← FF1 ← FF0 ← input)
    for (let i = N_CELLS - 1; i > 0; i--) cells[i] = cells[i - 1];
    cells[0] = (t - 1 < SERIAL_INPUT.length) ? SERIAL_INPUT[t - 1] : 0;
  }
  return cells;
}

function FFBlock({ x, y, w, h, label, qLabel, accent = false, glow = 0 }) {
  // Render a single D flip-flop block with D and CLK on the left and Q on
  // the right. Accent + glow let the parent flash the cell on a clock edge.
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h}
            rx={4}
            fill={glow > 0 ? `rgba(244,184,96,${0.10 * glow})` : 'none'}
            stroke={accent ? 'var(--amber-300)' : 'var(--chalk-200)'}
            strokeWidth={accent ? 2.4 : 2}/>
      {/* D input mark */}
      <text x={x + 8} y={y + h * 0.36}
            fill="var(--chalk-200)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.1em">D</text>
      {/* CLK input mark — small triangle (edge-triggered glyph) */}
      <polygon
        points={`${x + 4},${y + h * 0.74} ${x + 12},${y + h * 0.66} ${x + 12},${y + h * 0.82}`}
        fill="none" stroke="var(--chalk-200)" strokeWidth={1.4}/>
      {/* Q output mark */}
      <text x={x + w - 14} y={y + h * 0.36} textAnchor="end"
            fill="var(--amber-300)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.1em">Q</text>
      {/* Block label centred */}
      <text x={cx} y={cy + 6} textAnchor="middle"
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={13} letterSpacing="0.16em">{label}</text>
      {/* Optional Q label above */}
      {qLabel && (
        <text x={x + w + 8} y={y + h * 0.36 + 4}
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={11} letterSpacing="0.1em">{qLabel}</text>
      )}
    </g>
  );
}

// ─── Beat 2: Structure — 4 FFs in series sharing CLK ────────────────────
function StructureBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 560,
        cellW: 120, cellH: 80,
        startX: 30, rowY: 200, gap: 16,
        dInLabelX: 22, dInLabelY: 240,
        clkRailY: 360, clkLabelX: 22, clkLabelY: 364,
        qLabelsY: 460, captionY: 530, fontMain: 14 }
    : { vbW: 1100, vbH: 420,
        cellW: 180, cellH: 100,
        startX: 100, rowY: 130, gap: 32,
        dInLabelX: 20, dInLabelY: 180,
        clkRailY: 290, clkLabelX: 20, clkLabelY: 294,
        qLabelsY: 360, captionY: 400, fontMain: 14 };

  // Compute cell positions
  const cellPos = (i) => ({ x: G.startX + i * (G.cellW + G.gap), y: G.rowY });
  const lastCell = cellPos(N_CELLS - 1);
  const dInRightX = G.startX;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* D_in label and arrow into FF0 */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.dInLabelX} y={G.dInLabelY} textAnchor="start"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>D<tspan baselineShift="sub" fontSize={11}>in</tspan></text>
        </SvgFadeIn>

        {/* Four FF blocks, drawn left-to-right with cascading delays */}
        {Array.from({ length: N_CELLS }).map((_, i) => {
          const p = cellPos(i);
          return (
            <SvgFadeIn key={i} duration={0.35} delay={0.6 + i * 0.4}>
              <FFBlock x={p.x} y={p.y} w={G.cellW} h={G.cellH}
                       label={`FF${i}`} qLabel={null}/>
            </SvgFadeIn>
          );
        })}

        {/* Connecting wires: D_in → FF0.D, FF0.Q → FF1.D, …, FF3.Q exits */}
        <TraceIn d={`M ${G.dInLabelX + 26} ${G.rowY + G.cellH * 0.36 - 4} L ${dInRightX} ${G.rowY + G.cellH * 0.36 - 4}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={0.4}/>
        {Array.from({ length: N_CELLS - 1 }).map((_, i) => {
          const p1 = cellPos(i);
          const p2 = cellPos(i + 1);
          const y = p1.y + G.cellH * 0.36 - 4;
          return (
            <TraceIn key={i}
              d={`M ${p1.x + G.cellW} ${y} L ${p2.x} ${y}`}
              stroke="var(--chalk-200)" strokeWidth={2}
              duration={0.4} delay={1.4 + i * 0.4}/>
          );
        })}
        {/* FF3.Q out arrow */}
        <TraceIn d={`M ${lastCell.x + G.cellW} ${lastCell.y + G.cellH * 0.36 - 4} L ${lastCell.x + G.cellW + 40} ${lastCell.y + G.cellH * 0.36 - 4}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={2.6}/>

        {/* Shared CLK rail — single horizontal line under all cells */}
        <TraceIn d={`M ${G.clkLabelX + 50} ${G.clkRailY} L ${lastCell.x + G.cellW + 20} ${G.clkRailY}`}
                 stroke="var(--rose-400)" strokeWidth={2}
                 duration={0.7} delay={1.0}/>
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.clkLabelX} y={G.clkLabelY + 4}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.14em">CLK</text>
        </SvgFadeIn>
        {/* Tap from CLK rail up to each FF's CLK input */}
        {Array.from({ length: N_CELLS }).map((_, i) => {
          const p = cellPos(i);
          const x = p.x + 8;
          const y2 = p.y + G.cellH * 0.74;
          return (
            <TraceIn key={i}
              d={`M ${x} ${G.clkRailY} L ${x} ${y2 + 4}`}
              stroke="var(--rose-400)" strokeWidth={1.6}
              duration={0.3} delay={1.4 + i * 0.2}/>
          );
        })}

        {/* Q labels under each cell */}
        {Array.from({ length: N_CELLS }).map((_, i) => {
          const p = cellPos(i);
          return (
            <SvgFadeIn key={i} duration={0.35} delay={3.0 + i * 0.15}>
              <text x={p.x + G.cellW / 2} y={G.qLabelsY} textAnchor="middle"
                    fill="var(--amber-300)" fontFamily="var(--font-mono)"
                    fontSize={G.fontMain} letterSpacing="0.1em">
                {`Q${i}`}
              </text>
            </SvgFadeIn>
          );
        })}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            each Q feeds the next D — the cells trade contents
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Clock + data setup ─────────────────────────────────────────
function ClockPatternBeat() {
  const portrait = usePortrait();
  // Two stacked timing diagrams: CLK on top, D_in below. Rising edges at
  // t = 0.5, 1.5, 2.5, 3.5 (unit time); D_in valid before each edge.
  const G = portrait
    ? { vbW: 600, vbH: 600,
        gx: 80, clkY: 200, dinY: 380, gw: 460, rowH: 80,
        captionY: 540, fontMain: 14 }
    : { vbW: 1100, vbH: 420,
        gx: 200, clkY: 140, dinY: 290, gw: 700, rowH: 70,
        captionY: 400, fontMain: 14 };

  const NCYCLES = 4;
  const cycleW = G.gw / NCYCLES;
  const lowY = (y) => y;
  const highY = (y) => y - G.rowH;

  // Build CLK path: square wave (low first half, high second half).
  const clkPts = [`M ${G.gx} ${lowY(G.clkY)}`];
  for (let i = 0; i < NCYCLES; i++) {
    const x0 = G.gx + i * cycleW;
    const xMid = x0 + cycleW * 0.5;
    const xEnd = x0 + cycleW;
    clkPts.push(`L ${xMid} ${lowY(G.clkY)}`);
    clkPts.push(`L ${xMid} ${highY(G.clkY)}`);
    clkPts.push(`L ${xEnd} ${highY(G.clkY)}`);
    clkPts.push(`L ${xEnd} ${lowY(G.clkY)}`);
  }
  const clkD = clkPts.join(' ');

  // Build D_in path: rises before each clock edge, holds, falls a bit later.
  // SERIAL_INPUT = [1, 0, 1, 1]
  const dinPts = [`M ${G.gx} ${SERIAL_INPUT[0] ? highY(G.dinY) : lowY(G.dinY)}`];
  for (let i = 0; i < NCYCLES; i++) {
    const x0 = G.gx + i * cycleW;
    const xMid = x0 + cycleW * 0.5;  // clock edge happens here
    const xEnd = x0 + cycleW;
    const v = SERIAL_INPUT[i];
    const next = SERIAL_INPUT[i + 1] !== undefined ? SERIAL_INPUT[i + 1] : v;
    // Stay at v through the cycle (D_in is valid AT the edge).
    dinPts.push(`L ${xEnd - 8} ${v ? highY(G.dinY) : lowY(G.dinY)}`);
    if (next !== v) {
      dinPts.push(`L ${xEnd - 8} ${next ? highY(G.dinY) : lowY(G.dinY)}`);
    }
    dinPts.push(`L ${xEnd} ${next ? highY(G.dinY) : lowY(G.dinY)}`);
  }
  const dinD = dinPts.join(' ');

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* CLK row — label + baseline + trace */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.gx - 18} y={G.clkY - G.rowH / 2 + 5} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.14em">CLK</text>
        </SvgFadeIn>
        <TraceIn d={`M ${G.gx} ${lowY(G.clkY)} L ${G.gx + G.gw} ${lowY(G.clkY)}`}
          stroke="var(--chalk-300)" strokeWidth={1} duration={0.4} delay={0.2}/>
        <TraceIn d={clkD} stroke="var(--rose-400)" strokeWidth={2.2}
                 duration={1.2} delay={0.4}/>

        {/* Mark rising edges */}
        {Array.from({ length: NCYCLES }).map((_, i) => {
          const x = G.gx + (i + 0.5) * cycleW;
          return (
            <SvgFadeIn key={i} duration={0.3} delay={0.6 + i * 0.3}>
              <line x1={x} y1={lowY(G.clkY) + 8} x2={x} y2={highY(G.clkY) - 28}
                    stroke="var(--amber-300)" strokeWidth={1}
                    strokeDasharray="3 4" opacity={0.55}/>
              <text x={x} y={highY(G.clkY) - 34} textAnchor="middle"
                    fill="var(--amber-300)" fontFamily="var(--font-mono)"
                    fontSize={11} letterSpacing="0.1em">{`↑${i + 1}`}</text>
            </SvgFadeIn>
          );
        })}

        {/* D_in row */}
        <SvgFadeIn duration={0.4} delay={1.8}>
          <text x={G.gx - 18} y={G.dinY - G.rowH / 2 + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>D<tspan baselineShift="sub" fontSize={10}>in</tspan></text>
        </SvgFadeIn>
        <TraceIn d={`M ${G.gx} ${lowY(G.dinY)} L ${G.gx + G.gw} ${lowY(G.dinY)}`}
          stroke="var(--chalk-300)" strokeWidth={1} duration={0.4} delay={1.8}/>
        <TraceIn d={dinD} stroke="var(--amber-300)" strokeWidth={2.2}
                 duration={1.0} delay={2.0}/>

        {/* Bit values above D_in at each cycle midpoint */}
        {SERIAL_INPUT.map((v, i) => {
          const x = G.gx + (i + 0.5) * cycleW;
          return (
            <SvgFadeIn key={i} duration={0.35} delay={3.4 + i * 0.15}>
              <text x={x} y={highY(G.dinY) - 8} textAnchor="middle"
                    fill="var(--amber-300)" fontFamily="var(--font-mono)"
                    fontSize={16} letterSpacing="0.1em">{v}</text>
            </SvgFadeIn>
          );
        })}

        {/* Caption / readout */}
        <SvgFadeIn duration={0.4} delay={4.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={15} letterSpacing="0.16em">
            D_in pattern: 1, 0, 1, 1
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Shifting in action — genuine motion ────────────────────────
function ShiftingBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720,
        cellW: 110, cellH: 110, gap: 12,
        startX: 60, rowY: 320,
        dInLabelX: 50, dInBubbleX: 40, dInBubbleY: 370,
        tickReadoutY: 100, captionY: 660, fontCell: 36 }
    : { vbW: 1100, vbH: 460,
        cellW: 130, cellH: 130, gap: 24,
        startX: 220, rowY: 180,
        dInLabelX: 130, dInBubbleX: 90, dInBubbleY: 240,
        tickReadoutY: 60, captionY: 440, fontCell: 44 };

  // Tick budget — first ~1s is empty register, then 6 ticks at 1.7s each
  // (4 ticks fill the register, 2 more let it settle visible).
  const TICK_T0 = 1.4;
  const TICK_INTERVAL = 1.7;
  const N_TICKS = 6;
  const elapsed = Math.max(0, localTime - TICK_T0);
  const tickIdx = Math.min(N_TICKS, Math.floor(elapsed / TICK_INTERVAL));
  // Phase within the current tick (0..1).
  const tickPhase = Math.min(1, (elapsed - tickIdx * TICK_INTERVAL) / TICK_INTERVAL);

  const cells = registerAfter(tickIdx);
  const cellPos = (i) => ({ x: G.startX + i * (G.cellW + G.gap), y: G.rowY });

  // Glow strength on every cell — flashes right after a tick, decays
  // exponentially. Skip when tickIdx === 0 (no clock fired yet).
  const glow = tickIdx > 0 ? Math.max(0, 1 - tickPhase * 2.5) : 0;

  // Incoming bit "bubble" sliding in from the left into FF0 in the moments
  // before the next tick. Shows the *next* serial-input bit.
  const nextBit = (tickIdx < SERIAL_INPUT.length) ? SERIAL_INPUT[tickIdx] : null;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Tick readout — "Clock pulse 0/4" etc. */}
        <text x={G.vbW / 2} y={G.tickReadoutY} textAnchor="middle"
              fill="var(--rose-300)" fontFamily="var(--font-mono)"
              fontSize={portrait ? 15 : 17} letterSpacing="0.18em">
          {`CLOCK PULSE  ${Math.min(tickIdx, SERIAL_INPUT.length)} / ${SERIAL_INPUT.length}`}
        </text>

        {/* D_in label */}
        <text x={G.dInLabelX} y={G.rowY + G.cellH / 2 + 6} textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>
          D<tspan baselineShift="sub" fontSize={12}>in</tspan>
        </text>
        {/* Arrow into FF0 */}
        <path d={`M ${G.dInLabelX + 14} ${G.rowY + G.cellH / 2} L ${G.startX - 4} ${G.rowY + G.cellH / 2}`}
              stroke="var(--chalk-200)" strokeWidth={2}/>

        {/* Incoming bit bubble — drifts from left towards FF0's LEFT EDGE
            (not centre) so it stops outside the cell and snaps in at the
            tick boundary; the cell's own digit takes over from there. */}
        {nextBit !== null && tickIdx < N_TICKS && (() => {
          const x0 = G.dInBubbleX;
          const x1 = G.startX - 6;
          const x = x0 + (x1 - x0) * tickPhase;
          const opacity = tickPhase < 0.85 ? 0.85 : (1 - (tickPhase - 0.85) * 6.5);
          return (
            <g opacity={Math.max(0, opacity)}>
              <circle cx={x} cy={G.rowY + G.cellH / 2} r={18}
                      fill={nextBit ? 'var(--amber-400)' : 'var(--chalk-300)'}
                      opacity={0.25}/>
              <text x={x} y={G.rowY + G.cellH / 2 + 11} textAnchor="middle"
                    fill={nextBit ? 'var(--amber-300)' : 'var(--chalk-200)'}
                    fontFamily="var(--font-mono)" fontSize={26}
                    letterSpacing="0.06em">{nextBit}</text>
            </g>
          );
        })()}

        {/* The four register cells — no inner label; bit value is the big
            mono digit centred in the cell, FFn tag sits BELOW the cell. */}
        {cells.map((bit, i) => {
          const p = cellPos(i);
          return (
            <g key={i}>
              <FFBlock x={p.x} y={p.y} w={G.cellW} h={G.cellH}
                       label={''} qLabel={null}
                       accent={bit !== -1}
                       glow={glow}/>
              {/* Bit value in cell — big mono digit */}
              <text x={p.x + G.cellW / 2} y={p.y + G.cellH / 2 + G.fontCell * 0.34}
                    textAnchor="middle"
                    fill={bit === 1 ? 'var(--amber-300)' : bit === 0 ? 'var(--chalk-200)' : 'var(--chalk-300)'}
                    fontFamily="var(--font-mono)" fontSize={G.fontCell}
                    letterSpacing="0.02em">
                {bit === -1 ? '–' : bit}
              </text>
              {/* FFn tag below the cell */}
              <text x={p.x + G.cellW / 2} y={p.y + G.cellH + 22}
                    textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={12} letterSpacing="0.16em">{`FF${i}`}</text>
              {/* Inter-cell connector */}
              {i < N_CELLS - 1 && (
                <path d={`M ${p.x + G.cellW} ${p.y + G.cellH / 2} L ${p.x + G.cellW + G.gap} ${p.y + G.cellH / 2}`}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
              )}
            </g>
          );
        })}
        {/* Outgoing wire from FF3 */}
        <path d={`M ${G.startX + N_CELLS * (G.cellW + G.gap) - G.gap} ${G.rowY + G.cellH / 2} L ${G.startX + N_CELLS * (G.cellW + G.gap) + 30} ${G.rowY + G.cellH / 2}`}
              stroke="var(--chalk-200)" strokeWidth={2}/>

        {/* Caption — appears only after the 4th clock pulse, when the
            full word has marched across. */}
        {tickIdx >= 4 && (
          <SvgFadeIn duration={0.5} delay={0}>
            <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={portrait ? 20 : 24}>
              after 4 clocks: 1011 has marched all the way across
            </text>
          </SvgFadeIn>
        )}
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Serial in → parallel out: one bit per clock, all four read at once.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.8} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
        }}>
        (every UART, SPI byte and LED chain rides this trick)
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
