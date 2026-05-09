// User Mode and Kernel Mode: The Trap Door — Manimo lesson scene.
// How Limited Direct Execution lets programs run fast on the CPU while
// keeping privileged operations behind a controlled boundary.
//
// Beats (timed to single-track narration in motion/operativsystemer/audio/user-kernel-mode/):
//    0.00– 5.78  Manimo intro: fast on the metal, but never trusted with the keys
//    5.78–16.10  Two modes — user vs kernel, separated by a privilege boundary
//   16.10–25.99  Trap: a program calls read() — CPU flips mode, jumps to handler
//   25.99–33.56  Kernel does the work, return-from-trap restores user mode
//   33.56–42.00  Takeaway: Limited Direct Execution
//
// Authoring notes:
//   • The two-lane diagram (USER / KERNEL with a privilege boundary) is shared
//     across beats 2–4. Each beat layers its own arrows and code on top.
//   • SvgFadeIn for everything inside <svg>; FadeUp for HTML/DOM only.

const SCENE_DURATION = 42;

const NARRATION = [
  /*  0.00– 5.78 */ 'How can a program run fast on the real hardware, and yet be unable to do anything dangerous?',
  /*  5.78–16.10 */ 'The CPU has two modes. In user mode a program does arithmetic and calls its own functions — but it cannot touch the disk, the network, or other processes.',
  /* 16.10–25.99 */ 'When the program needs something privileged, it executes a trap instruction. The CPU flips into kernel mode and jumps to a fixed handler chosen by the OS.',
  /* 25.99–33.56 */ 'The kernel does the work, then a return-from-trap puts the CPU back in user mode, right where the program left off.',
  /* 33.56–42.00 */ 'This is Limited Direct Execution. Programs run on real hardware — but the keys to the system stay with the kernel.',
];

const NARRATION_AUDIO = 'audio/user-kernel-mode/scene.mp3';

// Shared lane geometry — used by all three diagram beats.
function laneGeom(portrait) {
  return portrait
    ? { vbW: 600, vbH: 460, laneX: 30, laneW: 540,
        userY: 50, userH: 150,
        kernelY: 230, kernelH: 150,
        boundaryY: 215, captionY: 440 }
    : { vbW: 1100, vbH: 400, laneX: 60, laneW: 980,
        userY: 20, userH: 130,
        kernelY: 200, kernelH: 130,
        boundaryY: 175, captionY: 380 };
}

// Render the two lanes + privilege boundary. Used in beats 2/3/4.
function ModeLanes({ G, includeOpsLists = false, opsDelay = 1.0 }) {
  return (
    <>
      {/* User-mode lane */}
      <SvgFadeIn duration={0.5} delay={0.2}>
        <rect x={G.laneX} y={G.userY} width={G.laneW} height={G.userH} rx={10}
          fill="rgba(232,220,193,0.04)"
          stroke="var(--chalk-200)" strokeWidth={1.4}/>
        <text x={G.laneX + 16} y={G.userY + 22}
          fill="var(--chalk-100)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.18em">USER MODE</text>
        <text x={G.laneX + G.laneW - 16} y={G.userY + 22}
          textAnchor="end"
          fill="var(--chalk-300)"
          fontFamily="var(--font-sans)" fontSize={12}
          fontStyle="italic">
          your program runs here
        </text>
      </SvgFadeIn>

      {/* Privilege boundary — drawn last so it sits over both lanes.
          Label is right-anchored so it doesn't collide with trap/return
          arrows that originate from the user-code area on the left. */}
      <SvgFadeIn duration={0.5} delay={0.8}>
        <line x1={G.laneX} y1={G.boundaryY}
          x2={G.laneX + G.laneW} y2={G.boundaryY}
          stroke="var(--rose-400)" strokeWidth={1.6}
          strokeDasharray="6 6"/>
        <text x={G.laneX + G.laneW - 16} y={G.boundaryY - 6}
          textAnchor="end"
          fill="var(--rose-300)"
          fontFamily="var(--font-mono)" fontSize={10}
          letterSpacing="0.18em">
          PRIVILEGE BOUNDARY
        </text>
      </SvgFadeIn>

      {/* Kernel-mode lane */}
      <SvgFadeIn duration={0.5} delay={0.4}>
        <rect x={G.laneX} y={G.kernelY} width={G.laneW} height={G.kernelH} rx={10}
          fill="rgba(244,184,96,0.06)"
          stroke="var(--amber-400)" strokeWidth={1.4}/>
        <text x={G.laneX + 16} y={G.kernelY + 22}
          fill="var(--amber-300)"
          fontFamily="var(--font-mono)" fontSize={11}
          letterSpacing="0.18em">KERNEL MODE</text>
        <text x={G.laneX + G.laneW - 16} y={G.kernelY + 22}
          textAnchor="end"
          fill="var(--chalk-300)"
          fontFamily="var(--font-sans)" fontSize={12}
          fontStyle="italic">
          the OS lives here
        </text>
      </SvgFadeIn>

      {includeOpsLists && (
        <>
          {/* User-mode safe ops */}
          <SvgFadeIn duration={0.5} delay={opsDelay}>
            {['arithmetic, branches', 'function calls, allocate on the heap', 'read your own memory'].map((t, i) => (
              <text key={i}
                x={G.laneX + 28} y={G.userY + 56 + i * 22}
                fill="var(--chalk-200)"
                fontFamily="var(--font-sans)" fontSize={13}>
                — {t}
              </text>
            ))}
          </SvgFadeIn>

          {/* Kernel-mode privileged ops */}
          <SvgFadeIn duration={0.5} delay={opsDelay + 0.6}>
            {['talk to disk and network', 'change page tables', 'create / kill processes'].map((t, i) => (
              <text key={i}
                x={G.laneX + 28} y={G.kernelY + 56 + i * 22}
                fill="var(--chalk-100)"
                fontFamily="var(--font-sans)" fontSize={13}>
                — {t}
              </text>
            ))}
          </SvgFadeIn>
        </>
      )}
    </>
  );
}

