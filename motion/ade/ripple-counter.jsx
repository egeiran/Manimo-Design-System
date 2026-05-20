// Ripple Counter: How Four Toggle Flip-Flops Count to Sixteen — Manimo lesson scene.
//
// Chain four T-mode (J=K=1) flip-flops with each Q output driving the
// next stage's CLK. Each stage halves the frequency; together they spell
// out a 4-bit binary count from 0 to 15. Genuine animation lives in
// Beat 3 (CountWalkBeat): a clock pulse advances once per period, the
// four-bit register lights amber on each toggle, and the decimal readout
// updates in lockstep. Beat 4 stacks the four Q waveforms vertically so
// the divide-by-2 chain reads off visually.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js):
//    0.00– 5.00  Manimo enters; hook caption
//    5.00–14.00  Chain configuration — four T-FF boxes wired Q→CLK
//   14.00–32.00  Count walk — clock ticks, bits toggle, decimal increments
//   32.00–44.00  Divide-by-2 waveforms — five stacked timing rows
//   44.00–50.00  Takeaway — N flip-flops count to 2^N − 1
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beats 3 and 4 derive every pixel from useSprite()'s localTime, so
//     the visible motion stays in sync with the narration timeline.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 5.00 */ 'Chain four toggle flip-flops together — what do they count to?',
  /*  5.00–14.00 */ 'Wire four toggle flip-flops in a chain — the clock drives only the first one, and each Q output drives the clock of the next stage.',
  /* 14.00–32.00 */ 'Run the clock. The first stage toggles every edge, the second one every two edges, the third one every four, and the fourth one every eight — the four Q outputs together spell out a binary count from zero up to fifteen.',
  /* 32.00–44.00 */ 'Stack the four Q outputs and the divide-by-two structure jumps out — each row is a clean square wave at half the frequency of the row above.',
  /* 44.00–50.00 */ 'N flip-flops give an N bit counter that rolls over every two to the N clocks — small, simple, fast.',
];

const NARRATION_AUDIO = 'audio/ripple-counter/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="sequential logic"
      title="Ripple Counter: How Four Toggle Flip-Flops Count to Sixteen"
      duration={SCENE_DURATION}
      introEnd={3.88}
      introCaption="Four toggling cells, one clock — a binary counter falls out."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.88} end={12.19}>
        <ChainSetupBeat />
      </Sprite>

      <Sprite start={12.19} end={26.18}>
        <CountWalkBeat />
      </Sprite>

      <Sprite start={26.18} end={35.42}>
        <DivideByTwoBeat />
      </Sprite>

      <Sprite start={35.42} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared T-flip-flop block ────────────────────────────────────────────
// Box with J=K=1 (tied high), CLK input on the left (triangle for
// edge-triggered), Q output on the right. `cx, cy` = box centre.
function TffBox({ cx, cy, w = 100, h = 80, label = 'FF', qLabel = 'Q' }) {
  const left = cx - w / 2, right = cx + w / 2;
  const top = cy - h / 2, bot = cy + h / 2;
  return (
    <g>
      {/* Body */}
      <rect x={left} y={top} width={w} height={h} rx={6}
            fill="rgba(244,184,96,0.06)"
            stroke="var(--amber-400)" strokeWidth={2}/>
      {/* J=1 + K=1 labels inside, top-left */}
      <text x={left + 9} y={top + 22}
            fill="var(--chalk-200)" fontFamily="var(--font-mono)"
            fontSize={11}>J=1</text>
      <text x={left + 9} y={bot - 10}
            fill="var(--chalk-200)" fontFamily="var(--font-mono)"
            fontSize={11}>K=1</text>
      {/* CLK triangle on the left edge, middle */}
      <path d={`M ${left} ${cy - 7} L ${left + 12} ${cy} L ${left} ${cy + 7} Z`}
            fill="none" stroke="var(--chalk-200)" strokeWidth={1.6}/>
      {/* Q label on the right */}
      <text x={right - 14} y={cy + 6} textAnchor="end"
            fill="var(--amber-300)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={18}>{qLabel}</text>
      {/* Stage label below the box */}
      <text x={cx} y={bot + 18} textAnchor="middle"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.1em">{label}</text>
    </g>
  );
}

