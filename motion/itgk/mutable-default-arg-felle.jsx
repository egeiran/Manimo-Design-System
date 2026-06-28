// Standardverdier lages én gang — Manimo lesson scene.
// Chapter 6 of itgk (Funksjoner, moduler og scope). The famous Python gotcha:
// `def legg_til(x, lst=[])` — the default `[]` is allocated ONCE when `def`
// runs, lives inside the function object, and is BORROWED by every call that
// doesn't pass its own list. So three calls without their own list visibly
// grow the SAME row to [1, 2, 3] — not three fresh [1], [2], [3]s as the
// student expects.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–11     Manimo hook
//   11–25     Kode — code + the misconception (expected [1] [2] [3])
//   25–39     Definisjonen kjører én gang — default [] lives in the function
//   39–58     Tre kall, samme liste (GENUINE MOTION) — shared list grows
//   58–67     Fix og takeaway — use lst=None
//
// Colour discipline:
//   chalk-100  code text, persistent values
//   chalk-200  secondary text, struck-through expected output
//   chalk-300  dimmed text, hints, expected-output label
//   amber-400  the function-object frame, the SHARED list (the trap colour)
//   amber-300  payoffs, output highlights, actual output rows
//   rose-400   the trap signal — "?" badge, the surprise caption
//   teal-400   the fix path (lst=None)
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration, so audio rewires keep the choreography aligned.

const SCENE_DURATION = 75;

const NARRATION = [
  /*  0–11  */ 'Du skriver en funksjon som legger et tall til ei liste, og du kaller den tre ganger uten å sende inn ei liste — og lista bare vokser. Hva er det som skjer?',
  /* 11–25  */ 'Funksjonen tar imot et tall og ei liste. Hvis ingen sender med ei liste, bruker vi en tom liste som standardverdi. Vi gjør tre kall — med én, med to, og med tre. Du venter kanskje at hver utskrift er én énverdig liste.',
  /* 25–39  */ 'Men hemmeligheten ligger her: def kjører bare én gang, og det er da den tomme lista blir laget. Den lever inne i funksjonsobjektet som standardverdi. Hver gang noen kaller uten å sende inn ei egen liste, lånes den samme.',
  /* 39–58  */ 'Første kall: vi sender inn én. Det legges til den delte lista, som nå er én. Andre kall: vi sender inn to. Lista var ikke fersk — den hadde allerede én. To legges på, og lista er nå én to. Tredje kall legger til tre, og lista er én to tre. Funksjonen husket ingenting — det var den samme lista hele veien.',
  /* 58–67  */ 'Vil du ha en frisk start hvert kall, bruk None som standard og lag lista inni funksjonen. Da fødes en ny liste hver gang du kaller — som du faktisk ventet.',
];

const NARRATION_AUDIO = 'audio/mutable-default-arg-felle/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'def legg_til(x, lst=[]):',  // 1
  '    lst.append(x)',          // 2
  '    return lst',             // 3
  '',                           // 4
  'print(legg_til(1))',         // 5
  'print(legg_til(2))',         // 6
  'print(legg_til(3))',         // 7
].join('\n');

const CODE_FIX = [
  'def legg_til(x, lst=None):',
  '    if lst is None:',
  '        lst = []',
  '    lst.append(x)',
  '    return lst',
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
// Absolute canvas coordinates so the flying chip can lerp between exact slot
// centres. Landscape puts code on the left, the function-object stage on the
// right; portrait stacks code over stage.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 70, codeTop: 200, codeFont: 21,
      // function-object frame (the "trap house" — contains the shared list)
      frameX: 60, frameY: 600, frameW: 600, frameH: 200,
      // shared-list row inside the function-object frame
      listX: 116, listY: 690, cellW: 56, cellH: 56, pitch: 64,
      // chip sources: roughly the line of code that issued the call
      callOriginX: 320, callOriginY: 392, callPitch: 32,
      // output panel
      outX: 60, outY: 850, outW: 600, outFont: 22,
      // expected-output (misconception) panel
      expX: 60, expY: 1010, expW: 600, expFont: 21,
      svgW: 720, svgH: 1280,
    };
  }
  return {
    codeLeft: 80, codeTop: 168, codeFont: 22,
    frameX: 670, frameY: 142, frameW: 540, frameH: 200,
    listX: 740, listY: 232, cellW: 58, cellH: 58, pitch: 66,
    callOriginX: 380, callOriginY: 354, callPitch: 32,
    outX: 670, outY: 392, outW: 540, outFont: 22,
    expX: 670, expY: 568, expW: 540, expFont: 20,
    svgW: 1280, svgH: 720,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Memory-stage pieces ─────────────────────────────────────────────────
// The "function-object" frame: a labelled bordered region inside which the
// shared default list lives. Title sits in a mono caps tag at the top-left.
function FuncFrame({ x, y, w, h, accent, opacity = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      border: `1.5px solid ${accent}`, borderRadius: 14,
      background: 'rgba(0,0,0,0.45)', boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
      opacity, transition: 'opacity 0.4s linear',
    }}>
      <div style={{
        position: 'absolute', left: 18, top: 12,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: accent,
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        funksjonsobjekt · legg_til
      </div>
      <div style={{
        position: 'absolute', left: 18, bottom: 14,
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: 16, color: 'var(--chalk-300)',
      }}>
        standardverdi · <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'normal', color: 'var(--chalk-200)' }}>lst</span>
      </div>
    </div>
  );
}

