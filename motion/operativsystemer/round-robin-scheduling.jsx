// Round-Robin Scheduling: Fairness by the Slice — Manimo lesson scene.
// Why FIFO starves interactive jobs and how round-robin's fixed time slice
// trades a little overhead for predictable response time.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/round-robin-scheduling/):
//    0.00– 6.03  Manimo intro: three jobs, one CPU
//    6.03–17.80  FIFO Gantt — A starves B and C
//   17.80–28.48  Round-robin queue: rotate every q
//   28.48–39.44  Gantt fills as RR runs (genuine motion: playhead + queue rotate)
//   39.44–50.00  Trade-off: small q vs large q
//
// Authoring notes:
//   • Beat 4 carries the genuine animation: the Gantt strip fills cell by
//     cell driven by sprite localTime, while the ready queue rotates each
//     tick. Both share a single time variable so they stay locked.
//   • SvgFadeIn for elements inside <svg>; FadeUp for HTML/DOM only.

const SCENE_DURATION = 50;

const NARRATION = [
  /*  0.00– 6.03 */ 'Three programs are ready to run, but only one CPU. Who goes first — and for how long?',
  /*  6.03–17.80 */ 'First in, first out runs each job to completion. Job A is long, so jobs B and C wait — and a quick keystroke in C can sit idle for seconds. That is starvation by queue order.',
  /* 17.80–28.48 */ 'Round-robin fixes that. Pick a fixed time slice — say one unit — give it to the next ready job, then rotate. The queue keeps spinning while everyone makes progress.',
  /* 28.48–39.44 */ 'Watch the Gantt chart fill up. A, B, C, A, B, C — every job gets the CPU within one tick of being ready. Response time becomes predictable.',
  /* 39.44–50.00 */ 'A small slice feels snappy but spends time on context switches. A big slice runs efficiently but starts to look like FIFO. Picking the slice is the whole game.',
];

const NARRATION_AUDIO = 'audio/round-robin-scheduling/scene.mp3';

const JOB_COLORS = {
  A: 'var(--amber-400)',
  B: 'var(--rose-400)',
  C: 'var(--teal-400)',
};

