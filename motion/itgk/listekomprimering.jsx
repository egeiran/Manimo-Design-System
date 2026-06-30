// Listekomprimering — Manimo lesson scene.
// Chapter 8 of itgk (Lister og tupler). The misconception this corrects:
// students think list comprehension is a brand-new concept. It's the
// same for-loop they already know, with the result-list constructor
// inlined into the loop expression. The scene runs the verbose form
// first (empty list + for + append), then the compact form on the SAME
// inputs so the eye sees identical data-model motion, then adds an
// `if`-filter to show how some elements are excluded mid-iteration.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9     Manimo hook
//    9–23     Lang variant — empty list + for + append (GENUINE MOTION)
//   23–37     Kort variant — same job, comprehension form (GENUINE MOTION)
//   37–49     Med filter — `if x%2==0` rejects odd values (GENUINE MOTION)
//   49–57     Takeaway
//
// Colour discipline:
//   chalk-100  code text, source-cell values, result-cell values
//   chalk-200  body text on dark
//   chalk-300  dimmed cells, hints, sub-labels
//   amber-400  pointer, body-line execution highlight, result-row accent
//   amber-300  payoff readouts, output banner
//   teal-400   source cells (the input row colour), for-clause tint
//   rose-400   rejected-by-filter values
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration, so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 77;

const NARRATION = [
  /*  0– 9  */ 'Du har en for-løkke som bygger en ny liste. Fire linjer kode. Plutselig ser du den samme jobben gjort i én linje, med klammeparenteser rundt. Er det magi?',
  /*  9–23  */ 'Først den lange varianten. Vi starter med en tom liste, vandrer over tallene én til fem, og legger kvadratet av hver verdi inn på slutten. Etter fem runder står kvadratene én, fire, ni, seksten og tjuefem på rad.',
  /* 23–37  */ 'Nå kortformen. Klammene rundt sier ny liste. Uttrykket foran sier hva som havner i hver celle. Resten er den samme løkka. Samme verdier flyr gjennom kvadrat-operasjonen og lander i den nye lista — samme resultat, færre linjer.',
  /* 37–49  */ 'Vi kan også filtrere underveis. Et if helt til slutt sier hvilke verdier som slipper gjennom. Nå blir bare partallene tatt med — én, tre og fem blir avvist, mens to og fire kvadreres og lander i lista. Resultatet er fire og seksten.',
  /* 49–57  */ 'Listekomprimering er ikke magi. Det er en for-løkke som bygger en ny liste, skrevet på én linje. Klammene rundt, uttrykket foran, løkka bak — eventuelt et filter på slutten.',
];

const NARRATION_AUDIO = 'audio/listekomprimering/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const SOURCE = [1, 2, 3, 4, 5];
const SQUARES = SOURCE.map((x) => x * x);                       // [1, 4, 9, 16, 25]
const EVEN_KEEP = SOURCE.map((x) => x % 2 === 0);               // F,T,F,T,F
const EVEN_RESULTS = SOURCE.filter((x) => x % 2 === 0).map((x) => x * x); // [4, 16]

