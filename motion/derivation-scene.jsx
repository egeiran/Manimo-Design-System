// Moment of Inertia — Manimo lesson scene.
//
// Beats:
//   0.0– 3.0  Manimo enters; title writes on
//   3.0–10.0  Single point mass on rotating arm → I = mr²
//  10.0–15.5  Two masses, same m, r₁ < r₂ — quadratic scaling
//  15.5–21.5  Disk decomposed into rings → I = ∫r²dm → I = ½MR²
//  21.5–28.0  Ring vs Disk side-by-side + formula punchline
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • No nested Sprites inside beat components — stagger via delay only.

// Narration script (one sentence per beat — source of truth for TTS/subtitles)
const NARRATION = [
  /* 0.0– 3.0 */ 'Why does a figure skater spin faster when she pulls her arms in?',
  /* 3.0–10.0 */ 'A single mass m at distance r from the rotation axis has moment of inertia I = mr² — the further out, the harder it is to spin.',
  /* 10.0–15.5*/ 'Doubling the radius quadruples the inertia: I scales with r², not r.',
  /* 15.5–21.5*/ 'For a solid disk we sum the contributions of infinitely many thin rings, giving I = ∫r²dm = ½MR².',
  /* 21.5–28.0*/ 'A ring has all its mass at the edge, so I = MR²; a disk spreads mass inward, so I = ½MR² — distribution is everything.',
];

const SCENE_DURATION = 28;

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 2 · rotational mechanics"
      title="Moment of Inertia"
      duration={SCENE_DURATION}
    >
      {/* Beat 1: Manimo enters */}
      <Sprite start={0.2} end={3.2}>
        <ManimoBubbleIntro />
      </Sprite>

      {/* Beat 2: Point mass → I = mr² */}
      <Sprite start={3.0} end={10.0}>
        <PointMassBeat />
      </Sprite>

      {/* Beat 3: Two radii — quadratic scaling */}
      <Sprite start={10.0} end={15.5}>
        <TwoRadiiBeat />
      </Sprite>

      {/* Beat 4: Disk → ∫r²dm → ½MR² */}
      <Sprite start={15.5} end={21.5}>
        <DiskBeat />
      </Sprite>

      {/* Beat 5: Ring vs Disk + punchline */}
      <Sprite start={21.5} end={SCENE_DURATION}>
        <FormulaReveal />
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
          color: 'var(--chalk-100)', maxWidth: '36ch',
        }}>
        Why does a figure skater spin faster when she pulls her arms in?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Single point mass ────────────────────────────────────────────
