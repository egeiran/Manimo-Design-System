// Delta–Y Conversion: A Triangle Becomes a Star — Manimo lesson scene.
// Three resistors forming a triangle between nodes A, B, C convert into a
// Y of three resistors meeting at a central node N. Beat 3 is the genuine
// motion: each Δ-branch resistor smoothly interpolates from its triangle
// side to its Y-spoke position over ~3 seconds.
//
// Beats (placeholder timings — Step 4c overwrites with audio-aligned):
//    0.00– 4.5   Manimo intro + hook
//    4.5–13.0    Delta setup — three nodes, three branches with labels
//   13.0–25.0    Morph — resistors slide from triangle sides to Y spokes (motion)
//   25.0–35.0    Conversion formulas
//   35.0–46.0    Takeaway — what it unlocks
//
// Authoring notes:
//   • Three corner-node terminals A, B, C stay fixed throughout the morph.
//   • Each Δ-branch is parametrised by α ∈ [0,1]: α=0 → triangle side,
//     α=1 → spoke from node to centre N. Interpolation is linear on the
//     two endpoints so the zigzag stays straight; the resistor body
//     re-renders each frame from the current endpoints.

const SCENE_DURATION = 55;

const NARRATION = [
  /*  0.0– 4.5  */ "When a circuit has no series or parallel pairs to collapse, sometimes you can convert a triangle of resistors into a star — same terminals, simpler shape.",
  /*  4.5–13.0 */ "Three nodes A, B, C with a resistor between every pair — that's a delta. Each branch carries the two-node label R sub A B, R sub B C, R sub C A.",
  /* 13.0–25.0 */ "Hold the three corner terminals fixed. Slide the three resistors inward — now they meet at a single point N. Same three nodes, same external behaviour, but Y-shaped.",
  /* 25.0–35.0 */ "Each Y spoke equals the product of its two adjacent delta sides divided by the sum of all three. R sub A is the product of the two branches meeting at A — divided by the total.",
  /* 35.0–46.0 */ "Now any bridge or mesh that defeated series-parallel reduction is back in play. Convert the awkward triangle and the rest collapses.",
];

const NARRATION_AUDIO = 'audio/delta-y-conversion/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Delta–Y Conversion: A Triangle Becomes a Star"
      duration={SCENE_DURATION}
      introEnd={9.42}
      introCaption="Stuck on a circuit? Turn the triangle into a star."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.42} end={22.3}>
        <DeltaSetupBeat />
      </Sprite>

      <Sprite start={22.3} end={33.41}>
        <MorphBeat />
      </Sprite>

      <Sprite start={33.41} end={45.19}>
        <FormulasBeat />
      </Sprite>

      <Sprite start={45.19} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Geometry — corner nodes + Y centre ─────────────────────────────────
// Three corners arranged as equilateral triangle, apex at top. Centre node
// N is the centroid. Both aspects use the same logic; only the viewBox
// scales.
function deltaGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 540,
      cx: 300, cy: 290, R: 170,         // ring radius for corner nodes
      labelR: 200,                       // label radius (outside the nodes)
      bodyShrink: 36,                    // pull resistor endpoints in from nodes
      nodeR: 9, resAmp: 9, resN: 6,
      tagFont: 18, valFont: 13,
    };
  }
  return {
    vbW: 760, vbH: 460,
    cx: 380, cy: 250, R: 180,
    labelR: 218,
    bodyShrink: 40,
    nodeR: 10, resAmp: 11, resN: 7,
    tagFont: 20, valFont: 14,
  };
}

// Returns the three corner positions A (top), B (bottom-right), C (bottom-left)
// plus centroid N.
function trianglePoints(G) {
  const A = { x: G.cx,                          y: G.cy - G.R };
  const B = { x: G.cx + G.R * Math.cos(Math.PI / 6), y: G.cy + G.R * Math.sin(Math.PI / 6) };
  const C = { x: G.cx - G.R * Math.cos(Math.PI / 6), y: G.cy + G.R * Math.sin(Math.PI / 6) };
  const N = { x: G.cx, y: (A.y + B.y + C.y) / 3 };
  return { A, B, C, N };
}

