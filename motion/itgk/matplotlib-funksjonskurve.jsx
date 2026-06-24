// Matplotlib: kurven er prikker som er koblet — Manimo lesson scene.
// Chapter 13 of itgk (Matplotlib og visualisering) — the first scene in this
// chapter. plt.plot looks like a smooth curve but is really sampled points
// connected by line segments. We make that mechanical: a pointer marches
// across the x-axis dropping teal dots at sin(x_i) while the ys-array fills
// cell by cell; then amber line segments draw between consecutive dots; then
// N jumps from 8 to 50 and the gaps fill in with rose dots so the polyline
// reads as a smooth curve.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–  9   Manimo hook
//    9– 25   Sample beat: pointer sweeps, 8 teal dots land, ys-row fills (GENUINE MOTION)
//   25– 37   Connect beat: amber segments draw dot-to-dot (GENUINE MOTION)
//   37– 50   Densify beat: N flips 8 → 50, 42 rose dots fill in, smoother polyline (GENUINE MOTION)
//   50– 58   Takeaway
//
// Colour discipline:
//   chalk-100  code text, primary values
//   chalk-200  body text on dark
//   chalk-300  axis ticks, dimmed labels, helper text
//   amber-300  payoff readouts, jagged polyline (beats 3 + 4 dim copy)
//   amber-400  pointer, code-line accent, dense polyline (beat 4)
//   teal-400   sampled dots (the data we captured)
//   rose-400   the extra "more samples" dots in beat 4
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.
//
// NOTE (Norwegian narration): generate-audio.js routes language: "no" scenes
// to ElevenLabs eleven_turbo_v2_5 with language_code "no" and voice Liam —
// multilingual_v2 reads bokmål as Danish.

const SCENE_DURATION = 66;

const NARRATION = [
  /*  0–  9 */ 'Når du ber matplotlib tegne en kurve, ser den glatt og rund ut. Men hva gjør plot egentlig? La oss følge med, punkt for punkt.',
  /*  9– 25 */ 'Først lager vi prøvepunktene. linspace gir oss åtte tall jevnt fordelt over intervallet, fra null og opp mot to pi. For hver av disse verdiene regner vi ut sinusen, og dropper en prikk i koordinatsystemet. Pekeren marsjerer fra venstre mot høyre, og ys-listen fylles, celle for celle.',
  /* 25– 37 */ 'Nå tar plot over. Den kobler sammen prikk og prikk med rette linjestykker. Det er hele jobben. Du gir den listene xs og ys, og den tegner linjer fra punkt til punkt.',
  /* 37– 50 */ 'Men hvorfor ser kurven da glatt ut i praksis? Fordi du bytter åtte prøvepunkter med femti. Samme funksjon, samme kode, bare flere punkter. Linjestykkene blir så små at øyet leser dem som en jevn kurve.',
  /* 50– 58 */ 'Matplotlib kobler prikker, ingen magi i kurven. Vil du ha den jevnere, gir du den bare flere prøvepunkter.',
];

const NARRATION_AUDIO = 'audio/matplotlib-funksjonskurve/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const TWO_PI = Math.PI * 2;

const N_SPARSE = 8;
const N_DENSE = 50;

function linspace(a, b, n) {
  if (n <= 1) return [a];
  const out = [];
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) out.push(a + i * step);
  return out;
}

const XS_SPARSE = linspace(0, TWO_PI, N_SPARSE);
const YS_SPARSE = XS_SPARSE.map(Math.sin);
const XS_DENSE = linspace(0, TWO_PI, N_DENSE);
const YS_DENSE = XS_DENSE.map(Math.sin);

const CODE_8 = [
  'xs = np.linspace(0, 2*np.pi, 8)',
  'ys = np.sin(xs)',
  'plt.plot(xs, ys)',
  'plt.show()',
].join('\n');

