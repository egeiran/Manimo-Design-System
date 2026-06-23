// Dijkstra: slapp av avstandene — Manimo lesson scene.
// Chapter 10 of algdat (Korteste vei fra én kilde). The algorithm answers
// "how far is it really from S to every other vertex on a weighted graph?"
// Each round we extract the closest unsettled node and relax its outgoing
// edges — if going via the just-settled node beats the current tentative
// distance, the label ticks down. Six nodes, eight weighted edges, two
// clean relaxation wins (B 5→3 via A; C 9→6 via B) and one explicit
// no-improvement attempt (D→E: 7+2 = 9, not less than 7). Final tree
// payoff: every node's distance set, every edge relaxed exactly once.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–13   Manimo hook
//   13–22   Graf + uendeligheter: nodes, edges + weights, S = 0
//   22–30   Trekk ut S, slapp av naboene (GENUINE MOTION — first relaxes)
//   30–44   A og B (GENUINE MOTION — two relaxation wins with old → new tickers)
//   44–56   C, D, E (GENUINE MOTION — the "no improvement" moment on D→E)
//   56–66   Takeaway: én haug, hver kant slappes av én gang
//
// Colour discipline:
//   chalk-100  high-contrast text, node letters
//   chalk-200  caption body, weight labels
//   chalk-300  dimmed text/edges, infinity placeholders
//   amber-400  source, settled node ring, primary stroke for active relax
//   amber-300  distance labels, payoff text, "wins" highlight
//   teal-400   candidate (in heap) node ring, fresh-from-relax label flash
//   rose-300   "no improvement" / failure indicator
//   rose-400   active edge that failed to improve
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 61;

const NARRATION = [
  /*  0–13  */ 'Du står på et kart med vekter på veiene. Hvor langt er det egentlig fra start til hver eneste by? Dijkstra svarer ved å slappe av avstandene én etter én.',
  /* 13–22  */ 'Vi setter S til null, og alt det andre til uendelig. Hver kant viser hvor mye det koster å gå over.',
  /* 22–30  */ 'Trekk ut nærmeste — S er null. Naboene oppdateres: A blir to og B blir fem.',
  /* 30–44  */ 'Så A. Veien via A til B er kortere: fem ned til tre. C settes til ni. Nå er B nærmest med tre — og igjen kortes C, fra ni til seks, mens D blir sju.',
  /* 44–56  */ 'Vi tar ut C, så E settes til sju. D er ute nå, og forsøker mot E — men sju pluss to slår ikke sju. E står fast. Til slutt E, ferdig.',
  /* 56–66  */ 'Trekk alltid ut den nærmeste først. Da er den ferdig, og vi slipper å gå tilbake. Det er hele ideen — én haug, og hver kant slappes av bare én gang.',
];

const NARRATION_AUDIO = 'audio/dijkstra-slapp-av/scene.mp3';

// ─── Graph data ────────────────────────────────────────────────────────────
const NODE_IDS = ['S', 'A', 'B', 'C', 'D', 'E'];

const EDGES = [
  ['S', 'A', 2],
  ['S', 'B', 5],
  ['A', 'B', 1],
  ['A', 'C', 7],
  ['B', 'C', 3],
  ['B', 'D', 4],
  ['C', 'E', 1],
  ['D', 'E', 2],
];

