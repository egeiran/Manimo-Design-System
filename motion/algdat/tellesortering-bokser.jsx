// Tellesortering: tall i bokser — Manimo lesson scene.
// Chapter 4 of algdat (Sortering i lineær tid og utvalg). Counting sort
// without a single comparison: ten input cells with values 1..6 fall
// one-by-one into six labelled boxes, then the boxes empty left-to-right
// straight into a sorted output row. Lands on O(n + k) — linear when
// the value range k is small.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 8     Manimo hook
//    8–20     Oppsett — input row + six empty buckets appear
//   20–40     Telling — ten input cells fly into buckets (GENUINE MOTION)
//   40–55     Uttømming — buckets drain into output row in order (GENUINE MOTION)
//   55–66     Takeaway — O(n + k)
//
// Colour discipline:
//   chalk-100  cell values, hero text
//   chalk-300  dimmed text, bucket labels, output placeholders
//   amber-400  scan pointer, primary stroke, active bucket
//   amber-300  counter, payoff, output cells
//   teal-400   bucket label band, "ferdig" highlight
//   rose-400   "comparison-free" call-out
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 63;

const NARRATION = [
  /*  0– 8  */ 'Kan du sortere ti tall uten å sammenligne et eneste par? Hvis tallene er små nok, kan du det.',
  /*  8–20  */ 'Vi har ti tall mellom én og seks. I stedet for å sammenligne dem, gir vi hver verdi sin egen boks. Seks bokser, én for hvert mulige tall.',
  /* 20–40  */ 'Vi går gjennom lista én gang. For hver verdi slipper vi tallet ned i den boksen som hører til. Tre — ned i boksen for tre. En — ned i boksen for én. Slik fortsetter vi til hele lista er flyttet inn i boksene.',
  /* 40–55  */ 'Nå tømmer vi boksene i rekkefølge fra venstre mot høyre. Først alle énerne, så toerne, så treerne, og videre. Det vi får ut er en sortert liste — uten å sammenligne to tall.',
  /* 55–66  */ 'En runde gjennom lista, og en runde gjennom boksene. Kjøretid orden n pluss k. Når k er liten, slår tellesortering selv den raskeste sammenligningsorteringen.',
];

const NARRATION_AUDIO = 'audio/tellesortering-bokser/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const INPUT  = [3, 1, 4, 1, 5, 2, 6, 5, 3, 2];     // ten values, k = 6
const K      = 6;                                   // value range 1..K
const SORTED = [...INPUT].sort((a, b) => a - b);    // [1,1,2,2,3,3,4,5,5,6]

// For each input index i: depth = how many earlier indices share its value.
// That fixes its stacked slot inside its bucket.
const DEPTH_IN_BUCKET = (() => {
  const seen = new Array(K + 1).fill(0);
  return INPUT.map((v) => {
    const d = seen[v];
    seen[v] += 1;
    return d;
  });
})();

// Per-bucket total counts.
const BUCKET_COUNT = (() => {
  const c = new Array(K + 1).fill(0);
  for (const v of INPUT) c[v] += 1;
  return c;
})();

