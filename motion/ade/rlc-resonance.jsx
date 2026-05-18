// RLC Resonance: Where the Reactances Cancel — Manimo lesson scene.
//
// Series R-L-C driven by V₀ cos(ωt). The magnitude of the loop current is
//   |I(ω)| = V₀ / √(R² + (ωL − 1/ωC)²)
// peaking at ω₀ = 1/√(LC). Beat 3 (genuine animation): a frequency cursor
// sweeps left-to-right across the ω-axis, the |I| curve traces in
// synchronously, and the peak marker latches once the cursor crosses ω₀.
// Beat 4 follows up with three phasor diagrams — below, at, and above
// resonance — showing how V_L and V_C cancel exactly at f₀.
//
// Beats (placeholder timings — rewire-scene.js overwrites once audio exists):
//    0.00– 5.00  Manimo enters; hook
//    5.00–14.00  Series RLC circuit + impedance formula
//   14.00–28.00  Frequency sweep: |I| curve traces, peak marks at ω₀
//   28.00–44.00  Three phasor diagrams: below, at, above resonance
//   44.00–54.00  Takeaway
//
// Authoring notes:
//   • Beat 3 uses useSprite() localTime to drive the cursor + live trace.
//   • Beat 4 derives V_L/V_C lengths from ω/ω₀ ratios so the phasor
//     diagrams are physically meaningful, not decorative.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM.

const SCENE_DURATION = 54;

const NARRATION = [
  /*  0.00– 5.00 */ 'Why does a tiny tuning capacitor pick out exactly one radio station from the noise of all of them at once?',
  /*  5.00–14.00 */ 'A series circuit with a resistor, an inductor, and a capacitor, driven by an AC source. Tune the source frequency, and watch the current.',
  /* 14.00–28.00 */ 'Sweep the frequency from low to high. The current is tiny at the extremes — at low omega the capacitor blocks it, at high omega the inductor does — and peaks where the two reactances exactly cancel. That sweet spot is the resonant frequency.',
  /* 28.00–44.00 */ 'At resonance, the voltages across the inductor and capacitor are equal in size but pointed opposite ways. They cancel — leaving the resistor alone to set the current, so the impedance collapses to just R.',
  /* 44.00–54.00 */ 'Resonance is the heart of every tuner. Pick L and C to land the peak where you want — and that one frequency wins.',
];

const NARRATION_AUDIO = 'audio/rlc-resonance/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="frequency response"
      title="RLC Resonance: Where the Reactances Cancel"
      duration={SCENE_DURATION}
      introEnd={6.5}
      introCaption="One frequency, all the rest hushed."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.5} end={15.85}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={15.85} end={31.85}>
        <SweepBeat />
      </Sprite>

      <Sprite start={31.85} end={45.15}>
        <PhasorsBeat />
      </Sprite>

      <Sprite start={45.15} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Series RLC circuit ────────────────────────────────────────────
