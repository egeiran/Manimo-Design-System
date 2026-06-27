// Floyd-Warshall: tillat én mellomstopp om gangen — Manimo lesson scene.
// Chapter 11 of algdat (Korteste vei mellom alle par). Where Dijkstra
// answers "how far from this one start to every other vertex," Floyd-
// Warshall answers "how far between every pair of vertices, at once."
// The trick is brutal and beautiful: build an n×n distance matrix and
// update it n times — once per "intermediate stop allowed." Round k asks,
// for every (i, j) pair: is going i → k → j shorter than what I have?
//
// We trace it on 4 nodes and 6 directed weighted edges. The matrix starts
// as direct distances (diagonal 0, edges as weights, ∞ everywhere else).
// Seven updates land across four rounds — including a late re-relaxation
// where cell (3, 2) first falls from ∞ to 5 via vertex 1, then refines
// to 2 via vertex 4. That moment is the chapter's whole point: allowing
// more intermediates can keep shortening paths that were already finite.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9   Manimo hook
//    9–19   Graf + tabell-oppsett: D⁰ = direct edges only
//   19–35   Runde k=1 og k=2 (GENUINE MOTION — 3 cells flip ∞ → finite)
//   35–53   Runde k=3 og k=4 (GENUINE MOTION — 4 cells, including the late
//                              (3,2) re-relaxation from 5 down to 2)
//   53–65   Takeaway: tillat én mellomstopp om gangen, O(n³)
//
// Colour discipline:
//   chalk-100  high-contrast text (node letters, caption body)
//   chalk-200  matrix axis labels, secondary text
//   chalk-300  dim labels, ∞ placeholders, idle matrix borders
//   amber-400  primary stroke (settled edges, active relaxation path)
//   amber-300  updated cell values, formula, payoff
//   teal-400   round-k row/col highlight, "cell under test" pulse
//   rose-300   update counter badge ("oppdateringer N/7")
//   violet-400 connector arrowheads in the graph
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 68;

const NARRATION = [
  /*  0– 9 */ 'Du vil vite korteste vei fra hver node til hver eneste annen — på én gang. Dijkstra svarer for én startnode. Hva med alle samtidig?',
  /*  9–19 */ 'Vi setter opp en tabell: rad i, kolonne j, verdien er korteste kjente vei fra i til j. I starten vet vi bare om de direkte kantene — alt annet står på uendelig.',
  /* 19–35 */ 'Nå tillater vi én mellomstopp om gangen. Runde én — kan vi bli kortere ved å hoppe via node én? Tre til to åpner seg fra ingenting til fem. Runde to — via node to: én til tre lander på sju, fire til tre på fem.',
  /* 35–53 */ 'Via node tre faller mange tall på plass: to til én blir seks, to til fire blir fem, fire til én blir sju. Og når vi til slutt tillater node fire som mellomstopp, finner vi en enda kortere vei fra tre til to — tre til fire til to, bare to.',
  /* 53–65 */ 'Floyd-Warshall: tillat én og én mellomstopp. Fire runder over alle par i og j — n i tredje, og du har korteste vei mellom hver eneste node.',
];

const NARRATION_AUDIO = 'audio/floyd-warshall-mellomstopp/scene.mp3';

// ─── Graph + initial matrix data ───────────────────────────────────────────
// Four vertices, six directed weighted edges. Drawn as a square with
// diagonals to give every pair a possible two-hop path through a third
// vertex — exactly what Floyd-Warshall hunts for.
const NODE_IDS = [1, 2, 3, 4];

const EDGES = [
  [1, 2, 3],
  [1, 4, 5],
  [2, 3, 4],
  [3, 1, 2],
  [3, 4, 1],
  [4, 2, 1],
];

// Initial distance matrix D⁰: diagonal 0, edges as weights, ∞ elsewhere.
function initialMatrix() {
  const D = {};
  for (const i of NODE_IDS) {
    D[i] = {};
    for (const j of NODE_IDS) D[i][j] = i === j ? 0 : Infinity;
  }
  for (const [u, v, w] of EDGES) D[u][v] = w;
  return D;
}

