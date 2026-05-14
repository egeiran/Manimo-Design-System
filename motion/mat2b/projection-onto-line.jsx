// Projection: Closest Is Perpendicular — Manimo lesson scene.
// Chapter 3 (Indreproduktrom). Project vector u onto the line spanned by
// v. The foot of the perpendicular is proj_v(u). The leftover u − proj_v(u)
// is orthogonal to v. The two pieces decompose u.

const SCENE_DURATION = 31;

const NARRATION = [
  "Project a vector onto a line — what is the closest point?",
  "Here is a vector u, and a line through the origin spanning some direction v. We want the shadow u casts on the line.",
  "Drop a perpendicular from u down to the line. Where it lands is the projection — the closest point. Everything left over is orthogonal to v.",
  "Algebraically, the projection scales v by u dot v over v dot v.",
  "Closest point is always the perpendicular drop.",
];

const NARRATION_AUDIO = 'audio/projection-onto-line/scene.mp3';

// ─── Geometry ────────────────────────────────────────────────────────────
const ORIGIN_X = 520;
const ORIGIN_Y = 400;
const UNIT = 72;
const GRID_X_MIN = -5, GRID_X_MAX = 8;
const GRID_Y_MIN = -3, GRID_Y_MAX = 4;

const V_DIR = [3, 1];        // line direction
const U     = [1, 3];        // the vector we project

// proj_v(u) = (u·v / v·v) v
const UV = U[0] * V_DIR[0] + U[1] * V_DIR[1];        // 6
const VV = V_DIR[0] * V_DIR[0] + V_DIR[1] * V_DIR[1]; // 10
const PROJ = [(UV / VV) * V_DIR[0], (UV / VV) * V_DIR[1]];   // (1.8, 0.6)
const RES = [U[0] - PROJ[0], U[1] - PROJ[1]];                // (-0.8, 2.4)

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// ─── Grid mask ───────────────────────────────────────────────────────────
function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="48%" cy="56%" r="60%">
          <stop offset="55%" stopColor="white" stopOpacity="1"/>
          <stop offset="100%" stopColor="white" stopOpacity="0"/>
        </radialGradient>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect x="0" y="0" width="1280" height="720" fill={`url(#${gradId})`}/>
        </mask>
      </defs>
      <g mask={`url(#${maskId})`}>{children}</g>
    </svg>
  );
}

function ReferenceGrid({ opacity = 0.32 }) {
  const lines = [];
  for (let k = GRID_X_MIN; k <= GRID_X_MAX; k++) {
    const a = toSvg(k, GRID_Y_MIN);
    const b = toSvg(k, GRID_Y_MAX);
    lines.push(<line key={`v${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  for (let k = GRID_Y_MIN; k <= GRID_Y_MAX; k++) {
    const a = toSvg(GRID_X_MIN, k);
    const b = toSvg(GRID_X_MAX, k);
    lines.push(<line key={`h${k}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                     stroke="var(--chalk-300)" strokeWidth={1.1}
                     opacity={opacity} strokeLinecap="round"/>);
  }
  return <g>{lines}</g>;
}

function Axes() {
  const left = toSvg(GRID_X_MIN, 0), right = toSvg(GRID_X_MAX, 0);
  const bot = toSvg(0, GRID_Y_MIN), top = toSvg(0, GRID_Y_MAX);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
    </g>
  );
}

