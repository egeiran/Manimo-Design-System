// Maks-haug: et nytt tall bobler oppover — Manimo lesson scene.
// Chapter 5 of algdat (Hauger og binære søketrær). A max-heap insert is the
// canonical sift-up motion piece: drop the new value at the next leaf slot,
// then bubble it up — compare with parent, swap if larger, repeat. The tree
// AND the array view stay in lockstep: every swap is one arc in the tree
// and one cell exchange in the row. Stops on the first parent that is not
// smaller than the new value. Lands on O(log n) — height of the balanced
// tree is the bound on swaps.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 8   Manimo hook
//    8–22   Struktur — tree edges trace in, array row appears, parent-child rule
//   22–43   Sift-opp — 47 enters, two swap arcs, stop verdict (GENUINE MOTION)
//   43–55   Kjøretid — worst-case path root-to-leaf, log n payoff
//   55–63   Takeaway
//
// Colour discipline:
//   chalk-100  node values, primary text
//   chalk-300  dimmed text / index labels
//   amber-400  primary node stroke, edges, active-rule highlight
//   amber-300  new value (47), array row, payoff numbers
//   rose-400   "swap!" verdict, comparison highlight ring
//   teal-400   the stop verdict (parent wins, sift-up halts)
//   violet-400 worst-case ascent path in kjoretid beat
//
// Milestones inside the motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 56;

const NARRATION = [
  /*  0– 8  */ 'En maks-haug holder alltid det største øverst. Hva skjer når et nytt tall kommer inn nederst?',
  /*  8–22  */ 'Hver forelder er minst like stor som barna — det er regelen som må holde. Vi lagrer haugen som en liste, og barna til indeks i ligger på to i pluss én og to i pluss to.',
  /* 22–43  */ 'Førtisju kommer inn på neste ledige plass. Den er større enn forelderen ti — bytt. Større enn tretti — bytt igjen. Men førtisju er mindre enn femti, så vi stopper. Tallet har boblet oppover til regelen holder.',
  /* 43–55  */ 'I verste fall klatrer det nye tallet helt opp til roten. Treet er balansert med høyde log to av n, så innsetting bruker bare orden log n bytter. En million tall — omtrent tjue bytter.',
  /* 55–63  */ 'Boble oppover, ett bytte om gangen — så ligger den største alltid på toppen.',
];

const NARRATION_AUDIO = 'audio/binaerhaug-sift-opp/scene.mp3';

// ─── Heap data ─────────────────────────────────────────────────────────────
// 7-node max-heap (levels 0..2 full). NEW_VALUE drops into index 7 (level 3
// slot 0) and must sift-up two steps before it lands under the root.
const HEAP_BEFORE = [50, 30, 40, 10, 20, 35, 25];
const NEW_VALUE = 47;
const FULL_LEN = HEAP_BEFORE.length + 1;            // 8 slots once 47 lands

// Sift-up trace (precomputed so the choreography below stays in sync with
// real algorithm output):
//   step 0:  child=7, parent=3 (10) → 47 > 10  → swap
//   step 1:  child=3, parent=1 (30) → 47 > 30  → swap
//   step 2:  child=1, parent=0 (50) → 47 < 50  → STOP
const SIFT_STEPS = (() => {
  const a = [...HEAP_BEFORE, NEW_VALUE];
  const out = [];
  let i = a.length - 1;
  while (i > 0) {
    const p = (i - 1) >> 1;
    const swap = a[i] > a[p];
    out.push({ child: i, parent: p, swap, childVal: a[i], parentVal: a[p] });
    if (!swap) break;
    [a[i], a[p]] = [a[p], a[i]];
    i = p;
  }
  return out;
})();

// Tree position for each array index — parent-centred layout. The level-3
// slot 0 hangs directly under index 3 (its parent).
function treeGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      cx0: 360, dx1: 140, dx2: 70, dx3: 35,
      y0: 250, dy: 130,
      nodeR: 28, edgeStroke: 1.5,
      valueFont: 18, idxFont: 11,
      arrX0: 60, arrCellW: 70, arrCellGap: 5, arrY: 870, arrH: 70, arrFont: 21, arrIdxFont: 11,
      verdictX: 60, verdictY: 1020, verdictW: 600,
      ruleX: 60, ruleY: 200, ruleFont: 14,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    cx0: 640, dx1: 240, dx2: 120, dx3: 60,
    y0: 145, dy: 80,
    nodeR: 24, edgeStroke: 1.5,
    valueFont: 17, idxFont: 10,
    arrX0: 316, arrCellW: 80, arrCellGap: 4, arrY: 490, arrH: 64, arrFont: 22, arrIdxFont: 10,
    verdictX: 320, verdictY: 612, verdictW: 640,
    ruleX: 980, ruleY: 165, ruleFont: 13,
  };
}

