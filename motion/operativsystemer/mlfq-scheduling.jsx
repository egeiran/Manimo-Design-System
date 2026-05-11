// Multi-Level Feedback Queue — Manimo lesson scene.
// Three priority queues. New jobs land at the top. A job that uses its
// full slice drops a queue; a job that yields stays high. A periodic
// boost lifts everyone back to the top so nothing starves.
//
// Genuine animation lives in `DemotionBeat`: two jobs (A and B) sit on
// the queue stack and their y-position is driven directly by sprite
// localTime — A descends Q2→Q1→Q0 in three discrete demotions while a
// slice-meter pulses to full and resets, B yields early after one short
// burst and stays in Q2. Then `BoostBeat` animates a synchronized lift
// of both demoted jobs back to Q2 on a "boost tick".

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 6.91 */ "Schedulers usually don't know how long a job will run. MLFQ figures it out by watching what the job does.",
  /*  6.91–15.91 */ 'Three queues stacked by priority. A new job always starts at the very top. The CPU only runs jobs from the highest non-empty queue.',
  /* 15.91–26.25 */ 'If a job uses its whole time slice, it must be CPU bound. MLFQ demotes it to the next queue down. A short job that gives up the CPU stays high.',
  /* 26.25–34.73 */ "Without help, a CPU heavy job could starve forever at the bottom. So every so often, MLFQ lifts every job back to the top queue.",
  /* 34.73–44.00 */ 'Short interactive jobs stay fast. Long jobs get their fair share. And the scheduler never had to ask how long anything would run.',
];

const NARRATION_AUDIO = 'audio/mlfq-scheduling/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="scheduling"
      title="Multi-Level Feedback Queue"
      duration={SCENE_DURATION}
      introEnd={6.91}
      introCaption="A scheduler that learns by watching — no job lengths required."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.91} end={15.91}>
        <QueuesBeat/>
      </Sprite>

      <Sprite start={15.91} end={26.25}>
        <DemotionBeat/>
      </Sprite>

      <Sprite start={26.25} end={34.73}>
        <BoostBeat/>
      </Sprite>

      <Sprite start={34.73} end={SCENE_DURATION}>
        <TakeawayBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// Geometry shared across the three queue beats so the stack is in the
// same place every time. Three horizontal tracks Q2 (top) > Q1 > Q0.
function queueGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 480, trackX: 90, trackW: 460, trackH: 56, rowGap: 22,
        topY: 110, labelGap: 60, eyebrowY: 60, captionY: 410,
        tileW: 64, tileH: 38, labelFs: 13, eyebrowFs: 11 }
    : { vbW: 1080, vbH: 400, trackX: 160, trackW: 760, trackH: 60, rowGap: 26,
        topY: 90, labelGap: 90, eyebrowY: 40, captionY: 340,
        tileW: 78, tileH: 44, labelFs: 14, eyebrowFs: 12 };
}

