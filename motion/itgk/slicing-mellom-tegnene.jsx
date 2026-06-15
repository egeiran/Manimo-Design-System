// Slicing: indeksene bor mellom tegnene — Manimo lesson scene.
// Chapter 7 of itgk (Strenger). The classic confusion: students think the
// indices sit ON the characters. They don't — they sit in the GAPS between
// characters. A string of n characters has n + 1 index positions. A slice
// s[a:b] lifts everything from gap a up to (but not including) gap b. The
// scene drops the indices 0..6 into the gaps of "Python" one by one, expands
// a glowing window from 1 to 4, lifts the substring "yth" up into a result
// box, and finally splits the row at index 3 with two complementary slices.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–24     Mellom tegnene — chars draw, then indices 0..6 land in the GAPS
//   24–39     Slicing-vindu — window expands 1→4, "yth" lifts to dest box
//   39–50     Utenfor — s[:3] and s[3:] split the row at the seam at index 3
//   50–58     Takeaway
//
// Colour discipline:
//   chalk-100  characters, primary text
//   chalk-200  tick marks, name tags
//   chalk-300  dimmed text, hints
//   amber-400  primary window stroke, slice highlight
//   amber-300  index labels, payoff readout
//   teal-400   left half slice [:3]
//   rose-400   right half slice [3:]
//
// Milestones inside beats are fractions of the sprite's actual duration so
// audio rewires keep the choreography aligned.

const SCENE_DURATION = 65;

const NARRATION = [
  /*  0–10  */ 'Slicing virker som magi helt til du innser hvor tallene egentlig sitter. Hint: ikke på bokstavene.',
  /* 10–24  */ 'Når Python teller seg gjennom en streng, sitter ikke tallene på selve bokstavene. De sitter i mellomrommene mellom dem. Null er foran første bokstav, ett mellom P og y, og slik fortsetter det. Seks bokstaver gir syv mellomrom — fra null til seks.',
  /* 24–39  */ 'Med skarpe klammer plukker vi ut en bit. Skriv ett, kolon, fire mellom klammene, og Python finner alt som ligger mellom skille én og skille fire. Vinduet strekker seg mellom dem, og y, t og h letter ut og lander i den nye delstrengen.',
  /* 39–50  */ 'Lar du endene være tomme, betyr det fra starten eller ut til slutten. Kolon tre tar de tre første bokstavene. Tre kolon tar resten. Sømmen sitter akkurat ved skille tre, og lagt sammen får du hele strengen igjen.',
  /* 50–58  */ 'Indeksene bor i mellomrommene. Tegn dem mellom tegnene i hodet, så slutter slicing å overraske deg.',
];

const NARRATION_AUDIO = 'audio/slicing-mellom-tegnene/scene.mp3';

// ─── The string and its programs ───────────────────────────────────────────
const CHARS = ['P', 'y', 't', 'h', 'o', 'n'];
const N = CHARS.length;            // 6 characters → 7 gap positions (0..6)

const CODE_BEAT2 = 's = "Python"';
const CODE_BEAT3 = [
  's = "Python"',
  'del = s[1:4]',
  'print(del)',
].join('\n');
const CODE_BEAT4 = [
  's = "Python"',
  'a = s[:3]',
  'b = s[3:]',
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      codeLeft: 72, codeTop: 220, codeFont: 24, codePanelW: 576,
      strXStart: 180, strY: 720, pitch: 60, charFont: 42,
      idxFont: 18, tickH: 12,
      // Beat 3 destination box (single result)
      dst1X: 96, dst1Y: 940, dst1W: 528, dst1H: 130,
      dstCharFont: 38, dstPitch: 54,
      // Beat 4 dual destination boxes (stack vertically in portrait)
      dst2X: 96,  dst2Y: 920,  dst2W: 528, dst2H: 90,   // left half  [:3]
      dst3X: 96,  dst3Y: 1030, dst3W: 528, dst3H: 90,   // right half [3:]
      svgW: 720, svgH: 1280,
    };
  }
  return {
    codeLeft: 72, codeTop: 200, codeFont: 22, codePanelW: 440,
    strXStart: 720, strY: 300, pitch: 56, charFont: 38,
    idxFont: 16, tickH: 10,
    dst1X: 720, dst1Y: 470, dst1W: 460, dst1H: 130,
    dstCharFont: 34, dstPitch: 48,
    dst2X: 720, dst2Y: 460, dst2W: 220, dst2H: 130,    // left half  [:3]
    dst3X: 960, dst3Y: 460, dst3W: 220, dst3H: 130,    // right half [3:]
    svgW: 1280, svgH: 720,
  };
}

