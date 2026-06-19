// Dynamisk programmering: fyll tabellen — Manimo lesson scene.
// Chapter 6 of algdat (Dynamisk programmering). The canonical DP intro:
// naive recursive fib(5) explodes into a 15-node tree where the same
// subproblem appears over and over (fib(3) twice, fib(2) three times,
// fib(1) five times, fib(0) three times). DP turns it around — a flat
// table fills bottom-up, each cell adds its two predecessors via a pair
// of TraceIn arrows, every subproblem computed exactly once. The payoff:
// 15 calls vs 6 cells, exponential vs linear.
//
// Beats (placeholder timings — rewire-scene.js overwrites after audio):
//    0– 9     Manimo hook
//    9–25     Naiv rekursjon — tree expands top-down five levels, duplicate
//             fib(k) nodes flash rose, kall-teller ticks to 15 (GENUINE MOTION)
//   25–44     DP-fylling — six cells fill left to right, two arrows TraceIn
//             into each new cell, value drops in (GENUINE MOTION)
//   44–55     Kontrast — 15 vs 6 stat blocks, 2^n vs n compact plot
//   55–63     Takeaway
//
// Colour discipline:
//   chalk-100  node + cell values, captions
//   chalk-300  dim labels, hint text, axis ticks
//   amber-400  primary stroke (tree edges, table cell borders, DP arrows)
//   amber-300  DP cell fill, payoff numbers, table values
//   rose-400   duplicate-call pulse, exponential-cost curve
//   rose-300   "kall-teller" badge
//   teal-400   base case (fib(0), fib(1))
//   violet-400 connector lines from parent to child in the recursion tree
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 71;

const NARRATION = [
  /*  0– 9  */ 'Du vil regne fib av fem. Den rekursive definisjonen ser uskyldig ut — men hvor mange kall trenger maskinen før den er ferdig?',
  /*  9–25  */ 'Hvert fib-kall splitter i to nye kall, helt til vi treffer fib av én eller fib av null. Treet vokser nedover. Og se: fib av tre ligger der to ganger. Fib av to dukker opp tre ganger. Fib av én — fem. Hver eneste gang regner vi det samme på nytt.',
  /* 25–44  */ 'Dynamisk programmering snur problemet på hodet. Vi starter med fib av null og fib av én, og fyller resten av tabellen oppover. Hver ny celle er bare summen av de to forrige. Og siden vi lagrer hvert svar, regner vi hvert delproblem nøyaktig én gang.',
  /* 44–55  */ 'Femten kall mot seks celler. Doble n, og det rekursive treet nesten tredobler seg, mens tabellen vokser med bare ett ledd om gangen. To i n-te mot n — eksponentielt mot lineært.',
  /* 55–63  */ 'Det er hele ideen bak dynamisk programmering. Husk svaret du allerede har regnet — så slipper du å regne det igjen.',
];

const NARRATION_AUDIO = 'audio/dp-fylling-fib/scene.mp3';

