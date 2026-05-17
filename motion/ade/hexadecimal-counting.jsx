// Counting in Hexadecimal: Four Bits, One Symbol — Manimo lesson scene.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js once
// audio is generated):
//    0.00– 4.00  Manimo enters; hook caption
//    4.00–13.00  Decimal vs hex place-value recap (173 = 0xAD)
//   13.00–28.00  4-bit nibble counter ticks 0000..1111, hex digit + decimal update live
//   28.00–40.00  8-bit byte splits into two nibbles, each → hex digit (10101101 → 0xAD)
//   40.00–48.00  Takeaway
//
// Authoring notes:
//   • SvgFadeIn for SVG children, FadeUp for HTML. SceneChrome owns chrome.

const SCENE_DURATION = 39;

const NARRATION = [
  /*  0.00– 5.31 */ 'Why do programmers write addresses and bytes in hexadecimal instead of plain decimal?',
  /*  5.31–13.86 */ 'Decimal is base ten — every column is a power of ten. Hexadecimal is base sixteen — every column is a power of sixteen.',
  /* 13.86–22.47 */ 'A four bit nibble runs from zero zero zero zero to one one one one — sixteen patterns. Each one gets exactly one hex symbol.',
  /* 22.47–29.73 */ 'An eight bit byte splits into two nibbles — pack each one into a hex symbol and the whole byte fits in two characters.',
  /* 29.73–39.00 */ 'Four bits per symbol, two symbols per byte — that is why memory addresses, colour codes, and machine code are written in hex.',
];

const HEX_SYMBOLS = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F'];

const NARRATION_AUDIO = 'audio/hexadecimal-counting/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="binary numbers"
      title="Counting in Hexadecimal"
      duration={SCENE_DURATION}
      introEnd={5.31}
      introCaption="Why is everything in 0x… ?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.31} end={13.86}>
        <PlaceValueRecapBeat />
      </Sprite>

      <Sprite start={13.86} end={22.47}>
        <NibbleCounterBeat />
      </Sprite>

      <Sprite start={22.47} end={29.73}>
        <ByteSplitBeat />
      </Sprite>

      <Sprite start={29.73} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Decimal vs hex place-value comparison ────────────────────────
