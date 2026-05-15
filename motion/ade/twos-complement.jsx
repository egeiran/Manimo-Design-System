// Two's Complement: How Computers Carry a Minus Sign — Manimo lesson scene.
// Negation = NOT then +1. Genuine motion lives in Beat 3, where the value
// sweeps from −8 up to +7 and back; the bit cells flip individually as the
// pattern changes, the live decimal value updates, and a marker dot slides
// along a number line in lock-step. Beat 4 then animates a 5 + (−3) = 2
// addition column-by-column with the carry chain rippling left-to-right.
//
// Beats (timed to single-track narration in motion/ade/audio/twos-complement/):
//    0.00– 7.40  Manimo intro + hook caption
//    7.40–20.76  NOT then +1 worked example: 0011 → 1100 → 1101 (= −3)
//   20.76–33.89  Sweep all 16 4-bit values; bits + decimal + number-line dot move  (genuine motion)
//   33.89–43.46  5 + (−3) = 2 addition with rippling carry  (genuine motion)
//   43.46–51.00  Takeaway
//
// Authoring notes:
//   • SvgFadeIn for elements inside <svg>; FadeUp for HTML/DOM only.
//   • BitRow draws a row of N bit cells centred at (cx, cy). Cells re-render
//     as their boolean value changes; the cell border tints rose for the
//     sign bit (MSB) when it is set.
//   • Beat 3 sweeps a triangle wave across signed 4-bit values, so the dot
//     and the bits stay in sync and viewers see −8…+7 traversed twice.

const SCENE_DURATION = 51;

const NARRATION = [
  /*  0.00– 7.40 */ "Computers only store ones and zeros — so where does the minus sign come from? Two's complement is the trick.",
  /*  7.40–20.76 */ "To negate a number, flip every bit, then add one. Take three: zero zero one one. Flipped: one one zero zero. Plus one: one one zero one — that is minus three.",
  /* 20.76–33.89 */ "Sweep through every 4 bit pattern from minus eight to plus seven. The most significant bit acts like a sign — zero on the positives, one on the negatives — and the value wraps cleanly around at minus eight.",
  /* 33.89–43.46 */ "The pay off — addition just works. Five plus minus three: line up the bits, ripple the carries, and you land on two with no special case for the sign.",
  /* 43.46–51.00 */ "Flip and add one — that one rule lets a computer subtract using only the same adder it uses to add.",
];

const NARRATION_AUDIO = 'audio/twos-complement/scene.mp3';

const BITS = 4;

// Pad a value to BITS-bit binary string (handles negatives via 2-comp).
function toBits(n, bits = BITS) {
  const mask = (1 << bits) - 1;
  const v = n & mask;
  return v.toString(2).padStart(bits, '0');
}