// Tree (x, y) for integer array index 0..7.
function treePosForIdx(G, i) {
  if (i === 0) return { x: G.cx0,                 y: G.y0 };
  if (i === 1) return { x: G.cx0 - G.dx1,         y: G.y0 + G.dy };
  if (i === 2) return { x: G.cx0 + G.dx1,         y: G.y0 + G.dy };
  if (i === 3) return { x: G.cx0 - G.dx1 - G.dx2, y: G.y0 + 2 * G.dy };
  if (i === 4) return { x: G.cx0 - G.dx1 + G.dx2, y: G.y0 + 2 * G.dy };
  if (i === 5) return { x: G.cx0 + G.dx1 - G.dx2, y: G.y0 + 2 * G.dy };
  if (i === 6) return { x: G.cx0 + G.dx1 + G.dx2, y: G.y0 + 2 * G.dy };
  if (i === 7) return { x: G.cx0 - G.dx1 - G.dx2 - G.dx3, y: G.y0 + 3 * G.dy };
  return { x: G.cx0, y: G.y0 };
}

// Array (x, y) for integer array index 0..7. (Cell top-left.)
function arrayPosForIdx(G, i) {
  return {
    x: G.arrX0 + i * (G.arrCellW + G.arrCellGap),
    y: G.arrY,
  };
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a, b, t) { return a + (b - a) * t; }

// Arc lerp — interpolates between p1 and p2 and lifts the path by `lift`
// pixels at midway (negative `lift` = arch upward in SVG y-down coords).
function arcLerp(p1, p2, t, lift) {
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t) + lift * Math.sin(Math.PI * t),
  };
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="hauger"
      title="Maks-haug: et nytt tall bobler oppover"
      duration={SCENE_DURATION}
      introEnd={5.96}
      introCaption="Hvor havner et nytt tall i haugen?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.96} end={19.32}>
        <StrukturBeat/>
      </Sprite>

      <Sprite start={19.32} end={36}>
        <SiftOppBeat/>
      </Sprite>

      <Sprite start={36} end={49.34}>
        <KjoretidBeat/>
      </Sprite>

      <Sprite start={49.34} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared SVG building blocks (tree + array twin view) ───────────────────
function TreeEdge({ G, parentIdx, childIdx, drawT, opacity = 1 }) {
  const p = treePosForIdx(G, parentIdx);
  const c = treePosForIdx(G, childIdx);
  // Stop the edge short of the node circles so the line doesn't punch through.
  const dx = c.x - p.x, dy = c.y - p.y;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  const x1 = p.x + ux * G.nodeR;
  const y1 = p.y + uy * G.nodeR;
  const x2 = c.x - ux * G.nodeR;
  const y2 = c.y - uy * G.nodeR;
  const segLen = Math.hypot(x2 - x1, y2 - y1);
  const t = clamp(drawT, 0, 1);
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="var(--amber-400)" strokeWidth={G.edgeStroke}
          strokeDasharray={segLen} strokeDashoffset={(1 - t) * segLen}
          opacity={opacity * 0.75}/>
  );
}

// state: 'idle' | 'active' | 'new' | 'stop' | 'compare'
function TreeNode({ G, x, y, value, state = 'idle', opacity = 1, glowScale = 1 }) {
  const stroke =
    state === 'new' ? 'var(--amber-300)' :
    state === 'compare' ? 'var(--rose-400)' :
    state === 'stop' ? 'var(--teal-400)' :
    state === 'active' ? 'var(--amber-400)' :
    'rgba(232,220,193,0.42)';
  const fill =
    state === 'new' ? 'rgba(244,184,96,0.18)' :
    state === 'compare' ? 'rgba(232,122,144,0.14)' :
    state === 'stop' ? 'rgba(0,0,0,0.55)' :
    'rgba(0,0,0,0.55)';
  const valColor = state === 'new' ? 'var(--amber-300)' : 'var(--chalk-100)';
  return (
    <g opacity={opacity}>
      {glowScale > 1 && (
        <circle cx={x} cy={y} r={G.nodeR * glowScale}
                fill="none" stroke={stroke} strokeWidth={1.5}
                opacity={0.45}/>
      )}
      <circle cx={x} cy={y} r={G.nodeR}
              fill={fill} stroke={stroke} strokeWidth={1.8}/>
      <text x={x} y={y + G.valueFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.valueFont} fill={valColor}>
        {value}
      </text>
    </g>
  );
}