// Empty-list bracket placeholder inside the function frame, shown when the
// shared list has zero cells.
function EmptyListBracket({ G, opacity = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: G.listX, top: G.listY, width: G.cellW + 24, height: G.cellH,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-mono)', fontSize: 32, color: 'var(--chalk-300)',
      opacity, transition: 'opacity 0.4s linear',
    }}>
      [ ]
    </div>
  );
}

// A solid value cell in the shared list (DOM so it composes cleanly with the
// flying chip, which is also DOM).
function ListCell({ x, y, w, h, value, stroke = 'var(--amber-400)', textColor = 'var(--chalk-100)', flash = false }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, border: `2px solid ${stroke}`,
      fontFamily: 'var(--font-mono)', fontSize: Math.round(w * 0.42),
      color: textColor,
      background: flash ? 'rgba(244,184,96,0.16)' : 'rgba(0,0,0,0.35)',
      transition: 'background 0.25s linear',
    }}>
      {value}
    </div>
  );
}

// The travelling value: lerps from a call-line origin to the next free list
// slot on an eased arc. Visible only mid-flight.
function FlyingChip({ from, to, t, value, slotW, slotH }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const cx = from.x + (to.x + slotW / 2 - from.x) * e;
  const cy = from.y + (to.y + slotH / 2 - from.y) * e - Math.sin(Math.PI * e) * 40;
  return (
    <div style={{
      position: 'absolute', left: cx - 26, top: cy - 20, width: 52, height: 40,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, border: '2px solid var(--amber-400)',
      background: 'rgba(244,184,96,0.18)', boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      fontFamily: 'var(--font-mono)', fontSize: 24, color: 'var(--amber-300)',
    }}>
      {value}
    </div>
  );
}

function OutputRow({ x, y, w, text, show, fontSize, accent = 'var(--amber-400)', textColor = 'var(--amber-300)' }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, boxSizing: 'border-box',
      display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 18px',
      borderRadius: 10, border: `1.5px solid ${accent}`, background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: textColor,
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>utskrift</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: fontSize, color: textColor, whiteSpace: 'pre' }}>{text}</span>
    </div>
  );
}

function ExpectedRow({ G, show, strike, portrait }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.expX, top: G.expY, width: G.expW, boxSizing: 'border-box',
      padding: '10px 18px', borderRadius: 10,
      border: `1.5px dashed ${strike ? 'rgba(232,220,193,0.25)' : 'var(--rose-400)'}`,
      background: strike ? 'rgba(0,0,0,0.25)' : 'rgba(244,108,140,0.08)',
      display: 'flex', alignItems: 'baseline', gap: portrait ? 8 : 14, flexWrap: 'wrap',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11,
                     color: strike ? 'var(--chalk-300)' : 'var(--rose-300)',
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        forventet
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: G.expFont,
                     color: strike ? 'var(--chalk-300)' : 'var(--chalk-200)',
                     textDecoration: strike ? 'line-through' : 'none', whiteSpace: 'pre' }}>
        [1]   [2]   [3]
      </span>
      {!strike && (
        <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 18,
                       color: 'var(--rose-300)' }}>
          ?
        </span>
      )}
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="funksjoner"
      title="Standardverdier lages én gang"
      duration={SCENE_DURATION}
      introEnd={10.34}
      introCaption="Hvorfor husker funksjonen forrige kall?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.34} end={26.74}>
        <KodeBeat/>
      </Sprite>

      <Sprite start={26.74} end={42.05}>
        <DefinisjonenBeat/>
      </Sprite>

      <Sprite start={42.05} end={63.23}>
        <TreKallBeat/>
      </Sprite>

      <Sprite start={63.23} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Kode + forventning ───────────────────────────────────────────
