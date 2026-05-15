// Hesse Eigenvalues: Curvature Along the Principal Axes — Manimo lesson scene.
// Chapter 6 / week 15 of mat2b. Companion to `hessian-test`: while the
// discriminant gives a quick recipe, the *eigenvalues* of the Hesse matrix
// give the principal curvatures. This scene shows the tilted-bowl picture
// (eigenvectors picking out the long and short axes of the ellipse),
// derives H = P D Pᵀ via the spectral theorem, then summarises the three
// cases as a sign-of-eigenvalues classification.
//
// Beats (placeholder timings — re-wired by `npm run audio`):
//    0– 4.2   Manimo
//    4.2–16   Tilted bowl + principal eigenvectors v₁, v₂
//   16–25     Diagonal form H = P D Pᵀ
//   25–34.5   Three-case sign classification grid
//  34.5–end   Hero outro
//
// Colour discipline:
//   chalk-300  reference contour lines
//   chalk-200  axes
//   violet-400 v₁ eigenvector / column 1 of P
//   teal-400   v₂ eigenvector / column 2 of P
//   amber-400  saddle accent (column-card)
//   emerald-400 local-min accent (column-card)
//   rose-400   local-max accent (column-card)
//   amber-300  takeaway accent

const SCENE_DURATION = 52;

const NARRATION = [
  "The Hesse matrix is symmetric, so it has a hidden pair of perpendicular axes. Those are where the curvature really lives.",
  "Take a tilted bowl. Its contours are tilted ellipses. Find the two perpendicular directions whose principal axes match the ellipse. Those are the eigenvectors of the Hesse matrix.",
  "Rotate into that frame, and the Hesse matrix becomes diagonal — its two eigenvalues sitting on the diagonal. Those are the curvatures along the principal axes.",
  "The signs of the eigenvalues classify the point. Both positive — bowl. Both negative — dome. One of each — saddle. The discriminant just tracks the product, lambda one times lambda two.",
  "Same algebra as chapter four — diagonalise the matrix and let its eigenvalues do the talking.",
];

const NARRATION_AUDIO = 'audio/hesse-eigenvalues/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
const ORIGIN_X = 420;
const ORIGIN_Y = 380;
const UNIT = 75;
const X_MIN = -3, X_MAX = 3;
const Y_MIN = -2.4, Y_MAX = 2.4;

// Tilted bowl: f(x, y) = ½ xᵀ H x with H chosen so eigenvalues are 2.4 and 0.8
// and the principal axis makes a 25° angle with the x-axis.
const THETA = 25 * Math.PI / 180;
const COS_T = Math.cos(THETA);
const SIN_T = Math.sin(THETA);
const LAMBDA_1 = 2.4;       // long-axis curvature (smaller-radius ellipse axis)
const LAMBDA_2 = 0.8;
// Build H = R · diag(λ₁, λ₂) · Rᵀ.
const Rmat = [[COS_T, -SIN_T], [SIN_T, COS_T]];
const H_xx = LAMBDA_1 * COS_T * COS_T + LAMBDA_2 * SIN_T * SIN_T;
const H_yy = LAMBDA_1 * SIN_T * SIN_T + LAMBDA_2 * COS_T * COS_T;
const H_xy = (LAMBDA_1 - LAMBDA_2) * COS_T * SIN_T;
function fTilted(x, y) {
  return 0.5 * (H_xx * x * x + 2 * H_xy * x * y + H_yy * y * y);
}

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

