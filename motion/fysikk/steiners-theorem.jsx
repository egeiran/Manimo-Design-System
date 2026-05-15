// Steiner's Theorem: The Cost of an Off-Centre Axis — Manimo lesson scene.
// Generated from motion/steiners-theorem.spec.json. Sits alongside the other
// rotational mechanics scenes (moment-of-inertia, hoop-disk).
//
// Beats (aligned to single-track narration in motion/audio/steiners-theorem/):
//    0.00– 8.09  Manimo enters; hook question
//    8.09–20.09  Two parallel axes — same disk, different pin
//   20.09–34.71  Theorem reveal: I = I_cm + Md²
//   34.71–48.09  Worked example: disk about its rim (d = R)
//   48.09–54.85  Takeaway — minimum I lives at the centre of mass
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • The right diagram in beat 2 rotates the whole disk about the offset
//     pin — every body point follows a circle whose centre is the pin. The CM
//     therefore traces a circle of radius d, which is what makes the Md² term
//     literal on screen.

const SCENE_DURATION = 56;

// Single continuous narration track — one ElevenLabs render covering the whole
// scene. Sprite start values below match audioStart offsets in
// motion/audio/steiners-theorem/manifest.json.
const NARRATION_AUDIO = 'audio/steiners-theorem/scene.mp3';

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 8.09 */ "We know a disk's moment of inertia is one half M R squared, about its centre. But what if you spin it about a different axis?",
  /*  8.09–20.09 */ 'Take the same disk with two parallel axes — one through the centre of mass, and one offset by a distance d. Spinning about the offset axis is always harder. But how much harder?',
  /* 20.09–34.71 */ "Steiner's theorem says the total inertia equals I about the centre of mass, plus M times d squared. The first term is the body still spinning about its own centre. The second term is the centre itself swinging in a circle of radius d.",
  /* 34.71–48.09 */ 'Take a disk spun about its rim, where d equals R. Then I equals one half M R squared, plus M R squared, giving three halves M R squared — three times the inertia of spinning about the centre.',
  /* 48.09–54.85 */ 'The centre of mass always gives the smallest moment of inertia. Move the axis away, and spinning only gets harder.',
];

function Scene() {
  return (
    <SceneChrome
      eyebrow="rotational mechanics"
      title="Steiner's Theorem: The Cost of an Off-Centre Axis"
      duration={SCENE_DURATION}
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={0} end={8.09}>
        <ManimoBubbleIntro/>
      </Sprite>

      <Sprite start={8.09} end={20.09}>
        <TwoAxesBeat/>
      </Sprite>

      <Sprite start={20.09} end={34.71}>
        <TheoremReveal/>
      </Sprite>

      <Sprite start={34.71} end={48.09}>
        <RimExample/>
      </Sprite>

      <Sprite start={48.09} end={SCENE_DURATION}>
        <Takeaway/>
      </Sprite>
    </SceneChrome>
  );
}

// ─── Beat 1: Manimo intro ─────────────────────────────────────────────────
function ManimoBubbleIntro() {
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '46%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <svg width={140} height={140} viewBox="0 0 200 200" style={{ overflow: 'visible' }}>
        <ManimoEnter duration={0.7} bob={true}/>
      </svg>
      <FadeUp duration={0.5} delay={0.7} distance={8}
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 26,
          fontStyle: 'italic',
          color: 'var(--chalk-100)',
        }}>
        Same disk — different axis. Does the inertia change?
      </FadeUp>
    </div>
  );
}

