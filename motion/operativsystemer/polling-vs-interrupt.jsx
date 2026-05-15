// Polling vs Interrupts: How the CPU Talks to a Slow Disk — Manimo lesson.
// Polling burns CPU cycles spinning on a device status register; an
// interrupt lets the CPU run other work and be woken when the device
// is ready. For a slow device the difference is most of the CPU's time.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/polling-vs-interrupt/):
//    0.00– 5.97  Manimo intro: who waits, the CPU or the disk?
//    5.97–16.19  Polling: red 'check?' segments fill the CPU bar
//   16.19–23.72  Interrupts: green 'other work' fills the CPU bar; interrupt
//                  arrow drops in when disk finishes
//   23.72–32.72  Side-by-side compare: same wall-clock, very different
//                  utilisation
//   32.72–42.00  Takeaway: interrupts ⇒ concurrency for free
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM only.
//   • Beats 2 and 3 carry the genuine motion: timeline bars fill segment
//     by segment as a sweep playhead advances; segment colours change
//     to encode CPU activity (polling/checking vs other-work vs handler).
//   • The interrupt arrow drops in at a specific time and re-routes the
//     CPU bar's content.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 5.97 */ 'A disk read takes millions of CPU cycles. While the disk works, what should the processor do?',
  /*  5.97–16.19 */ 'Polling means the CPU asks the device, again and again — is it ready yet? Every check is a wasted cycle, and almost every check returns no.',
  /* 16.19–23.72 */ 'Interrupts flip the question around. The CPU issues the request, runs something else, and the device fires an interrupt when it is done.',
  /* 23.72–32.72 */ "Stack the two side by side. With polling the CPU's wait is wasted. With interrupts that same time becomes throughput for the rest of the system.",
  /* 32.72–42.00 */ 'Interrupts give you concurrency for free. Polling only makes sense when the wait is so short an interrupt would cost more than the wait itself.',
];

const NARRATION_AUDIO = 'audio/polling-vs-interrupt/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="I/O devices"
      title="Polling vs Interrupts"
      duration={SCENE_DURATION}
      introEnd={6.69}
      introCaption="The CPU is fast. The disk is slow. Who waits?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.69} end={16.52}>
        <PollingBeat />
      </Sprite>

      <Sprite start={16.52} end={24.99}>
        <InterruptBeat />
      </Sprite>

      <Sprite start={24.99} end={34.09}>
        <CompareBeat />
      </Sprite>

      <Sprite start={34.09} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared geometry ──────────────────────────────────────────────────────
// Two long horizontal bars stacked vertically: CPU on top, DISK below.
function barGeom(portrait) {
  return portrait
    ? {
        vbW: 600, vbH: 480,
        barX: 40, barW: 520, barH: 64,
        cpuY: 130, diskY: 270,
        slots: 12, labelDy: -16,
        captionY: 430, eyebrowY: 56,
      }
    : {
        vbW: 1120, vbH: 360,
        barX: 80, barW: 960, barH: 80,
        cpuY: 90, diskY: 220,
        slots: 12, labelDy: -16,
        captionY: 330, eyebrowY: 50,
      };
}

// A segmented bar with a per-slot colour list and a sweep playhead.
//   slots:    array of slot colour strings (one per segment, length = G.slots).
//             A null colour means the slot is "not yet reached".
//   playT:    progress 0..1 of the sweep across the bar.
//   showPlayhead: whether to draw the vertical playhead line.
function SegmentedBar({ G, y, slots, playT, showPlayhead, label, accent }) {
  const slotW = G.barW / G.slots;
  return (
    <g>
      <text x={G.barX} y={y + G.labelDy}
        fill={accent} fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.18em">
        {label}
      </text>

      {/* Segment fills */}
      {slots.map((color, i) => {
        if (!color) return null;
        return (
          <rect key={i}
            x={G.barX + i * slotW + 0.5}
            y={y}
            width={slotW - 1}
            height={G.barH}
            fill={color}
            opacity={0.6}/>
        );
      })}

      {/* Bar outline */}
      <rect x={G.barX} y={y} width={G.barW} height={G.barH}
        fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>

      {/* Slot dividers */}
      {Array.from({ length: G.slots - 1 }, (_, i) => i + 1).map(i => (
        <line key={i}
          x1={G.barX + i * slotW} y1={y}
          x2={G.barX + i * slotW} y2={y + G.barH}
          stroke="var(--chalk-300)" strokeWidth={0.6} opacity={0.4}/>
      ))}

      {/* Playhead */}
      {showPlayhead && (
        <g>
          <line
            x1={G.barX + playT * G.barW} y1={y - 6}
            x2={G.barX + playT * G.barW} y2={y + G.barH + 6}
            stroke="var(--rose-400)" strokeWidth={2}/>
          <polygon
            points={`${G.barX + playT * G.barW - 6},${y - 12} ${G.barX + playT * G.barW + 6},${y - 12} ${G.barX + playT * G.barW},${y - 4}`}
            fill="var(--rose-400)"/>
        </g>
      )}
    </g>
  );
}

