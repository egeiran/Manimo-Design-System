// Two's Complement: Flip the Bits, Add One — Manimo lesson scene.
// 4-bit two's complement: to negate a number, invert every bit and add
// one. The same bit pattern means a different decimal under signed vs
// unsigned interpretation, and the leading bit acts as the sign.
// Genuine animation lives in Beat 3 (bits flipping one-by-one, then a
// +1 token rippling through the LSB) and Beat 4 (a counter that ticks
// through every 4-bit pattern while signed and unsigned decimal columns
// update on the right).
//
// Beats (timed to Mistral Voxtral narration in motion/ade/audio/twos-complement/):
//    0.00– 7.86  Manimo intro: where does the minus sign go?
//    7.86–16.64  Unsigned 4-bit: weights 8 4 2 1, 0101 = 5
//   16.64–35.38  Flip + add 1: 0101 → 1010 → 1011 = -5
//   35.38–56.31  Counter sweep: 0000..1111 with signed and unsigned columns
//   56.31–65.00  Takeaway: −x = ¬x + 1
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Each beat reads useSprite() localTime to drive its animation
//     (bit flips, +1 ripple, counter tick).

const SCENE_DURATION = 65;

const NARRATION = [
  /*  0.00– 7.86 */ "How do you write a negative number in a fixed-width register, without a separate minus-sign wire?",
  /*  7.86–16.64 */ "Start with unsigned: four bits, weights eight, four, two, one. 0 1 0 1 is four plus one, which is five.",
  /* 16.64–35.38 */ "To negate the number, first flip every bit — 0 1 0 1 becomes 1 0 1 0. Then add one. The plus one ripples through the low bit, landing at 1 0 1 1. That bit pattern is the two's complement of five: it represents minus five.",
  /* 35.38–56.31 */ "Tick a four-bit counter from zero up through fifteen. Read each pattern two ways — the same bits mean a different decimal under signed and unsigned interpretations. After binary 0 1 1 1 — that is plus seven — the next pattern 1 0 0 0 is minus eight in two's complement, and the counter has rolled all the way around.",
  /* 56.31–65.00 */ "Flip the bits, add one. The leading bit becomes the sign — and the same adder hardware now does subtraction for free.",
];

const NARRATION_AUDIO = 'audio/twos-complement/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="number systems"
      title="Two's Complement: Flip the Bits, Add One"
      duration={SCENE_DURATION}
      introEnd={7.86}
      introCaption="Four bits, one register — where does the minus sign go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.86} end={16.64}>
        <UnsignedBeat />
      </Sprite>

      <Sprite start={16.64} end={35.38}>
        <FlipAddBeat />
      </Sprite>

      <Sprite start={35.38} end={56.31}>
        <CounterBeat />
      </Sprite>

      <Sprite start={56.31} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────
// Convert a 4-bit unsigned value to its sign-magnitude reading under
// two's complement interpretation. Range −8..+7.
function signedOf4(u) { return u >= 8 ? u - 16 : u; }

// Convert an integer 0..15 to a 4-bit string with MSB on the left.
function bitsOf4(u) {
  let s = '';
  for (let i = 3; i >= 0; i--) s += ((u >> i) & 1).toString();
  return s;
}

// Single bit cell — a rounded square with the bit centred and (optionally)
// a small weight label above. Highlight when value === 1.
function BitCell({ x, y, w, h, value, weight, fontMain, fontWeight,
                   highlight = false, framed = true }) {
  const stroke = highlight ? 'var(--rose-300)' : 'var(--chalk-300)';
  const fill = value
    ? (highlight ? 'var(--rose-400)' : 'var(--amber-400)')
    : 'transparent';
  const textFill = value ? 'var(--bg-canvas)' : 'var(--chalk-200)';
  return (
    <g>
      {weight !== undefined && (
        <text x={x + w / 2} y={y - 14} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={fontWeight} letterSpacing="0.04em">{weight}</text>
      )}
      {framed && (
        <rect x={x} y={y} width={w} height={h} rx={6} ry={6}
              fill={fill} fillOpacity={value ? 0.85 : 0}
              stroke={stroke} strokeWidth={1.8}/>
      )}
      <text x={x + w / 2} y={y + h / 2 + fontMain * 0.36} textAnchor="middle"
            fill={textFill} fontFamily="var(--font-mono)"
            fontSize={fontMain}>{value}</text>
    </g>
  );
}

