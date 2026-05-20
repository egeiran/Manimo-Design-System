// The Power Triangle — Manimo lesson scene.
// AC power decomposes into three quantities related by a right triangle:
// real power P (watts), reactive power Q (vars), and apparent power S
// (volt-amps). The phase angle φ between voltage and current sets how
// each one slices out of the apparent power. Sweep φ and the triangle
// morphs; the power-factor readout falls from one to zero.
//
// Beats (placeholder timings — overwritten by rewire-scene.js):
//    0.00– 6.00  Manimo intro — not every volt-amp does work
//    6.00–18.00  V(t) leads, I(t) lags by φ on stacked scopes
//   18.00–30.00  Decompose I into in-phase (P) and quadrature (Q) components
//   30.00–44.00  Sweep φ from 0° to 90° — triangle morphs, PF readout falls
//   44.00–50.00  Takeaway — utilities bill for apparent power
//
// Authoring notes:
//   • Beat 4 ("sweepPhi") is THE motion beat: useSprite() drives φ as a
//     triangle wave from ~5° to ~85°, and P, Q, |S| and cos φ are all
//     computed each frame so the readouts and triangle edges stay coherent.
//   • Beat 2 (waveforms) is also motion-rich: the I(t) trace draws in
//     beneath V(t) with a clear time lag, and a phase-difference bracket
//     calls out φ between the corresponding peaks.

const SCENE_DURATION = 58;

const NARRATION = [
  /*  0.00– 6.00 */ "An AC source can deliver volt-amps that never become watts. So where does the power go?",
  /*  6.00–18.00 */ "Drive a reactive load with a sinusoidal voltage. The current rises and falls at the same frequency, but its peaks arrive a quarter cycle late. The phase angle between the two is phi.",
  /* 18.00–30.00 */ "Project the current onto V and you get the in-phase part, which carries real power P. Project it perpendicular and you get the quadrature part, which carries reactive power Q. They live at right angles to each other.",
  /* 30.00–44.00 */ "Now sweep phi from zero to ninety degrees. The hypotenuse stays the same length — that is apparent power S. Real power P shrinks; reactive power Q grows. The power factor cos phi falls from one to zero.",
  /* 44.00–50.00 */ "Utilities bill for apparent power. Real power lights the room; reactive power just sloshes back and forth through the wires. That is why power factor correction is worth money.",
];

const NARRATION_AUDIO = 'audio/power-triangle/scene.mp3';

function Scene() {
  return (
    <SceneChrome
      eyebrow="ac power"
      title="The Power Triangle: Why Not Every Volt-Amp Becomes a Watt"
      duration={SCENE_DURATION}
      introEnd={5.43}
      introCaption="Not every volt-amp does work. So what is the rest doing?"
    >
      <SceneNarration src={NARRATION_AUDIO} />

      <Sprite start={5.43} end={17.04}>
        <WaveformBeat />
      </Sprite>

      <Sprite start={17.04} end={30.84}>
        <DecomposeBeat />
      </Sprite>

      <Sprite start={30.84} end={45.56}>
        <SweepPhiBeat />
      </Sprite>

      <Sprite start={45.56} end={SCENE_DURATION}>
        <TakeawayBeat />
      </Sprite>
    </SceneChrome>
  );
}

