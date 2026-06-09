// Binærsøk: halvér søkerommet — Manimo lesson scene.
// Chapter 11 of itgk (Rekursjon, sortering og søk). Why sorted lists are
// worth their weight: linear search walks cell by cell (11 checks to find 42),
// binary search kills half the search space per check (4 checks). Fifteen
// live cells, a walking pointer with a ticking counter, a pulsing midpoint,
// and whole halves of the row dying in one stroke. The payoff: a million
// sorted numbers ≈ twenty checks.
//
// Beats (placeholder timings — rewire-scene.js overwrites them after audio):
//    0–10     Manimo hook
//   10–26     Lineært — pointer walks, counter climbs to 11 (GENUINE MOTION)
//   26–45     Binært — four phases, halves die in one stroke (GENUINE MOTION)
//   45–58     Kontrast — 11 vs 4, and the log₂ scaling payoff
//   58–66     Takeaway
//
// Colour discipline:
//   chalk-100  cell values
//   chalk-300  dimmed/visited cells, hints
//   amber-400  found cell, mid pulse, primary accent
//   amber-300  counter, payoff
//   rose-400   discarded half (flash before dying)
//   teal-400   verdict «høyre/venstre» direction hints
//
// Milestones inside the motion beats are fractions of the sprite's actual
// duration so audio rewires keep the choreography aligned.

const SCENE_DURATION = 68;

const NARRATION = [
  /*  0–10  */ 'Du leter etter ett tall blant femten sorterte. Hvor mange forsøk trenger du? Femten? Eller holder det med fire?',
  /* 10–26  */ 'Den enkle måten starter til venstre og sjekker én og én: er det deg? Er det deg? Førtito står langt ute i lista, så telleren rekker å bli elleve før vi finner den.',
  /* 26–45  */ 'Binærsøk bruker at lista er sortert, og starter i midten. Tjueseks er for lite — da kan hele venstre halvdel kastes i ett jafs. Ny midte: førtisju er for stort, bort med toppen. Så trettiåtte — for lite. Og der står førtito. Fire forsøk.',
  /* 45–58  */ 'Elleve forsøk mot fire. Og forspranget vokser: dobler du lista, trenger binærsøket bare ett forsøk til. En million sorterte tall? Omtrent tjue forsøk. Det er derfor det lønner seg å holde lister sortert.',
  /* 58–66  */ 'Halvér søkerommet, igjen og igjen. Det er hele trikset — og grunnen til at sortering er gull verdt.',
];

const NARRATION_AUDIO = 'audio/binaersok-halvering/scene.mp3';

// ─── Data ──────────────────────────────────────────────────────────────────
const VALUES = [2, 5, 8, 11, 14, 17, 23, 26, 31, 38, 42, 47, 53, 59, 61];
const TARGET = 42;          // index 10
const LINEAR_CHECKS = 11;   // pointer walks indices 0..10

// Binary phases: search window [lo, hi], probe mid, verdict.
const PHASES = [
  { lo: 0, hi: 14, mid: 7, cmp: '26 < 42', dir: 'høyre', killLo: 0, killHi: 7 },
  { lo: 8, hi: 14, mid: 11, cmp: '47 > 42', dir: 'venstre', killLo: 11, killHi: 14 },
  { lo: 8, hi: 10, mid: 9, cmp: '38 < 42', dir: 'høyre', killLo: 8, killHi: 9 },
  { lo: 10, hi: 10, mid: 10, cmp: '42 = 42', dir: 'funnet', killLo: -1, killHi: -1 },
];

// ─── Layout ────────────────────────────────────────────────────────────────
function layoutGeom(portrait) {
  if (portrait) {
    return {
      x0: 32, rowY: 560, cell: 40, pitch: 44, valueFont: 13,
      badgeX: 32, badgeY: 460, counterX: 470, counterY: 460,
      checkX: 32, checkY: 680, hintY: 740,
      svgW: 720, svgH: 1280,
    };
  }
  return {
    x0: 104, rowY: 330, cell: 64, pitch: 72, valueFont: 20,
    badgeX: 104, badgeY: 232, counterX: 940, counterY: 232,
    checkX: 104, checkY: 470, hintY: 540,
    svgW: 1280, svgH: 720,
  };
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// ─── Pieces (DOM) ──────────────────────────────────────────────────────────
// state: 'normal' | 'visited' (linear walk) | 'dead' (binary discard)
//        | 'mid' (probing) | 'found'
function Cell({ G, i, state }) {
  const border =
    state === 'found' ? 'var(--amber-400)' :
    state === 'mid' ? 'var(--amber-400)' :
    'rgba(232,220,193,0.25)';
  const opacity = state === 'dead' ? 0.13 : state === 'visited' ? 0.38 : 1;
  return (
    <div style={{
      position: 'absolute', left: G.x0 + i * G.pitch, top: G.rowY,
      width: G.cell, height: G.cell, boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: `2px solid ${border}`, borderRadius: 9,
      background: state === 'found' ? 'rgba(244,184,96,0.18)'
                : state === 'mid' ? 'rgba(244,184,96,0.10)' : 'rgba(0,0,0,0.35)',
      fontFamily: 'var(--font-mono)', fontSize: G.valueFont, color: 'var(--chalk-100)',
      opacity, transition: 'opacity 0.45s linear, border-color 0.25s linear, background 0.25s linear',
    }}>
      {VALUES[i]}
    </div>
  );
}

function Pointer({ G, x, show }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: G.rowY - 26,
      width: 0, height: 0,
      borderLeft: '9px solid transparent', borderRight: '9px solid transparent',
      borderTop: '13px solid var(--amber-400)',
    }}/>
  );
}

