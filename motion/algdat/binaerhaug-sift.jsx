// Binærhaug: sift opp — Manimo lesson scene.
// Chapter 5 of algdat (Hauger og binære søketrær). A binary max-heap is one
// object viewed two ways: a tree where every parent ≥ its children, and a
// flat array where parent(i) = (i-1)//2. Insert a new value at the end of
// the array — then sift-up: while the new value is greater than its parent,
// swap them. The classic O(log n) climb.
//
// Beats (placeholder timings — rewire-scene.js overwrites after audio):
//    0– 9     Manimo hook
//    9–25     Dual view: tree on the left, array on the right (GENUINE MOTION —
//             parent-pulse + dotted index correspondence lines)
//   25–50     Sift opp: insert 90 at slot 7, three swaps bubble it to the
//             root (GENUINE MOTION — node glides up the tree, cells swap
//             in the array, compare badge updates per step)
//   50–58     Why log n — the sift path = tree height; height = log₂ n
//   58–66     Takeaway (innsetting + uttak = O(log n))
//
// Colour discipline:
//   chalk-100  cell + node values
//   chalk-300  index labels, axis text, dim hints
//   amber-400  active swap edge, current sifting node, primary stroke
//   amber-300  output / payoff values, comparison badge, sift trail
//   rose-400   the comparison "loser" — the parent being passed
//   teal-400   the heap property pulse on each parent
//   violet-400 dotted correspondence lines (array slot ↔ tree node)
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 64;

const NARRATION = [
  /*  0– 9  */ 'Du har en stadig voksende haug med tall, og du vil hele tiden vite det største. Kan du det uten å sortere alt på nytt? En binærhaug klarer det.',
  /*  9–25  */ 'En binærhaug er det samme objektet sett på to måter. Som et tre der hver forelder er større enn barna, og som en flat liste der forelderen til celle i ligger på i minus en delt på to. Toppen av treet er alltid det største tallet.',
  /* 25–50  */ 'Sett inn nitti nederst i lista. Større enn forelderen femten? Bytt. Større enn forelderen tjue? Bytt. Større enn rota femtifem? Bytt. Tre bytter, og nitti står på toppen.',
  /* 50–58  */ 'Hvor mange bytter måtte vi gjøre? Aldri flere enn høyden på treet. Et tre med n celler har høyde log to av n. Sift opp koster orden log n.',
  /* 58–66  */ 'Det er trikset. Hver innsetting, hvert største-uttak, alt for orden log n. Selv med en million tall — bare tjue nivåer å klatre.',
];

const NARRATION_AUDIO = 'audio/binaerhaug-sift/scene.mp3';

// ─── Heap data ─────────────────────────────────────────────────────────────
// Valid max-heap of 7 elements. Slot 7 is the empty insertion target.
const INITIAL_HEAP = [55, 20, 50, 15, 18, 40, 45];
const INSERT_VALUE = 90;

// Pre-computed sift trace. Each entry is one swap step that exchanges
// the current sifting slot with its parent. After the three swaps the
// value 90 reaches the root.
//
//   step 0: slot 7 ↔ 3  (90 vs 15)
//   step 1: slot 3 ↔ 1  (90 vs 20)
//   step 2: slot 1 ↔ 0  (90 vs 55)
const SIFT_STEPS = [
  { from: 7, to: 3, child: 90, parent: 15 },
  { from: 3, to: 1, child: 90, parent: 20 },
  { from: 1, to: 0, child: 90, parent: 55 },
];

// Array snapshot at the end of each swap step (after applying that step).
// Index 0 = pre-insertion + 90 placed at slot 7 (no swap yet).
function arrayAfterSteps(stepsApplied) {
  const a = [...INITIAL_HEAP, INSERT_VALUE];      // [55, 20, 50, 15, 18, 40, 45, 90]
  for (let s = 0; s < stepsApplied; s++) {
    const { from, to } = SIFT_STEPS[s];
    [a[from], a[to]] = [a[to], a[from]];
  }
  return a;
}

// Slot of value v at the given step count. Used to interpolate node positions
// during a swap.
function slotOfValueAt(v, stepsApplied) {
  return arrayAfterSteps(stepsApplied).indexOf(v);
}

// Parent of array slot i in the implicit tree.
function parentOf(i) {
  return Math.floor((i - 1) / 2);
}

// Depth (row) of slot i in the tree — slot 0 is depth 0, slots 1..2 depth 1,
// slots 3..6 depth 2, slot 7 depth 3.
function depthOf(i) {
  return Math.floor(Math.log2(i + 1));
}

