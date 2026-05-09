// fork(): One Process Becomes Two — Manimo lesson scene.
// The Unix fork() system call: a single process splits into a parent and
// an identical child, both returning from the same call with different
// return values.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/fork-process/):
//    0.00– 6.99  Manimo intro: what if a program could split itself in two?
//    6.99–15.93  One process: address space + PC
//   15.93–27.06  fork() splits one box into two identical processes
//   27.06–37.58  Distinguishing: rc == 0 → child, rc > 0 → parent
//   37.58–44.00  Takeaway: one call, two returns, two processes
//
// Authoring notes:
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.
//   • The "splitting" animation in beat 3 uses an x-position interpolated
//     from useSprite() so the child literally slides out of the parent.

const SCENE_DURATION = 44;

const NARRATION = [
  /*  0.00– 6.99 */ 'What if a program could split itself in two — same code, same memory, but two living processes?',
  /*  6.99–15.93 */ 'Here is a process P. It has its own code, its own heap, its own stack — a private little universe with one thread of control.',
  /* 15.93–27.06 */ 'Then P calls fork. The kernel makes an exact copy of the address space. Now there are two processes — a parent and a child — each with the same memory and registers.',
  /* 27.06–37.58 */ "Both processes return from the very same call. The parent gets back the child's PID; the child gets back zero. That is how each one knows who it is.",
  /* 37.58–44.00 */ 'One call. Two returns. Two processes — running concurrently from there.',
];

const NARRATION_AUDIO = 'audio/fork-process/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="processes"
      title="fork(): One Process Becomes Two"
      duration={SCENE_DURATION}
      introEnd={6.99}
      introCaption="what if a program could split itself in two?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.99} end={15.93}>
        <OneProcessBeat />
      </Sprite>

      <Sprite start={15.93} end={27.06}>
        <ForkSplitsBeat />
      </Sprite>

      <Sprite start={27.06} end={37.58}>
        <DistinguishingBeat />
      </Sprite>

      <Sprite start={37.58} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Reusable: a process box with stacked address-space segments ──────────
// segments are drawn top-down: stack | heap | data | code, with a PC marker
// optionally drawn on the code segment.
function ProcessBox({
  x, y, w, h, label, pidLabel, accent,
  showPC = true, pcDelay = 1.6, fadeDelay = 0.3,
  fadeDuration = 0.5,
}) {
  // Stack/Heap/Data/Code segments — proportional heights inside h.
  const segs = [
    { name: 'stack', frac: 0.22, color: 'rgba(244,184,96,0.22)' },
    { name: 'heap',  frac: 0.22, color: 'rgba(244,184,96,0.14)' },
    { name: 'data',  frac: 0.20, color: 'rgba(244,184,96,0.10)' },
    { name: 'code',  frac: 0.36, color: 'rgba(244,184,96,0.06)' },
  ];

  const headerH = 30;
  const bodyTop = y + headerH;
  const bodyH = h - headerH;

  let cursor = bodyTop;
  const segGeom = segs.map(s => {
    const sh = bodyH * s.frac;
    const g = { ...s, y: cursor, h: sh };
    cursor += sh;
    return g;
  });

  const codeSeg = segGeom.find(s => s.name === 'code');

  return (
    <SvgFadeIn duration={fadeDuration} delay={fadeDelay}>
      {/* Card outline */}
      <rect x={x} y={y} width={w} height={h} rx={10}
        fill="rgba(232,220,193,0.04)"
        stroke={accent} strokeWidth={1.5}/>

      {/* Header strip */}
      <rect x={x} y={y} width={w} height={headerH} rx={10}
        fill={accent} opacity={0.85}/>
      <rect x={x} y={y + headerH - 10} width={w} height={10} fill={accent} opacity={0.85}/>

      <text x={x + 14} y={y + 20}
        fill="#0c0a1f"
        fontFamily="var(--font-serif)" fontStyle="italic"
        fontSize={18}>
        {label}
      </text>
      <text x={x + w - 14} y={y + 20}
        textAnchor="end"
        fill="#0c0a1f"
        opacity={0.75}
        fontFamily="var(--font-mono)" fontSize={11}
        letterSpacing="0.12em">
        {pidLabel}
      </text>

      {/* Address-space segments */}
      {segGeom.map((s, i) => (
        <g key={s.name}>
          <rect x={x + 1} y={s.y} width={w - 2} height={s.h - 0.5}
            fill={s.color}/>
          <text x={x + 12} y={s.y + s.h / 2 + 4}
            fill="var(--chalk-200)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.12em">
            {s.name.toUpperCase()}
          </text>
          {/* Divider lines between segments */}
          {i < segGeom.length - 1 && (
            <line x1={x + 1} y1={s.y + s.h} x2={x + w - 1} y2={s.y + s.h}
              stroke="rgba(232,220,193,0.18)" strokeWidth={1}/>
          )}
        </g>
      ))}

      {/* PC pointer on code segment */}
      {showPC && codeSeg && (
        <SvgFadeIn duration={0.35} delay={pcDelay}>
          <line x1={x + w - 60} y1={codeSeg.y + codeSeg.h / 2}
            x2={x + w - 6} y2={codeSeg.y + codeSeg.h / 2}
            stroke="var(--rose-400)" strokeWidth={2}/>
          <polygon
            points={`${x + w - 6},${codeSeg.y + codeSeg.h / 2} ${x + w - 14},${codeSeg.y + codeSeg.h / 2 - 5} ${x + w - 14},${codeSeg.y + codeSeg.h / 2 + 5}`}
            fill="var(--rose-400)"/>
          <text x={x + w - 64} y={codeSeg.y + codeSeg.h / 2 - 8}
            textAnchor="end"
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">
            PC
          </text>
        </SvgFadeIn>
      )}
    </SvgFadeIn>
  );
}

