// Rekursjonstre: arbeid på hvert nivå — Manimo lesson scene.
// Chapter 0 of algdat (Verktøykassa). Visualises the standard
// divide-and-conquer recurrence T(n) = 2T(n/2) + n by unrolling it into
// a four-level tree for n = 8. The root carries cost n; each level
// doubles the node count and halves the per-node cost, so every row
// sums to n — and there are log₂(n)+1 levels. The payoff is n·log n.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9.5   Manimo hook
//    9.5–20   Rekursjonsligningen — T(n) = 2T(n/2) + n laid out as boxes
//   20–38.5   Treet vokser — four levels expand, row totals light up (GENUINE MOTION)
//  38.5–50.5  Summering — the four row totals stack into n·log n   (GENUINE MOTION)
//   50.5–60   Takeaway (T(n) = O(n log n))
//
// Colour discipline:
//   chalk-100  high-contrast text / cost numbers
//   chalk-200  body text
//   chalk-300  dimmed labels / dim tree state
//   amber-300  payoff numbers, active row totals, formula pills
//   amber-400  primary tree edges, active node border
//   teal-400   leaf row (base case, work = 1)
//   violet-400 splitting line accent + recursion arrows
//
// Milestones inside each motion beat are fractions of the sprite's
// actual duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 64;

const NARRATION = [
  /*  0– 9.5  */ 'Hvor mye arbeid gjør en algoritme som deler problemet i to og løser hver halvdel? Vi bretter rekursjonen ut som et tre og leser av kjøretida.',
  /*  9.5–20  */ 'Si at vi løser et problem av størrelse n med n arbeid på toppen, og så kaller oss selv to ganger på halv størrelse. Da er T av n lik to ganger T av n delt på to, pluss n.',
  /* 20–38.5  */ 'Vi bretter ut rekursjonen. Roten gjør n arbeid. Den har to barn med n delt på to. Hvert barn deler igjen, så vi får fire med n delt på fire, og åtte løv med ett arbeid. Legg merke til summen i hver rad — den er alltid n.',
  /* 38.5–50.5 */ 'Treet stopper når delproblemene er på ett — det skjer etter log av n nivåer. Hvert nivå koster n. Tell sammen, og kjøretida lander på n ganger log n.',
  /* 50.5–60  */ 'Det er motoren bak del og hersk. Når roten gjør lineært arbeid og delproblemene halveres, lander kjøretida på orden n log n.',
];

const NARRATION_AUDIO = 'audio/rekursjonstre-arbeidsrader/scene.mp3';

// ─── Tree shape: n = 8, four levels (0..3) ─────────────────────────────────
// At level k there are 2^k nodes, each with cost n / 2^k.
const TREE_LEVELS = 4;                   // levels 0..3
const N_LABEL = 'n';                     // symbolic display value at the root
const COST_AT_LEVEL = ['n', 'n/2', 'n/4', '1']; // text shown inside each node

// Per-level row total badge text (always "= n" except the leaf row uses
// "8 · 1 = n" so the equality is obvious to a careful reader).
const ROW_SUM_TEXT = [
  'rad 0:  n  =  n',
  'rad 1:  n/2 + n/2  =  n',
  'rad 2:  4 · n/4  =  n',
  'rad 3:  8 · 1  =  n',
];

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Geometry — landscape + portrait ──────────────────────────────────────
// `sumLayout: 'right'` puts row-total badges to the right of each row
// (landscape). `'below'` stacks them under the tree (portrait — narrow
// canvas).
function treeGeom(portrait) {
  if (portrait) {
    // 8 cells at pitch 70 + cell 50 ⇒ 8*70 = 560, last-cell extra = 50.
    // leftX = (720 - 560)/2 = 80. Tree spans roughly x∈[80, 700].
    return {
      svgW: 720, svgH: 1280,
      cellW: 50, cellH: 44, cellPitch: 70,
      rowH: 130, topY: 230,
      leftX: 80,
      labelFont: 16, sumFont: 13,
      sumLayout: 'below',
      sumStartY: 680,                             // row-totals stack starts below tree
      sumRowH: 56, sumPanelW: 560,
      sumX: 80,
      bottomCaptionY: 980,
      payoffY: 1030,                              // payoff pill (used in beat 4)
      showLevelLabels: false,                     // labels would clip on this narrow canvas
      levelLabelX: 0, levelLabelFont: 11,
    };
  }
  // Landscape — tree on the LEFT, sums + payoff column on the RIGHT.
  return {
    svgW: 1280, svgH: 720,
    cellW: 64, cellH: 46, cellPitch: 72,
    rowH: 130, topY: 130,
    leftX: 196,                                   // 8*72+64 ⇒ tree ends ≈ x=764
    labelFont: 18, sumFont: 14,
    sumLayout: 'right',
    sumX: 800, sumStartY: 130,
    sumRowH: 130, sumPanelW: 380,
    bottomCaptionY: 660,
    payoffY: 470,
    showLevelLabels: true,
    levelLabelX: 180, levelLabelFont: 11,
  };
}

