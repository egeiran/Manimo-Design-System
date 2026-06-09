// To navn, én liste — Manimo lesson scene.
// Chapter 8 of itgk (Lister og tupler). The classic confusion: `b = a` looks
// like a copy. It isn't. The list lives in ONE place in memory; names are tags
// with arrows. The scene draws the memory diagram live: three cells appear,
// `a` points at them, `b = a` adds a second arrow to the SAME row, and when a
// 4 grows out of the row through `b`, printing `a` shows it too. The fix —
// `c = list(a)` — materialises a brand-new row, and a 9 appended there leaves
// the original untouched.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–25     Én liste — cells draw, a points, b = a adds a second arrow
//   25–38     Sjokket — 4 grows out via b, print(a) shows it (GENUINE MOTION)
//   38–53     Ekte kopi — list(a) builds a new row, 9 lands only there
//   53–62     Takeaway
//
// Colour discipline:
//   chalk-100  code text, cell values
//   chalk-200  name tags, arrows
//   chalk-300  dimmed text, hints
//   amber-400  execution highlight, original row
//   amber-300  payoff / output
//   rose-400   the appended 4 (the shock)
//   teal-400   the genuine copy row
//
// Milestones inside beats are fractions of the sprite's actual duration so
// audio rewires keep the choreography aligned.

const SCENE_DURATION = 57;

const NARRATION = [
  /*  0–10  */ 'Du kopierer en liste med et likhetstegn, tror du. Så endrer du kopien — og originalen endrer seg også. Hva er det som skjer?',
  /* 10–25  */ 'a er en liste med tre tall. Selve lista bor ett sted i minnet, og navnet a er bare en lapp som peker dit. Når vi skriver b er lik a, lages det ingen ny liste — bare en lapp til, som peker på den samme.',
  /* 25–38  */ 'Nå legger vi til et firetall gjennom b. Men det finnes jo bare én liste. Så når vi etterpå skriver ut a, er firetallet der — selv om a aldri ble nevnt.',
  /* 38–53  */ 'Vil du ha en ekte kopi, må du be om den. List bygger en helt ny liste med de samme verdiene, og c peker på den nye. Nå havner nitallet bare hos c — og a er trygg.',
  /* 53–62  */ 'Likhetstegnet kopierer pila, ikke lista. Husk det, så slutter lister å overraske deg.',
];

const NARRATION_AUDIO = 'audio/liste-referanser/scene.mp3';

// ─── The program ───────────────────────────────────────────────────────────
const CODE = [
  'a = [1, 2, 3]',  // 1
  'b = a',          // 2
  'b.append(4)',    // 3
  'print(a)',       // 4
  '',               // 5
  'c = list(a)',    // 6
  'c.append(9)',    // 7
  'print(a, c)',    // 8
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 96, codeTop: 190, codeFont: 22,
      rx: 200, ry: 660, ry2: 880, cell: 50, pitch: 58,
      tagDx: -46, outX: 70, outY: 1060, outW: 580, outFont: 20,
      svgW: 720, svgH: 1280,
    };
  }
  return {
    codeLeft: 96, codeTop: 170, codeFont: 24,
    rx: 830, ry: 215, ry2: 430, cell: 58, pitch: 68,
    tagDx: -54, outX: 700, outY: 600, outW: 500, outFont: 22,
    svgW: 1280, svgH: 720,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

// ─── Memory-diagram pieces (SVG) ───────────────────────────────────────────
// One row of list cells starting at (rx, ry). Values appear staggered from
// `delay`, `extra` (the appended cell) gets its own delay and stroke.
function CellRow({ G, y, values, stroke, delay = 0, stagger = 0.22, duration = 0.45 }) {
  return (
    <g>
      {values.map((v, i) => (
        <g key={i} transform={`translate(${G.rx + i * G.pitch}, ${y})`}>
          <LabeledBox text={String(v)} w={G.cell} h={G.cell} stroke={stroke}
                      fontSize={Math.round(G.cell * 0.42)} mode="draw"
                      duration={duration} delay={delay + i * stagger}/>
        </g>
      ))}
    </g>
  );
}

// A name tag (serif italic) + arrow into the left edge of a row.
function NameTag({ G, name, y, above, delay }) {
  const tx = G.rx + G.tagDx - 10;
  const ty = above ? y - 26 : y + G.cell + 44;
  const ax1 = tx + 6, ay1 = above ? ty + 8 : ty - 14;
  const ax2 = G.rx - 8, ay2 = y + G.cell / 2 + (above ? -8 : 8);
  return (
    <g>
      <Label x={tx} y={ty} text={name} color="var(--chalk-200)" fontSize={24}
             fontFamily="var(--font-serif)" italic anchor="end" duration={0.4} delay={delay}/>
      <Arrow x1={ax1} y1={ay1} x2={ax2} y2={ay2} color="var(--chalk-200)"
             strokeWidth={2.2} headSize={9} duration={0.5} delay={delay + 0.25}/>
    </g>
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
      position: 'absolute', left: G.outX + 4, top: G.outY + 64 + dy,
      fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--chalk-300)',
      maxWidth: '46ch', lineHeight: 1.5 }}>
      {children}
    </div>
  );
}

