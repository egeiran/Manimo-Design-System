// nestede løkker — Manimo lesson scene.
// Chapter 5 of itgk (Løkker), depth-not-coverage companion to
// while-lokke-trace and for-lokke-range. A nested-for runs a 3×3
// multiplication table: i indexes rows, j indexes columns, the body
// drops i*j into the (i, j) cell. The misconception this corrects:
// students often guess "two loops = 3 + 3 = 6 iterations"; the truth
// is the inner loop rolls all the way around once for every outer
// step, so it is 3 × 3 = 9.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9     Manimo hook
//    9–22     Oppsett — code + empty 3×3 grid
//   22–47     Kjør — pointer walks 9 cells row-major, products land,
//             i/j/runder VarBoxes climb in lockstep (GENUINE MOTION)
//   47–57     Telling — full table + rule + 3 × 3 = 9 payoff
//   57–65     Takeaway
//
// Colour discipline:
//   chalk-100  primary code text, primary values
//   chalk-200  body text on dark, rule text
//   chalk-300  dimmed cells, row/col labels, hints
//   amber-400  pointer outline, body-line execution highlight
//   amber-300  payoff / readouts / settled cell values
//   teal-400   inner-loop accent (j header, j VarBox flash)
//   rose-400   outer-loop accent (i header, i VarBox flash)
//
// Milestones inside the motion beat are fractions of the sprite's
// actual duration so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no"
// scenes to ElevenLabs eleven_turbo_v2_5 with language_code "no" and
// voice Liam — multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 66;

const NARRATION = [
  /*  0– 9   */ 'En løkke inne i en løkke. Det høres rotete ut, men er regelen for nesten alle tabeller — den ytre teller radene, den indre teller kolonnene.',
  /*  9–22   */ 'Her er koden. Den ytre løkka går fra én til tre, og inni den gjør den indre det samme. I bunnen plasseres i ganger j i en celle. Spørsmålet er: hvor mange celler fylles?',
  /* 22–47   */ 'Sånn ser det ut når koden kjører. i er én, og j ruller gjennom én, to, tre — rad én fyller seg med én, to, tre. Så hopper i til to, og j starter på nytt fra én — rad to blir to, fire, seks. Til slutt blir rad tre tre, seks, ni. Den indre løkka ruller helt rundt for hver runde av den ytre.',
  /* 47–57   */ 'Telleverket lander på ni. Tre runder ganger tre runder gir ni iterasjoner — og hele gangetabellen står ferdig.',
  /* 57–65   */ 'Det er hele mønsteret. Ytre løkke teller hovedrundene, indre teller alle de små inni. Når du ser nestede løkker, tenk rad og kolonne.',
];

const NARRATION_AUDIO = 'audio/nestede-lokker/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const IS = [1, 2, 3];        // outer values
const JS = [1, 2, 3];        // inner values
const N_STEPS = IS.length * JS.length; // 9

// Steps ordered row-major: (i=1,j=1), (1,2), (1,3), (2,1), (2,2), (2,3), (3,1), (3,2), (3,3)
function stepCoord(step) {
  const r = Math.floor(step / JS.length);   // 0..2
  const c = step % JS.length;               // 0..2
  return { r, c, i: IS[r], j: JS[c] };
}