// Array cell — drawn at its array (x, y). value can be undefined for the
// reserved-but-empty slot.
function ArrayCell({ G, idx, value, state = 'idle', opacity = 1, showIndex = true }) {
  const { x, y } = arrayPosForIdx(G, idx);
  const stroke =
    state === 'new' ? 'var(--amber-300)' :
    state === 'compare' ? 'var(--rose-400)' :
    state === 'stop' ? 'var(--teal-400)' :
    state === 'active' ? 'var(--amber-400)' :
    'rgba(232,220,193,0.32)';
  const fill =
    state === 'new' ? 'rgba(244,184,96,0.16)' :
    state === 'compare' ? 'rgba(232,122,144,0.12)' : 'rgba(0,0,0,0.40)';
  const valColor = state === 'new' ? 'var(--amber-300)' : 'var(--chalk-100)';
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={G.arrCellW} height={G.arrH} rx={9}
            fill={fill} stroke={stroke} strokeWidth={1.5}
            strokeDasharray={value == null ? '4 4' : undefined}/>
      {value != null && (
        <text x={x + G.arrCellW / 2} y={y + G.arrH * 0.5 + G.arrFont * 0.36}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={G.arrFont} fill={valColor}>
          {value}
        </text>
      )}
      {showIndex && (
        <text x={x + G.arrCellW / 2} y={y + G.arrH + G.arrIdxFont + 4}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={G.arrIdxFont} fill="var(--chalk-300)"
              letterSpacing="0.10em">
          {idx}
        </text>
      )}
    </g>
  );
}

// Eyebrow label above the array row.
function ArrayLabel({ G, opacity = 1, text = 'lista' }) {
  return (
    <text x={G.arrX0} y={G.arrY - 12}
          fontFamily="var(--font-mono)" fontSize={G.arrIdxFont + 1}
          fill="var(--amber-300)" letterSpacing="0.16em"
          style={{ textTransform: 'uppercase' }} opacity={opacity}>
      {text}
    </text>
  );
}

// ─── Beat 2: Struktur — heap as tree + array twin view ─────────────────────
function StrukturBeat() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Reveal phases:
  //   0.00–0.18  level 0 (root) fades in
  //   0.18–0.40  edges + level-1 nodes
  //   0.40–0.60  edges + level-2 nodes
  //   0.55–0.78  array row materialises with linking glow
  //   0.62–end   rule eyebrow + parent-child arithmetic caption
  const ROOT_AT = at(0.02);
  const LVL1_AT = at(0.18);
  const LVL2_AT = at(0.40);
  const ARR_AT = at(0.55);
  const RULE_AT = at(0.62);

  const nodeOpacity = (i) => {
    if (i === 0) return clamp((localTime - ROOT_AT) / 0.6, 0, 1);
    if (i <= 2) return clamp((localTime - LVL1_AT) / 0.6, 0, 1);
    if (i <= 6) return clamp((localTime - LVL2_AT) / 0.6, 0, 1);
    return 0;
  };

  const edgeDraw = (parentIdx, childIdx) => {
    const lvlAt = childIdx <= 2 ? LVL1_AT : LVL2_AT;
    return clamp((localTime - lvlAt) / 0.7, 0, 1);
  };

  // Glow connector lines drawn between each tree node and its array cell —
  // appears once the array materialises.
  const linkOpacity = clamp((localTime - ARR_AT) / 1.0, 0, 1) * 0.55;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Edges (parent → child) for the static 7-node heap */}
      {[
        [0, 1], [0, 2],
        [1, 3], [1, 4],
        [2, 5], [2, 6],
      ].map(([p, c]) => (
        <TreeEdge key={`e${p}-${c}`} G={G}
                  parentIdx={p} childIdx={c}
                  drawT={edgeDraw(p, c)}/>
      ))}

      {/* The seven nodes */}
      {HEAP_BEFORE.map((v, i) => {
        const { x, y } = treePosForIdx(G, i);
        return (
          <TreeNode key={`n${i}`} G={G} x={x} y={y} value={v}
                    state={i === 0 ? 'active' : 'idle'}
                    opacity={nodeOpacity(i)}/>
        );
      })}

      {/* Faint connector lines from tree node centre to its array cell centre
          — telegraphs "same data, two windows" once both are on screen. */}
      {linkOpacity > 0 && HEAP_BEFORE.map((v, i) => {
        const t = treePosForIdx(G, i);
        const a = arrayPosForIdx(G, i);
        const ax = a.x + G.arrCellW / 2;
        const ay = a.y;
        return (
          <line key={`lnk${i}`}
                x1={t.x} y1={t.y + G.nodeR}
                x2={ax} y2={ay}
                stroke="var(--amber-300)" strokeWidth={1}
                strokeDasharray="3 5"
                opacity={linkOpacity}/>
        );
      })}

      {/* Array row — 8 slots (index 0..7), last shown dashed to hint
          "tomt — venter på et nytt tall". */}
      <SvgFadeIn duration={0.5} delay={ARR_AT}>
        <ArrayLabel G={G} text="lista"/>
      </SvgFadeIn>
      <SvgFadeIn duration={0.5} delay={ARR_AT}>
        <g>
          {Array.from({ length: FULL_LEN }).map((_, i) => (
            <ArrayCell key={i} G={G} idx={i}
                       value={i < HEAP_BEFORE.length ? HEAP_BEFORE[i] : undefined}
                       state="idle"/>
          ))}
        </g>
      </SvgFadeIn>

      {/* The two-line rule caption — sits to the right of the tree in
          landscape, above the array in portrait. */}
      <SvgFadeIn duration={0.5} delay={RULE_AT}>
        <g>
          <text x={G.ruleX} y={G.ruleY}
                fontFamily="var(--font-mono)" fontSize={11}
                fill="var(--amber-300)" letterSpacing="0.16em"
                style={{ textTransform: 'uppercase' }}>
            haug-regelen
          </text>
          <text x={G.ruleX} y={G.ruleY + 24}
                fontFamily="var(--font-sans)" fontSize={G.ruleFont}
                fill="var(--chalk-100)">
            forelder ≥ begge barna
          </text>
          <text x={G.ruleX} y={G.ruleY + 24 + G.ruleFont * 1.8}
                fontFamily="var(--font-mono)" fontSize={G.ruleFont - 1}
                fill="var(--chalk-300)">
            barn(i) = 2i+1, 2i+2
          </text>
        </g>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 3: Sift-opp (GENUINE MOTION — bubble 47 up the tree + array) ─────