// Column position (0..2^depth - 1) of slot i within its depth row.
function colOf(i) {
  const d = depthOf(i);
  return i - (Math.pow(2, d) - 1);
}

// ─── Geometry ──────────────────────────────────────────────────────────────
// Both aspects share the same tree + array vocabulary; portrait stacks them
// vertically, landscape places tree-left / array-right.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      // Tree on top half.
      treeCx: 360, treeTopY: 280, rowH: 130,
      nodeR: 30, edgeStroke: 1.5,
      valueFont: 22, indexFont: 12,
      // Array along middle.
      arrayY: 760, arrayCell: 60, arrayPitch: 70,
      arrayLeftX: 60,                              // 8 * 70 = 560; (720-560)/2=80, but nudge for breathing room
      arrayIndexFont: 11,
      // Caption + badge.
      badgeX: 60, badgeY: 920, badgeW: 600,
      formulaY: 1130,
      arrow: { stroke: 1.0, opacity: 0.32 },
    };
  }
  return {
    svgW: 1280, svgH: 720,
    // Tree on left half.
    treeCx: 350, treeTopY: 180, rowH: 105,
    nodeR: 30, edgeStroke: 1.5,
    valueFont: 20, indexFont: 11,
    // Array on right half.
    arrayY: 280, arrayCell: 48, arrayPitch: 56,
    arrayLeftX: 720,
    arrayIndexFont: 11,
    // Badge below the array.
    badgeX: 720, badgeY: 460, badgeW: 460,
    formulaY: 600,
    arrow: { stroke: 1.0, opacity: 0.28 },
  };
}

// Tree node centre for slot i. Each row's nodes are evenly spaced symmetrically
// around treeCx. Spread tightens with depth so the bottom row fits.
function treeNodeCentre(G, i) {
  const d = depthOf(i);
  const cols = Math.pow(2, d);
  const col = colOf(i);
  // Horizontal pitch shrinks each row so the bottom row stays inside the canvas.
  // G.treeWidth lets beats override the spread when they have more room
  // (e.g. HeightLogNBeat owns the whole canvas).
  const defaultWidth = G.portrait ? 560 : 540;
  const widthAtDepth = (cols === 1 ? 0 : (G.treeWidth ?? defaultWidth));
  const x = G.treeCx - widthAtDepth / 2 + (cols === 1 ? 0 : col * (widthAtDepth / (cols - 1)));
  const y = G.treeTopY + d * G.rowH;
  return { x, y };
}

// Array cell origin (top-left) for slot i.
function arrayCellTL(G, i) {
  return { x: G.arrayLeftX + i * G.arrayPitch, y: G.arrayY };
}
function arrayCellCentre(G, i) {
  return { x: G.arrayLeftX + i * G.arrayPitch + G.arrayCell / 2, y: G.arrayY + G.arrayCell / 2 };
}

// ─── Easings ───────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Tree node ─────────────────────────────────────────────────────────────
// state: 'idle' | 'active' (currently sifting) | 'root' (the 'winner' at top)
//        | 'parent' (the value being beaten on the current step)
//        | 'pulse' (heap-property check pulse)
function TreeNode({ G, cx, cy, value, state = 'idle', pulse = 0 }) {
  const border =
    state === 'active' ? 'var(--amber-400)' :
    state === 'root' ? 'var(--amber-300)' :
    state === 'parent' ? 'var(--rose-400)' :
    state === 'pulse' ? 'var(--teal-400)' :
    'rgba(232,220,193,0.30)';
  const bg =
    state === 'active' ? 'rgba(244,184,96,0.16)' :
    state === 'root' ? 'rgba(244,184,96,0.16)' :
    state === 'parent' ? 'rgba(232,122,144,0.10)' :
    'rgba(0,0,0,0.50)';
  const rOut = G.nodeR + pulse * 8;
  return (
    <g>
      {pulse > 0 && (
        <circle cx={cx} cy={cy} r={rOut} fill="none"
                stroke="var(--teal-400)" strokeWidth={1.5}
                opacity={Math.max(0, 1 - pulse) * 0.5}/>
      )}
      <circle cx={cx} cy={cy} r={G.nodeR}
              fill={bg} stroke={border} strokeWidth={1.5}/>
      <text x={cx} y={cy + G.valueFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.valueFont} fill="var(--chalk-100)">
        {value}
      </text>
    </g>
  );
}

