// Grunn og dyp kopi: hva deler kopien fortsatt? — Manimo lesson scene.
// Chapter 8 of itgk (Lister og tupler), a depth companion to liste-referanser.
// Once the student knows that `b = a` shares the row, the next confusion is:
// `b = a.copy()` SHOULD give a real copy — and for flat lists it does. But if
// the list contains other lists, only the outer frame is fresh; the inner
// rows are shared. Mutate `a[0][0]` and both a and b flip in lockstep.
// `copy.deepcopy(a)` is the actual fix. The scene shows three matrix cards
// (a, b, c) — a shared-inner bracket between a and b, no link for c — and
// the genuine motion is two cells flipping together in beat 3, then only one
// flipping in beat 4.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9    Manimo hook
//    9–22    nestetData — a draws, b draws beside it, shared bracket links them
//   22–37    sjokket — a[0][0]=99 flips BOTH a's and b's (0,0) cells (GENUINE MOTION)
//   37–55    dypKopi — c materialises independent, then a[0][0]=100 flips only a (GENUINE MOTION)
//   55–65    Takeaway
//
// Colour discipline:
//   chalk-100  code text, primary values
//   chalk-200  cell name (idle), bracket text
//   chalk-300  dimmed text, hints, footer
//   amber-400  a card accent, beat-3 mutation pulse (matches a)
//   amber-300  payoff / output / takeaway
//   rose-400   shared-inner bracket (the surprise)
//   teal-400   b card (shallow copy), c card (deep copy) — both copies
//   teal-300   c "safe" emphasis
//
// Milestones inside motion beats are fractions of the sprite's actual
// duration, so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 70;

const NARRATION = [
  /*  0– 9 */ 'Du har lært at funksjonen list bygger en kopi av ei liste. Men hva om lista inneholder en annen liste? Da er det ikke alltid så enkelt som det ser ut.',
  /*  9–22 */ 'a er en liste med to lister inni: en og to, så tre og fire. Når vi kaller metoden copy på a, lages en ny ytre liste. Men inne i den lever de samme pekerne — så b og a deler de to indre listene.',
  /* 22–37 */ 'Vi endrer det første tallet i den første indre lista til nittini. Det er jo bare én indre liste der — så når vi skriver ut, viser både a og b nittini på samme plass. Metoden copy var ikke nok.',
  /* 37–55 */ 'Funksjonen deepcopy fra modulen copy lager nye kopier på alle nivåer. c får sine egne indre lister. Når vi nå setter det første tallet i a til hundre, ser bare a endringen. c er trygg.',
  /* 55–65 */ 'Copy gir deg en ny ytre liste. Deepcopy gir deg nye lister hele veien ned. Lager du en kopi av en nesta liste, må du tenke på hvor dypt det skal kopieres.',
];