function KodeBeat() {
  const { localTime } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  return (
    <>
      <CodeBlock
        code={CODE}
        title="legg_til.py"
        reveal="lines"
        fontSize={G.codeFont}
        duration={4.6}
        delay={0.3}
        style={codePos(G)}
      />
      <ExpectedRow G={G} show={localTime >= 5.2} strike={false} portrait={portrait}/>
      {localTime >= 5.2 && (
        <div style={{
          position: 'absolute', left: G.expX + 4, top: G.expY - 30,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '44ch', lineHeight: 1.5,
        }}>
          Du venter kanskje <span style={{ color: 'var(--chalk-200)' }}>tre friske lister</span>.
        </div>
      )}
    </>
  );
}

// ─── Beat 3: Definisjonen kjører én gang ──────────────────────────────────
function DefinisjonenBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const frameIn = at(0.10);
  const bracketIn = at(0.28);
  const captionAt = at(0.50);
  const pulseAt = at(0.74);

  // The relevant code line is the def itself (line 1).
  return (
    <>
      <CodeBlock
        code={CODE}
        title="legg_til.py"
        reveal="all"
        highlight={'1'}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {localTime >= frameIn && (
        <FuncFrame x={G.frameX} y={G.frameY} w={G.frameW} h={G.frameH} accent="var(--amber-400)"/>
      )}

      {localTime >= bracketIn && (
        <EmptyListBracket G={G}/>
      )}

      {localTime >= captionAt && (
        <div style={{
          position: 'absolute', left: G.frameX + 4, top: G.frameY + G.frameH + 14,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
          color: 'var(--chalk-300)', maxWidth: '44ch', lineHeight: 1.5,
        }}>
          Lista lever <span style={{ color: 'var(--chalk-200)' }}>i funksjonen</span> — én gang, ikke per kall.
        </div>
      )}

      {/* Pulse the empty bracket so the eye lands there before the calls arrive */}
      {localTime >= pulseAt && localTime < pulseAt + 1.6 && (
        <svg style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
             width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
          <PulseMark cx={G.listX + G.cellW / 2 + 12} cy={G.listY + G.cellH / 2}
                     color="var(--amber-400)" radius={4} pulseRadius={28}
                     duration={1.4} delay={0}/>
        </svg>
      )}
    </>
  );
}