// ─── Recursion tree data ──────────────────────────────────────────────────
// fib(5) recursion tree, depth-first preorder. Each node carries its
// argument n, its tree level (0..4), and a leaf-slot index used to compute
// horizontal position (8 leaves total → leaf slots 0..7). Inner nodes get
// their leaf-slot as the mean of their children's slots, computed below.
//
// Tree shape:
//   fib(5)
//   ├─ fib(4)
//   │  ├─ fib(3)
//   │  │  ├─ fib(2)
//   │  │  │  ├─ fib(1)        leafSlot 0
//   │  │  │  └─ fib(0)        leafSlot 1
//   │  │  └─ fib(1)            leafSlot 2
//   │  └─ fib(2)
//   │     ├─ fib(1)            leafSlot 3
//   │     └─ fib(0)            leafSlot 4
//   └─ fib(3)
//      ├─ fib(2)
//      │  ├─ fib(1)            leafSlot 5
//      │  └─ fib(0)            leafSlot 6
//      └─ fib(1)               leafSlot 7
//
// spawnOrder = preorder index → controls expand-animation timing.
const TREE_NODES = [
  // id, n, level, parent, leafSlot, spawnOrder
  { id: 0,  n: 5, level: 0, parent: -1, leafSlot: 3.4,  spawnOrder: 0 },
  { id: 1,  n: 4, level: 1, parent: 0,  leafSlot: 1.875, spawnOrder: 1 },
  { id: 2,  n: 3, level: 2, parent: 1,  leafSlot: 0.875, spawnOrder: 2 },
  { id: 3,  n: 2, level: 3, parent: 2,  leafSlot: 0.5,   spawnOrder: 3 },
  { id: 4,  n: 1, level: 4, parent: 3,  leafSlot: 0,     spawnOrder: 4 },
  { id: 5,  n: 0, level: 4, parent: 3,  leafSlot: 1,     spawnOrder: 5 },
  { id: 6,  n: 1, level: 3, parent: 2,  leafSlot: 2,     spawnOrder: 6 },
  { id: 7,  n: 2, level: 2, parent: 1,  leafSlot: 3.5,   spawnOrder: 7 },
  { id: 8,  n: 1, level: 3, parent: 7,  leafSlot: 3,     spawnOrder: 8 },
  { id: 9,  n: 0, level: 3, parent: 7,  leafSlot: 4,     spawnOrder: 9 },
  { id: 10, n: 3, level: 1, parent: 0,  leafSlot: 5.75,  spawnOrder: 10 },
  { id: 11, n: 2, level: 2, parent: 10, leafSlot: 5.5,   spawnOrder: 11 },
  { id: 12, n: 1, level: 3, parent: 11, leafSlot: 5,     spawnOrder: 12 },
  { id: 13, n: 0, level: 3, parent: 11, leafSlot: 6,     spawnOrder: 13 },
  { id: 14, n: 1, level: 2, parent: 10, leafSlot: 7,     spawnOrder: 14 },
];

// Duplicate flag: a fib(k) node is a duplicate if an earlier (lower spawnOrder)
// node has the same n. Used to flash rose on second/third occurrence.
const FIRST_OCCURRENCE = {};
TREE_NODES.forEach((node) => {
  if (FIRST_OCCURRENCE[node.n] === undefined) FIRST_OCCURRENCE[node.n] = node.id;
});
function isDuplicate(node) { return FIRST_OCCURRENCE[node.n] !== node.id; }

// ─── DP table data ─────────────────────────────────────────────────────────
const DP_VALUES = [0, 1, 1, 2, 3, 5];  // F[0]..F[5]

// ─── Layout: recursion tree ────────────────────────────────────────────────
function treeGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      topY: 220, levelH: 165,
      leftX: 40, rightX: 680, leafW: (680 - 40) / 8,  // 80 per leaf slot
      nodeR: 22, fontVal: 14, fontSub: 9,
      counterX: 540, counterY: 200, counterFont: 28,
      hintX: 150, hintY: 1095, hintFont: 13,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    topY: 140, levelH: 108,
    leftX: 100, rightX: 1180, leafW: (1180 - 100) / 8,  // 135 per leaf slot
    nodeR: 26, fontVal: 17, fontSub: 11,
    counterX: 1060, counterY: 130, counterFont: 32,
    hintX: 160, hintY: 668, hintFont: 16,
  };
}

function nodeXY(G, node) {
  return {
    x: G.leftX + node.leafSlot * G.leafW + G.leafW / 2,
    y: G.topY + node.level * G.levelH,
  };
}

// ─── Layout: DP table ──────────────────────────────────────────────────────
function dpGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      cellW: 90, cellH: 90, gap: 12,
      rowX: 40, rowY: 620,             // 6 * 90 + 5 * 12 = 600 ≤ 640
      indexFont: 11, valueFont: 32,
      formulaX: 360, formulaY: 380, formulaFont: 24,
      arrowOffset: 26, arrowFont: 12,
      counterX: 60, counterY: 240, counterFont: 18,
      payoffX: 360, payoffY: 880, payoffFont: 26,
      arrowYAbove: 540, arrowYBelow: 716,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    cellW: 116, cellH: 116, gap: 16,
    rowX: 200, rowY: 360,              // 6 * 116 + 5 * 16 = 776 ≤ 880
    indexFont: 13, valueFont: 42,
    formulaX: 640, formulaY: 180, formulaFont: 32,
    arrowOffset: 30, arrowFont: 13,
    counterX: 80, counterY: 200, counterFont: 22,
    payoffX: 640, payoffY: 600, payoffFont: 32,
    arrowYAbove: 270, arrowYBelow: 486,
  };
}

