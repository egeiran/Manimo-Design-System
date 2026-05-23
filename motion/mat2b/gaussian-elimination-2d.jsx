// Gaussian Elimination: Two Lines, One Point — Manimo lesson scene.
// Mat2B chapter 2 (Lineærtransformasjoner). Geometric story of row
// reduction: the lines change, but the intersection — the unique
// solution — does not.
//
// System: 2x +  y = 5   →   row1 = (2, 1, 5)
//          x + 3y = 5   →   row2 = (1, 3, 5)   solution: (2, 1)
//
// Sequence of row ops shown geometrically:
//   beat 2  setup            R1 = (2, 1, 5), R2 = (1, 3, 5)
//   beat 3  swap R1 ↔ R2     R1 = (1, 3, 5), R2 = (2, 1, 5)   (lines static; only matrix labels swap)
//   beat 4  R2 ← R2 − 2·R1   R1 = (1, 3, 5), R2 = (0, −5, −5) → y = 1
//   beat 5  back-substitute  R1 ← R1 − 3·(R2 / −5)            → x = 2
//
// Authoring notes:
//   • All delays inside a beat are relative to that <Sprite>'s start (localTime).
//   • The "(2, 1) intersection" amber dot is drawn ONCE per beat at the
//     exact analytic intersection of the two current row equations — so as
//     the lines morph, the dot literally cannot drift off the solution.
//   • SvgFadeIn for SVG, FadeUp for DOM. SceneChrome owns the title
//     block, watermark, and corner mascot — don't redraw them.

const SCENE_DURATION = 51;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.0– 4.5  */ 'Two equations, two unknowns — what does row reduction do to the picture?',
  /*  4.5–14.0  */ 'Here is a system. Two lines on the plane. They cross at one point — that crossing is the unique solution.',
  /* 14.0–28.0  */ 'Swap the rows so the small leading coefficient is on top. The lines did not move — we only renamed which equation we call row one.',
  /* 28.0–44.0  */ 'Now replace row two with row two minus two times row one. The second line tilts and shifts — but watch the intersection. It does not move.',
  /* 44.0–54.5  */ 'One more step — divide and back-substitute. The lines become axis-aligned. The matrix is upper triangular. The solution is just read off.',
  /* 54.5–60.0  */ 'Row operations slide and tilt the lines, but they cannot move the answer. Elimination is a change of view, not a change of truth.',
];

// Single continuous narration track. Beat <Sprite start> values below
// will be re-aligned to manifest.json's audioStart offsets by rewire-scene.js.
const NARRATION_AUDIO = 'audio/gaussian-elimination-2d/scene.mp3';

// ─── Math helpers ─────────────────────────────────────────────────────────
// A row (a, b, c) represents the line a·x + b·y = c. Two such rows form
// a 2×2 system; we draw both lines and compute their analytic intersection.
function lerpRow(R0, R1, t) {
  return [R0[0] + (R1[0] - R0[0]) * t,
          R0[1] + (R1[1] - R0[1]) * t,
          R0[2] + (R1[2] - R0[2]) * t];
}
function intersect(R, S) {
  const [a, b, c] = R, [d, e, f] = S;
  const det = a * e - b * d;
  if (Math.abs(det) < 1e-6) return null;
  return [(c * e - b * f) / det, (a * f - c * d) / det];
}
// Clip the line a·x + b·y = c to the rectangle [xMin,xMax] × [yMin,yMax].
// Returns two endpoints in math-space, or null if the line misses the box.
function clipLine([a, b, c], xMin, xMax, yMin, yMax) {
  const pts = [];
  if (Math.abs(b) > 1e-6) {
    const yL = (c - a * xMin) / b;
    if (yL >= yMin - 1e-6 && yL <= yMax + 1e-6) pts.push([xMin, yL]);
    const yR = (c - a * xMax) / b;
    if (yR >= yMin - 1e-6 && yR <= yMax + 1e-6) pts.push([xMax, yR]);
  }
  if (Math.abs(a) > 1e-6) {
    const xB = (c - b * yMin) / a;
    if (xB > xMin - 1e-6 && xB < xMax + 1e-6) pts.push([xB, yMin]);
    const xT = (c - b * yMax) / a;
    if (xT > xMin - 1e-6 && xT < xMax + 1e-6) pts.push([xT, yMax]);
  }
  const out = [];
  for (const p of pts) {
    if (!out.some(q => Math.hypot(p[0] - q[0], p[1] - q[1]) < 1e-4)) out.push(p);
  }
  return out.length >= 2 ? [out[0], out[1]] : null;
}
function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

