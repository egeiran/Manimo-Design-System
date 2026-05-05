// Moment of Inertia — Manimo lesson scene.
//
// Beats:
//   0.0– 4.5  Manimo enters → holds → glides to corner (SceneChrome owns it)
//   4.5–10.0  Single point mass orbiting axis → I = mr²
//  10.0–15.5  Two masses spinning together at same ω → quadratic scaling
//  15.5–21.5  Disk decomposed into rings → I = ∫r²dm → I = ½MR²
//  21.5–28.0  Ring vs Disk glyphs + formula punchline
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • No nested Sprites inside beat components — stagger via delay only.

// Narration script (one sentence per beat — source of truth for TTS/subtitles)
const NARRATION = [
  /* 0.0– 4.5 */ 'Why does a figure skater spin faster when she pulls her arms in?',
  /* 4.5–10.0 */ 'A single mass m at distance r from the rotation axis has moment of inertia I = mr² — the further out, the harder it is to spin.',
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
      // Beat 1 is owned by SceneChrome's JourneyManimo: enter → hold → glide
      // to corner. Caption is a tight hook; full question lives in narration.
      introEnd={4.5}
      introCaption="Pull arms in — spin faster. Why?"
    >
      {/* Beat 2: Point mass → I = mr² */}
      <Sprite start={4.5} end={10.0}>
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

// ─── Beat 2: Single point mass ────────────────────────────────────────────
// Axis at (140, 190), arm 130 px. Mass starts at east (270, 190) and after
// the labels settle, orbits CCW at constant ω so the angular velocity
// implied by the formula becomes literal motion on screen.
function PointMassBeat() {
  const cx = 140, cy = 190, arm = 130;
  const { localTime } = useSprite();

  // Rotation: starts after labels are placed; constant 50°/s CCW.
  const ROT_START = 1.7;
  const omegaRad = 50 * Math.PI / 180;
  const angle = Math.max(0, localTime - ROT_START) * omegaRad;
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  // SVG Y is down; CCW = subtract sin from cy.
  const mx = cx + arm * cosA;
  const my = cy - arm * sinA;

  // 270° CW orbit arc (east → north, via south) — static guide path.
  const orbitD = `M ${cx + arm} ${cy} A ${arm} ${arm} 0 1 1 ${cx} ${cy - arm}`;

  // Trace-in progress for the arm (delay 0.2, dur 0.65 — done before rotation).
  const armTrace = Math.max(0, Math.min(1, (localTime - 0.2) / 0.65));
  const massFade = Math.max(0, Math.min(1, (localTime - 1.1) / 0.4));
  const rLabelFade = Math.max(0, Math.min(1, (localTime - 1.0) / 0.3));
  const mLabelFade = Math.max(0, Math.min(1, (localTime - 1.4) / 0.3));

  // Label positions: r at arm midpoint + perpendicular offset (always on the
  // same side of the arm as it sweeps); m at the mass + outward radial offset.
  const midX = (cx + mx) / 2;
  const midY = (cy + my) / 2;
  // Perpendicular to (cosA, -sinA) on the "left-hand-rule" outer side.
  const perpX = -sinA, perpY = -cosA;
  const rLabelX = midX + perpX * 18;
  const rLabelY = midY + perpY * 18 + 6;  // +6 nudges baseline
  const mLabelX = mx + cosA * 26;
  const mLabelY = my - sinA * 26 + 8;

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

        {/* Arm — traced in via stroke-dashoffset, then follows the mass */}
        <line x1={cx} y1={cy} x2={mx} y2={my}
              stroke="var(--amber-400)" strokeWidth={3.5}
              strokeDasharray={arm}
              strokeDashoffset={arm * (1 - armTrace)}
              strokeLinecap="round"/>

        {/* Mass dot at computed orbit position */}
        <circle cx={mx} cy={my} r={20}
                fill="var(--amber-400)" opacity={0.9 * massFade}/>

        {/* r label — perpendicular to the arm, midway out */}
        <text x={rLabelX} y={rLabelY}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize="22" textAnchor="middle"
              opacity={rLabelFade}>r</text>

        {/* m label — radially outside the mass dot */}
        <text x={mLabelX} y={mLabelY}
              fill="var(--chalk-200)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize="24" textAnchor="middle"
              opacity={mLabelFade}>m</text>

        {/* ω label near the axis — appears once rotation is underway */}
        <SvgFadeIn duration={0.3} delay={2.4}>
          <text x={cx - 6} y={cy + 60}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20">ω</text>
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
// r₂ = 2r₁ → I₂ = 4I₁. Both arms spin together at the same ω so the outer
// mass's tangential speed v=ωr is visibly twice the inner mass's — the eye
// sees the linear v scaling, the labels supply the quadratic I scaling.
function TwoRadiiBeat() {
  const lCx = 180, lCy = 145, r1 = 100;
  const rCx = 580, rCy = 145, r2 = 200;
  const divX = 400;
  const { localTime } = useSprite();

  // Both lollipops rotate CCW at the same ω, starting after labels are placed.
  const ROT_START = 2.2;
  const omegaRad = 45 * Math.PI / 180;
  const angle = Math.max(0, localTime - ROT_START) * omegaRad;
  const cosA = Math.cos(angle), sinA = Math.sin(angle);

  // Mass positions
  const lMx = lCx + r1 * cosA, lMy = lCy - r1 * sinA;
  const rMx = rCx + r2 * cosA, rMy = rCy - r2 * sinA;

  // Trace-in / fade-in opacities for elements that pre-date rotation.
  const fade = (t0, dur) => Math.max(0, Math.min(1, (localTime - t0) / dur));
  const lArmTrace = fade(0.2, 0.5);
  const rArmTrace = fade(0.6, 0.8);
  const lMassFade = fade(0.8, 0.35);
  const rMassFade = fade(1.5, 0.35);

  // Velocity arrows appear with the rotation and scale tangentially with r.
  // Tangent direction at angle: (-sin, -cos) in SVG-Y-down for CCW motion.
  const vFade = fade(2.4, 0.5);
  const vScale = 0.55;  // arrow length per unit r (so v₁=55, v₂=110)
  const lvLen = r1 * vScale;
  const rvLen = r2 * vScale;
  const tx = -sinA, ty = -cosA;
  const lvx0 = lMx,            lvy0 = lMy;
  const lvx1 = lMx + tx * lvLen, lvy1 = lMy + ty * lvLen;
  const rvx0 = rMx,            rvy0 = rMy;
  const rvx1 = rMx + tx * rvLen, rvy1 = rMy + ty * rvLen;

  function Arrow({ x0, y0, x1, y1, color, opacity, head = 7 }) {
    const dx = x1 - x0, dy = y1 - y0;
    const len = Math.hypot(dx, dy);
    if (len < 1) return null;
    const ux = dx / len, uy = dy / len;
    // Perpendicular for arrowhead wings
    const px = -uy, py = ux;
    const tipBx = x1 - ux * head + px * head * 0.55;
    const tipBy = y1 - uy * head + py * head * 0.55;
    const tipCx = x1 - ux * head - px * head * 0.55;
    const tipCy = y1 - uy * head - py * head * 0.55;
    return (
      <g opacity={opacity}>
        <line x1={x0} y1={y0} x2={x1} y2={y1}
              stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
        <path d={`M ${x1} ${y1} L ${tipBx} ${tipBy} L ${tipCx} ${tipCy} Z`}
              fill={color}/>
      </g>
    );
  }

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
        {/* Arm — traced in, then sweeps with rotation */}
        <line x1={lCx} y1={lCy} x2={lMx} y2={lMy}
              stroke="var(--amber-400)" strokeWidth={3}
              strokeDasharray={r1}
              strokeDashoffset={r1 * (1 - lArmTrace)}
              strokeLinecap="round"/>
        <circle cx={lMx} cy={lMy} r={17}
                fill="var(--amber-400)" opacity={0.9 * lMassFade}/>
        <SvgFadeIn duration={0.3} delay={1.1}>
          <text x={lCx + r1 / 2} y={lCy - 16}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">r₁</text>
        </SvgFadeIn>
        <Arrow x0={lvx0} y0={lvy0} x1={lvx1} y1={lvy1}
               color="var(--amber-300)" opacity={vFade}/>
        <text x={lvx1 + tx * 14} y={lvy1 + ty * 14 + 5}
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize="16" textAnchor="middle"
              opacity={vFade}>v₁</text>
        <SvgFadeIn duration={0.4} delay={1.9}>
          <text x={lCx + r1 / 2} y={250}
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
        <line x1={rCx} y1={rCy} x2={rMx} y2={rMy}
              stroke="var(--rose-400)" strokeWidth={3}
              strokeDasharray={r2}
              strokeDashoffset={r2 * (1 - rArmTrace)}
              strokeLinecap="round"/>
        <circle cx={rMx} cy={rMy} r={17}
                fill="var(--rose-400)" opacity={0.9 * rMassFade}/>
        <SvgFadeIn duration={0.3} delay={1.8}>
          <text x={rCx + r2 / 2} y={rCy - 16}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">r₂ = 2r₁</text>
        </SvgFadeIn>
        <Arrow x0={rvx0} y0={rvy0} x1={rvx1} y1={rvy1}
               color="var(--rose-300)" opacity={vFade}/>
        <text x={rvx1 + tx * 14} y={rvy1 + ty * 14 + 5}
              fill="var(--rose-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize="16" textAnchor="middle"
              opacity={vFade}>v₂ = 2v₁</text>
        <SvgFadeIn duration={0.4} delay={2.5}>
          <text x={rCx + r2 / 2} y={250}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="24" textAnchor="middle">I₂ = 4mr₁²</text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.5} delay={3.3} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22,
          color: 'var(--chalk-100)', textAlign: 'center',
        }}>
        Same ω — but at twice the radius, twice the speed, four times the inertia.
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
// A small spinning ring vs a small spinning disk sit above their formulas.
// Same M, same R, same ω — the visual asks "same shape, same size, why is
// one harder to spin?" and the formulas answer.
function FormulaReveal() {
  const labelStyle = {
    fontFamily: 'var(--font-sans)', fontSize: 13,
    letterSpacing: '0.08em', textTransform: 'uppercase',
  };
  const formulaStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 56,
  };
  const { localTime } = useSprite();

  // Both glyphs spin at the same ω so the eye sees "same motion, different
  // mass distribution". Rotation begins after the glyphs have appeared.
  const ROT_START = 1.4;
  const angleDeg = Math.max(0, localTime - ROT_START) * 30;  // 30°/s

  // Ring glyph: hollow stroke + 8 spoke marks at the rim (mass concentrated).
  function RingGlyph({ color, opacity }) {
    const R = 36;
    const tickIn = R - 7, tickOut = R + 7;
    const ticks = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      return (
        <line key={i}
              x1={tickIn * c} y1={tickIn * s}
              x2={tickOut * c} y2={tickOut * s}
              stroke={color} strokeWidth={2.2} strokeLinecap="round"/>
      );
    });
    return (
      <svg width={100} height={100} viewBox="-50 -50 100 100"
           style={{ overflow: 'visible', opacity }}>
        <g transform={`rotate(${angleDeg})`}>
          <circle cx={0} cy={0} r={R} fill="none" stroke={color} strokeWidth={3}/>
          {ticks}
        </g>
      </svg>
    );
  }

  // Disk glyph: filled circle with radial dot pattern (mass spread inward).
  function DiskGlyph({ color, opacity }) {
    const R = 36;
    // Concentric dot rings at r=10,20,30 — mass everywhere, denser visually
    // than the ring's pure rim because every radius contributes.
    const dots = [];
    [12, 22, 32].forEach((r, ringIdx) => {
      const n = 6 + ringIdx * 4;  // 6, 10, 14
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        dots.push(
          <circle key={`${r}-${i}`}
                  cx={Math.cos(a) * r} cy={Math.sin(a) * r}
                  r={1.6} fill={color} opacity={0.85}/>
        );
      }
    });
    return (
      <svg width={100} height={100} viewBox="-50 -50 100 100"
           style={{ overflow: 'visible', opacity }}>
        <g transform={`rotate(${angleDeg})`}>
          <circle cx={0} cy={0} r={R} fill={color} fillOpacity={0.18}
                  stroke={color} strokeWidth={1.5}/>
          {dots}
          <circle cx={0} cy={0} r={2} fill={color}/>
        </g>
      </svg>
    );
  }

  // Glyph fade-ins
  const ringFade = Math.max(0, Math.min(1, (localTime - 0.3) / 0.5));
  const diskFade = Math.max(0, Math.min(1, (localTime - 0.7) / 0.5));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
    }}>
      <FadeUp duration={0.4} delay={0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--amber-300)',
          letterSpacing: '0.14em', textTransform: 'uppercase',
        }}>
        same mass M, same radius R, same spin
      </FadeUp>

      <div style={{ display: 'flex', gap: 80, alignItems: 'flex-start' }}>
        {/* Ring */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column',
                      gap: 10, alignItems: 'center' }}>
          <RingGlyph color="var(--chalk-200)" opacity={ringFade}/>
          <div style={{ ...labelStyle, color: 'var(--chalk-300)' }}>Ring</div>
          <div style={{ ...formulaStyle, color: 'var(--chalk-200)' }}>MR²</div>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 180, background: 'rgba(232,220,193,0.15)',
                      marginTop: 18 }}/>

        {/* Disk */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column',
                      gap: 10, alignItems: 'center' }}>
          <DiskGlyph color="var(--amber-300)" opacity={diskFade}/>
          <div style={{ ...labelStyle, color: 'var(--amber-300)' }}>Solid Disk</div>
          <div style={{ ...formulaStyle, color: 'var(--amber-300)' }}>½MR²</div>
        </div>
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
