// Unntak: feilen stiger oppover — Manimo lesson scene.
// Chapter 10 of itgk (Filbehandling og unntak). The misconception students
// carry: a raise stops the line it lives on. It doesn't. The exception
// unwinds the call stack frame by frame until something catches it — or
// it escapes the program. This scene runs the same little program twice:
// first without try/except (a rosa chip rises through parse → behandle →
// the module frame, escapes, and Python prints a traceback), then with
// try/except in the module frame (same rise, but the chip lands in the
// try band, turns teal, and the program prints a friendly message).
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–24     Kode — reveal program + build the empty stack
//   24–40     UtenHåndtak — chip rises through three frames, escapes (GENUINE MOTION)
//   40–54     MedHåndtak — same rise, caught at try band (GENUINE MOTION)
//   54–60     Takeaway
//
// Layout choice: caller on top (module / hovedprogram), deepest call at
// the bottom (parse). This matches Python's Traceback layout ("most recent
// call last") and lets "stiger oppover" be a literal upward motion. It is
// the opposite of rekursjon-kallstabel where new frames stacked upward —
// here new frames push downward.
//
// Colour discipline:
//   chalk-100  code text, frame labels
//   chalk-300  dim frames, hints
//   amber-400  active frame, try band when armed
//   amber-300  output payoff, eyebrows
//   teal-400   caught state
//   rose-400   exception chip in flight, escaping frames
//   rose-300   traceback / crash text

const SCENE_DURATION = 64;

const NARRATION = [
  /*  0–10  */ 'Hva skjer når noe går galt i koden? Python stopper ikke stille — den sender en feilmelding oppover gjennom kallstabelen, og leter etter noen som kan ta imot.',
  /* 10–24  */ 'Her ber programmet om et tall, sender det til behandle, som sender det videre til parse. Parse prøver å lage et heltall. Hva om brukeren skriver bokstaver i stedet?',
  /* 24–40  */ 'Inne i parse oppstår en verdifeil. Feilen stiger oppover, ramme for ramme. Behandle har ingen håndtak. Hovedprogrammet heller ikke. Feilen rømmer ut, og Python skriver en sporing og avslutter.',
  /* 40–54  */ 'Pakk kallet inn i en try-blokk, og legg til en except for verdifeil. Nå stiger feilen oppover som før, men i hovedprogrammet venter et håndtak. Feilen fanges, og brukeren får en vennlig beskjed i stedet for en krasj.',
  /* 54–60  */ 'Et unntak stiger oppover, ramme for ramme. Finner det en passende except, fortsetter programmet. Finner det ingen, krasjer alt.',
];

const NARRATION_AUDIO = 'audio/unntak-stiger-oppover/scene.mp3';

// ─── The two programs ──────────────────────────────────────────────────────
// CODE_BARE: no handler — the exception escapes the program.
const CODE_BARE = [
  'def parse(s):',           // 1
  '    return int(s)',       // 2
  '',                        // 3
  'def behandle(s):',        // 4
  '    return 10 / parse(s)',// 5
  '',                        // 6
  's = input("tall: ")',     // 7
  'print(behandle(s))',      // 8
].join('\n');

// CODE_TRY: same logic wrapped in a try/except in the module frame.
const CODE_TRY = [
  'def parse(s):',                  // 1
  '    return int(s)',              // 2
  '',                               // 3
  'def behandle(s):',               // 4
  '    return 10 / parse(s)',       // 5
  '',                               // 6
  's = input("tall: ")',            // 7
  'try:',                           // 8
  '    print(behandle(s))',         // 9
  'except ValueError:',             // 10
  '    print("Kunne ikke tolke")',  // 11
].join('\n');

// Stack frames, ordered TOP → BOTTOM on screen.
// index 0 = outermost (module / hovedprogram), index 2 = deepest (parse).
const FRAMES = [
  { label: '<modul>',         sub: 'hovedprogrammet'        },
  { label: 'behandle("hei")', sub: '10 / parse(s)'          },
  { label: 'parse("hei")',    sub: 'int(s)'                 },
];

