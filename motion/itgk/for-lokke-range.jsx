// for-løkka og range — Manimo lesson scene.
// Chapter 5 of itgk (Løkker), depth-not-coverage companion to while-lokke-trace.
// While walks a condition; for walks a sequence. range(1, 6) builds a ready-made
// row of five values, the for-loop pointer hops cell to cell, i takes whatever
// is in the cell, total climbs from 0 to 15. The misconception this corrects:
// students often think i ends up at 6 ("the stop value") — in fact i holds the
// LAST cell value, here 5, because the loop never assigns 6 (the stop is
// half-open).
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 8.5   Manimo hook
//    8.5–22   Range — the row of five teal cells gets built
//   22–41     for — pointer walks cells, i + total climb (GENUINE MOTION)
//   41–50     Etterpå — i=5 (rose), total=15, print
//   50–57     Takeaway
//
// Colour discipline:
//   chalk-100  code text, primary values
//   chalk-200  body text on dark
//   chalk-300  dimmed cells, hints, sub-labels
//   amber-400  pointer, body-line execution highlight
//   amber-300  payoff / readouts (total, utskrift)
//   teal-400   range cells (the sequence colour)
//   rose-400   the "i held 5, not 6" surprise
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 65;

const NARRATION = [
  /*  0– 8.5 */ 'Du har allerede en while-løkke. Hva gjør for-løkka så nyttig? Den lar deg gå gjennom en ferdig rekke verdier — én av gangen.',
  /*  8.5–22 */ 'Først lager vi rekka. range fra én til seks gir oss en ferdig rad med tallene én, to, tre, fire, fem. Den siste verdien er ikke med — rekka stopper akkurat før seks.',
  /* 22–41   */ 'Nå tar for-løkka over. For hver verdi i rekka, binder Python verdien til navnet i, og kjører kroppen. Pekeren flytter seg ett hakk, i tar den nye verdien, og summen vokser. Runde etter runde, til siste celle er besøkt.',
  /* 41–50   */ 'Når rekka er tom, er løkka ferdig. Variabelen i beholder den siste verdien — fem, ikke seks — og summen står på femten. Programmet skriver ut svaret.',
  /* 50–57   */ 'Og det er hele forskjellen. while-løkka sjekker en betingelse hver runde — for-løkka plukker verdier fra en ferdig rekke, helt til rekka er tom.',
];

const NARRATION_AUDIO = 'audio/for-lokke-range/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const VALUES = [1, 2, 3, 4, 5];
const STOP = 6;

// Cumulative total after each iteration: 0, 1, 3, 6, 10, 15.
const TOTAL_AFTER = (() => {
  const out = [0];
  let s = 0;
  for (const v of VALUES) { s += v; out.push(s); }
  return out;
})();

// Code shown in beats 3 and 4. ligatures off so `=` stays as one glyph.
const CODE = [
  'total = 0',                  // 1
  'for i in range(1, 6):',      // 2
  '    total = total + i',      // 3
].join('\n');