// The trace of the algorithm, step by step. Each step extracts the closest
// unsettled node, then attempts to relax each incident edge to an
// unsettled neighbour. `improved` flags whether the relaxation actually
// updated the neighbour's tentative distance.
const TRACE = [
  { extract: 'S', settledD: 0, relaxes: [
    { to: 'A', edge: ['S', 'A'], w: 2, oldD: Infinity, newD: 2, improved: true },
    { to: 'B', edge: ['S', 'B'], w: 5, oldD: Infinity, newD: 5, improved: true },
  ]},
  { extract: 'A', settledD: 2, relaxes: [
    { to: 'B', edge: ['A', 'B'], w: 1, oldD: 5, newD: 3, improved: true },
    { to: 'C', edge: ['A', 'C'], w: 7, oldD: Infinity, newD: 9, improved: true },
  ]},
  { extract: 'B', settledD: 3, relaxes: [
    { to: 'C', edge: ['B', 'C'], w: 3, oldD: 9, newD: 6, improved: true },
    { to: 'D', edge: ['B', 'D'], w: 4, oldD: Infinity, newD: 7, improved: true },
  ]},
  { extract: 'C', settledD: 6, relaxes: [
    { to: 'E', edge: ['C', 'E'], w: 1, oldD: Infinity, newD: 7, improved: true },
  ]},
  { extract: 'D', settledD: 7, relaxes: [
    { to: 'E', edge: ['D', 'E'], w: 2, oldD: 7, newD: 7, improved: false },
  ]},
  { extract: 'E', settledD: 7, relaxes: [] },
];

// The shortest-path tree (one parent per non-source node, chosen by which
// relaxation set the final distance). Used to highlight the tree in the
// takeaway beat.
const TREE_EDGES = [
  ['S', 'A'], // d=2
  ['A', 'B'], // d=3
  ['B', 'C'], // d=6
  ['B', 'D'], // d=7
  ['C', 'E'], // d=7
];
function edgeIsTree(a, b) {
  for (const [u, v] of TREE_EDGES) {
    if ((u === a && v === b) || (u === b && v === a)) return true;
  }
  return false;
}

// Map (extractIdx, relaxIdx) → its slice of the motion beat. We don't
// re-derive timings inside React — we pre-compute them so each beat just
// asks "at fraction f, where am I?".

// ─── Layout ────────────────────────────────────────────────────────────────
// Six nodes in a horizontal diamond in landscape, vertical diamond in
// portrait. The action strip lives below the graph; weight labels ride
// alongside each edge.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      nodes: {
        S: { x: 360, y: 280 },
        A: { x: 210, y: 460 }, B: { x: 510, y: 460 },
        C: { x: 210, y: 680 }, D: { x: 510, y: 680 },
        E: { x: 360, y: 860 },
      },
      nodeR: 36, edgeStroke: 1.8,
      letterFont: 24, distFont: 16, distDy: 56, weightFont: 13,
      actionY: 990, actionFont: 16,
      hintY: 1050, hintFont: 13,
      formulaY: 1140,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    nodes: {
      S: { x: 200, y: 360 },
      A: { x: 420, y: 230 }, B: { x: 420, y: 490 },
      C: { x: 680, y: 230 }, D: { x: 680, y: 490 },
      E: { x: 900, y: 360 },
    },
    nodeR: 30, edgeStroke: 1.8,
    letterFont: 20, distFont: 13, distDy: 46, weightFont: 12,
    actionY: 624, actionFont: 14,
    hintY: 660, hintFont: 13,
    formulaY: 700,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Place a weight label outside the edge midpoint, offset perpendicular to
// the edge direction so it doesn't overlap a node.
function weightPlacement(p1, p2) {
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular offset (rotate 90°). Choose the side that bends away
  // from the canvas centre so labels never crash into nodes.
  const nx = -dy / len, ny = dx / len;
  return { x: mx + nx * 14, y: my + ny * 14 };
}

