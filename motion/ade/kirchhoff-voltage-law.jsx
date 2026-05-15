// Kirchhoff's Voltage Law: Why a Loop Sums to Zero — Manimo lesson scene.
// Single-mesh circuit (battery + two resistors). Genuine animation lives in
// Beat 3: a "test-charge" walker traverses the loop while a running-sum
// readout in the centre of the loop updates to +12, +4, then 0 as it
// crosses the battery and each resistor.
//
// Beats (timing aligned to single-track narration in motion/ade/audio/kirchhoff-voltage-law/):
//    0.00– 5.38  Manimo intro: walk a loop, what do you get?
//    5.38–13.12  Loop setup: battery + R1 + R2, traversal arrow
//   13.12–22.24  Walker animates round the loop; voltage tags pop;
//                 running sum 0 → +12 → +4 → 0
//   22.24–30.48  KVL formula reveal: ∑V = 0, and +12 − 8 − 4 = 0
//   30.48–40.00  Takeaway: it's energy conservation
//
// Authoring notes:
//   • Walker uses useSprite()'s localTime → maps to a parametric position
//     on a 4-segment loop. Running sum is computed from the same param so
//     the number on screen always matches the walker's location.
//   • Loop is wide-orient in landscape, tall-orient in portrait so the
//     walker's circuit and the centre readout both stay legible.

const SCENE_DURATION = 39;

const NARRATION = [
  /*  0.00– 5.38 */ "Walk all the way around a circuit loop — what's the total voltage you've gained?",
  /*  5.38–13.12 */ "Here's a single mesh: a battery on the left, two resistors on the right. Pick a direction and start walking.",
  /* 13.12–22.24 */ "A test charge walks the loop. Going up through the battery, plus twelve volts. Across R one, minus eight. Down through R two, minus four. Back to the start — zero.",
  /* 22.24–30.48 */ "Around any closed loop, the sum of all voltage rises and drops equals zero. That's Kirchhoff's voltage law.",
  /* 30.48–40.00 */ "It's just energy conservation: the boost a battery gives a charge is exactly what the resistors take back.",
];

const NARRATION_AUDIO = 'audio/kirchhoff-voltage-law/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit analysis"
      title="Kirchhoff's Voltage Law: Why a Loop Sums to Zero"
      duration={SCENE_DURATION}
      introEnd={4.56}
      introCaption="Walk a loop, add every voltage — what do you get?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.56} end={11.36}>
        <LoopSetupBeat />
      </Sprite>

      <Sprite start={11.36} end={23.59}>
        <WalkAndSumBeat />
      </Sprite>

      <Sprite start={23.59} end={30.91}>
        <KvlFormulaBeat />
      </Sprite>

      <Sprite start={30.91} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Loop geometry — shared by Beats 2 + 3 ──────────────────────────────
// Returns the corner coordinates of the rectangular loop and key element
// centres (battery, R1, R2) for both aspects. The loop is traversed
// clockwise in this order:
//   bottomLeft → topLeft (up through battery, +V_BAT)
//   topLeft   → topRight (right through R1, −V_R1)
//   topRight → bottomRight (down through R2, −V_R2)
//   bottomRight → bottomLeft (back along bottom wire, 0)
function loopGeometry(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 540,
      x0: 130, x1: 470, y0: 90, y1: 460,        // loop corners
      battY: 275, r1X: 300, r2Y: 275,           // element centres
      battH: 80, resHalfW: 70, resAmp: 12, resN: 8,
      sumX: 300, sumY: 268, sumLabelY: 240,
      tagFont: 18, sumFont: 38, sumLabelFont: 11,
    };
  }
  return {
    vbW: 880, vbH: 380,
    x0: 130, x1: 750, y0: 70, y1: 310,
    battY: 190, r1X: 440, r2Y: 190,
    battH: 84, resHalfW: 80, resAmp: 12, resN: 8,
    sumX: 440, sumY: 200, sumLabelY: 168,
    tagFont: 20, sumFont: 44, sumLabelFont: 12,
  };
}

