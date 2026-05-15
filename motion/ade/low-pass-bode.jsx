// RC Low-Pass Filter: Why Gain Rolls Off at the Cutoff — Manimo lesson scene.
// An RC low-pass passes low frequencies and attenuates high ones.
// Genuine animation lives in Beat 3 (FrequencySweep): a single ω parameter
// scrubs through three decades while two sinusoids redraw frame-by-frame
// — V_in stays at unit amplitude, V_out shrinks and lags. Beat 4 sweeps
// the same parameter while the Bode magnitude curve traces in.
//
// Beats (timed to single-track narration in motion/ade/audio/low-pass-bode/):
//    0.00– 4.54  Manimo intro: an R and a C — what frequencies survive?
//    4.54–12.62  Circuit: R in series, C to ground, V_out across C
//   12.62–23.78  Frequency sweep: ω scrubs; V_in stays, V_out shrinks and lags
//   23.78–34.88  Bode magnitude: flat then rolls off at −20 dB/decade past ω_c
//   34.88–48.00  Takeaway: ω_c = 1/RC; high frequencies get killed
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 3's ω parameter sweeps log-linearly 0.1·ω_c → 10·ω_c via
//     useSprite()'s localTime, so the V_in/V_out traces aren't pre-baked.
//   • Beat 4's Bode magnitude curve is drawn by sampling H(jω) at every
//     pixel along the log-ω axis — the cursor reveals progressively.

const SCENE_DURATION = 46;

const NARRATION = [
  /*  0.00– 4.54 */ "Push a sine wave through an R and a C — what comes out the other side?",
  /*  4.54–12.62 */ "Here is the filter — a resistor in series, a capacitor to ground, output taken across the capacitor.",
  /* 12.62–23.78 */ "Step the input frequency from low to high. At low frequencies the output tracks the input. As the frequency climbs past the cutoff, the output shrinks and lags behind.",
  /* 23.78–34.88 */ "Plot the gain in decibels against frequency on a log axis. Below the cutoff the gain is flat at zero dB; above the cutoff it falls by twenty decibels every decade.",
  /* 34.88–48.00 */ "Below omega equals one over R C the filter passes the signal through. Above, it kills high frequencies — that is why we call it a low pass filter.",
];

const NARRATION_AUDIO = 'audio/low-pass-bode/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="frequency response"
      title="RC Low-Pass Filter: Why Gain Rolls Off at the Cutoff"
      duration={SCENE_DURATION}
      introEnd={4.91}
      introCaption="An R and a C — what frequencies survive?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.91} end={12.12}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={12.12} end={24}>
        <FrequencySweepBeat />
      </Sprite>

      <Sprite start={24} end={35.48}>
        <BodeMagnitudeBeat />
      </Sprite>

      <Sprite start={35.48} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared transfer-function helpers ────────────────────────────────────
// H(jω) for an RC low-pass = 1/(1+jωRC). Express ω in units of ω_c = 1/RC,
// so the unitless quantity x = ω/ω_c → |H| = 1/√(1+x²), phase = -atan(x).
function magdB(x) {
  return 20 * Math.log10(1 / Math.sqrt(1 + x * x));
}
function phaseDeg(x) {
  return -Math.atan(x) * 180 / Math.PI;
}

