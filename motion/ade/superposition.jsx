// Superposition: One Source at a Time — Manimo lesson scene.
// A two-source linear circuit (V1 on the left, I2 on the right) drives a
// shared load R_L. Compute the current through R_L by zeroing one source
// at a time: kill the current source (open it) for the V1 response, kill
// the voltage source (short it) for the I2 response, then sum. Linear =
// sources add independently.
//
// Beats (timed to single-track narration in motion/ade/audio/superposition/):
//    0.00– 5.00  Manimo intro + hook caption
//    5.00–14.00  Setup — full circuit, both sources active, "what's I_L?"
//   14.00–24.00  Kill I2: replace with open; V1-only current dots through R_L (rightward)
//   24.00–34.00  Kill V1: replace with short; I2-only current dots through R_L (leftward)
//   34.00–44.00  Sum + linearity takeaway
//
// Authoring notes:
//   • Shared circuit geometry lives in circuitGeometry(portrait); the three
//     diagram beats all reuse it so the schematic stays anchored across beats.
//   • Charge dots are driven from useSprite() localTime so the "current flowing"
//     visualisation is genuinely time-dependent, not a static label.
//   • Beat 3 / Beat 4 flip dot direction by negating the phase increment.

const SCENE_DURATION = 51;

const NARRATION = [
  /*  0.00– 5.00 */ "Two sources, one resistor — what's the current through it? Mesh equations work, but there's a slicker way.",
  /*  5.00–14.00 */ "Here's the circuit. A voltage source V one on the left, a current source I two on the right, and a load resistor R L in the middle.",
  /* 14.00–24.00 */ "Step one: kill the current source — replace it with an open circuit. Now only V one drives the network. Charge flows along this path, and the current through R L is the first contribution.",
  /* 24.00–34.00 */ "Step two: bring back the current source, but kill V one — replace it with a short. Now I two drives the network. Charge flows the other way through R L; that's the second contribution.",
  /* 34.00–44.00 */ "Add the two contributions and you've found the current with both sources live. Superposition works because the circuit is linear — sources add their effects independently.",
];

const NARRATION_AUDIO = 'audio/superposition/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="linear circuits"
      title="Superposition: One Source at a Time"
      duration={SCENE_DURATION}
      introEnd={6.5}
      introCaption="Two sources, one current — solve them one at a time."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.5} end={15.15}>
        <SetupBeat />
      </Sprite>

      <Sprite start={15.15} end={27.41}>
        <KillCurrentBeat />
      </Sprite>

      <Sprite start={27.41} end={39.68}>
        <KillVoltageBeat />
      </Sprite>

      <Sprite start={39.68} end={SCENE_DURATION}>
        <SumBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared circuit geometry ─────────────────────────────────────────────
// Bridge-style network: V1 on the left arm, R1 in series with V1, the
// middle (load) branch is R_L vertical between the top and bottom rails,
// and the right arm carries R2 in series with current source I2.
//   nodeA ── R1 ── nodeB ──┬── nodeC ── R2 ── nodeD
//                          R_L
//   nodeA' ─────────────── nodeB' ────────── nodeD'  (bottom rail)
function circuitGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 560,
        topY: 140, botY: 360,
        v1X: 80, r1X1: 130, r1X2: 230,
        rlX: 300, rlY1: 150, rlY2: 350,
        r2X1: 370, r2X2: 470, i2X: 520,
        captionY: 510, fontFormula: 22 }
    : { vbW: 1100, vbH: 460,
        topY: 130, botY: 330,
        v1X: 100, r1X1: 170, r1X2: 350,
        rlX: 500, rlY1: 140, rlY2: 320,
        r2X1: 650, r2X2: 830, i2X: 920,
        captionY: 430, fontFormula: 26 };
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

function resistorVerticalD(cx, yTop, yBot, amp = 9, n = 6) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const y = yTop + i * dy;
    const x = cx + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
}