// ─── Node + edge primitives ────────────────────────────────────────────────
// state: 'idle' | 'source' | 'candidate' (in queue, has tentative d)
//        | 'extracting' (currently being extracted, pulses)
//        | 'settled' (final d)
//        | 'target' (currently the target of a relaxation)
function GraphNode({ G, id, x, y, dist, state, pulse = 0, tickerOldD = null, tickerNewD = null, tickerShow = 0, tickerImproved = true }) {
  const border =
    state === 'extracting' ? 'var(--amber-400)' :
    state === 'settled' ? 'var(--amber-400)' :
    state === 'source' ? 'var(--amber-400)' :
    state === 'target' ? 'var(--teal-400)' :
    state === 'candidate' ? 'var(--teal-400)' :
    'rgba(232,220,193,0.30)';
  const bg =
    state === 'extracting' ? 'rgba(244,184,96,0.22)' :
    state === 'settled' ? 'rgba(244,184,96,0.14)' :
    state === 'source' ? 'rgba(244,184,96,0.18)' :
    state === 'target' ? 'rgba(232,220,193,0.06)' :
    state === 'candidate' ? 'rgba(0,0,0,0.55)' :
    'rgba(0,0,0,0.55)';
  const letterColor = state === 'idle' ? 'var(--chalk-300)' : 'var(--chalk-100)';
  const distColor =
    state === 'settled' || state === 'extracting' || state === 'source'
      ? 'var(--amber-300)'
      : state === 'target' ? 'var(--teal-400)'
      : 'var(--chalk-200)';

  const distLabel = (d) => {
    if (d === Infinity || d === undefined || d === null) return '∞'; // ∞
    return String(d);
  };

  return (
    <g>
      {pulse > 0 && (
        <circle cx={x} cy={y} r={G.nodeR + pulse * 14} fill="none"
                stroke={state === 'target' ? 'var(--teal-400)' : 'var(--amber-400)'}
                strokeWidth={1.5}
                opacity={Math.max(0, 1 - pulse) * 0.55}/>
      )}
      <circle cx={x} cy={y} r={G.nodeR} fill={bg}
              stroke={border} strokeWidth={1.8}/>
      <text x={x} y={y + G.letterFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.letterFont} fill={letterColor}>
        {id}
      </text>
      {/* Tentative or final distance label below the node. */}
      <text x={x} y={y + G.distDy}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.distFont} fill={distColor}
            letterSpacing="0.08em">
        {distLabel(dist)}
      </text>

      {/* "old → new" ticker badge that rides above the node during a
          relaxation. Shows: '5 → 3' (improved) or '9 ≥ 7' (rejected). */}
      {tickerShow > 0 && (
        <g opacity={tickerShow}>
          <rect x={x - 38} y={y - G.nodeR - 28}
                width={76} height={20} rx={6}
                fill="rgba(0,0,0,0.85)"
                stroke={tickerImproved ? 'var(--amber-300)' : 'var(--rose-400)'}
                strokeWidth={1.2}/>
          <text x={x} y={y - G.nodeR - 14}
                textAnchor="middle" fontFamily="var(--font-mono)"
                fontSize={11}
                fill={tickerImproved ? 'var(--amber-300)' : 'var(--rose-300)'}
                letterSpacing="0.08em">
            {tickerImproved
              ? `${distLabel(tickerOldD)} → ${distLabel(tickerNewD)}`
              : `${distLabel(tickerOldD)} ≥ ${distLabel(tickerNewD)}`}
          </text>
        </g>
      )}
    </g>
  );
}

// Edge state: 'idle' | 'tree' | 'relax-active' | 'relax-fail'
function GraphEdge({ G, p1, p2, weight, state = 'idle', draw = 1, dim = false }) {
  const len = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const d = clamp(draw, 0, 1);
  const stroke =
    state === 'relax-active' ? 'var(--amber-400)' :
    state === 'relax-fail' ? 'var(--rose-400)' :
    state === 'tree' ? 'var(--amber-300)' :
    'rgba(232,220,193,0.32)';
  const width =
    state === 'relax-active' ? 3.2 :
    state === 'relax-fail' ? 2.6 :
    state === 'tree' ? 2.6 :
    G.edgeStroke;
  const opacity = dim ? 0.40 : 1;
  const dash = state === 'relax-fail' ? '5 4' : undefined;
  return (
    <g>
      <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
            stroke={stroke} strokeWidth={width}
            strokeLinecap="round" opacity={opacity}
            strokeDasharray={dash || len}
            strokeDashoffset={dash ? 0 : (1 - d) * len}/>
      {/* Weight label sits on the perpendicular offset. */}
      {weight !== undefined && (
        <WeightLabel G={G} p1={p1} p2={p2} value={weight}
          state={state} dim={dim}/>
      )}
    </g>
  );
}

