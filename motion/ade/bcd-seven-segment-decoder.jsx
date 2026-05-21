// BCD to 7-Segment: Four Bits, Seven Lamps — Manimo lesson scene.
// A 4-bit binary-coded decimal value (0–9) drives seven Boolean outputs,
// one per segment of a digit display. Beat 4 carries the genuine motion:
// the BCD input increments 0 → 9 in real time and the seven segments
// independently light up to spell out each decimal digit.
//
// Beats (placeholder timings — Step 4c overwrites with audio-aligned):
//    0.0– 4.5  Manimo intro + hook
//    4.5–13.0  Display + BCD input panel setup
//   13.0–24.0  Segment Boolean equations (a, b, g shown — full list noted)
//   24.0–40.0  Live count 0 → 9 — bits flip, segments light up  (motion)
//   40.0–50.0  Takeaway
//
// Authoring notes:
//   • SEGMENT_TABLE is the single source of truth for which segments
//     are lit per digit. Beat 4 reads from it; the equations in Beat 3
//     are derived from it (and hand-checked against any 7-seg datasheet).
//   • Segment geometry is shared between Beat 2 (static) and Beat 4
//     (lit/dim) via segPath() so the diagrams cannot drift.

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0.0– 4.5 */ "How do four bits drive a seven-segment display? Each of the seven segments has its own logic equation.",
  /*  4.5–13.0 */ "Here's the seven-segment display, with segments labelled a through g. The four BCD inputs D three through D zero give us sixteen possible values, of which we use ten — zero through nine.",
  /* 13.0–24.0 */ "Each segment is its own Boolean function of D three through D zero. For instance, segment a is on for every digit except 1 and 4. Karnaugh maps simplify each of the seven equations.",
  /* 24.0–40.0 */ "Cycle the input from zero up to nine. Each new BCD code lights the segments that draw that digit — and the display reads the value.",
  /* 40.0–50.0 */ "Seven small logic networks plus four input bits give you any decimal digit on a numeric display — the building block behind every clock, calculator and meter readout.",
];

const NARRATION_AUDIO = 'audio/bcd-seven-segment-decoder/scene.mp3';

// ─── Segment activation table — single source of truth ──────────────────
// Standard common-cathode active-high 7-segment digit mapping.
// Order of segment flags: a, b, c, d, e, f, g.
const SEGMENT_TABLE = {
  0: [1, 1, 1, 1, 1, 1, 0],
  1: [0, 1, 1, 0, 0, 0, 0],
  2: [1, 1, 0, 1, 1, 0, 1],
  3: [1, 1, 1, 1, 0, 0, 1],
  4: [0, 1, 1, 0, 0, 1, 1],
  5: [1, 0, 1, 1, 0, 1, 1],
  6: [1, 0, 1, 1, 1, 1, 1],
  7: [1, 1, 1, 0, 0, 0, 0],
  8: [1, 1, 1, 1, 1, 1, 1],
  9: [1, 1, 1, 1, 0, 1, 1],
};
const SEGMENT_NAMES = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];