const CODE_50 = [
  'xs = np.linspace(0, 2*np.pi, 50)',
  'ys = np.sin(xs)',
  'plt.plot(xs, ys)',
  'plt.show()',
].join('\n');

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      // Code panel
      codeLeft: 56, codeTop: 250, codeFont: 22,
      // Plot — SVG positioned absolutely
      plotLeft: 50, plotTop: 480,
      plotW: 620, plotH: 360,
      // ys-array row below the plot
      cell: 56, cellGap: 6, cellsTop: 960, cellFont: 16,
      // VarBox i — sits ABOVE the ys row so Manimo (bottom-left corner) is clear
      iLeft: 90, iTop: 860,
    };
  }
  return {
    codeLeft: 80, codeTop: 200, codeFont: 22,
    plotLeft: 530, plotTop: 170,
    plotW: 680, plotH: 420,
    cell: 56, cellGap: 6, cellsTop: 610, cellFont: 16,
    iLeft: 80, iTop: 470,
  };
}

// Convert (x, y) in math coords → plot pixel coords. x in [0, 2π], y in [-1.2, 1.2].
function plotMap(G, x, y) {
  const padL = 38, padR = 18, padT = 16, padB = 30;
  const innerW = G.plotW - padL - padR;
  const innerH = G.plotH - padT - padB;
  const px = G.plotLeft + padL + (x / TWO_PI) * innerW;
  const py = G.plotTop + padT + ((1.2 - y) / 2.4) * innerH;
  return { px, py };
}

function lerp(a, b, t) { return a + (b - a) * t; }
function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

// ─── Plot frame: axes + ticks + sin reference curve (faint) ────────────────
function PlotFrame({ G, showRef = false }) {
  const portrait = usePortrait();
  // Sample 80 points for the faint reference curve (only used in late beats).
  const refPts = linspace(0, TWO_PI, 80).map((x) => plotMap(G, x, Math.sin(x)));
  const refD = refPts.map((p, i) => (i === 0 ? `M ${p.px} ${p.py}` : `L ${p.px} ${p.py}`)).join(' ');

  // Axis pixel coords
  const { px: x0px, py: yAxisPyTop } = plotMap(G, 0, 1.2);
  const { px: xRpx, py: yAxisPyBot } = plotMap(G, TWO_PI, -1.2);
  const yZero = plotMap(G, 0, 0).py;

  // Tick positions on x: 0, π/2, π, 3π/2, 2π
  const xTicks = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2, TWO_PI];
  const xTickLabels = ['0', 'π/2', 'π', '3π/2', '2π'];

  // Tick positions on y: -1, 0, 1
  const yTicks = [-1, 0, 1];

  const tickColor = 'rgba(232,220,193,0.35)';
  const axisColor = 'rgba(232,220,193,0.55)';
  const labelColor = 'var(--chalk-300)';
  const tickFont = portrait ? 12 : 13;

  return (
    <>
      {/* Axes */}
      <line x1={x0px} y1={yAxisPyTop} x2={x0px} y2={yAxisPyBot}
            stroke={axisColor} strokeWidth={1.5}/>
      <line x1={x0px} y1={yZero} x2={xRpx} y2={yZero}
            stroke={axisColor} strokeWidth={1.5}/>

      {/* x-ticks */}
      {xTicks.map((x, i) => {
        const { px } = plotMap(G, x, 0);
        return (
          <g key={`xt-${i}`}>
            <line x1={px} y1={yZero - 4} x2={px} y2={yZero + 4}
                  stroke={tickColor} strokeWidth={1}/>
            <text x={px} y={yZero + 18}
                  fill={labelColor} textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={tickFont}>
              {xTickLabels[i]}
            </text>
          </g>
        );
      })}

      {/* y-ticks */}
      {yTicks.map((y, i) => {
        const { py } = plotMap(G, 0, y);
        return (
          <g key={`yt-${i}`}>
            <line x1={x0px - 4} y1={py} x2={x0px + 4} y2={py}
                  stroke={tickColor} strokeWidth={1}/>
            <text x={x0px - 8} y={py + 4}
                  fill={labelColor} textAnchor="end"
                  fontFamily="var(--font-mono)" fontSize={tickFont}>
              {y}
            </text>
          </g>
        );
      })}

      {/* Faint reference sin curve — only drawn when explicitly asked */}
      {showRef && (
        <path d={refD} fill="none" stroke="rgba(232,220,193,0.10)"
              strokeWidth={1.5} strokeDasharray="3 5"/>
      )}
    </>
  );
}

