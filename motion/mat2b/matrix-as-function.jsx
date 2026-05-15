// Matrix as Function: T(v) = Av — Manimo lesson scene.
// Chapter 2 (Lineærtransformasjoner). A matrix-vector multiplication IS
// the linear transformation. Show v on the left, the matrix machine in
// the middle, the output on the right, then walk through row-by-column
// arithmetic.

const SCENE_DURATION = 38;

const NARRATION = [
  "What does a matrix actually do to a vector? Let's compute.",
  "Send in a vector. The matrix is the rule. The output is another vector — same dimension, new direction.",
  "Multiply row by column. One times one plus two times two gives five. Three times one minus one times two gives one. So A v equals the column five, one.",
  "That's it. Every linear function from the plane to the plane is just multiplication by some matrix, written T of v equals A v.",
  "Pick a matrix. Pick a vector. Multiply. Get a new vector.",
];

const NARRATION_AUDIO = 'audio/matrix-as-function/scene.mp3';

// Inputs to the example computation.
const A = [[1, 2], [3, -1]];
const V = [1, 2];
const AV = [A[0][0] * V[0] + A[0][1] * V[1],
            A[1][0] * V[0] + A[1][1] * V[1]];        // (5, 1)

// ─── Geometry ────────────────────────────────────────────────────────────
// Three boxes laid out horizontally at the same vertical centre, each with
// its own little coordinate frame. Centre box is the matrix; outer boxes
// are tiny grids showing v and Av as arrows.
const PANEL_CY = 400;
const LEFT_CX = 220;
const MID_CX  = 640;
const RIGHT_CX = 1060;

const MINI_UNIT = 26;
const MINI_X_MIN = -2, MINI_X_MAX = 6;
const MINI_Y_MIN = -2, MINI_Y_MAX = 4;

function miniToSvg(cx, x, y) {
  return { sx: cx + x * MINI_UNIT, sy: PANEL_CY - y * MINI_UNIT };
}

// ─── Grid mask ───────────────────────────────────────────────────────────
function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="50%" cy="56%" r="62%">
          <stop offset="60%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1280" height="720" fill={`url(#${gradId})`}/>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>{children}</g>
    </svg>
  );
}

