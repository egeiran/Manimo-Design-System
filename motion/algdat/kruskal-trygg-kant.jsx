// Kruskals algoritme: trygge kanter først — Manimo lesson scene.
// Chapter 9 of algdat (Minimale spenntrær). Kruskal builds the MST by sorting
// the edges by weight and then walking the sorted list — each edge that
// would NOT close a cycle joins the tree (a "safe" edge); each edge that
// would close one is skipped. Five vertices, six weighted edges, four
// accepts (1, 2, 3, 6) and two skips (4, 5). Total MST weight = 12.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10   Manimo hook
//   10–18   Graf + vekter: vertices + 6 weighted edges fade in
//   18–28   Sortér kantene (GENUINE MOTION — edge rows physically swap rows
//           on their way from insertion order to sorted-by-weight order)
//   28–52   Sveip og dømm (GENUINE MOTION — pointer walks down the sorted
//           list, each graph edge lights teal → amber on accept or rose on
//           cycle-skip, the MST progressively connects all five vertices)
//   52–60   Takeaway — MST + totalvekt + O(m log m)
//
// Colour discipline:
//   chalk-100  vertex letters, payoff text
//   chalk-200  weight labels, edge-row text
//   chalk-300  idle edges, list dividers
//   amber-400  primary stroke for MST edges + settled vertex rings
//   amber-300  weight badges on MST edges, eyebrows, payoff highlights
//   teal-400   "candidate" — current edge being evaluated, sort pointer
//   rose-400   skipped edge stroke flash
//   rose-300   skip indicator + "sirkel" caption
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 60;

const NARRATION = [
  /*  0–10  */ 'Hvilke kanter må vi ta med for å koble alle nodene sammen så billig som mulig? Kruskals algoritme finner svaret — én trygg kant av gangen.',
  /* 10–18  */ 'Her er fem byer og seks veier, hver med sin kostnad. Vi vil koble alle sammen og bruke minst mulig.',
  /* 18–28  */ 'Først sorterer vi kantene etter vekt — den letteste først, den tyngste til slutt.',
  /* 28–52  */ 'Så går vi gjennom listen ovenfra og ned. Ta kanten hvis den ikke lager en sirkel — ellers hopp over. A til B med vekt én er trygg. C til D med to er trygg. B til C med tre kobler de to delene sammen. A til C med fire ville lukket en sirkel — hopp over. B til D med fem også — hopp. Til slutt D til E med seks kobler den siste byen inn.',
  /* 52–60  */ 'Fire trygge kanter, og alle nodene henger sammen. Det er det minimale spenntreet, og totalvekten er tolv.',
];

const NARRATION_AUDIO = 'audio/kruskal-trygg-kant/scene.mp3';

// ─── Graph data ────────────────────────────────────────────────────────────
// Five vertices A..E. The MST exists on the K4-minus-one-edge induced on
// {A,B,C,D} plus the pendant D–E.
const NODE_IDS = ['A', 'B', 'C', 'D', 'E'];

// Insertion order — the order the unsorted list shows the edges before the
// sort runs.
//   AB:1   BC:3   AC:4   CD:2   BD:5   DE:6
const EDGES_INSERT = [
  ['A', 'B', 1],
  ['B', 'C', 3],
  ['A', 'C', 4],
  ['C', 'D', 2],
  ['B', 'D', 5],
  ['D', 'E', 6],
];

// Sorted by weight — the order Kruskal walks the list. Fourth field is
// whether the edge is safe to take (true) or would close a cycle (false).
//   AB:1 ✓   CD:2 ✓   BC:3 ✓   AC:4 ✗   BD:5 ✗   DE:6 ✓
const EDGES_SORTED = [
  { u: 'A', v: 'B', w: 1, accept: true  },
  { u: 'C', v: 'D', w: 2, accept: true  },
  { u: 'B', v: 'C', w: 3, accept: true  },
  { u: 'A', v: 'C', w: 4, accept: false },
  { u: 'B', v: 'D', w: 5, accept: false },
  { u: 'D', v: 'E', w: 6, accept: true  },
];