function cellTopLeft(G, i) {
  return { x: G.rowX + i * (G.cellW + G.gap), y: G.rowY };
}
function cellCentre(G, i) {
  const tl = cellTopLeft(G, i);
  return { x: tl.x + G.cellW / 2, y: tl.y + G.cellH / 2 };
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="dynamisk programmering"
      title="Dynamisk programmering: fyll tabellen"
      duration={SCENE_DURATION}
      introEnd={9.36}
      introCaption="Husk det du allerede har regnet."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.36} end={27.68}>
        <NaivRekursjonBeat/>
      </Sprite>

      <Sprite start={27.68} end={47.67}>
        <DpFyllingBeat/>
      </Sprite>

      <Sprite start={47.67} end={61.79}>
        <KontrastBeat/>
      </Sprite>

      <Sprite start={61.79} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Naiv rekursjon (GENUINE MOTION — tree expands top-down) ──────
// The 15 nodes appear in preorder. As each node appears it gets a brief
// amber pulse; once its second (or later) occurrence shows, the new copy
// flashes rose to signal "we've seen this subproblem already." The
// kall-teller in the corner ticks 1..15 in lockstep with spawnOrder.
function NaivRekursjonBeat() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  // Spawn window: first node at 0.05T, last at 0.78T.
  const spawnStart = 0.05 * T;
  const spawnEnd = 0.78 * T;
  const spawnStride = (spawnEnd - spawnStart) / Math.max(TREE_NODES.length - 1, 1);
  function spawnTime(node) { return spawnStart + node.spawnOrder * spawnStride; }

  // Per-node visibility (0..1) and pulse intensity (0..1) decaying after spawn.
  function vis(node) {
    return clamp((localTime - spawnTime(node)) / 0.45, 0, 1);
  }
  function pulse(node) {
    const t = localTime - spawnTime(node);
    if (t < 0 || t > 1.2) return 0;
    return clamp(1 - t / 1.2, 0, 1);
  }

  // Kall-teller: how many nodes have begun spawning.
  const spawned = TREE_NODES.filter(n => localTime >= spawnTime(n)).length;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Edges (parent → child) draw in via dashoffset as the child spawns. */}
      {TREE_NODES.map((node) => {
        if (node.parent < 0) return null;
        const parent = TREE_NODES[node.parent];
        const a = nodeXY(G, parent);
        const b = nodeXY(G, node);
        const v = vis(node);
        const len = Math.hypot(b.x - a.x, b.y - a.y);
        return (
          <line key={`e${node.id}`} x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="var(--violet-400)" strokeWidth={1.5}
                strokeDasharray={len} strokeDashoffset={(1 - v) * len}
                opacity={0.7}/>
        );
      })}

      {/* Nodes — base cases get a teal ring, duplicates pulse rose. */}
      {TREE_NODES.map((node) => {
        const { x, y } = nodeXY(G, node);
        const v = vis(node);
        if (v <= 0) return null;
        const p = pulse(node);
        const isBase = node.n <= 1;
        const dup = isDuplicate(node) && !isBase;
        const stroke = isBase ? 'var(--teal-400)'
                    : dup ? 'var(--rose-400)'
                    : 'var(--amber-400)';
        const fill = isBase
          ? 'rgba(0,0,0,0.35)'
          : dup
            ? `rgba(232,122,144,${0.10 + 0.20 * p})`
            : `rgba(244,184,96,${0.08 + 0.18 * p})`;
        // Pulse radius wobble for the first ~0.8s after spawn.
        const r = G.nodeR + (dup ? 3 * p : 1.5 * p);
        return (
          <g key={`n${node.id}`} opacity={v}>
            <circle cx={x} cy={y} r={r} fill={fill}
                    stroke={stroke} strokeWidth={1.8}/>
            <text x={x} y={y - 2} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={G.fontSub}
                  fill="var(--chalk-300)" letterSpacing="0.05em">
              fib
            </text>
            <text x={x} y={y + G.fontVal * 0.6} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={G.fontVal}
                  fill={isBase ? 'var(--teal-400)' : 'var(--chalk-100)'}>
              ({node.n})
            </text>
          </g>
        );
      })}

      {/* Kall-teller badge (top-right) — ticks 0..15 as nodes appear. */}
      <SvgFadeIn duration={0.3} delay={spawnStart}>
        <g>
          <rect x={G.counterX - 60} y={G.counterY - 32} width={120} height={60} rx={10}
                fill="rgba(0,0,0,0.55)" stroke="var(--rose-400)" strokeWidth={1.5}/>
          <text x={G.counterX} y={G.counterY - 12} textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={11}
                fill="var(--rose-300)" letterSpacing="0.18em">
            KALL
          </text>
          <text x={G.counterX} y={G.counterY + 16} textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.counterFont}
                fill="var(--rose-300)">
            {spawned}
          </text>
        </g>
      </SvgFadeIn>

      {/* Late-beat hint about duplication. */}
      <SvgFadeIn duration={0.4} delay={0.82 * T}>
        <text x={G.hintX} y={G.hintY}
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={G.hintFont} fill="var(--chalk-100)">
          Samme delproblem regnes om igjen — &nbsp;
          <tspan fill="var(--rose-300)">tre ganger fib(2), to ganger fib(3).</tspan>
        </text>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 3: DP-fylling (GENUINE MOTION — table fills left to right) ──────