function WeightLabel({ G, p1, p2, value, state, dim }) {
  const p = weightPlacement(p1, p2);
  const color =
    state === 'relax-active' ? 'var(--amber-300)' :
    state === 'relax-fail' ? 'var(--rose-300)' :
    state === 'tree' ? 'var(--amber-300)' :
    'var(--chalk-300)';
  return (
    <g opacity={dim ? 0.45 : 1}>
      <rect x={p.x - 10} y={p.y - 9}
            width={20} height={18} rx={4}
            fill="rgba(0,0,0,0.78)"
            stroke="rgba(232,220,193,0.0)"/>
      <text x={p.x} y={p.y + G.weightFont * 0.34}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.weightFont} fill={color}>
        {value}
      </text>
    </g>
  );
}

// ─── Algorithm snapshot ────────────────────────────────────────────────────
// Given the algorithm-progress descriptor (which extractIdx we're on, how
// far through the relax phase, etc.), produce the per-node + per-edge
// state needed to render a frame.
//
// progress = {
//   completedExtracts: number,           // 0..TRACE.length
//   currentExtract: number|null,         // index of the in-progress extract
//   extractProg: 0..1,                   // 0=ring just lit, 1=fully settled
//   activeRelaxIdx: number|null,         // index into TRACE[currentExtract].relaxes
//   relaxProg: 0..1,                     // 0=edge just lit, 1=label settled
// }
function dijkstraSnapshot(progress) {
  const dist = {};
  for (const id of NODE_IDS) dist[id] = Infinity;
  const nodeState = {};
  for (const id of NODE_IDS) nodeState[id] = 'idle';
  // Source's tentative distance is always zero, even at t=0.
  dist.S = 0;
  nodeState.S = 'source';

  // Replay all fully completed extracts.
  for (let k = 0; k < progress.completedExtracts; k++) {
    const step = TRACE[k];
    nodeState[step.extract] = 'settled';
    dist[step.extract] = step.settledD;
    for (const r of step.relaxes) {
      // The relaxation either improved newD or kept oldD. We materialise
      // the result.
      if (r.improved) dist[r.to] = r.newD;
      if (nodeState[r.to] === 'idle' && dist[r.to] !== Infinity) {
        nodeState[r.to] = 'candidate';
      }
    }
  }

  // Mid-step bookkeeping.
  let extractingId = null;
  let activeRelaxEdge = null;
  let activeRelaxFail = false;
  let activeTicker = null;

  if (progress.currentExtract !== null && progress.currentExtract < TRACE.length) {
    const step = TRACE[progress.currentExtract];
    extractingId = step.extract;

    // Lift this node out of 'candidate' into 'extracting' once we start
    // settling it.
    const ep = clamp(progress.extractProg, 0, 1);
    if (ep > 0) {
      nodeState[step.extract] = ep >= 1 ? 'settled' : 'extracting';
      dist[step.extract] = step.settledD;
    }

    // Process relaxations. Each relax slot covers a fraction of the
    // post-extract phase. The active one (activeRelaxIdx) is at relaxProg.
    if (progress.activeRelaxIdx !== null) {
      // Completed relaxes
      for (let r = 0; r < progress.activeRelaxIdx; r++) {
        const rel = step.relaxes[r];
        if (rel.improved) {
          dist[rel.to] = rel.newD;
          if (nodeState[rel.to] === 'idle' || nodeState[rel.to] === 'candidate') {
            nodeState[rel.to] = 'candidate';
          }
        }
      }
      // Active relax: edge lit, target node pulses, ticker badge over the
      // target, distance ticks down at the back half.
      const rel = step.relaxes[progress.activeRelaxIdx];
      if (rel) {
        const rp = clamp(progress.relaxProg, 0, 1);
        activeRelaxEdge = rel.edge;
        activeRelaxFail = !rel.improved;
        // Target node visual treatment.
        if (nodeState[rel.to] !== 'settled') {
          nodeState[rel.to] = 'target';
        }
        // Distance ticks down at rp = 0.55 onwards.
        if (rel.improved && rp >= 0.55) {
          dist[rel.to] = rel.newD;
          if (nodeState[rel.to] === 'idle') nodeState[rel.to] = 'candidate';
        }
        // Ticker is visible during the back half of the relax window.
        const tickerShow = clamp((rp - 0.20) / 0.40, 0, 1) *
                           clamp((1 - rp) / 0.20, 0, 1);
        if (tickerShow > 0) {
          activeTicker = {
            target: rel.to,
            oldD: rel.oldD,
            newD: rel.newD,
            improved: rel.improved,
            show: tickerShow,
          };
        }
      }
    }
  }

  return { dist, nodeState, extractingId, activeRelaxEdge, activeRelaxFail, activeTicker };
}