// ─── VarBox (HTML element — sits in absolute positioning) ─────────────────
function VarBox({ name, value, flash, portrait, accent = 'amber' }) {
  const accentColor = accent === 'rose' ? 'var(--rose-400)' : 'var(--amber-400)';
  const flashBg = accent === 'rose' ? 'rgba(232,122,144,0.18)' : 'rgba(244,184,96,0.16)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                     fontSize: portrait ? 17 : 19, color: 'var(--chalk-300)' }}>{name}</span>
      <div style={{
        minWidth: portrait ? 70 : 80, padding: '8px 18px', textAlign: 'center', borderRadius: 10,
        border: `2px solid ${flash ? accentColor : 'rgba(232,220,193,0.25)'}`,
        fontFamily: 'var(--font-mono)', fontSize: portrait ? 26 : 30, color: 'var(--chalk-100)',
        background: flash ? flashBg : 'rgba(0,0,0,0.35)',
        transition: 'background 0.25s linear, border-color 0.25s linear',
      }}>
        {value === null || value === undefined ? '–' : value}
      </div>
    </div>
  );
}

// ─── ys-array row of small cells beneath the plot ─────────────────────────
function YsRow({ G, filled, portrait }) {
  // Centred under the plot.
  const totalW = N_SPARSE * G.cell + (N_SPARSE - 1) * G.cellGap;
  const x0 = G.plotLeft + Math.round((G.plotW - totalW) / 2);
  return (
    <>
      {/* eyebrow label */}
      <div style={{
        position: 'absolute', left: x0, top: G.cellsTop - 24,
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
        letterSpacing: '0.16em', textTransform: 'uppercase',
      }}>
        ys
      </div>
      {YS_SPARSE.map((v, i) => {
        const isFilled = i < filled;
        return (
          <div key={`ys-${i}`} style={{
            position: 'absolute',
            left: x0 + i * (G.cell + G.cellGap), top: G.cellsTop,
            width: G.cell, height: G.cell, boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `2px solid ${isFilled ? 'var(--teal-400)' : 'rgba(232,220,193,0.18)'}`,
            borderRadius: 8,
            background: isFilled ? 'rgba(45,164,160,0.10)' : 'rgba(0,0,0,0.35)',
            fontFamily: 'var(--font-mono)', fontSize: G.cellFont,
            color: isFilled ? 'var(--chalk-100)' : 'var(--chalk-300)',
            transition: 'background 0.25s linear, border-color 0.25s linear, color 0.25s linear',
            fontVariantLigatures: 'none',
          }}>
            {isFilled ? v.toFixed(2) : '–'}
          </div>
        );
      })}
    </>
  );
}

