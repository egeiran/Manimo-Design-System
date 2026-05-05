// The Simple Pendulum: Why Mass Doesn't Matter — Manimo lesson scene.
// Generated from motion/pendulum.spec.json. Builds on Scene 4 (spring oscillation).
//
// Beats (timings sized for narration audio — fallback estimated, no scene.mp3 yet):
//    0.00– 6.44  Manimo enters; hook question
//    6.44–19.39  Pendulum diagram; gravity decomposes; restoring force = −mg sin θ
//   19.39–36.19  Small-angle approx; equation of motion; ω₀ = √(g/L)
//   36.19–45.49  Period T = 2π√(L/g); the mass disappears
//   45.49–53.00  Takeaway
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.
//   • Re-run `npm run audio pendulum` once ELEVENLABS_API_KEY works to
//     overwrite manifest.json with real timings and add scene.mp3.

const SCENE_DURATION = 53;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 6.44 */ 'A weight on a string — pull it sideways and let go. What sets the rhythm of its swing?',
  /*  6.44–19.39 */ 'Hang a mass from a string of length L. Pull it to angle theta. Gravity pulls straight down, but only the tangential component, minus m g sine theta, restores it toward vertical.',
  /* 19.39–36.19 */ 'For small swings, sine theta is approximately theta. The equation of motion becomes the second derivative of theta plus g over L theta equals zero — exactly the spring equation, with omega zero equal to the square root of g over L.',
  /* 36.19–45.49 */ 'The period is two pi over omega zero — so T equals two pi times the square root of L over g. Notice what is missing: the mass.',
  /* 45.49–53.00 */ 'Heavier bob, lighter bob — same length swings to the same beat. Gravity sets the metronome.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 5 · pendulum motion"
      title="The Simple Pendulum: Why Mass Doesn't Matter"
      duration={SCENE_DURATION}
    >
      <Sprite start={0} end={6.44}>
        <ManimoBubbleIntro />
      </Sprite>

      <Sprite start={6.44} end={19.39}>
        <PendulumDiagram />
      </Sprite>

      <Sprite start={19.39} end={36.19}>
        <SmallAngle />
      </Sprite>

      <Sprite start={36.19} end={45.49}>
        <PeriodFormula />
      </Sprite>

      <Sprite start={45.49} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '42%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 20,
    }}>
      <svg width={160} height={160} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true} />
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)', fontSize: 26, fontStyle: 'italic',
          color: 'var(--chalk-100)', maxWidth: '34ch',
        }}>
        Pull a weight on a string — what sets the rhythm?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Pendulum diagram ─────────────────────────────────────────────