// ─── Plane geometry (per-aspect) ──────────────────────────────────────────
function geom(portrait) {
  // Same math range in both aspects; only unit / SVG canvas / position change.
  const X_MIN = -1, X_MAX = 7;
  const Y_MIN = -1, Y_MAX = 4;
  if (portrait) {
    const unit = 66;
    return {
      X_MIN, X_MAX, Y_MIN, Y_MAX, unit,
      vbW: 600, vbH: 420,
      ox: 60,      // x = 0 is 60 px from SVG left
      oy: 330,     // y = 0 is 330 px from SVG top (so y=4 → 66, y=-1 → 396)
      planePos: { left: '50%', top: 360, transform: 'translate(-50%, 0)' },
      matrixPos: { left: 36, right: 36, top: 830 },
      captionPos: { left: 48, right: 48, bottom: 60 },
      fontLabel: 15,
    };
  }
  return {
    X_MIN, X_MAX, Y_MIN, Y_MAX, unit: 78,
    vbW: 720, vbH: 540,
    ox: 70,
    oy: 460,     // y=0 at 460; y=4 → 148; y=-1 → 538
    planePos: { left: 60, top: 160 },
    matrixPos: { right: 56, top: 200, width: 360 },
    captionPos: { left: 60, bottom: 50, width: 720, textAlign: 'center' },
    fontLabel: 17,
  };
}
function toSvg(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

// ─── Shared plane chrome (axes + faint grid) ──────────────────────────────
function PlaneChrome({ G }) {
  const left = toSvg(G, G.X_MIN, 0).sx;
  const right = toSvg(G, G.X_MAX, 0).sx;
  const top = toSvg(G, 0, G.Y_MAX).sy;
  const bottom = toSvg(G, 0, G.Y_MIN).sy;
  const yAxis = toSvg(G, 0, 0).sx;
  const xAxis = toSvg(G, 0, 0).sy;
  const verticals = [];
  for (let k = G.X_MIN; k <= G.X_MAX; k++) {
    if (k === 0) continue;
    const sx = toSvg(G, k, 0).sx;
    verticals.push(
      <line key={`v${k}`} x1={sx} y1={top} x2={sx} y2={bottom}
            stroke="var(--chalk-300)" strokeWidth={0.8} opacity={0.18}/>
    );
  }
  const horizontals = [];
  for (let k = G.Y_MIN; k <= G.Y_MAX; k++) {
    if (k === 0) continue;
    const sy = toSvg(G, 0, k).sy;
    horizontals.push(
      <line key={`h${k}`} x1={left} y1={sy} x2={right} y2={sy}
            stroke="var(--chalk-300)" strokeWidth={0.8} opacity={0.18}/>
    );
  }
  return (
    <g>
      {verticals}
      {horizontals}
      <line x1={left} y1={xAxis} x2={right} y2={xAxis}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <line x1={yAxis} y1={top} x2={yAxis} y2={bottom}
            stroke="var(--chalk-200)" strokeWidth={1.6}/>
      <text x={right + 4} y={xAxis + 5} fill="var(--chalk-300)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16}>x</text>
      <text x={yAxis - 4} y={top - 6} fill="var(--chalk-300)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={16} textAnchor="end">y</text>
    </g>
  );
}

function RowLine({ G, row, color, strokeWidth = 3, opacity = 1, dash = null }) {
  const pts = clipLine(row, G.X_MIN, G.X_MAX, G.Y_MIN, G.Y_MAX);
  if (!pts) return null;
  const a = toSvg(G, pts[0][0], pts[0][1]);
  const b = toSvg(G, pts[1][0], pts[1][1]);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeLinecap="round"
          {...(dash ? { strokeDasharray: dash } : {})}/>
  );
}

