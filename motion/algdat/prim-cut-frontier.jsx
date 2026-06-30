// Prims algoritme: vokse treet utover — Manimo lesson scene.
// Chapter 9 of algdat (Minimale spenntrær), depth companion to
// kruskal-trygg-kant. Same five-vertex / six-edge graph as Kruskal so the
// student sees the SAME minimal spanning tree built a different way: Prim
// starts at one vertex (A) and grows the tree set outward, each round
// picking the lightest edge in the cut between tree-set and non-tree-set.
// Four picks in order AB:1 → BC:3 → CD:2 → DE:6, total MST weight = 12.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10   Manimo hook
//   10–18   Graf + startvertex — A pulses amber, tree-set pill shows {A}
//   18–28   Første snitt (GENUINE MOTION — cut edges from {A} light teal,
//           snitt-panel lists AB:1 and AC:4 sorted, lightest pulses amber,
//           AB edge turns amber, B joins the tree-set)
//   28–50   Voks utover (GENUINE MOTION — three full Prim iterations:
//           cut recomputes each round, snitt-panel refills, lightest cut
//           edge wins, MST grows; BC:3 → CD:2 → DE:6)
//   50–60   Takeaway — full MST, totalvekt = 12, O((n+m) log n)
//
// Colour discipline (matches Kruskal):
//   chalk-100  vertex letters, payoff text
//   chalk-200  weight labels, panel text
//   chalk-300  idle edges, dim text, internal-now edges
//   amber-400  primary stroke for MST edges + tree vertex ring
//   amber-300  weight badges on MST edges, eyebrows, payoff highlights
//   teal-400   current cut edges (candidate set this round)
//   rose-400   not used in this scene (no rejections — Prim's cut never
//              fails; the contrast with Kruskal is exactly that there is
//              no "skip" beat)
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 59;

const NARRATION = [
  /*  0–10  */ 'Kruskal sorterte alle kantene først. Hva om vi heller lar treet vokse utover fra én by? Det er Prims algoritme — én by inn av gangen.',
  /* 10–18  */ 'Samme graf som Kruskal: fem byer, seks veier. Vi velger en by å starte i — A. Trémengden er bare A.',
  /* 18–28  */ 'Snittkantene er de som har én ende inne i treet og én ende utenfor. Akkurat nå: A til B med vekt én, og A til C med vekt fire. Den letteste er A til B — vi tar den, og B kommer inn.',
  /* 28–50  */ 'Nytt snitt etter B. Letteste kant over: B til C med tre — C kommer inn. Nytt snitt: nå er C til D med vekt to lettest — D kommer inn. Til slutt har vi bare én by igjen, og kanten D til E med seks tar den hjem.',
  /* 50–60  */ 'Samme minimale spenntre som Kruskal fant — totalvekt tolv. Men her vokste det utover fra én by, ikke ut fra en sortert liste.',
];

const NARRATION_AUDIO = 'audio/prim-cut-frontier/scene.mp3';

// ─── Graph data ────────────────────────────────────────────────────────────
// Same five vertices + six edges as Kruskal. The MST exists on the
// K4-minus-one-edge induced on {A,B,C,D} plus the pendant D–E.
const NODE_IDS = ['A', 'B', 'C', 'D', 'E'];

// All six edges as undirected weighted pairs. Order does not matter.
const ALL_EDGES = [
  { u: 'A', v: 'B', w: 1 },
  { u: 'A', v: 'C', w: 4 },
  { u: 'B', v: 'C', w: 3 },
  { u: 'B', v: 'D', w: 5 },
  { u: 'C', v: 'D', w: 2 },
  { u: 'D', v: 'E', w: 6 },
];

// Prim's pick sequence from A. Each entry: {pick, tree-after}. The four
// picks build the MST: AB → BC → CD → DE.
const PRIM_STEPS = [
  { pick: { u: 'A', v: 'B', w: 1 }, treeAfter: ['A', 'B'] },
  { pick: { u: 'B', v: 'C', w: 3 }, treeAfter: ['A', 'B', 'C'] },
  { pick: { u: 'C', v: 'D', w: 2 }, treeAfter: ['A', 'B', 'C', 'D'] },
  { pick: { u: 'D', v: 'E', w: 6 }, treeAfter: ['A', 'B', 'C', 'D', 'E'] },
];

