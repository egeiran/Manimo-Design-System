// Bredde-først søk: bølgen sprer seg — Manimo lesson scene.
// Chapter 8 of algdat (Grafer og traversering). BFS answers "how many steps
// from S to every other node?" with one queue and one rule: FIFO. The wave
// expands layer by layer — each node gets its final distance the first time
// it lands in the queue. Nine nodes, a pulsing frontier, an animated queue
// strip where letters slide in on the right and drop from the front as the
// algorithm dequeues.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–11    Manimo hook
//   11–22    Graf + start: nodes/edges fade in, S marked, queue strip seeded
//   22–46    Bølgen sprer seg (GENUINE MOTION — layer-by-layer frontier
//             expansion + FIFO queue updates synced to ten dequeue steps)
//   46–58    Hvorfor FIFO — one shortest path S → B → E → G → H lit amber
//   58–66    Takeaway — én kø, lag for lag, O(n + m)
//
// Colour discipline:
//   chalk-100  node values (letters), payoff text
//   chalk-200  caption body, queue cell text
//   chalk-300  inactive edges, index labels
//   amber-400  source node S, settled distance ring, primary stroke
//   amber-300  distance labels, queue eyebrow, formula payoff
//   teal-400   frontier pulse — the wave just arriving at a new layer
//   rose-300   "front of queue" marker / dequeue highlight
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0–11  */ 'Du står på et knutepunkt i en graf. Hvor mange skritt er det til hvert eneste annet punkt? Bredde-først søk svarer lag for lag.',
  /* 11–22  */ 'Vi starter i S og setter den i en kø — en førstemann-inn, førstemann-ut. S har avstand null.',
  /* 22–46  */ 'Tar vi S ut og leser av naboene? A og B legges i køen med avstand én. Så A: naboene C og D føyes inn med avstand to. B legger til E. C og D gir oss F og G — avstand tre. Helt til slutt når F frem til H med avstand fire.',
  /* 46–58  */ 'Hver node får sin endelige avstand første gangen den dukker opp i køen. Det er FIFO som garanterer at vi alltid behandler nærmest først.',
  /* 58–66  */ 'En kø, og lag for lag. Bredde-først søk gir korteste antall skritt fra startpunktet til alt det kan nå.',
];

const NARRATION_AUDIO = 'audio/bfs-bolgen/scene.mp3';

// ─── Graph data ────────────────────────────────────────────────────────────
// Nine nodes laid out in five BFS layers from S:
//   layer 0: S
//   layer 1: A, B
//   layer 2: C, D, E
//   layer 3: F, G
//   layer 4: H
// Adjacency is undirected; edges listed once.
const NODE_IDS = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const NODE_LAYER = { S: 0, A: 1, B: 1, C: 2, D: 2, E: 2, F: 3, G: 3, H: 4 };

const EDGES = [
  ['S', 'A'], ['S', 'B'],
  ['A', 'C'], ['A', 'D'],
  ['B', 'D'], ['B', 'E'],
  ['C', 'F'], ['D', 'F'], ['D', 'G'], ['E', 'G'],
  ['F', 'H'], ['G', 'H'],
];

// Pre-computed BFS trace. Each step is ONE node leaving the front of the
// queue. The enqueue order is deterministic by NODE_IDS alphabetical order
// (matching standard textbook traces). DISCOVERIES[k] lists the new neighbours
// found when dequeuing TRACE[k], in the order they enter the queue.
const TRACE = ['S', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const DISCOVERIES = {
  S: ['A', 'B'],
  A: ['C', 'D'],
  B: ['E'],
  C: ['F'],
  D: ['G'],
  E: [],
  F: ['H'],
  G: [],
  H: [],
};

// Edge along the canonical shortest path S → B → E → G → H (length 4).
// Used to light up the path in beat 4.
const PATH_EDGES = [
  ['S', 'B'], ['B', 'E'], ['E', 'G'], ['G', 'H'],
];
function edgeIsOnPath(a, b) {
  for (const [u, v] of PATH_EDGES) {
    if ((u === a && v === b) || (u === b && v === a)) return true;
  }
  return false;
}

// ─── Layout ────────────────────────────────────────────────────────────────
// The graph fits inside an interior box; portrait stacks the queue beneath
// a smaller graph, landscape places the queue along the bottom.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      nodes: {
        S: { x: 360, y: 200 },
        A: { x: 220, y: 360 }, B: { x: 500, y: 360 },
        C: { x: 130, y: 540 }, D: { x: 360, y: 540 }, E: { x: 590, y: 540 },
        F: { x: 240, y: 720 }, G: { x: 480, y: 720 },
        H: { x: 360, y: 900 },
      },
      nodeR: 32, edgeStroke: 1.8,
      letterFont: 22, distFont: 13, distDy: 50,
      queueY: 1040, cellW: 60, cellH: 60, cellGap: 6,
      queueLabelY: 1010, frontMarkerY: 1115,
      actionY: 985,
      formulaY: 1190,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    nodes: {
      S: { x: 180, y: 280 },
      A: { x: 360, y: 170 }, B: { x: 360, y: 390 },
      C: { x: 540, y: 110 }, D: { x: 540, y: 280 }, E: { x: 540, y: 450 },
      F: { x: 720, y: 170 }, G: { x: 720, y: 390 },
      H: { x: 900, y: 280 },
    },
    nodeR: 28, edgeStroke: 1.8,
    letterFont: 20, distFont: 12, distDy: 42,
    queueY: 538, cellW: 50, cellH: 50, cellGap: 6,
    queueLabelY: 524, frontMarkerY: 604,
    actionY: 502,
    formulaY: 700,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Node + edge primitives ────────────────────────────────────────────────
