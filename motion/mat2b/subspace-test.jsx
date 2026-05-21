// Subspaces: Why the Origin Matters — Manimo lesson scene.
// Chapter 1 (Vektorrom). Tests three conditions for being a subspace —
// contain zero, closed under +, closed under ·. A line through the origin
// passes; a line offset from the origin fails closure under addition, and
// the parallelogram-rule construction shows the sum landing off the line.
//
// Beats (English narration):
//    0– 4   Manimo intro
//    4–11   Three subspace tests laid out
//   11–22   Line through origin: scrub a scalar (slides v along line);
//           parallelogram-rule construction lands u+v on the line
//   22–30   Offset line: same parallelogram construction lands u+v OFF
//           the line, marked with an X
//   30–35   Takeaway — every subspace must touch the origin
//
// Genuine animation lives in beats 3 and 4: the scalar scrub in beat 3
// drives a point sliding along the line (not a fade-in); the
// parallelogram-rule build in beats 3 and 4 also draws over time.

const SCENE_DURATION = 48;

const NARRATION = [
  /*  0– 4 */ 'Which little patches of the plane behave like a vector space of their own?',
  /*  4–11 */ 'A subspace has to pass three tests. It must contain the zero vector, it must be closed under addition, and it must be closed under scaling by any number.',
  /* 11–22 */ 'Take a line through the origin. Pick two arrows that end on it. Their sum lands back on the line. Scale one arrow by any number and the tip glides along the line. The origin is right there. All three tests pass.',
  /* 22–30 */ 'Now shift the line so it misses the origin. Pick two arrows that end on it. This time the parallelogram tip lands off the line. Closure under addition fails, the origin is not on the line, and this set is not a subspace.',
  /* 30–35 */ 'Every subspace must touch the origin. No origin, no subspace.',
];

const NARRATION_AUDIO = 'audio/subspace-test/scene.mp3';

// ─── Geometry helpers (per-aspect) ────────────────────────────────────────
function geom(portrait) {
  return portrait
    ? { vbW: 660, vbH: 720, ox: 330, oy: 380, unit: 56,
        gridXMin: -5, gridXMax: 5, gridYMin: -5, gridYMax: 5 }
    : { vbW: 760, vbH: 600, ox: 380, oy: 320, unit: 64,
        gridXMin: -5, gridXMax: 5, gridYMin: -4, gridYMax: 4 };
}