function QueueStack({ G, jobsOnTrack, highlightCpuTrack, showSliceMeter, sliceFrac, boostTick }) {
  // jobsOnTrack: { trackIdx: 0|1|2, x: 0..1 along the track, color, label, opacity }
  // Renders three queue tracks plus any jobs sitting on them.
  const trackY = [G.topY, G.topY + G.trackH + G.rowGap, G.topY + 2 * (G.trackH + G.rowGap)];
  const trackLabels = ['Q2', 'Q1', 'Q0'];

  return (
    <g>
      {trackLabels.map((label, i) => (
        <g key={label}>
          <SvgFadeIn duration={0.4} delay={0.1 + i * 0.18}>
            <rect
              x={G.trackX} y={trackY[i]}
              width={G.trackW} height={G.trackH} rx={10}
              fill={highlightCpuTrack === i ? 'var(--amber-400)' : 'var(--chalk-200)'}
              fillOpacity={highlightCpuTrack === i ? 0.08 : 0.04}
              stroke="var(--chalk-300)" strokeWidth={1.2}
              opacity={0.75}/>
            <text
              x={G.trackX - 18} y={trackY[i] + G.trackH / 2 + 6}
              textAnchor="end"
              fill={highlightCpuTrack === i ? 'var(--amber-300)' : 'var(--chalk-300)'}
              fontFamily="var(--font-mono)" fontSize={G.labelFs}
              letterSpacing="0.16em">
              {label}
            </text>
            <text
              x={G.trackX + G.trackW + 14} y={trackY[i] + G.trackH / 2 + 5}
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.12em" opacity={0.7}>
              {['HIGH', 'MID', 'LOW'][i]}
            </text>
          </SvgFadeIn>
        </g>
      ))}

      {/* Optional CPU-side slice meter, tied to whichever track is running. */}
      {showSliceMeter && highlightCpuTrack != null && (() => {
        const y = trackY[highlightCpuTrack] + G.trackH / 2;
        // Portrait viewBox is too narrow to fit the meter outside the
        // right edge of the lane, so park it just inside the right end
        // of the active lane instead.
        const portraitMeter = G.vbW < 700;
        const meterW = portraitMeter ? 70 : 80;
        const mx = portraitMeter
          ? G.trackX + G.trackW - meterW - 6
          : G.trackX + G.trackW + 60;
        return (
          <g>
            <rect x={mx} y={y - 7} width={meterW} height={14} rx={4}
              fill="var(--chalk-200)" fillOpacity={0.05}
              stroke="var(--chalk-300)" strokeWidth={1}/>
            <rect x={mx} y={y - 7} width={meterW * clamp(sliceFrac, 0, 1)} height={14} rx={4}
              fill="var(--rose-400)" opacity={0.55}/>
            <text x={mx + meterW / 2} y={y + 30}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={9}
              letterSpacing="0.14em">SLICE</text>
          </g>
        );
      })()}

      {/* Boost tick — small flash that fades quickly */}
      {boostTick != null && boostTick > 0 && (
        <g opacity={boostTick}>
          <text
            x={G.trackX + G.trackW / 2}
            y={G.topY - 14}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.22em">
            BOOST
          </text>
        </g>
      )}

      {/* Jobs */}
      {jobsOnTrack.map((j, i) => {
        const ty = trackY[j.trackIdx] + G.trackH / 2;
        const tx = G.trackX + 24 + (G.trackW - 48) * j.x;
        return (
          <g key={i} opacity={j.opacity ?? 1}>
            <rect
              x={tx - G.tileW / 2} y={ty - G.tileH / 2}
              width={G.tileW} height={G.tileH} rx={8}
              fill={j.color} opacity={0.55}
              stroke={j.color} strokeWidth={1.4}/>
            <text x={tx} y={ty + 6}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} fontWeight={500}>
              {j.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// ─── Beat 2: introduce the stack ──────────────────────────────────────────
function QueuesBeat() {
  const portrait = usePortrait();
  const G = queueGeometry(portrait);
  const { localTime } = useSprite();

  // A new job tile drifts in from the left and lands centred in Q2.
  const entryT = clamp((localTime - 1.6) / 1.4, 0, 1);
  const entryX = -0.2 + entryT * 0.7;  // ends at x=0.5

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            PRIORITY QUEUES — TOP RUNS FIRST
          </text>
        </SvgFadeIn>

        <QueueStack G={G}
          jobsOnTrack={entryT > 0 ? [
            { trackIdx: 0, x: entryX, color: 'var(--amber-400)', label: 'A', opacity: entryT }
          ] : []}/>

        <SvgFadeIn duration={0.5} delay={4.4}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            new jobs always enter at the top
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: demotion — the centrepiece ───────────────────────────────────
// A long CPU-bound job A descends Q2→Q1→Q0 in three demotions over the
// beat. Each demotion happens after A's slice fills. Job B yields after
// one short burst and stays in Q2. The CPU highlight ribbon shows which
// queue is being served.
function DemotionBeat() {
  const portrait = usePortrait();
  const G = queueGeometry(portrait);
  const { localTime } = useSprite();

  // Beat schedule (sprite-local seconds):
  //   0.0  eyebrow + queues fade in
  //   1.0  A and B sit in Q2 already (they entered last beat conceptually)
  //   1.5  A's slice starts ticking; B fades active for a short burst
  //   3.0  B yields (gives up CPU), stays in Q2
  //   3.5  A first slice fills → demote Q2→Q1 (small slide down)
  //   3.7..5.7   A's slice ticks again in Q1
  //   5.9  A second slice fills → demote Q1→Q0
  //   6.1..8.6   A's slice ticks again in Q0 (now a long slice)
  //   8.9  rule label fades in
  const aLane = (() => {
    if (localTime < 3.5) return 0;       // Q2
    if (localTime < 5.9) return 1;       // Q1 (during 3.5..5.9)
    return 2;                            // Q0
  })();

  // Smooth visual transition between lanes
  const laneTransitionSec = 0.45;
  const aLaneSmooth = (() => {
    const transitions = [
      { at: 3.5, from: 0, to: 1 },
      { at: 5.9, from: 1, to: 2 },
    ];
    for (const tr of transitions) {
      const t = clamp((localTime - tr.at) / laneTransitionSec, 0, 1);
      if (localTime >= tr.at && localTime < tr.at + laneTransitionSec) {
        return tr.from + (tr.to - tr.from) * Easing.easeOutCubic(t);
      }
    }
    return aLane;
  })();

  // Slice meter: fills to 1.0 over slice length, then resets at demotion.
  const sliceFrac = (() => {
    if (localTime < 1.5) return 0;
    if (localTime < 3.5) return clamp((localTime - 1.5) / 2.0, 0, 1);  // first slice fills
    if (localTime < 5.9) return clamp((localTime - 3.7) / 2.2, 0, 1);  // second slice fills
    if (localTime < 8.9) return clamp((localTime - 6.1) / 2.8, 0, 1);  // third slice fills
    return 1;
  })();

  // Which lane the CPU is serving — always the highest non-empty queue
  // that contains A. B yields early so MLFQ runs A from then on.
  const cpuTrack = localTime < 1.5 ? null : Math.round(aLaneSmooth);

  // Job A position: descends linearly through the lanes.
  // Job B position: stays in Q2 (lane 0), fades to softer opacity after
  // it yields at t=3.0 to convey "still parked here, idle."
  const bOpacity = localTime < 3.0
    ? 1
    : 0.35 + 0.45 * (0.5 + 0.5 * Math.sin(localTime * 0.5));

  // Pulse a "demote!" tag at each transition for ~0.7s
  const demoteFlash = (() => {
    const t1 = clamp((localTime - 3.5) / 0.7, 0, 1);
    const t2 = clamp((localTime - 5.9) / 0.7, 0, 1);
    const flash = (t) => t > 0 && t < 1 ? (1 - t) : 0;
    return Math.max(flash(t1), flash(t2));
  })();

  // Where the demote tag points to (lane-relative y).
  const trackY = [G.topY, G.topY + G.trackH + G.rowGap, G.topY + 2 * (G.trackH + G.rowGap)];
  const flashY = localTime < 5.9
    ? (trackY[0] + trackY[1]) / 2 + G.trackH / 2
    : (trackY[1] + trackY[2]) / 2 + G.trackH / 2;

  const jobs = [
    {
      trackIdx: 0, x: 0.32, color: 'var(--teal-400)', label: 'B',
      opacity: bOpacity,
    },
    {
      trackIdx: aLaneSmooth, x: 0.58, color: 'var(--amber-400)', label: 'A',
    },
  ];
  // Re-implement the y interpolation here for A so we can render it at a
  // float lane index — easier than threading the float through QueueStack.
  // We'll pass A through a custom renderer below instead of QueueStack.

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            RULE — FULL SLICE USED → DEMOTE
          </text>
        </SvgFadeIn>

        {/* Render the stack with only B in jobsOnTrack (integer lane). A is
            rendered manually below at the floating lane. */}
        <QueueStack G={G}
          jobsOnTrack={[jobs[0]]}
          highlightCpuTrack={cpuTrack}
          showSliceMeter={localTime > 1.4 && localTime < 9.5}
          sliceFrac={sliceFrac}/>

        {/* Job A at a floating lane y (handles the smooth demote slide). */}
        {(() => {
          const ay = G.topY + aLaneSmooth * (G.trackH + G.rowGap) + G.trackH / 2;
          const ax = G.trackX + 24 + (G.trackW - 48) * 0.58;
          return (
            <g>
              <rect
                x={ax - G.tileW / 2} y={ay - G.tileH / 2}
                width={G.tileW} height={G.tileH} rx={8}
                fill="var(--amber-400)" opacity={0.55}
                stroke="var(--amber-400)" strokeWidth={1.4}/>
              <text x={ax} y={ay + 6}
                textAnchor="middle"
                fill="var(--chalk-100)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={20} fontWeight={500}>
                A
              </text>
            </g>
          );
        })()}

        {/* The demote flash arrow — points down */}
        {demoteFlash > 0 && (() => {
          const fx = G.trackX + G.trackW * 0.58 - 6;
          return (
            <g opacity={demoteFlash}>
              <text x={fx + 50} y={flashY + 6}
                textAnchor="start"
                fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize={11}
                letterSpacing="0.18em">
                ↓ DEMOTE
              </text>
            </g>
          );
        })()}

        {/* Caption explaining what we saw */}
        <SvgFadeIn duration={0.5} delay={9.4}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 16 : 18}>
            A burned through slice after slice — it's CPU bound, drop it down.
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={10.4}>
          <text x={G.vbW / 2} y={G.captionY + (portrait ? 22 : 26)}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 12 : 13}
            letterSpacing="0.02em">
            B yielded early — interactive, keep it high.
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: priority boost ───────────────────────────────────────────────
function BoostBeat() {
  const portrait = usePortrait();
  const G = queueGeometry(portrait);
  const { localTime } = useSprite();

  // At t<3.5, two demoted jobs sit at Q0 (A) and Q1 (C, a new long job
  // that arrived after the previous beat). At t=3.5 the boost tick fires:
  // both rise in a single eased motion to Q2 over 1.0s. After that they
  // stay at Q2.
  const BOOST_AT = 3.5;
  const BOOST_DUR = 1.0;
  const boostFrac = clamp((localTime - BOOST_AT) / BOOST_DUR, 0, 1);
  const eased = Easing.easeOutCubic(boostFrac);

  const aLaneStart = 2;  // Q0
  const cLaneStart = 1;  // Q1
  const aLane = aLaneStart + (0 - aLaneStart) * eased;
  const cLane = cLaneStart + (0 - cLaneStart) * eased;

  const boostFlash = (() => {
    const t = clamp((localTime - (BOOST_AT - 0.1)) / 1.3, 0, 1);
    return t > 0 && t < 1 ? (1 - t) : 0;
  })();

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={G.eyebrowFs}
            letterSpacing="0.18em">
            PRIORITY BOOST — EVERY S SECONDS
          </text>
        </SvgFadeIn>

        <QueueStack G={G} jobsOnTrack={[]} boostTick={boostFlash}/>

        {/* A and C, rendered at floating lane positions */}
        {[
          { lane: aLane, label: 'A', color: 'var(--amber-400)', x: 0.58 },
          { lane: cLane, label: 'C', color: 'var(--rose-400)',  x: 0.34 },
        ].map((j, i) => {
          const ay = G.topY + j.lane * (G.trackH + G.rowGap) + G.trackH / 2;
          const ax = G.trackX + 24 + (G.trackW - 48) * j.x;
          return (
            <g key={i}>
              <rect
                x={ax - G.tileW / 2} y={ay - G.tileH / 2}
                width={G.tileW} height={G.tileH} rx={8}
                fill={j.color} opacity={0.55}
                stroke={j.color} strokeWidth={1.4}/>
              <text x={ax} y={ay + 6}
                textAnchor="middle"
                fill="var(--chalk-100)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={20} fontWeight={500}>
                {j.label}
              </text>
            </g>
          );
        })}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 16 : 18}>
            everyone gets a fresh start at the top
          </text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={6.5}>
          <text x={G.vbW / 2} y={G.captionY + (portrait ? 22 : 26)}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 12 : 13}
            letterSpacing="0.02em">
            no job stays starved forever
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 24,
      maxWidth: portrait ? '32ch' : '54ch',
      textAlign: 'center',
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 38 : 54, color: 'var(--chalk-100)',
          lineHeight: 1.05,
        }}>
        no length predictions needed
      </FadeUp>

      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          lineHeight: 1.35,
        }}>
        behaviour over time tells the scheduler what kind of job it is
      </FadeUp>

      <FadeUp duration={0.5} delay={2.6} distance={8}
        style={{
          display: 'flex', gap: portrait ? 14 : 28, marginTop: 8,
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          flexDirection: portrait ? 'column' : 'row',
        }}>
        <span>YIELDS → STAYS HIGH</span>
        <span style={{ color: 'var(--amber-300)' }}>BURNS SLICES → DROPS DOWN</span>
        <span style={{ color: 'var(--teal-400)' }}>BOOST → BACK TO TOP</span>
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