function GridMaskedSvg({ maskId, children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx="40%" cy="56%" r="62%">
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

function Axes({ opacity = 1 }) {
  const left = toSvg(X_MIN, 0), right = toSvg(X_MAX, 0);
  const bottom = toSvg(0, Y_MIN), top = toSvg(0, Y_MAX);
  return (
    <g opacity={opacity}>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bottom.sx} y2={bottom.sy}
            stroke="var(--chalk-200)" strokeWidth={2} strokeLinecap="round"/>
    </g>
  );
}

// Marching squares — same as other scenes.
function contourPaths(f, levels) {
  const NX = 80, NY = 64;
  const dx = (X_MAX - X_MIN) / NX;
  const dy = (Y_MAX - Y_MIN) / NY;
  const grid = new Array(NX + 1);
  for (let i = 0; i <= NX; i++) {
    grid[i] = new Array(NY + 1);
    const x = X_MIN + i * dx;
    for (let j = 0; j <= NY; j++) {
      const y = Y_MIN + j * dy;
      grid[i][j] = f(x, y);
    }
  }
  const out = [];
  for (const c of levels) {
    const segments = [];
    for (let i = 0; i < NX; i++) {
      for (let j = 0; j < NY; j++) {
        const x0 = X_MIN + i * dx, y0 = Y_MIN + j * dy;
        const x1 = x0 + dx, y1 = y0 + dy;
        const a = grid[i][j], b = grid[i + 1][j],
              cc = grid[i + 1][j + 1], d = grid[i][j + 1];
        const pts = [];
        const lerp = (va, vb, xa, ya, xb, yb) => {
          const t = (c - va) / (vb - va);
          return [xa + t * (xb - xa), ya + t * (yb - ya)];
        };
        if ((a - c) * (b - c) < 0) pts.push(lerp(a, b, x0, y0, x1, y0));
        if ((b - c) * (cc - c) < 0) pts.push(lerp(b, cc, x1, y0, x1, y1));
        if ((cc - c) * (d - c) < 0) pts.push(lerp(cc, d, x1, y1, x0, y1));
        if ((d - c) * (a - c) < 0) pts.push(lerp(d, a, x0, y1, x0, y0));
        if (pts.length >= 2) {
          const p0 = toSvg(pts[0][0], pts[0][1]);
          const p1 = toSvg(pts[1][0], pts[1][1]);
          segments.push(`M ${p0.sx.toFixed(1)} ${p0.sy.toFixed(1)} L ${p1.sx.toFixed(1)} ${p1.sy.toFixed(1)}`);
        }
      }
    }
    out.push(segments.join(' '));
  }
  return out;
}

function Contours({ f, levels, color = 'var(--chalk-300)', opacity = 0.65, strokeWidth = 1.4 }) {
  const paths = contourPaths(f, levels);
  return (
    <g>
      {paths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color}
              strokeWidth={strokeWidth} strokeLinecap="round" opacity={opacity}/>
      ))}
    </g>
  );
}

function Arrow({
  bx, by, tx, ty, color, label = null, labelDX = 0, labelDY = 0,
  strokeWidth = 4.0, headLen = 14, headHalf = 8,
}) {
  const o = toSvg(bx, by);
  const tip = toSvg(tx, ty);
  const dx = tip.sx - o.sx, dy = tip.sy - o.sy;
  const len = Math.hypot(dx, dy);
  if (len < 0.5) return null;
  const ux = dx / len, uy = dy / len;
  const baseX = tip.sx - ux * headLen;
  const baseY = tip.sy - uy * headLen;
  const perpX = -uy, perpY = ux;
  const lx = baseX + perpX * headHalf, ly = baseY + perpY * headHalf;
  const rx = baseX - perpX * headHalf, ry = baseY - perpY * headHalf;
  return (
    <g>
      <line x1={o.sx} y1={o.sy} x2={baseX} y2={baseY}
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
      <path d={`M ${tip.sx} ${tip.sy} L ${lx} ${ly} L ${rx} ${ry} Z`} fill={color}/>
      {label != null && (
        <text x={tip.sx + labelDX} y={tip.sy + labelDY}
              fill={color} fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={22} textAnchor="middle">
          {label}
        </text>
      )}
    </g>
  );
}

function SoftPanel({ children, right = 64, top = 196, width = 380, left, bottom, transform }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined, transform }
    : { right, top, transform };
  return (
    <div style={{
      position: 'absolute', width,
      ...positioning,
      pointerEvents: 'none',
      padding: '18px 22px',
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)',
      borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
      gap: 14,
    }}>
      {children}
    </div>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="Hesse eigenvalues"
      title="Curvature on the Principal Axes"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={7.81}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={7.81} end={20.4}>
        <PrincipalAxesBeat/>
      </Sprite>

      <Sprite start={20.4} end={31.14}>
        <DiagonalFormBeat/>
      </Sprite>

      <Sprite start={31.14} end={44.7}>
        <ClassifyBeat/>
      </Sprite>

      <Sprite start={44.7} end={SCENE_DURATION}>
        <HeroOutro/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
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
          fontFamily: 'var(--font-serif)',
          fontSize: 28, fontStyle: 'italic',
          color: 'var(--chalk-100)',
          maxWidth: '24ch', lineHeight: 1.3,
        }}>
        Two axes of curvature.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Principal axes ───────────────────────────────────────────────