function MemSvg({ G, children }) {
  return (
    <svg style={{ position: 'absolute', left: 0, top: 0 }}
         width={G.svgW} height={G.svgH} viewBox={`0 0 ${G.svgW} ${G.svgH}`}>
      {children}
    </svg>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="lister"
      title="To navn, én liste"
      duration={SCENE_DURATION}
      introEnd={9.94}
      introCaption="Er b en kopi av a?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.94} end={25.82}>
        <EnListeBeat/>
      </Sprite>

      <Sprite start={25.82} end={36.84}>
        <SjokketBeat/>
      </Sprite>

      <Sprite start={36.84} end={49.66}>
        <EkteKopiBeat/>
      </Sprite>

      <Sprite start={49.66} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Én liste, to navn ─────────────────────────────────────────────
function EnListeBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const line = localTime >= at(0.52) ? 2 : 1;

  return (
    <>
      <CodeBlock code={CODE} title="lister.py" reveal="all" highlight={String(line)}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <MemSvg G={G}>
        <CellRow G={G} y={G.ry} values={[1, 2, 3]} stroke="var(--amber-400)" delay={at(0.10)}/>
        <NameTag G={G} name="a" y={G.ry} above delay={at(0.32)}/>
        <NameTag G={G} name="b" y={G.ry} above={false} delay={at(0.62)}/>
      </MemSvg>
      <Caption G={G} show={localTime >= at(0.80)} dy={-40}>
        <span style={{ color: 'var(--chalk-200)' }}>Ingen ny liste</span> — bare en pil til.
      </Caption>
    </>
  );
}

// ─── Beat 3: Sjokket (GENUINE MOTION) ──────────────────────────────────────
function SjokketBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const line = localTime >= at(0.50) ? 4 : 3;
  const tipX = G.rx - 8;

  return (
    <>
      <CodeBlock code={CODE} title="lister.py" reveal="all" highlight={String(line)}
                 accent={line === 3 ? 'var(--rose-400)' : 'var(--amber-400)'}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <MemSvg G={G}>
        <CellRow G={G} y={G.ry} values={[1, 2, 3]} stroke="var(--amber-400)" delay={0} stagger={0.06} duration={0.25}/>
        <NameTag G={G} name="a" y={G.ry} above delay={0.05}/>
        <NameTag G={G} name="b" y={G.ry} above={false} delay={0.15}/>
        {/* The fourth cell grows out of the row, through b */}
        <g transform={`translate(${G.rx + 3 * G.pitch}, ${G.ry})`}>
          <LabeledBox text="4" w={G.cell} h={G.cell} stroke="var(--rose-400)"
                      fontSize={Math.round(G.cell * 0.42)} mode="draw"
                      duration={0.6} delay={at(0.16)}/>
        </g>
        {/* Both arrows pulse: the SAME list changed for both names */}
        <PulseMark cx={tipX} cy={G.ry + G.cell / 2 - 8} color="var(--rose-400)"
                   radius={4} pulseRadius={22} duration={1.2} delay={at(0.58)}/>
        <PulseMark cx={tipX} cy={G.ry + G.cell / 2 + 8} color="var(--rose-400)"
                   radius={4} pulseRadius={22} duration={1.2} delay={at(0.70)}/>
      </MemSvg>
      <OutputRow G={G} text="[1, 2, 3, 4]" show={localTime >= at(0.56)}/>
      <Caption G={G} show={localTime >= at(0.80)}>
        Én liste — <span style={{ color: 'var(--rose-300)' }}>to navn ser den samme endringen.</span>
      </Caption>
    </>
  );
}

// ─── Beat 4: Ekte kopi ─────────────────────────────────────────────────────
function EkteKopiBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const line = localTime >= at(0.70) ? 8 : (localTime >= at(0.44) ? 7 : 6);

  return (
    <>
      <CodeBlock code={CODE} title="lister.py" reveal="all" highlight={String(line)}
                 fontSize={G.codeFont} duration={0.3} delay={0} style={codePos(G)}/>
      <MemSvg G={G}>
        {/* Original row, now four cells, settled */}
        <CellRow G={G} y={G.ry} values={[1, 2, 3, 4]} stroke="var(--amber-400)" delay={0} stagger={0.05} duration={0.25}/>
        <NameTag G={G} name="a" y={G.ry} above delay={0.05}/>
        <NameTag G={G} name="b" y={G.ry} above={false} delay={0.1}/>
        {/* The genuine copy: a brand-new row materialises */}
        <CellRow G={G} y={G.ry2} values={[1, 2, 3, 4]} stroke="var(--teal-400)" delay={at(0.10)} stagger={0.22}/>
        <NameTag G={G} name="c" y={G.ry2} above={false} delay={at(0.30)}/>
        {/* 9 grows out of ONLY the new row */}
        <g transform={`translate(${G.rx + 4 * G.pitch}, ${G.ry2})`}>
          <LabeledBox text="9" w={G.cell} h={G.cell} stroke="var(--teal-400)"
                      fontSize={Math.round(G.cell * 0.42)} mode="draw"
                      duration={0.6} delay={at(0.50)}/>
        </g>
      </MemSvg>
      <OutputRow G={G} text={'[1, 2, 3, 4]  [1, 2, 3, 4, 9]'} show={localTime >= at(0.76)}
                 fontSize={portrait ? 17 : 20}/>
      <Caption G={G} show={localTime >= at(0.88)}>
        Nitallet havnet bare hos <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--chalk-200)' }}>c</span>.
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
        referanser
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Likhetstegnet kopierer <span style={{ color: 'var(--amber-300)' }}>pila</span> — ikke lista.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        b = a deler · c = list(a) kopierer
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