// Edge between a parent and child. `highlight` makes it part of the sift trail.
function TreeEdge({ G, x1, y1, x2, y2, highlight = false, draw = 1 }) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  const d = clamp(draw, 0, 1);
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke={highlight ? 'var(--amber-300)' : 'rgba(232,220,193,0.32)'}
          strokeWidth={highlight ? 2 : G.edgeStroke}
          strokeDasharray={len} strokeDashoffset={(1 - d) * len}/>
  );
}

// Array cell. state: 'idle' | 'empty' (dashed) | 'active' | 'placed'
//                    | 'parent' (the slot the sifter is comparing to)
function ArrayCell({ G, i, value, state = 'idle', opacity = 1 }) {
  const border =
    state === 'active' ? 'var(--amber-400)' :
    state === 'placed' ? 'var(--amber-300)' :
    state === 'parent' ? 'var(--rose-400)' :
    state === 'empty' ? 'rgba(232,220,193,0.22)' :
    'rgba(232,220,193,0.30)';
  const bg =
    state === 'active' ? 'rgba(244,184,96,0.14)' :
    state === 'placed' ? 'rgba(244,184,96,0.10)' :
    state === 'parent' ? 'rgba(232,122,144,0.10)' :
    'rgba(0,0,0,0.45)';
  const tl = arrayCellTL(G, i);
  const dash = state === 'empty' ? '5 5' : undefined;
  return (
    <g opacity={opacity}>
      <rect x={tl.x} y={tl.y} width={G.arrayCell} height={G.arrayCell} rx={8}
            fill={bg} stroke={border} strokeWidth={1.5} strokeDasharray={dash}/>
      {value !== undefined && value !== null && (
        <text x={tl.x + G.arrayCell / 2}
              y={tl.y + G.arrayCell / 2 + G.valueFont * 0.36}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={G.valueFont} fill="var(--chalk-100)">
          {value}
        </text>
      )}
      {/* Cell index above */}
      <text x={tl.x + G.arrayCell / 2} y={tl.y - 8}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.arrayIndexFont} fill="var(--chalk-300)"
            letterSpacing="0.10em">
        {i}
      </text>
    </g>
  );
}

