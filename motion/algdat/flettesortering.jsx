// Flettesortering: del og hersk — Manimo lesson scene.
// Chapter 3 of algdat (Splitt og hersk). Merge sort is the canonical
// divide-and-conquer payoff: split a list in half until each piece is
// one element (already sorted), then merge sorted halves back with two
// pointers — the smaller front element wins, advance, repeat. A
// recursion tree expanding DOWN, a two-pointer merge close-up filling
// an output row, then the same tree collapsing UP wave by wave. Lands
// on O(n log n) — log n levels, n work per level.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 7     Manimo hook
//    7–22     Splitt — tree grows down four levels (GENUINE MOTION)
//   22–41     Flette — two pointers walk, output row fills (GENUINE MOTION)
//   41–54     Hele treet flettes opp — three merge waves rising (GENUINE MOTION)
//   54–64     Takeaway (log n levels × n work)
//
// Colour discipline:
//   chalk-100  cell values
//   chalk-300  dimmed text, labels, level eyebrows
//   amber-400  active cell border, primary stroke
//   amber-300  output cells, payoff numbers
//   teal-400   "already sorted" base case
//   rose-400   the comparison loser (the value not taken this step)
//   violet-400 connector splitting lines from parent to children
//
// Milestones inside each motion beat are fractions of the sprite's
// actual duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 60;

const NARRATION = [
  /*  0– 7  */ 'Du har en uordnet liste. Kan du sortere den raskere enn å sammenligne hvert eneste par? Del og hersk sier ja.',
  /*  7–22  */ 'Først deler vi lista i to. Så deler vi hver halvdel i to. Slik fortsetter vi helt til hver bit bare har ett tall — og en liste på ett tall er allerede sortert i seg selv.',
  /* 22–41  */ 'Nå skal vi flette to sorterte halvdeler tilbake til én. To pekere starter på første tall i hver halvdel. Vi sammenligner, tar det minste, og rykker den pekeren videre. Slik strømmer tallene én etter én inn i den sorterte utlista.',
  /* 41–54  */ 'Samme triks gjør jobben hele veien opp i treet. To og to sorterte halvdeler smelter sammen, lag etter lag, til hele lista står sortert på toppen.',
  /* 54–64  */ 'Log to av n nivåer å fly gjennom, og n forsøk på hvert nivå. Det blir orden n log n — knust mot orden n i andre når n blir stor.',
];

const NARRATION_AUDIO = 'audio/flettesortering/scene.mp3';

// ─── Data: the tree across the four levels ─────────────────────────────────
// Level 3 is the original unsorted singleton row; each higher level is the
// content sorted within its subarray, ending at level 0 = fully sorted.
const LEVEL_STATE = [
  [1, 2, 3, 4, 5, 6, 7, 8],         // level 0 — sorted whole
  [2, 3, 5, 8, 1, 4, 6, 7],         // level 1 — two sorted quartets
  [2, 5, 3, 8, 1, 7, 4, 6],         // level 2 — four sorted pairs
  [5, 2, 8, 3, 1, 7, 4, 6],         // level 3 — original (singletons)
];

// VALUES are the 8 distinct items we track by value across levels.
const VALUES = LEVEL_STATE[3];

// At level k, return the slot (0..7) where value v currently lives.
function slotOf(v, level) {
  return LEVEL_STATE[level].indexOf(v);
}

// Subarray groups at each level. Group i at level k contains cells with slots
// [i * cellsPerGroup .. (i+1) * cellsPerGroup - 1] (in that level's state).
function groupsAt(level) {
  const cellsPerGroup = 8 >> level;       // level 0 → 8, level 3 → 1
  const groupCount = 1 << level;
  return Array.from({ length: groupCount }, (_, i) => ({
    from: i * cellsPerGroup,
    to: i * cellsPerGroup + cellsPerGroup - 1,
    cellsPerGroup,
  }));
}

// ─── Tree geometry — shared by Splitt and FletteOpp beats ──────────────────
function treeGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      cellW: 64, cellH: 50, cellPitch: 70,
      rowH: 170, topY: 240,
      leftX: 80,                                  // 8 * 70 = 560; (720-560)/2 = 80
      valueFont: 24, levelLabelX: 64, levelLabelFont: 12,
      bracketPad: 8, bracketStroke: 1.5, splitStroke: 1.5,
      bottomCaptionY: 980,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    cellW: 46, cellH: 36, cellPitch: 52,
    rowH: 115, topY: 110,
    leftX: 432,                                   // 8 * 52 = 416; (1280-416)/2 = 432
    valueFont: 18, levelLabelX: 420, levelLabelFont: 11,
    bracketPad: 7, bracketStroke: 1.5, splitStroke: 1.5,
    bottomCaptionY: 600,
  };
}

