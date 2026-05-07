// Damped Oscillation: Why Real Springs Stop — Manimo lesson scene.
// Generated from motion/damped-oscillation.spec.json. Builds directly on
// spring-oscillation: same Hooke restoring force, plus a velocity-proportional
// drag term.
//
// Beats (estimated timings from the fallback audio manifest at 14 chars/sec;
// Step 4c will overwrite these once the ElevenLabs API is reachable):
//    0.00– 5.44   Manimo enters; hook question
//    5.44–15.74   Spring + drag setup; m·ẍ + b·ẋ + k·x = 0
//   15.74–26.04   Divide by m → ẍ + 2γẋ + ω₀²x = 0 → x(t) = A·e^(-γt)·sin(ωt+φ)
//   26.04–37.41   Animated damped trace — value-driven curve with head marker
//   37.41–49.00   Three regimes: under, critical, overdamped + closing takeaway
//
// Authoring notes:
//   • Delays are localTime relative to the enclosing Sprite.
//   • SvgFadeIn for SVG children, FadeUp for HTML/DOM only.
//   • Beat 4 (DampedTrace) is the genuine-animation beat: x(t) is sampled
//     at the current localTime and a head marker tracks the live value.

const SCENE_DURATION = 49;

// Narration script — one sentence per beat, source of truth for TTS.
// NARRATION.length must match the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 5.44 */ 'Pull a real spring, let it go — it bobs, then stops. What slows it down?',
  /*  5.44–15.74 */ "Add air resistance — a drag force proportional to velocity. Newton's law gains a new term: m x double dot plus b x dot plus k x equals zero.",
  /* 15.74–26.04 */ 'Divide by m, set gamma equal to b over two m, and the underdamped solution turns out to be a sine wave whose amplitude decays exponentially.',
  /* 26.04–37.41 */ 'Watch each swing fall a little short of the last, while the dashed envelope curves squeeze in toward zero — the amplitude shrinks, but the rhythm survives.',
  /* 37.41–49.00 */ 'Crank the drag higher and the oscillation disappears. Crank it just right and the spring returns home in the shortest time without overshooting.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 9 · damping"
      title="Damped Oscillation: Why Real Springs Stop"
      duration={SCENE_DURATION}
      // Beat 1 owned by SceneChrome's JourneyManimo.
      introEnd={5.44}
      introCaption="Pull a real spring, release — what makes it stop?"
    >
      <Sprite start={5.44} end={15.74}>
        <DragSetup />
      </Sprite>

      <Sprite start={15.74} end={26.04}>
        <Solution />
      </Sprite>

      <Sprite start={26.04} end={37.41}>
        <DampedTrace />
      </Sprite>

      <Sprite start={37.41} end={SCENE_DURATION}>
        <Regimes />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Spring + drag setup ──────────────────────────────────────────
