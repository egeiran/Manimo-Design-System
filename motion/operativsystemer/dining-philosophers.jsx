// Dining Philosophers — Manimo lesson scene.
// Five philosophers around a round table. Between every pair sits a
// chopstick (a shared lock). Each philosopher needs both adjacent
// chopsticks to eat. If everyone reaches for their left first, they
// gridlock — the canonical deadlock.
//
// Genuine animation lives in `DeadlockBeat`: each philosopher's left
// arm extends to grab its left chopstick over a synchronized window
// driven by sprite localTime; the chopsticks flash rose as they're
// locked, then right arms extend but freeze short of their targets —
// the still that says "deadlock." `FixBeat` then re-runs the same
// scene with philosopher P0's pick order reversed; the cycle visibly
// fails to close.

const SCENE_DURATION = 53;

const NARRATION = [
  /*  0.00– 9.11 */ 'Five philosophers, five chopsticks, one round table. They take turns thinking and eating — but their lock pattern can stop them all at once.',
  /*  9.11–17.77 */ 'Each philosopher needs the chopstick on their left and the one on their right at the same time. To pick one up they must grab a lock that no neighbour holds.',
  /* 17.77–32.00 */ 'Suppose every philosopher reaches for the left chopstick first, at the same moment. They all succeed. Then each turns to grab the right — and finds a neighbour holding it. Nobody can finish. Nobody lets go. Deadlock.',
  /* 32.00–41.48 */ "Coffman's four conditions name what just happened. Mutual exclusion. Hold and wait. No preemption. And a circular wait around the table.",
  /* 41.48–53.00 */ 'Break any one and the gridlock dissolves. One classic fix: number the chopsticks and always pick the lower-numbered one first. One philosopher reverses, and the cycle never closes.',
];

const NARRATION_AUDIO = 'audio/dining-philosophers/scene.mp3';

const N = 5;

function tableGeometry(portrait) {
  return portrait
    ? { vbW: 600, vbH: 580, cx: 300, cy: 300, philR: 200, chopR: 145, philSize: 36,
        eyebrowY: 50, captionY: 540 }
    : { vbW: 1100, vbH: 480, cx: 550, cy: 240, philR: 170, chopR: 122, philSize: 32,
        eyebrowY: 40, captionY: 440 };
}

// Returns (x,y) for the i-th philosopher (i=0 at the top, clockwise).
function philXY(G, i) {
  const theta = -Math.PI / 2 + i * (2 * Math.PI / N);
  return { x: G.cx + G.philR * Math.cos(theta), y: G.cy + G.philR * Math.sin(theta) };
}
// Returns (x,y) for chopstick i (sits between philosopher i and (i+1) mod N).
function chopXY(G, i) {
  const theta = -Math.PI / 2 + (i + 0.5) * (2 * Math.PI / N);
  return { x: G.cx + G.chopR * Math.cos(theta), y: G.cy + G.chopR * Math.sin(theta) };
}

// "Left chopstick" of philosopher i is between i-1 and i — that's chop (i-1+N) % N.
// "Right chopstick" of philosopher i is between i and i+1 — that's chop i.
function leftChop(i)  { return (i - 1 + N) % N; }
function rightChop(i) { return i; }

// Draw an arm from philosopher to chopstick, reaching `frac` (0..1) of
// the way. 1 = arm closed onto the chopstick, 0 = no arm visible.
function Arm({ p, c, frac, color, dashed }) {
  if (frac <= 0) return null;
  const x = p.x + (c.x - p.x) * frac;
  const y = p.y + (c.y - p.y) * frac;
  return (
    <line x1={p.x} y1={p.y} x2={x} y2={y}
      stroke={color}
      strokeWidth={2.6}
      strokeDasharray={dashed ? '4 4' : undefined}
      strokeLinecap="round"
      opacity={0.85}/>
  );
}