const CODE_WITH_PRINT = CODE + '\nprint(total)'; // line 4

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      // Code panel
      codeLeft: 56, codeTop: 250, codeFont: 22,
      // Range row
      cell: 76, pitch: 86, rowY: 720, valueFont: 26,
      // VarBox panel
      panelLeft: 56, panelBottom: 200, panelW: 608,
      panelRight: null, panelTop: null,
    };
  }
  return {
    // Code panel
    codeLeft: 80, codeTop: 200, codeFont: 26,
    // Range row
    cell: 80, pitch: 92, rowY: 480, valueFont: 28,
    // VarBox panel
    panelRight: 56, panelTop: 200, panelW: 410,
    panelLeft: null, panelBottom: null,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

// Row geometry — centred on the canvas width.
function rowGeom(G, portrait) {
  const total = VALUES.length * G.pitch - (G.pitch - G.cell);
  const canvasW = portrait ? 720 : 1280;
  return { x0: Math.round((canvasW - total) / 2), rowY: G.rowY };
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

// state: 'seed' (entry fade) | 'normal' | 'active' (under the pointer) |
//        'visited' (already consumed) | 'dim' (after the loop)
function RangeCell({ G, rg, i, state, fadeDelay }) {
  const border =
    state === 'active' ? 'var(--amber-400)' :
    state === 'visited' ? 'rgba(232,220,193,0.20)' :
    state === 'dim' ? 'rgba(232,220,193,0.15)' :
    'var(--teal-400)';
  const bg =
    state === 'active' ? 'rgba(244,184,96,0.16)' :
    state === 'visited' ? 'rgba(0,0,0,0.45)' :
    state === 'dim' ? 'rgba(0,0,0,0.40)' :
    'rgba(0,0,0,0.35)';
  const valueColor =
    state === 'active' ? 'var(--chalk-100)' :
    state === 'dim' ? 'var(--chalk-300)' :
    state === 'visited' ? 'var(--chalk-300)' :
    'var(--chalk-100)';
  const opacity = state === 'dim' ? 0.6 : 1;
  return (
    <FadeUp duration={0.4} delay={fadeDelay ?? 0} distance={10}
      style={{
        position: 'absolute', left: rg.x0 + i * G.pitch, top: rg.rowY,
        width: G.cell, height: G.cell, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${border}`, borderRadius: 10,
        background: bg,
        fontFamily: 'var(--font-mono)', fontSize: G.valueFont, color: valueColor,
        opacity,
        transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear, opacity 0.4s linear',
      }}>
      {VALUES[i]}
    </FadeUp>
  );
}

// Plain (no entry fade) — used in beats that re-mount the row.
function StaticCell({ G, rg, i, state }) {
  const border =
    state === 'active' ? 'var(--amber-400)' :
    state === 'visited' ? 'rgba(232,220,193,0.20)' :
    state === 'dim' ? 'rgba(232,220,193,0.15)' :
    'var(--teal-400)';
  const bg =
    state === 'active' ? 'rgba(244,184,96,0.16)' :
    state === 'visited' ? 'rgba(0,0,0,0.45)' :
    state === 'dim' ? 'rgba(0,0,0,0.40)' :
    'rgba(0,0,0,0.35)';
  const valueColor =
    state === 'active' ? 'var(--chalk-100)' :
    (state === 'dim' || state === 'visited') ? 'var(--chalk-300)' :
    'var(--chalk-100)';
  const opacity = state === 'dim' ? 0.6 : 1;
  return (
    <div style={{
      position: 'absolute', left: rg.x0 + i * G.pitch, top: rg.rowY,
      width: G.cell, height: G.cell, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px solid ${border}`, borderRadius: 10,
      background: bg,
      fontFamily: 'var(--font-mono)', fontSize: G.valueFont, color: valueColor,
      opacity,
      transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear, opacity 0.4s linear',
    }}>
      {VALUES[i]}
    </div>
  );
}

function Pointer({ G, rg, x, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: rg.rowY - 28,
      width: 0, height: 0,
      borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
      borderTop: '14px solid var(--amber-400)',
      transition: 'left 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
    }}/>
  );
}

