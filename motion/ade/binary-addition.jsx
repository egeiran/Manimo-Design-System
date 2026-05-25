// Binary Addition: How the Carry Walks Left — Manimo lesson scene.
//
// Adding two 4-bit numbers (0101 + 0111 = 1100 = 12₁₀) column by column,
// from the least significant bit up. The carry-out of column k is the
// carry-in of column k+1, so the carry "walks" leftward as the addition
// settles. Beat 3 is the genuine animation: a column cursor sweeps
// right-to-left over the four columns; the sum bit fades in below each
// column as the cursor leaves it, and a rose carry token slides diagonally
// from each column into the next. Beat 4 follows up with a four-FA-block
// ripple-carry chain to motivate why this matters in hardware.
//
// Beats (placeholder timings — rewire-scene.js overwrites once audio exists):
//    0.00– 5.00  Manimo enters; hook
//    5.00–14.00  Per-column rules grid (four cases)
//   14.00–36.00  Column-by-column walk through 0101 + 0111 = 1100
//   36.00–44.00  Hardware: four FA blocks + carry chain lighting up
//   44.00–50.00  Takeaway
//
// Authoring notes:
//   • Beat 3 uses useSprite() localTime + per-column cursor windows to
//     drive the highlight, the sum-bit reveal, and the carry slide.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM.

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0.00– 5.00 */ 'Computers add the way you do — column by column, right to left, carrying when you overflow. The only difference is the alphabet has just two letters.',
  /*  5.00–14.00 */ 'Four cases per column. Zero plus zero gives zero. Zero plus one gives one. One plus one — and now it overflows: the sum bit drops to zero and a carry pops out the top.',
  /* walk */ "Add zero one zero one and zero one one one, right to left. Each one plus one rolls over and a carry slides up to the next column. After four columns we land on one one zero zero — twelve in decimal.",
  /* 36.00–44.00 */ 'In hardware, that left-walking carry is the bottleneck. The most significant bit cannot settle until every carry below it has settled. The longest carry chain sets the clock.',
  /* 44.00–50.00 */ 'Same algorithm, different alphabet — and carries are how the columns talk to each other.',
];

const NARRATION_AUDIO = 'audio/binary-addition/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="digital arithmetic"
      title="Binary Addition: How the Carry Walks Left"
      duration={SCENE_DURATION}
      introEnd={9.49}
      introCaption="Same long addition you learned in school — in base two."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.49} end={22.61}>
        <RulesBeat />
      </Sprite>

      <Sprite start={22.61} end={37.09}>
        <WalkBeat />
      </Sprite>

      <Sprite start={37.09} end={47.74}>
        <LongestPathBeat />
      </Sprite>

      <Sprite start={47.74} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Per-column rules grid ─────────────────────────────────────────
