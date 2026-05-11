// Process States: Running, Ready, Blocked — Manimo lesson scene.
// Every process is always in exactly one of three states. The scheduler
// moves processes between RUNNING and READY; I/O moves them between
// RUNNING and BLOCKED (with the return path going through READY).
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/process-states/):
//    0.00– 8.76  Manimo intro: where is your program right now?
//    8.76–18.24  Three labelled state boxes; thread token sits in RUNNING
//   18.24–28.99  Scheduler transitions: RUNNING ↔ READY (timeslice expiry)
//   28.99–45.25  I/O transitions: RUNNING → BLOCKED → READY (not RUNNING)
//   45.25–59.00  Takeaway: three states, two drivers of motion
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beats 3 and 4 carry the genuine motion — labelled thread tokens
//     traverse arrow-paths between state boxes in sync with narration.
//   • Token motion follows a two-segment path (corner) for the
//     non-adjacent transitions (BLOCKED → READY).

const SCENE_DURATION = 59;

const NARRATION = [
  /*  0.00– 8.76 */ 'Where is your program right this second — on the CPU, waiting in line, or stuck on a disk read?',
  /*  8.76–18.24 */ 'RUNNING — currently on the CPU. READY — eligible to run, but the CPU is busy. BLOCKED — waiting on something else, like a disk to finish.',
  /* 18.24–28.99 */ "When the scheduler's time slice expires, the running process is descheduled to ready, and a ready process is scheduled to running.",
  /* 28.99–45.25 */ 'If the running process asks for I/O, it leaves the CPU and enters the blocked state. When the disk finishes, the process moves back to ready, eligible to run again.',
  /* 45.25–59.00 */ "Three states — running, ready, blocked. Two drivers of motion — the scheduler and the I/O subsystem. That's how every process moves through the OS.",
];

const NARRATION_AUDIO = 'audio/process-states/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="process lifecycle"
      title="Process States: Running, Ready, Blocked"
      duration={SCENE_DURATION}
      introEnd={8.76}
      introCaption="Every process lives in one of three states."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.76} end={18.24}>
        <ThreeBoxesBeat />
      </Sprite>

      <Sprite start={18.24} end={28.99}>
        <SchedulerBeat />
      </Sprite>

      <Sprite start={28.99} end={45.25}>
        <BlockedBeat />
      </Sprite>

      <Sprite start={45.25} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared geometry ──────────────────────────────────────────────────────
// Three state boxes laid out:
//   landscape:   READY ──── RUNNING ──── BLOCKED  (one row, left → right)
//   portrait:        READY              RUNNING                BLOCKED
//                    stacked vertically (top → bottom)
function stateGeom(portrait) {
  if (portrait) {
    return {
      vbW: 600, vbH: 620,
      boxW: 320, boxH: 130,
      readyX: 140, readyY: 60,
      runX: 140, runY: 240,
      blockedX: 140, blockedY: 420,
      // Token centres — placed in the LOWER half of each box so they
      // never overlap the STATE eyebrow + title at the top.
      readyCx: 300, readyCy: 155,
      runCx: 300, runCy: 335,
      blockedCx: 300, blockedCy: 515,
      tokenR: 22, captionY: 590,
      labelFont: 13, stateFont: 22, eyebrowFont: 10,
    };
  }
  return {
    vbW: 1180, vbH: 380,
    boxW: 280, boxH: 150,
    readyX: 40, readyY: 100,
    runX: 450, runY: 100,
    blockedX: 860, blockedY: 100,
    readyCx: 180, readyCy: 195,
    runCx: 590, runCy: 195,
    blockedCx: 1000, blockedCy: 195,
    tokenR: 22, captionY: 340,
    labelFont: 13, stateFont: 22, eyebrowFont: 11,
  };
}