// Slot range covered by node `idx` at level `k` (idx 0..2^k-1).
// At level k there are 2^k nodes; each node spans (8 / 2^k) leaf slots.
function nodeSpanAt(k, idx) {
  const span = 8 >> k;
  return { from: idx * span, to: idx * span + span - 1 };
}

// Centre x of node (k, idx) using the leaf grid.
function nodeCenterX(G, k, idx) {
  const { from, to } = nodeSpanAt(k, idx);
  const xFrom = G.leftX + from * G.cellPitch + G.cellW / 2;
  const xTo = G.leftX + to * G.cellPitch + G.cellW / 2;
  return (xFrom + xTo) / 2;
}

function nodeTopLeft(G, k, idx) {
  const cx = nodeCenterX(G, k, idx);
  const y = G.topY + k * G.rowH;
  return { x: cx - G.cellW / 2, y };
}

// ─── Single tree node (rounded box + cost label) ──────────────────────────
function TreeNode({ G, k, idx, state = 'idle', opacity = 1 }) {
  const { x, y } = nodeTopLeft(G, k, idx);
  const isLeafRow = k === TREE_LEVELS - 1;
  const border =
    state === 'highlight' ? 'var(--amber-300)' :
    state === 'leaf' ? 'var(--teal-400)' :
    state === 'active' ? 'var(--amber-400)' :
    state === 'dim' ? 'rgba(232,220,193,0.20)' :
    'rgba(232,220,193,0.32)';
  const bg =
    state === 'highlight' ? 'rgba(244,184,96,0.18)' :
    state === 'leaf' ? 'rgba(0,0,0,0.40)' :
    state === 'active' ? 'rgba(244,184,96,0.10)' :
    'rgba(0,0,0,0.45)';
  const textColor =
    state === 'leaf' ? 'var(--teal-400)' :
    state === 'highlight' ? 'var(--amber-300)' :
    state === 'dim' ? 'var(--chalk-300)' :
    'var(--chalk-100)';
  const label = isLeafRow ? '1' : COST_AT_LEVEL[k];
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={G.cellW} height={G.cellH} rx={9}
            fill={bg} stroke={border} strokeWidth={1.6}/>
      <text x={x + G.cellW / 2} y={y + G.cellH / 2 + G.labelFont * 0.36}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize={G.labelFont} fill={textColor}>
        {label}
      </text>
    </g>
  );
}

// Edge from parent (k, pIdx) bottom → child (k+1, cIdx) top, drawn via
// stroke-dashoffset over `drawT` ∈ [0,1].
function TreeEdge({ G, k, pIdx, cIdx, drawT, color = 'var(--amber-400)', opacity = 0.8 }) {
  const px = nodeCenterX(G, k, pIdx);
  const py = G.topY + k * G.rowH + G.cellH;
  const cx = nodeCenterX(G, k + 1, cIdx);
  const cy = G.topY + (k + 1) * G.rowH;
  const len = Math.hypot(cx - px, cy - py);
  const t = clamp(drawT, 0, 1);
  return (
    <line x1={px} y1={py} x2={cx} y2={cy}
          stroke={color} strokeWidth={1.5}
          strokeDasharray={len}
          strokeDashoffset={(1 - t) * len}
          opacity={opacity}/>
  );
}