// Sinusoid path from (x0, yMid) over width samples for a sine of angular
// frequency `cyclesAcrossPanel` (full cycles visible) and amplitude `amp`
// and phase shift `phi` (radians).
function sinePath(x0, yMid, width, amp, cyclesAcross, phi, samples = 240) {
  const pts = [`M ${x0} ${(yMid - amp * Math.sin(phi)).toFixed(2)}`];
  for (let i = 1; i <= samples; i++) {
    const f = i / samples;
    const x = x0 + f * width;
    const y = yMid - amp * Math.sin(2 * Math.PI * cyclesAcross * f + phi);
    pts.push(`L ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

// ─── Beat 2: Circuit ─────────────────────────────────────────────────────
function CircuitBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 580,
        leftX: 110, midX: 320, rightX: 480,
        topY: 130, botY: 380,
        zigAmp: 18, fontMain: 22, capY: 480, formulaY: 540 }
    : { vbW: 920, vbH: 380,
        leftX: 160, midX: 460, rightX: 720,
        topY: 90, botY: 280,
        zigAmp: 12, fontMain: 22, capY: 310, formulaY: 360 };

  const inLabelX = G.leftX - 20;
  const inLabelY = (G.topY + G.botY) / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* V_in terminal pair (left side, vertical) */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.leftX} y1={G.topY - 16} x2={G.leftX} y2={G.topY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.leftX} y1={G.botY} x2={G.leftX} y2={G.botY + 16}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <circle cx={G.leftX} cy={G.topY - 16} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <circle cx={G.leftX} cy={G.botY + 16} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={inLabelX} y={inLabelY - 6} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Top wire L → mid */}
        <TraceIn d={`M ${G.leftX} ${G.topY} L ${G.midX - 40} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>
        {/* R (resistor zigzag along top wire) */}
        <TraceIn d={(function () {
          const x0 = G.midX - 40, x1 = G.midX + 40, n = 8;
          const dx = (x1 - x0) / n;
          const pts = [`M ${x0} ${G.topY}`];
          for (let i = 1; i < n; i++) {
            const y = G.topY + (i % 2 === 1 ? G.zigAmp : -G.zigAmp);
            const x = x0 + i * dx;
            pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          pts.push(`L ${x1} ${G.topY}`);
          return pts.join(' ');
        })()}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={0.9}/>
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={G.midX} y={G.topY - 24} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>R</text>
        </SvgFadeIn>

        {/* Wire after R → V_out top terminal */}
        <TraceIn d={`M ${G.midX + 40} ${G.topY} L ${G.rightX} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.5} delay={1.5}/>

        {/* Bottom rail (ground) */}
        <TraceIn d={`M ${G.leftX} ${G.botY} L ${G.rightX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>

        {/* Capacitor between the V_out node and ground — short stub then plates */}
        <TraceIn d={`M ${G.rightX - 60} ${G.topY} L ${G.rightX - 60} ${(G.topY + G.botY) / 2 - 10}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={1.8}/>
        <SvgFadeIn duration={0.4} delay={2.0}>
          <line x1={G.rightX - 60 - 20} y1={(G.topY + G.botY) / 2 - 10}
                x2={G.rightX - 60 + 20} y2={(G.topY + G.botY) / 2 - 10}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <line x1={G.rightX - 60 - 20} y1={(G.topY + G.botY) / 2 + 6}
                x2={G.rightX - 60 + 20} y2={(G.topY + G.botY) / 2 + 6}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <text x={G.rightX - 60 + 36} y={(G.topY + G.botY) / 2 + 1}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>C</text>
        </SvgFadeIn>
        <TraceIn d={`M ${G.rightX - 60} ${(G.topY + G.botY) / 2 + 6} L ${G.rightX - 60} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.3} delay={2.4}/>

        {/* V_out terminal pair on the right */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <line x1={G.rightX} y1={G.topY} x2={G.rightX} y2={G.topY - 16}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.rightX} y1={G.botY} x2={G.rightX} y2={G.botY + 16}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <circle cx={G.rightX} cy={G.topY - 16} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <circle cx={G.rightX} cy={G.botY + 16} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <text x={G.rightX + 20} y={inLabelY - 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.2}>
          <text x={G.vbW / 2} y={G.capY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            output across the cap — a low-pass filter
          </text>
        </SvgFadeIn>

        {/* Transfer function */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 24 : 28}>
            H(jω) = 1 / (1 + jωRC)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Frequency sweep — V_in vs V_out, log-linear scrub ───────────
// ω scrubs from 0.1·ω_c to 10·ω_c across the beat. V_in stays at unit
// amplitude; V_out amplitude = 1/√(1+x²), phase = -atan(x). The number
// of visible cycles is kept constant (3 cycles across the panel) so the
// motion legibly shows lag, not just a changing period.
function FrequencySweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 800,
        panelX: 60, panelW: 480,
        inY: 140, outY: 380, panelH: 180,
        readoutY: 640, captionY: 720,
        fontReadout: 18 }
    : { vbW: 1080, vbH: 460,
        panelX: 120, panelW: 840,
        inY: 100, outY: 280, panelH: 140,
        readoutY: 440, captionY: 410,
        fontReadout: 18 };

  // Log-linear sweep of x = ω/ω_c from 0.1 to 10 across the beat (minus a
  // small hold at start so the legend lands first).
  const HOLD = 0.6;
  const TAIL = 0.6;
  const SWEEP = Math.max(spriteDur - HOLD - TAIL, 1);
  const sFrac = clamp((localTime - HOLD) / SWEEP, 0, 1);
  // log10(x) linear from -1 to 1
  const logX = -1 + 2 * sFrac;
  const x = Math.pow(10, logX);
  const amp = 1 / Math.sqrt(1 + x * x);
  const phi = Math.atan(x); // V_out lags V_in by atan(x)

  // Visible time-frame phase advances with stage time so the wave keeps
  // moving — choose 0.6 Hz on-screen × 2π rad/s, scaled by clock time.
  const tWave = localTime * 1.2 * Math.PI * 2;
  // Cycles visible across the panel — fixed for legibility.
  const cyclesVisible = 3;
  // Both sinusoids advance with tWave; the offset between them is phi.
  const ampPx = G.panelH / 2 - 14;

  const inPath = sinePath(G.panelX, G.inY + G.panelH / 2, G.panelW,
                          ampPx, cyclesVisible, tWave);
  const outPath = sinePath(G.panelX, G.outY + G.panelH / 2, G.panelW,
                           ampPx * amp, cyclesVisible, tWave - phi);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Row labels */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.inY - 8}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">V_IN</text>
          <text x={G.panelX} y={G.outY - 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.16em">V_OUT</text>
        </SvgFadeIn>

        {/* Baselines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.panelX} y1={G.inY + G.panelH / 2}
                x2={G.panelX + G.panelW} y2={G.inY + G.panelH / 2}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.35}
                strokeDasharray="3 4"/>
          <line x1={G.panelX} y1={G.outY + G.panelH / 2}
                x2={G.panelX + G.panelW} y2={G.outY + G.panelH / 2}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.35}
                strokeDasharray="3 4"/>
          {/* Reference envelope at unit amplitude on V_out panel */}
          <line x1={G.panelX} y1={G.outY + G.panelH / 2 - ampPx}
                x2={G.panelX + G.panelW} y2={G.outY + G.panelH / 2 - ampPx}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.18}
                strokeDasharray="2 5"/>
          <line x1={G.panelX} y1={G.outY + G.panelH / 2 + ampPx}
                x2={G.panelX + G.panelW} y2={G.outY + G.panelH / 2 + ampPx}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.18}
                strokeDasharray="2 5"/>
        </SvgFadeIn>

        {/* Sinusoids — redrawn every frame */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <path d={inPath} fill="none" stroke="var(--chalk-100)"
                strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>
          <path d={outPath} fill="none" stroke="var(--amber-300)"
                strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* Live frequency + gain readout */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.panelX} y={G.readoutY}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontReadout} letterSpacing="0.04em">
            ω / ω_c = {x < 1 ? x.toFixed(2) : x.toFixed(1)}
          </text>
          <text x={G.panelX + G.panelW} y={G.readoutY}
                textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontReadout} letterSpacing="0.04em">
            |H| = {amp.toFixed(2)}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            climb past ω_c — V_out shrinks and lags
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Bode magnitude — gain in dB vs log ω ────────────────────────
function BodeMagnitudeBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 760,
        plotX: 100, plotY: 140, plotW: 440, plotH: 360,
        captionY: 700, fontAxis: 12, fontMain: 16 }
    : { vbW: 1080, vbH: 500,
        plotX: 160, plotY: 60, plotW: 760, plotH: 320,
        captionY: 470, fontAxis: 12, fontMain: 16 };

  // x axis: log10(ω/ω_c) from -2 to 2 (4 decades, ω_c at the middle).
  // y axis: |H| in dB from +5 to -45 (50 dB range).
  const X_MIN = -2, X_MAX = 2;
  const Y_TOP = 5, Y_BOT = -45;

  const xToPx = (lx) => G.plotX + ((lx - X_MIN) / (X_MAX - X_MIN)) * G.plotW;
  const yToPx = (dB) => G.plotY + ((Y_TOP - dB) / (Y_TOP - Y_BOT)) * G.plotH;
  const xcPx = xToPx(0); // ω_c at log10(1)=0

  // Cursor sweeps left to right across the plot. The magnitude curve is
  // revealed up to the cursor — uses a clip-path so we get a fully
  // shaped curve that's progressively unmasked.
  const HOLD = 0.8;
  const SWEEP = Math.max(spriteDur - HOLD - 1.6, 1);
  const sFrac = clamp((localTime - HOLD) / SWEEP, 0, 1);
  const cursorLogX = X_MIN + (X_MAX - X_MIN) * sFrac;
  const cursorPx = xToPx(cursorLogX);

  // Build full magnitude curve path (always present, clipped later).
  const SAMPLES = 240;
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const lx = X_MIN + (X_MAX - X_MIN) * (i / SAMPLES);
    const xVal = Math.pow(10, lx);
    const dB = magdB(xVal);
    pts.push((i === 0 ? 'M ' : 'L ') + xToPx(lx).toFixed(2) + ' ' + yToPx(dB).toFixed(2));
  }
  const magD = pts.join(' ');

  // Decade gridlines at lx = -2, -1, 0, 1, 2
  const decades = [-2, -1, 0, 1, 2];
  const decadeLabels = ['0.01', '0.1', '1', '10', '100'];
  // Horizontal gridlines at dB = 0, -10, -20, -30, -40
  const dBLines = [0, -10, -20, -30, -40];

  const clipId = `bodeMagClip`;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id={clipId}>
            <rect x={G.plotX} y={G.plotY - 4}
                  width={Math.max(0, cursorPx - G.plotX)} height={G.plotH + 8}/>
          </clipPath>
        </defs>

        {/* Axis box */}
        <SvgFadeIn duration={0.4} delay={0}>
          <line x1={G.plotX} y1={G.plotY + G.plotH}
                x2={G.plotX + G.plotW} y2={G.plotY + G.plotH}
                stroke="var(--chalk-200)" strokeWidth={1.8}/>
          <line x1={G.plotX} y1={G.plotY}
                x2={G.plotX} y2={G.plotY + G.plotH}
                stroke="var(--chalk-200)" strokeWidth={1.8}/>
        </SvgFadeIn>

        {/* Decade gridlines */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {decades.map((lx, i) => (
            <g key={i}>
              <line x1={xToPx(lx)} y1={G.plotY}
                    x2={xToPx(lx)} y2={G.plotY + G.plotH}
                    stroke="var(--chalk-300)" strokeWidth={1} opacity={0.18}/>
              <text x={xToPx(lx)} y={G.plotY + G.plotH + 18}
                    textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={G.fontAxis}>{decadeLabels[i]}</text>
            </g>
          ))}
          <text x={G.plotX + G.plotW / 2} y={G.plotY + G.plotH + 40}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontAxis} letterSpacing="0.1em">ω / ω_c (log)</text>
        </SvgFadeIn>

        {/* dB gridlines + labels */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          {dBLines.map((dB, i) => (
            <g key={i}>
              <line x1={G.plotX} y1={yToPx(dB)}
                    x2={G.plotX + G.plotW} y2={yToPx(dB)}
                    stroke="var(--chalk-300)" strokeWidth={1} opacity={0.16}/>
              <text x={G.plotX - 8} y={yToPx(dB) + 4} textAnchor="end"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={G.fontAxis}>{dB === 0 ? '0' : dB} dB</text>
            </g>
          ))}
        </SvgFadeIn>

        {/* ω_c vertical marker — drawn after the plot but always present */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={xcPx} y1={G.plotY} x2={xcPx} y2={G.plotY + G.plotH}
                stroke="var(--rose-400)" strokeWidth={1.4}
                strokeDasharray="5 5" opacity={0.6}/>
          <text x={xcPx} y={G.plotY - 8} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={16}>
            ω<tspan baselineShift="sub" fontSize={10}>c</tspan>
          </text>
        </SvgFadeIn>

        {/* Asymptote: 0 dB until ω_c, then −20 dB/decade */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <path d={`M ${G.plotX} ${yToPx(0)} L ${xcPx} ${yToPx(0)} L ${xToPx(2)} ${yToPx(-40)}`}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="4 5" opacity={0.5}/>
        </SvgFadeIn>

        {/* Magnitude curve — clipped to cursor position */}
        <g clipPath={`url(#${clipId})`}>
          <path d={magD} fill="none" stroke="var(--amber-300)"
                strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round"/>
        </g>

        {/* −3 dB callout at ω_c — appears once the cursor crosses */}
        {cursorLogX >= 0 && (
          <SvgFadeIn duration={0.4} delay={0}>
            <circle cx={xcPx} cy={yToPx(-3)} r={4}
                    fill="var(--rose-400)" opacity={0.95}/>
            <text x={xcPx + 14} y={yToPx(-3) + 6}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={13}>−3 dB</text>
          </SvgFadeIn>
        )}

        {/* Frequency cursor */}
        {cursorLogX > X_MIN + 0.02 && cursorLogX < X_MAX - 0.02 && (
          <line x1={cursorPx} y1={G.plotY - 4}
                x2={cursorPx} y2={G.plotY + G.plotH + 4}
                stroke="var(--amber-400)" strokeWidth={1.2}
                strokeDasharray="2 4" opacity={0.7}/>
        )}

        {/* Slope annotation, fades in near end */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={xToPx(1.4)} y={yToPx(-26)} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontMain - 2} letterSpacing="0.04em">
            −20 dB / decade
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            magnitude in decibels — log frequency on the horizontal axis
          </text>
        </SvgFadeIn>
      </svg>
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
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 44 : 56, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        ω<sub>c</sub> = 1 / RC
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        low frequencies pass through; high frequencies are attenuated
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        the same shape drives audio crossovers, antialiasing, smoothing
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