function PrincipalAxesBeat() {
  // Eigenvectors: v₁ = (cos θ, sin θ) for λ₁, v₂ = (-sin θ, cos θ) for λ₂.
  // Draw them as visible arrows from the origin.
  const L = 1.7;
  const v1tx = L * COS_T;
  const v1ty = L * SIN_T;
  const v2tx = -L * SIN_T * 0.85;       // shorter to indicate smaller curvature
  const v2ty =  L * COS_T * 0.85;

  return (
    <>
      <GridMaskedSvg maskId="he-axes-mask">
        <SvgFadeIn duration={0.5} delay={0.0}><Axes opacity={0.7}/></SvgFadeIn>
        <SvgFadeIn duration={0.7} delay={0.2}>
          <Contours f={fTilted} levels={[0.4, 1.0, 1.8, 2.8, 4.0]}/>
        </SvgFadeIn>

        {/* Central critical point. */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <circle cx={toSvg(0, 0).sx} cy={toSvg(0, 0).sy} r={8}
                  fill="var(--emerald-400)" stroke="var(--chalk-100)" strokeWidth={1.5}/>
        </SvgFadeIn>

        {/* Eigenvector v₁ — long axis (big curvature). */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <Arrow bx={0} by={0} tx={v1tx} ty={v1ty}
                 color="var(--violet-400)"
                 label="v₁ (λ₁)" labelDX={28} labelDY={-12}/>
        </SvgFadeIn>
        {/* Mirror it the other way too so the principal-axis line reads. */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <line x1={toSvg(-v1tx, -v1ty).sx} y1={toSvg(-v1tx, -v1ty).sy}
                x2={toSvg(0, 0).sx} y2={toSvg(0, 0).sy}
                stroke="var(--violet-400)" strokeWidth={2.2}
                strokeDasharray="4 5" opacity={0.55}/>
        </SvgFadeIn>

        {/* Eigenvector v₂ — short axis. */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <Arrow bx={0} by={0} tx={v2tx} ty={v2ty}
                 color="var(--teal-400)"
                 label="v₂ (λ₂)" labelDX={-28} labelDY={-10}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={5.5}>
          <line x1={toSvg(-v2tx, -v2ty).sx} y1={toSvg(-v2tx, -v2ty).sy}
                x2={toSvg(0, 0).sx} y2={toSvg(0, 0).sy}
                stroke="var(--teal-400)" strokeWidth={2.2}
                strokeDasharray="4 5" opacity={0.55}/>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={210} width={400}>
        <FadeUp duration={0.45} delay={1.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>principal axes</FadeUp>

        <FadeUp duration={0.55} delay={1.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 28, color: 'var(--chalk-100)', lineHeight: 1.25,
            marginTop: 4,
          }}>
          H&nbsp;<span style={{ color: 'var(--violet-400)' }}>v<sub>i</sub></span>
          &nbsp;=&nbsp;
          <span style={{ color: 'var(--violet-400)' }}>λ<sub>i</sub></span>
          &nbsp;<span style={{ color: 'var(--violet-400)' }}>v<sub>i</sub></span>
        </FadeUp>

        <FadeUp duration={0.5} delay={4.2} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch', marginTop: 4,
          }}>
          The two perpendicular directions <br/>the matrix itself picks out.
        </FadeUp>

        <FadeUp duration={0.5} delay={5.8} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          Along&nbsp;<span style={{ color: 'var(--violet-400)' }}>v<sub>1</sub></span>:
          curvature&nbsp;λ<sub>1</sub>.<br/>
          Along&nbsp;<span style={{ color: 'var(--teal-400)' }}>v<sub>2</sub></span>:
          curvature&nbsp;λ<sub>2</sub>.
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 3: Diagonal form H = P D Pᵀ ─────────────────────────────────────
function DiagonalFormBeat() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 1120, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>spectral theorem</FadeUp>

      <FadeUp duration={0.7} delay={0.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.2,
        }}>
          H = <span style={{ color: 'var(--chalk-100)' }}>P</span>
          <span style={{ color: 'var(--chalk-100)' }}> D </span>
          <span style={{ color: 'var(--chalk-100)' }}>P<sup>T</sup></span>
      </FadeUp>

      <FadeUp duration={0.6} delay={1.2} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '60ch', lineHeight: 1.4,
        }}>
        Columns of P are&nbsp;
        <span style={{ color: 'var(--violet-400)' }}>v<sub>1</sub></span> and&nbsp;
        <span style={{ color: 'var(--teal-400)' }}>v<sub>2</sub></span>.&nbsp;
        D = diag(<span style={{ color: 'var(--violet-400)' }}>λ<sub>1</sub></span>,&nbsp;
        <span style={{ color: 'var(--teal-400)' }}>λ<sub>2</sub></span>).
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          marginTop: 6,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        eigenvalues = principal curvatures
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Three-case classification grid ───────────────────────────────
function CaseCard({ eyebrow, accent, l1, l2, verdict, glyphColor, delay = 0 }) {
  return (
    <FadeUp duration={0.55} delay={delay} distance={14}
      style={{
        width: 280,
        padding: '20px 22px',
        background: 'rgba(0,0,0,0.55)',
        border: `1px solid ${accent}`,
        borderRadius: 18,
        boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: 12,
      }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: accent, letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}>{eyebrow}</div>

      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.35,
      }}>
        <span style={{ color: 'var(--violet-400)' }}>λ<sub>1</sub></span> {l1}<br/>
        <span style={{ color: 'var(--teal-400)' }}>λ<sub>2</sub></span> {l2}
      </div>

      {/* Tiny glyph: bowl, dome, or saddle drawn from inline strokes. */}
      <svg width={120} height={48} viewBox="0 0 120 48" style={{ marginTop: 2 }}>
        {glyphColor === 'min' && (
          <path d="M 8 12 Q 60 56 112 12" fill="none"
                stroke="var(--emerald-400)" strokeWidth={2.5} strokeLinecap="round"/>
        )}
        {glyphColor === 'max' && (
          <path d="M 8 40 Q 60 -8 112 40" fill="none"
                stroke="var(--rose-400)" strokeWidth={2.5} strokeLinecap="round"/>
        )}
        {glyphColor === 'saddle' && (
          <g>
            <path d="M 8 12 Q 60 36 112 12" fill="none"
                  stroke="var(--amber-400)" strokeWidth={2.5} strokeLinecap="round"/>
            <path d="M 8 40 Q 60 16 112 40" fill="none"
                  stroke="var(--amber-400)" strokeWidth={2.5} strokeLinecap="round"
                  opacity={0.6} strokeDasharray="4 4"/>
          </g>
        )}
      </svg>

      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 13,
        color: accent, letterSpacing: '0.06em',
      }}>{verdict}</div>
    </FadeUp>
  );
}

