// Newton's Law of Cooling: Exponential Approach — Manimo lesson scene.
// Chapter 4 of mat2b (Differensialligninger). A worked first-order linear
// ODE: the rate of cooling is proportional to the gap from ambient.
//
//   T'(t) = -k (T - T_a)     →     T(t) = T_a + (T_0 - T_a) e^(-k t)
//
// The geometry: a horizontal asymptote at T = T_a (ambient), and a family
// of exponential curves above and below it all closing in on the line.
// "Faster at first, slower later" is the characteristic shape of every
// "rate proportional to gap" system.
//
// Beats (placeholder timings — rewire-scene.js overwrites them):
//   0– 4.5   Manimo hook
//   4.5–14   The ODE — set the rate-proportional-to-gap law
//  14–24     Separate + integrate to get the exponential
//  24–31     The full solution formula
//  31–42     Three converging curves (GENUINE MOTION — value-driven trace)
//  42–47     Takeaway — pattern is universal
//
// Colour discipline:
//   chalk-200  axes
//   chalk-300  ambient asymptote (dashed), body captions
//   amber-400  warm initial-condition curve, primary payoff
//   amber-300  payoff formula
//   rose-400   hot coffee curve (and tracking dot)
//   teal-400   cold drink curve
//   violet-400 the ODE label

const SCENE_DURATION = 76;

const NARRATION = [
  /*  0.00– 4.50 */ 'A hot coffee cools fast at first, then slower and slower. One simple ODE captures all of that.',
  /*  4.50–14.00 */ "Newton said: the rate of change of temperature is proportional to how far you are from the room's temperature. T prime equals minus k times the quantity T minus T sub a. The bigger the gap, the faster the change.",
  /* 14.00–24.00 */ 'Separate variables: d T over T minus T sub a equals minus k d t. Integrate: log of the absolute gap equals minus k t plus a constant. Exponentiate and the gap becomes a decaying exponential.',
  /* 24.00–31.00 */ 'Apply the initial condition T of zero equals T sub zero. The constant A is just the starting gap. Add T sub a back and you have the full solution.',
  /* 31.00–42.00 */ 'Plot the cooling curves. Hot coffee falls fast at first, then levels off. A cold drink rises from below. The ambient line is the asymptote — every solution closes in on it, no matter where it started.',
  /* 42.00–47.00 */ 'Whenever the rate of change is proportional to a gap, you get exponential approach to equilibrium. Cooling, heating, charging, draining — same shape, different names.',
];

const NARRATION_AUDIO = 'audio/newtons-law-of-cooling/scene.mp3';

// ─── Plotting geometry (landscape defaults) ───────────────────────────────
// Plot window: t in [0, 8] minutes; T in [0, 100] °C.
const T_MIN = 0, T_MAX = 8;
const TEMP_MIN = 0, TEMP_MAX = 100;
const T_AMBIENT = 22;     // °C — the asymptote
const K_RATE = 0.45;      // cooling rate constant

function graphGeom(portrait) {
  return portrait
    // Portrait: graph above; readout panel sits to the right of the bottom-left
    // Manimo mascot so neither covers the other.
    ? { ox: 110, oy: 660, w: 540, h: 460,
        panelW: 500, panelLeft: 140, panelBottom: 96 }
    : { ox: 130, oy: 580, w: 680, h: 420,
        panelW: 400, panelRight: 56, panelTop: 180 };
}

// Map t (minutes) and T (°C) to svg coordinates.
function mapT(t, G) { return G.ox + (t - T_MIN) / (T_MAX - T_MIN) * G.w; }
function mapY(T, G) { return G.oy - (T - TEMP_MIN) / (TEMP_MAX - TEMP_MIN) * G.h; }

// Cooling-curve sample points up to t_end.
function coolingPoints(T0, t_end, G, samples = 100) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = T_MIN + (t_end - T_MIN) * (i / samples);
    const T = T_AMBIENT + (T0 - T_AMBIENT) * Math.exp(-K_RATE * t);
    pts.push({ sx: mapT(t, G), sy: mapY(T, G) });
  }
  return pts;
}