// Voltage source: long plate (+) + short plate (−), centred at (cx, cy).
function BatterySymbol({ cx, cy, label = 'V₁' }) {
  return (
    <g>
      <line x1={cx - 12} y1={cy - 14} x2={cx - 12} y2={cy + 14}
            stroke="var(--chalk-100)" strokeWidth={3}/>
      <line x1={cx + 4} y1={cy - 8} x2={cx + 4} y2={cy + 8}
            stroke="var(--chalk-100)" strokeWidth={2.4}/>
      <text x={cx - 26} y={cy + 5} textAnchor="end"
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={18}>{label}</text>
      <text x={cx - 12} y={cy - 22} textAnchor="middle"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={11}>+</text>
      <text x={cx + 4} y={cy - 18} textAnchor="middle"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={11}>−</text>
    </g>
  );
}

// Current source: circle with internal upward arrow, centred at (cx, cy).
function CurrentSourceSymbol({ cx, cy, label = 'I₂' }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={18}
              fill="none" stroke="var(--chalk-100)" strokeWidth={2.2}/>
      <line x1={cx} y1={cy + 10} x2={cx} y2={cy - 8}
            stroke="var(--chalk-100)" strokeWidth={2}/>
      <path d={`M ${cx} ${cy - 12} L ${cx - 4} ${cy - 6} L ${cx + 4} ${cy - 6} Z`}
            fill="var(--chalk-100)"/>
      <text x={cx + 28} y={cy + 5}
            fill="var(--chalk-100)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={18}>{label}</text>
    </g>
  );
}

// Big red "X" overlay — used to mark a killed source.
function KillX({ cx, cy, size = 18 }) {
  return (
    <g>
      <line x1={cx - size} y1={cy - size} x2={cx + size} y2={cy + size}
            stroke="var(--rose-400)" strokeWidth={3} opacity={0.85}/>
      <line x1={cx - size} y1={cy + size} x2={cx + size} y2={cy - size}
            stroke="var(--rose-400)" strokeWidth={3} opacity={0.85}/>
    </g>
  );
}

