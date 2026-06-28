// Ford-Fulkerson: send flyt langs forsterkende stier — Manimo lesson scene.
// Chapter 12 of algdat (Maksimal flyt). Ford-Fulkerson finds the maximum
// flow from a source S to a sink T by repeatedly searching for an
// "augmenting path" — any S→T path where every edge still has residual
// capacity — and pushing flow equal to the bottleneck capacity along it.
// Four nodes S, A, B, T and five directed edges. Three augmenting passes:
//   1. S→A→T sends 4 (saturates A→T)
//   2. S→B→T sends 6 (saturates S→B)
//   3. S→A→B→T sneaks past the locked A→T using A→B to deliver 2 more.
// Max flow = 12 (matches min-cut at {A→T, B→T} = 4 + 8).
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10   Manimo hook
//   10–18   Nettverket: 4 nodes + 5 directed edges + flow/cap labels
//   18–34   To enkle stier (GENUINE MOTION — teal chip walks S→A→T then
//                S→B→T; flow numerators tick from old to new on the path
//                edges; saturated edges turn amber)
//   34–51   Tredje sti (GENUINE MOTION — A→T locked amber, chip reroutes
//                through A→B; three flow counters tick simultaneously,
//                total counter 10→12)
//   51–60   Takeaway — maks flyt = 12 + recurrence summary
//
// Colour discipline:
//   chalk-100  vertex letters, payoff text
//   chalk-200  edge labels, body captions
//   chalk-300  idle edges, eyebrow text
//   amber-400  saturated edges, settled source/sink rings
//   amber-300  flow counters, total flow value, payoff highlights
//   teal-400   active path edges, chip color, bottleneck pill
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 72;

const NARRATION = [
  /*  0–10 */ 'Du har et nett av rør, og hver kant har en kapasitet. Hvor mye flyt kan du sende fra kilden helt fram til sluket?',
  /* 10–18 */ 'Vi har en kilde S, et sluk T, og to mellomstasjoner A og B. På hver kant står det flyt skråstrek kapasitet. Til å begynne med er all flyt null.',
  /* 18–34 */ 'Vi leter etter en sti fra S til T der det er plass igjen på hver kant. S til A til T går fint — flaskehalsen er fire. Send fire enheter, og A til T er metta. Så finner vi S til B til T. Flaskehalsen her er seks. Send seks, og S til B blir metta. Total flyt er nå ti.',
  /* 34–51 */ 'Vi er ikke ferdige. A til T er metta, men S til A er åpen enda, og A til B er åpen, og B til T har plass til to enheter. Vi sniker forbi flaskehalsen — S, A, B, T — og sender to enheter. Total flyt er nå tolv.',
  /* 51–60 */ 'Nå finnes ingen sti fra S til T med ledig plass. Total flyt er tolv enheter, og det er det maksimale. Så lenge det finnes en forsterkende sti, send flaskehalsen — så er Ford-Fulkerson ferdig.',
];

const NARRATION_AUDIO = 'audio/ford-fulkerson-augment/scene.mp3';

// ─── Graph data ────────────────────────────────────────────────────────────
const NODE_IDS = ['S', 'A', 'B', 'T'];

const EDGES = [
  { id: 'SA', u: 'S', v: 'A', cap: 10 },
  { id: 'SB', u: 'S', v: 'B', cap: 6  },
  { id: 'AB', u: 'A', v: 'B', cap: 3  },
  { id: 'AT', u: 'A', v: 'T', cap: 4  },
  { id: 'BT', u: 'B', v: 'T', cap: 8  },
];
const EDGE_BY_ID = Object.fromEntries(EDGES.map(e => [e.id, e]));

// Augmenting paths in execution order.
//   Step 0: S→A→T, bottleneck 4
//   Step 1: S→B→T, bottleneck 6
//   Step 2: S→A→B→T, bottleneck 2 (limited by A→B = 3 and remaining B→T = 2)
const PATHS = [
  { nodes: ['S', 'A', 'T'],      edges: ['SA', 'AT'],       bottleneck: 4 },
  { nodes: ['S', 'B', 'T'],      edges: ['SB', 'BT'],       bottleneck: 6 },
  { nodes: ['S', 'A', 'B', 'T'], edges: ['SA', 'AB', 'BT'], bottleneck: 2 },
];