// The seven updates Floyd-Warshall lands on this graph, in trace order.
// Each event also names the two-hop path (i → k → j) so the graph layer
// can light it at the same moment as the matrix value ticks.
const UPDATES = [
  // Round k=1 — only (3, 2) wins, via 3→1→2 (2 + 3 = 5)
  { k: 1, i: 3, j: 2, oldD: Infinity, newD: 5 },
  // Round k=2 — (1, 3) via 1→2→3 (3 + 4 = 7), (4, 3) via 4→2→3 (1 + 4 = 5)
  { k: 2, i: 1, j: 3, oldD: Infinity, newD: 7 },
  { k: 2, i: 4, j: 3, oldD: Infinity, newD: 5 },
  // Round k=3 — three wins through vertex 3
  { k: 3, i: 2, j: 1, oldD: Infinity, newD: 6 },  // 2→3→1 (4 + 2)
  { k: 3, i: 2, j: 4, oldD: Infinity, newD: 5 },  // 2→3→4 (4 + 1)
  { k: 3, i: 4, j: 1, oldD: Infinity, newD: 7 },  // 4→3→1 (5 + 2) — uses k=2's update
  // Round k=4 — the late refinement: (3, 2) drops from 5 to 2 via 3→4→2
  { k: 4, i: 3, j: 2, oldD: 5, newD: 2 },
];
const TOTAL_UPDATES = UPDATES.length;

// Group updates by round so the choreography can fade row/col k highlight
// on/off cleanly at round boundaries.
const ROUNDS = (() => {
  const r = {};
  for (const u of UPDATES) (r[u.k] = r[u.k] || []).push(u);
  return r;
})();

// ─── Layout ────────────────────────────────────────────────────────────────
// Graph left, matrix right in landscape. In portrait we stack: graph on top,
// matrix below, with the recurrence formula and action strip floating
// between them.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      // Graph
      graphTop: 230, graphBot: 540,
      nodePos: {
        1: { x: 200, y: 280 },
        2: { x: 540, y: 280 },
        3: { x: 200, y: 510 },
        4: { x: 540, y: 510 },
      },
      nodeR: 30, weightFont: 13,
      letterFont: 22,
      // Formula + recurrence
      formulaY: 600, formulaFont: 18,
      // Matrix
      matRowX: 165, matRowY: 720,
      cellW: 96, cellH: 80, gap: 8,
      cellValFont: 24, cellDimFont: 13, indexFont: 13,
      headerColY: 700, headerRowX: 130,
      // Action strip
      actionY: 1110, actionFont: 16,
      // Counter sits in the empty band BELOW the title block and ABOVE the
      // graph — far from the formula and from the j-column headers.
      counterX: 90, counterY: 200,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    // Graph
    graphTop: 200, graphBot: 600,
    nodePos: {
      1: { x: 130, y: 240 },
      2: { x: 470, y: 240 },
      3: { x: 130, y: 520 },
      4: { x: 470, y: 520 },
    },
    nodeR: 30, weightFont: 13,
    letterFont: 22,
    // Formula
    formulaY: 170, formulaFont: 20,
    // Matrix
    matRowX: 760, matRowY: 230,
    cellW: 88, cellH: 78, gap: 7,
    cellValFont: 24, cellDimFont: 13, indexFont: 13,
    headerColY: 215, headerRowX: 730,
    // Action strip
    actionY: 640, actionFont: 14,
    // Counter sits top-right above the matrix so it clears the centred
    // recurrence formula (~x 220..700, y 170) on the left half of the canvas.
    counterX: 1090, counterY: 180,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Cell top-left in matrix coords.
function cellTL(G, iIdx, jIdx) {
  return {
    x: G.matRowX + jIdx * (G.cellW + G.gap),
    y: G.matRowY + iIdx * (G.cellH + G.gap),
  };
}

function fmtVal(v) {
  if (v === Infinity || v === undefined || v === null) return '∞'; // ∞
  return String(v);
}

// ─── Directed-edge geometry ────────────────────────────────────────────────
// All edges drawn as straight lines with a small arrowhead just before the
// target node. Length is shortened by `nodeR + 4` so the arrowhead sits
// clear of the circle. Weight label rides perpendicular at the midpoint,
// pulled slightly off the line so it doesn't sit on top of a crossing.
function edgeEndpoints(G, u, v) {
  const a = G.nodePos[u], b = G.nodePos[v];
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const startR = G.nodeR + 2;
  const endR = G.nodeR + 6;
  return {
    x1: a.x + ux * startR, y1: a.y + uy * startR,
    x2: b.x - ux * endR,   y2: b.y - uy * endR,
    nx: -uy, ny: ux,                // perpendicular (for label + arrowhead)
    ux, uy, len,
  };
}

// Side preference: for diagonal edges (1↔4 and 2↔3 crossing pair) push the
// weight labels apart so they don't pile on top of each other.
function weightOffset(u, v) {
  // Pairs that cross the centre point get extra perpendicular offset.
  if ((u === 1 && v === 4) || (u === 4 && v === 1)) return 20;
  if ((u === 2 && v === 3) || (u === 3 && v === 2)) return -20;
  return 14;
}

