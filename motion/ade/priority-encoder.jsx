// The 8-to-3 Priority Encoder — Manimo lesson scene.
// Eight input lines, three output bits, one Valid flag. When several inputs
// are HIGH at once, the highest-index input "wins" and its index is emitted
// as a 3-bit binary code. The Valid flag distinguishes "I0 is the active
// input" from "no input is active at all".
//
// Beats (placeholder timings — overwritten by rewire-scene.js):
//    0.00– 6.00  Manimo intro — many speak, one wins
//    6.00–18.00  Block diagram — 8 inputs, encoder block, 3 outputs + V
//   18.00–30.00  Priority rule — three example patterns, highest-active wins
//   30.00–44.00  Live demo — patterns cycle, output tracks highest in real time
//   44.00–52.00  Takeaway — where priority encoders live in real systems
//
// Authoring notes:
//   • Beat 4 ("liveDemo") is THE motion beat: useSprite() drives a sequence
//     of curated input patterns; the JSX computes the highest-active index
//     and the three output bits from that pattern each frame, so the LEDs,
//     output bits, and Valid flag are always in sync.
//   • Beat 3 ("priorityRule") is also motion-rich: three example patterns
//     fade in one after another, each with its active inputs glowing and a
//     halo on the winning input.

const SCENE_DURATION = 65;

const NARRATION = [
  /*  0.00– 6.00 */ "Eight buttons go in. Three wires come out. When more than one button is pressed, who gets to talk?",
  /*  6.00–18.00 */ "The encoder block takes eight inputs labelled I zero through I seven. It puts out three address bits Y two, Y one, Y zero, plus a Valid flag V. The address is the binary index of the highest input that is HIGH.",
  /* 18.00–30.00 */ "Here is the rule. Scan from the top down. The first input you find that is HIGH determines the address — everything below it is ignored. Higher index always wins. That is why we call it priority.",
  /* 30.00–44.00 */ "Watch it run. Inputs flash on and off in patterns that change every second. The output address tracks the highest active input in real time. When everything goes low, the Valid flag drops.",
  /* 44.00–52.00 */ "Priority encoders live everywhere multiple things can ask for attention at once. Interrupt controllers, keyboard scanners, even floating-point leading-zero detectors. Many speak, one wins.",
];

const NARRATION_AUDIO = 'audio/priority-encoder/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="The 8-to-3 Priority Encoder: When Many Speak, One Wins"
      duration={SCENE_DURATION}
      introEnd={6.8}
      introCaption="Eight inputs, three outputs — when many speak, who wins?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.8} end={22.74}>
        <BlockDiagramBeat />
      </Sprite>

      <Sprite start={22.74} end={36.26}>
        <PriorityRuleBeat />
      </Sprite>

      <Sprite start={36.26} end={49.34}>
        <LiveDemoBeat />
      </Sprite>

      <Sprite start={49.34} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────

// Compute (winnerIndex, validFlag, yBits[]) from an 8-bit input pattern.
// Inputs is an array of 0/1 indexed I0..I7. Highest-index HIGH wins.
function encodePriority(inputs) {
  let winner = -1;
  for (let i = inputs.length - 1; i >= 0; i--) {
    if (inputs[i] === 1) { winner = i; break; }
  }
  const valid = winner >= 0 ? 1 : 0;
  const idx = winner >= 0 ? winner : 0;
  const yBits = [
    (idx >> 2) & 1,   // Y2
    (idx >> 1) & 1,   // Y1
    idx & 1,          // Y0
  ];
  return { winner, valid, yBits };
}

// LED glyph: filled circle if on, ring if off. Halo when 'haloed'.
function LedGlyph({ cx, cy, on, color = 'var(--amber-400)', halo = false, r = 9 }) {
  return (
    <g>
      {halo && (
        <circle cx={cx} cy={cy} r={r + 7}
                fill="none" stroke="var(--rose-400)" strokeWidth={2}
                opacity={0.85}/>
      )}
      <circle cx={cx} cy={cy} r={r}
              fill={on ? color : 'var(--bg-canvas)'}
              stroke={on ? color : 'var(--chalk-300)'}
              strokeWidth={1.8}
              opacity={on ? 0.95 : 0.5}/>
    </g>
  );
}

