// NumPy: broadcasting — Manimo lesson scene.
// Chapter 12 of itgk (NumPy — beregning med arrays). The first ITGK scene to
// land in the NumPy chapter. NumPy lets two arrays with different shape
// "talk to each other" by stretching size-1 dimensions to fit. This scene
// shows that mechanically: first a scalar fans out to three copies under a
// row of cells, then a (3,1) column and a (1,3) row each tile across the
// missing dimension until they fill a shared 3×3 grid, then the elementwise
// sum lands cell-by-cell. Closes with the rule and the takeaway that one
// vectorised op replaces a Python loop.
//
// Beats (audio-aligned via scripts/rewire-scene.js):
//    0–    9.24  Manimo hook
//    9.24–21.57  Skalar broadcast: '10' chip clones across three cells (GENUINE MOTION)
//   21.57–40.88  Column + row tile into a 3×3 grid; elementwise sum lands (GENUINE MOTION)
//   40.88–56.30  Regelen — '1' stretches to '3', shapes annotate
//   56.30–67     Takeaway
//
// Colour discipline:
//   chalk-100  primary values, code text
//   chalk-200  body text on dark
//   chalk-300  ghosts, dimmed cells, hints
//   amber-400  scalar / result borders, payoff accents
//   amber-300  payoff readouts
//   teal-400   the column (and the original row in beat 2)
//   rose-400   the row (the second source array in the 2D beat)
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 67;

const NARRATION = [
  /*  0–    9.24 */ 'NumPy arrays kan ha forskjellig form, og likevel snakke sammen. Det heter broadcasting — og det er kjernen i hvorfor NumPy er så raskt.',
  /*  9.24–21.57 */ 'Si vi har et array med tre tall, og legger til ti. NumPy lager en kopi av ti for hver celle, og legger sammen elementvis. Vi får elleve, tolv, tretten.',
  /* 21.57–40.88 */ 'Nå et morsommere eksempel. En kolonne med tre tall — ti, tjue, tretti — møter en rad — én, to, tre. NumPy strekker kolonnen til høyre, og raden nedover, til de fyller det samme rutenettet. Så legger den sammen elementvis.',
  /* 40.88–56.30 */ 'Det er hele regelen. Sammenlign formene fra høyre. En dimensjon med størrelse én strekkes ut for å passe den andre. Slik vokser tre tall i en kolonne og tre tall i en rad til ni i et fullt rutenett.',
  /* 56.30–67    */ 'Små arrays vokser ut for å møte store, helt av seg selv. Det er derfor NumPy slipper unna med én regneoperasjon der ren Python trenger en løkke.',
];

const NARRATION_AUDIO = 'audio/numpy-broadcasting/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const ROW = [1, 2, 3];                        // beat 2 source array
const SCALAR = 10;                            // beat 2 scalar
const RESULT_1D = ROW.map((v) => v + SCALAR); // [11, 12, 13]

const COL2D = [10, 20, 30];                   // beat 3 column (shape 3,1)
const ROW2D = [1, 2, 3];                      // beat 3 row    (shape 1,3)
const RESULT_2D = COL2D.map((c) => ROW2D.map((r) => c + r));

// ─── Layout ────────────────────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }

// ─── Beat 2: scalar broadcast (GENUINE MOTION) ────────────────────────────
function ScalarBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();

  // Choreography milestones as fractions of the sprite duration.
  const T = Math.max(duration - 0.1, 1);
  const tCloneStart = 0.30 * T;   // scalar starts cloning
  const tCloneEnd   = 0.52 * T;   // three copies arrive in place
  const tPlusShow   = 0.58 * T;   // '+' glyphs fade in
  const tResultIn   = 0.66 * T;   // first result cell appears
  const tResultStep = 0.06 * T;   // gap between result cells

  // Layout — landscape vs portrait
  const cell = portrait ? 80 : 90;
  const gap = portrait ? 16 : 20;
  const pitch = cell + gap;
  const canvasW = portrait ? 720 : 1280;
  const x0 = Math.round((canvasW - (3 * pitch - gap)) / 2);
  const rowY = portrait ? 360 : 250;
  const scalarY = portrait ? 560 : 380;
  const resultY = portrait ? 880 : 560;
  const plusY = portrait ? 690 : 460;

  // Clone progress 0..1
  const clone = clamp((localTime - tCloneStart) / Math.max(tCloneEnd - tCloneStart, 0.001), 0, 1);
  const eased = 1 - Math.pow(1 - clone, 3);  // easeOutCubic

  // Scalar starts at the canvas centre below the row; clones travel out
  // to sit under each of the three cells.
  const centreX = Math.round(canvasW / 2 - cell / 2);
  const targets = [0, 1, 2].map((i) => x0 + i * pitch);

  // Result cells appear one after another.
  function resultVisible(i) {
    return localTime >= tResultIn + i * tResultStep;
  }

  return (
    <>
      {/* Title — the operation we're animating */}
      <FadeUp duration={0.4} delay={0.1} distance={8}
        style={{
          position: 'absolute', left: 0, right: 0, top: portrait ? 230 : 130,
          textAlign: 'center', fontVariantLigatures: 'none',
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 30 : 38,
          color: 'var(--chalk-100)',
        }}>
        arr + 10
      </FadeUp>

      {/* The source row: three teal cells */}
      {ROW.map((v, i) => (
        <FadeUp key={`row-${i}`} duration={0.4} delay={0.8 + i * 0.2} distance={8}
          style={cellStyle({ left: x0 + i * pitch, top: rowY, w: cell, h: cell,
                             border: 'var(--teal-400)', bg: 'rgba(0,0,0,0.35)',
                             color: 'var(--chalk-100)', fontSize: portrait ? 28 : 32 })}>
          {v}
        </FadeUp>
      ))}

      {/* Original scalar at centre — visible until the clone start, then
          the three copies (which include the centre) take over. */}
      {localTime < tCloneStart + 0.05 && (
        <FadeUp duration={0.4} delay={tCloneStart - 0.6} distance={8}
          style={cellStyle({ left: centreX, top: scalarY, w: cell, h: cell,
                             border: 'var(--amber-400)', bg: 'rgba(244,184,96,0.10)',
                             color: 'var(--amber-300)', fontSize: portrait ? 28 : 32 })}>
          {SCALAR}
        </FadeUp>
      )}

      {/* Three clones gliding from centre to target columns */}
      {localTime >= tCloneStart && targets.map((tx, i) => {
        const left = Math.round(lerp(centreX, tx, eased));
        // Centre clone is the original; left/right clones fade in as they
        // emerge from the centre.
        const isCentre = i === 1;
        const opacity = isCentre ? 1 : clamp(eased * 1.4, 0, 1);
        return (
          <div key={`clone-${i}`} style={{ ...cellStyle({
            left, top: scalarY, w: cell, h: cell,
            border: 'var(--amber-400)', bg: 'rgba(244,184,96,0.10)',
            color: 'var(--amber-300)', fontSize: portrait ? 28 : 32 }),
            opacity }}>
            {SCALAR}
          </div>
        );
      })}

      {/* '+' glyphs between the broadcast row and the result row */}
      {localTime >= tPlusShow && [0, 1, 2].map((i) => (
        <FadeUp key={`plus-${i}`} duration={0.3} delay={tPlusShow} distance={4}
          style={{
            position: 'absolute',
            left: x0 + i * pitch + cell / 2 - 8, top: plusY,
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 26,
            color: 'var(--chalk-200)', width: 16, textAlign: 'center',
          }}>
          +
        </FadeUp>
      ))}

      {/* Result row */}
      {RESULT_1D.map((v, i) => (
        resultVisible(i) && (
          <FadeUp key={`res-${i}`} duration={0.35} delay={tResultIn + i * tResultStep}
            distance={10}
            style={cellStyle({ left: x0 + i * pitch, top: resultY, w: cell, h: cell,
                               border: 'var(--amber-400)', bg: 'rgba(244,184,96,0.16)',
                               color: 'var(--amber-300)', fontSize: portrait ? 28 : 32 })}>
            {v}
          </FadeUp>
        )
      ))}

      {/* Tail caption */}
      {localTime >= tResultIn + 3 * tResultStep + 0.4 && (
        <FadeUp duration={0.45} delay={tResultIn + 3 * tResultStep + 0.4} distance={8}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: resultY + cell + 22, textAlign: 'center',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 17 : 20, color: 'var(--chalk-300)',
          }}>
          skalaren klones for hver celle.
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 3: column + row → grid (GENUINE 2D MOTION) ──────────────────────
function GridBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();

  // Choreography
  const T = Math.max(duration - 0.1, 1);
  const tShowCol = 0.04 * T;
  const tShowRow = 0.14 * T;
  const tTileStart = 0.30 * T;
  const tTileEnd   = 0.50 * T;
  const tResStart  = 0.56 * T;
  const tResStep   = 0.04 * T;
  const tAnnotate  = 0.82 * T;

  // Layout — grid origin GX, GY (top-left of the 3×3 region)
  const cell = portrait ? 84 : 100;
  const gap = portrait ? 10 : 14;
  const pitch = cell + gap;
  const canvasW = portrait ? 720 : 1280;
  const canvasH = portrait ? 1280 : 720;

  const gridW = 3 * pitch - gap;
  const gridH = 3 * pitch - gap;

  // Centre the 3×3 grid on the canvas (slight downward bias to leave room
  // for the source column/row at the left/top edges).
  const GX = Math.round((canvasW - gridW) / 2 + (portrait ? 30 : 50));
  const GY = portrait ? 360 : 200;

  // Source column sits to the LEFT of the grid; source row sits ABOVE.
  const SRC_GAP = portrait ? 50 : 64;
  const colX = GX - cell - SRC_GAP;
  const rowY = GY - cell - SRC_GAP;

  // Tile progress 0..1 — the column slides each ghost copy rightward from
  // colX into its target column inside the grid; the row slides each ghost
  // copy downward from rowY into its target row.
  const tile = clamp((localTime - tTileStart) / Math.max(tTileEnd - tTileStart, 0.001), 0, 1);
  const tileEased = 1 - Math.pow(1 - tile, 3);

  // Source column cells visible after tShowCol.
  const colVisible = localTime >= tShowCol;
  const rowVisible = localTime >= tShowRow;

  // Result cells visible one by one.
  function resVisible(i, j) {
    const order = i * 3 + j;
    return localTime >= tResStart + order * tResStep;
  }

  const showAnnotate = localTime >= tAnnotate;

  return (
    <>
      {/* Source column (shape 3,1) — three teal cells on the left */}
      {COL2D.map((v, i) => (
        colVisible && (
          <FadeUp key={`col-${i}`} duration={0.4} delay={tShowCol + i * 0.18} distance={8}
            style={cellStyle({ left: colX, top: GY + i * pitch, w: cell, h: cell,
                               border: 'var(--teal-400)', bg: 'rgba(0,0,0,0.35)',
                               color: 'var(--chalk-100)', fontSize: portrait ? 26 : 30 })}>
            {v}
          </FadeUp>
        )
      ))}

      {/* Source row (shape 1,3) — three rose cells above the grid */}
      {ROW2D.map((v, j) => (
        rowVisible && (
          <FadeUp key={`r-${j}`} duration={0.4} delay={tShowRow + j * 0.18} distance={8}
            style={cellStyle({ left: GX + j * pitch, top: rowY, w: cell, h: cell,
                               border: 'var(--rose-400)', bg: 'rgba(0,0,0,0.35)',
                               color: 'var(--chalk-100)', fontSize: portrait ? 26 : 30 })}>
            {v}
          </FadeUp>
        )
      ))}

      {/* Column tile-ghosts: three ghosted copies of the column glide from
          the source position to each grid column.
          Note: target column 0 starts at the source position, so it's the
          identity slide; copies 1 and 2 actually travel.
          For each (i, j), the ghost shows COL2D[i] sliding to (GX + j*pitch, GY + i*pitch). */}
      {localTime >= tTileStart && COL2D.map((v, i) =>
        [0, 1, 2].map((j) => {
          const startX = colX;
          const endX = GX + j * pitch;
          const x = Math.round(lerp(startX, endX, tileEased));
          const isOrigin = j === 0;
          const opacity = isOrigin ? 0.45 : clamp(tileEased * 0.9, 0, 0.45);
          return (
            <div key={`gc-${i}-${j}`} style={{ ...cellStyle({
              left: x, top: GY + i * pitch, w: cell, h: cell,
              border: 'var(--teal-400)', bg: 'rgba(0,0,0,0.25)',
              color: 'var(--chalk-300)', fontSize: portrait ? 22 : 26 }),
              opacity }}>
              {v}
            </div>
          );
        })
      )}

      {/* Row tile-ghosts: each row cell slides down through three rows.
          Drawn on top of the column ghosts but at lower opacity so both
          source colours remain readable. */}
      {localTime >= tTileStart && ROW2D.map((v, j) =>
        [0, 1, 2].map((i) => {
          const startY = rowY;
          const endY = GY + i * pitch;
          const y = Math.round(lerp(startY, endY, tileEased));
          const isOrigin = i === 0;
          const opacity = isOrigin ? 0.40 : clamp(tileEased * 0.8, 0, 0.40);
          return (
            <div key={`gr-${j}-${i}`} style={{ ...cellStyle({
              left: GX + j * pitch, top: y, w: cell, h: cell,
              border: 'var(--rose-400)', bg: 'rgba(232,122,144,0.05)',
              color: 'var(--chalk-300)', fontSize: portrait ? 22 : 26 }),
              opacity }}>
              {v}
            </div>
          );
        })
      )}

      {/* Result cells — elementwise sums fading in one at a time */}
      {RESULT_2D.map((row, i) => row.map((v, j) => (
        resVisible(i, j) && (
          <FadeUp key={`res-${i}-${j}`} duration={0.3}
            delay={tResStart + (i * 3 + j) * tResStep} distance={6}
            style={cellStyle({ left: GX + j * pitch, top: GY + i * pitch, w: cell, h: cell,
                               border: 'var(--amber-400)', bg: 'rgba(244,184,96,0.16)',
                               color: 'var(--amber-300)', fontSize: portrait ? 26 : 30 })}>
            {v}
          </FadeUp>
        )
      )))}

      {/* Annotation under the grid: "3, 1  +  1, 3  →  3, 3" */}
      {showAnnotate && (
        <FadeUp duration={0.45} delay={tAnnotate} distance={8}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: GY + gridH + 28, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontVariantLigatures: 'none',
            fontSize: portrait ? 17 : 22, color: 'var(--chalk-200)',
          }}>
          <span style={{ color: 'var(--teal-400)' }}>(3, 1)</span>
          <span style={{ margin: '0 12px', color: 'var(--chalk-300)' }}>+</span>
          <span style={{ color: 'var(--rose-400)' }}>(1, 3)</span>
          <span style={{ margin: '0 12px', color: 'var(--chalk-300)' }}>=</span>
          <span style={{ color: 'var(--amber-300)' }}>(3, 3)</span>
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 4: the rule — 1 stretches to 3 ──────────────────────────────────
function RuleBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();

  const T = Math.max(duration - 0.1, 1);
  const tShowShapes = 0.04 * T;
  const tStretchStart = 0.30 * T;
  const tStretchEnd   = 0.55 * T;
  const tPayoff       = 0.62 * T;
  const tCaption      = 0.80 * T;

  // Stretch progress 0..1 — the '1' digit visually morphs/slides into '3'.
  const stretch = clamp((localTime - tStretchStart) / Math.max(tStretchEnd - tStretchStart, 0.001), 0, 1);
  const showThree = stretch > 0.5;

  // Layout
  const fontSize = portrait ? 36 : 52;
  const shapeColor = 'var(--chalk-100)';
  const stretchColor = 'var(--amber-300)';

  return (
    <>
      {/* The two source shapes — (3, 1) and (1, 3), with the stretchable '1's
          highlighted in amber */}
      <FadeUp duration={0.45} delay={tShowShapes} distance={8}
        style={{
          position: 'absolute', left: 0, right: 0, top: portrait ? 380 : 230,
          textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontVariantLigatures: 'none',
          fontSize, color: shapeColor,
        }}>
        <span style={{ color: 'var(--teal-400)' }}>
          (3,{' '}
          <span style={{
            color: stretch > 0 ? stretchColor : shapeColor,
            transition: 'color 0.25s linear',
            display: 'inline-block',
            transform: stretch > 0 ? `scale(${1 + stretch * 0.4})` : 'scale(1)',
            transformOrigin: 'center',
          }}>
            {showThree ? '3' : '1'}
          </span>
          )
        </span>
        <span style={{ margin: portrait ? '0 18px' : '0 28px', color: 'var(--chalk-300)' }}>
          +
        </span>
        <span style={{ color: 'var(--rose-400)' }}>
          (<span style={{
            color: stretch > 0 ? stretchColor : shapeColor,
            transition: 'color 0.25s linear',
            display: 'inline-block',
            transform: stretch > 0 ? `scale(${1 + stretch * 0.4})` : 'scale(1)',
            transformOrigin: 'center',
          }}>
            {showThree ? '3' : '1'}
          </span>
          , 3)
        </span>
      </FadeUp>

      {/* Bracket-style hint under each stretched '1' */}
      {localTime >= tStretchStart && (
        <FadeUp duration={0.4} delay={tStretchStart} distance={6}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: portrait ? 470 : 320, textAlign: 'center',
            fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 17,
            color: 'var(--chalk-300)', fontStyle: 'italic',
          }}>
          størrelse én strekkes ut til å passe.
        </FadeUp>
      )}

      {/* Payoff shape (3, 3) */}
      {localTime >= tPayoff && (
        <FadeUp duration={0.5} delay={tPayoff} distance={12}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: portrait ? 580 : 420, textAlign: 'center',
            fontFamily: 'var(--font-mono)', fontVariantLigatures: 'none',
            fontSize: portrait ? 40 : 60, color: 'var(--amber-300)',
          }}>
          (3, 3)
        </FadeUp>
      )}

      {/* Closing caption */}
      {localTime >= tCaption && (
        <FadeUp duration={0.45} delay={tCaption} distance={8}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: portrait ? 700 : 520, textAlign: 'center',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 17 : 22, color: 'var(--chalk-200)',
            maxWidth: portrait ? '24ch' : '40ch',
            marginLeft: 'auto', marginRight: 'auto',
          }}>
          Sammenlign formene fra høyre — størrelse én strekkes ut.
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
        broadcasting
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '36ch', lineHeight: 1.25 }}>
        små arrays vokser ut for å møte <span style={{ color: 'var(--amber-300)' }}>store.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
          color: 'var(--amber-300)', fontVariantLigatures: 'none',
        }}>
        np.array + np.array
      </FadeUp>
    </div>
  );
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function cellStyle({ left, top, w, h, border, bg, color, fontSize }) {
  return {
    position: 'absolute', left, top, width: w, height: h, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: `2px solid ${border}`, borderRadius: 10, background: bg,
    fontFamily: 'var(--font-mono)', fontSize, color,
    transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear, opacity 0.4s linear',
  };
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="numpy"
      title="NumPy: broadcasting"
      duration={SCENE_DURATION}
      introEnd={9.24}
      introCaption="Små arrays vokser ut for å møte store."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.24} end={21.57}>
        <ScalarBeat/>
      </Sprite>

      <Sprite start={21.57} end={40.88}>
        <GridBeat/>
      </Sprite>

      <Sprite start={40.88} end={56.3}>
        <RuleBeat/>
      </Sprite>

      <Sprite start={56.3} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
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