function Scene() {
  return (
    <SceneChrome
      eyebrow="scheduling"
      title="Round-Robin: Fairness by the Slice"
      duration={SCENE_DURATION}
      introEnd={6.03}
      introCaption="Three jobs, one CPU — whose turn is it?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.03} end={17.8}>
        <FifoBeat />
      </Sprite>

      <Sprite start={17.8} end={28.48}>
        <QuantumBeat />
      </Sprite>

      <Sprite start={28.48} end={39.44}>
        <GanttBeat />
      </Sprite>

      <Sprite start={39.44} end={SCENE_DURATION}>
        <TradeoffBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: FIFO ─────────────────────────────────────────────────────────
// One static Gantt strip showing the pathological FIFO ordering: A runs
// for 8 units, then B for 2, then C for 2. The cells trace in left to
// right so the viewer feels the long wait viscerally.
function FifoBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 380, stripX: 30, stripY: 160, stripW: 540, stripH: 70,
        captionY: 290, eyebrowY: 80, axisY: 250 }
    : { vbW: 1080, vbH: 320, stripX: 60, stripY: 130, stripW: 960, stripH: 80,
        captionY: 260, eyebrowY: 70, axisY: 230 };

  // 12 cells: AAAAAAAA BB CC
  const schedule = ['A','A','A','A','A','A','A','A','B','B','C','C'];
  const slotW = G.stripW / schedule.length;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 14,
        }}>
        first attempt: FIFO
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Strip outline */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <rect x={G.stripX} y={G.stripY} width={G.stripW} height={G.stripH}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
        </SvgFadeIn>

        {/* Cells fade in left to right with stagger */}
        {schedule.map((letter, i) => {
          const cellDelay = 0.6 + i * 0.16;
          return (
            <SvgFadeIn key={i} duration={0.3} delay={cellDelay}>
              <rect x={G.stripX + i * slotW} y={G.stripY}
                width={slotW - 1.5} height={G.stripH}
                fill={JOB_COLORS[letter]} opacity={0.5}
                stroke={JOB_COLORS[letter]} strokeWidth={1}/>
              <text x={G.stripX + i * slotW + slotW / 2}
                y={G.stripY + G.stripH / 2 + 7}
                textAnchor="middle"
                fill="var(--chalk-100)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={portrait ? 18 : 22}>
                {letter}
              </text>
            </SvgFadeIn>
          );
        })}

        {/* Axis */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.stripX} y1={G.axisY} x2={G.stripX + G.stripW} y2={G.axisY}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.stripX} y={G.axisY + 18}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>
            0
          </text>
          <text x={G.stripX + G.stripW} y={G.axisY + 18}
            textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>
            time →
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            C waits 10 units before running — starvation by queue order
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Quantum — circular ready queue ───────────────────────────────
// A circular ready queue where the head pointer rotates once per quantum.
// Genuine motion: rotation lookup driven by sprite localTime so the arrow
// advances smoothly between job slots and pauses on each.
function QuantumBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 560, vbH: 460, cx: 280, cy: 230, R: 130, jobR: 36,
        captionY: 410, eyebrowY: 30, qBoxY: 230 }
    : { vbW: 880, vbH: 400, cx: 440, cy: 200, R: 130, jobR: 38,
        captionY: 360, eyebrowY: 40, qBoxY: 200 };

  // Three jobs equally spaced around the circle. Angles in degrees: top, br, bl.
  const angles = [-90, 30, 150];
  const jobs = ['A', 'B', 'C'];

  // Pointer rotation: starts on A (top), advances every 1.0s per quantum.
  // Use eased step so the pointer "snaps" between slots.
  const pointerStartDelay = 1.4;
  const quantumDur = 1.0;
  const elapsed = Math.max(0, localTime - pointerStartDelay);
  const slot = Math.floor(elapsed / quantumDur) % 3;
  // Smooth fraction within the slot for the arrow tip glide.
  const slotFrac = clamp((elapsed % quantumDur) / quantumDur, 0, 1);
  const eased = slotFrac < 0.5
    ? 2 * slotFrac * slotFrac
    : 1 - Math.pow(-2 * slotFrac + 2, 2) / 2;
  const fromAngle = angles[slot];
  const toAngle = angles[(slot + 1) % 3];
  // Rotate the shorter way around the circle
  let dAng = toAngle - fromAngle;
  if (dAng > 180) dAng -= 360;
  if (dAng < -180) dAng += 360;
  const pointerAngle = fromAngle + dAng * eased;
  const pointerRad = (pointerAngle * Math.PI) / 180;
  // The arrow tip rests just outside the active job circle. Start the
  // shaft a comfortable distance out from the centre so the line never
  // crosses the centre label.
  const innerR = 50;
  const tipR = G.R - G.jobR - 6;
  const baseX = G.cx + innerR * Math.cos(pointerRad);
  const baseY = G.cy + innerR * Math.sin(pointerRad);
  const tipX = G.cx + tipR * Math.cos(pointerRad);
  const tipY = G.cy + tipR * Math.sin(pointerRad);

  // Active job halo only on the slot we're currently *on*.
  const activeJob = jobs[slot];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 16,
        }}>
        round-robin
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Dotted ring suggesting the ready queue's cycle */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <circle cx={G.cx} cy={G.cy} r={G.R}
            fill="none"
            stroke="var(--chalk-300)" strokeWidth={1.2}
            strokeDasharray="4 6"
            opacity={0.6}/>
        </SvgFadeIn>

        {/* The three jobs around the circle */}
        {jobs.map((letter, i) => {
          const ang = (angles[i] * Math.PI) / 180;
          const jx = G.cx + G.R * Math.cos(ang);
          const jy = G.cy + G.R * Math.sin(ang);
          const isActive = letter === activeJob && elapsed > 0;
          return (
            <SvgFadeIn key={letter} duration={0.4} delay={0.6 + i * 0.2}>
              {isActive && (
                <circle cx={jx} cy={jy} r={G.jobR + 8}
                  fill={JOB_COLORS[letter]} opacity={0.18}/>
              )}
              <circle cx={jx} cy={jy} r={G.jobR}
                fill={JOB_COLORS[letter]} opacity={isActive ? 0.95 : 0.55}
                stroke={JOB_COLORS[letter]} strokeWidth={1.5}/>
              <text x={jx} y={jy + 9}
                textAnchor="middle"
                fill="var(--bg-canvas)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={28} fontWeight={500}>
                {letter}
              </text>
            </SvgFadeIn>
          );
        })}

        {/* Centre label: the quantum value */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={G.cx} y={G.cy - 4}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">QUANTUM</text>
          <text x={G.cx} y={G.cy + 22}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={28}>
            q = 1
          </text>
        </SvgFadeIn>

        {/* Rotating pointer arrow — starts outside the centre label so
            the shaft never crosses the QUANTUM text. */}
        {elapsed > 0 && (
          <g>
            <line x1={baseX} y1={baseY} x2={tipX} y2={tipY}
              stroke="var(--rose-400)" strokeWidth={2.5}/>
            <Arrowhead x={tipX} y={tipY} angleRad={pointerRad} color="var(--rose-400)" size={8}/>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            head of queue runs for q, then rotates to the back
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// Small reusable arrowhead. angleRad is the direction the arrow points.
function Arrowhead({ x, y, angleRad, color, size = 8 }) {
  const ux = Math.cos(angleRad), uy = Math.sin(angleRad);
  const px = -uy, py = ux;
  const back = size;
  const side = size * 0.55;
  const baseX = x - ux * back;
  const baseY = y - uy * back;
  const w1x = baseX + px * side, w1y = baseY + py * side;
  const w2x = baseX - px * side, w2y = baseY - py * side;
  return <polygon points={`${x},${y} ${w1x},${w1y} ${w2x},${w2y}`} fill={color}/>;
}

// ─── Beat 4: Gantt fills ──────────────────────────────────────────────────
// THE genuine-motion beat: a Gantt strip fills cell by cell as a playhead
// sweeps from left to right. Above it, the same A → B → C rotation plays
// in a small queue indicator so the two views stay synced.
function GanttBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 460, stripX: 30, stripY: 220, stripW: 540, stripH: 70,
        queueY: 100, queueH: 60, queueX: 30, queueW: 540,
        axisY: 310, captionY: 380, eyebrowY: 50 }
    : { vbW: 1080, vbH: 380, stripX: 60, stripY: 180, stripW: 960, stripH: 80,
        queueY: 80, queueH: 60, queueX: 240, queueW: 600,
        axisY: 280, captionY: 340, eyebrowY: 50 };

  // 12-cell schedule: A B C repeating.
  const schedule = ['A','B','C','A','B','C','A','B','C','A','B','C'];
  const slotW = G.stripW / schedule.length;

  // Sweep: starts at delay 1.2, takes 8s to cross the whole strip.
  const sweepStart = 1.2;
  const sweepDur = 8.0;
  const t = clamp((localTime - sweepStart) / sweepDur, 0, 1);
  const playheadX = G.stripX + t * G.stripW;
  const filledCells = Math.min(schedule.length, Math.floor(t * schedule.length));
  const partial = t * schedule.length - filledCells; // 0..1 within current cell

  const queueOrder = (() => {
    // The "head" of the queue is always whatever just ran most recently.
    // Index = filledCells mod 3 gives the current head; build [head, head+1, head+2].
    const headIdx = filledCells % 3;
    const labels = ['A','B','C'];
    return [labels[headIdx], labels[(headIdx + 1) % 3], labels[(headIdx + 2) % 3]];
  })();

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
        the round-robin Gantt chart
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Mini ready-queue indicator above the Gantt. Three pills in
            current head → tail order, redrawn each tick from queueOrder. */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <text x={G.queueX} y={G.queueY - 12}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">READY QUEUE — HEAD →</text>
        </SvgFadeIn>
        {queueOrder.map((letter, i) => {
          const pillW = (G.queueW - 2 * 16) / 3 - 12;
          const pillX = G.queueX + i * (pillW + 16);
          const isHead = i === 0;
          return (
            <g key={`${letter}-${i}`}>
              <rect x={pillX} y={G.queueY} width={pillW} height={G.queueH}
                rx={12}
                fill={JOB_COLORS[letter]} opacity={isHead ? 0.85 : 0.35}
                stroke={JOB_COLORS[letter]} strokeWidth={isHead ? 2 : 1}/>
              <text x={pillX + pillW / 2} y={G.queueY + G.queueH / 2 + 9}
                textAnchor="middle"
                fill={isHead ? 'var(--bg-canvas)' : 'var(--chalk-100)'}
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={26}>
                {letter}
              </text>
            </g>
          );
        })}

        {/* Strip outline */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <rect x={G.stripX} y={G.stripY} width={G.stripW} height={G.stripH}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
        </SvgFadeIn>

        {/* Filled cells (those the playhead has fully crossed) */}
        {schedule.slice(0, filledCells).map((letter, i) => (
          <g key={i}>
            <rect x={G.stripX + i * slotW} y={G.stripY}
              width={slotW - 1.5} height={G.stripH}
              fill={JOB_COLORS[letter]} opacity={0.5}
              stroke={JOB_COLORS[letter]} strokeWidth={1}/>
            <text x={G.stripX + i * slotW + slotW / 2}
              y={G.stripY + G.stripH / 2 + 7}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 18 : 22}>
              {letter}
            </text>
          </g>
        ))}

        {/* Partial cell — still being drawn (clipped by playhead) */}
        {filledCells < schedule.length && partial > 0.001 && (
          <g>
            <rect x={G.stripX + filledCells * slotW} y={G.stripY}
              width={Math.max(0, partial * slotW - 1.5)} height={G.stripH}
              fill={JOB_COLORS[schedule[filledCells]]} opacity={0.5}
              stroke={JOB_COLORS[schedule[filledCells]]} strokeWidth={1}/>
            <text x={G.stripX + filledCells * slotW + slotW / 2}
              y={G.stripY + G.stripH / 2 + 7}
              textAnchor="middle"
              fill="var(--chalk-100)" opacity={partial}
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 18 : 22}>
              {schedule[filledCells]}
            </text>
          </g>
        )}

        {/* Playhead */}
        {localTime > sweepStart && t < 1 && (
          <g>
            <line x1={playheadX} y1={G.stripY - 8}
              x2={playheadX} y2={G.stripY + G.stripH + 8}
              stroke="var(--rose-400)" strokeWidth={2.5}/>
            <polygon
              points={`${playheadX - 6},${G.stripY - 14} ${playheadX + 6},${G.stripY - 14} ${playheadX},${G.stripY - 6}`}
              fill="var(--rose-400)"/>
          </g>
        )}

        {/* Time axis */}
        <SvgFadeIn duration={0.4} delay={0.7}>
          <line x1={G.stripX} y1={G.axisY} x2={G.stripX + G.stripW} y2={G.axisY}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.stripX} y={G.axisY + 18}
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>0</text>
          <text x={G.stripX + G.stripW} y={G.axisY + 18}
            textAnchor="end"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize={11}>time →</text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.06em">
            max wait per round = (n − 1) × q
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Trade-off ────────────────────────────────────────────────────
function TradeoffBeat() {
  const portrait = usePortrait();
  const labelStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.16em', textTransform: 'uppercase',
  };
  const bodyStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 22 : 26, lineHeight: 1.3,
  };

  const SmallCell = (
    <FadeUp duration={0.5} delay={0.3} distance={12}
      style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12,
               maxWidth: portrait ? '24ch' : '20ch' }}>
      <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>small q</div>
      <div style={{ ...bodyStyle, color: 'var(--chalk-100)' }}>responsive</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                    color: 'var(--chalk-300)' }}>but switches eat the CPU</div>
    </FadeUp>
  );
  const LargeCell = (
    <FadeUp duration={0.5} delay={1.4} distance={12}
      style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12,
               maxWidth: portrait ? '24ch' : '20ch' }}>
      <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>large q</div>
      <div style={{ ...bodyStyle, color: 'var(--chalk-100)' }}>efficient</div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13,
                    color: 'var(--chalk-300)' }}>but jobs at the back wait</div>
    </FadeUp>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 28 : 36,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.16em',
          textTransform: 'uppercase',
        }}>
        picking the slice
      </FadeUp>

      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
          {SmallCell}
          <div style={{ width: 80, height: 1, background: 'rgba(232,220,193,0.15)' }}/>
          {LargeCell}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 110, alignItems: 'flex-start' }}>
          {SmallCell}
          <div style={{ width: 1, height: 110, background: 'rgba(232,220,193,0.15)',
                        marginTop: 10 }}/>
          {LargeCell}
        </div>
      )}

      <FadeUp duration={0.6} delay={3.0} distance={12}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 13 : 14,
          color: 'var(--amber-300)', letterSpacing: '0.10em',
          textAlign: 'center',
          maxWidth: portrait ? '32ch' : '60ch',
        }}>
        pick q just long enough to amortize the switch
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
