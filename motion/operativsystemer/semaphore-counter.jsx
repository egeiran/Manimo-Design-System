// Semaphores: A Counter Threads Wait On — Manimo lesson scene.
// A semaphore is an integer plus a queue. P() decrements (and maybe sleeps);
// V() increments (and maybe wakes one waiter). With S=1 it's a mutex.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/semaphore-counter/):
//    0.00– 6.83  Manimo intro: many threads sharing a resource, with a cap
//    6.83–15.92  Shape: counter + wait queue
//   15.92–28.45  Four threads call P(): counter drops 3→2→1→0→-1; T4 queues
//   28.45–36.50  A thread calls V(): counter -1→0, T4 wakes from queue
//   36.50–45.00  Takeaway: S=1 mutex, S=N capacity gate
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beat 3 (P-call) and Beat 4 (V-call) carry the genuine motion:
//     thread tokens flow across the scene, the counter value ticks down
//     in sync with their arrival, and the fourth thread slides into a
//     wait-queue slot when the counter would go below zero.

const SCENE_DURATION = 38;

const NARRATION = [
  /*  0.00– 6.83 */ 'How do you let many threads share a resource at once, but only up to a fixed limit?',
  /*  6.83–15.92 */ 'A semaphore is just two things — an integer and a queue. The integer counts how many more threads may pass; the queue holds threads that have to wait.',
  /* 15.92–28.45 */ 'When a thread calls P of s, the counter drops by one. If it would drop below zero, that thread goes to sleep in the queue.',
  /* 28.45–36.50 */ 'When a thread finishes and calls V of s, the counter goes back up. If anyone was waiting, the semaphore wakes one of them.',
  /* 36.50–45.00 */ 'Set S to one and a semaphore behaves like a lock. Set it to N and you have an N-way capacity gate.',
];

const NARRATION_AUDIO = 'audio/semaphore-counter/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="semaphores"
      title="Semaphores: A Counter Threads Wait On"
      duration={SCENE_DURATION}
      introEnd={4.93}
      introCaption="Many threads, one shared resource — with a cap."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.93} end={14.37}>
        <ShapeBeat />
      </Sprite>

      <Sprite start={14.37} end={21.87}>
        <PCallBeat />
      </Sprite>

      <Sprite start={21.87} end={29.9}>
        <VCallBeat />
      </Sprite>

      <Sprite start={29.9} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared geometry ──────────────────────────────────────────────────────
// Used by Beats 2/3/4 so the counter and queue line up across the scene.
function semGeom(portrait) {
  return portrait
    ? {
        vbW: 600, vbH: 460,
        // Counter circle
        ctrX: 300, ctrY: 110, ctrR: 60,
        // Gate (vertical bar threads pass through, just below counter)
        gateX: 300, gateY1: 190, gateY2: 250,
        // Queue: 4 horizontal slots below the gate
        queueX0: 130, queueY: 320, slotW: 80, slotH: 56, slotGap: 8,
        queueLabelY: 300, captionY: 420,
        // Thread arrival lane
        laneInY: 220, laneOutY: 220,
        threadStartX: 40, threadEndX: 560,
        tokenR: 18, counterFontSize: 48,
      }
    : {
        vbW: 1080, vbH: 380,
        ctrX: 220, ctrY: 170, ctrR: 70,
        gateX: 360, gateY1: 110, gateY2: 230,
        queueX0: 540, queueY: 80, slotW: 90, slotH: 70, slotGap: 10,
        queueLabelY: 60, captionY: 340,
        laneInY: 170, laneOutY: 170,
        threadStartX: 50, threadEndX: 1040,
        tokenR: 22, counterFontSize: 56,
      };
}

