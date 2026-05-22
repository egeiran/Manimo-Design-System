// Characteristic Roots: Three Regimes of a 2nd-Order ODE — Manimo lesson scene.
// Chapter 4 of mat2b (Differensialligninger). Solves the constant-coefficient
// 2nd-order linear ODE
//
//   y'' + 2γ y' + ω² y = 0
//
// via the ansatz y = e^(rt). The characteristic polynomial is
//
//   r² + 2γ r + ω² = 0           r = -γ ± √(γ² - ω²)
//
// The discriminant Δ = γ² - ω² classifies solutions into three regimes:
//
//   Δ > 0   two distinct real roots  → overdamped (slow decay, no overshoot)
//   Δ = 0   repeated real root       → critically damped (fastest no-overshoot)
//   Δ < 0   complex conjugate roots  → underdamped (oscillating decay)
//
// All curves use the initial condition y(0) = 1, y'(0) = 0. Closed-form:
//
//   underdamped:  y = e^(-γt) · (cos ωd t + (γ/ωd) sin ωd t),  ωd = √(ω² - γ²)
//   critical:     y = (1 + γ t) · e^(-γ t)       (with γ = ω)
//   overdamped:   y = (r2·e^(r1·t) - r1·e^(r2·t)) / (r2 - r1)
//
// Beats:
//    0– 4.5   Manimo hook
//    4.5–15   Ansatz + characteristic polynomial
//   15–26     Discriminant + three cases
//   26–36     Three solution curves drawn side by side
//   36–46     Sweep γ — solution morphs through all regimes (GENUINE MOTION)
//   46–50     Takeaway
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  body captions, t-line backbone
//   amber-400  critically-damped curve, the sweep curve, regime markers
//   amber-300  payoff formulas
//   rose-400   underdamped curve
//   teal-400   overdamped curve
//   violet-400 ansatz / setup labels

const SCENE_DURATION = 82;

const NARRATION = [
  /*  0.00– 4.50 */ 'A second-order linear ODE has three kinds of solution. One small number decides which.',
  /*  4.50–15.00 */ "Try the ansatz y equals e to the r t. Plug into y double prime plus two gamma y prime plus omega squared y equals zero, and the exponential factors out. What's left is the characteristic polynomial: r squared plus two gamma r plus omega squared equals zero.",
  /* 15.00–26.00 */ 'Solve with the quadratic formula. The roots are minus gamma plus or minus the square root of gamma squared minus omega squared. The thing under the root — the discriminant — decides everything. Positive, zero, or negative gives three completely different solutions.',
  /* 26.00–36.00 */ 'Visualise each one. Underdamped: oscillating decay, the wave envelope shrinks like e to the minus gamma t. Critically damped: the fastest decay without crossing zero. Overdamped: slow decay, no oscillation at all.',
  /* 36.00–46.00 */ 'Now sweep gamma from zero up past omega. Watch the solution morph through all three regimes — undamped sine wave, then ringing decay, then the critical edge, then the slow droop of overdamping.',
  /* 46.00–50.00 */ 'Three regimes, one discriminant. Underdamped rings; critical is the fastest no-overshoot; overdamped lags.',
];

const NARRATION_AUDIO = 'audio/characteristic-roots-regimes/scene.mp3';

// ─── ODE parameters & solutions ───────────────────────────────────────────
const OMEGA = 1.0;
const T_MIN = 0, T_MAX = 6;
const Y_MIN = -0.6, Y_MAX = 1.15;

// Underdamped y(t) for γ < ω.
function yUnder(t, gamma) {
  const wd = Math.sqrt(Math.max(0, OMEGA * OMEGA - gamma * gamma));
  if (wd < 1e-6) return Math.exp(-gamma * t) * (1 + gamma * t);
  return Math.exp(-gamma * t) * (Math.cos(wd * t) + (gamma / wd) * Math.sin(wd * t));
}
// Critically damped — γ = ω.
function yCrit(t) {
  return (1 + OMEGA * t) * Math.exp(-OMEGA * t);
}
// Overdamped — γ > ω.
function yOver(t, gamma) {
  const s = Math.sqrt(gamma * gamma - OMEGA * OMEGA);
  const r1 = -gamma + s, r2 = -gamma - s;
  return (r2 * Math.exp(r1 * t) - r1 * Math.exp(r2 * t)) / (r2 - r1);
}
// Generic dispatcher — picks the right closed form by inspecting (γ, ω).
function yGen(t, gamma) {
  const d = gamma * gamma - OMEGA * OMEGA;
  if (d < -1e-6) return yUnder(t, gamma);
  if (d > 1e-6) return yOver(t, gamma);
  return yCrit(t);
}

