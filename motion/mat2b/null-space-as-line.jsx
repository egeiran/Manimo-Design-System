// The Null Space Is a Line Through the Origin — Manimo lesson scene.
// Chapter 1 (Vektorrom). The singular matrix M = [[1, 2], [2, 4]] has
// linearly dependent rows; everything in its null space is a multiple of
// d = (2, -1). Beat 3 sweeps x along d and shows M·x glued at origin.
// Beat 4 pivots x off the line and shows M·x jumping to a nonzero point
// on the image line y = 2x.
//
// Beats:
//    0– 4   Manimo intro
//    4–13   Matrix setup — show M; image of M = line y = 2x
//   13–26   Sweep x along the null direction d; M·x stays at origin
//   26–35   Pivot x off the null line; M·x slides along the image line
//   35–42   Takeaway: null(M) = span(d)
//
// Genuine animation: beats 3 and 4 drive x's tip (and the resulting M·x
// image point) from useSprite localTime — true mechanism, not fades.

const SCENE_DURATION = 50;

const NARRATION = [
  /*  0– 4 */ 'Some matrices squash a whole line down to a single point — the origin. Which vectors get sent there?',
  /*  4–13 */ 'Take the matrix M with rows one two and two four. The second row is twice the first, so M is singular — it collapses the plane onto a single line through the origin.',
  /* 13–26 */ 'Now sweep x along the direction d equals two negative one. As x moves up and down that line, M times x stays pinned to the origin — every one of those vectors lands on zero.',
  /* 26–35 */ 'Step x off that line. Now M times x is no longer zero — the image point jumps onto the image line. Only the direction d sits in the null space; everything else is mapped elsewhere.',
  /* 35–42 */ 'The null space of M is exactly the line spanned by d — a one-dimensional subspace of the plane.',
];

const NARRATION_AUDIO = 'audio/null-space-as-line/scene.mp3';

function geom(portrait) {
  return portrait
    ? { vbW: 620, vbH: 660, ox: 310, oy: 350, unit: 46,
        gridXMin: -5, gridXMax: 5, gridYMin: -5, gridYMax: 5 }
    : { vbW: 720, vbH: 560, ox: 360, oy: 300, unit: 50,
        gridXMin: -6, gridXMax: 6, gridYMin: -4, gridYMax: 4 };
}

