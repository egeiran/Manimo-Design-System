// if, elif, else: jernbaneveksleren — Manimo lesson scene.
// Chapter 4 of itgk (Betingelser). The classroom misconception: students read
// if/elif/else as three independent yes/no checks ("did I evaluate them all?").
// They're actually one switch yard — Python walks the conditions top-down, and
// the first true one locks its body in while the rest are skipped. This scene
// shows that as a railway: a value capsule descends a vertical spine, switch
// nodes flash teal (true) or rose (false), and when a switch turns true the
// capsule routes east onto a side track. Two traces — p=85 catches the elif,
// p=45 falls through to else.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10   Manimo hook
//   10–22   Kode — the karakter() function reveals line by line
//   22–38   Trace 85 — descends, switch1 false, switch2 true, B locked (GENUINE MOTION)
//   38–52   Trace 45 — descends past both, lands in else, F locked (GENUINE MOTION)
//   52–60   Takeaway
//
// Colour discipline:
//   chalk-100  code text, values
//   chalk-300  dimmed/skipped, hints
//   amber-400  primary accent, chosen branch
//   amber-300  payoff / final result chip
//   teal-400   condition true
//   rose-400   condition false / skipped branch

const SCENE_DURATION = 59;

const NARRATION = [
  /*  0–10  */ 'Tre veier ut av en if-blokk, men bare én blir åpen. Hvordan vet datamaskinen hvilken som skal kjøre?',
  /* 10–22  */ 'Tenk på en liten karakterfunksjon. Er prosenten nittien eller mer, gir vi A. Hvis ikke, men minst sekstien, blir det B. Ellers en F. Og vi spør om karakteren til femogåtti.',
  /* 22–38  */ 'Femogåtti ruller ned til første veksler. Nittien eller mer? Nei, og sporet stenger — A blir aldri rørt. Videre ned: sekstien eller mer? Ja, og dermed låses B. Else-grenen blir aldri sjekket.',
  /* 38–52  */ 'Prøv igjen, men denne gangen med femogførti. Nittien? Nei. Sekstien? Nei heller. Da fanger else opp resten — og det blir en F.',
  /* 52–60  */ 'Det er hele logikken. Sjekkene leses ovenfra og ned, og bare den første som er sann får kjøre. Resten blir hoppet over.',
];

const NARRATION_AUDIO = 'audio/betingelser-jernbanevekslere/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'def karakter(p):',          // 1
  '    if p >= 90:',           // 2
  '        return "A"',        // 3
  '    elif p >= 60:',         // 4
  '        return "B"',        // 5
  '    else:',                 // 6
  '        return "F"',        // 7
  '',                          // 8
  'print(karakter(85))',       // 9
].join('\n');

// Each branch: which line carries the verdict, which line is the body.
const BRANCH_A = { verdictLn: 2, bodyLn: 3, label: 'A', label2: 'p ≥ 90' };
const BRANCH_B = { verdictLn: 4, bodyLn: 5, label: 'B', label2: 'p ≥ 60' };
const BRANCH_F = { verdictLn: 6, bodyLn: 7, label: 'F', label2: 'else' };
const BRANCHES = [BRANCH_A, BRANCH_B, BRANCH_F];

// ─── Layout ────────────────────────────────────────────────────────────────
// Landscape: code panel left, rail SVG right.
// Portrait: code panel top, rail SVG bottom (rail still vertical).
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 56, codeTop: 230, codeFont: 21,
      svgLeft: 56, svgTop: 690, svgW: 608, svgH: 540,
      spineX: 150, topY: 30, sw1Y: 130, sw2Y: 240, sw3Y: 350, chipX: 410,
      capR: 22, capFont: 18, chipFont: 22, switchR: 24,
    };
  }
  return {
    codeLeft: 60, codeTop: 200, codeFont: 22,
    svgLeft: 700, svgTop: 130, svgW: 540, svgH: 530,
    spineX: 130, topY: 32, sw1Y: 130, sw2Y: 250, sw3Y: 370, chipX: 380,
    capR: 24, capFont: 19, chipFont: 22, switchR: 26,
  };
}