// Subtle dotted line that links an array cell to its tree node — the
// "two views, one object" visual cue.
function CorrespondenceLine({ G, i, opacity = 1 }) {
  const a = arrayCellCentre(G, i);
  const t = treeNodeCentre({ ...G, portrait: G.portrait }, i);
  // Hand-route through a slight bend toward the array's top edge so the
  // dotted line doesn't visually cross too many tree edges.
  return (
    <line x1={a.x} y1={a.y - G.arrayCell / 2 - 2}
          x2={t.x} y2={t.y + G.nodeR + 2}
          stroke="var(--violet-400)" strokeWidth={G.arrow.stroke}
          strokeDasharray="3 5" opacity={opacity * G.arrow.opacity}/>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="hauger"
      title="Binærhaug: sift opp"
      duration={SCENE_DURATION}
      introEnd={9.25}
      introCaption="Hold alltid det største øverst."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.25} end={25.03}>
        <DualViewBeat/>
      </Sprite>

      <Sprite start={25.03} end={40.77}>
        <SiftOppBeat/>
      </Sprite>

      <Sprite start={40.77} end={52.42}>
        <HeightLogNBeat/>
      </Sprite>

      <Sprite start={52.42} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Dual view (tree + array side by side) ────────────────────────
// Genuine motion here is the *correspondence* itself: tree edges trace in
// row by row, the array cells fill in left to right matching the BFS order,
// dotted violet lines connect each cell to its node, and each parent pulses
// teal as the heap property is highlighted. The 8th cell is empty (dashed)
// — that's the slot the sifter will use in the next beat.
function DualViewBeat() {
  const portrait = usePortrait();
  const G = { ...layoutGeom(portrait), portrait };
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Schedule:
  //   0.00–0.20  Tree row 0 (root)
  //   0.20–0.40  Tree rows 1–2 trace in
  //   0.40–0.65  Array cells fill left to right
  //   0.55–0.85  Correspondence lines fade in (dotted)
  //   0.65–0.95  Heap-property pulse sweeps over each parent
  //   0.80–1.00  Parent-index formula appears
  const treeStart = at(0.00);
  const arrayStart = at(0.40);
  const correspStart = at(0.55);
  const pulseStart = at(0.65);
  const formulaStart = at(0.82);

  // Which nodes are visible (by depth row).
  const treeRowVis = (d) => clamp((localTime - (treeStart + d * 0.10 * T)) / 0.6, 0, 1);

  // Array cell visibility (one per cell, staggered by 0.10 of T).
  const cellVis = (i) => clamp((localTime - (arrayStart + i * 0.03 * T)) / 0.5, 0, 1);

  // Correspondence line visibility (after the cell appears).
  const correspVis = (i) => clamp((localTime - (correspStart + i * 0.012 * T)) / 0.5, 0, 1);

  // Pulse intensity at each parent (slots 0, 1, 2) — runs as a sweep.
  // Each parent peaks once during the pulseStart..end window.
  const PARENTS_TO_PULSE = [0, 1, 2];
  function pulseAt(slot) {
    const order = PARENTS_TO_PULSE.indexOf(slot);
    if (order < 0) return 0;
    const center = pulseStart + order * 0.08 * T;
    const dist = Math.abs(localTime - center);
    const width = 0.45;
    return Math.max(0, 1 - dist / width);
  }

  // Heap-property checked? — used to keep the parent border teal during pulse.
  function nodeState(i) {
    if (PARENTS_TO_PULSE.includes(i) && pulseAt(i) > 0.05) return 'pulse';
    return 'idle';
  }

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>

        {/* Tree edges — drawn before nodes so they sit underneath. */}
        {INITIAL_HEAP.map((_, i) => {
          if (i === 0) return null;                            // root has no edge up
          const p = parentOf(i);
          const a = treeNodeCentre(G, p);
          const b = treeNodeCentre(G, i);
          const dRow = depthOf(i);
          return (
            <TreeEdge key={`e${i}`} G={G}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              draw={treeRowVis(dRow)}/>
          );
        })}

        {/* Tree nodes — one per slot in INITIAL_HEAP. */}
        {INITIAL_HEAP.map((v, i) => {
          const c = treeNodeCentre(G, i);
          const vis = treeRowVis(depthOf(i));
          if (vis <= 0) return null;
          return (
            <g key={`n${i}`} opacity={vis}>
              <TreeNode G={G} cx={c.x} cy={c.y} value={v}
                        state={nodeState(i)}
                        pulse={pulseAt(i)}/>
            </g>
          );
        })}

        {/* Tree caption / eyebrow */}
        <SvgFadeIn duration={0.5} delay={at(0.02)}>
          <text x={portrait ? G.svgW / 2 : G.treeCx} y={G.treeTopY - G.nodeR - 28}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={11}
                fill="var(--amber-300)" letterSpacing="0.16em">
            tre
          </text>
        </SvgFadeIn>

        {/* Array — 8 cells; cell 0..6 hold INITIAL_HEAP, cell 7 is the empty slot. */}
        {Array.from({ length: 8 }).map((_, i) => {
          const v = INITIAL_HEAP[i];
          const isEmpty = v === undefined;
          const vis = cellVis(i);
          if (vis <= 0) return null;
          return (
            <g key={`c${i}`} opacity={vis}>
              <ArrayCell G={G} i={i} value={v} state={isEmpty ? 'empty' : 'idle'}/>
            </g>
          );
        })}

        {/* Array caption / eyebrow */}
        <SvgFadeIn duration={0.5} delay={arrayStart + 0.05}>
          <text x={portrait ? G.svgW / 2 : G.arrayLeftX} y={G.arrayY - 28}
                textAnchor={portrait ? 'middle' : 'start'}
                fontFamily="var(--font-mono)" fontSize={11}
                fill="var(--amber-300)" letterSpacing="0.16em">
            liste
          </text>
        </SvgFadeIn>

        {/* Dotted correspondence lines (array slot ↔ tree node). */}
        {INITIAL_HEAP.map((_, i) => {
          const v = correspVis(i);
          if (v <= 0) return null;
          return <CorrespondenceLine key={`l${i}`} G={G} i={i} opacity={v}/>;
        })}

        {/* Parent-index formula */}
        <SvgFadeIn duration={0.5} delay={formulaStart}>
          <text x={G.svgW / 2} y={G.formulaY}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={portrait ? 22 : 22}
                fill="var(--amber-300)">
            forelder(i) = (i − 1) // 2
          </text>
        </SvgFadeIn>
      </svg>
    </>
  );
}

