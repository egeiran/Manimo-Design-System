// The Simple Pendulum: Why Mass Doesn't Matter — Manimo lesson scene.
// Generated from motion/pendulum.spec.json. Builds on Scene 4 (spring oscillation).
//
// Beats (timed to single-track narration in motion/audio/pendulum/):
//    0.00– 6.19  Manimo enters; hook question
//    6.19–18.18  Pendulum diagram; gravity decomposes; restoring force = −mg sin θ
//   18.18–33.44  Small-angle approx; equation of motion; ω₀ = √(g/L)
//   33.44–42.95  Period T = 2π√(L/g); the mass disappears
//   42.95–50.00  Takeaway
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.

const SCENE_DURATION = 51;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 6.19 */ 'A weight on a string — pull it sideways and let go. What sets the rhythm of its swing?',
  /*  6.19–18.18 */ 'Hang a mass from a string of length L. Pull it to angle theta. Gravity pulls straight down, but only the tangential component, minus m g sine theta, restores it toward vertical.',
  /* 18.18–33.44 */ 'For small swings, sine theta is approximately theta. The equation of motion becomes the second derivative of theta plus g over L theta equals zero — exactly the spring equation, with omega zero equal to the square root of g over L.',
  /* 33.44–42.95 */ 'The period is two pi over omega zero — so T equals two pi times the square root of L over g. Notice what is missing: the mass.',
  /* 42.95–50.00 */ 'Heavier bob, lighter bob — same length swings to the same beat. Gravity sets the metronome.',
];

// Single continuous narration track aligned to manifest.json offsets.
const NARRATION_AUDIO = 'audio/pendulum/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="pendulum motion"
      title="The Simple Pendulum: Why Mass Doesn't Matter"
      duration={SCENE_DURATION}
      // Beat 1 is owned by SceneChrome's JourneyManimo: she enters at centre,
      // holds while the caption reads, then glides to the bottom-left corner
      // where she stays. No separate intro Sprite needed.
      introEnd={6.19}
      introCaption="Pull a weight on a string — what sets the rhythm?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.19} end={18.18}>
        <PendulumDiagram />
      </Sprite>

      <Sprite start={18.18} end={33.44}>
        <SmallAngle />
      </Sprite>

      <Sprite start={33.44} end={42.95}>
        <PeriodFormula />
      </Sprite>

      <Sprite start={42.95} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 2: Pendulum diagram ─────────────────────────────────────────────