// state: 'idle' | 'source' | 'frontier' (pulsing, just arrived)
//        | 'settled' (distance finalised) | 'dequeued' (processed)
function GraphNode({ G, id, x, y, dist, state, pulse = 0 }) {
  const border =
    state === 'source' ? 'var(--amber-400)' :
    state === 'frontier' ? 'var(--teal-400)' :
    state === 'settled' ? 'var(--amber-400)' :
    state === 'dequeued' ? 'var(--amber-300)' :
    'rgba(232,220,193,0.30)';
  const bg =
    state === 'source' ? 'rgba(244,184,96,0.18)' :
    state === 'frontier' ? 'rgba(244,184,96,0.10)' :
    state === 'settled' ? 'rgba(244,184,96,0.12)' :
    state === 'dequeued' ? 'rgba(244,184,96,0.06)' :
    'rgba(0,0,0,0.55)';
  const letterColor = state === 'idle' ? 'var(--chalk-300)' : 'var(--chalk-100)';
  return (
    <g>
      {pulse > 0 && (
        <circle cx={x} cy={y} r={G.nodeR + pulse * 14} fill="none"
                stroke="var(--teal-400)" strokeWidth={1.5}
                opacity={Math.max(0, 1 - pulse) * 0.55}/>
      )}
      <circle cx={x} cy={y} r={G.nodeR} fill={bg}
              stroke={border} strokeWidth={1.8}/>
      <text x={x} y={y + G.letterFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.letterFont} fill={letterColor}>
        {id}
      </text>
      {dist !== null && dist !== undefined && (
        <text x={x} y={y + G.distDy}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={G.distFont} fill="var(--amber-300)"
              letterSpacing="0.10em">
          {`d=${dist}`}
        </text>
      )}
    </g>
  );
}

function GraphEdge({ G, x1, y1, x2, y2, highlight = false, draw = 1, dim = false }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const d = clamp(draw, 0, 1);
  const stroke = highlight ? 'var(--amber-300)' : 'rgba(232,220,193,0.32)';
  const width = highlight ? 2.4 : G.edgeStroke;
  const opacity = dim ? 0.45 : 1;
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={stroke} strokeWidth={width}
          strokeLinecap="round" opacity={opacity}
          strokeDasharray={len} strokeDashoffset={(1 - d) * len}/>
  );
}

