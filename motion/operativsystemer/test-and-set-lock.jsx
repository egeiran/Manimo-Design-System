// Test-and-Set: Building a Lock with One Atomic Instruction — Manimo lesson scene.
// Why a single hardware instruction that reads-and-writes in one step is enough
// to build the simplest correct lock in computing.
//
// Beats (timed to single-track Voxtral narration in
// motion/operativsystemer/audio/test-and-set-lock/):
//    0.00– 7.40  Manimo intro: two threads, one shared resource
//    7.40–18.43  The atomic instruction — TestAndSet pseudocode, atomic brace
//   18.43–30.18  Contention: T1 wins, T2 loses; lock flips 0 → 1
//   30.18–44.41  Spin and release: timeline with T1, lock, T2 driven by playhead
//   44.41–54.00  Takeaway
//
// Authoring notes:
//   • Beat 4 carries the genuine animation: a shared playhead drives three
//     synchronised lanes (T1 status, lock value, T2 status) — the lock value
//     bar fills cell by cell, T2's "spinning" arc rotates while it waits, and
//     a release event flips both states at the same instant.
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.

const SCENE_DURATION = 54;

const NARRATION = [
  /*  0.00– 7.40 */ 'Two threads, one shared resource — and only one of them can have it at a time.',
  /*  7.40–18.43 */ "Test and set is one hardware instruction that does two things at once. It reads the lock's old value and writes one — atomically, so no other thread can slip in between.",
  /* 18.43–30.18 */ 'Two threads race for the lock. Thread one calls test and set first, gets back zero, and walks in. Thread two calls a moment later, gets back one, and has to wait.',
  /* 30.18–44.41 */ 'Thread two keeps trying. Each loop reads one, sees the lock is taken, and spins. When thread one finishes its work and writes zero, the very next call returns zero — and now thread two is the holder.',
  /* 44.41–54.00 */ 'Spin while busy. One atomic step does the test and the set together — and that is the simplest lock in computing.',
];

const NARRATION_AUDIO = 'audio/test-and-set-lock/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="locks"
      title="Test-and-Set: One Atomic Instruction"
      duration={SCENE_DURATION}
      introEnd={7.4}
      introCaption="How do two threads agree on whose turn it is?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.4} end={18.43}>
        <AtomicOpBeat />
      </Sprite>

      <Sprite start={18.43} end={30.18}>
        <ContendBeat />
      </Sprite>

      <Sprite start={30.18} end={44.41}>
        <SpinAndReleaseBeat />
      </Sprite>

      <Sprite start={44.41} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: The atomic instruction ───────────────────────────────────────