// ─── Beat 2: Block diagram ───────────────────────────────────────────────
function BlockDiagramBeat() {
  const portrait = usePortrait();

  // Geometry: 8 input lines on the left, encoder block in the middle,
  // 3 output lines on the right, V flag below output stack.
  const G = portrait
    ? { vbW: 600, vbH: 720,
        blockX: 200, blockY: 160, blockW: 220, blockH: 440,
        inX0: 60, inXR: 200, inY0: 200, inYStep: 50,
        outX0: 420, outXR: 540, outY0: 240, outYStep: 60,
        vY: 540,
        fontMain: 18, fontLabel: 14, captionY: 685 }
    : { vbW: 1100, vbH: 460,
        blockX: 440, blockY: 60, blockW: 220, blockH: 360,
        inX0: 120, inXR: 440, inY0: 90, inYStep: 42,
        outX0: 660, outXR: 940, outY0: 130, outYStep: 60,
        vY: 360,
        fontMain: 20, fontLabel: 14, captionY: 440 };

  // Pre-staggered fade-ins for each input line so they appear in sequence
  const inputDelays = Array.from({ length: 8 }, (_, i) => 0.3 + i * 0.10);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Encoder block */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          <rect x={G.blockX} y={G.blockY} width={G.blockW} height={G.blockH}
                rx={10} fill="rgba(244,184,96,0.05)"
                stroke="var(--amber-400)" strokeWidth={2}/>
          <text x={G.blockX + G.blockW / 2} y={G.blockY + 30} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">8 → 3</text>
          <text x={G.blockX + G.blockW / 2} y={G.blockY + 52} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>priority</text>
          <text x={G.blockX + G.blockW / 2} y={G.blockY + 72} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>encoder</text>
        </SvgFadeIn>

        {/* Eight input lines */}
        {Array.from({ length: 8 }).map((_, i) => {
          const y = G.inY0 + i * G.inYStep;
          return (
            <SvgFadeIn key={i} duration={0.35} delay={inputDelays[i]}>
              {/* line */}
              <line x1={G.inX0} y1={y} x2={G.inXR} y2={y}
                    stroke="var(--chalk-200)" strokeWidth={1.6}/>
              {/* label on the left */}
              <text x={G.inX0 - 10} y={y + 5} textAnchor="end"
                    fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontLabel}>
                I<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>{i}</tspan>
              </text>
              {/* tiny entry dot at left */}
              <circle cx={G.inX0} cy={y} r={2.6} fill="var(--chalk-200)"/>
            </SvgFadeIn>
          );
        })}

        {/* Three output lines: Y2, Y1, Y0 (top to bottom) */}
        {[2, 1, 0].map((bit, i) => {
          const y = G.outY0 + i * G.outYStep;
          return (
            <SvgFadeIn key={bit} duration={0.4} delay={1.2 + i * 0.2}>
              <line x1={G.outX0} y1={y} x2={G.outXR} y2={y}
                    stroke="var(--amber-300)" strokeWidth={1.8}/>
              <text x={G.outXR + 8} y={y + 5}
                    fill="var(--amber-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontLabel}>
                Y<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>{bit}</tspan>
              </text>
            </SvgFadeIn>
          );
        })}

        {/* Valid flag line, below the Y stack */}
        <SvgFadeIn duration={0.4} delay={2.0}>
          <line x1={G.outX0} y1={G.vY} x2={G.outXR} y2={G.vY}
                stroke="var(--teal-400)" strokeWidth={1.8}/>
          <text x={G.outXR + 8} y={G.vY + 5}
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>V</text>
          <text x={G.outXR + 30} y={G.vY + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={10} letterSpacing="0.14em">VALID</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">
            {portrait
              ? 'eight in, three out, plus a Valid flag'
              : 'eight inputs in, a 3-bit address out, plus a Valid flag'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Priority rule — three example patterns ──────────────────────
// Three rows, each a "row" that fades in: pattern of 8 LEDs + arrow + 3-bit
// output. The winning LED (highest-index HIGH) gets a rose halo so the eye
// learns the rule.
function PriorityRuleBeat() {
  const portrait = usePortrait();

  // Patterns to demonstrate: index 0 from left = I0, index 7 from left = I7.
  const PATTERNS = [
    { inputs: [0, 1, 0, 1, 1, 0, 0, 0], note: 'I1, I3, I4 active' },     // winner I4 → 100
    { inputs: [1, 1, 0, 0, 0, 0, 1, 0], note: 'I0, I1, I6 active' },     // winner I6 → 110
    { inputs: [0, 0, 0, 1, 0, 1, 1, 1], note: 'I3, I5, I6, I7 active' }, // winner I7 → 111
  ];

  // Layout — three rows, top-to-bottom; LED row + arrow + 3-bit binary code
  const G = portrait
    ? { vbW: 600, vbH: 740,
        rowX0: 60, rowXW: 480, rowY0: 100, rowH: 170,
        ledStartX: 60, ledStep: 36, ledY: 0,    // ledY: relative to row top
        arrowX: 360,
        codeX: 430, codeY: 8, codeStep: 22,
        fontLabel: 13, captionY: 700 }
    : { vbW: 1100, vbH: 460,
        rowX0: 80, rowXW: 940, rowY0: 60, rowH: 120,
        ledStartX: 140, ledStep: 64, ledY: 0,
        arrowX: 720,
        codeX: 810, codeY: 4, codeStep: 22,
        fontLabel: 14, captionY: 440 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {PATTERNS.map((pat, rowI) => {
          const { winner, yBits } = encodePriority(pat.inputs);
          const rowTop = G.rowY0 + rowI * G.rowH;
          const rowCentreY = rowTop + 18;
          const ledY = rowCentreY + G.ledY;
          const delay = 0.3 + rowI * 1.6;
          return (
            <g key={rowI}>
              {/* Row eyebrow + note */}
              <SvgFadeIn duration={0.4} delay={delay - 0.2}>
                <text x={G.rowX0} y={rowTop}
                      fill="var(--amber-300)" fontFamily="var(--font-mono)"
                      fontSize={10} letterSpacing="0.16em">
                  PATTERN {rowI + 1}
                </text>
                <text x={G.rowX0 + 90} y={rowTop}
                      fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                      fontSize={11} fontStyle="italic">
                  {pat.note}
                </text>
              </SvgFadeIn>

              {/* LEDs I0..I7 left-to-right */}
              <SvgFadeIn duration={0.4} delay={delay}>
                {pat.inputs.map((on, i) => {
                  const cx = G.ledStartX + i * G.ledStep;
                  return (
                    <g key={i}>
                      <LedGlyph cx={cx} cy={ledY} on={on === 1}
                                halo={i === winner}/>
                      <text x={cx} y={ledY + 26} textAnchor="middle"
                            fill={i === winner ? 'var(--rose-300)' : 'var(--chalk-300)'}
                            fontFamily="var(--font-mono)" fontSize={10}>
                        I{i}
                      </text>
                    </g>
                  );
                })}
              </SvgFadeIn>

              {/* Arrow → */}
              <SvgFadeIn duration={0.4} delay={delay + 0.6}>
                <line x1={G.arrowX - 26} y1={ledY}
                      x2={G.arrowX} y2={ledY}
                      stroke="var(--amber-300)" strokeWidth={2}/>
                <path d={`M ${G.arrowX} ${ledY} l -7 -5 l 0 10 z`}
                      fill="var(--amber-300)"/>
              </SvgFadeIn>

              {/* 3-bit output code */}
              <SvgFadeIn duration={0.4} delay={delay + 0.9}>
                <text x={G.codeX} y={ledY + 5}
                      fill="var(--amber-300)" fontFamily="var(--font-mono)"
                      fontSize={22} letterSpacing="0.16em">
                  {yBits.join('')}
                </text>
                <text x={G.codeX} y={ledY + 26}
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={10} letterSpacing="0.14em">
                  = {winner}
                </text>
              </SvgFadeIn>
            </g>
          );
        })}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={6.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">
            highest-index HIGH input wins — the others are ignored
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Live demo — input patterns cycle, output tracks ─────────────
// A curated sequence of input patterns plays out, one per "tick". The
// encoder logic runs every frame, so the 3-bit output and Valid flag are
// derived from whatever pattern is on screen at that moment.
function LiveDemoBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.6;
  const PATTERNS = [
    [0, 0, 0, 0, 0, 0, 0, 0],   // all off — Valid OFF
    [1, 0, 0, 0, 0, 0, 0, 0],   // I0 → 000, V on
    [0, 0, 1, 0, 0, 0, 0, 0],   // I2 → 010
    [1, 0, 1, 0, 0, 0, 0, 0],   // I0+I2, winner I2 → 010
    [1, 1, 1, 1, 0, 0, 0, 0],   // 0..3, winner I3 → 011
    [0, 0, 0, 0, 1, 0, 0, 0],   // I4 → 100
    [1, 0, 0, 0, 1, 0, 1, 0],   // I0, I4, I6, winner I6 → 110
    [0, 0, 0, 0, 0, 0, 0, 1],   // I7 → 111
    [1, 1, 1, 1, 1, 1, 1, 1],   // all on, winner I7 → 111
    [0, 0, 0, 0, 0, 0, 0, 0],   // back to all off
  ];

  const N = PATTERNS.length;
  const TICK_DUR = Math.max((spriteDur - HOLD - 1.0) / N, 0.4);
  const tickI = clamp(Math.floor(Math.max(0, localTime - HOLD) / TICK_DUR), 0, N - 1);
  const pat = PATTERNS[tickI];
  const { winner, valid, yBits } = encodePriority(pat);

  // Geometry: LED column on the left + readout panel on the right.
  const G = portrait
    ? { vbW: 600, vbH: 740,
        ledX: 130, ledY0: 100, ledStep: 56, ledR: 13,
        panelX: 290, panelY: 100, panelW: 270, panelH: 540,
        fontMain: 22, fontLabel: 14 }
    : { vbW: 1100, vbH: 460,
        ledX: 240, ledY0: 60, ledStep: 46, ledR: 12,
        panelX: 540, panelY: 60, panelW: 460, panelH: 380,
        fontMain: 24, fontLabel: 16 };

  // Tick progress for the small "tick bar" in the corner
  const tickFrac = clamp((localTime - HOLD - tickI * TICK_DUR) / TICK_DUR, 0, 1);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Eyebrow on the LED column */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.ledX} y={G.ledY0 - 30} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.16em">INPUTS</text>
        </SvgFadeIn>

        {/* LEDs I7 (top) ... I0 (bottom) — top-down so higher index reads
            as "higher priority" visually */}
        {[7, 6, 5, 4, 3, 2, 1, 0].map((idx, row) => {
          const cy = G.ledY0 + row * G.ledStep;
          return (
            <g key={idx}>
              {/* Label */}
              <text x={G.ledX - 32} y={cy + 5} textAnchor="end"
                    fill={idx === winner && valid
                      ? 'var(--rose-300)'
                      : 'var(--chalk-200)'}
                    fontFamily="var(--font-serif)" fontStyle="italic"
                    fontSize={G.fontLabel}>
                I<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>{idx}</tspan>
              </text>
              {/* LED — pulse the winner */}
              <LedGlyph cx={G.ledX} cy={cy} on={pat[idx] === 1}
                        halo={idx === winner && valid}
                        r={G.ledR}/>
            </g>
          );
        })}

        {/* Readout panel — pattern number, output bits, Valid */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <rect x={G.panelX} y={G.panelY} width={G.panelW} height={G.panelH}
                rx={10} fill="rgba(244,184,96,0.05)"
                stroke="rgba(232,220,193,0.10)" strokeWidth={1}/>
          {/* Eyebrow */}
          <text x={G.panelX + G.panelW / 2} y={G.panelY + 26} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.18em">LIVE OUTPUT</text>
        </SvgFadeIn>

        {/* Y2 Y1 Y0 row */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          {(() => {
            const rowY = G.panelY + 100;
            const cellX = G.panelX + G.panelW * 0.18;
            const cellStep = G.panelW * 0.22;
            return ['Y2', 'Y1', 'Y0'].map((label, i) => {
              const cx = cellX + i * cellStep;
              const bit = yBits[i];
              const dim = !valid;
              return (
                <g key={label}>
                  {/* Cell border */}
                  <rect x={cx - 32} y={rowY - 36} width={64} height={70}
                        rx={6} fill="rgba(244,184,96,0.05)"
                        stroke={dim ? 'var(--chalk-300)' : 'var(--amber-400)'}
                        strokeWidth={1.5} opacity={dim ? 0.35 : 0.9}/>
                  {/* Bit value */}
                  <text x={cx} y={rowY + 12} textAnchor="middle"
                        fill={dim ? 'var(--chalk-300)'
                             : (bit === 1 ? 'var(--amber-300)' : 'var(--chalk-200)')}
                        fontFamily="var(--font-mono)" fontSize={G.fontMain}>
                    {bit}
                  </text>
                  {/* Cell label below */}
                  <text x={cx} y={rowY - 16} textAnchor="middle"
                        fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                        fontSize={10} letterSpacing="0.14em">{label}</text>
                </g>
              );
            });
          })()}
        </SvgFadeIn>

        {/* Decimal index */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          {(() => {
            const rowY = G.panelY + 200;
            return (
              <g>
                <text x={G.panelX + 22} y={rowY}
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={11} letterSpacing="0.16em">DECIMAL INDEX</text>
                <text x={G.panelX + G.panelW - 22} y={rowY} textAnchor="end"
                      fill={valid ? 'var(--amber-300)' : 'var(--chalk-300)'}
                      fontFamily="var(--font-mono)" fontSize={G.fontMain}
                      opacity={valid ? 1 : 0.5}>
                  {valid ? winner : '—'}
                </text>
              </g>
            );
          })()}
        </SvgFadeIn>

        {/* Valid flag */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          {(() => {
            const rowY = G.panelY + 260;
            return (
              <g>
                <text x={G.panelX + 22} y={rowY}
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={11} letterSpacing="0.16em">VALID FLAG</text>
                {/* small filled circle indicator + word */}
                <circle cx={G.panelX + G.panelW - 60} cy={rowY - 5} r={8}
                        fill={valid ? 'var(--teal-400)' : 'var(--bg-canvas)'}
                        stroke={valid ? 'var(--teal-400)' : 'var(--chalk-300)'}
                        strokeWidth={1.6}/>
                <text x={G.panelX + G.panelW - 22} y={rowY} textAnchor="end"
                      fill={valid ? 'var(--teal-400)' : 'var(--chalk-300)'}
                      fontFamily="var(--font-mono)" fontSize={G.fontLabel}
                      letterSpacing="0.14em">
                  {valid ? 'ON' : 'OFF'}
                </text>
              </g>
            );
          })()}
        </SvgFadeIn>

        {/* Tick progress bar */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          {(() => {
            const rowY = G.panelY + G.panelH - 38;
            const barX = G.panelX + 22;
            const barW = G.panelW - 44;
            return (
              <g>
                <text x={barX} y={rowY - 8}
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={10} letterSpacing="0.14em">
                  PATTERN {tickI + 1} / {N}
                </text>
                <rect x={barX} y={rowY} width={barW} height={6} rx={3}
                      fill="rgba(232,220,193,0.10)"/>
                <rect x={barX} y={rowY}
                      width={barW * ((tickI + tickFrac) / N)} height={6} rx={3}
                      fill="var(--amber-300)"/>
              </g>
            );
          })()}
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
          fontSize: portrait ? 30 : 40, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '20ch' : 'none',
        }}>
        Y = highest active index
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        many speak, one wins — and the Valid flag tells you anyone spoke at all
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        interrupt controllers · keyboard scanners · leading-zero detectors
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