// Helper: find the index in EDGES_SORTED for an undirected pair.
function sortedIndexOf(u, v) {
  return EDGES_SORTED.findIndex(e =>
    (e.u === u && e.v === v) || (e.u === v && e.v === u));
}

// Map insertion-index -> sorted-index. Drives the row-swap animation in
// the sort beat.
//   insertion: [AB, BC, AC, CD, BD, DE]
//   sorted   : [AB, CD, BC, AC, BD, DE]
//   so AB:0→0, BC:1→2, AC:2→3, CD:3→1, BD:4→4, DE:5→5
const INSERT_TO_SORTED = EDGES_INSERT.map(([u, v]) => sortedIndexOf(u, v));

// MST edges (the four accept=true rows from EDGES_SORTED).
const MST_EDGES = EDGES_SORTED.filter(e => e.accept).map(e => [e.u, e.v]);
function isMstEdge(u, v) {
  for (const [a, b] of MST_EDGES) {
    if ((a === u && b === v) || (a === v && b === u)) return true;
  }
  return false;
}

// Set of vertices that are in the partial MST after processing the first
// k+1 sorted edges. Index k = state at the end of step k.
//   step 0 (AB ✓):     {A,B}
//   step 1 (CD ✓):     {A,B,C,D}  (wait — CD merges {C,D}, but A,B were already
//                                   in their own component → after step 1
//                                   the settled-set is {A,B,C,D} because the
//                                   "settled" visual just means "incident to
//                                   a chosen MST edge")
//   step 2 (BC ✓):     {A,B,C,D}
//   step 3 (AC ✗):     {A,B,C,D}
//   step 4 (BD ✗):     {A,B,C,D}
//   step 5 (DE ✓):     {A,B,C,D,E}
const SETTLED_AFTER = [
  new Set(['A', 'B']),
  new Set(['A', 'B', 'C', 'D']),
  new Set(['A', 'B', 'C', 'D']),
  new Set(['A', 'B', 'C', 'D']),
  new Set(['A', 'B', 'C', 'D']),
  new Set(['A', 'B', 'C', 'D', 'E']),
];

const MST_TOTAL_WEIGHT = MST_EDGES.reduce((s, [u, v]) => {
  const e = EDGES_SORTED[sortedIndexOf(u, v)];
  return s + e.w;
}, 0); // = 12

// ─── Layout ────────────────────────────────────────────────────────────────
// Landscape: graph occupies the left half, sorted list on the right.
// Portrait: graph occupies the top half, sorted list stacked below.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      nodes: {
        A: { x: 360, y: 250 },
        B: { x: 170, y: 460 },
        C: { x: 550, y: 460 },
        D: { x: 360, y: 680 },
        E: { x: 590, y: 680 },
      },
      nodeR: 34, edgeStroke: 2.0,
      letterFont: 24, weightFont: 14,
      listX: 110, listY: 830,
      listW: 500, rowH: 50, rowGap: 6,
      rowFont: 18, rowWeightFont: 18, rowVerdictFont: 16,
      pointerX: 80,
      actionY: 1200, actionFont: 17,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    nodes: {
      A: { x: 320, y: 180 },
      B: { x: 160, y: 370 },
      C: { x: 480, y: 370 },
      D: { x: 320, y: 560 },
      E: { x: 540, y: 560 },
    },
    nodeR: 30, edgeStroke: 1.8,
    letterFont: 22, weightFont: 13,
    listX: 720, listY: 150,
    listW: 480, rowH: 54, rowGap: 6,
    rowFont: 18, rowWeightFont: 18, rowVerdictFont: 16,
    pointerX: 692,
    actionY: 658, actionFont: 15,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Weight badge placement on a graph edge ───────────────────────────────
function weightPlacement(p1, p2) {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  return { x: mx + nx * 14, y: my + ny * 14 };
}