// Code panel position. Ligatures off so `>=` doesn't render as `≥` — the
// point is to teach the exact characters Python is written with.
function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Trace schedules ───────────────────────────────────────────────────────
// Each trace is a sequence of milestones — fractions of the beat's working
// duration T. The capsule lerps between (x,y) waypoints; verdicts flip on
// at "checkAt" and the chip lights at "landAt".
//
// p=85 takes branch B (elif true). Three points on the spine, then east.
// p=45 falls all the way through to else. Four points, then east.
function trace85Schedule() {
  return {
    value: 85,
    phases: [
      { name: 'enter',  at: 0.06, to: 'top' },
      { name: 'toSw1',  at: 0.20, to: 'sw1' },
      { name: 'check1', at: 0.30, verdictIdx: 0, verdict: false },
      { name: 'toSw2',  at: 0.46, to: 'sw2' },
      { name: 'check2', at: 0.58, verdictIdx: 1, verdict: true },
      { name: 'east',   at: 0.74, to: 'chipB' },
      { name: 'land',   at: 0.88, lock: 1 },
    ],
    visitedBranches: [0, 1],         // switches the capsule actually checked
    chosen: 1,                        // which branch (index) ends up locked
  };
}
function trace45Schedule() {
  return {
    value: 45,
    phases: [
      { name: 'enter',  at: 0.05, to: 'top' },
      { name: 'toSw1',  at: 0.16, to: 'sw1' },
      { name: 'check1', at: 0.26, verdictIdx: 0, verdict: false },
      { name: 'toSw2',  at: 0.40, to: 'sw2' },
      { name: 'check2', at: 0.50, verdictIdx: 1, verdict: false },
      { name: 'toSw3',  at: 0.64, to: 'sw3' },
      { name: 'check3', at: 0.74, verdictIdx: 2, verdict: true },
      { name: 'east',   at: 0.84, to: 'chipF' },
      { name: 'land',   at: 0.94, lock: 2 },
    ],
    visitedBranches: [0, 1, 2],
    chosen: 2,
  };
}

function point(name, G) {
  switch (name) {
    case 'top':   return { x: G.spineX, y: G.topY };
    case 'sw1':   return { x: G.spineX, y: G.sw1Y };
    case 'sw2':   return { x: G.spineX, y: G.sw2Y };
    case 'sw3':   return { x: G.spineX, y: G.sw3Y };
    case 'chipA': return { x: G.chipX, y: G.sw1Y };
    case 'chipB': return { x: G.chipX, y: G.sw2Y };
    case 'chipF': return { x: G.chipX, y: G.sw3Y };
    default:      return { x: G.spineX, y: G.topY };
  }
}

// Drive the capsule by the schedule. Find which "to" segment we're on, lerp.
function capsulePosition(localTime, T, schedule, G) {
  const ph = schedule.phases;
  let currentTo = 'top';
  let segStart = 0;
  let segTo = 'top';

  // Walk phases. A phase with `to` starts a new movement segment ending at
  // the NEXT phase's `at`. Without a next phase, the capsule rests there.
  let lastTo = ph[0].to;
  let lastToAt = ph[0].at;
  for (let i = 0; i < ph.length; i++) {
    const p = ph[i];
    if (p.to) {
      // movement from lastTo (over [lastToAt, p.at]) to p.to (held until next p.to)
      if (localTime <= p.at) {
        segStart = lastToAt;
        segTo = p.to;
        currentTo = lastTo;
        const u = clamp((localTime - segStart) / (p.at - segStart), 0, 1);
        const A = point(currentTo, G);
        const B = point(segTo, G);
        const e = easeInOutCubic(u);
        return { x: lerp(A.x, B.x, e), y: lerp(A.y, B.y, e) };
      }
      lastTo = p.to;
      lastToAt = p.at;
    }
  }
  // Past all movement phases — sit at the last waypoint.
  return point(lastTo, G);
}

// Verdict on switch idx (0=A, 1=B, 2=F): null=not yet checked, true/false=set.
function verdictAt(localTime, schedule) {
  let v = [null, null, null];
  for (const p of schedule.phases) {
    if (p.name && p.name.startsWith('check') && localTime >= p.at * 1) {
      v[p.verdictIdx] = p.verdict;
    }
  }
  return v;
}

// Index of the locked chosen branch (or -1 if not locked yet).
function lockedAt(localTime, schedule) {
  let locked = -1;
  for (const p of schedule.phases) {
    if (typeof p.lock === 'number' && localTime >= p.at) locked = p.lock;
  }
  return locked;
}

// Which line of code is "current" — drives CodeBlock highlight as the trace
// walks. Mirrors the verdict timeline.
function currentLine(localTime, schedule, T) {
  let ln = 1;
  for (const p of schedule.phases) {
    if (localTime < p.at) continue;
    if (p.name === 'enter') ln = 1;
    else if (p.name === 'toSw1' || p.name === 'check1') ln = BRANCHES[0].verdictLn;
    else if (p.name === 'toSw2' || p.name === 'check2') ln = BRANCHES[1].verdictLn;
    else if (p.name === 'toSw3' || p.name === 'check3') ln = BRANCHES[2].verdictLn;
    else if (p.name === 'east' || p.name === 'land') {
      ln = BRANCHES[schedule.chosen].bodyLn;
    }
  }
  return ln;
}

