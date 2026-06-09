// Inni en while-løkke — Manimo lesson scene.
// Chapter 5 of itgk (Løkker). The core misconception: students read a loop as
// text, top to bottom, once. They don't see that *execution jumps back*. This
// scene traces `sum of 1..5` line by line with a live execution highlight that
// cycles condition → body → back to the top, while variable boxes tick upward
// round by round. The code stands still; the run goes in circles.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 6     Manimo hook
//    6–17     Kode — the program reveals line by line + the goal
//   17–33     Trace — execution marker cycles 3→4→5→3…, vars tick (GENUINE MOTION)
//   33–42     Exit — condition turns false, marker jumps past the body, prints 15
//   42–48     Takeaway
//
// Colour discipline:
//   chalk-100  code text, values
//   chalk-300  dimmed code, hints
//   amber-400  execution highlight, primary accent
//   amber-300  payoff / readouts
//   teal-400   condition true
//   rose-400   condition false / exit
//
// NOTE (Norwegian narration): this is the library's first `language: "no"`
// scene. generate-audio.js routes it to ElevenLabs eleven_turbo_v2_5 with
// language_code "no" and voice Liam — multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 59;

const NARRATION = [
  /*  0– 6  */ 'Hvordan får du en datamaskin til å gjøre det samme om og om igjen? Du skriver oppskriften én gang, og lar den gå i løkke.',
  /*  6–17  */ 'Her er et lite program som legger sammen tallene fra én til fem. Først settes i til én, og summen til null. Så kommer selve løkka: så lenge i er mindre enn eller lik fem, legger vi i til summen, og øker i med én.',
  /* 17–33  */ 'Følg den lyse linja. Programmet sjekker betingelsen, kjører kroppen, og hopper tilbake til toppen. Runde etter runde vokser summen, mens i teller seg oppover mot fem. Koden står stille, men kjøringen går i ring.',
  /* 33–42  */ 'Til slutt blir i seks. Da er betingelsen usann, løkka er ferdig, og programmet hopper forbi kroppen, videre til neste linje, og skriver ut femten.',
  /* 42–48  */ 'Det er hele hemmeligheten bak en while-løkke. Betingelsen sjekkes før hver eneste runde, og kroppen kjører bare så lenge den er sann.',
];

const NARRATION_AUDIO = 'audio/while-lokke-trace/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'i = 1',          // 1
  'sum = 0',        // 2
  'while i <= 5:',  // 3
  '    sum = sum + i', // 4
  '    i = i + 1',  // 5
  'print(sum)',     // 6
].join('\n');

// Execution schedule for the trace beat. Each step: the line that runs, plus
// the variable state *after* it has run. cond is set on while-line checks.
const TRACE_STEPS = (() => {
  const steps = [];
  steps.push({ ln: 1, i: 1, sum: null, cond: null, round: 0 });
  steps.push({ ln: 2, i: 1, sum: 0, cond: null, round: 0 });
  let sum = 0;
  for (let i = 1; i <= 5; i++) {
    steps.push({ ln: 3, i, sum, cond: true, round: i });
    sum += i;
    steps.push({ ln: 4, i, sum, cond: null, round: i });
    steps.push({ ln: 5, i: i + 1, sum, cond: null, round: i });
  }
  return steps; // 17 steps, ends at i=6, sum=15
})();

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  return portrait
    ? { codeLeft: 120, codeTop: 270, codeFont: 27,
        panelLeft: 56, panelBottom: 190, panelW: 608, panelTop: null, panelRight: null }
    : { codeLeft: 96, codeTop: 190, codeFont: 26,
        panelRight: 64, panelTop: 190, panelW: 430, panelLeft: null, panelBottom: null };
}

