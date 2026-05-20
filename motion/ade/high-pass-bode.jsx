// RC High-Pass Filter: Why Gain Rolls In Past the Cutoff — Manimo lesson scene.
// Swap C and R in the RC filter: capacitor in series, resistor to ground,
// V_out across the resistor. H(jω) = jωRC / (1 + jωRC). Gain rises at
// +20 dB/decade below ω_c = 1/RC and is flat (0 dB) above; phase shifts
// from +90° at DC down to 0° at high frequency.
//
// Genuine animation lives in Beat 3 (FrequencySweep): a single ω parameter
// scrubs through three decades while two sinusoids redraw frame-by-frame —
// V_in stays at unit amplitude, V_out grows from near zero up toward V_in,
// leading then in phase. Beat 4 sweeps the same parameter while the Bode
// magnitude curve traces in left-to-right.
//
// Beats:
//    0.00– 5.00  Manimo intro: same parts, swapped — which way does gain go?
//    5.00–13.00  Circuit: C in series, R to ground, output across R
//   13.00–25.00  Frequency sweep: ω scrubs; V_out grows and leads
//   25.00–36.00  Bode magnitude: rises at +20 dB/decade, flat past ω_c
//   36.00–46.00  Takeaway: ω_c = 1/RC; low frequencies get killed

const SCENE_DURATION = 46;

const NARRATION = [
  /*  0.00– 5.00 */ 'Swap the R and the C in our filter — what changes?',
  /*  5.00–13.00 */ 'The capacitor sits in series; the resistor goes to ground; V out is taken across the resistor.',
  /* 13.00–25.00 */ 'Step the input frequency from low to high. At low frequencies the capacitor blocks the signal and V out collapses. As the frequency climbs past the cutoff, V out grows up to match V in.',
  /* 25.00–36.00 */ 'Plot the gain in decibels against frequency on a log axis. Below the cutoff the gain climbs at twenty decibels every decade; above the cutoff it is flat at zero dB.',
  /* 36.00–46.00 */ 'Above omega equals one over R C the filter passes the signal through. Below, it kills low frequencies — that is why we call it a high pass filter.',
];

const NARRATION_AUDIO = 'audio/high-pass-bode/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="frequency response"
      title="RC High-Pass Filter: Why Gain Rolls In Past the Cutoff"
      duration={SCENE_DURATION}
      introEnd={4.33}
      introCaption="Same parts, swapped positions — which way does the gain go?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.33} end={10.75}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={10.75} end={23.55}>
        <FrequencySweepBeat />
      </Sprite>

      <Sprite start={23.55} end={34.63}>
        <BodeMagnitudeBeat />
      </Sprite>

      <Sprite start={34.63} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared transfer-function helpers ────────────────────────────────────
// H(jω) for an RC high-pass = jωRC / (1 + jωRC). With x = ω/ω_c:
//   |H| = x / √(1 + x²),    phase = π/2 − atan(x)   (lead at low freq)
function magdB(x) {
  return 20 * Math.log10(x / Math.sqrt(1 + x * x));
}
function magLin(x) {
  return x / Math.sqrt(1 + x * x);
}
function phaseLeadRad(x) {
  // V_out leads V_in by π/2 − atan(x): 90° at x→0, 0° at x→∞.
  return Math.PI / 2 - Math.atan(x);
}

// Sine path from (x0, yMid) over `width` pixels — `cyclesAcross` cycles,
// amplitude `amp` px, phase shift `phi` rad.
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

