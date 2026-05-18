// Source Transformations: A Battery and a Current Source Are the Same Thing —
// Manimo lesson scene.
//
// A Thévenin source (V_s in series with R) and a Norton source (I_N = V_s/R
// in parallel with R) deliver identical voltage and current to any load they
// share. Beat 3 is the genuine animation: the battery cross-fades into a
// circle-with-arrow current source, the series resistor rotates from the top
// wire to a vertical position in parallel with the source, and the current
// dots redirect to match the new topology.
//
// Beats (placeholder timings — rewire-scene.js overwrites once audio exists):
//    0.00– 5.00  Manimo enters; hook
//    5.00–16.00  Thévenin network — V_s + series R drives R_L, current loop
//   16.00–30.00  Morph — battery → current arrow, R rotates to parallel
//   30.00–42.00  Open-circuit + short-circuit tests prove the equivalence
//   42.00–50.00  Takeaway: nodal loves I-sources, mesh loves V-sources
//
// Authoring notes:
//   • SvgFadeIn inside <svg>, FadeUp for HTML/DOM.
//   • Morph timing in MorphBeat is driven by useSprite()'s localTime — the
//     resistor's rotation, the source-symbol crossfade, and the current-dot
//     redirection are all clamps on the same time axis so they stay in sync.

const SCENE_DURATION = 56;

const NARRATION = [
  /*  0.00– 5.00 */ "From the load's point of view — can a battery and a current source ever look identical?",
  /*  5.00–16.00 */ 'Start with a voltage source V s in series with a resistor R, driving a load. The load sees a current of V s divided by the sum of R and the load resistance.',
  /* 16.00–30.00 */ 'Now watch — the battery becomes a current source of V s over R, and the resistor swings from series to parallel. Two completely different drawings, but from the load’s terminals they are indistinguishable.',
  /* 30.00–42.00 */ 'The proof is two simple tests. Open the terminals — both deliver the same voltage V s. Short them — both deliver the same current V s over R. Two conditions, two unknowns: the equivalence is exact.',
  /* 42.00–50.00 */ 'Use whichever face makes the algebra easier — nodal analysis loves current sources, mesh analysis loves voltage sources. Swap on demand.',
];

const NARRATION_AUDIO = 'audio/source-transformations/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="circuit equivalence"
      title="Source Transformations"
      duration={SCENE_DURATION}
      introEnd={5.25}
      introCaption="Two faces of the same circuit."
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.25} end={16.72}>
        <TheveninBeat />
      </Sprite>

      <Sprite start={16.72} end={28.98}>
        <MorphBeat />
      </Sprite>

      <Sprite start={28.98} end={44.47}>
        <ProofBeat />
      </Sprite>

      <Sprite start={44.47} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Resistor zigzag (horizontal or vertical) ──────────────────────────────
// Helper used in both TheveninBeat and MorphBeat. Renders a 6-segment zigzag
// running between (x1,y1) and (x2,y2). Horizontal: zigzag bulges up/down.
// Vertical: zigzag bulges left/right. Amplitude controls the bulge.
function resistorPath(x1, y1, x2, y2, amp = 18) {
  const N = 6;
  const dx = (x2 - x1) / N;
  const dy = (y2 - y1) / N;
  // Perpendicular unit vector for the bulge.
  const len = Math.hypot(x2 - x1, y2 - y1) || 1;
  const px = -((y2 - y1) / len);
  const py = (x2 - x1) / len;
  const pts = [`M ${x1} ${y1}`];
  for (let i = 1; i < N; i++) {
    const cx = x1 + i * dx;
    const cy = y1 + i * dy;
    const sign = i % 2 === 1 ? 1 : -1;
    pts.push(`L ${(cx + sign * amp * px).toFixed(1)} ${(cy + sign * amp * py).toFixed(1)}`);
  }
  pts.push(`L ${x2} ${y2}`);
  return pts.join(' ');
}