// ─── Beat 3: Sift opp (GENUINE MOTION — 90 bubbles to the root) ───────────
// Schedule across the sprite's working duration T (T = duration - 1):
//   0.00–0.10  90 lands in the empty slot 7 (insertion drop-in)
//   0.10–0.30  Step 1: compare with parent 15 → swap (slot 7 ↔ 3)
//   0.32–0.52  Step 2: compare with parent 20 → swap (slot 3 ↔ 1)
//   0.54–0.74  Step 3: compare with parent 55 → swap (slot 1 ↔ 0)
//   0.74–1.00  Hold on root; sift trail amber glow persists
//
// Each step has two sub-phases:
//   COMPARE  (≈ 0.04 T)  show "90 > 15 → bytt" badge, parent highlight rose
//   SWAP     (≈ 0.13 T)  glide value 90 along the edge to the parent slot,
//                        parent value slides into the vacated child slot
function SiftOppBeat() {
  const portrait = usePortrait();
  const G = { ...layoutGeom(portrait), portrait };
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Step schedules (fractions of T).
  const INSERT_END = 0.10;
  const STEP_TIMINGS = [
    { compareStart: 0.12, compareEnd: 0.18, swapStart: 0.18, swapEnd: 0.30 },
    { compareStart: 0.34, compareEnd: 0.40, swapStart: 0.40, swapEnd: 0.52 },
    { compareStart: 0.56, compareEnd: 0.62, swapStart: 0.62, swapEnd: 0.74 },
  ];

  // Determine which step we're in (0..3 — 3 means all done).
  let stepIdx = 0;
  for (let s = 0; s < SIFT_STEPS.length; s++) {
    if (localTime >= STEP_TIMINGS[s].swapEnd * T) stepIdx = s + 1;
  }
  const isInserting = localTime < INSERT_END * T;
  const sched = STEP_TIMINGS[Math.min(stepIdx, SIFT_STEPS.length - 1)];
  // Phase within the *current* step: 'idle' (before compare), 'compare', 'swap', 'done'.
  let phase = 'idle';
  if (!isInserting && stepIdx < SIFT_STEPS.length) {
    if (localTime < sched.compareStart * T) phase = 'idle';
    else if (localTime < sched.compareEnd * T) phase = 'compare';
    else if (localTime < sched.swapEnd * T) phase = 'swap';
    else phase = 'done';
  } else if (stepIdx >= SIFT_STEPS.length) {
    phase = 'done';
  }

  // Swap progress (0..1) within the current step.
  const swapT = (phase === 'swap')
    ? clamp((localTime - sched.swapStart * T) / Math.max(0.001, (sched.swapEnd - sched.swapStart) * T), 0, 1)
    : (phase === 'done' ? 1 : 0);
  const swapEased = easeInOutCubic(swapT);

  // Pre-step state (slots after `stepIdx` completed swaps).
  const baseArray = arrayAfterSteps(stepIdx);
  // Current sifting slot (where the 90 lives at this base state).
  const sifterSlot = baseArray.indexOf(INSERT_VALUE);
  const currentStep = stepIdx < SIFT_STEPS.length ? SIFT_STEPS[stepIdx] : null;

  // Insertion drop-in: 90 falls from above slot 7 into slot 7.
  const insertT = isInserting
    ? clamp(localTime / Math.max(0.001, INSERT_END * T), 0, 1)
    : 1;
  const insertY = isInserting ? -G.arrayCell * (1 - easeInOutCubic(insertT)) : 0;

  // For each *value* compute its current rendered (cellOriginI, treeNodeI)
  // accounting for in-flight swaps.
  function valueIsBeingMoved(v) {
    if (phase !== 'swap' || currentStep == null) return false;
    return v === INSERT_VALUE || v === currentStep.parent;
  }

  // Resolve where each value renders, interpolating during a swap.
  function valueRender(v) {
    const fromSlot = baseArray.indexOf(v);
    if (fromSlot < 0) return null;
    if (!valueIsBeingMoved(v)) {
      return { arrayPos: arrayCellCentre(G, fromSlot), treePos: treeNodeCentre(G, fromSlot), slot: fromSlot };
    }
    // During swap: 90 moves child→parent slot; parent moves parent→child slot.
    const isChild = v === INSERT_VALUE;
    const slotA = isChild ? currentStep.from : currentStep.to;
    const slotB = isChild ? currentStep.to : currentStep.from;
    const aA = arrayCellCentre(G, slotA);
    const aB = arrayCellCentre(G, slotB);
    const tA = treeNodeCentre(G, slotA);
    const tB = treeNodeCentre(G, slotB);
    return {
      arrayPos: { x: aA.x + (aB.x - aA.x) * swapEased, y: aA.y + (aB.y - aA.y) * swapEased },
      treePos:  { x: tA.x + (tB.x - tA.x) * swapEased, y: tA.y + (tB.y - tA.y) * swapEased },
      slot: fromSlot,
    };
  }

  // The 8-value canvas — original 7 + the insert. We render everyone
  // every frame; that keeps swap motion smooth.
  const ALL_VALUES = [...INITIAL_HEAP, INSERT_VALUE];

  // Sift trail: slots the 90 has visited so far (for the amber edge highlights).
  // Used to keep the climb visible after the swap.
  const trailSlots = new Set();
  trailSlots.add(7);
  for (let s = 0; s < stepIdx; s++) trailSlots.add(SIFT_STEPS[s].to);
  if (phase === 'swap' && currentStep) trailSlots.add(currentStep.to);

  // For the compare/swap badge.
  let badgeStep = 'sett inn';
  let badgeText = '90 lander i slot 7';
  let badgeAccent = 'var(--amber-300)';
  if (!isInserting) {
    if (stepIdx >= SIFT_STEPS.length) {
      badgeStep = 'ferdig';
      badgeText = '90 står på toppen';
    } else {
      const stp = SIFT_STEPS[stepIdx];
      badgeStep = `trinn ${stepIdx + 1} av ${SIFT_STEPS.length}`;
      if (phase === 'idle') {
        badgeText = `90 mot forelder ${stp.parent}?`;
      } else if (phase === 'compare') {
        badgeText = `90 > ${stp.parent} — bytt`;
        badgeAccent = 'var(--rose-400)';
      } else if (phase === 'swap') {
        badgeText = `bytter slot ${stp.from} og ${stp.to}`;
        badgeAccent = 'var(--amber-300)';
      } else {
        badgeText = `90 i slot ${stp.to}`;
      }
    }
  }

  // Determine the "parent" highlight slot (rose) during compare/swap.
  const highlightParentSlot = (!isInserting && stepIdx < SIFT_STEPS.length && (phase === 'compare' || phase === 'swap'))
    ? SIFT_STEPS[stepIdx].to
    : -1;

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>

        {/* Tree edges — non-trail edges first, then trail edges over. */}
        {ALL_VALUES.map((_, i) => {
          if (i === 0) return null;
          const p = parentOf(i);
          const a = treeNodeCentre(G, p);
          const b = treeNodeCentre(G, i);
          const highlight = trailSlots.has(i) && trailSlots.has(p);
          if (highlight) return null;
          return (
            <TreeEdge key={`e${i}`} G={G}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              draw={1}/>
          );
        })}
        {ALL_VALUES.map((_, i) => {
          if (i === 0) return null;
          const p = parentOf(i);
          if (!(trailSlots.has(i) && trailSlots.has(p))) return null;
          const a = treeNodeCentre(G, p);
          const b = treeNodeCentre(G, i);
          return (
            <TreeEdge key={`et${i}`} G={G}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              highlight={true} draw={1}/>
          );
        })}

        {/* Tree nodes — one per VALUE, at the (interpolated) position. */}
        {ALL_VALUES.map((v) => {
          const r = valueRender(v);
          if (r == null) return null;
          let state = 'idle';
          if (v === INSERT_VALUE) {
            if (stepIdx >= SIFT_STEPS.length) state = 'root';
            else state = 'active';
          } else if (r.slot === highlightParentSlot) {
            state = 'parent';
          }
          // For the inserted value during its drop-in, offset y by insertY.
          let cy = r.treePos.y;
          if (v === INSERT_VALUE && isInserting) cy = r.treePos.y + insertY;
          return (
            <TreeNode key={`tn${v}`} G={G}
              cx={r.treePos.x} cy={cy} value={v} state={state}/>
          );
        })}

        {/* Array cells. We render the cell *outlines* (no value) at slots 0..7
            so the array shape stays stable; then we paint values at the
            interpolated x/y of each VALUE. */}
        {Array.from({ length: 8 }).map((_, i) => {
          // Cell outline only.
          const tl = arrayCellTL(G, i);
          const isParentCell = i === highlightParentSlot;
          const isSifterCell = i === sifterSlot && phase === 'idle';
          const border = isParentCell ? 'var(--rose-400)'
            : isSifterCell ? 'var(--amber-400)'
            : (i === 7 && isInserting ? 'var(--amber-400)' : 'rgba(232,220,193,0.30)');
          const bg = isParentCell ? 'rgba(232,122,144,0.08)'
            : isSifterCell ? 'rgba(244,184,96,0.10)'
            : (i === 7 && isInserting ? 'rgba(244,184,96,0.08)' : 'rgba(0,0,0,0.45)');
          return (
            <g key={`co${i}`}>
              <rect x={tl.x} y={tl.y} width={G.arrayCell} height={G.arrayCell} rx={8}
                    fill={bg} stroke={border} strokeWidth={1.5}/>
              <text x={tl.x + G.arrayCell / 2} y={tl.y - 8}
                    textAnchor="middle" fontFamily="var(--font-mono)"
                    fontSize={G.arrayIndexFont} fill="var(--chalk-300)"
                    letterSpacing="0.10em">{i}</text>
            </g>
          );
        })}

        {/* Array values — one <text> per VALUE at its interpolated array position. */}
        {ALL_VALUES.map((v) => {
          const r = valueRender(v);
          if (r == null) return null;
          let y = r.arrayPos.y;
          if (v === INSERT_VALUE && isInserting) y = r.arrayPos.y + insertY;
          const color = v === INSERT_VALUE ? 'var(--amber-300)'
            : (r.slot === highlightParentSlot ? 'var(--rose-400)' : 'var(--chalk-100)');
          return (
            <text key={`av${v}`}
                  x={r.arrayPos.x} y={y + G.valueFont * 0.36}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.valueFont} fill={color}>
              {v}
            </text>
          );
        })}

        {/* Tree + liste eyebrows */}
        <text x={portrait ? G.svgW / 2 : G.treeCx} y={G.treeTopY - G.nodeR - 28}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--amber-300)" letterSpacing="0.16em">tre</text>
        <text x={portrait ? G.svgW / 2 : G.arrayLeftX} y={G.arrayY - 28}
              textAnchor={portrait ? 'middle' : 'start'}
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--amber-300)" letterSpacing="0.16em">liste</text>
      </svg>

      {/* Compare/swap badge — left-anchored under the array in landscape,
          centred at the bottom in portrait. */}
      <div style={{
        position: 'absolute',
        left: G.badgeX, top: G.badgeY, width: G.badgeW,
        padding: '12px 18px', borderRadius: 12,
        background: 'rgba(0,0,0,0.55)',
        border: `1.5px solid ${badgeAccent}`,
        display: 'flex', flexDirection: 'column', gap: 6, pointerEvents: 'none',
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: badgeAccent, letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>{badgeStep}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 20 : 22,
          color: 'var(--chalk-100)',
        }}>{badgeText}</span>
      </div>
    </>
  );
}