// Emission order during the drain beat: walk buckets 1..K, inside each
// bucket walk from the BOTTOM of the stack to the TOP (i.e. earliest-
// dropped first). For each emit step k = 0..9, record which input index
// is leaving and which output slot it lands in.
const EMIT_STEPS = (() => {
  // Bucket → list of input indices in drop order.
  const dropsByBucket = Array.from({ length: K + 1 }, () => []);
  INPUT.forEach((v, i) => dropsByBucket[v].push(i));
  const steps = [];
  let outSlot = 0;
  for (let v = 1; v <= K; v++) {
    for (const i of dropsByBucket[v]) {
      steps.push({ inputIdx: i, bucket: v, outSlot });
      outSlot += 1;
    }
  }
  return steps;                                    // length 10
})();

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    // Portrait 720x1280. Stack input → buckets → output vertically with
    // tighter cells and a ~85% font ratio.
    return {
      svgW: 720, svgH: 1280,
      cellW: 44, cellH: 44, cellGap: 4,           // input + output cells
      bucketW: 78, bucketH: 230, bucketGap: 12,    // bucket box
      bucketCellW: 38, bucketCellH: 32, bucketCellGap: 4,
      valueFont: 18, bucketLabelFont: 13,
      inputRowY: 240, bucketRowY: 380, outputRowY: 880,
      counterX: 60, counterY: 1100, counterFont: 22,
      captionY: 1180, captionFont: 14,
      inputRowX: null,                             // null → centre
      outputRowX: null,
      bucketsX: null,
    };
  }
  // Landscape 1280x720
  return {
    svgW: 1280, svgH: 720,
    cellW: 48, cellH: 48, cellGap: 4,
    bucketW: 88, bucketH: 270, bucketGap: 14,
    bucketCellW: 44, bucketCellH: 38, bucketCellGap: 4,
    valueFont: 21, bucketLabelFont: 14,
    inputRowY: 132, bucketRowY: 215, outputRowY: 560,
    counterX: 56, counterY: 638, counterFont: 26,
    captionY: 678, captionFont: 16,
    inputRowX: null,
    outputRowX: null,
    bucketsX: null,
  };
}

