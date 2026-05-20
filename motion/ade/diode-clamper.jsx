// The Diode Clamper — Manimo lesson scene.
// A series capacitor and a shunt diode lift an entire AC waveform off zero
// without distorting its shape. The cap charges on the first negative
// half-cycle and after that acts as a constant DC offset every cycle
// thereafter — the textbook "DC restorer" trick.
//
// Beats (placeholder timings — overwritten by rewire-scene.js):
//    0.00– 6.00  Manimo intro: same shape, lifted DC level
//    6.00–18.00  Schematic — series C, shunt diode to ground, V_out tap
//   18.00–30.00  Charging cycle — V_in goes negative, diode conducts, V_C → V_p
//   30.00–42.00  Steady state — synchronized scope traces (V_in vs V_out + V_p)
//   42.00–50.00  Takeaway — DC restorer, flip the diode to clamp the other way
//
// Authoring notes:
//   • Beat 3 ("charging") is one of the motion beats: the diode highlights
//     during V_in < 0, charge dots pile onto the cap's right plate, and a
//     V_C readout climbs from 0 to V_p along an RC-style curve.
//   • Beat 4 ("steady state") is the other motion beat: useSprite() drives
//     a cursor across both scopes; the V_out trace is V_in shifted up by V_p
//     so the shapes are identical but the baselines differ by exactly V_p.
//   • Every component branches on usePortrait().

const SCENE_DURATION = 63;

const NARRATION = [
  /*  0.00– 6.00 */ "A sine wave goes in centred on zero. It comes out the same shape — but lifted up. How does one diode and one capacitor do that?",
  /*  6.00–18.00 */ "Put a capacitor in series with the input. Put a diode from the output back down to ground, anode on the bottom. Tap the output across the diode. That is the entire circuit.",
  /* 18.00–30.00 */ "On the first negative half cycle, V in pulls the cap's right plate down. The diode turns on, clamping the output to zero, and the cap charges to V peak. After that, the diode stays off, and the cap holds its charge.",
  /* 30.00–42.00 */ "Now look at steady state. V out equals V in plus V cap. The shape of the input is preserved exactly — but every point sits one V peak higher. The whole waveform has been lifted off zero.",
  /* 42.00–50.00 */ "That is a DC restorer — keep the AC, shift the DC. Flip the diode and the waveform shifts down instead. Television video signals once leaned on this trick on every line.",
];

const NARRATION_AUDIO = 'audio/diode-clamper/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="diodes"
      title="The Diode Clamper: Lift the AC, Keep the Shape"
      duration={SCENE_DURATION}
      introEnd={9.4}
      introCaption="Same shape — different DC level. One diode and one capacitor."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.4} end={20.47}>
        <SchematicBeat />
      </Sprite>

      <Sprite start={20.47} end={35.55}>
        <ChargingCycleBeat />
      </Sprite>

      <Sprite start={35.55} end={49.74}>
        <SteadyStateBeat />
      </Sprite>

      <Sprite start={49.74} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────

// Diode symbol — triangle pointing in the direction of conventional current
// (anode → cathode), with a bar on the cathode side. `cx, cy` is centre;
// the symbol is `w` wide and `h` tall; `orient` rotates the symbol so the
// triangle points UP (current flows from below to above) or DOWN.
function DiodeSymbol({ cx, cy, w = 22, h = 26, orient = 'up', color = 'var(--rose-400)', highlight = false }) {
  const half = w / 2;
  // 'up' = triangle apex at top, bar across the top
  if (orient === 'up') {
    return (
      <g>
        <path d={`M ${cx - half} ${cy + h / 2} L ${cx + half} ${cy + h / 2} L ${cx} ${cy - h / 2} Z`}
              fill={highlight ? color : 'rgba(232,122,144,0.15)'}
              stroke={color} strokeWidth={1.8}/>
        <line x1={cx - half} y1={cy - h / 2} x2={cx + half} y2={cy - h / 2}
              stroke={color} strokeWidth={2.4}/>
      </g>
    );
  }
  // 'down' (unused here but parametric for clarity)
  return (
    <g>
      <path d={`M ${cx - half} ${cy - h / 2} L ${cx + half} ${cy - h / 2} L ${cx} ${cy + h / 2} Z`}
            fill={highlight ? color : 'rgba(232,122,144,0.15)'}
            stroke={color} strokeWidth={1.8}/>
      <line x1={cx - half} y1={cy + h / 2} x2={cx + half} y2={cy + h / 2}
            stroke={color} strokeWidth={2.4}/>
    </g>
  );
}