function LevelLabel({ G, k, text, opacity = 1 }) {
  const y = G.topY + k * G.rowH + G.cellH / 2 + 4;
  return (
    <text x={G.levelLabelX} y={y}
          textAnchor="end"
          fontFamily="var(--font-mono)" fontSize={G.levelLabelFont}
          fill="var(--amber-300)" letterSpacing="0.16em" opacity={opacity}>
      {text}
    </text>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="verktøykassa"
      title="Rekursjonstre: arbeid på hvert nivå"
      duration={SCENE_DURATION}
      introEnd={10.3}
      introCaption="Rekursjonstreet er regnearket."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.3} end={23.75}>
        <Rekursjonsligningen/>
      </Sprite>

      <Sprite start={23.75} end={42.61}>
        <TreetVokser/>
      </Sprite>

      <Sprite start={42.61} end={54.2}>
        <Summering/>
      </Sprite>

      <Sprite start={54.2} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Rekursjonsligningen ──────────────────────────────────────────
// Lay out T(n) = 2 · T(n/2) + n as three boxed terms connected by mono
// operators. Boxes appear in sequence: T(n) on the left, then the split
// into 2·T(n/2) + n on the right. A caption underneath ties the parts
// to "arbeid på toppen / to halve problemer".
function Rekursjonsligningen() {
  const portrait = usePortrait();
  const layout = portrait
    ? {
        boxFont: 24, opFont: 28, gap: 14,
        wideW: 180, narrowW: 150, h: 78,
        topY: 460, captionY: 760,
        captionFont: 22,
      }
    : {
        boxFont: 28, opFont: 32, gap: 22,
        wideW: 230, narrowW: 200, h: 100,
        topY: 280, captionY: 470,
        captionFont: 24,
      };

  // Render the equation as a single centered row of <FadeUp> divs.
  const row = (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: layout.gap, flexWrap: portrait ? 'wrap' : 'nowrap',
    }}>
      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: layout.boxFont,
          color: 'var(--chalk-100)',
          padding: portrait ? '10px 18px' : '14px 22px',
          borderRadius: 12,
          border: '1.6px solid var(--amber-400)',
          background: 'rgba(244,184,96,0.10)',
          minWidth: layout.wideW, textAlign: 'center', whiteSpace: 'nowrap',
        }}>
        T(n)
      </FadeUp>
      <FadeUp duration={0.4} delay={0.9} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: layout.opFont,
          color: 'var(--chalk-300)',
        }}>
        =
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: layout.boxFont,
          color: 'var(--chalk-100)',
          padding: portrait ? '10px 18px' : '14px 22px',
          borderRadius: 12,
          border: '1.6px solid rgba(232,220,193,0.40)',
          background: 'rgba(0,0,0,0.50)',
          minWidth: layout.narrowW, textAlign: 'center', whiteSpace: 'nowrap',
        }}>
        2 · T(n/2)
      </FadeUp>
      <FadeUp duration={0.4} delay={2.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: layout.opFont,
          color: 'var(--chalk-300)',
        }}>
        +
      </FadeUp>
      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: layout.boxFont,
          color: 'var(--amber-300)',
          padding: portrait ? '10px 18px' : '14px 22px',
          borderRadius: 12,
          border: '1.6px solid var(--amber-300)',
          background: 'rgba(244,184,96,0.16)',
          minWidth: layout.narrowW * 0.6, textAlign: 'center', whiteSpace: 'nowrap',
        }}>
        n
      </FadeUp>
    </div>
  );

  return (
    <>
      <div style={{
        position: 'absolute', left: 0, right: 0, top: layout.topY,
        display: 'flex', justifyContent: 'center',
      }}>
        {row}
      </div>

      {/* Caption — ties the parts to their meaning */}
      <FadeUp duration={0.5} delay={3.2} distance={10}
        style={{
          position: 'absolute', left: 0, right: 0, top: layout.captionY,
          textAlign: 'center',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: layout.captionFont, color: 'var(--chalk-200)',
          maxWidth: portrait ? '22ch' : '40ch',
          marginLeft: 'auto', marginRight: 'auto',
          lineHeight: 1.35, padding: '0 24px',
        }}>
        <span style={{ color: 'var(--amber-300)' }}>n arbeid</span> her oppe —
        <span style={{ color: 'var(--chalk-100)' }}> to halve problemer</span> der nede.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Treet vokser (GENUINE MOTION) ────────────────────────────────
// Four-level recursion tree expands one level at a time. Each new level
// brings: (a) parent→child edges drawing in via dashoffset, (b) the new
// row of nodes fading in, (c) a row-sum badge to the right of the row
// asserting that the row totals to n.
function TreetVokser() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Schedule. The root sits alone for a beat; then three drop-waves bring
  // levels 1, 2, 3 — and four row-sum badges fade in in order.
  const LEVEL_AT = [at(0.05), at(0.20), at(0.38), at(0.56)];   // level k starts appearing
  const LEVEL_DUR = 0.95;
  const ROW_SUM_AT = [at(0.13), at(0.30), at(0.49), at(0.67)];

  function levelVis(k) {
    return clamp((localTime - LEVEL_AT[k]) / LEVEL_DUR, 0, 1);
  }
  function rowSumVis(k) {
    return clamp((localTime - ROW_SUM_AT[k]) / 0.5, 0, 1);
  }

  // Position of row-total badge k. In landscape it sits on the right at the
  // same y as the matching tree row. In portrait it stacks under the tree.
  function rowBadgePos(k) {
    if (G.sumLayout === 'right') {
      const y = G.sumStartY + k * G.sumRowH + G.cellH / 2 - 22;
      return { x: G.sumX, y, w: G.sumPanelW };
    }
    return { x: G.sumX, y: G.sumStartY + k * G.sumRowH, w: G.sumPanelW };
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Level eyebrows on the left (landscape only — too narrow in portrait). */}
      {G.showLevelLabels && [0, 1, 2, 3].map((k) => (
        <SvgFadeIn key={`lbl${k}`} duration={0.35} delay={LEVEL_AT[k] + 0.05}>
          <LevelLabel G={G} k={k}
                      text={k === 3 ? 'nivå 3 — løv' : `nivå ${k}`}/>
        </SvgFadeIn>
      ))}

      {/* Edges from level k → k+1. Each child drawn as its level lands. */}
      {[0, 1, 2].map((k) => {
        const parents = 1 << k;
        const t = (localTime - LEVEL_AT[k + 1]) / LEVEL_DUR;
        return Array.from({ length: parents }, (_, pIdx) => (
          <g key={`edges${k}-${pIdx}`}>
            <TreeEdge G={G} k={k} pIdx={pIdx} cIdx={2 * pIdx}     drawT={t}/>
            <TreeEdge G={G} k={k} pIdx={pIdx} cIdx={2 * pIdx + 1} drawT={t}/>
          </g>
        ));
      })}

      {/* Nodes, level by level. */}
      {[0, 1, 2, 3].map((k) => {
        const count = 1 << k;
        const vis = levelVis(k);
        if (vis <= 0) return null;
        const e = easeInOutCubic(vis);
        return Array.from({ length: count }, (_, idx) => (
          <TreeNode key={`n${k}-${idx}`} G={G} k={k} idx={idx}
                    state={k === 3 ? 'leaf' : 'idle'}
                    opacity={e}/>
        ));
      })}

      {/* Row-sum badges. Right column in landscape; stacked under the tree
          in portrait. */}
      {[0, 1, 2, 3].map((k) => {
        const a = rowSumVis(k);
        if (a <= 0) return null;
        const p = rowBadgePos(k);
        return (
          <g key={`sum${k}`} opacity={a}>
            <rect x={p.x} y={p.y}
                  width={p.w} height={44} rx={10}
                  fill="rgba(244,184,96,0.10)"
                  stroke="var(--amber-300)" strokeWidth={1.4}/>
            <text x={p.x + 14} y={p.y + 22 + G.sumFont * 0.36}
                  fontFamily="var(--font-mono)" fontSize={G.sumFont}
                  fill="var(--amber-300)">
              {ROW_SUM_TEXT[k]}
            </text>
          </g>
        );
      })}

      {/* Late caption — once all four rows have landed, asserts the rule. */}
      <SvgFadeIn duration={0.5} delay={at(0.84)}>
        <text x={G.svgW / 2} y={G.bottomCaptionY}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22}
              fill="var(--amber-300)">
          hver rad summerer til n
        </text>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 4: Summering (GENUINE MOTION) ───────────────────────────────────