// ─── Queue strip (DOM, animated) ───────────────────────────────────────────
// Renders a FIFO queue of letters as a horizontal row of cells. New cells
// slide in from the right; the front cell pulses rose when about to be
// dequeued, then disappears with a quick fade.
//
// Caller passes:
//   items:  array of { id, justEnqueued } in FIFO order (front -> back)
//   frontPulse: 0..1 — intensity of "about to dequeue" highlight on items[0]
function QueueStrip({ G, items, frontPulse = 0, portrait }) {
  const totalW = items.length * (G.cellW + G.cellGap) - G.cellGap;
  // Centre the strip horizontally inside the SVG.
  const x0 = (G.svgW - Math.max(totalW, G.cellW * 3)) / 2;
  return (
    <g>
      {/* Eyebrow + FIFO label */}
      <text x={x0} y={G.queueLabelY}
            textAnchor="start"
            fontFamily="var(--font-mono)" fontSize={11}
            fill="var(--amber-300)" letterSpacing="0.16em">
        kø — fifo
      </text>
      {/* Strip ground line (always present so the strip never visually disappears). */}
      <line x1={x0} y1={G.queueY + G.cellH + 6}
            x2={x0 + Math.max(totalW, 60)} y2={G.queueY + G.cellH + 6}
            stroke="rgba(232,220,193,0.18)" strokeWidth={1}/>
      {items.map((it, k) => {
        const isFront = k === 0;
        const x = x0 + k * (G.cellW + G.cellGap);
        const slideIn = it.justEnqueued ? clamp(it.justEnqueued, 0, 1) : 1;
        // Offset incoming cell to the right while sliding in.
        const dx = (1 - slideIn) * 24;
        const border = isFront
          ? `rgba(232,122,144,${0.5 + 0.5 * frontPulse})`
          : 'rgba(232,220,193,0.34)';
        const bg = isFront
          ? `rgba(232,122,144,${0.06 + 0.08 * frontPulse})`
          : 'rgba(0,0,0,0.45)';
        return (
          <g key={`q${k}-${it.id}`} opacity={slideIn}
             transform={`translate(${dx}, 0)`}>
            <rect x={x} y={G.queueY} width={G.cellW} height={G.cellH} rx={8}
                  fill={bg} stroke={border} strokeWidth={1.8}/>
            <text x={x + G.cellW / 2}
                  y={G.queueY + G.cellH / 2 + G.letterFont * 0.36}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.letterFont} fill="var(--chalk-100)">
              {it.id}
            </text>
          </g>
        );
      })}
      {items.length > 0 && frontPulse > 0.05 && (
        <text x={x0 + G.cellW / 2}
              y={G.frontMarkerY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--rose-300)" letterSpacing="0.14em">
          front
        </text>
      )}
    </g>
  );
}

// ─── BFS simulator ─────────────────────────────────────────────────────────
// Build a snapshot of the BFS state after `dequeueStep` complete dequeue
// operations and `enqueueProgress` (0..1) of the way through the current
// step's enqueues. Returns:
//   - nodeState[id] in {'idle','source','frontier','settled','dequeued'}
//   - dist[id] in {0..4, undefined}
//   - queue: array of { id, justEnqueued } in FIFO order
function bfsSnapshot(dequeueStep, enqueueProgress, currentDequeuePulse) {
  const dist = {}; for (const id of NODE_IDS) dist[id] = undefined;
  const nodeState = {}; for (const id of NODE_IDS) nodeState[id] = 'idle';

  // Always-present source.
  dist.S = 0;
  nodeState.S = 'source';

  // Working queue + enqueue order.
  // Replay the trace up to (dequeueStep) completed dequeues; for the current
  // step we partially enqueue based on enqueueProgress so the discovered
  // letters slide in one by one.
  let queue = [{ id: 'S', justEnqueued: 1 }];

  const fullyDoneSteps = dequeueStep;       // 0..TRACE.length
  for (let step = 0; step < Math.min(fullyDoneSteps, TRACE.length); step++) {
    const popped = queue.shift();
    if (popped) nodeState[popped.id] = 'dequeued';
    const discoveries = DISCOVERIES[TRACE[step]] || [];
    for (const child of discoveries) {
      dist[child] = (dist[TRACE[step]] ?? 0) + 1;
      nodeState[child] = 'settled';
      queue.push({ id: child, justEnqueued: 1 });
    }
  }

  // Current step in progress: handle the dequeue + partial enqueue.
  if (fullyDoneSteps < TRACE.length && enqueueProgress > 0) {
    const popped = queue.shift();
    if (popped) nodeState[popped.id] = 'dequeued';
    const discoveries = DISCOVERIES[TRACE[fullyDoneSteps]] || [];
    const N = discoveries.length;
    if (N > 0) {
      // Spread enqueueProgress across N discoveries, each gets its own
      // partial slide-in.
      for (let k = 0; k < N; k++) {
        const subStart = k / N;
        const subEnd = (k + 1) / N;
        const local = clamp((enqueueProgress - subStart) / (subEnd - subStart), 0, 1);
        if (local > 0) {
          const child = discoveries[k];
          dist[child] = (dist[TRACE[fullyDoneSteps]] ?? 0) + 1;
          // Visually: just-discovered nodes pulse 'frontier' as they appear,
          // then they settle as the wave moves on.
          nodeState[child] = 'frontier';
          queue.push({ id: child, justEnqueued: local });
        }
      }
    }
  }

  return { dist, nodeState, queue, dequeuePulse: currentDequeuePulse };
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="grafer"
      title="Bredde-først søk: bølgen sprer seg"
      duration={SCENE_DURATION}
      introEnd={10.16}
      introCaption="Korteste antall skritt — fra S til alle andre."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.16} end={17.4}>
        <GrafenOgKoenBeat/>
      </Sprite>

      <Sprite start={17.4} end={37.07}>
        <BolgenBeat/>
      </Sprite>

      <Sprite start={37.07} end={45.92}>
        <HvorforFifoBeat/>
      </Sprite>

      <Sprite start={45.92} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Graph + queue intro (the world appears) ──────────────────────
