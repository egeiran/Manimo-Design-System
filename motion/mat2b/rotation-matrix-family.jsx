// Rotation Matrices Add Their Angles — Manimo lesson scene.
// Mat2B chapter 2 (Lineærtransformasjoner). R(θ) parametrises plane
// rotations. Sweeping θ rotates the basis along a circle; composing
// R(α) and R(β) gives R(α + β). Matrix multiplication becomes angle
// addition.
//
//   R(θ) = [cos θ   −sin θ]
//          [sin θ    cos θ]
//
// The two columns of R(θ) are e₁ and e₂ after rotating by θ. Because
// the columns are unit vectors locked 90° apart, R is orthogonal and
// preserves lengths and angles.
//
// Authoring notes:
//   • SvgFadeIn inside SVG; FadeUp outside. SceneChrome owns title /
//     watermark / corner mascot.
//   • Beat 3 is the genuine animation: a continuous sweep of θ from 0
//     to 2π. Both basis vectors trace the unit circle with fading
//     trails; the matrix panel updates live.
//   • Beat 4 is the angle-addition story: R(30°) applied first, then
//     R(45°). The grid rotates in two stages and lands at 75°, while
//     the formula R(α)·R(β) = R(α + β) reveals.

const SCENE_DURATION = 56;

const NARRATION = [
  /*  0.0– 4.5 */ 'What does a rotation matrix actually do — and what happens when you multiply two of them?',
  /*  4.5–14.0 */ 'The rotation matrix R of theta has cosine on the diagonal and sine off it, with one minus sign. Its columns are where e one and e two land after rotating by theta.',
  /* 14.0–30.0 */ 'Sweep theta from zero all the way around. The basis vectors trace circles. Both columns rotate together, locked ninety degrees apart — that is what keeps R orthogonal.',
  /* 30.0–47.0 */ 'Apply R of thirty degrees, then R of forty-five degrees. The grid rotates by seventy-five — the angles add. So the matrix product equals R of alpha plus beta. Matrix multiplication becomes angle addition.',
  /* 47.0–56.0 */ 'A rotation matrix turns the plane by its angle. Multiplying two rotations adds their angles — geometry hiding inside matrix arithmetic.',
];

const NARRATION_AUDIO = 'audio/rotation-matrix-family/scene.mp3';

// ─── Math helpers ─────────────────────────────────────────────────────────
function rot(theta) {
  return [[Math.cos(theta), -Math.sin(theta)],
          [Math.sin(theta),  Math.cos(theta)]];
}
function applyM(M, x, y) {
  return [M[0][0]*x + M[0][1]*y, M[1][0]*x + M[1][1]*y];
}
function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}
function fmt2(v) {
  if (Math.abs(v) < 1e-3) return '0.00';
  return (v >= 0 ? ' ' : '') + v.toFixed(2);
}

const IDENTITY = [[1, 0], [0, 1]];

// ─── Plane geometry per aspect ────────────────────────────────────────────
function geom(portrait) {
  if (portrait) {
    return {
      unit: 130,
      vbW: 620, vbH: 620,
      ox: 310, oy: 310,
      X_MIN: -2.2, X_MAX: 2.2, Y_MIN: -2.2, Y_MAX: 2.2,
      planePos: { left: '50%', top: 200, transform: 'translate(-50%, 0)' },
      matrixPos: { left: 36, right: 36, top: 880 },
      angleReadoutPos: { left: 36, top: 830 },
    };
  }
  return {
    unit: 130,
    vbW: 600, vbH: 600,
    ox: 300, oy: 300,
    X_MIN: -2.2, X_MAX: 2.2, Y_MIN: -2.2, Y_MAX: 2.2,
    planePos: { left: 100, top: 90 },
    matrixPos: { right: 56, top: 200, width: 360 },
    angleReadoutPos: { right: 56, top: 150 },
  };
}
function toSvg(G, x, y) {
  return { sx: G.ox + x * G.unit, sy: G.oy - y * G.unit };
}