// ─── Layout ────────────────────────────────────────────────────────────────
// The chip rides up a dedicated column adjacent to the stack so the rise
// reads against a clear background and never overprints frame UI.
//   landscape:  code | chip column | stack       (chip left of stack)
//   portrait :  code on top, then stack | chip column   (chip right of stack)
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 56,  codeTop: 200, codeFont: 18,
      stackX: 60,   stackTop: 760, stackW: 510,
      frameH: 78,   frameGap: 12,
      chipX: 588,   chipW: 120,        // right of stack (stack right edge = 570)
      outX: 60,     outY: 1060, outW: 600,
      svgW: 720,    svgH: 1280,
    };
  }
  return {
    codeLeft: 80,  codeTop: 180, codeFont: 22,
    stackX: 800,  stackTop: 180, stackW: 440,
    frameH: 78,   frameGap: 14,
    chipX: 660,   chipW: 130,        // between code and stack
    outX: 800,    outY: 540, outW: 440,
    svgW: 1280,   svgH: 720,
  };
}

function frameY(G, i)        { return G.stackTop + i * (G.frameH + G.frameGap); }
function frameMidY(G, i)     { return frameY(G, i) + G.frameH / 2; }
function frameRiseExitY(G)   { return G.stackTop - 56; }   // chip escapes above the top frame

// Mono ligatures would render `<=`, `->`, `==` as single glyphs — wrong
// when the point is teaching the exact characters Python is written with.
function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Stack pieces (DOM) ────────────────────────────────────────────────────
// state: 'idle' (chalk), 'active' (amber), 'caller-waiting' (dim), 'escaping' (rose), 'caught' (teal), 'gone'
function StackFrame({ G, i, state, showTryBand }) {
  if (state === 'gone') return null;
  const borders = {
    idle:             'rgba(232,220,193,0.22)',
    active:           'var(--amber-400)',
    'caller-waiting': 'rgba(232,220,193,0.22)',
    escaping:         'var(--rose-400)',
    caught:           'var(--teal-400)',
  };
  const dim  = state === 'caller-waiting' || state === 'idle';
  const tone = state === 'escaping' ? 'rgba(232,122,144,0.10)'
             : state === 'caught'   ? 'rgba(0,0,0,0.45)'
             : state === 'active'   ? 'rgba(244,184,96,0.10)'
             : 'rgba(0,0,0,0.45)';
  const labelColor = dim ? 'var(--chalk-300)'
                    : state === 'escaping' ? 'var(--rose-300)'
                    : state === 'caught'   ? 'var(--teal-400)'
                    : 'var(--chalk-100)';
  const subColor   = state === 'escaping' ? 'var(--rose-300)'
                   : state === 'caught'   ? 'var(--teal-400)'
                   : 'var(--chalk-300)';
  return (
    <div style={{
      position: 'absolute', left: G.stackX, top: frameY(G, i), width: G.stackW, height: G.frameH,
      boxSizing: 'border-box', padding: '8px 18px',
      border: `1.5px solid ${borders[state]}`, borderRadius: 12,
      background: tone,
      opacity: dim ? 0.7 : 1,
      transition: 'opacity 0.3s linear, border-color 0.3s linear, background 0.3s linear',
      display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: G.frameH * 0.22, color: labelColor }}>
          {FRAMES[i].label}
        </span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: G.frameH * 0.16, color: subColor }}>
          {FRAMES[i].sub}
        </span>
      </div>
      {showTryBand && (
        <div style={{
          marginTop: 2, alignSelf: 'stretch', padding: '4px 10px', borderRadius: 6,
          border: `1px dashed ${state === 'caught' ? 'var(--teal-400)' : 'var(--amber-400)'}`,
          background: state === 'caught' ? 'rgba(0,0,0,0.35)' : 'rgba(244,184,96,0.06)',
          fontFamily: 'var(--font-mono)', fontSize: G.frameH * 0.16,
          color: state === 'caught' ? 'var(--teal-400)' : 'var(--amber-300)',
          letterSpacing: '0.04em', textAlign: 'center',
        }}>
          try / except ValueError
        </div>
      )}
    </div>
  );
}