// Edges trace in row by row; nodes pop in after their incident edges. S then
// pulses amber, slides into the queue with distance 0, and the FIFO eyebrow
// settles.
function GrafenOgKoenBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Per-node visibility timing — staggered by BFS layer so the graph feels
  // like it grows outward from S.
  const layerStart = (layer) => 0.10 + 0.06 * layer;
  const nodeVis = (id) => clamp((localTime - at(layerStart(NODE_LAYER[id]))) / 0.6, 0, 1);
  const edgeVis = (a, b) => {
    const minLayer = Math.min(NODE_LAYER[a], NODE_LAYER[b]);
    return clamp((localTime - at(layerStart(minLayer) + 0.02)) / 0.7, 0, 1);
  };

  // Queue: S slides in once the graph has settled enough to read.
  const queueShow = clamp((localTime - at(0.40)) / 0.5, 0, 1);
  // Distance label on S fades in just before the queue slides in.
  const sourceDistShow = clamp((localTime - at(0.32)) / 0.5, 0, 1);
  const sourcePulse = Math.max(0, Math.sin(Math.max(0, localTime - at(0.50)) * 3.0));

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Edges first (under the nodes). */}
      {EDGES.map(([a, b], k) => {
        const draw = edgeVis(a, b);
        if (draw <= 0) return null;
        const A = G.nodes[a], B = G.nodes[b];
        return (
          <GraphEdge key={`e${k}`} G={G}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            draw={draw}/>
        );
      })}

      {/* Nodes. */}
      {NODE_IDS.map((id) => {
        const v = nodeVis(id);
        if (v <= 0) return null;
        const p = G.nodes[id];
        const isSource = id === 'S';
        return (
          <g key={`n${id}`} opacity={v}>
            <GraphNode G={G} id={id} x={p.x} y={p.y}
                       dist={isSource && sourceDistShow > 0.3 ? 0 : null}
                       state={isSource ? 'source' : 'idle'}
                       pulse={isSource ? sourcePulse * 0.7 : 0}/>
          </g>
        );
      })}

      {/* Queue strip seeded with S. */}
      {queueShow > 0 && (
        <g opacity={queueShow}>
          <QueueStrip G={G}
            items={[{ id: 'S', justEnqueued: queueShow }]}
            frontPulse={0} portrait={portrait}/>
        </g>
      )}
    </svg>
  );
}