// Helper: is edge (u,v) in tree set S (both endpoints in S → internal)?
function edgeInternalToTree(edge, treeSet) {
  return treeSet.has(edge.u) && treeSet.has(edge.v);
}
// Is edge a cut edge for tree S (exactly one endpoint in S)?
function edgeOnCut(edge, treeSet) {
  const a = treeSet.has(edge.u), b = treeSet.has(edge.v);
  return (a && !b) || (!a && b);
}
// Cut edges sorted ascending by weight.
function cutEdges(treeSet) {
  return ALL_EDGES
    .filter(e => edgeOnCut(e, treeSet))
    .slice()
    .sort((a, b) => a.w - b.w);
}
// Equality on undirected edges.
function sameEdge(a, b) {
  return (a.u === b.u && a.v === b.v) || (a.u === b.v && a.v === b.u);
}
// MST edge predicate (one of the picks).
function isMstEdge(edge) {
  return PRIM_STEPS.some(s => sameEdge(s.pick, edge));
}

const MST_TOTAL_WEIGHT = PRIM_STEPS.reduce((s, st) => s + st.pick.w, 0); // 12

// ─── Layout ────────────────────────────────────────────────────────────────
// Landscape: graph on the left half, snitt-panel + tree-pill on the right.
// Portrait: graph on the top half, snitt-panel + tree-pill stacked below.
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
      treeY: 840, treeFont: 17,
      panelX: 100, panelY: 900,
      panelW: 520, panelHeader: 32,
      rowH: 50, rowGap: 6,
      rowFont: 18, rowWeightFont: 18,
      actionY: 1210, actionFont: 17,
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
    treeY: 150, treeFont: 16,
    panelX: 720, panelY: 200,
    panelW: 480, panelHeader: 28,
    rowH: 54, rowGap: 6,
    rowFont: 18, rowWeightFont: 18,
    actionY: 660, actionFont: 15,
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
// state: 'idle' | 'tree' (in MST set, amber) | 'fresh' (just joined this
// step — brief pulse) | 'start' (start vertex on its first reveal)
function GraphNode({ G, id, x, y, state, pulse = 0 }) {
  const border =
    state === 'tree' || state === 'fresh' || state === 'start'
      ? 'var(--amber-400)'
      : 'rgba(232,220,193,0.30)';
  const { bgFill, bgOpacity } =
    state === 'tree' || state === 'fresh' || state === 'start'
      ? { bgFill: 'var(--amber-400)', bgOpacity: 0.14 + pulse * 0.18 }
      : { bgFill: 'rgba(0,0,0,0.55)', bgOpacity: 1 };
  const letterColor =
    state === 'idle' ? 'var(--chalk-300)' : 'var(--chalk-100)';
  const ringR = G.nodeR + pulse * 8;
  return (
    <g>
      {pulse > 0 && (
        <circle cx={x} cy={y} r={ringR}
                fill="none" stroke="var(--amber-300)"
                strokeWidth={1.6} opacity={(1 - pulse) * 0.7}/>
      )}
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

// Edge state: 'idle' | 'tree' (in MST, amber) | 'cut' (teal — current
// cut edge candidate) | 'winner' (amber + brighter — the cut edge being
// taken right now) | 'internal' (both endpoints in tree but not in MST —
// drawn dim grey so it's clear it's no longer a candidate)
function GraphEdge({ G, p1, p2, weight, state = 'idle', draw = 1, opacity = 1 }) {
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const d = clamp(draw, 0, 1);
  const stroke =
    state === 'tree' || state === 'winner' ? 'var(--amber-400)' :
    state === 'cut' ? 'var(--teal-400)' :
    state === 'internal' ? 'rgba(232,220,193,0.18)' :
    'rgba(232,220,193,0.32)';
  const width =
    state === 'winner' ? 3.4 :
    state === 'tree' ? 2.8 :
    state === 'cut' ? 2.6 :
    G.edgeStroke;
  return (
    <g opacity={opacity}>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={stroke} strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={len}
            strokeDashoffset={(1 - d) * len}/>
      {weight !== undefined && (
        <WeightBadge G={G} p1={p1} p2={p2} value={weight} state={state}/>
      )}
    </g>
  );
}

function WeightBadge({ G, p1, p2, value, state }) {
  const p = weightPlacement(p1, p2);
  const color =
    state === 'tree' || state === 'winner' ? 'var(--amber-300)' :
    state === 'cut' ? 'var(--teal-400)' :
    state === 'internal' ? 'var(--chalk-300)' :
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

// ─── Tree-set pill ─────────────────────────────────────────────────────────
// Compact "Trémengde: {A, B, C}" badge at the top of the side panel.
function TreeSetPill({ G, members, fadeIn = 1 }) {
  const label = `Trémengde: { ${members.join(', ')} }`;
  return (
    <g opacity={fadeIn}>
      <rect x={G.panelX} y={G.treeY - 24}
            width={G.panelW} height={36} rx={8}
            fill="rgba(244,184,96,0.06)"
            stroke="rgba(244,184,96,0.30)" strokeWidth={1.2}/>
      <text x={G.panelX + 14} y={G.treeY}
            textAnchor="start"
            fontFamily="var(--font-mono)" fontSize={G.treeFont}
            fill="var(--amber-300)" letterSpacing="0.06em">
        {label}
      </text>
    </g>
  );
}

// ─── Snitt-panel row ───────────────────────────────────────────────────────
// One cut edge in the side panel. Status:
//   'pending'  — cut edge waiting (teal accent)
//   'winner'   — the lightest one this round (amber accent + amber check)
function CutRow({ G, x, y, w, h, edge, status, fadeIn = 1 }) {
  const padL = 18;
  const padR = 18;
  const pairX = x + padL;
  const verdictX = x + w - padR - 14;
  const weightX = x + w - padR - 60;

  const border =
    status === 'winner' ? 'var(--amber-400)' :
    'var(--teal-400)';
  const { bgFill, bgOpacity } =
    status === 'winner' ? { bgFill: 'var(--amber-400)', bgOpacity: 0.12 } :
    { bgFill: 'var(--teal-400)', bgOpacity: 0.10 };
  const labelColor = 'var(--chalk-100)';
  const weightColor =
    status === 'winner' ? 'var(--amber-300)' : 'var(--teal-400)';

  return (
    <g opacity={fadeIn}>
      <rect x={x} y={y} width={w} height={h} rx={10}
            fill={bgFill} fillOpacity={bgOpacity}
            stroke={border} strokeWidth={1.6}/>
      <text x={pairX} y={y + h * 0.62}
            textAnchor="start" fontFamily="var(--font-mono)"
            fontSize={G.rowFont} fill={labelColor}
            letterSpacing="0.08em">
        {`${edge.u}  —  ${edge.v}`}
      </text>
      <text x={weightX} y={y + h * 0.62}
            textAnchor="end" fontFamily="var(--font-mono)"
            fontSize={G.rowWeightFont} fill={weightColor}>
        {edge.w}
      </text>
      {status === 'winner' && (
        <g>
          <circle cx={verdictX} cy={y + h * 0.5} r={11}
                  fill="none" stroke="var(--amber-300)" strokeWidth={1.6}/>
          <path d={`M ${verdictX - 5} ${y + h * 0.5} l 3.6 4 l 6.4 -7`}
                stroke="var(--amber-300)" strokeWidth={2} fill="none"
                strokeLinecap="round" strokeLinejoin="round"/>
        </g>
      )}
    </g>
  );
}

// ─── Snitt-panel header ────────────────────────────────────────────────────
function PanelHeader({ G, fadeIn = 1 }) {
  return (
    <g opacity={fadeIn}>
      <text x={G.panelX + 4} y={G.panelY - 12}
            textAnchor="start"
            fontFamily="var(--font-mono)" fontSize={11}
            fill="var(--amber-300)" letterSpacing="0.18em">
        snittkanter — sortert
      </text>
    </g>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="minimale spenntrær"
      title="Prims algoritme: vokse treet utover"
      duration={SCENE_DURATION}
      introEnd={10.15}
      introCaption="Vokse treet utover — alltid letteste kant over snittet."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.15} end={18.94}>
        <StartVertexBeat/>
      </Sprite>

      <Sprite start={18.94} end={33.26}>
        <FirstCutBeat/>
      </Sprite>

      <Sprite start={33.26} end={48.15}>
        <GrowLoopBeat/>
      </Sprite>

      <Sprite start={48.15} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Graf + startvertex ────────────────────────────────────────────
// Vertices and edges fade in idle (grey). Then A pulses amber once and
// becomes the start vertex. Tree-set pill lands with "{ A }".
function StartVertexBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const at = (f) => f * T;

  const nodeAppearAt = {};
  NODE_IDS.forEach((id, i) => { nodeAppearAt[id] = 0.10 + i * 0.05; });
  const nodeVis = (id) => clamp((localTime - at(nodeAppearAt[id])) / 0.55, 0, 1);
  const edgeVis = (u, v) => {
    const t = Math.min(nodeAppearAt[u], nodeAppearAt[v]) + 0.05;
    return clamp((localTime - at(t)) / 0.55, 0, 1);
  };

  // A pulses amber and becomes the start vertex.
  const START_AT = 0.50;
  const startProg = clamp((localTime - at(START_AT)) / 0.55, 0, 1);
  const aPulse = startProg < 1
    ? Math.sin(Math.PI * Math.min(1, startProg * 1.6))
    : 0;
  const aState = startProg > 0.05 ? 'start' : 'idle';

  // Tree-set pill lands once A has settled.
  const pillT = clamp((localTime - at(0.70)) / 0.5, 0, 1);

  // Hint caption.
  const hintT = clamp((localTime - at(0.62)) / 0.55, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {ALL_EDGES.map((e, k) => {
        const draw = edgeVis(e.u, e.v);
        if (draw <= 0) return null;
        return (
          <GraphEdge key={`e${k}`} G={G}
            p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={e.w}
            draw={draw} state="idle"/>
        );
      })}
      {NODE_IDS.map((id) => {
        const v = nodeVis(id);
        if (v <= 0) return null;
        const p = G.nodes[id];
        const state = id === 'A' ? aState : 'idle';
        const pulse = id === 'A' ? aPulse : 0;
        return (
          <g key={`n${id}`} opacity={v}>
            <GraphNode G={G} id={id} x={p.x} y={p.y}
              state={state} pulse={pulse}/>
          </g>
        );
      })}
      <TreeSetPill G={G} members={['A']} fadeIn={pillT}/>
      <g opacity={hintT}>
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-sans)" fontStyle="italic"
              fontSize={G.actionFont} fill="var(--chalk-300)">
          trémengden vokser — én by av gangen
        </text>
      </g>
    </svg>
  );
}

// ─── Beat 3: Første snitt (GENUINE MOTION — first Prim step from {A}) ─────
// Cut edges from {A} are AB:1 and AC:4. Panel slides in, rows fade in
// sorted, lightest pulses amber, AB on the graph turns amber, B joins
// the tree. Tree-set pill updates from {A} to {A, B}.
function FirstCutBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const at = (f) => f * T;

  const startTree = new Set(['A']);
  const cut = cutEdges(startTree);  // [AB:1, AC:4]
  const winner = cut[0];            // AB:1

  // Milestones.
  const PANEL_AT       = 0.05;  // panel header lands, cut edges light teal
  const ROWS_AT        = 0.16;  // sorted rows fade into panel
  const WINNER_AT      = 0.50;  // winner row pulses amber, winning edge turns amber
  const VERTEX_JOIN_AT = 0.68;  // B joins tree-set, pill updates
  const CAPTION_AT     = 0.82;  // status caption near bottom

  const panelT  = clamp((localTime - at(PANEL_AT)) / 0.4, 0, 1);
  const rowsT   = clamp((localTime - at(ROWS_AT)) / 0.45, 0, 1);
  const winnerT = clamp((localTime - at(WINNER_AT)) / 0.5, 0, 1);
  const joinT   = clamp((localTime - at(VERTEX_JOIN_AT)) / 0.5, 0, 1);
  const captionT = clamp((localTime - at(CAPTION_AT)) / 0.4, 0, 1);

  // After winner is picked, B's vertex pulses briefly.
  const bPulse = joinT < 1 ? Math.sin(Math.PI * Math.min(1, joinT * 1.6)) * 0.8 : 0;

  // Edge state for the graph.
  const edgeState = (e) => {
    const onCut = edgeOnCut(e, startTree);
    if (sameEdge(e, winner)) {
      // Winner edge: cut (teal) until WINNER_AT, then amber.
      return winnerT > 0.15 ? 'tree' : 'cut';
    }
    return onCut ? 'cut' : 'idle';
  };

  // Tree pill members.
  const pillMembers = joinT > 0.5 ? ['A', 'B'] : ['A'];

  // Caption.
  let actionText = '';
  let actionAccent = 'var(--chalk-300)';
  if (winnerT <= 0.15) {
    actionText = 'snittet: AB med 1 og AC med 4';
    actionAccent = 'var(--teal-400)';
  } else if (joinT > 0.5) {
    actionText = 'AB med vekt 1 — B kommer inn';
    actionAccent = 'var(--amber-300)';
  } else {
    actionText = 'letteste over snittet: AB med 1';
    actionAccent = 'var(--amber-300)';
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Graph edges (cut edges teal, winner becomes amber). */}
      {ALL_EDGES.map((e, k) => (
        <GraphEdge key={`e${k}`} G={G}
          p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={e.w}
          state={edgeState(e)} draw={1}/>
      ))}

      {/* Nodes — A is in tree, B becomes fresh after join, rest idle. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        let state = 'idle';
        let pulse = 0;
        if (id === 'A') state = 'tree';
        if (id === 'B' && joinT > 0.5) {
          state = 'fresh';
          pulse = bPulse;
        }
        return (
          <GraphNode key={`n${id}`} G={G} id={id} x={p.x} y={p.y}
            state={state} pulse={pulse}/>
        );
      })}

      {/* Tree-set pill. */}
      <TreeSetPill G={G} members={pillMembers} fadeIn={1}/>

      {/* Snitt-panel header. */}
      <PanelHeader G={G} fadeIn={panelT}/>

      {/* Cut rows in the side panel — sorted by weight. */}
      {cut.map((e, i) => {
        const y = G.panelY + i * (G.rowH + G.rowGap);
        const status = (i === 0 && winnerT > 0.15) ? 'winner' : 'pending';
        return (
          <CutRow key={`cr-${e.u}-${e.v}`} G={G}
            x={G.panelX} y={y} w={G.panelW} h={G.rowH}
            edge={e} status={status} fadeIn={rowsT}/>
        );
      })}

      {/* Action caption. */}
      <g opacity={captionT}>
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.actionFont}
              fill={actionAccent} letterSpacing="0.10em">
          {actionText}
        </text>
      </g>
    </svg>
  );
}

