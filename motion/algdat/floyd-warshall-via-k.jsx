// Floyd–Warshall: korteste vei via et mellomledd — Manimo lesson scene.
// Chapter 11 of algdat (Korteste vei mellom alle par). The all-pairs DP
// classic: one n×n distance matrix is updated in V passes — pass k allows
// vertex k as a new intermediate stop, and any cell where the via-k detour
// is shorter ticks down. Four-node directed weighted graph, seven edges,
// seven cell improvements distributed across four k-passes.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10   Manimo hook
//   10–22   Graf + initial matrix (no algorithm motion yet)
//   22–32   Recurrence reveal — formula + i → k → j pointer chain
//   32–54   All k passes (GENUINE MOTION — node k highlights, row k +
//           col k tint, seven cells visibly tick from old → new across
//           four passes, total counter rises 0 → 7)
//   54–64   Takeaway — final matrix + O(n^3) payoff
//
// Colour discipline:
//   chalk-100  node letters, cell values once committed, payoff text
//   chalk-200  static edge weights, header labels (row/col indices)
//   chalk-300  dim/idle text, ∞ symbols
//   amber-400  primary graph stroke, active cell pulse, k node highlight
//   amber-300  committed-cell tint, formula text, eyebrows, payoff number
//   rose-400   "improved this pass" pulse halo
//   rose-300   counter badge text
//   teal-400   directed arrowheads at edge tips
//   violet-400 "via k" row/col tint and the i → k → j recurrence pointer
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 65;

const NARRATION = [
  /*  0–10 */ 'Hva om vi vil ha korteste vei mellom hvert eneste par av byer på en gang? Floyd og Warshall løser hele tabellen, én mellomstasjon av gangen.',
  /* 10–22 */ 'Her er fire byer og sju veier med kostnader. Vi starter med direkte avstander: null på diagonalen, kantens vekt der det går en kant, og uendelig ellers.',
  /* 22–32 */ 'Kjernen er én idé. Kan vi finne en kortere vei fra i til j hvis vi får gå innom én mellomstasjon, kall den k? Er D av i og k pluss D av k og j kortere enn det vi har, bytter vi.',
  /* 32–54 */ 'Vi tillater én mellomstasjon av gangen. Via node null åpnes to nye veier. Via node én, to nye til. Via node to faller tre forbedringer på rappen — alt går fint gjennom node to. Via node tre — ingen flere gevinster. Tabellen er ferdig.',
  /* 54–64 */ 'Tre nestede løkker — én for mellomstasjonen og to for paret. Da har du korteste vei mellom hvert eneste par, på orden n i tredje.',
];

const NARRATION_AUDIO = 'audio/floyd-warshall-via-k/scene.mp3';

// ─── Graph data ────────────────────────────────────────────────────────────
const NUM_NODES = 4;
const INFTY = Infinity;

// Directed edges with weights. Hand-picked so the via-k passes actually
// produce improvements: 2 wins via 0, 2 wins via 1, 3 wins via 2, 0 via 3.
const EDGES = [
  { u: 0, v: 1, w: 3 },
  { u: 0, v: 3, w: 10 },
  { u: 1, v: 2, w: 4 },
  { u: 1, v: 3, w: 8 },
  { u: 2, v: 0, w: 2 },
  { u: 2, v: 3, w: 1 },
  { u: 3, v: 0, w: 6 },
];

function initialMatrix() {
  const D = Array.from({ length: NUM_NODES }, () => Array(NUM_NODES).fill(INFTY));
  for (let i = 0; i < NUM_NODES; i++) D[i][i] = 0;
  for (const { u, v, w } of EDGES) D[u][v] = w;
  return D;
}
const D_INIT = initialMatrix();

// Pre-computed update sequence (k, i, j, old, val). Hand-derived from the
// Floyd-Warshall execution on the edge list above. Order within a k-pass
// is the standard row-major (i outer, j inner).
const UPDATES = [
  // k = 0 — via vertex 0
  { k: 0, i: 2, j: 1, old: INFTY, val: 5 },   // 2→0 + 0→1 = 2 + 3
  { k: 0, i: 3, j: 1, old: INFTY, val: 9 },   // 3→0 + 0→1 = 6 + 3
  // k = 1 — via vertex 1
  { k: 1, i: 0, j: 2, old: INFTY, val: 7 },   // 0→1 + 1→2 = 3 + 4
  { k: 1, i: 3, j: 2, old: INFTY, val: 13 },  // 3→1 + 1→2 = 9 + 4 (3→1 from k=0)
  // k = 2 — via vertex 2 (the big pass: three wins)
  { k: 2, i: 0, j: 3, old: 10,    val: 8 },   // 0→2 + 2→3 = 7 + 1
  { k: 2, i: 1, j: 0, old: INFTY, val: 6 },   // 1→2 + 2→0 = 4 + 2
  { k: 2, i: 1, j: 3, old: 8,     val: 5 },   // 1→2 + 2→3 = 4 + 1
  // k = 3 — via vertex 3: no improvements
];

