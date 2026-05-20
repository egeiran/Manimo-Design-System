// The Wheatstone Bridge — Manimo lesson scene.
// Four resistors in a diamond, a battery across the outer corners, and a
// galvanometer between the two midpoints. The two midpoints reach the
// same voltage exactly when R1·Rx = R2·R3, and the needle falls dead
// still — that is "balance." Sweep Rx and the needle deflects, crossing
// zero at the balance point. Sister to voltage-divider (each arm IS a
// voltage divider) and thevenin-equivalent (in chapter 3).
//
// Beats (audio-aligned offsets from motion/ade/audio/wheatstone-bridge/manifest.json):
//   0.00– 7.67  Manimo intro: diamond of resistors, one tiny meter
//   7.67–19.56  Build the bridge — battery, four arms, midpoints A/B, galvanometer
//  19.56–30.79  Balance condition — each arm is a divider; V_A = V_B ⇒ R1·Rx = R2·R3
//  30.79–39.25  Sweep Rx — genuine motion: galvanometer needle deflects, settles at balance
//  39.25–51.00  Takeaway — Rx = R3·(R2/R1); why bridges win at strain/temp/tiny R
//
// Authoring notes:
//   • Beat 4 is the motion beat: useSprite() drives a triangle sweep of
//     the unknown resistor Rx, and the galvanometer needle angle is
//     computed from the bridge imbalance ΔV = V_A − V_B each frame.
//   • Every component branches on usePortrait() so the diamond stays
//     legible on a 720-wide canvas.

const SCENE_DURATION = 51;

const NARRATION = [
  /*  0.00– 7.67 */ 'Four resistors in a diamond, one tiny meter in the middle — how does this circuit measure resistance you cannot easily see?',
  /*  7.67–19.56 */ 'A battery drives two parallel arms. The top arm carries R one and R three; the bottom arm carries R two and R x. Between the two midpoints sits a galvanometer.',
  /* 19.56–30.79 */ 'Each arm is just a voltage divider. The bridge is balanced — V A equals V B — exactly when R one times R x equals R two times R three.',
  /* 30.79–39.25 */ 'Scrub R x. The galvanometer needle swings as the two midpoints disagree, then falls dead still the moment the ratio matches.',
  /* 39.25–51.00 */ 'At balance, the unknown comes straight from a ratio of three known resistors. That is why bridges measure strain, temperature, and tiny resistances better than any direct meter.',
];

const NARRATION_AUDIO = 'audio/wheatstone-bridge/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="The Wheatstone Bridge: A Galvanometer That Lies Still at Balance"
      duration={SCENE_DURATION}
      introEnd={7.67}
      introCaption="A diamond of resistors — when does the meter fall silent?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.67} end={19.56}>
        <BridgeSetupBeat />
      </Sprite>

      <Sprite start={19.56} end={30.79}>
        <BalanceConditionBeat />
      </Sprite>

      <Sprite start={30.79} end={39.25}>
        <NeedleSweepBeat />
      </Sprite>

      <Sprite start={39.25} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────
// Build a zigzag resistor path between two endpoints (x1,y1)→(x2,y2),
// oscillating perpendicular by `amp` over `n` segments. Works at any
// angle so the diamond arms can be drawn cleanly.
function zigzagBetween(x1, y1, x2, y2, amp = 10, n = 8) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy);
  const ux = dx / len, uy = dy / len;
  // perpendicular unit vector (90° CCW)
  const px = -uy, py = ux;
  const pts = [`M ${x1.toFixed(1)} ${y1.toFixed(1)}`];
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const cx = x1 + dx * t;
    const cy = y1 + dy * t;
    const side = i % 2 === 1 ? amp : -amp;
    pts.push(`L ${(cx + px * side).toFixed(1)} ${(cy + py * side).toFixed(1)}`);
  }
  pts.push(`L ${x2.toFixed(1)} ${y2.toFixed(1)}`);
  return pts.join(' ');
}

// Battery symbol — long thin (+) plate over short thick (−) plate.
// `cx,cy` is the centre; orientation is vertical with + on top.
function BatterySymbol({ cx, cy, color = 'var(--chalk-100)' }) {
  return (
    <g>
      {/* long plate (+) */}
      <line x1={cx - 14} y1={cy - 6} x2={cx + 14} y2={cy - 6}
            stroke={color} strokeWidth={2.4}/>
      {/* short plate (−) */}
      <line x1={cx - 8} y1={cy + 6} x2={cx + 8} y2={cy + 6}
            stroke={color} strokeWidth={4.2}/>
    </g>
  );
}