// ─── Plot geometry ────────────────────────────────────────────────────────
function graphGeom(portrait) {
  return portrait
    // Portrait: panel sits to the right of the bottom-left Manimo mascot;
    // the discriminant number line below the graph fits within graph width.
    ? { ox: 96,  oy: 720, w: 580, h: 480,
        panelW: 500, panelLeft: 140, panelBottom: 96 }
    : { ox: 130, oy: 540, w: 680, h: 360,
        panelW: 400, panelRight: 56, panelTop: 200 };
}

function mapT(t, G) { return G.ox + (t - T_MIN) / (T_MAX - T_MIN) * G.w; }
function mapY(y, G) { return G.oy - (y - Y_MIN) / (Y_MAX - Y_MIN) * G.h; }

function pathFor(fn, G, samples = 220) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = T_MIN + (T_MAX - T_MIN) * (i / samples);
    const y = fn(t);
    pts.push(`${i === 0 ? 'M' : 'L'} ${mapT(t, G).toFixed(1)} ${mapY(y, G).toFixed(1)}`);
  }
  return pts.join(' ');
}

// ─── Helpers ──────────────────────────────────────────────────────────────
function SoftPanel({ children, right, top, width = 380, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom, top: top != null && bottom == null ? top : undefined, right: undefined }
    : { right, top };
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
      gap: 12,
    }}>{children}</div>
  );
}