// ─── Shared helpers ──────────────────────────────────────────────────────
function sampleSine(fn, x0, yBaseline, width, amplitude, samples = 160) {
  const pts = [];
  for (let i = 0; i <= samples; i++) {
    const u = i / samples;
    const x = x0 + u * width;
    const y = yBaseline - fn(u) * amplitude;
    pts.push(`${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

// Small arrow-tip path on a vector ending at (x,y) coming from (x0,y0).
function arrowHeadPath(x0, y0, x, y, size = 9) {
  const dx = x - x0, dy = y - y0;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;
  // perpendicular
  const px = -uy, py = ux;
  const baseX = x - ux * size;
  const baseY = y - uy * size;
  const halfW = size * 0.55;
  return `M ${x} ${y} L ${(baseX + px * halfW).toFixed(2)} ${(baseY + py * halfW).toFixed(2)} L ${(baseX - px * halfW).toFixed(2)} ${(baseY - py * halfW).toFixed(2)} Z`;
}

// ─── Beat 2: Waveforms — V leads, I lags by φ ────────────────────────────
function WaveformBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.6;
  const TRACE_DUR = Math.max(spriteDur - HOLD - 2.5, 1);
  const traceFrac = clamp((localTime - HOLD) / TRACE_DUR, 0, 1);

  const CYCLES = 2;
  const PHI = Math.PI / 3;             // 60° — generous so the lag is visible
  const phiPx_per_cycle_frac = PHI / (2 * Math.PI);

  const G = portrait
    ? { vbW: 600, vbH: 720,
        panelX: 60, panelW: 480,
        vY0: 90, vH: 230, iY0: 380, iH: 230,
        captionY: 695, fontEyebrow: 10, fontLabel: 13 }
    : { vbW: 1100, vbH: 440,
        panelX: 80, panelW: 940,
        vY0: 40, vH: 160, iY0: 240, iH: 160,
        captionY: 420, fontEyebrow: 11, fontLabel: 14 };

  const vBase = G.vY0 + G.vH / 2;
  const iBase = G.iY0 + G.iH / 2;
  const amp = (G.vH / 2) * 0.82;

  const vD = sampleSine((u) => Math.sin(2 * Math.PI * CYCLES * u),
                        G.panelX, vBase, G.panelW, amp);
  const iD = sampleSine((u) => Math.sin(2 * Math.PI * CYCLES * u - PHI),
                        G.panelX, iBase, G.panelW, amp);

  // x-coords of the first V peak and the first I peak so we can drop a
  // φ-bracket between them.
  // V peak: 2π·CYCLES·u = π/2 → u = 1/(4·CYCLES). First peak.
  const uVpeak = 1 / (4 * CYCLES);
  // I peak: 2π·CYCLES·u − φ = π/2 → u = (π/2 + φ)/(2π·CYCLES) = 1/(4·CYCLES) + phiPx_per_cycle_frac/CYCLES
  const uIpeak = uVpeak + phiPx_per_cycle_frac / CYCLES;
  const xVpeak = G.panelX + uVpeak * G.panelW;
  const xIpeak = G.panelX + uIpeak * G.panelW;

  // Cursor for highlighting (only visible while drawing).
  const cursorX = G.panelX + G.panelW * traceFrac;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Eyebrows */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <text x={G.panelX} y={G.vY0 - 12}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">V(t)</text>
          <text x={G.panelX} y={G.iY0 - 12}
                fill="var(--amber-300)" fontFamily="var(--font-mono)"
                fontSize={G.fontEyebrow} letterSpacing="0.16em">I(t)</text>
        </SvgFadeIn>

        {/* Panel frames */}
        <SvgFadeIn duration={0.4} delay={0.15}>
          <rect x={G.panelX} y={G.vY0} width={G.panelW} height={G.vH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.42}/>
          <line x1={G.panelX} y1={vBase} x2={G.panelX + G.panelW} y2={vBase}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>
          <rect x={G.panelX} y={G.iY0} width={G.panelW} height={G.iH}
                fill="none" stroke="var(--chalk-300)" strokeWidth={1}
                strokeDasharray="3 3" opacity={0.42}/>
          <line x1={G.panelX} y1={iBase} x2={G.panelX + G.panelW} y2={iBase}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.7}/>
        </SvgFadeIn>

        {/* Traces */}
        <TraceIn d={vD}
          stroke="var(--chalk-100)" strokeWidth={2.2}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}/>
        <TraceIn d={iD}
          stroke="var(--amber-300)" strokeWidth={2.4}
          duration={TRACE_DUR} delay={HOLD} pathLength={1000}/>

        {/* Cursor while drawing */}
        {traceFrac > 0 && traceFrac < 1 && (
          <line x1={cursorX} y1={G.vY0}
                x2={cursorX} y2={G.iY0 + G.iH}
                stroke="var(--rose-300)" strokeWidth={1.2}
                strokeDasharray="4 4" opacity={0.7}/>
        )}

        {/* φ bracket between first V peak and first I peak.
            Drawn between the two panels, fading in after the traces. */}
        <SvgFadeIn duration={0.4} delay={HOLD + TRACE_DUR + 0.2}>
          {(() => {
            const yBracket = (vBase + iBase) / 2;
            return (
              <g>
                {/* Vertical drops from V peak and I peak to the bracket line */}
                <line x1={xVpeak} y1={vBase - amp}
                      x2={xVpeak} y2={yBracket}
                      stroke="var(--rose-300)" strokeWidth={1.4}
                      strokeDasharray="3 3" opacity={0.85}/>
                <line x1={xIpeak} y1={iBase - amp}
                      x2={xIpeak} y2={yBracket}
                      stroke="var(--rose-300)" strokeWidth={1.4}
                      strokeDasharray="3 3" opacity={0.85}/>
                {/* Bracket line */}
                <line x1={xVpeak} y1={yBracket} x2={xIpeak} y2={yBracket}
                      stroke="var(--rose-400)" strokeWidth={2}/>
                {/* End ticks */}
                <line x1={xVpeak} y1={yBracket - 5} x2={xVpeak} y2={yBracket + 5}
                      stroke="var(--rose-400)" strokeWidth={2}/>
                <line x1={xIpeak} y1={yBracket - 5} x2={xIpeak} y2={yBracket + 5}
                      stroke="var(--rose-400)" strokeWidth={2}/>
                {/* φ label centred above the bracket */}
                <text x={(xVpeak + xIpeak) / 2} y={yBracket - 10} textAnchor="middle"
                      fill="var(--rose-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={portrait ? 18 : 22}>φ</text>
              </g>
            );
          })()}
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={HOLD + TRACE_DUR + 0.8}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">
            {portrait
              ? 'current lags voltage by phase φ'
              : 'the current peaks a phase angle φ after the voltage peaks'}
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 3: Decompose the current into P and Q parts ────────────────────
function DecomposeBeat() {
  const portrait = usePortrait();
  // Fixed phase angle for this beat (matches the lag shown in beat 2)
  const PHI = Math.PI / 3;  // 60°

  const G = portrait
    ? { vbW: 600, vbH: 740,
        origX: 300, origY: 360, R: 210,
        fontMain: 18, fontLabel: 14, capRowY: 600, captionY: 710 }
    : { vbW: 1100, vbH: 520,
        origX: 380, origY: 260, R: 210,
        fontMain: 20, fontLabel: 15, capRowY: 430, captionY: 495 };

  // V phasor: horizontal, along +x axis
  const vTipX = G.origX + G.R;
  const vTipY = G.origY;
  // I phasor: at angle −φ from +x (lagging)
  const iTipX = G.origX + Math.cos(-PHI) * G.R;
  const iTipY = G.origY + Math.sin(-PHI) * G.R;   // below the axis (lag)
  // Foot of perpendicular from I onto V (in-phase projection)
  const projX = G.origX + Math.cos(-PHI) * G.R;   // = iTipX in plane angle, but project to x-axis
  const projXOnV = G.origX + G.R * Math.cos(PHI); // length cos φ along +x
  const projYOnV = G.origY;
  // Quadrature component endpoint (vertical from foot of perpendicular)
  const quadEndX = projXOnV;
  const quadEndY = G.origY - G.R * Math.sin(PHI); // ABOVE axis? Reactive Q is downward for lagging current actually
  // For a lagging current (inductive), reactive power Q is positive and conventionally drawn
  // as +Q vertical UP from P. Real power P is +x. So in the power triangle (not the I-V phasor
  // diagram), P is along +x and Q is along +y. We'll draw the power triangle elsewhere.

  return (
    <div style={{
      position: 'absolute', left: '50%', top: portrait ? '46%' : '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Coordinate axes */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.origX - G.R * 0.2} y1={G.origY}
                x2={G.origX + G.R * 1.15} y2={G.origY}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.55}/>
          <line x1={G.origX} y1={G.origY - G.R * 0.9}
                x2={G.origX} y2={G.origY + G.R * 0.9}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.55}/>
        </SvgFadeIn>

        {/* V phasor — horizontal */}
        <SvgFadeIn duration={0.4} delay={0.3}>
          <line x1={G.origX} y1={G.origY} x2={vTipX} y2={vTipY}
                stroke="var(--chalk-100)" strokeWidth={3}/>
          <path d={arrowHeadPath(G.origX, G.origY, vTipX, vTipY, 10)}
                fill="var(--chalk-100)"/>
          <text x={vTipX + 16} y={vTipY + 6}
                fill="var(--chalk-100)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>V</text>
        </SvgFadeIn>

        {/* I phasor — at −φ from V */}
        <SvgFadeIn duration={0.4} delay={1.0}>
          <line x1={G.origX} y1={G.origY} x2={iTipX} y2={iTipY}
                stroke="var(--amber-400)" strokeWidth={3}/>
          <path d={arrowHeadPath(G.origX, G.origY, iTipX, iTipY, 10)}
                fill="var(--amber-400)"/>
          <text x={iTipX + 12} y={iTipY + 18}
                fill="var(--amber-300)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontMain}>I</text>
        </SvgFadeIn>

        {/* φ arc inside the wedge V↔I */}
        <SvgFadeIn duration={0.4} delay={1.6}>
          {(() => {
            const arcR = 50;
            const startX = G.origX + arcR;
            const startY = G.origY;
            const endX = G.origX + Math.cos(-PHI) * arcR;
            const endY = G.origY + Math.sin(-PHI) * arcR;
            return (
              <g>
                <path d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 0 0 ${endX} ${endY}`}
                      fill="none" stroke="var(--rose-300)" strokeWidth={1.6}/>
                <text x={G.origX + arcR * 0.72} y={G.origY - arcR * 0.05}
                      fill="var(--rose-300)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={G.fontMain - 2}>φ</text>
              </g>
            );
          })()}
        </SvgFadeIn>

        {/* Drop perpendicular from I tip to V axis: the foot is at (projXOnV, origY).
            That length along V is the in-phase part (I cos φ). */}
        <SvgFadeIn duration={0.4} delay={2.2}>
          <line x1={iTipX} y1={iTipY} x2={projXOnV} y2={projYOnV}
                stroke="var(--teal-400)" strokeWidth={1.6}
                strokeDasharray="4 4" opacity={0.85}/>
          {/* The in-phase part along V */}
          <line x1={G.origX} y1={G.origY} x2={projXOnV} y2={projYOnV}
                stroke="var(--teal-400)" strokeWidth={4} opacity={0.95}/>
          {/* Label sits ~75% of the way from origin to the projection foot
              so it clears the φ-arc label that lives near the origin. */}
          <text x={G.origX + (projXOnV - G.origX) * 0.75} y={G.origY - 12} textAnchor="middle"
                fill="var(--teal-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            I cos φ
          </text>
        </SvgFadeIn>

        {/* Quadrature part — same magnitude as I sin φ, drawn as a vector
            from the foot of perpendicular DOWN to the I tip (since current lags
            it lives below the axis). */}
        <SvgFadeIn duration={0.4} delay={3.0}>
          <line x1={projXOnV} y1={projYOnV} x2={iTipX} y2={iTipY}
                stroke="var(--violet-400)" strokeWidth={4} opacity={0.95}/>
          <text x={projXOnV + 14} y={(projYOnV + iTipY) / 2 + 4}
                fill="var(--violet-400)" fontFamily="var(--font-serif)"
                fontStyle="italic" fontSize={G.fontLabel}>
            I sin φ
          </text>
        </SvgFadeIn>

        {/* Three formulas across the bottom — real / reactive / apparent */}
        <SvgFadeIn duration={0.4} delay={4.0}>
          {(() => {
            const yRow = G.capRowY;
            const colWidth = G.vbW / 3;
            const items = [
              { x: colWidth * 0.5, label: 'P  =  V · I cos φ', sub: 'real · watts',     color: 'var(--teal-400)' },
              { x: colWidth * 1.5, label: 'Q  =  V · I sin φ', sub: 'reactive · vars',  color: 'var(--violet-400)' },
              { x: colWidth * 2.5, label: 'S  =  V · I',        sub: 'apparent · VA',    color: 'var(--amber-300)' },
            ];
            return items.map((it, i) => (
              <g key={i}>
                <text x={it.x} y={yRow} textAnchor="middle"
                      fill={it.color} fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={G.fontMain}>{it.label}</text>
                <text x={it.x} y={yRow + 22} textAnchor="middle"
                      fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                      fontSize={11} letterSpacing="0.14em">{it.sub.toUpperCase()}</text>
              </g>
            ));
          })()}
        </SvgFadeIn>

        {/* Caption */}
        <SvgFadeIn duration={0.4} delay={5.5}>
          <text x={G.vbW / 2} y={G.captionY} textAnchor="middle"
                fill="var(--chalk-300)" fontFamily="var(--font-sans)"
                fontSize={G.fontLabel} letterSpacing="0.02em">
            in-phase carries the watts; perpendicular just sloshes
          </text>
        </SvgFadeIn>
      </svg>
    </div>
  );
}