// ─── Graph primitives ──────────────────────────────────────────────────────
// state: 'idle' | 'settled' | 'candidate' (endpoint of edge being evaluated)
function GraphNode({ G, id, x, y, state }) {
  const border =
    state === 'settled' ? 'var(--amber-400)' :
    state === 'candidate' ? 'var(--teal-400)' :
    'rgba(232,220,193,0.30)';
  const { bgFill, bgOpacity } =
    state === 'settled' ? { bgFill: 'var(--amber-400)', bgOpacity: 0.14 } :
    state === 'candidate' ? { bgFill: 'var(--teal-400)', bgOpacity: 0.12 } :
    { bgFill: 'rgba(0,0,0,0.55)', bgOpacity: 1 };
  const letterColor = state === 'idle' ? 'var(--chalk-300)' : 'var(--chalk-100)';
  return (
    <g>
      <circle cx={x} cy={y} r={G.nodeR} fill={bgFill} fillOpacity={bgOpacity}
              stroke={border} strokeWidth={1.8}/>
      <text x={x} y={y + G.letterFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.letterFont} fill={letterColor}>
        {id}
      </text>
    </g>
  );
}

// Edge state: 'idle' | 'tree' (in MST, amber) | 'candidate' (teal, current
// edge being evaluated) | 'reject' (rose dashed — skipped this step)
function GraphEdge({ G, p1, p2, weight, state = 'idle', draw = 1, opacity = 1 }) {
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const d = clamp(draw, 0, 1);
  const stroke =
    state === 'tree' ? 'var(--amber-400)' :
    state === 'candidate' ? 'var(--teal-400)' :
    state === 'reject' ? 'var(--rose-400)' :
    'rgba(232,220,193,0.32)';
  const width =
    state === 'tree' ? 2.8 :
    state === 'candidate' ? 2.6 :
    state === 'reject' ? 2.4 :
    G.edgeStroke;
  const dash = state === 'reject' ? '6 5' : undefined;
  return (
    <g opacity={opacity}>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={stroke} strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={dash || len}
            strokeDashoffset={dash ? 0 : (1 - d) * len}/>
      {weight !== undefined && (
        <WeightBadge G={G} p1={p1} p2={p2} value={weight}
          state={state}/>
      )}
    </g>
  );
}

function WeightBadge({ G, p1, p2, value, state }) {
  const p = weightPlacement(p1, p2);
  const color =
    state === 'tree' ? 'var(--amber-300)' :
    state === 'candidate' ? 'var(--teal-400)' :
    state === 'reject' ? 'var(--rose-300)' :
    'var(--chalk-300)';
  return (
    <g>
      <rect x={p.x - 11} y={p.y - 10}
            width={22} height={20} rx={5}
            fill="#0c0a1f" fillOpacity={0.92}
            stroke="none"/>
      <text x={p.x} y={p.y + G.weightFont * 0.34}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.weightFont} fill={color}>
        {value}
      </text>
    </g>
  );
}