function RulesBeat() {
  const portrait = usePortrait();

  const rowStyle = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 28,
    letterSpacing: '0.04em',
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 22,
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        per-column rules
      </FadeUp>

      <div style={{ display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: portrait ? 14 : 18,
                    paddingTop: 8 }}>
        <FadeUp duration={0.45} delay={0.7} distance={10}
          style={{ ...rowStyle, color: 'var(--chalk-200)' }}>
          0 + 0 = 0&nbsp;&nbsp;<span style={{ color: 'var(--chalk-300)', fontSize: '0.7em' }}>(carry 0)</span>
        </FadeUp>
        <FadeUp duration={0.45} delay={1.5} distance={10}
          style={{ ...rowStyle, color: 'var(--chalk-200)' }}>
          0 + 1 = 1&nbsp;&nbsp;<span style={{ color: 'var(--chalk-300)', fontSize: '0.7em' }}>(carry 0)</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={10}
          style={{ ...rowStyle, color: 'var(--rose-300)' }}>
          1 + 1 = 0&nbsp;&nbsp;<span style={{ color: 'var(--rose-400)', fontSize: '0.7em' }}>(carry 1)</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={4.5} distance={10}
          style={{ ...rowStyle, color: 'var(--rose-300)' }}>
          1 + 1 + 1 = 1&nbsp;&nbsp;<span style={{ color: 'var(--rose-400)', fontSize: '0.7em' }}>(carry 1)</span>
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={6.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '26ch' : '40ch', lineHeight: 1.35,
          marginTop: 6,
        }}>
        two ones overflow base two — they always do
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Column-by-column walk ─────────────────────────────────────────
// 0101 + 0111 = 1100 (= 12 decimal). Columns 0..3 from right to left.
//   col 0: 1+1   = 0, carry 1
//   col 1: 0+1+1 = 0, carry 1
//   col 2: 1+1+1 = 1, carry 1
//   col 3: 0+0+1 = 1, carry 0
function WalkBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const A = [0, 1, 0, 1]; // MSB to LSB
  const B = [0, 1, 1, 1];
  const SUM = [1, 1, 0, 0];
  const CARRY_OUT = [0, 1, 1, 1]; // carry produced by column 3,2,1,0 (msb→lsb indexing here too)
  // We want column-cursor walking right-to-left across the four columns.
  // Use an array indexed by visual column position from the LEFT (msb=0..lsb=3).
  // Process order: lsb (index 3) first, then 2, 1, 0.

  const G = portrait
    ? { vbW: 600, vbH: 420, cellW: 90, cellH: 78, top: 80, gapX: 6,
        fontBit: 38, fontLabel: 16, fontRes: 22, leftPad: 80 }
    : { vbW: 980, vbH: 480, cellW: 120, cellH: 96, top: 90, gapX: 8,
        fontBit: 48, fontLabel: 17, fontRes: 24, leftPad: 200 };

  const cols = 4;
  const totalW = cols * G.cellW + (cols - 1) * G.gapX;
  // Centre the grid horizontally
  const gridLeft = portrait ? (G.vbW - totalW) / 2 : G.leftPad;
  const x = (visCol) => gridLeft + visCol * (G.cellW + G.gapX) + G.cellW / 2;
  // Three rows: A (top), B (middle), Sum (bottom). With a thin divider line
  // between B and Sum.
  const yA = G.top + G.cellH / 2;
  const yB = yA + G.cellH + 4;
  const dividerY = yB + G.cellH / 2 + 4;
  const ySum = dividerY + G.cellH / 2 + 8;
  // Carry row sits above A
  const yCarry = yA - G.cellH / 2 - 14;

  // Per-column processing window. Sweep is tightened (1 s per column)
  // because the shortened narration no longer announces each column.
  const colStart = 1.0;
  const colDur = 1.0;          // seconds per column (cursor window)
  // visCol 0=MSB,1,2,3=LSB. Processing order: 3,2,1,0. The kth processed
  // column (k=0,1,2,3) maps to visCol = 3 - k.
  const procIndexFor = (visCol) => 3 - visCol; // 0=LSB processed first
  const colStartT = (visCol) => colStart + procIndexFor(visCol) * colDur;
  const colDoneT = (visCol) => colStartT(visCol) + colDur;

  // Carry-in for each visual column. carryIn[3] = 0 (lsb has no carry-in);
  // carryIn[2] = CARRY_OUT[3] = 1 (carry from lsb); etc.
  // Index by visual col (msb=0..lsb=3).
  const carryIn = [
    CARRY_OUT[1] ?? 0, // col 0 (msb) carry-in = carry-out of col 1
    CARRY_OUT[2] ?? 0,
    CARRY_OUT[3] ?? 0,
    0,                 // col 3 (lsb) carry-in = 0
  ];
  // Note: carryOut[visCol] = CARRY_OUT[visCol].

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Column highlights — rendered first so they sit under everything */}
        {[0, 1, 2, 3].map((c) => {
          const s = colStartT(c);
          const e = colDoneT(c);
          const lit = clamp((localTime - s) / 0.3, 0, 1)
                    * (1 - clamp((localTime - (e + 0.4)) / 0.6, 0, 1));
          if (lit < 0.05) return null;
          return (
            <rect key={`hl-${c}`} x={x(c) - G.cellW / 2}
                  y={yCarry - 4}
                  width={G.cellW}
                  height={ySum + G.cellH / 2 + 4 - (yCarry - 4)}
                  fill="var(--amber-400)" opacity={lit * 0.10}
                  rx={6}/>
          );
        })}

        {/* "+" operator on the left of B row */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={gridLeft - 28} y={yB + G.fontBit * 0.32} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.fontBit}>+</text>
        </SvgFadeIn>

        {/* A row */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {A.map((b, i) => (
            <text key={i} x={x(i)} y={yA + G.fontBit * 0.32}
                  textAnchor="middle" fill="var(--chalk-100)"
                  fontFamily="var(--font-mono)" fontSize={G.fontBit}>
              {b}
            </text>
          ))}
        </SvgFadeIn>

        {/* B row */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          {B.map((b, i) => (
            <text key={i} x={x(i)} y={yB + G.fontBit * 0.32}
                  textAnchor="middle" fill="var(--chalk-100)"
                  fontFamily="var(--font-mono)" fontSize={G.fontBit}>
              {b}
            </text>
          ))}
        </SvgFadeIn>

        {/* Horizontal divider above the sum row */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={gridLeft - 6} y1={dividerY}
                x2={gridLeft + totalW + 6} y2={dividerY}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
        </SvgFadeIn>

        {/* Sum row — fades in column-by-column as the cursor leaves */}
        {SUM.map((b, i) => {
          const t = colDoneT(i);
          const a = clamp((localTime - t) / 0.4, 0, 1);
          if (a < 0.05) return null;
          return (
            <text key={i} x={x(i)} y={ySum + G.fontBit * 0.32}
                  textAnchor="middle"
                  fill="var(--amber-300)" opacity={a}
                  fontFamily="var(--font-mono)" fontSize={G.fontBit}>
              {b}
            </text>
          );
        })}

        {/* Carry-out tokens — slide from above-column-c LEFT into column c−1.
            For each column c (msb=0..lsb=3) with CARRY_OUT[c]=1 we draw a
            "1" that appears above col c after it's processed, then slides
            up-and-left to land above col c−1 (its destination). */}
        {[1, 2, 3].map((srcCol) => {
          // srcCol is the column producing the carry (lsb=3,2,1). It slides
          // INTO srcCol−1.
          if (CARRY_OUT[srcCol] === 0) return null;
          const dstCol = srcCol - 1;
          const tStart = colDoneT(srcCol);   // produced right when cursor leaves srcCol
          const tEnd = colStartT(dstCol);    // arrives right as cursor enters dstCol
          const slideT = clamp((localTime - tStart) / Math.max(0.1, tEnd - tStart), 0, 1);
          const appear = clamp((localTime - tStart) / 0.25, 0, 1);
          const xPos = x(srcCol) + (x(dstCol) - x(srcCol)) * slideT;
          const yPos = yCarry + (0 - 14) * slideT; // small rise as it slides
          return (
            <g key={`cy-${srcCol}`} opacity={appear}>
              <text x={xPos} y={yPos} textAnchor="middle"
                    fill="var(--rose-400)" fontFamily="var(--font-mono)"
                    fontSize={G.fontBit * 0.55}>
                1
              </text>
              {slideT > 0.05 && slideT < 0.95 && (
                <line x1={x(srcCol)} y1={yPos + 4}
                      x2={xPos} y2={yPos + 4}
                      stroke="var(--rose-400)" strokeWidth={1}
                      strokeDasharray="3 3" opacity={0.6}/>
              )}
            </g>
          );
        })}

        {/* Carry-in label row (small "carry" annotation) — show once first
            carry has arrived. */}
        <SvgFadeIn duration={0.4} delay={3.2}>
          <text x={gridLeft - 28} y={yCarry + 6} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">
            carry
          </text>
        </SvgFadeIn>

        {/* Row labels (A, B, Σ) on the left */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={gridLeft - 28} y={yA + 6} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">A</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={gridLeft - 28} y={ySum + 6} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.1em">Σ</text>
        </SvgFadeIn>

        {/* Decimal check appears just after the cursor finishes sweeping */}
        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={ySum + G.cellH + 36} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontRes}>
            decimal check:  5 + 7 = 12
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Why hardware cares — four FA blocks + ripple-carry chain ──────
function LongestPathBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 520, fontTitle: 12, fontLabel: 13,
        chainY: 250, chainXBase: 60, blockW: 110, blockH: 90, gap: 16,
        captionY: 470 }
    : { vbW: 1000, vbH: 360, fontTitle: 12, fontLabel: 13,
        chainY: 130, chainXBase: 90, blockW: 170, blockH: 110, gap: 30,
        captionY: 330 };

  // Light each carry segment in sequence — duration per segment.
  const segDur = 0.9;
  const segStart = (i) => 0.8 + i * segDur;
  const litFrac = (i) => clamp((localTime - segStart(i)) / 0.35, 0, 1);

  // Block label per bit position (LSB on left).
  const labels = ['FA0', 'FA1', 'FA2', 'FA3'];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: G.fontTitle,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        why hardware cares
      </FadeUp>

      <svg width={G.vbW} height={G.vbH - 80}
           viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Four FA blocks in a row — LSB on left. */}
        {[0, 1, 2, 3].map((i) => {
          const bx = G.chainXBase + i * (G.blockW + G.gap);
          const by = G.chainY - G.blockH / 2;
          const lit = litFrac(i);
          return (
            <g key={i}>
              <rect x={bx} y={by} width={G.blockW} height={G.blockH}
                    rx={8}
                    fill="var(--bg-canvas)"
                    stroke={lit > 0.5 ? 'var(--amber-400)' : 'var(--chalk-300)'}
                    strokeWidth={lit > 0.5 ? 2.4 : 1.5}/>
              <text x={bx + G.blockW / 2} y={by + G.blockH / 2 + 6}
                    textAnchor="middle"
                    fill={lit > 0.5 ? 'var(--amber-300)' : 'var(--chalk-200)'}
                    fontFamily="var(--font-mono)" fontSize={20}
                    letterSpacing="0.05em">
                {labels[i]}
              </text>
              {/* A_i, B_i input labels at the top */}
              <text x={bx + G.blockW * 0.32} y={by - 8} textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontLabel}>
                A<tspan baselineShift="sub" fontSize={G.fontLabel * 0.7}>{i}</tspan>
              </text>
              <text x={bx + G.blockW * 0.68} y={by - 8} textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontLabel}>
                B<tspan baselineShift="sub" fontSize={G.fontLabel * 0.7}>{i}</tspan>
              </text>
              {/* S_i output below */}
              <text x={bx + G.blockW / 2} y={by + G.blockH + 22} textAnchor="middle"
                    fill={lit > 0.5 ? 'var(--amber-300)' : 'var(--chalk-300)'}
                    fontFamily="var(--font-serif)" fontStyle="italic"
                    fontSize={G.fontLabel}>
                S<tspan baselineShift="sub" fontSize={G.fontLabel * 0.7}>{i}</tspan>
              </text>
            </g>
          );
        })}

        {/* Carry chain segments between adjacent blocks. Carry out of FA_i
            into FA_{i+1}: short horizontal segment connecting them. We have
            3 segments between 4 blocks. */}
        {[0, 1, 2].map((i) => {
          const xA = G.chainXBase + i * (G.blockW + G.gap) + G.blockW;
          const xB = G.chainXBase + (i + 1) * (G.blockW + G.gap);
          const y = G.chainY;
          // Use the LATER block's lit value (i+1) as the carry-arrival cue.
          const lit = litFrac(i + 1);
          return (
            <g key={`seg-${i}`}>
              <line x1={xA} y1={y} x2={xB} y2={y}
                    stroke={lit > 0.05 ? 'var(--rose-400)' : 'var(--chalk-300)'}
                    strokeWidth={lit > 0.05 ? 2.6 : 1.5}
                    opacity={lit > 0.05 ? Math.min(1, lit + 0.2) : 0.7}/>
              {lit > 0.4 && (
                <text x={(xA + xB) / 2} y={y - 10} textAnchor="middle"
                      fill="var(--rose-300)" fontFamily="var(--font-mono)"
                      fontSize={11} letterSpacing="0.08em">
                  C<tspan baselineShift="sub" fontSize={8}>{i + 1}</tspan>
                </text>
              )}
            </g>
          );
        })}

        {/* C_in label on the leftmost side */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.chainXBase - 12} y={G.chainY + 5} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">
            C<tspan baselineShift="sub" fontSize={8}>in</tspan>=0
          </text>
        </SvgFadeIn>

        {/* C_out label on the right of FA3 */}
        {litFrac(3) > 0.4 && (
          <SvgFadeIn duration={0.3} delay={0}>
            <text x={G.chainXBase + 4 * G.blockW + 3 * G.gap + 6}
                  y={G.chainY + 5} textAnchor="start"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.08em">
              C<tspan baselineShift="sub" fontSize={8}>out</tspan>
            </text>
          </SvgFadeIn>
        )}
      </svg>

      <FadeUp duration={0.5} delay={4.5} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '28ch' : '52ch', lineHeight: 1.35,
        }}>
        the longest carry chain sets the adder's worst-case delay
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch',
          lineHeight: 1.3,
        }}>
        School-book addition, just two digits.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--amber-300)', textAlign: 'center',
          maxWidth: portrait ? '28ch' : '48ch', lineHeight: 1.4,
          letterSpacing: '0.02em',
        }}>
        the carry is how column k tells column k+1 about the overflow
      </FadeUp>
    </div>
  );
}

// Expose narration for TTS / subtitle export.
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