// How far along the edge (0..1) to anchor the weight label. Diagonals
// place their labels off-centre so the two crossing labels don't collide
// at the X-intersection point. Direct edges sit at the midpoint.
function weightAlong(u, v) {
  if ((u === 1 && v === 4) || (u === 4 && v === 1)) return 0.30;
  if ((u === 2 && v === 3) || (u === 3 && v === 2)) return 0.70;
  return 0.5;
}

// ─── Graph rendering ──────────────────────────────────────────────────────
function GraphFloyd({ G, activePath = null, edgeAlpha = 1 }) {
  // activePath is { i, k, j } — we light edges (i,k) and (k,j) amber to
  // show the two-hop relaxation currently animating in the matrix.
  const isHotEdge = (u, v) =>
    activePath && (
      (u === activePath.i && v === activePath.k) ||
      (u === activePath.k && v === activePath.j)
    );

  return (
    <>
      {/* Arrow marker definitions — one per colour state. */}
      <defs>
        <marker id="fwArrowIdle" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--violet-400)" opacity="0.65"/>
        </marker>
        <marker id="fwArrowHot" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="8" markerHeight="8" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--amber-400)"/>
        </marker>
      </defs>

      {/* Edges */}
      {EDGES.map(([u, v, w]) => {
        const e = edgeEndpoints(G, u, v);
        const hot = isHotEdge(u, v);
        const stroke = hot ? 'var(--amber-400)' : 'rgba(232,220,193,0.36)';
        const width = hot ? 3.2 : 1.8;
        const marker = hot ? 'url(#fwArrowHot)' : 'url(#fwArrowIdle)';
        const opacity = hot ? 1 : edgeAlpha;
        // Weight label placement — anchored at weightAlong() fraction so
        // diagonals' labels don't pile up at the X-crossing centre.
        const f = weightAlong(u, v);
        const mx = e.x1 + (e.x2 - e.x1) * f;
        const my = e.y1 + (e.y2 - e.y1) * f;
        const off = weightOffset(u, v);
        const wx = mx + e.nx * off;
        const wy = my + e.ny * off;
        return (
          <g key={`fwE-${u}-${v}`} opacity={opacity}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke={stroke} strokeWidth={width}
                  strokeLinecap="round"
                  markerEnd={marker}/>
            <rect x={wx - 10} y={wy - 9} width={20} height={18} rx={4}
                  fill="rgba(0,0,0,0.85)"/>
            <text x={wx} y={wy + G.weightFont * 0.34}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.weightFont}
                  fill={hot ? 'var(--amber-300)' : 'var(--chalk-300)'}>
              {w}
            </text>
          </g>
        );
      })}

      {/* Nodes — circles with their numeric id. The node sitting at the
          active intermediate vertex k (if any) gets a teal halo. */}
      {NODE_IDS.map((id) => {
        const p = G.nodePos[id];
        const isIntermediate = activePath && activePath.k === id;
        const ring = isIntermediate ? 'var(--teal-400)' : 'var(--amber-400)';
        const fill = isIntermediate
          ? 'rgba(0,0,0,0.55)'
          : 'rgba(0,0,0,0.55)';
        return (
          <g key={`fwN-${id}`}>
            {isIntermediate && (
              <circle cx={p.x} cy={p.y} r={G.nodeR + 8}
                      fill="none" stroke="var(--teal-400)"
                      strokeWidth={1.4} opacity={0.55}/>
            )}
            <circle cx={p.x} cy={p.y} r={G.nodeR}
                    fill={fill} stroke={ring} strokeWidth={1.8}/>
            <text x={p.x} y={p.y + G.letterFont * 0.36}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.letterFont} fill="var(--chalk-100)">
              {id}
            </text>
          </g>
        );
      })}
    </>
  );
}