// Counter circle with a value rendered at its centre.
function CounterCircle({ G, value, valueColor, pulsing }) {
  const { localTime } = useSprite();
  // Subtle pulse on the stroke when the counter changes.
  const pulse = pulsing
    ? 0.6 + 0.4 * Math.sin(localTime * 4.2)
    : 1;
  return (
    <g>
      <circle cx={G.ctrX} cy={G.ctrY} r={G.ctrR}
        fill="rgba(244,184,96,0.08)"
        stroke="var(--amber-400)" strokeWidth={2.2 * pulse}/>
      <text x={G.ctrX} y={G.ctrY - G.ctrR - 14} textAnchor="middle"
        fill="var(--chalk-300)" fontFamily="var(--font-mono)"
        fontSize={11} letterSpacing="0.18em">COUNTER</text>
      <text x={G.ctrX} y={G.ctrY + G.counterFontSize / 3}
        textAnchor="middle"
        fill={valueColor || 'var(--amber-300)'}
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={G.counterFontSize}>
        {value}
      </text>
    </g>
  );
}

// A static row of queue slots — fills with held thread tokens.
function QueueRow({ G, occupants }) {
  const slots = [];
  for (let i = 0; i < 4; i++) {
    const x = G.queueX0 + i * (G.slotW + G.slotGap);
    const occ = occupants[i];
    slots.push(
      <g key={i}>
        <rect x={x} y={G.queueY} width={G.slotW} height={G.slotH} rx={10}
          fill={occ ? 'rgba(232,122,144,0.12)' : 'rgba(232,220,193,0.04)'}
          stroke={occ ? 'var(--rose-400)' : 'var(--chalk-300)'}
          strokeWidth={1.3}
          strokeDasharray={occ ? '0' : '4 4'}/>
        {occ && (
          <>
            <circle cx={x + G.slotW / 2} cy={G.queueY + G.slotH / 2}
              r={G.tokenR}
              fill="var(--rose-400)" opacity={0.92}/>
            <text x={x + G.slotW / 2} y={G.queueY + G.slotH / 2 + 5}
              textAnchor="middle"
              fill="var(--bg-canvas)"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={14} fontWeight={500}>
              {occ}
            </text>
          </>
        )}
      </g>,
    );
  }
  return <g>{slots}</g>;
}