// ─── Beat 2: Thévenin network ──────────────────────────────────────────────
// Rectangular loop. Battery on the left vertical. Series R on the top wire.
// Load R_L on the right vertical. Current dots circle the loop clockwise.
function TheveninBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 640, left: 110, right: 490, top: 110, bot: 560,
        battH: 70, fontLabel: 20, fontFormula: 22, formulaY: 620 }
    : { vbW: 880, vbH: 380, left: 200, right: 700, top: 80, bot: 320,
        battH: 70, fontLabel: 20, fontFormula: 22, formulaY: 370 };

  const midY = (G.top + G.bot) / 2;
  const battTop = midY - G.battH / 2;
  const battBot = midY + G.battH / 2;
  // R on top wire — centred between left and right verticals
  const rTopLeft = G.left + (G.right - G.left) * 0.32;
  const rTopRight = G.left + (G.right - G.left) * 0.68;
  // R_L on right vertical (between top wire and bottom wire)
  const rlTop = G.top + 30;
  const rlBot = G.bot - 30;

  // Current dots: cycle around loop at constant pace starting at delay 2.0.
  const segs = [
    { x1: G.left, y1: G.top, x2: G.right, y2: G.top, len: G.right - G.left },
    { x1: G.right, y1: G.top, x2: G.right, y2: G.bot, len: G.bot - G.top },
    { x1: G.right, y1: G.bot, x2: G.left, y2: G.bot, len: G.right - G.left },
    { x1: G.left, y1: G.bot, x2: G.left, y2: G.top, len: G.bot - G.top },
  ];
  const perimeter = segs.reduce((s, x) => s + x.len, 0);
  function dotAt(distance) {
    let d = ((distance % perimeter) + perimeter) % perimeter;
    for (const s of segs) {
      if (d <= s.len) {
        const f = d / s.len;
        return [s.x1 + (s.x2 - s.x1) * f, s.y1 + (s.y2 - s.y1) * f];
      }
      d -= s.len;
    }
    return [0, 0];
  }
  const dotsT = Math.max(0, localTime - 2.0);
  const speed = 90;
  const dotCount = 6;
  const dots = Array.from({ length: dotCount }, (_, i) =>
    dotAt(speed * dotsT + (i / dotCount) * perimeter));

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Left vertical (split around battery) */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.left} y1={G.top} x2={G.left} y2={battTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.left} y1={battBot} x2={G.left} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Battery V_s */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.left - 22} y1={battTop} x2={G.left + 22} y2={battTop}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.left - 12} y1={battTop + 14} x2={G.left + 12} y2={battTop + 14}
                stroke="var(--amber-300)" strokeWidth={2.5}/>
          <line x1={G.left - 22} y1={battBot - 14} x2={G.left + 22} y2={battBot - 14}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.left - 12} y1={battBot} x2={G.left + 12} y2={battBot}
                stroke="var(--amber-300)" strokeWidth={2.5}/>
          <text x={G.left - 36} y={midY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>s</tspan>
          </text>
        </SvgFadeIn>

        {/* Top wire — split around the series R */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.left} y1={G.top} x2={rTopLeft} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={rTopRight} y1={G.top} x2={G.right} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Series R on top wire */}
        <SvgFadeIn duration={0.5} delay={0.6}>
          <path d={resistorPath(rTopLeft, G.top, rTopRight, G.top, 16)}
                fill="none" stroke="var(--amber-400)" strokeWidth={2.4}/>
          <text x={(rTopLeft + rTopRight) / 2} y={G.top - 22} textAnchor="middle"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>R</text>
        </SvgFadeIn>

        {/* Right vertical (split around R_L) */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <line x1={G.right} y1={G.top} x2={G.right} y2={rlTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.right} y1={rlBot} x2={G.right} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* R_L */}
        <SvgFadeIn duration={0.5} delay={1.0}>
          <path d={resistorPath(G.right, rlTop, G.right, rlBot, 16)}
                fill="none" stroke="var(--chalk-100)" strokeWidth={2.4}/>
          <text x={G.right + 28} y={(rlTop + rlBot) / 2 + 5} textAnchor="start"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            R<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>L</tspan>
          </text>
        </SvgFadeIn>

        {/* Bottom wire */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.left} y1={G.bot} x2={G.right} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Terminal labels A and B */}
        <SvgFadeIn duration={0.4} delay={1.4}>
          <circle cx={G.right - 60} cy={G.top} r={4} fill="var(--rose-400)"/>
          <text x={G.right - 60} y={G.top - 12} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={12}
                letterSpacing="0.1em">A</text>
          <circle cx={G.right - 60} cy={G.bot} r={4} fill="var(--rose-400)"/>
          <text x={G.right - 60} y={G.bot + 22} textAnchor="middle"
                fill="var(--rose-300)" fontFamily="var(--font-mono)" fontSize={12}
                letterSpacing="0.1em">B</text>
        </SvgFadeIn>

        {/* Current dots */}
        {localTime >= 2.0 && (
          <g>
            {dots.map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={4} fill="var(--amber-300)"/>
            ))}
          </g>
        )}

        {/* Formula appears once the loop is humming */}
        <SvgFadeIn duration={0.5} delay={4.0}>
          <text x={G.vbW / 2} y={G.formulaY} textAnchor="middle"
                fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontFormula}>
            I<tspan baselineShift="sub" fontSize={G.fontFormula * 0.6}>L</tspan> = V<tspan baselineShift="sub" fontSize={G.fontFormula * 0.6}>s</tspan> / (R + R<tspan baselineShift="sub" fontSize={G.fontFormula * 0.6}>L</tspan>)
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Morph — battery → current source, series R → parallel R ───────
// Genuine animation. Source-symbol crossfade (battery opacity drops, current-
// source circle opacity rises) and resistor rotation are both driven by
// useSprite() localTime. The R-position interpolation goes from horizontal-
// on-top-wire to vertical-in-parallel-with-the-source via easeInOutCubic.
function MorphBeat() {
  const portrait = usePortrait();
  const { localTime } = useSprite();

  const G = portrait
    ? { vbW: 600, vbH: 680, srcX: 150, sinkX: 460, top: 110, bot: 540,
        battH: 70, fontLabel: 19, fontFormula: 20,
        formulaY: 600, captionY: 640 }
    : { vbW: 900, vbH: 380, srcX: 240, sinkX: 700, top: 80, bot: 320,
        battH: 70, fontLabel: 19, fontFormula: 20,
        formulaY: 360, captionY: 388 };

  const midY = (G.top + G.bot) / 2;
  const battTop = midY - G.battH / 2;
  const battBot = midY + G.battH / 2;
  const rlTop = G.top + 30;
  const rlBot = G.bot - 30;

  // Morph progress in [0,1]. Crossfade starts at delay 1.5, rotation at 2.4.
  const xfade = clamp((localTime - 1.5) / 1.0, 0, 1);
  const rot = clamp((localTime - 2.4) / 1.6, 0, 1);
  // Ease the rotation so it feels weighted.
  const rotE = rot < 0.5 ? 2 * rot * rot : 1 - Math.pow(-2 * rot + 2, 2) / 2;

  // Series-R endpoints (start) and parallel-R endpoints (end).
  // Series: along the top wire from (rTopL, top) → (rTopR, top).
  const rTopL = G.srcX + (G.sinkX - G.srcX) * 0.32;
  const rTopR = G.srcX + (G.sinkX - G.srcX) * 0.68;
  // Parallel: vertical, right of the source, from (rParX, rlTop) → (rParX, rlBot).
  const rParX = G.srcX + 90;

  // Interpolate the two endpoints of R from series → parallel.
  const lerp = (a, b, t) => a + (b - a) * t;
  const rA = [lerp(rTopL, rParX, rotE), lerp(G.top, rlTop, rotE)];
  const rB = [lerp(rTopR, rParX, rotE), lerp(G.top, rlBot, rotE)];

  // Current arrow (Norton source) anatomy: a circle with an upward arrow
  // inside. Lives at the same x as the battery.
  const srcR = 22;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '52%' : '54%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`} style={{ overflow: 'visible' }}>
        {/* Left vertical wire (always present) — split around source */}
        <SvgFadeIn duration={0.4} delay={0.2}>
          <line x1={G.srcX} y1={G.top} x2={G.srcX} y2={battTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.srcX} y1={battBot} x2={G.srcX} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* Battery — fades out as xfade increases */}
        <g opacity={1 - xfade}>
          <line x1={G.srcX - 22} y1={battTop} x2={G.srcX + 22} y2={battTop}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.srcX - 12} y1={battTop + 14} x2={G.srcX + 12} y2={battTop + 14}
                stroke="var(--amber-300)" strokeWidth={2.5}/>
          <line x1={G.srcX - 22} y1={battBot - 14} x2={G.srcX + 22} y2={battBot - 14}
                stroke="var(--amber-300)" strokeWidth={3}/>
          <line x1={G.srcX - 12} y1={battBot} x2={G.srcX + 12} y2={battBot}
                stroke="var(--amber-300)" strokeWidth={2.5}/>
          <text x={G.srcX - 36} y={midY + 6} textAnchor="end"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>s</tspan>
          </text>
        </g>

        {/* Current source — fades in as xfade increases. Circle with an
            up-pointing arrow inside indicating the current direction. */}
        <g opacity={xfade}>
          <circle cx={G.srcX} cy={midY} r={srcR}
                  fill="none" stroke="var(--amber-300)" strokeWidth={2.5}/>
          <line x1={G.srcX} y1={midY + srcR - 6} x2={G.srcX} y2={midY - srcR + 8}
                stroke="var(--amber-300)" strokeWidth={2.4}/>
          <path d={`M ${G.srcX} ${midY - srcR + 4} L ${G.srcX - 5} ${midY - srcR + 12} L ${G.srcX + 5} ${midY - srcR + 12} Z`}
                fill="var(--amber-300)"/>
        </g>

        {/* Top wire — fades out as the resistor leaves the top.
            When rot=1, the R is parallel, so the top wire becomes a single
            unbroken line from src → sink. We always draw the full top wire
            beneath the resistor, with the wire's stroke representing the
            connection regardless of where R sits. */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <line x1={G.srcX} y1={G.top}
                x2={lerp(rTopL, G.sinkX, rotE)} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={lerp(rTopR, G.sinkX, rotE)} y1={G.top}
                x2={G.sinkX} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* R — animates between series (top wire) and parallel (vertical). */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <path d={resistorPath(rA[0], rA[1], rB[0], rB[1], 14)}
                fill="none" stroke="var(--amber-400)" strokeWidth={2.4}/>
          {/* Label follows the resistor's midpoint, offset perpendicularly. */}
          {(() => {
            const mx = (rA[0] + rB[0]) / 2;
            const my = (rA[1] + rB[1]) / 2;
            // Below the resistor in series, right of resistor in parallel.
            const lx = lerp(mx, mx + 26, rotE);
            const ly = lerp(my - 22, my + 5, rotE);
            return (
              <text x={lx} y={ly} textAnchor="middle"
                    fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontLabel}>R</text>
            );
          })()}
        </SvgFadeIn>

        {/* Top wire from src to sink that connects when R goes parallel.
            When rot >= 0.6, draw the parallel top-wire connector from src
            to sink that bypasses the now-vertical R (since R is now
            vertical at rParX, the top wire above it is intact). */}
        {rotE > 0.5 && (
          <line x1={G.srcX} y1={G.top} x2={G.sinkX} y2={G.top}
                stroke="var(--chalk-200)" strokeWidth={2}
                opacity={(rotE - 0.5) * 2}/>
        )}

        {/* Sink vertical (load) and bottom wire — always present */}
        <SvgFadeIn duration={0.4} delay={0.8}>
          <line x1={G.sinkX} y1={G.top} x2={G.sinkX} y2={rlTop}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <line x1={G.sinkX} y1={rlBot} x2={G.sinkX} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
          <path d={resistorPath(G.sinkX, rlTop, G.sinkX, rlBot, 14)}
                fill="none" stroke="var(--chalk-100)" strokeWidth={2.4}/>
          <text x={G.sinkX + 28} y={(rlTop + rlBot) / 2 + 5} textAnchor="start"
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            R<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>L</tspan>
          </text>
        </SvgFadeIn>

        {/* Bottom wire */}
        <SvgFadeIn duration={0.4} delay={0.5}>
          <line x1={G.srcX} y1={G.bot} x2={G.sinkX} y2={G.bot}
                stroke="var(--chalk-200)" strokeWidth={2}/>
        </SvgFadeIn>

        {/* I_N = V_s / R label, appears above current source after morph */}
        <SvgFadeIn duration={0.4} delay={5.0}>
          <text x={G.srcX} y={G.top - 16} textAnchor="middle"
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            I<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>N</tspan> = V<tspan baselineShift="sub" fontSize={G.fontLabel * 0.65}>s</tspan> / R
          </text>
        </SvgFadeIn>

        {/* R_N = R label, appears once R is parallel */}
        {rotE > 0.7 && (
          <SvgFadeIn duration={0.4} delay={5.6}>
            <text x={rParX + 30} y={(rlTop + rlBot) / 2 - 18} textAnchor="start"
                  fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                  fontStyle="italic" fontSize={G.fontLabel - 1}>
              R<tspan baselineShift="sub" fontSize={G.fontLabel * 0.6}>N</tspan> = R
            </text>
          </SvgFadeIn>
        )}

        {/* Equivalence caption */}
        <SvgFadeIn duration={0.5} delay={7.0}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={portrait ? 13 : 14} letterSpacing="0.02em">
            {portrait
              ? 'V-source ⊕ series R   ≡   I-source ‖ parallel R'
              : 'voltage source in series with R   ≡   current source in parallel with R'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Open-circuit + short-circuit tests prove the equivalence ──────
function ProofBeat() {
  const portrait = usePortrait();
  const titleStyle = {
    fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.14em', textTransform: 'uppercase',
  };
  const formulaStyle = {
    fontFamily: 'var(--font-serif)', fontStyle: 'italic',
    fontSize: portrait ? 30 : 34, letterSpacing: '0.02em',
  };
  const captionStyle = {
    fontFamily: 'var(--font-sans)', fontSize: portrait ? 13 : 14,
    color: 'var(--chalk-300)', textAlign: 'center',
    maxWidth: portrait ? '22ch' : '26ch', lineHeight: 1.35,
  };

  const OcCell = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <FadeUp duration={0.4} delay={0.2} distance={6}
        style={{ ...titleStyle, color: 'var(--amber-300)' }}>
        Open-circuit test
      </FadeUp>
      <FadeUp duration={0.5} delay={0.7} distance={10}
        style={{ ...formulaStyle, color: 'var(--chalk-100)' }}>
        V<sub style={{ fontSize: '0.6em' }}>OC</sub> = V<sub style={{ fontSize: '0.6em' }}>s</sub>
      </FadeUp>
      <FadeUp duration={0.5} delay={1.3} distance={8}
        style={captionStyle}>
        no current flows — all of V<sub style={{ fontSize: '0.8em' }}>s</sub> appears at the terminals
      </FadeUp>
    </div>
  );
  const ScCell = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <FadeUp duration={0.4} delay={4.0} distance={6}
        style={{ ...titleStyle, color: 'var(--rose-300)' }}>
        Short-circuit test
      </FadeUp>
      <FadeUp duration={0.5} delay={4.5} distance={10}
        style={{ ...formulaStyle, color: 'var(--chalk-100)' }}>
        I<sub style={{ fontSize: '0.6em' }}>SC</sub> = V<sub style={{ fontSize: '0.6em' }}>s</sub> / R
      </FadeUp>
      <FadeUp duration={0.5} delay={5.1} distance={8}
        style={captionStyle}>
        all current routes through the shorted terminals
      </FadeUp>
    </div>
  );

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: portrait ? 30 : 42,
    }}>
      {portrait ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                      gap: 30 }}>
          {OcCell}
          <div style={{ width: 80, height: 1, background: 'rgba(232,220,193,0.18)' }}/>
          {ScCell}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 110, alignItems: 'flex-start',
                      paddingTop: 8 }}>
          {OcCell}
          <div style={{ width: 1, height: 130,
                        background: 'rgba(232,220,193,0.18)', marginTop: 18 }}/>
          {ScCell}
        </div>
      )}

      <FadeUp duration={0.6} delay={8.0} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 18 : 22, color: 'var(--amber-300)',
          textAlign: 'center', maxWidth: portrait ? '24ch' : '46ch',
          lineHeight: 1.3,
        }}>
        both pairs match — the networks are interchangeable
      </FadeUp>
    </div>
  );
}

// ─── Beat 5: Takeaway ──────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={12}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 32,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '36ch',
          lineHeight: 1.3,
        }}>
        Pick the face that fits the method.
      </FadeUp>

      <FadeUp duration={0.6} delay={1.4} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 36 : 48,
          color: 'var(--amber-300)', letterSpacing: '0.02em',
        }}>
        V<sub style={{ fontSize: '0.55em' }}>s</sub>  ⇌  I<sub style={{ fontSize: '0.55em' }}>N</sub> · R
      </FadeUp>

      <FadeUp duration={0.5} delay={2.8} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          textTransform: 'uppercase', marginTop: 6,
          textAlign: 'center', maxWidth: portrait ? '30ch' : 'none',
          lineHeight: 1.4,
        }}>
        nodal → current source · mesh → voltage source
      </FadeUp>
    </div>
  );
}

// Expose narration for TTS / subtitle export.
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
