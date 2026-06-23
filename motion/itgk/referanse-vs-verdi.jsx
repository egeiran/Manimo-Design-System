// Tall kopierer, lister deler — Manimo lesson scene.
// Chapter 2 of itgk (Variabler, datatyper og tallrepresentasjon). The same
// `b = a` lines lead to two different stories depending on the datatype.
// For ints (immutable), Python *has* to build a fresh integer object on
// any update, so reassignment feels like a copy and a stays untouched.
// For lists (mutable), `b = a` only adds a second arrow to the same row
// in memory, so an in-place append through b is visible through a too.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9    Manimo hook
//    9–25    Tall — VarBoxes split: copy of 5 into b, then new 6 swaps in
//   25–41    Lister — two name-tags point at one row, then 4 grows in place
//   41–53    Datatypen bestemmer — side-by-side mini-diagrams
//   53–60    Takeaway
//
// Colour discipline:
//   chalk-100  code text, primary values
//   chalk-200  arrows, name tags
//   chalk-300  dimmed text, hints, footer
//   teal-400   the int side (uforanderlig)
//   amber-400  the new int value 6 / the original list row
//   amber-300  payoff / output / takeaway
//   rose-400   the appended 4 (the "shared mutation" beat)
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 69;

const NARRATION = [
  /*  0– 9 */ 'Du har sett at en variabel husker en verdi. Men noen ganger gjør Python noe overraskende. Hvorfor reagerer tall og lister så ulikt på det samme likhetstegnet?',
  /*  9–25 */ 'Si at a er fem. Når vi skriver b er lik a, kopierer Python verdien — b blir også fem. Når vi øker b med én, lages det et helt nytt tall: seks. a er fortsatt fem, fordi tall ikke kan forandres.',
  /* 25–41 */ 'Lister er annerledes. a peker på en rad med tre tall, og b er lik a lager ingen ny rad — bare en pil til, til den samme. Når vi legger på et firetall gjennom b, vokser den ene lista vi har — og a ser endringen også.',
  /* 41–53 */ 'Datatypen bestemmer hva som skjer i minnet. Tall er uforanderlige — du må alltid lage et nytt et, så det føles som en kopi. Lister kan endres på plass — og to navn deler det de peker på.',
  /* 53–60 */ 'Uforanderlige typer føles som kopier. Foranderlige typer deler. Sjekk datatypen først, så slutter likhetstegnet å overraske deg.',
];

const NARRATION_AUDIO = 'audio/referanse-vs-verdi/scene.mp3';

// ─── The two tiny programs ────────────────────────────────────────────────
const CODE_INT = [
  'a = 5',          // 1
  'b = a',          // 2
  'b = b + 1',      // 3
  'print(a, b)',    // 4
].join('\n');

const CODE_LIST = [
  'a = [1, 2, 3]',  // 1
  'b = a',          // 2
  'b.append(4)',    // 3
  'print(a, b)',    // 4
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      // Code panel
      codeLeft: 80, codeTop: 240, codeFont: 22,
      // VarBox row (int beat) — under the code panel, full width
      varBoxX: 130, varBoxY: 620, varBoxGap: 220,
      // Memory diagram (list beat) — row of cells
      rx: 180, ry: 720, cell: 56, pitch: 64, tagDx: -54,
      // Output strip — indented past the bottom-left corner mascot
      outX: 160, outY: 920, outFont: 22,
      svgW: 720, svgH: 1280,
    };
  }
  return {
    // Code panel
    codeLeft: 96, codeTop: 200, codeFont: 26,
    // VarBox row (int beat) — to the right of the code, stacked vertically
    varBoxX: 760, varBoxY: 240, varBoxGap: 200,
    // Memory diagram (list beat) — row of cells
    rx: 800, ry: 250, cell: 60, pitch: 70, tagDx: -54,
    // Output strip
    outX: 700, outY: 540, outFont: 22,
    svgW: 1280, svgH: 720,
  };
}

function codePos(G) {
  return { position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function PanelEyebrow({ children, color = 'var(--amber-300)' }) {
  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color,
                  letterSpacing: '0.16em', textTransform: 'uppercase' }}>
      {children}
    </div>
  );
}