// ─── Mini grid ───────────────────────────────────────────────────────────
function MiniGrid({ cx, opacity = 0.35 }) {
  const lines = [];
  for (let k = MINI_X_MIN; k <= MINI_X_MAX; k++) {
    const a = miniToSvg(cx, k, MINI_Y_MIN);
    const b = miniToSvg(cx, k, MINI_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={0.9}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = MINI_Y_MIN; k <= MINI_Y_MAX; k++) {
    const a = miniToSvg(cx, MINI_X_MIN, k);
    const b = miniToSvg(cx, MINI_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={0.9}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  // Axes
  const xleft = miniToSvg(cx, MINI_X_MIN, 0), xright = miniToSvg(cx, MINI_X_MAX, 0);
  const ytop = miniToSvg(cx, 0, MINI_Y_MAX), ybot = miniToSvg(cx, 0, MINI_Y_MIN);
  lines.push(<line key="ax" x1={xleft.sx} y1={xleft.sy} x2={xright.sx} y2={xright.sy}
                   stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round"/>);
  lines.push(<line key="ay" x1={ytop.sx} y1={ytop.sy} x2={ybot.sx} y2={ybot.sy}
                   stroke="var(--chalk-200)" strokeWidth={1.5} strokeLinecap="round"/>);
  return <g>{lines}</g>;
}

function MiniVector({ cx, x, y, color, label = null, labelDX = 0, labelDY = 0,
                       strokeWidth = 3.2, headLen = 10, headHalf = 5.5 }) {
  const o = miniToSvg(cx, 0, 0);
  const tip = miniToSvg(cx, x, y);
  const dx = tip.sx - o.sx, dy = tip.sy - o.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = tip.sx - ux * headLen;
  const baseY = tip.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={o.sx} y1={o.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${tip.sx} ${tip.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={18} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ children, right, top, left, bottom, width = 360, align = 'left' }) {
  const positioning = left != null ? { left, top, right: undefined }
                    : { right, top };
  return (
    <div style={{
      position: 'absolute', width, ...positioning,
      pointerEvents: 'none',
      padding: '14px 20px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 14,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: align === 'center' ? 'center' : 'flex-start',
      gap: 10,
    }}>
      {children}
    </div>
  );
}

// Bracketed 2x1 column vector, HTML.
function ColumnVec({ entries, colors, fontSize = 30 }) {
  return (
    <div style={{
      position: 'relative', padding: '10px 14px',
      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
      fontSize, color: 'var(--chalk-100)', lineHeight: 1.15,
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 9,
        borderLeft: '2px solid var(--chalk-200)',
        borderTop: '2px solid var(--chalk-200)',
        borderBottom: '2px solid var(--chalk-200)',
      }}/>
      <span style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 9,
        borderRight: '2px solid var(--chalk-200)',
        borderTop: '2px solid var(--chalk-200)',
        borderBottom: '2px solid var(--chalk-200)',
      }}/>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 4,
        alignItems: 'center', minWidth: 30,
      }}>
        <span style={{ color: colors[0] }}>{entries[0]}</span>
        <span style={{ color: colors[1] }}>{entries[1]}</span>
      </div>
    </div>
  );
}

// Bracketed 2x2 matrix, HTML. cells = [[r0c0, r0c1],[r1c0, r1c1]];
// highlight = { row: 0|1, on: 0..1 } colours one row amber for the active
// step in the row-by-column animation.
function MatrixBox({ cells, highlightRow = null, highlightOn = 0, fontSize = 30 }) {
  const cell = (val, r, c) => {
    const isHighlighted = highlightRow === r;
    const color = isHighlighted
      ? `rgba(244,184,96,${0.55 + 0.45 * highlightOn})`
      : 'var(--chalk-100)';
    return (
      <span key={`${r}-${c}`} style={{ color }}>{val}</span>
    );
  };
  return (
    <div style={{
      position: 'relative', padding: '14px 24px',
      fontFamily: 'var(--font-serif)', fontStyle: 'italic',
      fontSize, color: 'var(--chalk-100)', lineHeight: 1.2,
    }}>
      <span style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 12,
        borderLeft: '2.5px solid var(--chalk-200)',
        borderTop: '2.5px solid var(--chalk-200)',
        borderBottom: '2.5px solid var(--chalk-200)',
      }}/>
      <span style={{
        position: 'absolute', right: 0, top: 0, bottom: 0, width: 12,
        borderRight: '2.5px solid var(--chalk-200)',
        borderTop: '2.5px solid var(--chalk-200)',
        borderBottom: '2.5px solid var(--chalk-200)',
      }}/>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(48px, 1fr) minmax(48px, 1fr)',
        rowGap: 4, columnGap: 18, textAlign: 'center',
      }}>
        {cell(cells[0][0], 0, 0)}
        {cell(cells[0][1], 0, 1)}
        {cell(cells[1][0], 1, 0)}
        {cell(cells[1][1], 1, 1)}
      </div>
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="linear transformations"
      title="A Matrix Is a Function"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.37}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.37} end={11.51}>
        <MachineLayoutBeat/>
      </Sprite>

      <Sprite start={11.51} end={23.2}>
        <RowByColumnBeat/>
      </Sprite>

      <Sprite start={23.2} end={31.84}>
        <CollapseBeat/>
      </Sprite>

      <Sprite start={31.84} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 22,
    }}>
      <svg width={170} height={170} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)', maxWidth: '26ch', lineHeight: 1.3,
        }}>
        A is a rule. <span style={{ color: 'var(--violet-400)' }}>v</span> is the input. <span style={{ color: 'var(--amber-300)' }}>A v</span> is the output.
      </FadeUp>
    </div>
  );
}

// Big chevron / arrow drawn between mini-grids, indicating flow.
function FlowChevron({ x, y, color = 'var(--chalk-300)' }) {
  return (
    <g opacity={0.7}>
      <line x1={x - 28} y1={y} x2={x + 14} y2={y}
            stroke={color} strokeWidth={2.4} strokeLinecap="round"/>
      <path d={`M ${x + 14} ${y} L ${x + 4} ${y - 8} L ${x + 4} ${y + 8} Z`}
            fill={color}/>
    </g>
  );
}