const NARRATION_AUDIO = 'audio/grunn-vs-dyp-kopi/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'import copy',              // 1
  'a = [[1, 2], [3, 4]]',     // 2
  'b = a.copy()',             // 3
  'a[0][0] = 99',             // 4
  'print(a, b)',              // 5
  '',                          // 6
  'c = copy.deepcopy(a)',     // 7
  'a[0][0] = 100',            // 8
  'print(a, c)',              // 9
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 64, codeTop: 200, codeFont: 21,
      // Three matrix cards stacked vertically in portrait
      cardW: 200, cardH: 168,
      aX: 100, aY: 540,
      bX: 420, bY: 540,
      cX: 420, cY: 540, // c overlays b's position (b fades out in beat 4)
      // Output panel
      outX: 60, outY: 760, outW: 600, outFont: 18,
      svgW: 720, svgH: 1280,
      sharedX: 320, sharedY: 624, // shared-inner bracket midpoint (between a and b)
      sharedVertical: false,
    };
  }
  return {
    codeLeft: 56, codeTop: 180, codeFont: 22,
    cardW: 200, cardH: 168,
    aX: 480, aY: 200,
    bX: 760, bY: 200,
    cX: 1040, cY: 200,
    outX: 480, outY: 410, outW: 720, outFont: 22,
    svgW: 1280, svgH: 720,
    sharedX: 690, sharedY: 284, // between a and b
    sharedVertical: false,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

// ─── Matrix card ───────────────────────────────────────────────────────────
// Renders a labelled card showing a 2D list as a 2x2 grid of cells. Each cell
// flashes amber when its "(r,c)" key is present in `flashCells`. `accent`
// drives the card frame colour ("amber" | "teal" | "rose").
function MatrixCard({ x, y, w, h, name, rows, flashCells, accent = 'amber', opacity = 1, appearDelay = 0 }) {
  const accentColor =
    accent === 'amber' ? 'var(--amber-400)' :
    accent === 'teal'  ? 'var(--teal-400)'  :
    accent === 'rose'  ? 'var(--rose-400)'  :
                         'rgba(232,220,193,0.30)';
  const tintColor =
    accent === 'amber' ? 'var(--amber-300)' :
    accent === 'teal'  ? 'var(--teal-300)'  :
    accent === 'rose'  ? 'var(--rose-300)'  :
                         'var(--chalk-300)';
  return (
    <FadeUp duration={0.45} delay={appearDelay} distance={10}
            style={{ position: 'absolute', left: x, top: y, width: w, opacity }}>
      {/* label */}
      <div style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22,
        color: tintColor, textAlign: 'center', marginBottom: 6,
      }}>
        {name}
      </div>
      {/* frame + grid */}
      <div style={{
        width: w, height: h - 30, boxSizing: 'border-box',
        borderRadius: 12, border: `1.8px solid ${accentColor}`,
        background: 'rgba(0,0,0,0.35)',
        padding: 14, display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {rows.map((row, r) => (
          <div key={r} style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            {row.map((v, c) => {
              const flash = flashCells && flashCells.has(`${r},${c}`);
              return (
                <div key={c} style={{
                  flex: 1, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: 8, boxSizing: 'border-box',
                  border: `2px solid ${flash ? 'var(--amber-400)' : 'rgba(232,220,193,0.20)'}`,
                  background: flash ? 'rgba(244,184,96,0.18)' : 'rgba(0,0,0,0.25)',
                  fontFamily: 'var(--font-mono)', fontSize: 22,
                  color: flash ? 'var(--amber-300)' : 'var(--chalk-100)',
                  transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear',
                }}>
                  {v}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </FadeUp>
  );
}

// ─── Shared-inner bracket ──────────────────────────────────────────────────
// A dashed bracket spanning the gap between a and b cards, with a centred
// "samme indre" label. Pulses rose when `pulse` is true.
function SharedBracket({ G, show, pulse }) {
  if (!show) return null;
  const color = pulse ? 'var(--rose-400)' : 'rgba(232,220,193,0.55)';
  const labelColor = pulse ? 'var(--rose-300)' : 'var(--chalk-300)';
  // Two arms reach from the gap centre out to each card's inner edge.
  const portrait = G.svgW === 720;
  if (portrait) {
    // Portrait: a and b are horizontal neighbours; bracket is a horizontal bar between them
    const armY = G.aY + (G.cardH - 30) / 2 + 22;
    const cx = G.sharedX;
    const aRight = G.aX + G.cardW;
    const bLeft = G.bX;
    return (
      <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
           width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
        <line x1={aRight + 4} y1={armY} x2={cx - 8} y2={armY}
              stroke={color} strokeWidth={2} strokeDasharray="6 5"
              style={{ transition: 'stroke 0.25s linear' }}/>
        <line x1={cx + 8} y1={armY} x2={bLeft - 4} y2={armY}
              stroke={color} strokeWidth={2} strokeDasharray="6 5"
              style={{ transition: 'stroke 0.25s linear' }}/>
        <text x={cx} y={armY - 8} textAnchor="middle"
              fill={labelColor} fontFamily="var(--font-sans)" fontSize={13}
              style={{ transition: 'fill 0.25s linear' }}>
          samme indre
        </text>
      </svg>
    );
  }
  // Landscape: a and b are horizontal neighbours; bracket runs horizontally
  const armY = G.aY + (G.cardH - 30) / 2 + 22;
  const cx = G.sharedX;
  const aRight = G.aX + G.cardW;
  const bLeft = G.bX;
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
         width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
      <line x1={aRight + 4} y1={armY} x2={cx - 8} y2={armY}
            stroke={color} strokeWidth={2} strokeDasharray="6 5"
            style={{ transition: 'stroke 0.25s linear' }}/>
      <line x1={cx + 8} y1={armY} x2={bLeft - 4} y2={armY}
            stroke={color} strokeWidth={2} strokeDasharray="6 5"
            style={{ transition: 'stroke 0.25s linear' }}/>
      <text x={cx} y={armY - 8} textAnchor="middle"
            fill={labelColor} fontFamily="var(--font-sans)" fontSize={13}
            style={{ transition: 'fill 0.25s linear' }}>
        samme indre
      </text>
    </svg>
  );
}

function OutputRow({ G, text, show, fontSize }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX, top: G.outY, width: G.outW, boxSizing: 'border-box',
      display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 18px',
      borderRadius: 10, border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: fontSize ?? G.outFont,
                     color: 'var(--amber-300)', whiteSpace: 'pre' }}>{text}</span>
    </div>
  );
}

function Caption({ G, children, show, dy = 0 }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.outX + 4, top: G.outY + 70 + dy,
      fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--chalk-300)',
      maxWidth: '48ch', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="lister"
      title="Grunn og dyp kopi"
      duration={SCENE_DURATION}
      introEnd={11.02}
      introCaption="Kopierer du virkelig alt?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.02} end={27.07}>
        <NestetDataBeat/>
      </Sprite>

      <Sprite start={27.07} end={41.06}>
        <SjokketBeat/>
      </Sprite>

      <Sprite start={41.06} end={55.34}>
        <DypKopiBeat/>
      </Sprite>

      <Sprite start={55.34} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: nestetData ────────────────────────────────────────────────────
function NestetDataBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const line = localTime >= at(0.32) ? 3 : 2;
  const showB = localTime >= at(0.32);
  const showBracket = localTime >= at(0.50);
  const showCaption = localTime >= at(0.74);

  return (
    <>
      <CodeBlock code={CODE} title="kopi.py" reveal="all" highlight={String(line)}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <MatrixCard x={G.aX} y={G.aY} w={G.cardW} h={G.cardH} name="a"
                  rows={[[1, 2], [3, 4]]} accent="amber" appearDelay={at(0.05)}/>
      {showB && (
        <MatrixCard x={G.bX} y={G.bY} w={G.cardW} h={G.cardH} name="b"
                    rows={[[1, 2], [3, 4]]} accent="teal" appearDelay={0.05}/>
      )}
      <SharedBracket G={G} show={showBracket} pulse={false}/>
      <Caption G={G} show={showCaption}>
        Det ytre er en ny liste — <span style={{ color: 'var(--chalk-200)' }}>de indre rader deler de fortsatt</span>.
      </Caption>
    </>
  );
}

// ─── Beat 3: sjokket (GENUINE MOTION) ──────────────────────────────────────
function SjokketBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const mutateAt = at(0.18);
  const printAt = at(0.50);
  const line = localTime >= printAt ? 5 : 4;

  // Both a's (0,0) and b's (0,0) flip in lockstep after the mutation event
  const flashed = localTime >= mutateAt && localTime < mutateAt + 1.4;
  const valueChanged = localTime >= mutateAt;
  const aRows = [[valueChanged ? 99 : 1, 2], [3, 4]];
  const bRows = aRows; // they share the inner list
  const flashCells = flashed ? new Set(['0,0']) : new Set();
  const bracketPulse = localTime >= mutateAt && localTime < mutateAt + 1.6;

  return (
    <>
      <CodeBlock code={CODE} title="kopi.py" reveal="all" highlight={String(line)}
                 accent={line === 4 ? 'var(--rose-400)' : 'var(--amber-400)'}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <MatrixCard x={G.aX} y={G.aY} w={G.cardW} h={G.cardH} name="a"
                  rows={aRows} accent="amber" flashCells={flashCells} appearDelay={0}/>
      <MatrixCard x={G.bX} y={G.bY} w={G.cardW} h={G.cardH} name="b"
                  rows={bRows} accent="teal" flashCells={flashCells} appearDelay={0}/>
      <SharedBracket G={G} show={true} pulse={bracketPulse}/>
      <OutputRow G={G} text="[[99, 2], [3, 4]] [[99, 2], [3, 4]]"
                 show={localTime >= printAt}
                 fontSize={portrait ? 17 : 20}/>
      <Caption G={G} show={localTime >= at(0.74)}>
        Begge ser endringen — de <span style={{ color: 'var(--rose-300)' }}>deler den indre rada</span>.
      </Caption>
    </>
  );
}

// ─── Beat 4: dypKopi (GENUINE MOTION) ──────────────────────────────────────
function DypKopiBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const cAppear = at(0.10);
  const mutateAt = at(0.42);
  const printAt = at(0.68);

  let line = 7;
  if (localTime >= mutateAt) line = 8;
  if (localTime >= printAt) line = 9;

  // b fades away in this beat to make room for c (visual narrative: we've
  // moved on from b — now we compare a against c).
  const bOpacity = Math.max(0, 1 - (localTime - at(0.02)) / 0.6);

  const aValueChanged = localTime >= mutateAt; // a[0][0] becomes 100
  const aRows = [[aValueChanged ? 100 : 99, 2], [3, 4]];
  // c was snapshotted from a BEFORE the second mutation, so c keeps 99 always
  const cRows = [[99, 2], [3, 4]];

  const aFlash = aValueChanged && localTime < mutateAt + 1.4 ? new Set(['0,0']) : new Set();

  return (
    <>
      <CodeBlock code={CODE} title="kopi.py" reveal="all" highlight={String(line)}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <MatrixCard x={G.aX} y={G.aY} w={G.cardW} h={G.cardH} name="a"
                  rows={aRows} accent="amber" flashCells={aFlash} appearDelay={0}/>
      {bOpacity > 0.02 && (
        <MatrixCard x={G.bX} y={G.bY} w={G.cardW} h={G.cardH} name="b"
                    rows={[[99, 2], [3, 4]]} accent="teal" opacity={bOpacity} appearDelay={0}/>
      )}
      {/* Shared bracket between a and b dims out with b */}
      {bOpacity > 0.4 && <SharedBracket G={G} show={true} pulse={false}/>}
      {localTime >= cAppear && (
        <MatrixCard x={G.cX} y={G.cY} w={G.cardW} h={G.cardH} name="c"
                    rows={cRows} accent="teal" appearDelay={0}/>
      )}
      <OutputRow G={G} text="[[100, 2], [3, 4]] [[99, 2], [3, 4]]"
                 show={localTime >= printAt}
                 fontSize={portrait ? 17 : 20}/>
      <Caption G={G} show={localTime >= at(0.82)}>
        Bare a endrer seg — <span style={{ color: 'var(--teal-300)' }}>c er frikoblet</span>.
      </Caption>
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
        copy · deepcopy
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '32ch', lineHeight: 1.25 }}>
        Hvor <span style={{ color: 'var(--amber-300)' }}>dypt</span> vil du kopiere?
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        copy: nytt ytre · deepcopy: nytt hele veien ned
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