function codePos(G) {
  return {
    position: 'absolute', left: G.codeLeft, top: G.codeTop, width: G.codePanelW,
    fontVariantLigatures: 'none',
  };
}

const lerp = (a, b, t) => a + (b - a) * t;

// ─── Source row: characters, tick marks, index labels ──────────────────────
function SourceRow({ G, charsReveal, idxReveal, highlightRange, highlightT, dimRange }) {
  const charNodes = [];
  for (let i = 0; i < N; i++) {
    const cellOp = clamp((charsReveal * N) - i + 0.5, 0, 1);
    if (cellOp <= 0) continue;
    const inHi = highlightRange && i >= highlightRange[0] && i < highlightRange[1];
    const inDim = dimRange && i >= dimRange[0] && i < dimRange[1];
    const baseColor = 'var(--chalk-100)';
    const hiColor = `rgba(244,184,96,${0.55 + 0.45 * (highlightT ?? 0)})`; // amber-400
    const color = inHi && (highlightT ?? 0) > 0.001 ? hiColor : baseColor;
    charNodes.push(
      <div key={`ch-${i}`} style={{
        position: 'absolute',
        left: G.strXStart + i * G.pitch, top: G.strY,
        width: G.pitch, textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: G.charFont,
        color,
        opacity: cellOp * (inDim ? 0.28 : 1),
        transition: 'color 0.35s linear, opacity 0.3s linear',
        pointerEvents: 'none',
      }}>{CHARS[i]}</div>
    );
  }

  const tickNodes = [];
  const idxNodes = [];
  for (let j = 0; j <= N; j++) {
    const op = clamp(((idxReveal ?? 0) * (N + 1)) - j + 0.5, 0, 1);
    if (op <= 0) continue;
    tickNodes.push(
      <div key={`tk-${j}`} style={{
        position: 'absolute',
        left: G.strXStart + j * G.pitch - 1,
        top: G.strY - G.tickH - 6,
        width: 2, height: G.tickH,
        background: 'var(--chalk-300)', opacity: op * 0.85,
        pointerEvents: 'none',
      }}/>
    );
    idxNodes.push(
      <div key={`ix-${j}`} style={{
        position: 'absolute',
        left: G.strXStart + j * G.pitch - 14,
        top: G.strY - G.tickH - 6 - G.idxFont - 8,
        width: 28, textAlign: 'center',
        fontFamily: 'var(--font-mono)', fontSize: G.idxFont,
        color: 'var(--amber-300)', opacity: op,
        pointerEvents: 'none',
      }}>{j}</div>
    );
  }

  return <>{charNodes}{tickNodes}{idxNodes}</>;
}

// ─── Destination box (labelled rounded panel) ──────────────────────────────
function DestBox({ x, y, w, h, label, color, show, dimLabel = false }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box',
      borderRadius: 12, border: `1.5px solid ${color}`,
      background: 'rgba(0,0,0,0.40)',
      padding: '10px 18px',
      display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', gap: 4,
      pointerEvents: 'none',
      transition: 'border-color 0.35s linear, background 0.35s linear',
    }}>
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        opacity: dimLabel ? 0.55 : 1,
      }}>{label}</span>
    </div>
  );
}

// ─── Settled dest chars (no animation, just positioned) ────────────────────
function SettledDestChars({ x, y, pitch, fontSize, chars, color }) {
  return (
    <>
      {chars.map((ch, i) => (
        <div key={`d-${i}`} style={{
          position: 'absolute',
          left: x + i * pitch, top: y, width: pitch, textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize, color,
          pointerEvents: 'none',
        }}>{ch}</div>
      ))}
    </>
  );
}

