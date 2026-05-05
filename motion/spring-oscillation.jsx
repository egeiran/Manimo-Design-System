// Hooke's Law: Why a Spring Bobs — Manimo lesson scene.
// Generated from motion/spring-oscillation.spec.json. Standalone — no
// prerequisite scene.
//
// Beats (timed to single-track narration in motion/audio/spring-oscillation/):
//    0.00– 4.51  Manimo enters; hook question
//    4.51–14.19  Hooke's law: spring + mass + restoring force F = -kx
//   14.19–26.35  Newton + Hooke → ω₀ = √(k/m)
//   26.35–33.66  Period formula T = 2π√(m/k); two-column intuition
//   33.66–41.00  Takeaway
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.

const SCENE_DURATION = 41;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 4.51 */ 'Pull a mass on a spring, let go — what does it do, and how fast?',
  /*  4.51–14.19 */ "Stretch it by x and the spring pulls back with a force F equal to minus k times x — proportional to displacement, opposite in direction.",
  /* 14.19–26.35 */ "Newton's second law says force equals mass times acceleration. Combine that with Hooke's law and the natural frequency drops out: omega zero equals the square root of k over m.",
  /* 26.35–33.66 */ 'The period is two pi over omega zero — so T equals two pi times the square root of m over k.',
  /* 33.66–41.00 */ 'Stiffer spring, quicker beat; heavier mass, slower beat — and gravity never enters the formula.',
];