// Galvanometer symbol — circle with a "G" inside; needle is drawn
// separately so it can rotate independently. `angleDeg` controls the
// pointer; 0° = straight up (centred / balanced).
function GalvanometerBody({ cx, cy, r = 26, color = 'var(--chalk-100)' }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill="var(--bg-canvas)" opacity={0.92}
              stroke={color} strokeWidth={2}/>
      {/* scale tick marks at -60°, 0°, +60° */}
      {[-60, -30, 0, 30, 60].map(deg => {
        const a = (deg - 90) * Math.PI / 180;
        const x1 = cx + Math.cos(a) * (r - 1);
        const y1 = cy + Math.sin(a) * (r - 1);
        const x2 = cx + Math.cos(a) * (r - 5);
        const y2 = cy + Math.sin(a) * (r - 5);
        return <line key={deg} x1={x1} y1={y1} x2={x2} y2={y2}
                     stroke="var(--chalk-300)" strokeWidth={1}/>;
      })}
      {/* G label below */}
      <text x={cx} y={cy + r - 8} textAnchor="middle"
            fill="var(--chalk-200)" fontFamily="var(--font-serif)"
            fontStyle="italic" fontSize={13}>G</text>
    </g>
  );
}

function GalvanometerNeedle({ cx, cy, r = 26, angleDeg = 0, color = 'var(--rose-400)' }) {
  // pivot at cx,cy; needle tip at the top at zero
  const a = (angleDeg - 90) * Math.PI / 180;
  const tipX = cx + Math.cos(a) * (r - 6);
  const tipY = cy + Math.sin(a) * (r - 6);
  return (
    <g>
      <line x1={cx} y1={cy} x2={tipX} y2={tipY}
            stroke={color} strokeWidth={2}/>
      <circle cx={cx} cy={cy} r={2.5} fill={color}/>
    </g>
  );
}