// ─── Reusable visuals ─────────────────────────────────────────────────────
function PlaneChrome({ G, gridOpacity = 0.16, showCircle = false }) {
  const left = toSvg(G, G.X_MIN, 0).sx;
  const right = toSvg(G, G.X_MAX, 0).sx;
  const top = toSvg(G, 0, G.Y_MAX).sy;
  const bottom = toSvg(G, 0, G.Y_MIN).sy;
  const yAxis = toSvg(G, 0, 0).sx;
  const xAxis = toSvg(G, 0, 0).sy;
  const verticals = [];
  for (let k = Math.ceil(G.X_MIN); k <= Math.floor(G.X_MAX); k++) {
    if (k === 0) continue;
    const sx = toSvg(G, k, 0).sx;
    verticals.push(
      <line key={`v${k}`} x1={sx} y1={top} x2={sx} y2={bottom}
            stroke="var(--chalk-300)" strokeWidth={0.7} opacity={gridOpacity}/>
    );
  }
  const horizontals = [];
  for (let k = Math.ceil(G.Y_MIN); k <= Math.floor(G.Y_MAX); k++) {
    if (k === 0) continue;
    const sy = toSvg(G, 0, k).sy;
    horizontals.push(
      <line key={`h${k}`} x1={left} y1={sy} x2={right} y2={sy}
            stroke="var(--chalk-300)" strokeWidth={0.7} opacity={gridOpacity}/>
    );
  }
  const origin = toSvg(G, 0, 0);
  return (
    <g>
      {verticals}
      {horizontals}
      <line x1={left} y1={xAxis} x2={right} y2={xAxis}
            stroke="var(--chalk-200)" strokeWidth={1.5}/>
      <line x1={yAxis} y1={top} x2={yAxis} y2={bottom}
            stroke="var(--chalk-200)" strokeWidth={1.5}/>
      {showCircle && (
        <circle cx={origin.sx} cy={origin.sy} r={G.unit}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="6 6" opacity={0.45}/>
      )}
    </g>
  );
}

function Arrow({ G, to, color, strokeWidth = 3.6, headLen = 14, headHalf = 7, glow = 0 }) {
  const a = toSvg(G, 0, 0);
  const b = toSvg(G, to[0], to[1]);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx/len, uy = dy/len;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      {glow > 0 && (
        <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
              stroke={color} strokeWidth={strokeWidth + 6}
              strokeLinecap="round" opacity={0.2 * glow}/>
      )}
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
    </g>
  );
}

function Shape({ G, M, fill, fillOpacity = 0.18, stroke, strokeWidth = 2.5 }) {
  const corners = [[0,0],[1,0],[1,1],[0,1]];
  const pts = corners.map(([x, y]) => {
    const [tx, ty] = applyM(M, x, y);
    const p = toSvg(G, tx, ty);
    return `${p.sx.toFixed(1)},${p.sy.toFixed(1)}`;
  }).join(' ');
  return (
    <polygon points={pts} fill={fill} fillOpacity={fillOpacity}
             stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round"/>
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

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="rotation matrices"
      title="R(α) · R(β) = R(α + β)"
      duration={SCENE_DURATION}
      introEnd={5.63}
      introCaption="Two rotations — one matrix."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.63} end={18.16}>
        <DefinitionBeat />
      </Sprite>

      <Sprite start={18.16} end={29.56}>
        <SweepBeat />
      </Sprite>

      <Sprite start={29.56} end={44.8}>
        <AngleAdditionBeat />
      </Sprite>

      <Sprite start={44.8} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Definition — R(θ) formula + e1/e2 ────────────────────────────
function DefinitionBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  return (
    <>
      <Plane G={G}>
        <SvgFadeIn duration={0.5} delay={0.5}>
          <PlaneChrome G={G} showCircle/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.0}>
          <Arrow G={G} to={[1, 0]} color="var(--violet-400)"/>
          <BasisLabel G={G} to={[1, 0]} text="e₁" color="var(--violet-300)"
                       dx={6} dy={22}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.4}>
          <Arrow G={G} to={[0, 1]} color="var(--teal-400)"/>
          <BasisLabel G={G} to={[0, 1]} text="e₂" color="var(--teal-300)"
                       dx={-24} dy={-4}/>
        </SvgFadeIn>
      </Plane>

      <MatrixCard
        portrait={portrait}
        position={G.matrixPos}
        eyebrow="rotation matrix R(θ)"
        rows={[
          { cells: ['cos θ', '−sin θ'], colors: ['var(--violet-300)', 'var(--teal-300)'] },
          { cells: ['sin θ',  'cos θ'], colors: ['var(--violet-300)', 'var(--teal-300)'] },
        ]}
        footnote="The two columns are e₁ and e₂ after rotating by θ."
        delay={2.6}
      />
    </>
  );
}

function BasisLabel({ G, to, text, color, dx = 0, dy = 0 }) {
  const p = toSvg(G, to[0], to[1]);
  return (
    <text x={p.sx + dx} y={p.sy + dy} fill={color}
          fontFamily="var(--font-serif)" fontStyle="italic"
          fontSize={20}>{text}</text>
  );
}