function Philosopher({ x, y, label, size, color, state }) {
  // state: 'thinking' | 'reaching' | 'holding' | 'eating' | 'blocked'
  const stateFills = {
    thinking: 'var(--chalk-200)',
    reaching: 'var(--amber-300)',
    holding:  'var(--amber-400)',
    eating:   'var(--teal-400)',
    blocked:  'var(--rose-400)',
  };
  const fill = color || stateFills[state] || 'var(--chalk-200)';
  return (
    <g>
      <circle cx={x} cy={y} r={size / 2}
        fill={fill} fillOpacity={0.25}
        stroke={fill} strokeWidth={1.8}/>
      <text x={x} y={y + 5}
        textAnchor="middle"
        fill="var(--chalk-100)"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={size * 0.5}>
        {label}
      </text>
    </g>
  );
}

function Chopstick({ x, y, locked, lockedBy }) {
  // A short tilted bar oriented tangent to the table circle. Locked
  // chopsticks pulse-fill rose; free are chalk.
  const fill = locked ? 'var(--rose-400)' : 'var(--chalk-200)';
  return (
    <g>
      <rect x={x - 14} y={y - 3} width={28} height={6} rx={3}
        fill={fill} fillOpacity={locked ? 0.7 : 0.35}
        stroke={fill} strokeWidth={1.2}/>
    </g>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="concurrency"
      title="Dining Philosophers"
      duration={SCENE_DURATION}
      introEnd={9.11}
      introCaption="Five threads, five locks — a textbook deadlock waiting to happen."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.11} end={17.77}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={17.77} end={32}>
        <DeadlockBeat/>
      </Sprite>

      <Sprite start={32} end={41.48}>
        <FourConditionsBeat/>
      </Sprite>

      <Sprite start={41.48} end={SCENE_DURATION}>
        <FixBeat/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: setup — five seats, five sticks ─────────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = tableGeometry(portrait);
  const { localTime } = useSprite();

  // A demo philosopher P0 reaches for both chopsticks once just to show
  // what "needs both" looks like — over t=4..7, eats t=7..8.5, releases.
  const reachL = clamp((localTime - 4.0) / 0.8, 0, 1);
  const reachR = clamp((localTime - 5.0) / 0.8, 0, 1);
  const eating = localTime > 6.0 && localTime < 8.0;
  const release = clamp((localTime - 8.0) / 0.6, 0, 1);
  const lFrac = release > 0 ? Math.max(0, reachL - release) : reachL;
  const rFrac = release > 0 ? Math.max(0, reachR - release) : reachR;

  const p0 = philXY(G, 0);
  const lc = chopXY(G, leftChop(0));
  const rc = chopXY(G, rightChop(0));

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 12}
            letterSpacing="0.18em">
            RULE — EAT NEEDS BOTH ADJACENT CHOPSTICKS
          </text>
        </SvgFadeIn>

        {/* Table circle */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <circle cx={G.cx} cy={G.cy} r={(G.philR + G.chopR) / 2 - 6}
            fill="var(--chalk-200)" fillOpacity={0.025}
            stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 6"/>
        </SvgFadeIn>

        {/* Chopsticks */}
        {Array.from({ length: N }).map((_, i) => {
          const c = chopXY(G, i);
          const locked = (i === leftChop(0)  && lFrac > 0.8) ||
                         (i === rightChop(0) && rFrac > 0.8);
          return (
            <SvgFadeIn key={i} duration={0.4} delay={0.6 + i * 0.12}>
              <Chopstick x={c.x} y={c.y} locked={locked}/>
            </SvgFadeIn>
          );
        })}

        {/* Philosophers */}
        {Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          let state = 'thinking';
          if (i === 0) {
            if (eating) state = 'eating';
            else if (lFrac > 0 || rFrac > 0) state = 'holding';
          }
          return (
            <SvgFadeIn key={i} duration={0.4} delay={1.0 + i * 0.1}>
              <Philosopher x={p.x} y={p.y} label={`P${i}`} size={G.philSize} state={state}/>
            </SvgFadeIn>
          );
        })}

        {/* P0's two arms during the demo */}
        <Arm p={p0} c={lc} frac={lFrac} color="var(--amber-400)"/>
        <Arm p={p0} c={rc} frac={rFrac} color="var(--amber-400)"/>

        <SvgFadeIn duration={0.5} delay={2.4}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            grab left, grab right, eat, put both down
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: deadlock — the centrepiece ──────────────────────────────────
// All five philosophers reach for the left chopstick simultaneously
// (sprite-local t=0.8..1.6), then each turns to grab the right
// (t=3.0..5.0) — but every right chopstick is already held by a
// neighbour, so each right-arm extension is clipped to the boundary
// where its target chopstick sits and frozen there.
function DeadlockBeat() {
  const portrait = usePortrait();
  const G = tableGeometry(portrait);
  const { localTime } = useSprite();

  // Left grab: 0.8..1.6
  const leftFrac = clamp((localTime - 0.8) / 0.8, 0, 1);
  // Right reach: starts at 3.0; in 0.6s it goes from 0 to a maximum of
  // 0.55 (always short of the neighbour-held target).
  const rightFracMax = 0.55;
  const rightFrac = clamp((localTime - 3.0) / 0.6, 0, 1) * rightFracMax;

  // Subtle "frozen" jitter on the right arms once they're at maxFrac.
  const rightJitter = (() => {
    if (localTime < 3.8) return 0;
    return 0.005 * Math.sin(localTime * 4);
  })();

  // Holding all chopsticks once left grab completes.
  const allHeldLeft = leftFrac >= 0.95;

  // Deadlock callout pulses on after t=5.5.
  const deadlockOpacity = clamp((localTime - 5.5) / 0.6, 0, 1);

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 12}
            letterSpacing="0.18em">
            STEP ONE — EVERYONE GRABS LEFT
          </text>
        </SvgFadeIn>

        {/* Table */}
        <circle cx={G.cx} cy={G.cy} r={(G.philR + G.chopR) / 2 - 6}
          fill="var(--chalk-200)" fillOpacity={0.025}
          stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 6"/>

        {/* Chopsticks — once leftFrac > 0.8 each is locked by its left
            neighbour philosopher. So chopstick c is held by P[(c+1) % N]. */}
        {Array.from({ length: N }).map((_, i) => {
          const c = chopXY(G, i);
          return <Chopstick key={i} x={c.x} y={c.y} locked={allHeldLeft}/>;
        })}

        {/* Left arms for every philosopher */}
        {Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          const lc = chopXY(G, leftChop(i));
          return <Arm key={i} p={p} c={lc} frac={leftFrac} color="var(--amber-400)"/>;
        })}

        {/* Right arms — clipped short, dashed, rose. Only appear after t=3.0 */}
        {localTime > 3.0 && Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          const rc = chopXY(G, rightChop(i));
          return <Arm key={i} p={p} c={rc}
            frac={Math.max(0, rightFrac + rightJitter)}
            color="var(--rose-400)" dashed/>;
        })}

        {/* Philosophers */}
        {Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          const state = localTime > 3.0 ? 'blocked' : (allHeldLeft ? 'holding' : 'reaching');
          return <Philosopher key={i} x={p.x} y={p.y} label={`P${i}`} size={G.philSize} state={state}/>;
        })}

        {/* Deadlock callout */}
        {deadlockOpacity > 0 && (
          <g opacity={deadlockOpacity}>
            <text x={G.cx} y={G.cy - 4}
              textAnchor="middle"
              fill="var(--rose-300)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 13}
              letterSpacing="0.22em">
              DEADLOCK
            </text>
            <text x={G.cx} y={G.cy + 18}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={10}
              letterSpacing="0.16em">
              all waiting · none moving
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: the four conditions ─────────────────────────────────────────
// Render the deadlocked tableau once more, and label its four
// Coffman-condition features with arrows / pointers around it. Each
// label fades in on its own delay so the eye can track which feature
// matches which name.
function FourConditionsBeat() {
  const portrait = usePortrait();
  const G = tableGeometry(portrait);

  // Static deadlocked configuration (no animation here — the previous
  // beat already showed the motion). Left arms held to 1.0, right arms
  // halted at 0.55.
  const L = 1.0;
  const R = 0.55;

  const labels = portrait
    ? [
        { delay: 0.4, text: '1. mutual exclusion',     x: G.vbW / 2, y: 100,           anchor: 'middle', color: 'var(--rose-300)' },
        { delay: 1.3, text: '2. hold and wait',        x: G.vbW / 2, y: 120,           anchor: 'middle', color: 'var(--rose-300)' },
        { delay: 2.2, text: '3. no preemption',        x: G.vbW / 2, y: 480,           anchor: 'middle', color: 'var(--rose-300)' },
        { delay: 3.1, text: '4. circular wait (here)', x: G.vbW / 2, y: 500,           anchor: 'middle', color: 'var(--amber-300)' },
      ]
    : [
        { delay: 0.4, text: '1. mutual exclusion',     x: 120,         y: 130,         anchor: 'start',  color: 'var(--rose-300)' },
        { delay: 1.3, text: '2. hold and wait',        x: 120,         y: 200,         anchor: 'start',  color: 'var(--rose-300)' },
        { delay: 2.2, text: '3. no preemption',        x: G.vbW - 120, y: 130,         anchor: 'end',    color: 'var(--rose-300)' },
        { delay: 3.1, text: '4. circular wait (here)', x: G.vbW - 120, y: 200,         anchor: 'end',    color: 'var(--amber-300)' },
      ];

  // Captions describing each condition (small mono, beneath each label).
  const subs = portrait
    ? null
    : [
        { delay: 0.6,  text: 'a chopstick only one at a time',                x: 120,         y: 150, anchor: 'start' },
        { delay: 1.5,  text: 'holding left, waiting for right',                x: 120,         y: 220, anchor: 'start' },
        { delay: 2.4,  text: 'no one is forced to drop',                       x: G.vbW - 120, y: 150, anchor: 'end'   },
        { delay: 3.3,  text: 'P0→P1→P2→P3→P4→P0',                              x: G.vbW - 120, y: 220, anchor: 'end'   },
      ];

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 12}
            letterSpacing="0.18em">
            COFFMAN — ALL FOUR HOLD
          </text>
        </SvgFadeIn>

        {/* Table + frozen tableau */}
        <circle cx={G.cx} cy={G.cy} r={(G.philR + G.chopR) / 2 - 6}
          fill="var(--chalk-200)" fillOpacity={0.025}
          stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 6"/>
        {Array.from({ length: N }).map((_, i) => {
          const c = chopXY(G, i);
          return <Chopstick key={i} x={c.x} y={c.y} locked={true}/>;
        })}
        {Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          const lc = chopXY(G, leftChop(i));
          const rc = chopXY(G, rightChop(i));
          return (
            <g key={i}>
              <Arm p={p} c={lc} frac={L} color="var(--amber-400)"/>
              <Arm p={p} c={rc} frac={R} color="var(--rose-400)" dashed/>
            </g>
          );
        })}
        {Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          return <Philosopher key={i} x={p.x} y={p.y} label={`P${i}`} size={G.philSize} state="blocked"/>;
        })}

        {/* Circular-wait arrows — a curved arc near the table going CW */}
        <SvgFadeIn duration={0.5} delay={2.8}>
          <circle cx={G.cx} cy={G.cy} r={G.philR - G.philSize / 2 - 6}
            fill="none" stroke="var(--amber-300)" strokeWidth={1.4}
            strokeDasharray="6 6" opacity={0.6}/>
          {/* Tiny arrowheads on the cycle to show direction */}
          {Array.from({ length: N }).map((_, i) => {
            const theta = -Math.PI / 2 + (i + 0.5) * (2 * Math.PI / N);
            const r = G.philR - G.philSize / 2 - 6;
            const ax = G.cx + r * Math.cos(theta);
            const ay = G.cy + r * Math.sin(theta);
            const tx = -Math.sin(theta);  // tangent (CW)
            const ty =  Math.cos(theta);
            return (
              <polygon key={i}
                points={`${ax},${ay} ${ax - tx * 9 - ty * 4},${ay - ty * 9 + tx * 4} ${ax - tx * 9 + ty * 4},${ay - ty * 9 - tx * 4}`}
                fill="var(--amber-300)" opacity={0.7}/>
            );
          })}
        </SvgFadeIn>

        {/* Labels */}
        {labels.map((lab, i) => (
          <SvgFadeIn key={i} duration={0.4} delay={lab.delay}>
            <text x={lab.x} y={lab.y}
              textAnchor={lab.anchor}
              fill={lab.color}
              fontFamily="var(--font-mono)" fontSize={portrait ? 12 : 14}
              letterSpacing="0.12em">
              {lab.text}
            </text>
          </SvgFadeIn>
        ))}
        {subs && subs.map((sub, i) => (
          <SvgFadeIn key={i} duration={0.4} delay={sub.delay}>
            <text x={sub.x} y={sub.y}
              textAnchor={sub.anchor}
              fill="var(--chalk-300)"
              fontFamily="var(--font-sans)" fontSize={12}>
              {sub.text}
            </text>
          </SvgFadeIn>
        ))}
      </svg>
    </div>
  );
}

