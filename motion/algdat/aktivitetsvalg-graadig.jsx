// Aktivitetsvalg: ta den som slutter først — Manimo lesson scene.
// Chapter 7 of algdat (Grådige algoritmer). Activity selection is the
// canonical greedy story: sju aktiviteter på samme tidslinje, hver med
// et starttidspunkt og et sluttidspunkt, mange overlapper. Den grådige
// regelen — sorter etter slutttid, plukk det første som ikke overlapper
// med forrige valg — er optimal. Bars draw in unsortert, glir vertikalt
// til finish-sorted rekkefølge, deretter en grense-strek som vandrer
// høyrover mens valg-teller tikker. Lander på sortering + ett gjennomløp.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0– 9     Manimo hook (intro caption + journey)
//    9–20     Tidslinje + sju søyler tegnes inn usortert
//   20–32     Søylene glir på plass etter slutttid (GENUINE MOTION)
//   32–50     Grense-strek vandrer; bars tar/hopper-over (GENUINE MOTION)
//   50–60     Takeaway (regel + n log n + n)
//
// Colour discipline:
//   chalk-100  values, picked text, axis numerals
//   chalk-200  caption body, idle bar borders
//   chalk-300  dimmed bars (skipped), axis ticks, eyebrow
//   amber-400  picked bar border, advancing cutoff line, primary stroke
//   amber-300  picked bar fill tint, counter, payoff
//   rose-400   short flash on a skipped bar (overlap conflict)
//   teal-400   considering pulse ring (the moment the algorithm peeks)
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 64;

const NARRATION = [
  /*  0– 9  */ 'Du har sju aktiviteter som vil bruke det samme rommet. Hvor mange rekker du å gjennomføre uten at noen overlapper?',
  /*  9–20  */ 'Hver aktivitet har et starttidspunkt og et sluttidspunkt. Tegnet som søyler på tidslinjen ser vi at noen er korte, noen lange, og at flere overlapper hverandre.',
  /* 20–32  */ 'Det grådige trikset er å sortere etter slutttid, ikke etter start og ikke etter lengde. Da kan vi alltid plukke den som rydder rommet først.',
  /* 32–50  */ 'Vi tar den som slutter først — aktivitet to slutter i tre. Da må neste starte i tre eller senere. Aktivitet seks overlapper, hopp over. Fem starter i fire, ta den, slutter i sju. Sju starter i åtte, ta den, slutter i ti. Til slutt tre fra elleve. Fire aktiviteter får plass.',
  /* 50–60  */ 'Sorter etter slutttid, og plukk det første som ikke overlapper. Sorteringen tar orden n log n, plukket er bare ett gjennomløp. Grådig — og likevel optimalt.',
];

const NARRATION_AUDIO = 'audio/aktivitetsvalg-graadig/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
// Seven activities, presented unsorted on screen. id is the on-screen label.
// Sorted-by-finish order yields a greedy pick of {2, 5, 7, 3} → 4 activities.
const ACTS = [
  { id: 1, s: 5,  f: 9  }, // skipped — 5 < 7
  { id: 2, s: 1,  f: 3  }, // taken — first cutoff = 3
  { id: 3, s: 11, f: 13 }, // taken — 11 ≥ 10
  { id: 4, s: 1,  f: 8  }, // skipped — 1 < 7
  { id: 5, s: 4,  f: 7  }, // taken — 4 ≥ 3, cutoff = 7
  { id: 6, s: 2,  f: 5  }, // skipped — 2 < 3
  { id: 7, s: 8,  f: 10 }, // taken — 8 ≥ 7, cutoff = 10
];

const T_MIN = 0;
const T_MAX = 14;

// Indices into ACTS in finish-sorted order.
const SORTED_IDX = ACTS
  .map((a, i) => ({ i, f: a.f }))
  .sort((p, q) => p.f - q.f)
  .map(p => p.i);

// Map ACTS index → row position when sorted by finish.
const SORTED_ROW = (() => {
  const out = new Array(ACTS.length);
  SORTED_IDX.forEach((acti, row) => { out[acti] = row; });
  return out;
})();

