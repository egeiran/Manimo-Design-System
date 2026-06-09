// Rekursjon: stabelen bak svaret — Manimo lesson scene.
// Chapter 11 of itgk (Rekursjon, sortering og søk). Recursion reads like a
// circular argument until you see the call stack. fakultet(4) physically
// stacks four frames on top of each other — each new call dims the one below
// to "venter" — until fakultet(1) hits the base case. Then the stack unwinds:
// return chips fly DOWN frame by frame, each waiting frame wakes up and shows
// its product (2·1=2, 3·2=6, 4·6=24), and 24 drops into print.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–24     Kode — definition reveals; base case vs the shrinking call
//   24–40     Nedover — frames stack up, callers wait (GENUINE MOTION)
//   40–57     Oppover — base case fires, chips fall home, 24 prints (GENUINE MOTION)
//   57–65     Takeaway
//
// Colour discipline:
//   chalk-100  code text, frame labels
//   chalk-300  waiting frames, hints
//   amber-400  active frame, execution highlight
//   amber-300  return chips, payoff
//   teal-400   the base case
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 65;

const NARRATION = [
  /*  0–10  */ 'En funksjon som kaller seg selv — er ikke det å gå i sirkel? Nei. Hvert kall er litt mindre enn det forrige, helt til ett av dem er så lite at svaret er opplagt.',
  /* 10–24  */ 'Fakultet av n er n ganger fakultet av n minus én. Og fakultet av én er bare én — det er basistilfellet. Legg merke til linje fire: funksjonen kaller seg selv, men alltid med et mindre tall.',
  /* 24–40  */ 'Fakultet av fire kan ikke svare med en gang — den trenger fakultet av tre først. Som trenger fakultet av to. Som trenger fakultet av én. Hvert kall får sin egen ramme, og rammene venter i kø, stablet oppå hverandre.',
  /* 40–57  */ 'Fakultet av én treffer basistilfellet og svarer én, uten nye kall. Da løsner stabelen. To ganger én er to. Tre ganger to er seks. Fire ganger seks er tjuefire — og svaret faller hele veien ned til print.',
  /* 57–65  */ 'Rekursjon er ikke magi. Det er ramme på ramme ned til basistilfellet — og så ett svar om gangen, hele veien hjem.',
];

const NARRATION_AUDIO = 'audio/rekursjon-kallstabel/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'def fakultet(n):',              // 1
  '    if n == 1:',                // 2
  '        return 1',              // 3
  '    return n * fakultet(n - 1)',// 4
  '',                              // 5
  'print(fakultet(4))',            // 6
].join('\n');

// Stack frames, index 0 = bottom (fakultet(4)) … 3 = top (fakultet(1)).
const FRAMES = [
  { label: 'fakultet(4)', waitsFor: 'fakultet(3)', expr: '4 · 6 = 24', returns: 24 },
  { label: 'fakultet(3)', waitsFor: 'fakultet(2)', expr: '3 · 2 = 6', returns: 6 },
  { label: 'fakultet(2)', waitsFor: 'fakultet(1)', expr: '2 · 1 = 2', returns: 2 },
  { label: 'fakultet(1)', waitsFor: null, expr: 'returnerer 1', returns: 1 },
];

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 60, codeTop: 180, codeFont: 19,
      stackX: 90, stackW: 540, frameH: 64, frameGap: 10, bottomY: 940,
      outX: 90, outY: 1024, outW: 540,
      svgW: 720, svgH: 1280,
    };
  }
  return {
    codeLeft: 80, codeTop: 180, codeFont: 22,
    stackX: 760, stackW: 440, frameH: 72, frameGap: 12, bottomY: 540,
    outX: 760, outY: 636, outW: 440,
    svgW: 1280, svgH: 720,
  };
}