// ─── Beat 5: fix — break the symmetry ────────────────────────────────────
// Same table, but P0 now picks the lower-numbered chopstick first. P0's
// two chopsticks are c4 (left, number 4) and c0 (right, number 0). 0 < 4
// so P0 reaches RIGHT first. Animate the new order. Result: at t≈2 the
// rest of the table is blocked but P0 isn't — c0 was free because the
// neighbour (P4) is reaching for c3 first (still its lower-numbered),
// then P4 → c4 success → P3 → c2 cascade frees, so eating succeeds.
//
// Visual: we show P0 with arms in the new order, and one philosopher
// (P0) succeeds in eating after a moment, while the cycle never closes.
function FixBeat() {
  const portrait = usePortrait();
  const G = tableGeometry(portrait);
  const { localTime } = useSprite();

  // Reaches:
  //   P0 reach right (c0) over t=1.0..1.7 — succeeds (c0 free because
  //     nobody's lower-numbered side competes for it).
  //   Other philosophers Pi (i=1..4) reach for their lower-numbered
  //     chopstick first. For P1 lower = c0 (already held by P0) → P1 blocked.
  //     For P2 lower = c1 (free) → reaches and gets it.
  //     For P3 lower = c2 (free) → gets it.
  //     For P4 lower = c3 (free) → gets it.
  // So at this stage: c0 held by P0; c1 by P2; c2 by P3; c3 by P4.
  // c4 is free (P0 wanted c0 first; P1 is blocked waiting for c0; P4
  // wanted c3 first and got it, now wants c4). So P0 grabs c4 (its
  // higher number, second pick) over t=2.5..3.2 — succeeds. P0 eats
  // t=3.5..5.5. Then releases both at t=5.7..6.3, after which P4 can
  // proceed. The whole cascade unblocks.
  //
  // For visual clarity we just show through the moment P0 eats and one
  // arrow pointing at "this link no longer closes the cycle."

  const reach1Frac = clamp((localTime - 1.0) / 0.7, 0, 1); // P0 → c0
  const reach2Frac = clamp((localTime - 2.5) / 0.7, 0, 1); // P0 → c4 (after c4 is free in our story)

  // Other philosophers' first picks
  const otherReachFrac = clamp((localTime - 1.0) / 0.7, 0, 1);
  // P1 is the blocked one (wanting c0, already held by P0) — it stays at 0.55
  const p1BlockedFrac = clamp((localTime - 1.6) / 0.6, 0, 1) * 0.55;

  // Holdings (booleans)
  const c0Held = reach1Frac >= 0.95;
  const c4Held = reach2Frac >= 0.95;
  const c1Held = otherReachFrac >= 0.95;  // P2 holds c1
  const c2Held = otherReachFrac >= 0.95;  // P3 holds c2
  const c3Held = otherReachFrac >= 0.95;  // P4 holds c3

  // Eating
  const p0Eating = c0Held && c4Held && localTime > 3.5 && localTime < 5.5;

  // Highlight ring on P0
  const fixTagOp = clamp((localTime - 0.5) / 0.6, 0, 1) * clamp((6.5 - localTime) / 0.6, 0, 1);

  // For each philosopher i (1..4), draw their first-pick arm.
  // Pi's lower-numbered chopstick:
  //   P1: c0
  //   P2: c1
  //   P3: c2
  //   P4: c3
  const otherFirstPick = [null, 0, 1, 2, 3];

  return (
    <div style={{ position: 'absolute', left: '50%', top: '54%', transform: 'translate(-50%, -50%)' }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 12}
            letterSpacing="0.18em">
            BREAK ONE — LOWER-NUMBERED CHOPSTICK FIRST
          </text>
        </SvgFadeIn>

        {/* Table */}
        <circle cx={G.cx} cy={G.cy} r={(G.philR + G.chopR) / 2 - 6}
          fill="var(--chalk-200)" fillOpacity={0.025}
          stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 6"/>

        {/* Chopsticks */}
        {Array.from({ length: N }).map((_, i) => {
          const c = chopXY(G, i);
          const locked = (i === 0 && c0Held) || (i === 1 && c1Held) ||
                         (i === 2 && c2Held) || (i === 3 && c3Held) ||
                         (i === 4 && c4Held);
          // Mini number label
          return (
            <g key={i}>
              <Chopstick x={c.x} y={c.y} locked={locked}/>
              <text x={c.x} y={c.y - 12}
                textAnchor="middle"
                fill="var(--chalk-300)"
                fontFamily="var(--font-mono)" fontSize={10}
                letterSpacing="0.10em">
                {i}
              </text>
            </g>
          );
        })}

        {/* P0's two arms in the new order */}
        {(() => {
          const p = philXY(G, 0);
          const c0 = chopXY(G, 0);          // right first (lower number)
          const c4 = chopXY(G, 4);          // left second
          return (
            <g>
              <Arm p={p} c={c0} frac={reach1Frac} color="var(--teal-400)"/>
              <Arm p={p} c={c4} frac={reach2Frac} color="var(--teal-400)"/>
            </g>
          );
        })()}

        {/* Other philosophers' first picks */}
        {[1, 2, 3, 4].map(i => {
          const p = philXY(G, i);
          const cIdx = otherFirstPick[i];
          const c = chopXY(G, cIdx);
          const frac = i === 1 ? p1BlockedFrac : otherReachFrac;
          const blocked = i === 1;
          return (
            <Arm key={i} p={p} c={c} frac={frac}
              color={blocked ? 'var(--rose-400)' : 'var(--amber-400)'}
              dashed={blocked}/>
          );
        })}

        {/* Philosophers */}
        {Array.from({ length: N }).map((_, i) => {
          const p = philXY(G, i);
          let state = 'thinking';
          if (i === 0) state = p0Eating ? 'eating' : (c0Held || reach1Frac > 0 ? 'holding' : 'reaching');
          else if (i === 1) state = 'blocked';
          else state = otherReachFrac > 0.95 ? 'holding' : 'reaching';
          return <Philosopher key={i} x={p.x} y={p.y} label={`P${i}`} size={G.philSize} state={state}/>;
        })}

        {/* "this link breaks the cycle" callout near P0 — text is
            offset to the left so it doesn't collide with the eyebrow
            sitting directly above P0 (which lives at the top of the
            circle). */}
        {fixTagOp > 0 && (() => {
          const p = philXY(G, 0);
          // Anchor the label outside the table circle on the right,
          // so it can never tangle with the eyebrow row at the top.
          const labelOffset = G.philSize / 2 + 24;
          return (
            <g opacity={fixTagOp}>
              <circle cx={p.x} cy={p.y} r={G.philSize / 2 + 8}
                fill="none" stroke="var(--teal-400)" strokeWidth={1.4}
                strokeDasharray="3 3"/>
              <line
                x1={p.x + G.philSize / 2 + 4} y1={p.y}
                x2={p.x + labelOffset - 4} y2={p.y}
                stroke="var(--teal-400)" strokeWidth={1}
                strokeDasharray="2 3" opacity={0.6}/>
              <text x={p.x + labelOffset} y={p.y + 4}
                textAnchor="start"
                fill="var(--teal-400)"
                fontFamily="var(--font-mono)" fontSize={10}
                letterSpacing="0.16em">
                CYCLE BREAKS HERE
              </text>
            </g>
          );
        })()}

        {/* Caption — only renders if there is vertical room */}
        <SvgFadeIn duration={0.5} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 15 : 17}>
            asymmetric pickup order → no circular wait
          </text>
        </SvgFadeIn>
      </svg>
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