// ─── Matrix rendering ─────────────────────────────────────────────────────
// snap shape:
//   D            { i: { j: number | Infinity } }
//   highlightK   number | null  — round k currently active (row+col band)
//   activeCell   { i, j, oldD, newD, prog } | null
//   appearProg   0..1 — fades the whole matrix in for the initial-state beat
//   cellAppear   { i: { j: 0..1 } } | null — per-cell fill-in for beat 2
function MatrixFloyd({ G, snap }) {
  const { D, highlightK, activeCell, appearProg = 1, cellAppear = null } = snap;

  // Index helpers.
  const idxOf = (id) => NODE_IDS.indexOf(id);

  // Row/column highlight band — a translucent teal stripe behind the matrix
  // body that picks out the k-th row and k-th column.
  const bandTL = highlightK ? cellTL(G, idxOf(highlightK), 0) : null;
  const colTL  = highlightK ? cellTL(G, 0, idxOf(highlightK)) : null;
  const rowW = 4 * (G.cellW + G.gap) - G.gap;
  const rowH = G.cellH;
  const colW = G.cellW;
  const colH = 4 * (G.cellH + G.gap) - G.gap;

  return (
    <g opacity={appearProg}>
      {/* Header indices — column j across the top, row i down the left. */}
      {NODE_IDS.map((j, jIdx) => {
        const tl = cellTL(G, 0, jIdx);
        const hot = highlightK === j;
        return (
          <text key={`fwH-col-${j}`}
                x={tl.x + G.cellW / 2} y={G.headerColY}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.indexFont}
                fill={hot ? 'var(--teal-400)' : 'var(--chalk-300)'}
                letterSpacing="0.18em">
            j={j}
          </text>
        );
      })}
      {NODE_IDS.map((i, iIdx) => {
        const tl = cellTL(G, iIdx, 0);
        const hot = highlightK === i;
        return (
          <text key={`fwH-row-${i}`}
                x={G.headerRowX} y={tl.y + G.cellH / 2 + G.indexFont * 0.34}
                textAnchor="end"
                fontFamily="var(--font-mono)" fontSize={G.indexFont}
                fill={hot ? 'var(--teal-400)' : 'var(--chalk-300)'}
                letterSpacing="0.18em">
            i={i}
          </text>
        );
      })}

      {/* Row + column highlight band (k). Teal opacity via fillOpacity so
          the lint allowlist (chalk/amber/rose/violet rgba only) stays happy. */}
      {highlightK && bandTL && (
        <>
          <rect x={bandTL.x - G.gap / 2} y={bandTL.y - G.gap / 2}
                width={rowW + G.gap} height={rowH + G.gap}
                rx={10} fill="var(--teal-400)" fillOpacity={0.10}
                stroke="var(--teal-400)" strokeWidth={1.2}/>
          <rect x={colTL.x - G.gap / 2} y={colTL.y - G.gap / 2}
                width={colW + G.gap} height={colH + G.gap}
                rx={10} fill="var(--teal-400)" fillOpacity={0.10}
                stroke="var(--teal-400)" strokeWidth={1.2}/>
        </>
      )}

      {/* Cells */}
      {NODE_IDS.map((i, iIdx) =>
        NODE_IDS.map((j, jIdx) => {
          const tl = cellTL(G, iIdx, jIdx);
          const isDiag = i === j;
          // Per-cell appear progress for the initial-state beat.
          const cellOpacity = cellAppear ? clamp((cellAppear[i] || {})[j] || 0, 0, 1) : 1;
          // Is this the active animating cell?
          const isActive = activeCell && activeCell.i === i && activeCell.j === j;
          const cellHotProg = isActive ? clamp(activeCell.prog, 0, 1) : 0;
          // Border + background.
          const finiteVal = D[i][j] !== Infinity;
          const settledBorder = finiteVal
            ? 'var(--amber-400)'
            : 'rgba(232,220,193,0.22)';
          const dashed = finiteVal ? undefined : '5 4';
          const baseBg = finiteVal
            ? (isDiag ? 'rgba(244,184,96,0.07)' : 'rgba(244,184,96,0.13)')
            : 'rgba(0,0,0,0.30)';
          // Teal "thinking" overlay uses fillOpacity (avoids raw rgba lint).
          const hotProg = cellHotProg;
          const bg = hotProg > 0 ? 'var(--teal-400)' : baseBg;
          const bgFillOpacity = hotProg > 0 ? (0.10 + 0.25 * hotProg) : 1;
          const border = cellHotProg > 0 ? 'var(--teal-400)' : settledBorder;
          const borderW = cellHotProg > 0 ? 2.2 : 1.5;

          // Decide which value (old vs new) to show during a transition.
          // Animation phases inside activeCell.prog:
          //   0.00..0.45  show oldD; pulse teal (cell "thinking")
          //   0.45..0.70  cross-fade old → new
          //   0.70..1.00  show newD; settle to amber border
          let displayVal = D[i][j];
          let valColor = finiteVal ? 'var(--chalk-100)' : 'var(--chalk-300)';
          let crossOpacity = 0;
          let newOpacity = 0;
          let newVal = null;
          if (isActive) {
            const p = activeCell.prog;
            if (p < 0.45) {
              displayVal = activeCell.oldD;
              valColor = 'var(--chalk-200)';
            } else if (p < 0.70) {
              const t = (p - 0.45) / 0.25;
              displayVal = activeCell.oldD;
              crossOpacity = 1 - t;
              newOpacity = t;
              newVal = activeCell.newD;
              valColor = 'var(--chalk-300)';
            } else {
              displayVal = activeCell.newD;
              valColor = 'var(--amber-300)';
              newOpacity = 0;
            }
          }

          if (cellOpacity <= 0) return null;
          const cx = tl.x + G.cellW / 2;
          const cy = tl.y + G.cellH / 2 + G.cellValFont * 0.36;

          return (
            <g key={`fwC-${i}-${j}`} opacity={cellOpacity}>
              <rect x={tl.x} y={tl.y} width={G.cellW} height={G.cellH} rx={8}
                    fill={bg} fillOpacity={bgFillOpacity}
                    stroke={border} strokeWidth={borderW}
                    strokeDasharray={dashed}/>
              {/* Old value (or current settled value when not active). */}
              <text x={cx} y={cy} textAnchor="middle"
                    fontFamily="var(--font-mono)" fontSize={G.cellValFont}
                    fill={valColor}
                    opacity={isActive && newOpacity > 0 ? crossOpacity : 1}>
                {fmtVal(displayVal)}
              </text>
              {/* New value crossfading in. */}
              {isActive && newOpacity > 0 && (
                <text x={cx} y={cy} textAnchor="middle"
                      fontFamily="var(--font-mono)" fontSize={G.cellValFont}
                      fill="var(--amber-300)" opacity={newOpacity}>
                  {fmtVal(newVal)}
                </text>
              )}
            </g>
          );
        })
      )}
    </g>
  );
}