// Flow on each edge after step k. Step 0 = before any augment.
const FLOW_AT_STEP = [
  { SA: 0, SB: 0, AB: 0, AT: 0, BT: 0 },
  { SA: 4, SB: 0, AB: 0, AT: 4, BT: 0 },
  { SA: 4, SB: 6, AB: 0, AT: 4, BT: 6 },
  { SA: 6, SB: 6, AB: 2, AT: 4, BT: 8 },
];

const TOTAL_AT_STEP = [0, 4, 10, 12];

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    const nodes = {
      S: { x: 360, y: 280 },
      A: { x: 180, y: 620 },
      B: { x: 540, y: 620 },
      T: { x: 360, y: 960 },
    };
    return {
      portrait: true,
      svgW: 720, svgH: 1280,
      nodes,
      center: { x: 360, y: 620 },
      nodeR: 38, edgeStroke: 2.0, arrowHead: 11,
      letterFont: 26, flowFont: 16, flowBoxW: 56, flowBoxH: 22, flowOffset: 28,
      eyebrowY: 240, eyebrowFont: 11,
      totalCounterX: 360, totalCounterY: 1110, totalFont: 24,
      bottleneckX: 360, bottleneckY: 1170, bottleneckFont: 18,
      actionY: 1230, actionFont: 16,
    };
  }
  const nodes = {
    S: { x: 220, y: 380 },
    A: { x: 640, y: 175 },
    B: { x: 640, y: 585 },
    T: { x: 1070, y: 380 },
  };
  return {
    portrait: false,
    svgW: 1280, svgH: 720,
    nodes,
    center: { x: 640, y: 380 },
    nodeR: 38, edgeStroke: 2.0, arrowHead: 12,
    letterFont: 28, flowFont: 16, flowBoxW: 58, flowBoxH: 22, flowOffset: 30,
    eyebrowY: 108, eyebrowFont: 11,
    totalCounterX: 640, totalCounterY: 670, totalFont: 24,
    bottleneckX: 940, bottleneckY: 175, bottleneckFont: 19,
    actionY: 700, actionFont: 15,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Place a flow/cap label outward from the diamond's centre. The AB edge sits
// AT the centre so it falls back to a fixed offset.
function labelPosForEdge(G, edge) {
  const p1 = G.nodes[edge.u], p2 = G.nodes[edge.v];
  const mx = (p1.x + p2.x) / 2;
  const my = (p1.y + p2.y) / 2;
  let dx = mx - G.center.x, dy = my - G.center.y;
  let len = Math.hypot(dx, dy);
  if (len < 8) { dx = 1; dy = 0; len = 1; }
  return { x: mx + (dx / len) * G.flowOffset, y: my + (dy / len) * G.flowOffset };
}

// ─── GraphNode ─────────────────────────────────────────────────────────────
// state: 'idle' | 'on-path' | 'anchor' (source/sink ring)
function GraphNode({ G, id, x, y, state = 'idle' }) {
  const border =
    state === 'on-path' ? 'var(--teal-400)' :
    state === 'anchor'  ? 'var(--amber-400)' :
    'rgba(232,220,193,0.32)';
  const { bgFill, bgOpacity } =
    state === 'on-path' ? { bgFill: 'var(--teal-400)',  bgOpacity: 0.14 } :
    state === 'anchor'  ? { bgFill: 'var(--amber-400)', bgOpacity: 0.10 } :
    { bgFill: 'rgba(0,0,0,0.55)', bgOpacity: 1 };
  const letterColor = state === 'idle' ? 'var(--chalk-200)' : 'var(--chalk-100)';
  return (
    <g>
      <circle cx={x} cy={y} r={G.nodeR}
              fill={bgFill} fillOpacity={bgOpacity}
              stroke={border} strokeWidth={2}/>
      <text x={x} y={y + G.letterFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.letterFont} fill={letterColor}>
        {id}
      </text>
    </g>
  );
}

// ─── GraphEdge ─────────────────────────────────────────────────────────────
// A directed edge with an arrowhead at the target end and a "flow/cap" label
// floating to its outward side. Trace-in via `draw` (0..1).
//   state: 'idle' | 'on-path' | 'saturated'
function GraphEdge({ G, edge, flow, state = 'idle', draw = 1 }) {
  const p1 = G.nodes[edge.u], p2 = G.nodes[edge.v];
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // Trim to node perimeters.
  const startX = p1.x + ux * G.nodeR;
  const startY = p1.y + uy * G.nodeR;
  const endX   = p2.x - ux * (G.nodeR + 2);
  const endY   = p2.y - uy * (G.nodeR + 2);
  // Arrowhead triangle at the end.
  const hs = G.arrowHead;
  const nx = -uy, ny = ux;
  const leftX  = endX - ux * hs + nx * (hs * 0.55);
  const leftY  = endY - uy * hs + ny * (hs * 0.55);
  const rightX = endX - ux * hs - nx * (hs * 0.55);
  const rightY = endY - uy * hs - ny * (hs * 0.55);

  const stroke =
    state === 'on-path'  ? 'var(--teal-400)' :
    state === 'saturated' ? 'var(--amber-400)' :
    'rgba(232,220,193,0.34)';
  const width =
    state === 'on-path' || state === 'saturated' ? 3.0 : G.edgeStroke;

  const d = clamp(draw, 0, 1);
  const visibleLen = Math.hypot(endX - startX, endY - startY);

  const labelColor =
    state === 'saturated' ? 'var(--amber-300)' :
    state === 'on-path'   ? 'var(--teal-400)' :
    'var(--chalk-200)';
  const lp = labelPosForEdge(G, edge);

  return (
    <g>
      <line x1={startX} y1={startY} x2={endX} y2={endY}
            stroke={stroke} strokeWidth={width}
            strokeLinecap="round"
            strokeDasharray={visibleLen}
            strokeDashoffset={(1 - d) * visibleLen}/>
      {d > 0.9 && (
        <path d={`M ${endX} ${endY} L ${leftX} ${leftY} L ${rightX} ${rightY} Z`}
              fill={stroke} stroke="none"/>
      )}
      <g opacity={d > 0.55 ? 1 : 0}>
        <rect x={lp.x - G.flowBoxW / 2} y={lp.y - G.flowBoxH / 2}
              width={G.flowBoxW} height={G.flowBoxH} rx={6}
              fill="#0c0a1f" fillOpacity={0.94}
              stroke="rgba(232,220,193,0.18)" strokeWidth={1}/>
        <text x={lp.x} y={lp.y + G.flowFont * 0.34}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={G.flowFont} fill={labelColor}>
          {`${flow} / ${edge.cap}`}
        </text>
      </g>
    </g>
  );
}

// ─── FlowChip ──────────────────────────────────────────────────────────────
// A teal dot that travels along a polyline (the augmenting path's node
// sequence). `frac` is 0..1, 0 = at first node, 1 = at last node.
function FlowChip({ G, pathNodes, frac, value }) {
  if (frac <= 0 || frac >= 1) return null;
  const pts = pathNodes.map(id => G.nodes[id]);
  const lens = [];
  let total = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i+1].x - pts[i].x, pts[i+1].y - pts[i].y);
    lens.push(l); total += l;
  }
  const targetD = frac * total;
  let acc = 0, x = pts[0].x, y = pts[0].y;
  for (let i = 0; i < lens.length; i++) {
    if (acc + lens[i] >= targetD) {
      const f = (targetD - acc) / lens[i];
      x = pts[i].x + f * (pts[i+1].x - pts[i].x);
      y = pts[i].y + f * (pts[i+1].y - pts[i].y);
      break;
    }
    acc += lens[i];
  }
  return (
    <g>
      <circle cx={x} cy={y} r={20} fill="var(--teal-400)" opacity={0.22}/>
      <circle cx={x} cy={y} r={11} fill="var(--teal-400)" opacity={0.96}/>
      {value !== undefined && (
        <text x={x} y={y + 5}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={13} fill="#0c0a1f">
          {value}
        </text>
      )}
    </g>
  );
}

