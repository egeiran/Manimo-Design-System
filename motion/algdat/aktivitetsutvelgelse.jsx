// Aktivitetsutvelgelse: grådig regel — Manimo lesson scene.
// Chapter 7 of algdat (Grådige algoritmer). The canonical greedy-by-end
// algorithm: given N activities with start/end times, pick the maximum
// number of non-overlapping ones by repeatedly choosing the activity with
// the earliest finishing time that doesn't conflict with the last pick.
//
// Beats (placeholder timings — rewire-scene.js overwrites after audio):
//    0– 8     Manimo hook
//    8–22     Problem — eight bars TraceIn on a day timeline in original
//             order; overlap is visible (GENUINE MOTION)
//   22–35     Sortering — bars interpolate vertically to sorted-by-end
//             order over ~1.2s, then settle (GENUINE MOTION)
//   35–55     Grådig sveip — pointer descends the sorted rows; selected
//             bars light amber, rejected dim to rose; timeline lastEnd
//             marker hops forward; counter ticks 0..4 (GENUINE MOTION)
//   55–67     Takeaway — "velg det som blir ferdig først" + n log n payoff
//
// Colour discipline:
//   chalk-100  bar labels, captions
//   chalk-300  axis ticks, dimmed labels
//   amber-400  primary stroke (timeline axis, selected bar borders, sweep guide)
//   amber-300  selected bar fill, badge accent, payoff text
//   rose-400   rejected bar stroke after sweep passes
//   rose-300   reject badge, dim labels
//   teal-400   sweep pointer (the descending decision marker)
//   violet-400 lastEnd marker on the timeline
//
// Milestones inside each motion beat are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 57;

const NARRATION = [
  /*  0– 8  */ 'Du har én dag og altfor mange aktiviteter. Mange overlapper. Hvilken regel velger så mange du rekker?',
  /*  8–22  */ 'Åtte aktiviteter ligger på en dag fra åtte til tjueén. Bredden er hvor lenge den varer, og venstrekanten er starttiden. Du kan bare gjøre én om gangen — to som overlapper er ute av spørsmålet.',
  /* 22–35  */ 'Grådig regel: sortér aktivitetene etter når de er ferdige. Den som slutter først, blir første kandidat — for den frigjør tiden tidligst.',
  /* 35–55  */ 'Vi går nedover de sorterte radene. Plukk den første, den slutter klokken ti. Hopp over alle som starter før klokken ti. Plukk den neste som er ledig — klokken elleve. Og så videre. Fire aktiviteter passer inn i dagen.',
  /* 55–67  */ 'Fire av åtte aktiviteter. Sorteringen koster orden n log n; selve plukket går på lineær tid. Velg det som blir ferdig først.',
];

const NARRATION_AUDIO = 'audio/aktivitetsutvelgelse/scene.mp3';

// ─── Activity data ─────────────────────────────────────────────────────────
// Each activity: label, start hour, end hour. Original (unsorted) order is the
// row index in ACTIVITIES. Sorted-by-end order is computed below — used by the
// Sort and Greedy-sweep beats. The greedy decision is precomputed so we don't
// re-derive it inside render.
const ACTIVITIES = [
  { label: 'A', start: 8,  end: 10 },
  { label: 'B', start: 9,  end: 11 },
  { label: 'C', start: 10, end: 13 },
  { label: 'D', start: 11, end: 12 },
  { label: 'E', start: 12, end: 15 },
  { label: 'F', start: 14, end: 17 },
  { label: 'G', start: 15, end: 18 },
  { label: 'H', start: 17, end: 20 },
];

// Sorted indices into ACTIVITIES, ordered by end-time ascending.
const SORTED_ORDER = ACTIVITIES
  .map((_, i) => i)
  .sort((a, b) => ACTIVITIES[a].end - ACTIVITIES[b].end);

// Greedy decision per *sorted* row: true = selected, false = rejected.
// Also remember the lastEnd at each step (for the timeline marker).
const GREEDY = (() => {
  let lastEnd = -Infinity;
  return SORTED_ORDER.map((origIdx) => {
    const act = ACTIVITIES[origIdx];
    const selected = act.start >= lastEnd;
    if (selected) lastEnd = act.end;
    return { origIdx, selected, lastEndAfter: lastEnd };
  });
})();