// ─── Beat 2: Two parallel axes side-by-side ───────────────────────────────
// Two identical disks. Left rotates about its centre (CM). Right is pinned
// at an offset point P; the whole disk swings about P, so the CM itself
// traces a circle of radius d. That orbit of the CM is exactly the Md² term
// of Steiner's theorem made literal.
function TwoAxesBeat() {
  const SVG_W = 920, SVG_H = 380;
  const lCx = 200, lCy = 200, R = 92;        // left disk centre + radius
  const pinX = 700, pinY = 200, d = 78;      // right pin and offset distance
  const { localTime } = useSprite();

  // Both rotations start together once the static scene has settled.
  const ROT_START = 2.0;
  const omegaRad = 35 * Math.PI / 180;       // 35°/s — slow enough to read
  const angle = Math.max(0, localTime - ROT_START) * omegaRad;
  const cosA = Math.cos(angle), sinA = Math.sin(angle);

  // Right disk: CM orbits the pin at radius d (CCW in screen-down y).
  const rCmX = pinX + d * cosA;
  const rCmY = pinY - d * sinA;

  // Spoke ticks make rotation legible. Spread from rim by 8px outward.
  const SPOKES = 6;
  const spokeR1 = R - 18, spokeR2 = R - 4;

  function spokes(cx, cy, baseAngle) {
    return Array.from({ length: SPOKES }, (_, i) => {
      const a = baseAngle + (i / SPOKES) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      return (
        <line key={i}
              x1={cx + spokeR1 * c} y1={cy - spokeR1 * s}
              x2={cx + spokeR2 * c} y2={cy - spokeR2 * s}
              stroke="rgba(244,184,96,0.55)" strokeWidth={2}
              strokeLinecap="round"/>
      );
    });
  }

  const fade = (t0, dur) => Math.max(0, Math.min(1, (localTime - t0) / dur));
  const captionFade = fade(4.5, 0.6);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
           style={{ overflow: 'visible' }}>

        {/* Vertical divider */}
        <SvgFadeIn duration={0.4} delay={0}>
          <line x1={SVG_W / 2} y1={30} x2={SVG_W / 2} y2={SVG_H - 20}
                stroke="rgba(232,220,193,0.12)" strokeWidth={1} strokeDasharray="4 4"/>
        </SvgFadeIn>

        {/* ── Left: rotation about CM ──────────────────────────────────── */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          <circle cx={lCx} cy={lCy} r={R}
                  fill="rgba(244,184,96,0.10)"
                  stroke="var(--amber-400)" strokeWidth={2.5}/>
        </SvgFadeIn>
        <g opacity={fade(0.4, 0.4)}>
          {spokes(lCx, lCy, angle)}
        </g>

        {/* CM axis cross + label */}
        <SvgFadeIn duration={0.3} delay={0}>
          <line x1={lCx - 11} y1={lCy} x2={lCx + 11} y2={lCy}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <line x1={lCx} y1={lCy - 11} x2={lCx} y2={lCy + 11}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <circle cx={lCx} cy={lCy} r={3.5} fill="var(--chalk-200)"/>
          <text x={lCx + 18} y={lCy + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize="13">CM</text>
        </SvgFadeIn>

        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={lCx} y={lCy + R + 36}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">
            about the centre of mass
          </text>
        </SvgFadeIn>

        {/* ── Right: rotation about offset pin ─────────────────────────── */}
        {/* Faint orbit circle of radius d traced by the CM */}
        <SvgFadeIn duration={0.6} delay={1.5}>
          <circle cx={pinX} cy={pinY} r={d}
                  fill="none" stroke="var(--rose-300)" strokeOpacity={0.45}
                  strokeWidth={1.4} strokeDasharray="5 6"/>
        </SvgFadeIn>

        {/* Disk — outline + fill at the moving CM */}
        <SvgFadeIn duration={0.5} delay={0.6}>
          {/* placeholder so the disk's first frame fades in */}
        </SvgFadeIn>
        <g opacity={fade(0.6, 0.5)}>
          <circle cx={rCmX} cy={rCmY} r={R}
                  fill="rgba(232,122,144,0.10)"
                  stroke="var(--rose-400)" strokeWidth={2.5}/>
          {/* Spokes spin with both the orbital angle (about pin) and the
              body's own rotation about its CM — for a rigid body these are
              the same angle, so passing `angle` is correct. */}
          {spokes(rCmX, rCmY, angle).map((node, i) =>
            React.cloneElement(node, {
              stroke: 'rgba(232,122,144,0.55)',
              key: `r-${i}`,
            })
          )}
        </g>

        {/* Pin axis cross + label */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <line x1={pinX - 11} y1={pinY} x2={pinX + 11} y2={pinY}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <line x1={pinX} y1={pinY - 11} x2={pinX} y2={pinY + 11}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <circle cx={pinX} cy={pinY} r={3.5} fill="var(--chalk-100)"/>
          <text x={pinX - 16} y={pinY + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize="13" textAnchor="end">P</text>
        </SvgFadeIn>

        {/* Distance d marker — dashed segment from pin to current CM */}
        <g opacity={fade(1.0, 0.4)}>
          <line x1={pinX} y1={pinY} x2={rCmX} y2={rCmY}
                stroke="var(--rose-300)" strokeWidth={1.6}
                strokeDasharray="4 4"/>
          {/* d label at midpoint with small perpendicular offset */}
          {(() => {
            const mx = (pinX + rCmX) / 2;
            const my = (pinY + rCmY) / 2;
            const px = -(-sinA);   // perpendicular: rotate (cosA, -sinA) by 90°
            const py = -cosA;
            return (
              <text x={mx + px * 12} y={my + py * 12 + 5}
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize="20" textAnchor="middle">d</text>
            );
          })()}
          {/* Small dot tracking the CM, makes the orbit obvious */}
          <circle cx={rCmX} cy={rCmY} r={3.5} fill="var(--rose-300)"/>
        </g>

        <SvgFadeIn duration={0.4} delay={1.4}>
          <text x={pinX} y={pinY + R + 36}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="20" textAnchor="middle">
            about an axis offset by d
          </text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.6} delay={4.5} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: 22, color: 'var(--chalk-100)', textAlign: 'center',
          maxWidth: '54ch', opacity: captionFade,
        }}>
        Spinning off-centre is always harder — the centre itself has to swing.
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Theorem reveal — I = I_cm + Md² ──────────────────────────────
// The two terms are explained with miniature glyphs that mirror beat 2:
//   • amber spinning disk → "spin about its own centre" (I_cm)
//   • rose dot orbiting a pin → "centre carried around the pin" (Md²)
function TheoremReveal() {
  const { localTime } = useSprite();

  // Tiny disk glyph that keeps spinning to echo beat 2
  function MiniDisk({ angle }) {
    const R = 24;
    const ticks = Array.from({ length: 6 }, (_, i) => {
      const a = angle + (i / 6) * Math.PI * 2;
      const c = Math.cos(a), s = Math.sin(a);
      return (
        <line key={i}
              x1={(R - 9) * c} y1={(R - 9) * s}
              x2={(R - 2) * c} y2={(R - 2) * s}
              stroke="rgba(244,184,96,0.7)" strokeWidth={1.6}
              strokeLinecap="round"/>
      );
    });
    return (
      <svg width={70} height={70} viewBox="-35 -35 70 70" style={{ overflow: 'visible' }}>
        <circle cx={0} cy={0} r={R}
                fill="rgba(244,184,96,0.12)"
                stroke="var(--amber-400)" strokeWidth={2}/>
        {ticks}
        <circle cx={0} cy={0} r={2.2} fill="var(--chalk-200)"/>
      </svg>
    );
  }

  // Tiny dot orbiting a pin — illustrates Md²
  function MiniOrbit({ angle }) {
    const d = 22;
    const x = d * Math.cos(angle);
    const y = -d * Math.sin(angle);
    return (
      <svg width={70} height={70} viewBox="-35 -35 70 70" style={{ overflow: 'visible' }}>
        <circle cx={0} cy={0} r={d}
                fill="none" stroke="var(--rose-300)" strokeOpacity={0.55}
                strokeWidth={1.3} strokeDasharray="3 4"/>
        <line x1={-7} y1={0} x2={7} y2={0} stroke="var(--chalk-300)" strokeWidth={1.5}/>
        <line x1={0} y1={-7} x2={0} y2={7} stroke="var(--chalk-300)" strokeWidth={1.5}/>
        <line x1={0} y1={0} x2={x} y2={y}
              stroke="var(--rose-300)" strokeWidth={1.4} strokeDasharray="3 3"/>
        <circle cx={x} cy={y} r={6} fill="var(--rose-400)"/>
      </svg>
    );
  }

  const ROT_START = 0.4;
  const omega = 50 * Math.PI / 180;
  const ang = Math.max(0, localTime - ROT_START) * omega;

  const fade = (t0, dur) => Math.max(0, Math.min(1, (localTime - t0) / dur));
  const diskFade = fade(2.0, 0.5);
  const orbitFade = fade(3.6, 0.5);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28,
    }}>
      {/* Headline formula */}
      <FadeUp duration={0.6} delay={0.5} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 64,
          color: 'var(--chalk-100)', letterSpacing: '0.02em',
        }}>
        I = I<sub style={{ fontSize: '0.55em', position: 'relative', top: '0.15em' }}>cm</sub>
        {' + Md²'}
      </FadeUp>

      {/* Two-term breakdown row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 90, marginTop: 4 }}>
        {/* I_cm column */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: diskFade,
          transform: `translateY(${(1 - diskFade) * 8}px)`,
          transition: 'none',
        }}>
          <MiniDisk angle={ang}/>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26,
            color: 'var(--amber-300)',
          }}>
            I<sub style={{ fontSize: '0.6em', position: 'relative', top: '0.15em' }}>cm</sub>
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.04em',
          }}>
            spin about its own centre
          </div>
        </div>

        {/* Plus sign */}
        <div style={{
          fontFamily: 'var(--font-serif)', fontSize: 40, color: 'var(--chalk-300)',
          marginTop: 26, opacity: Math.min(diskFade, orbitFade),
        }}>+</div>

        {/* Md² column */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: orbitFade,
          transform: `translateY(${(1 - orbitFade) * 8}px)`,
        }}>
          <MiniOrbit angle={ang}/>
          <div style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 26,
            color: 'var(--rose-300)',
          }}>
            Md²
          </div>
          <div style={{
            fontFamily: 'var(--font-sans)', fontSize: 13,
            color: 'var(--chalk-300)', letterSpacing: '0.04em',
          }}>
            centre carried around the pin
          </div>
        </div>
      </div>

      <FadeUp duration={0.5} delay={5.0} distance={10}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 19,
          color: 'var(--chalk-200)', textAlign: 'center', maxWidth: '52ch',
          marginTop: 6,
        }}>
        Two contributions: the body still spins, and its centre orbits the pin.
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Worked example — disk about its rim ─────────────────────────
function RimExample() {
  const { localTime } = useSprite();
  const SVG_W = 420, SVG_H = 360;
  const R = 110;
  const dcx = SVG_W / 2 - R;            // disk centre placed so pin sits at canvas centre x
  const dcy = SVG_H / 2;
  const pinX = dcx + R, pinY = dcy;     // pin at the rightmost edge

  // Rotate slowly about the pin to drive home that d = R is the orbit radius.
  const ROT_START = 1.4;
  const omega = 28 * Math.PI / 180;
  const angle = Math.max(0, localTime - ROT_START) * omega;
  const cosA = Math.cos(angle), sinA = Math.sin(angle);
  const cmX = pinX + R * cosA * -1 + 0; // CM starts to the left of pin: at angle 0, CM at (pin - R)
  const cmY = pinY + R * sinA;
  // Wait, simpler: CM = pin + d*(cos(π+angle), -sin(π+angle))
  // Start angle π puts CM to the left of pin. Use variable startAng = π.
  const startAng = Math.PI;
  const cmX2 = pinX + R * Math.cos(startAng + angle);
  const cmY2 = pinY - R * Math.sin(startAng + angle);

  const SPOKES = 6;
  const spokeR1 = R - 22, spokeR2 = R - 6;
  const spokes = Array.from({ length: SPOKES }, (_, i) => {
    const a = (startAng + angle) + (i / SPOKES) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    return (
      <line key={i}
            x1={cmX2 + spokeR1 * c} y1={cmY2 - spokeR1 * s}
            x2={cmX2 + spokeR2 * c} y2={cmY2 - spokeR2 * s}
            stroke="rgba(244,184,96,0.55)" strokeWidth={2}
            strokeLinecap="round"/>
    );
  });

  const fade = (t0, dur) => Math.max(0, Math.min(1, (localTime - t0) / dur));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 60,
    }}>
      {/* Diagram */}
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
           style={{ overflow: 'visible' }}>
        {/* Faint orbit circle of radius R that the CM traces */}
        <SvgFadeIn duration={0.5} delay={0.9}>
          <circle cx={pinX} cy={pinY} r={R}
                  fill="none" stroke="var(--rose-300)" strokeOpacity={0.4}
                  strokeWidth={1.3} strokeDasharray="5 6"/>
        </SvgFadeIn>

        {/* Disk */}
        <SvgFadeIn duration={0.5} delay={0.2}>
          {/* placeholder for fade timing */}
        </SvgFadeIn>
        <g opacity={fade(0.2, 0.5)}>
          <circle cx={cmX2} cy={cmY2} r={R}
                  fill="rgba(244,184,96,0.10)"
                  stroke="var(--amber-400)" strokeWidth={2.5}/>
          {spokes}
          <circle cx={cmX2} cy={cmY2} r={3.5} fill="var(--chalk-200)"/>
        </g>

        {/* Pin axis cross + 'P' label */}
        <SvgFadeIn duration={0.3} delay={0.4}>
          <line x1={pinX - 11} y1={pinY} x2={pinX + 11} y2={pinY}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <line x1={pinX} y1={pinY - 11} x2={pinX} y2={pinY + 11}
                stroke="var(--chalk-300)" strokeWidth={2}/>
          <circle cx={pinX} cy={pinY} r={4} fill="var(--chalk-100)"/>
          <text x={pinX + 14} y={pinY - 12}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize="13">P</text>
        </SvgFadeIn>

        {/* Dashed d = R segment from pin to CM */}
        <g opacity={fade(1.0, 0.4)}>
          <line x1={pinX} y1={pinY} x2={cmX2} y2={cmY2}
                stroke="var(--rose-300)" strokeWidth={1.6}
                strokeDasharray="4 4"/>
        </g>

        {/* d = R label — pinned above the static-equivalent midpoint so it
            stays readable as the disk swings */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <text x={(pinX + (pinX - R)) / 2} y={pinY - 14}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="22" textAnchor="middle">
            d = R
          </text>
        </SvgFadeIn>
      </svg>

      {/* Right: derivation column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, minWidth: 320 }}>
        <FadeUp duration={0.4} delay={0.0} distance={8}
          style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--amber-300)', letterSpacing: '0.14em',
            textTransform: 'uppercase',
          }}>
          disk pinned at its rim
        </FadeUp>
        <FadeUp duration={0.5} delay={2.5} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 30,
            color: 'var(--chalk-200)',
          }}>
          I<sub style={{ fontSize: '0.6em', position: 'relative', top: '0.15em' }}>rim</sub>
          {' = ½MR² + MR²'}
        </FadeUp>
        <FadeUp duration={0.6} delay={4.2} distance={14}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 52,
            color: 'var(--amber-300)', letterSpacing: '0.02em',
            marginTop: 6,
          }}>
          I<sub style={{ fontSize: '0.55em', position: 'relative', top: '0.15em' }}>rim</sub>
          {' = '}
          <span style={{ display: 'inline-block', textAlign: 'center', verticalAlign: 'middle' }}>
            <span style={{ display: 'block', fontSize: '0.55em', borderBottom: '2px solid currentColor', padding: '0 6px' }}>3</span>
            <span style={{ display: 'block', fontSize: '0.55em', padding: '0 6px' }}>2</span>
          </span>
          {' MR²'}
        </FadeUp>
        <FadeUp duration={0.5} delay={5.6} distance={10}
          style={{
            fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 19,
            color: 'var(--chalk-100)', maxWidth: '32ch', marginTop: 8,
          }}>
          About the rim → 3× the inertia about the centre.
        </FadeUp>
      </div>
    </div>
  );
}

// ─── Beat 5: Takeaway — I(d) is a parabola with minimum at d = 0 ─────────
function Takeaway() {
  const { localTime } = useSprite();

  // Axis box: x ∈ [-200, 200] → SVG x ∈ [60, 660]; y ∈ [0, 1.6 I_cm] mapped to
  // SVG y ∈ [bottom, top]. Curve: I(d) = I_cm + (d/d_max)² · I_cm  — visualised
  // with I_cm as the y-intercept.
  const SVG_W = 720, SVG_H = 320;
  const xMin = 60, xMax = 660;
  const yTop = 40, yBot = 270;

  const dRange = 200;       // max |d| in units
  const ICm = 1.0;          // baseline height (in arbitrary units)
  const xToSvg = (d) => xMin + ((d + dRange) / (2 * dRange)) * (xMax - xMin);
  const yToSvg = (I) => yBot - (I / 2.5) * (yBot - yTop);  // I-axis range 0..2.5

  // Parabola path
  const N = 60;
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const d = -dRange + t * 2 * dRange;
    const I = ICm + (d / dRange) * (d / dRange) * ICm;
    pts.push(`${xToSvg(d).toFixed(2)} ${yToSvg(I).toFixed(2)}`);
  }
  const curveD = `M ${pts.join(' L ')}`;

  const fade = (t0, dur) => Math.max(0, Math.min(1, (localTime - t0) / dur));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <svg width={SVG_W} height={SVG_H} viewBox={`0 0 ${SVG_W} ${SVG_H}`}
           style={{ overflow: 'visible' }}>
        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0}>
          <line x1={xMin} y1={yBot} x2={xMax} y2={yBot}
                stroke="var(--chalk-300)" strokeWidth={1.5}/>
          <line x1={(xMin + xMax) / 2} y1={yBot + 6} x2={(xMin + xMax) / 2} y2={yTop}
                stroke="var(--chalk-300)" strokeWidth={1.5} strokeDasharray="3 4"/>
          <text x={xMax + 8} y={yBot + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="18">d</text>
          <text x={(xMin + xMax) / 2 + 8} y={yTop + 4}
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="18">I</text>
          <text x={(xMin + xMax) / 2} y={yBot + 22}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize="12" textAnchor="middle">d = 0 (CM)</text>
        </SvgFadeIn>

        {/* Parabola */}
        <TraceIn d={curveD}
                 stroke="var(--amber-400)" strokeWidth={3}
                 duration={1.2} delay={0.4} pathLength={1000}/>

        {/* Marker at minimum */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <circle cx={(xMin + xMax) / 2} cy={yToSvg(ICm)} r={6}
                  fill="var(--amber-300)"/>
          <text x={(xMin + xMax) / 2 - 14} y={yToSvg(ICm) - 12}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize="18" textAnchor="end">
            I = I_cm
          </text>
        </SvgFadeIn>

        {/* Sample dot to the right showing it's higher */}
        <SvgFadeIn duration={0.4} delay={2.2}>
          {(() => {
            const dSample = 130;
            const ISample = ICm + (dSample / dRange) ** 2 * ICm;
            return (
              <>
                <circle cx={xToSvg(dSample)} cy={yToSvg(ISample)} r={5}
                        fill="var(--rose-400)"/>
                <text x={xToSvg(dSample) + 12} y={yToSvg(ISample) + 5}
                      fill="var(--rose-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize="16">
                  I_cm + Md²
                </text>
              </>
            );
          })()}
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.6} delay={1.8} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 22,
          color: 'var(--chalk-100)', textAlign: 'center', maxWidth: '54ch',
          borderTop: '1px solid rgba(232,220,193,0.12)', paddingTop: 16,
        }}>
        The centre of mass minimises the moment of inertia.
      </FadeUp>
    </div>
  );
}

// Expose narration to external tooling (TTS generation, subtitle export)
window.sceneNarration = NARRATION;

// ─── Mount ────────────────────────────────────────────────────────────────
function App() {
  return (
    <Stage width={1280} height={720} duration={SCENE_DURATION} background="#0c0a1f" loop={false}>
      <Scene/>
    </Stage>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
