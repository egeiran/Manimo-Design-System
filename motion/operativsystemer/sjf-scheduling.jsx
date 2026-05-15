// Shortest Job First — Manimo lesson scene.
// Same three jobs, two orderings: how the convoy effect bloats average
// turnaround under FIFO, and why running short jobs up front fixes it.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/sjf-scheduling/):
//    0.00– 8.13  Manimo intro: three jobs, one queue
//    8.13–16.60  The jobs: A=10, B=2, C=2 all arrive at t=0
//   16.60–24.57  FIFO Gantt: bars fill in arrival order, avg = 12
//   24.57–34.83  SJF Gantt: same jobs reordered, avg ≈ 6.67
//   34.83–46.00  Takeaway: 12 vs 6.67 side by side
//
// Genuine animation: in fifoGantt + sjfGantt, the Gantt bars sweep in
// across a real timeline driven by sprite localTime, and a running
// completion-time tally counts up live as each job finishes. Not just
// fade-ins.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 8.13 */ 'Three jobs land at the scheduler at the same time. Same work — but the order you pick changes how long everyone waits.',
  /*  8.13–16.60 */ 'Job A needs ten units of CPU time, job B needs two, job C needs two. All three are ready at time zero.',
  /* 16.60–24.57 */ 'First-in first-out runs them in arrival order. A finishes at ten, B at twelve, C at fourteen. Average turnaround: twelve.',
  /* 24.57–34.83 */ 'Shortest job first runs the small ones up front. B finishes at two, C at four, A at fourteen. Average turnaround drops to six and two thirds.',
  /* 34.83–46.00 */ 'Same jobs, same total work — but the convoy of one big job behind two small ones is what hurts. Run short first, and everyone waits less.',
];

const NARRATION_AUDIO = 'audio/sjf-scheduling/scene.mp3';

// Job lengths (CPU time units). The two orderings:
const JOBS = {
  A: { len: 10, color: 'var(--amber-400)', accent: 'var(--amber-300)' },
  B: { len:  2, color: 'var(--rose-400)',  accent: 'var(--rose-300)'  },
  C: { len:  2, color: 'var(--teal-400)',  accent: 'var(--teal-400)'  },
};
const FIFO_ORDER = ['A', 'B', 'C'];
const SJF_ORDER  = ['B', 'C', 'A'];