// Compute absolute geometry once the canvas size is known.
function geometry(G) {
  const inputPitch = G.cellW + G.cellGap;
  const inputTotal = INPUT.length * inputPitch - G.cellGap;
  const inputX0 = (G.svgW - inputTotal) / 2;
  const outputX0 = inputX0;

  const bucketPitch = G.bucketW + G.bucketGap;
  const bucketsTotal = K * bucketPitch - G.bucketGap;
  const bucketsX0 = (G.svgW - bucketsTotal) / 2;

  // For each input index, the (cx, cy) of its TOP-LEFT in the input row.
  const inputXY = INPUT.map((v, i) => ({
    x: inputX0 + i * inputPitch,
    y: G.inputRowY,
  }));
  // For each input index, the (x, y) it lands at INSIDE its bucket.
  // Stack grows up from the bottom of the box.
  const bucketTopY = G.bucketRowY + 32;            // below the label band
  const bucketBottomY = G.bucketRowY + G.bucketH - 12;
  const bucketCellPitch = G.bucketCellH + G.bucketCellGap;
  const bucketCellX0 = (v) =>
    bucketsX0 + (v - 1) * bucketPitch + (G.bucketW - G.bucketCellW) / 2;
  const bucketCellY = (depth) =>
    bucketBottomY - (depth + 1) * bucketCellPitch + G.bucketCellGap;

  const bucketLandingXY = INPUT.map((v, i) => ({
    x: bucketCellX0(v),
    y: bucketCellY(DEPTH_IN_BUCKET[i]),
  }));

  // Output slot (k = 0..9) top-left.
  const outputXY = SORTED.map((_, k) => ({
    x: outputX0 + k * inputPitch,
    y: G.outputRowY,
  }));

  return {
    inputXY, bucketLandingXY, outputXY,
    bucketsX0, bucketPitch, bucketTopY, bucketBottomY,
    bucketCellX0, bucketCellY,
    inputPitch, inputX0, outputX0,
  };
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Common chrome: empty input row outline + bucket boxes ─────────────────
function BucketsFrame({ G, GE, portrait, opacity = 1 }) {
  return (
    <g opacity={opacity}>
      {Array.from({ length: K }).map((_, k) => {
        const v = k + 1;
        const x = GE.bucketsX0 + k * GE.bucketPitch;
        const labelY = G.bucketRowY + 20;
        return (
          <g key={v}>
            {/* Box */}
            <rect x={x} y={G.bucketRowY} width={G.bucketW} height={G.bucketH}
                  rx={12} fill="rgba(0,0,0,0.35)"
                  stroke="rgba(232,220,193,0.28)" strokeWidth={1.5}/>
            {/* Label band */}
            <rect x={x} y={G.bucketRowY} width={G.bucketW} height={28}
                  rx={12} fill="rgba(244,184,96,0.06)"
                  stroke="none"/>
            <text x={x + G.bucketW / 2} y={labelY}
                  textAnchor="middle"
                  fontFamily="var(--font-mono)" fontSize={G.bucketLabelFont}
                  fill="var(--amber-300)" letterSpacing="0.14em">
              {v}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function ValueCell({ x, y, w, h, value, font, state }) {
  const border =
    state === 'active' ? 'var(--amber-400)' :
    state === 'sorted' ? 'var(--amber-300)' :
    state === 'idle'   ? 'rgba(232,220,193,0.30)' :
    'rgba(232,220,193,0.30)';
  const bg =
    state === 'active' ? 'rgba(244,184,96,0.16)' :
    state === 'sorted' ? 'rgba(244,184,96,0.12)' :
    'rgba(0,0,0,0.45)';
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={8}
            fill={bg} stroke={border} strokeWidth={1.5}/>
      <text x={x + w / 2} y={y + h * 0.5 + font * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)" fontSize={font}
            fill="var(--chalk-100)">
        {value}
      </text>
    </g>
  );
}

function OutputSlotOutline({ x, y, w, h }) {
  return (
    <rect x={x} y={y} width={w} height={h} rx={8}
          fill="rgba(0,0,0,0.30)" stroke="rgba(232,220,193,0.18)"
          strokeWidth={1.5} strokeDasharray="4 4"/>
  );
}

function ScanPointer({ x, y, color = 'var(--amber-400)' }) {
  // Downward-pointing arrow above the cell.
  return (
    <polygon
      points={`${x - 9},${y - 18} ${x + 9},${y - 18} ${x},${y - 4}`}
      fill={color}
    />
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="sortering i lineær tid"
      title="Tellesortering: tall i bokser"
      duration={SCENE_DURATION}
      introEnd={7.65}
      introCaption="Sortere — uten å sammenligne."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.65} end={18.91}>
        <OppsettBeat/>
      </Sprite>

      <Sprite start={18.91} end={36.47}>
        <TellingBeat/>
      </Sprite>

      <Sprite start={36.47} end={50.65}>
        <UttoemingBeat/>
      </Sprite>

      <Sprite start={50.65} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Oppsett ───────────────────────────────────────────────────────
// Input row appears (TraceIn-style fade), then the six empty buckets fade
// up below with their value labels. No data movement yet.
function OppsettBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const GE = geometry(G);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`} width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* "inn" eyebrow */}
      <SvgFadeIn duration={0.4} delay={0.1}>
        <text x={GE.inputX0} y={G.inputRowY - 14}
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--chalk-300)" letterSpacing="0.16em">
          inn
        </text>
      </SvgFadeIn>

      {/* Input cells appear one stride at a time over the first ~1.6 s */}
      {INPUT.map((v, i) => (
        <SvgFadeIn key={i} duration={0.3} delay={0.4 + i * 0.10}>
          <ValueCell x={GE.inputXY[i].x} y={GE.inputXY[i].y}
                     w={G.cellW} h={G.cellH} value={v} font={G.valueFont}
                     state="idle"/>
        </SvgFadeIn>
      ))}

      {/* Bucket frame fades in next */}
      <SvgFadeIn duration={0.5} delay={2.4}>
        <BucketsFrame G={G} GE={GE} portrait={portrait}/>
      </SvgFadeIn>

      {/* "seks bokser, én per mulig verdi" caption */}
      <SvgFadeIn duration={0.5} delay={3.2}>
        <text x={G.svgW / 2}
              y={G.bucketRowY + G.bucketH + (portrait ? 50 : 56)}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 18 : 20}
              fill="var(--chalk-200)">
          seks bokser — én per mulig verdi
        </text>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 3: Telling (GENUINE MOTION) ──────────────────────────────────────
// A scan pointer walks the input row left-to-right. As it reaches each
// cell, that cell flies down into its bucket and stacks at the bottom of
// the bucket's column. A counter ticks 1..10 in the lower-left.
function TellingBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const GE = geometry(G);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);             // leave ~1 s of hold

  const N = INPUT.length;                          // 10
  const scanStart = 0.06 * T;                      // settle moment
  const scanEnd = 0.88 * T;                        // hold the final state
  const stride = (scanEnd - scanStart) / N;        // seconds per drop
  const flyDur = Math.min(0.55, stride * 0.85);

  // For each input index, compute: dropStart, flyT (0..1), landed (bool).
  const drops = INPUT.map((v, i) => {
    const start = scanStart + i * stride;
    const f = clamp((localTime - start) / flyDur, 0, 1);
    return { start, f, landed: f >= 1, flying: f > 0 && f < 1 };
  });

  // How many input cells have *started* their drop.
  const startedCount = drops.filter(d => d.f > 0).length;
  // Counter shows index of the most-recently-started drop (1..10), 0 before.
  const counterValue = startedCount;

  // Scan pointer rides on the active cell. Position glides between cells.
  const scanProg = clamp((localTime - scanStart) / (stride * (N - 1) + flyDur), 0, 1);
  const scanExact = scanProg * (N - 1);
  const scanX = GE.inputX0 + scanExact * GE.inputPitch + G.cellW / 2;
  const showScan = localTime >= scanStart && startedCount < N;

  // Which bucket is "highlighted" right now (the one a cell is flying INTO)?
  let activeBucket = null;
  for (let i = 0; i < N; i++) {
    if (drops[i].flying) {
      activeBucket = INPUT[i];
      break;
    }
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`} width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* eyebrow */}
      <text x={GE.inputX0} y={G.inputRowY - 14}
            fontFamily="var(--font-mono)" fontSize={11}
            fill="var(--chalk-300)" letterSpacing="0.16em">
        inn
      </text>

      {/* Bucket frame (already visible). Highlight the active bucket. */}
      <BucketsFrame G={G} GE={GE} portrait={portrait}/>
      {activeBucket != null && (() => {
        const k = activeBucket - 1;
        const x = GE.bucketsX0 + k * GE.bucketPitch;
        return (
          <rect x={x} y={G.bucketRowY} width={G.bucketW} height={G.bucketH}
                rx={12} fill="none" stroke="var(--amber-400)" strokeWidth={2}/>
        );
      })()}

      {/* Cells — either still in the input row, in flight, or landed in a bucket. */}
      {INPUT.map((v, i) => {
        const d = drops[i];
        const from = GE.inputXY[i];
        const to = GE.bucketLandingXY[i];
        if (d.f <= 0) {
          // Still sitting in the input row.
          return (
            <ValueCell key={i} x={from.x} y={from.y}
                       w={G.cellW} h={G.cellH} value={v} font={G.valueFont}
                       state="idle"/>
          );
        }
        const e = easeInOutCubic(d.f);
        const x = from.x + (to.x - from.x) * e;
        const y = from.y + (to.y - from.y) * e;
        // While flying use input-cell size to keep the shape readable;
        // after landing snap to bucket-cell size.
        if (d.landed) {
          return (
            <ValueCell key={i} x={to.x} y={to.y}
                       w={G.bucketCellW} h={G.bucketCellH}
                       value={v} font={G.valueFont * 0.85}
                       state="active"/>
          );
        }
        return (
          <g key={i}>
            <ValueCell x={x} y={y}
                       w={G.cellW} h={G.cellH} value={v} font={G.valueFont}
                       state="active"/>
          </g>
        );
      })}

      {/* Scan pointer over the input row */}
      {showScan && <ScanPointer x={scanX} y={G.inputRowY}/>}

      {/* "ferdig" callout once all ten have landed */}
      {startedCount >= N && (
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.svgW / 2}
                y={G.bucketRowY + G.bucketH + (portrait ? 50 : 54)}
                textAnchor="middle"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={portrait ? 18 : 20} fill="var(--amber-300)">
            ti tall — i seks bokser
          </text>
        </SvgFadeIn>
      )}

      {/* Counter */}
      <g>
        <text x={G.counterX} y={G.counterY - 14}
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--amber-300)" letterSpacing="0.16em">
          slipp
        </text>
        <text x={G.counterX} y={G.counterY + G.counterFont * 0.36}
              fontFamily="var(--font-mono)" fontSize={G.counterFont}
              fill="var(--chalk-100)">
          {counterValue} / {N}
        </text>
      </g>
    </svg>
  );
}

// ─── Beat 4: Uttømming (GENUINE MOTION) ────────────────────────────────────
// Buckets drain left-to-right. For each emit step the cell flies from its
// stacked bucket position to its slot in the output row, which fills
// amber-300 cell by cell.
function UttoemingBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const GE = geometry(G);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  const M = EMIT_STEPS.length;                     // 10
  const emitStart = 0.10 * T;
  const emitEnd = 0.90 * T;
  const stride = (emitEnd - emitStart) / M;
  const flyDur = Math.min(0.55, stride * 0.85);

  // For each emit step, derive: start, fraction (0..1), landed.
  const steps = EMIT_STEPS.map((s, k) => {
    const start = emitStart + k * stride;
    const f = clamp((localTime - start) / flyDur, 0, 1);
    return { ...s, start, f, landed: f >= 1, flying: f > 0 && f < 1 };
  });

  // For each input index, has it been emitted from the bucket yet?
  // We store its emit-step index so we can look up its (f, landed).
  const emitIdxByInput = new Array(INPUT.length).fill(-1);
  EMIT_STEPS.forEach((s, k) => { emitIdxByInput[s.inputIdx] = k; });

  // The active bucket is the one currently emitting (any flying step).
  const flyingStep = steps.find(s => s.flying) || null;
  const activeBucket = flyingStep ? flyingStep.bucket : null;

  // Counter for output cells placed.
  const placedCount = steps.filter(s => s.landed).length;

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`} width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* eyebrow on the input row (still drawn but greyed — we keep the row
          to anchor the input/output relationship) */}
      <text x={GE.inputX0} y={G.inputRowY - 14}
            fontFamily="var(--font-mono)" fontSize={11}
            fill="rgba(232,220,193,0.30)" letterSpacing="0.16em">
        inn
      </text>
      {INPUT.map((v, i) => (
        <g key={`row-${i}`} opacity={0.18}>
          <ValueCell x={GE.inputXY[i].x} y={GE.inputXY[i].y}
                     w={G.cellW} h={G.cellH} value={v} font={G.valueFont}
                     state="idle"/>
        </g>
      ))}

      {/* Bucket frame */}
      <BucketsFrame G={G} GE={GE} portrait={portrait}/>
      {activeBucket != null && (() => {
        const k = activeBucket - 1;
        const x = GE.bucketsX0 + k * GE.bucketPitch;
        return (
          <rect x={x} y={G.bucketRowY} width={G.bucketW} height={G.bucketH}
                rx={12} fill="none" stroke="var(--amber-400)" strokeWidth={2}/>
        );
      })()}

      {/* Output row eyebrow + empty slots */}
      <text x={GE.outputX0} y={G.outputRowY - 14}
            fontFamily="var(--font-mono)" fontSize={11}
            fill="var(--amber-300)" letterSpacing="0.16em">
        ut
      </text>
      {SORTED.map((_, k) => (
        <OutputSlotOutline key={`slot-${k}`}
          x={GE.outputXY[k].x} y={GE.outputXY[k].y}
          w={G.cellW} h={G.cellH}/>
      ))}

      {/* For each input index: render its cell either in the bucket, in
          flight, or landed in the output row. */}
      {INPUT.map((v, i) => {
        const k = emitIdxByInput[i];
        const step = steps[k];
        const bucketPos = GE.bucketLandingXY[i];
        const outPos = GE.outputXY[step.outSlot];

        if (step.f <= 0) {
          // Still in the bucket.
          return (
            <ValueCell key={i} x={bucketPos.x} y={bucketPos.y}
                       w={G.bucketCellW} h={G.bucketCellH}
                       value={v} font={G.valueFont * 0.85}
                       state="active"/>
          );
        }
        if (step.landed) {
          return (
            <ValueCell key={i} x={outPos.x} y={outPos.y}
                       w={G.cellW} h={G.cellH}
                       value={v} font={G.valueFont}
                       state="sorted"/>
          );
        }
        // In flight — interpolate from bucket (small cell) to output (big cell).
        const e = easeInOutCubic(step.f);
        const x = bucketPos.x + (outPos.x - bucketPos.x) * e;
        const y = bucketPos.y + (outPos.y - bucketPos.y) * e;
        const w = G.bucketCellW + (G.cellW - G.bucketCellW) * e;
        const h = G.bucketCellH + (G.cellH - G.bucketCellH) * e;
        const font = (G.valueFont * 0.85) + (G.valueFont * 0.15) * e;
        return (
          <ValueCell key={i} x={x} y={y} w={w} h={h}
                     value={v} font={font} state="active"/>
        );
      })}

      {/* Counter — output progress */}
      <g>
        <text x={G.counterX} y={G.counterY - 14}
              fontFamily="var(--font-mono)" fontSize={11}
              fill="var(--amber-300)" letterSpacing="0.16em">
          ut
        </text>
        <text x={G.counterX} y={G.counterY + G.counterFont * 0.36}
              fontFamily="var(--font-mono)" fontSize={G.counterFont}
              fill="var(--chalk-100)">
          {placedCount} / {M}
        </text>
      </g>

      {/* Caption */}
      {placedCount >= M && (
        <SvgFadeIn duration={0.4} delay={0}>
          <text x={G.svgW / 2}
                y={G.outputRowY + G.cellH + (portrait ? 40 : 44)}
                textAnchor="middle"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={portrait ? 18 : 20} fill="var(--amber-300)">
            sortert — uten en eneste sammenligning
          </text>
        </SvgFadeIn>
      )}
    </svg>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center', display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        kjøretid
      </FadeUp>

      <div style={{
        display: 'flex',
        flexDirection: portrait ? 'column' : 'row',
        alignItems: 'center',
        gap: portrait ? 10 : 18,
      }}>
        <FadeUp duration={0.5} delay={0.4} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
            color: 'var(--chalk-200)',
            padding: portrait ? '8px 16px' : '10px 18px',
            borderRadius: 10,
            border: '1.5px solid rgba(232,220,193,0.30)',
            background: 'rgba(0,0,0,0.40)',
            whiteSpace: 'nowrap',
          }}>
          n slipp
        </FadeUp>
        <FadeUp duration={0.4} delay={0.9} distance={4}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-300)',
          }}>
          {portrait ? '+' : '+'}
        </FadeUp>
        <FadeUp duration={0.5} delay={1.2} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
            color: 'var(--chalk-200)',
            padding: portrait ? '8px 16px' : '10px 18px',
            borderRadius: 10,
            border: '1.5px solid rgba(232,220,193,0.30)',
            background: 'rgba(0,0,0,0.40)',
            whiteSpace: 'nowrap',
          }}>
          k bokser
        </FadeUp>
        <FadeUp duration={0.4} delay={1.7} distance={4}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-300)',
          }}>
          {portrait ? 'gir' : '→'}
        </FadeUp>
        <FadeUp duration={0.55} delay={2.0} distance={10}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: portrait ? 24 : 28,
            color: 'var(--amber-300)',
            padding: portrait ? '10px 20px' : '12px 22px',
            borderRadius: 12,
            border: '1.5px solid var(--amber-400)',
            background: 'rgba(244,184,96,0.10)',
            whiteSpace: 'nowrap',
          }}>
          O(n + k)
        </FadeUp>
      </div>

      <FadeUp duration={0.6} delay={3.2} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 22 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '42ch',
          lineHeight: 1.3,
        }}>
        Liten k — <span style={{ color: 'var(--amber-300)' }}>sortering uten en eneste sammenligning.</span>
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