function Vector({
  x, y, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 3.6, headLen = 13, headHalf = 7,
  fromX = 0, fromY = 0,
  opacity = 1, dashed = false,
}) {
  const a = toSvg(fromX, fromY);
  const b = toSvg(x, y);
  const dx = b.sx - a.sx, dy = b.sy - a.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = b.sx - ux * headLen;
  const baseY = b.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g style={{ opacity }}>
      <line x1={a.sx} y1={a.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={dashed ? '6 5' : undefined}/>
      <path d={`M ${b.sx} ${b.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={b.sx + labelDX} y={b.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">{label}</text>
      )}
    </g>
  );
}

// Long dashed line through origin in direction v, drawn from -k·v to +k·v.
function SpanLine({ v, color = 'var(--amber-400)', k = 4, dashed = true,
                    strokeWidth = 2.4, opacity = 0.7 }) {
  const a = toSvg(-k * v[0], -k * v[1]);
  const b = toSvg( k * v[0],  k * v[1]);
  return (
    <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={dashed ? '8 6' : undefined}
          opacity={opacity} strokeLinecap="round"/>
  );
}

// Small right-angle marker at point `at`, with one edge along `dirA` and
// other along `dirB`. Both `dirA` and `dirB` are 2D math vectors (any
// length). Size in pixels.
function RightAngleMark({ at, dirA, dirB, size = 12, color = 'var(--chalk-200)' }) {
  const p = toSvg(at[0], at[1]);
  const normA = Math.hypot(dirA[0], dirA[1]);
  const normB = Math.hypot(dirB[0], dirB[1]);
  const ua = [dirA[0] / normA, dirA[1] / normA];
  const ub = [dirB[0] / normB, dirB[1] / normB];
  // Move size units along ua, then size units along ub (in screen space we
  // flip y because svg y grows down).
  const pa = { sx: p.sx + ua[0] * size, sy: p.sy - ua[1] * size };
  const pb = { sx: p.sx + ub[0] * size, sy: p.sy - ub[1] * size };
  const pc = { sx: p.sx + (ua[0] + ub[0]) * size, sy: p.sy - (ua[1] + ub[1]) * size };
  return (
    <g stroke={color} strokeWidth={1.4} fill="none" opacity={0.8}>
      <line x1={pa.sx} y1={pa.sy} x2={pc.sx} y2={pc.sy}/>
      <line x1={pb.sx} y1={pb.sy} x2={pc.sx} y2={pc.sy}/>
    </g>
  );
}

function SoftPanel({ children, right = 60, top = 200, width = 360, left, bottom }) {
  const positioning = left != null ? { left, top, right: undefined }
                    : (bottom != null ? { left, bottom, top: undefined }
                    : { right, top });
  return (
    <div style={{
      position: 'absolute', width, ...positioning,
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
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
      eyebrow="inner product spaces"
      title="Projection onto a Line"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={4.41}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={4.41} end={12.13}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={12.13} end={21.13}>
        <DropPerpendicularBeat/>
      </Sprite>

      <Sprite start={21.13} end={27.18}>
        <FormulaBeat/>
      </Sprite>

      <Sprite start={27.18} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 22,
    }}>
      <svg width={170} height={170} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)', fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)', maxWidth: '24ch', lineHeight: 1.3,
        }}>
        What's the closest point on a line?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: setup u and span(v) ─────────────────────────────────────────
function SetupBeat() {
  return (
    <>
      <GridMaskedSvg maskId="proj-setup-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><ReferenceGrid/></SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}><Axes/></SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.6}>
          <SpanLine v={V_DIR}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.4}>
          <Vector x={V_DIR[0]} y={V_DIR[1]} color="var(--teal-400)"
                  label="v" labelDX={22} labelDY={-2}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.4}>
          <Vector x={U[0]} y={U[1]} color="var(--violet-400)"
                  label="u" labelDX={-20} labelDY={-4} strokeWidth={4}/>
        </SvgFadeIn>
        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={3.6} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          the setup
        </FadeUp>
        <FadeUp duration={0.55} delay={4.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 2,
          }}>
            Project <span style={{ color: 'var(--violet-400)' }}>u</span> onto the line spanned by <span style={{ color: 'var(--teal-400)' }}>v</span>.
        </FadeUp>
        <FadeUp duration={0.5} delay={5.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)',
            maxWidth: '32ch', lineHeight: 1.4, marginTop: 4,
          }}>
          Which point on the line is closest to u?
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: drop perpendicular ──────────────────────────────────────────
function DropPerpendicularBeat() {
  const { localTime } = useSprite();
  // Slide the projection foot out along v from origin to PROJ over 0.5-1.5s.
  const projT = clamp((localTime - 0.5) / 1.0, 0, 1);
  const projEased = Easing.easeOutCubic(projT);
  const projTip = [PROJ[0] * projEased, PROJ[1] * projEased];

  // Perpendicular drop appears 1.4-2.0s.
  const perpT = clamp((localTime - 1.4) / 0.6, 0, 1);
  // Residual arrow draws 2.2-2.8s.
  const resT = clamp((localTime - 2.2) / 0.6, 0, 1);

  return (
    <>
      <GridMaskedSvg maskId="proj-drop-mask">
        <SvgFadeIn duration={0.4} delay={0.0}><ReferenceGrid opacity={0.25}/></SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.0}><Axes/></SvgFadeIn>
        <SpanLine v={V_DIR}/>

        <Vector x={V_DIR[0]} y={V_DIR[1]} color="var(--teal-400)"
                label="v" labelDX={22} labelDY={-2} strokeWidth={3}
                opacity={0.7}/>
        <Vector x={U[0]} y={U[1]} color="var(--violet-400)"
                label="u" labelDX={-22} labelDY={-4} strokeWidth={4}/>

        {/* Projection on the line */}
        {projT > 0 && (
          <Vector x={projTip[0]} y={projTip[1]} color="var(--amber-300)"
                  strokeWidth={4.4}
                  label={projT > 0.95 ? 'proj_v(u)' : null}
                  labelDX={70} labelDY={28}/>
        )}

        {/* Dashed perpendicular drop from u's tip to PROJ */}
        {perpT > 0 && (() => {
          const a = toSvg(U[0], U[1]);
          const b = toSvg(PROJ[0] + (U[0] - PROJ[0]) * (1 - perpT),
                          PROJ[1] + (U[1] - PROJ[1]) * (1 - perpT));
          return (
            <line x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy}
                  stroke="var(--chalk-200)" strokeWidth={1.8}
                  strokeDasharray="5 5" opacity={0.85}/>
          );
        })()}

        {/* Residual arrow from PROJ to U */}
        {resT > 0 && (() => {
          const tipX = PROJ[0] + (U[0] - PROJ[0]) * resT;
          const tipY = PROJ[1] + (U[1] - PROJ[1]) * resT;
          return (
            <Vector fromX={PROJ[0]} fromY={PROJ[1]} x={tipX} y={tipY}
                    color="var(--rose-400)" strokeWidth={3.4}
                    label={resT > 0.95 ? 'u − proj' : null}
                    labelDX={-28} labelDY={20}/>
          );
        })()}

        {/* Right-angle marker at the foot of the perpendicular */}
        {resT > 0.95 && (
          <RightAngleMark at={PROJ} dirA={V_DIR} dirB={RES} size={11}/>
        )}

        <circle cx={toSvg(0,0).sx} cy={toSvg(0,0).sy} r={3.5} fill="var(--chalk-100)"/>
      </GridMaskedSvg>

      <SoftPanel right={60} top={210}>
        <FadeUp duration={0.4} delay={3.6} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>
          orthogonal split
        </FadeUp>
        <FadeUp duration={0.55} delay={4.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)',
            lineHeight: 1.3, marginTop: 4,
          }}>
            <span style={{ color: 'var(--violet-400)' }}>u</span>&nbsp;=&nbsp;<span style={{ color: 'var(--amber-300)' }}>proj<sub style={{ fontSize: 14 }}>v</sub> u</span> + <span style={{ color: 'var(--rose-400)' }}>(u − proj<sub style={{ fontSize: 14 }}>v</sub> u)</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={5.6} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 16, color: 'var(--chalk-300)',
            maxWidth: '34ch', lineHeight: 1.4, marginTop: 4,
          }}>
          Along the line, plus perpendicular to it.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: formula ─────────────────────────────────────────────────────
function FormulaBeat() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        the projection formula
      </FadeUp>

      <FadeUp duration={0.7} delay={0.4} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 62, color: 'var(--chalk-100)',
          lineHeight: 1.1,
        }}>
        proj<sub style={{ fontSize: '0.55em' }}>v</sub><span style={{ color: 'var(--violet-400)' }}>(u)</span> &nbsp;=&nbsp; <span style={{
          display: 'inline-flex', flexDirection: 'column',
          alignItems: 'center', verticalAlign: 'middle',
          fontSize: '0.55em', lineHeight: 1.0,
        }}>
          <span style={{ borderBottom: '2px solid var(--chalk-200)', padding: '0 8px' }}>
            <span style={{ color: 'var(--violet-400)' }}>u</span> · <span style={{ color: 'var(--teal-400)' }}>v</span>
          </span>
          <span style={{ padding: '0 8px' }}>
            <span style={{ color: 'var(--teal-400)' }}>v</span> · <span style={{ color: 'var(--teal-400)' }}>v</span>
          </span>
        </span>&nbsp;<span style={{ color: 'var(--teal-400)' }}>v</span>
      </FadeUp>

      <FadeUp duration={0.55} delay={2.0} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 15,
          color: 'var(--amber-300)', letterSpacing: '0.06em',
          marginTop: 8,
        }}>
        u·v = 6&nbsp;&nbsp;·&nbsp;&nbsp;v·v = 10&nbsp;&nbsp;→&nbsp;&nbsp;proj = (1.8, 0.6)
      </FadeUp>
    </div>
  );
}

// ─── Hero outro ──────────────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', maxWidth: 900, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the takeaway
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 58, color: 'var(--chalk-100)', lineHeight: 1.15,
        }}>
        Closest is <span style={{ color: 'var(--amber-300)' }}>perpendicular</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={1.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '36ch', lineHeight: 1.3,
        }}>
        u splits into a piece along v and a piece orthogonal to it.
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