function IntersectionDot({ G, R1, R2, pulse = 0 }) {
  const p = intersect(R1, R2);
  if (!p) return null;
  const s = toSvg(G, p[0], p[1]);
  return (
    <g>
      {pulse > 0 && (
        <circle cx={s.sx} cy={s.sy} r={9 + pulse * 14}
                fill="none" stroke="var(--amber-300)"
                strokeWidth={2} opacity={0.55 * (1 - pulse * 0.85)}/>
      )}
      <circle cx={s.sx} cy={s.sy} r={7}
              fill="var(--amber-400)" stroke="var(--bg-canvas)" strokeWidth={2}/>
    </g>
  );
}

function RowLabel({ G, row, text, color, anchor }) {
  // Place 18 % from the chosen endpoint along the line — keeps the label
  // off the plane border so the y-axis / right margin can't clip it.
  const pts = clipLine(row, G.X_MIN, G.X_MAX, G.Y_MIN, G.Y_MAX);
  if (!pts) return null;
  const [pL, pR] = pts[0][0] < pts[1][0] ? [pts[0], pts[1]] : [pts[1], pts[0]];
  const f = 0.18;
  const pp = anchor === 'right'
    ? [pR[0] + f * (pL[0] - pR[0]), pR[1] + f * (pL[1] - pR[1])]
    : [pL[0] + f * (pR[0] - pL[0]), pL[1] + f * (pR[1] - pL[1])];
  const s = toSvg(G, pp[0], pp[1]);
  // Push perpendicular to the line so the label sits clear of the stroke.
  const a = row[0], b = row[1];
  const norm = Math.hypot(a, b) || 1;
  // Math-space normal (a, b) → screen-space (a, −b). Pick the side that
  // pushes labels "down-left" for left-anchored and "up-right" for
  // right-anchored so the two labels of any pair don't collide.
  const sign = anchor === 'right' ? -1 : 1;
  const ox = sign * (a / norm) * 12;
  const oy = sign * (-b / norm) * 16;
  return (
    <text x={s.sx + ox} y={s.sy + oy} fill={color}
          fontFamily="var(--font-serif)" fontStyle="italic"
          fontSize={G.fontLabel}
          textAnchor={anchor === 'right' ? 'start' : 'end'}>
      {text}
    </text>
  );
}

function SolutionLabel({ G, R1, R2, text, portrait, highlight = false }) {
  const p = intersect(R1, R2);
  if (!p) return null;
  const s = toSvg(G, p[0], p[1]);
  return (
    <text x={s.sx + (portrait ? 18 : 16)} y={s.sy - 14}
          fill={highlight ? 'var(--amber-300)' : 'var(--chalk-200)'}
          fontFamily="var(--font-serif)" fontStyle="italic"
          fontSize={portrait ? 17 : 19}
          style={highlight ? { textShadow: '0 0 12px rgba(244,184,96,0.7)' } : undefined}>
      {text}
    </text>
  );
}

