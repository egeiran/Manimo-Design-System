// Dict eller liste? Ett oppslag mot mange — Manimo lesson scene.
// Chapter 9 of itgk (Dictionaries og sets). Two ways to look up the phone
// number for Per. The list version walks every contact, comparing names one
// by one until Per shows up in the sixth cell — six comparisons. The dict
// version sends the key 'Per' straight to its row via a hash gadget — one
// look-up, whether the table holds six contacts or six million. The same
// six-row table sits on screen for both beats so the access pattern is the
// only thing that changes.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–12     Manimo hook
//   12–25     Oppsettet — code reveals, six contact cells appear
//   25–39     Liste-søk — Per-chip walks cell-by-cell, counter climbs to 6 (GENUINE MOTION)
//   39–50     Dict-oppslag — Per-chip flies straight to row 5 via hash gadget (GENUINE MOTION)
//   50–58     Takeaway
//
// Colour discipline:
//   chalk-100  code text, code values
//   chalk-200  cell name (idle)
//   chalk-300  dimmed text, hint captions
//   amber-400  liste pointer, "match" border
//   amber-300  liste counter / payoff
//   rose-400   "miss" cell border (already checked, not Per)
//   teal-400   dict arrow, hash gadget
//   teal-300   dict counter / payoff
//
// Milestones inside motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 61;

const NARRATION = [
  /*  0–12  */ 'Du har en haug med kontakter, og du leter etter telefonnummeret til Per. Du kan bla deg gjennom listen din til du finner ham — eller du kan slå opp direkte. Hva er forskjellen egentlig?',
  /* 12–25  */ 'Vi har seks kontakter i to varianter: først som en liste med par av navn og nummer, så som en ordbok der navnet er nøkkelen. Begge formene holder akkurat samme data — vi vil finne nummeret til Per.',
  /* 25–39  */ 'Med listen må vi sjekke en og en. Vi sammenligner Ada med Per — nei. Ben — nei. Slik fortsetter vi nedover, og Per ligger sist i den sjette cellen. Seks sammenligninger for seks kontakter.',
  /* 39–50  */ 'Med en ordbok trenger vi ikke å lete. Nøkkelen Per fører oss rett til riktig celle. Ett oppslag, uansett om vi har seks eller seks millioner kontakter.',
  /* 50–58  */ 'Vil du slå opp en verdi gjennom en nøkkel, bruk en ordbok. Da går du fra orden n til konstant tid.',
];

const NARRATION_AUDIO = 'audio/dict-oppslag-vs-liste-sok/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const CONTACTS = [
  ['Ada', '934'],
  ['Ben', '412'],
  ['Cay', '918'],
  ['Dag', '201'],
  ['Eli', '557'],
  ['Per', '615'],
];
const TARGET_IDX = 5;

const CODE = [
  "# Som liste — gå gjennom",       // 1
  "for navn, tlf in kontakter:",    // 2
  "    if navn == 'Per':",          // 3
  "        print(tlf)",             // 4
  "",                                // 5
  "# Som dict — slå opp",           // 6
  "print(kontakter['Per'])",        // 7
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 70, codeTop: 200, codeFont: 22,
      cellsLeft: 150, cellsTop: 580,
      cellW: 440, cellH: 58, cellGap: 6,
      pointerColX: 130,
      counterTop: 970, outputTop: 1042,
      panelLeft: 70, panelW: 580,
      svgW: 720, svgH: 1280,
    };
  }
  return {
    codeLeft: 96, codeTop: 200, codeFont: 24,
    cellsLeft: 760, cellsTop: 170,
    cellW: 380, cellH: 58, cellGap: 6,
    pointerColX: 728,
    counterTop: 555, outputTop: 612,
    panelLeft: 760, panelW: 380,
    svgW: 1280, svgH: 720,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

function cellTopY(G, i) {
  return G.cellsTop + i * (G.cellH + G.cellGap);
}
function cellCenterY(G, i) {
  return cellTopY(G, i) + G.cellH / 2;
}

// clamp + Easing.easeOutCubic / Easing.easeInOutCubic come from animations.jsx
// (top-level scripts share the global scope, so duplicating them collides).

// ─── Contact cell (DOM) ────────────────────────────────────────────────────
const CELL_LOOK = {
  idle:      { border: 'rgba(232,220,193,0.30)', bg: 'rgba(0,0,0,0.32)',  nameColor: 'var(--chalk-200)', tlfColor: 'var(--chalk-300)' },
  visiting:  { border: 'var(--amber-400)',       bg: 'rgba(244,184,96,0.10)', nameColor: 'var(--chalk-100)', tlfColor: 'var(--chalk-200)' },
  miss:      { border: 'rgba(232,122,144,0.55)', bg: 'rgba(232,122,144,0.10)', nameColor: 'var(--rose-300)', tlfColor: 'var(--chalk-300)' },
  match:     { border: 'var(--amber-400)',       bg: 'rgba(244,184,96,0.22)', nameColor: 'var(--amber-300)', tlfColor: 'var(--amber-300)' },
  dictMatch: { border: 'var(--teal-400)',        bg: 'rgba(0,0,0,0.55)', nameColor: 'var(--teal-300)', tlfColor: 'var(--teal-300)' },
};

function ContactCell({ x, y, w, h, name, tlf, state, opacity = 1 }) {
  const s = CELL_LOOK[state] || CELL_LOOK.idle;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 22px', borderRadius: 10,
      border: `2px solid ${s.border}`, background: s.bg,
      opacity, transition: 'border-color 0.2s linear, background 0.2s linear',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: s.nameColor }}>
        {`'${name}'`}
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 22, color: s.tlfColor }}>
        {`'${tlf}'`}
      </span>
    </div>
  );
}