// Code shown in beats 2 and 3. Ligatures off so `=` stays as one glyph.
const CODE = [
  'for i in range(1, 4):',          // line 1 — outer header
  '    for j in range(1, 4):',      // line 2 — inner header
  '        tabell[i][j] = i * j',   // line 3 — body
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      // Code panel — top of canvas
      codeLeft: 56, codeTop: 250, codeFont: 22,
      // Grid — middle of canvas, headers around it
      cell: 88, pitch: 96, valueFont: 28,
      gridTop: 580, gridCx: 360,   // grid centered at x=360 (canvas w=720)
      labelFont: 18,
      // SoftPanel — bottom band
      panelLeft: 56, panelBottom: 200, panelW: 608,
      panelRight: null, panelTop: null,
    };
  }
  return {
    // Code panel — left side, ≈[64, 508] wide
    codeLeft: 64, codeTop: 220, codeFont: 24,
    // Grid — between code and panel; gridCx=680 puts grid x ≈ [535, 825]
    // (gap 27 px from code, 39 px from panel below).
    cell: 90, pitch: 100, valueFont: 30,
    gridTop: 250, gridCx: 680,
    labelFont: 18,
    // SoftPanel — right edge, width 360 → panel x ≈ [864, 1224]
    panelRight: 56, panelTop: 250, panelW: 360,
    panelLeft: null, panelBottom: null,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

// Grid geometry — return top-left of cell (r, c) and overall grid box.
function gridGeom(G) {
  const totalW = JS.length * G.pitch - (G.pitch - G.cell); // 3*100 - 10 = 290
  const totalH = IS.length * G.pitch - (G.pitch - G.cell);
  const x0 = Math.round(G.gridCx - totalW / 2);
  const y0 = G.gridTop;
  return { x0, y0, totalW, totalH };
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

function PanelEyebrow({ children, color = 'var(--amber-300)' }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color,
                  letterSpacing: '0.16em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

// A grid cell. state: 'pending' (dotted, empty) | 'active' (under pointer,
// post-body so value is in) | 'settled' (filled, amber, dim border).
function Cell({ G, gg, r, c, state, value, fadeDelay }) {
  const border =
    state === 'active' ? 'var(--amber-400)' :
    state === 'settled' ? 'rgba(232,220,193,0.22)' :
    'rgba(232,220,193,0.18)';
  const borderStyle = state === 'pending' ? 'dashed' : 'solid';
  const bg =
    state === 'active' ? 'rgba(244,184,96,0.18)' :
    state === 'settled' ? 'rgba(244,184,96,0.06)' :
    'rgba(0,0,0,0.30)';
  const valueColor =
    state === 'active' ? 'var(--amber-300)' :
    state === 'settled' ? 'var(--amber-300)' :
    'transparent';
  const node = (
    <div style={{
      position: 'absolute', left: gg.x0 + c * G.pitch, top: gg.y0 + r * G.pitch,
      width: G.cell, height: G.cell, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px ${borderStyle} ${border}`, borderRadius: 10,
      background: bg,
      fontFamily: 'var(--font-mono)', fontSize: G.valueFont, color: valueColor,
      transition: 'background 0.22s linear, border-color 0.22s linear, color 0.22s linear',
    }}>
      {value}
    </div>
  );
  if (fadeDelay != null) {
    return (
      <FadeUp duration={0.35} delay={fadeDelay} distance={8}
        style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%' }}>
        {node}
      </FadeUp>
    );
  }
  return node;
}

// Row + column labels around the grid. i runs down the left, j runs across the top.
function GridLabels({ G, gg, activeRow, activeCol }) {
  const labelColor = 'var(--chalk-300)';
  const rowActiveColor = 'var(--rose-300)';
  const colActiveColor = 'var(--teal-300)';
  return (
    <>
      {/* Column headers — j values across the top */}
      {JS.map((j, c) => (
        <div key={`col${c}`} style={{
          position: 'absolute',
          left: gg.x0 + c * G.pitch, top: gg.y0 - 32,
          width: G.cell, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: G.labelFont,
          color: c === activeCol ? colActiveColor : labelColor,
          transition: 'color 0.2s linear',
        }}>
          j={j}
        </div>
      ))}
      {/* Row headers — i values down the left */}
      {IS.map((i, r) => (
        <div key={`row${r}`} style={{
          position: 'absolute',
          left: gg.x0 - 48, top: gg.y0 + r * G.pitch,
          width: 40, height: G.cell,
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          fontFamily: 'var(--font-mono)', fontSize: G.labelFont,
          color: r === activeRow ? rowActiveColor : labelColor,
          transition: 'color 0.2s linear',
        }}>
          i={i}
        </div>
      ))}
    </>
  );
}

function VarBox({ name, value, flash, portrait, accent = 'amber' }) {
  const accentColor =
    accent === 'rose' ? 'var(--rose-400)' :
    accent === 'teal' ? 'var(--teal-400)' :
    'var(--amber-400)';
  const flashBg =
    accent === 'rose' ? 'rgba(232,122,144,0.18)' :
    accent === 'teal' ? 'rgba(232,220,193,0.10)' :
    'rgba(244,184,96,0.16)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: portrait ? 17 : 19, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        minWidth: portrait ? 76 : 84, padding: '8px 18px', textAlign: 'center', borderRadius: 10,
        border: `2px solid ${flash ? accentColor : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: portrait ? 28 : 30, color: 'var(--chalk-100)',
        background: flash ? flashBg : 'rgba(0,0,0,0.35)',
        transition: 'background 0.22s linear, border-color 0.22s linear',
      }}>
        {value === null ? '–' : value}
      </div>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="løkker"
      title="nestede løkker"
      duration={SCENE_DURATION}
      introEnd={10.37}
      introCaption="Den ytre venter, den indre ruller helt rundt."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.37} end={24.22}>
        <OppsettBeat/>
      </Sprite>

      <Sprite start={24.22} end={48.7}>
        <KjorBeat/>
      </Sprite>

      <Sprite start={48.7} end={55.62}>
        <TellingBeat/>
      </Sprite>

      <Sprite start={55.62} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Oppsett — code + empty grid ──────────────────────────────────
function OppsettBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const gg = gridGeom(G);

  // Fade cells in row-major, one staggered after the other (the grid takes
  // shape) but each lands EMPTY (pending state).
  return (
    <>
      <CodeBlock
        code={CODE}
        title="multiplikasjon.py"
        reveal="lines"
        accent="var(--amber-400)"
        fontSize={G.codeFont}
        duration={1.6}
        delay={0.3}
        style={codePos(G)}
      />

      <GridLabels G={G} gg={gg} activeRow={-1} activeCol={-1}/>

      {IS.map((_, r) => JS.map((_, c) => (
        <Cell key={`${r}-${c}`} G={G} gg={gg} r={r} c={c}
          state="pending" value=""
          fadeDelay={2.2 + (r * JS.length + c) * 0.18}/>
      )))}

      <FadeUp duration={0.5} delay={6.0} distance={8}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: gg.y0 + gg.totalH + 28, textAlign: 'center',
          fontFamily: 'var(--font-sans)', fontStyle: 'italic',
          fontSize: portrait ? 16 : 18, color: 'var(--chalk-300)',
        }}>
        tom rute — venter på at koden kjører.
      </FadeUp>

      <FadeUp duration={0.5} delay={8.0} distance={8}
        style={{
          position: 'absolute',
          ...(portrait
            ? { left: 0, right: 0, top: 1080, textAlign: 'center' }
            : { left: G.codeLeft, top: G.codeTop + 4 * G.codeFont + 80, maxWidth: 460,
                textAlign: 'left' }),
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 17 : 20, color: 'var(--chalk-200)',
        }}>
        Hvor mange celler fylles?
      </FadeUp>
    </>
  );
}

// ─── Beat 3: Kjør — nested-loop GENUINE MOTION ────────────────────────────
function KjorBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const gg = gridGeom(G);

  // Schedule: lead-in for the code+grid to register, nine evenly spaced
  // landings, brief hold at the end so the eye can settle on the full table.
  const T = Math.max(duration - 0.1, 1);
  const enterEnd = 0.10 * T;
  const tailHold = 0.10 * T;
  const runStart = enterEnd;
  const runEnd = T - tailHold;
  const perStep = (runEnd - runStart) / N_STEPS;

  // Continuous step coordinate.
  const sRaw = (localTime - runStart) / perStep;
  const s = clamp(sRaw, -0.2, N_STEPS + 0.0001);
  const started = sRaw >= 0;
  const finished = sRaw >= N_STEPS;
  const stepIdx = finished ? N_STEPS - 1 : Math.max(0, Math.floor(s));

  // Fraction inside the current step (0..1).
  const stepFrac = clamp(s - Math.floor(s), 0, 1);

  // i resets at the start of every outer iteration (j wraps 1→3 each time).
  // Phases inside a step:
  //   stepFrac < 0.10 AND isOuterStart  → outer header (line 1) flashes
  //   stepFrac < 0.22                   → inner header (line 2) flashes
  //   stepFrac >= 0.22                  → body (line 3) — value lands
  const current = stepCoord(stepIdx);
  const isOuterStart = current.c === 0;     // j just reset
  const onBody = started && !finished && stepFrac >= 0.22;
  const onInnerHeader = started && !finished && stepFrac >= (isOuterStart ? 0.10 : 0) && stepFrac < 0.22;
  const onOuterHeader = started && !finished && isOuterStart && stepFrac < 0.10;

  // i takes its row value when we enter the step; j takes its column value
  // as we leave the inner header.
  const iVal = !started ? null : current.i;
  const jVal = !started ? null : (onOuterHeader ? null : current.j);

  // Runde counter — total iterations completed (i.e. body has run for it).
  // Once the last step finishes, lock to N_STEPS so the tail beat doesn't
  // show "runde 8 av 9" while the ninth cell is visibly lit.
  const runder = !started ? 0 : finished ? N_STEPS : (onBody ? stepIdx + 1 : stepIdx);

  // Highlight flashes.
  const flashI = started && (onOuterHeader || (onInnerHeader && isOuterStart));
  const flashJ = started && !finished && (onInnerHeader || (onBody && stepFrac < 0.45));
  const flashRunder = started && onBody && stepFrac < 0.50;

  const highlightLine =
    !started ? '0' :
    onOuterHeader ? '1' :
    onInnerHeader ? '2' :
    '3';

  // Cell state — body has executed for steps strictly before stepIdx, and
  // for stepIdx itself once onBody. The current step (when active) shows the
  // amber outline; everything not yet reached is pending.
  const cellState = (r, c) => {
    if (!started) return 'pending';
    const k = r * JS.length + c;
    if (k < stepIdx) return 'settled';
    if (k === stepIdx) {
      if (finished) return 'settled';
      return onBody ? 'active' : 'active'; // active outline whether body has run or not
    }
    return 'pending';
  };
  const cellValue = (r, c) => {
    if (!started) return '';
    const k = r * JS.length + c;
    if (k < stepIdx) return IS[r] * JS[c];
    if (k === stepIdx && (onBody || finished)) return IS[r] * JS[c];
    return '';
  };

  const activeRow = !started || finished ? -1 : current.r;
  const activeCol = !started || finished ? -1 : (onOuterHeader ? -1 : current.c);

  const Panel = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
        <PanelEyebrow>kjøringen, celle for celle</PanelEyebrow>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--chalk-200)' }}>
          runde {runder} av {N_STEPS}
        </span>
      </div>
      <div style={{ display: 'flex', gap: portrait ? 16 : 18, alignItems: 'flex-end' }}>
        <VarBox name="i" value={iVal} flash={flashI} portrait={portrait} accent="rose"/>
        <VarBox name="j" value={jVal} flash={flashJ} portrait={portrait} accent="teal"/>
        <VarBox name="runder" value={runder} flash={flashRunder} portrait={portrait} accent="amber"/>
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
        color: 'var(--chalk-300)', lineHeight: 1.45,
      }}>
        Den indre løkka ruller hele runden — så hopper <span style={{ color: 'var(--rose-300)' }}>i</span> ett hakk.
      </div>
    </>
  );

  return (
    <>
      <CodeBlock
        code={CODE}
        title="multiplikasjon.py"
        reveal="all"
        highlight={highlightLine}
        accent="var(--amber-400)"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      <GridLabels G={G} gg={gg} activeRow={activeRow} activeCol={activeCol}/>

      {IS.map((_, r) => JS.map((_, c) => (
        <Cell key={`${r}-${c}`} G={G} gg={gg} r={r} c={c}
          state={cellState(r, c)} value={cellValue(r, c)}/>
      )))}

      {finished && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: gg.y0 - 64, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
          alle ni cellene fylt
        </FadeUp>
      )}

      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
    </>
  );
}