const SELECTED_COUNT = GREEDY.filter(g => g.selected).length;  // 4

// ─── Timeline geometry ─────────────────────────────────────────────────────
// Day runs 8:00..21:00 (13 hours). Bars sit on rows; row index changes from
// original (ACTIVITIES order) to sorted-by-end order during beat 3.
function geom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      // Timeline x: 50..670 over 13 hours
      axisX0: 50, axisX1: 670,
      hourMin: 8, hourMax: 21,
      // Rows for 8 bars
      rowsY0: 320, rowsYStep: 78,    // 8*78 = 624 → 320..944
      barH: 36,
      // Labels & ticks
      tickY: 274,
      axisY: 290,                    // baseline of the hour axis
      labelLetterFont: 16,
      labelHourFont: 11,
      // Sweep + lastEnd
      sweepX0: 22, sweepX1: 698,     // pointer arrow visible to the left
      lastEndY0: 290, lastEndY1: 956,
      // Badge
      badgeX: 480, badgeY: 220, badgeFont: 18, badgeFontBig: 28,
      // Caption under axis
      hintY: 1010, hintFont: 13,
    };
  }
  return {
    svgW: 1280, svgH: 720,
    axisX0: 180, axisX1: 1100,
    hourMin: 8, hourMax: 21,
    rowsY0: 200, rowsYStep: 52,      // 8*52 = 416 → 200..616
    barH: 32,
    tickY: 164,
    axisY: 180,
    labelLetterFont: 18,
    labelHourFont: 12,
    sweepX0: 130, sweepX1: 1150,
    lastEndY0: 180, lastEndY1: 632,
    badgeX: 980, badgeY: 100, badgeFont: 11, badgeFontBig: 28,
    hintY: 670, hintFont: 14,
  };
}

function xAtHour(G, h) {
  return G.axisX0 + (h - G.hourMin) / (G.hourMax - G.hourMin) * (G.axisX1 - G.axisX0);
}
function yAtRow(G, row) {
  return G.rowsY0 + row * G.rowsYStep;
}

// Colour helper — by activity state.
function barColours(state) {
  switch (state) {
    case 'pending':
      return { stroke: 'var(--amber-400)', fill: 'rgba(244,184,96,0.16)', textFill: 'var(--chalk-100)' };
    case 'examining':
      return { stroke: 'var(--violet-400)', fill: 'rgba(155,140,255,0.22)', textFill: 'var(--chalk-100)' };
    case 'selected':
      return { stroke: 'var(--amber-300)', fill: 'rgba(244,184,96,0.34)', textFill: 'var(--chalk-100)' };
    case 'rejected':
      return { stroke: 'var(--rose-400)', fill: 'rgba(232,122,144,0.10)', textFill: 'var(--chalk-300)' };
    default:
      return { stroke: 'var(--amber-400)', fill: 'rgba(244,184,96,0.10)', textFill: 'var(--chalk-100)' };
  }
}

// ─── Easing ────────────────────────────────────────────────────────────────
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Reusable: hour axis with tick marks ───────────────────────────────────
function HourAxis({ G, fadeDelay = 0 }) {
  const ticks = [];
  for (let h = G.hourMin; h <= G.hourMax; h++) ticks.push(h);
  return (
    <SvgFadeIn duration={0.4} delay={fadeDelay}>
      <g>
        <line x1={G.axisX0} y1={G.axisY} x2={G.axisX1} y2={G.axisY}
              stroke="var(--amber-400)" strokeWidth={1.6}/>
        {ticks.map((h) => {
          const x = xAtHour(G, h);
          const major = h % 2 === 0;
          return (
            <g key={`t${h}`}>
              <line x1={x} y1={G.axisY} x2={x} y2={G.axisY - (major ? 8 : 5)}
                    stroke="var(--amber-400)" strokeWidth={1.2}/>
              {major && (
                <text x={x} y={G.tickY} textAnchor="middle"
                      fontFamily="var(--font-mono)" fontSize={G.labelHourFont}
                      fill="var(--chalk-300)" letterSpacing="0.05em">
                  {h.toString().padStart(2, '0')}
                </text>
              )}
            </g>
          );
        })}
      </g>
    </SvgFadeIn>
  );
}