// ─── Step scheduler ────────────────────────────────────────────────────────
// Each motion beat owns a contiguous slice of TRACE. Inside the beat we
// allocate a settling phase + N relaxation phases per step, weighted so
// "rich" steps (multi-relax) get more screen time.
//
// schedule({ T, steps: [{ extractIdx, weight }] }) → returns helper:
//   atTime(localTime) → progress object for dijkstraSnapshot.
function makeScheduler(T, steps) {
  // Settle takes 0.18 of step time; relaxations split the remaining 0.82.
  // "no-op" relaxations get a fraction more, so the explicit fail moment
  // gets time to read.
  const totalWeight = steps.reduce((s, st) => s + st.weight, 0);
  const margin = 0.08 * T;
  const usable = T - 2 * margin;
  const stepStarts = [];
  let acc = margin;
  for (const st of steps) {
    stepStarts.push(acc);
    acc += usable * st.weight / totalWeight;
  }
  stepStarts.push(acc); // sentinel

  return function atTime(localTime) {
    // Find current step.
    let curIdx = -1;
    for (let i = 0; i < steps.length; i++) {
      if (localTime >= stepStarts[i]) curIdx = i;
    }
    if (curIdx < 0) {
      return { completedExtracts: steps[0].extractIdx,
               currentExtract: null, extractProg: 0,
               activeRelaxIdx: null, relaxProg: 0 };
    }
    const stepLo = stepStarts[curIdx];
    const stepHi = stepStarts[curIdx + 1];
    const stepDur = Math.max(0.001, stepHi - stepLo);
    const stepFrac = clamp((localTime - stepLo) / stepDur, 0, 1);
    const extractIdx = steps[curIdx].extractIdx;
    const stepData = TRACE[extractIdx];

    // 0..0.18 = settle phase, 0.18..1.0 = relaxes
    const SETTLE_END = 0.18;
    if (stepFrac < SETTLE_END) {
      return {
        completedExtracts: extractIdx,
        currentExtract: extractIdx,
        extractProg: stepFrac / SETTLE_END,
        activeRelaxIdx: null, relaxProg: 0,
      };
    }
    // Distribute relaxes evenly across (1 - SETTLE_END).
    const N = stepData.relaxes.length;
    if (N === 0) {
      return {
        completedExtracts: extractIdx,
        currentExtract: extractIdx,
        extractProg: 1,
        activeRelaxIdx: null, relaxProg: 0,
      };
    }
    const relaxBand = (stepFrac - SETTLE_END) / (1 - SETTLE_END);
    const slot = Math.min(N - 1, Math.floor(relaxBand * N));
    const inSlot = (relaxBand - slot / N) * N;
    return {
      completedExtracts: extractIdx,
      currentExtract: extractIdx,
      extractProg: 1,
      activeRelaxIdx: slot,
      relaxProg: clamp(inSlot, 0, 1),
    };
  };
}