function toSvgF(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

function ReferenceGridSvg({ G, opacity = 0.22 }) {
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

function ArrowFromOrigin({ G, x, y, color, label = null, labelDX = 0, labelDY = 0,
                          strokeWidth = 3.4, opacity = 1 }) {
  const a = toSvgF(G, 0, 0);
  const b = toSvgF(G, x, y);
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
    <g style={{ opacity }}>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

function SoftPanel({ portrait, children }) {
  return (
    <div style={{
      position: 'absolute',
      ...(portrait
        ? { left: 48, right: 48, top: 940, bottom: 100 }
        : { right: 56, top: 240, width: 360 }),
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

// Matrix M = [[1, 2], [2, 4]]. Null direction d = (2, -1).
// Image of M lies on the line y = 2x (since for any x, M·x = (x1 + 2x2)·(1, 2)).
function applyM(x, y) {
  return [1 * x + 2 * y, 2 * x + 4 * y];
}
const D = [2, -1];                  // null direction
const D_NORM = Math.hypot(D[0], D[1]); // for axis-line endpoints

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="vector spaces"
      title="The Null Space Is a Line"
      duration={SCENE_DURATION}
      introEnd={6.57}
      introCaption="Which vectors does this matrix squash to zero?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.57} end={17.19}>
        <MatrixSetupBeat/>
      </Sprite>

      <Sprite start={17.19} end={29.48}>
        <SweepOnNullLineBeat/>
      </Sprite>

      <Sprite start={29.48} end={42.3}>
        <OffTheLineBeat/>
      </Sprite>

      <Sprite start={42.3} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Matrix setup — show M, the image line y = 2x ─────────────────
function MatrixSetupBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  // Image line direction (1, 2). Endpoints inside grid.
  const imgT = 2.6;
  const imgA = toSvgF(G, -imgT, -2 * imgT);
  const imgB = toSvgF(G,  imgT,  2 * imgT);
  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0}><ReferenceGridSvg G={G}/></SvgFadeIn>
          <SvgFadeIn duration={0.4} delay={0.2}><Axes2DSvg G={G}/></SvgFadeIn>

          {/* Highlight image line y = 2x */}
          <TraceIn d={`M ${imgA.sx} ${imgA.sy} L ${imgB.sx} ${imgB.sy}`}
                   stroke="var(--amber-300)" strokeWidth={3.0}
                   duration={1.2} delay={1.0}/>

          {/* Label "image line: y = 2x" */}
          <SvgFadeIn duration={0.5} delay={2.4}>
            <text x={imgB.sx + 6} y={imgB.sy - 6}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={18} textAnchor="start">
              y = 2x
            </text>
          </SvgFadeIn>

          {/* A few sample x vectors mapped to show they all land on the line */}
          {[[1.6, 0.4], [-1.0, 1.0], [0.6, 1.4]].map(([px, py], i) => {
            const [qx, qy] = applyM(px, py);
            const a = toSvgF(G, px, py);
            const b = toSvgF(G, qx, qy);
            return (
              <SvgFadeIn key={i} duration={0.4} delay={3.5 + i * 0.6}>
                <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                      stroke="var(--chalk-300)" strokeWidth={1.4}
                      strokeDasharray="3 4" opacity={0.6}/>
                <circle cx={a.sx} cy={a.sy} r={4.5}
                        fill="var(--rose-300)" opacity={0.85}/>
                <circle cx={b.sx} cy={b.sy} r={5}
                        fill="var(--amber-300)" stroke="var(--chalk-100)" strokeWidth={1.2}/>
              </SvgFadeIn>
            );
          })}

          <circle cx={toSvgF(G, 0, 0).sx} cy={toSvgF(G, 0, 0).sy} r={4}
                  fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          a singular matrix
        </FadeUp>
        <FadeUp duration={0.6} delay={0.5} distance={12}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            M = [[1, 2], [2, 4]]
        </FadeUp>
        <FadeUp duration={0.5} delay={1.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          row 2 is twice row 1 — det M = 0.
        </FadeUp>
        <FadeUp duration={0.5} delay={3.0} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-100)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 2,
          }}>
          every output sits on the same line.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Sweep x along the null direction d ───────────────────────────
function SweepOnNullLineBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();
  const origin = toSvgF(G, 0, 0);

  // Sweep parameter s in [-2, +2] for x = s · d. d = (2, -1).
  const sweepStart = 1.0, sweepEnd = 10.0;
  const phase = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);

  // s sweeps: 0 → +2 → -2 → +1 (back-and-forth).
  function sAt(p) {
    if (p < 0.30) return  0   + ( 2 - 0)    * Easing.easeInOutCubic(p / 0.30);
    if (p < 0.70) return  2   + (-2 - 2)    * Easing.easeInOutCubic((p - 0.30) / 0.40);
    return                -2  + ( 1 - (-2)) * Easing.easeInOutCubic((p - 0.70) / 0.30);
  }
  const s = (localTime < sweepStart) ? 0 : sAt(phase);
  const xx = s * D[0];
  const xy = s * D[1];
  const [mxx, mxy] = applyM(xx, xy); // Always (0, 0) since d is in null(M).

  // Draw the null direction line (full extent through origin).
  const tMax = 4.5;
  const lineA = toSvgF(G, -tMax * D[0] / D_NORM, -tMax * D[1] / D_NORM);
  const lineB = toSvgF(G,  tMax * D[0] / D_NORM,  tMax * D[1] / D_NORM);

  const xTipS = toSvgF(G, xx, xy);
  const mxTipS = toSvgF(G, mxx, mxy);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0}><ReferenceGridSvg G={G}/></SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* The null-direction line through origin (dashed rose) */}
          <SvgFadeIn duration={0.5} delay={0.4}>
            <line x1={lineA.sx} y1={lineA.sy} x2={lineB.sx} y2={lineB.sy}
                  stroke="var(--rose-400)" strokeWidth={2.0}
                  strokeDasharray="6 5" opacity={0.85}/>
            <text x={lineB.sx + 8} y={lineB.sy + 14}
                  fill="var(--rose-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={18} textAnchor="start">
              d = (2, −1)
            </text>
          </SvgFadeIn>

          {/* Moving vector x = s · d */}
          {localTime >= sweepStart && Math.hypot(xx, xy) > 0.05 && (
            <ArrowFromOrigin G={G} x={xx} y={xy}
              color="var(--rose-300)" strokeWidth={3.4}
              label="x" labelDX={16} labelDY={-2}/>
          )}

          {/* Image point M·x — pinned at origin, drawn as amber dot */}
          <circle cx={mxTipS.sx} cy={mxTipS.sy} r={11}
                  fill="var(--amber-300)"
                  stroke="var(--chalk-100)" strokeWidth={2.0}/>
          <circle cx={mxTipS.sx} cy={mxTipS.sy} r={18}
                  fill="none" stroke="var(--amber-300)"
                  strokeWidth={1.4} opacity={0.55}/>

          {/* Tiny dotted leader from x to M·x */}
          {Math.hypot(xx, xy) > 0.2 && (
            <line x1={xTipS.sx} y1={xTipS.sy} x2={mxTipS.sx} y2={mxTipS.sy}
                  stroke="var(--chalk-300)" strokeWidth={1.2}
                  strokeDasharray="2 5" opacity={0.5}/>
          )}

          <circle cx={origin.sx} cy={origin.sy} r={4} fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          along the null direction
        </FadeUp>
        <FadeUp duration={0.5} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            x = s&nbsp;<span style={{ color: 'var(--rose-300)' }}>d</span>
        </FadeUp>
        <FadeUp duration={0.4} delay={1.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
            color: 'var(--rose-300)', marginTop: 6,
          }}>
            x = ({xx.toFixed(2)}, {xy.toFixed(2)})
        </FadeUp>
        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
            color: 'var(--amber-300)',
          }}>
            Mx = ({mxx.toFixed(2)}, {mxy.toFixed(2)})
        </FadeUp>
        <FadeUp duration={0.5} delay={10.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-100)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          every x on this line lies in null(M).
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Pivot x off the null line ────────────────────────────────────
function OffTheLineBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime } = useSprite();
  const origin = toSvgF(G, 0, 0);

  // Rotate x around origin starting from d direction, then sweeping through
  // angles that take it OFF the null line. r is chosen so M·x stays inside
  // the visible grid (|M·x| ≤ 4 when x is perpendicular to d; M stretches
  // the perpendicular direction by a factor of 5).
  const sweepStart = 1.0, sweepEnd = 8.0;
  const phase = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);
  // d direction angle.
  const dTheta = Math.atan2(D[1], D[0]); // ≈ -0.4636 rad
  // Angular offset: starts at 0 (on null line), eases to +PI/2 then back to +PI/4.
  function offAt(p) {
    if (p < 0.5) return 0 + (Math.PI * 0.5) * Easing.easeInOutCubic(p / 0.5);
    return Math.PI * 0.5 + (Math.PI * 0.25 - Math.PI * 0.5)
                          * Easing.easeInOutCubic((p - 0.5) / 0.5);
  }
  const off = (localTime < sweepStart) ? 0 : offAt(phase);
  const theta = dTheta + off;
  const r = 0.85; // fixed magnitude for x — keeps M·x inside the grid
  const xx = r * Math.cos(theta);
  const xy = r * Math.sin(theta);
  const [mxx, mxy] = applyM(xx, xy);

  // Image line for context.
  const imgT = 2.6;
  const imgA = toSvgF(G, -imgT, -2 * imgT);
  const imgB = toSvgF(G,  imgT,  2 * imgT);
  // Faded null line for orientation.
  const tMax = 4.5;
  const nullA = toSvgF(G, -tMax * D[0] / D_NORM, -tMax * D[1] / D_NORM);
  const nullB = toSvgF(G,  tMax * D[0] / D_NORM,  tMax * D[1] / D_NORM);

  const xTipS = toSvgF(G, xx, xy);
  const mxTipS = toSvgF(G, mxx, mxy);
  const mxMag = Math.hypot(mxx, mxy);

  return (
    <>
      <div style={{
        position: 'absolute', left: '50%',
        top: portrait ? '34%' : '52%',
        transform: 'translate(-50%, -50%)',
      }}>
        <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
             style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={0}><ReferenceGridSvg G={G}/></SvgFadeIn>
          <Axes2DSvg G={G}/>

          {/* Faded null line for reference */}
          <line x1={nullA.sx} y1={nullA.sy} x2={nullB.sx} y2={nullB.sy}
                stroke="var(--rose-400)" strokeWidth={1.6}
                strokeDasharray="6 5" opacity={0.35}/>

          {/* Image line (y = 2x) where M·x lives */}
          <SvgFadeIn duration={0.5} delay={0.2}>
            <line x1={imgA.sx} y1={imgA.sy} x2={imgB.sx} y2={imgB.sy}
                  stroke="var(--amber-300)" strokeWidth={2.2} opacity={0.85}/>
            <text x={imgB.sx + 6} y={imgB.sy - 6}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={16} textAnchor="start">
              y = 2x
            </text>
          </SvgFadeIn>

          {/* x rotating away from null direction */}
          {localTime >= sweepStart && (
            <ArrowFromOrigin G={G} x={xx} y={xy}
              color="var(--rose-300)" strokeWidth={3.4}
              label="x" labelDX={16} labelDY={-2}/>
          )}

          {/* M·x sliding along image line, dot grows with |Mx| */}
          {localTime >= sweepStart && mxMag > 0.05 && (
            <g>
              <line x1={xTipS.sx} y1={xTipS.sy} x2={mxTipS.sx} y2={mxTipS.sy}
                    stroke="var(--chalk-300)" strokeWidth={1.2}
                    strokeDasharray="2 5" opacity={0.5}/>
              <ArrowFromOrigin G={G} x={mxx} y={mxy}
                color="var(--amber-400)" strokeWidth={3.0}/>
              <circle cx={mxTipS.sx} cy={mxTipS.sy}
                      r={Math.min(11, 5 + mxMag * 1.3)}
                      fill="var(--amber-300)"
                      stroke="var(--chalk-100)" strokeWidth={1.4}/>
            </g>
          )}

          <circle cx={origin.sx} cy={origin.sy} r={4} fill="var(--chalk-100)"/>
        </svg>
      </div>

      <SoftPanel portrait={portrait}>
        <FadeUp duration={0.4} delay={0.3} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}>
          step off the line
        </FadeUp>
        <FadeUp duration={0.5} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            Mx&nbsp;≠&nbsp;0
        </FadeUp>
        <FadeUp duration={0.4} delay={1.2} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 17,
            color: 'var(--amber-300)', marginTop: 6,
          }}>
            |Mx| = {mxMag.toFixed(2)}
        </FadeUp>
        <FadeUp duration={0.5} delay={4.5} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: portrait ? '32ch' : '32ch', marginTop: 4,
          }}>
          only the line of d gets squashed to zero.
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
          fontSize: portrait ? 38 : 50, color: 'var(--chalk-100)',
          lineHeight: 1.2,
        }}>
        null(M) = span(<span style={{ color: 'var(--rose-300)' }}>d</span>)
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '26ch' : '44ch', lineHeight: 1.4,
        }}>
        A subspace — line through the origin.
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
