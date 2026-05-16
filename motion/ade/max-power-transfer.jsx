// Maximum Power Transfer: Match the Load to the Source — Manimo lesson scene.
// A source with internal resistance R_s drives a load R_L. P_L = V_s²·R_L/(R_s+R_L)²
// is zero at both endpoints (R_L=0 short-circuits the load voltage; R_L=∞ kills
// the current) and peaks at R_L = R_s with P_max = V_s²/(4R_s). Genuine motion
// lives in Beat 3: an R_L slider sweeps from 0 to 4R_s and a marker traces the
// power curve in real time.
//
// Beats (timed to single-track narration in motion/ade/audio/max-power-transfer/):
//    0.00– 5.00  Manimo enters; hook
//    5.00–14.00  Circuit: V_s + R_s feeding R_L; I and P_L formulas
//   14.00–27.00  Power-vs-R_L curve traces as R_L slider sweeps
//   27.00–38.00  R_L = R_s payoff; P_max = V_s²/(4R_s); 50% efficiency
//   38.00–46.00  Takeaway: matching maximises power, not efficiency.

const SCENE_DURATION = 61;

const NARRATION = [
  /*  0.00– 5.00 */ 'What load pulls the most power out of a source?',
  /*  5.00–14.00 */ 'A real source has an internal resistance R sub s. The current through any load R sub L equals V sub s divided by R sub s plus R sub L. The power delivered into the load is I squared times R sub L.',
  /* 14.00–27.00 */ 'Sweep the load from very small to very large. With a tiny load, the current is huge but the load voltage is nearly zero — almost no power. With a huge load, the voltage is full but the current is nearly zero — also almost no power. The peak sits in the middle.',
  /* 27.00–38.00 */ 'At the peak the load equals R sub s, and the delivered power is V sub s squared over four R sub s. Half the source energy goes to the load, half is wasted in R sub s — fifty percent efficiency at maximum power transfer.',
  /* 38.00–46.00 */ 'Match the load when you want maximum power — useful for antennas and signal receivers, wasteful for power distribution.',
];

const NARRATION_AUDIO = 'audio/max-power-transfer/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="energy and power"
      title="Maximum Power Transfer"
      duration={SCENE_DURATION}
      introEnd={3.12}
      introCaption="What load pulls the most power out of a source?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={3.12} end={19.71}>
        <CircuitSetupBeat />
      </Sprite>

      <Sprite start={19.71} end={36.39}>
        <SweepBeat />
      </Sprite>

      <Sprite start={36.39} end={52.45}>
        <MatchedFormulaBeat />
      </Sprite>

      <Sprite start={52.45} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Circuit setup ───────────────────────────────────────────────