// Interpret a BITS-bit unsigned pattern as signed two's complement.
function asSigned(uint) {
  const sign = (uint >> (BITS - 1)) & 1;
  return sign ? uint - (1 << BITS) : uint;
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="binary numbers"
      title="Two's Complement: How Computers Carry a Minus Sign"
      duration={SCENE_DURATION}
      introEnd={7.40}
      introCaption="Where does the minus sign live in a row of bits?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.40} end={20.76}>
        <NegateBeat />
      </Sprite>

      <Sprite start={20.76} end={33.89}>
        <SweepBeat />
      </Sprite>

      <Sprite start={33.89} end={43.46}>
        <AdditionBeat />
      </Sprite>

      <Sprite start={43.46} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared: BitRow ───────────────────────────────────────────────────────
// Render `bits` (string of '0'/'1') as a row of cells centred at (cx, cy).
// `signTint` paints the MSB cell border rose when its bit is 1, otherwise
// amber — gives the sign-bit a visual identity in Beats 3 and 4.
function BitRow({ cx, cy, bits, cellW = 50, cellH = 56, gap = 8,
                  fontSize = 30, color = 'var(--chalk-100)',
                  signTint = false, opacityAt = null }) {
  const N = bits.length;
  const totalW = N * cellW + (N - 1) * gap;
  const left = cx - totalW / 2;
  return (
    <g>
      {Array.from(bits).map((b, i) => {
        const isMsb = i === 0;
        const x = left + i * (cellW + gap);
        const stroke = signTint && isMsb && b === '1'
          ? 'var(--rose-400)'
          : (signTint && isMsb ? 'var(--amber-400)' : 'var(--chalk-300)');
        const strokeW = signTint && isMsb ? 2 : 1.4;
        const op = (opacityAt && opacityAt(i)) ?? 1;
        return (
          <g key={i} opacity={op}>
            <rect x={x} y={cy - cellH / 2} width={cellW} height={cellH}
                  fill="rgba(232,220,193,0.04)"
                  stroke={stroke} strokeWidth={strokeW} rx={4}/>
            <text x={x + cellW / 2} y={cy + fontSize * 0.36}
                  textAnchor="middle"
                  fill={color} fontFamily="var(--font-mono)"
                  fontSize={fontSize}>{b}</text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Beat 2: Negate worked example (0011 → 1100 → 1101 = −3) ──────────────
function NegateBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 620, vbH: 720,
        cx: 310, row1Y: 130, row2Y: 320, row3Y: 510,
        cellW: 60, cellH: 70, fontSize: 36,
        captionY: 700 }
    : { vbW: 1180, vbH: 460,
        cx: 540, row1Y: 90, row2Y: 220, row3Y: 350,
        cellW: 56, cellH: 64, fontSize: 32,
        captionY: 440 };

  // Per-bit flip pulses: for bits in row 2 (NOT) the cells transition from
  // their original bit to the flipped bit between t=2.6 and t=2.6+0.7s.
  // We just lerp the cell opacity briefly to suggest the flip.
  const flipPulse = (i) => {
    const t0 = 2.6 + i * 0.12;
    const t = localTime - t0;
    if (t < 0) return 0.0;
    if (t < 0.45) {
      const k = t / 0.45;
      return 0.35 + 0.65 * k;
    }
    return 1.0;
  };
  // Per-bit pulse for row 3 (+1 with carry).
  const carryPulse = (i) => {
    // Right-to-left ripple: i=3 (LSB) at 5.8, then i=2 at 6.0, etc.
    const t0 = 5.8 + (BITS - 1 - i) * 0.18;
    const t = localTime - t0;
    if (t < 0) return 0.0;
    if (t < 0.45) {
      const k = t / 0.45;
      return 0.35 + 0.65 * k;
    }
    return 1.0;
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Section title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.cx} y={G.row1Y - G.cellH / 2 - 24}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">NEGATE  =  NOT  +  1</text>
        </SvgFadeIn>

        {/* Row 1: +3 = 0011 */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.cx - (BITS * G.cellW + (BITS - 1) * 8) / 2 - 28}
                y={G.row1Y + 8} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={28}>+3</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <BitRow cx={G.cx} cy={G.row1Y} bits="0011"
                  cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}/>
        </SvgFadeIn>

        {/* Row 2: NOT → 1100 (cells flip in sequence) */}
        <SvgFadeIn duration={0.4} delay={2.0}>
          <text x={G.cx - (BITS * G.cellW + (BITS - 1) * 8) / 2 - 28}
                y={G.row2Y + 8} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={24}>~ flip</text>
        </SvgFadeIn>
        <BitRow cx={G.cx} cy={G.row2Y} bits="1100" color="var(--rose-300)"
                cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}
                opacityAt={flipPulse}/>

        {/* Row 3: +1 → 1101 (LSB toggles, ripple shown) */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.cx - (BITS * G.cellW + (BITS - 1) * 8) / 2 - 28}
                y={G.row3Y + 8} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={24}>+1</text>
        </SvgFadeIn>
        <BitRow cx={G.cx} cy={G.row3Y} bits="1101" color="var(--amber-300)"
                signTint
                cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}
                opacityAt={carryPulse}/>

        {/* Carry arrow above row 3 LSB */}
        {localTime > 5.4 && (
          <SvgFadeIn duration={0.3} delay={5.4}>
            <text x={G.cx + (BITS - 1) * (G.cellW + 8) / 2 + G.cellW / 2 - 4}
                  y={G.row3Y - G.cellH / 2 - 8}
                  textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={13}>↓ +1</text>
          </SvgFadeIn>
        )}

        {/* Conclusion */}
        <SvgFadeIn duration={0.5} delay={8.0}>
          <text x={G.cx + (BITS * G.cellW + (BITS - 1) * 8) / 2 + 28}
                y={G.row3Y + 10}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={36}>= −3</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={9.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            flip every bit, then add one — and you have the negative
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Sweep all 16 patterns from −8 to +7 and back ────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 620, vbH: 720,
        bitsCx: 310, bitsCy: 240,
        decX: 310, decY: 100,
        nlX: 70, nlY: 540, nlW: 480,
        cellW: 80, cellH: 90, fontSize: 48,
        captionY: 690 }
    : { vbW: 1180, vbH: 460,
        bitsCx: 590, bitsCy: 200,
        decX: 590, decY: 80,
        nlX: 200, nlY: 350, nlW: 780,
        cellW: 76, cellH: 86, fontSize: 46,
        captionY: 440 };

  // Triangle wave: 0..15..0 over the beat (so the value 4-bit-pattern wraps).
  const SETUP = 0.6;
  const t = Math.max(0, localTime - SETUP);
  const PERIOD = Math.max(spriteDur - SETUP - 0.5, 4);
  const phase = (t % PERIOD) / PERIOD;
  const tri = phase < 0.5 ? phase * 2 : 2 - phase * 2;
  // Step through the 16 unsigned patterns 0..15 and interpret as signed.
  // Walk in signed order: −8, −7, …, 7. This means the pattern sequence is
  // 1000, 1001, 1010, …, 1111, 0000, 0001, …, 0111.
  const idx = Math.min(15, Math.floor(tri * 16));
  const signed = idx - 8;                 // −8..+7
  const uintPattern = signed & 0xF;       // 4-bit two's-complement
  const bits = toBits(uintPattern);

  // Number-line geometry.
  const NL_MIN = -8, NL_MAX = 7;
  const dotX = G.nlX + ((signed - NL_MIN) / (NL_MAX - NL_MIN)) * G.nlW;
  const NL_TICKS = 16;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Section title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.bitsCx} y={G.bitsCy - G.cellH / 2 - 70}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">4-BIT TWO'S COMPLEMENT</text>
        </SvgFadeIn>

        {/* Live decimal value (above) */}
        <text x={G.decX} y={G.decY} textAnchor="middle"
              fill={signed < 0 ? 'var(--rose-300)' : 'var(--amber-300)'}
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 64 : 60}>
          {signed >= 0 ? '+' : ''}{signed}
        </text>

        {/* Bit row */}
        <BitRow cx={G.bitsCx} cy={G.bitsCy} bits={bits} signTint
                cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}/>

        {/* Bit-position labels under each cell */}
        <SvgFadeIn duration={0.3} delay={0.3}>
          {Array.from(bits).map((_, i) => {
            const totalW = BITS * G.cellW + (BITS - 1) * 8;
            const left = G.bitsCx - totalW / 2;
            const x = left + i * (G.cellW + 8) + G.cellW / 2;
            const place = i === 0 ? '−2³' : `2${['','¹','²'][BITS - 1 - i] || ''}`;
            // Use unicode superscript characters so we don't need MathJax.
            const labels = ['−2³', '2²', '2¹', '2⁰'];
            return (
              <text key={i} x={x} y={G.bitsCy + G.cellH / 2 + 22}
                    textAnchor="middle"
                    fill={i === 0 ? 'var(--rose-300)' : 'var(--chalk-300)'}
                    fontFamily="var(--font-mono)" fontSize={13}
                    letterSpacing="0.05em">{labels[i]}</text>
            );
          })}
        </SvgFadeIn>

        {/* MSB sign-bit callout */}
        <SvgFadeIn duration={0.3} delay={0.6}>
          <text x={G.bitsCx - (BITS * G.cellW + (BITS - 1) * 8) / 2 + G.cellW / 2}
                y={G.bitsCy - G.cellH / 2 - 12}
                textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">SIGN BIT</text>
        </SvgFadeIn>

        {/* Number line */}
        <line x1={G.nlX} y1={G.nlY} x2={G.nlX + G.nlW} y2={G.nlY}
              stroke="var(--chalk-200)" strokeWidth={1.6}/>
        {Array.from({ length: NL_TICKS }).map((_, i) => {
          const v = NL_MIN + i;
          const x = G.nlX + (i / (NL_TICKS - 1)) * G.nlW;
          const isZero = v === 0;
          return (
            <g key={i}>
              <line x1={x} y1={G.nlY - 6} x2={x} y2={G.nlY + (isZero ? 10 : 6)}
                    stroke={isZero ? 'var(--chalk-100)' : 'var(--chalk-300)'}
                    strokeWidth={isZero ? 1.4 : 1}/>
              {(v === NL_MIN || v === 0 || v === NL_MAX) && (
                <text x={x} y={G.nlY + 26} textAnchor="middle"
                      fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                      fontSize={12}>{v}</text>
              )}
            </g>
          );
        })}
        {/* Sliding indicator dot */}
        <circle cx={dotX} cy={G.nlY} r={6.5}
                fill={signed < 0 ? 'var(--rose-400)' : 'var(--amber-300)'}
                stroke={signed < 0 ? 'var(--rose-300)' : 'var(--amber-400)'}
                strokeWidth={1.5}/>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={8.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            MSB = 1 → negative half. MSB = 0 → non-negative half.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: 5 + (−3) = 2 with rippling carry ────────────────────────────
function AdditionBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 620, vbH: 720,
        cx: 320, row1Y: 160, row2Y: 290, divY: 360, row3Y: 430,
        cellW: 70, cellH: 76, fontSize: 36,
        captionY: 700 }
    : { vbW: 1180, vbH: 460,
        cx: 540, row1Y: 110, row2Y: 200, divY: 250, row3Y: 320,
        cellW: 64, cellH: 70, fontSize: 32,
        captionY: 440 };

  // Compute the per-column carry chain for 5 + (-3) = 0101 + 1101.
  const a = '0101', b = '1101';
  const carries = [0]; // carries[i] is carry INTO column i (rightmost first).
  let c = 0;
  const sumBits = [];
  for (let k = BITS - 1; k >= 0; k--) {
    const ai = parseInt(a[k]);
    const bi = parseInt(b[k]);
    const s = ai + bi + c;
    sumBits.unshift(String(s & 1));
    c = s >> 1;
    carries.unshift(c);   // carry OUT of this column = carry INTO next
  }
  // Final overflow carry-out is carries[0]; result row is sumBits.

  // Per-bit reveal pulse (right→left ripple).
  const carryPulse = (i) => {
    const t0 = 1.6 + (BITS - 1 - i) * 0.30;
    const t = localTime - t0;
    if (t < 0) return 0.0;
    if (t < 0.5) return 0.35 + 0.65 * (t / 0.5);
    return 1;
  };

  // Carry-into-column glyphs above row 3.
  const totalW = BITS * G.cellW + (BITS - 1) * 8;
  const left = G.cx - totalW / 2;
  const cellCenterX = (i) => left + i * (G.cellW + 8) + G.cellW / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Section title */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.cx} y={G.row1Y - G.cellH / 2 - 22}
                textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">5 + (−3) = 2  (ADD AS USUAL)</text>
        </SvgFadeIn>

        {/* Row 1: 5 = 0101 */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={left - 28} y={G.row1Y + 8} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={26}>+5</text>
          <BitRow cx={G.cx} cy={G.row1Y} bits={a}
                  cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}/>
        </SvgFadeIn>

        {/* Row 2: −3 = 1101 */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={left - 28} y={G.row2Y + 8} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={26}>−3</text>
          <BitRow cx={G.cx} cy={G.row2Y} bits={b} color="var(--rose-300)"
                  signTint
                  cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}/>
        </SvgFadeIn>

        {/* Divider line */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <line x1={left - 18} y1={G.divY}
                x2={left + totalW + 18} y2={G.divY}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
        </SvgFadeIn>

        {/* Carry-into-column glyphs above the result row, rippling in */}
        {carries.slice(1).map((cIn, i) => (
          // carries.slice(1) starts at carry INTO column 0 .. column 3 → matches cellCenterX(i)
          <g key={i} opacity={carryPulse(i)}>
            <text x={cellCenterX(i)} y={G.row3Y - G.cellH / 2 - 12}
                  textAnchor="middle"
                  fill={cIn ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={12}>
              {cIn ? '↓1' : '·'}
            </text>
          </g>
        ))}

        {/* Result row: ripple-revealed sum bits */}
        <BitRow cx={G.cx} cy={G.row3Y} bits={sumBits.join('')}
                color="var(--amber-300)" signTint
                cellW={G.cellW} cellH={G.cellH} fontSize={G.fontSize}
                opacityAt={carryPulse}/>

        {/* Drop-the-overflow note */}
        {localTime > 4.4 && (
          <SvgFadeIn duration={0.4} delay={4.4}>
            <text x={left - 18} y={G.row3Y + 8} textAnchor="end"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={26}>= +2</text>
            {/* Carry-out drop annotation, off the left of the result row */}
            <text x={left - 18} y={G.row3Y - G.cellH / 2 - 12}
                  textAnchor="end"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.08em">drop ↶ {carries[0]}</text>
          </SvgFadeIn>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the extra carry off the left simply falls away
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Flip and add one — and subtraction comes free.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (an N-bit two's-complement register covers −2^(N−1) to 2^(N−1)−1)
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