function Axes({ G }) {
  // y = 0 line inside the plot.
  const yZero = mapY(0, G);
  return (
    <g>
      <line x1={G.ox} y1={yZero} x2={G.ox + G.w} y2={yZero}
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 4" opacity={0.6}/>
      <line x1={G.ox} y1={G.oy - G.h} x2={G.ox} y2={G.oy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={G.ox} y1={G.oy} x2={G.ox + G.w} y2={G.oy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <text x={G.ox + G.w + 12} y={G.oy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={20}>t</text>
      <text x={G.ox - 14} y={G.oy - G.h - 8} textAnchor="end"
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={20}>y</text>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="second-order linear ODEs"
      title="Characteristic Roots: Three Regimes"
      duration={SCENE_DURATION}
      introEnd={6.29}
      introCaption="Three regimes. One discriminant."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.29} end={25.83}>
        <AnsatzBeat/>
      </Sprite>

      <Sprite start={25.83} end={42.39}>
        <DiscriminantBeat/>
      </Sprite>

      <Sprite start={42.39} end={58.64}>
        <ThreeCurvesBeat/>
      </Sprite>

      <Sprite start={58.64} end={72.57}>
        <SweepBeat/>
      </Sprite>

      <Sprite start={72.57} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: ansatz + characteristic polynomial ───────────────────────────
function AnsatzBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28, maxWidth: portrait ? 620 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        the ode
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 42, color: 'var(--chalk-200)',
        }}>
        y″ + 2γ y′ + ω² y = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 16,
          color: 'var(--violet-400)', letterSpacing: '0.08em',
          marginTop: 6,
        }}>
        ansatz: y = e<sup style={{ fontSize: '0.65em' }}>rt</sup>
      </FadeUp>

      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28, color: 'var(--chalk-300)',
          textAlign: 'center', maxWidth: portrait ? '30ch' : '46ch', lineHeight: 1.35,
        }}>
        plug in &rArr; e<sup style={{ fontSize: '0.55em' }}>rt</sup>·(r² + 2γ r + ω²) = 0
      </FadeUp>

      <FadeUp duration={0.4} delay={3.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>

      <FadeUp duration={0.7} delay={3.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 52, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        r² + 2γ r + ω² = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={4.8} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '28ch' : '40ch', lineHeight: 1.4,
          marginTop: portrait ? 2 : 6,
        }}>
        the characteristic polynomial
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: discriminant + three cases ───────────────────────────────────
function DiscriminantBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 16 : 22, maxWidth: portrait ? 640 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        quadratic formula
      </FadeUp>

      <FadeUp duration={0.55} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 40, color: 'var(--chalk-100)',
        }}>
        r = −γ ± √(γ² − ω²)
      </FadeUp>

      <FadeUp duration={0.55} delay={1.5} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32, color: 'var(--amber-300)',
          marginTop: 4,
        }}>
        Δ = γ² − ω²
      </FadeUp>

      {/* Three case rows */}
      <div style={{
        display: 'flex', flexDirection: 'column',
        gap: portrait ? 10 : 14, marginTop: portrait ? 4 : 12,
        alignItems: 'stretch', width: '100%',
      }}>
        <FadeUp duration={0.5} delay={2.8} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 17,
            color: 'var(--teal-400)', letterSpacing: '0.02em',
            display: 'flex', justifyContent: portrait ? 'flex-start' : 'space-between',
            flexWrap: 'wrap', gap: portrait ? 8 : 24,
            paddingLeft: portrait ? 0 : 12,
          }}>
          <span><span style={{ color: 'var(--chalk-300)', fontFamily: 'var(--font-mono)' }}>Δ &gt; 0</span> two distinct real roots</span>
          <span style={{ fontStyle: 'italic' }}>→ overdamped</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={3.6} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 17,
            color: 'var(--amber-300)', letterSpacing: '0.02em',
            display: 'flex', justifyContent: portrait ? 'flex-start' : 'space-between',
            flexWrap: 'wrap', gap: portrait ? 8 : 24,
            paddingLeft: portrait ? 0 : 12,
          }}>
          <span><span style={{ color: 'var(--chalk-300)', fontFamily: 'var(--font-mono)' }}>Δ = 0</span> one repeated real root</span>
          <span style={{ fontStyle: 'italic' }}>→ critically damped</span>
        </FadeUp>
        <FadeUp duration={0.5} delay={4.4} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 17,
            color: 'var(--rose-400)', letterSpacing: '0.02em',
            display: 'flex', justifyContent: portrait ? 'flex-start' : 'space-between',
            flexWrap: 'wrap', gap: portrait ? 8 : 24,
            paddingLeft: portrait ? 0 : 12,
          }}>
          <span><span style={{ color: 'var(--chalk-300)', fontFamily: 'var(--font-mono)' }}>Δ &lt; 0</span> complex conjugate roots</span>
          <span style={{ fontStyle: 'italic' }}>→ underdamped</span>
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Beat 4: three solution curves side by side ───────────────────────────
// Three closed-form curves traced into the same axes, with synced reveal.
function ThreeCurvesBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = graphGeom(portrait);

  // Reveal each curve via a stroke-dashoffset trick. The path "length"
  // pathLength is normalised to 1000 (animations.jsx uses 1000 as a
  // normalisation; here we set it explicitly).
  const PL = 1000;
  const traceStart = 0.4;
  const traceDur = 2.4;
  const reveal = (delay) => {
    const s = clamp((localTime - traceStart - delay) / traceDur, 0, 1);
    return PL * (1 - Easing.easeOutCubic(s));
  };

  // Hand-pick representative γ for each regime so the curves are
  // distinguishable on one plot.
  const G_UNDER = 0.25;        // ringing decay
  const G_OVER  = 1.7;         // slow droop

  const dUnder = pathFor(t => yUnder(t, G_UNDER), G);
  const dCrit  = pathFor(t => yCrit(t), G);
  const dOver  = pathFor(t => yOver(t, G_OVER), G);

  // Underdamped envelope ±e^(-γt) — drawn faint.
  const dEnvHi = pathFor(t =>  Math.exp(-G_UNDER * t), G);
  const dEnvLo = pathFor(t => -Math.exp(-G_UNDER * t), G);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <Axes G={G}/>

        {/* Underdamped envelope (very faint) */}
        <path d={dEnvHi} fill="none" stroke="var(--rose-400)"
              strokeWidth={1.2} strokeDasharray="4 4" opacity={0.25}/>
        <path d={dEnvLo} fill="none" stroke="var(--rose-400)"
              strokeWidth={1.2} strokeDasharray="4 4" opacity={0.25}/>

        {/* Underdamped curve */}
        <path d={dUnder} fill="none" stroke="var(--rose-400)"
              strokeWidth={2.8} strokeLinecap="round"
              pathLength={PL} strokeDasharray={PL}
              strokeDashoffset={reveal(0)}/>

        {/* Critically damped curve */}
        <path d={dCrit} fill="none" stroke="var(--amber-400)"
              strokeWidth={3.0} strokeLinecap="round"
              pathLength={PL} strokeDasharray={PL}
              strokeDashoffset={reveal(1.0)}/>

        {/* Overdamped curve */}
        <path d={dOver} fill="none" stroke="var(--teal-400)"
              strokeWidth={2.8} strokeLinecap="round"
              pathLength={PL} strokeDasharray={PL}
              strokeDashoffset={reveal(2.0)}/>

        {/* Initial condition marker */}
        <circle cx={mapT(0, G)} cy={mapY(1, G)} r={5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.2}/>
        <text x={mapT(0, G) - 10} y={mapY(1, G) - 8} textAnchor="end"
              fill="var(--chalk-200)" fontFamily="var(--font-mono)"
              fontSize={12}>y(0)=1</text>
      </svg>

      {/* Legend */}
      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.4} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--rose-400)', letterSpacing: '0.04em',
            }}>
            ─── underdamped (γ &lt; ω)
          </FadeUp>
          <FadeUp duration={0.45} delay={1.4} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--amber-300)', letterSpacing: '0.04em',
            }}>
            ─── critical (γ = ω)
          </FadeUp>
          <FadeUp duration={0.45} delay={2.4} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--teal-400)', letterSpacing: '0.04em',
            }}>
            ─── overdamped (γ &gt; ω)
          </FadeUp>
          <FadeUp duration={0.5} delay={3.6} distance={8}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 13,
              color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4,
            }}>
            Same initial state, three flavours of decay.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.4} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
            three regimes
          </FadeUp>
          <FadeUp duration={0.5} delay={0.7} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--rose-400)', letterSpacing: '0.04em', marginTop: 6,
            }}>
            ─── underdamped (γ &lt; ω)
          </FadeUp>
          <FadeUp duration={0.5} delay={1.7} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--amber-300)', letterSpacing: '0.04em',
            }}>
            ─── critical (γ = ω)
          </FadeUp>
          <FadeUp duration={0.5} delay={2.7} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--teal-400)', letterSpacing: '0.04em',
            }}>
            ─── overdamped (γ &gt; ω)
          </FadeUp>
          <FadeUp duration={0.5} delay={3.6} distance={8}
            style={{
              fontFamily: 'var(--font-sans)', fontSize: 15,
              color: 'var(--chalk-300)', maxWidth: '32ch', lineHeight: 1.4,
              marginTop: 10,
            }}>
            Same initial state — three flavours of decay.
            The faint dashed envelope is e<sup>−γt</sup>.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 5: sweep γ — GENUINE MOTION ─────────────────────────────────────