// Build the matrix as it should look after `n` updates have been committed.
function matrixAfter(n) {
  const D = D_INIT.map(row => row.slice());
  for (let e = 0; e < Math.min(n, UPDATES.length); e++) {
    const u = UPDATES[e];
    D[u.i][u.j] = u.val;
  }
  return D;
}
const D_FINAL = matrixAfter(UPDATES.length);

// For each update, list of "via" cells (the two reads it depends on) — used
// to draw the i→k and k→j sweep cue during the active update.
function viaCells(u) {
  return [ { i: u.i, j: u.k }, { i: u.k, j: u.j } ];
}

// Two specific paths the takeaway traces on the graph, to make the matrix
// real: 0 → 2 → 3 (was 10, now 8) and 1 → 2 → 3 (was 8, now 5).
const TAKEAWAY_PATHS = [
  { from: 0, to: 3, via: [0, 2, 3], oldVal: 10, newVal: 8,  color: 'var(--amber-400)' },
  { from: 1, to: 3, via: [1, 2, 3], oldVal: 8,  newVal: 5,  color: 'var(--rose-400)'  },
];

// ─── Layout ────────────────────────────────────────────────────────────────
// Landscape: graph left third, matrix right two-thirds.
// Portrait: graph top quarter, matrix middle-bottom, counters at bottom.
function layoutGeom(portrait) {
  if (portrait) {
    // 720×1280
    return {
      portrait: true,
      svgW: 720, svgH: 1280,
      graphX: 150, graphY: 200, graphSize: 420,
      nodeR: 28, nodeFont: 18, edgeStroke: 1.7, weightFont: 12,
      matCx: 360, matCy: 940,
      headerCellW: 56, cellW: 108, cellH: 76, gap: 8,
      headerFont: 16, valueFont: 28, infFont: 24,
      kBadgeX: 80, kBadgeY: 640, kBadgeW: 220, kBadgeH: 60,
      kBadgeLabel: 11, kBadgeValue: 22,
      counterX: 420, counterY: 640, counterW: 220, counterH: 60,
      counterLabel: 11, counterValue: 22,
      formulaX: 360, formulaY: 270, formulaFont: 22,
    };
  }
  // 1280×720
  return {
    portrait: false,
    svgW: 1280, svgH: 720,
    graphX: 60, graphY: 110, graphSize: 440,
    nodeR: 28, nodeFont: 18, edgeStroke: 1.8, weightFont: 12,
    matCx: 900, matCy: 360,
    headerCellW: 48, cellW: 94, cellH: 74, gap: 7,
    headerFont: 13, valueFont: 26, infFont: 22,
    kBadgeX: 240, kBadgeY: 600, kBadgeW: 200, kBadgeH: 58,
    kBadgeLabel: 10, kBadgeValue: 22,
    counterX: 480, counterY: 600, counterW: 220, counterH: 58,
    counterLabel: 10, counterValue: 22,
    formulaX: 640, formulaY: 230, formulaFont: 22,
  };
}

// Node positions (local to graph SVG viewBox 0..graphSize).
// Square arrangement: 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left.
function nodePos(G, id) {
  const s = G.graphSize;
  const inset = 0.20;
  const xs = [inset * s, (1 - inset) * s, (1 - inset) * s, inset * s];
  const ys = [inset * s, inset * s, (1 - inset) * s, (1 - inset) * s];
  return { x: xs[id], y: ys[id] };
}

// Edge curve: quadratic Bezier offset perpendicular to the direction. The
// offset sign is fixed (always to the "right" of the edge direction), so a
// pair of opposing edges (0→3 vs 3→0) naturally separate into two curves.
function edgePath(p1, p2, curve = 22) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const mx = (p1.x + p2.x) / 2 + nx * curve;
  const my = (p1.y + p2.y) / 2 + ny * curve;
  return { d: `M ${p1.x} ${p1.y} Q ${mx} ${my} ${p2.x} ${p2.y}`, mid: { x: mx, y: my } };
}