// One state box. `accent` is the box's outline colour. `active` brightens
// the fill so the viewer's eye lands there when a token sits inside.
// The eyebrow + title sit in the TOP half so the bottom half stays clear
// for a thread token to drop in without colliding with text.
function StateBox({ G, x, y, label, sub, accent, active }) {
  return (
    <g>
      <rect x={x} y={y} width={G.boxW} height={G.boxH} rx={12}
        fill={active ? 'rgba(244,184,96,0.10)' : 'rgba(232,220,193,0.04)'}
        stroke={accent} strokeWidth={1.6}/>
      <text x={x + G.boxW / 2} y={y + 22}
        textAnchor="middle"
        fill={accent}
        fontFamily="var(--font-mono)" fontSize={G.eyebrowFont}
        letterSpacing="0.20em">
        STATE
      </text>
      <text x={x + G.boxW / 2} y={y + 48}
        textAnchor="middle"
        fill="var(--chalk-100)"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={G.stateFont}>
        {label}
      </text>
      <text x={x + G.boxW / 2} y={y + 68}
        textAnchor="middle"
        fill="var(--chalk-300)"
        fontFamily="var(--font-sans)" fontSize={G.labelFont - 1}
        letterSpacing="0.02em">
        {sub}
      </text>
    </g>
  );
}

// Thread token — a labelled circle. (cx, cy) is its current centre.
function Token({ G, cx, cy, label, color, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      <circle cx={cx} cy={cy} r={G.tokenR}
        fill={color} opacity={0.94}/>
      <text x={cx} y={cy + 5} textAnchor="middle"
        fill="var(--bg-canvas)"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={15} fontWeight={500}>
        {label}
      </text>
    </g>
  );
}

// Draw a labelled arrow between two centres. Renders only after `delay`.
// `bend` lets us route around the centre box for far-apart transitions.
function ArrowEdge({ x1, y1, x2, y2, color, label, labelOffset = 18, delay = 0, headScale = 1 }) {
  const dx = x2 - x1, dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // Shorten by 4px on each end so the arrow doesn't poke into the boxes.
  const sx = x1 + ux * 4, sy = y1 + uy * 4;
  const ex = x2 - ux * 4, ey = y2 - uy * 4;
  // Head — headScale lets long routed arrows bump up the head so it
  // still reads at the canvas edge.
  const headBack = 9 * headScale, headSide = 5 * headScale;
  const px = -uy, py = ux;
  const baseX = ex - ux * headBack;
  const baseY = ey - uy * headBack;
  return (
    <>
      <TraceIn d={`M ${sx} ${sy} L ${ex} ${ey}`}
        stroke={color} strokeWidth={1.8}
        duration={0.5} delay={delay}/>
      <SvgFadeIn duration={0.3} delay={delay + 0.4}>
        <polygon
          points={`${ex},${ey} ${baseX + px * headSide},${baseY + py * headSide} ${baseX - px * headSide},${baseY - py * headSide}`}
          fill={color}/>
        <text
          x={(sx + ex) / 2 + px * labelOffset}
          y={(sy + ey) / 2 + py * labelOffset}
          textAnchor="middle"
          fill={color}
          fontFamily="var(--font-mono)" fontSize={10}
          letterSpacing="0.16em">
          {label.toUpperCase()}
        </text>
      </SvgFadeIn>
    </>
  );
}

// Linearly animate a token along a multi-segment polyline.
// `segments` is an array of {cx, cy} waypoints; the token starts at
// segments[0] and ends at the last, with k ∈ [0,1] interpolating
// across total path length.
function pointAlongPolyline(segments, k) {
  if (k <= 0) return { cx: segments[0].cx, cy: segments[0].cy };
  if (k >= 1) return { cx: segments[segments.length - 1].cx,
                       cy: segments[segments.length - 1].cy };
  // Lengths
  const lens = [];
  let total = 0;
  for (let i = 1; i < segments.length; i++) {
    const dx = segments[i].cx - segments[i - 1].cx;
    const dy = segments[i].cy - segments[i - 1].cy;
    const L = Math.hypot(dx, dy);
    lens.push(L);
    total += L;
  }
  let target = k * total;
  for (let i = 0; i < lens.length; i++) {
    if (target <= lens[i]) {
      const f = lens[i] === 0 ? 0 : target / lens[i];
      return {
        cx: segments[i].cx + (segments[i + 1].cx - segments[i].cx) * f,
        cy: segments[i].cy + (segments[i + 1].cy - segments[i].cy) * f,
      };
    }
    target -= lens[i];
  }
  return { cx: segments[segments.length - 1].cx, cy: segments[segments.length - 1].cy };
}

