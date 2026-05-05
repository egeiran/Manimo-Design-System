// Hoop vs Disk: Why a Disk Wins — Manimo lesson scene.
// Generated from motion/hoop-disk.spec.json. Builds on Scene 2 (moment of inertia).
//
// Beats (timed to single-track narration in motion/audio/hoop-disk/):
//    0.00– 6.07  Manimo enters; hook question
//    6.07–12.53  Ramp setup: hoop and disk at top, labels for their I
//   12.53–26.29  Energy conservation derivation → general v formula
//   26.29–40.38  Verdict: hoop v = √(gh), disk v = √(4gh/3), disk wins ≈15%
//   40.38–48.00  Takeaway caption
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.

const SCENE_DURATION = 48;

// Narration script (one sentence per beat — source of truth for TTS/subtitles)
const NARRATION = [
  /*  0.00– 6.07 */ 'Two wheels — same mass, same radius, same hill. Which one reaches the bottom first?',
  /*  6.07–12.53 */ 'We release a hoop and a solid disk from rest at the top of an inclined ramp. Both roll without slipping.',
  /* 12.53–26.29 */ 'By energy conservation, the gravitational potential energy m g h becomes kinetic energy — split between translation, one half m v squared, and rotation, one half I omega squared.',
  /* 26.29–40.38 */ 'Plug in: for the disk, v equals the square root of four g h divided by three. For the hoop, v equals the square root of g h. The disk is always faster — about fifteen percent quicker at the bottom.',
  /* 40.38–48.00 */ 'Less rotational inertia leaves more energy for translation — that is why a solid disk beats a hoop.',
];

