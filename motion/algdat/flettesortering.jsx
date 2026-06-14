// Flettesortering: splitt og hersk — Manimo lesson scene.
// Chapter 3 of algdat (Splitt og hersk). Merge sort, the canonical algdat
// motion piece. An eight-element array splits recursively into halves until
// each piece is a single element (already sorted). Then two pointers walk
// down two sorted halves, sliding the smaller head into an output row at
// each step. The complexity beat shows the recursion tree's three flettings
// of total work n stacked log₂ 8 = 3 levels deep — n log n.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–9    Manimo hook
//    9–22   Splitt — tree grows level by level (GENUINE MOTION)
//   22–41   Flett — two pointers, eight merge steps (GENUINE MOTION)
//   41–53   Kompleksitet — n per level × log n levels (GENUINE MOTION)
//   53–60   Takeaway
//
// Colour discipline:
//   chalk-100  cell values, formula text
//   chalk-300  hint text, completed cells
//   amber-400  active borders, the level under construction
//   amber-300  pointers, picked values, payoff
//   teal-400   base case (1-element pieces, already sorted)
//   rose-300   nothing yet — kept available for future contrast
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 77;

const NARRATION = [
  /*  0–9   */ 'Hvordan sorterer du åtte tall raskt? Tricket er gammelt og enkelt: splitt problemet i to mindre, løs dem hver for seg, og flett svarene sammen.',
  /*  9–22  */ 'Vi starter med åtte tall i tilfeldig rekkefølge. Del lista i to. Del hver halvdel i to igjen. Og enda en gang — nå har vi åtte små lister med ett tall i hver. Hver av dem er allerede sortert, helt gratis.',
  /* 22–41  */ 'Nå skal vi flette to ferdig-sorterte halvdeler. Sett én peker øverst i hver. Sammenlign det de viser på — det minste tallet glir ned i utgangslista, og pekeren over hopper ett hakk fram. Igjen og igjen, helt til begge halvdeler er tømt. Åtte sammenligninger, åtte tall i riktig rekkefølge.',
  /* 41–53  */ 'Hvorfor er dette raskt? Hvert nivå i treet fletter alle n tallene én gang — det er n arbeid per nivå. Treet er log to av n nivåer dypt. Til sammen blir det n ganger log n, langt mindre enn de n i andre når lista vokser.',
  /* 53–60  */ 'Splitt en gang, flett en gang. Det er hele flettesorteringen — og grunnen til at den slår enkle sorteringer flat når lista vokser.',
];

const NARRATION_AUDIO = 'audio/flettesortering/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
// Eight numbers, chosen so every merge step actually has to compare (no
// trivial runs where one half empties early).
const INPUT = [38, 27, 43, 3, 9, 82, 10, 36];

// Recursion tree levels (top = level 0). Each entry is the array slice at
// that node. Length doubles at each level, slice length halves.
const TREE = [
  [[38, 27, 43, 3, 9, 82, 10, 36]],
  [[38, 27, 43, 3], [9, 82, 10, 36]],
  [[38, 27], [43, 3], [9, 82], [10, 36]],
  [[38], [27], [43], [3], [9], [82], [10], [36]],
];

// For the merge beat: two pre-sorted halves of the original input.
const LEFT  = [3, 27, 38, 43];
const RIGHT = [9, 10, 36, 82];

// Pre-computed merge trace: at each step, which side wins, what value moves
// down, what (li, ri) the pointers were AT THE TIME OF COMPARISON, and the
// (li, ri) they advance to after.
function buildMergeSteps() {
  const steps = [];
  let li = 0, ri = 0;
  while (li < LEFT.length || ri < RIGHT.length) {
    const pickLeft = ri >= RIGHT.length || (li < LEFT.length && LEFT[li] <= RIGHT[ri]);
    const value = pickLeft ? LEFT[li] : RIGHT[ri];
    steps.push({ pickLeft, value, li, ri });
    if (pickLeft) li++; else ri++;
  }
  return steps;
}
const MERGE_STEPS = buildMergeSteps(); // 8 steps for 4+4

