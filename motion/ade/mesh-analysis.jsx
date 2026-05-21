// Mesh Analysis: KVL Loop by Loop — Manimo lesson scene.
// A two-mesh planar circuit (two batteries, three resistors, shared middle
// branch). Beat 3 carries the genuine motion: a rose-coloured dot circles
// clockwise around the left loop while a teal dot circles clockwise around
// the right loop — they overlap on the shared middle branch but travel in
// opposite directions, making the "I1 − I2" intuition geometric, not just
// algebraic.
//
// Beats (placeholder timings — Step 4c overwrites with audio-aligned):
//    0– 4   Manimo intro + hook
//    4–12   Circuit setup — two adjacent meshes with shared R3
//   12–22   Assign mesh currents I1, I2 — animated walkers circling both loops
//   22–33   KVL equations + numerical solution
//   33–44   Takeaway — n loops → n equations
//
// Authoring notes:
//   • Geometry shared by Beats 2 + 3 via meshGeometry() so the diagrams
//     align frame-for-frame between beats.
//   • Walkers in Beat 3 are parametric on a 4-side loop with continuous
//     localTime, so they trace one full circuit per `LOOP_PERIOD` seconds.
//   • All colors via design tokens; portrait reflows to stacked mesh layout.

const SCENE_DURATION = 49;

const NARRATION = [
  /*  0– 4  */ "Two loops sharing a wire — how do we find the current through the middle branch?",
  /*  4–12 */ "Here's a two-mesh circuit. A battery on the left, another on the right, and a resistor in the middle shared between both loops.",
  /* 12–22 */ "Assign a clockwise current to each loop — I one in the left mesh, I two in the right. Both currents pass through the shared resistor, but in opposite directions.",
  /* 22–33 */ "Write KVL around each loop. Left loop: V one equals I one R one plus I one minus I two times R three. Right loop: minus V two equals I two R two plus I two minus I one times R three.",
  /* 33–44 */ "One mesh current per loop, KVL applied loop by loop — that's mesh analysis. For n loops you get n equations and n unknowns.",
];

const NARRATION_AUDIO = 'audio/mesh-analysis/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Mesh Analysis: KVL Loop by Loop"
      duration={SCENE_DURATION}
      introEnd={4.41}
      introCaption="Two loops, one shared wire — what flows in the middle?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.41} end={11.6}>
        <CircuitSetupBeat />
      </Sprite>

      <Sprite start={11.6} end={21.87}>
        <MeshCurrentsBeat />
      </Sprite>

      <Sprite start={21.87} end={39.22}>
        <KvlEquationsBeat />
      </Sprite>

      <Sprite start={39.22} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Geometry shared across beats ───────────────────────────────────────
// Landscape: two side-by-side rectangular meshes.
// Portrait: same shape but narrower viewBox and slightly compressed.
function meshGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 440,
      x0: 80, xM: 300, x1: 520,           // left, shared-middle, right verticals
      y0: 90, y1: 360,                    // top, bottom horizontals
      battY: 230, r1X: 190, r2X: 410, r3Y: 220,
      battH: 70, resHalfW: 56, resHalfH: 50, resAmp: 10, resN: 8,
      tagFont: 16, labelFont: 14,
    };
  }
  return {
    vbW: 920, vbH: 380,
    x0: 110, xM: 460, x1: 810,
    y0: 70, y1: 310,
    battY: 190, r1X: 285, r2X: 635, r3Y: 190,
    battH: 80, resHalfW: 70, resHalfH: 60, resAmp: 12, resN: 8,
    tagFont: 18, labelFont: 16,
  };
}

// ─── Helper shapes ──────────────────────────────────────────────────────
function BatteryV({ cx, cy, h = 80, color = 'var(--amber-400)' }) {
  const longHalf = 22, shortHalf = 12, gap = 6;
  return (
    <g>
      <line x1={cx} y1={cy - h / 2} x2={cx} y2={cy - gap}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={cx - longHalf} y1={cy - gap} x2={cx + longHalf} y2={cy - gap}
            stroke={color} strokeWidth={3}/>
      <line x1={cx - shortHalf} y1={cy + gap} x2={cx + shortHalf} y2={cy + gap}
            stroke={color} strokeWidth={3}/>
      <line x1={cx} y1={cy + gap} x2={cx} y2={cy + h / 2}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <text x={cx + longHalf + 10} y={cy - gap + 5}
            fill={color} fontFamily="var(--font-mono)" fontSize={14}>+</text>
      <text x={cx + shortHalf + 16} y={cy + gap + 6}
            fill={color} fontFamily="var(--font-mono)" fontSize={14}>−</text>
    </g>
  );
}