// ─── List row primitive ────────────────────────────────────────────────────
// One edge in the sorted list. Status:
//   'pending'  — not yet evaluated, dim
//   'current'  — pointer is on this row (teal accent)
//   'accept'   — verdict given, edge added to MST (amber check)
//   'reject'   — verdict given, edge skipped (rose cross)
function EdgeRow({ G, x, y, w, h, edge, status, fadeIn = 1 }) {
  // Layout inside the row:
  //   [ pair-label "A–B" ]   [ weight 1 ]   [ verdict ✓/✗ ]
  const padL = 18;
  const padR = 18;
  const pairX = x + padL;
  const verdictX = x + w - padR - 14;
  const weightX = x + w - padR - 60;

  const border =
    status === 'current' ? 'var(--teal-400)' :
    status === 'accept'  ? 'var(--amber-400)' :
    status === 'reject'  ? 'var(--rose-400)' :
    'rgba(232,220,193,0.22)';
  const { bgFill, bgOpacity } =
    status === 'current' ? { bgFill: 'var(--teal-400)',  bgOpacity: 0.12 } :
    status === 'accept'  ? { bgFill: 'var(--amber-400)', bgOpacity: 0.10 } :
    status === 'reject'  ? { bgFill: 'var(--rose-400)',  bgOpacity: 0.10 } :
    { bgFill: 'rgba(0,0,0,0.45)', bgOpacity: 1 };
  const labelColor =
    status === 'pending' ? 'var(--chalk-300)' : 'var(--chalk-100)';
  const weightColor =
    status === 'accept'  ? 'var(--amber-300)' :
    status === 'reject'  ? 'var(--rose-300)' :
    status === 'current' ? 'var(--teal-400)' :
    'var(--chalk-200)';

  return (
    <g opacity={fadeIn}>
      <rect x={x} y={y} width={w} height={h} rx={10}
            fill={bgFill} fillOpacity={bgOpacity}
            stroke={border} strokeWidth={1.6}/>
      {/* Pair "A — B" */}
      <text x={pairX} y={y + h * 0.62}
            textAnchor="start" fontFamily="var(--font-mono)"
            fontSize={G.rowFont} fill={labelColor}
            letterSpacing="0.08em">
        {`${edge.u}  —  ${edge.v}`}
      </text>
      {/* Weight */}
      <text x={weightX} y={y + h * 0.62}
            textAnchor="end" fontFamily="var(--font-mono)"
            fontSize={G.rowWeightFont} fill={weightColor}>
        {edge.w}
      </text>
      {/* Verdict glyph */}
      {status === 'accept' && (
        <g>
          <circle cx={verdictX} cy={y + h * 0.5} r={11}
                  fill="none" stroke="var(--amber-300)" strokeWidth={1.6}/>
          <path d={`M ${verdictX - 5} ${y + h * 0.5} l 3.6 4 l 6.4 -7`}
                stroke="var(--amber-300)" strokeWidth={2} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}
      {status === 'reject' && (
        <g>
          <circle cx={verdictX} cy={y + h * 0.5} r={11}
                  fill="none" stroke="var(--rose-300)" strokeWidth={1.6}/>
          <path d={`M ${verdictX - 5} ${y + h * 0.5 - 5} l 10 10 M ${verdictX + 5} ${y + h * 0.5 - 5} l -10 10`}
                stroke="var(--rose-300)" strokeWidth={2} fill="none"
                strokeLinecap="round"/>
        </g>
      )}
    </g>
  );
}

// Convenience: row-y for a given list index.
function rowY(G, idx) {
  return G.listY + idx * (G.rowH + G.rowGap);
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="minimale spenntrær"
      title="Kruskals algoritme: trygge kanter først"
      duration={SCENE_DURATION}
      introEnd={10.41}
      introCaption="Sortér, og vær grådig — trygge kanter først."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.41} end={18.16}>
        <InitialGraphBeat/>
      </Sprite>

      <Sprite start={18.16} end={23.82}>
        <SortEdgesBeat/>
      </Sprite>

      <Sprite start={23.82} end={51.03}>
        <SweepAcceptBeat/>
      </Sprite>

      <Sprite start={51.03} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Graf + vekter ─────────────────────────────────────────────────
// Vertices and edges fade in. All edges idle (grey), all vertices idle.
function InitialGraphBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const at = (f) => f * T;

  // Vertices appear in alphabetical order, edges follow with a small lag.
  const nodeAppearAt = {};
  NODE_IDS.forEach((id, i) => { nodeAppearAt[id] = 0.12 + i * 0.05; });
  const nodeVis = (id) => clamp((localTime - at(nodeAppearAt[id])) / 0.55, 0, 1);
  const edgeVis = (u, v) => {
    const t = Math.min(nodeAppearAt[u], nodeAppearAt[v]) + 0.05;
    return clamp((localTime - at(t)) / 0.55, 0, 1);
  };

  // Hint caption ("ingen sirkler, all sammenheng") fades in once the graph
  // has settled.
  const hintT = clamp((localTime - at(0.55)) / 0.6, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {EDGES_INSERT.map(([u, v, w], k) => {
        const draw = edgeVis(u, v);
        if (draw <= 0) return null;
        return (
          <GraphEdge key={`e${k}`} G={G}
            p1={G.nodes[u]} p2={G.nodes[v]} weight={w}
            draw={draw} state="idle"/>
        );
      })}
      {NODE_IDS.map((id) => {
        const v = nodeVis(id);
        if (v <= 0) return null;
        const p = G.nodes[id];
        return (
          <g key={`n${id}`} opacity={v}>
            <GraphNode G={G} id={id} x={p.x} y={p.y} state="idle"/>
          </g>
        );
      })}
      {/* Hint */}
      <g opacity={hintT}>
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-sans)" fontStyle="italic"
              fontSize={G.actionFont} fill="var(--chalk-300)">
          ingen sirkler, all sammenheng
        </text>
      </g>
    </svg>
  );
}