// ─── Beat 3: Sweep θ from 0 to 2π ─────────────────────────────────────────
function SweepBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // Hold at θ=0 for ~10 % of the beat so the eye locks on; sweep through
  // the next ~80 %; hold the last ~10 % at θ = 2π so the matrix readout
  // settles. Fractions keep the choreography in sync with audio timings.
  const f = localTime / Math.max(0.001, beatDur);
  const sweepF = (f - 0.10) / 0.80;
  const theta = Math.min(2 * Math.PI, smoothstep(Math.max(0, sweepF)) * 2 * Math.PI);
  const M = rot(theta);
  const e1 = applyM(M, 1, 0);
  const e2 = applyM(M, 0, 1);
  // Trail: dot positions sampled along the swept arc.
  const trailPts = [];
  const N = 24;
  const traveled = theta;
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * traveled;
    trailPts.push([Math.cos(a), Math.sin(a)]);
  }
  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G} showCircle/>
        {/* e1 trail (violet) */}
        <Trail G={G} pts={trailPts.map(([x,y]) => [x, y])}
               color="var(--violet-400)" opacity={0.4}/>
        {/* e2 trail (teal) — same arc but 90° ahead */}
        <Trail G={G} pts={trailPts.map(([x,y]) => [-y, x])}
               color="var(--teal-400)" opacity={0.4}/>
        <Arrow G={G} to={e1} color="var(--violet-400)" glow={1}/>
        <Arrow G={G} to={e2} color="var(--teal-400)" glow={1}/>
      </Plane>

      <MatrixCard
        portrait={portrait}
        position={G.matrixPos}
        eyebrow={`θ = ${(theta * 180 / Math.PI).toFixed(0)}°`}
        rows={[
          { cells: [fmt2(M[0][0]), fmt2(M[0][1])], colors: ['var(--violet-300)', 'var(--teal-300)'] },
          { cells: [fmt2(M[1][0]), fmt2(M[1][1])], colors: ['var(--violet-300)', 'var(--teal-300)'] },
        ]}
        footnote={`cos ${(theta * 180 / Math.PI).toFixed(0)}° on the diagonal, sin off it.`}
        delay={0}
        monoCells
      />
    </>
  );
}

function Trail({ G, pts, color, opacity = 0.4 }) {
  if (pts.length < 2) return null;
  const d = pts.map((p, i) => {
    const s = toSvg(G, p[0], p[1]);
    return (i === 0 ? 'M ' : 'L ') + `${s.sx.toFixed(1)} ${s.sy.toFixed(1)}`;
  }).join(' ');
  return <path d={d} fill="none" stroke={color} strokeWidth={2}
               opacity={opacity} strokeLinecap="round"/>;
}