// ─── Beat 4: Voks utover (GENUINE MOTION — three Prim rounds) ─────────────
// Three full step-cycles. Each cycle:
//   ENTER  (0.00 .. 0.20)  cut recomputes — incident edges light teal,
//                          newly-internal edges fade to grey
//   PICK   (0.20 .. 0.55)  lightest cut row + edge turn amber
//   JOIN   (0.55 .. 0.85)  new vertex joins tree (pulse), tree pill updates
//   HOLD   (0.85 .. 1.00)  state persists, viewer reads
//
// The first round (BC:3) starts from tree {A,B} and adds C.
// The second round (CD:2) starts from {A,B,C} and adds D.
// The third round (DE:6) starts from {A,B,C,D} and adds E.
function GrowLoopBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);

  // Step weights — give the second-round CD:2 a bit more time since it's
  // the "aha" moment (cut shrinks dramatically), and DE:6 gets the final
  // breath.
  const STEP_WEIGHTS = [1.05, 1.10, 1.05];
  const STEPS_IN_BEAT = [
    // Round = index after Beat-3's first pick (AB), so steps[0] is BC.
    PRIM_STEPS[1], // BC:3, tree {A,B,C}
    PRIM_STEPS[2], // CD:2, tree {A,B,C,D}
    PRIM_STEPS[3], // DE:6, tree {A,B,C,D,E}
  ];
  const TREE_BEFORE = [
    new Set(['A', 'B']),
    new Set(['A', 'B', 'C']),
    new Set(['A', 'B', 'C', 'D']),
  ];

  const INTRO = 0.04;
  const OUTRO = 0.04;
  const totalW = STEP_WEIGHTS.reduce((a, b) => a + b, 0);
  const stepStarts = [];
  let acc = INTRO;
  for (const sw of STEP_WEIGHTS) {
    stepStarts.push(acc);
    acc += (1 - INTRO - OUTRO) * sw / totalW;
  }
  stepStarts.push(acc); // sentinel

  let stepIdx = -1;
  for (let k = 0; k < STEPS_IN_BEAT.length; k++) {
    if (localTime >= stepStarts[k] * T) stepIdx = k;
  }

  // Stuck in intro? Show the tree-set pill = {A,B}, no cut yet.
  // (Doesn't really happen because INTRO is small, but graceful default.)
  let stepProg = 0;
  if (stepIdx >= 0) {
    const lo = stepStarts[stepIdx] * T;
    const hi = stepStarts[stepIdx + 1] * T;
    stepProg = clamp((localTime - lo) / Math.max(0.001, hi - lo), 0, 1);
  }

  // Phase boundaries within a step.
  const PHASE_ENTER = 0.20;
  const PHASE_PICK  = 0.55;
  const PHASE_JOIN  = 0.85;

  // Resolve current frame state.
  const safeIdx = Math.max(stepIdx, 0);
  const treeBefore = TREE_BEFORE[safeIdx];
  const pick = STEPS_IN_BEAT[safeIdx].pick;
  const treeAfter = new Set(STEPS_IN_BEAT[safeIdx].treeAfter);
  const cut = cutEdges(treeBefore);

  // Past picks (rounds already completed before this step) glow amber on
  // the graph and stay there.
  const pastPicks = [];
  // The very-first Prim pick (AB) already happened in Beat 3 — it stays
  // amber for the rest of the scene.
  pastPicks.push(PRIM_STEPS[0].pick);
  for (let k = 0; k < Math.max(stepIdx, 0); k++) {
    pastPicks.push(STEPS_IN_BEAT[k].pick);
  }
  // While in PICK/JOIN/HOLD of the current step, the current pick is also
  // an MST edge (amber). During ENTER it's still a teal cut candidate.
  const currentPickIsAmber = stepIdx >= 0 && stepProg > PHASE_ENTER + 0.05;

  // Helper: is an edge in the "amber MST so far" set?
  const isAmberPick = (e) => {
    if (pastPicks.some(p => sameEdge(p, e))) return true;
    if (currentPickIsAmber && sameEdge(pick, e)) return true;
    return false;
  };

  // Edge state for a frame.
  const edgeStateFor = (e) => {
    if (isAmberPick(e)) {
      // If both endpoints are in the current tree-after, this is an MST
      // edge — amber. Otherwise still amber.
      return 'tree';
    }
    // Internal-to-tree but not in MST → grey/internal.
    if (edgeInternalToTree(e, treeBefore)) return 'internal';
    // Cut edge for the current round (and not yet picked) → teal.
    if (edgeOnCut(e, treeBefore)) return 'cut';
    return 'idle';
  };

  // New vertex joining: stepwise pulse.
  const newVertex = STEPS_IN_BEAT[safeIdx].pick;
  const joinedId = treeBefore.has(newVertex.u) ? newVertex.v : newVertex.u;
  const joinProg = stepIdx >= 0
    ? clamp((stepProg - PHASE_PICK) / (PHASE_JOIN - PHASE_PICK), 0, 1)
    : 0;
  const joinedPulse = joinProg > 0 && joinProg < 1
    ? Math.sin(Math.PI * joinProg) * 0.9
    : 0;

  // Tree-set pill members — update at the moment the vertex joins.
  const pillMembers = stepIdx >= 0 && stepProg > PHASE_PICK + 0.05
    ? STEPS_IN_BEAT[safeIdx].treeAfter
    : Array.from(TREE_BEFORE[safeIdx]);

  // Action caption.
  let actionText = '';
  let actionAccent = 'var(--chalk-300)';
  if (stepIdx < 0) {
    actionText = 'nytt snitt — letteste vinner';
    actionAccent = 'var(--chalk-300)';
  } else if (stepProg <= PHASE_ENTER + 0.05) {
    const labels = cut.map(e => `${e.u}${e.v}:${e.w}`).join(' · ');
    actionText = `nytt snitt: ${labels}`;
    actionAccent = 'var(--teal-400)';
  } else if (stepProg <= PHASE_PICK + 0.05) {
    actionText = `letteste: ${pick.u}${pick.v} med ${pick.w}`;
    actionAccent = 'var(--amber-300)';
  } else {
    actionText = `${pick.u}${pick.v}: ${joinedId} kommer inn`;
    actionAccent = 'var(--amber-300)';
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Graph edges. */}
      {ALL_EDGES.map((e, k) => (
        <GraphEdge key={`e${k}`} G={G}
          p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={e.w}
          state={edgeStateFor(e)} draw={1}/>
      ))}

      {/* Nodes. Tree-before members are in MST, joined vertex pulses. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        let state = 'idle';
        let pulse = 0;
        if (treeBefore.has(id)) state = 'tree';
        if (stepIdx >= 0 && id === joinedId && joinProg > 0) {
          state = 'fresh';
          pulse = joinedPulse;
        }
        // After the join the new vertex is fully in tree.
        if (stepIdx >= 0 && joinProg >= 1 && id === joinedId) state = 'tree';
        return (
          <GraphNode key={`n${id}`} G={G} id={id} x={p.x} y={p.y}
            state={state} pulse={pulse}/>
        );
      })}

      {/* Tree-set pill. */}
      <TreeSetPill G={G} members={pillMembers} fadeIn={1}/>

      {/* Snitt-panel header. */}
      <PanelHeader G={G} fadeIn={1}/>

      {/* Cut rows — sorted by weight; lightest is the round's winner. */}
      {cut.map((e, i) => {
        const y = G.panelY + i * (G.rowH + G.rowGap);
        const status =
          (i === 0 && stepIdx >= 0 && stepProg > PHASE_ENTER + 0.05)
            ? 'winner'
            : 'pending';
        return (
          <CutRow key={`cr-${e.u}-${e.v}-s${stepIdx}`} G={G}
            x={G.panelX} y={y} w={G.panelW} h={G.rowH}
            edge={e} status={status} fadeIn={1}/>
        );
      })}

      {/* Action caption. */}
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
// Full MST glows amber over a dimmed background graph; total weight (12)
// and complexity O((n+m) log n) land as the payoff.
function TakeawayBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.3, 1);
  const at = (f) => f * T;

  const PICK_ORDER = PRIM_STEPS.map(s => s.pick);
  const drawAt = (k) => 0.04 + k * 0.07;
  const drawT = (k) => clamp((localTime - at(drawAt(k))) / 0.5, 0, 1);

  const captionT = clamp((localTime - at(0.28)) / 0.4, 0, 1);
  const totalT   = clamp((localTime - at(0.42)) / 0.4, 0, 1);
  const formulaT = clamp((localTime - at(0.56)) / 0.4, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Non-MST edges dim. */}
      {ALL_EDGES.map((e, k) => {
        if (isMstEdge(e)) return null;
        return (
          <GraphEdge key={`e${k}`} G={G}
            p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={e.w}
            state="idle" opacity={0.35} draw={1}/>
        );
      })}

      {/* MST edges retrace in Prim's pick order. */}
      {PICK_ORDER.map((e, k) => {
        const t = drawT(k);
        if (t <= 0) return null;
        return (
          <GraphEdge key={`me${k}`} G={G}
            p1={G.nodes[e.u]} p2={G.nodes[e.v]} weight={e.w}
            state="tree" draw={t}/>
        );
      })}

      {/* All vertices in tree. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        return (
          <GraphNode key={`n${id}`} G={G} id={id} x={p.x} y={p.y} state="tree"/>
        );
      })}

      {/* Payoff caption. */}
      <g opacity={captionT}>
        <text x={G.svgW / 2} y={portrait ? 1020 : 640}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 24 : 28}
              fill="var(--chalk-100)">
          Vokse utover — alltid letteste kant over snittet.
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
          Prim ∈ O((n + m) log n)
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
