// Voltage Divider: Why Two Resistors Split the Voltage — Manimo lesson scene.
// Two resistors stacked across a source produce V_out at the midpoint
// equal to V_in · R2/(R1+R2). Genuine animation lives in Beat 4 (Sweep):
// R2 is scrubbed in real time, and the V_out bar + percentage track the
// change frame by frame.
//
// Beats (timed to single-track narration in motion/ade/audio/voltage-divider/):
//    0.00– 7.51  Manimo intro: where does V_out land between two resistors?
//    7.51–13.74  Circuit + KVL: same current through both, charges flow clockwise
//   13.74–21.89  Formula chain: V_in = V_R1 + V_R2  →  V_out = V_in · R2/(R1+R2)
//   21.89–31.15  R2 sweep: scrub from 0.2·R1 to 4·R1; V_out bar and percentage track
//   31.15–39.00  Takeaway: three intuition cases
//
// Authoring notes:
//   • All primitives come from manimo-motion.jsx.
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 2 uses live charge dots driven from useSprite() localTime to
//     show the same current threading both resistors — they would never
//     read on a static slide.
//   • Beat 4 reads localTime to compute a triangle-wave R2 sweep so V_out
//     traces a continuous arc up and back down inside the beat.

const SCENE_DURATION = 39;

const NARRATION = [
  /*  0.00– 7.51 */ "Two resistors stacked across a voltage source — what voltage shows up between them?",
  /*  7.51–13.74 */ "Send V in across R one and R two in series — Kirchhoff says the two drops have to add up to V in.",
  /* 13.74–21.89 */ "The same current flows through both, so V out equals V in times R two divided by R one plus R two.",
  /* 21.89–31.15 */ "Scrub R two. As it grows from small to large, V out climbs from near zero up toward V in — proportionally.",
  /* 31.15–39.00 */ "The output is V in scaled by R two's share of the total resistance — that's the voltage divider.",
];

// Single continuous narration track produced by `npm run audio voltage-divider`.
// Beat <Sprite start> values below match audioStart offsets in
// motion/ade/audio/voltage-divider/manifest.json.
const NARRATION_AUDIO = 'audio/voltage-divider/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Voltage Divider: Why Two Resistors Split the Voltage"
      duration={SCENE_DURATION}
      introEnd={7.51}
      introCaption="Two resistors, one input — where does V out land?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.51} end={13.74}>
        <CircuitBeat />
      </Sprite>

      <Sprite start={13.74} end={21.89}>
        <FormulaBeat />
      </Sprite>

      <Sprite start={21.89} end={31.15}>
        <SweepBeat />
      </Sprite>

      <Sprite start={31.15} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared resistor / circuit helpers ───────────────────────────────────
// Build a zigzag resistor path between two vertical y-positions. The
// zigzag oscillates left/right around the column x by `amp`. `n` zig
// endpoints (8 segments by default → 4 full triangles).
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

// Battery symbol (vertical): one long plate (positive) above, one short
// plate (negative) below. `cx` is the battery centre column.
function BatterySymbol({ cx, cy, color }) {
  return (
    <g>
      <line x1={cx - 18} y1={cy - 10} x2={cx + 18} y2={cy - 10}
            stroke={color} strokeWidth={3}/>
      <line x1={cx - 10} y1={cy + 10} x2={cx + 10} y2={cy + 10}
            stroke={color} strokeWidth={3}/>
    </g>
  );
}