function Scene() {
  return (
    <SceneChrome
      eyebrow="scheduling"
      title="Shortest Job First"
      duration={SCENE_DURATION}
      introEnd={6.97}
      introCaption="Three jobs, one queue — does order matter?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.97} end={15.04}>
        <JobsArrive />
      </Sprite>

      <Sprite start={15.04} end={23.87}>
        <GanttBeat
          eyebrow="FIFO"
          eyebrowColor="var(--rose-300)"
          order={FIFO_ORDER}
          completions={[10, 12, 14]}
          avg="avg = (10 + 12 + 14) / 3 = 12"
        />
      </Sprite>

      <Sprite start={23.87} end={33.74}>
        <GanttBeat
          eyebrow="SJF"
          eyebrowColor="var(--teal-400)"
          order={SJF_ORDER}
          completions={[2, 4, 14]}
          avg="avg = (2 + 4 + 14) / 3 ≈ 6.67"
        />
      </Sprite>

      <Sprite start={33.74} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Three jobs in the ready queue ───────────────────────────────
function JobsArrive() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 380, tileW: 140, tileH: 110, gap: 22, rowY: 130, captionY: 290, eyebrowY: 50 }
    : { vbW: 980, vbH: 320, tileW: 200, tileH: 130, gap: 36, rowY: 100, captionY: 260, eyebrowY: 40 };

  const order = ['A', 'B', 'C'];
  const totalW = order.length * G.tileW + (order.length - 1) * G.gap;
  const startX = (G.vbW - totalW) / 2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            READY QUEUE AT t = 0
          </text>
        </SvgFadeIn>

        {order.map((letter, i) => {
          const job = JOBS[letter];
          const x = startX + i * (G.tileW + G.gap);
          return (
            <SvgFadeIn key={letter} duration={0.5} delay={0.4 + i * 0.35}>
              <rect x={x} y={G.rowY} width={G.tileW} height={G.tileH} rx={10}
                fill={job.color} opacity={0.16}
                stroke={job.color} strokeWidth={1.6}/>
              <text x={x + G.tileW / 2} y={G.rowY + 36}
                textAnchor="middle"
                fill={job.accent}
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.16em">JOB</text>
              <text x={x + G.tileW / 2} y={G.rowY + 76}
                textAnchor="middle"
                fill="var(--chalk-100)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={portrait ? 36 : 46} fontWeight={500}>
                {letter}
              </text>
              <text x={x + G.tileW / 2} y={G.rowY + G.tileH - 14}
                textAnchor="middle"
                fill="var(--chalk-200)"
                fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 13}>
                CPU = {job.len}
              </text>
            </SvgFadeIn>
          );
        })}

        <SvgFadeIn duration={0.5} delay={2.4}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            {portrait
              ? 'the scheduler picks one — then the next'
              : 'the scheduler picks one — then the next — then the last'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beats 3 & 4: Gantt chart that builds in time ────────────────────────
// One reusable component renders the bars for whatever job order it's
// passed. The bars sweep in along the timeline at the rate they would in
// reality (compressed so the whole 14-unit schedule plays in ~6 seconds),
// and the completion-time labels appear at the right edge of each bar as
// it finishes. The average-turnaround formula fades in at the end.
function GanttBeat({ eyebrow, eyebrowColor, order, completions, avg }) {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 440, axisX: 60, axisY: 220, stripH: 64, stripW: 500,
        eyebrowY: 60, completionY: 200, avgY: 360,
        avgFontSize: 22, tickFontSize: 11, labelFontSize: 18 }
    : { vbW: 1080, vbH: 380, axisX: 90, axisY: 180, stripH: 72, stripW: 900,
        eyebrowY: 50, completionY: 158, avgY: 320,
        avgFontSize: 26, tickFontSize: 11, labelFontSize: 22 };

  const TIME_MAX = 14;  // schedule fits inside 14 CPU units
  const SWEEP_START = 0.5;
  const SWEEP_DUR = 6.0; // seconds of wall time to play through all 14 units
  const swept = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const playedUnits = swept * TIME_MAX;

  const pxPerUnit = G.stripW / TIME_MAX;

  // Compute each job's [startUnit, endUnit] from the order.
  const segs = [];
  let cursor = 0;
  order.forEach((letter, i) => {
    const len = JOBS[letter].len;
    segs.push({
      letter, color: JOBS[letter].color, accent: JOBS[letter].accent,
      startU: cursor, endU: cursor + len, idx: i,
    });
    cursor += len;
  });

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Eyebrow */}
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill={eyebrowColor}
            fontFamily="var(--font-mono)" fontSize={13}
            letterSpacing="0.22em">
            {eyebrow}
          </text>
        </SvgFadeIn>

        {/* Axis line */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={G.axisX} y1={G.axisY + G.stripH + 14}
            x2={G.axisX + G.stripW} y2={G.axisY + G.stripH + 14}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          {[0, 2, 4, 6, 8, 10, 12, 14].map(t => (
            <g key={t}>
              <line x1={G.axisX + t * pxPerUnit} y1={G.axisY + G.stripH + 14}
                x2={G.axisX + t * pxPerUnit} y2={G.axisY + G.stripH + 20}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
              <text x={G.axisX + t * pxPerUnit} y={G.axisY + G.stripH + 36}
                textAnchor="middle"
                fill="var(--chalk-300)"
                fontFamily="var(--font-mono)" fontSize={G.tickFontSize}>
                {t}
              </text>
            </g>
          ))}
          <text x={G.axisX + G.stripW + 18} y={G.axisY + G.stripH + 19}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={G.tickFontSize}
            letterSpacing="0.16em">
            t
          </text>
        </SvgFadeIn>

        {/* Empty strip outline */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <rect x={G.axisX} y={G.axisY} width={G.stripW} height={G.stripH}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}
            opacity={0.55}/>
        </SvgFadeIn>

        {/* Filled bars — each one is a partial rect that grows over the
            window [SWEEP_START + startU/TIME_MAX*SWEEP_DUR,
                    SWEEP_START + endU/TIME_MAX*SWEEP_DUR]. */}
        {segs.map(seg => {
          const visibleU = clamp(playedUnits - seg.startU, 0, seg.endU - seg.startU);
          const x = G.axisX + seg.startU * pxPerUnit;
          const w = visibleU * pxPerUnit;
          // Label at the centre of the *full* segment, but only once any
          // pixel of that segment has been drawn — keeps the strip from
          // showing the next letter before the bar starts.
          const labelOn = visibleU > 0.15;
          const finished = playedUnits >= seg.endU;
          return (
            <g key={seg.letter}>
              {w > 0.5 && (
                <rect x={x} y={G.axisY} width={w} height={G.stripH}
                  fill={seg.color} opacity={0.55}
                  stroke={seg.color} strokeWidth={1.4}/>
              )}
              {labelOn && (
                <text
                  x={G.axisX + (seg.startU + (seg.endU - seg.startU) / 2) * pxPerUnit}
                  y={G.axisY + G.stripH / 2 + 9}
                  textAnchor="middle"
                  fill="var(--chalk-100)"
                  fontFamily="var(--font-serif)" fontStyle="italic"
                  fontSize={G.labelFontSize}>
                  {seg.letter}
                </text>
              )}
              {finished && (
                <g style={{ opacity: 1 }}>
                  {/* Tick down from the finish edge to the timeline */}
                  <line
                    x1={G.axisX + seg.endU * pxPerUnit} y1={G.axisY}
                    x2={G.axisX + seg.endU * pxPerUnit} y2={G.axisY - 12}
                    stroke={seg.accent} strokeWidth={1.4}/>
                  <text
                    x={G.axisX + seg.endU * pxPerUnit}
                    y={G.completionY}
                    textAnchor="middle"
                    fill={seg.accent}
                    fontFamily="var(--font-mono)" fontSize={portrait ? 10 : 11}
                    letterSpacing="0.12em">
                    {portrait
                      ? `${seg.letter}·${seg.endU}`
                      : `${seg.letter} done · ${seg.endU}`}
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* Average-turnaround formula — fades in once every bar has
            completed plus a small breath. */}
        {playedUnits >= TIME_MAX - 0.05 && (
          <g>
            <SvgFadeIn duration={0.5} delay={0}>
              <text x={G.vbW / 2} y={G.avgY}
                textAnchor="middle"
                fill="var(--chalk-100)"
                fontFamily="var(--font-mono)" fontSize={G.avgFontSize}
                letterSpacing="0.04em">
                {avg}
              </text>
            </SvgFadeIn>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway with big-number contrast ───────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 20 : 24,
    }}>
      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        gap: portrait ? 16 : 80,
        alignItems: 'center',
      }}>
        <FadeUp duration={0.6} delay={0.3} distance={14}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--rose-300)', letterSpacing: '0.18em',
          }}>FIFO</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 72 : 96, color: 'var(--chalk-100)',
            lineHeight: 1,
          }}>12</div>
        </FadeUp>

        <FadeUp duration={0.4} delay={0.7} distance={0}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 20 : 28,
            color: 'var(--chalk-300)', letterSpacing: '0.16em',
          }}>vs</FadeUp>

        <FadeUp duration={0.6} delay={1.0} distance={14}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
          }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--teal-400)', letterSpacing: '0.18em',
          }}>SJF</div>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 72 : 96, color: 'var(--teal-400)',
            lineHeight: 1,
          }}>6.67</div>
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={2.0} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 20 : 24, color: 'var(--chalk-100)',
          textAlign: 'center', maxWidth: portrait ? '24ch' : '38ch',
          lineHeight: 1.3, marginTop: 8,
        }}>
        Shortest job first nearly halves the average wait.
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
          lineHeight: 1.4,
        }}>
        (it needs to know job lengths up front — and that's the catch)
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