function frameY(G, i) { return G.bottomY - i * (G.frameH + G.frameGap); }

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Stack pieces (DOM) ────────────────────────────────────────────────────
// state: 'active' (amber), 'waiting' (dim), 'base' (teal), 'gone' (hidden)
function StackFrame({ G, i, state, statusText }) {
  if (state === 'gone') return null;
  const borders = {
    active: 'var(--amber-400)',
    waiting: 'rgba(232,220,193,0.22)',
    base: 'var(--teal-400)',
  };
  const dim = state === 'waiting';
  return (
    <div style={{
      position: 'absolute', left: G.stackX, top: frameY(G, i), width: G.stackW, height: G.frameH,
      boxSizing: 'border-box', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between', padding: '0 18px',
      border: `1.5px solid ${borders[state]}`, borderRadius: 12,
      background: dim ? 'rgba(0,0,0,0.30)' : 'rgba(0,0,0,0.50)',
      opacity: dim ? 0.62 : 1,
      transition: 'opacity 0.35s linear, border-color 0.35s linear',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: G.frameH * 0.26,
                     color: dim ? 'var(--chalk-300)' : 'var(--chalk-100)' }}>
        {FRAMES[i].label}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: G.frameH * 0.22,
                     color: state === 'base' ? 'var(--teal-400)'
                          : state === 'active' ? 'var(--amber-300)' : 'var(--chalk-300)' }}>
        {statusText}
      </span>
    </div>
  );
}

// Return chip falling from frame i to frame i-1 (or to the output row).
function FallingChip({ G, fromI, toY, t, value }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const x = G.stackX + G.stackW - 60;
  const y0 = frameY(G, fromI) + G.frameH / 2;
  const cy = y0 + (toY - y0) * e;
  return (
    <div style={{
      position: 'absolute', left: x - 24, top: cy - 18, width: 52, height: 36,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 9, border: '2px solid var(--amber-400)',
      background: 'rgba(244,184,96,0.18)', boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      fontFamily: 'var(--font-mono)', fontSize: 20, color: 'var(--amber-300)',
    }}>
      {value}
    </div>
  );
}

function OutputRow({ G, text, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX, top: G.outY, width: G.outW, boxSizing: 'border-box',
      display: 'flex', alignItems: 'baseline', gap: 14, padding: '8px 18px',
      borderRadius: 10, border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--amber-300)' }}>{text}</span>
    </div>
  );
}

function StackLabel({ G, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.stackX + 2, top: frameY(G, 3) - 34,
      fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
      letterSpacing: '0.16em', textTransform: 'uppercase',
    }}>
      kallstabelen
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="rekursjon"
      title="Rekursjon: stabelen bak svaret"
      duration={SCENE_DURATION}
      introEnd={12.03}
      introCaption="Kan en funksjon kalle seg selv?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={12.03} end={27.62}>
        <KodeBeat/>
      </Sprite>

      <Sprite start={27.62} end={42.61}>
        <NedoverBeat/>
      </Sprite>

      <Sprite start={42.61} end={55.89}>
        <OppoverBeat/>
      </Sprite>

      <Sprite start={55.89} end={SCENE_DURATION}>
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
  const T = Math.max(duration - 1, 1);

  // Reveal first, then walk the narration: base case (2,3) → recursive call (4)
  const revealDone = 4.0;
  const hi = localTime < revealDone ? '' : (localTime < 0.62 * T ? '2,3' : '4');

  return (
    <>
      <CodeBlock code={CODE} title="fakultet.py"
                 reveal={localTime < revealDone ? 'lines' : 'all'}
                 highlight={hi}
                 fontSize={G.codeFont} duration={localTime < revealDone ? 3.4 : 0.3}
                 delay={localTime < revealDone ? 0.3 : 0} style={codePos(G)}/>
      <FadeUp duration={0.5} delay={0.62 * T} distance={8}
        style={{ position: 'absolute', left: G.stackX, top: portrait ? 900 : 300,
                 width: portrait ? G.stackW : 420,
                 fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
                 color: 'var(--chalk-300)', lineHeight: 1.55 }}>
        <span style={{ color: 'var(--teal-400)' }}>Basistilfellet</span> stopper fallet.<br/>
        <span style={{ color: 'var(--amber-300)' }}>Det rekursive kallet</span> krymper problemet.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Nedover (GENUINE MOTION) ──────────────────────────────────────
function NedoverBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const spawnAt = [at(0.10), at(0.32), at(0.54), at(0.76)];
  const spawned = spawnAt.filter(t => localTime >= t).length;

  return (
    <>
      <CodeBlock code={CODE} title="fakultet.py" reveal="all"
                 highlight={spawned > 0 ? '4' : '6'}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <StackLabel G={G} show={spawned > 0}/>
      {FRAMES.map((f, i) => {
        if (i >= spawned) return null;
        const isTop = i === spawned - 1;
        return (
          <StackFrame key={i} G={G} i={i}
                      state={isTop ? 'active' : 'waiting'}
                      statusText={isTop ? `n = ${4 - i}` : `venter på ${f.waitsFor}`}/>
        );
      })}
    </>
  );
}