// ─── Reusable: one activity bar at a specific row ──────────────────────────
function ActivityBar({ G, act, row, state, drawT = 1, opacity = 1 }) {
  const xS = xAtHour(G, act.start);
  const xE = xAtHour(G, act.end);
  const y = yAtRow(G, row);
  const w = xE - xS;
  const wT = w * clamp(drawT, 0, 1);
  const { stroke, fill, textFill } = barColours(state);
  return (
    <g opacity={opacity}>
      <rect x={xS} y={y - G.barH / 2} width={wT} height={G.barH} rx={8}
            fill={fill} stroke={stroke} strokeWidth={1.8}/>
      {drawT > 0.6 && (
        <text x={xS + 12} y={y + G.barH * 0.16} textAnchor="start"
              fontFamily="var(--font-mono)" fontSize={G.labelLetterFont}
              fill={textFill} fontWeight="500">
          {act.label}
        </text>
      )}
      {drawT > 0.85 && w > 64 && (
        <text x={xS + wT - 8} y={y + G.barH * 0.16} textAnchor="end"
              fontFamily="var(--font-mono)" fontSize={G.labelHourFont}
              fill="var(--chalk-300)">
          {act.start}–{act.end}
        </text>
      )}
    </g>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="grådige algoritmer"
      title="Aktivitetsutvelgelse: grådig regel"
      duration={SCENE_DURATION}
      introEnd={7.9}
      introCaption="Velg det som blir ferdig først."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.9} end={22.3}>
        <ProblemOppstilling/>
      </Sprite>

      <Sprite start={22.3} end={32.52}>
        <Sortering/>
      </Sprite>

      <Sprite start={32.52} end={45.98}>
        <GradigSveip/>
      </Sprite>

      <Sprite start={45.98} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Problem oppstilling ──────────────────────────────────────────
// GENUINE MOTION — eight bars draw in left-to-right one by one on their own
// rows. Overlap is visible: B starts while A is still running, C overlaps D,
// F overlaps E, etc. The mess motivates the sort.
function ProblemOppstilling() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.5, 1);

  // Spawn bars from 0.10T to 0.78T.
  const spawnStart = 0.10 * T;
  const spawnEnd = 0.78 * T;
  const stride = (spawnEnd - spawnStart) / Math.max(ACTIVITIES.length - 1, 1);
  function barTime(i) { return spawnStart + i * stride; }

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <HourAxis G={G} fadeDelay={0}/>

      {ACTIVITIES.map((act, i) => {
        const t0 = barTime(i);
        const drawT = clamp((localTime - t0) / 0.45, 0, 1);
        if (drawT <= 0) return null;
        return (
          <ActivityBar key={act.label} G={G} act={act} row={i}
                       state="pending" drawT={drawT} opacity={1}/>
        );
      })}

      <SvgFadeIn duration={0.4} delay={0.85 * T}>
        <text x={G.svgW / 2} y={G.hintY} textAnchor="middle"
              fontFamily="var(--font-serif)" fontStyle="italic"
              fontSize={G.hintFont} fill="var(--chalk-100)">
          Mange overlapper — &nbsp;
          <tspan fill="var(--amber-300)">hvilken regel velger flest?</tspan>
        </text>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 3: Sortering (GENUINE MOTION — bars interpolate to sorted rows) ─