// Render the shared schematic with optional per-source killing. When
// `killCurrent` is true the I2 is shown opened (gap in the right arm);
// when `killVoltage` is true V1 is shown shorted (a wire replaces it).
function CircuitDiagram({ G, beatDelay = 0, killCurrent = false, killVoltage = false }) {
  return (
    <g>
      {/* Top rail and bottom rail wires */}
      <TraceIn d={`M ${G.v1X + 4} ${G.topY} L ${G.r1X1} ${G.topY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 0.4}/>
      <TraceIn d={`M ${G.r1X2} ${G.topY} L ${G.rlX} ${G.topY} L ${G.r2X1} ${G.topY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.6} delay={beatDelay + 0.6}/>
      <TraceIn d={`M ${G.r2X2} ${G.topY} L ${G.i2X - 22} ${G.topY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 0.7}/>
      <TraceIn d={`M ${G.v1X - 12} ${G.botY} L ${G.i2X + 22} ${G.botY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.7} delay={beatDelay + 0.8}/>

      {/* Vertical wires from source bodies to rails */}
      <TraceIn d={`M ${G.v1X - 12} ${G.topY} L ${G.v1X - 12} ${G.botY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 0.2}/>
      <TraceIn d={`M ${G.i2X + 22} ${G.topY} L ${G.i2X + 22} ${G.botY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.4} delay={beatDelay + 0.2}/>

      {/* V1 voltage source — shown as a wire (short) when killed */}
      {killVoltage ? (
        <SvgFadeIn duration={0.4} delay={beatDelay + 0.0}>
          <line x1={G.v1X - 12} y1={G.topY} x2={G.v1X - 12} y2={G.botY}
                stroke="var(--rose-300)" strokeWidth={2.4}/>
          <text x={G.v1X - 26} y={(G.topY + G.botY) / 2 + 4} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">V₁ → 0</text>
        </SvgFadeIn>
      ) : (
        <SvgFadeIn duration={0.4} delay={beatDelay + 0.0}>
          <BatterySymbol cx={G.v1X} cy={(G.topY + G.botY) / 2} label="V₁"/>
        </SvgFadeIn>
      )}

      {/* R1 zigzag (top-left arm) */}
      <TraceIn d={resistorHorizontalD(G.r1X1, G.r1X2, G.topY)}
               stroke="var(--amber-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 1.2}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 1.6}>
        <text x={(G.r1X1 + G.r1X2) / 2} y={G.topY - 18} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>R₁</text>
      </SvgFadeIn>

      {/* R_L vertical zigzag in the middle branch */}
      <TraceIn d={resistorVerticalD(G.rlX, G.rlY1, G.rlY2)}
               stroke="var(--amber-400)" strokeWidth={2.4}
               duration={0.7} delay={beatDelay + 1.4}/>
      <TraceIn d={`M ${G.rlX} ${G.topY} L ${G.rlX} ${G.rlY1}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.2} delay={beatDelay + 1.4}/>
      <TraceIn d={`M ${G.rlX} ${G.rlY2} L ${G.rlX} ${G.botY}`}
               stroke="var(--chalk-200)" strokeWidth={2}
               duration={0.2} delay={beatDelay + 1.4}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 1.8}>
        <text x={G.rlX + 26} y={(G.rlY1 + G.rlY2) / 2 + 6}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={20}>R<tspan baselineShift="sub" fontSize={12}>L</tspan></text>
      </SvgFadeIn>

      {/* R2 zigzag (top-right arm) */}
      <TraceIn d={resistorHorizontalD(G.r2X1, G.r2X2, G.topY)}
               stroke="var(--amber-400)" strokeWidth={2.4}
               duration={0.6} delay={beatDelay + 1.2}/>
      <SvgFadeIn duration={0.35} delay={beatDelay + 1.6}>
        <text x={(G.r2X1 + G.r2X2) / 2} y={G.topY - 18} textAnchor="middle"
              fill="var(--chalk-100)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={18}>R₂</text>
      </SvgFadeIn>

      {/* I2 current source — shown as an open gap when killed */}
      {killCurrent ? (
        <SvgFadeIn duration={0.4} delay={beatDelay + 0.0}>
          {/* Two short stubs on either side with a gap */}
          <line x1={G.i2X - 22} y1={G.topY} x2={G.i2X - 8} y2={G.topY}
                stroke="var(--rose-300)" strokeWidth={2}/>
          <line x1={G.i2X + 8} y1={G.topY} x2={G.i2X + 22} y2={G.topY}
                stroke="var(--rose-300)" strokeWidth={2}/>
          <text x={G.i2X} y={G.topY - 18} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">I₂ → 0 (open)</text>
        </SvgFadeIn>
      ) : (
        <SvgFadeIn duration={0.4} delay={beatDelay + 0.0}>
          <CurrentSourceSymbol cx={G.i2X} cy={G.topY} label="I₂"/>
        </SvgFadeIn>
      )}
    </g>
  );
}

// Path samplers — discrete control points for the current loop, used to
// place charge dots that flow around the network. Each path is described
// as a polyline of (x, y) waypoints; we linearly interpolate by phase
// across cumulative segment lengths.
function pathTotal(waypoints) {
  let total = 0;
  for (let i = 1; i < waypoints.length; i++) {
    total += Math.hypot(waypoints[i].x - waypoints[i - 1].x,
                        waypoints[i].y - waypoints[i - 1].y);
  }
  return total;
}
function sampleAt(waypoints, u) {
  const tot = pathTotal(waypoints);
  let target = u * tot;
  for (let i = 1; i < waypoints.length; i++) {
    const dx = waypoints[i].x - waypoints[i - 1].x;
    const dy = waypoints[i].y - waypoints[i - 1].y;
    const seg = Math.hypot(dx, dy);
    if (target <= seg) {
      const f = seg > 0 ? target / seg : 0;
      return { x: waypoints[i - 1].x + dx * f, y: waypoints[i - 1].y + dy * f };
    }
    target -= seg;
  }
  return waypoints[waypoints.length - 1];
}

// ─── Beat 2: Setup — full circuit, both sources live ─────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = circuitGeometry(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G}/>

        {/* I_L question-mark callout next to R_L */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <line x1={G.rlX - 30} y1={(G.rlY1 + G.rlY2) / 2}
                x2={G.rlX - 14} y2={(G.rlY1 + G.rlY2) / 2}
                stroke="var(--rose-400)" strokeWidth={2}/>
          <path d={`M ${G.rlX - 14} ${(G.rlY1 + G.rlY2) / 2}
                    l -6 -4 l 0 8 z`}
                fill="var(--rose-400)"/>
          <text x={G.rlX - 36} y={(G.rlY1 + G.rlY2) / 2 + 6} textAnchor="end"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={20}>
            I<tspan baselineShift="sub" fontSize={12}>L</tspan> = ?
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two sources, one load — what's the current through R_L?
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Kill I2 (open) — V1 only, dots flow clockwise through R_L ──
function KillCurrentBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = circuitGeometry(portrait);

  // Current loop with only V1 live: V1(+) → topRail → R1 → through R_L
  // (downward) → bottom rail → back to V1(−). I2 branch is open.
  const mid = (G.topY + G.botY) / 2;
  const loopV1 = [
    { x: G.v1X, y: G.topY },
    { x: G.r1X1, y: G.topY },
    { x: G.r1X2, y: G.topY },
    { x: G.rlX, y: G.topY },
    { x: G.rlX, y: G.botY },
    { x: G.v1X - 12, y: G.botY },
    { x: G.v1X - 12, y: G.topY },
    { x: G.v1X, y: G.topY },
  ];

  const NUM = 8;
  const phase = Math.max(0, localTime - 2.2) / 4.0;
  const dots = [];
  for (let i = 0; i < NUM; i++) {
    const u = ((phase + i / NUM) % 1);
    dots.push(sampleAt(loopV1, u));
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G} killCurrent/>

        {/* Charge dots flowing along V1-only loop */}
        {localTime > 2.0 && dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3.5}
                  fill="var(--amber-400)" opacity={0.95}/>
        ))}

        {/* I_L^(1) direction arrow on R_L (downward) */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <line x1={G.rlX - 30} y1={(G.rlY1 + G.rlY2) / 2 - 14}
                x2={G.rlX - 30} y2={(G.rlY1 + G.rlY2) / 2 + 14}
                stroke="var(--amber-300)" strokeWidth={2}/>
          <path d={`M ${G.rlX - 30} ${(G.rlY1 + G.rlY2) / 2 + 16}
                    l -5 -8 l 10 0 z`}
                fill="var(--amber-300)"/>
          <text x={G.rlX - 38} y={(G.rlY1 + G.rlY2) / 2 + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            I<tspan baselineShift="sub" fontSize={11}>L</tspan><tspan baselineShift="super" fontSize={12}>(1)</tspan>
          </text>
        </SvgFadeIn>

        {/* Formula */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={G.vbW / 2} y={G.captionY - 28} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            I<tspan baselineShift="sub" fontSize={12}>L</tspan><tspan baselineShift="super" fontSize={14}>(1)</tspan> = V₁ / (R₁ + R<tspan baselineShift="sub" fontSize={12}>L</tspan>)
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            kill the current source — open it. V₁ alone drives the loop.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Kill V1 (short) — I2 only, dots flow the other way ─────────
function KillVoltageBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = circuitGeometry(portrait);

  // With V1 shorted, the network is a current source I2 feeding into
  // R2 || (R1, R_L). Through R_L, current flows UPWARD (opposite of beat 3).
  // Approximate loop: I2 → top rail (right→left) → R2 (right→left) →
  // junction → down through R_L → bottom rail (left→right) → up to I2.
  const loopI2 = [
    { x: G.i2X + 22, y: G.topY },
    { x: G.r2X2, y: G.topY },
    { x: G.r2X1, y: G.topY },
    { x: G.rlX, y: G.topY },
    { x: G.rlX, y: G.botY },
    { x: G.i2X + 22, y: G.botY },
    { x: G.i2X + 22, y: G.topY },
  ];

  const NUM = 8;
  const phase = Math.max(0, localTime - 2.2) / 4.0;
  const dots = [];
  for (let i = 0; i < NUM; i++) {
    // Note: phase advances in the same direction as we wrote the waypoints;
    // we wrote them right→left along the top rail and down through R_L,
    // so the dots correctly flow from I2 back through R_L.
    const u = ((phase + i / NUM) % 1);
    dots.push(sampleAt(loopI2, u));
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CircuitDiagram G={G} killVoltage/>

        {/* Charge dots flowing along I2-only loop */}
        {localTime > 2.0 && dots.map((d, i) => (
          <circle key={i} cx={d.x} cy={d.y} r={3.5}
                  fill="var(--teal-400)" opacity={0.95}/>
        ))}

        {/* I_L^(2) direction arrow on R_L (downward — same physical direction
            as beat 3 because dots from the top rail also push down through R_L) */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <line x1={G.rlX - 30} y1={(G.rlY1 + G.rlY2) / 2 - 14}
                x2={G.rlX - 30} y2={(G.rlY1 + G.rlY2) / 2 + 14}
                stroke="var(--teal-400)" strokeWidth={2}/>
          <path d={`M ${G.rlX - 30} ${(G.rlY1 + G.rlY2) / 2 + 16}
                    l -5 -8 l 10 0 z`}
                fill="var(--teal-400)"/>
          <text x={G.rlX - 38} y={(G.rlY1 + G.rlY2) / 2 + 6} textAnchor="end"
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={18}>
            I<tspan baselineShift="sub" fontSize={11}>L</tspan><tspan baselineShift="super" fontSize={12}>(2)</tspan>
          </text>
        </SvgFadeIn>

        {/* Formula */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={G.vbW / 2} y={G.captionY - 28} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            I<tspan baselineShift="sub" fontSize={12}>L</tspan><tspan baselineShift="super" fontSize={14}>(2)</tspan> = I₂ · R₁ / (R₁ + R<tspan baselineShift="sub" fontSize={12}>L</tspan>)
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            kill the voltage source — short it. I₂ alone drives the loop.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Sum + linearity takeaway ────────────────────────────────────
function SumBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28, textAlign: 'center',
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Linearity adds them up
      </FadeUp>

      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        alignItems: 'center', gap: portrait ? 14 : 24,
      }}>
        <FadeUp duration={0.5} delay={0.4} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 28 : 36, color: 'var(--amber-300)',
          }}>
          I<sub>L</sub><sup>(1)</sup>
        </FadeUp>
        <FadeUp duration={0.4} delay={0.9} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 28,
            color: 'var(--chalk-200)',
          }}>
          +
        </FadeUp>
        <FadeUp duration={0.5} delay={1.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 28 : 36, color: 'var(--teal-400)',
          }}>
          I<sub>L</sub><sup>(2)</sup>
        </FadeUp>
        <FadeUp duration={0.4} delay={1.4} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 28,
            color: 'var(--chalk-300)',
          }}>
          =
        </FadeUp>
        <FadeUp duration={0.6} delay={1.6} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 32 : 44, color: 'var(--chalk-100)',
          }}>
          I<sub>L</sub>
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={2.6} distance={12}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.45,
        }}>
        works for any linear circuit — no matter how many sources
      </FadeUp>

      <FadeUp duration={0.5} delay={4.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 4, maxWidth: portrait ? '34ch' : 'none',
        }}>
        kill V → short  ·  kill I → open  ·  watch the signs
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