// ─── Beat 3: Bølgen sprer seg (GENUINE MOTION — BFS layer expansion) ─────
// We replay the 9 dequeue steps of BFS across the sprite's working duration.
// Each step has two sub-phases:
//   DEQUEUE   (≈ 0.4 of stepDur)  front cell pulses rose, then disappears
//   ENQUEUE   (≈ 0.6 of stepDur)  newly discovered nodes slide into queue,
//                                 their layer ripple pulses teal once
// The wave pulse is rendered as a temporary 'frontier' state on the
// just-discovered nodes; once their enqueue finishes they shift to 'settled'.
function BolgenBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  // Reserve a brief intro tail (0.06 T) for the queue/world settling, then
  // assign STEP_TIMINGS proportionally across the remaining time.
  // 9 steps; weight each step ~1 unit, except S (which discovers 2) and A
  // (also 2) get slightly more time to let both letters land cleanly.
  const STEP_WEIGHTS = {
    S: 1.5, A: 1.5, B: 1.0, C: 1.0, D: 1.0, E: 0.7, F: 1.0, G: 0.7, H: 0.6,
  };
  const startFrac = 0.06;
  const totalWeight = TRACE.reduce((s, id) => s + STEP_WEIGHTS[id], 0);
  const stepStarts = []; // fraction of T at which each step starts
  let running = startFrac;
  for (let k = 0; k < TRACE.length; k++) {
    stepStarts.push(running);
    running += (1 - startFrac - 0.04) * STEP_WEIGHTS[TRACE[k]] / totalWeight;
  }
  stepStarts.push(running); // sentinel = end of last step

  // Locate current step + sub-phase.
  let stepIdx = 0;
  for (let k = TRACE.length - 1; k >= 0; k--) {
    if (localTime >= stepStarts[k] * T) { stepIdx = k; break; }
  }
  const stepLo = stepStarts[stepIdx] * T;
  const stepHi = stepStarts[stepIdx + 1] * T;
  const stepProg = clamp((localTime - stepLo) / Math.max(0.001, stepHi - stepLo), 0, 1);

  // Sub-phases inside one step.
  const DEQUEUE_FRAC = 0.35;
  const inDequeue = stepProg < DEQUEUE_FRAC;
  const dequeueProg = clamp(stepProg / DEQUEUE_FRAC, 0, 1);
  const enqueueProg = clamp((stepProg - DEQUEUE_FRAC) / (1 - DEQUEUE_FRAC), 0, 1);

  // dequeuePulse: 1 at peak (mid of dequeue phase), 0 at boundaries.
  const dequeuePulse = inDequeue
    ? Math.sin(dequeueProg * Math.PI)
    : 0;

  // The number of fully-completed dequeue steps.
  const fullyDoneSteps = inDequeue ? stepIdx : stepIdx + (enqueueProg >= 1 ? 1 : 0);

  // Build the snapshot.
  // - When in dequeue: pass dequeueProg (no enqueue progress yet).
  // - When in enqueue: pass enqueueProg.
  const snap = bfsSnapshot(
    inDequeue ? stepIdx : stepIdx,
    inDequeue ? 0 : enqueueProg,
    dequeuePulse,
  );

  // Compute frontier pulse for the freshly discovered nodes (only during
  // enqueue phase, only the *just-arrived* set).
  // We re-derive frontier pulse here so circular ripples appear at each
  // newly-discovered node.
  const wavePulseAt = (id) => {
    if (snap.nodeState[id] !== 'frontier') return 0;
    // Local pulse 0..1..0 across this enqueue slot.
    const discoveries = DISCOVERIES[TRACE[stepIdx]] || [];
    const k = discoveries.indexOf(id);
    if (k < 0) return 0;
    const N = discoveries.length;
    const subStart = k / N;
    const subEnd = (k + 1) / N;
    const local = clamp((enqueueProg - subStart) / (subEnd - subStart), 0, 1);
    return Math.sin(local * Math.PI);
  };

  // Captions hint at the current operation (small, dim, in a strip above
  // the queue). Keeps the beat readable for someone reading silently.
  const dequeuingId = inDequeue && stepIdx < TRACE.length ? TRACE[stepIdx] : null;
  const enqueueingFor = !inDequeue && stepIdx < TRACE.length ? TRACE[stepIdx] : null;
  const enqueueNew = enqueueingFor ? (DISCOVERIES[enqueueingFor] || []) : [];

  let actionText = '';
  let actionAccent = 'var(--amber-300)';
  if (dequeuingId) {
    actionText = `tar ut ${dequeuingId}`;
    actionAccent = 'var(--rose-300)';
  } else if (enqueueingFor) {
    actionText = enqueueNew.length > 0
      ? `legger inn ${enqueueNew.join(', ')}`
      : `ingen nye naboer`;
    actionAccent = 'var(--amber-300)';
  }

  // Action strip — sits on the queue-eyebrow line at the right edge so it
  // never overlaps node distance labels. (Earlier centering crashed into
  // the bottom row of nodes in landscape.)
  const actionY = G.queueLabelY;

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>

        {/* Edges — dim by default, highlight if both endpoints are settled
            (i.e. part of the discovered BFS tree). */}
        {EDGES.map(([a, b], k) => {
          const A = G.nodes[a], B = G.nodes[b];
          const aOn = snap.nodeState[a] !== 'idle';
          const bOn = snap.nodeState[b] !== 'idle';
          return (
            <GraphEdge key={`e${k}`} G={G}
              x1={A.x} y1={A.y} x2={B.x} y2={B.y}
              draw={1}
              dim={!(aOn && bOn)}/>
          );
        })}

        {/* Nodes with their current state + distance. */}
        {NODE_IDS.map((id) => {
          const p = G.nodes[id];
          let state = snap.nodeState[id];
          // The source stays 'source'/'dequeued' (we don't want 'idle' on S).
          if (id === 'S' && state === 'idle') state = 'source';
          const pulse = wavePulseAt(id);
          return (
            <GraphNode key={`n${id}`} G={G}
              id={id} x={p.x} y={p.y}
              dist={snap.dist[id]}
              state={state}
              pulse={pulse}/>
          );
        })}

        {/* Queue strip with current FIFO state. */}
        <QueueStrip G={G}
          items={snap.queue}
          frontPulse={dequeuePulse}
          portrait={portrait}/>

        {/* Action label — same baseline as the queue eyebrow, anchored to
            the right edge so it always sits on the queue band, away from
            the graph. */}
        {actionText && (
          <text x={G.svgW - 60} y={actionY}
                textAnchor="end"
                fontFamily="var(--font-mono)" fontSize={13}
                fill={actionAccent} letterSpacing="0.10em">
            {actionText}
          </text>
        )}
      </svg>
    </>
  );
}

