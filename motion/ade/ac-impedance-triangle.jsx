// AC Impedance Triangle — Manimo lesson scene.
// Series R-L-C impedance: Z = R + j(ωL − 1/ωC). Stack R on the real axis
// and the two reactances on the imaginary axis, and Z falls out as a
// single phasor with magnitude √(R²+X²) and angle arctan(X/R). The
// genuine motion lives in Beat 4: ω sweeps from below-resonance to
// above-resonance and the Z phasor live-rotates from capacitive (below
// the axis) through resonant (on the axis) to inductive (above).
//
// Beats:
//    0.00– 5.00  Manimo intro + hook caption
//    5.00–18.00  Series R-L-C circuit + component-impedance labels
//   18.00–32.00  Build the triangle on the complex plane: R + jωL − j/(ωC) → Z
//   32.00–46.00  Sweep ω; Z phasor rotates from below to above the real axis
//   46.00–52.00  Takeaway: |Z|, arg(Z) and what they mean physically
//
// Authoring notes:
//   • Resonance frequency ω₀ = 1/√(LC). At ω = ω₀, X = 0 and Z lies on Re-axis.
//   • Beats 3 and 4 share plotGeom() so the triangle and sweep are aligned.

const SCENE_DURATION = 89;

// Single continuous narration track — generated with
// `npm run audio ac-impedance-triangle --engine elevenlabs`. Beat
// Sprite-start values below match audioStart offsets in
// motion/ade/audio/ac-impedance-triangle/manifest.json.
const NARRATION_AUDIO = 'audio/ac-impedance-triangle/scene.mp3';

const NARRATION = [
  /*  0.00– 5.00 */ 'Resistors live on the real axis. Inductors and capacitors live on the imaginary axis. So how does a series R L C even have one impedance?',
  /*  5.00–18.00 */ 'Three elements in series. The resistor has impedance R, a real number. The inductor adds j times omega L — purely imaginary, pointing up. The capacitor adds minus j over omega C — also imaginary, pointing down.',
  /* 18.00–32.00 */ "Plot them on the complex plane. R is the horizontal leg. Stack the inductive arrow up and the capacitive arrow down — their difference is the net reactance X. The hypotenuse from origin to the tip is the total impedance Z, with magnitude root R squared plus X squared and angle arctan X over R.",
  /* 32.00–46.00 */ "Now sweep omega from low to high. At low frequency the capacitor's huge impedance dominates, so X is negative and Z dips below the real axis — the circuit looks capacitive. Push omega up and the two reactances cross at resonance, where X equals zero and Z lies flat on the real axis. Above resonance the inductor wins, X goes positive, and Z swings up — the circuit looks inductive.",
  /* 46.00–52.00 */ 'Impedance is one complex number — real part the resistor, imaginary part the reactance. Magnitude tells you the size, angle tells you the phase between voltage and current.',
];

// Circuit constants (display only — drive Beat 3's triangle and Beat 4's sweep).
const R = 4;        // Ω (visual units)
const XL_AT_W0 = 3; // ωL at the "showcase" frequency used in Beat 3
const XC_AT_W0 = 1; // 1/(ωC) at the "showcase" frequency in Beat 3
const X_AT_W0 = XL_AT_W0 - XC_AT_W0; // net X at the demo ω in Beat 3 → +2

