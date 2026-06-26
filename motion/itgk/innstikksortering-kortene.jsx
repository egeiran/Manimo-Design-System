// Innstikksortering: én og én på riktig plass — Manimo lesson scene.
// Chapter 11 of itgk (Rekursjon, sortering og søk). The first sorting scene in
// the ITGK library: how do you sort cards in your hand? Lift the next card,
// slide the larger ones to the right, drop the lifted card into the gap that
// opens up — repeat until the row is sorted. Six values [5,2,4,6,1,3] live
// on the board, a sorted-region highlight grows left-to-right, and the
// Python code block lights up the matching line at every substep.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–22     Oppsett — row appears, sorted region starts at one, code reveals
//   22–38     Mekanikken — one full insertion: lift 2, slide 5, drop 2 (GENUINE MOTION)
//   38–54     Resten — four more insertions to a fully sorted row (GENUINE MOTION)
//   54–62     Takeaway — løft → skyv → slipp
//
// Colour discipline:
//   chalk-100  card values, code text
//   chalk-300  dimmed code, hints
//   amber-400  sorted-region border, primary execution accent
//   amber-300  payoff / readouts, code-highlight bar
//   rose-400   the lifted card border (the one being placed)
//   teal-400   "ferdig" banner stroke
//
// Milestones inside motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam.

const SCENE_DURATION = 58;

const NARRATION = [
  /*  0–10  */ 'Hvordan sorterer du kort på hånden? Du plukker ett og ett, og smetter det inn på riktig plass blant dem du allerede har lagt fra deg.',
  /* 10–22  */ 'Vi starter med seks tall i tilfeldig rekkefølge. Det første har vi ingen jobb med — det er allerede sortert med seg selv. Resten må vi plukke opp og finne plassen til.',
  /* 22–38  */ 'Vi plukker opp neste tall, en toer. Den skal smettes inn blant de sorterte til venstre. Vi sammenligner med femmeren — femmeren er større, så vi skyver den ett hakk høyre, og toeren faller ned i hullet.',
  /* 38–54  */ 'Resten går likt. Firetallet smetter forbi femmeren. Sekseren blir stående der den er. Ettallet vandrer helt til venstre, forbi alle de større. Treeren stopper mellom to og fire. Da er hele rekka sortert.',
  /* 54–62  */ 'Det er hele trikset. Hold venstre side sortert, plukk neste, og skyv de større til høyre til det finner plassen sin.',
];

const NARRATION_AUDIO = 'audio/innstikksortering-kortene/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'for i in range(1, n):',           // 1  outer loop — pick next
  '    key = a[i]',                  // 2  lift
  '    j = i - 1',                   // 3  compare back
  '    while j >= 0 and a[j] > key:',// 4  while bigger to the left
  '        a[j + 1] = a[j]',         // 5  slide right
  '        j -= 1',                  // 6  step back
  '    a[j + 1] = key',              // 7  drop into the gap
].join('\n');

// ─── Values + helpers ──────────────────────────────────────────────────────
const VALUES = ['5', '2', '4', '6', '1', '3'];   // card identities (rendered values)
const N = VALUES.length;

// Each substep snapshot: where every value sits, plus highlight cues.
//   cells:        the column at each index (length N), or null for an empty gap
//   lifted:       the value floating above the row (or null)
//   liftedCol:    the column the lifted card hovers above
//   sortedSize:   how many of the leftmost columns are "sorted region"
//   codeLine:     which line (1..7) of CODE to highlight
//
// Beat 2 — Oppsett: cells settle into place, sorted region starts at one.
// Beat 3 — single insertion: insert a[1]=2 into [5].
const BEAT3_SCHEDULE = [
  { f: 0.00, cells: ['5','2','4','6','1','3'], lifted: null, liftedCol: null, sortedSize: 1, codeLine: 1 },
  { f: 0.18, cells: ['5', null, '4','6','1','3'], lifted: '2', liftedCol: 1, sortedSize: 1, codeLine: 2 },
  { f: 0.45, cells: [null, '5', '4','6','1','3'], lifted: '2', liftedCol: 0, sortedSize: 1, codeLine: 5 },
  { f: 0.72, cells: ['2','5','4','6','1','3'], lifted: null, liftedCol: null, sortedSize: 2, codeLine: 7 },
];