function Plane({ G, children }) {
  return (
    <div style={{ position: 'absolute', ...G.planePos }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {children}
      </svg>
    </div>
  );
}

// ─── Matrix panel (HTML) — shows the current augmented matrix ─────────────
function fmt(v) {
  if (Math.abs(v) < 1e-3) return '0';
  if (Math.abs(v - Math.round(v)) < 1e-3) return String(Math.round(v));
  return v.toFixed(1);
}
function MatrixPanel({ portrait, eyebrow, row1, row2, op = null, opChipActive = false,
                       solutionReadout = null, position, highlightRow2 = false }) {
  const cellFont = portrait ? 28 : 32;
  const headerFont = portrait ? 10 : 11;
  const RowDisplay = ({ row, color, highlight = false }) => (
    <div style={{ display: 'flex', gap: portrait ? 14 : 18, alignItems: 'baseline' }}>
      {[0, 1, 2].map(i => (
        <span key={i} style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: cellFont, color,
          minWidth: portrait ? 36 : 46, textAlign: 'right',
          ...(i === 1 ? { marginRight: portrait ? 4 : 6 } : {}),
          ...(i === 2 ? { marginLeft: portrait ? 4 : 6 } : {}),
          ...(highlight ? { textShadow: '0 0 14px rgba(244,184,96,0.55)' } : {}),
        }}>{fmt(row[i])}</span>
      )).flatMap((node, i) => i === 2
        ? [<span key="bar" style={{
            display: 'inline-block',
            width: 1, height: cellFont * 0.95,
            background: 'rgba(232,220,193,0.4)', alignSelf: 'center',
          }}/>, node]
        : [node])}
    </div>
  );
  return (
    <div style={{
      position: 'absolute', ...position,
      padding: portrait ? '16px 18px' : '20px 24px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', gap: portrait ? 10 : 14,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: headerFont,
        color: 'var(--amber-300)', letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}>{eyebrow}</div>
      <div style={{ position: 'relative', padding: '6px 14px 6px 14px' }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 10,
          borderLeft: '2.2px solid var(--chalk-200)',
          borderTop: '2.2px solid var(--chalk-200)',
          borderBottom: '2.2px solid var(--chalk-200)',
        }}/>
        <span style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 10,
          borderRight: '2.2px solid var(--chalk-200)',
          borderTop: '2.2px solid var(--chalk-200)',
          borderBottom: '2.2px solid var(--chalk-200)',
        }}/>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <RowDisplay row={row1} color="var(--rose-300)"/>
          <RowDisplay row={row2} color="var(--teal-300)" highlight={highlightRow2}/>
        </div>
      </div>
      {op && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 12 : 13,
          color: opChipActive ? 'var(--amber-300)' : 'var(--chalk-300)',
          background: opChipActive ? 'rgba(244,184,96,0.12)' : 'transparent',
          border: `1px solid ${opChipActive ? 'rgba(244,184,96,0.45)' : 'rgba(232,220,193,0.12)'}`,
          borderRadius: 8, padding: '6px 10px', alignSelf: 'flex-start',
          letterSpacing: '0.06em',
        }}>{op}</div>
      )}
      {solutionReadout && (
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26, color: 'var(--amber-300)',
          marginTop: 2,
        }}>{solutionReadout}</div>
      )}
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="row reduction"
      title="Two Lines, One Point"
      duration={SCENE_DURATION}
      introEnd={5.06}
      introCaption="Two lines — one solution."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.06} end={12.28}>
        <SetupBeat />
      </Sprite>

      <Sprite start={12.28} end={21.22}>
        <SwapBeat />
      </Sprite>

      <Sprite start={21.22} end={31.46}>
        <ReduceBeat />
      </Sprite>

      <Sprite start={31.46} end={41.02}>
        <EchelonBeat />
      </Sprite>

      <Sprite start={41.02} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: setup ────────────────────────────────────────────────────────
const R_INIT_1 = [2, 1, 5];   // 2x + y = 5
const R_INIT_2 = [1, 3, 5];   // x + 3y = 5
function SetupBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();
  const pulse = Math.max(0, Math.min(1, (localTime - 2.4) / 1.6));
  return (
    <>
      <Plane G={G}>
        <SvgFadeIn duration={0.5} delay={0.0}>
          <PlaneChrome G={G}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.6}>
          <RowLine G={G} row={R_INIT_1} color="var(--rose-400)" strokeWidth={3}/>
          <RowLabel G={G} row={R_INIT_1} text="2x + y = 5"
                    color="var(--rose-300)" anchor="right"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.4}>
          <RowLine G={G} row={R_INIT_2} color="var(--teal-400)" strokeWidth={3}/>
          <RowLabel G={G} row={R_INIT_2} text="x + 3y = 5"
                    color="var(--teal-300)" anchor="left"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.4}>
          <IntersectionDot G={G} R1={R_INIT_1} R2={R_INIT_2} pulse={pulse}/>
          <SolutionLabel G={G} R1={R_INIT_1} R2={R_INIT_2}
                         text="(2, 1)" portrait={portrait}/>
        </SvgFadeIn>
      </Plane>

      <MatrixPanel
        portrait={portrait}
        eyebrow="augmented matrix"
        row1={R_INIT_1}
        row2={R_INIT_2}
        position={G.matrixPos}
      />
    </>
  );
}