// ─── Beat 2: Unsigned 4-bit, 0101 = 5 ────────────────────────────────────
function UnsignedBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 460, x0: 130, y0: 160, w: 70, h: 80, gap: 14,
        fontMain: 32, fontWeight: 16, sumY: 360, fontSum: 26, captionY: 440 }
    : { vbW: 980, vbH: 380, x0: 220, y0: 120, w: 100, h: 110, gap: 22,
        fontMain: 44, fontWeight: 18, sumY: 290, fontSum: 30, captionY: 360 };

  // Bits left-to-right: b3 (MSB), b2, b1, b0 (LSB). 0101 → [0,1,0,1].
  const bits = [0, 1, 0, 1];
  const weights = [8, 4, 2, 1];
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Bit cells with weights */}
        {bits.map((v, i) => {
          const x = G.x0 + i * (G.w + G.gap);
          return (
            <SvgFadeIn key={i} duration={0.35} delay={0.3 + i * 0.15}>
              <BitCell x={x} y={G.y0} w={G.w} h={G.h} value={v}
                weight={weights[i]} fontMain={G.fontMain} fontWeight={G.fontWeight}
                highlight={v === 1}/>
            </SvgFadeIn>
          );
        })}

        {/* Equation below */}
        <SvgFadeIn duration={0.5} delay={2.6}>
          <text x={G.vbW / 2} y={G.sumY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontSum}>
            0101  =  4 + 1  =  5
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            unsigned: each bit's weight is a power of two
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Flip every bit, then add 1 ──────────────────────────────────
function FlipAddBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 720, x0: 130, y0: 250, w: 70, h: 80, gap: 14,
        fontMain: 32, fontWeight: 16,
        decimalY: 450, fontDecimal: 26, captionY: 690 }
    : { vbW: 1000, vbH: 460, x0: 230, y0: 140, w: 100, h: 110, gap: 22,
        fontMain: 44, fontWeight: 18,
        decimalY: 320, fontDecimal: 32, captionY: 440 };

  // Phase timing — all relative to sprite localTime.
  //   0.0..1.0   show 0101
  //   1.0..3.5   flip each bit in turn (b3, b2, b1, b0 — left to right)
  //   3.5..5.0   "ones' complement" annotation visible
  //   5.0..7.5   +1 token slides in and ripples through
  //   7.5..end   hold 1011 → -5 result
  const initialBits = [0, 1, 0, 1];
  const flippedBits = [1, 0, 1, 0];
  const finalBits = [1, 0, 1, 1];

  // Bit values per slot at the current time.
  function currentBit(i) {
    // Flip happens at flipStart[i].
    const flipStart = [1.0, 1.4, 1.8, 2.2];
    if (localTime < flipStart[i]) return initialBits[i];
    // After flip, bit holds flipped value until +1 carry potentially
    // changes it. The +1 ripple flips b0 first (carry generates), then
    // since b0 was 0, the carry stops there.
    const addStart = 5.0;
    if (localTime < addStart) return flippedBits[i];
    // After add — only b0 changes for 0101.
    const b0FlipAt = 5.8;
    if (i === 3) return localTime < b0FlipAt ? flippedBits[3] : finalBits[3];
    return finalBits[i];
  }

  // Carry pulse position. The +1 token slides horizontally ABOVE the bit
  // row from the right edge in to the LSB column, then fades — keeping
  // the LSB cell beneath visible the whole time. b0 flips at the moment
  // the token lands.
  const carryStart = 5.0;
  const slideEnd = 5.8;        // +1 reaches LSB column
  const carryGone = 6.2;       // +1 fully faded

  // Decimal readout — depends on phase.
  let decimalText;
  if (localTime < 1.0) decimalText = '0101 = 5';
  else if (localTime < 3.5) decimalText = 'flip every bit…';
  else if (localTime < 5.0) decimalText = '1010 = −6 ? not quite…';
  else if (localTime < 6.0) decimalText = '1010 + 1 …';
  else decimalText = '1011 = −5';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Bit cells (live) */}
        {[0, 1, 2, 3].map(i => {
          const x = G.x0 + i * (G.w + G.gap);
          const v = currentBit(i);
          // Highlight LSB while +1 is active.
          const isLsb = (i === 3);
          const highlight = (isLsb && localTime > carryStart && localTime < 6.8);
          return (
            <BitCell key={i} x={x} y={G.y0} w={G.w} h={G.h}
              value={v} fontMain={G.fontMain} fontWeight={G.fontWeight}
              highlight={highlight}/>
          );
        })}

        {/* Bit positions label */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.x0} y={G.y0 - 30}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.18em">MSB</text>
          <text x={G.x0 + 3 * (G.w + G.gap) + G.w} y={G.y0 - 30}
                textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.18em">LSB</text>
        </SvgFadeIn>

        {/* Flip annotations — a small "FLIP" badge for each bit just after it flips */}
        {[0, 1, 2, 3].map(i => {
          const flipStart = [1.0, 1.4, 1.8, 2.2];
          const a = clamp(1 - (localTime - flipStart[i]) / 0.8, 0, 1);
          if (a < 0.05 || localTime < flipStart[i]) return null;
          const x = G.x0 + i * (G.w + G.gap) + G.w / 2;
          return (
            <text key={`flip-${i}`} x={x} y={G.y0 + G.h + 28} textAnchor="middle"
                  opacity={a}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.16em">FLIP</text>
          );
        })}

        {/* +1 carry token sliding in from the right, ABOVE the bit row */}
        {localTime > carryStart && localTime < carryGone && (
          (() => {
            const rightX = G.x0 + 4 * (G.w + G.gap) + 40;
            const lsbCx = G.x0 + 3 * (G.w + G.gap) + G.w / 2;
            const slideFrac = clamp((localTime - carryStart) / (slideEnd - carryStart), 0, 1);
            const cx = rightX + (lsbCx - rightX) * slideFrac;
            const cy = G.y0 - 30;
            const opa = localTime < slideEnd
              ? 1
              : clamp(1 - (localTime - slideEnd) / (carryGone - slideEnd), 0, 1);
            return (
              <g opacity={opa}>
                <circle cx={cx} cy={cy} r={14}
                        fill="var(--bg-canvas)" stroke="var(--rose-400)" strokeWidth={2}/>
                <text x={cx} y={cy + 6} textAnchor="middle"
                      fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={14}>+1</text>
                {/* Drop arrow from token down to LSB once token has landed */}
                {slideFrac > 0.95 && (
                  <line x1={cx} y1={cy + 14} x2={cx} y2={G.y0 - 4}
                        stroke="var(--rose-400)" strokeWidth={1.6}
                        strokeDasharray="3 3" opacity={opa}/>
                )}
              </g>
            );
          })()
        )}

        {/* Decimal readout / phase caption */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.vbW / 2} y={G.decimalY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontDecimal}>
            {decimalText}
          </text>
        </SvgFadeIn>

        {/* Final caption (lives below) */}
        <SvgFadeIn duration={0.4} delay={7.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 16 : 18}>
            invert every bit, then add one — that's two's complement
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Counter sweep 0..15 with signed + unsigned readouts ─────────
function CounterBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 760, x0: 80, y0: 200, w: 80, h: 90, gap: 12,
        fontMain: 36, fontWeight: 16,
        readoutX: 130, readoutY: 410,
        readoutGap: 70, readoutFont: 22,
        captionY: 720 }
    : { vbW: 1100, vbH: 480, x0: 140, y0: 180, w: 90, h: 110, gap: 18,
        fontMain: 42, fontWeight: 18,
        readoutX: 660, readoutY: 200,
        readoutGap: 80, readoutFont: 24,
        captionY: 460 };

  // Counter advances every TICK seconds, starts after HOLD.
  const HOLD = 0.5;
  const TICK = (spriteDur - HOLD - 0.8) / 16;
  const idx = clamp(Math.floor((localTime - HOLD) / TICK), 0, 15);
  const fadeFrac = clamp(((localTime - HOLD) % TICK) / 0.18, 0, 1);

  const bits = [];
  for (let i = 0; i < 4; i++) bits.push((idx >> (3 - i)) & 1);
  const unsignedVal = idx;
  const signedVal = signedOf4(idx);
  const isSignedNegative = signedVal < 0;

  // Wrap-pulse animation at the 0111 → 1000 boundary.
  const wrapMoment = HOLD + TICK * 8;
  const wrapPulseAlpha = clamp(1 - Math.abs(localTime - wrapMoment) / 0.6, 0, 1);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Counter bit row */}
        {bits.map((v, i) => {
          const x = G.x0 + i * (G.w + G.gap);
          // Highlight MSB so the viewer sees it acting as a sign bit.
          const isMsb = (i === 0);
          return (
            <BitCell key={i} x={x} y={G.y0} w={G.w} h={G.h}
              value={v} fontMain={G.fontMain} fontWeight={G.fontWeight}
              highlight={isMsb && v === 1}/>
          );
        })}

        {/* MSB sign-bit annotation — only visible once we've hit a negative pattern */}
        {isSignedNegative && (
          <SvgFadeIn duration={0.3} delay={0.0}>
            <text x={G.x0 + G.w / 2} y={G.y0 - 14} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.16em">SIGN</text>
          </SvgFadeIn>
        )}

        {/* Wrap-point pulse (between 0111 and 1000) */}
        {wrapPulseAlpha > 0.05 && (
          <g opacity={wrapPulseAlpha}>
            <line x1={G.x0} y1={G.y0 + G.h + 12}
                  x2={G.x0 + 4 * (G.w + G.gap) - G.gap} y2={G.y0 + G.h + 12}
                  stroke="var(--rose-300)" strokeWidth={2}/>
            <text x={G.x0 + 2 * (G.w + G.gap)} y={G.y0 + G.h + 30} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={12} letterSpacing="0.18em">WRAP: +7 → −8</text>
          </g>
        )}

        {/* Signed + unsigned readout columns */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.readoutX} y={G.readoutY}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.18em">UNSIGNED</text>
          <text x={G.readoutX} y={G.readoutY + 30}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.readoutFont}
                opacity={0.4 + 0.6 * fadeFrac}>
            {unsignedVal}
          </text>
          <text x={G.readoutX} y={G.readoutY + G.readoutGap}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.18em">TWO'S COMPLEMENT</text>
          <text x={G.readoutX} y={G.readoutY + G.readoutGap + 30}
                fill={isSignedNegative ? 'var(--rose-300)' : 'var(--amber-300)'}
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.readoutFont}
                opacity={0.4 + 0.6 * fadeFrac}>
            {signedVal > 0 ? `+${signedVal}` : signedVal.toString()}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            same bits, two interpretations — flip the MSB and you flip the sign
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
          fontSize: portrait ? 38 : 56, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        −x = ¬x + 1
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '26ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        subtraction becomes addition — with the same adder hardware
      </FadeUp>

      <FadeUp duration={0.5} delay={2.8} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        the leading bit becomes the sign
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