// One labelled value cell — a VarBox with a serif italic name above and the
// monospace value inside a rounded rectangle.
function VarBox({ x, y, name, value, accent, ghost, dim }) {
  const accentColor =
    accent === 'amber' ? 'var(--amber-400)' :
    accent === 'rose'  ? 'var(--rose-400)'  :
    accent === 'teal'  ? 'var(--teal-400)'  :
                         'rgba(232,220,193,0.30)';
  // teal accent uses border-only (no token-derived teal alpha in the lint
  // allowlist); amber / rose get their soft glow fill.
  const flashBg =
    accent === 'amber' ? 'rgba(244,184,96,0.16)' :
    accent === 'rose'  ? 'rgba(232,122,144,0.18)' :
                         'rgba(0,0,0,0.35)';
  const w = 116, h = 84;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      opacity: dim ? 0.45 : 1,
      transition: 'opacity 0.4s linear',
    }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 22, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        width: w, height: h, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${accentColor}`, borderRadius: 12,
        background: flashBg,
        fontFamily: 'var(--font-mono)', fontSize: 36,
        color: ghost ? 'var(--chalk-300)' : 'var(--chalk-100)',
        textDecorationLine: ghost ? 'line-through' : 'none',
        textDecorationColor: 'var(--rose-400)',
        textDecorationThickness: '2px',
        transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear',
      }}>
        {value == null ? '–' : value}
      </div>
    </div>
  );
}

// A free-floating value chip that can be tweened between two positions to
// show "Python copies a's value into b" or "Python builds a new int 6".
function ValueChip({ x, y, value, color = 'var(--teal-400)', opacity = 1, scale = 1 }) {
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 116, height: 84, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px dashed ${color}`, borderRadius: 12,
      background: 'rgba(0,0,0,0.55)',
      fontFamily: 'var(--font-mono)', fontSize: 36, color: 'var(--chalk-100)',
      opacity,
      transform: `scale(${scale})`,
      transformOrigin: 'center',
      pointerEvents: 'none',
    }}>
      {value}
    </div>
  );
}

function OutputStrip({ x, y, label, value, show, fontSize, accent = 'amber' }) {
  if (!show) return null;
  const stroke = accent === 'amber' ? 'var(--amber-400)' : 'var(--teal-400)';
  const fill = accent === 'amber' ? 'rgba(244,184,96,0.10)' : 'rgba(75,194,180,0.10)';
  const text = accent === 'amber' ? 'var(--amber-300)' : 'var(--teal-400)';
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', alignItems: 'baseline', gap: 14,
      padding: '10px 18px', borderRadius: 10,
      border: `1.5px solid ${stroke}`, background: fill,
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: text,
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: fontSize ?? 22,
                     color: text, whiteSpace: 'pre' }}>{value}</span>
    </div>
  );
}

function FooterCaption({ x, y, show, dy = 0, width = '46ch', children }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y + dy,
      fontFamily: 'var(--font-sans)', fontSize: 14, color: 'var(--chalk-300)',
      maxWidth: width, lineHeight: 1.5,
    }}>
      {children}
    </div>
  );
}