function Badge({ x, y, label, value, accent = 'var(--amber-300)', big = false, show = true }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      display: 'flex', alignItems: 'baseline', gap: 12,
      padding: big ? '12px 22px' : '8px 16px', borderRadius: 10,
      border: `1.5px solid ${accent}`, background: 'rgba(0,0,0,0.45)',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: accent,
                     letterSpacing: '0.14em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: big ? 34 : 24,
                     color: 'var(--chalk-100)' }}>{value}</span>
    </div>
  );
}

// Bracket under the still-alive window [lo, hi].
function WindowBracket({ G, lo, hi, show }) {
  if (!show) return null;
  const x1 = G.x0 + lo * G.pitch;
  const w = (hi - lo) * G.pitch + G.cell;
  return (
    <div style={{
      position: 'absolute', left: x1, top: G.rowY + G.cell + 10, width: w, height: 10,
      borderLeft: '2px solid var(--amber-300)', borderRight: '2px solid var(--amber-300)',
      borderBottom: '2px solid var(--amber-300)', borderRadius: '0 0 8px 8px',
      transition: 'left 0.4s ease, width 0.4s ease', opacity: 0.85,
    }}/>
  );
}

function CheckLine({ G, text, dir, show }) {
  if (!show) return null;
  const dirColor = dir === 'funnet' ? 'var(--amber-300)' : 'var(--teal-400)';
  return (
    <div style={{
      position: 'absolute', left: G.checkX, top: G.checkY,
      display: 'flex', alignItems: 'baseline', gap: 14,
      fontFamily: 'var(--font-mono)', fontSize: 22,
    }}>
      <span style={{ color: 'var(--chalk-100)' }}>{text}</span>
      <span style={{ color: 'var(--chalk-300)' }}>→</span>
      <span style={{ color: dirColor }}>{dir === 'funnet' ? 'funnet ✓' : `let ${dir}`}</span>
    </div>
  );
}