// ─── Beat 3: Sortér kantene (GENUINE MOTION — rows swap into sorted order) ─
// All six edge rows fade in next to the graph in INSERTION order. After a
// short hold each row animates from its insertion-index row position to
// its sorted-by-weight row position. The biggest move is CD (insertion
// row 3 → sorted row 1) bubbling past BC and AC. Once the rows settle, a
// "sortert etter vekt" eyebrow lands above the list.
function SortEdgesBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.3, 1);
  const at = (f) => f * T;

  // Row fade-in: each row at its insertion-index position appears in
  // sequence over the first ~0.20 of the beat.
  const rowFadeAt = (insertIdx) => 0.03 + insertIdx * 0.025;
  const rowFade = (insertIdx) =>
    clamp((localTime - at(rowFadeAt(insertIdx))) / 0.4, 0, 1);

  // Sort phase: rows hold unsorted briefly, then animate to sorted
  // positions over the middle of the beat. Each row's row-index lerps
  // from insertIdx → sortedIdx with an easeInOutCubic curve.
  const SORT_START = 0.30;
  const SORT_END   = 0.80;
  const sortRaw = clamp(
    (localTime - at(SORT_START)) / Math.max(0.001, at(SORT_END) - at(SORT_START)),
    0, 1);
  const sortT = easeInOutCubic(sortRaw);

  // Eyebrow ("sortert etter vekt") fades in once the rows have begun
  // settling. Lands while there is still time to read it.
  const eyebrowT = clamp((localTime - at(0.55)) / 0.4, 0, 1);

  // List title above the rows.
  const titleY = G.listY - 18;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Graph stays visible (idle) so the viewer can tie list rows to
          graph edges later. */}
      {EDGES_INSERT.map(([u, v, w], k) => (
        <GraphEdge key={`e${k}`} G={G}
          p1={G.nodes[u]} p2={G.nodes[v]} weight={w}
          draw={1} state="idle"/>
      ))}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        return (
          <GraphNode key={`n${id}`} G={G} id={id} x={p.x} y={p.y} state="idle"/>
        );
      })}

      {/* List title — eyebrow above the rows. */}
      <g opacity={eyebrowT}>
        <text x={G.listX + 4} y={titleY}
              textAnchor="start"
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--amber-300)" letterSpacing="0.18em">
          sortert etter vekt
        </text>
      </g>

      {/* Rows: render in EDGES_INSERT order so React keys stay stable.
          Each row's y interpolates from its insertion index to its
          sorted index. */}
      {EDGES_INSERT.map(([u, v, w], insertIdx) => {
        const fade = rowFade(insertIdx);
        if (fade <= 0) return null;
        const sortedIdx = INSERT_TO_SORTED[insertIdx];
        const lerped = insertIdx + sortT * (sortedIdx - insertIdx);
        const y = G.listY + lerped * (G.rowH + G.rowGap);
        return (
          <EdgeRow key={`row-${u}-${v}`} G={G}
            x={G.listX} y={y} w={G.listW} h={G.rowH}
            edge={{ u, v, w }} status="pending" fadeIn={fade}/>
        );
      })}
    </svg>
  );
}