// ─── Beat 4: Angle addition R(α) · R(β) = R(α + β) ───────────────────────
function AngleAdditionBeat() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration: beatDur } = useSprite();
  // Phases as fractions of beatDur so the choreography scales with audio:
  //   0.00 – 0.07  identity holds
  //   0.07 – 0.30  rotate by α = 30°
  //   0.30 – 0.36  pause at 30°
  //   0.36 – 0.60  rotate by another β = 45° (total 75°)
  //   0.60 – end   hold at 75°, reveal R(α)R(β) = R(α+β) callout
  const ALPHA = 30 * Math.PI / 180;
  const BETA  = 45 * Math.PI / 180;
  const f = localTime / Math.max(0.001, beatDur);
  let theta;
  if (f < 0.07) theta = 0;
  else if (f < 0.30) theta = ALPHA * smoothstep((f - 0.07) / 0.23);
  else if (f < 0.36) theta = ALPHA;
  else if (f < 0.60) theta = ALPHA + BETA * smoothstep((f - 0.36) / 0.24);
  else theta = ALPHA + BETA;

  const M = rot(theta);
  // Phase callouts at the bottom-left
  const phase = f < 0.07 ? 'identity'
              : f < 0.36 ? 'apply R(30°)'
              : f < 0.60 ? 'apply R(45°) on top'
              : 'total angle 75°';

  const formulaShow = f > 0.65;

  return (
    <>
      <Plane G={G}>
        <PlaneChrome G={G} showCircle/>
        {/* Faint identity square for reference */}
        <Shape G={G} M={IDENTITY} fill="var(--chalk-300)" fillOpacity={0.06}
               stroke="var(--chalk-300)" strokeWidth={1.2}/>
        {/* Intermediate "30°" ghost (visible once we're past it) */}
        {theta > ALPHA - 0.01 && (
          <Shape G={G} M={rot(ALPHA)} fill="var(--rose-400)" fillOpacity={0.08}
                 stroke="var(--rose-300)" strokeWidth={1.3}/>
        )}
        <Shape G={G} M={M} fill="var(--amber-400)" fillOpacity={0.22}
               stroke="var(--amber-300)" strokeWidth={2.5}/>
        <Arrow G={G} to={applyM(M, 1, 0)} color="var(--violet-400)"/>
        <Arrow G={G} to={applyM(M, 0, 1)} color="var(--teal-400)"/>
      </Plane>

      <div style={{
        position: 'absolute',
        ...(portrait
          ? { left: 36, right: 36, top: 870, textAlign: 'center' }
          : { left: 60, top: 220, width: 320 }),
        padding: '14px 18px',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(232,220,193,0.12)',
        borderRadius: 12,
        pointerEvents: 'none',
      }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          step
        </div>
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 20 : 22, color: 'var(--chalk-100)',
        }}>
          {phase}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', marginTop: 6, letterSpacing: '0.04em',
        }}>
          θ = {(theta * 180 / Math.PI).toFixed(0)}°
        </div>
      </div>

      {formulaShow && (
        <FadeUp duration={0.7} delay={0} distance={16}
          style={{
            position: 'absolute',
            ...(portrait
              ? { left: 36, right: 36, top: 1030, textAlign: 'center' }
              : { right: 60, top: 220, width: 360, textAlign: 'center' }),
            padding: '16px 20px',
            background: 'rgba(0,0,0,0.55)',
            border: '1px solid rgba(244,184,96,0.45)',
            borderRadius: 14,
            boxShadow: '0 12px 36px rgba(244,184,96,0.18), 0 10px 32px rgba(0,0,0,0.35)',
            pointerEvents: 'none',
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase', marginBottom: 8,
          }}>
            the matrix identity
          </div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 28 : 32, color: 'var(--amber-300)',
            lineHeight: 1.3,
          }}>
            R(30°) · R(45°) = R(75°)
          </div>
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 5: takeaway ─────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <FadeUp duration={0.45} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.8} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 54, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        R(α) · R(β) = R(α + β)
      </FadeUp>
      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 20 : 24, color: 'var(--chalk-200)',
          maxWidth: portrait ? '24ch' : '40ch', lineHeight: 1.35,
        }}>
        Matrix multiplication, written as angle addition.
      </FadeUp>
    </div>
  );
}

// ─── Matrix panel ─────────────────────────────────────────────────────────
function MatrixCard({ portrait, position, eyebrow, rows, footnote, delay = 0,
                       monoCells = false }) {
  const cellFont = portrait ? 24 : 28;
  return (
    <FadeUp duration={0.5} delay={delay} distance={10}
      style={{
        position: 'absolute', ...position,
        padding: '16px 20px',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(232,220,193,0.07)',
        borderRadius: 14,
        boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column', gap: 10,
        pointerEvents: 'none',
      }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--amber-300)', letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}>{eyebrow}</div>
      <div style={{ position: 'relative', padding: '4px 14px', alignSelf: 'flex-start' }}>
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 9,
          borderLeft: '2.2px solid var(--chalk-200)',
          borderTop: '2.2px solid var(--chalk-200)',
          borderBottom: '2.2px solid var(--chalk-200)',
        }}/>
        <span style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 9,
          borderRight: '2.2px solid var(--chalk-200)',
          borderTop: '2.2px solid var(--chalk-200)',
          borderBottom: '2.2px solid var(--chalk-200)',
        }}/>
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${cellFont*3}px ${cellFont*3}px`,
          columnGap: 18, rowGap: 6,
          fontFamily: monoCells ? 'var(--font-mono)' : 'var(--font-serif)',
          fontStyle: monoCells ? 'normal' : 'italic',
          fontSize: cellFont, textAlign: 'right',
        }}>
          <span style={{ color: rows[0].colors[0] }}>{rows[0].cells[0]}</span>
          <span style={{ color: rows[0].colors[1] }}>{rows[0].cells[1]}</span>
          <span style={{ color: rows[1].colors[0] }}>{rows[1].cells[0]}</span>
          <span style={{ color: rows[1].colors[1] }}>{rows[1].cells[1]}</span>
        </div>
      </div>
      {footnote && (
        <div style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 14, color: 'var(--chalk-300)', lineHeight: 1.4,
          maxWidth: '32ch',
        }}>{footnote}</div>
      )}
    </FadeUp>
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
