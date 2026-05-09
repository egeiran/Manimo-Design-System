// Virtualizing the CPU — Manimo lesson scene.
// Why one physical processor can run dozens of programs simultaneously.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/virtualizing-cpu/):
//    0.00– 7.99  Manimo intro: how does one chip run a hundred things?
//    7.99–18.31  The illusion: four programs each "owning" their own CPU
//   18.31–27.69  The reality: one CPU, time-sliced into many pieces
//   27.69–37.16  Context switch: save, restore, repeat
//   37.16–45.00  Takeaway: one processor, many processes, one illusion
//
// Authoring notes:
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.
//   • Pulse dot uses local sprite time → continuous animation.
//   • Timeline playhead is driven by localTime so it scrubs cleanly.

const SCENE_DURATION = 45;

const NARRATION = [
  /*  0.00– 7.99 */ 'Your laptop runs dozens of programs at once — but the chip inside has only a handful of cores. How can that be?',
  /*  7.99–18.31 */ 'Picture four programs running side by side. Each one acts as if it owns the entire processor — its own counter, its own registers, its own little CPU.',
  /* 18.31–27.69 */ 'But underneath there is only one CPU. The operating system slices time into tiny pieces, and on each slice a different program gets to run.',
  /* 27.69–37.16 */ "Between slices the OS saves the running program's state, and restores the next one's — a context switch, performed thousands of times every second.",
  /* 37.16–45.00 */ 'One processor, many processes — that is the illusion the operating system calls CPU virtualization.',
];

const NARRATION_AUDIO = 'audio/virtualizing-cpu/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="introduction"
      title="Virtualizing the CPU"
      duration={SCENE_DURATION}
      introEnd={7.99}
      introCaption="How does one chip run a hundred things at once?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.99} end={18.31}>
        <IllusionBeat />
      </Sprite>

      <Sprite start={18.31} end={27.69}>
        <RealityBeat />
      </Sprite>

      <Sprite start={27.69} end={37.16}>
        <ContextSwitchBeat />
      </Sprite>

      <Sprite start={37.16} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: The illusion — four CPU cards ────────────────────────────────
// Four small "CPU" cards in a row, each pretending to be its own processor.
// A pulsing dot per card (driven by sprite localTime) sells the "running"
// feeling without dragging the eye to any single card.
function IllusionBeat() {
  const portrait = usePortrait();
  const procs = [
    { letter: 'A', color: 'var(--amber-400)', textOnFill: '#0c0a1f' },
    { letter: 'B', color: 'var(--rose-400)',  textOnFill: '#0c0a1f' },
    { letter: 'C', color: 'var(--teal-400)',  textOnFill: '#0c0a1f' },
    { letter: 'D', color: 'var(--violet-400)',textOnFill: '#0c0a1f' },
  ];

  const G = portrait
    ? { cardW: 240, cardH: 130, gap: 18, cols: 2, vbW: 600, vbH: 320, offsetY: 30 }
    : { cardW: 200, cardH: 150, gap: 28, cols: 4, vbW: 920, vbH: 200, offsetY: 0 };

  const rows = Math.ceil(procs.length / G.cols);
  const totalW = G.cols * G.cardW + (G.cols - 1) * G.gap;
  const totalH = rows * G.cardH + (rows - 1) * G.gap;
  const startX = (G.vbW - totalW) / 2;
  const startY = (G.vbH - totalH) / 2 + G.offsetY;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.35} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 14,
        }}>
        the illusion
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {procs.map((p, i) => {
          const col = i % G.cols;
          const row = Math.floor(i / G.cols);
          const x = startX + col * (G.cardW + G.gap);
          const y = startY + row * (G.cardH + G.gap);
          return (
            <CpuCard key={p.letter}
              x={x} y={y} w={G.cardW} h={G.cardH}
              letter={p.letter} accent={p.color} textOnFill={p.textOnFill}
              delay={0.35 + i * 0.18}
              pulsePhase={i * 0.6}/>
          );
        })}
      </svg>

      <FadeUp duration={0.5} delay={4.5} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          textAlign: 'center', marginTop: portrait ? 18 : 22,
          maxWidth: portrait ? '24ch' : 'none',
        }}>
        every program thinks it owns the whole machine
      </FadeUp>
    </div>
  );
}

