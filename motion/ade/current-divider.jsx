// Current Divider: How Two Parallel Resistors Split the Current — Manimo lesson scene.
// Two resistors in parallel across one current source split the total
// current as I_1 = I_in · R_2/(R_1+R_2) and I_2 = I_in · R_1/(R_1+R_2).
// Sister scene to voltage-divider — same idea, swapped roles.
// Genuine animation lives in Beat 4 (Sweep): R_2 is scrubbed in real time
// and the two branch-current arrows swell/shrink with their percentages.
//
// Beats:
//   0.0– 5.0   Manimo intro: how does I_in split between two parallel R?
//   5.0–13.0   Parallel circuit + shared voltage V across both
//  13.0–22.0   Formula chain: Ohm + KCL → I_k = I_in · R_other/(R_1+R_2)
//  22.0–31.0   R_2 sweep: arrows swell/shrink; live percentages update
//  31.0–38.0   Takeaway

const SCENE_DURATION = 36;

const NARRATION = [
  /*  0.0– 5.0 */ 'A current source pushes I in into two parallel resistors — how does the current split between them?',
  /*  5.0–13.0 */ "Both resistors sit across the same two nodes, so they share the same voltage V across them.",
  /* 13.0–22.0 */ "Ohm's law gives the branch currents I one and I two, and they add up to I in — solve it and the smaller resistor takes the bigger share.",
  /* 22.0–31.0 */ 'Scrub R two. Make it small and the current pours through R two; make it large and the current crowds back into R one.',
  /* 31.0–38.0 */ 'Current divides inversely to resistance — the easy path wins.',
];

const NARRATION_AUDIO = 'audio/current-divider/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Current Divider: How Two Parallel Resistors Split the Current"
      duration={SCENE_DURATION}
      introEnd={6.33}
      introCaption="Two parallel resistors — which branch wins the current?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.33} end={11.95}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={11.95} end={21.13}>
        <FormulaBeat />
      </Sprite>

      <Sprite start={21.13} end={30.26}>
        <SweepBeat />
      </Sprite>

      <Sprite start={30.26} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────