// Geometry (in 880×420 viewBox):
//   Pivot at (440, 50). Vertical reference dashed to (440, 340).
//   String length L = 240. Bob radius 18.
//   At rest, bob hangs straight down at (440, 290).
//   The bob is "pulled" from vertical to θ = 30° between delay 1.2 and 2.6
//   to literalise "Pull it to angle theta" in the narration. The force
//   diagram (gravity, tangent, arc, labels) appears after the pull settles.
function PendulumDiagram() {
  const portrait = usePortrait();
  // Portrait gets a taller, narrower viewBox with a longer string — there's
  // vertical room to spare, and the "pull-it-and-let-it-fall" geometry reads
  // best when the string actually feels long.
  const pivX = portrait ? 320 : 440;
  const pivY = portrait ? 60  : 50;
  const L    = portrait ? 420 : 240;
  const ARC_R = portrait ? 60 : 50;
  const VB_W = portrait ? 640 : 880;
  const VB_H = portrait ? 720 : 420;
  const VERT_REF = portrait ? 540 : 290; // length of dashed vertical guide
  const HOLD_ANGLE = 30;
  const PULL_START = 1.2, PULL_END = 2.6;

  const { localTime } = useSprite();
  const pullT = clamp((localTime - PULL_START) / (PULL_END - PULL_START), 0, 1);
  const easedPull = Easing.easeInOutCubic(pullT);
  const angleDeg = HOLD_ANGLE * easedPull;
  const rad = angleDeg * Math.PI / 180;
  const sinT = Math.sin(rad), cosT = Math.cos(rad);
  const bobX = pivX + L * sinT;
  const bobY = pivY + L * cosT;
  const bobR = portrait ? 22 : 18;

  // Static geometry for force vectors — they only appear after the pull
  // completes (delay 3.0+), so they can safely use the held angle (30°).
  const HOLD_RAD = HOLD_ANGLE * Math.PI / 180;
  const sH = Math.sin(HOLD_RAD), cH = Math.cos(HOLD_RAD);
  const holdBobX = pivX + L * sH;
  const holdBobY = pivY + L * cH;
  const tDx = -cH, tDy = sH;
  const tStartX = holdBobX + bobR * tDx;
  const tStartY = holdBobY + bobR * tDy;
  const tLen = portrait ? 80 : 60;          // tangent arrow length
  const gLen = portrait ? 90 : 70;          // gravity arrow length
  const tEndX = tStartX + tLen * tDx;
  const tEndY = tStartY + tLen * tDy;
  const gStartX = holdBobX, gStartY = holdBobY + bobR;
  const gEndX = holdBobX,   gEndY = holdBobY + bobR + gLen;
  const arcEndX = pivX + ARC_R * sH;
  const arcEndY = pivY + ARC_R * cH;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '50%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={VB_W} height={VB_H} viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ overflow: 'visible' }}>
        {/* Pivot bracket — appears first */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <Pendulum pivX={pivX} pivY={pivY} L={L}
                    showString={false} showBob={false}/>
        </SvgFadeIn>

        {/* Vertical reference (dashed) */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={pivX} y1={pivY} x2={pivX} y2={pivY + VERT_REF}
                stroke="var(--chalk-300)" strokeWidth={1.2}
                strokeDasharray="5 5"/>
        </SvgFadeIn>

        {/* String + bob (with m label) — appear at delay 0.8 in vertical
            position, then pull to 30° during 1.2–2.6 */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <Pendulum
            pivX={pivX} pivY={pivY} L={L}
            angle={angleDeg}
            bobR={bobR}
            color="var(--amber-400)"
            bobLabel="m"
            showPivot={false}
          />
        </SvgFadeIn>

        {/* Angle arc + θ label — appear after pull settles */}
        <SvgFadeIn duration={0.4} delay={2.9}>
          <path d={`M ${pivX} ${pivY + ARC_R} A ${ARC_R} ${ARC_R} 0 0 1 ${arcEndX.toFixed(2)} ${arcEndY.toFixed(2)}`}
                fill="none" stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={pivX + (portrait ? 20 : 17)} y={pivY + ARC_R + 15}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 22}>θ</text>
        </SvgFadeIn>

        {/* L label — pinned to held string midpoint */}
        <SvgFadeIn duration={0.4} delay={3.1}>
          <text x={(pivX + holdBobX) / 2 + (portrait ? 22 : 18)} y={(pivY + holdBobY) / 2}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 22}>L</text>
        </SvgFadeIn>

        {/* Gravity arrow — straight down from bob, with mg label */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <line x1={gStartX} y1={gStartY} x2={gEndX} y2={gEndY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${gEndX} ${gEndY} L ${gEndX - 6} ${gEndY - 10} L ${gEndX + 6} ${gEndY - 10} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={4.0}>
          <text x={gEndX + 12} y={gEndY + 4}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 26 : 22}>mg</text>
        </SvgFadeIn>

        {/* Tangential restoring arrow + label */}
        <SvgFadeIn duration={0.4} delay={4.8}>
          <line x1={tStartX} y1={tStartY} x2={tEndX} y2={tEndY}
                stroke="var(--rose-400)" strokeWidth={2.5}/>
          <path d={`M ${tEndX.toFixed(2)} ${tEndY.toFixed(2)}
                    L ${(tEndX - 10 * tDx + 5 * tDy).toFixed(2)} ${(tEndY - 10 * tDy - 5 * tDx).toFixed(2)}
                    L ${(tEndX - 10 * tDx - 5 * tDy).toFixed(2)} ${(tEndY - 10 * tDy + 5 * tDx).toFixed(2)} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.35} delay={5.2}>
          <text x={tEndX - 8} y={tEndY + (portrait ? 28 : 22)}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={portrait ? 24 : 20}
                textAnchor="end">−mg sin θ</text>
        </SvgFadeIn>

        {/* Caption beneath the diagram */}
        <SvgFadeIn duration={0.4} delay={6.4}>
          <text x={VB_W / 2} y={VB_H - 20} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={portrait ? 16 : 14} letterSpacing="0.02em">
            {portrait
              ? 'tangent component restores toward vertical'
              : 'only the tangential component restores it toward vertical'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Small-angle approximation ────────────────────────────────────
function SmallAngle() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 30 : 24,
      width: portrait ? 660 : undefined,
      textAlign: 'center',
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
          fontSize: portrait ? 36 : 38, color: 'var(--chalk-200)', letterSpacing: '0.02em',
        }}>
        sin θ ≈ θ
      </FadeUp>

      <FadeUp duration={0.6} delay={1.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 44, color: 'var(--chalk-100)', letterSpacing: '0.02em',
          marginTop: 8, lineHeight: 1.15,
        }}>
        d²θ/dt² + (g/L) θ = 0
      </FadeUp>

      <FadeUp duration={0.5} delay={3.2} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 16 : 15, color: 'var(--chalk-300)',
        }}>
        same shape as the spring equation
      </FadeUp>

      <FadeUp duration={0.6} delay={4.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 52 : 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 8,
        }}>
        ω₀ = √(g/L)
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Period formula ───────────────────────────────────────────────
// Formula at the top, then two same-mass pendulums of different lengths
// swinging side-by-side. Long L → slow T is shown directly: T scales as
// √L, so doubling L stretches the period by √2 ≈ 1.41×. The g↑→T↓ column
// from the original spec is dropped — g is fixed in the world and already
// in the formula; the L visual carries the variable that's varying.
function PeriodFormula() {
  const portrait = usePortrait();
  // Period ratio: with L_long = 2·L_short, T_long = √2 · T_short.
  const SHORT_L = 110, LONG_L = 220;
  const SHORT_T = 1.4, LONG_T = SHORT_T * Math.SQRT2;
  const RELEASE_DELAY = 1.6;

  // Portrait stacks the two pendulums vertically (top: short/fast, bottom:
  // long/slow). Same kinematics — viewers still see the contrast in period
  // even when the comparison is along the y-axis instead of the x-axis.
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 14,
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
          fontSize: portrait ? 42 : 50, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        T = 2π√(L/g)
      </FadeUp>

      {portrait ? (
        // Stacked: short on top, long below. SVG width fits the portrait
        // canvas with comfortable side margins.
        <svg width={620} height={500} viewBox="0 0 620 500" style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={1.2}>
            <SwingingPendulum
              pivX={310} pivY={20} L={SHORT_L}
              maxAngle={20} period={SHORT_T}
              bobR={14} color="var(--chalk-200)"
              delay={RELEASE_DELAY}
            />
            <text x={310} y={SHORT_L + 20 + 14 + 26} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.14em">SHORT L · FAST T</text>
          </SvgFadeIn>

          <SvgFadeIn duration={0.4} delay={1.2}>
            <SwingingPendulum
              pivX={310} pivY={220} L={LONG_L}
              maxAngle={20} period={LONG_T}
              bobR={14} color="var(--amber-400)"
              delay={RELEASE_DELAY}
            />
            <text x={310} y={LONG_L + 220 + 14 + 26} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize="12"
                  letterSpacing="0.14em">LONG L · SLOW T</text>
          </SvgFadeIn>
        </svg>
      ) : (
        <svg width={720} height={290} viewBox="0 0 720 290" style={{ overflow: 'visible' }}>
          <SvgFadeIn duration={0.4} delay={1.2}>
            <SwingingPendulum
              pivX={200} pivY={30} L={SHORT_L}
              maxAngle={20} period={SHORT_T}
              bobR={14} color="var(--chalk-200)"
              delay={RELEASE_DELAY}
            />
            <text x={200} y={SHORT_L + 30 + 14 + 26} textAnchor="middle"
                  fill="var(--chalk-300)" fontFamily="var(--font-mono)" fontSize="11"
                  letterSpacing="0.14em">SHORT L · FAST T</text>
          </SvgFadeIn>

          <SvgFadeIn duration={0.4} delay={1.2}>
            <SwingingPendulum
              pivX={520} pivY={30} L={LONG_L}
              maxAngle={20} period={LONG_T}
              bobR={14} color="var(--amber-400)"
              delay={RELEASE_DELAY}
            />
            <text x={520} y={LONG_L + 30 + 14 + 18} textAnchor="middle"
                  fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize="11"
                  letterSpacing="0.14em">LONG L · SLOW T</text>
          </SvgFadeIn>
        </svg>
      )}
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
// The visual proof of the lesson: two pendulums, same length, different bob
// masses (small amber vs large rose), released together and swinging in
// perfect sync. The caption above tells you why; the motion below shows it.
function Takeaway() {
  const portrait = usePortrait();
  // Both pendulums share L, maxAngle, period, and start delay → identical
  // motion. Period 2.4s gives ~2.5 full swings across the 7.05s beat.
  const SWING_DELAY = 0.7; // matches the SvgFadeIn so they're released visibly
  // Portrait keeps them side-by-side (the synced swing reads strongest along
  // the same horizontal line) but stretches the strings down the long axis
  // and pushes the pivots toward the canvas edges so the bobs don't crowd.
  const L     = portrait ? 320 : 220;
  const pivYa = portrait ? 60  : 40;
  const pivXL = portrait ? 200 : 210;
  const pivXR = portrait ? 520 : 510;
  const bobLight = portrait ? 16 : 12;
  const bobHeavy = portrait ? 30 : 26;
  const svgW = portrait ? 720 : 720;
  const svgH = portrait ? 460 : 320;
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 14,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 26,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '24ch' : '46ch',
          lineHeight: 1.25,
        }}>
        Heavier bob, lighter bob — same length, same beat.
      </FadeUp>

      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ overflow: 'visible' }}>
        {/* Light pendulum (amber, small bob) */}
        <SvgFadeIn duration={0.5} delay={SWING_DELAY}>
          <SwingingPendulum
            pivX={pivXL} pivY={pivYa} L={L}
            maxAngle={22} period={2.4}
            bobR={bobLight} color="var(--amber-400)"
            delay={SWING_DELAY}
          />
        </SvgFadeIn>

        {/* Heavy pendulum (rose, large bob) */}
        <SvgFadeIn duration={0.5} delay={SWING_DELAY}>
          <SwingingPendulum
            pivX={pivXR} pivY={pivYa} L={L}
            maxAngle={22} period={2.4}
            bobR={bobHeavy} color="var(--rose-400)"
            delay={SWING_DELAY}
          />
        </SvgFadeIn>
      </svg>

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