function HResistor({ cx, cy, halfW, amp = 12, n = 8, color = 'var(--amber-400)' }) {
  const x0 = cx - halfW, x1 = cx + halfW;
  const dx = (x1 - x0) / n;
  const pts = [`M ${x0} ${cy}`];
  for (let i = 1; i < n; i++) {
    const x = x0 + i * dx;
    const y = cy + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${x1} ${cy}`);
  return (
    <path d={pts.join(' ')} stroke={color} strokeWidth={2.4}
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  );
}

function VResistor({ cx, cy, halfH, amp = 12, n = 8, color = 'var(--amber-400)' }) {
  const y0 = cy - halfH, y1 = cy + halfH;
  const dy = (y1 - y0) / n;
  const pts = [`M ${cx} ${y0}`];
  for (let i = 1; i < n; i++) {
    const y = y0 + i * dy;
    const x = cx + (i % 2 === 1 ? -amp : amp);
    pts.push(`L ${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  pts.push(`L ${cx} ${y1}`);
  return (
    <path d={pts.join(' ')} stroke={color} strokeWidth={2.4}
          fill="none" strokeLinecap="round" strokeLinejoin="round"/>
  );
}

// ─── Two-mesh wireframe ─────────────────────────────────────────────────
// Renders just the wires + battery + three resistors. Beat 2 wraps each
// element in SvgFadeIn for stagger; Beat 3 renders the same shapes
// without animation since the loop is already drawn from beat 2.
function MeshWires({ G, staticOnly = false }) {
  const battGapTop = G.battY - G.battH / 2;
  const battGapBot = G.battY + G.battH / 2;
  const r1GapL = G.r1X - G.resHalfW, r1GapR = G.r1X + G.resHalfW;
  const r2GapL = G.r2X - G.resHalfW, r2GapR = G.r2X + G.resHalfW;
  const r3GapTop = G.r3Y - G.resHalfH, r3GapBot = G.r3Y + G.resHalfH;

  const wires = (
    <g>
      {/* Outer rectangle: bottom, left, top (split around R1+R2), right */}
      <line x1={G.x0} y1={G.y1} x2={G.x1} y2={G.y1}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.x0} y1={G.y0} x2={G.x0} y2={battGapTop}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.x0} y1={battGapBot} x2={G.x0} y2={G.y1}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* Top: split around R1 and R2 */}
      <line x1={G.x0} y1={G.y0} x2={r1GapL} y2={G.y0}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={r1GapR} y1={G.y0} x2={r2GapL} y2={G.y0}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={r2GapR} y1={G.y0} x2={G.x1} y2={G.y0}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* Right vertical: split around V2 */}
      <line x1={G.x1} y1={G.y0} x2={G.x1} y2={battGapTop}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.x1} y1={battGapBot} x2={G.x1} y2={G.y1}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* Shared middle vertical: split around R3 */}
      <line x1={G.xM} y1={G.y0} x2={G.xM} y2={r3GapTop}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      <line x1={G.xM} y1={r3GapBot} x2={G.xM} y2={G.y1}
            stroke="var(--chalk-200)" strokeWidth={2}/>
    </g>
  );

  const elements = (
    <g>
      <BatteryV cx={G.x0} cy={G.battY} h={G.battH}/>
      <HResistor cx={G.r1X} cy={G.y0} halfW={G.resHalfW}
                 amp={G.resAmp} n={G.resN}/>
      <VResistor cx={G.xM} cy={G.r3Y} halfH={G.resHalfH}
                 amp={G.resAmp} n={G.resN}/>
      <HResistor cx={G.r2X} cy={G.y0} halfW={G.resHalfW}
                 amp={G.resAmp} n={G.resN}/>
      <BatteryV cx={G.x1} cy={G.battY} h={G.battH}/>
    </g>
  );

  if (staticOnly) {
    return (
      <g opacity={0.9}>
        {wires}
        {elements}
      </g>
    );
  }

  return (
    <g>
      <SvgFadeIn duration={0.4} delay={0.0}>{wires}</SvgFadeIn>
      <SvgFadeIn duration={0.4} delay={0.3}>
        <BatteryV cx={G.x0} cy={G.battY} h={G.battH}/>
      </SvgFadeIn>
      <SvgFadeIn duration={0.4} delay={0.6}>
        <HResistor cx={G.r1X} cy={G.y0} halfW={G.resHalfW}
                   amp={G.resAmp} n={G.resN}/>
      </SvgFadeIn>
      <SvgFadeIn duration={0.4} delay={0.9}>
        <VResistor cx={G.xM} cy={G.r3Y} halfH={G.resHalfH}
                   amp={G.resAmp} n={G.resN}/>
      </SvgFadeIn>
      <SvgFadeIn duration={0.4} delay={1.2}>
        <HResistor cx={G.r2X} cy={G.y0} halfW={G.resHalfW}
                   amp={G.resAmp} n={G.resN}/>
      </SvgFadeIn>
      <SvgFadeIn duration={0.4} delay={1.5}>
        <BatteryV cx={G.x1} cy={G.battY} h={G.battH}/>
      </SvgFadeIn>
    </g>
  );
}