function ClassifyBeat() {
  return (
    <>
      <div style={{
        position: 'absolute',
        left: '50%', top: '46%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', flexDirection: 'row', gap: 28, alignItems: 'flex-start',
      }}>
        <CaseCard
          eyebrow="both positive"
          accent="var(--emerald-400)"
          l1="> 0"
          l2="> 0"
          verdict="local minimum"
          glyphColor="min"
          delay={0.0}
        />
        <CaseCard
          eyebrow="both negative"
          accent="var(--rose-400)"
          l1="< 0"
          l2="< 0"
          verdict="local maximum"
          glyphColor="max"
          delay={0.6}
        />
        <CaseCard
          eyebrow="mixed signs"
          accent="var(--amber-400)"
          l1="> 0"
          l2="< 0"
          verdict="saddle point"
          glyphColor="saddle"
          delay={1.2}
        />
      </div>

      <FadeUp duration={0.5} delay={3.0} distance={10}
        style={{
          position: 'absolute',
          left: '50%', bottom: '14%',
          transform: 'translateX(-50%)',
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
          textAlign: 'center',
        }}>
        det H = λ<sub>1</sub> λ<sub>2</sub> = D
      </FadeUp>
    </>
  );
}

// ─── Beat 5: Hero outro ───────────────────────────────────────────────────
function HeroOutro() {
  return (
    <div style={{
      position: 'absolute',
      left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      maxWidth: 1020, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>the takeaway</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 50, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Curvature lives on the <span style={{ color: 'var(--amber-300)' }}>eigenaxes</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '52ch', lineHeight: 1.4,
        }}>
          Diagonalise the Hesse matrix; <br/>its eigenvalues tell you the shape.
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
