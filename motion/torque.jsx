// Torque: Why Leverage Beats Force — Manimo lesson scene.
// Generated from motion/torque.spec.json. Standalone — sits alongside the
// rotational-mechanics scenes (moment-of-inertia, hoop-disk, steiners-theorem,
// centripetal-acceleration). Establishes τ = r × F before scenes that build
// on it (e.g. spinn / angular momentum, rigid-body equilibrium).
//
// Beats (timed to single-track narration in motion/audio/torque/):
//    0.00– 7.93  Manimo enters; hook question (door + hinge)
//    7.93–16.15  Lever arm: perpendicular force, τ = rF
//   16.15–28.47  Tilted force: decomposition into ⊥ and ∥ components, τ = rF sin θ
//   28.47–36.79  Sweep θ from 0° → 180°; τ traces a sine curve synchronously
//   36.79–45.00  Takeaway — leverage is geometry, not just force
//
// Authoring notes:
//   • All delays below are relative to the enclosing Sprite's start (localTime).
//   • SvgFadeIn for every element inside <svg>. FadeUp for HTML/DOM only.
//   • SceneChrome handles background, watermark, title block, corner Manimo.
//   • Beat 4 is the genuine-animation beat: a value-driven graph traces the
//     curve in sync with the rotating force vector — both read from the same
//     swept θ parameter, so the dot on the curve and the wrench's force
//     direction are mathematically locked together.

const SCENE_DURATION = 45;

// Narration script (one sentence per beat — source of truth for TTS/subtitles).
// NARRATION.length must equal the number of <Sprite> beats in Scene().
const NARRATION = [
  /*  0.00– 7.93 */ "Push a door near the hinge — almost nothing happens. Push at the handle, and it swings open. What's the difference?",
  /*  7.93–16.15 */ 'Apply a force at distance r from the pivot. When the force is perpendicular to the arm, the torque is simply r times F.',
  /* 16.15–28.47 */ 'Tilt the force at an angle theta to the arm. Only the perpendicular component, F sine theta, actually turns the lever — so the torque is r times F times sine theta.',
  /* 28.47–36.79 */ 'Sweep the angle from zero to one hundred eighty degrees and watch the torque trace a sine curve — peak at ninety, zero at the ends.',
  /* 36.79–45.00 */ 'Maximum at right angles, zero when the force points along the arm. Leverage is geometry, not just force.',
];

// Single continuous narration track — one ElevenLabs render covering the
// whole scene. Beat <Sprite start> values below match the audioStart
// offsets in motion/audio/torque/manifest.json so visuals
// land on the corresponding sentence in the audio.
const NARRATION_AUDIO = 'audio/torque/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="Scene 10 · rotational mechanics"
      title="Torque: Why Leverage Beats Force"
      duration={SCENE_DURATION}
      // Beat 1 is owned by SceneChrome's JourneyManimo.
      introEnd={7.93}
      introCaption="Same push, different leverage — what turns the door?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={7.93} end={16.15}>
        <LeverArm />
      </Sprite>

      <Sprite start={16.15} end={28.47}>
        <AngleMatters />
      </Sprite>

      <Sprite start={28.47} end={36.79}>
        <SweepAngle />
      </Sprite>

      <Sprite start={36.79} end={SCENE_DURATION}>
        <Takeaway />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Wrench helper ────────────────────────────────────────────────────────
// Single SVG fragment so all three diagram beats render the same wrench
// without subtle drift. Caller positions the pivot via (px, py) and supplies
// the handle length L. The wrench-head is drawn as a fattened rectangle at
// the tip (the working end of the wrench).
function WrenchArm({ px, py, L, color = 'var(--amber-400)', fadeDelay = 0 }) {
  const tipX = px + L;
  const handleW = 6;
  const headW = 22;
  const headH = 26;
  return (
    <SvgFadeIn duration={0.4} delay={fadeDelay}>
      {/* Pivot dot */}
      <circle cx={px} cy={py} r={5} fill="var(--chalk-200)"/>
      <circle cx={px} cy={py} r={2} fill="var(--bg-canvas)"/>
      {/* Handle */}
      <rect x={px} y={py - handleW / 2} width={L - headW / 2} height={handleW}
            fill={color} opacity={0.92} rx={2}/>
      {/* Head — small open jaw at the tip */}
      <rect x={tipX - headW / 2} y={py - headH / 2}
            width={headW} height={headH}
            fill="none" stroke={color} strokeWidth={2.5} rx={3}/>
      <rect x={tipX - headW / 2 + 4} y={py - 4}
            width={headW - 8} height={8}
            fill={color} opacity={0.85} rx={1.5}/>
    </SvgFadeIn>
  );
}