// Capacitor symbol — two parallel plates, horizontal pair when orient='horizontal'.
// Wires extending outward are drawn by the caller.
function CapSymbol({ cx, cy, plateLen = 22, gap = 8, color = 'var(--amber-400)' }) {
  return (
    <g>
      <line x1={cx - gap / 2} y1={cy - plateLen / 2} x2={cx - gap / 2} y2={cy + plateLen / 2}
            stroke={color} strokeWidth={2.8}/>
      <line x1={cx + gap / 2} y1={cy - plateLen / 2} x2={cx + gap / 2} y2={cy + plateLen / 2}
            stroke={color} strokeWidth={2.8}/>
    </g>
  );
}

// Ground symbol — three horizontal lines, descending in length, centred at (cx, cy).
function GroundSymbol({ cx, cy, color = 'var(--chalk-200)' }) {
  return (
    <g>
      <line x1={cx - 14} y1={cy} x2={cx + 14} y2={cy} stroke={color} strokeWidth={2}/>
      <line x1={cx - 9}  y1={cy + 6} x2={cx + 9}  y2={cy + 6} stroke={color} strokeWidth={1.6}/>
      <line x1={cx - 4}  y1={cy + 12} x2={cx + 4}  y2={cy + 12} stroke={color} strokeWidth={1.3}/>
    </g>
  );
}

// AC source — circle with a small sine glyph inside.
function ACSource({ cx, cy, r = 22, color = 'var(--chalk-100)' }) {
  // sine glyph: small s-curve from -r/2 to +r/2
  const w = r * 1.2;
  const pts = [];
  const N = 18;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const x = cx - w / 2 + u * w;
    const y = cy - Math.sin(u * Math.PI * 2) * (r * 0.35);
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--bg-canvas)" opacity={0.92}
              stroke={color} strokeWidth={2}/>
      <path d={pts.join(' ')} fill="none"
            stroke={color} strokeWidth={1.6}/>
    </g>
  );
}

// Sample a curve y = fn(t) for t in [0, 1] into an SVG path.
function sampleSineD(fn, x0, yBaseline, width, amplitude, samples = 160) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = x0 + u * width;
    const y = yBaseline - fn(u) * amplitude;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