// The damping coefficient γ animates from 0 → 1.6·ω. At each instant the
// solution curve is re-rendered for the current γ, and a discriminant number
// line shows where we are. Regime label updates live.
function SweepBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = graphGeom(portrait);

  // Sweep parameter: 0 → 1 over ~8 s after a short hold.
  const sweepDelay = 0.6;
  const sweepDur = 8.0;
  const s = clamp((localTime - sweepDelay) / sweepDur, 0, 1);
  const eased = Easing.easeInOutCubic(s);
  const gMin = 0.0;
  const gMax = 1.6 * OMEGA;
  const gamma = gMin + (gMax - gMin) * eased;
  const delta = gamma * gamma - OMEGA * OMEGA;

  // Current regime label.
  let regime, regimeColor, regimeNote;
  if (delta < -1e-3) {
    regime = 'underdamped';   regimeColor = 'var(--rose-400)';
    regimeNote = 'Δ < 0 — complex conjugate roots';
  } else if (delta > 1e-3) {
    regime = 'overdamped';    regimeColor = 'var(--teal-400)';
    regimeNote = 'Δ > 0 — two distinct real roots';
  } else {
    regime = 'critically damped'; regimeColor = 'var(--amber-300)';
    regimeNote = 'Δ ≈ 0 — repeated real root';
  }

  // Path for the current solution.
  const d = pathFor(t => yGen(t, gamma), G);

  // Discriminant marker: a small "number line" inset showing γ relative to ω.
  // Place it just below the graph.
  const NL_X0 = G.ox + 8;
  const NL_X1 = G.ox + G.w - 8;
  const NL_Y  = G.oy + (portrait ? 56 : 44);
  const NL_OMEGA_X = NL_X0 + (NL_X1 - NL_X0) * (OMEGA / gMax);
  const NL_GAMMA_X = NL_X0 + (NL_X1 - NL_X0) * (gamma / gMax);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <Axes G={G}/>

        {/* The morphing solution curve */}
        <path d={d} fill="none" stroke={regimeColor}
              strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round"/>

        {/* Initial condition dot */}
        <circle cx={mapT(0, G)} cy={mapY(1, G)} r={5}
                fill="var(--chalk-100)" stroke="var(--chalk-200)" strokeWidth={1.2}/>

        {/* Discriminant number line below the graph */}
        <line x1={NL_X0} y1={NL_Y} x2={NL_X1} y2={NL_Y}
              stroke="var(--chalk-300)" strokeWidth={1.6}
              strokeLinecap="round"/>
        {/* ω marker (the critical point) */}
        <line x1={NL_OMEGA_X} y1={NL_Y - 9} x2={NL_OMEGA_X} y2={NL_Y + 9}
              stroke="var(--amber-300)" strokeWidth={2.2}/>
        <text x={NL_OMEGA_X} y={NL_Y + 26} textAnchor="middle"
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>ω</text>
        {/* Sub-labels: γ=0 left, γ=1.6ω right */}
        <text x={NL_X0} y={NL_Y + 26} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11}>γ=0</text>
        <text x={NL_X1} y={NL_Y + 26} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11}>γ=1.6ω</text>
        {/* Active γ marker */}
        <circle cx={NL_GAMMA_X} cy={NL_Y} r={7}
                fill={regimeColor} stroke="var(--chalk-100)" strokeWidth={1.4}/>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
            sweep γ
          </FadeUp>
          <FadeUp duration={0.5} delay={0.6} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--chalk-200)', letterSpacing: '0.04em',
            }}>
            γ = {gamma.toFixed(2)}    ω = 1.00
          </FadeUp>
          <FadeUp duration={0.5} delay={0.9} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 14,
              color: 'var(--chalk-200)', letterSpacing: '0.04em',
            }}>
            Δ = {delta.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.5} delay={1.4} distance={10}
            style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 22, color: regimeColor,
            }}>
            {regime}
          </FadeUp>
          <FadeUp duration={0.5} delay={1.7} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 12,
              color: 'var(--chalk-300)', letterSpacing: '0.04em',
            }}>
            {regimeNote}
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
              letterSpacing: '0.16em', textTransform: 'uppercase',
            }}>
            live parameter
          </FadeUp>
          <FadeUp duration={0.5} delay={0.6} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 16,
              color: 'var(--chalk-200)', letterSpacing: '0.05em',
              marginTop: 6,
            }}>
            γ = {gamma.toFixed(2)}    ω = 1.00
          </FadeUp>
          <FadeUp duration={0.5} delay={0.9} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 16,
              color: 'var(--chalk-200)', letterSpacing: '0.05em',
            }}>
            Δ = γ² − ω² = {delta.toFixed(2)}
          </FadeUp>
          <FadeUp duration={0.5} delay={1.4} distance={10}
            style={{
              fontFamily: 'var(--font-serif)', fontStyle: 'italic',
              fontSize: 30, color: regimeColor, marginTop: 8,
            }}>
            {regime}
          </FadeUp>
          <FadeUp duration={0.5} delay={1.7} distance={8}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 13,
              color: 'var(--chalk-300)', letterSpacing: '0.04em',
            }}>
            {regimeNote}
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 6: Takeaway ─────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        the whole story
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 58, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        Δ = γ² − ω²
      </FadeUp>

      <FadeUp duration={0.55} delay={1.2} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 30, color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '48ch', lineHeight: 1.3,
        }}>
        <span style={{ color: 'var(--rose-400)' }}>underdamped</span> rings ·
        <span style={{ color: 'var(--amber-300)' }}> critical</span> is fastest no-overshoot ·
        <span style={{ color: 'var(--teal-400)' }}> overdamped</span> lags
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
