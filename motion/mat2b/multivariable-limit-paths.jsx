// Multivariable Limits Fail Along Different Paths — Manimo lesson scene.
// Chapter 5 / week 11 of mat2b. Pure visual proof that a two-variable limit
// can fail to exist even when every directional sub-limit is well defined:
// two paths to the origin give two different values for
//   f(x, y) = (xy + y³) / (x² + y²).
//
// Beats:
//    0– 4.4   Manimo hook — every direction has a vote
//   4.4–11    Introduce f, show its level structure on the xy-plane
//   11–19     Path along the x-axis: limit = 0
//   19–28     Path along y = x: limit = 1/2
//   28–end    Hero outro — limit does not exist
//
// Sprite ranges are placeholder until `npm run audio` rewires.
//
// Colour discipline:
//   chalk-300  axes, faint grid
//   chalk-200  axis labels
//   violet-400 path along x-axis (limit = 0)
//   amber-400  path along y = x (limit = 1/2)
//   rose-400   contradiction accent
//   amber-300  takeaway accent

const SCENE_DURATION = 57;

const NARRATION = [
  "In one variable, a limit just has to agree from the left and from the right. In two variables, every direction has a vote.",
  "Consider f of x comma y, equal to x y plus y cubed, divided by x squared plus y squared. The denominator goes to zero at the origin. Does f have a limit there?",
  "Walk in along the x-axis. Set y to zero. Then f reduces to x times zero plus zero, divided by x squared. That is zero. The limit along this path is zero.",
  "Now walk in along the diagonal where y equals x. Substitute: the numerator becomes x squared plus x cubed; the denominator is two x squared. As x goes to zero, the ratio approaches one half. The limit along this path is one half.",
  "Two different answers along two different paths. So the two variable limit at the origin does not exist.",
];

const NARRATION_AUDIO = 'audio/multivariable-limit-paths/scene.mp3';

// ─── Plane coordinates ────────────────────────────────────────────────────
const ORIGIN_X = 470;
const ORIGIN_Y = 380;
const UNIT = 110;

function toSvg(x, y) {
  return { sx: ORIGIN_X + x * UNIT, sy: ORIGIN_Y - y * UNIT };
}

// The function under study.
function fxy(x, y) {
  const denom = x * x + y * y;
  if (denom < 1e-12) return 0;
  return (x * y + y * y * y) / denom;
}