// ─── Beat 4: Oppover (GENUINE MOTION) ──────────────────────────────────────
function OppoverBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Unwind schedule: base flash, then three chip flights down the stack,
  // then the final flight into print.
  const baseAt = at(0.06);
  const flights = [
    { start: at(0.20), end: at(0.30), fromI: 3, value: 1 },  // 1 → fakultet(2)
    { start: at(0.40), end: at(0.50), fromI: 2, value: 2 },  // 2 → fakultet(3)
    { start: at(0.60), end: at(0.70), fromI: 1, value: 6 },  // 6 → fakultet(4)
  ];
  const finalFlight = { start: at(0.80), end: at(0.88) };
  const outputAt = at(0.88);

  const line = localTime < at(0.18) ? '2,3' : (localTime >= at(0.78) ? '6' : '4');

  return (
    <>
      <CodeBlock code={CODE} title="fakultet.py" reveal="all" highlight={line}
                 accent={localTime < at(0.18) ? 'var(--teal-400)' : 'var(--amber-400)'}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <StackLabel G={G} show={true}/>

      {FRAMES.map((f, i) => {
        // Frame i is gone once the chip that left it has landed below.
        const flight = flights.find(fl => fl.fromI === i);
        if (flight && localTime >= flight.end) return null;
        if (i === 0 && localTime >= finalFlight.end) return null;

        let state = 'waiting';
        let status = `venter på ${f.waitsFor}`;
        if (i === 3) {
          state = localTime >= baseAt ? 'base' : 'active';
          status = localTime >= baseAt ? 'returnerer 1' : 'n = 1';
        } else {
          // A waiting frame wakes when the chip from above lands in it.
          const inbound = flights.find(fl => fl.fromI === i + 1);
          if (inbound && localTime >= inbound.end) {
            state = 'active';
            status = f.expr;
          }
        }
        return <StackFrame key={i} G={G} i={i} state={state} statusText={status}/>;
      })}

      {flights.map((fl, k) => (
        <FallingChip key={k} G={G} fromI={fl.fromI}
                     toY={frameY(G, fl.fromI - 1) + G.frameH / 2}
                     t={(localTime - fl.start) / (fl.end - fl.start)} value={fl.value}/>
      ))}
      <FallingChip G={G} fromI={0} toY={G.outY + 24}
                   t={(localTime - finalFlight.start) / (finalFlight.end - finalFlight.start)}
                   value={24}/>

      <OutputRow G={G} text="24" show={localTime >= outputAt}/>
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
        rekursjon
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 27 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Ned til <span style={{ color: 'var(--teal-400)' }}>basistilfellet</span> — så
        svar <span style={{ color: 'var(--amber-300)' }}>hele veien hjem.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)' }}>
        fakultet(4) → 4 · 3 · 2 · 1 = 24
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