function Scene() {
  return (
    <SceneChrome
      eyebrow="combinational logic"
      title="BCD to 7-Segment: Four Bits, Seven Lamps"
      duration={SCENE_DURATION}
      introEnd={6.71}
      introCaption="Four bits in. Seven segments out."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.71} end={20.09}>
        <DisplaySetupBeat />
      </Sprite>

      <Sprite start={20.09} end={33.09}>
        <EquationsBeat />
      </Sprite>

      <Sprite start={33.09} end={42.56}>
        <CountCycleBeat />
      </Sprite>

      <Sprite start={42.56} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Seven-segment digit primitive ──────────────────────────────────────
// Segments are drawn as thick rounded lines. cx, cy = top-left of the
// digit bounding box. w, h = width and height of the whole digit shape.
function digitGeometry(cx, cy, w, h) {
  const t = Math.max(4, Math.min(w, h) * 0.085);   // segment thickness
  const xL = cx + t * 0.5;
  const xR = cx + w - t * 0.5;
  const yT = cy + t * 0.5;
  const yM = cy + h / 2;
  const yB = cy + h - t * 0.5;
  // Each segment as (x1,y1,x2,y2) endpoints — drawn with thick
  // strokeLinecap="round" so they look like the classic LED bars.
  return {
    t,
    a: [xL + t * 0.4, yT, xR - t * 0.4, yT],         // top horizontal
    b: [xR, yT + t * 0.4, xR, yM - t * 0.4],         // upper right
    c: [xR, yM + t * 0.4, xR, yB - t * 0.4],         // lower right
    d: [xL + t * 0.4, yB, xR - t * 0.4, yB],         // bottom horizontal
    e: [xL, yM + t * 0.4, xL, yB - t * 0.4],         // lower left
    f: [xL, yT + t * 0.4, xL, yM - t * 0.4],         // upper left
    g: [xL + t * 0.4, yM, xR - t * 0.4, yM],         // middle horizontal
  };
}

function SevenSegmentDigit({ cx, cy, w, h, lit, showLabels = false, dimColor = 'rgba(232,220,193,0.10)', litColor = 'var(--amber-300)' }) {
  const G = digitGeometry(cx, cy, w, h);
  const segs = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
  // Label positions, just outside the digit.
  const labels = {
    a: { x: cx + w + 6, y: cy + G.t + 4, anchor: 'start' },
    b: { x: cx + w + 8, y: cy + h * 0.30, anchor: 'start' },
    c: { x: cx + w + 8, y: cy + h * 0.72, anchor: 'start' },
    d: { x: cx + w + 6, y: cy + h - G.t / 2 + 4, anchor: 'start' },
    e: { x: cx - 8,      y: cy + h * 0.72, anchor: 'end' },
    f: { x: cx - 8,      y: cy + h * 0.30, anchor: 'end' },
    g: { x: cx + w / 2,  y: cy + h / 2 - G.t - 6, anchor: 'middle' },
  };
  return (
    <g>
      {segs.map((s, i) => {
        const [x1, y1, x2, y2] = G[s];
        const isLit = !!lit[i];
        return (
          <line key={s}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isLit ? litColor : dimColor}
                strokeWidth={G.t}
                strokeLinecap="round"
                style={{
                  filter: isLit
                    ? `drop-shadow(0 0 6px ${litColor === 'var(--amber-300)' ? 'rgba(244,184,96,0.6)' : 'rgba(244,184,96,0.4)'})`
                    : 'none',
                  transition: 'stroke 0.18s ease',
                }}/>
        );
      })}
      {showLabels && segs.map((s) => {
        const L = labels[s];
        return (
          <text key={`lab-${s}`}
                x={L.x} y={L.y} textAnchor={L.anchor}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12}>{s}</text>
        );
      })}
    </g>
  );
}