// Phase milestones (fractions of beat duration). Each "swap" phase has a
// short comparison highlight, then a smooth swap arc (47 rises, the other
// value falls). The stop phase is the final no-swap comparison.
const M = {
  spawn_start: 0.04,
  spawn_end:   0.10,
  cmp1_start:  0.16,
  cmp1_end:    0.22,
  swap1_start: 0.22,
  swap1_end:   0.34,
  cmp2_start:  0.42,
  cmp2_end:    0.48,
  swap2_start: 0.48,
  swap2_end:   0.60,
  cmp3_start:  0.68,
  cmp3_end:    0.74,
  stop_pulse_end: 0.84,
};

// Phase index from localTime fraction f = localTime / T:
//   0 = before spawn, 1 = 47 visible at 7, 2 = mid-swap1, 3 = post-swap1,
//   4 = mid-swap2, 5 = post-swap2, 6 = stop verdict, 7 = settled
function phaseOf(f) {
  if (f < M.spawn_start) return 0;
  if (f < M.swap1_start) return 1;
  if (f < M.swap1_end)   return 2;
  if (f < M.swap2_start) return 3;
  if (f < M.swap2_end)   return 4;
  if (f < M.cmp3_start)  return 5;
  if (f < M.stop_pulse_end) return 6;
  return 7;
}

// For each value, its array index as a function of beat fraction f. The
// values that aren't part of any swap stay put.
function valueIndexAt(v, f) {
  if (v === 50) return 0;
  if (v === 40) return 2;
  if (v === 20) return 4;
  if (v === 35) return 5;
  if (v === 25) return 6;
  if (v === NEW_VALUE) {
    if (f < M.spawn_start) return null;
    if (f < M.swap1_start) return 7;
    if (f < M.swap1_end) {
      const t = (f - M.swap1_start) / (M.swap1_end - M.swap1_start);
      return { from: 7, to: 3, t: easeInOutCubic(clamp(t, 0, 1)) };
    }
    if (f < M.swap2_start) return 3;
    if (f < M.swap2_end) {
      const t = (f - M.swap2_start) / (M.swap2_end - M.swap2_start);
      return { from: 3, to: 1, t: easeInOutCubic(clamp(t, 0, 1)) };
    }
    return 1;
  }
  if (v === 10) {
    if (f < M.swap1_start) return 3;
    if (f < M.swap1_end) {
      const t = (f - M.swap1_start) / (M.swap1_end - M.swap1_start);
      return { from: 3, to: 7, t: easeInOutCubic(clamp(t, 0, 1)) };
    }
    return 7;
  }
  if (v === 30) {
    if (f < M.swap2_start) return 1;
    if (f < M.swap2_end) {
      const t = (f - M.swap2_start) / (M.swap2_end - M.swap2_start);
      return { from: 1, to: 3, t: easeInOutCubic(clamp(t, 0, 1)) };
    }
    return 3;
  }
  return null;
}