// ─── Beat 4: Telling — full table + 3 × 3 = 9 payoff ──────────────────────
function TellingBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const gg = gridGeom(G);
  const { localTime } = useSprite();

  const payoffAt = 3.6;
  const onPayoff = localTime >= payoffAt;

  return (
    <>
      <GridLabels G={G} gg={gg} activeRow={-1} activeCol={-1}/>

      {/* Settled multiplication table — all 9 cells lit. */}
      {IS.map((iv, r) => JS.map((jv, c) => (
        <Cell key={`${r}-${c}`} G={G} gg={gg} r={r} c={c}
          state="settled" value={iv * jv}/>
      )))}

      {/* Rule beneath the grid, then the 3 × 3 = 9 pill. */}
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: gg.y0 + gg.totalH + 36, textAlign: 'center',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '24ch' : '56ch',
          marginLeft: 'auto', marginRight: 'auto',
        }}>
        ytre runder × indre runder = totalt antall iterasjoner
      </FadeUp>

      <FadeUp duration={0.55} delay={payoffAt} distance={12}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: gg.y0 + gg.totalH + (portrait ? 100 : 86), textAlign: 'center',
        }}>
        <span style={{
          display: 'inline-flex', alignItems: 'baseline', gap: 12,
          padding: '10px 22px', borderRadius: 999,
          border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.10)',
          fontFamily: 'var(--font-mono)',
          fontSize: portrait ? 26 : 32, color: 'var(--amber-300)',
          fontVariantLigatures: 'none',
        }}>
          3 × 3 = 9
        </span>
      </FadeUp>

      {onPayoff && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: gg.y0 - 64, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
          gangetabellen, ferdig
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
        nestede løkker
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 36, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '34ch', lineHeight: 1.28 }}>
        Ytre teller <span style={{ color: 'var(--rose-300)' }}>hovedrunder</span>. Indre teller <span style={{ color: 'var(--teal-300)' }}>alle de små</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
          color: 'var(--amber-300)', fontVariantLigatures: 'none',
        }}>
        for i in ...: for j in ...: ...
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