// ─── Beat 4: Sveip og dømm (GENUINE MOTION — Kruskal's main loop) ─────────
// A pointer triangle walks down the sorted list. For each row we run a
// three-phase mini-beat:
//   ENTER  (0.00 .. 0.18)  pointer arrives on row, graph edge lights teal
//   JUDGE  (0.18 .. 0.55)  verdict lands — row + edge turn amber (accept)
//                          or rose-dashed (reject); cross/check glyph
//                          draws on the row
//   HOLD   (0.55 .. 1.00)  state persists so the viewer reads it
//
// At the boundary the previous step's row + edge stays at its terminal
// state; on accept that's amber/in-MST forever, on reject the edge fades
// back to dim chalk for the rest of the beat.
function SweepAcceptBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);

  // Weight each step. Accepts get more time (verdict + MST update reads
  // longer); the two skips share a tighter rhythm so the failure beat
  // doesn't drag.
  const STEP_WEIGHTS = [1.0, 1.0, 1.3, 1.0, 0.9, 1.2];

  // Reserve a small intro (rows already sorted from beat 3) and outro
  // pad. The 6 steps share the middle.
  const INTRO = 0.06;
  const OUTRO = 0.04;
  const totalW = STEP_WEIGHTS.reduce((a, b) => a + b, 0);
  const stepStarts = [];
  let acc = INTRO;
  for (const sw of STEP_WEIGHTS) {
    stepStarts.push(acc);
    acc += (1 - INTRO - OUTRO) * sw / totalW;
  }
  stepStarts.push(acc); // sentinel

  // Locate current step.
  let stepIdx = -1;
  for (let k = 0; k < EDGES_SORTED.length; k++) {
    if (localTime >= stepStarts[k] * T) stepIdx = k;
  }
  // stepIdx === -1 means we're in the intro phase.

  let stepProg = 0;
  if (stepIdx >= 0) {
    const lo = stepStarts[stepIdx] * T;
    const hi = stepStarts[stepIdx + 1] * T;
    stepProg = clamp((localTime - lo) / Math.max(0.001, hi - lo), 0, 1);
  }

  // Phase boundaries inside a step.
  const PHASE_ENTER_END = 0.18;
  const PHASE_JUDGE_END = 0.55;

  // For each sorted-index, determine its row status this frame.
  const rowStatusAt = (i) => {
    if (stepIdx < 0 || i > stepIdx) return 'pending';
    if (i < stepIdx) return EDGES_SORTED[i].accept ? 'accept' : 'reject';
    // Current step
    if (stepProg < PHASE_ENTER_END) return 'current';
    if (stepProg < PHASE_JUDGE_END) {
      // Halfway through the judge phase, the verdict glyph appears.
      // Before the verdict glyph we stay 'current' so the row reads as
      // "being weighed".
      const jp = (stepProg - PHASE_ENTER_END) / (PHASE_JUDGE_END - PHASE_ENTER_END);
      return jp >= 0.45 ? (EDGES_SORTED[i].accept ? 'accept' : 'reject') : 'current';
    }
    return EDGES_SORTED[i].accept ? 'accept' : 'reject';
  };

  // For each EDGES_SORTED index, what state is the graph edge in?
  //   - MST edges accepted in earlier steps → 'tree'
  //   - Current step's edge while in ENTER → 'candidate'
  //   - Current step's edge while in JUDGE/HOLD:
  //       accept → 'tree'
  //       reject → 'reject' (rose dashed) for ~0.4 of step then fade out
  //   - Everything else → 'idle'
  const edgeStateForStep = (sortedIdx) => {
    if (stepIdx < 0) return { state: 'idle', opacity: 1 };
    const e = EDGES_SORTED[sortedIdx];
    if (sortedIdx < stepIdx) {
      // Past step.
      return e.accept
        ? { state: 'tree', opacity: 1 }
        : { state: 'idle', opacity: 1 };
    }
    if (sortedIdx === stepIdx) {
      if (stepProg < PHASE_ENTER_END) {
        return { state: 'candidate', opacity: 1 };
      }
      if (e.accept) {
        return { state: 'tree', opacity: 1 };
      }
      // Reject: rose dashed during JUDGE, fade out by HOLD's end.
      if (stepProg < PHASE_JUDGE_END) {
        return { state: 'reject', opacity: 1 };
      }
      // HOLD: rose dashed fades back into idle grey.
      const fade = clamp((stepProg - PHASE_JUDGE_END) / (1 - PHASE_JUDGE_END), 0, 1);
      return { state: fade < 0.7 ? 'reject' : 'idle', opacity: 1 };
    }
    return { state: 'idle', opacity: 1 };
  };

  // Vertex "settled" set this frame. The set freezes during the current
  // step until the verdict lands, then jumps.
  let settledIdx = Math.max(stepIdx, 0);
  if (stepIdx >= 0) {
    // During ENTER + first part of JUDGE, "settled" is still based on
    // step (idx - 1). Once verdict lands, jump to settled set for step idx.
    if (stepProg < (PHASE_ENTER_END + PHASE_JUDGE_END) * 0.5) {
      settledIdx = stepIdx - 1;
    }
  }
  const settledSet = settledIdx >= 0
    ? SETTLED_AFTER[settledIdx]
    : new Set();

  // Endpoints of the current candidate edge get a 'candidate' ring during
  // the ENTER phase so the viewer sees which edge in the graph is being
  // weighed.
  const isCandidateNode = (id) => {
    if (stepIdx < 0) return false;
    if (stepProg >= PHASE_ENTER_END) return false;
    const e = EDGES_SORTED[stepIdx];
    return id === e.u || id === e.v;
  };

  // Pointer triangle Y: slides to the current row's centre.
  // During intro (stepIdx = -1) it points at row 0.
  const pointerRowIdx = Math.max(stepIdx, 0);
  // While transitioning between rows we lerp the pointer Y over the first
  // 0.15 of stepProg from prev row to current row.
  let pointerY = G.listY + pointerRowIdx * (G.rowH + G.rowGap) + G.rowH / 2;
  if (stepIdx > 0 && stepProg < 0.15) {
    const prevY = G.listY + (stepIdx - 1) * (G.rowH + G.rowGap) + G.rowH / 2;
    const t = easeInOutCubic(stepProg / 0.15);
    pointerY = prevY + t * (pointerY - prevY);
  }

  // Action caption text.
  let actionText = '';
  let actionAccent = 'var(--chalk-300)';
  if (stepIdx >= 0) {
    const e = EDGES_SORTED[stepIdx];
    if (stepProg < PHASE_ENTER_END) {
      actionText = `${e.u} → ${e.v}: vekt ${e.w}?`;
      actionAccent = 'var(--teal-400)';
    } else {
      if (e.accept) {
        actionText = `${e.u} – ${e.v}: trygg, ta den.`;
        actionAccent = 'var(--amber-300)';
      } else {
        actionText = `${e.u} – ${e.v}: ville lukke en sirkel — hopp.`;
        actionAccent = 'var(--rose-300)';
      }
    }
  } else {
    actionText = 'trygg? — ta den. sirkel? — hopp.';
    actionAccent = 'var(--chalk-300)';
  }

  // List title.
  const titleY = G.listY - 18;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Graph: edges first (so nodes draw over edge ends). */}
      {EDGES_SORTED.map((e, sortedIdx) => {
        const { state, opacity } = edgeStateForStep(sortedIdx);
        const p1 = G.nodes[e.u], p2 = G.nodes[e.v];
        return (
          <GraphEdge key={`e${sortedIdx}`} G={G}
            p1={p1} p2={p2} weight={e.w}
            state={state} opacity={opacity} draw={1}/>
        );
      })}

      {/* Nodes. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        let state = 'idle';
        if (settledSet.has(id)) state = 'settled';
        if (isCandidateNode(id)) state = 'candidate';
        return (
          <GraphNode key={`n${id}`} G={G} id={id} x={p.x} y={p.y} state={state}/>
        );
      })}

      {/* List title. */}
      <text x={G.listX + 4} y={titleY}
            textAnchor="start"
            fontFamily="var(--font-mono)" fontSize={11}
            fill="var(--amber-300)" letterSpacing="0.18em">
        sortert etter vekt
      </text>

      {/* Sorted rows. */}
      {EDGES_SORTED.map((e, sortedIdx) => {
        const status = rowStatusAt(sortedIdx);
        return (
          <EdgeRow key={`row-${e.u}-${e.v}`} G={G}
            x={G.listX} y={rowY(G, sortedIdx)}
            w={G.listW} h={G.rowH}
            edge={{ u: e.u, v: e.v, w: e.w }}
            status={status}/>
        );
      })}

      {/* Pointer triangle to the left of the current row. */}
      <g>
        <path d={`M ${G.pointerX - 14} ${pointerY - 8}
                  L ${G.pointerX} ${pointerY}
                  L ${G.pointerX - 14} ${pointerY + 8} Z`}
              fill="var(--teal-400)"
              opacity={stepIdx >= 0 ? 0.95 : 0.55}/>
      </g>

      {/* Action caption beneath the canvas. */}
      <text x={G.svgW / 2} y={G.actionY}
            textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={G.actionFont}
            fill={actionAccent} letterSpacing="0.10em">
        {actionText}
      </text>
    </svg>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