// ─── Beat 2: machine layout — three boxes ────────────────────────────────
function MachineLayoutBeat() {
  return (
    <>
      <GridMaskedSvg maskId="maf-machine-mask">
        {/* Left mini-grid + v */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <MiniGrid cx={LEFT_CX} opacity={0.4}/>
          <MiniVector cx={LEFT_CX} x={V[0]} y={V[1]}
                      color="var(--violet-400)"
                      label="v" labelDX={20} labelDY={-2}/>
          {/* origin tick */}
          <circle cx={miniToSvg(LEFT_CX, 0, 0).sx} cy={miniToSvg(LEFT_CX, 0, 0).sy}
                  r={2.6} fill="var(--chalk-100)"/>
        </SvgFadeIn>

        {/* Right placeholder mini-grid */}
        <SvgFadeIn duration={0.4} delay={1.8}>
          <MiniGrid cx={RIGHT_CX} opacity={0.4}/>
          <circle cx={miniToSvg(RIGHT_CX, 0, 0).sx} cy={miniToSvg(RIGHT_CX, 0, 0).sy}
                  r={2.6} fill="var(--chalk-100)"/>
        </SvgFadeIn>

        {/* Flow chevrons */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <FlowChevron x={LEFT_CX + 130} y={PANEL_CY}/>
          <FlowChevron x={RIGHT_CX - 130} y={PANEL_CY}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      {/* Centre matrix box, HTML so the type renders crisp */}
      <div style={{
        position: 'absolute',
        left: '50%', top: PANEL_CY,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}>
        <FadeUp duration={0.5} delay={1.2} distance={10}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              color: 'var(--amber-300)', letterSpacing: '0.16em',
              textTransform: 'uppercase',
            }}>matrix A</span>
            <MatrixBox cells={[['1', '2'], ['3', '−1']]} fontSize={34}/>
          </div>
        </FadeUp>
      </div>

      {/* "input → matrix → output" caption strip */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 80,
        transform: 'translateX(-50%)',
        textAlign: 'center', pointerEvents: 'none',
      }}>
        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          input&nbsp;&nbsp;→&nbsp;&nbsp;matrix&nbsp;&nbsp;→&nbsp;&nbsp;output
        </FadeUp>
        <FadeUp duration={0.5} delay={3.5} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 20, color: 'var(--chalk-200)', marginTop: 8,
          }}>
          The matrix is the rule. The arrow goes in. A new arrow comes out.
        </FadeUp>
      </div>

      {/* Top-left label for v */}
      <div style={{ position: 'absolute', left: LEFT_CX - 50, top: PANEL_CY - 150 }}>
        <FadeUp duration={0.4} delay={1.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--violet-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          input v
        </FadeUp>
      </div>
      <div style={{ position: 'absolute', left: RIGHT_CX - 60, top: PANEL_CY - 150 }}>
        <FadeUp duration={0.4} delay={2.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          output A v
        </FadeUp>
      </div>
    </>
  );
}