// ─── Update counter badge ─────────────────────────────────────────────────
function UpdateCounter({ G, completed, total }) {
  return (
    <g>
      <rect x={G.counterX - 8} y={G.counterY - 22}
            width={150} height={46} rx={10}
            fill="rgba(0,0,0,0.55)"
            stroke="var(--rose-400)" strokeWidth={1.4}/>
      <text x={G.counterX + 6} y={G.counterY - 4}
            fontFamily="var(--font-mono)" fontSize={10}
            fill="var(--rose-300)" letterSpacing="0.18em">
        OPPDATERINGER
      </text>
      <text x={G.counterX + 6} y={G.counterY + 16}
            fontFamily="var(--font-mono)" fontSize={18}
            fill="var(--rose-300)">
        {completed} / {total}
      </text>
    </g>
  );
}

// ─── Scheduler ────────────────────────────────────────────────────────────
// Given a list of "phases" with weights and an event list, produce, for a
// given localTime, the snapshot the renderers expect: D so far, the active
// cell + its progress, which round k is highlighted, and how many updates
// have completed.
//
// A "phase" is one round and looks like:
//   { k, intro: 0.18, events: [{i,j,oldD,newD}], outro: 0.10 }
// intro = fraction of round time spent fading the row/col highlight in,
// outro = fraction spent fading it out and switching to the next round.
function runFloyd(updates, baseMatrix) {
  // Apply each update in order and return matrix snapshots after each step.
  const snapshots = [JSON.parse(JSON.stringify(baseMatrix, (k, v) => v === Infinity ? '__inf' : v))];
  // Re-hydrate ∞ markers.
  for (const snap of snapshots) {
    for (const i of NODE_IDS) for (const j of NODE_IDS) if (snap[i][j] === '__inf') snap[i][j] = Infinity;
  }
  let cur = JSON.parse(JSON.stringify(snapshots[0], (k, v) => v === Infinity ? '__inf' : v));
  for (const i of NODE_IDS) for (const j of NODE_IDS) if (cur[i][j] === '__inf') cur[i][j] = Infinity;
  for (const u of updates) {
    cur = { 1: { ...cur[1] }, 2: { ...cur[2] }, 3: { ...cur[3] }, 4: { ...cur[4] } };
    cur[u.i][u.j] = u.newD;
    snapshots.push(cur);
  }
  return snapshots;
}

