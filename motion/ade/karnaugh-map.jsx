// Karnaugh Maps: Grouping Adjacent Ones — Manimo lesson scene.
// A 3-variable function F(A,B,C) = Σm(2,3,4,5,6,7) is laid out on a
// Gray-coded K-map; two overlapping 4-cell groups collapse it to A + B.
// Genuine animation lives in Beat 3 (cells popping in row by row) and
// Beat 4 (rounded-rectangle group outlines drawing themselves around
// adjacent ones, each tied to its own TraceIn).
//
// Beats (timing aligned to single-track narration in motion/ade/audio/karnaugh-map/):
//    0.00– 7.53  Manimo intro: minimize Boolean by drawing
//    7.53–14.54  The function: F = Σm(2..7), six 1's, two 0's
//   14.54–22.90  Lay out the K-map: cells fill in one row at a time
//   22.90–32.43  Group adjacent ones: two 4-cell rectangles → A and B
//   32.43–39.00  F = A + B (down from three terms to two)
//
// Authoring notes:
//   • K-map cell values come from MINTERMS — change the set and every
//     beat updates consistently. (Group rectangles in Beat 4 are still
//     hand-positioned to A + B because that's what we're teaching.)
//   • Cells pop sequentially via per-row delays (no stacked Sprites).
//   • Group rectangles use TraceIn around a path so the outline
//     draws itself in.

const SCENE_DURATION = 39;

const NARRATION = [
  /*  0.00– 7.53 */ "There's a way to minimize a Boolean function by drawing — not algebra. Karnaugh maps.",
  /*  7.53–14.54 */ "Take a function of three variables — A, B, C — and assume it's one for these six minterms.",
  /* 14.54–22.90 */ "Lay out a Karnaugh map: A B down the side in Gray code, C across the top. Drop in a one wherever the function equals one.",
  /* 22.90–32.43 */ "Now the magic. Two rectangles cover all six ones. The vertical block is A. The horizontal block is B. Together — A or B.",
  /* 32.43–39.00 */ "F equals A or B. Two terms instead of three — and you didn't have to factor anything.",
];

const NARRATION_AUDIO = 'audio/karnaugh-map/scene.mp3';

// Minterms where F = 1. The K-map renders straight from this set.
// 3-variable minterm encoding: bit2 = A, bit1 = B, bit0 = C.
const MINTERMS = [2, 3, 4, 5, 6, 7];
const MINTERM_SET = new Set(MINTERMS);

// AB rows in Gray code order (rows of the K-map).
const AB_ROWS = [
  { ab: '00', a: 0, b: 0 },
  { ab: '01', a: 0, b: 1 },
  { ab: '11', a: 1, b: 1 },
  { ab: '10', a: 1, b: 0 },
];
const C_COLS = [0, 1];