// ─── Total-flow counter ────────────────────────────────────────────────────
function TotalCounter({ G, value, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <text x={G.totalCounterX} y={G.totalCounterY}
            textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={G.totalFont}
            fill="var(--amber-300)" letterSpacing="0.08em">
        {`total flyt = ${value}`}
      </text>
    </g>
  );
}

// ─── Bottleneck pill ───────────────────────────────────────────────────────
function BottleneckPill({ G, value, opacity = 1 }) {
  if (opacity <= 0) return null;
  const w = 150, h = 36;
  const x = G.bottleneckX - w / 2;
  const y = G.bottleneckY - h / 2;
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={w} height={h} rx={10}
            fill="var(--teal-400)" fillOpacity={0.14}
            stroke="var(--teal-400)" strokeWidth={1.5}/>
      <text x={G.bottleneckX} y={G.bottleneckY + G.bottleneckFont * 0.34}
            textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={G.bottleneckFont}
            fill="var(--teal-400)" letterSpacing="0.08em">
        {`flaskehals = ${value}`}
      </text>
    </g>
  );
}

// ─── Compute edge / flow / counter / chip state for a given augment step ──
// step:    integer 0..PATHS.length-1 (which augmenting path we're inside)
// prog:    0..1 progress within that step
// Returns: { flowFor(eid), stateFor(eid), totalFlow, chipFrac, bottlenecks,
//           anchorFor(id) }
function augmentSnapshot(step, prog) {
  const PHASE_HL_END = 0.32;
  const PHASE_CM_END = 0.62;

  const oldFlows = FLOW_AT_STEP[step];
  const newFlows = FLOW_AT_STEP[step + 1];
  const path     = PATHS[step];
  const onPath   = (eid) => path.edges.includes(eid);

  const flowFor = (eid) => {
    const oldF = oldFlows[eid];
    const newF = newFlows[eid];
    if (!onPath(eid) || prog < PHASE_HL_END) return oldF;
    if (prog < PHASE_CM_END) {
      const t = (prog - PHASE_HL_END) / (PHASE_CM_END - PHASE_HL_END);
      return Math.round(oldF + easeInOutCubic(t) * (newF - oldF));
    }
    return newF;
  };

  const stateFor = (eid) => {
    const cap = EDGE_BY_ID[eid].cap;
    if (onPath(eid)) {
      if (prog < PHASE_HL_END)  return 'on-path';
      if (prog < PHASE_CM_END)  return 'on-path';
      // HOLD: settle. Saturated path edges go amber; others go back to idle.
      return newFlows[eid] >= cap ? 'saturated' : 'idle';
    }
    return oldFlows[eid] >= cap ? 'saturated' : 'idle';
  };

  const oldT = TOTAL_AT_STEP[step];
  const newT = TOTAL_AT_STEP[step + 1];
  let totalFlow = oldT;
  if (prog >= PHASE_HL_END && prog < PHASE_CM_END) {
    const t = (prog - PHASE_HL_END) / (PHASE_CM_END - PHASE_HL_END);
    totalFlow = Math.round(oldT + easeInOutCubic(t) * (newT - oldT));
  } else if (prog >= PHASE_CM_END) {
    totalFlow = newT;
  }

  let chipFrac = 0;
  if (prog < PHASE_HL_END) {
    chipFrac = clamp(prog / PHASE_HL_END, 0, 1);
  } else if (prog < PHASE_CM_END) {
    chipFrac = 0; // chip already at T, hide
  }

  let bottleneckOpacity = 0;
  if (prog < 0.06) bottleneckOpacity = prog / 0.06;
  else if (prog < PHASE_CM_END - 0.04) bottleneckOpacity = 1;
  else if (prog < PHASE_CM_END + 0.06) {
    bottleneckOpacity = 1 - (prog - (PHASE_CM_END - 0.04)) / 0.10;
  }

  return {
    flowFor, stateFor, totalFlow, chipFrac,
    bottleneckOpacity: clamp(bottleneckOpacity, 0, 1),
    onPathNodes: new Set(path.nodes),
    onPath,
    path,
  };
}

