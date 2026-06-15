// Asymptotisk vekst: Stor O — Manimo lesson scene.
// Chapter 1 of algdat (Algoritmer, kjøretid og asymptotisk notasjon).
// The opening question of the entire course: what does an algorithm cost as
// the input grows? Five canonical growth rates — constant, logarithmic,
// linear, linearithmic, quadratic — are drawn on a common axis. Then a
// vertical n-marker sweeps across the chart: at small n the curves huddle
// at the bottom; by n ≈ twenty the quadratic has already shot off the top
// while the logarithmic has barely moved. That separation IS asymptotic
// growth; Stor O is the label we put on it.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 7     Manimo hook
//    7–24     Plot reveals — axes, then five curves trace in (GENUINE MOTION)
//   24–42     Sveepet — n-marker slides, five dots track curves (GENUINE MOTION)
//   42–56     Dominans — only O(n²) bright, side panel reveals 3n² + 5n + 10
//   56–66     Hierarki + takeaway
//
// Colour discipline (one colour per growth class — used consistently across
// all beats and the right-edge labels):
//   chalk-300  O(1)         the constant — flat near the bottom
//   teal-400   O(log n)     barely moves
//   violet-400 O(n)         linear, reaches the right edge
//   amber-400  O(n log n)   the everyday "fast sort" rate
//   rose-400   O(n²)        the dramatic exit-the-frame curve
//
// Plot geometry is computed by `layoutGeom(portrait)` so the same five
// curves are reused across beats 2–4 — landscape gets a wider plot with a
// right-edge label gutter; portrait stacks readouts below the plot.
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 59;

const NARRATION = [
  /*  0– 7  */ 'Hvor lenge bruker en algoritme før den blir umulig å vente på? Det avhenger ikke av maskinen — det avhenger av hvor fort kjøretiden vokser med problemstørrelsen.',
  /*  7–24  */ 'Her er fem klassiske vekstrater. Konstant. Logaritmisk. Lineær. Lineær ganger logaritmisk. Og kvadratisk. Tegnet inn ettersom n vokser.',
  /* 24–42  */ 'Følg markøren. Når n er liten, ligger alle kurvene tett sammen. Men allerede ved tjue er den kvadratiske ute av rammen, mens den logaritmiske knapt har beveget seg.',
  /* 42–56  */ 'Det er det stor O fanger. Når n vokser, dominerer det største leddet — alt annet drukner i støy. Tre n i andre pluss fem n pluss ti blir til orden n i andre.',
  /* 56–66  */ 'Stor O rangerer algoritmer etter hvor de havner — ikke hvor de starter. Det er hele ideen bak asymptotisk notasjon.',
];

const NARRATION_AUDIO = 'audio/asymptotisk-vekst/scene.mp3';

// ─── Growth functions ──────────────────────────────────────────────────────
// One colour per class. `endLabelY` is a "preferred" y-value for the right-
// edge label so labels don't stack on top of each other when curves exit
// the frame at the top. Plot units, not pixels.
const CURVES = [
  { key: 'const',  label: 'O(1)',         fn: () => 1,                          color: 'var(--chalk-300)',  trace: 0.7, endLabelY: 1   },
  { key: 'log',    label: 'O(log n)',     fn: (n) => Math.log2(Math.max(n, 1)), color: 'var(--teal-400)',   trace: 0.9, endLabelY: 7   },
  { key: 'linear', label: 'O(n)',         fn: (n) => n,                         color: 'var(--violet-400)', trace: 1.2, endLabelY: 26  },
  { key: 'nlogn',  label: 'O(n log n)',   fn: (n) => n * Math.log2(Math.max(n, 1)), color: 'var(--amber-400)', trace: 1.3, endLabelY: 76 },
  { key: 'sq',     label: 'O(n²)',        fn: (n) => n * n,                     color: 'var(--rose-400)',   trace: 1.4, endLabelY: 96  },
];