// Mono ligatures would render `<=` as a single `≤` glyph — wrong when the
// point is teaching the exact characters Python is written with.
function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function SoftPanel({ children, right, top, width = 420, left, bottom }) {
  const positioning = left != null || bottom != null
    ? { left, bottom }
    : { right, top };
  return (
    <div style={{
      position: 'absolute', width, ...positioning, pointerEvents: 'none',
      padding: '18px 22px', background: 'rgba(0,0,0,0.55)',
      border: '1px solid rgba(232,220,193,0.07)', borderRadius: 16,
      boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 12,
    }}>
      {children}
    </div>
  );
}

function PanelEyebrow({ children }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                  letterSpacing: '0.16em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

// A live variable box: serif-italic name above, mono value inside. Glows amber
// for a moment whenever its line has just executed.
function VarBox({ name, value, flash, portrait }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: portrait ? 17 : 19, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        minWidth: portrait ? 76 : 88, padding: '8px 18px', textAlign: 'center', borderRadius: 10,
        border: `2px solid ${flash ? 'var(--amber-400)' : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: portrait ? 28 : 32, color: 'var(--chalk-100)',
        background: flash ? 'rgba(244,184,96,0.16)' : 'rgba(0,0,0,0.35)',
        transition: 'background 0.25s linear, border-color 0.25s linear',
      }}>
        {value === null ? '–' : value}
      </div>
    </div>
  );
}

// Condition badge: «i ≤ 5 → sann/usann», teal when true, rose when false.
function CondBadge({ i, verdict, portrait }) {
  const truthy = verdict === true;
  const color = truthy ? 'var(--teal-400)' : 'var(--rose-400)';
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', gap: 10,
      padding: '8px 16px', borderRadius: 10,
      border: `1.5px solid ${color}`, background: 'rgba(0,0,0,0.35)',
      fontFamily: 'var(--font-mono)', fontSize: portrait ? 17 : 19,
    }}>
      <span style={{ color: 'var(--chalk-100)' }}>{i} ≤ 5</span>
      <span style={{ color: 'var(--chalk-300)' }}>→</span>
      <span style={{ color, fontWeight: 600 }}>{truthy ? 'sann' : 'usann'}</span>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="løkker"
      title="Inni en while-løkke"
      duration={SCENE_DURATION}
      introEnd={10.15}
      introCaption="Samme jobb, fem ganger — men skrevet bare én gang."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.15} end={24.64}>
        <KodeBeat/>
      </Sprite>

      <Sprite start={24.64} end={38.99}>
        <TraceBeat/>
      </Sprite>

      <Sprite start={38.99} end={49.26}>
        <ExitBeat/>
      </Sprite>

      <Sprite start={49.26} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Kode ──────────────────────────────────────────────────────────
function KodeBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  return (
    <>
      <CodeBlock
        code={CODE}
        title="sum_1_til_5.py"
        reveal="lines"
        fontSize={G.codeFont}
        duration={4.2}
        delay={0.3}
        style={codePos(G)}
      />
      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}><KodePanel portrait={portrait}/></SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}><KodePanel portrait={portrait}/></SoftPanel>}
    </>
  );
}

function KodePanel({ portrait }) {
  return (
    <>
      <FadeUp duration={0.45} delay={2.4} distance={8}>
        <PanelEyebrow>målet</PanelEyebrow>
      </FadeUp>
      <FadeUp duration={0.55} delay={2.8} distance={10}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 22 : 26, color: 'var(--chalk-100)' }}>
        1 + 2 + 3 + 4 + 5 = ?
      </FadeUp>
      <FadeUp duration={0.5} delay={4.4} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                 color: 'var(--chalk-300)', maxWidth: portrait ? '44ch' : '32ch', lineHeight: 1.5 }}>
        To variabler gjør jobben: <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>i</span> teller
        oppover, <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>sum</span> samler underveis.
      </FadeUp>
      <FadeUp duration={0.5} delay={6.2} distance={10}
        style={{ display: 'flex', gap: portrait ? 18 : 22 }}>
        <VarBox name="i" value={1} flash={false} portrait={portrait}/>
        <VarBox name="sum" value={0} flash={false} portrait={portrait}/>
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Trace (GENUINE MOTION) ────────────────────────────────────────
function TraceBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  // Scale the schedule to the actual beat length so audio rewire keeps the
  // choreography intact: small lead-in, all 17 steps, then a short hold.
  const startDelay = 0.6;
  const tailHold = 1.4;
  const n = TRACE_STEPS.length;
  const perStep = (duration - startDelay - tailHold) / n;
  const idx = clamp(Math.floor((localTime - startDelay) / perStep), 0, n - 1);
  const st = TRACE_STEPS[idx];
  const sinceStep = localTime - (startDelay + idx * perStep);
  const justRan = sinceStep < perStep * 0.55;

  const flashI = justRan && (st.ln === 1 || st.ln === 5);
  const flashSum = justRan && (st.ln === 2 || st.ln === 4);

  const Panel = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
        <PanelEyebrow>kjøringen, runde for runde</PanelEyebrow>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--chalk-200)' }}>
          runde {st.round} av 5
        </span>
      </div>
      <div style={{ display: 'flex', gap: portrait ? 18 : 22, alignItems: 'flex-end' }}>
        <VarBox name="i" value={st.i} flash={flashI} portrait={portrait}/>
        <VarBox name="sum" value={st.sum} flash={flashSum} portrait={portrait}/>
      </div>
      <div style={{ minHeight: portrait ? 40 : 44, display: 'flex', alignItems: 'center' }}>
        {st.cond != null
          ? <CondBadge i={st.i} verdict={st.cond} portrait={portrait}/>
          : <span style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14, color: 'var(--chalk-300)' }}>
              {st.ln === 4 ? 'kroppen: legg i til summen' : st.ln === 5 ? 'kroppen: øk telleren' : 'oppstart'}
            </span>}
      </div>
      <div style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 12 : 13,
                    color: 'var(--chalk-300)', lineHeight: 1.45 }}>
        Koden står stille — kjøringen går i ring.
      </div>
    </>
  );

  return (
    <>
      <CodeBlock
        code={CODE}
        title="sum_1_til_5.py"
        reveal="all"
        highlight={String(st.ln)}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />
      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
    </>
  );
}

// ─── Beat 4: Exit ──────────────────────────────────────────────────────────
function ExitBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  // Two-step mini-schedule: the failing check, then the jump to print.
  const checkAt = 0.4;
  const jumpAt = 2.6;
  const onPrint = localTime >= jumpAt;
  const ln = onPrint ? 6 : 3;

  const Panel = (
    <>
      <PanelEyebrow>siste sjekk</PanelEyebrow>
      <div style={{ display: 'flex', gap: portrait ? 18 : 22, alignItems: 'flex-end' }}>
        <VarBox name="i" value={6} flash={false} portrait={portrait}/>
        <VarBox name="sum" value={15} flash={false} portrait={portrait}/>
      </div>
      {localTime >= checkAt && (
        <CondBadge i={6} verdict={false} portrait={portrait}/>
      )}
      <FadeUp duration={0.45} delay={jumpAt} distance={8}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
                 color: 'var(--chalk-300)', lineHeight: 1.45 }}>
        Usann betingelse: hopp forbi kroppen, rett til neste linje.
      </FadeUp>
      <FadeUp duration={0.55} delay={jumpAt + 0.8} distance={10}
        style={{ display: 'flex', alignItems: 'baseline', gap: 12,
                 padding: '10px 18px', borderRadius: 10,
                 border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                       letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 30 : 34, color: 'var(--amber-300)' }}>15</span>
      </FadeUp>
    </>
  );

  return (
    <>
      <CodeBlock
        code={CODE}
        title="sum_1_til_5.py"
        reveal="all"
        highlight={String(ln)}
        accent={onPrint ? 'var(--amber-400)' : 'var(--rose-400)'}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />
      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
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
        while
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25 }}>
        Betingelsen sjekkes <span style={{ color: 'var(--amber-300)' }}>før hver eneste runde.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
                 color: 'var(--amber-300)' }}>
        sjekk → kjør kroppen → hopp tilbake
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