function PlaceValueRecapBeat() {
  const portrait = usePortrait();
  const labelStyle = {
    fontFamily: 'var(--font-sans)', textTransform: 'uppercase',
    letterSpacing: '0.14em', fontSize: portrait ? 11 : 12,
    color: 'var(--amber-300)',
  };
  const monoBase = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
    color: 'var(--chalk-100)',
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
      maxWidth: portrait ? 540 : 'none',
    }}>
      <FadeUp duration={0.5} delay={0.1} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 34 : 44, color: 'var(--chalk-100)',
        }}>
        173
      </FadeUp>

      <div style={{ display: 'flex', flexDirection: 'column',
                    gap: portrait ? 18 : 24, alignItems: 'center' }}>
        {/* Decimal row */}
        <FadeUp duration={0.5} delay={0.4} distance={10}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={labelStyle}>decimal · base 10</div>
          <div style={monoBase}>1·100 + 7·10 + 3·1</div>
        </FadeUp>

        {/* Hex row — two lines so the equals sign sits on its own */}
        <FadeUp duration={0.5} delay={2.5} distance={10}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={labelStyle}>hex · base 16</div>
          <div style={monoBase}>
            <span style={{ color: 'var(--amber-300)' }}>0xAD</span>
            {' = '}
            <span style={{ color: 'var(--amber-300)' }}>A</span>·16
            {' + '}
            <span style={{ color: 'var(--amber-300)' }}>D</span>·1
          </div>
          <div style={{ ...monoBase, fontSize: portrait ? 15 : 18, color: 'var(--chalk-300)' }}>
            = 10·16 + 13·1
          </div>
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={5.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          textAlign: 'center',
          maxWidth: portrait ? '30ch' : 'none',
        }}>
        same value, two different alphabets
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: 4-bit nibble counter ─────────────────────────────────────────
function NibbleCounterBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Counter ticks from value 0 to 15 over localTime 0.6 .. 7.0 (about 0.4s
  // per step — quick but readable). After 7.0, hold at 15.
  const tickStart = 0.6;
  const tickEnd = 7.0;
  const frac = clamp((localTime - tickStart) / (tickEnd - tickStart), 0, 1);
  const value = Math.min(15, Math.floor(frac * 16));
  const bits = [3, 2, 1, 0].map(b => (value >> b) & 1); // MSB first

  const G = portrait
    ? { vbW: 600, vbH: 540,
        bitCellW: 70, bitCellH: 80, bitGap: 14, bitY: 80,
        hexFontSize: 110, hexCx: 300, hexCy: 280,
        decY: 410, decFontSize: 24,
        stripY: 470, stripCellW: 32, stripCellH: 38, stripGap: 4 }
    : { vbW: 940, vbH: 460,
        bitCellW: 78, bitCellH: 86, bitGap: 16, bitY: 80,
        hexFontSize: 140, hexCx: 740, hexCy: 200,
        decY: 320, decFontSize: 28,
        stripY: 380, stripCellW: 40, stripCellH: 44, stripGap: 6 };

  // Position the 4-bit row centred horizontally in the bit area.
  const bitTotal = G.bitCellW * 4 + G.bitGap * 3;
  const bitStartX = portrait
    ? (G.vbW - bitTotal) / 2
    : 60;
  // Position the 16-symbol strip centred.
  const stripTotal = G.stripCellW * 16 + G.stripGap * 15;
  const stripStartX = (G.vbW - stripTotal) / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* 4-bit row */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          {bits.map((b, i) => {
            const x = bitStartX + i * (G.bitCellW + G.bitGap);
            const on = b === 1;
            return (
              <g key={i}>
                <rect x={x} y={G.bitY} width={G.bitCellW} height={G.bitCellH}
                      rx={6}
                      fill={on ? 'var(--amber-400)' : 'rgba(232,220,193,0.04)'}
                      stroke={on ? 'var(--amber-300)' : 'rgba(232,220,193,0.18)'}
                      strokeWidth={on ? 2 : 1.2}/>
                <text x={x + G.bitCellW / 2} y={G.bitY + G.bitCellH / 2 + 14}
                      textAnchor="middle"
                      fill={on ? 'var(--bg-canvas)' : 'var(--chalk-200)'}
                      fontFamily="var(--font-mono)" fontSize={38} fontWeight={on ? 600 : 400}>
                  {b}
                </text>
                <text x={x + G.bitCellW / 2} y={G.bitY - 8} textAnchor="middle"
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>
                  bit {3 - i}
                </text>
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Hex symbol — big, centred (landscape: to the right of bits) */}
        <SvgFadeIn duration={0.5} delay={0.6}>
          <text x={G.hexCx} y={G.hexCy} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.hexFontSize}>
            {HEX_SYMBOLS[value]}
          </text>
          <text x={G.hexCx} y={G.hexCy + G.hexFontSize * 0.45} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}
                letterSpacing="0.18em">
            HEX
          </text>
        </SvgFadeIn>

        {/* Decimal readout */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.vbW / 2} y={G.decY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.decFontSize}>
            decimal = <tspan fill="var(--amber-300)">{value}</tspan>
          </text>
        </SvgFadeIn>

        {/* 16-symbol alphabet strip with active highlight */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          {HEX_SYMBOLS.map((sym, i) => {
            const x = stripStartX + i * (G.stripCellW + G.stripGap);
            const active = i === value;
            return (
              <g key={i}>
                <rect x={x} y={G.stripY} width={G.stripCellW} height={G.stripCellH}
                      rx={4}
                      fill={active ? 'var(--amber-400)' : 'rgba(232,220,193,0.03)'}
                      stroke={active ? 'var(--amber-300)' : 'rgba(232,220,193,0.14)'}
                      strokeWidth={active ? 1.6 : 1}/>
                <text x={x + G.stripCellW / 2} y={G.stripY + G.stripCellH / 2 + 6}
                      textAnchor="middle"
                      fill={active ? 'var(--bg-canvas)' : 'var(--chalk-200)'}
                      fontFamily="var(--font-mono)"
                      fontSize={active ? 18 : 16} fontWeight={active ? 700 : 400}>
                  {sym}
                </text>
              </g>
            );
          })}
        </SvgFadeIn>

        {/* Caption — appears once the counter has reached F */}
        <SvgFadeIn duration={0.4} delay={7.2}>
          <text x={G.vbW / 2} y={G.vbH - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            sixteen patterns → sixteen symbols, 0 through F
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: 8-bit byte → two nibbles → two hex digits ───────────────────
function ByteSplitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // The byte we'll unpack: 1010 1101 = 0xAD = 173.
  const BYTE = [1,0,1,0, 1,1,0,1];

  // Stages (compressed to fit the ~7.3s audio window):
  //   0.0..0.6  bits fade in as a single 8-bit row
  //   0.8..1.5  gap opens between bit 3 and bit 4 (nibble split)
  //   1.7..    left nibble symbol "A" pops up under the left group
  //   2.4..    right nibble symbol "D" pops up under the right group
  //   3.6..    final byte formula "10101101 = 0xAD = 173" fades in
  //   5.2..    caption "every byte → two hex digits" fades in
  const splitT = clamp((localTime - 0.8) / 0.7, 0, 1);
  const gapWidth = portrait ? 32 : 56;
  const actualGap = gapWidth * splitT;

  const G = portrait
    ? { vbW: 600, vbH: 580,
        bitCellW: 50, bitCellH: 60, bitGap: 6, rowY: 90,
        nibbleSymY: 240, nibbleSymSize: 88,
        nibbleLabelY: 320,
        formulaY: 410, formulaSize: 22, captionY: 520 }
    : { vbW: 940, vbH: 420,
        bitCellW: 60, bitCellH: 70, bitGap: 8, rowY: 80,
        nibbleSymY: 230, nibbleSymSize: 92,
        nibbleLabelY: 310,
        formulaY: 340, formulaSize: 26, captionY: 395 };

  // Width of one half (4 bits + 3 gaps).
  const halfW = G.bitCellW * 4 + G.bitGap * 3;
  // Total width with current split gap.
  const totalW = halfW * 2 + actualGap;
  const startX = (G.vbW - totalW) / 2;

  // Each bit's x — first half then gap then second half.
  function bitX(i) {
    if (i < 4) return startX + i * (G.bitCellW + G.bitGap);
    return startX + halfW + actualGap + (i - 4) * (G.bitCellW + G.bitGap);
  }

  // Hex digits.
  const leftNibble = (BYTE[0] << 3) | (BYTE[1] << 2) | (BYTE[2] << 1) | BYTE[3];
  const rightNibble = (BYTE[4] << 3) | (BYTE[5] << 2) | (BYTE[6] << 1) | BYTE[7];
  const leftSym = HEX_SYMBOLS[leftNibble];
  const rightSym = HEX_SYMBOLS[rightNibble];

  const showLeftSym = localTime >= 1.7;
  const showRightSym = localTime >= 2.4;
  const showFormula = localTime >= 3.6;
  const showCaption = localTime >= 5.2;

  // Centres for the hex symbols — sit under each nibble's centre.
  const leftCentreX = startX + halfW / 2;
  const rightCentreX = startX + halfW + actualGap + halfW / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* The 8 bits */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          {BYTE.map((b, i) => {
            const x = bitX(i);
            const on = b === 1;
            const inLeftHalf = i < 4;
            const tint = inLeftHalf ? 'var(--amber-300)' : 'var(--rose-300)';
            return (
              <g key={i}>
                <rect x={x} y={G.rowY} width={G.bitCellW} height={G.bitCellH}
                      rx={6}
                      fill={on ? (inLeftHalf ? 'var(--amber-400)' : 'var(--rose-400)') : 'rgba(232,220,193,0.04)'}
                      stroke={on ? tint : 'rgba(232,220,193,0.2)'}
                      strokeWidth={on ? 1.8 : 1}/>
                <text x={x + G.bitCellW / 2} y={G.rowY + G.bitCellH / 2 + 11}
                      textAnchor="middle"
                      fill={on ? 'var(--bg-canvas)' : 'var(--chalk-200)'}
                      fontFamily="var(--font-mono)" fontSize={30} fontWeight={on ? 600 : 400}>
                  {b}
                </text>
              </g>
            );
          })}
          {/* Bit position labels under each cell */}
          {BYTE.map((_, i) => {
            const x = bitX(i);
            return (
              <text key={`l${i}`} x={x + G.bitCellW / 2} y={G.rowY + G.bitCellH + 16}
                    textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={10}>
                {7 - i}
              </text>
            );
          })}
        </SvgFadeIn>

        {/* Group brackets (after split) */}
        {splitT > 0.2 && (
          <g opacity={Math.min(1, (splitT - 0.2) / 0.4)}>
            <text x={leftCentreX} y={G.rowY - 14} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize={11}
                  letterSpacing="0.16em">
              UPPER NIBBLE
            </text>
            <text x={rightCentreX} y={G.rowY - 14} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={11}
                  letterSpacing="0.16em">
              LOWER NIBBLE
            </text>
          </g>
        )}

        {/* Hex symbol pop-ups under each nibble */}
        {showLeftSym && (
          <g>
            <text x={leftCentreX} y={G.nibbleSymY} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={G.nibbleSymSize}>
              {leftSym}
            </text>
            <text x={leftCentreX} y={G.nibbleLabelY} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>
              1010 → {leftSym}
            </text>
          </g>
        )}
        {showRightSym && (
          <g>
            <text x={rightCentreX} y={G.nibbleSymY} textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={G.nibbleSymSize}>
              {rightSym}
            </text>
            <text x={rightCentreX} y={G.nibbleLabelY} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={12}>
              1101 → {rightSym}
            </text>
          </g>
        )}

        {/* Final formula */}
        {showFormula && (
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.formulaSize}>
            10101101<tspan baselineShift="sub" fontSize={G.formulaSize * 0.6}>2</tspan>
            {' = '}
            0x{leftSym}{rightSym}
            {' = '}
            173<tspan baselineShift="sub" fontSize={G.formulaSize * 0.6}>10</tspan>
          </text>
        )}

        {/* Caption */}
        {showCaption && (
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)" fontSize={14}
                letterSpacing="0.02em">
            every byte → two hex digits, no remainder
          </text>
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
          fontSize: portrait ? 28 : 34,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '44ch',
          lineHeight: 1.3,
        }}>
        4 bits per symbol · 2 symbols per byte.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (addresses, colour codes, machine code — all hex)
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