// ─── Beat 4: Hvorfor FIFO — shortest path lit up ──────────────────────────
// All distances are final. The path S → B → E → G → H lights amber to show
// "first time a node appears in the queue = its true shortest distance".
function HvorforFifoBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Distances finalized from the BFS run.
  const FINAL_DIST = { S: 0, A: 1, B: 1, C: 2, D: 2, E: 2, F: 3, G: 3, H: 4 };

  // Edge highlight wave along the path. Each path edge draws in over 0.6s
  // staggered by 0.25 T / number-of-edges so the whole path lights up in
  // sequence then holds.
  const PATH_START = 0.10;
  const PATH_PER = 0.13;
  const pathHighlight = (k) => clamp((localTime - at(PATH_START + k * PATH_PER)) / 0.5, 0, 1);

  // Caption + payoff timings. Lands once the path is fully lit so it can
  // act as the verbal summary of what just glowed.
  const captionT = clamp((localTime - at(0.46)) / 0.6, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Non-path edges, dim. */}
      {EDGES.map(([a, b], k) => {
        if (edgeIsOnPath(a, b)) return null;
        const A = G.nodes[a], B = G.nodes[b];
        return (
          <GraphEdge key={`e${k}`} G={G}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            draw={1} dim={true}/>
        );
      })}

      {/* Path edges, amber, draw in order. */}
      {PATH_EDGES.map(([a, b], k) => {
        const A = G.nodes[a], B = G.nodes[b];
        const hi = pathHighlight(k);
        if (hi <= 0) return null;
        return (
          <GraphEdge key={`pe${k}`} G={G}
            x1={A.x} y1={A.y} x2={B.x} y2={B.y}
            draw={hi} highlight={true}/>
        );
      })}

      {/* Nodes with their final distances. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        const onPath = PATH_EDGES.some(([u, v]) => u === id || v === id);
        let state = onPath ? 'settled' : 'dequeued';
        if (id === 'S') state = 'source';
        return (
          <GraphNode key={`n${id}`} G={G}
            id={id} x={p.x} y={p.y}
            dist={FINAL_DIST[id]}
            state={state}/>
        );
      })}

      {/* Caption (FIFO + lag for lag = nærmest først). */}
      <g opacity={captionT}>
        <text x={G.svgW / 2} y={portrait ? 1100 : 568}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 26 : 26}
              fill="var(--chalk-100)">
          FIFO + lag for lag = nærmest først.
        </text>
      </g>
    </svg>
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
      alignItems: 'center', gap: portrait ? 22 : 26,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        bredde-først søk
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 38,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '30ch',
          lineHeight: 1.25,
        }}>
        En kø — <span style={{ color: 'var(--amber-300)' }}>lag for lag.</span>
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 20 : 24,
          color: 'var(--amber-300)',
          padding: portrait ? '10px 20px' : '12px 22px',
          borderRadius: 12,
          border: '1.5px solid var(--amber-400)',
          background: 'rgba(244,184,96,0.10)',
        }}>
        BFS ∈ O(n + m)
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', maxWidth: portrait ? '26ch' : '40ch',
          lineHeight: 1.5,
        }}>
        n noder pluss m kanter — hver besøkt én gang.
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
