// Race Condition: When Two Threads Share a Counter — Manimo lesson scene.
// Why an innocent counter++ can silently lose increments when two threads
// interleave their load-add-store steps, and what a critical section
// fixes.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/race-condition/):
//    0.00– 8.21  Manimo intro: one plus one — but not always two
//    8.21–21.17  Happy path: T1 finishes load/add/store, then T2 runs
//   21.17–32.38  Interleaved: T1 and T2 alternate — final counter = 1
//   32.38–42.61  Critical section: lock around load/add/store
//   42.61–53.00  Takeaway: shared state + interleaving = race condition
//
// Authoring notes:
//   • Beat 3 carries the genuine animation: two thread "lanes" play their
//     instructions on a shared timeline with an active-step highlight that
//     advances by sprite localTime. The shared counter (its own SVG text)
//     ticks up only when a `store` step lights up.
//   • SvgFadeIn for elements inside <svg>; FadeUp for HTML/DOM only.

const SCENE_DURATION = 53;

const NARRATION = [
  /*  0.00– 8.21 */ 'Two threads each add one to the same counter. We start at zero, add twice, finish at two — right? Sometimes.',
  /*  8.21–21.17 */ 'Each increment is really three steps: load the counter, add one, store it back. If thread one finishes all three before thread two starts, the counter goes from zero to one to two. Perfect.',
  /* 21.17–32.38 */ 'But the scheduler can interrupt at any point. If thread two loads while thread one is still in the middle of its add, both threads write back the value one. One increment is silently lost.',
  /* 32.38–42.61 */ 'The three steps need to happen atomically — no thread interrupts another mid-update. We mark them as a critical section: only one thread inside at a time.',
  /* 42.61–53.00 */ 'Concurrent code is unsafe by default. Wherever two threads touch the same data, you need a critical section — or the answer is sometimes wrong.',
];

const NARRATION_AUDIO = 'audio/race-condition/scene.mp3';

const T1_COLOR = 'var(--amber-400)';
const T1_DIM   = 'var(--amber-300)';
const T2_COLOR = 'var(--rose-400)';
const T2_DIM   = 'var(--rose-300)';

function Scene() {
  return (
    <SceneChrome
      eyebrow="concurrency"
      title="Race Condition"
      duration={SCENE_DURATION}
      introEnd={8.21}
      introCaption="One plus one — but not always two."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.21} end={21.17}>
        <HappyPathBeat />
      </Sprite>

      <Sprite start={21.17} end={32.38}>
        <InterleaveBeat />
      </Sprite>

      <Sprite start={32.38} end={42.61}>
        <CriticalSectionBeat />
      </Sprite>

      <Sprite start={42.61} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// Reusable: a labelled instruction step on a thread lane. The active step
// gets a glowing fill; previous steps stay tinted; future steps are dim.
function StepCell({ x, y, w, h, label, state, color, dimColor }) {
  // state ∈ 'future' | 'active' | 'done'
  const fillOpacity = state === 'future' ? 0
    : state === 'active' ? 0.55 : 0.18;
  const strokeOpacity = state === 'future' ? 0.35 : 1;
  const labelColor = state === 'active' ? 'var(--chalk-100)'
    : state === 'done' ? 'var(--chalk-200)'
    : 'var(--chalk-300)';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={6}
        fill={color} opacity={fillOpacity}
        stroke={state === 'active' ? color : dimColor}
        strokeOpacity={strokeOpacity}
        strokeWidth={state === 'active' ? 2 : 1}/>
      <text x={x + w / 2} y={y + h / 2 + 5}
        textAnchor="middle"
        fill={labelColor}
        fontFamily="var(--font-mono)" fontSize={13}
        letterSpacing="0.04em">
        {label}
      </text>
    </g>
  );
}

// Reusable thread lane: a row of step cells with a label on the left.
// `activeIndex` is the currently-running step (-1 if idle), `doneCount`
// is how many steps have already finished. The two are independent so a
// lane can be idle (activeIndex = -1) with doneCount > 0 — the natural
// state for a thread between its steps in an interleaved schedule.
function ThreadLane({ x, y, w, h, name, accent, dimAccent, steps,
                     activeIndex, doneCount,
                     stepGap = 12, leftCol = 80 }) {
  const stepW = (w - leftCol - stepGap * (steps.length - 1)) / steps.length;
  return (
    <g>
      <text x={x + 16} y={y + h / 2 + 6}
        fill={accent}
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={20} fontWeight={500}>
        {name}
      </text>
      {steps.map((s, i) => {
        const sx = x + leftCol + i * (stepW + stepGap);
        const state = i === activeIndex ? 'active'
                    : i < doneCount ? 'done'
                    : 'future';
        return (
          <StepCell key={i}
            x={sx} y={y + 8} w={stepW} h={h - 16}
            label={s.label}
            state={state}
            color={accent}
            dimColor={dimAccent}/>
        );
      })}
    </g>
  );
}

