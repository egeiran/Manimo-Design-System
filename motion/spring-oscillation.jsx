// Hooke's Law: Why a Spring Bobs — Manimo lesson scene.
// Generated from motion/spring-oscillation.spec.json. Standalone — no
// prerequisite scene.
//
// Beats:
//   0.2– 3.5  Manimo enters; hook question
//   3.5– 9.5  Hooke's law: spring + mass + restoring force F = -kx
//   9.5–16.0  Newton + Hooke → ω₀ = √(k/m)
//  16.0–21.5  Period formula T = 2π√(m/k); two-column intuition
//  21.5–26.0  Takeaway
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.

const SCENE_DURATION = 26;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /* 0.2– 3.5 */ 'Pull a mass on a spring, let go — what does it do, and how fast?',
  /* 3.5– 9.5 */ "Stretch it by x and the spring pulls back with a force F equal to minus k times x — proportional to displacement, opposite in direction.",
  /* 9.5–16.0 */ "Newton says ma equals F. Combine with Hooke's law and the natural frequency falls out: omega-zero equals the square root of k over m.",
  /*16.0–21.5 */ 'Period is two pi over omega-zero — so T equals two pi times the square root of m over k.',
  /*21.5–26.0 */ 'Stiffer spring, quicker beat; heavier mass, slower beat — and gravity never enters the formula.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 4 · harmonic motion"
      title="Hooke's Law: Why a Spring Bobs"
      duration={SCENE_DURATION}
    >
      <Sprite start={0.2} end={3.5}>
        <ManimoBubbleIntro />
      </Sprite>

      <Sprite start={3.5} end={9.5}>
        <HookesLaw />
      </Sprite>

      <Sprite start={9.5} end={16.0}>
        <EquationOfMotion />
      </Sprite>

      <Sprite start={16.0} end={21.5}>
        <PeriodFormula />
      </Sprite>

      <Sprite start={21.5} end={SCENE_DURATION}>
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
        Pull a spring, release — what sets the rhythm?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Hooke's law diagram ──────────────────────────────────────────