// Final MST glows amber over a dimmed background graph; the total weight
// (12) and the complexity O(m log m) land as the payoff.
function TakeawayBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.3, 1);
  const at = (f) => f * T;

  // MST edges retrace in the order they were accepted (AB, CD, BC, DE).
  // Each takes ~0.4s to draw and overlaps with the next.
  const ACCEPT_ORDER = [
    { u: 'A', v: 'B' },
    { u: 'C', v: 'D' },
    { u: 'B', v: 'C' },
    { u: 'D', v: 'E' },
  ];
  const drawAt = (k) => 0.04 + k * 0.07;
  const drawT = (k) => clamp((localTime - at(drawAt(k))) / 0.5, 0, 1);

  // Payoff lands quickly after the MST is lit so it's readable for the
  // bulk of the beat.
  const captionT = clamp((localTime - at(0.28)) / 0.4, 0, 1);
  const totalT   = clamp((localTime - at(0.42)) / 0.4, 0, 1);
  const formulaT = clamp((localTime - at(0.56)) / 0.4, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Non-MST edges in dim grey so the MST stands out. */}
      {EDGES_SORTED.map((e, k) => {
        if (isMstEdge(e.u, e.v)) return null;
        return (
          <GraphEdge key={`e${k}`} G={G}
            p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={e.w}
            state="idle" opacity={0.35} draw={1}/>
        );
      })}

      {/* MST edges trace in, one after the other, amber. */}
      {ACCEPT_ORDER.map((e, k) => {
        const t = drawT(k);
        if (t <= 0) return null;
        const w = EDGES_SORTED[sortedIndexOf(e.u, e.v)].w;
        return (
          <GraphEdge key={`me${k}`} G={G}
            p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={w}
            state="tree" draw={t}/>
        );
      })}

      {/* All vertices settled at the end. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        return (
          <GraphNode key={`n${id}`} G={G} id={id} x={p.x} y={p.y} state="settled"/>
        );
      })}

      {/* Payoff caption. */}
      <g opacity={captionT}>
        <text x={G.svgW / 2} y={portrait ? 1020 : 640}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 24 : 28}
              fill="var(--chalk-100)">
          Sortér — vær grådig — hopp over sirkler.
        </text>
      </g>

      {/* Total weight badge. */}
      <g opacity={totalT}>
        <text x={G.svgW / 2} y={portrait ? 1085 : 685}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={portrait ? 20 : 22}
              fill="var(--amber-300)" letterSpacing="0.10em">
          {`totalvekt = ${MST_TOTAL_WEIGHT}`}
        </text>
      </g>

      {/* Complexity formula. */}
      <g opacity={formulaT}>
        <text x={G.svgW / 2} y={portrait ? 1160 : G.svgH - 18}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={portrait ? 18 : 20}
              fill="var(--amber-300)">
          Kruskal ∈ O(m log m)
        </text>
      </g>
    </svg>
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