// ─── Beat 3: swap rows (lines static, matrix swaps) ───────────────────────
function SwapBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // Swap matrix rows around the middle of the beat so the eye can lock on.
  const f = localTime / Math.max(0.001, beatDur);
  const swapT = smoothstep((f - 0.15) / 0.20);
  const matRow1 = lerpRow(R_INIT_1, R_INIT_2, swapT);
  const matRow2 = lerpRow(R_INIT_2, R_INIT_1, swapT);
  const opActive = f >= 0.05 && f < 0.50;
  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G}/>
        <RowLine G={G} row={R_INIT_1} color="var(--rose-400)" strokeWidth={3}/>
        <RowLabel G={G} row={R_INIT_1} text="2x + y = 5"
                  color="var(--rose-300)" anchor="right"/>
        <RowLine G={G} row={R_INIT_2} color="var(--teal-400)" strokeWidth={3}/>
        <RowLabel G={G} row={R_INIT_2} text="x + 3y = 5"
                  color="var(--teal-300)" anchor="left"/>
        <IntersectionDot G={G} R1={R_INIT_1} R2={R_INIT_2}/>
        <SolutionLabel G={G} R1={R_INIT_1} R2={R_INIT_2}
                       text="(2, 1) — fixed" portrait={portrait}/>
      </Plane>

      <MatrixPanel
        portrait={portrait}
        eyebrow="after R₁ ↔ R₂"
        row1={matRow1}
        row2={matRow2}
        op="R₁ ↔ R₂"
        opChipActive={opActive}
        position={G.matrixPos}
      />
    </>
  );
}