// Row of list cells starting at (rx, ry). Each LabeledBox draws its own
// rounded rectangle and writes its value.
function CellRow({ G, y, values, stroke, delay = 0, stagger = 0.18, duration = 0.45 }) {
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
             fontFamily="var(--font-serif)" italic anchor="end"
             duration={0.4} delay={delay}/>
      <Arrow x1={ax1} y1={ay1} x2={ax2} y2={ay2} color="var(--chalk-200)"
             strokeWidth={2.2} headSize={9} duration={0.5} delay={delay + 0.25}/>
    </g>
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
      eyebrow="datatyper"
      title="Tall kopierer, lister deler"
      duration={SCENE_DURATION}
      introEnd={12.23}
      introCaption="Samme likhetstegn — to historier."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={12.23} end={28.85}>
        <TallBeat/>
      </Sprite>

      <Sprite start={28.85} end={44.84}>
        <ListeBeat/>
      </Sprite>

      <Sprite start={44.84} end={58.31}>
        <DatatypenBeat/>
      </Sprite>

      <Sprite start={58.31} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Tall — VarBoxes split, then 6 swaps in (GENUINE MOTION) ──────
function TallBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Schedule fractions (relative to T):
  //   0.00          a's VarBox draws in with value 5
  //   0.18          Highlight line 2: "b = a"
  //   0.20–0.40     A ghost chip lifts off a's box and glides into b's box
  //   0.42          b's VarBox now shows 5 (copy landed)
  //   0.55          Highlight line 3: "b = b + 1"
  //   0.60–0.74     b's "5" chip lifts up, gets crossed out; new "6" chip
  //                 falls in from above and lands in b's slot
  //   0.78          b's VarBox now shows 6, accent flips amber
  //   0.85          Highlight line 4; print panel reveals "5 6"

  const showA = true;
  const showCopyChip = localTime >= at(0.20);
  const copyFrac = clamp((localTime - at(0.20)) / (at(0.40) - at(0.20)), 0, 1);
  const bHasFive = localTime >= at(0.42);
  const upgrading = localTime >= at(0.60) && localTime < at(0.78);
  const upgradeFrac = clamp((localTime - at(0.60)) / (at(0.78) - at(0.60)), 0, 1);
  const bHasSix = localTime >= at(0.78);
  const showPrint = localTime >= at(0.85);

  // Code highlight
  const line =
    localTime < at(0.18) ? 1 :
    localTime < at(0.55) ? 2 :
    localTime < at(0.85) ? 3 : 4;
  const accent = line === 3 ? 'var(--amber-400)' : 'var(--teal-400)';

  // VarBox positions for the two values
  let aX, aY, bX, bY;
  if (portrait) {
    aX = G.varBoxX;             aY = G.varBoxY;
    bX = G.varBoxX + G.varBoxGap; bY = G.varBoxY;
  } else {
    aX = G.varBoxX;             aY = G.varBoxY;
    bX = G.varBoxX + G.varBoxGap; bY = G.varBoxY;
  }

  // Copy-chip trajectory: starts on top of a's box, glides toward b's box.
  const cx = aX + (bX - aX) * copyFrac;
  const cy = aY + (bY - aY) * copyFrac;
  const copyChipOpacity = copyFrac < 0.95 ? 1 : (1 - (copyFrac - 0.95) / 0.05);

  // Upgrade-chip trajectory: a fresh "6" drops in from 60 px above b's slot
  // down into b's slot.
  const upgradeStartY = bY - 80;
  const upY = upgradeStartY + (bY - upgradeStartY) * upgradeFrac;
  const upOpacity = clamp(upgradeFrac * 1.5, 0, 1);

  // b's box: shows 5 while copy is landed, "ghosts" 5 (struck-through) while
  // the new int is being computed, then shows 6 once the upgrade completes.
  const bValue = bHasSix ? 6 : (bHasFive ? 5 : null);
  const bAccent = bHasSix ? 'amber' : (bHasFive ? 'teal' : 'none');
  const bGhost = upgrading;

  // a's accent flashes teal when copy lands; otherwise the steady teal frame
  // is fine. Static teal works visually.
  const aAccent = 'teal';

  return (
    <>
      <CodeBlock
        code={CODE_INT}
        title="tall.py"
        reveal="all"
        highlight={String(line)}
        accent={accent}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      {/* VarBoxes — drawn after the code panel mounts. */}
      <VarBox x={aX} y={aY} name="a" value={showA ? 5 : null} accent={aAccent}/>
      <VarBox x={bX} y={bY} name="b" value={bValue} accent={bAccent} ghost={bGhost}/>

      {/* Copy chip — flies from a to b */}
      {showCopyChip && copyFrac < 1.0 && (
        <ValueChip x={cx} y={cy} value={5} color="var(--teal-400)" opacity={copyChipOpacity}/>
      )}

      {/* Upgrade chip — a fresh 6 drops into b's slot */}
      {upgrading && (
        <ValueChip x={bX} y={upY} value={6} color="var(--amber-400)" opacity={upOpacity}/>
      )}

      {/* "+1" overlay during the upgrade beat */}
      {upgrading && (
        <div style={{
          position: 'absolute',
          left: bX + 130, top: bY + 24,
          fontFamily: 'var(--font-mono)', fontSize: 22,
          color: 'var(--amber-300)',
          opacity: 1 - upgradeFrac,
        }}>
          + 1
        </div>
      )}

      {/* Output panel — "5 6" */}
      <OutputStrip
        x={portrait ? G.outX : G.outX}
        y={portrait ? G.outY : G.outY}
        label="utskrift"
        value="5 6"
        show={showPrint}
        fontSize={portrait ? 22 : 26}
      />

      {/* Footer caption — appears with the upgrade */}
      <FooterCaption
        x={portrait ? G.outX : G.outX}
        y={portrait ? G.outY + 60 : G.outY + 60}
        show={localTime >= at(0.78)}
      >
        <span style={{ color: 'var(--chalk-200)' }}>Et nytt tall</span> — a er upåvirket.
      </FooterCaption>
    </>
  );
}