// Cell centre at (level, slot).
function cellCentre(G, level, slot) {
  return {
    x: G.leftX + slot * G.cellPitch + G.cellW / 2,
    y: G.topY + level * G.rowH + G.cellH / 2,
  };
}

function cellTopLeft(G, level, slot) {
  return { x: G.leftX + slot * G.cellPitch, y: G.topY + level * G.rowH };
}

// Rectangle bounds of the bracket around a subarray group at (level, from, to).
function bracketRect(G, level, from, to) {
  const tl = cellTopLeft(G, level, from);
  const tr = cellTopLeft(G, level, to);
  return {
    x: tl.x - G.bracketPad,
    y: tl.y - G.bracketPad,
    w: (tr.x + G.cellW) - tl.x + 2 * G.bracketPad,
    h: G.cellH + 2 * G.bracketPad,
  };
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Tree cell — shared between Splitt and FletteOpp ───────────────────────
// state: 'idle' | 'active' (amber) | 'sorted' (teal flash for the base case)
//        | 'output' (amber-300 fill for fresh merges)
function TreeCell({ G, x, y, value, state = 'idle', opacity = 1 }) {
  const border =
    state === 'sorted' ? 'var(--teal-400)' :
    state === 'output' ? 'var(--amber-300)' :
    state === 'active' ? 'var(--amber-400)' :
    'rgba(232,220,193,0.30)';
  const bg =
    state === 'output' ? 'rgba(244,184,96,0.16)' :
    state === 'active' ? 'rgba(244,184,96,0.10)' :
    'rgba(0,0,0,0.45)';
  return (
    <g opacity={opacity}>
      <rect x={x} y={y} width={G.cellW} height={G.cellH} rx={7}
            fill={bg} stroke={border} strokeWidth={1.5}/>
      <text x={x + G.cellW / 2} y={y + G.cellH / 2 + G.valueFont * 0.36}
            textAnchor="middle" fontFamily="var(--font-mono)"
            fontSize={G.valueFont} fill="var(--chalk-100)">
        {value}
      </text>
    </g>
  );
}

// Rounded outline bracket around a subarray on the tree.
function SubarrayBracket({ G, level, from, to, stroke = 'rgba(232,220,193,0.28)', opacity = 1 }) {
  const r = bracketRect(G, level, from, to);
  return (
    <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={10}
          fill="none" stroke={stroke} strokeWidth={G.bracketStroke} opacity={opacity}/>
  );
}

// Diagonal split connector from a parent group centre to one child group centre.
function SplitLine({ G, parentLevel, parentFrom, parentTo, childLevel, childFrom, childTo, drawT }) {
  const pr = bracketRect(G, parentLevel, parentFrom, parentTo);
  const cr = bracketRect(G, childLevel, childFrom, childTo);
  const x1 = pr.x + pr.w / 2;
  const y1 = pr.y + pr.h;
  const x2 = cr.x + cr.w / 2;
  const y2 = cr.y;
  // Animate from parent down toward child via dashoffset.
  const len = Math.hypot(x2 - x1, y2 - y1);
  const t = clamp(drawT, 0, 1);
  return (
    <line x1={x1} y1={y1} x2={x2} y2={y2}
          stroke="var(--violet-400)" strokeWidth={G.splitStroke}
          strokeDasharray={len} strokeDashoffset={(1 - t) * len}
          opacity={0.85}/>
  );
}

// Level eyebrow ("nivå 0", "nivå 1" …) parked to the left of each row,
// right-aligned so it ends just before the bracket starts.
function LevelLabel({ G, level, text, opacity = 1 }) {
  const y = G.topY + level * G.rowH + G.cellH / 2;
  return (
    <text x={G.levelLabelX} y={y + 4}
          textAnchor="end"
          fontFamily="var(--font-mono)" fontSize={G.levelLabelFont}
          fill="var(--amber-300)" letterSpacing="0.16em" opacity={opacity}>
      {text}
    </text>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="splitt og hersk"
      title="Flettesortering: del og hersk"
      duration={SCENE_DURATION}
      introEnd={8.95}
      introCaption="Sorter raskere enn n i andre."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.95} end={21.64}>
        <SplittBeat/>
      </Sprite>

      <Sprite start={21.64} end={38.25}>
        <FletteBeat/>
      </Sprite>

      <Sprite start={38.25} end={48.51}>
        <FletteOppBeat/>
      </Sprite>

      <Sprite start={48.51} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Splitt (GENUINE MOTION — tree expands DOWN) ───────────────────
// All 8 unsorted cells appear at the top (level 0). The split moves cells
// progressively to lower rows: level 1 (two halves), level 2 (four
// quartets-of-2), level 3 (eight singletons). Subarray brackets and the
// violet splitting lines draw in as each level lands.
function SplittBeat() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Schedule: level 0 settles, then three "split" waves drop cells down.
  const LEVEL_AT = [at(0.05), at(0.25), at(0.46), at(0.66)];   // when level k *starts* appearing
  const SPLIT_DUR = 0.85;                                       // seconds per drop wave

  // Visibility of each level (0..1).
  function levelVis(k) {
    return clamp((localTime - LEVEL_AT[k]) / SPLIT_DUR, 0, 1);
  }

  // The cells at the top level (level 3 raw order) animate DOWN into each
  // successive split. Each cell is rendered at its *deepest visible level so far*.
  // For each value v we compute (level, slot) by finding the deepest level
  // whose visibility > 0.
  const deepestVisibleLevel = [0, 1, 2, 3].reduce(
    (acc, k) => (levelVis(k) > 0 ? k : acc), 0,
  );

  // During splitting the values are NOT rearranged — they only get bracketed
  // into smaller subarrays. So each value keeps its original (level-3) slot
  // at every level; only the y-coordinate (level) changes as it drops down.
  const slotOriginal = (v) => VALUES.indexOf(v);
  function cellXYFor(v) {
    const lvl = deepestVisibleLevel;
    const vis = levelVis(lvl);
    const slot = slotOriginal(v);
    if (lvl === 0 || vis >= 1) {
      return cellTopLeft(G, lvl, slot);
    }
    const a = cellTopLeft(G, lvl - 1, slot);
    const b = cellTopLeft(G, lvl, slot);
    const e = easeInOutCubic(vis);
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Level eyebrows fade in as their level appears */}
      {[0, 1, 2, 3].map((k) => (
        <SvgFadeIn key={`lbl${k}`} duration={0.35} delay={LEVEL_AT[k] + 0.05}>
          <LevelLabel G={G} level={k}
                      text={k === 3 ? 'nivå 3 — én bit' : `nivå ${k}`}/>
        </SvgFadeIn>
      ))}

      {/* Subarray brackets — one rect per group at each level, drawn in once
          its level lands. */}
      {[0, 1, 2, 3].map((k) => {
        const groups = groupsAt(k);
        return groups.map((g, i) => (
          <SvgFadeIn key={`br${k}-${i}`} duration={0.35}
                     delay={LEVEL_AT[k] + SPLIT_DUR * 0.55}>
            <SubarrayBracket G={G} level={k} from={g.from} to={g.to}
                             stroke={k === 3 ? 'var(--teal-400)' : 'rgba(232,220,193,0.32)'}/>
          </SvgFadeIn>
        ));
      })}

      {/* Split connector lines — parent group → each child group at the
          next level. Drawn when going from k to k+1. */}
      {[0, 1, 2].map((k) => {
        const parents = groupsAt(k);
        const children = groupsAt(k + 1);
        const t = (localTime - LEVEL_AT[k + 1]) / SPLIT_DUR;
        return parents.map((p, i) => {
          const cL = children[2 * i];
          const cR = children[2 * i + 1];
          return (
            <g key={`sp${k}-${i}`}>
              <SplitLine G={G} parentLevel={k} parentFrom={p.from} parentTo={p.to}
                         childLevel={k + 1} childFrom={cL.from} childTo={cL.to}
                         drawT={t}/>
              <SplitLine G={G} parentLevel={k} parentFrom={p.from} parentTo={p.to}
                         childLevel={k + 1} childFrom={cR.from} childTo={cR.to}
                         drawT={t}/>
            </g>
          );
        });
      })}

      {/* The 8 cells — each rendered at its interpolated position. */}
      {VALUES.map((v) => {
        const pos = cellXYFor(v);
        const isBase = deepestVisibleLevel === 3 && levelVis(3) >= 0.6;
        return (
          <TreeCell key={v} G={G} x={pos.x} y={pos.y} value={v}
                    state={isBase ? 'sorted' : 'idle'}/>
        );
      })}

      {/* Base-case caption — appears when level 3 has fully landed. */}
      <SvgFadeIn duration={0.5} delay={LEVEL_AT[3] + SPLIT_DUR + 0.25}>
        <text x={G.svgW / 2} y={G.bottomCaptionY}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 26 : 22} fill="var(--teal-400)">
          én bit, ett tall — allerede sortert
        </text>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 3: Flette (GENUINE MOTION — two pointers + filling output) ──────
// Close-up of merging L=[2,5,8] and R=[1,3,7]. Six steps, pointers march, the
// output row fills cell by cell. A small comparison badge calls out the
// pairing each step, and a compact pseudocode panel sits to the right
// (landscape) — house pattern: CodeBlock with fontVariantLigatures: 'none'.
const FL_LEFT = [2, 5, 8];
const FL_RIGHT = [1, 3, 7];

// Pre-computed merge trace. Each step records the (i, j) BEFORE the take, the
// pair being compared, the side ('L' | 'R') we take from, and the value taken.
const FL_STEPS = (() => {
  const steps = [];
  let i = 0, j = 0;
  while (i < FL_LEFT.length && j < FL_RIGHT.length) {
    const take = FL_LEFT[i] <= FL_RIGHT[j] ? 'L' : 'R';
    steps.push({ i, j, take, value: take === 'L' ? FL_LEFT[i] : FL_RIGHT[j] });
    if (take === 'L') i++; else j++;
  }
  while (i < FL_LEFT.length) {
    steps.push({ i, j, take: 'L', value: FL_LEFT[i], tail: 'L' });
    i++;
  }
  while (j < FL_RIGHT.length) {
    steps.push({ i, j, take: 'R', value: FL_RIGHT[j], tail: 'R' });
    j++;
  }
  return steps;                                  // 6 entries — see header comments
})();

const FLETTE_CODE = [
  'mens i < len(A) og j < len(B):',
  '    hvis A[i] <= B[j]:',
  '        ta A[i]; i += 1',
  '    ellers:',
  '        ta B[j]; j += 1',
].join('\n');

function fletteGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      cell: 56, gap: 6,
      leftHalfX: 240, leftHalfY: 320,
      rightHalfX: 240, rightHalfY: 460,
      outputX: 50, outputY: 760,
      halfLabelX: 80,
      badgeX: 80, badgeY: 920, badgeW: 560,
      stepLabelFont: 11, valueFont: 24,
      codeVisible: false,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    cell: 60, gap: 6,
    leftHalfX: 220, leftHalfY: 180,
    rightHalfX: 220, rightHalfY: 290,
    outputX: 130, outputY: 470,
    halfLabelX: 120,
    badgeX: 720, badgeY: 400, badgeW: 460,
    stepLabelFont: 12, valueFont: 24,
    codeVisible: true,
    codeX: 720, codeY: 130, codeW: 480,
  };
}