// Geometry (in 880×420 viewBox):
//   Pivot at (440, 50). Vertical reference dashed to (440, 350).
//   Angle θ = 30° to the right of vertical.
//   String length L = 240 → bob centre at (440 + 240·sin30°, 50 + 240·cos30°)
//                         = (560, 257.85). Bob radius = 18.
//   Gravity arrow: from bob bottom straight down 70 px.
//   Tangential restoring arrow: from bob along (−cos θ, sin θ) = (−0.866, 0.5),
//   length 60 — perpendicular to the string, pointing back toward vertical.
function PendulumDiagram() {
  const pivX = 440, pivY = 50;
  const L = 240;
  const sinT = 0.5, cosT = 0.8660;          // θ = 30°
  const bobX = pivX + L * sinT;             // 560
  const bobY = pivY + L * cosT;             // 257.85
  const bobR = 18;

  // Tangential (restoring) arrow — perpendicular to string, direction (−cos θ, sin θ).
  const tDx = -cosT, tDy = sinT;
  const tStartX = bobX + bobR * tDx;        // 544.4
  const tStartY = bobY + bobR * tDy;        // 266.85
  const tEndX = tStartX + 60 * tDx;         // 492.4
  const tEndY = tStartY + 60 * tDy;         // 296.85

  // Gravity arrow — straight down from bob bottom.
  const gStartX = bobX, gStartY = bobY + bobR;        // (560, 275.85)
  const gEndX = bobX,   gEndY = bobY + bobR + 70;     // (560, 345.85)

  // Angle arc — radius 50 from vertical to string at pivot.
  // Sweep from (pivX, pivY+50) to (pivX + 50·sinT, pivY + 50·cosT) = (465, 93.3)
  const arcEndX = pivX + 50 * sinT;
  const arcEndY = pivY + 50 * cosT;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={880} height={420} viewBox="0 0 880 420" style={{ overflow: 'visible' }}>
        {/* Pivot bracket — small horizontal bar with hatching above */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={pivX - 40} y1={pivY} x2={pivX + 40} y2={pivY}
                stroke="var(--chalk-300)" strokeWidth={2.5}/>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <line key={i}
                  x1={pivX - 36 + i * 14} y1={pivY}
                  x2={pivX - 50 + i * 14} y2={pivY - 14}
                  stroke="var(--chalk-300)" strokeWidth={1.2}/>
          ))}
          <circle cx={pivX} cy={pivY} r={3} fill="var(--chalk-200)"/>
        </SvgFadeIn>

        {/* Vertical reference (dashed) */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={pivX} y1={pivY} x2={pivX} y2={pivY + 290}
                stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="5 5"/>
        </SvgFadeIn>

        {/* String — pivot to bob */}
        <TraceIn d={`M ${pivX} ${pivY} L ${bobX.toFixed(2)} ${bobY.toFixed(2)}`}
                 stroke="var(--amber-400)" strokeWidth={2.5}
                 fill="none"
                 duration={0.9} delay={0.8}/>

        {/* Angle arc + θ label */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <path d={`M ${pivX} ${pivY + 50} A 50 50 0 0 1 ${arcEndX.toFixed(2)} ${arcEndY.toFixed(2)}`}
                fill="none" stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={pivX + 17} y={pivY + 65}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22">θ</text>
        </SvgFadeIn>

        {/* L label at midpoint of string, offset right of string */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <text x={(pivX + bobX) / 2 + 18} y={(pivY + bobY) / 2}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22">L</text>
        </SvgFadeIn>

        {/* Bob */}
        <SvgFadeIn duration={0.4} delay={2.0}>
          <circle cx={bobX} cy={bobY} r={bobR}
                  fill="var(--amber-400)" opacity={0.92}
                  stroke="var(--amber-300)" strokeWidth={1.5}/>
          <text x={bobX} y={bobY + 6} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="18">m</text>
        </SvgFadeIn>

        {/* Gravity arrow — straight down from bob, with mg label */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <line x1={gStartX} y1={gStartY} x2={gEndX} y2={gEndY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${gEndX} ${gEndY} L ${gEndX - 6} ${gEndY - 10} L ${gEndX + 6} ${gEndY - 10} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={3.4}>
          <text x={gEndX + 12} y={gEndY + 4}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22">mg</text>
        </SvgFadeIn>

        {/* Tangential restoring arrow + label */}
        <SvgFadeIn duration={0.4} delay={4.2}>
          <line x1={tStartX} y1={tStartY} x2={tEndX} y2={tEndY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          {/* arrowhead at (tEndX, tEndY) — wings rotated 90° from arrow direction */}
          <path d={`M ${tEndX.toFixed(2)} ${tEndY.toFixed(2)}
                    L ${(tEndX - 10 * tDx + 5 * tDy).toFixed(2)} ${(tEndY - 10 * tDy - 5 * tDx).toFixed(2)}
                    L ${(tEndX - 10 * tDx - 5 * tDy).toFixed(2)} ${(tEndY - 10 * tDy + 5 * tDx).toFixed(2)} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={4.6}>
          <text x={tEndX - 8} y={tEndY + 22}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20"
                textAnchor="end">−mg sin θ</text>
        </SvgFadeIn>

        {/* Caption beneath the diagram */}
        <SvgFadeIn duration={0.4} delay={6.0}>
          <text x={440} y={400} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize="14" letterSpacing="0.02em">
            only the tangential component restores it toward vertical
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Small-angle approximation ────────────────────────────────────
function SmallAngle() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        small-angle approximation
      </FadeUp>

      <FadeUp duration={0.5} delay={0.3} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 38, color: 'var(--chalk-200)', letterSpacing: '0.02em',
        }}>
        sin θ ≈ θ
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 44, color: 'var(--chalk-100)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        d²θ/dt² + (g/L) θ = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={3.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--chalk-300)',
        }}>
        same shape as the spring equation
      </FadeUp>

      <FadeUp duration={0.6} delay={4.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        ω₀ = √(g/L)
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Period formula ───────────────────────────────────────────────
function PeriodFormula() {
  const labelStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 13,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };
  const arrowStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: 30, letterSpacing: '0.04em',
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        period of one full swing
      </FadeUp>

      <FadeUp duration={0.6} delay={0.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 60, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        T = 2π√(L/g)
      </FadeUp>

      <div style={{ display: 'flex', gap: 110, alignItems: 'flex-start',
                    borderTop: '1px solid rgba(232,220,193,0.12)',
                    paddingTop: 22, marginTop: 6 }}>
        <FadeUp duration={0.5} delay={1.6} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>longer string</div>
          <div style={{ ...arrowStyle, color: 'var(--chalk-100)' }}>L ↑  →  T ↑</div>
        </FadeUp>

        <FadeUp duration={0.3} delay={1.8} distance={0}
          style={{ width: 1, height: 70, background: 'rgba(232,220,193,0.15)',
                   marginTop: 20 }}/>

        <FadeUp duration={0.5} delay={2.4} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>stronger gravity</div>
          <div style={{ ...arrowStyle, color: 'var(--chalk-100)' }}>g ↑  →  T ↓</div>
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function Takeaway() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28,
          color: 'var(--chalk-100)', maxWidth: '46ch',
        }}>
        Heavier bob, lighter bob — same length, same beat.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        (no m in the formula — gravity sets the metronome)
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f">
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
