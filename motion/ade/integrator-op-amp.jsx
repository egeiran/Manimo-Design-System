// The Integrator Op-Amp: Square Wave In, Triangle Wave Out — Manimo lesson scene.
//
// Replace the inverting amp's feedback resistor with a capacitor and the
// virtual short turns the circuit into a time integrator:
// V_out(t) = -(1/RC) · ∫ V_in dt. A square-wave input becomes a triangle
// wave whose slope is -V_in / (RC). Genuine motion lives in Beat 4: as a
// time cursor sweeps, V_in traces a square wave on top and V_out traces
// the matching triangle wave below — the linear ramps connect to the
// flat input segments in real time.
//
// Beats (placeholder timings — overwritten by scripts/rewire-scene.js):
//    0.00– 5.00  Manimo enters; hook caption
//    5.00–16.00  Configuration — op-amp triangle, R, feedback C, V+ ground
//   16.00–28.00  Derivation — virtual short → i = V_in/R = -C·dV_out/dt → integral
//   28.00–41.00  Cursor sweep — V_in square / V_out triangle traced together
//   41.00–48.00  Takeaway
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 4 reads useSprite() localTime so cursor + trace lengths align.

const SCENE_DURATION = 58;

const NARRATION = [
  /*  0.00– 7.26 */ "What if the feedback path of an op-amp were a capacitor instead of a resistor? You'd build a time integrator.",
  /*  7.26–19.77 */ 'Same inverting topology: V plus grounded, input through R into V minus, feedback from V out back to V minus — but the feedback element is a capacitor C, not a resistor.',
  /* 19.77–32.52 */ 'Virtual short forces V minus to ground. So the current through R is V in over R, and that same current charges the capacitor — meaning dV out over dt equals minus V in over R C.',
  /* 32.52–45.98 */ 'Feed in a square wave. During each half cycle V in is constant, so V out ramps down at minus V in over R C — out comes a triangle wave whose slope is set entirely by R times C.',
  /* 45.98–58.00 */ 'An op-amp integrator turns a square wave into a triangle wave, and more generally turns any input into its running time integral — with R times C setting the slope.',
];

const NARRATION_AUDIO = 'audio/integrator-op-amp/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="operational amplifiers"
      title="The Integrator Op-Amp: Square Wave In, Triangle Wave Out"
      duration={SCENE_DURATION}
      introEnd={7.26}
      introCaption="Swap the feedback resistor for a capacitor — what do you get?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.26} end={19.77}>
        <ConfigurationBeat />
      </Sprite>

      <Sprite start={19.77} end={32.52}>
        <DerivationBeat />
      </Sprite>

      <Sprite start={32.52} end={45.98}>
        <SweepBeat />
      </Sprite>

      <Sprite start={45.98} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared op-amp glyph ─────────────────────────────────────────────────