// ─── Beat 3: Liste — én rad, to navnelapper (GENUINE MOTION) ──────────────
function ListeBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 0.5, 1);
  const at = (f) => f * T;

  // Schedule:
  //   0.00–0.15   a's row of three cells draws in
  //   0.15        name-tag "a" + arrow appears (above the row)
  //   0.30        Highlight line 2: "b = a" — second name-tag below
  //   0.55        Highlight line 3: "b.append(4)" — the 4 cell grows
  //   0.70        Pulse marks on both arrows (the shared mutation)
  //   0.85        Print panel reveals "[1, 2, 3, 4]  [1, 2, 3, 4]"

  const line =
    localTime < at(0.30) ? 1 :
    localTime < at(0.55) ? 2 :
    localTime < at(0.85) ? 3 : 4;
  const accent = line === 3 ? 'var(--rose-400)' : 'var(--amber-400)';

  const tipX = G.rx - 8;
  const showPrint = localTime >= at(0.85);

  return (
    <>
      <CodeBlock
        code={CODE_LIST}
        title="lister.py"
        reveal="all"
        highlight={String(line)}
        accent={accent}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={codePos(G)}
      />

      <MemSvg G={G}>
        {/* Original row 1 2 3 — drawn first */}
        <CellRow G={G} y={G.ry} values={[1, 2, 3]} stroke="var(--amber-400)"
                 delay={at(0.00)} stagger={0.18} duration={0.45}/>
        {/* Name tag a — above the row */}
        <NameTag G={G} name="a" y={G.ry} above delay={at(0.18)}/>
        {/* Name tag b — below the row, second arrow to the SAME row */}
        <NameTag G={G} name="b" y={G.ry} above={false} delay={at(0.40)}/>

        {/* The fourth cell grows out of the row (in-place mutation) */}
        <g transform={`translate(${G.rx + 3 * G.pitch}, ${G.ry})`}>
          <LabeledBox text="4" w={G.cell} h={G.cell} stroke="var(--rose-400)"
                      fontSize={Math.round(G.cell * 0.42)} mode="draw"
                      duration={0.6} delay={at(0.58)}/>
        </g>
        {/* Both arrows pulse — shared mutation is visible from both names */}
        <PulseMark cx={tipX} cy={G.ry + G.cell / 2 - 8} color="var(--rose-400)"
                   radius={4} pulseRadius={22} duration={1.2} delay={at(0.70)}/>
        <PulseMark cx={tipX} cy={G.ry + G.cell / 2 + 8} color="var(--rose-400)"
                   radius={4} pulseRadius={22} duration={1.2} delay={at(0.78)}/>
      </MemSvg>

      <OutputStrip
        x={portrait ? G.outX : G.outX}
        y={portrait ? G.outY : G.outY}
        label="utskrift"
        value="[1, 2, 3, 4]  [1, 2, 3, 4]"
        show={showPrint}
        fontSize={portrait ? 17 : 20}
      />

      <FooterCaption
        x={portrait ? G.outX : G.outX}
        y={portrait ? G.outY + 60 : G.outY + 60}
        show={localTime >= at(0.85)}
      >
        Én liste — <span style={{ color: 'var(--rose-300)' }}>begge navnene ser endringen.</span>
      </FooterCaption>
    </>
  );
}