// Resolve the tree (x, y) for a possibly-mid-swap value position. Rising
// value (newer, smaller idx) gets an upward arch; the falling one arches
// downward, so the two paths visibly cross.
function valueTreePos(G, v, idxState) {
  if (idxState == null) return null;
  if (typeof idxState === 'number') return treePosForIdx(G, idxState);
  const { from, to, t } = idxState;
  const p1 = treePosForIdx(G, from);
  const p2 = treePosForIdx(G, to);
  const rising = to < from;
  const lift = (rising ? -1 : 1) * Math.max(28, G.dy * 0.30);
  return arcLerp(p1, p2, t, lift);
}

// Same idea for the array row: the two swapping cells exchange contents.
// Linear horizontal slide with a tall vertical arc — the rising value
// soars HIGH above the row (~75 px), the falling one dips below — so the
// chips clear the static cells they horizontally pass over.
function valueArrayPos(G, v, idxState) {
  if (idxState == null) return null;
  if (typeof idxState === 'number') return arrayPosForIdx(G, idxState);
  const { from, to, t } = idxState;
  const p1 = arrayPosForIdx(G, from);
  const p2 = arrayPosForIdx(G, to);
  const rising = to < from;
  const hop = rising ? -G.arrH - 14 : G.arrH * 0.55;
  return {
    x: lerp(p1.x, p2.x, t),
    y: lerp(p1.y, p2.y, t) + hop * Math.sin(Math.PI * t),
  };
}

function VerdictBadge({ G, label, text, accent, opacity = 1 }) {
  return (
    <foreignObject x={G.verdictX} y={G.verdictY}
                   width={G.verdictW} height={120}
                   style={{ opacity }}>
      <div xmlns="http://www.w3.org/1999/xhtml" style={{
        padding: '14px 20px', borderRadius: 12,
        background: 'rgba(0,0,0,0.55)',
        border: `1.5px solid ${accent}`,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: accent, letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 22,
          color: 'var(--chalk-100)',
        }}>
          {text}
        </span>
      </div>
    </foreignObject>
  );
}