// ─── Geometry ──────────────────────────────────────────────────────────────
// nMax / yMax pin the visible window: at n=24 the linear curve reaches 24
// (well inside yMax=100), n log n peaks at ≈110 (clipped near the top),
// n² exits the top around n ≈ 10. Sweep runs n ∈ [2, 22] so the dramatic
// separation lands inside the visible part of every curve.
const N_MAX = 24;
const Y_MAX = 100;
const N_SWEEP_LO = 2;
const N_SWEEP_HI = 22;

function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      ox: 80, oy: 1000, xLen: 560, yLen: 660,
      // Push panels clear of the bottom-left corner mascot (x=48..126).
      readoutLeft: 140, readoutTop: 1060, readoutW: 528,
      formulaLeft: 140, formulaTop: 1060, formulaW: 528,
      labelOffsetX: 12, labelFont: 13,
      axisFont: 12, axisTitleFont: 14,
      // In portrait the n-badge sits ABOVE the chart so it doesn't crash
      // into the readout panel; in landscape it sits BELOW the x-axis title.
      markBadgePlacement: 'above',
    };
  }
  return {
    svgW: 1280, svgH: 720,
    ox: 184, oy: 600, xLen: 760, yLen: 440,
    readoutLeft: 1000, readoutTop: 200, readoutW: 240,
    formulaLeft: 1000, formulaTop: 240, formulaW: 240,
    labelOffsetX: 14, labelFont: 15,
    axisFont: 12, axisTitleFont: 14,
    markBadgePlacement: 'below',
  };
}

// ─── Path / mapping helpers ────────────────────────────────────────────────
const X_OF = (G, n) => G.ox + (n / N_MAX) * G.xLen;
const Y_OF = (G, y) => G.oy - Math.min(Math.max(y, 0), Y_MAX) / Y_MAX * G.yLen;

// Build the SVG path for a growth function across the plot window. Stops as
// soon as the function exceeds the top of the frame so the curve ends with a
// crisp exit at y = yMax instead of crawling along the top edge.
function buildCurvePath(fn, G) {
  const STEPS = 220;
  const parts = [];
  let prev = null;
  for (let i = 0; i <= STEPS; i++) {
    const n = (i / STEPS) * N_MAX;
    const y = fn(n);
    const xs = X_OF(G, n);
    const ys = Y_OF(G, y);
    parts.push(parts.length === 0 ? `M ${xs.toFixed(2)} ${ys.toFixed(2)}`
                                  : `L ${xs.toFixed(2)} ${ys.toFixed(2)}`);
    prev = { n, y };
    if (y > Y_MAX * 1.02) break;
  }
  // Final n value reached for the right-edge label.
  const lastN = prev ? prev.n : N_MAX;
  return { d: parts.join(' '), lastN };
}

// Right-edge label position for a curve. If the curve exits the top before
// n=nMax we anchor the label at the top edge; otherwise at the curve's right
// endpoint, clamped so labels don't collide. The `endLabelY` hint stacks the
// labels in a readable order.
function endLabelPos(G, curve, lastN) {
  // If we didn't exit the top, sit just right of the curve's actual endpoint.
  const exitedTop = lastN < N_MAX - 0.5;
  const x = exitedTop ? X_OF(G, lastN) + G.labelOffsetX : X_OF(G, N_MAX) + G.labelOffsetX;
  // Use the preferred endLabelY for stacking. Clamp into the plot frame.
  const y = Y_OF(G, curve.endLabelY);
  return { x, y, exitedTop };
}