function OpAmpShape({ cx, cy, w = 140, color = 'var(--amber-400)' }) {
  const h = w * 0.95;
  const left = cx - w / 2;
  const right = cx + w / 2;
  const top = cy - h / 2;
  const bot = cy + h / 2;
  return (
    <g>
      <path d={`M ${left} ${top} L ${left} ${bot} L ${right} ${cy} Z`}
            fill="none" stroke={color} strokeWidth={2.4}/>
      <text x={left + 18} y={cy - h * 0.32 + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={20} fontWeight="bold" textAnchor="middle">−</text>
      <text x={left + 18} y={cy + h * 0.32 + 6}
            fill="var(--chalk-100)" fontFamily="var(--font-mono)"
            fontSize={20} fontWeight="bold" textAnchor="middle">+</text>
    </g>
  );
}

function resistorHorizontalD(xLeft, xRight, cy, amp = 9, n = 6) {
  const dx = (xRight - xLeft) / n;
  const pts = [`M ${xLeft} ${cy}`];
  for (let i = 1; i < n; i++) {
    const x = xLeft + i * dx;
    const y = cy + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y}`);
  }
  pts.push(`L ${xRight} ${cy}`);
  return pts.join(' ');
}

// ─── Beat 2: Configuration — op-amp + R + feedback C + ground ───────────
function ConfigurationBeat() {
  const portrait = usePortrait();

  const G = portrait
    ? { vbW: 600, vbH: 580,
        ampCx: 360, ampCy: 290, ampW: 140,
        rInLeftX: 70, rInRightX: 210, rInY: 232,
        vMinusNodeX: 290,
        cX1: 290, cX2: 430, cY: 110,
        vOutNodeX: 430, vOutLabelX: 530,
        gndX: 290, gndY: 360,
        captionY: 530, fontLabel: 18 }
    : { vbW: 1100, vbH: 460,
        ampCx: 620, ampCy: 230, ampW: 180,
        rInLeftX: 220, rInRightX: 400, rInY: 158,
        vMinusNodeX: 530,
        cX1: 530, cX2: 820, cY: 70,
        vOutNodeX: 820, vOutLabelX: 940,
        gndX: 530, gndY: 360,
        captionY: 430, fontLabel: 20 };

  const ampH = G.ampW * 0.95;
  const vMinusY = G.ampCy - ampH * 0.32;
  const vPlusY = G.ampCy + ampH * 0.32;
  const ampLeftX = G.ampCx - G.ampW / 2;
  const ampRightX = G.ampCx + G.ampW / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Op-amp triangle */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <OpAmpShape cx={G.ampCx} cy={G.ampCy} w={G.ampW}/>
        </SvgFadeIn>

        {/* V- wire from R right end up to the input pin */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <line x1={G.rInRightX} y1={G.rInY} x2={G.vMinusNodeX} y2={G.rInY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.vMinusNodeX} y1={G.rInY} x2={G.vMinusNodeX} y2={vMinusY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.vMinusNodeX} y1={vMinusY} x2={ampLeftX} y2={vMinusY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* V- node dot */}
          <circle cx={G.vMinusNodeX} cy={vMinusY} r={3.5} fill="var(--chalk-200)"/>
        </SvgFadeIn>

        {/* R resistor: V_in → V- node */}
        <SvgFadeIn duration={0.5} delay={0.8}>
          <path d={resistorHorizontalD(G.rInLeftX, G.rInRightX, G.rInY, 10, 6)}
                fill="none" stroke="var(--amber-400)" strokeWidth={2.2}/>
          <text x={(G.rInLeftX + G.rInRightX) / 2} y={G.rInY - 18} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>R</text>
          <text x={G.rInLeftX - 14} y={G.rInY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>in</tspan>
          </text>
          {/* V_in entry dot */}
          <circle cx={G.rInLeftX} cy={G.rInY} r={3.5} fill="var(--amber-300)"/>
        </SvgFadeIn>

        {/* Output wire: op-amp tip → V_out node, plus down to feedback corner */}
        <SvgFadeIn duration={0.4} delay={1.1}>
          <line x1={ampRightX} y1={G.ampCy} x2={G.vOutNodeX} y2={G.ampCy}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.vOutNodeX} y1={G.ampCy} x2={G.vOutLabelX - 18} y2={G.ampCy}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={G.vOutLabelX} y={G.ampCy + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>out</tspan>
          </text>
          <circle cx={G.vOutNodeX} cy={G.ampCy} r={3.5} fill="var(--chalk-200)"/>
        </SvgFadeIn>

        {/* Feedback capacitor: from V_out node up to the V- node */}
        <SvgFadeIn duration={0.5} delay={1.3}>
          {/* Wire up from V_out node to the cap-bottom row, then to V- node row above */}
          <line x1={G.vOutNodeX} y1={G.ampCy} x2={G.vOutNodeX} y2={G.cY + 16}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* Cap plates at y=cY (top) and y=cY+16 (bottom), centred at (cX2-30, cY+8) */}
          {(() => {
            const cMidX = (G.cX1 + G.cX2) / 2;
            const plateLen = 30;
            return (
              <>
                <line x1={cMidX - plateLen / 2} y1={G.cY}
                      x2={cMidX + plateLen / 2} y2={G.cY}
                      stroke="var(--rose-400)" strokeWidth={3}/>
                <line x1={cMidX - plateLen / 2} y1={G.cY + 16}
                      x2={cMidX + plateLen / 2} y2={G.cY + 16}
                      stroke="var(--rose-400)" strokeWidth={3}/>
                {/* Wires above and below the cap plates */}
                <line x1={cMidX} y1={G.cY - 24} x2={cMidX} y2={G.cY}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
                <line x1={cMidX} y1={G.cY + 16} x2={cMidX} y2={G.cY + 40}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
                {/* Top horizontal wire: cap → V- node corner */}
                <line x1={G.cX1} y1={G.cY - 24} x2={cMidX} y2={G.cY - 24}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
                <line x1={G.cX1} y1={vMinusY} x2={G.cX1} y2={G.cY - 24}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
                {/* Bottom horizontal wire: cap → V_out node corner */}
                <line x1={cMidX} y1={G.cY + 40} x2={G.cX2} y2={G.cY + 40}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
                <line x1={G.cX2} y1={G.cY + 40} x2={G.cX2} y2={G.ampCy}
                      stroke="var(--chalk-200)" strokeWidth={2}/>
                {/* C label */}
                <text x={cMidX + plateLen / 2 + 14} y={G.cY + 12}
                      fill="var(--rose-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={G.fontLabel}>C</text>
              </>
            );
          })()}
        </SvgFadeIn>

        {/* V+ → ground */}
        <SvgFadeIn duration={0.4} delay={1.7}>
          <line x1={ampLeftX} y1={vPlusY} x2={G.gndX} y2={vPlusY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.gndX} y1={vPlusY} x2={G.gndX} y2={G.gndY - 20}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* Ground symbol */}
          <line x1={G.gndX - 16} y1={G.gndY - 20} x2={G.gndX + 16} y2={G.gndY - 20}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.gndX - 10} y1={G.gndY - 12} x2={G.gndX + 10} y2={G.gndY - 12}
                stroke="var(--chalk-200)" strokeWidth={1.7}/>
          <line x1={G.gndX - 5} y1={G.gndY - 4} x2={G.gndX + 5} y2={G.gndY - 4}
                stroke="var(--chalk-200)" strokeWidth={1.4}/>
        </SvgFadeIn>

        {/* V- label */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={G.vMinusNodeX + 12} y={vMinusY - 8}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel - 2}>
            V<tspan baselineShift="sub" fontSize={(G.fontLabel - 2) * 0.65}>−</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={7.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            the cap in feedback turns time into voltage
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Derivation — three-step chain → integral payoff ────────────
function DerivationBeat() {
  const portrait = usePortrait();
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 26 : 30, letterSpacing: '0.02em',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 26,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        KCL at the virtual ground
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        V₋ ≈ 0   (virtual ground)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.5} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        i = V<sub style={{ fontSize: '70%' }}>in</sub> / R
      </FadeUp>

      <FadeUp duration={0.5} delay={2.8} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        i = −C · dV<sub style={{ fontSize: '70%' }}>out</sub> / dt
      </FadeUp>

      <FadeUp duration={0.4} delay={4.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 22,
          color: 'var(--chalk-300)', lineHeight: 1,
        }}>
        ↓
      </FadeUp>

      <FadeUp duration={0.6} delay={4.5} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 32 : 42, color: 'var(--amber-300)',
          letterSpacing: '0.02em', textAlign: 'center',
          maxWidth: portrait ? '22ch' : 'none',
        }}>
        V<sub style={{ fontSize: '70%' }}>out</sub>(t) = −(1/RC) ∫ V<sub style={{ fontSize: '70%' }}>in</sub> dt
      </FadeUp>

      <FadeUp duration={0.4} delay={6.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '26ch' : 'none', lineHeight: 1.4,
        }}>
        a running integral, scaled by minus one over R C
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Cursor sweep — square in, triangle out ─────────────────────
// V_in is a unit-amplitude square wave: +1 for 0<t<1, -1 for 1<t<2, +1 for
// 2<t<3, -1 for 3<t<4 (period 2, four half-cycles). V_out is its running
// negative integral scaled by 1/RC — with RC chosen so slope is ±1/unit, the
// output is a triangle wave whose peak-to-peak is 1 unit.
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 700, panelX: 80, panelW: 460,
        inY: 110, inH: 160, outY: 360, outH: 220,
        captionY: 660, fontEyebrow: 10 }
    : { vbW: 1100, vbH: 460, panelX: 130, panelW: 840,
        inY: 60, inH: 140, outY: 240, outH: 180,
        captionY: 430, fontEyebrow: 11 };

  // Sweep timing.
  const HOLD = 1.0;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 2.0, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);

  // Signal time: t ∈ [0, 4]. Square period 2 (half-cycle = 1).
  const TOTAL_T = 4;
  const inMid = G.inY + G.inH / 2;
  const inHigh = G.inY + 14;
  const inLow = G.inY + G.inH - 14;
  const outMid = G.outY + G.outH / 2;
  const outHigh = G.outY + 22;
  const outLow = G.outY + G.outH - 22;

  function vinAt(t) {
    // +1 for 0..1, -1 for 1..2, +1 for 2..3, -1 for 3..4
    const seg = Math.floor(t);
    return seg % 2 === 0 ? 1 : -1;
  }
  function voutAt(t) {
    // V_out(t) = -∫_0^t V_in(s) ds  (with RC=1 → unit slope)
    let acc = 0;
    let s = 0;
    while (s < t) {
      const seg = Math.floor(s);
      const segEnd = Math.min(seg + 1, t);
      acc += -vinAt(s) * (segEnd - s);
      s = segEnd;
    }
    return acc;
  }

  // Cursor signal-time + screen-x
  const cursorT = traceFrac * TOTAL_T;
  const cursorX = G.panelX + traceFrac * G.panelW;

  // Build the V_in step polyline up to cursorT (sharp vertical edges).
  function buildInPath(upTo) {
    const dxPer = G.panelW / TOTAL_T;
    const pts = [];
    let t = 0;
    let v = vinAt(0);
    const xy = (tt, vv) => `${G.panelX + tt * dxPer},${vv > 0 ? inHigh : inLow}`;
    pts.push('M ' + xy(0, v));
    while (t < upTo) {
      const nextStep = Math.floor(t) + 1;
      const segEnd = Math.min(nextStep, upTo);
      pts.push('L ' + xy(segEnd, v));
      if (segEnd >= upTo) break;
      const nv = vinAt(segEnd + 1e-9);
      pts.push('L ' + xy(segEnd, nv));
      v = nv;
      t = segEnd;
    }
    return pts.join(' ');
  }
  // Build V_out piecewise-linear polyline up to cursorT.
  function buildOutPath(upTo) {
    const dxPer = G.panelW / TOTAL_T;
    const yOf = vv => outMid - vv * ((outMid - outHigh));
    const pts = [`M ${G.panelX + 0 * dxPer},${yOf(voutAt(0))}`];
    let t = 0;
    while (t < upTo) {
      const nextStep = Math.floor(t) + 1;
      const segEnd = Math.min(nextStep, upTo);
      pts.push(`L ${G.panelX + segEnd * dxPer},${yOf(voutAt(segEnd))}`);
      if (segEnd >= upTo) break;
      t = segEnd;
    }
    return pts.join(' ');
  }
  const inD = buildInPath(cursorT);
  const outD = buildOutPath(cursorT);

  // Current V_in/V_out values for cursor dots
  const inDotY = vinAt(cursorT - 1e-9) > 0 ? inHigh : inLow;
  const outDotY = outMid - voutAt(cursorT) * ((outMid - outHigh));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Row labels */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.inY - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V_IN</text>
          <text x={G.panelX} y={G.outY - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V_OUT</text>
        </SvgFadeIn>

        {/* Baselines (zero-volts horizontal lines) */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.panelX} y1={inMid} x2={G.panelX + G.panelW} y2={inMid}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                strokeDasharray="3 3"/>
          <line x1={G.panelX} y1={outMid} x2={G.panelX + G.panelW} y2={outMid}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}
                strokeDasharray="3 3"/>
        </SvgFadeIn>

        {/* +1 / -1 reference marks on V_in row */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={G.panelX - 4} y1={inHigh} x2={G.panelX + 4} y2={inHigh}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <text x={G.panelX - 10} y={inHigh + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={10}>+V</text>
          <line x1={G.panelX - 4} y1={inLow} x2={G.panelX + 4} y2={inLow}
                stroke="var(--chalk-300)" strokeWidth={1}/>
          <text x={G.panelX - 10} y={inLow + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={10}>−V</text>
        </SvgFadeIn>

        {/* V_in trace (white) */}
        {inD && inD.length > 4 && (
          <path d={inD} fill="none"
                stroke="var(--chalk-100)" strokeWidth={2.4}
                strokeLinecap="round" strokeLinejoin="miter"/>
        )}
        {/* V_out trace (amber triangle) */}
        {outD && outD.length > 4 && (
          <path d={outD} fill="none"
                stroke="var(--amber-400)" strokeWidth={2.6}
                strokeLinecap="round" strokeLinejoin="round"/>
        )}

        {/* Time cursor + dots */}
        {traceFrac > 0.005 && traceFrac < 0.995 && (
          <g>
            <line x1={cursorX} y1={G.inY - 6} x2={cursorX} y2={G.outY + G.outH + 6}
                  stroke="var(--chalk-200)" strokeWidth={1} strokeDasharray="2 4" opacity={0.55}/>
            <circle cx={cursorX} cy={inDotY} r={5}
                    fill="var(--chalk-100)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
            <circle cx={cursorX} cy={outDotY} r={5}
                    fill="var(--amber-400)" stroke="var(--bg-canvas)" strokeWidth={1.5}/>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={9.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 16 : 18}>
            during each flat half-cycle, V_out ramps linearly
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
          fontSize: portrait ? 26 : 32, color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '44ch', lineHeight: 1.3,
        }}>
        Output is the running integral of the input.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 28, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        Slope = −V<sub style={{ fontSize: '70%' }}>in</sub> / RC
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 8, maxWidth: portrait ? '32ch' : 'none',
          textTransform: 'uppercase',
        }}>
        the building block of every analog integrator
      </FadeUp>
    </div>
  );
}

// Expose narration for TTS / subtitle export.
window.sceneNarration = NARRATION;

// ─── Mount ───────────────────────────────────────────────────────────────
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