// ─── Beat 2: Schematic ────────────────────────────────────────────────────
function SchematicBeat() {
  const portrait = usePortrait();

  // Layout points (in svg coords). Source on the left → cap → output node
  // → diode shunts down to ground; output tap rises off the node.
  const G = portrait
    ? { vbW: 600, vbH: 580,
        srcX: 100, srcY: 320, srcR: 26,
        capCx: 280, capY: 320,
        outX: 440, outY: 320,
        diodeCx: 440, diodeCy: 410,
        gndCx: 440, gndY: 480,
        outTapX: 440, outTapTopY: 220, outLabelX: 440, outLabelY: 200,
        captionY: 540, fontMain: 18, fontCap: 13 }
    : { vbW: 1100, vbH: 420,
        srcX: 160, srcY: 220, srcR: 28,
        capCx: 420, capY: 220,
        outX: 660, outY: 220,
        diodeCx: 660, diodeCy: 310,
        gndCx: 660, gndY: 370,
        outTapX: 660, outTapTopY: 130, outLabelX: 660, outLabelY: 110,
        captionY: 400, fontMain: 20, fontCap: 14 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* AC source on left */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <ACSource cx={G.srcX} cy={G.srcY} r={G.srcR}/>
          <text x={G.srcX} y={G.srcY + G.srcR + 18} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* Wire: source → cap left plate */}
        <TraceIn
          d={`M ${G.srcX + G.srcR} ${G.srcY} L ${G.capCx - 12} ${G.capY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.6} delay={0.8}/>

        {/* Capacitor */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <CapSymbol cx={G.capCx} cy={G.capY}/>
          <text x={G.capCx} y={G.capY - 28} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>C</text>
        </SvgFadeIn>

        {/* Wire: cap right plate → output node */}
        <TraceIn
          d={`M ${G.capCx + 12} ${G.capY} L ${G.outX} ${G.outY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={1.8}/>

        {/* Output node dot */}
        <SvgFadeIn duration={0.3} delay={2.2}>
          <circle cx={G.outX} cy={G.outY} r={3.5} fill="var(--chalk-100)"/>
        </SvgFadeIn>

        {/* Wire down to diode */}
        <TraceIn
          d={`M ${G.outX} ${G.outY} L ${G.diodeCx} ${G.diodeCy - 14}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.5} delay={2.4}/>

        {/* Diode — apex up: anode at the bottom, cathode at the top.
            So when V_out < 0 the diode conducts (current flows up through
            the diode into the output node from ground). */}
        <SvgFadeIn duration={0.4} delay={2.9}>
          <DiodeSymbol cx={G.diodeCx} cy={G.diodeCy} orient="up"/>
          <text x={G.diodeCx + 22} y={G.diodeCy + 4}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>D</text>
        </SvgFadeIn>

        {/* Wire from diode bottom → ground */}
        <TraceIn
          d={`M ${G.diodeCx} ${G.diodeCy + 14} L ${G.gndCx} ${G.gndY - 6}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={3.3}/>

        {/* Ground */}
        <SvgFadeIn duration={0.3} delay={3.5}>
          <GroundSymbol cx={G.gndCx} cy={G.gndY}/>
        </SvgFadeIn>

        {/* Output tap — wire going UP from the output node to a free label */}
        <TraceIn
          d={`M ${G.outX} ${G.outY} L ${G.outTapX} ${G.outTapTopY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={3.9}/>

        {/* V_out label */}
        <SvgFadeIn duration={0.35} delay={4.2}>
          <text x={G.outLabelX} y={G.outLabelY} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan>
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCap} letterSpacing="0.02em">
            {portrait
              ? 'series cap, shunt diode — the rest is wires'
              : 'series cap, shunt diode — the rest is just wires'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Charging cycle — diode conducts, cap charges to V_p ─────────
// First negative half-cycle: V_in pulls the cap's right plate toward
// −V_p. Output tries to follow but is clamped at 0 by the now-conducting
// diode. V_C (left plate − right plate) climbs from 0 to +V_p over the
// duration of one half-cycle. After that, diode stays off and V_C holds.
function ChargingCycleBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Animation phases inside the beat:
  //   0 .. HOLD          : circuit fades in (no animation)
  //   HOLD .. HOLD+CHARGE: V_in dips to −V_p, diode glows, V_C ramps up
  //   HOLD+CHARGE..end   : V_C stays at V_p, diode off
  const HOLD = 0.6;
  const CHARGE = Math.min(2.8, spriteDur - HOLD - 2);
  const tCharge = clamp((localTime - HOLD) / CHARGE, 0, 1);
  const eased = Easing.easeOutCubic(tCharge);
  // V_in profile: dips to −1 (normalised) along a smooth half-cosine, then
  // returns toward 0. After the charge phase, freeze at 0 so the diode
  // narrative is clean.
  const vinFrac = -Math.sin(tCharge * Math.PI);   // −1 at midpoint, 0 at ends
  const vCFrac = eased;                            // 0 → 1 over the charge phase
  const diodeOn = tCharge > 0.05 && tCharge < 0.99;
  const vinValue = vinFrac.toFixed(2);
  const vCValue = vCFrac.toFixed(2);

  // Geometry — diagram on top, readout panel below.
  const G = portrait
    ? { vbW: 600, vbH: 720,
        srcX: 100, srcY: 250, srcR: 26,
        capCx: 280, capY: 250,
        outX: 440, outY: 250,
        diodeCx: 440, diodeCy: 350,
        gndCx: 440, gndY: 420,
        panelX: 60, panelY: 480, panelW: 480, panelH: 200,
        fontMain: 18, fontReadout: 18 }
    : { vbW: 1100, vbH: 460,
        srcX: 180, srcY: 200, srcR: 28,
        capCx: 420, capY: 200,
        outX: 660, outY: 200,
        diodeCx: 660, diodeCy: 290,
        gndCx: 660, gndY: 360,
        panelX: 800, panelY: 130, panelW: 280, panelH: 260,
        fontMain: 20, fontReadout: 20 };

  // Cap plate polarity markers — left plate is + when V_C > 0 (charged).
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Static schematic — fade in first */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <ACSource cx={G.srcX} cy={G.srcY} r={G.srcR}/>
          <line x1={G.srcX + G.srcR} y1={G.srcY} x2={G.capCx - 12} y2={G.capY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <CapSymbol cx={G.capCx} cy={G.capY}/>
          <line x1={G.capCx + 12} y1={G.capY} x2={G.outX} y2={G.outY}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <circle cx={G.outX} cy={G.outY} r={3.5} fill="var(--chalk-100)"/>
          <line x1={G.outX} y1={G.outY} x2={G.diodeCx} y2={G.diodeCy - 14}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.diodeCx} y1={G.diodeCy + 14} x2={G.gndCx} y2={G.gndY - 6}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <GroundSymbol cx={G.gndCx} cy={G.gndY}/>
          {/* Out-tap up */}
          <line x1={G.outX} y1={G.outY} x2={G.outX} y2={G.outY - 60}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <text x={G.outX} y={G.outY - 70} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan> ≈ 0
          </text>
          {/* V_in label */}
          <text x={G.srcX} y={G.srcY + G.srcR + 20} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
          {/* C label */}
          <text x={G.capCx} y={G.capY - 26} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>C</text>
        </SvgFadeIn>

        {/* Diode — highlights when conducting */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <DiodeSymbol cx={G.diodeCx} cy={G.diodeCy} orient="up"
                       highlight={diodeOn}/>
        </SvgFadeIn>

        {/* Cap polarity marks (+ on left plate, − on right) appear as V_C
            rises. Opacity tracks charge level so the polarity reveal feels
            physical. */}
        <g opacity={vCFrac}>
          <text x={G.capCx - 18} y={G.capY - 14}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={14} textAnchor="middle">+</text>
          <text x={G.capCx + 18} y={G.capY - 14}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={14} textAnchor="middle">−</text>
        </g>

        {/* Charge dots flowing on the ground-return path while the diode
            conducts: they walk from ground up through the diode into the
            output node, around onto the cap's right plate. */}
        {diodeOn && (
          <g>
            {[0, 0.25, 0.5, 0.75].map((phase, i) => {
              // u in [0,1]: ground → diode bottom → diode top → outNode → cap
              const u = (tCharge * 2 + phase) % 1;
              const seg = u < 0.4
                ? { // ground rail up to diode bottom
                    a: { x: G.gndCx, y: G.gndY - 6 },
                    b: { x: G.diodeCx, y: G.diodeCy + 14 },
                    s: u / 0.4 }
                : u < 0.7
                ? { // through the diode body
                    a: { x: G.diodeCx, y: G.diodeCy + 14 },
                    b: { x: G.diodeCx, y: G.diodeCy - 14 },
                    s: (u - 0.4) / 0.3 }
                : { // up to outNode, then left toward the cap's right plate
                    a: { x: G.diodeCx, y: G.diodeCy - 14 },
                    b: { x: G.capCx + 12, y: G.capY },
                    s: (u - 0.7) / 0.3 };
              const x = seg.a.x + (seg.b.x - seg.a.x) * seg.s;
              const y = seg.a.y + (seg.b.y - seg.a.y) * seg.s;
              return <circle key={i} cx={x} cy={y} r={3.4}
                             fill="var(--rose-400)" opacity={0.85}/>;
            })}
          </g>
        )}

        {/* Live readout panel */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <rect x={G.panelX} y={G.panelY} width={G.panelW} height={G.panelH}
                rx={10} fill="rgba(244,184,96,0.05)"
                stroke="rgba(232,220,193,0.10)" strokeWidth={1}/>
          <text x={G.panelX + 20} y={G.panelY + 26}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.16em">FIRST NEGATIVE HALF-CYCLE</text>
          {/* V_in row */}
          <text x={G.panelX + 20} y={G.panelY + 70}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontReadout}>
            V<tspan baselineShift="sub" fontSize={G.fontReadout * 0.6}>in</tspan>
          </text>
          <text x={G.panelX + G.panelW - 20} y={G.panelY + 70} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.fontReadout}>{vinValue} · V<tspan baselineShift="sub" fontSize={G.fontReadout * 0.55}>p</tspan></text>
          {/* V_C row */}
          <text x={G.panelX + 20} y={G.panelY + 108}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontReadout}>
            V<tspan baselineShift="sub" fontSize={G.fontReadout * 0.6}>C</tspan>
          </text>
          <text x={G.panelX + G.panelW - 20} y={G.panelY + 108} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontReadout}>{vCValue} · V<tspan baselineShift="sub" fontSize={G.fontReadout * 0.55}>p</tspan></text>
          {/* Diode state row */}
          <text x={G.panelX + 20} y={G.panelY + 146}
                fill="var(--chalk-200)" fontFamily="var(--font-sans)"
                fontSize={13} letterSpacing="0.04em">diode</text>
          <text x={G.panelX + G.panelW - 20} y={G.panelY + 146} textAnchor="end"
                fill={diodeOn ? 'var(--rose-300)' : 'var(--chalk-300)'}
                fontFamily="var(--font-mono)" fontSize={13} letterSpacing="0.14em">
            {diodeOn ? 'ON · conducts' : 'OFF · holds'}
          </text>
          {/* Caption row */}
          <text x={G.panelX + G.panelW / 2} y={G.panelY + 180} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={13}>
            charge piles on C → V<tspan baselineShift="sub" fontSize={9}>C</tspan> → V<tspan baselineShift="sub" fontSize={9}>p</tspan>
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Steady state — synchronised scope traces ────────────────────
// V_in is a sine centred on 0 (range −V_p..+V_p). V_out = V_in + V_p, so
// it's the SAME shape centred on +V_p (range 0..+2V_p). A common cursor
// sweeps both panels so the eye can compare any matching pair of points.
function SteadyStateBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.8;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 1.6, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);
  const CYCLES = 2;

  // Portrait stacks the two scopes; landscape sits side-by-side.
  const G = portrait
    ? { vbW: 600, vbH: 720,
        panelX: 60, panelW: 480,
        vinY0: 80, vinH: 250, voutY0: 380, voutH: 250,
        captionY: 695, fontLabel: 12, fontEyebrow: 10 }
    : { vbW: 1100, vbH: 440,
        panelX: 80, panelW: 940,
        vinY0: 40, vinH: 160, voutY0: 240, voutH: 160,
        captionY: 420, fontLabel: 13, fontEyebrow: 11 };

  // V_in scope: y goes from V_p (top) to −V_p (bottom). Centre is the baseline.
  const vinBase = G.vinY0 + G.vinH / 2;
  // V_out scope: y goes from 2V_p (top) to 0 (bottom). Baseline (V_p) is also at the centre.
  const voutBase = G.voutY0 + G.voutH / 2;
  // amplitude in pixels — half the panel height minus a small margin
  const ampPx = (G.vinH / 2) * 0.82;

  const vinD = sampleSineD(
    (u) => Math.sin(2 * Math.PI * CYCLES * u),
    G.panelX, vinBase, G.panelW, ampPx,
  );
  const voutD = sampleSineD(
    (u) => Math.sin(2 * Math.PI * CYCLES * u),  // same shape …
    G.panelX, voutBase, G.panelW, ampPx,        // … plotted in the lower panel
  );

  const cursorX = G.panelX + G.panelW * traceFrac;
  // value at cursor (normalised −1..+1)
  const phase = traceFrac;
  const vinFrac = Math.sin(2 * Math.PI * CYCLES * phase);
  // V_out_frac = vinFrac + 1 (offset by +V_p on the normalised scale)
  const voutFrac = vinFrac + 1;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Eyebrows */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.vinY0 - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V_IN</text>
          <text x={G.panelX} y={G.voutY0 - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V_OUT</text>
        </SvgFadeIn>

        {/* Panel frames + zero/baseline lines */}
        <SvgFadeIn duration={0.4} delay={0.15}>
          {/* V_in: dashed frame, solid centre axis at 0 V */}
          <rect x={G.panelX} y={G.vinY0} width={G.panelW} height={G.vinH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.42}/>
          <line x1={G.panelX} y1={vinBase} x2={G.panelX + G.panelW} y2={vinBase}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>
          <text x={G.panelX - 8} y={vinBase + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
          {/* V_out: dashed frame, solid floor at 0 V (bottom of panel), dashed
              baseline at +V_p (centre line, drawn faintly). */}
          <rect x={G.panelX} y={G.voutY0} width={G.panelW} height={G.voutH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.42}/>
          {/* zero-volt floor */}
          <line x1={G.panelX} y1={G.voutY0 + G.voutH}
                x2={G.panelX + G.panelW} y2={G.voutY0 + G.voutH}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.85}/>
          <text x={G.panelX - 8} y={G.voutY0 + G.voutH + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>0</text>
          {/* V_p baseline at the centre of the output panel */}
          <line x1={G.panelX} y1={voutBase} x2={G.panelX + G.panelW} y2={voutBase}
                stroke="var(--amber-300)" strokeWidth={1}
                strokeDasharray="4 4" opacity={0.55}/>
          <text x={G.panelX - 8} y={voutBase + 4} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={11}>V_p</text>
        </SvgFadeIn>

        {/* Traces */}
        <TraceIn d={vinD}
          stroke="var(--chalk-100)" strokeWidth={2.2}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}/>
        <TraceIn d={voutD}
          stroke="var(--amber-300)" strokeWidth={2.4}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}/>

        {/* Cursor */}
        {traceFrac > 0 && traceFrac < 1 && (
          <g>
            <line x1={cursorX} y1={G.vinY0}
                  x2={cursorX} y2={G.voutY0 + G.voutH}
                  stroke="var(--rose-300)" strokeWidth={1.2}
                  strokeDasharray="4 4" opacity={0.75}/>
            {/* dot on V_in */}
            <circle cx={cursorX} cy={vinBase - vinFrac * ampPx} r={4}
                    fill="var(--chalk-100)"/>
            {/* dot on V_out */}
            <circle cx={cursorX} cy={voutBase - vinFrac * ampPx} r={4}
                    fill="var(--amber-300)"/>
          </g>
        )}

        {/* +V_p offset arrow connecting the two cursor dots (only when
            cursor is well inside the panels, to avoid edge clipping). */}
        {traceFrac > 0.06 && traceFrac < 0.94 && (
          <g>
            <line x1={cursorX + 12} y1={vinBase - vinFrac * ampPx}
                  x2={cursorX + 12} y2={voutBase - vinFrac * ampPx}
                  stroke="var(--rose-400)" strokeWidth={1.4}/>
            <path d={`M ${cursorX + 12} ${voutBase - vinFrac * ampPx} l -5 -7 l 10 0 z`}
                  fill="var(--rose-400)"/>
            <text x={cursorX + 22} y={(vinBase + voutBase) / 2 - vinFrac * ampPx + 4}
                  fill="var(--rose-300)" fontFamily="var(--font-mono)"
                  fontSize={11} letterSpacing="0.10em">+V_p</text>
          </g>
        )}

        {/* Diode-state badge: OFF throughout this beat (cap holds, no
            conduction). Positioned in the upper-right. */}
        <SvgFadeIn duration={0.4} delay={HOLD - 0.2}>
          <rect x={G.panelX + G.panelW - 132} y={G.vinY0 - 32}
                width={130} height={22}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}
                rx={4}/>
          <text x={G.panelX + G.panelW - 132 + 65}
                y={G.vinY0 - 16} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.14em">DIODE: OFF</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={TRACE_DUR + 0.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.75}>out</tspan> = V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.75}>in</tspan> + V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.75}>p</tspan>{'   '}— same shape, baseline raised
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
          fontSize: portrait ? 30 : 40, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '20ch' : 'none',
        }}>
        AC shape preserved · DC level shifted
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '44ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        flip the diode and the whole waveform clamps the other way
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        a DC restorer — one trick, every TV line, once
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