// ─── Beat 4: Sweep φ — power triangle morphs ─────────────────────────────
// Triangle wave over the sprite: φ ramps 5° → 85° → 5°. Each frame we
// compute (P, Q, S, cos φ) from φ and redraw the triangle. The hypotenuse
// length |S| is fixed; only its angle changes. The "motor analogy" label
// appears at low power factor (cos φ < 0.5).
function SweepPhiBeat() {
  const portrait = usePortrait();
  const { localTime, duration: spriteDur } = useSprite();

  const HOLD = 0.6;
  const SWEEP_DUR = Math.max(spriteDur - HOLD - 1.4, 1);
  const u = clamp((localTime - HOLD) / SWEEP_DUR, 0, 1);
  // Triangle wave 0..1..0
  const tri = u < 0.5 ? (u * 2) : (2 - u * 2);
  const PHI_MIN_DEG = 5;
  const PHI_MAX_DEG = 85;
  const phiDeg = PHI_MIN_DEG + (PHI_MAX_DEG - PHI_MIN_DEG) * Easing.easeInOutCubic(tri);
  const phi = phiDeg * Math.PI / 180;

  // Normalised triangle: |S| = 1 (in arbitrary VA units). Choose a pixel
  // scale R so the hypotenuse fits the canvas.
  const G = portrait
    ? { vbW: 600, vbH: 720,
        origX: 130, origY: 460, R: 360,
        panelX: 80, panelY: 540, panelW: 440, panelH: 170,
        fontMain: 18, fontLabel: 14 }
    : { vbW: 1100, vbH: 460,
        origX: 220, origY: 360, R: 320,
        panelX: 700, panelY: 80, panelW: 380, panelH: 320,
        fontMain: 20, fontLabel: 15 };

  const S = 1;
  const P = S * Math.cos(phi);
  const Q = S * Math.sin(phi);
  const Px = G.origX + P * G.R;          // along +x
  const Py = G.origY;
  const Sx = Px;
  const Sy = G.origY - Q * G.R;          // S tip: above and to the right
  // (P horizontal from origin; Q vertical UP from (Px,Py); S hypotenuse from origin to Sx,Sy)

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <svg width={G.vbW} height={G.vbH} viewBox={`0 0 ${G.vbW} ${G.vbH}`}
           style={{ overflow: 'visible' }}>
        {/* Axes — faint */}
        <SvgFadeIn duration={0.4} delay={0.0}>
          <line x1={G.origX - 10} y1={G.origY}
                x2={G.origX + G.R + 60} y2={G.origY}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.45}/>
          <line x1={G.origX} y1={G.origY + 10}
                x2={G.origX} y2={G.origY - G.R - 24}
                stroke="var(--chalk-300)" strokeWidth={1} opacity={0.45}/>
          <text x={G.origX + G.R + 14} y={G.origY + 5}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">REAL P</text>
          <text x={G.origX + 8} y={G.origY - G.R - 16}
                fill="var(--chalk-300)" fontFamily="var(--font-mono)"
                fontSize={11} letterSpacing="0.14em">REACTIVE Q</text>
        </SvgFadeIn>

        {/* Reference circle — fixed |S|=1 hypotenuse traces a quarter-circle */}
        <SvgFadeIn duration={0.5} delay={0.4}>
          <path d={`M ${G.origX + G.R} ${G.origY} A ${G.R} ${G.R} 0 0 0 ${G.origX} ${G.origY - G.R}`}
                fill="none" stroke="var(--amber-300)" strokeWidth={1}
                strokeDasharray="4 4" opacity={0.4}/>
        </SvgFadeIn>

        {/* Triangle edges (recompute each frame) */}
        {/* P leg — horizontal, teal */}
        <line x1={G.origX} y1={G.origY} x2={Px} y2={Py}
              stroke="var(--teal-400)" strokeWidth={4}/>
        <path d={arrowHeadPath(G.origX, G.origY, Px, Py, 10)} fill="var(--teal-400)"/>
        {/* Q leg — vertical, violet */}
        <line x1={Px} y1={Py} x2={Sx} y2={Sy}
              stroke="var(--violet-400)" strokeWidth={4}/>
        <path d={arrowHeadPath(Px, Py, Sx, Sy, 10)} fill="var(--violet-400)"/>
        {/* S hypotenuse — amber */}
        <line x1={G.origX} y1={G.origY} x2={Sx} y2={Sy}
              stroke="var(--amber-400)" strokeWidth={4}/>
        <path d={arrowHeadPath(G.origX, G.origY, Sx, Sy, 12)} fill="var(--amber-400)"/>

        {/* Edge labels — placed outside each edge */}
        <text x={(G.origX + Px) / 2} y={G.origY + 22} textAnchor="middle"
              fill="var(--teal-400)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.fontMain}>P</text>
        <text x={Px + 14} y={(Py + Sy) / 2 + 4}
              fill="var(--violet-400)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.fontMain}>Q</text>
        <text x={(G.origX + Sx) / 2 - 22} y={(G.origY + Sy) / 2 - 6} textAnchor="end"
              fill="var(--amber-300)" fontFamily="var(--font-serif)"
              fontStyle="italic" fontSize={G.fontMain}>S</text>

        {/* φ arc inside the wedge */}
        {(() => {
          const arcR = 46;
          const ex = G.origX + Math.cos(-phi) * arcR;   // mirrored across x-axis? No: φ in power triangle is angle FROM +x axis, going UP. So we want arc from +x going COUNTER-clockwise UP by phi.
          // In SVG y-down coords, going UP means y decreases. The triangle S tip is above the axis (Sy < origY). So φ is the angle from +x rotated towards −y.
          // For drawing the arc, end point at angle (−φ) from +x in screen coords (y-down):
          const startX = G.origX + arcR;
          const startY = G.origY;
          const endX = G.origX + Math.cos(-phi) * arcR;
          const endY = G.origY + Math.sin(-phi) * arcR;
          return (
            <g>
              <path d={`M ${startX} ${startY} A ${arcR} ${arcR} 0 0 0 ${endX} ${endY}`}
                    fill="none" stroke="var(--rose-300)" strokeWidth={1.6}/>
              <text x={G.origX + arcR * 0.72} y={G.origY - arcR * 0.04}
                    fill="var(--rose-300)" fontFamily="var(--font-serif)"
                    fontStyle="italic" fontSize={G.fontMain - 2}>φ</text>
            </g>
          );
        })()}

        {/* Live readout panel */}
        <SvgFadeIn duration={0.4} delay={0.4}>
          <rect x={G.panelX} y={G.panelY} width={G.panelW} height={G.panelH}
                rx={10} fill="rgba(244,184,96,0.05)"
                stroke="rgba(232,220,193,0.10)" strokeWidth={1}/>
          {(() => {
            const rows = [
              { label: 'φ',      val: `${phiDeg.toFixed(0)}°`,        col: 'var(--rose-300)' },
              { label: 'P / S',  val: P.toFixed(2),                     col: 'var(--teal-400)' },
              { label: 'Q / S',  val: Q.toFixed(2),                     col: 'var(--violet-400)' },
              { label: 'cos φ',  val: Math.cos(phi).toFixed(2),         col: 'var(--amber-300)' },
            ];
            const rowH = (G.panelH - 28) / rows.length;
            return rows.map((r, i) => (
              <g key={i}>
                <text x={G.panelX + 22} y={G.panelY + 28 + i * rowH + 4}
                      fill="var(--chalk-200)" fontFamily="var(--font-serif)"
                      fontStyle="italic" fontSize={G.fontLabel + 2}>{r.label}</text>
                <text x={G.panelX + G.panelW - 22} y={G.panelY + 28 + i * rowH + 4}
                      textAnchor="end"
                      fill={r.col} fontFamily="var(--font-mono)"
                      fontSize={G.fontLabel + 4}>{r.val}</text>
              </g>
            ));
          })()}
        </SvgFadeIn>

        {/* Motor analogy callout — only when PF < 0.5 (highly reactive).
            Parked below the +x axis where the canvas is empty in both
            aspects, so it never collides with the REACTIVE-Q axis label
            or the triangle itself. */}
        {Math.cos(phi) < 0.5 && (
          <SvgFadeIn duration={0.4} delay={0.0}>
            <text x={G.origX + G.R / 2} y={G.origY + 46}
                  textAnchor="middle"
                  fill="var(--rose-300)" fontFamily="var(--font-sans)"
                  fontSize={G.fontLabel} fontStyle="italic">
              like a motor idling — current flows, little work is done
            </text>
          </SvgFadeIn>
        )}
      </svg>
    </div>
  );
}