// ─── Beat 4: R2 ← R2 − 2·R1 (teal line morphs to y = 1) ───────────────────
function ReduceBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // After the swap, current rows are:
  //   R1 = (1, 3, 5)        — rose line   x + 3y = 5
  //   R2_before = (2, 1, 5) — teal line   2x + y = 5
  // After R2 ← R2 − 2·R1:
  //   R2_after  = (0, −5, −5) → y = 1
  const R1 = [1, 3, 5];
  const R2_before = [2, 1, 5];
  const R2_after = [0, -5, -5];
  // Morph fraction: hold 12 %, morph through 70 %, settle the rest.
  const f = localTime / Math.max(0.001, beatDur);
  const morphT = smoothstep((f - 0.12) / 0.70);
  const R2_now = lerpRow(R2_before, R2_after, morphT);
  const opActive = f >= 0.08 && f <= 0.92;
  // Pulse the intersection point continuously during the morph so the eye
  // is drawn to its stillness.
  const pulseClock = (Math.sin(localTime * 1.8) + 1) / 2;
  const pulse = morphT > 0.02 && morphT < 0.98 ? 0.3 + 0.5 * pulseClock : 0;
  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G}/>
        <RowLine G={G} row={R1} color="var(--rose-400)" strokeWidth={3}/>
        <RowLabel G={G} row={R1} text="x + 3y = 5"
                  color="var(--rose-300)" anchor="right"/>
        {morphT > 0.04 && morphT < 1 && (
          <RowLine G={G} row={R2_before}
                   color="var(--teal-400)" strokeWidth={1.5}
                   opacity={0.32 * (1 - morphT)} dash="6 6"/>
        )}
        <RowLine G={G} row={R2_now} color="var(--teal-400)" strokeWidth={3}/>
        <RowLabel G={G} row={R2_now}
                  text={morphT > 0.9 ? 'y = 1' : '2x + y = 5'}
                  color="var(--teal-300)" anchor="left"/>
        <IntersectionDot G={G} R1={R1} R2={R2_now} pulse={pulse}/>
        <SolutionLabel G={G} R1={R1} R2={R2_now}
                       text="(2, 1) — still here" portrait={portrait}/>
      </Plane>

      <MatrixPanel
        portrait={portrait}
        eyebrow="after R₂ − 2·R₁"
        row1={R1}
        row2={R2_now}
        op="R₂ ← R₂ − 2·R₁"
        opChipActive={opActive}
        highlightRow2={opActive && morphT > 0 && morphT < 1}
        position={G.matrixPos}
      />

      {/* Caption appears once the morph has settled (≈ 85 % through the beat) */}
      {f >= 0.85 && (
        <FadeUp duration={0.5} delay={0} distance={10}
          style={{
            position: 'absolute', ...G.captionPos,
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 16 : 19, color: 'var(--chalk-300)',
          }}>
          the intersection is invariant under row operations
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 5: back-substitute (rose line morphs to x = 2) ──────────────────
function EchelonBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // Coming in:
  //   R1 = (1, 3, 5)  — rose, x + 3y = 5
  //   R2 = (0, 1, 1)  — teal, y = 1   (already normalised — equivalent to (0,-5,-5))
  // Back-sub: R1 ← R1 − 3·R2 → (1, 0, 2)  →  x = 2
  const R1_before = [1, 3, 5];
  const R1_after = [1, 0, 2];
  const R2 = [0, 1, 1];
  const f = localTime / Math.max(0.001, beatDur);
  const morphT = smoothstep((f - 0.14) / 0.55);
  const R1_now = lerpRow(R1_before, R1_after, morphT);
  const opActive = f >= 0.10 && f <= 0.86;
  const solveGlow = morphT > 0.92 ? smoothstep((f - 0.75) / 0.16) : 0;
  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G}/>
        {morphT > 0.04 && morphT < 1 && (
          <RowLine G={G} row={R1_before}
                   color="var(--rose-400)" strokeWidth={1.5}
                   opacity={0.32 * (1 - morphT)} dash="6 6"/>
        )}
        <RowLine G={G} row={R1_now} color="var(--rose-400)" strokeWidth={3}/>
        <RowLabel G={G} row={R1_now}
                  text={morphT > 0.9 ? 'x = 2' : 'x + 3y = 5'}
                  color="var(--rose-300)" anchor="right"/>
        <RowLine G={G} row={R2} color="var(--teal-400)" strokeWidth={3}/>
        <RowLabel G={G} row={R2} text="y = 1"
                  color="var(--teal-300)" anchor="left"/>
        <IntersectionDot G={G} R1={R1_now} R2={R2}
                         pulse={solveGlow > 0 ? solveGlow : 0}/>
        <SolutionLabel G={G} R1={R1_now} R2={R2}
                       text="(2, 1)" portrait={portrait}
                       highlight={solveGlow > 0}/>
      </Plane>

      <MatrixPanel
        portrait={portrait}
        eyebrow="row-reduced echelon"
        row1={R1_now}
        row2={R2}
        op="R₁ ← R₁ − 3·R₂"
        opChipActive={opActive}
        solutionReadout={morphT > 0.9 ? '(x, y) = (2, 1)' : null}
        position={G.matrixPos}
      />
    </>
  );
}

// ─── Beat 6: takeaway ─────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 28 : 38, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '36ch', lineHeight: 1.25,
        }}>
        Row operations change the picture —<br/>
        never the solution.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.7} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 17 : 20, color: 'var(--chalk-300)',
          maxWidth: portrait ? '26ch' : '44ch', lineHeight: 1.4,
        }}>
        Elimination is a change of view, not a change of truth.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
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
