// The Second-Derivative Test: A Discriminant Decides — Manimo lesson scene.
// Chapter 6 / week 15 of mat2b. Three local cases shown side by side: a
// bowl (local min), a dome (local max), a saddle. Each is read off the
// Hesse matrix through the discriminant D = f_xx f_yy − f_xy² and the
// sign of f_xx.
//
// Beats (placeholder timings — re-wired by `npm run audio`):
//    0– 4.5   Manimo
//    4.5–16   Bowl  (D > 0, f_xx > 0) — local minimum
//   16–27     Dome  (D > 0, f_xx < 0) — local maximum
//   27–38.5   Saddle (D < 0)
//  38.5–end   Hero outro
//
// Visual idiom: each case beat shows a contour map (closed ellipses for
// bowl/dome, hyperbolic crosses for saddle) on the left, and a Hesse-matrix
// panel + verdict on the right.
//
// Colour discipline:
//   chalk-300  contour level lines
//   chalk-200  axes
//   emerald-400 local-min verdict
//   rose-400   local-max verdict
//   amber-400  saddle verdict (also: any "object being acted on")
//   amber-300  takeaway accent

const SCENE_DURATION = 49;

const NARRATION = [
  "When the gradient vanishes, the first order story is over. The Hesse matrix takes over and decides the shape.",
  "First case. Both eigenvalues of the Hesse matrix are positive — equivalently, the discriminant is positive and f sub x x is positive. The point sits at the bottom of a bowl. A local minimum.",
  "Flip the signs. Both eigenvalues negative, discriminant still positive but f sub x x is negative. Now the contours close around a hilltop — a local maximum.",
  "Now mix the signs. Eigenvalues have opposite signs, so the discriminant is negative. The contours cross through the point — it's a saddle.",
  "Two numbers read the geometry. The discriminant tells you closed or crossed; the diagonal tells you up or down.",
];

const NARRATION_AUDIO = 'audio/hessian-test/scene.mp3';

// ─── Coordinate system ────────────────────────────────────────────────────
// Math origin slightly left of stage centre. Right side reserved for the
// matrix verdict panel.
const ORIGIN_X = 420;
const ORIGIN_Y = 380;
const UNIT = 75;
const X_MIN = -3, X_MAX = 3;
const Y_MIN = -2.4, Y_MAX = 2.4;

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

// Marching squares on f(x, y) to extract contour paths at given levels.
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

function Contours({ f, levels, color = 'var(--chalk-300)', opacity = 0.65, strokeWidth = 1.5 }) {
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

// Hesse matrix panel — uppercase eyebrow + 2×2 bracketed matrix + verdict
// footnote. accent is the eyebrow / verdict color (emerald, rose, amber).
function HessePanel({ eyebrow, accent, rows, verdict, footnote, delay = 0 }) {
  return (
    <SoftPanel right={64} top={196} width={400}>
      <FadeUp duration={0.4} delay={delay} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: accent, letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        {eyebrow}
      </FadeUp>

      <FadeUp duration={0.55} delay={delay + 0.2} distance={10}>
        <div style={{
          position: 'relative',
          padding: '18px 26px',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 32, color: 'var(--chalk-100)',
          lineHeight: 1.3,
        }}>
          <span style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 14,
            borderLeft: '2.5px solid var(--chalk-200)',
            borderTop: '2.5px solid var(--chalk-200)',
            borderBottom: '2.5px solid var(--chalk-200)',
          }}/>
          <span style={{
            position: 'absolute', right: 0, top: 0, bottom: 0, width: 14,
            borderRight: '2.5px solid var(--chalk-200)',
            borderTop: '2.5px solid var(--chalk-200)',
            borderBottom: '2.5px solid var(--chalk-200)',
          }}/>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(100px, 1fr) minmax(100px, 1fr)',
            columnGap: 24, rowGap: 8, textAlign: 'center',
          }}>
            <span style={{ color: 'var(--violet-400)' }}>{rows[0][0]}</span>
            <span style={{ color: 'var(--teal-400)'   }}>{rows[0][1]}</span>
            <span style={{ color: 'var(--violet-400)' }}>{rows[1][0]}</span>
            <span style={{ color: 'var(--teal-400)'   }}>{rows[1][1]}</span>
          </div>
        </div>
      </FadeUp>

      <FadeUp duration={0.45} delay={delay + 0.9} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: accent, letterSpacing: '0.08em',
        }}>
        {verdict}
      </FadeUp>

      {footnote && (
        <FadeUp duration={0.45} delay={delay + 1.3} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '32ch',
          }}>
          {footnote}
        </FadeUp>
      )}
    </SoftPanel>
  );
}