// Beat 4 — four more insertions: 4, 6, 1, 3 placed in order.
const BEAT4_SCHEDULE = [
  // Hold on the post-Beat-3 state for a moment so eyes can refocus.
  { f: 0.00, cells: ['2','5','4','6','1','3'], lifted: null, liftedCol: null, sortedSize: 2, codeLine: 1 },
  // Insert 4: lift, slide 5 right, drop.
  { f: 0.04, cells: ['2','5', null, '6','1','3'], lifted: '4', liftedCol: 2, sortedSize: 2, codeLine: 2 },
  { f: 0.11, cells: ['2', null, '5','6','1','3'], lifted: '4', liftedCol: 1, sortedSize: 2, codeLine: 5 },
  { f: 0.18, cells: ['2','4','5','6','1','3'], lifted: null, liftedCol: null, sortedSize: 3, codeLine: 7 },
  // Insert 6: lift, drop in place (no slide — already biggest).
  { f: 0.25, cells: ['2','4','5', null, '1','3'], lifted: '6', liftedCol: 3, sortedSize: 3, codeLine: 2 },
  { f: 0.34, cells: ['2','4','5','6','1','3'], lifted: null, liftedCol: null, sortedSize: 4, codeLine: 7 },
  // Insert 1: lift, cascade four cards right, drop at front.
  { f: 0.42, cells: ['2','4','5','6', null, '3'], lifted: '1', liftedCol: 4, sortedSize: 4, codeLine: 2 },
  { f: 0.55, cells: [null, '2','4','5','6','3'], lifted: '1', liftedCol: 0, sortedSize: 4, codeLine: 5 },
  { f: 0.63, cells: ['1','2','4','5','6','3'], lifted: null, liftedCol: null, sortedSize: 5, codeLine: 7 },
  // Insert 3: lift, cascade three cards right, drop at index 2.
  { f: 0.71, cells: ['1','2','4','5','6', null], lifted: '3', liftedCol: 5, sortedSize: 5, codeLine: 2 },
  { f: 0.82, cells: ['1','2', null, '4','5','6'], lifted: '3', liftedCol: 2, sortedSize: 5, codeLine: 5 },
  { f: 0.89, cells: ['1','2','3','4','5','6'], lifted: null, liftedCol: null, sortedSize: 6, codeLine: 7 },
];

function pickSubstep(schedule, frac) {
  let cur = schedule[0];
  for (const s of schedule) if (frac >= s.f) cur = s;
  return cur;
}

// Find which column (0..N-1) holds the given value in cells[], or null.
function colOf(value, cells) {
  for (let i = 0; i < cells.length; i++) if (cells[i] === value) return i;
  return null;
}

// ─── Layout ────────────────────────────────────────────────────────────────
function cardLayout(portrait) {
  if (portrait) {
    const cell = 84, pitch = 100;
    const rowWidth = (N - 1) * pitch + cell;
    return {
      cell, pitch,
      x0: Math.round((720 - rowWidth) / 2),
      rowY: 540, liftY: 380,
      codeLeft: 56, codeTop: 800, codeFont: 19, codeWidth: 608,
      hintY: 728, valueFont: 30,
      svgW: 720, svgH: 1280,
    };
  }
  const cell = 76, pitch = 92;
  return {
    cell, pitch,
    x0: 156, rowY: 330, liftY: 196,
    codeLeft: 760, codeTop: 200, codeFont: 20, codeWidth: 440,
    hintY: 470, valueFont: 28,
    svgW: 1280, svgH: 720,
  };
}