// ─── Beat 2: Lever arm — perpendicular force, τ = rF ──────────────────────
function LeverArm() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 380, px: 100, py: 130, L: 320,
        forceLen: 110, fontFmla: 50, fontLabel: 22, fontCap: 14 }
    : { vbW: 880, vbH: 360, px: 160, py: 120, L: 440,
        forceLen: 130, fontFmla: 56, fontLabel: 24, fontCap: 14 };
  const tipX = G.px + G.L;
  const tipY = G.py;
  const fEndY = tipY + G.forceLen;          // arrow points DOWN

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 16 : 18,
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <WrenchArm px={G.px} py={G.py} L={G.L} fadeDelay={0.3}/>

        {/* r bracket along the handle, above */}
        <SvgFadeIn duration={0.35} delay={1.0}>
          <line x1={G.px} y1={G.py - 36} x2={tipX} y2={G.py - 36}
                stroke="var(--chalk-200)" strokeWidth={1.3}/>
          <line x1={G.px} y1={G.py - 30} x2={G.px} y2={G.py - 42}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <line x1={tipX} y1={G.py - 30} x2={tipX} y2={G.py - 42}
                stroke="var(--chalk-200)" strokeWidth={1.5}/>
          <text x={(G.px + tipX) / 2} y={G.py - 48} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>r</text>
        </SvgFadeIn>

        {/* Right-angle marker at the tip — small square on the inside corner */}
        <SvgFadeIn duration={0.3} delay={2.4}>
          <path d={`M ${tipX - 12} ${tipY} L ${tipX - 12} ${tipY + 12} L ${tipX} ${tipY + 12}`}
                stroke="var(--chalk-300)" strokeWidth={1.2} fill="none"/>
        </SvgFadeIn>

        {/* Perpendicular force arrow F, pointing straight down */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          <line x1={tipX} y1={tipY} x2={tipX} y2={fEndY}
                stroke="var(--rose-400)" strokeWidth={3}/>
          <path d={`M ${tipX} ${fEndY} L ${tipX - 7} ${fEndY - 12} L ${tipX + 7} ${fEndY - 12} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>

        {/* F label, just to the right of the arrow tip */}
        <SvgFadeIn duration={0.35} delay={2.0}>
          <text x={tipX + 14} y={fEndY - 2}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>F</text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.6} delay={3.2} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: G.fontFmla, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        τ = rF
      </FadeUp>

      <FadeUp duration={0.5} delay={4.4} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: G.fontCap,
          color: 'var(--chalk-300)', letterSpacing: '0.02em',
          textAlign: 'center', maxWidth: portrait ? '28ch' : 'none',
        }}>
        perpendicular force × distance from pivot
      </FadeUp>
    </div>
  );
}

// ─── Beat 3: Angle matters — τ = rF sin θ ─────────────────────────────────
function AngleMatters() {
  const portrait = usePortrait();
  const G = portrait
    ? { vbW: 600, vbH: 400, px: 90, py: 200, L: 300,
        forceLen: 130, fontFmla: 44, fontLabel: 22, fontSmall: 16, fontCap: 13 }
    : { vbW: 880, vbH: 380, px: 150, py: 180, L: 420,
        forceLen: 150, fontFmla: 52, fontLabel: 24, fontSmall: 18, fontCap: 14 };
  const tipX = G.px + G.L;
  const tipY = G.py;

  // Force at angle θ above the negative-r direction. With theta measured from
  // the arm, we want F to angle AWAY from the wrench (pulling outward and up).
  // Pick θ = 50° for a clean visual that's neither perpendicular nor parallel.
  const theta = (50 * Math.PI) / 180;
  const fDx = Math.cos(theta);                 // force direction component along +x (along arm)
  const fDy = -Math.sin(theta);                // along -y (up on screen)
  const fEndX = tipX + G.forceLen * fDx;
  const fEndY = tipY + G.forceLen * fDy;
  // Decomposition: parallel (along +x, length F cos θ) and perpendicular
  // (along -y, length F sin θ). Both originate at the wrench tip.
  const parEndX = tipX + G.forceLen * Math.cos(theta);
  const parEndY = tipY;
  const perpEndX = tipX;
  const perpEndY = tipY - G.forceLen * Math.sin(theta);

  // θ arc: from the +x direction (along arm) sweeping CCW (i.e. toward -y in
  // SVG coords, which is "up") to the force direction.
  const arcR = 36;
  const arcStartX = tipX + arcR;
  const arcStartY = tipY;
  const arcEndX = tipX + arcR * fDx;
  const arcEndY = tipY + arcR * fDy;
  // For a 50° sweep in screen-CCW (toward -y), use sweep flag 0 in SVG (y-flipped).
  const arcD = `M ${arcStartX} ${arcStartY} A ${arcR} ${arcR} 0 0 0 ${arcEndX.toFixed(2)} ${arcEndY.toFixed(2)}`;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 18 : 22,
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        <WrenchArm px={G.px} py={G.py} L={G.L} fadeDelay={0.0}/>

        {/* Tilted full force F */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <line x1={tipX} y1={tipY} x2={fEndX.toFixed(2)} y2={fEndY.toFixed(2)}
                stroke="var(--rose-400)" strokeWidth={3}/>
          {/* arrowhead aligned to (fDx, fDy) */}
          <path d={`
            M ${fEndX.toFixed(2)} ${fEndY.toFixed(2)}
            L ${(fEndX - 12 * fDx + 6 * fDy).toFixed(2)} ${(fEndY - 12 * fDy - 6 * fDx).toFixed(2)}
            L ${(fEndX - 12 * fDx - 6 * fDy).toFixed(2)} ${(fEndY - 12 * fDy + 6 * fDx).toFixed(2)} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>

        {/* F label */}
        <SvgFadeIn duration={0.35} delay={0.9}>
          <text x={fEndX + 8 * fDx + 6} y={fEndY + 8 * fDy - 4}
                fill="var(--rose-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>F</text>
        </SvgFadeIn>

        {/* θ arc */}
        <SvgFadeIn duration={0.35} delay={1.2}>
          <path d={arcD} fill="none" stroke="var(--chalk-300)" strokeWidth={1.4}/>
        </SvgFadeIn>

        {/* θ label inside the arc */}
        <SvgFadeIn duration={0.3} delay={1.4}>
          <text x={tipX + (arcR + 14) * Math.cos(theta / 2)}
                y={tipY + (arcR + 14) * (-Math.sin(theta / 2)) + 5}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>θ</text>
        </SvgFadeIn>

        {/* Parallel component (along arm) — dimmed */}
        <SvgFadeIn duration={0.4} delay={2.4}>
          <line x1={tipX} y1={tipY} x2={parEndX.toFixed(2)} y2={parEndY}
                stroke="var(--chalk-300)" strokeWidth={2}
                strokeDasharray="5 4"/>
          <path d={`M ${parEndX.toFixed(2)} ${parEndY}
                    L ${(parEndX - 10).toFixed(2)} ${parEndY - 5}
                    L ${(parEndX - 10).toFixed(2)} ${parEndY + 5} Z`}
                fill="var(--chalk-300)"/>
        </SvgFadeIn>

        {/* Perpendicular component (the only one that creates torque) */}
        <SvgFadeIn duration={0.45} delay={2.0}>
          <line x1={tipX} y1={tipY} x2={perpEndX} y2={perpEndY.toFixed(2)}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <path d={`M ${perpEndX} ${perpEndY.toFixed(2)}
                    L ${perpEndX - 6} ${(perpEndY + 11).toFixed(2)}
                    L ${perpEndX + 6} ${(perpEndY + 11).toFixed(2)} Z`}
                fill="var(--amber-300)"/>
        </SvgFadeIn>

        {/* F sin θ label on the perpendicular component */}
        <SvgFadeIn duration={0.35} delay={2.8}>
          <text x={perpEndX - 10} y={(tipY + perpEndY) / 2 + 6}
                textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontSmall}>F sin θ</text>
        </SvgFadeIn>

        {/* F cos θ label on the parallel component */}
        <SvgFadeIn duration={0.35} delay={3.0}>
          <text x={(tipX + parEndX) / 2} y={tipY + 22} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontSmall}>F cos θ</text>
        </SvgFadeIn>

        {/* Caption beneath the diagram */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          <text x={G.vbW / 2} y={G.vbH - 18} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCap} letterSpacing="0.02em">
            only the perpendicular part actually turns it
          </text>
        </SvgFadeIn>
      </svg>

      <FadeUp duration={0.6} delay={5.6} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: G.fontFmla, color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        τ = rF sin θ
      </FadeUp>
    </div>
  );
}