function HalfRow({ FG, values, label, originY, originX, pointerSlot, exhausted }) {
  return (
    <>
      {/* Half label (mono eyebrow) — to the LEFT of the row */}
      <text x={originX - 16} y={originY + FG.cell * 0.5 + 5}
            textAnchor="end" fontFamily="var(--font-mono)" fontSize={FG.stepLabelFont}
            fill="var(--chalk-300)" letterSpacing="0.16em">
        {label}
      </text>
      {values.map((v, idx) => {
        const x = originX + idx * (FG.cell + FG.gap);
        const isActive = !exhausted && idx === pointerSlot;
        const isConsumed = idx < pointerSlot;
        const stroke = isActive ? 'var(--amber-400)' : 'rgba(232,220,193,0.28)';
        const opacity = isConsumed ? 0.20 : 1;
        const bg = isActive ? 'rgba(244,184,96,0.14)' : 'rgba(0,0,0,0.45)';
        return (
          <g key={idx} opacity={opacity}>
            <rect x={x} y={originY} width={FG.cell} height={FG.cell} rx={9}
                  fill={bg} stroke={stroke} strokeWidth={1.5}/>
            <text x={x + FG.cell / 2} y={originY + FG.cell * 0.5 + FG.valueFont * 0.36}
                  textAnchor="middle" fontFamily="var(--font-mono)" fontSize={FG.valueFont}
                  fill="var(--chalk-100)">{v}</text>
          </g>
        );
      })}
    </>
  );
}