// ─── Slicing window (outlined rounded box above the chars) ─────────────────
function SliceWindow({ G, leftIdx, rightIdx, yOffset, color, show, fill = 'rgba(244,184,96,0.10)' }) {
  if (!show) return null;
  const x = G.strXStart + leftIdx * G.pitch;
  const w = Math.max(0, (rightIdx - leftIdx) * G.pitch);
  const y = G.strY - 6 + (yOffset ?? 0);
  const h = G.charFont * 1.55;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h, boxSizing: 'border-box',
      border: `2px solid ${color}`, borderRadius: 10,
      background: fill,
      pointerEvents: 'none',
    }}/>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="strenger"
      title="Slicing: indeksene bor mellom tegnene"
      duration={SCENE_DURATION}
      introEnd={7.15}
      introCaption="Hvor sitter egentlig indeksene?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.15} end={25.04}>
        <MellomTegneneBeat/>
      </Sprite>

      <Sprite start={25.04} end={42.24}>
        <SlicingVinduBeat/>
      </Sprite>

      <Sprite start={42.24} end={57.17}>
        <UtenforBeat/>
      </Sprite>

      <Sprite start={57.17} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Mellom tegnene (GENUINE MOTION — indices land in the gaps) ────
function MellomTegneneBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Chars reveal early, then ticks + indices walk in left → right.
  const charsT = clamp((localTime - at(0.08)) / (at(0.30) - at(0.08)), 0, 1);
  const idxT = clamp((localTime - at(0.30)) / (at(0.65) - at(0.30)), 0, 1);

  // Caption appears after the walk completes.
  const showCaption = localTime >= at(0.72);

  return (
    <>
      <CodeBlock code={CODE_BEAT2} title="strenger.py" reveal="lines"
                 fontSize={G.codeFont} duration={1.0} delay={0.3}
                 style={codePos(G)}/>

      <SourceRow G={G} charsReveal={charsT} idxReveal={idxT}/>

      {showCaption && (
        <FadeUp duration={0.55} delay={0} distance={10}
          style={{
            position: 'absolute',
            left: portrait ? G.dst1X : G.strXStart,
            top: portrait ? G.strY + 90 : G.strY + 120,
            width: portrait ? G.dst1W : G.dst1W,
            fontFamily: 'var(--font-sans)', fontSize: portrait ? 15 : 15,
            color: 'var(--chalk-300)', lineHeight: 1.5,
          }}>
          Seks bokstaver, men <span style={{ color: 'var(--amber-300)', fontFamily: 'var(--font-mono)' }}>syv</span> mellomrom — fra <span style={{ color: 'var(--amber-300)', fontFamily: 'var(--font-mono)' }}>0</span> til <span style={{ color: 'var(--amber-300)', fontFamily: 'var(--font-mono)' }}>6</span>.
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 3: Slicing-vindu (GENUINE MOTION — window + lift) ────────────────
function SlicingVinduBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const A = 1, B = 4;
  const SLICE = CHARS.slice(A, B); // ['y', 't', 'h']

  // Window expand: collapsed at the midpoint, then grows out to A and B.
  const winT = clamp((localTime - at(0.18)) / (at(0.42) - at(0.18)), 0, 1);
  const winEased = Easing.easeOutCubic(winT);
  const winMid = (A + B) / 2;
  const winLeft = winMid - (winMid - A) * winEased;
  const winRight = winMid + (B - winMid) * winEased;

  // Slice chars in the source row brighten to amber while the window is open.
  const charsLitT = clamp((localTime - at(0.36)) / 0.45, 0, 1);

  // Lift: ghost clones of the slice rise out of the source and translate
  // into the destination box. Stay settled afterwards.
  const liftStart = at(0.55);
  const liftEnd = at(0.78);
  const liftT = clamp((localTime - liftStart) / (liftEnd - liftStart), 0, 1);
  const liftE = Easing.easeInOutCubic(liftT);

  // Destination chars sit at this geometry inside dst1:
  const dstTextX = G.dst1X + 20;
  const dstTextY = G.dst1Y + (portrait ? 56 : 56);
  const dstLabelY = G.dst1Y + 12;

  // Source position for a slice index i (0..SLICE.length-1) is source (A+i).
  function ghostPos(i) {
    const srcI = A + i;
    const sx = G.strXStart + srcI * G.pitch;
    const sy = G.strY;
    const dx = dstTextX + i * G.dstPitch;
    const dy = dstTextY;
    return { x: lerp(sx, dx, liftE), y: lerp(sy, dy, liftE) };
  }

  // The original source chars in [A, B) fade out as the ghosts settle into
  // the destination (so the answer doesn't appear in two places at once).
  const sourceDimT = clamp((liftT - 0.55) / 0.30, 0, 1);

  return (
    <>
      <CodeBlock code={CODE_BEAT3} title="strenger.py" reveal="all" highlight="2"
                 fontSize={G.codeFont} duration={0.4} delay={0}
                 style={codePos(G)}/>

      <SourceRow G={G}
                 charsReveal={1}
                 idxReveal={1}
                 highlightRange={[A, B]}
                 highlightT={charsLitT}
                 dimRange={sourceDimT > 0.001 ? [A, B] : null}/>

      <SliceWindow G={G}
                   leftIdx={winLeft} rightIdx={winRight}
                   yOffset={0}
                   color="var(--amber-400)"
                   show={winT > 0.001}/>

      {/* Destination box appears as the window settles */}
      <DestBox x={G.dst1X} y={G.dst1Y} w={G.dst1W} h={G.dst1H}
               label="s[1:4]" color="var(--amber-400)"
               show={localTime >= at(0.48)}/>

      {/* Ghost slice chars — interpolating from source to destination */}
      {liftT > 0 && SLICE.map((ch, i) => {
        const { x, y } = ghostPos(i);
        return (
          <div key={`g-${i}`} style={{
            position: 'absolute',
            left: x, top: y, width: G.pitch, textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: lerp(G.charFont, G.dstCharFont, liftE),
            color: 'var(--amber-300)',
            pointerEvents: 'none',
          }}>{ch}</div>
        );
      })}

      {/* Caption once the slice has landed */}
      {localTime >= at(0.85) && (
        <FadeUp duration={0.45} delay={0} distance={8}
          style={{
            position: 'absolute',
            left: portrait ? G.dst1X : G.dst1X,
            top: portrait ? G.dst1Y + G.dst1H + 14 : G.dst1Y + G.dst1H + 14,
            width: G.dst1W,
            fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 14,
            color: 'var(--chalk-300)', lineHeight: 1.45,
          }}>
          Alt <span style={{ color: 'var(--amber-300)' }}>mellom</span> skille
          {' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>1</span>
          {' '}og skille
          {' '}<span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>4</span> — ikke skille 4 selv.
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 4: Utenfor (GENUINE MOTION — split at the seam) ──────────────────
function UtenforBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  const LEFT = CHARS.slice(0, 3);  // ['P', 'y', 't']
  const RIGHT = CHARS.slice(3, 6); // ['h', 'o', 'n']

  // Code highlight: line 2 first, then both lines 2 + 3.
  const showRight = localTime >= at(0.35);
  const highlight = showRight ? '2,3' : '2';

  // Windows fade in.
  const leftWinT = clamp((localTime - at(0.12)) / 0.6, 0, 1);
  const rightWinT = clamp((localTime - at(0.32)) / 0.6, 0, 1);

  // Pulse on index 3 (the seam) when both windows are visible.
  const pulseT = clamp((localTime - at(0.42)) / 1.6, 0, 1);

  // Lifts: left half and right half translate to their respective dest boxes.
  const liftStart = at(0.55);
  const liftEnd = at(0.85);
  const liftT = clamp((localTime - liftStart) / (liftEnd - liftStart), 0, 1);
  const liftE = Easing.easeInOutCubic(liftT);

  // Destination char anchor positions.
  const leftTextX = G.dst2X + 18;
  const leftTextY = G.dst2Y + (portrait ? 36 : 56);
  const rightTextX = G.dst3X + 18;
  const rightTextY = G.dst3Y + (portrait ? 36 : 56);

  function leftGhostPos(i) {
    const sx = G.strXStart + i * G.pitch;
    const sy = G.strY;
    const dx = leftTextX + i * G.dstPitch;
    const dy = leftTextY;
    return { x: lerp(sx, dx, liftE), y: lerp(sy, dy, liftE) };
  }
  function rightGhostPos(i) {
    const sx = G.strXStart + (3 + i) * G.pitch;
    const sy = G.strY;
    const dx = rightTextX + i * G.dstPitch;
    const dy = rightTextY;
    return { x: lerp(sx, dx, liftE), y: lerp(sy, dy, liftE) };
  }

  // Source dims as ghosts settle into destinations.
  const dim = clamp((liftT - 0.55) / 0.30, 0, 1) > 0.001;

  return (
    <>
      <CodeBlock code={CODE_BEAT4} title="strenger.py" reveal="all"
                 highlight={highlight}
                 fontSize={G.codeFont} duration={0.4} delay={0}
                 style={codePos(G)}/>

      <SourceRow G={G}
                 charsReveal={1} idxReveal={1}
                 dimRange={dim ? [0, 6] : null}/>

      {/* Left window [:3] in teal, above the chars */}
      <SliceWindow G={G}
                   leftIdx={0}
                   rightIdx={3 * leftWinT}
                   color="var(--teal-400)"
                   fill="rgba(232,220,193,0.06)"
                   yOffset={-G.charFont * 0.10}
                   show={leftWinT > 0.001}/>

      {/* Right window [3:] in rose, slightly offset downward */}
      <SliceWindow G={G}
                   leftIdx={3}
                   rightIdx={3 + 3 * rightWinT}
                   color="var(--rose-400)"
                   fill="rgba(232,122,144,0.10)"
                   yOffset={G.charFont * 0.10}
                   show={rightWinT > 0.001}/>

      {/* Seam pulse at index 3 */}
      {pulseT > 0 && (
        <div style={{
          position: 'absolute',
          left: G.strXStart + 3 * G.pitch - 12,
          top: G.strY - G.tickH - 6 - G.idxFont - 18,
          width: 24, height: G.idxFont + 12,
          borderRadius: 6,
          background: `rgba(244,184,96,${0.25 * (1 - pulseT)})`,
          boxShadow: `0 0 ${12 * (1 - pulseT) + 4}px rgba(244,184,96,${0.6 * (1 - pulseT)})`,
          pointerEvents: 'none',
        }}/>
      )}

      {/* Destination boxes appear */}
      <DestBox x={G.dst2X} y={G.dst2Y} w={G.dst2W} h={G.dst2H}
               label='s[:3]' color="var(--teal-400)"
               show={localTime >= at(0.45)}/>
      <DestBox x={G.dst3X} y={G.dst3Y} w={G.dst3W} h={G.dst3H}
               label='s[3:]' color="var(--rose-400)"
               show={localTime >= at(0.45)}/>

      {/* Ghost chars — left half */}
      {liftT > 0 && LEFT.map((ch, i) => {
        const { x, y } = leftGhostPos(i);
        return (
          <div key={`gl-${i}`} style={{
            position: 'absolute',
            left: x, top: y, width: G.pitch, textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: lerp(G.charFont, G.dstCharFont, liftE),
            color: 'var(--teal-400)',
            pointerEvents: 'none',
          }}>{ch}</div>
        );
      })}

      {/* Ghost chars — right half */}
      {liftT > 0 && RIGHT.map((ch, i) => {
        const { x, y } = rightGhostPos(i);
        return (
          <div key={`gr-${i}`} style={{
            position: 'absolute',
            left: x, top: y, width: G.pitch, textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: lerp(G.charFont, G.dstCharFont, liftE),
            color: 'var(--rose-300)',
            pointerEvents: 'none',
          }}>{ch}</div>
        );
      })}

      {/* Caption once both halves have landed */}
      {localTime >= at(0.90) && (
        <FadeUp duration={0.45} delay={0} distance={8}
          style={{
            position: 'absolute',
            left: portrait ? 152 : G.dst2X,
            top: (portrait ? G.dst3Y + G.dst3H + 14 : G.dst2Y + G.dst2H + 16),
            width: portrait ? G.dst2W - 80 : 460,
            fontFamily: 'var(--font-sans)', fontSize: 14,
            color: 'var(--chalk-300)', lineHeight: 1.45,
          }}>
          Sømmen sitter akkurat ved <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-300)' }}>3</span> — ingen overlapp.
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
        slicing
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '32ch', lineHeight: 1.25 }}>
        Indeksene bor <span style={{ color: 'var(--amber-300)' }}>mellom tegnene.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 15 : 20,
                 color: 'var(--amber-300)', fontVariantLigatures: 'none',
                 whiteSpace: 'nowrap' }}>
        s[a:b] · fra skille a opp til skille b
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