// ─── Single card (DOM) ─────────────────────────────────────────────────────
// Stays mounted across substeps so CSS transitions on left/top animate.
//   state: 'sorted' | 'unsorted' | 'lifted'
function Card({ G, value, left, top, state }) {
  const border =
    state === 'lifted' ? 'var(--rose-400)' :
    state === 'sorted' ? 'var(--amber-400)' :
    'rgba(232,220,193,0.30)';
  const background =
    state === 'lifted' ? 'rgba(232,122,144,0.16)' :
    state === 'sorted' ? 'rgba(244,184,96,0.10)' :
    'rgba(0,0,0,0.40)';
  const shadow = state === 'lifted'
    ? '0 12px 28px rgba(0,0,0,0.55)'
    : '0 4px 14px rgba(0,0,0,0.30)';
  return (
    <div style={{
      position: 'absolute', left, top,
      width: G.cell, height: G.cell, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px solid ${border}`, borderRadius: 12,
      background, boxShadow: shadow,
      fontFamily: 'var(--font-mono)', fontSize: G.valueFont,
      color: 'var(--chalk-100)',
      transition: 'left 0.55s cubic-bezier(.4,0,.2,1), top 0.40s cubic-bezier(.4,0,.2,1), border-color 0.30s linear, background 0.30s linear',
    }}>
      {value}
    </div>
  );
}

// Empty-slot ghost: dashed outline at a column where a card has been lifted,
// so the eye can read "this is where it came from / will land".
function Gap({ G, col, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute',
      left: G.x0 + col * G.pitch, top: G.rowY,
      width: G.cell, height: G.cell, boxSizing: 'border-box',
      border: '2px dashed rgba(232,220,193,0.30)', borderRadius: 12,
      transition: 'left 0.55s cubic-bezier(.4,0,.2,1)',
    }}/>
  );
}

// Up-pointing triangle marker beneath the lifted-card column.
function HoverMarker({ G, col, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute',
      left: G.x0 + col * G.pitch + G.cell / 2 - 9,
      top: G.rowY + G.cell + 6,
      width: 0, height: 0,
      borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
      borderBottom: '13px solid var(--rose-400)',
      transition: 'left 0.55s cubic-bezier(.4,0,.2,1)',
    }}/>
  );
}

// "sortert"-banner running underneath the sorted prefix.
function SortedBracket({ G, sortedSize, show }) {
  if (!show || sortedSize <= 0) return null;
  const x = G.x0 - 6;
  const w = (sortedSize - 1) * G.pitch + G.cell + 12;
  return (
    <div style={{
      position: 'absolute', left: x, top: G.rowY + G.cell + 28,
      width: w, height: 26, pointerEvents: 'none',
      transition: 'left 0.55s cubic-bezier(.4,0,.2,1), width 0.55s cubic-bezier(.4,0,.2,1)',
    }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, right: 0,
        borderTop: '2px solid var(--amber-300)',
        borderLeft: '2px solid var(--amber-300)',
        borderRight: '2px solid var(--amber-300)',
        borderRadius: '0 0 8px 8px', height: 10,
      }}/>
      <div style={{
        position: 'absolute', left: '50%', top: 11,
        transform: 'translateX(-50%)',
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
        letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        sortert
      </div>
    </div>
  );
}

function StatusLine({ G, text, show, portrait }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute',
      left: portrait ? G.codeLeft : G.x0,
      top: G.hintY,
      fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
      color: 'var(--chalk-300)', lineHeight: 1.5, maxWidth: portrait ? '48ch' : '40ch',
    }}>
      {text}
    </div>
  );
}

function codePos(G) {
  return {
    position: 'absolute', left: G.codeLeft, top: G.codeTop,
    width: G.codeWidth, fontVariantLigatures: 'none',
  };
}

// Render the whole 6-card row from a substep snapshot.
function CardBoard({ G, substep, portrait, statusText }) {
  return (
    <>
      <SortedBracket G={G} sortedSize={substep.sortedSize} show={substep.sortedSize > 0}/>
      <Gap G={G} col={substep.liftedCol} show={substep.lifted != null}/>
      <HoverMarker G={G} col={substep.liftedCol} show={substep.lifted != null}/>
      {VALUES.map((v) => {
        const isLifted = substep.lifted === v;
        const col = isLifted ? substep.liftedCol : colOf(v, substep.cells);
        if (col == null) return null;
        const left = G.x0 + col * G.pitch;
        const top = isLifted ? G.liftY : G.rowY;
        const inSorted = !isLifted && col < substep.sortedSize;
        const state = isLifted ? 'lifted' : (inSorted ? 'sorted' : 'unsorted');
        return <Card key={v} G={G} value={v} left={left} top={top} state={state}/>;
      })}
      <StatusLine G={G} portrait={portrait} text={statusText} show={!!statusText}/>
    </>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="sortering"
      title="Innstikksortering: én og én på riktig plass"
      duration={SCENE_DURATION}
      introEnd={8.57}
      introCaption="Ett og ett kort, inn på riktig plass."
    >
      <SceneNarration src={NARRATION_AUDIO}/>

      <Sprite start={8.57} end={19.76}>
        <OppsettBeat/>
      </Sprite>

      <Sprite start={19.76} end={34.4}>
        <MekanikkenBeat/>
      </Sprite>

      <Sprite start={34.4} end={49.17}>
        <RestenBeat/>
      </Sprite>

      <Sprite start={49.17} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Oppsett ───────────────────────────────────────────────────────
function OppsettBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = cardLayout(portrait);
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Cards stagger in, then the sorted region "claims" the first card.
  const settled = localTime >= at(0.50);
  const sortedSize = localTime >= at(0.45) ? 1 : 0;

  // Each card slides in from above to its starting column.
  return (
    <>
      <CodeBlock
        code={CODE} title="innstikk.py" reveal="lines"
        fontSize={G.codeFont} duration={4.0} delay={at(0.42)}
        style={codePos(G)}/>
      <SortedBracket G={G} sortedSize={sortedSize} show={settled}/>
      {VALUES.map((v, idx) => {
        const appearAt = at(0.05 + idx * 0.05);
        const visible = localTime >= appearAt;
        if (!visible) return null;
        const left = G.x0 + idx * G.pitch;
        const inSorted = settled && idx < sortedSize;
        const state = inSorted ? 'sorted' : 'unsorted';
        return (
          <FadeUp key={v} duration={0.40} delay={appearAt - localTime > -0.0001 ? 0 : 0} distance={14}
                  style={{ position: 'absolute', left, top: G.rowY }}>
            <Card G={G} value={v} left={0} top={0} state={state}/>
          </FadeUp>
        );
      })}
      <StatusLine
        G={G} portrait={portrait}
        text={settled
          ? 'Ett kort er allerede «sortert» — én lapp er trivielt på rett plass.'
          : 'Seks tall, ingen orden — ennå.'}
        show={localTime >= at(0.18)}/>
    </>
  );
}

// ─── Beat 3: Mekanikken (GENUINE MOTION) ───────────────────────────────────
function MekanikkenBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = cardLayout(portrait);
  const T = Math.max(duration - 1.5, 1);
  const frac = clamp(localTime / T, 0, 1);
  const substep = pickSubstep(BEAT3_SCHEDULE, frac);

  // A short caption that follows the action.
  const status =
    substep.lifted && substep.codeLine === 2 ? 'Løft toeren ut av rekka — hold den et sted å sammenligne fra.' :
    substep.lifted && substep.codeLine === 5 ? 'Femmeren er større, så den skyves ett hakk høyre.' :
    !substep.lifted && substep.sortedSize === 2 ? 'Toeren faller ned i hullet — to kort sortert.' :
    'Klar til å plukke neste kort.';

  return (
    <>
      <CodeBlock
        code={CODE} title="innstikk.py" reveal="all"
        highlight={String(substep.codeLine)}
        fontSize={G.codeFont} duration={0.3} delay={0}
        style={codePos(G)}/>
      <CardBoard G={G} substep={substep} portrait={portrait} statusText={status}/>
    </>
  );
}

// ─── Beat 4: Resten (GENUINE MOTION) ───────────────────────────────────────
function RestenBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = cardLayout(portrait);
  const T = Math.max(duration - 1.5, 1);
  const frac = clamp(localTime / T, 0, 1);
  const substep = pickSubstep(BEAT4_SCHEDULE, frac);
  const fullySorted = substep.sortedSize >= N;

  const status =
    fullySorted ? 'Hele rekka er sortert.' :
    substep.lifted === '4' ? 'Firetallet smetter forbi femmeren.' :
    substep.lifted === '6' ? 'Sekseren er allerede størst — den blir stående.' :
    substep.lifted === '1' ? 'Ettallet vandrer hele veien til venstre.' :
    substep.lifted === '3' ? 'Treeren stopper mellom to og fire.' :
    substep.sortedSize === 3 ? 'Tre kort sortert.' :
    substep.sortedSize === 4 ? 'Fire kort sortert.' :
    substep.sortedSize === 5 ? 'Fem kort sortert — ett igjen.' :
    'Klar til å plukke neste kort.';

  return (
    <>
      <CodeBlock
        code={CODE} title="innstikk.py" reveal="all"
        highlight={String(substep.codeLine)}
        fontSize={G.codeFont} duration={0.3} delay={0}
        style={codePos(G)}/>
      <CardBoard G={G} substep={substep} portrait={portrait} statusText={status}/>
      {fullySorted && (
        <FadeUp duration={0.5} delay={0.2} distance={10}
          style={{
            position: 'absolute',
            left: portrait ? G.codeLeft : G.x0,
            top: G.hintY + (portrait ? 40 : 36),
            display: 'flex', alignItems: 'baseline', gap: 14,
            padding: '8px 18px', borderRadius: 10,
            border: '1.5px solid var(--teal-400)', background: 'rgba(0,0,0,0.45)',
          }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal-400)',
                         letterSpacing: '0.16em', textTransform: 'uppercase' }}>
            ferdig
          </span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--chalk-100)',
                         fontVariantLigatures: 'none' }}>
            1, 2, 3, 4, 5, 6
          </span>
        </FadeUp>
      )}
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
        innstikk
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25 }}>
        Hold venstre side <span style={{ color: 'var(--amber-300)' }}>sortert</span> — plukk neste, skyv større.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        løft → skyv → slipp
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