// ─── Action strip ──────────────────────────────────────────────────────────
// Mono caption pinned below the graph that names the current operation:
//   "trekker ut B" during the settle phase
//   "B → C: 6 < 9 ✓" during a winning relax
//   "D → E: 9 ≥ 7 ✗" during a failing relax
function describeProgress(progress) {
  if (progress.currentExtract === null) return null;
  const step = TRACE[progress.currentExtract];
  if (progress.extractProg < 1) {
    return { text: `trekker ut ${step.extract}`, accent: 'var(--amber-300)' };
  }
  if (progress.activeRelaxIdx === null) return null;
  const rel = step.relaxes[progress.activeRelaxIdx];
  if (!rel) return null;
  const oldStr = rel.oldD === Infinity ? '∞' : String(rel.oldD);
  if (rel.improved) {
    return {
      text: `${step.extract} → ${rel.to}: ${rel.newD} < ${oldStr}`,
      accent: 'var(--amber-300)',
    };
  }
  // Failed: try-relax left the value alone.
  const tried = step.settledD + rel.w;
  return {
    text: `${step.extract} → ${rel.to}: ${tried} ≥ ${rel.newD}`,
    accent: 'var(--rose-300)',
  };
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="korteste vei"
      title="Dijkstra: slapp av avstandene"
      duration={SCENE_DURATION}
      introEnd={11.71}
      introCaption="Trekk ut nærmeste — slapp av naboene."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.71} end={19.03}>
        <InitialStateBeat/>
      </Sprite>

      <Sprite start={19.03} end={26.39}>
        <ExtractSBeat/>
      </Sprite>

      <Sprite start={26.39} end={38.55}>
        <ExtractABBeat/>
      </Sprite>

      <Sprite start={38.55} end={48.9}>
        <ExtractCDEBeat/>
      </Sprite>

      <Sprite start={48.9} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared graph renderer ────────────────────────────────────────────────
// Pulls a snapshot + per-step inputs and renders the graph layer. Caller
// supplies optional treeMode for the takeaway. `extractPulse` is the sine
// envelope of the in-progress extract (0..1..0) — used to ripple the ring
// around the node being settled.
function GraphLayer({ G, snap, extractPulse = 0, treeMode = false, dimNonTree = false }) {
  return (
    <>
      {EDGES.map(([a, b, w], k) => {
        const p1 = G.nodes[a], p2 = G.nodes[b];
        let state = 'idle';
        let dim = false;
        if (treeMode) {
          state = edgeIsTree(a, b) ? 'tree' : 'idle';
          dim = !edgeIsTree(a, b);
        } else if (snap.activeRelaxEdge) {
          const [ea, eb] = snap.activeRelaxEdge;
          if ((ea === a && eb === b) || (ea === b && eb === a)) {
            state = snap.activeRelaxFail ? 'relax-fail' : 'relax-active';
          }
        }
        if (dimNonTree && !edgeIsTree(a, b)) dim = true;
        return (
          <GraphEdge key={`e${k}`} G={G}
            p1={p1} p2={p2} weight={w}
            state={state} dim={dim} draw={1}/>
        );
      })}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        const state = snap.nodeState[id];
        const isExtracting = snap.extractingId === id && state === 'extracting';
        const isRelaxTarget = snap.activeTicker && snap.activeTicker.target === id;
        const tickerShow = isRelaxTarget ? snap.activeTicker.show : 0;
        return (
          <GraphNode key={`n${id}`} G={G}
            id={id} x={p.x} y={p.y}
            dist={snap.dist[id]}
            state={state}
            pulse={isExtracting ? extractPulse : 0}
            tickerShow={tickerShow}
            tickerOldD={isRelaxTarget ? snap.activeTicker.oldD : null}
            tickerNewD={isRelaxTarget ? snap.activeTicker.newD : null}
            tickerImproved={isRelaxTarget ? snap.activeTicker.improved : true}/>
        );
      })}
    </>
  );
}

