// Hoop vs Disk: Why a Disk Wins — Manimo lesson scene.
// Generated from motion/hoop-disk.spec.json. Builds on Scene 2 (moment of inertia).
//
// Beats:
//   0.2– 3.2  Manimo enters; hook question
//   3.2– 9.5  Ramp setup: hoop and disk at top, labels for their I
//   9.5–17.0  Energy conservation derivation → general v formula
//  17.0–22.5  Verdict: hoop v = √(gh), disk v = √(4gh/3), disk wins ≈15%
//  22.5–26.0  Takeaway caption
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.

const SCENE_DURATION = 26;

// Narration script (one sentence per beat — source of truth for TTS/subtitles)
const NARRATION = [
  /* 0.2– 3.2 */ 'Two wheels — same mass, same radius, same hill. Which one reaches the bottom first?',
  /* 3.2– 9.5 */ 'We release a hoop and a solid disk from rest at the top of an inclined ramp. Both roll without slipping.',
  /* 9.5–17.0 */ 'Energy conservation: the gravitational potential mgh becomes kinetic energy — split between translation ½Mv² and rotation ½Iω².',
  /* 17.0–22.5*/ 'Plug in: the disk gives v = √(4gh/3), the hoop gives v = √(gh). The disk is always faster — about 15% quicker at the bottom.',
  /* 22.5–26.0*/ 'Less rotational inertia leaves more energy for translation — that is why a solid disk beats a hoop.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 3 · rolling motion"
      title="Hoop vs Disk: Why a Disk Wins"
      duration={SCENE_DURATION}
    >
      <Sprite start={0.2} end={3.2}>
        <ManimoBubbleIntro />
      </Sprite>

      <Sprite start={3.2} end={9.5}>
        <RampSetup />
      </Sprite>

      <Sprite start={9.5} end={17.0}>
        <EnergyDerivation />
      </Sprite>

      <Sprite start={17.0} end={22.5}>
        <Verdict />
      </Sprite>

      <Sprite start={22.5} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Intro ────────────────────────────────────────────────────────
function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '40%',
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
        Two wheels, same mass, same radius — which one wins?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Ramp setup ──────────────────────────────────────────────────
// Right triangle ramp:
//   top-left   (80, 80)   — top of hypotenuse
//   bottom-left(80, 340)  — corner
//   bottom-right(700,340) — end of base
// Hypotenuse direction = (620, 260), length ≈ 672.3
// Outward unit normal (into the air above ramp) ≈ (0.3868, -0.9226)
// Wheels are tangent to the hypotenuse: center = surface + R * normal
function RampSetup() {
  const R = 24;
  const NX = 0.3868, NY = -0.9226;

  function onRamp(t) {
    const sx = 80 + t * 620;
    const sy = 80 + t * 260;
    return { cx: sx + R * NX, cy: sy + R * NY };
  }

  const hoop = onRamp(0.04);
  const disk = onRamp(0.13);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={800} height={400} viewBox="0 0 800 400" style={{ overflow: 'visible' }}>
        {/* Ramp triangle — hypotenuse drawn first, then ground, then height bracket */}
        <TraceIn d="M 80 80 L 700 340"
                 stroke="var(--chalk-200)" strokeWidth={2.5}
                 duration={0.9} delay={0.0}/>
        <TraceIn d="M 80 340 L 700 340"
                 stroke="var(--chalk-300)" strokeWidth={2}
                 duration={0.7} delay={0.6}/>

        {/* Height marker — dashed vertical guide + 'h' label */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <line x1={62} y1={80} x2={62} y2={340}
                stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="4 4"/>
          <line x1={56} y1={80} x2={68} y2={80}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={56} y1={340} x2={68} y2={340}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={42} y={216} fill="var(--chalk-200)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize="22" textAnchor="middle">h</text>
        </SvgFadeIn>

        {/* Hoop — ring outline at top of ramp */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <circle cx={hoop.cx} cy={hoop.cy} r={R}
                  fill="none" stroke="var(--amber-400)" strokeWidth={3}/>
          {/* tiny axle dot to make it read as a wheel */}
          <circle cx={hoop.cx} cy={hoop.cy} r={2.5} fill="var(--amber-400)"/>
        </SvgFadeIn>

        {/* Disk — filled circle, slightly further down the ramp */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <circle cx={disk.cx} cy={disk.cy} r={R}
                  fill="var(--rose-400)" opacity={0.85}
                  stroke="var(--rose-400)" strokeWidth={1}/>
          <circle cx={disk.cx} cy={disk.cy} r={2.5} fill="var(--bg-canvas)"/>
        </SvgFadeIn>

        {/* Side-stack labels — Hoop / Disk with their I */}
        <SvgFadeIn duration={0.4} delay={3.2}>
          <text x={300} y={84} fill="var(--amber-300)"
                fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.15em">HOOP</text>
          <text x={300} y={112} fill="var(--amber-300)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize="24">I = MR²</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={3.8}>
          <text x={300} y={166} fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.15em">DISK</text>
          <text x={300} y={194} fill="var(--rose-300)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize="24">I = ½MR²</text>
        </SvgFadeIn>

        {/* "rolls without slipping" tag */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={500} y={310} fill="var(--chalk-300)"
                fontFamily="var(--font-sans)" fontSize="13"
                letterSpacing="0.04em">rolls without slipping</text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Energy conservation derivation ──────────────────────────────
function EnergyDerivation() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    }}>
      <FadeUp duration={0.5} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Energy conservation
      </FadeUp>

      <FadeUp duration={0.6} delay={0.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 48, color: 'var(--chalk-100)', letterSpacing: '0.02em',
        }}>
        Mgh = ½Mv² + ½Iω²
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 22, color: 'var(--chalk-300)',
        }}>
        rolling without slipping  →  v = ωR
      </FadeUp>

      <FadeUp duration={0.6} delay={4.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        v = √( 2gh / (1 + I/MR²) )
      </FadeUp>

      <FadeUp duration={0.4} delay={5.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--chalk-300)', marginTop: -12,
        }}>
        smaller I/MR² → faster bottom-of-ramp speed
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Verdict — Hoop vs Disk ──────────────────────────────────────
function Verdict() {
  const labelStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 13,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };
  const formulaStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 52,
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        same mass, same radius, same h
      </FadeUp>

      <div style={{ display: 'flex', gap: 96, alignItems: 'flex-start' }}>
        {/* Hoop */}
        <FadeUp duration={0.5} delay={0.3} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>Hoop</div>
          <div style={{ ...formulaStyle, color: 'var(--chalk-200)' }}>√(gh)</div>
        </FadeUp>

        {/* Divider */}
        <FadeUp duration={0.3} delay={0.5} distance={0}
          style={{ width: 1, height: 90, background: 'rgba(232,220,193,0.15)', marginTop: 28 }}/>

        {/* Disk */}
        <FadeUp duration={0.5} delay={1.0} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...labelStyle, color: 'var(--amber-300)' }}>Disk</div>
          <div style={{ ...formulaStyle, color: 'var(--amber-300)' }}>√(4gh/3)</div>
        </FadeUp>
      </div>

      <FadeUp duration={0.6} delay={2.5} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22,
          color: 'var(--chalk-100)', textAlign: 'center', maxWidth: '52ch',
          borderTop: '1px solid rgba(232,220,193,0.12)',
          paddingTop: 18,
        }}>
        Disk wins by ≈15% — every time.
      </FadeUp>
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
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 28,
          color: 'var(--chalk-100)', maxWidth: '40ch',
        }}>
        Less rotational inertia → more translational speed.
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