function Scene() {
  return (
    <SceneChrome
      eyebrow="Limited Direct Execution"
      title="User Mode and the Trap Door"
      duration={SCENE_DURATION}
      introEnd={5.78}
      introCaption="fast on the metal — but never trusted with the keys"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.78} end={16.1}>
        <TwoModesBeat />
      </Sprite>

      <Sprite start={16.1} end={25.99}>
        <TrapBeat />
      </Sprite>

      <Sprite start={25.99} end={33.56}>
        <ReturnBeat />
      </Sprite>

      <Sprite start={33.56} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: two modes side by side, with a wall ──────────────────────────
function TwoModesBeat() {
  const portrait = usePortrait();
  const G = laneGeom(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <ModeLanes G={G} includeOpsLists opsDelay={1.4} />

        <SvgFadeIn duration={0.5} delay={5.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            two modes, one CPU — and a wall between them
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: a program calls read() — TRAP into the kernel ────────────────
function TrapBeat() {
  const portrait = usePortrait();
  const G = laneGeom(portrait);
  const { localTime } = useSprite();

  // Code panel inside user lane.
  const codeX = G.laneX + 24;
  const codeBaseY = G.userY + 50;
  const codeLineH = 22;
  const userCodeLines = [
    '...',
    'buf = malloc(n);',
    'x = read(fd, buf, n);',
    'process(buf, x);',
  ];
  const readLineIdx = 2;
  const readLineY = codeBaseY + readLineIdx * codeLineH;

  // Kernel handler entry text position (left side of kernel lane).
  const handlerX = G.laneX + 24;
  const handlerY = G.kernelY + 70;

  // PC marker pulse on the read() line.
  const pcOn = localTime > 0.9;
  const pcPulse = 0.6 + 0.4 * Math.sin(localTime * 5);

  // Trap arrow — vertical drop placed to the RIGHT of all code text so the
  // arrow never visually crosses a line of code. One straight line reads as
  // "this instruction triggered a trap" once the labels make the link.
  const trapX = codeX + (portrait ? 280 : 360);
  const trapStartY = readLineY + 6;
  const trapEndY = handlerY - 18;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <ModeLanes G={G} includeOpsLists={false} />

        {/* User code lines */}
        {userCodeLines.map((line, i) => (
          <SvgFadeIn key={i} duration={0.35} delay={0.3 + i * 0.18}>
            <text x={codeX} y={codeBaseY + i * codeLineH}
              fill={i === readLineIdx ? 'var(--chalk-100)' : 'var(--chalk-300)'}
              fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 15}>
              {line}
            </text>
          </SvgFadeIn>
        ))}

        {/* PC marker pulsing on the read() line */}
        {pcOn && (
          <g style={{ opacity: pcPulse }}>
            <circle cx={codeX - 12} cy={readLineY - 5} r={5}
              fill="var(--rose-400)"/>
          </g>
        )}

        {/* "needs the kernel" hint adjacent to the read() line —
            anchored to the END of the longest visible code so it never
            crosses code text. */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={codeX + (portrait ? 200 : 200)} y={readLineY}
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.16em">
            ← privileged
          </text>
        </SvgFadeIn>

        {/* Trap arrow — straight vertical drop, well to the right of code */}
        <TraceIn d={`M ${trapX} ${trapStartY} L ${trapX} ${trapEndY}`}
          stroke="var(--rose-400)" strokeWidth={2}
          fill="none"
          duration={0.9} delay={2.0}/>

        {/* Arrowhead pointing down + labels next to the arrow */}
        <SvgFadeIn duration={0.3} delay={2.8}>
          <polygon
            points={`${trapX},${trapEndY} ${trapX - 5},${trapEndY - 9} ${trapX + 5},${trapEndY - 9}`}
            fill="var(--rose-400)"/>
          <text x={trapX + 14} y={G.boundaryY - 6}
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            TRAP
          </text>
          <text x={trapX + 14} y={G.boundaryY + 16}
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">
            mode: USER → KERNEL
          </text>
        </SvgFadeIn>

        {/* Kernel handler entry */}
        <SvgFadeIn duration={0.5} delay={3.2}>
          <text x={handlerX} y={handlerY}
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 15}>
            trap_handler:
          </text>
          <text x={handlerX} y={handlerY + 22}
            fill="var(--chalk-300)"
            fontFamily="var(--font-mono)" fontSize={12}>
            switch (syscall_no) {'{'} case READ: ... {'}'}
          </text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            the trap is the only legal door into the kernel
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: kernel does the work and returns ─────────────────────────────
function ReturnBeat() {
  const portrait = usePortrait();
  const G = laneGeom(portrait);
  const { localTime } = useSprite();

  const codeX = G.laneX + 24;
  const codeBaseY = G.userY + 50;
  const codeLineH = 22;
  const userCodeLines = [
    '...',
    'buf = malloc(n);',
    'x = read(fd, buf, n);',
    'process(buf, x);',
  ];
  const readLineIdx = 2;
  const nextLineIdx = 3;
  const nextLineY = codeBaseY + nextLineIdx * codeLineH;

  const handlerX = G.laneX + 24;
  const handlerY = G.kernelY + 50;

  const handlerSteps = [
    'validate the args',
    'read from disk',
    'copy bytes to the user buffer',
  ];

  // Return-from-trap arrow — vertical lift placed well to the right of code
  // so the arrow never crosses any code text. Mirrors the trap arrow's
  // horizontal position so the eye reads "down here, then back up".
  const retX = codeX + (portrait ? 280 : 360);
  const retStartY = handlerY + 30 + handlerSteps.length * 22;
  const retEndY = nextLineY - 12;

  // PC marker pulses on the next user line after the return arrow lands.
  const pcOn = localTime > 4.0;
  const pcPulse = 0.6 + 0.4 * Math.sin(localTime * 5);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <ModeLanes G={G} includeOpsLists={false} />

        {/* User code (faded, since CPU isn't here yet) */}
        {userCodeLines.map((line, i) => (
          <SvgFadeIn key={i} duration={0.35} delay={0.1}>
            <text x={codeX} y={codeBaseY + i * codeLineH}
              fill={i === readLineIdx ? 'var(--chalk-300)' : 'var(--chalk-300)'}
              fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 15}
              opacity={pcOn && i === nextLineIdx ? 1 : 0.55}>
              {line}
            </text>
          </SvgFadeIn>
        ))}

        {/* Kernel handler header */}
        <SvgFadeIn duration={0.4} delay={0.1}>
          <text x={handlerX} y={handlerY}
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={portrait ? 14 : 15}>
            trap_handler:
          </text>
        </SvgFadeIn>

        {/* Kernel handler steps — staggered fade-in to read like a checklist */}
        {handlerSteps.map((step, i) => (
          <SvgFadeIn key={i} duration={0.4} delay={0.3 + i * 0.7}>
            <text x={handlerX + 14} y={handlerY + 24 + i * 22}
              fill="var(--chalk-100)"
              fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 14}>
              {i + 1}. {step}
            </text>
          </SvgFadeIn>
        ))}

        {/* Return-from-trap arrow — straight vertical lift */}
        <TraceIn d={`M ${retX} ${retStartY} L ${retX} ${retEndY}`}
          stroke="var(--amber-400)" strokeWidth={2}
          fill="none"
          duration={0.9} delay={2.6}/>

        {/* Arrowhead pointing up, into the user code line, plus labels */}
        <SvgFadeIn duration={0.3} delay={3.5}>
          <polygon
            points={`${retX},${retEndY} ${retX - 5},${retEndY + 9} ${retX + 5},${retEndY + 9}`}
            fill="var(--amber-400)"/>
          <text x={retX + 14} y={G.boundaryY - 6}
            fill="var(--amber-300)"
            fontFamily="var(--font-mono)" fontSize={11}
            letterSpacing="0.18em">
            RETURN-FROM-TRAP
          </text>
          <text x={retX + 14} y={G.boundaryY + 16}
            fill="var(--rose-300)"
            fontFamily="var(--font-mono)" fontSize={10}
            letterSpacing="0.16em">
            mode: KERNEL → USER
          </text>
        </SvgFadeIn>

        {/* PC marker pulsing on the line after read() */}
        {pcOn && (
          <g style={{ opacity: pcPulse }}>
            <circle cx={codeX - 12} cy={nextLineY - 5} r={5}
              fill="var(--rose-400)"/>
          </g>
        )}

        <SvgFadeIn duration={0.5} delay={6.0}>
          <text x={G.vbW / 2} y={G.captionY}
            textAnchor="middle"
            fill="var(--chalk-200)"
            fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 14}
            letterSpacing="0.02em">
            the program never noticed the detour
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 5: takeaway ─────────────────────────────────────────────────────
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
        Direct on the metal. Through the kernel for the keys.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.14em',
          textAlign: 'center',
        }}>
        this is what we call Limited Direct Execution
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