// Chip carrying the exception. Sits in its own column (G.chipX) so it
// never overprints stack-frame chrome — the column makes "stigning" legible.
function ExceptionChip({ G, cy, tone = 'rose', label = 'ValueError', sub = null }) {
  if (cy == null) return null;
  const border = tone === 'caught' ? 'var(--teal-400)' : 'var(--rose-400)';
  const bg     = tone === 'caught' ? 'rgba(0,0,0,0.55)' : 'rgba(232,122,144,0.20)';
  const fg     = tone === 'caught' ? 'var(--teal-400)' : 'var(--rose-300)';
  return (
    <div style={{
      position: 'absolute', left: G.chipX, top: cy - 22, width: G.chipW, height: 44,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, border: `2px solid ${border}`,
      background: bg, boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      fontFamily: 'var(--font-mono)', color: fg,
    }}>
      <span style={{ fontSize: 14, letterSpacing: '0.02em' }}>{label}</span>
      {sub && <span style={{ fontSize: 10, color: 'var(--chalk-300)', marginTop: 1 }}>{sub}</span>}
    </div>
  );
}

function StackLabel({ G, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.stackX + 2, top: G.stackTop - 26,
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
      letterSpacing: '0.16em', textTransform: 'uppercase',
    }}>
      kallstabelen
    </div>
  );
}

function CrashRow({ G, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX, top: G.outY, width: G.outW, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 18px',
      borderRadius: 10, border: '1.5px solid var(--rose-400)', background: 'rgba(232,122,144,0.12)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--rose-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>traceback</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--rose-300)' }}>
        ValueError: invalid literal for int()
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--chalk-300)' }}>
        Programmet krasjet.
      </span>
    </div>
  );
}

function OutputRow({ G, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX, top: G.outY, width: G.outW, boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 18px',
      borderRadius: 10, border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--amber-300)' }}>
        Kunne ikke tolke
      </span>
      <span style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'var(--chalk-300)' }}>
        Programmet fortsatte.
      </span>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="unntak"
      title="Unntak: feilen stiger oppover"
      duration={SCENE_DURATION}
      introEnd={11.39}
      introCaption="Når noe går galt, hvem rydder opp?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.39} end={23.82}>
        <KodeBeat/>
      </Sprite>

      <Sprite start={23.82} end={39.21}>
        <UtenHandtakBeat/>
      </Sprite>

      <Sprite start={39.21} end={54.57}>
        <MedHandtakBeat/>
      </Sprite>

      <Sprite start={54.57} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Kode ──────────────────────────────────────────────────────────
function KodeBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 0.5, 1);

  // Reveal the program, then drop the (idle) stack on the right so the next
  // beat can populate it. No input-line overlay — narration carries that.
  const revealDone = 4.0;
  const stackAt    = 0.45 * T;
  // Smoothly fade frames in one by one once the stack appears.
  const stackElapsed = Math.max(0, localTime - stackAt);

  return (
    <>
      <CodeBlock
        code={CODE_BARE}
        title="ekko.py"
        reveal={localTime < revealDone ? 'lines' : 'all'}
        highlight={localTime < revealDone ? '' : ''}
        fontSize={G.codeFont}
        duration={localTime < revealDone ? 3.2 : 0.3}
        delay={localTime < revealDone ? 0.3 : 0}
        style={codePos(G)}
      />

      {localTime >= stackAt && (
        <>
          <StackLabel G={G} show={true}/>
          {FRAMES.map((f, i) => {
            // Frames appear in call order: <modul> first (i=0), parse last (i=2).
            const inAt = i * 0.35;
            if (stackElapsed < inAt) return null;
            const fade = Math.min(1, (stackElapsed - inAt) / 0.45);
            return (
              <div key={i} style={{ opacity: fade }}>
                <StackFrame G={G} i={i} state="idle"/>
              </div>
            );
          })}
        </>
      )}
    </>
  );
}