// ─── Pointer chip (the searched key, walking or flying) ────────────────────
// (x, y) places the chip's right tip at the cell-row centre.
function KeyChip({ x, y, color, label, opacity = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translate(-100%, -50%)',
      display: 'flex', alignItems: 'center', gap: 6,
      opacity,
    }}>
      <div style={{
        height: 36, padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, border: `2px solid ${color}`,
        background: 'rgba(0,0,0,0.55)', boxShadow: '0 4px 14px rgba(0,0,0,0.45)',
        fontFamily: 'var(--font-mono)', fontSize: 18, color,
      }}>
        {`'${label}'`}
      </div>
      <svg width={24} height={14} style={{ overflow: 'visible' }}>
        <line x1={0} y1={7} x2={14} y2={7} stroke={color} strokeWidth={2.4}/>
        <path d="M 12 0 L 24 7 L 12 14 z" fill={color}/>
      </svg>
    </div>
  );
}

// ─── Hash gadget (only the dict beat) — a small chip the key passes through ─
function HashBadge({ x, y, color, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      transform: 'translate(-100%, -50%)',
      padding: '4px 10px', borderRadius: 999,
      border: `1.5px solid ${color}`, background: 'rgba(0,0,0,0.55)',
      fontFamily: 'var(--font-mono)', fontSize: 11, color,
      letterSpacing: '0.16em', textTransform: 'uppercase',
    }}>
      hash → rad 6
    </div>
  );
}

// ─── Counter (live count of comparisons / lookups) ─────────────────────────
function Counter({ G, label, value, color, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.panelLeft, top: G.counterTop, width: G.panelW,
      display: 'flex', alignItems: 'baseline', gap: 12,
      fontFamily: 'var(--font-mono)',
    }}>
      <span style={{ fontSize: 11, color, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontSize: 30, color }}>{value}</span>
    </div>
  );
}

// ─── Output panel (the print result) ───────────────────────────────────────
function OutputRow({ G, text, color, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: G.panelLeft, top: G.outputTop, width: G.panelW, boxSizing: 'border-box',
      display: 'flex', alignItems: 'baseline', gap: 14, padding: '10px 18px',
      borderRadius: 10, border: `1.5px solid ${color}`, background: 'rgba(244,184,96,0.10)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color,
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        utskrift
      </span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 28, color }}>{text}</span>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="ordbøker"
      title="Dict eller liste? Ett oppslag mot mange"
      duration={SCENE_DURATION}
      introEnd={12.09}
      introCaption="Leter etter Per. Hvilken vei er kjappere?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={12.09} end={24.52}>
        <OppsettetBeat/>
      </Sprite>

      <Sprite start={24.52} end={39.87}>
        <ListeSokBeat/>
      </Sprite>

      <Sprite start={39.87} end={51.05}>
        <DictOppslagBeat/>
      </Sprite>

      <Sprite start={51.05} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Oppsettet ─────────────────────────────────────────────────────
function OppsettetBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;
  return (
    <>
      <CodeBlock code={CODE} title="kontakter.py" reveal="lines"
                 fontSize={G.codeFont} duration={4.5} delay={0.3}
                 style={codePos(G)}/>
      {CONTACTS.map(([name, tlf], i) => {
        const showAt = at(0.20) + i * 0.18;
        if (localTime < showAt) return null;
        return (
          <FadeUp key={i} duration={0.35} delay={0} distance={6}>
            <ContactCell x={G.cellsLeft} y={cellTopY(G, i)} w={G.cellW} h={G.cellH}
                         name={name} tlf={tlf} state="idle"/>
          </FadeUp>
        );
      })}
      {localTime >= at(0.80) && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: G.panelLeft, top: G.counterTop,
            width: G.panelW, fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15,
            color: 'var(--chalk-300)', lineHeight: 1.5,
          }}>
          Mål: finn <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--chalk-200)' }}>tlf</span> der <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--chalk-200)' }}>navn</span> er <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>'Per'</span>.
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 3: Liste-søk (GENUINE DATA-MODEL MOTION) ─────────────────────────
// The 'Per' chip walks down the cells. Each non-match cell stays rose-bordered
// once checked, the final Per cell glows amber. Counter ticks up to 6.
function ListeSokBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const enter = at(0.04);
  const visits = [0.10, 0.22, 0.34, 0.46, 0.58, 0.70].map(at);
  const matchSettle = at(0.80);
  const outputAt = at(0.86);

  // How many cells have been "touched" so far → counter value.
  let touched = 0;
  for (let i = 0; i < visits.length; i++) if (localTime >= visits[i]) touched = i + 1;

  // Pointer y as smooth interpolation between successive visits.
  let chipY;
  if (localTime < enter) {
    chipY = cellCenterY(G, 0) - 50;
  } else if (localTime < visits[0]) {
    const k = (localTime - enter) / (visits[0] - enter);
    chipY = cellCenterY(G, 0) - 50 + 50 * Easing.easeOutCubic(k);
  } else {
    // pause briefly at each cell, then slide
    let i = touched - 1;
    if (i >= visits.length - 1) {
      chipY = cellCenterY(G, visits.length - 1);
    } else {
      const settle = visits[i] + 0.35;
      if (localTime < settle) {
        chipY = cellCenterY(G, i);
      } else {
        const k = clamp((localTime - settle) / (visits[i + 1] - settle), 0, 1);
        chipY = cellCenterY(G, i) + (cellCenterY(G, i + 1) - cellCenterY(G, i)) * Easing.easeInOutCubic(k);
      }
    }
  }

  const cellStates = CONTACTS.map((_, i) => {
    if (localTime < visits[i]) return 'idle';
    // Each cell briefly amber when first visited, then resolves.
    const settle = visits[i] + 0.30;
    if (localTime < settle) return 'visiting';
    if (i === TARGET_IDX) {
      return localTime >= matchSettle ? 'match' : 'visiting';
    }
    return 'miss';
  });

  return (
    <>
      <CodeBlock code={CODE} title="kontakter.py" reveal="all" highlight="1,2,3,4"
                 fontSize={G.codeFont} duration={0.3} delay={0}
                 style={codePos(G)}/>
      {CONTACTS.map(([name, tlf], i) => (
        <ContactCell key={i} x={G.cellsLeft} y={cellTopY(G, i)} w={G.cellW} h={G.cellH}
                     name={name} tlf={tlf} state={cellStates[i]}/>
      ))}
      {localTime >= enter && (
        <KeyChip x={G.pointerColX} y={chipY} color="var(--amber-400)" label="Per"/>
      )}
      <Counter G={G} label="sammenligninger" value={touched}
               color="var(--amber-300)" show={localTime >= visits[0]}/>
      <OutputRow G={G} text="'615'" color="var(--amber-300)" show={localTime >= outputAt}/>
    </>
  );
}

// ─── Beat 4: Dict-oppslag (GENUINE DATA-MODEL MOTION) ──────────────────────
// The 'Per' chip flies diagonally from the upper-left straight to row 6
// without touching any other row. A hash badge appears mid-flight as a hint
// that the redirection is what makes the leap possible.
function DictOppslagBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const flyStart = at(0.10);
  const flyEnd = at(0.42);
  const hashShow = at(0.26);
  const hashHide = at(0.50);
  const matchAt = at(0.48);
  const counterAt = at(0.55);
  const outputAt = at(0.68);

  const perY = cellCenterY(G, TARGET_IDX);
  const endX = G.pointerColX;
  const startX = portrait ? -60 : -40;
  const startY = G.cellsTop - 80;

  const flyT = clamp((localTime - flyStart) / (flyEnd - flyStart), 0, 1);
  const e = Easing.easeOutCubic(flyT);
  const chipX = startX + (endX - startX) * e;
  const chipY = startY + (perY - startY) * e;

  // Hash badge sits at ~60 % along the flight (between start and target).
  const hashX = startX + (endX - startX) * 0.60;
  const hashY = startY + (perY - startY) * 0.60;

  const cellStates = CONTACTS.map((_, i) => {
    if (i === TARGET_IDX && localTime >= matchAt) return 'dictMatch';
    return 'idle';
  });

  const oppslag = localTime >= matchAt ? 1 : 0;

  return (
    <>
      <CodeBlock code={CODE} title="kontakter.py" reveal="all" highlight="6,7"
                 accent="var(--teal-400)"
                 fontSize={G.codeFont} duration={0.3} delay={0}
                 style={codePos(G)}/>
      {CONTACTS.map(([name, tlf], i) => (
        <ContactCell key={i} x={G.cellsLeft} y={cellTopY(G, i)} w={G.cellW} h={G.cellH}
                     name={name} tlf={tlf} state={cellStates[i]}/>
      ))}
      <HashBadge x={hashX} y={hashY} color="var(--teal-300)"
                 show={localTime >= hashShow && localTime < hashHide}/>
      {localTime >= flyStart && (
        <KeyChip x={chipX} y={chipY} color="var(--teal-400)" label="Per"/>
      )}
      <Counter G={G} label="oppslag" value={oppslag}
               color="var(--teal-300)" show={localTime >= counterAt}/>
      <OutputRow G={G} text="'615'" color="var(--teal-300)" show={localTime >= outputAt}/>
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
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--teal-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        dict · key → value
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '32ch', lineHeight: 1.25 }}>
        Slår du opp med en <span style={{ color: 'var(--teal-300)' }}>nøkkel</span> — bruk en dict.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        liste: orden n · dict: konstant tid
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