function toSvgF(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function ReferenceGridSvg({ G, opacity = 0.25 }) {
  const lines = [];
  for (let k = G.gridXMin; k <= G.gridXMax; k++) {
    const a = toSvgF(G, k, G.gridYMin);
    const b = toSvgF(G, k, G.gridYMax);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = G.gridYMin; k <= G.gridYMax; k++) {
    const a = toSvgF(G, G.gridXMin, k);
    const b = toSvgF(G, G.gridXMax, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes2DSvg({ G }) {
  const l = toSvgF(G, G.gridXMin, 0), r = toSvgF(G, G.gridXMax, 0);
  const b = toSvgF(G, 0, G.gridYMin), t = toSvgF(G, 0, G.gridYMax);
  return (
    <g>
      <line x1={l.sx} y1={l.sy} x2={r.sx} y2={r.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={t.sx} y1={t.sy} x2={b.sx} y2={b.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
    </g>
  );
}

// Arrow from origin to (x, y), with optional progress and label.
function ArrowFromOrigin({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                          strokeWidth = 3.4, progress = 1, fromX = 0, fromY = 0 }) {
  const a = toSvgF(G, fromX, fromY);
  const tipX = fromX + (x - fromX) * progress;
  const tipY = fromY + (y - fromY) * progress;
  const b = toSvgF(G, tipX, tipY);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const headLen = 12, headHalf = 6.5;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && progress > 0.85 && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

// Long line through (x0, y0) with direction (dx, dy), clipped to the grid box.
function InfiniteLine({ G, x0, y0, dx, dy, color, dashed = false,
                       strokeWidth = 2.2, opacity = 1 }) {
  // Parametrise (x0+t*dx, y0+t*dy) and clip to viewbox grid extents.
  const tCandidates = [];
  if (Math.abs(dx) > 1e-9) {
    tCandidates.push((G.gridXMin - x0) / dx, (G.gridXMax - x0) / dx);
  }
  if (Math.abs(dy) > 1e-9) {
    tCandidates.push((G.gridYMin - y0) / dy, (G.gridYMax - y0) / dy);
  }
  let tMin = Infinity, tMax = -Infinity;
  for (const t of tCandidates) {
    const xt = x0 + t * dx, yt = y0 + t * dy;
    if (xt >= G.gridXMin - 1e-6 && xt <= G.gridXMax + 1e-6 &&
        yt >= G.gridYMin - 1e-6 && yt <= G.gridYMax + 1e-6) {
      if (t < tMin) tMin = t;
      if (t > tMax) tMax = t;
    }
  }
  if (!isFinite(tMin) || !isFinite(tMax) || tMax - tMin < 1e-6) return null;
  const a = toSvgF(G, x0 + tMin * dx, y0 + tMin * dy);
  const b = toSvgF(G, x0 + tMax * dx, y0 + tMax * dy);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={strokeWidth} opacity={opacity}
          strokeDasharray={dashed ? '6 5' : undefined} strokeLinecap="round"/>
  );
}

// Small ✕ marker — pulse-grows into view.
function CrossMark({ cx, cy, color, scale = 1, opacity = 1 }) {
  const s = 9 * scale;
  return (
    <g style={{ opacity }}>
      <line x1={cx - s} y1={cy - s} x2={cx + s} y2={cy + s}
            stroke={color} strokeWidth={3.2} strokeLinecap="round"/>
      <line x1={cx - s} y1={cy + s} x2={cx + s} y2={cy - s}
            stroke={color} strokeWidth={3.2} strokeLinecap="round"/>
    </g>
  );
}

function SoftPanel({ G, portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 920, bottom: 100 }
        : { right: 60, top: 250, width: 360 }),
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column',
      alignItems: portrait ? 'center' : 'flex-start',
      textAlign: portrait ? 'center' : 'left',
      gap: 12,
    }}>
      {children}
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="vector spaces"
      title="Subspaces: Why the Origin Matters"
      duration={SCENE_DURATION}
      introEnd={4.3}
      introCaption="Which patches act like a vector space of their own?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.3} end={13.67}>
        <ThreeTestsBeat/>
      </Sprite>

      <Sprite start={13.67} end={28.12}>
        <LinePassBeat/>
      </Sprite>

      <Sprite start={28.12} end={41.91}>
        <LineFailBeat/>
      </Sprite>

      <Sprite start={41.91} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Three subspace tests ─────────────────────────────────────────
function ThreeTestsBeat() {
  const portrait = usePortrait();
  const rowStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 28 : 32, color: 'var(--chalk-100)',
    display: 'flex', alignItems: 'baseline', gap: 18,
  };
  const num = {
    fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 14,
    color: 'var(--amber-300)', letterSpacing: '0.12em',
    minWidth: 36,
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: portrait ? 22 : 28,
      maxWidth: portrait ? 600 : 'none',
    }}>
      <FadeUp duration={0.45} delay={0.2} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', alignSelf: 'center',
        }}>
        three subspace tests
      </FadeUp>

      <FadeUp duration={0.5} delay={0.8} distance={10} style={rowStyle}>
        <span style={num}>01</span><span>0 belongs to S</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={10} style={rowStyle}>
        <span style={num}>02</span><span>u + v stays in S</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={2.4} distance={10} style={rowStyle}>
        <span style={num}>03</span><span>c · v stays in S</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={3.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', alignSelf: 'center',
          maxWidth: portrait ? '28ch' : '40ch', lineHeight: 1.4,
          textAlign: 'center', marginTop: 8,
        }}>
        Pass all three and the set is a subspace — a little vector space living inside the big one.
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Line through origin passes ───────────────────────────────────
// Geometry — a line through the origin with direction (2, 1)/√5.
// u = (-2, -1), v = (3, 1.5).  u + v = (1, 0.5)  → still on the line.
function LinePassBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  // Line direction (unit vector along (2,1)).
  const dx = 2, dy = 1;
  const ux = -2, uy = -1;        // u on the line (math coords)
  const vx = 3,  vy = 1.5;       // v on the line
  const sumX = ux + vx, sumY = uy + vy;

  // Parallelogram-rule build: dashed translate-of-v from u-tip, dashed
  // translate-of-u from v-tip, then sum vector grows.
  const buildT = clamp((localTime - 3.2) / 1.0, 0, 1);
  const sumProgress = clamp((localTime - 4.0) / 1.0, 0, 1);

  // Scalar scrub: c sweeps from -2 to 2 over 3.0s, slides c·v along the line.
  const SCRUB_START = 5.5;
  const SCRUB_DUR = 3.5;
  const scrubT = clamp((localTime - SCRUB_START) / SCRUB_DUR, 0, 1);
  // Easing.easeInOutCubic gives a feel of "drag the dial in and back".
  const cValue = -2 + 4 * Easing.easeInOutCubic(scrubT);
  // Position of c · v along the line (using direction unit vector).
  const cPtX = cValue * dx, cPtY = cValue * dy;
  const cPt = toSvgF(G, cPtX, cPtY);

  // Dashed parallelogram-rule completion lines.
  const uTip = toSvgF(G, ux, uy);
  const vTip = toSvgF(G, vx, vy);
  const sumTip = toSvgF(G, sumX, sumY);
  const origin = toSvgF(G, 0, 0);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G} opacity={0.25}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.2}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>

          {/* Line through origin */}
          <SvgFadeIn duration={0.5} delay={0.0}>
            <InfiniteLine G={G} x0={0} y0={0} dx={dx} dy={dy}
                          color="var(--violet-400)" strokeWidth={2.6} opacity={0.85}/>
          </SvgFadeIn>

          {/* u and v */}
          <SvgFadeIn duration={0.4} delay={0.6}>
            <ArrowFromOrigin G={G} x={ux} y={uy} color="var(--amber-400)"
                             label="u" labelDX={-22} labelDY={6}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={1.4}>
            <ArrowFromOrigin G={G} x={vx} y={vy} color="var(--teal-400)"
                             label="v" labelDX={20} labelDY={-8}/>
          </SvgFadeIn>

          {/* Parallelogram-rule construction (dashed, drawn over 1s starting at 3.2s) */}
          {buildT > 0 && (
            <g opacity={buildT}>
              {/* Translate-of-v from u's tip toward sum */}
              <line x1={uTip.sx} y1={uTip.sy}
                    x2={uTip.sx + (sumTip.sx - uTip.sx) * buildT}
                    y2={uTip.sy + (sumTip.sy - uTip.sy) * buildT}
                    stroke="var(--teal-400)" strokeWidth={1.8}
                    strokeDasharray="6 5" strokeLinecap="round" opacity={0.85}/>
              {/* Translate-of-u from v's tip toward sum */}
              <line x1={vTip.sx} y1={vTip.sy}
                    x2={vTip.sx + (sumTip.sx - vTip.sx) * buildT}
                    y2={vTip.sy + (sumTip.sy - vTip.sy) * buildT}
                    stroke="var(--amber-400)" strokeWidth={1.8}
                    strokeDasharray="6 5" strokeLinecap="round" opacity={0.85}/>
            </g>
          )}

          {/* Sum vector u+v */}
          {sumProgress > 0 && (
            <ArrowFromOrigin G={G} x={sumX} y={sumY} color="var(--amber-300)"
                             strokeWidth={3.6} progress={sumProgress}
                             label={sumProgress > 0.95 ? 'u+v' : null}
                             labelDX={26} labelDY={-6}/>
          )}

          {/* Scalar scrub: c · v (using direction so it slides along the line) */}
          {scrubT > 0 && (
            <g>
              {/* Trail from origin to current c-point — paints over time */}
              <line x1={origin.sx} y1={origin.sy} x2={cPt.sx} y2={cPt.sy}
                    stroke="var(--rose-400)" strokeWidth={2.2} opacity={0.9}/>
              <circle cx={cPt.sx} cy={cPt.sy} r={6}
                      fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.5}/>
              <text x={cPt.sx + (cValue > 0 ? 14 : -14)}
                    y={cPt.sy + (cValue > 0 ? -10 : 18)}
                    fill="var(--rose-300)" fontFamily="var(--font-mono)"
                    fontSize={14} textAnchor={cValue > 0 ? 'start' : 'end'}
                    opacity={clamp((Math.abs(cValue) - 0.18) / 0.12, 0, 1)}>
                c = {cValue.toFixed(2)}
              </text>
            </g>
          )}

          {/* Origin dot */}
          <circle cx={origin.sx} cy={origin.sy} r={4}
                  fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.2}/>
          <text x={origin.sx - 10} y={origin.sy + 22}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end" opacity={0.85}>0</text>
        </svg>
      </div>

      <SoftPanel G={G} portrait={portrait}>
        <FadeUp duration={0.4} delay={6.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          line through origin
        </FadeUp>
        <FadeUp duration={0.55} delay={6.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 20 : 22, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            u + v stays on the line,<br/>
            c · v stays on the line,<br/>
            0 is on the line.
        </FadeUp>
        <FadeUp duration={0.5} delay={8.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          All three tests pass — a subspace of the plane.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Offset line fails ────────────────────────────────────────────
// Affine line y = 0.5 x + 2 (slope (2,1) direction, y-intercept +2).
// u, v end on it. u + v lands off.
function LineFailBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();

  const dx = 2, dy = 1;             // direction
  const y0 = 2;                     // y-intercept (offset)
  // u and v points on the offset line.
  const ux = -2, uy = -1 + y0;     // (-2, 1)
  const vx = 1,  vy = 0.5 + y0;    // (1, 2.5)
  const sumX = ux + vx, sumY = uy + vy; // (-1, 3.5)
  // Where the offset line would be at x = sumX:  y = 0.5 * (-1) + 2 = 1.5
  // → sum is at (−1, 3.5), but the line at x = −1 is at y = 1.5, so sum is 2 above.

  const buildT = clamp((localTime - 2.4) / 1.0, 0, 1);
  const sumProgress = clamp((localTime - 3.2) / 1.0, 0, 1);
  const xVisible = clamp((localTime - 3.8) / 0.6, 0, 1);

  const uTip = toSvgF(G, ux, uy);
  const vTip = toSvgF(G, vx, vy);
  const sumTip = toSvgF(G, sumX, sumY);
  const origin = toSvgF(G, 0, 0);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '54%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0.0}>
            <ReferenceGridSvg G={G} opacity={0.22}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.1}>
            <Axes2DSvg G={G}/>
          </SvgFadeIn>

          {/* Faint reference line through origin (for contrast) */}
          <SvgFadeIn duration={0.4} delay={0.0}>
            <InfiniteLine G={G} x0={0} y0={0} dx={dx} dy={dy}
                          color="var(--violet-400)" strokeWidth={1.6}
                          dashed={true} opacity={0.4}/>
          </SvgFadeIn>

          {/* The offset line itself (rose) */}
          <SvgFadeIn duration={0.5} delay={0.0}>
            <InfiniteLine G={G} x0={0} y0={y0} dx={dx} dy={dy}
                          color="var(--rose-400)" strokeWidth={2.6} opacity={0.9}/>
          </SvgFadeIn>

          {/* u and v end on the offset line */}
          <SvgFadeIn duration={0.4} delay={0.7}>
            <ArrowFromOrigin G={G} x={ux} y={uy} color="var(--amber-400)"
                             label="u" labelDX={-22} labelDY={4}/>
          </SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={1.4}>
            <ArrowFromOrigin G={G} x={vx} y={vy} color="var(--teal-400)"
                             label="v" labelDX={22} labelDY={-6}/>
          </SvgFadeIn>

          {/* Parallelogram-rule construction */}
          {buildT > 0 && (
            <g opacity={buildT}>
              <line x1={uTip.sx} y1={uTip.sy}
                    x2={uTip.sx + (sumTip.sx - uTip.sx) * buildT}
                    y2={uTip.sy + (sumTip.sy - uTip.sy) * buildT}
                    stroke="var(--teal-400)" strokeWidth={1.8}
                    strokeDasharray="6 5" strokeLinecap="round" opacity={0.85}/>
              <line x1={vTip.sx} y1={vTip.sy}
                    x2={vTip.sx + (sumTip.sx - vTip.sx) * buildT}
                    y2={vTip.sy + (sumTip.sy - vTip.sy) * buildT}
                    stroke="var(--amber-400)" strokeWidth={1.8}
                    strokeDasharray="6 5" strokeLinecap="round" opacity={0.85}/>
            </g>
          )}

          {/* Sum vector u+v lands OFF the line */}
          {sumProgress > 0 && (
            <ArrowFromOrigin G={G} x={sumX} y={sumY} color="var(--rose-300)"
                             strokeWidth={3.4} progress={sumProgress}
                             label={sumProgress > 0.95 ? 'u + v' : null}
                             labelDX={-32} labelDY={-8}/>
          )}

          {/* X mark on the failure */}
          {xVisible > 0 && (
            <g opacity={xVisible}>
              <CrossMark cx={sumTip.sx} cy={sumTip.sy}
                         color="var(--rose-400)" scale={1.0 + 0.3 * (1 - xVisible)}/>
              <text x={sumTip.sx + 18} y={sumTip.sy - 16}
                    fill="var(--rose-300)" fontFamily="var(--font-sans)"
                    fontSize={13} letterSpacing="0.06em" textAnchor="start">
                off the line
              </text>
            </g>
          )}

          {/* Origin dot (clearly not on the line) */}
          <circle cx={origin.sx} cy={origin.sy} r={4}
                  fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.2}/>
          <text x={origin.sx - 10} y={origin.sy + 22}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end" opacity={0.85}>0</text>
        </svg>
      </div>

      <SoftPanel G={G} portrait={portrait}>
        <FadeUp duration={0.4} delay={4.8} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--rose-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          line not through origin
        </FadeUp>
        <FadeUp duration={0.55} delay={5.2} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 20 : 22, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            u + v leaves the line.<br/>
            And 0 is not on the line.
        </FadeUp>
        <FadeUp duration={0.5} delay={6.4} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--rose-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          Closure fails — not a subspace.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: portrait ? 600 : 900,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.8} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 48, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        Every subspace must touch the <span style={{ color: 'var(--amber-300)' }}>origin</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '40ch', lineHeight: 1.4,
        }}>
        Lines and planes through 0 do.<br/>Anything offset does not.
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION}
           background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