// ─── Beat 2: Happy path ───────────────────────────────────────────────────
// T1 plays its three steps in sequence, then T2 plays its three. Counter
// reads 0 → 1 → 2.
function HappyPathBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 420, lane1Y: 110, lane2Y: 200, laneW: 540, laneH: 70,
        laneX: 30, counterX: 300, counterY: 320, eyebrowY: 50, captionY: 380 }
    : { vbW: 1080, vbH: 360, lane1Y: 80, lane2Y: 170, laneW: 880, laneH: 80,
        laneX: 100, counterX: 540, counterY: 290, eyebrowY: 40, captionY: 330 };

  // Step timeline (sprite local seconds):
  //   1.0  T1 load
  //   2.0  T1 add
  //   3.0  T1 store     (counter -> 1)
  //   4.5  T2 load
  //   5.5  T2 add
  //   6.5  T2 store     (counter -> 2)
  const stepTimes = [1.0, 2.0, 3.0, 4.5, 5.5, 6.5];
  const stepDur = 0.7;
  const stepIndex = stepTimes.findIndex(t => localTime >= t && localTime < t + stepDur);
  // Active step per lane (-1 if idle). For the happy-path layout, T1 owns
  // indices 0..2 of stepTimes and T2 owns 3..5.
  const t1Active = stepIndex >= 0 && stepIndex < 3 ? stepIndex : -1;
  const t2Active = stepIndex >= 3 ? stepIndex - 3 : -1;
  // Completed-step count per lane (independent of active).
  let t1Done = 0;
  for (let i = 0; i < 3; i++) if (localTime >= stepTimes[i] + stepDur) t1Done++;
  let t2Done = 0;
  for (let i = 0; i < 3; i++) if (localTime >= stepTimes[3 + i] + stepDur) t2Done++;

  // Counter increments on each store completion.
  let counter = 0;
  if (localTime >= stepTimes[2] + stepDur * 0.4) counter = 1;
  if (localTime >= stepTimes[5] + stepDur * 0.4) counter = 2;

  const steps = [
    { label: 'load' }, { label: 'add 1' }, { label: 'store' },
  ];

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
          marginBottom: 18,
        }}>
        what we hope happens
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0.3}>
          <ThreadLane
            x={G.laneX} y={G.lane1Y} w={G.laneW} h={G.laneH}
            name="T1" accent={T1_COLOR} dimAccent={T1_DIM}
            steps={steps} activeIndex={t1Active} doneCount={t1Done}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <ThreadLane
            x={G.laneX} y={G.lane2Y} w={G.laneW} h={G.laneH}
            name="T2" accent={T2_COLOR} dimAccent={T2_DIM}
            steps={steps} activeIndex={t2Active} doneCount={t2Done}/>
        </SvgFadeIn>

        {/* Counter readout */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.counterX} y={G.counterY - 18}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">SHARED COUNTER</text>
          <rect x={G.counterX - 110} y={G.counterY - 4}
            width={220} height={56} rx={8}
            fill="rgba(232,220,193,0.05)"
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.counterX} y={G.counterY + 36}
            textAnchor="middle"
            fill={counter === 2 ? 'var(--amber-300)' : 'var(--chalk-100)'}
            fontFamily="var(--font-mono)" fontSize={32}>
            counter = {counter}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={7.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 14 : 15}
            letterSpacing="0.02em">
            {counter === 2 ? '0 → 1 → 2 — exactly what we expected' : 'each thread completes its three steps in order'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Interleave ───────────────────────────────────────────────────
// THE genuine-motion beat. The two threads' steps interleave: T1.load,
// T2.load, T1.add, T2.add, T1.store, T2.store. Counter ticks up only on
// store events — and ends at 1 because both stores write the same value.
function InterleaveBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 480, lane1Y: 130, lane2Y: 220, laneW: 540, laneH: 70,
        laneX: 30, counterX: 300, counterY: 340, captionY: 430 }
    : { vbW: 1080, vbH: 380, lane1Y: 80, lane2Y: 170, laneW: 880, laneH: 80,
        laneX: 100, counterX: 540, counterY: 300, captionY: 350 };

  // Interleaved step timeline, starting at 1.4s. One step ~ 1.4s so the
  // viewer can read the labels and follow what each register holds.
  // 0:T1.load, 1:T2.load, 2:T1.add, 3:T2.add, 4:T1.store, 5:T2.store
  const stepTimes = [1.4, 3.0, 4.6, 6.2, 7.8, 9.4];
  const stepDur = 1.0;
  const finalT = stepTimes[5] + stepDur;

  // Compute per-lane "current step" (-1 if idle) and "completed step
  // count" so the lanes can render their state. Independent because in
  // an interleaved schedule a thread can be idle (between steps) with
  // some steps already done.
  const t1StepTimes = [stepTimes[0], stepTimes[2], stepTimes[4]];
  const t2StepTimes = [stepTimes[1], stepTimes[3], stepTimes[5]];
  const laneState = (times) => {
    let active = -1, done = 0;
    for (let i = 0; i < times.length; i++) {
      if (localTime >= times[i] && localTime < times[i] + stepDur) active = i;
      else if (localTime >= times[i] + stepDur) done++;
    }
    return { active, done };
  };
  const t1 = laneState(t1StepTimes);
  const t2 = laneState(t2StepTimes);

  // Per-thread register snapshot. Each thread's local "tmp" value reflects
  // what it holds after load + add. We use this to make the loss vivid.
  // After T1.load (counter=0): t1.reg = 0. After T1.add: t1.reg = 1.
  // After T2.load: t2 reads counter = still 0 (T1 hasn't stored yet).
  // After T2.add: t2.reg = 1.
  // T1.store: counter = 1.   T2.store: counter = 1 (overwrites with same).
  let t1Reg = null, t2Reg = null, counter = 0;
  if (localTime >= stepTimes[0] + stepDur * 0.4) t1Reg = 0;
  if (localTime >= stepTimes[1] + stepDur * 0.4) t2Reg = 0;
  if (localTime >= stepTimes[2] + stepDur * 0.4) t1Reg = 1;
  if (localTime >= stepTimes[3] + stepDur * 0.4) t2Reg = 1;
  if (localTime >= stepTimes[4] + stepDur * 0.4) counter = 1;
  if (localTime >= stepTimes[5] + stepDur * 0.4) counter = 1; // overwrite!

  const steps = [
    { label: 'load' }, { label: 'add 1' }, { label: 'store' },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--rose-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 14,
        }}>
        what really happens
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0.3}>
          <ThreadLane
            x={G.laneX} y={G.lane1Y} w={G.laneW} h={G.laneH}
            name="T1" accent={T1_COLOR} dimAccent={T1_DIM}
            steps={steps} activeIndex={t1.active} doneCount={t1.done}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={0.4}>
          <ThreadLane
            x={G.laneX} y={G.lane2Y} w={G.laneW} h={G.laneH}
            name="T2" accent={T2_COLOR} dimAccent={T2_DIM}
            steps={steps} activeIndex={t2.active} doneCount={t2.done}/>
        </SvgFadeIn>

        {/* Per-thread register readouts (small mono labels under each lane) */}
        <text x={G.laneX + 16} y={G.lane1Y + G.laneH + 22}
          fill={T1_DIM} fontFamily="var(--font-mono)" fontSize={11}>
          T1.reg = {t1Reg === null ? '·' : t1Reg}
        </text>
        <text x={G.laneX + 16} y={G.lane2Y + G.laneH + 22}
          fill={T2_DIM} fontFamily="var(--font-mono)" fontSize={11}>
          T2.reg = {t2Reg === null ? '·' : t2Reg}
        </text>

        {/* Counter readout */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={G.counterX} y={G.counterY - 18}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">SHARED COUNTER</text>
          <rect x={G.counterX - 110} y={G.counterY - 4}
            width={220} height={56} rx={8}
            fill="rgba(232,220,193,0.05)"
            stroke={localTime >= finalT ? 'var(--rose-400)' : 'var(--chalk-300)'}
            strokeWidth={localTime >= finalT ? 2 : 1.2}/>
          <text x={G.counterX} y={G.counterY + 36}
            textAnchor="middle"
            fill={localTime >= finalT ? 'var(--rose-300)' : 'var(--chalk-100)'}
            fontFamily="var(--font-mono)" fontSize={32}>
            counter = {counter}
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={11.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 14 : 15}
            letterSpacing="0.02em">
            both threads loaded zero — one increment vanished
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Critical section ─────────────────────────────────────────────
// One thread inside the critical section at a time. T1 enters first; T2
// is dim and waits until T1 leaves.
function CriticalSectionBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 460, csX: 60, csY: 80, csW: 480, csH: 220,
        codeY: 110, eyebrowY: 30, captionY: 380, formulaY: 340 }
    : { vbW: 1080, vbH: 380, csX: 220, csY: 50, csW: 640, csH: 220,
        codeY: 90, eyebrowY: 40, captionY: 320, formulaY: 290 };

  // T1 holds the lock from delay=1.4s to 4.0s (enters → executes → exits).
  // After 4.0s, T2 enters and runs.
  const t1Hold = [1.4, 4.0];
  const t2Hold = [4.4, 7.0];
  const insideT1 = localTime >= t1Hold[0] && localTime < t1Hold[1];
  const insideT2 = localTime >= t2Hold[0] && localTime < t2Hold[1];
  const finished = localTime >= t2Hold[1];
  const activeColor = insideT1 ? T1_COLOR : insideT2 ? T2_COLOR : 'var(--chalk-300)';
  const activeName = insideT1 ? 'T1' : insideT2 ? 'T2' : (finished ? '—' : 'waiting…');

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
          marginBottom: 14,
        }}>
        the fix — a critical section
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Critical-section frame */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <rect x={G.csX} y={G.csY} width={G.csW} height={G.csH}
            rx={12}
            fill={activeColor} fillOpacity={insideT1 || insideT2 ? 0.10 : 0.04}
            stroke={activeColor} strokeWidth={insideT1 || insideT2 ? 2 : 1.5}
            strokeDasharray={insideT1 || insideT2 ? '0' : '6 6'}/>
          <text x={G.csX + 16} y={G.csY + 22}
            fill={activeColor}
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            CRITICAL SECTION
          </text>
          <text x={G.csX + G.csW - 16} y={G.csY + 22}
            textAnchor="end"
            fill={activeColor}
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.14em">
            owner: {activeName}
          </text>

          {/* Code lines inside the frame */}
          <text x={G.csX + 28} y={G.codeY + 4}
            fill="var(--chalk-200)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            <tspan fill="var(--violet-400)">lock</tspan>(mu);
          </text>
          <text x={G.csX + 28} y={G.codeY + 34}
            fill={insideT1 || insideT2 ? 'var(--chalk-100)' : 'var(--chalk-200)'}
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            tmp = counter;
          </text>
          <text x={G.csX + 28} y={G.codeY + 64}
            fill={insideT1 || insideT2 ? 'var(--chalk-100)' : 'var(--chalk-200)'}
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            tmp = tmp + 1;
          </text>
          <text x={G.csX + 28} y={G.codeY + 94}
            fill={insideT1 || insideT2 ? 'var(--chalk-100)' : 'var(--chalk-200)'}
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            counter = tmp;
          </text>
          <text x={G.csX + 28} y={G.codeY + 124}
            fill="var(--chalk-200)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            <tspan fill="var(--violet-400)">unlock</tspan>(mu);
          </text>
        </SvgFadeIn>

        {/* Waiting thread badge (whoever isn't inside) */}
        {!finished && (
          <g>
            {/* T1 badge */}
            <g opacity={insideT1 ? 1 : (insideT2 ? 0.35 : 0.7)}>
              <circle cx={G.csX - 24} cy={G.csY + G.csH / 2 - 18} r={14}
                fill={T1_COLOR} opacity={insideT1 ? 0.95 : 0.45}/>
              <text x={G.csX - 24} y={G.csY + G.csH / 2 - 14}
                textAnchor="middle"
                fill="var(--bg-canvas)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={14}>T1</text>
            </g>
            {/* T2 badge */}
            <g opacity={insideT2 ? 1 : (insideT1 ? 0.35 : 0.7)}>
              <circle cx={G.csX - 24} cy={G.csY + G.csH / 2 + 18} r={14}
                fill={T2_COLOR} opacity={insideT2 ? 0.95 : 0.45}/>
              <text x={G.csX - 24} y={G.csY + G.csH / 2 + 22}
                textAnchor="middle"
                fill="var(--bg-canvas)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={14}>T2</text>
            </g>
          </g>
        )}

        {/* Formula tagline */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.formulaY}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}
            letterSpacing="0.06em">
            lock → load · add · store → unlock
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            one thread inside at a time — mutual exclusion
          </text>
        </SvgFadeIn>
      </svg>
    </div>
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
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '40ch',
          lineHeight: 1.3,
        }}>
        shared state + interleaving = race condition
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
        }}>
        (every lock is a fence around a critical section)
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