function VarBox({ name, value, flash, portrait, accent = 'amber' }) {
  const accentColor = accent === 'rose' ? 'var(--rose-400)' : 'var(--amber-400)';
  const flashBg = accent === 'rose' ? 'rgba(232,122,144,0.18)' : 'rgba(244,184,96,0.16)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: portrait ? 17 : 19, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        minWidth: portrait ? 76 : 88, padding: '8px 18px', textAlign: 'center', borderRadius: 10,
        border: `2px solid ${flash ? accentColor : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: portrait ? 28 : 32, color: 'var(--chalk-100)',
        background: flash ? flashBg : 'rgba(0,0,0,0.35)',
        transition: 'background 0.25s linear, border-color 0.25s linear',
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
      title="for-løkka og range"
      duration={SCENE_DURATION}
      introEnd={9.49}
      introCaption="Én jobb per verdi — og rekka er allerede skrevet."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.49} end={23.24}>
        <RangeBeat/>
      </Sprite>

      <Sprite start={23.24} end={40.28}>
        <ForBeat/>
      </Sprite>

      <Sprite start={40.28} end={52.88}>
        <EtterpaaBeat/>
      </Sprite>

      <Sprite start={52.88} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Range builder ────────────────────────────────────────────────
function RangeBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const rg = rowGeom(G, portrait);

  // The range header sits centred horizontally above the row in portrait,
  // top-centred in landscape.
  const headerStyle = portrait
    ? { position: 'absolute', left: 0, right: 0, top: 250, textAlign: 'center', fontVariantLigatures: 'none' }
    : { position: 'absolute', left: 0, right: 0, top: 200, textAlign: 'center', fontVariantLigatures: 'none' };

  return (
    <>
      <FadeUp duration={0.5} delay={0.3} distance={10} style={headerStyle}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 36 : 46,
                       color: 'var(--chalk-100)' }}>
          range(1, 6)
        </span>
      </FadeUp>

      <FadeUp duration={0.45} delay={0.9} distance={8}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: (portrait ? 320 : 270),
          textAlign: 'center',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-300)',
        }}>
        en ferdig rekke verdier
      </FadeUp>

      {/* The five cells fade up one after another. */}
      {VALUES.map((_, i) => (
        <RangeCell key={i} G={G} rg={rg} i={i} state="normal"
          fadeDelay={1.6 + i * 0.45}/>
      ))}

      {/* Stop-value reminder: an open "(6)" ghost cell that fades in to the
          right of the row, then crosses out — "stopper før seks". */}
      <FadeUp duration={0.45} delay={5.0} distance={10}
        style={{
          position: 'absolute', left: rg.x0 + VALUES.length * G.pitch + 24, top: rg.rowY + G.cell / 2 - 18,
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26,
          color: 'var(--chalk-300)', fontStyle: 'italic',
          textDecoration: 'line-through', textDecorationColor: 'var(--rose-400)',
        }}>
        {STOP}
      </FadeUp>

      <FadeUp duration={0.45} delay={5.6} distance={8}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: rg.rowY + G.cell + 24, textAlign: 'center',
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)',
        }}>
        fra én, opp til <span style={{ color: 'var(--rose-300)' }}>men ikke med</span> seks — halvåpent intervall.
      </FadeUp>

      <FadeUp duration={0.5} delay={8.0} distance={8}
        style={{
          position: 'absolute', left: 0, right: 0,
          top: (portrait ? 1080 : rg.rowY + G.cell + 70), textAlign: 'center',
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
          maxWidth: portrait ? '24ch' : '36ch',
          marginLeft: 'auto', marginRight: 'auto',
        }}>
        range(a, b) bygger en ferdig rekke verdier.
      </FadeUp>
    </>
  );
}

// ─── Beat 3: For — pointer walks, i + total climb (GENUINE MOTION) ────────
function ForBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const rg = rowGeom(G, portrait);

  // Schedule: small entrance lead-in, then five evenly spaced iterations,
  // then a brief hold so the eye can settle on the final total. Scaled to
  // the sprite's actual duration so audio rewires keep choreography aligned.
  const T = Math.max(duration - 0.1, 1);
  const enterEnd = 0.16 * T;             // header/code/row settle by here
  const tailHold = 0.10 * T;             // hold on the last iteration
  const runStart = enterEnd;
  const runEnd = T - tailHold;
  const perStep = (runEnd - runStart) / VALUES.length;

  // Continuous step coordinate s ∈ [0, N] (so floor(s) gives the active idx).
  const sRaw = (localTime - runStart) / perStep;
  const s = clamp(sRaw, -0.2, VALUES.length + 0.0001);
  const started = sRaw >= 0;
  const finished = sRaw >= VALUES.length;
  const idx = finished ? VALUES.length - 1 : Math.max(0, Math.floor(s));

  // Fraction inside the current step (0..1). Used to flash the body line at
  // the start of each iteration.
  const stepFrac = clamp(s - Math.floor(s), 0, 1);
  const onBody = started && !finished && stepFrac > 0.18; // body has run
  const headerHighlight = started && !finished && !onBody;

  // i takes the cell's value as soon as the pointer lands. total reflects
  // the post-update value once the body has run.
  const iVal = !started ? null : VALUES[idx];
  const totalVal = !started ? 0 : (onBody ? TOTAL_AFTER[idx + 1] : TOTAL_AFTER[idx]);

  const flashI = started && !finished && stepFrac < 0.45;     // header line flash
  const flashTotal = started && !finished && stepFrac > 0.18 && stepFrac < 0.62; // body flash

  // Pointer position — glide between cells with a brief lerp at each hop.
  const pointerExact = !started ? 0 : clamp(s, 0, VALUES.length - 1);
  const px = rg.x0 + pointerExact * G.pitch + G.cell / 2 - 10;

  // Cell states: visited (i < idx) | active (i === idx) | normal (i > idx).
  const cellState = (i) => {
    if (!started) return 'normal';
    if (finished) return i === VALUES.length - 1 ? 'active' : 'visited';
    if (i < idx) return 'visited';
    if (i === idx) return 'active';
    return 'normal';
  };

  // Code highlight: line 2 (for-header) when landing, line 3 (body) once
  // the body has executed for the current step.
  const highlightLine = !started ? '0' : (headerHighlight ? '2' : '3');
  const codeAccent = 'var(--amber-400)';

  const Panel = (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', width: '100%' }}>
        <PanelEyebrow>kjøringen, runde for runde</PanelEyebrow>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--chalk-200)' }}>
          runde {started ? Math.min(idx + 1, VALUES.length) : 0} av {VALUES.length}
        </span>
      </div>
      <div style={{ display: 'flex', gap: portrait ? 18 : 22, alignItems: 'flex-end' }}>
        <VarBox name="i" value={iVal} flash={flashI} portrait={portrait}/>
        <VarBox name="total" value={totalVal} flash={flashTotal} portrait={portrait}/>
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
        color: 'var(--chalk-300)', lineHeight: 1.45,
      }}>
        For hver celle: pekeren hopper ett hakk, <span style={{ color: 'var(--chalk-100)' }}>i</span> tar verdien,
        <span style={{ color: 'var(--chalk-100)' }}> total</span> vokser.
      </div>
    </>
  );

  return (
    <>
      <CodeBlock
        code={CODE}
        title="for_sum.py"
        reveal="all"
        highlight={highlightLine}
        accent={codeAccent}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Range row — visited / active / normal */}
      {VALUES.map((_, i) => (
        <StaticCell key={i} G={G} rg={rg} i={i} state={cellState(i)}/>
      ))}

      {/* Walking pointer above the active cell */}
      <Pointer G={G} rg={rg} x={px} show={started && !finished}/>

      {/* "ferdig" badge after the last step */}
      {finished && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: rg.rowY - 60, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
          rekka er tom — løkka ferdig
        </FadeUp>
      )}

      {portrait
        ? <SoftPanel left={G.panelLeft} bottom={G.panelBottom} width={G.panelW}>{Panel}</SoftPanel>
        : <SoftPanel right={G.panelRight} top={G.panelTop} width={G.panelW}>{Panel}</SoftPanel>}
    </>
  );
}

// ─── Beat 4: Etterpå — i=5, total=15, print ────────────────────────────────
function EtterpaaBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const rg = rowGeom(G, portrait);

  const printAt = 3.0;
  const onPrint = localTime >= printAt;

  const Panel = (
    <>
      <PanelEyebrow>etter løkka</PanelEyebrow>
      <div style={{ display: 'flex', gap: portrait ? 18 : 22, alignItems: 'flex-end' }}>
        <VarBox name="i" value={5} flash={false} portrait={portrait} accent="rose"/>
        <VarBox name="total" value={15} flash={false} portrait={portrait}/>
      </div>
      <div style={{
        fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
        color: 'var(--chalk-300)', lineHeight: 1.45,
      }}>
        <span style={{ color: 'var(--rose-300)' }}>i</span> beholder den siste verdien — fem, ikke seks.
      </div>
      <FadeUp duration={0.55} delay={printAt} distance={10}
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
        code={CODE_WITH_PRINT}
        title="for_sum.py"
        reveal="all"
        highlight={onPrint ? '4' : '2'}
        accent={onPrint ? 'var(--amber-400)' : 'rgba(232,220,193,0.35)'}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Dimmed range row — the rekka is "tom" (all values consumed). */}
      {VALUES.map((_, i) => (
        <StaticCell key={i} G={G} rg={rg} i={i} state="dim"/>
      ))}

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
        for
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '34ch', lineHeight: 1.25 }}>
        for plukker verdier fra en <span style={{ color: 'var(--amber-300)' }}>ferdig rekke.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
          color: 'var(--amber-300)', fontVariantLigatures: 'none',
        }}>
        for i in range(...): ...
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