function Scene() {
  return (
    <SceneChrome
      eyebrow="ac analysis"
      title="Impedance Triangle: R + jX as One Phasor"
      duration={SCENE_DURATION}
      introEnd={10.44}
      introCaption="Stack R, jωL and −j/ωC — and Z drops out as one phasor."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.44} end={27.25}>
        <ComponentsBeat />
      </Sprite>

      <Sprite start={27.25} end={48.45}>
        <TriangleBuildBeat />
      </Sprite>

      <Sprite start={48.45} end={76.35}>
        <SweepFreqBeat />
      </Sprite>

      <Sprite start={76.35} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared resistor / inductor / capacitor symbol helpers ────────────────
function resistorZigD(x1, y, x2, amp = 8, n = 7) {
  const dx = (x2 - x1) / n;
  const pts = [`M ${x1} ${y}`];
  for (let i = 1; i < n; i++) {
    const xi = x1 + i * dx;
    const yi = y + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${xi.toFixed(1)} ${yi.toFixed(1)}`);
  }
  pts.push(`L ${x2} ${y}`);
  return pts.join(' ');
}

function InductorCoils({ x1, y, x2, loops = 4, r = 7, color = 'var(--teal-400)' }) {
  const total = x2 - x1;
  const step = total / loops;
  const arcs = [];
  for (let i = 0; i < loops; i++) {
    const xi = x1 + i * step;
    arcs.push(`M ${xi} ${y} A ${r} ${r} 0 0 1 ${xi + step} ${y}`);
  }
  return (
    <path d={arcs.join(' ')}
          fill="none" stroke={color} strokeWidth={2}
          strokeLinecap="round"/>
  );
}

function CapPlates({ cx, y, gap = 8, plateH = 24, color = 'var(--rose-400)' }) {
  return (
    <g>
      <line x1={cx - gap} y1={y - plateH / 2} x2={cx - gap} y2={y + plateH / 2}
            stroke={color} strokeWidth={2.4}/>
      <line x1={cx + gap} y1={y - plateH / 2} x2={cx + gap} y2={y + plateH / 2}
            stroke={color} strokeWidth={2.4}/>
    </g>
  );
}

// Arrow path with arrowhead. Used heavily in the phasor build-up.
function arrowD(x1, y1, x2, y2, head = 8) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  if (len < 0.1) return `M ${x1} ${y1}`;
  const ux = dx / len, uy = dy / len;
  const px = -uy, py = ux;
  const hx = x2 - ux * head;
  const hy = y2 - uy * head;
  return `M ${x1} ${y1} L ${x2} ${y2} M ${hx + px * head * 0.55} ${hy + py * head * 0.55} L ${x2} ${y2} L ${hx - px * head * 0.55} ${hy - py * head * 0.55}`;
}

// ─── Beat 2: Series R-L-C circuit + component impedances ─────────────────
function ComponentsBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 640, vbH: 720,
        circuitTopY: 120, gndY: 480,
        srcX: 110, srcR: 30,
        rX0: 180, rX1: 280, lX0: 320, lX1: 440, cX: 510,
        labelLineY: 540, formulaY: 660 }
    : { vbW: 1180, vbH: 460,
        circuitTopY: 130, gndY: 320,
        srcX: 200, srcR: 36,
        rX0: 290, rX1: 410, lX0: 460, lX1: 600, cX: 690,
        labelLineY: 380, formulaY: 430 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* AC source */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <circle cx={G.srcX} cy={G.circuitTopY} r={G.srcR}
                  fill="rgba(232,220,193,0.04)"
                  stroke="var(--chalk-100)" strokeWidth={1.6}/>
          <path d={`M ${G.srcX - G.srcR * 0.55} ${G.circuitTopY} Q ${G.srcX - G.srcR * 0.27} ${G.circuitTopY - G.srcR * 0.55}, ${G.srcX} ${G.circuitTopY} T ${G.srcX + G.srcR * 0.55} ${G.circuitTopY}`}
                fill="none" stroke="var(--chalk-100)" strokeWidth={1.6}/>
          <text x={G.srcX} y={G.circuitTopY + G.srcR + 24} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={15}>V(ω)</text>
        </SvgFadeIn>

        {/* Top wire from source → R */}
        <TraceIn d={`M ${G.srcX + G.srcR} ${G.circuitTopY} L ${G.rX0} ${G.circuitTopY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.4} delay={0.3}/>

        {/* Resistor zigzag */}
        <TraceIn d={resistorZigD(G.rX0, G.circuitTopY, G.rX1)}
                 stroke="var(--amber-400)" strokeWidth={2.4}
                 duration={0.6} delay={0.6}/>
        <SvgFadeIn duration={0.3} delay={1.0}>
          <text x={(G.rX0 + G.rX1) / 2} y={G.circuitTopY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={15}>R</text>
        </SvgFadeIn>

        {/* Wire R → L */}
        <TraceIn d={`M ${G.rX1} ${G.circuitTopY} L ${G.lX0} ${G.circuitTopY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.3} delay={1.2}/>

        {/* Inductor coils */}
        <SvgFadeIn duration={0.5} delay={1.5}>
          <InductorCoils x1={G.lX0} y={G.circuitTopY} x2={G.lX1}/>
          <text x={(G.lX0 + G.lX1) / 2} y={G.circuitTopY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={15}>L</text>
        </SvgFadeIn>

        {/* Wire L → C */}
        <TraceIn d={`M ${G.lX1} ${G.circuitTopY} L ${G.cX - 14} ${G.circuitTopY}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.3} delay={2.0}/>

        {/* Capacitor */}
        <SvgFadeIn duration={0.4} delay={2.3}>
          <CapPlates cx={G.cX} y={G.circuitTopY}/>
          <text x={G.cX} y={G.circuitTopY - 22} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={15}>C</text>
        </SvgFadeIn>

        {/* Right wire down to gnd return */}
        <TraceIn d={`M ${G.cX + 14} ${G.circuitTopY} L ${G.cX + 30} ${G.circuitTopY} L ${G.cX + 30} ${G.gndY} L ${G.srcX} ${G.gndY} L ${G.srcX} ${G.circuitTopY + G.srcR}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={1.4} delay={2.6}/>

        {/* Per-component impedance labels (positioned in a single row below) */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={(G.rX0 + G.rX1) / 2} y={G.labelLineY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            Z<tspan baselineShift="sub" fontSize={11}>R</tspan> = R
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.2}>
          <text x={(G.lX0 + G.lX1) / 2} y={G.labelLineY} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            Z<tspan baselineShift="sub" fontSize={11}>L</tspan> = jωL
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={3.0}>
          <text x={G.cX} y={G.labelLineY} textAnchor="middle"
                fill="var(--rose-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>
            Z<tspan baselineShift="sub" fontSize={11}>C</tspan> = −j/(ωC)
          </text>
        </SvgFadeIn>

        {/* Sum formula */}
        <SvgFadeIn duration={0.5} delay={5.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 22 : 28}>
            Z = R + jωL − j/(ωC)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Shared complex-plane geometry. unit = pixels per Ω (or per ohm of reactance).
function plotGeom(portrait) {
  if (portrait) {
    return {
      vbW: 640, vbH: 720,
      origX: 200, origY: 380, unit: 70,
      xAxisMin: -60, xAxisMax: 280, yAxisMin: -260, yAxisMax: 260,
      formulaY: 50, sweepReadoutY: 660,
    };
  }
  return {
    vbW: 1180, vbH: 460,
    origX: 380, origY: 240, unit: 60,
    xAxisMin: -80, xAxisMax: 540, yAxisMin: -180, yAxisMax: 180,
    formulaY: 60, sweepReadoutY: 430,
  };
}

// Plot common axes — used by Beats 3 and 4.
function ComplexAxes({ P }) {
  return (
    <g>
      {/* Horizontal axis */}
      <TraceIn d={`M ${P.origX + P.xAxisMin} ${P.origY} L ${P.origX + P.xAxisMax} ${P.origY}`}
               stroke="var(--chalk-200)" strokeWidth={1.6}
               duration={0.5} delay={0.0}/>
      {/* Vertical axis */}
      <TraceIn d={`M ${P.origX} ${P.origY + P.yAxisMin} L ${P.origX} ${P.origY + P.yAxisMax}`}
               stroke="var(--chalk-200)" strokeWidth={1.6}
               duration={0.5} delay={0.0}/>

      {/* Axis labels */}
      <SvgFadeIn duration={0.3} delay={0.4}>
        <text x={P.origX + P.xAxisMax + 14} y={P.origY + 5}
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>Re</text>
        <text x={P.origX - 14} y={P.origY + P.yAxisMin - 6}
              textAnchor="end"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={16}>Im</text>
        <text x={P.origX - 12} y={P.origY + 16} textAnchor="end"
              fill="var(--chalk-300)" fontFamily="var(--font-mono)"
              fontSize={11}>0</text>
      </SvgFadeIn>
    </g>
  );
}

// ─── Beat 3: Build the impedance triangle ────────────────────────────────
function TriangleBuildBeat() {
  const portrait = usePortrait();
  const P = plotGeom(portrait);
  const { localTime } = useSprite();

  // Coordinates (screen pixels). y goes down so "up" is −y.
  const rTipX = P.origX + R * P.unit;
  const rTipY = P.origY;
  const lTipX = rTipX;
  const lTipY = rTipY - XL_AT_W0 * P.unit;
  const cTipX = lTipX;
  const cTipY = lTipY + XC_AT_W0 * P.unit;     // capacitor goes DOWN from L tip
  const xLeg = X_AT_W0;                         // net X = +2 in our demo
  const xLegEnd = { x: rTipX, y: rTipY - xLeg * P.unit };

  // Z magnitude + angle (in degrees, math convention: counter-clockwise +)
  const zMag = Math.sqrt(R * R + xLeg * xLeg);
  const phiDeg = Math.atan2(xLeg, R) * 180 / Math.PI;

  // Reveal timing — keep each arrow staged.
  const showR = localTime > 1.0;
  const showL = localTime > 2.4;
  const showC = localTime > 3.6;
  const showXLabel = localTime > 4.6;
  const showZ = localTime > 5.6;
  const showFormula = localTime > 9.0;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={P.vbW} height={P.vbH} viewBox={`0 0 ${P.vbW} ${P.vbH}`}
           style={{ overflow: 'visible' }}>
        <ComplexAxes P={P}/>

        {/* R arrow — horizontal along +Re */}
        {showR && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <path d={arrowD(P.origX, P.origY, rTipX, rTipY)}
                  fill="none" stroke="var(--amber-400)" strokeWidth={2.6}
                  strokeLinejoin="round"/>
            <text x={(P.origX + rTipX) / 2} y={rTipY + 22} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={16}>R</text>
          </SvgFadeIn>
        )}

        {/* L arrow — vertical up from R-tip */}
        {showL && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <path d={arrowD(rTipX, rTipY, lTipX, lTipY)}
                  fill="none" stroke="var(--teal-400)" strokeWidth={2.6}
                  strokeLinejoin="round"/>
            <text x={lTipX + 14} y={(rTipY + lTipY) / 2 + 5}
                  fill="var(--teal-400)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>+jωL</text>
          </SvgFadeIn>
        )}

        {/* C arrow — vertical DOWN from L-tip (capacitive reactance) */}
        {showC && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <path d={arrowD(lTipX, lTipY, cTipX, cTipY)}
                  fill="none" stroke="var(--rose-400)" strokeWidth={2.6}
                  strokeLinejoin="round"/>
            <text x={cTipX + 14} y={(lTipY + cTipY) / 2 + 5}
                  fill="var(--rose-400)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>−j/(ωC)</text>
          </SvgFadeIn>
        )}

        {/* Net X annotation — bracket from R-tip to xLegEnd */}
        {showXLabel && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <line x1={rTipX + 50} y1={rTipY} x2={rTipX + 50} y2={xLegEnd.y}
                  stroke="var(--chalk-200)" strokeWidth={1.2}/>
            <line x1={rTipX + 44} y1={rTipY} x2={rTipX + 56} y2={rTipY}
                  stroke="var(--chalk-200)" strokeWidth={1.5}/>
            <line x1={rTipX + 44} y1={xLegEnd.y} x2={rTipX + 56} y2={xLegEnd.y}
                  stroke="var(--chalk-200)" strokeWidth={1.5}/>
            <text x={rTipX + 64} y={(rTipY + xLegEnd.y) / 2 + 5}
                  fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={15}>X = ωL − 1/(ωC)</text>
          </SvgFadeIn>
        )}

        {/* Z phasor — origin → xLegEnd. Drawn last as the "answer". */}
        {showZ && (
          <SvgFadeIn duration={0.5} delay={0.0}>
            <path d={arrowD(P.origX, P.origY, xLegEnd.x, xLegEnd.y, 10)}
                  fill="none" stroke="var(--amber-300)" strokeWidth={3}
                  strokeLinejoin="round"/>
            {/* |Z| label along the hypotenuse */}
            <text x={(P.origX + xLegEnd.x) / 2 - 18}
                  y={(P.origY + xLegEnd.y) / 2 - 8}
                  textAnchor="end"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={18}>Z</text>
            {/* Angle arc at the origin */}
            <path d={describeArc(P.origX, P.origY, 36, 0, -phiDeg)}
                  fill="none" stroke="var(--amber-300)" strokeWidth={1.4}/>
            <text x={P.origX + 44} y={P.origY - 8}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>φ</text>
          </SvgFadeIn>
        )}

        {/* Magnitude + angle formula */}
        {showFormula && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <text x={portrait ? P.vbW / 2 : P.origX + P.xAxisMax - 20}
                  y={P.formulaY + 4}
                  textAnchor={portrait ? 'middle' : 'end'}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={portrait ? 19 : 22}>
              |Z| = √(R² + X²)    tan(φ) = X/R
            </text>
          </SvgFadeIn>
        )}

        {/* Numeric readout for the demo values */}
        {showFormula && (
          <SvgFadeIn duration={0.4} delay={0.4}>
            <text x={P.vbW / 2}
                  y={P.sweepReadoutY}
                  textAnchor="middle"
                  fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                  fontSize={13} letterSpacing="0.06em">
              R = {R}    X = {xLeg}    |Z| = {zMag.toFixed(2)}    φ = {phiDeg.toFixed(1)}°
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// Compute an SVG arc path centred at (cx, cy), radius r, sweeping from
// startAngle (deg) to endAngle (deg), measured counterclockwise from +x.
// Returns an arc whose start/end are screen-pixel coords (so positive
// angle goes UP because SVG y points down — we negate angle inside).
function describeArc(cx, cy, r, startAngle, endAngle) {
  // angles in degrees, math convention (CCW from +x). Convert to SVG (y-down).
  const a0 = (-startAngle) * Math.PI / 180;
  const a1 = (-endAngle) * Math.PI / 180;
  const x0 = cx + r * Math.cos(a0);
  const y0 = cy + r * Math.sin(a0);
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const sweep = endAngle > startAngle ? 0 : 1;          // CCW in math → SVG sweep=0
  const delta = Math.abs(endAngle - startAngle);
  const largeArc = delta > 180 ? 1 : 0;
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweep} ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

// ─── Beat 4: Sweep ω → Z phasor rotates ──────────────────────────────────
function SweepFreqBeat() {
  const portrait = usePortrait();
  const P = plotGeom(portrait);
  const { localTime, duration: spriteDur } = useSprite();

  // We use simplified L, C constants so that at ω = 1, X = XL − XC = -2
  // (capacitive); at ω = ω₀ = √(L⁻¹C⁻¹) the reactances cancel; at ω large,
  // X becomes positive (inductive). Choose XL_FUNC = ω·0.8, XC_FUNC = 0.8/ω,
  // so resonance is at ω = 1 with X = 0.
  const LL = 0.8;
  const CC = 1 / 0.8;                  // 1/(ω·C) = 0.8/ω
  const W_MIN = 0.4;
  const W_MAX = 2.5;

  const SETUP = 1.0;
  const t = Math.max(0, localTime - SETUP);
  const rampDur = Math.max(spriteDur - SETUP - 1.5, 6);
  // Use a smooth pendulum-style sweep so ω lingers at the extremes.
  // ω goes W_MIN → W_MAX once across the beat (no reverse).
  const u = clamp(t / rampDur, 0, 1);
  const omega = W_MIN + (W_MAX - W_MIN) * u;
  const xL = omega * LL;
  const xC = (1 / omega) * (1 / CC) * 0.64;  // tune the C value so resonance lands near ω=1
  const X = xL - xC;
  const zMag = Math.sqrt(R * R + X * X);
  const phiDeg = Math.atan2(X, R) * 180 / Math.PI;

  // Tip coordinates of the Z phasor (R fixed on x-axis at R·unit; X on y).
  const tipX = P.origX + R * P.unit;
  const tipY = P.origY - X * P.unit;

  // Trail buffer: a vertical line at x = R·unit between the lowest and
  // highest X values reached so far. For simplicity we just draw the full
  // possible vertical range as a faint guide.
  const guideTopY = P.origY - (W_MAX * LL - (1 / W_MAX) * (1 / CC) * 0.64) * P.unit;
  const guideBotY = P.origY - (W_MIN * LL - (1 / W_MIN) * (1 / CC) * 0.64) * P.unit;

  // Region classification.
  const region = Math.abs(X) < 0.15 ? 'resonant'
                : (X < 0 ? 'capacitive' : 'inductive');

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={P.vbW} height={P.vbH} viewBox={`0 0 ${P.vbW} ${P.vbH}`}
           style={{ overflow: 'visible' }}>
        <ComplexAxes P={P}/>

        {/* Vertical guide line at x = R·unit (the path Z's tip traces) */}
        <SvgFadeIn duration={0.4} delay={0.1}>
          <line x1={tipX} y1={guideTopY} x2={tipX} y2={guideBotY}
                stroke="rgba(232,220,193,0.15)" strokeWidth={1}
                strokeDasharray="4 5"/>
          <text x={tipX} y={P.origY + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={14}>R</text>
        </SvgFadeIn>

        {/* Live Z phasor */}
        {t > 0 && (
          <g>
            <path d={arrowD(P.origX, P.origY, tipX, tipY, 10)}
                  fill="none" stroke="var(--amber-300)" strokeWidth={3}
                  strokeLinejoin="round"/>
            <text x={(P.origX + tipX) / 2 - 18} y={(P.origY + tipY) / 2 + (X >= 0 ? -8 : 18)}
                  textAnchor="end"
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={18}>Z</text>
            {/* Angle arc */}
            <path d={describeArc(P.origX, P.origY, 36, 0, -phiDeg)}
                  fill="none" stroke="var(--amber-300)" strokeWidth={1.4}/>
            <text x={P.origX + 44} y={P.origY + (X >= 0 ? -8 : 18)}
                  fill="var(--amber-300)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={14}>φ</text>
          </g>
        )}

        {/* Region badges along the right margin (above/at/below axis) */}
        {portrait ? (
          <SvgFadeIn duration={0.4} delay={0.6}>
            <text x={P.vbW - 30} y={P.origY - 80} textAnchor="end"
                  fill={region === 'inductive' ? 'var(--teal-400)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em"
                  opacity={region === 'inductive' ? 1 : 0.5}>INDUCTIVE</text>
            <text x={P.vbW - 30} y={P.origY + 4} textAnchor="end"
                  fill={region === 'resonant' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em"
                  opacity={region === 'resonant' ? 1 : 0.5}>RESONANT</text>
            <text x={P.vbW - 30} y={P.origY + 90} textAnchor="end"
                  fill={region === 'capacitive' ? 'var(--rose-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em"
                  opacity={region === 'capacitive' ? 1 : 0.5}>CAPACITIVE</text>
          </SvgFadeIn>
        ) : (
          <SvgFadeIn duration={0.4} delay={0.6}>
            <text x={P.vbW - 60} y={P.origY - 70} textAnchor="end"
                  fill={region === 'inductive' ? 'var(--teal-400)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em"
                  opacity={region === 'inductive' ? 1 : 0.5}>INDUCTIVE  (X &gt; 0)</text>
            <text x={P.vbW - 60} y={P.origY + 4} textAnchor="end"
                  fill={region === 'resonant' ? 'var(--amber-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em"
                  opacity={region === 'resonant' ? 1 : 0.5}>RESONANT  (X = 0)</text>
            <text x={P.vbW - 60} y={P.origY + 78} textAnchor="end"
                  fill={region === 'capacitive' ? 'var(--rose-300)' : 'var(--chalk-300)'}
                  fontFamily="var(--font-mono)" fontSize={11} letterSpacing="0.14em"
                  opacity={region === 'capacitive' ? 1 : 0.5}>CAPACITIVE  (X &lt; 0)</text>
          </SvgFadeIn>
        )}

        {/* Live numeric readout */}
        {t > 0 && (
          <text x={P.vbW / 2} y={P.sweepReadoutY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={13} letterSpacing="0.06em">
            ω = {omega.toFixed(2)}    X = {X.toFixed(2)}    |Z| = {zMag.toFixed(2)}    φ = {phiDeg.toFixed(1)}°
          </text>
        )}
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 36, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        Z = R + jX
      </FadeUp>

      <FadeUp duration={0.6} delay={1.0} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 26,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '52ch', lineHeight: 1.35,
        }}>
        one phasor, two truths about an AC circuit.
      </FadeUp>

      <FadeUp duration={0.5} delay={2.2} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        |Z| sets the current.  arg(Z) sets the lag.
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