// Verbose code shown in beat 2.
const CODE_LONG = [
  'tall = [1, 2, 3, 4, 5]',     // 1
  'kvadrater = []',             // 2
  'for x in tall:',             // 3
  '    kvadrater.append(x * x)', // 4
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
// Landscape: code on the LEFT (vertical column), data stage on the RIGHT,
// rows stacked vertically (source above, glyph middle, result below).
// Portrait: code at TOP, data stage centred BELOW. Same vertical stack.
function layoutGeom(portrait) {
  if (portrait) {
    return {
      // Code panel
      codeLeft: 56, codeTop: 220, codeW: 608, codeFont: 19,
      // Stage anchors
      stageLeft: 56, stageW: 608, cell: 64, pitch: 76,
      sourceY: 580, glyphY: 700, resultY: 820,
      glyphSize: 72,
      captionY: 940, infoY: 1000,
      canvasW: 720, canvasH: 1280,
    };
  }
  return {
    // Code panel
    codeLeft: 80, codeTop: 200, codeW: 500, codeFont: 22,
    // Stage anchors — right half of canvas
    stageLeft: 680, stageW: 540, cell: 72, pitch: 84,
    sourceY: 220, glyphY: 332, resultY: 444,
    glyphSize: 88,
    captionY: 560, infoY: 600,
    canvasW: 1280, canvasH: 720,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop,
           width: G.codeW, fontVariantLigatures: 'none' };
}

// Centre N cells in the stage area, return the x0 of the leftmost cell.
function rowX0(G, n) {
  const total = n * G.pitch - (G.pitch - G.cell);
  return G.stageLeft + Math.round((G.stageW - total) / 2);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Cells ────────────────────────────────────────────────────────────────
// One value cell. `accent` controls the border colour family; `state`
// controls visited/active/normal/dim.
function ValueCell({ x, y, w, h, value, accent = 'teal', state = 'normal', fontSize, opacity = 1 }) {
  const baseStroke = accent === 'teal' ? 'var(--teal-400)'
                   : accent === 'amber' ? 'var(--amber-400)'
                   : accent === 'rose'  ? 'var(--rose-400)'
                   : 'rgba(232,220,193,0.25)';
  const border =
    state === 'active'  ? 'var(--amber-400)' :
    state === 'visited' ? 'rgba(232,220,193,0.20)' :
    state === 'dim'     ? 'rgba(232,220,193,0.15)' :
    baseStroke;
  const flashBg = accent === 'rose' ? 'rgba(232,122,144,0.16)' : 'rgba(244,184,96,0.16)';
  const bg =
    state === 'active'  ? flashBg :
    state === 'visited' ? 'rgba(0,0,0,0.45)' :
    state === 'dim'     ? 'rgba(0,0,0,0.40)' :
    'rgba(0,0,0,0.35)';
  const valueColor =
    state === 'active'  ? 'var(--chalk-100)' :
    state === 'dim'     ? 'var(--chalk-300)' :
    state === 'visited' ? 'var(--chalk-300)' :
    'var(--chalk-100)';
  const op = state === 'dim' ? 0.55 * opacity : opacity;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: w, height: h, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px solid ${border}`, borderRadius: 10,
      background: bg,
      fontFamily: 'var(--font-mono)', fontSize, color: valueColor,
      opacity: op,
      transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear, opacity 0.4s linear',
    }}>
      {value}
    </div>
  );
}

// Empty placeholder cell — chalk-300 dashed outline.
function PlaceholderCell({ x, y, w, h }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box',
      border: '1.5px dashed rgba(232,220,193,0.18)', borderRadius: 10,
    }}/>
  );
}

function Pointer({ x, y, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 0, height: 0,
      borderLeft: '10px solid transparent', borderRight: '10px solid transparent',
      borderTop: '14px solid var(--amber-400)',
      transition: 'left 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
    }}/>
  );
}

// A travelling chip — lerps between two centres on an eased arc.
function FlyingChip({ from, to, t, value, w, h, accent = 'amber' }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const cx = from.x + (to.x - from.x) * e;
  const cy = from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * 22;
  const border = accent === 'rose' ? 'var(--rose-400)' : 'var(--amber-400)';
  const bg = accent === 'rose' ? 'rgba(232,122,144,0.16)' : 'rgba(244,184,96,0.18)';
  const color = accent === 'rose' ? 'var(--rose-300)' : 'var(--amber-300)';
  return (
    <div style={{
      position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      borderRadius: 10, border: `2px solid ${border}`,
      background: bg, boxShadow: '0 6px 18px rgba(0,0,0,0.45)',
      fontFamily: 'var(--font-mono)', fontSize: Math.round(h * 0.55), color,
    }}>
      {value}
    </div>
  );
}

// The (·)² glyph in the middle of beats 3 + 4.
function SquareGlyph({ x, y, w, h, active, label = '(·)²' }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `1.5px solid ${active ? 'var(--amber-400)' : 'rgba(232,220,193,0.30)'}`,
      borderRadius: 14,
      background: active ? 'rgba(244,184,96,0.10)' : 'rgba(0,0,0,0.30)',
      transition: 'background 0.25s linear, border-color 0.25s linear',
    }}>
      <span style={{
        fontFamily: 'var(--font-serif)', fontStyle: 'italic',
        fontSize: h * 0.48, color: active ? 'var(--amber-300)' : 'var(--chalk-200)',
        letterSpacing: '0.02em',
      }}>{label}</span>
    </div>
  );
}

function RowLabel({ x, y, text, color = 'var(--chalk-300)', portrait }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      fontFamily: 'var(--font-mono)', fontSize: portrait ? 11 : 12,
      letterSpacing: '0.18em', textTransform: 'uppercase', color,
    }}>
      {text}
    </div>
  );
}

// ─── A coloured-span code panel for the compact form (beats 3 + 4) ───────
function CompCodeLine({ segments, fontSize, style }) {
  return (
    <div style={{
      ...style,
      background: 'var(--bg-overlay)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 10,
      padding: 18,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
      fontFamily: 'var(--font-mono)', fontSize,
      lineHeight: 1.55,
      whiteSpace: 'pre',
      fontVariantLigatures: 'none',
    }}>
      {segments.map((s, i) => (
        <span key={i} style={{ color: s.color }}>{s.text}</span>
      ))}
    </div>
  );
}

// A small inline info bar BELOW the result row — replaces the SoftPanel.
function InfoBar({ G, portrait, items }) {
  return (
    <div style={{
      position: 'absolute',
      left: G.stageLeft, top: G.infoY, width: G.stageW,
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
      fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
      color: 'var(--chalk-300)', lineHeight: 1.45,
      pointerEvents: 'none',
    }}>
      {items.map((node, i) => <div key={i}>{node}</div>)}
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="lister"
      title="Listekomprimering"
      duration={SCENE_DURATION}
      introEnd={11.98}
      introCaption="Den lange løkka, presset ned til én linje."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={11.98} end={27.7}>
        <LangVariantBeat/>
      </Sprite>

      <Sprite start={27.7} end={45.81}>
        <KortVariantBeat/>
      </Sprite>

      <Sprite start={45.81} end={62.21}>
        <FilterBeat/>
      </Sprite>

      <Sprite start={62.21} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Lang variant — for + append builds the result row ────────────
function LangVariantBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  const x0 = rowX0(G, SOURCE.length);

  // Timing schedule, scaled to actual sprite duration.
  const T = Math.max(duration - 0.1, 1);
  const enterEnd = 0.14 * T;
  const tailHold = 0.10 * T;
  const runStart = enterEnd;
  const runEnd = T - tailHold;
  const perStep = (runEnd - runStart) / SOURCE.length;

  const sRaw = (localTime - runStart) / perStep;
  const s = clamp(sRaw, -0.2, SOURCE.length + 0.0001);
  const started = sRaw >= 0;
  const finished = sRaw >= SOURCE.length;
  const idx = finished ? SOURCE.length - 1 : Math.max(0, Math.floor(s));
  const stepFrac = clamp(s - Math.floor(s), 0, 1);

  // After ~18% of a step, the append has fired.
  const onBody = started && !finished && stepFrac > 0.18;
  const newCellsCount = !started ? 0 : (finished ? SOURCE.length : (onBody ? idx + 1 : idx));

  // Pointer position
  const pointerExact = !started ? 0 : clamp(s, 0, SOURCE.length - 1);
  const px = x0 + pointerExact * G.pitch + G.cell / 2 - 10;

  // Code highlight: line 3 (for header) on entry, line 4 (append) during body.
  const codeHi = !started ? '0' : (onBody ? '4' : '3');

  // x value follows the active source cell
  const xVal = !started ? null : SOURCE[idx];

  const srcState = (i) => {
    if (!started) return 'normal';
    if (finished) return i === SOURCE.length - 1 ? 'active' : 'visited';
    if (i < idx) return 'visited';
    if (i === idx) return 'active';
    return 'normal';
  };

  // The growing list, formatted for the info bar
  const listText = `[${SQUARES.slice(0, newCellsCount).join(', ')}]`;

  return (
    <>
      <CodeBlock
        code={CODE_LONG}
        title="kvadrater_lang.py"
        reveal="all"
        highlight={codeHi}
        accent="var(--amber-400)"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* Source row — chalk/teal cells with values 1..5 */}
      <RowLabel x={x0} y={G.sourceY - (portrait ? 24 : 26)} text="tall" portrait={portrait}/>
      {SOURCE.map((v, i) => (
        <ValueCell key={`src-${i}`}
          x={x0 + i * G.pitch} y={G.sourceY}
          w={G.cell} h={G.cell}
          value={v} accent="teal" state={srcState(i)} fontSize={Math.round(G.cell * 0.4)}/>
      ))}
      <Pointer x={px} y={G.sourceY - 28} show={started && !finished}/>

      {/* Result row — empty placeholders, fill amber cells as iterations progress */}
      <RowLabel x={x0} y={G.resultY - (portrait ? 24 : 26)} text="kvadrater" portrait={portrait}/>
      {SOURCE.map((_, i) => (
        i < newCellsCount
          ? <ValueCell key={`res-${i}`}
              x={x0 + i * G.pitch} y={G.resultY}
              w={G.cell} h={G.cell}
              value={SQUARES[i]} accent="amber"
              state={i === idx && onBody && stepFrac < 0.62 ? 'active' : 'normal'}
              fontSize={Math.round(G.cell * 0.4)}/>
          : <PlaceholderCell key={`res-${i}`}
              x={x0 + i * G.pitch} y={G.resultY} w={G.cell} h={G.cell}/>
      ))}

      {/* "ferdig" badge */}
      {finished && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: x0,
            top: G.resultY + G.cell + 12, width: SOURCE.length * G.pitch - (G.pitch - G.cell),
            textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
          fem runder · resultatet ligger på rad
        </FadeUp>
      )}

      {/* Inline info bar BELOW result row */}
      <InfoBar G={G} portrait={portrait} items={[
        (<>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>x </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--chalk-100)' }}>
            = {xVal === null ? '–' : xVal}
          </span>
          <span style={{ marginLeft: portrait ? 18 : 28 }}/>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>kvadrater </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>= {listText}</span>
        </>),
        (<>
          Hver runde: <span style={{ color: 'var(--chalk-100)' }}>x</span> tar verdien,
          {' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>append</span> legger
          {' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>x * x</span> bak.
        </>),
      ]}/>
    </>
  );
}

// ─── Beat 3: Kort variant — same job, comprehension form ──────────────────
function KortVariantBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  const x0 = rowX0(G, SOURCE.length);

  const T = Math.max(duration - 0.1, 1);
  const codeRevealEnd = 0.10 * T;
  const enterEnd = 0.18 * T;
  const tailHold = 0.10 * T;
  const runStart = enterEnd;
  const runEnd = T - tailHold;
  const perStep = (runEnd - runStart) / SOURCE.length;

  const sRaw = (localTime - runStart) / perStep;
  const s = clamp(sRaw, -0.2, SOURCE.length + 0.0001);
  const started = sRaw >= 0;
  const finished = sRaw >= SOURCE.length;
  const idx = finished ? SOURCE.length - 1 : Math.max(0, Math.floor(s));
  const stepFrac = clamp(s - Math.floor(s), 0, 1);

  // Per-step phases.
  const upStart = 0.05, upEnd = 0.30;
  const glyphHotStart = 0.30, glyphHotEnd = 0.45;
  const dnStart = 0.45, dnEnd = 0.78;

  const upT = (stepFrac - upStart) / (upEnd - upStart);
  const dnT = (stepFrac - dnStart) / (dnEnd - dnStart);
  const glyphActive = started && !finished
                   && stepFrac >= glyphHotStart && stepFrac < glyphHotEnd + 0.05;

  const landed = started && !finished && stepFrac > dnEnd;
  const newCellsCount = !started ? 0 : (finished ? SOURCE.length : (landed ? idx + 1 : idx));

  const pointerExact = !started ? 0 : clamp(s, 0, SOURCE.length - 1);
  const px = x0 + pointerExact * G.pitch + G.cell / 2 - 10;

  const srcState = (i) => {
    if (!started) return 'normal';
    if (finished) return i === SOURCE.length - 1 ? 'active' : 'visited';
    if (i < idx) return 'visited';
    if (i === idx) return 'active';
    return 'normal';
  };

  // Cell centres
  const cellCentre = (rowY, i) => ({
    x: x0 + i * G.pitch + G.cell / 2,
    y: rowY + G.cell / 2,
  });
  const sourceCentre = cellCentre(G.sourceY, idx);
  const resultCentre = cellCentre(G.resultY, idx);

  // Glyph in the middle, horizontally centred on the stage.
  const glyphX = G.stageLeft + (G.stageW - G.glyphSize) / 2;
  const glyphY = G.glyphY - (G.glyphSize - G.cell) / 2;
  const glyphAnchor = { x: glyphX + G.glyphSize / 2, y: glyphY + G.glyphSize / 2 };

  // Compact-form code panel — coloured spans for the structure.
  const compStyle = { position: 'absolute', left: G.codeLeft, top: G.codeTop, width: G.codeW };
  const compSegments = [
    { text: 'kvadrater = ', color: 'var(--chalk-100)' },
    { text: '[', color: 'var(--amber-300)' },
    { text: ' x * x', color: 'var(--chalk-100)' },
    { text: '   for x in tall', color: 'var(--teal-300)' },
    { text: ' ', color: 'var(--chalk-300)' },
    { text: ']', color: 'var(--amber-300)' },
  ];

  const annotShow = localTime >= codeRevealEnd;
  const listText = `[${SQUARES.slice(0, newCellsCount).join(', ')}]`;

  return (
    <>
      <CompCodeLine segments={compSegments} fontSize={G.codeFont + 2} style={compStyle}/>

      {/* Structural annotations under code fragments — fade in once after reveal */}
      {annotShow && (
        <>
          <FadeUp duration={0.45} delay={0.1} distance={6}
            style={{
              position: 'absolute', left: G.codeLeft + 22, top: G.codeTop + 64,
              fontFamily: 'var(--font-sans)', fontSize: portrait ? 11 : 12,
              color: 'var(--amber-300)', letterSpacing: '0.04em',
            }}>
            [ &nbsp;…&nbsp; ] — ny liste
          </FadeUp>
          <FadeUp duration={0.45} delay={0.4} distance={6}
            style={{
              position: 'absolute', left: G.codeLeft + 22, top: G.codeTop + 86,
              fontFamily: 'var(--font-sans)', fontSize: portrait ? 11 : 12,
              color: 'var(--chalk-300)', letterSpacing: '0.04em',
            }}>
            x * x — uttrykk per celle
          </FadeUp>
          <FadeUp duration={0.45} delay={0.7} distance={6}
            style={{
              position: 'absolute', left: G.codeLeft + 22, top: G.codeTop + 108,
              fontFamily: 'var(--font-sans)', fontSize: portrait ? 11 : 12,
              color: 'var(--teal-300)', letterSpacing: '0.04em',
            }}>
            for x in tall — den samme løkka
          </FadeUp>
        </>
      )}

      {/* Source row */}
      <RowLabel x={x0} y={G.sourceY - (portrait ? 24 : 26)} text="tall" portrait={portrait}/>
      {SOURCE.map((v, i) => (
        <ValueCell key={`src-${i}`}
          x={x0 + i * G.pitch} y={G.sourceY}
          w={G.cell} h={G.cell}
          value={v} accent="teal" state={srcState(i)} fontSize={Math.round(G.cell * 0.4)}/>
      ))}
      <Pointer x={px} y={G.sourceY - 28} show={started && !finished}/>

      {/* Transform glyph */}
      <SquareGlyph x={glyphX} y={glyphY} w={G.glyphSize} h={G.glyphSize} active={glyphActive}/>

      {/* Result row */}
      <RowLabel x={x0} y={G.resultY - (portrait ? 24 : 26)} text="kvadrater" portrait={portrait}/>
      {SOURCE.map((_, i) => (
        i < newCellsCount
          ? <ValueCell key={`res-${i}`}
              x={x0 + i * G.pitch} y={G.resultY}
              w={G.cell} h={G.cell}
              value={SQUARES[i]} accent="amber"
              state={i === idx && !landed ? 'active' : 'normal'}
              fontSize={Math.round(G.cell * 0.4)}/>
          : <PlaceholderCell key={`res-${i}`}
              x={x0 + i * G.pitch} y={G.resultY} w={G.cell} h={G.cell}/>
      ))}

      {/* Flight 1: source cell → glyph */}
      {started && !finished && upT > 0 && upT < 1 && (
        <FlyingChip
          from={sourceCentre} to={glyphAnchor} t={upT}
          value={SOURCE[idx]}
          w={Math.round(G.cell * 0.74)} h={Math.round(G.cell * 0.66)}
          accent="amber"
        />
      )}

      {/* Flight 2: glyph → result cell */}
      {started && !finished && dnT > 0 && dnT < 1 && (
        <FlyingChip
          from={glyphAnchor} to={resultCentre} t={dnT}
          value={SQUARES[idx]}
          w={Math.round(G.cell * 0.74)} h={Math.round(G.cell * 0.66)}
          accent="amber"
        />
      )}

      {/* Inline info below result row */}
      <InfoBar G={G} portrait={portrait} items={[
        (<>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>kvadrater </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>= {listText}</span>
          <span style={{ marginLeft: portrait ? 18 : 24, color: 'var(--chalk-300)' }}>
            runde {started ? Math.min(idx + 1, SOURCE.length) : 0} av {SOURCE.length}
          </span>
        </>),
        (<>Samme verdier, samme rekkefølge — bare uten den tomme lista og uten append.</>),
      ]}/>
    </>
  );
}

// ─── Beat 4: Med filter — odd values rejected, even ones squared ──────────
function FilterBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  const x0 = rowX0(G, SOURCE.length);

  const T = Math.max(duration - 0.1, 1);
  const enterEnd = 0.18 * T;
  const tailHold = 0.10 * T;
  const runStart = enterEnd;
  const runEnd = T - tailHold;
  const perStep = (runEnd - runStart) / SOURCE.length;

  const sRaw = (localTime - runStart) / perStep;
  const s = clamp(sRaw, -0.2, SOURCE.length + 0.0001);
  const started = sRaw >= 0;
  const finished = sRaw >= SOURCE.length;
  const idx = finished ? SOURCE.length - 1 : Math.max(0, Math.floor(s));
  const stepFrac = clamp(s - Math.floor(s), 0, 1);

  // Per-step phases: kept path (up → glyph → down) vs rejected (slide off).
  const keepUpStart = 0.05, keepUpEnd = 0.32;
  const keepGlyphStart = 0.32, keepGlyphEnd = 0.50;
  const keepDnStart = 0.50, keepDnEnd = 0.78;
  // Rejection is a brisk fall-off so by mid-step the chip is clearly off
  // the source cell — keeps the static snapshot legible too.
  const rejSlideStart = 0.05, rejSlideEnd = 0.42;

  const keep = SOURCE[idx] % 2 === 0;

  const upT = (stepFrac - keepUpStart) / (keepUpEnd - keepUpStart);
  const dnT = (stepFrac - keepDnStart) / (keepDnEnd - keepDnStart);
  const rejT = (stepFrac - rejSlideStart) / (rejSlideEnd - rejSlideStart);

  const glyphActive = keep && started && !finished
                   && stepFrac >= keepGlyphStart && stepFrac < keepGlyphEnd + 0.05;

  // Result count: an even-value landing increases the count.
  const keptBefore = SOURCE.slice(0, idx).filter((v) => v % 2 === 0).length;
  const thisLanded = keep && started && !finished && stepFrac > keepDnEnd;
  const landedTotal = !started ? 0
                    : (finished ? EVEN_RESULTS.length
                    : (thisLanded ? keptBefore + 1 : keptBefore));

  const pointerExact = !started ? 0 : clamp(s, 0, SOURCE.length - 1);
  const px = x0 + pointerExact * G.pitch + G.cell / 2 - 10;

  const srcState = (i) => {
    if (!started) return 'normal';
    if (finished) return EVEN_KEEP[i] ? 'visited' : 'dim';
    if (i < idx) return EVEN_KEEP[i] ? 'visited' : 'dim';
    if (i === idx) return 'active';
    return 'normal';
  };

  const cellCentre = (rowY, i) => ({
    x: x0 + i * G.pitch + G.cell / 2,
    y: rowY + G.cell / 2,
  });
  const sourceCentre = cellCentre(G.sourceY, idx);

  // Glyph centred on the stage.
  const glyphX = G.stageLeft + (G.stageW - G.glyphSize) / 2;
  const glyphY = G.glyphY - (G.glyphSize - G.cell) / 2;
  const glyphAnchor = { x: glyphX + G.glyphSize / 2, y: glyphY + G.glyphSize / 2 };

  // Result row: shorter (only EVEN_RESULTS.length slots). Left-anchored
  // under the source row's left edge so its alignment stays predictable.
  const resultLen = EVEN_RESULTS.length;
  const resultX0 = x0 + Math.round(((SOURCE.length - resultLen) * G.pitch) / 2);
  const resultCentre = {
    x: resultX0 + keptBefore * G.pitch + G.cell / 2,
    y: G.resultY + G.cell / 2,
  };

  // Rejected chip path: drop down-right below the source row, well clear of
  // the cell. The "AVVIST" tag sits down-LEFT so chip and label don't overlap.
  const rejToX = sourceCentre.x + G.pitch * 0.55;
  const rejToY = sourceCentre.y + G.cell * 1.6;

  // Compact code line — filter clause tinted teal-400.
  const compStyle = { position: 'absolute', left: G.codeLeft, top: G.codeTop, width: G.codeW };
  const compSegments = [
    { text: 'kvadrater = ', color: 'var(--chalk-100)' },
    { text: '[ ', color: 'var(--amber-300)' },
    { text: 'x * x', color: 'var(--chalk-100)' },
    { text: '\n  for x in tall', color: 'var(--teal-300)' },
    { text: '\n  if x % 2 == 0', color: 'var(--teal-400)' },
    { text: ' ', color: 'var(--chalk-300)' },
    { text: ']', color: 'var(--amber-300)' },
  ];

  return (
    <>
      <CompCodeLine segments={compSegments} fontSize={G.codeFont + 2} style={compStyle}/>

      {/* Source row */}
      <RowLabel x={x0} y={G.sourceY - (portrait ? 24 : 26)} text="tall" portrait={portrait}/>
      {SOURCE.map((v, i) => (
        <ValueCell key={`src-${i}`}
          x={x0 + i * G.pitch} y={G.sourceY}
          w={G.cell} h={G.cell}
          value={v} accent="teal" state={srcState(i)} fontSize={Math.round(G.cell * 0.4)}/>
      ))}
      <Pointer x={px} y={G.sourceY - 28} show={started && !finished}/>

      {/* Transform glyph */}
      <SquareGlyph x={glyphX} y={glyphY} w={G.glyphSize} h={G.glyphSize} active={glyphActive}/>

      {/* Result row — only resultLen slots, centred under the source row */}
      <RowLabel x={resultX0} y={G.resultY - (portrait ? 24 : 26)} text="kvadrater" portrait={portrait}/>
      {Array.from({ length: resultLen }).map((_, i) => (
        i < landedTotal
          ? <ValueCell key={`res-${i}`}
              x={resultX0 + i * G.pitch} y={G.resultY}
              w={G.cell} h={G.cell}
              value={EVEN_RESULTS[i]} accent="amber"
              state={i === keptBefore && !thisLanded ? 'active' : 'normal'}
              fontSize={Math.round(G.cell * 0.4)}/>
          : <PlaceholderCell key={`res-${i}`}
              x={resultX0 + i * G.pitch} y={G.resultY} w={G.cell} h={G.cell}/>
      ))}

      {/* Per-step flight — kept path */}
      {keep && started && !finished && upT > 0 && upT < 1 && (
        <FlyingChip
          from={sourceCentre} to={glyphAnchor} t={upT}
          value={SOURCE[idx]}
          w={Math.round(G.cell * 0.74)} h={Math.round(G.cell * 0.66)}
          accent="amber"
        />
      )}
      {keep && started && !finished && dnT > 0 && dnT < 1 && (
        <FlyingChip
          from={glyphAnchor} to={resultCentre} t={dnT}
          value={EVEN_RESULTS[keptBefore]}
          w={Math.round(G.cell * 0.74)} h={Math.round(G.cell * 0.66)}
          accent="amber"
        />
      )}
      {/* Rejected path */}
      {!keep && started && !finished && rejT > 0 && rejT < 1 && (
        <>
          <FlyingChip
            from={sourceCentre} to={{ x: rejToX, y: rejToY }} t={rejT}
            value={SOURCE[idx]}
            w={Math.round(G.cell * 0.74)} h={Math.round(G.cell * 0.66)}
            accent="rose"
          />
          <div style={{
            position: 'absolute',
            left: sourceCentre.x - G.pitch * 0.55 - 30,
            top: sourceCentre.y + G.cell * 1.0,
            width: 60, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 11 : 12,
            color: 'var(--rose-300)', letterSpacing: '0.10em',
            textTransform: 'uppercase',
            opacity: rejT < 0.4 ? rejT / 0.4 : 1 - (rejT - 0.4) * 1.2,
            pointerEvents: 'none',
          }}>
            avvist
          </div>
        </>
      )}

      {/* Inline info below result row */}
      <InfoBar G={G} portrait={portrait} items={[
        (<>
          <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>kvadrater </span>
          <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>
            = [{EVEN_RESULTS.slice(0, landedTotal).join(', ')}]
          </span>
        </>),
        (<>
          Et <span style={{ color: 'var(--teal-400)', fontFamily: 'var(--font-mono)' }}>if</span> til slutt
          {' '}bestemmer hvilke verdier som slipper gjennom.
          Partall <span style={{ color: 'var(--amber-300)' }}>slipper</span>, oddetall
          {' '}<span style={{ color: 'var(--rose-300)' }}>avvises</span>.
        </>),
      ]}/>
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
      width: portrait ? '88%' : 'auto',
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
                 letterSpacing: '0.18em', textTransform: 'uppercase' }}>
        listekomprimering
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '34ch', lineHeight: 1.25 }}>
        En for-løkke, presset ned til <span style={{ color: 'var(--amber-300)' }}>én linje</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 14 : 18,
          color: 'var(--amber-300)', fontVariantLigatures: 'none',
          textAlign: 'center', maxWidth: portrait ? '24ch' : '40ch', lineHeight: 1.4,
        }}>
        [ uttrykk  for x in xs  if betingelse ]
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