// ─── Beat 2: Circuit — C in series, R to ground ──────────────────────────
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
  const capCx = G.midX;
  const rX = G.rightX - 60;
  const rTop = G.topY;
  const rBot = G.botY;

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

        {/* Top wire L → capacitor left stub */}
        <TraceIn d={`M ${G.leftX} ${G.topY} L ${capCx - 24} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>

        {/* Capacitor in series — two amber plates flanking a 16-px gap */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <line x1={capCx - 8} y1={G.topY - 16} x2={capCx - 8} y2={G.topY + 16}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <line x1={capCx + 8} y1={G.topY - 16} x2={capCx + 8} y2={G.topY + 16}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <text x={capCx} y={G.topY - 28} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>C</text>
        </SvgFadeIn>

        {/* Wire after C → V_out top terminal */}
        <TraceIn d={`M ${capCx + 24} ${G.topY} L ${G.rightX} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={1.4}/>

        {/* Bottom rail (ground) */}
        <TraceIn d={`M ${G.leftX} ${G.botY} L ${G.rightX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.6} delay={0.4}/>

        {/* R from V_out node down to ground — zigzag vertical resistor.
            Stub from top wire to zigzag, zigzag, stub to bottom rail. */}
        <TraceIn d={`M ${rX} ${G.topY} L ${rX} ${G.topY + 12}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.25} delay={1.8}/>
        <TraceIn d={(function () {
          const yT = G.topY + 12, yB = G.botY - 12, n = 8;
          const dy = (yB - yT) / n;
          const pts = [`M ${rX} ${yT}`];
          for (let i = 1; i < n; i++) {
            const x = rX + (i % 2 === 1 ? G.zigAmp : -G.zigAmp);
            const y = yT + i * dy;
            pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
          }
          pts.push(`L ${rX} ${yB}`);
          return pts.join(' ');
        })()}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.9} delay={2.0}/>
        <TraceIn d={`M ${rX} ${G.botY - 12} L ${rX} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2} duration={0.25} delay={2.7}/>

        {/* R label */}
        <SvgFadeIn duration={0.35} delay={2.4}>
          <text x={rX + G.zigAmp + 18} y={(G.topY + G.botY) / 2 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>R</text>
        </SvgFadeIn>

        {/* V_out terminal pair on the right */}
        <SvgFadeIn duration={0.4} delay={3.0}>
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
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.vbW / 2} y={G.capY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            output across the resistor — a high-pass filter
          </text>
        </SvgFadeIn>

        {/* Transfer function */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 24 : 28}>
            H(jω) = jωRC / (1 + jωRC)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Frequency sweep — V_out grows and leads ─────────────────────
// ω scrubs from 0.1·ω_c to 10·ω_c across the beat. V_in stays at unit
// amplitude; V_out amplitude = x/√(1+x²), phase lead = π/2 − atan(x).
// Visible cycles fixed at 3 for legibility (the same way low-pass-bode
// does it) so the motion shows amplitude + phase, not period.
function FrequencySweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 800,
        panelX: 60, panelW: 480,
        inY: 140, outY: 380, panelH: 180,
        readoutY: 640, captionY: 720,
        fontReadout: 18 }
    : { vbW: 1080, vbH: 500,
        panelX: 120, panelW: 840,
        inY: 80, outY: 250, panelH: 140,
        readoutY: 430, captionY: 470,
        fontReadout: 18 };

  // Log-linear sweep of x = ω/ω_c from 0.1 to 10 across the beat.
  const HOLD = 0.6;
  const TAIL = 0.6;
  const SWEEP = Math.max(spriteDur - HOLD - TAIL, 1);
  const sFrac = clamp((localTime - HOLD) / SWEEP, 0, 1);
  const logX = -1 + 2 * sFrac;
  const x = Math.pow(10, logX);
  const amp = magLin(x);
  const lead = phaseLeadRad(x);

  const tWave = localTime * 1.2 * Math.PI * 2;
  const cyclesVisible = 3;
  const ampPx = G.panelH / 2 - 14;

  const inPath = sinePath(G.panelX, G.inY + G.panelH / 2, G.panelW,
                          ampPx, cyclesVisible, tWave);
  // V_out leads V_in: same time origin, but its phase is ahead by `lead`.
  const outPath = sinePath(G.panelX, G.outY + G.panelH / 2, G.panelW,
                           ampPx * amp, cyclesVisible, tWave + lead);

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

        {/* Baselines + reference envelope on the V_out panel */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.panelX} y1={G.inY + G.panelH / 2}
                x2={G.panelX + G.panelW} y2={G.inY + G.panelH / 2}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.35}
                strokeDasharray="3 4"/>
          <line x1={G.panelX} y1={G.outY + G.panelH / 2}
                x2={G.panelX + G.panelW} y2={G.outY + G.panelH / 2}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.35}
                strokeDasharray="3 4"/>
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
            climb past ω_c — V_out grows and leads
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Bode magnitude — +20 dB/decade then flat ────────────────────
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

  const X_MIN = -2, X_MAX = 2;
  const Y_TOP = 5, Y_BOT = -45;

  const xToPx = (lx) => G.plotX + ((lx - X_MIN) / (X_MAX - X_MIN)) * G.plotW;
  const yToPx = (dB) => G.plotY + ((Y_TOP - dB) / (Y_TOP - Y_BOT)) * G.plotH;
  const xcPx = xToPx(0);

  const HOLD = 0.8;
  const SWEEP = Math.max(spriteDur - HOLD - 1.6, 1);
  const sFrac = clamp((localTime - HOLD) / SWEEP, 0, 1);
  const cursorLogX = X_MIN + (X_MAX - X_MIN) * sFrac;
  const cursorPx = xToPx(cursorLogX);

  // Full high-pass magnitude curve.
  const SAMPLES = 240;
  const pts = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const lx = X_MIN + (X_MAX - X_MIN) * (i / SAMPLES);
    const xVal = Math.pow(10, lx);
    const dB = magdB(xVal);
    pts.push((i === 0 ? 'M ' : 'L ') + xToPx(lx).toFixed(2) + ' ' + yToPx(dB).toFixed(2));
  }
  const magD = pts.join(' ');

  const decades = [-2, -1, 0, 1, 2];
  const decadeLabels = ['0.01', '0.1', '1', '10', '100'];
  const dBLines = [0, -10, -20, -30, -40];

  const clipId = `bodeHighMagClip`;

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

        {/* ω_c vertical marker */}
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

        {/* Asymptote: +20 dB/decade until ω_c (passes through (-2, -40)),
            then flat at 0 dB. */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <path d={`M ${xToPx(-2)} ${yToPx(-40)} L ${xcPx} ${yToPx(0)} L ${xToPx(2)} ${yToPx(0)}`}
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

        {/* Slope annotation in the low-frequency rising region */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={xToPx(-1.4)} y={yToPx(-26)} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontMain - 2} letterSpacing="0.04em">
            +20 dB / decade
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
        high frequencies pass through; low frequencies are attenuated
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '34ch' : 'none',
          textAlign: 'center',
        }}>
        the same shape drives DC blockers, AC coupling, edge detectors
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