// Axis at (140, 190), arm 130 px, mass at east (270, 190).
// 270° CW orbit arc from east to north: M 270 190 A 130 130 0 1 1 140 60
function PointMassBeat() {
  const cx = 140, cy = 190, arm = 130;
  const mx = cx + arm, my = cy;
  // 270° CW: large-arc=1, sweep=1, end at north (cx, cy-arm)
  const orbitD = `M ${mx} ${my} A ${arm} ${arm} 0 1 1 ${cx} ${cy - arm}`;
  // Small rotation indicator arc: 90° CCW from east to north at radius 38
  const rotD = `M ${cx + 38} ${cy} A 38 38 0 0 0 ${cx} ${cy - 38}`;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -60%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20,
    }}>
      <svg width={520} height={340} viewBox="0 0 520 340" style={{ overflow: 'visible' }}>
        {/* Axis cross */}
        <SvgFadeIn duration={0.3} delay={0}>
          <line x1={cx - 13} y1={cy} x2={cx + 13} y2={cy}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <line x1={cx} y1={cy - 13} x2={cx} y2={cy + 13}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <text x={cx - 28} y={cy + 30} fill="var(--chalk-300)"
                fontFamily="var(--font-mono)" fontSize="12">axis</text>
        </SvgFadeIn>

        {/* Orbit arc — dashed, fades in as a whole */}
        <SvgFadeIn duration={1.2} delay={0.3}>
          <path d={orbitD} fill="none"
                stroke="rgba(232,220,193,0.22)" strokeWidth={1.5}
                strokeDasharray="12 10" strokeLinecap="round"/>
        </SvgFadeIn>

        {/* Arm */}
        <TraceIn d={`M ${cx} ${cy} L ${mx} ${my}`}
                 stroke="var(--amber-400)" strokeWidth={3.5}
                 duration={0.65} delay={0.2}/>

        {/* r label above arm midpoint */}
        <SvgFadeIn duration={0.3} delay={1.0}>
          <text x={(cx + mx) / 2} y={cy - 16}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22" textAnchor="middle">r</text>
        </SvgFadeIn>

        {/* Mass dot */}
        <SvgFadeIn duration={0.4} delay={1.1}>
          <circle cx={mx} cy={my} r={20} fill="var(--amber-400)" opacity={0.9}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={1.4}>
          <text x={mx + 30} y={my + 8}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="24">m</text>
        </SvgFadeIn>

        {/* Rotation indicator: small arc + ω */}
        <TraceIn d={rotD}
                 stroke="var(--chalk-300)" strokeWidth={1.5}
                 duration={0.35} delay={2.4}/>
        <SvgFadeIn duration={0.3} delay={2.7}>
          <text x={cx + 44} y={cy - 44}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="18">ω</text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.6} delay={2.9} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 56, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        I = mr²
      </FadeUp>
      <FadeUp duration={0.5} delay={4.0} distance={8}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: 15, color: 'var(--chalk-300)',
          marginTop: -10,
        }}>
        resistance to angular acceleration
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Two masses, same m, different radii ──────────────────────────
// Left: cx=180, r₁=100. Right: cx=580, r₂=200.  SVG 860×280.
// r₂ = 2r₁ → I₂ = 4I₁.
function TwoRadiiBeat() {
  const lCx = 180, lCy = 145, r1 = 100;
  const rCx = 580, rCy = 145, r2 = 200;
  const divX = 400;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '46%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <svg width={860} height={280} viewBox="0 0 860 280" style={{ overflow: 'visible' }}>
        {/* Divider */}
        <SvgFadeIn duration={0.3} delay={0}>
          <line x1={divX} y1={20} x2={divX} y2={250}
                stroke="rgba(232,220,193,0.12)" strokeWidth={1} strokeDasharray="4 4"/>
        </SvgFadeIn>

        {/* ── Left: small radius r₁ ── */}
        <SvgFadeIn duration={0.3} delay={0}>
          <line x1={lCx - 13} y1={lCy} x2={lCx + 13} y2={lCy}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <line x1={lCx} y1={lCy - 13} x2={lCx} y2={lCy + 13}
                stroke="var(--chalk-300)" strokeWidth={2}/>
        </SvgFadeIn>
        <TraceIn d={`M ${lCx} ${lCy} L ${lCx + r1} ${lCy}`}
                 stroke="var(--amber-400)" strokeWidth={3} duration={0.5} delay={0.2}/>
        <SvgFadeIn duration={0.35} delay={0.8}>
          <circle cx={lCx + r1} cy={lCy} r={17} fill="var(--amber-400)" opacity={0.9}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={1.1}>
          <text x={lCx + r1 / 2} y={lCy - 16}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">r₁</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={1.9}>
          <text x={lCx + r1 / 2} y={225}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="24" textAnchor="middle">I₁ = mr₁²</text>
        </SvgFadeIn>

        {/* ── Right: larger radius r₂ = 2r₁ ── */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <line x1={rCx - 13} y1={rCy} x2={rCx + 13} y2={rCy}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <line x1={rCx} y1={rCy - 13} x2={rCx} y2={rCy + 13}
                stroke="var(--chalk-300)" strokeWidth={2}/>
        </SvgFadeIn>
        <TraceIn d={`M ${rCx} ${rCy} L ${rCx + r2} ${rCy}`}
                 stroke="var(--rose-400)" strokeWidth={3} duration={0.8} delay={0.6}/>
        <SvgFadeIn duration={0.35} delay={1.5}>
          <circle cx={rCx + r2} cy={rCy} r={17} fill="var(--rose-400)" opacity={0.9}/>
        </SvgFadeIn>
        <SvgFadeIn duration={0.3} delay={1.8}>
          <text x={rCx + r2 / 2} y={rCy - 16}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">r₂ = 2r₁</text>
        </SvgFadeIn>
        <SvgFadeIn duration={0.4} delay={2.5}>
          <text x={rCx + r2 / 2} y={225}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="24" textAnchor="middle">I₂ = 4mr₁²</text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.5} delay={3.3} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22,
          color: 'var(--chalk-100)', textAlign: 'center',
        }}>
        Double the radius — four times the inertia.
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Disk decomposed into rings ───────────────────────────────────
// SVG 400×360, disk center (200, 188), outer radius R=140.
// Five concentric rings trace in from outside in.
function DiskBeat() {
  const dcx = 200, dcy = 188, R = 140;
  const ringR = [140, 112, 84, 56, 28];

  function ringPath(r) {
    // Full circle as two semicircles (sweep=1 = CW)
    return `M ${dcx + r} ${dcy} A ${r} ${r} 0 0 1 ${dcx - r} ${dcy} A ${r} ${r} 0 0 1 ${dcx + r} ${dcy}`;
  }

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '52%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 56,
    }}>
      {/* Left: disk diagram */}
      <svg width={400} height={360} viewBox="0 0 400 360" style={{ overflow: 'visible' }}>
        {/* Disk fill */}
        <SvgFadeIn duration={0.5} delay={0}>
          <circle cx={dcx} cy={dcy} r={R}
                  fill="rgba(244,184,96,0.07)" stroke="none"/>
        </SvgFadeIn>

        {/* Rings trace in, outermost first */}
        {ringR.map((r, i) => (
          <TraceIn key={r} d={ringPath(r)}
                   stroke={i === 0 ? 'var(--amber-400)' : 'rgba(244,184,96,0.4)'}
                   strokeWidth={i === 0 ? 2.5 : 1.5}
                   duration={0.65} delay={0.3 + i * 0.4}/>
        ))}

        {/* Axis dot */}
        <SvgFadeIn duration={0.3} delay={0}>
          <circle cx={dcx} cy={dcy} r={4} fill="var(--chalk-300)"/>
        </SvgFadeIn>

        {/* R label: line from centre to edge + text */}
        <TraceIn d={`M ${dcx} ${dcy} L ${dcx + R} ${dcy}`}
                 stroke="var(--teal-400)" strokeWidth={2}
                 duration={0.4} delay={2.7}/>
        <SvgFadeIn duration={0.3} delay={3.0}>
          <text x={dcx + R / 2} y={dcy - 12}
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">R</text>
        </SvgFadeIn>

        {/* dm callout on middle ring */}
        <SvgFadeIn duration={0.4} delay={2.2}>
          <text x={dcx + 78} y={dcy - 58}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="16">dm</text>
          <line x1={dcx + 84} y1={dcy - 52}
                x2={dcx + 84} y2={dcy - 28}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.5}/>
        </SvgFadeIn>
      </svg>

      {/* Right: formula derivation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <FadeUp duration={0.5} delay={3.0} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 30, color: 'var(--chalk-300)',
          }}>
          I = Σ mᵢrᵢ²
        </FadeUp>
        <FadeUp duration={0.5} delay={3.7} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 30, color: 'var(--chalk-200)',
          }}>
          I = ∫ r² dm
        </FadeUp>
        <FadeUp duration={0.6} delay={4.6} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic',
            fontSize: 52, color: 'var(--amber-300)', letterSpacing: '0.02em',
            marginTop: 8,
          }}>
          I = ½MR²
        </FadeUp>
        <FadeUp duration={0.4} delay={5.4} distance={8}
          style={{
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--chalk-300)',
          }}>
          for a solid disk about its centre
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Beat 5: Ring vs Disk comparison ─────────────────────────────────────
function FormulaReveal() {
  const labelStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 13,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };
  const formulaStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 56,
  };

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
        same mass M, same radius R
      </FadeUp>

      <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}>
        {/* Ring */}
        <FadeUp duration={0.5} delay={0.3} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>Ring</div>
          <div style={{ ...formulaStyle, color: 'var(--chalk-200)' }}>MR²</div>
        </FadeUp>

        {/* Divider */}
        <FadeUp duration={0.3} delay={0.5} distance={0}
          style={{ width: 1, height: 90, background: 'rgba(232,220,193,0.15)', marginTop: 28 }}/>

        {/* Disk */}
        <FadeUp duration={0.5} delay={0.7} distance={12}
          style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ ...labelStyle, color: 'var(--amber-300)' }}>Solid Disk</div>
          <div style={{ ...formulaStyle, color: 'var(--amber-300)' }}>½MR²</div>
        </FadeUp>
      </div>

      <FadeUp duration={0.6} delay={1.9} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 21,
          color: 'var(--chalk-100)', textAlign: 'center', maxWidth: '52ch',
          borderTop: '1px solid rgba(232,220,193,0.12)',
          paddingTop: 20,
        }}>
        Mass closer to the axis contributes less — distribution is everything.
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