function ptsToPath(pts) {
  if (pts.length === 0) return '';
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.sx.toFixed(1)} ${p.sy.toFixed(1)}`).join(' ');
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
  return (
    <g>
      <line x1={G.ox} y1={G.oy} x2={G.ox + G.w} y2={G.oy}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      <line x1={G.ox} y1={G.oy} x2={G.ox} y2={G.oy - G.h}
            stroke="var(--chalk-200)" strokeWidth={1.8} strokeLinecap="round"/>
      {/* x label */}
      <text x={G.ox + G.w + 14} y={G.oy + 6}
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={20}>t</text>
      {/* y label */}
      <text x={G.ox - 14} y={G.oy - G.h - 8} textAnchor="end"
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={20}>T</text>
      {/* °C unit hint */}
      <text x={G.ox - 14} y={G.oy - G.h + 12} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={12} letterSpacing="0.1em">°C</text>
      {/* min unit hint */}
      <text x={G.ox + G.w} y={G.oy + 22} textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={12} letterSpacing="0.1em">min</text>
    </g>
  );
}

// ─── Scene ────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="first-order linear ODEs"
      title="Newton's Law of Cooling"
      duration={SCENE_DURATION}
      introEnd={7.11}
      introCaption="Why does the cooling slow down?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.11} end={21.75}>
        <OdeBeat/>
      </Sprite>

      <Sprite start={21.75} end={37.85}>
        <IntegrateBeat/>
      </Sprite>

      <Sprite start={37.85} end={49.27}>
        <FormulaBeat/>
      </Sprite>

      <Sprite start={49.27} end={63.94}>
        <CurvesBeat/>
      </Sprite>

      <Sprite start={63.94} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: introduce the ODE ────────────────────────────────────────────
// Layout: a small coffee-mug + thermometer pictogram on the left, formula on
// the right. The pictogram is built from primitive shapes; the steam waves
// gently to add a touch of motion.
function OdeBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();

  // Geometry per aspect.
  const G = portrait
    ? { mugCx: 200, mugCy: 360, mugW: 130, mugH: 110, handleX: 280, thermCx: 540, thermTop: 240, thermBot: 480,
        panelLeft: 140, panelBottom: 96, panelW: 500 }
    : { mugCx: 270, mugCy: 380, mugW: 150, mugH: 130, handleX: 360, thermCx: 580, thermTop: 220, thermBot: 520,
        panelRight: 56, panelTop: 180, panelW: 400 };

  // Steam wiggle: three wisps with subtle parallax.
  const w = Math.sin(localTime * 1.6);

  // Thermometer fill height (between bot and top) — animate from full down to ~mid as the talk continues.
  const fillProgress = clamp((localTime - 1.5) / 5.0, 0, 1);
  const fillY0 = G.thermBot - 16;          // top of bulb
  const fillY1 = G.thermTop + 28;          // max height
  const fillY = fillY0 + (fillY1 - fillY0) * (1 - fillProgress * 0.55);

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        {/* Coffee mug body — rounded rect */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          <rect x={G.mugCx - G.mugW / 2} y={G.mugCy - G.mugH / 2}
                width={G.mugW} height={G.mugH} rx={14}
                fill="rgba(244,184,96,0.18)"
                stroke="var(--amber-400)" strokeWidth={2.5}/>
          {/* Handle */}
          <path d={`M ${G.mugCx + G.mugW / 2} ${G.mugCy - G.mugH * 0.25}
                    Q ${G.handleX} ${G.mugCy - G.mugH * 0.25}, ${G.handleX} ${G.mugCy}
                    Q ${G.handleX} ${G.mugCy + G.mugH * 0.25}, ${G.mugCx + G.mugW / 2} ${G.mugCy + G.mugH * 0.25}`}
                fill="none" stroke="var(--amber-400)" strokeWidth={2.5}/>
          {/* Coffee surface line */}
          <line x1={G.mugCx - G.mugW * 0.4} y1={G.mugCy - G.mugH * 0.32}
                x2={G.mugCx + G.mugW * 0.4} y2={G.mugCy - G.mugH * 0.32}
                stroke="var(--amber-300)" strokeWidth={1.2} opacity={0.6}/>
          {/* Label "T" */}
          <text x={G.mugCx} y={G.mugCy + 8} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={26}>T</text>
        </SvgFadeIn>

        {/* Steam — three curved wisps */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          {[-30, 0, 30].map((dx, i) => {
            const wx = G.mugCx + dx + w * 4 * (i % 2 === 0 ? 1 : -1);
            const wy0 = G.mugCy - G.mugH / 2 - 4;
            const wy1 = wy0 - 60;
            return (
              <path key={i}
                    d={`M ${wx} ${wy0} Q ${wx + 8} ${(wy0 + wy1) / 2}, ${wx - 4} ${wy1}`}
                    fill="none" stroke="var(--chalk-300)"
                    strokeWidth={1.6} strokeLinecap="round" opacity={0.6}/>
            );
          })}
        </SvgFadeIn>

        {/* Room outline (dashed) — represents ambient */}
        <SvgFadeIn duration={0.5} delay={1.6}>
          <rect x={G.mugCx - G.mugW * 0.95} y={G.mugCy - G.mugH * 1.15}
                width={G.mugW * 1.9} height={G.mugH * 1.95}
                rx={18}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}
                strokeDasharray="6 6" opacity={0.55}/>
          <text x={G.mugCx - G.mugW * 0.92} y={G.mugCy + G.mugH * 1.04}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.1em">room: Tₐ = 22 °C</text>
        </SvgFadeIn>

        {/* Thermometer — vertical column with bulb */}
        <SvgFadeIn duration={0.5} delay={2.0}>
          {/* Glass tube */}
          <rect x={G.thermCx - 9} y={G.thermTop}
                width={18} height={G.thermBot - G.thermTop} rx={9}
                fill="rgba(232,220,193,0.05)"
                stroke="var(--chalk-200)" strokeWidth={1.6}/>
          {/* Bulb */}
          <circle cx={G.thermCx} cy={G.thermBot + 6} r={18}
                  fill="rgba(232,122,144,0.35)"
                  stroke="var(--rose-400)" strokeWidth={1.8}/>
          {/* Mercury fill */}
          <rect x={G.thermCx - 6} y={fillY}
                width={12} height={fillY0 - fillY + 2}
                fill="var(--rose-400)" rx={4}/>
          <circle cx={G.thermCx} cy={G.thermBot + 6} r={14}
                  fill="var(--rose-400)"/>
          {/* Ambient tick */}
          <line x1={G.thermCx + 12} y1={fillY1 + (fillY0 - fillY1) * 0.75}
                x2={G.thermCx + 28} y2={fillY1 + (fillY0 - fillY1) * 0.75}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.thermCx + 32} y={fillY1 + (fillY0 - fillY1) * 0.75 + 4}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">Tₐ</text>
        </SvgFadeIn>
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>
          <FadeUp duration={0.45} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            newton's law of cooling
          </FadeUp>
          <FadeUp duration={0.55} delay={1.6} distance={10}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 24, color: 'var(--violet-400)' }}>
            T′(t) = −k (T − Tₐ)
          </FadeUp>
          <FadeUp duration={0.5} delay={2.8} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            rate ∝ gap from ambient
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={1.4} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            newton's law of cooling
          </FadeUp>
          <FadeUp duration={0.6} delay={1.6} distance={12}
            style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 32, color: 'var(--violet-400)', marginTop: 4 }}>
            T′(t) = −k (T − Tₐ)
          </FadeUp>
          <FadeUp duration={0.5} delay={2.8} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-200)', maxWidth: '32ch', lineHeight: 1.4,
                     marginTop: 6 }}>
            rate of change ∝ gap from ambient
          </FadeUp>
          <FadeUp duration={0.5} delay={4.0} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 14,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            Larger gap → faster cooling. As T approaches Tₐ, the slope flattens.
          </FadeUp>
        </SoftPanel>
      )}
    </>
  );
}

// ─── Beat 3: separate + integrate ─────────────────────────────────────────
function IntegrateBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 26 : 32, letterSpacing: '0.02em',
    textAlign: 'center',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 26, maxWidth: portrait ? 620 : 'none',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        separate + integrate
      </FadeUp>

      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        dT⁄(T − Tₐ) = −k dt
      </FadeUp>

      <FadeUp duration={0.4} delay={1.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ∫
      </FadeUp>

      <FadeUp duration={0.5} delay={1.5} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        ln |T − Tₐ| = −k t + C₁
      </FadeUp>

      <FadeUp duration={0.4} delay={2.5} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        exp ⇒
      </FadeUp>

      <FadeUp duration={0.6} delay={3.0} distance={14}
        style={{
          ...stepStyle,
          fontSize: portrait ? 32 : 42,
          color: 'var(--chalk-100)',
        }}>
        T − Tₐ = A e<sup style={{ fontSize: '0.55em' }}>−kt</sup>
      </FadeUp>

      <FadeUp duration={0.5} delay={4.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '30ch' : '42ch', lineHeight: 1.4,
        }}>
        the gap shrinks exponentially
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: full solution formula ────────────────────────────────────────
function FormulaBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        apply T(0) = T₀
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 28, color: 'var(--chalk-200)',
        }}>
        A = T₀ − Tₐ
      </FadeUp>

      <FadeUp duration={0.7} delay={1.0} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 54, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: 4,
          whiteSpace: 'nowrap',
        }}>
        T(t) = Tₐ + (T₀ − Tₐ) e<sup style={{ fontSize: '0.55em' }}>−kt</sup>
      </FadeUp>

      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '30ch' : '46ch', lineHeight: 1.4,
        }}>
          ambient + (initial gap) × exponential decay
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: three curves converging — GENUINE MOTION ─────────────────────
// Three solution curves trace in synchronously over the first ~7 s. A live
// "now" dot rides the hot-coffee curve; a small readout panel shows the
// current temperature and the shrinking gap.
function CurvesBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = graphGeom(portrait);

  // Trace progresses with localTime: the visible portion of each curve
  // extends from t=0 to t=tEnd(localTime).
  const traceDur = 7.0;
  const traceStart = 0.6;
  const traceFrac = clamp((localTime - traceStart) / traceDur, 0, 1);
  const eased = Easing.easeInOutCubic(traceFrac);
  const tEnd = T_MIN + (T_MAX - T_MIN) * eased;

  // Three initial conditions.
  const hot  = coolingPoints(90, tEnd, G);
  const warm = coolingPoints(50, tEnd, G);
  const cold = coolingPoints(4,  tEnd, G);

  const hotPath  = ptsToPath(hot);
  const warmPath = ptsToPath(warm);
  const coldPath = ptsToPath(cold);

  // Live "now" markers at the tip of each curve.
  const hotTip  = hot.length  ? hot[hot.length - 1]  : null;
  const warmTip = warm.length ? warm[warm.length - 1] : null;
  const coldTip = cold.length ? cold[cold.length - 1] : null;

  // For the readout we report the hot-coffee curve's current T.
  const t_now = tEnd;
  const T_now = T_AMBIENT + (90 - T_AMBIENT) * Math.exp(-K_RATE * t_now);
  const gap = T_now - T_AMBIENT;

  // Asymptote line endpoints in svg coords.
  const ambStart = { sx: mapT(0, G),     sy: mapY(T_AMBIENT, G) };
  const ambEnd   = { sx: mapT(T_MAX, G), sy: mapY(T_AMBIENT, G) };

  return (
    <>
      <svg style={{ position: 'absolute', left: 0, top: 0 }}
           width={1280} height={720} viewBox="0 0 1280 720">
        <Axes G={G}/>

        {/* Ambient asymptote — dashed chalk */}
        <line x1={ambStart.sx} y1={ambStart.sy} x2={ambEnd.sx} y2={ambEnd.sy}
              stroke="var(--chalk-300)" strokeWidth={1.6}
              strokeDasharray="6 6" opacity={0.7}/>
        <text x={ambEnd.sx + 8} y={ambEnd.sy + 4}
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={12} letterSpacing="0.08em">Tₐ = 22°</text>

        {/* Three traced curves */}
        {hot.length > 1 && (
          <path d={hotPath} fill="none" stroke="var(--rose-400)"
                strokeWidth={3.2} strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {warm.length > 1 && (
          <path d={warmPath} fill="none" stroke="var(--amber-400)"
                strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"/>
        )}
        {cold.length > 1 && (
          <path d={coldPath} fill="none" stroke="var(--teal-400)"
                strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Initial-condition labels at t=0 */}
        {tEnd > 0.2 && (
          <g>
            <circle cx={mapT(0, G)} cy={mapY(90, G)} r={4.5}
                    fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
            <text x={mapT(0, G) - 12} y={mapY(90, G) - 6} textAnchor="end"
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={13}>90°</text>
            <circle cx={mapT(0, G)} cy={mapY(50, G)} r={4}
                    fill="var(--amber-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
            <text x={mapT(0, G) - 12} y={mapY(50, G) + 4} textAnchor="end"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={13}>50°</text>
            <circle cx={mapT(0, G)} cy={mapY(4, G)} r={4}
                    fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
            <text x={mapT(0, G) - 12} y={mapY(4, G) + 8} textAnchor="end"
                  fill="var(--teal-400)" fontFamily="var(--font-mono)"
                  fontSize={13}>4°</text>
          </g>
        )}

        {/* Now-marker on the hot-coffee curve */}
        {hotTip && (
          <circle cx={hotTip.sx} cy={hotTip.sy} r={6}
                  fill="var(--rose-400)" stroke="var(--chalk-100)" strokeWidth={1.4}/>
        )}
        {warmTip && (
          <circle cx={warmTip.sx} cy={warmTip.sy} r={4.5}
                  fill="var(--amber-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
        )}
        {coldTip && (
          <circle cx={coldTip.sx} cy={coldTip.sy} r={4.5}
                  fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1}/>
        )}
      </svg>

      {portrait ? (
        <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            three starting points
          </FadeUp>
          <FadeUp duration={0.5} delay={0.6} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--rose-300)', letterSpacing: '0.04em' }}>
            hot coffee: T₀ = 90° → {T_now.toFixed(1)}°
          </FadeUp>
          <FadeUp duration={0.5} delay={0.8} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 13,
                     color: 'var(--chalk-200)', letterSpacing: '0.04em' }}>
            gap = {gap.toFixed(1)}°
          </FadeUp>
          <FadeUp duration={0.5} delay={3.5} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                     color: 'var(--chalk-300)', maxWidth: '34ch', lineHeight: 1.4 }}>
            All three close in on Tₐ.
          </FadeUp>
        </SoftPanel>
      ) : (
        <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>
          <FadeUp duration={0.45} delay={0.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            three starting points
          </FadeUp>
          <FadeUp duration={0.5} delay={0.6} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 15,
                     color: 'var(--rose-300)', letterSpacing: '0.04em',
                     marginTop: 4 }}>
            hot coffee: 90° → {T_now.toFixed(1)}°
          </FadeUp>
          <FadeUp duration={0.5} delay={0.9} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--amber-300)', letterSpacing: '0.04em' }}>
            warm room: 50° → {(T_AMBIENT + (50 - T_AMBIENT) * Math.exp(-K_RATE * t_now)).toFixed(1)}°
          </FadeUp>
          <FadeUp duration={0.5} delay={1.2} distance={8}
            style={{ fontFamily: 'var(--font-mono)', fontSize: 14,
                     color: 'var(--teal-400)', letterSpacing: '0.04em' }}>
            cold drink: 4° → {(T_AMBIENT + (4 - T_AMBIENT) * Math.exp(-K_RATE * t_now)).toFixed(1)}°
          </FadeUp>
          <FadeUp duration={0.5} delay={3.5} distance={8}
            style={{ fontFamily: 'var(--font-sans)', fontSize: 15,
                     color: 'var(--chalk-300)', maxWidth: '32ch', lineHeight: 1.4,
                     marginTop: 8 }}>
            All three close in on Tₐ — different speeds, same asymptote.
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
        the universal shape
      </FadeUp>

      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 44, color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '42ch', lineHeight: 1.25,
        }}>
        rate ∝ gap → <span style={{ color: 'var(--amber-300)' }}>exponential approach to equilibrium</span>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 16,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          maxWidth: portrait ? '30ch' : '50ch', textAlign: 'center',
          lineHeight: 1.4, marginTop: 8,
        }}>
        same shape: cooling, heating, charging a capacitor, draining a tank
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