function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="splitt og hersk"
      title="Flettesortering: splitt og hersk"
      duration={SCENE_DURATION}
      introEnd={10.88}
      introCaption="Splitt — hersk — flett."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={10.88} end={27.46}>
        <SplittBeat/>
      </Sprite>

      <Sprite start={27.46} end={50.72}>
        <FlettBeat/>
      </Sprite>

      <Sprite start={50.72} end={67.87}>
        <KompleksitetBeat/>
      </Sprite>

      <Sprite start={67.87} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Splitt (GENUINE MOTION — tree grows level by level) ───────────
function splittGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      topY: 240, levelGap: 200,
      cellW: 40, cellH: 36, cellPitch: 42, cellFont: 14,
      centreX: 360,
      captionY: 1080, captionFont: 14,
      labelDx: 6,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    topY: 170, levelGap: 120,
    cellW: 44, cellH: 36, cellPitch: 46, cellFont: 16,
    centreX: 640,
    captionY: 640, captionFont: 16,
    labelDx: 8,
  };
}

// One slice rendered as a row of cells, centred on (cx, y).
function SliceCells({ values, cx, y, G, accent, baseCase, opacity = 1 }) {
  const w = values.length * G.cellPitch - (G.cellPitch - G.cellW);
  const x0 = cx - w / 2;
  const border = baseCase ? 'var(--teal-400)' : accent ? 'var(--amber-400)' : 'rgba(232,220,193,0.32)';
  const bg = baseCase ? 'rgba(45,212,191,0.10)' : accent ? 'rgba(244,184,96,0.12)' : 'rgba(0,0,0,0.40)';
  return (
    <g style={{ opacity, transition: 'opacity 0.35s linear' }}>
      {values.map((v, i) => (
        <g key={i}>
          <rect
            x={x0 + i * G.cellPitch} y={y - G.cellH / 2}
            width={G.cellW} height={G.cellH} rx={6}
            fill={bg} stroke={border} strokeWidth={1.6}
          />
          <text
            x={x0 + i * G.cellPitch + G.cellW / 2} y={y + G.cellFont * 0.36}
            textAnchor="middle"
            fontFamily="var(--font-mono)" fontSize={G.cellFont}
            fill="var(--chalk-100)"
          >
            {v}
          </text>
        </g>
      ))}
    </g>
  );
}

// Connector lines between a parent node and its two children. Drawn from
// the parent's bottom-centre to each child's top-centre, fading in as the
// child level appears.
function SplitConnectors({ G, levelIdx, opacity }) {
  if (levelIdx === 0) return null;
  const parents = TREE[levelIdx - 1];
  const children = TREE[levelIdx];
  const parentY = G.topY + (levelIdx - 1) * G.levelGap;
  const childY  = G.topY + levelIdx * G.levelGap;
  const parentXs = nodeCentres(G, parents.length);
  const childXs  = nodeCentres(G, children.length);
  const lines = [];
  for (let i = 0; i < parents.length; i++) {
    const py = parentY + G.cellH / 2 + 2;
    const cy = childY  - G.cellH / 2 - 2;
    lines.push(
      <line key={`L${i}`}
        x1={parentXs[i]} y1={py} x2={childXs[2 * i]} y2={cy}
        stroke="rgba(232,220,193,0.40)" strokeWidth={1.4}
      />,
      <line key={`R${i}`}
        x1={parentXs[i]} y1={py} x2={childXs[2 * i + 1]} y2={cy}
        stroke="rgba(232,220,193,0.40)" strokeWidth={1.4}
      />
    );
  }
  return <g style={{ opacity, transition: 'opacity 0.35s linear' }}>{lines}</g>;
}

// Evenly space n nodes across a horizontal band, centred on G.svgW/2.
// `margin` is the empty space left+right of the band (default = 40 each
// side); the kompleksitet beat uses a wider margin so per-level annotations
// have room on the flanks.
function nodeCentres(G, n, margin = 40) {
  const totalW = G.svgW - 2 * margin;
  const pitch = totalW / n;
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push(margin + pitch * (i + 0.5));
  }
  return out;
}

function SplittBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = splittGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Reveal schedule — root at t=0, then three splits in turn.
  const revealAt = [at(0.04), at(0.24), at(0.46), at(0.66)];
  const revealed = revealAt.filter(t => localTime >= t).length;
  // Index of the level that just appeared (drives the amber "this level was
  // just split" flash).
  const newestLevel = revealed - 1;
  const flashAt = revealAt[newestLevel];
  const flashFrac = clamp01((localTime - flashAt) / 0.7);
  const flashAmt = newestLevel >= 0 ? (1 - flashFrac) : 0;

  const captionShow = localTime >= at(0.75);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`} width="100%" height="100%"
         preserveAspectRatio="xMidYMid meet"
         style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {TREE.map((level, idx) => {
        if (idx >= revealed) return null;
        const y = G.topY + idx * G.levelGap;
        const xs = nodeCentres(G, level.length);
        const isBase = idx === TREE.length - 1;
        return (
          <g key={idx}>
            <SplitConnectors G={G} levelIdx={idx} opacity={1}/>
            {level.map((slice, i) => (
              <SliceCells
                key={i} G={G} values={slice} cx={xs[i]} y={y}
                accent={idx === newestLevel ? flashAmt > 0 : false}
                baseCase={isBase}
              />
            ))}
          </g>
        );
      })}

      {/* Level labels on the left margin (landscape only — portrait is too
          tight for them). */}
      {!portrait && TREE.map((level, idx) => {
        if (idx >= revealed) return null;
        const y = G.topY + idx * G.levelGap;
        const lenLabel = level[0].length;
        return (
          <text key={`lbl-${idx}`} x={20} y={y + 5}
                fontFamily="var(--font-mono)" fontSize={12}
                fill={idx === TREE.length - 1 ? 'var(--teal-400)' : 'var(--chalk-300)'}
                style={{ letterSpacing: '0.10em' }}>
            n={lenLabel}
          </text>
        );
      })}

      {captionShow && (
        <text x={G.svgW / 2} y={G.captionY} textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.captionFont}
              fill="var(--chalk-300)" style={{ letterSpacing: '0.08em' }}>
          lengde 8 → 4 → 2 → 1
        </text>
      )}
    </svg>
  );
}

// ─── Beat 3: Flett (GENUINE MOTION — two pointers walking + output filling) ─
function flettGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      // Two halves stacked, output below them.
      leftCx: 360, leftY: 320,
      rightCx: 360, rightY: 540,
      outCx: 360, outY: 880,
      cell: 56, pitch: 62, font: 22,
      ptrSize: 14,
      labelX: 70, leftLabelY: 270, rightLabelY: 490, outLabelY: 820,
      headerFont: 12,
      side: 'stacked',
      stepBadgeX: 380, stepBadgeY: 200,
      stepBadgeAlign: 'center',
    };
  }
  return {
    svgW: 1280, svgH: 720,
    // Two halves side by side, output centred below.
    leftCx: 360, leftY: 270,
    rightCx: 920, rightY: 270,
    outCx: 640, outY: 500,
    cell: 60, pitch: 68, font: 24,
    ptrSize: 16,
    labelX: 70, leftLabelY: 220, rightLabelY: 220, outLabelY: 450,
    headerFont: 12,
    side: 'side-by-side',
    stepBadgeX: 60, stepBadgeY: 540,
    stepBadgeAlign: 'left',
  };
}

// A row of cells anchored at (cx, y). Each cell may be: 'live' (still
// in the half, not yet picked), 'gone' (already drained), 'head' (the
// current pointer cell), 'output' (filled in the output row), 'pending'
// (empty slot in the output row).
function MergeRow({ values, cx, y, G, headIdx, drainedThrough, mode, justLandedIdx }) {
  const n = values.length;
  const w = n * G.pitch - (G.pitch - G.cell);
  const x0 = cx - w / 2;
  return (
    <g>
      {values.map((v, i) => {
        const isHead = mode === 'half' && i === headIdx;
        const isGone = mode === 'half' && i < headIdx;
        const isOutputPending = mode === 'output' && i >= drainedThrough;
        const isOutputFilled = mode === 'output' && i < drainedThrough;
        const justLanded = mode === 'output' && i === justLandedIdx;
        const border =
          isHead ? 'var(--amber-400)' :
          isOutputFilled ? 'var(--amber-400)' :
          isGone ? 'rgba(232,220,193,0.18)' :
          isOutputPending ? 'rgba(232,220,193,0.20)' :
          'rgba(232,220,193,0.35)';
        const bg =
          isHead ? 'rgba(244,184,96,0.18)' :
          isOutputFilled ? (justLanded ? 'rgba(244,184,96,0.32)' : 'rgba(244,184,96,0.10)') :
          isGone ? 'rgba(0,0,0,0.20)' :
          isOutputPending ? 'rgba(0,0,0,0.30)' :
          'rgba(0,0,0,0.45)';
        const textColor =
          isOutputFilled ? 'var(--amber-300)' :
          isGone ? 'rgba(232,220,193,0.30)' :
          'var(--chalk-100)';
        const showValue = !(isOutputPending);
        return (
          <g key={i} style={{ transition: 'opacity 0.25s linear' }}
             opacity={isGone ? 0.55 : 1}>
            <rect
              x={x0 + i * G.pitch} y={y - G.cell / 2}
              width={G.cell} height={G.cell} rx={9}
              fill={bg} stroke={border} strokeWidth={isHead ? 2.4 : 1.8}
              style={{ transition: 'stroke 0.25s linear, fill 0.25s linear' }}
            />
            {showValue && (
              <text
                x={x0 + i * G.pitch + G.cell / 2} y={y + G.font * 0.36}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.font}
                fill={textColor}
                style={{ transition: 'fill 0.25s linear' }}
              >
                {v}
              </text>
            )}
          </g>
        );
      })}
    </g>
  );
}

// Downward arrow over the head cell.
function HeadPointer({ cx, y, G, color = 'var(--amber-400)' }) {
  const s = G.ptrSize;
  const yTip = y - G.cell / 2 - 4;
  const yBase = yTip - s * 1.2;
  return (
    <polygon
      points={`${cx},${yTip} ${cx - s},${yBase} ${cx + s},${yBase}`}
      fill={color}
    />
  );
}

// The value travelling from a head cell to the output. We render it as a
// floating chip at an eased position.
function FlyingChip({ from, to, t, value, G }) {
  if (t <= 0 || t >= 1) return null;
  const e = easeInOutCubic(t);
  const cx = from.x + (to.x - from.x) * e;
  const cy = from.y + (to.y - from.y) * e;
  return (
    <g>
      <rect
        x={cx - G.cell / 2} y={cy - G.cell / 2}
        width={G.cell} height={G.cell} rx={9}
        fill="rgba(244,184,96,0.28)" stroke="var(--amber-400)" strokeWidth={2}
        style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,0.45))' }}
      />
      <text
        x={cx} y={cy + G.font * 0.36} textAnchor="middle"
        fontFamily="var(--font-mono)" fontSize={G.font}
        fill="var(--amber-300)"
      >
        {value}
      </text>
    </g>
  );
}

function FlettBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = flettGeom(portrait);
  const T = Math.max(duration - 1.0, 1);

  // Choreography: small lead-in, then eight evenly-spaced merge steps,
  // each ~1.6 units of step time inside the sprite. Each step is split
  // into a "compare" hold (half), then a "fly" animation (half).
  const setupAt = 0.05 * T;     // halves and labels are visible from setup
  const firstStep = 0.12 * T;
  const totalStepsWindow = 0.78 * T;
  const stepLen = totalStepsWindow / MERGE_STEPS.length;
  const flyFrac = 0.45;          // fraction of the step spent flying

  // Compute which step we're currently in, and how far along.
  const sinceFirst = localTime - firstStep;
  const rawIdx = Math.floor(sinceFirst / stepLen);
  const stepIdx = Math.max(-1, Math.min(MERGE_STEPS.length - 1, rawIdx));
  const stepProg = stepIdx >= 0 ? (sinceFirst - stepIdx * stepLen) / stepLen : 0;
  const inCompare = stepProg < (1 - flyFrac);
  const flyT = inCompare ? 0 : clamp01((stepProg - (1 - flyFrac)) / flyFrac);

  // How many output cells are already filled. A step's value counts as
  // "filled" once it has finished flying.
  const filledThrough = stepIdx >= 0
    ? stepIdx + (flyT >= 1 ? 1 : 0)
    : 0;

  // Current pointer positions for the two halves, derived from how many
  // values have already been drained from each side.
  let leftDrained = 0, rightDrained = 0;
  for (let i = 0; i < filledThrough; i++) {
    if (MERGE_STEPS[i].pickLeft) leftDrained++; else rightDrained++;
  }

  // While a fly is in progress, the chip has already left its head cell.
  let flyingLeftIdx = -1, flyingRightIdx = -1;
  let flying = null;
  if (stepIdx >= 0 && stepIdx < MERGE_STEPS.length && flyT > 0 && flyT < 1) {
    const s = MERGE_STEPS[stepIdx];
    const fromX = s.pickLeft
      ? (G.leftCx - (LEFT.length * G.pitch - (G.pitch - G.cell)) / 2) + s.li * G.pitch + G.cell / 2
      : (G.rightCx - (RIGHT.length * G.pitch - (G.pitch - G.cell)) / 2) + s.ri * G.pitch + G.cell / 2;
    const fromY = s.pickLeft ? G.leftY : G.rightY;
    const outX = (G.outCx - (8 * G.pitch - (G.pitch - G.cell)) / 2) + stepIdx * G.pitch + G.cell / 2;
    const outY = G.outY;
    flying = { from: { x: fromX, y: fromY }, to: { x: outX, y: outY }, value: s.value };
    if (s.pickLeft) flyingLeftIdx = s.li; else flyingRightIdx = s.ri;
  }

  // For "live" head positions: while flying, the head cell shows as gone;
  // during compare we show it as 'head'.
  const leftHead = inCompare && stepIdx >= 0 && stepIdx < MERGE_STEPS.length && MERGE_STEPS[stepIdx].pickLeft
    ? MERGE_STEPS[stepIdx].li
    : (inCompare && stepIdx >= 0 && stepIdx < MERGE_STEPS.length && !MERGE_STEPS[stepIdx].pickLeft
        ? MERGE_STEPS[stepIdx].li     // still show its head, just not the winning one
        : -1);
  const rightHead = inCompare && stepIdx >= 0 && stepIdx < MERGE_STEPS.length
    ? MERGE_STEPS[stepIdx].ri
    : -1;

  // Effective drained (for greyed-out display): if mid-fly, the source
  // cell counts as drained immediately.
  const leftDrainedEff = leftDrained + (flying && flying.from.y === G.leftY ? 1 : 0);
  const rightDrainedEff = rightDrained + (flying && flying.from.y === G.rightY ? 1 : 0);

  // Pointer arrow positions: above the next live cell on each half.
  const leftPtrCx = (G.leftCx - (LEFT.length * G.pitch - (G.pitch - G.cell)) / 2)
                  + Math.min(leftDrainedEff, LEFT.length - 1) * G.pitch + G.cell / 2;
  const rightPtrCx = (G.rightCx - (RIGHT.length * G.pitch - (G.pitch - G.cell)) / 2)
                  + Math.min(rightDrainedEff, RIGHT.length - 1) * G.pitch + G.cell / 2;

  // Step badge: "steg k av 8 · pick value".
  const badgeText = stepIdx >= 0
    ? `steg ${Math.min(stepIdx + 1, MERGE_STEPS.length)}/8`
    : '';
  const badgeValue = stepIdx >= 0 && stepIdx < MERGE_STEPS.length
    ? `${MERGE_STEPS[stepIdx].value} ← ${MERGE_STEPS[stepIdx].pickLeft ? 'venstre' : 'høyre'}`
    : '';

  const showSetup = localTime >= setupAt;
  const showLabels = showSetup;
  const showHint = stepIdx >= 1 && stepIdx < MERGE_STEPS.length;
  const allDone = filledThrough >= MERGE_STEPS.length;

  // The output row's "just landed" index: highlight the cell that was just
  // filled for ~half a step.
  const justLandedIdx = (flyT >= 1 && stepIdx >= 0)
    ? stepIdx
    : (stepIdx > 0 && inCompare && stepProg < 0.25 ? stepIdx - 1 : -1);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`} width="100%" height="100%"
         preserveAspectRatio="xMidYMid meet"
         style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      {showLabels && (
        <>
          <text x={G.labelX} y={G.leftLabelY}
                fontFamily="var(--font-mono)" fontSize={G.headerFont}
                fill="var(--amber-300)" style={{ letterSpacing: '0.14em' }}>
            VENSTRE
          </text>
          <text x={G.svgW - G.labelX} y={G.rightLabelY}
                textAnchor="end"
                fontFamily="var(--font-mono)" fontSize={G.headerFont}
                fill="var(--amber-300)" style={{ letterSpacing: '0.14em' }}>
            HØYRE
          </text>
          <text x={G.labelX} y={G.outLabelY}
                fontFamily="var(--font-mono)" fontSize={G.headerFont}
                fill="var(--chalk-300)" style={{ letterSpacing: '0.14em' }}>
            UTGANG
          </text>
        </>
      )}

      {showSetup && (
        <>
          <MergeRow G={G} values={LEFT}  cx={G.leftCx}  y={G.leftY}
                    headIdx={leftHead === -1 ? -2 : leftHead}
                    drainedThrough={leftDrainedEff}
                    mode={'half'}
                    justLandedIdx={-1}/>
          {/* Re-render gone cells: 'half' mode greys-out i < headIdx, but
              once a fly is mid-air we want the source cell drained as well.
              Pass headIdx == leftDrainedEff so cells < that are 'gone'. */}
          <MergeRow G={G} values={LEFT}  cx={G.leftCx}  y={G.leftY}
                    headIdx={leftDrainedEff}
                    drainedThrough={0}
                    mode={'half'}
                    justLandedIdx={-1}/>
          <MergeRow G={G} values={RIGHT} cx={G.rightCx} y={G.rightY}
                    headIdx={rightDrainedEff}
                    drainedThrough={0}
                    mode={'half'}
                    justLandedIdx={-1}/>
          {/* Empty output row of 8 slots */}
          <MergeRow G={G} values={[1,2,3,4,5,6,7,8].map(i => MERGE_STEPS[i-1] ? MERGE_STEPS[i-1].value : 0)}
                    cx={G.outCx} y={G.outY}
                    headIdx={-2}
                    drainedThrough={filledThrough}
                    mode={'output'}
                    justLandedIdx={justLandedIdx}/>

          {/* Pointers above the heads — only when not all done. */}
          {!allDone && leftDrainedEff < LEFT.length && (
            <HeadPointer cx={leftPtrCx} y={G.leftY} G={G}/>
          )}
          {!allDone && rightDrainedEff < RIGHT.length && (
            <HeadPointer cx={rightPtrCx} y={G.rightY} G={G}/>
          )}

          {/* Flying chip */}
          {flying && (
            <FlyingChip from={flying.from} to={flying.to} t={flyT}
                        value={flying.value} G={G}/>
          )}
        </>
      )}

      {/* Step badge */}
      {stepIdx >= 0 && (
        <g>
          <text x={G.stepBadgeX} y={G.stepBadgeY}
                textAnchor={G.stepBadgeAlign === 'center' ? 'middle' : 'start'}
                fontFamily="var(--font-mono)" fontSize={11}
                fill="var(--amber-300)" style={{ letterSpacing: '0.16em' }}>
            {badgeText}
          </text>
          <text x={G.stepBadgeX} y={G.stepBadgeY + 22}
                textAnchor={G.stepBadgeAlign === 'center' ? 'middle' : 'start'}
                fontFamily="var(--font-mono)" fontSize={18}
                fill="var(--chalk-100)">
            {badgeValue}
          </text>
        </g>
      )}

      {/* Closing hint when finished */}
      {allDone && (
        <text x={G.svgW / 2} y={G.outY + G.cell / 2 + 40}
              textAnchor="middle"
              fontFamily="var(--font-sans)" fontSize={portrait ? 14 : 16}
              fill="var(--chalk-300)">
          Åtte sammenligninger — én ferdig flettet liste.
        </text>
      )}

      {/* Mid-merge hint, fades in around the third step */}
      {showHint && !allDone && (
        <text x={G.svgW / 2} y={portrait ? 1160 : G.outY + G.cell / 2 + 64}
              textAnchor="middle"
              fontFamily="var(--font-sans)" fontSize={portrait ? 13 : 15}
              fill="var(--chalk-300)" opacity={clamp01((stepIdx - 1) / 2)}>
          minste vinner — gli, hopp, gjenta
        </text>
      )}
    </svg>
  );
}