function SiftOppBeat() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const f = localTime / T;
  const phase = phaseOf(f);

  // Per-value live index state.
  const liveValues = [50, 30, 40, 10, 20, 35, 25, NEW_VALUE];
  const liveStates = liveValues.map(v => ({ v, idx: valueIndexAt(v, f) }));

  // Which integer index is each value occupying RIGHT NOW (for the array
  // "snapshot" — used by the static cells whose contents change only at
  // swap boundaries). When mid-swap, we still render the swapping pair
  // separately as floating chips, so the static array hides those cells.
  function resolvedIdx(state) {
    if (state == null) return null;
    if (typeof state === 'number') return state;
    return state.t < 0.5 ? state.from : state.to;
  }

  // Compute which cells are mid-swap (so we can hide them in the static
  // array layer and overlay the floating values above).
  const swappingIdxs = new Set();
  for (const s of liveStates) {
    if (s.idx && typeof s.idx === 'object') {
      swappingIdxs.add(s.idx.from);
      swappingIdxs.add(s.idx.to);
    }
  }

  // Static array values keyed by integer index.
  const staticArrayValue = {};
  for (const s of liveStates) {
    const i = resolvedIdx(s.idx);
    if (i == null) continue;
    if (swappingIdxs.has(i) && s.idx && typeof s.idx === 'object') continue;
    staticArrayValue[i] = s.v;
  }

  // Comparison/verdict state for the badge + node ring highlights.
  let cmpPair = null;     // [parentIdx, childIdx]
  let cmpKind = null;     // 'compare' | 'swap' | 'stop'
  let badge = null;
  if (f >= M.cmp1_start && f < M.cmp1_end) {
    cmpPair = [3, 7]; cmpKind = 'compare';
    badge = { label: 'sammenligning 1', text: '47  >  10  →  bytt', accent: 'var(--rose-400)' };
  } else if (f >= M.swap1_start && f < M.swap1_end) {
    cmpPair = [3, 7]; cmpKind = 'swap';
    badge = { label: 'bytt', text: '47 stiger til indeks 3', accent: 'var(--amber-400)' };
  } else if (f >= M.cmp2_start && f < M.cmp2_end) {
    cmpPair = [1, 3]; cmpKind = 'compare';
    badge = { label: 'sammenligning 2', text: '47  >  30  →  bytt', accent: 'var(--rose-400)' };
  } else if (f >= M.swap2_start && f < M.swap2_end) {
    cmpPair = [1, 3]; cmpKind = 'swap';
    badge = { label: 'bytt', text: '47 stiger til indeks 1', accent: 'var(--amber-400)' };
  } else if (f >= M.cmp3_start && f < M.cmp3_end) {
    cmpPair = [0, 1]; cmpKind = 'compare';
    badge = { label: 'sammenligning 3', text: '47  <  50  →  stopp', accent: 'var(--teal-400)' };
  } else if (f >= M.cmp3_end && f < M.stop_pulse_end) {
    cmpPair = [0, 1]; cmpKind = 'stop';
    badge = { label: 'stopp', text: 'haug-regelen holder', accent: 'var(--teal-400)' };
  } else if (f >= M.spawn_start && f < M.cmp1_start) {
    badge = { label: 'ny verdi', text: '47 inn på indeks 7', accent: 'var(--amber-300)' };
  } else if (f >= M.stop_pulse_end) {
    badge = { label: 'ferdig', text: 'to bytter — boblet i mål', accent: 'var(--amber-300)' };
  }

  // Glow pulse on the stop node: amplifies on the stop verdict.
  const stopGlow = cmpKind === 'stop'
    ? 1 + 0.18 * Math.sin((localTime - M.cmp3_end * T) * Math.PI * 2 / 0.8)
    : 1;

  // Hide the empty index-7 placeholder once 47 has spawned (it's covered
  // by the moving cell from then on).
  const showEmpty7 = f < M.spawn_start;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Tree edges — include the new edge to slot 7 once 47 spawns. */}
      {[
        [0, 1], [0, 2],
        [1, 3], [1, 4],
        [2, 5], [2, 6],
        [3, 7],
      ].map(([p, c]) => (
        <TreeEdge key={`e${p}-${c}`} G={G}
                  parentIdx={p} childIdx={c}
                  drawT={c === 7 ? clamp((localTime - M.spawn_start * T) / 0.5, 0, 1) : 1}
                  opacity={c === 7 && f < M.spawn_start ? 0 : 1}/>
      ))}

      {/* Static tree nodes (values not currently mid-swap). */}
      {liveStates.map(({ v, idx }) => {
        if (idx == null) return null;
        // Mid-swap values are rendered in the floating layer below.
        if (idx && typeof idx === 'object') return null;
        const i = idx;
        const pos = treePosForIdx(G, i);
        // Spawn opacity for 47.
        let opacity = 1;
        if (v === NEW_VALUE && f < M.spawn_end) {
          opacity = clamp((f - M.spawn_start) / (M.spawn_end - M.spawn_start), 0, 1);
        }
        // Node state from current comparison/verdict context.
        let state = (v === NEW_VALUE ? 'new' : 'idle');
        let glow = 1;
        if (cmpPair && cmpPair.includes(i)) {
          state = (cmpKind === 'stop' ? 'stop' : 'compare');
          glow = cmpKind === 'stop' ? stopGlow : 1.18;
        }
        return (
          <TreeNode key={`tn${v}`} G={G}
                    x={pos.x} y={pos.y}
                    value={v} state={state}
                    opacity={opacity} glowScale={glow}/>
        );
      })}

      {/* Floating tree nodes for values currently arcing between positions. */}
      {liveStates.map(({ v, idx }) => {
        if (idx == null || typeof idx === 'number') return null;
        const pos = valueTreePos(G, v, idx);
        // Use the trailing-edge state for colouring: rising = "new",
        // falling = neutral "active".
        const rising = idx.to < idx.from;
        return (
          <TreeNode key={`mv${v}`} G={G}
                    x={pos.x} y={pos.y}
                    value={v}
                    state={rising ? 'new' : 'active'}/>
        );
      })}

      {/* Array label */}
      <ArrayLabel G={G}/>

      {/* Static array cells (those not currently mid-swap). */}
      {Array.from({ length: FULL_LEN }).map((_, i) => {
        if (swappingIdxs.has(i)) {
          // During a swap the cell becomes a "dashed waiting" frame so the
          // viewer sees both ends of the swap as empty placeholders.
          return (
            <ArrayCell key={`ac${i}`} G={G} idx={i}
                       value={undefined}
                       state={cmpPair && cmpPair.includes(i) ? cmpKind : 'idle'}/>
          );
        }
        const v = staticArrayValue[i];
        if (v == null && !(showEmpty7 && i === 7)) {
          // Cell exists but no value: only render empty cell for the
          // still-unfilled index-7 slot before 47 spawns.
          if (i === 7 && !showEmpty7) return null;
        }
        // Active highlights for non-swapping cells in the current comparison.
        let state = 'idle';
        if (cmpPair && cmpPair.includes(i) && !swappingIdxs.has(i)) {
          state = (cmpKind === 'stop' ? 'stop' : 'compare');
        } else if (v === NEW_VALUE) {
          state = 'new';
        }
        return (
          <ArrayCell key={`ac${i}`} G={G} idx={i}
                     value={v}
                     state={state}/>
        );
      })}

      {/* Floating array cells for values currently swapping. */}
      {liveStates.map(({ v, idx }) => {
        if (idx == null || typeof idx === 'number') return null;
        const pos = valueArrayPos(G, v, idx);
        const rising = idx.to < idx.from;
        const stroke = rising ? 'var(--amber-300)' : 'var(--amber-400)';
        const fill = rising ? 'rgba(244,184,96,0.18)' : 'rgba(244,184,96,0.10)';
        const valColor = rising ? 'var(--amber-300)' : 'var(--chalk-100)';
        return (
          <g key={`mac${v}`}>
            <rect x={pos.x} y={pos.y} width={G.arrCellW} height={G.arrH} rx={9}
                  fill={fill} stroke={stroke} strokeWidth={1.5}/>
            <text x={pos.x + G.arrCellW / 2}
                  y={pos.y + G.arrH * 0.5 + G.arrFont * 0.36}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.arrFont} fill={valColor}>
              {v}
            </text>
          </g>
        );
      })}

      {/* Verdict badge */}
      {badge && (
        <VerdictBadge G={G}
                      label={badge.label} text={badge.text}
                      accent={badge.accent}/>
      )}
    </svg>
  );
}