// ─── Beat 4: Datatypen bestemmer — side-by-side mini-diagrams ─────────────
function DatatypenBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const T = Math.max(duration - 0.3, 1);
  const at = (f) => f * T;

  const showFormula = localTime >= at(0.55);

  // Two mini-cards: left = int, right = list. In landscape we put them
  // side by side; in portrait we stack them top/bottom.
  const cardW = portrait ? 600 : 480;
  const cardH = portrait ? 280 : 320;
  const gap = portrait ? 36 : 64;

  const leftX = portrait ? Math.round((720 - cardW) / 2) : Math.round((1280 - 2 * cardW - gap) / 2);
  const leftY = portrait ? 280 : 220;
  const rightX = portrait ? leftX : leftX + cardW + gap;
  const rightY = portrait ? leftY + cardH + gap : leftY;

  const Card = ({ x, y, eyebrowText, eyebrowColor, lead, diagram, delay }) => (
    <FadeUp duration={0.5} delay={delay} distance={12}
      style={{
        position: 'absolute', left: x, top: y, width: cardW, height: cardH,
        boxSizing: 'border-box', padding: '20px 24px',
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(232,220,193,0.10)', borderRadius: 16,
        boxShadow: '0 10px 32px rgba(0,0,0,0.35)',
        display: 'flex', flexDirection: 'column', gap: 16,
      }}>
      <PanelEyebrow color={eyebrowColor}>{eyebrowText}</PanelEyebrow>
      <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                    fontSize: portrait ? 20 : 22, color: 'var(--chalk-200)',
                    lineHeight: 1.4 }}>
        {lead}
      </div>
      {diagram}
    </FadeUp>
  );

  // Mini-diagram: two VarBoxes (int side, immutable, "copy feeling")
  const IntMini = (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 28,
      marginTop: 12,
    }}>
      <MiniVarBox name="a" value={5} accent="teal"/>
      <MiniVarBox name="b" value={6} accent="teal"/>
    </div>
  );

  // Mini-diagram: a single row of three cells with two name-tags pointing
  // at it (list side, mutable, "shared alias")
  const ListMini = (
    <div style={{ position: 'relative', width: '100%', height: 130, marginTop: 12 }}>
      <svg viewBox="0 0 460 130" width="100%" height="100%"
           style={{ position: 'absolute', left: 0, top: 0 }} preserveAspectRatio="xMidYMid meet">
        {/* Row of 4 cells */}
        {[1, 2, 3, 4].map((v, i) => (
          <g key={i} transform={`translate(${130 + i * 56}, 40)`}>
            <rect width={48} height={48} rx={8} ry={8} fill="rgba(0,0,0,0.45)"
                  stroke={i === 3 ? 'var(--rose-400)' : 'var(--amber-400)'} strokeWidth={2}/>
            <text x={24} y={32} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={20} fill="var(--chalk-100)">{v}</text>
          </g>
        ))}
        {/* Name tag a above + arrow */}
        <text x={100} y={36} textAnchor="end" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} fill="var(--chalk-200)">a</text>
        <path d="M 108 36 L 124 56" stroke="var(--chalk-200)" strokeWidth={2}
              markerEnd="url(#dt-arrow)"/>
        {/* Name tag b below + arrow */}
        <text x={100} y={110} textAnchor="end" fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={20} fill="var(--chalk-200)">b</text>
        <path d="M 108 102 L 124 80" stroke="var(--chalk-200)" strokeWidth={2}
              markerEnd="url(#dt-arrow)"/>
        <defs>
          <marker id="dt-arrow" viewBox="0 0 10 10" refX="9" refY="5"
                  markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--chalk-200)"/>
          </marker>
        </defs>
      </svg>
    </div>
  );

  return (
    <>
      <Card x={leftX} y={leftY}
        eyebrowText="uforanderlig — kopi-følelse"
        eyebrowColor="var(--teal-400)"
        lead={<>To navn, to verdier. <span style={{ color: 'var(--chalk-100)' }}>b</span> får sin egen seks.</>}
        diagram={IntMini}
        delay={0.3}/>

      <Card x={rightX} y={rightY}
        eyebrowText="foranderlig — delt liste"
        eyebrowColor="var(--rose-300)"
        lead={<>To navn, én rad. Endring gjennom <span style={{ color: 'var(--chalk-100)' }}>b</span> synes hos <span style={{ color: 'var(--chalk-100)' }}>a</span>.</>}
        diagram={ListMini}
        delay={0.9}/>

      {showFormula && (
        <FadeUp duration={0.5} delay={0} distance={10}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: portrait ? 1080 : (leftY + cardH + 30),
            textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
            color: 'var(--amber-300)', fontVariantLigatures: 'none',
          }}>
          int · str · tuple — kopierer  ·  list · dict · set — deler
        </FadeUp>
      )}
    </>
  );
}

// Tiny VarBox used inside the comparison cards.
function MiniVarBox({ name, value, accent = 'teal' }) {
  const stroke = accent === 'teal' ? 'var(--teal-400)' : 'var(--amber-400)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: 17, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        width: 70, height: 56, boxSizing: 'border-box',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `2px solid ${stroke}`, borderRadius: 10,
        background: 'rgba(0,0,0,0.35)',
        fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-100)',
      }}>
        {value}
      </div>
    </div>
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
        datatyper
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '32ch', lineHeight: 1.25 }}>
        Tall <span style={{ color: 'var(--teal-400)' }}>kopierer</span> — lister <span style={{ color: 'var(--rose-300)' }}>deler.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 19,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none' }}>
        uforanderlig · kopi  |  foranderlig · alias
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