// ─── Beat 5: Takeaway ────────────────────────────────────────────────────
function TakeawayBeat() {
  const portrait = usePortrait();
  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18,
    }}>
      <FadeUp duration={0.6} delay={0.3} distance={14}
        style={{
          fontFamily: 'var(--font-serif)', fontStyle: 'italic',
          fontSize: portrait ? 26 : 40, color: 'var(--amber-300)',
          letterSpacing: '0.02em',
          whiteSpace: 'nowrap',
        }}>
        S² = P² + Q²   ·   cos φ = P/S
      </FadeUp>

      <FadeUp duration={0.5} delay={1.6} distance={10}
        style={{
          fontFamily: 'var(--font-sans)', fontSize: portrait ? 14 : 16,
          color: 'var(--chalk-100)',
          maxWidth: portrait ? '22ch' : '46ch', lineHeight: 1.45,
          textAlign: 'center', marginTop: 4,
        }}>
        improve the power factor — shrink the apparent power for the same watts
      </FadeUp>

      <FadeUp duration={0.5} delay={3.0} distance={8}
        style={{
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: 'var(--chalk-300)', letterSpacing: '0.12em',
          marginTop: 10, maxWidth: portrait ? '32ch' : 'none',
          textAlign: 'center',
        }}>
        utilities bill VA — engineers chase the watts
      </FadeUp>
    </div>
  );
}

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