// Same tree, dimmed. Each row-total badge highlights in turn (amber glow
// pulse) and a connector line trails down through them to the payoff pill
// that lands at the bottom. No animation of the badge positions — keeps
// the geometry stable and avoids overlap with the dim tree.
function Summering() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Choreography (fractions of T):
  //   0.05 → 4 badges light up in turn, ~0.6s each
  //   0.40 → "log₂ n nivåer" connector badge slides in below
  //   0.55 → payoff pill "n · log₂ n" lands
  const HL_AT      = [at(0.05), at(0.13), at(0.21), at(0.29)];
  const HL_DUR     = 0.55;
  const LOG_AT     = at(0.30);
  const PAYOFF_AT  = at(0.42);

  function rowHL(k) {
    return clamp((localTime - HL_AT[k]) / HL_DUR, 0, 1);
  }

  // Reuse the same badge geometry as beat 3 so the eye picks up the
  // continuity without any motion needed.
  function rowBadgePos(k) {
    if (G.sumLayout === 'right') {
      const y = G.sumStartY + k * G.sumRowH + G.cellH / 2 - 22;
      return { x: G.sumX, y, w: G.sumPanelW };
    }
    return { x: G.sumX, y: G.sumStartY + k * G.sumRowH, w: G.sumPanelW };
  }

  // Position of the log₂ n callout + the payoff pill. Landscape: a single
  // right-column stack below the row-totals. Portrait: below the badge stack.
  const last = rowBadgePos(3);
  const logPos = portrait
    ? { left: 80, top: last.y + 64, width: G.sumPanelW }
    : { left: G.sumX, top: last.y + 50, width: G.sumPanelW };
  const payoffPos = portrait
    ? { left: 0, right: 0, top: last.y + 130, textAlign: 'center' }
    : { left: G.sumX, top: last.y + 96, width: G.sumPanelW, textAlign: 'center' };

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        {/* Dim tree underlay — keeps context but doesn't compete. */}
        {[0, 1, 2].map((k) => {
          const parents = 1 << k;
          return Array.from({ length: parents }, (_, pIdx) => (
            <g key={`edge${k}-${pIdx}`} opacity={0.30}>
              <TreeEdge G={G} k={k} pIdx={pIdx} cIdx={2 * pIdx}     drawT={1}
                        color="rgba(232,220,193,0.40)"/>
              <TreeEdge G={G} k={k} pIdx={pIdx} cIdx={2 * pIdx + 1} drawT={1}
                        color="rgba(232,220,193,0.40)"/>
            </g>
          ));
        })}
        {[0, 1, 2, 3].map((k) => {
          const count = 1 << k;
          return Array.from({ length: count }, (_, idx) => (
            <TreeNode key={`n${k}-${idx}`} G={G} k={k} idx={idx}
                      state="dim" opacity={0.45}/>
          ));
        })}

        {/* Row-total badges in their natural positions; each one pulses
            into its "highlighted" state in sequence. */}
        {[0, 1, 2, 3].map((k) => {
          const hl = rowHL(k);                    // 0..1, 1 = fully highlighted
          const p = rowBadgePos(k);
          const fillAlpha = 0.10 + 0.20 * hl;
          const borderColor = hl > 0.4 ? 'var(--amber-300)' : 'rgba(244,184,96,0.45)';
          return (
            <g key={`sum${k}`}>
              <rect x={p.x} y={p.y} width={p.w} height={44} rx={10}
                    fill={`rgba(244,184,96,${fillAlpha.toFixed(3)})`}
                    stroke={borderColor} strokeWidth={1.4 + 0.6 * hl}/>
              <text x={p.x + 14} y={p.y + 22 + G.sumFont * 0.36}
                    fontFamily="var(--font-mono)" fontSize={G.sumFont}
                    fill="var(--amber-300)" opacity={0.6 + 0.4 * hl}>
                {ROW_SUM_TEXT[k]}
              </text>
            </g>
          );
        })}
      </svg>

      {/* "antall rader = log₂ n" connector badge — DOM layer for crisp
          typography (sub tag). */}
      <FadeUp duration={0.45} delay={LOG_AT} distance={8}
        style={{
          position: 'absolute',
          left: logPos.left, top: logPos.top, width: logPos.width,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)', textAlign: 'center',
          padding: '7px 12px',
          borderRadius: 10,
          border: '1.4px dashed rgba(232,220,193,0.40)',
          background: 'rgba(0,0,0,0.40)',
          boxSizing: 'border-box',
        }}>
        <span style={{ color: 'var(--chalk-300)' }}>antall rader </span>
        <span>= log<sub>2</sub> n</span>
      </FadeUp>

      {/* Payoff pill — n · log₂ n */}
      <FadeUp duration={0.55} delay={PAYOFF_AT} distance={14}
        style={{
          position: 'absolute',
          left: payoffPos.left, top: payoffPos.top,
          ...(payoffPos.right !== undefined ? { right: payoffPos.right } : { width: payoffPos.width }),
          textAlign: 'center',
        }}>
        <span style={{
          display: 'inline-block',
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 26 : 28,
          color: 'var(--amber-300)',
          padding: portrait ? '12px 22px' : '12px 24px',
          borderRadius: 14,
          border: '1.8px solid var(--amber-400)',
          background: 'rgba(244,184,96,0.14)',
          whiteSpace: 'nowrap',
        }}>
          n · log<sub>2</sub> n
        </span>
      </FadeUp>
    </>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: portrait ? 22 : 28,
      width: portrait ? '88%' : 'auto',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        kjøretid
      </FadeUp>

      <FadeUp duration={0.6} delay={0.5} distance={14}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 28 : 38,
          color: 'var(--amber-300)',
          padding: portrait ? '14px 26px' : '16px 32px',
          borderRadius: 14,
          border: '1.8px solid var(--amber-400)',
          background: 'rgba(244,184,96,0.12)',
          whiteSpace: 'nowrap',
        }}>
        T(n) = O(n log n)
      </FadeUp>

      <FadeUp duration={0.55} delay={2.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '40ch',
          lineHeight: 1.35,
        }}>
        Rekursjonstreet er motoren bak <span style={{ color: 'var(--amber-300)' }}>splitt og hersk</span>.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