// ─── Beat 2: Chain configuration ─────────────────────────────────────────
function ChainSetupBeat() {
  const portrait = usePortrait();

  // Landscape: 4 boxes in a row. Portrait: 4 boxes in a column (chain
  // running top→bottom so the wire flow stays readable on a narrow canvas).
  const G = portrait
    ? { vbW: 600, vbH: 920,
        boxW: 180, boxH: 80,
        boxCx: [300, 300, 300, 300],
        boxCy: [160, 340, 520, 700],
        clkLabel: { x: 110, y: 100 },
        captionY: 880, fontMain: 22, fontCaption: 14,
        layout: 'col' }
    : { vbW: 1120, vbH: 360,
        boxW: 120, boxH: 80,
        boxCx: [220, 460, 700, 940],
        boxCy: [180, 180, 180, 180],
        clkLabel: { x: 80, y: 188 },
        captionY: 320, fontMain: 22, fontCaption: 14,
        layout: 'row' };

  const labels = ['FF0', 'FF1', 'FF2', 'FF3'];
  const qNames = ['Q₀', 'Q₁', 'Q₂', 'Q₃'];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* CLK label — feeds FF0 only */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.clkLabel.x} y={G.clkLabel.y}
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={14} letterSpacing="0.12em">CLK</text>
        </SvgFadeIn>

        {/* CLK input wire → FF0.CLK pin (left side of FF0 box, middle) */}
        <TraceIn d={
          G.layout === 'row'
            ? `M ${G.clkLabel.x + 36} ${G.clkLabel.y - 4} L ${G.boxCx[0] - G.boxW / 2} ${G.boxCy[0]}`
            : `M ${G.clkLabel.x + 36} ${G.clkLabel.y - 4} L ${G.boxCx[0] - G.boxW / 2} ${G.boxCy[0]}`
        }
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={0.4}/>

        {/* Four T-FF boxes */}
        {G.boxCx.map((cx, i) => (
          <SvgFadeIn key={i} duration={0.4} delay={0.6 + i * 0.4}>
            <TffBox cx={cx} cy={G.boxCy[i]} w={G.boxW} h={G.boxH}
                    label={labels[i]} qLabel={qNames[i]}/>
          </SvgFadeIn>
        ))}

        {/* Wires connecting Q_i → CLK_{i+1}. In row layout this is a
            straight rightward wire that dives down + over + back up to
            land on the next box's CLK pin. In col layout it's a
            simpler S-curve: out the right of one box, down, into the
            left of the next. We keep the wires very explicit. */}
        {[0, 1, 2].map((i) => {
          const xR = G.boxCx[i] + G.boxW / 2;
          const yR = G.boxCy[i];
          const xL = G.boxCx[i + 1] - G.boxW / 2;
          const yL = G.boxCy[i + 1];
          let d;
          if (G.layout === 'row') {
            const midX = (xR + xL) / 2;
            d = `M ${xR} ${yR} L ${midX} ${yR} L ${midX} ${yR - 36} L ${midX + 20} ${yR - 36} L ${midX + 20} ${yL} L ${xL} ${yL}`;
          } else {
            // Column layout: Q exits right, dips around the right edge,
            // and re-enters the next box's CLK on the left.
            const turnX = xR + 48;
            d = `M ${xR} ${yR} L ${turnX} ${yR} L ${turnX} ${yL} L ${xL} ${yL}`;
            // For column, route around to the LEFT instead — keep the
            // wire on the same column as the boxes by sweeping around
            // the right edge:
            const dx = xR + 60;
            d = `M ${xR} ${yR} L ${dx} ${yR} L ${dx} ${yL} L ${xL - 24} ${yL} L ${xL} ${yL}`;
          }
          return (
            <g key={i}>
              <TraceIn d={d}
                stroke="var(--amber-300)" strokeWidth={1.8}
                duration={0.7} delay={2.0 + i * 0.4}/>
            </g>
          );
        })}

        {/* Q output labels above the right pin of each box */}
        {G.boxCx.map((cx, i) => (
          <SvgFadeIn key={`ql${i}`} duration={0.35} delay={3.0 + i * 0.2}>
            <text x={cx + G.boxW / 2 + 6}
                  y={G.boxCy[i] - 14}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.fontMain}>{qNames[i]}</text>
          </SvgFadeIn>
        ))}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            asynchronous — each stage clocks the next one
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Count walk — clock ticks, bits toggle, decimal increments ───
// One "tick" lasts TICK seconds. The count starts at 0, advances by 1 on
// each tick, and shows the four bits (Q3 Q2 Q1 Q0) as lit/dim cells.
// We also overlay a small clock-pulse glyph that fires at each tick.
function CountWalkBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const HOLD = 1.0;
  const TICK = 1.0;
  // count = floor((localTime − HOLD) / TICK), clamped to 0..15
  const t = Math.max(0, localTime - HOLD);
  const rawCount = Math.floor(t / TICK);
  const count = Math.min(15, Math.max(0, rawCount));
  // Sub-tick fraction (0..1) within the current count — used to flash a
  // bit cell briefly when it just toggled.
  const sub = (t / TICK) - rawCount;

  // Which bits flipped on this tick (i.e. differ from count−1)? Used to
  // animate a brief glow on each toggling cell.
  const prevCount = count === 0 ? 0 : count - 1;
  const flipped = [0, 1, 2, 3].map(b => {
    if (count === 0) return false;
    if (!(sub < 0.35)) return false;          // glow window
    const now = (count >> b) & 1;
    const prev = (prevCount >> b) & 1;
    return now !== prev;
  });

  const bits = [3, 2, 1, 0].map(b => (count >> b) & 1);  // MSB → LSB

  const G = portrait
    ? { vbW: 600, vbH: 880,
        cellW: 86, cellGap: 18, cellY: 200, cellH: 110,
        labelY: 156, decimalY: 380, decimalFs: 92,
        clockX: 300, clockY: 480, clockR: 24,
        captionY: 760, fontCellLabel: 14, fontCaption: 14 }
    : { vbW: 1120, vbH: 440,
        cellW: 96, cellGap: 22, cellY: 110, cellH: 120,
        labelY: 78, decimalY: 320, decimalFs: 88,
        clockX: 920, clockY: 260, clockR: 26,
        captionY: 410, fontCellLabel: 14, fontCaption: 14 };

  // Cell row centred horizontally
  const rowW = 4 * G.cellW + 3 * G.cellGap;
  const x0 = (G.vbW - rowW) / 2;
  const cellLeft = i => x0 + i * (G.cellW + G.cellGap);

  // Clock pulse: brief flash at each tick (sub < 0.18)
  const clockPulse = (sub < 0.18 && t > 0) ? 1 - (sub / 0.18) : 0;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Bit labels Q3 Q2 Q1 Q0 above each cell */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          {['Q₃', 'Q₂', 'Q₁', 'Q₀'].map((q, i) => (
            <text key={i}
                  x={cellLeft(i) + G.cellW / 2} y={G.labelY}
                  textAnchor="middle"
                  fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.fontCellLabel + 6}>{q}</text>
          ))}
        </SvgFadeIn>

        {/* Four bit cells */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          {bits.map((b, i) => {
            const isFlipped = flipped[3 - i]; // bits is MSB-first; flipped is LSB-indexed
            const flashOpacity = isFlipped ? (1 - sub / 0.35) * 0.4 : 0;
            return (
              <g key={i}>
                {/* Cell border */}
                <rect x={cellLeft(i)} y={G.cellY}
                      width={G.cellW} height={G.cellH} rx={8}
                      fill={b ? 'rgba(244,184,96,0.20)' : 'rgba(232,220,193,0.04)'}
                      stroke={b ? 'var(--amber-400)' : 'var(--chalk-300)'}
                      strokeWidth={b ? 2 : 1.2}/>
                {/* Flash overlay when the bit just flipped */}
                {flashOpacity > 0 && (
                  <rect x={cellLeft(i) - 2} y={G.cellY - 2}
                        width={G.cellW + 4} height={G.cellH + 4} rx={10}
                        fill="none" stroke="var(--rose-400)" strokeWidth={2.4}
                        opacity={flashOpacity}/>
                )}
                {/* Bit text */}
                <text x={cellLeft(i) + G.cellW / 2}
                      y={G.cellY + G.cellH / 2 + 22}
                      textAnchor="middle"
                      fill={b ? 'var(--amber-300)' : 'var(--chalk-300)'}
                      fontFamily="var(--font-mono)" fontSize={56}>{b}</text>
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Decimal readout */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.vbW / 2} y={G.decimalY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.decimalFs}>
            {count}
          </text>
          <text x={G.vbW / 2} y={G.decimalY + 26} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.18em">DECIMAL</text>
        </SvgFadeIn>

        {/* Clock pulse glyph — a small ring that flashes at each tick */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <circle cx={G.clockX} cy={G.clockY} r={G.clockR}
                  fill="none" stroke="var(--chalk-200)" strokeWidth={1.6}/>
          <circle cx={G.clockX} cy={G.clockY} r={G.clockR - 4}
                  fill="var(--amber-300)" opacity={clockPulse * 0.95}/>
          <text x={G.clockX} y={G.clockY + G.clockR + 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">CLK</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={2.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            {portrait
              ? 'LSB flips every clock; each next bit flips half as often'
              : 'the least-significant bit flips every clock; the next one every other clock; the next every four'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Divide-by-2 waveforms — CLK, Q0, Q1, Q2, Q3 stacked ─────────
function DivideByTwoBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // We display N_CYCLES of CLK across the panel. Each Q_i is at half the
  // frequency of Q_{i-1}, so we need at least 16 CLK cycles to see one
  // full Q_3 cycle. Show 16 cycles.
  const N_CYCLES = 16;
  // Q_i toggles on each falling edge of Q_{i-1} (CLK for i=0). With CLK
  // square at 50% duty, Q_0 toggles on each falling edge of CLK; that
  // gives a square wave at half the CLK frequency.
  // For drawing, sample each row at SAMPLES_PER_CYCLE points per CLK
  // cycle so the edges read cleanly.
  const SAMPLES_PER_CYCLE = 12;
  const SAMPLES = N_CYCLES * SAMPLES_PER_CYCLE;

  // Row geometry
  const G = portrait
    ? { vbW: 600, vbH: 1000,
        labelW: 60, panelX: 90, panelW: 470,
        rowH: 100, rowGap: 20,
        topY: 110,
        periodLabelX: 575,
        captionY: 940, fontMain: 20, fontCaption: 14 }
    : { vbW: 1120, vbH: 460,
        labelW: 60, panelX: 110, panelW: 880,
        rowH: 56, rowGap: 14,
        topY: 50,
        periodLabelX: 1010,
        captionY: 430, fontMain: 18, fontCaption: 14 };

  // 5 rows: CLK, Q0, Q1, Q2, Q3
  const rowNames = ['CLK', 'Q₀', 'Q₁', 'Q₂', 'Q₃'];
  const periods = ['T', '2T', '4T', '8T', '16T'];

  // Reveal cursor: sweeps from left to right across the panel as the
  // beat progresses, so the waveform is built up over time.
  const HOLD = 0.6;
  const SWEEP = 8.0; // seconds
  const sFrac = clamp((localTime - HOLD) / SWEEP, 0, 1);
  const cursorPx = G.panelX + sFrac * G.panelW;

  // Sample value: row 0 is CLK, rows 1..4 are Q_i. Use half-cycle
  // sampling. CLK: high in the second half of each cycle (matches the
  // jk-flip-flop scene's clkAt).
  function rowVal(rowIdx, sampleIdx) {
    // sampleIdx ∈ [0, SAMPLES). Each CLK cycle has SAMPLES_PER_CYCLE
    // samples; convert to a fractional CLK cycle index.
    const t = sampleIdx / SAMPLES_PER_CYCLE;
    if (rowIdx === 0) {
      // CLK square wave: high for the second half of each unit period.
      return ((t % 1) >= 0.5) ? 1 : 0;
    } else {
      // Q_i toggles every 2^i CLK cycles. Easiest: count the number of
      // falling edges of CLK that have happened up to time t, then
      // count of falling edges of Q_{i-1}, etc. But there's a clean
      // closed form: Q_i is high when the (i+1)-th bit of floor(t) is
      // set (after the first CLK falling edge resets bit 0).
      // CLK falls at t = 1, 2, 3, ... So count = floor(t).
      const k = Math.floor(t);
      return (k >> (rowIdx - 1)) & 1;
    }
  }

  // Build a square-wave path for each row (transitions between samples).
  function rowPath(rowIdx, yMid) {
    const yHi = yMid - G.rowH * 0.32;
    const yLo = yMid + G.rowH * 0.32;
    const pxPerSample = G.panelW / SAMPLES;
    const pts = [];
    let prevV = rowVal(rowIdx, 0);
    let prevX = G.panelX;
    pts.push(`M ${prevX} ${prevV ? yHi : yLo}`);
    for (let i = 1; i <= SAMPLES; i++) {
      const v = rowVal(rowIdx, i);
      const x = G.panelX + i * pxPerSample;
      if (v !== prevV) {
        // vertical transition at the boundary
        pts.push(`L ${x.toFixed(2)} ${prevV ? yHi : yLo}`);
        pts.push(`L ${x.toFixed(2)} ${v ? yHi : yLo}`);
        prevV = v;
      } else {
        pts.push(`L ${x.toFixed(2)} ${v ? yHi : yLo}`);
      }
    }
    return pts.join(' ');
  }

  const rowColours = [
    'var(--chalk-100)',  // CLK
    'var(--amber-300)',  // Q0
    'var(--amber-300)',  // Q1
    'var(--amber-300)',  // Q2
    'var(--amber-300)',  // Q3
  ];

  const clipId = `rippleSweepClip`;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={G.panelX - 2} y={G.topY - 8}
                  width={Math.max(0, cursorPx - G.panelX + 2)}
                  height={5 * G.rowH + 4 * G.rowGap + 16}/>
          </clipPath>
        </defs>

        {/* Row labels + baselines + waveforms */}
        {rowNames.map((name, i) => {
          const yMid = G.topY + i * (G.rowH + G.rowGap) + G.rowH / 2;
          return (
            <g key={i}>
              {/* Row label */}
              <SvgFadeIn duration={0.4} delay={0.0 + i * 0.1}>
                <text x={G.panelX - 12} y={yMid + 6}
                      textAnchor="end"
                      fill={i === 0 ? 'var(--chalk-100)' : 'var(--amber-300)'}
                      fontFamily={i === 0 ? 'var(--font-mono)' : 'var(--font-serif)'}
                      fontStyle={i === 0 ? 'normal' : 'italic'}
                      fontSize={i === 0 ? 14 : G.fontMain}
                      letterSpacing={i === 0 ? '0.12em' : '0'}>{name}</text>
              </SvgFadeIn>
              {/* Baseline */}
              <SvgFadeIn duration={0.4} delay={0.2 + i * 0.05}>
                <line x1={G.panelX} y1={yMid}
                      x2={G.panelX + G.panelW} y2={yMid}
                      stroke="var(--chalk-300)" strokeWidth={1} opacity={0.18}
                      strokeDasharray="3 5"/>
              </SvgFadeIn>
              {/* Waveform — clipped to cursor */}
              <g clipPath={`url(#${clipId})`}>
                <SvgFadeIn duration={0.4} delay={0.4 + i * 0.1}>
                  <path d={rowPath(i, yMid)}
                        fill="none" stroke={rowColours[i]}
                        strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"/>
                </SvgFadeIn>
              </g>
            </g>
          );
        })}

        {/* Period label column at the right */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          {periods.map((p, i) => {
            const yMid = G.topY + i * (G.rowH + G.rowGap) + G.rowH / 2;
            return (
              <text key={i} x={G.periodLabelX} y={yMid + 5}
                    textAnchor="start"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={13} letterSpacing="0.1em">{p}</text>
            );
          })}
        </SvgFadeIn>

        {/* Cursor */}
        {sFrac > 0.01 && sFrac < 0.99 && (
          <line x1={cursorPx} y1={G.topY - 4}
                x2={cursorPx} y2={G.topY + 5 * G.rowH + 4 * G.rowGap + 4}
                stroke="var(--amber-400)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.6}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            {portrait
              ? 'N stages → ÷ 2^N — and the bit pattern itself counts'
              : 'N stages → divide-by-2^N — and the bit pattern itself counts'}
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
          fontSize: portrait ? 26 : 42, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '32ch' : 'none',
          lineHeight: 1.25, whiteSpace: portrait ? 'normal' : 'nowrap',
        }}>
        N flip-flops → counts 0 .. 2<sup>N</sup> − 1
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '26ch' : '52ch', lineHeight: 1.5,
          textAlign: 'center', marginTop: 4,
        }}>
        Asynchronous is simple; ripple delay grows with N. For wide, fast counters, prefer a synchronous design.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        the building block of every timer, frequency divider, and event counter
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