// Wall on the left, spring stretched right, mass at right end. Two arrows on
// the mass — restoring spring force (rose) and drag force (teal) — both
// pointing left because the mass is moving rightward away from equilibrium
// at this instant. Big diff-eq below.
function DragSetup() {
  const portrait = usePortrait();
  const G = portrait
    ? { wallX: 60, springStart: 78, springEnd: 412, massCx: 442, massSize: 46,
        eqX: 322, fLen: 60, dragLen: 42,
        vbW: 600, vbH: 360, yMid: 130,
        wallTop: 70, wallBot: 200,
        eqTop: 70, eqBot: 210, eqLabelY: 230,
        forceY: 168, fLabelY: 162, dragY: 102, dragLabelY: 96,
        velY: 130, velLen: 36, velLabelY: 121,
        captionY: 254,
        formulaY: 314, formulaSize: 28,
        fontMass: 18, fontF: 18, fontDrag: 16, fontVel: 16, fontCaption: 13 }
    : { wallX: 80, springStart: 100, springEnd: 552, massCx: 580, massSize: 52,
        eqX: 440, fLen: 70, dragLen: 50,
        vbW: 880, vbH: 360, yMid: 150,
        wallTop: 80, wallBot: 220,
        eqTop: 80, eqBot: 232, eqLabelY: 254,
        forceY: 192, fLabelY: 184, dragY: 116, dragLabelY: 108,
        velY: 150, velLen: 44, velLabelY: 140,
        captionY: 274,
        formulaY: 326, formulaSize: 36,
        fontMass: 20, fontF: 22, fontDrag: 18, fontVel: 18, fontCaption: 14 };

  const massLeft = G.massCx - G.massSize / 2;
  const massTop = G.yMid - G.massSize / 2;
  const forceTipX = G.massCx - G.fLen;
  const dragTipX = G.massCx - G.dragLen;
  const velStartX = G.massCx + G.massSize / 2;
  const velTipX = velStartX + G.velLen;

  // Spring zigzag — same shape as spring-oscillation but slightly squashed.
  const N = 8;
  const dx = (G.springEnd - G.springStart) / N;
  const yHi = G.yMid - 18;
  const yLo = G.yMid + 18;
  const pts = [`M ${G.springStart} ${G.yMid}`];
  for (let i = 1; i < N; i++) {
    const x = G.springStart + i * dx;
    const y = i % 2 === 1 ? yHi : yLo;
    pts.push(`L ${x.toFixed(1)} ${y}`);
  }
  pts.push(`L ${G.springEnd} ${G.yMid}`);
  const springD = pts.join(' ');

  const hatchPitch = portrait ? 16 : 20;
  const hatchOffsetY = portrait ? 14 : 16;
  const hatchCount = portrait ? 7 : 7;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Wall */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.wallX} y1={G.wallTop} x2={G.wallX} y2={G.wallBot}
                stroke="var(--chalk-300)" strokeWidth={2.5}/>
          {Array.from({ length: hatchCount }, (_, i) => (
            <line key={i}
                  x1={G.wallX} y1={G.wallTop + 8 + i * hatchPitch}
                  x2={G.wallX - 16} y2={G.wallTop + 8 + hatchOffsetY + i * hatchPitch}
                  stroke="var(--chalk-300)" strokeWidth={1.2}/>
          ))}
        </SvgFadeIn>

        {/* Spring */}
        <TraceIn d={springD}
                 stroke="var(--amber-400)" strokeWidth={2.5}
                 fill="none"
                 duration={0.9} delay={0.3}/>

        {/* Mass */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <rect x={massLeft} y={massTop} width={G.massSize} height={G.massSize}
                fill="var(--amber-400)" opacity={0.92}
                stroke="var(--amber-300)" strokeWidth={1.5}
                rx={4}/>
          <text x={G.massCx} y={G.yMid + 6} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMass}>m</text>
        </SvgFadeIn>

        {/* Equilibrium dashed line */}
        <SvgFadeIn duration={0.35} delay={1.3}>
          <line x1={G.eqX} y1={G.eqTop} x2={G.eqX} y2={G.eqBot}
                stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="5 5"/>
          <text x={G.eqX} y={G.eqLabelY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">EQUILIBRIUM</text>
        </SvgFadeIn>

        {/* Velocity arrow — mass moving rightward */}
        <SvgFadeIn duration={0.35} delay={1.2}>
          <line x1={velStartX} y1={G.velY} x2={velTipX} y2={G.velY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <path d={`M ${velTipX} ${G.velY} L ${velTipX - 9} ${G.velY - 5} L ${velTipX - 9} ${G.velY + 5} Z`}
                fill="var(--chalk-200)"/>
          <text x={velTipX + 4} y={G.velLabelY}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontVel} textAnchor="start">v</text>
        </SvgFadeIn>

        {/* Restoring spring force arrow — left from mass centre */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.massCx} y1={G.forceY} x2={forceTipX} y2={G.forceY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${forceTipX} ${G.forceY} L ${forceTipX + 10} ${G.forceY - 6} L ${forceTipX + 10} ${G.forceY + 6} Z`}
                fill="var(--rose-400)"/>
          <text x={massLeft - 4} y={G.fLabelY}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontF} textAnchor="end">−kx</text>
        </SvgFadeIn>

        {/* Drag force arrow — left, above the spring force; same direction as
            spring force at this instant because v points right. */}
        <SvgFadeIn duration={0.4} delay={1.8}>
          <line x1={G.massCx} y1={G.dragY} x2={dragTipX} y2={G.dragY}
                stroke="var(--teal-400)" strokeWidth={2.5}/>
          <path d={`M ${dragTipX} ${G.dragY} L ${dragTipX + 10} ${G.dragY - 6} L ${dragTipX + 10} ${G.dragY + 6} Z`}
                fill="var(--teal-400)"/>
          <text x={massLeft - 4} y={G.dragLabelY}
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontDrag} textAnchor="end">−bv</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.04em">
            drag opposes motion, always
          </text>
        </SvgFadeIn>

        {/* Diff-eq payoff */}
        <SvgFadeIn duration={0.5} delay={5.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.formulaSize} letterSpacing="0.02em">
            m ẍ + b ẋ + k x = 0
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Solution payoff ──────────────────────────────────────────────
// Stack: simplified diff-eq → small parameter caption → underdamped eyebrow
// → big amber payoff x(t) = A·e^(-γt)·sin(ωt+φ) → footnote about ω.
function Solution() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 14 : 18, textAlign: 'center',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        divide through by m
      </FadeUp>

      <FadeUp duration={0.5} delay={0.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 36, color: 'var(--chalk-200)',
          letterSpacing: '0.02em',
        }}>
        ẍ + 2γ ẋ + ω₀² x = 0
      </FadeUp>

      <FadeUp duration={0.4} delay={1.4} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.06em',
        }}>
        γ = b / 2m   ·   ω₀ = √(k/m)
      </FadeUp>

      <FadeUp duration={0.4} delay={2.4} distance={6}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          marginTop: portrait ? 6 : 12,
        }}>
        underdamped (γ &lt; ω₀) — solve the diff-eq
      </FadeUp>

      <FadeUp duration={0.6} delay={3.0} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 50, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
          lineHeight: 1.15,
        }}>
        x(t) = A e<sup style={{ fontStyle: 'italic', fontSize: '0.55em', verticalAlign: 'super' }}>−γt</sup> sin(ωt + φ)
      </FadeUp>

      <FadeUp duration={0.4} delay={4.4} distance={6}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '28ch' : 'none', lineHeight: 1.35,
        }}>
        ω = √(ω₀² − γ²) — slightly slower than the undamped rhythm
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Animated damped trace ────────────────────────────────────────
// THE GENUINE-ANIMATION BEAT: x(t) = A·e^(-γt)·sin(ωt) is sampled live as a
// function of the Sprite's localTime. The polyline is rebuilt each frame to
// the visible head, the rose head-dot tracks the current x value, and the
// dashed envelope ±A·e^(-γt) traces in alongside.
function DampedTrace() {
  const portrait = usePortrait();
  const { localTime, duration } = useSprite();

  const G = portrait
    ? { vbW: 640, vbH: 540, plotX0: 70, plotY0: 270, plotW: 540, plotH: 240,
        amp: 100, headR: 6, font: 14, axisFont: 12, captionY: 510, captionFont: 13 }
    : { vbW: 880, vbH: 380, plotX0: 90, plotY0: 190, plotW: 720, plotH: 280,
        amp: 120, headR: 7, font: 16, axisFont: 13, captionY: 358, captionFont: 14 };

  // Display physics — picked so the underdamped envelope is clearly
  // visible across the plot width: ~3 full oscillations and a final
  // amplitude near 0.15·A.
  const T_END = 6.0;        // simulated seconds plotted
  const A = G.amp;
  const omega = (2 * Math.PI * 3) / T_END;  // 3 oscillations across plot
  const gamma = -Math.log(0.15) / T_END;     // decay so e^(-γT) ≈ 0.15

  // Trace drawing window — start at delay 0.6, leave 1.4s breath at end so
  // the final shape is readable before the beat ends.
  const TRACE_DELAY = 0.6;
  const TRACE_HOLD = 1.6;
  const traceDur = Math.max(0.5, duration - TRACE_DELAY - TRACE_HOLD);
  const tFrac = clamp((localTime - TRACE_DELAY) / traceDur, 0, 1);
  const tNow = tFrac * T_END;

  // Build path strings for the visible portion. Sample at 220 points for
  // a smooth curve; rebuild each frame.
  const N = 220;
  const visN = Math.max(2, Math.floor(N * tFrac) + 1);
  const xAt = (tt) => G.plotX0 + (tt / T_END) * G.plotW;
  const yAt = (tt) => G.plotY0 - A * Math.exp(-gamma * tt) * Math.sin(omega * tt);
  const yEnvUpper = (tt) => G.plotY0 - A * Math.exp(-gamma * tt);
  const yEnvLower = (tt) => G.plotY0 + A * Math.exp(-gamma * tt);

  const buildPath = (yFn) => {
    const parts = [];
    for (let i = 0; i <= visN; i++) {
      const tt = (i / N) * T_END;
      if (tt > tNow) break;
      const x = xAt(tt).toFixed(1);
      const y = yFn(tt).toFixed(1);
      parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    return parts.join(' ');
  };
  const tracePath = buildPath(yAt);
  const envUpperPath = buildPath(yEnvUpper);
  const envLowerPath = buildPath(yEnvLower);

  const headX = xAt(tNow);
  const headY = yAt(tNow);

  // Reference y-marks at +A and -A (only show for the first second so the
  // viewer anchors the scale, then they fade with the rest of the chrome).
  const yPlus = G.plotY0 - A;
  const yMinus = G.plotY0 + A;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Zero line — stage axis through the middle */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.plotX0} y1={G.plotY0} x2={G.plotX0 + G.plotW} y2={G.plotY0}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          {/* Vertical axis — short tick marks at +A and -A */}
          <line x1={G.plotX0} y1={yPlus - 4} x2={G.plotX0} y2={yMinus + 4}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.plotX0 - 6} y1={yPlus} x2={G.plotX0} y2={yPlus}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <line x1={G.plotX0 - 6} y1={yMinus} x2={G.plotX0} y2={yMinus}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <text x={G.plotX0 - 12} y={yPlus + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.axisFont}>+A</text>
          <text x={G.plotX0 - 12} y={yMinus + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.axisFont}>−A</text>
        </SvgFadeIn>

        {/* Axis labels */}
        <SvgFadeIn duration={0.35} delay={0.4}>
          <text x={G.plotX0 + G.plotW + 10} y={G.plotY0 + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>t</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={0.5}>
          <text x={G.plotX0 + 4} y={G.plotY0 - A - 14}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.font}>x(t)</text>
        </SvgFadeIn>

        {/* Envelope curves — dashed chalk-300, traced synchronously */}
        <path d={envUpperPath}
              fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}
              strokeDasharray="4 5" opacity={0.85}/>
        <path d={envLowerPath}
              fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}
              strokeDasharray="4 5" opacity={0.85}/>

        {/* The damped sine trace itself */}
        <path d={tracePath}
              fill="none" stroke="var(--amber-400)" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round"/>

        {/* Head dot — only show once trace has actually started */}
        {tFrac > 0 && tFrac < 1 && (
          <circle cx={headX} cy={headY} r={G.headR}
                  fill="var(--rose-400)"
                  stroke="var(--rose-300)" strokeWidth={1.5}/>
        )}

        {/* Envelope label — appears once decay is visible */}
        <SvgFadeIn duration={0.4} delay={3.5}>
          <text x={G.plotX0 + G.plotW * 0.55} y={G.plotY0 - A * Math.exp(-gamma * T_END * 0.55) - 8}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.axisFont}>
            +A e<tspan fontSize={G.axisFont * 0.7} dy={-G.axisFont * 0.4}>−γt</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={7.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.captionFont} letterSpacing="0.04em">
            amplitude shrinks like e<tspan fontSize={G.captionFont * 0.75} dy={-G.captionFont * 0.4}>−γt</tspan>
            <tspan dy={G.captionFont * 0.4}> — but the rhythm survives</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Three regimes ────────────────────────────────────────────────
// Three small panels — each plots e^(-γt) modulating cos(ωt) at a different γ
// and traces in sequentially. Closing serif italic line synthesises the
// scene's takeaway. Portrait stacks the three vertically.
function Regimes() {
  const portrait = usePortrait();
  const { localTime, duration } = useSprite();

  // Layout
  const G = portrait
    ? { vbW: 640, vbH: 660,
        panelW: 540, panelH: 130, gap: 22,
        topY: 30,
        captionY: 612, captionFont: 18 }
    : { vbW: 1040, vbH: 320,
        panelW: 300, panelH: 150, gap: 30,
        topY: 30,
        captionY: 286, captionFont: 22 };

  // Each panel's own (γ, ω₀) — picked so the curves are visually distinct.
  const PANELS = [
    { id: 'under',   label: 'underdamped (γ < ω₀)',   color: 'var(--amber-400)', gamma: 0.45, omega: 6.5, hasOscillation: true,  delay: 0.4 },
    { id: 'critical',label: 'critical (γ = ω₀)',      color: 'var(--rose-400)',  gamma: 3.0,  omega: 3.0, hasOscillation: false, delay: 1.7 },
    { id: 'over',    label: 'overdamped (γ > ω₀)',    color: 'var(--violet-400)',gamma: 4.0,  omega: 2.0, hasOscillation: false, delay: 3.0 },
  ];

  const PANEL_TRACE_DUR = 1.4;  // each panel traces over ~1.4s
  const T_END = 3.0;            // each plot covers 3 simulated seconds

  // Helper to compute each panel's animated trace path
  const buildPanelPath = (panel, panelLeft, panelMidY) => {
    const traceFrac = clamp((localTime - panel.delay - 0.4) / PANEL_TRACE_DUR, 0, 1);
    if (traceFrac <= 0) return '';

    const N = 120;
    const visN = Math.max(2, Math.floor(N * traceFrac) + 1);
    const tNow = traceFrac * T_END;
    const xAt = (tt) => panelLeft + 12 + (tt / T_END) * (G.panelW - 24);
    // Underdamped: A·e^(-γt)·cos(ωt); critical: A·(1+γt)·e^(-γt); overdamped: A·e^(-γt)
    const A = G.panelH * 0.42;
    const yAt = (tt) => {
      let y;
      if (panel.id === 'under') {
        y = A * Math.exp(-panel.gamma * tt) * Math.cos(panel.omega * tt);
      } else if (panel.id === 'critical') {
        // Critically-damped released-from-rest: x(t) = A·(1 + γt)·e^(-γt)
        y = A * (1 + panel.gamma * tt) * Math.exp(-panel.gamma * tt);
      } else {
        // Overdamped released-from-rest, light overshoot avoided:
        // x(t) = A·(α₂·e^(-α₁ t) − α₁·e^(-α₂ t)) / (α₂ − α₁)
        const g = panel.gamma, w0 = panel.omega;
        const disc = Math.sqrt(g * g - w0 * w0);
        const a1 = g + disc, a2 = g - disc;
        y = A * (a2 * Math.exp(-a1 * tt) - a1 * Math.exp(-a2 * tt)) / (a2 - a1);
      }
      return panelMidY - y;
    };

    const parts = [];
    for (let i = 0; i <= visN; i++) {
      const tt = (i / N) * T_END;
      if (tt > tNow) break;
      const x = xAt(tt).toFixed(1);
      const y = yAt(tt).toFixed(1);
      parts.push(i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`);
    }
    return parts.join(' ');
  };

  const panelLayout = portrait
    ? PANELS.map((p, i) => ({
        ...p,
        left: (G.vbW - G.panelW) / 2,
        midY: G.topY + i * (G.panelH + G.gap) + G.panelH / 2,
      }))
    : PANELS.map((p, i) => ({
        ...p,
        left: (G.vbW - (3 * G.panelW + 2 * G.gap)) / 2 + i * (G.panelW + G.gap),
        midY: G.topY + G.panelH / 2,
      }));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {panelLayout.map((p) => {
          const path = buildPanelPath(p, p.left, p.midY);
          const baselineY = p.midY;
          return (
            <g key={p.id}>
              {/* Baseline */}
              <SvgFadeIn duration={0.4} delay={p.delay - 0.2}>
                <line x1={p.left + 12} y1={baselineY} x2={p.left + G.panelW - 12} y2={baselineY}
                      stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4"/>
              </SvgFadeIn>
              {/* Trace */}
              <path d={path}
                    fill="none" stroke={p.color} strokeWidth={2.5}
                    strokeLinecap="round" strokeLinejoin="round"/>
              {/* Label below the panel */}
              <SvgFadeIn duration={0.4} delay={p.delay - 0.1}>
                <text x={p.left + G.panelW / 2}
                      y={baselineY + G.panelH / 2 + 22}
                      textAnchor="middle"
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={12} letterSpacing="0.10em">
                  {p.label}
                </text>
              </SvgFadeIn>
            </g>
          );
        })}

        {/* Closing takeaway — serif italic across both aspects */}
        <SvgFadeIn duration={0.6} delay={5.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.captionFont} letterSpacing="0.01em">
            Damping never adds rhythm — it only steals amplitude.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