function AtomicOpBeat() {
  const portrait = usePortrait();
  // Layout: a centred code block in mono, with a brace down the left edge
  // labelled "atomic" — the brace draws in slightly after the code so the
  // viewer sees the three lines first, then realises they happen as one.
  const G = portrait
    ? { vbW: 600, vbH: 380, codeX: 120, codeY: 110, lineH: 38, fontSize: 22,
        braceX: 92, braceTop: 122, braceBot: 252, captionY: 320 }
    : { vbW: 880, vbH: 360, codeX: 240, codeY: 100, lineH: 42, fontSize: 26,
        braceX: 210, braceTop: 112, braceBot: 250, captionY: 310 };

  const lines = [
    { text: 'TestAndSet(lock, 1):',  color: 'var(--chalk-300)', indent: 0 },
    { text: 'old = *lock',           color: 'var(--chalk-100)', indent: 28 },
    { text: '*lock = 1',             color: 'var(--chalk-100)', indent: 28 },
    { text: 'return old',            color: 'var(--amber-300)', indent: 28 },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 16,
        }}>
        the instruction
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Code lines */}
        {lines.map((ln, i) => (
          <SvgFadeIn key={i} duration={0.4} delay={0.4 + i * 0.45}>
            <text x={G.codeX + ln.indent} y={G.codeY + i * G.lineH}
              fill={ln.color}
              fontFamily="var(--font-mono)" fontSize={G.fontSize}
              letterSpacing="0.02em">
              {ln.text}
            </text>
          </SvgFadeIn>
        ))}

        {/* Atomic brace on the left of lines 2-3 */}
        <SvgFadeIn duration={0.5} delay={2.2}>
          {/* Brace itself: vertical line + small inward ticks */}
          <line x1={G.braceX} y1={G.braceTop}
                x2={G.braceX} y2={G.braceBot}
                stroke="var(--rose-400)" strokeWidth={2}/>
          <line x1={G.braceX} y1={G.braceTop}
                x2={G.braceX + 10} y2={G.braceTop}
                stroke="var(--rose-400)" strokeWidth={2}/>
          <line x1={G.braceX} y1={G.braceBot}
                x2={G.braceX + 10} y2={G.braceBot}
                stroke="var(--rose-400)" strokeWidth={2}/>
          <line x1={G.braceX} y1={(G.braceTop + G.braceBot) / 2}
                x2={G.braceX - 8} y2={(G.braceTop + G.braceBot) / 2}
                stroke="var(--rose-400)" strokeWidth={2}/>
          {/* Atomic label */}
          <text x={G.braceX - 14} y={(G.braceTop + G.braceBot) / 2 + 5}
            textAnchor="end"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.18em">
            ATOMIC
          </text>
        </SvgFadeIn>

        {/* Inline annotation on the return line */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <text x={G.codeX + 28 + (portrait ? 160 : 200)} y={G.codeY + 3 * G.lineH}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={12}
            letterSpacing="0.04em">
            ← old value to caller
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={4.6}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            {portrait
              ? 'read and write happen as one — nothing slips between'
              : 'the read and the write happen as one — nothing can slip between'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Contention — two threads race ───────────────────────────────
function ContendBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  // Portrait stacks the two threads vertically with the lock between them so
  // the contention arrows are short and the labels sit cleanly to one side.
  // Landscape keeps the side-by-side layout because there is room horizontally.
  const G = portrait
    ? { vbW: 600, vbH: 720,
        t1X: 130, t2X: 130, panelW: 340, panelH: 200,
        t1Y: 20, t2Y: 500,
        lockCx: 300, lockCy: 360, lockR: 46,
        captionY: 700, vertical: true }
    : { vbW: 1080, vbH: 380,
        t1X: 60, t2X: 800, panelW: 220, panelH: 220,
        t1Y: 30, t2Y: 30,
        lockCx: 540, lockCy: 140, lockR: 44,
        captionY: 360, vertical: false };

  // Lock value: starts at 0, flips to 1 when T1 acquires (at delay ≈ 2.4)
  const t1Acquires = 2.4;
  const t2Tries    = 4.8;
  const lockValue = localTime > t1Acquires ? 1 : 0;
  const t1State =
    localTime < t1Acquires - 0.3 ? 'READY' :
    localTime < t1Acquires        ? 'CALLING' : 'HOLDING';
  const t2State =
    localTime < t2Tries - 0.3 ? 'READY' :
    localTime < t2Tries        ? 'CALLING' : 'SPINNING';

  // Pulse on the lock variable when value flips
  const flipFlash = clamp(1 - Math.max(0, localTime - t1Acquires), 0, 1);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Thread 1 panel */}
        <ThreadPanel
          x={G.t1X} y={G.t1Y} w={G.panelW} h={G.panelH}
          letter="1" accent="var(--amber-400)"
          state={t1State}
          stateColor={t1State === 'HOLDING' ? 'var(--amber-300)' : 'var(--chalk-300)'}
          delay={0.2}/>

        {/* Thread 2 panel */}
        <ThreadPanel
          x={G.t2X} y={G.t2Y} w={G.panelW} h={G.panelH}
          letter="2" accent="var(--rose-400)"
          state={t2State}
          stateColor={t2State === 'SPINNING' ? 'var(--rose-300)' : 'var(--chalk-300)'}
          delay={0.6}/>

        {/* Lock variable in the centre */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <circle cx={G.lockCx} cy={G.lockCy} r={G.lockR + 8}
            fill={lockValue === 1 ? 'var(--rose-400)' : 'var(--amber-400)'}
            opacity={0.18 + 0.5 * flipFlash}/>
          <circle cx={G.lockCx} cy={G.lockCy} r={G.lockR}
            fill="rgba(232,220,193,0.06)"
            stroke={lockValue === 1 ? 'var(--rose-400)' : 'var(--chalk-300)'}
            strokeWidth={2}/>
          <text x={G.lockCx} y={G.lockCy - 8}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.18em">
            LOCK
          </text>
          <text x={G.lockCx} y={G.lockCy + 18}
            textAnchor="middle"
            fill={lockValue === 1 ? 'var(--rose-300)' : 'var(--chalk-100)'}
            fontFamily="var(--font-mono)" fontSize={28}>
            {lockValue}
          </text>
        </SvgFadeIn>

        {G.vertical ? (
          <>
            {/* Vertical layout: T1 above lock, T2 below */}
            <ArrowWithLabel
              x1={G.lockCx} y1={G.t1Y + G.panelH + 8}
              x2={G.lockCx} y2={G.lockCy - G.lockR - 10}
              color="var(--amber-400)"
              label="TestAndSet → 0"
              labelColor="var(--amber-300)"
              delay={2.0}
              labelOffset={6} labelDx={86} labelAnchor="start"/>
            <ArrowWithLabel
              x1={G.lockCx} y1={G.t2Y - 8}
              x2={G.lockCx} y2={G.lockCy + G.lockR + 10}
              color="var(--rose-400)"
              label="TestAndSet → 1"
              labelColor="var(--rose-300)"
              delay={4.4}
              labelOffset={6} labelDx={86} labelAnchor="start"/>
          </>
        ) : (
          <>
            {/* Horizontal layout (landscape): T1 left, lock centre, T2 right */}
            <ArrowWithLabel
              x1={G.t1X + G.panelW + 10}
              y1={G.t1Y + G.panelH / 2}
              x2={G.lockCx - G.lockR - 6}
              y2={G.lockCy}
              color="var(--amber-400)"
              label="TestAndSet → 0"
              labelColor="var(--amber-300)"
              delay={2.0}
              labelOffset={-12} labelAnchor="middle"/>
            <ArrowWithLabel
              x1={G.t2X - 10}
              y1={G.t2Y + G.panelH / 2}
              x2={G.lockCx + G.lockR + 6}
              y2={G.lockCy}
              color="var(--rose-400)"
              label="TestAndSet → 1"
              labelColor="var(--rose-300)"
              delay={4.4}
              labelOffset={-12} labelAnchor="middle"/>
          </>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.6}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            zero back means you got the lock; one back means you didn't
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// One thread "card" with status badge.
function ThreadPanel({ x, y, w, h, letter, accent, state, stateColor, delay }) {
  return (
    <SvgFadeIn duration={0.5} delay={delay}>
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill="rgba(232,220,193,0.04)"
        stroke={accent} strokeWidth={1.4}/>
      {/* Header strip */}
      <rect x={x} y={y} width={w} height={36} rx={10}
        fill={accent} opacity={0.85}/>
      <rect x={x} y={y + 26} width={w} height={10}
        fill={accent} opacity={0.85}/>
      <text x={x + 16} y={y + 24}
        fill="#0c0a1f"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={20} fontWeight={500}>
        Thread {letter}
      </text>

      {/* State badge */}
      <text x={x + 16} y={y + 70}
        fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.16em">STATE</text>
      <text x={x + 16} y={y + 102}
        fill={stateColor}
        fontFamily="var(--font-mono)" fontSize={20}
        letterSpacing="0.08em">
        {state}
      </text>

      {/* Body — short pseudocode hint */}
      <line x1={x + 16} y1={y + 124} x2={x + w - 16} y2={y + 124}
        stroke="var(--chalk-300)" strokeWidth={1} opacity={0.3}/>
      <text x={x + 16} y={y + 148}
        fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.06em">while (TAS != 0)</text>
      <text x={x + 16} y={y + 168}
        fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.06em">  ; // spin</text>
      <text x={x + 16} y={y + 192}
        fill={accent} fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.06em">critical section</text>
    </SvgFadeIn>
  );
}

// Arrow that draws in then fades a label near its midpoint.
// labelDx/labelOffset shift the label from the midpoint so it can sit beside
// a vertical arrow rather than on top of it.
function ArrowWithLabel({ x1, y1, x2, y2, color, label, labelColor, delay,
                         labelOffset = -12, labelAnchor = 'middle', labelDx = 0 }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const headBack = 9;
  const headSide = 5.5;
  const px = -uy, py = ux;
  const baseX = x2 - ux * headBack;
  const baseY = y2 - uy * headBack;
  const w1x = baseX + px * headSide, w1y = baseY + py * headSide;
  const w2x = baseX - px * headSide, w2y = baseY - py * headSide;

  return (
    <>
      <TraceIn d={`M ${x1} ${y1} L ${x2} ${y2}`}
        stroke={color} strokeWidth={2}
        duration={0.6} delay={delay}/>
      <SvgFadeIn duration={0.3} delay={delay + 0.5}>
        <polygon points={`${x2},${y2} ${w1x},${w1y} ${w2x},${w2y}`}
          fill={color}/>
        <text
          x={(x1 + x2) / 2 + labelDx}
          y={(y1 + y2) / 2 + labelOffset}
          textAnchor={labelAnchor}
          fill={labelColor}
          fontFamily="var(--font-mono)" fontSize={12}
          letterSpacing="0.10em">
          {label}
        </text>
      </SvgFadeIn>
    </>
  );
}

// ─── Beat 4: Spin and release — three-lane timeline ──────────────────────
function SpinAndReleaseBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 520, laneX: 110, laneW: 460, laneH: 56, gap: 18,
        t1Y: 70, lockY: 144, t2Y: 218,
        axisY: 296, axisLabelY: 320, captionY: 410, eyebrowY: 30 }
    : { vbW: 1080, vbH: 360, laneX: 200, laneW: 800, laneH: 56, gap: 22,
        t1Y: 30, lockY: 108, t2Y: 186,
        axisY: 264, axisLabelY: 286, captionY: 320, eyebrowY: 0 };

  // 12-cell timeline. Cell 0..5: T1 holds, lock=1, T2 spins.
  // Cell 6..11: T1 done, lock=0 then 1 again, T2 holds.
  const N = 12;
  const slotW = G.laneW / N;
  const releaseCell = 6;

  // Sweep: starts at delay 1.0, takes 8s.
  const sweepStart = 1.0;
  const sweepDur = 8.0;
  const t = clamp((localTime - sweepStart) / sweepDur, 0, 1);
  const playheadX = G.laneX + t * G.laneW;
  const filled = Math.min(N, Math.floor(t * N));
  const partial = t * N - filled;

  // Lock value per cell. Briefly 0 in cell 6, then back to 1.
  const lockSeq = [1,1,1,1,1,1, 0, 1,1,1,1,1];
  // T1 status: HOLDING for cells 0..5, then ─ (idle).
  const t1Seq = ['HOLD','HOLD','HOLD','HOLD','HOLD','HOLD', 'DONE','DONE','DONE','DONE','DONE','DONE'];
  // T2 status: SPIN for cells 0..5, ACQUIRES at cell 6, then HOLD.
  const t2Seq = ['SPIN','SPIN','SPIN','SPIN','SPIN','SPIN', 'GOT','HOLD','HOLD','HOLD','HOLD','HOLD'];

  const stateColor = (lane, code) => {
    if (lane === 't1') return code === 'HOLD' ? 'var(--amber-400)' : 'var(--chalk-300)';
    if (lane === 'lock') return code === 1 ? 'var(--rose-400)' : 'var(--amber-400)';
    if (lane === 't2') {
      if (code === 'SPIN') return 'var(--rose-400)';
      if (code === 'GOT')  return 'var(--amber-400)';
      return 'var(--rose-400)'; // HOLD
    }
    return 'var(--chalk-300)';
  };

  // Spinning indicator for T2 while still spinning. Local rotation tied to localTime.
  const spinAngle = (localTime * 360 * 1.4) % 360;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 12,
        }}>
        spin · release · acquire
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Lane labels */}
        {[
          { y: G.t1Y,   label: 'T1',   color: 'var(--amber-300)' },
          { y: G.lockY, label: 'LOCK', color: 'var(--chalk-200)' },
          { y: G.t2Y,   label: 'T2',   color: 'var(--rose-300)' },
        ].map((row, i) => (
          <SvgFadeIn key={row.label} duration={0.4} delay={0.2 + i * 0.12}>
            <text x={G.laneX - 12} y={row.y + G.laneH / 2 + 5}
              textAnchor="end"
              fill={row.color}
              fontFamily="var(--font-mono)" fontSize={12}
              letterSpacing="0.12em">
              {row.label}
            </text>
            <rect x={G.laneX} y={row.y} width={G.laneW} height={G.laneH}
              fill="none" stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
          </SvgFadeIn>
        ))}

        {/* T1 lane cells */}
        {t1Seq.slice(0, filled + 1).map((code, i) => {
          if (i > filled) return null;
          const w = i < filled ? slotW - 1.5 : Math.max(0, partial * slotW - 1.5);
          if (w <= 0) return null;
          const isHold = code === 'HOLD';
          return (
            <g key={`t1-${i}`}>
              <rect x={G.laneX + i * slotW} y={G.t1Y}
                width={w} height={G.laneH}
                fill={isHold ? 'var(--amber-400)' : 'rgba(232,220,193,0.04)'}
                opacity={isHold ? 0.55 : 1}
                stroke={isHold ? 'var(--amber-400)' : 'transparent'}
                strokeWidth={1}/>
              {isHold && i === Math.floor(filled / 2) && i < filled && (
                <text x={G.laneX + i * slotW + slotW / 2} y={G.t1Y + G.laneH / 2 + 5}
                  textAnchor="middle" fill="var(--bg-canvas)"
                  fontFamily="var(--font-mono)" fontSize={11}
                  letterSpacing="0.16em">HOLDING</text>
              )}
            </g>
          );
        })}
        {/* "RELEASES" marker */}
        {filled >= releaseCell && (
          <SvgFadeIn duration={0.3} delay={0}>
            <line x1={G.laneX + releaseCell * slotW} y1={G.t1Y - 6}
              x2={G.laneX + releaseCell * slotW} y2={G.t1Y + G.laneH + 6}
              stroke="var(--chalk-100)" strokeWidth={1.5} strokeDasharray="3 3"/>
            <text x={G.laneX + releaseCell * slotW + 6} y={G.t1Y - 8}
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={10}
              letterSpacing="0.18em">
              RELEASE
            </text>
          </SvgFadeIn>
        )}

        {/* Lock lane cells — value 1 (rose) or 0 (amber) */}
        {lockSeq.slice(0, filled + 1).map((val, i) => {
          if (i > filled) return null;
          const w = i < filled ? slotW - 1.5 : Math.max(0, partial * slotW - 1.5);
          if (w <= 0) return null;
          const c = val === 1 ? 'var(--rose-400)' : 'var(--amber-400)';
          return (
            <g key={`lock-${i}`}>
              <rect x={G.laneX + i * slotW} y={G.lockY}
                width={w} height={G.laneH}
                fill={c} opacity={0.45}
                stroke={c} strokeWidth={1}/>
              {(i < filled && (i === 2 || i === releaseCell || i === 9)) && (
                <text x={G.laneX + i * slotW + slotW / 2} y={G.lockY + G.laneH / 2 + 7}
                  textAnchor="middle" fill="var(--chalk-100)"
                  fontFamily="var(--font-mono)" fontSize={18}>
                  {val}
                </text>
              )}
            </g>
          );
        })}

        {/* T2 lane cells */}
        {t2Seq.slice(0, filled + 1).map((code, i) => {
          if (i > filled) return null;
          const w = i < filled ? slotW - 1.5 : Math.max(0, partial * slotW - 1.5);
          if (w <= 0) return null;
          const isSpin = code === 'SPIN';
          const isHold = code === 'HOLD';
          const isGot  = code === 'GOT';
          let bg = 'rgba(232,220,193,0.04)';
          if (isSpin) bg = 'var(--rose-400)';
          if (isHold) bg = 'var(--rose-400)';
          if (isGot)  bg = 'var(--amber-300)';
          return (
            <g key={`t2-${i}`}>
              <rect x={G.laneX + i * slotW} y={G.t2Y}
                width={w} height={G.laneH}
                fill={bg}
                opacity={isSpin ? 0.28 : isHold ? 0.55 : isGot ? 0.65 : 0.6}
                stroke={isSpin ? 'var(--rose-400)' : isHold ? 'var(--rose-400)' : 'var(--amber-400)'}
                strokeWidth={1}/>
            </g>
          );
        })}
        {/* T2 spinning glyph — only while T2 is in spin range and the playhead
             hasn't yet crossed the release cell. */}
        {filled < releaseCell && filled > 0 && (
          <g transform={`translate(${G.laneX + filled * slotW + slotW / 2} ${G.t2Y + G.laneH / 2}) rotate(${spinAngle})`}>
            <path d="M -10 0 A 10 10 0 1 1 -10 -0.01"
              fill="none" stroke="var(--chalk-100)" strokeWidth={2}/>
            <polygon points="-10,0 -7,-3 -7,3" fill="var(--chalk-100)"/>
          </g>
        )}
        {/* T2 status label after acquire */}
        {filled > releaseCell && (
          <text x={G.laneX + 9 * slotW + slotW / 2} y={G.t2Y + G.laneH / 2 + 5}
            textAnchor="middle" fill="var(--bg-canvas)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">HOLDING</text>
        )}
        {filled <= releaseCell + 1 && filled >= releaseCell && (
          <text x={G.laneX + 2 * slotW + slotW / 2} y={G.t2Y + G.laneH / 2 + 5}
            textAnchor="middle" fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">SPINNING…</text>
        )}

        {/* Playhead spans all three lanes */}
        {localTime > sweepStart && t < 1 && (
          <g>
            <line x1={playheadX} y1={G.t1Y - 8}
              x2={playheadX} y2={G.t2Y + G.laneH + 8}
              stroke="var(--chalk-100)" strokeWidth={1.5} strokeDasharray="2 4"/>
            <polygon
              points={`${playheadX - 6},${G.t1Y - 14} ${playheadX + 6},${G.t1Y - 14} ${playheadX},${G.t1Y - 6}`}
              fill="var(--chalk-100)"/>
          </g>
        )}

        {/* Time axis */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={G.laneX} y1={G.axisY} x2={G.laneX + G.laneW} y2={G.axisY}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.laneX} y={G.axisLabelY}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>0</text>
          <text x={G.laneX + G.laneW} y={G.axisLabelY}
            textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>time →</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={8.6}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.06em">
            spin while busy — the next test-and-set after release wins
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
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '36ch',
          lineHeight: 1.3,
        }}>
        One atomic step. Test, then set.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
          maxWidth: portrait ? '32ch' : 'none',
        }}>
        the spin lock — simplest mutex in the book
      </FadeUp>
    </div>
  );
}

window.sceneNarration = NARRATION;

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