// Compute the point on the curve at parameter t ∈ [0, 1] for arrowhead placement.
function bezierPoint(p1, mid, p2, t) {
  const x = (1 - t) * (1 - t) * p1.x + 2 * (1 - t) * t * mid.x + t * t * p2.x;
  const y = (1 - t) * (1 - t) * p1.y + 2 * (1 - t) * t * mid.y + t * t * p2.y;
  // Tangent at t for arrowhead orientation
  const tx = 2 * (1 - t) * (mid.x - p1.x) + 2 * t * (p2.x - mid.x);
  const ty = 2 * (1 - t) * (mid.y - p1.y) + 2 * t * (p2.y - mid.y);
  const tlen = Math.hypot(tx, ty) || 1;
  return { x, y, dx: tx / tlen, dy: ty / tlen };
}

// Where to drop the weight badge along an edge: at curve midpoint, nudged
// further outward so opposing edges don't overlap.
function weightPos(p1, p2, mid) {
  const dx = p2.x - p1.x, dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  return { x: mid.x + nx * 6, y: mid.y + ny * 6 };
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
function easeOutBack(t) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="alle par"
      title="Floyd–Warshall: korteste vei via et mellomledd"
      duration={SCENE_DURATION}
      introEnd={9.93}
      introCaption="Tillat én ny mellomstasjon — og se om tabellen krymper."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.93} end={21.4}>
        <GrafOgTabellBeat/>
      </Sprite>

      <Sprite start={21.4} end={34.98}>
        <RekursjonBeat/>
      </Sprite>

      <Sprite start={34.98} end={54.46}>
        <AllePassBeat/>
      </Sprite>

      <Sprite start={54.46} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared mini-graph renderer ───────────────────────────────────────────