function makeRoundScheduler(T, rounds) {
  // rounds: [{ k, events: [...], weight }]
  // Each round = intro + events evenly + outro.
  const INTRO_FRAC = 0.12;
  const OUTRO_FRAC = 0.06;
  const total = rounds.reduce((s, r) => s + r.weight, 0);
  const margin = 0.04 * T;
  const usable = T - 2 * margin;
  const roundStarts = [];
  let acc = margin;
  for (const r of rounds) {
    roundStarts.push(acc);
    acc += usable * r.weight / total;
  }
  roundStarts.push(acc);

  return function atTime(localTime) {
    // Find current round.
    let idx = -1;
    for (let i = 0; i < rounds.length; i++) {
      if (localTime >= roundStarts[i]) idx = i;
    }
    if (idx < 0) {
      return { highlightK: null, activeIdx: null, activeProg: 0, completed: 0, roundIdx: -1 };
    }
    const r = rounds[idx];
    const lo = roundStarts[idx];
    const hi = roundStarts[idx + 1];
    const span = Math.max(0.001, hi - lo);
    const frac = clamp((localTime - lo) / span, 0, 1);
    // Highlight band visible from 0..(1 - OUTRO_FRAC).
    const highlightK = frac < (1 - OUTRO_FRAC) ? r.k : null;
    // Event slot computation.
    const eventBand = 1 - INTRO_FRAC - OUTRO_FRAC;
    const completedPrevRounds = rounds.slice(0, idx).reduce((s, rr) => s + rr.events.length, 0);
    if (r.events.length === 0 || frac < INTRO_FRAC) {
      return { highlightK, activeIdx: null, activeProg: 0,
               completed: completedPrevRounds, roundIdx: idx };
    }
    if (frac > 1 - OUTRO_FRAC) {
      return { highlightK, activeIdx: null, activeProg: 0,
               completed: completedPrevRounds + r.events.length, roundIdx: idx };
    }
    const inBand = (frac - INTRO_FRAC) / eventBand;
    const N = r.events.length;
    const slotIdx = Math.min(N - 1, Math.floor(inBand * N));
    const inSlot = inBand * N - slotIdx;
    return {
      highlightK,
      activeIdx: slotIdx,
      activeProg: clamp(inSlot, 0, 1),
      completed: completedPrevRounds + slotIdx,
      roundIdx: idx,
    };
  };
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="korteste vei mellom alle par"
      title="Floyd-Warshall: tillat én mellomstopp"
      duration={SCENE_DURATION}
      introEnd={11.04}
      introCaption="Korteste vei mellom alle par — én mellomstopp om gangen."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.04} end={24.51}>
        <TabellOgGrafBeat/>
      </Sprite>

      <Sprite start={24.51} end={40.41}>
        <RundeBeat
          rounds={[
            { k: 1, events: ROUNDS[1], weight: 1.2 },
            { k: 2, events: ROUNDS[2], weight: 1.6 },
          ]}
          completedOffset={0}
          hintText="kortere via mellomstopp? — bytt om verdien"/>
      </Sprite>

      <Sprite start={40.41} end={56.77}>
        <RundeBeat
          rounds={[
            { k: 3, events: ROUNDS[3], weight: 1.7 },
            { k: 4, events: ROUNDS[4], weight: 1.4 },
          ]}
          completedOffset={ROUNDS[1].length + ROUNDS[2].length}
          baseUpdates={[...ROUNDS[1], ...ROUNDS[2]]}
          hintText="samme celle kan vinne flere ganger — flere mellomstopp åpner nye veier"/>
      </Sprite>

      <Sprite start={56.77} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Initial state — graph + D⁰ tabell ────────────────────────────