// Triangular pointer that glides between cells of a half row.
function MovingPointer({ FG, originX, originY, slot, above = true, color = 'var(--amber-400)' }) {
  const x = originX + slot * (FG.cell + FG.gap) + FG.cell / 2;
  const yTip = above ? originY - 6 : originY + FG.cell + 6;
  const yBase = above ? originY - 18 : originY + FG.cell + 18;
  return (
    <polygon
      points={`${x - 9},${yBase} ${x + 9},${yBase} ${x},${yTip}`}
      fill={color}
      style={{ transition: 'none' }}
    />
  );
}

function FletteBeat() {
  const portrait = usePortrait();
  const FG = fletteGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  const stepCount = FL_STEPS.length;             // 6
  const stepStart = 1.2;                         // seconds before the first step
  const stepStride = (T - stepStart - 1.4) / stepCount;

  // Continuous step progress: 0 before stepStart, fractional during, integer plateaus.
  const stepProgress = clamp((localTime - stepStart) / stepStride, 0, stepCount);
  const completedSteps = Math.min(Math.floor(stepProgress), stepCount);
  const fractional = stepProgress - completedSteps;
  // The "current" step (0..stepCount-1) is the one being compared right now.
  const currentStepIdx = Math.min(completedSteps, stepCount - 1);
  const stepNow = FL_STEPS[currentStepIdx];
  const introPhase = localTime < stepStart;

  // Pointer slots glide between consecutive (i, j) by interpolation.
  let curI, curJ;
  if (introPhase) {
    curI = 0; curJ = 0;
  } else if (completedSteps >= stepCount) {
    curI = FL_LEFT.length; curJ = FL_RIGHT.length;
  } else {
    curI = stepNow.i; curJ = stepNow.j;
  }
  // Output row: cells 0..completedSteps - 1 have landed; the fractional one
  // is sliding in.
  const outputValues = FL_STEPS.slice(0, completedSteps).map(s => s.value);

  const leftExhausted = curI >= FL_LEFT.length;
  const rightExhausted = curJ >= FL_RIGHT.length;

  // Comparison badge text.
  let cmpText = '—';
  let chosenText = '—';
  let chosenColor = 'var(--chalk-300)';
  if (introPhase) {
    cmpText = 'sett begge pekere på første tall';
    chosenText = '';
  } else if (currentStepIdx < stepCount) {
    const s = stepNow;
    if (s.tail === 'L') {
      cmpText = `B er tom · ta resten av A`;
      chosenText = `→ ${s.value}`;
      chosenColor = 'var(--amber-300)';
    } else if (s.tail === 'R') {
      cmpText = `A er tom · ta resten av B`;
      chosenText = `→ ${s.value}`;
      chosenColor = 'var(--amber-300)';
    } else {
      const lv = FL_LEFT[s.i], rv = FL_RIGHT[s.j];
      cmpText = `${lv}  mot  ${rv}`;
      chosenText = `→ ta ${s.value}`;
      chosenColor = 'var(--amber-300)';
    }
  }

  return (
    <>
      <svg viewBox={`0 0 ${FG.svgW} ${FG.svgH}`}
           width="100%" height="100%"
           style={{ position: 'absolute', inset: 0 }}>
        <HalfRow FG={FG} values={FL_LEFT} label="A"
                 originX={FG.leftHalfX} originY={FG.leftHalfY}
                 pointerSlot={Math.min(curI, FL_LEFT.length - 1)}
                 exhausted={leftExhausted}/>
        <HalfRow FG={FG} values={FL_RIGHT} label="B"
                 originX={FG.rightHalfX} originY={FG.rightHalfY}
                 pointerSlot={Math.min(curJ, FL_RIGHT.length - 1)}
                 exhausted={rightExhausted}/>

        {!leftExhausted && (
          <MovingPointer FG={FG}
            originX={FG.leftHalfX} originY={FG.leftHalfY}
            slot={curI} above={true}/>
        )}
        {!rightExhausted && (
          <MovingPointer FG={FG}
            originX={FG.rightHalfX} originY={FG.rightHalfY}
            slot={curJ} above={true}/>
        )}

        {/* Output row — 6 slots, cells appear one per merge step. */}
        <g>
          {Array.from({ length: stepCount }).map((_, idx) => {
            const x = FG.outputX + idx * (FG.cell + FG.gap);
            const v = outputValues[idx];
            const placed = v !== undefined;
            const stroke = placed ? 'var(--amber-300)' : 'rgba(232,220,193,0.18)';
            const bg = placed ? 'rgba(244,184,96,0.16)' : 'rgba(0,0,0,0.30)';
            return (
              <g key={idx}>
                <rect x={x} y={FG.outputY} width={FG.cell} height={FG.cell} rx={9}
                      fill={bg} stroke={stroke} strokeWidth={1.5}
                      strokeDasharray={placed ? undefined : '4 4'}/>
                {placed && (
                  <text x={x + FG.cell / 2} y={FG.outputY + FG.cell * 0.5 + FG.valueFont * 0.36}
                        textAnchor="middle" fontFamily="var(--font-mono)"
                        fontSize={FG.valueFont} fill="var(--amber-300)">
                    {v}
                  </text>
                )}
              </g>
            );
          })}
          {/* "ut" label above the output row */}
          <text x={FG.outputX} y={FG.outputY - 14}
                fontFamily="var(--font-mono)" fontSize={FG.stepLabelFont}
                fill="var(--amber-300)" letterSpacing="0.16em">
            ut
          </text>
        </g>

        {/* Sliding-in animation for the newly-placed cell. While fractional
            is in (0, 0.5) the next-to-arrive value sits as a translucent
            preview; harmless if completedSteps == stepCount. */}
        {completedSteps < stepCount && fractional > 0.55 && (() => {
          const idx = completedSteps;
          const x = FG.outputX + idx * (FG.cell + FG.gap);
          const v = FL_STEPS[idx].value;
          const a = clamp((fractional - 0.55) / 0.40, 0, 1);
          return (
            <g opacity={a}>
              <rect x={x} y={FG.outputY} width={FG.cell} height={FG.cell} rx={9}
                    fill="rgba(244,184,96,0.10)" stroke="var(--amber-300)" strokeWidth={1.5}/>
              <text x={x + FG.cell / 2} y={FG.outputY + FG.cell * 0.5 + FG.valueFont * 0.36}
                    textAnchor="middle" fontFamily="var(--font-mono)"
                    fontSize={FG.valueFont} fill="var(--amber-300)">{v}</text>
            </g>
          );
        })()}
      </svg>

      {/* Pseudocode panel — landscape only. House pattern with no ligatures
          so '<=' renders as the literal characters. */}
      {FG.codeVisible && (
        <CodeBlock
          code={FLETTE_CODE} title="flett(A, B)"
          reveal="all" fontSize={15}
          duration={0.3} delay={0.3}
          style={{ position: 'absolute', left: FG.codeX, top: FG.codeY,
                   width: FG.codeW, fontVariantLigatures: 'none' }}/>
      )}

      {/* Comparison badge — under the code panel in landscape, at the
          bottom of the canvas in portrait. */}
      <FadeUp duration={0.4} delay={0.5} distance={6}
        style={{
          position: 'absolute', left: FG.badgeX, top: FG.badgeY, width: FG.badgeW,
          padding: '14px 20px', borderRadius: 12,
          background: 'rgba(0,0,0,0.55)',
          border: '1.5px solid var(--amber-400)',
          display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none',
        }}>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
          letterSpacing: '0.16em', textTransform: 'uppercase',
        }}>
          {introPhase
            ? 'sammenligning'
            : `trinn ${currentStepIdx + 1} av ${stepCount}`}
        </span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 22 : 24,
          color: 'var(--chalk-100)',
        }}>{cmpText}</span>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 20,
          color: chosenColor,
        }}>{chosenText}</span>
      </FadeUp>
    </>
  );
}