// ─── Beat 4: Tre kall, samme liste (GENUINE MOTION) ───────────────────────
// THE motion beat. Three chips fly from successive call lines onto the SAME
// shared list living inside the function-object frame. The list grows
// monotonically; each call's output joins a stack on the side.
function TreKallBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Milestones — fractions of sprite duration so audio rewires stay aligned.
  const calls = [
    {
      line: 5, value: '1',
      hi: at(0.04), flyStart: at(0.10), flyEnd: at(0.21),
      printAt: at(0.23), nextLine: 6,
    },
    {
      line: 6, value: '2',
      hi: at(0.34), flyStart: at(0.39), flyEnd: at(0.50),
      printAt: at(0.52), nextLine: 7,
    },
    {
      line: 7, value: '3',
      hi: at(0.63), flyStart: at(0.68), flyEnd: at(0.79),
      printAt: at(0.81), nextLine: null,
    },
  ];

  // Which line is currently highlighted (line 0 = none).
  let activeLine = 5;
  for (const c of calls) if (localTime >= c.hi) activeLine = c.line;

  // How many cells have landed in the shared list — bumped on each flyEnd.
  let landed = 0;
  for (const c of calls) if (localTime >= c.flyEnd) landed++;

  // The currently in-flight chip, if any.
  let chip = null;
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    if (localTime >= c.flyStart && localTime < c.flyEnd) {
      const t = (localTime - c.flyStart) / (c.flyEnd - c.flyStart);
      chip = { value: c.value, t, slotIdx: i };
      break;
    }
  }

  // Flash the most-recently-landed cell briefly so the eye lands on the
  // newcomer instead of the row as a whole.
  let flashIdx = -1;
  for (let i = 0; i < calls.length; i++) {
    const c = calls[i];
    if (localTime >= c.flyEnd && localTime < c.flyEnd + 1.0) flashIdx = i;
  }

  const surpriseCaptionAt = at(0.86);

  // Call-line origins for the flying chip (rough vertical alignment with the
  // code line). Code starts at G.codeTop + an internal padding + title, with
  // lineHeight 1.55 × G.codeFont. We measure approximately.
  const codeRowPx = G.codeFont * 1.55;
  const titleOffset = Math.round(G.codeFont * 0.7) + 10 + 18; // title + marginBottom + panel padding
  const callY = (lineNum) => G.codeTop + titleOffset + (lineNum - 1) * codeRowPx + codeRowPx * 0.5;
  const callOrigin = (lineNum) => ({ x: G.callOriginX, y: callY(lineNum) });

  // Output stack — append one line per landed call. Each row sits below the
  // function-object frame.
  const outputs = calls.slice(0, calls.length).map((c, i) => {
    if (localTime < c.printAt) return null;
    const text = '[' + calls.slice(0, i + 1).map(cc => cc.value).join(', ') + ']';
    return { i, text };
  }).filter(Boolean);

  return (
    <>
      <CodeBlock
        code={CODE}
        title="legg_til.py"
        reveal="all"
        highlight={String(activeLine)}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      <FuncFrame x={G.frameX} y={G.frameY} w={G.frameW} h={G.frameH} accent="var(--amber-400)"/>

      {/* Empty-list bracket fades out as soon as the first cell lands */}
      {landed === 0 && <EmptyListBracket G={G}/>}

      {/* Landed cells of the shared list — persist across calls. */}
      {Array.from({ length: landed }).map((_, i) => (
        <ListCell key={i}
                  x={G.listX + i * G.pitch}
                  y={G.listY}
                  w={G.cellW} h={G.cellH}
                  value={calls[i].value}
                  flash={i === flashIdx}/>
      ))}

      {/* In-flight chip — visible only during its window. */}
      {chip && (
        <FlyingChip
          from={callOrigin(calls[chip.slotIdx].line)}
          to={{ x: G.listX + chip.slotIdx * G.pitch, y: G.listY }}
          t={chip.t}
          value={chip.value}
          slotW={G.cellW}
          slotH={G.cellH}/>
      )}

      {/* Output rows — stack underneath the function-object frame. */}
      {outputs.map((o) => {
        const row = portrait
          ? { left: G.outX, top: G.outY + o.i * 56, width: G.outW }
          : { left: G.outX, top: G.outY + o.i * 56, width: G.outW };
        return (
          <OutputRow key={o.i}
                     x={row.left} y={row.top} w={row.width}
                     text={o.text}
                     show={true}
                     fontSize={G.outFont}/>
        );
      })}

      {/* Surprise caption — the rose-coloured "samme liste" punchline. */}
      {localTime >= surpriseCaptionAt && (
        <div style={{
          position: 'absolute', left: G.outX + 4, top: G.outY + 3 * 56 + 12,
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 21,
          color: 'var(--rose-300)', maxWidth: portrait ? '32ch' : '34ch',
          lineHeight: 1.4,
        }}>
          Samme liste — den <span style={{ color: 'var(--rose-400)' }}>vokste mellom kallene</span>.
        </div>
      )}
    </>
  );
}

// ─── Beat 5: Fix + takeaway ────────────────────────────────────────────────
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
        def · standardverdier
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Standardverdier lages <span style={{ color: 'var(--amber-300)' }}>én gang</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={12}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 17,
          color: 'var(--chalk-200)', textAlign: 'left',
          background: 'rgba(0,0,0,0.4)', border: '1px solid var(--teal-400)', borderRadius: 10,
          padding: '14px 18px', maxWidth: portrait ? '36ch' : '44ch',
          whiteSpace: 'pre', fontVariantLigatures: 'none', lineHeight: 1.55,
        }}>
        {CODE_FIX}
      </FadeUp>
      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        None som standard · ny liste hver gang
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