// ─── Beat 2: Shape — counter + queue ──────────────────────────────────────
function ShapeBeat() {
  const portrait = usePortrait();
  const G = semGeom(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.5} delay={0.4}>
          <CounterCircle G={G} value={3} valueColor="var(--amber-300)" pulsing={false}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={G.queueX0 + 2 * G.slotW + G.slotGap * 1.5}
            y={G.queueLabelY} textAnchor="middle"
            fill="var(--chalk-300)" fontFamily="var(--font-mono)"
            fontSize={11} letterSpacing="0.18em">WAIT QUEUE</text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={1.6}>
          <QueueRow G={G} occupants={[null, null, null, null]}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={2.8}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
            fill="var(--chalk-200)" fontFamily="var(--font-sans)"
            fontSize={portrait ? 14 : 16} letterSpacing="0.02em">
            S = counter + wait queue
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: P() calls — counter drains, T4 queues ────────────────────────
//
// This is the scene's centrepiece motion beat. Four threads arrive from the
// left at staggered times. T1/T2/T3 pass through the gate; T4 finds the
// counter at zero and slides into the wait queue. The counter value ticks
// down with each arrival.
function PCallBeat() {
  const portrait = usePortrait();
  const G = semGeom(portrait);
  const { localTime } = useSprite();

  // Arrival times for T1..T4 — each arrives, hits the gate, advances/blocks.
  // Counter value depends on how many arrivals have happened.
  const ARRIVE = [1.4, 3.4, 5.4, 7.4];   // each thread's t-of-arrival-at-gate
  const TRAVEL = 1.0;                    // seconds to travel from start to gate

  const counterVal = (() => {
    let v = 3;
    for (let i = 0; i < 4; i++) if (localTime >= ARRIVE[i]) v -= 1;
    return v;
  })();
  const valueColor = counterVal < 0 ? 'var(--rose-400)' : 'var(--amber-300)';

  // Token positions for each thread:
  //   t < arriveStart      → not yet visible
  //   arriveStart..arrive  → moving from threadStartX → gateX
  //   arrive..exit         → for T1..T3: moving gateX → threadEndX
  //                          for T4: moving gateX → queueSlot(0)
  //   exit..               → either gone (T1..T3) or sitting in queue (T4)
  const POST = 1.4;  // seconds after arrival to fully exit / settle
  const tokens = [];
  const labels = ['T1', 'T2', 'T3', 'T4'];
  for (let i = 0; i < 4; i++) {
    const arrive = ARRIVE[i];
    const arriveStart = arrive - TRAVEL;
    if (localTime < arriveStart) continue;

    let cx, cy, opacity = 1;
    if (localTime < arrive) {
      // Travelling toward gate
      const k = (localTime - arriveStart) / TRAVEL;
      const eased = Easing.easeOutCubic(k);
      cx = G.threadStartX + (G.gateX - G.threadStartX) * eased;
      cy = G.laneInY;
    } else if (i < 3) {
      // T1..T3 — passed through gate, continuing right
      const exitT = localTime - arrive;
      const k = clamp(exitT / POST, 0, 1);
      const eased = Easing.easeOutCubic(k);
      cx = G.gateX + (G.threadEndX - G.gateX) * eased;
      cy = G.laneOutY;
      // Fade out as the token leaves the canvas
      opacity = 1 - clamp((exitT - POST * 0.7) / (POST * 0.4), 0, 1);
    } else {
      // T4 — blocked, slides from gate to queue slot 0
      const slotCx = G.queueX0 + G.slotW / 2;
      const slotCy = G.queueY + G.slotH / 2;
      const blockT = localTime - arrive;
      const k = clamp(blockT / POST, 0, 1);
      const eased = Easing.easeOutCubic(k);
      cx = G.gateX + (slotCx - G.gateX) * eased;
      cy = G.laneInY + (slotCy - G.laneInY) * eased;
    }
    tokens.push({
      cx, cy, opacity,
      color: i < 3 ? 'var(--amber-400)' : 'var(--rose-400)',
      label: labels[i],
    });
  }

  // Show T4 settled in queue once it's arrived AND its travel-to-queue ended.
  const t4Settled = localTime >= ARRIVE[3] + POST;
  const queueOcc = [t4Settled ? 'T4' : null, null, null, null];
  // The settled rose token is drawn by QueueRow; remove the moving copy.
  const drawTokens = t4Settled
    ? tokens.filter(t => t.label !== 'T4')
    : tokens;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Counter circle (always visible, value updates live) */}
        <CounterCircle G={G} value={counterVal} valueColor={valueColor}
          pulsing={counterVal < 0}/>

        {/* Gate (a vertical bar threads must cross) */}
        <line x1={G.gateX} y1={G.gateY1} x2={G.gateX} y2={G.gateY2}
          stroke="var(--amber-300)" strokeWidth={2.2} opacity={0.7}/>
        <line x1={G.gateX - 12} y1={G.gateY1} x2={G.gateX - 12} y2={G.gateY2}
          stroke="var(--amber-300)" strokeWidth={1} opacity={0.35}
          strokeDasharray="3 3"/>
        <line x1={G.gateX + 12} y1={G.gateY1} x2={G.gateX + 12} y2={G.gateY2}
          stroke="var(--amber-300)" strokeWidth={1} opacity={0.35}
          strokeDasharray="3 3"/>
        <text x={G.gateX} y={G.gateY1 - 6} textAnchor="middle"
          fill="var(--amber-300)" fontFamily="var(--font-mono)"
          fontSize={10} letterSpacing="0.18em">P()</text>

        {/* Queue slots — populated only with T4 once it settles */}
        <text x={G.queueX0 + 2 * G.slotW + G.slotGap * 1.5}
          y={G.queueLabelY} textAnchor="middle"
          fill="var(--chalk-300)" fontFamily="var(--font-mono)"
          fontSize={11} letterSpacing="0.18em">WAIT QUEUE</text>
        <QueueRow G={G} occupants={queueOcc}/>

        {/* In-flight thread tokens */}
        {drawTokens.map((t, idx) => (
          <g key={idx} opacity={t.opacity}>
            <circle cx={t.cx} cy={t.cy} r={G.tokenR}
              fill={t.color} opacity={0.92}/>
            <text x={t.cx} y={t.cy + 5} textAnchor="middle"
              fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={14} fontWeight={500}>
              {t.label}
            </text>
          </g>
        ))}

        {/* Caption appears once the queue receives T4 */}
        {localTime > 9 && (
          <SvgFadeIn duration={0.5} delay={0}>
            <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
              fill="var(--chalk-300)" fontFamily="var(--font-sans)"
              fontSize={portrait ? 13 : 15} letterSpacing="0.02em">
              negative counter = how many threads are waiting
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: V() — release the lock, wake the queued thread ───────────────
function VCallBeat() {
  const portrait = usePortrait();
  const G = semGeom(portrait);
  const { localTime } = useSprite();

  // Storyline:
  //   t = 0.4   T1 finishes its critical section and calls V()
  //   t = 1.0   counter ticks -1 → 0
  //   t = 2.0   T4 wakes — slides from queue slot 0 back toward the gate
  //   t = 3.0   T4 passes the gate, counter ticks 0 → -1 again (it's now
  //             the running thread; one less seat available)
  const V_T = 1.0;
  const WAKE_T = 2.0;
  const WAKE_DUR = 1.6;
  const PASS_T = WAKE_T + WAKE_DUR;  // 3.6
  const PASS_DUR = 1.2;

  let counterVal;
  if (localTime < V_T)            counterVal = -1;
  else if (localTime < PASS_T)    counterVal = 0;
  else                            counterVal = -1;

  const valueColor = counterVal < 0 ? 'var(--rose-400)' : 'var(--amber-300)';

  // T4 motion: at queue slot until WAKE_T, then animates back to gate,
  // then passes through.
  const slotCx = G.queueX0 + G.slotW / 2;
  const slotCy = G.queueY + G.slotH / 2;
  let t4Cx = slotCx, t4Cy = slotCy;
  let t4Color = 'var(--rose-400)';
  let t4Visible = true;
  let t4Opacity = 1;

  if (localTime < WAKE_T) {
    // Sitting in queue
    t4Cx = slotCx; t4Cy = slotCy;
  } else if (localTime < WAKE_T + WAKE_DUR) {
    // Wake — slide from slot back to gate
    const k = (localTime - WAKE_T) / WAKE_DUR;
    const eased = Easing.easeOutCubic(k);
    t4Cx = slotCx + (G.gateX - slotCx) * eased;
    t4Cy = slotCy + (G.laneInY - slotCy) * eased;
    // Colour shifts from rose (waiting) to amber (running) as it crosses.
    t4Color = k > 0.55 ? 'var(--amber-400)' : 'var(--rose-400)';
  } else if (localTime < PASS_T + PASS_DUR) {
    // Pass the gate, exit right
    const k = (localTime - PASS_T) / PASS_DUR;
    const eased = Easing.easeOutCubic(k);
    t4Cx = G.gateX + (G.threadEndX - G.gateX) * eased;
    t4Cy = G.laneOutY;
    t4Color = 'var(--amber-400)';
    t4Opacity = 1 - clamp((k - 0.7) / 0.3, 0, 1);
  } else {
    t4Visible = false;
  }

  // Queue slot 0 occupied unless T4 has woken.
  const queueOcc = [(localTime < WAKE_T) ? 'T4' : null, null, null, null];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <CounterCircle G={G} value={counterVal} valueColor={valueColor}
          pulsing={false}/>

        {/* Gate, now labelled V() — green/amber tone for "release" */}
        <line x1={G.gateX} y1={G.gateY1} x2={G.gateX} y2={G.gateY2}
          stroke="var(--teal-400)" strokeWidth={2.2} opacity={0.85}/>
        <line x1={G.gateX - 12} y1={G.gateY1} x2={G.gateX - 12} y2={G.gateY2}
          stroke="var(--teal-400)" strokeWidth={1} opacity={0.35}
          strokeDasharray="3 3"/>
        <line x1={G.gateX + 12} y1={G.gateY1} x2={G.gateX + 12} y2={G.gateY2}
          stroke="var(--teal-400)" strokeWidth={1} opacity={0.35}
          strokeDasharray="3 3"/>
        <text x={G.gateX} y={G.gateY1 - 6} textAnchor="middle"
          fill="var(--teal-400)" fontFamily="var(--font-mono)"
          fontSize={10} letterSpacing="0.18em">V()</text>

        <text x={G.queueX0 + 2 * G.slotW + G.slotGap * 1.5}
          y={G.queueLabelY} textAnchor="middle"
          fill="var(--chalk-300)" fontFamily="var(--font-mono)"
          fontSize={11} letterSpacing="0.18em">WAIT QUEUE</text>
        <QueueRow G={G} occupants={queueOcc}/>

        {/* T4 token while in motion */}
        {t4Visible && (
          <g opacity={t4Opacity}>
            <circle cx={t4Cx} cy={t4Cy} r={G.tokenR}
              fill={t4Color} opacity={0.92}/>
            <text x={t4Cx} y={t4Cy + 5} textAnchor="middle"
              fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={14} fontWeight={500}>
              T4
            </text>
          </g>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={5.4}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
            fill="var(--chalk-200)" fontFamily="var(--font-sans)"
            fontSize={portrait ? 13 : 15} letterSpacing="0.02em">
            P decrements + maybe sleeps · V increments + maybe wakes
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ─────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  const lineStyle = {
    fontFamily: 'var(--font-mono)',
    fontSize: portrait ? 22 : 28,
    letterSpacing: '0.02em',
  };
  // Small mini-counter icon — a stroked circle with the initial value
  // ("1" or "N") inside, matching the colour of the sem_init line it sits
  // next to. Aligns with the mono line vertically.
  const iconSize = portrait ? 28 : 34;
  function CounterIcon({ value, color }) {
    return (
      <svg width={iconSize} height={iconSize} viewBox="0 0 34 34"
           style={{ overflow: 'visible', flex: '0 0 auto' }}>
        <circle cx={17} cy={17} r={14} fill="none" stroke={color} strokeWidth={1.8}/>
        <text x={17} y={22} textAnchor="middle"
              fill={color} fontFamily="var(--font-mono)" fontSize={16}>
          {value}
        </text>
      </svg>
    );
  }
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
        two shapes of one primitive
      </FadeUp>

      <FadeUp duration={0.55} delay={0.3} distance={12}
        style={{ ...lineStyle, color: 'var(--amber-300)',
                 display: 'flex', alignItems: 'center', gap: 12 }}>
        <CounterIcon value="1" color="var(--amber-300)"/>
        <span>sem_init(s, 1)</span>
      </FadeUp>
      <FadeUp duration={0.45} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 16 : 18, color: 'var(--chalk-300)',
          marginTop: -8,
        }}>
        ↳ a plain mutex
      </FadeUp>

      <FadeUp duration={0.55} delay={1.6} distance={12}
        style={{ ...lineStyle, color: 'var(--chalk-100)', marginTop: 14,
                 display: 'flex', alignItems: 'center', gap: 12 }}>
        <CounterIcon value="N" color="var(--chalk-100)"/>
        <span>sem_init(s, N)</span>
      </FadeUp>
      <FadeUp duration={0.45} delay={2.0} distance={8}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 16 : 18, color: 'var(--chalk-300)',
          marginTop: -8,
        }}>
        ↳ an N-way capacity gate
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)', letterSpacing: '0.04em',
          marginTop: 22, maxWidth: portrait ? '30ch' : '46ch',
          lineHeight: 1.4,
        }}>
        one primitive — many shapes of mutual exclusion
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