// ─── Beat 4: Kjøretid — log n bound on the worst-case ascent ───────────────
function KjoretidBeat() {
  const portrait = usePortrait();
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Layout for the worst-case tree diagram. Five-level balanced tree with
  // a violet arrow climbing from a leaf at level 4 to the root at level 0.
  const G = portrait
    ? { svgW: 720, svgH: 1280, cx: 380, dy: 110, top: 270, radius: 17, levels: 5 }
    : { svgW: 1280, svgH: 720, cx: 640, dy: 58, top: 140, radius: 13, levels: 5 };
  const LEVEL_AT = [at(0.10), at(0.20), at(0.30), at(0.40), at(0.50)];

  // For each level k, place 2^k nodes evenly across a `levelWidth`.
  const levelWidth = portrait ? 470 : 720;
  function nodeXY(k, pos) {
    const cnt = 1 << k;
    const stride = levelWidth / (cnt + 1);
    return {
      x: G.cx - levelWidth / 2 + stride * (pos + 1),
      y: G.top + k * G.dy,
    };
  }

  // The ascending value walks: leaf (k=4 pos=0) → k=3 pos=0 → … → root.
  const ASCENT_AT = at(0.62);
  const ASCENT_END = at(0.92);
  const ascentT = clamp((localTime - ASCENT_AT) / (ASCENT_END - ASCENT_AT), 0, 1);
  // Path points: from level 4 → 3 → 2 → 1 → 0 — four edge segments.
  const PATH = [4, 3, 2, 1, 0].map(k => nodeXY(k, 0));
  const segIdx = Math.min(Math.floor(ascentT * 4), 3);
  const segLocal = ascentT * 4 - segIdx;
  const p1 = PATH[segIdx], p2 = PATH[segIdx + 1];
  const climber = {
    x: lerp(p1.x, p2.x, easeInOutCubic(segLocal)),
    y: lerp(p1.y, p2.y, easeInOutCubic(segLocal)),
  };

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>

        {/* Height bracket on the left of the tree — labels "log₂ n". */}
        <SvgFadeIn duration={0.5} delay={LEVEL_AT[4] + 0.3}>
          <g>
            <line x1={G.cx - levelWidth / 2 - 30}
                  y1={G.top - 10}
                  x2={G.cx - levelWidth / 2 - 30}
                  y2={G.top + (G.levels - 1) * G.dy + 10}
                  stroke="var(--violet-400)" strokeWidth={1.5}/>
            <line x1={G.cx - levelWidth / 2 - 38}
                  y1={G.top - 10}
                  x2={G.cx - levelWidth / 2 - 22}
                  y2={G.top - 10}
                  stroke="var(--violet-400)" strokeWidth={1.5}/>
            <line x1={G.cx - levelWidth / 2 - 38}
                  y1={G.top + (G.levels - 1) * G.dy + 10}
                  x2={G.cx - levelWidth / 2 - 22}
                  y2={G.top + (G.levels - 1) * G.dy + 10}
                  stroke="var(--violet-400)" strokeWidth={1.5}/>
            <text x={G.cx - levelWidth / 2 - 48}
                  y={G.top + (G.levels - 1) * G.dy / 2 + 5}
                  textAnchor="end"
                  fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={portrait ? 22 : 18}
                  fill="var(--violet-400)">
              log₂ n
            </text>
          </g>
        </SvgFadeIn>

        {/* Edges level k → k+1, drawn level by level. */}
        {[0, 1, 2, 3].map((k) => {
          const t = clamp((localTime - LEVEL_AT[k + 1]) / 0.5, 0, 1);
          const parents = 1 << k;
          return (
            <g key={`edges${k}`}>
              {Array.from({ length: parents }).map((_, p) => {
                const pp = nodeXY(k, p);
                const cL = nodeXY(k + 1, 2 * p);
                const cR = nodeXY(k + 1, 2 * p + 1);
                return (
                  <g key={p}>
                    <line x1={pp.x} y1={pp.y + G.radius}
                          x2={cL.x} y2={cL.y - G.radius}
                          stroke="rgba(232,220,193,0.32)" strokeWidth={1.2}
                          strokeDasharray={Math.hypot(cL.x - pp.x, cL.y - pp.y)}
                          strokeDashoffset={(1 - t) * Math.hypot(cL.x - pp.x, cL.y - pp.y)}/>
                    <line x1={pp.x} y1={pp.y + G.radius}
                          x2={cR.x} y2={cR.y - G.radius}
                          stroke="rgba(232,220,193,0.32)" strokeWidth={1.2}
                          strokeDasharray={Math.hypot(cR.x - pp.x, cR.y - pp.y)}
                          strokeDashoffset={(1 - t) * Math.hypot(cR.x - pp.x, cR.y - pp.y)}/>
                  </g>
                );
              })}
            </g>
          );
        })}

        {/* Nodes — open circles, faint. */}
        {[0, 1, 2, 3, 4].map((k) => (
          <SvgFadeIn key={`nodes${k}`} duration={0.4} delay={LEVEL_AT[k]}>
            <g>
              {Array.from({ length: 1 << k }).map((_, p) => {
                const pos = nodeXY(k, p);
                return (
                  <circle key={p} cx={pos.x} cy={pos.y} r={G.radius}
                          fill="rgba(0,0,0,0.45)"
                          stroke="rgba(232,220,193,0.36)" strokeWidth={1.4}/>
                );
              })}
            </g>
          </SvgFadeIn>
        ))}

        {/* The worst-case path — full ascent path traced as a violet line
            up the left spine. */}
        <SvgFadeIn duration={0.4} delay={ASCENT_AT - 0.2}>
          <polyline
            points={PATH.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="var(--violet-400)" strokeWidth={2}
            opacity={0.4}/>
        </SvgFadeIn>

        {/* Climbing value chip — a small filled circle that walks the path. */}
        {localTime >= ASCENT_AT && (
          <g>
            <circle cx={climber.x} cy={climber.y} r={G.radius + 4}
                    fill="rgba(244,184,96,0.20)"
                    stroke="var(--amber-300)" strokeWidth={2}/>
            <text x={climber.x} y={climber.y + 5}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={11} fill="var(--amber-300)">
              ny
            </text>
          </g>
        )}
      </svg>

      {/* Bottom-anchored payoff readouts — works in both aspects. */}
      <FadeUp duration={0.5} delay={ASCENT_END - 0.4} distance={10}
        style={{
          position: 'absolute', left: 0, right: 0,
          ...(portrait ? { bottom: 200 } : { bottom: 110 }),
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          alignItems: 'center', justifyContent: 'center',
          gap: portrait ? 14 : 22,
        }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', whiteSpace: 'nowrap',
        }}>
          verste fall
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 20 : 22,
          color: 'var(--chalk-100)',
          padding: portrait ? '10px 18px' : '10px 20px', borderRadius: 10,
          border: '1.5px solid var(--amber-400)',
          background: 'rgba(244,184,96,0.10)',
          whiteSpace: 'nowrap',
        }}>
          1 000 000 tall  →  ca. 20 bytter
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 20 : 20,
          color: 'var(--chalk-200)', lineHeight: 1.35,
          maxWidth: portrait ? '32ch' : '34ch',
          textAlign: portrait ? 'center' : 'left',
        }}>
          <span style={{ color: 'var(--amber-300)' }}>orden log n</span> bytter, ikke <span style={{ color: 'var(--rose-300)' }}>orden n</span>.
        </div>
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
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        sift-opp
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 27 : 38, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '32ch', lineHeight: 1.22,
        }}>
        Boble oppover — <span style={{ color: 'var(--amber-300)' }}>ett bytte om gangen.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
          color: 'var(--amber-300)',
          padding: portrait ? '8px 14px' : '10px 18px', borderRadius: 10,
          border: '1.5px solid var(--amber-400)',
          background: 'rgba(244,184,96,0.10)',
        }}>
        den største ligger alltid på toppen
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