function mintermAt(a, b, c) {
  return (a << 2) | (b << 1) | c;
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="Boolean minimization"
      title="Karnaugh Maps: Grouping Adjacent Ones"
      duration={SCENE_DURATION}
      introEnd={7.53}
      introCaption="Minimize a Boolean expression by drawing — not algebra?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.53} end={14.54}>
        <FunctionBeat />
      </Sprite>

      <Sprite start={14.54} end={22.9}>
        <FillMapBeat />
      </Sprite>

      <Sprite start={22.9} end={32.43}>
        <GroupCellsBeat />
      </Sprite>

      <Sprite start={32.43} end={SCENE_DURATION}>
        <ResultBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── K-map geometry — shared across beats 3 + 4 ─────────────────────────
function mapGeometry(portrait) {
  if (portrait) {
    return {
      cellW: 100, cellH: 86, originX: 230, originY: 290,
      gridStrokeW: 1.4, valueFont: 32, headerFont: 16,
      vbW: 720, vbH: 1080,
    };
  }
  return {
    cellW: 110, cellH: 84, originX: 470, originY: 240,
    gridStrokeW: 1.4, valueFont: 30, headerFont: 16,
    vbW: 1280, vbH: 600,
  };
}

// Render the static K-map skeleton (grid + axis headers). Cell *contents*
// (0s and 1s) are rendered separately so each beat can choose its own
// reveal animation.
function KMapGrid({ G, color = 'var(--chalk-300)', dim = false }) {
  const opacity = dim ? 0.45 : 1;
  const lines = [];
  // Vertical lines
  for (let i = 0; i <= C_COLS.length; i++) {
    const x = G.originX + i * G.cellW;
    lines.push(<line key={`v${i}`} x1={x} y1={G.originY}
                     x2={x} y2={G.originY + AB_ROWS.length * G.cellH}
                     stroke={color} strokeWidth={G.gridStrokeW}
                     opacity={opacity}/>);
  }
  // Horizontal lines
  for (let j = 0; j <= AB_ROWS.length; j++) {
    const y = G.originY + j * G.cellH;
    lines.push(<line key={`h${j}`} x1={G.originX} y1={y}
                     x2={G.originX + C_COLS.length * G.cellW} y2={y}
                     stroke={color} strokeWidth={G.gridStrokeW}
                     opacity={opacity}/>);
  }

  // Column headers (C values)
  const colHeaders = C_COLS.map((c, i) => (
    <text key={`ch${c}`}
          x={G.originX + (i + 0.5) * G.cellW}
          y={G.originY - 16} textAnchor="middle"
          fill="var(--chalk-200)" fontFamily="var(--font-mono)"
          fontSize={G.headerFont} letterSpacing="0.08em"
          opacity={opacity}>
      C={c}
    </text>
  ));
  // Row headers (AB values)
  const rowHeaders = AB_ROWS.map((row, j) => (
    <text key={`rh${row.ab}`}
          x={G.originX - 18}
          y={G.originY + (j + 0.5) * G.cellH + 5}
          textAnchor="end"
          fill="var(--chalk-200)" fontFamily="var(--font-mono)"
          fontSize={G.headerFont} letterSpacing="0.08em"
          opacity={opacity}>
      AB={row.ab}
    </text>
  ));
  // Top-left corner caption "AB \\ C"
  const corner = (
    <text x={G.originX - 26} y={G.originY - 16}
          textAnchor="end"
          fill="var(--chalk-300)" fontFamily="var(--font-mono)"
          fontSize={G.headerFont * 0.85}
          fontStyle="italic" opacity={opacity}>
      AB \ C
    </text>
  );

  return <g>{lines}{colHeaders}{rowHeaders}{corner}</g>;
}

// ─── Beat 2: The function ────────────────────────────────────────────────
function FunctionBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        a 3-variable Boolean function
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 48,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
          textAlign: 'center', lineHeight: 1.15,
        }}>
        F(A, B, C) = Σ m(2, 3, 4, 5, 6, 7)
      </FadeUp>

      <FadeUp duration={0.4} delay={1.4} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '24ch' : '46ch',
        }}>
        six 1's, two 0's — what's the simplest expression?
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
          color: 'var(--chalk-100)', letterSpacing: '0.04em',
          marginTop: 12, textAlign: 'center',
        }}>
        F = A'B + AB' + AB
      </FadeUp>

      <FadeUp duration={0.4} delay={3.6} distance={6}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          marginTop: -6, textAlign: 'center',
          maxWidth: portrait ? '28ch' : '40ch',
        }}>
        the algebraic version — three terms, can we do better?
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Lay out the K-map (cells fill in row by row) ────────────────
function FillMapBeat() {
  const portrait = usePortrait();
  const G = mapGeometry(portrait);
  const { localTime } = useSprite();

  // Reveal order: per row, with a 0.9s gap between rows. Each row's two
  // cells appear together (visually scanning across).
  const ROW_GAP = 1.2;
  const ROW_START = 1.0;          // hold the empty grid for a moment
  const showRow = (j) => localTime >= ROW_START + j * ROW_GAP;

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    }}>
      <svg width="100%" height="100%"
           viewBox={portrait ? '0 0 720 1080' : '0 0 1280 600'}
           preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        {/* Grid skeleton (fades in immediately) */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <KMapGrid G={G}/>
        </SvgFadeIn>

        {/* Cell values */}
        {AB_ROWS.map((row, j) => (
          showRow(j) && C_COLS.map((c, i) => {
            const m = mintermAt(row.a, row.b, c);
            const v = MINTERM_SET.has(m) ? '1' : '0';
            const cx = G.originX + (i + 0.5) * G.cellW;
            const cy = G.originY + (j + 0.5) * G.cellH;
            const isOne = v === '1';
            return (
              <g key={`${row.ab}-${c}`}>
                <text x={cx} y={cy + G.valueFont * 0.32} textAnchor="middle"
                      fill={isOne ? 'var(--amber-300)' : 'var(--chalk-300)'}
                      fontFamily="var(--font-mono)"
                      fontSize={G.valueFont}
                      fontWeight={isOne ? 'bold' : 'normal'}
                      opacity={isOne ? 1 : 0.55}>
                  {v}
                </text>
              </g>
            );
          })
        ))}

        {/* Caption — appears once all rows are populated */}
        {localTime >= ROW_START + AB_ROWS.length * ROW_GAP + 0.3 && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <text x={G.originX + (C_COLS.length * G.cellW) / 2}
                  y={G.originY + AB_ROWS.length * G.cellH + 44}
                  textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize={14} letterSpacing="0.02em">
              rows ordered so neighbours differ in exactly one variable
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: Group adjacent ones (genuine motion via TraceIn) ────────────
function GroupCellsBeat() {
  const portrait = usePortrait();
  const G = mapGeometry(portrait);

  // Group rectangles — each one wraps a 2x2 (4-cell) block of 1s.
  //
  // Group A covers AB=11 + AB=10 (rows index 2 and 3) across both C cols.
  //   This block contains minterms {6, 7, 4, 5}.
  //   Within those four cells, A is constant = 1, B varies, C varies →
  //   the block represents `A`.
  //
  // Group B covers AB=01 + AB=11 (rows 1 and 2) across both C cols.
  //   This block contains minterms {2, 3, 6, 7}.
  //   Within those four cells, B is constant = 1 → the block represents `B`.
  //
  // Inset the rectangle a few px inside the cell border so the two groups
  // can both be visible where they overlap (AB=11).
  const padInner = 8;
  const padOuter = 12;     // rose outline sits a bit further out so it
                           // doesn't co-incide with the amber outline.

  const x0Inner = G.originX + padInner;
  const xWInner = C_COLS.length * G.cellW - 2 * padInner;

  const x0Outer = G.originX + padInner - padOuter / 2;
  const xWOuter = C_COLS.length * G.cellW - 2 * padInner + padOuter;

  // Group A (vertical: rows 2,3)
  const groupA_y = G.originY + 2 * G.cellH + padInner;
  const groupA_h = 2 * G.cellH - 2 * padInner;
  const groupA_d = roundedRectPath(x0Inner, groupA_y, xWInner, groupA_h, 14);

  // Group B (horizontal across rows 1,2 — the middle block)
  const groupB_y = G.originY + 1 * G.cellH + padInner - padOuter / 2;
  const groupB_h = 2 * G.cellH - 2 * padInner + padOuter;
  const groupB_d = roundedRectPath(x0Outer, groupB_y, xWOuter, groupB_h, 18);

  // Label positions
  const labelA_x = G.originX + C_COLS.length * G.cellW + 28;
  const labelA_y = groupA_y + groupA_h / 2 + 8;

  const labelB_x = G.originX - 28;
  const labelB_y = groupB_y + groupB_h / 2 + 8;

  return (
    <div style={{
      position: 'absolute', left: 0, top: 0, width: '100%', height: '100%',
    }}>
      <svg width="100%" height="100%"
           viewBox={portrait ? '0 0 720 1080' : '0 0 1280 600'}
           preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible' }}>
        {/* Grid + filled cells (carry over from beat 3) */}
        <KMapGrid G={G}/>
        {AB_ROWS.map((row, j) => C_COLS.map((c, i) => {
          const m = mintermAt(row.a, row.b, c);
          const v = MINTERM_SET.has(m) ? '1' : '0';
          const cx = G.originX + (i + 0.5) * G.cellW;
          const cy = G.originY + (j + 0.5) * G.cellH;
          const isOne = v === '1';
          return (
            <text key={`${row.ab}-${c}`}
                  x={cx} y={cy + G.valueFont * 0.32}
                  textAnchor="middle"
                  fill={isOne ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)"
                  fontSize={G.valueFont}
                  fontWeight={isOne ? 'bold' : 'normal'}
                  opacity={isOne ? 1 : 0.55}>
              {v}
            </text>
          );
        }))}

        {/* Group A — amber rectangle drawing itself in */}
        <TraceIn d={groupA_d}
                 stroke="var(--amber-400)" strokeWidth={3}
                 fill="none" duration={1.0} delay={1.5}/>
        <SvgFadeIn duration={0.35} delay={2.5}>
          <text x={labelA_x} y={labelA_y}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={32}>A</text>
          <text x={labelA_x} y={labelA_y + 22}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">m(4,5,6,7)</text>
        </SvgFadeIn>

        {/* Group B — rose rectangle drawing itself in */}
        <TraceIn d={groupB_d}
                 stroke="var(--rose-400)" strokeWidth={3}
                 fill="none" duration={1.0} delay={4.0}/>
        <SvgFadeIn duration={0.35} delay={5.0}>
          <text x={labelB_x} y={labelB_y} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={32}>B</text>
          <text x={labelB_x} y={labelB_y + 22} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">m(2,3,6,7)</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={7.0}>
          <text x={G.originX + (C_COLS.length * G.cellW) / 2}
                y={G.originY + AB_ROWS.length * G.cellH + 44}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            each rectangle of size 2ⁿ erases n variables
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Build a rounded-rectangle SVG path. Used so the group outlines can
// draw themselves in via TraceIn.
function roundedRectPath(x, y, w, h, r) {
  const r2 = Math.min(r, w / 2, h / 2);
  return [
    `M ${x + r2} ${y}`,
    `L ${x + w - r2} ${y}`,
    `A ${r2} ${r2} 0 0 1 ${x + w} ${y + r2}`,
    `L ${x + w} ${y + h - r2}`,
    `A ${r2} ${r2} 0 0 1 ${x + w - r2} ${y + h}`,
    `L ${x + r2} ${y + h}`,
    `A ${r2} ${r2} 0 0 1 ${x} ${y + h - r2}`,
    `L ${x} ${y + r2}`,
    `A ${r2} ${r2} 0 0 1 ${x + r2} ${y}`,
    'Z',
  ].join(' ');
}

// ─── Beat 5: Result ──────────────────────────────────────────────────────
function ResultBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        the simplified expression
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 56 : 76,
          color: 'var(--amber-300)', letterSpacing: '0.04em',
        }}>
        F = A + B
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
          color: 'var(--chalk-200)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        A'B + AB' + AB  →  A + B
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '26ch' : '50ch', lineHeight: 1.45,
          marginTop: 6,
        }}>
        drawing beats algebra for any function up to four variables
      </FadeUp>

      <FadeUp duration={0.4} delay={5.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 12,
          textTransform: 'uppercase',
        }}>
        K-maps — the visual face of Boolean minimization
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