// ─── Beat 2: Three boxes, token sits in RUNNING ───────────────────────────
function ThreeBoxesBeat() {
  const portrait = usePortrait();
  const G = stateGeom(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.5} delay={0.3}>
          <StateBox G={G} x={G.runX} y={G.runY}
            label="RUNNING" sub="on the CPU"
            accent="var(--amber-400)" active={true}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={0.9}>
          <StateBox G={G} x={G.readyX} y={G.readyY}
            label="READY" sub="waiting for the CPU"
            accent="var(--chalk-200)" active={false}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.5} delay={1.6}>
          <StateBox G={G} x={G.blockedX} y={G.blockedY}
            label="BLOCKED" sub="waiting on I/O"
            accent="var(--rose-400)" active={false}/>
        </SvgFadeIn>

        {/* Token sits in RUNNING */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <Token G={G} cx={G.runCx} cy={G.runCy}
            label="P1" color="var(--amber-400)"/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
            letterSpacing="0.02em">
            the OS bookkeeps every process by this label
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Scheduler — RUNNING ↔ READY ──────────────────────────────────
// P1 leaves RUNNING → READY (deschedule). P2 in READY rises to RUNNING.
function SchedulerBeat() {
  const portrait = usePortrait();
  const G = stateGeom(portrait);
  const { localTime } = useSprite();

  // Timeline:
  //   t = 0.4 — both arrows fade in (running↔ready)
  //   t = 2.0..3.6 — P1 slides RUNNING → READY
  //   t = 3.6..5.4 — settle / pause
  //   t = 4.5..6.0 — P2 slides READY → RUNNING
  const P1_START = 2.0, P1_END = 3.6;
  const P2_START = 4.5, P2_END = 6.0;

  // P1: token at runCx,runCy → readyCx,readyCy (or further down in portrait)
  let p1 = { cx: G.runCx, cy: G.runCy };
  let p1Color = 'var(--amber-400)';
  if (localTime >= P1_START) {
    const k = clamp((localTime - P1_START) / (P1_END - P1_START), 0, 1);
    const e = Easing.easeOutCubic(k);
    p1.cx = G.runCx + (G.readyCx - G.runCx) * e;
    p1.cy = G.runCy + (G.readyCy - G.runCy) * e;
    p1Color = k > 0.5 ? 'var(--chalk-100)' : 'var(--amber-400)';
  }

  // P2: appears in READY at t = 1.5, sits there until P2_START, then moves.
  let p2 = { cx: G.readyCx, cy: G.readyCy };
  let p2Color = 'var(--chalk-100)';
  let p2Visible = localTime >= 1.5;
  if (localTime >= P2_START) {
    const k = clamp((localTime - P2_START) / (P2_END - P2_START), 0, 1);
    const e = Easing.easeOutCubic(k);
    p2.cx = G.readyCx + (G.runCx - G.readyCx) * e;
    p2.cy = G.readyCy + (G.runCy - G.readyCy) * e;
    p2Color = k > 0.5 ? 'var(--amber-400)' : 'var(--chalk-100)';
  }

  // P2 starting slot offset so the two tokens in READY don't overlap.
  // Once P1 also lands in READY, P2 should already have left for RUNNING.
  // Until that point, draw P2 at a slight offset so both fit visually.
  const p2InReadyAndNotMoving = localTime < P2_START;
  if (p2InReadyAndNotMoving) {
    p2.cx = G.readyCx + (portrait ? 32 : 32);
  }

  // Run-box is "active" if a token is currently inside RUNNING (animated).
  // Approximation: active if either P2 has moved to RUNNING, or P1 hasn't
  // left yet.
  const runActive = localTime < P1_START + 0.2 || localTime >= P2_END - 0.4;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <StateBox G={G} x={G.runX} y={G.runY}
          label="RUNNING" sub="on the CPU"
          accent="var(--amber-400)" active={runActive}/>
        <StateBox G={G} x={G.readyX} y={G.readyY}
          label="READY" sub="waiting for the CPU"
          accent="var(--chalk-200)" active={!runActive}/>
        <StateBox G={G} x={G.blockedX} y={G.blockedY}
          label="BLOCKED" sub="waiting on I/O"
          accent="var(--rose-400)" active={false}/>

        {/* Arrows: RUNNING → READY (descheduled), READY → RUNNING (scheduled).
            Geometry differs portrait vs landscape so they hug the boxes. */}
        {portrait ? (
          <>
            {/* RUNNING (centre) → READY (top): drawn on the LEFT side */}
            <ArrowEdge
              x1={G.runCx - 80} y1={G.runY}
              x2={G.readyCx - 80} y2={G.readyY + G.boxH}
              color="var(--amber-300)"
              label="descheduled"
              labelOffset={-26}
              delay={0.4}/>
            {/* READY (top) → RUNNING (centre): drawn on the RIGHT side */}
            <ArrowEdge
              x1={G.readyCx + 80} y1={G.readyY + G.boxH}
              x2={G.runCx + 80} y2={G.runY}
              color="var(--amber-300)"
              label="scheduled"
              labelOffset={26}
              delay={0.4}/>
          </>
        ) : (
          <>
            {/* READY → RUNNING: top edge */}
            <ArrowEdge
              x1={G.readyX + G.boxW} y1={G.readyCy - 18}
              x2={G.runX} y2={G.runCy - 18}
              color="var(--amber-300)"
              label="scheduled"
              labelOffset={-16}
              delay={0.4}/>
            {/* RUNNING → READY: bottom edge */}
            <ArrowEdge
              x1={G.runX} y1={G.runCy + 18}
              x2={G.readyX + G.boxW} y2={G.readyCy + 18}
              color="var(--amber-300)"
              label="descheduled"
              labelOffset={18}
              delay={0.4}/>
          </>
        )}

        {/* Tokens */}
        {p2Visible && (
          <Token G={G} cx={p2.cx} cy={p2.cy} label="P2" color={p2Color}/>
        )}
        <Token G={G} cx={p1.cx} cy={p1.cy} label="P1" color={p1Color}/>

        <SvgFadeIn duration={0.5} delay={8.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
            letterSpacing="0.02em">
            the scheduler picks who runs next
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: I/O — RUNNING → BLOCKED → READY ──────────────────────────────
// P2 makes an I/O request: slides RUNNING → BLOCKED. After the I/O
// completes, the token slides BLOCKED → READY (not directly back to
// RUNNING).
function BlockedBeat() {
  const portrait = usePortrait();
  const G = stateGeom(portrait);
  const { localTime } = useSprite();

  // Timeline:
  //   t = 0.4 — I/O arrows fade in
  //   t = 2.4..4.0 — P2 slides RUNNING → BLOCKED
  //   t = 4.0..6.5 — sits in BLOCKED (waiting on disk; show a soft pulse)
  //   t = 6.5..8.4 — slides BLOCKED → READY (corner path: through midpoint)
  const TO_BLOCK_START = 2.4, TO_BLOCK_END = 4.0;
  const TO_READY_START = 6.5, TO_READY_END = 8.4;

  // Path RUNNING → BLOCKED (straight line)
  // Path BLOCKED → READY: in landscape, goes BLOCKED → (down-and-left)
  // along the bottom of the canvas; in portrait, goes straight up but
  // diverted to the LEFT side so it doesn't pass through RUNNING.
  const readyDetour = portrait
    ? { cx: G.readyCx - 200, cy: (G.readyCy + G.blockedCy) / 2 }
    : { cx: (G.readyCx + G.blockedCx) / 2, cy: G.runCy + 180 };

  let token = { cx: G.runCx, cy: G.runCy };
  let color = 'var(--amber-400)';
  if (localTime >= TO_BLOCK_START && localTime < TO_BLOCK_END) {
    const k = (localTime - TO_BLOCK_START) / (TO_BLOCK_END - TO_BLOCK_START);
    const e = Easing.easeOutCubic(k);
    token.cx = G.runCx + (G.blockedCx - G.runCx) * e;
    token.cy = G.runCy + (G.blockedCy - G.runCy) * e;
    color = k > 0.5 ? 'var(--rose-400)' : 'var(--amber-400)';
  } else if (localTime >= TO_BLOCK_END && localTime < TO_READY_START) {
    token = { cx: G.blockedCx, cy: G.blockedCy };
    // Subtle waiting pulse — slight horizontal sway.
    const phase = Math.sin((localTime - TO_BLOCK_END) * 2.4);
    token.cx += phase * 3;
    color = 'var(--rose-400)';
  } else if (localTime >= TO_READY_START && localTime < TO_READY_END) {
    const k = (localTime - TO_READY_START) / (TO_READY_END - TO_READY_START);
    const e = Easing.easeInOutCubic(k);
    const p = pointAlongPolyline(
      [{ cx: G.blockedCx, cy: G.blockedCy }, readyDetour,
       { cx: G.readyCx, cy: G.readyCy }],
      e,
    );
    token = p;
    color = e > 0.5 ? 'var(--chalk-100)' : 'var(--rose-400)';
  } else if (localTime >= TO_READY_END) {
    token = { cx: G.readyCx, cy: G.readyCy };
    color = 'var(--chalk-100)';
  }

  // State activations: which box "lights up" follows where P2 is.
  const inRun = localTime < TO_BLOCK_START + 0.4;
  const inBlocked = localTime >= TO_BLOCK_END - 0.2 && localTime < TO_READY_START + 0.2;
  const inReady = localTime >= TO_READY_END - 0.2;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <StateBox G={G} x={G.runX} y={G.runY}
          label="RUNNING" sub="on the CPU"
          accent="var(--amber-400)" active={inRun}/>
        <StateBox G={G} x={G.readyX} y={G.readyY}
          label="READY" sub="waiting for the CPU"
          accent="var(--chalk-200)" active={inReady}/>
        <StateBox G={G} x={G.blockedX} y={G.blockedY}
          label="BLOCKED" sub="waiting on I/O"
          accent="var(--rose-400)" active={inBlocked}/>

        {/* RUNNING → BLOCKED (I/O: initiate). No reverse arrow — when I/O
            completes, the process re-enters READY, never RUNNING directly. */}
        {portrait ? (
          <ArrowEdge
            x1={G.runCx} y1={G.runY + G.boxH}
            x2={G.blockedCx} y2={G.blockedY}
            color="var(--rose-300)"
            label="I/O: initiate"
            labelOffset={-22}
            delay={0.4}/>
        ) : (
          <ArrowEdge
            x1={G.runX + G.boxW} y1={G.runCy - 18}
            x2={G.blockedX} y2={G.blockedCy - 18}
            color="var(--rose-300)"
            label="I/O: initiate"
            labelOffset={-16}
            delay={0.4}/>
        )}

        {/* BLOCKED → READY (I/O: done). The key insight: completed I/O
            sends you to ready, not straight back to the CPU. */}
        {portrait ? (
          // Route well outside the box column (boxes span x=140..460).
          // headScale bumps the triangle so it reads at READY's left edge
          // rather than appearing tiny next to the long vertical arrow.
          <ArrowEdge
            x1={G.blockedX - 24} y1={G.blockedY + G.boxH / 2}
            x2={G.readyX - 24} y2={G.readyY + G.boxH / 2}
            color="var(--amber-300)"
            label="I/O: done → ready"
            labelOffset={-32}
            delay={1.0}
            headScale={1.7}/>
        ) : (
          <ArrowEdge
            x1={G.blockedX + G.boxW / 2} y1={G.blockedY + G.boxH}
            x2={G.readyX + G.boxW / 2} y2={G.readyY + G.boxH}
            color="var(--amber-300)"
            label="I/O: done → ready"
            labelOffset={20}
            delay={1.0}/>
        )}

        <Token G={G} cx={token.cx} cy={token.cy} label="P2" color={color}/>

        <SvgFadeIn duration={0.5} delay={10.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            I/O completion sends you back to ready — not straight to the CPU
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
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 30 : 38, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
        }}>
        running · ready · blocked
      </FadeUp>

      <FadeUp duration={0.5} delay={1.8} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-200)',
          maxWidth: portrait ? '24ch' : '40ch',
          lineHeight: 1.4, textAlign: 'center',
        }}>
        Two drivers of motion — the scheduler and the I/O subsystem.
      </FadeUp>

      <FadeUp duration={0.45} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          marginTop: 10,
        }}>
        every process — every transition — fits this map
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