// Rectangular loop. AC source on the left vertical (circle with sine glyph).
// R on the top wire. L and C in series on the right vertical, L on top.
function CircuitBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 700, left: 130, right: 480, top: 130, bot: 580,
        srcR: 32, fontLabel: 20, fontFormula: 22, formulaY: 640 }
    : { vbW: 880, vbH: 420, left: 200, right: 660, top: 80, bot: 340,
        srcR: 32, fontLabel: 20, fontFormula: 22, formulaY: 400 };

  const midY = (G.top + G.bot) / 2;
  // R on top wire — small section in the middle.
  const rTopL = G.left + (G.right - G.left) * 0.35;
  const rTopR = G.left + (G.right - G.left) * 0.65;
  // Right vertical: split into L (upper) and C (lower)
  const rightMidY = midY;
  const lTop = G.top + 30;
  const lBot = rightMidY - 30;
  const cTop = rightMidY + 30;
  const cBot = G.bot - 30;

  // Inductor coil (cubic-bezier humps bulging right)
  const coilN = 4;
  const coilStep = (lBot - lTop) / coilN;
  const coilR = 18;
  const coilD = (() => {
    const parts = [`M ${G.right} ${lTop}`];
    for (let i = 0; i < coilN; i++) {
      const yA = lTop + i * coilStep;
      const yB = lTop + (i + 1) * coilStep;
      const cx = G.right + coilR;
      const cy1 = yA + coilStep * 0.15;
      const cy2 = yB - coilStep * 0.15;
      parts.push(`C ${cx} ${cy1.toFixed(2)} ${cx} ${cy2.toFixed(2)} ${G.right} ${yB.toFixed(2)}`);
    }
    return parts.join(' ');
  })();

  // Capacitor: two short horizontal plates with a small gap.
  const capGap = 8;
  const capMidY = (cTop + cBot) / 2;
  const capPlateW = 28;

  // Resistor zigzag on top wire
  const resN = 6;
  const resDX = (rTopR - rTopL) / resN;
  const resAmp = 14;
  const resPts = [`M ${rTopL} ${G.top}`];
  for (let i = 1; i < resN; i++) {
    const xc = rTopL + i * resDX;
    const yc = G.top + (i % 2 === 1 ? -resAmp : resAmp);
    resPts.push(`L ${xc.toFixed(1)} ${yc}`);
  }
  resPts.push(`L ${rTopR} ${G.top}`);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Left vertical wire — split around source */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.left} y1={G.top} x2={G.left} y2={midY - G.srcR}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.left} y1={midY + G.srcR} x2={G.left} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* AC source: circle with sine wave glyph */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          <circle cx={G.left} cy={midY} r={G.srcR}
                  fill="none" stroke="var(--amber-300)" strokeWidth={2.5}/>
          <path d={`M ${G.left - 16} ${midY} Q ${G.left - 8} ${midY - 10} ${G.left} ${midY} T ${G.left + 16} ${midY}`}
                fill="none" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.left - G.srcR - 14} y={midY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            e(t)
          </text>
        </SvgFadeIn>

        {/* Top wire (split around R) */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.left} y1={G.top} x2={rTopL} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={rTopR} y1={G.top} x2={G.right} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* R */}
        <SvgFadeIn duration={0.5} delay={0.5}>
          <path d={resPts.join(' ')} fill="none"
                stroke="var(--amber-400)" strokeWidth={2.4}/>
          <text x={(rTopL + rTopR) / 2} y={G.top - 22} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>R</text>
        </SvgFadeIn>

        {/* Right vertical: split for L (upper) and C (lower) */}
        <SvgFadeIn duration={0.4} delay={0.7}>
          <line x1={G.right} y1={G.top} x2={G.right} y2={lTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={lBot} x2={G.right} y2={cTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={cBot} x2={G.right} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* L (inductor coil) */}
        <SvgFadeIn duration={0.5} delay={0.8}>
          <path d={coilD} fill="none" stroke="var(--amber-400)" strokeWidth={2.6}/>
          <text x={G.right - coilR - 14} y={(lTop + lBot) / 2 + 5} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>L</text>
        </SvgFadeIn>

        {/* C (two plates) */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <line x1={G.right - capPlateW} y1={capMidY - capGap / 2}
                x2={G.right + capPlateW} y2={capMidY - capGap / 2}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.right - capPlateW} y1={capMidY + capGap / 2}
                x2={G.right + capPlateW} y2={capMidY + capGap / 2}
                stroke="var(--amber-300)" strokeWidth={3}/>
          {/* connecting wires through capacitor */}
          <line x1={G.right} y1={cTop} x2={G.right} y2={capMidY - capGap / 2}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={capMidY + capGap / 2} x2={G.right} y2={cBot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={G.right + capPlateW + 16} y={capMidY + 5} textAnchor="start"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>C</text>
        </SvgFadeIn>

        {/* Bottom wire */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.left} y1={G.bot} x2={G.right} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Impedance formula */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            Z = R + j(ωL − 1/ωC)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Frequency sweep — |I(ω)| traces in as cursor sweeps ───────────
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Sweep window
  const sweepStart = 1.0;
  const sweepEnd = 10.0;
  const sweepFrac = clamp((localTime - sweepStart) / (sweepEnd - sweepStart), 0, 1);

  // Frequency axis: ω/ω₀ in log-like spread from 0.3 to 3.0.
  // We'll use linear mapping in log-space so the peak sits visually centred.
  const omegaMinL = Math.log(0.3);
  const omegaMaxL = Math.log(3.0);
  function f2x(f, gx0, gx1) {
    const t = (Math.log(f) - omegaMinL) / (omegaMaxL - omegaMinL);
    return gx0 + t * (gx1 - gx0);
  }
  // |I| / (V₀/R) = 1 / √(1 + Q²·(x − 1/x)²) where x = ω/ω₀ and we pick Q=4
  // for a nice visible peak that isn't razor-thin.
  const Q = 4;
  function iMag(x) {
    const dev = x - 1 / x;
    return 1 / Math.sqrt(1 + Q * Q * dev * dev);
  }

  const G = portrait
    ? { vbW: 600, vbH: 880, gx0: 80, gx1: 540, gy0: 130, gy1: 740,
        fontAxis: 14, fontTick: 11, fontFormula: 22, fontLegend: 13,
        formulaY: 830 }
    : { vbW: 1100, vbH: 460, gx0: 130, gx1: 970, gy0: 80, gy1: 360,
        fontAxis: 14, fontTick: 12, fontFormula: 24, fontLegend: 13,
        formulaY: 430 };

  const gw = G.gx1 - G.gx0;
  const gh = G.gy1 - G.gy0;

  // Live trace up to sweepFrac of the x-range.
  const samples = 110;
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    if (t > sweepFrac) break;
    const f = Math.exp(omegaMinL + t * (omegaMaxL - omegaMinL));
    const m = iMag(f);
    pts.push(`${G.gx0 + t * gw},${G.gy1 - m * gh}`);
  }

  // Current cursor position in chart coordinates.
  const cursorT = sweepFrac;
  const cursorF = Math.exp(omegaMinL + cursorT * (omegaMaxL - omegaMinL));
  const cursorX = G.gx0 + cursorT * gw;
  const cursorY = G.gy1 - iMag(cursorF) * gh;

  // ω₀ marker x-position (where ω/ω₀ = 1).
  const omega0X = f2x(1, G.gx0, G.gx1);
  const omega0Y = G.gy1 - 1.0 * gh;
  const crossedPeak = cursorT > (Math.log(1) - omegaMinL) / (omegaMaxL - omegaMinL);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.gx0} y1={G.gy1} x2={G.gx1} y2={G.gy1}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx0} y2={G.gy1}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.gx1 + 14} y={G.gy1 + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>ω</text>
          <text x={G.gx0 - 10} y={G.gy0 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontTick}>V/R</text>
          <text x={G.gx0 - 10} y={G.gy1 + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontTick}>0</text>
        </SvgFadeIn>

        {/* Asymptote dashed line at top */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.gx0} y1={G.gy0} x2={G.gx1} y2={G.gy0}
                stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="5 5" opacity={0.35}/>
        </SvgFadeIn>

        {/* ω₀ vertical reference — drawn dim until cursor crosses it */}
        <line x1={omega0X} y1={G.gy0} x2={omega0X} y2={G.gy1}
              stroke="var(--rose-400)" strokeWidth={1.2}
              strokeDasharray="4 4"
              opacity={crossedPeak ? 0.55 : 0.18}/>
        <text x={omega0X} y={G.gy1 + 22} textAnchor="middle"
              fill="var(--rose-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.fontAxis}
              opacity={crossedPeak ? 1 : 0.4}>
          ω<tspan baselineShift="sub" fontSize={G.fontAxis * 0.65}>0</tspan>
        </text>

        {/* Live |I| curve */}
        {pts.length > 1 && (
          <polyline points={pts.join(' ')} fill="none"
                    stroke="var(--amber-400)" strokeWidth={2.6}
                    strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Cursor + dot on curve */}
        {localTime >= sweepStart && (
          <g>
            <line x1={cursorX} y1={G.gy0} x2={cursorX} y2={G.gy1}
                  stroke="var(--chalk-200)" strokeWidth={1}
                  strokeDasharray="3 3" opacity={0.5}/>
            <circle cx={cursorX} cy={cursorY} r={5}
                    fill="var(--amber-400)"
                    stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          </g>
        )}

        {/* Peak marker latches once cursor passes ω₀ */}
        {crossedPeak && (
          <SvgFadeIn duration={0.4} delay={0}>
            <circle cx={omega0X} cy={omega0Y} r={6}
                    fill="var(--rose-400)"
                    stroke="var(--bg-canvas)" strokeWidth={1.5}/>
            <text x={omega0X + 14} y={omega0Y + 4}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={G.fontLegend}>
              |I|_peak = V/R
            </text>
          </SvgFadeIn>
        )}

        {/* Region labels (capacitive, resistive, inductive) */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.gx0 + gw * 0.15} y={G.gy1 + 38} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontTick} letterSpacing="0.08em">
            CAPACITIVE
          </text>
          <text x={G.gx1 - gw * 0.15} y={G.gy1 + 38} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontTick} letterSpacing="0.08em">
            INDUCTIVE
          </text>
        </SvgFadeIn>

        {/* Resonance formula appears once curve is drawn */}
        <SvgFadeIn duration={0.5} delay={10.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            f<tspan baselineShift="sub" fontSize={G.fontFormula * 0.6}>0</tspan> = 1 / (2π√(LC))
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Three phasor diagrams (below, at, above resonance) ────────────
function PhasorsBeat() {
  const portrait = usePortrait();
  const headerStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 11,
    letterSpacing: '0.14em', textTransform: 'uppercase',
    color: 'var(--chalk-300)',
  };
  const noteStyle = {
    fontFamily: 'var(--font-sans)', fontSize: portrait ? 11 : 12,
    color: 'var(--chalk-300)', textAlign: 'center', lineHeight: 1.3,
    maxWidth: portrait ? '16ch' : '18ch',
  };

  // Each phasor block: V_R always points right (reference). V_L points UP
  // with length proportional to X_L = ω/ω₀. V_C points DOWN with length
  // proportional to X_C = ω₀/ω.
  function PhasorBlock({ ratio, label, headerColor, noteText, accentResonance }) {
    const size = portrait ? 150 : 170;
    const c = size / 2;
    // R always 1; L = ratio; C = 1/ratio.
    // Base length is small enough that even with ratio≈1.85 the arrow tip
    // (plus its label, which sits ~16 px past the tip) stays inside the
    // size×size box. Without this cap V_L would punch through the header
    // text above on the rightmost phasor diagram.
    const len = size * 0.24;
    const lVR = len;
    const maxArm = c - 18;                // leave room for the arrow label
    const lVL = Math.min(maxArm, len * ratio);
    const lVC = Math.min(maxArm, len / ratio);
    return (
      <div style={{ display: 'flex', flexDirection: 'column',
                    alignItems: 'center', gap: 8 }}>
        <div style={{ ...headerStyle, color: headerColor }}>{label}</div>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
             style={{ overflow: 'visible' }}>
          {/* Faint axes */}
          <line x1={c - len * 1.2} y1={c} x2={c + len * 1.2} y2={c}
                stroke="rgba(232,220,193,0.10)" strokeWidth={1}/>
          <line x1={c} y1={c - len * 1.2} x2={c} y2={c + len * 1.2}
                stroke="rgba(232,220,193,0.10)" strokeWidth={1}/>
          {/* V_R (right, amber) */}
          <line x1={c} y1={c} x2={c + lVR} y2={c}
                stroke="var(--amber-400)" strokeWidth={2.4}/>
          <path d={`M ${c + lVR} ${c} L ${c + lVR - 7} ${c - 4} L ${c + lVR - 7} ${c + 4} Z`}
                fill="var(--amber-400)"/>
          <text x={c + lVR + 6} y={c - 4}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={13}>
            V<tspan baselineShift="sub" fontSize={9}>R</tspan>
          </text>
          {/* V_L (up, rose) */}
          <line x1={c} y1={c} x2={c} y2={c - lVL}
                stroke="var(--rose-400)" strokeWidth={2.4}/>
          <path d={`M ${c} ${c - lVL} L ${c - 4} ${c - lVL + 7} L ${c + 4} ${c - lVL + 7} Z`}
                fill="var(--rose-400)"/>
          <text x={c + 6} y={c - lVL - 4} fill="var(--rose-300)"
                fontFamily="var(--font-serif)" fontStyle="italic" fontSize={13}>
            V<tspan baselineShift="sub" fontSize={9}>L</tspan>
          </text>
          {/* V_C (down, teal) */}
          <line x1={c} y1={c} x2={c} y2={c + lVC}
                stroke="var(--teal-400)" strokeWidth={2.4}/>
          <path d={`M ${c} ${c + lVC} L ${c - 4} ${c + lVC - 7} L ${c + 4} ${c + lVC - 7} Z`}
                fill="var(--teal-400)"/>
          <text x={c + 6} y={c + lVC + 14} fill="var(--teal-400)"
                fontFamily="var(--font-serif)" fontStyle="italic" fontSize={13}>
            V<tspan baselineShift="sub" fontSize={9}>C</tspan>
          </text>
          {/* Resonance accent — at f₀ the L and C arrows visibly cancel
              along the vertical axis, so we add a faint highlight ring. */}
          {accentResonance && (
            <circle cx={c} cy={c} r={len * 1.05}
                    fill="none" stroke="var(--amber-300)" strokeWidth={1}
                    strokeDasharray="3 4" opacity={0.45}/>
          )}
        </svg>
        <div style={noteStyle}>{noteText}</div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 26,
    }}>
      <FadeUp duration={0.5} delay={0.2} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        what the phasors look like
      </FadeUp>

      <FadeUp duration={0.5} delay={0.5} distance={10}
        style={{
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          gap: portrait ? 22 : 56,
          alignItems: portrait ? 'center' : 'flex-start',
        }}>
        <PhasorBlock
          ratio={0.55}
          label="ω < ω₀"
          headerColor="var(--chalk-300)"
          noteText="V_C dominates → net impedance is capacitive"
        />
        <PhasorBlock
          ratio={1.0}
          label="ω = ω₀"
          headerColor="var(--amber-300)"
          noteText="V_L + V_C = 0 → only V_R remains"
          accentResonance={true}
        />
        <PhasorBlock
          ratio={1.85}
          label="ω > ω₀"
          headerColor="var(--chalk-300)"
          noteText="V_L dominates → net impedance is inductive"
        />
      </FadeUp>

      <FadeUp duration={0.6} delay={9.0} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 24, color: 'var(--amber-300)',
          textAlign: 'center', maxWidth: portrait ? '24ch' : '40ch',
          lineHeight: 1.3, letterSpacing: '0.02em',
        }}>
        X<sub style={{ fontSize: '0.6em' }}>L</sub> = ωL,&nbsp; X<sub style={{ fontSize: '0.6em' }}>C</sub> = 1/(ωC)&nbsp; ⇒&nbsp; ω<sub style={{ fontSize: '0.6em' }}>0</sub> = 1/√(LC)
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Resonance picks one frequency out of the crowd.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 44 : 56,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 4,
        }}>
          ω<sub style={{ fontSize: '0.55em' }}>0</sub> = 1 / √(LC)
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 8,
          textAlign: 'center', textTransform: 'uppercase',
          maxWidth: portrait ? '28ch' : 'none', lineHeight: 1.4,
        }}>
        every radio · every oscilloscope trigger · every quartz watch
      </FadeUp>
    </div>
  );
}

// Expose narration for TTS / subtitle export.
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