// state per node:   'idle' | 'hot' (= current k)
// state per edge:   'idle' | 'flash' (highlighted as part of i→k→j chain)
function MiniGraph({ G, ox = 0, oy = 0, hotNode = null, flashEdges = [], pathOverlay = null, opacity = 1, drawAll = 1 }) {
  const s = G.graphSize;
  const positions = [0, 1, 2, 3].map(id => nodePos(G, id));

  // Each edge gets a tracking metadata block once for the whole render.
  const edgeMeta = EDGES.map(({ u, v, w }) => {
    const p1 = positions[u], p2 = positions[v];
    const ep = edgePath(p1, p2, 26);
    const arrowEndT = 1 - (G.nodeR + 4) / Math.hypot(p2.x - p1.x, p2.y - p1.y);
    return { u, v, w, p1, p2, ep, arrowEndT };
  });

  function isFlashed(u, v) {
    return flashEdges.some(e => e.u === u && e.v === v);
  }

  // Path overlay: highlight a chain of nodes (the takeaway path tracer).
  const overlayEdges = pathOverlay
    ? pathOverlay.via.slice(0, -1).map((u, idx) => ({ u, v: pathOverlay.via[idx + 1] }))
    : [];
  function isOverlayed(u, v) {
    return overlayEdges.some(e => e.u === u && e.v === v);
  }
  const overlayColor = pathOverlay?.color ?? 'var(--amber-400)';

  return (
    <g transform={`translate(${ox}, ${oy})`} opacity={opacity}>
      {/* Edges */}
      {edgeMeta.map(({ u, v, w, p1, p2, ep, arrowEndT }, idx) => {
        const flash = isFlashed(u, v);
        const overlay = isOverlayed(u, v);
        const stroke = overlay ? overlayColor
                     : flash ? 'var(--violet-400)'
                     : 'rgba(232,220,193,0.32)';
        const sw = (overlay ? 2.6 : flash ? 2.4 : G.edgeStroke);
        const endPt = bezierPoint(p1, ep.mid, p2, arrowEndT);
        const headColor = overlay ? overlayColor
                        : flash ? 'var(--violet-400)'
                        : 'var(--teal-400)';
        // Trim the visible curve so the arrowhead sits at the tangent point,
        // not at the node centre.
        const tipPt = bezierPoint(p1, ep.mid, p2, arrowEndT);
        const sx = 8 * tipPt.dx, sy = 8 * tipPt.dy;
        const headBL = { x: tipPt.x - sx - tipPt.dy * 4, y: tipPt.y - sy + tipPt.dx * 4 };
        const headTL = { x: tipPt.x - sx + tipPt.dy * 4, y: tipPt.y - sy - tipPt.dx * 4 };
        // Approximate dashable length for the draw-in reveal — overestimate.
        const approxLen = Math.hypot(p2.x - p1.x, p2.y - p1.y) * 1.25;
        const d = clamp(drawAll, 0, 1);
        const wp = weightPos(p1, p2, ep.mid);
        const weightColor = overlay ? overlayColor
                          : flash ? 'var(--violet-400)'
                          : 'var(--chalk-300)';
        return (
          <g key={`e${idx}`}>
            <path d={ep.d} fill="none" stroke={stroke} strokeWidth={sw}
                  strokeLinecap="round"
                  strokeDasharray={approxLen}
                  strokeDashoffset={(1 - d) * approxLen}/>
            {d > 0.7 && (
              <polygon
                points={`${tipPt.x},${tipPt.y} ${headBL.x},${headBL.y} ${headTL.x},${headTL.y}`}
                fill={headColor}/>
            )}
            {/* Weight badge */}
            {d > 0.85 && (
              <g>
                <rect x={wp.x - 11} y={wp.y - 10} width={22} height={20} rx={5}
                      fill="#0c0a1f" fillOpacity={0.92}/>
                <text x={wp.x} y={wp.y + G.weightFont * 0.34}
                      textAnchor="middle" fontFamily="var(--font-mono)"
                      fontSize={G.weightFont} fill={weightColor}>
                  {w}
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {[0, 1, 2, 3].map(id => {
        const p = positions[id];
        const overlayNode = pathOverlay?.via.includes(id);
        const hot = hotNode === id;
        const border = overlayNode ? overlayColor
                     : hot ? 'var(--amber-400)'
                     : 'rgba(232,220,193,0.45)';
        const fill = overlayNode ? overlayColor
                   : hot ? 'var(--amber-400)'
                   : 'rgba(0,0,0,0.55)';
        const fillOp = overlayNode ? 0.18
                     : hot ? 0.20
                     : 1;
        const letterColor = (overlayNode || hot) ? 'var(--chalk-100)' : 'var(--chalk-200)';
        return (
          <g key={`n${id}`}>
            <circle cx={p.x} cy={p.y} r={G.nodeR}
                    fill={fill} fillOpacity={fillOp}
                    stroke={border} strokeWidth={1.8}/>
            <text x={p.x} y={p.y + G.nodeFont * 0.35}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.nodeFont} fill={letterColor}>
              {id}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Shared matrix renderer ───────────────────────────────────────────────
// Renders a 4×4 distance matrix with row/column header strips. Cell display
// options drive the per-cell visual state:
//   committed: which cells show their "current" value (D from matrixAfter)
//   activeUpdate: { i, j, old, val, progress } — value in transit (cell pulses)
//   kHighlight: 0..3 or null — row k and col k get a violet tint
//   improvedThisPass: Set of "i,j" — which committed cells just changed this k pass
function MatrixView({ G, ox = 0, oy = 0, D, activeUpdate = null, kHighlight = null, improvedThisPass = new Set(), opacity = 1 }) {
  const { headerCellW, cellW, cellH, gap, headerFont, valueFont, infFont } = G;
  const rows = NUM_NODES, cols = NUM_NODES;

  // Origin at (ox, oy): the top-left corner of the header. Layout:
  //   [hdr] [c0]  [c1]  [c2]  [c3]
  //   [r0]  [00]  [01]  [02]  [03]
  //   ...
  const headerH = cellH * 0.55;
  function colX(j) { return ox + headerCellW + j * (cellW + gap); }
  function rowY(i) { return oy + headerH + gap + i * (cellH + gap); }

  function cellRect(i, j) {
    return { x: colX(j), y: rowY(i), w: cellW, h: cellH };
  }

  // Centring helpers
  function txtY(yTop, h, fontSize) {
    return yTop + h * 0.5 + fontSize * 0.34;
  }

  return (
    <g transform={`translate(${ox}, ${oy})`} opacity={opacity}>
      {/* Header background strip */}
      <rect x={headerCellW} y={0} width={cols * cellW + (cols - 1) * gap} height={headerH}
            fill="rgba(232,220,193,0.04)" stroke="none"/>
      {/* Column headers */}
      {[0, 1, 2, 3].map(j => {
        const x = colX(j) - ox;
        const isK = kHighlight === j;
        return (
          <text key={`ch${j}`}
                x={x + cellW / 2} y={headerH * 0.5 + headerFont * 0.36}
                textAnchor="middle" fontFamily="var(--font-mono)"
                fontSize={headerFont}
                fill={isK ? 'var(--violet-400)' : 'var(--chalk-300)'}
                letterSpacing="0.16em">
            {j}
          </text>
        );
      })}
      {/* Row headers */}
      {[0, 1, 2, 3].map(i => {
        const y = rowY(i) - oy;
        const isK = kHighlight === i;
        return (
          <text key={`rh${i}`}
                x={headerCellW * 0.5} y={y + cellH * 0.5 + headerFont * 0.36}
                textAnchor="middle" fontFamily="var(--font-mono)"
                fontSize={headerFont}
                fill={isK ? 'var(--violet-400)' : 'var(--chalk-300)'}
                letterSpacing="0.16em">
            {i}
          </text>
        );
      })}
      {/* "via k" violet tint over row k and col k (drawn beneath cells, above bg) */}
      {kHighlight !== null && (
        <g opacity={0.18}>
          <rect x={headerCellW} y={rowY(kHighlight) - oy} width={cols * cellW + (cols - 1) * gap} height={cellH}
                fill="var(--violet-400)" rx={6}/>
          <rect x={colX(kHighlight) - ox} y={headerH + gap} width={cellW} height={rows * cellH + (rows - 1) * gap}
                fill="var(--violet-400)" rx={6}/>
        </g>
      )}
      {/* Cells */}
      {[0, 1, 2, 3].map(i => (
        [0, 1, 2, 3].map(j => {
          const { x, y, w, h } = cellRect(i, j);
          const lx = x - ox, ly = y - oy;
          const v = D[i][j];
          const isDiag = i === j;
          const isInf = v === INFTY;
          const isImproved = improvedThisPass.has(`${i},${j}`);
          const isActive = activeUpdate && activeUpdate.i === i && activeUpdate.j === j;
          const progress = isActive ? activeUpdate.progress : 0;

          let border = 'rgba(232,220,193,0.22)';
          let fill = 'rgba(0,0,0,0.30)';
          let valColor = isInf ? 'var(--chalk-300)' : 'var(--chalk-100)';
          let valFont = isInf ? infFont : valueFont;

          if (isDiag) {
            border = 'rgba(232,220,193,0.35)';
            fill = 'rgba(232,220,193,0.06)';
            valColor = 'var(--chalk-200)';
          } else if (!isInf && !isImproved && !isActive) {
            border = 'rgba(244,184,96,0.45)';
            fill = 'rgba(244,184,96,0.06)';
          }
          if (isImproved) {
            border = 'var(--amber-300)';
            fill = 'rgba(244,184,96,0.16)';
            valColor = 'var(--amber-300)';
          }
          if (isActive) {
            border = 'var(--rose-400)';
            const pulse = 0.18 + 0.20 * Math.sin(progress * Math.PI);
            fill = `rgba(232,122,144,${pulse.toFixed(3)})`;
          }

          // Compose old/new transition for an active update.
          let oldOpacity = 0, oldYShift = 0;
          let newOpacity = 1, newYShift = 0;
          let displayedVal = v;
          if (isActive) {
            // 0 .. 0.45 show old steady; 0.45 .. 0.85 cross-fade; 0.85+ show new.
            const t = clamp(progress, 0, 1);
            const fade = clamp((t - 0.45) / 0.40, 0, 1);
            oldOpacity = 1 - fade;
            newOpacity = fade;
            oldYShift = fade * -10;
            newYShift = (1 - fade) * 10;
            displayedVal = activeUpdate.val;  // the "new" value
          }

          const cx = lx + w / 2;
          const cy = ly + h / 2 + valFont * 0.30;

          return (
            <g key={`c${i}${j}`}>
              <rect x={lx} y={ly} width={w} height={h} rx={8}
                    fill={fill} stroke={border} strokeWidth={1.8}/>
              {/* Diagonal cells: always 0 */}
              {isDiag && (
                <text x={cx} y={cy}
                      textAnchor="middle" fontFamily="var(--font-mono)"
                      fontSize={valFont} fill={valColor}>
                  0
                </text>
              )}
              {!isDiag && !isActive && (
                isInf
                  ? <text x={cx} y={cy}
                          textAnchor="middle" fontFamily="var(--font-mono)"
                          fontSize={valFont} fill={valColor}>∞</text>
                  : <text x={cx} y={cy}
                          textAnchor="middle" fontFamily="var(--font-mono)"
                          fontSize={valFont} fill={valColor}>{v}</text>
              )}
              {!isDiag && isActive && (
                <>
                  {/* old value sliding up + fading out */}
                  <text x={cx} y={cy + oldYShift}
                        textAnchor="middle" fontFamily="var(--font-mono)"
                        fontSize={activeUpdate.old === INFTY ? infFont : valueFont}
                        fill="var(--chalk-300)"
                        opacity={oldOpacity}>
                    {activeUpdate.old === INFTY ? '∞' : activeUpdate.old}
                  </text>
                  {/* new value sliding up into place */}
                  <text x={cx} y={cy + newYShift}
                        textAnchor="middle" fontFamily="var(--font-mono)"
                        fontSize={valueFont} fill="var(--amber-300)"
                        opacity={newOpacity}>
                    {displayedVal}
                  </text>
                </>
              )}
            </g>
          );
        })
      ))}
    </g>
  );
}

// ─── Beat 2: Graph + initial matrix ────────────────────────────────────────
function GrafOgTabellBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.6, 1);

  // Graph fades in first; matrix follows. The matrix shows D_INIT (with ∞ and
  // edge weights). No algorithm motion in this beat — that's beat 4.
  const graphDraw = clamp((localTime - 0.2) / (0.55 * T), 0, 1);
  const matFade = clamp((localTime - 0.32 * T) / 0.6, 0, 1);
  const captionFade = clamp((localTime - 0.55 * T) / 0.5, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <MiniGraph G={G} ox={G.graphX} oy={G.graphY} drawAll={easeInOutCubic(graphDraw)}/>
      {matFade > 0 && (
        <MatrixView
          G={G}
          ox={G.matCx - (G.headerCellW + 4 * G.cellW + 3 * G.gap) / 2}
          oy={G.matCy - (G.headerCellW * 0.55 + G.gap + 4 * G.cellH + 3 * G.gap) / 2}
          D={D_INIT}
          opacity={matFade}/>
      )}
      {captionFade > 0 && (
        <text x={G.svgW / 2} y={portrait ? 1180 : 660}
              textAnchor="middle" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 18 : 18} fill="var(--chalk-200)"
              opacity={captionFade}>
          null på diagonalen, vekt på direkte kanter, uendelig ellers
        </text>
      )}
    </svg>
  );
}

// ─── Beat 3: Recurrence reveal ─────────────────────────────────────────────
// The formula appears, then a small graph in the corner shows i=1, k=2, j=3
// — the chain 1 → 2 → 3 lights up violet, and the matrix cell (1,3) gets a
// candidate halo (still showing ∞, since we have not yet committed any pass).
function RekursjonBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.6, 1);

  // Formula appears first, then "via" chain.
  const formulaT = clamp((localTime - 0.1) / 0.6, 0, 1);
  const chainT = clamp((localTime - 0.30 * T) / (0.30 * T), 0, 1);
  const captionT = clamp((localTime - 0.60 * T) / 0.5, 0, 1);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        <MiniGraph G={G} ox={G.graphX} oy={G.graphY}
                   hotNode={chainT > 0.2 ? 2 : null}
                   flashEdges={chainT > 0.2 ? [{ u: 1, v: 2 }, { u: 2, v: 3 }] : []}
                   drawAll={1}
                   opacity={0.85}/>
      </svg>
      {formulaT > 0 && (
        <div style={{
          position: 'absolute',
          left: portrait ? '50%' : 920,
          top: portrait ? 720 : 280,
          transform: 'translate(-50%, 0)',
          opacity: formulaT,
          fontFamily: 'var(--font-mono)',
          fontSize: G.formulaFont,
          color: 'var(--amber-300)',
          letterSpacing: '0.04em',
          textAlign: 'center',
          maxWidth: portrait ? 660 : 640,
          lineHeight: 1.35,
        }}>
          D[i][j] ← min( D[i][j], <span style={{ color: 'var(--violet-400)' }}>D[i][k] + D[k][j]</span> )
        </div>
      )}
      {chainT > 0.3 && (
        <div style={{
          position: 'absolute',
          left: portrait ? '50%' : 920,
          top: portrait ? 820 : 360,
          transform: 'translate(-50%, 0)',
          opacity: clamp((chainT - 0.3) / 0.5, 0, 1),
          fontFamily: 'var(--font-sans)',
          fontSize: portrait ? 16 : 17,
          color: 'var(--chalk-200)',
          textAlign: 'center',
          maxWidth: portrait ? 600 : 640,
        }}>
          Eksempel: kan vi gå <span style={{ color: 'var(--violet-400)', fontFamily: 'var(--font-mono)' }}>1 → 2 → 3</span> billigere enn direkte?
        </div>
      )}
      {captionT > 0 && (
        <div style={{
          position: 'absolute',
          left: portrait ? '50%' : 920,
          top: portrait ? 900 : 430,
          transform: 'translate(-50%, 0)',
          opacity: captionT,
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 20,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '28ch',
          textAlign: 'center',
        }}>
          Er omveien kortere — bytt.
        </div>
      )}
    </div>
  );
}

// ─── Beat 4: All k passes (GENUINE MOTION — the matrix actually fills) ────
// The execution schedule. For each k = 0..3 we allocate kPhase seconds:
//   • A short "lead" (kLead) where node k highlights, k badge transitions,
//     row k + col k get tinted, but no cell change yet.
//   • Then each update inside this k gets a "slot" of length updSlot, during
//     which the active cell pulses and its value ticks from old → new. A
//     small tail after the last update inside the pass settles the result
//     before the next k begins.
//
// Total budget = duration of this sprite (minus a 1s safety tail). Distribute
// proportionally across 4 k-passes (k=3 gets only the lead — no updates).
function AllePassBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1.0, 1);

  // k=3 has zero updates, so allocate it less budget. Pass weights (sum = 1):
  const weights = [0.28, 0.28, 0.32, 0.12];
  const passStart = [0];
  for (let i = 1; i < 4; i++) passStart.push(passStart[i - 1] + weights[i - 1] * T);
  const passEnd = passStart.map((s, idx) => s + weights[idx] * T);

  function currentK(t) {
    for (let k = 3; k >= 0; k--) if (t >= passStart[k]) return k;
    return -1;
  }

  // Distribute the updates inside each pass.
  // Each pass: lead = 18% of pass length, then updates take ~equal slots,
  // each ~ (passLen - lead) / max(numUpdates, 1) but capped at 2.2s.
  function updatesInPass(k) { return UPDATES.filter(u => u.k === k); }
  function passSchedule(k) {
    const start = passStart[k], len = weights[k] * T;
    const lead = 0.18 * len;
    const ups = updatesInPass(k);
    if (ups.length === 0) {
      return { start, lead, updates: [] };
    }
    const remaining = len - lead;
    const slot = Math.min(remaining / ups.length, 2.4);
    const updates = ups.map((u, idx) => ({
      ...u,
      t0: start + lead + idx * slot,
      t1: start + lead + (idx + 1) * slot,
      slot,
    }));
    return { start, lead, updates };
  }

  // Build a flat list of scheduled updates with absolute timings.
  const schedule = [0, 1, 2, 3].flatMap(k => passSchedule(k).updates);

  // Compute "committed" count and active update at localTime.
  let committed = 0;
  let active = null;
  for (let i = 0; i < schedule.length; i++) {
    const u = schedule[i];
    if (localTime >= u.t1) {
      committed = i + 1;
    } else if (localTime >= u.t0) {
      const progress = clamp((localTime - u.t0) / Math.max(u.t1 - u.t0, 0.001), 0, 1);
      active = { ...u, progress };
      committed = i;  // not yet finalised
      break;
    } else {
      break;
    }
  }

  const k = currentK(localTime);
  const D = matrixAfter(committed);

  // Which already-committed cells belong to the current k pass — used to
  // tint them amber-300 as "improved this pass" until the pass ends.
  const improvedThisPass = new Set();
  if (k >= 0) {
    for (let i = 0; i < committed; i++) {
      const u = schedule[i];
      if (u.k === k) improvedThisPass.add(`${u.i},${u.j}`);
    }
  }

  // For the graph, highlight node k and (if there's an active update) flash
  // the i→k and k→j edges in the mini-graph.
  const flashEdges = [];
  if (active) {
    if (EDGES.some(e => e.u === active.i && e.v === active.k)) {
      flashEdges.push({ u: active.i, v: active.k });
    }
    if (EDGES.some(e => e.u === active.k && e.v === active.j)) {
      flashEdges.push({ u: active.k, v: active.j });
    }
  }

  // Total improvements counter — committed plus the visible "lock-in" of an
  // active update once it's past 50% (so the counter ticks visibly as the
  // value lands, not after a gap).
  const counter = committed + (active && active.progress > 0.55 ? 1 : 0);

  // Layout: graph upper-left/top, matrix to its right (portrait: below),
  //   k badge and counter under the graph.
  const matBoxW = G.headerCellW + 4 * G.cellW + 3 * G.gap;
  const matBoxH = G.headerCellW * 0.55 + G.gap + 4 * G.cellH + 3 * G.gap;
  const matOx = G.matCx - matBoxW / 2;
  const matOy = G.matCy - matBoxH / 2;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Mini-graph with node k highlighted */}
      <MiniGraph G={G} ox={G.graphX} oy={G.graphY}
                 hotNode={k >= 0 ? k : null}
                 flashEdges={flashEdges}
                 drawAll={1}
                 opacity={0.92}/>

      {/* Matrix */}
      <MatrixView G={G} ox={matOx} oy={matOy}
                  D={D}
                  activeUpdate={active}
                  kHighlight={k >= 0 ? k : null}
                  improvedThisPass={improvedThisPass}/>

      {/* k-badge */}
      <SvgFadeIn duration={0.3} delay={0}>
        <g>
          <rect x={G.kBadgeX} y={G.kBadgeY} width={G.kBadgeW} height={G.kBadgeH} rx={10}
                fill="rgba(0,0,0,0.55)" stroke="var(--violet-400)" strokeWidth={1.5}/>
          <text x={G.kBadgeX + 14} y={G.kBadgeY + 22}
                fontFamily="var(--font-mono)" fontSize={G.kBadgeLabel}
                fill="var(--violet-400)" letterSpacing="0.18em">
            MELLOMSTASJON
          </text>
          <text x={G.kBadgeX + 14} y={G.kBadgeY + G.kBadgeH - 12}
                fontFamily="var(--font-mono)" fontSize={G.kBadgeValue}
                fill="var(--chalk-100)">
            k = {k >= 0 ? k : '—'}
          </text>
        </g>
      </SvgFadeIn>

      {/* Improvements counter */}
      <SvgFadeIn duration={0.3} delay={0}>
        <g>
          <rect x={G.counterX} y={G.counterY} width={G.counterW} height={G.counterH} rx={10}
                fill="rgba(0,0,0,0.55)" stroke="var(--amber-400)" strokeWidth={1.5}/>
          <text x={G.counterX + 14} y={G.counterY + 22}
                fontFamily="var(--font-mono)" fontSize={G.counterLabel}
                fill="var(--amber-300)" letterSpacing="0.18em">
            FORBEDRINGER
          </text>
          <text x={G.counterX + 14} y={G.counterY + G.counterH - 12}
                fontFamily="var(--font-mono)" fontSize={G.counterValue}
                fill="var(--amber-300)">
            {counter} / 7
          </text>
        </g>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
// Final matrix on display; two improved paths trace on the mini-graph:
//   0 → 2 → 3   (was 10, now 8)
//   1 → 2 → 3   (was 8,  now 5)
// Then the O(n^3) payoff line appears.
function TakeawayBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.6, 1);

  // First half: show path 1.  Second half: switch to path 2.
  const phaseT = clamp(localTime / T, 0, 1);
  const showPath2 = phaseT > 0.5;
  const currentPath = showPath2 ? TAKEAWAY_PATHS[1] : TAKEAWAY_PATHS[0];

  const payoffT = clamp((localTime - 0.55 * T) / 0.5, 0, 1);

  const matBoxW = G.headerCellW + 4 * G.cellW + 3 * G.gap;
  const matBoxH = G.headerCellW * 0.55 + G.gap + 4 * G.cellH + 3 * G.gap;
  const matOx = G.matCx - matBoxW / 2;
  const matOy = G.matCy - matBoxH / 2;

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        <MiniGraph G={G} ox={G.graphX} oy={G.graphY}
                   pathOverlay={currentPath}
                   drawAll={1}
                   opacity={1}/>

        <MatrixView G={G} ox={matOx} oy={matOy}
                    D={D_FINAL}
                    activeUpdate={null}
                    kHighlight={null}/>

        {/* Highlight which cell on the matrix the current path describes */}
        {(() => {
          const i = currentPath.from, j = currentPath.to;
          const cx = matOx + G.headerCellW + j * (G.cellW + G.gap) + G.cellW / 2;
          const cy = matOy + G.headerCellW * 0.55 + G.gap + i * (G.cellH + G.gap) + G.cellH / 2;
          return (
            <g>
              <rect x={cx - G.cellW / 2 - 4} y={cy - G.cellH / 2 - 4}
                    width={G.cellW + 8} height={G.cellH + 8} rx={10}
                    fill="none" stroke={currentPath.color} strokeWidth={2.4}/>
            </g>
          );
        })()}

        {/* Caption next to graph */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.graphX + G.graphSize / 2}
                y={G.graphY + G.graphSize + (portrait ? 36 : 30)}
                textAnchor="middle" fontFamily="var(--font-mono)"
                fontSize={portrait ? 16 : 15}
                fill={currentPath.color}>
            {currentPath.via.join(' → ')} &nbsp;&nbsp; {currentPath.oldVal} → {currentPath.newVal}
          </text>
        </SvgFadeIn>
      </svg>

      {/* Payoff: formula + complexity */}
      {payoffT > 0 && (
        <div style={{
          position: 'absolute',
          left: '50%',
          top: portrait ? 1110 : 660,
          transform: 'translate(-50%, 0)',
          textAlign: 'center',
          opacity: payoffT,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 24,
            color: 'var(--chalk-100)',
          }}>
            Én ny mellomstasjon av gangen — så er du <span style={{ color: 'var(--amber-300)' }}>ferdig</span>.
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: portrait ? 22 : 26,
            color: 'var(--amber-300)',
          }}>
            Floyd–Warshall ∈ O(n<sup style={{ fontSize: '0.6em' }}>3</sup>)
          </div>
        </div>
      )}
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