// ─── Plot chrome ───────────────────────────────────────────────────────────
function Axes({ G }) {
  // Three reference tick marks on each axis — just enough to communicate
  // "this is a chart" without overloading. Mono labels per project convention.
  const xTicks = [0, 6, 12, 18, 24];
  const yTicks = [0, 25, 50, 75, 100];
  return (
    <>
      {/* y-axis */}
      <line
        x1={G.ox} y1={G.oy} x2={G.ox} y2={G.oy - G.yLen}
        stroke="var(--chalk-300)" strokeWidth={1.5} opacity={0.5}
      />
      {/* x-axis */}
      <line
        x1={G.ox} y1={G.oy} x2={G.ox + G.xLen} y2={G.oy}
        stroke="var(--chalk-300)" strokeWidth={1.5} opacity={0.5}
      />
      {xTicks.map((t) => (
        <g key={`x${t}`}>
          <line x1={X_OF(G, t)} y1={G.oy} x2={X_OF(G, t)} y2={G.oy + 6}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}/>
          <text x={X_OF(G, t)} y={G.oy + 22}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.axisFont}
                fill="var(--chalk-300)">{t}</text>
        </g>
      ))}
      {yTicks.map((t) => (
        <g key={`y${t}`}>
          <line x1={G.ox - 6} y1={Y_OF(G, t)} x2={G.ox} y2={Y_OF(G, t)}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.4}/>
          <text x={G.ox - 12} y={Y_OF(G, t) + 4}
                textAnchor="end"
                fontFamily="var(--font-mono)" fontSize={G.axisFont}
                fill="var(--chalk-300)">{t}</text>
        </g>
      ))}
      {/* axis titles */}
      <text x={G.ox + G.xLen / 2} y={G.oy + 46}
            textAnchor="middle"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={G.axisTitleFont} fill="var(--chalk-200)">
        n — problemstørrelse
      </text>
      <text x={G.ox - 44} y={G.oy - G.yLen - 14}
            textAnchor="start"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={G.axisTitleFont} fill="var(--chalk-200)">
        antall steg
      </text>
    </>
  );
}