// Each bar starts at its original row (i in ACTIVITIES) and ends at its
// sorted-row (position in SORTED_ORDER). We interpolate y in the middle
// 0.30T..0.78T window. Outside the window the bar sits at its endpoint.
function Sortering() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.5, 1);

  // SORTED_ORDER is an array of original indices in sorted order. For each
  // original index i, its sorted-row = SORTED_ORDER.indexOf(i).
  const sortedRowOf = ACTIVITIES.map((_, i) => SORTED_ORDER.indexOf(i));

  const slideStart = 0.30 * T;
  const slideEnd = 0.78 * T;
  const slideT = clamp((localTime - slideStart) / (slideEnd - slideStart), 0, 1);
  const eT = easeInOutCubic(slideT);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <HourAxis G={G} fadeDelay={0}/>

      {/* Sorted-row guide ticks on the right edge that fade in as bars settle. */}
      {slideT > 0.4 && (
        <g opacity={clamp((slideT - 0.4) / 0.5, 0, 1)}>
          {SORTED_ORDER.map((origIdx, sortedRow) => {
            const act = ACTIVITIES[origIdx];
            const xE = xAtHour(G, act.end);
            const y = yAtRow(G, sortedRow);
            return (
              <g key={`endmark-${origIdx}`}>
                <line x1={xE} y1={y - G.barH / 2 - 4} x2={xE} y2={y + G.barH / 2 + 4}
                      stroke="var(--amber-300)" strokeWidth={1} opacity={0.5}/>
              </g>
            );
          })}
        </g>
      )}

      {ACTIVITIES.map((act, origIdx) => {
        const rowOriginal = origIdx;
        const rowSorted = sortedRowOf[origIdx];
        const rowF = rowOriginal + (rowSorted - rowOriginal) * eT;
        // Highlight the "winner" (sorted row 0) when it lands.
        const isFirst = rowSorted === 0;
        const landed = slideT >= 0.95;
        const state = (landed && isFirst) ? 'examining' : 'pending';
        return (
          <ActivityBar key={act.label} G={G} act={act} row={rowF}
                       state={state} drawT={1} opacity={1}/>
        );
      })}

      <SvgFadeIn duration={0.4} delay={0.82 * T}>
        <text x={G.svgW / 2} y={G.hintY} textAnchor="middle"
              fontFamily="var(--font-mono)" fontSize={G.hintFont}
              fill="var(--amber-300)" letterSpacing="0.18em">
          SORTÉR ETTER SLUTTID
        </text>
      </SvgFadeIn>
    </svg>
  );
}