// ─── Beat 2: a single process ─────────────────────────────────────────────
function OneProcessBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 420, boxW: 280, boxH: 320, captionY: 400 }
    : { vbW: 1080, vbH: 380, boxW: 320, boxH: 320, captionY: 360 };
  const boxX = (G.vbW - G.boxW) / 2;
  const boxY = 20;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <ProcessBox
          x={boxX} y={boxY} w={G.boxW} h={G.boxH}
          label="Process P" pidLabel="PID 1234"
          accent="var(--amber-400)"
          fadeDelay={0.3} pcDelay={1.6}/>

        {/* Caption beneath box */}
        <SvgFadeIn duration={0.5} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-300)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            one process — code, data, heap, stack, plus a thread of control
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: fork() splits one process into two ───────────────────────────
function ForkSplitsBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 460, boxW: 250, boxH: 320, gap: 36, captionY: 440, callY: 30 }
    : { vbW: 1100, vbH: 400, boxW: 280, boxH: 320, gap: 80, captionY: 380, callY: 18 };

  // Final positions for parent and child once split.
  const totalW = 2 * G.boxW + G.gap;
  const parentXFinal = (G.vbW - totalW) / 2;
  const childXFinal = parentXFinal + G.boxW + G.gap;
  // Initial position (both stacked at parent slot — child starts here, then
  // slides to its final position).
  const splitStart = 1.6;
  const splitDur = 1.4;
  const t = clamp((localTime - splitStart) / splitDur, 0, 1);
  const eased = Easing.easeOutCubic(t);
  const childX = parentXFinal + (childXFinal - parentXFinal) * eased;
  // Child fades in as it slides out.
  const childOpacity = clamp((localTime - splitStart) / 0.5, 0, 1);

  // Parent box uses a small, almost-imperceptible "wobble" during the split
  // to telegraph the duplication. Pure transform via SVG `transform` would
  // require restructuring; a tiny x-offset is enough to read.
  const parentWobble = (localTime > splitStart && localTime < splitStart + splitDur)
    ? -3 * Math.sin((localTime - splitStart) * Math.PI / splitDur)
    : 0;
  const parentX = parentXFinal + parentWobble;

  // fork() label glows just before the split.
  const callPulse = (localTime > 0.6 && localTime < 2.0)
    ? 0.8 + 0.2 * Math.sin(localTime * 8)
    : 0.85;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* fork() call indicator at top */}
        <SvgFadeIn duration={0.4} delay={0}>
          <rect x={G.vbW / 2 - 70} y={G.callY} width={140} height={36} rx={8}
            fill="rgba(244,184,96,0.10)"
            stroke="var(--amber-400)" strokeWidth={1.4}
            opacity={callPulse}/>
          <text x={G.vbW / 2} y={G.callY + 23}
            textAnchor="middle"
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={16}>
            fork()
          </text>
        </SvgFadeIn>

        {/* Connector down to the box area */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.vbW / 2} y1={G.callY + 38}
            x2={G.vbW / 2} y2={G.callY + 60}
            stroke="var(--amber-400)" strokeWidth={1.4}
            strokeDasharray="4 4"/>
        </SvgFadeIn>

        {/* Parent box — at parentX, gentle wobble during split */}
        <ProcessBox
          x={parentX} y={G.callY + 70} w={G.boxW} h={G.boxH}
          label="Parent" pidLabel="PID 1234"
          accent="var(--amber-400)"
          fadeDelay={0.6} pcDelay={1.0}/>

        {/* Child box — slides out of parent during split */}
        <g style={{ opacity: childOpacity }}>
          <ProcessBox
            x={childX} y={G.callY + 70} w={G.boxW} h={G.boxH}
            label="Child" pidLabel="PID 1235"
            accent="var(--rose-400)"
            fadeDelay={splitStart} pcDelay={splitStart + 0.5}/>
        </g>

        {/* "exact copy" hint between them once they've separated */}
        {localTime > splitStart + splitDur - 0.2 && (
          <SvgFadeIn duration={0.4} delay={splitStart + splitDur - 0.2}>
            <text
              x={(parentXFinal + G.boxW + childXFinal) / 2}
              y={G.callY + 70 + G.boxH / 2}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={11}
              letterSpacing="0.16em">
              ≡
            </text>
            <text
              x={(parentXFinal + G.boxW + childXFinal) / 2}
              y={G.callY + 70 + G.boxH / 2 + 18}
              textAnchor="middle"
              fill="var(--chalk-300)"
              fontFamily="var(--font-mono)" fontSize={9}
              letterSpacing="0.18em">
              IDENTICAL
            </text>
          </SvgFadeIn>
        )}

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={4.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            an exact copy — separate processes from this moment on
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: distinguishing parent from child by return value ─────────────
function DistinguishingBeat() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 480, codeW: 540, codeH: 200, codeY: 30, leafY: 280, leafW: 220, captionY: 470 }
    : { vbW: 1080, vbH: 360, codeW: 760, codeH: 170, codeY: 10, leafY: 220, leafW: 280, captionY: 340 };

  const codeX = (G.vbW - G.codeW) / 2;
  const childX  = (G.vbW / 2) - G.leafW - 30;
  const parentX = (G.vbW / 2) + 30;
  const leafH = 70;

  // Code lines (rendered as <text> for crisp mono).
  const lines = [
    { t: 'pid_t rc = fork();', delay: 0.3, accent: 'var(--amber-300)' },
    { t: '', delay: 0 },
    { t: 'if (rc == 0) {',                  delay: 1.2, accent: 'var(--rose-300)' },
    { t: '    /* child path  — rc is 0  */',delay: 1.6, accent: 'var(--rose-300)' },
    { t: '} else {',                        delay: 2.0, accent: 'var(--amber-300)' },
    { t: '    /* parent path — rc is PID */', delay: 2.4, accent: 'var(--amber-300)' },
    { t: '}',                               delay: 2.8, accent: 'var(--chalk-200)' },
  ];

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Code panel */}
        <SvgFadeIn duration={0.4} delay={0.1}>
          <rect x={codeX} y={G.codeY} width={G.codeW} height={G.codeH} rx={8}
            fill="rgba(232,220,193,0.04)"
            stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={codeX + 16} y={G.codeY + 18}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.18em">CODE</text>
        </SvgFadeIn>

        {/* Code lines, staggered */}
        {lines.map((ln, i) => (
          ln.t ? (
            <SvgFadeIn key={i} duration={0.35} delay={ln.delay}>
              <text x={codeX + 24} y={G.codeY + 48 + i * 19}
                fill={ln.accent || 'var(--chalk-100)'}
                fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 15}>
                {ln.t}
              </text>
            </SvgFadeIn>
          ) : null
        ))}

        {/* Branch arrows down to two leaves */}
        {/* Child branch — left */}
        <TraceIn
          d={`M ${G.vbW / 2} ${G.codeY + G.codeH + 4}
              L ${G.vbW / 2} ${G.codeY + G.codeH + 22}
              L ${childX + G.leafW / 2} ${G.codeY + G.codeH + 22}
              L ${childX + G.leafW / 2} ${G.leafY - 4}`}
          stroke="var(--rose-400)" strokeWidth={1.6}
          fill="none"
          duration={0.7} delay={3.0}/>

        {/* Parent branch — right */}
        <TraceIn
          d={`M ${G.vbW / 2} ${G.codeY + G.codeH + 4}
              L ${G.vbW / 2} ${G.codeY + G.codeH + 22}
              L ${parentX + G.leafW / 2} ${G.codeY + G.codeH + 22}
              L ${parentX + G.leafW / 2} ${G.leafY - 4}`}
          stroke="var(--amber-400)" strokeWidth={1.6}
          fill="none"
          duration={0.7} delay={3.0}/>

        {/* Child leaf */}
        <SvgFadeIn duration={0.5} delay={3.6}>
          <rect x={childX} y={G.leafY} width={G.leafW} height={leafH} rx={8}
            fill="rgba(232,122,144,0.10)"
            stroke="var(--rose-400)" strokeWidth={1.4}/>
          <text x={childX + 14} y={G.leafY + 22}
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">CHILD</text>
          <text x={childX + 14} y={G.leafY + 48}
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            rc == 0
          </text>
        </SvgFadeIn>

        {/* Parent leaf */}
        <SvgFadeIn duration={0.5} delay={3.6}>
          <rect x={parentX} y={G.leafY} width={G.leafW} height={leafH} rx={8}
            fill="rgba(244,184,96,0.10)"
            stroke="var(--amber-400)" strokeWidth={1.4}/>
          <text x={parentX + 14} y={G.leafY + 22}
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">PARENT</text>
          <text x={parentX + 14} y={G.leafY + 48}
            fill="var(--chalk-100)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 16}>
            rc &gt; 0  (= 1235)
          </text>
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.5} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            fork() returns twice — and the value is the only clue
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
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '36ch',
          lineHeight: 1.3,
        }}>
        One call. Two returns. Two processes.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
        }}>
        fork is the simplest way to spawn concurrent work
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