// ─── BCD bit panel — 4 bits horizontally ────────────────────────────────
function BcdBitPanel({ cx, cy, value, scale = 1 }) {
  // Show D3 D2 D1 D0 with each bit as a small box; the corresponding
  // bit's value (0 or 1) appears inside, the high bit on the left.
  const bits = [3, 2, 1, 0].map(i => (value >> i) & 1);
  const labels = ['D₃', 'D₂', 'D₁', 'D₀'];
  const boxW = 36 * scale;
  const boxH = 42 * scale;
  const gap = 8 * scale;
  const totalW = 4 * boxW + 3 * gap;
  const x0 = cx - totalW / 2;
  return (
    <g>
      {bits.map((b, i) => {
        const x = x0 + i * (boxW + gap);
        const isOn = b === 1;
        return (
          <g key={i}>
            <rect x={x} y={cy} width={boxW} height={boxH}
                  fill={isOn ? 'rgba(244,184,96,0.18)' : 'rgba(232,220,193,0.05)'}
                  stroke={isOn ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  strokeWidth={1.5} rx={4}/>
            <text x={x + boxW / 2} y={cy + boxH / 2 + 7}
                  textAnchor="middle"
                  fill={isOn ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={20 * scale}
                  fontWeight="bold">{b}</text>
            <text x={x + boxW / 2} y={cy + boxH + 16}
                  textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={13 * scale}>{labels[i]}</text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Beat 2: Display + input setup ──────────────────────────────────────
function DisplaySetupBeat() {
  const portrait = usePortrait();
  // Layout: landscape side-by-side, portrait stacked (bits above, digit below).
  const G = portrait
    ? { vbW: 600, vbH: 540,
        digitX: 220, digitY: 220, digitW: 160, digitH: 250,
        bitsCx: 300, bitsCy: 60, bitsScale: 1.0,
        captionY: 525 }
    : { vbW: 880, vbH: 380,
        digitX: 560, digitY: 70, digitW: 170, digitH: 260,
        bitsCx: 230, bitsCy: 130, bitsScale: 1.15,
        captionY: 360 };

  // Show the digit "8" so all seven segments are visible. Or use [1..1] to
  // emphasise the setup.
  const allOn = [1, 1, 1, 1, 1, 1, 1];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* BCD input panel */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <BcdBitPanel cx={G.bitsCx} cy={G.bitsCy}
                       value={0b1000}
                       scale={G.bitsScale}/>
          <text x={G.bitsCx} y={G.bitsCy - 14} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">BCD INPUT</text>
        </SvgFadeIn>

        {/* Seven-segment display */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <SevenSegmentDigit cx={G.digitX} cy={G.digitY}
                             w={G.digitW} h={G.digitH}
                             lit={allOn}
                             showLabels={true}/>
        </SvgFadeIn>

        {/* Arrow from inputs to display */}
        <SvgFadeIn duration={0.4} delay={2.0}>
          {portrait ? (
            // vertical arrow
            <g>
              <line x1={G.bitsCx} y1={G.bitsCy + 70}
                    x2={G.bitsCx} y2={G.digitY - 12}
                    stroke="var(--chalk-300)" strokeWidth={1.6}
                    strokeDasharray="5 4"/>
              <polygon
                points={`${G.bitsCx} ${G.digitY - 6},
                         ${G.bitsCx - 7} ${G.digitY - 16},
                         ${G.bitsCx + 7} ${G.digitY - 16}`}
                fill="var(--chalk-300)"/>
              <text x={G.bitsCx + 18} y={(G.bitsCy + 70 + G.digitY) / 2 + 4}
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={11} letterSpacing="0.16em">DECODER</text>
            </g>
          ) : (
            // horizontal arrow
            <g>
              <line x1={G.bitsCx + 110} y1={G.bitsCy + 30}
                    x2={G.digitX - 24} y2={G.bitsCy + 30}
                    stroke="var(--chalk-300)" strokeWidth={1.6}
                    strokeDasharray="5 4"/>
              <polygon
                points={`${G.digitX - 16} ${G.bitsCy + 30},
                         ${G.digitX - 26} ${G.bitsCy + 24},
                         ${G.digitX - 26} ${G.bitsCy + 36}`}
                fill="var(--chalk-300)"/>
              <text x={(G.bitsCx + 110 + G.digitX) / 2} y={G.bitsCy + 18}
                    textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={11} letterSpacing="0.16em">DECODER</text>
            </g>
          )}
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            ten valid codes — zero through nine
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Segment equations ──────────────────────────────────────────
function EquationsBeat() {
  const portrait = usePortrait();
  const itemStyle = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
    color: 'var(--chalk-200)', letterSpacing: '0.04em',
  };
  // Pre-computed activation digit-lists per segment (from SEGMENT_TABLE).
  const segLists = {};
  SEGMENT_NAMES.forEach((s, i) => {
    segLists[s] = [];
    for (let d = 0; d <= 9; d++) {
      if (SEGMENT_TABLE[d][i] === 1) segLists[s].push(d);
    }
  });

  // Display three illustrative equations (a, b, g) — the rest follow the
  // same pattern and would crowd the slide.
  const shownSegments = ['a', 'b', 'g'];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 16 : 22,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        each segment — its own Boolean function
      </FadeUp>

      {shownSegments.map((s, i) => (
        <FadeUp key={s} duration={0.5} delay={0.3 + i * 0.8} distance={10}
          style={{
            display: 'flex', alignItems: 'baseline', gap: 14,
          }}>
          <span style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--amber-300)',
          }}>seg {s}</span>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 14,
            color: 'var(--chalk-300)',
          }}>on for</span>
          <span style={itemStyle}>
            {`{ ${segLists[s].join(', ')} }`}
          </span>
        </FadeUp>
      ))}

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-200)',
          textAlign: 'center', maxWidth: portrait ? '26ch' : '46ch',
          lineHeight: 1.4, marginTop: 6,
        }}>
        seven Boolean functions of (D₃, D₂, D₁, D₀) — each simplified by its own K-map
      </FadeUp>

      <FadeUp duration={0.5} delay={4.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)',
          textAlign: 'center', letterSpacing: '0.06em',
        }}>
        e.g.  a = D₃ + D₁ + (D₂ ⊕ D₀)′   (after K-map reduction)
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Count cycle (genuine motion) ───────────────────────────────
// BCD value cycles 0 → 9 over ~10 seconds, advancing one digit per
// DIGIT_PERIOD seconds. The bit panel and digit display both update from
// the same `value` so they stay in sync.
function CountCycleBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Beat 4 is ~9.5 s after audio-rewire. To fit all 10 BCD digits (0–9)
  // inside that window with a small lead-in pause we need DIGIT_PERIOD
  // around 0.8 s.
  const HOLD0 = 0.4;
  const DIGIT_PERIOD = 0.8;
  const t = Math.max(0, localTime - HOLD0);
  const value = Math.min(9, Math.floor(t / DIGIT_PERIOD));

  const lit = SEGMENT_TABLE[value];

  // Layout per aspect. Portrait places the decimal readout BETWEEN the
  // bit panel and the digit (so it sits next to the bits it represents
  // and doesn't crowd the "step X / 10" caption below the digit).
  const G = portrait
    ? { vbW: 600, vbH: 540,
        digitX: 220, digitY: 220, digitW: 160, digitH: 250,
        bitsCx: 300, bitsCy: 60, bitsScale: 1.0,
        valLabelX: 300, valLabelY: 160 }
    : { vbW: 880, vbH: 380,
        digitX: 560, digitY: 70, digitW: 170, digitH: 260,
        bitsCx: 230, bitsCy: 130, bitsScale: 1.15,
        valLabelX: 230, valLabelY: 280 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Static labels: input header + digit decimal readout */}
        <text x={G.bitsCx} y={G.bitsCy - 14} textAnchor="middle"
              fill="var(--amber-300)" fontFamily="var(--font-mono)"
              fontSize={12} letterSpacing="0.16em">BCD INPUT</text>

        {/* BCD bit panel — updates each digit tick */}
        <BcdBitPanel cx={G.bitsCx} cy={G.bitsCy}
                     value={value}
                     scale={G.bitsScale}/>

        {/* Decimal label below the bit panel */}
        <text x={G.valLabelX} y={G.valLabelY} textAnchor="middle"
              fill="var(--rose-300)" fontFamily="var(--font-mono)"
              fontSize={portrait ? 22 : 24} letterSpacing="0.06em">
          = {value}
        </text>

        {/* Seven-segment display */}
        <SevenSegmentDigit cx={G.digitX} cy={G.digitY}
                           w={G.digitW} h={G.digitH}
                           lit={lit}/>

        {/* Progress hint — small counter under the digit */}
        <text x={G.digitX + G.digitW / 2} y={G.digitY + G.digitH + 26}
              textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11} letterSpacing="0.12em">
          step {Math.min(value + 1, 10)} / 10
        </text>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.vbH - 12} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            one digit per second — segments follow the equations
          </text>
        </SvgFadeIn>
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.3,
        }}>
        Seven Boolean functions = one digit display.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.8} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15,
          color: 'var(--amber-300)', letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}>
        every clock, every meter, every calculator
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          textAlign: 'center', maxWidth: portrait ? '30ch' : '52ch',
          lineHeight: 1.4,
        }}>
        one of the simplest combinational logic blocks shipped on a chip — the 7447 / 4511
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ──────────────────────────────────────────────────────────────
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