// Battery cell — drawn vertically at (cx, cy). Long line on top (+ side),
// short line below (− side); leads extending top + bottom.
function BatteryV({ cx, cy, h = 80, color = 'var(--amber-400)' }) {
  const longHalf = 22, shortHalf = 12, gap = 6;
  return (
    <g>
      {/* Top lead */}
      <line x1={cx} y1={cy - h / 2} x2={cx} y2={cy - gap}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* Long plate (+) */}
      <line x1={cx - longHalf} y1={cy - gap} x2={cx + longHalf} y2={cy - gap}
            stroke={color} strokeWidth={3}/>
      {/* Short plate (−) */}
      <line x1={cx - shortHalf} y1={cy + gap} x2={cx + shortHalf} y2={cy + gap}
            stroke={color} strokeWidth={3}/>
      {/* Bottom lead */}
      <line x1={cx} y1={cy + gap} x2={cx} y2={cy + h / 2}
            stroke="var(--chalk-200)" strokeWidth={2}/>
      {/* Polarity glyphs */}
      <text x={cx + longHalf + 12} y={cy - gap + 5}
            fill={color} fontFamily="var(--font-mono)" fontSize={14}>+</text>
      <text x={cx + shortHalf + 18} y={cy + gap + 6}
            fill={color} fontFamily="var(--font-mono)" fontSize={14}>−</text>
    </g>
  );
}

// Horizontal zigzag resistor between (x − halfW, y) and (x + halfW, y).
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

// Vertical zigzag resistor between (x, y − halfH) and (x, y + halfH).
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