// One growth curve, optionally with the right-edge label baked in.
function Curve({ G, curve, dim, label = true, opacity = 1, strokeWidth = 3 }) {
  const { d, lastN } = React.useMemo(() => buildCurvePath(curve.fn, G), [G, curve]);
  const pos = endLabelPos(G, curve, lastN);
  const stroke = curve.color;
  return (
    <g opacity={dim ? 0.18 : opacity}>
      <path d={d} stroke={stroke} strokeWidth={strokeWidth} fill="none"
            strokeLinecap="round" strokeLinejoin="round"/>
      {label && (
        <text x={pos.x} y={pos.y}
              fontFamily="var(--font-mono)" fontSize={G.labelFont}
              fill={stroke} textAnchor="start" dominantBaseline="middle">
          {curve.label}
        </text>
      )}
    </g>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="kjøretid"
      title="Asymptotisk vekst: Stor O"
      duration={SCENE_DURATION}
      introEnd={11.09}
      introCaption="Hvor fort vokser kjøretiden med n?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.09} end={23}>
        <KurveneTegnesBeat/>
      </Sprite>

      <Sprite start={23} end={35.02}>
        <SveepetBeat/>
      </Sprite>

      <Sprite start={35.02} end={48.51}>
        <DominansBeat/>
      </Sprite>

      <Sprite start={48.51} end={SCENE_DURATION}>
        <HierarkiTakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Kurvene tegnes (GENUINE MOTION) ───────────────────────────────
// Axes draw first, then each curve traces itself in via stroke-dashoffset.
// Sequenced by `curveDelay` below — the rose O(n²) lands last so it visibly
// outruns the others as it draws.
function KurveneTegnesBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { duration } = useSprite();
  // Sequence the five traces across the first ~85% of the beat so the last
  // curve has a moment to sit before the wipe to beat 3.
  const traceWindow = Math.max(duration - 2.5, 6);
  const stagger = traceWindow / CURVES.length;
  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <SvgFadeIn duration={0.4} delay={0}>
        <Axes G={G}/>
      </SvgFadeIn>
      {CURVES.map((c, i) => {
        const { d, lastN } = buildCurvePath(c.fn, G);
        const pos = endLabelPos(G, c, lastN);
        const delay = 1.0 + i * stagger;
        return (
          <g key={c.key}>
            <TraceIn d={d} stroke={c.color} strokeWidth={3}
                     duration={c.trace} delay={delay}
                     pathLength={1000}/>
            <SvgFadeIn duration={0.35} delay={delay + c.trace - 0.05}>
              <text x={pos.x} y={pos.y}
                    fontFamily="var(--font-mono)" fontSize={G.labelFont}
                    fill={c.color}
                    textAnchor="start" dominantBaseline="middle">
                {c.label}
              </text>
            </SvgFadeIn>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Beat 3: Sveepet (GENUINE MOTION) ──────────────────────────────────────
// Vertical n-marker glides from N_SWEEP_LO to N_SWEEP_HI. At each instant
// five tracking dots sit on the curves at the current n; a live readout
// panel ticks the y-values. The marker uses an ease-in-out so the divergence
// at large n holds the eye for a beat longer.
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function SveepetBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();

  const sweepStart = 1.0;
  const sweepEnd = Math.max(duration - 1.4, sweepStart + 4);
  const raw = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);
  const eased = easeInOutCubic(raw);
  const sweeping = localTime >= sweepStart;
  const n = N_SWEEP_LO + (N_SWEEP_HI - N_SWEEP_LO) * eased;
  const xMark = X_OF(G, n);

  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        <Axes G={G}/>
        {CURVES.map((c) => <Curve key={c.key} G={G} curve={c}/>)}

        {/* Sweep line */}
        {sweeping && (
          <line
            x1={xMark} y1={G.oy} x2={xMark} y2={G.oy - G.yLen}
            stroke="var(--amber-300)" strokeWidth={1.5}
            strokeDasharray="6 5" opacity={0.85}
          />
        )}
        {/* Tracking dots — one per curve at the current n */}
        {sweeping && CURVES.map((c) => {
          const y = c.fn(n);
          const inFrame = y <= Y_MAX;
          if (!inFrame) return null;
          return (
            <circle key={c.key}
                    cx={xMark} cy={Y_OF(G, y)}
                    r={5.5} fill={c.color}
                    stroke="#0c0a1f" strokeWidth={1.5}/>
          );
        })}
        {/* n badge near the marker — placement flips per aspect so it stays
            clear of the axis title (landscape) and the readout panel (portrait). */}
        {sweeping && (() => {
          const badgeY = G.markBadgePlacement === 'above'
            ? G.oy - G.yLen - 30
            : G.oy + 60;
          return (
            <g>
              <rect x={xMark - 30} y={badgeY} width={60} height={26} rx={6}
                    fill="rgba(0,0,0,0.65)" stroke="var(--amber-400)" strokeWidth={1.2}/>
              <text x={xMark} y={badgeY + 18}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)" fontSize={14}
                    fill="var(--amber-300)">
                n={Math.round(n)}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Live readout panel — DOM, positioned by layoutGeom for both aspects */}
      <ReadoutPanel G={G} n={n} sweeping={sweeping} portrait={portrait}/>
    </>
  );
}

function ReadoutPanel({ G, n, sweeping, portrait }) {
  if (!sweeping) return null;
  const rows = CURVES.map((c) => {
    const v = c.fn(n);
    const overflow = v > Y_MAX;
    const display = overflow
      ? '> ' + Y_MAX
      : (v < 10 ? v.toFixed(1) : Math.round(v).toString());
    return { ...c, display, overflow };
  });
  return (
    <div style={{
      position: 'absolute',
      left: G.readoutLeft, top: G.readoutTop, width: G.readoutW,
      padding: '14px 18px', borderRadius: 14,
      background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.10)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.30)',
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11,
        color: 'var(--amber-300)', letterSpacing: '0.16em',
        textTransform: 'uppercase',
      }}>
        steg ved n={Math.round(n)}
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: portrait ? '1fr 1fr 1fr 1fr 1fr' : '1fr 1fr',
        rowGap: 6, columnGap: portrait ? 8 : 14,
      }}>
        {rows.map((r) => (
          <div key={r.key} style={{
            display: 'flex', flexDirection: 'column', gap: 2,
            padding: portrait ? '4px 6px' : '4px 8px',
            borderLeft: `3px solid ${r.color}`,
            background: 'rgba(0,0,0,0.30)',
            borderRadius: 4,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: portrait ? 10 : 11,
              color: r.color,
            }}>{r.label}</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: portrait ? 16 : 18,
              color: r.overflow ? 'var(--rose-300)' : 'var(--chalk-100)',
            }}>{r.display}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Beat 4: Dominans ──────────────────────────────────────────────────────
// The same five curves are shown, but only O(n²) keeps its colour — the
// others fade to a dim chalk-on-canvas grey. A formula panel reveals
// 3n² + 5n + 10 → O(n²) one term at a time, so the eye follows the lower-
// order terms shrinking into the dominant one.
function DominansBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  return (
    <>
      <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        <Axes G={G}/>
        {CURVES.map((c) => {
          const isHero = c.key === 'sq';
          return (
            <Curve key={c.key} G={G} curve={c} dim={!isHero}
                   strokeWidth={isHero ? 4 : 2.5}/>
          );
        })}
      </svg>
      <FormulaPanel G={G} portrait={portrait}/>
    </>
  );
}

function FormulaPanel({ G, portrait }) {
  return (
    <div style={{
      position: 'absolute',
      left: G.formulaLeft, top: G.formulaTop, width: G.formulaW,
      padding: portrait ? '16px 20px' : '18px 22px',
      borderRadius: 14,
      background: 'rgba(0,0,0,0.55)',
      border: '1.5px solid var(--rose-400)',
      boxShadow: '0 10px 28px rgba(0,0,0,0.32)',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <FadeUp duration={0.45} delay={0.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--rose-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        største ledd vinner
      </FadeUp>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 24,
          color: 'var(--chalk-100)',
        }}>
        3n<sup>2</sup> + 5n + 10
      </FadeUp>
      <FadeUp duration={0.5} delay={2.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', lineHeight: 1.5,
        }}>
        Når n vokser, drukner <span style={{ color: 'var(--violet-400)' }}>5n</span> og
        {' '}<span style={{ color: 'var(--chalk-200)' }}>10</span> i støy.
      </FadeUp>
      <FadeUp duration={0.55} delay={3.4} distance={10}
        style={{
          display: 'flex', alignItems: 'baseline', gap: 12,
          padding: '8px 14px', borderRadius: 10,
          border: '1.5px solid var(--rose-400)',
          background: 'rgba(232,122,144,0.10)',
        }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--rose-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>blir til</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26,
          color: 'var(--rose-300)',
        }}>O(n<sup>2</sup>)</span>
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Hierarki + takeaway ───────────────────────────────────────────
function HierarkiTakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 30, textAlign: 'center',
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        rangering
      </FadeUp>

      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        alignItems: 'center',
        gap: portrait ? 10 : 14,
      }}>
        {CURVES.map((c, i) => (
          <React.Fragment key={c.key}>
            <FadeUp duration={0.5} delay={0.4 + i * 0.35} distance={8}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: portrait ? 20 : 20,
                color: c.color,
                padding: portrait ? '6px 14px' : '8px 14px',
                borderRadius: 10,
                border: `1.5px solid ${c.color}`,
                background: 'rgba(0,0,0,0.40)',
                whiteSpace: 'nowrap',
              }}>
              {c.label}
            </FadeUp>
            {i < CURVES.length - 1 && (
              <FadeUp duration={0.4} delay={0.55 + i * 0.35} distance={4}
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: portrait ? 22 : 22,
                  color: 'var(--chalk-300)',
                }}>
                {portrait ? '↓' : '<'}
              </FadeUp>
            )}
          </React.Fragment>
        ))}
      </div>

      <FadeUp duration={0.6} delay={2.8} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Hvor algoritmen <span style={{ color: 'var(--amber-300)' }}>havner</span> —
        ikke hvor den starter.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