// ─── Beat 2: Circuit — series current, charges flow clockwise ────────────
function CircuitBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Geometry per aspect. The loop is rectangular: battery on the left,
  // R1 + R2 stacked on the right column.
  const G = portrait
    ? { vbW: 560, vbH: 640, leftX: 130, rightX: 420,
        topY: 90, midY: 320, botY: 560,
        r1Top: 130, r1Bot: 290, r2Top: 350, r2Bot: 530,
        zigAmp: 22, batCy: 320, vinLabelX: 60, vinLabelY: 330,
        rLabelDx: 28, vOutLabelX: 480, captionY: 615,
        fontMain: 22, fontCaption: 14 }
    : { vbW: 800, vbH: 420, leftX: 160, rightX: 560,
        topY: 70, midY: 220, botY: 370,
        r1Top: 110, r1Bot: 200, r2Top: 240, r2Bot: 340,
        zigAmp: 14, batCy: 220, vinLabelX: 90, vinLabelY: 226,
        rLabelDx: 30, vOutLabelX: 620, captionY: 405,
        fontMain: 20, fontCaption: 14 };

  // Charge dots travelling clockwise around the loop. The path length
  // is built from segment lengths so the dot speed stays constant.
  const path = [
    { x: G.leftX, y: G.batCy + 16 },           // start (just below battery)
    { x: G.leftX, y: G.botY },                 // down to bottom wire
    { x: G.rightX, y: G.botY },                // along bottom wire
    { x: G.rightX, y: G.r2Bot },               // up to R2 bottom
    { x: G.rightX, y: G.r1Top },               // through R2 → midnode → R1 (column)
    { x: G.rightX, y: G.topY },                // up to top wire
    { x: G.leftX, y: G.topY },                 // back along top wire
    { x: G.leftX, y: G.batCy - 16 },           // down to battery top plate
  ];
  let total = 0;
  const segLens = [];
  for (let i = 1; i < path.length; i++) {
    const L = Math.hypot(path[i].x - path[i-1].x, path[i].y - path[i-1].y);
    segLens.push(L); total += L;
  }
  function pointAt(u) {
    const target = ((u % 1) + 1) % 1 * total;
    let acc = 0;
    for (let i = 0; i < segLens.length; i++) {
      if (target <= acc + segLens[i]) {
        const f = (target - acc) / segLens[i];
        return {
          x: path[i].x + (path[i+1].x - path[i].x) * f,
          y: path[i].y + (path[i+1].y - path[i].y) * f,
        };
      }
      acc += segLens[i];
    }
    return path[path.length - 1];
  }

  // 5 evenly-spaced charges, period = 4s. Phase ramps once the wires
  // and resistors have been drawn in (after delay ≈ 3.4s).
  const chargesT = Math.max(0, localTime - 3.4);
  const period = 4.0;
  const NUM = 5;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top wire */}
        <TraceIn d={`M ${G.leftX} ${G.batCy - 16} L ${G.leftX} ${G.topY} L ${G.rightX} ${G.topY} L ${G.rightX} ${G.r1Top}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>
        {/* Bottom wire */}
        <TraceIn d={`M ${G.leftX} ${G.batCy + 16} L ${G.leftX} ${G.botY} L ${G.rightX} ${G.botY} L ${G.rightX} ${G.r2Bot}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>

        {/* Battery */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <BatterySymbol cx={G.leftX} cy={G.batCy} color="var(--chalk-200)"/>
          <text x={G.vinLabelX} y={G.vinLabelY} textAnchor="end"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>in</tspan></text>
        </SvgFadeIn>

        {/* R1 */}
        <TraceIn d={zigzagD(G.rightX, G.r1Top, G.r1Bot, G.zigAmp)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.9} delay={1.0}/>
        {/* R2 */}
        <TraceIn d={zigzagD(G.rightX, G.r2Top, G.r2Bot, G.zigAmp)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.9} delay={1.6}/>
        {/* Midnode wire connecting R1 bottom to R2 top */}
        <TraceIn d={`M ${G.rightX} ${G.r1Bot} L ${G.rightX} ${G.r2Top}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.3} delay={2.0}/>

        {/* R1 label */}
        <SvgFadeIn duration={0.35} delay={1.4}>
          <text x={G.rightX + G.zigAmp + G.rLabelDx}
                y={(G.r1Top + G.r1Bot) / 2 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan></text>
        </SvgFadeIn>
        {/* R2 label */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={G.rightX + G.zigAmp + G.rLabelDx}
                y={(G.r2Top + G.r2Bot) / 2 + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan></text>
        </SvgFadeIn>

        {/* V_out probe — small open dot + short stub + label */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <circle cx={G.rightX} cy={G.midY} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
          <line x1={G.rightX} y1={G.midY}
                x2={G.vOutLabelX - 8} y2={G.midY}
                stroke="var(--amber-300)" strokeWidth={1.6}
                strokeDasharray="3 4"/>
          <text x={G.vOutLabelX} y={G.midY + 6}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>out</tspan></text>
        </SvgFadeIn>

        {/* Charge dots travelling clockwise — the genuine motion of this beat */}
        {chargesT > 0 && (
          <SvgFadeIn duration={0.3} delay={3.4}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = chargesT / period + i / NUM;
              const p = pointAt(u);
              return (
                <circle key={i} cx={p.x} cy={p.y} r={3.5}
                        fill="var(--amber-300)" opacity={0.95}/>
              );
            })}
          </SvgFadeIn>
        )}

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={7.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            the same current threads both resistors
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Formula chain — KVL → V_out = V_in · R2/(R1+R2) ─────────────
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
        Kirchhoff → series current → V_out
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        V<sub>in</sub> = V<sub>R1</sub> + V<sub>R2</sub>
      </FadeUp>

      <FadeUp duration={0.4} delay={1.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        I = V<sub>in</sub> / (R<sub>1</sub> + R<sub>2</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        V<sub>out</sub> = I · R<sub>2</sub>
      </FadeUp>

      <FadeUp duration={0.4} delay={3.0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        ⇓
      </FadeUp>

      <FadeUp duration={0.6} delay={3.5} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 46, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: 2,
        }}>
        V<sub>out</sub> = V<sub>in</sub> · R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={5.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          marginTop: 6, textAlign: 'center',
          maxWidth: portrait ? '28ch' : '46ch', lineHeight: 1.4,
        }}>
        V<sub>out</sub> is V<sub>in</sub> scaled by R<sub>2</sub>'s share of the total
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: R2 sweep — genuine motion ───────────────────────────────────
// R2 scrubs as a triangle wave from R2min·R1 → R2max·R1 → R2min·R1 across
// the beat. The V_out bar height and percentage label update each frame.
function SweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  // Triangle-wave sweep of R2/R1 between 0.2 and 4.0, starting after a
  // short hold so the diagram lands first.
  const HOLD = 1.2;
  const SWEEP_DUR = Math.max(spriteDur - HOLD - 0.6, 1);
  const t = clamp((localTime - HOLD) / SWEEP_DUR, 0, 1);
  // triangle: 0 → 1 → 0 across the sweep window
  const tri = t < 0.5 ? (t * 2) : (2 - t * 2);
  const R2_MIN = 0.2, R2_MAX = 4.0;
  const r2Over1 = R2_MIN + (R2_MAX - R2_MIN) * tri;
  const voutFrac = r2Over1 / (1 + r2Over1);
  const voutPct = Math.round(voutFrac * 100);

  // R1 is the reference; show as 1.0 kΩ. R2 readout in kΩ to 1 decimal.
  const r2Text = r2Over1.toFixed(1);

  // Geometry: circuit on the left, vertical V-bars on the right.
  const G = portrait
    ? { vbW: 560, vbH: 640, leftX: 110, rightX: 320,
        topY: 110, midY: 300, botY: 530,
        r1Top: 140, r1Bot: 280, r2Top: 320, r2Bot: 510,
        zigAmp: 20, batCy: 320,
        barX: 440, barTop: 130, barBot: 510, barW: 28, barGap: 40,
        readoutX: 440, readoutY: 100,
        captionY: 605, fontMain: 22, fontCaption: 14 }
    : { vbW: 880, vbH: 420, leftX: 130, rightX: 380,
        topY: 70, midY: 220, botY: 370,
        r1Top: 110, r1Bot: 200, r2Top: 240, r2Bot: 340,
        zigAmp: 14, batCy: 220,
        barX: 540, barTop: 80, barBot: 370, barW: 28, barGap: 50,
        readoutX: 700, readoutY: 100,
        captionY: 405, fontMain: 20, fontCaption: 14 };

  const barH = G.barBot - G.barTop;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Circuit (already-formed; fade in as a group) */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          {/* Top + bottom wires */}
          <path d={`M ${G.leftX} ${G.batCy - 16} L ${G.leftX} ${G.topY} L ${G.rightX} ${G.topY} L ${G.rightX} ${G.r1Top}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          <path d={`M ${G.leftX} ${G.batCy + 16} L ${G.leftX} ${G.botY} L ${G.rightX} ${G.botY} L ${G.rightX} ${G.r2Bot}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          {/* Battery */}
          <BatterySymbol cx={G.leftX} cy={G.batCy} color="var(--chalk-200)"/>
          {/* R1 zigzag (fixed) */}
          <path d={zigzagD(G.rightX, G.r1Top, G.r1Bot, G.zigAmp)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {/* R2 zigzag (fixed visual length; numeric value scrubs) */}
          <path d={zigzagD(G.rightX, G.r2Top, G.r2Bot, G.zigAmp)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Midnode wire */}
          <path d={`M ${G.rightX} ${G.r1Bot} L ${G.rightX} ${G.r2Top}`}
                stroke="var(--chalk-200)" strokeWidth={2} fill="none"/>
          {/* Midnode tap */}
          <circle cx={G.rightX} cy={G.midY} r={4}
                  fill="var(--bg-canvas)" stroke="var(--amber-300)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Live R1 / R2 numeric labels */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={G.rightX + G.zigAmp + 18}
                y={(G.r1Top + G.r1Bot) / 2 + 6}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 14 : 13}>R1 = 1.0</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={G.rightX + G.zigAmp + 18}
                y={(G.r2Top + G.r2Bot) / 2 + 6}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 14 : 13}>R2 = {r2Text}</text>
        </SvgFadeIn>

        {/* V_in reference bar (dim, full height) */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <rect x={G.barX} y={G.barTop} width={G.barW} height={barH}
                fill="rgba(232,220,193,0.12)"
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.barX + G.barW / 2} y={G.barTop - 8}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.08em">V_IN</text>
        </SvgFadeIn>

        {/* V_out bar (bright amber, height ∝ R2/(R1+R2)) */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <rect x={G.barX + G.barGap + G.barW} y={G.barTop}
                width={G.barW} height={barH}
                fill="none"
                stroke="var(--amber-300)" strokeWidth={1.5}/>
          {/* fill rises from the bottom proportional to voutFrac */}
          <rect x={G.barX + G.barGap + G.barW}
                y={G.barBot - barH * voutFrac}
                width={G.barW} height={barH * voutFrac}
                fill="var(--amber-400)" opacity={0.85}/>
          <text x={G.barX + G.barGap + G.barW + G.barW / 2}
                y={G.barTop - 8} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={12} letterSpacing="0.08em">V_OUT</text>
        </SvgFadeIn>

        {/* Live percentage readout next to the bars */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.readoutX}
                y={portrait ? G.barBot + 32 : G.readoutY}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={portrait ? 22 : 26} letterSpacing="0.02em">
            {voutPct}% of V_in
          </text>
        </SvgFadeIn>

        {/* Caption beneath */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            V<tspan fontFamily="var(--font-serif)" fontStyle="italic"> out</tspan> tracks R<tspan fontFamily="var(--font-serif)" fontStyle="italic">2</tspan>'s share of the total
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
          fontSize: portrait ? 28 : 38, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        V<sub>out</sub> = V<sub>in</sub> · R<sub>2</sub> / (R<sub>1</sub> + R<sub>2</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        R<sub>1</sub> = R<sub>2</sub> → half. R<sub>2</sub> ≫ R<sub>1</sub> → almost V<sub>in</sub>. R<sub>2</sub> ≪ R<sub>1</sub> → almost zero.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.4} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        the same idea drives sensors, op-amp gains, and bias networks
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