// "Resting" snapshot — no active step, everything at FLOW_AT_STEP[idx].
function restingSnapshot(idx) {
  const flows = FLOW_AT_STEP[idx];
  return {
    flowFor: (eid) => flows[eid],
    stateFor: (eid) => flows[eid] >= EDGE_BY_ID[eid].cap ? 'saturated' : 'idle',
    totalFlow: TOTAL_AT_STEP[idx],
    chipFrac: 0,
    bottleneckOpacity: 0,
    onPathNodes: new Set(),
    onPath: () => false,
    path: null,
  };
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="maksimal flyt"
      title="Ford-Fulkerson: send flyt langs forsterkende stier"
      duration={SCENE_DURATION}
      introEnd={9}
      introCaption="En forsterkende sti om gangen — helt til ingen finnes."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9} end={20.36}>
        <NetworkBeat/>
      </Sprite>

      <Sprite start={20.36} end={41.34}>
        <TwoEasyPathsBeat/>
      </Sprite>

      <Sprite start={41.34} end={56.96}>
        <ThirdPathBeat/>
      </Sprite>

      <Sprite start={56.96} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Nettverket ────────────────────────────────────────────────────
// Nodes fade in (S and T first as anchors, then A and B), then directed
// edges trace in with their flow/cap labels. A small "flyt / kapasitet"
// eyebrow lands top-centre once the graph has settled.
function NetworkBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const at = (f) => f * T;

  const nodeAt = { S: 0.03, T: 0.07, A: 0.12, B: 0.16 };
  const nodeVis = (id) => clamp((localTime - at(nodeAt[id])) / 0.45, 0, 1);

  const edgeAt = { SA: 0.18, SB: 0.24, AT: 0.30, BT: 0.36, AB: 0.42 };
  const edgeDraw = (eid) => clamp((localTime - at(edgeAt[eid])) / 0.55, 0, 1);

  const eyebrowT = clamp((localTime - at(0.55)) / 0.45, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Edges first (under nodes). */}
      {EDGES.map((e) => {
        const draw = edgeDraw(e.id);
        if (draw <= 0) return null;
        return (
          <GraphEdge key={e.id} G={G} edge={e}
            flow={0} state="idle" draw={draw}/>
        );
      })}
      {/* Nodes. S and T as anchors (amber ring), A and B idle. */}
      {NODE_IDS.map((id) => {
        const vis = nodeVis(id);
        if (vis <= 0) return null;
        const p = G.nodes[id];
        const state = (id === 'S' || id === 'T') ? 'anchor' : 'idle';
        return (
          <g key={id} opacity={vis}>
            <GraphNode G={G} id={id} x={p.x} y={p.y} state={state}/>
          </g>
        );
      })}
      {/* Eyebrow text. */}
      <g opacity={eyebrowT}>
        <text x={G.svgW / 2} y={G.eyebrowY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.eyebrowFont}
              fill="var(--chalk-300)" letterSpacing="0.22em">
          flyt / kapasitet
        </text>
      </g>
    </svg>
  );
}