// Single continuous narration track aligned to manifest.json offsets.
const NARRATION_AUDIO = 'audio/hoop-disk/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 3 · rolling motion"
      title="Hoop vs Disk: Why a Disk Wins"
      duration={SCENE_DURATION}
      // SceneChrome's JourneyManimo handles the intro. No standalone Sprite.
      introEnd={6.07}
      introCaption="Two wheels, same mass, same radius — which one wins?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={6.07} end={12.53}>
        <RampSetup />
      </Sprite>

      <Sprite start={12.53} end={26.29}>
        <EnergyDerivation />
      </Sprite>

      <Sprite start={26.29} end={40.38}>
        <Verdict />
      </Sprite>

      <Sprite start={40.38} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
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
  const portrait = usePortrait();
  // Geometry tuned per aspect: portrait makes the ramp steeper and shorter
  // so labels can sit under it instead of crowding into a narrow side gap.
  const G = portrait
    ? {
        R: 20, vbW: 600, vbH: 660,
        topX: 80, topY: 70,
        cornerX: 80, cornerY: 400,
        baseX: 540,                       // bottom-right of ramp triangle
        labelHoopX: 300, labelHoopY: 470, labelHoopFY: 504,
        labelDiskX: 300, labelDiskY: 550, labelDiskFY: 584,
        captionX: 300, captionY: 630,
        hLabelX: 42, hLabelY: 235,
        hMarkerX: 62,
      }
    : {
        R: 24, vbW: 800, vbH: 400,
        topX: 80, topY: 80,
        cornerX: 80, cornerY: 340,
        baseX: 700,
        labelHoopX: 300, labelHoopY: 84, labelHoopFY: 112,
        labelDiskX: 300, labelDiskY: 166, labelDiskFY: 194,
        captionX: 500, captionY: 310,
        hLabelX: 42, hLabelY: 216,
        hMarkerX: 62,
      };

  // Ramp surface: top → base. Length and unit tangent/normal.
  const dx = G.baseX - G.topX;
  const dy = G.cornerY - G.topY;
  const RAMP_LEN = Math.hypot(dx, dy);
  const TX = dx / RAMP_LEN, TY = dy / RAMP_LEN;     // unit tangent (down-ramp)
  const NX = TY, NY = -TX;                          // outward normal (above ramp)

  function onRamp(t) {
    const sx = G.topX + t * dx;
    const sy = G.topY + t * dy;
    return { cx: sx + G.R * NX, cy: sy + G.R * NY };
  }

  const hoop = onRamp(0.04);
  const disk = onRamp(0.13);

  // Short release-and-roll near end of beat to literalise "rolls without
  // slipping". They start moving as the narrator says that phrase.
  const ROLL_DELAY = 3.6;
  const ROLL_DURATION = 1.6;
  const ROLL_DIST = portrait ? 90 : 70;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Ramp triangle — hypotenuse, ground, vertical leg */}
        <TraceIn d={`M ${G.topX} ${G.topY} L ${G.baseX} ${G.cornerY}`}
                 stroke="var(--chalk-200)" strokeWidth={2.5}
                 duration={0.9} delay={0.0}/>
        <TraceIn d={`M ${G.cornerX} ${G.cornerY} L ${G.baseX} ${G.cornerY}`}
                 stroke="var(--chalk-300)" strokeWidth={2}
                 duration={0.7} delay={0.6}/>

        {/* Height marker — dashed vertical guide + 'h' label */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <line x1={G.hMarkerX} y1={G.topY} x2={G.hMarkerX} y2={G.cornerY}
                stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="4 4"/>
          <line x1={G.hMarkerX - 6} y1={G.topY} x2={G.hMarkerX + 6} y2={G.topY}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={G.hMarkerX - 6} y1={G.cornerY} x2={G.hMarkerX + 6} y2={G.cornerY}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <text x={G.hLabelX} y={G.hLabelY} fill="var(--chalk-200)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize="22" textAnchor="middle">h</text>
        </SvgFadeIn>

        {/* Hoop — appears, then releases and rolls a short distance */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <RollingWheel
            cx={hoop.cx} cy={hoop.cy}
            dirX={TX} dirY={TY}
            distance={ROLL_DIST} R={G.R} type="hoop"
            color="var(--amber-400)"
            duration={ROLL_DURATION} delay={ROLL_DELAY}
          />
        </SvgFadeIn>

        {/* Disk — appears slightly later, releases at the same instant */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <RollingWheel
            cx={disk.cx} cy={disk.cy}
            dirX={TX} dirY={TY}
            distance={ROLL_DIST} R={G.R} type="disk"
            color="var(--rose-400)"
            duration={ROLL_DURATION} delay={ROLL_DELAY}
          />
        </SvgFadeIn>

        {/* Side-stack (landscape) or below-ramp (portrait) labels:
            HOOP / I = MR², then DISK / I = ½MR² */}
        <SvgFadeIn duration={0.4} delay={3.2}>
          <text x={G.labelHoopX} y={G.labelHoopY} fill="var(--amber-300)"
                fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.15em"
                textAnchor={portrait ? 'middle' : 'start'}>HOOP</text>
          <text x={G.labelHoopX} y={G.labelHoopFY} fill="var(--amber-300)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize="24"
                textAnchor={portrait ? 'middle' : 'start'}>I = MR²</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={3.8}>
          <text x={G.labelDiskX} y={G.labelDiskY} fill="var(--rose-300)"
                fontFamily="var(--font-mono)" fontSize="12"
                letterSpacing="0.15em"
                textAnchor={portrait ? 'middle' : 'start'}>DISK</text>
          <text x={G.labelDiskX} y={G.labelDiskFY} fill="var(--rose-300)"
                fontFamily="var(--font-serif)" fontStyle="italic"
                fontSize="24"
                textAnchor={portrait ? 'middle' : 'start'}>I = ½MR²</text>
        </SvgFadeIn>

        {/* "rolls without slipping" tag */}
        <SvgFadeIn duration={0.4} delay={4.6}>
          <text x={G.captionX} y={G.captionY} fill="var(--chalk-300)"
                fontFamily="var(--font-sans)" fontSize="13"
                letterSpacing="0.04em"
                textAnchor={portrait ? 'middle' : 'start'}>rolls without slipping</text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Energy conservation derivation ──────────────────────────────
function EnergyDerivation() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 24 : 28,
      textAlign: 'center',
      width: portrait ? 660 : undefined,
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
          fontSize: portrait ? 36 : 48, color: 'var(--chalk-100)', letterSpacing: '0.02em',
          lineHeight: 1.15,
        }}>
        Mgh = ½Mv² + ½Iω²
      </FadeUp>

      <FadeUp duration={0.5} delay={2.4} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 20 : 22, color: 'var(--chalk-300)',
          maxWidth: portrait ? '24ch' : 'none',
        }}>
        rolling without slipping  →  v = ωR
      </FadeUp>

      <FadeUp duration={0.6} delay={4.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 40 : 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
          marginTop: 8, lineHeight: 1.15,
        }}>
        v = √( 2gh / (1 + I/MR²) )
      </FadeUp>

      <FadeUp duration={0.4} delay={5.6} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 14,
          color: 'var(--chalk-300)', marginTop: -12,
          maxWidth: portrait ? '32ch' : 'none', lineHeight: 1.3,
        }}>
        smaller I/MR² → faster bottom-of-ramp speed
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Verdict — Hoop vs Disk ──────────────────────────────────────
// Compact formula header at the top, then two parallel ramps with the
// wheels racing down. Disk arrives ≈15% sooner — the visual proof of the
// number in the caption. Formulas now use a smaller font so the race
// has room to breathe.
function Verdict() {
  const portrait = usePortrait();
  const labelStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 12,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };
  const formulaStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 30 : 36,
  };

  // Race geometry — two stacked ramps sharing slope/length. Same h, same
  // angle, just drawn parallel so each wheel has a clean lane. Portrait
  // shrinks the run so the SVG fits the 720-wide canvas.
  const X1 = portrait ? 40 : 50;
  const X2 = portrait ? 580 : 700;
  const UPPER_Y1 = portrait ? 60  : 70;
  const UPPER_Y2 = portrait ? 150 : 170;
  const LOWER_Y1 = portrait ? 180 : 200;
  const LOWER_Y2 = portrait ? 270 : 300;
  const VB_W = portrait ? 620 : 760;
  const VB_H = portrait ? 300 : 330;
  const dx = X2 - X1, dy = UPPER_Y2 - UPPER_Y1;
  const LEN = Math.hypot(dx, dy);
  const TX = dx / LEN, TY = dy / LEN;        // unit tangent (down-ramp)
  const ONX = TY,      ONY = -TX;            // outward normal (above ramp)

  const R = portrait ? 16 : 20;
  const hoopStart = { cx: X1 + R * ONX, cy: UPPER_Y1 + R * ONY };
  const diskStart = { cx: X1 + R * ONX, cy: LOWER_Y1 + R * ONY };

  // Roll most of the ramp; leave a small margin past the bottom so the
  // wheel ends visibly past the corner.
  const ROLL_DIST = LEN - 60;
  // Both wheels released at the same instant. Disk's acceleration is
  // a_disk / a_hoop = (1 + I/MR²)_hoop / (1 + I/MR²)_disk = 2 / 1.5 = 4/3,
  // so t_hoop = t_disk * sqrt(4/3) ≈ 1.155 — that's the 15% gap.
  const RELEASE_DELAY = 4.5;
  const DISK_DUR = 4.5;
  const HOOP_DUR = DISK_DUR * Math.sqrt(4 / 3);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
    }}>
      <FadeUp duration={0.4} delay={0} distance={6}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 11,
          color: 'var(--amber-300)', letterSpacing: '0.14em',
          textTransform: 'uppercase',
        }}>
        same mass, same radius, same h
      </FadeUp>

      <div style={{ display: 'flex', gap: portrait ? 50 : 80, alignItems: 'flex-start' }}>
        <FadeUp duration={0.5} delay={0.3} distance={10}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>Hoop</div>
          <div style={{ ...formulaStyle, color: 'var(--chalk-200)' }}>√(gh)</div>
        </FadeUp>

        <FadeUp duration={0.3} delay={0.5} distance={0}
          style={{ width: 1, height: 64, background: 'rgba(232,220,193,0.15)', marginTop: 22 }}/>

        <FadeUp duration={0.5} delay={1.0} distance={10}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ ...labelStyle, color: 'var(--amber-300)' }}>Disk</div>
          <div style={{ ...formulaStyle, color: 'var(--amber-300)' }}>√(4gh/3)</div>
        </FadeUp>
      </div>

      {/* Race — two parallel ramps, wheels released together */}
      <svg width={VB_W} height={VB_H} viewBox={`0 0 ${VB_W} ${VB_H}`} style={{ overflow: 'visible' }}>
        {/* Upper ramp (hoop lane) */}
        <TraceIn d={`M ${X1} ${UPPER_Y1} L ${X2} ${UPPER_Y2}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.7} delay={2.0}/>
        <TraceIn d={`M ${X1} ${UPPER_Y2} L ${X2} ${UPPER_Y2}`}
                 stroke="var(--chalk-300)" strokeWidth={1.5}
                 duration={0.5} delay={2.4}/>
        <TraceIn d={`M ${X1} ${UPPER_Y1} L ${X1} ${UPPER_Y2}`}
                 stroke="var(--chalk-300)" strokeWidth={1.5}
                 duration={0.4} delay={2.3}/>
        <SvgFadeIn duration={0.3} delay={2.7}>
          <text x={X1 - 12} y={UPPER_Y1 - 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)" fontSize="10"
                letterSpacing="0.14em" textAnchor="end">HOOP</text>
        </SvgFadeIn>

        {/* Lower ramp (disk lane) */}
        <TraceIn d={`M ${X1} ${LOWER_Y1} L ${X2} ${LOWER_Y2}`}
                 stroke="var(--chalk-200)" strokeWidth={2}
                 duration={0.7} delay={2.2}/>
        <TraceIn d={`M ${X1} ${LOWER_Y2} L ${X2} ${LOWER_Y2}`}
                 stroke="var(--chalk-300)" strokeWidth={1.5}
                 duration={0.5} delay={2.6}/>
        <TraceIn d={`M ${X1} ${LOWER_Y1} L ${X1} ${LOWER_Y2}`}
                 stroke="var(--chalk-300)" strokeWidth={1.5}
                 duration={0.4} delay={2.5}/>
        <SvgFadeIn duration={0.3} delay={2.9}>
          <text x={X1 - 12} y={LOWER_Y1 - 8}
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize="10"
                letterSpacing="0.14em" textAnchor="end">DISK</text>
        </SvgFadeIn>

        {/* Finish-line ticks past the bottom of each ramp */}
        <SvgFadeIn duration={0.3} delay={3.4}>
          <line x1={X2} y1={UPPER_Y2 - 28} x2={X2} y2={UPPER_Y2}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 3"/>
          <line x1={X2} y1={LOWER_Y2 - 28} x2={X2} y2={LOWER_Y2}
                stroke="var(--chalk-300)" strokeWidth={1} strokeDasharray="3 3"/>
        </SvgFadeIn>

        {/* Hoop wheel — upper lane */}
        <SvgFadeIn duration={0.4} delay={3.4}>
          <RollingWheel
            cx={hoopStart.cx} cy={hoopStart.cy}
            dirX={TX} dirY={TY}
            distance={ROLL_DIST} R={R} type="hoop"
            color="var(--amber-400)"
            duration={HOOP_DUR} delay={RELEASE_DELAY}
          />
        </SvgFadeIn>

        {/* Disk wheel — lower lane, releases at the same instant */}
        <SvgFadeIn duration={0.4} delay={3.6}>
          <RollingWheel
            cx={diskStart.cx} cy={diskStart.cy}
            dirX={TX} dirY={TY}
            distance={ROLL_DIST} R={R} type="disk"
            color="var(--rose-400)"
            duration={DISK_DUR} delay={RELEASE_DELAY}
          />
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.6} delay={9.6} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22,
          color: 'var(--chalk-100)', textAlign: 'center', maxWidth: '52ch',
          marginTop: -8,
        }}>
        Disk wins by ≈15% — every time.
      </FadeUp>
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
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '20ch' : '40ch',
          lineHeight: 1.3,
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