// Geometry (in 880×340 viewBox):
//   Wall: vertical line at x=80, hatched.
//   Equilibrium line: dashed vertical at x=520.
//   Mass (displaced right by 80): centred at x=640, y=200, 56×56 square.
//   Spring zigzag from wall (x=100, y=200) to mass-left (x=612, y=200) —
//   that's a 512px run, broken into 9 zig endpoints (8 segments).
function HookesLaw() {
  // Pre-compute zigzag spring path: alternates above (y=180) / below (y=220).
  const springStart = 100;
  const springEnd = 612;        // left edge of mass square
  const yMid = 200, yHi = 180, yLo = 220;
  const N = 8;                   // segments
  const dx = (springEnd - springStart) / N;
  const pts = [];
  pts.push(`M ${springStart} ${yMid}`);
  for (let i = 1; i < N; i++) {
    const x = springStart + i * dx;
    const y = i % 2 === 1 ? yHi : yLo;
    pts.push(`L ${x.toFixed(1)} ${y}`);
  }
  pts.push(`L ${springEnd} ${yMid}`);
  const springD = pts.join(' ');

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={880} height={340} viewBox="0 0 880 340" style={{ overflow: 'visible' }}>
        {/* Wall: vertical post + hatching */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={80} y1={120} x2={80} y2={280}
                stroke="var(--chalk-300)" strokeWidth={2.5}/>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <line key={i}
                  x1={80} y1={130 + i * 22}
                  x2={62} y2={148 + i * 22}
                  stroke="var(--chalk-300)" strokeWidth={1.2}/>
          ))}
        </SvgFadeIn>

        {/* Spring zigzag */}
        <TraceIn d={springD}
                 stroke="var(--amber-400)" strokeWidth={2.5}
                 fill="none"
                 duration={1.0} delay={0.4}/>

        {/* Mass: filled square, centred at (640, 200), 56×56 */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <rect x={612} y={172} width={56} height={56}
                fill="var(--amber-400)" opacity={0.92}
                stroke="var(--amber-300)" strokeWidth={1.5}
                rx={4}/>
          <text x={640} y={206} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20">m</text>
        </SvgFadeIn>

        {/* Equilibrium dashed line at x=520 (mass centre when at rest) */}
        <SvgFadeIn duration={0.35} delay={1.6}>
          <line x1={520} y1={120} x2={520} y2={290}
                stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="5 5"/>
          <text x={520} y={310} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize="11" letterSpacing="0.12em">EQUILIBRIUM</text>
        </SvgFadeIn>

        {/* x displacement bracket: from equilibrium (520) to mass-centre (640) */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <line x1={520} y1={146} x2={640} y2={146}
                stroke="var(--chalk-200)" strokeWidth={1.2}/>
          <line x1={520} y1={140} x2={520} y2={152}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <line x1={640} y1={140} x2={640} y2={152}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={580} y={134} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22">x</text>
        </SvgFadeIn>

        {/* Restoring force arrow on the mass: pointing left, length 70 */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <line x1={640} y1={246} x2={570} y2={246}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          {/* arrow head */}
          <path d="M 570 246 L 580 240 L 580 252 Z"
                fill="var(--rose-400)"/>
        </SvgFadeIn>

        {/* F = -kx label above the arrow */}
        <SvgFadeIn duration={0.35} delay={3.0}>
          <text x={605} y={236}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22"
                textAnchor="middle">F = −kx</text>
        </SvgFadeIn>

        {/* Caption beneath the diagram */}
        <SvgFadeIn duration={0.4} delay={4.2}>
          <text x={440} y={325} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize="14" letterSpacing="0.02em">
            the further you stretch it, the harder it pulls back
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Equation of motion ───────────────────────────────────────────
function EquationOfMotion() {
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: 32, letterSpacing: '0.02em',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Newton meets Hooke
      </FadeUp>

      {/* Three-step chain: F=-kx,  F=ma,  ma=-kx */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 38 }}>
        <FadeUp duration={0.5} delay={0.3} distance={10}
          style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
          F = −kx
        </FadeUp>
        <FadeUp duration={0.4} delay={1.0} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 18,
            color: 'var(--chalk-300)',
          }}>
          +
        </FadeUp>
        <FadeUp duration={0.5} delay={1.0} distance={10}
          style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
          F = ma
        </FadeUp>
        <FadeUp duration={0.4} delay={1.7} distance={6}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 18,
            color: 'var(--chalk-300)',
          }}>
          ⇒
        </FadeUp>
        <FadeUp duration={0.5} delay={1.8} distance={10}
          style={{ ...stepStyle, color: 'var(--chalk-100)', fontSize: 36 }}>
          ma = −kx
        </FadeUp>
      </div>

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--chalk-300)',
        }}>
        rearrange — the equation of simple harmonic motion
      </FadeUp>

      <FadeUp duration={0.6} delay={3.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        ω₀ = √(k/m)
      </FadeUp>

      <FadeUp duration={0.4} delay={4.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', marginTop: -12,
        }}>
        the natural angular frequency of the spring–mass system
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
        period of one full bob
      </FadeUp>

      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 60, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        T = 2π√(m/k)
      </FadeUp>

      <div style={{ display: 'flex', gap: 110, alignItems: 'flex-start',
                    borderTop: '1px solid rgba(232,220,193,0.12)',
                    paddingTop: 22, marginTop: 6 }}>
        <FadeUp duration={0.5} delay={1.4} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>stiffer spring</div>
          <div style={{ ...arrowStyle, color: 'var(--chalk-100)' }}>k ↑  →  T ↓</div>
        </FadeUp>

        <FadeUp duration={0.3} delay={1.6} distance={0}
          style={{ width: 1, height: 70, background: 'rgba(232,220,193,0.15)',
                   marginTop: 20 }}/>

        <FadeUp duration={0.5} delay={2.2} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>heavier mass</div>
          <div style={{ ...arrowStyle, color: 'var(--chalk-100)' }}>m ↑  →  T ↑</div>
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
        Stiffer spring → quicker beat. Heavier mass → slower beat.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
        }}>
        (no g in sight — pure spring and inertia)
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