// ─── Sample functions ─────────────────────────────────────────────────────
// Bowl:    f = 0.6 x^2 + 0.9 y^2          → H = diag(1.2, 1.8), D > 0, f_xx > 0
// Dome:    f = -(0.6 x^2 + 0.9 y^2)       → H = diag(-1.2, -1.8), D > 0, f_xx < 0
// Saddle:  f = 0.6 x^2 - 0.9 y^2          → H = diag(1.2, -1.8), D < 0
function fBowl(x, y) { return 0.6 * x * x + 0.9 * y * y; }
function fDome(x, y) { return -0.6 * x * x - 0.9 * y * y; }
function fSaddle(x, y) { return 0.6 * x * x - 0.9 * y * y; }

const BOWL_LEVELS = [0.15, 0.45, 0.9, 1.5, 2.3, 3.2];
const DOME_LEVELS = BOWL_LEVELS.map(c => -c);
const SADDLE_LEVELS = [-1.8, -1.0, -0.4, 0.4, 1.0, 1.8];

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="second-derivative test"
      title="A Discriminant Decides"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={6.99}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={6.99} end={20.32}>
        <BowlBeat/>
      </Sprite>

      <Sprite start={20.32} end={31.54}>
        <DomeBeat/>
      </Sprite>

      <Sprite start={31.54} end={40.22}>
        <SaddleBeat/>
      </Sprite>

      <Sprite start={40.22} end={SCENE_DURATION}>
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
        Three shapes, three verdicts.
      </FadeUp>
    </div>
  );
}

// ─── Shared body for a case beat ──────────────────────────────────────────
function CaseBeat({ maskId, f, levels, dotColor, panel }) {
  return (
    <>
      <GridMaskedSvg maskId={maskId}>
        <SvgFadeIn duration={0.5} delay={0.0}><Axes/></SvgFadeIn>
        <SvgFadeIn duration={0.7} delay={0.2}>
          <Contours f={f} levels={levels}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.5}>
          <g>
            <circle cx={toSvg(0, 0).sx} cy={toSvg(0, 0).sy} r={9}
                    fill={dotColor} stroke="var(--chalk-100)" strokeWidth={1.5}/>
          </g>
        </SvgFadeIn>
      </GridMaskedSvg>

      <HessePanel {...panel}/>
    </>
  );
}

// ─── Beat 2: Bowl (local minimum) ─────────────────────────────────────────
function BowlBeat() {
  return (
    <CaseBeat
      maskId="ht-bowl-mask"
      f={fBowl}
      levels={BOWL_LEVELS}
      dotColor="var(--emerald-400)"
      panel={{
        eyebrow: 'local minimum',
        accent: 'var(--emerald-400)',
        rows: [
          ['f_xx > 0', 'f_xy'],
          ['f_xy',     'f_yy > 0'],
        ],
        verdict: 'D > 0 · f_xx > 0',
        footnote: 'Closed contours around a bowl. Walk any direction — height rises.',
        delay: 1.0,
      }}
    />
  );
}

// ─── Beat 3: Dome (local maximum) ─────────────────────────────────────────
function DomeBeat() {
  return (
    <CaseBeat
      maskId="ht-dome-mask"
      f={fDome}
      levels={DOME_LEVELS}
      dotColor="var(--rose-400)"
      panel={{
        eyebrow: 'local maximum',
        accent: 'var(--rose-400)',
        rows: [
          ['f_xx < 0', 'f_xy'],
          ['f_xy',     'f_yy < 0'],
        ],
        verdict: 'D > 0 · f_xx < 0',
        footnote: 'Closed contours around a hilltop. Walk any direction — height falls.',
        delay: 1.0,
      }}
    />
  );
}

// ─── Beat 4: Saddle ──────────────────────────────────────────────────────
function SaddleBeat() {
  return (
    <CaseBeat
      maskId="ht-saddle-mask"
      f={fSaddle}
      levels={SADDLE_LEVELS}
      dotColor="var(--amber-400)"
      panel={{
        eyebrow: 'saddle point',
        accent: 'var(--amber-400)',
        rows: [
          ['f_xx > 0', 'f_xy'],
          ['f_xy',     'f_yy < 0'],
        ],
        verdict: 'D < 0',
        footnote: 'Contours cross through the point. One direction up, one direction down.',
        delay: 1.0,
      }}
    />
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
          fontSize: 54, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.18,
        }}>
        Two numbers, <span style={{ color: 'var(--amber-300)' }}>three verdicts</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 24, color: 'var(--chalk-200)',
          maxWidth: '48ch', lineHeight: 1.35,
        }}>
          D = f<sub>xx</sub> f<sub>yy</sub> − f<sub>xy</sub><sup>2</sup> tells you closed or crossed;
          <br/>the sign of f<sub>xx</sub> tells you up or down.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        D &gt; 0, f<sub>xx</sub> &gt; 0 → min &nbsp;·&nbsp;
        D &gt; 0, f<sub>xx</sub> &lt; 0 → max &nbsp;·&nbsp;
        D &lt; 0 → saddle
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