// One CPU "card" — rounded rect, process letter, register lines, pulse dot.
function CpuCard({ x, y, w, h, letter, accent, textOnFill, delay, pulsePhase = 0 }) {
  const { localTime } = useSprite();
  // Continuous "running" pulse: 0..1 sine, eased into a soft glow on the dot.
  const pulse = 0.55 + 0.45 * Math.sin((localTime + pulsePhase) * 3.4);
  const dotR = 4 + 1.2 * pulse;
  const dotOp = 0.55 + 0.45 * pulse;

  return (
    <SvgFadeIn duration={0.5} delay={delay}>
      {/* Card background */}
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill="rgba(232,220,193,0.04)"
        stroke="var(--chalk-300)" strokeWidth={1.2}/>

      {/* Top stripe with process letter */}
      <rect x={x} y={y} width={w} height={32} rx={10}
        fill={accent} opacity={0.9}/>
      {/* Mask the bottom of the stripe so the corners stay rounded but the
          edge with the body is straight. */}
      <rect x={x} y={y + 22} width={w} height={10} fill={accent} opacity={0.9}/>

      <text x={x + 16} y={y + 22}
        fill={textOnFill}
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={20} fontWeight={500}>
        Process {letter}
      </text>
      <text x={x + w - 16} y={y + 22}
        textAnchor="end"
        fill="#0c0a1f"
        opacity={0.7}
        fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.12em">
        CPU
      </text>

      {/* Body — register/PC strip */}
      <text x={x + 16} y={y + 58}
        fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.06em">PC</text>
      <text x={x + 44} y={y + 58}
        fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={12}>
        0x{(0x4000 + letter.charCodeAt(0) * 16).toString(16)}
      </text>

      <text x={x + 16} y={y + 78}
        fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.06em">SP</text>
      <text x={x + 44} y={y + 78}
        fill="var(--chalk-100)" fontFamily="var(--font-mono)" fontSize={12}>
        0xff{letter.toLowerCase()}0
      </text>

      <text x={x + 16} y={y + 98}
        fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.06em">REG</text>
      <line x1={x + 44} y1={y + 95} x2={x + w - 16} y2={y + 95}
        stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 4" opacity={0.6}/>

      {/* Bottom row — running indicator */}
      <circle cx={x + 18} cy={y + h - 18} r={dotR}
        fill={accent} opacity={dotOp}/>
      <text x={x + 32} y={y + h - 13}
        fill="var(--chalk-200)" fontFamily="var(--font-mono)" fontSize={10}
        letterSpacing="0.16em">RUNNING</text>
    </SvgFadeIn>
  );
}