// ─── Beat 2: sample (GENUINE MOTION — pointer sweeps, dots land) ──────────
function SampleBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  // Choreography
  const T = Math.max(duration - 0.1, 1);
  const tEnterEnd = 0.16 * T;             // code + axes settled
  const tTailHold = 0.10 * T;             // hold after last sample
  const tStart = tEnterEnd;
  const tEnd = T - tTailHold;
  const perStep = (tEnd - tStart) / N_SPARSE;

  // Continuous step coordinate s ∈ [0, N]
  const sRaw = (localTime - tStart) / perStep;
  const s = clamp(sRaw, -0.2, N_SPARSE + 0.0001);
  const started = sRaw >= 0;
  const finished = sRaw >= N_SPARSE;
  const idx = finished ? N_SPARSE - 1 : Math.max(0, Math.floor(s));
  const stepFrac = clamp(s - Math.floor(s), 0, 1);

  // Once stepFrac > 0.35 the dashed line + dot for this step have "landed".
  const landed = started && !finished && stepFrac > 0.35;
  // After finished, every dot is landed.
  const dotsLanded = finished ? N_SPARSE : (started ? idx + (landed ? 1 : 0) : 0);

  // Pointer x in plot coords
  const pointerX = !started ? 0 : clamp(s, 0, N_SPARSE - 1);
  // Map the continuous step to an x-value (so the pointer glides smoothly
  // between sampled positions instead of teleporting).
  const xMath = (pointerX / (N_SPARSE - 1)) * TWO_PI;
  const { px: pxPointer } = plotMap(G, xMath, 0);
  const { py: yZero } = plotMap(G, 0, 0);

  // For the current step, dashed vertical guide from x-axis to sin(x_i)
  // (only while landing — fades after).
  const showGuide = started && !finished;
  const currentY = Math.sin(xMath);
  const { py: yCurrent } = plotMap(G, xMath, currentY);

  // i + ys[i] VarBoxes
  const iVal = !started ? null : idx;
  const ysVal = !started ? null : (landed ? YS_SPARSE[idx].toFixed(2) : null);
  const flashI = started && !finished && stepFrac < 0.45;
  const flashYs = landed && stepFrac < 0.7;

  const codeAccent = 'var(--amber-400)';
  const highlightLine = !started ? '1' : (landed ? '2' : '1');

  return (
    <>
      <CodeBlock
        code={CODE_8}
        title="sin_plot.py"
        reveal="all"
        highlight={highlightLine}
        accent={codeAccent}
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={{ position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' }}
      />

      {/* Plot — SVG positioned absolutely */}
      <svg style={{ position: 'absolute', left: 0, top: 0,
                    width: portrait ? 720 : 1280, height: portrait ? 1280 : 720,
                    pointerEvents: 'none' }}>
        <PlotFrame G={G}/>

        {/* Dashed vertical guide for the current sample */}
        {showGuide && (
          <line x1={pxPointer} y1={yZero} x2={pxPointer} y2={yCurrent}
                stroke="rgba(244,184,96,0.55)" strokeWidth={1.5}
                strokeDasharray="4 4"/>
        )}

        {/* Teal sample dots that have landed */}
        {XS_SPARSE.slice(0, dotsLanded).map((x, i) => {
          const { px, py } = plotMap(G, x, YS_SPARSE[i]);
          // Fade-in via opacity (avoid FadeUp in SVG).
          return (
            <g key={`dot-${i}`}>
              <circle cx={px} cy={py} r={6}
                      fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1.2}
                      opacity={0.95}/>
            </g>
          );
        })}

        {/* Pointer triangle on the x-axis */}
        {started && !finished && (
          <polygon
            points={`${pxPointer - 7},${yZero + 18} ${pxPointer + 7},${yZero + 18} ${pxPointer},${yZero + 6}`}
            fill="var(--amber-400)"/>
        )}
      </svg>

      {/* ys-array row */}
      <YsRow G={G} filled={dotsLanded} portrait={portrait}/>

      {/* i-VarBox + ys[i] caption */}
      <div style={{ position: 'absolute', left: G.iLeft, top: G.iTop,
                    display: 'flex', flexDirection: 'row', gap: portrait ? 18 : 22 }}>
        <VarBox name="i" value={iVal} flash={flashI} portrait={portrait}/>
        <VarBox name="sin(xs[i])" value={ysVal} flash={flashYs} portrait={portrait}/>
      </div>

      {/* Finished badge */}
      {finished && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: G.plotLeft, top: G.plotTop - 36,
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
          åtte prøvepunkter på plass
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 3: connect (GENUINE MOTION — line segments draw dot-to-dot) ─────
function ConnectBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  const T = Math.max(duration - 0.1, 1);
  const tEnter = 0.10 * T;
  const tStart = tEnter;
  const tEnd = 0.78 * T;
  const segCount = N_SPARSE - 1;
  const perSeg = (tEnd - tStart) / segCount;

  // For each segment i→i+1, compute fraction drawn.
  function segProgress(i) {
    const t0 = tStart + i * perSeg;
    return clamp((localTime - t0) / perSeg, 0, 1);
  }

  // Build cumulative polyline points up to and including the current partial
  // segment endpoint.
  const segments = [];
  for (let i = 0; i < segCount; i++) {
    const p = segProgress(i);
    if (p <= 0) break;
    const a = plotMap(G, XS_SPARSE[i], YS_SPARSE[i]);
    const b = plotMap(G, XS_SPARSE[i + 1], YS_SPARSE[i + 1]);
    const eased = easeOutCubic(p);
    const x = lerp(a.px, b.px, eased);
    const y = lerp(a.py, b.py, eased);
    segments.push({ a, b, x, y, done: p >= 0.999 });
  }

  const allDone = segments.length === segCount && segments[segCount - 1].done;
  const tCaption = 0.88 * T;
  const showCaption = localTime >= tCaption;

  return (
    <>
      <CodeBlock
        code={CODE_8}
        title="sin_plot.py"
        reveal="all"
        highlight="3"
        accent="var(--amber-400)"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={{ position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' }}
      />

      <svg style={{ position: 'absolute', left: 0, top: 0,
                    width: portrait ? 720 : 1280, height: portrait ? 1280 : 720,
                    pointerEvents: 'none' }}>
        <PlotFrame G={G}/>

        {/* All 8 teal sample dots — already shown */}
        {XS_SPARSE.map((x, i) => {
          const { px, py } = plotMap(G, x, YS_SPARSE[i]);
          return (
            <circle key={`dot-${i}`} cx={px} cy={py} r={6}
                    fill="var(--teal-400)" stroke="var(--chalk-100)" strokeWidth={1.2}/>
          );
        })}

        {/* Amber polyline being drawn segment by segment */}
        {segments.map((seg, i) => (
          <line key={`seg-${i}`}
                x1={seg.a.px} y1={seg.a.py} x2={seg.x} y2={seg.y}
                stroke="var(--amber-400)" strokeWidth={3} strokeLinecap="round"
                opacity={0.95}/>
        ))}
      </svg>

      {/* ys-array row (all 8 filled — visual continuity with beat 2) */}
      <YsRow G={G} filled={N_SPARSE} portrait={portrait}/>

      {/* Caption */}
      {showCaption && (
        <FadeUp duration={0.45} delay={tCaption} distance={8}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: G.cellsTop + G.cell + 36, textAlign: 'center',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 18 : 22, color: 'var(--chalk-200)',
            maxWidth: portrait ? '24ch' : '40ch',
            marginLeft: 'auto', marginRight: 'auto',
          }}>
          rette linjer mellom prikkene — det er hele jobben.
        </FadeUp>
      )}

      {/* "ferdig" badge once the polyline is complete */}
      {allDone && (
        <FadeUp duration={0.35} delay={0} distance={6}
          style={{
            position: 'absolute', left: G.plotLeft, top: G.plotTop - 36,
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.16em', textTransform: 'uppercase',
          }}>
          polylinje ferdig
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 4: densify (GENUINE MOTION — 8 → 50 samples) ───────────────────
function DensifyBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);

  const T = Math.max(duration - 0.1, 1);
  const tDim = 0.10 * T;        // jagged baseline dims
  const tStart = 0.18 * T;      // dense dots begin to fade in
  const tEnd = 0.62 * T;        // all 50 dots in place
  const tPoly = 0.55 * T;       // dense polyline starts drawing
  const tPolyEnd = 0.82 * T;
  const tCaption = 0.88 * T;

  // 0..1 fraction of dense dots visible.
  const denseFrac = clamp((localTime - tStart) / Math.max(tEnd - tStart, 0.001), 0, 1);
  const denseVisible = Math.floor(denseFrac * N_DENSE);

  // Polyline draw progress.
  const polyP = clamp((localTime - tPoly) / Math.max(tPolyEnd - tPoly, 0.001), 0, 1);
  const polyEased = easeOutCubic(polyP);
  const polyToX = polyEased * TWO_PI;

  // Build dense polyline up to polyToX.
  const dPts = [];
  for (let i = 0; i < N_DENSE; i++) {
    if (XS_DENSE[i] > polyToX && i > 0) {
      // Interpolate to exact polyToX
      const x0 = XS_DENSE[i - 1];
      const x1 = XS_DENSE[i];
      const t = (polyToX - x0) / (x1 - x0);
      const yI = lerp(Math.sin(x0), Math.sin(x1), t);
      dPts.push(plotMap(G, polyToX, yI));
      break;
    }
    dPts.push(plotMap(G, XS_DENSE[i], YS_DENSE[i]));
    if (i === N_DENSE - 1 && polyEased >= 0.999) break;
  }
  const dD = dPts.map((p, i) => (i === 0 ? `M ${p.px} ${p.py}` : `L ${p.px} ${p.py}`)).join(' ');

  // Sparse polyline dimming.
  const baselineDim = clamp((localTime - tDim) / 0.5, 0, 1);
  const baselineOpacity = lerp(0.95, 0.22, baselineDim);

  return (
    <>
      <CodeBlock
        code={CODE_50}
        title="sin_plot.py"
        reveal="all"
        highlight="1"
        accent="var(--amber-400)"
        fontSize={G.codeFont}
        duration={0.3}
        delay={0}
        style={{ position: 'absolute', left: G.codeLeft, top: G.codeTop, fontVariantLigatures: 'none' }}
      />

      {/* "N = 50" callout above the plot */}
      <FadeUp duration={0.4} delay={0.2} distance={8}
        style={{
          position: 'absolute', left: G.plotLeft, top: G.plotTop - 36,
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--amber-300)', letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
        flere prøvepunkter — n går fra 8 til 50
      </FadeUp>

      <svg style={{ position: 'absolute', left: 0, top: 0,
                    width: portrait ? 720 : 1280, height: portrait ? 1280 : 720,
                    pointerEvents: 'none' }}>
        <PlotFrame G={G}/>

        {/* Faded jagged baseline polyline (carryover from beat 3) */}
        <path
          d={(() => {
            const pts = XS_SPARSE.map((x, i) => plotMap(G, x, YS_SPARSE[i]));
            return pts.map((p, i) => (i === 0 ? `M ${p.px} ${p.py}` : `L ${p.px} ${p.py}`)).join(' ');
          })()}
          fill="none" stroke="var(--amber-300)" strokeWidth={2}
          opacity={baselineOpacity}/>

        {/* 8 teal sample dots, faded slightly */}
        {XS_SPARSE.map((x, i) => {
          const { px, py } = plotMap(G, x, YS_SPARSE[i]);
          return (
            <circle key={`dot-sparse-${i}`} cx={px} cy={py} r={5}
                    fill="var(--teal-400)" opacity={lerp(0.95, 0.55, baselineDim)}/>
          );
        })}

        {/* Dense rose dots fading in */}
        {XS_DENSE.slice(0, denseVisible).map((x, i) => {
          // Skip positions that coincide closely with a sparse dot to avoid stacking.
          const isNearSparse = XS_SPARSE.some((xs) => Math.abs(xs - x) < 0.04);
          if (isNearSparse) return null;
          const { px, py } = plotMap(G, x, YS_DENSE[i]);
          return (
            <circle key={`dot-dense-${i}`} cx={px} cy={py} r={3.5}
                    fill="var(--rose-400)" opacity={0.92}/>
          );
        })}

        {/* Dense polyline drawing in amber */}
        {polyP > 0 && (
          <path d={dD} fill="none" stroke="var(--amber-400)"
                strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"
                opacity={0.95}/>
        )}
      </svg>

      {/* Caption */}
      {localTime >= tCaption && (
        <FadeUp duration={0.45} delay={tCaption} distance={8}
          style={{
            position: 'absolute', left: 0, right: 0,
            top: G.plotTop + G.plotH + 20, textAlign: 'center',
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: portrait ? 18 : 22, color: 'var(--amber-300)',
            maxWidth: portrait ? '24ch' : '42ch',
            marginLeft: 'auto', marginRight: 'auto',
          }}>
          samme kode — flere prøvepunkter, glattere kurve.
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
        matplotlib
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '34ch', lineHeight: 1.25 }}>
        kurven er prikker som er <span style={{ color: 'var(--amber-300)' }}>koblet.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
          color: 'var(--amber-300)', fontVariantLigatures: 'none',
        }}>
        plt.plot(xs, ys)
      </FadeUp>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="matplotlib"
      title="Matplotlib: kurven er prikker som er koblet"
      duration={SCENE_DURATION}
      introEnd={9.89}
      introCaption="Kurven er bare prikker — koblet sammen."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={9.89} end={30.57}>
        <SampleBeat/>
      </Sprite>

      <Sprite start={30.57} end={42.12}>
        <ConnectBeat/>
      </Sprite>

      <Sprite start={42.12} end={56.87}>
        <DensifyBeat/>
      </Sprite>

      <Sprite start={56.87} end={SCENE_DURATION}>
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