// ─── ZigzagResistor — variable endpoints (used both static + morphing) ──
// Draws a zigzag between (x0,y0) and (x1,y1), inset by `shrink` at each
// end so the resistor body doesn't overlap the node disks.
function ZigzagResistor({ x0, y0, x1, y1, shrink = 36, amp = 11, n = 7, color = 'var(--amber-400)' }) {
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  if (len < shrink * 2 + 4) {
    // Degenerate — return a short straight line (during the morph the
    // spoke can shrink briefly when α is near 1 but len is small).
    return <line x1={x0} y1={y0} x2={x1} y2={y1}
                 stroke={color} strokeWidth={2.4}/>;
  }
  const ux = dx / len, uy = dy / len;
  const nx = -uy, ny = ux;           // perpendicular unit
  const sx = x0 + ux * shrink, sy = y0 + uy * shrink;
  const ex = x1 - ux * shrink, ey = y1 - uy * shrink;
  const bodyLen = len - 2 * shrink;
  const step = bodyLen / n;
  const pts = [
    // Lead from node to body start
    `M ${x0.toFixed(1)} ${y0.toFixed(1)}`,
    `L ${sx.toFixed(1)} ${sy.toFixed(1)}`,
  ];
  for (let i = 1; i < n; i++) {
    const t = i * step;
    const baseX = sx + ux * t;
    const baseY = sy + uy * t;
    const offset = i % 2 === 1 ? amp : -amp;
    const px = baseX + nx * offset;
    const py = baseY + ny * offset;
    pts.push(`L ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  pts.push(`L ${ex.toFixed(1)} ${ey.toFixed(1)}`);
  pts.push(`L ${x1.toFixed(1)} ${y1.toFixed(1)}`);
  return (
    <path d={pts.join(' ')}
          stroke={color} strokeWidth={2.4} fill="none"
          strokeLinecap="round" strokeLinejoin="round"/>
  );
}

function CornerNode({ p, label, G }) {
  return (
    <g>
      <circle cx={p.x} cy={p.y} r={G.nodeR}
              fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.5}/>
      <text x={p.x} y={p.y + G.nodeR + 18} textAnchor="middle"
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={G.tagFont + 2}>{label}</text>
    </g>
  );
}

// ─── Beat 2: Delta setup ────────────────────────────────────────────────
function DeltaSetupBeat() {
  const portrait = usePortrait();
  const G = deltaGeometry(portrait);
  const { A, B, C } = trianglePoints(G);

  // Resistor label midpoints — offset outward from each side's midpoint.
  function sideLabelPos(p, q, outwardScale = 1) {
    const mx = (p.x + q.x) / 2, my = (p.y + q.y) / 2;
    const ox = mx - G.cx, oy = my - G.cy;
    const len = Math.hypot(ox, oy);
    return { x: mx + (ox / len) * 26 * outwardScale,
             y: my + (oy / len) * 26 * outwardScale };
  }
  const labAB = sideLabelPos(A, B);
  const labBC = sideLabelPos(B, C);
  const labCA = sideLabelPos(C, A);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Corner nodes appear first */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <CornerNode p={A} label="A" G={G} />
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.2}>
          <CornerNode p={B} label="B" G={G} />
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <CornerNode p={C} label="C" G={G} />
        </SvgFadeIn>

        {/* Three triangle-side resistors */}
        <SvgFadeIn duration={0.5} delay={0.7}>
          <ZigzagResistor x0={A.x} y0={A.y} x1={B.x} y1={B.y}
                          shrink={G.bodyShrink} amp={G.resAmp} n={G.resN}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.2}>
          <ZigzagResistor x0={B.x} y0={B.y} x1={C.x} y1={C.y}
                          shrink={G.bodyShrink} amp={G.resAmp} n={G.resN}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.7}>
          <ZigzagResistor x0={C.x} y0={C.y} x1={A.x} y1={A.y}
                          shrink={G.bodyShrink} amp={G.resAmp} n={G.resN}/>
        </SvgFadeIn>

        {/* Branch labels */}
        <SvgFadeIn duration={0.35} delay={2.4}>
          <text x={labAB.x} y={labAB.y} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R_AB</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.7}>
          <text x={labBC.x} y={labBC.y + 8} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R_BC</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={3.0}>
          <text x={labCA.x} y={labCA.y} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R_CA</text>
        </SvgFadeIn>

        {/* Centre tag — "Δ" */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <text x={G.cx} y={G.cy + 6} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontSize={portrait ? 30 : 36} opacity={0.55}>Δ</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.vbH - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            three nodes, three branches — the delta configuration
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Morph (genuine motion) ─────────────────────────────────────
// α ∈ [0,1] interpolates the resistor endpoints between triangle side and
// Y spoke. The three corner terminals (A, B, C) stay fixed.
// At α=0: resistor[AB] runs A → B.
// At α=1: resistor[AB] is *split* into two spokes (R_B from B→N and R_A
//   from A→N), but we don't render four spokes. Instead we redraw the
//   three Δ resistors as the three Y spokes:
//     Δ-AB  (the "branch between A and B") morphs into the C-spoke (R_C
//     opposite, drawn from C → N) — that's the spoke OPPOSITE the side
//     that disappears. The label likewise changes from R_AB to R_C.
function MorphBeat() {
  const portrait = usePortrait();
  const G = deltaGeometry(portrait);
  const { A, B, C, N } = trianglePoints(G);
  const { localTime } = useSprite();

  // Morph schedule (within this beat):
  //   0.0–1.0  hold delta (so the eye finds the shape)
  //   1.0–4.5  morph α 0 → 1 (easeInOutCubic)
  //   4.5–end  hold Y, labels swap in
  const HOLD0 = 1.0;
  const MORPH_DUR = 3.5;
  const tMorph = clamp((localTime - HOLD0) / MORPH_DUR, 0, 1);
  // Smoothstep for slow-start-slow-end feel.
  const alpha = tMorph * tMorph * (3 - 2 * tMorph);

  // Each Δ side morphs into the Y spoke whose label uses the node OPPOSITE
  // that side. Side AB ↔ spoke from C to N (R_C). Side BC ↔ R_A. Side CA ↔ R_B.
  // We compute morphed endpoints (start, end) for each.
  function lerp(p, q, t) { return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t }; }

  // For each side ↔ spoke pair:
  //   start_α=0 = side_start,    end_α=0 = side_end
  //   start_α=1 = oppositeNode,  end_α=1 = N
  // So we interpolate start_α from side_start → oppositeNode and end_α
  // from side_end → N.
  const sideAB_start = lerp(A, C, alpha);
  const sideAB_end   = lerp(B, N, alpha);
  const sideBC_start = lerp(B, A, alpha);
  const sideBC_end   = lerp(C, N, alpha);
  const sideCA_start = lerp(C, B, alpha);
  const sideCA_end   = lerp(A, N, alpha);

  // Label fade: Δ labels fade out as α rises, Y labels fade in past 0.55.
  const deltaLabelOpacity = clamp(1 - alpha * 1.4, 0, 1);
  const yLabelOpacity     = clamp((alpha - 0.55) * 2.2, 0, 1);
  const nDotOpacity       = clamp((alpha - 0.45) * 2.0, 0, 1);
  const tagOpacity        = clamp((alpha - 0.85) * 6.0, 0, 1);

  // Helper to find midpoint of a current morphed segment for label.
  function midpoint(p, q) { return { x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 }; }
  const midAB = midpoint(sideAB_start, sideAB_end);
  const midBC = midpoint(sideBC_start, sideBC_end);
  const midCA = midpoint(sideCA_start, sideCA_end);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Corner nodes stay fixed */}
        <CornerNode p={A} label="A" G={G} />
        <CornerNode p={B} label="B" G={G} />
        <CornerNode p={C} label="C" G={G} />

        {/* Centre node N — fades in mid-morph */}
        <g opacity={nDotOpacity}>
          <circle cx={N.x} cy={N.y} r={G.nodeR - 1}
                  fill="var(--rose-400)" stroke="var(--chalk-100)"
                  strokeWidth={1.4}/>
          <text x={N.x + G.nodeR + 6} y={N.y + 5}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>N</text>
        </g>

        {/* Three morphing resistors */}
        <ZigzagResistor x0={sideAB_start.x} y0={sideAB_start.y}
                        x1={sideAB_end.x}   y1={sideAB_end.y}
                        shrink={G.bodyShrink} amp={G.resAmp} n={G.resN}/>
        <ZigzagResistor x0={sideBC_start.x} y0={sideBC_start.y}
                        x1={sideBC_end.x}   y1={sideBC_end.y}
                        shrink={G.bodyShrink} amp={G.resAmp} n={G.resN}/>
        <ZigzagResistor x0={sideCA_start.x} y0={sideCA_start.y}
                        x1={sideCA_end.x}   y1={sideCA_end.y}
                        shrink={G.bodyShrink} amp={G.resAmp} n={G.resN}/>

        {/* Δ labels — fade out */}
        <g opacity={deltaLabelOpacity}>
          <text x={midAB.x} y={midAB.y - 18} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R_AB</text>
          <text x={midBC.x} y={midBC.y + 22} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R_BC</text>
          <text x={midCA.x - 22} y={midCA.y} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R_CA</text>
        </g>

        {/* Y labels — sit at 35% from corner toward N, offset perpendicular
            to the spoke so they clear both the resistor zigzag and the node
            disks. */}
        {(() => {
          // For each spoke direction (node → N), compute the perpendicular
          // outward unit vector and place the label at 35% with a sideways
          // offset. The perpendicular sign is chosen so labels land on the
          // outside of the triangle (away from the centre tag).
          function labelPos(P, sign) {
            const t = 0.35;
            const bx = P.x + (N.x - P.x) * t;
            const by = P.y + (N.y - P.y) * t;
            const dx = N.x - P.x, dy = N.y - P.y;
            const len = Math.hypot(dx, dy) || 1;
            // Perpendicular: rotate (dx, dy) by 90° → (-dy, dx).
            const px = -dy / len, py = dx / len;
            return { x: bx + px * 32 * sign, y: by + py * 32 * sign + 6 };
          }
          // Sign chosen per spoke to push labels onto the outward side of
          // the Y. Top spoke (A): offset to the right (+1). Bottom-right
          // (B): right-and-down (+1). Bottom-left (C): the perpendicular
          // sign that would land on the left side is +1 (because the
          // rotation goes counter-clockwise for that vector direction);
          // experimentally verified — left side of C-spoke is clear.
          const la = labelPos(A, +1);
          const lb = labelPos(B, +1);
          const lc = labelPos(C, +1);
          return (
            <g opacity={yLabelOpacity}>
              <text x={la.x} y={la.y} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.tagFont}>R_A</text>
              <text x={lb.x} y={lb.y} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.tagFont}>R_B</text>
              <text x={lc.x} y={lc.y} textAnchor="middle"
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.tagFont}>R_C</text>
            </g>
          );
        })()}

        {/* Centre tag morphs Δ → Y */}
        <text x={G.cx} y={portrait ? G.vbH - 60 : G.vbH - 50} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-serif)"
              fontSize={portrait ? 22 : 26}>
          <tspan opacity={deltaLabelOpacity}>Δ</tspan>
          <tspan opacity={tagOpacity} dx={portrait ? 16 : 22}>→  Y</tspan>
        </text>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.vbH - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            same three terminals — three spokes meeting at one new node
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Formulas ───────────────────────────────────────────────────
function FormulasBeat() {
  const portrait = usePortrait();
  const fStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 24 : 28, letterSpacing: '0.02em',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 16 : 20,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        from Δ to Y
      </FadeUp>

      <FadeUp duration={0.4} delay={0.3} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
          marginBottom: 2,
        }}>
        let  S = R_AB + R_BC + R_CA
      </FadeUp>

      <FadeUp duration={0.5} delay={1.0} distance={10}
        style={{ ...fStyle, color: 'var(--rose-300)' }}>
        R_A = (R_AB · R_CA) / S
      </FadeUp>
      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{ ...fStyle, color: 'var(--rose-300)' }}>
        R_B = (R_AB · R_BC) / S
      </FadeUp>
      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{ ...fStyle, color: 'var(--rose-300)' }}>
        R_C = (R_BC · R_CA) / S
      </FadeUp>

      <FadeUp duration={0.5} delay={5.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-200)',
          textAlign: 'center', maxWidth: portrait ? '28ch' : '46ch',
          lineHeight: 1.4, marginTop: 6,
        }}>
        each spoke = product of its two adjacent Δ branches, divided by the total
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ───────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.3,
        }}>
        Triangle → Star. Same terminals, simpler topology.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.8} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 15,
          color: 'var(--amber-300)', letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}>
        the rescue trick for any bridge circuit
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          textAlign: 'center', maxWidth: portrait ? '30ch' : '52ch',
          lineHeight: 1.4,
        }}>
        once the awkward triangle is gone, series and parallel rules finish the job
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ──────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage
      width={1280} height={720}
      duration={SCENE_DURATION}
      background="#0c0a1f"
      loop={false}
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