// ─── Shared helpers ───────────────────────────────────────────────────────
function GridMaskedSvg({ maskId, cx = '38%', cy = '54%', r = '60%', children }) {
  const gradId = `${maskId}-grad`;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={1280} height={720} viewBox="0 0 1280 720">
      <defs>
        <radialGradient id={gradId} cx={cx} cy={cy} r={r}>
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

function PlaneAxes() {
  const left = toSvg(-2.6, 0), right = toSvg(2.6, 0);
  const bot = toSvg(0, -2), top = toSvg(0, 2);
  return (
    <g>
      <line x1={left.sx} y1={left.sy} x2={right.sx} y2={right.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={top.sx} y1={top.sy} x2={bot.sx} y2={bot.sy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <text x={right.sx + 14} y={right.sy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={22}>x</text>
      <text x={top.sx - 18} y={top.sy - 8}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={22}>y</text>
      <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={4.5}
              fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1}/>
    </g>
  );
}

// Coloured isolines based on the value of f. Faint hint of the function's
// path-dependent texture without committing to a full surface plot.
function LevelHints() {
  // Sample a grid of dots, colour by f value (clamped to [0, 0.5]).
  const dots = [];
  const N = 32;
  for (let i = 0; i < N; i++) {
    for (let j = 0; j < N; j++) {
      const x = -2.2 + (i + 0.5) * (4.4 / N);
      const y = -1.6 + (j + 0.5) * (3.2 / N);
      if (Math.hypot(x, y) < 0.18) continue;
      const v = fxy(x, y);
      const tNorm = clamp((v - (-0.2)) / (0.6 - (-0.2)), 0, 1);
      // Map tNorm to a chalk colour intensity.
      const c = toSvg(x, y);
      // Two-tone hint: positive values toward amber, negative toward rose.
      let col;
      let alpha = 0.32;
      if (v > 0.02) { col = 'var(--amber-400)'; alpha = 0.10 + Math.min(0.36, v); }
      else if (v < -0.02) { col = 'var(--rose-400)'; alpha = 0.10 + Math.min(0.36, -v); }
      else { col = 'var(--chalk-300)'; alpha = 0.18; }
      dots.push(
        <circle key={`d${i}-${j}`} cx={c.sx} cy={c.sy} r={4}
                fill={col} opacity={alpha}/>
      );
    }
  }
  return <g>{dots}</g>;
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="limits in higher dimensions"
      title="Two Paths, Two Values"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={8.08}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={8.08} end={20.48}>
        <IntroFBeat/>
      </Sprite>

      <Sprite start={20.48} end={33.26}>
        <PathXAxisBeat/>
      </Sprite>

      <Sprite start={33.26} end={50.06}>
        <PathDiagonalBeat/>
      </Sprite>

      <Sprite start={50.06} end={SCENE_DURATION}>
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
        Every direction has a vote.
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Introduce f ──────────────────────────────────────────────────
function IntroFBeat() {
  return (
    <>
      <GridMaskedSvg maskId="mvlp-intro-mask" cx="38%" cy="54%" r="58%">
        <SvgFadeIn duration={0.6} delay={0.6}>
          <LevelHints/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.0}>
          <PlaneAxes/>
        </SvgFadeIn>
        {/* Highlight the origin — the suspicious point. */}
        <SvgFadeIn duration={0.5} delay={1.8}>
          <g>
            <circle cx={ORIGIN_X} cy={ORIGIN_Y} r={20}
                    fill="none" stroke="var(--rose-400)" strokeWidth={2}
                    strokeDasharray="3 4" opacity={0.85}/>
            <text x={ORIGIN_X + 28} y={ORIGIN_Y + 26}
                  fill="var(--rose-400)" fontFamily="var(--font-mono)"
                  fontSize={13} letterSpacing="0.06em">(0, 0)</text>
          </g>
        </SvgFadeIn>
      </GridMaskedSvg>

      <SoftPanel right={64} top={170} width={420}>
        <FadeUp duration={0.45} delay={0.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-300)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>the function</FadeUp>

        <FadeUp duration={0.6} delay={0.4} distance={12}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 32, color: 'var(--chalk-100)', lineHeight: 1.3,
            marginTop: 4,
          }}>
          f (x, y) = <span style={{
            display: 'inline-flex', flexDirection: 'column',
            alignItems: 'center', verticalAlign: 'middle',
            margin: '0 6px', fontSize: 26,
          }}>
            <span>xy + y³</span>
            <span style={{
              borderTop: '1.5px solid var(--chalk-200)',
              padding: '2px 12px 0', marginTop: 2,
            }}>x² + y²</span>
          </span>
        </FadeUp>

        <FadeUp duration={0.5} delay={2.4} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--chalk-300)', lineHeight: 1.4,
            maxWidth: '32ch',
            marginTop: 4,
          }}>
          The denominator vanishes at the origin.
        </FadeUp>

        <FadeUp duration={0.5} delay={4.0} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 18, color: 'var(--rose-400)', lineHeight: 1.4,
            maxWidth: '32ch',
          }}>
          Does f have a limit there?
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// A path of moving samples toward the origin.
function PathSamples({ pathFn, color, count = 7, revealAt = 0.4, localTime }) {
  // pathFn(s) returns {x, y} where s ranges over (1, 0]; s=0 means at origin.
  const samples = [];
  for (let i = 0; i < count; i++) {
    const s = 1 - i / (count - 0.5);
    const { x, y } = pathFn(s);
    samples.push({ x, y, s });
  }
  return (
    <g>
      {samples.map((p, i) => {
        const appear = revealAt + i * 0.35;
        if (localTime < appear) return null;
        const c = toSvg(p.x, p.y);
        const fade = clamp((localTime - appear) / 0.35, 0, 1);
        return (
          <circle key={i} cx={c.sx} cy={c.sy} r={6}
                  fill={color} opacity={fade}
                  stroke="var(--chalk-100)" strokeWidth={0.8}/>
        );
      })}
    </g>
  );
}