// ─── Beat 3: The reality — one CPU, time-sliced ───────────────────────────
function RealityBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 460, cpuW: 220, cpuH: 110, cpuY: 30,
        stripY: 220, stripH: 56, stripW: 540, stripX: 30,
        slots: 12, axisLabelY: 320, captionY: 360 }
    : { vbW: 1080, vbH: 360, cpuW: 260, cpuH: 130, cpuY: 10,
        stripY: 200, stripH: 64, stripW: 960, stripX: 60,
        slots: 12, axisLabelY: 290, captionY: 330 };

  // Repeating schedule across the strip. Use hand-picked pattern that looks
  // "irregular but fair" — A appears most often as a stand-in for a high-
  // priority interactive process, the others fill the gaps.
  const schedule = ['A','B','A','C','D','A','B','C','A','D','A','B'];
  const colors = {
    A: 'var(--amber-400)', B: 'var(--rose-400)',
    C: 'var(--teal-400)',  D: 'var(--violet-400)',
  };
  const slotW = G.stripW / G.slots;

  // Playhead sweeps left→right starting at delay 1.6, taking ~6.0s to cross.
  const sweepStart = 1.6;
  const sweepDur = 6.0;
  const t = clamp((localTime - sweepStart) / sweepDur, 0, 1);
  const playheadX = G.stripX + t * G.stripW;
  const activeSlot = Math.min(G.slots - 1, Math.floor(t * G.slots));
  const cpuLetter = schedule[activeSlot] || schedule[0];

  // CPU label visibility: only after the stripe begins.
  const cpuLabelOn = localTime > sweepStart - 0.1;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.35} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--rose-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 10,
        }}>
        the reality
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Single big CPU box */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          <rect x={(G.vbW - G.cpuW) / 2} y={G.cpuY} width={G.cpuW} height={G.cpuH}
            rx={12}
            fill="rgba(244,184,96,0.06)"
            stroke="var(--amber-400)" strokeWidth={2}/>
          <text x={G.vbW / 2} y={G.cpuY + 30}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">1 CPU</text>
        </SvgFadeIn>

        {/* Currently-running letter inside the CPU (synced to playhead) */}
        <g style={{ opacity: cpuLabelOn ? 1 : 0, transition: 'opacity 0.2s' }}>
          <text x={G.vbW / 2} y={G.cpuY + G.cpuH / 2 + 22}
            textAnchor="middle"
            fill={colors[cpuLetter] || 'var(--chalk-100)'}
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={56} fontWeight={500}>
            {cpuLetter}
          </text>
          <text x={G.vbW / 2} y={G.cpuY + G.cpuH - 14}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">NOW RUNNING</text>
        </g>

        {/* Connector arrow CPU → strip */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <line x1={G.vbW / 2} y1={G.cpuY + G.cpuH + 4}
            x2={G.vbW / 2} y2={G.stripY - 8}
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 4"/>
        </SvgFadeIn>

        {/* Time-slice strip */}
        <SvgFadeIn duration={0.5} delay={1.4}>
          {schedule.map((letter, i) => (
            <g key={i}>
              <rect x={G.stripX + i * slotW} y={G.stripY}
                width={slotW - 2} height={G.stripH}
                fill={colors[letter]} opacity={0.42}
                stroke={colors[letter]} strokeWidth={1.2}/>
              <text x={G.stripX + i * slotW + slotW / 2}
                y={G.stripY + G.stripH / 2 + 5}
                textAnchor="middle"
                fill="var(--chalk-100)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={20}>
                {letter}
              </text>
            </g>
          ))}
          {/* Strip outline */}
          <rect x={G.stripX} y={G.stripY} width={G.stripW} height={G.stripH}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
        </SvgFadeIn>

        {/* Playhead */}
        {localTime > sweepStart && (
          <g>
            <line x1={playheadX} y1={G.stripY - 6}
              x2={playheadX} y2={G.stripY + G.stripH + 6}
              stroke="var(--rose-400)" strokeWidth={2.5}/>
            <polygon
              points={`${playheadX - 6},${G.stripY - 12} ${playheadX + 6},${G.stripY - 12} ${playheadX},${G.stripY - 4}`}
              fill="var(--rose-400)"/>
          </g>
        )}

        {/* Time axis arrow */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <line x1={G.stripX} y1={G.axisLabelY - 8}
            x2={G.stripX + G.stripW} y2={G.axisLabelY - 8}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <polygon
            points={`${G.stripX + G.stripW},${G.axisLabelY - 8} ${G.stripX + G.stripW - 8},${G.axisLabelY - 12} ${G.stripX + G.stripW - 8},${G.axisLabelY - 4}`}
            fill="var(--chalk-300)"/>
          <text x={G.stripX + G.stripW / 2} y={G.axisLabelY + 10}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">TIME</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={4.2}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            one slice at a time — but switched fast enough to feel parallel
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Context switch — save and restore ────────────────────────────
function ContextSwitchBeat() {
  const portrait = usePortrait();
  // Geometry: three horizontal panels — Process A (left), CPU/PCB (centre),
  // Process B (right). Two arrows: A → CPU (save) and CPU → B (restore),
  // staggered in time.
  const G = portrait
    ? { vbW: 600, vbH: 480, panelW: 230, panelH: 180,
        leftX: 30, rightX: 340, panelY: 80,
        cpuW: 180, cpuH: 90, cpuX: 210, cpuY: 320,
        captionY: 450 }
    : { vbW: 1100, vbH: 320, panelW: 280, panelH: 200,
        leftX: 60, rightX: 760, panelY: 60,
        cpuW: 200, cpuH: 90, cpuX: 450, cpuY: 110,
        captionY: 290 };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Process A panel (left) */}
        <ProcessStatePanel
          x={G.leftX} y={G.panelY} w={G.panelW} h={G.panelH}
          letter="A" accent="var(--amber-400)"
          delay={0.1} faded={false}/>

        {/* Save arrow A → centre (PCB/memory) */}
        <FlowArrow
          x1={G.leftX + G.panelW + 8} y1={G.panelY + G.panelH / 2}
          x2={G.cpuX - 8} y2={G.cpuY + G.cpuH / 2}
          color="var(--rose-400)"
          label="save"
          labelColor="var(--rose-300)"
          delay={1.2}/>

        {/* PCB / memory box in centre — the "CPU bookkeeper" */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <rect x={G.cpuX} y={G.cpuY} width={G.cpuW} height={G.cpuH}
            rx={10}
            fill="rgba(232,220,193,0.05)"
            stroke="var(--chalk-200)" strokeWidth={1.4}/>
          <text x={G.cpuX + G.cpuW / 2} y={G.cpuY + 22}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.18em">PROCESS TABLE</text>
          <text x={G.cpuX + G.cpuW / 2} y={G.cpuY + 50}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={20}>
            PCB[A], PCB[B]
          </text>
          <text x={G.cpuX + G.cpuW / 2} y={G.cpuY + 74}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}>
            kept by the OS
          </text>
        </SvgFadeIn>

        {/* Restore arrow centre → B */}
        <FlowArrow
          x1={G.cpuX + G.cpuW + 8} y1={G.cpuY + G.cpuH / 2}
          x2={G.rightX - 8} y2={G.panelY + G.panelH / 2}
          color="var(--amber-400)"
          label="restore"
          labelColor="var(--amber-300)"
          delay={2.6}/>

        {/* Process B panel (right) */}
        <ProcessStatePanel
          x={G.rightX} y={G.panelY} w={G.panelW} h={G.panelH}
          letter="B" accent="var(--rose-400)"
          delay={2.0} faded={false}/>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            thousands of switches per second — so fast it feels parallel
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

function ProcessStatePanel({ x, y, w, h, letter, accent, delay }) {
  return (
    <SvgFadeIn duration={0.5} delay={delay}>
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill="rgba(232,220,193,0.04)"
        stroke={accent} strokeWidth={1.4}/>
      <text x={x + 16} y={y + 26}
        fill={accent}
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={20}>
        Process {letter}
      </text>
      <line x1={x + 16} y1={y + 38} x2={x + w - 16} y2={y + 38}
        stroke={accent} strokeWidth={1} opacity={0.4}/>

      {[
        ['PC',  letter === 'A' ? '0x401a' : '0x402b'],
        ['SP',  letter === 'A' ? '0xffa0' : '0xffb0'],
        ['eax', letter === 'A' ? '0x0007' : '0x002a'],
        ['ebx', letter === 'A' ? '0xc1d8' : '0x0040'],
      ].map(([k, v], i) => (
        <g key={k}>
          <text x={x + 18} y={y + 64 + i * 24}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.06em">
            {k}
          </text>
          <text x={x + 60} y={y + 64 + i * 24}
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={12}>
            {v}
          </text>
        </g>
      ))}
    </SvgFadeIn>
  );
}

// FlowArrow — a draw-in line plus a labeled head, used to show data flow.
function FlowArrow({ x1, y1, x2, y2, color, label, labelColor, delay }) {
  // Arrow head triangle anchored at (x2,y2), pointing along the line.
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  const headBack = 9;
  const headSide = 5;
  // Perpendicular vector for the head's wings.
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
        {/* Label centred above the line midpoint */}
        <text
          x={(x1 + x2) / 2}
          y={(y1 + y2) / 2 - 10}
          textAnchor="middle"
          fill={labelColor}
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.16em">
          {label.toUpperCase()}
        </text>
      </SvgFadeIn>
    </>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
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
        One processor. Many processes. One illusion.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
        }}>
        the OS calls this CPU virtualization
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