// ─── Beat 4: Kompleksitet (GENUINE MOTION — level highlights + bracket) ────
function kompleksGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      topY: 290, levelGap: 150,
      cellW: 26, cellH: 26, cellPitch: 28, cellFont: 10,
      treeMargin: 120,           // wide L+R gutter so labels + bracket fit
      formulaY: 1020,
      depthBracketX: 620,        // pulled inward so "log₂ n" text fits
      nBadgePlacement: 'below',  // portrait: caption sits beneath the active row
      nBadgeFont: 14,
      sweepCaptionY: 240,
      sweepCaptionFont: 14,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    topY: 200, levelGap: 120,
    cellW: 36, cellH: 28, cellPitch: 38, cellFont: 12,
    treeMargin: 230,             // generous outer margin → labels never collide
    formulaY: 620,
    depthBracketX: 1080,
    nBadgePlacement: 'left',     // landscape: caption sits in the left gutter
    nBadgeX: 60,
    nBadgeFont: 16,
    sweepCaptionY: 158,
    sweepCaptionFont: 16,
  };
}

function KompleksitetBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = kompleksGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Reveal tree all at once at the top, then sweep level-by-level highlight.
  const treeShown = localTime >= at(0.04);
  const sweepStart = at(0.20);
  const sweepEnd   = at(0.62);
  const sweepProg = clamp01((localTime - sweepStart) / (sweepEnd - sweepStart));
  // Active level index 0..3 — sweep moves through the levels.
  const activeLevel = treeShown && localTime >= sweepStart
    ? Math.min(TREE.length - 1, Math.floor(sweepProg * TREE.length))
    : -1;

  const bracketShow = localTime >= at(0.66);
  const formulaShow = localTime >= at(0.80);
  const captionShow = localTime >= at(0.14);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`} width="100%" height="100%"
         preserveAspectRatio="xMidYMid meet"
         style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>

      {/* Top caption — fades in early, sticks for the whole beat. */}
      {captionShow && (
        <g opacity={clamp01((localTime - at(0.14)) / 0.5)}>
          <text x={G.svgW / 2} y={G.sweepCaptionY}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.sweepCaptionFont}
                fill="var(--chalk-200)" style={{ letterSpacing: '0.10em' }}>
            hvert nivå fletter alle n tallene
          </text>
        </g>
      )}

      {treeShown && TREE.map((level, idx) => {
        const y = G.topY + idx * G.levelGap;
        const xs = nodeCentres(G, level.length, G.treeMargin);
        const isActive = idx === activeLevel;
        const hasBeenSwept = activeLevel >= 0 && idx <= activeLevel;
        return (
          <g key={idx}>
            {idx > 0 && (
              <SplitConnectors G={G} levelIdx={idx} opacity={0.55}/>
            )}
            <g opacity={isActive ? 1 : (hasBeenSwept ? 0.75 : 0.55)}
               style={{ transition: 'opacity 0.35s linear' }}>
              {level.map((slice, i) => (
                <SliceCells key={i}
                  G={G}
                  values={slice} cx={xs[i]} y={y}
                  accent={isActive}
                  baseCase={false}
                />
              ))}
            </g>
            {/* "n arbeid" badge — placement differs per aspect to avoid the
                tree growing into it. Landscape: left gutter beside the row.
                Portrait: centred caption just below the active row, since the
                leaf level is too wide to leave room beside it. */}
            {isActive && G.nBadgePlacement === 'left' && (
              <text x={G.nBadgeX} y={y + G.nBadgeFont * 0.36}
                    textAnchor="start"
                    fontFamily="var(--font-mono)" fontSize={G.nBadgeFont}
                    fill="var(--amber-300)" style={{ letterSpacing: '0.10em' }}>
                n arbeid →
              </text>
            )}
            {isActive && G.nBadgePlacement === 'below' && (
              <text x={G.svgW / 2} y={y + G.cellH / 2 + G.nBadgeFont + 6}
                    textAnchor="middle"
                    fontFamily="var(--font-mono)" fontSize={G.nBadgeFont}
                    fill="var(--amber-300)" style={{ letterSpacing: '0.10em' }}>
                ↑ n arbeid
              </text>
            )}
          </g>
        );
      })}

      {/* Depth bracket on the right marking log₂(n) levels. */}
      {bracketShow && (
        <g opacity={clamp01((localTime - at(0.66)) / 0.5)}>
          {(() => {
            const yTop = G.topY - G.cellH / 2 - 6;
            const yBot = G.topY + (TREE.length - 1) * G.levelGap + G.cellH / 2 + 6;
            const x = G.depthBracketX;
            const tickW = 10;
            return (
              <>
                <line x1={x} y1={yTop} x2={x} y2={yBot}
                      stroke="var(--amber-300)" strokeWidth={2}/>
                <line x1={x - tickW} y1={yTop} x2={x + tickW} y2={yTop}
                      stroke="var(--amber-300)" strokeWidth={2}/>
                <line x1={x - tickW} y1={yBot} x2={x + tickW} y2={yBot}
                      stroke="var(--amber-300)" strokeWidth={2}/>
                <text x={x + 18} y={(yTop + yBot) / 2 - 4}
                      fontFamily="var(--font-mono)" fontSize={portrait ? 13 : 16}
                      fill="var(--amber-300)" style={{ letterSpacing: '0.10em' }}>
                  log₂ n
                </text>
                <text x={x + 18} y={(yTop + yBot) / 2 + 16}
                      fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 13}
                      fill="var(--chalk-300)" style={{ letterSpacing: '0.10em' }}>
                  nivåer
                </text>
              </>
            );
          })()}
        </g>
      )}

      {formulaShow && (
        <g opacity={clamp01((localTime - at(0.80)) / 0.5)}>
          <text x={G.svgW / 2} y={G.formulaY}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={portrait ? 17 : 23}
                fill="var(--chalk-100)">
            T(n) = 2·T(n/2) + n
          </text>
          <text x={G.svgW / 2} y={G.formulaY + (portrait ? 34 : 44)}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={portrait ? 18 : 26}
                fill="var(--amber-300)">
            → O(n · log n)
          </text>
        </g>
      )}
    </svg>
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
        flettesortering
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Splitt. Flett. <span style={{ color: 'var(--amber-300)' }}>Sortert.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 17 : 22,
                 color: 'var(--amber-300)' }}>
        n² → n · log n
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