// ─── Beat 4: Grådig sveip ────────────────────────────────────────────────
// GENUINE MOTION — the sweep pointer descends the sorted rows. Each row is
// "examined" for a short window, then resolved (selected → amber, rejected
// → rose dim). The timeline lastEnd marker hops forward to the right edge
// of the most recently selected bar. Counter "valgt: K / 8" ticks 0..4.
function GradigSveip() {
  const portrait = usePortrait();
  const G = geom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 0.5, 1);

  // Per-row schedule: 8 steps, each step gets a slice of T from 0.08T..0.82T.
  // Within a step, the first 60% is "examining" (violet glow), the rest is
  // "resolved" (amber if selected, rose if rejected).
  const stepsStart = 0.08 * T;
  const stepsEnd = 0.82 * T;
  const stepLen = (stepsEnd - stepsStart) / GREEDY.length;
  function stepStart(k) { return stepsStart + k * stepLen; }

  // Determine the current step the pointer is over (continuous, for animation).
  // pointerStep ∈ [-0.3, GREEDY.length]
  const pointerStep = (localTime - stepsStart) / stepLen;

  // Resolved K = number of steps whose "examining" phase is over.
  function rowState(k) {
    const t = localTime - stepStart(k);
    if (t < 0) return 'pending';
    if (t < stepLen * 0.55) return 'examining';
    return GREEDY[k].selected ? 'selected' : 'rejected';
  }

  // lastEnd marker — hops forward as new bars are selected.
  // Use the most recent step whose "resolved" phase has begun and was selected.
  let lastEndHour = null;
  for (let k = 0; k < GREEDY.length; k++) {
    const t = localTime - stepStart(k);
    if (t >= stepLen * 0.55 && GREEDY[k].selected) {
      lastEndHour = GREEDY[k].lastEndAfter;
    }
  }

  // Selected count so far.
  const selectedSoFar = GREEDY.filter((g, k) => {
    return g.selected && (localTime - stepStart(k)) >= stepLen * 0.55;
  }).length;

  // Pointer y — interpolate between sorted rows for smooth descent.
  // Visible from stepsStart - 0.3*stepLen onwards.
  const pointerVisible = localTime >= stepsStart - 0.3 * stepLen;
  const pointerYRow = clamp(pointerStep, -0.3, GREEDY.length - 0.5);
  const pointerY = yAtRow(G, pointerYRow);

  return (
    <svg viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         width="100%" height="100%"
         style={{ position: 'absolute', inset: 0 }}>
      <HourAxis G={G} fadeDelay={0}/>

      {/* Bars in sorted order. */}
      {GREEDY.map((g, sortedRow) => {
        const act = ACTIVITIES[g.origIdx];
        const state = rowState(sortedRow);
        return (
          <ActivityBar key={act.label} G={G} act={act} row={sortedRow}
                       state={state} drawT={1}
                       opacity={state === 'rejected' ? 0.62 : 1}/>
        );
      })}

      {/* lastEnd vertical marker on the timeline — hops to the right edge of
          the most recently selected bar. */}
      {lastEndHour !== null && (
        <g>
          <line x1={xAtHour(G, lastEndHour)} y1={G.lastEndY0 - 8}
                x2={xAtHour(G, lastEndHour)} y2={G.lastEndY1 + 8}
                stroke="var(--violet-400)" strokeWidth={1.6}
                strokeDasharray="6 5" opacity={0.85}/>
          <text x={xAtHour(G, lastEndHour)} y={G.lastEndY0 - 14} textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.labelHourFont}
                fill="var(--violet-400)" letterSpacing="0.05em">
            klokken {lastEndHour}
          </text>
        </g>
      )}

      {/* Sweep pointer — small triangular arrow at the left edge that descends. */}
      {pointerVisible && pointerStep < GREEDY.length && (
        <g>
          <polygon
            points={`${G.sweepX0 - 14},${pointerY - 8} ${G.sweepX0 - 14},${pointerY + 8} ${G.sweepX0 - 2},${pointerY}`}
            fill="var(--teal-400)" opacity={0.95}/>
          <line x1={G.sweepX0 - 2} y1={pointerY} x2={G.sweepX1} y2={pointerY}
                stroke="var(--teal-400)" strokeWidth={1}
                strokeDasharray="3 6" opacity={0.30}/>
        </g>
      )}

      {/* Valgt-counter badge (top-right in landscape, top in portrait). */}
      <SvgFadeIn duration={0.3} delay={0}>
        <g>
          <rect x={G.badgeX - 8} y={G.badgeY - 26}
                width={portrait ? 200 : 220} height={portrait ? 64 : 56} rx={10}
                fill="rgba(0,0,0,0.55)" stroke="var(--amber-400)" strokeWidth={1.5}/>
          <text x={G.badgeX + 8} y={G.badgeY - 8}
                fontFamily="var(--font-mono)" fontSize={portrait ? 11 : 11}
                fill="var(--amber-300)" letterSpacing="0.18em">
            VALGT
          </text>
          <text x={G.badgeX + 8} y={G.badgeY + 22}
                fontFamily="var(--font-mono)" fontSize={G.badgeFontBig}
                fill="var(--amber-300)">
            {selectedSoFar} / 8
          </text>
        </g>
      </SvgFadeIn>

      {/* End-of-beat hint once all steps resolved. */}
      {pointerStep >= GREEDY.length - 0.2 && (
        <SvgFadeIn duration={0.4} delay={0.85 * T}>
          <text x={G.svgW / 2} y={G.hintY} textAnchor="middle"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize={G.hintFont} fill="var(--chalk-100)">
            Fire valgt &nbsp;
            <tspan fill="var(--amber-300)">— A, D, E, G.</tspan>
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
      alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{ fontFamily: 'var(--font-mono)', fontSize: 12,
                 color: 'var(--amber-300)', letterSpacing: '0.18em',
                 textTransform: 'uppercase' }}>
        grådige algoritmer
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 26 : 38, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '22ch' : '34ch', lineHeight: 1.25 }}>
        Velg det som <span style={{ color: 'var(--amber-300)' }}>blir ferdig først.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
                 color: 'var(--amber-300)',
                 fontVariantLigatures: 'none' }}>
        n log n + n &nbsp;→&nbsp; n log n
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