// Six cells F[0]..F[5]. F[0] and F[1] arrive as base values. For i = 2..5,
// two curved arrows TraceIn from cells i-1 and i-2 INTO cell i, then the
// value drops in. The kall-teller equivalent here is "celler fylt", ticking
// 1..6. After the final cell, F[5] = 5 gets highlighted as the payoff.
function DpFyllingBeat() {
  const portrait = usePortrait();
  const G = dpGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  // Per-cell schedule:
  //   F[0], F[1] arrive at 0.08T and 0.16T (no arrows).
  //   F[2]..F[5] each: arrow-draw window + value drop. ~0.42T budget split.
  const cellStarts = [0.06, 0.16, 0.30, 0.46, 0.62, 0.78].map(f => f * T);
  const arrowDur = 0.36;        // seconds for the arrows to draw in
  const valuePop = 0.30;        // delay after arrowDur before value lands

  // Each cell's overall completion (used for border/fill state).
  function cellState(i) {
    const t0 = cellStarts[i];
    if (localTime < t0) return { phase: 'empty', arrowT: 0, valT: 0 };
    if (i < 2) {
      // base case — value drops in directly
      const valT = clamp((localTime - t0) / 0.4, 0, 1);
      return { phase: valT >= 1 ? 'filled' : 'fillingValue', arrowT: 1, valT };
    }
    const arrowT = clamp((localTime - t0) / arrowDur, 0, 1);
    const valT = clamp((localTime - t0 - arrowDur - 0.05) / valuePop, 0, 1);
    if (arrowT < 1) return { phase: 'drawingArrows', arrowT, valT: 0 };
    if (valT < 1) return { phase: 'fillingValue', arrowT: 1, valT };
    return { phase: 'filled', arrowT: 1, valT: 1 };
  }

  const filledCount = cellStarts.reduce(
    (acc, t0, idx) => (localTime >= t0 + (idx < 2 ? 0.4 : arrowDur + 0.05 + valuePop) ? acc + 1 : acc),
    0,
  );

  // Payoff appears once the last cell has landed (after F[5] settled).
  const payoffT = clamp((localTime - (cellStarts[5] + arrowDur + 0.05 + valuePop)) / 0.5, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Recurrence formula above the table. */}
      <SvgFadeIn duration={0.5} delay={0}>
        <text x={G.formulaX} y={G.formulaY} textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.formulaFont}
              fill="var(--amber-300)">
          F[i] = F[i−1] + F[i−2]
        </text>
      </SvgFadeIn>

      {/* Cells — index label above, dashed empty box at first, value drops in. */}
      {DP_VALUES.map((v, i) => {
        const tl = cellTopLeft(G, i);
        const s = cellState(i);
        const empty = s.phase === 'empty';
        const stroke = empty ? 'rgba(232,220,193,0.22)'
          : s.phase === 'filled' ? 'var(--amber-300)' : 'var(--amber-400)';
        const dash = empty ? '5 5' : undefined;
        const bg = empty ? 'rgba(0,0,0,0.30)' :
                  s.phase === 'filled' ? 'rgba(244,184,96,0.18)' : 'rgba(244,184,96,0.10)';
        const valOpacity = s.valT;
        const valScale = 0.8 + 0.2 * s.valT;
        const cx = tl.x + G.cellW / 2;
        const cy = tl.y + G.cellH / 2 + G.valueFont * 0.36;
        return (
          <g key={`c${i}`}>
            {/* index label */}
            <text x={tl.x + G.cellW / 2} y={tl.y - 10} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={G.indexFont}
                  fill={empty ? 'var(--chalk-300)' : 'var(--amber-300)'}
                  letterSpacing="0.18em">
              F[{i}]
            </text>
            <rect x={tl.x} y={tl.y} width={G.cellW} height={G.cellH} rx={10}
                  fill={bg} stroke={stroke} strokeWidth={1.8}
                  strokeDasharray={dash}/>
            {valOpacity > 0 && (
              <text x={cx} y={cy} textAnchor="middle"
                    fontFamily="var(--font-mono)" fontSize={G.valueFont}
                    fill={i === 5 && payoffT > 0.5 ? 'var(--amber-300)' : 'var(--chalk-100)'}
                    opacity={valOpacity}
                    transform={`translate(${cx},${cy}) scale(${valScale}) translate(${-cx},${-cy})`}>
                {v}
              </text>
            )}
          </g>
        );
      })}

      {/* Arrows i-1 → i (close-in arc, above row) and i-2 → i (longer arc,
          below row). They draw in via stroke-dashoffset. */}
      {[2, 3, 4, 5].map((i) => {
        const s = cellState(i);
        const drawT = s.arrowT;
        if (drawT <= 0) return null;
        const c_i = cellCentre(G, i);
        const c_im1 = cellCentre(G, i - 1);
        const c_im2 = cellCentre(G, i - 2);

        // Arrow 1: from cell (i-1) up over the top of cell i-1, down into cell i top-left
        const a1 = { x: c_im1.x + 8, y: c_im1.y - G.cellH / 2 - 6 };
        const a2 = { x: c_i.x - 16, y: c_i.y - G.cellH / 2 - 6 };
        const a1ctrlY = G.arrowYAbove;
        const d1 = `M ${a1.x} ${a1.y} C ${a1.x} ${a1ctrlY}, ${a2.x} ${a1ctrlY}, ${a2.x} ${a2.y}`;
        // Arrow 2: from cell (i-2) UNDER (below row) to cell i bottom-left.
        const b1 = { x: c_im2.x + 8, y: c_im2.y + G.cellH / 2 + 6 };
        const b2 = { x: c_i.x - 16, y: c_i.y + G.cellH / 2 + 6 };
        const b1ctrlY = G.arrowYBelow;
        const d2 = `M ${b1.x} ${b1.y} C ${b1.x} ${b1ctrlY}, ${b2.x} ${b1ctrlY}, ${b2.x} ${b2.y}`;

        // Approximate path lengths for dashoffset reveal — overestimate to be safe.
        const len1 = Math.abs(a2.x - a1.x) + Math.abs(a1ctrlY - a1.y) * 2;
        const len2 = Math.abs(b2.x - b1.x) + Math.abs(b1ctrlY - b1.y) * 2;
        const color = 'var(--amber-400)';
        const headOpacity = clamp((drawT - 0.7) / 0.3, 0, 1);
        return (
          <g key={`arr${i}`}>
            <path d={d1} fill="none" stroke={color} strokeWidth={1.8}
                  strokeDasharray={len1} strokeDashoffset={(1 - drawT) * len1}/>
            {/* Arrowhead at a2 */}
            <polygon
              points={`${a2.x - 6},${a2.y - 4} ${a2.x - 6},${a2.y + 4} ${a2.x},${a2.y}`}
              fill={color} opacity={headOpacity}/>
            <path d={d2} fill="none" stroke={color} strokeWidth={1.8}
                  strokeDasharray={len2} strokeDashoffset={(1 - drawT) * len2}/>
            <polygon
              points={`${b2.x - 6},${b2.y - 4} ${b2.x - 6},${b2.y + 4} ${b2.x},${b2.y}`}
              fill={color} opacity={headOpacity}/>
          </g>
        );
      })}

      {/* Celle-teller badge (top-left in landscape, top in portrait). */}
      <SvgFadeIn duration={0.3} delay={0}>
        <g>
          <rect x={G.counterX - 8} y={G.counterY - 24} width={portrait ? 200 : 220} height={50} rx={10}
                fill="rgba(0,0,0,0.55)" stroke="var(--amber-400)" strokeWidth={1.5}/>
          <text x={G.counterX + 8} y={G.counterY - 6}
                fontFamily="var(--font-mono)" fontSize={11}
                fill="var(--amber-300)" letterSpacing="0.18em">
            CELLER FYLT
          </text>
          <text x={G.counterX + 8} y={G.counterY + 18}
                fontFamily="var(--font-mono)" fontSize={G.counterFont}
                fill="var(--amber-300)">
            {filledCount} / 6
          </text>
        </g>
      </SvgFadeIn>

      {/* Payoff line under the table — appears once the final cell lands. */}
      {payoffT > 0 && (
        <g opacity={payoffT}>
          <text x={G.payoffX} y={G.payoffY} textAnchor="middle"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.payoffFont} fill="var(--chalk-100)">
            <tspan fill="var(--amber-300)" fontFamily="var(--font-mono)" fontStyle="normal">
              F[5] = 5
            </tspan>
            <tspan> — hvert delproblem én gang.</tspan>
          </text>
        </g>
      )}
    </svg>
  );
}