// ─── Scene ─────────────────────────────────────────────────────────────────
function Scene() {
  return (
    <SceneChrome
      eyebrow="søk"
      title="Binærsøk: halvér søkerommet"
      duration={SCENE_DURATION}
      introEnd={8.1}
      introCaption="Finn tallet — på færrest mulig forsøk."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={8.1} end={20.83}>
        <LineartBeat/>
      </Sprite>

      <Sprite start={20.83} end={43.68}>
        <BinartBeat/>
      </Sprite>

      <Sprite start={43.68} end={59.9}>
        <KontrastBeat/>
      </Sprite>

      <Sprite start={59.9} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Lineært søk (GENUINE MOTION) ──────────────────────────────────
function LineartBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);

  // Walk starts after the row has settled, ends with a hold on the find.
  const walkStart = 0.22 * T;
  const walkEnd = 0.86 * T;
  const prog = clamp((localTime - walkStart) / (walkEnd - walkStart), 0, 1);
  const exact = prog * (LINEAR_CHECKS - 1);
  const idx = Math.min(Math.floor(exact), LINEAR_CHECKS - 1);
  const started = localTime >= walkStart;
  const foundNow = started && idx === LINEAR_CHECKS - 1 && prog >= 1;

  // Pointer glides between cells.
  const px = G.x0 + (started ? exact : 0) * G.pitch + G.cell / 2 - 9;

  return (
    <>
      <FadeUp duration={0.4} delay={0.3} distance={8}>
        <Badge x={G.badgeX} y={G.badgeY} label="mål" value={TARGET}/>
      </FadeUp>
      <Badge x={G.counterX} y={G.counterY} label="forsøk"
             value={started ? idx + 1 : 0} show={started}/>
      {VALUES.map((v, i) => (
        <Cell key={i} G={G} i={i}
              state={foundNow && i === 10 ? 'found' : (started && i < idx ? 'visited' : 'normal')}/>
      ))}
      <Pointer G={G} x={px} show={started && !foundNow}/>
      {foundNow && (
        <div style={{
          position: 'absolute', left: G.checkX, top: G.checkY,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-300)', lineHeight: 1.5 }}>
          Elleve forsøk — og i verste fall måtte vi innom alle femten.
        </div>
      )}
    </>
  );
}

// ─── Beat 3: Binærsøk (GENUINE MOTION) ─────────────────────────────────────
function BinartBeat() {
  const { localTime, duration } = useSprite();
  const portrait = usePortrait();
  const G = layoutGeom(portrait);
  const T = Math.max(duration - 1, 1);
  const at = (f) => f * T;

  // Four phases; each probes at probeAt and kills its half at killAt.
  const SCHED = [
    { probeAt: at(0.10), killAt: at(0.24) },
    { probeAt: at(0.32), killAt: at(0.46) },
    { probeAt: at(0.54), killAt: at(0.66) },
    { probeAt: at(0.74), killAt: null },
  ];
  const phaseIdx = SCHED.reduce((acc, s, k) => (localTime >= s.probeAt ? k : acc), -1);
  const phase = phaseIdx >= 0 ? PHASES[phaseIdx] : null;

  // A cell is dead once its phase's kill moment has passed.
  const deadAt = (i) => {
    for (let k = 0; k < PHASES.length; k++) {
      const p = PHASES[k], s = SCHED[k];
      if (s.killAt != null && i >= p.killLo && i <= p.killHi && localTime >= s.killAt) return true;
    }
    return false;
  };
  const found = phaseIdx === 3;

  return (
    <>
      <FadeUp duration={0.3} delay={0} distance={6}>
        <Badge x={G.badgeX} y={G.badgeY} label="mål" value={TARGET}/>
      </FadeUp>
      <Badge x={G.counterX} y={G.counterY} label="forsøk"
             value={phaseIdx + 1} show={phaseIdx >= 0}/>
      {VALUES.map((v, i) => {
        let state = 'normal';
        if (deadAt(i)) state = 'dead';
        else if (found && i === 10) state = 'found';
        else if (phase && i === phase.mid) state = 'mid';
        return <Cell key={i} G={G} i={i} state={state}/>;
      })}
      {phase && phase.mid != null && !found && (
        <Pointer G={G} x={G.x0 + phase.mid * G.pitch + G.cell / 2 - 9} show={true}/>
      )}
      <WindowBracket G={G} lo={phase ? phase.lo : 0} hi={phase ? phase.hi : 14} show={phaseIdx >= 0}/>
      {phase && (
        <CheckLine G={G} text={phase.cmp} dir={phase.dir} show={true}/>
      )}
      {phaseIdx >= 1 && !found && (
        <div style={{
          position: 'absolute', left: G.checkX, top: G.hintY,
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 15,
          color: 'var(--chalk-300)' }}>
          Én sjekk — <span style={{ color: 'var(--rose-300)' }}>en hel halvdel borte.</span>
        </div>
      )}
    </>
  );
}

// ─── Beat 4: Kontrast ──────────────────────────────────────────────────────
function KontrastBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 26 : 34, textAlign: 'center',
    }}>
      <div style={{ display: 'flex', gap: portrait ? 22 : 44 }}>
        <FadeUp duration={0.5} delay={0.4} distance={12}
          style={{ padding: portrait ? '18px 26px' : '24px 36px', borderRadius: 14,
                   border: '1.5px solid rgba(232,220,193,0.30)', background: 'rgba(0,0,0,0.40)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--chalk-300)',
                        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
            lineært
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 40 : 54,
                        color: 'var(--chalk-200)' }}>11</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--chalk-300)' }}>forsøk</div>
        </FadeUp>
        <FadeUp duration={0.5} delay={0.9} distance={12}
          style={{ padding: portrait ? '18px 26px' : '24px 36px', borderRadius: 14,
                   border: '1.5px solid var(--amber-400)', background: 'rgba(244,184,96,0.08)' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--amber-300)',
                        letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>
            binært
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 40 : 54,
                        color: 'var(--amber-300)' }}>4</div>
          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'var(--chalk-300)' }}>forsøk</div>
        </FadeUp>
      </div>
      <FadeUp duration={0.55} delay={3.6} distance={10}
        style={{ fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
                 color: 'var(--chalk-200)', maxWidth: portrait ? '30ch' : '46ch', lineHeight: 1.6 }}>
        Dobbelt så lang liste → bare <span style={{ color: 'var(--amber-300)' }}>ett forsøk til</span>.
      </FadeUp>
      <FadeUp duration={0.55} delay={6.2} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 16 : 20,
                 color: 'var(--amber-300)' }}>
        1 000 000 tall → ~20 forsøk
      </FadeUp>
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
        binærsøk
      </FadeUp>
      <FadeUp duration={0.7} delay={0.3} distance={16}
        style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic',
                 fontSize: portrait ? 28 : 40, color: 'var(--chalk-100)',
                 maxWidth: portrait ? '20ch' : '30ch', lineHeight: 1.25 }}>
        Halvér søkerommet — <span style={{ color: 'var(--amber-300)' }}>igjen og igjen.</span>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.4} distance={10}
        style={{ fontFamily: 'var(--font-mono)', fontSize: portrait ? 18 : 22,
                 color: 'var(--amber-300)' }}>
        15 → 7 → 3 → 1
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