// Greedy walk over the finish-sorted list. Pre-compute the schedule so the
// beat can deterministically rasterise per-bar state at any localTime.
const GREEDY_SCHEDULE = (() => {
  let cutoff = 0;
  const steps = [];
  for (let row = 0; row < SORTED_IDX.length; row++) {
    const acti = SORTED_IDX[row];
    const a = ACTS[acti];
    const taken = a.s >= cutoff;
    const newCutoff = taken ? a.f : cutoff;
    steps.push({ row, acti, id: a.id, s: a.s, f: a.f, taken, oldCutoff: cutoff, newCutoff });
    cutoff = newCutoff;
  }
  return steps;
})();

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      svgW: 720, svgH: 1280,
      // Timeline strip
      tlLeft: 70, tlRight: 660, tlBaseY: 320,
      tickH: 8, axisFont: 12,
      // Bars
      barH: 38, barGap: 10, firstBarY: 360,
      idFont: 17, stampFont: 12,
      labelGutterW: 56,            // left of bars: "to", "fem" etc.
      stampGutterW: 100,           // right of bars: "s=1 f=3"
      // Cutoff line + counter (portrait: counter below the bars, centred-right)
      cutoffStrokeW: 2.4,
      counterX: 280, counterY: 760,
      // Takeaway
      payoffMax: '24ch',
    };
  }
  return {
    svgW: 1280, svgH: 720,
    tlLeft: 200, tlRight: 1180, tlBaseY: 158,
    tickH: 8, axisFont: 13,
    barH: 38, barGap: 10, firstBarY: 192,
    idFont: 18, stampFont: 13,
    labelGutterW: 60,
    stampGutterW: 110,
    cutoffStrokeW: 2.8,
    counterX: 1000, counterY: 590,
    payoffMax: '34ch',
  };
}

function timeX(G, t) {
  return G.tlLeft + (t - T_MIN) * (G.tlRight - G.tlLeft) / (T_MAX - T_MIN);
}