// Single continuous narration track — one ElevenLabs render covering the
// whole scene. Beat <Sprite start> values below match the audioStart
// offsets in motion/audio/spring-oscillation/manifest.json so visuals
// land on the corresponding sentence in the audio.
const NARRATION_AUDIO = 'audio/spring-oscillation/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 4 · harmonic motion"
      title="Hooke's Law: Why a Spring Bobs"
      duration={SCENE_DURATION}
      // Beat 1 is owned by SceneChrome's JourneyManimo: enter → hold → glide
      // to corner. No standalone intro Sprite needed.
      introEnd={4.51}
      introCaption="Pull a spring, release — what sets the rhythm?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={4.51} end={14.19}>
        <HookesLaw />
      </Sprite>

      <Sprite start={14.19} end={26.35}>
        <EquationOfMotion />
      </Sprite>

      <Sprite start={26.35} end={33.66}>
        <PeriodFormula />
      </Sprite>

      <Sprite start={33.66} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
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
  const portrait = usePortrait();
  // Geometry tuned per aspect: portrait shrinks the horizontal layout to fit
  // a 720-wide canvas while keeping every label legible.
  const G = portrait
    ? { wallX: 60, springStart: 78, springEnd: 472, massCx: 500, massSize: 50,
        eqX: 380, fLen: 56,
        vbW: 600, vbH: 320, yMid: 180, yHi: 162, yLo: 198,
        wallTop: 110, wallBot: 250,
        eqTop: 110, eqBot: 260, eqLabelY: 280,
        bracketY: 132, bracketTickTop: 126, bracketTickBot: 138, xLabelY: 122,
        forceY: 222, fLabelY: 214, fontXLabel: 22, fontMass: 18,
        fontEqLabel: 11, fontF: 22, fontCaption: 14,
        captionY: 305 }
    : { wallX: 80, springStart: 100, springEnd: 612, massCx: 640, massSize: 56,
        eqX: 520, fLen: 70,
        vbW: 880, vbH: 340, yMid: 200, yHi: 180, yLo: 220,
        wallTop: 120, wallBot: 280,
        eqTop: 120, eqBot: 290, eqLabelY: 310,
        bracketY: 146, bracketTickTop: 140, bracketTickBot: 152, xLabelY: 134,
        forceY: 246, fLabelY: 236, fontXLabel: 22, fontMass: 20,
        fontEqLabel: 11, fontF: 22, fontCaption: 14,
        captionY: 325 };

  const massLeft = G.massCx - G.massSize / 2;
  const massTop = G.yMid - G.massSize / 2;
  const massBottom = G.yMid + G.massSize / 2;
  const forceTipX = G.massCx - G.fLen;

  // Pre-compute zigzag spring path: alternates above (yHi) / below (yLo).
  const N = 8;
  const dx = (G.springEnd - G.springStart) / N;
  const pts = [`M ${G.springStart} ${G.yMid}`];
  for (let i = 1; i < N; i++) {
    const x = G.springStart + i * dx;
    const y = i % 2 === 1 ? G.yHi : G.yLo;
    pts.push(`L ${x.toFixed(1)} ${y}`);
  }
  pts.push(`L ${G.springEnd} ${G.yMid}`);
  const springD = pts.join(' ');

  // Wall hatch: 7 short ticks (portrait squeezes them slightly).
  const hatchPitch = portrait ? 18 : 22;
  const hatchOffsetY = portrait ? 16 : 18;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Wall: vertical post + hatching */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.wallX} y1={G.wallTop} x2={G.wallX} y2={G.wallBot}
                stroke="var(--chalk-300)" strokeWidth={2.5}/>
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <line key={i}
                  x1={G.wallX} y1={G.wallTop + 10 + i * hatchPitch}
                  x2={G.wallX - 18} y2={G.wallTop + 10 + hatchOffsetY + i * hatchPitch}
                  stroke="var(--chalk-300)" strokeWidth={1.2}/>
          ))}
        </SvgFadeIn>

        {/* Spring zigzag */}
        <TraceIn d={springD}
                 stroke="var(--amber-400)" strokeWidth={2.5}
                 fill="none"
                 duration={1.0} delay={0.4}/>

        {/* Mass: filled square */}
        <SvgFadeIn duration={0.4} delay={1.2}>
          <rect x={massLeft} y={massTop} width={G.massSize} height={G.massSize}
                fill="var(--amber-400)" opacity={0.92}
                stroke="var(--amber-300)" strokeWidth={1.5}
                rx={4}/>
          <text x={G.massCx} y={G.yMid + 6} textAnchor="middle"
                fill="var(--bg-canvas)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMass}>m</text>
        </SvgFadeIn>

        {/* Equilibrium dashed line at the mass-centre rest position */}
        <SvgFadeIn duration={0.35} delay={1.6}>
          <line x1={G.eqX} y1={G.eqTop} x2={G.eqX} y2={G.eqBot}
                stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="5 5"/>
          <text x={G.eqX} y={G.eqLabelY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEqLabel} letterSpacing="0.12em">EQUILIBRIUM</text>
        </SvgFadeIn>

        {/* x displacement bracket: equilibrium → mass centre */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <line x1={G.eqX} y1={G.bracketY} x2={G.massCx} y2={G.bracketY}
                stroke="var(--chalk-200)" strokeWidth={1.2}/>
          <line x1={G.eqX} y1={G.bracketTickTop} x2={G.eqX} y2={G.bracketTickBot}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <line x1={G.massCx} y1={G.bracketTickTop} x2={G.massCx} y2={G.bracketTickBot}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={(G.eqX + G.massCx) / 2} y={G.xLabelY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontXLabel}>x</text>
        </SvgFadeIn>

        {/* Restoring force arrow on the mass: pointing left */}
        <SvgFadeIn duration={0.4} delay={2.6}>
          <line x1={G.massCx} y1={G.forceY} x2={forceTipX} y2={G.forceY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${forceTipX} ${G.forceY} L ${forceTipX + 10} ${G.forceY - 6} L ${forceTipX + 10} ${G.forceY + 6} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>

        {/* F = -kx label, end-anchored just before the mass left edge */}
        <SvgFadeIn duration={0.35} delay={3.0}>
          <text x={massLeft - 4} y={G.fLabelY}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontF}
                textAnchor="end">F = −kx</text>
        </SvgFadeIn>

        {/* Caption beneath the diagram */}
        <SvgFadeIn duration={0.4} delay={4.2}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCaption} letterSpacing="0.02em">
            {portrait
              ? 'further you stretch, harder it pulls back'
              : 'the further you stretch it, the harder it pulls back'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Equation of motion ───────────────────────────────────────────
function EquationOfMotion() {
  const portrait = usePortrait();
  // Portrait stacks the chain into three rows (F=−kx, F=ma, ⇒ ma=−kx) so each
  // equation gets full canvas width. Landscape keeps them on a single row.
  const stepStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 30 : 32, letterSpacing: '0.02em',
  };
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 22 : 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        Newton meets Hooke
      </FadeUp>

      {portrait ? (
        // Stacked chain in portrait — each row centred.
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
          <FadeUp duration={0.5} delay={0.3} distance={10}
            style={{ ...stepStyle, color: 'var(--chalk-200)' }}>
            F = −kx
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
            ⇓
          </FadeUp>
          <FadeUp duration={0.5} delay={1.8} distance={10}
            style={{ ...stepStyle, color: 'var(--chalk-100)', fontSize: 36 }}>
            ma = −kx
          </FadeUp>
        </div>
      ) : (
        // Three-step chain on a single row: F=-kx, F=ma, ⇒ ma=-kx.
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
      )}

      <FadeUp duration={0.5} delay={2.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 15, color: 'var(--chalk-300)',
          textAlign: 'center', maxWidth: portrait ? '24ch' : 'none',
        }}>
        rearrange — the equation of simple harmonic motion
      </FadeUp>

      <FadeUp duration={0.6} delay={3.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 50 : 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        ω₀ = √(k/m)
      </FadeUp>

      <FadeUp duration={0.4} delay={4.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 13,
          color: 'var(--chalk-300)', marginTop: -12,
          textAlign: 'center', maxWidth: portrait ? '28ch' : 'none',
          lineHeight: 1.3,
        }}>
        the natural angular frequency of the spring–mass system
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Period formula ───────────────────────────────────────────────
function PeriodFormula() {
  const portrait = usePortrait();
  const labelStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 13,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };
  const arrowStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: 30, letterSpacing: '0.04em',
  };

  // Each "intuition" cell renders the same way in both aspects — only the
  // surrounding flex container's direction + divider geometry change.
  const StifferCell = (
    <FadeUp duration={0.5} delay={1.4} distance={12}
      style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>stiffer spring</div>
      <div style={{ ...arrowStyle, color: 'var(--chalk-100)' }}>k ↑  →  T ↓</div>
    </FadeUp>
  );
  const HeavierCell = (
    <FadeUp duration={0.5} delay={2.2} distance={12}
      style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>heavier mass</div>
      <div style={{ ...arrowStyle, color: 'var(--chalk-100)' }}>m ↑  →  T ↑</div>
    </FadeUp>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 26 : 32,
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
          fontSize: portrait ? 48 : 60, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        T = 2π√(m/k)
      </FadeUp>

      {portrait ? (
        // Stack stiffer/heavier vertically with a horizontal divider between.
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 22, paddingTop: 18, marginTop: 4,
                      borderTop: '1px solid rgba(232,220,193,0.12)' }}>
          {StifferCell}
          <div style={{ width: 80, height: 1, background: 'rgba(232,220,193,0.15)' }}/>
          {HeavierCell}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 110, alignItems: 'flex-start',
                      borderTop: '1px solid rgba(232,220,193,0.12)',
                      paddingTop: 22, marginTop: 6 }}>
          {StifferCell}
          <FadeUp duration={0.3} delay={1.6} distance={0}
            style={{ width: 1, height: 70, background: 'rgba(232,220,193,0.15)',
                     marginTop: 20 }}/>
          {HeavierCell}
        </div>
      )}
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function Takeaway() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '46ch',
          lineHeight: 1.3,
        }}>
        Stiffer spring → quicker beat. Heavier mass → slower beat.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textAlign: 'center', maxWidth: portrait ? '32ch' : 'none',
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
    <Stage
      width={1280} height={720}
      duration={SCENE_DURATION}
      background="#0c0a1f"
      loop={false}
    >
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