function zigzagD(cx, yTop, yBot, amp = 14, n = 8) {
  const dy = (yBot - yTop) / n;
  const pts = [`M ${cx} ${yTop}`];
  for (let i = 1; i < n; i++) {
    const x = cx + (i % 2 === 1 ? amp : -amp);
    const y = yTop + i * dy;
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${yBot}`);
  return pts.join(' ');
}

// Circle with arrow inside — the standard schematic glyph for a current
// source. `cy` is the centre of the circle; current arrow points UP.
function CurrentSourceSymbol({ cx, cy, color, r = 22 }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth={2.4}/>
      <line x1={cx} y1={cy + r - 6} x2={cx} y2={cy - r + 8}
            stroke={color} strokeWidth={2.4}/>
      <path d={`M ${cx} ${cy - r + 6} L ${cx - 5} ${cy - r + 14} L ${cx + 5} ${cy - r + 14} Z`}
            fill={color}/>
    </g>
  );
}

// ─── Beat 2: Two parallel resistors share a voltage V ────────────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry per aspect. Source on the left, two zigzag resistors in the
  // middle column rows, voltage bracket on the right.
  const G = portrait
    ? { vbW: 600, vbH: 640, srcX: 110, r1X: 280, r2X: 420,
        topY: 130, botY: 510,
        zigAmp: 22, srcCy: 320,
        vBracketX: 510, vbTopY: 130, vbBotY: 510, vLabelX: 540, vLabelY: 320,
        labelDy: 8, iinLabelX: 110, iinLabelY: 95,
        captionY: 605, fontMain: 22, fontCaption: 14 }
    : { vbW: 880, vbH: 420, srcX: 140, r1X: 380, r2X: 540,
        topY: 90, botY: 340,
        zigAmp: 14, srcCy: 215,
        vBracketX: 640, vbTopY: 90, vbBotY: 340, vLabelX: 678, vLabelY: 220,
        labelDy: 8, iinLabelX: 140, iinLabelY: 60,
        captionY: 405, fontMain: 20, fontCaption: 14 };

  // Charge dots travelling DOWN through each resistor (current direction).
  // They appear once the resistors and labels are placed (delay ≈ 4.0s).
  const chargesT = Math.max(0, localTime - 4.0);
  const period = 3.4;
  const NUM = 4;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top wire: source top → R1 top → R2 top */}
        <TraceIn d={`M ${G.srcX} ${G.srcCy - 22} L ${G.srcX} ${G.topY} L ${G.r2X} ${G.topY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>
        {/* Bottom wire: source bottom → R1 bot → R2 bot */}
        <TraceIn d={`M ${G.srcX} ${G.srcCy + 22} L ${G.srcX} ${G.botY} L ${G.r2X} ${G.botY}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>

        {/* Current source on the left */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <CurrentSourceSymbol cx={G.srcX} cy={G.srcCy} color="var(--chalk-100)"/>
        </SvgFadeIn>

        {/* I_in label above the source */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <text x={G.iinLabelX} y={G.iinLabelY} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            I<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* R1 zigzag */}
        <TraceIn d={zigzagD(G.r1X, G.topY, G.botY, G.zigAmp)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={1.0} delay={1.0}/>
        {/* R2 zigzag */}
        <TraceIn d={zigzagD(G.r2X, G.topY, G.botY, G.zigAmp)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={1.0} delay={1.6}/>

        {/* Wire stubs from top/bottom rails to each resistor top/bot */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <line x1={G.r1X} y1={G.topY} x2={G.r1X} y2={G.topY} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.r2X} y1={G.topY} x2={G.r2X} y2={G.topY} stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* R1 label */}
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={G.r1X - G.zigAmp - 16}
                y={(G.topY + G.botY) / 2 + G.labelDy}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain} textAnchor="end">
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan>
          </text>
        </SvgFadeIn>
        {/* R2 label */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={G.r2X + G.zigAmp + 16}
                y={(G.topY + G.botY) / 2 + G.labelDy}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan>
          </text>
        </SvgFadeIn>

        {/* Shared voltage V — bracket on the right with V label */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <line x1={G.vBracketX} y1={G.vbTopY} x2={G.vBracketX} y2={G.vbBotY}
                stroke="var(--amber-300)" strokeWidth={1.6}/>
          <line x1={G.vBracketX - 8} y1={G.vbTopY} x2={G.vBracketX} y2={G.vbTopY}
                stroke="var(--amber-300)" strokeWidth={1.6}/>
          <line x1={G.vBracketX - 8} y1={G.vbBotY} x2={G.vBracketX} y2={G.vbBotY}
                stroke="var(--amber-300)" strokeWidth={1.6}/>
          <text x={G.vLabelX} y={G.vLabelY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V</text>
        </SvgFadeIn>

        {/* Charge dots descending through each resistor — same V means
            the current is V/R in each, so equal R produces equal
            spacing here. */}
        {chargesT > 0 && (
          <SvgFadeIn duration={0.3} delay={4.0}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = (chargesT / period + i / NUM) % 1;
              const y1 = G.topY + u * (G.botY - G.topY);
              const y2 = G.topY + u * (G.botY - G.topY);
              return (
                <g key={i}>
                  <circle cx={G.r1X} cy={y1} r={3.5} fill="var(--amber-300)" opacity={0.95}/>
                  <circle cx={G.r2X} cy={y2} r={3.5} fill="var(--amber-300)" opacity={0.95}/>
                </g>
              );
            })}
          </SvgFadeIn>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            {portrait
              ? 'same V across both — Ohm sets each branch current'
              : "same voltage across both — Ohm's law sets each branch current"}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Formula chain — Ohm + KCL → divider formula ─────────────────
function FormulaBeat() {
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
      gap: portrait ? 18 : 22,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Ohm → KCL → divider
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        I<sub>1</sub> = V / R<sub>1</sub>,  I<sub>2</sub> = V / R<sub>2</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={1.2} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        I<sub>in</sub> = I<sub>1</sub> + I<sub>2</sub> = V · (1/R<sub>1</sub> + 1/R<sub>2</sub>)
      </FadeUp>

      <FadeUp duration={0.4} delay={2.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>

      <FadeUp duration={0.6} delay={2.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 44, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: 2,
        }}>
        I<sub>1</sub> = I<sub>in</sub> · R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={4.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          marginTop: 6, textAlign: 'center',
          maxWidth: portrait ? '26ch' : '50ch', lineHeight: 1.4,
        }}>
        the <em>other</em> resistor lands in the numerator — the easier path takes the bigger share
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: R_2 sweep — genuine motion ──────────────────────────────────
// R_2 scrubs as a triangle wave from R2min·R1 → R2max·R1 → R2min·R1 across
// the beat. The branch-current arrow widths and percentage readouts update
// each frame.
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 1.0;
  const SWEEP_DUR = Math.max(spriteDur - HOLD - 0.6, 1);
  const t = clamp((localTime - HOLD) / SWEEP_DUR, 0, 1);
  // triangle: 0 → 1 → 0 across the sweep window
  const tri = t < 0.5 ? (t * 2) : (2 - t * 2);
  const R2_MIN = 0.25, R2_MAX = 4.0;
  const r2Over1 = R2_MIN + (R2_MAX - R2_MIN) * tri;
  // I_1 / I_in = R_2 / (R_1 + R_2); I_2 / I_in = R_1 / (R_1 + R_2)
  const i1Frac = r2Over1 / (1 + r2Over1);
  const i2Frac = 1 / (1 + r2Over1);
  const i1Pct = Math.round(i1Frac * 100);
  const i2Pct = Math.round(i2Frac * 100);
  const r2Text = r2Over1.toFixed(1);

  // Two stacked readouts beneath each branch: R value (mono, small) then
  // current % (mono, big amber/rose). rDy = R label offset, iDy = current
  // readout offset (must be > rDy + line-height to avoid collision).
  const G = portrait
    ? { vbW: 560, vbH: 700, srcX: 100, r1X: 260, r2X: 420,
        topY: 130, botY: 510,
        zigAmp: 20, srcCy: 320,
        arrowMaxW: 26,
        rDy: 26, iDy: 60,
        captionY: 660, fontMain: 22, fontMono: 14, fontCaption: 14 }
    : { vbW: 880, vbH: 460, srcX: 150, r1X: 390, r2X: 560,
        topY: 90, botY: 320,
        zigAmp: 14, srcCy: 205,
        arrowMaxW: 20,
        rDy: 26, iDy: 52,
        captionY: 445, fontMain: 20, fontMono: 13, fontCaption: 14 };

  // Arrow widths proportional to current fraction. Always ≥ 2 px so the
  // visual doesn't collapse to a line when one branch goes near zero.
  const w1 = Math.max(2, G.arrowMaxW * i1Frac);
  const w2 = Math.max(2, G.arrowMaxW * i2Frac);
  // The two thick arrows live inside each resistor column, pointing DOWN.
  // We render them as a rect (the shaft) plus a triangle (arrowhead) so
  // the variable width reads cleanly.
  function FlowArrow({ cx, color, width }) {
    const ax = cx;
    const yTop = G.topY + 8;
    const yShaftBot = G.botY - 14;
    const headDy = 10;
    return (
      <g>
        <rect x={ax - width / 2} y={yTop} width={width} height={yShaftBot - yTop}
              fill={color} opacity={0.7}/>
        <path d={`M ${ax} ${yShaftBot + headDy} L ${ax - width / 2 - 3} ${yShaftBot} L ${ax + width / 2 + 3} ${yShaftBot} Z`}
              fill={color}/>
      </g>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Circuit chrome — already-formed; fade in as a group */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          {/* Top + bottom rails */}
          <path d={`M ${G.srcX} ${G.srcCy - 22} L ${G.srcX} ${G.topY} L ${G.r2X} ${G.topY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <path d={`M ${G.srcX} ${G.srcCy + 22} L ${G.srcX} ${G.botY} L ${G.r2X} ${G.botY}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          {/* Current source */}
          <CurrentSourceSymbol cx={G.srcX} cy={G.srcCy} color="var(--chalk-100)"/>
          {/* R1 + R2 zigzags */}
          <path d={zigzagD(G.r1X, G.topY, G.botY, G.zigAmp)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={zigzagD(G.r2X, G.topY, G.botY, G.zigAmp)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* Genuine motion: branch-current arrows whose widths track i_k.
            Drawn UNDER the resistor zigzag stroke so the arrow reads as
            current INSIDE the branch. */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <FlowArrow cx={G.r1X} color="var(--amber-300)" width={w1}/>
          <FlowArrow cx={G.r2X} color="var(--rose-300)" width={w2}/>
        </SvgFadeIn>

        {/* I_in label */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <text x={G.srcX} y={G.topY - 16} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            I<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan>
          </text>
        </SvgFadeIn>

        {/* R values: R_1 fixed at 1.0, R_2 scrubs */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <text x={G.r1X} y={G.botY + G.rDy} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.fontMono}>R1 = 1.0</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.7}>
          <text x={G.r2X} y={G.botY + G.rDy} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontMono}>R2 = {r2Text}</text>
        </SvgFadeIn>

        {/* Live current readouts beneath each branch — a row below the R
            label so the two never collide. */}
        <SvgFadeIn duration={0.4} delay={0.9}>
          <text x={G.r1X} y={G.botY + G.iDy} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 18 : 16}>I1 = {i1Pct}% I_in</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.1}>
          <text x={G.r2X} y={G.botY + G.iDy} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 18 : 16}>I2 = {i2Pct}% I_in</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            the smaller resistor steals the larger share
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
          fontSize: portrait ? 22 : 36, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '30ch' : 'none',
          lineHeight: 1.25, whiteSpace: portrait ? 'normal' : 'nowrap',
        }}>
        I<sub>k</sub> = I<sub>in</sub> · R<sub>other</sub> / (R<sub>1</sub> + R<sub>2</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '52ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        R<sub>2</sub> ≪ R<sub>1</sub> → I<sub>2</sub> takes almost all of I<sub>in</sub>. R<sub>2</sub> ≫ R<sub>1</sub> → I<sub>1</sub> does.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        the dual of the voltage divider — same idea, swapped roles
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