// ─── Beat 3: To enkle stier (GENUINE MOTION) ──────────────────────────────
// Walks steps 0 and 1 back-to-back. Each step: HL phase chip travels along
// the path, CM phase flow numerators tick, HD phase saturated edges turn
// amber.
function TwoEasyPathsBeat() {
  return <AugmentWalker startStep={0} stepCount={2}/>;
}

// ─── Beat 4: Tredje sti (GENUINE MOTION) ──────────────────────────────────
// The punchline beat. Step 2 alone — chip routes through A→B because A→T is
// saturated. Longer than a single step usually gets so the new path reads.
function ThirdPathBeat() {
  return <AugmentWalker startStep={2} stepCount={1}/>;
}

// Shared walker — handles N consecutive augmenting steps.
function AugmentWalker({ startStep, stepCount }) {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();

  const T = Math.max(duration - 0.4, 1);
  const INTRO = 0.04 * T;
  const OUTRO = 0.06 * T;
  const stepLen = Math.max(0.001, (T - INTRO - OUTRO) / stepCount);

  // Resolve the current step + progress.
  let snap;
  let curStep = -1;
  if (localTime < INTRO) {
    snap = restingSnapshot(startStep);
  } else if (localTime >= INTRO + stepLen * stepCount) {
    snap = restingSnapshot(startStep + stepCount);
  } else {
    const idxInRun = Math.floor((localTime - INTRO) / stepLen);
    const stepProg = ((localTime - INTRO) - idxInRun * stepLen) / stepLen;
    curStep = startStep + idxInRun;
    snap = augmentSnapshot(curStep, clamp(stepProg, 0, 1));
  }

  // Edge label position for the bottleneck pill — anchor on current path's
  // first edge midpoint? Simpler: use a fixed location from G.
  let bnPos = { x: G.bottleneckX, y: G.bottleneckY };

  // Per-step action caption.
  let actionText = '';
  if (curStep >= 0) {
    const p = PATHS[curStep];
    actionText = `forsterkende sti: ${p.nodes.join(' → ')}`;
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Edges. */}
      {EDGES.map((e) => (
        <GraphEdge key={e.id} G={G} edge={e}
          flow={snap.flowFor(e.id)}
          state={snap.stateFor(e.id)}
          draw={1}/>
      ))}

      {/* Nodes — source/sink always anchor; intermediates light teal if on
          the current path during HL/CM phases. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        let state = 'idle';
        if (id === 'S' || id === 'T') state = 'anchor';
        if (snap.onPathNodes.has(id) && (id === 'A' || id === 'B')) state = 'on-path';
        return (
          <GraphNode key={id} G={G} id={id} x={p.x} y={p.y} state={state}/>
        );
      })}

      {/* Bottleneck pill near the current path. */}
      {snap.bottleneckOpacity > 0 && curStep >= 0 && (
        <BottleneckPill G={G}
          value={PATHS[curStep].bottleneck}
          opacity={snap.bottleneckOpacity}/>
      )}

      {/* Flow chip travelling along the path during HL phase. */}
      {curStep >= 0 && snap.chipFrac > 0 && (
        <FlowChip G={G}
          pathNodes={PATHS[curStep].nodes}
          frac={snap.chipFrac}
          value={PATHS[curStep].bottleneck}/>
      )}

      {/* Total counter. */}
      <TotalCounter G={G} value={snap.totalFlow}/>

      {/* Action caption beneath the canvas. */}
      <text x={G.svgW / 2} y={G.actionY}
            textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={G.actionFont}
            fill="var(--teal-400)" letterSpacing="0.10em">
        {actionText}
      </text>
    </svg>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
// Saturated min-cut edges (A→T and B→T) glow amber; the others stand idle.
// Total flow = 12 lands as the payoff with the recurrence summary below.
function TakeawayBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.3, 1);
  const at = (f) => f * T;

  const finalFlows = FLOW_AT_STEP[FLOW_AT_STEP.length - 1];

  const captionT = clamp((localTime - at(0.10)) / 0.4, 0, 1);
  const totalT   = clamp((localTime - at(0.32)) / 0.4, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>

      {/* Edges with their final flow values. */}
      {EDGES.map((e) => {
        const flow = finalFlows[e.id];
        const state = flow >= e.cap ? 'saturated' : 'idle';
        return (
          <GraphEdge key={e.id} G={G} edge={e}
            flow={flow} state={state} draw={1}/>
        );
      })}

      {/* All four nodes settled. */}
      {NODE_IDS.map((id) => {
        const p = G.nodes[id];
        const state = (id === 'S' || id === 'T') ? 'anchor' : 'idle';
        return (
          <GraphNode key={id} G={G} id={id} x={p.x} y={p.y} state={state}/>
        );
      })}

      {/* Payoff caption. */}
      <g opacity={captionT}>
        <text x={G.svgW / 2} y={portrait ? 1078 : 657}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 24 : 24}
              fill="var(--chalk-100)">
          Send flaskehalsen — så lenge stien finnes.
        </text>
      </g>

      {/* Total max flow. */}
      <g opacity={totalT}>
        <text x={G.svgW / 2} y={portrait ? 1148 : 695}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={portrait ? 24 : 26}
              fill="var(--amber-300)" letterSpacing="0.10em">
          maks flyt = 12
        </text>
      </g>
    </svg>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export).
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