// ─── Beat 3: UtenHåndtak (GENUINE MOTION) ──────────────────────────────────
// Snapshot midpoint (fraction ≈ 0.50) lands inside flights[1] — the chip is
// rising from behandle into module, parse is gone, behandle is escaping,
// module is still waiting. That's the most readable static moment.
function UtenHandtakBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Beat 3 schedule (fractions of beat duration T):
  //   0.10  parse highlighted active; chip spawns at parse mid
  //   0.15→0.32  chip rises parse → behandle (parse goes gone at 0.32)
  //   0.32→0.40  chip parks at behandle mid (a held beat)
  //   0.40→0.62  chip rises behandle → module (behandle gone at 0.62)  ◀ midpoint
  //   0.62→0.70  chip parks at module mid
  //   0.70→0.85  chip rises module → escape  (module gone at 0.85)
  //   0.88  crash panel slides in
  const spawnAt = at(0.10);
  const flights = [
    { start: at(0.15), end: at(0.32), fromI: 2 },  // parse  → behandle
    { start: at(0.40), end: at(0.62), fromI: 1 },  // behandle → module  ← snapshot
    { start: at(0.70), end: at(0.85), fromI: 0 },  // module → escape
  ];
  const crashAt = at(0.88);

  const chip = (() => {
    if (localTime < spawnAt) return null;
    if (localTime >= crashAt + 0.4) return null;       // fade once crash row is settled
    for (const fl of flights) {
      if (localTime >= fl.start && localTime < fl.end) {
        const t = (localTime - fl.start) / (fl.end - fl.start);
        const e = easeInOutCubic(t);
        const y0 = frameMidY(G, fl.fromI);
        const y1 = fl.fromI === 0 ? frameRiseExitY(G) : frameMidY(G, fl.fromI - 1);
        return { cy: y0 + (y1 - y0) * e };
      }
    }
    if (localTime >= spawnAt && localTime < flights[0].start) return { cy: frameMidY(G, 2) };
    if (localTime >= flights[0].end && localTime < flights[1].start) return { cy: frameMidY(G, 1) };
    if (localTime >= flights[1].end && localTime < flights[2].start) return { cy: frameMidY(G, 0) };
    return null;
  })();

  const stateFor = (i) => {
    if (localTime < spawnAt) return i === 2 ? 'active' : 'caller-waiting';
    const flight = flights.find(fl => fl.fromI === i);
    // Frame is gone after its outbound flight completes.
    if (flight && localTime >= flight.end) return 'gone';
    // Frame is "escaping" from the moment the chip enters it until it leaves:
    //   parse (i=2): chip spawn → flight 0 end
    //   behandle (i=1): flight 0 end → flight 1 end
    //   module  (i=0): flight 1 end → flight 2 end
    if (i === 2 && localTime >= spawnAt && localTime < flights[0].end) return 'escaping';
    if (i === 1 && localTime >= flights[0].end && localTime < flights[1].end) return 'escaping';
    if (i === 0 && localTime >= flights[1].end && localTime < flights[2].end) return 'escaping';
    return 'caller-waiting';
  };

  const codeLine = localTime < spawnAt ? '2'
                 : localTime < flights[0].end ? '2'    // int(s) raises
                 : localTime < flights[1].end ? '5'    // 10 / parse(s)
                 : localTime < flights[2].end ? '8'    // print(behandle(s))
                 : '';

  return (
    <>
      <CodeBlock code={CODE_BARE} title="ekko.py" reveal="all"
                 highlight={codeLine}
                 accent="var(--rose-400)"
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <StackLabel G={G} show={true}/>

      {FRAMES.map((f, i) => <StackFrame key={i} G={G} i={i} state={stateFor(i)}/>)}

      {chip && <ExceptionChip G={G} cy={chip.cy} label="ValueError" sub='int("hei")'/>}

      <CrashRow G={G} show={localTime >= crashAt}/>
    </>
  );
}