// Edges trace in, then matrix cells fill: diagonal first, direct-edge cells
// next, ∞ placeholders last.
function TabellOgGrafBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Graph: nodes pop in 0.05..0.20T, edges 0.20..0.45T.
  const nodeVis = (id) => {
    const order = NODE_IDS.indexOf(id);
    const t0 = at(0.05 + order * 0.05);
    return clamp((localTime - t0) / 0.5, 0, 1);
  };
  const graphAlpha = clamp((localTime - at(0.2)) / 0.6, 0, 1);

  // Matrix appearance schedule:
  //   0.40..0.50T  matrix frame + headers fade in
  //   0.50..0.65T  diagonal cells (i==j) flip from dashed to amber with 0
  //   0.55..0.80T  direct-edge cells (D[i][j] = w) populate with their weight
  //   0.78..0.95T  ∞ placeholders settle into the empty cells
  const matAppear = clamp((localTime - at(0.40)) / 0.4, 0, 1);

  const D = initialMatrix();
  const cellAppear = {};
  for (const i of NODE_IDS) {
    cellAppear[i] = {};
    for (const j of NODE_IDS) {
      if (i === j) {
        cellAppear[i][j] = clamp((localTime - at(0.50)) / 0.30, 0, 1);
      } else if (D[i][j] !== Infinity) {
        // Spread the six edge-cells over a 0.25T window.
        const eIdx = EDGES.findIndex(([u, v]) => u === i && v === j);
        const t0 = at(0.55 + eIdx * 0.04);
        cellAppear[i][j] = clamp((localTime - t0) / 0.30, 0, 1);
      } else {
        cellAppear[i][j] = clamp((localTime - at(0.78)) / 0.40, 0, 1);
      }
    }
  }

  // For the graph node states, we render them with no intermediate
  // highlight — clean walk-on. We piggy-back GraphFloyd by passing no
  // activePath. Node opacity is implicit through edgeAlpha — but nodes
  // themselves don't honour edgeAlpha. Render conditionally.
  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Recurrence preview formula sits where the live formula will live
          during the round beats, so the eye gets used to the position. */}
      <SvgFadeIn duration={0.4} delay={0.05}>
        <text x={portrait ? 360 : 460} y={G.formulaY}
              textAnchor="middle" fontFamily="var(--font-mono)"
              fontSize={G.formulaFont} fill="var(--chalk-300)">
          D[i][j] &nbsp;=&nbsp; korteste vei fra i til j
        </text>
      </SvgFadeIn>

      {/* Graph layer with edge alpha tied to graphAlpha. We render edges
          and nodes separately so each node can fade independently. */}
      {/* Arrow defs */}
      <defs>
        <marker id="fwIArrow" viewBox="0 0 10 10" refX="9" refY="5"
                markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--violet-400)" opacity="0.65"/>
        </marker>
      </defs>
      {EDGES.map(([u, v, w]) => {
        const e = edgeEndpoints(G, u, v);
        const vis = Math.min(nodeVis(u), nodeVis(v));
        const draw = clamp((vis - 0.3) / 0.6, 0, 1);
        const len = e.len;
        const f = weightAlong(u, v);
        const mx = e.x1 + (e.x2 - e.x1) * f;
        const my = e.y1 + (e.y2 - e.y1) * f;
        const off = weightOffset(u, v);
        const wx = mx + e.nx * off;
        const wy = my + e.ny * off;
        return (
          <g key={`tg-e-${u}-${v}`} opacity={graphAlpha}>
            <line x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2}
                  stroke="rgba(232,220,193,0.36)" strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeDasharray={len}
                  strokeDashoffset={(1 - draw) * len}
                  markerEnd={draw >= 0.95 ? 'url(#fwIArrow)' : undefined}/>
            {draw > 0.4 && (
              <g opacity={clamp((draw - 0.4) / 0.5, 0, 1)}>
                <rect x={wx - 10} y={wy - 9} width={20} height={18} rx={4}
                      fill="rgba(0,0,0,0.85)"/>
                <text x={wx} y={wy + G.weightFont * 0.34}
                      textAnchor="middle" fontFamily="var(--font-mono)"
                      fontSize={G.weightFont} fill="var(--chalk-300)">
                  {w}
                </text>
              </g>
            )}
          </g>
        );
      })}
      {NODE_IDS.map((id) => {
        const p = G.nodePos[id];
        const v = nodeVis(id);
        if (v <= 0) return null;
        return (
          <g key={`tg-n-${id}`} opacity={v}>
            <circle cx={p.x} cy={p.y} r={G.nodeR}
                    fill="rgba(0,0,0,0.55)"
                    stroke="var(--amber-400)" strokeWidth={1.8}/>
            <text x={p.x} y={p.y + G.letterFont * 0.36}
                  textAnchor="middle" fontFamily="var(--font-mono)"
                  fontSize={G.letterFont} fill="var(--chalk-100)">
              {id}
            </text>
          </g>
        );
      })}

      {/* Matrix */}
      <g opacity={matAppear}>
        <MatrixFloyd G={G} snap={{
          D, highlightK: null, activeCell: null,
          appearProg: 1, cellAppear,
        }}/>
      </g>
    </svg>
  );
}