// ─── Beat 2: Grafen og uendelighetene ──────────────────────────────────────
// Edges trace in alphabetically, then nodes pop in over them. S lights
// amber with distance 0, all other nodes show ∞.
function InitialStateBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Edges + nodes appear left-to-right by node x-coordinate.
  const nodeOrder = NODE_IDS.slice().sort((a, b) => G.nodes[a].x - G.nodes[b].x);
  const nodeAppearAt = {};
  for (let i = 0; i < nodeOrder.length; i++) {
    nodeAppearAt[nodeOrder[i]] = 0.12 + i * 0.06;
  }
  const nodeVis = (id) => clamp((localTime - at(nodeAppearAt[id])) / 0.55, 0, 1);
  const edgeVis = (a, b) => {
    const t = Math.min(nodeAppearAt[a], nodeAppearAt[b]) + 0.04;
    return clamp((localTime - at(t)) / 0.55, 0, 1);
  };

  // S's amber distance label lands as soon as the node itself does so the
  // "S til null" narration matches what's on screen.
  const sourceLabelShow = clamp((localTime - at(0.18)) / 0.45, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {EDGES.map(([a, b, w], k) => {
        const draw = edgeVis(a, b);
        if (draw <= 0) return null;
        return (
          <GraphEdge key={`e${k}`} G={G}
            p1={G.nodes[a]} p2={G.nodes[b]} weight={w}
            draw={draw} state="idle"/>
        );
      })}
      {NODE_IDS.map((id) => {
        const v = nodeVis(id);
        if (v <= 0) return null;
        const p = G.nodes[id];
        const isSource = id === 'S';
        const sourceShow = isSource && sourceLabelShow > 0.3;
        return (
          <g key={`n${id}`} opacity={v}>
            <GraphNode G={G} id={id} x={p.x} y={p.y}
              dist={sourceShow ? 0 : Infinity}
              state={isSource ? 'source' : 'idle'}
              pulse={isSource ? sourceLabelShow * 0.3 : 0}/>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Beat 3: Trekk ut S, slapp av naboene (GENUINE MOTION) ────────────────
// Single TRACE step (S). Settle S, relax to A and B sequentially.
function ExtractSBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const sched = makeScheduler(T, [
    { extractIdx: 0, weight: 1 },
  ]);
  const progress = sched(localTime);
  const snap = dijkstraSnapshot(progress);
  const action = describeProgress(progress);
  const extractPulse = (progress.currentExtract !== null && progress.extractProg < 1)
    ? Math.sin(progress.extractProg * Math.PI) : 0;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <GraphLayer G={G} snap={snap} extractPulse={extractPulse}/>
      {action && (
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.actionFont}
              fill={action.accent} letterSpacing="0.10em">
          {action.text}
        </text>
      )}
    </svg>
  );
}

// ─── Beat 4: A og B (GENUINE MOTION — two relaxation wins) ────────────────
// Two TRACE steps: A then B. Each has two relaxations. The relaxation
// label "5 → 3" / "9 → 6" should be unmissable.
function ExtractABBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  // A's step has 2 relaxes (one is a "win"), B's also has 2 (also a win).
  // Equal weight reads as steady rhythm; we let the actual relax slot
  // pacing inside makeScheduler handle the rest.
  const sched = makeScheduler(T, [
    { extractIdx: 1, weight: 1.1 },
    { extractIdx: 2, weight: 1.1 },
  ]);
  const progress = sched(localTime);
  const snap = dijkstraSnapshot(progress);
  const action = describeProgress(progress);
  const extractPulse = (progress.currentExtract !== null && progress.extractProg < 1)
    ? Math.sin(progress.extractProg * Math.PI) : 0;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <GraphLayer G={G} snap={snap} extractPulse={extractPulse}/>
      {action && (
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.actionFont}
              fill={action.accent} letterSpacing="0.10em">
          {action.text}
        </text>
      )}
      {/* Hint line: the "shorter via neighbour?" prompt sits below the
          action strip for the entire beat so the moral of the motion is
          on screen. */}
      <text x={G.svgW / 2} y={G.hintY}
            textAnchor="middle" fontFamily="var(--font-sans)"
            fontStyle="italic"
            fontSize={G.hintFont} fill="var(--chalk-300)">
        kortere via nabo? — ta den nye verdien.
      </text>
    </svg>
  );
}