// ─── Beat 3: Path along the x-axis ────────────────────────────────────────
function PathXAxisBeat() {
  const { localTime } = useSprite();

  return (
    <>
      <GridMaskedSvg maskId="mvlp-x-mask">
        <LevelHints/>
        <PlaneAxes/>

        {/* Arrow along x-axis toward origin */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <g>
            <line x1={toSvg(2.2, 0).sx} y1={toSvg(2.2, 0).sy + 24}
                  x2={toSvg(0.15, 0).sx} y2={toSvg(0.15, 0).sy + 24}
                  stroke="var(--violet-400)" strokeWidth={3}
                  strokeLinecap="round" markerEnd=""/>
            {/* Manual arrowhead */}
            {(() => {
              const a = toSvg(0.15, 0);
              const b = toSvg(0.35, 0);
              const dx = a.sx - b.sx, dy = 0;
              const len = Math.hypot(dx, dy);
              const ux = dx / len, uy = dy / len;
              const baseX = a.sx - ux * 14;
              const baseY = a.sy + 24 - uy * 14;
              const perpX = -uy, perpY = ux;
              const lx = baseX + perpX * 7, ly = baseY + perpY * 7;
              const rx = baseX - perpX * 7, ry = baseY - perpY * 7;
              return (
                <path d={`M ${a.sx} ${a.sy + 24} L ${lx} ${ly} L ${rx} ${ry} Z`}
                      fill="var(--violet-400)"/>
              );
            })()}
            <text x={toSvg(1.5, 0).sx} y={toSvg(1.5, 0).sy + 55}
                  fill="var(--violet-400)" fontFamily="var(--font-mono)"
                  fontSize={14} letterSpacing="0.06em" textAnchor="middle">
              y = 0
            </text>
          </g>
        </SvgFadeIn>

        {/* Sample dots marching in */}
        <PathSamples
          pathFn={s => ({ x: 2.0 * s + 0.08, y: 0 })}
          color="var(--violet-400)"
          revealAt={1.2}
          localTime={localTime}
        />
      </GridMaskedSvg>

      <SoftPanel right={64} top={150} width={420}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--violet-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>path 1 — along the x-axis</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 4,
          }}>
          Set y = 0, then send x → 0.
        </FadeUp>

        <FadeUp duration={0.55} delay={2.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 24, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 6,
          }}>
          f (x, 0) = <span style={{
            display: 'inline-flex', flexDirection: 'column',
            alignItems: 'center', verticalAlign: 'middle',
            margin: '0 6px', fontSize: 22,
          }}>
            <span>0</span>
            <span style={{
              borderTop: '1.5px solid var(--chalk-200)',
              padding: '2px 10px 0', marginTop: 2,
            }}>x²</span>
          </span> = 0
        </FadeUp>

        <FadeUp duration={0.55} delay={4.2} distance={10}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 18,
            color: 'var(--violet-400)', letterSpacing: '0.04em',
          }}>
          limit along path 1 = 0
        </FadeUp>
      </SoftPanel>
    </>
  );
}