// ─── Beat 4: Sweep θ — genuine value-driven animation ─────────────────────
// Single swept parameter (theta) drives BOTH the force-vector direction at the
// wrench tip AND the (θ, τ) position on the τ vs θ graph below. The graph
// curve is rendered up to the current θ — so the curve "draws itself" as the
// force rotates, and the marker dot stays mathematically locked to the
// rotating arrow. This is the genuine-animation beat per CLAUDE.md.
function SweepAngle() {
  const portrait = usePortrait();
  const G = portrait
    ? {
        // Wrench panel
        vbW: 660, wrenchH: 360, px: 120, py: 220, L: 280, forceLen: 110,
        // Graph panel
        graphX: 80, graphY: 460, graphW: 500, graphH: 230,
        // Sweep timing
        sweepDelay: 0.6, sweepDur: 9.0,
        fontLabel: 18, fontTau: 26, fontCap: 13, fontAxis: 12,
        totalH: 730,
      }
    : {
        vbW: 880, wrenchH: 290, px: 70, py: 170, L: 320, forceLen: 100,
        graphX: 540, graphY: 60, graphW: 290, graphH: 220,
        sweepDelay: 0.6, sweepDur: 9.0,
        fontLabel: 18, fontTau: 24, fontCap: 13, fontAxis: 12,
        totalH: 360,
      };
  const tipX = G.px + G.L;
  const tipY = G.py;

  const { localTime } = useSprite();
  // Sweep θ from 0° (along arm, no torque) to 180° (anti-parallel, no torque).
  const sweepProgress = Math.max(0, Math.min(1,
    (localTime - G.sweepDelay) / G.sweepDur));
  const theta = sweepProgress * Math.PI;            // 0 .. π radians
  const thetaDeg = theta * 180 / Math.PI;
  const sinT = Math.sin(theta);
  const cosT = Math.cos(theta);

  // Force vector: rotates around the wrench tip. At θ=0 it points along +x
  // (away from pivot); at θ=π/2 it points up (-y on screen); at θ=π it points
  // along -x (back toward pivot). So unit dir = (cos θ, -sin θ).
  const fDx = cosT;
  const fDy = -sinT;
  const fEndX = tipX + G.forceLen * fDx;
  const fEndY = tipY + G.forceLen * fDy;

  // τ as a fraction of rF (max). torque = rF·sin θ → fraction = sin θ ∈ [0,1].
  const tauFrac = sinT;

  // Graph mapping. x: 0°..180° → [graphX, graphX+graphW]. y: 0..rF →
  // [graphY+graphH, graphY] (inverted).
  const xAt = (deg) => G.graphX + (deg / 180) * G.graphW;
  const yAt = (frac) => G.graphY + G.graphH - frac * G.graphH;

  // Build the curve up to the current θ — recomputed every frame.
  const SAMPLES = 90;
  const upTo = Math.max(0, Math.floor(SAMPLES * sweepProgress));
  let curveD = '';
  for (let i = 0; i <= upTo; i++) {
    const deg = (i / SAMPLES) * 180;
    const fr = Math.sin((deg * Math.PI) / 180);
    curveD += (i === 0 ? 'M ' : 'L ') + xAt(deg).toFixed(2) + ' ' + yAt(fr).toFixed(2) + ' ';
  }
  // Add the current point exactly so the marker sits on the curve end.
  curveD += `L ${xAt(thetaDeg).toFixed(2)} ${yAt(tauFrac).toFixed(2)}`;

  // θ readout — pinned near the wrench tip, doesn't overlap the rotating arrow.
  const readoutX = tipX - 60;
  const readoutY = tipY + (portrait ? 56 : 58);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.totalH} viewBox={`0 0 ${G.vbW} ${G.totalH}`} style={{ overflow: 'visible' }}>
        {/* Wrench (always visible during the sweep beat) */}
        <WrenchArm px={G.px} py={G.py} L={G.L} fadeDelay={0.0}/>

        {/* Faint reference circle around the tip showing the swept range */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          {/* Half-circle from +x (right) sweeping up to -x (left) */}
          <path d={`M ${tipX + G.forceLen} ${tipY} A ${G.forceLen} ${G.forceLen} 0 0 0 ${tipX - G.forceLen} ${tipY}`}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="4 5" opacity={0.6}/>
        </SvgFadeIn>

        {/* Force vector — rotates with theta */}
        <SvgFadeIn duration={0.35} delay={0.6}>
          <line x1={tipX} y1={tipY} x2={fEndX.toFixed(2)} y2={fEndY.toFixed(2)}
                stroke="var(--rose-400)" strokeWidth={2.8}/>
          <path d={`
            M ${fEndX.toFixed(2)} ${fEndY.toFixed(2)}
            L ${(fEndX - 11 * fDx + 5.5 * fDy).toFixed(2)} ${(fEndY - 11 * fDy - 5.5 * fDx).toFixed(2)}
            L ${(fEndX - 11 * fDx - 5.5 * fDy).toFixed(2)} ${(fEndY - 11 * fDy + 5.5 * fDx).toFixed(2)} Z`}
                fill="var(--rose-400)"/>
        </SvgFadeIn>

        {/* θ readout (live) */}
        <SvgFadeIn duration={0.4} delay={0.6}>
          <text x={readoutX} y={readoutY}
                fill="var(--chalk-200)" fontFamily="var(--font-mono)"
                fontSize={G.fontLabel} letterSpacing="0.06em">
            θ = {thetaDeg.toFixed(0).padStart(3)}°
          </text>
        </SvgFadeIn>

        {/* ── Graph: τ vs θ ─────────────────────────────────────────── */}

        {/* Axes */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          {/* x axis */}
          <line x1={G.graphX} y1={G.graphY + G.graphH}
                x2={G.graphX + G.graphW} y2={G.graphY + G.graphH}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          {/* y axis */}
          <line x1={G.graphX} y1={G.graphY}
                x2={G.graphX} y2={G.graphY + G.graphH}
                stroke="var(--chalk-300)" strokeWidth={1.4}/>
          {/* x ticks 0, 90, 180 */}
          {[0, 90, 180].map((d) => (
            <g key={d}>
              <line x1={xAt(d)} y1={G.graphY + G.graphH}
                    x2={xAt(d)} y2={G.graphY + G.graphH + 5}
                    stroke="var(--chalk-300)" strokeWidth={1.2}/>
              <text x={xAt(d)} y={G.graphY + G.graphH + 18} textAnchor="middle"
                    fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                    fontSize={G.fontAxis}>{d}°</text>
            </g>
          ))}
          {/* y tick at top (rF) */}
          <line x1={G.graphX - 5} y1={yAt(1)} x2={G.graphX} y2={yAt(1)}
                stroke="var(--chalk-300)" strokeWidth={1.2}/>
          <text x={G.graphX - 8} y={yAt(1) + 4} textAnchor="end"
                fill="var(--chalk-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontAxis}>rF</text>
          {/* axis labels */}
          <text x={G.graphX + G.graphW + 8} y={G.graphY + G.graphH + 4}
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>θ</text>
          <text x={G.graphX - 8} y={G.graphY - 6} textAnchor="end"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>τ</text>
        </SvgFadeIn>

        {/* Curve (re-rendered every frame, up to current θ) */}
        <SvgFadeIn duration={0.3} delay={0.8}>
          <path d={curveD} fill="none" stroke="var(--rose-400)"
                strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"/>
        </SvgFadeIn>

        {/* Marker dot at current (θ, τ) */}
        <SvgFadeIn duration={0.3} delay={0.8}>
          <circle cx={xAt(thetaDeg)} cy={yAt(tauFrac)}
                  r={5.5} fill="var(--amber-300)"
                  stroke="var(--bg-canvas)" strokeWidth={1.5}/>
        </SvgFadeIn>

        {/* Live τ readout next to the marker */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <text x={xAt(thetaDeg) + 12} y={yAt(tauFrac) - 8}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontAxis} letterSpacing="0.04em">
            {tauFrac.toFixed(2)} rF
          </text>
        </SvgFadeIn>

        {/* Caption beneath the graph */}
        <SvgFadeIn duration={0.4} delay={9.5}>
          <text x={G.graphX + G.graphW / 2} y={G.graphY + G.graphH + 42}
                textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontCap} letterSpacing="0.02em">
            max at θ = 90° — zero at the ends
          </text>
        </SvgFadeIn>
      </svg>
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
          fontSize: portrait ? 24 : 28,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '52ch',
          lineHeight: 1.3,
        }}>
        Push perpendicular to the arm — full leverage. Push along it — none.
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.10em',
          textAlign: 'center', maxWidth: portrait ? '36ch' : 'none',
          lineHeight: 1.5,
        }}>
        (τ = r × F — a vector, with the cross product encoding both magnitude and rotation axis)
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