// ─── Rail diagram (SVG) ────────────────────────────────────────────────────
function Rail({ G, schedule, localTime, T, branchesEmphasised }) {
  const verdicts = verdictAt(localTime, schedule);
  const locked = lockedAt(localTime, schedule);
  const cap = capsulePosition(localTime, T, schedule, G);

  // Spine ends a bit below the last switch.
  const spineBottom = G.sw3Y + 36;

  return (
    <svg width={G.svgW} height={G.svgH} style={{ overflow: 'visible' }}>
      {/* Vertical spine */}
      <line x1={G.spineX} y1={G.topY} x2={G.spineX} y2={spineBottom}
            stroke="rgba(232,220,193,0.20)" strokeWidth={3} strokeLinecap="round"/>

      {/* Branch tracks (horizontal segments from each switch east to its chip) */}
      {BRANCHES.map((br, i) => {
        const yRow = i === 0 ? G.sw1Y : i === 1 ? G.sw2Y : G.sw3Y;
        const isChosen = locked === i;
        const wasFalse = verdicts[i] === false;
        const branchColor = isChosen ? 'var(--amber-400)'
                          : wasFalse ? 'rgba(232,122,144,0.25)'
                          : 'rgba(232,220,193,0.20)';
        const branchWidth = isChosen ? 4 : 3;
        return (
          <line key={i}
                x1={G.spineX} y1={yRow}
                x2={G.chipX - 14} y2={yRow}
                stroke={branchColor} strokeWidth={branchWidth}
                strokeLinecap="round"
                strokeDasharray={wasFalse && !isChosen ? '4 6' : undefined}/>
        );
      })}

      {/* Switch nodes — circles on the spine */}
      {BRANCHES.map((br, i) => {
        const yRow = i === 0 ? G.sw1Y : i === 1 ? G.sw2Y : G.sw3Y;
        const v = verdicts[i];
        const ring = v === true ? 'var(--teal-400)'
                   : v === false ? 'var(--rose-400)'
                   : 'rgba(232,220,193,0.40)';
        // Ring colour is the verdict signal; fill stays dark so true/false
        // switches don't compete with the chosen branch's amber tint.
        const fill = 'rgba(0,0,0,0.45)';
        return (
          <g key={i}>
            <circle cx={G.spineX} cy={yRow} r={G.switchR}
                    fill={fill} stroke={ring} strokeWidth={2.5}/>
            {/* Switch label inside the node — small mono text */}
            <text x={G.spineX} y={yRow + 5} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize="13" fill="var(--chalk-200)">
              {i === 2 ? 'else' : 'if'}
            </text>
            {/* Condition label to the LEFT of the switch */}
            <text x={G.spineX - G.switchR - 12} y={yRow + 5} textAnchor="end"
                  fontFamily="var(--font-mono)" fontSize="14"
                  fill={v === false ? 'var(--rose-300)' : v === true ? 'var(--teal-400)' : 'var(--chalk-300)'}>
              {br.label2}
            </text>
            {/* Verdict word UNDER the switch */}
            {v != null && (
              <text x={G.spineX} y={yRow + G.switchR + 18} textAnchor="middle"
                    fontFamily="var(--font-mono)" fontSize="13"
                    fill={v ? 'var(--teal-400)' : 'var(--rose-400)'}>
                {v ? 'sann' : 'usann'}
              </text>
            )}
          </g>
        );
      })}

      {/* Return-value chips on the east end of each branch track */}
      {BRANCHES.map((br, i) => {
        const yRow = i === 0 ? G.sw1Y : i === 1 ? G.sw2Y : G.sw3Y;
        const isChosen = locked === i;
        const wasFalse = verdicts[i] === false;
        const stroke = isChosen ? 'var(--amber-400)'
                     : wasFalse ? 'rgba(232,122,144,0.35)'
                     : 'rgba(232,220,193,0.35)';
        const fill = isChosen ? 'rgba(244,184,96,0.18)' : 'rgba(0,0,0,0.40)';
        const labelColor = isChosen ? 'var(--amber-300)'
                          : wasFalse ? 'var(--chalk-300)'
                          : 'var(--chalk-200)';
        const opacity = wasFalse && !isChosen ? 0.5 : 1;
        return (
          <g key={i} opacity={opacity}>
            <rect x={G.chipX - 14} y={yRow - 22} width={64} height={44}
                  rx={9} fill={fill} stroke={stroke} strokeWidth={2}/>
            <text x={G.chipX + 18} y={yRow + 8} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={G.chipFont} fill={labelColor}
                  fontWeight={isChosen ? 600 : 400}>
              "{br.label}"
            </text>
          </g>
        );
      })}

      {/* The descending value capsule — the moving body of the scene */}
      <g>
        <circle cx={cap.x} cy={cap.y} r={G.capR}
                fill="rgba(244,184,96,0.22)"
                stroke="var(--amber-400)" strokeWidth={2.5}/>
        <text x={cap.x} y={cap.y + 6} textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.capFont}
              fill="var(--amber-300)" fontWeight={600}>
          {schedule.value}
        </text>
      </g>
    </svg>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="betingelser"
      title="if, elif, else: jernbaneveksleren"
      duration={SCENE_DURATION}
      introEnd={7.99}
      introCaption="Bare ett spor blir åpent."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.99} end={22.83}>
        <KodeBeat/>
      </Sprite>

      <Sprite start={22.83} end={38.21}>
        <TraceBeat schedule={trace85Schedule()} eyebrowText="kjør med p = 85"/>
      </Sprite>

      <Sprite start={38.21} end={49.2}>
        <TraceBeat schedule={trace45Schedule()} eyebrowText="kjør med p = 45"/>
      </Sprite>

      <Sprite start={49.2} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Kode ──────────────────────────────────────────────────────────
function KodeBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  // Caption sits next to / under the code panel.
  const captionStyle = portrait
    ? { position: 'absolute', left: 56, top: 900, width: 608 }
    : { position: 'absolute', left: 740, top: 260, width: 460 };

  return (
    <>
      <CodeBlock
        code={CODE}
        title="karakter.py"
        reveal="lines"
        fontSize={G.codeFont}
        duration={4.6}
        delay={0.3}
        style={codePos(G)}
      />
      <FadeUp duration={0.55} delay={4.0} distance={10}
        style={{
          ...captionStyle,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', lineHeight: 1.55,
        }}>
        Tre porter i samme blokk —
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}> hvem slipper p gjennom?</span>
      </FadeUp>
      <FadeUp duration={0.55} delay={5.6} distance={10}
        style={{
          ...captionStyle, top: portrait ? 970 : 330,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 18,
          color: 'var(--amber-300)',
        }}>
        karakter(85) — ?
      </FadeUp>
    </>
  );
}

// ─── Trace beat (GENUINE MOTION) ───────────────────────────────────────────
function TraceBeat({ schedule, eyebrowText }) {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  // Working time inside the beat — leave a small lead-in so the diagram has
  // a beat to settle before the capsule starts to move.
  const startDelay = 0.4;
  const T = Math.max(duration - startDelay - 0.4, 1);
  const beatT = clamp(localTime - startDelay, 0, T) / T;
  // Convert the phase-fraction schedule into absolute beat seconds.
  const localPhaseTime = beatT * 1;  // schedule is in [0..1] already

  const lineNo = currentLine(localPhaseTime, schedule, T);
  const locked = lockedAt(localPhaseTime, schedule);
  const accent = locked >= 0 ? 'var(--amber-400)' : 'var(--amber-400)';

  return (
    <>
      <CodeBlock
        code={CODE}
        title="karakter.py"
        reveal="all"
        highlight={String(lineNo)}
        accent={accent}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />
      <div style={{ position: 'absolute', left: G.svgLeft, top: G.svgTop }}>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
          letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10,
        }}>
          {eyebrowText}
        </div>
        <Rail G={G} schedule={schedule} localTime={localPhaseTime} T={T}/>
      </div>
      {/* Result readout: appears once the chosen branch locks in. */}
      {locked >= 0 && (
        <Resultat portrait={portrait} branchLabel={BRANCHES[locked].label} value={schedule.value}/>
      )}
    </>
  );
}

function Resultat({ portrait, branchLabel, value }) {
  const pos = portrait
    ? { position: 'absolute', left: 56, top: 1140, width: 608, textAlign: 'center' }
    : { position: 'absolute', left: 60, bottom: 80, width: 600 };
  return (
    <FadeUp duration={0.5} delay={0} distance={10}
      style={{
        ...pos,
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 18px', borderRadius: 10,
        border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
      }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        utskrift
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26,
                     color: 'var(--amber-300)' }}>
        karakter({value}) → "{branchLabel}"
      </span>
    </FadeUp>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        if · elif · else
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Bare den <span style={{ color: 'var(--amber-300)' }}>første sanne</span> får kjøre.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)' }}>
        sjekk → første sanne → kjør → hopp over resten
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ─────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