// ─── Beat 2: Circuit setup ──────────────────────────────────────────────
function CircuitSetupBeat() {
  const portrait = usePortrait();
  const G = meshGeometry(portrait);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <MeshWires G={G} />

        {/* Component value labels */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={G.x0 - 50} y={G.battY - 2} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>V₁</text>
          <text x={G.x0 - 50} y={G.battY + 16} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>12 V</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.2}>
          <text x={G.r1X} y={G.y0 - 30} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R₁</text>
          <text x={G.r1X} y={G.y0 - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>4 Ω</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.4}>
          <text x={G.xM + 30} y={G.r3Y - 4}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R₃</text>
          <text x={G.xM + 30} y={G.r3Y + 14}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>6 Ω</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.6}>
          <text x={G.r2X} y={G.y0 - 30} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>R₂</text>
          <text x={G.r2X} y={G.y0 - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>2 Ω</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.8}>
          <text x={G.x1 + 30} y={G.battY - 2}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont}>V₂</text>
          <text x={G.x1 + 30} y={G.battY + 16}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>6 V</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <text x={G.vbW / 2} y={G.vbH - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            two adjacent loops, sharing R₃ in the middle
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Mesh currents (genuine motion) ─────────────────────────────
// Two walker dots circle their respective loops clockwise. They share the
// middle branch — and walk it in opposite directions, making the I1 − I2
// difference visible.
function MeshCurrentsBeat() {
  const portrait = usePortrait();
  const G = meshGeometry(portrait);
  const { localTime } = useSprite();

  // Each loop is a rectangle: left mesh = (x0,y0)-(xM,y1), right mesh =
  // (xM,y0)-(x1,y1). Walker parametrised by u ∈ [0,1), CW from bottom-left.
  // LOOP_PERIOD = seconds per full lap.
  const LOOP_PERIOD = 4.2;
  const HOLD = 0.7;           // wait briefly so the user reads the labels
  const u = ((Math.max(0, localTime - HOLD)) / LOOP_PERIOD) % 1;

  function walker(corners, u) {
    // corners: [bl, tl, tr, br]; CW visit bl→tl→tr→br→bl. Perimeter split
    // into 4 equal-time segments.
    const segIdx = Math.min(3, Math.floor(u * 4));
    const segU = (u * 4) - segIdx;
    const seq = [corners[0], corners[1], corners[2], corners[3], corners[0]];
    const a = seq[segIdx], b = seq[segIdx + 1];
    return {
      x: a.x + (b.x - a.x) * segU,
      y: a.y + (b.y - a.y) * segU,
    };
  }

  const leftCorners = [
    { x: G.x0, y: G.y1 },  // bl
    { x: G.x0, y: G.y0 },  // tl
    { x: G.xM, y: G.y0 },  // tr
    { x: G.xM, y: G.y1 },  // br
  ];
  const rightCorners = [
    { x: G.xM, y: G.y1 },
    { x: G.xM, y: G.y0 },
    { x: G.x1, y: G.y0 },
    { x: G.x1, y: G.y1 },
  ];
  const w1 = walker(leftCorners, u);
  const w2 = walker(rightCorners, u);

  // Curved arrow markers drawn inside each loop (static visual hint).
  const leftCx = (G.x0 + G.xM) / 2;
  const rightCx = (G.xM + G.x1) / 2;
  const arrowCy = (G.y0 + G.y1) / 2;
  const arrowR = portrait ? 26 : 32;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <MeshWires G={G} staticOnly />

        {/* Curved CW arrow hint inside left mesh — rose */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <path d={`M ${leftCx - arrowR} ${arrowCy}
                    A ${arrowR} ${arrowR} 0 1 1 ${leftCx + arrowR} ${arrowCy}`}
                fill="none" stroke="var(--rose-400)" strokeWidth={1.8}
                strokeDasharray="3 4" opacity={0.6}/>
          <polygon
            points={`${leftCx + arrowR} ${arrowCy},
                     ${leftCx + arrowR - 6} ${arrowCy - 8},
                     ${leftCx + arrowR + 6} ${arrowCy - 8}`}
            fill="var(--rose-400)" opacity={0.8}/>
          <text x={leftCx} y={arrowCy + arrowR + 18} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont + 2}>I₁</text>
        </SvgFadeIn>

        {/* Curved CW arrow hint inside right mesh — teal */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <path d={`M ${rightCx - arrowR} ${arrowCy}
                    A ${arrowR} ${arrowR} 0 1 1 ${rightCx + arrowR} ${arrowCy}`}
                fill="none" stroke="var(--teal-400)" strokeWidth={1.8}
                strokeDasharray="3 4" opacity={0.6}/>
          <polygon
            points={`${rightCx + arrowR} ${arrowCy},
                     ${rightCx + arrowR - 6} ${arrowCy - 8},
                     ${rightCx + arrowR + 6} ${arrowCy - 8}`}
            fill="var(--teal-400)" opacity={0.8}/>
          <text x={rightCx} y={arrowCy + arrowR + 18} textAnchor="middle"
                fill="var(--teal-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.tagFont + 2}>I₂</text>
        </SvgFadeIn>

        {/* Walker 1 (rose) — left mesh */}
        {localTime > HOLD && (
          <g>
            <circle cx={w1.x} cy={w1.y} r={10}
                    fill="var(--rose-400)" opacity={0.25}/>
            <circle cx={w1.x} cy={w1.y} r={5.5}
                    fill="var(--rose-400)" stroke="var(--chalk-100)"
                    strokeWidth={1.3}/>
          </g>
        )}

        {/* Walker 2 (teal) — right mesh, fades in after I2 label */}
        {localTime > HOLD + 0.8 && (
          <g>
            <circle cx={w2.x} cy={w2.y} r={10}
                    fill="var(--teal-400)" opacity={0.25}/>
            <circle cx={w2.x} cy={w2.y} r={5.5}
                    fill="var(--teal-400)" stroke="var(--chalk-100)"
                    strokeWidth={1.3}/>
          </g>
        )}

        {/* Net-current label below R3 in the lower half of the shared
            branch — clear of the resistor body and of the R1/R2 labels. */}
        <SvgFadeIn duration={0.4} delay={3.5}>
          <text x={G.xM + 26} y={G.r3Y + G.resHalfH + 22} textAnchor="start"
                fill="var(--chalk-100)" fontFamily="var(--font-mono)"
                fontSize={G.labelFont} fontWeight="bold">I₁ − I₂</text>
          <text x={G.xM + 26} y={G.r3Y + G.resHalfH + 38} textAnchor="start"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.10em">net through R₃</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.vbH - 14} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            net current through R₃ is I₁ minus I₂ — opposite walks subtract
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: KVL equations + solution ───────────────────────────────────
function KvlEquationsBeat() {
  const portrait = usePortrait();
  const eqStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 22 : 26, letterSpacing: '0.02em',
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
        KVL around each mesh
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{ ...eqStyle, color: 'var(--rose-300)' }}>
        V₁ = I₁ R₁ + (I₁ − I₂) R₃
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ ...eqStyle, color: 'var(--teal-300)' }}>
        −V₂ = I₂ R₂ + (I₂ − I₁) R₃
      </FadeUp>

      <FadeUp duration={0.4} delay={3.0} distance={6}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          textAlign: 'center', maxWidth: portrait ? '28ch' : 'none',
        }}>
        two linear equations in two unknowns
      </FadeUp>

      <FadeUp duration={0.6} delay={4.5} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 36, color: 'var(--amber-300)',
          letterSpacing: '0.02em', marginTop: 8,
        }}>
        I₁ ≈ 1.5 A,  I₂ ≈ 0 A
      </FadeUp>

      <FadeUp duration={0.4} delay={5.6} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.10em',
          marginTop: -6,
        }}>
        with V₁ = 12 V, V₂ = 6 V, R₁ = 4 Ω, R₂ = 2 Ω, R₃ = 6 Ω
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ───────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.3,
        }}>
        One clockwise current per loop. KVL on each. Solve.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
          color: 'var(--amber-300)', letterSpacing: '0.06em',
        }}>
        n loops  →  n equations,  n unknowns
      </FadeUp>

      <FadeUp duration={0.5} delay={2.8} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', letterSpacing: '0.08em',
          textAlign: 'center', maxWidth: portrait ? '30ch' : 'none',
          textTransform: 'uppercase',
        }}>
        mesh analysis = KVL, automated
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

// ─── Mount ──────────────────────────────────────────────────────────────
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
