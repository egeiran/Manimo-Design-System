// Producer–Consumer with Condition Variables — Manimo lesson scene.
// A bounded buffer fills and drains as a producer thread and a consumer
// thread cooperate; the condition variables are how they wait without
// busy-spinning.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/producer-consumer/):
//    0.00– 6.72  Manimo intro: one fills, one empties
//    6.72–15.80  The buffer: tokens flow in (producer) and out (consumer)
//   15.80–24.51  Full: producer holds a token, parks itself on the not-full CV
//   24.51–33.40  Signal: consumer takes, signals, producer wakes and drops
//   33.40–44.00  Takeaway: two waits, two signals, no spin
//
// Genuine animation:
//   • Beat 2 — a sequence of tokens slides into successive slots on a
//     timeline; one then slides out the consumer side. Slot-fill state is
//     driven by sprite localTime, not pure FadeUp.
//   • Beat 4 — the consumer's "take" pulls a token from the buffer to
//     the right while a signal arrow shoots back to the producer; the
//     producer's held token then slides into the freed slot.

const SCENE_DURATION = 43;

const NARRATION = [
  /*  0.00– 6.72 */ 'A producer is filling a small buffer. A consumer is draining it. What happens when one runs ahead of the other?',
  /*  6.72–15.80 */ 'The shared buffer holds at most four items. The producer puts items in; the consumer takes them out. Both run as their own threads.',
  /* 15.80–24.51 */ 'Now the producer wants to add a fifth item. The buffer is full — there is nowhere to put it. So the producer waits on the not-full condition.',
  /* 24.51–33.40 */ 'The consumer takes an item, freeing a slot — and signals the not-full condition. The producer wakes up, drops its item in, and life goes on.',
  /* 33.40–44.00 */ 'Two conditions, two waits, two signals — the buffer fills, drains, fills again, and neither thread ever has to spin checking a flag.',
];

const NARRATION_AUDIO = 'audio/producer-consumer/scene.mp3';

const BUF_CAPACITY = 4;

function Scene() {
  return (
    <SceneChrome
      eyebrow="condition variables"
      title="Producer–Consumer"
      duration={SCENE_DURATION}
      introEnd={6.75}
      introCaption="One fills, one empties — when do they wait?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.75} end={15.78}>
        <BufferIntro />
      </Sprite>

      <Sprite start={15.78} end={24.17}>
        <FullWait />
      </Sprite>

      <Sprite start={24.17} end={33.11}>
        <SignalAndWake />
      </Sprite>

      <Sprite start={33.11} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// Layout constants shared by the buffer beats. All coordinates are inside
// the scene's local viewBox so portrait / landscape can just swap a G.
function bufGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 480,
        slotW: 70, slotH: 70, slotGap: 10, slotY: 220,
        prodX: 80, prodY: 220, consX: 520, consY: 220,
        threadLabelDy: -90, codeY: 360, eyebrowY: 50, captionY: 440,
        tokenR: 18, threadFontSize: 14, codeFontSize: 13 }
    : { vbW: 1080, vbH: 380,
        slotW: 90, slotH: 90, slotGap: 14, slotY: 160,
        prodX: 120, prodY: 160, consX: 880, consY: 160,
        threadLabelDy: -32, codeY: 310, eyebrowY: 40, captionY: 350,
        tokenR: 22, threadFontSize: 15, codeFontSize: 14 };
}

function slotX(G, i) {
  const totalW = BUF_CAPACITY * G.slotW + (BUF_CAPACITY - 1) * G.slotGap;
  const startX = (G.vbW - totalW) / 2;
  return startX + i * (G.slotW + G.slotGap);
}

function Slot({ G, i, filled }) {
  const x = slotX(G, i);
  return (
    <g>
      <rect x={x} y={G.slotY} width={G.slotW} height={G.slotH} rx={10}
        fill={filled ? 'rgba(244,184,96,0.16)' : 'rgba(232,220,193,0.04)'}
        stroke={filled ? 'var(--amber-400)' : 'var(--chalk-300)'}
        strokeWidth={1.4}/>
      {filled && (
        <circle cx={x + G.slotW / 2} cy={G.slotY + G.slotH / 2}
          r={G.tokenR}
          fill="var(--amber-400)" opacity={0.92}/>
      )}
    </g>
  );
}