// ─── Beat 4: Kontrast — 15 calls vs 6 cells, exponential vs linear ─────────
function KontrastBeat() {
  const portrait = usePortrait();
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  // The two stat boxes appear first; the comparison plot fades in halfway.
  const plotShow = clamp((localTime - 0.35 * T) / 0.5, 0, 1);

  // Compact plot geometry.
  const plotW = portrait ? 580 : 760;
  const plotH = portrait ? 230 : 240;
  const N = 10;                                  // n from 0..10
  // Sample exponential 2^n and linear n. Cap the exponential at the top of
  // the plot so it visually "shoots off-canvas."
  const expRaw = Array.from({ length: N + 1 }, (_, n) => Math.pow(2, n));
  const expCap = 32;                             // visible ceiling = 2^5
  function yExp(v) { return plotH - Math.min(v, expCap) / expCap * (plotH - 18) - 6; }
  function yLin(v) { return plotH - v / N * (plotH - 18) - 6; }
  function xAt(n) { return 8 + n / N * (plotW - 16); }
  const expPts = expRaw.map((v, n) => [xAt(n), yExp(v)]);
  const linPts = expRaw.map((_, n) => [xAt(n), yLin(n)]);

  // Animate the curves drawing in left to right (clip to a moving x).
  const curveT = clamp((localTime - 0.5 * T) / 0.6, 0, 1);
  const xLimit = 8 + curveT * (plotW - 16);

  // Build path data clipped to xLimit (truncate beyond).
  function pathTo(points) {
    const visible = points.filter(([x]) => x <= xLimit);
    if (visible.length < 1) return 'M 0 0';
    return visible.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  }

  const counterStyle = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 11 : 12,
    color: 'var(--chalk-300)', letterSpacing: '0.18em', textTransform: 'uppercase',
    marginBottom: 6,
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 24 : 28,
    }}>
      {/* Stat boxes side by side */}
      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        gap: portrait ? 16 : 36,
        alignItems: 'center',
      }}>
        <FadeUp duration={0.5} delay={0.3} distance={10}
          style={{
            padding: portrait ? '14px 22px' : '18px 28px',
            borderRadius: 14,
            border: '1.5px solid var(--rose-400)',
            background: 'rgba(232,122,144,0.08)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            minWidth: portrait ? 220 : 240,
          }}>
          <div style={counterStyle}>naivt — rekursjon</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 36 : 46,
                        color: 'var(--rose-300)', lineHeight: 1 }}>
            15 <span style={{ fontSize: portrait ? 16 : 20, color: 'var(--chalk-300)' }}>kall</span>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                        color: 'var(--chalk-300)', marginTop: 6 }}>
            vekst ~ 2 i n-te
          </div>
        </FadeUp>

        <FadeUp duration={0.5} delay={0.8} distance={10}
          style={{
            padding: portrait ? '14px 22px' : '18px 28px',
            borderRadius: 14,
            border: '1.5px solid var(--amber-400)',
            background: 'rgba(244,184,96,0.10)',
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            minWidth: portrait ? 220 : 240,
          }}>
          <div style={counterStyle}>DP — tabell</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 36 : 46,
                        color: 'var(--amber-300)', lineHeight: 1 }}>
            6 <span style={{ fontSize: portrait ? 16 : 20, color: 'var(--chalk-300)' }}>celler</span>
          </div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                        color: 'var(--chalk-300)', marginTop: 6 }}>
            vekst ~ n
          </div>
        </FadeUp>
      </div>

      {/* Compact growth plot */}
      {plotShow > 0 && (
        <div style={{
          opacity: plotShow,
          width: plotW, height: plotH,
          position: 'relative',
          padding: '12px 14px',
          borderRadius: 14,
          border: '1px solid rgba(232,220,193,0.20)',
          background: 'rgba(0,0,0,0.30)',
        }}>
          <div style={{
            position: 'absolute', left: 18, top: 8,
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--chalk-300)', letterSpacing: '0.16em',
          }}>
            vekst — kall pr n
          </div>
          <svg viewBox={`0 0 ${plotW} ${plotH}`} width={plotW} height={plotH}
               style={{ position: 'absolute', inset: 12 }}>
            {/* axes baseline */}
            <line x1={8} y1={plotH - 6} x2={plotW - 8} y2={plotH - 6}
                  stroke="rgba(232,220,193,0.28)" strokeWidth={1}/>
            <line x1={8} y1={6} x2={8} y2={plotH - 6}
                  stroke="rgba(232,220,193,0.28)" strokeWidth={1}/>
            {/* exponential curve (rose) — shoots up and off the top */}
            <path d={pathTo(expPts)} fill="none" stroke="var(--rose-400)" strokeWidth={2.2}/>
            {/* linear curve (amber) — calm rise */}
            <path d={pathTo(linPts)} fill="none" stroke="var(--amber-400)" strokeWidth={2.2}/>
            {/* labels at right end (visible once curve reaches there) */}
            {curveT > 0.85 && (
              <>
                <text x={plotW - 12} y={20}
                      textAnchor="end"
                      fontFamily="var(--font-mono)" fontSize={11}
                      fill="var(--rose-300)">2 i n-te</text>
                <text x={plotW - 12} y={plotH - 14}
                      textAnchor="end"
                      fontFamily="var(--font-mono)" fontSize={11}
                      fill="var(--amber-300)">n</text>
              </>
            )}
          </svg>
        </div>
      )}
    </div>
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
      alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                 color: 'var(--amber-300)', letterSpacing: '0.18em',
                 textTransform: 'uppercase' }}>
        dynamisk programmering
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '34ch', lineHeight: 1.25 }}>
        Husk svaret du <span style={{ color: 'var(--amber-300)' }}>allerede har regnet.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
                 color: 'var(--amber-300)' }}>
        2<sup style={{ fontSize: '0.6em' }}>n</sup> &nbsp;→&nbsp; n
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