// ─── Beat 2: Build the bridge ─────────────────────────────────────────────
function BridgeSetupBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Diamond corners: TOP (battery +), BOT (battery −), LEFT (node A), RIGHT (node B)
  // Battery sits to the LEFT of the diamond, wired across TOP↔BOT via outer rails.
  // Galvanometer sits between LEFT and RIGHT (the two midpoints).
  const G = portrait
    ? { vbW: 600, vbH: 700,
        cx: 300, cy: 380,
        dx: 200, dy: 200, // diamond half-widths
        batX: 80, batCy: 380, batTopY: 110, batBotY: 650,
        zigAmp: 10, zigN: 8,
        captionY: 680, fontMain: 18, fontCaption: 13 }
    : { vbW: 1000, vbH: 460,
        cx: 540, cy: 230,
        dx: 240, dy: 150,
        batX: 130, batCy: 230, batTopY: 60, batBotY: 400,
        zigAmp: 10, zigN: 8,
        captionY: 440, fontMain: 18, fontCaption: 13 };

  // Corner coords
  const tx = G.cx,         ty = G.cy - G.dy;  // TOP (+)
  const bx = G.cx,         by = G.cy + G.dy;  // BOT (−)
  const ax = G.cx - G.dx,  ay = G.cy;         // LEFT  (A)
  const ex = G.cx + G.dx,  ey = G.cy;         // RIGHT (B)

  // Charge dots threading the outer loop (battery → top → corners → bottom).
  // They appear once the bridge is drawn (delay ~ 4.0s).
  const chargesT = Math.max(0, localTime - 4.5);
  const period = 4.0;
  const NUM = 6;

  // Compute a path-following dot position by stitching together segments
  // and parameterising on cumulative length. Top arm (L→A is R1, A→T at battery+),
  // we trace charges down the TOP-LEFT arm to make the current direction
  // (out of +, through R1 to node A, then through R3 to −) explicit.
  // Path: TOP -> LEFT (R1) -> BOT (R3). And separately TOP -> RIGHT (R2) -> BOT (Rx).
  function segPos(u, x1, y1, x2, y2) {
    return { x: x1 + (x2 - x1) * u, y: y1 + (y2 - y1) * u };
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Battery on the left, wired up to TOP and down to BOT */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <BatterySymbol cx={G.batX} cy={G.batCy}/>
          <text x={G.batX - 26} y={G.batCy - 2}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain} textAnchor="end">V</text>
        </SvgFadeIn>

        {/* Outer rails from battery to TOP (+) and to BOT (−) */}
        <TraceIn
          d={`M ${G.batX} ${G.batCy - 6} L ${G.batX} ${G.batTopY} L ${tx} ${G.batTopY} L ${tx} ${ty}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>
        <TraceIn
          d={`M ${G.batX} ${G.batCy + 6} L ${G.batX} ${G.batBotY} L ${bx} ${G.batBotY} L ${bx} ${by}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.9} delay={0.4}/>

        {/* + and − marks at corners */}
        <SvgFadeIn duration={0.3} delay={1.2}>
          <text x={tx + 14} y={ty - 6}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={14}>+</text>
          <text x={bx + 14} y={by + 16}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={14}>−</text>
        </SvgFadeIn>

        {/* Four resistor arms — drawn in order so the eye reads R1, R2, R3, Rx */}
        <TraceIn d={zigzagBetween(tx, ty, ax, ay, G.zigAmp, G.zigN)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={1.4}/>
        <TraceIn d={zigzagBetween(tx, ty, ex, ey, G.zigAmp, G.zigN)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={1.9}/>
        <TraceIn d={zigzagBetween(ax, ay, bx, by, G.zigAmp, G.zigN)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={2.4}/>
        <TraceIn d={zigzagBetween(ex, ey, bx, by, G.zigAmp, G.zigN)}
          stroke="var(--amber-400)" strokeWidth={2.4}
          duration={0.7} delay={2.9}/>

        {/* Resistor labels — placed OUTSIDE the arms */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          {/* R1: top-left arm */}
          <text x={(tx + ax) / 2 - 24} y={(ty + ay) / 2 - 8}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain} textAnchor="end">
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>1</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.5}>
          {/* R2: top-right arm */}
          <text x={(tx + ex) / 2 + 24} y={(ty + ey) / 2 - 8}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>2</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={3.0}>
          {/* R3: bottom-left arm */}
          <text x={(ax + bx) / 2 - 24} y={(ay + by) / 2 + 14}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain} textAnchor="end">
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>3</tspan>
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={3.5}>
          {/* Rx: bottom-right arm, accented amber for emphasis */}
          <text x={(ex + bx) / 2 + 24} y={(ey + by) / 2 + 14}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>
            R<tspan baselineShift="sub" fontSize={G.fontMain * 0.6}>x</tspan>
          </text>
        </SvgFadeIn>

        {/* Galvanometer between A (LEFT) and B (RIGHT) — wires + body + needle */}
        <TraceIn
          d={`M ${ax} ${ay} L ${G.cx - 28} ${ay}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={3.6}/>
        <TraceIn
          d={`M ${G.cx + 28} ${ey} L ${ex} ${ey}`}
          stroke="var(--chalk-200)" strokeWidth={2}
          duration={0.4} delay={3.6}/>
        <SvgFadeIn duration={0.4} delay={3.9}>
          <GalvanometerBody cx={G.cx} cy={G.cy} r={26}/>
          {/* Needle sits at zero in this beat — bridge is in arbitrary state. */}
          <GalvanometerNeedle cx={G.cx} cy={G.cy} r={26} angleDeg={18}/>
        </SvgFadeIn>

        {/* Node A and Node B labels — placed above each midpoint so
            they never collide with the battery V label on the left. */}
        <SvgFadeIn duration={0.35} delay={4.0}>
          <text x={ax} y={ay - 14} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={15} letterSpacing="0.06em">A</text>
          <text x={ex} y={ey - 14} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={15} letterSpacing="0.06em">B</text>
        </SvgFadeIn>

        {/* Charge dots: a short procession along the TOP-LEFT arm (R1) and
            then the BOTTOM-LEFT arm (R3), to make current direction
            explicit. Same on the right side (R2 → Rx). Dots are spaced
            evenly via i/NUM. */}
        {chargesT > 0 && (
          <SvgFadeIn duration={0.3} delay={4.5}>
            {Array.from({ length: NUM }).map((_, i) => {
              const u = (chargesT / period + i / NUM) % 1;
              // u in [0,1) walks TOP→LEFT (first half) → LEFT→BOT (second half) for the left arm.
              // Same parameterisation gives the right-arm dot too.
              const left = u < 0.5
                ? segPos(u * 2, tx, ty, ax, ay)
                : segPos((u - 0.5) * 2, ax, ay, bx, by);
              const right = u < 0.5
                ? segPos(u * 2, tx, ty, ex, ey)
                : segPos((u - 0.5) * 2, ex, ey, bx, by);
              return (
                <g key={i}>
                  <circle cx={left.x} cy={left.y} r={3.4}
                          fill="var(--amber-300)" opacity={0.9}/>
                  <circle cx={right.x} cy={right.y} r={3.4}
                          fill="var(--amber-300)" opacity={0.9}/>
                </g>
              );
            })}
          </SvgFadeIn>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            {portrait
              ? 'two arms, two midpoints — and one meter between'
              : 'two parallel arms; the galvanometer reads the difference between the midpoints'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Balance condition ────────────────────────────────────────────
function BalanceConditionBeat() {
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
        each arm IS a voltage divider
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        V<sub>A</sub> = V · R<sub>3</sub> / (R<sub>1</sub> + R<sub>3</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.0} distance={10}
        style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
        V<sub>B</sub> = V · R<sub>x</sub> / (R<sub>2</sub> + R<sub>x</sub>)
      </FadeUp>

      <FadeUp duration={0.4} delay={1.8} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 18,
          color: 'var(--chalk-300)',
        }}>
        set V<sub>A</sub> = V<sub>B</sub>  ⇓
      </FadeUp>

      <FadeUp duration={0.6} delay={2.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 34 : 46, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: 2,
        }}>
        R<sub>1</sub> · R<sub>x</sub> = R<sub>2</sub> · R<sub>3</sub>
      </FadeUp>

      <FadeUp duration={0.5} delay={3.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          marginTop: 6, textAlign: 'center',
          maxWidth: portrait ? '26ch' : '52ch', lineHeight: 1.4,
        }}>
        no current crosses the galvanometer when the products match
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Sweep Rx — genuine motion ────────────────────────────────────
// Sweep Rx as a triangle wave from R_MIN to R_MAX and back. The bridge
// imbalance ΔV = V_A − V_B drives the galvanometer-needle angle. We
// fix R1 = R2 = 1, R3 = 1 (so balance lands at Rx = 1), then sweep Rx
// from 0.2 to 5.0 across the beat. When Rx crosses 1, the needle hits
// zero and a green dot lights up.
function NeedleSweepBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 1.2;
  const SWEEP_DUR = Math.max(spriteDur - HOLD - 1.0, 1);
  const t = clamp((localTime - HOLD) / SWEEP_DUR, 0, 1);
  const tri = t < 0.5 ? (t * 2) : (2 - t * 2);
  // Log-style sweep so balance (Rx = 1) lands near the middle of the
  // visual travel, not crammed into the bottom of a linear sweep.
  const RX_MIN = 0.2, RX_MAX = 5.0;
  const rx = RX_MIN * Math.pow(RX_MAX / RX_MIN, tri);
  // Fix R1 = R2 = R3 = 1; balance at Rx = 1.
  const Vs = 10;
  const V_A = Vs * 1 / (1 + 1);                  // = 5 (constant)
  const V_B = Vs * rx / (1 + rx);                // varies with Rx
  const dV = V_A - V_B;                          // signed imbalance
  // Map ΔV [-2, +2] V → angle [-72°, +72°]. Beyond ±2 V we clamp.
  const angle = clamp(dV / 2, -1, 1) * 72;
  const balanced = Math.abs(dV) < 0.15;

  const G = portrait
    ? { vbW: 580, vbH: 720,
        cx: 290, cy: 360,
        dx: 200, dy: 200,
        zigAmp: 10, zigN: 8,
        meterCx: 290, meterCy: 360, meterR: 36,
        readoutY: 660, fontReadout: 18, fontCaption: 14, captionY: 690 }
    : { vbW: 920, vbH: 460,
        cx: 460, cy: 230,
        dx: 240, dy: 150,
        zigAmp: 10, zigN: 8,
        meterCx: 460, meterCy: 230, meterR: 36,
        readoutY: 430, fontReadout: 18, fontCaption: 14, captionY: 450 };

  const tx = G.cx,         ty = G.cy - G.dy;
  const bx = G.cx,         by = G.cy + G.dy;
  const ax = G.cx - G.dx,  ay = G.cy;
  const ex = G.cx + G.dx,  ey = G.cy;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Diamond chrome — already laid out, fade in as a group.
            Battery rail sits OUTSIDE the diamond (left of node A), so the
            vertical wire doesn't clip through the galvanometer. */}
        <SvgFadeIn duration={0.5} delay={0.0}>
          {/* outer corner-to-corner wires from battery rails — railX is
              clear of node A so the rail doesn't cross the meter. */}
          <line x1={ax - 60} y1={ty} x2={tx} y2={ty} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={ax - 60} y1={ty} x2={ax - 60} y2={by} stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={ax - 60} y1={by} x2={bx} y2={by} stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* battery */}
          <g transform={`translate(${ax - 60}, ${(ty + by) / 2}) rotate(-90)`}>
            <BatterySymbol cx={0} cy={0}/>
          </g>
          {/* four arms */}
          <path d={zigzagBetween(tx, ty, ax, ay, G.zigAmp, G.zigN)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={zigzagBetween(tx, ty, ex, ey, G.zigAmp, G.zigN)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={zigzagBetween(ax, ay, bx, by, G.zigAmp, G.zigN)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          <path d={zigzagBetween(ex, ey, bx, by, G.zigAmp, G.zigN)}
                stroke="var(--amber-400)" strokeWidth={2.4}
                fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          {/* meter wires */}
          <line x1={ax} y1={ay} x2={G.meterCx - G.meterR - 2} y2={ay}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.meterCx + G.meterR + 2} y1={ey} x2={ex} y2={ey}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Fixed labels */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={(tx + ax) / 2 - 22} y={(ty + ay) / 2 - 6}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end">R1 = 1</text>
          <text x={(tx + ex) / 2 + 22} y={(ty + ey) / 2 - 6}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12}>R2 = 1</text>
          <text x={(ax + bx) / 2 - 22} y={(ay + by) / 2 + 14}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12} textAnchor="end">R3 = 1</text>
        </SvgFadeIn>

        {/* Rx live readout — amber, accented */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={(ex + bx) / 2 + 22} y={(ey + by) / 2 + 14}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={13}>Rx = {rx.toFixed(2)}</text>
        </SvgFadeIn>

        {/* Galvanometer body + animated needle. Body is in a steady
            <g>; needle re-renders each frame at the imbalance angle.
            When balanced, a small green dot pulses inside the meter
            to confirm. */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <GalvanometerBody cx={G.meterCx} cy={G.meterCy} r={G.meterR}/>
        </SvgFadeIn>

        <GalvanometerNeedle cx={G.meterCx} cy={G.meterCy} r={G.meterR}
          angleDeg={angle}
          color={balanced ? 'var(--teal-400)' : 'var(--rose-400)'}/>

        {balanced && (
          <circle cx={G.meterCx} cy={G.meterCy - G.meterR - 12} r={5}
                  fill="var(--teal-400)" opacity={0.85}/>
        )}

        {/* Live ΔV readout below the meter */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.vbW / 2} y={G.readoutY} textAnchor="middle"
                fill={balanced ? 'var(--teal-400)' : 'var(--chalk-200)'}
                fontFamily="var(--font-mono)" fontSize={G.fontReadout}>
            ΔV = {(dV).toFixed(2)} V {balanced ? '  ← balance' : ''}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            sweep R<tspan baselineShift="sub" fontSize={G.fontCaption * 0.8}>x</tspan>{' '}— the needle crosses zero exactly at the balance point
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
          fontSize: portrait ? 32 : 44, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        R<sub>x</sub> = R<sub>3</sub> · (R<sub>2</sub> / R<sub>1</sub>)
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '50ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 6,
        }}>
        the unknown is a ratio of three knowns — read off the moment the meter falls still
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '44ch' : 'none',
          textAlign: 'center', whiteSpace: portrait ? 'normal' : 'nowrap',
        }}>
        {portrait
          ? 'compare, don’t measure — strain, temperature, tiny R'
          : "compare, don't measure — strain · temperature · tiny R"}
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