// ─── Beat 4: Hele treet flettes opp (GENUINE MOTION) ──────────────────────
// Mirror of the Splitt beat: now the tree starts at level 3 (singletons)
// and the cells animate UP through three merge waves. As cells rise, they
// also rearrange into sorted order within each parent group. Subarray
// brackets re-frame the new groups at each level.
function FletteOppBeat() {
  const portrait = usePortrait();
  const G = treeGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Schedule: settle at level 3 briefly, then three merge waves rising —
  // each merge wave lands at a shallower level. Indexed BY LEVEL: WAVE_AT[3]
  // is the start (singletons appear), WAVE_AT[0] is the last wave (sorted
  // whole lands).
  const WAVE_AT = [at(0.72), at(0.48), at(0.24), at(0.06)];     // when level k *starts* to land
  const WAVE_DUR = 0.85;

  function levelVis(k) {
    return clamp((localTime - WAVE_AT[k]) / WAVE_DUR, 0, 1);
  }

  // Wave order is 3 → 2 → 1 → 0; the "shallowest" landed level controls
  // current rendering.
  const shallowestLanded = [3, 2, 1, 0].reduce(
    (acc, k) => (levelVis(k) > 0 ? k : acc), 3,
  );

  function cellXYFor(v) {
    const lvl = shallowestLanded;
    const vis = levelVis(lvl);
    if (lvl === 3 || vis >= 1) {
      const slot = slotOf(v, lvl);
      return cellTopLeft(G, lvl, slot);
    }
    const prevSlot = slotOf(v, lvl + 1);
    const newSlot = slotOf(v, lvl);
    const a = cellTopLeft(G, lvl + 1, prevSlot);
    const b = cellTopLeft(G, lvl, newSlot);
    const e = easeInOutCubic(vis);
    return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e };
  }

  // Each cell's render-state. Cells get an amber glow when their level is
  // freshly landing; otherwise neutral; the final level-0 row holds an
  // amber-300 "sorted" treatment.
  function cellState(v) {
    const lvl = shallowestLanded;
    const vis = levelVis(lvl);
    if (lvl === 0 && vis >= 0.6) return 'output';
    if (vis < 1 && lvl < 3) return 'active';
    return 'idle';
  }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      {/* Level eyebrows */}
      {[3, 2, 1, 0].map((k) => (
        <SvgFadeIn key={`lbl${k}`} duration={0.35} delay={WAVE_AT[k] + 0.05}>
          <LevelLabel G={G} level={k}
                      text={k === 0 ? 'nivå 0 — sortert' : `nivå ${k}`}/>
        </SvgFadeIn>
      ))}

      {/* Brackets at each level — the active level's brackets glow amber. */}
      {[3, 2, 1, 0].map((k) => {
        const groups = groupsAt(k);
        return groups.map((g, i) => {
          const isLevelHero = shallowestLanded === k && levelVis(k) > 0.5;
          const stroke = k === 0 && levelVis(0) >= 0.6
            ? 'var(--amber-300)'
            : isLevelHero ? 'var(--amber-400)' : 'rgba(232,220,193,0.28)';
          return (
            <SvgFadeIn key={`br${k}-${i}`} duration={0.35}
                       delay={WAVE_AT[k] + WAVE_DUR * 0.45}>
              <SubarrayBracket G={G} level={k} from={g.from} to={g.to} stroke={stroke}/>
            </SvgFadeIn>
          );
        });
      })}

      {/* Cells — at their (interpolated) positions, state per phase. */}
      {VALUES.map((v) => {
        const pos = cellXYFor(v);
        return (
          <TreeCell key={v} G={G} x={pos.x} y={pos.y} value={v}
                    state={cellState(v)}/>
        );
      })}

      {/* Final caption when the sorted-whole row has just landed. */}
      <SvgFadeIn duration={0.5} delay={WAVE_AT[0] + WAVE_DUR + 0.25}>
        <text x={G.svgW / 2} y={G.bottomCaptionY}
              textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={portrait ? 26 : 22} fill="var(--amber-300)">
          flettet sammen — én sortert liste
        </text>
      </SvgFadeIn>
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
          log<sub>2</sub> n nivåer
        </FadeUp>
        <FadeUp duration={0.4} delay={0.9} distance={4}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--chalk-300)',
          }}>
          {portrait ? 'x' : '·'}
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
          n flettinger
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
          O(n log n)
        </FadeUp>
      </div>

      <FadeUp duration={0.6} delay={3.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 24 : 30,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '40ch',
          lineHeight: 1.3,
        }}>
        Del og hersk — <span style={{ color: 'var(--amber-300)' }}>sortér åtte tall, eller en million.</span>
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