// ─── Beat 4: MedHåndtak (GENUINE MOTION) ───────────────────────────────────
// Same rising motion, but the chip lands at module's try band instead of
// escaping. The try band is visible on the module frame from the beat start
// so the viewer can anticipate where the chip will land.
function MedHandtakBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Beat 4 schedule (fractions of T):
  //   0.10  chip spawns at parse mid; parse → escaping
  //   0.15→0.30  chip rises parse → behandle (parse gone at 0.30)
  //   0.30→0.38  chip parks at behandle mid
  //   0.38→0.60  chip rises behandle → module/try band   ◀ midpoint
  //   0.62  chip caught: module → caught (teal), chip → teal
  //   0.72  print panel "Kunne ikke tolke" appears
  const spawnAt = at(0.10);
  const flights = [
    { start: at(0.15), end: at(0.30), fromI: 2 },  // parse → behandle
    { start: at(0.38), end: at(0.60), fromI: 1 },  // behandle → module/try   ← snapshot
  ];
  const caughtAt = at(0.62);
  const outputAt = at(0.72);

  const chip = (() => {
    if (localTime < spawnAt) return null;
    for (const fl of flights) {
      if (localTime >= fl.start && localTime < fl.end) {
        const t = (localTime - fl.start) / (fl.end - fl.start);
        const e = easeInOutCubic(t);
        const y0 = frameMidY(G, fl.fromI);
        const y1 = frameMidY(G, fl.fromI - 1);
        return { cy: y0 + (y1 - y0) * e, tone: 'rose' };
      }
    }
    if (localTime >= spawnAt && localTime < flights[0].start) return { cy: frameMidY(G, 2), tone: 'rose' };
    if (localTime >= flights[0].end && localTime < flights[1].start) return { cy: frameMidY(G, 1), tone: 'rose' };
    // Just-arrived (between flight end and catch) and caught (parked).
    if (localTime >= flights[1].end && localTime < caughtAt) return { cy: frameMidY(G, 0), tone: 'rose' };
    if (localTime >= caughtAt) return { cy: frameMidY(G, 0) + 6, tone: 'caught' };
    return null;
  })();

  const stateFor = (i) => {
    if (localTime < spawnAt) return i === 2 ? 'active' : 'caller-waiting';
    const flight = flights.find(fl => fl.fromI === i);
    if (flight && localTime >= flight.end) return 'gone';
    if (i === 2 && localTime >= spawnAt && localTime < flights[0].end) return 'escaping';
    if (i === 1 && localTime >= flights[0].end && localTime < flights[1].end) return 'escaping';
    if (i === 0 && localTime >= caughtAt) return 'caught';
    if (i === 0 && localTime >= flights[1].end) return 'escaping';
    return 'caller-waiting';
  };

  const codeLine = localTime < spawnAt ? '2'
                 : localTime < flights[0].end ? '2'
                 : localTime < flights[1].end ? '5'
                 : localTime < caughtAt ? '8'
                 : localTime < outputAt ? '10'
                 : '11';
  const accent = localTime >= caughtAt && localTime < outputAt ? 'var(--teal-400)'
               : localTime >= outputAt ? 'var(--amber-400)'
               : 'var(--rose-400)';

  return (
    <>
      <CodeBlock code={CODE_TRY} title="ekko.py" reveal="all"
                 highlight={codeLine}
                 accent={accent}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <StackLabel G={G} show={true}/>

      {FRAMES.map((f, i) => (
        <StackFrame key={i} G={G} i={i} state={stateFor(i)} showTryBand={i === 0}/>
      ))}

      {chip && (
        <ExceptionChip G={G} cy={chip.cy} tone={chip.tone}
                       label={chip.tone === 'caught' ? 'fanget' : 'ValueError'}
                       sub={chip.tone === 'caught' ? null : 'int("hei")'}/>
      )}

      <OutputRow G={G} show={localTime >= outputAt}/>
    </>
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
        unntak
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25 }}>
        Stiger <span style={{ color: 'var(--amber-300)' }}>oppover</span>,
        ramme for ramme.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
                 color: 'var(--amber-300)' }}>
        raise → except → fortsett
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