function CircuitSetupBeat() {
  const portrait = usePortrait();

  // Geometry: source(V_s) + R_s on left, terminals, R_L on right with arrow
  // making it a variable resistor.
  const G = portrait
    ? { vbW: 600, vbH: 580, srcX: 130, srcY: 220,
        rsX: 280, rsY: 220, rsW: 70, rsH: 30,
        termX: 420, termTopY: 180, termBotY: 320,
        rlX: 480, rlY: 240, rlW: 56, rlH: 90,
        formulaY1: 400, formulaY2: 470,
        fontFormula: 24, captionY: 540 }
    : { vbW: 1000, vbH: 460, srcX: 180, srcY: 220,
        rsX: 360, rsY: 220, rsW: 90, rsH: 36,
        termX: 540, termTopY: 170, termBotY: 280,
        rlX: 620, rlY: 240, rlW: 70, rlH: 110,
        formulaY1: 380, formulaY2: 420,
        fontFormula: 26, captionY: 0 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* V_s — battery */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.srcX - 14} y1={G.srcY - 10} x2={G.srcX + 14} y2={G.srcY - 10}
                stroke="var(--chalk-100)" strokeWidth={3} strokeLinecap="round"/>
          <line x1={G.srcX - 7}  y1={G.srcY + 10} x2={G.srcX + 7}  y2={G.srcY + 10}
                stroke="var(--chalk-100)" strokeWidth={3} strokeLinecap="round"/>
          <text x={G.srcX - 26} y={G.srcY - 4} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>V<tspan baselineShift="sub" fontSize="0.7em">s</tspan></text>
        </SvgFadeIn>

        {/* Wires: V_s top → R_s left; R_s right → top terminal; bottom return
            from bottom terminal → V_s−. */}
        <TraceIn d={`M ${G.srcX + 14} ${G.srcY - 10} L ${G.srcX + 28} ${G.srcY - 10} L ${G.srcX + 28} ${G.rsY - G.rsH / 2} L ${G.rsX} ${G.rsY - G.rsH / 2}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.3}/>
        <TraceIn d={`M ${G.rsX + G.rsW} ${G.rsY - G.rsH / 2} L ${G.termX} ${G.rsY - G.rsH / 2} L ${G.termX} ${G.termTopY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.7}/>
        <TraceIn d={`M ${G.srcX + 7} ${G.srcY + 10} L ${G.srcX + 28} ${G.srcY + 10} L ${G.srcX + 28} ${G.termBotY} L ${G.termX} ${G.termBotY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.5} delay={0.9}/>

        {/* R_s box */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <rect x={G.rsX} y={G.rsY - G.rsH / 2}
                width={G.rsW} height={G.rsH}
                fill="none" stroke="var(--amber-400)" strokeWidth={2.2}
                rx={2}/>
          <text x={G.rsX + G.rsW / 2} y={G.rsY - G.rsH / 2 - 8} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>R<tspan baselineShift="sub" fontSize="0.7em">s</tspan></text>
        </SvgFadeIn>

        {/* Terminal dots */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <circle cx={G.termX} cy={G.termTopY} r={4} fill="var(--chalk-100)"/>
          <circle cx={G.termX} cy={G.termBotY} r={4} fill="var(--chalk-100)"/>
        </SvgFadeIn>

        {/* R_L — variable resistor (rect + diagonal arrow through it) */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <rect x={G.rlX} y={G.rlY - G.rlH / 2 + 10}
                width={G.rlW} height={G.rlH - 20}
                fill="none" stroke="var(--rose-400)" strokeWidth={2.2}
                rx={2}/>
          {/* Arrow through box */}
          <line x1={G.rlX - 6} y1={G.rlY + G.rlH / 2 - 4}
                x2={G.rlX + G.rlW + 6} y2={G.rlY - G.rlH / 2 + 4}
                stroke="var(--rose-300)" strokeWidth={1.6}/>
          <path d={`M ${G.rlX + G.rlW + 6} ${G.rlY - G.rlH / 2 + 4}
                    L ${G.rlX + G.rlW - 2} ${G.rlY - G.rlH / 2 + 2}
                    L ${G.rlX + G.rlW + 2} ${G.rlY - G.rlH / 2 + 12} Z`}
                fill="var(--rose-300)"/>
          <text x={G.rlX + G.rlW + 18} y={G.rlY + 6}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>R<tspan baselineShift="sub" fontSize="0.7em">L</tspan></text>
          {/* Wires from terminals to R_L */}
          <line x1={G.termX} y1={G.termTopY}
                x2={G.rlX + G.rlW / 2} y2={G.termTopY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.rlX + G.rlW / 2} y1={G.termTopY}
                x2={G.rlX + G.rlW / 2} y2={G.rlY - G.rlH / 2 + 10}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.termX} y1={G.termBotY}
                x2={G.rlX + G.rlW / 2} y2={G.termBotY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.rlX + G.rlW / 2} y1={G.termBotY}
                x2={G.rlX + G.rlW / 2} y2={G.rlY + G.rlH / 2 - 10}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Formulas */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <text x={G.vbW / 2} y={G.formulaY1} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            I = V<tspan baselineShift="sub" fontSize="0.7em">s</tspan> / (R<tspan baselineShift="sub" fontSize="0.7em">s</tspan> + R<tspan baselineShift="sub" fontSize="0.7em">L</tspan>)
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.formulaY2} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula + 4}>
            P<tspan baselineShift="sub" fontSize="0.7em">L</tspan> = I² · R<tspan baselineShift="sub" fontSize="0.7em">L</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Sweep R_L and trace P_L curve ──────────────────────────────
// Genuine motion: parameter sweep. R_L slider moves left-to-right and a
// marker on the P_L vs R_L curve follows. The curve itself reveals
// progressively up to the slider position. Peak emerges visually at R_L = R_s.
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700, gx: 100, gy: 110, gw: 420, gh: 360,
        sliderY: 540, sliderW: 420, sliderTickH: 12,
        fontAxis: 18, captionY: 660 }
    : { vbW: 1100, vbH: 480, gx: 160, gy: 60, gw: 720, gh: 320,
        sliderY: 440, sliderW: 720, sliderTickH: 14,
        fontAxis: 18, captionY: 460 };

  const ax0 = G.gx, ay0 = G.gy + G.gh;
  const axEnd = G.gx + G.gw;
  const ayEnd = G.gy;

  // Sweep R_L from 0 to 4·R_s. The peak (R_L = R_s) sits 1/4 of the way along.
  const RL_MAX = 4; // in units of R_s
  const peakFrac = 1 / RL_MAX;
  const peakX = ax0 + peakFrac * (axEnd - ax0);

  // Curve sample: P_L_norm(r) = 4r / (1+r)² scaled to peak at 1.0 when r=1.
  function pNorm(r) { return (4 * r) / Math.pow(1 + r, 2); }
  const SAMPLES = 100;
  const sampleXs = [], sampleYs = [];
  for (let s = 0; s <= SAMPLES; s++) {
    const r = (s / SAMPLES) * RL_MAX;
    const x = ax0 + (s / SAMPLES) * (axEnd - ax0);
    const y = ay0 - pNorm(r) * (ay0 - ayEnd) * 0.92; // 0.92 keeps a tiny top margin
    sampleXs.push(x); sampleYs.push(y);
  }

  // Slider sweep: 0 → 1 in seconds 1.5 → 8.5.
  const SLIDE_START = 1.5;
  const SLIDE_END = 8.5;
  const u = clamp((localTime - SLIDE_START) / (SLIDE_END - SLIDE_START), 0, 1);

  // The slider does a "tour": fast through the small-R region, slows around
  // the peak, then continues to the far end. ease-in-out keeps eye tracking
  // comfortable.
  const eased = Easing.easeInOutCubic(u);
  const sliderIdx = Math.floor(eased * SAMPLES);
  const sliderX = sampleXs[sliderIdx];
  const sliderRy = sampleYs[sliderIdx];

  // Curve path: full curve as a thin baseline, with the "revealed" portion
  // drawn in amber. This way the audience sees both the shape and the
  // progress without a TraceIn (which would not respect the eased slider).
  const fullD = sampleXs.map((x, k) => (k === 0 ? `M ${x} ${sampleYs[k]}` : `L ${x} ${sampleYs[k]}`)).join(' ');
  const traceD = sampleXs.slice(0, sliderIdx + 1)
    .map((x, k) => (k === 0 ? `M ${x} ${sampleYs[k]}` : `L ${x} ${sampleYs[k]}`)).join(' ');

  // Slider lane below the graph: tick at peak.
  const laneLeftX = ax0;
  const laneRightX = axEnd;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <TraceIn d={`M ${ax0} ${ayEnd} L ${ax0} ${ay0} L ${axEnd} ${ay0}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.8} delay={0.0}/>

        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={axEnd + 18} y={ay0 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>R<tspan baselineShift="sub" fontSize="0.7em">L</tspan></text>
          <text x={ax0 - 14} y={ayEnd - 4} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>P<tspan baselineShift="sub" fontSize="0.7em">L</tspan></text>
          {/* R_s tick + label */}
          <line x1={peakX} y1={ay0} x2={peakX} y2={ay0 + 6}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={peakX} y={ay0 + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.08em">R_s</text>
        </SvgFadeIn>

        {/* Light backdrop curve */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <path d={fullD} fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                opacity={0.35}/>
        </SvgFadeIn>

        {/* Revealed portion in amber */}
        {sliderIdx > 0 && (
          <path d={traceD} fill="none" stroke="var(--amber-400)" strokeWidth={2.6}/>
        )}

        {/* Moving marker on the curve */}
        {u > 0 && (
          <g>
            <line x1={sliderX} y1={sliderRy} x2={sliderX} y2={ay0}
                  stroke="var(--rose-300)" strokeWidth={1.2}
                  strokeDasharray="3 4" opacity={0.7}/>
            <circle cx={sliderX} cy={sliderRy} r={5}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1}/>
          </g>
        )}

        {/* Slider lane and knob below the graph */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <line x1={laneLeftX} y1={G.sliderY} x2={laneRightX} y2={G.sliderY}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <line x1={peakX} y1={G.sliderY - G.sliderTickH / 2}
                x2={peakX} y2={G.sliderY + G.sliderTickH / 2}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          <text x={peakX} y={G.sliderY + G.sliderTickH / 2 + 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.08em">R_L = R_s</text>
        </SvgFadeIn>
        {u > 0 && (
          <g>
            <circle cx={sliderX} cy={G.sliderY} r={7}
                    fill="var(--rose-400)" stroke="var(--rose-300)" strokeWidth={1.5}/>
            <line x1={sliderX} y1={G.sliderY - 18}
                  x2={sliderX} y2={G.sliderY - 6}
                  stroke="var(--rose-300)" strokeWidth={1.4}/>
          </g>
        )}

        {/* Peak callout — fades in once the slider passes the peak */}
        {u > 0.32 && (
          <g style={{ opacity: clamp((u - 0.32) / 0.1, 0, 1) }}>
            <line x1={peakX} y1={ay0} x2={peakX} y2={sampleYs[Math.floor(SAMPLES * peakFrac)]}
                  stroke="var(--amber-300)" strokeWidth={1.2}
                  strokeDasharray="4 4" opacity={0.55}/>
            <text x={peakX + 8} y={sampleYs[Math.floor(SAMPLES * peakFrac)] - 8}
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={12} letterSpacing="0.08em">peak</text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={9.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the peak sits where the load matches the source
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Matched-load payoff ─────────────────────────────────────────
function MatchedFormulaBeat() {
  const portrait = usePortrait();

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        at the peak
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 44 : 56, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        R<sub style={{ fontSize: '0.6em' }}>L</sub> = R<sub style={{ fontSize: '0.6em' }}>s</sub>
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 50, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        P<sub style={{ fontSize: '0.6em' }}>max</sub> = V<sub style={{ fontSize: '0.6em' }}>s</sub>² / (4 R<sub style={{ fontSize: '0.6em' }}>s</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 17,
          color: 'var(--chalk-100)',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
          letterSpacing: '0.02em', marginTop: 8,
        }}>
        efficiency at the peak: fifty percent
      </FadeUp>

      <FadeUp duration={0.5} delay={4.8} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.1em',
          textAlign: 'center', maxWidth: portrait ? '40ch' : 'none',
        }}>
        half the source energy heats R_s
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Matching maximises power, not efficiency.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '34ch' : 'none',
        }}>
        (great for receivers, terrible for the grid)
      </FadeUp>
    </div>
  );
}

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