// ─── Beat 2: Loop setup ─────────────────────────────────────────────────
function LoopSetupBeat() {
  const portrait = usePortrait();
  const G = loopGeometry(portrait);

  // Wire segments split around the elements so the trace doesn't run
  // through the resistor zigzags or battery cell.
  const battGapTop = G.battY - G.battH / 2;
  const battGapBot = G.battY + G.battH / 2;
  const r1GapL = G.r1X - G.resHalfW;
  const r1GapR = G.r1X + G.resHalfW;
  const r2GapTop = G.r2Y - G.resHalfW;
  const r2GapBot = G.r2Y + G.resHalfW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Wires — drawn first, the elements sit on top */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          {/* Bottom wire */}
          <line x1={G.x0} y1={G.y1} x2={G.x1} y2={G.y1}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* Left wire — split around the battery */}
          <line x1={G.x0} y1={G.y0} x2={G.x0} y2={battGapTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x0} y1={battGapBot} x2={G.x0} y2={G.y1}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* Top wire — split around R1 */}
          <line x1={G.x0} y1={G.y0} x2={r1GapL} y2={G.y0}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={r1GapR} y1={G.y0} x2={G.x1} y2={G.y0}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          {/* Right wire — split around R2 */}
          <line x1={G.x1} y1={G.y0} x2={G.x1} y2={r2GapTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x1} y1={r2GapBot} x2={G.x1} y2={G.y1}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Battery */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <BatteryV cx={G.x0} cy={G.battY} h={G.battH}/>
        </SvgFadeIn>

        {/* R1 (top, horizontal) */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <HResistor cx={G.r1X} cy={G.y0} halfW={G.resHalfW}
                     amp={G.resAmp} n={G.resN}/>
        </SvgFadeIn>

        {/* R2 (right, vertical) */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <VResistor cx={G.x1} cy={G.r2Y} halfH={G.resHalfW}
                     amp={G.resAmp} n={G.resN}/>
        </SvgFadeIn>

        {/* Labels */}
        <SvgFadeIn duration={0.35} delay={1.6}>
          <text x={G.x0 - 56} y={G.battY - 4} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>V</text>
          <text x={G.x0 - 56} y={G.battY + 18} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={12}>12 V</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={1.9}>
          <text x={G.r1X} y={G.y0 - 36} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>R₁</text>
          <text x={G.r1X} y={G.y0 - 20} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>drops 8 V</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={2.2}>
          <text x={G.x1 + 36} y={G.r2Y - 4}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 18 : 20}>R₂</text>
          <text x={G.x1 + 36} y={G.r2Y + 14}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11}>drops 4 V</text>
        </SvgFadeIn>

        {/* Traversal-direction curved arrow at bottom-left corner */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <path d={`M ${G.x0 + 14} ${G.y1 - 28}
                    A 22 22 0 0 1 ${G.x0 + 36} ${G.y1 - 6}`}
                fill="none" stroke="var(--rose-400)" strokeWidth={2.2}/>
          <polygon
            points={`${G.x0 + 36} ${G.y1 - 6}, ${G.x0 + 30} ${G.y1 - 18}, ${G.x0 + 44} ${G.y1 - 18}`}
            fill="var(--rose-400)"/>
          <text x={G.x0 + 50} y={G.y1 - 6}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.12em">CW</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.vbH - 16} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={14} letterSpacing="0.02em">
            we'll walk clockwise from the bottom-left corner
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Walker + running sum (genuine motion) ──────────────────────
// Walker traverses the loop in 4 phases (one per side). Each phase has a
// duration; the running sum updates the moment a side is fully crossed.
function WalkAndSumBeat() {
  const portrait = usePortrait();
  const G = loopGeometry(portrait);
  const { localTime, duration: spriteDur } = useSprite();

  // Walk timing inside the beat:
  //   HOLD before walker starts (lets the eye settle on the loop).
  //   Then 4 segments of equal length. End leaves a small tail for the
  //   final caption to fade in.
  const HOLD = 1.0;
  const TAIL = 2.2;
  const WALK_T = Math.max(spriteDur - HOLD - TAIL, 4);
  const segT = WALK_T / 4;

  // Local 0..WALK_T mapped from sprite time.
  const tWalk = clamp(localTime - HOLD, 0, WALK_T);

  // Which segment are we on, and how far along (0..1)?
  const segIdx = Math.min(3, Math.floor(tWalk / segT));
  const segProg = clamp((tWalk - segIdx * segT) / segT, 0, 1);

  // Loop perimeter coordinates: start at bottom-left, walk CW.
  // Segment 0: bottom-left → top-left (up via battery)        +12
  // Segment 1: top-left   → top-right (across via R1)         −8
  // Segment 2: top-right → bottom-right (down via R2)         −4
  // Segment 3: bottom-right → bottom-left (back along bottom)  0
  const corners = [
    { from: { x: G.x0, y: G.y1 }, to: { x: G.x0, y: G.y0 } },
    { from: { x: G.x0, y: G.y0 }, to: { x: G.x1, y: G.y0 } },
    { from: { x: G.x1, y: G.y0 }, to: { x: G.x1, y: G.y1 } },
    { from: { x: G.x1, y: G.y1 }, to: { x: G.x0, y: G.y1 } },
  ];
  const seg = corners[segIdx];
  const wx = seg.from.x + (seg.to.x - seg.from.x) * segProg;
  const wy = seg.from.y + (seg.to.y - seg.from.y) * segProg;

  // Sum updates AT the start of the next segment (i.e. after each
  // element is fully crossed).
  // sumStages[i] = sum after completing segment i (0-indexed).
  const sumStages = [0, +12, +4, 0, 0];   // initial, after seg 0, 1, 2, 3
  const currentSum = sumStages[segIdx];
  const sumStr = currentSum >= 0 ? `+${currentSum}` : `${currentSum}`;

  // Voltage tag delays (seconds within sprite, after HOLD): each tag
  // becomes visible when its segment is half-walked, then stays.
  const tagDelays = [HOLD + segT * 0.5, HOLD + segT * 1.5, HOLD + segT * 2.5];
  const showTag = i => localTime >= tagDelays[i];

  // Wire / element setup (re-rendered identical to beat 2 but mounted
  // fresh — beats own their own visuals for clean choreography).
  const battGapTop = G.battY - G.battH / 2;
  const battGapBot = G.battY + G.battH / 2;
  const r1GapL = G.r1X - G.resHalfW;
  const r1GapR = G.r1X + G.resHalfW;
  const r2GapTop = G.r2Y - G.resHalfW;
  const r2GapBot = G.r2Y + G.resHalfW;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Loop — instant fade in (we're continuing from beat 2) */}
        <g opacity={0.9}>
          <line x1={G.x0} y1={G.y1} x2={G.x1} y2={G.y1}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x0} y1={G.y0} x2={G.x0} y2={battGapTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x0} y1={battGapBot} x2={G.x0} y2={G.y1}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x0} y1={G.y0} x2={r1GapL} y2={G.y0}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={r1GapR} y1={G.y0} x2={G.x1} y2={G.y0}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x1} y1={G.y0} x2={G.x1} y2={r2GapTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.x1} y1={r2GapBot} x2={G.x1} y2={G.y1}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <BatteryV cx={G.x0} cy={G.battY} h={G.battH}/>
          <HResistor cx={G.r1X} cy={G.y0} halfW={G.resHalfW}
                     amp={G.resAmp} n={G.resN}/>
          <VResistor cx={G.x1} cy={G.r2Y} halfH={G.resHalfW}
                     amp={G.resAmp} n={G.resN}/>
        </g>

        {/* Voltage tags — appear as walker crosses each element */}
        {showTag(0) && (
          <g>
            <text x={G.x0 - 56} y={G.battY - 26} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)"
                  fontSize={G.tagFont} fontWeight="bold">+12 V</text>
          </g>
        )}
        {showTag(1) && (
          <text x={G.r1X} y={G.y0 - 16} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={G.tagFont} fontWeight="bold">−8 V</text>
        )}
        {showTag(2) && (
          <text x={G.x1 + 38} y={G.r2Y + 28}
                fill="var(--rose-300)" fontFamily="var(--font-mono)"
                fontSize={G.tagFont} fontWeight="bold">−4 V</text>
        )}

        {/* Running sum readout — centred inside the loop */}
        <g>
          <text x={G.sumX} y={G.sumLabelY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.sumLabelFont} letterSpacing="0.16em">RUNNING SUM</text>
          <text x={G.sumX} y={G.sumY + G.sumFont * 0.35} textAnchor="middle"
                fill={currentSum === 0 && segIdx > 0 ? 'var(--amber-300)' : 'var(--chalk-100)'}
                fontFamily="var(--font-mono)"
                fontSize={G.sumFont} fontWeight="bold">
            {sumStr} V
          </text>
        </g>

        {/* Walker dot — pulsing rose */}
        <g>
          <circle cx={wx} cy={wy} r={11}
                  fill="var(--rose-400)" opacity={0.25}/>
          <circle cx={wx} cy={wy} r={6}
                  fill="var(--rose-400)" stroke="var(--chalk-100)"
                  strokeWidth={1.4}/>
        </g>

        {/* Final caption — appears once walker has completed the loop */}
        {tWalk >= WALK_T - 0.05 && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <text x={G.vbW / 2} y={G.vbH - 16} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                  fontSize={14} letterSpacing="0.02em">
              the charge ends right where it started — same potential
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: KVL formula ────────────────────────────────────────────────
function KvlFormulaBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Kirchhoff's voltage law
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 44 : 56,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
          lineHeight: 1.1, textAlign: 'center',
        }}>
        ∑ V = 0
      </FadeUp>

      <FadeUp duration={0.4} delay={0.9} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          marginTop: -8,
        }}>
        around any closed loop
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26,
          color: 'var(--chalk-100)', letterSpacing: '0.04em',
          marginTop: 4,
        }}>
        +12 − 8 − 4 = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', textAlign: 'center',
          maxWidth: portrait ? '24ch' : '46ch', lineHeight: 1.45,
          marginTop: 4,
        }}>
        every charge that leaves the battery returns its boost — energy in equals energy out
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch', lineHeight: 1.3,
        }}>
        Rises = drops. Every closed loop, every time.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
          textTransform: 'uppercase',
        }}>
        the foundation of mesh analysis
      </FadeUp>
    </div>
  );
}

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