function rowY(G, row) {
  return G.firstBarY + row * (G.barH + G.barGap);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Spelled-out Norwegian numerals for activity ids (read alongside narration).
const ID_WORD = {
  1: 'én', 2: 'to', 3: 'tre', 4: 'fire', 5: 'fem', 6: 'seks', 7: 'sju',
};

// ─── Pieces ────────────────────────────────────────────────────────────────
// state: 'idle' | 'considering' | 'taken' | 'skipped'
function ActivityBar({ G, acti, x1, x2, y, state, considerPulse = 0, flash = 0, opacity = 1 }) {
  const w = Math.max(2, x2 - x1);
  const border =
    state === 'taken' ? 'var(--amber-400)' :
    state === 'considering' ? 'var(--amber-400)' :
    state === 'skipped' ? 'rgba(232,220,193,0.28)' :
    'rgba(232,220,193,0.45)';
  const fill =
    state === 'taken' ? 'rgba(244,184,96,0.20)' :
    state === 'considering' ? 'rgba(244,184,96,0.10)' :
    state === 'skipped' ? 'rgba(232,220,193,0.05)' :
    'rgba(232,220,193,0.08)';
  const a = ACTS[acti];
  const rWord = ID_WORD[a.id];
  return (
    <g opacity={opacity}>
      {considerPulse > 0 && (
        <rect x={x1 - 4 - considerPulse * 6}
              y={y - 4 - considerPulse * 6}
              width={w + 8 + considerPulse * 12}
              height={G.barH + 8 + considerPulse * 12}
              rx={10} fill="none"
              stroke="var(--teal-400)" strokeWidth={1.5}
              opacity={Math.max(0, 1 - considerPulse) * 0.55}/>
      )}
      {flash > 0 && (
        <rect x={x1} y={y} width={w} height={G.barH} rx={8}
              fill="rgba(232,122,144,0.18)"
              stroke="var(--rose-400)" strokeWidth={1.5}
              opacity={flash}/>
      )}
      <rect x={x1} y={y} width={w} height={G.barH} rx={8}
            fill={fill} stroke={border} strokeWidth={1.5}/>
      {/* Activity id inside left edge of bar */}
      <text x={x1 + 10} y={y + G.barH / 2 + G.idFont * 0.36}
            fontFamily="var(--font-mono)" fontSize={G.idFont}
            fill={state === 'taken' || state === 'considering' ? 'var(--chalk-100)' : 'var(--chalk-300)'}>
        {rWord}
      </text>
      {/* start / finish stamp on the right, outside the bar */}
      <text x={x2 + 12} y={y + G.barH / 2 + G.stampFont * 0.36}
            fontFamily="var(--font-mono)" fontSize={G.stampFont}
            fill={state === 'skipped' ? 'var(--chalk-300)' : 'var(--chalk-200)'}>
        s={a.s} f={a.f}
      </text>
    </g>
  );
}

function Timeline({ G, ticks = [0, 2, 4, 6, 8, 10, 12], showLabel = true }) {
  return (
    <g>
      <line x1={G.tlLeft} y1={G.tlBaseY} x2={G.tlRight} y2={G.tlBaseY}
            stroke="rgba(232,220,193,0.35)" strokeWidth={1.5}/>
      {ticks.map(t => (
        <g key={t}>
          <line x1={timeX(G, t)} y1={G.tlBaseY - G.tickH}
                x2={timeX(G, t)} y2={G.tlBaseY + G.tickH}
                stroke="rgba(232,220,193,0.35)" strokeWidth={1}/>
          <text x={timeX(G, t)} y={G.tlBaseY - G.tickH - 6}
                textAnchor="middle"
                fontFamily="var(--font-mono)" fontSize={G.axisFont}
                fill="var(--chalk-300)">
            {t}
          </text>
        </g>
      ))}
      {showLabel && (
        <text x={G.tlRight + 8} y={G.tlBaseY + 4}
              fontFamily="var(--font-mono)" fontSize={G.axisFont}
              fill="var(--chalk-300)" letterSpacing="0.1em">
          tid
        </text>
      )}
    </g>
  );
}

function Counter({ G, value, accent = 'var(--amber-300)' }) {
  return (
    <g>
      <rect x={G.counterX} y={G.counterY} width={170} height={64} rx={10}
            fill="rgba(0,0,0,0.40)" stroke={accent} strokeWidth={1.5}/>
      <text x={G.counterX + 14} y={G.counterY + 22}
            fontFamily="var(--font-mono)" fontSize={11}
            fill={accent} letterSpacing="0.16em">
        VALGT
      </text>
      <text x={G.counterX + 110} y={G.counterY + 48}
            fontFamily="var(--font-mono)" fontSize={30}
            fill="var(--chalk-100)" textAnchor="end">
        {value}
      </text>
      <text x={G.counterX + 120} y={G.counterY + 48}
            fontFamily="var(--font-mono)" fontSize={20}
            fill="var(--chalk-300)">
        / 7
      </text>
    </g>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="grådige algoritmer"
      title="Aktivitetsvalg: ta den som slutter først"
      duration={SCENE_DURATION}
      introEnd={8.27}
      introCaption="Sju tidsvinduer, ett rom — hvor mange rekker du?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.27} end={19.01}>
        <SetupBeat/>
      </Sprite>

      <Sprite start={19.01} end={28.75}>
        <SortByFinishBeat/>
      </Sprite>

      <Sprite start={28.75} end={51.42}>
        <GreedyPickBeat/>
      </Sprite>

      <Sprite start={51.42} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Setup — timeline + unsortert søyle-rad ────────────────────────
function SetupBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Timeline first; then bars cascade in over ~60% of T.
  const tlReady = localTime >= at(0.10);
  const barStart = at(0.25);
  const barEnd = at(0.92);

  // Stagger: bar i appears at barStart + i * (span/8).
  const stride = (barEnd - barStart) / ACTS.length;
  const barProgress = (i) => clamp((localTime - (barStart + i * stride)) / 0.55, 0, 1);

  return (
    <svg style={{ position: 'absolute', inset: 0 }}
         viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         preserveAspectRatio="xMidYMid meet">
      {tlReady && <Timeline G={G} />}
      {ACTS.map((a, i) => {
        const p = barProgress(i);
        if (p <= 0) return null;
        const xStart = timeX(G, a.s);
        const xFinish = timeX(G, a.f);
        // Bar grows from start anchor to its full finish width.
        const xCurFinish = xStart + (xFinish - xStart) * easeInOutCubic(p);
        return (
          <ActivityBar key={i} G={G} acti={i}
                       x1={xStart} x2={xCurFinish}
                       y={rowY(G, i)}
                       state="idle"
                       opacity={p}/>
        );
      })}
    </svg>
  );
}

// ─── Beat 3: Sort by finish (GENUINE MOTION — vertical slide) ──────────────
function SortByFinishBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Hold-sort-hold rhythm: 0–0.18 hold, 0.18–0.70 lerp, 0.70+ settled badge.
  const sortStart = at(0.18);
  const sortEnd = at(0.70);
  const sortP = clamp((localTime - sortStart) / (sortEnd - sortStart), 0, 1);
  const eased = easeInOutCubic(sortP);
  const badgeShow = localTime >= at(0.78);

  return (
    <>
      <svg style={{ position: 'absolute', inset: 0 }}
           viewBox={`0 0 ${G.svgW} ${G.svgH}`}
           preserveAspectRatio="xMidYMid meet">
        <Timeline G={G} />
        {ACTS.map((a, i) => {
          const fromY = rowY(G, i);
          const toY = rowY(G, SORTED_ROW[i]);
          const y = fromY + (toY - fromY) * eased;
          const x1 = timeX(G, a.s);
          const x2 = timeX(G, a.f);
          return (
            <ActivityBar key={i} G={G} acti={i}
                         x1={x1} x2={x2} y={y}
                         state="idle"
                         opacity={1}/>
          );
        })}
      </svg>
      {badgeShow && (
        <FadeUp duration={0.45} delay={0} distance={6}
          style={{
            position: 'absolute',
            left: portrait ? '50%' : 'auto',
            right: portrait ? 'auto' : 80,
            top: portrait ? 220 : 590,
            transform: portrait ? 'translateX(-50%)' : 'none',
            padding: '8px 16px', borderRadius: 10,
            border: '1.5px solid var(--amber-300)',
            background: 'rgba(0,0,0,0.45)',
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
          sortert etter slutt
        </FadeUp>
      )}
    </>
  );
}

// ─── Beat 4: Greedy pick (GENUINE MOTION — cutoff sweep + per-bar) ─────────
function GreedyPickBeat() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const { localTime, duration } = useSprite();
  const T = Math.max(duration - 1, 1);

  // Step schedule as fractions of T. Each step has a "consider" moment
  // (pulse + decision) and a "settle" moment (cutoff advances if taken).
  const STEP_FRACS = [0.06, 0.18, 0.30, 0.42, 0.54, 0.66, 0.80];
  const PULSE_LEN = 0.7;           // seconds the considering ring lingers
  const SETTLE_LAG = 0.55;          // seconds after consider before settle/cutoff move
  const FLASH_LEN = 0.5;            // rose flash on a skipped bar

  // Step index that is currently being considered (most recent past).
  const considerTime = (k) => STEP_FRACS[k] * T;
  const settleTime = (k) => considerTime(k) + SETTLE_LAG;

  // Cutoff value at localTime: latest step k with localTime ≥ settleTime(k)
  // contributes its newCutoff if taken.
  let activeCutoff = 0;
  let cutoffTarget = 0;
  for (let k = 0; k < GREEDY_SCHEDULE.length; k++) {
    if (localTime >= settleTime(k)) {
      const st = GREEDY_SCHEDULE[k];
      activeCutoff = st.newCutoff;
      cutoffTarget = st.newCutoff;
    }
  }
  // Smooth cutoff between old and new during the settle window.
  let displayedCutoff = activeCutoff;
  for (let k = 0; k < GREEDY_SCHEDULE.length; k++) {
    const st = GREEDY_SCHEDULE[k];
    if (!st.taken) continue;
    const moveStart = settleTime(k);
    const moveEnd = moveStart + 0.55;
    if (localTime >= moveStart && localTime < moveEnd) {
      const p = clamp((localTime - moveStart) / (moveEnd - moveStart), 0, 1);
      displayedCutoff = st.oldCutoff + (st.newCutoff - st.oldCutoff) * easeInOutCubic(p);
    }
  }

  // Per-row state lookup.
  function stateForRow(row) {
    const st = GREEDY_SCHEDULE[row];
    if (localTime < considerTime(row)) return { state: 'idle', pulse: 0, flash: 0 };
    if (localTime < settleTime(row)) {
      const t = (localTime - considerTime(row)) / PULSE_LEN;
      return { state: 'considering', pulse: clamp(1 - t, 0, 1), flash: 0 };
    }
    // Settled
    if (st.taken) return { state: 'taken', pulse: 0, flash: 0 };
    const ft = (localTime - settleTime(row)) / FLASH_LEN;
    const flash = clamp(1 - ft, 0, 1);
    return { state: 'skipped', pulse: 0, flash };
  }

  // Counter: number of takens settled.
  let counter = 0;
  for (let k = 0; k < GREEDY_SCHEDULE.length; k++) {
    const st = GREEDY_SCHEDULE[k];
    if (st.taken && localTime >= settleTime(k)) counter++;
  }

  const cutoffX = timeX(G, displayedCutoff);

  return (
    <svg style={{ position: 'absolute', inset: 0 }}
         viewBox={`0 0 ${G.svgW} ${G.svgH}`}
         preserveAspectRatio="xMidYMid meet">
      <Timeline G={G} />
      {/* Cutoff vertical line — sweeps from t=0 right as picks accumulate */}
      <line x1={cutoffX} y1={G.tlBaseY + 4}
            x2={cutoffX} y2={rowY(G, ACTS.length - 1) + G.barH + 10}
            stroke="var(--amber-400)" strokeWidth={G.cutoffStrokeW}
            strokeDasharray="6 6"
            opacity={localTime > 0.04 * T ? 0.85 : 0}/>
      {/* Cutoff label "grense" floating above the line */}
      <text x={cutoffX + 6} y={G.tlBaseY - G.tickH - 24}
            fontFamily="var(--font-mono)" fontSize={G.axisFont}
            fill="var(--amber-300)"
            opacity={localTime > 0.04 * T ? 1 : 0}>
        grense = {Math.round(displayedCutoff)}
      </text>
      {/* Bars at their sorted-row positions */}
      {ACTS.map((a, i) => {
        const row = SORTED_ROW[i];
        const x1 = timeX(G, a.s);
        const x2 = timeX(G, a.f);
        const y = rowY(G, row);
        const { state, pulse, flash } = stateForRow(row);
        return (
          <ActivityBar key={i} G={G} acti={i}
                       x1={x1} x2={x2} y={y}
                       state={state}
                       considerPulse={pulse}
                       flash={flash}
                       opacity={state === 'skipped' ? 0.55 : 1}/>
        );
      })}
      <Counter G={G} value={counter}/>
    </svg>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 16 : 20, textAlign: 'center',
    }}>
      <FadeUp duration={0.5} delay={0.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.18em',
          textTransform: 'uppercase',
        }}>
        grådig på sluttid
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 36, color: 'var(--chalk-100)',
          maxWidth: G.payoffMax, lineHeight: 1.25,
        }}>
        Sorter etter slutt — plukk det første som ikke <span style={{ color: 'var(--amber-300)' }}>overlapper</span>.
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
          color: 'var(--amber-300)',
        }}>
        n log n + n
      </FadeUp>
      <FadeUp duration={0.5} delay={2.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)',
        }}>
        4 av 7 — og det er optimalt
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