// ─── Beat 2: Polling — almost entire CPU bar wasted on checks ─────────────
// Animation:
//   t = 0..1.0   bars fade in
//   t = 1.0..9.0 playhead sweeps across (8s = N slots reached)
//   At each crossed slot, the CPU bar lights up red ('check?');
//   The DISK bar shows one continuous purple busy stretch.
//   Around slot 10 the disk finishes and emits a "ready" marker.
function PollingBeat() {
  const portrait = usePortrait();
  const G = barGeom(portrait);
  const { localTime } = useSprite();

  const SWEEP_START = 1.0, SWEEP_DUR = 8.0;
  const t = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const slotsReached = Math.floor(t * G.slots);

  // Disk finishes near the very end (slot 11). Until then it's busy.
  const DISK_DONE_SLOT = G.slots - 1;

  const cpuSlots = Array.from({ length: G.slots }, (_, i) => {
    if (i > slotsReached) return null;
    if (i >= DISK_DONE_SLOT) return 'var(--teal-400)';  // disk ready — CPU resumes
    return 'var(--rose-400)';                            // wasted poll
  });
  const diskSlots = Array.from({ length: G.slots }, (_, i) => {
    if (i > slotsReached) return null;
    if (i >= DISK_DONE_SLOT) return null;
    return 'var(--violet-400)';
  });

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--rose-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 10,
        }}>
        polling — busy-wait
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.5} delay={0.4}>
          <SegmentedBar G={G} y={G.cpuY} slots={cpuSlots} playT={t}
            showPlayhead={localTime > SWEEP_START && localTime < SWEEP_START + SWEEP_DUR + 0.4}
            label="CPU"
            accent="var(--amber-300)"/>
          <SegmentedBar G={G} y={G.diskY} slots={diskSlots} playT={t}
            showPlayhead={false}
            label="DISK"
            accent="var(--violet-400)"/>

          {/* Tag a few of the red slots with a small "check?" so the
              repetition reads as polling, not generic computation. */}
          {Array.from({ length: G.slots }, (_, i) => i)
            .filter(i => i < DISK_DONE_SLOT && i <= slotsReached && i % 2 === 0)
            .map(i => (
              <text key={i}
                x={G.barX + (i + 0.5) * (G.barW / G.slots)}
                y={G.cpuY + G.barH / 2 + 5}
                textAnchor="middle"
                fill="var(--bg-canvas)"
                fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 13}
                letterSpacing="0.06em">
                check?
              </text>
            ))}

          {/* Disk "BUSY" word centred along the disk bar */}
          {slotsReached >= 1 && (
            <text x={G.barX + G.barW / 2}
              y={G.diskY + G.barH / 2 + 5}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 15}
              letterSpacing="0.18em">
              BUSY
            </text>
          )}

          {/* Time axis */}
          <line x1={G.barX} y1={G.diskY + G.barH + 26}
            x2={G.barX + G.barW} y2={G.diskY + G.barH + 26}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <polygon
            points={`${G.barX + G.barW},${G.diskY + G.barH + 26} ${G.barX + G.barW - 8},${G.diskY + G.barH + 22} ${G.barX + G.barW - 8},${G.diskY + G.barH + 30}`}
            fill="var(--chalk-300)"/>
          <text x={G.barX + G.barW / 2} y={G.diskY + G.barH + 46}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">
            WALL CLOCK
          </text>
        </SvgFadeIn>

        {localTime > 9 && (
          <SvgFadeIn duration={0.5} delay={0}>
            <text x={G.vbW / 2} y={G.captionY}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
              letterSpacing="0.02em">
              almost every poll returns no — the CPU did no useful work
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 3: Interrupts — CPU does other work, gets woken ─────────────────
// Animation:
//   Same bar shape. CPU bar fills with green 'other work'.
//   DISK bar fills with purple BUSY (same length as polling beat).
//   Near the disk's done time, an interrupt arrow drops down onto the CPU,
//   and the next CPU slot is amber (the interrupt handler).
function InterruptBeat() {
  const portrait = usePortrait();
  const G = barGeom(portrait);
  const { localTime } = useSprite();

  const SWEEP_START = 1.0, SWEEP_DUR = 5.0;
  const t = clamp((localTime - SWEEP_START) / SWEEP_DUR, 0, 1);
  const slotsReached = Math.floor(t * G.slots);

  // Disk done at slot 10. Interrupt fires the moment slot 10 begins;
  // CPU's slot 10 is the handler (amber), slot 11 is back to other work.
  const DISK_DONE_SLOT = G.slots - 2;

  const cpuSlots = Array.from({ length: G.slots }, (_, i) => {
    if (i > slotsReached) return null;
    if (i === DISK_DONE_SLOT) return 'var(--amber-400)';   // handler
    return 'var(--teal-400)';                              // other work
  });
  const diskSlots = Array.from({ length: G.slots }, (_, i) => {
    if (i > slotsReached) return null;
    if (i >= DISK_DONE_SLOT) return null;
    return 'var(--violet-400)';
  });

  // Compute interrupt arrow x at slot DISK_DONE_SLOT's left edge.
  const slotW = G.barW / G.slots;
  const irqX = G.barX + DISK_DONE_SLOT * slotW;
  const interruptVisible = slotsReached >= DISK_DONE_SLOT;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--teal-400)', letterSpacing: '0.18em',
          textTransform: 'uppercase', textAlign: 'center',
          marginBottom: 10,
        }}>
        interrupts — wake on done
      </FadeUp>

      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        <SvgFadeIn duration={0.5} delay={0.4}>
          <SegmentedBar G={G} y={G.cpuY} slots={cpuSlots} playT={t}
            showPlayhead={localTime > SWEEP_START && localTime < SWEEP_START + SWEEP_DUR + 0.4}
            label="CPU"
            accent="var(--amber-300)"/>
          <SegmentedBar G={G} y={G.diskY} slots={diskSlots} playT={t}
            showPlayhead={false}
            label="DISK"
            accent="var(--violet-400)"/>

          {/* "OTHER WORK" label centred over the teal CPU stretch */}
          {slotsReached >= 1 && (
            <text x={G.barX + (DISK_DONE_SLOT / 2) * slotW}
              y={G.cpuY + G.barH / 2 + 5}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 15}
              letterSpacing="0.18em">
              OTHER WORK
            </text>
          )}

          {/* HANDLER label in the amber slot */}
          {slotsReached >= DISK_DONE_SLOT && (
            <text x={G.barX + (DISK_DONE_SLOT + 0.5) * slotW}
              y={G.cpuY + G.barH / 2 + 5}
              textAnchor="middle"
              fill="var(--bg-canvas)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 10 : 11}
              letterSpacing="0.12em">
              HDLR
            </text>
          )}

          {/* Disk BUSY label */}
          {slotsReached >= 1 && (
            <text x={G.barX + (DISK_DONE_SLOT / 2) * slotW}
              y={G.diskY + G.barH / 2 + 5}
              textAnchor="middle"
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 15}
              letterSpacing="0.18em">
              BUSY
            </text>
          )}

          {/* Time axis */}
          <line x1={G.barX} y1={G.diskY + G.barH + 26}
            x2={G.barX + G.barW} y2={G.diskY + G.barH + 26}
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <polygon
            points={`${G.barX + G.barW},${G.diskY + G.barH + 26} ${G.barX + G.barW - 8},${G.diskY + G.barH + 22} ${G.barX + G.barW - 8},${G.diskY + G.barH + 30}`}
            fill="var(--chalk-300)"/>
          <text x={G.barX + G.barW / 2} y={G.diskY + G.barH + 46}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">
            WALL CLOCK
          </text>
        </SvgFadeIn>

        {/* Interrupt arrow: descends from DISK bar to CPU bar at irqX */}
        {interruptVisible && (
          <g>
            <line x1={irqX} y1={G.diskY - 4}
              x2={irqX} y2={G.cpuY + G.barH + 4}
              stroke="var(--amber-400)" strokeWidth={2.5}/>
            <polygon
              points={`${irqX},${G.cpuY + G.barH + 4} ${irqX - 6},${G.cpuY + G.barH - 6} ${irqX + 6},${G.cpuY + G.barH - 6}`}
              fill="var(--amber-400)"/>
            <text x={irqX + 8} y={G.cpuY + G.barH + 22}
              fill="var(--amber-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.18em">
              IRQ
            </text>
          </g>
        )}

        {localTime > 11 && (
          <SvgFadeIn duration={0.5} delay={0}>
            <text x={G.vbW / 2} y={G.captionY}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
              letterSpacing="0.02em">
              the CPU did real work for the entire wait
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 4: Side-by-side comparison ──────────────────────────────────────
// Two mini-bars stacked: polling CPU (mostly red), interrupt CPU (mostly
// green with a thin amber handler).
function CompareBeat() {
  const portrait = usePortrait();
  // Use a simpler dedicated geometry tuned for stacking two labelled mini-bars.
  const G = portrait
    ? { vbW: 600, vbH: 460, barX: 60, barW: 480, barH: 64,
        topY: 90, botY: 250, slots: 12, captionY: 410 }
    : { vbW: 1100, vbH: 340, barX: 100, barW: 900, barH: 70,
        topY: 80, botY: 200, slots: 12, captionY: 300 };

  const slotW = G.barW / G.slots;
  // 10/12 slots polled (red), last 2 are post-disk-done idle (teal).
  const pollColors = Array.from({ length: G.slots }, (_, i) =>
    i < 10 ? 'var(--rose-400)' : 'var(--teal-400)');
  // Interrupt: first 10 teal (other work), 1 amber handler, last 1 teal again.
  const irqColors = Array.from({ length: G.slots }, (_, i) =>
    i === 10 ? 'var(--amber-400)' : 'var(--teal-400)');

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Top: polling row */}
        <SvgFadeIn duration={0.5} delay={0.3}>
          <text x={G.barX} y={G.topY - 12}
            fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">POLLING · CPU</text>
          {pollColors.map((color, i) => (
            <rect key={i}
              x={G.barX + i * slotW + 0.5} y={G.topY}
              width={slotW - 1} height={G.barH}
              fill={color} opacity={0.6}/>
          ))}
          <rect x={G.barX} y={G.topY} width={G.barW} height={G.barH}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.barX + G.barW + 16} y={G.topY + G.barH / 2 + 5}
            fill="var(--rose-300)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 18 : 22}>
            ~83% waste
          </text>
        </SvgFadeIn>

        {/* Bottom: interrupt row */}
        <SvgFadeIn duration={0.5} delay={1.1}>
          <text x={G.barX} y={G.botY - 12}
            fill="var(--teal-400)" fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">INTERRUPTS · CPU</text>
          {irqColors.map((color, i) => (
            <rect key={i}
              x={G.barX + i * slotW + 0.5} y={G.botY}
              width={slotW - 1} height={G.barH}
              fill={color} opacity={0.6}/>
          ))}
          <rect x={G.barX} y={G.botY} width={G.barW} height={G.barH}
            fill="none" stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.barX + G.barW + 16} y={G.botY + G.barH / 2 + 5}
            fill="var(--teal-400)"
            fontFamily="var(--font-serif)" fontStyle="italic"
            fontSize={portrait ? 18 : 22}>
            ~92% useful
          </text>
        </SvgFadeIn>

        {/* Connecting line on the right — same wall clock */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <line
            x1={G.barX + G.barW + 2} y1={G.topY + G.barH + 4}
            x2={G.barX + G.barW + 2} y2={G.botY - 4}
            stroke="var(--chalk-300)" strokeWidth={1}
            strokeDasharray="3 3" opacity={0.5}/>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 16}
            letterSpacing="0.02em">
            same wall-clock — very different CPU utilisation
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
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 34,
          color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          maxWidth: portrait ? '20ch' : '30ch',
          lineHeight: 1.25,
        }}>
        interrupts ⇒ concurrency for free
      </FadeUp>

      <FadeUp duration={0.5} delay={1.8} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)',
          maxWidth: portrait ? '26ch' : '46ch',
          lineHeight: 1.4,
        }}>
        poll only when the device is faster than an interrupt is cheap
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