function ThreadLabel({ G, x, y, label, accent }) {
  return (
    <g>
      <text x={x} y={y + G.threadLabelDy}
        textAnchor="middle"
        fill={accent}
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.16em">
        THREAD
      </text>
      <text x={x} y={y + G.threadLabelDy + 22}
        textAnchor="middle"
        fill="var(--chalk-100)"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={G.threadFontSize + 4}>
        {label}
      </text>
    </g>
  );
}

// ─── Beat 2: Buffer intro — fill 4, then drain 1 ─────────────────────────
function BufferIntro() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = bufGeom(portrait);

  // Filling schedule: token i lands in slot i at time fillTs[i]. Last
  // event drains slot 0 at drainT.
  const fillTs = [1.5, 2.4, 3.3, 4.2];
  const drainT = 5.6;

  // Number filled (4 items) and whether slot 0 has drained.
  let filled = 0;
  for (let i = 0; i < BUF_CAPACITY; i++) {
    if (localTime >= fillTs[i]) filled = i + 1;
  }
  const slot0Drained = localTime >= drainT;

  // Slot state: true if currently holding a token.
  const slotHas = [
    !slot0Drained && filled >= 1,
    filled >= 2,
    filled >= 3,
    filled >= 4,
  ];

  // In-flight token positions (animate from prod → slot, or slot → cons).
  const TOKEN_DUR = 0.6;
  const inFlight = [];

  // Producer tokens 0..3: each animates from prodX to slotX(i) over its
  // arrival window.
  for (let i = 0; i < BUF_CAPACITY; i++) {
    const t0 = fillTs[i] - TOKEN_DUR;
    const t1 = fillTs[i];
    if (localTime > t0 && localTime < t1) {
      const k = (localTime - t0) / (t1 - t0);
      const eased = Easing.easeOutCubic(k);
      const x0 = G.prodX, x1 = slotX(G, i) + G.slotW / 2;
      inFlight.push({
        cx: x0 + (x1 - x0) * eased,
        cy: G.slotY + G.slotH / 2,
        color: 'var(--amber-400)',
      });
    }
  }
  // Consumer drain: token leaves slot 0 toward consX.
  if (localTime > drainT && localTime < drainT + TOKEN_DUR) {
    const k = (localTime - drainT) / TOKEN_DUR;
    const eased = Easing.easeOutCubic(k);
    const x0 = slotX(G, 0) + G.slotW / 2;
    const x1 = G.consX;
    inFlight.push({
      cx: x0 + (x1 - x0) * eased,
      cy: G.slotY + G.slotH / 2,
      color: 'var(--teal-400)',
    });
  }

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
            SHARED BOUNDED BUFFER · CAPACITY 4
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.3}>
          {Array.from({ length: BUF_CAPACITY }).map((_, i) => (
            <Slot key={i} G={G} i={i} filled={slotHas[i]}/>
          ))}
        </SvgFadeIn>

        {/* Producer + Consumer labels */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <ThreadLabel G={G} x={G.prodX} y={G.prodY} label="Producer" accent="var(--amber-300)"/>
          <ThreadLabel G={G} x={G.consX} y={G.consY} label="Consumer" accent="var(--teal-400)"/>
        </SvgFadeIn>

        {/* In-flight token(s) */}
        {inFlight.map((t, i) => (
          <circle key={i} cx={t.cx} cy={t.cy} r={G.tokenR}
            fill={t.color} opacity={0.95}/>
        ))}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={6.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            tokens flow in from the producer, out to the consumer
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Buffer full → producer waits ────────────────────────────────
function FullWait() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = bufGeom(portrait);

  // All four slots full from the start.
  const slotHas = [true, true, true, true];

  // Producer holds a fifth token at prodX; it tries to advance toward the
  // buffer but bounces off. Use a damped oscillation toward the buffer's
  // edge for the first ~1.5s, then settles in place with a soft pulse to
  // sell "waiting".
  const TRY_START = 0.6;
  const TRY_END = 2.0;
  let tokenX = G.prodX + 32;
  const bufferLeftX = slotX(G, 0) - 14;
  if (localTime > TRY_START) {
    const k = clamp((localTime - TRY_START) / (TRY_END - TRY_START), 0, 1);
    const pushed = G.prodX + 32 + (bufferLeftX - (G.prodX + 32)) * Easing.easeOutCubic(k) * 0.45;
    tokenX = pushed;
  }
  // Bounce back once tried.
  if (localTime > TRY_END) {
    const k = clamp((localTime - TRY_END) / 0.8, 0, 1);
    const settled = G.prodX + 56;
    const bounceFrom = G.prodX + 32 + (bufferLeftX - (G.prodX + 32)) * 0.45;
    tokenX = bounceFrom + (settled - bounceFrom) * Easing.easeOutCubic(k);
  }
  // "Waiting" pulse: token tinted rose, fades between two opacities.
  const waiting = localTime > TRY_END + 0.8;
  const pulse = 0.7 + 0.3 * Math.sin(localTime * 2.4);
  const tokenOp = waiting ? 0.5 + 0.4 * pulse : 0.95;
  const tokenColor = waiting ? 'var(--rose-400)' : 'var(--amber-400)';

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            BUFFER FULL · 4 / 4
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.2}>
          {Array.from({ length: BUF_CAPACITY }).map((_, i) => (
            <Slot key={i} G={G} i={i} filled={slotHas[i]}/>
          ))}
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={0.2}>
          <ThreadLabel G={G} x={G.prodX} y={G.prodY} label="Producer" accent="var(--rose-300)"/>
          <ThreadLabel G={G} x={G.consX} y={G.consY} label="Consumer" accent="var(--chalk-300)"/>
        </SvgFadeIn>

        {/* The producer's held / parked fifth token */}
        <circle cx={tokenX} cy={G.slotY + G.slotH / 2} r={G.tokenR}
          fill={tokenColor} opacity={tokenOp}/>

        {/* Once parked, a small "wait" badge under the producer */}
        {waiting && (
          <SvgFadeIn duration={0.3} delay={0}>
            <text x={G.prodX} y={G.slotY + G.slotH + 30}
              textAnchor="middle"
              fill="var(--rose-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.22em">
              WAITING
            </text>
          </SvgFadeIn>
        )}

        {/* Code snippet */}
        <SvgFadeIn duration={0.5} delay={1.8}>
          <text x={G.vbW / 2} y={G.codeY}
            textAnchor="middle"
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={G.codeFontSize + 2}
            letterSpacing="0.04em">
            while (count == MAX) wait(notFull)
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            the producer parks itself — no busy wait, no spin
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Consumer takes → signals → producer wakes ───────────────────
function SignalAndWake() {
  const portrait = usePortrait();
  const { localTime } = useSprite();
  const G = bufGeom(portrait);

  // Timeline of events in this beat:
  //   0.3 — buffer shown full + producer parked
  //   1.0 — consumer pulls front (slot 0) — token slides right to consX
  //   2.0 — signal arrow shoots back from consumer to producer
  //   3.0 — producer wakes; held token slides into now-empty slot 0
  //   4.5 — buffer back to full (parked badge gone)

  const TAKE_START = 1.0;
  const TAKE_END = 2.0;
  const SIGNAL_START = 2.0;
  const SIGNAL_END = 2.7;
  const WAKE_START = 3.0;
  const WAKE_END = 4.2;

  const takeProg = clamp((localTime - TAKE_START) / (TAKE_END - TAKE_START), 0, 1);
  const wakeProg = clamp((localTime - WAKE_START) / (WAKE_END - WAKE_START), 0, 1);
  const signalProg = clamp((localTime - SIGNAL_START) / (SIGNAL_END - SIGNAL_START), 0, 1);

  // Slot 0 logic:
  //   • starts filled
  //   • during TAKE, the token has visually moved out (we draw it
  //     separately) — keep slot 0 marked empty if take has begun
  //   • after WAKE_END, slot 0 fills again from the producer's held token
  const slot0Has = !(localTime > TAKE_START && localTime < WAKE_END);
  const slotHas = [slot0Has, true, true, true];

  // Consumer-bound flying token (during TAKE).
  let consumerToken = null;
  if (localTime > TAKE_START && localTime < TAKE_END + 0.4) {
    const k = clamp((localTime - TAKE_START) / (TAKE_END - TAKE_START), 0, 1);
    const e = Easing.easeOutCubic(k);
    const x0 = slotX(G, 0) + G.slotW / 2;
    const x1 = G.consX;
    consumerToken = { cx: x0 + (x1 - x0) * e, cy: G.slotY + G.slotH / 2,
                      op: k >= 1 ? Math.max(0, 1 - (localTime - TAKE_END) / 0.4) : 1 };
  }

  // Producer's held token: parks at prodX + 56 until wake, then animates
  // into slot 0.
  let producerTokenX = G.prodX + 56;
  let producerTokenOp = 0.85;
  let producerTokenColor = 'var(--rose-400)';
  if (localTime > WAKE_START) {
    const e = Easing.easeOutCubic(wakeProg);
    const x0 = G.prodX + 56;
    const x1 = slotX(G, 0) + G.slotW / 2;
    producerTokenX = x0 + (x1 - x0) * e;
    producerTokenColor = 'var(--amber-400)';
    producerTokenOp = wakeProg >= 1 ? 0 : 0.95;  // merges into slot 0
  } else if (localTime > TAKE_END + 0.3) {
    // brief "I'm waking" tint shift
    producerTokenColor = 'var(--amber-400)';
    producerTokenOp = 0.85;
  }

  // Signal arrow from consumer-side back to producer-side, drawn as a
  // dashed arc above the buffer that wipes in left-to-right.
  const arcY = G.slotY - 50;
  const arcD = `M ${G.consX} ${G.slotY + G.slotH / 2 - 14} ` +
               `Q ${G.vbW / 2} ${arcY} ${G.prodX} ${G.slotY + G.slotH / 2 - 14}`;
  const showSignal = localTime >= SIGNAL_START;
  // dasharray + dashoffset trick: dash one big segment of length L, offset
  // = (1 - progress) * L to reveal it from right to left.
  const arcPathLen = 1400;

  // Code line under the buffer: "count-- ; signal(notFull)"
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.vbW / 2} y={G.eyebrowY}
            textAnchor="middle"
            fill="var(--teal-400)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            CONSUMER TAKES · SIGNALS · PRODUCER WAKES
          </text>
        </SvgFadeIn>

        {/* Slots */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {Array.from({ length: BUF_CAPACITY }).map((_, i) => (
            <Slot key={i} G={G} i={i} filled={slotHas[i]}/>
          ))}
        </SvgFadeIn>

        {/* Thread labels: producer rose (waiting) -> amber (woken) */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <ThreadLabel G={G} x={G.prodX} y={G.prodY}
            label="Producer"
            accent={localTime > WAKE_START ? 'var(--amber-300)' : 'var(--rose-300)'}/>
          <ThreadLabel G={G} x={G.consX} y={G.consY}
            label="Consumer" accent="var(--teal-400)"/>
        </SvgFadeIn>

        {/* Signal arc — draws from consumer to producer */}
        {showSignal && (
          <g>
            <path d={arcD} stroke="var(--teal-400)" strokeWidth={2}
              fill="none"
              strokeDasharray={`${arcPathLen}`}
              strokeDashoffset={`${arcPathLen * (1 - Easing.easeOutCubic(signalProg))}`}
              opacity={0.9}/>
            {/* Arrow head at producer end, fades in once arc is fully drawn */}
            {signalProg >= 0.92 && (
              <SvgFadeIn duration={0.18} delay={0}>
                <path
                  d={`M ${G.prodX} ${G.slotY + G.slotH / 2 - 14} l 12 -6 l -2 12 z`}
                  fill="var(--teal-400)"/>
                <text x={G.vbW / 2} y={arcY - 8}
                  textAnchor="middle"
                  fill="var(--teal-400)"
                  fontFamily="var(--font-mono)" fontSize={11}
                  letterSpacing="0.2em">
                  signal(notFull)
                </text>
              </SvgFadeIn>
            )}
          </g>
        )}

        {/* Consumer-bound flying token */}
        {consumerToken && (
          <circle cx={consumerToken.cx} cy={consumerToken.cy}
            r={G.tokenR} fill="var(--teal-400)" opacity={consumerToken.op}/>
        )}

        {/* Producer-held / waking token */}
        {producerTokenOp > 0 && (
          <circle cx={producerTokenX} cy={G.slotY + G.slotH / 2}
            r={G.tokenR}
            fill={producerTokenColor} opacity={producerTokenOp}/>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            count-- ; signal(notFull)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway — symmetric paired primitives ──────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 24,
    }}>
      <FadeUp duration={0.5} delay={0.2} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
          color: 'var(--amber-300)', letterSpacing: '0.12em',
        }}>
        producer · wait(notFull) · signal(notEmpty)
      </FadeUp>

      <FadeUp duration={0.5} delay={0.9} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
          color: 'var(--teal-400)', letterSpacing: '0.12em',
        }}>
        consumer · wait(notEmpty) · signal(notFull)
      </FadeUp>

      <FadeUp duration={0.6} delay={2.0} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '44ch',
          textAlign: 'center', lineHeight: 1.3,
          marginTop: 12,
        }}>
        Threads sleep when they can't progress, and wake when they can.
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