// ─── Beat 4: Path along y = x ─────────────────────────────────────────────
function PathDiagonalBeat() {
  const { localTime } = useSprite();

  return (
    <>
      <GridMaskedSvg maskId="mvlp-diag-mask">
        <LevelHints/>
        <PlaneAxes/>

        {/* Faded path 1 result, just dots */}
        <PathSamples
          pathFn={s => ({ x: 2.0 * s + 0.08, y: 0 })}
          color="var(--violet-400)"
          revealAt={0.0}
          localTime={localTime + 10} // pretend they're all already there, faded
        />

        {/* Diagonal arrow along y = x toward origin */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <g>
            <line x1={toSvg(1.8, 1.8).sx} y1={toSvg(1.8, 1.8).sy}
                  x2={toSvg(0.15, 0.15).sx} y2={toSvg(0.15, 0.15).sy}
                  stroke="var(--amber-400)" strokeWidth={3} strokeLinecap="round"/>
            {(() => {
              const a = toSvg(0.15, 0.15);
              const b = toSvg(0.35, 0.35);
              const dx = a.sx - b.sx, dy = a.sy - b.sy;
              const len = Math.hypot(dx, dy);
              const ux = dx / len, uy = dy / len;
              const baseX = a.sx - ux * 14;
              const baseY = a.sy - uy * 14;
              const perpX = -uy, perpY = ux;
              const lx = baseX + perpX * 7, ly = baseY + perpY * 7;
              const rx = baseX - perpX * 7, ry = baseY - perpY * 7;
              return (
                <path d={`M ${a.sx} ${a.sy} L ${lx} ${ly} L ${rx} ${ry} Z`}
                      fill="var(--amber-400)"/>
              );
            })()}
            <text x={toSvg(1.4, 1.7).sx} y={toSvg(1.4, 1.7).sy - 16}
                  fill="var(--amber-400)" fontFamily="var(--font-mono)"
                  fontSize={14} letterSpacing="0.06em">y = x</text>
          </g>
        </SvgFadeIn>

        <PathSamples
          pathFn={s => ({ x: 1.6 * s + 0.08, y: 1.6 * s + 0.08 })}
          color="var(--amber-400)"
          revealAt={1.2}
          localTime={localTime}
        />
      </GridMaskedSvg>

      <SoftPanel right={64} top={140} width={430}>
        <FadeUp duration={0.45} delay={0.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--amber-400)', letterSpacing: '0.16em',
            textTransform: 'uppercase',
          }}>path 2 — along y = x</FadeUp>

        <FadeUp duration={0.55} delay={0.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.4,
            marginTop: 4,
          }}>
          Set y = x, then send x → 0.
        </FadeUp>

        <FadeUp duration={0.55} delay={2.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 22, color: 'var(--chalk-100)', lineHeight: 1.5,
            marginTop: 6,
          }}>
          f (x, x) = <span style={{
            display: 'inline-flex', flexDirection: 'column',
            alignItems: 'center', verticalAlign: 'middle',
            margin: '0 6px', fontSize: 20,
          }}>
            <span>x² + x³</span>
            <span style={{
              borderTop: '1.5px solid var(--chalk-200)',
              padding: '2px 14px 0', marginTop: 2,
            }}>2x²</span>
          </span>
          &nbsp;→&nbsp;
          <span style={{
            display: 'inline-flex', flexDirection: 'column',
            alignItems: 'center', verticalAlign: 'middle',
            margin: '0 6px', fontSize: 22,
          }}>
            <span>1</span>
            <span style={{
              borderTop: '1.5px solid var(--chalk-200)',
              padding: '2px 10px 0', marginTop: 2,
            }}>2</span>
          </span>
        </FadeUp>

        <FadeUp duration={0.55} delay={4.4} distance={10}
          style={{
            marginTop: 6,
            fontFamily: 'var(--font-mono)', fontSize: 18,
            color: 'var(--amber-400)', letterSpacing: '0.04em',
          }}>
          limit along path 2 = 1/2
        </FadeUp>

        <FadeUp duration={0.5} delay={5.8} distance={8}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 17, color: 'var(--rose-400)', lineHeight: 1.4,
            maxWidth: '34ch',
          }}>
          0 ≠ 1/2 — the two paths disagree.
        </FadeUp>
      </SoftPanel>
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
      maxWidth: 980, pointerEvents: 'none',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>two paths, two values</FadeUp>

      <FadeUp duration={0.8} delay={0.35} distance={18}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--chalk-100)', letterSpacing: '0.005em',
          lineHeight: 1.15,
        }}>
        The limit <span style={{ color: 'var(--amber-300)' }}>does not exist</span>.
      </FadeUp>

      <FadeUp duration={0.55} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 26, color: 'var(--chalk-200)',
          maxWidth: '42ch', lineHeight: 1.3,
        }}>
        Every direction must agree, <br/>or there is no limit at all.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          marginTop: 12,
          fontFamily: 'var(--font-mono)', fontSize: 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        <span style={{ color: 'var(--violet-400)' }}>path 1 → 0</span> &nbsp;·&nbsp; <span style={{ color: 'var(--amber-400)' }}>path 2 → 1/2</span>
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