// ─── Beat 3: row × column arithmetic ─────────────────────────────────────
function RowByColumnBeat() {
  const { localTime } = useSprite();

  // Highlight row 1 from 0.5–4.5, row 2 from 5.0–9.0.
  const row1Pulse = Easing.easeInOutCubic(
    clamp((localTime - 0.5) / 0.6, 0, 1) * clamp((4.6 - localTime) / 0.6, 0, 1));
  const row2Pulse = Easing.easeInOutCubic(
    clamp((localTime - 5.0) / 0.6, 0, 1) * clamp((9.1 - localTime) / 0.6, 0, 1));

  const highlightRow = row2Pulse > row1Pulse ? 1 : 0;
  const highlightOn = Math.max(row1Pulse, row2Pulse);

  return (
    <>
      <GridMaskedSvg maskId="maf-rxc-mask">
        {/* Persistent left + right grids */}
        <MiniGrid cx={LEFT_CX} opacity={0.32}/>
        <MiniVector cx={LEFT_CX} x={V[0]} y={V[1]}
                    color="var(--violet-400)"
                    label="v" labelDX={20} labelDY={-2}/>
        <circle cx={miniToSvg(LEFT_CX, 0, 0).sx} cy={miniToSvg(LEFT_CX, 0, 0).sy}
                r={2.6} fill="var(--chalk-100)"/>

        <MiniGrid cx={RIGHT_CX} opacity={0.32}/>
        <circle cx={miniToSvg(RIGHT_CX, 0, 0).sx} cy={miniToSvg(RIGHT_CX, 0, 0).sy}
                r={2.6} fill="var(--chalk-100)"/>

        {/* Output vector appears at delay 9.0 */}
        {localTime > 9.0 && (
          <g opacity={clamp((localTime - 9.0) / 0.6, 0, 1)}>
            <MiniVector cx={RIGHT_CX} x={AV[0]} y={AV[1]}
                        color="var(--amber-400)"
                        label="A v" labelDX={26} labelDY={-2}
                        strokeWidth={3.6}/>
          </g>
        )}

        <FlowChevron x={LEFT_CX + 130} y={PANEL_CY}/>
        <FlowChevron x={RIGHT_CX - 130} y={PANEL_CY}/>
      </GridMaskedSvg>

      {/* Centre matrix with row highlight */}
      <div style={{
        position: 'absolute',
        left: '50%', top: PANEL_CY,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
      }}>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        }}>
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>row × column</span>
          <MatrixBox cells={[['1', '2'], ['3', '−1']]}
                     highlightRow={highlightRow}
                     highlightOn={highlightOn}
                     fontSize={34}/>
        </div>
      </div>

      {/* Step explanations below the matrix */}
      <div style={{
        position: 'absolute', left: '50%', top: PANEL_CY + 130,
        transform: 'translate(-50%, 0)',
        textAlign: 'center', pointerEvents: 'none',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(232,220,193,0.07)',
        borderRadius: 14, padding: '14px 22px',
        boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
        minWidth: 380,
      }}>
        {localTime > 1.6 && (
          <div style={{
            opacity: clamp((localTime - 1.6) / 0.4, 0, 1),
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22,
            color: row1Pulse > 0.1 ? 'var(--amber-300)' : 'var(--chalk-100)',
          }}>
            row 1 · v&nbsp;&nbsp;=&nbsp;&nbsp;1·1 + 2·2 = <strong>5</strong>
          </div>
        )}
        {localTime > 6.5 && (
          <div style={{
            opacity: clamp((localTime - 6.5) / 0.4, 0, 1),
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22,
            color: row2Pulse > 0.1 ? 'var(--amber-300)' : 'var(--chalk-100)',
          }}>
            row 2 · v&nbsp;&nbsp;=&nbsp;&nbsp;3·1 + (−1)·2 = <strong>1</strong>
          </div>
        )}
        {localTime > 9.5 && (
          <div style={{
            opacity: clamp((localTime - 9.5) / 0.4, 0, 1),
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 13,
            color: 'var(--amber-300)', letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}>
            A v = (5, 1)
          </div>
        )}
      </div>
    </>
  );
}

// ─── Beat 4: collapse — T(v) = A v ───────────────────────────────────────
function CollapseBeat() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        every linear T
      </FadeUp>
      <FadeUp duration={0.7} delay={0.35} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 76, color: 'var(--chalk-100)', lineHeight: 1.05,
        }}>
        T(<span style={{ color: 'var(--violet-400)' }}>v</span>) = <span style={{ color: 'var(--chalk-100)' }}>A</span>&nbsp;<span style={{ color: 'var(--violet-400)' }}>v</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '40ch', lineHeight: 1.35,
        }}>
        Linear functions on ℝⁿ and matrices are <em>the same thing</em> in two notations.
      </FadeUp>
    </div>
  );
}

// ─── Hero outro ──────────────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: 900, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 58, color: 'var(--chalk-100)', lineHeight: 1.15,
        }}>
        Linear is <span style={{ color: 'var(--amber-300)' }}>matrix</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '34ch', lineHeight: 1.3,
        }}>
        Row by column. That is the whole arithmetic.
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