// ─── Beat 5: C, D, E (GENUINE MOTION — the no-improvement moment) ─────────
// Three TRACE steps. The D-step has a single relax that DOESN'T improve;
// that frame must read as "we tried, we lost, E stayed at 7".
function ExtractCDEBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  // Weight D more so the failure has room to land in the viewer's eye.
  const sched = makeScheduler(T, [
    { extractIdx: 3, weight: 1.0 },  // C settles, 1 relax (E ∞→7)
    { extractIdx: 4, weight: 1.4 },  // D settles, 1 try-relax (E fails)
    { extractIdx: 5, weight: 0.7 },  // E settles, 0 relaxes
  ]);
  const progress = sched(localTime);
  const snap = dijkstraSnapshot(progress);
  const action = describeProgress(progress);
  const extractPulse = (progress.currentExtract !== null && progress.extractProg < 1)
    ? Math.sin(progress.extractProg * Math.PI) : 0;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <GraphLayer G={G} snap={snap} extractPulse={extractPulse}/>
      {action && (
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.actionFont}
              fill={action.accent} letterSpacing="0.10em">
          {action.text}
        </text>
      )}
      <text x={G.svgW / 2} y={G.hintY}
            textAnchor="middle" fontFamily="var(--font-sans)"
            fontStyle="italic"
            fontSize={G.hintFont} fill="var(--chalk-300)">
        ikke kortere? — la verdien stå.
      </text>
    </svg>
  );
}

// ─── Beat 6: Takeaway ──────────────────────────────────────────────────────
// Final tree lit amber on dim graph, payoff text + complexity.
function TakeawayBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const at = (f) => f * T;

  // Tree edges light in order S→A, A→B, B→C, B→D, C→E.
  const TREE_ORDER = TREE_EDGES;
  const PER_EDGE = 0.10;
  const treeT = TREE_ORDER.map((_, k) =>
    clamp((localTime - at(0.05 + k * PER_EDGE)) / 0.5, 0, 1)
  );

  // Final distances (all amber).
  const FINAL_DIST = { S: 0, A: 2, B: 3, C: 6, D: 7, E: 7 };

  // Payoff caption + formula fade in once the tree has landed.
  const captionT = clamp((localTime - at(0.40)) / 0.6, 0, 1);
  const formulaT = clamp((localTime - at(0.62)) / 0.5, 0, 1);

  // Build the snapshot so we can reuse GraphLayer styling.
  const snap = {
    dist: FINAL_DIST,
    nodeState: { S: 'source', A: 'settled', B: 'settled',
                 C: 'settled', D: 'settled', E: 'settled' },
    extractingId: null,
    activeRelaxEdge: null,
    activeRelaxFail: false,
    activeTicker: null,
  };

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        {/* Non-tree edges dim. */}
        {EDGES.map(([a, b, w], k) => {
          if (edgeIsTree(a, b)) return null;
          return (
            <GraphEdge key={`e${k}`} G={G}
              p1={G.nodes[a]} p2={G.nodes[b]} weight={w}
              state="idle" dim={true} draw={1}/>
          );
        })}
        {/* Tree edges light in order. */}
        {TREE_ORDER.map(([a, b], k) => {
          const t = treeT[k];
          if (t <= 0) return null;
          // Match the original EDGES weight.
          const w = (EDGES.find(([u, v]) => (u === a && v === b) || (u === b && v === a)) || [,,'?'])[2];
          return (
            <GraphEdge key={`te${k}`} G={G}
              p1={G.nodes[a]} p2={G.nodes[b]} weight={w}
              state="tree" draw={t}/>
          );
        })}
        {/* All nodes at their final distance. */}
        {NODE_IDS.map((id) => {
          const p = G.nodes[id];
          const state = snap.nodeState[id];
          return (
            <GraphNode key={`n${id}`} G={G}
              id={id} x={p.x} y={p.y}
              dist={FINAL_DIST[id]}
              state={state}/>
          );
        })}

        {/* Caption + formula sit in the same band as the action strip. */}
        <g opacity={captionT}>
          <text x={G.svgW / 2} y={G.actionY}
                textAnchor="middle"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={portrait ? 22 : 24}
                fill="var(--chalk-100)">
            N&aelig;rmest f&oslash;rst &mdash; s&aring; er den ferdig.
          </text>
        </g>
        <g opacity={formulaT}>
          <text x={G.svgW / 2} y={G.formulaY}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize={portrait ? 19 : 22}
                fill="var(--amber-300)" letterSpacing="0.08em">
            Dijkstra &isin; O((n + m) log n)
          </text>
        </g>
      </svg>
    </>
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