// ─── Beats 3 + 4: Runde-beats (GENUINE MOTION) ────────────────────────────
// One reusable component drives both motion beats. Accepts the round list,
// an optional set of already-applied updates from prior beats (so beat 4
// starts with k=1/k=2 updates baked in), and an "updates completed so far"
// offset for the counter.
function RundeBeat({ rounds, completedOffset = 0, baseUpdates = [], hintText }) {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const sched = makeRoundScheduler(T, rounds);
  const progress = sched(localTime);

  // Build the live distance matrix at this exact instant.
  const baseMatrix = initialMatrix();
  for (const u of baseUpdates) baseMatrix[u.i][u.j] = u.newD;
  // Apply completed updates within THIS beat's rounds.
  let appliedThisBeat = 0;
  for (let r = 0; r < rounds.length; r++) {
    if (progress.roundIdx > r) {
      for (const ev of rounds[r].events) {
        baseMatrix[ev.i][ev.j] = ev.newD;
        appliedThisBeat++;
      }
    } else if (progress.roundIdx === r && progress.activeIdx !== null) {
      for (let k = 0; k < progress.activeIdx; k++) {
        baseMatrix[rounds[r].events[k].i][rounds[r].events[k].j] = rounds[r].events[k].newD;
        appliedThisBeat++;
      }
    }
  }

  // Active cell descriptor (for the matrix renderer).
  let activeCell = null;
  let activePath = null;
  let actionLine = null;
  if (progress.roundIdx >= 0 && progress.activeIdx !== null) {
    const round = rounds[progress.roundIdx];
    const ev = round.events[progress.activeIdx];
    if (ev) {
      activeCell = { i: ev.i, j: ev.j, oldD: ev.oldD, newD: ev.newD, prog: progress.activeProg };
      activePath = { i: ev.i, k: round.k, j: ev.j };
      // Action strip text.
      const oldStr = ev.oldD === Infinity ? '∞' : String(ev.oldD);
      actionLine = {
        text: `k=${round.k}  •  (${ev.i}, ${ev.j}): ${oldStr} → ${ev.newD}`,
        color: 'var(--amber-300)',
      };
    }
  } else if (progress.roundIdx >= 0) {
    actionLine = {
      text: `runde k = ${rounds[progress.roundIdx].k}  •  tillat ${rounds[progress.roundIdx].k} som mellomstopp`,
      color: 'var(--teal-400)',
    };
  }

  const completedTotal = completedOffset + progress.completed;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Live recurrence formula above the matrix. */}
      <text x={portrait ? 360 : 460} y={G.formulaY}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.formulaFont} fill="var(--amber-300)">
        D[i][j] = min(D[i][j], D[i][k] + D[k][j])
      </text>

      {/* Graph (with active two-hop path lit). */}
      <GraphFloyd G={G} activePath={activePath}/>

      {/* Matrix */}
      <MatrixFloyd G={G} snap={{
        D: baseMatrix,
        highlightK: progress.highlightK,
        activeCell,
        appearProg: 1,
      }}/>

      {/* Update counter */}
      <UpdateCounter G={G} completed={completedTotal} total={TOTAL_UPDATES}/>

      {/* Action strip */}
      {actionLine && (
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.actionFont}
              fill={actionLine.color} letterSpacing="0.10em">
          {actionLine.text}
        </text>
      )}

      {/* Hint line (italic serif, dimmer) under the action strip. */}
      {hintText && (
        <text x={G.svgW / 2} y={G.actionY + 22}
              textAnchor="middle"
              fontFamily="var(--font-sans)" fontStyle="italic"
              fontSize={G.actionFont - 1} fill="var(--chalk-300)">
          {hintText}
        </text>
      )}
    </svg>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
// Final matrix fully populated (no ∞ left), payoff caption + complexity.
function TakeawayBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.4, 1);
  const at = (f) => f * T;

  // Final distance matrix after all updates.
  const D = initialMatrix();
  for (const u of UPDATES) D[u.i][u.j] = u.newD;

  // Sequenced reveals.
  const matT = clamp((localTime - at(0.05)) / 0.55, 0, 1);
  const captionT = clamp((localTime - at(0.40)) / 0.6, 0, 1);
  const formulaT = clamp((localTime - at(0.65)) / 0.5, 0, 1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Graph (idle — all edges chalk-dim, no active path). */}
      <GraphFloyd G={G} activePath={null} edgeAlpha={0.75}/>

      {/* Settled matrix. */}
      <MatrixFloyd G={G} snap={{
        D, highlightK: null, activeCell: null,
        appearProg: matT,
      }}/>

      {/* Caption + formula in the action-strip band. */}
      <g opacity={captionT}>
        <text x={G.svgW / 2} y={G.actionY}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 22 : 24}
              fill="var(--chalk-100)">
          Tillat &eacute;n mellomstopp om gangen.
        </text>
      </g>
      <g opacity={formulaT}>
        <text x={G.svgW / 2} y={G.actionY + 30}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize={portrait ? 19 : 22}
              fill="var(--amber-300)" letterSpacing="0.08em">
          Floyd-Warshall &isin; O(n&sup3;)
        </text>
      </g>
    </svg>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