// ─── Beat 4: Why log n — tree height ───────────────────────────────────────
// The sift-up climb is shown after the fact (90 at the root, the trail to
// slot 7 lit amber). A height bracket on the right annotates that the path
// uses exactly the tree's height — which is log₂(n) for n cells.
function HeightLogNBeat() {
  const portrait = usePortrait();
  // This beat owns the whole canvas — no array on the right — so we centre
  // the tree and tighten the spread to make room for depth labels on the
  // left and a height bracket on the right.
  const base = layoutGeom(portrait);
  const G = portrait
    ? { ...base, portrait, treeCx: 340, treeWidth: 400, treeTopY: 240, rowH: 150 }
    : { ...base, portrait, treeCx: 540, treeWidth: 420, treeTopY: 150, rowH: 120 };
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Sift trail slots after all three swaps: 7 → 3 → 1 → 0.
  const TRAIL = new Set([0, 1, 3, 7]);

  // Final post-sift array.
  const finalArray = arrayAfterSteps(SIFT_STEPS.length);

  // Bracket reveal timing.
  const bracketDraw = clamp((localTime - at(0.20)) / 0.8, 0, 1);
  const formulaShow = clamp((localTime - at(0.55)) / 0.6, 0, 1);

  // Bracket geometry — to the right of the tree, spanning all 4 depth rows.
  // Tree right-edge in this beat: treeCx + treeWidth/2 + nodeR.
  const treeRightEdge = G.treeCx + G.treeWidth / 2 + G.nodeR;
  const bracketX = treeRightEdge + 40;
  const bracketTopY = G.treeTopY;
  const bracketBottomY = G.treeTopY + 3 * G.rowH;        // 4 rows = depths 0..3
  const bracketLen = bracketBottomY - bracketTopY;
  // Depth labels sit to the left of the tree, right-anchored with margin.
  const depthLabelX = G.treeCx - G.treeWidth / 2 - G.nodeR - 24;

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>

        {/* Tree edges — trail edges amber, others dim. */}
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          if (i === 0) return null;
          const p = parentOf(i);
          const a = treeNodeCentre(G, p);
          const b = treeNodeCentre(G, i);
          const onTrail = TRAIL.has(i) && TRAIL.has(p);
          return (
            <TreeEdge key={`e${i}`} G={G}
              x1={a.x} y1={a.y} x2={b.x} y2={b.y}
              highlight={onTrail} draw={1}/>
          );
        })}

        {/* Tree nodes */}
        {finalArray.map((v, i) => {
          const c = treeNodeCentre(G, i);
          const state = i === 0 ? 'root' : (TRAIL.has(i) ? 'active' : 'idle');
          return (
            <TreeNode key={`n${i}`} G={G} cx={c.x} cy={c.y} value={v} state={state}/>
          );
        })}

        {/* Depth labels (left of the tree). */}
        {[0, 1, 2, 3].map((d) => (
          <SvgFadeIn key={`dlbl${d}`} duration={0.4} delay={at(0.05) + d * 0.07}>
            <text x={depthLabelX}
                  y={G.treeTopY + d * G.rowH + 4}
                  textAnchor="end"
                  fontFamily="var(--font-mono)" fontSize={11}
                  fill="var(--amber-300)" letterSpacing="0.16em">
              {`nivå ${d}`}
            </text>
          </SvgFadeIn>
        ))}

        {/* Right-side height bracket — drawn via dashoffset reveal. */}
        <line x1={bracketX} y1={bracketTopY}
              x2={bracketX} y2={bracketBottomY}
              stroke="var(--amber-300)" strokeWidth={2}
              strokeDasharray={bracketLen}
              strokeDashoffset={(1 - bracketDraw) * bracketLen}/>
        {/* Bracket caps */}
        {bracketDraw > 0.05 && (
          <>
            <line x1={bracketX - 8} y1={bracketTopY}
                  x2={bracketX + 4} y2={bracketTopY}
                  stroke="var(--amber-300)" strokeWidth={2}/>
            <line x1={bracketX - 8} y1={bracketBottomY}
                  x2={bracketX + 4} y2={bracketBottomY}
                  stroke="var(--amber-300)" strokeWidth={2}/>
          </>
        )}

        {/* Bracket label */}
        <SvgFadeIn duration={0.5} delay={at(0.42)}>
          <text x={bracketX + 14}
                y={(bracketTopY + bracketBottomY) / 2 + 6}
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={portrait ? 22 : 22}
                fill="var(--amber-300)">
            høyde
          </text>
          <text x={bracketX + 14}
                y={(bracketTopY + bracketBottomY) / 2 + 30}
                fontFamily="var(--font-mono)"
                fontSize={portrait ? 14 : 14}
                fill="var(--chalk-200)" letterSpacing="0.08em">
            log₂ n
          </text>
        </SvgFadeIn>

        {/* Bottom formula reveal */}
        <g opacity={formulaShow}>
          <text x={G.svgW / 2}
                y={portrait ? 1140 : 620}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={portrait ? 22 : 24}
                fill="var(--amber-300)">
            sift opp ∈ O(log n)
          </text>
        </g>
      </svg>
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
        kjøretid
      </FadeUp>

      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        alignItems: 'center',
        gap: portrait ? 10 : 18,
      }}>
        <FadeUp duration={0.5} delay={0.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
            color: 'var(--chalk-200)',
            padding: portrait ? '8px 16px' : '10px 18px',
            borderRadius: 10,
            border: '1.5px solid rgba(232,220,193,0.30)',
            background: 'rgba(0,0,0,0.40)',
            whiteSpace: 'nowrap',
          }}>
          innsetting
        </FadeUp>
        <FadeUp duration={0.4} delay={0.9} distance={4}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-300)',
          }}>
          {portrait ? '+' : '·'}
        </FadeUp>
        <FadeUp duration={0.5} delay={1.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
            color: 'var(--chalk-200)',
            padding: portrait ? '8px 16px' : '10px 18px',
            borderRadius: 10,
            border: '1.5px solid rgba(232,220,193,0.30)',
            background: 'rgba(0,0,0,0.40)',
            whiteSpace: 'nowrap',
          }}>
          uttak av største
        </FadeUp>
        <FadeUp duration={0.4} delay={1.7} distance={4}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-300)',
          }}>
          {portrait ? 'gir' : '→'}
        </FadeUp>
        <FadeUp duration={0.55} delay={2.0} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 24 : 28,
            color: 'var(--amber-300)',
            padding: portrait ? '10px 20px' : '12px 22px',
            borderRadius: 12,
            border: '1.5px solid var(--amber-400)',
            background: 'rgba(244,184,96,0.10)',
            whiteSpace: 'nowrap',
          }}>
          O(log n)
        </FadeUp>
      </div>

      <FadeUp duration={0.6} delay={3.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '40ch',
          lineHeight: 1.3,
        }}>
        En million tall — <span style={{ color: 'var(--amber-300)' }}>tjue nivåer å klatre.</span>
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
